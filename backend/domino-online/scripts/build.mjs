import { build } from 'esbuild';
await build({ entryPoints: ['src/worker.ts'], bundle: true, format: 'esm', platform: 'neutral',
  external: ['cloudflare:workers'], outfile: '.local/worker.mjs', target: 'es2022', logLevel: 'warning' });
await build({ entryPoints: ['test/runtime.ts'], bundle: true, format: 'esm', platform: 'neutral',
  external: ['cloudflare:workers'], outfile: '.local/worker-test.mjs', target: 'es2022', logLevel: 'warning' });
