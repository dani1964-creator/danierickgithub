module.exports = {
  // Do not run eslint on declaration files generated or vendored in components.
  // These often come from external UI packages and can cause type-aware linting
  // to fail because they aren't included in the project's TSConfig.
  ignorePatterns: ['**/*.d.ts'],
  // Re-enable TypeScript ESLint parser and plugin so rules referenced by
  // `next/core-web-vitals` are available. If this causes issues we can
  // further constrain parserOptions.project to avoid type-aware rules.
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['next/core-web-vitals'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  overrides: [
    {
      // Enable type-aware linting only for TypeScript source and declaration files.
      // We include `*.d.ts` so declaration files are covered by parserOptions.project
      // and do not produce the "file not included" error.
      files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.json'],
      },
    },
  ],
  rules: {
    // Allow unescaped entities in JSX for now
    'react/no-unescaped-entities': 'off',
  },
};

