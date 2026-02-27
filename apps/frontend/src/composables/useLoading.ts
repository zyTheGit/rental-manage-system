import { showLoadingToast, closeToast } from "vant";

let loadingCount = 0;

export function useLoading() {
  const start = () => {
    loadingCount++;
    if (loadingCount === 1) {
      showLoadingToast({
        message: "加载中...",
        forbidClick: true,
        duration: 0,
      });
    }
  };

  const stop = () => {
    loadingCount--;
    if (loadingCount <= 0) {
      loadingCount = 0;
      closeToast();
    }
  };

  const error = () => {
    stop();
  };

  return {
    start,
    stop,
    error,
  };
}
