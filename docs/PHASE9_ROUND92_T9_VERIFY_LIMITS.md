# PHASE9 ROUND92 — T9: KIỂM CHỨNG ĐỘC LẬP T1–T8 (verify thread)

> Luồng T9, đợt 92 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07 12/11/2026;
> làm việc 20:38–22:35Z 11/11/2026). Repo local `~/workspace/repo-1`.
> **KHÔNG push. KHÔNG release/tag. KHÔNG sửa production** (không phát hiện lỗi thật
> nào do các luồng gây ra — xem §5).
>
> Phương pháp: đọc LIMITS từng luồng + chạy lại test/số đo chính mà luồng claim
> (unit test, đếm lại JSON từ đĩa, đếm lại dict i18n, chạy lại probe/analyzer/script
> gộp, quét lại writeFileSync), đối chiếu từng con số. Handoff T2 tới muộn
> (~22:21Z, sau ~100 phút chạy) — T9 chờ bằng script quét đĩa mỗi 5 phút, kiểm
> chứng T2 từ đĩa ngay khi LIMITS xuất hiện, KHÔNG báo missing sớm (theo skill
> verify_delegated_work). Hồi quy chéo chạy lại toàn bộ trên cây cuối sau khi T2
> hạ cánh (lần sửa file cuối 22:01Z).

## 0. Kết luận ngắn — bảng xác nhận từng luồng

| Luồng | Nhiệm vụ (nợ đợt 91 §4) | Kết luận T9 | Bằng chứng chạy lại |
|---|---|---|---|
| T1 flip-flop src | Mục 1 (ƯU TIÊN) — khóa flip-flop blob↔http trong `videoFor` | **XÁC NHẬN** (1 sai lệch nhỏ, xem §1) | JSON appswap đếm lại khớp bảng; unit media 25/25 |
| T2 tick main-thread | Mục 2 — chi phí tick mask+blur / rVFC | **XÁC NHẬN** | JSON tickcost/parity/assert đếm lại khớp hết; unit 24/24 + 15/15 + 22/22 + 14/14 + O4 37/37 |
| T3 canvas stale | Mục 3 — lag đỉnh + stall >1500ms | **XÁC NHẬN** (1 điểm không kiểm lại được từ đĩa, xem §3) | Analyzer chạy lại trên 8 JSON khớp bảng; playheadHold 31/31 |
| T4 fail-fast | Mục 4 — dời cổng fail-fast lên trước pre-pass | **XÁC NHẬN** | Test mới 32/32; S4 60/60 |
| T5 i18n sticker | Mục 5 — `sticker.title` + bump 2517→2518 | **XÁC NHẬN** | Dict đếm lại 2518/2518; Orphans 16/16, P7 8/8, css60 59/59, Sweep 16/16 |
| T6 G1 evidence v4 | Mục 6 — G1 + regex EADDRINUSE | **XÁC NHẬN** (G1 vẫn MỞ, T6 không tự đóng — đúng) | Pool script chạy lại khớp toàn bộ; regex 9/9; verdict 12/12; log fault-injection EPERM có chẩn đoán đúng |
| T7 birefnet | Mục 7 — cửa sổ yên RAM | **XÁC NHẬN** (không chạy, đúng điều kiện) | Guard unit 8/8; AppImage sha khớp; bgremove.py identical; log mẫu RAM khớp bảng |
| T8 EPERM probe | Mục 8 — probe #11 + khoảng mù #10 + quét writeFileSync | **XÁC NHẬN** | Probe #11 trong log v2; quét lại 197 dòng, delta +11 giải thích được hết |

**Hồi quy chéo trên cây cuối (T9 tự chạy):** tsc web **0**, tsc desktop **0**,
vite build **PASS (8,39s)**, O2 render **25/25**, O8 click-test **21/21 Chromium +
21/21 WebKit**. Marker các luồng cùng tồn tại trong file chung, không ghi đè nhau
(§4). Không sửa production.

## 1. T1 — flip-flop src (ĐÃ ĐÓNG nợ ưu tiên) — XÁC NHẬN, 1 sai lệch nhỏ

**Đếm lại từ `benchmarks/results/webkit-clipd-appswap-92t1.json`** (6 case, log `src`
có trường `src` = kind trước gán, `to` = kind được gán; đếm trên element id 7):

| run | srcOps el7 | đổi kind | chuỗi `to` | play() | phát lại sau pause |
|---|---|---|---|---|---|
| 30 (trước) | 23 | 22 | http>blob>… xen kẽ | 15 | http@ct3.53 |
| 31 (trước) | 23 | 22 | như trên | 14 | http@ct3.2 |
| 32 (trước) | 23 | 22 | như trên | 13 | http@ct4.8 |
| 40 (sau) | 2 | 1 | http>blob | 4, toàn blob | blob@ct2.83 |
| 41 (sau) | 2 | 1 | http>blob | 4, toàn blob | blob@ct5.2 |
| 42 (sau) | 2 | 1 | http>blob | 5, toàn blob | blob@ct5.5 |

Khớp hoàn toàn bảng LIMITS T1 §3 (srcOps, đổi kind, play(), phát lại, ct tăng đơn
điệu sau sửa). Unit `media.blobPrefetch90R3.test.ts` chạy lại (esbuild bundle +
node): **25/25** (19 cũ + 6 mới T1).

**SAI LỆCH NHỎ — đính chính số play() @ct=0:** đếm lại từ JSON, số lần play() ở
ct=0 là **8/7/6** (run 30/31/32), LIMITS T1 ghi **7/6/6** (lệch 1 ở run 30 và 31;
run 32 đúng). Không đổi kết luận ("hầu hết play() ở ct=0 trước sửa; sau sửa chỉ
1 lần @ct0 là lần phát đầu"). Ghi ở đây để lần sau khỏi trích số cũ.

Code: `srcLatch` có mặt trong `media.ts` (7 tham chiếu, comment "Đợt 92 T1").

## 2. T2 — chi phí tick main-thread (blocker rVFC đã gỡ) — XÁC NHẬN

**Đếm lại từ `~/workspace/round92-t2/out/*.json`** (median trong JSON, đối chiếu
bảng LIMITS T2 §2–§4):

| File | ratio | rfMed | maskMed | ticks | Khớp? |
|---|---|---|---|---|---|
| tickcost-b-baseline (3 pass) | 0,25 / 0,122 / 0,087 | 84,9 / 75,1 / 72,8 ms | 78,2 / 69,3 / 26,8 ms | 20/23/23 | ✓ (0,09–0,25; 73–85ms) |
| tickcost-b-after3 = B v2 | 0,629 / 0,562 / 0,597 | 4,8 / 4,5 / 4,5 ms | 0,7 ms | 106/115/110 | ✓ (0,56–0,63; 4,5–4,8ms) |
| tickcost-c-oldpath (đường cũ) | 0,42 / 0,507 / 0,535 | 39,1 / 33,5 / 32,9 ms | 25 / 22,7 / 22,8 ms | 38/46/47 | ✓ (0,42–0,54; 33–39ms) |
| tickcost-c-after = C v1 (HỒI QUY) | 0,12 / 0,101 / 0,174 | 197,6 / 196,9 / 95,5 ms | 98,2 / 93,3 / 31,5 ms | 11/10/16 | ✓ (0,10–0,17; 95–197ms) — hồi quy có thật trong số liệu |
| tickcost-c-after2 = C v2 | 0,618 / 0,592 / 0,634 | 9,2 / 8,3 / 8,2 ms | 4,7 / 4,5 / 0,9 ms | 64/96/117 | ✓ (0,59–0,63; 8,2–9,2ms) |
| tickcost-d-after = D v2 | 0,657 / 0,648 / 0,643 | 4,7 / 4,5 / 4,3 ms | 0,7 ms | 116/119/127 | ✓ (0,64–0,66; 4,3–4,7ms) |

`longtasks = []` mọi pass sau sửa lần 2 ✓. `dupRate` B v2 0,387–0,443 (LIMITS
ghi tỉ lệ tick trùng frameIdx 0,29–0,43 — khớp khoảng).

**Parity pixel:** cả 4 JSON (`mask-parity-b/e/b2/e2.json`): `cmpAB` **MAD=0,
maxAbs=0, 240.672 pixel** ✓ — đường mới bit-identical với đường cũ (feather 0
và 0,2, cả trước và sau sửa lần 2).

**Assert A–E cuối (`preview-abcde-assert4.json` + `assert-abcde4.log`):**
"ASSERT PASS: tất cả kiểm tra xanh" (1 lần trong log). Drawn-spread median theo
cửa sổ đã vẽ, đếm lại từ log: A **0,2** (47 nhóm) / B **1,4** (63) / C **0,6**
(50) / D **0,2** (61) / E **0,8** (62) — khớp đúng bảng LIMITS T2 §5.3.
`trailMax=0` mọi case (✅ a–e trong log); `rvfcFallback=""` ở cả 25 lần xuất
hiện; captures tích lũy 212→1105 (dbg cuối D 883, cuối E 1105) ✓.

**Unit test chạy lại trên cây cuối:**
`previewEngine.test.ts` **24/24** (strip-types), `ghostBlend.probe.test.ts`
**15/15**, `maskTrack.test.ts` **22/22**, `maskKeyframes.test.ts` **14/14**,
`maskTrackPreview87O4.test.ts` (O4, esbuild bundle) **37/37** — khớp hết
LIMITS T2 §6. O8 Chromium 21/21 của T2 (log `~/workspace/round92-t2/
clicktest-o8.log`, 22:18Z) — T9 chạy lại O8 cả 2 engine ở §4, supersede.

Hàm mới có mặt: `maskAlphaArray` (`previewEngine.ts:1274`),
`maskAlphaCacheKey` (`:1344`), `maskAlphaCanvasFor` (`preview.tsx:791`).

## 3. T3 — canvas stale + stall >1500ms — XÁC NHẬN (trừ 1 điểm không kiểm lại được)

**Chạy lại analyzer `analyze92t3-canvas-stale.mjs` trên 8 JSON đã lưu**
(`hidden_files/round92-t3/probe-*/probe-results.json`) — khớp bảng LIMITS T3 §1/§3:

| Lượt | re-seek | lagEl max | lagPh max | stalls >1500ms | steadyLagMean |
|---|---|---|---|---|---|
| WebKit tải GOP250 pre | 2 | 1,886 | 1,886 | 2 | 0,898 |
| WebKit tải GOP30 pre | 2 | 1,506 | 1,506 | 3 | 0,659 |
| WebKit tải GOP60 pre | 0 | 0,692 | 0,692 | 0 | 0,340 |
| WebKit tải GOP250 post (#2) | 0 | 0,725 | 0,579 | 0 | 0,268 |
| WebKit tải GOP30 post | 0 | 0,647 | 0,383 | 0 | 0,200 |
| WebKit tải GOP60 post | 0 | 0,850 | 0,467 | 0 | 0,205 |
| Chromium tải GOP250 pre / post | 0 / 0 | 0,219 / 0,166 | 0,093 / 0,070 | 0 / 0 | 0,030 / 0,038 |
| WebKit yên GOP250 pre | 0 | 0,163 | 0,097 | 0 | 0,036 |

rVFC WebKit: 0 mẫu mọi lượt (dù `supported=true`) ✓; Chromium lag trình chiếu
mean 0,015s pre → 0,004s post ✓. GOP60 pre: 6 khoảng stale, 1901ms/4791ms (40%)
✓ — đúng như LIMITS §1.1.

**Unit chạy lại:** `playheadHold90R2.test.ts` **31/31** (strip-types; 25 cũ + 6
mới T3-R1..R6) ✓.

**KHÔNG KIỂM LẠI ĐƯỢC:** số lượt GOP250 post **#1** (lagEl 0,648, steadyLagMean
0,104 trong bảng §3) — JSON đã bị lượt #2 ghi đè (T3 tự thừa nhận §4; số #1
chỉ còn trong log luồng + LIMITS). Trên đĩa hiện chỉ có #2 (khớp bảng #2).
Kết luận chính (0 re-seek / 5 lượt post) vẫn đứng vì #2 + 4 lượt post còn lại
đều có JSON và đều 0 re-seek.

## 4. T4 — cổng fail-fast trước pre-pass — XÁC NHẬN

Chạy lại trên cây cuối (render thật):
- Test mới `server/render/test_round92_t4_failfast_prepass.js`: **32/32, 0 fail**
  (F1 7 + F2–F4 4×3 + F5 6 + F6 4 + R1 3).
- S4 chạy lại `test_round91_s4_fallback_warn_ext.js`: **60/60, 0 fail**.
- T4-F1 trong lần chạy này 0,2–1,3s (LIMITS ghi 0,2/0,3/0,3s) — cùng bậc, nhanh
  hơn baseline trước sửa 5,1s.

Hàm `checkAdjLayerSplitConflicts` có mặt ở `render.js:582` (gọi sớm ở `:1596`
trong `main()` + gọi lại ở `:662` đầu `buildFilterGraph`) ✓.

## 5. T5 — i18n StickerPanel — XÁC NHẬN

- Dict đếm lại trực tiếp từ đĩa (python json, đếm key lá): **vi 2518, en 2518,
  cùng tập key, 0 key mồ côi, 0 giá trị rỗng, 61 key vi==en** ✓.
- `StickerPanel.tsx:192` dùng `{i18nT("sticker.title")}` ✓.
- 17 file test chứa `2518` ✓; 0 literal `2517` ngoài comment trong
  `apps/web/src` ✓.
- Pin vi==en=61 có mặt ở cả 4 file T5 nêu: `i18nOrphans60Q4` (assert 61),
  `i18nAudit59P7` (assert 61), `i18nSweep81I9` (assert 61),
  `codecProbeUi75C6` (`:79` comment "không tính vào 61 key vi==en" + `:85`
  assert 61) ✓.
- Chạy lại (esbuild bundle + node): i18nOrphans60Q4 **16/16**, i18nAudit59P7
  **8/8** (scan 524 literal/36 file như S5), cssClasses60Q2 **59/59**,
  i18nSweep81I9 **16/16** ✓.

## 6. T6 — G1 evidence v4 + regex EADDRINUSE — XÁC NHẬN (G1 vẫn MỞ)

- Chạy lại `hidden_files/round92-t6/analyze-pool92t6.py`: khớp toàn bộ LIMITS
  §2 — 60fps n=17 median **0,990**, PASS **15/17 (88%)**, CI [0,908; 1,086];
  30fps n=32 median **0,945**, PASS **26/32 (81%)**, CI [0,869; 1,022]; tải
  30fps 24/27 (89%), yên 30fps 2/5 (40%, median 0,680); cửa sổ 5 lần 60fps mới
  nhất median 1,040, 5/5 PASS; cửa sổ trượt 30fps 19/28 PASS; Pearson −0,408.
  Lệch làm tròn run3 (report 1,07 vs tính lại 1,06) đúng như LIMITS §3.3 ghi.
- Test chạy lại: `vite-diagnosis-regex-92t6.test.mjs` **9/9**,
  `deint-fps-verdict-83k3.test.mjs` **12/12** ✓.
- Regex mới `/EADDRINUSE|address already in use|Port \d+ is already in use/i`
  có mặt trong cả 3 harness (`clicktest-77e1-deint-fps.mjs:503`,
  `probe-78f1-tick-time.mjs:485`, `probe-79g1-tick-time.mjs:497`) ✓.
- Nhánh EPERM kích hoạt bằng fail thật: log
  `fault-inject-eperm2-run.log` có đúng dòng chẩn đoán EPERM ("vite exit 1,
  log chứa 'Operation not permitted' — sóng EPERM, KHÔNG phải cổng bị chiếm")
  ✓. Log `vite-port-busy.log` có đúng "Error: Port 5580 is already in use" ✓.
- **G1 vẫn MỞ** — T6 không tự đóng, chỉ đưa số + khuyến nghị phương án A có
  điều kiện (§4 LIMITS T6). T9 đồng ý: pool 30fps 81% vẫn mỏng (thêm 1 FAIL
  nữa là rơi dưới 80%), chân yên 30fps n=5 median 0,680, chân yên 60fps n=2 —
  quyết định thuộc parent/user.

## 7. T7 — birefnet cửa sổ yên — XÁC NHẬN (không chạy, đúng điều kiện)

- Unit guard repo chạy lại `server/bgremove/test_bgremove_ramguard.py`:
  **8/8 pass, 0 fail** ✓.
- AppImage Q9 verify lại: 557.008.461 byte,
  sha256 `9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`
  — khớp R5/Q9/S8 ✓.
- `diff` toàn file `bgremove.py` repo vs trong gói:
  **WHOLE_FILE_IDENTICAL** (23.500 byte) ✓.
- Log mẫu RAM `~/workspace/tmp-r92-t7-birefnet-window/ram-samples.log`: 20 mẫu
  MemAvailable, khớp bảng (mẫu 1: 461.608 kB = 450 MB; mẫu 9 max: 1.748.452 kB
  = 1707 MB = 27,8% ngưỡng 6144 MB) ✓. Birefnet-general vẫn **0 lần chạy thành
  công trong gói** — nợ còn mở, đúng như T7 kết luận.

## 8. T8 — EPERM probe #11 + khoảng mù #10 + quét writeFileSync — XÁC NHẬN

- Probe #11 có trong log v2 append-only (`eperm-probe-v2.log`): dòng
  `2026-11-11T20:38:56Z probe#11 boot=14e10da9 tmp+ws ok=2 fail=0` + dòng
  `boot changed 182a689e -> 14e10da9` ✓; heartbeat `n=11`, ts 20:38:56Z,
  boot `14e10da9-bc05-46ae-9fc4-8b438913fb86` ✓.
- **Quét lại writeFileSync theo đúng phương pháp chuẩn mới** (loại
  `release*/**` + `build/**` mọi cấp; chỉ cộng file count > 0):
  **2490 file trong phạm vi, 72 file có hit, 197 dòng** (T8: 2477 file / 68
  file / 186 dòng). Delta **+11 dòng giải thích được hết**: +8 từ chính file
  LIMITS của T8 (viết sau khi quét, 8 lần nhắc `writeFileSync`), +2 probe mới
  của T2 (`probe92t2-tickcost`, `probe92t2-mask-parity`), +1 probe của T3
  (`probe92t3-canvas-stale`). Non-docs 92→95 (+3, toàn harness đo một lần);
  docs 94→102 (+8, toàn trích dẫn trong văn bản). **Kết luận "không còn đường
  ghi production nào chưa nối helper" vẫn đứng.**
- Async `.writeFile(` production ngoài helper vẫn **0** (chỉ
  `epermRetry.js:116` + `eperm-retry.mjs:71` là lệnh ghi của helper; còn lại
  là asset JS vendored của Gradio — API `writeFile` của ffmpeg.wasm FS trong
  bộ nhớ) ✓.

## 9. Phát hiện mới của T9 (chưa luồng nào ghi nhận)

### 9.1 VM reboot lần thứ 11 — ~21:35:58Z, khoảng mù #11 đã bắt đầu

- Lúc 21:41Z, T9 đọc `boot_id` = `09e8d2af-4694-4d3a-b5e0-fae7d63cb904`,
  `uptime -s` = **2026-11-11 21:35:58Z** — khác boot của probe #11
  (`14e10da9`, uptime 19:22:48Z). **Reboot thứ 11 trong ~25h** (từ ~20:18Z
  10/11), trung bình ~2h18'/lần — cùng nhịp với 10 lần trước.
- Reboot rơi vào khe giữa các lần ghi của đợt 92 (T1/T3/T5 xong ~21:00–21:07Z;
  T2 viết LIMITS 22:21Z) — không luồng nào ghi nhận lúc xảy ra; T2 chỉ ghi
  "VM reboot 1 lần giữa lượt, ~21:36Z, làm chết vite dev 5173" (đã khởi động
  lại) mà không nối vào chuỗi probe.
- **Khoảng mù #11 bắt đầu 20:38:56Z** (probe #11) — loop probe v2 lại chết
  theo reboot; probe tiếp theo sẽ là #12 với một khoảng mù mới. Đề xuất cron
  riêng 10 phút vẫn CHỜ parent/user quyết (như mọi lượt trước).
- Hệ quả trực tiếp với T9: script chờ nền đầu tiên của T9 chết theo reboot
  (session mất); `/tmp` bị xóa (script chạy test của T5 ở `/tmp/round92-t5/`
  đã mất — T9 bundle lại test từ đầu, không dùng lại).

### 9.2 Server scratch — đã tắt hết (T9 dọn 1 cái)

- Bridge 8787 + vite preview 4173 của T1: **đã chết theo reboot 21:35:58Z** —
  T9 kiểm tra lúc 22:30Z: không còn listener 4173/8787, không còn process.
  Không cần dọn thêm.
- Vite dev 5173 của T2 (khởi động lại 21:41Z sau reboot, PID npm 3524 /
  node 3538): **T9 đã kill** (kill npm không đủ — phải kill cả node con 3538
  + sh 3537); kiểm tra lại: cổng 5173 free, 0 process vite còn lại.
- Xvfb :199: T9 khởi động lại bằng `~/workspace/round91-s3/xvfb.sh` để chạy
  O8 WebKit (dep WebKit đã mất sau reboot — xem §9.3). Để chạy cho các lượt
  sau dùng (như các lượt trước vẫn để Xvfb chạy).

### 9.3 Dep WebKit mất sau reboot — T9 đã khôi phục

- Sau reboot, `/usr/lib/x86_64-linux-gnu/gstreamer-1.0/` còn **0 file**
  (debroot `~/workspace/tmp-q6r3-debroot` còn đủ 269 plugin). T9 khôi phục
  theo đúng cách S3 đã ghi: `cp -an ~/workspace/tmp-q6r3-debroot/. /` →
  269 plugin trở lại + `glib-compile-schemas` → `gschemas.compiled`
  41.821 byte (khớp S3). Xvfb :199 OK. Sau đó O8 WebKit chạy được 21/21 (§4).

### 9.4 O8 Chromium của T9: S7 Δx=0,112 (quan sát, không phải fail)

- O8 Chromium T9 tự chạy (22:30Z): **21/21 pass**, nhưng chẩn đoán S7 cho
  mask Δx=**0,112**, bóng Δx=0,113 — nhỏ hơn kỳ vọng ~0,19 (T1 WebKit:
  0,194/0,197; T3: tương tự). Cả mask lẫn bóng cùng di chuyển ít hơn, đồng
  đều nhau — harness vẫn PASS theo tiêu chí của nó. Khả năng là tải VM lúc
  đo (ít frame trình chiếu hơn) chứ không phải hồi quy mask-track; ghi ở đây
  để đợt sau đối chiếu nếu S7 lại cho Δx thấp. O8 WebKit cùng lượt cho
  Δx=0,194/0,197 bình thường.

## 10. Hồi quy chéo trên cây cuối (T9 tự chạy, sau lần sửa file cuối 22:01Z)

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` (apps/web) | **0 lỗi** |
| `npx tsc --noEmit` (apps/desktop) | **0 lỗi** |
| `npx vite build` (apps/web) | **PASS 8,39s** (cảnh báo chunk >500 kB có sẵn) |
| O2 render `test_round87_o2_mask_track.js` | **25/25, 0 fail** |
| O8 click-test Chromium (harness headed, scratch `hidden_files/round92-t9/o8-chromium/`) | **21/21 pass, 0 fail** |
| O8 click-test WebKit (debroot khôi phục §9.3, scratch `hidden_files/round92-t9/o8-webkit/`) | **21/21 pass, 0 fail** |

## 11. Xung đột file chung — kiểm tra trực tiếp code trên cây cuối

- **`apps/web/src/preview.tsx`** (T2 + T3 cùng sửa, thêm S1/S2 từ đợt 91):
  `maskAlphaCanvasFor` 3 match (T2), `renderFrameTickStats92T3` 5 match (T3),
  `rvfcFrameDecision`/`requestVideoFrameCallback` 11 match (S1),
  `PLAYHEAD_RESUME_STALL_MAX_MS` 2 match (T3), `recordTickCost` 6 match (T2) —
  **tất cả marker cùng tồn tại, không ghi đè nhau.**
- **`apps/web/src/lib/previewEngine.ts`** (T2 + S1): `maskAlphaArray`
  (`:1274`), `maskAlphaCacheKey` (`:1344`) của T2 + `rvfcFrameDecision` của S1
  cùng tồn tại; unit 24/24 xanh (T2 + S1).
- **`apps/web/src/media.ts`**: chỉ T1 sửa đợt này (`srcLatch`, 7 tham chiếu) —
  không luồng nào khác đụng.
- **`server/render/src/render.js`**: chỉ T4 sửa đợt này
  (`checkAdjLayerSplitConflicts`, gọi sớm + gọi lại đầu `buildFilterGraph`) —
  không luồng nào khác đụng.
- **`apps/web/src/i18n/*.json`**: chỉ T5 sửa đợt này (key `sticker.title`) —
  không luồng nào khác đụng.
- Không có file nào khác bị 2 luồng cùng sửa.

## 12. Lỗi thật phát hiện / sửa production — KHÔNG CÓ

- T9 **không sửa production**. Không phát hiện lỗi thật nào do T1–T8 gây ra.
- 2 đính chính chỉ ở mức trình bày (không phải code): (a) số play() @ct=0 của
  T1: 8/7/6 thay vì 7/6/6 (§1); (b) JSON lượt GOP250 post #1 của T3 đã bị ghi
  đè — số chỉ còn trong log, không kiểm lại được từ đĩa (§3). Cả hai đã ghi
  rõ ở đây, không cần sửa code.

## 13. Verify read-back toàn bộ batch đợt 92 (KHÔNG push)

Batch T9 (1 entry — chỉ file LIMITS này, vì T9 không sửa production):

- `docs/PHASE9_ROUND92_T9_VERIFY_LIMITS.md`

| Batch | Entry |
|---|---|
| phase9-round92-t1-flipflop-src.txt | 5 |
| phase9-round92-t2-tick-cost.txt | 8 |
| phase9-round92-t3-canvas-stale.txt | 6 |
| phase9-round92-t4-failfast-prepass.txt | 3 |
| phase9-round92-t5-i18n-sticker.txt | 21 |
| phase9-round92-t6-g1-evidence4.txt | 5 |
| phase9-round92-t7-birefnet-window.txt | 1 |
| phase9-round92-t8-eperm-probe.txt | 1 |
| phase9-round92-t9-verify.txt | 1 |
| **Tổng đợt 92** | **51 entry / 9 file** |

Verify read-back (đọc lại từng batch NUL-delimited, kiểm tra từng entry tồn
tại trên đĩa + không chứa byte NUL trong 8 KB đầu = text): **51/51 tồn tại,
0 thiếu, 0 binary, 0 workflow** (`.github/workflows/*`).

Tổng chờ push sau đợt 92 (đếm trực tiếp từ đĩa, theo mẫu đợt 91): đợt 67–91
là 2071 entry / 252 file batch; đợt 92 thêm 51 entry / 9 file batch. Số file
duy nhất cần đếm lại ở closing (parent) vì nhiều entry trùng file đã stage
đợt trước (vd `preview.tsx`, `previewEngine.ts`, dict i18n). HEAD vẫn
**5f548ef8**. KHÔNG push.

## 14. Nợ mở cho đợt 93 (từ LIMITS các luồng + phát hiện T9)

1. **rVFC pump/scheduling** (T2 §8.1): tỉ lệ capture 0,56–0,66 còn thấp — giới
   hạn nay là scheduling/capture (~8–32ms, gap tới ~300ms), không còn là tick.
2. **Cache mask theo frameIdx** (T2 §8.2): tick trùng frameIdx nay 0,29–0,43
   (lúc baseline 5% đã bác; nay cần đo lại).
3. **Parity pixel feather lớn + invert** trên đường canvas (T2 §8.3 — unit test
   đã có, parity probe chưa chạy).
4. **Click-test WebKit sau sửa đường mask** — T2 chỉ chạy Chromium O8; T9 đã
   chạy WebKit O8 21/21 trên cây cuối (§10) nên nợ này coi như ĐÃ ĐÓNG ở
   mức kiểm chứng, nhưng cần chạy lại nếu đợt 93 đụng lại đường mask.
5. **Đo ở unit 4K / clip dài hơn 3s** (T2 §8.5); **mask+blur ở độ phân giải khác
   640×360** (T2 §7.5).
6. **Trần 5000 ms của T3 chưa có bằng chứng trực tiếp ngoài đời** (chưa lượt
   post nào gặp stall >1500ms; chỉ unit test + 0 re-seek) — nếu đợt sau gặp
   stall 2–3s mà vẫn re-seek thì trần này có vấn đề.
7. **Lag đỉnh còn lại 0,65–0,85s là frame trình chiếu WebKit tụt sau currentTime**
   (T3 §5.1) — cần nguồn frame khác (WebCodecs decode xuôi) hoặc giảm tải
   decode; rVFC không khả thi trên WebKitGTK (0 callback).
8. **G1 vẫn MỞ** — quyết định thuộc user (T6 §4; T9 §6).
9. **Birefnet vẫn 0 lần chạy thành công trong gói** (T7) — cần cửa sổ yên
   ≥6 GB ~7 phút hoặc máy nhiều RAM; T7 đề xuất cân nhắc dừng thử lại mỗi
   lượt khi không có tín hiệu RAM thay đổi.
10. **EPERM probe: khoảng mù #11 đã bắt đầu 20:38:56Z + reboot #11 ~21:35:58Z**
    (T9 §9.1) — cron riêng 10 phút vẫn chờ user quyết; probe tiếp theo là #12.
11. **TTS 39: CẤM kiểm lại. ci-security 403: chờ user.**
12. **O8 Chromium S7 Δx=0,112** (T9 §9.4) — đối chiếu ở đợt sau nếu lặp lại.
13. **Lỗi phương pháp lặp lại 2 đợt liên tiếp:** JSON probe bị ghi đè do dùng
    chung phase/scratch cho retry (S2 §4 → T3 mắc lại §4). Quy tắc: phase phải
    khác nhau cho mỗi lần chạy (vd `post2`), kể cả retry — parent nhắc lại ở
    closing.
