# LIMITS — Phase 9 đợt 131 T1: Kiểm chứng độc lập đợt 130 (không sửa file đợt 130)

- **Luồng:** T1 đợt 131 (lượt cron 21:35 +07 17/11/2026). Hạn cứng 17:35Z 17/11/2026.
- **Nhiệm vụ:** kiểm chứng độc lập toàn bộ claim lớn của đợt 130 bằng đọc + đối chiếu + tính lại từ dữ liệu gốc. Không sửa file đợt 130, không đo mới, không sửa production, không đụng TTS 39 / birefnet, không push.
- **Verdict: MỌI CLAIM LỚN CỦA ĐỢT 130 PASS. Tìm thêm 3 sai số nhỏ mới (F-131-1 → F-131-3), không cái nào đổi verdict nào.**
- **Phương pháp:** code đếm riêng (không chạy verbatim `count-final-130.py` của T10 — chỉ đối chiếu kết quả sau khi tính xong); tính lại median/SD/Pearson/Spearman từ JSON gốc bằng code riêng; đọc log thô (chain-t4.log, watcher log T5/T5b, run log T8, suites log + O8 log của T10) thay vì chỉ tin LIMITS; đối chiếu từng kích thước file §10.3 bằng `stat`/`md5sum`.

## 1. Đếm cuối đợt 130 — PASS (tái kiểm độc lập bằng code riêng)

- Script riêng: `hidden_files/round131-t1/t1-count-131.py` (log: `t1-count-131.txt`). Phương pháp chốt §10.2 đợt 129: entry NUL + dedup theo đường dẫn tương đối; glob loại `*-closing.txt` khi đếm đợt 130 trước closing rồi cộng closing tay 1 lần (bẫy F-129-2 — file closing đợt 130 nay đã có trên đĩa); lũy kế tính bằng dedup toàn cục trực tiếp, KHÔNG cộng số học.
- **Đợt 130 trước closing: 10 batch / 26 entry / 25 file duy nhất** (T1 1, T2 1, T3 13, T4 1, T5 3, T5b 2, T6 2, T7 1, T8 1, T9 1) — khớp T10. Tất cả 25 đường dẫn đều tồn tại trên đĩa.
- **Đợt 130 gồm closing: 11 batch / 28 entry / 27 file duy nhất — PASS.**
- **Lũy kế 111–129 tái kiểm: 187 batch / 486 entry / 437 file duy nhất — KHỚP CHÍNH XÁC số công bố đợt 129.**
- **Lũy kế 111–130: 198 batch / 514 entry / 453 file duy nhất — PASS** (437 + 16 file mới-only = 453 ✓). File mới-only 16: 5 analyzer lượt yên canonical mới + 10 LIMITS T1/T2/T3/T4/T5/T5b/T6/T7/T8/T9 đợt 130 + LIMITS gộp. File trùng 111–129: 11 (GAP_ANALYSIS.md + postboot-check.sh + preview.tsx + 7 F2 analyzer + PHASE9_ROUND125_LIMITS.md) — khớp từng file với §10.2.
- Đây là lần tái kiểm độc lập thứ tư của số 187/486/437 (T1 đợt 130 + T10 đợt 130 + T1 đợt 131 này + T10 đợt 129 gốc).

## 2. Lượt yên WebKit #8 (T4) — PASS

- JSON gốc `round130-t4/preview-b-f3-flip-webkit-t4-attempt3.json`: `passes` = 20, `len(results.b.passes)` = 20, `pageErrs` = [] — **20/20 PASS**.
- Analyzer T4: tickCost total n=630 **median=40,0 ms**, p90=66,0, hậu flip 40,0 ms — khớp claim. 7 lượt yên: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0; trung bình tính lại (49,5+40+52+47,5+44+54+40)/7 = 327/7 = **46,71 → 46,7 ms PASS**. Ngưỡng ≤60 ms GIỮ.
- Lớp B: file `classb-t4-attempt3.txt` ghi `LOP-B-TONG: DAT 5/5` (B1–B5 đều DAT; RAM min 1722 MB) — **PASS**.
- Attempt1/2 dở dang: JSON a1 `len(passes)` = 6, a2 = 10 — khớp 6/20, 10/20; chain log: a1 inner-end 12:47:09Z probe_exit=3, a2 inner-end 12:55:51Z probe_exit=3 — khớp giờ claim. Partial: blendTick a1 = 159, a2 = 253 (đếm trực tiếp `y2/blendTick` trong JSON) + tickCost n=193/314 (analyzer) — **khớp claim** (tBlend gap n=158/252 = số khoảng giữa 159/253 tick, nhất quán).
- Gate A: chain log attempt1 start 12:09:33Z → probe-start 12:43:32Z = 33'59" ≈ **34 phút chờ PASS**; 4 cửa sổ (12:09 / 12:20 / 12:30 / 12:42) PASS.
- (c2) lượt #8: chạy lại diff analyzer T4 vs file T10 đã lưu → **byte-identical** (tự kiểm lại, không chỉ tin T10): skp=0 **(c2)=6** (seq 161, 263, 315, 341, 441, 484, đều lag +1f); skp=1 (c2)=0 (n=112, median 0f, max 3f). **T4 ĐÚNG, số (c2)=0 của T8 là SAI** (đọc nhầm mục skippedLatest=1 — đã được T10/gộp ghi rõ, T1 này chỉ xác nhận lại từ JSON gốc). Tổng đợt 130 = 7 occurrence (thêm 1 trên partial a2, seq 149) — khớp claim; riêng số này T1 không tính lại độc lập từ JSON a2 (chỉ đối chiếu file analyzer a2 của T4 — xem §9).
- Xem F-131-2 (đếm dòng HB129) và F-131-3 ("3 giây") — sai số nhỏ, không đổi verdict lượt yên.

## 3. Dự báo falsifiable T3 §4.3 + thống kê phân phối (c2) — PASS

- Histogram T10 (`t10-histogram-with8.txt`) trên JSON attempt3 gốc: n=718 ghost, nomatch 0; hist {-10:2, -8:2, -1:51, **0:254 (35,4%)**, +1:185 (25,8%), +2:191 (26,6%), **+1/+2:376 (52,4%)**, **+3:33 (4,6%)**, +4:0, <0:55 (7,7%)}; snap−label median 34 ms, rawMs−labelMs median 9 ms; label−floor {1:548, 0:170} — **khớp từng số §10.1c**.
- Đối chiếu dự báo (median ~40 ms → +3 ≈ 4%, +1/+2 ≈ 50–53%): thực tế **+3 = 4,6% (lệch 0,6pp)** và **+1/+2 = 52,4% (trong 50–53%)** — **DỰ BÁO ĐÚNG CẢ HAI DẢI**, xa ngưỡng bác >5pp. PASS.
- Tính lại từ 6 lượt (code riêng, dùng số trong file histogram T10): bin 0: 38,0 / 37,4 / 38,6 / 38,5 / 35,8 / 37,7 → dải **35,8–38,6%**, mean 37,67%, sample SD **1,02pp → 1,0pp PASS**; +1/+2: 39,5 / 52,7 / 36,6 / 43,5 / 47,3 / 33,9 → dải **33,9–52,7%**, SD **7,01pp → 7,0pp PASS**; +3: 10,5 / 3,8 / 12,5 / 7,4 / 5,7 / 18,3 → dải **3,8–18,3%**, SD **5,26pp → 5,3pp PASS**. Pearson median↔+1/+2 = **−0,998 PASS**; median↔+3 = **+0,941 PASS**. Spearman ±1,000 trên 6 lượt: tính lại đúng −1,000 (cặp hạng không có tie trên 6 lượt) — PASS; lưu ý 7 lượt có tie median 40,0 ms nên Spearman 7 lượt không còn đúng ±1,000 theo nghĩa hẹp, nhưng thứ tự đơn điệu 7/7 vẫn đúng (+1/+2 giảm dần 52,7 → 52,4 → 47,3 → 43,5 → 39,5 → 36,6 → 33,9; +3 tăng dần 3,8 → 4,6 → 5,7 → 7,4 → 10,5 → 12,5 → 18,3) — cách viết của gộp ("Spearman ±1,000 trên 6 lượt … nay 7/7 lượt xếp đúng thứ tự") là chính xác, không sai.
- Pool 7 lượt: n=4892, 0: 1825 (37,3%), +1/+2: 2160 (44,2%), +3: 423 (8,6%) — khớp file histogram. Bin 0 lượt #8 = 35,4%, dưới biên 35,8% đúng **0,4pp** — khớp ghi chú §10.1c.
- (c2) thuần +1f 6 lượt: 28/4174 = **0,67% PASS** (n tổng 674+772+632+728+740+628 = 4174 ✓). Cross-check T3: 126a2 (n=740: 0:265/+1:175/+2:175) và 129a1 (n=628: 0:237/+1:86/+2:127/+3:115) khớp file histogram T10 — PASS.
- Thống nhất interface analyzer 12/12: 5 analyzer canonical `benchmarks/render/analyze-t4-*.py` + 7 `f2_startup_analyze_*.py` đều tồn tại trên đĩa; file paths T3 có đúng 13 entry (1 LIMITS + 12 script) — PASS (chỉ kiểm tồn tại + đếm entry, không chạy lại dry-run 20/20).

## 4. T10 verify: suite 27/27 + O8 21/21 — PASS

- Suites log `round130-t10-suites.log`: đếm **27 dòng `exit=0`, 0 dòng exit khác 0**; đuôi log `ALL DONE 2026-11-17T13:59:45Z`, `preview-engine: 354 assertions pass` — **27/27 exit 0 PASS**. Log ghi RAMavail 598 MB lúc bắt đầu (khớp §10.1).
- O8 log `t10-o8.log`: hai dòng kết quả `21/21 pass, 0 fail` (Chromium + WebKit) — PASS. Đếm độc lập từ JSON report: `o8-clicktest-report.json` 21/21 ok, `o8w-clicktest-report.json` 21/21 ok, 0 fail — PASS.
- Chuỗi WebKit FULL PASS: LIMITS gộp đợt 129 ghi "lần thứ bảy liên tiếp (đợt 123–129)" → đợt 130 là **lần thứ tám liên tiếp PASS** (không kiểm lại O8 đợt 123–128, chỉ nối chuỗi từ số đợt 129).
- Chromium 21/21 "lần đầu, không rerun": thư mục `o8-chromium/` chỉ có 1 file log vite attempt1 (`o8-vite-attempt1.log`), không có attempt2 — nhất quán với "không rerun" (chỉ là bằng chứng gián tiếp, không phải log exit đầy đủ).
- md5 trước/sau lúc đóng: preview.tsx `805409f0…` ✓ (đo lại hiện tại vẫn 805409f0), vite.config.ts `ee80d093…` ✓, media.ts `2c384ed1…` ✓ — khớp §10.1.
- Lock lúc đóng (0 ticket + 73 cooldown, 1022 B) và "không reboot trong lúc đóng": **KHÔNG kiểm lại được sau khi đóng** (trạng thái lock đã trôi theo đợt 131 đang chạy; xem §9).

## 5. T2 EPERM + mù #49 + gap — PASS

- Probe #49: `round130-t2/once.txt` ghi `probe#49 boot=86538084 ok=2 fail=0`; `status2.txt` xác nhận last sample 11:38:21Z — **ok=2 fail=0 PASS**.
- Mù #49 (08:39:55Z → 11:38:21Z = 2h58'26"): đoạn A 1.337 s, **135 mốc, lỗ max 128 s, đuôi 31 s → ĐÓNG** (khớp T2 LIMITS §2.3); đoạn B lỗ gộp **2.252 s > sàn 1.147 s → MỞ**, đuôi gộp **876 s** sau snapshot proactivity **10:41:55Z**; đoạn C đóng bằng uptime — **A đóng / B mở / C đóng, tối đa 1 ẩn PASS** (chỉ đối chiếu số trong LIMITS + file gaps; không chạy lại toàn bộ điều tra mù).
- Gap #75→#76: file `blind49-gaps.txt` ghi `INTERVAL [1h48'31", 1h48'51"]` = **[6.511 s, 6.531 s]**, `CERT n=42 (mid 6521s)`, `FULL n=57 (mid 6521s)` — **PASS**. Gap #76→#77 = 1h54'19" = 6.859 s STILL SPAN (seg B mở) — PASS.
- EPERM: T2 LIMITS ghi 0 "Operation not permitted" trong **109 file** *.log trong mù; **11 match thô / 8 dòng duy nhất**, phân loại hết — đối chiếu: file `scan-wfs-run.log`/`eperm-sweep-run.log` có trên đĩa; T1 không đếm lại 109 file (chỉ kiểm số trong LIMITS nhất quán với file scan: R7B total_lines=896, COPIES 25 → 871 dòng; `wfs-newstd.txt` 244 dòng = 244 file — khớp claim WFS).
- WFS lần 36: **871 dòng / 244 file, chênh 0** (871+25=896=R7B) — **PASS** (tính từ log scan: R7B 896 − COPIES 25 = 871 ✓; `wfs-newstd.txt` 244 dòng ✓).
- RAM max trong mù: `ram-max.txt` ghi **2749 MB** lúc 08:58:19Z; 2749/6144 = 44,7% ≈ **45% guard PASS**; birefnet không chạy (không có bằng chứng chạy trong file T2).

## 6. T5 / T5b hạ tầng — PASS

- T5 POSTBOOT_PASS #77: file `round130-t5/POSTBOOT_PASS` ghi `boot_id=86538084-… btime=2026-11-17T10:56:31Z pass_at=2026-11-17T12:01:24Z poll=24` — **PASS**.
- Replay (B) + --repair: watcher log `t5-wait-replay-b77.log` poll 9 lúc **11:46:21Z, dpkg=2, silent_s=641** → TRIGGER=YES ✓; poll 23–24: **dpkg=759, installs=109**, last_line 11:59:49, lists 75 — khớp claim (dpkg 2→759, 109 installs) **PASS**.
- T5 headroom 2971 (mở) → 2957 (cuối), RAM 473–3302 MB — khớp T5 LIMITS (chỉ đối chiếu số trong LIMITS + file headroom của T5; không đo lại).
- T5b POSTBOOT_PASS #78: file `round130-t5b/POSTBOOT_PASS` ghi `boot_id=57c3e5e2-… btime=2026-11-17T13:02:41Z pass_at=2026-11-17T13:39:13Z poll=23` — **PASS**. Replay: watcher log poll 22–23 ghi **dpkg=1509, installs=217**, last_line 13:37:37 — **1.509 dòng / 217 installs PASS**; TRIGGER=NO cả 23 poll (khớp T5b LIMITS).
- (c2) instrumentation log draw: preview.tsx hiện tại chứa đúng **2 điểm gọi `c2DrawLogPush`** (dòng 753 điểm `rawUnit`, dòng 4387 điểm `drawSrc`) qua 1 helper chung (1 lần `.push(` trong helper) — **"đúng 2 điểm log" PASS**; cờ mặc định tắt (helper return sớm khi `__vcutC2DrawLog !== true`); trần 10.000 entry; md5 preview.tsx 805409f0 ✓.
- postboot-check.sh: T5b ghi md5 `f5c6a411… → 0b73b3bc…`; file hiện tại md5 `a7958cc8…`, 34.087 B — **KHÁC với lúc đóng đợt 130 (33.318 B) NHƯNG CÓ LÝ DO**: T5 đợt 131 đã sửa file (mtime 14:43:55Z; `round131-t5/postboot-check.md5.before` = `0b73b3bc…` khớp đúng trạng thái lúc đóng đợt 130; `.after` = `a7958cc8…`). **Không phải lỗi của đợt 130** — ghi rõ để T1 đợt sau khỏi nhầm (xem §9).

## 7. T6 lock + T7 scheduler + T9 headroom — PASS

- T6: log lock **796 dòng** (khớp T6 LIMITS: 763 + 33 = 10 chu kỳ mới); prune lần 5 xóa 0 file; **71 file / 994 B** lúc 11:37–11:39Z (71×14 = 994 ✓); file cũ nhất `cooldown-r4-round115` mtime 2026-11-14T18:38:25Z — khớp claim "đủ 7 ngày ~21/11 18:38Z" **PASS** (chỉ đối chiếu số trong LIMITS; không quét lại lock vì trạng thái đã trôi theo đợt 131).
- T7: jitter tính lại: HB 17:20:50 scheduled 1794910850 → started 1794912102 = **+1.252 s PASS** (bằng kỷ lục đợt 129); HB 18:20:50: 1794914450 → 1794915338 = **+888 s PASS** (kém kỷ lục +889 s đúng 1 s). Lũy kế: HB 39/160 → **40/166** (kiểm toán cửa: 33+48+48+37 = 166 ✓); DR 45/151 → **46/154** (15+120+19 = 154 ✓); tỉ lệ 40/166 = 24,1%, 46/154 = 29,9% — **PASS**.
- T9: headroom **2.974 → 2.963** (đo lần 1/lần 2, khớp −11); 3.079 → 2.963 = −116, −116/3079 = **−3,8% PASS**; 63.747 − 2.963 = **60.784 watch PASS**; 2.963/1.578 ≈ **1,88 lần PASS**; chuỗi dài hạn 4.438 → 2.963 = −1.475, −33,2% (1475/4438 = 33,24%) **PASS**; RAM 688–1.246 MB, 1246/6144 = **20,3% guard PASS**; ngưỡng báo < ~1.800 còn 1.163 (2963−1800) **PASS**.

## 8. T8 harness (gốc bị chặn → T8b chạy lại) — PASS

- T8 gốc bị chặn: waiter log `round130-t8/smoke/wait-t4.log` dòng 86: `poll 85 13:02:16Z GATE-NOT-YET` — khớp claim "dấu sống cuối T4 lúc 13:02:16Z" **PASS**. Cờ `round130-t4-done` touch 13:08:03Z (đọc từ file cờ) — khớp claim T4 hoàn tất sau khi T8 kiểm **PASS**.
- T8b chạy lại 3/3: log `l10-run.log` (W1×3/W2/E4 PASS, E4 ct cuối=4, ended=true), `m4-run.log` (P4 **1,3/1,3/1,3 s** — khớp claim; P3 đồng bộ 2,0 s rồi PASS — không kẹt; P5 seek kẹt 0 mẫu), `n2-run.log` (P4-lần3 1,7 s; P5 0 mẫu; P6 không kẹt 90 s). Report JSON `l10-webkit-loop-w1-report.json` ok + `m4-webkit-w7-report.json` có dữ liệu — **PASS**.
- Thời lượng: l10 vite-ready 13:40:31 → E4 PASS 13:41:39 ≈ 68 s (claim 71 s, tính từ lúc chạy script — hợp lý); m4 13:41:57 → P5 13:44:09 ≈ 132 s (claim 134 s ✓); n2 13:44:26 → P6 13:48:17 ≈ 231 s (claim 233 s ✓).
- HB128: `m4-run.log` có **19 dòng** `[HB128]` — khớp claim "19 dòng, toàn sampleFor" **PASS** (chỉ đếm trong file m4; l10/n2 có 0 dòng — khớp "0 waitForPlaySync").
- Mirror 25/25: `mirror-verify-b78.log` đuôi `TOTAL ok=25 changed=0 missing=0 n=25` **PASS**. Kiểm kê: `inventory130-b78.txt` ghi `TOTAL candidate files: 238` **PASS**.

## 9. Kích thước file (§10.3 đợt 130) + F-131-1

| File | Công bố lúc đóng | Đo lại (T1 đợt 131) | Kết luận |
|---|---|---|---|
| `docs/PHASE9_ROUND130_T2_EPERM_LIMITS.md` | 52.884 B | 52.884 B | PASS |
| `apps/web/src/preview.tsx` | 448.223 B | 448.223 B | PASS |
| `docs/PHASE9_ROUND125_LIMITS.md` | 43.497 B | 43.497 B | PASS |
| `docs/PHASE9_ROUND130_LIMITS.md` (gộp) | 63.143 B | **67.500 B** (mtime 14:14Z) | Xem F-131-1 |
| `PHASE9_GAP_ANALYSIS.md` | 274.912 B trước §59; 283.910 B sau §59 | 283.910 B | PASS |
| `docs/PHASE9_ROUND130_T5_INFRA_LIMITS.md` | 37.189 B (dưới trần) | 37.189 B | PASS |
| `apps/web/scripts/vcut-webkit-postboot-check.sh` | 33.318 B (dưới trần) | 34.087 B (đã sửa ở đợt 131) | Xem §6, không phải lỗi đợt 130 |

- GAP §59 tồn tại (dòng 1694), nội dung khớp LIMITS gộp (T1 6 sai số F-130-1→6; T2 probe #49/mù #49/gap cert; T3 modal + dự báo; T4 lượt yên #8; T5/T5b replay; T6 lock; T7 scheduler; T8 harness; T9 headroom; T10 verify + đếm cuối 198/514/453) — **PASS**.
- File LIMITS T1 đợt 130 có đủ F-130-1 → F-130-6 (dòng 344–395 + bảng tổng dòng 426) — **PASS**.

### F-131-1 (mới, ghi nhận): LIMITS gộp đợt 130 tăng 4.357 B sau khi đóng, §12.3 chỉ giải thích được 4.324 B — còn 33 B chưa đối chiếu được

- File hiện **67.500 B**, mtime **14:14Z** (sau cờ `round130-t10.done` 14:09Z); §10.4 ghi lúc đóng **63.143 B** → tăng **4.357 B**.
- Đo span §12.3 trong file hiện tại: từ `### 12.3` (byte 62.460) tới dòng `---` trước footer (byte 66.782) = **4.322 B** (4.324 B tính cả `\n\n` trước header). 67.500 − 4.324 = **63.176 ≠ 63.143** — chênh **33 B**.
- Không có snapshot/hash của file lúc đóng nên không xác định được 33 B nằm ở đâu (có thể T10 đo 63.143 trước một chỉnh sửa nhỏ cuối cùng, hoặc parent sửa thêm 33 B cùng lúc thêm §12.3). Nội dung §12.3 (a)–(i) khớp quyết parent đã giao đợt 130; không phát hiện mâu thuẫn nội dung nào do lần sửa này.
- Ảnh hưởng KHÔNG ĐÁNG KỂ. Ghi nhận để T10 đợt sau lưu **sha256 lúc đóng** kèm kích thước (kích thước một mình không đủ để đối chiếu sau khi parent thêm §12.3) — đây là lần thứ ba liên tiếp LIMITS gộp bị sửa sau đóng (F-129-3, F-130-1, nay F-131-1), nhưng lần này vẫn là sửa có chủ đích (quyết parent).

### F-131-2 (mới): Đếm dòng HB129 ở attempt1 không nhất quán giữa các chỗ trong cùng đợt 130

- T4 LIMITS dòng 21 + LIMITS gộp §0/§4 viết: "HB129 bắn **23 dòng (a1) + 33 dòng (a2)**".
- Đếm lại từ `round130-t4/chain-t4.log` (66 dòng `[HB129]`): a1 (12:44–12:47Z) = **33 dòng** (23 dòng `play pass 7` + 5 `pwEvalTimeout writePartial-tickCost` + 5 `pwEvalTimeout writePartial-blendTick`); a2 (12:52–12:55Z) = **33 dòng** (23 `play pass 11` + 10 writePartial). Chính T4 LIMITS dòng 178–183 tự ghi a1 "Tổng 33 dòng [HB129]" và dòng 212 ghi a2 "33 dòng (pass 11 + 2 lần fetch writePartial)".
- Vậy số "23" ở a1 chỉ đếm dòng play-pass, số "33" ở a2 đếm tất cả — cùng một ngoặc đơn mà hai tiêu chuẩn đếm khác nhau. Số đúng nhất quán: **33 + 33 = 66 dòng** (không phải 23 + 33 = 56).
- Ảnh hưởng KHÔNG ĐÁNG KỂ: kết luận "HB129 thử lửa thật trong cả hai lần stall" vẫn đứng; chỉ là sai số đếm dòng trong câu tóm tắt (T4 dòng 21, gộp §0/§4 chép lại).

### F-131-3 (mới): "T4 xong attempt3 trước reboot 3 giây" chỉ đúng theo khung của T4, không đúng theo btime boot mới

- LIMITS gộp §0 và §10.1 viết "T4 xong attempt3 trước reboot **3 giây**".
- Chain log: probe attempt3 exit 0 lúc **13:02:39Z** (dòng 648); btime boot mới **13:02:41Z** → cách **2 giây**, không phải 3 giây. "3 giây" chỉ đúng nếu tính tới mốc 13:02:42Z (đầu khung chết theo T4 / lúc class-B xong và run-attempt exit=0).
- File T4 gốc không hề viết "3 giây" — chỉ ghi probe exit 13:02:39Z + class B xong 13:02:42Z. Câu "3 giây" là do gộp viết gọn, lẫn hai khung giờ (btime 13:02:41Z vs khung T4 13:02:42Z) mà gộp §5/§8 đã ghi cả hai.
- Ảnh hưởng KHÔNG ĐÁNG KỂ: dữ liệu attempt3 đã ghi đủ (20/20, JSON đầy đủ, n=630) trước reboot theo cả hai khung; lượt yên #8 vẫn giữ nguyên.

## 10. Những gì KHÔNG kiểm lại được (giới hạn của kiểm chứng sau khi đóng)

- **Trạng thái lock lúc T10 đóng** (0 ticket + 73 cooldown, 1022 B) và "không reboot trong lúc đóng": trạng thái đã trôi (đợt 131 đang chạy, boot đã đổi) — không có log đóng nào lưu snapshot lock ngoài LIMITS gộp; T1 chấp nhận theo ghi chép của T10, không coi là sai.
- **Số (c2)=6 trên partial a2 (seq 149)**: chỉ đối chiếu file analyzer a2 của T4, không tính lại độc lập từ JSON a2 (không ảnh hưởng tổng kết: 6 trên lượt hợp lệ a3 đã tính lại độc lập + byte-identical).
- **WFS/EPERM chi tiết + toàn bộ điều tra mù #49**: chỉ đối chiếu số trong LIMITS với file scan/log của T2, không chạy lại toàn bộ sweep (chạy lại sweep sẽ đo trạng thái hiện tại, không phải trạng thái lúc probe #49).
- **Dry-run 20/20 thống nhất analyzer của T3**: chỉ kiểm tồn tại file + đếm entry paths, không chạy lại 20 dry-run.
- **postboot-check.sh đã bị T5 đợt 131 sửa** (xem §6) — T1 đợt 132 đối chiếu md5/kích thước file này phải lấy mốc sau đợt 131, không lấy số đợt 130.

## 11. Nợ / ghi chú chuyển T10 + T1 đợt sau

1. **T10 đợt sau: lưu sha256 của LIMITS gộp lúc đóng** (kèm kích thước) — xem F-131-1. Kích thước một mình không đủ để đối chiếu sau khi parent thêm §12.3.
2. **T4/T10 đợt sau: khi đếm dòng log có nhiều loại dòng, ghi rõ tiêu chuẩn đếm trong cùng một câu** (xem F-131-2) — đừng viết "23 dòng (a1) + 33 dòng (a2)" khi hai số đếm theo hai cách khác nhau.
3. **Gộp đợt sau: tránh viết gọn mốc thời gian kiểu "trước reboot 3 giây" khi có hai khung giờ** (xem F-131-3) — ghi rõ mốc nào (probe exit 13:02:39Z, btime 13:02:41Z) thay vì một con số giây duy nhất.
4. Khung chết #77 hai bản ghi + số boot #77?/#78? TẠM: đã quyết parent đợt 130 §12.3(f)/(h) — T6 đợt 131 chốt; T1 đợt này không quyết lại.
5. Mù #49 B mở + mù #50 mới mở, lượt yên #9 bật log draw, T5 phân tích log draw: theo quyết parent §12.3(a)/(b)/(e) — các luồng đợt 131 đang làm; không thuộc phạm vi kiểm chứng đợt 130.

---

- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round131-t1-verify130.txt` — 1 entry (file LIMITS này), NUL-delimited, verify read-back, 0 binary.
- **Hồ sơ:** `hidden_files/round131-t1/` (script đếm `t1-count-131.py` + log, output kiểm attempt3 `t1-t4-attempt3.txt`, file LIMITS này). Cờ `round131-t1.done` đã tạo khi xong.
- **Tổng batch đang chờ user push (lũy kế đợt 111–130, chưa tính đợt 131): 198 batch / 514 entry / 453 file duy nhất.** KHÔNG push khi user chưa nhắn "push đi" từ main chat.
