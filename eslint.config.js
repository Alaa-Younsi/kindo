import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      // Only the two classic hooks rules — eslint-plugin-react-hooks v7's
      // "recommended" preset also bundles React Compiler diagnostics
      // (purity/set-state-in-effect/incompatible-library) that flag
      // standard, non-Compiler patterns (react-hook-form's watch(),
      // seeding editable form state from async-loaded data). This project
      // doesn't enable the React Compiler, so those don't apply.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-undef": "off",
    },
  },
  {
    // Provider files intentionally export a hook alongside the component
    // (LanguageProvider + useLanguage, ThemeProvider + useTheme, etc.) per the
    // project's provider pattern — fast-refresh boundary warnings here are
    // expected, not a bug.
    files: [
      "src/i18n/LanguageProvider.tsx",
      "src/theme/ThemeProvider.tsx",
      "src/components/admin/AdminToast.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["*.config.{js,ts}", "scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
