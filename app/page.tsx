'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { AppShell, Box, Flex, SegmentedControl, useMantineTheme, TextInput, Tabs, Group, Text, ThemeIcon, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Map as MapIcon, List as ListIcon, Search, MapPin, Building } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import Image from 'next/image';

import NaverMap, { NaverMapRef } from '@/components/map/NaverMap';
import FacilityList from '@/components/list/FacilityList';
import FilterBar from '@/components/list/FilterBar';
import FacilityDetail from '@/components/detail/FacilityDetail';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';

import { searchRegions, RegionResult } from '@/lib/regionSearch';

// Helper Component for highlighting text
function HighlightText({ text, highlight }: { text: string, highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <Text span size="sm">
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text span key={i} c="#35469C" fw={700}>{part}</Text>
        ) : (
          <Text span key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

function HomeContent() {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  // 지도 컨트롤 Ref
  const mapRef = useRef<NaverMapRef>(null);

  // Router hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 상태 관리
  const [activeCategory, setActiveCategory] = useState<string>('all');
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


  const [dbFacilities, setDbFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 현재 지도 좌표
  const [currentBounds, setCurrentBounds] = useState<{ south: number, north: number, west: number, east: number } | null>(null);

  // 1. 초기 데이터 로드 (API)
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/facilities');
        if (res.ok) {
          const data = await res.json();
          setDbFacilities(data);
        }
      } catch (e) {
        console.error('Failed to fetch facilities', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Sync URL with State (activeFacilityId)
  useEffect(() => {
    const facilityId = searchParams.get('id');
    if (facilityId && dbFacilities.length > 0) {
      const fac = dbFacilities.find(f => f.id === facilityId);
      if (fac) {
        setSelectedFacility(fac);
      } else {
        // If ID is in URL but facility not found, clear ID from URL
        router.push(pathname, { scroll: false });
      }
    } else if (!facilityId) {
      // If no ID in URL, ensure selectedFacility is null
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

    // 2. 시설 검색
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
  const filteredMapFacilities = useMemo(() => {
    let base = dbFacilities;

    // 0. 장례식장 기본 제외
    base = base.filter(f => f.category !== 'FUNERAL_HOME');

    // 1. 카테고리
    if (activeCategory !== 'all') {
      const catMap: Record<string, string> = {
        'charnel': 'CHARNEL_HOUSE',
        'natural': 'NATURAL_BURIAL',
        'park': 'FAMILY_GRAVE'
      };
      if (catMap[activeCategory]) {
        base = base.filter(f => f.category === catMap[activeCategory]);
      }
    }

    // 2. 검색어 (이름 or 주소) - 지역 선택 아닐 때만 필터링
    if (submittedQuery.trim() && !isRegionSelected) { // Use submittedQuery for filtering
      const query = submittedQuery.trim().toLowerCase().normalize('NFC');
      base = base.filter(f =>
        f.name.toLowerCase().normalize('NFC').includes(query) ||
        f.address.toLowerCase().normalize('NFC').includes(query)
      );
    }

    return base;
  }, [dbFacilities, activeCategory, submittedQuery, isRegionSelected]);

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
      if (sortBy === 'price') return a.priceRange.min - b.priceRange.min;
      if (sortBy === 'review') return (b.reviewCount || 0) - (a.reviewCount || 0);
      return Number(b.rating) - Number(a.rating);
    });
  }, [filteredMapFacilities, currentBounds, sortBy]);

  // 검색 결과 선택 (시설)
  const handleSelectFacility = (facility: Facility) => {
    // Update URL to open detail modal (supports back button)
    const params = new URLSearchParams(searchParams.toString());
    params.set('id', facility.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });

    // Map movement logic
    if (mapRef.current && facility.coordinates) {
      mapRef.current.panTo(facility.coordinates.lat, facility.coordinates.lng, 16);
      if (isMobile) setMobileView('map');
    }
    setSearchFocused(false);
    setSearchQuery(facility.name); // Update search input with selected facility name
    setSubmittedQuery(facility.name); // Also update submitted query
  };

  // 검색 결과 선택 (지역)
  const handleSelectRegion = (region: RegionResult) => {
    setSearchQuery(region.fullName);
    setSubmittedQuery(region.fullName); // Also update submitted query
    setIsRegionSelected(true);

    if (mapRef.current) {
      const zoom = region.type === 'gu' ? 12 : 14;
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
  };

  const handleCloseDetail = () => {
    // Remove 'id' parameter from URL to close the detail view
    router.push(pathname, { scroll: false });
  };

  return (
    <Flex h="100dvh" direction={isMobile ? 'column' : 'row'}>

      {/* 1. 좌측 검색/필터/리스트 (PC: 400px, 모바일: 100%) */}
      <Box
        w={isMobile ? '100%' : 400}
        h={isMobile ? (mobileView === 'list' ? '100%' : '50%') : '100%'}
        style={{
          flexShrink: 0,
          display: isMobile && mobileView === 'map' ? 'none' : 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1000, // 지도 위에 오도록
          backgroundColor: 'white',
          borderRight: isMobile ? 'none' : '1px solid #e9ecef'
        }}
      >
        {/* 검색창 및 카테고리 필터 */}
        <Box p="md" style={{ borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>


          <Group wrap="nowrap" align="center" mb="sm">
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
            <Box style={{ flex: 1, position: 'relative' }}>
              <TextInput
                placeholder="지역, 시설명 검색"
                value={searchQuery}
                onChange={handleSearchInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission if in a form
                    setSubmittedQuery(searchQuery); // Trigger immediate search
                    setSearchFocused(false); // Close autocomplete
                    (document.activeElement as HTMLElement)?.blur(); // Hide keyboard on mobile
                  }
                }}
                rightSection={
                  searchQuery ? (
                    <ActionIcon variant="transparent" c="gray.5" onClick={() => {
                      setSearchQuery('');
                      setSubmittedQuery(''); // Clear submitted query immediately
                    }}>
                      <Search size={16} /> {/* Using Search icon for clear, could be X */}
                    </ActionIcon>
                  ) : null
                }
                styles={{
                  input: {
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    fontSize: '15px'
                  }
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 250)} // 250ms for mobile touch stability
              />

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
            </Box>
          </Group>

          <Tabs
            value={activeCategory}
            onChange={(v) => setActiveCategory(v || 'all')}
            variant="pills"
            radius="xl"
            styles={{
              root: { marginTop: 8 },
              list: { gap: 6 }, // 탭 간격
              tab: {
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid transparent',
                height: '34px',
              }
            }}
          >
            <Tabs.List>
              {[
                { value: 'all', label: '전체' },
                { value: 'charnel', label: '봉안당' },
                { value: 'natural', label: '수목장' },
                { value: 'park', label: '공원묘지' }
              ].map(tab => {
                const isActive = activeCategory === tab.value;
                return (
                  <Tabs.Tab
                    key={tab.value}
                    value={tab.value}
                    style={{
                      backgroundColor: isActive ? '#3b4896' : 'transparent', // Custom Dark Blue for Active, Transparent for Inactive
                      color: isActive ? 'white' : '#495057', // White text for Active, Gray for Inactive
                      borderColor: isActive ? 'transparent' : 'transparent',
                      fontWeight: isActive ? 700 : 500
                    }}
                  >
                    {tab.label}
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs>
        </Box>

        {/* 상세 보기 or 리스트 */}
        <Box flex={1} h="100%" style={{ position: 'relative', overflowY: 'auto' }}>
          {selectedFacility && !isMobile ? (
            <FacilityDetail
              facility={selectedFacility}
              onClose={handleCloseDetail}
            />
          ) : (
            <Flex direction="column" h="100%">
              <FilterBar sortBy={sortBy} setSortBy={setSortBy} totalCount={finalFacilities.length} />
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
        <NaverMap
          ref={mapRef}
          facilities={filteredMapFacilities}
          onMarkerClick={handleMarkerClick}
          onBoundsChanged={handleBoundsChanged}
          isMobile={isMobile}
        />
      </Box>

      {/* 모바일 상세 팝업 (Full Page Overlay with Slide Animation) */}
      {
        isMobile && selectedFacility && (
          <Box
            pos="fixed"
            top={0}
            left={0}
            w="100%"
            h="100%" // Full height
            bg="white"
            style={{
              zIndex: 3000, // Topmost layer
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              touchAction: 'pan-y', // 🚀 스크롤 개선
              overscrollBehavior: 'contain', // 🚀 스크롤 개선
              // 🎬 스르륵 애니메이션 (0.2s로 단축하여 더 빠르게)
              animation: 'slideInRight 0.2s ease-out',
            }}
          >
            <style jsx>{`
              @keyframes slideInRight {
                from {
                  transform: translateX(100%);
                }
                to {
                  transform: translateX(0);
                }
              }
            `}</style>
            {/* 컨텐츠 영역 (Full height, FacilityDetail handles header) */}
            <Box style={{ flex: 1, overflow: 'hidden' }}>
              <FacilityDetail
                facility={selectedFacility}
                onClose={() => router.back()} // 히스토리 뒤로가기로 닫기
              />
            </Box>
          </Box>
        )
      }

      {/* 모바일 하단 뷰 토글 버튼 (Global Position) */}
      {
        isMobile && !selectedFacility && (
          <Box pos="absolute" bottom={30} left="50%" style={{ transform: 'translateX(-50%)', zIndex: 1000 }}>
            <SegmentedControl
              value={mobileView}
              onChange={(v) => setMobileView(v as 'map' | 'list')}
              data={[
                { label: <LabelCenter><MapIcon size={16} style={{ marginRight: 4 }} /> 지도</LabelCenter>, value: 'map' },
                { label: <LabelCenter><ListIcon size={16} style={{ marginRight: 4 }} /> 목록</LabelCenter>, value: 'list' },
              ]}
              radius="xl"
              size="md"
              bg="white"
              styles={{ root: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } }}
            />
          </Box>
        )
      }
    </Flex >
  );
}

function LabelCenter({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
