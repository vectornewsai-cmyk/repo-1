# Đợt 62 R2 — Cache .trf vidstabdetect + tách denoise 0.5 + chặn speed curve ở SpeedPanel: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt ~06:40–07:40, giờ +07).
Máy đo: VM này (4 vCPU, RAM ~7.8GB, CPU-only, FFmpeg 8.1.2, libx264).
Đóng 3 nợ đợt 61 §5.2 (LIMITS: docs/PHASE9_ROUND61_R2_ENHANCE_COST_LIMITS.md).
Harness mới: `server/render/src/test_round62_r2_trf_cache.js` (**35/35 pass, exit 0**)
+ unit `apps/web/src/components/speed/speedCurveBlock62R2.test.ts` (**5/5 vi + 5/5 en**)
+ headed `apps/web/scripts/clicktest-62r2-speed-curve-stabblock.mjs` (**6/6 pass, exit 0**).
Log đầy đủ tại `workspace/goals/capcut-clone-video-editor/hidden_files/round62-r2/`
(`r62r2-harness.log`, `r62r2-headed.log`, `r62r2-headed2.log`, `headed/`).

## 1. Kết luận ngắn

- **(a) Cache .trf làm thật, tiết kiệm thật.** Resolve COLD (detect mới) median
  **9,10s** (9,07 / 9,10 / 9,30 — spread hẹp, tải thấp) vs WARM (copy từ cache)
  median **~0,00s** (cả 3 lần đều <10ms, dưới độ phân giải Date.now) → tiết kiệm
  **9,10s mỗi lần render lại cùng clip** = 100% pass detect. Render.js
  end-to-end COLD 39,68s vs WARM 21,00s (tiết kiệm 18,68s, 47,1% wall) — nhưng
  số e2e này NHIỄU (xem §2.3), số sạch để trích là ở tầng resolve (9,10s).
  File .trf đo thật: **505.765 byte/clip 5s 720p** (~3,4 KB/frame) — lớn hơn
  nhiều so với phỏng đoán "vài chục KB" ban đầu; giới hạn cache 128 entry /
  64 MiB tương đương nhau ở cỡ clip này.
- **(b) Denoise 0.5 rẻ: ~0,7–1,5s trên clip 5s 720p.** Probe to-null median 3 lần
  xen kẽ: decode-only median 5,11s vs decode+hqdn3d(0.5) median 6,60s → trừ
  median cho **1,49s**; nhưng hiệu từng vòng là −1,13 / +0,68 / +1,69s (median
  **+0,68s**) — spread của phép đo lớn hơn chính hiệu ứng cần đo, nên chỉ kết
  luận được "denoise 0.5 tốn cỡ ~1s, ~2–5% full render", KHÔNG trích 1,49s như
  số chính xác. Phần còn lại sau denoise trong 7,10s của đợt 61 là **~5,6–6,4s
  vẫn chưa tách** (khởi động node + graph) — để nợ, xem §6.
- **(c) SpeedPanel nay chặn đối xứng với EnhancePanel.** Nút "Bật đường cong tốc
  độ" bị disable khi clip đang bật stabilize, kèm tooltip + dòng cảnh báo rõ
  ngay từ trước khi bật; bấm nút disabled bằng chuột thật không tạo được curve.
  Đường sửa vẫn mở (tắt stabilize → bật curve được); trạng thái lỗi cũ vẫn sửa
  được (checkbox chống rung vẫn mở để tắt khi đang bật). Unit 5/5 (vi+en),
  headed 6/6, 0 lỗi trang.

## 2. (a) Cache .trf — làm gì + đo gì

### 2.1 Thiết kế (`server/render/src/trfCache.js`, mới)

- Key = sha256({ v:"v1", ffmpeg version line, src tuyệt đối, size, mtimeMs,
  in, end (= in + duration*speed), shakiness, accuracy, stepsize, mincontrast }).
  **smoothing KHÔNG nằm trong key** (chỉ là tham số vidstabtransform, không ảnh
  hưởng nội dung .trf — đổi smoothing vẫn HIT, đã kiểm chứng §2.2).
- Thư mục cache mặc định `~/.cache/vcut/vidstab-cache` (env `VCUT_TRF_CACHE_DIR`
  đổi được; harness test dùng thư mục riêng, không đụng cache thật).
  Tắt cache: CLI `--no-trf-cache` hoặc env `VCUT_TRF_CACHE=0`.
- Giới hạn: 128 entry / 64 MiB; vượt → xoá entry cũ nhất theo mtime (LRU —
  lookup HIT chạm lại mtime); không bao giờ xoá file < 60s tuổi (grace chống
  race với render khác đang copy). Ghi cache qua file tạm + rename.
- HIT chỉ copy file .trf về đường dẫn tạm riêng của lần render
  (`repo1-vidstab-<pid>-<id>.trf` như cũ) — render.js dọn như cũ, không đổi
  vòng đời file tạm; file trong cache không bao giờ bị transform đọc trực tiếp.
- Fail-fast giữ nguyên: detect lỗi → không ghi cache, render.js exit 1.
  Xoá cả thư mục cache thì render vẫn đúng, chỉ chậm lại (detect lại).

### 2.2 Invalidation — kiểm chứng bằng resolve thật

| Thay đổi | Kết quả | Giải thích |
|---|---|---|
| Cùng clip, lần 2 | **HIT** (không detect lại), cùng key | — |
| smoothing 10→20 | **HIT** | smoothing chỉ ảnh hưởng transform |
| shakiness 5→8 | **MISS** (detect lại, cache 2 entry) | tham số detect trong key |
| trim in 0→1 | **MISS** (detect lại, cache 3 entry) | end trong key |
| `--no-trf-cache` | render OK, không ghi thêm entry, log không có HIT | tắt hẳn |
| Key đổi khi accuracy/stepsize/mincontrast/ffmpeg version/nguồn ghi đè | đã kiểm bằng self-test (key đổi từng cái một) | — |

File .trf resolve hợp lệ mọi lần (>100 byte; thực tế 505.765 byte cho clip gốc,
404.308 byte cho bản trim in=1 — kích thước .trf phụ thuộc nội dung/tham số).

### 2.3 Tiết kiệm đo thật (720p, clip 5s shakynoisy, preset Cân bằng)

**Tầng resolve (số sạch — tải thấp ổn định, loadavg 0,6–1,15):**

| | Lần 1 | Lần 2 | Lần 3 | Median |
|---|---|---|---|---|
| COLD (xoá entry trước mỗi lần) | 9,07s | 9,10s | 9,30s | **9,10s** |
| WARM (HIT) | 0,00s | 0,00s | 0,00s | **~0,00s** |

Tiết kiệm **9,10s/lần render lại** = đúng 1 pass detect (khớp 9,56s wall đợt 61
(a2) trong sai số tải). WARM nhanh hơn COLD >10× (assert trong harness).

**Tầng render.js end-to-end (số NHIỄU — chỉ đọc hướng, không trích %):**

| Render | Wall | FPS | Log | MP4 |
|---|---|---|---|---|
| COLD | 39,68s | 3,78 | MISS | 1.593.523 byte, h264 720p 5s OK |
| WARM | 21,00s | 7,14 | HIT | 1.578.195 byte, h264 720p 5s OK |

Tiết kiệm e2e 18,68s (47,1%) — LỚN HƠN cả pass detect (9,10s), chứng tỏ số này
nhiễm tải: cùng cấu hình WARM ở mục (b) trong cùng phiên chỉ mất **11,72s**
(loadavg 8,68). Cùng cấu hình WARM dao động 11,72–21,00s giữa 2 lần đo trong
một phiên (các luồng đợt 62 chạy song song). Vì vậy: **chỉ trích tiết kiệm
9,10s ở tầng resolve; con số e2e chỉ chứng minh "WARM nhanh hơn hẳn COLD"
chứ không dùng làm % tiết kiệm.**

MP4 COLD vs WARM chênh kích thước 0,96% (15.328 byte) — 2 lần detect khác nhau
cho .trf khác nhau (vidstab không xác định, đợt 61 §3). Hệ quả tốt của cache:
render lại dùng CÙNG .trf nên transform giống hệt nhau giữa các lần (chỉ còn
encode dao động), tức cache làm render lại tái lập được hơn, không chỉ nhanh hơn.

## 3. (b) Tách denoise 0.5 — đo trực tiếp từng pass, median 3 lần

Phương pháp (quy tắc mới R2 đợt 61): probe to-null, xen kẽ round-robin, chuỗi
hqdn3d lấy đúng từ `buildEnhancePostChain({denoise:{strength:0.5}})` =
`,hqdn3d=12:9:12:9`. Tải lúc đo CAO và dao động (loadavg 8,2–9,75 — các luồng
đợt 62 chạy song song), nên spread lớn; đọc số kèm spread.

| Probe (720p, 150 frame) | Vòng 1 | Vòng 2 | Vòng 3 | Median |
|---|---|---|---|---|
| decode-only | 8,00s | 5,11s | 4,91s | **5,11s** |
| decode+hqdn3d(0.5) | 6,87s | 5,79s | 6,60s | **6,60s** |
| Hiệu từng vòng (denoise − decode) | −1,13s | +0,68s | +1,69s | **+0,68s** |

- Trừ median: denoise 0.5 thuần = **1,49s** (~101 fps riêng).
- Median hiệu từng vòng: **+0,68s**.
- Kết luận trung thực: denoise 0.5 tốn **cỡ ~1s (khoảng 0,7–1,5s)** trên clip 5s
  720p — tức **~2–5% full render Cân bằng 29,44s** của đợt 61, rẻ hơn nhiều so
  với detect (9,56s) và encode thuần (6,49s). Không trích 1,49s hay 0,68s riêng
  lẻ như số chính xác: hiệu vòng 1 ÂM (−1,13s) chứng tỏ nhiễu tải lớn hơn hiệu
  ứng cần đo; cần phiên tải thấp mới tách chính xác hơn.
- Phần còn lại: 7,10s (24,1% full đợt 61) − denoise ~1s = **~5,6–6,4s vẫn chưa
  tách** — gồm khởi động node (spawn ffmpeg ~50ms, không đáng kể), dựng graph
  filter_complex, và phần encode/decode dao động theo tải. **Chưa đo tiếp** —
  tách tiếp cần probe transform-to-null + baseline encode trong cùng phiên
  (làm lại (a2) đợt 61), để nợ đợt sau; không trừ chéo số giữa các phiên tải
  khác nhau (bài học đợt 61 §2.1).

## 4. (c) Chặn speed curve ở SpeedPanel — quyết định và làm thật

### 4.1 Quyết định: hướng (i) — chặn ở UI, đối xứng đợt 61 R2

- EnhancePanel đã chặn tạo stabilize trên clip có curve (đợt 61 R2); SpeedPanel
  nay chặn chiều ngược lại: không tạo curve trên clip có stabilize. Thống nhất
  2 phía, cùng triết lý: ngăn trạng thái lỗi ngay lúc tạo, không để user đụng
  render fail; fail-fast ở render giữ nguyên làm backstop cho project cũ/MCP/CLI.
- KHÔNG làm render fallback tự bỏ stabilize/curve (lý do như đợt 61 §5.1:
  phá hợp đồng trung thực của render).

### 4.2 Đã làm thật

- `apps/web/src/components/speed/speedCurveBlock.ts` (mới): helper thuần
  `isSpeedCurveEnableBlocked(hasStabilize)` + `speedT(key, fallback)` (fallback
  tiếng Việt khi fragment chưa gộp — mẫu đợt 61 R2).
- `apps/web/src/components/speed/SpeedPanel.tsx`: nút "Bật đường cong tốc độ"
  `disabled` khi clip đang bật stabilize + `title` tooltip + dòng cảnh báo mới
  `[data-testid="speed-curve-stab-blocked"]`; nút có thêm
  `data-testid="speed-curve-enable-btn"` cho headed test. Cảnh báo cũ
  `speed.warnStabilizeRamp` (hiện khi curve + stabilize cùng tồn tại) giữ nguyên.
  Nút "Tắt đường cong" và checkbox chống rung (khi đang bật) không bị chặn —
  đường sửa trạng thái lỗi cũ vẫn mở cả 2 phía.
- 2 key i18n mới trong fragment
  `workspace/goals/capcut-clone-video-editor/hidden_files/round62-r2-fragment.json`
  (KHÔNG sửa trực tiếp vi.json/en.json): `speed.curveStabBlocked`,
  `speed.curveStabTitle` (parity vi/en).

### 4.3 Kiểm chứng (c)

- Unit `apps/web/src/components/speed/speedCurveBlock62R2.test.ts`:
  **5/5 pass cả vi lẫn en** (helper chặn, fragment đúng 2 key + parity + đúng
  từng chữ, pre-merge t() trả key / speedT trả fallback, post-merge mô phỏng
  trả chuỗi theo locale).
- Headed `apps/web/scripts/clicktest-62r2-speed-curve-stabblock.mjs`:
  **6/6 pass, exit 0** (lần chạy 2, ~27s; vite dev + Chromium Xvfb + CDP):
  B0 setup; B1 bật stabilize bằng chuột thật → nút bật curve disabled +
  cảnh báo hiện + title chứa "chống rung"; B2 bấm nút disabled bằng chuột
  thật → không tạo được curve (hasSpeedRamp=false, 0 keyframe); B3 tắt
  stabilize → nút mở lại + cảnh báo biến mất → bật curve được (2 keyframe),
  preset Cân bằng/Mạnh ở EnhancePanel vẫn bị chặn đúng như đợt 61; B4 trạng
  thái lỗi cũ (inject qua store — mô phỏng file project cũ/MCP/CLI, chỉ là
  setup): cảnh báo conflict hiện nhưng checkbox chống rung vẫn MỞ → bấm chuột
  thật tắt stabilize → hết conflict; H9 0 lỗi trang. Screenshots + report tại
  `hidden_files/round62-r2/headed/`.
- Lịch sử headed: lần chạy 1 đạt 5/6, B4 fail do lỗi HARNESS (assert đòi
  `clip.enhance` truthy trong khi gỡ stabilize là key cuối → enhance thành
  null hẳn; waitFor cùng điều kiện sai làm kẹt 60s rồi mới fallback) — app
  đúng, đã sửa harness (dùng `?.`) và chạy lại 6/6. Unit test cũng từng fail
  1 check ở lần chạy EN đầu vì lỗi thứ tự tương tự (check pre-merge đặt trong
  queue chạy SAU deepMerge mô phỏng) — đã sửa bằng cách đưa check pre-merge
  vào khối inline trước deepMerge.

### 4.4 Hệ quả: script headed đợt 61 nay lỗi thời ở 1 bước (cố ý)

- `clicktest-61r2-enhance-speedblock.mjs` bước B5 từng "bật lại speed curve"
  bằng chuột thật khi stabilize đang bật để tái hiện trạng thái lỗi cũ — sau
  đợt này bước đó KHÔNG còn làm được bằng UI (nút đã bị disable — chính là
  điều B1/B2 đợt này kiểm chứng). Script đợt 61 sẽ fail ở bước đó nếu chạy
  lại; đó là hành vi đúng theo thiết kế mới, KHÔNG phải regression. Trạng
  thái lỗi cũ nay chỉ còn đến từ file project cũ / MCP / CLI, và đường sửa
  của nó được kiểm chứng ở B4 của script đợt 62 (inject qua store + sửa bằng
  chuột thật). Không sửa script đợt 61 (nó là bản ghi của đợt 61).

## 5. Kiểm chứng gộp

- `node server/render/src/trfCache.js --self-test`: **pass** (key đổi/không đổi
  từng tham số, store/lookup, prune LRU + grace 60s, file .trf rỗng → MISS).
- `node server/render/src/enhance.js --self-test`: **pass** (không đổi hành vi).
- Harness `test_round62_r2_trf_cache.js`: **35/35 pass, exit 0**.
- Unit speed-block đợt 62: **5/5 vi + 5/5 en**; unit speed-block đợt 61 chạy
  lại: **9/9 vi + 9/9 en** (không regression ở EnhancePanel).
- Headed speed-curve-stabblock: **6/6 pass, exit 0**.
- `tsc` apps/web: **0 lỗi trong file của luồng này** (SpeedPanel, speedCurveBlock,
  test). Toàn repo có 1–5 lỗi tại thời điểm kiểm — đều ở file của luồng khác
  đang chạy song song (R7: `projectAssetRefs62R7.test.ts`, `preview.tsx`),
  không phải file R2; không sửa hộ.
- `vite build` apps/web: **pass, 37,99s** (cảnh báo chunk >500 kB có sẵn).
- `render.js --help`: hiện `--no-trf-cache` đúng.

## 6. Giới hạn — đọc trước khi trích số

1. **Tải VM là biến số lớn nhất (như mọi đợt).** Loadavg trong lúc đo: resolve
   (a) 0,6–1,15 (sạch); render e2e (a2) 6,5–9,6; probe denoise (b) 8,2–9,75.
   Cùng cấu hình WARM dao động 11,72–21,00s trong một phiên. Chỉ tỉ lệ/thứ tự
   trong cùng một phép đo (median, xen kẽ) mới có ý nghĩa; đừng trích "render
   WARM tiết kiệm 47,1%" hay "denoise thuần 1,49s" như số chính xác.
2. **Denoise (b) chưa tách chính xác** vì spread phép đo (decode 4,91–8,00s)
   lớn hơn hiệu ứng (~1s). Số dùng được: cỡ ~1s, ~2–5% full render. Phần còn
   lại ~5,6–6,4s (khởi động node + graph) chưa tách — cần phiên tải thấp +
   probe transform/encode trong cùng phiên.
3. **Key cache dựa vào mtimeMs + size của file nguồn.** Nguồn bị ghi đè bằng
   nội dung khác nhưng trùng size và mtime (cố tình giả mtime) sẽ dùng nhầm
   .trf cũ — rủi ro chấp nhận được (mtime ms + thao tác cố tình mới trùng);
   nguồn đổi nội dung bình thường luôn đổi mtime → detect lại. Không hash
   nội dung file (đắt với file lớn — đánh đổi cố ý, ghi rõ).
4. **Cache mặc định ở ~/.cache (không phải /tmp).** /tmp trên VM này là tmpfs
   512M; cache 64 MiB trên ~/.cache tránh đầy tmpfs. Nếu HOME không ghi được
   thì store lỗi chỉ log cảnh báo, render tiếp tục không cache (không fail job).
5. **Chỉ đo clip 5s 720p, preset Cân bằng.** Ngoại suy clip dài/1080p chưa kiểm
   chứng: .trf 1080p lớn hơn (chưa đo), detect 1080p đắt hơn (24,09s wall đợt
   61) nên tiết kiệm tuyệt đối còn lớn hơn, nhưng chưa đo.
6. **(c) chỉ chặn nút BẬT curve.** Nút preset curve / thêm keyframe trên curve
   đã có không bị chặn riêng (chúng chỉ sửa curve đã tồn tại; trạng thái lỗi
   cũ vẫn hiện cảnh báo conflict + bị chặn ở render). MCP/CLI/file project vẫn
   tạo được trạng thái lỗi — validator/render là backstop cuối.
7. **Ghosting footage thật pan nhanh + metric jitter bằng ước lượng chuyển
   động vẫn để nợ** (nợ đợt 61 §8 chưa làm trong đợt này — ngoài phạm vi 3 nợ
   R2 được giao).

## 7. Cách chạy lại

```bash
node server/render/src/trfCache.js --self-test               # key/store/prune, <1s
node server/render/src/test_round62_r2_trf_cache.js          # (a)+(b), ~4-6 phút tùy tải
node apps/web/scripts/clicktest-62r2-speed-curve-stabblock.mjs  # headed (c), ~30-90s
./node_modules/.bin/esbuild apps/web/src/components/speed/speedCurveBlock62R2.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round62-r2/speedblock.test.cjs && node /tmp/round62-r2/speedblock.test.cjs
# VCUT_TEST_LANG=en node /tmp/round62-r2/speedblock.test.cjs
```

## 8. Nợ mở thêm (cho đợt sau)

- Tách nốt ~5,6–6,4s còn lại trong 7,10s của đợt 61: đo transform-to-null +
  baseline encode + full render trong CÙNG phiên tải thấp để đóng sổ kế toán
  chi phí full render 720p (denoise nay đã có cỡ ~1s).
- Đo ghosting denoise 0.8/1.0 trên footage thật pan nhanh + bề mặt phẳng;
  cân nhắc cảnh báo khi denoise ≥0,7 trên clip chuyển động nhanh (nợ đợt 61 §8).
- Metric jitter: thử ước lượng chuyển động (phase correlation / optical flow
  thô) thay cho inter-frame MAD; đo spread trên clip dài hơn 5s (nợ đợt 61 §8).
- Cache .trf: đo kích thước .trf 1080p + clip dài để kiểm giới hạn 64 MiB;
  cân nhắc hash nội dung file nguồn nếu cần chống mtime giả (đánh đổi hiệu năng).
- Đo FPS enhance trên clip dài thật (>5s) để kiểm chứng ngoại suy (nợ đợt 61 §8).
