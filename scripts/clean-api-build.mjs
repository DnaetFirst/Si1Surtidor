import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// tsc does not remove outputs for moved sources. Never leave obsolete controllers in dist.
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(workspace, 'apps/api/dist');
if (dirname(target) !== resolve(workspace, 'apps/api')) throw new Error('Unexpected build directory');
rmSync(target, { recursive: true, force: true });
