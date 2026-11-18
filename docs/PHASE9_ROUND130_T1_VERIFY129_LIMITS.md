# LIMITS — Phase 9 đợt 130 T1: Kiểm chứng độc lập đợt 129 (đếm cuối + cờ + cây + lượt yên #7 + mù #48 + T8 + headroom + scheduler + GAP §58)

**Ngày:** 17/11/2026. **Luồng:** T1, đợt 130 vòng lặp Phase 9 (lượt cron
18:35 +07 17/11/2026). **Trạng thái:** **KIỂM CHỨNG XONG — mọi claim lớn
đợt 129 PASS; tìm thêm 6 sai số/điểm nhỏ mới (F-130-1 → F-130-6), không đổi
verdict nào.**
**Không đo mới, không probe đo, không chạy suite nặng, không sửa
production, không sửa file của đợt 129 — chỉ đọc + tính lại từ dữ liệu
thô bằng code riêng.** Boot lúc làm việc: #77 (btime 10:56:31Z,
boot_id `86538084…` — boot mới sau khi đợt 129 đóng; T5/T6/T7/T9 đợt 130
đã ghi nhận). RAM khả dụng ~1.000–2.400 MB trong phiên — dưới guard
birefnet 6 GB, không thử birefnet. Không kiểm lại TTS 39. Không push.

## 0. Phương pháp (độc lập, không tin handoff mù)

- Đếm cuối: tính lại bằng code riêng của T1 (không dùng
  `count-final.py` của T10 — chỉ đối chiếu sau khi đếm xong): đọc mọi
  file `phase9-roundNNN-*.txt` trong `repo-1-push/paths-loop/`, tách
  entry NUL, dedup toàn cục theo đường dẫn tương đối; lũy kế tính
  trực tiếp trên đĩa, KHÔNG cộng số học.
- Cờ `.done`: `stat` trực tiếp từng file trong `hidden_files/`,
  đối chiếu mtime với LIMITS gộp §10.1.
- Cây: `md5sum` trực tiếp `apps/web/src/preview.tsx` +
  `apps/web/src/media.ts`.
- Suite/O8: đọc log gốc `hidden_files/round129-t10/` (suites log +
  `t10-o8.log` + thư mục `o8-chromium/`/`o8-webkit/`), đếm dòng
  `exit=0` và dòng kết quả.
- Lượt yên #7: đọc JSON gốc T4 (`preview-b-f3-flip-webkit-t4-attempt1.json`)
  + output analyzer gốc (`analyze-t4-attempt1-{tickcost,labellag,lag5,
  skiplatest}.txt`, `classb-t4-attempt1.txt`, `load-mid-t4-attempt1.log`,
  `chain-t4.log`).
- Mù #48: đọc file gốc của T2 (`hidden_files/round129-t2/`):
  `status1/once/status2.txt` + `.exit`, `blind48-gaps.txt`,
  `blind48-investigate.log`, `blind48-hidden_files.txt` (212 dòng),
  `blind48-repo-1.txt` (10 dòng); log probe v2
  `hidden_files/eperm-probe-v2.log` (hiện 139 dòng — xem §2).
- T5: cờ `round129-t5/POSTBOOT_PASS` + `POSTBOOT_PASS.b75-stale`,
  watcher log `t5-wait-replay-b76.log` (poll 9 TRIGGER), file quyết
  định repair, log headroom mở/cuối; chạy lại analyzer histogram
  của T5 (`c2-histogram-r128.py`, code đã lưu) trên JSON T4 đợt 129
  để tính lại histogram lượt yên #7 lần 3.
- T3: `md5sum` + `wc -l` probe mới trên đĩa; đọc partial JSON
  dry-run (`round129-t3/dryrun/partial-test{,6}.json`) trực tiếp.
- T8: report JSON 3 harness trên boot #76 + run log + summary;
  cờ POSTBOOT_PASS đã kiểm ở mục T5.
- T9: đọc log đo gốc `round129-t9/headroom-measure-{1,2}.log`.
- T7: **truy vấn lại `cron.runs` trực tiếp** (job `heartbeat` +
  `deterministic-doctor`, limit=15) — đối chiếu từng run_id, giờ
  hẹn, giờ bắt đầu, jitter với NOTES.md của T7.
- T6: `wc -l` + đếm loại event bằng regex riêng trên
  `vite-lock-v2.log`; đọc `cooldown-now.txt` + `prune-deleted.txt`.
- GAP §58: đọc trực tiếp `PHASE9_GAP_ANALYSIS.md` dòng 1682 trở đi.
- Đã đọc trước: `docs/PHASE9_ROUND129_LIMITS.md` toàn bộ (§§0–12),
  `docs/PHASE9_ROUND129_T{1..9}_*_LIMITS.md` toàn bộ.

## 1. Đếm cuối đợt 129 + lũy kế: PASS — 10/13/13, lũy kế 187/486/437

Tính lại độc lập bằng code riêng (phương pháp §10.2 LIMITS gộp):

| Phạm vi | Đếm lại | Công bố | Kết quả |
|---|---|---|---|
| Đợt 129 (gồm closing) | **10 batch / 13 entry / 13 file duy nhất** | 10/13/13 | ✓ |
| Lũy kế 111–128 tái kiểm | **177 batch / 473 entry / 427 file duy nhất** | 177/473/427 | ✓ |
| Lũy kế 111–129 | **187 batch / 486 entry / 437 file duy nhất** | 187/486/437 | ✓ |

- Đếm theo từng đợt 111–129 khớp từng đợt (đợt 128: 10/14/14;
  đợt 129: 10/13/13; các đợt trước khớp số đã công bố).
- File đợt 129 trùng với 111–128 (3 file): `PHASE9_GAP_ANALYSIS.md` +
  `apps/web/scripts/vcut-webkit-postboot-check.sh` +
  `benchmarks/render/probe121t3-ghost-k7.webkit.mjs` ✓ (khớp §10.2).
- Script `count-final.py` của T10 đợt 129 đã sửa đúng F-129-2:
  `glob_no_closing()` loại `*-closing.txt` khỏi glob khi đếm "trước
  closing", cộng closing tay 1 lần duy nhất (đọc trực tiếp file,
  dòng 22–23 + 47–53). Chạy lại script cũ đợt 128 verbatim lúc này
  vẫn cho 178/475 (bẫy F-129-2) — đã kiểm bằng code riêng, không
  dùng script cũ làm số chính thức.
- Tất cả 13 đường dẫn đợt 129 đều tồn tại trên đĩa trong repo ✓
  (kiểm bằng đếm entry — mọi entry đều là đường dẫn đã có trong
  file paths; 11 file đợt 129 + LIMITS gộp + GAP đều đọc được).

## 2. Cờ .done 9/9 + t10 + cây không đổi: PASS

- **Cờ 9/9 đủ trên đĩa**, mtime khớp từng giây với LIMITS gộp §10.1:
  T1 08:47:44Z, T2 08:51:53Z, T3 09:42:13Z, T4 09:01:41Z,
  T5 09:35:49Z, T6 08:50:38Z, T7 08:43:13Z, T8 09:47:28Z,
  T9 08:41:51Z. Cờ `round129-t10.done` 10:02:09Z ✓.
  (Cờ `round129-t4-done` — cờ mở leg T8 — cũng có trên đĩa.)
- **md5 cây:** `preview.tsx 03bf029f09b8890b285eacc10a02172b`,
  `media.ts 2c384ed13703809d5e999311147745e7` — khớp baseline, cây
  không đổi trong đợt 129 ✓.
- T10 đóng trong phiên 10:02Z 17/11, trước hạn cứng 14:35Z ✓.

## 3. Suite 27/27 + O8 Chromium 21/21 + WebKit 21/21: PASS — WebKit FULL PASS lần thứ bảy liên tiếp

- Suite log `round129-t10/round129-t10-suites.log` (867 dòng):
  **27 dòng `exit=0`**, dòng cuối `=== ALL DONE 2026-11-17T09:56:28Z
  boot 88f62ae6… ===`; script verify ghi "27 items", chạy
  09:49:38–09:56:28Z, RAMavail 943 MB lúc bắt đầu ✓.
- O8 log `t10-o8.log`: `KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail,
  0 note`, `O8-Chromium exit=0 2026-11-17T09:57:37Z` ✓;
  `KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass, 0 fail, 0 note`,
  `O8-WebKit exit=0 2026-11-17T09:58:53Z boot 88f62ae6…` ✓.
- Chuỗi "lần thứ bảy": LIMITS gộp đợt 128 §0 + §10 ghi "lần thứ
  sáu liên tiếp (đợt 123–128)" — đã đối chiếu, đợt 129 là lần
  thứ bảy, chuỗi 123–129 đứng ✓.
- Lock lúc đóng: log lock hiện **796 dòng** (T10 ghi 796 lúc đóng ✓);
  đếm lại bằng regex riêng: TICKET 244 / ACQUIRED 235 / RELEASED
  230 / COOLDOWN 72 / TIMEOUT 8 / STALE-LOCK 6 / STALE-TICKET 1,
  tổng 796 — mọi dòng đều thuộc 1 trong 7 loại. 33 dòng mới từ
  snapshot 763 của T6: TICKET +10 / ACQUIRED +10 / RELEASED +9 /
  COOLDOWN +3 / STALE-LOCK +1 — khớp đúng số T6 đợt 130 đã đối
  chiếu độc lập trong log vòng lặp (1 acquire của t8-round129
  mất theo reboot, dọn bằng STALE-LOCK đúng luật boot đổi).
  COOLDOWN event 72 vs 71 file queue lúc đóng: chênh 1 do T4 tái
  dùng file cooldown-t4 đã có (+0 net) — T10 đã ghi rõ, không
  mâu thuẫn.

## 4. T4 lượt yên WebKit #7 lần 3: PASS — attempt1 20/20, median 54,0 ms, lớp B 5/5

- JSON gốc `preview-b-f3-flip-webkit-t4-attempt1.json`:
  `passes=20`, `pageErrs=[]`; `chain-t4.log`: `probe_exit=0`,
  `run-attempt exit=0` 08:54:56Z ✓.
- Analyzer gốc `analyze-t4-attempt1-tickcost.txt`: tickCost total
  **n=540 median=54,0** p90=81,0 max=130 min=31; hậu flip+2000ms
  median 53,0 (n=388) ✓.
- Lớp B: `classb-t4-attempt1.txt` ghi `LOP-B-TONG: DAT 5/5`
  (B1–B5 đều DAT) ✓. Đối chiếu log sampler thô
  `load-mid-t4-attempt1.log`: **11 mẫu**, load1 max **1,48**,
  RAM min **1315 MB**, load5 cuối **0,93** — khớp từng số với
  LIMITS T4 §3 ✓.
- **(c2) +1f tái hiện 2 lần — khớp từng seq:**
  `analyze-t4-attempt1-labellag.txt` skp=0: (c2) n=2,
  `[(136, 16, 15, 1), (181, 36, 35, 1)]` ✓; lag ≥+5f: 0 ở cả
  2 skp ✓; F6' 100%/100% (skiplatest) ✓.
- Chỉ chạy 1 attempt là đúng prereg S5 (verdict đã chốt) — xem
  F-130-3 về câu "attempt2 bị giết" trong file T3.
- 6 lượt yên xác nhận 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 ms,
  trung bình 47,8 ms: (49,5+40,0+52,0+47,5+44,0+54,0)/6 = 287/6
  = 47,83 → **47,8 ms** ✓ (số học đúng).

## 5. T5 hạ tầng + (c2): PASS — reboot giữa lượt, §8.2(B) kích hoạt lần đầu, repair thành công, histogram tính lại khớp

### 5.1 Boot #75/#76 + cờ POSTBOOT_PASS

- Cờ `round129-t5/POSTBOOT_PASS` đọc trực tiếp:
  `boot_id=88f62ae6-a216-42a9-8a81-b36fd83ca019
  btime=2026-11-17T09:02:12Z pass_at=2026-11-17T09:32:15Z poll=28`
  ✓ — khớp LIMITS T5 §3.5 + T8 §3. Cờ cũ #75 đã lưu thành
  `POSTBOOT_PASS.b75-stale` ✓.
- Watcher log `t5-wait-replay-b76.log` poll 9 (09:13:06Z):
  `silent_s=600`, đủ 5 điều kiện (`c1_fail_fresh=yes
  c2a_no_proc=yes c2b_silent10m=yes c3_wait10m=yes c4_form=B(yes)
  c5_no_probe=yes`), **`TRIGGER=YES`** ✓; poll 10 xác nhận
  silent 661 s, TRIGGER=YES ✓. File quyết định repair
  `t5-repair-decision-b76.md` ghi đủ 5/5 điều kiện trước khi
  chạy `--repair` ✓.
- Gap #74→#75 = 07:13:31Z − 04:55:04Z = **8.307 s (2h18'27")** —
  tính lại bằng code, khớp T2 §2.2 ✓ (xem F-130-2 về số 6.507 s
  trong LIMITS gộp §6).
- Headroom T5 (đọc file gốc): mở 3.089 → cuối #75 3.078 → cuối
  #76 3.079 (STOP at i=3078 / i=3079, errno 28) ✓ — xem F-130-5
  về số 3.085 trong LIMITS gộp §5.

### 5.2 Histogram (c2) đợt 129 a1 — tính lại từ JSON thô: PASS

Chạy lại code analyzer của T5 (`c2-histogram-r128.py`, đã lưu
trong `round129-t5/`) trên JSON T4 đợt 129 — khớp **từng bin**
với bảng T5 §8.1 dòng đợt 129 a1:

| | Tính lại | T5 §8.1 |
|---|---|---|
| n ghost | 628 | 628 |
| hist chi tiết | {−13: 2, −12: 3, −10: 1, −2: 2, −1: 48, 0: 237, +1: 86, +2: 127, +3: 115, +4: 7} | giống hệt |
| 0 | 237 (37,7%) | 237 (37,7%) |
| +1/+2 | 213 (33,9%) | 213 (33,9%) |
| ≥+3 | 122 (19,4%) | 122 (19,4%) |
| <0 | 56 (8,9%) | 56 (8,9%) |
| snap−label median | 45 ms | 45 ms |
| label−floor(labelCt×30) | {0: 195, 1: 433} | {0: 195, 1: 433} (69%) |
| srcKind canvas | 628/628 (100%) | 100% |
| nomatch | 0 | 0 |

- Pool đợt 128 trong file output đã lưu `c2-histogram-r128.txt`
  cũng khớp bảng §8.1: a1 0=269 (49,8%), +1/+2=87 (16,1%);
  a2 0=215 (35,6%), +1/+2=185 (30,6%); pool 1144, 0=484
  (42,3%), +1/+2=272 (23,8%), ≥+3=218, <0=170, snap median 61,
  rawMs median 10, label-floor {0: 448, 1: 696} ✓.
- **Event 276–279 khoanh hẹp (§8.4) — đối chiếu JSON gốc đợt 126:**
  đọc `round126-t9/preview-b-f3-flip-webkit-t9-attempt2.json`,
  seq 276–279: label 17/19/22/25, labelCt 0,583985127 /
  0,666475292 / 0,756596613 / 0,847649183, **rawCt == labelCt
  chính xác từng bit ở mọi ghost**, srcKind="canvas",
  snapCt null ✓ — khớp bảng T5 §8.4 từng số.
- Xem F-130-4 (rawMs median đợt 129 a1 = 9 ms, không phải 10 ms).

## 6. T2 mù #48 + probe #48: PASS — A mở, B đóng, gap SPAN, CERT/FULL giữ

- File probe gốc: `once.txt` = `probe#48 boot=475406f6 ok=2
  fail=0`, exit 0; `status1.txt` DEAD/STALE (age 10.654 s,
  last #47 05:42:21Z, boot c279cf46), exit 1; `status2.txt`
  ALIVE (n=48, age 0 s), exit 0 ✓.
- Log probe v2 hiện **139 dòng** = 136 sau probe #48 + đúng
  3 dòng probe #49 đợt 130 (11:38:21Z, boot 86538084 — đã
  chạy trong lượt 130, không thuộc đợt 129). Dòng probe #47
  (dòng 133, 05:42:21Z) + probe #48 (dòng 136, 08:39:55Z)
  còn nguyên ✓ — khớp T1-129 §2.1 (133 + 3 = 136).
- Investigate log `blind48-investigate.log`: đoạn A **212 mốc**,
  lỗ lớn nhất **2.941 s** (06:24:30Z → 07:13:31Z, chính là
  đuôi A); đuôi A 2.941 s > sàn 1.147 s → **A MỞ, tối đa 2 ẩn**
  (floor(2.941/1.147) = 2) ✓. File `blind48-hidden_files.txt`
  = 212 dòng, `blind48-repo-1.txt` = 10 dòng ✓.
- Số học mù: span mù #48 05:42:21Z → 08:39:55Z = **10.654 s
  (2h57'34")** ✓; đoạn A 5.470 s; đuôi A 06:24:30Z → 07:13:31Z
  = **2.941 s** ✓ (tính lại bằng code).
- `blind48-gaps.txt`: **CERT41: n=41 mean 1h41'16" median
  1h54'16" p10 0h31'47" p90 2h24'11" sd 0h43'27" min 0h19'07"
  max 3h14'08"**; **FULL56: n=56 mean 1h48'02" median 1h54'38"
  p10 0h32'24" p90 2h44'14" sd 0h57'04" min 0h19'07" max
  5h43'18"** — khớp từng số với T2 §2.5 ✓. Gap #74→#75
  = 8.307 s VẪN SPAN (đoạn A mở) ✓; **CERT giữ n=41 / FULL
  giữ n=56** ✓.
- WFS lần 35: file đếm gốc `wfs-newstd.txt` = 242 dòng (242
  file), `wfs-r7b.txt` = 259 dòng, `wfs-copies.txt` = 17 dòng
  — khớp số T2 §2.7 (863 dòng / 242 file; R7b 888/259;
  copies 25/17; 863+25=888, chênh 0) ✓ (số dòng 863 là số
  match grep, kiểm bằng file đếm; không đếm lại toàn bộ
  grep lượt này vì không phải claim headline mới).
- Mù #49 MỚI MỞ từ probe #48 ✓ (probe #49 đã chạy 11:38:21Z
  trong lượt 130, boot mới 86538084, btime 10:56:31Z — ngoài
  phạm vi đợt 129, chỉ ghi nhận).

## 7. T3 probe mới: PASS — md5/dòng/dry-run khớp

- Probe trên đĩa: md5 `920a5122ca9573363eacf74b1b0d6625`,
  **997 dòng** ✓ (cũ `dccb8f4c…`, 942 dòng).
- Partial JSON dry-run đọc trực tiếp: `partial-test.json`
  (run 1, kill sau pass 2): `partial=true, passesDone=2`,
  **blendTick n=40**, tickCost n=49 ✓;
  `partial-test6.json` (run 2, kill sau pass 6):
  `partial=true, passesDone=6`, **blendTick n=106**,
  tickCost n=125 ✓.
- T4 đợt 129 vẫn dùng probe cũ: bản copy trong
  `round129-t4/` md5 `dccb8f4c…` (đã kiểm lúc đọc — file
  còn trong thư mục T4, khớp T3 §6) ✓.
- Xem F-130-3 (câu "T4 attempt2 bị giết" trong T3 §4.4/§8.1).

## 8. T8 harness 3/3 trên boot #76: PASS — sau cờ POSTBOOT_PASS mới

- Cờ POSTBOOT_PASS mới đã kiểm ở §5.1 (pass_at 09:32:15Z).
  Run log 3 harness đều bắt đầu SAU cờ: 84l10 09:35:13Z,
  85m4 09:37:05Z, 86n2 09:40:44Z ✓.
- Report JSON (boot #76): 84l10 `ok=true`,
  85m4 `ok=true`, 86n2 `ok=true`, `consoleErrs=[]` cả 3 ✓.
  Run log: 84l10 `exit=0` 09:36:47Z (E4 PASS); 85m4 P3 PASS
  (đồng bộ 2,8 s, 0 restart), P5 PASS (seek kẹt dài nhất
  3 mẫu ~0,6 s); 86n2 P5 PASS, P6 KHÔNG-KẸT ✓.
- Summary `smoke/run-webkit-summary.txt`: bắt đầu 09:35:07Z,
  boot `88f62ae6…`, RAM lúc bắt đầu 520 MB ✓.
- Mirror: `mirror-verify-b76.log` ghi `TOTAL ok=25 changed=0
  missing=0 n=25` ✓. Kiểm kê: `inventory129.txt` ghi
  `TOTAL candidate files: 238` ✓.
- P4 đồng bộ chậm (5–6,5 s) + P5 seek kẹt 3 mẫu: chỉ ghi
  nhận tương quan RAM thấp như T8 đã ghi — không kết luận
  nhân quả, không phải hồi quy (n=1) ✓.

## 9. T9 headroom + RAM: PASS — 3.079, chưa tới ngưỡng báo

- Log đo gốc: lần 1 `STOP at i=3086` (08:39:03Z); lần 2
  `STOP at i=3079` (08:40:47Z), errno=28 ✓ — **headroom
  3.079** đúng, hai lần đo khớp ±7 ✓.
- Số watch giữ ngoài cell: 63.747 − 3.079 = **60.668** ✓.
  Chuỗi dài hạn 4.438 → … → 3.212 → 3.079 (−133, −4,1%):
  (3.212−3.079)/3.212 = 4,14% ✓; còn cách ngưỡng báo
  < ~1.800 đúng **1.279** ✓; tỉ lệ 3.079/1.578 ≈ 1,95 ✓.
- RAM trong log đo: 908 MB (08:38:58Z) → 976 MB → 1.275 MB
  → 1.339 MB (08:40:47Z) — dải **908–1.339 MB** ✓, đều
  < guard 6.144 MB; birefnet KHÔNG chạy ✓.
- T5 đo headroom mở 3.089 (08:38Z) vs T9 3.086 (08:39:03Z):
  chênh 3, đo cách nhau ~1 phút — nhiễu probe bình thường,
  không phải mâu thuẫn (xem F-130-5).

## 10. T7 scheduler: PASS — đối chiếu trực tiếp cron.runs

Truy vấn lại `cron.runs` (limit=15) cho job `heartbeat` +
`deterministic-doctor`, đối chiếu từng run:

- **Heartbeat:** slot 13:50:50+07 (06:50:50Z) **VẮNG** trong
  danh sách — giữa 13:20:50 (run `0c8ebced`, started
  06:15:34Z, jitter −316 s) và 14:20:50 (run `f7aba292`,
  started 07:41:42Z, jitter **+1.252 s** = 07:41:42 −
  07:20:50) ✓. Slot 15:20:50 (run `6c362d8d`, started
  08:35:39Z, jitter **+889 s** = 08:35:39 − 08:20:50) ✓.
  Các slot có khác trong cửa đều jitter −316 s, run_id khớp
  NOTES.md (`1cace949`, `e5c639e7`) ✓.
- **Deterministic-doctor:** slot 14:00+07 và 15:00+07 **VẮNG**
  (danh sách nhảy 16:00 → 13:00); slot 13:00 run `307a5446`,
  jitter 0 s ✓. DR 12:00+07 vẫn vắng (danh sách nhảy 13:00 →
  11:00) ✓.
- Lũy kế: HB 38/154 → **39/160** (thiếu +1, mẫu số +6:
  kiểm toán 33+48+48+31 = 160 ✓); DR 43/148 → **45/151**
  (thiếu +2, mẫu số +3: 15+120+16 = 151 ✓). Tỉ lệ 39/160 =
  24,4%; 45/151 = 29,8% ✓.
- Caveat `history_may_be_truncated=true` vẫn đứng như T7 đã
  ghi — "thiếu" = thiếu trong lịch sử API trả về ✓.

## 11. T6 lock health + prune: PASS — số đếm lại khớp

- Lock log hiện 796 dòng (xem §3) — khớp T10 lúc đóng ✓.
  T6 đếm lúc 08:41–08:48Z: 763 dòng, 221/221 cặp — đã đối
  chiếu qua delta +33 dòng (xem §3), khớp.
- `cooldown-now.txt` = **69 dòng** (69 file / 966 B) ✓;
  `prune-deleted.txt` ghi `(prune deleted: none)` — prune
  lần 4 xóa 0 file ✓.
- File cũ nhất `cooldown-r4-round115`, mtime 14/11 18:38:25Z
  — đủ 7 ngày vào ~21/11 18:38Z (theo `find` ~22/11, xem
  quyết parent đợt 129 §12.3(e): GIỮ NGUYÊN phương pháp find,
  ghi rõ ngữ nghĩa ≥192h/≥72h) ✓.
- Đuôi sau mốc cuối đợt 128: 06:20:05Z → 07:13:31Z = **3.206 s
  (53'26")**, 2 quan sát muộn + 49'01" im lặng — tính lại
  bằng code, khớp T6 §8.2 ✓. (Xem F-130-2: đuôi này KHÔNG
  phải 6.507 s.)

## 12. GAP §58 + T1-129 (kiểm chứng đợt 128): PASS

- **GAP §58 đã viết:** `PHASE9_GAP_ANALYSIS.md` dòng 1682:
  `## 58. Cập nhật sau đợt 129 (17/11/2026 — … reboot
  #75→#76 GIỮA LUỘT lúc 09:02:12Z, lần đầu tiên; WebKit O8
  21/21 lần thứ bảy liên tiếp)` ✓. Nội dung §58 (dòng
  1683–1692) tóm tắt đúng 9 luồng + đếm cuối 187/486/437 ✓.
  File GAP hiện 274.912 B (267.489 B trước §58 — tăng 7.423 B
  sau khi thêm §58; §10.3 LIMITS gộp ghi "267.489 B trước §58
  (tăng sau khi thêm §58)" ✓).
- **T1-129 kiểm chứng đợt 128 (§1 LIMITS gộp):** đã đọc toàn
  bộ file `PHASE9_ROUND129_T1_VERIFY128_LIMITS.md`; đối
  chiếu điểm then chốt: log probe v2 dòng 133 (#47) + dòng
  136 (#48) còn nguyên (xem §6); F-129-1/2/3 đã ghi đúng
  (F-129-2 đã được sửa trong `count-final.py` đợt 129, xem
  §1). Không kiểm lại toàn bộ DEF v0.4/mù #47 lượt này
  (không phải claim mới của đợt 129; T1-129 đã kiểm và T10
  đã đóng) — ghi rõ giới hạn này.

## 13. Sai số / phát hiện mới (kiểu F-129 — không đổi verdict)

- **F-130-1 (mới, ghi nhận — lặp lại mẫu F-129-3): LIMITS gộp
  đợt 129 bị sửa sau khi đóng.** File hiện **53.775 B**,
  mtime **10:04:23Z** — lớn hơn 49.749 B mà chính §10.3 của
  nó ghi, và mtime sau cờ `round129-t10.done` (10:02:09Z).
  Nội dung thêm là §12.3 quyết parent (8 quyết (a)–(h),
  khớp brief parent giao đợt 130: instrumentation (c2) phê
  duyệt có giới hạn, lượt yên #8 phê duyệt chạy, R9/G1 vẫn
  chờ user, giữ phương pháp find -mtime, mù #49 giữ lịch
  probe thường lệ, đóng đợt 9/9 chấp nhận, §8.2(B) ghi nhận).
  Không phát hiện mâu thuẫn nội dung do lần sửa muộn này
  (mọi số §10 đối chiếu khớp §1–§9). Chỉ ghi nhận để lần
  sau khỏi nhầm kích thước/mtime khi đối chiếu — và để T10
  đợt sau ghi rõ: §12.3 quyết parent được thêm SAU khi đóng
  đợt là có chủ đích, không phải lỗi đóng sổ.
- **F-130-2 (mới, trong LIMITS gộp §6): giải thích sai nguồn
  gốc số 6.507 s.** §6 viết: "T6 tính 6.507 s = đuôi sau mốc
  cuối đợt 128 (06:20:05Z → 07:13:31Z, btime→btime danh
  nghĩa)". Tính lại: 06:20:05Z → 07:13:31Z = **3.206 s**
  (53'26") — đúng số đuôi T6 §8.2 ghi. Số 6.507 s
  (1h48'27") thực chất là **lỗi trừ nhẩm trong prereg T2**
  (T2 §4.2 đã thừa nhận: 2h18'27" tính nhầm thành 1h48'27"),
  không phải độ dài đuôi T6 tính. Ảnh hưởng KHÔNG ĐÁNG KỂ:
  số gap đúng 8.307 s vẫn đứng, gap vẫn SPAN, không đổi
  verdict nào. Đề xuất: LIMITS gộp đợt 130 ghi rõ 6.507 s
  là số prereg sai đã đính chính, không phải số đo của T6.
- **F-130-3 (mới, trong LIMITS T3 §4.4 + §8.1 và file quyết
  định repair của T5): câu "T4 attempt2 bị giết bởi reboot"
  là SAI.** T4 chỉ chạy **1 attempt** theo prereg S5 (verdict
  đã chốt với attempt1); cờ `round129-t4.done` 09:01:41Z,
  **trước reboot 09:02:12Z 31 giây**; không có attempt2 nào
  để bị giết. Lỗi đã được đính chính trong T5 LIMITS §8.5,
  T8 LIMITS §5 và LIMITS gộp §4 (đều viết đúng 1 attempt).
  Nguồn gốc lỗi: ghi chú đương thời của T5 lúc repair
  (`t5-repair-decision-b76.md` dòng "(5)… T4 attempt2 chet
  theo reboot") — T3 chép lại khi viết LIMITS. Ảnh hưởng
  KHÔNG ĐÁNG KỂ: không đổi verdict lượt yên #7 hay kết quả
  T8. Không sửa file đợt 129; chỉ ghi nhận để T3/T5 đợt sau
  khỏi chép lại câu này.
- **F-130-4 (mới, trong T5 §8.2): rawMs−labelMs median đợt
  129 a1 = 9 ms, không phải 10 ms.** T5 viết "rawMs−labelMs
  median vẫn 10 ms ở cả 3 run mới". Tính lại từ JSON thô
  bằng code T5 (xem §5.2): median chính xác **9,0 ms**
  (n=628). Hai run đợt 128 đúng 10 ms (theo output đã lưu).
  Sai 1 ms, ảnh hưởng KHÔNG ĐÁNG KỂ: kết luận "phần lớn lệch
  KHÔNG tích lũy ở bước vẽ rawUnit" vẫn đứng (9 ms hay 10 ms
  đều nhỏ so với snap−label 45 ms).
- **F-130-5 (mới, trong LIMITS gộp §5): headroom "3.085→3.079"
  không có nguồn.** Không luồng nào đo 3.085: T5 đo 3.089
  (mở) → 3.078 → 3.079; T9 đo 3.086 → 3.079. Số 3.085 có lẽ
  gõ nhầm 3.089 hoặc 3.086. Ảnh hưởng KHÔNG ĐÁNG KỂ: số cuối
  3.079 đúng, chưa tới ngưỡng báo, không đổi verdict.
- **F-130-6 (mới, ghi nhận — khung chết #74 chưa thống nhất
  loại bằng chứng):** T7 §2.4 dùng khung #74 chết
  **(06:25:09Z, 07:13:31Z]** (dựa vào `finished_at_utc` lượt
  vcut-build-loop đợt 128 trên `cron.runs`), hẹp hơn 39 s so
  với khung (06:24:30Z, 07:13:31Z] của T2/T6 (dựa vào mtime
  file cuối trên đĩa). T7 đã ghi rõ khác biệt này trong
  LIMITS của mình. Cả hai khung đều đúng theo loại bằng
  chứng của nó; LIMITS gộp dùng khung T2/T6. Chỉ ghi nhận để
  luồng sau không trộn hai loại bằng chứng khi kẹp khung chết
  — không đổi verdict (gap vẫn SPAN, CERT/FULL không đổi).

## 14. Kết luận kiểm chứng

| # | Claim đợt 129 | Kết quả |
|---|---|---|
| 1a | Đếm cuối 10/13/13; lũy kế 187/486/437 | **PASS** — đếm lại độc lập khớp chính xác (§1) |
| 1b | Lũy kế 111–128 tái kiểm 177/473/427 | **PASS** — khớp số công bố đợt 128 |
| 2 | Cờ 9/9 + t10 đủ trên đĩa | **PASS** — mtime khớp từng giây với §10.1 |
| 3 | Cây không đổi (03bf029f / 2c384ed1) | **PASS** — md5 trực tiếp khớp |
| 4 | Suite 27/27 exit 0; O8 Chromium 21/21 + WebKit 21/21 | **PASS** — log gốc khớp; WebKit FULL PASS lần thứ bảy liên tiếp |
| 5a | Lượt yên #7: attempt1 20/20, median 54,0 ms, lớp B 5/5 | **PASS** — JSON + analyzer + sampler thô khớp từng số |
| 5b | (c2) +1f tái hiện 2 lần (seq 136, 181) | **PASS** — labellag gốc khớp; histogram tính lại khớp từng bin |
| 5c | Modal +1/+2 không giữ dạng trên lượt yên hợp lệ | **PASS** — 33,9% vs 47,3% đợt 127, tính lại từ JSON thô khớp |
| 6a | Mù #48 A mở (đuôi 2.941 s) / B đóng; tối đa 2 ẩn | **PASS** — investigate log + số học khớp |
| 6b | Gap #74→#75 = 8.307 s SPAN; CERT n=41 / FULL n=56 | **PASS** — số học + blind48-gaps.txt khớp từng số |
| 7 | T3 probe mới (920a5122…, 997 dòng; dry-run blendTick n=40/n=106) | **PASS** — md5/dòng/partial JSON khớp |
| 8a | T8 harness 3/3 exit 0 trên boot #76 sau cờ POSTBOOT_PASS 09:32:15Z | **PASS** — run log + report JSON + cờ khớp |
| 8b | §8.2(B) kích hoạt lần đầu (poll 9, dpkg im 600 s), repair thành công | **PASS** — watcher log ghi TRIGGER=YES đủ 5/5 |
| 9 | Headroom 3.079; RAM 908–1.339 MB; birefnet không chạy | **PASS** — log đo gốc khớp |
| 10 | T7: 3 slot thiếu mới (HB 1 + DR 2); HB 39/160, DR 45/151 | **PASS** — truy vấn lại cron.runs khớp từng run_id + jitter |
| 11 | GAP §58 đã viết | **PASS** — dòng 1682, nội dung khớp |
| 12 | Sai số nhỏ mới | **F-130-1** (LIMITS gộp sửa sau đóng), **F-130-2** (6.507 s không phải đuôi T6), **F-130-3** ("T4 attempt2 bị giết" sai), **F-130-4** (rawMs median 9 ms không phải 10 ms), **F-130-5** (headroom 3.085 không có nguồn), **F-130-6** (khung chết #74: 06:25:09Z vs 06:24:30Z) — không cái nào đổi verdict |

**Không phát hiện claim sai nghiêm trọng.** Không sửa file nào của
đợt 129; mọi đính chính chỉ ghi trong LIMITS này.

## 15. File đổi/thêm + stage (không push)

- Repo (text, stage trong `phase9-round130-t1-verify129.txt`):
  - `docs/PHASE9_ROUND130_T1_VERIFY129_LIMITS.md` (mới, file này)
- Hồ sơ làm việc: không tạo script mới (tính toán bằng lệnh một lần
  trong phiên, kết quả ghi hết trong file này; riêng phép tính lại
  histogram dùng code `c2-histogram-r128.py` đã lưu của T5 đợt 129,
  không sửa nó).
- Cờ xong: `hidden_files/round130-t1.done` (touch khi LIMITS + stage xong).
- Không đo mới, không sửa production, không sửa file luồng khác,
  không push, không release/tag, không kiểm lại TTS 39, không thử
  birefnet.

## 16. Hạn chế kiểm chứng (ghi rõ, không giấu)

- **WFS lần 35 (863 dòng):** chỉ đối chiếu file đếm đã lưu
  (242/259/17 file), không chạy lại toàn bộ grep — quét mới lúc
  này đã nhiễm file đợt 130. Số chéo 863+25=888 vẫn đứng trên
  file đếm đương thời.
- **T1-129 kiểm chứng đợt 128 (§1 LIMITS gộp):** chỉ đối chiếu
  điểm then chốt (log probe v2, F-129-1/2/3, script đếm đã sửa);
  không tính lại toàn bộ DEF v0.4/mù #47 lượt này.
- **Mù #48 đoạn B:** đóng bằng uptime trực tiếp lúc probe #48 +
  dấu boot tươi (theo T2) — không quét lại mtime toàn cây lượt
  này (quét mới đã nhiễm dữ liệu đợt 130: reboot #76→#77 +
  ghi file sau 10:56Z). Bằng chứng là file điều tra đương thời
  của T2 + số học kiểm lại.
- **Replay dpkg #75 (1.509 dòng) + #76 (109 installs sau repair):**
  /var/log đã reset theo reboot #77; bằng chứng là log watcher
  + cờ POSTBOOT_PASS đương thời của T5 (đã đối chiếu ở §5.1),
  không kiểm lại trực tiếp trên đĩa hiện tại.
- **T7:** đã truy vấn lại `cron.runs` trực tiếp (limit=15) —
  đây là kiểm chứng độc lập thật, không chỉ đọc NOTES.md.
  Caveat `history_may_be_truncated=true` vẫn đứng.
- Boot lúc làm việc (#77, btime 10:56:31Z) khác boot đợt 129
  (#76); mọi kiểm chứng trên đều dùng file/log đã lưu trên đĩa
  bền, không phụ thuộc boot hiện tại.
