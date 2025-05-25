import api from './api';

// API 응답 타입
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
  tripId: number;
  title: string;
  createdAt: string;
  startDate: string;
  endDate: string;
}

// 프론트에서 사용하는 타입
export interface TripStory {
  id: number;
  title: string;
  tripId?: number;
  content: string;
  createdAt: string;
  isStep1Completed: boolean;
  isStep2Completed: boolean;
  participants: number[];
  startDate?: string;
  endDate?: string;
}

// 여행 기록 목록 조회 API
export const fetchAllTripRecords = async (): Promise<TripInfoDto[]> => {
  try {
    const response = await api.get<ApiResponse<TripRecordListResponse>>('/api/trips/record');
    return response.data.data.trips || [];
  } catch (error) {
    console.error('여행 기록 목록 조회 실패:', error);
    throw error;
  }
};

// TripInfoDto -> TripStory 변환
export const convertToTripStory = (tripInfo: TripInfoDto, index: number): TripStory => {
  const startDate = formatDate(tripInfo.trip.startDate);
  const endDate = formatDate(tripInfo.trip.endDate);
  const periodText = `${startDate} ~ ${endDate}`;

  return {
    id: tripInfo.trip.tripId, // ✅ tripId를 고유 ID로 사용
    title: tripInfo.trip.title,
    tripId: tripInfo.trip.tripId,
    content: periodText,
    createdAt: formatDate(tripInfo.trip.createdAt),
    isStep1Completed: tripInfo.hasStep1,
    isStep2Completed: tripInfo.hasStep2,
    participants: tripInfo.tripParticipant || [],
    startDate,
    endDate,
  };
};

// 날짜 형식 변환 (YYYY-MM-DD)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}
