/**
 * paths.ts — Resolve đường dẫn các thành phần trong repo.
 *
 * CLI nằm ở <repo>/cli/, các script Python và render worker nằm ở
 * <repo>/server/... — resolve tương đối từ vị trí file này sau khi build.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Sau build: <repo>/cli/dist/cli/src → repo root = 4 cấp lên
export const REPO_ROOT = path.resolve(HERE, "..", "..", "..", "..");

export const RENDER_WORKER_JS = path.join(REPO_ROOT, "server", "render", "src", "render.js");
export const RENDER_VALIDATE_JS = path.join(REPO_ROOT, "server", "render", "src", "validate.js");
export const CAPTION_PY = path.join(REPO_ROOT, "server", "caption", "caption.py");
export const TTS_PY = path.join(REPO_ROOT, "server", "tts", "tts.py");
export const PYTHON_BIN = process.env.VCUT_PYTHON || "python3";
