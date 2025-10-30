#!/usr/bin/env node
const { ESLint } = require('eslint');
const path = require('path');
(async function(){
  try {
    const repoRoot = path.resolve(__dirname, '..');
    const configPath = path.join(repoRoot, '.eslintrc.cjs');
    // Load the legacy .eslintrc.cjs as an object and pass it as overrideConfig
    // to avoid ESLint flat-config discovery and "root" incompat errors.
    let overrideConfig = require(configPath);
    // Resolve any relative tsconfig paths to absolute, so the parser can find them
    const resolveProjectPaths = (cfg) => {
      if (cfg && cfg.parserOptions && cfg.parserOptions.project) {
        cfg.parserOptions.project = cfg.parserOptions.project.map((p) => path.resolve(repoRoot, p));
      }
      if (cfg && cfg.overrides && Array.isArray(cfg.overrides)) {
        cfg.overrides.forEach((ov) => {
          if (ov.parserOptions && ov.parserOptions.project) {
            ov.parserOptions.project = ov.parserOptions.project.map((p) => path.resolve(repoRoot, p));
          }
        });
      }
    };
    resolveProjectPaths(overrideConfig);
    const eslint = new ESLint({
      overrideConfig,
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
