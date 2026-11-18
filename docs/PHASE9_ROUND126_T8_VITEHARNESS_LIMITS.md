# Đợt 126 T8 — Vite harness: chạy 84l10/85m4/86n2 nhánh webkit + kiểm mirror (3/3 exit 0)

Ngày: 17/11/2026 (lượt cron 06:35 +07; làm 23:40–23:57Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chạy lại 3 harness webkit + fixture khôi phục + kiểm mirror + tsc/vite build + LIMITS này. KHÔNG sửa production (`preview.tsx` `03bf029f…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` — khớp đúng số đợt 124/125, không động trước/sau), KHÔNG sửa harness nào (không cần — cả 3 pass ngay lần đầu), KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet.
Nợ: docs/PHASE9_ROUND125_T8_VITEHARNESS_LIMITS.md §9 mục 2 (chạy 84l10/85m4/86n2 nhánh webkit). Quyết parent đợt 125 §12(d): 25 file config mặc định KHÔNG CẦN LÀM GÌ — không làm.

## 0. Boot giữa đợt — reboot #71

Lượt này mở trên boot **#71** (boot_id `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`, btime 23:25:41Z 16/11; `stat /proc/1` 23:25:52Z — chênh 11 s, cùng mẫu chênh các boot trước). Reboot xảy ra giữa đợt 125 đóng (21:48Z) và lượt này. `/tmp` bị xóa theo reboot như mọi lần — toàn bộ fixture `/tmp` đợt 125 mất, phải tạo lại (xem §1). Không mất file trên đĩa bền (`/home/hatch`). RAM khả dụng lúc mở ~1.443 MB, lúc chạy webkit 1.742–2.523 MB — dưới guard 6 GB, birefnet không thử (đúng luật).

## 1. Kết luận ngắn

- **84l10/85m4/86n2 nhánh WEBKIT — 3/3 exit 0, KHÔNG FAIL (nợ đợt 125 §9 mục 2 — ĐÃ ĐÓNG):** chạy dưới Xvfb mới `:196` + `GST_PLUGIN_PATH` + `GST_PLUGIN_SYSTEM_PATH` = `/usr/lib/x86_64-linux-gnu/gstreamer-1.0`, mỗi harness acquire lock v2 riêng rồi nhả ngay (run-attempt). 84l10: W1×3 PASS + W2 PASS + E4 PASS (76 s giữ lock). 85m4: P1–P5 PASS (140 s). 86n2: P1–P5 PASS + P6 KHÔNG-KẸT (250 s). Không gặp lại vụ kẹt W2 trên display cũ như đợt 125 (§4.2 lần 3) — display mới `:196` chạy sạch cả 3.
- **Fixture `/tmp` tạo lại — md5 khớp đợt 125 (cả 4 file, đúng 8 ký tự đầu trong doc đợt 125):** hevc-a `ba0c7c62…`, i7-clip `f05daed8…`, h-30s `fbaa3d1a…`, g-4s `a1fb8549…`; m4/n2 là copy byte-identical của h-30s. Blend media bền qua reboot: `blend-tp-ocean-a50.mp4` 881.516 B (md5 `f1e277f0…`), `blend-tp-slov-a085.mp4` md5 `f4c35a6a…` — khớp số đợt 125.
- **Mirror còn nguyên sau reboot #71:** 25/25 file mirror L8 đợt 122 khớp `md5_after` trong `round122-t8/edit-log.json`, 0 đổi 0 mất. **Kiểm kê toàn repo: 237 file ứng viên, 0 mới, 0 mất** (giống hệt đợt 124); **201/201 harness vite dev đã phủ mirror** (199 tự ghi + 2 thừa hưởng 65r8/82j3; `has_ignored`=200 gồm 199 harness + 1 file config `vite.n3.config.mjs`). Chỉ 2 file đổi size so với đợt 124 — 68v2 (30.551 → 31.685 B) và 82j3 (7.736 → 8.146 B) — cả hai đều là sửa đợt 125 đã biết, md5 khớp số đợt 125 (`12b9b7a2…`, `edb86968…`).
- **tsc-web exit 0** (51,2 s), **vite build exit 0** (built 9,27 s) sau mọi việc.

## 2. Fixture tạo lại sau reboot #71

Script: `hidden_files/round126-t8/rebuild-fixtures-126t8.sh` (log `smoke/rebuild-fixtures.log`). Lệnh ffmpeg đúng spec các doc gốc (D8 §2.2, I7 §8, L10 §1), ffmpeg 8.1.2 xác định nên md5 khớp đợt 125:

| File | Lệnh | md5 (đợt 126) | Khớp đợt 125 |
|---|---|---|---|
| `/tmp/round76-d8/hevc-a.mp4` | testsrc2 1920×1080 2 s libx265 + sine 440 Hz AAC, `-movflags +faststart` | `ba0c7c623901a9a7b428ea664f1fff53` | ✅ `ba0c7c62…` |
| `/tmp/round81-i7/i7-clip-10s.mp4` | testsrc2 640×360 10 s libx264 | `f05daed87b2eb12bc15c9dbf0835e931` | ✅ `f05daed8…` |
| `/tmp/l10/clips/h_h264_320x180_30s.mp4` | testsrc2 320×180 30 s libx264 | `fbaa3d1a5b32301c78a07221315382c0` | ✅ `fbaa3d1a…` |
| `/tmp/l10/clips/g_h264_320x180_4s.mp4` | testsrc2 320×180 4 s libx264 | `a1fb8549165c526cf89b69e6cdcfeba3` | ✅ `a1fb8549…` |
| `/tmp/m4/clips/…`, `/tmp/n2/clips/…` | copy byte-identical h-30s | `fbaa3d1a…` cả hai | ✅ |

ffprobe xác nhận đúng spec (hevc 1920×1080 2,0 s + aac; h264 640×360 10,0 s; h264 320×180 30,0 s / 4,0 s). **KHÔNG stage binary:** các clip `/tmp` mất sau reboot — tạo lại bằng script đã ghi; blend media trong `hidden_files/*/media/` không stage (ngoài repo).

Lưu ý: doc đợt 125 chỉ ghi 8 ký tự đầu md5 nên phép khớp ở đây là khớp 8 ký tự — đủ để khẳng định cùng lệnh encode xác định, không phải khớp md5 đầy đủ (không có số đầy đủ để đối chiếu).

## 3. Chạy 84l10/85m4/86n2 nhánh webkit — 3/3 exit 0

Driver: `hidden_files/round126-t8/run-webkit-126t8.sh` (tổng hợp `smoke/run-webkit-summary.txt`, log từng harness `smoke/run-webkit-<tag>.log`, scratch riêng `round126-t8/<tag>-scratch/`).

Điều kiện chạy (đúng bài học đợt 125 §4.2):
- Xvfb **mới `:196`** tự dựng (pid 15152, kill khi xong qua trap; không dùng lại `:194`/`:195` đợt trước).
- `GST_PLUGIN_PATH` + `GST_PLUGIN_SYSTEM_PATH` = `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` trong env driver. 84l10/85m4 không tự set GST (launch kế thừa `process.env`); 86n2 đã tự set `GST_PLUGIN_SYSTEM_PATH` trong source (đợt 86) — env driver bổ sung thêm `GST_PLUGIN_PATH`, không xung đột.
- **Lock:** kiểm tra `status` TRỐNG + 0 ticket + không vite nào chạy lúc 23:47:54Z (T1-round126 vừa nhả 23:46:43Z sau 53 s giữ) rồi mới chạy; mỗi harness acquire lock v2 riêng (`t8-round126`, timeout 900 s) và nhả ngay sau khi xong (run-attempt, cooldown 15 s giữa các lần giữ — log lock ghi đủ 3 ticket + 3 release).

| Harness | Lock giữ | Thời gian | Kết quả |
|---|---|---|---|
| 84l10 `clicktest-84l10-webkit-loop-w1.mjs` (L10_ENGINE=webkit) | 76 s | 23:48:03–23:49:19Z | **exit 0, KHÔNG FAIL** — W1-lần1/2/3 PASS (restartEndedVideo 0→1→2→3, hạ-cánh-về-target=true, errors=0), W2 PASS (playhead cuối=30, restart tự nhiên Δ=0), E4 PASS (tới cuối, ct cuối=4, ended=true) |
| 85m4 `clicktest-85m4-webkit-w7.mjs` (M4_ENGINE=webkit) | 140 s | 23:49:35–23:51:55Z | **exit 0, KHÔNG FAIL** — P1 PASS, P2 PASS (reset xong 800 ms), P3 PASS (0 restart), P4-lần1/2/3 PASS (delta=+1, errors=0), P5 PASS (không restart dư trong 40 s sau reset; seek kẹt dài nhất 0 mẫu) |
| 86n2 `clicktest-86n2-webkit-w7.mjs` (N2_ENGINE=webkit) | 250 s | 23:52:10–23:56:20Z | **exit 0, KHÔNG FAIL** — P1 PASS, P2 PASS (reset xong 703 ms), P3 PASS (0 restart), P4-lần1/2/3 PASS (delta=+1, errors=0; lần2 element đồng bộ sau 16,1 s — chậm nhưng vẫn PASS), P5 PASS (seek kẹt dài nhất 0 mẫu), P6 KHÔNG-KẸT (phát thường suốt 90 s chờ, 0 restart) |

Không process mồ côi sau đo (0 vite/chrome/MiniBrowser/Xvfb của T8; Xvfb `:196` đã kill; lock TRỐNG, 0 ticket). Không gặp crash "Target crashed" (đợt 125 gặp 2/2 khi thiếu GST env) và không gặp kẹt W2 (đợt 125 gặp 1 lần trên `:195`) — cả hai đều không tái hiện với GST env + display mới.

## 4. Kiểm mirror L8 + kiểm kê phủ mirror (sau reboot #71)

- **25/25 khớp:** script kiểm md5 đối chiếu `md5_after` trong `round122-t8/edit-log.json` (log `round126-t8/mirror-verify.log`): 25/25 OK, 0 đổi, 0 mất (boot #71).
- **Kiểm kê** (`round126-t8/inventory126.py`, bản sao y `inventory124.py` đổi đường dẫn ra; `inventory126.txt` + `inventory.json`): **237 file ứng viên, 0 mới, 0 mất** so với đợt 124. `has_ignored`=200 (199 harness trong `scripts/` + 1 file config `apps/web/vite.n3.config.mjs`). Hai file thừa hưởng vẫn có mặt, không `has_ignored` (đúng thiết kế): `measure-65r8-perf-overlay.mjs`, `probe-82j3-sample-load.mjs`. **Tổng phủ mirror vite dev = 199 tự ghi + 2 thừa hưởng = 201/201** — giống hệt đợt 123–125.
- Chỉ 2 hàng đổi so với kiểm kê đợt 124 (đều đã biết từ đợt 125): 68v2 30.551 → 31.685 B (sửa TMPDIR + selector hint, md5 `12b9b7a2…` khớp đợt 125), 82j3 7.736 → 8.146 B (thêm check config, md5 `edb86968…` khớp đợt 125). 57n9 khớp md5 đợt 123 (`4a2694a7…`).
- 25 file config mặc định: **KHÔNG LÀM GÌ** theo quyết parent đợt 125 §12(d) (nợ đã cũ, đã mirror đợt 122, verify còn nguyên đợt 124 — và đợt này verify lại 25/25).

## 5. Kiểm chứng sau mọi việc

- `node --check`: không sửa file code nào trong đợt này nên không cần chạy lại (68v2/82j3 đã `node --check` PASS ở đợt 125, md5 khớp).
- `npx tsc --noEmit` (apps/web): **exit 0** (51,2 s; `tsc-web.log`).
- `npx vite build` (apps/web): **exit 0**, built 9,27 s (`vite-build.log`).
- Production không động: `preview.tsx` `03bf029f…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` — khớp số đợt 124/125, kiểm trước và sau khi chạy webkit.
- Không kiểm lại TTS 39; không thử birefnet (RAM khả dụng 1,4–2,5 GB < guard 6 GB); không tự cài apt; không push.

## 6. Giới hạn — đọc trước khi trích số

1. **3/3 exit 0 là nhánh webkit** (84l10/85m4/86n2). Nhánh chromium của 3 harness này đã pass đợt 125; đợt này không chạy lại chromium.
2. **Fixture `/tmp` không sống qua reboot** — mọi clip `/tmp` trong §2 phải tạo lại sau mỗi reboot bằng đúng script đã ghi; md5 khớp đợt 125 chỉ ở mức 8 ký tự đầu (doc đợt 125 không lưu đủ md5).
3. **86n2 P4-lần2 đồng bộ chậm (16,1 s)** nhưng vẫn PASS — ghi nhận là quan sát, không phải fail; dưới tải vòng lặp 9 luồng song song, độ trễ đồng bộ element là biến số.
4. Số đo chỉ đúng trên VM này trong giờ vòng lặp 9 luồng song song (load là biến số lớn nhất); T1-round126 đo ngay trước lượt webkit này (nhả lock 23:46:43Z), T2/T9 có thể đo sau — không chạy chồng lock nhờ acquire/release từng harness.
5. `probe-82j3-sample-load.mjs` vẫn exit 0 ngay cả khi probe lỗi (catch-all không set exit code) — hành vi có từ trước, không sửa trong đợt này (nợ đợt 125 §9 mục 5, vẫn mở).

## 7. Nợ cho đợt sau

1. **ĐÃ ĐÓNG đợt này:** 84l10/85m4/86n2 nhánh webkit (nợ đợt 125 §9 mục 2). Không còn harness nào trong nhóm 7 EXIT:2 đợt 121 chưa chạy đủ cả hai nhánh: 76d8/r80h4/r81i4 chỉ có nhánh chromium (theo thiết kế — không có nhánh webkit), 81i7/84l10/85m4/86n2 đã pass cả hai nhánh.
2. **Mở từ trước, vẫn đứng:** G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; 25 file config mặc định không cần làm gì (quyết §12(d) đứng); `probe-82j3` exit code khi lỗi (nợ nhỏ, xem §6 mục 5).
3. **Cân nhắc:** md5 đầy đủ của 4 fixture `/tmp` đợt này đã có trong §2 — đợt sau nên đối chiếu đủ 32 ký tự thay vì 8 ký tự như đợt 125.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round126-t8-viteharness.txt` — **1 file** (LIMITS này), đã verify read-back, 0 binary, **< 37.768 B**. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật). Dữ liệu thô: `hidden_files/round126-t8/` (rebuild-fixtures-126t8.sh, run-webkit-126t8.sh, inventory126.py/.txt/.json, mirror-verify.log, tsc-web.log, vite-build.log, smoke/ 5 log + summary, l10/m4/n2-scratch với report JSON + screenshot).
