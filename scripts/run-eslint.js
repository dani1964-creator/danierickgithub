#!/usr/bin/env node
const { ESLint } = require('eslint');
(async function(){
  try {
    const eslint = new ESLint({
      overrideConfigFile: '.eslintrc.cjs',
      fix: true,
      ignorePath: '.gitignore'
    });
    const results = await eslint.lintFiles(['frontend', 'backend/src']);
    await ESLint.outputFixes(results);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    console.log(resultText);
  } catch (err) {
    console.error('ESLint run error:', err);
    process.exit(2);
  }
})();
