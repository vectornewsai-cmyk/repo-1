# Phase 9 đợt 38, luồng U4 — Snapshot CDP: kích hoạt live nhánh INVALID (mobile/check-proxy) + bench hang-probe H2 + hiệu chuẩn lại ngưỡng CPU + verify backup đợt 36 — LIMITS

Ngày: 2026-11-02 (lượt cron 20:03 Asia/Saigon; các lượt chạy
20:08–20:17 +07). KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi
qua GitHub connector, KHÔNG tag/release, KHÔNG binary vào repo,
KHÔNG sửa file của luồng khác, KHÔNG sửa file paths-loop hay
build-loop-log (parent gộp batch), KHÔNG gửi dữ liệu ra ngoài
máy (backup chỉ verify tại chỗ, xem §5).

Nguồn: `docs/PHASE9_ROUND37_LIMITS.md` §3.6,
`docs/PHASE9_ROUND37_T4_SNAPSHOT_LIMITS.md` §4,
`docs/PHASE9_ROUND35_R5_REAL_HANG_SNAPSHOT_LIMITS.md`.
Dist gắn với mọi bằng chứng trong file này: bundle
`index-BNjMwXhb.js` sha256[:16] `0169bac961fdef10`, manifest
`7b800a66b068e1605a3a19c870519500d3fe8e5f5e3ae3dcd4a26acbfc42e151`,
254 file — khác dist đợt 37 (DAS3nyo_) vì dist đã được build lại
trước lượt U4. LƯU Ý QUAN TRỌNG (xem §6): ngay sau lượt
check-proxy của U4 (20:17:38 +07), một luồng khác đã build lại
dist thật (bundle mới `index-BgjA4izV.js`, còn 251 file) — mọi
số U4 gắn với dist BNjMwXhb/manifest 7b800a66…, không gắn với
dist hiện tại trên đĩa; lượt sau muốn dùng lại bằng chứng dạng
này phải đo lại trên dist mới.

## 0. Kết luận ngắn (không vượt số đo)

1. **Nhánh INVALID của mobile ĐÃ KÍCH HOẠT LIVE (a):** trên dist
   scratch (copy của dist thật, manifest khớp trước khi chạy),
   tamper thêm 1 file giữa lượt → `frozenDist INVALID`
   (254 → 255 file, manifest trước ≠ sau), dòng
   `FROZEN INVALID: dist đổi giữa chừng — kết quả bị loại`,
   exit 1 (xác nhận bằng wrapper, xem §2a). Không sửa code
   mobile — nhánh này đã có sẵn từ đợt 37 T4, chỉ thiếu lần
   kích hoạt live.
2. **Nhánh INVALID của check-proxy ĐÃ KÍCH HOẠT LIVE (a):**
   trên cây scratch (copy apps/web + server/bridge +
   server/render, symlink node_modules), chế độ
   `--preview-dist`, tamper thêm 1 file giữa lượt → verdict
   vốn là `PROXY 720p OK` bị loại, `frozenDist INVALID`
   (254 → 255 file), dòng `FROZEN INVALID … verdict bị loại,
   exit 3`, exit 3. Không sửa code check-proxy.
3. **Bench hang-probe qua H2 ĐÃ CHỨNG MINH LIVE (b):** cờ mới
   `--cdp-hang-probe-h2` gửi `while(true){}` qua chính
   `Cdp.send()` của bench, timeout 5000 ms → wall 5274 ms,
   đúng 1 snapshot mới, snapshot ghi bundle captured
   (`index-BNjMwXhb.js`, sha `0169bac961fdef10`), pid
   snapshot = pid Chrome của bench (4500), frozenDist VALID,
   exit 0. Snapshot H2 này KHÔNG xóa — bằng chứng bền.
4. **Hiệu chuẩn ngưỡng CPU LẶP 3 VÒNG (c): tầng CDP phân biệt
   3/3** (H1 5,7 / 0,7 / 0,0% vs H2 102,0 / 95,9 / 87,3%,
   chênh min 81,6 điểm); **nhưng tầng Node trượt 1 vòng**
   (busy 41,4% < ngưỡng 50 ở vòng 1; các vòng sau 55,0 /
   58,9%) nên theo tiêu chí ghi trước, probe allPass=false,
   exit 1. **QUYẾT ĐỊNH: GIỮ NGƯỠNG CŨ, CHƯA ĐỦ ĐỂ LÀM CỔNG
   TỰ ĐỘNG** — sampler đã chứng minh là nhạy tải (busy-loop
   cũng chỉ đo được 41,4% dưới tải song song), nên cổng tự
   động vẫn cần phiên quiet có điều phối trước khi khóa.
   ps lifetime-average lại không phân biệt (H1 max 15,9 /
   9,8 / 7,0 vs H2 16,1 / 16,2 / 16,0) — tái xác nhận S6/T4.
5. **Backup đợt 36 CÒN NGUYÊN VẸN (d):** `--verify` trên
   `.../hidden_files/cdp-hang-snapshots-backup/20261102-012334/`
   trả OK, 6 file khớp manifest, exit 0. Backup vẫn CHƯA RA
   KHỎI MÁY (cùng đĩa VM, chỉ chống dọn/xóa) — U4 không
   upload đi đâu, vì không có lệnh và không có đích ngoài
   nào được cấp.

## 1. Phần mới của U4 (chỉ 1 cờ bench + 1 probe + LIMITS + JSON)

### (a) Cờ bench H2 — `bench-preview-fps.mjs` (SỬA, không đụng logic cũ)

- `--cdp-hang-probe-h2` (hoặc `BENCH_CDP_HANG_PROBE_H2=1`):
  bật probe như cờ H1 cũ, nhưng expression là
  `while(true){}` với `awaitPromise: false` (đúng mẫu probe
  T4), mode ghi `controlled-hang-H2-busy-loop`, thêm trường
  `expression` vào `result.hangProbe` để đối chiếu.
- Sau H2 renderer kẹt nên bench DỪNG ngay như H1 (không đo
  tiếp); khối finally kill Chrome như thường lệ. Hành vi
  bench thường và cờ H1 cũ không đổi một chữ (chỉ thêm
  nhánh chọn expression/mode).

### (b) Probe hiệu chuẩn lặp — `clicktest-u4-round38-cpu-calibration-probe.mjs` (MỚI)

- Tầng Node: 3 vòng, mỗi vòng spawn đồng thời busy-loop +
  idle, mẫu cây tiến trình 2000 ms mỗi đứa (mẫu T4).
- Tầng CDP: 3 vòng H1 trên cùng 1 Chrome (renderer vẫn rảnh
  sau H1, kiểm tra `1+1` → 2 sau mỗi vòng) + 3 vòng H2, mỗi
  vòng 1 Chrome mới (sau H2 renderer kẹt, không dùng lại).
  Mỗi vòng treo: gửi lệnh, chờ +500 ms, mẫu /proc 3000 ms,
  kết thúc trước timeout 5000 ms — đúng cửa sổ của T4.
- Tiêu chí GHI TRƯỚC (giữ ngưỡng T4, không sửa sau khi thấy
  số): mọi vòng H2 > 50, mọi vòng H1 < 20, và
  (min H2 − max H1) > 30. Chỉ đề xuất ngưỡng mới/cổng tự
  động khi TẤT CẢ các vòng đạt; nếu không, giữ ngưỡng cũ.
  ps lifetime chỉ ghi số, không làm check.
- Snapshot probe ghi vào thư mục bền riêng
  `u4-round38-cpu-calibration-probe`, rồi XÓA đúng các file
  probe tự tạo — thư mục trở lại baseline 0 file (đã kiểm
  tra). Snapshot của bench (§3) thì KHÔNG xóa.

## 2. Kích hoạt live nhánh INVALID (mỗi nhánh ghi riêng, không claim chung)

Nguyên tắc cách ly (rút từ lý do T4 chưa làm được việc này):
KHÔNG sửa dist thật giữa lượt, vì dist dùng chung với các
luồng khác. Cả hai nhánh đều chạy trên BẢN SAO dist (manifest
trước khi chạy khớp dist thật: 254 file, `7b800a66…`), tamper
chỉ là thêm 1 file `u4-tamper.txt` vào bản sao — bundle đang
serve không đổi, chỉ manifest lệch. Vì vậy bằng chứng này
chứng minh đúng nhánh INVALID của từng harness, không chứng
minh gì thêm về nội dung đo (touch/proxy) của lượt đó.

### (a) Mobile — `mobile-touch-check.mjs` (KHÔNG SỬA CODE)

- Cách chạy: copy dist → `/tmp/vcut-u4-mobile-dist`, serve
  bằng static server Node tự viết ở `/tmp/u4-serve-dist.mjs`
  cổng 4191 (MIME đúng cho .js module); chạy mobile với
  `PREVIEW_URL=http://127.0.0.1:4191/`,
  `MOBILE_TOUCH_DIST_DIR=/tmp/vcut-u4-mobile-dist`,
  `CDP_PORT` riêng (9239/9240, tránh đụng luồng khác).
- Lần 0 (thua race, ghi để khỏi hiểu nhầm): tamper viết sau
  khi lượt đã đối chiếu xong → frozenDist VALID, exit 1 do
  TRUSTED SCRUB/PINCH FAIL (giống đợt 37). Lần này KHÔNG
  tính là bằng chứng INVALID.
- Lần 1 (INVALID, exit đo sai): tamper 20:12:17 +07 khi pid
  mobile còn sống, lượt kết thúc 20:12:45 +07 → frozenDist
  INVALID (254 → 255 file, manifest sau
  `3a21704d…`), dòng FROZEN INVALID, touch PASS cả 2.
  Exit do runner đo bằng `wait` trên pid nền nên báo 0 sai
  — số này BỊ LOẠI, không dùng.
- Lần 2 (INVALID, exit xác nhận — lấy lần này làm chuẩn):
  tamper 20:13:08 +07 ngay sau dòng `dist đóng băng` →
  frozenDist INVALID (254 → 255 file, manifest sau
  `cd3be4c5…` — khác lần 1 vì nội dung file tamper khác,
  đúng như kỳ vọng), dòng FROZEN INVALID, touch PASS cả 2,
  **exit 1** qua `WRAPPED-EXIT` do wrapper ghi sau khi node
  kết thúc (đáng tin: touch PASS nên failures chỉ còn từ
  FROZEN INVALID).
- Kết quả đầy đủ: `benchmarks/results/v38-u4-mobile-invalid.json`.
- Quan sát phụ (không kết luận nguyên nhân, ngoài phạm vi):
  trên static server scratch, touch PASS cả 2 lần, khác đợt
  37 (FAIL cả 2 trên vite preview 4173). Bằng chứng INVALID
  không phụ thuộc kết quả touch.

### (b) Check-proxy — `check-proxy-auto.mjs` (KHÔNG SỬA CODE)

- Cách chạy: cây scratch `/tmp/u4-checkproxy` gồm apps/web
  copy (trừ node_modules/dist/out, rồi copy dist thật vào),
  server/bridge copy, server/render copy (bridge require
  `../../render/src/proxy` tức `server/render/src/proxy.js`),
  symlink node_modules → node_modules của repo. Chạy bản
  scratch với `CHECK_PROXY_DIST_DIR=<scratch>/apps/web/dist
  --preview-dist --video /tmp/r3-auto-proxy-test.mp4`
  (video ffmpeg testsrc2 1920×1080 30 fps 5 s, tạo lại vì
  file cũ đã mất).
- Tiền điều kiện cổng: lúc chuẩn bị, cổng 8787 bị một bridge
  lạ pid 6314 (PPID 1, chạy từ ~20:13 +07, thuộc luồng khác)
  chiếm — U4 KHÔNG chạy đè lên (bridge của check-proxy sẽ
  dùng nhầm bridge lạ, kết quả nhiễm). Đã chờ tới khi cổng
  trống (20:14:43 +07) mới chạy. Đây là lý do lượt này chạy
  sau lượt mobile.
- Lượt chính: tamper 20:16:21 +07 ngay sau dòng
  `dist đóng băng (preview)` → verdict vốn là
  `PROXY 720p OK` nhưng frozenDist INVALID (254 → 255 file,
  manifest sau `9226a690…`) → dòng
  `FROZEN INVALID: dist đổi giữa chừng — verdict bị loại,
  exit 3`, **exit 3** qua WRAPPED-EXIT. Đây là lần đầu nhánh
  này kích hoạt live với verdict thật bị loại (đợt 37 chỉ có
  VALID live + từ chối dist lệch exit 2).
- Kết quả đầy đủ:
  `benchmarks/results/v38-u4-checkproxy-invalid.json`.

## 3. Bench hang-probe H2 live

- Cách chạy: vite preview cổng 5197 serve dist thật
  (`index-BNjMwXhb.js`), bench với
  `--url http://127.0.0.1:5197 --dist-dir apps/web/dist
  --cdp-hang-probe-h2 --out benchmarks/results/v38-u4-bench-hang-probe-h2.json`.
  (Lỗi chạy đầu: dùng nhầm `apps/web/node_modules/.bin/vite`
  không tồn tại — vite bin nằm ở `node_modules/.bin/vite`
  gốc repo; chạy lại đúng đường dẫn thì preview lên 200.)
- Kết quả: **exit 0**, `hangProbe.ok=true`,
  mode `controlled-hang-H2-busy-loop`, expression
  `while(true){}`, wall 5274 ms (timeout đặt 5000 ms; dài
  hơn H1 đợt 37 là 5066 ms — chỉ ghi số, không claim H2
  chậm hơn do bản chất treo), lỗi đúng
  `CDP timeout: Runtime.evaluate`, đúng 1 snapshot mới
  (`cdp-hang-20261102_131008586-Runtime.evaluate-4500.json`,
  còn trên đĩa, đã đọc lại: method Runtime.evaluate,
  timeoutMs 5000, proc pid 4500 = chromePid, bundle captured
  `index-BNjMwXhb.js` sha `0169bac961fdef10` + dist path),
  frozenDist VALID (trước = sau = `7b800a66…`, 254 file).
- Dọn dẹp: preview 5197 đã tắt; thư mục snapshot của bench
  nay có 3 file (2 cũ + 1 H2 mới, giữ lại theo kỷ luật).
  Lưu ý sự cố dọn: một lệnh `pkill -f` với pattern trùng
  chuỗi lệnh của chính shell đã tự kill shell đó (đúng lỗi
  T4 từng gặp) — đã chuyển sang kill theo pid lấy từ `ss`,
  không dùng `pkill -f` nữa; sự cố này xảy ra SAU khi bench
  in xong exit 0 nên không ảnh hưởng kết quả.

## 4. Hiệu chuẩn ngưỡng CPU lặp 3 vòng (kết quả thật, quyết định giữ ngưỡng cũ)

File: `benchmarks/results/v38-u4-cpu-calibration.json`
(probe exit 1, allPass=false — CHỈ do 1 check tầng Node, xem
dưới; mọi check tầng CDP đều PASS).

| Tầng | Vòng 1 | Vòng 2 | Vòng 3 | Trung bình / phân tán |
|---|---|---|---|---|
| Node busy-loop (% 1 core) | 41,4 | 55,0 | 58,9 | mean 51,8; khoảng 41,4–58,9 (rộng 17,5 điểm) |
| Node idle (% 1 core) | 0,0 | 0,5 | 3,0 | mean 1,2; khoảng 0,0–3,0 |
| CDP H1 (% 1 core) | 5,7 | 0,7 | 0,0 | mean 2,1; khoảng 0,0–5,7 |
| CDP H2 (% 1 core) | 102,0 | 95,9 | 87,3 | mean 95,1; khoảng 87,3–102,0 (rộng 14,7 điểm) |
| ps lifetime max H1 / H2 | 15,9 / 16,1 | 9,8 / 16,2 | 7,0 / 16,0 | gần như trùng nhau — mù, như S6/T4 |

- Check FAIL duy nhất: `n.busyHighAllRounds` (busy vòng 1
  41,4% < 50). Check gap tầng Node vẫn PASS (41,4 / 54,6 /
  55,9 điểm), và toàn bộ tiêu chí tầng CDP PASS:
  H2 > 50 cả 3 vòng, H1 < 20 cả 3 vòng, chênh min
  (87,3 − 5,7) = 81,6 > 30.
- Giải thích trung thực (không vượt số đo): vòng Node đầu
  chạy đúng lúc VM tải nặng nhất do các luồng đợt 38 chạy
  song song (4 vCPU, RAM đã dùng ~6,5/8 GB lúc đo) — một
  busy-loop cũng chỉ giành được 41,4% một core trong cửa sổ
  đó. Tầng CDP vẫn phân biệt tốt 3/3, nhưng vì sampler đã
  chứng minh là nhạy tải ngay ở tầng Node, không thể loại
  trừ khả năng một vòng H2 dưới tải nặng hơn nữa cũng tụt
  dưới 50. Vì vậy **không đề xuất ngưỡng mới, không khóa
  cổng tự động**: giữ ngưỡng T4 (H2 > 50, chênh > 30) ở dạng
  tham chiếu, và điều kiện khóa cổng vẫn là phiên quiet có
  điều phối (như yêu cầu baseline quiet §3.2 đợt 37) — cần
  lặp lại hiệu chuẩn trong phiên đó trước khi khóa.
- Không chạy lại `tsc` / `vite build` ở luồng này: không có
  file nguồn sản phẩm nào bị đụng; 2 script .mjs sửa/mới đã
  qua `node --check` + chạy live. Parent kiểm chứng gộp vẫn
  nên chạy tsc/build như thường lệ trước khi stage.

## 5. Backup snapshot đợt 36 — verify tại chỗ

- Lệnh: `node apps/web/scripts/cdp-snapshot-backup.mjs
  --verify ~/workspace/goals/capcut-clone-video-editor/hidden_files/cdp-hang-snapshots-backup/20261102-012334/`
  → `[verify] OK …: 6 file khớp manifest`, **exit 0**.
- Backup vẫn CHƯA RA KHỎI MÁY: đích nằm trong
  `hidden_files/cdp-hang-snapshots-backup/` trên cùng đĩa VM
  (chống dọn/xóa thư mục nguồn, không chống thay toàn bộ
  đĩa VM). U4 không upload, không gửi đi đâu — không có
  lệnh và không có đích ngoài nào được cấp cho luồng này.
  Muốn backup ra khỏi máy thật thì cần user chỉ định đích
  (lệnh riêng, ngoài phạm vi U4).

## 6. File U4 đổi/thêm (parent gộp batch — U4 KHÔNG tự tạo paths-loop)

SỬA (1 file):

- `apps/web/scripts/bench-preview-fps.mjs` (cờ
  `--cdp-hang-probe-h2` + chọn expression/mode H2 + trường
  `expression` trong `result.hangProbe`; logic H1 và đo fps
  không đụng một chữ)

MỚI (1 file script + 1 LIMITS + 4 JSON kết quả):

- `apps/web/scripts/clicktest-u4-round38-cpu-calibration-probe.mjs`
  (probe hiệu chuẩn lặp §4; `node --check` pass, chạy thật
  allPass=false / exit 1 do 1 check tầng Node)
- `docs/PHASE9_ROUND38_U4_SNAPSHOT_INVALID_LIMITS.md` (file này)
- `benchmarks/results/v38-u4-bench-hang-probe-h2.json`
  (bench H2 live, ok=true, frozenDist VALID)
- `benchmarks/results/v38-u4-cpu-calibration.json`
  (hiệu chuẩn lặp 3 vòng, allPass=false, giữ ngưỡng cũ)
- `benchmarks/results/v38-u4-mobile-invalid.json`
  (mobile INVALID live, exit 1)
- `benchmarks/results/v38-u4-checkproxy-invalid.json`
  (check-proxy INVALID live, exit 3)

KHÔNG ĐỔI: `mobile-touch-check.mjs`, `check-proxy-auto.mjs`
(không cần sửa code — nhánh INVALID đã có sẵn, chỉ thiếu
kích hoạt live), mọi file code sản phẩm, i18n, bridge,
mọi file paths-loop, build-loop-log, mọi file snapshot cũ
(trừ 1 snapshot H2 mới của bench, giữ lại theo kỷ luật).
Mọi tamper chỉ nằm trong bản sao ở /tmp
(`/tmp/vcut-u4-mobile-dist/`, `/tmp/u4-checkproxy/`) —
dist thật KHÔNG có file tamper nào của U4 (đã kiểm tra:
không có `u4-tamper.txt` trong `apps/web/dist`).

## 7. Nợ còn lại (không mạo nhận đã xong)

- **Target kẹt/detached, deadlock đa tài nguyên, Chrome đơ
  toàn bộ vẫn mở** (như §4 đợt 37): H2 của U4 vẫn chỉ chứng
  minh page kẹt busy-loop; khi Chrome đơ toàn bộ thì chính
  tiến trình chẩn đoán cũng có thể tắc và snapshot không
  ghi được.
- **Ngưỡng CPU chưa thành cổng tự động:** cần phiên quiet
  có điều phối (không chạy chung luồng browser khác) lặp
  lại hiệu chuẩn rồi mới khóa; ngưỡng T4 hiện chỉ là tham
  chiếu, không phải cổng khóa/mở kết quả.
- **Backup vẫn chưa ra khỏi máy thật** (xem §5): cần lệnh
  riêng của user với đích ngoài cụ thể.
- **Mobile touch PASS/FAIL dao động theo cách serve:**
  đợt 37 FAIL cả 2 trên vite preview 4173, đợt 38 PASS cả
  2 trên static server scratch — nguyên nhân chưa xác
  định, thuộc về luồng sở hữu mobile-touch-check, không
  phải U4 (U4 chỉ chứng minh nhánh INVALID).
- **Bằng chứng U4 gắn với dist đã cũ:** dist thật đã bị
  build lại lúc 20:17:38 +07 (bundle `index-BgjA4izV.js`,
  251 file) ngay sau lượt check-proxy của U4; mọi manifest
  trong file này (7b800a66…) thuộc về dist BNjMwXhb trước
  đó. Lượt sau phải đo lại trên dist mới, không trích lại
  số cũ như bằng chứng cho dist mới.
- **Không đo:** Safari / máy thật / dpr > 1 / viewport khác
  (toàn bộ đo là Chromium headless trên VM như các đợt
  trước); H2 qua bench mới chứng minh trên editor thật,
  chưa chứng minh H2 qua mobile/check-proxy trong lúc đo
  thật (chúng chỉ cần nhánh INVALID, không cần treo).
