import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import jsonc from 'eslint-plugin-jsonc';
import jsoncParser from 'jsonc-eslint-parser';
import { defineConfig } from 'eslint/config';

const mergeRules = (...configs) =>
  configs.reduce((rules, config) => {
    if (!config) return rules;
    if (Array.isArray(config)) {
      return config.reduce((innerRules, cfg) => {
        if (cfg?.rules) {
          Object.assign(innerRules, cfg.rules);
        }
        return innerRules;
      }, rules);
    }
    if (config.rules) {
      Object.assign(rules, config.rules);
    }
    return rules;
  }, {});

const baseTypeScriptConfigs = [...tseslint.configs.recommended];

const combinedRules = mergeRules(
  js.configs.recommended,
  baseTypeScriptConfigs,
  react.configs.recommended,
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.vite
);

const jsoncRecommended = jsonc.configs['recommended-with-jsonc'];
const jsoncRules = mergeRules(jsoncRecommended);

export default defineConfig([
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    rules: {
      ...combinedRules,
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['**/*.json', '**/*.jsonc', '**/*.json5'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: { jsonc, prettier },
    rules: {
      ...jsoncRules,
      'jsonc/no-dupe-keys': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
]);
