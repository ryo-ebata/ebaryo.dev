import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const MEBIBYTE = 1024 * 1024;
const MAX_WORKER_BYTES = 32 * MEBIBYTE;
const MAX_ASSET_BYTES = 25 * MEBIBYTE;
const MAX_ASSET_FILES = 20_000;
const workerPath = path.join('.open-next', 'server-functions', 'default', 'handler.mjs');
const assetsPath = path.join('.open-next', 'assets');

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
    })
  );
  return files.flat();
};

const assetFiles = await collectFiles(assetsPath);
const assetSizes = await Promise.all(
  assetFiles.map(async (filePath) => ({ filePath, size: (await stat(filePath)).size }))
);
const workerBytes = (await stat(workerPath)).size;
const oversizedAssets = assetSizes.filter(({ size }) => size > MAX_ASSET_BYTES);
const failures = [
  ...(workerBytes > MAX_WORKER_BYTES
    ? [`Worker bundle: ${workerBytes} bytes > ${MAX_WORKER_BYTES} bytes`]
    : []),
  ...(assetFiles.length > MAX_ASSET_FILES
    ? [`Static assets: ${assetFiles.length} files > ${MAX_ASSET_FILES} files`]
    : []),
  ...oversizedAssets.map(
    ({ filePath, size }) => `Static asset: ${filePath} (${size} bytes) > ${MAX_ASSET_BYTES} bytes`
  ),
];

console.log(
  JSON.stringify(
    {
      assetFiles: assetFiles.length,
      failures,
      largestAssetBytes: Math.max(0, ...assetSizes.map(({ size }) => size)),
      workerBytes,
    },
    null,
    2
  )
);

if (failures.length > 0) process.exitCode = 1;
