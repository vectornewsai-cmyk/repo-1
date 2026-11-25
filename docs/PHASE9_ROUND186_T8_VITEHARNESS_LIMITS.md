# Đợt 186 T8 — MỞ B2: HARNESS 6/6 TRÊN #107; B2 OFFLINE ĐẠT + LIVE SẠCH; O8 T8 3/3; LƯỢT YÊN #55 KHÔNG CÓ LƯỢT HỢP LỆ → FULL PASS ĐỨT 1 → 0 (ĐỀ XUẤT)

Ngày: 24/11/2026 (lượt cron 00:35 +07 = 17:35:51Z; T8 mở ~17:40Z, đóng ~18:55Z — TRONG hạn cờ ~20:00Z và hạn cứng ~20:35Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) MỞ B2 theo thiết kế §C LIMITS T8-180 (quyết (j) đợt 185) — kiểm offline trước, rồi kiểm live; (2) harness hb128 + B1/B2 live trên boot hiện tại; (3) O8 T8; (4) (c')/(f') V1 đối chứng + replay V1/V2; (5) H3 thụ động; (6) F-185-T8-4. KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). **Nguồn:** LIMITS T8-185 + aggregate 185 §12.3 (bản parent đã đính chính sau viết lại: aggregate 79.029 B; (p) chuỗi đợt sạch 0 → 1; (j) MỞ B2 TỪ ĐỢT 186).

## 0. Kết luận ngắn — 6/6; B2 ĐÃ MỞ (OFFLINE ĐẠT, LIVE SẠCH); O8 T8 3/3; FULL PASS ĐỨT

- **#107 XÁC NHẬN 9 nguồn TƯƠI (T0-186)** — boot `cea79500`, btime **17:19:50Z**. **#105 XÁC NHẬN** (053a35c3, btime 13:13:32Z, gap #104→#105 = 7.190 s). **#106 CHƯA XÁC MINH** (F-186-T0-1: khung cứng 14:52:42Z–17:19:50Z, ước ~15:13:32Z — KHÔNG khẳng định). **POSTBOOT_PASS #107 CÓ 17:48:46Z (repair-sớm-quyết-h, poll=1, CÓ caveat). Gate (a) #107: CÓ.** **#105 KHÔNG CÓ cờ** (T5-186 — tổng boot không cờ 23 → 24 nếu parent chấp nhận). Marker sống qua **59 reboot** (#49–#107, mtime `~/.config/vcut-persistence-marker` 2026-11-20 11:39:47.272154981Z KHÔNG ĐỔI (T8 kiểm trực tiếp)).
- **Lượt yên #55 KHÔNG CÓ LƯỢT HỢP LỆ (T4-186, đóng cờ 18:25Z)** — 3/3 attempt đều 20/20 nhưng đều bị loại (a1 median 60,0 ms đúng bar nhưng B2 vi phạm load1_max 5,04; a2 median 68,0 ms > 60; a3 median 79,0 ms + B1/B2 vi phạm); **chuỗi lượt yên 47 → 0 (ĐỨT)**. Quyết (p) kiểm chứng live lần 6: ĐẠT. 0 vi phạm phía T4.
- **HARNESS 6/6 trên #107 (18:28:15–18:44:18Z): WebKit 3/3 PASS** (84l10 W2+E4, 85m4 P1+P5, 86n2-hb128 P1+P5+P6) **+ Chromium 3/3 PASS** (cùng 3 pha). **Kẹt cộng dồn GIỮ 26 — 0 kẹt mới.** live_diags=0 cả 6 pha; WATCHDOG-137 = 0; FRESH-CONTENT-186 (V2) = 0 kích hoạt live.
- **B2 ĐÃ TRIỂN KHAI (§C)** — bọc setupProject + startPlaying ở cả 3 script harness + vòng chờ P6 90 s của 86n2. **Offline ĐẠT:** setup/startPlaying/P6-wait treo → TRIGGER @125 s (via=f, f, wd); P6 sạch 90 s → OK maxspan 85 s; setup sạch 60 s → OK. **Live SẠCH:** setup/startPlaying 0 dòng thêm cả 6 pha; P6-wait 18 dòng/86n2-run (maxspan 85 s < 120 s); check-fresh live OK cả 6 pha; **B2 chưa bắt kẹt thật live** (không có kẹt thật đợt này). Giới hạn: P6 seeking-kẹt KHÔNG watchdog thì (c') không trigger (xem §C5).
- **O8 T8 3/3 trên #107** (18:46:51–18:49:45Z): WebKit ×2 **21/21 PASS** (md5 `a97a3831`/`1c01f397`) + **Chromium 21/21 PASS (md5 `09dd510e`)** — JSON đếm lại bằng python. **O8 T0 PASS 3/3 trên #107** (WebKit md5 7413e219/18eda9e6, Chromium eb14d47d).
- **FULL PASS: KHÔNG — chuỗi 1 → 0 (ĐỨT, ĐỀ XUẤT, parent quyết).** 4/5 chân cùng boot #107 (gate (a) ✓, O8 T0 ✓ 3/3, O8 T8 ✓ 3/3, harness ✓ 6/6) — **thiếu chân lượt yên #55**. Lần đầu đứt kể từ đợt 185.
- **V2 (f'') phương án chính — replay: V2 bắt 4/4 kẹt có HB128 @125 s, 0 FP trên 21 log sạch duy nhất theo md5** (23 entry, 2 cặp trùng 181/182 — xem F-186-T8-3 về lệch +1 so với chuỗi đếm lịch sử); **V1-300 đối chứng: 3/4** (164@125 s, 171@305 s, 178@125 s; lỡ 183).
- **F-185-T8-4: ĐÃ SỬA (T0-186)** — boot-survey stat đúng `~/.config/vcut-persistence-marker`; marker 59 reboot (T8 kiểm trực tiếp). **F-184-T8-1: KHÔNG TÁI DIỄN** — khối LOGS cả hai script replay prefix-identical với đợt 185 (chỉ thêm 2 entry `186-sach-*`) + 0 NO-FILE trong cả hai lần chạy replay.
- **Waiter: GATE-FOUND poll=31 18:25:58Z** (t4=OK, postboot đường (a); t4attempt=no-lock).

## 1. Dòng thời gian (gọn)

- 13:13:32Z **#105** (T0-186 XÁC NHẬN). ~15:13Z **#106** (ước, CHƯA XÁC MINH — F-186-T0-1). 17:19:50Z **#107** (XÁC NHẬN 9 nguồn tươi). 17:35:51Z Đợt 186 mở (MUỘN 3 giờ — lượt 21:35 +07 chỉ đóng đợt 185). 17:40–17:45Z T8 mở: đọc LIMITS T8-185 + aggregate 185 §12.3 (bản parent đã đính chính); md5 cây khớp 185; copy driver 185→186 + đổi nhãn; **dọn `smoke/` (185 → `smoke/archive-185/`)**; symlink diag → round186-t8 (1/2 lúc copy — F-186-T8-2); probe S1 CÓ SẴN (md5 `453d1082`).
- 17:48:46Z **POSTBOOT_PASS #107 CÓ** (repair-sớm-quyết-h, poll=1, CÓ caveat). 17:53:23Z Cửa yên mở → attempt1; 18:03:45Z attempt2; 18:08:04Z attempt3; 18:12:16Z hết 3/3 ngân sách, 0 lượt hợp lệ. **18:25Z T4 ĐÓNG CỜ** (#55 KHÔNG HỢP LỆ, chuỗi 47 → 0). **18:25:58Z GATE-FOUND poll=31.**
- 17:54:46Z Selfcheck #1: libs 6/6 CÓ (kể cả `libevent-2.1.so.7`), dpkg 768 — NHƯNG GST plugins = 0 (F-186-T8-1: `gst-inspect-1.0` vắng).
- **17:40–17:53Z Triển khai B2 + kiểm offline** (trước gate — chỉ sửa file + chạy python trên log tổng hợp). **18:28:01Z rebuild fixture: exit 0, md5 khớp đợt 125** (ba0c7c62/f05daed8/fbaa3d1a/a1fb8549) — chạy SAU khi T4 đóng cờ.
- **18:28:15–18:44:18Z HARNESS 6/6** (driver pid 127993, boot #107). **18:46:51–18:49:45Z O8 T8 3/3.** 18:50–18:55Z replay + extract + LIMITS + paths + cờ. **0 reboot trong phiên T8** (cùng boot cea79500).

## A. O8 — T8 3/3 TRÊN #107; T0 3/3 TRÊN #107 (CÙNG BOOT)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #107 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `a97a3831`, S1 PASS 18:46:51Z |
| 2 | O8 T8 WebKit attempt2 trên #107 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `1c01f397`, S1 PASS 18:47:54Z |
| 3 | O8 T8 Chromium trên #107 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `09dd510e`, S1 PASS 18:48:51Z |
| 4 | O8 T0 WebKit attempt1 trên #107 | **21/21 PASS** (md5 7413e219) |
| 5 | O8 T0 WebKit attempt2 trên #107 | **21/21 PASS** (md5 18eda9e6) |
| 6 | O8 T0 Chromium trên #107 | **21/21 PASS** (md5 eb14d47d) |

- O8 T8 chạy 18:46:51–18:49:45Z trên #107 (SAU POSTBOOT_PASS #107 58'). O8 log: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0 (extract chạy lại SAU O8).
- **Gate cho boot đo `cea79500` (#107): (a) CÓ — POSTBOOT_PASS #107 (CÓ caveat).** O8 T0 + O8 T8 + harness CÙNG boot #107; **lượt yên #55 KHÔNG có lượt hợp lệ → FULL PASS ĐỨT 1 → 0 (đề xuất, parent/T10 quyết).**

## 2. Kết quả harness — 6/6; WebKit 3/3 PASS; Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 18:28:15–18:29:35 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 18:29:50–18:32:12 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 18:32:27–18:36:29 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 18:36:44–18:37:45 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 18:38:00–18:40:11 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 18:40:26–18:44:18 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 26 — 0 kẹt mới.** **84l10 WebKit PASS đợt này** (lần PASS thứ 6 trong 8 đợt gần nhất: 179, 180, 181, 183, 185, 186; 182 + 184 KHÔNG ĐO ĐƯỢC — đợt 185 parent quyết chuỗi = 5; đợt này PASS nữa — đề xuất 6). **86n2-P1 không kẹt: lần thứ 9 nếu tính tiếp** (chuỗi 8 tới đợt 185; 184 KHÔNG ĐO ĐƯỢC — parent/T10 quyết).
- **Đối chứng Chromium cùng pha: 3/3 PASS** — cùng kết quả WebKit.
- **B2 live: SẠCH (đợt đầu tiên)** — 86n2-hb128 WebKit PASS live (P6-wait 18 dòng HB128, P1/P5/P6 PASS); B2 chưa bắt kẹt thật live. Xem §C.
- RAM sampler (n=33): balloon min 3.679.144 / max 5.707.320 kB (**88,6% trần, pinned=0**), avail min 534 MB / max 2.824 MB — KHÔNG ghim trần lần nào trong cửa sổ harness.

## 3. Watchdog + 4 bước kiểm — 0 WATCHDOG-137; 0 LIVE-DIAG; V2 0 kích hoạt live

- **Watchdog (i): 0 dòng** (cả 6 pha — không có evaluate im lặng >60 s). Live-diag (1b): **0** (log chảy đều, không im lặng >120 s). **V2 (f''): 0 kích hoạt live** (check-fresh trên 6 log live: 84l10 OK maxspan=0 s; 85m4 OK 5 s (WebKit) / 10 s (Chromium); 86n2 OK 85 s — run P6-wait hợp lệ, dưới ngưỡng 120 s).
- **(1)** Watchdog trong 3 script (VÁ 142, GIỮ NGUYÊN 143–186) + `t8-diag-stall.sh` → 186; **(1b)** live_diags=0 cả 6 pha; **(1c')/(f'') V2: 0 kích hoạt live; replay §C.**
- **(2)** Balloon sampler: n=33 (xem §2); avail thấp nhất 534 MB.
- **(3)** Đối chứng Chromium cùng pha: 3/3 PASS (xem §2). **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **0 lần kẹt → 0 snapshot mới** (journalctl-k trống, như mọi đợt).
- **0 snapshot stall mới.** 0 thư mục stall mới trong smoke/ (extract: `stall dirs: []`). Symlink thứ hai cập nhật muộn — xem F-186-T8-2.

# §C — MỞ B2 (QUYẾT (j) ĐỢT 185): TRIỂN KHAI + KIỂM OFFLINE ĐẠT + KIỂM LIVE SẠCH

## C1. Thiết kế B2 (đúng §C4 LIMITS T8-180 — KHÔNG mở rộng phạm vi)

- **B1 (đã có từ đợt 181):** bọc `resetPlayhead0()` bằng hbStart/hbStop — một điểm sửa duy nhất trong mỗi script hb128.
- **B2 = B1 + bọc setup + vòng chờ P6 90 s của 86n2.** Gốc (§C4 T8-180): (c') chỉ phủ 3 helper có hbStart (`waitForPlaySync` / `waitForNotSeeking` / `sampleFor`); audit 85m4-hb128 cho 5 `resetPlayhead0` trần + ~20 `ev(STATE_FN)` lẻ + khối setup; 86n2-hb128 cùng hình (5 reset + đuôi P6); 84l10: setup + W2-setup + E4 (Q3 chỉ phủ TRONG vòng W2/E4). **Ràng buộc:** lặng hợp lệ dài nhất là P6 86n2 (~97 s) — ngưỡng (c') 120 s chỉ dư 23 s. **Playhead P6 đóng băng ở 30 suốt 90 s → trailing run hợp lệ đã 90 s, biên với ngưỡng 120 s chỉ còn 30 s.**
- **Thay đổi đợt này (3 script harness — đúng phạm vi §C4):**
  - `clicktest-84l10-webkit-loop-w1.mjs` (baaa13c0 → **16e5e957**, 34.880 → 35.917 B): bọc `setupProject` + `startPlaying` bằng hbStart/hbStop (tag `setupProject setup` / `startPlaying start`).
  - `clicktest-85m4-webkit-w7-hb128.mjs` (2f707749 → **3fb2548b**, 37.700 → **38.737 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**: bọc `setupProject` + `startPlaying` (như trên).
  - `clicktest-86n2-webkit-w7-hb128.mjs` (c90e0853 → **de925614**, 41.785 → **43.653 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**): bọc `setupProject` + `startPlaying` + vòng chờ P6 (tag `P6-wait wait`, summary từ STATE_FN mới nhất mỗi poll 200 ms).
  - Script diag `clicktest-84l10-webkit-w2setup-hb128.mjs` (3d41b015) KHÔNG đổi — không chạy trong harness (DỪNG), ngoài phạm vi B2.
- **Mẫu bọc (theo đúng mẫu B1):** hbStart tag 2 từ (parser check-fresh yêu cầu `(\S+) (\S+)` sau `[HB128]`); summary = state cuối đã biết; trước lần đọc STATE_FN đầu → `playhead=? ct=?`. Setup thường <5 s → 0 dòng thêm/lần chạy. P6 chờ tối đa 90 s → ~18 dòng thêm/86n2-run (chi phí mới duy nhất của B2 — xem §C3). **Không đổi:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính** — B2 chỉ mở rộng PHỦ SÓNG, không đổi điều kiện kích hoạt.
- **Syntax check:** `node --check` PASS cả 3 script sau sửa. Rollback trong 1 đợt: bản B1 còn trong `smoke/archive-185/` + git — gỡ 3 khối bọc là về B1.

## C2. Kiểm chứng offline TRƯỚC harness (planb-b2-offline.py + check-fresh-186t8.py, log tổng hợp)

| Ca | Log tổng hợp | check-fresh-186t8.py (V2) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` (25 dòng, playhead=? ct=?) | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` (25 dòng, playhead=0 playing=true) | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` (25 dòng, playhead=30 seeking=true) | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` (seeking=true, ev trả về) | OK maxspan=150 s wd=0 — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` (playhead=30, seeking=false) | OK maxspan=85 s wd=0 — **không FP, dưới ngưỡng 120 s** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` (dài hơn thực tế) | OK maxspan=55 s wd=0 — **không FP** |

- **Kết luận offline: ĐẠT.** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật (setup/startPlaying via=f; P6-wait via=wd khi evaluate treo); không FP trên 2 ca sạch (biên P6: 85 s < 120 s, dư 35 s). Dòng HB đầu ở elapsed=5 s nên elapsed trigger = 125 s — cùng quy ước B1/V2.

## C3. Kiểm live (harness 6/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | **18 dòng** (elapsed 5→90 s) | — | — | **18 dòng** (elapsed 5→90 s) |
| check-fresh live | OK maxspan=0 s | OK maxspan=5 s | OK maxspan=85 s | OK maxspan=0 s | OK maxspan=10 s | OK maxspan=85 s |

- **Chi phí live đúng thiết kế:** setup/startPlaying 0 dòng thêm (setup <5 s); P6-wait 18 dòng/86n2-run — dòng đầu `elapsed=5s playhead=30 ct=30 paused=true seeking=false playing=false`, dòng cuối `elapsed=90s` (cùng giá trị — đúng chữ ký §C4). Tổng HB128 live: 84l10: 7 dòng; 85m4: 19 dòng (bằng đợt 185); 86n2: 39 dòng (21 cũ + 18 P6-wait mới).
- **B2 chưa bắt kẹt thật live** — không có kẹt thật đợt này (harness 6/6 sạch, 0 WATCHDOG-137). **B1 live sạch lần thứ tư nếu tính tiếp** (181 + 183 + 185 + 186 — B1 vẫn chạy trong B2; parent quyết).
- **Replay sau live (2 entry mới `186-sach-*`):** 186-sach-85m4 19 dòng, max run span 5 s, KHÔNG kích hoạt mọi phương án; 186-sach-86n2-hb128 39 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s).

## C4. Replay V1/V2 sau O8 (replay-1c-186t8.py + replay-f-fix-186t8.py — đã thêm 2 entry `186-sach-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 21 log sạch duy nhất theo md5** (23 entry, 2 cặp trùng byte-identical 181/182 — xem F-186-T8-3). Đợt 186 đóng góp 2 log sạch mới (đợt 184: 0 log mới vì launch-fail).
- **Kẹt theo từng phương án (xác nhận lại đợt này): (c') V0: 164@125 s, 178@125 s; lỡ 171, 183. (f') V1-300: 164@125 s, 171@305 s, 178@125 s; lỡ 183. (f'') V2: 164/171/178/183 đều @125 s. (f''') V3: 164@125 s, 171@305 s, 178@125 s; lỡ 183. Kẹt-179 lỡ mọi phương án (0 dòng HB128 — lỗ hổng phủ sóng).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (164@125 s, 171@125 s, FP 0); **V1-300 ĐẠT** (164@125 s, 171@305 s, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 4/4 @125 s, V1-300 3/4, 0 FP cả hai trên 21 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN (đã kiểm):** khối LOGS trong cả hai script replay prefix-identical với đợt 185 (1c: 29 → 31 dòng; f-fix: 27 → 29 dòng — chỉ thêm 2 entry `186-sach-*`); 0 NO-FILE trong cả hai lần chạy replay. Quy trình đổi tên loại trừ khối LOGS đã thành checklist copy driver.
- **Biên an toàn (cập nhật sau B2):** log sạch max identical-run span **85 s** (run P6-wait — ngưỡng 120 s → biên chỉ còn 35 s, hẹp hơn nhiều so với 5 s trước B2). Đây là biên ĐÚNG THIẾT KẾ (§C4: run P6 hợp lệ đã 90 s) — không phải FP, nhưng là biên hẹp nhất từ trước tới nay; nếu P6 kéo dài hơn 90 s thì phải xem lại ngưỡng. Watchdog chỉ kích hoạt sau evaluate im lặng >60 s — tín hiệu ĐỘC LẬP, không vòng tròn.

## C5. Giới hạn B2 (trung thực — B2 không phải toàn năng)

- **B2-4 (offline): P6 seeking-kẹt mà evaluate vẫn trả về (không watchdog) → (c') KHÔNG trigger** (OK maxspan=150 s wd=0). Nguyên nhân: summary seeking=true → (f) chặn; không có WATCHDOG-137 → V2 không miễn (f). Trong thực tế P6 tối đa 90 s nên run dừng ở 85 s < 120 s — B2 cho P6 chỉ cho **bằng chứng + biên 30 s**. Đường bắt kẹt P6 vẫn là watchdog (i) @60 s + V2 via=wd, hoặc timeout 900 s.
- **B2 chưa bắt kẹt thật nào** (offline synthetic + live sạch). Bằng chứng bắt thật đầu tiên thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 15 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173)

## D1–D2. Phạm vi + Q3: 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; script `16e5e957` — B2) + ca 178 W2-setup :443; 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (W2+E4), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 186: **không có dữ liệu mới về kẹt**; hồ sơ 4 điểm kẹt giữ nguyên. **Chuỗi 84l10 PASS: 5 đợt (179, 180, 181, 183, 185) + PASS đợt 186 — có nối qua 2 đợt KHÔNG ĐO ĐƯỢC (182, 184) hay không — parent/T10 quyết.** Tần suất kẹt 84l10: 4 ca / 28 đợt ≈ 14% (không đổi).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — không có ca mới đợt này.
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (heal lần 2):** T0-186 ghi `libevent` vắng 17:41Z → có 17:50Z sau replay; 84l10 WebKit PASS trên #107 khi libs 6/6 CÓ — củng cố hướng "lib hệ thống quyết định WebKit chạy/không-chạy".
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 186: không có dữ liệu mới (không kẹt).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — không có ca mới đợt này (0 probe evaluate TIMEOUT).
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 28 đợt). Kẹt-183 (85m4 P1): đợt này P1 PASS.

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 186 (0 KẸT MỚI — WebKit + Chromium ĐỀU PASS; KHÔNG MỞ ĐIỀU TRA)

## B1. Trạng thái giả thuyết sau đợt 186 (KHÔNG ĐỔI — không có ca kẹt mới để đối chiếu)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — không có ca kẹt nào đợt này; avail trong lúc harness 534–2.824 MB, balloon max 88,6% trần (không ghim 100%).
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH HƠN (đứng nguyên từ 183)** — không có bằng chứng mới đợt này (0 kẹt cả hai engine); WebKit heal khi lib đủ (lần 2, T0-186) cho thấy tầng lib hệ thống quyết định WebKit chạy/không-chạy, khác với treo-kẹt.
- Đợt 186 T8 chỉ giám sát thụ động H3: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T0 PASS 3/3 trên #107). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 9 nếu tính tiếp (parent quyết).** H3 vẫn chỉ giám sát thụ động.

# §E — CHECKLIST (o) ĐỢT 186 (quyết (o) đợt 180 + các F-185 còn lại — 21/21)

- o1. F-186-T0-1 (#106 chưa xác minh) — GHI NHẬN (khung cứng 14:52:42Z–17:19:50Z; #107 XÁC NHẬN 9 nguồn tươi).
- o2. Run 185 SUCCEEDED +232 s + run 186 SUCCEEDED (2 ỨNG VIÊN CA ≥60 s mới — T7-186 phán cuối); scheduler gap 15:15:34Z–17:35:40Z = 8.406 s, tái diễn giống hệt OUTAGE 179 (số thô T0-186).
- o3. F-185-T1-1 (prose §112) — GHI NHẬN; thuộc T1-186 (đã đóng cờ).
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 534–2.824 MB trong harness (T8); balloon max 88,6% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; quyết (p) kiểm chứng live lần 6 ĐẠT (T4-186); **0 vi phạm phía T4; chuỗi đợt sạch 1 → 2 (đề xuất, parent quyết)**.
- o6. F-181-T4-3 (X193) — X193 mồ côi vẫn còn lúc đóng (socket của T4; X199 của T8 đã unlink đúng luật; X11 chỉ còn X193).
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-186 sống trên #107 (POSTBOOT_PASS #107 17:48:46Z; F-186-T5-1 overlap +24 s, mẫu 18).
- o8. F-181-T5-2 (ledger ts) — GHI NHẬN (T5-186 đã đóng cờ; F-186-T5-2 repair append ledger ts 1795542525).
- o9. F-180-T5-3 (lệch btime 11 s) — GHI NHẬN; /proc/1 #107 +15,344 s (T0-186).
- o10. F-174-T5-6 KHÔNG áp dụng — GHI NHẬN (#107 repair-sớm-quyết-h, poll=1, CÓ caveat; #105 KHÔNG CÓ cờ — tổng 23 → 24 nếu parent chấp nhận).
- o11–o13. F-181-T6-1 (chồng pha) + F-180-T6-4 (mâu thuẫn poll=0) + F-180-T6-5 (watcher chưa chạy lúc snapshot) — GHI NHẬN; T6-186 ĐÃ ĐÓNG CỜ.
- o14–o16. F-181-T7-1 (sleep SIGTERM) + F-180-T7-4 (lỗi nhãn — F-178-T7-4 ĐÃ LÀM RÕ) + F-180-T7-5 (tuổi run cộng thừa 600 s) — GHI NHẬN; T7-186 chưa đóng cờ lúc T8 đóng.
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — stat đúng `~/.config/vcut-persistence-marker`; marker 59 reboot (T8 kiểm trực tiếp).
- o18. Quyết (o) 185 (cửa slot LÀNH lần 11; HB 47/507, DR 53/326) — GHI NHẬN; số mới thuộc T7-186.
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — ĐÃ THỰC HIỆN: marker 59 reboot (T0-186 XÁC NHẬN #107); T8 đóng ~18:55Z, TRONG hạn cờ ~20:00Z và hạn cứng ~20:35Z.
- o20. Quyết (j) 185 (MỞ B2; V2 chính thức; H3 giám sát; B1 live sạch lần 3) — **ĐÃ THỰC HIỆN (§2, §C, §F, §B)** — B2 ĐÃ TRIỂN KHAI (offline ĐẠT, live sạch); V2 replay 4/4 @125 s, V1-300 3/4.
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T0-186/T9-186).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 186 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy** (hb128 là chuẩn). **Chi phí B2 mới:** 85m4-hb128 38.737 B (VƯỢT giới hạn, dư −969 B); 86n2-hb128 43.653 B (oversize — cần ENABLE_PRIVSEP=0); 84l10 35.917 B (dưới giới hạn, dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7; `media.ts` 2c384ed1; `vite.config.ts` ee80d093 (không đổi); `84l10` **16e5e957 (B2, MỚI)**; `85m4-hb128` **3fb2548b (B2, MỚI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, MỚI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 đổi 3 file repo đợt này (B2) + LIMITS này.**
- **Working dir `repo-1/hidden_files/round186-t8/`** — copy `cp -r` 185→186 (exit 0; o8-webkit/o8-chromium loại khỏi copy vì symlink gãy — tạo lại trống; xem F-186-T8-5). **Đổi nhãn đúng** (185t8→186t8, waiter → 19:30Z, LIVE-DIAG/FRESH-CONTENT → 186) — grep: chỉ còn 4 tham chiếu 185 trong khối LOGS (đúng, giữ log đóng băng).
- Extract (F-182-T8-6 — ĐÃ KIỂM LIVE đợt 183, dùng lại đợt này): trích ĐÚNG số harness (exit=0 ×6) + O8 (webkit 21/21 md5 a97a3831/1c01f397, chromium 21/21 md5 09dd510e) + sampler n=33 + WATCHDOG-137: 0. Nhãn "ovsize LIMITS 184" vẫn cũ — xem F-186-T8-4.
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN MUỘN 1/2 (xem F-186-T8-2).** Symlink goals cập nhật → round186-t8 lúc ~17:49Z, TRƯỚC waiter; symlink `apps/web/scripts/t8-diag-stall.sh` cập nhật muộn 18:46Z, SAU harness — 0 lần gọi diag trong harness nên không ảnh hưởng. Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink NGAY lúc copy (đã làm 8 đợt liên tiếp, đợt này sót 1).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-186t8.mjs` có mặt sau `cp -r` 185→186 (md5 `453d1082` giống hệt 175–186; `node --check` PASS). O8 T8 chạy với probe này (S1 PASS 6, FAIL 0).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round186-t8). **F-181-T8-5: ÁP DỤNG CHO #107** (repair-sớm-quyết-h, poll=1, CÓ caveat — giống #101/#104-caveat, khác #102/#99/#95 replay-đầy-đủ). **F-181-T8-6 (gst-inspect vắng): TÁI DIỄN DƯỚI DẠNG MỚI — xem F-186-T8-1. **F-181-T8-7: ĐÃ QUYẾT (c) đợt 183 — tổng GIỮ 23 (24 nếu parent chấp nhận #105 KHÔNG cờ — T5-186). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #107, không reboot trong phiên)

- Driver harness (pid 127993) đã thoát sau pha cuối (18:44:18Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 18:49:45Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 101 cooldown — extract xác nhận).
- Kiểm cuối ~18:52Z (trên #107): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` chỉ còn **X193** (mồ côi của T4; không phải của T8).
- Fixture /tmp: **ĐÃ REBUILD 18:28Z (md5 khớp đợt 125)** — vẫn còn lúc đóng (chưa có reboot mới sau đó).
- **Reboot #107 (boot `cea79500`, btime 17:19:50Z):** xảy ra TRƯỚC khi T8 mở phiên; **0 reboot trong cửa sổ đo (18:28–18:49Z).** dpkg.log 768 dòng (repair). #107 XÁC NHẬN 9 nguồn tươi (T0-186); #106 CHƯA XÁC MINH (F-186-T0-1); (m) #104/#105 + INSIDE #104/#105 thuộc T2-186; (m) #56 lần 29 (T2-186).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`.** Không chạy script nặng khi T4 gate0wait/attempt (B2 + offline TRƯỚC cửa yên mở 17:53Z; fixture + harness SAU khi T4 đóng cờ 18:25Z).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 6/6 — WebKit 3/3 PASS + Chromium 3/3 PASS.** **Kẹt cộng dồn GIỮ 26 — 0 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 a97a3831/1c01f397; Chromium 21/21 md5 09dd510e).** O8 T0 PASS 3/3 trên #107 theo cờ T0-186.
3. **Chuỗi WebKit FULL PASS 1 → 0 (ĐỨT, đề xuất) — thiếu chân lượt yên #55.** Không phải FAIL sản phẩm. **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS #107 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat)** — gate (a) #107 ĐẠT CÓ caveat. **#105 KHÔNG CÓ cờ** (tổng boot không cờ 23 → 24 nếu parent chấp nhận). **#106 CHƯA XÁC MINH** (T0-186).
5. **Balloon max 88,6% trần trong cửa sổ harness (n=33, avail min 534 MB, pinned=0)** — KHÔNG ghim trần lần nào; KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push.**
7. **Chuỗi verdict: 84l10 PASS đợt này (lần 6 trong 8 đợt gần nhất; 182 + 184 KHÔNG ĐO ĐƯỢC — parent/T10 quyết có nối chuỗi 5 không); 86n2-P1 không kẹt lần 9 nếu tính tiếp (parent/T10 quyết); B2 ĐÃ MỞ (offline ĐẠT, live sạch — chưa bắt kẹt thật); B1 live sạch lần thứ tư nếu tính tiếp (parent quyết).** H3 ỦNG HỘ MẠNH HƠN (đứng nguyên từ 183).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — live 0 kích hoạt (không có kẹt thật); replay V2 4/4 @125 s, V1-300 3/4, 0 FP cả hai trên 21 log sạch duy nhất (md5 — xem F-186-T8-3).** V1 chỉ còn đối chứng trong replay.
10. **T7/T9 CHƯA ĐÓNG CỜ lúc T8 đóng** — số T7/T9 thuộc các luồng đó + T10-186. **T4 đóng 18:25Z với lượt yên #55 KHÔNG HỢP LỆ (có cờ `.done`).**
11. **#107 XÁC MINH 9 nguồn tươi (T0-186); #106 CHƯA XÁC MINH (F-186-T0-1); marker 59 reboot;** (m) #104/#105 + INSIDE #104/#105 thuộc T2-186; (m) #56 lần 29 (T2-186).
12. **T8 ĐÓNG ~18:55Z, TRONG hạn cờ ~20:00Z và hạn cứng ~20:35Z** (dù chờ T4 tới 18:25Z + rebuild fixture). 0 reboot trong phiên T8.

## 8. Sai số mới (F-186-T8-N) + nợ cũ đã xử lý

- **F-186-T8-1 — SELFCHECK GST = 0 LÀ VẤN ĐỀ PHƯƠNG PHÁP ĐO, KHÔNG PHẢI LIB THIẾU (T8 TỰ BẮT, ĐÃ LÀM RÕ):** selfcheck #1 (17:54:46Z) + #2 (18:50Z) đều ghi GST plugins = 0, trong khi đợt 185 ghi 1624 trên #104. Nguyên nhân: binary `gst-inspect-1.0` VẮNG trên #107 (gói `gstreamer1.0-tools` không cài; `find /usr -name "gst-inspect*"` 0 kết quả) nên `gst-inspect-1.0 | wc -l` = 0. Thư mục plugin `/usr/lib/x86_64-linux-gnu/gstreamer-1.0/` vẫn có **269 file .so** (khớp số `gst_sys=269` của T5-186) + 79 lib `libgst*` + `libgstreamer-1.0.so.0` CÓ — lib media đầy đủ. T5-186 cũng ghi "tools chua cai" trong caveat POSTBOOT_PASS #107. Harness WebKit 3/3 PASS là bằng chứng quyết định. Nợ: selfcheck sau nên đếm plugin dir (269) kèm `gst-inspect`, hoặc ghi rõ "GST tools vắng" thay vì "GST 0".
- **F-186-T8-2 — SYMLINK THỨ HAI CẬP NHẬT MUỘN (T8 TỰ BẮT, ĐÃ SỬA TRONG PHIÊN):** checklist copy driver chỉ cập nhật 1/2 symlink lúc copy (goals `t8-diag-stall.sh` → round186-t8 lúc ~17:49Z); symlink `apps/web/scripts/t8-diag-stall.sh` vẫn trỏ round185-t8 tới 18:46Z, SAU harness — phát hiện khi extract lần 1 in "symlink repo: .../round185-t8/...". **Không ảnh hưởng:** 0 lần gọi diag-stall trong harness nên diag-stall cũ không bao giờ được gọi; cả hai symlink đều → round186-t8 lúc đóng (extract lần 2 xác nhận). Bài học: kiểm CẢ HAI symlink bằng extract NGAY sau copy.
- **F-186-T8-3 — ĐẾM LOG SẠCH LỆCH +1 SO VỚI CHUỖI LỊCH SỬ (T8 TỰ BẮT, CHƯA NGÃ NGŨ — PARENT/T10 QUYẾT SỐ CHUẨN):** replay đợt này: 23 entry `*-sach-*` trong LOGS, md5 file thật cho **21 duy nhất** (2 cặp trùng byte-identical 181/182 — đúng tiền lệ F-183-T8-1). Chuỗi lịch sử: 183 = 16, 184 = 16, 185 = 18. Đếm md5 trên cùng tập: 183 = 17, 184 = 17, 185 = 19 — **lịch sử thấp hơn md5-unique đúng 1 ở cả 3 đợt**. Chưa rõ entry nào bị loại theo quy tắc cũ (nghi `163-sach-85m4` là log chuẩn C5.1 nên không tính — giả thuyết, chưa xác minh). T8 KHÔNG tự sửa số lịch sử; đợt này ghi **21 (md5, có bằng chứng)** + ghi rõ lệch. 0 FP không đổi theo cả hai cách đếm.
- **F-186-T8-4 — NHÃN "ovsize LIMITS 184" TRONG EXTRACT VẪN CŨ (ghi nhận, cosmetic):** extract-186t8.py in "ovsize LIMITS 184: 37708" — đúng ra phải là LIMITS 185 (37708 B là kích thước LIMITS 184 theo §5 đợt 185). Cùng họ F-183-T8-5. Không ảnh hưởng số đếm; sửa nhãn ở đợt sau.
- **F-186-T8-5 — COPY DRIVER GẶP SYMLINK GÃY TRONG o8-chromium (T8 TỰ BẮT, ĐÃ XỬ LÝ):** `shutil.copytree` 185→186 lỗi ở `o8-chromium/chrome-userdata/SingletonLock|SingletonSocket|SingletonCookie` (symlink gãy — đích đã mất theo reboot). Đã sửa script copy: loại `o8-webkit`/`o8-chromium` khỏi copy, tạo lại thư mục trống (O8 driver tạo lại nội dung khi chạy — O8 T8 3/3 PASS). Không mất dữ liệu (log O8 185 còn trong `o8-185t8.log` + smoke/archive-185).
- **F-185-T8-4 — ĐÃ SỬA (T0-186):** boot-survey stat đúng `~/.config/vcut-persistence-marker`; marker 59 reboot (T8 kiểm trực tiếp mtime không đổi).
- **F-184-T8-1 — KHÔNG TÁI DIỄN (xem §C4). F-183-T8-7 — KIỂM LẠI TRÊN #107: libevent-2.1.so.7 CÓ (selfcheck #1 + #2) — MiniBrowser chạy được cả 3 pha; T0-186 ghi heal lần 2 (vắng 17:41Z → có 17:50Z sau replay).**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG ĐỢT NÀY.** Dọn `smoke/` khỏi bản copy (185 smoke → `smoke/archive-185/`); replay baseline chạy sạch, không parse log stale. Các file stale vẫn nằm trong `smoke/archive-185/` (bằng chứng, không dùng).
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-186t8.sh` (cả 6 pha), KHÔNG chạy thêm `run-chromium-*` riêng.
- **F-183-T8-5 — NHÃN "ovsize LIMITS 181": ĐÃ SỬA ĐỢT 184 — NHƯNG NHÃN MỚI LẠI CŨ (xem F-186-T8-4). F-183-T8-8: ĐÃ SỬA ĐỢT 183, KHÔNG TÁI DIỄN. F-183-T8-2 — SOCKET X193 STALE: VẪN CÒN (của T4 — xem §E o6). F-183-T8-4 — (c') BỎ LỠ kẹt-183: V2 ĐÃ TRIỂN KHAI (§C); B2 mở rộng phủ sóng sang setup + P6 (§C1). F-183-T8-6 — REBOOT #102: ĐÃ GHI NHẬN ĐỢT 183; số hiệu #107 XÁC NHẬN đợt này (T0-186).**
- **F-182-T8-6 — EXTRACT KIỂM LIVE: ĐÃ ĐẠT ĐỢT 183, DÙNG LẠI ĐỢT NÀY (xem §5 — lần extract trước O8 đọc log cũ 185; đã chạy lại SAU O8, số O8 trong LIMITS này là số mới). F-181-T8-1: ĐÃ HẾT (181). F-181-T8-2/3/4: ĐÃ SỬA, KHÔNG TÁI DIỄN** (pilot trỏ đúng round186-t8; T8-3 ĐÃ KIỂM LIVE Ở 183 — ĐÓNG). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 183 — tổng GIỮ 23 (24 nếu parent chấp nhận #105 KHÔNG cờ). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS 1 → 0 (ĐỨT, đề xuất) — parent/T10 quyết** (4/5 chân cùng boot #107; thiếu chân lượt yên #55, chuỗi 47 → 0).
2. **B2 ĐÃ TRIỂN KHAI — parent ghi nhận** (offline ĐẠT 3/3 vùng trigger @125 s; live sạch đợt đầu — P6-wait 18 dòng/run, maxspan 85 s; chưa bắt kẹt thật; giới hạn §C5 đã ghi rõ).
3. **Chuỗi 84l10 PASS 5 đợt + chuỗi 86n2-P1 không kẹt 8 lần: NỐI hay GIỮ?** (đợt 186 WebKit PASS cả hai — nhưng 182 + 184 KHÔNG ĐO ĐƯỢC xen giữa; parent/T10 quyết — đề xuất 6 và 9).
4. **F-186-T8-3 (đếm log sạch lệch +1) — parent/T10 quyết số chuẩn** (21 theo md5 vs 18/19 theo chuỗi lịch sử; 0 FP không đổi).
5. **Reboot #107 (cea79500, btime 17:19:50Z) — XÁC NHẬN 9 nguồn tươi (T0-186); #106 CHƯA XÁC MINH (F-186-T0-1); (m) #104/#105 + INSIDE #104/#105 thuộc T2-186; POSTBOOT_PASS #107 ĐÃ CÓ (17:48:46Z, CÓ caveat); #105 KHÔNG CÓ cờ — tổng boot không cờ 23 → 24 nếu parent chấp nhận (T5-186).**
6. **Scheduler gap 15:15:34Z–17:35:40Z = 8.406 s tái diễn giống hệt OUTAGE 179 (T0-186 — số thô, T7-186 phán cuối); run 185 SUCCEEDED +232 s + run 186 SUCCEEDED (2 ứng viên CA ≥60 s, T7-186 phán cuối).**
7. **F-186-T8-1 (GST tools vắng) + F-186-T8-2 (symlink cập nhật muộn) + F-186-T8-4 (nhãn extract cũ) + F-186-T8-5 (copy gặp symlink gãy)** — parent ghi nhận; không đổi verdict.
8. **T7-186/T9-186 chưa đóng cờ lúc T8 đóng** (run 185/186 kết cục + cửa slot + headroom/ENOSPC/E-229 — thuộc các luồng đó + T10-186).
9. Mở từ trước, vẫn đứng: **#107 KHÔNG GIẾT HOLDER (chờ T6-186); (A) 120/120 lần 36 (T6-186); (m) #103 DƯƠNG +37,543 s (parent 185 quyết cuối); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck lần 30, T2-186); (m) #56 lần 29 (T2-186); G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 40 (T9-186); R9 (a) lần 21; file oversize 6,4 MB chưa quyết; u2net là fallback chính thức; fixture /tmp đã rebuild đợt này; KHÔNG PUSH — 200 batch / 296 entry / 272 đường dẫn / 268 file chờ user push (166–185) + batch đợt 186 (T10-186 đếm cuối).**
10. **F-186-T4-2/F-186-T4-3 (lượt yên #55: B2 vi phạm do burst tự-tải + median leo 60,0 → 68,0 → 79,0 ms)** — thuộc T4-186 + parent/T10 (đề xuất xem xét tách luật B2); T8 chỉ ghi nhận.
