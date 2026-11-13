# Phase 9 đợt 68 — luồng V4: presented-FPS 1080p lúc lặng + mâu thuẫn gate (kết quả đo)

**Ngày:** 08/11/2026. **Trạng thái:** ĐO ĐƯỢC (2 phiên, 6 slot). **Harness gốc:** `apps/web/scripts/measure-65r8-presented-fps.mjs` — KHÔNG sửa. **Gate:** KHÔNG hạ chuẩn, KHÔNG sửa (không phải artifact — xem §2). **Không push** (chỉ stage).

## 1. Kết luận (verdict)

| Chỉ số | Phiên 1 — lạnh (sau reboot) | Phiên 2 — ấm | Gộp 6 slot |
|---|---|---|---|
| presented 1080p lúc lặng | **11,77 fps** (9,9 / 12,24 / 13,18) | **23,68 fps** (29,29 / 20,27 / 21,48) | **17,73 fps**, khoảng **9,9–29,29** |
| draw (canvas vẽ khung mới) | **0,69 fps** (0,49 / 0,98 / 0,6) | **6,11 fps** (8,31 / 5,12 / 4,9) | **3,40 fps**, khoảng **0,49–8,31** |
| dropped | 0,52 fps (0 / 1,27 / 0,3) | 0 fps | 0,26 fps |
| mediaRate | 0,86x (0,824 / 1,035 / 0,733) | 1,00x (cả 3 rep) | 0,93x |
| phRate | 0,99x | 0,99x | 0,99x |
| Gate warmup (drawDelta, cần ≥20) | **45** (2→47) | **35** (2→37) | — |
| loadavg trong slot | 0,41–0,67 | 1,31–2,67 | — |
| Đối chứng tab trắng (presented) | 17,04 fps (rVFC 8,07) | 28,9 fps (rVFC 19,74) | — |

**Đọc đúng con số:** presented 1080p lúc lặng trên VM 2 vCPU/8 GB này **không phải một số ổn định** — nó dao động **2–3× giữa các phiên** (11,77 lạnh vs 23,68 ấm). Không được trích một phiên làm "con số chính thức"; khoảng gộp **9,9–29,29 fps (6 slot, 2 phiên)** mới là kết quả trung thực. Nguyên nhân dao động là trạng thái cache lạnh/ấm sau reboot (xem §4).

**Điểm quan trọng hơn presented là draw:** ngay cả phiên tốt (ấm), canvas preview chỉ vẽ **~6 khung mới/giây** trong lúc phát 1080p liên tục; phiên lạnh chỉ **~0,7 khung/giây** (5–10 lần vẽ trong 10 s — preview gần như đứng hình, chỉ hiện khung đã hold). Trần cứng là vòng rAF chỉ chạy **4,9–8,4 Hz** khi decode 1080p (49–84 tick/10 s), so với ~47 Hz ở 720p (S8: draw 47,21 fps). **1080p decode bằng phần mềm trên 2 vCPU bóp nghẹt vòng rAF** — đây là giới hạn phần cứng/VM, không phải bug logic vẽ.

**Đối chiếu 720p lúc lặng (S8, 1 slot):** draw 47,21 / presented 30,04 / mediaRate 1,000x. 1080p so với 720p: presented **0,39×** (phiên lạnh) đến **0,79×** (phiên ấm); draw **0,015×** (lạnh) đến **0,13×** (ấm).

## 2. Mâu thuẫn gate — đã giải quyết: gate KHÔNG phải artifact, KHÔNG sửa

Nợ U4 đợt 67: gate warmup của harness presented chết 3 lần (drawDelta 4/2/4, cần ≥20) trong khi clicktest `clicktest-64r3-fps-long.mjs` qua 2/2 (48–50 draws/6 s) cùng clip 1080p. Giả thuyết U4: bước đọc canvas `getImageData` của clicktest "hâm nóng" đường vẽ.

### 2.1 Thí nghiệm A/B — giả thuyết canvas-read BỊ BÁC BỎ

Probe mới `apps/web/scripts/measure-68v4-gate-ab.mjs` (cùng phiên app, cùng clip long1080, cùng gate, thứ tự ABA; A = kiểu presented không đọc canvas, B = kiểu clicktest có đọc `getImageData` trước gate). Phiên 08/11 17:57–17:59, load 1,14 → 0,70:

| Lần | Kiểu | drawDelta (cần ≥20) | Ghi chú |
|---|---|---|---|
| A1 | presented (không đọc canvas) | **30 — QUA** | hold +2, ticks +43, rs={4:12}, ct 0,92→10,64 |
| B2 | clicktest (đọc canvas trước gate) | **34 — QUA** | read mean 89,53 std 73,97 (5,1 ms), hold +2, ticks +48 |
| A3 | presented | **33 — QUA** | hold +2, ticks +49 (load lúc này 4,13→6,86) |

**A ≈ B (30/33 vs 34) — `getImageData` không có tác dụng nhân quả.** Draw tăng đều ngay từ mẫu đầu (không có dead period wake-up); A1 element được tạo ngay lúc phát nhưng vẫn qua 30. **Kết luận: gate không phải artifact; KHÔNG sửa gate, KHÔNG hạ chuẩn ≥20.**

### 2.2 Vậy mâu thuẫn U4 do đâu? — trạng thái phiên/VM, không phải thủ tục

5 lần chạy gate đã có số liệu (cùng clip long1080, cùng harness/gate):

| Lần chạy | drawDelta | Trạng thái VM lúc đó |
|---|---|---|
| U4 đợt 67, lần 1–3 | 4 / 2 / 4 (CHẾT) | swap 395 MB, RAM khả dụng ~524 MB, load vọt 32 |
| A/B A1/A3/B2 (đợt 68 V4) | 30 / 33 / 34 (QUA) | RAM khả dụng ~2,6 GB, load ~1 |
| Phiên 1 đo presented (19:15) | 45 (QUA) | vừa reboot, load 0,53 |
| Phiên 2 đo presented (19:23) | 35 (QUA) | load 2,90 |

**Gate qua hay chết theo đúng trạng thái VM** (RAM/swap/load), không theo thủ tục đo. Dưới trạng thái suy kiệt (swap đầy, load 32) vòng vẽ gãy thật — đó là giới hạn máy, không phải lỗi đếm của gate. Gate đo đúng cái nó cần đo (element có vẽ được không), và nó đã làm đúng việc: chặn đo khi máy không đủ sức vẽ.

## 3. Đo presented 1080p lúc lặng — 2 phiên (chi tiết)

Chạy bằng launcher `apps/web/scripts/measure-68v4-presented-launcher.mjs` (variant của harness gốc, logic đo + gate giữ nguyên 100% — xem §5). Clip `long1080.mp4` 1920×1080, 20 s; canvas preview backing 871×275; 3 rep × 10 s mỗi phiên; H9 (0 lỗi trang) + P pass cả 2 phiên, exit 0.

### Phiên 1 — "lạnh" (19:15–19:17, VM vừa reboot ~3 phút trước, load 0,41–0,67)

| rep | draw | presented | dropped | mediaRate | phRate | draws | ticks rAF | gapP50 |
|---|---|---|---|---|---|---|---|---|
| 1 | 0,49 | 9,90 | 0 | 0,824x | 0,99x | 5 | 56 | 183,3 ms |
| 2 | 0,98 | 12,24 | 1,27 | 1,035x | 0,979x | 10 | 68 | 116,6 ms |
| 3 | 0,60 | 13,18 | 0,30 | 0,733x | 0,999x | 6 | 81 | 100 ms |
| **mean** | **0,69** | **11,77** | **0,52** | **0,86x** | **0,99x** | — | — | — |

Gate: draw 2→47 (delta 45), el rs=2, ct=6,871, q.total=39 (chỉ 39 khung presented trong ~6,9 s phát — element đã trình chiếu chậm ngay từ gate). Dropped tổng 16/358 presented (≈4,5%).

### Phiên 2 — "ấm" (19:22–19:24, cùng VM sau khi phiên 1 đã làm ấm cache, load 1,31–2,67)

| rep | draw | presented | dropped | mediaRate | phRate | draws | ticks rAF | gapP50 |
|---|---|---|---|---|---|---|---|---|
| 1 | 8,31 | 29,29 | 0 | 1,000x | 0,989x | 84 | 84 | 116,6 ms |
| 2 | 5,12 | 20,27 | 0 | 1,000x | 0,99x | 52 | 51 | 200 ms |
| 3 | 4,90 | 21,48 | 0 | 1,000x | 0,999x | 49 | 49 | 200 ms |
| **mean** | **6,11** | **23,68** | **0** | **1,00x** | **0,99x** | — | — | — |

Gate: draw 2→37 (delta 35), el rs=1, ct=6,7, q.total=71. Dropped 0.

### Đối chứng tab trắng (element VISIBLE, không preview)

| | rVFC | presented | dropped | mediaRate |
|---|---|---|---|---|
| Phiên 1 | 8,07 fps | 17,04 fps | 7,97 fps (80) | 0,535x |
| Phiên 2 | 19,74 fps | 28,9 fps | 3,89 fps (39) | 0,934x |

Nhất quán với U4 M1: tab trắng presented cao hơn app (không tốn decode preview) nhưng mediaRate thấp hơn (không có syncMedia re-seek giữ nhịp). rVFC đếm thiếu ~1,5–2,1× so với presented (lại xác nhận: rVFC không thay thế được presented).

## 4. Cơ chế — vì sao draw sụp, vì sao 2 phiên khác nhau 2–3×

Bằng chứng từ số tick/vẽ (cùng bộ đếm `__vcutHoldStats.draw` và rAF):

| | Phiên 1 (lạnh) | Phiên 2 (ấm) |
|---|---|---|
| Tick rAF / 10 s | 56 / 68 / 81 (5,6–8,1 Hz) | 84 / 51 / 49 (4,9–8,4 Hz) |
| Lần vẽ / tick | 5/56, 10/68, 6/81 → **~9%** | 84/84, 52/51, 49/49 → **~100%** |
| mediaRate | 0,73–1,04x (lag, re-seek) | đúng 1,00x (không lag) |

**Chuỗi nhân quả (phiên lạnh):** cache lạnh sau reboot → phục vụ/decode media chậm → element lag (mediaRate 0,73–0,82) → syncMedia re-seek (ngưỡng 0,35 s, `playheadPacing.ts`) → element phần lớn thời gian ở trạng thái seeking/buffering (rs<2) → `decideVideoFrame` (`holdFrame.ts`) hold/skip → chỉ ~9% tick vẽ → draw 0,69 fps. Phiên ấm: mediaRate đúng 1,0x, không re-seek → mọi tick đều vẽ → draw 6,11 fps.

**Trần cứng chung cả 2 phiên:** vòng rAF chỉ 4,9–8,4 Hz khi decode 1080p (gapP50 100–200 ms, 38–47/56–81 tick giãn >100 ms). Ngay cả khi 100% tick vẽ, draw ≤ ~8 fps. So sánh: 720p (S8) draw 47,21 fps ⇒ rAF ~47 Hz. **Decode 1080p phần mềm trên 2 vCPU bóp nghẹt rAF từ ~47 Hz xuống ~5–8 Hz.** Đây là giới hạn phần cứng/VM; muốn preview 1080p mượt cần decode nhanh hơn (GPU / proxy nhẹ / giảm độ phân giải preview), không phải sửa logic vẽ.

**Lưu ý:** phiên 1 chạy ngay sau reboot nên là trường hợp xấu nhất (cold cache); phiên 2 (ấm, có luồng khác chạy, load ~2) gần với trạng thái làm việc thường ngày hơn. Cả hai đều là số thật, không loại bỏ phiên nào.

## 5. Trở ngại môi trường: EPERM, reboot VM, và cách né bằng config `.cjs`

### 5.1 EPERM chặn đo 18:04–19:07

Harness gốc chết ngay (~150 ms, exit 2) với `EPERM: operation not permitted, write` khi ghi config vite (`writeFileSync /tmp/round65-r8/vite.r8-presented.config.mjs`), lặp lại 10+ lần (18:09–18:52) kể cả lúc load ~0,3–0,5. Điều tra thực nghiệm: ghi nhỏ (1 B–37 KB) qua `node`/`cp`/`python`/`dd` lúc pass lúc fail, đảo theo cửa sổ thời gian ~1–3 phút; đã loại trừ kích thước file, đường dẫn (/tmp tmpfs và ~/workspace overlay cùng fail/pass), CWD, loại process. Phát hiện chính (bisect lặp lại 2 lần giống hệt): probe ghi OK trước `pickFreePort`, FAIL ngay sau `pickFreePort` và kéo dài ≥5 mẫu; process tiếp theo fail ngay probe đầu ⇒ yếu tố toàn hệ thống. Kết luận làm việc lúc đó: bind localhost (pickFreePort) và/hoặc spawn tiến trình con làm độc ghi file với EPERM trong ~1–2 phút.

### 5.2 VM reboot ~19:12 — xóa EPERM và /tmp

Lúc 19:13 kiểm tra: `uptime` = **up 1 min** (VM vừa reboot), `/tmp` trống hoàn toàn (tmpfs bị xóa: wrapper/launcher, config vite, script điều tra EPERM đều mất; file trong ~/workspace còn nguyên). Sau reboot, EPERM biến mất (ghi file lại bình thường). Reboot này cũng giải thích việc run1 (18:04) chết giữa chừng không rõ — tiền lệ daemon restart ở đợt 66/67. **Cơ chế gốc của EPERM không xác minh được** (`dmesg` bị chặn đọc); chỉ ghi nhận tương quan: EPERM xuất hiện khi runtime suy kiệt trước reboot, hết sau reboot.

### 5.3 Cách né (đã kiểm chứng, cho lần đo lại sau)

Variant (qua launcher, không sửa harness gốc): (1) hardcode cổng dev/debug 5550/9650 thay vì `pickFreePort`; (2) config vite pre-create bằng file-tool, variant bỏ qua ghi khi đã có đúng nội dung; (3) `pickDisplay` kiểm tra Xvfb bằng connect socket Unix thay vì `execSync`; (4) mở cả hai log fd trước mọi spawn; (5) ghi JSON/log cuối best-effort. **Mấu chốt:** đổi config vite sang **`.cjs`** — đọc source vite (`node_modules/vite/dist/node/chunks/dep-3O3b9SCF.js`): với config ESM (`.mjs`), vite ghi bundled code ra `<nearest node_modules>/.vite-temp/<basename>.timestamp-*.mjs` rồi import; với config CJS (`.cjs`, `isESM=false` qua `isFilePathESM`), vite dùng nhánh `require` với custom loader biên dịch bundled code **trong bộ nhớ** (`module._compile`), **không ghi file nào** (`bundleConfigFile` dùng esbuild `write: false`). Kiểm chứng tay: vite với config `.cjs` lên trong **213 ms**, HTTP 200, media 200 — trong khi config `.mjs` dính EPERM ở `loadConfigFromBundledFile`.

Nội dung config `.cjs` (để tạo lại bằng tay nếu thiếu; file tại `/tmp/round68-v4/vite.v4-presented.config.cjs`, KHÔNG stage vì là file sinh ra — launcher/variant tự sinh lại từ template của harness gốc):

```js
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const require = createRequire("/home/hatch/workspace/repo-1/apps/web/package.json");
const react = require("@vitejs/plugin-react").default;
const MEDIA_DIR = "/home/hatch/workspace/.scratch-r61r3-1cOf/media";
const MIME = { ".mp4": "video/mp4", ".png": "image/png", ".webm": "video/webm", ".jpg": "image/jpeg" };
const mediaPlugin = () => ({ name: "r61r3-media", configureServer(server) {
  server.middlewares.use("/r61r3-media", (req, res) => {
    const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "");
    const fp = path.join(MEDIA_DIR, name);
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!name || name.includes("..") || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.statusCode = 404; res.end("not found"); return; }
    const st = fs.statSync(fp);
    const range = req.headers.range;
    res.setHeader("Content-Type", MIME[path.extname(fp).toLowerCase()] || "application/octet-stream");
    res.setHeader("Accept-Ranges", "bytes");
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      if (m) {
        const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${st.size}`);
        res.setHeader("Content-Length", String(end - start + 1));
        fs.createReadStream(fp, { start, end }).pipe(res);
        return;
      }
    }
    res.setHeader("Content-Length", String(st.size));
    fs.createReadStream(fp).pipe(res);
  });
} });
export default { plugins: [react(), mediaPlugin()], server: { hmr: false } };
```

## 6. Giới hạn (trung thực)

- **n nhỏ:** 2 phiên × 3 slot (6 slot, 60 s đo). Phiên 1 là trạng thái lạnh sau reboot (hiếm gặp trong ngày làm việc thường); phiên 2 gần trạng thái thường hơn. Cần thêm phiên để thu hẹp khoảng, nhưng khoảng 9,9–29,29 fps đã đủ để kết luận "không ổn định, phụ thuộc trạng thái máy".
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb). Số trên máy thật (đặc biệt có GPU decode) sẽ khác hẳn — không suy ra ngoài VM.
- **Chỉ đo clip long1080.mp4** (20 s, 1920×1080) ở chế độ "lặng" (không tương tác trong lúc đo). Không đo lúc kéo timeline, scrub, hay có hiệu ứng.
- **Gate không sửa, không hạ** — nhưng gate chỉ kiểm tra 6 s đầu (trạng thái mượt nhất); slot 10 s sau đó có thể vẽ kém hơn nhiều (phiên 1: gate 7,5 fps → slot 0,69 fps). Gate qua không bảo đảm slot vẽ tốt — đó là hạn chế của thiết kế gate, ghi nhận để đợt sau cân nhắc (không đổi trong đợt này vì nhiệm vụ là đo, không phải thiết kế lại gate).
- **EPERM:** cơ chế gốc chưa xác minh được (không đọc được `dmesg`); chỉ biết nó hết sau reboot và cách né bằng `.cjs` + pre-create đã kiểm chứng qua 2 phiên đo thành công.
- **Không có số đo nào bị loại bỏ:** U4 (4/2/4), A/B (30/33/34), phiên 1 (45), phiên 2 (35) đều được giữ và đối chiếu ở §2.2.

## 7. File và log

- Probe A/B (mới, đã stage): `apps/web/scripts/measure-68v4-gate-ab.mjs` — `node --check` OK, chạy exit 0, 0 lỗi trang.
- Launcher variant (mới, đã stage): `apps/web/scripts/measure-68v4-presented-launcher.mjs` — `node --check` OK; chạy 2 phiên đều "15 thay thế OK", exit 0. Harness gốc `measure-65r8-presented-fps.mjs` KHÔNG đổi.
- Doc này: `docs/PHASE9_ROUND68_V4_PRESENTED_FPS_LIMITS.md`.
- Log đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round68-v4/presented-1080p-idle/` (phiên 1: `presented-fps.json`, `presented-fps.log`, `r8-presented-chrome.log`, `r8-presented-done.png`) và `.../presented-1080p-idle-run2/` (phiên 2, cùng bộ file); log A/B: `.../round68-v4/gate-ab-run1.log`, `gate-ab/gate-ab.json`, `gate-ab/gate-ab.log`.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round68-v4.md` (§7).
- Không stage: file config vite `.cjs` trong /tmp (file sinh ra, nội dung ở §5.3), script điều tra EPERM trong /tmp (đã mất khi reboot), ảnh `r8-presented-done.png` (binary).
