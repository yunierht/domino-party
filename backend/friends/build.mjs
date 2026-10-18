import {build} from '../domino-online/node_modules/esbuild/lib/main.js';
await build({entryPoints:['src/worker.ts'],bundle:true,format:'esm',platform:'neutral',external:['cloudflare:workers'],outfile:'.local/worker.mjs',target:'es2022'});
