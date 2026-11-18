# Phase 9 — Đợt 118, luồng T9: đăng ký lô đo lớn E4BATCH + lượt 1

> **Kết quả gọn: lô đo lớn E4 đã ĐĂNG KÝ (10 lượt đếm được, 5 A + 5 B,
> xen kẽ); lượt 1 KHÔNG ĐẾM ĐƯỢC — attempt 1 KILLED-HARNESS (probe
> exit=2: pause-seek t=5 không xác nhận được, canvas không lên khung
> sau seek), attempt 2 (retry duy nhất) DEFER-LOCK (timeout 900 s sau
> T3 giữ 1055 s). Lượt 1 ĐỂ TRỐNG theo đúng prereg. Lô đang 0/10 lượt
> đếm được. E4 giữ ĐÓNG CÓ ĐIỀU KIỆN — không có số mới nào để phân
> định H1/H3. Không suy diễn gì từ phân tích offline (cấm hướng (c)).**

## 0. Bối cảnh và quyết parent

- E4 = stall r1f3 att2 + r1f4 (drift re-seek chậm/kẹt sau steady-close).
  Đợt 117 T1: 3 lượt VOID + 1 DEFER-LOCK, 0 lượt bắt được steady-close
  → H1/H3 chưa phân định, E4 giữ ĐÓNG CÓ ĐIỀU KIỆN
  (docs/PHASE9_ROUND117_T1_E4STALL_LIMITS.md).
- Quyết parent đợt 117 §13 mục (1): hướng (a) — giữ ĐÓNG CÓ ĐIỀU KIỆN
  tới lô đo lớn đăng ký trước; CẤM hướng (c) (quyết từ phân tích cơ chế
  offline — sai lầm lặp lại đợt 114); hướng (b) chỉ làm nếu phục vụ lô
  đo (lượt này không làm).
- Nhiệm vụ T9 đợt 118: đăng ký lô đo bằng văn bản + chạy lượt đầu.

## 1. Đăng ký lô đo lớn E4BATCH (viết TRƯỚC mọi phép đo mới)

- Prereg đầy đủ: `hidden_files/round118-t9/prereg-e4batch.md`
  (viết 11:40Z, trước khi driver lượt 1 khởi động 11:40:56Z). Sổ cái:
  `hidden_files/round118-t9/e4batch-ledger.md`.
- **Tổng số lượt đếm được: 10** — 5 A (gop250, loadN=0) + 5 B (gop30,
  loadN=0), xen kẽ A/B/A/B…, bắt đầu bằng A. Lượt 1 = A phase `e4a1`;
  lượt 2 = B `e4b2`; … lượt 10 = B `e4b10`. Mỗi đợt chạy tối thiểu 1
  lượt kế tiếp; được chạy 2 lượt/đợt nếu lock trống và còn thời gian.
- **Định nghĩa "bắt được" (CAUGHT)** = ≥1 steady-close đã xác minh
  (tailSteadyClosed ≥ 1). Sau đó: CAUGHT-RESEEK (có drift re-seek sau
  steady-close đầu tiên → đo seeking-duration bằng sampler-bracket,
  áp bar H1/H3) hoặc CAUGHT-NO-RESEEK (có steady-close nhưng không có
  drift re-seek trong cửa sổ quan sát → chỉ số chính vắng, không quyết
  H1/H3, vẫn đếm vào 10 lượt).
- **VOID** = không steady-close nào trong 180 s probe (exit 0, md5
  không đổi, không reboot) — kết quả HỢP LỆ, đếm vào 10 lượt.
- **KHÔNG ĐẾM** (chạy lại ở đợt sau, retry tối đa 1 lần/lượt):
  DEFER-LOCK (timeout 900 s), DEFER-POSTBOOT (postboot ≠ 0 hoặc replay
  chưa xong sau 60' chờ), KILLED-REBOOT, KILLED-TREE (md5 đổi / cờ
  EDITING giữa lượt), KILLED-HARNESS (probe exit≠0 do lỗi harness).
  Hết retry → lượt để trống, lô tiếp tục với lượt kế tiếp, KHÔNG chạy
  bù quá 1 lần, KHÔNG chạy tới khi ra số đẹp.
- **Luật dừng sớm**: DỪNG-VERDICT khi có ≥1 lượt A CAUGHT-RESEEK và
  ≥1 lượt B CAUGHT-RESEEK mà một cặp quyết được H1 hoặc H3 theo bar
  prereg-s1 §5 (H1: A trong [6,13] s VÀ B trong [2,0,3,5] s VÀ A/B ≥ 2
  VÀ không main-thread stall; H3: A không xong trong 60 s).
  DỪNG-HẾT-LƯỢT khi đủ 10 lượt mà không quyết được → KHÔNG KẾT LUẬN.
  Không dừng sớm vì đủ số VOID, vì 1 lượt CAUGHT đơn lẻ, hay vì phân
  tích offline.
- **Drift recount bắt buộc mỗi lượt đếm được**: liệt kê MỌI tick sau
  seek ban đầu có drift (ct−ph) > 0,35, kèm tick + giá trị 4 chữ số
  thập phân (mẫu T1 đợt 117 §1.3: t1b 8 lần — tick 12 (0,5917),
  14 (0,3667), 16 (0,4), 18 (0,3667), 20 (0,3686), 22 (0,3667),
  26 (0,3767), 31 (0,4333)); ghi rõ có/không 2 tick liên tiếp vượt.
- **Sức mạnh (đăng ký trước)**: giả sử xác suất bắt/lượt p, với 5 A +
  5 B thì P(≥1 A bắt VÀ ≥1 B bắt) ≈ 0,58 nếu p=0,25; ≈ 0,85 nếu
  p=0,40; ≈ 0,33 nếu p=0,15. Nếu 0 lần bắt trong 10 lượt: rule-of-three
  cho bound trên 95% của p ≈ 3/10 = 0,30 (gộp); mỗi nhánh 0/5 → bound
  3/5 = 0,60 (ghi rõ là lỏng).
- Điều kiện đo giữ nguyên T1: WebKit, loadN=0, probe probe116s1.mjs
  không sửa, cây md5 03bf029f, lock v2 (aging 600), cổng lock 5581
  (tránh 5186/5187/5188), probe tự pick vite 5580–5589 + bridge
  8881–8889. Chờ cờ postboot của T7 trước khi đo (tối đa 60').
  Driver dài chạy DETACHED (nohup + disown). KHÔNG sửa production.
  KHÔNG kiểm TTS 39. KHÔNG birefnet.

## 2. Lượt 1 — attempt 1: KILLED-HARNESS (không đếm)

- Driver: `hidden_files/round118-t9/run-t9.sh 1 250 e4a1`, log
  `run-t9.log`. Postboot: chờ cờ T7 1 phút — replay #54 xong 11:40:56Z,
  postboot check-only exit=0 (PASS, T7 đợt 118), headroom exit=0.
- Lock v2: ticket 11:41:57Z, chờ 27 s (sau t3-round118), ACQUIRED
  port=5581, hold 84 s, RELEASED 11:43:48Z. md5 trước = sau =
  03bf029f; boot #54 không đổi; RAM 1195 MB lúc bắt đầu lượt;
  load lúc probe bắt đầu 5,17 (T3 dial hog chạy nền).
- Probe: vite lên, bridge OK, WebKit 27.2 launch, clip bóng thêm được
  (id=c_taf1j8m). Tới bước pause-seek tới t=5: **confirmed=false sau
  30 s — tElement=3136 ms, tCanvas=null ms** → probe throw tại
  probe116s1.mjs:442, **exit=2**.
  - Giải nghĩa: element ĐÃ tới t=5 sau 3136 ms (chậm hơn hẳn 409 /
    491 / 662 ms của T1 đợt 117, và 1799 ms của S1 cho cùng clip
    gop250), nhưng canvas KHÔNG BAO GIỜ hiện khung đúng sau seek trong
    30 s (tCanvas=null) nên probe từ chối đo phát trên khung stale.
  - Đây là lỗi tiền điều kiện của probe (không đo được), KHÔNG phải
    một phép đo drift re-seek: probe chết TRƯỚC pha phát nên không có
    velocity tick, không có drift recount, không có probe-results.json.
    Scratch chỉ có probe-error.txt / probe-log.txt / r2-bridge.log /
    r2-vite-attempt1.log (`round116-s1/probe-webkit-load0-gop250-e4a1/`).
  - Ghi nhận, không suy diễn: chưa rõ canvas không lên khung là do
    tải nền cao lúc đó (load 5,17, replay vừa xong 1,5 phút trước),
    do seek lạnh chậm trên WebKit, hay do vấn đề preview thật — probe
    này không phân biệt được, và prereg cấm dùng nó để kết luận E4.
    Đây là nợ quan sát cho đợt sau (nếu pause-seek canvas tiếp tục
    không xác nhận, cần luồng riêng chẩn đoán — không phải T9).
- Phân loại theo prereg §2: **KILLED-HARNESS** (probe exit≠0 do lỗi
  harness) → không đếm vào 10 lượt → được retry 1 lần.

## 3. Lượt 1 — attempt 2 (retry duy nhất): DEFER-LOCK (không đếm)

- Driver retry: `run-t9.sh 1 250 e4a1r` (phase mới để scratch không đè
  att1), khởi động 11:47:17Z. Postboot đã có cờ (chờ 0 phút). md5
  trước 03bf029f, boot #54, RAM 1459 MB, load lúc lấy ticket 7,26.
- Hàng đợi lock v2 (ghi từ log): ticket t9 11:47:18Z, vị trí 2.
  - t3-round118 giữ lock từ 11:44:31Z (prio long) tới 12:02:06Z —
    **hold 1055 s** (dữ liệu waiter sống cho hồ sơ lock: holder dài
    nhất đợt 118 tới lúc này; so t4-round117 giữ 630 s đợt 117).
  - t2 ticket 11:46:43Z, ACQUIRED 12:02:10Z sau khi chờ **927 s**.
  - t9 TIMEOUT 900 s lúc **12:02:19Z — chỉ 9 s sau khi t2 lấy lock**.
    Ticket đã nhả sạch (hàng đợi 0 ticket sau đó; `status` xác nhận).
- Probe KHÔNG chạy (không có thư mục e4a1r). Không số đo.
- Phân loại theo prereg §2: **DEFER-LOCK** → không đếm. Retry đã dùng
  hết 1 lần cho phép của lượt 1 → **lượt 1 ĐỂ TRỐNG**, lô tiếp tục với
  lượt 2 (B, gop30, phase e4b2) ở đợt sau. KHÔNG chạy bù lượt 1.

## 4. Quan sát phụ: T1 đợt 118 đổi lock script giữa lượt 1 att1

- Lock script live md5 đổi giữa lượt 1 att1: 8b02ddc8… (lúc driver
  khởi động 11:40:56Z) → 5cac10af… (sau acquire 11:42:24Z, giữ nguyên
  tới cuối lượt). Đây là T1 đợt 118 thực hiện quyết parent §13 mục 4
  (đổi spec lock sang v2).
- Diff bản copy của tôi (8b02ddc8) với live mới (5cac10af): **chỉ đổi
  khối comment header** (dòng 46–54: trạng thái triển khai + tham chiếu
  docs/VCUT_VITE_LOCK_FREEZE_SPEC.md + cấm sửa file trong lúc có
  acquire đang chạy) — **không đổi protocol** (queue dir, ticket,
  aging 600, cooldown không đổi). Driver tôi chạy bản copy chụp lúc
  khởi động nên không bị đọc rách; acquire/release att1 (wait 27 s,
  hold 84 s) và att2 (ticket/timeout đúng luật) đều khớp log lock v2.
  Không ảnh hưởng kết quả lượt 1. Ghi nhận để T10 đối chiếu: lần đầu
  tiên một luồng đo chạy trong lúc file lock script bị sửa giữa lượt
  mà vẫn đúng nhờ bản copy — mẫu này nên giữ cho các luồng sau.
- Lưu ý: chính spec mới cũng ghi "KHÔNG sửa file này trong lúc có
  acquire đang chạy" — T1 sửa file trong lúc att1 của tôi đang giữ
  lock (11:42:24Z, tôi giữ 11:42:24–11:43:48Z… chính xác: file đổi
  trước khi tôi acquire, trong lúc tôi chờ ticket). Không gây hỏng;
  chỉ ghi nhận, không leo thang (ngoài phạm vi T9).

## 5. Môi trường lượt 1 (boot #54)

- Boot #54: bắt đầu 2026-11-15 10:48:26Z, boot_id
  `48a82db1-a8e4-41fe-9c9d-08719ce19250` (T7 đợt 118 xác minh độc lập;
  gap #53→#54 ≈ 1h01'). Không reboot nào giữa các attempt.
- Replay #54: dpkg đầu tiên 11:35:40Z (boot +47'14" — muộn nhất từ
  trước tới nay); apt-get update xong ~11:36:01Z; dpkg cuối 11:40:56Z;
  tổng 1509 dòng dpkg.log. Postboot PASS 11:41:29Z (T7). Headroom:
  STOP ở i=804 (inotify ENOSPC — đã biết, probe tự đo).
- Tải môi trường dao động mạnh trong lượt: load1 3,46 (lúc bắt đầu
  att1) → 5,17 (lúc probe att1 chạy) → 7,26 (ticket att2) → 31,53
  (lúc att2 chờ lock, 11:52Z — đỉnh tải đợt 118 tới lúc này) → 1,27
  (11:57Z, hog đã tắt). Tải cao thoáng qua là nhiễu từ các luồng T
  khác (T3 dial hog); prereg không đặt cổng tải (chỉ loadN=0 cho hog
  của mình) nên không loại attempt nào vì tải.
- RAM khả dụng: 1195–1556 MB (< 6 GB — birefnet không thử, đúng luật).

## 6. Verdict — T9 không tự quyết E4

- **H1: CHƯA PHÂN ĐỊNH.** Không lượt đếm được nào, không có drift
  re-seek nào để đo.
- **H3: CHƯA PHÂN ĐỊNH.** Không lượt đếm được nào.
- **E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.** Lô E4BATCH đang **0/10 lượt đếm được**
  (lượt 1 để trống; lượt 2–10 chưa chạy). Nợ chuyển tiếp cho đợt 119+:
  chạy lượt 2 (B, gop30, phase e4b2) theo prereg-e4batch.md.
- Nợ quan sát mới (không phải verdict): pause-seek canvas không xác
  nhận ở att1 (tElement 3136 ms, tCanvas null sau 30 s) — nếu lặp lại
  ở các lượt sau, cần luồng riêng chẩn đoán (tải nền vs seek lạnh vs
  preview); T9 chỉ ghi nhận.

## 7. Kiểm chứng

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b` trước/sau
  cả 2 attempt, không đổi. Không sửa production (chỉ thêm LIMITS này).
- Probe: `apps/web/scripts/probe116s1.mjs` không sửa; `node --check`
  OK trước khi đo. Analyzer `hidden_files/round118-t9/analyze-t9.py`
  = bản sao y hệt `round117-t1/analyze-t1.py` (diff chỉ khác 1 dòng
  header) — chưa dùng vì không có probe-results.json nào.
- Lock: log `hidden_files/vite-lock-v2.log` khớp §2/§3 (t9 wait 27 s,
  hold 84 s, TIMEOUT 900 s; t3 hold 1055 s; t2 wait 927 s).
- Prereg: `hidden_files/round118-t9/prereg-e4batch.md` (viết trước mọi
  phép đo mới của lô); sổ cái `e4batch-ledger.md` đã cập nhật lượt 1
  (att1 KILLED-HARNESS, att2 DEFER-LOCK, lượt 1 ĐỂ TRỐNG).
- `tsc` / `vite build` toàn repo: KHÔNG chạy (không sửa production).

## 8. File trong batch

- `docs/PHASE9_ROUND118_T9_E4BATCH_LIMITS.md` (file này — mới).
- Dữ liệu + prereg + driver + analyzer (KHÔNG stage, chỉ tham chiếu):
  `hidden_files/round118-t9/` (prereg-e4batch.md, e4batch-ledger.md,
  run-t9.sh, analyze-t9.py, vcut-vite-lock-v2-copy.sh, run-t9.log,
  run-t9-driver.out, run-t9-driver-retry.out);
  `hidden_files/round116-s1/probe-webkit-load0-gop250-e4a1/`
  (probe-error.txt, probe-log.txt, r2-bridge.log, r2-vite-attempt1.log;
  KHÔNG có probe-results.json — probe chết trước pha phát).
