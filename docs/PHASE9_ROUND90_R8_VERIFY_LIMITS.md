# Phase 9 đợt 90 — R8: Kiểm chứng độc lập R1–R4 (KHÔNG push)

> Luồng kiểm chứng độc lập — không tin blind vào LIMITS của R1–R4. Mọi số
> dưới đây là do R8 đo/chạy lại từ cây hiện tại, trừ khi ghi rõ "đọc từ
> LIMITS/log của luồng đó". KHÔNG push, KHÔNG release/tag, KHÔNG sửa
> production (không phát hiện lỗi nào cần sửa).
> Thời gian: 11/11/2026 ~21:50–22:50 +07 (14:50–15:48Z). VM 4 vCPU EPYC
> 9D25, RAM 8 GB, không GPU.
>
> **Kết luận ngắn: cả 4 luồng R1–R4 đều XÁC NHẬN — số đo chạy lại khớp
> claim của họ trong sai số tải/pha cho phép; không phát hiện lỗi thật
> nào trong code của họ.** Hai sự cố môi trường trong lượt (reboot VM
> 15:29Z + /tmp đầy 97%) đã được xử lý và không làm sai lệch kết quả
> cuối (xem §6).

## 1. R1 — Motion blur + mask ở preview (hướng (iii)): XÁC NHẬN

### Chạy lại từ cây hiện tại
- **Assert A/B/C** (`probe90r1-motionblur-preview.cdp.mjs --cases a,b,c
  --passes 3 --assert`, vite 5173 của R1): **ASSERT PASS, exit 0**
  (log `hidden_files/round90-r8-r1-assert.log`,
  JSON `hidden_files/round90-r8-preview-abc-assert.json`).

| | R8 đo lại | R1 báo | Nhận xét |
|---|---|---|---|
| A gStd play median t=0.5/1.0/1.5 | 111.8 / 111.9 / 111.9 (baseline 111.8/112/112) | 111.8 / 111.8 / 111.8 | Khớp — identity đúng |
| B gStd play median | 84.0 / 38.2 / 82.8 | 83.1 / 37.4 / 82.7 | Khớp (pha sọc) |
| C gStd play median | 38.3 / 38.0 / 37.9 | 82.9 / 38.0 / 37.6 | t=0.5 lệch do pha sọc (range 37–84 ở cả 2 lượt); median vẫn thỏa ngưỡng blur |
| Trail max (mọi khung) | 0 (A 73 / B 177 / C 247 khung) | 0 (383 khung) | Khớp — hết vệt |
| Mép edgeL/R median | A 2.0/2.1, B 1.2/2.1, C 2.0/2.1px | như vậy | Khớp từng chữ số |
| Tâm lệch median từng khung | 0.001 (max 0.0009) cả 3 case | 0.001 (max 0.0009) | Khớp từng chữ số |
| w50 median | A 508–508.6, B 505.5, C 508.1–508.5 | như vậy | Khớp |

- **Hook gate snapshot** (JSON assert của R8): ring = 2, skippedDuplicate
  = 3 / 30 / 88 (A/B/C), ringClears 5 / 15 / 26 — gate theo frame chạy
  thật, khớp claim R1 (§1.1).
- **Unit suites chạy lại:** `previewEngine.test.ts` **17 passed**;
  `ghostBlend.probe.test.ts` **15 xanh**; `maskTrack.test.ts` **22 pass,
  0 fail**; `maskKeyframes.test.ts` **14 pass, 0 fail**; O4
  (`maskTrackPreview87O4.test.cjs`) **37 check xanh** — tất cả khớp số
  R1 báo.
- **Click-test O8 chạy lại (cây cuối, R8 tự chạy): Chromium 21/21,
  WebKit 21/21, exit 0 cả hai** (log `round90-r8-o8-chromium.log`,
  `round90-r8-o8-webkit.log`). S5(a2): Chromium blob 0.4428 vs kỳ vọng
  0.4427; WebKit blob 0.3902 vs 0.3894; S7 Δx Chromium 0.112/0.113,
  WebKit 0.194/0.197 — khớp số R1 báo.
- Harness R1 đã đọc kỹ: neo cx theo playhead từng khung, gStd theo
  videoTime, trail/edge trên MỌI khung không đóng băng, không lọc cx —
  đúng 3 bẫy Q2 §3.4/§11. Thiết kế đo vững.
- Ghi nhận thêm (không phải lỗi): B t=0.5 một khung lẻ gStd về 112.4
  (pha sọc trúng chu kỳ) — R1 §5.1 đã giải thích đúng; edgeR max 3.6px
  khung lẻ (A/C) tái hiện cả ở lượt R8 — đúng như R1 §5.2 ghi.

## 2. R2 — Playhead đóng băng lúc phát sau seek: XÁC NHẬN

### Đối chiếu JSON probe (đọc lại sau khi R2 chạy lại bản a2)
- Bản JSON R8 đọc lúc 15:23 là **bản pre-a2** (webkit-load-fixed
  playheadAtSeekDone 0.667, lagAfterMax 4.34) — R2 đã chạy lại sau (a2)
  và ghi đè JSON lúc 15:22–15:24. Số cuối trên đĩa khớp đúng bảng
  LIMITS R2 §3: chromium-fixed 0.5/0.5, hold 4, steadyLag 0.1284;
  webkit-fixed 0.5/0.5, hold 29, steadyLag 0.4603; webkit-load-fixed
  0.5/0.5, hold 28, steadyLag 0.6817, lagAfterMax 0.6814.
- `lagAfterMax` 4.34 ở bản pre-a2 không phải lỗi sản phẩm: đó là lag
  của khung stale t=5 (ballTime 5 − playhead giữ 0.667) — R2 §4 giải
  thích đúng cơ chế.
- **Nhiễu tải (ghi nhận, không phủ nhận kết luận):** lượt baseline
  chạy lúc loadavg cuối 15.65 / 8.88 / 2.67 / 22.41, lượt fixed lúc
  1.23 / 0.86 / 1.27 / 5.32 — so sánh lag tuyệt đối trước/sau KHÔNG
  cân tải. Nhưng chỉ tiêu chính (playhead lúc seek xong / lúc canvas
  đổi = 0.5, vượt 0 frame) là hành vi giữ/không-giữ, không phụ thuộc
  tải. R2 §5.6 đã tự ghi rõ điểm này — trung thực.

### Chạy lại từ cây hiện tại
- `playheadHold90R2.test.ts`: **14/14 passed** (node strip-types).
- `seek.test.ts`: **20 passed** (node strip-types).
- **Click-test O8 chạy lại: Chromium 21/21, WebKit 21/21** (cùng 2 lần
  chạy ở §1 — cây cuối chứa cả sửa R1+R2).
- **Xung đột file chung R1↔R2:** cả hai cùng sửa `preview.tsx`.
  Marker R2 (`playheadHeld`, `__vcutPlayheadHold90R2`, import
  `playheadHold90R2`) VẪN CÓ MẶT sau lần sửa 15:20 của R1; marker R1
  (`rawUnitSource`, `compositeMotionBlurLayer`, `motionBlurResetOnSeek`,
  `videoFrameIndex`) cũng có mặt (16 match) — hai sửa cùng tồn tại,
  không ghi đè nhau. tsc web 0 trên cây cuối (§5) xác nhận thêm.

## 3. R3 — WebKit clip D blob prefetch: XÁC NHẬN (có giới hạn như R3 đã ghi)

### Đếm lại JSON kết quả từ đĩa (không tin bảng của R3)
- Loop-D `webkit-loop-d-blob-prefetch-90r3.json` (27 case): B0 1/3, B8
  1/3, B16 1/3, **P1 6/6, P2 2/2**, P3a 1/5, P3b 0/2, P4 1/2, P5 0/1 —
  **khớp đúng bảng LIMITS R3 §2**.
- Load-probe `webkit-blob-load-90r3.json` (6 case, metric là `playOk`):
  P6 run1 playOk=false (play-timeout-10s, 0 frame), run2/3 playOk=true
  (185/186 frame) → **2/3**; B40 3/3 playOk=true → **3/3** — khớp
  claim R3 §3.
- P3a-run5 (build 8 MiB): skipped đúng, pass 5/5 dạng progressive —
  logic ngưỡng hoạt động end-to-end, đúng như R3 viết.

### Code production đã đọc trực tiếp
- `apps/web/src/media.ts`: `BLOB_PREFETCH_MAX_BYTES = 8 * 1024 * 1024`
  (dòng 35), `BLOB_PREFETCH_TOTAL_CAP_BYTES = 64 MiB` (dòng 36),
  guard `blobSkipped` có mặt (dòng 260/275/377/382/386/391/451) —
  đúng bug fetch-storm R3 §5 mô tả (thiếu guard thì videoFor mỗi
  frame fetch lại).
- Ngưỡng 8 MiB là lựa chọn biên an toàn có cơ sở: vùng chứng minh tốt
  ≤ 1,3 MB (8/8); vùng lỗi bắt đầu ở 10 MB (cả load P6 2/3 lẫn loop
  P3a/P3b 1/7 gộp). Khoảng 1,3–10 MB bitrate thực tế chưa đo — R3 §6
  mục 1 đã ghi là nợ, không claim hơn.

### Chạy lại từ cây hiện tại
- Unit test `media.blobPrefetch90R3.test.ts` (esbuild bundle + node):
  **19 pass, 0 fail** (log `hidden_files/round90-r8-r3-unittest.log`).
- `seek.test.ts`: 20 passed (xem §2 — R3 cũng claim hồi quy này).
- KHÔNG chạy lại probe loop-D WebKit (27 run, mỗi run tới 40 s stall +
  cần Xvfb/GStreamer; R3 vừa chạy xong 15:38–15:41 trên cùng boot, JSON
  đã đếm lại đủ) — ghi rõ, không bịa.

## 4. R4 — Fallback warn cấp site cho keyframes: XÁC NHẬN

### Code production đã đọc trực tiếp
- `server/render/src/render.js` `maskChainForSite`: nhánh keyframes
  mode png, cả 2 helper fail → warn site `mask keyframes: không vẽ được
  video mask (xem log pre-pass) → mask tĩnh tại t=0 (KHÔNG chạy
  keyframes…)` (dòng 555–556), mirror đúng nhánh tracked (dòng 536);
  mode geq/trackgeq → warn `--mask-mode <mode> không chạy keyframes`
  (dòng 561–562), wording tránh cụm "không vẽ được video mask" nên
  không phá assert absence Q4 GEQ-B.
- `maskMode` mặc định `"png"` (dòng 256) + validate CLI png|geq|
  trackgeq (dòng 365–371) nên `${ctx.maskMode}` không bao giờ in
  `undefined`. Nhánh trackgeq+track return sớm (dòng 525) nên warn
  geq-mode chỉ khi không track — khớp ghi chú R4.

### Chạy lại từ cây hiện tại
- Test mới `test_round90_r4_fallback_warn_keyframes.js`: **49 pass,
  0 fail, exit 0** (lần chạy lại thứ 2, log
  `hidden_files/round90-r8-r4-test2.log`) — khớp claim R4 49/49.
- P1 `test_round88_p1_mask_fallback.js`: **30 pass, 0 fail, exit 0**
  (log `hidden_files/round90-r8-p1-test2.log`) — khớp claim R4.
- Lần chạy lại thứ 1 chết vì /tmp đầy (xem §6) — lỗi môi trường, không
  phải lỗi code R4; chạy lại sau dọn /tmp thì xanh toàn bộ.

## 5. Hồi quy chéo trên cây cuối đã gộp (R1+R2+R3+R4)
- `npx tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi**.
- `npx vite build` apps/web: **PASS, 6.23 s** (cảnh báo chunk > 500 kB
  có sẵn từ trước, không phải fail).
- `seek.test.ts`: **20 passed** (xem §2).
- O2 render spot-check `test_round87_o2_mask_track.js`: **25 pass,
  0 fail, exit 0** (log `hidden_files/round90-r8-o2-test.log`).
- Batch đã stage của 4 luồng — verify read-back từ đĩa: R1 6/6, R2 6/6,
  R3 9/9, R4 3/3 tồn tại, đều là text, không binary, không workflow.
- Dict i18n: R9 đã xong trước khi R1–R4 hạ cánh (vi=en=2516) nên sweep
  của R9 CÓ THỂ bỏ sót key mới — nhưng kiểm tra trực tiếp: R1–R4
  không thêm key i18n nào (không có thay đổi vi/en.json sau 08:46 UTC
  đợt 88 P6; warn R4 là chuỗi console, không qua i18n) — nên dict 2516
  vẫn đúng, không cần chạy lại R9.

## 6. Sự cố môi trường trong lượt (ảnh hưởng tới kiểm chứng)
1. **/tmp đầy 97% (15:22Z):** tmpfs 512M chỉ còn 17M — `/tmp/q6` 410M
   (debroot stale đợt 89 Q6, 0 file mới sau 14:00Z) là thủ phạm chính.
   Lần chạy lại test R4 đầu tiên chết vì ENOSPC (R4-C ffmpeg exit 228,
   R4-D crash ghi shim JSON) — KHÔNG phải lỗi code R4. Đã xoá `/tmp/q6`
   (staging deb đã copy vào `/` từ Q6; R3 vẫn chạy WebKit tốt sau đó),
   /tmp trống 426M, chạy lại R4: 49/49 xanh.
2. **VM reboot 15:27–15:29Z** (boot 62b088d2 → 0799d357, uptime 1 phút
   lúc 15:29Z): /tmp wipe toàn bộ — `/tmp/q6r3` của R3 (clip + bundle)
   và plugin GStreamer mất; P1 chạy lại lần 1 của R8 bị giết giữa
   chừng; waiter poller chết ở poll 4. Repo + ~/workspace còn nguyên
   (preview.tsx 15:20, media.ts 15:02, JSON R3 19→27 case sau đó).
   R3 tự khôi phục (debroot nay ở `~/workspace/tmp-q6r3-debroot`,
   413 MB, trong workspace). R8 chạy lại P1 lần 2: 30/30 xanh;
   khởi động lại waiter (báo ALL_LANDED 15:44:32Z).
3. RAM khả dụng dao động 396 MB–1,7 GB trong lượt — harness nặng chạy
   tuần tự, không song song với render khác (đúng dặn dò task).

## 7. Nợ còn lại cho đợt sau (từ LIMITS các luồng, R8 xác nhận là còn mở)
- R1 §5: combo mask+SR+blur và mask+feather>0+blur chưa đo pixel
  (spec D/E); gStd phụ thuộc khoảng cách tick (hướng rVFC để vòng sau).
- R2 §5: sawtooth dư ~0,5–0,8 s trên WebKit dưới tải (độ trễ resume
  decode sau seek — có từ baseline); trần giữ 15 s; khung stale trong
  lúc seek là tất yếu.
- R3 §6: đo nốt ngưỡng thật 1,3–10 MB bitrate thực tế; chẩn đoán
  blob-load fail ở file lớn (cần GST_DEBUG); swap-trượt trong app
  thật chưa đo; proxy > ~32 s vượt ngưỡng 8 MiB.
- R4 §3: image clip + mask keyframes chưa đo riêng; trackgeq không
  track + keyframes chưa có test warn riêng; warn lặp theo số đoạn khi
  adjustment layer tách clip.
- Môi trường: dep WebKit mất sau mỗi reboot (nay có debroot trong
  workspace); /tmp chỉ 512M — các lượt render nặng cần dọn /tmp trước
  (bài học từ §6.1); cron riêng 10 phút cho probe EPERM vẫn chờ
  user quyết; TTS 39 CẤM kiểm lại; ci-security 403.

## 8. File (stage, KHÔNG push)
- `docs/PHASE9_ROUND90_R8_VERIFY_LIMITS.md` — file này.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round90-r8-verify.txt`
  (1 entry, text). KHÔNG push. HEAD vẫn 5f548ef8.
- Log luồng: `workspace/goals/capcut-clone-video-editor/hidden_files/round90-r8.md`.
  Log đo của R8 (không stage, để parent tra):
  `round90-r8-r1-assert.log`, `round90-r8-preview-abc-assert.json`,
  `round90-r8-o8-chromium.log`, `round90-r8-o8-webkit.log`,
  `round90-r8-r3-unittest.log`, `round90-r8-r4-test2.log`,
  `round90-r8-p1-test2.log`, `round90-r8-o2-test.log`.
