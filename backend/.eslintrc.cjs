module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'prettier', // Must be last
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Warn on console/debugger (gradual migration - will be 'error' in Stage 5)
    'no-console': 'warn',
    'no-debugger': 'error',
    
    // Code quality
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Best practices for Node.js/Express
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Async/Await
    'require-await': 'warn',
    'no-return-await': 'error',
    // Forbid importing Supabase client outside repositories/config/scripts
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@supabase/supabase-js',
            message:
              'Import Supabase only from src/config/database.js or within src/services/repositories/**. Create/extend a repo instead.',
          },
        ],
        patterns: [
          {
            group: ['\\.\\./\\.\\./\\.\\./.*'],
            message: 'Use path aliases instead of deep relative imports (../../../).',
          },
          {
            group: ['\\.\\./\\.\\./.*'],
            message: 'Prefer path aliases over deep relative imports (../../).',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/services/repositories/**', 'src/config/**', 'scripts/**'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules',
    'coverage',
    'dist',
    '.eslintrc.cjs',
    'database/migrations/*.sql',
  ],
};
