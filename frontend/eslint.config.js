// ESLint flat config for React + Vite (ESLint v9)
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // Helps catch real bugs - keep as warn
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off', // Not needed with automatic JSX runtime
      'react/jsx-uses-react': 'off', // Not needed with automatic JSX runtime
      'react/jsx-uses-vars': 'error', // Detect JSX usage for unused-imports
      'react/prop-types': 'off', // Not using PropTypes in this project
      'no-unused-vars': 'off', // Turn off base rule in favor of unused-imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', { 
        args: 'after-used', 
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true, 
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }],
      // Prevent direct Supabase imports in UI layer - use services/hooks instead
      // Prevent legacy component imports - use library versions instead
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/supabase*', '@supabase/*'],
              message: 'Do not import Supabase directly in UI components. Use services or hooks instead.',
            },
            {
              group: ['../components/EmptyState', './components/EmptyState', '@/components/EmptyState'],
              message: 'Use library EmptyState instead: @components/library/feedback/EmptyState',
            },
            {
              group: ['../components/ErrorState', './components/ErrorState', '@/components/ErrorState'],
              message: 'Use library ErrorState instead: @components/library/feedback/ErrorState',
            },
            {
              group: ['../components/LoadingState', './components/LoadingState', '@/components/LoadingState'],
              message: 'Use library LoadingSpinner instead: @components/library/feedback/LoadingSpinner',
            },
            {
              group: ['../components/DataTable', './components/DataTable', '@/components/DataTable'],
              message: 'Use library DataTable instead: @components/library/DataTable',
            },
            {
              group: ['../components/SearchInput', './components/SearchInput', '@/components/SearchInput'],
              message: 'Use library SearchBar instead: @components/library/inputs/SearchBar',
            },
            {
              group: ['../components/ui/ModalComponent', './components/ui/ModalComponent', '@/components/ui/ModalComponent'],
              message: 'Use library FormModal instead: @components/library/forms/FormModal',
            },
            {
              group: ['../utils/useDebounce', './utils/useDebounce', '@/utils/useDebounce'],
              message: 'Use hook from hooks directory: @hooks/useDebounce',
            },
            {
              group: ['../pages/CashierDashboard', './pages/CashierDashboard', '@/pages/CashierDashboard'],
              message: 'Use role-scoped version: @pages/cashier/CashierDashboard',
            },
          ],
        },
      ],
    },
  },
  // Disallow raw fetch() in pages/components - must use services/api.js
  {
    files: ['frontend/src/pages/**/*', 'frontend/src/components/**/*'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Use services/api.js instead of raw fetch(). All network calls must route through the centralized API service.',
        },
      ],
    },
  },
  // Allow fetch() in services/api.js (the centralized API service)
  {
    files: ['frontend/src/services/api.js'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
  // Node-specific config files (allow Node globals like __dirname, module)
  {
    files: ['vite.config.*', 'tailwind.config.*', 'postcss.config.*'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  // Allow react-refresh warnings in utility/constant files (acceptable)
  {
    files: ['**/components/ui/**', '**/contexts/**', '**/utils/**'],
    rules: {
      'react-refresh/only-export-components': 'off', // ✅ Acceptable - these export utilities/constants
    },
  },
];
