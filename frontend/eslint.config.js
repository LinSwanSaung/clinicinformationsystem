// ESLint flat config for React + Vite (ESLint v9)
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
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
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
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
];
