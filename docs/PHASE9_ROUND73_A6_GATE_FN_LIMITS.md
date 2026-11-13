# Phase 9 đợt 73 — luồng A6: theo dõi FN lạnh ở phiên lạnh sau reboot + cập nhật thống kê gộp

**Ngày:** 09/11/2026 (lượt cron 15:35 +07; đo 08:44–08:58 UTC).
**Trạng thái:** ĐO XONG — VERDICT: **FN LẠNH TÁI HIỆN + RE-GATE BẮT ĐÚNG LẦN ĐẦU
Ở NGƯỠNG THẬT**; **ngưỡng 30 GIỮ NGUYÊN (tạm thời)**; gap hiệu chuẩn thu hẹp
(18, 82] → (21, 41]; **FN gộp 6/31 slot, Wilson [9%, 36%]**; **re-gate bắt
2/2, FP 0/6, Wilson [0%, 39%]**.
Launcher + analyzer Z3 tái sử dụng NGUYÊN (không sửa); harness gốc KHÔNG đổi;
gate 6 s KHÔNG đổi; không sửa code production. Không push (chỉ stage);
không release/tag.

## 1. Kết luận (verdict)

| Câu hỏi | Trả lời |
|---|---|
| FN lạnh có tái hiện không? | **CÓ — lần đầu kể từ V4-P1.** Session1 (phiên Chrome đầu tiên sau reboot 08:19 UTC, load thấp 0,82–1,59): slot 1 draw **0,77 fps** trong khi element phát thật (presented 13,47 fps, phRate 0,981x, mediaRate 0,75x, rs=4, 140 frame presented, dropped 0). |
| Re-gate có bắt được FN lạnh không? | **CÓ — lần đầu tiên ở ngưỡng thật.** Re-gate delta **21 < 30 → FAIL → phiên chết** (exit 1 theo thiết kế, JSON ghi `z3.killedByRegate=true`). Z3 §7 ghi "phiên chết vì re-gate FAIL ở ngưỡng thật với ground truth FN đầy đủ thì chưa có lần nào" — nay đã có. |
| Ngưỡng 20 cũ có bắt được không? | **KHÔNG.** Delta 21 ≥ 20 → ở ngưỡng cũ re-gate đã PASS oan, phiên tiếp tục với slot rác. Ngưỡng 30 chứng minh giá trị đúng ở vùng 20–30 mà Z3 §3 đã cảnh báo. |
| Ngưỡng 30 có giết oan phiên khỏe không? | **KHÔNG — 0/6 phiên không FN** (thêm session2-attempt2, re-gate delta 41 PASS). Wilson 95% FP [0%, 39%] (Z3: [0%, 43%] — đã hẹp thêm). |
| Ngưỡng 30 còn đúng không? | **GIỮ NGUYÊN (tạm thời).** Gap thu hẹp còn (21, 41], rộng 20 draws; 30 vẫn trong gap, giữa hình học ≈ 29 — 30 gần như đúng điểm giữa. Nhưng biên an toàn phía khỏe chỉ còn 11 draws (trước: 52) — xem §3. |
| FN lạnh có phải do tải không? | **KHÔNG (lần này).** Session1 load 0,82–1,59, khác hẳn Y3-S1 (FN do tải). FN lạnh là chế độ riêng: lạnh + load thấp vẫn FN. |
| Resume-probe dưới tải thì sao? | **KHỎE.** Session2-attempt2 dưới tải nặng (load 11+): probe A 11,13 / B 12,37 fps, rs=4 50/50, seeking 0 — không tái hiện stall đói-decoder kiểu Z3-S1 dù load cao hơn lúc đó. |

## 2. Kết quả đo thật — 1 phiên lạnh chết ở re-gate + 1 phiên ấm hoàn chỉnh (+ 1 lần chết ở load app)

Clip `long1080.mp4` 20 s (h264 1080p 30 fps, GOP ~1,97 s), canvas preview backing
871×275, Chrome headed + Xvfb, VM 2 vCPU/8 GB. Cửa thứ hai BẬT, ngưỡng 30
(mặc định mới từ Z3).

| Phiên | Gate 1a (delta / load) | Slot draw fps (rep 1/2/3) | Re-gate (delta / load) | Verdict |
|---|---|---|---|---|
| **S1** (lạnh thật) | **24 PASS** (4 fps), load 1,14 | **0,77** (presented 13,47) — chỉ slot 1 | **21 FAIL** (3,5 fps), load 0,85 → **PHIÊN CHẾT** | **FN lạnh, re-gate BẮT ĐÚNG** |
| **S2-attempt2** (ấm, tải nặng) | **32 PASS** (5,33 fps), load 8,60 | **4,95 / 6,79 / 12,69** (presented 17,14 / 26,17 / 30,06) | **41 PASS** (6,83 fps), load 11,53 | Khỏe — không FN, không FP |
| S2-attempt1 | — (chết ở load app, xem §6) | — | — | HARNESS LỖI, không JSON |

**Gộp Z3+Y3+A6:** FN **3/22 slot** (Wilson 95% [5%, 33%]); phiên FN **2/8**;
re-gate bắt được **2/2**; re-gate FP **0/6** phiên không FN (Wilson [0%, 39%]).
**Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4: 9 slot, FN 3/9):** FN **6/31 slot (19%)**,
Wilson 95% **[9%, 36%]** (trước A6: 5/27, [8%, 37%] — tỉ lệ điểm gần như
không đổi, khoảng tin cậy hẹp lại chút ít).

**Đọc đúng bảng:**
- S1 là phiên lạnh thật thứ hai có số đo đầy đủ (sau Z3-S1): VM boot 08:19 UTC,
  cold-check 08:41 UTC: 0 tiến trình chrome/Xvfb, `/tmp/.X11-unix` không tồn
  tại, cổng 5572/9672 trống → phiên Chrome đầu tiên sau reboot. Load lúc bắt
  đầu 2,50, lúc gate 1,14, lúc slot 0,82–1,05 — **máy lặng**. Vậy mà slot 1
  vẫn 0,77 fps. FN lạnh V4-P1 (slot 0,69 fps ở load 0,5) **tái hiện đúng mẫu**:
  lạnh + load thấp + draw đóng băng trong khi element phát thật.
- Cơ chế S1 giống freeze X2 hơn stall Z3-S1: element rs=4 (không kẹt rs=1),
  presented 13,47 fps (element tự phát tốt), nhưng rAF gapP50 133,4 ms,
  gapP95 300 ms, gapMax 466,7 ms, over100 47/69 — **rAF stall**, ủng hộ giả
  thuyết freeze X2 là rAF stall (xem §4). Khác Z3-S1: ở đó element kẹt rs=1/
  seeking + presented cũng sụt (stall đói-decoder dưới tải).
- Gate 1a S1 chỉ delta 24 — vừa qua ngưỡng 20. Nếu gate 1a dùng ngưỡng cao
  hơn (ví dụ 30) thì phiên đã chết ngay ở gate; nhưng gate 1a không phải
  cửa bắt FN (nó chỉ kiểm tra element phát được) — việc bắt FN là nhiệm vụ
  của re-gate, và re-gate đã làm đúng việc.
- S2-attempt2 đo dưới tải nặng nhất từ trước tới nay trong chuỗi này (load
  8,6 → 11,5 do các luồng đợt 73 khác): slot chậm 4,95 → 12,69 fps nhưng
  KHÔNG FN theo tiêu chí slot < 2 fps (cùng vùng với Z3-S1 5,05–5,15 đã
  tính là không FN). Re-gate delta 41 PASS — **min delta khỏe mới, thấp nhất
  từng thấy** (trước: 82 ở Z3-S1 lạnh+tải). Phiên khỏe dưới tải nặng vẫn có
  re-gate delta thấp — đây là dữ liệu hiệu chuẩn quan trọng nhất đợt này.
- Phiên lạnh có FN: 2/3 phiên lạnh có số đo đầy đủ (V4-P1 FN, Z3-S1 không FN,
  A6-S1 FN) — FN lạnh không phải hiếm một lần, cũng không phải lần nào cũng
  có. n=3, chưa đủ để ước tỉ lệ lạnh.

## 3. Hiệu chuẩn ngưỡng re-gate: 30 GIỮ NGUYÊN (tạm thời), biên thu hẹp

Dữ liệu hiệu chuẩn (delta re-gate, tất cả phiên có JSON):

| Nhóm | n | Delta |
|---|---|---|
| Phiên FN | 2 | 18 (Y3-S1, FN do tải), 21 (A6-S1, FN lạnh) |
| Phiên không FN | 6 | 41 (A6-S2, ấm+tải nặng), 82 (Z3-S1 lạnh+tải), 137, 149 (Y3), 228, 273 (Z3) |

- Gap tách sạch: **(21, 41]**, rộng 20 draws (trước: (18, 82], rộng 64).
  Giữa hình học (max-margin log) ≈ 29.
- **Giữ ngưỡng 30.** Cơ sở: (a) vẫn nằm trong gap, gần như đúng điểm giữa
  hình học (29); (b) bắt FN tới delta 29 — đã chứng minh bắt được delta 21
  thật; (c) cách min khỏe 11 draws — phiên khỏe phải sụt ~27% so với delta
  khỏe thấp nhất từng thấy (41, dưới tải nặng) mới FP; (d) không có lý do
  đổi khi ngưỡng hiện tại vừa chứng minh bắt đúng FN thật đầu tiên.
- **CẢNH BÁO MỚI — biên phía khỏe mỏng đi nhiều:** min khỏe 82 → 41 chỉ
  sau một phiên tải nặng. Nếu một phiên khỏe dưới tải nặng hơn nữa cho
  re-gate delta 25–29 thì 30 sẽ FP (giết oan); nếu FN tiếp theo có delta
  31–40 thì 30 sẽ lọt. Cả hai phía đều đã sát ngưỡng. **Xem lại ngưỡng ngay
  khi có thêm 1 phiên FN hoặc 1 phiên khỏe delta < 41.** Với n(FN)=2,
  ngưỡng 30 vẫn là tạm thời — nhưng nay là tạm thời có bằng chứng bắt đúng
  2/2, không còn chỉ là suy luận từ gap.
- Không đổi mặc định trong launcher (đã là 30 từ Z3). Không sửa code.

## 4. Cơ chế FN lạnh S1 — rAF stall, khác stall đói-decoder Z3-S1

| Dấu hiệu | A6-S1 (FN lạnh, load thấp) | Z3-S1 (stall probe, tải cao) | X2 freeze (suy luận cũ) |
|---|---|---|---|
| Slot draw | 0,77 fps | slot 11,31 fps (probe 0,34/0,52) | ~0,3–0,7 fps |
| Element rs | 4 (HAVE_ENOUGH_DATA) | 1 (HAVE_METADATA), seeking ~80–88% | 4 |
| Presented | 13,47 fps (element phát tốt) | 8,8–11,9 fps (element cũng chậm) | ~15–21 fps |
| rAF gapP50 / P95 | 133,4 / 300 ms | 183,3 / 400 ms (probe A) | chưa đo trong cửa sổ |
| Load | 0,82–1,59 (lặng) | 3,5–8,2 (nặng) | thấp |
| MediaRate / phRate | 0,75x / 0,981x | — | — |

- S1: element đã có đủ dữ liệu (rs=4), presented chạy, phRate ~1 — video
  đang phát thật. Chỉ có **draw của canvas đóng băng** (8 draws/10,39 s)
  và rAF gap dài (P50 133 ms ≈ 8× chu kỳ 16,7 ms). Đây là stall ở tầng
  rAF/draw, không phải tầng decoder — khớp mẫu freeze X2 (rs=4, presented
  bình thường) và **lần đầu có số đo rAF trong cửa sổ FN**: gapP50/P95/
  gapMax/over100 đều ghi trong JSON slot 1.
- Khác Z3-S1: ở đó element kẹt rs=1 + seeking (decoder chưa có frame để
  vẽ), presented cũng sụt — stall ở tầng decoder do đói CPU. Hai cơ chế
  khác nhau, cùng biểu hiện draw thấp — re-gate bắt được cả hai vì nó đo
  lại trạng thái hiện tại sau slot 1, không phân biệt cơ chế.
- Gate 1a S1: el rs=1, ct=6,2, qTotal 42, dropped 4 — element lúc gate còn
  rs=1 (mới seek-0) nhưng draw vẫn lên 2→26 (delta 24, vừa đủ PASS). Dấu
  lạnh: warmup spike load 0,16 → 3,73 ở Z3-S1; ở A6-S1 load lúc bắt đầu
  2,50 (luồng khác) rồi hạ — không thấy spike rõ rệt.
- Không sửa production — đây là hành vi đo được, không phải bug logic
  đã xác định. Nợ mở: freeze vẫn chưa có mẫu dày trong cửa sổ gate 1a
  (xem §7).

## 5. Thiết kế thử nghiệm A6 (để đợt sau tái hiện hoặc bác bỏ)

- Tái sử dụng launcher Z3 NGUYÊN (`apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`,
  ngưỡng mặc định 30, re-gate BẬT) + analyzer Z3 NGUYÊN
  (`apps/web/scripts/analyze-72z3-gate-fn2.mjs`): KHÔNG sửa file nào trong
  repo ngoài doc LIMITS này. Config vite pre-create bằng script trích đúng
  template harness gốc (`/tmp/round73-a6/gen-vite-config.mjs`, eval template
  literal — 1.726 byte, md5 ca5b3c48afd54171d995e74cbadf7215); launcher ghi
  log "config vite đã có sẵn đúng nội dung, bỏ qua ghi" ở cả 3 lần chạy.
- Dry-run launcher trước đo: 27 thay thế OK, variant 53.246 byte (khớp Z3
  sau đổi ngưỡng 30).
- Analyzer: chạy lại trên dữ liệu Y3+Z3 trước (tái hiện đúng số Z3: FN 5/27
  [8%, 37%], FP 0/5 [0%, 43%], gap (18, 82]) rồi chạy bản copy trong /tmp
  có thêm thư mục A6 (chỉ đổi 2 hằng DIR + nhãn, logic giữ nguyên) để ra
  số gộp mới. Bản copy trong /tmp, không stage.
- Mỗi phiên chờ load 1-min < 2,0 và 5-min < 3,0 trước khi chạy (luật Y3,
  tối đa 40 phút) — S1 chờ ~3 phút (2,12 → ~2,5 lúc bắt đầu, vẫn chạy vì
  ưu tiên giữ trạng thái lạnh: 0 tiến trình chrome, phiên Chrome đầu tiên
  sau reboot là điều kiện hiếm hơn load < 2,0); S2-attempt2 chờ 4 phút
  (load 6,01 → 0,94) rồi chạy, nhưng load vọt lại 8,6–11,5 trong phiên
  do luồng đợt 73 khác.
- FN = gate1a PASS + slot draw < 2 fps (tiêu chí Y3/Z3, analyzer tự tính).
  Phiên chết ở re-gate chỉ còn slot 1 làm ground truth (kiểm duyệt, không
  gộp mù).

## 6. Sự cố trong đợt (ghi trung thực)

1. **S2-attempt1 chết ở load app (HARNESS LỖI, exit 2, không JSON):**
   vite lên 2.571 ms, app mount, modal đóng — rồi timeout 3 phút chờ
   project mẫu tự load (3 clip) + hook `__vcutPreviewEnhance` (last=null).
   Load lúc chết đo được 6,01 (sóng load từ luồng đợt 73 khác) — nhiều khả
   năng app load project mẫu chậm quá 3 phút vì CPU bị chiếm, không phải
   lỗi logic harness (cùng flow Z3 chạy tốt lúc máy lặng; S2-attempt2 chạy
   lại lúc máy lặng thì qua ngay bước này trong ~20 s). Không đưa vào
   thống kê gộp (không có số đo). Thư mục giữ tên `session2` (chỉ log).
2. **Load vọt trong S2-attempt2:** bắt đầu 2,60 → 8,60 lúc gate → 11,53
   lúc re-gate → 11,49 lúc slot 3 (luồng đợt 73 khác đốt CPU). Phiên vẫn
   hoàn chỉnh và cho dữ liệu hiệu chuẩn quý (min delta khỏe 41). Không
   phải lỗi — đã ghi rõ load từng mốc trong JSON/log.
3. **S1 chạy khi load 1-min chưa < 2,0 (2,12–2,50):** ngoại lệ có chủ ý so
   với luật Y3 — ưu tiên giữ trạng thái lạnh (phiên Chrome đầu tiên sau
   reboot) hơn là chờ load hạ, vì load < 2,0 có thể không tới trong khi
   luồng khác có thể mở Chrome trước và phá trạng thái lạnh. Load thực tế
   trong phiên S1 vẫn thấp (0,82–1,59) nên ngoại lệ này không làm nhiễu
   kết luận FN lạnh.

## 7. Giới hạn (trung thực)

- **n vẫn nhỏ:** chỉ **2 phiên có JSON** trong đợt này (1 FN lạnh + 1 ấm
  khỏe) + 1 lần chết ở load app (không số đo). Bắt FN nay 2/2 (Y3-S1 +
  A6-S1); FP 0/6, Wilson [0%, 39%] — đã hẹp hơn [0%, 43%] nhưng vẫn rộng.
  Phiên FN 2/8, Wilson cho tỉ lệ phiên FN chưa tính (n nhỏ, xem analyzer).
- **FN lạnh mới tái hiện 1 lần kể từ V4-P1:** phiên lạnh có số đo đầy đủ
  nay là 3 (V4-P1 FN, Z3-S1 không FN, A6-S1 FN) → 2/3. Chưa đủ để ước
  tỉ lệ FN lạnh; chưa biết FN lạnh có cần điều kiện gì thêm ngoài "Chrome
  đầu tiên sau reboot" (clip khác? lần chạy đầu nhưng load lúc gate ~0,5
  như V4-P1 thay vì ~1,1 như A6-S1?).
- **Ngưỡng 30 đứng trên gap hẹp (21, 41]:** biên phía khỏe chỉ còn 11
  draws. Một phiên khỏe delta 25–29 sẽ FP; một phiên FN delta 31–40 sẽ
  lọt. Ngưỡng 30 chưa "đã hiệu chuẩn xong" — n(FN)=2.
- **Freeze vẫn chưa có mẫu dày trong cửa sổ gate 1a:** S1 cho số rAF
  trong cửa sổ slot 1 (gapP50 133 ms) nhưng gate 1a chỉ có delta tổng
  (24 draws/6 s), không có mẫu dày từng giây. Kết luận "rAF stall" cho
  freeze vẫn là suy luận từ số đo cửa sổ slot, chưa phải đo trực tiếp
  trong cửa sổ freeze ở gate.
- **Stall đói-decoder Z3-S1 không tái hiện:** probe A/B S2-attempt2 khỏe
  hoàn toàn dưới tải nặng hơn (load 11+ vs 3,5–8,2 ở Z3-S1) — cơ chế đó
  có thể cần tải ở mức vừa + thời điểm cụ thể, hoặc hiếm. Chưa biết tần suất.
- **S2-attempt1 (chết ở load app) không có số đo:** nếu app load chậm cũng
  là một dạng "phiên không đo được" thì tỉ lệ phiên đo thành công trong
  đợt này là 2/3 lần chạy — nhưng đây là lỗi môi trường/tải, không phải
  lỗi đo, nên không gộp vào tỉ lệ FN/FP.
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb, clip
  long1080 20 s, canvas 871×275) trong buổi có sóng load từ 8–10 luồng song
  song + 1 lần reboot buổi sáng. Số trên máy thật/khác clip sẽ khác — nhưng
  verdict cửa thứ hai là về THIẾT KẾ (đo lại trạng thái hiện tại sau slot 1),
  không phải về con số tuyệt đối.
- **Không sửa gì trong production:** harness gốc không đổi; launcher +
  analyzer Z3 không đổi; gate 6 s không đổi; không push (chỉ stage);
  không release/tag. File `.cjs` config vite, script gen config, bản copy
  analyzer và log phân tích trong /tmp (mất khi reboot — không stage, không
  phải deliverable); ảnh `r8-presented-done.png` (binary) không stage.

## 8. File và log

- Doc này: `docs/PHASE9_ROUND73_A6_GATE_FN_LIMITS.md`.
- Launcher (tái sử dụng, không sửa): `apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`
  — dry-run 27 thay thế OK, variant 53.246 byte; chạy 3 lần (1 phiên lạnh
  chết ở re-gate + 1 phiên ấm hoàn chỉnh + 1 lần chết ở load app).
- Script phân tích (tái sử dụng, không sửa): `apps/web/scripts/analyze-72z3-gate-fn2.mjs`
  — chạy lại trên Y3+Z3 tái hiện đúng số Z3; bản copy có thêm A6 trong
  `/tmp/round73-a6/analyze-73a6.mjs` (không stage) cho số gộp mới.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round73-a6.md`.
- Log đo: `hidden_files/round73-a6/session1/` (phiên lạnh, hoàn chỉnh tới
  re-gate: `presented-fps.json` 2.539 byte, `presented-fps.log`,
  `r8-presented-chrome.log`, `r8-presented-vite.log`, `r8-presented-done.png`,
  `z3-run.log` → tên file `a6-run.log`, `a6-notes.txt`),
  `session2/` (attempt1 chết ở load app, chỉ log, không JSON),
  `session2-attempt2/` (phiên ấm hoàn chỉnh: `presented-fps.json` 146.642 byte
  + đủ log/png/notes).
  Kết quả phân tích gộp: `/tmp/round73-a6/analyze-pooled.txt` (tmpfs, mất khi
  reboot); baseline Y3+Z3: `/tmp/round73-a6/analyze-z3y3-baseline.txt`.
- Không stage: config vite `.cjs` trong /tmp (file sinh ra), ảnh
  `r8-presented-done.png` (binary), log luồng + log đo (goal workspace, không
  phải repo), script gen config + bản copy analyzer trong /tmp.
