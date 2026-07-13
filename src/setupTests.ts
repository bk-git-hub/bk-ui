// src/setupTests.ts
import "@testing-library/jest-dom";

// 1. ResizeObserver 모킹 (화면 크기 감지용)
global.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    // 테스트에서 강제로 리사이즈 이벤트를 발생시키기 위해 target에 저장
    (target as any).__resizeCallback = this.callback;
  }
  unobserve() {}
  disconnect() {}
};

// 2. PointerEvent 모킹 (드래그용)
class MockPointerEvent extends Event {
  clientX: number;
  clientY: number;
  pointerId: number;
  button: number;
  pointerType: string;
  constructor(type: string, props: PointerEventInit) {
    super(type, props);
    this.clientX = props.clientX || 0;
    this.clientY = props.clientY || 0;
    this.pointerId = props.pointerId || 0;
    this.button = props.button || 0;
    this.pointerType = props.pointerType || "mouse";
  }
}
window.PointerEvent = MockPointerEvent as any;
