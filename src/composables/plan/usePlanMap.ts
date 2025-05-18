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

    // const infoWindow = new google.maps.InfoWindow();

    // places.forEach((place, i) => {
    //   const pin = new PinElement({
    //     glyph: `${i + 1}`,
    //     background: '#3189C6',
    //     borderColor: '#ffffff',
    //     glyphColor: '#ffffff',
    //   });

    //   const marker = new AdvancedMarkerElement({
    //     position: { lat: place.lat, lng: place.lng },
    //     map,
    //     title: place.name,
    //     content: pin.element,
    //     gmpClickable: true,
    //   });

    //   // InfoWindow 이벤트 연결
    //   marker.addListener('gmp-click', () => {
    //     infoWindow.close();
    //     infoWindow.setContent(`<strong>${place.name}</strong>`);
    //     infoWindow.open(map, marker as unknown as google.maps.MVCObject);
    //   });
    // });
    return map;
  };

  async function addMarkerForDay(day: number, place: PlaceResult, order: number) {
    const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;

    const dayColors = ['#3189C6', '#FF657C', '#5AB4F0', '#FDBA74']; // day1~day4 색상

    const pin = new PinElement({
      glyph: String(order), // 1, 2, 3 등 순서
      background: dayColors[day - 1] ?? '#888',
      borderColor: '#ffffff',
      glyphColor: '#ffffff',
    });

    const marker = new AdvancedMarkerElement({
      map,
      position: place.location,
      content: pin.element,
    }) as CustomMarker;

    marker.placeId = place.placeId;
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
