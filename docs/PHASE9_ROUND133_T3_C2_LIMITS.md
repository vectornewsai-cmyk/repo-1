# PHASE9_ROUND133_T3_C2_LIMITS — Bước 2 kiểm chứng (c2), lượt yên WebKit #10: MÔ HÌNH GHOST-FREEZE/SKEW ĐƯỢC CỦNG CỐ (P1 ∧ P3 ∧ P2 ĐÚNG); P7 VẪN KHÔNG KIỂM ĐƯỢC (log draw 0/5)

> **Verdict bước 2: MÔ HÌNH ĐƯỢC CỦNG CỐ — phép thử ngoài mẫu ĐẦU TIÊN cho ghost-freeze + skew snap/label ĐẠT cả ba phép thử chính: P1 5/5 (c2) trong ±1 tick run-end (baseline 9,6%, p = 8,0×10⁻⁶), P3 5/5 đóng băng labelMs tại tick (baseline 20,3%, p = 3,4×10⁻⁴), P2 0 (c2) lag âm. P4 ĐÚNG (thuần +1f = 5, tổng = 5, skp=1 = 0, lag ≥+5f = 0). P5 KHÔNG ĐẠT ĐẦY ĐỦ (2/4: snap 35 ms ✓, raw 8 ms ✓; label-floor +1 76,5% vượt dải ≤76% một chút; run ≥3 tick 12, thiếu 1 so với dải 13–22) — theo prereg chỉ ghi rõ, KHÔNG bác mô hình. P7 KHÔNG KIỂM ĐƯỢC lần thứ ba liên tiếp: log draw phủ 0/5 (c2), log kết thúc 10.119 ms TRƯỚC flip — desync seek-latency VẪN chưa được kiểm.**
> **Lượt yên #10 HỢP LỆ (attempt1 duy nhất, 20/20 pass, lớp B 5/5, median 39,5 ms — THẤP NHẤT trong 9 lượt; ngưỡng ≤60 ms GIỮ, biên 20,5 ms).**

## 0. Prereg đứng nguyên + bằng chứng dữ liệu chỉ có sau prereg

- Prereg T3 đăng ký đợt 132 lúc 17:45Z 17/11/2026 (+ bổ sung A1 17:50Z), xem `hidden_files/round132-t3/prereg-t3.md` — **không đăng ký lại, không sửa dự báo sau khi có dữ liệu**.
- Bước 2 đợi dữ liệu T4 bằng poll đĩa (`round133-t3/wait-t4.sh`, log `wait-t4.log`): poll 20:47Z (RAM 1186 MB, chưa có JSON), 20:57Z (JSON attempt1 đã xuất hiện, RAM 1903 MB), 21:07Z (JSON ổn định qua 2 poll → dừng chờ, chạy bước 2).
- T4 đóng cờ `round133-t4.done` lúc **21:10Z** ("đo xong, 1 attempt, median 39,5 ms, ngưỡng GIỮ, log draw 0/5") — attempt1 là lượt yên #10 duy nhất, KHÔNG attempt2 (quyết định có căn cứ của T4, xem §6).
- JSON gốc kiểm chứng: `hidden_files/round133-t4/preview-b-f3-flip-webkit-t4-attempt1.json`, **3.274.496 B, sha256 e3ca1ac5dd79be72014a88268fe5abec1703f585b25a64473ad434c245423133** — khớp sha T4 công bố trong cờ `.done` và LIMITS T4.
- Cây không đổi suốt lượt: `preview.tsx 805409f0`, `media.ts 2c384ed1`, `vite.config.ts ee80d093` (T3 kiểm lại 21:10Z, khớp tree-md5 của T4).
- Boot 07da9c50 (btime 19:34:15Z) sống suốt lượt — **không reboot trong cửa sổ đo, lần đầu sau 6 lượt liên tiếp có reboot giữa lượt**.
- Cơ chế chờ RAM mới (quyết parent đợt 132 §12.3(a)) **HOẠT ĐỘNG**: cờ T5 `round133-t5/POSTBOOT_PASS` 20:50:22Z → gate A mở poll #3 20:50:45Z (RAM 1168 MB) → attempt1 chạy ngay trong cùng giây. Cửa sổ lần này KHÔNG phải cửa sổ vàng sau boot (boot đã 76 phút tuổi) mà là đợt hồi RAM giữa lượt — poll dày 45 s/lần + vào probe ngay là yếu tố quyết định (theo LIMITS T4 §2.1).

## 1. Tính hợp lệ của lượt yên #10 (phạm vi prereg: chỉ kiểm trên lượt hợp lệ)

| Tiêu chí | Kết quả | Nguồn |
|---|---|---|
| Attempt 20/20 pass, exit 0, pageErrs [] | **ĐẠT** — passes=20, flip afterPass=5, wallMs=26187 | JSON gốc (T3 đọc trực tiếp) |
| tickCost total median ≤60 ms | **ĐẠT — 39,5 ms** (post flip+2000ms: 39,0 ms); **thấp nhất trong 9 lượt** (trước đó thấp nhất 40,0 ms; trung bình 9 lượt 46,9 ms) | T3 tính lại từ JSON, khớp T4 |
| Lớp B 5/5 | **ĐẠT** — B1 load5 cuối 0,85; B2 load1 max 1,48; B3 không reboot; B4 apt/dpkg 0; B5 RAM min 636 MB, 0 mẫu <500 MB | T4 đo (`classb-t4-attempt1.txt`); T3 đối chiếu file, các số nội bộ nhất quán; B3 T3 kiểm độc lập được (cùng boot_id trước/sau) |
| **Kết luận** | **LƯỢT YÊN #10 HỢP LỆ — đủ điều kiện áp prereg P1–P7** | |

## 2. Kiểm chứng độc lập — T3 tính lại từ JSON gốc, đối chiếu 100% với T4

Script riêng của T3: `hidden_files/round133-t3/t3-step2-verify.py` (viết mới, không copy verbatim script T5; cùng định nghĩa prereg). Output: `hidden_files/round133-t3/t3-step2-verify-133a1.txt`.
Script đã validate trước trên dữ liệu lượt #9 (đợt 131): tái tạo **khớp 100%** mọi số đã công bố (median 56,0; n_ghost 656; bin0 33,8% / +1/+2 43,1% / +3 13,0%; (c2)=9 đúng 9 seq; P1 9/9; P3 đóng băng 8/9; P7 0/9 phủ) — xem `t3-step2-dryrun-131.txt`.

| Số liệu | T3 tính lại | T4 công bố | Đối chiếu |
|---|---|---|---|
| tickCost median (toàn lượt / post) | 39,5 / 39,0 ms | 39,5 / 39,0 ms | **KHỚP** |
| nTicks post / nGhost / nomatch | 376 / 752 / 0 | 376 / 752 / 0 | **KHỚP** |
| Histogram bin0 / +1/+2 / +3 | 34,4% / 52,3% / 3,1% | 34,4% / 52,3% / 3,1% | **KHỚP** |
| (c2) skp=0 (seq, presented, label, lag) | 5: (166,22,21,+1), (218,24,23,+1), (293,13,12,+1), (323,22,21,+1), (394,16,15,+1) | 5, cùng 5 seq | **KHỚP** |
| (c2) skp=1 / lag ≥+5f | 0 / 0 | 0 / 0 | **KHỚP** |
| curPix run ≥3 tick | 12 run, cùng danh sách | 12 run, cùng danh sách | **KHỚP** |
| Log draw phủ (c2) | 0/5 | 0/5 | **KHỚP** |
| snap−label / raw−label median | 35 / 8 ms | 35 / 8 ms | **KHỚP** |
| label−floor +1 | 76,5% (575/752) | 76,5% (575/752) | **KHỚP** |

Không có số nào lệch giữa hai lần tính độc lập (T3 vs T4, hai codebase khác nhau).

## 3. Verdict từng dự báo (prereg §3–§4)

### P1 — (c2) gắn run-end: **ĐÚNG** (5/5, p = 8,0×10⁻⁶)

- 5/5 (c2) trong ±1 tick của run-end: seq 166 (cách run-end 165 đúng 1 tick), 218 (đúng run-end 218), 293 (đúng run-end 293), 323 (đúng run-end 323), 394 (đúng run-end 394).
- Baseline chính lượt #10: 36/376 tick post (9,6%) nằm trong ±1 tick của run-end — **cả hai định nghĩa baseline đều cho 36/376** (prereg-literal min |seq−run_end| và T5 signed-dist; lần này không chênh như lượt #9 vì không có cặp run kề nhau).
- p nhị thức P(X≥5 | n=5, p0=0,096) = **8,0×10⁻⁶ < 0,01**; tỷ lệ 5/5 ≥ 2/3. **P1 ĐÚNG.**
- Đối chiếu lượt #9: 9/9, baseline 18,6–19,2%, p ~ 3×10⁻⁷. Hai lượt liên tiếp cùng ĐÚNG với p < 10⁻⁵.

### P2 — Dấu (c2) luôn dương: **ĐÚNG**

- 5/5 (c2) lag +1f (presented mới hơn label đúng 1 frame); **0 (c2) lag âm**. Phù hợp cả 9 lượt trước (mọi (c2) đều lag +).

### P3 — (c2) gắn freeze labelMs tại tick (bản sửa A1, chỉ tính đóng băng-tại-tick): **ĐÚNG** (5/5, p = 3,4×10⁻⁴)

- 5/5 (c2) có labelMs occ0 **bằng** labelMs occ0 tick trước (đóng băng-tại-tick): seq 166, 218, 293, 323, 394.
- Baseline chính lượt #10: 76/375 tick post (20,3%) đóng băng-tại-tick.
- p nhị thức P(X≥5 | n=5, p0=0,203) = **3,4×10⁻⁴ < 0,01**; tỷ lệ 5/5 ≥ 2/3. **P3 ĐÚNG.**
- Tick bắt kịp (nhảy ≥100 ms, ghi riêng, KHÔNG tính verdict): **0** — khác lượt #9 (có 1 tick bắt kịp seq 421, nhảy +777 ms). Mọi (c2) lượt #10 đều là đóng băng thuần, không có bắt kịp.
- Đối chiếu lượt #9 (A1): 8/9 đóng băng, baseline 22,9%, p = 5,5×10⁻⁵. Hai lượt liên tiếp cùng ĐÚNG.

### P4 — Số lượng (c2): **ĐÚNG**

- Thuần +1f: **5** (dải 2–8 ✓). Tổng (c2) skp=0: **5** (dải 2–12 ✓). (c2) skp=1: **0** ✓. Occurrence lag ≥+5f: **0** ✓.
- Kỳ vọng Poisson cho lượt n≈650 ghost là ~4,9 occurrence (95% CI 1–10); lượt #10 có n=752 ghost, quan sát 5 — trong kỳ vọng.

### P5 — Các số phụ skew: **KHÔNG ĐẠT ĐẦY ĐỦ (2/4)** — ghi rõ, KHÔNG bác mô hình (theo prereg)

| Số phụ | Lượt #10 | Dải dự báo | Kết quả |
|---|---|---|---|
| snapMs−labelMs median | **35 ms** | 34–48 ms | ✓ trong dải |
| rawMs−labelMs median | **8 ms** | 8–10 ms | ✓ trong dải (sát biên dưới) |
| label−floor +1 | **76,5%** (575/752) | 63–76% | ✗ **vượt 0,5pp** (≈3–4 occurrence) — lệch biên |
| curPix run ≥3 tick | **12 run** | 13–22 run | ✗ **thiếu 1 run** — lệch biên |

- Cả hai lệch đều là **lệch biên nhỏ** (0,5pp; 1 run), không phải lệch lớn. Theo prereg §4, P5 ngoài dải chỉ ghi rõ, không tự bác mô hình freeze/skew. Không đổi ngưỡng hay DEF từ kết quả này (xem §6).

### P6 — Phân phối histogram (khoảng thực nghiệm 8 lượt — KHÔNG verdict): trong khoảng cả ba

- bin 0: **34,4%** (33–39 ✓). +1/+2: **52,3%** (33–53 ✓, sát biên trên — cao nhất trong 9 lượt). +3: **3,1%** (3–19 ✓, sát biên dưới — thấp nhất trong 9 lượt).
- Ghi chú khám phá (prereg §3 P6, chỉ áp khi median ≥54 ms): median lượt #10 là **39,5 ms < 54 ms** nên không áp dụng phép kiểm "tick chậm → phân phối rộng". Quan sát thêm: phân phối lượt #10 **tập trung vào +1/+2 chứ không rộng ra** (+1/+2 cao nhất, +3 thấp nhất cùng lúc) — ngược với hướng "rộng ra" của giả thuyết khám phá đó; chỉ ghi nhận, không kết luận.
- Giả thuyết thứ tự theo tick vẫn chết (đã bác đợt 131): chuỗi đơn điệu không xếp đúng — lượt #9 (median 56,0) có +1/+2 43,1% / +3 13,0%; lượt #10 (median 39,5, tick NHANH hơn) lại có +1/+2 52,3% (cao hơn) / +3 3,1% (thấp hơn). Tick nhanh hơn nhưng +1/+2 cao hơn — không còn quan hệ đơn điệu nào để cứu.

### P7 — Log draw phủ post-flip vs seq (c2) (phép thử desync): **KHÔNG KIỂM ĐƯỢC**

- Điều kiện áp dụng (quyết parent đợt 131 §12.3(a)): log draw phải phủ cửa sổ đo post-flip. **KHÔNG ĐẠT.**
- c2DrawLog n=137 (drawSrc 70 / rawUnit 67), wallMs 9854 → 16068 (span 6214 ms), **log max − flip = −10.119 ms** (log kết thúc TRƯỚC flip 10,1 s); 1 epoch, loopNo [1, 2].
- Phủ (c2): **0/5** — seq 166 (delta −15.060 ms), 218 (−21.831 ms), 293 (−31.312 ms), 323 (−35.195 ms), 394 (−44.224 ms) so với entry log gần nhất.
- BlendTick hậu-flip trong ±500 ms của log: **0/376 (0,0%)**.
- Theo quy tắc T3 đã đăng ký: ghi **"KHÔNG KIỂM ĐƯỢC — thiết kế log chưa đạt quyết parent §12.3(a)"**, không suy luận thay, không tính ĐÚNG/SAI cho P7.
- Nguyên nhân (theo LIMITS T4 §6, T3 đối chiếu log): re-arm probe-side **thất bại hoàn toàn — vet +0 entry cả 7 lần re-arm** (sau pass 4/7/9/11/13/15/17), n đóng băng ở 137 từ pass 2; lỗi nằm ở **app-side: `preview.tsx` loop-gate dòng 705 chỉ ghi loop 1–2**. T4 quyết KHÔNG attempt2 vì không lịch re-arm probe-side nào sửa được lỗi app-side.
- **Desync seek-latency VẪN chưa được kiểm lần thứ ba liên tiếp** (lượt #9: 0/9; lượt #10: 0/5). Không có bằng chứng mới ủng hộ hay làm yếu desync.

## 4. Verdict tổng mô hình ghost-freeze + skew snap/label: **ĐƯỢC CỦNG CỐ**

- P1 ĐÚNG ∧ P3 ĐÚNG ∧ P2 ĐÚNG → theo quy tắc verdict prereg §4: **"ĐƯỢC CỦNG CỐ"**.
- Đây là **phép thử ngoài mẫu ĐẦU TIÊN** cho mô hình (prereg đăng ký trước khi T4 đo, n=5 độc lập với 9 (c2) lượt #9 đã hiệu chuẩn) — và nó đạt cả ba phép thử chính với p ~ 10⁻⁶–10⁻⁴.
- Cộng dồn 2 lượt gần nhất: P1 14/14 (c2) trong ±1 tick run-end; P3 13/14 đóng băng-tại-tick (chỉ seq 421 lượt #9 là tick bắt kịp, không phải đóng băng).
- Giới hạn của verdict: n=5 nhỏ (dù ≥3 nên verdict đứng theo prereg); P5 2/4 lệch biên (không bác mô hình nhưng cho thấy các số phụ chưa ổn định hẳn); P7 chưa kiểm được nên **desync vẫn là giả thuyết mở** — mô hình freeze/skew được củng cố không đồng nghĩa desync bị bác.
- Không dùng kết quả này để đổi ngưỡng ≤60 ms, bar hay DEF (prereg §4) — chỉ ghi verdict + nợ mở (§6).

## 5. Cập nhật pool 9 lượt yên hợp lệ

| | 8 lượt (trước #10) | + lượt #10 | Pool 9 lượt |
|---|---|---|---|
| n ghost | 5548 | 752 | **6300** |
| (c2) thuần +1f | 42 | 5 | **47** (0,75% ghost) |
| (c2) tổng skp=0 | 49 | 5 | **54** |
| (c2) skp=1 | 0 | 0 | **0** |
| (c2) lag âm | 0 | 0 | **0** |
| Median tickCost các lượt | 40,0–56,0 ms | 39,5 ms (thấp nhất) | 39,5–56,0 ms, trung bình 46,9 ms |

- Phân phối pool chưa tính lại ở luồng này (cần chạy histogram gộp 9 lượt — việc của T5 pha 2 / đợt sau); các số trên chỉ là cộng dồn count (c2), không phải tính lại histogram.

## 6. Nợ mở chuyển đợt 134 (không tự đổi luật trong luồng này)

1. **P7 cần sửa instrumentation app-side trước khi đo lại:** `preview.tsx` loop-gate dòng 705 chỉ ghi loop 1–2 → c2DrawLog đóng băng từ pass 2. Sửa code đo (không phải probe) là việc của parent/T3 đợt 134 — T3 bước 2 đợt này KHÔNG sửa file production (đúng prereg: không sửa probe, không sửa production). Tới khi log phủ được post-flip, desync vẫn mở.
2. **DEF v0.5 VẪN CHƯA VIẾT** (prereg §1.4): không có dữ liệu mới đổi dải/ngưỡng — P5 lệch biên nhỏ (label-floor +1 76,5% vs 76%; run 12 vs 13) chưa đủ để đổi DEF v0.4; ghi nhận để đợt sau xem xét cùng dữ liệu T5 pha 2.
3. **T5 pha 2 (c2) đợt 133 chạy song song** — kiểm chứng độc lập của T5 trên cùng JSON có thể bổ sung/xác nhận; nếu T5 ra số khác T3/T4, T10 đối chiếu lúc đóng sổ.
4. **Ngưỡng ≤60 ms GIỮ** — median 39,5 ms, biên 20,5 ms, rộng nhất từ trước. Không đề xuất đổi ngưỡng.
5. **F6' tái xác nhận ĐÓNG** (theo T4): nhãn 100% (62/62), pixel-verified 100% (62/62); lag5 0 occurrence.
6. ci-security.yml vẫn 403 (chờ user); G1 vẫn hoãn; TTS 39 cấm kiểm lại; KHÔNG push khi user chưa nhắn "push đi".

## 7. Phương pháp, file, bằng chứng

- Prereg: `hidden_files/round132-t3/prereg-t3.md` (đăng ký 17:45Z + A1 17:50Z 17/11/2026, trước khi T4 đo).
- Script bước 2 (viết mới): `hidden_files/round133-t3/t3-step2-verify.py`; output: `hidden_files/round133-t3/t3-step2-verify-133a1.txt`; dry-run validate trên lượt #9: `hidden_files/round133-t3/t3-step2-dryrun-131.txt` (khớp 100% số đã công bố, gồm cả đối chiếu baseline P1 T5: 61/328 = 18,6%, p = 2,66×10⁻⁷).
- Poll chờ T4: `hidden_files/round133-t3/wait-t4.sh` + `wait-t4.log` (poll 20:47Z / 20:57Z / 21:07Z; dừng khi JSON ổn định qua 2 poll; cờ T4 tới 21:10Z, sau khi bước 2 đã bắt đầu — dữ liệu JSON đã ổn định từ 20:52Z nên không ảnh hưởng kết quả).
- JSON gốc: `hidden_files/round133-t4/preview-b-f3-flip-webkit-t4-attempt1.json` (sha256 e3ca1ac5dd79be72014a88268fe5abec1703f585b25a64473ad434c245423133).
- LIMITS T4 đối chiếu: `docs/PHASE9_ROUND133_T4_WEBKIT_QUIET10_LIMITS.md` (mọi số T3 tính lại đều khớp — xem §2).
- Hạn chót bước 2: xong 21:13Z 17/11/2026, trước 23:00Z. KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production hay probe.
- p nhị thức tính chính xác bằng `math.comb` (không xấp xỉ normal).

---
Batch stage: `phase9-round133-t3-c2.txt` (1 entry: file LIMITS này — KHÔNG push, chờ user).
