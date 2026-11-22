# Đợt 145 T8 — O8 21/21 ×3 + HARNESS 6/6 QUA GATE SAU LƯỢT YÊN #20 HỢP LỆ (lần đầu sau 2 đợt) + REBOOT 0

Ngày: 19/11/2026 (lượt cron 15:35 +07 = 08:35:51Z; T8 mở ~08:41Z trên boot `e146ca67` btime 07:56:16Z = #108? chặt; T8 đóng ~09:19Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (mỗi bên ít nhất 1 lần, WebKit ×2 như đợt 143/144); (2) harness đứng 6/6 — QUA GATE ĐÚNG CHUẨN, LẦN NÀY CÓ lượt yên #20 hợp lệ đi kèm (khác đợt 144); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND144_T8_VITEHARNESS_LIMITS.md (harness 6/6 QUA GATE nhưng không có #19 hợp lệ đi kèm — lệch chuẩn F-144-T8-3, parent đã chấp nhận ở aggregate 144 §12.3(l)); docs/PHASE9_ROUND144_LIMITS.md §7, §12.3(b)(l) (lượt yên #19 nay đã hợp lệ qua hậu kiểm — số đếm 16; đợt 145 đo #20).

## 0. Kết luận ngắn — O8 PASS 3/3, HARNESS 6/6 QUA GATE SAU #20 HỢP LỆ, WATCHDOG 0 KÍCH HOẠT (ĐỢT THỨ 4 LIÊN TIẾP)

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (08:42:30–08:46:01Z, boot `e146ca67` ~46 phút tuổi lúc chạy, cùng cây preview.tsx `530e10a7` + cùng script O8 gốc md5 `ecbd1b40`, KHÔNG sửa). S1 PASS cả 3 lần ("checked=true → false, Playwright mouse click lần 2" WebKit; "CDP mouse click lần 2" Chromium). Report JSON: 21 kết quả, 0 fail cả hai engine (kiểm độc lập bằng python). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL). **KHÔNG có điều tra lại** — O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143, đợt này chỉ kiểm lại thường kỳ.
- **Chuỗi WebKit FULL PASS: 2 → 3 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 143 = 1, đợt 144 = 2 (T8 + T10 độc lập), đợt 145 T8 pass 21/21 ×2; nếu T10 cũng pass lúc đóng sổ thì chuỗi = 3 vững.
- **Lượt yên #20: HỢP LỆ NGAY attempt1** (cờ T4 08:59Z: attempt1-e146ca67 20/20 median 58,0 ms, B-ĐẠT 5/5, P1-YẾU 2/2, P3-A1-YẾU 2/2, P3'-ĐẠT 2/2, P7-ĐÚNG; cộng dồn 17 lượt: P1 51/51, P2 42/42, P3-A1 46/51, P3' 23/23, P7 37/37). T4 dùng đúng ngân sách mới (1/3 attempt, quyết (b) đợt 144); poller đã vá B4 chạy thật lần đầu và cho kết quả hợp lệ ngay — không còn giả-dương loại attempt như đợt 144.
- **Harness 6/6 PASS, exit 0 toàn bộ (09:01:27–09:17:29Z), 0 kẹt, 0 retry — QUA GATE ĐÚNG CHUẨN VÀ CÓ LƯỢT YÊN #20 HỢP LỆ ĐI KÈM** (xem §1): waiter GATE-FOUND poll 15 lúc 09:00:25Z (cờ T4 08:59Z + POSTBOOT_PASS đường (a) cho boot `e146ca67`, pass_at 08:45:28Z, poll=2). WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2. 86n2 WebKit P4-lần2 PASS (điểm kẹt đợt 141) + P6 KHÔNG-KẸT 90 s cả hai engine. **Đây là lần đầu tiên sau 2 đợt harness được trích đúng là "sau lượt yên hợp lệ"** — lệch chuẩn đợt 144 đã được sửa bằng kết quả thật, không phải bằng ghi chú.
- **Watchdog: 0 kích hoạt — vì 0 kẹt (F-145-T8-4):** 0 dòng `WATCHDOG-137` trong 6 log, 0 `LIVE-DIAG`, `live_diags=0` cả 6, 0 dir dump live mới. Bài kiểm thật đầu tiên của bản vá **VẪN CHƯA XẢY RA (đợt thứ tư liên tiếp)** — 24/24 lần chạy harness sạch sau vá.
- **Cây: preview.tsx `530e10a7` (GIỮ VĨNH VIỄN), media.ts `2c384ed1`, vite.config.ts `ee80d093`; 3 script harness md5 KHÔNG ĐỔI so với đợt 142/143/144 (b8c08a7c/610ee003/628088bd — bản vá watchdog còn nguyên).** Không sửa file repo nào khác ngoài LIMITS này.
- **0 reboot trong lúc T8 chạy** — boot `e146ca67` sống suốt lượt T8 (mở 08:41Z → đóng ~09:19Z). O8 + harness cùng một boot — khác đợt 144 (chia đôi boot vì reboot #31).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 08:35:51 19/11 | Lượt cron 15:35 +07 mở đợt 145; boot lúc mở `e146ca67` (btime 07:56:16Z, #108? chặt) |
| ~08:41 | T8 mở: RAM avail 484 MB, balloon 6.312.572 kB; đọc LIMITS T8-144 + aggregate 144 §7/§12.3(b)(l) |
| 08:41:46 | tree-md5-open: cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 144 (không đổi) |
| 08:41–08:42 | Fixture /tmp MẤT theo reboot #32 — rebuild: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549) |
| 08:42:30–08:46:01 | **Driver O8 chạy trên boot `e146ca67`: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) |
| 08:45:28 | T5 POSTBOOT_PASS cho boot `e146ca67` (poll=2, replay-full dpkg 1545/221) — đường (a) sẵn |
| 08:46:23 | Waiter T8 bắt đầu (deadline 10:30Z); postboot=1 từ poll 1, chỉ chờ cờ T4 |
| 08:48:25–08:53:03 | T4 poller chờ cửa yên (poll #2–#7; load1 2,57 → 0,50; RAM avail 2.857 → 2.021 MB); cửa yên mở poll #7 08:53:03Z (gate0 T5 + gateA đủ) → attempt1 chạy ngay |
| 08:53:03–08:57:13 | **T4 attempt1: 20/20 + lớp B ĐẠT 5/5 → LƯỢT #20 HỢP LỆ** (median 58,0 ms); poller thoát, dùng 1/3 ngân sách |
| 08:59:25 | T4 ghi cờ `round145-t4.done` (#20 hợp lệ, cộng dồn 17 lượt) |
| 09:00:25 | **GATE-FOUND poll 15 — waiter exit 0 (t4=OK + postboot đường (a), t4attempt=no-lock)** |
| 09:01:27–09:17:29 | **Harness 6/6 QUA GATE, SAU #20 HỢP LỆ (xem §2)** |
| ~09:19 | Kiểm cuối + LIMITS + stage file + cờ `round145-t8.done` — **T8 đóng** |

## A. O8 — PASS 3/3 trên boot `e146ca67` (không điều tra lại)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 08:42:30–08:43:48 | 0 | **21/21 PASS** — S0 PASS 08:42:48, S1 PASS 08:42:48 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 08:43:48–08:45:04 | 0 | **21/21 PASS** — S1 PASS 08:44:08, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 08:45:04–08:46:01 | 0 | **21/21 PASS** — S1 PASS 08:45:29 "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả `ok=true` 21/21; `o8-chromium/o8-clicktest-report.json` 21/21 `ok=true` (kiểm độc lập bằng python). WebKit launched 27.2 cả hai attempt. 0 dòng `HARNESS LỖI`, 0 `Target crashed` trong `o8-145t8.log`.
- Driver O8 giữ 1 lock vite `t8-round145` suốt lượt (giữ 212 s, đã nhả 08:46:01Z; vite sau release curl 5560/5554 = 000000 — đã kiểm trong driver).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-145t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 2 → 3 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 144 = 2 (T8 + T10 độc lập); đợt này T8 pass 21/21 ×2.
- **Caveat:** O8 chạy TRƯỚC khi T4 mở cửa yên (08:42–08:46Z, T4 attempt1 bắt đầu 08:53:03Z) — O8 không nhiễm tải vào phép đo yên của T4; thứ tự này giữ nguyên từ đợt 144.

## 2. Kết quả 6 lần chạy harness (6/6 PASS, 0 retry, QUA GATE SAU #20 HỢP LỆ)

| # | Pha | Harness | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|---|
| 1 | WebKit | 84l10 | 0 | 09:01:30–09:02:40 | **PASS** — W1 3/3 (delta +1 mỗi lần), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 2 | WebKit | 85m4-hb128 | 0 | 09:02:56–09:05:16 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,9/1,8/4,2 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 3 | WebKit | 86n2 | 0 | 09:05:31–09:09:32 | **PASS** — P1–P6 đủ (P4 3/3 delta +1, đồng bộ 1,8/1,9/2,0 s; P5 0 restart, seek kẹt 0 mẫu; P6 KHÔNG-KẸT 90 s) |
| 4 | Chromium | 84l10 | 0 | 09:09:47–09:10:57 | **PASS** — W1 3/3 (bộ đếm 0→1, 2→3, 4→5 — artifact Chromium đã biết), W2 PASS (playhead 29,967, restart tự nhiên Δ=1), E4 PASS |
| 5 | Chromium | 85m4-hb128 | 0 | 09:11:12–09:13:23 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,0/1,0/0,6 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 6 | Chromium | 86n2 | 0 | 09:13:38–09:17:28 | **PASS (ok=true)** — P1–P6 đủ (P4 3/3, đồng bộ 1,0/1,0/0,5 s; P5 0 restart, seek kẹt 0 mẫu; P6 KHÔNG-KẸT 90 s) |

- 6 report JSON đều `ok=true` (3 WebKit + 3 Chromium, kiểm độc lập bằng python — không chỉ đọc log).
- Fixture rebuild sau reboot #32: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- Gate: harness bắt đầu 09:01:27Z, 62 giây sau GATE-FOUND 09:00:25Z; T4 đã đóng cờ 08:59Z và không còn attempt nào đang chạy — 0 lần đo yên nào bị phiền (T4 đã xong toàn bộ trước khi harness bắt đầu).
- Khác đợt 144: đợt 144 harness qua gate nhưng KHÔNG có lượt yên hợp lệ đi kèm (lệch chuẩn F-144-T8-3); đợt này **#20 hợp lệ ngay attempt1** — harness đợt này trích đúng là "sau lượt yên #20 hợp lệ".

## 3. Watchdog trong lượt này — bài kiểm thật đầu tiên VẪN CHƯA XẢY RA (0 kẹt, đợt thứ tư liên tiếp)

- **0 kẹt thật đợt này** nên cả hai lớp watchdog mới đều không có dịp nổ: 0 dòng `WATCHDOG-137` trong 6 log lần chạy; 0 dòng `LIVE-DIAG` trong summary; 0 dir `stall-live-*` / `stall-*-timeout124-*` mới (chỉ có `diag-stall-145t8.sh` chưa dùng).
- **Vòng canh mtime đã chạy thật trên cả 6 lần chạy:** mỗi `run_one` poll mtime 10 s/lần trong suốt lần chạy (tổng ~16 phút chạy, `live_diags=0` cả 6 lần) — không false-positive nào dù W2 im lặng tới ~70 s và P5/P6 chờ 40–90 s (ngưỡng 120 s đủ dự trữ). `dev-url.txt` được ghi đúng cả 6 scratch (`http://127.0.0.1:5390/` / `:5490/`) — đường truyền devUrl cho diag live đã sẵn sàng, chỉ chưa có dịp dùng.
- **Kết luận:** bản vá (i)+(ii) đã triển khai đúng + chạy sạch qua 6/6 lần chạy đợt này (cộng dồn **24/24 lần chạy sạch sau vá, 4 đợt**), nhưng **CHƯA được kiểm chứng bằng kẹt thật** — đừng trích "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo (nếu có) mới là bài kiểm thật đầu tiên.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–145) + đường ổn định `t8-diag-stall.sh` → 145 (symlink đã cập nhật) | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 4 liên tiếp).** 24/24 lần chạy sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–145) | 6 lần chạy, poll 10 s/lần, `live_diags=0` cả 6 | **Chạy đúng, 0 false-positive.** `dev-url.txt` ghi đủ 6 scratch — đường devUrl sẵn sàng |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-145t8.sh` (cột `balloon_kb`) | Driver chạy → có `ram-145t8.log` đầy đủ (n=33 mẫu) | Balloon 4.181.036–5.646.236 kB trong lúc chạy harness; RAM avail 566–2.526 MB (xem F-145-T8-7) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** | N cộng dồn **N=7 mỗi pha** (đợt 137/139/141/142/143/144/145 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 0 restart + P6 PASS |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | 0 lần kẹt → không kích hoạt | Baseline đã lưu: dmesg EPERM tái xác nhận; journalctl -k `-- No entries --`. Cơ chế (ii) + devUrl thật chưa có dịp dùng |

## 5. Cây + md5 — mở / cuối (KHÔNG ĐỔI)

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không (fix GIỮ vĩnh viễn) |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | ecbd1b40 | ecbd1b40 | Không (script O8 gốc, chỉ đọc) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | 8911ad3d | 8911ad3d | Không (script O8 Chromium gốc, chỉ đọc) |

- Không sửa code app, không sửa script harness/O8 nào trong đợt này. Batch stage chỉ có LIMITS này (1 file).

## 6. Dọn dẹp + kiểm cuối — sạch (trừ 1 socket mồ côi của T4, như đợt 144)

- Driver O8 đã nhả lock `t8-round145` 08:46:01Z (giữ 212 s); driver harness đã nhả lock sau mỗi lần chạy (giữ tối đa ~241 s/lần).
- Driver harness đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm; lock `t8-round145` đã nhả.
- Kiểm cuối 09:18Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; không có `/tmp/.X199-lock` / `/tmp/.X188-lock`; không có `vite.lock` trong repo; lock vite TRỐNG (0 ticket + 99 cooldown).
- **Còn 1 socket mồ côi `/tmp/.X11-unix/X193` (của T4, Xvfb :193 — không còn process nào sở hữu; đã có từ đợt 144). T8 KHÔNG tự xóa socket của luồng khác — để T10 dọn lúc đóng sổ như tiền lệ đợt 143/144.**
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 566 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này QUA GATE VÀ CÓ lượt yên #20 hợp lệ đi kèm** — khác đợt 144 (lệch chuẩn F-144-T8-3 đã được sửa bằng kết quả thật). Trích đúng: "harness sau lượt yên #20 hợp lệ (attempt1, 20/20, median 58,0 ms)".
2. **"0 WATCHDOG" đợt này KHÔNG có nghĩa "watchdog đã kiểm chứng xong".** Có 0 kẹt thật để thử — đợt thứ tư liên tiếp. Bản vá mới chỉ qua smoke-test (đợt 142) + 24 lần chạy sạch.
3. **Balloon KHÔNG chạm trần trong lúc chạy harness** (F-145-T8-7): max 5.646.236 kB, dưới trần đóng băng 6.443.824 kB. Đừng trích trần 6.443.824 kB cho đợt này. (Balloon lúc T8 mở là 6.312.572 kB — gần trần nhưng đó là trước khi chạy, không phải trong lúc chạy.)
4. **P5 Chromium 86n2 0 restart đợt này** (như đợt 144; khác đợt 143 +1 `ended` tự nhiên) — 0 restart là trường hợp sạch; khác biệt đợt 143 chưa giải thích được, ghi nhận để đối chiếu, không kết luận regression.
5. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142/143/144 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
6. **Chuỗi WebKit FULL PASS = 3 CHỜ T10 xác nhận độc lập** — T8 pass 21/21 ×2 đợt này; nếu T10 pass lúc đóng sổ thì chuỗi = 3 vững, nếu không thì vẫn 2.

## 8. Sai số mới (F-145-T8-N)

- **F-145-T8-1 — /proc/1 mtime lệch btime +15 s (cùng họ F-143-T8-7 / F-144-T8-1):** driver harness ghi btime header `07:56:31Z` (lấy từ `stat -c %Y /proc/1`), trong khi btime thật theo `/proc/stat` là `07:56:16Z` (+15 s). Không ảnh hưởng lần chạy nào (chỉ là header log); T8 ghi rõ để T2/T7 không nhầm mốc. Không có reboot trong lúc T8 chạy nên không có khung chết nào cần hòa giải đợt này.
- **F-145-T8-2 — Fixture /tmp MẤT theo reboot #32, rebuild trước khi chạy:** reboot #32 (cc222c8a → e146ca67, btime 07:56:16Z) xóa /tmp; T8 rebuild fixture 08:41–08:42Z, 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549) + blend media bền còn nguyên (f1e277f0 / f4c35a6a). Không ảnh hưởng lần chạy nào (rebuild xong trước O8).
- **F-145-T8-3 — T4 poller chờ cửa yên ~5 phút (poll #2–#7, 08:48:25–08:53:03Z):** load1 đầu lượt 2,57–2,84 (tải từ các luồng khác + T5 sampler), tụt xuống 0,50 lúc poll #7 rồi cửa mở. Không phải kẹt gate0 (gate0 T5 PASS từ đầu, postboot đường (a) có sẵn 08:45:28Z) — chỉ là chờ tải lặng. Waiter T8 poll 1–14 GATE-NOT-YET trong lúc chờ, không có vấn đề gì.
- **F-145-T8-4 — 0 kẹt đợt này, chuỗi "P3 không kẹt" 3 → 4:** 6/6 lần chạy harness + 3/3 lần chạy O8, 0 kẹt, 0 FAIL. 86n2 WebKit P4-lần2 PASS (đồng bộ 1,9 s) — điểm kẹt đợt 141 không tái hiện lần thứ tư liên tiếp.
- **F-145-T8-5 — WebKit 85m4 P4-lần3 đồng bộ chậm 4,2 s (khác 1,8–2,0 s các lần còn lại):** vẫn PASS (delta=+1, hạ-cánh-về-target=true). Chậm một lần, không lặp lại ở lần 1/2 cùng pha (1,9/1,8 s) hay ở 86n2 (1,8/1,9/2,0 s) — ghi nhận là dao động, không kết luận regression.
- **F-145-T8-6 — Chromium 84l10 W2/E4 khác WebKit (ghi nhận, không kết luận regression):** W2 Chromium restart tự nhiên Δ=1 (WebKit Δ=0; playhead cuối 29,967 vs 30); E4 Chromium `ended=false`, ct cuối 3,958 (WebKit `ended=true`, ct cuối 4). Script vẫn verdict PASS cả hai (ok=true, dòng `E4 PASS` do script tự in). Khác biệt này chưa có ở dữ liệu chi tiết đợt 144 để đối chiếu trực tiếp (LIMITS 144 không ghi chi tiết E4 Chromium) — ghi nhận để T8 đợt sau đối chiếu, không đổi verdict.
- **F-145-T8-7 — Balloon trong lúc chạy harness 4.181.036–5.646.236 kB, RAM avail 566–2.526 MB (n=33 mẫu):** max balloon 5.646.236 kB (lúc 09:16:58Z, avail 582 MB) — KHÔNG chạm trần đóng băng 6.443.824 kB. Avail min 566 MB trong lúc chạy (thấp hơn lúc kẹt đợt 141 bắt đầu ~687 MB) — H1 (ngưỡng RAM tuyệt đối) tiếp tục BỊ BÁC BỎ. Balloon lúc T8 mở 6.312.572 kB đã xả xuống 4.181.036 kB lúc harness bắt đầu (09:01:27Z) — xả ~2,1 GB giữa O8 và harness; tương quan ghi nhận, không kết luận nhân quả (H2 vẫn KHÔNG ỦNG HỘ).
- **F-145-T8-8 — Nhãn log `LIVE-DIAG-143` giữ nguyên từ đợt 143:** driver run-webkit-145t8.sh (copy từ đợt 144) vẫn in nhãn `LIVE-DIAG-143` cho diag live (0 lần đợt này). Nhãn cũ chỉ là chuỗi log, không đổi hành vi; T8 không sửa để tránh chạm driver đang chạy ổn định — T10/T8 đợt sau đổi nhãn nếu muốn.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 3 (chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 145).**
2. **Lượt yên #20 HỢP LỆ ngay attempt1 (median 58,0 ms; cộng dồn 17 lượt)** — poller đã vá B4 chạy thật lần đầu và cho kết quả hợp lệ ngay; không còn giả-dương loại attempt như đợt 144. Việc T4, không phải T8 — T8 chỉ ghi nhận để trích gate cho đúng.
3. **Điều tra kẹt chung VẪN MỞ** (H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ) — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.
4. **Watchdog VẪN CHƯA được thử bằng kẹt thật** (4 đợt liên tiếp 0 kẹt) — giữ nguyên bản vá, không revert (quyết parent đợt 142/143/144 §12.3(l)).
5. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.
6. Socket mồ côi `/tmp/.X11-unix/X193` (của T4, từ đợt 144) — T10 dọn lúc đóng sổ.

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 145

## B1. Trạng thái giả thuyết sau đợt 145

| Giả thuyết | Trạng thái đợt 144 | Trạng thái đợt 145 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Đợt này 0 kẹt dù RAM avail xuống 566 MB trong lúc chạy harness (thấp hơn lúc kẹt đợt 141 bắt đầu ~687 MB) — không có ngưỡng RAM tuyệt đối nào phân tách kẹt/pass |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | 0 kẹt đợt này nên không có mẫu mới; balloon max 5.646.236 kB, không chạm trần 6.443.824 kB — chỉ là tương quan |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | 0 kẹt đợt này — không thêm mẫu nào; bản vá watchdog (i)+(ii) đã sẵn sàng để bắt bằng chứng live ở lần kẹt sau |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 145

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–145) + đường ổn định `t8-diag-stall.sh` → 145 | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 4 liên tiếp).** 24/24 lần chạy harness sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–145) | 6 lần chạy harness, `live_diags=0` cả 6 | Chạy đúng, 0 false-positive; `dev-url.txt` đủ 6 scratch |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | Driver chạy → có `ram-145t8.log` (n=33) | Balloon 4,18–5,65 GB, RAM avail 566–2.526 MB trong lúc chạy harness; KHÔNG chạm trần 6.443.824 kB |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** | N cộng dồn **N=7 mỗi pha** (đợt 137/139/141/142/143/144/145 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124, truyền devUrl thật) | 0 lần kẹt → không kích hoạt | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3)

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 145: 6 LẦN CHẠY HARNESS, 0 KẸT (CHUỖI 3 → 4)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL** (không retry). Chuỗi "P3 không kẹt" **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **2 → 3**.
- Đợt 145: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **3 → 4**.
- Bốn lần kẹt vẫn là: đợt 134/135 (3 lần) + đợt 141 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=7 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — đợt 145: không có yếu tố chung mới (0 kẹt). 0 reboot trong lúc T8 chạy — boot `e146ca67` sống suốt lượt. Vite server còn sống lúc chạy: cả 6 lần chạy harness đều tới được `vite dev sẵn sàng` + `dev-url.txt` ghi đủ — không có bằng chứng vite chết đợt này (nhưng cũng không có kẹt để kiểm vite-HTTP lúc kẹt). T4 #20 hợp lệ ngay attempt1 (20/20, median 58,0 ms) — poller đã vá B4 chạy thật lần đầu, không giả-dương.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143 (trạng thái boot mới); đợt này O8 PASS 3/3 thường kỳ, chuỗi FULL PASS 2 → 3 (chờ T10 xác nhận độc lập).** Không mở điều tra mới; nếu O8 WebKit FAIL lại ở đợt 146 thì mở điều tra lại từ đầu.
- **Lượt yên #20 hợp lệ ngay attempt1 — lệch chuẩn đợt 144 (harness qua gate nhưng không có lượt yên hợp lệ) đã được sửa bằng kết quả thật.** Harness đợt này trích đúng là "sau lượt yên #20 hợp lệ".
- **Bản vá watchdog đợt 142 là bước kiểm mới nhất**: nếu đợt này (hoặc đợt sau) có kẹt thật mà watchdog (i) và/hoặc (ii) nổ, đó sẽ là bằng chứng live đầu tiên về trạng thái browser lúc kẹt (ps/RSS, vite-HTTP, probe 1+1).

## B7. Bằng chứng mới từ đợt 145 — O8 PASS 3/3, HARNESS 6/6 QUA GATE SAU #20 HỢP LỆ, 0 REBOOT

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot `e146ca67`; S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness: WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2, toàn bộ PASS exit 0, 0 FAIL oan, 0 retry — **QUA GATE SAU LƯỢT YÊN #20 HỢP LỆ** (waiter GATE-FOUND poll 15, 09:00:25Z; cờ T4 08:59Z + POSTBOOT_PASS đường (a) cho boot `e146ca67` pass_at 08:45:28Z; #20: attempt1 20/20 median 58,0 ms, cộng dồn 17 lượt).
- Vá watchdog (i)+(ii) GIỮ NGUYÊN, 0 kích hoạt đợt thứ tư liên tiếp (0 kẹt); 24/24 lần chạy harness sạch sau vá.
- 0 WATCHDOG-137 trong 6 log — nhưng đây là 0 kẹt, không phải "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo mới là bài kiểm thật đầu tiên của bản vá.
- Sampler: balloon 4,18–5,65 GB, RAM avail 566–2.526 MB trong lúc chạy harness (KHÔNG chạm trần 6.443.824 kB).
- 0 reboot trong lúc T8 chạy; O8 + harness cùng một boot `e146ca67` (khác đợt 144 chia đôi boot). `/tmp/.X11-unix/` còn 1 socket mồ côi X193 của T4 lúc kiểm cuối (09:18Z).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round145-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary, **đường dẫn TƯƠNG ĐỐI**): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142/143/144; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round145-t8/` (run-webkit-145t8.sh — ĐÃ CHẠY 6/6 QUA GATE SAU #20 HỢP LỆ; diag-stall-145t8.sh — KHÔNG DÙNG (0 kẹt); rebuild-fixtures-145t8.sh — ĐÃ DÙNG sau reboot #32 (6/6 md5 khớp); wait-t4-t5-145t8.sh — ĐÃ CHẠY, GATE-FOUND poll 15 exit 0 (deadline 10:30Z); o8-driver-145t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21); o8-s1-probe-145t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-145t8.py — KHÔNG DÙNG đợt này (probe đã có sẵn từ đợt 144, không cần tạo lại); smoke/wait-t4-t5.log (waiter poll 1–15, GATE-FOUND 09:00:25Z); smoke/run-webkit-summary.txt (driver 09:01:27–09:17:29Z, ec webkit 0/0/0; chromium 0/0/0); smoke/ram-145t8.log (sampler 30 s, n=33, có cột balloon_kb); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy); smoke/attempt1/ (snapshot 6 log + summary); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai; 3 script b8c08a7c/610ee003/628088bd cả hai; O8 ecbd1b40/8911ad3d cả hai); smoke/baseline-dmesg-tail50.txt + smoke/baseline-journalctl-k.txt (dmesg EPERM + journalctl rỗng); smoke/baseline-meminfo.txt (09:01Z, boot e146ca67); o8-145t8.log + o8-lock.log (driver O8 08:42:30–08:46:01Z); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round145-t8/diag-stall-145t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild sau reboot #32 (round76-d8, round81-i7, l10, m4, n2 — 6/6 md5 khớp).
