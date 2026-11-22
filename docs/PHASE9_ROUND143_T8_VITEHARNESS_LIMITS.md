# Đợt 143 T8 — ĐIỀU TRA O8 WebKit FAIL (quyết parent (b) đợt 142) + HARNESS 6/6 (KHÔNG QUA GATE)

Ngày: 19/11/2026 (lượt cron 09:35 +07 = 02:35:51Z; T8 mở ~02:40Z trên boot `70a5b0fc`, REBOOT giữa lúc chờ gate → boot `691a7403` btime 03:55:45Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) ĐIỀU TRA O8 WebKit FAIL đợt 142 — ưu tiên cao nhất (quyết parent (b)); (2) harness đứng 6/6; watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND142_T8_VITEHARNESS_LIMITS.md (vá watchdog xong, harness 6/6, 0 kẹt — watchdog chưa được thử bằng kẹt thật).

## 0. Kết luận ngắn — O8 KHÔNG TÁI HIỆN (KẾT LUẬN TRẠNG THÁI BOOT MỚI), HARNESS 6/6 PASS

- **O8 WebKit FAIL đợt 142 KHÔNG tái hiện — kết luận trạng thái boot mới (theo đúng quyết parent (b) "nếu pass sau reboot thì kết luận trạng thái boot mới"):** trên boot mới `691a7403` (~2,5 phút tuổi lúc chạy), cùng cây preview.tsx `530e10a7` + cùng script O8 gốc (md5 `ecbd1b40`, KHÔNG sửa): WebKit attempt1 03:58:12–03:59:15Z **21/21 PASS exit 0**, S1 PASS "checked=true → false, Playwright mouse click lần 2"; attempt2 03:59:15–04:00:12Z **21/21 PASS exit 0**, S1 PASS y hệt; Chromium đối chứng 04:00:12–04:01:05Z **21/21 PASS exit 0**. Report JSON: 21 kết quả, 0 fail cả hai engine. Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Chuỗi WebKit FULL PASS đếm lại từ 0 → 1** (đứt ở đợt 142, nay pass lại ở đợt 143; T10 chạy lại O8 lúc đóng sổ để xác nhận độc lập).
- **Harness 6/6 PASS, exit 0 toàn bộ (04:51:44–05:07:14Z), 0 kẹt, 0 retry:** WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2. 86n2 WebKit P4-lần2 PASS (điểm kẹt đợt 141) + P6 KHÔNG-KẸT 90 s.
- **Harness chạy KHÔNG QUA GATE** (xem F-143-T8-2): gate không mở — T4 kẹt ở gate0-poll, 0 attempt lượt yên #19 trong 47 phút sau reboot dù điều kiện xanh; waiter-b hết hạn 04:50Z. T8 chạy harness sau khi xác nhận T4 không đo (0 attempt, lock trống, load ~1) và ghi rõ lệch chuẩn này để parent xét.
- **Watchdog: 0 kích hoạt — vì 0 kẹt (F-143-T8-5):** 0 dòng `WATCHDOG-137` trong 6 log, 0 `LIVE-DIAG-143`, `live_diags=0` cả 6, 0 dir dump live mới. Bài kiểm thật đầu tiên của bản vá VẪN CHƯA XẢY RA (không có kẹt thật để thử — đợt thứ hai liên tiếp).
- **Cây: preview.tsx `530e10a7` (GIỮ VĨNH VIỄN), media.ts `2c384ed1`, vite.config.ts `ee80d093`; 3 script harness md5 KHÔNG ĐỔI so với đợt 142 (b8c08a7c/610ee003/628088bd — bản vá watchdog còn nguyên).** Không sửa file repo nào khác ngoài LIMITS này.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 02:35:51 19/11 | Lượt cron 09:35 +07 mở đợt 143; `round-in-progress.md` tạo; boot lúc mở `70a5b0fc` (btime 01:55:25Z) |
| ~02:40 | T8 mở: RAM avail 441 MB, balloon 5.323.836 kB; đọc LIMITS T8-142 + log O8 T10-142 |
| 02:44–02:46 | Chuẩn bị xong: adapt `run-webkit-143t8.sh` / `diag-stall-143t8.sh` / `rebuild-fixtures-143t8.sh` (`bash -n` OK); symlink `t8-diag-stall.sh` → 143; tree-md5-open (530e10a7; 3 script harness khớp md5 đợt 142); probe S1 `o8-s1-probe-143t8.mjs` (`node --check` OK); driver O8 `o8-driver-143t8.sh` (`bash -n` OK) |
| 02:45:57 | Waiter1 bắt đầu (deadline 04:50Z); T4 đang poll chờ gate, T5 đang repair boot 70a5b0fc |
| 03:55:45 | **REBOOT (70a5b0fc → 691a7403, btime 03:55:45Z)** — giết waiter1 (SIGTERM ~03:56Z, poll 69) + poller T4; T4 tự khởi động lại poller 03:56:50Z; T5-143 đã đóng cờ trước reboot nên KHÔNG có POSTBOOT_PASS mới (xem F-143-T8-1) |
| 03:58:06 | Waiter2 bắt đầu (bản cũ — chỉ chấp nhận cờ T5) |
| 03:58:12–04:01:05 | **Driver O8 chạy trên boot mới ~2,5 phút tuổi: WebKit 21/21 ×2 attempt + Chromium 21/21 — FAIL KHÔNG tái hiện** (xem §A) |
| 04:04:05 | Waiter-b bắt đầu (bản vá — chấp nhận thêm postboot đường (b) log gate0wait live của T4, xem F-143-T8-3) |
| 04:50:07 | **Waiter-b hết hạn (poll 47, exit 3) — GATE KHÔNG MỞ** (t4=0 suốt, postboot=1 suốt) |
| 04:51:14–04:51:44 | Rebuild fixture /tmp (đã mất theo reboot): 6/6 md5 khớp đợt 125; bắt đầu harness |
| 04:51:44–05:07:14 | **Harness 6/6 (xem §2) — KHÔNG qua gate, có ghi rõ (F-143-T8-2)** |
| ~05:09 | Kiểm cuối + LIMITS + stage file + cờ `round143-t8.done` — **T8 đóng** |

## A. Điều tra O8 WebKit FAIL đợt 142 — KHÔNG TÁI HIỆN

### A1. Bằng chứng gốc (đợt 142, T10)

- O8 WebKit FAIL exit=2 CẢ HAI attempt trên boot `70a5b0fc` ~7 phút tuổi (attempt1 02:02:24–02:02:34Z, attempt2 02:03:16–02:04:14Z): S0 PASS (mẫu tự load — 3 clip), **S1 FAIL "tắt auto-proxy trước khi import (setup, WebKit) — toggle={ok:false, method:mouse, detail:không đo được rect checkbox tự tạo proxy}"**, rồi **`page.setInputFiles: Target crashed`** tại `clicktest-87o8-mask-track-webkit.mjs:534`. 0/21 test hoàn thành. Vite log sạch (ready 190/240 ms). Chuỗi WebKit FULL PASS 19 đợt (123–141) đứt.
- Điểm mấu chốt về thời gian (T8 đo lại từ log T10-142): S0 PASS 02:04:13.443Z → S1 FAIL 02:04:13.470Z — **chỉ 27 ms**. Vòng `toggleCheckboxTo` làm 2 lần `evaluate` (AUTO_UI_FN rồi rectFn) mà cả hai đều trả null trong 27 ms: phù hợp với target đã chết (evaluate ném lỗi ngay, `catch → null`) hơn là với trang sống nhưng label vắng (2 evaluate trên trang sống thường chậm hơn, và sau đó `setInputFiles` cũng chết `Target crashed` ~1 s sau). Đây là chỉ dấu (a) renderer chết, không phải (b) label vắng khỏi DOM — nhưng chưa đủ để kết luận một mình (xem A3).

### A2. Phương pháp điều tra (đợt 143)

- Chạy lại script O8 WebKit GỐC trong repo (md5 `ecbd1b40`, KHÔNG sửa một dòng) qua driver riêng `o8-driver-143t8.sh` (giữ 1 lock vite `t8-round143`, mỗi lần chạy bọc `timeout 480`): attempt1 → probe S1 (chỉ khi FAIL) → attempt2 → Chromium đối chứng (script headed gốc).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-143t8.mjs` — copy script gốc + khối chẩn đoán sau S1, dừng trước S2; `node --check` OK; S1 giữ nguyên từng dòng): ghi `AUTO_UI_FN` kèm lỗi, số label "Tự tạo proxy", tổng số label, số checkbox, `1+1`, `STORE_FN`, `page.isClosed()`, `browser.version()`, `pageErrs`, screenshot — để phân biệt (a) renderer chết (evaluate ném lỗi) vs (b) renderer sống nhưng label vắng. **Probe KHÔNG cần chạy** vì attempt1 đã PASS (theo thiết kế driver).
- Điều kiện chạy: boot mới `691a7403` btime 03:55:45Z — O8 chạy 03:58:12Z, tức boot ~2,5 phút tuổi (TƯƠI HƠN cả lúc T10-142 chạy trên boot 70a5b0fc ~7 phút tuổi). Nếu FAIL là do "trạng thái boot mới" thì đây là điều kiện tái hiện mạnh nhất; nếu pass thì kết luận theo quyết parent (b).

### A3. Kết quả — 3/3 lần chạy 21/21 PASS

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 03:58:12–03:59:15 | 0 | **21/21 PASS** — S0 PASS 03:58:26, S1 PASS 03:58:28 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 03:59:15–04:00:12 | 0 | **21/21 PASS** — S1 PASS 03:59:27 "checked=true → false, Playwright mouse click lần 2" |
| 3 | O8 Chromium (đối chứng) | 04:00:12–04:01:05 | 0 | **21/21 PASS** — S1 PASS "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả 0 fail; `o8-chromium/o8-clicktest-report.json` 21 kết quả 0 fail. WebKit launched 27.2 cả hai attempt. 0 dòng `HARNESS LỖI`, 0 `Target crashed` trong `o8-143t8.log`.
- **Kết luận (quyết parent (b) đợt 142): FAIL đợt 142 là do TRẠNG THÁI BOOT 70a5b0fc, không phải do trang/proxy-toggle.** Bằng chứng: (i) cùng cây + cùng script, FAIL không tái hiện trên boot mới — thậm chí boot mới còn tươi hơn (2,5 phút vs 7 phút); (ii) S1 trên boot mới cần đúng 2 lần click chuột mới lật trạng thái — Y HỆT hành vi S1 trên Chromium đợt 142 (và Chromium đợt này), tức checkbox + label đều đo được, chỉ có lần click đầu chưa lật (đặc tính click, không phải lỗi); (iii) chữ ký FAIL đợt 142 (S1 chết trong 27 ms + Target crashed ngay sau) là chữ ký renderer chết, khác hẳn hành vi trang sống. Trang/proxy-toggle BỊ LOẠI với tư cách nguyên nhân (cùng code trang, S1 pass 2/2 lần WebKit + 1/1 Chromium).
- **Chuỗi WebKit FULL PASS đếm lại từ 0 → 1** (đợt 143 pass; T10 chạy lại O8 lúc đóng sổ để xác nhận độc lập — nếu T10 cũng pass thì chuỗi = 1 vững, nếu T10 FAIL lại thì điều tra mở lại).
- **Caveat trung thực:** kết luận "trạng thái boot mới" là kết luận loại trừ (pass sau reboot + chữ ký renderer chết), KHÔNG phải đã chỉ ra được cơ chế cụ thể trên boot 70a5b0fc (replay chết dạng B? apt chưa xong? WebProcess chết sớm?). Boot 70a5b0fc đã chết theo reboot 03:55:45Z nên không còn kiểm lại được. T5-143 đã ghi: replay boot 70a5b0fc CHẾT DẠNG (B) lần 4 (dpkg chỉ 2 dòng 01:55:55Z rồi im; --repair lần 1 FAIL timeout 1500 s, lần 2 PASS 03:13:53Z) — đây là ứng viên nguyên nhân mạnh nhất còn lại, nhưng T8 KHÔNG tự kết luận nhân quả vượt bằng chứng.

## 2. Kết quả 6 lần chạy harness (6/6 PASS, 0 retry, KHÔNG qua gate)

| # | Pha | Harness | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|---|
| 1 | WebKit | 84l10 | 0 | 04:51:47–04:52:57 | **PASS** — W1 3/3 (delta +1 mỗi lần), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 2 | WebKit | 85m4-hb128 | 0 | 04:53:12–04:55:23 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,2–1,8 s; P5 40 s 0 restart dư) |
| 3 | WebKit | 86n2 | 0 | 04:55:38–04:59:38 | **PASS** — P1–P6 đủ (P4 3/3 delta +1; P5 PASS; P6 KHÔNG-KẸT 90 s) |
| 4 | Chromium | 84l10 | 0 | 04:59:53–05:00:53 | **PASS** — W1 3/3, W2 PASS, E4 PASS (W1-lần2 delta=+2 là artifact ghi đè ended, đã biết) |
| 5 | Chromium | 85m4-hb128 | 0 | 05:01:09–05:03:09 | **PASS** — P1–P5 đủ |
| 6 | Chromium | 86n2 | 0 | 05:03:24–05:07:14 | **PASS (ok=true)** — P1–P4 đủ; P5 CÓ-RESTART (+1) xem F-143-T8-4; P6 KHÔNG-KẸT 90 s |

- 6 report JSON đều `ok=true`. Fixture rebuild sau gate: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- T4 KHÔNG bị phiền bởi harness: trong lúc harness chạy, poll T4 #93/#94 (05:06:06Z/05:06:51Z) thấy lock `t8-round143` (blockers=5) nhưng KHÔNG attempt nào chạy; poll #95 (05:07:36Z, sau khi T8 nhả lock) blockers=0; T4 vẫn chưa có cờ `.done` lúc T8 đóng. Harness không cướp lần đo nào — vì không có lần đo nào đang chạy.

## 3. Watchdog trong lượt này — bài kiểm thật đầu tiên VẪN CHƯA XẢY RA (0 kẹt, đợt thứ hai liên tiếp)

- **0 kẹt thật đợt này** nên cả hai lớp watchdog mới đều không có dịp nổ: 0 dòng `WATCHDOG-137` trong 6 log lần chạy; 0 dòng `LIVE-DIAG-143` trong summary; 0 dir `stall-live-*` / `stall-*-timeout124-*` mới (chỉ có `diag-stall-143t8.sh` chưa dùng).
- **Vòng canh mtime đã chạy thật trên cả 6 lần chạy:** mỗi `run_one` poll mtime 10 s/lần trong suốt lần chạy (tổng ~15,5 phút chạy, `live_diags=0` cả 6 lần) — không false-positive nào dù W2 im lặng tới ~70 s và P5/P6 chờ 40–90 s (ngưỡng 120 s đủ dự trữ). `dev-url.txt` được ghi đúng cả 6 scratch (`http://127.0.0.1:5390/` / `:5490/`) — đường truyền devUrl cho diag live đã sẵn sàng, chỉ chưa có dịp dùng.
- **Kết luận:** bản vá (i)+(ii) đã triển khai đúng + chạy sạch qua 6/6 lần chạy đợt này (cộng dồn 12/12 lần chạy sạch sau vá, 2 đợt), nhưng **CHƯA được kiểm chứng bằng kẹt thật** — đừng trích "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo (nếu có) mới là bài kiểm thật đầu tiên.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143) + đường ổn định `t8-diag-stall.sh` → 143 | 6 lần chạy, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 2 liên tiếp).** 12/12 lần chạy sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143) | 6 lần chạy, poll 10 s/lần, `live_diags=0` cả 6 | **Chạy đúng, 0 false-positive.** `dev-url.txt` ghi đủ 6 scratch — đường devUrl sẵn sàng |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-143t8.sh` (cột `balloon_kb`) | Driver chạy → có `ram-143t8.log` đầy đủ (n=32 mẫu) | Balloon 4.993.568–6.027.056 kB trong lúc chạy; RAM avail 491–1.731 MB (xem F-143-T8-6) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** | N cộng dồn **N=5 mỗi pha** (đợt 137/139/141/142/143 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 (xem F-143-T8-4) + P6 PASS |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | 0 lần kẹt → không kích hoạt | Baseline đã lưu: dmesg EPERM tái xác nhận; journalctl -k `-- No entries --`. Cơ chế (ii) + devUrl thật chưa có dịp dùng |

## 5. Cây + md5 — mở / cuối (KHÔNG ĐỔI)

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không (fix GIỮ vĩnh viễn) |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `clicktest-87o8-mask-track-webkit.mjs` | ecbd1b40 | ecbd1b40 | Không (script O8 gốc, chỉ đọc) |
| `clicktest-87o8-mask-track-headed.mjs` | 8911ad3d | 8911ad3d | Không (script O8 Chromium gốc, chỉ đọc) |

- Không sửa code app, không sửa script harness/O8 nào trong đợt này. Batch stage chỉ có LIMITS này (1 file).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round143` 04:01:05Z (vite sau release curl 5560/5554 = 000000 — đã kiểm trong driver); driver harness đã nhả lock sau mỗi lần chạy (giữ tối đa ~4 phút/lần).
- Driver harness đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm; lock `t8-round143` đã nhả.
- Kiểm cuối 05:08:28Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; `/tmp/.X11-unix/` TRỐNG (total 0); không có `/tmp/.X199-lock` / `/tmp/.X188-lock`; không có `vite.lock` trong repo; lock vite TRỐNG (0 ticket + 95 cooldown).
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 491 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **Kết luận "O8 FAIL do trạng thái boot mới" là kết luận loại trừ, không phải cơ chế đã chứng minh.** Đã loại trang/proxy-toggle (cùng cây/script pass 3/3 lần trên boot mới), nhưng cơ chế cụ thể trên boot 70a5b0fc (replay chết dạng B? apt chưa xong? WebProcess chết sớm?) chưa được chỉ ra — boot đó đã chết theo reboot nên không kiểm lại được. Ứng viên mạnh nhất còn lại là replay chết dạng B lần 4 (T5-143 ghi) — chỉ là ứng viên, T8 không kết luận nhân quả.
2. **Harness đợt này chạy KHÔNG QUA GATE** (F-143-T8-2) — kết quả 6/6 vẫn là đo thật trên cùng cây, nhưng không có cờ lượt yên #19 đi kèm như tiền lệ. Đừng trích "harness sau gate" cho đợt này.
3. **"0 WATCHDOG" đợt này KHÔNG có nghĩa "watchdog đã kiểm chứng xong".** Có 0 kẹt thật để thử — đợt thứ hai liên tiếp. Bản vá mới chỉ qua smoke-test (đợt 142) + 12 lần chạy sạch.
4. **Balloon chạm trần lúc mở harness rồi xả trong lúc chạy** (F-143-T8-6): balloon 6.443.824 kB lúc 04:51Z (đúng trần đợt 142) rồi 4,99–6,03 GB trong lúc chạy; RAM avail 491–1.731 MB. Đừng trích một con số RAM "lúc chạy" làm đại diện.
5. **P5 Chromium 86n2 CÓ-RESTART (+1) không phải restart dư** (F-143-T8-4): 1 sự kiện `ended` tự nhiên đúng tại ct=30=dur; verdict run vẫn ok=true. Đừng trích là "Chromium restart dư ở P5".
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.

## 8. Sai số mới (F-143-T8-N)

- **F-143-T8-1 — REBOOT giữa lúc chờ gate (`70a5b0fc` → `691a7403`, btime 03:55:45Z):** T8 mở trên boot `70a5b0fc` (~02:40Z, RAM 441 MB, balloon 5.323.836 kB); reboot xảy ra trong khung (03:55:30Z, 03:55:45Z] (mốc cuối: poll #98 của T4 03:55:30Z; btime boot mới 03:55:45Z). Waiter1 bị giết theo reboot (SIGTERM ~03:56Z, poll 69); poller T4 cũng chết và tự khởi động lại 03:56:50Z (runtime restart). T5-143 đã đóng cờ TRƯỚC reboot nên `POSTBOOT_PASS` hiện tại vẫn là của boot cũ (pass_at 03:16:42Z) — không còn ai viết postboot mới cho boot `691a7403`. Số hiệu reboot (có phải #30?) là việc T2/T7 — T8 chỉ ghi khung + btime. Chuẩn bị của T8 không bị ảnh hưởng (file trên đĩa bền qua reboot; fixture /tmp mất, rebuild sau — xem §2).
- **F-143-T8-2 — Gate KHÔNG MỞ, harness chạy không qua gate:** waiter-b hết hạn 04:50Z (poll 47, exit 3): `t4=0` suốt 46 poll, `postboot=1` (đường b) suốt. T4 kẹt ở gate0-poll sau reboot: 0 attempt lượt yên #19 trong 47 phút (03:56:50Z–04:50:07Z) dù điều kiện xanh (postboot_exit=0 từ poll #5, blockers=0 nhiều poll, RAM từng 2.472 MB, apt replay xong dpkg 1545) — poller khởi động lại sau reboot nhưng phần chạy attempt dường như không khởi động lại; không có file attempt nào trong `round143-t4/`. T8 quyết định chạy harness 04:51:44Z VÌ: (i) mục đích gate là bảo vệ lần đo yên của T4, mà T4 không đo; (ii) lock vite trống, load ~1, T4 chỉ poll; (iii) còn đủ thời gian trước hạn T10 (~05:15Z). Bằng chứng không phiền attempt nào: poll T4 #93/#94 trong lúc harness chỉ thấy lock `t8-round143` (blockers=5) mà không attempt nào chạy; poll #95 sau khi nhả lock blockers=0; T4 vẫn chưa có cờ lúc T8 đóng. Parent xét lại lệch chuẩn này khi đóng sổ.
- **F-143-T8-3 — Waiter-b chấp nhận postboot đường (b) (lệch thiết kế gốc):** waiter gốc chỉ chấp nhận cờ T5 chứa boot hiện tại; sau reboot thì cờ đó không bao giờ xuất hiện (T5 đã đóng). Waiter-b (`wait-t4-t5-143t8b.sh`) chấp nhận thêm log gate0wait live mới nhất của T4 chứa `KET LUAN: DU DIEU KIEN chay WebKit` + đúng btime boot hiện tại (từ `/proc/stat`, KHÔNG phải `stat /proc/1` — hai giá trị lệch 10 s: 03:55:55Z vs 03:55:45Z, xem F-143-T8-7) + mtime log <900 s. Đã kiểm tay trước khi dùng: khớp 8 dòng `[postboot 2026-11-19 03:55:45]`, log mới 47 s. Đường (a) cờ T5 giữ nguyên. Dù vậy gate vẫn không mở vì thiếu cờ T4 — đường (b) chỉ sửa được nửa postboot, không sửa được nửa T4.
- **F-143-T8-4 — P5 Chromium 86n2 CÓ-RESTART (+1) là sự kiện `ended` tự nhiên, không phải restart dư:** 1 sự kiện duy nhất trong cửa sổ P5 40 s: `{dtResetMs:30001, causeTag:"ended-at-duration", ct:30, dur:30, seeking:false, paused:true, ticksEndedTrue:1, endedFlippedThisTick:true, prevCt:29.9362, prevEnded:false}` — clip chạm đúng cuối (ct=dur=30) thì `ended` lật 1 lần, đúng hành vi cuối clip; 0 mẫu seek kẹt, 0 restart dư trong lúc phát. Script ghi verdict là nhãn `CÓ-RESTART (+1) — xem trace event` (dòng 549 — chỉ là nhãn, không phải FAIL); verdict run vẫn `ok=true` ("KẾT QUẢ: KHÔNG FAIL"). Đợt 142 Chromium 86n2 P5 ghi 0 restart — khác biệt này chưa giải thích được (có thể do playhead bắt đầu cửa sổ khác nhau), ghi nhận để T10/T8 đợt sau đối chiếu, không kết luận regression.
- **F-143-T8-5 — 0 kẹt đợt này, chuỗi "P3 không kẹt" 1 → 2:** 6/6 lần chạy harness + 3/3 lần chạy O8, 0 kẹt, 0 FAIL (khác đợt 142: O8 WebKit FAIL 2 lần). 86n2 WebKit P4-lần2 PASS nhanh (đồng bộ 1,2–1,8 s) — điểm kẹt đợt 141 không tái hiện lần thứ hai liên tiếp.
- **F-143-T8-6 — Balloon chạm trần lúc mở harness rồi xả trong lúc chạy:** lúc bắt đầu driver harness 04:51:44Z: balloon 6.027.056 kB, avail 858 MB; trước đó lúc 04:51:14Z balloon 6.443.824 kB (đúng trần đợt 142 — 1 mẫu). Trong lúc chạy (n=32): balloon 4.993.568–6.027.056 kB, avail 491–1.731 MB. Tương quan ghi nhận, không kết luận nhân quả (H2 vẫn KHÔNG ỦNG HỘ).
- **F-143-T8-7 — Nhãn btime trong summary driver lệch 10 s so với btime kernel thật:** driver `run-webkit-143t8.sh` ghi btime bằng `stat /proc/1` (= 03:55:55Z) trong khi `/proc/stat` btime = 03:55:45Z. Chỉ là nhãn log (không ảnh hưởng lần chạy); đã sửa waiter-b dùng `/proc/stat`. Ghi để đợt sau khỏi nhầm khi đối chiếu khung reboot.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 1** (đếm lại từ 0 sau đợt 142) — chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 143.
2. **Lượt yên WebKit #19 VẪN CHƯA XONG** — T4 kẹt gate0-poll sau reboot (0 attempt đợt này); việc T4/parent, không phải T8. Harness đợt 143 không có cờ lượt yên đi kèm (xem F-143-T8-2).
3. **Điều tra kẹt chung VẪN MỞ** (H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ) — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.
4. **Watchdog VẪN CHƯA được thử bằng kẹt thật** (2 đợt liên tiếp 0 kẹt) — giữ nguyên bản vá, không revert (quyết parent đợt 142).
5. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 143

## B1. Trạng thái giả thuyết sau đợt 143

| Giả thuyết | Trạng thái đợt 142 | Trạng thái đợt 143 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Đợt này 0 kẹt dù RAM avail xuống 491 MB trong lúc chạy harness (thấp hơn lúc kẹt đợt 141 bắt đầu ~687 MB) — không có ngưỡng RAM tuyệt đối nào phân tách kẹt/pass |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | 0 kẹt đợt này nên không có mẫu mới; balloon chạm trần lúc mở rồi xả trong lúc chạy chỉ là tương quan |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | 0 kẹt đợt này — không thêm mẫu nào; bản vá watchdog (i)+(ii) đã sẵn sàng để bắt bằng chứng live ở lần kẹt sau |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 143

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143) + đường ổn định `t8-diag-stall.sh` → 143 | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 2 liên tiếp).** 12/12 lần chạy harness sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143) | 6 lần chạy harness, `live_diags=0` cả 6 | Chạy đúng, 0 false-positive; `dev-url.txt` đủ 6 scratch |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | Driver chạy → có `ram-143t8.log` (n=32) | Balloon 4,99–6,03 GB, RAM avail 491–1.731 MB trong lúc chạy; chạm trần 6.443.824 kB 1 mẫu lúc mở |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** | N cộng dồn **N=5 mỗi pha** (đợt 137/139/141/142/143 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124, truyền devUrl thật) | 0 lần kẹt → không kích hoạt | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3)

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 143: 6 LẦN CHẠY HARNESS, 0 KẸT (CHUỖI 1 → 2)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL** (không retry). Chuỗi "P3 không kẹt" **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **1 → 2**.
- Bốn lần kẹt vẫn là: đợt 134/135 (3 lần) + đợt 141 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=5 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — đợt 143: không có yếu tố chung mới (0 kẹt). Reboot giữa lúc chờ gate (70a5b0fc → 691a7403, btime 03:55:45Z) xảy ra TRƯỚC khi harness chạy — không ảnh hưởng lần chạy nào; O8 chạy trên boot mới ~2,5 phút tuổi và PASS 3/3 lần. Vite server còn sống lúc chạy: cả 6 lần chạy harness đều tới được `vite dev sẵn sàng` + `dev-url.txt` ghi đủ — không có bằng chứng vite chết đợt này (nhưng cũng không có kẹt để kiểm vite-HTTP lúc kẹt). T4 kẹt gate0-poll sau reboot (0 attempt) — việc T4, không phải yếu tố kẹt của harness.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- **O8 WebKit FAIL đợt 142 đã được điều tra xong theo quyết parent (b): kết luận trạng thái boot mới 70a5b0fc (loại trừ trang/proxy-toggle), chuỗi FULL PASS đếm lại từ 0 → 1.** Cơ chế cụ thể trên boot cũ chưa chứng minh được (boot đã chết) — ứng viên mạnh nhất là replay chết dạng B lần 4 (T5-143 ghi), chỉ ghi nhận, không kết luận.
- **Bản vá watchdog đợt 142 là bước kiểm mới nhất**: nếu đợt này (hoặc đợt sau) có kẹt thật mà watchdog (i) và/hoặc (ii) nổ, đó sẽ là bằng chứng live đầu tiên về trạng thái browser lúc kẹt (ps/RSS, vite-HTTP, probe 1+1).

## B7. Bằng chứng mới từ đợt 143 — O8 KHÔNG TÁI HIỆN, HARNESS 6/6 (KHÔNG GATE)

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot mới 691a7403; S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness: WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2, toàn bộ PASS exit 0, 0 FAIL oan, 0 retry (khác đợt 142: O8 WebKit FAIL 2 lần — nay đã pass lại).
- Vá watchdog (i)+(ii) GIỮ NGUYÊN, 0 kích hoạt đợt thứ hai liên tiếp (0 kẹt); 12/12 lần chạy harness sạch sau vá.
- 0 WATCHDOG-137 trong 6 log — nhưng đây là 0 kẹt, không phải "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo mới là bài kiểm thật đầu tiên của bản vá.
- Sampler: balloon 4,99–6,03 GB, RAM avail 491–1.731 MB trong lúc chạy harness (chạm trần 6.443.824 kB 1 mẫu lúc mở).
- Reboot giữa lúc chờ gate (70a5b0fc → 691a7403, btime 03:55:45Z; khung chết (03:55:30Z, 03:55:45Z] — số hiệu chờ T2/T7 xác nhận); `/tmp/.X11-unix/` trống lúc kiểm cuối (05:08:28Z).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round143-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round143-t8/` (run-webkit-143t8.sh — ĐÃ CHẠY 6/6; diag-stall-143t8.sh — KHÔNG DÙNG (0 kẹt); rebuild-fixtures-143t8.sh — ĐÃ DÙNG sau reboot (6/6 md5 khớp); wait-t4-t5-143t8.sh — CHẠY, bị giết theo reboot (poll 69); wait-t4-t5-143t8b.sh — CHẠY, hết hạn 04:50Z poll 47 exit 3 (GATE NOT MET); o8-driver-143t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21); o8-s1-probe-143t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-143t8.py — ĐÃ CHẠY (tạo probe); smoke/wait-t4-t5.log (waiter1 + waiter-b); smoke/waiter-nohup.log; smoke/run-webkit-summary.txt (driver 04:51:44–05:07:14Z, ec webkit 0/0/0; chromium 0/0/0); smoke/ram-143t8.log (sampler 30 s, n=32, có cột balloon_kb); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy); smoke/attempt1/ (snapshot 6 log + summary); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai; 3 script b8c08a7c/610ee003/628088bd cả hai; O8 ecbd1b40/8911ad3d cả hai); smoke/baseline-dmesg-open.txt + baseline-dmesg-tail50.txt + baseline-journalctl-k-open.txt + baseline-journalctl-k.txt + baseline-meminfo-open.txt + baseline-meminfo.txt (dmesg EPERM + journalctl rỗng); o8-143t8.log + o8-lock.log (driver O8 03:58:12–04:01:05Z); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round143-t8/diag-stall-143t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild sau reboot (round76-d8, round81-i7, l10, m4, n2 — 6/6 md5 khớp).
