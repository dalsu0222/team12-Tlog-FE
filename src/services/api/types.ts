export type ApiSuccess<T> = {
  statusCode: number;
  message: string;
  data: T;
};

export type ApiFailure = {
  statusCode: number;
  errorCode: string;
  message: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type User = {
  userId: string;
  nickname: string;
  role: 'user' | 'admin';
  profileImageUrl?: string;
};

export type AuthToken = {
  accessToken: string;
  refreshToken: string;
};
