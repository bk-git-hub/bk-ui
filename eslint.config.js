import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // 여기에 no-unused-vars 규칙을 추가하고 'warn'으로 설정
      "no-unused-vars": "warn",
      // TypeScript 관련 no-unused-vars는 @typescript-eslint/no-unused-vars로 오버라이드해야 할 수도 있음
      // 기본 tseslint.configs.recommended에 포함되어 있을 가능성이 높음
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
);
