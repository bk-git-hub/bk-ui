import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts", // 아래에서 생성할 파일
  },
  server: {
    host: "0.0.0.0", // 네트워크 전체에서 접근 가능
    port: 5173, // 기본 포트 (원하는 걸로 바꿀 수 있음)
  },
});
