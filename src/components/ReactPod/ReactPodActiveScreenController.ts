"use client";

import { useEffect } from "react";
import type {
  ClickWheelController,
  ClickWheelDirection,
  ClickWheelNavigationSource,
} from "@/components/ClickWheel";
import { useReactPod } from "./ReactPodContext";
import type { ReactPodScreen } from "./reactPodState";

export type ReactPodScreenController = Pick<
  ClickWheelController,
  "navigate" | "previous" | "select" | "next" | "playPause" | "disabled"
>;

export type ReactPodScreenControllerCleanup = () => void;

export type RegisterReactPodScreenController = (
  // The base ESLint rule cannot distinguish type-only function parameters.
  // eslint-disable-next-line no-unused-vars
  screen: ReactPodScreen,
  // eslint-disable-next-line no-unused-vars
  controller: ReactPodScreenController,
) => ReactPodScreenControllerCleanup;

export interface ReactPodScreenControllerRegistry {
  register: RegisterReactPodScreenController;
  // The base ESLint rule cannot distinguish type-only function parameters.
  // eslint-disable-next-line no-unused-vars
  get: (screen: ReactPodScreen) => ReactPodScreenController | undefined;
}

interface ReactPodScreenControllerRegistration {
  controller: ReactPodScreenController;
  token: symbol;
}

export function createReactPodScreenControllerRegistry(): ReactPodScreenControllerRegistry {
  const registrations = new Map<
    ReactPodScreen,
    ReactPodScreenControllerRegistration
  >();

  return {
    register(screen, controller) {
      const token = Symbol(screen);
      registrations.set(screen, { controller, token });

      return () => {
        const currentRegistration = registrations.get(screen);
        if (
          currentRegistration?.token === token &&
          currentRegistration.controller === controller
        ) {
          registrations.delete(screen);
        }
      };
    },
    get(screen) {
      return registrations.get(screen)?.controller;
    },
  };
}

export function routeReactPodScreenNavigation(
  controller: ReactPodScreenController | undefined,
  direction: ClickWheelDirection,
  source: ClickWheelNavigationSource,
) {
  if (!controller) return false;
  if (controller.disabled) return true;

  const explicitHandler =
    source === "previous"
      ? controller.previous
      : source === "next"
        ? controller.next
        : undefined;

  if (explicitHandler) {
    explicitHandler();
    return true;
  }

  if (!controller.navigate) return false;
  controller.navigate(direction, { source });
  return true;
}

export function routeReactPodScreenAction(
  controller: ReactPodScreenController | undefined,
  action: "select" | "playPause",
) {
  if (!controller) return false;
  if (controller.disabled) return true;

  const handler = controller[action];
  if (!handler) return false;

  handler();
  return true;
}

export function useReactPodScreenController(
  screen: ReactPodScreen,
  controller: ReactPodScreenController,
) {
  const { registerScreenController } = useReactPod();

  useEffect(
    () => registerScreenController(screen, controller),
    [controller, registerScreenController, screen],
  );
}
