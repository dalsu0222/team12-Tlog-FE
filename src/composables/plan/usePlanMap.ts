import { Loader } from '@googlemaps/js-api-loader';
import { ref } from 'vue';
import type { PlaceResult } from './usePlaceSearch';

interface CustomMarker extends google.maps.marker.AdvancedMarkerElement {
  placeId: string;
  day: number;
  type: 'accommodation' | 'place';
}

// DayPlan 타입 정의 (TestView.vue와 동일)
interface DayPlan {
  accommodation?: PlaceResult;
  places: PlaceResult[];
}

export const dayColors = [
  '#FF6B6B', // 빨강
  '#FFA94D', // 오렌지
  '#FFD43B', // 노랑
  '#69DB7C', // 연초록
  '#4DABF7', // 하늘
  '#9775FA', // 보라
  '#FF87CA', // 핑크
  '#A9E34B', // 연두
  '#40C057', // 진초록
  '#A9A9A9', // 회색
];

export function usePlanMap() {
  const markers = ref<CustomMarker[]>([]);
  const polylines = ref<Map<number, google.maps.Polyline>>(new Map()); // day별 polyline 저장 (단일 polyline)
  const loader = new Loader({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    version: 'weekly',
  });

  let map: google.maps.Map | null = null;
  let infoWindow: google.maps.InfoWindow;

  const searchClickMarker = ref<google.maps.marker.AdvancedMarkerElement | null>(null);
  let AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;

  const initMap = async () => {
    const { Map: GoogleMap } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary;
    const markerLib = (await loader.importLibrary('marker')) as google.maps.MarkerLibrary;
    AdvancedMarkerElement = markerLib.AdvancedMarkerElement;

    map = new GoogleMap(document.getElementById('map') as HTMLElement, {
      center: { lat: 37.501274, lng: 127.039585 },
      zoom: 10,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    });

    infoWindow = new google.maps.InfoWindow();

    // 사진 위 공백 버그 해결 - 한 번만 등록
    google.maps.event.addListener(infoWindow, 'domready', () => {
      const closeBtn = document.querySelector('.gm-ui-hover-effect') as HTMLElement;
      if (closeBtn) {
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '-4px';
        closeBtn.style.right = '-4px';
      }
    });

    return map;
  };

  // 가격 레벨을 텍스트로 변환
  function getPriceLevelText(priceLevel?: number): string {
    if (priceLevel === undefined) return '';

    switch (priceLevel) {
      case 0:
        return '무료';
      case 1:
        return '₩';
      case 2:
        return '₩₩';
      case 3:
        return '₩₩₩';
      case 4:
        return '₩₩₩₩';
      default:
        return '';
    }
  }

  // 장소 타입을 한국어로 변환 (숙소 타입 포함)
  function getPlaceTypeText(types?: string[]): string {
    if (!types || types.length === 0) return '';

    const typeMap: Record<string, string> = {
      lodging: '숙박시설',
      hotel: '호텔',
      motel: '모텔',
      restaurant: '음식점',
      tourist_attraction: '관광명소',
      museum: '박물관',
      park: '공원',
      shopping_mall: '쇼핑몰',
      cafe: '카페',
      bar: '바',
      night_club: '클럽',
      spa: '스파',
      gym: '헬스장',
      resort: '리조트',
      campground: '캠핑장',
      rv_park: 'RV파크',
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    return '';
  }

  // 숙소인지 확인하는 함수
  function isAccommodation(types?: string[]): boolean {
    if (!types) return false;

    const accommodationTypes = ['lodging', 'hotel', 'motel', 'resort', 'campground', 'rv_park'];

    return types.some(type => accommodationTypes.includes(type));
  }

  // 풍부한 InfoWindow 콘텐츠 생성
  function createRichInfoWindowContent(place: PlaceResult): string {
    // 평점 표시
    const ratingHTML = place.rating
      ? `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="color:#FFD700;font-size:16px;">★</span>
          <span style="font-weight:bold;color:#333;">${place.rating.toFixed(1)}</span>
          ${place.userRatingsTotal ? `<span style="color:#666;font-size:12px;">(${place.userRatingsTotal}개)</span>` : ''}
          ${place.priceLevel !== undefined ? `<span style="margin-left:8px;color:#1976D2;font-weight:bold;">${getPriceLevelText(place.priceLevel)}</span>` : ''}
        </div>
      `
      : '';

    // 장소 타입 표시 (숙소는 다른 색상으로)
    const placeTypeText = getPlaceTypeText(place.types);
    const isAccommodationPlace = isAccommodation(place.types);

    const typeHTML = placeTypeText
      ? `<div style="display:inline-block;background:${isAccommodationPlace ? '#E8F5E8' : '#E3F2FD'};color:${isAccommodationPlace ? '#2E7D32' : '#1976D2'};padding:3px 8px;border-radius:12px;font-size:11px;margin-bottom:8px;">${placeTypeText}</div>`
      : '';

    // 연락처 정보 - 가로 배치
    const contactHTML =
      place.phoneNumber || place.website
        ? `
        <div style="display:flex;gap:12px;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
          ${
            place.phoneNumber
              ? `
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="color:#666;font-size:12px;">📞</span>
              <span style="color:#666;font-size:12px;">${place.phoneNumber}</span>
            </div>
          `
              : ''
          }
          ${
            place.website
              ? `
            <div>
              <a href="${place.website}" target="_blank" style="color:#1976D2;font-size:12px;text-decoration:none;display:flex;align-items:center;gap:4px;">
                <span>🌐</span>
                <span>웹사이트</span>
              </a>
            </div>
          `
              : ''
          }
        </div>
      `
        : '';

    // 메인 콘텐츠를 가로로 배치
    const hasImage = !!place.photoUrl;

    return `
      <div style="
        font-size:14px;
        width:320px;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        display:flex;
        gap:12px;
        align-items:flex-start;
      ">
        ${
          hasImage
            ? `
          <div style="flex-shrink:0;">
            <img src="${place.photoUrl}" alt="${place.name}" style="
              width:100px;
              height:80px;
              object-fit:cover;
              border-radius:8px;
            " />
          </div>
        `
            : ''
        }
        
        <div style="flex:1;min-width:0;">
          <div>
            <strong style="font-size:16px;color:#333;display:block;margin-bottom:4px;">${place.name}</strong>
            ${typeHTML}
          </div>
          
          ${ratingHTML}
          
          <div style="color:#666;font-size:12px;margin-bottom:6px;line-height:1.3;">
            📍 ${place.address.length > 40 ? place.address.substring(0, 40) + '...' : place.address}
          </div>
          
          ${
            place.description
              ? `
            <div style="color:#555;font-size:12px;line-height:1.3;margin-bottom:6px;">
              ${place.description.length > 60 ? place.description.substring(0, 60) + '...' : place.description}
            </div>
          `
              : ''
          }
          
          ${contactHTML}
        </div>
      </div>
    `;
  }

  // 간소화된 InfoWindow 콘텐츠 생성 (편집/디테일 모드용)
  function createSimpleInfoWindowContent(place: PlaceResult): string {
    // 장소 타입 표시 (숙소는 다른 색상으로)
    const placeTypeText = getPlaceTypeText(place.types);
    const isAccommodationPlace = isAccommodation(place.types);

    const typeHTML = placeTypeText
      ? `<div style="display:inline-block;background:${isAccommodationPlace ? '#E8F5E8' : '#E3F2FD'};color:${isAccommodationPlace ? '#2E7D32' : '#1976D2'};padding:3px 8px;border-radius:12px;font-size:11px;margin-top:4px;">${placeTypeText}</div>`
      : '';

    // 메인 콘텐츠를 가로로 배치
    const hasImage = !!place.photoUrl;

    return `
    <div style="
      font-size:14px;
      width:280px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      display:flex;
      gap:12px;
      align-items:flex-start;
    ">
      ${
        hasImage
          ? `
        <div style="flex-shrink:0;">
          <img src="${place.photoUrl}" alt="${place.name}" style="
            width:80px;
            height:60px;
            object-fit:cover;
            border-radius:8px;
          " />
        </div>
      `
          : ''
      }
      
      <div style="flex:1;min-width:0;">
        <div>
          <strong style="font-size:16px;color:#333;display:block;margin-bottom:4px;">${place.name}</strong>
          ${typeHTML}
        </div>
      </div>
    </div>
  `;
  }

  // 예쁜 커스텀 마커 생성 함수
  function createCustomMarker(
    order: number,
    color: string,
    type: 'day' | 'search' | 'accommodation' = 'day'
  ) {
    const markerElement = document.createElement('div');

    if (type === 'accommodation') {
      // 숙소 마커 - 호텔 모양의 사각형 마커
      markerElement.innerHTML = `
        <div style="
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.2));
        ">
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%);
            border-radius: 8px;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <span style="
              color: white;
              font-size: 18px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            ">🏨</span>
          </div>
        </div>
      `;
    } else if (type === 'search') {
      // 검색 결과 마커 - A1DBFF 색상 적용한 깔끔한 스타일
      markerElement.innerHTML = `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        ">
          <div style="
            width: 32px;
            height: 32px;
            background: #A1DBFF;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <div style="
              font-size: 16px;
              color: white;
            ">📍</div>
          </div>
        </div>
      `;
    } else {
      // 일정 마커 - 동그란 스타일
      markerElement.innerHTML = `
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.2));
        ">
          <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%);
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <span style="
              color: white;
              font-weight: bold;
              font-size: 14px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            ">${order}</span>
          </div>
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid white;
          "></div>
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 6px solid ${color};
          "></div>
        </div>
      `;
    }

    return markerElement;
  }

  // 색상 밝기 조절 함수
  function adjustColorBrightness(color: string, percent: number) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  // 특정 일차의 polyline 업데이트 - 수정된 버전
  function updatePolylineForDay(day: number, dayPlan: DayPlan) {
    if (!map) return;

    // 경로 점들 구성
    const path: google.maps.LatLngLiteral[] = [];

    // Case 1: 숙소가 있는 경우
    if (dayPlan.accommodation) {
      // 숙소를 시작점으로 추가
      path.push(dayPlan.accommodation.location.toJSON());

      // 모든 장소들을 순서대로 추가
      dayPlan.places.forEach(place => {
        path.push(place.location.toJSON());
      });

      // 다시 숙소로 돌아오는 경로 추가 (장소가 하나 이상 있을 때만)
      if (dayPlan.places.length > 0) {
        path.push(dayPlan.accommodation.location.toJSON());
      }
    }
    // Case 2: 숙소가 없는 경우 - 장소들끼리만 연결
    else {
      // 장소들을 순서대로 연결
      dayPlan.places.forEach(place => {
        path.push(place.location.toJSON());
      });
    }

    // 경로가 2개 미만이면 polyline 제거
    if (path.length < 2) {
      const existingPolyline = polylines.value.get(day);
      if (existingPolyline) {
        console.log(`Day ${day}: 경로 부족 - polyline 제거`);
        existingPolyline.setMap(null);
        polylines.value.delete(day);
      }
      return;
    }

    // 기존 polyline이 있으면 path만 업데이트
    const existingPolyline = polylines.value.get(day);
    if (existingPolyline) {
      console.log(`Day ${day}: 기존 polyline path 업데이트, 경로 점 개수: ${path.length}`);
      existingPolyline.setPath(path);
    } else {
      // 기존 polyline이 없으면 새로 생성
      console.log(`Day ${day}: 새 polyline 생성, 경로 점 개수: ${path.length}`);

      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: dayColors[day - 1] || '#888',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map: map,
        zIndex: 1,
        clickable: false,
      });

      polylines.value.set(day, polyline);
    }
  }

  // 특정 일차의 모든 마커를 다시 그리는 함수 (순서 번호 업데이트용)
  async function refreshMarkersForDay(
    day: number,
    dayPlan: DayPlan,
    useSimpleInfo: boolean = false
  ) {
    if (!map) return;

    // 해당 일차의 기존 마커들 제거
    const markersToRemove = markers.value.filter(marker => marker.day === day);
    markersToRemove.forEach(marker => {
      marker.map = null;
    });
    markers.value = markers.value.filter(marker => marker.day !== day);

    // 숙소 마커 다시 생성
    if (dayPlan.accommodation) {
      await addSingleMarker(day, dayPlan.accommodation, 'accommodation', undefined, useSimpleInfo);
    }

    // 장소 마커들 순서대로 다시 생성
    for (let i = 0; i < dayPlan.places.length; i++) {
      await addSingleMarker(day, dayPlan.places[i], 'place', i + 1, useSimpleInfo);
    }

    // Polyline 업데이트
    updatePolylineForDay(day, dayPlan);
  }

  // 단일 마커 생성 헬퍼 함수
  async function addSingleMarker(
    day: number,
    place: PlaceResult,
    type: 'accommodation' | 'place',
    order?: number,
    useSimpleInfo: boolean = false // 새로운 옵션 추가
  ) {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;

    let markerElement;

    if (type === 'accommodation') {
      markerElement = createCustomMarker(0, dayColors[day - 1] ?? '#888', 'accommodation');
    } else {
      markerElement = createCustomMarker(order!, dayColors[day - 1] ?? '#888', 'day');
    }

    // 마커 생성
    const marker = new AdvancedMarkerElement({
      map,
      position: place.location,
      content: markerElement,
      gmpClickable: true,
    }) as CustomMarker;

    marker.placeId = place.placeId;
    marker.day = day;
    marker.type = type;

    // 클릭 이벤트 추가 - 풍부한 정보창 표시
    marker.addEventListener('gmp-click', () => {
      infoWindow.close();
      const content = useSimpleInfo
        ? createSimpleInfoWindowContent(place)
        : createRichInfoWindowContent(place);
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
      map?.panTo(place.location);
    });

    markers.value.push(marker);

    // 장소가 추가되면 검색 마커 제거
    if (searchClickMarker.value) {
      searchClickMarker.value.map = null;
      searchClickMarker.value = null;
    }
  }

  // 기존 addMarkerForDay 함수를 단순화
  async function addMarkerForDay(
    day: number,
    place: PlaceResult,
    orderOrType: number | 'accommodation',
    dayPlan: DayPlan,
    useSimpleInfo: boolean = false
  ) {
    if (orderOrType === 'accommodation') {
      await addSingleMarker(day, place, 'accommodation', undefined, useSimpleInfo);
    } else {
      await addSingleMarker(day, place, 'place', orderOrType as number, useSimpleInfo);
    }

    // Polyline 업데이트
    updatePolylineForDay(day, dayPlan);
  }

  // 마커 제거 후 해당 일차 전체 새로고침
  async function removeMarkerForDay(day: number, dayPlan: DayPlan, useSimpleInfo: boolean = false) {
    // 전체 마커 새로고침으로 순서 번호 업데이트
    await refreshMarkersForDay(day, dayPlan, useSimpleInfo);
  }

  // 새로운 함수: 드래그로 순서 변경 시 호출
  async function updateMarkersForDayPlan(
    day: number,
    dayPlan: DayPlan,
    useSimpleInfo: boolean = false
  ) {
    await refreshMarkersForDay(day, dayPlan, useSimpleInfo);
  }

  function moveToLocation(position: google.maps.LatLng | google.maps.LatLngLiteral) {
    map?.setCenter(position);
    map?.setZoom(15);
  }

  // 이미 추가된 장소의 기존 마커 찾기
  function findExistingMarker(placeId: string): CustomMarker | null {
    return markers.value.find(marker => marker.placeId === placeId) || null;
  }

  // 검색 결과 클릭 시 마커 표시 및 infoWindow 표시 - 수정된 버전
  function showMarkerForSearchClick(
    place: PlaceResult,
    dayPlans: Record<number, DayPlan>,
    useSimpleInfo: boolean = false
  ) {
    if (!map) return;

    // 이미 일정에 추가된 장소인지 확인 (숙소와 일반 장소 모두 확인)
    const isAlreadyPlanned = Object.values(dayPlans).some(
      dayPlan =>
        dayPlan.accommodation?.placeId === place.placeId ||
        dayPlan.places.some(p => p.placeId === place.placeId)
    );

    // 이미 추가된 장소라면 기존 마커에서 infoWindow 표시
    if (isAlreadyPlanned) {
      const existingMarker = findExistingMarker(place.placeId);
      if (existingMarker) {
        // 기존 검색 마커가 있다면 제거
        if (searchClickMarker.value) {
          searchClickMarker.value.map = null;
          searchClickMarker.value = null;
        }

        // 기존 마커에서 infoWindow 표시
        infoWindow.close();
        const content = useSimpleInfo
          ? createSimpleInfoWindowContent(place)
          : createRichInfoWindowContent(place);
        infoWindow.setContent(content);
        infoWindow.open(map, existingMarker);
        map?.panTo(place.location);
        return;
      }
    }

    // 새로운 장소인 경우 검색 마커 생성
    // 기존 검색 마커가 있다면 제거
    if (searchClickMarker.value) {
      searchClickMarker.value.map = null;
      searchClickMarker.value = null;
    }

    // 검색용 커스텀 마커 생성
    const markerElement = createCustomMarker(0, '', 'search');

    searchClickMarker.value = new AdvancedMarkerElement({
      map,
      position: place.location.toJSON(),
      content: markerElement,
      gmpClickable: true,
    });

    // 검색 마커 클릭 시 정보창 표시 - 풍부한 정보창 표시
    searchClickMarker.value.addEventListener('gmp-click', () => {
      infoWindow.close();
      const content = useSimpleInfo
        ? createSimpleInfoWindowContent(place)
        : createRichInfoWindowContent(place);
      infoWindow.setContent(content);
      infoWindow.open(map, searchClickMarker.value);
    });

    // ✅ 마커 생성 직후 infoWindow 자동 오픈
    infoWindow.close();
    const content = useSimpleInfo
      ? createSimpleInfoWindowContent(place)
      : createRichInfoWindowContent(place);
    infoWindow.setContent(content);
    infoWindow.open(map, searchClickMarker.value);
  }

  // 모든 polyline 제거 (필요시 사용)
  function clearAllPolylines() {
    polylines.value.forEach(polyline => {
      polyline.setMap(null);
    });
    polylines.value.clear();
  }

  // 모든 마커 제거 함수 추가
  function clearAllMarkers() {
    markers.value.forEach(marker => {
      marker.map = null;
    });
    markers.value = [];

    // 검색 마커도 제거
    if (searchClickMarker.value) {
      searchClickMarker.value.map = null;
      searchClickMarker.value = null;
    }
  }

  // 특정 placeId의 마커가 이미 존재하는지 확인
  function hasMarkerForPlace(placeId: string): boolean {
    return markers.value.some(marker => marker.placeId === placeId);
  }

  // 마커 추가 전 중복 체크를 포함한 안전한 마커 추가 함수
  async function addMarkerSafely(
    day: number,
    place: PlaceResult,
    orderOrType: number | 'accommodation',
    dayPlan: DayPlan,
    useSimpleInfo: boolean = false
  ) {
    // 이미 해당 장소의 마커가 있는지 확인
    if (hasMarkerForPlace(place.placeId)) {
      console.log(`마커가 이미 존재함: ${place.name} (${place.placeId})`);
      return;
    }

    // 기존 addMarkerForDay 로직 실행
    await addMarkerForDay(day, place, orderOrType, dayPlan, useSimpleInfo);
  }

  // 편집 모드에서 기존 계획 데이터의 마커들을 한 번에 추가하는 함수
  async function addExistingPlanMarkers(dayPlans: Record<number, DayPlan>) {
    // 기존 마커들 모두 제거
    clearAllMarkers();
    clearAllPolylines();

    console.log('기존 계획 마커 추가 시작:', dayPlans);

    for (const [dayStr, dayPlan] of Object.entries(dayPlans)) {
      const day = Number(dayStr);

      // 숙소 마커 추가
      if (dayPlan.accommodation) {
        console.log(`Day ${day} 숙소 마커 추가:`, dayPlan.accommodation.name);
        await addSingleMarker(day, dayPlan.accommodation, 'accommodation', undefined, true);
      }

      // 일반 장소 마커들 추가
      for (let i = 0; i < dayPlan.places.length; i++) {
        const place = dayPlan.places[i];
        console.log(`Day ${day} 장소 ${i + 1} 마커 추가:`, place.name);
        await addSingleMarker(day, place, 'place', i + 1, true);
      }

      // 해당 일차의 polyline 업데이트
      updatePolylineForDay(day, dayPlan);
    }
  }

  return {
    initMap,
    addMarkerForDay,
    removeMarkerForDay,
    updateMarkersForDayPlan, // 새로 추가된 함수
    moveToLocation,
    showMarkerForSearchClick,
    clearAllPolylines,

    // 새로 추가된 함수들
    clearAllMarkers,
    hasMarkerForPlace,
    addMarkerSafely,
    addExistingPlanMarkers,
  };
}
