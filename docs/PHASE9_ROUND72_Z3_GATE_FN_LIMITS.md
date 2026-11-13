# Phase 9 đợt 72 — luồng Z3: re-gate làm cửa kiểm tra thứ hai + hiệu chuẩn ngưỡng

**Ngày:** 09/11/2026 (lượt cron 12:35 +07; đo 06:05–06:21 UTC).
**Trạng thái:** ĐO XONG — VERDICT: **cửa kiểm tra thứ hai ĐÃ NỐI + CHỨNG MINH LIVE**;
**ngưỡng re-gate mới = 30 (tạm thời)**; **FN lạnh KHÔNG tái hiện** trong phiên lạnh thật;
**FP re-gate 0/5, Wilson [0%, 43%]**.
Harness gốc `measure-65r8-presented-fps.mjs` KHÔNG đổi; gate 6 s KHÔNG đổi;
không sửa code production. Không push (chỉ stage); không release/tag.

## 1. Kết luận (verdict)

| Câu hỏi | Trả lời |
|---|---|
| Re-gate đã nối làm cửa kiểm tra thứ hai chưa? | **RỒI — chứng minh live.** Launcher Z3: phiên chết nếu gate1a HOẶC re-gate FAIL (cờ `Z3_REGATE_GATE`, mặc định BẬT; `=0` → quan sát như Y3). Kill-test ép ngưỡng 9999: re-gate delta 257 FAIL → dòng `Z3-SECOND-GATE … PHIÊN CHẾT`, chỉ còn slot 1, không probe/đối chứng, JSON ghi `killedByRegate=true`, exit 1 theo thiết kế. |
| Ngưỡng re-gate mới là bao nhiêu, cơ sở nào? | **30 (tạm thời).** Delta FN quan sát max 18 (n=1); delta khỏe min 82 (n=5: 82/137/149/228/273). Gap (18, 82]; 30 nằm trong gap, bắt FN tới delta 29, cách min khỏe 52 draws. Xem §3. |
| Re-gate có giết oan phiên khỏe không? | **KHÔNG — 0/5 phiên không FN** (Z3: 3, Y3: 2). Wilson 95% FP [0%, 43%] (Y3: [0%, 66%] — đã thu hẹp). |
| FN lạnh kiểu V4-P1 có tái hiện / bị bắt không? | **KHÔNG tái hiện — chưa chứng minh được.** S1 là phiên Chrome đầu tiên sau reboot 06:02 UTC (lạnh thật, load lúc bắt đầu 0,16) nhưng slot 1 vẫn 11,31 fps, không FN. |
| Re-gate có bắt thêm FN nào trong đợt này không? | **Không có phiên FN nào trong 3 phiên đo** nên không có thêm bằng chứng bắt FN. Tỉ lệ bắt vẫn 1/1 (Y3-S1). |
| Resume-từ-pause thì sao? | **Phụ thuộc tải, không phải bệnh của resume.** S1 (tải cao): probe A/B stall nặng lần đầu (draw 0,34/0,52 fps, rs=1, seeking ~80–88%). S2/S3 (máy lặng): probe khỏe hoàn toàn (36–40 fps). Xem §4. |
| Có cần sửa code production không? | **KHÔNG.** Không đụng production. |

## 2. Kết quả đo thật — 3 phiên hoàn chỉnh + 1 phiên chết ở gate + 1 kill-test

Clip `long1080.mp4` 20 s (h264 1080p 30 fps, GOP ~1,97 s), canvas preview backing
871×275, Chrome headed + Xvfb, VM 2 vCPU/8 GB. Cửa thứ hai BẬT, ngưỡng 20 trong
cả 3 phiên đo (ngưỡng 30 chỉ áp dụng từ phiên sau — xem §3).

| Phiên | Gate 1a (delta / load) | Slot draw fps (rep 1/2/3) | Re-gate (delta / load) | Verdict |
|---|---|---|---|---|
| **S1** (lạnh thật, attempt 3) | **51 PASS** (8,5 fps), load 3,73 | **11,31 / 5,15 / 5,05** (presented 30,15 / 21,19 / 21,74) | **82 PASS** (13,67 fps), load 3,46 | Khỏe — không FN, không FP; probe stall do tải (xem §4) |
| **S2** (chạy lại) | **50 PASS** (8,3 fps), load 1,03 | **35,74 / 38,47 / 35,65** (presented ~30) | **228 PASS** (38 fps), load 0,74 | Khỏe — không FN, không FP |
| **S3** | **60 PASS** (10 fps), load 2,89 | **36,85 / 37,48 / 37,67** (presented ~29,8) | **273 PASS** (45,5 fps), load 3,16 | Khỏe — không FN, không FP |
| S2 lần 1 | **FAIL delta 2** (load 1,55; element phát tốt: ct 6,4, presented 55 frame/6 s) | — (dừng) | — | **Freeze "sạch" ở gate** (lần quan sát thứ 4) |
| Kill-test (ngưỡng ép 9999) | **60 PASS**, load 5,09 | **36,71** (chỉ slot 1) | **257 FAIL** (42,83 fps) → **PHIÊN CHẾT** | Đường kill chứng minh live |

**Gộp Z3+Y3:** FN **2/18 slot** (Wilson 95% [3%, 33%]); phiên FN **1/6**;
re-gate bắt được **1/1**; re-gate FP **0/5** phiên không FN (Wilson [0%, 43%]).
**Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4: 9 slot, FN 3/9):** FN **5/27 slot (19%)**,
Wilson 95% [8%, 37%] (trước Z3: 5/18, 28%).

**Đọc đúng bảng:**
- S1 là phiên lạnh thật duy nhất (Chrome đầu tiên sau reboot 06:02 UTC, load
  lúc bắt đầu 0,16, Xvfb sockets=[] + 0 tiến trình chrome trước phiên — ghi
  trong `z3-notes.txt`). Nhưng "lạnh" ở đây đi kèm warmup spike: load vọt
  0,16 → 3,73 lúc gate (Chrome/vite/esbuild khởi động), element rs=2 với
  dropped 12 trong cửa sổ gate. Slot 1 vẫn 11,31 fps — **FN lạnh V4-P1
  (slot 0,69 fps ở load 0,5) không tái hiện**. Slot 2–3 chậm dần (5,15 → 5,05)
  do tải tăng trong phiên (load 3,5 → 6,4 → 8,2, luồng đợt 72 khác đốt CPU),
  không phải do lạnh.
- Min delta khỏe JSON-backed giảm từ 137 (Y3) xuống **82** (S1, phiên lạnh +
  tải cao). Gap thu hẹp (18, 137] → (18, 82] nhưng vẫn rộng 64 draws.
- S2/S3 là 2 phiên khỏe nhất từng đo (slot 35–38 fps, re-gate 228/273) —
  re-gate qua với biên 7,6–13,7× ngưỡng 20. Không có dấu hiệu cửa thứ hai
  giết oan phiên khỏe.
- S2 lần 1 chết ở gate 1a đúng luật với mẫu freeze sạch (draw 0,33 fps,
  element presented ~9,2 fps, load 1,55) — lần quan sát freeze thứ 4
  (X2-S4 cửa sổ 2, X2-S1 cửa sổ 2 partial, Y3-S3-lần-1 gate, Z3-S2-lần-1 gate).
  Freeze vẫn đánh vào cửa sổ phát đầu tiên sau seek-0, không resume nào
  trước đó — củng cố Y3 §4.1.

## 3. Hiệu chuẩn ngưỡng re-gate: 20 → 30 (tạm thời)

Dữ liệu hiệu chuẩn (delta re-gate, tất cả đều đo ở ngưỡng 20):

| Nhóm | n | Delta |
|---|---|---|
| Phiên FN | 1 | 18 (Y3-S1, FN do tải) |
| Phiên không FN | 5 | 82 (Z3-S1 lạnh+tải), 137, 149 (Y3), 228, 273 (Z3) |

- Gap tách sạch: **(18, 82]**, rộng 64 draws. Mọi ngưỡng trong gap đều tách
  sạch dữ liệu đã quan sát. Giữa hình học (max-margin log) ≈ 38.
- **Chọn 30.** Cơ sở: (a) nằm trong gap; (b) bắt FN tới delta 29 — rộng hơn
  ngưỡng cũ 20 một nửa dải bắt, bao đúng vùng 15–25 mà Y3 cảnh báo là "một lần
  chạy kém may mắn hơn là re-gate qua oan (delta 20–21)"; (c) cách min khỏe
  52 draws — phiên khỏe phải sụt hơn 2,7× so với delta khỏe thấp nhất từng
  thấy (82, trong phiên lạnh + tải cao) mới FP; (d) số tròn, thay đổi tối
  thiểu so với ngưỡng kế thừa (không nhảy lên ~38 khi n(FN) mới = 1).
- **Đã đổi mặc định trong launcher** (`Z3_REGATE_THRESHOLD || 30`; các phiên
  Z3 đo ở ngưỡng 20, phiên sau chạy ở 30). Dry-run sau đổi: 27 thay thế OK,
  variant 53.246 byte, `node --check` OK, grep thấy `|| 30`.
- **TẠM THỜI, phải xem lại khi có thêm phiên FN** — đặc biệt FN ở vùng 20–30
  (nếu FN delta 32 xuất hiện thì 30 cũng lọt, phải nâng tiếp; nếu phiên khỏe
  nào re-gate < 30 thì phải hạ). Với n(FN)=1, không có ngưỡng nào là "đã hiệu
  chuẩn xong" — 30 chỉ là điểm đặt có cơ sở hơn 20.
- Chi phí bất đối xứng (lý do thiên về nâng chứ không giữ 20): FP giết oan
  một phiên khỏe tốn ~5 phút + 1 slot phiên; FN lọt làm hỏng cả phiên đo
  (3 slot + probe thành số rác). Nên ngưỡng đặt gần phía FN hơn là gần phía khỏe.

## 4. Resume-probe — stall do decoder/tải, KHÔNG phải bệnh của resume

Gộp Y3+Z3: 11 probe (Y3: 5 khỏe; Z3: 4 khỏe + 2 stall, cả 2 stall đều ở S1).

| Probe | Draw fps | Hold / Skip fps | Presented fps | Ticks/s | rs chủ đạo | Seeking | syncReseeksVideo |
|---|---|---|---|---|---|---|---|
| S1-A (lạnh+tải) | **0,34** | 2,69 / 1,43 | 8,8 | 4,57 | **1 (44/50)** | 44/50 | 9 → 13 (+4) |
| S1-B (lạnh+tải) | **0,52** | 5,19 / 0 | 11,93 | 5,71 | **1 (39/50)** | 39/50 | 24 → 28 (+4) |
| S2-A | 36,82 | 0 / 0 | 29,88 | 36,82 | 4 (50/50) | 0/50 | 7 → 7 |
| S2-B | 36,41 | 0 / 0 | 30,15 | 36,41 | 4 (50/50) | 0/50 | 9 → 9 |
| S3-A | 39,69 | 0 / 0 | 29,95 | 39,69 | 4 (50/50) | 0/50 | 7 → 7 |
| S3-B | 39,11 | 0 / 0 | 29,83 | 39,11 | 4 (50/50) | 0/50 | 9 → 9 |

**S1 stall — cơ chế mới, khác freeze X2:**
- Element kẹt ở rs=1 (HAVE_METADATA) + seeking ~80–88% suốt cửa sổ; pause-seek
  của probe A **không settle trong cả pha pause 2,1 s** (sleeping 0/10 mẫu,
  pendingSeek true → true, lastDrawn null → null — lần đầu thấy); mẫu
  shortPause của probe B cũng chưa xong (seeking=true, rs=1, pendingSeek=true,
  sleeping=false, lastDrawn=null) — **lần đầu bắt được resume cắt ngang
  pause-seek còn đang bay**. Y3 nói muốn cắt ngang phải resume trong < ~0,5 s;
  ở đây seek chậm vì decoder đói CPU dưới tải nên pause ~1 s vẫn chưa đủ.
- ct nhảy theo bậc (6,833 đứng yên nhiều giây rồi vọt 7,262 → 10,467 → 14,733
  → 19,167): decoder bắt kịp theo đợt, không phải phát đều.
- Presented cũng sụt (8,8–11,9 fps, khác freeze X2 là presented vẫn ~15–21):
  element tự nó chậm, không chỉ canvas. rAF cũng bị bóp (probe A: gapP50
  183,3 ms, gapP95 400 ms, gapMax 549,9 ms, over100 72/90; wall 17,49 s thay
  vì ~11 s — CDP evaluate chậm dưới tải).
- Probe B hồi phục ở +13 s (rs=4, seeking 0/3) — stall tự hết khi tải giảm.
- Đối chứng tab trắng S1 cũng suy theo tải (rVFC 5,99, presented 14,88,
  mediaRate 0,489×, dropped 87) — xác nhận tải là nguyên nhân chung, không
  phải lỗi riêng preview.
- **Kết luận:** stall resume là chế độ đói-decoder dưới tải (rs=1/seeking kéo
  dài + hold tăng), khác freeze X2 (rs=4, presented bình thường, nghi rAF).
  Resume-từ-pause vẫn KHỎE khi máy lặng (S2/S3: 36–40 fps, rs=4 100%).
  Không sửa production — đây là hành vi dưới tải, không phải bug logic.

## 5. Thiết kế thử nghiệm Z3 (để đợt sau tái hiện hoặc bác bỏ)

- Launcher `apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`: variant của
  harness gốc (kế thừa Y3, import qua data: URL), 27 thay thế, cổng 5572/9672,
  config vite `.cjs` pre-create tại `/tmp/round72-z3/vite.z3-presented.config.cjs`
  (nội dung trích đúng template harness gốc — md5 khớp bản trích, launcher
  ghi log "config vite đã có sẵn đúng nội dung, bỏ qua ghi" ở mọi phiên).
- Cửa thứ hai: `Z3_REGATE_GATE` (mặc định BẬT), `Z3_REGATE_THRESHOLD` (phiên đo:
  20; mặc định mới: 30). Re-gate FAIL + cửa BẬT → break khỏi vòng slot, bỏ qua
  resume-probe + đối chứng, vẫn ghi `presented-fps.json` + cờ
  `z3.killedByRegate` (slot 1 là ground truth duy nhất; FP ở phiên chết chỉ
  xác định theo slot 1 — kiểm duyệt, analyzer tách riêng, không gộp mù).
- Sửa quirk Y3 §6: probe B nay ghi đủ `pauseRetryExhausted` /
  `seekFailureExhausted` vào summary (S1–S3 đều ghi false/false — đã kiểm
  chứng trong JSON).
- Sửa bug scoping do chính Z3 gây ra (xem §6).
- Mỗi phiên chờ load 1-min < 2,0 và 5-min < 3,0 trước khi chạy (luật Y3, tối
  đa 40 phút). Runner `run-session.sh` (trong /tmp, không stage) ghi
  `z3-notes.txt` mỗi phiên (uptime, boot, load, cold-check trước chạy, cờ
  re-gate) và tee log chạy.
- Analyzer `apps/web/scripts/analyze-72z3-gate-fn2.mjs`: đọc phiên Z3 + Y3,
  bảng từng phiên (ngưỡng/chế độ/chết ở re-gate/FN/bắt được/FP + phạm vi
  ground truth), FP tách riêng, hiệu chuẩn ngưỡng (gap + ngưỡng đề xuất),
  tỉ lệ FN gộp, resume-probe (chỉ phiên Z3). Chạy lại trên dữ liệu Y3 trước
  khi có phiên Z3 đã tái hiện đúng số Y3.

## 6. Sự cố trong đợt (ghi trung thực)

1. **Bug scoping của Z3 (S1 lần 1, launcher exit 2, mất JSON):** `const bcdp`
   nằm trong khối `if (!z3KilledByRegate)` bọc đối chứng, nhưng dòng
   `await drainErrors(bcdp)` ở ngoài khối vẫn tham chiếu nó → ReferenceError
   sau khi đối chứng chạy xong, trước khi ghi report. Dry-run + `node --check`
   không bắt được lỗi scoping lúc chạy. Đã sửa: `let blankTarget/bcdp/ctrl
   = null` khai báo ngoài khối if + 3 `const` trong khối đổi thành gán
   (24 → 27 thay thế). Số đo lần 1 chỉ còn trong console log (gate 45, slot
   9,77/32,02/20, re-gate 108, probe 12,15/10,26, đối chứng 17,54/30,3) —
   KHÔNG đưa vào phân tích gộp vì thiếu JSON/samples. Thư mục giữ tên
   `session1-attempt1`.
2. **VM reboot giữa chừng (S1 lần 2):** VM reboot ~06:02 UTC, đúng sau dòng
   re-gate 06:02:48; exec session biến mất cùng VM, /tmp bị xóa sạch (launcher
   variant, runner, config vite phải tạo lại). Không phải lỗi harness.
   Số đo lần 2 chỉ còn trong log (gate 56, slot 1 draw 35, re-gate 208) —
   KHÔNG đưa vào phân tích gộp. Thư mục giữ tên `session1-attempt2`.
   Reboot này vô tình tạo cơ hội phiên lạnh thật cho lần 3 (S1).
3. **S2 lần 1 chết ở gate** (delta 2, freeze sạch — xem §2). Chạy lại theo mẫu
   Y3; lần 2 khỏe hoàn toàn. Thư mục giữ tên `session2-attempt1`.
4. **Kill-test không phải phiên đo:** ngưỡng ép 9999, delta 257 bị giết oan
   theo thiết kế — số này KHÔNG đưa vào hiệu chuẩn ngưỡng; thư mục tên
   `killtest1` để analyzer không đọc nhầm.

## 7. Giới hạn (trung thực)

- **n nhỏ:** chỉ **3 phiên hoàn chỉnh** (0 FN, 3 khỏe) + 1 phiên chết ở gate
  + 1 kill-test ép ngưỡng. Bắt FN vẫn 1/1 (chỉ Y3-S1); FP 0/5, Wilson
  [0%, 43%] — đã hẹp hơn [0%, 66%] nhưng vẫn rộng. Cần thêm phiên (đặc biệt
  thêm phiên FN) mới thu hẹp được và mới kiểm chứng được ngưỡng 30.
- **FN lạnh chưa tái hiện:** S1 lạnh thật nhưng không FN. Có thể FN lạnh
  V4-P1 là hiện tượng hiếm (1 lần trong nhiều phiên) hoặc cần điều kiện khác
  (clip khác, máy khác, lần chạy đầu sau reboot nhưng load lúc gate ~0,5 chứ
  không phải warmup spike 3,73 như S1). Re-gate có bắt được FN lạnh hay không
  vẫn CHƯA BIẾT — cửa thứ hai mới chỉ chứng minh bắt FN do tải (Y3) và kill
  cơ học (kill-test Z3).
- **Cửa thứ hai chưa từng giết một phiên FN thật:** kill-test chứng minh cơ
  chế, Y3 chứng minh khả năng bắt trong chế độ quan sát — nhưng phiên chết
  vì re-gate FAIL ở ngưỡng thật (20/30) với ground truth FN đầy đủ thì chưa
  có lần nào (vì muốn ground truth đầy đủ thì phiên không được chết — nghịch
  lý thiết kế: cửa càng làm đúng việc thì càng ít dữ liệu xác nhận nó).
- **Ngưỡng 30 là tạm thời:** n(FN)=1; nếu FN tiếp theo có delta 20–30 thì 30
  bắt được, nếu delta 32+ thì lọt. Xem lại ngưỡng mỗi khi có thêm phiên FN.
- **Stall probe S1 chỉ có 1 phiên:** cơ chế đói-decoder (rs=1/seeking) mới
  quan sát 1 lần (2 probe cùng phiên, cùng nguyên nhân tải) — chưa biết tần
  suất, chưa biết có tái hiện ở tải vừa (load 3–5) hay chỉ ở tải nặng (7–8).
- **Freeze vẫn chưa có số đo trong cửa sổ:** lần quan sát thứ 4 (S2-lần-1)
  vẫn ở gate 1a (không lấy mẫu dày). Kết luận "rAF stall" cho freeze X2 vẫn
  là suy luận, chưa phải đo trực tiếp.
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb, clip
  long1080 20 s, canvas 871×275) trong buổi có sóng load từ các luồng song
  song + 2 lần reboot. Số trên máy thật/khác clip sẽ khác — nhưng verdict
  cửa thứ hai là về THIẾT KẾ (đo lại trạng thái hiện tại sau slot 1), không
  phải về con số tuyệt đối.
- **Không sửa gì trong production:** harness gốc không đổi; gate 6 s không
  đổi; không push (chỉ stage); không release/tag. File `.cjs` config vite,
  runner `run-session.sh`, variant dry-run và log phân tích trong /tmp
  (mất khi reboot — không stage, không phải deliverable).

## 8. File và log

- Launcher (mới, đã stage): `apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`
  — `node --check` OK; dry-run 27 thay thế OK (variant 53.246 byte, mặc định
  ngưỡng 30); chạy 7 lần (3 phiên hoàn chỉnh + 1 chết ở gate + 1 kill-test +
  2 lần chết S1: bug scoping + reboot).
- Script phân tích (mới, đã stage): `apps/web/scripts/analyze-72z3-gate-fn2.mjs`
  — `node --check` OK; chạy được trên JSON Z3+Y3, in verdict + Wilson CI +
  hiệu chuẩn ngưỡng + resume-probe.
- Doc này: `docs/PHASE9_ROUND72_Z3_GATE_FN_LIMITS.md`.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round72-z3.md`.
- Log đo: `hidden_files/round72-z3/session1/` (attempt 3: hoàn chỉnh;
  `session1-attempt1`: lần 1 chết do bug scoping, chỉ log; `session1-attempt2`:
  lần 2 chết do reboot, chỉ log), `session2/` (chạy lại: hoàn chỉnh;
  `session2-attempt1`: lần 1 chết ở gate, chỉ log), `session3/` (hoàn chỉnh),
  `killtest1/` (kill-test ép ngưỡng 9999, JSON 2.540 byte, killedByRegate=true).
  Mỗi session hoàn chỉnh: `presented-fps.json`, `presented-fps.log`,
  `r8-presented-chrome.log`, `r8-presented-vite.log`, `r8-presented-done.png`,
  `z3-notes.txt`, `z3-run.log`.
  Kết quả phân tích gộp: `/tmp/round72-z3/analyze-final.txt` (tmpfs, mất khi reboot).
- Không stage: config vite `.cjs` trong /tmp (file sinh ra), ảnh
  `r8-presented-done.png` (binary), log luồng + log đo (goal workspace, không phải repo),
  runner `run-session.sh` + variant dry-run trong /tmp.
