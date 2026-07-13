"use client";

import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import type { ComponentPropsWithoutRef } from "react";
import ClickWheel from "./ClickWheel";
import Display from "./Display";
import { ReactPodProvider } from "./ReactPodProvider";
import { MAIN_MENU_ITEMS } from "./reactPodState";
import type { ReactPodMenuItem, ReactPodPhotoAlbum } from "./reactPodState";

export type {
  ReactPodMenuItem,
  ReactPodMenuItemId,
  ReactPodPhoto,
  ReactPodPhotoAlbum,
} from "./reactPodState";

const EMPTY_PHOTO_ALBUMS: readonly ReactPodPhotoAlbum[] = [];

export interface ReactPodProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  deviceName?: string;
  menuItems?: readonly ReactPodMenuItem[];
  photoAlbums?: readonly ReactPodPhotoAlbum[];
}

export function ReactPod({
  deviceName = "ReactPod",
  menuItems = MAIN_MENU_ITEMS,
  photoAlbums = EMPTY_PHOTO_ALBUMS,
  className,
  ...rootProps
}: ReactPodProps) {
  return (
    <ReactPodProvider
      deviceName={deviceName}
      menuItems={menuItems}
      photoAlbums={photoAlbums}
    >
      <div
        {...rootProps}
        className={twMerge(
          clsx(
            "flex h-[500px] w-[300px] shrink-0 flex-col overflow-hidden rounded-[26px] border border-zinc-400 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-300 p-4 shadow-[0_24px_50px_rgba(15,23,42,0.35),inset_0_0_15px_rgba(0,0,0,0.18)]",
            className,
          ),
        )}
      >
        <Display />
        <ClickWheel />
      </div>
    </ReactPodProvider>
  );
}

export default ReactPod;
