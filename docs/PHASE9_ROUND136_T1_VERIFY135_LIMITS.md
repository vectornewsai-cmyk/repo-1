# PHASE9_ROUND136_T1_VERIFY135_LIMITS — T1 kiểm chứng độc lập đợt 135

> Luồng T1, đợt 136, lượt cron 12:35 +07 18/11/2026 (mở lượt 05:35Z 18/11/2026).
> **VERDICT: PASS — xác nhận CHẤP NHẬN của T10 (đợt 135) đứng vững.**
> Mọi claim lớn của đợt 135 đều tái kiểm đúng bằng code/bằng chứng độc lập trên đĩa.
> Tìm được **3 sai số mới (F-136-T1-1, F-136-T1-2, F-136-T1-3), KHÔNG đổi verdict nào.**
> KHÔNG push. KHÔNG release/tag. Không code giả — mọi claim dưới đây đều có bằng chứng trên đĩa.

## 0. Phương pháp + phạm vi + môi trường kiểm

- **Đếm:** code riêng viết mới tại `hidden_files/round136-t1/count-136.py`
  (không chạy script của T10-135, không dùng bất kỳ số nào của T10 làm đầu vào).
  Quét trực tiếp mọi file `phase9-round<N>-*.txt` trong
  `~/workspace/repo-1-push/paths-loop/` (111–135, gồm cả closing) trong MỘT lần quét,
  tách entry theo byte NUL, tính batch/entry/unique trực tiếp từ tập hợp (hợp toàn cục),
  KHÔNG cộng số round-unique vào lũy kế cũ (bài học đợt 126–127).
  Kiểm thêm: mọi đường dẫn stage phải tồn tại trên đĩa; mọi paths file phải là
  NUL-delimited thuần (kết thúc bằng NUL, không newline trong entry).
- **Tính lại độc lập lượt yên #12:** script riêng viết mới
  `hidden_files/round136-t1/recompute-quiet12.py` (đọc trực tiếp JSON gốc của T4)
  + `recompute-hist.py` (pixel-match histogram tự viết lại theo phương pháp đã công bố:
  post-flip+2000ms, viaRvfc=0, decode strip 48px kênh G, khớp GT frames-nonperiodic
  ngưỡng ≤2 bit, m\* gần label nhất). Không chạy lại script của T3/T4/T5.
- **Claim từng luồng:** đọc trực tiếp log/script/dữ liệu gốc của luồng đó trong
  `hidden_files/round135-*/` + file LIMITS của luồng + bản copy lúc đóng của LIMITS gộp;
  không tin lời T10 mà không có vết trên đĩa. Chỗ nào chỉ kiểm lại được qua log
  (trạng thái đã trôi) thì ghi rõ, không tuyên bố kiểm lại được.
- **Thời gian kiểm:** 05:40–05:55Z 18/11/2026. Boot hiện tại lúc kiểm: **1ca1feaa**,
  btime 05:29:18Z — boot MỚI sau khi đợt 135 đóng (reboot lúc mở đợt 136, ngoài phạm vi
  đợt 135; mọi số đo trạng thái lúc đóng đợt 135 chỉ kiểm lại được qua log gốc,
  không đo lại trên boot hiện tại).
- **Cây lúc kiểm:** `preview.tsx 530e10a7` (đã KHÔI PHỤC fix theo quyết parent đợt 135
  §12.3(a) — đợt 136 mở với cây 530e10a7; xem §4.7). `media.ts 2c384ed1`,
  `vite.config.ts ee80d093` (không đổi).

## 1. Đếm cuối đợt 135 + lũy kế — KHỚP HOÀN TOÀN

| Phạm vi | T10 công bố | T1-136 tái kiểm trực tiếp | Khớp |
|---|---|---|---|
| Đợt 135 (gồm closing) | 10 batch / 15 entry / 15 file duy nhất | **10 / 15 / 15** | ✅ |
| Lũy kế 111–134 (tái kiểm) | 238 / 563 / 493 (số công bố đợt 134) | **238 / 563 / 493** | ✅ |
| Lũy kế 111–135 (gồm closing) | 248 / 578 / 503 | **248 / 578 / 503** | ✅ |
| File mới-only đợt 135 | 10 | **10** | ✅ |
| File đợt 135 trùng 111–134 | 5 | **5** | ✅ |

Chi tiết đợt 135 (đếm trực tiếp từ đĩa, script + output tại `round136-t1/count-136.py`
→ `t1-count-136.txt`):

| File paths | Entry |
|---|---|
| phase9-round135-closing.txt | 2 (`docs/PHASE9_ROUND135_LIMITS.md`, `PHASE9_GAP_ANALYSIS.md`) |
| phase9-round135-t1-verify134.txt | 1 |
| phase9-round135-t2-eperm.txt | 1 |
| phase9-round135-t3-c2.txt | 2 (`docs/PHASE9_ROUND135_T3_C2_LIMITS.md`, `apps/web/src/preview.tsx`) |
| phase9-round135-t4-quiet12.txt | 1 |
| phase9-round135-t5-infra.txt | 2 (`apps/web/scripts/vcut-webkit-postboot-check.sh`, `docs/PHASE9_ROUND135_T5_INFRA_LIMITS.md`) |
| phase9-round135-t6-lockhealth.txt | 3 (`apps/web/scripts/vcut-vite-lock-v2.sh`, `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md`, `docs/PHASE9_ROUND135_T6_LOCKHEALTH_LIMITS.md`) |
| phase9-round135-t7-scheduler.txt | 1 |
| phase9-round135-t8-viteharness.txt | 1 |
| phase9-round135-t9-headroom.txt | 1 |
| **Tổng** | **10 batch / 15 entry / 15 duy nhất** |

- 15 entry vs 15 duy nhất: không có file nào lặp trong đợt 135.
- File mới-only (10): 9 LIMITS luồng + LIMITS gộp. File trùng (5): `PHASE9_GAP_ANALYSIS.md`,
  `apps/web/scripts/vcut-vite-lock-v2.sh`, `apps/web/scripts/vcut-webkit-postboot-check.sh`,
  `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md`, `apps/web/src/preview.tsx`.
- **Mọi đường dẫn stage đều tồn tại trên đĩa** (script kiểm toàn bộ 503 file duy nhất
  111–135: 0 thiếu). **Mọi paths file NUL-delimited thuần** (0 newline trong entry,
  kết thúc bằng NUL, 0 entry rỗng bất thường).
- Đây là **lần tái kiểm độc lập thứ mười hai liên tiếp khớp** (T1-135 là lần thứ mười,
  T10-135 là lần thứ mười một, lần này là thứ mười hai).

## 2. LIMITS gộp đợt 135 lúc đóng — BẢN GỐC CÒN NGUYÊN, CHỈ THÊM §12.3

- Bản copy lúc đóng `round135-t10/PHASE9_ROUND135_LIMITS.closing-copy.md`: **54.016 B,
  sha256 `316ee3565f6ae9d074149b08f66d09411a5049bf8a8ead5e0e09db935f02d7f9`** —
  khớp hoàn toàn sha/size T10 công bố lúc đóng (§10, đầu file gộp).
- File hiện tại trên đĩa: **58.494 B, sha `43a4cfaf…a99d`**. Chênh +4.478 B.
  Diff bản copy lúc đóng vs 54.016 byte đầu của file hiện tại: chỉ khác ở §12.3 —
  dòng tiêu đề placeholder `### §12.3 QUYẾT PARENT` + dòng
  `_(Parent quyết sau khi T10 đóng — ghi vào đây khi có.)_` được thay bằng tiêu đề quyết
  `(main chat, 11:1x +07 18/11/2026 — đóng đợt 135)` + 6 quyết (a)–(f); footer
  `Batch stage / Tổng batch: 10 batch / 15 entry / 15 file (lũy kế 111–135: 248/578/503)`
  vẫn còn nguyên ở cuối file. Không dòng nào khác bị sửa/xóa.
  Đây đúng là mẫu ghi quyết parent đã quy ước (AGENTS.md: quyết viết thành §12.3 mới,
  §12.2 đã mang marker "(đã quyết ở §12.3 dưới)" từ lúc đóng). Nội dung lúc đóng
  vẫn kiểm chứng được đầy đủ qua bản copy.
- 9/9 cờ `.done` (T1–T9) + `round135-t10.done` đều tồn tại trên đĩa.
- File `round-in-progress.md` hiện tại là của **đợt 136** (mtime 05:36:51Z, nội dung
  "Đợt 136 đang chạy") — chốt chặn đợt 135 đã xóa khi đóng như T10 ghi; file đã được
  tạo lại bởi đợt 136, không phải sót lại.

## 3. Lượt yên WebKit #12 — TÍNH LẠI ĐỘC LẬP TỪ JSON GỐC: KHỚP 100%

JSON gốc `round135-t4/preview-b-f3-flip-webkit-t4-attempt1.json` (3.763.122 B):
`passes=20`, `engine=webkit`, `pageErrs=[]`, `flip={afterPass: 5, wallMs: 25478}`.

| Hạng mục | T3/T4/T5 công bố | T1-136 tính lại từ JSON gốc | Khớp |
|---|---|---|---|
| tickCost n / median / p90 / min / max | 682 / 40,0 / 65 / 28 / 101 | **682 / 40,0 / 65 / 28 / 101** | ✅ |
| tickCost hậu flip+2000ms n / median | 501 / 40,0 (≤60 ĐẠT) | **501 / 40,0** | ✅ |
| blendTick n / hậu flip+2000ms | 557 / 412 | **557 / 412** | ✅ |
| c2DrawLog n (drawSrc / rawUnit) | 1325 (682 / 643) | **1325 (682 / 643)** | ✅ |
| c2DrawLog byLoop | {1:63, 2:66, 3:64, 4:64, 5:62, 6:70, 7:62, 8:66, 9:66, 10:72, 11:64, 12:68, 13:62, 14:72, 15:68, 16:70, 17:66, 18:72, 19:63, 20:1, 21:63, 22:1} | **y hệt từng loop** | ✅ |
| wraps / frameIdx distinct / range | 21 / 65 / 0–72 | **21 / 65 / 0–72** | ✅ |
| wallMs span | 9256→77903 = 68.647 ms | **9256→77903 = 68.647 ms** | ✅ |
| stage / srcKind / readyState / seeking | plain-native 682, rawUnit 643; canvas 1280x720 ×1325; readyState 4 ×1325; seeking False ×1325 | **y hệt** | ✅ |
| Coverage (c2) 7/7 | delta −27…+31 ms (T4) / −25…+31 ms (T3) | **mỗi seq có 20–30 entry log trong ±500 ms** | ✅ |
| Histogram ghost (pixel-match) | n=824, nomatch=0, {-11:2, -9:2, -1:48, 0:319, +1:216, +2:210, +3:27} | **n=824, nomatch=0, y hệt từng bin** | ✅ |
| snap−label / raw−label median | 35 / 8 ms | **35 / 8 ms** | ✅ |
| label-floor {0, 1} | {0:207, 1:617} → +1=74,9% | **{0:207, 1:617}** | ✅ |
| curPix run ≥3 tick | 15 run | **15 run** | ✅ |
| P1 p-value (7/7, baseline 45/412) | p=1,85e-07 | **(45/412)^7 = 1,854e-07** | ✅ |
| P3 p-value (7/7, baseline 88/411) | p=2,06e-05 | **(88/411)^7 = 2,063e-05** | ✅ |

- (c2) seqs [166, 251, 305, 363, 448, 480, 534]: mỗi seq có ghostFrames
  `[0, presented−1]` (lag +1f), presented==expected, skippedLatest=0 — đúng định nghĩa.
- Tie ±27 ms ở seq 251 (F-135-T3-1): xác nhận có 2 entry log cách đều tBlend=40899:
  40872 (−27 ms, frameIdx 15) và 40926 (+27 ms, frameIdx 17). Cả hai đều trong ±500 ms
  → COVERED; coverage 7/7 không đổi dù chọn bên nào.
- Ghi nhận lại: histogram rerun của T5 KHÔNG độc lập (T5 chạy lại chính script của T3 —
  aggregate §10.1 đã ghi). Kiểm chứng độc lập thật cho histogram lần này là
  `recompute-hist.py` của T1-136 (tự viết lại) + analyzer của T4 + script bước 2 của T3.
- **Sai số về trung bình chuỗi lượt yên — xem F-136-T1-3 (§7).** Ngưỡng ≤60 ms GIỮ
  (median lượt #12 = 40,0 ms, tính lại độc lập).

## 4. Đối chiếu từng luồng

### 4.1 T1 — kiểm chứng độc lập đợt 134: PASS, trừ 1 sai số về boot (xem F-136-T1-1)

- Đếm lại của T1-135 cho đợt 134 (10/12/12; lũy kế 111–134 = 238/563/493) khớp hoàn toàn
  với đếm lại của T1-136 (§1). Lần tái kiểm thứ mười của T1-135 là đúng về số đếm.
- F-135-T1-1 (kiểm lúc đóng của T10-134 không còn file bằng chứng riêng) **ĐÃ ĐƯỢC SỬA
  ở đợt 135**: `round135-t10/` có đầy đủ `t10-closing-checks.txt`,
  `t10-started-at-135.txt`, `t10-reboot1.md` (xem §5).
- **F-136-T1-1 — dòng boot của T1-135 là SAI (xem §7).** Không đổi verdict của T1-135
  (kiểm chứng đợt 134 của T1 là log-based; số đếm và số ghost tính lại đều đúng).

### 4.2 T2 — probe #54 + mù #54 ĐÓNG HOÀN TOÀN + 6 gap mới: KHỚP

- Probe #54: `round135-t2/once.txt` ghi `probe#54 boot=78b55838 ok=2 fail=0`
  (02:45:23Z); `boot-verify.txt` đọc trực tiếp `/proc/sys/kernel/random/boot_id`
  lúc 02:45:04Z = **78b55838**, btime 1794968847 = 02:27:27Z — xem §6 (mâu thuẫn boot).
- Mù #54: `blind54-merged.log` — 7 đoạn A–G, merged distinct-second marks **350**,
  lỗ lớn nhất **718 s** (đuôi F, 02:15:29Z→02:27:27Z) < sàn 1.147 s, **max_hidden=0
  cả 7 đoạn** → ĐÓNG HOÀN TOÀN. Thời lượng mù 23:46:54Z 17/11 → 02:45:23Z 18/11
  = 10.709 s = 2h58'29" ✓.
- 6 gap mới trong `blind54-gaps.txt` (dòng ~440): #84?→#85? [26'09", 26'29"] mid 26'19"
  = 1.579 s; #85?→#86? [19'28", 19'48"] mid 19'38" = 1.178 s; #86?→#87? [45", 65"]
  mid 55 s; #87?→#88? [3'36", 3'56"] mid 3'46" = 226 s; #88?→#89? [1h13'32", 1h13'52"]
  mid 1h13'42" = 4.422 s; #89?→#90? [55'59", 56'19"] mid 56'09" = 3.369 s.
  **CERT n=47→53, FULL n=62→68** (file ghi `CERT53` / `FULL68` với thống kê đầy đủ) ✓.
  Caveat 4 gap giữa có F CHƯA ĐO ở CẢ HAI ĐẦU đã được ghi trong LIMITS gộp §2 và GAP §64.
- Dải cơ học #91? [02:54:47Z, 04:53:38Z] (p10–p90 FULL68) trong `blind54-gaps.txt` ✓;
  reboot 03:35:20Z NẰM TRONG dải ✓. #86?/#87?/#88? NGOÀI DẢI sớm 812 s / 1.935 s /
  1.764 s ✓ (file ghi đúng 3 số này).
- WFS lần 41: `scan-meta.txt` ghi NEWSTD 249 file / 896 dòng, R7B 266 / 921,
  COPIES 17 / 25; 896+25=921 ✓, chênh 0. (File `wfs-newstd.txt` 249 dòng,
  `wfs-r7b.txt` 266 dòng, `wfs-copies.txt` 17 dòng — khớp.)
- RAM max trong mù 2.350 MB: `ram-max.txt` — kiểm lại qua file (đoạn A max 2.350 MB).
  Không kiểm lại được độc lập hoàn toàn (RAM là trạng thái đã trôi); ghi nhận theo file.
- F-135-T2-1/-2/-3 đã được ghi trong LIMITS gộp §2; các file sửa lại
  (`blind54-merged.py` có guard len, nhãn đã sửa) có trên đĩa. Không sai số mới ở T2.

### 4.3 T3 — bước 2 lượt yên #12 + REVERT: KHỚP

- Script bước 2 `t3-step2-verify135.py` + output `t3-step2-135a1.txt` có trên đĩa;
  dry-run JSON lượt #10/#11 partial khớp như LIMITS T3 ghi.
- Revert: file `round135-t3/preview.tsx.pre-revert-530e10a7` md5 **530e10a7** (đã verify);
  cây lúc đóng theo `t10-closing-checks.txt` (03:58:30Z): preview.tsx **805409f0**,
  media.ts 2c384ed1, vite.config.ts ee80d093 — khớp LIMITS gộp §10.2.
  Cây hiện tại (đợt 136) đã khôi phục về **530e10a7** theo quyết parent §12.3(a):
  md5 trực tiếp lúc kiểm = 530e10a7266b8c148411ba21510b501a, trùng file pre-revert ✓.
- T3 đề xuất GIỮ + T4/T5 đề xuất GIỮ đã được parent quyết GIỮ (§12.3(a)) — không còn mở.

### 4.4 T4 — lượt yên #12: KHỚP (trừ trung bình chuỗi, xem F-136-T1-3)

- Attempt1 20/20 pass: JSON gốc `passes=20` (§3). `poll-t4.log` dòng 9 ghi
  `run-attempt exit=127 02:46:33Z` — xác nhận F-135-T4-1 (poller gọi nhầm
  `run-attempt-134.sh`) ✓; cửa mở lại 02:50:57Z, attempt1 chạy 02:51–02:54Z.
- Lớp B 5/5: theo `classb-t4-attempt1.txt` (B1 load5 cuối 0,90; B2 load1 max 1,88;
  B3 0 reboot trong lúc đo; B4 0 apt/dpkg; B5 RAM min 1208 MB) — khớp LIMITS T4.
- WebKit FULL PASS lần thứ 13: kiểm qua 12 file `round12{3..9}-t10/t10-o8.log` +
  `round13{0..4}-t10/t10-o8.log` — mỗi file đều có 2 dòng `21/21 pass`
  (Chromium + WebKit), trừ đợt 127 chỉ có 1 dòng `21/21 pass` nhưng LIMITS gộp đợt 127
  ghi rõ Chromium 21/21 exit 0 (04:28:00–04:28:53Z, sau 1 rerun) + WebKit 21/21
  (04:26:16–04:27:11Z) — chuỗi 13 lần liên tiếp (đợt 123–135) đứng vững.

### 4.5 T5 — infra + pha 2: KHỚP

- Cờ `round135-t5/POSTBOOT_PASS`: `boot_id=78b55838-… btime=2026-11-18T02:27:38Z
  pass_at=2026-11-18T02:45:13Z poll=2` ✓ (btime 02:27:38Z là /proc/1-derived,
  chênh +11 s so với /proc/stat 02:27:27Z — lớp chênh đã biết, xem §5).
- Watcher log `t5-wait-replay-b88.log`: poll 1–2, dpkg **1545 dòng / 221 installs**,
  dòng cuối 02:37:47Z, GST **269**, lists 37, partial 0 ✓.
- `t5-postboot-b88-poll1.log` ghi `plugins-bad ĐÃ CÀI` + replay ĐÃ XONG lúc mở ✓.
- Pha 2: P1/P3/coverage đã tính lại độc lập ở §3 (p-value khớp tới 3 chữ số có nghĩa).
- R9 (a) vẫn 16: không tìm thấy số 17 trong LIMITS T5 / file T5-135 (grep toàn
  `round135-t5/` + LIMITS T5: 0 lần nhắc "17" cho R9). ✓

### 4.6 T6 — đổi thứ tự ghi log lock + lock KHỎE: KHỚP

- Script lock hiện tại md5 **520b8baa** (đo trực tiếp
  `apps/web/scripts/vcut-vite-lock-v2.sh`) ✓ — đúng md5 T6 công bố sau đổi thứ tự.
- Log lock lúc T6 đóng: `analyze-log-cleaned-close.txt` ghi
  `TOTAL: ACQUIRED=262, COOLDOWN=82, RELEASED=256, STALE-LOCK=6, STALE-TICKET=1,
  TICKET=271, TIMEOUT=8, total=886` + `pairs ACQUIRED->RELEASED: 256` +
  `RELEASED without prior ACQUIRED: 0` ✓ (886 dòng, 256/256 cặp).
  ACQUIRED−RELEASED = 6 = 5 ca double-acquire đã biết + 1 t4 F-134-T6-2 ✓.
- Đối chiếu lúc T10 đóng (aggregate §10.1): ACQUIRED 270 / RELEASED 264 —
  tăng đúng +8/+8 so với lúc T6 đóng, chênh lệch 6 không đổi ✓
  (số lần giữ thêm sau 02:49Z không phân rã ở đây — chỉ xác nhận tổng tăng đều).
- Cooldown lúc đóng 82 file: `t10-closing-checks.txt` đếm đúng 82 dòng
  (80 lúc T6 đóng + cooldown-t8-round135 + cooldown-t10-round135) ✓.

### 4.7 T7 — cửa SẠCH: KHỚP (theo bằng chứng trên đĩa + số học nội bộ)

- `round135-t7/NOTES.md`: cửa 23:53:42Z 17/11 → 03:25:29Z 18/11, HB 7/7 + DR 4/4,
  0 slot thiếu mới, 3 lần kiểm khớp nhau; bảng slot đầy đủ run_id + started_at.
- Lũy kế: HB **43/198** (191+7=198 ✓, thiếu +0); DR **48/170** (166+4=170 ✓, thiếu +0).
  Tỉ lệ: 43/198=21,7% (từ 22,5%); 48/170=28,2% (từ 28,9%) — tính lại đúng.
- Caveat giữ nguyên: các số lũy kế này dựa trên lịch sử API scheduler trả về
  (`history_may_be_truncated=true`); T1-136 KHÔNG truy vấn lại được cửa sổ cũ
  (lịch sử đã trôi qua thêm nhiều reboot) — kiểm chứng dừng ở bảng slot trong NOTES.md
  + số học nội bộ. Không phát hiện mâu thuẫn nội bộ.
- Slot HB 03:50:50Z + DR 04:00Z sau cửa T7 (03:25:29Z) — thuộc cửa T7-136, không đếm
  ở đợt 135 ✓ (aggregate §10.1 F-135-T10-4 đã ghi).

### 4.8 T8 — vite harness 3/3 sau 1 retry: KHỚP

- `smoke/run-webkit-summary.txt`: `ALL DONE 03:26:48Z ec: 84l10=124 85m4=0 86n2=0`.
- 84l10 chạy 1: `run-webkit-84l10.log` — `exit=124 end 03:20:14Z` (TIMEOUT 900 s,
  kẹt sau W1-lần1 PASS, 0 dòng W1-lần2) ✓ — pha kẹt MỚI như F-135-T8-1 ghi.
- 84l10 retry: `run-webkit-84l10-retry.log` — `exit=0 end 03:32:23Z`, W1×3/W2/E4 PASS,
  `KẾT QUẢ: KHÔNG FAIL` ✓. 85m4 + 86n2: `KẾT QUẢ: KHÔNG FAIL` (03:22:40Z / 03:26:48Z) ✓.
- "3/3 exit 0" chỉ đúng khi tính retry — aggregate §8 đã ghi rõ điều này, không suy ra
  "84l10 luôn pass". Fixture rebuild 6/6 md5 trong `rebuild-fixtures.log` (hevc ba0c7c62,
  i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549) — khớp LIMITS T8.
- F-135-T8-3 (label "swap_used" sai): ghi nhận, chỉ là nhãn, không đổi số liệu.

### 4.9 T9 — headroom/RAM: KHỚP

- Headroom: `headroom-measure-1.log` STOP at i=2403; `headroom-measure-2.log`
  STOP at i=2395 → **2.403 → 2.395** ✓. Chênh −8 trong boot ✓.
  Còn 595 trên ngưỡng báo < ~1.800 (2395−1800=595) ✓. Trần inotify 63.747 không đổi
  (trong log đo 2) ✓.
- RAM: `ram-snapshot-1.log` — MemAvailable **843.892 kB lúc 02:41:04Z** (= 844 MB thập phân)
  và **1.733.612 kB lúc 02:43:04Z** (= 1.734 MB thập phân) ✓ — đúng khoảng 844–1.734 MB
  T9 công bố (đơn vị MB thập phân kB/1000, như LIMITS T9 ghi rõ).
  Balloon 6.050.256 → 5.212.536 kB (ròng −837.720 kB giữa 2 mẫu snapshot; ròng cả cửa sổ
  −619.348 kB theo LIMITS T9 — chênh do mẫu giữa, không mâu thuẫn).
- Birefnet KHÔNG THỬ (max 1.734 MB < guard 6.144 MB) ✓; u2net là fallback chính thức.

## 5. Kiểm đầu lúc đóng của T10 — TÁI KIỂM TỪ FILE BẰNG CHỨNG

- Suite cây gộp: `round135-t10-suites.log` — **27 dòng `exit=0`, 0 lần nhắc "rerun"**,
  `preview-engine: 354 assertions pass`, chạy 03:52:14–03:56:06Z, boot bcc71e61,
  cây `preview.tsx 805409f0` ✓.
- O8: `t10-o8.log` — **42 dòng PASS, 0 FAIL**; `KẾT QUẢ CLICK-TEST O8: 21/21 pass`
  (Chromium, 03:57:12Z) + `KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass` (03:58:03Z) ✓.
- Reboot giữa lượt: `t10-reboot1.md` — 78b55838 → bcc71e61, btime mới 1794972920 =
  **03:35:20Z**; phát hiện 03:36:07Z, uptime 47 s; boot cũ sống 02:27:27Z→03:35:20Z
  = **4.073 s** (1794972920−1794968847=4073 ✓), NẰM TRONG dải T2 [02:54:47Z, 04:53:38Z] ✓.
  Khung chết #90? (03:32:23Z, 03:35:20Z] = 177 s (last-seen = retry T8 DONE 03:32:23Z) —
  đã được parent xác nhận làm chuẩn ở §12.3(b).
- started_at: `t10-started-at-135.txt` — run `f2fa4088` started_at nay 1794972956 =
  03:35:56Z = btime + **36 s** ✓; jitter vs sched +3.605 s ✓; run đợt 134 `19a360f1`
  vẫn 01:31:58Z, KHÔNG viết lại lần 2 ✓. Lần thứ 6 liên tiếp xác nhận giả thuyết.
- Lock trống lúc đóng: `t10-closing-checks.txt` — TRỐNG, 0 ticket + **82 cooldown**,
  không có `vite.lock` ✓. 0 process sót ✓.
- /tmp/.X11-unix/: xem F-136-T1-2 (§7) — file bằng chứng ghi X193/X194/X195 còn hiện diện
  lúc kiểm, khác câu "trống" trong aggregate.
- Cây lúc đóng (03:58:30Z): preview.tsx 805409f0, media.ts 2c384ed1,
  vite.config.ts ee80d093 ✓ (theo `t10-closing-checks.txt`).

## 6. Mâu thuẫn boot T1-135 vs parent — KẾT LUẬN: PARENT ĐÚNG, T1-135 SAI

- **Claim của T1-135** (`docs/PHASE9_ROUND135_T1_VERIFY134_LIMITS.md` dòng 26–27):
  "Thời gian kiểm: 02:40–02:54Z 18/11/2026. Boot hiện tại lúc kiểm: **8ae55060**,
  btime 01:31:18Z — cùng boot T10 đóng đợt 134 (không reboot thêm kể từ lúc đóng)."
- **Bằng chứng trực tiếp ngược lại:**
  - T2 `round135-t2/boot-verify.txt` (ghi 02:45:04Z, TRONG cửa sổ kiểm của T1):
    đọc `/proc/sys/kernel/random/boot_id` = **78b55838-d09e-4cfc-b491-a15935b7a447**,
    btime 1794968847 = 02:27:27Z; journalctl first entry 02:27:38Z (cùng boot).
  - T5 `POSTBOOT_PASS`: boot_id 78b55838, pass_at 02:45:13Z, poll=2.
  - T4 gate0 02:45:13Z + attempt1 JSON (02:51–02:54Z) + T6/T8/T9: tất cả trên boot 78b55838.
  - Parent đo trực tiếp lúc mở đợt: boot 78b55838.
  - T10 `t10-reboot1.md` + `t10-closing-checks.txt`: boot mở phiên đóng sổ 78b55838.
- **Không có file bằng chứng boot nào trong `round135-t1/`** (chỉ có `count-135.py`,
  `verify-ghost-recompute.py/.out`) — claim boot của T1-135 không có vết đọc `/proc`
  nào đi kèm. Số 8ae55060/btime 01:31:18Z chính là boot lúc T10 đóng đợt 134
  (suite log đợt 134 chạy 01:44–01:48Z trên boot này) — T1-135 dường như đã lấy boot
  từ log đợt 134 rồi khẳng định là boot hiện tại, thay vì đọc tươi.
- **Kết luận:** có 1 reboot 8ae55060 → 78b55838 lúc **02:27:27Z** (sự kiện gộp #14,
  boot #90?), GIỮA lúc T10 đóng đợt 134 và lúc đợt 135 mở (02:35Z). Parent đúng;
  T1-135 sai ở dòng boot này. Ghi thành **F-136-T1-1** (§7).
  Ảnh hưởng: KHÔNG đổi verdict của T1-135 về đợt 134 (kiểm chứng đó là log-based;
  đếm 134 = 10/12/12 và ghost #10/#11 tính lại đều đúng — T1-136 đã tái kiểm ở §1/§4.1).
  Bài học cho T1 các đợt sau: mọi claim boot phải kèm file đọc trực tiếp
  `/proc/sys/kernel/random/boot_id` + btime tại thời điểm kiểm (như T2 đã làm).

## 7. Sai số mới (F-136-T1-n)

- **F-136-T1-1 — T1-135 ghi sai boot hiện tại lúc kiểm (xem §6).**
  T1-135 LIMITS dòng 26–27: boot 8ae55060, btime 01:31:18Z, "không reboot thêm kể từ
  lúc đóng [đợt 134]". Thực tế: boot lúc 02:40–02:54Z là **78b55838**, btime 02:27:27Z
  (reboot 02:27:27Z, sự kiện gộp #14). Bằng chứng: T2 `boot-verify.txt` 02:45:04Z
  (đọc trực tiếp /proc), cờ T5, JSON T4, log T6/T8/T9, đo trực tiếp của parent lúc mở.
  Không có file bằng chứng boot trong `round135-t1/`. **Không đổi verdict nào**
  (verdict PASS của T1-135 về đợt 134 đứng trên log + số đếm, đều tái kiểm đúng).
- **F-136-T1-2 — File bằng chứng lúc đóng của T10-135 mâu thuẫn câu "trống" về
  /tmp/.X11-unix/.** Aggregate §10.2 ghi "/tmp/.X11-unix/ lúc đóng: **trống**
  (đã dọn X193/X194/X195…; kiểm 03:58:30Z)". Nhưng chính file `t10-closing-checks.txt`
  (lưu output kiểm đó) liệt kê trong mục `--- /tmp/.X11-unix/` ba socket
  X193/X194/X195 (mtime 03:55Z) còn hiện diện. Việc dọn hẳn đã xảy ra SAU khi
  lệnh `ls` trong check được chụp, hoặc lần kiểm lại "trống" không được lưu file.
  **Không đổi verdict** (3 socket là artifact do chính suite verify của T10 tạo lúc
  03:55Z, không phải process sót; /tmp đã bị xóa bởi reboot sau đó; không ảnh hưởng
  suite/O8/lock). Bài học: khi dọn rồi kiểm lại, lưu output của LẦN KIỂM SAU CÙNG.
- **F-136-T1-3 — Trung bình chuỗi 10 lượt yên hợp lệ ghi sai số học.**
  LIMITS gộp §3 + §12.3(f) + LIMITS T4/T3 ghi chuỗi 10 lượt:
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 ms,
  "trung bình 46,6 ms". Tính lại: tổng = **462,5 ms**, trung bình = **46,25 ms
  → 46,3 ms** (làm tròn 1 chữ số), KHÔNG phải 46,6 ms. Đối chiếu: trung bình 9 lượt
  trước khi thêm lượt #12 là 422,5/9 = 46,94 → 46,9 ms — đúng như đợt 134 công bố;
  sai số chỉ xuất hiện khi thêm lượt #12 (số 46,6 trùng với trung bình chuỗi ở đợt 128,
  có thể đã chép lại số cũ). **Không đổi verdict nào** (ngưỡng ≤60 ms áp cho từng lượt
  riêng lẻ; median lượt #12 = 40,0 ms đã tính lại độc lập; chuỗi vẫn 10 lượt hợp lệ).
  Đề nghị: đợt 136 tính lại trung bình từ danh sách đầy đủ, không chép số đợt trước.

## 8. Ghi nhận thêm (không phải sai số)

- LIMITS gộp sau đóng chỉ thay ở §12.3 placeholder → quyết parent (a)–(f); bản copy lúc
  đóng còn nguyên, sha khớp (§2). Quyết (a) KHÔI PHỤC FIX đã được thực hiện ở đợt 136
  (preview.tsx hiện 530e10a7, §4.3).
- Boot hiện tại lúc T1-136 kiểm (1ca1feaa, btime 05:29:18Z) là boot mới sau đợt 135 —
  reboot lúc mở đợt 136, ngoài phạm vi đợt 135.
- T7 lũy kế HB/DR chỉ kiểm được qua NOTES.md + số học nội bộ (lịch sử scheduler đã trôi);
  caveat `history_may_be_truncated=true` vẫn đứng (§4.7).
- File oversize đợt 135 (T2 58.437 B, T6 47.396 B, T5 41.249 B — đều >37.768 B) +
  file 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`: chỉ stage paths,
  không push — đúng luật đã biết.
- Không có push nào trong đợt 135 (chờ lệnh user) — đúng luật cứng.

## 9. Đếm cuối đợt 136 (phần T1) + stage

- Đợt 136 (phần T1-136): 1 batch / 1 entry / 1 file mới
  (`docs/PHASE9_ROUND136_T1_VERIFY135_LIMITS.md` — file này).
- Stage: `phase9-round136-t1-verify135.txt` (1 entry, NUL-delimited).
- KHÔNG push (chờ lệnh user từ main chat).

## 10. Kết luận

**VERDICT: PASS — CHẤP NHẬN của T10 về đợt 135 đứng vững.**
Đếm lại độc lập: đợt 135 = 10 batch / 15 entry / 15 file; lũy kế 111–135 =
248 / 578 / 503; tái kiểm 111–134 = 238 / 563 / 493 — khớp hoàn toàn số công bố.
Suite 27/27 exit 0, 0 rerun; O8 Chromium 21/21 + WebKit 21/21 exit 0
(WebKit FULL PASS lần thứ 13 liên tiếp, đợt 123–135 — kiểm qua 13 file t10-o8.log).
Lượt yên #12 tính lại độc lập từ JSON gốc: tickCost median 40,0 ms (n=682, post 501),
(c2)=7, c2DrawLog n=1325 loop 1–22, wraps 21, coverage 7/7, histogram ghost khớp từng bin
(n=824), P1 21/21, P3 20/21. Mù #54 đóng hoàn toàn (7/7 đoạn, 0 ẩn); 6 gap mới
CERT n=53 / FULL n=68. T6 lock 256/256 cặp, script 520b8baa. T7 cửa sạch 43/198, 48/170.
T8 3/3 sau 1 retry (84l10 exit 124 → retry exit 0). T9 headroom 2.395.
1 reboot giữa lượt (78b55838 → bcc71e61, btime 03:35:20Z); started_at lượt 135 bị viết
lại lần thứ 6 (+36 s sau btime).
3 sai số mới F-136-T1-1/-2/-3 đều là ghi chép/số học mô tả, **không đổi verdict nào**:
(1) T1-135 ghi sai boot lúc kiểm (8ae55060 thay vì 78b55838); (2) file bằng chứng lúc đóng
của T10-135 còn liệt kê X193–X195 trong khi aggregate ghi "/tmp/.X11-unix/ trống";
(3) trung bình chuỗi 10 lượt yên là 46,3 ms (46,25), không phải 46,6 ms.
