# Phase 9 đợt 46, luồng B5 — Probe: trần 1000 trên element preview thật (MediaPool) + sửa nhãn docs cũ tại chỗ — LIMITS

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo.
KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ Z5/A5).
Luồng này sửa 19 nhãn sai tại chỗ (17 dòng docs + 2 dòng pipe),
thêm 1 script đo pool-cap + 1 test khóa 46B5 + file này — không sửa
logic sản phẩm, không sửa preview.tsx, store.ts, tsconfig.json,
bridge, hay file của luồng khác.

Đọc trước: `docs/PHASE9_ROUND45_A5_PROBE_LIMITS.md` §4.1 (nợ trần 1000
trên element preview thật) và §2 (bảng audit 19 dòng sai nhãn),
`docs/PHASE9_ROUND44_Z5_PROBE_LIMITS.md` §1 (trần 1000 trong trang
app — element tạo tay, chưa phải pool element).

## 0. Kết luận ngắn

1. **Trần 1000 GIỮ ĐÚNG trên element preview thật của MediaPool.**
   Entry seek kẹt (k=6, pool element qua endpoint treo) giữ đúng
   **1000 mẫu đầu, dropped 27 lúc read, chốt unresolved, seeking vẫn
   true lúc read** — không tràn bộ nhớ, không mất lặng lẽ. Đây là
   lần đầu trần được đo trên đúng element do `MediaPool.videoFor()`
   tạo (instance pool của PreviewCanvas trong app thật, lấy qua cây
   fiber theo mẫu harness I6), qua đường asset HTTP (server nhỏ giọt
   / treo như Z5) — đóng nợ A5 §4.1 ở mức element pool.
2. **NHƯNG: seek nhỏ giọt ~38 s KHÔNG chạm trần trong lượt này.**
   Hai seek drip trên pool element chỉ giữ 780 và 532 mẫu (chốt
   completed, dropped 0) dù wall time 37–38 s tương đương lượt Z5
   (Z5 drip chạm 1000 mẫu trong ~38 s). Khác biệt nằm ở tốc độ tick
   rAF của probe dưới tải (trung bình ~21 và ~14 mẫu/s ở đây, so
   với ~26 mẫu/s của Z5), không phải ở loại element: **số mẫu đếm
   theo tick rAF trong lúc seeking, không theo giây wall.** Vì vậy
   "seek chậm 38 s thì chạm trần" KHÔNG phải claim tổng quát — trần
   là lưới an toàn cho seek kẹt/kéo dài (cần ~48 s seeking ở tốc độ
   rAF lượt này mới đủ 1000 mẫu), không phải ngưỡng mọi seek chậm
   đều chạm.
3. **19 nhãn sai đã sửa TẠI CHỖ (§3).** Mỗi dòng gốc giữ nguyên số
   đo, chỉ nhãn "GOP thưa" đổi thành "GOP 30" kèm ngoặc đính chính
   ghi rõ nhãn cũ — không viết lại lịch sử, không đổi số dòng (mọi
   file giữ nguyên số dòng). Bảng A5 giữ nguyên vẹn làm nguồn đối
   chiếu (file A5 có 0 marker 46-B5 — B5 không đụng vào nó).
4. **Chuỗi chain solo→Q6→N2 chạy lại: CHAIN-OK (§4).** Cờ
   `N2_PERSEEK=1` chảy đủ 3 tầng, soloReport present, 25 entry,
   validate 0 problem, Q6 labeled mang perSeek khớp N2 (25 = 25),
   frozen-dist VALID. N2 verdict riêng là PARTIAL dưới tải
   under-load (như A5: verdict đo, không phải lỗi chuỗi).
5. **Giới hạn trích dẫn (§5):** seek do harness gán trực tiếp lên
   pool element, KHÔNG qua vòng sync preview (project rỗng nên vòng
   đó không tự seek element này) và KHÔNG qua timeline UI — số đo
   chứng minh trần trên element pool, không chứng minh vòng sync tự
   nó seek chậm 40 s. Mọi số đều under-load, không phải baseline
   quiet.

## 1. Đo trần 1000 trên pool element thật (script mới)

Script: `apps/web/scripts/per-seek-probe-pool-cap-run.mjs` (phiên
scratch `/tmp/round46-b5/poolcap`, evidence `pool-cap-evidence.json`
+ `pool-cap-entries.json`, ngoài repo, không stage).
Lệnh (từ gốc repo, display/port/scratch riêng tránh đụng các luồng
đợt 46 khác):

```
node apps/web/scripts/per-seek-probe-pool-cap-run.mjs \
  --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
  --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
  --scratch /tmp/round46-b5/poolcap --display :95 --port 4195
```

App thật: dist đóng băng bundle `index-DQV-DvFX.js`
(freezeAttempts = 1, cùng bundle A5 dùng — so sánh được), server
drip 64 KiB/s + endpoint treo + fast (cùng logic Z5, nhật ký
range: 13 request). Tải: loadavg đầu phiên `3.26 1.92 0.84`
(under-load — chạy cùng các luồng đợt 46 khác), cuối phiên
`0.87 1.60 0.89`. **Mọi số dưới đây đều under-load.**

### 1.1 Bằng chứng element đo đúng là pool element thật

- Tìm pool qua fiber: `{found: true, fibers: 276, candidates: 1,
  poolVideosSize: 0}` — đúng 1 instance MediaPool (của
  PreviewCanvas, `poolRef` tạo trong render body của preview.tsx),
  pool rỗng trước khi đo (project rỗng).
- Item đưa vào pool bằng `pool.videoFor()` thật (không qua
  timeline UI — ghi rõ ở §5): cả 3 element đều
  `sameAsPoolMap: true` (chính là object trong `pool.videos`),
  `detached: true` (pool element tách khỏi DOM, đúng thiết kế
  MediaPool), element drip có `preload: "auto"`,
  `playsInline: true`, src HTTP
  `http://127.0.0.1:4195/video.mp4?poolcap=1` (đúng nhánh
  `proxyUrl ?? url` mà preview dùng cho asset HTTP).
- Probe per-seek v2 cài trước khi `videoFor()`/seek nên mọi lần gán
  `currentTime` đều bị chặn ở prototype như N2/W5 — cùng đường đo,
  không đổi probe.

### 1.2 Kết quả từng entry pool (4 entry, validate 0 problem)

| Entry | Element (probe elementId) | Seek | Giữ / dropped | Trạng thái | seekLatency |
|---|---|---|---|---|---|
| k=4 (drip) | pool drip, elId 4 | 25 s | 780 / 0 | completed | 37.264 s |
| k=5 (drip) | pool drip, elId 4 (cùng element) | 5 s | 532 / 0 | completed | 38.119 s |
| k=6 (treo) | pool hang, elId 5 | 20 s | **1000 / 27** | **unresolved** (seeking vẫn true lúc read) | null (chưa seeked) |
| k=7 (blob đối chứng) | pool blob, elId 6 | 5 s | 24 / 0 | completed | 0.598 s (rAF fallback, seekedEvent false) |

- Drip: seeking kéo dài 37–38 s wall nhưng rAF chỉ tick ~21 rồi
  ~14 mẫu/s (poll 2 s đầu ~52 mẫu/s, sau đó tụt — tải chen ngang),
  nên 780/532 < 1000: **trần không chạm, dropped 0, chốt completed
  sạch.** Đối chiếu Z5 (app-page, drip 64 KiB/s, ~38 s, 1000 mẫu):
  cùng wall time, khác số mẫu — bằng chứng trực tiếp rằng số mẫu
  theo tick rAF, không theo giây.
- Treo: poll +46 s đạt 966 mẫu, vẫn seeking; tới lúc read (sau đối
  chứng blob) đủ 1000 mẫu + 27 dropped, chốt unresolved, flush
  `src = video-hang.mp4`, `readyState = 1`. **Trần giữ đúng 1000
  trên pool element.**
- Blob đối chứng: pool element với `blob:` URL của flat 45 KB,
  seek 5 s trong khoảng duration 10 s (khác Z5: Z5 seek 20 s vượt
  duration nên bị clamp — B5 seek 5 s để là seek hợp lệ, ghi rõ
  khác biệt): xong nhanh, 24 mẫu, completed — đường pool local
  không chạm trần, khớp kỳ vọng.
- Tổng phiên: 8 entry, `droppedOverflow: 0` (trần entry 5000 chưa
  động tới), validate 0 problem, app vẫn đáp evaluate sau seek kẹt.

### 1.3 4 entry k=0–3 KHÔNG phải pool entry — đừng đọc nhầm

Trước cả seek drip, probe đã ghi 4 entry (k=0–3, elementId 0–3,
target 0, phase "ready"): seeked nhanh 5–67 ms, 0 mẫu seeking,
0 dropped, chốt `seeked-no-draw`, flush src là 2 URL `blob:` lạ
(mỗi URL gắn 2 element), `readyState = 0` (src đã gỡ lúc flush).
Đây là các element tạm của chính app (mẫu `probeVideo` /
`captureVideoThumb` trong media.ts: tạo element, seek, gỡ src —
khớp mọi observable), KHÔNG phải pool element, KHÔNG phải seek
của B5. `rafTicksWhileWaiting` 2475–2477 của chúng chỉ là "chờ
firstDraw không bao giờ tới vì src đã gỡ", không liên quan trần
mẫu (mẫu = 0 vì seeking đã xong trước tick rAF đầu). Nguồn gốc
chính xác (thumbnail hay probe metadata) chưa ghim — chỉ ghi
observable, không đoán thành kết luận (§5).

## 2. Test khóa 46B5 (mô phỏng trần bằng VM, không cần browser)

File: `apps/web/scripts/per-seek-probe-pool-cap-46b5.test.mjs`
(5 test): nạp `per-seek-probe-page.js` thật vào VM với element giả
(`seeking` giữ true, rAF tự điều khiển):

- Seeking 1500 tick → đúng 1000 mẫu, dropped 500, chốt unresolved.
- Seek nhanh (seeking tắt sau 3 tick) → completed, mẫu < 1000,
  dropped 0 (đối chứng trần không chạm khi seek nhanh).
- Mọi dòng còn chứa "GOP thưa" trong 9 file §3 đều mang marker
  46-B5 (nhãn cũ chỉ còn trong ngoặc đính chính).
- Script pool-cap ghi rõ phạm vi (videoFor, fiber, POOL-LEVEL,
  "không qua timeline UI", "không chứng minh" vòng sync).
- Bảng A5 giữ nguyên vẹn (còn "GOP hiệu dụng 30", còn dòng L48,
  còn "số đo vẫn đứng").

## 3. Sửa nhãn sai tại chỗ — bảng đối chiếu từng dòng

Quy tắc sửa (áp dụng đồng nhất, giữ nguyên số dòng mọi file):
nhãn "GOP thưa" → "GOP 30 [đính chính 46-B5: trước đây ghi 'GOP
thưa']". Số đo, dung lượng file, độ trễ, verdict đều giữ nguyên.
Trường hợp duy nhất khác mẫu: U5 L207–208 (cụm "GOP\nthưa" tách
dòng) và pipe L40 (viết lại câu comment cho đọc được, cùng số
dòng). Sau sửa, grep "GOP thưa" trong 9 file chỉ còn trúng các
dòng mang marker 46-B5 (test §2 khóa điều này).

| File | Dòng (A5) | Cũ (tóm tắt) | Mới tại chỗ |
|---|---|---|---|
| `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` | L48 | "…seek đuổi target trên GOP thưa (guard K4…" | "…trên GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] (guard K4…" |
| `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` | L112 | "30 s, GOP thưa." | "30 s, GOP 30 [đính chính 46-B5: …]." |
| `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` | L250 | "…seek đuổi target ngược trên GOP thưa…" | "…trên GOP 30 [đính chính 46-B5: …]…" |
| `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` | L318 | "…muộn ~9–12 s trên file GOP thưa 420 MB" | "…trên file GOP 30 [đính chính 46-B5: …] 420 MB" |
| `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs` | L40 (comment) | "Trên file noise GOP thưa 420 MB, element seek đuổi…" | "Trên file noise 420 MB (GOP hiệu dụng 30 — đính chính 46-B5: trước đây ghi 'GOP thưa'), element seek đuổi…" |
| `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs` | L308 (chuỗi verdictNote) | "…trong lúc element seek đuổi target trên GOP thưa — độ trễ…" | "…trên GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] — độ trễ…" (chỉ đổi text ghi chú cho lượt chạy sau; bản ghi JSON cũ không sửa) |
| `docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md` | L207–208 | "…(420 MB, GOP\nthưa, như T5)" | "…(420 MB, GOP\n30 [đính chính 46-B5: trước đây ghi 'GOP thưa'], như T5)" |
| `docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md` | L234 | "…trên file GOP thưa này…" | "…trên file GOP 30 [đính chính 46-B5: …] này…" |
| `docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md` | L283 | "…trên file GOP thưa 420 MB…" | "…trên file GOP 30 [đính chính 46-B5: …] 420 MB…" |
| `docs/PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md` | L26 | "…trên file GOP thưa\n420 MB…" | "…trên GOP 30 [đính chính 46-B5: …]\n420 MB…" |
| `docs/PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md` | L57 | "- File GOP thưa: `…sparse-gop-noise.mp4`," | "- File GOP 30 [đính chính 46-B5: …]: `…sparse-gop-noise.mp4`," (chính dòng này đã tự ghi keyframe mỗi 1 s ở dòng sau — nay nhãn khớp số) |
| `docs/PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md` | L25 | "…trên file GOP thưa…" | "…trên file GOP 30 [đính chính 46-B5: …]…" |
| `docs/PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md` | L214 | "…trên file GOP thưa 420 MB." | "…trên file GOP 30 [đính chính 46-B5: …] 420 MB." |
| `docs/PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md` | L165 | "GOP thưa) và draw gần như tức thì…" | "GOP 30 [đính chính 46-B5: …]) và draw gần như tức thì…" |
| `docs/PHASE9_ROUND37_LIMITS.md` | L72 | "…đuổi seek trên GOP thưa…" | "…trên GOP 30 [đính chính 46-B5: …]…" |
| `docs/PHASE9_ROUND37_LIMITS.md` | L153 | "…GOP thưa 420 MB)…" | "…GOP 30 [đính chính 46-B5: …] 420 MB)…" |
| `docs/PHASE9_ROUND38_LIMITS.md` | L56 | "…trên file GOP thưa 420 MB…" | "…trên file GOP 30 [đính chính 46-B5: …] 420 MB…" |
| `docs/PHASE9_ROUND38_LIMITS.md` | L172 | "…trên file GOP thưa 420 MB…" | "…trên file GOP 30 [đính chính 46-B5: …] 420 MB…" |
| `docs/PHASE9_ROUND39_LIMITS.md` | L92 | "…trên file GOP thưa 420 MB…" | "…trên file GOP 30 [đính chính 46-B5: …] 420 MB…" |

KHÔNG sửa (ghi rõ để không ai sửa nối):

- File A5 (`docs/PHASE9_ROUND45_A5_PROBE_LIMITS.md`): giữ nguyên
  vẹn, 0 marker 46-B5 — bảng §2 của nó vẫn là nguồn đối chiếu.
- Bản ghi đo JSON `benchmarks/results/v37-t5-fallback-clicktest.json`
  và `v38-u5-fallback-clicktest.json`: bản ghi đo, giữ nhãn cũ
  theo quyết Z5 (đọc kèm bảng này + bảng A5).
- Nhãn "GOP 300" gắn file phẳng (`sparse-gop-flat`) và noise-30s
  Q3: ĐÚNG, không sửa (xem A5 §2.4).
- `per-seek-probe-page.js` / `per-seek-probe.mjs`: không đổi logic
  trần (trần 1000 đã đúng từ trước, B5 chỉ đo nó trên pool).

## 4. Chạy lại chuỗi chain đầy đủ (nợ A5 §3 — vẫn CHAIN-OK)

Lệnh (từ gốc repo, scratch/display/port riêng):

```
N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10 node \
  apps/web/scripts/per-seek-probe-chain-run.mjs \
  --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
  --scratch /tmp/round46-b5/chain1 --display :94 --port 4194
```

Kết quả (evidence `/tmp/round46-b5/chain1/probe-chain-evidence.json`,
scratch ngoài repo, không stage):

- **CHAIN-OK**, exit 0. Tầng solo: `N2_PERSEEK=1` giữ nguyên,
  `GOP_SEC=10`, đủ 6/6 khóa Q6.
- Tầng Q6: frozen-dist bundle `index-DQV-DvFX.js`, 254 file,
  validity VALID, problems []; labeled mang perSeek.
- Tầng N2: perSeekEnabled true, soloReport present, **25 entry,
  validate 0 problem**, max mẫu seeking/entry 30, dropped 0.
  Q6 labeled perSeek entries = 25 = N2 → `q6PerSeekMatchesN2: true`.
- N2 verdict riêng là PARTIAL dưới tải under-load (load1 cuối lượt
  3.37, fps xuôi 0.250, fps ngược 0.177, 13 tiến trình Chrome trước
  lượt — có luồng browser khác chạy cùng) — đây là verdict đo của
  N2, KHÔNG phải lỗi chuỗi: tiêu chí CHAIN-OK chỉ kiểm tra cờ chảy
  qua 3 tầng, như X5/A5. Số 25 entry (A5: 33, X5: 32) khác lượt chạy,
  không so sánh như hồi quy.
- Lưu ý như A5: `N2_PERSEEK_GOP_SEC=10` là tham số nhóm đoạn của
  harness, không phải claim GOP của fixture (file noise GOP 1 s
  nên segment 10 s chứa 10 GOP — summary theo segment chỉ mang
  tính mô tả, đúng cảnh báo T2 §3.3). CHAIN-OK không phụ thuộc GOP.

## 5. Cái gì CHƯA làm (nợ còn lại — không mạo nhận, không ép đóng)

1. **Seek chậm do vòng sync preview tự lái vẫn chưa đo:** B5 lái
   seek trực tiếp lên pool element (project rỗng). Muốn đóng hẳn
   nợ "preview thật" cần project có clip + playhead/scrub của
   preview tự seek pool element dưới mạng chậm — cần đường asset
   HTTP đi qua timeline UI (proxy bridge hoặc import HTTP), chưa
   làm trong đợt này.
2. **Baseline quiet vẫn chờ cửa sổ yên từ main chat:** mọi số B5
   đều under-load (load đầu 3.26); tốc độ rAF — và do đó số mẫu
   chạm trần — sẽ khác khi quiet, cần đo lại trước khi chốt ngưỡng
   vận hành nào từ số mẫu.
3. **Safari / máy thật / footage B-frame / đường WebCodecs vẫn chưa
   đo cho trần 1000** (nợ đứng chung từ A5 §4.4).
4. **Nguồn gốc chính xác của 4 entry k=0–3 chưa ghim** (thumbnail
   hay probe metadata — chỉ có observable §1.3); không ảnh hưởng
   kết luận trần vì mẫu của chúng bằng 0.
5. **Drip cap-hit không ổn định theo wall time:** Z5 drip chạm
   trần, B5 drip không — ai trích số phải kèm tốc độ rAF/tải của
   lượt đó, không trích "38 s ⇒ 1000 mẫu" thành quy luật.

## 6. Kiểm chứng đã chạy (lệnh + số thật)

- `node --check` cho `per-seek-probe-pool-cap-run.mjs`,
  `per-seek-probe-pool-cap-46b5.test.mjs`,
  `clicktest-round37-t5-fallback-pipe.mjs` (sau sửa) → pass.
- `node --test` probe liên quan → **34/34 pass, 0 fail**: test mới
  46B5 5/5, test 45A5 + `per-seek-probe.test.mjs` gộp 25 test
  (tổng 30 cho 3 file), test Q6 protocol 4/4.
- `npx tsc` không chạy lại: đợt này không đụng file `.ts` nào
  (chỉ `.mjs` + `.md`, như tiền lệ A5) — không claim tsc cho đợt.
- Pool-cap Chrome headed thật §1: capHit true (nhờ entry treo),
  validate 0 problem, app còn đáp sau seek kẹt.
- Chain đầy đủ §4: CHAIN-OK, exit 0.
- Đo lại nhãn: grep "GOP thưa" trong 9 file §3 chỉ còn trúng dòng
  mang marker 46-B5 (test §2 khóa); file A5 0 marker (nguyên vẹn).

## 7. File đổi/thêm (chỉ của B5 — text, không binary, không dist)

- Mới: `docs/PHASE9_ROUND46_B5_PROBE_LIMITS.md` (file này).
- Mới: `apps/web/scripts/per-seek-probe-pool-cap-run.mjs` (đo trần
  trên pool element thật qua fiber + HTTP drip/treo).
- Mới: `apps/web/scripts/per-seek-probe-pool-cap-46b5.test.mjs`
  (5 test khóa trần VM + nhãn tại chỗ + phạm vi pool-cap + bảng A5).
- Sửa nhãn tại chỗ (giữ nguyên số dòng, chỉ đổi nhãn + ngoặc đính
  chính, không đổi số đo): 8 file docs ở §3 (T5 4 dòng, U5 3 dòng
  tính cả cụm tách dòng L207–208, T6 2 dòng, V3 2 dòng, T2-perseek
  1 dòng, LIMITS tổng hợp 37/38/39 5 dòng) + 1 file pipe
  `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs` (L40
  comment, L308 chuỗi verdictNote — logic không đổi).
- Không sửa: `docs/PHASE9_ROUND45_A5_PROBE_LIMITS.md` (nguồn đối
  chiếu), JSON bản ghi đo v37/v38, `per-seek-probe-page.js`,
  `per-seek-probe.mjs`, mọi file `.ts`, preview.tsx, store.ts,
  tsconfig.json, bridge, paths-loop, build-loop-log. Không push,
  không tag, không stage batch (parent gộp).
- Scratch ngoài repo (không stage): `/tmp/round46-b5/` (poolcap +
  chain1 + evidence JSON).
