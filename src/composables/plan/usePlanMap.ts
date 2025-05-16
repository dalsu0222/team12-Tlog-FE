import { Loader } from '@googlemaps/js-api-loader';

// ✅ 이렇게 바꿔서 테스트
export function usePlanMap() {
  const loader = new Loader({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    version: 'weekly',
  });

  const places = [
    { name: '마커 1', lat: 37.501274, lng: 127.039585 },
    { name: '마커 2', lat: 37.502, lng: 127.039 },
    { name: '마커 3', lat: 37.504, lng: 127.043 },
    { name: '마커 4', lat: 37.506, lng: 127.041 },
    { name: '마커 5', lat: 37.508, lng: 127.045 },
  ];

  const initMap = async () => {
    const { Map } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary;
    const { AdvancedMarkerElement, PinElement } = (await loader.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;

    const map = new Map(document.getElementById('map') as HTMLElement, {
      center: { lat: 37.501274, lng: 127.039585 },
      zoom: 15,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    });

    const infoWindow = new google.maps.InfoWindow();

    // ✅ map 지역변수 그대로 사용
    places.forEach((place, i) => {
      const pin = new PinElement({
        glyph: `${i + 1}`,
        background: '#3189C6',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
      });

      const marker = new AdvancedMarkerElement({
        position: { lat: place.lat, lng: place.lng },
        map,
        title: place.name,
        content: pin.element,
        gmpClickable: true,
      });

      // InfoWindow 이벤트 연결
      marker.addListener('gmp-click', () => {
        infoWindow.close();
        infoWindow.setContent(`<strong>${place.name}</strong>`);
        infoWindow.open(map, marker as unknown as google.maps.MVCObject);
      });
    });
  };

  return {
    initMap,
  };
}
