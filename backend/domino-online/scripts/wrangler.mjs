import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
await mkdir('.local',{recursive:true});
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js',...process.argv.slice(2)], {
  stdio:'inherit', env:{ ...process.env, WRANGLER_SEND_METRICS:'false', WRANGLER_LOG_PATH:resolve('.local/wrangler.log') }
});
child.on('error',error=>{ console.error(error.message); process.exitCode=1; });
child.on('exit',async code=>{
  try {
    if (code === 0 && process.argv[2] === 'types') {
      const path = process.argv[3] ?? 'worker-configuration.d.ts';
      const generated = await readFile(path,'utf8');
      await writeFile(path,generated.replace(/[\t ]+$/gm,''),'utf8');
    }
    process.exitCode=code ?? 1;
  } catch (error) { console.error(error.message); process.exitCode=1; }
});
