#!/usr/bin/env node
const { ESLint } = require('eslint');
const path = require('path');
(async function(){
  try {
    const repoRoot = path.resolve(__dirname, '..');
    const configPath = path.join(repoRoot, '.eslintrc.cjs');
    const eslint = new ESLint({
      overrideConfigFile: configPath,
      fix: true,
      ignore: false
    });
    const targets = [
      path.join(repoRoot, 'src'),
      path.join(repoRoot, 'backend', 'src')
    ];
    const results = await eslint.lintFiles(targets);
    await ESLint.outputFixes(results);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    console.log(resultText);
  } catch (err) {
    console.error('ESLint run error:', err);
    process.exit(2);
  }
})();
