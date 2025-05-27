import api from './api';
import type { ApiResponse } from './types';

// 편집 락 획득 응답 타입
export interface EditLockResponse {
  success: boolean;
  heartbeatInterval?: number;
  currentOwner?: number;
}

// Heartbeat 응답 타입
export interface HeartbeatResponse {
  success: boolean;
  nextHeartbeat?: number;
  shouldRestart?: boolean;
}

// 편집 상태 응답 타입
export interface EditStatusResponse {
  locked: boolean;
  currentOwner?: number;
  timeRemaining?: number;
}

/**
 * 편집 모드 시작 (락 획득)
 * @param tripId 여행 ID
 * @returns API 응답
 */
export const startEditMode = async (tripId: number): Promise<ApiResponse<EditLockResponse>> => {
  const response = await api.post(`/api/trips/${tripId}/lock`);
  return response.data;
};

/**
 * Heartbeat 전송 (편집 중임을 알림)
 * @param tripId 여행 ID
 * @returns API 응답
 */
export const sendHeartbeat = async (tripId: number): Promise<ApiResponse<HeartbeatResponse>> => {
  const response = await api.post(`/api/trips/${tripId}/heartbeat`);
  return response.data;
};

/**
 * 편집 모드 종료 (락 해제)
 * @param tripId 여행 ID
 * @returns API 응답
 */
export const endEditMode = async (tripId: number): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/api/trips/${tripId}/lock`);
  return response.data;
};

/**
 * 편집 상태 확인
 * @param tripId 여행 ID
 * @returns API 응답
 */
export const checkEditStatus = async (tripId: number): Promise<ApiResponse<EditStatusResponse>> => {
  const response = await api.get(`/api/trips/${tripId}/lock/status`);
  return response.data;
};
