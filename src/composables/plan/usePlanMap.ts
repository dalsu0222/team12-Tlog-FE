import { Loader } from '@googlemaps/js-api-loader';
import { ref } from 'vue';
import type { PlaceResult } from './usePlaceSearch';

interface CustomMarker extends google.maps.marker.AdvancedMarkerElement {
  placeId: string;
}

export function usePlanMap() {
  const markers = ref<CustomMarker[]>([]);
  const loader = new Loader({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    version: 'weekly',
  });

  let map: google.maps.Map | null = null;
  let infoWindow: google.maps.InfoWindow;

  const searchClickMarker = ref<google.maps.marker.AdvancedMarkerElement | null>(null);
  let AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  let PinElement: typeof google.maps.marker.PinElement;

  const initMap = async () => {
    const { Map: GoogleMap } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary;
    const markerLib = (await loader.importLibrary('marker')) as google.maps.MarkerLibrary;
    AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
    PinElement = markerLib.PinElement;

    map = new GoogleMap(document.getElementById('map') as HTMLElement, {
      center: { lat: 37.501274, lng: 127.039585 },
      zoom: 10,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    });

    infoWindow = new google.maps.InfoWindow();

    return map;
  };

  async function addMarkerForDay(day: number, place: PlaceResult, order: number) {
    const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;

    const dayColors = ['#3189C6', '#FF657C', '#5AB4F0', '#FDBA74']; // day1~day4 색상

    // 마커 디자인 담당
    const pin = new PinElement({
      glyph: String(order), // 1, 2, 3 등 순서
      background: dayColors[day - 1] ?? '#888',
      borderColor: '#ffffff',
      glyphColor: '#ffffff',
    });

    // 마커 생성
    const marker = new AdvancedMarkerElement({
      map,
      position: place.location,
      content: pin.element,
      gmpClickable: true, // 추가해야 기존 마커 클릭이 됨.
    }) as CustomMarker;

    marker.placeId = place.placeId;
    // ✅ 클릭 이벤트 추가
    marker.addEventListener('gmp-click', () => {
      infoWindow.close(); // 기존 창 닫기

      const photoHTML = place.photoUrl
        ? `<img src="${place.photoUrl}" alt="${place.name}" style="width:100px;height:auto;border-radius:8px;margin-bottom:6px;" />`
        : '';

      infoWindow.setContent(`
        <div style="font-size:14px;max-width:200px;">
          ${photoHTML}
          <strong>${place.name}</strong><br />
          ${place.address}
        </div>
      `);

      // 사진 위 공백 버그 해결
      google.maps.event.addListener(infoWindow, 'domready', () => {
        const closeBtn = document.querySelector('.gm-ui-hover-effect') as HTMLElement;
        if (closeBtn) {
          closeBtn.style.position = 'absolute';
          closeBtn.style.top = '0';
          closeBtn.style.right = '0';
        }
      });

      infoWindow.open(map, marker);
      map?.panTo(place.location); // 마커 위치로 이동
    });

    markers.value.push(marker);
  }

  async function removeMarkerForDay(day: number, placeId: string) {
    const marker = markers.value.find(m => m.placeId === placeId);
    if (marker) {
      marker.map = null;
      markers.value = markers.value.filter(m => m !== marker);
    }
  }

  function moveToLocation(position: google.maps.LatLng | google.maps.LatLngLiteral) {
    // map 객체 초기화 되었는지 확인 필요(에러 처리)
    map?.setCenter(position);
    map?.setZoom(15);
  }

  // 검색 결과 클릭 시 마커 표시
  function showMarkerForSearchClick(place: PlaceResult, dayPlans: Record<number, PlaceResult[]>) {
    if (!map) return;

    const isAlreadyPlanned = Object.values(dayPlans).some(places =>
      places.some(p => p.placeId === place.placeId)
    );

    if (isAlreadyPlanned) return;

    if (!map) return;

    if (searchClickMarker.value) {
      searchClickMarker.value.map = null;
      searchClickMarker.value = null;
    }

    const pin = new PinElement({
      glyph: '📍',
      background: 'var(--color-primary)',
      borderColor: 'var(--color-gray-600)',
    });

    searchClickMarker.value = new AdvancedMarkerElement({
      map,
      position: place.location.toJSON(),
      content: pin.element,
    });
  }

  return {
    initMap,
    addMarkerForDay,
    removeMarkerForDay,
    moveToLocation,
    showMarkerForSearchClick,
  };
}
