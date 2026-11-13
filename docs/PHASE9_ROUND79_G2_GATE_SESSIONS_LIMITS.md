# PHASE 9 — ĐỢT 79, LUỒNG G2: Gate re-gate — chạy thêm phiên chuẩn (nợ §4.2 đợt 78)

> Đóng nợ §4.2 trong `docs/PHASE9_ROUND78_F2_GATE_E2_LIMITS.md`: chạy ≥10 phiên
> chuẩn nữa với luật confirm mới **GIẾT ⟺ re-gate FAIL (delta < 30) ∧ slot 1 là
> FN (draw < 2 fps)**, ngưỡng re-gate 30 / gate 20 / FN 2 fps GIỮ NGUYÊN.
> Harness chuẩn F2 `apps/web/scripts/measure-78f2-gate-harness.mjs` (không đổi).
> Ngày: 2026-11-10 (UTC 02:39–03:56, +07 09:39–10:56).

## 0. Kết luận (đọc trước)

1. **LẦN GIẾT THẬT ĐẦU TIÊN của luật mới: ĐÃ QUAN SÁT ĐƯỢC — 2 lần.**
   G2-S2 (slot1 1,97 fps FN, re-gate 15 FAIL → giết, `kill-confirmed-slot1-fn`)
   và G2-S4 (slot1 0,20 fps FN, re-gate 18 FAIL → giết). Câu hỏi trung tâm
   của nợ §4.2 đợt 78 đã có đáp án đo thật: luật mới giết được phiên FN
   có slot1 FN, trên harness chuẩn, không phải tính toán lại từ dữ liệu cũ.
2. **Mục tiêu ≥10 phiên: ĐẠT — 10/10 phiên chuẩn có JSON** (8 exit 0, 2 exit 1
   do bị giết ở re-gate). Phiên FN 3/10, FN slot 3/26.
3. **Luật mới trong đợt G2: bắt FN sớm 2/3 (luật cũ cũng 2/3 — KHÔNG GIẢM).**
   FP kiểm duyệt luật mới 0; FP ground-truth đầy đủ luật mới 0 (luật cũ 1 —
   G2-S3, xem §2). Phiên được luật mới tha: 1 (G2-S3).
4. **Cặp cận ngưỡng S2/S3 chứng minh trực tiếp hành vi của luật confirm:**
   cùng re-gate delta 15 FAIL, slot1 1,97 fps (FN → GIẾT) vs 2,07 fps
   (không FN → THA) — 0,10 fps lật verdict. Ghi rõ: cả hai số đều sát
   ngưỡng 2 fps (S2 thấp hơn 0,03; S3 cao hơn 0,07) nên độ sắc của đường
   ranh giới chưa được kiểm chứng — cần thêm mẫu slot1 cận ngưỡng (xem §6).
5. **Ngưỡng GIỮ NGUYÊN 30/20/2.** Delta re-gate phiên FN (n=8): 2, 15, 17,
   18, 18, 21, 30, 75; phiên khỏe (n=27): 4, 15, 18, 27, 30, 36, 41, 42,
   44, 47, 49, 52, 59, 70, 74, 82, 87, 89, 94, 107, 137, 149, 191, 206,
   228, 244, 273 — vẫn CHỒNG LẤN, không có ngưỡng tách sạch.
6. **Gộp E2+F2+G2 (luật mới, 19 phiên):** FN 4, bắt FN sớm luật mới 2/4
   (luật cũ 3/4 — khoảng cách chỉ còn E2-S1, xem §5), FP kiểm duyệt luật
   mới 0, tha oan 2. Gộp F2+G2 (harness chuẩn): 15 phiên, FN 3.

## 1. Phiên đo G2 (luật mới, confirm BẬT, plain)

Gate 1a = 6 s, delta ≥ 20 mới PASS. Re-gate = 6 s sau slot 1, ngưỡng 30.
FN = slot draw < 2 fps. Tất cả giờ UTC; giờ +07 = UTC + 7.

| Phiên | Gate 1a | Slot draw fps (1/2/3) | Presented mean | Re-gate | Slot1 FN | Luật cũ | Luật mới | Kết quả |
|---|---|---|---|---|---|---|---|---|
| S1 (att. 1) | 39 PASS | 8,14 / 10,82 / 6,77 | 27,80 | 47 PASS | không | tha | tha | exit 0 |
| S2 (att. 2*) | 20 PASS | 1,97 | 7,51 | 15 FAIL | CÓ | GIẾT | **GIẾT** | exit 1, killedByRegate — **LẦN GIẾT THẬT ĐẦU TIÊN** |
| S3 (att. 3) | 21 PASS | 2,07 / 2,36 / 3,72 | 10,06 | 15 FAIL | không | GIẾT | **THA** | exit 0, sparedByConfirm |
| S4 (att. 2) | 23 PASS | 0,20 | 7,43 | 18 FAIL | CÓ | GIẾT | **GIẾT** | exit 1 — **LẦN GIẾT THỨ HAI** |
| S5 (att. 4) | 34 PASS | 6,38 / 5,54 / 5,49 | 26,25 | 42 PASS | không | tha | tha | exit 0 |
| S6 (att. 1) | 27 PASS | 8,83 / 8,39 / 8,24 | 30,70 | 74 PASS | không | tha | tha | exit 0 |
| S7 (att. 2) | 38 PASS | 7,37 / 8,09 / 8,10 | 29,98 | 59 PASS | không | tha | tha | exit 0 |
| S8 (att. 1) | 34 PASS | 5,80 / 0,57 / 4,04 | 21,48 | 30 PASS | không | tha | tha | exit 0 — FN chỉ ở slot 2 |
| S9 (att. 1) | 30 PASS | 5,99 / 11,10 / 4,65 | 26,46 | 70 PASS | không | tha | tha | exit 0 |
| S10 (att. 1) | 32 PASS | 5,33 / 4,65 / 5,55 | 25,25 | 30 PASS | không | tha | tha | exit 0 |

\* S2 attempt 2 là của lượt chạy driver thứ hai (sau tạm dừng, xem §3);
tổng cộng S2 dùng 6 attempt (4 ở lượt 1 + 2 ở lượt 2).

Chi tiết hai lần giết:

- **S2 — lần giết thật đầu tiên (03:14–03:15Z):** gate 1a delta 20 PASS
  đúng ngưỡng (tải 10,84). Slot 1 draw 1,97 fps (FN, chỉ dưới ngưỡng
  0,03), presented 7,51 fps. Re-gate delta 15 FAIL (tải 20,83).
  JSON: `oldKill=true, newKill=true, e2Reason="kill-confirmed-slot1-fn"`,
  `z3.killedByRegate=true`. Slot 2–3 + resume-probe + đối chứng bị bỏ qua
  theo thiết kế (phiên chết ở cửa thứ hai). FN này xảy ra dưới sóng tải
  (yes burner + bgremove + ffmpeg của luồng khác còn chạy).
- **S4 — lần giết thứ hai (03:28–03:29Z):** gate 1a delta 23 PASS (tải
  1,57). Slot 1 draw 0,20 fps — FN sâu, presented 7,43 fps. Re-gate
  delta 18 FAIL ở tải THẤP (0,78). Cùng verdict giết như S2. FN kiểu
  lạnh (không do tải), đối lập S2 — luật mới bắt được cả hai loại FN.
- **S3 — phiên được tha (03:21–03:25Z):** gate 21, slot 2,07 / 2,36 /
  3,72 fps (chậm nhưng không FN), presented ~10, re-gate 15 FAIL.
  Luật cũ GIẾT, luật mới THA (`sparedByConfirm=true`). Đây là lần tha
  thứ hai của luật mới (sau E2-S1) và là lần đầu FP của luật cũ được
  chứng minh bằng ground truth ĐẦY ĐỦ (cả 3 slot đều ≥ 2 fps — phiên
  sống sót nên đo được hết, không còn là FP "kiểm duyệt" nữa).
- **S8 — FN chỉ ở slot 2 (03:45–03:48Z):** gate 34, slot 5,80 / 0,57 /
  4,04 fps, presented 27,31 / 17,55 / 19,58, re-gate 30 PASS đúng ngưỡng.
  FN ở slot 2 (0,57 fps) nhưng slot 1 không FN và re-gate PASS nên cả
  hai luật đều tha — FN lọt ở nghĩa giết-sớm nhưng ĐƯỢC ĐO ĐẦY ĐỦ
  (không mất dữ liệu). Đồng thời cho thấy draw FN ≠ presented FN:
  slot 2 draw 0,57 fps nhưng presented vẫn 17,55 fps.
- **S1/S5/S6/S7/S9/S10 — khỏe:** slot 4,65–11,10 fps, presented
  19,38–31,74 fps, re-gate 30–74 PASS. Hai phiên S8/S10 có re-gate delta
  đúng 30 → PASS (ngưỡng là ≥ 30) — hành vi biên đúng 30 đã quan sát
  được 2 lần, đều PASS.

## 2. Kết quả gộp (analyzer `tools/analyze-79g2.mjs`, chạy 03:57 UTC)

Chạy offline trên JSON của Z3/Y3/A6/B8/C4/D5/E2/F2/G2. Quy ước như F2 §5.

### §1 — Tất cả các đợt (35 phiên có JSON)
- FN 10/91 slot; phiên FN 8/35; luật cũ bắt được 6/8.
- FP ground-truth đầy đủ: **1/24** phiên không FN, Wilson 95% [1%, 20%]
  — số 1 này chính là G2-S3 (luật cũ sẽ giết; trước G2 là 0/17 vì 3 FP
  cũ đều chết ở re-gate nên không có ground truth đầy đủ).
- FP kiểm duyệt (phiên chết ở re-gate, chỉ slot 1 làm ground truth): 3/3.
- FN (slot) gộp với dữ liệu cũ (V4 P1/P2 + X2 S4): **13/100 slot (13%)**,
  Wilson 95% [8%, 21%].

### §1d — Riêng đợt G2 (harness chuẩn, luật mới, 10 phiên)
- Phiên FN: **3/10**; bắt FN (giết sớm): luật cũ 2/3 → luật mới **2/3
  (không giảm)** — hai phiên FN có slot1 FN đều bị luật mới giết; phiên
  FN còn lại (S8) có FN chỉ ở slot 2 nên cả hai luật đều không giết sớm.
- FP kiểm duyệt (slot-1-only): luật cũ 1 → luật mới **0**.
- FP ground-truth đầy đủ: luật cũ 1 → luật mới **0**.
- Phiên được luật mới tha khỏi giết oan (sparedByConfirm): **1** (S3).
- **LẦN GIẾT THẬT ĐẦU TIÊN của luật mới: G2/session2** (và session4 là
  lần thứ hai — analyzer chỉ ghi lần đầu).

### Gộp E2+F2+G2 (luật mới, 19 phiên)
- FN 4; bắt FN sớm luật mới **2/4** (luật cũ 3/4); FP kiểm duyệt luật mới
  **0**; tha oan **2** (E2-S1, G2-S3). Gộp F2+G2 (harness chuẩn): 15 phiên,
  FN 3.

## 3. Bão tải + tạm dừng driver (02:42–03:11Z)

- Driver lượt 1 bắt đầu 02:39:43Z. S1 xong ngay attempt 1 (02:42Z). S2 attempt 1 chết timeout chờ project mẫu + hook
  (3 phút, tải lúc chết 1,57 — đã biết từ F2 §3). Attempt 2 chết gate
  delta 15 (tải 20,70). Attempt 3 chết gate delta 2 (tải 0,85 — chết ở
  tải thấp, đúng mẫu E2 §6.3). Attempt 4 bị kill giữa chừng khi tạm dừng.
- **Tạm dừng 03:01Z để giữ ngân sách attempt** (theo tiền lệ F2 §3):
  load 1-phút 32,9; 8 tiến trình `yes` (burner của luồng khác) + bgremove
  Python (30% CPU, 12,5% RAM) + ffmpeg các luồng khác bóp cell 1,5 CPU.
  Không giết tiến trình của luồng khác — chỉ dừng driver của mình.
  Driver lượt 1 dùng 5 lượt chạy (S1 1 + S2 4).
- Chờ 10 phút; 03:11Z load 1-phút 2,90, `yes` còn 3, bgremove vẫn chạy.
  Khởi động lại driver lượt 2 (03:11:54Z): S1 đã có JSON nên bỏ qua;
  S2 bắt đầu lại với ngân sách attempt mới (ghi rõ trong driver.log).
  Lượt 2: 17 lượt chạy, 10/10 phiên có JSON, kết thúc 03:56:02Z.
- **Tổng cộng: 22 lượt chạy harness cho 10 phiên** (5 lượt 1 + 17 lượt 2):
  10 qua + 10 chết gate 1a (delta 0, 2, 2, 2, 2, 4, 6, 11, 15, 16) +
  1 timeout hook + 1 kill giữa chừng lúc tạm dừng.
- Không có sóng EPERM/xkb như F2 §4 — Xvfb lên bình thường suốt đợt
  (socket X180 mồ côi được harness tự dọn). Không reboot trong đợt
  (VM boot 02:26Z, uptime 1:29 lúc kết thúc).
- Gate chết ở tải thấp lặp lại: delta 2 ở tải 0,45 (S5 att. 1), delta 0
  ở tải 1,05 (S3 att. 2), delta 4 ở tải 1,81 (S2 att. 1 lượt 2), delta 16
  ở tải 1,85 (S4 att. 1) — draw đóng băng 2→4 trong 6 s dù element vẫn
  decode (ct chạy, q.total tăng). Tải tức thời không dự báo được chết/
  qua gate — trạng thái máy không dừng theo từng phút, như E2 §6.3 đã ghi.

## 4. Kiểm chứng

- **Unit test gate: `node --test` 16/16 PASS** (E2 10 + F2 6), chạy lại
  cuối đợt 03:57Z — không đổi code, chỉ xác nhận lại harness/test còn xanh
  sau khi đo.
- **Harness không đổi** so với F2 (`measure-78f2-gate-harness.mjs`,
  58.554 byte); `gate-regate-confirm.mjs` không đổi từ đợt 77.
  Dry-run trước mỗi phiên đều in đúng cờ (confirm BẬT).
- **Config vite tái tạo sau reboot:** `/tmp/round78-f2` bị xóa khi VM
  reboot 02:26Z; gen lại bằng `tools/gen-vite-config.mjs` của F2 —
  1.726 byte, md5 `ca5b3c48afd54171d995e74cbadf7215`, KHỚP A6/B8/C4/E2.
- **Analyzer:** `tools/analyze-79g2.mjs` (kế thừa `analyze-78f2.mjs`,
  thêm thư mục G2 + mục §1d + gộp E2+F2+G2; `node --check` OK). Sửa duy
  nhất so với bản F2: G2 để phiên trong `sessions/` nên analyzer đọc
  `path.join(G2DIR, "sessions")` — sửa tool phân tích, KHÔNG sửa harness
  hay production. Output đầy đủ lưu tại
  `hidden_files/round79-g2/analyze-79g2-output.txt` (442 dòng).
- Không cần tsc (chỉ script + docs, như E2/F2). **Không sửa production.**
  Không phát hiện bug harness rõ ràng nào — timeout hook và chết gate là
  các chế độ lỗi đã biết (F2 §3, E2 §6).

## 5. Đọc đúng kết quả — đánh đổi còn lại của luật mới

- Gộp E2+F2+G2, luật mới bắt FN sớm 2/4 còn luật cũ 3/4. Khoảng cách duy
  nhất là **E2-S1** (slot1 2,92 fps không FN, FN ở slot 2–3): luật mới
  tha nó. Đây là đánh đổi đã biết và đã chấp nhận ở E2 §1/§4: FN vẫn
  được đo đầy đủ (slot 2–3 + resume-probe), chỉ mất giết sớm (~40 s đo
  thêm). G2 không làm khoảng cách này rộng thêm: cả 2 phiên FN có slot1
  FN trong G2 đều bị luật mới giết.
- Ngược lại, luật mới đã tha 2 phiên mà luật cũ sẽ giết oan (E2-S1,
  G2-S3), và trong G2, FP đầy đủ của luật cũ là 1/8 phiên không FN —
  lần đầu con số này khác 0 (trước đây 0/17) vì S3 sống sót đủ lâu để
  đo ground truth đầy đủ. Đọc đúng: **luật cũ không phải "0 FP" mà là
  "0 FP đo được"** — các FP cũ chết trước khi đo đủ slot nên chỉ tính
  được theo kiểm duyệt (3/3).
- **Cận ngưỡng là điểm yếu chưa đo được:** S2 (1,97) và S3 (2,07) cách
  ngưỡng 2 fps lần lượt 0,03 và 0,07. Draw fps có nhiễu giữa các lần
  chạy; một slot1 ở 1,9 hay 2,1 có thể chỉ là nhiễu đo, không phải hai
  loại phiên khác nhau. Với n=1 mỗi phía, KHÔNG kết luận được độ sắc
  của ranh giới 2 fps — chỉ ghi nhận verdict đã lật đúng như luật viết.
- S8 cho thấy giới hạn cấu trúc của cả hai luật: FN chỉ xuất hiện ở
  slot 2 (sau khi re-gate đã PASS) thì không luật nào giết sớm được —
  đó là thiết kế (chỉ quyết định ở re-gate), và FN vẫn được đo đầy đủ.

## 6. Giới hạn trung thực (nợ còn mở sau đợt này)

1. **n vẫn nhỏ cho lần giết:** 2 lần giết thật (S2, S4). Chưa đủ mẫu để
   ước lượng tỉ lệ bắt FN của luật mới với khoảng tin cậy hẹp; Wilson
   cho 2/2 (slot1-FN) vẫn rộng. Cần thêm phiên FN có slot1 FN.
2. **Đối chứng A/B luật cũ (confirm=0) và burner vẫn chưa chạy live lần
   nào** (nợ từ F2 §8, không thuộc phạm vi G2 — G2 chỉ chạy 10 phiên
   luật mới). Cờ `E2_REGATE_CONFIRM=0` vẫn chỉ được kiểm chứng bằng unit
   test + dry-run.
3. **Chưa có thêm mẫu slot1 cận ngưỡng 2 fps** ngoài cặp S2/S3 — độ sắc
   của ngưỡng FN 2 fps chưa kiểm chứng được.
4. **FN ở slot 2+ mà re-gate PASS (S8) vẫn lọt cả hai luật** ở nghĩa
   giết-sớm — theo thiết kế, không phải bug; FN vẫn đo đầy đủ.
5. **Ngưỡng 30 vẫn nằm trong vùng chồng lấn** (max delta FN 75 > min
   delta khỏe 4; riêng G2: delta khỏe thấp nhất 15 (S3) < delta FN cao
   nhất 30 (S8)). Không đề xuất đổi ngưỡng.
6. Chết gate 1a vẫn tốn ~55% lượt chạy (12/22 lượt không ra phiên).
   Hiện tượng đã biết, không phải dữ liệu về luật re-gate.

## 7. Lệnh kiểm chứng đã chạy

```sh
# Harness + test (cuối đợt, 2026-11-10 03:57 UTC)
node --test apps/web/scripts/test_round78_f2_gate_harness.test.mjs \
  apps/web/scripts/test_round77_e2_regate_confirm.test.mjs  # 16/16 PASS
node --check hidden_files/round79-g2/tools/analyze-79g2.mjs  # OK

# Analyzer (2026-11-10 03:57 UTC) — offline trên JSON đã đo
node hidden_files/round79-g2/tools/analyze-79g2.mjs  # §1/§1d/§2/§3 như §2 trên

# Driver (02:39–03:56 UTC, 2 lượt: tạm dừng 03:01–03:11 vì bão tải)
# Lượt 1: 5 lượt chạy (S1 xong, S2 4 attempt dở). Lượt 2: 17 lượt chạy.
# Kết thúc: 10/10 phiên có JSON, DRIVER-EXIT=0
```

## 8. Việc tiếp theo (cho đợt sau)

1. Chạy 2 đối chứng A/B luật cũ (confirm=0) + 1 burner bằng harness chuẩn
   — nợ còn lại từ F2 §8, là bằng chứng duy nhất còn thiếu cho việc luật
   cũ vẫn giết (kỳ vọng: đối chứng sẽ giết phiên có re-gate FAIL).
2. Thu thêm phiên FN có slot1 FN (đặc biệt slot1 trong khoảng 1,5–2,5 fps)
   để kiểm chứng độ sắc của ngưỡng FN 2 fps và thu hẹp Wilson cho tỉ lệ
   bắt FN của luật mới.
3. Không đổi ngưỡng 30/20/2 cho đến khi có thêm dữ liệu FN (đặc biệt là
   phiên FN có slot1 FN ở vùng biên).
