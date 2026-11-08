#!/usr/bin/env node
/**
 * copy-services-js.mjs — Copy module lifecycle service (JS thuần) vào dist.
 *
 * Vì sao cần: ServiceManager viết bằng JS thuần (để test độc lập bằng Node
 * không cần Electron/tsc), mà tsc với allowJs tắt KHÔNG copy file .js vào
 * dist/. Main process (dist/main.js, CommonJS) load module này qua adapter
 * src/serviceLifecycle.ts, nên file .js phải có mặt ở dist/services/.
 *
 * Chạy sau `npm run build` (tsc), trước khi chạy/đóng gói app:
 *   node scripts/copy-services-js.mjs
 * G3 có thể gọi thêm bước này từ scripts/prepackage.mjs (file của G3).
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopDir = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(desktopDir, 'src', 'services');
const dst = join(desktopDir, 'dist', 'services');

mkdirSync(dst, { recursive: true });
let copied = 0;
for (const f of readdirSync(src)) {
  if (f.endsWith('.js')) {
    copyFileSync(join(src, f), join(dst, f));
    copied += 1;
    console.log(`[copy-services-js] ${f} -> dist/services/`);
  }
}
// ROUND52-I5: manifest model AI (model-manifest.json) đi kèm modelDownloader.js
// — downloader đọc SHA256/URL từ đây lúc tải model lần đầu.
if (readdirSync(src).includes('model-manifest.json')) {
  copyFileSync(join(src, 'model-manifest.json'), join(dst, 'model-manifest.json'));
  copied += 1;
  console.log('[copy-services-js] model-manifest.json -> dist/services/');
}
if (copied === 0) {
  console.error('[copy-services-js] FAIL: không thấy file .js nào trong src/services/');
  process.exit(1);
}
console.log(`[copy-services-js] OK: ${copied} file.`);
