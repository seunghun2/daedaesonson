'use client';

import { useState, useMemo, useEffect, useRef, useTransition, Suspense } from 'react';
import { Box, Flex, useMantineTheme, TextInput, Group, Text, ThemeIcon, ActionIcon, ScrollArea, Stack, Loader, Center, Button, Popover, Checkbox, Drawer, SegmentedControl } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Search, MapPin, Building, MessageCircle, Clock, Info, User, ChevronLeft, ChevronDown } from 'lucide-react';
import LoginModal from '@/components/auth/LoginModal';
import { useAuth } from '@/components/auth/AuthProvider';
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
import FacilityCard from '@/components/list/FacilityCard';
// 🚀 FacilityDetail 지연 로딩 (210KB → 마커 클릭 시에만 로드)
const FacilityDetail = dynamic(() => import('@/components/detail/FacilityDetail'), {
  ssr: false,
  loading: () => (
    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#f8f9fa' }}>
      <Text c="dimmed" size="sm">로딩 중...</Text>
    </Box>
  ),
});
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
  // isMobile: 초기값 undefined → 확정될 때까지 opacity:0으로 깜빡임 방지
  const isMobileQuery = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isLayoutReady = isMobileQuery !== undefined;
  const isMobile = isMobileQuery ?? true;

  // 지도 컨트롤 Ref
  const mapRef = useRef<NaverMapRef>(null);

  // 🗺️ 맵 준비 전에 도착한 region 파라미터를 보관하는 Ref
  const pendingRegionRef = useRef<{
    lat: number; lng: number; zoom: number;
    type: 'gu' | 'dong'; name: string; fullName: string;
  } | null>(null);

  // Router hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 상태 관리
  const [activeCategory, setActiveCategory] = useState<string[]>(['all']);
  const [isPending, startTransition] = useTransition();
  const [institutionFilter, setInstitutionFilter] = useState<'all' | 'public' | 'private'>('all'); // 공설/사설 필터
  const [hideInquiry, setHideInquiry] = useState(false); // 문의제외 필터
  const [pcPopoverOpen, setPcPopoverOpen] = useState(false); // PC 팝오버
  const [drawerFilterOpen, setDrawerFilterOpen] = useState(false); // 모바일 드로우
  const [tempCategory, setTempCategory] = useState<string[]>(['all']); // 드로우 임시 카테고리
  const [tempHideInquiry, setTempHideInquiry] = useState(false); // 드로우 임시 문의제외
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [sortBy, setSortBy] = useState('rating');

  // 🚀 모바일 상세 슬라이드아웃 애니메이션 상태
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const detailLoadingIdRef = useRef<string>(''); // 빠른 클릭 시 race condition 방지

  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState(''); // 엔터 친 검색어
  const [searchFocused, setSearchFocused] = useState(false); // 검색창 포커스 여부

  // 지역 선택 모드인지 여부 (텍스트 필터링 건너뛰기 위함)
  const [isRegionSelected, setIsRegionSelected] = useState(false);

  // 🗺️ PC용 "주변 시설 보기" 오버레이 상태
  const [nearbyList, setNearbyList] = useState<{ region: string; lat: number; lng: number } | null>(null);
  const [nearbyCategory, setNearbyCategory] = useState<string[]>(['all']);
  const [nearbyVisibleCount, setNearbyVisibleCount] = useState(20);
  const [nearbyDrawerOpen, setNearbyDrawerOpen] = useState(false);
  const [tempNearbyCategory, setTempNearbyCategory] = useState<string[]>(['all']);
  const [tempNearbyHideInquiry, setTempNearbyHideInquiry] = useState(false);
  const [nearbyHideInquiry, setNearbyHideInquiry] = useState(false);
  const [nearbyInstitutionFilter, setNearbyInstitutionFilter] = useState<'all' | 'public' | 'private'>('all');

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

  // 🗺️ 지역 데이터 지연 로드 (검색 포커스 시점에 로드)
  const regionDataLoadedRef = useRef(false);
  const loadRegionDataOnce = () => {
    if (!regionDataLoadedRef.current) {
      regionDataLoadedRef.current = true;
      import('@/lib/regionSearch').then(mod => {
        mod.ensureRegionDataLoaded();
      });
    }
  };

  // 🚀 SSR로 미리 로드된 데이터 사용 (API fetch 없음!)
  const [dbFacilities, setDbFacilities] = useState<Facility[]>(initialFacilities);

  // 🚀 캐시 저장은 비동기로 (메인스레드 블로킹 방지)
  useEffect(() => {
    if (initialFacilities.length > 0) {
      const save = () => {
        try { sessionStorage.setItem('facilitiesCache', JSON.stringify(initialFacilities)); } catch { }
      };
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(save);
      } else {
        setTimeout(save, 100);
      }
    }
  }, [initialFacilities]);
  const [isLoading, setIsLoading] = useState(false); // 이미 로드됨

  // 현재 지도 좌표
  const [currentBounds, setCurrentBounds] = useState<{ south: number, north: number, west: number, east: number } | null>(null);
  const [currentRegionName, setCurrentRegionName] = useState<string>(''); // 현재 지역명

  // UI 숨김 상태 (지도 탭 시 토글) - 호갱노노 스타일
  const [uiHidden, setUiHidden] = useState(false);
  const [showLoginFromMap, setShowLoginFromMap] = useState(false);
  const [showMyInfo, setShowMyInfo] = useState(false);
  const { user, profile, signOut, favorites, isFavorite, toggleFavorite } = useAuth();

  // 검색창 롤링 placeholder
  const placeholderTexts = ['서울 봉안당', '경기 수목장', '부산 공원묘지', '대전 납골당', '인천 자연장'];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // 📊 GA4: 홈페이지 페이지뷰
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', '홈_페이지_조회', {
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

  // 🖥️ PC: /facility/[id]에서 리다이렉트 되었을 때 사이드 패널에서 시설 상세 열기
  useEffect(() => {
    if (isMobile) return;
    const openId = sessionStorage.getItem('openFacilityId');
    if (openId) {
      sessionStorage.removeItem('openFacilityId');
      // dbFacilities에서 기본 정보로 먼저 열고
      const fac = dbFacilities.find(f => f.id === openId);
      if (fac) {
        setSelectedFacility(fac);
      }
      // 🔑 URL을 /facility/[id]로 복원 (리다이렉트로 사라진 URL 복구)
      window.history.replaceState({ facilityId: openId }, '', `/facility/${openId}`);
      // API에서 상세 데이터 보강
      fetch(`/api/facilities/${openId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setSelectedFacility(data);
        })
        .catch(() => { });
    }
  }, [isMobile, dbFacilities]);

  // Sync URL with State (activeFacilityId)
  useEffect(() => {
    const facilityId = searchParams.get('id');
    if (facilityId) {
      // 🔀 기존 /?id=xxx URL을 /facility/xxx로 리디렉트 (하위 호환성)
      router.replace(`/facility/${facilityId}`);
      return;
    }

    if (!facilityId) {
      // 🚀 모바일에서 상세가 열려있을 때 뒤로가기 → 슬라이드아웃 애니메이션 트리거
      if (isMobile && selectedFacility && !isDetailClosing) {
        setIsDetailClosing(true);
        // onAnimationEnd에서 실제 cleanup 처리
      } else if (!isDetailClosing && !isMobile && window.location.pathname.startsWith('/facility/')) {
        // 🖥️ PC: pushState로 URL이 /facility/[id]인 상태 → 패널 유지 (닫지 않음)
      } else if (!isDetailClosing) {
        // PC이거나 애니메이션 불필요한 경우 즉시 정리
        setSelectedFacility(null);
      }
    }

    // 🗺️ /search에서 지역 선택하고 돌아왔을 때 처리
    const regionName = searchParams.get('region');
    const regionLat = searchParams.get('lat');
    const regionLng = searchParams.get('lng');
    const regionType = searchParams.get('type');
    const regionShortName = searchParams.get('name');
    if (regionName && regionLat && regionLng) {
      const lat = parseFloat(regionLat);
      const lng = parseFloat(regionLng);
      const zoom = regionType === 'gu' ? 12 : (regionShortName?.endsWith('리') ? 16 : 14);
      const type = (regionType as 'gu' | 'dong') || 'gu';
      const name = regionShortName || '';

      setSearchQuery(regionName);
      setSubmittedQuery(regionName);
      setIsRegionSelected(true);
      if (isMobile) setMobileView('map');

      // highlightRegion은 async → await으로 실제 성공 여부 확인
      (async () => {
        const success = mapRef.current
          ? await mapRef.current.highlightRegion(lat, lng, zoom, type, name)
          : false;
        if (!success) {
          // 맵이 아직 준비 안 된 경우 → pending에 저장 (맵 초기화 후 실행)
          pendingRegionRef.current = { lat, lng, zoom, type, name, fullName: regionName };
        }
      })();

      // URL에서 region 파라미터 제거 (깔끔하게)
      router.replace('/', { scroll: false });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, dbFacilities]);

  // 🗺️ 맵 초기화 후 pending region 실행 (맵 준비 전에 도착한 region 파라미터 처리)
  useEffect(() => {
    if (!pendingRegionRef.current) return;
    const interval = setInterval(async () => {
      if (mapRef.current && pendingRegionRef.current) {
        const { lat, lng, zoom, type, name } = pendingRegionRef.current;
        const success = await mapRef.current.highlightRegion(lat, lng, zoom, type, name);
        if (success) {
          pendingRegionRef.current = null;
          clearInterval(interval);
        }
      }
    }, 500);
    // 최대 15초 후 포기
    const timeout = setTimeout(() => {
      clearInterval(interval);
      pendingRegionRef.current = null;
    }, 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [searchParams]);

  // 🖥️ PC: 브라우저 뒤로가기 시 사이드 패널 닫기
  useEffect(() => {
    if (isMobile) return;
    const handlePopState = () => {
      // URL이 /facility/로 시작하지 않으면 사이드패널 닫기
      if (!window.location.pathname.startsWith('/facility/')) {
        setSelectedFacility(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobile]);

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

  // 🚀 Step 1: 기본 필터 (dbFacilities 변경 시에만 재계산 → 탭 클릭 시 건너뜀!)
  const baseFacilities = useMemo(() => {
    return dbFacilities.filter(f =>
      f.isActive !== false &&
      f.category !== 'FUNERAL_HOME'
    );
  }, [dbFacilities]);

  // 🚀 Step 2: 카테고리 + 공설/사설 필터 (탭 클릭 시 이것만 재실행 → 가벼움!)
  const filteredMapFacilities = useMemo(() => {
    let base = baseFacilities;

    // 1. 카테고리 (다중 선택)
    if (!activeCategory.includes('all')) {
      const catMap: Record<string, string> = {
        'charnel': 'CHARNEL_HOUSE',
        'natural': 'NATURAL_BURIAL',
        'park': 'FAMILY_GRAVE',
        'crematorium': 'CREMATORIUM'
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

    // 3. 문의제외 필터
    if (hideInquiry) {
      base = base.filter(f => (f.priceRange?.min ?? 0) > 0);
    }

    return base;
  }, [baseFacilities, activeCategory, institutionFilter, hideInquiry]);

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

  // 검색 결과 선택 (시설) → /facility/[id] 라우트로 이동 (호갱노노 스타일)
  const handleSelectFacility = (facility: Facility) => {
    setSearchFocused(false);
    setSearchQuery(facility.name);
    setSubmittedQuery(facility.name);
    saveRecentSearch(facility.name);
    // 🗺️ 지도 위치 저장 (뒤로가기 시 복원)
    if (mapRef.current) {
      const view = mapRef.current.getCurrentView();
      if (view) sessionStorage.setItem('pendingMapView', JSON.stringify(view));
    }
    router.push(`/facility/${facility.id}`);
  };

  // 검색 결과 선택 (지역)
  const handleSelectRegion = (region: RegionResult) => {

    setSearchQuery(region.fullName);
    setSubmittedQuery(region.fullName); // Also update submitted query
    saveRecentSearch(region.fullName); // 최근 검색어 저장
    setIsRegionSelected(true);

    if (mapRef.current) {
      const zoom = region.type === 'gu' ? 12 : (region.name.endsWith('리') ? 16 : 14);
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
    if (isMobile) {
      // 📱 모바일: 현재 지도 위치 저장 (뒤로가기 시 복원)
      if (mapRef.current) {
        const view = mapRef.current.getCurrentView();
        if (view) {
          sessionStorage.setItem('pendingMapView', JSON.stringify(view));
        }
      }
      router.push(`/facility/${facility.id}`);
      setMobileView('map');
    } else {
      // 🖥️ PC: 왼쪽 패널에 상세 표시 + URL 업데이트
      setNearbyList(null); // 주변 시설 패널 닫기
      setShowMyInfo(false); // 내 정보 패널 닫기
      const wasAlreadyOpen = !!selectedFacility;
      if (wasAlreadyOpen) {
        window.history.replaceState({ facilityId: facility.id }, '', `/facility/${facility.id}`);
      } else {
        window.history.pushState({ facilityId: facility.id }, '', `/facility/${facility.id}`);
      }
      // 🔥 전체 스켈레톤 로딩 표시 → API 완료 후 한번에 전체 렌더링
      const requestId = facility.id;
      detailLoadingIdRef.current = requestId;
      setIsDetailLoading(true);
      setSelectedFacility(facility); // 기본 정보 유지 (패널 영역 유지용)
      fetch(`/api/facilities/${facility.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          // 빠른 클릭 시 이전 요청 무시 (race condition 방지)
          if (detailLoadingIdRef.current !== requestId) return;
          if (data) {
            data.coordinates = facility.coordinates || data.coordinates;
            setSelectedFacility(data);
          }
          setIsDetailLoading(false);
        })
        .catch(() => {
          if (detailLoadingIdRef.current !== requestId) return;
          setIsDetailLoading(false);
        });
    }

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
        thumbnail: facility.thumbnail || facility.imageGallery?.[0],
        visitedAt: Date.now(),
      });
      // 최대 20개
      history = history.slice(0, 20);
      localStorage.setItem('facilityHistory', JSON.stringify(history));
    } catch { }
  };

  // 🗺️ PC: 시설 선택 시 지도 자동 이동 제거 (사용자 지도 위치 유지)
  // 마커 클릭 시 상세 패널만 열리고 지도는 현재 위치 그대로

  const handleCloseDetail = () => {
    setSelectedFacility(null);
    setIsDetailLoading(false);
    detailLoadingIdRef.current = '';
    // URL을 /로 복원 (페이지 전환 없이)
    window.history.pushState({}, '', '/');
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
    <Flex h="100dvh" className="home-container" style={{ opacity: isLayoutReady ? 1 : 0, transition: 'opacity 0.05s' }}>

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
        <Box p="md" style={{
          borderBottom: (!isMobile && selectedFacility) ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e9ecef',
          flexShrink: 0,
          backgroundColor: (!isMobile && selectedFacility) ? '#302E92' : undefined,
          transition: 'background-color 0.2s ease',
        }}>


          <Group wrap="nowrap" align="center" mb={(!isMobile && selectedFacility) ? 0 : 'sm'}>
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
              <Link href="/" style={{ display: 'flex', alignItems: 'center', marginRight: 8 }} onClick={(e) => { if (!isMobile && selectedFacility) { e.preventDefault(); handleCloseDetail(); } }}>
                <Image
                  src={(!isMobile && selectedFacility) ? '/logo-horizontal-white.svg' : '/logo-horizontal.svg?v=4'}
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
                    c={(!isMobile && selectedFacility) ? 'white' : (searchQuery ? 'brand.6' : 'gray.5')}
                    onClick={() => {
                      if (searchQuery) {
                        setSubmittedQuery(searchQuery);
                        setSearchFocused(false);
                        (document.activeElement as HTMLElement)?.blur();
                        // 📊 GA4: 검색 실행
                        if (window.gtag) {
                          window.gtag('event', '검색', {
                            검색어: searchQuery
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
                    backgroundColor: (!isMobile && selectedFacility) ? 'rgba(255,255,255,0.15)' : '#f8f9fa',
                    border: (!isMobile && selectedFacility) ? '1px solid rgba(255,255,255,0.3)' : '1px solid #e9ecef',
                    fontSize: '16px', // iOS 자동 확대 방지
                    color: (!isMobile && selectedFacility) ? 'white' : undefined,
                  }
                }}
                onFocus={() => { setSearchFocused(true); loadRegionDataOnce(); }}
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

          {/* PC 필터 버튼 (다중 선택) - PC 상세보기 시 숨김 */}
          <div style={{ display: (!isMobile && selectedFacility) ? 'none' : 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            {/* 카테고리 필터 버튼 → Drawer 오픈 */}
            <button
              onClick={() => {
                setTempCategory([...activeCategory]);
                setTempHideInquiry(hideInquiry);
                setDrawerFilterOpen(true);
              }}
              style={{
                height: '34px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: activeCategory.includes('all') ? 'white' : '#f1f3f5',
                color: activeCategory.includes('all') ? '#495057' : '#343a40',
                border: activeCategory.includes('all') ? '1px solid #dee2e6' : '1.5px solid #868e96',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                paddingLeft: '16px',
                paddingRight: '12px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {activeCategory.includes('all') ? '전체 시설' :
                activeCategory.length === 1 ?
                  ({ charnel: '봉안당', natural: '수목장', park: '공원묘지', crematorium: '화장장' }[activeCategory[0]] || '전체 시설') :
                  `${({ charnel: '봉안당', natural: '수목장', park: '공원묘지', crematorium: '화장장' }[activeCategory[0]] || '')} 외 ${activeCategory.length - 1}`
              }
              <ChevronDown size={16} style={{ opacity: 0.6 }} />
            </button>

            {/* 문의제외 필터 (모바일에서만 표시 - PC는 검색결과 옆 체크박스) */}
            {isMobile && (
              <button
                onClick={() => setHideInquiry(!hideInquiry)}
                style={{
                  height: '34px',
                  fontSize: '14px',
                  fontWeight: hideInquiry ? 700 : 500,
                  backgroundColor: hideInquiry ? '#EDE9FF' : 'white',
                  color: hideInquiry ? '#1D0098' : '#495057',
                  border: hideInquiry ? '1.5px solid #1D0098' : '1px solid #dee2e6',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                문의제외
              </button>
            )}

          </div>
        </Box>

        {/* 상세 보기 or 리스트 */}
        <Box flex={1} h="100%" style={{ position: 'relative', overflow: 'hidden' }}>
          {showMyInfo && !isMobile ? (
            <MyInfoPanel
              user={user}
              profile={profile}
              favorites={favorites}
              allFacilities={finalFacilities}
              onClose={() => setShowMyInfo(false)}
              onSignOut={() => { signOut(); setShowMyInfo(false); }}
              onFacilityClick={(fac) => { setShowMyInfo(false); handleMarkerClick(fac); }}
              router={router}
            />
          ) : selectedFacility && !isMobile ? (
            <FacilityDetail
              facility={selectedFacility}
              onClose={handleCloseDetail}
              allFacilities={finalFacilities}
              isDesktop={true}
              isDetailLoading={isDetailLoading}
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
              <FilterBar sortBy={sortBy} setSortBy={setSortBy} totalCount={finalFacilities.length} institutionFilter={institutionFilter} setInstitutionFilter={setInstitutionFilter} regionName={currentRegionName} hideInquiry={hideInquiry} setHideInquiry={setHideInquiry} />
              <FacilityList
                facilities={finalFacilities}
                onFacilityClick={handleMarkerClick}
                selectedId={selectedFacility?.id}
                hideInquiry={hideInquiry}
                setHideInquiry={setHideInquiry}
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
                      filter: 'brightness(0) invert(1)'
                    }}
                    priority
                  />
                </Link>

                {/* 검색 버튼 → /search 페이지로 이동 */}
                <Box
                  onClick={() => router.push('/search')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <Search size={16} color="rgba(255,255,255,0.7)" style={{ flexShrink: 0 }} />
                  <Text size="sm" c="rgba(255,255,255,0.6)" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {searchQuery || '시설명, 지역 검색'}
                  </Text>
                </Box>


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
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {/* 카테고리 필터 버튼 (모바일에서 드로우 오픈) */}
                <button
                  onClick={() => {
                    setTempCategory([...activeCategory]);
                    setTempHideInquiry(hideInquiry);
                    setDrawerFilterOpen(true);
                  }}
                  style={{
                    height: '30px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: activeCategory.includes('all') ? 'white' : '#f1f3f5',
                    color: activeCategory.includes('all') ? '#495057' : '#343a40',
                    border: activeCategory.includes('all') ? '1px solid #dee2e6' : '1.5px solid #868e96',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    paddingLeft: '12px',
                    paddingRight: '8px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {activeCategory.includes('all') ? '전체 시설' :
                    activeCategory.length === 1 ?
                      ({ charnel: '봉안당', natural: '수목장', park: '공원묘지', crematorium: '화장장' }[activeCategory[0]] || '전체 시설') :
                      `${({ charnel: '봉안당', natural: '수목장', park: '공원묘지', crematorium: '화장장' }[activeCategory[0]] || '')} 외 ${activeCategory.length - 1}`
                  }
                  <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </button>

                {/* 문의제외 필터 */}
                <button
                  onClick={() => setHideInquiry(!hideInquiry)}
                  style={{
                    height: '30px',
                    fontSize: '12px',
                    fontWeight: hideInquiry ? 700 : 500,
                    backgroundColor: hideInquiry ? '#EDE9FF' : 'white',
                    color: hideInquiry ? '#1D0098' : '#495057',
                    border: hideInquiry ? '1.5px solid #1D0098' : '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    paddingLeft: '14px',
                    paddingRight: '14px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  문의제외
                </button>
              </div>

            </Box>
          </>
        )}

        {/* 필터 Drawer (PC: 왼쪽 사이드바 크기, 모바일: 풀스크린) */}
        <Drawer
          opened={drawerFilterOpen}
          onClose={() => setDrawerFilterOpen(false)}
          position={isMobile ? 'bottom' : 'left'}
          size={isMobile ? '100%' : 400}
          withCloseButton={false}
          zIndex={10000}
          styles={{
            content: { borderRadius: isMobile ? '16px 16px 0 0' : 0, display: 'flex', flexDirection: 'column' as const },
            body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' as const },
          }}
        >
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f3f5' }}>
            <button
              onClick={() => setDrawerFilterOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <Text fw={700} size="md">필터</Text>
            <div style={{ width: 28 }} />
          </div>

          {/* 시설 유형 */}
          <div style={{ padding: '20px 24px', flex: 1 }}>
            <Text fw={700} size="sm" mb={16}>시설 유형</Text>
            <Stack gap={14}>
              {[
                { value: 'charnel', label: '봉안당' },
                { value: 'natural', label: '수목장' },
                { value: 'park', label: '공원묘지' },
                { value: 'crematorium', label: '화장장' }
              ].map(tab => (
                <Checkbox
                  key={tab.value}
                  label={tab.label}
                  checked={tempCategory.includes('all') || tempCategory.includes(tab.value)}
                  onChange={() => {
                    if (tempCategory.includes('all')) {
                      const others = ['charnel', 'natural', 'park', 'crematorium'].filter(v => v !== tab.value);
                      setTempCategory(others);
                    } else if (tempCategory.includes(tab.value)) {
                      const newCats = tempCategory.filter(c => c !== tab.value);
                      setTempCategory(newCats.length === 0 ? ['all'] : newCats);
                    } else {
                      const newCats = [...tempCategory, tab.value];
                      setTempCategory(newCats.length === 4 ? ['all'] : newCats);
                    }
                  }}
                  size="md"
                  color="violet"
                  styles={{ label: { fontSize: '15px', fontWeight: 500, cursor: 'pointer' }, input: { cursor: 'pointer' } }}
                />
              ))}
            </Stack>

            {/* 구분선 */}
            <div style={{ height: 1, backgroundColor: '#f1f3f5', margin: '20px 0' }} />

            {/* 문의제외 */}
            <Checkbox
              label="문의 가격 시설 제외"
              checked={tempHideInquiry}
              onChange={() => setTempHideInquiry(!tempHideInquiry)}
              size="md"
              color="violet"
              styles={{ label: { fontSize: '15px', fontWeight: 500, cursor: 'pointer' }, input: { cursor: 'pointer' } }}
            />
          </div>

          {/* 하단 버튼 */}
          <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderTop: '1px solid #f1f3f5', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', marginTop: 'auto' }}>
            <button
              onClick={() => {
                setTempCategory(['all']);
                setTempHideInquiry(false);
              }}
              style={{
                flex: '0 0 auto',
                height: 48,
                padding: '0 20px',
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: '#495057',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
              선택해제
            </button>
            <button
              onClick={() => {
                startTransition(() => setActiveCategory(tempCategory));
                setHideInquiry(tempHideInquiry);
                setDrawerFilterOpen(false);
              }}
              style={{
                flex: 1,
                height: 48,
                backgroundColor: '#1D0098',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              적용하기
            </button>
          </div>
        </Drawer>

        <NaverMap
          ref={mapRef}
          facilities={baseFacilities}
          activeCategory={nearbyList ? nearbyCategory : activeCategory}
          institutionFilter={nearbyList ? nearbyInstitutionFilter : institutionFilter}
          hideInquiry={nearbyList ? nearbyHideInquiry : hideInquiry}
          onMarkerClick={(f) => {
            setUiHidden(false); // 마커 클릭 시 UI 다시 표시
            handleMarkerClick(f);
          }}
          onBoundsChanged={handleBoundsChanged}
          onCenterAddressChange={setCurrentRegionName}
          isMobile={isMobile}
          onViewList={(region, lat, lng) => {
            if (isMobile) {
              router.push(`/list?region=${encodeURIComponent(region)}&lat=${lat}&lng=${lng}`);
            } else {
              setNearbyList({ region, lat, lng });
              setNearbyCategory(['all']);
              setNearbyVisibleCount(20);
            }
          }}
          onMapTap={handleMapTap}
          onMapDrag={() => setSearchFocused(false)}
          uiHidden={uiHidden}
          onUserClick={!isMobile ? () => {
            if (user) {
              setShowMyInfo(true);
              setSelectedFacility(null);
            } else {
              setShowLoginFromMap(true);
            }
          } : undefined}
        />
        {/* PC: 로그인 모달 */}
        <LoginModal isOpen={showLoginFromMap} onClose={() => setShowLoginFromMap(false)} />
      </Box>

      {/* PC: 주변 시설 보기 오버레이 패널 (지도 위 왼쪽) */}
      {!isMobile && nearbyList && (() => {
        // 거리 계산 (Haversine)
        const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        // 필터링: 반경 30km + 카테고리
        let nearby = dbFacilities
          .filter(f => f.isActive !== false)
          .filter(f => f.category !== 'FUNERAL_HOME' && f.category !== 'OTHER')
          .filter(f => {
            if (!f.coordinates) return false;
            return getDistance(nearbyList.lat, nearbyList.lng, f.coordinates.lat, f.coordinates.lng) <= 30;
          });

        if (!nearbyCategory.includes('all')) {
          const catMap: Record<string, string> = { 'charnel': 'CHARNEL_HOUSE', 'natural': 'NATURAL_BURIAL', 'park': 'FAMILY_GRAVE' };
          const selected = nearbyCategory.filter(c => catMap[c]).map(c => catMap[c]);
          if (selected.length > 0) nearby = nearby.filter(f => selected.includes(f.category));
        }

        if (nearbyHideInquiry) {
          nearby = nearby.filter(f => (f.priceRange?.min ?? 0) > 0);
        }

        if (nearbyInstitutionFilter !== 'all') {
          nearby = nearby.filter(f => {
            if (nearbyInstitutionFilter === 'public') return f.isPublic === true;
            if (nearbyInstitutionFilter === 'private') return f.isPublic === false;
            return true;
          });
        }

        nearby.sort((a, b) => {
          if (!a.coordinates || !b.coordinates) return 0;
          return getDistance(nearbyList.lat, nearbyList.lng, a.coordinates.lat, a.coordinates.lng)
            - getDistance(nearbyList.lat, nearbyList.lng, b.coordinates.lat, b.coordinates.lng);
        });

        return (
          <Box
            pos="fixed"
            top={0}
            left={0}
            w={400}
            h="100dvh"
            bg="white"
            style={{
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid #e9ecef',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
              animation: 'slideInLeft 0.3s ease-out forwards',
            }}
          >
            <style>{`
              @keyframes slideInLeft {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
            `}</style>

            {/* 헤더 */}
            <Box style={{ padding: '14px 16px', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
              <Group wrap="nowrap" align="center" justify="space-between">
                <ActionIcon variant="transparent" onClick={() => setNearbyList(null)} style={{ color: '#495057' }}>
                  <ChevronLeft size={28} strokeWidth={2} />
                </ActionIcon>
                <Text fw={600} size="md" c="dark.9" style={{ flex: 1, textAlign: 'center' }}>
                  {nearbyList.region} 주변 시설 보기
                </Text>
                <Box w={28} />
              </Group>
            </Box>

            {/* 필터 바 */}
            <Box style={{ padding: '8px 16px', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
              <Group gap={6} wrap="nowrap" align="center" justify="space-between">
                {/* 전체 시설 → Drawer 오픈 */}
                <button
                  onClick={() => {
                    setTempNearbyCategory([...nearbyCategory]);
                    setTempNearbyHideInquiry(nearbyHideInquiry);
                    setNearbyDrawerOpen(true);
                  }}
                  style={{
                    height: '30px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: nearbyCategory.includes('all') ? 'white' : '#f1f3f5',
                    color: nearbyCategory.includes('all') ? '#495057' : '#343a40',
                    border: nearbyCategory.includes('all') ? '1px solid #dee2e6' : '1.5px solid #868e96',
                    borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
                    paddingLeft: '12px', paddingRight: '8px', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  {nearbyCategory.includes('all') ? '전체 시설' :
                    nearbyCategory.length === 1 ?
                      ({ charnel: '봉안당', natural: '수목장', park: '공원묘지' }[nearbyCategory[0]] || '전체 시설') :
                      `${({ charnel: '봉안당', natural: '수목장', park: '공원묘지' }[nearbyCategory[0]] || '')} 외 ${nearbyCategory.length - 1}`
                  }
                  <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </button>
                <SegmentedControl
                  size="xs"
                  value={nearbyInstitutionFilter}
                  onChange={(val) => setNearbyInstitutionFilter(val as 'all' | 'public' | 'private')}
                  data={[
                    { label: '전체', value: 'all' },
                    { label: '공설', value: 'public' },
                    { label: '사설', value: 'private' },
                  ]}
                  styles={{ root: { height: 30 } }}
                />
              </Group>
            </Box>

            {/* 주변 시설 필터 Drawer (400px 왼쪽) */}
            <Drawer
              opened={nearbyDrawerOpen}
              onClose={() => setNearbyDrawerOpen(false)}
              position="left"
              size={400}
              withCloseButton={false}
              zIndex={10000}
              styles={{
                content: { display: 'flex', flexDirection: 'column' as const },
                body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' as const },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f3f5' }}>
                <button onClick={() => setNearbyDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                <Text fw={700} size="md">필터</Text>
                <div style={{ width: 28 }} />
              </div>
              <div style={{ padding: '20px 24px', flex: 1 }}>
                <Text fw={700} size="sm" mb={16}>시설 유형</Text>
                <Stack gap={14}>
                  {[
                    { value: 'charnel', label: '봉안당' },
                    { value: 'natural', label: '수목장' },
                    { value: 'park', label: '공원묘지' },
                  ].map(tab => (
                    <Checkbox
                      key={tab.value}
                      label={tab.label}
                      checked={tempNearbyCategory.includes('all') || tempNearbyCategory.includes(tab.value)}
                      onChange={() => {
                        if (tempNearbyCategory.includes('all')) {
                          setTempNearbyCategory(['charnel', 'natural', 'park'].filter(v => v !== tab.value));
                        } else if (tempNearbyCategory.includes(tab.value)) {
                          const nc = tempNearbyCategory.filter(c => c !== tab.value);
                          setTempNearbyCategory(nc.length === 0 ? ['all'] : nc);
                        } else {
                          const nc = [...tempNearbyCategory, tab.value];
                          setTempNearbyCategory(nc.length === 3 ? ['all'] : nc);
                        }
                      }}
                      size="md"
                      color="violet"
                      styles={{ label: { fontSize: '15px', fontWeight: 500, cursor: 'pointer' }, input: { cursor: 'pointer' } }}
                    />
                  ))}
                </Stack>
                <div style={{ height: 1, backgroundColor: '#f1f3f5', margin: '20px 0' }} />
                <Checkbox
                  label="문의 가격 시설 제외"
                  checked={tempNearbyHideInquiry}
                  onChange={() => setTempNearbyHideInquiry(!tempNearbyHideInquiry)}
                  size="md"
                  color="violet"
                  styles={{ label: { fontSize: '15px', fontWeight: 500, cursor: 'pointer' }, input: { cursor: 'pointer' } }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderTop: '1px solid #f1f3f5', marginTop: 'auto' }}>
                <button
                  onClick={() => { setTempNearbyCategory(['all']); setTempNearbyHideInquiry(false); }}
                  style={{ flex: '0 0 auto', height: 48, padding: '0 20px', backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                  선택해제
                </button>
                <button
                  onClick={() => {
                    setNearbyCategory(tempNearbyCategory);
                    setNearbyHideInquiry(tempNearbyHideInquiry);
                    setNearbyDrawerOpen(false);
                  }}
                  style={{ flex: 1, height: 48, backgroundColor: '#1D0098', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  적용하기
                </button>
              </div>
            </Drawer>

            {/* 시설 리스트 */}
            <ScrollArea style={{ flex: 1 }}>
              {nearby.length === 0 ? (
                <Center h="200px" px="md">
                  <Text c="dimmed" ta="center">해당 지역에 시설이 없습니다.</Text>
                </Center>
              ) : (
                <Stack p="md" gap="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="sm" c="dimmed" fw={500}>검색 결과 {nearby.length}개</Text>
                    <Checkbox
                      label="문의시설 제외"
                      checked={nearbyHideInquiry}
                      onChange={() => setNearbyHideInquiry(!nearbyHideInquiry)}
                      size="xs"
                      color="violet"
                      styles={{ label: { fontSize: '12px', cursor: 'pointer', color: '#868e96', paddingLeft: 6 }, input: { cursor: 'pointer' } }}
                    />
                  </div>
                  {nearby.slice(0, nearbyVisibleCount).map(facility => (
                    <Box key={facility.id}
                      onClick={() => {
                        // 주변 시설 리스트 닫기 + 상세 열기
                        setNearbyList(null);
                        if (mapRef.current && facility.coordinates) {
                          mapRef.current.panTo(facility.coordinates.lat, facility.coordinates.lng, 17, facility.id);
                        }
                        handleMarkerClick(facility);
                      }}
                      style={{ cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s ease' }}
                    >
                      <FacilityCard facility={facility} onClick={() => { }} />
                    </Box>
                  ))}
                  {nearbyVisibleCount < nearby.length && (
                    <Button variant="light" color="gray" fullWidth
                      onClick={() => setNearbyVisibleCount(p => p + 20)} mt="md"
                    >더 보기 ({Math.min(nearby.length - nearbyVisibleCount, 20)}개)</Button>
                  )}
                  <Box h={50} />
                </Stack>
              )}
            </ScrollArea>
          </Box>
        );
      })()}

      {/* 모바일 상세 팝업 (Full Page Overlay with Slide In/Out Animation) */}
      {
        isMobile && selectedFacility && (
          <>
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              @keyframes slideOutRight {
                from { transform: translateX(0); }
                to { transform: translateX(100%); }
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
                animation: isDetailClosing
                  ? 'slideOutRight 0.2s ease-in forwards'
                  : 'slideInRight 0.25s ease-out forwards',
              }}
              onAnimationEnd={() => {
                if (isDetailClosing) {
                  // 슬라이드아웃 완료 후 상태 정리
                  const currentId = new URLSearchParams(window.location.search).get('id');
                  // 브라우저 뒤로가기로 이미 URL에서 id 제거된 경우 router.push 불필요
                  if (currentId) {
                    router.push(pathname, { scroll: false });
                  }
                  // 지도 panTo는 다음 프레임에 처리
                  const coords = selectedFacility?.coordinates;
                  // 상태 즉시 정리
                  setSelectedFacility(null);
                  setIsDetailClosing(false);
                  // panTo는 cleanup 후 처리
                  if (coords && mapRef.current) {
                    requestAnimationFrame(() => {
                      mapRef.current?.panTo(coords.lat, coords.lng);
                    });
                  }
                }
              }}
            >
              <Box style={{ flex: 1, overflow: 'hidden' }}>
                <FacilityDetail
                  facility={selectedFacility}
                  onClose={() => {
                    // 🚀 슬라이드아웃 먼저 실행 → 애니메이션 끝나면 상태 정리
                    setIsDetailClosing(true);
                  }}
                  onSelectFacility={(id) => {
                    const fac = dbFacilities.find(f => f.id === id);
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

// 내 정보 패널 (PC 왼쪽 패널 안에서 렌더)
function MyInfoPanel({
  user,
  profile,
  favorites,
  allFacilities,
  onClose,
  onSignOut,
  onFacilityClick,
  router,
}: {
  user: any;
  profile: any;
  favorites: string[];
  allFacilities: any[];
  onClose: () => void;
  onSignOut: () => void;
  onFacilityClick: (fac: any) => void;
  router: any;
}) {
  const [showFavList, setShowFavList] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMyReviews, setShowMyReviews] = useState(false);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);

  // 내 이야기 로드
  useEffect(() => {
    const loadMyReviews = async () => {
      try {
        const supabase = (await import('@/lib/supabase')).getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/reviews/my', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) setMyReviews(await res.json());
      } catch { /* ignore */ }
    };
    loadMyReviews();
  }, []);

  const handleDeleteReview = async () => {
    if (!deleteReviewId) return;
    const review = myReviews.find(r => r.id === deleteReviewId);
    if (!review) return;
    setDeletingReview(true);
    try {
      const res = await fetch(`/api/facilities/${review.facilityId}/review`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, userId: user.id }),
      });
      if (res.ok) {
        setMyReviews(prev => prev.filter(r => r.id !== deleteReviewId));
      }
    } catch { /* ignore */ }
    setDeletingReview(false);
    setDeleteReviewId(null);
  };

  const displayName = profile?.nickname || user?.user_metadata?.full_name || user?.user_metadata?.name || '사용자';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const provider = user?.user_metadata?.provider === 'kakao' ? '카카오' : '휴대전화';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-';

  const favFacilities = allFacilities.filter(f => favorites.includes(String(f.id)));

  const handleDeleteAccount = async () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.')) return;
    try {
      await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      onSignOut();
      router.push('/');
    } catch { /* ignore */ }
  };

  return (
    <Box style={{ height: '100%', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
      {/* 헤더 */}
      <Box px="md" py={12} style={{ backgroundColor: '#302E92', position: 'sticky', top: 0, zIndex: 10 }}>
        <Group gap="md" align="center">
          <Box
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => {
              if (showFavList) setShowFavList(false);
              else if (showMyReviews) setShowMyReviews(false);
              else onClose();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'white' }}>arrow_back_ios_new</span>
          </Box>
          <Text size="md" fw={700} c="white">{showFavList ? '관심 시설' : showMyReviews ? '내 이야기' : '내 정보'}</Text>
        </Group>
      </Box>

      {showFavList ? (
        /* 관심 시설 리스트 */
        <Box p="md">
          {favFacilities.length === 0 ? (
            <Box py={60} style={{ textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#dee2e6' }}>favorite</span>
              <Text c="dimmed" size="sm" mt={12}>관심 시설이 없습니다</Text>
              <Text c="dimmed" size="xs" mt={4}>시설 상세 페이지에서 ♡를 눌러 추가하세요</Text>
            </Box>
          ) : (
            <Stack gap="sm">
              {favFacilities.map((fac) => (
                <Box
                  key={fac.id}
                  bg="white"
                  p="md"
                  style={{
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    border: '1px solid #f1f3f5',
                  }}
                  onClick={() => onFacilityClick(fac)}
                  onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={600} truncate>{fac.name}</Text>
                      <Group gap={4} mt={4}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#868e96' }}>location_on</span>
                        <Text size="xs" c="dimmed" truncate>{fac.address}</Text>
                      </Group>
                    </Box>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#adb5bd' }}>chevron_right</span>
                  </Group>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      ) : showMyReviews ? (
        /* 내 이야기 리스트 */
        <Box p="md">
          {myReviews.length === 0 ? (
            <Box py={60} style={{ textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#dee2e6' }}>chat_bubble</span>
              <Text c="dimmed" mt="sm">아직 작성한 이야기가 없어요</Text>
            </Box>
          ) : (
            <Stack gap="xs">
              {myReviews.map((review: any) => (
                <Box
                  key={review.id}
                  bg="white" p="md"
                  style={{ borderRadius: 12, cursor: 'pointer' }}
                  onClick={() => {
                    setShowMyReviews(false);
                    onClose();
                    onFacilityClick({ id: review.facilityId });
                  }}
                >
                  <Group justify="space-between" mb={4}>
                    <Group gap={4}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} style={{ color: s <= review.rating ? '#fcc419' : '#dee2e6', fontSize: 14 }}>★</span>
                      ))}
                    </Group>
                    <Group gap={8}>
                      <Text size="xs" c="dimmed">
                        {new Date(review.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </Text>
                      <Box
                        onClick={(e: any) => { e.stopPropagation(); setDeleteReviewId(review.id); }}
                        style={{ cursor: 'pointer', padding: 4, borderRadius: 6 }}
                        onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#fff5f5'; }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#adb5bd' }}>delete</span>
                      </Box>
                    </Group>
                  </Group>
                  <Text size="sm" lineClamp={2}>{review.content}</Text>
                  <Text size="xs" c="dimmed" mt={4}>{review.facilityId}</Text>
                </Box>
              ))}
            </Stack>
          )}

          {/* 이야기 삭제 확인 모달 */}
          {deleteReviewId && (
            <Box style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }} onClick={() => setDeleteReviewId(null)}>
              <Box
                bg="white" p="xl"
                style={{ borderRadius: 16, width: 280, textAlign: 'center', animation: 'scaleIn 0.2s ease-out' }}
                onClick={(e: any) => e.stopPropagation()}
              >
                <Text size="md" fw={700} mb={4}>이야기 삭제</Text>
                <Text size="sm" c="dimmed" mb={20}>이 이야기를 삭제하시겠습니까?</Text>
                <Group justify="center" gap={8}>
                  <button
                    onClick={() => setDeleteReviewId(null)}
                    style={{ padding: '10px 28px', borderRadius: 10, flex: 1, backgroundColor: '#f1f3f5', border: 'none', fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer' }}
                  >아니오</button>
                  <button
                    onClick={handleDeleteReview}
                    disabled={deletingReview}
                    style={{ padding: '10px 28px', borderRadius: 10, flex: 1, backgroundColor: '#e03131', border: 'none', fontSize: 14, fontWeight: 600, color: 'white', cursor: deletingReview ? 'not-allowed' : 'pointer' }}
                  >{deletingReview ? '삭제 중...' : '예'}</button>
                </Group>
              </Box>
              <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            </Box>
          )}
        </Box>
      ) : (
        <>
          {/* 프로필 카드 */}
          <Box p="md">
            <Box p="lg" bg="white" style={{ borderRadius: 16, textAlign: 'center' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', display: 'block' }} />
              ) : (
                <Box style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#302E92', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Text c="white" fw={700} size="lg">{displayName.charAt(0)}</Text>
                </Box>
              )}
              <Text size="md" fw={700} mb={2}>{displayName}</Text>
              <Text size="xs" c="dimmed">{provider} 로그인</Text>
            </Box>
          </Box>

          {/* 계정 정보 */}
          <Box px="md" pb="sm">
            <Text size="xs" c="dimmed" mb={6} fw={600} px={4}>계정 정보</Text>
            <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <MiniInfoRow label="닉네임" value={displayName} />
              <MiniInfoRow label="로그인 방식" value={provider} />
              <MiniInfoRow label="가입일" value={createdAt} last />
            </Stack>
          </Box>

          {/* 관심 시설 */}
          <Box px="md" pb="sm">
            <Box
              bg="white" px="md" py={14}
              style={{ borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background-color 0.15s' }}
              onClick={() => setShowFavList(true)}
              onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'white'; }}
            >
              <Group gap={8}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ff6b6b', fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <Text size="sm" fw={500}>관심 시설</Text>
              </Group>
              <Group gap={4}>
                <Text size="sm" fw={700} style={{ color: 'var(--mantine-color-brand-7)' }}>{favorites.length}개</Text>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#adb5bd' }}>chevron_right</span>
              </Group>
            </Box>
          </Box>

          {/* 내 이야기 */}
          <Box px="md" pb="sm">
            <Box
              bg="white" px="md" py={14}
              style={{ borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background-color 0.15s' }}
              onClick={() => setShowMyReviews(true)}
              onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'white'; }}
            >
              <Group gap={8}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#302E92' }}>chat_bubble</span>
                <Text size="sm" fw={500}>내 이야기</Text>
              </Group>
              <Group gap={4}>
                <Text size="sm" fw={700} style={{ color: 'var(--mantine-color-brand-7)' }}>{myReviews.length}개</Text>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#adb5bd' }}>chevron_right</span>
              </Group>
            </Box>
          </Box>

          {/* 약관 동의 */}
          <Box px="md" pb="sm">
            <Text size="xs" c="dimmed" mb={6} fw={600} px={4}>약관 동의 현황</Text>
            <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <MiniInfoRow label="이용약관" value={profile?.agreed_terms ? '✅ 동의' : '미동의'} />
              <MiniInfoRow label="개인정보" value={profile?.agreed_privacy ? '✅ 동의' : '미동의'} />
              <MiniInfoRow label="마케팅 수신" value={profile?.agreed_marketing ? '✅ 동의' : '미동의'} last />
            </Stack>
          </Box>

          {/* 액션 */}
          <Box px="md" pb="lg">
            <Stack gap={8}>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px', borderRadius: 12,
                  backgroundColor: 'white', border: '1px solid #e9ecef',
                  fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                로그아웃
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px', borderRadius: 12,
                  backgroundColor: 'transparent', border: 'none',
                  fontSize: 13, color: '#adb5bd', cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                회원 탈퇴
              </button>
            </Stack>
          </Box>
        </>
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <Box style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)',
        }} onClick={() => setShowLogoutConfirm(false)}>
          <Box
            bg="white" p="xl"
            style={{
              borderRadius: 16, width: 280, textAlign: 'center',
              animation: 'scaleIn 0.2s ease-out',
            }}
            onClick={(e: any) => e.stopPropagation()}
          >
            <Text size="md" fw={700} mb={4}>로그아웃</Text>
            <Text size="sm" c="dimmed" mb={20}>로그아웃 하시겠습니까?</Text>
            <Group justify="center" gap={8}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '10px 28px', borderRadius: 10, flex: 1,
                  backgroundColor: '#f1f3f5', border: 'none',
                  fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer',
                }}
              >
                아니오
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); onSignOut(); }}
                style={{
                  padding: '10px 28px', borderRadius: 10, flex: 1,
                  backgroundColor: '#302E92', border: 'none',
                  fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
                }}
              >
                예
              </button>
            </Group>
          </Box>
          <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </Box>
      )}
    </Box>
  );
}

function MiniInfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <Box px="md" py={12} style={{ borderBottom: last ? 'none' : '1px solid #f1f3f5' }}>
      <Group justify="space-between">
        <Text size="xs" c="dimmed">{label}</Text>
        <Text size="sm" fw={500}>{value}</Text>
      </Group>
    </Box>
  );
}
