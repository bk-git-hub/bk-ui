import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import {
  createLottoPhysicsBodies,
  kickLottoPhysicsBodies,
  stepLottoPhysicsBodies,
  type LottoPhysicsBody,
} from "./lottoMachinePhysics";

const SETTLE_DURATION_MS = 1_600;
const FIXED_TIME_STEP = 1 / 120;
const MAX_SUBSTEPS = 6;

interface UseLottoMachinePhysicsOptions {
  active: boolean;
  ballCount: number;
  motionSeed?: number;
}

interface UseLottoMachinePhysicsResult {
  fieldRef: RefObject<HTMLDivElement | null>;
  // eslint-disable-next-line no-unused-vars
  setBallRef: (...args: [number, HTMLSpanElement | null]) => void;
}

interface FieldMeasurement {
  center: number;
  radius: number;
  ballRadius: number;
}

function applyBodyTransform(
  element: HTMLSpanElement,
  body: LottoPhysicsBody,
  measurement: FieldMeasurement,
) {
  const x = measurement.center + body.x * measurement.radius;
  const y = measurement.center + body.y * measurement.radius;
  element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${body.rotation}deg)`;
}

function prefersReducedMotion() {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

export function useLottoMachinePhysics({
  active,
  ballCount,
  motionSeed = 2_026,
}: UseLottoMachinePhysicsOptions): UseLottoMachinePhysicsResult {
  const fieldRef = useRef<HTMLDivElement>(null);
  const ballRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const bodiesRef = useRef<LottoPhysicsBody[]>([]);
  const measurementRef = useRef<FieldMeasurement | null>(null);
  const frameRef = useRef<number | null>(null);
  const wasActiveRef = useRef(false);
  const runCountRef = useRef(0);

  const setBallRef = useCallback(
    (index: number, element: HTMLSpanElement | null) => {
      ballRefs.current[index] = element;
      const body = bodiesRef.current[index];
      const measurement = measurementRef.current;
      if (element && body && measurement) {
        applyBodyTransform(element, body, measurement);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const elements = ballRefs.current.slice(0, ballCount);
    if (!field || elements.length !== ballCount || elements.includes(null)) {
      return;
    }

    let cancelled = false;
    let lastTimestamp: number | null = null;
    let accumulator = 0;
    let elapsedTime = 0;
    let measurement: FieldMeasurement;
    const shouldSettle = !active && wasActiveRef.current;
    const canAnimate =
      typeof window.requestAnimationFrame === "function" &&
      typeof window.cancelAnimationFrame === "function" &&
      !prefersReducedMotion();
    wasActiveRef.current = active;

    const measureField = (): FieldMeasurement => {
      const fieldRect = field.getBoundingClientRect();
      const diameter = fieldRect.width || field.clientWidth || 320;
      const firstBall = elements[0]?.querySelector<HTMLElement>(
        '[data-slot="lotto-machine-ball"]',
      );
      const ballRect = firstBall?.getBoundingClientRect();
      const ballDiameter =
        firstBall?.offsetWidth ||
        ballRect?.width ||
        Math.max(24, diameter * 0.08);
      const radius = diameter / 2;

      return {
        center: radius,
        radius,
        ballRadius: Math.min(0.12, Math.max(0.035, ballDiameter / 2 / radius)),
      };
    };

    const ensureBodies = () => {
      const requiresNewBodies =
        bodiesRef.current.length !== ballCount ||
        bodiesRef.current.some(
          (body) => Math.abs(body.radius - measurement.ballRadius) > 0.005,
        );

      if (requiresNewBodies) {
        bodiesRef.current = createLottoPhysicsBodies({
          count: ballCount,
          ballRadius: measurement.ballRadius,
          seed: motionSeed,
        });
      } else {
        bodiesRef.current.forEach((body) => {
          body.radius = measurement.ballRadius;
        });
      }
    };

    const applyBodies = () => {
      bodiesRef.current.forEach((body, index) => {
        const element = elements[index];
        if (!element) return;
        applyBodyTransform(element, body, measurement);
      });
    };

    const stopFrame = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    measurement = measureField();
    measurementRef.current = measurement;
    ensureBodies();
    applyBodies();

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            measurement = measureField();
            measurementRef.current = measurement;
            ensureBodies();
            applyBodies();
          })
        : null;
    resizeObserver?.observe(field);

    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      stopFrame();
      bodiesRef.current = createLottoPhysicsBodies({
        count: ballCount,
        ballRadius: measurement.ballRadius,
        seed: motionSeed,
      });
      applyBodies();
      elements.forEach((element) => {
        if (element) element.style.willChange = "auto";
      });
    };
    motionQuery?.addEventListener?.("change", handleMotionChange);

    const cleanUp = () => {
      cancelled = true;
      stopFrame();
      resizeObserver?.disconnect();
      motionQuery?.removeEventListener?.("change", handleMotionChange);
      elements.forEach((element) => {
        if (element) element.style.willChange = "auto";
      });
    };

    if (!canAnimate) {
      elements.forEach((element) => {
        if (element) element.style.willChange = "auto";
      });
      return cleanUp;
    }

    if (active) {
      runCountRef.current += 1;
      kickLottoPhysicsBodies(
        bodiesRef.current,
        motionSeed + runCountRef.current * 7_919,
      );
    } else if (!shouldSettle) {
      return cleanUp;
    }

    elements.forEach((element) => {
      if (element) element.style.willChange = "transform";
    });

    const runFrame = (timestamp: number) => {
      if (cancelled) return;

      if (lastTimestamp === null) lastTimestamp = timestamp;
      const frameDelta = Math.min((timestamp - lastTimestamp) / 1_000, 0.05);
      lastTimestamp = timestamp;
      accumulator += frameDelta;
      let substeps = 0;

      while (accumulator >= FIXED_TIME_STEP && substeps < MAX_SUBSTEPS) {
        elapsedTime += FIXED_TIME_STEP;
        stepLottoPhysicsBodies(bodiesRef.current, {
          deltaTime: FIXED_TIME_STEP,
          elapsedTime,
          mixing: active,
        });
        accumulator -= FIXED_TIME_STEP;
        substeps += 1;
      }

      applyBodies();

      if (active || elapsedTime * 1_000 < SETTLE_DURATION_MS) {
        frameRef.current = window.requestAnimationFrame(runFrame);
      } else {
        frameRef.current = null;
        elements.forEach((element) => {
          if (element) element.style.willChange = "auto";
        });
      }
    };

    frameRef.current = window.requestAnimationFrame(runFrame);
    return cleanUp;
  }, [active, ballCount, motionSeed]);

  return { fieldRef, setBallRef };
}
