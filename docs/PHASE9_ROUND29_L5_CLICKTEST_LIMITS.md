# Phase 9 đợt 29, luồng L5 — Click-test nốt: en 3 tầng + spinner dương + truy nguyên treo CDP — LIMITS

Ngày: 2026-10-31 (lượt cron 14:03, chạy thực tế buổi chiều theo giờ
Asia/Saigon). Luồng L5 trong đợt lớn round 29. KHÔNG push, KHÔNG
tag/release, KHÔNG binary vào repo, KHÔNG code giả, KHÔNG sửa code
sản phẩm (không phát hiện bug thật nào — mọi case đều pass trên UI
thật sau khi sửa tọa độ dò của chính harness, xem §2), KHÔNG stage
batch (parent gộp), KHÔNG tự ghi build-loop-log. Chỉ đo trên browser
thật (Chromium headed dưới Xvfb, pipe CDP, dpr = 1, 1920×1200).

Đóng nợ docs/PHASE9_ROUND28_L5_CLICKTEST_LIMITS.md §7: (1) mốc âm 3
tầng và mốc trước cửa sổ ở phiên en chưa bấm riêng, (2) hành vi
spinner dương của ô number chưa chứng minh được, (3) lần treo CDP
K6 lần 1 chưa có nguyên nhân gốc chắc chắn 100%.

## 0. Kết luận ngắn (không vượt số đo)

1. **En 3 tầng — PASS cả hai hướng, msg đúng từng chữ:** mốc âm "-1"
   ở chain 3 tầng (TOP-NEG3, E1) và mốc trước cửa sổ nhưng dương
   "9.9" ở cả 2 tầng (TOP-NEG2, E2) và 3 tầng (TOP-NEG3, E3) đều chặn
   bằng msg đúng từng chữ
   `The outer time is outside the leaf clip's visible window — not split.`
   (so với `en.json:776`) + toast chứa đúng câu đó, không key thô,
   không rò vi, spec không đổi, Ctrl+Z no-op, lá còn 1. Nợ (1) đã
   đóng hoàn toàn. Xem §1.
2. **Spinner dương — PASS, nút thật đã xác định bằng lưới 42 ô:**
   nút tăng ở y 30–45% chiều cao ô, nút giảm ở y 55–70%, cùng dải
   x cách mép phải 10–22px (ô 80×30 tại x≈1071). Xác nhận:
   10 → 11 → 12 (bước +1 đều) → 11 → 10, và ô rỗng + tăng → "1"
   (dương). Spec không đổi, Ctrl+Z no-op. Nợ (2) đã đóng; lần FAIL
   S1 đầu tiên chỉ là tọa độ dò của harness (y 75% nằm ngoài nút
   giảm), không phải bug sản phẩm — xem §2, ghi rõ không giấu.
3. **Treo CDP K6 — KẾT LUẬN: nhiễu hạ tầng thoáng qua, tin cậy cao
   nhưng không tuyệt đối 100%:** 5 lần chạy K6 chẩn đoán trong đợt
   29 (3 baseline + 2 guard) đều 0 timeout CDP, K4/K5 (2 case từng
   treo) pass 5/5, và chẩn đoán CDP-DIAG không kích hoạt lần nào
   (tức không có timeout để snapshot). Cộng dồn: 1 lần treo trong
   6 lần chạy K6 (đợt 28 lần 1 + chạy lại + đợt 29 ×5, trong đó lần
   treo duy nhất không có snapshot process và bundle đó đã mất).
   Không tái hiện được treo trong đợt 29 dù đã gắn chẩn đoán —
   đây là bằng chứng mạnh nhất từ trước tới nay cho hướng nhiễu,
   nhưng vẫn không loại trừ tuyệt đối vì thiếu snapshot gốc. Xem §3.
4. **Hồi quy — J6 17/17, K6 8/8 (guard mode):** J6 xanh toàn bộ trên
   bundle B1assKz-; K6 guard 8/8 ×2 lần. 3 lần K6 baseline 7/8 chỉ
   vì chạy sai mode của harness (xem §4 — lỗi của luồng này, đã
   sửa bằng 2 lần chạy guard, không phải bug sản phẩm).

## 1. En 3 tầng: mốc âm + mốc trước cửa sổ (E0–E3, E9)

Phiên en riêng (Chrome profile mới, `localStorage vcut-lang=en` đặt
trước reload, như K6). Fixture NEG của đợt 28 (top start=10 nên cửa
sổ khả kiến bắt đầu ở 10; "9.9" là trước cửa sổ nhưng vẫn dương).

| Case | Chain qua panel | Nhập | Msg + toast | Lá / spec / undo |
|---|---|---|---|---|
| E1-en-neg-three-level | TOP-NEG3 > A-NEG3 > B-NEG3 > lá | "-1" gõ trực tiếp CDP char, value "-1" ngay lần đầu | msg đúng từng chữ + toast đúng câu | Lá còn 1, spec không đổi, Ctrl+Z no-op |
| E2-en-before-window-two-level | TOP-NEG2 > MID-NEG2 > lá | "9.9" gõ CDP char | msg đúng từng chữ + toast đúng câu | Lá còn 1, spec không đổi, Ctrl+Z no-op |
| E3-en-before-window-three-level | TOP-NEG3 > A-NEG3 > B-NEG3 > lá | "9.9" gõ CDP char | msg đúng từng chữ + toast đúng câu | Lá còn 1, spec không đổi, Ctrl+Z no-op |

Câu msg đầy đủ, so từng chữ với `en.json:776`:
`The outer time is outside the leaf clip's visible window — not split.`
— cả 3 case msg đều bằng đúng chuỗi này (assert `===`, không chỉ
`includes`), toast chứa đúng câu, không chứa `nested.`, không chứa
marker vi (`Mốc`, `không tách`, `clip lá`, `quá sát mép`, `tổ tiên`,
`đang reverse`). E0: panel en liệt kê đủ 11 item. E9: 0
Runtime.exceptionThrown trong phiên en.

Cùng với L7 đợt 28 (mốc âm 2 tầng en) và L6 (guard rỗng en), nay mọi
hướng chặn ở cả 2 tầng và 3 tầng, cả vi và en, đều đã bấm thật.

## 2. Spinner dương của ô number (S1 + lưới S2) — và lần FAIL do harness

Ô mốc là `<input type="number" step="any">` controlled
(`NestedClipPanel.tsx:318-321`). S1 (script chính) dò nút tăng/giảm
bằng click thật: đặt "10" rồi click từng tọa độ ứng viên ở cạnh phải
ô (hover 400ms trước click để spinner UA hiện), đọc value thật.

**Lần chạy S1 đầu tiên FAIL — lỗi tọa độ dò, không phải bug app:**
dò tăng ở y 25% trúng (cách mép phải 11–20px → "11"), nhưng dò giảm
ở y 75% không trúng ô nào (value giữ "10"). Thay vì kết luận spinner
giảm hỏng, luồng này chạy thêm script dò lưới S2 (42 ô: 6 mức y × 7
mức x, reset "10" trước mỗi ô, đọc cả value và msg sau mỗi click để
phát hiện click trúng nút khác).

**Bản đồ spinner đo được (ô 80×30, x≈1071, panel en, bundle
BgUUZ_xW):**

| Vùng | y (theo % chiều cao ô) | x (cách mép phải) | Kết quả |
|---|---|---|---|
| Tăng | 30%, 45% | 10, 14, 18, 22px | "10" → "11" (8/8 ô) |
| Giảm | 55%, 70% | 10, 14, 18, 22px | "10" → "9" (8/8 ô) |
| Chết | 15%, 85% (mọi x); x cách mép 2, 6, 26px (mọi y) | — | value giữ "10", msg giữ null |

Tức nút spinner là dải rộng ~13px (x cách mép phải 10–22px), KHÔNG
sát mép phải (2–6px là vùng chết) và KHÔNG cao toàn bộ ô (15% trên
cùng và 15% dưới cùng là vùng chết; ranh giới tăng/giảm ở 50%).
Giải thích được cả 2 lần dò hụt trước đây: attempt 8 đợt 28 click ở
cách mép 6px (vùng chết); S1 đợt 29 dò giảm ở y 75% (nằm giữa 70%
còn trúng và 85% đã chết — mép dưới nút giảm nằm đâu đó trong
(70%, 75%]).

**Sau khi sửa S1 (giảm: y 75% → 65%), chạy lại script chính: PASS
toàn bộ:** dò tăng (y 25%) trúng ở cách mép 11–20px, dò giảm
(y 65%) trúng ở cách mép 11–20px; xác nhận 10 → 11 → 12 (bước +1
đều, đúng step mặc định của `step="any"`) → 11 → 10; ô rỗng +
tăng → "1" (dương, hữu hạn); spec không đổi sau autosave,
Ctrl+Z no-op. S2 xác nhận độc lập: 10 → 11 (tăng tại (1141,522))
→ 10 (giảm tại (1141,530)). Msg sau mọi click dò đều null — không
click nào trúng nút tách hay nút khác trong hàng (geometry hàng đã
đo: nút "Use playhead" ở x=1159, nút tách ở x=1277, đều ngoài dải
spinner).

Lưu ý trung thực: tọa độ spinner này đo trên Chromium headed dưới
Xvfb, cửa sổ 1920×1200, font/UA mặc định của VM — không khẳng định
pixel tuyệt đối trên máy user, chỉ khẳng định cơ chế spinner tăng/
giảm theo step hoạt động đúng qua đường UI thật.

## 3. Truy nguyên treo CDP K6 — 5 lần chạy chẩn đoán, 0 lần treo

Công cụ: bản sao script K6 (`clicktest-l5-round29-k6diag.mjs`) thêm
chẩn đoán vào đúng điểm timeout của `PipeCdp.send`: khi một lệnh CDP
quá hạn, log ngay trạng thái tiến trình Chrome (`proc.exitCode`,
`signalCode`, `killed`, số lệnh đang chờ) + snapshot `ps` các tiến
trình chrome — để phân biệt Chrome chết vs pipe tắc vs page hang.
Chẩn đoán này chỉ kích hoạt khi có timeout thật; nó không tự tạo
timeout.

| Lần chạy K6 chẩn đoán | Mode | Bundle | Kết quả | Timeout CDP | K4/K5 |
|---|---|---|---|---|---|
| Đợt 29 run 1 | baseline (sai mode, xem §4) | B1assKz- | 7/8 (chỉ K1) | 0 | PASS/PASS |
| Đợt 29 run 2 | baseline | B1assKz- | 7/8 (chỉ K1) | 0 | PASS/PASS |
| Đợt 29 run 3 | baseline | B1assKz- | 7/8 (chỉ K1) | 0 | PASS/PASS |
| Đợt 29 guard run 1 | guard | B1assKz- | 8/8 | 0 | PASS/PASS |
| Đợt 29 guard run 2 | guard | B1assKz- | 8/8 | 0 | PASS/PASS |

**Phân biệt nhiễu hạ tầng vs bug thật — những gì đã thử và kết quả:**
- *Tái hiện:* 5/5 lần chạy không tái hiện treo, kể cả khi cố tình
  chạy cùng một suite, cùng một đường en (K4/K5) từng treo. Nếu là
  bug thật ổn định theo code path, nó phải tái hiện ít nhất một
  lần trong 5 lần (đặc biệt khi K4/K5 đều đi qua đúng evaluate từng
  treo: K4 đọc autosave sau khi msg đúng, K5 drill đầu tiên).
- *Timeout CDP vs assert app fail:* trong cả 5 lần, 0 lệnh CDP nào
  timeout; mọi case fail duy nhất (K1 baseline) đều là assert
  harness-mode, không phải treo (xem §4).
- *Chrome chưa sẵn lúc load:* các lần chạy đợt 29 đều pipe OK trong
  ~2s sau khi spawn, không có lần nào `Target.attachedToTarget`
  chậm; RelinkPanel đóng bằng click thật bình thường ở mọi phiên.
- *Giới hạn suy luận (ghi rõ):* chẩn đoán CDP-DIAG chưa từng kích
  hoạt nên chưa có snapshot process nào lúc treo thật; lần treo gốc
  (đợt 28, bundle Dc8sHsbE) không có snapshot và bundle đó đã bị
  build đè nên không thể kiểm chứng giả thuyết "treo do bundle đó".
  Vì vậy kết luận dừng ở "nhiễu hạ tầng thoáng qua, tin cậy cao
  nhưng không tuyệt đối 100%", không claim đã chứng minh tuyệt đối.
  Hướng duy nhất còn lại để lên 100% là bắt được một lần treo có
  snapshot — nhưng săn nhiễu bằng cách chạy lặp vô hạn là uổng lượt
  (tiền lệ đợt 28 đã nêu); nếu parent muốn, có thể gắn CDP-DIAG
  thường trực vào harness hồi quy để lần treo sau (nếu có) tự để
  lại snapshot.

## 4. Hồi quy J6/K6 — và lỗi chạy sai mode của chính luồng này

- **J6 (split-intermediate): 17/17 PASS** trên bundle B1assKz-
  (J0–J15 đầy đủ: tách thành công 3 độ sâu + playhead + trung gian
  sâu + risky, 0 exception cả 2 phiên).
- **K6 guard mode: 8/8 PASS ×2 lần** trên cùng bundle B1assKz-
  (K0–K7 đầy đủ, 0 exception cả 2 phiên).
- **K6 baseline mode: 7/8 ×3 lần — LỖI CỦA LUỒNG NÀY, KHÔNG PHẢI BUG
  SẢN PHẨM:** 3 lần chạy đầu quên đặt `K6_EMPTY_MODE=guard` nên
  script chạy mode mặc định `baseline`, trong đó K1 kỳ vọng hành vi
  cũ (ô rỗng → msg OutOfRange). Sản phẩm trả đúng hành vi hiện tại
  là câu guard `Chưa nhập mốc ngoài (ô đang trống) — không tách.`
  — đúng câu mà L5/L6 đã khóa — nên K1 fail assert mode, còn 7 case
  còn lại (gồm K4/K5 từng treo) đều pass. Luồng này đã sửa bằng 2
  lần chạy guard 8/8; 3 JSON baseline được giữ lại làm bằng chứng
  (không ghi đè, không giấu), và tên file ghi rõ mode để parent
  không đọc nhầm thành "K6 fail 3 lần".

## 5. Không có bug sản phẩm mới — và những gì KHÔNG làm

- Không sửa code sản phẩm: toàn bộ case pass trên UI thật (sau khi
  sửa tọa độ dò của harness), không có hành vi app nào sai để fix.
  Không đụng `apps/web/dist/` (chỉ snapshot đọc), không đụng store,
  không đụng dict i18n.
- Không chạy `tsc`/`vite build` riêng: không đổi code sản phẩm nên
  không có gì để kiểm chứng thêm ở tầng đó (harness qua
  `node --check`; bundle đo là build của cây do luồng khác build).
- Không đo lại: I6 deep-leaf/ramp canvas, scrub ruler cho fixture
  NEG, máy thật / Safari / touch / dpr > 1 / viewport khác (toàn bộ
  đo là Chromium headed dưới Xvfb, raster phần mềm, dpr = 1).
- Lỗi splice của chính luồng này (ghi rõ, không giấu): lần chạy
  script chính đầu tiên fail 4 case vì khi tách script đợt 28 đã
  cắt mất 3 helper (`typeNegative`, `assertBlockedNoUndo`,
  `focusRowInputRect`) — đã khôi phục từ script đợt 28 và chạy lại
  6/6; lần chạy lỗi đó không được tính vào kết quả.

## 6. Harness, bundle đo và file đổi/thêm

- Harness mới: `apps/web/scripts/clicktest-l5-round29-pipe.mjs`
  (kế thừa infra đợt 28: pipe CDP + snapshot dist + seed qua
  autosave; thêm: case en E0–E3/E9, case spinner S1 với dò tọa độ
  2 hướng + xác nhận bước đều + spinner từ ô rỗng; cổng 4197,
  display :97).
- Harness dò lưới: `apps/web/scripts/clicktest-l5-round29-spinnerprobe.mjs`
  (lưới 6×7=42 ô + geometry hàng; cổng 4194, display :94).
- Harness chẩn đoán treo: `apps/web/scripts/clicktest-l5-round29-k6diag.mjs`
  (bản sao K6 + log CDP-DIAG lúc timeout; cổng 4198, display :98).
- Harness hồi quy J6: `apps/web/scripts/clicktest-l5-round29-j6.mjs`
  (bản sao J6 chỉ đổi tên file JSON ra, tránh ghi đè file gốc;
  cổng 4196, display :96).
- `node --check` cả 4 script: pass.
- Bundle đo (snapshot đầu mỗi lần chạy — dist đổi giữa chừng do các
  luồng round 29 khác build lại, xem §0):
  - L5 chính 6/6 + spinner probe 3/3: `index-BgUUZ_xW.js`,
    sha256[:16] = 5d8281a8245111f4. (Lần chạy chính đầu tiên, trước
    khi sửa S1, chạy trên bundle cũ hơn `index-DflQcJTM.js`
    sha256[:16] = 1cb1b54dc7671aee — kết quả lần đó không tính.)
  - K6 chẩn đoán ×5 + J6 17/17: `index-B1assKz-.js`,
    sha256[:16] = 7659cc3fb1474449.
- Kết quả JSON (parent quyết có stage hay không):
  - `benchmarks/results/v29-l5-clicktest.json` — 6/6
    (E0, E1, E2, E3, S1, E9).
  - `benchmarks/results/v29-l5-spinnerprobe.json` — 3/3
    (S2-row-geometry, S2-spinner-grid, S2-no-crash-en).
  - `benchmarks/results/v29-l5-regress-k6-run1.json` — 7/8 baseline
    (chỉ K1 sai mode; giữ làm bằng chứng).
  - `benchmarks/results/v29-l5-regress-k6-run2.json` — 7/8 baseline.
  - `benchmarks/results/v29-l5-regress-k6-run3.json` — 7/8 baseline.
  - `benchmarks/results/v29-l5-regress-k6-guard-run1.json` — 8/8.
  - `benchmarks/results/v29-l5-regress-k6-guard-run2.json` — 8/8.
  - `benchmarks/results/v29-l5-regress-j6.json` — 17/17.
- Scratch của luồng (`~/workspace/tmp-round29-l5/`,
  `tmp-round29-l5-probe/`, `tmp-round29-l5-k6diag/`,
  `tmp-round29-l5-j6/`) đã dọn cuối luồng, xác nhận bằng `ls`
  (chỉ còn scratch của các luồng round 29 khác, không đụng tới).
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub
  connector, KHÔNG stage (parent gộp batch).

## 7. Nợ còn lại (không mạo nhận đã xong)

- Nhánh `!isFinite` của guard panel và store vẫn không tới được qua
  UI (đợt 28 §3) — chỉ còn là phòng thủ; không có cách click-test nó
  mà không dùng JS setter (bị cấm vì đó không còn là đường UI).
- Treo CDP gốc vẫn thiếu snapshot process lúc treo nên kết luận
  dừng ở "tin cậy cao, không tuyệt đối" (xem §3); CDP-DIAG đã gắn
  sẵn trong script chẩn đoán để lần sau (nếu có) tự để lại bằng chứng.
- Tọa độ spinner đo trên Chromium VM (xem §2) — pixel tuyệt đối có
  thể khác trên máy user, chỉ cơ chế tăng/giảm theo step là đã khóa.
- D7 text-style (đợt 26 §6): seed L5 không có text leaf nên không đo
  lại; các phiên đợt 29 đều 0 exception nhưng đó không phải bằng
  chứng về D7.
