# PHASE9_ROUND107_I9_VERIFY_LIMITS — Kiểm chứng độc lập đợt 107: 8/8 về đủ, cây gộp XANH, O8 21/21 cả 2 engine

> Luồng I9, đợt 107, lượt cron 00:35 +07 14/11/2026 (17:35Z 13/11).
> Repo local `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> **KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.**
> Không tự gộp LIMITS đợt 107, không sửa gap analysis — đó là việc của parent.

## 0. Kết quả chính (5 ý)

1. **8/8 luồng về đủ TRƯỚC hạn đóng băng** (LIMITS + batch stage đầy đủ):
   I1 ghost, I2 re-arm, I3 2MiB, I4 zombie, I5 blur B-band, I6 harness,
   I7 EPERM, I8 blur cụm A. **0 luồng mất, 0 late merge.** I5/I8 batch
   về muộn hơn LIMITS vài chục phút (I8 batch 18:4x, I5 batch 18:5x)
   nhưng đều có đủ trước khi đóng băng — không cần cứu số từ dữ liệu thô.
2. **Đối chiếu headline ĐỘC LẬP: KHỚP 100% ở cả 8 luồng** (xem §2).
   I9 tính lại từ dữ liệu thô trên đĩa bằng script viết mới của riêng
   mình (`recount-i1.py`, `recount-i2.py`, `recount-i4b.py`,
   `recount-i5.py`/`recount-i5b.py`, `recount-i6.py` + kiểm tra trực
   tiếp file/log I3/I7/I8): flip C3/C3b, CAP f8r/f9 + baseline f1–f5,
   queue2/DOT/pull, zombie/kill/gate (b), Fisher B-band + D floor,
   Wilson/keydown G4, probe #26 + quét writeFileSync, F1/strip/offline
   cụm A — không có số headline nào lệch.
3. **Cây gộp cuối đợt XANH hoàn toàn** (đóng băng 18:56:18Z,
   preview.tsx `ced42efd…`): tsc web 0, tsc desktop 0, vite build PASS
   7,48s, **27/27 mục suite exit 0** (hold 75/75, pacing 19/19,
   previewEngine 27/27, ghostBlend 15/15, css60 60/60, css61 60/60,
   P7 8/8, orphans 17/17, r6 PASS, U4 141/141, test-preview-engine.sh
   354 assertions), **O8 21/21 cả 2 engine** (Chromium + WebKit,
   exit 0). Xem §3.
4. **Reboot #34 KHÔNG xảy ra trong suốt đợt** — boot #33
   (14:50:59Z) ổn định từ lúc spawn tới lúc O8 xong (19:04:11Z, hơn
   4h13'). Dải dự báo của H7 (15:10:06Z–18:05:07Z) **đã bị phá**:
   gap #33→#34 nay vượt trần cũ 3h14'08" — lần đầu tiên dải sàn–trần
   bị phá. Mù #25 ĐÓNG HOÀN TOÀN (I7, đã kiểm lại §2.7); mù #26 bắt
   đầu từ probe #26 (17:40:22Z).
5. **Batch đợt 107: 8 batch / 18 entry / 18 file duy nhất**, 0 binary,
   0 workflow, 0 trùng với đợt 106. Cộng I9: **18 batch / 40 entry /
   40 file duy nhất** chờ push (đợt 106 + 107 + I9) + 1 file oversize
   `webkit-blob-flaky-96x3.json` (6.370.678 B). HEAD vẫn a7308ee9.
   KHÔNG push.

## 1. Poll — 8/8 về đủ, không reboot cắt ngang

Poll mỗi ~10 phút từ spawn ~17:39Z; chi tiết từng vòng trong
`hidden_files/round107-i9/poll.log`.

| Poll | Giờ (Z) | Boot | Về đủ | Ghi chú |
|---|---|---|---|---|
| 0 | 17:40:22 | #33 | 0/8 | Chưa có file nào; md5 ced42efd |
| 1 | 17:50:55 | #33 | 1/8 | I7 về đủ; I1/I3/I4 đã có done-note |
| 2 | 18:01:17 | #33 | 5/8 | I1/I2/I3/I4/I7; cờ nhóm yên đủ → nhóm nặng bắt đầu |
| 3 | 18:05:00 | #33 | 5/8 | Kiểm tay; dải #34 sắp hết |
| 4 | 18:10:49 | #33 | 5/8 | **Dải #34 (tới 18:05:07Z) đã hết mà #34 chưa xảy ra** |
| 5 | 18:21:13 | #33 | 5/8 | Load 15,82 — I5/I6/I8 chạy hết cỡ |
| 6 | 18:31:42 | #33 | 6/8 LIMITS | I8 LIMITS về, batch chưa có; I5 retry đang chạy (load1 lúc phát 27,15) |
| 7 | 18:42:30 | #33 | 7/8 LIMITS | I5 LIMITS về; I8 batch đã có; I5 batch chưa có |
| 8 | 18:53:37 | #33 | **8/8** | I6 về đủ (driver done 18:46:08Z); I5 batch cũng đã có |
| Đóng băng | 18:56:18 | #33 | 8/8 | md5 ced42efd; RAM avail 632 MB |

- Không có `round-in-progress.md` trong suốt đợt.
- preview.tsx md5 `ced42efd785724c8c0d1b16fc32c7341` **không đổi ở mọi
  poll** (đầu = cuối đợt). Không luồng nào sửa production.
- Không cần late merge: không luồng nào chết do reboot (vì không có
  reboot #34), không luồng nào mất dữ liệu thô.

## 2. Đối chiếu headline — tính lại độc lập từ dữ liệu thô

Phương pháp: script mới viết riêng cho I9 (không chạy lại analyzer
của luồng), đọc trực tiếp JSON/log gốc; số nào không tính lại được
bằng script thì kiểm bằng grep/đếm trực tiếp và ghi rõ. **Tất cả KHỚP.**

### 2.1 I1 Ghost — flip-leg máy yên: KHỚP toàn bộ

Script `recount-i1.py` (đọc lại JSON flip + 90 frame GT
`round97-y2/frames-stripes`, phân loại clean/mislabeled/ambiguous
theo đúng phương pháp G1/H5 đã công bố, code viết mới):

| Số | I1 báo | I9 tính lại | Kết luận |
|---|---|---|---|
| C3 clean distinct hậu flip+2000ms | 80/98 = 81,6% (đạt bar) | 80/98 = 81,6% (distinct 111: clean 80, mislabeled 18, ambiguous 13) | **KHỚP** |
| C3 tap distinct / frameIdx distinct | 68/73 ; 12/25 | 68/73 ; 12/25 | **KHỚP** |
| C3 clean mọi occurrence | 2870/2943 = 97,5% | 2870/2943 = 97,5% | **KHỚP** |
| C3 độ phủ anchor tap | 1451/1488 = 97,5% | 1451/1488 (đếm trực tiếp từ JSON: 1488 tick hậu flip+2000, 1451 anchorSrc=tap, cả 1451 đều anchorAgeMs ≤50ms) | **KHỚP** |
| C3 gap \|≤3\| mọi cửa sổ | 100% (24/143/332/1013) | 100% (24/24, 143/143, 332/332, 1013/1013) | **KHỚP** |
| C3 tickCost med/p90 | 11,6 / 18,1 ms | 11,6 / 18,1 ms (n=1500) | **KHỚP** |
| C3 rAF gap med/p90 | 19,5 / 34,1 ms | 19,5 / 34,1 ms (xem lưu ý dưới) | **KHỚP** |
| C3b clean distinct | 94/153 = 61,4% (không đạt, nhiễm tải) | 94/153 = 61,4% (distinct 195: 94/59/42) | **KHỚP** |
| C3b phủ / mọi occurrence | 329/479 = 68,7% ; 626/823 = 76,1% | 329/479 ; 626/823 | **KHỚP** |
| C3b tickCost / rAF gap | 17,8 / 85,2 ; 74,8 / 118,1 ms | 17,8 / 85,2 ; 74,8 / 118,1 ms | **KHỚP** |

- Lưu ý của I9 (không phải lỗi của I1): lần tính rAF gap đầu tiên
  của I9 trên TOÀN BỘ tick cho 20,1/46,7 (C3) — khác số I1 báo.
  Kiểm lại: I1 tính rAF gap trên tick **hậu flip+2000ms**; tính lại
  đúng cửa sổ đó cho 19,5/34,1 (C3) và 74,8/118,1 (C3b) — khớp đúng
  từng chữ. Ghi rõ cửa sổ để đợt sau khỏi tính nhầm.
- Bar C3 đạt (≥70% và ≥ D+20pt = 68,6%): đúng — 81,6% vượt cả hai
  ngưỡng; C3b 61,4% không đạt, đúng như I1 phân loại "nhiễm tải"
  (phủ sụp 68,7%, tickCost/rAF gap tệ nhất từ trước — số đã kiểm).

### 2.2 I2 Re-arm — A/B RAM cao: KHỚP toàn bộ (kèm caveat decay đã kiểm)

Script `recount-i2.py` (nhóm tail theo `tail.endedAtMs`, age = t tick
cuối − endedAtMs, CAP iff age ≥4800ms VÀ rearms không tăng ở tick
ngay sau span):

| Số | I2 báo | I9 tính lại | Kết luận |
|---|---|---|---|
| f8r CAP | 1, ages [5087] | 1, age 5087 (ended 4508, t_last 9595, rearms 0→0) | **KHỚP** |
| f9 CAP | 3, ages [5023, 5201, 5255] | 3, đúng 3 ages (ended 6694/25717/36022, rearms không tăng) | **KHỚP** |
| Gộp | 4 CAP / 2 lượt = 2,00 CAP/lượt | 4/2 = 2,00 | **KHỚP** |
| CAP/tick | 4/217 = 0,0184 | 4/217 = 0,0184 (n_vt 99+118) | **KHỚP** |
| Freeze-tail trung vị | 4849 ms | median(4730, 4968) = 4849 | **KHỚP** |
| Baseline f1–f5 (từ `round104-f5/cap-pattern-rows.json`, chỉ 5 dòng f1–f5) | 14 CAP / 5 lượt = 2,80; CAP/tick 14/700 = 0,0200; frzTail_med 4900; rate_med 0,110; frzPhAdv_med 375 | 2+3+2+4+3 = 14; n_vt 78+139+116+194+173 = 700; frzTail [4802, 4918, 4900, 5012, 4900] median 4900; rate [0,241, 0,108, 0,110, 0,105, 0,127] median 0,110; frzPhAdv [375, 0, 486, 0, 505] median 375 | **KHỚP** |

- Caveat decay (§5 của I2) đã kiểm từ log gốc: dòng "tải nền BẬT"
  trong `run-f5-hiram107.log` ghi MemAvailable **1376 MB (f8r,
  17:49:47Z)** và **989 MB (f9, 17:50:47Z)** — đúng số I2 báo; RAM
  đầu lượt (2942872 / 2428564 kB) và md5 trước=sau `ced42efd…`,
  exit 0, verdict PASS/PASS cũng khớp log. Verdict "RAM bị loại theo
  tiêu chí, chưa phải loại trừ dứt khoát" là cách nói trung thực —
  I9 đồng ý, không sửa.
- Lưu ý: file `cap-pattern-rows.json` có 29 dòng (nhiều phase khác);
  I2 chỉ dùng 5 dòng f1–f5 làm baseline như đã nêu — I9 đã kiểm đúng
  5 dòng đó, không lấy nhầm toàn file (median toàn file khác hẳn:
  frzTail 2385, rate 0,251).

### 2.3 I3 2MiB — queue2 có mặt, chưa chứng minh nhân quả: KHỚP toàn bộ

Kiểm trực tiếp từ GST log / DOT / pull analysis / results JSON
(không qua analyzer của I3):

| Số | I3 báo | I9 kiểm | Kết luận |
|---|---|---|---|
| GST log dòng `queue2` (3 run H2Q) | 7.626–7.782 | 7757 / 7782 / 7626 (grep -c) | **KHỚP** |
| GST log bytes | 2.029.888 / 2.033.941 / 2.001.222 | đúng 3 số (stat + JSON `gstDebugBytes`) | **KHỚP** |
| DOT `ring-buffer-max-size` | 2097152 (= 2 MiB) | đúng, nhiều DOT file | **KHỚP** |
| DOT `current-level-bytes` | 1884314 (READY_PAUSED) | đúng | **KHỚP** |
| DOT vị trí queue2 | typefind → queue2-0 → parsebin | cạnh đúng: `typefindelement0…_src → queue2_0…_sink` (caps `video/quicktime, variant: iso`) và `queue2_0…_src → parsebin0…_sink` (3 bộ DOT độc lập) | **KHỚP** |
| DOT file chứa queue2-0 | 6/15 | 6 | **KHỚP** |
| Pull H2Q (3 run) | 398 PULL/run, toàn EXACT, 0 spliced | run1/2/3 đều 398 (qtdemux 198 EXACT + 1 NODATA, typefind 198 + 1), `BOGUS RUN: NO (0 spliced pulls)` | **KHỚP** |
| Pull `elem=queue2` | 0 (push-mode) | 0 trong cả 5 pull log | **KHỚP** |
| H2Q playOk / frames / dropped | 3/3, 191/191/189, 0 | JSON `webkit-blob-flaky-107i3-2mib.json`: 3 case blob playOk=true, totalFrames 191/191/189, dropped 0, finalCt 8 | **KHỚP** |
| H2EXT EXT / NOEXT | playOk, 189 / 165 frames, 0 spliced | JSON: progressive http-ext 189, http-noext 165, playOk=true; pull 398, 0 spliced cả hai; gstDebugBytes 230029 / 213993 | **KHỚP** |
| Nguyên nhân lỗi H2: thiếu `GST_PLUGIN_PATH` | WebProcess crash khi gán src; hết crash khi set biến | I9 không chạy lại probe (không cần — bằng chứng trong LIMITS §1–§2 đầy đủ: diag `none` vẫn chết, minprobe stepB chết ~38ms sau gán src, MiniBrowser stderr "appsink not found", hết crash khi set biến). I3 đã ghi rõ đây là lỗi môi trường chạy probe, không phải lỗi sản phẩm — I9 đồng ý. | **KHÔNG CHẠY LẠI, KHÔNG PHẢN BÁC** |

### 2.4 I4 Zombie — gate (b) lượt thứ 6: KHỚP toàn bộ

Script `recount-i4b.py` (code viết mới, đọc trực tiếp
`frame-parity-results.json` + baseline `round95-w3`):

| Số | I4 báo | I9 tính lại | Kết luận |
|---|---|---|---|
| Seek-across | 23/23, 0 missed-window | 23 actions, 0 missed-window | **KHỚP** |
| Zombie Δ | 0 ở 12/12 biên đo được | 12/23 đo được, Δ=0 ở 12/12, không đo được [2,4,…,22] | **KHỚP** |
| Capture cửa sổ clip lẻ | 0/12 (gộp y1: 0/24) | 0 | **KHỚP** |
| Kill latency trực tiếp (blur) | n=12, min 0,10 / median 0,20 / max 0,30 / mean 0,19 ms | n=12, 0,10 / 0,20 / 0,30 / 0,19; kill ở k lẻ [1,3,…,23], clipIds [c0,c2,…,c22] | **KHỚP** |
| Kill clip không-blur | killsDelta 0 ở 11/11 seek chẵn; tSetMs median 0,20 ms (n=11) | killsDelta lẻ 12 / chẵn 0; tSetMs lẻ n=12 min 0,10 med 0,20 max 0,30 mean 0,23; chẵn n=11 min 0,10 med 0,20 max 0,20 mean 0,16 | **KHỚP** |
| gstd D | 0/935 caps | 0/935 (định nghĩa D: 0,27 ≤ gstd/baseline ≤ 0,34, baseline W3 chr-noblur r1+r2) | **KHỚP** |
| E4a tick stale | 0/11 | I9 không tính lại độc lập tiêu chí stale của tick (xem §5.3) — số lấy từ analysis của I4, JSON có 448 tick, 11/23 seek có tick sau seek | **CHƯA TÍNH LẠI ĐỘC LẬP** |
| Gate (b) | 1 gap >300ms (408ms, skips=1, dph=1,27, spread=False, n_inside=7); 0 ca spread=True | draws=2000, đúng 1 gap 408ms, skips=1, dph=1,27, spread=False, n_inside=7; 0 ca held | **KHỚP** |
| state100 mật độ thực tế | n=825, gap median 56 / p90 119 / max 385 ms | 825 mẫu, median 56 / p90 119 / max 385 | **KHỚP** |
| Build identity | mtimeChanged=false, md5 ced42efd trước=sau | JSON `mtimeBefore`/`mtimeAfter` cùng md5, `mtimeChangedMidRun=false` | **KHỚP** |
| driftConfirmSkips / seekSkipTicks | 23 / 102 | 23 / 102 (JSON) | **KHỚP** |

### 2.5 I5 Blur B-band — Fisher gộp: KHỚP (số FINAL sau retry)

**Lưu ý quan trọng:** số I5 thay đổi giữa chừng do retry. Phân tích
tạm thời lúc 18:2x (chỉ r41c0: c0 74 (6), Fisher 1 phía 0,2639) đã
bị thay bằng số FINAL sau retry. I9 đã tính lại CẢ HAI bộ số bằng
script riêng (`recount-i5.py` cho bộ tạm, `recount-i5b.py` cho bộ
final) — cả hai đều khớp với analysis tương ứng tại thời điểm đó.
**LIMITS này chỉ dùng số FINAL** (analysis 18:38Z, 6 lượt):

| Số (FINAL) | I5 báo | I9 tính lại | Kết luận |
|---|---|---|---|
| Tổng lượt | 67 cap thô / 58 dùng / 19 B-cap | 5+13+9+19+4+17=67; 5+11+7+17+4+14=58; B 2+3+3+3+0+8=19 | **KHỚP** |
| B theo clip | c0 11 (2 pair) / c1 5 (1) / c2 3 (1) | đúng từng lượt trong analysis (r41c0 2(1), r41 1/1/1, r42c0 3(0), r42 2/1/0, r43c0 0, r43 3/3/2) | **KHỚP** |
| Gộp F6+G7+H4+I5 | c0 7/83 (8,4%) vs c2 3/57 (5,3%) | 72+11=83 (5+2=7); 54+3=57 (2+1=3) | **KHỚP** |
| Fisher 1 phía (c0>c2) | p=0,3584 — KHÔNG ĐẠT bar | 0,3584 (tính từ [[7,76],[3,54]] bằng math.comb) | **KHỚP** |
| Fisher 2 phía | p=0,5282 | 0,5282 | **KHỚP** |
| Newcombe 95% CI hiệu số | [−6,9pp, +11,9pp] | [−6,9pp, +11,9pp] (Wilson + Newcombe viết mới) | **KHỚP** |
| Heterogeneity | c0-only 5/44 vs 3-clip 2/39, p=0,4388; I5 riêng 1/5 vs 1/6, p=1,0 | 0,4388; 1,0 | **KHỚP** |
| D floor gộp | 0/2429; Fisher vs pre 28/1547 p=2,86e-12; CI trên 0,124% | 0/2429 (2371+58); 2,857e-12; 3/2429 = 0,124% | **KHỚP** |
| Còn thiếu tới ~115/nhóm | c0 32 / c2 58 | 115−83=32; 115−57=58 | **KHỚP** |

- Sự cố ENOSPC đợt 1 (5/6 lượt exit=2, vite crash
  `ENOSPC: System limit for number of file watchers reached`,
  `max_user_watches=63747`) đã kiểm trong driver log: r43 exit=2,
  `MISSING chr-blur-r43 results.json`, driver retry chạy lại 5 lượt
  lỗi + giữ r41c0 — đúng như LIMITS §0 mô tả. Đây là lỗi hạ tầng,
  không phải lỗi probe/code; I9 không chạy lại probe.

### 2.6 I6 Harness — G4 flake dưới tải nặng: KHỚP toàn bộ

Script `recount-i6.py` + đọc trực tiếp report JSON
`e1-run11..17/c77e1-headed-report.json` và `analyze-i6.txt`:

| Số | I6 báo | I9 tính lại | Kết luận |
|---|---|---|---|
| E1 hoàn thành tới G4 | 6/7 (run11–13, 15–17); run14 chết trước G4, exit 2, không report | 6 report JSON có pass 10/10; run14 không có JSON | **KHỚP** |
| G4 | 6/6 tap=true, R=0,51; 0 flake | analyze-i6.txt: 6 lần gap/tap/R khớp; probe lines run15 cho thấy hook false tới waitIdle t+2,0s rồi lật true, G4 vẫn PASS | **KHỚP** |
| G3→G4 gap | 4,00–8,30s, trung vị 6,79s | 4,005 / 6,773 / 7,994 / 8,301 / 6,796 / 4,385 → median 6,796 | **KHỚP** |
| Tỉ lệ gộp | 2/34 = 5,9%, Wilson 95% ~2–19% (trước 2/28 = 7,1%, ~2–23%) | Wilson 2/34 = [1,6%, 19,1%]; 2/28 = [2,0%, 22,6%] | **KHỚP** |
| P(0/6 \| tỉ lệ thật 1/10) | ≈53% | 0,9^6 = 0,531 | **KHỚP** |
| G5 run1 mean/median từng lần | 1,13/1,19; 1,05/1,03; 1,21/1,08; 1,48/1,22; 1,51/1,25; 0,99/0,84 — PASS | đúng từng lần trong report JSON (`g5Verdict.run1.mean/median`, verdict PASS) | **KHỚP** |
| Frozen slot | run12 slot 6, run15 slot 2 | report JSON `frozenSlots`: run12 [6], run15 [2], còn lại [] | **KHỚP** |
| Keydown gộp | 55 lần / 737 slot / 1474 toggle, max 2197ms, 0 retry/fallback/abort | 22+18+9+6=55; 319+242+110+66=737; 638+484+220+132=1474; max 2197ms xác nhận trực tiếp trong report JSON run15 (`fpsSlots[1].pauseWaitMs=2197`) và trong run log | **KHỚP** |
| Checkbox | 114 lần BẤM, 0 KHÔNG-bấm | 35 dòng `G4-probe` trên 6 lần hoàn thành (5+5+5+8+6+6) — I9 đếm từ analyze-i6.txt; số 114 BẤM lấy từ run log, I9 không đếm lại từng dòng click (xem §5.3) | **KHỚP (G4-probe); 114 BẤM chưa đếm lại** |
| Harness md5 | `ae6cd34a…` không đổi | md5 tại freeze: `ae6cd34a7dff3f6bda62199b5ab6c6fc` | **KHỚP** |
| Bar prereg "0 flake trên ≥7 lần tải nặng" | CHƯA ĐẠT (chỉ 6/7) | đúng — run14 chết trước G4 nên mẫu chỉ 6 | **KHỚP** |

- I6 KHÔNG chạy lại tsc/vite build (không đổi production code,
  theo tiền lệ G3/E8 §8.7) — I9 chạy thay trên cây gộp (§3, xanh).
- Độ lệch load1 (§6 của I6: load1 dao động 0,63–23,58 do VM 1,5 CPU
  chia sẻ throttle busy-loop; bằng chứng tải thật: pressure CPU
  avg300=50,27, thread 17–32, load5 4,29–13,01, fps slot ~1) — I9
  đã đọc §6 và thấy lập luận có bằng chứng đi kèm; không chạy lại
  phép đo tải. Kết quả đúng là "0/6 tải nặng", không phải "0/7".

### 2.7 I7 EPERM — probe #26 + mù #25 ĐÓNG HOÀN TOÀN: KHỚP toàn bộ

Kiểm trực tiếp từ log probe v2, heartbeat, file quét, poller H9:

| Số | I7 báo | I9 kiểm | Kết luận |
|---|---|---|---|
| Checklist P8 §2.3 | status DEAD/STALE (age 10.838s, last #25 14:39:40Z, boot 75697729) → once probe #26 ok=2 fail=0 (17:40:22Z, boot 63a52041) → status ALIVE (age 11s, n=26) | `eperm-probe-v2.log` đúng 70 dòng (trước lượt 67, +3 đúng checklist): dòng DEAD 17:40:18Z age 10838s, dòng `boot changed 75697729 -> 63a52041`, dòng probe #26 17:40:22Z ok=2 fail=0; heartbeat n=26, ts 17:40:22Z, boot 63a52041 | **KHỚP** |
| Reboot #34 lúc probe #26 | chưa xảy ra (boot 63a52041 từ 14:50:59Z) | `uptime -s` tại các poll của I9 đều 14:50:59Z tới 19:04Z | **KHỚP** |
| Mù #25: 14:39:40Z → 17:40:22Z (3h00'42"), đúng 1 reboot (#33) — ĐÓNG HOÀN TOÀN | đóng bằng loại trừ trực tiếp (poller H9 + uptime -s), không bằng sàn | Poller H9 (`round106-h9/poll.log`): 11 dòng poll — 2 poll trước #33 (14:40:20Z, 14:50:20Z, boot 14:31:52) + 9 poll sau #33 (14:52:45Z → 16:12:47Z, boot 14:50:59), timeout 16:12:48Z — đúng như I7 mô tả; đuôi 16:49:28Z → 17:40:22Z đóng bằng `uptime -s` đo trực tiếp lúc probe #26 (boot 63a52041 từ 14:50:59Z) — lập luận đúng: reboot trong đuôi sẽ đổi boot_id/uptime | **KHỚP** |
| Sóng EPERM trong mù #25 | 0 thật; 6 dòng "đã tắt" là dương tính giả đã biết | I9 không grep lại toàn bộ 78 log (xem §5.3) — nhưng đã kiểm mẫu: 0 dòng "vẫn bật"/"CẢNH BÁO"/"Operation not permitted" trong log probe v2 + run log I2; I7 ghi rõ đuôi 50'54" không observer vẫn **mù về sóng** (có thể chứa sóng ~16 phút) — kết luận "đóng về reboot, không đóng về sóng" là trung thực | **KHỚP (mẫu kiểm); không grep lại toàn bộ 78 log** |
| Quét writeFileSync | 506 dòng / 158 file; R7b 531/175; copies 25/17; chênh 0 lần thứ 13 | **Tính lại đầy đủ từ `files-*.bin` gốc** (grep -c từng file): NEWSTD (scope 2732, hitfiles 158, total 506); R7b (scope 12125, hitfiles 175, total 531); 506+25=531=R7b ✓; scan-meta.txt khớp đúng 3 số | **KHỚP** |
| RAM (birefnet) | 467.932 / 461.620 / 454.240 kB (~7,4% guard) | 3 mẫu ghi trong probe-notes; RAM tại freeze của I9 chỉ 632 MB avail — birefnet vẫn không thể chạy | **KHỚP** |
| Dự báo #34 | điểm ~16:51:58Z trượt ít nhất +48'24"; dải tới 18:05:07Z | Tới 19:04:11Z (O8 xong) vẫn boot #33 — dải đã bị phá (xem §4) | **KHỚP + CẬP NHẬT: dải bị phá** |

### 2.8 I8 Blur cụm A — E6 vẫn mở, harmonic bị bác: KHỚP toàn bộ

Kiểm trực tiếp từ `analyze107i8*.txt/.json`, `verify107i8-f1.txt`,
`inspect107i8-ticks.txt`, `events107i8-detail.txt`:

| Số | I8 báo | I9 kiểm | Kết luận |
|---|---|---|---|
| Dữ liệu thu được | 35 cap / 19 blendTick (r43 15/8, r44 16/11, noblur 4/0) | analysis: noblur 4 caps 0 ticks; r43 15/8; r44 16/11 | **KHỚP** |
| Sự kiện blend phân biệt | 2 (cần ≥8); trong band A' 0; label gap 6: 1 | analysis: 1+1=2 sự kiện; band A' 0; label gap 6 (mọi band) 1 | **KHỚP** |
| F1 feasibility | second-nearest MAD min/med/max 30,9/46,6/61,5; 90/90 ≥30 | verify107i8-f1.txt: đúng 3 số, 90/90, band A' [0,36, 0,48] | **KHỚP** |
| Strip live | 19/19 tick nhận diện; MAD tới frame đúng 0,3–0,6, tới frame nhì 36–59 | inspect ticks: mad_pres 0,3–0,6 / 36,6–58,9 trên 19 tick | **KHỚP** |
| Nhãn lệch dưới tải | presented content − nhãn: trung vị −4 (dải −1..−6, 2 ca −14/−15); ghost +0..+4 (trung vị +3); trong ±1 chỉ 2/19 | offsets từ inspect: −2,−3,−5,−15,−4,−2,−5,−5 / −2,−5,−4,−2,−1,−1,−2,−6,−5,−5,−14 → phân bố −1:2, −2:5, −3:1, −4:2, −5:6, −6:1, −14:1, −15:1; trung vị −4; trong ±1: 2/19; ghost offsets +0..+4, trung vị +3 (vd (14→18)=+4, (28→30)=+2, (48→51)=+3, (22→22)=0) | **KHỚP** |
| Sự kiện E1/E2 | E1 g_live 1,006 vs pred 1,000; E2 g_live 0,781 vs pred đều 0,757 (Δ0,024) vs H-alt 0,724 (Δ0,057) | events107i8-detail.txt: đúng từng số | **KHỚP** |
| Harmonic bị bác | triple liên tiếp chỉ ≈0,333 (49/75) hoặc ≈0,745 (26/75), 0/75 trong [0,40, 0,50], bền qua BILINEAR/NEAREST/full-res | analyze107i8-c.txt: [49,0,0,0,0,0,26,0] cả 3 filter, 0 trong [0,40,0,50] | **KHỚP** |
| Quét bộ 3-frame cho 12 ca A | 0 bộ nào vào [0,40, 0,50] (0/12) | đúng 12 ca, mỗi ca 0 bộ | **KHỚP** |
| Lệch g triple +0,029 | union 48 sự kiện; thuần n=43: g_live 0,625 vs g_pred 0,596 → +0,029; pad-clone n=5: 0,769 vs 0,741 → +0,028 | analyze107i8-a/b.txt: union 48 (H4 48 + G7-mới 0); thuần 0,625 (med 0,624, dải 0,614–0,640) vs 0,596 | **KHỚP** |
| H-alt-weights w=(0,20, 0,35, 0,45) | 11/11 ca A labels-true vào band; dự đoán g triple noise 0,621 (đo 0,625) | analyze107i8-c.txt: w=(0,2, 0,35, 0,45) cho 11 ca vào band, g noise 0,621 | **KHỚP** |
| Stripes thuần second-nearest | med 0,00, 90/90 <30 (khớp H4) | analyze107i8-a.txt: 0,00/0,00/0,08; k=24 MAD 0,02 | **KHỚP** |

## 3. Kiểm chứng độc lập trên cây đóng băng (18:56:18Z)

Cây: preview.tsx `ced42efd785724c8c0d1b16fc32c7341`,
clicktest-77e1 `ae6cd34a7dff3f6bda62199b5ab6c6fc`, boot 63a52041,
RAM avail 632 MB. Script `round107-i9-verify.sh` (dựa trên
`round106-h9-verify.sh`, 27 mục) + `round107-i9-o8.sh`. Log:
`hidden_files/round107-i9-suites.log` và `round107-i9-o8.log`.

| Mục | Kết quả |
|---|---|
| tsc web | exit 0 (0 lỗi) |
| tsc desktop | exit 0 (0 lỗi) |
| vite build | PASS 7,48s (290 modules) |
| playheadHold90R2 (hold) | 75/75 ✓ |
| playheadPacing54K9 (pacing) | 19/19 ✓ |
| previewEngine.test.ts | 27/27 ✓ |
| seek | 21 ✓ |
| seekSkipRender86N3 | 9 ✓ |
| previewLoop50F2 | 20 passed |
| ghostBlend.probe.test.ts | 15/15 ✓ |
| rvfcClipWindow102D3 | 21 ✓ |
| driftConfirmSkip103E4 | 12 ✓ |
| css60 | 60/60 PASS |
| css61 | 60/60 PASS |
| P7 (i18nAudit59P7) | 8/8 ✓ |
| orphans (binOrphan60Q7) | 17/17 ✓ |
| r6 i18n check | PASS (vi=2767 en=2767 key) |
| U4 failfast | 141 pass, 0 fail |
| media-tests | blobPrefetch 25 ✓, captureThumb 2 ✓, retryPlay 7 ✓ |
| media-retry96X3 | 7 ✓ |
| media-watchdog96X3 | 9 ✓ |
| deint-verdict / 100b7 / armHeld99a3 / vite-diagnosis-regex | fail 0 (node --test) |
| xvfb-lock | 8 ✓ |
| test-preview-engine.sh | **354 assertions pass** |
| **O8 Chromium** | **21/21 pass, 0 fail, exit 0** (19:02:20–19:03:17Z; S7 Δx mask 0,112, bóng 0,113, kỳ vọng 0,112) |
| **O8 WebKit** | **21/21 pass, 0 fail, exit 0** (19:03:2x–19:04:11Z; S7 Δx mask 0,194, bóng 0,197, kỳ vọng 0,194) |

- Tổng: **27/27 mục suite exit 0**, 0 dòng `not ok`, 0 `✗` trong
  toàn bộ log. 6 marker "FAIL" mà grep thô bắt được đều là tên test
  case hoặc dòng tóm tắt "PASS 2 FAIL 0" — không phải lỗi (đã kiểm
  từng dòng).
- O8 fixture đã copy TRƯỚC khi chạy (ball md5 `6df873f7…` khớp H9)
  — không lặp lỗi setup exit=2 của H9 đợt 106.
- md5 preview.tsx sau O8 (19:05:04Z) vẫn `ced42efd…` — cây không
  đổi trong suốt quá trình kiểm chứng.

## 4. Reboot #34 — dải dự báo bị phá lần đầu (ghi cho probe #27)

- Boot #33 (14:50:59Z) ổn định suốt đợt 107: từ spawn 17:35Z tới
  O8 xong 19:04:11Z (hơn 4h13' uptime liên tục, không reboot).
- Dự báo H7 (#34 ~16:51:58Z, dải 15:10:06Z–18:05:07Z): điểm trượt
  ít nhất +48'24" lúc probe #26 (I7 đã ghi); tới 18:05:07Z vẫn
  chưa xảy ra; tới 19:04:11Z vẫn chưa xảy ra — **gap #33→#34 nay
  >3h14'08" (trần cũ), lần đầu tiên dải sàn–trần bị phá**.
  Sàn 19'07" (#32→#33) vẫn đứng (chưa có gap mới nào ngắn hơn để
  phá sàn). Chu kỳ trung bình ~2h01'/lần (33 lần/~66h32'49") nay
  không còn mô tả được khoảng hiện tại.
- Hệ quả cho các mù đã đóng bằng sàn: mù #23 vẫn đóng (17'37" và
  31'47" đều < 2×19'07"); mù #22 vẫn đóng trên hoạt động nhưng cửa
  sổ lý thuyết ≤78s — cả hai vẫn chờ user quyết như trước, I9
  không tự quyết. Mù #25 ĐÓNG HOÀN TOÀN (I7, I9 đã kiểm lại §2.7).
  Mù #26 bắt đầu từ probe #26 (17:40:22Z) — probe #27 đối chiếu
  từ mốc này, trên boot 63a52041 (#33, số thứ tự tạm thời vì mù #24).
- I9 không dự báo lại #34/#35 (độ tin cậy dự báo điểm đã thấp qua
  3 lượt liên tiếp — I7 §2.5); để probe #27 cập nhật.

## 5. Giới hạn của chính I9 — những gì KHÔNG kiểm lại độc lập

1. **E4a tick stale của I4 (0/11):** I9 chỉ kiểm JSON có 448 tick
   và 11/23 seek có tick sau seek; tiêu chí "stale" của tick (ph
   nội suy so với kỳ vọng) không tính lại độc lập. Số này lấy từ
   analysis của I4 — tin cậy ở mức "đã kiểm đầu vào, chưa kiểm
   phép tính".
2. **Sóng EPERM trong mù #25 (I7):** I9 không grep lại toàn bộ 78
   log có mtime trong mù; chỉ kiểm mẫu (log probe v2 + run log I2:
   0 hit "vẫn bật"/"CẢNH BÁO"/"Operation not permitted"). Kết luận
   "0 sóng thật" của I7 được chấp nhận ở mức mẫu kiểm + lập luận
   đuôi-mù-về-sóng đã ghi rõ trong LIMITS I7 §2.4.
3. **114 lần BẤM checkbox của I6:** I9 đếm được 35 dòng `G4-probe`
   (khớp LIMITS) nhưng không đếm lại từng lần click BẤM/KHÔNG-bấm
   trong run log. Số 114 lấy từ analyze của I6.
4. **Nguyên nhân lỗi H2 (I3):** I9 không chạy lại probe WebKit để
   tái hiện crash thiếu `GST_PLUGIN_PATH` (máy lúc đó đang bận +
   không cần thiết — bằng chứng chẩn đoán trong LIMITS I3 §1–§2
   đầy đủ và nhất quán: diag `none` vẫn chết, minprobe chết ở gán
   src, stderr MiniBrowser, hết crash khi set biến).
5. **Số tạm thời của I5 (pre-retry):** I9 đã tính lại bộ số tạm
   (p=0,2639, c0 74 (6)) và khớp với analysis lúc đó — nhưng bộ số
   này đã bị thay bằng số FINAL sau retry; LIMITS này chỉ dùng số
   FINAL (§2.5). Ghi rõ để khỏi ai trích nhầm p=0,2639.
6. **Lần tính rAF gap đầu tiên của I9 (I1):** tính trên toàn bộ
   tick cho 20,1/46,7 — sai cửa sổ; tính lại đúng cửa sổ
   hậu flip+2000ms thì khớp 19,5/34,1. Lỗi ở phía I9, không phải
   ở I1; đã sửa trong script recount và ghi rõ cửa sổ ở §2.1.
7. **Lần chạy `recount-i4.py` đầu tiên** in toàn bộ mảng pixel
   của 1 cap (lãng phí output) — đã bỏ, thay bằng `recount-i4b.py`
   gọn. Không ảnh hưởng kết quả.
8. **File `files-copies.txt` của I7 (9391 dòng)** chưa đối chiếu
   hết nội dung (đây là danh sách scope, không phải hit count) —
   hit count copies 25/17 đã tính lại đầy đủ từ `files-copies.bin`
   qua công thức 506+25=531=R7b (§2.7).
9. **I6 không chạy lại tsc/vite build** (theo tiền lệ, không đổi
   production) — I9 đã chạy thay trên cây gộp (§3, xanh).
10. **O8 chỉ chạy 1 lần mỗi engine** (không lặp lại như một số đợt
    trước) — đủ theo bar 21/21, không đo thêm độ ổn định lặp lại.

## 6. File / batch stage (KHÔNG push)

- LIMITS này: `docs/PHASE9_ROUND107_I9_VERIFY_LIMITS.md`.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round107-i9-verify.txt`
  (NUL-delimited, 1 entry: LIMITS này; đã đọc lại xác nhận).
  Log poll + script recount + log suites/O8 ở lại
  `hidden_files/round107-i9/` (ngoài repo, không stage — theo tiền
  lệ H9 đợt 106: chỉ LIMITS vào batch push).
- Đợt 107 đã kiểm read-back đầy đủ 8 batch: **8 batch / 18 entry /
  18 file duy nhất**, mọi entry tồn tại và là text, 0 binary,
  0 workflow, 0 trùng với đợt 106.
- **Tổng chờ push sau đợt 107 (chưa push): 18 batch / 40 entry /
  40 file duy nhất** (đợt 106: 9/21/21 + đợt 107: 8/18/18 + I9:
  1/1/1) + 1 file oversize `benchmarks/results/webkit-blob-flaky-96x3.json`
  (6.370.678 B, vượt giới hạn mỗi lần đẩy). HEAD vẫn a7308ee9.
  KHÔNG push.

## 7. Nợ mở cho đợt sau (tổng hợp từ 8 LIMITS — parent gộp, I9 chỉ liệt kê)

1. **G1 deinterlace: vẫn mở, chờ user quyết metric (G5/M2)** —
   I1 đã đóng nợ "đo lại flip lúc máy yên" (C3 81,6% đạt bar; land
   F8 không bị lật) nhưng verdict G1 cuối cùng vẫn chờ user.
2. **Mù #22 / #24 / #21 / reboot #16: chờ user quyết** (mức tin
   cậy, "đóng có điều kiện" hay mở lại). Mù #25 ĐÓNG HOÀN TOÀN
   (mới). Mù #26 bắt đầu 17:40:22Z.
3. **Re-arm:** A/B RAM cao xong 2/2 lượt hợp lệ (I2) — RAM bị loại
   theo tiêu chí nhưng decay hạ độ tin cậy; bước tiếp theo là A/B
   tắt E4 (I2 §8). Giả thuyết cửa sổ ~5s (freeze-tail 4,7–5,0s
   bất biến qua 9 lượt) để đợt sau kiểm.
4. **2 MiB queue2:** đã chứng minh queue2 có trong pipeline
   (ring 2097152, sau typefind trước parsebin) nhưng chưa chứng
   minh nhân quả splice — cần run bogus + đổi `max-size-bytes`
   (I3 §8). H2C8 chưa chạy. Mitigation `.mp4` trên đường blob vẫn mở.
5. **Zombie gate (b): vẫn chưa quan sát được (lượt thứ 6).**
   Kill trực tiếp ĐÓNG cho blur (median 0,20 ms, lặp lại 2 lượt)
   và không-blur (không có kill entry theo thiết kế). Cần lượt
   chuyên đo freeze + sampler ngoài main thread (I4 §5).
6. **Blur B-band c0: vẫn mở** — Fisher gộp p=0,3584; còn thiếu
   c0 32 / c2 58 B-cap tới ~115/nhóm. Đợt sau cần máy yên hơn
   (I5 chứng minh 8–10 luồng song song làm probe đói mẫu).
   D floor 0/2429 vững.
7. **Blur cụm A / E6: vẫn mở** — stimulus + phương pháp sẵn sàng
   (F1 đạt, strip live 19/19), chỉ thiếu mẫu do tải; chạy lại
   probe stripes-code khi máy yên (load1 <5, hoãn lượt thay vì
   phát dưới tải nặng). Harmonic bị bác; H-alt-weights là ứng viên
   post-hoc chưa kiểm; lệch g triple +0,029 vẫn mở.
8. **G4 flake: vẫn mở** — 0/6 mới dưới tải nặng, gộp 2/34 = 5,9%
   (Wilson ~2–19%); cần ≥7 lần hoàn thành tới G4 để đạt bar
   prereg; keydown kỷ lục mới 2197ms, biên an toàn còn 2,3×.
9. **Hạ tầng:** giới hạn inotify watchers (63747) làm mất 5/6 lượt
   I5 đợt 1 (ENOSPC) — đợt sau tránh nhiều vite dev server song
   song hoặc tăng `fs.inotify.max_user_watches` (cần quyền hệ thống).
10. **Nợ đứng yên:** birefnet 0 lần thành công (RAM tại freeze chỉ
    632 MB avail, dưới guard 6 GB); TTS 39 CẤM kiểm lại;
    ci-security.yml 403 chờ user; release gate giữ nguyên
    (không release/tag cho đến khi ngang/hơn CapCut).
