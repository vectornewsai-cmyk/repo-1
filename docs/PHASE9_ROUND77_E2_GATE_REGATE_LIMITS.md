# Phase 9 đợt 77 — luồng E2: gate re-gate giết oan — xác nhận thứ hai (slot-1 FN)

Ngày: 09/11/2026. Nợ gốc: đợt 76 §4.2 (D5) — 3/5 lần re-gate giết phiên từ
trước tới nay là GIẾT OAN (phiên khỏe chết ở re-gate: C4-S3 delta 4,
D5-S2 delta 27 tải thấp, D5-S3 delta 18 dưới sóng tải). Nhiệm vụ: xem lại
ngưỡng re-gate — (a) tách ngưỡng theo tải, (b) nâng ngưỡng re-gate riêng,
hoặc (c) thêm điều kiện xác nhận thứ hai trước khi giết — và đo lại trên
phiên gate thật.

## 1. Kết luận (verdict)

**CHỌN (c): thêm điều kiện xác nhận thứ hai — GIẾT ⟺ re-gate FAIL (delta
< 30) ∧ slot 1 là FN (draw < 2 fps, slot hợp lệ).** Ngưỡng re-gate GIỮ
NGUYÊN 30; ngưỡng gate chính GIỮ NGUYÊN 20; ngưỡng FN GIỮ NGUYÊN draw
< 2 fps (tiêu chí Y3/Z3).

- **FP kiểm duyệt (slot-1-only) — thước đo trực tiếp của "giết oan" theo
  thông tin có lúc quyết định: luật cũ 1 → luật mới 0 trong 4 phiên E2**
  (S1: luật cũ giết, luật mới tha). Cộng với hồi quy 16 phiên chuẩn lịch
  sử: luật cũ FP 3/12 → luật mới FP 0/12, bắt FN không đổi 3/4.
- **FP ground-truth đầy đủ (3 slot): luật cũ 0 → luật mới 0** (không có
  phiên E2 nào không-FN bị giết; gộp mọi đợt: 0/12 phiên không FN,
  Wilson 95% [0%, 24%]).
- **Cái giá, ghi rõ không giấu: bắt FN sớm GIẢM ở nghĩa giết-sớm.**
  Trong 4 phiên E2, phiên FN duy nhất (S1) có slot 1 KHÔNG FN (2.92 fps)
  nên luật mới tha nó; luật cũ đã giết nó ngay sau slot 1. Theo hạch
  toán lúc quyết định (chỉ slot 1): đó là FP tránh được. Theo ground
  truth đầy đủ (3 slot): phiên LÀ FN (slot 2: 0.39 fps, slot 3: 1.87
  fps) nên luật cũ "bắt đúng" còn luật mới "lọt" ở nghĩa giết-sớm.
  **Nhưng FN không mất khỏi dữ liệu:** phiên chạy tiếp, slot 2–3 +
  resume-probe đều ghi lại đầy đủ; chỉ tốn thêm ~40 s đo thay vì giết
  sớm. Xem §4 để hiểu vì sao đây là đánh đổi đúng, và vì sao KHÔNG
  được "vá" bằng cách hạ ngưỡng FN slot-1 sau 1 mẫu.
- **Khuyến nghị: NÂNG launcher E2 thành harness chuẩn thay Z3 từ đợt sau**
  (cờ `E2_REGATE_CONFIRM=0` giữ lại để A/B về luật cũ khi cần). Lý do:
  luật mới loại bỏ FP theo cấu trúc (không thể giết phiên có slot 1
  khỏe), trong khi FN vẫn được đo đầy đủ và vẫn bị "bắt" ở nghĩa ghi
  nhận (phiên FN được gắn cờ FN trong JSON, chỉ không bị giết sớm).
  Điều kiện: giữ nguyên ngưỡng 30 và ngưỡng FN 2 fps; không đổi gì thêm
  cho tới khi có ≥ 10 phiên E2 nữa.

## 2. Ba phương án — vì sao (a) và (b) bị loại (bằng số, không bằng cảm giác)

### (a) Tách ngưỡng re-gate theo tải — LOẠI
- FP D5-S2 (delta 27) xảy ra ở tải THẤP (1-min 2.80) — tải không giải
  thích được nó. FN A6-S1 (delta 17) ở tải 9.89, trong khi phiên khỏe
  D5-S2 delta 27 ở tải 2.80: tải cao có FN nhỏ, tải thấp có khỏe nhỏ —
  không có đường tách theo tải.
- Thêm nữa, trong đợt E2: S1 re-gate FAIL delta 2 ở tải 1.08 (thấp);
  Z3-control (21:54) re-gate FAIL delta 20 ở tải 11.85 (cao); S3
  re-gate PASS delta 49 dưới burner. Tải không dự báo được FAIL/PASS.

### (b) Nâng ngưỡng re-gate riêng (giữ gate chính 30) — LOẠI
- Khoảng (21, 27] chỉ "cứu" thêm đúng 1 phiên lịch sử (D5-S2 delta 27)
  so với ngưỡng 30, và không sửa được vấn đề cấu trúc: delta FN max 75
  vẫn nằm trên mọi ngưỡng hợp lý. Xem §7: delta FN (n=5) 2, 17, 18, 21,
  75; delta khỏe (n=15) 4, 18, 27, 41, 44, 49, 52, 82, 137, 149, 191,
  206, 228, 244, 273 — CHỒNG LẤN hoàn toàn, không có ngưỡng tách sạch.
  Nâng ngưỡng chỉ đổi chỗ FP/FN, không giảm tổng lỗi.

### (c) Xác nhận thứ hai = slot 1 phải FN — CHỌN
- Slot 1 là cửa sổ đo chính (10 s) và đã biết TRƯỚC khi quyết định
  re-gate; re-gate chỉ là cửa sổ 6 s nhiễu slow-start lớn. Dùng slot 1
  làm xác nhận là dùng phép đo tốt hơn để kiểm chứng phép đo nhiễu hơn.
- Hai cửa sổ 6 s liên tiếp (AND) bị loại: cắt FP nhưng cũng cắt bắt FN
  (~75% → ~56% nếu độc lập), vi phạm "không làm FN lọt nhiều hơn".
- Các tín hiệu đơn-cửa-sổ khác đã kiểm tra trên mọi JSON phiên cũ và
  đều không tách được: ct cuối cửa sổ ~6.5 s ở mọi phiên; rs 1↔4 chồng
  lấn; presented slot FN 4.6–29.2 fps vs khỏe 20.5–30 fps; qTotal cuối
  re-gate FN 334–676 vs khỏe 483–755.

## 3. Implement — chỉ 4 file, không động vào code sản phẩm

- `apps/web/scripts/gate-regate-confirm.mjs` (mới, thuần):
  `decideRegateKill({regateDelta, threshold=30, gateOn, confirmOn, slot1})`
  → `{regateFail, oldKill, kill, sparedByConfirm, slot1Fn, reason}`;
  `isSlotFn` (slot hợp lệ + drawFps < 2); `FN_DRAW_FPS = 2`. Một nguồn
  thật duy nhất cho cả variant đo lẫn test unit.
- `apps/web/scripts/measure-77e2-gate-regate2-launcher.mjs` (mới, copy Z3):
  đọc nguyên văn `gate-regate-confirm.mjs`, bỏ tiền tố `export `, inject
  vào variant; điều kiện giết thành `if (e2.kill)`; log `E2-REGATE` /
  `E2-SPARED` / `E2-VERDICT` so sánh luật cũ/mới từng phiên; JSON gate1b
  thêm `e2Confirm, slot1Draw, slot1Valid, slot1Fn, oldKill, newKill,
  sparedByConfirm, e2Reason`; `z3` thêm `e2RegateConfirm`. Cổng 5574/9674,
  `/tmp/round77-e2`. `E2_DRY_RUN` / `E2_DRY_RUN_FILE`; `E2_REGATE_CONFIRM=0`
  về đúng luật cũ (để A/B). Dry-run: 27 thay thế OK, variant 58.060
  byte, `node --check` OK; đúng 1 định nghĩa + 1 chỗ gọi `decideRegateKill`,
  không còn điều kiện giết cũ.
- `apps/web/scripts/test_round77_e2_regate_confirm.test.mjs` (mới):
  `node --test` → **10/10 PASS**, gồm hồi quy toàn bộ 16 phiên chuẩn
  lịch sử (luật mới bắt FN 3/4, FP 0/12 — giống hệt luật cũ ở bắt FN,
  tốt hơn ở FP).
- Khối gate 1a trong variant E2 đã xác minh **giống hệt byte** với variant
  Z3 (diff dry-run 21:31 UTC: chỉ khác +98/−15 dòng ở header/thư mục/
  cổng/khối re-gate/dòng verdict). Xem §6 về hệ quả của việc này.
- Không sửa `render.js`, `preview.tsx`, `vi/en.json` hay bất kỳ code sản
  phẩm nào. Không cần chạy `tsc` (chỉ script + doc; D5/C4 cũng không
  chạy tsc).

## 4. Kết quả đo thật — 4 phiên chuẩn E2 + 3 phiên đối chứng Z3

### 4.1 Bảng phiên E2 (ngưỡng re-gate 30, cửa BẬT, xác nhận BẬT)

| Phiên | Gate 1a delta | Slot draw fps (1/2/3) | Re-gate delta | Luật cũ | Luật mới | FN? |
|---|---|---|---|---|---|---|
| S1 = session1-attempt3 (21:11–21:21Z) | 26 PASS | 2.92 / 0.39 / 1.87 | 2 FAIL | GIẾT | THA (spare-slot1-not-fn) | CÓ (slot 2+3) |
| S2 = session2-attempt7 (22:07–22:10Z) | 53 PASS | 28.67 / 29.09 / 32.40 | 206 PASS | tha | tha | không |
| S3 = session3 burner (22:10–22:13Z) | 53 PASS | 6.29 / 30.41 / 29.98 | 49 PASS | tha | tha | không |
| S4 = session4 (22:13–22:15Z) | 46 PASS | 26.63 / 28.98 / 27.24 | 191 PASS | tha | tha | không |

Chi tiết từng phiên (xem `e2-notes.txt` trong thư mục phiên):

- **S1 (FN, tha):** tải thấp suốt phiên (~1.0–1.3) → FN KHÔNG do tải
  (kiểu A6-S1). Resume-probe A draw 0.36 fps, rs=1 37/50, seeking 37/50;
  probe B 0.44 fps, seeking 25/50 — stall đói-decoder ở cả hai probe.
  Đối chứng tab trắng: presented 6.05 fps, mediaRate 0.182x — TỆ NHẤT
  từ trước tới nay, NHƯNG tải lúc đối chứng 23.79 (sóng tải vọt đúng
  lúc) nên số này nhiễm tải, không dùng để kết luận decoder. exit 0.
- **S2 (khỏe, tải thấp):** sau reboot VM (uptime 3 phút; /tmp bị xóa →
  config vite md5 MISSING lúc check, launcher ghi lại từ template; xác
  minh sau phiên md5 `ca5b3c48afd54171d995e74cbadf7215` — KHỚP). Probe A
  29.77 fps, rs=4 50/50; probe B 30 fps. Đối chứng 24.02 fps / 30.9.
  exit 0.
- **S3 (khỏe dưới burner):** burner 2 busy-loop bật sau gate 1a, tắt sau
  re-gate. Slot 1 draw 6.29 fps (chậm do burner, so với S2 28.67) nhưng
  KHÔNG FN; presented vẫn 29.57. Slot 2 hồi ngay 30.41 fps sau khi tắt
  burner — xác nhận burner là nguyên nhân slot 1 chậm. **Burner KHÔNG
  đủ mạnh để gây FAIL re-gate** (PASS delta 49): S3 không tái hiện được
  FP-dưới-tải kiểu D5-S3; FP-dưới-tải vẫn chỉ có bằng chứng lịch sử.
  Lưu ý: load 1-phút không vọt (0.93–1.10) vì cell VM giới hạn 1,5 CPU
  chia sẻ — hiệu ứng burner thấy ở draw fps, không ở loadavg.
- **S4 (khỏe, tải thấp):** probe A 29.76 fps, B 27.71 fps; đối chứng
  22.82 fps / 30.9. exit 0.

### 4.2 Trước → sau (analyzer `tools/analyze-77e2.mjs`, xem §1/§1b)

**Riêng đợt E2 (4 phiên):**
- Phiên FN: 1/4. Bắt FN (giết sớm): luật cũ 1/1 → luật mới 0/1 — GIẢM
  (xem §1: chỉ mất giết sớm, FN vẫn đo đầy đủ).
- FP kiểm duyệt (slot-1-only): luật cũ 1 → luật mới 0.
- FP ground-truth đầy đủ: luật cũ 0 → luật mới 0.
- Phiên được luật mới tha khỏi giết oan: 1 (S1).

**Gộp mọi đợt (Y3+Z3+A6+B8+C4+D5+E2, 20 phiên chuẩn):**
- FN 7/50 slot (14%); phiên FN 5/20; luật cũ bắt được 4/5.
- Re-gate FP (ground truth đầy đủ): 0/12 phiên không FN, Wilson 95%
  [0%, 24%].
- Re-gate FP (phiên CHẾT ở re-gate, chỉ slot 1 làm ground truth — kiểm
  duyệt): 3/3 (C4-S3, D5-S2, D5-S3 — các phiên bị giết nên không có slot
  2–3 để xác nhận đầy đủ).
- FN (slot) Wilson 95% [7%, 26%]; sau Y3: FN 10/59 slot (17%), Wilson
  [9%, 28%]. FN là hiện tượng theo PHIÊN (tập trung ở phiên lạnh/tải),
  không phải theo slot độc lập.

### 4.3 Đối chứng Z3 trong cùng cửa sổ (launcher Z3 gốc, KHÔNG gộp vào E2)

| Đối chứng | Gate 1a delta | Slot 1 draw | Re-gate delta | Kết quả |
|---|---|---|---|---|
| 21:53:58Z | 25 PASS | 4.07 fps | 20 FAIL | Luật cũ GIẾT phiên khỏe (exit 1) — **FP kiểm duyệt thứ 4**, luật mới đã tha |
| 22:01:41Z (control1) | 49 PASS | ~4.1 fps | 182 PASS | exit 0, phiên đầy đủ |
| 22:03:54Z (control2) | 51 PASS | 24.06 fps | 154 PASS | slot 24.06/26.34/21.76 — khỏe; **bị cắt ở resume-probe bởi restart runtime** (không có JSON; dữ liệu slot trong log đầy đủ) |

- Đối chứng 21:54 chứng minh **luật cũ VẪN đang giết phiên khỏe ngay
  trong buổi đo E2** — vấn đề FP là thật và đang diễn ra, không phải
  chuyện lịch sử.
- Z3CONTROL3 chưa từng chạy (vòng lặp đối chứng chết ở control2 do
  restart runtime).

## 5. Vì sao KHÔNG "vá" S1 bằng cách đổi ngưỡng FN slot-1

S1 có slot 1 = 2.92 fps — chỉ hơn ngưỡng FN 0,92 fps — trong khi slot
2–3 là FN. Cám dỗ: hạ ngưỡng FN xuống < 3 fps, hoặc thêm điều kiện
presented < 16 fps, để luật mới "bắt" S1. **Không làm, vì đó là
overfitting trên n=1:**
- Với 1 mẫu, mọi ngưỡng "vừa khít" S1 đều là bịa sau khi thấy dữ liệu.
  D5 đã cảnh báo đúng điều này.
- Ngưỡng FN 2 fps là tiêu chí Y3/Z3 đã dùng cho mọi phiên lịch sử; đổi
  nó vì 1 phiên sẽ làm mất khả năng so sánh với toàn bộ lịch sử.
- Hướng đúng (để đợt sau): thu thêm phiên FN có slot 1 gần ngưỡng, rồi
  mới xem xét tín hiệu xác nhận thứ hai tốt hơn (ví dụ: presented-rate
  của slot 1, hoặc re-gate delta + slot-1 draw kết hợp). Cần ≥ 10 phiên
  E2 nữa trước khi kết luận.

## 6. Chuỗi chết gate 8/10 — sự cố lớn nhất của đợt (ghi trung thực)

### 6.1 Tally
10 lần thử E2, 8 lần CHẾT ở gate 1a (exit 2), 2 lần qua:
- Chết: delta 2, 2, 7, 2, 12, 2, 2, 5 (qTotal 18–54, ct 1.567–7.667,
  tải tại gate 0.38–15.16 — cả tải thấp lẫn cao).
- Qua: delta 26 (S1, 21:18), delta 53 (S2, 22:08).
- Các lần chết tập trung 21:00–21:58; các lần qua sau 22:07 (sau reboot).
  Z3 đối chứng qua gate 3/3 trong 21:54–22:05 (delta 25, 49, 51).

### 6.2 Đã loại trừ
- **Không phải do code E2:** khối gate 1a trong variant E2 giống hệt
  byte với variant Z3 (§3); diff trực tiếp 2 launcher: khác biệt duy
  nhất trước gate là cổng/thư mục + inject hàm thuần (đánh giá 1 lần lúc
  import, không có side effect). Không có cơ chế code nào khiến gate
  chết nhiều hơn.
- **Không phải do tải:** chết ở tải 0.38 (attempt5) lẫn 15.16
  (attempt2); qua ở tải 10.46 (Z3-control 21:54).
- **Không phải do RAM (giả thuyết đã yếu đi):** attempt6 chết ở RAM
  2062 MB available + tải 1.33 + mount nhanh (24 s); attempt5 chết ở
  758 MB. RAM không tách được chết/khỏe.
- **Không phải rò rỉ tiến trình:** đã kiểm tra ps sau mỗi lần chết —
  không có chrome/vite nào của E2 còn sót.

### 6.3 Còn lại: trạng thái máy không dừng (non-stationary) + nhiễu giữa các luồng
- Máy biến động mạnh theo từng phút: slot draw 0.39–2.92 fps (S1,
  21:18) → 24–26 fps (Z3-control2, 22:04) → 28–32 fps (S2/S4, sau
  reboot 22:05). Cùng một harness, cùng một clip, hiệu năng chênh nhau
  ~10 lần trong vòng 1 giờ.
- Chênh lệch thô E2 2/10 qua gate vs Z3 3/3: Fisher một phía p ≈ 0.035.
  **Con số này KHÔNG kết luận được launcher gây chết gate**, vì so sánh
  bị nhiễu thời gian hoàn toàn: E2 chạy tập trung 21:00–21:58 (giai đoạn
  xấu), Z3 chạy 21:54–22:05 (giai đoạn máy nhanh lên + reboot 22:05).
  D5/B8 đã từng ghi chuỗi chết gate (B8: 4 lần liên tiếp rồi qua; D5:
  3/6 chết) — hiện tượng này có tiền lệ, không phải mới.
- Nghi phạm môi trường chưa xác định được (không đo được tại thời điểm
  gate): job bgremove (~1,1 GB RSS) + ffmpeg + Chrome của luồng đợt 77
  khác + 2 tiến trình `yes` (burner của luồng khác) chạy xen kẽ trong
  cửa sổ 21:00–22:00; VM reboot ~22:05 (uptime 3 phút lúc 22:07).
- **Đề xuất cho đợt sau: chạy xen kẽ E2/Z3 (luân phiên từng phiên) thay
  vì chạy dồn một launcher rồi mới đổi** — chỉ có xen kẽ mới tách được
  hiệu ứng launcher khỏi hiệu ứng thời gian.

### 6.4 Sự cố khác
- **Runtime restart ~22:05 UTC:** giết vòng lặp đối chứng Z3 giữa
  control2 (mất JSON control2; dữ liệu slot còn trong log) và reboot VM
  (uptime 3 phút lúc 22:07; /tmp bị xóa → config vite phải ghi lại;
  md5 sau đó khớp). Không mất dữ liệu E2 (S1/S2 JSON đã ghi trước đó).
- **Các timer `sleep` cũ:** một số timer kiểm tra log từ đầu buổi giao
  kết quả muộn (đã xử lý: chỉ là log tail đã biết, không chạy lại).

## 7. Hiệu chuẩn ngưỡng re-gate — GIỮ 30

- Delta re-gate phiên FN (n=5): 2, 17, 18, 21, 75.
- Delta re-gate phiên không FN (n=15): 4, 18, 27, 41, 44, 49, 52, 82,
  137, 149, 191, 206, 228, 244, 273.
- Max delta FN (75) > min delta khỏe (4) — chồng lấn, không có ngưỡng
  tách sạch. Ngưỡng 30 vẫn nằm trong khoảng lịch sử và không phải là
  nguyên nhân của FP (nguyên nhân là re-gate tự kết án bằng cửa sổ 6 s
  nhiễu — luật xác nhận mới sửa đúng chỗ này). Không đề xuất đổi ngưỡng.

## 8. Giới hạn (trung thực)

- **n nhỏ:** chỉ 4 phiên E2 (1 FN, 3 khỏe). Kết luận "FP kiểm duyệt 1 →
  0" dựa trên đúng 1 lần tha (S1) + hồi quy lịch sử 16 phiên. Khoảng tin
  cậy Wilson cho FP đầy đủ vẫn rộng ([0%, 24%]) — chưa đủ mẫu để nói
  FP = 0 thật.
- **Chưa có FP-dưới-tải mới:** S3 (burner) không tái hiện được FAIL
  re-gate dưới tải (PASS delta 49). FP-dưới-tải vẫn chỉ có bằng chứng
  lịch sử D5-S3. Burner 2 busy-loop trong cell 1,5 CPU không đẩy được
  loadavg lên cao — cần burner mạnh hơn hoặc chờ sóng tải thật của luồng
  khác để kiểm chứng lại.
- **Chưa có FN có slot-1 FN trong đợt E2:** chưa quan sát được trường
  hợp luật mới GIẾT (re-gate FAIL ∧ slot-1 FN) trên launcher E2 thật —
  chỉ có trong test unit + hồi quy lịch sử (3/4 FN). Lần giết thật đầu
  tiên của luật mới vẫn chưa xảy ra.
- **Chết gate 8/10 làm chậm đợt:** ~1 giờ đầu buổi chỉ thu được 1 phiên
  chuẩn (S1). Nếu đợt sau cũng gặp giai đoạn xấu tương tự, cần ngân sách
  thời gian cho retry, hoặc chạy xen kẽ để phát hiện sớm.
- **So sánh E2/Z3 bị nhiễu thời gian** (§6.3) — không kết luận launcher
  E2 chậm/nhanh hơn Z3 ở gate.
- **Chưa test:** `E2_REGATE_CONFIRM=0` (về luật cũ) chưa chạy thật trên
  launcher E2 trong đợt này (chỉ dry-run + test unit); A/B thật để đợt
  sau nếu cần.
- **Không release/tag** (release gate vẫn giữ). Không push (chỉ stage).

## 9. File và log

**Stage (KHÔNG push):** `~/workspace/repo-1-push/paths-loop/phase9-round77-e2-gate-regate.txt`
- `apps/web/scripts/gate-regate-confirm.mjs` (mới)
- `apps/web/scripts/measure-77e2-gate-regate2-launcher.mjs` (mới)
- `apps/web/scripts/test_round77_e2_regate_confirm.test.mjs` (mới)
- `docs/PHASE9_ROUND77_E2_GATE_REGATE_LIMITS.md` (mới — file này)

**Không stage:** variant `/tmp` (sinh lại mỗi lần chạy), `r8-presented-done.png`
(binary), log/notes/tools trong goal workspace (nội bộ).

**Log luồng:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round77-e2.md`
**Phiên + notes:** `hidden_files/round77-e2/session{1-attempt3,2-attempt7,3,4}/`
(`e2-notes.txt` từng phiên; các attempt chết gate chỉ có `e2-run.log` +
`e2-notes.txt`, không có JSON)
**Đối chứng:** `hidden_files/round77-e2/z3control{,1,2}/`
**Analyzer:** `hidden_files/round77-e2/tools/analyze-77e2.mjs` → output cuối
`/tmp/round77-e2/analyze-final.txt`
**Kiểm chứng cuối:** `node --test test_round77_e2_regate_confirm.test.mjs` →
10/10 PASS (chạy lại 22:16 UTC).
