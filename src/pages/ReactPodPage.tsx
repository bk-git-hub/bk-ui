import { useId, useState } from "react";
import {
  CLICK_WHEEL_MAX_SENSITIVITY,
  CLICK_WHEEL_MIN_SENSITIVITY,
} from "@/components/ClickWheel";
import { ReactPod } from "@/components/ReactPod";
import ComponentViewer from "@/components/layout/component-viewer";
import { REACT_POD_DEMO_TRACKS } from "@/components/previews/react-pod-audio-tracks";
import { REACT_POD_DEMO_COVERFLOW_ALBUMS } from "@/components/previews/react-pod-coverflow-albums";
import { REACT_POD_DEMO_PHOTO_ALBUMS } from "@/components/previews/react-pod-photo-albums";
import {
  DEFAULT_REACT_POD_DEMO_CODE,
  DEFAULT_REACT_POD_DEMO_CONFIG,
  parseReactPodDemoCode,
  type ReactPodDemoConfig,
} from "@/components/previews/react-pod-demo.util";
import { reactPodNextJsExport } from "@/snippets/reactPodNextExportCode";
import { reactPodReactExport } from "@/snippets/reactPodReactExportCode";
import { reactPodUsageCode } from "@/snippets/reactPodUsageCode";

export default function ReactPodPage() {
  const sensitivityId = useId();
  const sensitivityDescriptionId = `${sensitivityId}-description`;
  const [code, setCode] = useState(DEFAULT_REACT_POD_DEMO_CODE);
  const [config, setConfig] = useState<ReactPodDemoConfig>(
    DEFAULT_REACT_POD_DEMO_CONFIG,
  );
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    const result = parseReactPodDemoCode(nextCode);
    setCodeError(result.error);
    if (result.config) setConfig(result.config);
  };

  const resetCode = () => {
    setCode(DEFAULT_REACT_POD_DEMO_CODE);
    setConfig(DEFAULT_REACT_POD_DEMO_CONFIG);
    setCodeError(null);
  };

  const updateWheelSensitivity = (wheelSensitivity: number) => {
    const nextConfig = { ...config, wheelSensitivity };
    setConfig(nextConfig);
    setCode(JSON.stringify(nextConfig, null, 2));
  };

  return (
    <ComponentViewer
      title="ReactPod"
      description="Tune the interactive preview, edit its live JSON, or copy a complete React or Next.js setup."
      component={
        <div className="flex min-h-full w-full flex-col items-center justify-center gap-4 overflow-auto bg-gradient-to-br from-slate-100 via-sky-100 to-indigo-200 p-4 lg:flex-row lg:gap-6 lg:p-6">
          <section className="w-full max-w-[300px] rounded-xl border border-white/70 bg-white/85 p-4 text-slate-700 shadow-lg backdrop-blur-sm lg:w-52">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor={sensitivityId}
                className="text-sm font-semibold text-slate-900"
              >
                Wheel sensitivity
              </label>
              <output
                htmlFor={sensitivityId}
                className="rounded-md bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white"
              >
                {config.wheelSensitivity.toFixed(1)}×
              </output>
            </div>
            <input
              id={sensitivityId}
              type="range"
              min={CLICK_WHEEL_MIN_SENSITIVITY}
              max={CLICK_WHEEL_MAX_SENSITIVITY}
              step={0.1}
              value={config.wheelSensitivity}
              disabled={codeError !== null}
              aria-describedby={sensitivityDescriptionId}
              aria-valuetext={`${config.wheelSensitivity.toFixed(1)} times sensitivity`}
              onChange={(event) =>
                updateWheelSensitivity(event.currentTarget.valueAsNumber)
              }
              className="mt-4 w-full cursor-pointer accent-sky-600 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p
              id={sensitivityDescriptionId}
              className="mt-2 text-xs leading-relaxed text-slate-500"
            >
              {codeError
                ? "Fix the JSON to adjust the preview."
                : "Higher values react to smaller circular turns."}
            </p>
          </section>
          <ReactPod
            deviceName={config.deviceName}
            menuItems={config.menuItems}
            photoAlbums={REACT_POD_DEMO_PHOTO_ALBUMS}
            coverflowAlbums={REACT_POD_DEMO_COVERFLOW_ALBUMS}
            tracks={REACT_POD_DEMO_TRACKS}
            coverflowAriaLabel="ReactPod album coverflow"
            wheelSensitivity={config.wheelSensitivity}
          />
        </div>
      }
      usageCode={code}
      referenceCode={reactPodUsageCode}
      reactExport={reactPodReactExport}
      nextJsExport={reactPodNextJsExport}
      codeLanguage="LIVE JSON"
      codeError={codeError}
      onUsageCodeChange={handleCodeChange}
      onResetCode={resetCode}
    />
  );
}
