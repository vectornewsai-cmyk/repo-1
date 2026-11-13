# Phase 9 đợt 74 — luồng B8: gate FN lạnh, thu thêm dữ liệu xem lại ngưỡng 30

**Ngày:** 09/11/2026 (lượt cron 18:35 +07; đo 11:39–12:22 UTC).
**Trạng thái:** ĐO XONG — VERDICT: **GIỮ NGƯỠNG 30 (tạm thời)**; **re-gate LỌT FN
lần đầu trong phiên chuẩn** (delta 75 sau slot FN 1,79 fps) — nhưng **KHÔNG ĐỔI
ngưỡng vì dữ liệu FN/khỏe đã CHỒNG LẤN, không còn ngưỡng nào tách sạch**;
**FN gộp 7/37 slot (19%), Wilson [9%, 34%]**; **re-gate bắt 2/3 phiên FN**;
**FP 0/7, Wilson [0%, 35%]**. Không sửa code production, không sửa launcher/
analyzer/harness gốc. Không push (chỉ stage); không release/tag.

## 1. Kết luận (verdict)

| Câu hỏi | Trả lời |
|---|---|
| Có thêm phiên FN không? | **CÓ — 1 phiên FN chuẩn (B8-S1).** Slot 1 draw **1,79 fps** (presented 29,18 fps, mediaRate 1,012x) sau gate PASS delta 43. Đây là phiên FN thứ 3 trong chuỗi Y3+Z3+A6+B8 (sau Y3-S1, A6-S1). |
| Re-gate có bắt được FN mới không? | **KHÔNG — LỌT lần đầu.** Re-gate delta **75 ≥ 30 → PASS**, phiên tiếp tục. Verdict của chính harness: `FN = true \| re-gate PASS (delta 75) \| FN bị bắt = false`. Trước đây bắt 2/2, nay **2/3**. |
| Có phiên khỏe delta < 41 không? | **KHÔNG.** Phiên khỏe mới (B8-S2) re-gate delta **244** — khỏe min vẫn **41** (A6-S2). Trigger thứ hai của A6 §3 không xảy ra. |
| Ngưỡng 30 còn đúng không? | **GIỮ NGUYÊN (tạm thời) — nhưng với cơ sở đã đổi.** Delta FN nay là 18, 21, **75**; delta khỏe 41, 82, 137, 149, 228, 244, 273 → **FN max (75) > khỏe min (41): CHỒNG LẤN, không còn gap**. Muốn bắt FN 75 phải đặt ngưỡng ≥ 76, mà ngưỡng đó sẽ giết oan phiên khỏe A6-S2 (delta 41). Không có ngưỡng nào bắt được cả 3 FN mà không FP. 30 vẫn là điểm đặt tốt nhất hiện có: bắt được FN kiểu stall kéo dài (18, 21), FP 0/7. |
| Vì sao re-gate lọt FN này? | **Điểm mù cấu trúc, không phải do ngưỡng.** Xem §4: FN này là **cold-start slow-start** — element cần ~10–15 s sau seek-0 mới lên rs≥2; slot 1 (cửa sổ 10 s) bắt đúng pha lạnh, còn re-gate (cửa sổ 6 s, chạy SAU slot 1) đo cửa sổ đã ấm nên qua. Đổi ngưỡng không sửa được kiểu FN này — chỉ đổi thiết kế mới sửa được (vd re-gate đo cửa sổ lạnh, hoặc gate warmup dài hơn; xem §6, ngoài phạm vi luồng này). |
| FN lạnh có tái hiện không? | **CHƯA CÓ ĐÁP ÁN trong đợt này.** Cả 2 phiên lạnh thật (Chrome đầu tiên sau reboot 11:21 và 12:03) đều **chết ở gate 1a** (delta 3 và 3), không có số đo slot/re-gate. Không xác nhận cũng không bác bỏ được FN lạnh — chỉ biết phiên lạnh nay khó qua gate hơn buổi sáng (xem §5). |
| Resume-probe dưới tải thì sao? | **KHỎE cả 2 phiên.** Probe A/B draw 9,8–38,3 fps, presented ~30, rs=4 50/50, seeking 0 — không tái hiện stall đói-decoder kiểu Z3-S1. |

## 2. Kết quả đo thật — 2 phiên chuẩn hoàn chỉnh + 1 phiên diag + 4 lần chết ở gate

Clip `long1080.mp4` 20 s (h264 1080p 30 fps, GOP ~1,97 s), canvas preview backing
871×275, Chrome headed + Xvfb, VM 2 vCPU/8 GB. Cửa thứ hai BẬT, ngưỡng 30
(mặc định, không đổi).

| Phiên | Gate 1a (delta / load) | Slot draw fps (rep 1/2/3) | Re-gate (delta / load) | Verdict |
|---|---|---|---|---|
| **S1** (ấm, lần 5) | **43 PASS** (7,17 fps), load 4,11 | **1,79** / 10,40 / 10,29 (presented 29,18 / 29,82 / 29,96) | **75 PASS** (12,5 fps), load 5,85 | **FN, re-gate LỌT** |
| **S2** (ấm) | **62 PASS** (10,33 fps), load 5,88 | **31,15 / 35,63 / 34,82** (presented ~30,0) | **244 PASS** (40,67 fps), load 5,02 | Khỏe — không FN, không FP |
| diag1 (gate 60 s, KHÔNG chuẩn) | 263/60 s (đo 60 s) | **1,40** / 8,12 / 8,71 | **55 PASS** | FN, re-gate LỌT — chỉ quan sát, KHÔNG gộp |
| S1 lần 1 (lạnh thật, reboot 11:21) | **FAIL delta 3**, load 5,34 | — | — | Freeze ở gate (lần 5) |
| S1 lần 2 | **FAIL delta 14**, load 2,38 | — | — | Freeze ở gate (lần 6) |
| S1 lần 3 (lạnh thật, reboot 12:03) | **FAIL delta 3**, load 2,46 | — | — | Freeze ở gate (lần 7) |
| S1 lần 4 (máy lặng, load 0,24) | **FAIL delta 10**, load 0,24 | — | — | Freeze ở gate (lần 8) |

**Gộp Y3+Z3+A6+B8:** FN **4/28 slot** (Wilson 95% [6%, 31%]); phiên FN **3/10**;
re-gate bắt được **2/3**; re-gate FP **0/7** phiên không FN (Wilson [0%, 35%]).
**Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4: 9 slot, FN 3/9):** FN **7/37 slot (19%)**,
Wilson 95% **[9%, 34%]** (trước B8: 6/31, [9%, 36%] — tỉ lệ điểm không đổi,
khoảng tin cậy hẹp lại chút ít).

**Đọc đúng bảng:**
- S1 là phiên FN chuẩn đầu tiên mà re-gate lọt. Slot 1 draw 1,79 fps trong khi
  element trình chiếu tốt (presented 29,18 fps, mediaRate 1,012x, phRate
  0,993x) — đúng mẫu FN (draw đóng băng, element phát thật), nhưng cơ chế
  khác A6-S1: ở đây là slow-start sau seek-0 (xem §4), không phải rAF stall
  kéo dài. Slot 2–3 hồi phục (10,4 / 10,29 fps) nhưng vẫn thấp hẳn so với
  phiên khỏe (31–36 fps) — cả phiên S1 vẫn "chậm" (gapP50 rAF 66,7–100 ms).
- S2 là phiên khỏe nhất đợt này (slot 31–36 fps, re-gate 244, probe 33,6/38,3
  fps) — và nó chạy ở tải CAO HƠN S1 (load lúc gate 5,88 so với 4,11; lúc
  slot 5,3–4,4). Tương phản S1 ↔ S2 (cách nhau ~3 phút, cùng máy, cùng clip):
  slot 1 draw 1,79 ↔ 31,15 fps; gapP50 66,7 ↔ 16,7 ms; gate delta 43 ↔ 62.
  Slow-start là ngẫu nhiên theo lần chạy, không gắn với tải.
- 4 lần chết ở gate liên tiếp trước S1 (delta 3, 14, 3, 10) là chuỗi tệ nhất
  từ trước tới nay (Z3/A6 ~1/4 lần chạy chết ở gate). Lần 4 chết khi máy gần
  như lặng hoàn toàn (load 0,24, 0 tiến trình chrome khác) — tải bị loại làm
  nguyên nhân duy nhất. Nguyên nhân là slow-start ~10–15 s (xem §5): cửa sổ
  gate 6 s chỉ bắt được pha khởi động chậm.

## 3. Hiệu chuẩn ngưỡng re-gate: 30 GIỮ NGUYÊN, gap đã mất

Dữ liệu hiệu chuẩn (delta re-gate, tất cả phiên có JSON):

| Nhóm | n | Delta |
|---|---|---|
| Phiên FN | 3 | 18 (Y3-S1, stall do tải), 21 (A6-S1, rAF stall lạnh), **75 (B8-S1, cold-start slow-start)** |
| Phiên không FN | 7 | 41 (A6-S2, ấm+tải nặng), 82, 137, 149, 228, 244 (B8-S2), 273 |

- **Gap (21, 41] đã mất.** FN max 75 > khỏe min 41 → chồng lấn. Không còn
  ngưỡng nào tách sạch dữ liệu đã quan sát.
- **Giữ ngưỡng 30.** Cơ sở: (a) vẫn bắt được 2/3 FN đã quan sát (kiểu stall
  kéo dài 18, 21 — đúng kiểu FN mà cửa thứ hai được thiết kế để bắt, vì
  stall kéo dài thì re-gate cũng đo được stall); (b) FP vẫn 0/7, Wilson
  [0%, 35%]; (c) mọi ngưỡng khác đều tệ hơn: nâng lên ≥ 76 để bắt FN 75
  thì giết oan phiên khỏe delta 41 (và mọi phiên khỏe tương lai < 76);
  hạ xuống < 18 thì mất cả FN 18, 21. 30 là điểm cân bằng duy nhất còn
  đứng được trên dữ liệu chồng lấn này.
- **KHÔNG sửa production.** Mặc định launcher vẫn 30 (không đổi). Không đổi
  ngưỡng, không đổi gate, không đổi harness.
- **CẢNH BÁO MỚI — ngưỡng 30 nay chỉ là "tốt nhất trong các lựa chọn tệ":**
  nó không còn là điểm giữa của một gap tách sạch nữa. Tỉ lệ bắt FN của
  re-gate nay là 2/3 phiên (67%), và kiểu FN cold-start slow-start (2 lần
  quan sát: S1 chuẩn + diag) đều lọt. Nếu kiểu FN này chiếm đa số trong
  các phiên tới thì re-gate mất phần lớn giá trị — cần sửa THIẾT KẾ, không
  phải ngưỡng (xem §6).

## 4. Cơ chế FN mới — cold-start slow-start, re-gate đo cửa sổ ấm

Chuỗi diag gate 60 s (12:13–12:14 UTC, load 1,3–3,1, không chuẩn — chỉ quan sát):

| +t | el rs | ct | qTotal | draw | playhead | Đọc |
|---|---|---|---|---|---|---|
| +5 s | 1 | 3,03 | 42 | 6 | 5,57 | Element đang phát chậm (~0,6x), draw ~1 fps |
| +10 s | 1 | 10,13 | 109 | 10 | 10,67 | ct vọt (bắt kịp), nhưng rs vẫn 1, draw vẫn ~1 fps |
| +15 s | **4** | 15,45 | 271 | 34 | 15,70 | **Hồi phục**: rs 1→4, presented 32 fps, draw 4,8 fps |
| +20 s | 4 | 20,00 | 404 | 120 | 20,77 | Draw 17 fps — khỏe |
| +25 s | 4 | 20,00 | 404 | 263 | 24,00 | Hết timeline, draw 29 fps rồi dừng |

- Element cần **~10–15 s sau seek-0** mới lên rs≥2 và draw khỏe. Trong cửa sổ
  gate 6 s (chuẩn) và slot 1 (10 s), element vẫn ở rs=1 nên `decideVideoFrame`
  trả skip (rs<2 → không draw, trừ khi có held frame) — draw chỉ 1–2 fps
  dù element đã present ~29 fps. Đây là **khởi động chậm của decoder/buffer**,
  không phải rAF stall (khác A6-S1: ở đó rAF gapP50 133 ms; ở đây slot 1
  gapP50 66,7 ms, presented vẫn ~29 fps).
- Vì sao re-gate lọt: re-gate chạy SAU slot 1 — element đã chơi qua vùng
  0–10 s một lần, buffer cho vùng 0–6 s đã ấm → re-gate 6 s đo được draw
  55–75 (9–12,5 fps) và PASS. Slot 1 đo cửa sổ lạnh, re-gate đo cửa sổ ấm —
  **cửa thứ hai không bao giờ thấy được pha lạnh**. Đây là điểm mù cấu trúc:
  bất kỳ FN nào tự lành trong vòng ~1 cửa sổ đều lọt, bất kể ngưỡng.
- Diag tái hiện đúng mẫu trong phiên chuẩn S1 (slot 1: 1,79 fps; re-gate:
  75 PASS) — diag không phải artifact của cửa sổ 60 s: slot 1 của diag
  (1,40 fps) và của S1 chuẩn (1,79 fps) gần như giống hệt nhau, dù diag
  có warmup 60 s trước đó. Warmup dài không cứu được slot 1 vì slot 1
  seek-0 lại từ đầu — slow-start tái diễn sau mỗi seek-0.
- Resume-probe khỏe cả 2 phiên (S1: A 9,82 / B 9,94 fps, presented ~30,
  rs=4 50/50; S2: A 33,62 / B 38,32 fps) — stall đói-decoder Z3-S1 không
  tái hiện. Đối chứng tab trắng: presented 30,5 / 30,85 fps — element
  phát tốt khi visible.

## 5. Thiết kế thử nghiệm B8 (để đợt sau tái hiện hoặc bác bỏ)

- Tái sử dụng launcher Z3 NGUYÊN (`apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`,
  ngưỡng mặc định 30, re-gate BẬT) + analyzer Z3 NGUYÊN
  (`apps/web/scripts/analyze-72z3-gate-fn2.mjs`): KHÔNG sửa file nào trong
  repo ngoài doc LIMITS này. Config vite pre-create bằng script trích đúng
  template harness gốc (`/tmp/round74-b8/gen-vite-config2.mjs`, eval template
  literal + newline cuối — 1.726 byte, **md5 ca5b3c48afd54171d995e74cbadf7215,
  KHỚP A6**); launcher ghi log "config vite đã có sẵn đúng nội dung, bỏ qua
  ghi" ở mọi lần chạy (kể cả sau 2 lần reboot làm mất /tmp — phải tạo lại
  config, md5 vẫn khớp).
- Dry-run launcher trước đo: 27 thay thế OK, variant 53.246 byte (khớp Z3/A6).
- Analyzer: chạy lại trên dữ liệu Y3+Z3+A6 trước (tái hiện đúng số A6: FN 6/31
  [9%, 36%], FP 0/6 [0%, 39%], gap (21, 41]) rồi chạy bản copy trong /tmp
  có thêm thư mục B8 (chỉ đổi 2 hằng DIR + nhãn, logic giữ nguyên) để ra
  số gộp mới. Bản copy trong /tmp, không stage.
- Mỗi phiên chờ load 1-min < 2,0 và 5-min < 3,0 trước khi chạy (luật Y3) —
  ngoại lệ: lần 1 chạy ngay để giữ trạng thái lạnh (phiên Chrome đầu tiên
  sau reboot 11:21); lần 3 chạy ngay sau reboot 12:03 cũng vì lý do lạnh.
  Sau 2 lần chết ở gate, lần 4 chờ máy lặng thật (load 0,20) rồi chạy —
  vẫn chết ở gate (delta 10), chứng minh tải không phải nguyên nhân duy
  nhất. Lần 5 chạy ngay sau diag (máy ấm) thì qua gate.
- **Diag gate 60 s** (`/tmp/round74-b8/variant-diag.mjs`, bản copy của variant
  dry-run chỉ đổi `sleep(6000)` ở khối gate thành vòng lấy mẫu 5 s × 12):
  chạy 1 lần, thư mục `diag1-gate60s` (analyzer bỏ qua vì không bắt đầu
  bằng "session"). JSON 149.000 byte, exit 0. **KHÔNG gộp** vào thống kê
  (gate không chuẩn); chỉ dùng làm bằng chứng cơ chế + quan sát độc lập
  về điểm mù re-gate. Lưu ý: `gate1a.rateFps` 43,83 trong JSON diag là SAI
  (chia cho 6 trong khi cửa sổ là 60 s; đúng là 4,38 fps).
- FN = gate1a PASS + slot draw < 2 fps (tiêu chí Y3/Z3, analyzer tự tính).
  Phiên chết ở gate không có JSON → không gộp (4 lần trong đợt này).

## 6. Sự cố trong đợt (ghi trung thực)

1. **VM reboot 2 lần trong đợt (11:21 và 12:03 UTC):** /tmp bị xóa sạch cả 2
   lần (config vite, variant dry-run, bản copy analyzer, script gen config
   phải tạo lại; md5 config vẫn khớp A6 sau mỗi lần tạo lại). Reboot 11:21
   cắt ngang lần chờ load sau lần 2; reboot 12:03 cắt ngang lần chờ sau
   lần 2 (sleep bị kill). Không phải lỗi harness.
2. **4 lần chết ở gate liên tiếp (lần 1–4, delta 3/14/3/10):** xem §2/§5.
   Lần 1 và lần 3 là phiên Chrome đầu tiên sau reboot (lạnh thật) — cả hai
   đều chết ở gate, nên đợt này KHÔNG có phiên lạnh hoàn chỉnh nào.
3. **Load vọt trong phiên (luồng đợt 74 khác):** S1 load 0,56 lúc bắt đầu →
   7,24 lúc slot 3; S2 load 5,42 → 3,32. Sóng load không ngăn được phiên
   hoàn chỉnh khi máy đã ấm (S1 qua gate ở lần 5, S2 qua ngay lần đầu).
4. **Lần 1–2 bị nhiễu bởi luồng đợt 74 khác sửa code trực tiếp:** `preview.tsx`
   bị sửa lúc 11:40:52 UTC — đúng giữa lần 2 (11:40:18–11:41:14); `media.ts`/
   `store.ts` lúc 11:43:50, `codecProbe.ts` 11:42:44, `sampleMedia.ts`
   11:44:23. Lần 1 chạy trước các sửa đổi này (gate 11:39:58) nên lần 1
   không bị nhiễu code; lần 3–4 chạy sau các sửa đổi nhưng ở máy lặng và
   vẫn chết ở gate với cùng mẫu slow-start — không có bằng chứng một sửa
   đổi cụ thể nào gây ra slow-start (B9 chỉ chạm karaoke, B3 chỉ probe
   lúc import, fail-open). Nghi vấn còn mở, xem §7.
5. **Tee log diag hỏng (không mất dữ liệu):** `tee diag-run.log` báo lỗi vì
   thư mục `diag1-gate60s` chưa tồn tại khi tee mở file (variant tạo thư
   mục sau). Log console vẫn đầy đủ qua session capture + `presented-fps.log`
   trong thư mục diag (5.495 byte); đã ghi lại vào `b8-notes.txt`.

## 7. Giới hạn (trung thực)

- **n vẫn nhỏ:** chỉ **2 phiên chuẩn hoàn chỉnh** trong đợt này (1 FN + 1 khỏe)
  + 1 phiên diag (không chuẩn) + 4 lần chết ở gate (không số đo). Bắt FN nay
  2/3 phiên (Y3-S1 + A6-S1 bắt được; B8-S1 lọt); FP 0/7, Wilson [0%, 35%] —
  đã hẹp hơn [0%, 39%] nhưng vẫn rộng. Phiên FN 3/10.
- **Ngưỡng 30 nay đứng trên dữ liệu chồng lấn, không còn gap:** 30 chỉ còn
  là "điểm cân bằng tốt nhất" chứ không phải "điểm giữa gap". Mọi kết luận
  về ngưỡng đều tạm thời cho đến khi có thêm phiên — đặc biệt cần thêm
  phiên FN kiểu stall kéo dài (để xem 30 còn bắt được không) và phiên khỏe
  delta < 41 (để xem biên khỏe có sụt nữa không).
- **Chưa biết nguyên nhân gốc của slow-start ~10–15 s:** có từ bao giờ (chỉ
  biết buổi sáng A6 qua gate 2/2 trong 6 s, đợt này 4/5 lần đầu chết ở
  gate)? Do code đợt 74 (B3/B9 sửa đúng đường preview/media, nhưng chưa
  có bằng chứng nhân-quả), do reboot, hay do vite/Chrome cold cache?
  Chưa phân biệt được. Nợ mở cho đợt sau: đo thời gian tới rs≥2 sau seek-0
  trên cây code buổi sáng (nếu còn giữ) so với cây hiện tại, hoặc đo lại
  sau khi các luồng đợt 74 ngừng sửa file.
- **FN lạnh vẫn chưa có thêm dữ liệu:** 2 phiên lạnh thật đều chết ở gate.
  Phiên lạnh có số đo đầy đủ vẫn chỉ là 3 (V4-P1 FN, Z3-S1 không FN,
  A6-S1 FN) → 2/3. Chưa biết FN lạnh có cần điều kiện gì thêm, và chưa
  biết slow-start có phải là cùng một hiện tượng với FN lạnh V4-P1/A6-S1
  hay là chế độ riêng thứ ba (khác rAF stall A6-S1 và khác đói-decoder Z3-S1).
- **Diag không chuẩn:** mọi số từ diag (slot 1,40 fps; re-gate 55) chỉ là
  quan sát hỗ trợ, không gộp vào thống kê. Nếu gộp cả diag thì FN thành
  5/31 slot và FN delta thành 18, 21, 55, 75 — kết luận chồng lấn vẫn giữ
  nguyên, nhưng số gộp sẽ không còn là "chuẩn" nữa nên không gộp.
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb, clip
  long1080 20 s, canvas 871×275) trong buổi có sóng load từ 8–10 luồng song
  song + 2 lần reboot + các luồng khác sửa code trực tiếp. Số trên máy
  thật/khác clip sẽ khác — nhưng verdict về điểm mù re-gate là về THIẾT KẾ
  (đo cửa sổ ấm sau slot 1), không phải về con số tuyệt đối.
- **Không sửa gì trong production:** harness gốc không đổi; launcher +
  analyzer Z3 không đổi; gate 6 s không đổi; ngưỡng mặc định vẫn 30; không
  push (chỉ stage); không release/tag. File `.cjs` config vite, variant
  dry-run/diag, script gen config, bản copy analyzer và log phân tích trong
  /tmp (mất khi reboot — không stage, không phải deliverable); ảnh
  `r8-presented-done.png` (binary) không stage. Không chạy tsc (không đụng
  code).

## 8. File và log

- Doc này: `docs/PHASE9_ROUND74_B8_GATE_FN_LIMITS.md`.
- Launcher (tái sử dụng, không sửa): `apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`
  — dry-run 27 thay thế OK, variant 53.246 byte; chạy 5 lần chuẩn (4 lần
  chết ở gate + 1 phiên hoàn chỉnh S1) + 1 phiên S2 hoàn chỉnh.
- Script phân tích (tái sử dụng, không sửa): `apps/web/scripts/analyze-72z3-gate-fn2.mjs`
  — chạy lại trên Y3+Z3+A6 tái hiện đúng số A6; bản copy có thêm B8 trong
  `/tmp/round74-b8/analyze-74b8.mjs` (không stage) cho số gộp mới.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round74-b8.md`
  + `hidden_files/round74-b8/b8-notes.txt`.
- Log đo: `hidden_files/round74-b8/session1/` (phiên chuẩn hoàn chỉnh S1:
  `presented-fps.json` 147.681 byte + đủ log/png/notes; `session1-attempt1/`
  … `session1-attempt4/`: 4 lần chết ở gate, chỉ log),
  `session2/` (phiên chuẩn hoàn chỉnh S2: `presented-fps.json` 146.844 byte
  + đủ log/png/notes), `diag1-gate60s/` (phiên diag: `presented-fps.json`
  149.000 byte + đủ log/png).
  Kết quả phân tích gộp: `/tmp/round74-b8/analyze-pooled.txt` (tmpfs, mất khi
  reboot); baseline Y3+Z3+A6: `/tmp/round74-b8/analyze-baseline.txt`.
- Không stage: config vite `.cjs` trong /tmp (file sinh ra), ảnh
  `r8-presented-done.png` (binary), log luồng + log đo (goal workspace, không
  phải repo), script gen config + variant diag + bản copy analyzer trong /tmp.
