# Đợt 133 T8 — Vite harness WebKit 84l10/85m4/86n2: 3/3 exit 0 trên boot 07da9c50 (gate mở lần đầu sau đợt 132 BLOCKED)

Ngày: 17/11/2026 (lượt cron 03:35 +07 18/11 = 20:35:51Z; T8 mở 20:40Z, hạn T8 23:00Z, hạn cứng đợt 23:35Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chờ cờ + chạy harness + LIMITS này. KHÔNG sửa production, KHÔNG sửa harness, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND132_T8_VITEHARNESS_LIMITS.md (quy trình harness, chờ cờ, lỗi sed deadline) + LIMITS gộp đợt 132 §11/§12.3 (lượt yên #10 cơ chế chờ RAM mới, T5 pha 2 (c2), T3 bước 2, widen trigger §8.2(B), probe #52/mù #52, G1 hoãn).

## 0. Kết luận ngắn — 3/3 exit 0, gate mở sau 27 poll NOT-YET

- **Gate đủ 21:10:33Z (waiter poll 28):** `round133-t4.done` (T4 đo xong lượt yên #10, 1 attempt, median 39,5 ms, ngưỡng GIỮ) + `POSTBOOT_PASS` boot `07da9c50` pass 20:50:22Z (poll 2, boot_id/btime khớp boot đang chạy).
- **Harness 21:15:30–21:23:09Z: 84l10 exit 0, 85m4 exit 0, 86n2 exit 0.** P3 không kẹt lần thứ năm liên tiếp; P5 seek kẹt dài nhất 0 mẫu ở cả hai nhánh (85m4 hb128 + 86n2); HB128 19 dòng `sampleFor`.
- **Fixture rebuild trước chạy:** md5 khớp đợt 125–132 (hevc `ba0c7c62`, i7 `f05daed8`, h-30s `fbaa3d1a`, g-4s `a1fb8549`); ffprobe đúng spec.
- **Cây không đổi** (md5 kiểm 3 lần: lúc mở 20:40Z, trước chạy 21:14Z, sau chạy 21:25Z — preview.tsx `805409f0`, media.ts `2c384ed1`, vite.config.ts `ee80d093`).
- **Dọn sạch:** 0 process Xvfb/vite/MiniBrowser sót, socket X199 + lock đã unlink, không có `vite.lock`.
- **Không reboot trong lượt T8** — boot `07da9c50` sống từ 19:34:15Z suốt lượt (chuỗi reboot giữa lượt dừng ở 6, đợt 129–132).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 19:34:15 | Boot `07da9c50` lên (btime `uptime -s`; `stat /proc/1` 19:34:26Z, chênh 11 s — ghi cả hai như tiền lệ) |
| 20:35:51 | Lượt cron 03:35 +07 mở đợt 133; parent tạo `round-in-progress.md` |
| 20:40 | T8 mở: boot `07da9c50`, RAM khả dụng ~460–547 MB, `/tmp` trống fixture (đợt 132 không rebuild), `/tmp/.X11-unix/` chỉ còn socket X193 sót từ suite đóng đợt 132 của T10 (0 process), 0 process Xvfb/vite/MiniBrowser |
| 20:40–20:43 | T8 chuẩn bị xong: script đợt 133 adapt từ đợt 132 (`run-webkit-133t8.sh`, `rebuild-fixtures-133t8.sh`, `inventory133.py`, `mirror-verify133.py`, waiter), `bash -n` + `py_compile` OK, deadline kiểm chứng (xem §2) |
| 20:43:33 | Waiter `wait-t4-t5-133t8.sh` bắt đầu poll 60 s (deadline 23:00Z) |
| 20:50:22 | T5 viết `POSTBOOT_PASS` boot `07da9c50` (poll 2) — waiter thấy postboot=1 từ poll 8 (20:50:33Z) |
| 20:50:45 | T4: gate A mở poll #3 (RAM 1168 MB) — cơ chế chờ RAM chớp cửa sổ vàng ~20 s sau cờ T5 |
| 20:52 | T4 attempt1 ghi JSON log draw 3.274.496 B |
| 21:10 | T4 xong, viết `round133-t4.done` 21:10Z: 1 attempt, 20/20 pass exit 0, median 39,5 ms |
| 21:10:33 | Waiter poll 28: **GATE-FOUND**, exit 0 (27 poll NOT-YET trước đó) |
| 21:15 | Rebuild fixture xong (~13 s): 6/6 md5 khớp kỳ vọng |
| 21:15:30–21:23:09 | Driver `run-webkit-133t8.sh`: 84l10 exit 0 (21:15:33–21:16:38Z), 85m4 exit 0 (21:16:54–21:19:03Z), 86n2 exit 0 (21:19:19–21:23:09Z) |
| 21:25:50 | Kiểm cuối: cây không đổi, 0 process sót, socket X199 đã unlink, không `vite.lock` |

## 2. Chuẩn bị + kiểm chứng deadline — lỗi sed đợt 132 KHÔNG tái diễn

- **Deadline gõ TAY TRỰC TIẾP trong waiter, không sed đổi chuỗi date:** dòng `DEADLINE=$(date -d '2026-11-17 23:00:00 UTC' +%s)` được viết mới bằng tay trong `wait-t4-t5-133t8.sh`. Kiểm chứng trước khi chạy waiter: `date -d '2026-11-17 23:00:00 UTC' +%s` = **1794956400**, lớn hơn epoch lúc viết (1794948157) đúng 8243 s (~2h17m); `bash -n` OK.
- Waiter kết thúc bằng GATE-FOUND (exit 0) nên deadline không bị trigger trong lượt này — nhưng DEADLINE đã có giá trị hợp lệ, khác rỗng, suốt lượt (không lặp lỗi đợt 132: `date -d '2026-11-17 2026-11-17 19:45:00 UTC'` → invalid → DEADLINE rỗng → waiter không bao giờ tự hết hạn).
- Hai script còn lại adapt bằng sed `132→133` (không chứa chuỗi date nào — đã grep kiểm: 0 ref `132` còn sót, `bash -n` OK). `inventory133.py` / `mirror-verify133.py` copy/adapt xong, `py_compile` OK — không dùng tới trong lượt này (chỉ chạy khi cần kiểm kê/mirror như đợt 131; đợt này chỉ cần 3 harness theo task).

## 3. Kết quả harness chi tiết (boot 07da9c50, Xvfb :199, lock t8-round133)

### 84l10 — exit 0 (21:15:33–21:16:38Z, ~65 s)
- W1-lần1/2/3 PASS — restartEndedVideo delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0.
- W2 PASS — playhead cuối=30 (tới cuối=true), restart tự nhiên Δ=0, errors=0.
- E4 PASS — tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=4, ended=true, errors=0.
- `KẾT QUẢ: KHÔNG FAIL` — report `l10-scratch/l10-webkit-loop-w1-report.json` (35.783 B).

### 85m4 hb128 — exit 0 (21:16:54–21:19:03Z, ~2m09s)
- P1 PASS (không restart dư), P2 PASS (reset 671 ms), **P3 PASS (0 restart — phát thường ổn định)**, P4-lần1/2/3 PASS (delta=+1, hạ-cánh-về-target=true), P5 PASS (không restart dư trong 40 s sau reset) — **seek kẹt dài nhất 0 mẫu (~0.0 s)**.
- HB128: **19 dòng `sampleFor`** (P1 4, P2 3, P3 4, P5 8) — đợt 131 có 18 dòng; thêm 1 dòng do P5 chạy đủ 40 s (n=165/200 lúc 40 s, lastCt=29.933, lastPlayhead=30).
- `KẾT QUẢ: KHÔNG FAIL` — report `m4-scratch/m4-webkit-w7-report.json` (146.782 B).

### 86n2 — exit 0 (21:19:19–21:23:09Z, ~3m50s)
- P1/P2 (reset 711 ms)/P3 (0 restart)/P4×3/P5 PASS — **seek kẹt dài nhất 0 mẫu (~0.0 s)**.
- `KẾT QUẢ: KHÔNG FAIL` — report `n2-scratch/n2-webkit-w7-report.json` (172.043 B).

### Tổng hợp
- **3/3 exit 0, 0 rerun, 0 FAIL.** P3 không kẹt **lần thứ năm liên tiếp** có chạy harness (đợt 131: lần 4; đợt 132: không chạy — không tính; đợt 133: lần 5). P5 seek 0 mẫu ở cả hai nhánh.
- RAM khả dụng trong lúc chạy: 938 MB (lúc bắt đầu 84l10) → 545 MB (21:23:00Z, cuối 86n2) — tụt ~400 MB trong 8 phút chạy harness nhưng cả 3 vẫn exit 0.

## 4. Lượt yên #10 — bối cảnh từ cờ T4 (không phải số đo của T8)

- T4 đo xong 21:10Z: 1 attempt, 20/20 pass exit 0, JSON 3.274.496 B sha256 `e3ca1ac5…`; lớp B 5/5 ĐẠT; tickCost median **39,5 ms (thấp nhất 9 lượt, trung bình 46,9 ms)**; ngưỡng ≤60 ms **GIỮ**; (c2)=5 lag 1f; F6 tái xác nhận ĐÓNG; **log draw 0/5** — re-arm thất bại do loop-gate `preview.tsx` dòng 705 (chỉ ghi loop 1-2), KHÔNG attempt2.
- Gate 0 đạt 20:50:22Z (nhờ cờ T5); gate A mở poll #3 20:50:45Z (RAM 1168 MB) — cơ chế chờ RAM (quyết parent đợt 132 §12.3(a)) đã chớp được cửa sổ vàng ngay sau POSTBOOT_PASS. RAM lúc T4 chờ: 1124 MB (20:53Z), 1292 MB (21:04Z) — đều trên ngưỡng 1024 MB.
- T8 không đo log draw, không phân tích (c2) — đó là việc T5 pha 2 / T3 bước 2 với dữ liệu #10 của T4.

## 5. Dọn dẹp — đã dọn sạch

- Trap `cleanup` của driver: kill Xvfb :199 (+ `kill -9` sau 2 s), unlink `/tmp/.X11-unix/X199` + `/tmp/.X199-lock`, kill cả nhóm RAM sampler (+ `pkill -f ram-133t8.log` dự phòng).
- Kiểm cuối 21:25:50Z: 0 process Xvfb/vite/MiniBrowser; `/tmp/.X11-unix/` chỉ còn **X193** (socket sót từ suite đóng đợt 132 của T10, 0 process — KHÔNG phải của T8, để nguyên không đụng); không có `vite.lock`; lock `t8-round133` đã release cả 3 lần (ghi trong summary).
- RAM sampler log `smoke/ram-133t8.log`: 16 dòng, 21:15:30–21:23:00Z.
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 6. Giới hạn — đọc trước khi trích số

1. **n=1 lần chạy mỗi harness trên boot `07da9c50`** — số đo WebKit mới của đợt 133, không phải trung bình nhiều boot. Không suy ra "WebKit luôn pass" ngoài boot này.
2. **RAM tụt trong lúc chạy** (938 → 545 MB avail) — harness vẫn 3/3 exit 0, nhưng đây là môi trường RAM thấp; không suy ra hiệu năng trên máy đủ RAM.
3. **Cột "swap_used" trong `ram-133t8.log` thực chất là Mem used** — label sai từ script sampler gốc (đợt 128): `$3` của dòng `Mem:` trong `free -m` là used, không phải swap. Không trích số swap từ log này; chỉ dùng cột `avail`.
4. **Log draw 0/5 của T4 không liên quan tới harness T8** — T8 không đo log draw; P3/P5 ở đây là các pha của harness click-test, không phải pha của lượt yên.
5. **Không reboot trong lượt T8** — chuỗi reboot giữa lượt (6 lần, đợt 129–132) chưa chắc đã hết; lượt này chỉ là một mẫu không reboot.
6. **"P3 không kẹt lần thứ năm liên tiếp"** đếm theo các đợt CÓ chạy harness (131: lần 4, 132: không chạy nên không tính, 133: lần 5).

## 7. Nợ cho đợt sau / cần quyết parent

1. T5 pha 2 (c2) + T3 bước 2 dùng dữ liệu lượt yên #10 của T4 (median 39,5 ms, (c2)=5, log draw 0/5) — không phải việc T8.
2. Socket X193 sót từ suite đóng đợt 132 — ai dọn thì dọn; T8 không đụng socket không phải của mình.
3. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; mù #51 B mở + mù #52 mới; R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round133-t8-viteharness.txt` — **1 file** (LIMITS này), đã verify read-back, 0 binary, < 37.768 B. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật — fixture chỉ sống trong `/tmp`, rebuild lại sau mỗi reboot). Dữ liệu thô: `hidden_files/round133-t8/` (wait-t4-t5-133t8.sh — deadline gõ tay đã kiểm chứng; run-webkit-133t8.sh; rebuild-fixtures-133t8.sh; inventory133.py; mirror-verify133.py; smoke/wait-t4-t5.log — 34 dòng, GATE-FOUND poll 28; smoke/run-webkit-summary.txt; smoke/run-webkit-{84l10,85m4,86n2}.log + attempt1/ snapshots; smoke/ram-133t8.log — 16 dòng; l10/m4/n2-scratch report JSON).
