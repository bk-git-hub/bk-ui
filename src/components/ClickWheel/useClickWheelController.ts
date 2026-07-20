"use client";

import { useMemo } from "react";
import type {
  ClickWheelDirection,
  ClickWheelRotateHandler,
} from "./useClickWheel";

export type ClickWheelNavigationSource = "next" | "previous" | "rotate";

export interface ClickWheelNavigationDetail {
  source: ClickWheelNavigationSource;
}

export type ClickWheelActionHandler = () => void;
export type ClickWheelNavigateHandler = (
  // The base ESLint rule cannot distinguish type-only function parameters.
  // eslint-disable-next-line no-unused-vars
  direction: ClickWheelDirection,
  // eslint-disable-next-line no-unused-vars
  detail: ClickWheelNavigationDetail,
) => void;

export interface ClickWheelController {
  navigate?: ClickWheelNavigateHandler;
  back?: ClickWheelActionHandler;
  home?: ClickWheelActionHandler;
  previous?: ClickWheelActionHandler;
  select?: ClickWheelActionHandler;
  next?: ClickWheelActionHandler;
  playPause?: ClickWheelActionHandler;
  disabled?: boolean;
}

export interface ClickWheelControllerBindings {
  onRotate?: ClickWheelRotateHandler;
  onMenu?: ClickWheelActionHandler;
  onMenuLongPress?: ClickWheelActionHandler;
  onPrevious?: ClickWheelActionHandler;
  onSelect?: ClickWheelActionHandler;
  onNext?: ClickWheelActionHandler;
  onPlayPause?: ClickWheelActionHandler;
  disabled: boolean;
}

export function getClickWheelControllerBindings({
  navigate,
  back,
  home,
  previous,
  select,
  next,
  playPause,
  disabled = false,
}: ClickWheelController): ClickWheelControllerBindings {
  const runAction = (action: ClickWheelActionHandler | undefined) =>
    action === undefined
      ? undefined
      : () => {
          if (!disabled) action();
        };

  const onRotate =
    navigate === undefined
      ? undefined
      : (direction: ClickWheelDirection) => {
          if (!disabled) navigate(direction, { source: "rotate" });
        };
  const onPrevious =
    previous !== undefined
      ? runAction(previous)
      : navigate === undefined
        ? undefined
        : () => {
            if (!disabled) navigate(-1, { source: "previous" });
          };
  const onNext =
    next !== undefined
      ? runAction(next)
      : navigate === undefined
        ? undefined
        : () => {
            if (!disabled) navigate(1, { source: "next" });
          };

  return {
    disabled,
    onRotate,
    onMenu: runAction(back),
    onMenuLongPress: runAction(home),
    onPrevious,
    onSelect: runAction(select),
    onNext,
    onPlayPause: runAction(playPause),
  };
}

export function useClickWheelController({
  navigate,
  back,
  home,
  previous,
  select,
  next,
  playPause,
  disabled,
}: ClickWheelController): ClickWheelControllerBindings {
  return useMemo(
    () =>
      getClickWheelControllerBindings({
        navigate,
        back,
        home,
        previous,
        select,
        next,
        playPause,
        disabled,
      }),
    [back, disabled, home, navigate, next, playPause, previous, select],
  );
}
