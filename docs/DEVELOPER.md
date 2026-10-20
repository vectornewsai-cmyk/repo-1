# Developer Guide — VCut Studio

> English developer documentation. For end users, see [USER_GUIDE.md](USER_GUIDE.md)
> (Vietnamese). Architecture overview: [ARCHITECTURE.md](../ARCHITECTURE.md).

## Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository layout](#2-repository-layout)
3. [Running the stack](#3-running-the-stack)
4. [video-spec: the shared contract](#4-video-spec-the-shared-contract)
5. [apps/web: the editor](#5-appsweb-the-editor)
6. [server/render: the render worker](#6-serverrender-the-render-worker)
7. [server/bridge: the HTTP bridge](#7-serverbridge-the-http-bridge)
8. [Python AI services](#8-python-ai-services)
9. [mcp-server: the agent layer](#9-mcp-server-the-agent-layer)
10. [cli: the command-line interface](#10-cli-the-command-line-interface)
11. [Assets warehouse](#11-assets-warehouse)
12. [Testing](#12-testing)
13. [i18n](#13-i18n)
14. [Accessibility notes](#14-accessibility-notes)
15. [Contributing & honesty rules](#15-contributing--honesty-rules)

---

## 1. Prerequisites

- **Node.js ≥ 20** (npm workspaces), **Python ≥ 3.10**, **FFmpeg** in PATH
  (verified with FFmpeg 8.1.2; `xfade` needs ≥ 4.4).
- Optional for AI features: model downloads (see §8). Everything runs on CPU;
  GPU only speeds up background removal.

## 2. Repository layout

```
repo-1/
├── apps/web/              # React + TypeScript + Vite editor (Zustand store)
├── packages/video-spec/   # JSON spec types, validation, migrations, math (TS+JS mirrors)
├── server/render/         # Node render worker: video-spec → MP4 via FFmpeg (zero npm deps)
├── server/bridge/         # Express bridge (port 8787): render queue, AI endpoints, OpenAPI
├── server/caption/        # faster-whisper auto-caption (+ vi→en translate)
├── server/tts/            # VieNeu-TTS Vietnamese text-to-speech
├── server/bgremove/       # rembg + BiRefNet background removal
├── server/reframe/        # OpenCV auto-reframe (16:9 → 9:16)
├── server/silence/        # FFmpeg silencedetect wrapper
├── server/scene/          # FFmpeg scene-cut detection
├── mcp-server/            # MCP server (stdio): 29 tools for AI agents
├── cli/                   # `vcut` CLI (15 commands)
├── assets/                # Warehouse: LUTs, stickers, fonts, sounds, transitions + SOURCES.md
└── docs/                  # Guides, roadmap, baseline, feature matrix
```

## 3. Running the stack

```bash
# Web editor (Vite dev server)
npm run dev:web            # → http://127.0.0.1:5173

# Bridge (render + AI endpoints)
cd server/bridge && npm install && node src/index.js   # → http://127.0.0.1:8787

# One-off render without the bridge
cd server/render && node src/render.js --spec <spec.json> --out out.mp4 --media-dir <dir>
```

The editor talks to the bridge at `VITE_BRIDGE_URL` (default `http://127.0.0.1:8787`).

## 4. video-spec: the shared contract

`packages/video-spec` is the single source of truth. Every producer (web UI, MCP,
CLI) and every consumer (render worker) speaks this JSON.

- `SPEC_VERSION` is currently `0.2.0`. Additive-only changes; old projects
  migrate via `migrate()` (`migrations.ts`).
- Invariants are codified and tested, e.g. `SPEED_INVARIANT.md`:
  `timelineDuration = (out − in) / speed`.
- Each domain ships a TS module **and** a JS mirror (`*.js` next to `*.ts`) so the
  zero-dependency render worker can `require()` the same math.
- `validateVideoSpec()` rejects bad specs before render; `validate.js` in
  `server/render` is the worker-side equivalent.

Track kinds: `video`, `audio`, `text`, `sticker`, `image`. Clip fields cover
trim (`in`/`out`), speed, reverse, opacity, keyframes (x/y/opacity), chroma key,
LUT filter, effects, transitions, text style/animation, audio FX.

## 5. apps/web: the editor

- **State**: Zustand store (`src/store.ts`) + command pattern (`src/lib/commands.ts`)
  for undo/redo (100 steps, drag-grouping, slider merge window).
- **Preview** (`src/lib/previewEngine.ts`) mirrors the render pipeline order
  (speed → chroma → LUT → effects → opacity → keyframes) so WYSIWYG holds.
- **Audio preview** (`src/lib/audioEngine.ts`) uses Web Audio; gain order matches render.
- **Timeline** (`Timeline.tsx`): drag/trim/split, snap, zoom, multi-select
  (Shift/Ctrl+click, box select), ripple delete, track mute/lock/hide.
- **Persistence** (`src/lib/projectRepo.ts`): localStorage autosave (5s debounce),
  `.vcut.json` files, `.vcut.zip` archives with SHA-256 manifest, missing-media
  relink, IndexedDB asset store with SHA-256 dedup.
- Global shortcuts live in `App.tsx` (Space/S/Delete/Ctrl+Z/Ctrl+S/Ctrl+A/Esc).

## 6. server/render: the render worker

Zero npm dependencies — pure Node + FFmpeg CLI.

Pipeline per clip: **speed → chroma (yuva420p alpha preserved) → LUT → effects →
opacity → keyframes → transitions (xfade)**. Compositing order: video → image →
sticker → text (drawtext). Audio: volume → fadeIn → fadeOut → mute, per-track
mute respected.

Key modules: `render.js` (orchestrator), `transitions.js` (58 xfade types),
`lut.js` (104 LUTs), `effects.js`, `keyframes.js`, `validate.js`, `opacity.js`.
Each ships `--self-test` and an honest `*_LIMITS.md` documenting what it cannot do.

## 7. server/bridge: the HTTP bridge

Express server, default port **8787**. Highlights:

- `POST /api/render` → FIFO job queue (`jobQueue.js`), real-time progress parsed
  from FFmpeg stderr (`time=`/`frame=`), ETA, cancel (kills process tree), retry.
  Post-render QA via ffprobe; bad files are never served.
- AI endpoints: `/api/caption`, `/api/caption/translate`, `/api/tts`
  (+ `/api/tts/voices`), `/api/bgremove`, `/api/reframe`, `/api/silence`, `/api/scene`.
- Hardening: rate limiting, 256 MB disk guard, JSON-only errors, fixed argv
  (no shell), magic-byte upload validation, NDJSON streaming for long jobs.
- Full contract: [`openapi.yaml`](../server/bridge/openapi.yaml) (OpenAPI 3.0,
  validated) served live at `GET /api/openapi.json`. Curl examples in
  [`API.md`](../server/bridge/API.md).

## 8. Python AI services

All local, no cloud calls:

| Service | Engine | Model | License |
|---|---|---|---|
| `server/caption` | faster-whisper `small` | ~462 MB | MIT (code) |
| `server/caption/translate.py` | faster-whisper `translate` task | same | MIT |
| `server/tts` | VieNeu-TTS v3 Turbo (0.5B) | ~2.3 GB | **Apache-2.0** (verified; 0.3B is CC BY-NC — never use) |
| `server/bgremove` | rembg + `birefnet-general` | ~973 MB | **MIT** (RVM rejected: GPL-3.0; bria-rmbg rejected: non-commercial) |
| `server/reframe` | OpenCV (Haar + motion, zero-phase smoothing) | bundled cascades | BSD |
| `server/silence` | FFmpeg `silencedetect` | — | — |
| `server/scene` | FFmpeg `select='gt(scene,T)'` | — | — |

Each service has `*_LIMITS.md` with verified licenses and measured limits
(e.g. watermark disabled via `apply_watermark=False` in TTS; BiRefNet OOM on
8 GB RAM → fall back to `u2net`).

## 9. mcp-server: the agent layer

TypeScript MCP server over stdio. **29 tools** (see `mcp-server/TOOLS.md`):
project/clip CRUD, filters, effects, text animation, speed, keyframes, all 7 AI
services, export presets, undo/redo (in-memory, 50 steps), and `render_video`.

Security: no arbitrary shell — only the render worker and fixed-argv Python
scripts are spawned; path traversal blocked; every spec validated before save.

## 10. cli: the command-line interface

`cli/` provides the `vcut` binary (15 commands: `create`, `add-clip`, `add-text`,
`apply-transition`, `apply-filter`, `set-speed`, `caption`, `tts`, `render`,
`validate`, `info`, `list-*`). It reuses `packages/video-spec` for I/O and the
render worker's `validate.js` — no duplicated logic. See `cli/README.md`.

## 11. Assets warehouse

`assets/` holds the content library; every item is MIT/CC0/CC-BY/Apache-2.0/OFL
with 1:1 attribution in `assets/SOURCES.md`:

- 104 LUTs (`.cube`), 203 stickers (PNG), 43 Vietnamese-capable fonts (OFL),
  948 CC0 sound effects, 58 transitions catalog, 56 text presets.
- Binaries are **not** committed: `fetch_*.sh` scripts download with SHA-256
  verification; generators (`gen_vcut_luts*.py`, `make_stickers*.py`) reproduce
  originals.

## 12. Testing

```bash
npm test                        # unit + integration (root)
# Per-module suites:
bash apps/web/scripts/test-*.sh # web unit tests (Node, no browser needed)
node server/render/src/lut.js --self-test
bash server/bridge/test-export-e2e.sh
```

Honesty rule: a feature is "done" only with real renders/pixel checks or
equivalent evidence — never from UI presence alone. See the master plan's
acceptance checklist (repo `REPO1_MASTER_PLAN_*.md` in the workspace).

## 13. i18n

Minimal built-in system, no external deps: `apps/web/src/i18n/{vi,en}.json` +
`src/i18n/index.ts` (`t(key, vars?)`, `useLang()`, `setLang()`). Language
persists in `localStorage` (`vcut-lang`); missing `en` keys fall back to `vi`.
Currently wired: TopBar, splash screen, MediaBin, modal close buttons. Deeper
panels are being migrated incrementally — see `apps/web/src/i18n/README.md`.

## 14. Accessibility notes

- Icon-only buttons carry `aria-label`; emoji inside are `aria-hidden`.
- All modals: `role="dialog"`, `aria-modal="true"`, labelled; **Esc** closes.
- Toast/flash messages use `role="status"` + `aria-live="polite"`.
- Global keyboard shortcuts (Space/S/Delete/Ctrl+Z/Ctrl+A/Ctrl+S) work without a
  mouse for core editing; timeline clip handles remain pointer-first (known gap).

## 15. Contributing & honesty rules

1. **No fake code.** If it doesn't run, mark `TODO` — never demo a stub.
2. **Original work only.** No copied CapCut code, assets, or trade dress.
3. **Clean licenses.** MIT/Apache-2.0/CC0/CC-BY/OFL only; verify the upstream
   LICENSE file yourself; record it in `assets/SOURCES.md` and `*_LIMITS.md`.
4. **Verify before claiming.** Real renders, pixel checks, `ffprobe` — the
   acceptance checklist in the master plan is mandatory.
5. **Careful over fast.** Production-grade or it doesn't merge.

License: MIT — see [LICENSE](../LICENSE).
