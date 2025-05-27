import api from './api';
import type { ApiResponse } from './types';

export interface CheckUserResponse {
  exists: boolean;
  userId: number | null;
  nickname: string | null;
}

// 닉네임으로 사용자 존재 확인
export const checkUserByNickname = async (
  nickname: string
): Promise<ApiResponse<CheckUserResponse>> => {
  const response = await api.get(`/api/users/check?nickname=${encodeURIComponent(nickname)}`);
  return response.data;
};
