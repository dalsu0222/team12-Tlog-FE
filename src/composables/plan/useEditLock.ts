import { ref, readonly, onUnmounted } from 'vue';
import api from '@/services/api/api';
import type { ApiResponse, ApiSuccess } from '@/services/api/types';
import { AxiosError } from 'axios';

interface EditLockResponse {
  success: boolean;
  heartbeatInterval?: number;
  currentOwner?: number;
}

interface HeartbeatResponse {
  success: boolean;
  nextHeartbeat?: number;
  shouldRestart?: boolean;
}

interface EditStatusResponse {
  locked: boolean;
  currentOwner?: number;
  timeRemaining?: number;
}

function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return 'data' in response;
}

export function useEditLock() {
  const isEditing = ref(false);
  const currentOwner = ref<number | null>(null);
  const heartbeatTimer = ref<number | null>(null);
  const heartbeatInterval = ref(30000); // 기본 30초

  /**
   * 편집 모드 시작 (락 획득)
   */
  const startEdit = async (tripId: number) => {
    try {
      const response = await api.post<ApiResponse<EditLockResponse>>(`/api/trips/${tripId}/lock`);
      const responseData = response.data;

      if (
        isApiSuccess(responseData) &&
        responseData.statusCode === 200 &&
        responseData.data?.success
      ) {
        isEditing.value = true;
        currentOwner.value = null;

        // 서버에서 받은 heartbeat 간격 설정 (기본 30초)
        if (responseData.data.heartbeatInterval) {
          heartbeatInterval.value = responseData.data.heartbeatInterval * 1000;
        }

        // Heartbeat 시작
        startHeartbeat(tripId);

        console.log('편집 모드 시작');
        return {
          success: true,
          message: '편집 모드를 시작했습니다.',
        };
      } else if (responseData.statusCode === 409) {
        // 다른 사용자가 편집 중
        if (isApiSuccess(responseData)) {
          currentOwner.value = responseData.data?.currentOwner || null;
        }
        return {
          success: false,
          message: responseData.message || '다른 사용자가 편집 중입니다.',
          currentOwner: currentOwner.value,
        };
      } else {
        return {
          success: false,
          message: responseData.message || '편집 모드 시작에 실패했습니다.',
        };
      }
    } catch (error: unknown) {
      console.error('편집 모드 시작 실패:', error);

      // 409 에러 처리 (서버가 409 상태코드로 응답한 경우)
      if (error instanceof AxiosError && error.response?.status === 409) {
        // 409 에러의 경우 응답 데이터에서 정보 추출
        const responseData = error.response.data;

        if (responseData?.data?.currentOwner) {
          currentOwner.value = responseData.data.currentOwner;
        } else {
          currentOwner.value = -1; // 편집 중인 사용자가 있지만 ID를 알 수 없는 경우
        }

        console.log('409 HTTP 상태: 다른 사용자가 편집 중', {
          currentOwner: currentOwner.value,
          responseData: responseData,
        });

        return {
          success: false,
          message: responseData?.message || '다른 사용자가 편집 중입니다.',
          currentOwner: currentOwner.value,
        };
      }

      // 기타 에러
      return {
        success: false,
        message: error instanceof Error ? error.message : '편집 모드 시작에 실패했습니다.',
      };
    }
  };

  /**
   * Heartbeat 시작
   */
  const startHeartbeat = (tripId: number) => {
    // 기존 타이머가 있으면 정리
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value);
    }

    heartbeatTimer.value = setInterval(async () => {
      try {
        const response = await api.post<ApiResponse<HeartbeatResponse>>(
          `/api/trips/${tripId}/heartbeat`
        );
        const responseData = response.data;

        if (
          isApiSuccess(responseData) &&
          responseData.statusCode === 200 &&
          responseData.data?.success
        ) {
          console.log('Heartbeat 성공');

          // 다음 heartbeat 간격 업데이트 (필요시)
          if (responseData.data.nextHeartbeat) {
            heartbeatInterval.value = responseData.data.nextHeartbeat * 1000;
          }
        } else if (responseData.statusCode === 401) {
          // 편집 권한 상실
          console.warn('편집 권한을 잃었습니다');
          await forceEndEdit();
          alert('편집 권한이 만료되었습니다. 다시 편집을 시작해주세요.');
        }
      } catch (error: unknown) {
        console.error('Heartbeat 실패:', error);

        // 401 에러 처리
        if (error instanceof AxiosError && error.response?.status === 401) {
          console.warn('편집 권한을 잃었습니다');
          await forceEndEdit();
          alert('편집 권한이 만료되었습니다. 다시 편집을 시작해주세요.');
        }
      }
    }, heartbeatInterval.value);
  };

  /**
   * 편집 모드 종료 (락 해제)
   */
  const endEdit = async (tripId: number) => {
    // Heartbeat 중지
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value);
      heartbeatTimer.value = null;
    }

    // 편집 중이었다면 락 해제 API 호출
    if (isEditing.value) {
      try {
        await api.delete(`/api/trips/${tripId}/lock`);
        console.log('편집 모드 정상 종료');
      } catch (error) {
        console.error('락 해제 실패:', error);
      }
    }

    // 상태 초기화
    isEditing.value = false;
    currentOwner.value = null;

    return { success: true, message: '편집을 종료했습니다.' };
  };

  /**
   * 강제 편집 모드 종료 (권한 상실 시)
   */
  const forceEndEdit = async () => {
    // Heartbeat 중지
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value);
      heartbeatTimer.value = null;
    }

    // 상태만 초기화 (API 호출 없음 - 이미 권한이 없으므로)
    isEditing.value = false;
    currentOwner.value = null;

    console.log('편집 모드 강제 종료');
  };

  /**
   * 편집 상태 확인
   */
  const checkEditStatus = async (tripId: number) => {
    try {
      const response = await api.get<ApiResponse<EditStatusResponse>>(
        `/api/trips/${tripId}/lock/status`
      );
      const responseData = response.data;

      if (isApiSuccess(responseData)) {
        const data = responseData.data;

        if (data?.locked && !isEditing.value) {
          // 다른 사용자가 편집 중
          currentOwner.value = data.currentOwner || null;
        } else {
          // 편집 중인 사용자 없음
          currentOwner.value = null;
        }

        return data;
      }
    } catch (error) {
      console.error('편집 상태 확인 실패:', error);
      return null;
    }
  };

  /**
   * 페이지 이탈 감지용 핸들러
   */
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (isEditing.value) {
      event.preventDefault();
      event.returnValue = '편집 중인 내용이 있습니다. 정말 나가시겠습니까?';
      return event.returnValue;
    }
  };

  /**
   * 페이지 이탈 감지 시작
   */
  const startBeforeUnloadListener = () => {
    window.addEventListener('beforeunload', handleBeforeUnload);
  };

  /**
   * 페이지 이탈 감지 중지
   */
  const stopBeforeUnloadListener = () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };

  // 컴포넌트 언마운트 시 정리
  onUnmounted(() => {
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value);
    }
    stopBeforeUnloadListener();
  });

  return {
    // 상태 (읽기 전용)
    isEditing: readonly(isEditing),
    currentOwner: readonly(currentOwner),

    // 메서드
    startEdit,
    endEdit,
    checkEditStatus,
    startBeforeUnloadListener,
    stopBeforeUnloadListener,
  };
}
