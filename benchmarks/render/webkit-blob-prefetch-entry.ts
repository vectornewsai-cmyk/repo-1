// webkit-blob-prefetch-entry.ts — entry nhỏ để probe WebKit import
// MediaPool production (đợt 90 R3). Probe script tự bundle file này
// bằng esbuild trước khi chạy (không stage bundle ra).
import { MediaPool } from "../../apps/web/src/media";

(window as unknown as { __MediaPool: typeof MediaPool }).__MediaPool = MediaPool;
