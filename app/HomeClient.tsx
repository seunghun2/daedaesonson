'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { Box, Flex, useMantineTheme, TextInput, Group, Text, ThemeIcon, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Search, MapPin, Building, MessageCircle, Clock, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// 🚀 지도 컴포넌트 지연 로딩 (초기 JS 번들에서 분리)
const NaverMap = dynamic(() => import('@/components/map/NaverMap'), {
  ssr: false,
  loading: () => (
    <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
      <Text c="dimmed" size="sm">지도 로딩 중...</Text>
    </Box>
  ),
});
import type { NaverMapRef } from '@/components/map/NaverMap';
import FacilityList from '@/components/list/FacilityList';
import FilterBar from '@/components/list/FilterBar';
import FacilityDetail from '@/components/detail/FacilityDetail';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';

import { searchRegions, RegionResult } from '@/lib/regionSearch';
import BottomNav from '@/components/common/BottomNav';

// Helper Component for highlighting text
function HighlightText({ text, highlight }: { text: string, highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <Text span size="sm">
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text span key={i} c="#1D0098" fw={700}>{part}</Text>
        ) : (
          <Text span key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

interface HomeClientProps {
  initialFacilities: Facility[];
}

function HomeContent({ initialFacilities }: HomeClientProps) {
  const theme = useMantineTheme();
  // isMobile: 초기값 true로 설정하여 모바일 레이아웃 먼저 표시 (모바일에서 깜빡임 방지)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, true);

  // 지도 컨트롤 Ref
  const mapRef = useRef<NaverMapRef>(null);

  // Router hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 상태 관리
  const [activeCategory, setActiveCategory] = useState<string[]>(['all']);
  const [institutionFilter, setInstitutionFilter] = useState<'all' | 'public' | 'private'>('all'); // 공설/사설 필터
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [sortBy, setSortBy] = useState('rating');

  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState(''); // 엔터 친 검색어
  const [searchFocused, setSearchFocused] = useState(false); // 검색창 포커스 여부

  // 지역 선택 모드인지 여부 (텍스트 필터링 건너뛰기 위함)
  const [isRegionSelected, setIsRegionSelected] = useState(false);

  // 자동완성 결과 상태
  const [completionResults, setCompletionResults] = useState<{
    regions: RegionResult[];
    facilities: Facility[];
  }>({ regions: [], facilities: [] });

  // 🔍 최근 검색어 상태
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // localStorage에서 최근 검색어 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('recentSearches');
        if (saved) setRecentSearches(JSON.parse(saved));
      } catch { }
    }
  }, []);

  // 최근 검색어 저장 함수
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch { }
  };

  // 🗺️ 지역 데이터 미리 로드 (첫 검색 시 좌표 오류 방지)
  useEffect(() => {
    import('@/lib/regionSearch').then(mod => {
      mod.ensureRegionDataLoaded();
    });
  }, []);

  // 🚀 SSR로 미리 로드된 데이터 사용 (API fetch 없음!)
  const [dbFacilities, setDbFacilities] = useState<Facility[]>(() => {
    // 캐시에도 저장 (list 페이지에서 사용)
    if (typeof window !== 'undefined' && initialFacilities.length > 0) {
      sessionStorage.setItem('facilitiesCache', JSON.stringify(initialFacilities));
    }
    return initialFacilities;
  });
  const [isLoading, setIsLoading] = useState(false); // 이미 로드됨

  // 현재 지도 좌표
  const [currentBounds, setCurrentBounds] = useState<{ south: number, north: number, west: number, east: number } | null>(null);
  const [currentRegionName, setCurrentRegionName] = useState<string>(''); // 현재 지역명

  // UI 숨김 상태 (지도 탭 시 토글) - 호갱노노 스타일
  const [uiHidden, setUiHidden] = useState(false);

  // 검색창 롤링 placeholder
  const placeholderTexts = ['서울 봉안당', '경기 수목장', '부산 공원묘지', '대전 납골당', '인천 자연장'];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // 📊 GA4: 홈페이지 페이지뷰
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: '홈 - 지도',
        page_location: window.location.href,
        page_path: '/'
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync URL with State (activeFacilityId)
  useEffect(() => {
    const facilityId = searchParams.get('id');
    if (facilityId && dbFacilities.length > 0) {
      // 🚀 1단계: 로컬 데이터로 즉시 표시 (0ms)
      if (!selectedFacility || selectedFacility.id !== facilityId) {
        const localFac = dbFacilities.find(f => f.id === facilityId);
        if (localFac) {
          setSelectedFacility(localFac);
        }
      }

      // 🚀 2단계: 백그라운드에서 API 상세 데이터 보강 (리뷰, 문의 등)
      fetch(`/api/facilities/${facilityId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            setSelectedFacility(data);
          }
        })
        .catch(() => {
          // API 실패해도 로컬 데이터로 이미 표시 중이니 무시
        });
    } else if (!facilityId) {
      setSelectedFacility(null);
    }
  }, [searchParams, dbFacilities, pathname, router]);

  // Debounced handler - 자동완성용 (지역 이동은 엔터/클릭에서만!)
  // Note: 이제 여기서는 submittedQuery 설정 안 함

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value); // Input UI updates immediately
    setIsRegionSelected(false); // Typing means not a region selection
    // submittedQuery는 엔터 치거나 자동완성 클릭할 때만 설정!
  };

  // 자동완성 로직
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCompletionResults({ regions: [], facilities: [] });
      return;
    }

    const query = searchQuery.trim().toLowerCase().normalize('NFC');

    // 1. Facility Search
    const facMatches = dbFacilities.filter(f =>
      f.name.toLowerCase().normalize('NFC').includes(query) ||
      f.address.toLowerCase().normalize('NFC').includes(query)
    ).slice(0, 5);

    // 2. Region Search
    const fetchRegions = async () => {
      try {
        const regMatches = await searchRegions(query);
        setCompletionResults({
          regions: regMatches.slice(0, 5),
          facilities: facMatches
        });
      } catch (e) {
        setCompletionResults({ regions: [], facilities: facMatches });
      }
    };

    const timer = setTimeout(fetchRegions, 400); // 400ms for stable autocomplete
    return () => clearTimeout(timer);
  }, [searchQuery, dbFacilities]);

  // 검색(엔터) 시 해당 지역/시설 중심으로 지도 이동
  useEffect(() => {
    if (!submittedQuery.trim() || !mapRef.current) return;
    const query = submittedQuery.trim();

    // 1. 지역 검색
    const regionInfo = mapRef.current.searchRegion(query);
    if (regionInfo) {
      mapRef.current.highlightRegion(regionInfo.lat, regionInfo.lng, regionInfo.zoom, regionInfo.type, regionInfo.name);
      if (isMobile) setMobileView('map');
      return;
    }

    // 2. 시설 검색 (최소 2글자 이상)
    if (query.length < 2) {
      console.log('검색어가 너무 짧음 (2글자 미만)');
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = dbFacilities.filter(f =>
      f.name.toLowerCase().includes(lowerQuery) ||
      f.address.toLowerCase().includes(lowerQuery)
    );

    if (matches.length > 0) {
      const validCoords = matches.filter(f => f.coordinates).map(f => f.coordinates!);
      if (validCoords.length > 0) {
        const avgLat = validCoords.reduce((sum, c) => sum + c.lat, 0) / validCoords.length;
        const avgLng = validCoords.reduce((sum, c) => sum + c.lng, 0) / validCoords.length;
        const zoomLevel = matches.length === 1 ? 16 : 13;
        mapRef.current.panTo(avgLat, avgLng, zoomLevel);
        if (isMobile) setMobileView('map');
      }
    }
  }, [submittedQuery, dbFacilities, isMobile]);


  // 지도 이동 핸들러
  const handleBoundsChanged = (bounds: { south: number, north: number, west: number, east: number }) => {
    setCurrentBounds(bounds);
  };

  // 1. 지도에 표시할 데이터 (Bound 변경에 영향받지 않음 -> 마커 리렌더링 방지)
  // 🚫 검색어로 마커가 사라지지 않도록 - 카테고리만 필터링
  const filteredMapFacilities = useMemo(() => {
    let base = dbFacilities;

    // 0. 마커 off된 시설 제외 (어드민에서 isActive: false 설정)
    base = base.filter(f => f.isActive !== false);

    // 0-1. 장례식장 기본 제외
    base = base.filter(f => f.category !== 'FUNERAL_HOME');

    // 1. 카테고리 (다중 선택)
    if (!activeCategory.includes('all')) {
      const catMap: Record<string, string> = {
        'charnel': 'CHARNEL_HOUSE',
        'natural': 'NATURAL_BURIAL',
        'park': 'FAMILY_GRAVE'
      };
      const selectedDbCategories = activeCategory
        .filter(c => catMap[c])
        .map(c => catMap[c]);
      if (selectedDbCategories.length > 0) {
        base = base.filter(f => selectedDbCategories.includes(f.category));
      }
    }

    // 2. 공설/사설 필터
    if (institutionFilter !== 'all') {
      base = base.filter(f => {
        if (institutionFilter === 'public') {
          return f.isPublic === true;
        } else if (institutionFilter === 'private') {
          return f.isPublic === false;
        }
        return true;
      });
    }

    // ❌ 검색어 필터링 제거 - 마커는 항상 표시되어야 함

    return base;
  }, [dbFacilities, activeCategory, institutionFilter]);

  // 2. 리스트에 표시할 데이터 (지도 데이터 + 현재 Viewport filtering + 정렬)
  const finalFacilities = useMemo(() => {
    // mapFacilities 중에서 currentBounds 내에 있는 것만 필터링
    let base = filteredMapFacilities;

    if (currentBounds) {
      base = base.filter(f =>
        f.coordinates &&
        f.coordinates.lat >= currentBounds.south &&
        f.coordinates.lat <= currentBounds.north &&
        f.coordinates.lng >= currentBounds.west &&
        f.coordinates.lng <= currentBounds.east
      );
    }

    // 3. 정렬
    return base.sort((a, b) => {
      if (sortBy === 'price') return (a.priceRange?.min ?? 9999) - (b.priceRange?.min ?? 9999);
      if (sortBy === 'review') return (b.reviewCount || 0) - (a.reviewCount || 0);
      return Number(b.rating || 0) - Number(a.rating || 0);
    });
  }, [filteredMapFacilities, currentBounds, sortBy]);

  // 현재 지역명은 NaverMap에서 onCenterAddressChange 콜백으로 받음

  // 검색 결과 선택 (시설)
  const handleSelectFacility = (facility: Facility) => {
    // Update URL to open detail modal (supports back button)
    const params = new URLSearchParams(searchParams.toString());
    params.set('id', facility.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });

    // Map movement logic
    if (mapRef.current && facility.coordinates) {
      mapRef.current.panTo(facility.coordinates.lat, facility.coordinates.lng, 17, facility.id);
      if (isMobile) setMobileView('map');
    }
    setSearchFocused(false);
    setSearchQuery(facility.name); // Update search input with selected facility name
    setSubmittedQuery(facility.name); // Also update submitted query
    saveRecentSearch(facility.name); // 최근 검색어 저장
  };

  // 검색 결과 선택 (지역)
  const handleSelectRegion = (region: RegionResult) => {
    console.log('🗺️ handleSelectRegion called:', {
      fullName: region.fullName,
      name: region.name,
      type: region.type,
      center: region.center
    });

    setSearchQuery(region.fullName);
    setSubmittedQuery(region.fullName); // Also update submitted query
    saveRecentSearch(region.fullName); // 최근 검색어 저장
    setIsRegionSelected(true);

    if (mapRef.current) {
      const zoom = region.type === 'gu' ? 12 : 14;
      console.log('🗺️ Calling highlightRegion with:', region.center.lat, region.center.lng, zoom);
      mapRef.current.highlightRegion(
        region.center.lat,
        region.center.lng,
        zoom,
        region.type,
        region.name
      );
    }
    setSearchFocused(false);
    if (isMobile) setMobileView('map');
  };

  const handleMarkerClick = (facility: Facility) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('id', facility.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    if (isMobile) setMobileView('map');

    // 📝 기록 저장
    try {
      const stored = localStorage.getItem('facilityHistory');
      let history = stored ? JSON.parse(stored) : [];
      // 중복 제거
      history = history.filter((h: any) => h.id !== facility.id);
      // 맨 앞에 추가
      history.unshift({
        id: facility.id,
        name: facility.name,
        address: facility.address,
        category: facility.category,
        minPrice: facility.priceRange?.min || 0,
        thumbnail: (facility as any).thumbnail || facility.imageGallery?.[0],
        visitedAt: Date.now(),
      });
      // 최대 20개
      history = history.slice(0, 20);
      localStorage.setItem('facilityHistory', JSON.stringify(history));
    } catch { }
  };

  const handleCloseDetail = () => {
    // 상세페이지 닫을 때 해당 시설 위치로 지도 이동
    if (selectedFacility?.coordinates && mapRef.current) {
      mapRef.current.panTo(selectedFacility.coordinates.lat, selectedFacility.coordinates.lng);
    }
    // Remove 'id' parameter from URL to close the detail view
    router.push(pathname, { scroll: false });
  };

  // 🎯 지도 탭 핸들러 - UI 숨김/표시 토글 (호갱노노 스타일)
  const handleMapTap = () => {
    // 🔍 검색 자동완성 창 닫기
    setSearchFocused(false);
    // 상세페이지가 열려있으면 무시
    if (selectedFacility) return;
    // 토글: UI 숨김 ↔ 표시
    setUiHidden(prev => !prev);
  };

  return (
    <Flex h="100dvh" className="home-container">

      {/* 1. 좌측 검색/필터/리스트 (PC: 400px, 모바일: 100%) - CSS로 초기 크기 결정 */}
      <Box
        className="home-sidebar"
        style={{
          flexShrink: 0,
          display: isMobile && mobileView === 'map' ? 'none' : 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1000,
          backgroundColor: 'white',
          borderRight: isMobile ? 'none' : '1px solid #e9ecef',
          // JS hydration 후 정확한 크기 적용
          ...(isMobile !== undefined && {
            width: isMobile ? '100%' : 400,
            height: isMobile ? (mobileView === 'list' ? '100%' : '50%') : '100%'
          })
        }}
      >
        {/* 검색창 및 카테고리 필터 */}
        <Box p="md" style={{ borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>


          <Group wrap="nowrap" align="center" mb="sm">
            {/* 모바일 목록뷰: 뒤로가기 버튼, PC/지도뷰: 로고 */}
            {isMobile && mobileView === 'list' ? (
              <button
                onClick={() => setMobileView('map')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  marginLeft: '-8px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#495057' }}>arrow_back</span>
              </button>
            ) : (
              <Link href="/" style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
                <Image
                  src="/logo-horizontal.svg?v=4"
                  alt="대대손손"
                  width={90}
                  height={26}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </Link>
            )}
            <Box style={{ flex: 1, position: 'relative' }}>
              <TextInput
                placeholder=""
                value={searchQuery}
                onChange={handleSearchInput}
                onKeyDown={(e) => {
                  // 한글 IME 조합 중이면 무시 (글자 중복 방지)
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission if in a form
                    setSubmittedQuery(searchQuery); // Trigger immediate search
                    setSearchFocused(false); // Close autocomplete
                    saveRecentSearch(searchQuery); // 최근 검색어 저장
                    (document.activeElement as HTMLElement)?.blur(); // Hide keyboard on mobile
                  }
                }}
                rightSection={
                  <ActionIcon
                    variant="transparent"
                    c={searchQuery ? 'brand.6' : 'gray.5'}
                    onClick={() => {
                      if (searchQuery) {
                        setSubmittedQuery(searchQuery);
                        setSearchFocused(false);
                        (document.activeElement as HTMLElement)?.blur();
                        // 📊 GA4: 검색 실행
                        if ((window as any).gtag) {
                          (window as any).gtag('event', 'search', {
                            search_term: searchQuery
                          });
                        }
                      }
                    }}
                  >
                    <Search size={18} />
                  </ActionIcon>
                }
                styles={{
                  input: {
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    fontSize: '16px' // iOS 자동 확대 방지
                  }
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 250)} // 250ms for mobile touch stability
              />
              {/* 롤링 Placeholder 오버레이 */}
              {!searchQuery && (
                <Box
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '12px',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    height: '20px',
                    width: '150px'
                  }}
                >
                  {/* 현재 텍스트 (위로 올라가며 사라짐) */}
                  <Box
                    key={placeholderIndex}
                    style={{
                      animation: 'slideUp 0.4s ease-out forwards',
                      color: '#adb5bd',
                      fontSize: '14px',
                      lineHeight: '20px'
                    }}
                  >
                    {placeholderTexts[placeholderIndex]}
                  </Box>
                </Box>
              )}
              <style>{`
                @keyframes slideUp {
                  0% { transform: translateY(100%); opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { transform: translateY(0); opacity: 1; }
                }
              `}</style>

              {/* 자동완성 목록 */}
              {searchFocused && searchQuery.trim() && (completionResults.regions.length > 0 || completionResults.facilities.length > 0) && (
                <Box
                  pos="absolute"
                  top="calc(100% + 8px)"
                  left={0}
                  w="100%"
                  bg="white"
                  style={{
                    zIndex: 2100, // 상세 페이지 헤더(1000)보다 높게 설정하여 가림 현상 해결
                    borderRadius: 12,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.05)',
                    border: '1px solid #f1f3f5',
                    overflow: 'hidden',
                    maxHeight: '500px', // Reverted to 500 for better view
                    overflowY: 'auto'
                  }}
                >
                  {/* Regions Section */}
                  {completionResults.regions.map((region, i) => (
                    <Box
                      key={`reg-${i}`}
                      px="md"
                      py={14} // Increased padding for better touch target
                      style={{ cursor: 'pointer', borderBottom: '1px solid #f8f9fa' }}
                      className="hover:bg-gray-50"
                      onClick={() => handleSelectRegion(region)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Text size="13px" c="dark.9" style={{ lineHeight: 1.4 }}>
                        <HighlightText text={region.fullName} highlight={searchQuery} />
                      </Text>
                    </Box>
                  ))}

                  {/* Divider if both exist */}
                  {completionResults.regions.length > 0 && completionResults.facilities.length > 0 && (
                    <Box h={1} bg="#f1f3f5" w="100%" />
                  )}

                  {/* Facilities Section */}
                  {completionResults.facilities.map((fac, index) => (
                    <Box
                      key={`fac-${fac.id}-${index}`}
                      px="md"
                      py={14} // Increased padding for better touch target
                      style={{
                        cursor: 'pointer',
                        borderBottom: index === completionResults.facilities.length - 1 ? 'none' : '1px solid #f8f9fa',
                        transition: 'background-color 0.2s'
                      }}
                      className="hover:bg-gray-50"
                      onClick={() => handleSelectFacility(fac)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Group justify="space-between" wrap="nowrap" align="center">
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" mb={2} c="dark.9" fw={500} style={{ lineHeight: 1.2 }}>
                            <HighlightText text={fac.name} highlight={searchQuery} />
                          </Text>
                          <Text size="10px" c="dimmed" truncate style={{ lineHeight: 1.2 }}>
                            <HighlightText text={fac.address} highlight={searchQuery} />
                          </Text>
                        </Box>
                        <Text
                          size="11px"
                          c="gray.6"
                          style={{
                            whiteSpace: 'nowrap',
                            backgroundColor: '#f8f9fa',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}
                        >
                          {FACILITY_CATEGORY_LABELS[fac.category]}
                        </Text>
                      </Group>
                    </Box>
                  ))}
                </Box>
              )}

              {/* 🔍 최근 검색어 (검색어 없고 포커스 상태일 때) */}
              {searchFocused && !searchQuery.trim() && recentSearches.length > 0 && (
                <Box
                  pos="absolute"
                  top="calc(100% + 8px)"
                  left={0}
                  w="100%"
                  bg="white"
                  style={{
                    zIndex: 2100,
                    borderRadius: 12,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.05)',
                    border: '1px solid #f1f3f5',
                    overflow: 'hidden'
                  }}
                >
                  <Box px="md" py="xs" bg="gray.0">
                    <Text size="xs" c="dimmed" fw={500}>최근 검색</Text>
                  </Box>
                  {recentSearches.map((query, i) => (
                    <Box
                      key={`recent-${i}`}
                      px="md"
                      py={12}
                      style={{ cursor: 'pointer', borderBottom: i === recentSearches.length - 1 ? 'none' : '1px solid #f8f9fa' }}
                      className="hover:bg-gray-50"
                      onClick={() => {
                        setSearchQuery(query);
                        setSubmittedQuery(query);
                        setSearchFocused(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Text size="sm" c="dark.7" truncate>{query}</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Group>

          {/* PC 필터 버튼 (다중 선택) */}
          <Group gap={6} mt="sm" align="center">
            {/* 전체 버튼 */}
            <button
              onClick={() => setActiveCategory(['all'])}
              style={{
                height: '34px',
                fontSize: '14px',
                fontWeight: activeCategory.includes('all') ? 700 : 500,
                backgroundColor: activeCategory.includes('all') ? '#1D0098' : 'white',
                color: activeCategory.includes('all') ? 'white' : '#495057',
                border: activeCategory.includes('all') ? 'none' : '1px solid #dee2e6',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}
            >
              전체
            </button>

            {/* 구분선 */}
            <div style={{ width: '1px', height: '20px', backgroundColor: '#dee2e6' }} />

            {/* 개별 카테고리 버튼들 */}
            {[
              { value: 'charnel', label: '봉안당' },
              { value: 'natural', label: '수목장' },
              { value: 'park', label: '공원묘지' }
            ].map(tab => {
              const isSelected = activeCategory.includes(tab.value);
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    if (activeCategory.includes('all')) {
                      setActiveCategory([tab.value]);
                    } else if (isSelected) {
                      const newCats = activeCategory.filter(c => c !== tab.value);
                      setActiveCategory(newCats.length === 0 ? ['all'] : newCats);
                    } else {
                      const newCats = [...activeCategory, tab.value];
                      if (newCats.length === 3) {
                        setActiveCategory(['all']);
                      } else {
                        setActiveCategory(newCats);
                      }
                    }
                  }}
                  style={{
                    height: '34px',
                    fontSize: '14px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? '#1D0098' : 'white',
                    color: isSelected ? 'white' : '#495057',
                    border: isSelected ? 'none' : '1px solid #dee2e6',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    paddingLeft: '16px',
                    paddingRight: '16px'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </Group>
        </Box>

        {/* 상세 보기 or 리스트 */}
        <Box flex={1} h="100%" style={{ position: 'relative', overflowY: 'auto' }}>
          {selectedFacility && !isMobile ? (
            <FacilityDetail
              facility={selectedFacility}
              onClose={handleCloseDetail}
              allFacilities={finalFacilities}
              onSelectFacility={(id) => {
                const fac = finalFacilities.find(f => f.id === id);
                if (fac) handleMarkerClick(fac);
              }}
              onMapView={(lat, lng) => {
                if (mapRef.current) {
                  mapRef.current.panTo(lat, lng, 17);
                }
              }}
            />
          ) : (
            <Flex direction="column" h="100%">
              <FilterBar sortBy={sortBy} setSortBy={setSortBy} totalCount={finalFacilities.length} institutionFilter={institutionFilter} setInstitutionFilter={setInstitutionFilter} regionName={currentRegionName} />
              <FacilityList
                facilities={finalFacilities}
                onFacilityClick={handleMarkerClick}
                selectedId={selectedFacility?.id}
              />
            </Flex>
          )}
        </Box>
      </Box>

      {/* 2. 우측 지도 (PC: 나머지 꽉 채움, 모바일: 100%인데 뷰모드에 따라 숨김) */}
      <Box
        flex={1}
        pos="relative"
        h="100%"
        style={{
          display: isMobile && mobileView === 'list' ? 'none' : 'block'
        }}
      >
        {/* 모바일 지도 모드 상단 헤더 오버레이 (UI 숨김 시 슬라이드 아웃) */}
        {isMobile && mobileView === 'map' && (
          <>
            {/* 상단 헤더 (UI 숨김 시 위로 슬라이드 아웃) */}
            <Box
              pos="absolute"
              top={0}
              left={0}
              w="100%"
              style={{
                zIndex: 1000,
                backgroundColor: '#1D0098', // 브랜드 컬러
                padding: '12px 16px',
                transform: uiHidden ? 'translateY(-100%)' : 'translateY(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Group wrap="nowrap" align="center" gap="sm">
                <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                  <Image
                    src="/logo-horizontal.svg?v=4"
                    alt="대대손손"
                    width={80}
                    height={22}
                    style={{
                      objectFit: 'contain',
                      filter: 'brightness(0) invert(1)' // 흰색으로 변환
                    }}
                    priority
                  />
                </Link>
                <Box style={{ flex: 1, position: 'relative' }}>
                  <TextInput
                    placeholder=""
                    value={searchQuery}
                    onChange={handleSearchInput}
                    onKeyDown={(e) => {
                      // 한글 IME 조합 중이면 무시 (글자 중복 방지)
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setSubmittedQuery(searchQuery);
                        setSearchFocused(false);
                        saveRecentSearch(searchQuery); // 최근 검색어 저장
                        (document.activeElement as HTMLElement)?.blur();
                      }
                    }}
                    size="sm"
                    rightSection={
                      <ActionIcon
                        variant="transparent"
                        c={searchQuery ? 'white' : 'rgba(255,255,255,0.6)'}
                        onClick={() => {
                          if (searchQuery) {
                            setSubmittedQuery(searchQuery);
                            setSearchFocused(false);
                            (document.activeElement as HTMLElement)?.blur();
                          }
                        }}
                      >
                        <Search size={16} />
                      </ActionIcon>
                    }
                    styles={{
                      input: {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        border: 'none',
                        fontSize: '16px', // iOS 자동 확대 방지
                        color: 'white',
                        '::placeholder': { color: 'rgba(255,255,255,0.7)' }
                      }
                    }}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
                  />
                  {/* 모바일 롤링 Placeholder */}
                  {!searchQuery && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '12px',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        overflow: 'hidden',
                        height: '18px',
                        width: '120px'
                      }}
                    >
                      <Box
                        key={placeholderIndex}
                        style={{
                          animation: 'slideUpMobile 0.4s ease-out forwards',
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '14px',
                          lineHeight: '18px'
                        }}
                      >
                        {placeholderTexts[placeholderIndex]}
                      </Box>
                    </Box>
                  )}
                  <style>{`
                    @keyframes slideUpMobile {
                      0% { transform: translateY(100%); opacity: 0; }
                      20% { opacity: 1; }
                      80% { opacity: 1; }
                      100% { transform: translateY(0); opacity: 1; }
                    }
                  `}</style>

                  {/* 모바일 자동완성 팝업 */}
                  {searchFocused && searchQuery.trim() && (completionResults.regions.length > 0 || completionResults.facilities.length > 0) && (
                    <Box
                      pos="absolute"
                      top="calc(100% + 4px)"
                      left={0}
                      w="100%"
                      bg="white"
                      style={{
                        zIndex: 2100,
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}
                    >
                      {completionResults.regions.map((region, i) => (
                        <Box
                          key={`mob-reg-${i}`}
                          px="md"
                          py={12}
                          style={{ cursor: 'pointer', borderBottom: '1px solid #f1f3f5' }}
                          onClick={() => handleSelectRegion(region)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <Text size="sm" c="dark.9">{region.fullName}</Text>
                        </Box>
                      ))}
                      {completionResults.facilities.map((fac, i) => (
                        <Box
                          key={`mob-fac-${fac.id}-${i}`}
                          px="md"
                          py={12}
                          style={{ cursor: 'pointer', borderBottom: i === completionResults.facilities.length - 1 ? 'none' : '1px solid #f1f3f5' }}
                          onClick={() => handleSelectFacility(fac)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <Text size="sm" fw={500} c="dark.9">{fac.name}</Text>
                          <Text size="xs" c="dimmed" truncate>{fac.address}</Text>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* 🔍 모바일 최근 검색어 */}
                  {searchFocused && !searchQuery.trim() && recentSearches.length > 0 && (
                    <Box
                      pos="absolute"
                      top="calc(100% + 4px)"
                      left={0}
                      w="100%"
                      bg="white"
                      style={{
                        zIndex: 2100,
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}
                    >
                      <Box px="md" py="xs" bg="gray.0">
                        <Text size="xs" c="dimmed" fw={500}>최근 검색</Text>
                      </Box>
                      {recentSearches.map((query, i) => (
                        <Box
                          key={`mob-recent-${i}`}
                          px="md"
                          py={12}
                          style={{ cursor: 'pointer', borderBottom: i === recentSearches.length - 1 ? 'none' : '1px solid #f8f9fa' }}
                          onClick={() => {
                            setSearchQuery(query);
                            setSubmittedQuery(query);
                            setSearchFocused(false);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <Text size="sm" c="dark.7" truncate>{query}</Text>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* 내 정보 아이콘 */}
                <button
                  onClick={() => console.log('내 정보 클릭')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'white' }}>person</span>
                </button>
              </Group>
            </Box>

            {/* 필터 버튼 영역 - 흰색 배경 (UI 숨김 시 위로 슬라이드 아웃) */}
            <Box
              pos="absolute"
              top="58px"
              left={0}
              w="100%"
              style={{
                zIndex: 900,
                backgroundColor: 'white',
                padding: '8px 16px',
                borderBottom: '1px solid #e9ecef',
                transform: uiHidden ? 'translateY(-200%)' : 'translateY(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Group gap={6} wrap="nowrap" align="center">
                {/* 전체 버튼 */}
                <button
                  onClick={() => setActiveCategory(['all'])}
                  style={{
                    height: '30px',
                    fontSize: '12px',
                    fontWeight: activeCategory.includes('all') ? 700 : 500,
                    backgroundColor: 'white',
                    color: activeCategory.includes('all') ? '#1D0098' : '#495057',
                    border: activeCategory.includes('all') ? '1.5px solid #1D0098' : '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    paddingLeft: '14px',
                    paddingRight: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  전체
                </button>

                {/* 구분선 */}
                <div style={{ width: '1px', height: '20px', backgroundColor: '#dee2e6' }} />

                {/* 개별 카테고리 버튼들 */}
                {[
                  { value: 'charnel', label: '봉안당' },
                  { value: 'natural', label: '수목장' },
                  { value: 'park', label: '공원묘지' }
                ].map(tab => {
                  const isSelected = activeCategory.includes(tab.value);
                  return (
                    <button
                      key={tab.value}
                      onClick={() => {
                        if (activeCategory.includes('all')) {
                          // 전체에서 개별 선택
                          setActiveCategory([tab.value]);
                        } else if (isSelected) {
                          // 이미 선택된 거 해제
                          const newCats = activeCategory.filter(c => c !== tab.value);
                          setActiveCategory(newCats.length === 0 ? ['all'] : newCats);
                        } else {
                          // 추가 선택
                          const newCats = [...activeCategory, tab.value];
                          // 3개 다 선택하면 전체로
                          if (newCats.length === 3) {
                            setActiveCategory(['all']);
                          } else {
                            setActiveCategory(newCats);
                          }
                        }
                      }}
                      style={{
                        height: '30px',
                        fontSize: '12px',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: 'white',
                        color: isSelected ? '#1D0098' : '#495057',
                        border: isSelected ? '1.5px solid #1D0098' : '1px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        paddingLeft: '14px',
                        paddingRight: '14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </Group>
            </Box>
          </>
        )}

        <NaverMap
          ref={mapRef}
          facilities={filteredMapFacilities}
          onMarkerClick={(f) => {
            setUiHidden(false); // 마커 클릭 시 UI 다시 표시
            handleMarkerClick(f);
          }}
          onBoundsChanged={handleBoundsChanged}
          onCenterAddressChange={setCurrentRegionName}
          isMobile={isMobile}
          onViewList={() => router.push('/list')}
          onMapTap={handleMapTap}
          onMapDrag={() => setSearchFocused(false)}
          uiHidden={uiHidden}
        />
      </Box>

      {/* 모바일 상세 팝업 (Full Page Overlay with Slide Animation) */}
      {
        isMobile && selectedFacility && (
          <>
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>
            <Box
              pos="fixed"
              top={0}
              left={0}
              w="100%"
              h="100%"
              bg="white"
              style={{
                zIndex: 3000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                touchAction: 'pan-y',
                overscrollBehavior: 'contain',
                animation: 'slideInRight 0.25s ease-out forwards',
              }}
            >
              <Box style={{ flex: 1, overflow: 'hidden' }}>
                <FacilityDetail
                  facility={selectedFacility}
                  onClose={() => {
                    // URL에서 모든 파라미터 정리 후 홈으로 이동 (히스토리 문제 방지)
                    router.push(pathname, { scroll: false });
                  }}
                  allFacilities={finalFacilities}
                  onSelectFacility={(id) => {
                    const fac = finalFacilities.find(f => f.id === id);
                    if (fac) handleMarkerClick(fac);
                  }}
                  onMapView={(lat, lng) => {
                    setMobileView('map');
                    router.push(pathname, { scroll: false });
                    setTimeout(() => {
                      if (mapRef.current) {
                        mapRef.current.panTo(lat, lng, 17);
                      }
                    }, 300);
                  }}
                />
              </Box>
            </Box>
          </>
        )
      }
      {/* 모바일 하단 지도/목록 전환은 "주변 시설 보기" 버튼이 대체 */}

      {/* 모바일 하단 탭바 */}
      {isMobile && !selectedFacility && <BottomNav hidden={uiHidden} />}
    </Flex >
  );
}

export default function HomeClient({ initialFacilities }: HomeClientProps) {
  return (
    <Suspense fallback={null}>
      <HomeContent initialFacilities={initialFacilities} />
    </Suspense>
  );
}
