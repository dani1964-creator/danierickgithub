#!/usr/bin/env node
const { ESLint } = require('eslint');
const path = require('path');
(async () => {
  try {
    const repoRoot = path.resolve(__dirname, '..');
    const eslint = new ESLint({
      fix: true,
      ignore: false,
      overrideConfig: {
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
          project: [path.join(repoRoot, 'tsconfig.app.json'), path.join(repoRoot, 'backend', 'tsconfig.json')]
        },
        env: { browser: true, node: true, es2021: true },
        plugins: ['@typescript-eslint', 'react-hooks'],
        rules: {
          // conservative rules to allow fixes for formatting-like issues
          'no-unused-vars': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
          '@typescript-eslint/no-explicit-any': 'warn'
        }
      }
    });

    const targets = [path.join(repoRoot, 'src'), path.join(repoRoot, 'backend', 'src')];
    console.log('Linting targets:', targets.join(', '));
    const results = await eslint.lintFiles(targets);
    await ESLint.outputFixes(results);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    console.log(resultText || 'No lint messages.');
    const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
    console.log(`Totals — errors: ${totalErrors}, warnings: ${totalWarnings}`);
  } catch (err) {
    console.error('ESLint simple run failed:', err);
    process.exit(2);
  }
})();
