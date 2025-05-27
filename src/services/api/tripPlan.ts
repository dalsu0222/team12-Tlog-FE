import api from './api';
import type { ApiResponse } from './types';

export interface CreateTripPlanRequest {
  friendUserIds: number[];
  cityId: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  title: string;
  places: {
    placeId: string;
    name: string;
    latitude: number;
    longitude: number;
    day: number;
    order: number;
    placeType: 1 | 2; // 1: 숙소, 2: 명소
  }[];
}

export interface CreateTripPlanResponse {
  tripId: number;
}

export const createTripPlan = async (
  data: CreateTripPlanRequest
): Promise<ApiResponse<CreateTripPlanResponse>> => {
  const response = await api.post('/api/trips/plan', data);
  return response.data;
};

export const updateTripPlan = async (
  tripId: number,
  data: CreateTripPlanRequest
): Promise<ApiResponse<CreateTripPlanResponse>> => {
  const response = await api.put(`/api/trips/${tripId}/plan`, data);
  return response.data;
};
