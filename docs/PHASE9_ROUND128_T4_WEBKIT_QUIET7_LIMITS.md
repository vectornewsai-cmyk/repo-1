# PHASE9_ROUND128_T4_WEBKIT_QUIET7_LIMITS — WebKit lượt yên theo dõi lần 7 (CHẠY LẠI): KHÔNG CÓ LƯỢT YÊN HỢP LỆ — 3/3 attempt đều không đạt chuẩn — ngưỡng GIỮ, nợ chuyển tiếp

> Luồng T4, đợt 128, lượt cron 12:35 +07 17/11/2026 (bắt đầu ~05:39Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> **3 probe đã chạy (attempt1–3) nhưng KHÔNG CÓ lượt yên hợp lệ nào.**
>
> **Kết quả chính — KHÔNG CÓ LƯỢT YÊN HỢP LỆ LẦN 7 (đợt thứ hai liên tiếp).**
> 1. **Attempt1 (20/20, exit 0): median 75,0 ms — LỚP B VI PHẠM (B2).**
>    load1 vọt tới 5,78 giữa lượt (4/11 mẫu >4) — T2 chạy
>    `blind47-sessions.py` chồng lên cửa sổ đo (có trong ps-before).
>    Lượt nhiễm tải, không dùng cho verdict ngưỡng.
> 2. **Attempt2 (20/20, exit 0): median 63,0 ms — LỚP B VI PHẠM (B2).**
>    load1 max 4,18 — chỉ 1 mẫu vượt bar 4,0 (05:54:42Z), và KHÔNG
>    có process luồng khác nào trong ps-before/after (chỉ vite +
>    WebKit của chính T4). Lượt nhiễm tải theo định nghĩa prereg,
>    không dùng cho verdict ngưỡng — kể cả khi median 63,0 > 60
>    (không kích hoạt nhánh "mở lại nợ ngưỡng" vì lớp B đã vi phạm).
> 3. **Attempt3 (16/20, exit 3 pass-timeout): median DỞ DANG 55,0 ms
>    — LỚP B 5/5 ĐẠT nhưng probe CHẾT ở pass 17** (rAF/renderer
>    kẹt 120 s; tickCost fetch timeout sau pass 16). Partial JSON
>    không có blendTick → (b)/(c2)/lag≥5f KHÔNG CÓ DỮ LIỆU.
>    Lượt không hoàn chỉnh, không dùng cho verdict ngưỡng.
> 4. **Ngưỡng WebKit ≤60 ms: GIỮ NGUYÊN** (không đổi) — verdict
>    giữ nguyên trạng thái đợt 127 ("GIỮ — đã có 5 lượt yên xác
>    nhận": 49,5 / 40,0 / 52,0 / 47,5 / 44,0 ms, trung bình
>    46,6 ms). **Nợ lượt yên theo dõi lần 7 VẪN CHƯA ĐÓNG — chuyển
>    tiếp sang đợt 129.**
> 5. **(c2) +1f: tái hiện ở cả 2 lượt hoàn chỉnh** — attempt1: 1 lần
>    (seq 364, presented 35, label 34); attempt2: 2 lần (seq 102,
>    presented 16, label 15; seq 295, presented 31, label 30).
>    Cùng chữ ký cũ (label kém presented đúng 1f). T4 chỉ ghi lại,
>    chuyển T5 chẩn đoán.
> 6. **Event lag ≥+5f: 0 occurrence ở cả 2 lượt hoàn chỉnh** —
>    event cũ đợt 126 (seq 276–279, frame 27) KHÔNG tái hiện.
>    Attempt3 không có dữ liệu blendTick nên không đối chiếu được.
> 7. **F6' vẫn ĐÃ ĐÓNG** (attempt1: 100%/100% n=63; attempt2:
>    100%/100% n=64) — không đóng lại, không mở lại.
> 8. Cờ mở leg tải T3 (`round128-t4-done`) đã touch 06:04Z ngay khi
>    attempt3 xong (trước LIMITS/batch) — phối hợp đúng hẹn.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round128-t4/prereg-t4.md` — viết TRƯỚC
  mọi phép đo (05:42Z), đăng ký: gate 0 + lớp A + lớp B gồm B5,
  ngưỡng ≤60 ms, quy tắc quyết định, touch cờ `round128-t4-done`
  ngay khi attempt xong để T3 bắt đầu leg tải, Xvfb riêng + tự
  kill/dọn socket, KHÔNG đo lại RAM idle, KHÔNG đo TTS 39, KHÔNG
  thử birefnet, dừng sau 3 attempt.
- **Boot trong đợt: #74 (không reboot trong lúc T4 chạy).**
  Boot #74 (`uptime -s` 2026-11-17 04:55:04Z, boot_id
  `c279cf46-a38b-4d93-b6e9-fa251b078108`, số #74 theo task).
  Gap #73→#74 = 1h50m39s = **6639 s** (#73 btime 03:04:25Z →
  #74 04:55:04Z) — nằm trong dải cơ học T4 đợt 127 đã nêu cho #73
  [02:42:25Z, 05:01:21Z] (ghi nhận làm dữ liệu cho T2 điều tra
  mù #47 đợt 128; T4 đợt này không đụng bookkeeping mù).
  Reboot xảy ra giữa đợt 127 đóng (~04:28Z) và lượt này.
- **Replay boot #74: KHỎE.** dpkg_lines=1509 (hình dạng khỏe như
  boot #73 — T5 đợt 128 theo dõi số dòng replay theo quyết parent
  §12(i) đợt 127). Postboot-check check-only riêng PASS từ
  pre-flight 05:40Z và PASS lại sau lượt (06:04Z).
- **Cây đo:** baseline `03bf029f` / media.ts `2c384ed1` — KHÔNG ĐỔI
  suốt đợt (kiểm lúc bắt đầu 05:41Z = mọi poll gate0/gate A =
  kiểm cuối 06:04Z). Lock v2 md5 `cd0c05c1` — bản ĐÚNG. Fixture
  `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS 100%.**
  `analyze-t4-{tickcost,wallbands}.py` trên JSON S5 attempt3 tái tạo
  đúng median 49,5 / p90 75,0; trên JSON T4 attempt8 đợt 118 tái tạo
  đúng median 40,0 / p90 64,7; trên JSON T9 attempt2 đợt 126 tái tạo
  đúng median 44,0 / p90 71,6. Quirk ghi lại: file dry-run R126a2
  riêng lẻ của đợt 127 chứa traceback vì gọi analyzer thiếu `tag=`
  — lần này gọi đúng `tag=path` nên cả 3 tái tạo đúng trong 1 lần
  chạy "all".
- **RAM host dao động mạnh (xem §7.1):** lúc mở đợt 1391 MB; trong
  cửa sổ attempt: 900–2680 MB. Attempt3 RAM rơi 1942→900 MB giữa
  lượt trong khi không có luồng khác nào chạy — áp lực host-level.
- **Vite lock v2-ONLY**, cổng T4 **5187**. T4 giữ lock 3 lần
  (mỗi attempt một lần, nhả sạch ngay sau probe).
- **Các luồng đợt 128 khác:** lúc T4 bắt đầu (05:40Z) đã có
  round128-t1/t5/t6/t8/t9/t10; round128-t2/t3 xuất hiện sau đó.
  Lúc 05:58Z, TẤT CẢ các luồng khác đều đã `.done` (t1 05:42Z,
  t5 05:45Z, t6 05:45Z, t7 05:42Z, t8 05:45Z, t9 05:42Z, t2 05:56Z)
  — chỉ còn T3 (chờ cờ T4) và T10 (wait-flags, poll
  `round128-t4.done`). T3 chưa chạy hog nào trước cờ T4.

## 1. Gate 0 — ĐẠT ở poll #1 (05:43:28Z)

- **Poll #1 (05:43:28Z):** t5flag=PASS (T5 POSTBOOT_PASS cho #74,
  boot_id `c279cf46…` KHỚP, btime 04:55:04Z KHỚP, pass_at
  05:42:56Z, poll=2) + t7flag=VANG-T7-DONE (round128-t7.done
  mtime ≥ boot — fix stale đợt 127 đã mang vào script gốc, kiểm
  đúng) + postboot-check check-only riêng PASS (exit 0 — libs đủ,
  GST đủ isomp4+libav, apt đủ 11 package) + apt_procs=0 + dpkg_lines
  =1509 + load1=1,43 + RAMavail=1376 MB + preview_md5=03bf029f.
  **GATE 0 ĐẠT từ poll #1.** Không cần poll thêm.
- run-t4.sh gate 0 try 1 PASS ở cả 3 attempt (postboot 0, aptx 0,
  dpkgx 0).

## 2. Gate A — mở ngay poll 1 ở cả 3 attempt

### 2.1 Attempt1 (05:45:48Z, poll 1, MỞ)

- load1=0,90 load5=1,42 lock=khong blockers=0 RAMavail=1064 MB
  tree=YES:md5=03bf029f. **CỬA YÊN MỞ poll 1.** RAM chỉ vừa trên
  ngưỡng 1024 MB (1064 MB) — biên mỏng ngay từ đầu.

### 2.2 Attempt2 (05:53:18Z, poll 1, MỞ)

- load1=1,49 load5=1,85 lock=khong blockers=0 RAMavail=2680 MB
  tree=YES:md5=03bf029f. **CỬA YÊN MỞ poll 1.** Điều kiện mở tốt
  nhất trong 3 attempt (RAM cao nhất).

### 2.3 Attempt3 (05:58:29Z, poll 1, MỞ)

- load1=1,30 load5=1,69 lock=khong blockers=0 RAMavail=2027 MB
  tree=YES:md5=03bf029f. **CỬA YÊN MỞ poll 1.**

## 3. Attempt1 — 20/20 pass, exit 0, median 75,0 ms — LỚP B VI PHẠM (B2)

- **Probe:** 20/20 pass, exit 0 (05:46:0x–05:49:23Z). tickCost n=458.
  Vite :5187 kill sạch sau probe; lock v2 nhả sau 219 s giữ.
  Xvfb :193 (probe tự spawn) — process đã kill trong finally,
  socket X193 sót lại, T4 đã xóa tay (xem §7.3).
- **Số đo:** tickCost total median **75,0** / p90 96,0 / max 177 /
  min 32; hậu flip+2000ms median 74,0 (n=332). tBlend gap n=372
  median 116,0 / p90 190,0 / max 2413. BlendTick/pass=18,6;
  rAF/pass median 29 (min 24, max 33). webkit=27.2, pageErrs=[].
- **Phân rã wallMs:** 0–20k median 74,0 (n=47); 20–32k 78,0 (n=72);
  32–45k 82,0 (n=73); 45–62k 67,5 (n=106); 62–70k 71,0 (n=49);
  70–80k 70,0 (n=68). Median cao đều khắp các dải — không phải
  một đoạn cục bộ, mà là toàn lượt chậm (phù hợp nhiễm tải).
- **Lớp B: B1 DAT** (load5 cuối 2,27 ≤ 2,5); **B2 VI PHẠM**
  (load1 max 5,78 — 4/11 mẫu >4: 4,75 / 5,78 / 5,67 / 4,34 lúc
  05:46:51–05:47:52Z); **B3 DAT** (không reboot); **B4 DAT**
  (apt/dpkg 0); **B5 DAT** (RAM min 973 MB, 0 mẫu <500 MB;
  1/11 mẫu <1024 MB — cảnh báo).
  **Nguyên nhân B2:** ps-before (05:45:48Z) có T2 chạy
  `blind47-sessions.py` (pid 14308, `round128-t2`) — phân tích mù
  đọc nhiều file, chồng lên cửa sổ đo. ps-after không còn process
  này (T2 xong giữa lượt). Load1 vọt thành gò 1,39→3,20→3,63→
  4,75→5,78→5,67→4,34→3,44→2,52→2,02→1,71 — trùng cửa sổ T2 chạy.
- **(b) unique-match / F6':** labellag skp=1: nTick=63,
  nOccurrence=126, (c)=0, (c2)=0; skp=0: nTick=207, nOccurrence=414,
  (c)=1, (c2)=1 — **seq 364, presented 35, label 34, lag +1f**.
  Skiplatest: (1) 100,0% (63/63), (2) 100,0% (63/63) —
  **F6' vẫn ĐÃ ĐÓNG** (không đóng lại, không mở lại).
- **Lag ≥+5f: 0 occurrence** (cả 2 skp; max 4f). Event cũ đợt 126
  (seq 276–279, frame 27) KHÔNG tái hiện.
- **Kết luận attempt1: lượt nhiễm tải — KHÔNG dùng cho verdict
  ngưỡng** (lớp B vi phạm theo prereg §1, dù median 75,0 > 60).

## 4. Attempt2 — 20/20 pass, exit 0, median 63,0 ms — LỚP B VI PHẠM (B2, 1 mẫu)

- **Probe:** 20/20 pass, exit 0 (05:53:2x–05:56:48Z). tickCost n=485.
  Vite :5187 kill sạch; lock v2 nhả sạch. Xvfb :193 — socket sót,
  T4 đã xóa tay.
- **Số đo:** tickCost total median **63,0** / p90 92,0 / max 177 /
  min 31; hậu flip+2000ms median 62,0 (n=373). tBlend gap n=390
  median 109,0 / p90 178,1 / max 2609. BlendTick/pass=19,6;
  rAF/pass median 30 (min 24, max 37). webkit=27.2, pageErrs=[].
- **Phân rã wallMs:** 0–20k median 64,0 (n=52); 20–32k 71,0 (n=68);
  32–45k 66,0 (n=91); 45–62k 56,5 (n=132); 62–70k 92,0 (n=39);
  70–80k 60,0 (n=73). Dải 62–70k vọt 92,0 (n=39) — cục bộ, nhưng
  median toàn lượt vẫn 63,0.
- **Lớp B: B1 DAT** (load5 cuối 1,83); **B2 VI PHẠM**
  (load1 max **4,18** — CHỈ 1 mẫu vượt bar 4,0, lúc 05:54:42Z;
  các mẫu còn lại ≤3,69); **B3 DAT**; **B4 DAT**; **B5 DAT**
  (RAM min 1690 MB, 0/11 mẫu <1024 MB).
  **Nguyên nhân B2:** ps-before/after KHÔNG có process phân tích
  nào của luồng khác (chỉ vite + WebKit của chính T4) — gò tải
  1,86→2,27→3,13→3,69→4,18→3,25→2,46→2,21→1,58→1,13→0,81 là
  của chính stack đo (vite + WebKit + MiniBrowser trên cell
  1,5 CPU). Bar B2 (load1 ≤4) được viết cho "yên" tuyệt đối —
  stack đo tự nó đã có thể đẩy load1 qua 4 trong một mẫu 20 s.
- **(b) unique-match / F6':** labellag skp=1: nTick=64,
  nOccurrence=128, (c)=0, (c2)=0; skp=0: nTick=238, nOccurrence=476,
  (c)=2, (c2)=2 — **seq 102 (presented 16, label 15, +1f) và
  seq 295 (presented 31, label 30, +1f)**. Skiplatest: (1) 100,0%
  (64/64), (2) 100,0% (64/64) — **F6' vẫn ĐÃ ĐÓNG**.
- **Lag ≥+5f: 0 occurrence** (cả 2 skp; max 4f). Event cũ đợt 126
  KHÔNG tái hiện.
- **Kết luận attempt2: lượt nhiễm tải theo định nghĩa prereg —
  KHÔNG dùng cho verdict ngưỡng.** Ghi rõ để tránh đọc sai:
  median 63,0 > 60 NHƯNG lượt này vi phạm lớp B, nên theo prereg
  §1 KHÔNG áp dụng nhánh "median > 60 → mở lại nợ ngưỡng".
  Không tự nâng ngưỡng, không mở lại nợ từ lượt nhiễm tải.
  Số đo chỉ báo cáo như một lượt nhiễm tải (median 63,0 dưới tải
  nhẹ, khác median 75,0 dưới tải nặng attempt1).

## 5. Attempt3 — 16/20 pass, exit 3 pass-timeout — LỚP B 5/5 ĐẠT nhưng lượt DỞ DANG

- **Probe:** chết ở pass 17, exit 3 (05:58:3x–06:02:43Z).
  `play pass 17 lỗi: pass-timeout: pass 17 không tiến trong
  120000ms wall-clock (kẹt rAF/renderer)`. Trước đó, tickCost fetch
  đã TIMEOUT sau pass 16 (30 s — giữ tc cũ n=396, không ghi đè,
  đúng thiết kế probe). Partial JSON giữ 16/20 pass.
  Vite :5187 kill sạch; lock v2 nhả sạch. Xvfb :193 — socket sót,
  T4 đã xóa tay.
- **Số đo DỞ DANG (partial, 16 pass):** tickCost n=396 median
  **55,0** / p90 81,0 / max 167 / min 31; hậu flip+2000ms median
  54,5 (n=246). tBlend gap n=0 (partial JSON KHÔNG có blendTick —
  xem §5.1). rAF/pass median 32 (min 28, max 37). webkit=27.2,
  pageErrs=[].
- **Phân rã wallMs (partial):** 0–20k median 54,5 (n=72); 20–32k
  51,0 (n=95); 32–45k 55,0 (n=93); 45–62k 55,0 (n=136); 62–70k
  n=0; 70–80k n=0 (lượt chết trước khi tới các dải cuối).
- **Lớp B: 5/5 ĐẠT** — B1 DAT (load5 cuối 1,25); **B2 DAT**
  (load1 max 1,92 — lượt yên nhất trong 3 attempt về tải);
  B3 DAT (không reboot); B4 DAT (apt/dpkg 0); **B5 DAT**
  (RAM min 900 MB, 0 mẫu <500 MB; 5/13 mẫu <1024 MB — cảnh báo).
  RAM rơi 1942→900 MB giữa lượt (13 mẫu: 1942, 1239, 1177, 1117,
  1084, 1061, 1103, 999, 1065, 1023, 967, …) trong khi ps-before/
  after KHÔNG có process luồng khác nào — RAM rơi là host-level,
  không phải do luồng đợt 128 (xem §7.1).
- **§5.1 (b)/(c2)/lag≥5f: KHÔNG CÓ DỮ LIỆU attempt3.** Partial JSON
  không chứa blendTick (labellag/skiplatest nTick=0; lag5:
  0 occurrence — vacuous). Cơ chế: blendTick chỉ có trong JSON
  hoàn chỉnh, tickCost được ghi tăng dần từng pass còn blendTick
  thì không — partial giữ được tickCost nhưng mất blendTick.
  Ghi rõ như đợt 120 (partial không có blendTick → không theo dõi
  được). F6' không đánh giá được trên partial (n tick skp=1 = 0 <
  30 — "CHUA DU MAU"); F6' vẫn ĐÃ ĐÓNG từ các lượt trước, không đổi.
- **Kết luận attempt3: lượt KHÔNG HOÀN CHỈNH — KHÔNG dùng cho
  verdict ngưỡng** (prereg §1: partial ≥10 pass thì báo cáo median
  DỞ DANG kèm số pass + lý do chết + tickCostStatus=timeout, và
  GHI RÕ không dùng để chốt/mở lại ngưỡng). Median DỞ DANG 55,0
  không được đọc là "lượt yên lần 7 đạt 55 ms".

## 6. Phân tích verdict ngưỡng — GIỮ ≤60 ms, nợ lần 7 chuyển tiếp (đợt thứ hai liên tiếp)

- **Không có lượt yên hợp lệ đợt 128 nên quy tắc quyết định
  prereg §1 KHÔNG áp dụng nhánh median ≤60 hay >60.**
  Attempt1 (75,0) và attempt2 (63,0) đều vi phạm lớp B; attempt3
  (55,0 DỞ DANG) không hoàn chỉnh. Verdict ngưỡng giữ nguyên trạng
  thái đợt 127: **GIỮ ≤60 ms — đã có 5 lượt yên xác nhận**
  (S5 49,5 / T4-118 40,0 / T3-121 52,0 / T9-125 47,5 / T9-126 44,0;
  trung bình 46,6 ms).
- **Nợ lượt yên theo dõi lần 7: VẪN CHƯA ĐÓNG — chuyển tiếp sang
  đợt 129.** Đây là đợt thứ hai liên tiếp không đóng được (đợt 127:
  0 probe vì gate A không mở; đợt 128: 3 probe nhưng 0 lượt hợp
  lệ). Không siết, không mở lại ngưỡng từ đợt không có số đo hợp lệ.
- **Quan sát mới cho đợt sau (không phải kết luận):** bar B2
  (load1 ≤4 trong mọi mẫu 20 s) đang là điểm nghẽn thực tế — cả 2
  lượt hoàn chỉnh đợt này đều vấp B2, trong đó attempt2 chỉ vấp
  đúng 1 mẫu 4,18 do chính stack đo gây ra, không có luồng khác.
  5 lượt yên hợp lệ trước đây đều qua được B2, nên bar vẫn khả thi
  — nhưng đợt sau nên cân nhắc: (a) chạy attempt vào cửa sổ các
  luồng khác đã xong hẳn (attempt3 chứng minh load1 có thể giữ
  ≤1,92 khi máy thật sự yên); (b) nếu B2 tiếp tục là điểm nghẽn
  duy nhất trong khi median vẫn ≤60, parent có thể xem xét lại
  định nghĩa B2 (ví dụ: cho phép 1 mẫu vượt nhẹ do stack đo, hoặc
  đo load1 bằng sampler dày hơn) — T4 KHÔNG tự sửa bar giữa đợt,
  chỉ ghi nhận để parent quyết.

## 7. Kiểm chứng hồi quy + hạ tầng

### 7.1 RAM host sụt giữa lượt (không ghim phẳng)

- RAMavail trong đợt: lúc mở 1391 MB; gate 0: 1376 MB; attempt1
  mở cửa 1064 MB, giữa lượt 973–1939 MB; attempt2 mở cửa 2680 MB,
  giữa lượt 1690–2625 MB; attempt3 mở cửa 2027 MB, giữa lượt rơi
  1942→900 MB (5/13 mẫu <1024 MB). Sau khi T4 dừng (06:04Z):
  2598 MB — RAM hồi nhanh sau khi probe dừng, cho thấy áp lực
  trong lượt một phần do chính WebKit/vite giữ, một phần host-level.
- Không có process đơn lẻ nào chiếm RAM lớn trong ps-before/after
  các attempt (chỉ vite + WebKit của T4 + esbuild service) — áp
  lực RAM rơi ở attempt3 là host-level (ngoài cell), giống đợt
  124/125/126/127. Ngưỡng RAM giữ nguyên (không hạ để "cho qua").

### 7.2 Hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `03bf029f` không đổi: ghi lúc bắt đầu
  (05:41Z) = mọi poll gate0/gate A = kiểm cuối (06:04Z).
  `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy 06:04Z, log `tsc-after.log`).
  `vite build`: KHÔNG chạy lại — cây baseline đã được T3 verify sau
  khi gỡ patch đợt 122 (tsc + vite build PASS); cây md5 không đổi
  nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production, không có lượt đo nào cần hồi quy thêm.
- Postboot-check sau lượt: exit 0 (06:04Z) — replay boot #74 vẫn
  PASS sau khi đo xong.

### 7.3 Sự cố hạ tầng + vận hành trong lúc đo

1. **Xvfb :193 để lại socket sót sau mỗi attempt.** Probe spawn
   Xvfb :193 và kill SIGKILL trong finally — process chết nhưng
   file socket `/tmp/.X11-unix/X193` còn lại (SIGKILL không dọn
   socket). T4 đã xóa tay sau mỗi attempt; cuối đợt
   `/tmp/.X11-unix/` trống, 0 Xvfb process. Khác vụ T3 đợt 127
   (:197 còn PROCESS chạy làm O8 exit=2) — đây chỉ là socket sót,
   không chặn display khác (probe chọn display bằng ps, không bằng
   socket). Đề xuất: probe nên unlink socket của mình sau kill,
   hoặc driver dọn sau mỗi attempt (T4 đã làm tay đợt này).
2. **`pkill -f "poll-t4.sh"` tự giết shell của T4.** Lúc dọn poller
   sau lượt, lệnh pkill khớp luôn cmdline của chính shell exec đang
   chạy (vì cmdline chứa chuỗi "poll-t4.sh") → shell bị SIGTERM
   giữa chừng. Không mất dữ liệu (tsc + postboot đã xong trước
   đó; dọn dẹp làm lại ngay sau). Bài học: dùng mẹo ngoặc
   `poll-t4[.]sh` khi pkill/grep để khỏi tự khớp.
3. **Attempt1 nhiễm tải từ T2:** T2 chạy `blind47-sessions.py`
   chồng lên cửa sổ đo của T4 (ps-before có, ps-after không).
   T2 làm đúng việc của nó (probe mù #47 theo lịch); T4 không yêu
   cầu T2 dừng. Đợt sau: lượt yên nên chạy khi các luồng phân tích
   nặng đã xong, hoặc T2 tránh cửa sổ attempt của T4 (attempt3
   chứng minh máy yên thật thì load1 giữ ≤1,92).
4. **Attempt3 chết pass-timeout dù lớp B 5/5 ĐẠT:** rAF/renderer
   kẹt 120 s ở pass 17 trong khi load thấp (max 1,92) và RAM rơi
   1942→900 MB. Chưa chứng minh được nhân quả RAM→kẹt (chỉ tương
   quan thời gian); không ghi "chết do RAM" như kết luận. Cần theo
   dõi: nếu pass-timeout tái hiện ở các lượt sau khi RAM <1000 MB
   thì mới có cơ sở.
5. **Phối hợp lịch T3 ĐÚNG HẸN đợt này:** T3 chờ cờ T4, không chạy
   hog trước 06:04Z; T4 touch cờ `round128-t4-done` ngay 06:04Z
   khi attempt3 xong (trước LIMITS/batch). Các luồng khác đều đã
   `.done` trước đó (t2 05:56Z là luồng cuối cùng) nên cửa yên
   attempt3 là sạch nhất đợt.
6. **Quirk check-classb (ghi lại, không sửa giữa đợt):** dòng
   `--- KET LUAN LOP B:` trong file classb trống (không in verdict
   tổng) — cả đợt 125/126/127 đều vậy. Đợt sau nên sửa script in
   verdict tổng rõ ràng (nợ từ LIMITS đợt 127 §9.3, chưa làm).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND128_T4_WEBKIT_QUIET7_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe KHÔNG đổi nên KHÔNG
  stage lại. Script `gate0-wait-t4-c279cf46.sh` (mang fix stale
  VANG-T7-DONE + sửa dòng kết "10 poll"→"30 poll"),
  `run-t4.sh` / `t4-attempt-inner.sh` / `check-classb-t4.sh` /
  `poll-t4.sh` (adapt từ đợt 127: round128-t4, hậu tố c279cf46,
  ticket lock t4) — bản copy trong `hidden_files/round128-t4/`,
  ngoài repo — không stage.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round128-t4-quiet7.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round128-t4/`
  (prereg-t4.md [viết trước khi đo],
  probe121t3-ghost-k7.webkit.mjs [KHÔNG SỬA, md5 `dccb8f4c…`],
  analyze-t4-{tickcost,labellag,skiplatest,wallbands,lag5}.py
  [copy đợt 127, đổi tên t9→t4],
  analyze-t4-dryrun-all-{tickcost,wallbands}.txt [dry-run PASS đợt
  này: S5 49,5/75,0 + A8 40,0/64,7 + R126a2 44,0/71,6],
  b.json [copy đợt 127, md5 `078938cf…`],
  vite.t4-temp.config.mjs [copy đợt 127, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t4.sh [adapt đợt 128: round128-t4, hậu tố log c279cf46,
  ticket lock t4] + t4-attempt-inner.sh [adapt round128-* +
  hậu tố c279cf46 + sampler đã sửa đợt 125]
  + check-classb-t4.sh [lớp B gồm B5]
  + gate0-wait-t4-c279cf46.sh [gate 0 #74 ĐẠT poll #1]
  + gate0-wait-t4-c279cf46.log + gate0-wait-t4-c279cf46.nohup.log,
  poll-t4.sh + poll-t4.log [mẫu 5 phút + gate0/gateA: gate 0 đạt
  poll #1, gate A mở poll 1 cả 3 attempt] + poll-t4.nohup.log,
  postboot-t4-c279cf46-gate0wait-1.log [gate 0 #74: exit 0]
  + postboot-t4-c279cf46-attempt{1,2,3}-gate0.log [gate 0 run-t4.sh:
  PASS] + postboot-t4-c279cf46-after.log [sau lượt: exit 0],
  run-t4-attempt{1,2,3}.nohup.log [attempt1–3],
  chain-t4.log [gate0/gateA attempt1–3 + lớp B + touch cờ],
  ps-before-t4-attempt{1,2,3}.txt + ps-after-t4-attempt{1,2,3}.txt,
  load-mid-t4-attempt{1,2,3}.log [sampler 20 s],
  vite-5187-t4-attempt{1,2,3}.log,
  run-webkit-t4-attempt{1,2,3}.log,
  preview-b-f3-flip-webkit-t4-attempt{1,2,3}.json [attempt1:
  20/20, 2.381.003 B; attempt2: 20/20, ~2,4 MB; attempt3: partial
  16/20 — giữ trên đĩa, KHÔNG đưa vào paths],
  analyze-t4-attempt{1,2,3}-{tickcost,wallbands,labellag,
  skiplatest,lag5}.txt,
  classb-t4-attempt{1,2,3}.txt,
  tsc-after.log [tsc exit 0],
  tree-md5.txt [`03bf029f` — baseline]).
- Cờ xong: `hidden_files/round128-t4.done` (kèm verdict 1 dòng).
  Cờ mở leg tải T3: `hidden_files/round128-t4-done` đã touch
  06:04Z ngay khi attempt3 xong (trước LIMITS/batch).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Nợ lượt yên theo dõi lần 7: VẪN CHƯA ĐÓNG — chuyển tiếp sang
   đợt 129.** Ngưỡng WebKit ≤60 ms GIỮ (5 lượt yên hợp lệ:
   S5 49,5 / T4-118 40,0 / T3-121 52,0 / T9-125 47,5 / T9-126
   44,0; trung bình 46,6 ms). Đợt sau chạy lại lượt yên lần 7
   (không phải lần 8) — không siết/mở ngưỡng từ đợt không có số đo
   hợp lệ. Đây là đợt thứ hai liên tiếp không đóng được.
2. **B2 là điểm nghẽn thực tế đợt này** (cả 2 lượt hoàn chỉnh đều
   vấp; attempt2 chỉ vấp 1 mẫu 4,18 do chính stack đo). Đợt sau:
   chạy attempt khi các luồng phân tích nặng đã xong (attempt3
   chứng minh load1 giữ ≤1,92 khi máy yên thật); nếu B2 tiếp tục
   là điểm nghẽn duy nhất trong khi median vẫn ≤60, parent xem xét
   lại định nghĩa B2 (ví dụ: cho phép 1 mẫu vượt nhẹ do stack đo)
   — T4 không tự sửa bar.
3. **(c2) lệch nhãn +1f: tái hiện 3 lần đợt này** (attempt1 seq 364
   presented 35/label 34; attempt2 seq 102 presented 16/label 15
   + seq 295 presented 31/label 30) — cùng chữ ký cũ. Chuyển T5
   chẩn đoán (T5 đợt 127 đã giải thích được (c2) bằng nhãn gán
   trước pixels median 38 ms; các occurrence mới khớp mẫu đó).
   **Event lag ≥+5f: 0 occurrence đợt này** — event seq 276–279
   frame 27 không tái hiện; giữ làm case theo dõi.
4. **Pass-timeout ở attempt3 (rAF kẹt 120 s, RAM rơi 1942→900 MB):**
   theo dõi đợt sau — nếu tái hiện khi RAM <1000 MB thì mới có cơ
   sở kết luận; hiện chỉ là tương quan, không ghi "chết do RAM".
   Partial JSON mất blendTick — nếu cần (b)/(c2) trên lượt dở dang
   thì probe phải ghi blendTick tăng dần như tickCost (đề xuất cải
   tiến probe, không sửa giữa đợt).
5. **Xvfb socket sót:** probe nên unlink socket của mình sau kill
   (SIGKILL để lại `/tmp/.X11-unix/X193`); driver các luồng sau
   dọn socket sau mỗi attempt như T4 đã làm tay đợt này.
6. **Sửa script gốc gate0-wait:** fix stale VANG-T7-DONE + sửa dòng
   kết "KHONG DAT sau 10 poll" đã mang vào bản đợt 128 (nợ từ
   LIMITS đợt 127 §9.3 — ĐÃ LÀM ở bản copy đợt này; cần mang vào
   bản gốc các đợt sau). Sửa check-classb in verdict tổng rõ ràng
   (dòng KẾT LUẬN trống — nợ vẫn còn).
7. **Nợ khác đứng yên theo LIMITS gộp đợt 127 §11 + quyết parent
   §12 (cập nhật đợt 128):** DEF v0.4 (T3 đợt 128), mù #47 (T2 đợt
   128 — gap #73→#74 = 6639 s đã nằm trong dải cơ học, ghi nhận ở
   §0), 85m4 webkit chạy lại (T8 đợt 128), replay #74: 1509 dòng
   (hình dạng khỏe như #73 — T5 theo dõi); R9 (a) VẪN CHỜ user;
   G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của user; birefnet 0 lần
   (RAM khả dụng vẫn dưới guard 6 GB); TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi.
   Boot mới nhất: #74 04:55:04Z (gap #73→#74 = 6639 s). T3 đang
   chạy leg tải sau cờ T4 (mở 06:04Z).
