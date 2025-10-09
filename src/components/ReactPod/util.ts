export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): T {
  let isThrottled = false;

  const throttledFunc = (...args: Parameters<T>) => {
    if (isThrottled) return; // 이미 호출 대기 중이면 무시

    func(...args); // 함수를 즉시 실행
    isThrottled = true; // 스위치를 ON

    setTimeout(() => {
      isThrottled = false; // delay 이후에 스위치를 OFF
    }, delay);
  };

  return throttledFunc as T;
}
