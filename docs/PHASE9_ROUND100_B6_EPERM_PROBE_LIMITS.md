# PHASE9 ROUND100 B6 — EPERM: probe #19 + đóng khoảng mù #18 + chốt giờ reboot #16 (nợ LIMITS gộp đợt 99 §4 mục 7)

> Luồng B6, đợt 100 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07,
> 13/11/2026; làm việc ~20:38–20:52Z 12/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + đóng khoảng mù #18 kể từ probe #18
> (17:40:14Z) + chốt giờ từng giây reboot #16 nếu còn dữ liệu + quét
> lại writeFileSync bằng script V6/W7/X7/Y8/Z7/A8
> (`hidden_files/round100-b6/scan-wfs.sh`, copy từ `round99-a8`,
> chỉ đổi thư mục OUT — không đổi logic) + ghi RAM hiện tại
> (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard, xem §5).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền.**

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 20:40:32Z
  báo **DEAD/STALE** (heartbeat age 10.818 s, last #18 17:40:14Z,
  boot 99338d31, exit 1); `once` ngay sau đó là **probe #19,
  boot 66fb273d (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 5 s, n=19), exit 0.
- **Khoảng mù #18: 17:40:14Z → 20:40:35Z (~180')** — chứa **1 REBOOT
  ĐÃ XÁC NHẬN: #23 20:30:14Z chính xác từng giây (boot 99338d31 →
  66fb273d, probe #19 xác minh id)**. Khoảng cách #22 → #23 là
  **3h04'35" — dài nhất từng ghi giữa hai reboot liên tiếp đã xác
  nhận**, vượt dự báo ~19:29Z tới ~1h01'. Chu kỳ nay là **23 lần /
  ~48h12' ≈ 2h06'/lần**. Reboot tiếp theo dự kiến **~22:36Z**.
- **Khoảng trống không-bản-ghi cuối mù chỉ còn ~88'** (19:01:50Z →
  20:30:14Z) — ngắn hơn ~117' của mù #17 — nhờ một lượt chạy U4
  đầy đủ KHÔNG có log chủ thể (xem §2.3). Reboot trung gian trong
  đuôi mù **không loại trừ tuyệt đối được** (xem đính chính §2.4 về
  khoảng cách ngắn nhất), nhưng không có bằng chứng nào cho nó.
- **Reboot #16: KHÔNG chốt được giờ từng giây** — dữ liệu còn sống
  không chứa timestamp nào trong khoảng kẹp. Kẹp thu hẹp được từ
  ~8' xuống **~4' (07:26:03Z → ~07:30:00Z, cận trên suy luận từ
  thời lượng re-run U4, không phải timestamp trực tiếp)**; đây là
  mức tốt nhất có thể — đề xuất đóng nợ này ở mức kẹp ~4 phút
  (xem §2.5).
- **Không tìm thấy bằng chứng sóng EPERM thật trong các bản ghi
  còn lại của khoảng mù** — 0 dòng "sóng EPERM vẫn bật", 0 dòng
  "CẢNH BÁO: chờ sóng EPERM 10 phút", 0 lần "Operation not
  permitted" thật. 6 dòng "sóng EPERM đã tắt" (A3 ×4 + A10 O8 ×2)
  đều là **dương tính giả đã biết**. Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — ~32h29' trước probe #19. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 398 dòng / 124 file** (phạm vi
  2.629 file) — source thật **215** (+32 vs A8), mẫu trong docs
  **183** (+10 vs A8). Đối chiếu phương pháp R7 cũ (R7b):
  **423 dòng**; đối chiếu chéo 398 + 25 bản copy = **423,
  khớp tuyệt đối, chênh 0** — lần thứ bảy liên tiếp chênh 0 sau
  đối chiếu. **Không còn đường ghi production nào chưa nối
  helper.** Async `fs.writeFile` production ngoài helper: **0**
  (không đổi).
- **RAM: 14 mẫu MemAvailable 1094–5044 MB** (max 5.044 MB = 82%
  ngưỡng guard 6144 MB — tăng vọt cuối lượt khi tải các luồng
  song song giảm; vẫn dưới ngưỡng) — birefnet KHÔNG chạy, đúng
  quy tắc chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC
  (xem §5 mục 6).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 20:38:40–20:40:32Z | boot_id `66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd`; `who -b` Nov 12 20:30; `uptime -s` **2026-11-12 20:30:14Z** (uptime ~8–10'); journal chỉ 1 boot (66fb273d, first entry 20:30:28Z); `last -x reboot` 20:30 still running; wtmp bắt đầu 20:30:27Z |
| `bash scripts/probe-eperm-v2.sh status` | 20:40:32Z | **DEAD/STALE**, exit 1 — heartbeat n=18, ts 17:40:14Z, boot 99338d31, age **10.818 s**; last sample probe #18; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 20:40:35Z | **probe #19, boot=66fb273d, ok=2 fail=0**, exit 0; dòng `boot changed 99338d31 -> 66fb273d` (uptime since 2026-11-12 20:30:14) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 20:40:35Z | **ALIVE**, age 5 s, n=19, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 49 dòng, trước lượt 46 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=19, ts
20:40:35Z, pid=7199, boot 66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd).

## 2. Điều tra khoảng mù kể từ probe #18

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 20:38–20:41Z)

- Boot hiện tại: `uptime -s` = **2026-11-12 20:30:14Z**, boot_id
  `66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd` — khác boot của probe #18
  (99338d31).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 66fb273d,
  first entry 20:30:28Z, last 20:39:41Z). `last -x reboot`: chỉ 1
  dòng (20:30, still running). wtmp bắt đầu 20:30:27Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 20:40:35Z ghi vào log chỉ ghi
  **99338d31 → 66fb273d** — bước nhảy đơn; xem §2.2 về khả năng
  nuốt boot trung gian.

### 2.2 Một reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 23 | **20:30:14Z (chính xác từng giây)** | 99338d31 → 66fb273d | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 20:30:28Z); `last -x reboot` (20:30, still running); wtmp bắt đầu 20:30:27Z; B9 (luồng kiểm chứng đợt 100) ghi boot 66fb273d trong poll.log lúc 20:39:16Z — khớp độc lập. Không ai ghi nhận lúc xảy ra (đợt 99 đã xong, đợt 100 chưa spawn — chỉ probe #19 phát hiện). |

Chu kỳ reboot nay là **23 lần trong ~48h12'** (từ ~20:18Z 10/11 tới
20:30:14Z 12/11) — trung bình ~2h06'/lần theo cách đếm của W7/X7
(tổng thời gian / số reboot; A8: 22 lần / ~45h07' ≈ 2h03').
Khoảng cách #22 → #23 là **3h04'35"** — **dài nhất từng ghi giữa
hai reboot liên tiếp đã xác nhận** (vượt #18 → #19 2h06'08" và
#21 → #22 2h01'12"); dự báo ~19:29Z của A8 trượt ~1h01'.
Reboot tiếp theo dự kiến **~22:36Z** (20:30:14Z + ~2h06'). Mọi
probe nền đều chết theo reboot; v2 chỉ đảm bảo cái chết được ghi
nhận + lượt sau hồi phục bằng 1 mẫu mới.

Khoảng mù #18 là **khoảng mù thứ 11 liên tiếp (#8–#18) chứa
reboot**. Dòng `boot changed` lần này là bước nhảy đơn — nhưng theo
bài học A8 §4 mục 6, bước nhảy đơn KHÔNG tự chứng minh chỉ có 1
reboot (mù #17 cũng bước nhảy đơn mà chứa 2 reboot); xem §2.3–2.4
về đối chiếu log sibling + đuôi mù không-bản-ghi.

### 2.3 Hoạt động trong khoảng mù — vì sao không có reboot nào khác trước 19:01:50Z

Hoạt động ghi đĩa liên tục 17:40Z → 19:01:50Z:

- **17:40–18:31Z:** các luồng đợt 99 làm việc + A10 poll đĩa
  (9/9 ALL LANDED 18:31Z, poller dừng; boot 99338d31 suốt — A10
  ghi rõ "Không reboot trong đợt lẫn lúc verify").
- **18:34–18:51Z:** A10 verify (tsc 0, vite build PASS, suites
  toàn xanh, O8 21/21 cả 2 engine; boot 99338d31; verify log
  18:51Z "Không reboot trong lúc verify").
- **18:51–18:56Z:** parent gộp đợt 99 (closing, LIMITS gộp đợt 99
  18:56:30Z, GAP_ANALYSIS §28 18:56:38Z — file cuối cùng của
  repo-1 trước reboot).
- **18:59:21–19:01:50Z: một lượt chạy U4 đầy đủ KHÔNG có log chủ
  thể** — 37 kết quả trong `hidden_files/round93-u4/work/
  measurements.json` (`"at": "2026-11-12T19:01:50.872Z"`,
  toàn status 1 như kỳ vọng cổng fail-fast). Đây là bằng chứng
  máy còn sống trên boot 99338d31 tới 19:01:50Z: một reboot trong
  cửa sổ 18:59:21–19:01:50Z sẽ giết lượt chạy giữa chừng, không
  thể có file `measurements.json` hoàn chỉnh lúc 19:01:50Z.

**Chủ thể lượt U4 18:59Z chưa xác định được.** Đã đối chiếu:
suites.log của A10 chỉ có ĐÚNG 1 section U4 (dòng 416–585) và
`=== ALL DONE 18:36:23Z` — và số liệu KHÁC lượt 19:01Z
(vd u4-stab4-old1: suites.log 2,64 s / load 0,93/0,59/1,74;
measurements.json 19:01Z 2,25 s / load 1,93/0,84/0,89).
Suy đoán mạnh nhất: parent chạy lại U4 sau closing (18:56:30Z →
bắt đầu 18:59:21Z, khớp thời gian) để kiểm chứng độc lập claim
"U4 141/141" của A10 — nhưng build-loop-log không có entry nào
ghi việc này. Khả năng khác: process sót của lần chạy đầu A10
(lần đầu kết thúc sớm không kết quả). **Không thể xác định chắc
chắn từ dữ liệu còn lại; ghi rõ là chưa xác định, không gán cho
parent hay A10.** Dù chủ thể là ai, giá trị chứng cứ không đổi:
máy sống trên boot 99338d31 tới 19:01:50Z.

**Sau 19:01:50Z thì không chứng minh được:** khoảng trống
không-bản-ghi **~88'24" (19:01:50Z → 20:30:14Z)** — file cuối
trước khoảng trống là `measurements.json` 19:01:50.873Z
(hidden_files); file đầu sau khoảng trống là các file
`round100-b9/` từ 20:39:16Z (sibling B9, trên boot mới) +
spawn đợt 100 ~20:35:51Z. Trong repo-1, file cuối trước khoảng
trống là `PHASE9_GAP_ANALYSIS.md` 18:56:38Z (kẹp bằng cả hai
cây theo A8 §4 mục 10 — lấy mốc muộn nhất 19:01:50Z).
Khoảng trống ~88' ngắn hơn ~117' của mù #17, nhưng vẫn đủ dài
để chứa một reboot trung gian mà không để lại dấu vết.

### 2.4 Đính chính: khoảng cách ngắn nhất giữa hai reboot liên tiếp (sửa A8 §2.2)

A8 §2.2 viết "khoảng cách ngắn nhất từng ghi ~1h52' giữa #16
07:26–07:34Z và #17 08:01:15Z" — **số này sai phép tính**:
07:34Z → 08:01:15Z chỉ là **~27'**, 07:26Z → 08:01:15Z là
**~35'**. Con số ~1h52'–1h53' thực ra là khoảng cách **#14
~03:25Z → #15 05:17:47Z** — A8 gán nhầm cặp reboot. Bảng khoảng
cách liên tiếp đã xác nhận (giờ chính xác trừ #14/#16 kẹp):

| Cặp | Khoảng cách |
|---|---|
| #14 ~03:25Z → #15 05:17:47Z | ~1h53' |
| #15 05:17:47Z → #16 ~07:26–07:30Z | ~2h08'–2h12' |
| #16 ~07:26–07:30Z → #17 08:01:15Z | **~31'–35' (ngắn nhất)** |
| #17 08:01:15Z → #18 09:24:17Z | 1h23'02" |
| #18 09:24:17Z → #19 11:30:25Z | 2h06'08" |
| #19 11:30:25Z → #20 13:24:41Z | 1h54'16" |
| #20 13:24:41Z → #21 15:24:27Z | 1h59'46" |
| #21 15:24:27Z → #22 17:25:39Z | 2h01'12" |
| #22 17:25:39Z → #23 20:30:14Z | **3h04'35" (dài nhất)** |

Hệ quả: lập luận "2 reboot trong đuôi mù ~88' chưa từng xảy ra"
**không còn đứng trên cơ sở thời gian** — đã có tiền lệ ~31–35'
(#16 → #17), và ngay cả khoảng cách chính xác ngắn nhất
(#17 → #18, 1h23'02") cũng chỉ nhỉnh hơn một nửa đuôi mù.
Một reboot trung gian trong đuôi 19:01:50Z → 20:30:14Z (vd lúc
~19:29Z như dự báo cũ, rồi #23 lúc 20:30:14Z) sẽ đòi hai khoảng
cách cộng lại ~88' (trung bình ~44'/khoảng) — ngắn hơn mọi
khoảng cách chính xác từng ghi, nhưng KHÔNG phi lý tuyệt đối
theo tiền lệ #16 → #17. **Kết luận trung thực: 1 reboot (#23)
đã xác nhận; reboot trung gian trong đuôi mù không có bằng
chứng nào, nhưng cũng không loại trừ được — đọc tiết kiệm nhất
vẫn là 1 reboot.** Lỗi số của A8 không đổi kết luận của mù #17
(2 reboot ở đó đã xác nhận bằng quan sát trực tiếp + uptime),
chỉ làm yếu lập luận loại trừ của nó.

### 2.5 Reboot #16 — chốt giờ từng giây: KHÔNG chốt được, kẹp thu hẹp còn ~4'

Đã kiểm tra mọi nguồn còn sống có thể chứa timestamp trong
khoảng kẹp 07:26:03 → 07:34:14Z (X7 §4.7):

- `find -newermt` toàn cây `hidden_files/` trong khoảng kẹp:
  chỉ **1 file — `round95-w3.md` 07:26:03.748Z** (file cuối cùng
  trên boot cũ, W3 về muộn). Không file nào khác.
- `find -newermt` toàn cây `repo-1` (prune node_modules/
  .venv*/dist/chrome-userdata/.git) trong khoảng kẹp: **0 file**.
- `/tmp/round95-w9/` (esbuild bundle của addendum §4b): **đã mất
  sau reboot**; `find /tmp -newermt` trong khoảng kẹp: **0 file**.
- `hidden_files/round95-w9/verify.log`: chỉ có 2 timestamp —
  start `Thu Nov 12 07:22:58 UTC 2026` (dòng 1) và done
  `07:37 UTC` (dòng 567); addendum ghi "first attempt killed
  mid-run by reboot #16 ~07:25-07:28Z" — không timestamp nào
  trong khoảng kẹp. `verify-u4.log` (re-run) không có timestamp
  theo dòng, chỉ thời lượng từng test + loadavg.
- journal/wtmp chỉ giữ boot hiện tại (đã mất boot adcef40a).

**Thu hẹp kẹp bằng suy luận thời lượng (mới, lượt này):**
`verify-u4.log` mtime 07:34:14.776Z là lần ghi cuối của lượt
re-run U4 (dòng tổng kết 141 pass). Cộng thời lượng các test
trong chính log đó: A1 6,78 s + A2 16,52 s + A3 36,22 s + A4
8,53 s + B1 1,20 s + B2 0,96 s + C1 76,63 s + C2 97,24 s =
**244,08 s (~4m04s)**; cộng khởi động node + overhead giữa các
section ~5–20 s → re-run bắt đầu **~07:30:00Z (±~30 s)**.
Reboot phải xảy ra trước khi W9 nhận ra kill + khởi động lại,
nên cận trên mới là ~07:30:00Z. **Kẹp mới: 07:26:03Z →
~07:30:00Z (~3'57")**, thay cho 07:26:03 → 07:34:14Z (~8'11")
của X7. Lưu ý: cận trên là suy luận từ thời lượng, KHÔNG phải
timestamp trực tiếp — độ tin cậy thấp hơn cận dưới (file thật).
Ước lượng trực quan của W9 "~07:25–07:28Z" nằm trong kẹp mới;
đầu dưới "~07:25Z" của nó hơi lệch so với file W3 07:26:03Z
(reboot không thể trước file cuối trên boot cũ), nên cửa sổ
hiệu dụng theo W9 là 07:26:03–07:28Z.

**Kết luận: giờ từng giây của reboot #16 KHÔNG chốt được với dữ
liệu còn sống — không còn nguồn nào để tìm thêm** (journal/wtmp
volatile đã mất, /tmp đã dọn, verify.sh bị giết không để lại
log giữa chừng, mọi file trong khoảng kẹp chỉ còn 1). Đề xuất
**đóng nợ này ở mức kẹp ~4 phút (07:26:03 → ~07:30:00Z)** thay
vì để mở vô hạn chờ dữ liệu không còn tồn tại. Số thứ tự #16,
boot adcef40a, và ước lượng W9 đều đã khớp nhau; chỉ thiếu giây
chính xác — thiếu sót này không ảnh hưởng chu kỳ reboot hay bất
kỳ kết luận nào khác.

### 2.6 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 99 + đợt 100 tới lúc này

Khoảng mù 17:40:14Z → 20:40:35Z (~180') được phủ bởi các luồng
sibling đợt 99 (A1–A10, làm việc tới ~19:01:50Z qua lượt U4
không-log) + khoảng trống ~88' + spawn đợt 100 (~20:35:51Z) +
B8/B9 đã bắt đầu chạy. Đã đọc lại log thật (grep `sóng EPERM
vẫn bật` / `CẢNH BÁO: chờ sóng` / `Operation not permitted` trên
`docs/PHASE9_ROUND99_*.md` + toàn bộ cây `hidden_files/round99-*`
+ toàn bộ cây `hidden_files/round100-*` tới 20:52Z + build-loop-log):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| A1–A9 (`docs/PHASE9_ROUND99_A*.md` + log) | 17:40–~18:5xZ | 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật; các hit grep đều là chữ trong chính file LIMITS của A8 trích lại bài học |
| A3 (probe f1–f4) | 18:00–18:06Z | 4 dòng "sóng EPERM đã tắt" (18:00:39Z, 18:05:22Z, 18:06:07Z, 18:06:44Z, mỗi dòng lặp lại trong probe-log.txt con) — **dương tính giả đã biết** (xem đính chính dưới) |
| A10 verify + O8 | 18:34–18:51Z | 2 dòng "sóng EPERM đã tắt" (O8 report Chromium 18:37:22.687Z + WebKit 18:38:12.977Z) — **dương tính giả đã biết**; A10 ghi rõ "Không reboot trong lúc verify", O8 21/21 cả 2 engine |
| A7 | 17:40Z– | "0 EPERM trong 13 log" (build-loop-log) |
| Lượt U4 không-log | 18:59–19:01Z | Chỉ còn `measurements.json` (37 kết quả, toàn status 1 như kỳ vọng) — không có log text nào để grep; không dấu EPERM trong JSON |
| B5 (`round100-b5.md`) | ~20:35Z– | 0 lần nhắc EPERM |
| B8/B9 | ~20:39Z– | Chưa có log .md; B9 poll.log (20:39:16Z) chỉ ghi boot + RAM + preview.tsx md5 — 0 nhắc EPERM |
| 19:01:50Z → 20:30:14Z | — | **Không có bản ghi nào**: file cuối trước khoảng trống là `measurements.json` 19:01:50.873Z (hidden_files); file đầu sau khoảng trống là các file `round100-b9/` từ 20:39:16Z. Trong repo-1, file cuối là `PHASE9_GAP_ANALYSIS.md` 18:56:38Z. |

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 6 dòng "sóng EPERM đã tắt, khởi động vite"
trong khoảng mù (A3 ×4 + A10 O8 ×2) đều là dòng in khi lần ghi
thử ĐẦU TIÊN thành công ngay (code launcher `waveOff=true` ở
lần write đầu) — in mặc định cả khi không có sóng. Bằng chứng
phân biệt: **0 dòng "sóng EPERM vẫn bật sau …s chờ"** và **0
dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"** trong toàn bộ cây
round99 + round100 tới lúc này; **0 lần "Operation not
permitted" thật** (mọi hit grep đều là chữ trong LIMITS của A8
hoặc tên test `hasEperm`).

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **~88' cuối (19:01:50Z → 20:30:14Z) là mù hoàn
  toàn**, đủ dài để chứa nhiều sóng ~16 phút mà không để lại dấu
  vết nào trong hồ sơ — và đã chứng minh chứa được một reboot
  (#23, 20:30:14Z) mà giờ chính xác chỉ probe mới chốt được
  (parent spawn chỉ ghi "~20:35Z" theo giờ cron, probe xác minh
  id boot + giờ từng giây).
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~32h29' trước probe
  #19 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được tuyên
  bố là đã hết.
- Khoảng trống không-bản-ghi ~88' ngắn hơn ~117' của mù #17
  (nhờ lượt U4 18:59Z), nhưng vẫn là khoảng trống cuối-mù dài
  thứ hai từng ghi.

### 2.7 Bảng 18 lần chết / khoảng mù (cập nhật từ bảng 17 lần của A8 §2.4)

| # | Probe | Mẫu cuối | Khoảng chết/mù | Nguyên nhân (mức chắc chắn) |
|---|---|---|---|---|
| 1–17 | (xem A8 §2.4 — không đổi) | — | — | — |
| 18 | — (đợt 99 A8 → đợt 100 B6) | #18 17:40:14Z | mù 17:40:14–20:40:35Z (~180') | **Không có observer + 1 REBOOT ĐÃ XÁC NHẬN** — **#23 20:30:14Z chính xác từng giây** (→ 66fb273d; **không ai ghi nhận lúc xảy ra — chỉ probe #19 phát hiện**). Hoạt động liên tục 17:40Z → 19:01:50Z (đợt 99 + verify + closing + lượt U4 không-log) — không reboot nào khác trước 19:01:50Z. **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (A1–A10 tới ~19:01:50Z; A7: 0 EPERM trong 13 log; 6 dòng "sóng EPERM đã tắt" là dương tính giả đã biết — **0 "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật**); nhưng **~88' cuối (19:01:50Z → 20:30:14Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó (xem đính chính §2.4: tiền lệ khoảng cách ~31–35' làm lập luận loại trừ bằng thời gian yếu đi). |

## 3. Quét writeFileSync — script V6/W7/X7/Y8/Z7/A8, không đổi phương pháp

### 3.1 Phương pháp

Chạy đúng script V6/W7/X7/Y8/Z7/A8 `hidden_files/round100-b6/scan-wfs.sh`
(copy từ `round99-a8/scan-wfs.sh`, chỉ đổi thư mục OUT — đã diff,
giống hệt trừ thư mục OUT): chuẩn mới (prune mọi cấp
`node_modules`, `.venv*`, `dist`, `chrome-userdata`,
`.eperm-probe*`, `assets`, `bundled-server`, `release*`, `build`)
+ đối chiếu R7b (giữ base prune, chỉ loại `release*`/
`bundled-server`/`assets` ở gốc) + đối chiếu chéo bản copy (loại
`node_modules`). Đếm theo **dòng**, chỉ tính file có count > 0.

### 3.2 Kết quả (snapshot 20:46:07–20:47:01Z)

| Nhóm | Chuẩn mới | R7 cũ đúng (R7b, đối chiếu) | A8 (~17:42Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.629** | 12.022 | 2.605 / 11.998 |
| Source code thật | **215** | 248 | 183 / 216 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **183** | 183 | 173 / 173 |
| **Tổng writeFileSync (dòng)** | **398** | **423** | **356 / 381** |

Đối chiếu chéo: chuẩn mới 398 + bản copy 25 (3 build + 22 release)
= **423**; R7b = **423** — chênh **0, khớp tuyệt đối, không cần
tính file tạo giữa chừng** — lần thứ bảy liên tiếp chênh 0 sau đối
chiếu (X7, Y8, Z7, A8, nay B6; xem §4 mục 4 về snapshot động). Hit list
chuẩn mới có **0 đường dẫn chứa `release*/` hay `build/`** (verify
bằng grep — 0 hit, như A8). Bản copy 25 dòng / 17 file giống hệt
A8 (3 build + 11 release/linux-unpacked + 11
release-round55-l4) — diff `wfs-copies.txt` A8 → B6 trống.

**Giải thích +42 dòng vs A8 (diff trực tiếp hai hit list, không suy
luận từ mtime):** 2 nhóm, 0 file biến mất:

- **+10 docs:**
  - `docs/PHASE9_ROUND99_A8_EPERM_PROBE_LIMITS.md` — **8 dòng**
    (chính file LIMITS của A8, viết sau khi A8 quét).
  - `docs/PHASE9_ROUND99_LIMITS.md` — **1 dòng** (closing đợt 99).
  - `PHASE9_GAP_ANALYSIS.md` 12 → **13** (§28 mới ở closing đợt 99
    — dòng nhắc probe #19).
- **+32 source — 7 probe đo frame-parity/watchdog của đợt 99–100**
  (đã đọc từng dòng writeFileSync, toàn ghi vite cfg tạm + kết quả
  đo vào SCRATCH, không phải đường ghi production):
  - `apps/web/scripts/probe99a4-watchdog-paused.mjs` — **6 dòng**
    (A4; 1 dòng ghi vite cfg tạm + 5 dòng ghi kết quả/log/error
    vào SCRATCH).
  - `apps/web/scripts/probe99a5-frame-parity.mjs` — **5 dòng**
    (A5; cùng mẫu).
  - `apps/web/scripts/probe99a5-y5blind.mjs` — **5 dòng** (A5).
  - `apps/web/scripts/probe99a6-frame-parity.mjs` — **5 dòng**
    (A6; cùng mẫu).
  - `apps/web/scripts/probe99a3.mjs` — **1 dòng** (A3;
    `fs.writeFileSync(waveProbeFile, "x")` — file probe sóng,
    cùng mẫu với probe98z3 của Z3).
  - `apps/web/scripts/probe100b4-frame-parity.mjs` — **5 dòng**
    (B4, đợt 100 — sibling đang chạy lúc quét; cùng mẫu).
  - `apps/web/scripts/probe100b5-frame-parity.mjs` — **5 dòng**
    (B5, đợt 100 — sibling đang chạy lúc quét; cùng mẫu).

10 + 32 = 42, khớp đúng chênh lệch. **Lưu ý snapshot động:** B4/B5
(sibling đợt 100) đang chạy lúc quét nhưng file probe của họ đã
tạo xong trước cửa sổ quét 20:46:07–20:47:01Z nên đối chiếu chéo
khớp tuyệt đối không cần tính file tạo giữa chừng — khác Y8 (1
file lọt giữa hai lần find, chênh 5). Các LIMITS đợt 100 viết sau
thời điểm quét sẽ làm số docs tăng thêm ở lượt sau — đó là tăng
do tài liệu, không phải đường ghi mới.

### 3.3 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`,
quét bằng find có prune node_modules/.venv* + grep trực tiếp
(không dùng `git grep` — xem A8 §4 mục 9): **2 hit** — chính 2
helper, giống hệt A8/Z7/Y8/X7/W7/V6/U8:

- `apps/desktop/src/services/epermRetry.js:116`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  desktop.
- `apps/web/scripts/eperm-retry.mjs:71`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  web.

**Async `fs.writeFile(` production ngoài helper: 0.**

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry. Số "code" theo chuẩn mới là 215 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Luôn lọc count > 0 trước khi cộng** (bài học S7/T8 §4.1).
2. **R7-cũ phải giữ nguyên base prune** (node_modules/.venv*/dist/
   chrome-userdata/.eperm-probe*) — chỉ khác chuẩn mới ở chỗ
   release*/build chỉ loại ở gốc thay vì mọi cấp. Script V6/W7/X7/
   Y8/Z7/A8 đã sửa lỗi này của U8 — **lượt sau dùng script V6/W7/X7/
   Y8/Z7/A8/B6 (`hidden_files/round100-b6/scan-wfs.sh`, giống hệt
   script V6 trừ thư mục OUT)**, đừng dùng lại script U8.
3. **Trích bản copy phải loại node_modules**: `mime/src/build.js`
   nằm dưới `node_modules` trong cả `release*/` lẫn `build/` —
   regex `(^|/)build/` bắt nhầm 4 dòng; bản copy đúng phạm vi là 25
   dòng / 17 file (3 build + 22 release), khớp T8/S7/U8/V6/W7/X7/Y8/Z7/A8.
4. **Quét trong lượt nhiều luồng song song là snapshot động:**
   file mới có thể xuất hiện giữa hai lần find. Lượt này B4/B5
   đang chạy nhưng file probe của họ đã tạo xong trước cửa sổ quét
   nên đối chiếu chéo khớp tuyệt đối không cần tính file tạo giữa
   chừng — khác Y8 (1 file lọt giữa hai lần find, chênh 5). Ghi rõ
   cửa sổ snapshot và đối chiếu chéo số chênh, đừng ép hai lần quét
   phải khớp tuyệt đối khi cây đang đổi — **diff hit list để tìm
   file tạo giữa chừng, đừng kết luận sai phương pháp**.
5. Scratch quét để trong
   `hidden_files/round100-b6/` (sống qua reboot), không để /tmp —
   scratch của S7/T8/T9 trong /tmp đều đã mất sau reboot.
6. **Dòng `boot changed` của probe gộp mọi reboot trung gian:**
   khoảng mù #17 chứa 2 reboot nhưng log probe chỉ thấy một bước
   nhảy 65bc5fb6 → 99338d31; boot 0b32ac3a chỉ còn trong log luồng
   Z10 + build-loop-log. Lượt này mù #18 là bước nhảy đơn
   99338d31 → 66fb273d — **bài học vẫn đứng: khi thấy `boot
   changed` phải đối chiếu log sibling / build-loop-log xem có
   boot trung gian không, đừng tin bước nhảy là 1 reboot duy
   nhất.** Ghi boot từ `who -b` / `uptime -s` RIÊNG là bắt buộc,
   không phải khuyến nghị.
7. **Kẹp giờ reboot bằng mtime (X7 §4.7):** khi một reboot được
   luồng đang chạy quan sát trực tiếp nhưng giờ từng giây chưa
   chốt, kẹp bằng file cuối cùng trước reboot và file đầu tiên sau
   reboot. Lượt này ÁP DỤNG LẠI cho #16 theo hướng mới: kẹp trên
   thu hẹp bằng **thời lượng re-run suy ra thời điểm bắt đầu
   re-run** (verify-u4.log mtime trừ tổng thời lượng test) — chỉ
   dùng khi không còn timestamp trực tiếp nào, và phải ghi rõ đó
   là suy luận, không phải timestamp.
8. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8):** dòng đó in khi lần ghi thử ĐẦU TIÊN thành công
   ngay — tức in mặc định cả khi không có sóng. Chỉ dòng "sóng
   EPERM vẫn bật sau …s chờ" hoặc "Operation not permitted" mới
   tính là bằng chứng sóng. Lượt này áp dụng lại: 6 dòng "đã
   tắt" trong khoảng mù (A3 ×4, A10 O8 ×2) đều là dương tính
   giả; 0 dòng "vẫn bật", 0 "Operation not permitted" thật.
9. **Async writeFile: đừng dùng `git grep`** — 2 file helper
   (`epermRetry.js`, `eperm-retry.mjs`) không nằm trong index git
   nên `git grep` trả về 0 hit sai. Dùng find có prune
   node_modules/.venv* + grep trực tiếp (lượt này), hoặc grep
   đệ quy tránh `server/tts/.venv2`.
10. **Kẹp khoảng trống không-bản-ghi bằng cả hai cây:** lượt này
    file cuối trước khoảng trống khác nhau giữa hai cây
    (hidden_files: `measurements.json` 19:01:50Z; repo:
    `PHASE9_GAP_ANALYSIS.md` 18:56:38Z) — lấy mốc muộn nhất
    (19:01:50Z) làm đầu khoảng trống, đừng chỉ nhìn một cây.
    Trong repo-1, `find -newermt` 18:56Z–20:30Z (prune đúng)
    trả về 0 file mới ngoài closing — khoảng trống được xác nhận
    độc lập trên cả hai cây.
11. **Kiểm tra số liệu lịch sử trước khi trích lại:** A8 §2.2 gán
    khoảng cách ~1h52' cho cặp #16 → #17 trong khi phép tính đúng
    là ~27–35' (xem §2.4). Khi trích một con số từ lượt trước,
    tính lại từ dữ liệu gốc (giờ boot trong log probe / LIMITS
    cũ) thay vì copy nguyên câu.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #19 OK 2/2) — và ~88' cuối khoảng mù #18 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~32h29' trước
   probe #19.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2): lệnh cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). B6 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #18 dài ~180' chứa **reboot #23 mà không ai ghi nhận
   lúc xảy ra** (chỉ probe #19 phát hiện); khoảng mù #8 đã chứng
   minh có thể chứa cả một sóng đầy đủ; khoảng trống không-bản-ghi
   cuối mù nay là ~88' (đủ chứa nhiều sóng ~16').
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3, V6 §5 mục 3, W7 §5 mục 3,
   X7 §5 mục 3, Y8 §5 mục 3, Z7 §5 mục 3, A8 §5 mục 3; 3 dòng lạ
   11:59–12:00Z vẫn còn trong log, không thêm dòng lạ mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h06'/lần** (23 lần/~48h12'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục. Reboot tiếp theo dự kiến ~22:36Z. Khoảng cách #22 → #23
   (3h04'35") là dài nhất từng ghi — dự báo theo trung bình có thể
   trượt ~1h.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 14 mẫu MemAvailable
   **1313 / 1315 / 1166 / 1461 / 1094 / 2734 / 2473 / 1572 / 1472 /
   1107 / 2074 / 4379 / 5044 / 4080 MB** (+ B9 ghi 1617 MB lúc
   20:39:16Z; max 5.044 MB = 82% ngưỡng guard 6144 MB). Max vẫn
   dưới ngưỡng guard nên chưa đủ mức thử lại theo quy tắc parent
   đợt 92 §3 mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ
   MỨC; A8 §5 mục 6: chạm ≥ 6 GB mới thử lại). **Lưu ý: RAM tăng
   vọt cuối lượt** (từ ~1,1–2,7 GB đầu lượt lên ~4,1–5,0 GB lúc
   20:52–20:53Z khi tải các luồng song song giảm — `free -m` lúc
   20:53:14Z: total 7934 MB, available 4080 MB) — gần ngưỡng hơn
   mọi lần trước; lượt sau nên đo lại sớm, nếu chạm ≥ 6 GB thì
   thử lại birefnet theo quy tắc. Ghi rõ để parent quyết.
   Birefnet-general vẫn 0 lần chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
9. **Reboot #16 — đề xuất ĐÓNG ở mức kẹp ~4 phút** (07:26:03Z →
   ~07:30:00Z; cận trên suy luận từ thời lượng re-run U4, xem
   §2.5): giờ từng giây KHÔNG chốt được vì dữ liệu còn sống không
   chứa timestamp nào trong khoảng kẹp — journal/wtmp volatile đã
   mất, /tmp đã dọn, verify.sh bị giết không để lại log giữa
   chừng. Chờ parent/user quyết có chấp nhận mức kẹp này hay giữ
   nợ mở. Thiếu giây chính xác không ảnh hưởng chu kỳ reboot hay
   bất kỳ kết luận nào khác.
10. **Lượt U4 18:59–19:01Z không có log chủ thể** (37 kết quả,
    `measurements.json` "at" 19:01:50.872Z; số liệu khác lượt U4
    của A10 trong suites.log) — chủ thể chưa xác định (suy đoán
    mạnh nhất: parent chạy lại sau closing; khả năng khác: process
    sót lần chạy đầu A10). Không ảnh hưởng kết luận mù #18, nhưng
    là một lỗ hổng ghi chép: các lượt chạy kiểm chứng độc lập nên
    để lại ít nhất một dòng log ghi chủ thể + thời gian.
11. **Khoảng mù #19 bắt đầu từ 20:40:35Z** (probe #19) — lượt sau
    (probe #20) đối chiếu từ mốc này. Reboot tiếp theo dự kiến
    ~22:36Z.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND100_B6_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round100-b6-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round100-b6.md`
(log luồng); scratch quét trong `hidden_files/round100-b6/` (`scan-wfs.sh`,
`scan-meta.txt`, `files-newstd.bin`, `wfs-newstd.txt`, `files-r7b.bin`,
`wfs-r7b.txt`, `files-copies.txt`, `wfs-copies.txt`, `probe-notes.txt`); log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
