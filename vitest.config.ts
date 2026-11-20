import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['apps/**/*.test.ts'], exclude: ['**/dist/**', '**/node_modules/**'], fileParallelism: false, maxWorkers: 1 } });
