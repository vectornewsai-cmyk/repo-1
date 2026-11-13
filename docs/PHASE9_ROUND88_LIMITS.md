# Phase 9 — Đợt 88: Mask bám motion track, đóng nốt nợ còn lại (E5 hoàn thiện) + birefnet RAM guard + probe EPERM v2

> Ngày: 2026-11-11. Lượt cron 15:35 +07. 9 luồng P1–P9, tất cả đều về.
> Chủ đề: đóng nốt nợ còn lại của mask bám motion track (LIMITS gộp đợt 87
> §4 mục 7, 8, 9, 10, 11, 13) + 2 nợ kề bên (birefnet RAM guard, probe EPERM
> bền hơn). KHÔNG push. HEAD vẫn 5f548ef8.

## 1. Kết quả từng luồng

### P1 — Fallback video-mask ép kích hoạt end-to-end (nợ O2 §5.5 mục 2: ĐÃ ĐÓNG)
- Fault injection có kiểm soát (shim `python3` trên PATH riêng của tiến
  trình render con, chỉ fail khi argv chứa `mask_anim.py` / `mask_anim.py` +
  `mask_png.py`); không sửa file thật, không ảnh hưởng luồng song song.
- Render thật 1280×720, 30fps, 4s, track 0.35→0.65:
  - **A — PNG fallback:** ra MP4 sau 5,5s; đủ 2 warn; tâm mask 0.35 ở cả
    3 mốc (tĩnh tại t=0); **MAD = 0.000** so với mask tĩnh cùng hình học.
  - **B — geq fallback:** ra MP4 sau 21,2s; đủ 2 warn; tâm 0.35 mọi mốc;
    **MAD = 0.000** so với mask tĩnh `--mask-mode geq`.
  - **C — hồi quy (không shim):** ra MP4 sau 6,5s, không warn fallback,
    tâm bám track 0.3875 / 0.5 / 0.6125.
- Không sửa code production (fallback 2 tầng hoạt động đúng thiết kế).
  Test mới `test_round88_p1_mask_fallback.js` **30/30**; hồi quy O2 25/25.
- Chi tiết: `docs/PHASE9_ROUND88_P1_MASK_FALLBACK_LIMITS.md`.

### P2 — Dọn pre-pass R2 vẽ PNG thừa cho clip tracked (nợ O2 §5.5 mục 1: ĐÃ ĐÓNG)
- Chỗ thừa: pre-pass R2 (`render.js` ~1685) vẽ 1 PNG tĩnh cho mọi clip có
  mask, nhưng `maskChainForSite` chỉ đọc `ctx.maskPng` ở nhánh mask tĩnh;
  clip tracked mode png chỉ dùng video mask / PNG fallback t=0 / geq t=0.
  Dry-run trước sửa chứng minh PNG R2 chỉ xuất hiện ở log, không có trong
  filter graph.
- Sửa production: 1 dòng `if (clip.track !== undefined) continue;` trong
  vòng lặp R2 (đặt trước `seen.add(key)` để clip tĩnh trùng `maskKey` vẫn
  được vẽ).
- Số đo thật (720p/30fps/4s, track 0.35→0.65): sau sửa **0 PNG thừa**
  (trước: 1 PNG/clip tracked); 1 lần `mask_png.py` 720p tốn 497 ms (máy
  nhẹ) / 806 ms / 2,62–5,79 s (lúc VM tải nặng). Tâm mask tracked
  0.3875 / 0.5 / 0.6125 (sai số <0,0001), giống hệt trước sửa; frame
  trước/sau sửa **MAD = 0.0**; dry-run filter byte-identical (trừ đường
  dẫn tạm/PID). Không đưa số giảm giây cho cả job (nhiễu tải VM lớn hơn
  tín hiệu) — khẳng định được: bớt đúng 1 subprocess `mask_png.py` mỗi
  mask tracked phân biệt, filter không đổi → không thể chậm đi.
- Test mới **18/18** (trước sửa 15/18 — đúng 3 assert PNG thừa fail);
  hồi quy D4 13/13, D3 22/22, O2 25/25.
- Phát hiện thêm (nợ mở, KHÔNG sửa): mask có keyframes (không track)
  **cũng** bị vẽ PNG R2 thừa — sửa bằng cùng 1 dòng điều kiện, để đợt sau.
- Chi tiết: `docs/PHASE9_ROUND88_P2_MASK_PREPASS_LIMITS.md`.

### P3 — Parity keyframes+track preview–render + 5 combo chưa đo pixel (nợ O4: ĐÃ ĐO XONG)
- Harness mới `probe88p3-mask-track-parity.cdp.mjs` (tổng quát hoá harness
  O4). 9 job render thật (png + trackgeq) + 6 case preview qua Chromium
  1254 + vite dev, 3 mốc/case (E: 4 mốc). Toàn bộ bằng pixel thật.
- **(a) Keyframes w/h + track:** preview KHỚP render png (|Δcx| ≤ 0.0005,
  |Δw/h| ≤ 0.003). Render trackgeq đóng băng w/h tĩnh — **lệch đã đo:
  Δw = 0.0992 (~127px @1280)** tại t=0.5/1.5, w50 hằng 510. Nợ đo của O4
  đã đóng; quyết định luật thuộc parent (xem §3 mục 1).
- **(b) Feather 0.2 + track:** tâm khớp (Δ ≤ 0.0004); biên preview
  ~62.5px vs render ~58px (rộng hơn ~4px do intermediate 640px);
  trackgeq == png về feather.
- **(c) SR + track:** scale khớp (Δcx ≤ 0.0004, Δw/h ≤ 0.002); rotation
  khớp (Δcx ≤ 0.0003, Δcy ≤ 0.0009) theo mô hình xoay không gian pixel
  quanh tâm khung.
- **(d) Motion blur + track — LỆCH THẬT:** preview (đang phát) vệt mask
  về sau **~12–16px @1280** (tâm −0.0092, w50 +6–14px, biên phải 17–25px
  thay vì 0.8px — khớp mô hình ghost 3 frame); render **MAD 0.0** so với
  không-blur (tmix áp trước mask, nguồn trơn → vô hình). Không sửa
  production (không có sửa an toàn hiển nhiên); 3 hướng xử lý cho parent
  trong LIMITS P3 §4 (xem §3 mục 2).
- **(e) Transition fade + track:** preview KHỚP render png cả trong cửa
  sổ chuyển cảnh (|Δcx| ≤ 0.0005 tại 1.0/2.2/2.5/2.8).
- Kiểm chứng: maskTrackPreview87O4 37 check; maskTrack 22/22;
  maskKeyframes 14/14; previewEngine 14; D4 13/13; D3 22/22; O2 25/25;
  tsc 0; vite build PASS (6.04s).
- Lưu ý: P6 sửa `preview.tsx` giữa lúc P3 đo — số parity trên cây đã có
  P6 nên đồng thời kiểm chứng refactor P6 không đổi hành vi (khớp render
  ≤ 0.0009 mọi case không-blur). Quan sát phụ chưa rõ cơ chế: nền frame
  render trong cửa sổ xfade bị nâng lên luma ~40–63 (preview ~0–13) —
  không ảnh hưởng tâm mask.
- Chưa đo: trackgeq cho SR/motion blur/transition; motion blur với
  footage thật có vân (nguồn trơn làm tmix render vô hình).
- Chi tiết: `docs/PHASE9_ROUND88_P3_MASK_TRACK_PARITY_LIMITS.md`.

### P4 — Trackgeq track 240 điểm + merged / speed-ramp (nợ O3: ĐÃ ĐÓNG HẾT, kèm 1 lỗi thật đã sửa)
- **Lỗi thật (trước đây chưa ai thấy): track dày làm render fail cứng.**
  `buildAxisExpr` sinh chuỗi if lồng tuyến tính sâu = số điểm, vượt giới
  hạn độ sâu parse của ffmpeg (~100). Probe nhị phân: mask-geq fail từ
  **83 điểm**, overlay (D3/sticker) từ **93**, axis trần từ **95**.
  Render thật trước fix: trackgeq 240 điểm exit 2; D3 overlay 100 điểm
  exit 2, output 0 byte. Claim O3 "240 điểm dry-run parse OK" là **sai**
  (dry-run không parse qua ffmpeg).
- **Fix tối thiểu:** cây if cân bằng trong `buildAxisExpr`
  (`server/render/src/tracking.js`, 1 hàm + self-test) — cùng giá trị
  nội suy, độ sâu ~log2(N)+2. Không đụng validator/render.js/mask.js/
  preview.
- Số đo thật (harness mới, **34/34 pass**):
  - **(a) Track 240 điểm, 720p 4s:** 175,5s = 0,68 fps; tâm 352,0/640,0/
    928,1 vs kỳ vọng 352/640/928 (lệch ≤0,1px). Hiệu chuẩn 360p: 2,90 fps,
    tâm đúng 0,0/−0,1px.
  - **(b1) Merged, cả 2 clip mask+track, fade 0,5s:** render 168,6s;
    duration 8s đúng; A-side 351,8/640,0; trong fade hợp 2 mask tâm 919
    (kỳ vọng ~920), rộng 483 (~496); B-side 704,0/512,0 — tất cả đúng.
  - **(b2) Speed-ramp 0,5x→2x:** 113,7s; tâm 351,8/640,0/928,1 — **T là
    thời gian output**, không phải thời gian nguồn.
  - **(b3) Compound (nested):** 108,6s; duration 5s; tâm 351,8/640,1/
    928,0 — flatten giữ nguyên mask+track, track vẫn clip-local.
  - **(b4) Ramp + minterpolate, 360p:** 38,3s; tâm 224,1/319,9/415,9 — đúng.
  - Depth probe: axis/mask-geq/overlay 240 điểm parse OK (trước fix fail).
- Hồi quy: tracking self-test pass; mask self-test pass;
  `test_d3_trackfollow.js` 22/22; `test_q5.js` 25/25. fps đo dưới tải 8+
  luồng đợt 88 chạy song song nên là cận dưới.
- Khuyến nghị: không cần giới hạn số điểm nữa (240 điểm render được
  thật); khuyến nghị O3 "≤20 điểm" hết hiệu lực về đúng/sai. Trackgeq
  vẫn chậm (~0,7–1,1 fps 720p) — **giữ sau cờ, KHÔNG làm mặc định**.
- Nợ mở: harness O3 chưa chạy lại nguyên vẹn; compound có trim/speed ở
  cửa sổ nested chưa test; transition khác fade chưa đo.
- Chi tiết: `docs/PHASE9_ROUND88_P4_TRACKGEQ_LIMITS.md`.

### P5 — Click-test WebKit sau gộp i18n (nợ O8: ĐÃ ĐÓNG)
- **b1/b4 lật PASS ở cả 2 engine.** Verify gộp closing đợt 87 trước khi
  chạy: dict vi/en = 2515/2515 key, 8/8 key O5 đã merge, `r6-i18n-check`
  PASS (đợt 87 báo 12 lỗi — nay 0).
- **Chromium headed: 21/21 pass, 0 fail** (~57s). Số đo y hệt lần 4 đợt
  87: (c) blob (0.4158, 0.5000) sai 0.0000; (a) t=1 x=0.4436 (sai 0.0003),
  t=5 x=0.5560 (sai 0.0001); (a2) x=0.4848; (a3) bóng trùng mask cả 2
  thời điểm; E0 sạch.
- **WebKitGTK 27.2 lần 1: 20/21** — fail duy nhất S5 (a): đo t=5 trả về
  blob y hệt t=1 (0.4031, n=7084, cùng bbox) — khung stale sau seek
  pause, không phải ngữ nghĩa CŨ (CŨ sẽ là 0.4515).
- **WebKit lần 2 (chạy lại để chẩn đoán): 21/21, exit 0** — đúng bước S5
  (a) PASS với số y hệt đợt 87 (0.4031/0.5973). Nhưng S7 t=5 ở lần 2
  cũng bắt khung stale mà vẫn PASS rỗng (harness chỉ kiểm bóng≈mask từng
  thời điểm, không kiểm đã di chuyển) — đã ghi rõ trong LIMITS, không giấu.
- Nguyên nhân: seek stall thoáng qua trên WebKit dưới tải VM cao (apt-get
  update hệ thống PID 814 chạy suốt + 8–10 luồng đợt 88 song song), không
  phải hồi quy — bằng chứng: lần 2 lật PASS, S7 lần 1 đo đúng ở t=5, a2
  PASS cả 2 lần, Chromium 21/21, `seek.ts` đã ghi rõ quirk stale-frame.
  Không sửa code sản phẩm, không sửa harness trong lúc đo.
- Kiểm chứng kèm: tsc 0; vite build pass 9,29s; `mask.js --self-test`
  pass; O4 test 12/12; O5 test 18/18 (bundle CJS — bundle ESM crash do
  react-dom `require("stream")`, là giới hạn cách bundle test).
- Môi trường WebKit: dep hệ thống mất hết sau reboot; `install-deps
  webkit` fail 2 lần do apt lock bị PID 814 (os-intent replay `apt-get
  update`, kẹt mirror >30 phút). Workaround không cần apt/mạng: `dpkg -i`
  96 .deb từ `/var/cache/apt/archives` (closure tính bằng script),
  `dpkg --configure -a` → 0 gói unpacked; probe OK (27.2). Còn thiếu 4
  gói không có trong cache (gstreamer1.0-gl, libdrm-radeon1/nouveau2,
  plugins-ugly) — không cần cho harness này. `GST_PLUGIN_SYSTEM_PATH`
  vẫn bắt buộc. Lưu ý: test lock bằng `flock` báo FREE sai — apt dùng
  lock POSIX `fcntl`, phải test bằng `fcntl.lockf`.
- Nợ mở: harness O8 cần xác nhận seek hoàn tất trước khi đo
  (`measureAtPlayhead` chỉ kiểm canvas ổn định nên khung đóng băng cũng
  cho PASS rỗng như S7 lần 2); product-side xem lại timeout fallback của
  `Seeker` khi seek WebKit chậm dưới tải; nhánh transition chưa click-test
  browser thật; render FFmpeg `--mask-mode trackgeq` chưa đối chiếu
  preview↔render; 4 gói apt WebKit còn thiếu.
- Chi tiết: `docs/PHASE9_ROUND88_P5_WEBKIT_CLICKTEST_LIMITS.md`.

### P6 — Warn validator image+track+mask + refactor preview O4 sang helper O1 (nợ §4 mục 11 + 13: ĐÃ ĐÓNG)
- **(a) Warn validator:** câu cũ "track sẽ bị bỏ qua" sai với clip image
  có mask (render png/trackgeq đã đo ở O2: ảnh đứng yên nhưng mask vẫn
  bám track). Warn mới: *"track không dịch chuyển clip image (ảnh giữ vị
  trí tĩnh), nhưng mask vẫn bám theo track"*. Mã mới `TRACK_IMAGE_MASK`
  (108 → 109 mã validator; template vi/en mới; dict i18n **2515 → 2516**
  key lá). Image+track không mask vẫn warn cũ. Đã đọc TrackPanel/
  MaskPanel — không sửa UI (không có hint nào sai cho image).
- **(b) Refactor preview O4:** `maskedUnitSource` trong `preview.tsx`
  dùng `maskGeometryAtTrack` thay bản inline thứ 3, không đổi hành vi.
  Ngoại lệ duy nhất đã khóa bằng test: track rỗng fallback về hình học
  tĩnh thay vì ép (0.5, 0.5) — khớp render.
- Kiểm chứng: `test_validate_codes.js` **1596 pass, 0 fail** (trước
  1572); test O4 **37/37** (12 gốc + 25 parity; sweep 20 cặp mask×track
  × 10 mốc t, lệch max **0**); O1 maskTrack 22/22; D4 maskKeyframes
  14/14; mask.js self-test pass; O2 render thật **25/25**; O5 UI 18/18;
  previewEngine 14; i18n Orphans 16/16, Audit P7 8/8, ProjectMenu 6/6,
  Modals79G9 9/9, Modals80H7 13/13, Sweep81I9 16/16; tsc web **0 lỗi**;
  vite build pass (33.61s). Probe pixel sau refactor (CDP, chạy 2 lần
  giống hệt): cx project **0.4007 / 0.5007 / 0.6007** @0.5/1.0/1.5s
  (trước: 0.4006/0.5007/0.6007) — vs render png lệch ≤ **0.0003 <
  0.0005**, giữ ngưỡng parity O4.
- **Phát hiện ngoài phạm vi (parent xử lý ở closing — xem §2):**
  1. Regex `TRACK_TRANSITION` stale từ closing đợt 87 — P6 đã sửa
     (closing đổi câu warn nhưng không đồng bộ `validateCodes.js` +
     template, nên warn transition thật rơi về `VALIDATION_DETAIL`; đã
     đồng bộ 4 chỗ + thêm fixture khóa).
  2. **Preview LỆCH render ở combo image+track+mask — chưa sửa ở P6**
     (render làm mask ảnh bám track, preview giữ mask tĩnh vì call site
     image không truyền track). → **closing đã sửa, xem §2.**
  3. 2 test pin dict 2463 (`i18nModals80H7`, `i18nSweep81I9`) đã đỏ sẵn
     từ đợt 84 (dict lên 2489 mà không ai bump; closing đợt 87 không chạy
     2 test này). P6 bump cả hai về 2516, nay xanh lại. Quét toàn repo:
     không còn test nào pin số dict cũ khác.
- Chi tiết: `docs/PHASE9_ROUND88_P6_MASK_WARN_REFACTOR_LIMITS.md`.

### P7 — RAM guard cho birefnet-general trong gói ship (nợ N4: ĐÃ LÀM, birefnet vẫn chưa chạy được lần nào)
- `server/bgremove/bgremove.py`: RAM guard thật, chạy trước khi khởi tạo
  session birefnet (lúc đó mới import rembg/load model 973 MB): đọc
  `MemAvailable` từ `/proc/meminfo`; dưới ngưỡng **6144 MB (6 GB)** thì
  chuyển u2net ngay + log/marker `RAM_GUARD` / `ram_guard_*` /
  `fallback_from=` rõ ràng. Ngưỡng có căn cứ: đỉnh RSS birefnet đã đo
  2,62–3,81 GB + Electron ~1 GB + OS ~0,5 GB + biên ~0,5–1 GB. Có
  `--min-ram-mb`, env `BGREMOVE_MIN_RAM_MB`, `--no-ram-guard`; guard +
  `--no-fallback` thì chặn thẳng, exit rõ, không chạy session nào.
- `server/bridge/src/bgremove.js`: `parseSessionMarkers` đọc marker
  guard; `fallbackReason` riêng cho RAM guard (nêu đúng số MB khả dụng/
  ngưỡng, "không thử birefnet-general"); bridge chỉ spawn 1 lần, không
  retry thừa.
- Chạy thật (venv repo rembg 2.0.87/ort 1.23.2, clip 0,5s = 17 frame):
  guard chặn birefnet ở `avail_mb=1609`, u2net **17/17 frame**, MOV png
  960×540 rgba 0,566667s, wall **101,0s**, đỉnh RSS **1091 MB**, exit 0;
  birefnet không được thử (0 lần "khởi tạo session 'birefnet"). So với
  attempt N4 (152–529s/job gồm thời gian chết + fallback), guard tiết
  kiệm toàn bộ thời gian thử-chết. u2net trực tiếp (hồi quy): 17/17,
  wall 114,0s, RSS 1197 MB; matte **giống hệt** bản guard (frame 0 alpha
  mean 17,6 cả hai). Guard + `--no-fallback`: exit 1 sau **0,4s**, thông
  báo RAM_GUARD rõ, không tạo output, không load model. **Không chạy
  birefnet thật** trong lượt này (đúng chỉ đạo — guard đã chặn).
- Unit: Python ramguard **8/8**, fallback **7/7**, smooth **4/4**; bridge
  ramguard **15/15**, fallback **19/19**; `py_compile` + `node --check` OK.
- Sửa kèm: `test_bgremove_fallback.py` — harness thêm `--no-ram-guard`
  (guard chặn trước `run_once` làm 4/7 test cũ fail lúc đầu; đó là hành vi
  production đúng, không phải lỗi guard — file này test đường retry-sau-
  lỗi, đường guard có test riêng).
- Nợ mở: **birefnet-general vẫn 0 lần chạy thành công trong gói** — guard
  chỉ tránh trải nghiệm "đợi 5 phút rồi chết", không làm nó chạy được;
  vẫn cần cửa sổ yên ≥ 6 GB khả dụng ~7 phút hoặc máy nhiều RAM. Ngưỡng
  6 GB là heuristic: RAM có thể tụt sau lúc kiểm tra nên đường retry sau
  SIGKILL vẫn cần; ngược lại có thể chặn oan trên máy nhẹ tải (user hạ
  được bằng `--min-ram-mb`/env). Chưa test e2e bridge thật trong AppImage
  (chỉ stub + Python thật ngoài app); guard chỉ đọc `/proc/meminfo`
  (Linux), non-Linux thì cho qua + warn.
- Chi tiết: `docs/PHASE9_ROUND88_P7_BIREFNET_RAMGUARD_LIMITS.md`.

### P8 — Cơ chế probe EPERM bền hơn (nợ §4 mục 4: ĐÃ LÀM, cần parent quyết cron riêng)
- Điều tra nguyên nhân probe nền chết **5 lần liên tiếp** (K8 sau #5, L6
  sau #10, M5 sau #11, N8 sau #5, O10 sau #9 — đều không dòng `probe
  end`). Cả 5 lần chết đều **trước** lần reboot kế tiếp 30–120 phút
  (O10: chết 07:13–07:23Z, boot kế 08:24:39Z chắc chắn bằng `uptime -s`),
  nên reboot không phải thủ phạm duy nhất. Giả thuyết mạnh nhất: runtime
  dọn phiên exec giết cả cây tiến trình (setsid+nohup không thoát
  cgroup); độ trễ sau khi agent xong việc thay đổi (N8 ~5', M5 ~50',
  L6/O10 ~70') đúng mẫu GC. Không có systemd user bus
  (`systemctl --user` fail, không XDG_RUNTIME_DIR) nên không làm user
  service; journal/wtmp chỉ giữ 1 boot nên không loại trừ được reboot
  trung gian — thiết kế v2 bền với cả hai.
- Probe v2 — `scripts/probe-eperm-v2.sh` (lệnh `once` / `loop` /
  `status`): observer là chính vòng lặp cron (mỗi lượt chạy `once` +
  `status`), log append-only duy nhất có fsync + verify tăng byte,
  heartbeat nguyên tử (tmp+rename), boot marker phân biệt chết do reboot
  với chết do bị dọn phiên, `status` biến cái chết thành dữ liệu (ghi
  đúng 1 dòng `probe DEAD`, exit 1). Không tự tạo cron riêng (ngoài
  quyền luồng — parent quyết).
- Quét lại writeFileSync toàn repo (~08:47Z): **81 dòng code + 12 dòng
  bản copy release + 54 dòng mẫu docs.** Số 99 trong nhiệm vụ = 81+12+6
  (.sh tính riêng — nhưng 6 dòng .sh đã nằm trong 81 nên 99 đếm trùng;
  cộng thẳng là 93). **Không còn đường ghi production nào chưa nối**;
  async `fs.writeFile(` trong thư mục production: 0 ngoài helper. Quét
  0-byte 24h: không file dữ liệu nào mới.
- Test: scratch T1–T5 **5/5** (once ×2 + status ALIVE; giết loop giữa
  chừng → status DEAD exit 1, đúng 1 dòng DEAD; once sau DEAD hồi phục
  (#5, ALIVE lại); giả boot đổi → ghi marker `boot changed`; ghi log lỗi
  → exit 2). Chạy thật: probe v2 **#1 (08:49:48Z) + #2 (08:49:50Z) + #3
  (08:59:51Z, đúng nhịp 10 phút) — OK 2/2 cả 3**, `status` ALIVE (age
  26s lúc 09:00:16Z). Loop production 16×600s (PID 13674) đang chạy tới
  ~11:29Z. **Đính chính ở closing: loop này đã CHẾT do VM reboot
  (uptime mới từ 09:21:17Z) — `status` lúc 09:41:01Z báo DEAD/STALE
  (heartbeat age 1269s > 900s, probe cuối #5 lúc 09:19:52Z) và ghi đúng
  nguyên nhân vào log: `boot changed d473b560 -> e10b9199 (reboot
  detected)`; `once` ngay sau đó là probe #6 trên boot mới, ok=2 fail=0.
  Đây là lần đầu tiên một cái chết của probe nền có nguyên nhân được ghi
  nhận — thiết kế v2 (boot marker + status biến cái chết thành dữ liệu)
  đã chứng minh tác dụng. Giả thuyết GC của P8 vẫn chưa loại trừ được cho
  4 lần chết trước (không có boot marker lúc đó). Helper chạy lại (không sửa): gốc **22/22**, port CJS **8/8**,
  port desktop **11/11**. Luật K8 5×20s giữ nguyên. Sóng EPERM: KHÔNG gặp
  trong lượt này (3 mẫu) — **KHÔNG tuyên bố hết hẳn**; khoảng mù
  07:13Z–08:49Z không có quan sát.
- Thí nghiệm heartbeat song song: sleeper PID 4007, **20 beat / 19 phút**
  đều đúng giờ, đã kill dọn sạch (chỉ chứng minh sống được TRONG phiên,
  chưa chứng minh sau khi phiên kết thúc).
- **Cần parent quyết:** muốn phủ sóng liên tục giữa các lượt cần cron
  riêng mỗi 10 phút chạy
  `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` — P8 không tự
  tạo scheduled job (xem §3 mục 4). Lượt cron kế (18:35 +07 = 11:35Z)
  chạy `bash scripts/probe-eperm-v2.sh status` + `once` theo checklist
  mới ở LIMITS P8 §2.3 — sẽ thấy loop 13674 ALIVE hoặc DEAD có ghi nhận.
- Chi tiết: `docs/PHASE9_ROUND88_P8_EPERM_PROBE_LIMITS.md`.

### P9 — Kiểm chứng độc lập mask-track + benchmark tổng hợp
- Verify độc lập (harness mới, **61/61 pass**): tâm mask đo bằng pixel
  thật trên render 720p khớp quỹ đạo ở cả 2 đường render — png mặc định
  và trackgeq đều cho **0,275/0,499/0,725** tại t=0,5/2,0/3,5 (kỳ vọng
  0,275/0,5/0,725); T của geq là clip-local (clip.start=1,0 vẫn cho cùng
  tâm); video đứng yên (pixel phân biệt đỏ/xanh); mask vẫn bám track qua
  transitionOut fade ở **cả 2 mode** (0,275/0,499/0,649). Unit + mirror
  CJS==ESM + validator + suite cũ đều xanh (O2 25/25, mask_p4 33/33, d4
  13/13, maskTrack 22/22, maskKeyframes 14/14, mirror 427 pass, tsc
  web+desktop 0, vite build pass 6,23s).
- Hồi quy: render lại spec B1/B2/B3 của O7 cho số đo frame **khớp chính
  xác từng chữ số** với số O7 đã ghi, kích thước output byte giống hệt,
  render 2 lần MAD = 0. Giới hạn trung thực: không so trực tiếp được với
  frame O7 vì /tmp đã mất sau reboot VM.
- Benchmark tổng hợp: tracked render 720p **5,60–6,83 fps** (O7:
  10,87–18,91 — VM tải nặng hơn nhiều, load 12,6→2,0; tỉ lệ trong lượt
  vẫn khớp hướng O7); sinh video mask 0,043–0,078 s/frame 720p; preview
  **tracked 15,48 ≈ static 14,80 fps** (lần 1 tracked 4,29 fps là nhiễu
  thoáng qua, đã chạy lại và báo cả 2 lần).
- Kiểm tra claim P1/P2/P6 (chạy lại test, không sửa code họ) — cả 3 đều
  đúng: P1 fallback **30/30**, P2 pre-pass **18/18**, P6 validate_codes
  **1596/1596** + dict vi=en=**2516** + parity preview **37/37** + warn
  image mới đúng từng chữ. Lưu ý thời điểm: lúc P9 bắt đầu chưa có file
  đợt 88 nào trên đĩa; P1/P2/P6 hạ cánh trong lúc P9 chạy — render P1–P4
  dùng cây đợt 87 đã gộp, P5 + suite D dùng cây sau P2/P6.
- Nợ mở: preview lệch render ở combo image+track+mask (P6 phát hiện,
  chờ parent quyết — **closing đã sửa, xem §2**); fallback chưa ép cho
  D4/image/geq/invert; pre-pass R2 vẫn thừa PNG cho mask keyframes; chưa
  đo 4K/clip dài/track 240 điểm.
- Chi tiết: `docs/PHASE9_ROUND88_P9_MASK_TRACK_VERIFY_LIMITS.md`.

## 2. Gộp parent (closing)

- **Sửa preview lệch render ở combo image+track+mask (P6 phát hiện).**
  Nguyên nhân gốc có 2 lớp: (1) call site image trong `drawImageClip`
  (`preview.tsx:2198`) không truyền `clip.track` cho `maskedUnitSource`
  (video đã truyền từ O4); (2) type `ImageClip` không có field `track`,
  và `normalizeImageClip` làm rơi `track` qua chuẩn hoá (dựng object mới
  chỉ giữ kind/id/src/start/duration/fit/mask) — trong khi render
  (`render.js:931`) + validator đã chấp nhận image+track ở runtime.
  Closing sửa cả 3 chỗ: thêm `track?: TrackAttachment` vào `ImageClip`
  (`image.ts`) + giữ track trong `normalizeImageClip` (cả `.ts` lẫn
  mirror `.js`, cùng mẫu "giữ mask" của Phase 7 P4; điều chỉnh kiểu trả
  về `Required<Omit<ImageClip, "mask" | "track">> & {...}` để `track`
  không bị `Required` ép bắt buộc); truyền `clip.track` ở `drawImageClip`
  + cập nhật comment stale ở `maskedUnitSource` (đã ghi đúng là lệch
  render, nay không còn lệch).
- Kiểm chứng closing bằng pixel thật (harness CDP mới từ O4, ảnh trắng
  1280×720, mask ellipse x0.3/w0.4 + track 0.3→0.7): preview image+track+
  mask cho tâm project **0.4007 / 0.5007 / 0.6007** @0.5/1.0/1.5s — khớp
  đúng số probe video của O4 (0.4006/0.5007/0.6007) và kỳ vọng track
  0.4/0.5/0.6 (lệch ≤0.0007); seed xác nhận clip giữ `track: true` sau
  `replaceProject` (đường chuẩn hoá đã giữ track end-to-end). Media tạm
  `white720-closing.png` đã xoá khỏi `apps/web/public/`, vite dev đã dừng.
- Kiểm chứng parent (cây đã gộp, xem §5): tsc web 0, desktop 0; vite
  build PASS (6,12s); r6-i18n-check PASS; validateCodes 1596/1596;
  css60 59/59; css61 60/60; i18nOrphans 16/16; mirror 427 pass, 6 known,
  0 fail; O4 test 37/37; P1 test 30/30; P2 test 18/18; P4 test 34/34;
  P7 bridge ramguard test 15/15 (chạy lại ở closing trên cây đã gộp).
- Không batch nào thiếu NUL cuối; 0 file trùng giữa 9 batch luồng; dict
  **2516 key** (P6 +1 key `TRACK_IMAGE_MASK`); không cần bump snapshot
  khác (P6 đã bump 2 test pin dict về 2516).
- Xung đột file chung: `preview.tsx` (P6 refactor + P3 đo trên cây đã có
  P6 + closing sửa call site image — 3 lớp chồng nhau nhưng không xung
  đột nội dung, parity giữ nguyên qua cả 3); `render.js` chỉ P2 sửa;
  `tracking.js` chỉ P4 sửa; `bgremove.py`/`bgremove.js` chỉ P7 sửa.
  Không file nào bị 2 luồng sửa chồng chéo nội dung.

## 3. Quyết định parent

1. **Luật keyframes+track cho trackgeq (P3 (a)):** trackgeq đóng băng w/h
   tĩnh (lệch Δw = 0.0992 đã đo) — giữ nguyên hành vi, ghi là **giới hạn
   đã biết của đường thử nghiệm trackgeq** (sau cờ `--mask-mode
   trackgeq`). Mode mặc định png là canonical và đã khớp (cùng helper
   O1). Không sửa trackgeq để ép khớp keyframes — đường này đã chậm
   (~0,7 fps) và chỉ là fallback/thử nghiệm.
2. **Lệch motion blur + mask (P3 (d)):** preview (đang phát) vệt mask
   ~12–16px, render MAD 0.0 (tmix áp trước mask, nguồn trơn → vô hình).
   Giữ nguyên cả hai phía trong đợt này (không có sửa an toàn hiển nhiên);
   ghi là nợ mở cho đợt 89: đo lại với footage thật có vân để xem render
   có vệt thật không, rồi mới quyết hướng xử lý (3 hướng trong LIMITS P3
   §4).
3. **Pre-pass R2 thừa PNG cho mask keyframes (P2 phát hiện):** để đợt 89
   (sửa bằng cùng 1 dòng điều kiện như P2, cần test riêng).
4. **Cron riêng mỗi 10 phút cho probe EPERM v2 (P8 đề xuất):** parent
   KHÔNG tự tạo scheduled job trong phiên nền (tạo lịch là thay đổi trạng
   thái bền vững, cần user quyết). Đề xuất để user quyết ở main chat.
   Tạm thời: mỗi lượt cron vòng lặp chạy `status` + `once` theo checklist
   P8 §2.3 (lượt kế 18:35 +07 kiểm tra loop 13674).
5. **G1, birefnet, WebKit clip D:** giữ nguyên trạng thái từ đợt 87 —
   G1 vẫn chờ parent/user quyết; birefnet nay có RAM guard (tránh đợi-
   chết) nhưng vẫn 0 lần chạy thành công trong gói; WebKit clip D chưa
   có fix mới trong đợt này.

## 4. Nợ mở cho đợt 89

1. G1 đóng hay chưa — parent/user quyết (N5: pool30 n=24 median 0,845
   PASS 19/24; N10: 60fps 6/8).
2. Birefnet-general trong gói: RAM guard đã có (P7) — vẫn cần cửa sổ yên
   ≥ 6 GB khả dụng ~7 phút hoặc máy nhiều RAM để có 1 lần chạy thành công
   đầu tiên; chưa test e2e bridge thật trong AppImage.
3. WebKit clip D loop (N1: race preroll GStreamer vs HTTP progressive;
   watchdog seek-cứu thất bại 0/5; fix chưa thử).
4. EPERM: probe v2 đã có (P8) — cần quyết cron riêng 10 phút (xem §3
   mục 4); khoảng mù 07:13Z–08:49Z không có quan sát.
5. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
6. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web
   GitHub hoặc cấp quyền workflows cho App).
7. Pre-pass R2 thừa PNG cho mask keyframes (P2) — sửa 1 dòng, để đợt 89.
8. Motion blur + mask lệch preview–render (P3 (d)) — đo lại với footage
   thật có vân trước khi quyết hướng xử lý.
9. Trackgeq: harness O3 chưa chạy lại nguyên vẹn; compound có trim/speed
   ở cửa sổ nested chưa test; transition khác fade chưa đo; chưa nối
   preview web.
10. Fallback video-mask chưa ép cho D4/image/geq/invert (P1); chưa đo
    4K/clip dài/track 240 điểm (P9).
11. Harness O8 cần xác nhận seek hoàn tất trước khi đo (khung stale cho
    PASS rỗng như S7 lần 2 của P5); xem lại timeout fallback của `Seeker`
    khi seek WebKit chậm dưới tải.
12. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

## 5. Kiểm chứng parent (cây đã gộp)

- tsc web 0, desktop 0; vite build PASS (6,12s); r6-i18n-check PASS;
  validateCodes 1596/1596; css60 59/59; css61 60/60; i18nOrphans 16/16;
  mirror 427 pass, 6 known, 0 fail; O4 test 37/37; P1 test 30/30;
  probe pixel closing image+track+mask 0.4007/0.5007/0.6007 (khớp render).
- P2 test **18/18**, P4 test **34/34**, P7 bridge ramguard test **15/15**
  (chạy lại ở closing trên cây đã gộp); probe pixel closing
  image+track+mask 0.4007/0.5007/0.6007 (khớp render).

## 6. Batch đã stage (KHÔNG push)

Đợt 88: 10 file — 9 luồng (55 entry) + closing 6 entry (LIMITS gộp + gap
analysis + preview.tsx + image.ts + image.js + harness probe closing).

**Tổng chờ push sau đợt 88: 1955 entry / 222 file batch / 1177 file duy
nhất** (đợt 67: 68/9; 68: 57/9; 69: 33/9; 70: 21/10; 71: 42/10; 72: 53/10;
73: 56/10; 74: 85/10; 75: 58/9; 76: 67/10; 77: 40/10; 78: 48/11; 79: 55/10;
80: 123/11; 81: 63/11; 82: 58/9; 83: 44/10; 84: 82/11; 85: 167/11; 86:
585/11; 87: 89/11; 88: 61/10). Đếm lại trực tiếp từ đĩa theo từng đợt
(bài học đợt 86/87: không cộng dồn số cũ). HEAD vẫn 5f548ef8. KHÔNG push.
