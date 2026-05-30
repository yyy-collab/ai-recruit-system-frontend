import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getErrorMessage } from '@/utils/errorCodes';

export function useRequest(apiFn, options = {}) {
  const loading = ref(false);
  const error = ref(null);
  const data = ref(null);

  const execute = async (...args) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiFn(...args);
      if (res.code === 0) {
        data.value = res.data;
        if (options.onSuccess) options.onSuccess(res.data);
        return res.data;
      } else {
        const msg = getErrorMessage(res.code, res.msg);
        ElMessage.error(msg);
        error.value = msg;
        if (options.onError) options.onError(res);
        return null;
      }
    } catch (err) {
      const msg = err.msg || err.message || '请求失败';
      ElMessage.error(msg);
      error.value = msg;
      if (options.onError) options.onError(err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, data, execute };
}