# PHASE9 ROUND89 — LIMITS GỘP (đợt 89, lượt cron 18:35 +07 11/11/2026)

> Chủ đề lớn: **đóng nốt nợ LIMITS gộp đợt 88 §4** (pre-pass keyframes, motion blur + mask,
> trackgeq hoàn thiện, fallback mở rộng, harness seek O8, WebKit clip D, G1 evidence,
> EPERM probe, birefnet trong AppImage) — 9 luồng Q1–Q9, tất cả đều về.
> KHÔNG push. KHÔNG release/tag. HEAD vẫn 5f548ef8.
> **Lưu ý vận hành:** lượt cron 18:35 spawn 9 luồng xong thì parent bị giết bởi
> **sandbox reset / VM reboot 13:21:06Z** (boot 7439870b → 62b088d2) nên closing đợt 89
> KHÔNG diễn ra trong lượt đó. Closing này do lượt cron 21:35 thực hiện (verify lại
> từ đĩa + chạy lại test chọn lọc), không phải lượt 18:35.

## 1. Kết quả từng luồng

### Q1 — Pre-pass R2 thừa PNG cho mask keyframes (nợ đợt 88 §4 mục 7: ĐÃ ĐÓNG)
- Sửa production: 1 dòng `if (hasMaskKeyframes(clip.mask)) continue;` trong vòng lặp
  pre-pass R2 (`server/render/src/render.js:1703`), sau điều kiện P2, trước `seen.add(key)`.
- Số đo thật (720p/30fps/4s): trước sửa mỗi clip mask keyframes bị vẽ 1 PNG R2 thừa;
  sau sửa **0 PNG R2**, 1 video mask anim. Case w/h: bề rộng vùng đỏ 0.2492 → 0.5492
  (t=0.5/3.5); case geometry: tâm đỏ 0.275/0.500/0.725. **MAD trước/sau sửa = 0.0**
  cả 6 cặp (Q1 đo trực tiếp với baseline; baseline /tmp đã mất sau reboot VM nên
  parent chạy lại chỉ còn 23/27 assert — 4 assert MAD bị skip vì thiếu
  `Q1_BASELINE_DIR`, không phải fail).
- Mix keyframes + tĩnh cùng maskKey: R2 vẽ đúng 1 PNG (chỉ cho clip tĩnh).
- Test mới `test_round89_q1_mask_keyframes_prepass.js`: Q1 báo 27/27;
  parent chạy lại **23 pass, 0 fail** (4 assert MAD skip, xem trên).
- Chi tiết: `docs/PHASE9_ROUND89_Q1_MASK_KEYFRAMES_PREPASS_LIMITS.md`.

### Q2 — Motion blur + mask: đo lại với footage thật có vân (nợ đợt 88 §4 mục 8: ĐÃ ĐO XONG, chưa sửa)
- **Kết luận: lệch do PREVIEW, không phải render thiếu blur.** Render blur nội dung thật
  (B/C: gStd 127→43–96, MAD 4.5–13.3) và mép mask LUÔN sắc (≤1.9px, 18/18 frame).
  Preview play biến thiên theo pha tick: lúc không blur nội dung (b-blur t=1.5: gStd 112.4
  = baseline pause), lúc vệt mép mask (P3: 12–16px; 12:13 dưới tải: tới 145px).
- Cơ chế: preview snapshot unit ĐÃ MASK theo tick (~60fps) chứ không theo frame video
  (30fps) → blend lúc trùng frame (không blur), lúc lệch frame (vệt mask). Render tmix
  trước mask, theo frame video → xác định.
- **KHÔNG sửa production trong lượt này** (quyết định đúng của Q2 — hướng sửa cần
  parent quyết + vòng riêng với full click-test).
- Test khóa render: **51 pass / 0 fail** (`server/render/src/test_round89_q2_motionblur_mask.js`).
- Hướng sửa đề xuất (§7): **(iii) snapshot theo frame video + mask 1 lần sau blend**
  — parent CHỐT làm ở đợt 90 (xem §3 mục 1).
- Chi tiết: `docs/PHASE9_ROUND89_Q2_MOTIONBLUR_MASK_LIMITS.md`.

### Q3 — Trackgeq hoàn thiện (nợ đợt 88 §4 mục 9: ĐÃ ĐÓNG)
- C1–C4 fail-fast nested (speed/trim + track): C1 5/5, C2 3/3, C3 3/3, C4 5/5
  (chạy lại sau reboot, số giống hệt trước reboot).
- **O3 `all` một lần chạy duy nhất sau reboot: 21 pass, 0 fail** (13:42–13:47Z),
  số khớp hệt O3 gốc. Harness O3 đã thêm retry EPERM (sóng EPERM giết lần 1 ở section D).
- Render trackgeq P: 14 pass, 0 fail (35.8s, 2.51 fps; png 9.2s, 9.78 fps):
  cx 512/640/768 đúng tuyệt đối cả 2 mode, rộng 512px.
- Preview CDP khớp cả 2 mode render (p-nokey: |Δcx| ≈ +0.9/+0.9/+1.0px — pixel-center
  canvas, không phải lệch hình học; a-keyframes: cx khớp, w50 theo keyframes).
- Render trackgeq spec keyframes: cx đúng nhưng **bbox w/h ĐÓNG BĂNG ở tĩnh**
  (Δw −131/0/+125px, Δh tới ±0.1) — giới hạn đã biết của đường thử nghiệm, đo chính xác lần này.
- Quyết định task 4: **hướng (b) KHÔNG thêm cờ mask-mode cho preview** — đã chứng minh
  bằng đo pixel (preview khớp render trackgeq khi không keyframes; chỉ lệch case
  keyframes w/h, giữ nguyên như giới hạn đã biết). Sửa comment stale preview.tsx:1794.
- tsc web 0; vite build pass (26.81s).
- Chi tiết: `docs/PHASE9_ROUND89_Q3_TRACKGEQ_COMPLETE_LIMITS.md`.

### Q4 — Fallback video-mask mở rộng + đo 4K/clip dài/track 240 điểm (nợ đợt 88 §4 mục 10: ĐÃ ĐÓNG)
- Test mở rộng **105/105 xanh** (full run 13:36–13:46Z,
  `server/render/test_round89_q4_mask_fallback_ext.js`): D4 27, IMG 28, GEQ 19,
  INV 23, T240 8. Ép fallback bằng shim `python3` (mẫu P1).
  D4-A PNG fallback t=0 tâm 0.3 MAD=0.000; IMG-A PNG fallback t=0 tâm 0.35 MAD=0.000;
  GEQ shim cả 2 helper fail vẫn render đúng MAD=0.000, KHÔNG warn (geq bỏ qua pre-pass
  theo thiết kế); INV-A centroid (0.5196, 0.4992) ≈ (0.52, 0.5) MAD=0.000;
  T240 trackgeq 86.2s / 1.39 fps, tâm lệch 0.06/0.00/0.06px (≤0.1px như P4);
  mode png 12.9s / 9.33 fps.
- **P1 re-run: 30/30 xanh** (13:34Z) — parent chạy lại lần nữa: **30/30 xanh**.
- Bench 4K 3840×2160 2s mask+track: **0.57 fps** (wall 105.9s), đỉnh RSS 2189 MB,
  tâm lệch 0.0000. Bench 720p 30s: **5.58 fps** (wall 161.2s), RSS 396 MB.
- Quan sát chưa sửa: nhánh keyframes fallback **thiếu warn ở cấp site** (chỉ có warn ở
  log pre-pass); nhánh tracked có warn site → đợt 90 (xem §4 mục 4).
- Chi tiết: `docs/PHASE9_ROUND89_Q4_MASK_FALLBACK_EXT_LIMITS.md`.

### Q5 — Xác nhận seek trước khi đo + timeout Seeker dưới tải (nợ đợt 88 §4 mục 11: ĐÃ ĐÓNG)
- Harness O8 xác nhận seek thật (4 tín hiệu: element + playhead + canvas-đổi + ổn định);
  hết 30s không confirmed → FAIL STALE. S7 thêm kiểm tra di chuyển
  (mask Δx ≥ 0.10 VÀ bóng Δx ≥ 0.10). (a2) lúc phát: chờ canvas đổi khỏi khung t=5
  (tối đa 15s) + đọc blob+playhead trong CÙNG 1 evaluate (`MEASURE_PLAYHEAD_FN`).
- `Seeker` gia hạn timeout: `SeekOpts.timeoutExtensions` (mặc định 0),
  `SEEK_TIMEOUT_EXTENSIONS = 5` → ngân sách **7.2s/attempt** cho preview
  (timeout 1200ms cũ không đủ ngay cả khi không tải).
- Số đo seek (clip o8-ball GOP 250, 6 trial/lượt): Chromium không tải tElement
  med/max 1535/2445ms, tCanvas 1800/2500ms; Chromium 3× yes 4024/7335ms,
  5173/9401ms; WebKit không tải 3288/6418ms, 3490/6627ms; WebKit 3× yes
  8310/9723ms, 8613/15974ms.
- Test: `seek.test.ts` **20/20 PASS** (parent chạy lại bằng tsx: 20 passed;
  lưu ý: file này tự chạy bằng Node type-stripping, KHÔNG phải suite vitest —
  chạy bằng `npx vitest run` báo "No test suite found" là do gọi sai runner,
  không phải fail); `tsc --noEmit` exit 0; `vite build` PASS (45.28s).
- **Click-test O8: Chromium 21/21 (×2 lần); WebKit 20/21 → 20/21 → 21/21**
  (lần 3, sau reboot + đọc nguyên tử). S7: mask Δx=0.194, bóng Δx=0.197 (WebKit);
  mask Δx=0.112, bóng Δx=0.113 (Chromium, canvas letterbox).
- Nợ sản phẩm còn lại (Q5 §6): **playhead chạy trước canvas lúc phát sau seek**
  (store playhead tăng theo wall-clock trong khi element đang seek, lệch tới nhiều
  giây trên WebKit dưới tải) → đợt 90 (xem §4 mục 2). `seeked` ≠ đã vẽ (canvas chậm
  hơn element tới ~7s dưới tải).
- Chi tiết: `docs/PHASE9_ROUND89_Q5_SEEK_CONFIRM_LIMITS.md`.

### Q6 — WebKit clip D loop: thử fix race preroll (nợ đợt 88 §4 mục 3: KHÔNG fix dứt điểm)
- B0 baseline **0/5 pass** (tái hiện xác nhận). F1 gated-restart 5s: 0/5 (gate luôn
  timeout — thực chất delay 5s; 0 stall vĩnh viễn nhưng không ship được).
  F2 load-restart: 0/5 (`canplay` không đủ). **F3 prime-only: 3/5 pass**
  (sau sửa bug probe `sleep`). **F4 blob: 2/2 pass** (5/5 vòng; + N1 P6 5/5 = 7/7).
  F5 delay 1s: 1/5 (ngưỡng nằm trong (1s, 5s]).
- **Kết luận: KHÔNG fix dứt điểm; KHÔNG đổi production.** Hướng tiếp theo có bằng
  chứng: **prefetch blob cho clip proxy/HTTP nhỏ** (F4 7/7) — local import đã là blob;
  chỉ đường proxy (`item.proxyUrl`) và sample HTTP còn dùng URL progressive.
  Đề xuất đợt 90: fetch toàn bộ → blob URL rồi mới gán `src` (ngưỡng ≤8–16 MB cần đo),
  kèm `revokeObjectURL` + fallback về URL gốc.
- Môi trường: VM reboot trước lượt; RAM khả dụng ~1.9 GB → ~1.2 GB khi 9 luồng chạy
  song song; load average tới ~21. **Sandbox reset toàn bộ ~13:21–13:23Z**:
  /tmp/q6 biến mất, lib đã copy vào /usr/lib biến mất, Xvfb :199 chết — bài học:
  mọi thứ ngoài ~/workspace đều có thể mất sau reset, đừng để trạng thái quan trọng
  ở /tmp hay /usr. Q6 khôi phục bằng apt cache (170 .deb còn đủ).
- Không có file production nào thay đổi. Không thêm test khóa hành vi production mới
  (không có fix thành công để khóa).
- Chi tiết: `docs/PHASE9_ROUND89_Q6_WEBKIT_CLIPD_LIMITS.md`.

### Q7 — G1 evidence (nợ đợt 88 §4 mục 1: BẰNG CHỨNG MỚI, KHÔNG tự đóng)
- Cửa sổ đo mới (cây hiện tại, script K3 như N5): 5 lần chạy, 3 lần gãy (timeout chờ
  project mẫu load + hook `__vcutPreviewEnhance`; EPERM giết verdict script).
- Tốc độ tuyệt đối GIẢM ~2/3 so với N5 (baseline sụp mạnh hơn tử số) — tỉ lệ 1.22×
  trong lượt này KHÔNG được trích như tốc độ deint.
- Khuyến nghị (KHÔNG tự đóng): xem xét **đóng MỘT PHẦN (30fps, chế độ tải)** theo
  phương án A của N5, với 4 điều kiện ghi trong LIMITS Q7 §4 (ghi rõ chế độ tải;
  không trích pool gộp làm verdict duy nhất; ghi rõ 3 lần Q7 là sóng tải; chân 60fps
  + chân yên vẫn mở riêng). KHÔNG đóng toàn vẹn: pool vượt 80% đúng 1 lần; cửa sổ Q7
  không đủ 5 lần; 60fps vẫn 75%; luật median-5 vẫn lật 9/23 cửa sổ.
- Nợ harness (Q7 §7 mục 4): chẩn đoán "cổng bị chiếm?" sai khi vite exit 1 do EPERM —
  cần phân biệt EPERM với port conflict; bọc lỗi trước-try cho E1/verdict script;
  ghi số slot đóng băng kèm mọi verdict. 60fps cần thêm ít nhất 2 lần PASS liên tiếp
  để lên 8/10 = 80%. Chế độ yên cần thêm lần đo (hiện n=4).
- **Parent quyết:** G1 vẫn MỞ — không tự đóng trong phiên nền; bằng chứng Q7 + N5
  để user quyết (xem §3 mục 2). Đợt 90 chỉ làm phần harness + đo thêm 60fps/yên.
- Chi tiết: `docs/PHASE9_ROUND89_Q7_G1_EVIDENCE_LIMITS.md`.

### Q8 — EPERM probe v2 checklist + điều tra lần chết mới nhất (nợ đợt 88 §4 mục 4: ĐÃ ĐO XONG)
- Checklist P8 §2.3 (11:37:37Z): `status` DEAD/STALE (heartbeat n=6 ts 09:41:01Z
  boot e10b9199, age 6995s); `once` probe #7 boot=7439870b ok=2 fail=0; `status`
  chạy lại ALIVE, age 0s.
- Điều tra: VM reboot lần nữa 11:34:38Z (boot e10b9199 → 7439870b) — reboot thứ 6
  trong ~15h. Log v2 chỉ có ĐÚNG 1 dòng `probe start` (PID 13674, 08:49:50Z) — sau
  probe #6 (09:41:01Z) KHÔNG có loop nào được start; khoảng 09:41–11:37Z (~116 phút)
  là khoảng mù KHÔNG CÓ OBSERVER, không phải loop chết.
- Quét writeFileSync (~11:40–11:45Z): 163 dòng / 61 file — code 102 + docs 61 mẫu;
  +21 code so với P8 (81): +20 bản copy bundled-server `apps/desktop/build/` (build
  output, không phải source) + 1 harness đo P3. Async `fs.writeFile(` trong code
  production: **0 ngoài helper**. Không còn đường ghi production nào chưa nối.
  Quét 0-byte 24h: không file dữ liệu nào mới.
- Helper tests chạy lại: gốc 22/22, CJS 8/8, desktop 11/11 — xanh.
- KHÔNG start loop nền trong lượt này; đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết.
- Chi tiết: `docs/PHASE9_ROUND89_Q8_EPERM_PROBE_LIMITS.md`.

### Q9 — Birefnet-general trong AppImage: RAM guard e2e (nợ đợt 88 §4 mục 2: ĐÓNG MỘT NỬA)
- Phát hiện quan trọng: AppImage K7 đợt 83 (sha 0326dccb…) **KHÔNG chứa code RAM
  guard P7** (guard viết ở đợt 88, sau khi K7 build xong) — test guard e2e trên K7
  nguyên trạng là không thể. Cách đóng nợ đúng: build lại AppImage full từ cây hiện
  tại bằng `scripts/package-ship.mjs`. AppImage K7 giữ nguyên, không đè.
- Build lại (vượt 2 sóng EPERM + 1 sandbox reset 13:21Z): **AppImage mới
  557.008.461 byte, sha256 `9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`**,
  guard trong gói: `grep -c ram_guard` bgremove.py = 7, bgremove.js = 5,
  `DEFAULT_MIN_RAM_MB = 6144`. Vị trí: `~/workspace/tmp-q9-round89-ship/ship-full/`
  (binary — KHÔNG stage vào batch push, đúng luật).
- **E2E lần 2 (13:28–13:31Z): PASS.** AppImage pid 6909; bridge cổng 8787 (34s),
  healthy sau 5.7s. RAM trước job 2170 MB. POST bgremove session=birefnet-general →
  HTTP 200 sau 135.0s; `sessionUsed=u2net`, `fallbackFrom=birefnet-general`,
  `fallbackReason="RAM guard: RAM khả dụng 2038 MB < ngưỡng 6144 MB…"`. MOV ra
  1.715.896 byte, 960×540, 17/17 frame, ~0.11 fps; frame 7 alpha 59.3% trong suốt.
  Verdict: `BgremoveGuardE2E=PASS guardBlocked=true birefnetRan=false`.
- **Birefnet-general vẫn 0 lần chạy thành công trong gói.** Nửa "1 lần chạy birefnet
  thành công" của nợ đợt 88 §4 mục 2 vẫn mở — cần cửa sổ yên ≥ 6 GB ~7 phút hoặc
  máy nhiều RAM. Nửa "test e2e guard qua bridge thật trong AppImage" **ĐÃ ĐÓNG**.
- Nợ mở: smoke/orphan trong gói mới chưa xong (restart giết giữa bước smoke);
  click-test gói thật trên AppImage mới chưa chạy.
- Chi tiết: `docs/PHASE9_ROUND89_Q9_BIREFNET_APPIMAGE_LIMITS.md`.

## 2. Kiểm chứng parent (cây đã gộp, lượt cron 21:35)

- **Xung đột file chung:** `preview.tsx` bị Q3 (comment :1794) và Q5 (import +
  `SEEK_TIMEOUT_EXTENSIONS` :4331) cùng sửa — kiểm tra trực tiếp: cả 2 thay đổi
  đều có mặt, không xung đột. `render.js` chỉ Q1 sửa (dòng 1703 có mặt).
  Không có file nào khác bị 2 luồng cùng sửa.
- **Verify 21/21 file** trong 9 batch luồng đều tồn tại trên đĩa và đúng nội dung
  đã báo (LIMITS + test + harness + probe + JSON).
- tsc web **0 lỗi**; tsc desktop **0 lỗi**; vite build **PASS** (11.20s).
- Test chạy lại: Q1 **23 pass, 0 fail** (4 assert MAD skip vì baseline /tmp mất sau
  reboot — Q1 đã đo MAD=0.0 với baseline trước reboot); Q5 seek.test **20 passed**
  (chạy bằng tsx; vitest là sai runner cho file tự chạy này); P1 fallback (Q4 re-run)
  **30/30 xanh**.
- Không chạy lại: Q2 test (51/51, ~6 phút render), Q3 O3 full (21/21, đã chạy sau
  reboot), Q4 ext full (105/105), Q6 probe (không đổi production), Q7 (evidence
  only), Q9 e2e (AppImage + job 135s; Q9 đã chạy PASS) — tin LIMITS + log từng luồng.
- **EPERM probe checklist (lượt 21:35):** `status` DEAD/STALE (heartbeat age 11209s,
  last #7 11:37:37Z) → ghi đúng 1 dòng DEAD; `once` probe **#8 ok=2 fail=0**;
  **boot changed 7439870b → 62b088d2 — VM reboot 13:21:06Z** (khớp sandbox reset
  Q6/Q9 ghi nhận). Khoảng mù 11:37–14:44Z là do parent lượt 18:35 chết trong reset,
  không phải loop chết. Loop probe v2 vẫn CHƯA được start lại — quyết định thuộc
  parent/user (không tự tạo cron, không start loop nền trong phiên nền).
- RAM lúc closing: MemAvailable chỉ ~213 MB (VM vừa qua reboot + tải thấp) — các
  lượt đo nặng (birefnet, 4K) không chạy được trong cửa sổ này; không ép.

## 3. Quyết định parent

1. **Motion blur + mask (Q2 §7.1): CHỐT làm ở đợt 90.** Hướng (iii) snapshot theo
   frame video + mask 1 lần sau blend, kèm harness play bắt mốc ổn định hơn + đo lại
   A/B/C play + full click-test mask/track. Đây là lỗi preview thật (vệt tới 145px
   dưới tải), không phải artifact đo.
2. **G1: vẫn MỞ.** Không tự đóng trong phiên nền — bằng chứng Q7 + N5 (đóng một phần
   30fps-tải theo phương án A, 4 điều kiện) để user quyết. Đợt 90 chỉ làm harness
   EPERM/port + đo thêm 60fps/yên, không tự đóng.
3. **WebKit clip D: hướng prefetch blob (Q6 §6.1) làm ở đợt 90**, có validate riêng
   trên production. Không đầu tư thêm vào delay/gate theo thời gian hay
   `load()`/`canplay` (F1/F2/F5 đã chứng minh không ship được).
4. **Trackgeq đóng băng w/h keyframes** là giới hạn đã biết của đường thử nghiệm
   (mode png canonical đã khớp) — giữ nguyên, không sửa.
5. **Preview không có cờ mask-mode** — giữ nguyên theo quyết định Q3 hướng (b).
6. **Cron riêng 10 phút cho probe EPERM: KHÔNG tự tạo** — chờ user quyết (đã đề xuất
   từ đợt 88, vẫn chờ).

## 4. Nợ mở cho đợt 90 (12 mục)

1. **Motion blur + mask preview** — sửa theo Q2 §7.1 (iii) + đo lại A/B/C play + full click-test (Q2 §11 mục 1–2).
2. **Playhead chạy trước canvas lúc phát sau seek** (Q5 §6 mục 1) + `seeked` ≠ đã vẽ (mục 2) — sửa vòng lặp phát: không tăng playhead khi đang seeking, hoặc vẽ khung giữ chỗ.
3. **WebKit clip D: prefetch blob cho clip proxy/HTTP nhỏ** (Q6 §6.1) — ngưỡng ≤8–16 MB cần đo, kèm revoke + fallback; validate riêng trên production. Câu hỏi mở Q6 §6.4 (playbin chỉ preroll khi play thật? `buffered.end(0) >= duration` có tương quan pass?) — phân tích hậu nghiệm từ JSON đã có, không cần chạy lại.
4. **Fallback warn cấp site cho keyframes** (Q4 quan sát 1) — nhánh keyframes fallback thiếu warn site, nhánh tracked đã có.
5. **AppImage mới (Q9, sha 9680cef1…)**: smoke/orphan trong gói mới + click-test gói thật chưa chạy (Q9 §6).
6. **G1**: harness EPERM/port diagnosis (Q7 §7 mục 4) + đo thêm 60fps (cần ≥2 PASS liên tiếp để lên 8/10) + đo yên (hiện n=4); quyết định đóng/mở thuộc user.
7. **Birefnet-general 1 lần chạy thành công trong gói** — vẫn 0 lần; cần cửa sổ yên ≥ 6 GB ~7 phút hoặc máy nhiều RAM (Q9 §6). Không ép chạy khi RAM không đủ.
8. **EPERM probe**: loop v2 chết do reboot 13:21:06Z; cần quyết cron riêng 10 phút (chờ user). Sóng EPERM + Chrome SIGTRAP vẫn chưa có nguyên nhân gốc (Q2 §11 mục 3).
9. **TTS 39: CẤM kiểm lại** (nợ cũ, giữ nguyên — không đụng).
10. **ci-security 403** — workflow file vẫn chưa lên được GitHub; chờ user (kiểm tra quyền Workflows / gỡ-cài lại App / tự thêm qua web).
11. **Harness O8 / Q5**: nhãn kỳ vọng S7 lẫn hệ tọa độ (Q5 §6 mục 4, mỹ phẩm); test timing Q5 có thể flake dưới tải cực nặng (mục 5); số đo seek chỉ cho clip GOP 250 (mục 7).
12. **Môi trường**: dep WebKit mất sau mỗi reboot (dùng đường vòng `dpkg-deb -x` + `cp -an`, đừng `dpkg -i`); Xvfb cần retry chặt sau mỗi reboot; trạng thái quan trọng chỉ để trong ~/workspace, không để /tmp hay /usr (sandbox reset 13:21Z đã chứng minh).

## 5. Batch đã stage (KHÔNG push)

- Đợt 89: 9 luồng, **27 entry / 9 file** (Q1 3, Q2 3, Q3 4, Q4 3, Q5 7, Q6 3, Q7 1, Q8 1, Q9 2).
- Closing đợt 89: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §18).
- **Tổng chờ push sau đợt 89: 1984 entry / 232 file batch / 1199 file duy nhất**
  (đợt 67–88: 1955/222/1177; đợt 89: 29/10 — đếm lại trực tiếp từ đĩa).
  HEAD vẫn 5f548ef8. KHÔNG push.
- AppImage mới Q9 (557.008.461 byte, sha 9680cef1…) là binary trong
  `~/workspace/tmp-q9-round89-ship/ship-full/` — KHÔNG đưa vào batch push.
