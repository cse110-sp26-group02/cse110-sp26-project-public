import {
  defineConfig
} from '@vscode/test-cli';

export default defineConfig(
  {
    files: 'tests/integration/**/*.test.js',
    version: 'stable',
    mocha: {
      timeout: 20000
    }
  }
);
