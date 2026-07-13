import { useState } from "react";
import ReactPod from "@/components/ReactPod/ReactPod";
import ComponentViewer from "@/components/layout/component-viewer";
import { REACT_POD_DEMO_PHOTO_ALBUMS } from "@/components/previews/react-pod-photo-albums";
import {
  DEFAULT_REACT_POD_DEMO_CODE,
  DEFAULT_REACT_POD_DEMO_CONFIG,
  parseReactPodDemoCode,
  type ReactPodDemoConfig,
} from "@/components/previews/react-pod-demo.util";

export default function ReactPodPage() {
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

  return (
    <ComponentViewer
      title="ReactPod"
      description="Edit the live JSON configuration to customize the menu, then try it in the preview."
      component={
        <div className="flex h-full w-full items-center justify-center overflow-auto bg-gradient-to-br from-slate-100 via-sky-100 to-indigo-200 p-6">
          <ReactPod
            deviceName={config.deviceName}
            menuItems={config.menuItems}
            photoAlbums={REACT_POD_DEMO_PHOTO_ALBUMS}
          />
        </div>
      }
      usageCode={code}
      codeLanguage="LIVE JSON"
      codeError={codeError}
      onUsageCodeChange={handleCodeChange}
      onResetCode={resetCode}
    />
  );
}
