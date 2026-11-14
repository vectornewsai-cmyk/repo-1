# PHASE9_ROUND107_I2_REARM_LIMITS — Re-arm A/B RAM cao (f8r/f9 HỢP LỆ)

> Đợt 107, luồng I2. Chạy live 2026-11-13T17:47:51–17:51:38Z (lượt cron 00:35 +07).
> Lần đầu tiên re-arm A/B RAM cao cho 2/2 lượt HỢP LỆ (H1 đợt 106: 0/2, loại vì
> H5 sửa preview.tsx giữa lượt). KHÔNG push. KHÔNG release/tag. Không sửa production code.

## 1. Kết quả — trigger đạt check 3; 2/2 lượt hợp lệ; CAP vẫn cao ở RAM cao

### 1.1 Watcher (wait-hiram107.sh, đã vá — xem §2)

| check | thời gian (Z) | avail (kB) | load1 | sibProcs |
|---|---|---|---|---|
| 1 | 17:47:51 | 1.347.960 | 5,16 | 14 |
| 2 | 17:48:36 | 3.094.936 | 3,74 | 1 |
| 3 | 17:49:22 | **2.965.144** | **3,11** | **0** |

Trigger check 3: avail 2.965.144 ≥ 2.400.000 ✓, load1 3,11 < 4,0 ✓, sibProcs = 0 ✓.
Boot `63a52041-cdb6-4824-bb17-32c8f5aba5ee` (reboot #33, uptime -s 14:50:59Z),
không đổi trong cả đợt — reboot #34 (dự báo ~16:51:58Z, dải tới 18:05Z) vẫn
CHƯA xảy ra lúc 17:51:38Z (up 3h00'). Cửa sổ RAM cao lần này do sibling thoát
(I1 probe ghost xong giữa check 1→2, RAM nhảy +1.747 MB), KHÔNG phải do reboot.
Watcher chỉ cần 3 check (~90 s); cửa sổ ~100' không dùng tới.

### 1.2 Lượt f8r — HỢP LỆ (gop250)

- 17:49:22–17:50:18Z, load4, clip `o8-ball-720p-6s.mp4`, webkit 27.2.
- RAM đầu lượt 2.942.872 kB (2.873 MB) — **RAM-CAO** (≥ 2.400.000 ✓), load1 3,11.
- md5 preview.tsx trước = sau = `ced42efd…`; mtime trước = sau =
  2026-11-13T14:43:56.519Z (không đổi). exit = 0.
- 99 velocityTicks, n = 86 mẫu, 2 tails. **CAP = 1, ages [5087] ms.**
- CAP chi tiết: ended 4508 age 5087 adv 0 drift 0,6 ct 1,5333 ph 0,9333 t 9595.
- rate 0,156; wall 28.768 ms; max freeze 6.782 ms (trong đuôi mở 4.730, ph-adv 300);
  gap max/med 697/283,0 ms; stopped = true; pageErrs = [].
- Verdict probe: playhead-giữ-trong-seek PASS; playhead-lúc-canvas-đổi-khung PASS
  (seekDone 1784 ms, ph 0,5; canvas change 1784 ms, ph 0,5).
- Lưu ý: dừng sớm — "playhead đóng băng ≥2,5s trong lúc seeking (đúng hành vi giữ
  sau sửa)" — nên wall ngắn hơn f6r (28,8 s so với 41,2 s), 99 ticks so với 158.
  So sánh CAP dùng thêm CAP/tick (§4).

### 1.3 Lượt f9 — HỢP LỆ (gop30)

- 17:50:20–17:51:33Z, load4, clip `o8-ball-720p-6s-gop30.mp4`, webkit 27.2.
- RAM đầu lượt 2.428.564 kB (2.371 MB) — **RAM-CAO** (≥ 2.400.000 ✓, sát ngưỡng),
  load1 đầu lượt **6,33** (cao — tải nền từ các luồng khác; gate load chỉ áp lúc
  trigger, không áp lúc bắt đầu từng lượt).
- md5 preview.tsx trước = sau = `ced42efd…`; mtime trước = sau =
  2026-11-13T14:43:56.519Z (không đổi). exit = 0.
- 118 velocityTicks, n = 108 mẫu, 4 tails. **CAP = 3, ages [5023, 5201, 5255] ms.**
- CAP chi tiết: ended 6694 age 5023 adv 0 drift 0,63 ct 1,6 ph 0,9667 t 11717;
  ended 25717 age 5201 adv 0 drift 0,57 ct 2,3333 ph 1,7667 t 30918;
  ended 36022 age 5255 adv 0 drift 0,47 ct 2,9667 ph 2,5 t 41277.
- rate 0,103; wall 43.590 ms; max freeze 5.470 ms (trong đuôi mở 4.968, ph-adv 0);
  gap max/med 907/330,0 ms; stopped = false; pageErrs = [].
- Chờ phát tới localPh ≥ 5,0: **HẾT 40 s (chưa đạt)** — giống f7, mẫu gop30 dưới tải.
- Verdict probe: PASS/PASS (seekDone 2204 ms, ph 0,5; canvas change 2989 ms, ph 0,5).

### 1.4 Tổng hợp — 4 CAP / 2 lượt = 2,00 CAP/lượt ở RAM cao

| chỉ số | f8r | f9 | gộp I2 | baseline f1–f5 |
|---|---|---|---|---|
| CAP/lượt | 1 | 3 | **2,00** | 2,80 |
| CAP/tick | 1/99 = 0,0101 | 3/118 = 0,0254 | **4/217 = 0,0184** | 14/700 = 0,0200 |
| freeze-trong-đuôi-mở trung vị (ms) | 4.730 | 4.968 | **4.849** | 4.900 |
| freeze-ph-adv trung vị (ms) | 300 | 0 | 150 | 375 |
| rate trung vị | 0,156 | 0,103 | 0,130 | 0,110 |

Tiêu chí quyết định đăng ký trước (G4 §4.1): CAP/lượt ở RAM cao về ~0 VÀ
freeze-trong-đuôi-mở về ~1,2 s → RAM là nguyên nhân; CAP/lượt vẫn ≥ ~1,5 VÀ
freeze vẫn ~4,9 s → RAM bị loại. Quan sát: **2,00 ≥ 1,5 ✓ và 4.849 ms ≈ 4,9 s ✓
→ nhánh "RAM bị loại"**. Cả 3 chỉ số đều gần như phẳng so với baseline
(CAP/lượt −29% nhưng n = 2; CAP/tick −8%; freeze-tail −1%).

**Verdict: RAM bị loại THEO TIÊU CHÍ ĐĂNG KÝ TRƯỚC — với lưu ý độ tin cậy bị hạ
bởi decay trong lúc đo (§5).** Đây là bằng chứng gợi ý mạnh (cùng hướng trên cả
3 chỉ số), chưa phải loại trừ dứt khoát. Nợ re-arm A/B RAM cao coi như ĐÓNG
theo tiêu chí đã đăng ký; bước tiếp theo là A/B tắt E4 (G4 §4.2), xem §8.

## 2. Driver đã vá gì (diff đầy đủ so với F5/H1)

### 2.1 `wait-hiram107.sh` ← `wait-hiram.sh` (F5)

1. 50 check (~37') → **133 check (~100')** (lệnh brief đợt 107; thực tế chỉ
   dùng 3 check).
2. **Phát hiện reboot giữa chừng:** ghi `BOOT0` lúc bắt đầu, mỗi check so
   `boot_id` hiện tại; đổi → ghi `REBOOT PHÁT HIỆN` + uptime/free rồi dừng
   (exit 3), giữ log trên đĩa cho late-merge. (Đợt này không kích hoạt.)
3. **STOP file:** `round107-i2/STOP` xuất hiện → dừng (exit 2) để parent đóng đợt.
4. Dòng bắt đầu log thêm boot id + md5 preview.tsx. Đích chạy đổi thành
   `run-f5-hiram107.sh`. **Ngưỡng trigger KHÔNG đổi** (RAM ≥ 2.400.000 kB,
   load1 < 4,0, sibProcs = 0); logic sibProcs giữ nguyên.

### 2.2 `run-f5-hiram107.sh` ← `run-f5-hiram.sh` (F5/H1)

(a) **Kiểm lại RAM ngay trước mỗi lượt, ghi vào log (không tin RAM lúc trigger):**
mỗi `run_one` đọc lại `MemAvailable` + load1 ngay trước probe, ghi dòng
`RAM_kB=… load1=… md5-trước=… RAM-CLASS=…`, phân loại:
`RAM_kB ≥ 2.400.000` → RAM-CAO; `2.173.000–2.399.999` → RAM-SÀN (dưới trigger,
chỉ đạt đáy dải j — vẫn chạy, ghi rõ); `< 2.173.000` → BỎ lượt, ghi log +
`SKIPPED-RAM-<phase>.txt`, không chạy probe, không tính vào A/B (đề xuất G4 §3).
Đợt này cả 2 lượt đều RAM-CAO nên gate bỏ-lượt không kích hoạt (không có file
SKIPPED-RAM-*).
(b) **md5 preview.tsx trước/sau mỗi lượt:** ghi `md5-trước` / `md5-sau` vào log;
md5 đổi → ghi `FAILED-MD5.txt` (bổ sung cho check mtime của probe). Đợt này
md5 không đổi ở cả 2 lượt (không có file FAILED-MD5-*; cũng không có FAILED-MTIME-*).
(c) **probe104f5.mjs hardcode SCRATCH = round104-f5** (không sửa probe): kết quả
gốc vẫn nằm ở `round104-f5/probe-…-f8r|f9/`; driver COPY `probe-results.json` +
`probe-log.txt` về `round107-i2/probe-…/` ngay sau mỗi lượt để đợt này tự chứa
dữ liệu. Bản copy đã kiểm md5 khớp byte-identical với gốc
(`4b3b3b74…` f8r, `2eef1d4e…` f9).
(d) Lượt đổi thành **f8r gop250 + f9 gop30**; log driver đổi tên
`run-f5-hiram107.log`. Ngưỡng/bar khác giữ nguyên (CAP ≥ 4800 ms, verdict PASS).

### 2.3 `analyze-f8r-f9-cap-pattern.py` ← `analyze-f6r-f7-cap-pattern.py` (H1)

- **Vá (b) — ENV join:** script cũ đọc `run-f5.log` (không có f6r/f7) bằng regex
  `lượt (f\d) load…` (không khớp `f6r`/`f7`) nên `ram`/`load1` = null (H1 §5).
  Script này đọc `run-f5-hiram107.log` (cùng thư mục) bằng regex
  `lượt (f\w+) load(\d+) gop(\d+) bắt đầu .*?RAM_kB=(\d+) load1=([\d.]+)`,
  ghi thêm `ram_kB` chính xác bên cạnh `ram` (MB, khớp bảng cũ).
- **Kiểm chứng vá TRƯỚC khi chạy live:** chạy analyzer lên dữ liệu H1 (f6r/f7)
  trong /tmp — RAM/load1 ra đúng 2.417.876 kB/3,98 và 2.367.940 kB/9,51 thay vì
  null; CAP khớp 100% với H1 LIMITS §1.2/1.3 (f6r 3 CAP [5181, 5159, 5007],
  f7 2 CAP [5020, 5111]). CAP classification giữ nguyên logic H1/F5.
- Scope: chỉ probe f8r/f9 trong thư mục này; ghi `cap-pattern-rows.json` tại đây.

### 2.4 Kiểm chứng độc lập sau khi chạy (không qua analyzer)

- 2 CAP kiểm lại trực tiếp từ `velocityTicks`: f8r ended 4508, tick cuối t = 9595,
  age = 5087, rearms 0 → 0 (không tăng) → CAP ✓; f9 ended 36022, tick cuối
  t = 41277, age = 5255, rearms 1 → 1 → CAP ✓. Khớp analyzer.
- Baseline f1–f5 tính lại từ `round104-f5/cap-pattern-rows.json` (không lấy số
  từ trí nhớ): 14 CAP/5 lượt = 2,80; CAP/tick 14/700 = 0,0200; frzTail_med 4900;
  frzPhAdv_med 375; rate_med 0,110.

## 3. Phương pháp

- Nguồn: `hidden_files/round107-i2/` (watcher log, run log, probe log/JSON bản
  copy, `cap-pattern-rows.json`, 3 script đã vá, status) + gốc probe tại
  `hidden_files/round104-f5/probe-webkit-load4-gop250-f8r/` và
  `probe-webkit-load4-gop30-f9/` + `round104-f5/cap-pattern-rows.json` (baseline).
- Định nghĩa CAP giống F5/H1: tail span theo `tail.endedAtMs`;
  age = t tick cuối − endedAtMs; CAP iff age ≥ 4800 ms VÀ rearms không tăng ở
  tick ngay sau span.
- Cây đo: preview.tsx md5 `ced42efd785724c8c0d1b16fc32c7341` (H5 đợt 106, chỉ
  sửa comment so với F8 `f0b9e496`), mtime 2026-11-13T14:43:56.519Z — ĐÓNG BĂNG
  cả đợt, kiểm md5 trước/sau mỗi lượt. playheadHold90R2.ts md5 `00cce1ac…`
  không đổi. probe104f5.mjs không sửa (`node --check` OK).

## 4. So sánh chi tiết với baseline f1–f5 (tính lại từ file gốc)

| lượt | gop | RAM đầu (MB) | load1 đầu | n_vt | tails | CAP | ages (ms) | rate | frzTail (ms) |
|---|---|---|---|---|---|---|---|---|---|
| f1 | 30 | 2012 | 8,40 | 78 | 2 | 2 | 5004, 5271 | 0,241 | 4802 |
| f2 | 30 | 1882 | 9,98 | 139 | 4 | 3 | 5113, 5220, 5183 | 0,108 | 4918 |
| f3 | 30 | 2015 | 3,45 | 116 | 3 | 2 | 5169, 5073 | 0,110 | 4900 |
| f4 | 250 | 1464 | 1,16 | 194 | 5 | 4 | 5214, 5103, 5093, 5096 | 0,105 | 5012 |
| f5 | 250 | 1917 | 0,62 | 173 | 5 | 3 | 5018, 5170, 5113 | 0,127 | 4900 |
| **f8r** | 250 | **2873** | 3,11 | 99 | 2 | **1** | 5087 | 0,156 | 4730 |
| **f9** | 30 | **2371** | 6,33 | 118 | 4 | **3** | 5023, 5201, 5255 | 0,103 | 4968 |

Đối chiếu f8r↔f6r (cùng gop250, f6r LOẠI nhưng ghi nhận): f6r 3 CAP
[5181, 5159, 5007], frzTail 4866, wall 41.191; f8r 1 CAP [5087], frzTail 4730,
wall 28.768 (ngắn hơn do dừng sớm). Đối chiếu f9↔f7 (cùng gop30): f7 2 CAP
[5020, 5111], frzTail 4728, HẾT 40 s chưa đạt localPh ≥ 5,0; f9 3 CAP
[5023, 5201, 5255], frzTail 4968, cũng HẾT 40 s chưa đạt. Cả 2 cặp đều cho
CAP + freeze-tail ~4,7–5,0 s ở cả 2 mức RAM.

## 5. Lưu ý phương pháp QUAN TRỌNG — RAM decay trong lúc đo (hạ độ tin cậy verdict §1.4)

RAM khả dụng lúc **tải nền BẬT** (đầu cửa sổ đo, sau khi vite/webkit/Xvfb đã lên):

| lượt | RAM đầu lượt (MB) | RAM lúc tải-nền-bật (MB) | chênh |
|---|---|---|---|
| f1 | 2012 | 1113 | −899 |
| f2 | 1882 | 1245 | −637 |
| f3 | 2015 | 1189 | −826 |
| f4 | 1464 | 1773 | +309 |
| f5 | 1917 | 996 | −921 |
| **f8r** | **2873** | **1376** | **−1497** |
| **f9** | **2371** | **989** | **−1382** |

- Median RAM lúc tải-nền-bật: baseline **1189 MB**, I2 **1182 MB** — **gần như
  trùng nhau**. Stack khởi động (vite + webkit + Xvfb + bridge, ~25 s giữa bắt
  đầu lượt và bật tải) ăn ~1,0–1,5 GB ở cả 2 nhánh; `yes` 4x (tải nền) gần như
  không ăn RAM. Mọi CAP đều đo SAU lúc bật tải, tức là trong cửa sổ mà RAM
  thực tế đã về cùng dải ~1,0–1,4 GB ở cả 2 nhánh.
- Hệ quả: A/B này đã thay đổi RAM **lúc bắt đầu lượt**, nhưng KHÔNG giữ được
  chênh lệch RAM **trong lúc đo**. Nó kiểm tra "RAM cao lúc khởi động" chứ
  không phải "RAM cao lúc decode". Vì vậy verdict "RAM bị loại" (§1.4) là gợi
  ý mạnh (3 chỉ số cùng phẳng), không phải loại trừ dứt khoát.
- Phát hiện phương pháp: **harness load4 hiện tại không tách được RAM khỏi tải
  trên máy 8 GB** — bất kỳ lượt nào cũng đo CAP ở ~1,0–1,8 GB avail sau khi
  stack lên, dù bắt đầu ở 1,5 hay 2,9 GB. Muốn A/B RAM sạch cần giữ RAM cao
  trong lúc đo (vd: máy nhiều RAM hơn, hoặc đo trước khi stack ăn RAM — nhưng
  CAP chỉ xuất hiện dưới tải nên không đo sớm được; xem §8).

## 6. Quan sát thêm (ghi nhận, chưa phải kết luận)

1. **Freeze-trong-đuôi-mở bất biến ~4,7–5,0 s qua TẤT CẢ 9 lượt** (f1–f5:
   4802–5012; f6r 4866; f7 4728; f8r 4730; f9 4968) — không phụ thuộc RAM đầu
   (1.464–2.873 MB), load1 đầu (0,62–9,98), gop (30/250), hay cây
   (ca378bbf/f0b9e496/ced42efd). CAP ages cũng cụm chặt 5004–5271 ms, ngay trên
   ngưỡng 4800 ms, không có ca nào ~6000+ hay ~3000. Mẫu này giống một cửa sổ/
   timeout cấu trúc ~5 s hơn là đói tài nguyên — giả thuyết để đợt sau kiểm,
   KHÔNG kết luận ở đây.
2. f9 (gop30) lặp lại đúng mẫu f7: không đạt localPh ≥ 5,0 trong 40 s,
   stopped = false — playback gop30 dưới tải nền chậm một cách hệ thống.
3. f8r dừng sớm do playhead đóng băng ≥2,5 s trong lúc seeking — hành vi giữ
   sau sửa hoạt động, nhưng làm ngắn lượt; CAP/tick (§1.4) là chỉ số bù.

## 7. Giới hạn — những gì KHÔNG làm được

1. n = 2 lượt hợp lệ — mẫu nhỏ; CAP/lượt 2,00 vs 2,80 có thể dao động lấy mẫu.
   CAP/tick (0,0184 vs 0,0200) và freeze-tail (4849 vs 4900 ms) ổn định hơn
   nhưng vẫn n = 2.
2. So sánh chéo cây: I2 chạy trên cây `ced42efd` (H5 comment-only), baseline
   f1–f5 trên cây `ca378bbf`. Thay đổi chỉ là comment nên nhiễu được cho là
   nhỏ, nhưng không phải cùng cây byte-identical.
3. f9 load1 đầu lượt 6,33 (cao); f8r wall ngắn (dừng sớm). Cả 2 đều ghi rõ ở §1.
4. Decay RAM trong lúc đo (§5) — hạn chế lớn nhất của A/B này.
5. Không đo lại; không sửa production code; không đụng file luồng khác;
   không đụng TTS/birefnet/workflows/cloud.
6. Reboot #34 vẫn chưa xảy ra lúc kết thúc đợt (17:51:38Z) — dự báo G8
   (~16:51:58Z, dải tới 18:05Z) đã trễ; số thứ tự reboot sau #33 để mở.

## 8. Nợ mở / kế hoạch đợt sau

1. **A/B tắt E4 (G4 §4.2) — bước tiếp theo theo kế hoạch đăng ký trước:**
   toggle tắt điểm gọi E4 trong `preview.tsx` (giữ module nguyên), chạy lại
   ma trận 6 lượt load4 tương đương f1–f6, KHÔI PHỤC NGAY, kiểm md5 về đúng
   trước toggle. So sánh ở CÙNG dải RAM thấp như f1–f5 (1.464–2.015 MB) — decay
   §5 ảnh hưởng cả 2 nhánh như nhau nên A/B này vẫn sạch. Tiêu chí: CAP/lượt
   E4-off về ~0 ở cùng dải RAM → E4 có đóng góp; vẫn ~2,8 → E4 được minh oan.
2. **A/B RAM sạch (nếu muốn loại trừ RAM dứt khoát):** cần giữ RAM cao trong
   lúc đo — các hướng: máy nhiều RAM hơn; giảm tải nền (load thấp hơn, nhưng
   CAP có thể không xuất hiện); hoặc đo RAM liên tục trong lúc đo và chỉ tính
   lượt nào avail giữ ≥ 2.400.000 kB suốt cửa sổ (harness hiện tại không làm
   được — stack ăn ~1 GB ngay khi lên).
3. Giả thuyết cửa sổ ~5 s (§6.1): kiểm tra xem tail age có trần cấu trúc không
   (đọc code tail/re-arm + đo age ở các mức tải khác nhau) — chỉ khi E4-off
   cũng không giải thích được CAP.
4. G1 vẫn mở, chờ user quyết metric (nợ đợt 105) — không thuộc I2.
5. ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần thành
   công (RAM < ngưỡng 6 GB).

## 9. File / stage

- LIMITS này: `docs/PHASE9_ROUND107_I2_REARM_LIMITS.md`
- Dữ liệu đợt này: `hidden_files/round107-i2/` (watcher log `wait-hiram107.out`,
  run log `run-f5-hiram107.log`, probe log/JSON bản copy f8r/f9,
  `cap-pattern-rows.json`, 3 script đã vá, `round107-i2-status.md`) — ngoài repo,
  không stage qua paths-loop; bản copy probe JSON khớp md5 với gốc tại
  `hidden_files/round104-f5/probe-webkit-load4-gop250-f8r/` và
  `probe-webkit-load4-gop30-f9/`.
- Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round107-i2-rearm.txt`
  — LIMITS-only (theo mẫu H1 đợt 106: driver/watcher/data nằm ngoài repo nên
  không đưa vào paths-loop), NUL-delimited, đã verify read-back.
