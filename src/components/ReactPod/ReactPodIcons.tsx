import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function PlayIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M7 4.5v15l12-7.5z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z" />
    </svg>
  );
}

export function BatteryIcon(props: IconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <rect x="2" y="7" width="17" height="10" rx="2" />
      <path d="M22 10v4M5 10h11v4H5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ShuffleIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}
