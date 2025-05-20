import { ref } from 'vue';
import { api } from '@/services/api';
import { AxiosError } from 'axios';

export function useNicknameCheck() {
  const isAvailable = ref<boolean | null>(null);
  const message = ref('');
  const loading = ref(false);

  const validate = (nickname: string) => {
    const trimmed = nickname.trim();
    const isKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(trimmed);
    const maxLen = isKorean ? 6 : 8;
    const minLen = 2;

    if (!trimmed) return '닉네임을 입력해주세요.';
    if (trimmed.length < minLen) return '닉네임은 최소 2자 이상이어야 합니다.';
    if (trimmed.length > maxLen)
      return isKorean
        ? '한글 닉네임은 6자 이하만 가능합니다.'
        : '영문 닉네임은 8자 이하만 가능합니다.';
    return '';
  };

  const checkNickname = async (rawNickname: string) => {
    const nickname = rawNickname.trim();
    const error = validate(nickname);
    if (error) {
      isAvailable.value = null;
      message.value = error;
      return;
    }

    loading.value = true;
    try {
      await api.get('/api/auth/check-name', {
        params: { nickname },
      });

      isAvailable.value = true;
      message.value = '✅ 사용 가능한 닉네임입니다.';
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 409) {
        isAvailable.value = false;
        message.value = '❌ 이미 사용 중인 닉네임입니다.';
      } else {
        isAvailable.value = null;
        message.value = '⚠️ 오류가 발생했습니다.';
      }
    } finally {
      loading.value = false;
    }
  };

  const resetStatus = () => {
    isAvailable.value = null;
    message.value = '';
  };

  return {
    isAvailable,
    message,
    loading,
    checkNickname,
    resetStatus,
  };
}
