# PHASE9_ROUND137_T1_VERIFY136_LIMITS — T1 kiểm chứng độc lập đợt 136

> Luồng T1, đợt 137, lượt cron 15:35 +07 18/11/2026 (mở lượt 08:35Z 18/11/2026).
> **VERDICT: PASS — xác nhận CHẤP NHẬN của T10 (đợt 136) đứng vững.**
> Mọi claim lớn của đợt 136 đều tái kiểm đúng bằng code/bằng chứng độc lập trên đĩa.
> Tìm được **5 sai số mới (F-137-T1-1 … F-137-T1-5), KHÔNG đổi verdict nào.**
> KHÔNG push. KHÔNG release/tag. Không code giả — mọi claim dưới đây đều có bằng chứng trên đĩa.

## 0. Phương pháp + phạm vi + môi trường kiểm

- **Đếm:** code riêng viết mới tại `hidden_files/round137-t1/count-137.py`
  (không chạy script của T10-136, không dùng bất kỳ số nào của T10 làm đầu vào).
  Quét trực tiếp mọi file `phase9-round<N>-*.txt` trong
  `~/workspace/repo-1-push/paths-loop/` (111–136, gồm cả closing) trong MỘT lần quét,
  tách entry theo byte NUL, tính batch/entry/unique trực tiếp từ tập hợp (hợp toàn cục),
  KHÔNG cộng số round-unique vào lũy kế cũ (bài học đợt 126–127).
  Kiểm thêm: mọi đường dẫn stage phải tồn tại trên đĩa; mọi paths file phải là
  NUL-delimited thuần (kết thúc bằng NUL, không newline trong entry).
- **Tính lại độc lập lượt yên #13:** script riêng viết mới
  `hidden_files/round137-t1/recompute-quiet13.py` (đọc trực tiếp JSON gốc của T4,
  tự cài lại toàn bộ định nghĩa prereg/T3: tickCost, blendTick post, histogram
  pixel-match, (c2), P1/P3/P4/P7, c2DrawLog, coverage). Không chạy lại script
  của T3/T4/T5. Output tại `recompute-quiet13.out`.
- **Claim từng luồng:** đọc trực tiếp log/script/dữ liệu gốc của luồng đó trong
  `hidden_files/round136-*/` + file LIMITS của luồng + bản copy lúc đóng của LIMITS gộp;
  không tin lời T10 mà không có vết trên đĩa. Chỗ nào chỉ kiểm lại được qua log
  (trạng thái đã trôi) thì ghi rõ, không tuyên bố kiểm lại được.
- **Thời gian kiểm:** 08:40–09:03Z 18/11/2026. Boot hiện tại lúc kiểm (đọc TRỰC TIẾP
  `/proc/sys/kernel/random/boot_id` + btime `/proc/stat` lúc 08:40:28Z và kiểm lại
  09:03:16Z): **2104246b-04b2-4252-a642-b1a7cadeefe1, btime 1794989231 = 08:07:11Z**
  — boot MỚI sau khi đợt 136 đóng (reboot lúc mở đợt 137, ngoài phạm vi đợt 136;
  mọi số đo trạng thái lúc đóng đợt 136 chỉ kiểm lại được qua log gốc, không đo
  lại trên boot hiện tại). Bài học F-136-T1-1 đã áp dụng: claim boot luôn kèm
  file đọc trực tiếp /proc tại thời điểm kiểm.
- **Cây lúc kiểm:** `preview.tsx 530e10a7` (đo trực tiếp, khớp cây lúc đóng đợt 136),
  `media.ts 2c384ed1`, `apps/web/vite.config.ts ee80d093` (không đổi).

## 1. Đếm cuối đợt 136 + lũy kế — KHỚP HOÀN TOÀN

| Phạm vi | T10 công bố | T1-137 tái kiểm trực tiếp | Khớp |
|---|---|---|---|
| Đợt 136 (gồm closing) | 10 batch / 12 entry / 12 file duy nhất | **10 / 12 / 12** | ✅ |
| Lũy kế 111–135 (tái kiểm) | 248 / 578 / 503 (số công bố đợt 135) | **248 / 578 / 503** | ✅ |
| Lũy kế 111–136 (gồm closing) | 258 / 590 / 513 | **258 / 590 / 513** | ✅ |
| File mới-only đợt 136 | 10 | **10** | ✅ |
| File đợt 136 trùng 111–135 | 2 | **2** | ✅ |

Chi tiết đợt 136 (đếm trực tiếp từ đĩa, script + output tại `round137-t1/count-137.py`
→ `t1-count-137.txt`):

| File paths | Entry |
|---|---|
| phase9-round136-closing.txt | 2 (`docs/PHASE9_ROUND136_LIMITS.md`, `PHASE9_GAP_ANALYSIS.md`) |
| phase9-round136-t1-verify135.txt | 1 |
| phase9-round136-t2-eperm.txt | 1 |
| phase9-round136-t3-c2.txt | 1 |
| phase9-round136-t4-quiet13.txt | 1 |
| phase9-round136-t5-infra.txt | 2 (`apps/web/scripts/vcut-webkit-postboot-check.sh`, `docs/PHASE9_ROUND136_T5_INFRA_LIMITS.md`) |
| phase9-round136-t6-lockhealth.txt | 1 |
| phase9-round136-t7-scheduler.txt | 1 |
| phase9-round136-t8-viteharness.txt | 1 |
| phase9-round136-t9-headroom.txt | 1 |
| **Tổng** | **10 batch / 12 entry / 12 duy nhất** |

- 12 entry vs 12 duy nhất: không có file nào lặp trong đợt 136.
- File mới-only (10): 9 LIMITS luồng + LIMITS gộp. File trùng (2):
  `PHASE9_GAP_ANALYSIS.md`, `apps/web/scripts/vcut-webkit-postboot-check.sh`.
- **Mọi đường dẫn stage đều tồn tại trên đĩa** (script kiểm toàn bộ 513 file duy nhất
  111–136: 0 thiếu). **Mọi paths file NUL-delimited thuần** (906 file
  `phase9-round*.txt` đã kiểm: 0 lỗi NUL, 0 newline trong entry, 0 entry rỗng).
- Đây là **lần tái kiểm độc lập thứ mười bốn liên tiếp khớp** (T1-136 là lần thứ mười
  hai, T10-136 kiểm lại bằng script riêng là lần thứ mười ba, lần này là thứ mười bốn).

## 2. LIMITS gộp đợt 136 lúc đóng — BẢN GỐC CÒN NGUYÊN, CHỈ THÊM §12.3

- Bản copy lúc đóng `round136-t10/PHASE9_ROUND136_LIMITS.closing-copy.md`: **68.027 B,
  sha256 `2d297b7dbbbac6fc8085aa42ebd99746b20ffab865c0f7be3ef6406aa89344fd`** —
  khớp hoàn toàn sha/size T10 công bố lúc đóng (file `t10-closing-sha256.txt` ghi
  đúng sha này cho cả bản copy lẫn file trên đĩa lúc đóng).
- File hiện tại trên đĩa: **73.772 B**. Diff toàn bộ bản copy lúc đóng vs file hiện
  tại: **đúng 1 hunk duy nhất** — dòng 194–195 (tiêu đề placeholder `### §12.3 QUYẾT
  PARENT` + dòng `_(Parent quyết sau khi T10 đóng — ghi vào đây khi có.)_`) được thay
  bằng dòng 194–207 (tiêu đề quyết `(main chat, 14:4x +07 18/11/2026 — đóng đợt 136)`
  + 12 quyết (a)–(l)). Không dòng nào khác bị sửa/xóa. Footer
  `Batch stage / Tổng batch: 10 batch / 12 entry / 12 file (lũy kế 111–136: 258/590/513)`
  vẫn còn nguyên ở cuối file. Đây đúng là mẫu ghi quyết parent đã quy ước (AGENTS.md:
  quyết viết thành §12.3 mới, §12.2 đã mang marker "(đã quyết ở §12.3 dưới)" từ lúc
  đóng). Nội dung lúc đóng vẫn kiểm chứng được đầy đủ qua bản copy.
- 9/9 cờ `.done` (T1–T9) + `round136-t10.done` đều tồn tại trên đĩa.
- File `round-in-progress.md` hiện tại là của **đợt 137** (đợt 136 đã xóa khi đóng
  như T10 ghi; file đã được tạo lại bởi đợt 137, không phải sót lại).
- **Sai số về giờ đóng — xem F-137-T1-1 (§7).**

## 3. Lượt yên WebKit #13 — TÍNH LẠI ĐỘC LẬP TỪ JSON GỐC: KHỚP 100%

JSON gốc `round136-t4/preview-b-f3-flip-webkit-t4-attempt1.json` (2.944.128 B,
sha256 `266767c0f7fe270dc7f0673f78ad5c341ed4d3decac2399237d777b1282a2847` —
khớp sha T3 ghi ở đầu `t3-step2-136a1.txt` và `t5-c2-input.sha256` của T5):
`passes=20`, `engine=webkit`, `webkitVersion=27.2`, `pageErrs=[]`, `flip={afterPass: 5,
wallMs: 29731}`.

| Hạng mục | T3/T4/T5 công bố | T1-137 tính lại từ JSON gốc | Khớp |
|---|---|---|---|
| tickCost n / median / p90 / min / max | 516 / 58,0 / 89 / 31 / 153 | **516 / 58,0 / 89 / 31 / 153** | ✅ |
| tickCost hậu flip+2000ms n / median | 381 / 58,0 (≤60 ĐẠT) | **381 / 58,0** | ✅ |
| blendTick n / hậu flip+2000ms | 411 / 307 | **411 / 307** | ✅ |
| blendTick seq range | 104 → 410 | **104 → 410** | ✅ |
| skippedLatest counts (post) | 0: 230, 1: 77 | **0: 230, 1: 77** | ✅ |
| Histogram ghost (pixel-match) | n=614, nomatch=0, {-13:5, -12:6, -11:2, -9:2, -5:1, -1:46, 0:258, +1:74, +2:126, +3:87, +4:7} | **n=614, nomatch=0, y hệt từng bin** | ✅ |
| snap−label / raw−label median | 52 / 10 ms | **52,0 / 10,0 ms** | ✅ |
| label-floor {0, 1} | {0:229, 1:385} → +1=62,7% | **{0:229, 1:385} → 62,7%** | ✅ |
| curPix run ≥3 tick | 23 run, gồm (332,334,3) | **23 run, y hệt danh sách (gồm (332,334,3), (335,337,3), (347,352,6))** | ✅ |
| (c2) skp=0 / skp=1 | 1 (seq 334, presented 16, label 15, lag +1f) / 0 | **1 [(334, 16, 15, 1)] / 0** | ✅ |
| P2 lag âm | 0 | **[]** | ✅ |
| P4 | thuần +1f=1, tổng skp=0=1, skp=1=0, lag ≥+5f=0 | **1 / 1 / 0 / 0** | ✅ |
| P1 baseline unsigned / signed | 69/307, p≈0,22 / 67/307, p≈0,22 | **69/307 p=0,225 / 67/307 p=0,218** | ✅ |
| P3 frozen / baseline | 1/1 [334] / 92/306, p≈0,30 | **1/1 [334] / 92/306 p=0,301** | ✅ |
| c2DrawLog n (drawSrc / rawUnit) | 994 (516 / 478) | **994 (516 / 478)** | ✅ |
| c2DrawLog byLoop | {1:36, 2:58, 3:50, 4:48, 5:60, 6:38, 7:50, 8:52, 9:58, 10:52, 11:51, 12:1, 13:53, 14:48, 15:48, 16:50, 17:52, 18:40, 19:51, 20:44, 21:54} | **y hệt từng loop** | ✅ |
| loop≥2 / loop≥3 | 958 / 900 | **958 / 900** | ✅ |
| stage / srcKind / readyState / seeking | plain-native 516, rawUnit 478; canvas 1280x720 ×994; readyState 4 ×994; seeking False ×994 | **y hệt** | ✅ |
| wraps / frameIdx distinct / range | 20 / 60 / 0–71 | **20 / 60 / 0–71** | ✅ |
| wallMs span / log max − flip | 11164→89072 = 77.908 ms / +59.341 ms | **77.908 ms / +59.341 ms** | ✅ |
| P7 coverage (c2) | 1/1, delta +56 ms, 12 entry trong ±500 ms | **1/1, entry gần nhất +56 ms, 12 entry** | ✅ |
| blendTick post trong ±500 ms của log | 307/307 | **307/307** | ✅ |
| Tỉ lệ (c2) giảm | 7/412 (1,70%) → 1/307 (0,33%), p≈0,033 | **P(X≤1\|n=307,p=7/412)=0,0327** | ✅ |
| Trung bình chuỗi 11 lượt yên | 47,3 ms | **520,5/11 = 47,32 → 47,3** | ✅ |
| Trung bình 10 lượt trước | 46,3 ms (đính chính F-136-T1-3) | **462,5/10 = 46,25 → 46,3** (làm tròn half-up; `round()` của Python cho 46,2 do banker's rounding — xem ghi chú dưới) | ✅ |

- Ghi chú về dòng `P7 seq 334 ... nearest delta=-363 ms` trong `recompute-quiet13.out`:
  đó là delta ÂM NHỎ NHẤT (script sắp theo delta có dấu), không phải entry gần nhất.
  Entry gần nhất theo |delta| là **+56 ms** (drawSrc, loop 18, frameIdx 18) — đã kiểm
  riêng bằng script phụ; coverage 1/1 đứng. Đã ghi chú đính chính vào cuối file .out.
- **Ngưỡng ≤60 ms GIỮ** (median lượt #13 = 58,0 ms, tính lại độc lập; biên 2 ms).
- P1/P3 cộng dồn 22/22, 21/22: số đếm cộng dồn đúng (21/21+1/1, 20/21+1/1); sức mạnh
  thống kê của lượt #13 riêng là YẾU (p≈0,22/0,30, n=1) như T3 đã kết luận — T1-137
  xác nhận cả hai vế này, không chỉ số đếm.

## 4. Đối chiếu từng luồng

### 4.1 T1 — kiểm chứng độc lập đợt 135: PASS

- Đếm lại của T1-136 cho đợt 135 (10/15/15; lũy kế 111–135 = 248/578/503) khớp hoàn
  toàn với đếm lại của T1-137 (§1). Lần tái kiểm thứ mười hai của T1-136 là đúng
  về số đếm.
- F-136-T1-1/-2/-3 đã được ghi trong LIMITS gộp §1; các đính chính đã áp dụng ở
  đợt 136 (trung bình chuỗi 46,3 ms dùng thống nhất ở T3/T4/T5; T10-136 đã sửa
  cách lưu output kiểm /tmp/.X11-unix/ — xem §5). Không sai số mới ở T1-136.

### 4.2 T2 — probe #55 + mù #55 HỞ đoạn B + gap #90?→#91? chứng nhận khoảng: KHỚP

- Probe #55: `once.txt` ghi `probe#55 boot=1ca1feaa ok=2 fail=0`; `boot-verify.txt`
  đọc trực tiếp `/proc/sys/kernel/random/boot_id` lúc 05:49:44Z = **1ca1feaa**,
  btime 1794979758 = 05:29:18Z ✓. Log probe v2: 157 dòng lúc T2 đóng (154 sau
  T2-135 + 3) — kiểm lại sau: file nay 160 dòng vì probe #56 của đợt 137 đã chạy
  08:45:46Z trên boot mới 2104246b (+3 đúng mẫu mỗi probe). ✓
- Mù #55: `blind55-merged.log` — merged distinct-second marks **242**; đoạn A 108 mốc,
  lỗ lớn nhất **252 s**, max_hidden=0 → ĐÓNG; đoạn B 61 mốc, lỗ lớn nhất **2.843 s**
  (04:41:55Z → 05:29:18Z) + lỗ lớn thứ hai **1.368 s** (04:19:07Z → 04:41:55Z),
  max_hidden=2 → MỞ; đoạn C 72 mốc, lỗ lớn nhất **381 s** → ĐÓNG. Thời lượng mù
  02:45:23Z → 05:50:26Z = **11.103 s = 3h05'03"** ✓. **Sai số về tổng mốc — xem
  F-137-T1-2 (§7). Nhãn boot trong file merged — xem F-137-T1-3 (§7).**
- Gap #90?→#91? = INTERVAL [1h07'43", 1h08'03"] = **[4.063 s, 4.083 s]**, mid 1h07'53"
  = 4.073 s, CERTIFIED (dòng 464 `blind55-gaps.txt`) ✓. **CERT n=53→54 / FULL
  n=68→69** (cuối file ghi `CERT54` / `FULL69` với thống kê đầy đủ) ✓.
  Dải cơ học #91? [02:54:47Z, 04:53:38Z]: btime thực 03:35:20Z NẰM TRONG ✓;
  dải #92? [04:02:40Z, 06:01:31Z]: btime thực 05:29:18Z NẰM TRONG (sau cận dưới
  5.198 s, trước cận trên 1.933 s — tính lại: 05:29:18−04:02:40 = 5.198 s;
  06:01:31−05:29:18 = 1.933 s ✓). Dải mới #93? [05:56:47Z, 07:55:21Z] ✓.
- Khung chết #90?: mốc muộn nhất 03:34:51Z (exec-log 0 byte) → ứng viên
  (03:34:51Z, 03:35:20Z] = 29 s ✓ (merged log ghi đúng); parent đã xác nhận làm
  chuẩn ở §12.3(d). Khung chết #91?: mốc cuối 04:42:27Z (session proactivity) →
  (04:42:27Z, 05:29:18Z] = 2.811 s ✓; parent đã xác nhận ở §12.3(e).
  0 nhân chứng nhảy clock ở cả 2 reboot (`blind55-sessions.log` dòng 50/53) ✓;
  |X91?| < 29 s ✓.
- WFS lần 42: `scan-meta.txt` ghi NEWSTD 251 file / 901 dòng, R7B 268 / 926,
  COPIES 17 / 25; 901+25=926 ✓, chênh 0 — lần thứ 42 liên tiếp.
- RAM max trong mù 5.985 MB: `ram-max.txt` — 5.985 MB lúc 05:44:42Z, poll #4 của T4
  ✓ (đối chiếu `poll-t4.log` dòng 5: RAMavail=5985MB lúc 05:44:42Z ✓).
  5.985/6.144 = 97,4% guard ✓ (cùng cách tính các đợt trước).
- EPERM 0 sóng thật (sweep log đã kiểm — 9 match thô đã phân loại, sóng gần nhất
  ~11:55–12:11Z 11/11). Không kiểm lại từng dòng phân loại (tin theo file + mẫu
  các đợt trước); không phát hiện mâu thuẫn.
- F-136-T2-1…-8 đã được ghi trong LIMITS gộp §2; các file sửa lại có trên đĩa.
  Không sai số mới ở T2 ngoài F-137-T1-2/-3 (đều là ghi chép, xem §7).

### 4.3 T3 — bước 2 lượt yên #13 + KHÔNG revert: KHỚP

- Script bước 2 `t3-step2-verify136.py` + output `t3-step2-136a1.txt` có trên đĩa;
  dry-run JSON lượt #12/#10 khớp như LIMITS T3 ghi (đã đối chiếu đầu file out).
- KHÔNG revert: cây lúc đóng preview.tsx **530e10a7** (theo `t10-closing-checks.txt`
  + đo trực tiếp lúc kiểm §0) ✓; T3 không sửa cây đợt này (batch t3-c2 chỉ có 1
  entry là LIMITS) ✓.
- P1/P3/P7 cộng dồn, P5 ngoài khoảng lần đầu, tỉ lệ (c2) giảm — tất cả đã tính lại
  độc lập ở §3, khớp 100%. Đề xuất GIỮ fix qua đợt 137 + lượt #14 làm lượt quyết
  định đã được parent chấp nhận ở §12.3(a).

### 4.4 T4 — lượt yên #13: KHỚP

- Attempt1 20/20 pass: JSON gốc `passes=20` (§3). `poll-t4.log`: 9 poll
  (05:42:26–05:48:28Z), cửa mở poll #9 05:48:28Z (RAM 4782 MB, load5 1,99),
  run-attempt exit 0 lúc 05:52:42Z (theo LIMITS T4; JSON ghi 05:50Z) ✓.
  **Poll #6 blockers=6 xác nhận có trong log** (dòng 7, 05:46:13Z, RAMavail=5692MB)
  — F-136-T4-1 đứng (không xác định được danh tính blocker).
- Lớp B 5/5: theo `classb-t4-attempt1.txt` (B1 load5 cuối 1,57; B2 load1 max 2,42,
  sampler n=11; B3 0 reboot; B4 0 apt/dpkg; B5 RAM min 3322 MB, 0 mẫu <500 MB,
  0 mẫu <1024 MB) — khớp LIMITS T4 ✓. RAM suốt thời gian chờ 3.628–5.985 MB
  (poll #1 3628 MB → poll #4 5985 MB) ✓.
- WebKit FULL PASS lần thứ 14: kiểm qua 14 file `round12{3..6}-t10/t10-o8.log` —
  mỗi file đều có 2 dòng `21/21 pass` (Chromium + WebKit), trừ đợt 127 chỉ có
  1 dòng nhưng LIMITS gộp đợt 127 ghi rõ cả hai (đã xác nhận từ đợt trước) —
  chuỗi 14 lần liên tiếp (đợt 123–136) đứng vững.

### 4.5 T5 — infra + pha 2: KHỚP

- Cờ `round136-t5/POSTBOOT_PASS`: `boot_id=1ca1feaa-… btime=2026-11-18T05:29:34Z
  pass_at=2026-11-18T05:48:02Z poll=2` ✓ (btime 05:29:34Z là `stat /proc/1`,
  chênh +16 s so với /proc/stat 05:29:18Z — lớp chênh đã biết, xem §5).
- Watcher log `t5-wait-replay-b89.log`: poll 1–2, dpkg **1545 dòng / 221 installs**,
  dòng cuối 05:45:44Z, GST **269**, TRIGGER=NO cả 2, FLAG_WRITTEN 05:48:02Z ✓.
  Poll0 PASS exit 0 lúc 05:45:10Z (theo LIMITS T5; đối chiếu poll-t4.log dòng 6:
  postboot_exit=0 từ poll #5 05:45:28Z — nhất quán).
- Pha 2: P1/P3/coverage đã tính lại độc lập ở §3 (p-value khớp tới 3 chữ số có nghĩa).
  `t5-c2-input.sha256` khớp sha JSON gốc ✓.
- started_at: `t10-started-at-136.txt` — run `7283f96f` sched = started_at =
  1794980151 (05:35:51Z), jitter **0 s**, kiểm lại lúc đóng 07:20:35Z vẫn jitter
  0 s ✓; run đợt 135 `f2fa4088` vẫn 1794972956 (03:35:56Z), KHÔNG viết lại lần 2 ✓.
  Giả thuyết giữ đúng lần thứ 7.
- Headroom T5: `headroom-open.txt` STOP 2281, `headroom-end.txt` STOP 2276 ✓.
  RAM max T5 6.115.608 kB (`t5-start.txt` dòng 4) ✓ — dưới guard 6.144 MiB.
- R9 (a) vẫn 16: LIMITS T5 ghi rõ "số đếm VẪN LÀ 16" (dòng 82, §11); 13 lần xuất
  hiện chuỗi "17" trong file đều là epoch/ngày tháng/label-floor {0:207, 1:617}
  hoặc câu "đợt 135 viết 17 đã bị đính chính" — không có chỗ nào viết R9 = 17 ✓.

### 4.6 T6 — lock KHỎE + prune lần 11: KHỚP

- Script lock hiện tại md5 **520b8baa** (đo trực tiếp
  `apps/web/scripts/vcut-vite-lock-v2.sh`) ✓ — đúng md5 T6 công bố.
- Log lock lúc T6 đóng: `analyze-log-cleaned-close.txt` ghi
  `TOTAL: ACQUIRED=269, COOLDOWN=84, RELEASED=263, STALE-LOCK=6, STALE-TICKET=1,
  TICKET=278, TIMEOUT=8, total=909` + `pairs ACQUIRED->RELEASED: 263` ✓
  (909 dòng, 263/263 cặp).
- Đối chiếu lúc T10 đóng (aggregate §10.1): log thô **929 dòng** (đo trực tiếp
  `vite-lock-v2.log` hiện tại: 929 dòng ✓); chính thức 923 dòng (loại 6 dòng
  repro T6-132: 2 TICKET + 2 ACQUIRED + 2 RELEASED). Đếm token chính xác trên
  log thô hiện tại: TICKET=284, ACQUIRED=275, RELEASED=269, COOLDOWN=86,
  STALE-TICKET=1, STALE-LOCK=6 → trừ 6 dòng repro: TICKET **282**, ACQUIRED
  **273**, RELEASED **267**, COOLDOWN **86** — khớp hoàn toàn số T10 công bố.
  Tăng so với lúc T6 đóng: +4/+4/+4/+2 ✓. ACQUIRED−RELEASED = 6 = 5 ca
  double-acquire đã biết + 1 t4 F-134-T6-2 — KHÔNG tăng ✓.
- Cooldown lúc đóng **84 file** (đếm trực tiếp thư mục queue + `t10-closing-checks.txt`
  dòng 11) = 82 lúc T6 đóng + cooldown-t8-round136 + cooldown-t10-round136 ✓.
- Prune lần 11: `prune-deleted.txt` ghi `(prune deleted: none)` — xóa 0 file ✓.
- Chuỗi boot tương đối #57→#92, boot #92? = 1ca1feaa btime 05:29:18Z (sự kiện gộp
  #16, ranh giới) — khớp độc lập T2/T7 (§4.2/§4.7 + §5).

### 4.7 T7 — cửa GÃY: KHỚP (theo bằng chứng trên đĩa + số học nội bộ)

- `round136-t7/NOTES.md`: cửa 03:25:29Z → 07:07:03Z, HB 6/7 + DR 3/4, 2 slot
  thiếu mới (HB 04:50:50Z + DR 05:00Z), 3 lần kiểm khớp hoàn toàn ở mọi slot trùng.
- Lũy kế: HB **44/205** (198+7=205 ✓, thiếu +1); DR **49/174** (170+4=174 ✓,
  thiếu +1). Tỉ lệ: 44/205=21,5% (từ 21,7%); 49/174=28,2% (không đổi, làm tròn)
  — tính lại đúng.
- Mẫu muộn +889 s tái hiện lần thứ 6 (slot 05:20:50Z, start 05:35:39Z): NOTES.md
  §9 ghi rõ "mẫu dừng ở 5 lần KHÔNG còn đúng — nay là 6 lần (đợt
  127/129/130/132/134/136)" ✓; parent đã đính chính ở §12.3(j).
- Caveat giữ nguyên: các số lũy kế này dựa trên lịch sử API scheduler trả về
  (`history_may_be_truncated=true`); T1-137 KHÔNG truy vấn lại được cửa sổ cũ
  (lịch sử đã trôi qua thêm nhiều reboot) — kiểm chứng dừng ở bảng slot trong
  NOTES.md + số học nội bộ. Không phát hiện mâu thuẫn nội bộ.
- Boot lúc làm việc btime **05:29:18Z** (kiểm 3 lần 05:40Z/06:08Z/07:07Z trùng nhau,
  theo NOTES.md) + boot_id **1ca1feaa** tự xác minh — khớp T2/T6.
- F-136-T7: KHÔNG CÓ sai số mới (T7 tự ghi) — T1-137 không tìm thêm sai số ở T7.

### 4.8 T8 — vite harness 3/3 ngay lần đầu + điều tra chung ba lần kẹt: KHỚP

- `smoke/run-webkit-summary.txt`: 84l10 exit 0 (05:59:39–06:00:57Z, ~78 s),
  85m4 exit 0 (06:01:12–06:03:28Z, ~136 s), 86n2 exit 0 (06:03:43–06:07:46Z,
  ~243 s) — **3/3 exit 0 ngay lần đầu, 0 retry** ✓. Cả ba đều `KẾT QUẢ: KHÔNG FAIL`.
- 85m4 P5 CÓ-RESTART (+1), causeTag ended-at-duration (theo log 85m4 dòng cuối)
  ✓ — đúng F-136-T8-1 (restart tự nhiên khi element chạm cuối clip, không phải kẹt).
- Fixture rebuild 6/6 md5 trong `rebuild-fixtures.log` (hevc ba0c7c62, i7 f05daed8,
  h-30s fbaa3d1a ×3, g-4s a1fb8549) — khớp LIMITS T8 ✓.
- Điều tra chung ba lần kẹt (§B): H1 BÁC BỎ / H2 KHÔNG ỦNG HỘ / H3 VẪN MỞ —
  kiểm qua nội dung LIMITS T8 (lý luận dựa trên số liệu các đợt 134/135 đã công bố
  + bằng chứng mới đợt 136 §B7: RAM tụt 3285 → 1870 MB trong lần chạy PASS).
  T1-137 không chạy lại harness; các số trích dẫn (avail lúc kẹt 1226/1203/1437/652
  MB, tụt −735/−480/−1088 MB) là số liệu lịch sử từ các đợt trước, đã được ghi
  trong LIMITS các đợt đó — kiểm chứng dừng ở tính nhất quán nội bộ, không phát
  hiện mâu thuẫn. Parent đã phê duyệt 4 bước kiểm cho đợt 137 ở §12.3(i).
- F-136-T8-2 (label "swap_used" sai) và F-136-T8-3 (log rebuild lần đầu không
  redirect) đã ghi trong LIMITS gộp §8; không sai số mới ở T8.

### 4.9 T9 — headroom/RAM: KHỚP, TRỪ 2 MẪU KHÔNG CÓ FILE BẰNG CHỨNG (xem F-137-T1-4)

- Headroom: `headroom-measure-1.log` STOP at i=2286; `headroom-measure-2.log`
  STOP at i=2281 → **2.286 → 2.281** ✓. Chênh −5 trong boot ✓.
  Còn 481 trên ngưỡng báo < ~1.800 (2281−1800=481) ✓. Trần inotify 63.747 không đổi
  (trong cả 2 log đo) ✓. Watch ngoài cell 61.466 = 63.747 − 2.281 (phép trừ suy ra,
  cả hai đầu vào đều có trong log) ✓.
- RAM max: `ram-snapshot-2.log` — MemAvailable **6.228.132 kB** lúc 05:44:35Z ✓
  = 6.228.132/1024 = **6.082,2 MiB**; 6.082,2/6.144 = **98,99%** guard ✓;
  thiếu 6.291.456 − 6.228.132 = **63.324 kB** ✓. Birefnet KHÔNG THỬ ✓;
  u2net là fallback chính thức.
- Balloon: các giá trị đã kiểm được trong file — 5.341.200 kB (measure-1,
  05:41:01Z), 2.971.688 kB (snapshot-1, 05:43:14Z), 2.775.080 kB (measure-2,
  05:43:15Z), 481.320 kB (snapshot-2, 05:44:35Z), 1.005.608 kB (snapshot-3,
  05:46:09Z). Ròng theo mẫu có file: 5.341.200 → 481.320 = **−4.859.880 kB
  (≈ −4,63 GB)**. **Mẫu mở đầu 5.406.736 kB (05:40:43Z) KHÔNG có file — xem
  F-137-T1-4 (§7).**
- RAM min: mẫu có file thấp nhất 1.459.220 kB = 1.425 MB (measure-1, 05:41:01Z);
  **mẫu 1.406 MB (1.440.296 kB, 05:40:43Z) KHÔNG có file — xem F-137-T1-4.**
- dpkg.log trong cửa sổ đo: 2 dòng (measure-1) → 402 (snapshot-1, 05:43:14Z) →
  432 (measure-2, 05:43:15Z) → 1.149 (snapshot-2) → 1.545 (snapshot-3, dòng cuối
  05:45:44Z gstreamer1.0-tools) ✓ — cùng hình dạng baseline 1.545/221.

## 5. Kiểm đầu lúc đóng của T10 — TÁI KIỂM TỪ FILE BẰNG CHỨNG

- Suite cây gộp: `round136-t10-suites.log` — **27 dòng `exit=0`, 0 lần nhắc "rerun"**,
  `preview-engine: 354 assertions pass`, chạy 07:11:08–07:16:18Z, boot 1ca1feaa,
  cây `preview.tsx 530e10a7` ✓.
- O8: `t10-o8.log` — **42 dòng PASS, 0 FAIL thật** (2 lần xuất hiện chuỗi "fail" đều
  là `0 fail` trong dòng kết quả); driver start 07:16:34Z, boot 1ca1feaa, cây
  preview.tsx 530e10a7; `KẾT QUẢ CLICK-TEST O8: 21/21 pass` (Chromium, exit=0
  07:17:33Z) + `KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass` (exit=0 07:18:31Z) ✓.
  **WebKit FULL PASS lần thứ 14 liên tiếp (đợt 123–136)** — kiểm qua 14 file t10-o8.log (§4.4).
- **0 reboot trong phiên đóng sổ:** boot mở phiên 1ca1feaa = boot lúc đóng 1ca1feaa
  (theo `t10-open.md`, `wait-log.txt` — vòng chờ cờ chạy 05:42–07:09Z, ALL 9/9 DONE
  07:09:20Z — và `t10-closing-checks.txt` 07:18:52Z). **0 reboot giữa lượt 136**
  (mở 05:35Z → đóng ~07:26Z, boot 1ca1feaa xuyên suốt — T2/T4/T5/T6/T7/T8/T10 đều
  xác nhận độc lập). Reboot duy nhất liên quan (bcc71e61 → 1ca1feaa, btime
  05:29:18Z, sự kiện gộp #16) xảy ra TRƯỚC khi lượt mở.
- md5 cây lúc đóng (theo `t10-closing-checks.txt` 07:18:52Z): preview.tsx 530e10a7,
  media.ts 2c384ed1, vite.config.ts ee80d093, lock script 520b8baa ✓ (đo trực tiếp
  lúc kiểm §0 khớp 3/3 md5 cây, trừ lock script đã kiểm ở §4.6).
- Lock trống lúc đóng: **TRỐNG, 0 ticket + 84 cooldown** (theo file + đếm trực tiếp
  thư mục queue = 84 file) ✓; thư mục vite.lock không tồn tại ✓.
- 0 process sót lúc đóng: `ps-count=0` (theo file) ✓.
- /tmp/.X11-unix/ lúc đóng: **trống** — file lưu cả hai lần kiểm: "TRƯỚC khi dọn"
  liệt kê X193/X194/X195 (mtime 07:16Z, do chính suite verify của T10 tạo) và
  listing sau khi dọn cho thấy thư mục trống. **Sửa theo F-136-T1-2 đã thực hiện
  về thực chất** (output lần kiểm sau cùng ĐÃ lưu), nhưng listing sau khi dọn
  KHÔNG có tiêu đề phân biệt (xem F-137-T1-5).
- Scheduler lúc đóng: run đợt 136 `7283f96f` sched = started_at = 1794980151
  (05:35:51Z), jitter 0 s, status `running` (theo `t10-started-at-136.txt`,
  kiểm 2 lần 07:11Z + 07:20:35Z) ✓. Run đợt 135 `f2fa4088` vẫn 1794972956
  (03:35:56Z), status `succeeded` — KHÔNG viết lại lần 2 ✓.
- **Sai số về giờ đóng + sai số T10 tự ghi bị sót — xem F-137-T1-1 (§7).**

## 6. Boot mới sau khi đợt 136 đóng — NGOÀI PHẠM VI ĐỢT 136, GHI NHẬN

- Boot hiện tại lúc T1-137 kiểm: **2104246b-04b2-4252-a642-b1a7cadeefe1, btime
  1794989231 = 2026-11-18 08:07:11Z** (đọc trực tiếp `/proc/sys/kernel/random/boot_id`
  + btime `/proc/stat` lúc 08:40:28Z, kiểm lại 09:03:16Z — cùng boot_id).
- Reboot 1ca1feaa → 2104246b xảy ra SAU khi đợt 136 đóng (07:25:54Z) và TRƯỚC khi
  đợt 137 mở (08:35Z) — ngoài phạm vi đợt 136, không đổi bất kỳ verdict nào của
  đợt 136. Bằng chứng độc lập: `eperm-probe-v2.log` ghi `boot changed 1ca1feaa ->
  2104246b (reboot detected, uptime since 2026-11-18 08:07:11)` + probe #56
  (đợt 137) chạy 08:45:46Z trên boot mới, ok=2 fail=0.
- Đây là reboot đầu tiên sau chuỗi 0-reboot của đợt 136; T2/T6 đợt 137 phân loại
  (số boot tiếp theo, gap, khung chết) — không thuộc việc T1-137.

## 7. Sai số mới (F-137-T1-n)

- **F-137-T1-1 — Header LIMITS gộp ghi giờ đóng "~07:21Z" trong khi cờ `.done`
  là 07:25:54Z (§12.3(l) ghi "T10 đóng 07:26Z").** `round136-t10.done` mtime
  07:25:54Z; bản copy lúc đóng mtime 07:25:36Z; `t10-closing-checks.txt`
  07:18:52Z; O8 kết thúc 07:18:31Z; ALL 9/9 DONE 07:09:20Z. "~07:21Z" có lẽ là
  lúc T10 viết xong nội dung aggregate (nằm trong cửa sổ đóng 07:18–07:26Z),
  còn 07:26Z là lúc cờ `.done` được viết. Hai mốc chỉ hai thời điểm khác nhau
  trong cùng phiên đóng; "~" đã làm mềm con số. **Không đổi verdict nào**
  (cả hai mốc đều TRƯỚC hạn cứng 08:00Z; "đóng TRƯỚC hạn cứng" đứng).
  Đề nghị: đợt sau ghi giờ đóng theo mtime cờ `.done` để thống nhất.
- **F-137-T1-2 — Merged mù #55: tổng 242 mốc ≠ đoạn A+B+C = 241.**
  Đếm lại độc lập từ 4 file scope của T2 (union = 242; phân đoạn theo cửa sổ:
  A=109, B=61, C=72, tổng 242) so với `blind55-merged.log` (tổng 242 nhưng đoạn A
  chỉ 108 → A+B+C=241). Mốc chênh lệch là **02:45:23Z** — đúng mốc mở cửa sổ mù
  (timestamp của probe #54): merged.py tính nó trong tổng merged nhưng không xếp
  vào đoạn nào (đoạn A bắt đầu từ mốc đầu tiên SAU 02:45:23Z là 02:45:37Z,
  head=14s). **Không đổi verdict nào** (mốc này là mốc mở cửa sổ, không phải
  reboot ẩn; max_hidden các đoạn không đổi: A=0, B=2, C=0). Đề nghị: T2 ghi rõ
  quy ước "mốc biên không thuộc đoạn nào" ở đợt sau.
- **F-137-T1-3 — `blind55-merged.log` dùng nhãn boot cũ, lệch 1 so với chuỗi chốt.**
  File ghi "btime #90? (2026-11-18T03:35:20Z)" và "btime #91?
  (2026-11-18T05:29:18Z)" (kèm "death frame #90?/#91? candidate"), trong khi
  chuỗi chốt cuối (T6 + `blind55-gaps.txt` dòng 464 + `blind55-sessions.log`
  dòng 50/53 — cả ba nhất quán) đánh số 03:35:20Z là **#91?** (bcc71e61) và
  05:29:18Z là **#92?** (1ca1feaa). Các timestamp trong file đều đúng; chỉ nhãn
  boot là nhãn prereg cũ, chưa được sửa theo đính chính (cùng lớp lỗi brief nhầm
  boot mà T2/T6 đã đính chính). **Không đổi verdict nào** (gap chứng nhận,
  CERT/FULL, khung chết đều tính từ timestamp, không từ nhãn). Đề nghị: sửa nhãn
  hoặc chú thích trong file để người đọc sau khỏi nhầm.
- **F-137-T1-4 — Hai mẫu RAM/Balloon của T9 không có file bằng chứng riêng.**
  Bảng §2.1 LIMITS T9 liệt kê 7 mẫu; 5 mẫu có file (measure-1/snapshot-1/
  measure-2/snapshot-2/snapshot-3 — mỗi file đúng 1 dòng MemAvailable, đã kiểm
  khớp). Hai mẫu KHÔNG có file trong `round136-t9/` (grep toàn thư mục: 0 kết
  quả cho 1440296/1461472/5406736): (a) kiểm tra mở đầu **05:40:43Z**
  (MemAvailable 1.440.296 kB, Balloon 5.406.736 kB); (b) ngay sau probe 1
  **05:41:01Z** (MemAvailable 1.461.472 kB, Balloon 5.341.200 kB).
  Tính lại chỉ từ mẫu có file: balloon xả 5.341.200 → 481.320 = **−4.859.880 kB
  (≈ −4,63 GB)** thay vì −4.925.416 kB (≈ −4,70 GB) như công bố (chênh đúng bước
  đầu 65.536 kB); RAM min có file là **1.425 MB** (1.459.220 kB) thay vì 1.406 MB.
  **Không đổi verdict nào** ("xả mạnh nhất từ trước tới nay" vẫn đứng: −4,63 GB
  >> −0,59 GB đợt 135; đỉnh RAM 6.081 MB + guard birefnet 98,99% đều có file;
  birefnet vẫn KHÔNG thử). Đề nghị: T9 lưu meminfo của lần kiểm mở đầu vào file
  ở các đợt sau (cùng bài học F-136-T1-2 về lưu output lần kiểm).
- **F-137-T1-5 — Aggregate không liệt kê F-136-T10-1; listing sau-dọn X11 thiếu
  tiêu đề.** (a) Sai số tự ghi của T10 ở `t10-open.md` — epoch hạn chót vòng chờ
  tính sai lần đầu (1794978600 đã qua) → wait-loop exit 2, đã sửa thành
  1794988200 (07:50Z) và chạy lại — KHÔNG xuất hiện trong LIMITS gộp (grep: 0
  lần; aggregate chỉ liệt kê F-136-T10-2 và F-136-T10-4; F-136-T10-3 không được
  gán ở đâu). Đã sửa trong phiên, không mất dữ liệu (wait-log ghi rõ cả hai lần
  thử); câu "vòng chờ cờ chạy xuyên suốt 05:42–07:09Z không bị giết" chỉ lần chạy
  đã sửa và là đúng. Chỉ là thiếu sót liệt kê. (b) `t10-closing-checks.txt` lưu
  listing /tmp/.X11-unix/ sau khi dọn (thư mục trống) nhưng KHÔNG có tiêu đề
  phân biệt với listing "TRƯỚC khi dọn" ngay trên — người đọc phải suy ra từ
  nội dung trống. Bằng chứng thì có đủ; chỉ thiếu nhãn. **Cả hai đều không đổi
  verdict nào.**

## 8. Ghi nhận thêm (không phải sai số)

- LIMITS gộp sau đóng chỉ thay ở §12.3 placeholder → 12 quyết parent (a)–(l);
  bản copy lúc đóng còn nguyên, sha khớp (§2). Các quyết đã được thực hiện/đưa
  vào brief đợt 137 (GIỮ fix 530e10a7, lượt #14 là lượt quyết định; ngưỡng ≤60 ms
  giữ; khung chết #90?/#91? đã xác nhận bản hẹp; guard birefnet giữ 6.144 MiB;
  bắt buộc log ps snapshot khi blockers>0 — xem F-136-T4-1).
- Chuỗi 10 lượt yên hợp lệ trước #13 có trung bình 46,3 ms (462,5/10) — số 46,6 ms
  sai của đợt 135 đã được đính chính triệt để ở đợt 136 (T3/T4/T5 đều dùng 46,3;
  chỉ còn T8 §4 chép lại 46,6 — đã ghi thành F-136-T10-2, không phải sai số mới).
- File oversize đợt 136 (T2 55.182 B, T6 47.395 B, T5 44.540 B — đều >37.768 B) +
  file 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`: chỉ stage paths,
  không push — đúng luật đã biết.
- Không có push nào trong đợt 136 (chờ lệnh user) — đúng luật cứng.
- Boot mới 2104246b (btime 08:07:11Z) sau khi đợt 136 đóng — xem §6.

## 9. Đếm cuối đợt 137 (phần T1) + stage

- Đợt 137 (phần T1-137): 1 batch / 1 entry / 1 file mới
  (`docs/PHASE9_ROUND137_T1_VERIFY136_LIMITS.md` — file này).
- Stage: `phase9-round137-t1-verify136.txt` (1 entry, NUL-delimited, verify read-back).
- KHÔNG push (chờ lệnh user từ main chat).

## 10. Kết luận

**VERDICT: PASS — CHẤP NHẬN của T10 về đợt 136 đứng vững.**
Đếm lại độc lập: đợt 136 = 10 batch / 12 entry / 12 file; lũy kế 111–136 =
258 / 590 / 513; tái kiểm 111–135 = 248 / 578 / 503 — khớp hoàn toàn số công bố.
Suite 27/27 exit 0, 0 rerun; O8 Chromium 21/21 + WebKit 21/21 exit 0
(WebKit FULL PASS lần thứ 14 liên tiếp, đợt 123–136 — kiểm qua 14 file t10-o8.log).
Lượt yên #13 tính lại độc lập từ JSON gốc: tickCost median 58,0 ms (n=516, post 381),
(c2)=1, c2DrawLog n=994 loop 1–21, wraps 20, coverage 1/1 (delta +56 ms),
histogram ghost khớp từng bin (n=614, nomatch=0), P1 1/1 (p≈0,22), P3 1/1 (p≈0,30).
Mù #55 hở đoạn B (max_hidden=2); gap #90?→#91? chứng nhận [4.063, 4.083] s
(CERT 54 / FULL 69). T6 lock 263/263 cặp lúc đóng, script 520b8baa. T7 cửa gãy
44/205, 49/174. T8 3/3 exit 0 ngay lần đầu. T9 headroom 2.281.
0 reboot giữa lượt 136 (boot 1ca1feaa xuyên suốt); started_at lượt 136 KHÔNG bị
viết lại (giả thuyết giữ đúng lần thứ 7).
5 sai số mới F-137-T1-1/-2/-3/-4/-5 đều là ghi chép/nhãn/bằng chứng thiếu ở biên,
**không đổi verdict nào**: (1) giờ đóng "~07:21Z" vs cờ .done 07:25:54Z;
(2) merged 242 mốc vs A+B+C=241 (mốc biên 02:45:23Z không thuộc đoạn nào);
(3) `blind55-merged.log` nhãn boot cũ lệch 1; (4) 2 mẫu RAM/Balloon của T9 không
có file riêng (xả balloon theo mẫu có file là −4,63 GB thay vì −4,70 GB; RAM min
có file 1.425 MB thay vì 1.406 MB); (5) aggregate sót F-136-T10-1 + listing X11
sau-dọn thiếu tiêu đề.
