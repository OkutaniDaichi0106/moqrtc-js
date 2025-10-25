import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  // ignore build and deps
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  // TypeScript files
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: { "@typescript-eslint": tsPlugin, "prettier": prettierPlugin },
    rules: {
      // use the plugin's recommended rules as a baseline
      ...tsPlugin.configs.recommended.rules,

      // Prettier as an ESLint rule (shows formatting issues as lint warnings)
      "prettier/prettier": ["warn", { "endOfLine": "auto" }],

      // small defaults you can change later
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
];
