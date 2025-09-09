// eslint.config.js — bridge so ESLint v9 uses your .eslintrc.cjs
import { FlatCompat } from "@eslint/eslintrc";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const compat = new FlatCompat({ baseDirectory: process.cwd() });

export default [
  ...compat.config(require("./.eslintrc.cjs")),
];
