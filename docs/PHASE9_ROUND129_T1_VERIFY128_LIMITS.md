# LIMITS — Phase 9 đợt 129 T1: Kiểm chứng độc lập đợt 128 (DEF v0.4 + mù #47 + đếm cuối + T3/T4/T5)

**Ngày:** 17/11/2026. **Luồng:** T1, đợt 129 vòng lặp Phase 9 (lượt cron
15:35 +07 17/11/2026). **Trạng thái:** **KIỂM CHỨNG XONG — mọi claim lớn
đợt 128 PASS; tìm thêm 3 sai số/điểm nhỏ mới (F-129-1/2/3), không đổi
verdict nào.**
**Không đo mới, không probe đo, không chạy suite nặng, không sửa
production, không sửa file của đợt 128 — chỉ đọc + tính lại từ dữ liệu
thô bằng code riêng.** Boot lúc làm việc: #75 (btime 07:13:31Z),
RAM khả dụng ~1.152–2.757 MB trong phiên — dưới guard birefnet 6 GB,
không thử birefnet. Không kiểm lại TTS 39. Không push.

## 0. Phương pháp (độc lập, không tin handoff mù)

- Tính lại từ JSON thô bằng code riêng của T1 (không dùng analyzer của
  T3 hay script của T8 — chỉ đối chiếu kết quả với output của T8 sau
  khi tính xong): `benchmarks/results/webkit-blob-flaky-127t3-f2startup-interleave.json`
  (12 case), `...-126t4-f2startup-leg4555.json` (6 case),
  `...-125t4-f2startup-legtrunggian.json` (6 case),
  `...-124t4-f2startup-legload.json` (12 case). Định nghĩa T_startup
  = loadedmetadata đầu − loadstart đầu; avg60 = mean psiSomeAvg60
  trên các psiSample của run; ngưỡng chậm T_startup > 1,2 s.
- Đối chiếu mù #47 từ file gốc của T2 (`hidden_files/round128-t2/`):
  `status1/once/status2.txt` + `.exit`, `blind47-gaps.txt`,
  `blind47-investigate.log`, `blind47-hidden_files.txt` (513 dòng),
  `blind47-repo-1.txt` (20 dòng); log probe v2
  `hidden_files/eperm-probe-v2.log` (hiện 136 dòng — xem §2).
- Đếm cuối: chạy lại `hidden_files/round128-t10/count-final.py`
  verbatim, rồi chạy lại đúng trạng thái lúc T10 đếm (xem §3 — có bẫy
  double-count, ghi rõ).
- T3/T4/T5: đọc JSON/log gốc (`m4-scratch/m4-webkit-w7-report.json`,
  `m4-run.log`, `preview-b-f3-flip-webkit-t4-attempt{1,2,3}.json`,
  `analyze-t4-*.txt`, `classb-t4-attempt*.txt`,
  `round128-t5/POSTBOOT_PASS`), không chạy lại harness/probe.
- Đã đọc trước: `docs/PHASE9_ROUND128_LIMITS.md` §§10–12,
  `PHASE9_ROUND128_T1_DEF_V04_LIMITS.md`,
  `PHASE9_ROUND128_T2_PROBE47_LIMITS.md`,
  `PHASE9_ROUND128_T8_VERIFY_LIMITS.md`.

## 1. DEF v0.4 (T1 đợt 128): PASS — dải ~31–53% truy được về dữ liệu leg T3 đợt 127

File `docs/PHASE9_ROUND128_T1_PSIAXIS_DEF_V04.md` (42.715 B,
md5 `f447a2d5f6dc7a0a62f04b82dd09f2c3`) — khớp kích thước T1 ghi.

### 1.1 Dải trộn ~31–53% — tính lại từ JSON thô: PASS

| Claim trong DEF v0.4 | Tính lại từ JSON thô | Kết quả |
|---|---|---|
| Leg 127 dial TRỘN 3/6, dãy S-F-F-S-F-S | T_startup dial [1,322; 1,082; 1,195; 1,702; 1,003; 1,395] → S-F-F-S-F-S, chậm 3/6 | ✓ |
| run 6 CHẬM 1,702 s @ 31,52% vs run 4 NHANH 1,195 s @ 31,67% | run 6 (index 5): 1,702 s @ 31,52; run 4 (index 3): 1,195 s @ 31,67 | ✓ |
| Run chậm thấp nhất 30,83% (run 9) | dial chậm: 41,40 / 31,52 / 30,83 → min 30,83 | ✓ |
| Dial avg60 mean 35,99%, range 30,83–41,48% | mean-of-means 35,99; range đúng | ✓ |
| Leg 126 TRỘN 3/6, mean 45,98% | T_startup [1,295; 0,915; 1,403; 0,980; 1,284; 1,170] → chậm 3/6; avg60 mean 45,98 | ✓ |
| Leg 125 TRỘN 4/6, mean 53,19% | chậm 4/6; avg60 mean 53,19 | ✓ |
| tickRate trung gian ~28–33, tái hiện lần 3: 32,44 @ ~36% | leg 127 tickRate mean 32,44; leg 126: 32,01; leg 125: 28,52 | ✓ |
| Đường cong 6 điểm n=36: 71,6 @ ~10% → 32,4 @ ~36% → 32,0 @ ~46% → 28,5 @ ~53% → 18,5 @ ~70% → 16,8 @ ~91% | Yên-127 tickRate mean 71,57 @ avg60 mean 10,10; Vừa 18,54 @ 69,71; Nặng 16,77 @ 90,69 | ✓ |
| Hold 30 s: run 1 mean 41,40% > mean run ổn định 40,28% | run 1: 41,40; runs 2+7 mean (41,48+39,07)/2 = 40,28 | ✓ |
| Dial ấm: sai số 3,63 (cả leg, ĐẠT) / 7,92 (run ổn định, KHÔNG ĐẠT) | W = 32,36 (warmup-out.json, T8 đã verify); \|32,36−35,99\| = 3,63; \|32,36−40,28\| = 7,92 | ✓ |
| Số hog không cố định mức tải: W 45,74% (boot #71) vs 32,36% (boot #73), chênh 13,38 | 45,74 − 32,36 = 13,38; số 45,74 từ DEF v0.3.1 leg 126 (T8 đã verify 0,24 điểm) | ✓ |
| Ngưỡng Yên <30% ĐỨNG, biên 0,83 điểm | run chậm thấp nhất 30,83 − 30 = 0,83; 0/12 run Yên chậm | ✓ |
| Pha (b) T_seek miễn nhiễm, max 0,001 s, n=42 | leg 127: T_seek max 0,001 s trên 12 run (khớp T8) | ✓ |

Kết luận §1.1: **dải ~31–53% đứng vững trên dữ liệu thô.** Không có
số nào trong DEF v0.4 §2/§3/§6 mồ côi (trừ F-129-1 ở §4.1).

### 1.2 Đính chính "TRỘN 3/3" → "TRỘN 3/6": PASS — lỗi có thật trong v0.3.1, v0.4 sửa đúng

- `docs/PHASE9_ROUND127_T2_PSIAXIS_DEF_V031.md` §11 (dòng 445, đọc
  trực tiếp): *"cận dưới ~45% ĐÃ KIỂM CHỨNG bằng TRỘN 3/3 tại
  ~46%"* — **lỗi có thật trong file**.
- Cùng file đó tự mâu thuẫn với chính nó: dòng 24–25 *"3/6 nhanh,
  3/6 chậm tại ~46%"*, dòng 84 *"TRỘN 3/6 chậm"*, dòng 94 *"chậm
  3/6, nhanh 3/6"* — đều ghi 3/6. Lỗi chỉ nằm ở câu §11.
- Dữ liệu thô leg 126 tính lại: chậm đúng 3/6 (xem bảng §1.1) →
  **số đúng là 3/6**.
- DEF v0.4 §11 viết: *"cận dưới ~45% ĐÃ KIỂM CHỨNG bằng TRỘN 3/6
  tại ~46%"* — **sửa đúng**.
- File v0.3.1 giữ nguyên làm lịch sử: md5
  `02fe8218d6831099b7e89d342ddd83ea`, 32.555 B — khớp đúng số T1
  ghi, không bị sửa sau khi viết v0.4. ✓

## 2. Mù #47 ĐÓNG HOÀN TOÀN (T2 đợt 128): PASS

### 2.1 Probe #47 — đối chiếu log gốc: PASS

- Log probe v2 `hidden_files/eperm-probe-v2.log` hiện **136 dòng**:
  133 dòng sau probe #47 + đúng 3 dòng của checklist probe #48 đợt
  129 (08:39:55Z: DEAD + boot changed c279cf46 → 475406f6 + probe
  #48) — trừ 3 dòng mới này ra được đúng **133 dòng** như T2 ghi.
  Dòng probe #47 còn nguyên trong log:
  `2026-11-17T05:42:21Z probe#47 boot=c279cf46 tmp+ws ok=2 fail=0`.
- Đúng **1 dòng `probe start`** (08:49:50Z 11/11), **0 dòng
  `=== probe end`** — khớp T2.
- File gốc của T2: `status1.txt` (DEAD/STALE, age 10.867 s, last
  #46 02:41:09Z, boot 81464315) + `status1.exit` = 1; `once.txt`
  (probe #47, boot c279cf46, ok=2 fail=0) + `once.exit` = 0;
  `status2.txt` (ALIVE, age 0 s, n=47) + `status2.exit` = 0. ✓
- Heartbeat nay đã n=48 (probe #48 đợt 129, 08:39:55Z, boot
  475406f6) — không thuộc phạm vi kiểm chứng đợt 128, chỉ ghi nhận
  để khỏi nhầm số.

### 2.2 Hai gap chứng nhận dạng khoảng — số học + thống kê: PASS

- Gap #72→#73: #72 btime 02:10:17Z → #73 03:04:25Z = **3.248 s
  (54'08")**; khoảng **[3.238 s, 3.258 s]** (±10 s biên T5). ✓
- Gap #73→#74: 03:04:25Z → 04:55:04Z = **6.639 s (1h50'39")**;
  khoảng **[6.629 s, 6.649 s]**. ✓
- `blind47-gaps.txt` (md5 `59e63b0963ff547aba205e74db98f1ca`,
  đối chiếu trực tiếp đuôi file): **CERT41: mean 1h41'16" median
  1h54'16" p10 0h31'47" p90 2h24'11" sd 0h43'27" min 0h19'07" max
  3h14'08"**; **FULL56: mean 1h48'02" median 1h54'38" p10 0h32'24"
  p90 2h44'14" sd 0h57'04" min 0h19'07" max 5h43'18"; in 90–150' =
  30, <60' = 11, >180' = 6, >240' = 2** — khớp từng số với LIMITS
  T2 §2.5. Chạy nhạy LO/HI: CERT41-LO/HI và FULL56-LO/HI lệch ≤1 s
  ở mean — khớp T2. Cross-check tái hiện CERT39/FULL54 của T7-126
  đúng từng số trước khi thêm 2 gap mới. ✓
- Dải cơ học cho #75 từ #74 (p10–p90 FULL56): [05:27:27Z,
  07:39:18Z] — khớp T2. (Boot #75 thật tới 07:13:31Z, trong dải —
  quan sát ngoài phạm vi đợt 128, chỉ ghi nhận.)
- Tốc độ reboot: 74 / 152,62 h = 1 mỗi 123,7 phút; +4 ẩn có thể →
  78 / 152,62 h = 1 mỗi 117,4 phút — khớp T2 §2.5. ✓

### 2.3 Ba đoạn A/B/C đóng — đối chiếu `blind47-investigate.log`: PASS

`blind47-investigate.log` (md5 `103b513f52d1a388952ca79844fea7b3`):

- Đoạn A: **123 mốc**, lỗ lớn nhất **95 s** (02:51:07Z →
  02:52:42Z), mốc đầu 02:41:09Z (head 0 s), mốc cuối 03:03:30Z,
  tail **54 s**. Sàn 1.147 s: mọi khoảng + head + tail đều < sàn →
  **ĐÓNG**. ✓
- Đoạn B: **345 mốc**, lỗ lớn nhất **632 s** (04:08:15Z →
  04:18:47Z), mốc đầu 03:04:30Z (head 6 s), mốc cuối 04:47:24Z,
  tail **459 s**. Mọi khoảng + head + tail đều < sàn 1.147 s →
  **ĐÓNG**. ✓
- Đoạn C: 56 mốc; đóng bằng `uptime -s` trực tiếp lúc probe #47
  (= 04:55:04Z) + probe #47 đọc boot_id c279cf46 tươi. ✓
- Tổng mốc: 20 file repo-1 + 513 file hidden_files = 533 file,
  **524 mốc giây phân biệt / 524 mốc float phân biệt** — khớp T2
  (đếm dòng `blind47-hidden_files.txt` = 513, `blind47-repo-1.txt`
  = 20). ✓
- Ghi chú phương pháp (không phải lỗi): tail A/B trong log là
  hiệu float làm tròn xuống (int): tail A = 03:04:25,000 −
  03:03:30,636 = 54,36 s → ghi 54 s (đã xác minh bằng `stat`
  file `t5-postboot-b72-poll9.log`, mtime 03:03:30.635968154Z).
  Tail B = 459 s theo cùng cách tính; file mốc cuối B
  (build-loop-log.md) đã bị ghi đè lúc 08:38Z đợt 129 nên float
  gốc không còn kiểm lại được trực tiếp — dựa vào log điều tra
  đương thời, cách tính đã xác minh là nhất quán ở đoạn A.
- Hạn chế kiểm chứng (ghi rõ, không giấu): không chạy lại quét
  mtime toàn cây — quét mới lúc này đã nhiễm dữ liệu đợt 129
  (reboot #75 + ghi file sau 07:13Z), nên bằng chứng là log/script
  đương thời của T2 + số học kiểm lại, không phải quét độc lập
  mới. Tương tự: replay dpkg 1.509 dòng của boot #74 và F74 ≈ 0
  không kiểm lại được trực tiếp (boot #75 đã reset /var/log);
  ba ghi nhận độc lập (T2 §2.1, T5 §2, T9 §9) đều khớp nhau:
  1.509 dòng, 05:35:43–05:38:51Z, 217 installs, gói cuối
  gstreamer1.0-tools — không mâu thuẫn.

## 3. Đếm cuối đợt 128: PASS — 177 batch / 473 entry / 427 file duy nhất

- Tái kiểm bằng phương pháp §10.2 LIMITS gộp (entry NUL trong file
  paths theo đợt + dedup theo đường dẫn tương đối; lũy kế bằng dedup
  toàn cục trực tiếp trên đĩa, KHÔNG cộng số học):
  - Đợt 128 trước closing: **9 batch / 12 entry / 12 file**.
  - Lũy kế 111–127 tái kiểm: **167 batch / 459 entry / 415 file** —
    khớp chính xác số đã đính chính đợt 127 §12.2(j).
  - Lũy kế 111–128 gồm closing: **177 batch / 473 entry / 427 file
    duy nhất** (415 + 12 file mới-only = 427 ✓).
  - File mới-only đợt 128 (12): 9 file LIMITS T1–T9 + DEF v0.4 +
    script hb128 + LIMITS gộp. File trùng với 111–127 (2):
    `PHASE9_GAP_ANALYSIS.md` +
    `apps/web/scripts/vcut-webkit-postboot-check.sh`. ✓
  - Tất cả 14 đường dẫn đợt 128 đều tồn tại trên đĩa trong repo. ✓
- Xem F-129-2 (§4.2) về bẫy khi chạy lại script đếm verbatim sau
  khi file closing đã tồn tại — số công bố 177/473/427 vẫn đúng.

## 4. T3 85m4 + T5 boot #74 + T4 lượt yên #7: PASS (đối chiếu log/JSON gốc)

### 4.1 T3 — 85m4 webkit hb128 exit 0, P3 không kẹt: PASS

- Report JSON `hidden_files/round128-t3/m4-scratch/m4-webkit-w7-report.json`
  (129.294 B, md5 `327fb154f4fc87c37b78cc8b8ceb6d4f`):
  `ok=true`, `startedAt 2026-11-17T06:06:44.936Z`,
  `finishedAt 2026-11-17T06:08:58.622Z` (134 s),
  `engines.webkit.consoleErrs=[]`, P3 `extraCount=0`,
  `extraEvents=[]`. ✓
- Run log `m4-run.log`: P1 PASS (đồng bộ 2,7 s), P2 PASS (reset
  694 ms), **P3 PASS (đồng bộ 1,3 s; phát thường 20 s, 0 restart)**,
  P4-lần1/2/3 PASS — khớp LIMITS T3 §6. Dòng heartbeat `[HB128]
  sampleFor` đều 5 s/lần trong cửa sổ P3 (5/10/15/20 s, n=16/32/48/64)
  — đúng như T3 ghi: heartbeat chưa từng thấy lần chờ nào vượt 5 s,
  nên nguyên nhân kẹt đợt 127 vẫn chưa chứng minh. ✓
- Script `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs`
  tồn tại (33.777 B, md5 `0a8828c0da7b827b1198d55f26884384`).
  File gốc `clicktest-85m4-webkit-w7.mjs` không sửa (T3 đã ghi
  md5 `580af38f…` — không kiểm lại md5 gốc lượt này vì không phải
  claim headline; ghi nhận).

### 4.2 T5 — boot #74 PASS +47m52s: PASS (đối chiếu file cờ)

- Cờ `hidden_files/round128-t5/POSTBOOT_PASS` (md5
  `69f50c8a20e6e43630a37b04b6d4617f`):
  `POSTBOOT_PASS boot_id=c279cf46-a38b-4d93-b6e9-fa251b078108
  btime=2026-11-17T04:55:04Z pass_at=2026-11-17T05:42:56Z poll=2`
  — khớp LIMITS T5 (try1 PASS 05:41:30Z, cờ viết 05:42:56Z =
  boot +47m52s). ✓
- Btime #74 = 04:55:04Z thống nhất qua T2/T5/T6/T7/T9 (5 nguồn
  độc lập trong đợt). Lưu ý nhỏ T3 đã ghi: stat /proc/1 cho
  04:55:17Z — khác chuẩn 04:55:04Z (uptime -s + btime kernel);
  **04:55:04Z là chuẩn**, T2/T5 dùng đúng. ✓

### 4.3 T4 — lượt yên WebKit #7, 0 lượt hợp lệ: PASS (đối chiếu JSON + analyzer)

- `preview-b-f3-flip-webkit-t4-attempt1.json` (md5
  `4f86236ed4a64deb34b39e0f40b36e10`): passes=20, pageErrs=[];
  analyzer: tickCost n=458 **median 75,0** ms. Class B: load1 max
  **5,78**, ps-before có `blind47-sessions.py` của T2 (pid 14305)
  chồng lên cửa sổ đo → B2 VI PHẠM. ✓
- `...-attempt2.json` (md5 `2fde0dbb12346f796d064c58c1c6677f`):
  passes=20; tickCost n=485 **median 63,0** ms. Class B: load1 max
  **4,18** (1 mẫu vượt bar 4,0), ps-before/after chỉ có vite +
  WebKit của chính T4 → B2 VI PHẠM theo định nghĩa prereg. ✓
- `...-attempt3.json` (md5 `93984822683156ff45247debfe263e05`):
  passes=20, **passesDone=16, partial=true,
  partialReason=pass-timeout**; tickCost n=396 median **55,0** ms
  (dở dang); tBlend gap n=0 (không có blendTick) → (b)/(c2)/lag≥5f
  không có dữ liệu — khớp T4. ✓
- (c2) +1f tái hiện 3 lần — đối chiếu file analyzer gốc
  `analyze-t4-attempt{1,2}-skiplatest.txt`: attempt1
  `[(364, 35, 34)] (n=1)`; attempt2 `[(102, 16, 15), (295, 31,
  30)] (n=2)` — khớp từng số với LIMITS T4. ✓
- Event lag ≥+5f: 0 occurrence ở cả 2 lượt hoàn chỉnh
  (`analyze-t4-attempt{1,2}-labellag.txt`: `>=5f: 0`). ✓
- F6' vẫn đóng (100%/100% n=63/n=64 — theo LIMITS T4; không tính
  lại vì không phải claim headline mới).
- Ngưỡng ≤60 ms GIỮ + B2 GIỮ NGUYÊN là quyết parent đợt 128 §12(a),
  không phải kết luận của T4 — T4 chỉ ghi nhận, T1 không xét lại.

### 4.4 Các số phụ khác (đối chiếu nhanh, không đo lại)

- T9 headroom: log `round128-t9/headroom-measure-1.log` còn trên
  đĩa (05:40:28Z, Mem available 1.346 MB lúc đo); LIMITS T9 ghi
  3.212 / đo lặp 3.211, errno=28 — nhất quán với phương pháp probe
  (probe không chạy lại lượt này để giữ máy yên cho T4). ✓
- Cờ `.done`: đủ 10/10 (T1–T9 + T10) trên đĩa, mtime khớp giờ
  T10 ghi trong LIMITS gộp §0 (T1 05:42, T2 05:56, T3 06:10, T4
  06:06, T5 05:45, T6 05:45, T7 05:42, T8 05:45, T9 05:42, T10
  06:23). ✓

## 5. Sai số / phát hiện mới (kiểu F3 — không đổi verdict)

- **F-129-1 (mới, trong DEF v0.4): mean Yên-127 10,27% vẫn còn
  trong DEF v0.4.** DEF v0.4 §3 bảng Yên (dòng 88) viết:
  *"Yên-127: 4,09–14,13%, mean 10,27%"*. Tính lại từ chính các số
  avg60 từng run do analyzer in ra (14,13; 11,61; 13,10; 11,39;
  6,29; 4,09): tổng 60,61 / 6 = **10,10%** (pooled 10,13%; lấy mẫu
  5 s 10,17% — không cách tính nào cho 10,27%). Đây chính là lỗi
  F3 mà T8 đã báo — T1 đợt 128 đã tránh nó ở điểm đường cong
  ("71,6 @ ~10%") nhưng **không sửa nó ở bảng §3** khi chép số
  Yên-127 vào DEF v0.4. Ảnh hưởng: KHÔNG ĐÁNG KỂ — vẫn ~10%, xa
  dưới ngưỡng Yên 30%; không đổi dải, ngưỡng hay bất kỳ kết luận
  nào. Đề xuất: DEF v0.5 (khi viết) ghi 10,10%; không sửa file
  v0.4 sau khi ban hành (lịch sử giữ nguyên, đính chính ở đây).
- **F-129-2 (mới, phương pháp đếm): `count-final.py` không lũy
  thừa sau khi file closing tồn tại.** Chạy verbatim script lúc
  này cho **178 batch / 475 entry** (sai +1 batch / +2 entry so
  với số đúng 177/473) vì glob `phase9-round128-*.txt` nay đã
  gồm `phase9-round128-closing.txt` (tạo 06:23:07Z, sau khi T10
  đếm) mà script vẫn cộng closing thủ công thêm một lần. Chạy
  đúng trạng thái lúc T10 đếm (loại closing-128 khỏi glob, cộng
  thủ công một lần) cho đúng **177/473/427**. Số công bố của T10
  đúng; script cần sửa cho T10 đợt sau: loại `*-closing.txt` của
  đợt đang đếm khỏi glob (hoặc đếm closing từ file đĩa thay vì
  cộng tay). Không sửa script lượt này (file của đợt 128, chỉ
  ghi nhận).
- **F-129-3 (mới, ghi nhận): LIMITS gộp đợt 128 bị sửa sau khi
  đóng.** File hiện 58.942 B, mtime 06:24:30Z — lớn hơn 57.018 B
  mà chính §10.3 của nó ghi, và mtime sau cờ `round128-t10.done`
  (06:23Z). Nội dung T1 kiểm chứng là bản hiện tại (58.942 B);
  không phát hiện mâu thuẫn nội dung do lần sửa muộn này (mọi số
  §10 đối chiếu khớp §1–§9). Chỉ ghi nhận để lần sau khỏi nhầm
  kích thước/mtime khi đối chiếu.

## 6. Kết luận kiểm chứng

| # | Claim đợt 128 | Kết quả |
|---|---|---|
| 1a | DEF v0.4 dải ~31–53% truy được về leg T3 đợt 127 | **PASS** — tính lại từ JSON thô khớp toàn bộ (§1.1) |
| 1b | Đính chính TRỘN 3/3 → 3/6 | **PASS** — lỗi có thật ở v0.3.1 §11 dòng 445; v0.4 §11 sửa đúng 3/6 |
| 2a | Mù #47 ĐÓNG HOÀN TOÀN (A+B+C) | **PASS** — 123/345 mốc, lỗ max 95 s/632 s, đuôi 54 s/459 s, đều < sàn 1.147 s; C đóng bằng uptime trực tiếp |
| 2b | Gap #72→#73 = [3.238 s, 3.258 s], #73→#74 = [6.629 s, 6.649 s]; CERT n=41 / FULL n=56 | **PASS** — số học + thống kê trong blind47-gaps.txt khớp từng số |
| 3 | Đếm cuối 177 batch / 473 entry / 427 file duy nhất (111–128) | **PASS** — tái kiểm đúng trạng thái lúc đếm khớp chính xác (xem F-129-2 về bẫy chạy lại) |
| 4a | T3 85m4 webkit exit 0, P3 không kẹt | **PASS** — JSON ok=true, 06:06:44–06:08:58Z, consoleErrs=[], P3 extraCount=0, heartbeat 5 s/lần |
| 4b | T5 boot #74 PASS +47m52s | **PASS** — cờ POSTBOOT_PASS đúng boot_id/btime/pass_at |
| 4c | T4 lượt yên #7: a1 75,0 / a2 63,0 / a3 dở dang 55,0; 0 lượt hợp lệ | **PASS** — JSON + analyzer + class B khớp từng số; (c2) 3 lần khớp seq gốc |
| 5 | Sai số nhỏ mới | **F-129-1** (10,27% còn trong DEF v0.4 §3), **F-129-2** (script đếm double-count khi chạy lại), **F-129-3** (LIMITS gộp sửa sau đóng) — không cái nào đổi verdict |

**Không phát hiện claim sai nghiêm trọng.** Không sửa file nào của
đợt 128; mọi đính chính chỉ ghi trong LIMITS này.

## 7. File đổi/thêm + stage (không push)

- Repo (text, stage trong `phase9-round129-t1-verify128.txt`):
  - `docs/PHASE9_ROUND129_T1_VERIFY128_LIMITS.md` (mới, file này)
- Hồ sơ làm việc: không tạo script mới (tính toán bằng lệnh một lần
  trong phiên, kết quả ghi hết trong file này).
- Cờ xong: `hidden_files/round129-t1.done` (touch khi LIMITS + stage xong).
- Không đo mới, không sửa production, không sửa file luồng khác,
  không push, không release/tag, không kiểm lại TTS 39, không thử
  birefnet.

## 8. Nợ mở chuyển tiếp (cho T1/T10 đợt 129)

- F-129-1: DEF v0.5 (khi viết) ghi mean Yên-127 = 10,10% (không
  phải 10,27%); không sửa v0.4 sau ban hành.
- F-129-2: T10 đợt sau sửa `count-final.py` loại file closing của
  đợt đang đếm khỏi glob trước khi cộng tay, để script chạy lại
  được mà không double-count.
- Hạn chế kiểm chứng lượt này (xem §2.3): replay dpkg #74 + F74
  không kiểm lại được trực tiếp trên boot #75; seg B tail float
  dựa vào log đương thời. Không có gì trong số này làm lung lay
  verdict — chỉ ghi rõ giới hạn để luồng sau không tưởng đã kiểm
  trực tiếp.
