module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  // Keep config minimal to avoid cross-package plugin resolution issues in monorepo
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': 'off'
  }
};
