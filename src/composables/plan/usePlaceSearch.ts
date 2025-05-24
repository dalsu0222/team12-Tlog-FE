import { ref } from 'vue';

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  photoUrl?: string;
  location: google.maps.LatLng;
  // 추가된 필드들
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  businessStatus?: string;
  types?: string[];
  description?: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: {
    isOpen: boolean;
    periods?: google.maps.places.OpeningHoursPeriod[];
  };
};

export function usePlaceSearch() {
  const query = ref('');
  const places = ref<PlaceResult[]>([]);
  const isLoading = ref(false);

  // 가격 레벨을 텍스트로 변환
  function getPriceLevelText(priceLevel?: number): string {
    if (priceLevel === undefined) return '';

    switch (priceLevel) {
      case 0:
        return '무료';
      case 1:
        return '저렴 (₩)';
      case 2:
        return '보통 (₩₩)';
      case 3:
        return '비쌈 (₩₩₩)';
      case 4:
        return '매우 비쌌 (₩₩₩₩)';
      default:
        return '';
    }
  }

  // 장소 타입을 한국어로 변환
  function getPlaceTypeText(types?: string[]): string {
    if (!types || types.length === 0) return '';

    const typeMap: Record<string, string> = {
      lodging: '숙박시설',
      hotel: '호텔',
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
      hospital: '병원',
      pharmacy: '약국',
      gas_station: '주유소',
      bank: '은행',
      atm: 'ATM',
      subway_station: '지하철역',
      bus_station: '버스정류장',
      airport: '공항',
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    return types[0]?.replace(/_/g, ' ') || '';
  }

  // 현재 영업 상태 확인
  function getCurrentOpenStatus(openingHours?: PlaceResult['openingHours']): string {
    if (!openingHours) return '';

    if (openingHours.isOpen === true) {
      return '영업 중';
    } else if (openingHours.isOpen === false) {
      return '영업 종료';
    }

    return '';
  }

  async function searchPlaces() {
    isLoading.value = true;
    try {
      const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;

      const request = {
        textQuery: query.value,
        fields: [
          'displayName',
          'location',
          'formattedAddress',
          'photos',
          'rating',
          'userRatingCount',
          'priceLevel',
          'businessStatus',
          'types',
          'editorialSummary',
          'nationalPhoneNumber',
          'websiteURI',
          'regularOpeningHours',
        ],
        region: 'kr',
        maxResultCount: 20,
        language: 'ko',
      };

      const response = await Place.searchByText(request);

      places.value = (response?.places || []).map(p => {
        // 설명 생성 (editorialSummary가 없으면 타입 기반으로 생성)
        let description = p.editorialSummary || '';
        if (!description && p.types) {
          const mainType = getPlaceTypeText(p.types);
          if (mainType === '숙박시설' || mainType === '호텔') {
            description = '편안한 숙박을 위한 최적의 장소입니다.';
          } else if (mainType === '음식점') {
            description = '맛있는 음식을 즐길 수 있는 곳입니다.';
          } else if (mainType === '관광명소') {
            description = '꼭 방문해보시길 추천하는 명소입니다.';
          } else if (mainType === '카페') {
            description = '좋은 분위기에서 커피를 즐길 수 있습니다.';
          } else {
            description = `${mainType} 서비스를 제공하는 장소입니다.`;
          }
        }

        return {
          placeId: p.id ?? '',
          name: p.displayName ?? '',
          address: p.formattedAddress ?? '',
          photoUrl: p.photos?.[0]?.getURI?.() ?? '',
          location: p.location ?? new google.maps.LatLng(0, 0),
          rating: p.rating || undefined,
          userRatingsTotal: p.userRatingCount || undefined,
          priceLevel: p.priceLevel ? Number(p.priceLevel) : undefined,
          businessStatus: p.businessStatus || undefined,
          types: p.types || undefined,
          description: description || undefined,
          phoneNumber: p.nationalPhoneNumber || undefined,
          website: p.websiteURI || undefined,
          openingHours: p.regularOpeningHours
            ? {
                isOpen: p.regularOpeningHours.periods ? true : false,
                periods: p.regularOpeningHours.periods || undefined,
              }
            : undefined,
        };
      });
    } catch (error) {
      console.error('장소 검색 오류:', error);
      places.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  return {
    query,
    places,
    isLoading,
    searchPlaces,
    getPriceLevelText,
    getPlaceTypeText,
    getCurrentOpenStatus,
  };
}
