import globals from "globals";

const commonRules = {
  eqeqeq: "error",
  "no-unused-vars": "warn",
  "no-var": "error",
  "prefer-const": "warn",
};

export default [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["lib/color.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Pure color math: no chrome.* calls and no DOM access, used by both the service
      // worker and the offscreen document.
      globals: { ...globals.browser },
    },
    rules: commonRules,
  },
  {
    files: ["background.js", "lib/sort.js", "lib/undo.js", "lib/pinnedPrompt.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Service worker context: chrome.* APIs, no window/document.
      globals: { ...globals.serviceworker, chrome: "readonly" },
    },
    rules: commonRules,
  },
  {
    files: ["offscreen.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Offscreen document: a real DOM/browser context plus chrome.* APIs.
      globals: { ...globals.browser, chrome: "readonly" },
    },
    rules: commonRules,
  },
  {
    files: ["confirm.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      // The action's confirmation popup: a real DOM/browser context plus chrome.* APIs.
      globals: { ...globals.browser, chrome: "readonly" },
    },
    rules: commonRules,
  },
];
