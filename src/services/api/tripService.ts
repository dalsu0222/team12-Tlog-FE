// services/api/tripService.ts
import api from './api'; // 기존 axios 인스턴스 import

// 응답 타입 정의
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// 여행 기록 목록 타입 정의
export interface TripRecordListResponse {
  trips: TripInfoDto[];
}

export interface TripInfoDto {
  trip: TripDto;
  tripParticipant: number[];
  hasStep1: boolean;
  hasStep2: boolean;
}

export interface TripDto {
  title: string;
  createdAt: string; // LocalDateTime -> string으로 변환됨
  startDate: string;
  endDate: string;
}

// 여행 Story 타입 정의 (프론트엔드에서 사용)
export interface TripStory {
  id: number; // 고유 ID (프론트엔드에서 생성)
  title: string;
  content: string; // 이제 여행 기간을 나타냄
  createdAt: string;
  isStep1Completed: boolean;
  isStep2Completed: boolean;
  participants: number[];
  startDate?: string; // 옵션이지만 추가하면 더 명확함
  endDate?: string; // 옵션이지만 추가하면 더 명확함
}

// 여행 기록 목록 조회 API - 모든 데이터를 가져옴
export const fetchAllTripRecords = async (): Promise<TripInfoDto[]> => {
  try {
    const response = await api.get<ApiResponse<TripRecordListResponse>>('/api/trips/record');

    // 개발 환경에서만: 데이터가 비어있을 때 더미 데이터 사용
    if (
      import.meta.env.DEV &&
      (!response.data.data.trips || response.data.data.trips.length === 0)
    ) {
      console.log('개발 모드: 더미 데이터 사용');
      return [
        {
          trip: {
            title: '도쿄 여행',
            createdAt: '2023-05-01T10:30:00',
            startDate: '2023-05-15T00:00:00',
            endDate: '2023-05-20T00:00:00',
          },
          tripParticipant: [2, 3],
          hasStep1: true,
          hasStep2: false,
        },
        {
          trip: {
            title: '제주도 여름 휴가',
            createdAt: '2023-06-10T14:20:00',
            startDate: '2023-07-20T00:00:00',
            endDate: '2023-07-25T00:00:00',
          },
          tripParticipant: [4],
          hasStep1: false,
          hasStep2: false,
        },
        {
          trip: {
            title: '부산 주말 여행',
            createdAt: '2023-04-05T09:15:00',
            startDate: '2023-04-15T00:00:00',
            endDate: '2023-04-17T00:00:00',
          },
          tripParticipant: [2, 5, 6],
          hasStep1: true,
          hasStep2: true,
        },
      ];
    }

    // 실제 API 응답 반환 (비어있을 수 있음)
    return response.data.data.trips || [];
  } catch (error) {
    console.error('여행 기록 목록 조회 실패:', error);

    // 개발 환경에서 에러 발생 시 더미 데이터 반환
    if (import.meta.env.DEV) {
      console.log('개발 모드: 에러 발생 시 더미 데이터 사용');
      return [
        // 더미 데이터
      ];
    }

    throw error;
  }
};

// TripInfoDto를 TripStory로 변환하는 함수
export const convertToTripStory = (tripInfo: TripInfoDto, index: number): TripStory => {
  // 여행 기간 계산
  const startDate = formatDate(tripInfo.trip.startDate);
  const endDate = formatDate(tripInfo.trip.endDate);
  const periodText = `${startDate} ~ ${endDate}`;

  return {
    id: index + 1, // 임시 ID 생성
    title: tripInfo.trip.title,
    content: periodText, // 여행 기간으로 변경
    createdAt: formatDate(tripInfo.trip.createdAt),
    isStep1Completed: tripInfo.hasStep1,
    isStep2Completed: tripInfo.hasStep2,
    participants: tripInfo.tripParticipant || [],
    startDate: startDate, // 필요하면 시작 날짜 추가
    endDate: endDate, // 필요하면 종료 날짜 추가
  };
};

// 날짜 형식 변환 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환
}
