import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const devOutputDirectory = join(process.cwd(), '.next-dev');

await rm(devOutputDirectory, { force: true, recursive: true });
console.log('[clean-next-dev] .next-devを削除しました');
