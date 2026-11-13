# LIMITS — Phase 9 đợt 68, luồng V9: docs — README stale + hướng dẫn thêm tay 4 workflow CI còn lại

Ngày: 09/11/2026 (lượt cron 00:35 +07). Nhiệm vụ: đóng nợ U9 đợt 67 §9
mục 2–4, phần docs (README stale từ Phase 8 + hướng dẫn thêm tay 4 workflow
CI còn lại). KHÔNG push, KHÔNG release/tag, KHÔNG binary. Chỉ sửa file text
trong `~/workspace/repo-1`. Ranh giới với luồng V1 đợt 68: V1 là chủ sở hữu
DUY NHẤT của `SECURITY.md`, `README.md` phần số liệu audit, và
`server/bgremove/requirements.txt` — luồng này KHÔNG sửa `SECURITY.md`,
KHÔNG sửa số liệu audit trong README/FEATURE_STATUS (chỉ ghi chú cho parent
ở §5).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **README đã sửa 4 chỗ stale** (không liên quan số audit): animation 18 →
   **21** (16 drawtext + 5 ASS); REST "16 endpoints" → **23 endpoint**
   (OpenAPI mô tả 17 operation/15 path); thêm app desktop Electron vào
   quickstart + cây thư mục (Phase 10, trước đây README không nhắc tới);
   các số kho trong bảng Tính năng chính (font 59/67 .ttf, preset 96,
   transitions 81, LUT 174, FX 16, SFX 1043, sticker 244) đã đúng — nợ T10
   §6 mục 4 đã được đóng (nhiều khả năng do U8 đợt 67 sửa README lúc
   16:26–16:27 UTC 08/11, xem `docs/PHASE9_ROUND67_LIMITS.md` §7).
2. **`ci-build.yml` header stale đã sửa:** cảnh báo "mcp-server build HIỆN
   ĐANG FAIL" (TS2835/TS2459) đã sai — cả hai lỗi đều sửa xong ở nguồn;
   kiểm chứng thật 09/11: `cd mcp-server && npm run build` → tsc exit 0.
   Step mcp-server kỳ vọng xanh ở lần chạy CI đầu.
3. **Hướng dẫn thêm tay 5 workflow:** doc mới `docs/CI_MANUAL_ADD_GUIDE.md`
   — luồng click chung (theo mẫu U9 §5) + bảng 5 file + kỳ vọng lần chạy đầu
   từng file + checklist. Kỳ vọng: `ci-security` pip-audit ĐỎ (tts 39,
   bgremove đã sạch sau U8); `ci-build`/`ci-e2e`/`ci-integration` xanh kỳ
   vọng; `release` không chạy cho tới khi có tag (và KHÔNG được tạo tag để
   thử — release gate giữ nguyên).
4. **FEATURE_STATUS cập nhật 8 điểm đợt 67** (i18n 2297 → 2369, trần GOP
   60 → 90 s, sharpen headed KHỚP, noise 2-stage, stabilize `-threads 1`,
   legacy adopt UI + job history, Mask E1 đã làm, TTS clone đã expose,
   hàng mới app desktop Electron). Mọi điểm đều đối chiếu được trên đĩa
   hoặc LIMITS luồng có kiểm chứng (xem §4).
5. **Số audit CVE trong FEATURE_STATUS CHƯA sửa** (tts 39 / bgremove 66 ở
   mục "Những gì CHƯA có") — thuộc V1 đợt 68; U8 đã chứng minh bgremove
   66 → 0, ghi chú cho parent ở §5, không tự sửa.

## 1. Rà soát README.md — đã sửa

Đối chiếu từng claim trong bảng "Tính năng chính" + quickstart + cây thư mục
với file/code trên đĩa (09/11):

| Claim README | Đối chiếu | Kết quả |
|---|---|---|
| Chữ: 59 font, 67 .ttf, 96 preset | `assets/fonts/files/*.ttf` = 67; `catalog.json count: 59`; `assets/text-presets/*.css` = 96 | ✅ Đúng, không sửa |
| Chữ: "18 animation render thật" | `TEXT_ANIMATIONS` = 22 entry (21 thật, trừ "none"); `DRAWTEXT_ANIMATIONS` = 17 entry (16 thật); 5 còn lại qua ASS: typewriter (`render.js:328,971` subtitles ASS) + tiltIn/skewIn/slideReveal/curtainIn (`render.js:1002`, `textAnimParity.js`) | 🔴 **Sai → sửa thành 21 (16 drawtext + 5 ASS)** |
| Chuyển cảnh: 81 (58 xfade + 23 custom-expr) | `TRANSITION_TYPES` = 82 entry (81 + "none"); FEATURE_STATUS đếm 08/11: 58 xfade + 9 P5 + 14 V3 | ✅ Đúng, không sửa |
| Màu: 174 LUT + 7 slider | `assets/filters/*.cube` = 174; `ColorAdjustPanel.tsx:7` "7 slider" | ✅ Đúng, không sửa |
| Hiệu ứng: 16 video FX | `EFFECT_TYPES`, `packages/video-spec/src/effects.ts` (FEATURE_STATUS đã đếm 16) | ✅ Đúng, không sửa |
| Âm thanh: 1043 SFX CC0 | `assets/sounds/index.json total_sounds: 1043`, đủ 1043 entry; trên đĩa 107 file .ogg (936 uisfx fetch-on-demand — nuance đã ghi trong FEATURE_STATUS) | ✅ Đúng (số index), không sửa |
| Sticker: 244 | `assets/stickers/*.png` = 244 | ✅ Đúng, không sửa |
| AI local: TTS 25 giọng, xoá nền BiRefNet, reframe 9:16 | 25 giọng (U8 verify thật 25 giọng); `server/bgremove` birefnet; reframe service có sẵn | ✅ Đúng, không sửa |
| Xuất: 720p/1080p/4K/TikTok/YouTube/IG | `exportPresets.ts`: 720p, 1080p, 4k (3840×2160), tiktok 9:16, youtube 1080p, ig-square 1:1 + custom | ✅ Đúng, không sửa |
| Agent API: MCP 29 tools | 6 `server.tool(` trong `mcp-server/src/index.ts` + 23 trong `mcp-server/src/tools/*.ts` | ✅ Đúng, không sửa |
| Agent API: "REST OpenAPI 16 endpoints" | `server/bridge/openapi.yaml`: 15 path, 17 operation (7 GET + 10 POST); `server/bridge/src/index.js`: 23 route `/api/*` phân biệt (8 route chưa vào OpenAPI doc: `/api/` root, beats/analyze, gpu-probe/reprobe, luts/:id, proxy, proxy/file/:name, reframe/analyze, tts/clone) | 🔴 **Sai → sửa thành "REST 23 endpoint (OpenAPI mô tả 17 operation trên 15 path)"** |
| Agent API: CLI `vcut` 15 lệnh | 11 file `cli/src/commands/*.ts` + 4 lệnh `list-*` trong `cli/src/index.ts` (list-transitions/list-luts/list-animations/list-voices) = 15 | ✅ Đúng, không sửa |
| Quickstart: "Node ≥ 20, Python ≥ 3.12" | root `package.json` engines node ≥20; bgremove venv nay yêu cầu Python 3.12 (U8) | ✅ Đúng, không sửa |
| Quickstart/cây thư mục: không nhắc app desktop | `apps/desktop/` tồn tại (Electron, Phase 10); `docs/DESKTOP.md` có hướng dẫn chạy | 🔴 **Thiếu → thêm quickstart `npm run dev:desktop` / `npm run start:desktop` + dòng `apps/desktop/` vào cây thư mục** |
| "SPEC v0.2.0" | `SPEC_VERSION = "0.2.0"` (`packages/video-spec/src/index.ts:18`) | ✅ Đúng (package.json 0.1.0 là version npm package, không phải SPEC), không sửa |
| "undo 100 bước" | `MAX_HISTORY = 100` (`apps/web/src/lib/commands.ts:57`) | ✅ Đúng, không sửa |
| "EQ/noise/compressor/reverb" | `AudioFxPanel.tsx`: bass/treble ±12 dB, compressor, reverb, giảm nhiễu | ✅ Đúng, không sửa |

Không tìm thấy claim TTS "1,5–2,5×" trong README (số cũ đã bị bác bỏ 06/11
chỉ còn xuất hiện trong FEATURE_STATUS note 7 dưới dạng đính chính — đúng
dạng, không sửa).

## 2. `ci-build.yml` — header stale, đã sửa (kiểm chứng thật)

- Header cũ cảnh báo mcp-server build "HIỆN ĐANG FAIL" vì TS2835 (import
  thiếu `.js`) + TS2459 (`Transition` không export).
- Đối chiếu 09/11: `packages/video-spec/src/index.ts` nay export bằng import
  có đuôi `.js` (vd dòng 24 `export * from "./transitions.js"`); type
  `Transition` đã export (dòng 320, interface ở `transitions.ts:209`).
- Kiểm chứng thật: `cd mcp-server && npm run build` → tsc exit 0, không lỗi
  (09/11, ~81 s). Artifact `mcp-server/dist/` do lần build này sinh ra đã
  xóa (thuộc `.gitignore`, không đưa vào batch).
- Đã sửa header comment: ghi rõ hai lỗi cũ đã sửa, build đã pass, nếu step
  này đỏ lại trên GitHub thì là regression mới. Không đổi hành vi workflow
  (job/step giữ nguyên).

## 3. Hướng dẫn thêm tay workflow — `docs/CI_MANUAL_ADD_GUIDE.md` (mới)

Doc mới, theo đúng mẫu bước 7 §5 của U9 (luồng click Add file → Create new
file → Commit new file → tab Actions), mở rộng cho cả 5 file:

- §1 luồng thao tác chung (1 lần, áp dụng cho cả 5 file).
- §2 bảng 5 file + thứ tự khuyên dùng (security → build → e2e → integration
  → release) + kỳ vọng lần chạy đầu.
- §3 từng file: kiểm tra gì, điều gì sẽ đỏ:
  - `ci-security`: pip-audit ĐỎ (tts 39 — gradio kẹp `pillow<13` nên không
    bump được, U8 đã chứng minh `ResolutionImpossible`; bgremove đã sạch
    66 → 0 sau U8); npm-audit lần đầu có số (local luôn 403 policy).
  - `ci-build`: matrix Node 20/22; mcp-server kỳ vọng xanh (xem §2);
    unit test chạy mọi file `*.test.mjs`/`*.test.js` nên lần đầu có thể lâu.
  - `ci-e2e`: path-filter `apps/web/**`, Playwright smoke
    (`apps/web/e2e/smoke.spec.ts`), lịch Chủ nhật 02:00 UTC; smoke UI, không
    test render MP4 thật.
  - `ci-integration`: 6 demo render + ffprobe (h264 + thời lượng); comment
    "Effects: 7 file" là số cũ (nay 16 FX) nhưng bước kiểm tra dùng glob nên
    không sai kết quả — ghi chú, không sửa workflow.
  - `release`: chỉ chạy khi push tag `v*`; guard tag khớp `package.json`
    (hiện 0.1.0 → tag đầu sẽ là `v0.1.0`); KHÔNG tự tạo GitHub Release;
    **KHÔNG tạo tag để thử** (release gate giữ nguyên).
- §4 cách đọc log lần chạy đầu; §5 checklist 8 mục; §6 nợ mở (quyền 403,
  npm audit, TTS 39, `pip install pip-audit` không pin version).

## 4. FEATURE_STATUS.md — đã cập nhật (đợt 67)

Thêm khối "Cập nhật 09/11/2026 — đợt 67" ở đầu file + cập nhật các điểm sau.
Mọi số đều đối chiếu trên đĩa hoặc trích LIMITS luồng có kiểm chứng:

| Điểm | Trước (cũ) | Sau (mới) | Nguồn số |
|---|---|---|---|
| i18n key lá | 2297 (đợt 65) ở 3 chỗ: khối cập nhật đợt 64–65, note 10, mục "Số lượng type/kho" | **2369** (2326 sau gộp đợt 67 closing → 2369 sau khi parent gộp muộn fragment U6 28 + U7 15 key, 0 collision, vi==en) | Đếm lại trên đĩa 09/11: `vi leaves: 2369, en leaves: 2369` + `docs/PHASE9_ROUND67_LIMITS.md` §0/§6 |
| Trần trial-decode GOP | 60 s (đợt 64 R10) | **90 s** (đợt 67 U5: công thức 78.536 ms ở 64 MiB; probe treo đợt 66 không tái hiện) | `docs/PHASE9_ROUND67_U5_KEYFRAME_MARGIN_LIMITS.md` + đối chiếu code: `gopTrialDecodeWorker62R4.ts:104` = `90_000` |
| Sharpen headed | XẤP XỈ (đợt 65 S7: MAD 0,194→0,161; le8 tốt nhất 98,3%) | Đính chính đợt 67 U3: sharpen headed **KHỚP trong chính decoder của preview** (MAD 0,000, le8 100%, 4 cảnh × 2 mức); còn lại ocean sharp10 XẤP XỈ, basgo sharp10 w1440/1:1 chưa KHỚP-trừ-sàn | `docs/PHASE9_ROUND67_U3_SHARPEN_DECODE_FLOOR_LIMITS.md` |
| Noise Chrome | Headed vẫn LỆCH, phần dư là resample | Thêm đợt 67 U2: mô hình 2-stage; w1440 noise05 chỉ còn lệch Δcorr R-G 0,199; ngưỡng halve 0,45–0,63 chưa đo | `docs/PHASE9_ROUND67_U2_NOISE_CHROME_FILTER_LIMITS.md` |
| Stabilize | Không nhắc `-threads 1` | Thêm đợt 67 U1: ép `-threads 1` chỉ bước transform vidstab (code + CLI `--no-stab-single-thread` + env); chưa có toggle UI; cơ chế chưa rõ | `docs/PHASE9_ROUND67_U1_THREADS1_LIMITS.md` |
| Save/Load | "mảnh mơ hồ chưa có UI nhận thủ công" | Thêm đợt 67 U6: `LegacyHistoryAdoptModal` (27 key `legacyAdopt.*`, hoàn tác 1 mức) + đợt 67 U7: lịch sử job + resume khi mở ExportPanel (fragment `jobHistory.*` 15 key) | `docs/PHASE9_ROUND67_U6_LEGACY_REOPEN_LIMITS.md`, `docs/PHASE9_ROUND67_U7_JOB_HISTORY_LIMITS.md` |
| Mask E1 | "hướng sửa E1 (pre-render PNG mask) chưa làm" (note 6 + mục "Những gì CHƯA có") | **E1 ĐÃ LÀM từ Phase 9 R2**: `maskMode: "png"` mặc định (`render.js:206`), vẽ PNG 1 lần bằng `mask_png.py`, fallback geq khi vẽ lỗi; `mask.js --self-test` pass 09/11. Số 0,97 fps chỉ đúng cho đường geq cũ (RESULTS §7.1) — **chưa đo lại fps đường PNG**, không mạo nhận đã nhanh | Đối chiếu code: `render.js:1570-1610`, `mask.js:240-310` + self-test chạy thật 09/11 |
| TTS voice cloning | "chưa expose UI/bridge" (note 7) | **ĐÃ expose**: engine `--ref-audio`, bridge `POST /api/tts/clone` (`index.js:1634`), UI checkbox clone trong `TtsButton.tsx:48-88`; test clone thật 24/10 (mẫu mono 2,64 s → `cloned: true`, tổng hợp 5,3 s). Còn thiếu: clone + đa-chunk chưa test kết hợp | `apps/web/src/lib/R4_LIMITS.md` §3.5 + đối chiếu code bridge/UI/engine |
| App desktop | Không có hàng; mục "Những gì CHƯA có" ghi "App native ... vẫn không có" | Thêm hàng mới **Desktop app (Electron, Linux)** IMPLEMENTED-PARTIAL (G6 43/43, AppImage 128.102.744 byte + .deb 103.006.396 byte; app đóng gói chưa tự chạy đủ services, bridge mồ côi khi kill -9, .deb chưa chạy được trên VM) + sửa bullet "CHƯA có" (desktop đã có; mobile native vẫn không có) | `docs/PHASE10_LIMITS.md` §1/§4/§5 + `docs/DESKTOP.md` |

## 5. Ghi chú cho parent / V1 đợt 68 (KHÔNG tự sửa — ngoài ranh giới)

1. **Số audit trong FEATURE_STATUS mục "Những gì CHƯA có" đã cũ:**
   đoạn CI/CD vẫn ghi **bgremove 66 lỗ hổng** (rembg 2.0.60: 4 + Pillow
   10.2.0: 62) và "bgremove đổi pin ở đợt 53-J8". Theo log U8
   (`hidden_files/round67-u8.md` checkpoint 22:3x + `requirements.txt` trên
   đĩa): bgremove nay là rembg 2.0.87 + Pillow 13.0.0, pip-audit sau bump
   **"No known vulnerabilities found", exit 0 (66 → 0)**; tổng 2 file
   105 → 39 (chỉ còn tts 39). V1 cập nhật số audit trong FEATURE_STATUS +
   SECURITY.md khi verify xong.
2. **TTS 39 vẫn đúng** (Pillow 12.3.0 transitive, gradio kẹp `pillow<13` —
   U8 đã chứng minh không bump được). Số này cũng thuộc V1, không sửa ở đây.
3. **README đã được U8 sửa lúc 16:26–16:27 UTC 08/11** (theo
   `docs/PHASE9_ROUND67_LIMITS.md` §7 — "SECURITY.md + README.md đã sửa
   trên đĩa ... chưa xác nhận nội dung vào batch"): bảng Tính năng chính nay
   đã đúng số kho — nhưng **U8 không có paths file riêng** nên không rõ
   README có nằm trong batch stage nào không. Parent kiểm tra khi gộp đợt
   67/68 để README không bị sót khỏi push.
4. **`ci-security.yml` KHÔNG sửa trong luồng này** (không lệch — U9 đã rà
   soát; chỉ `ci-build.yml` sửa header comment, xem §2).

## 6. Không đụng / không làm

- **Không sửa `SECURITY.md`** (V1 sở hữu).
- **Không sửa số liệu audit** trong README/FEATURE_STATUS (V1 sở hữu — xem §5).
- **Không sửa code sản phẩm** — chỉ 3 file text (README.md,
  `.github/workflows/ci-build.yml` comment header, FEATURE_STATUS.md) + 2
  file mới (CI guide + LIMITS này). Vì vậy không chạy tsc/vite build/test
  suite (không có code nào đổi; chỉ chạy 2 kiểm chứng có mục tiêu:
  `mcp-server build` tsc exit 0 + `mask.js --self-test` pass — xem §2/§4).
- Không thử push / không ghi qua GitHub connector. Không tạo tag/release.
- Không kiểm chứng lại trong đợt này (ghi nợ, không mạo nhận): fps đường
  mask PNG sau E1 (chưa đo — xem §4); số CVE npm (chỉ có sau lần chạy CI
  đầu trên GitHub); presented 1080p lúc lặng (U4 chưa đo được); Safari.

## 7. Batch stage (KHÔNG push)

File stage: `~/workspace/repo-1-push/paths-loop/phase9-round68-v9-docs-ci.txt`
(NUL-delimited, text only, verify read-back — xem log luồng):

- `README.md` (sửa — 4 chỗ §1)
- `.github/workflows/ci-build.yml` (sửa — header comment §2)
- `docs/FEATURE_STATUS.md` (sửa — 8 điểm đợt 67, §4)
- `docs/CI_MANUAL_ADD_GUIDE.md` (mới — §3)
- `docs/PHASE9_ROUND68_V9_DOCS_CI_LIMITS.md` (mới — file này)

**KHÔNG có trong batch:** `.github/workflows/ci-security.yml`,
`ci-e2e.yml`, `ci-integration.yml`, `release.yml` (không sửa nội dung —
chỉ hướng dẫn thêm tay trong `CI_MANUAL_ADD_GUIDE.md`; user thêm tay qua
web khi sẵn sàng). Không binary.
