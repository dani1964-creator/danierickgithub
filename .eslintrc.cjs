module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  // include multiple tsconfig files used in this mono-repo
  // use tsconfig.app.json (which includes `src`) instead of the empty root tsconfig
  project: ['./tsconfig.app.json', './frontend/tsconfig.json', './backend/tsconfig.json']
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  settings: {
    react: { version: 'detect' }
  },
  ignorePatterns: ['dist/', 'supabase/functions/**', 'archive/**'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.app.json', './frontend/tsconfig.json', './backend/tsconfig.json']
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    }
  ]
};
