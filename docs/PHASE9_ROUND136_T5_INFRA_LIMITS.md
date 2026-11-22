# PHASE9_ROUND136_T5_INFRA_LIMITS — Postboot boot mới 1ca1feaa PASS (poll 2, cờ 05:48:02Z; replay xong nhanh boot +16m10s, 0 Get: — toàn bộ từ cache) + Lượt yên #13 ĐO ĐƯỢC nhưng THƯA EVENT: median tickCost 58,0 ms (biên 2 ms, cao nhất 11 lượt), (c2)=1, P1/P3 YẾU, P4/P5 ngoài khoảng ở biên

> Luồng T5, đợt 136, lượt cron 12:35 +07 18/11/2026 (mở 05:35Z 18/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). T5 đợt 136 làm 3 phần theo brief: (1) postboot + nhánh A2
> watcher v6 cho boot mới 1ca1feaa; (2) kiểm started_at lượt 136 với
> reboot mới; (3) pha 2 phân tích (c2) lượt yên #13. **Đợt này có 1
> BOOT DUY NHẤT (1ca1feaa) trong phiên T5 — 0 reboot giữa lượt**
> (reboot xảy ra GIỮA đợt 135 và 136, trước khi lượt 136 mở). A2 KHÔNG
> kích hoạt đợt này (đúng — replay cài đủ 11/11 package, không có gì
> để repair). Lượt yên #13 ĐO ĐƯỢC, HỢP LỆ (attempt1 20/20 pass,
> median 58,0 ms ≤ 60 ms) nhưng THƯA EVENT ((c2)=1, so với 7 ở lượt
> #12): P1/P3 chỉ 1/1 nên YẾU (không kết luận mạnh), P4/P5 ngoài
> khoảng dự báo ở biên, P2 + P7 DUNG, P6 trong/ngoài khoảng thực
> nghiệm (không verdict theo thiết kế). **Ngưỡng ≤60 ms GIỮ** (biên
> chỉ còn 2 ms — đợt 137 cần xem median có ở lại vùng ≥55 ms không).
> Nợ: R9 (a) vẫn chờ user — số đếm VẪN LÀ 16; G1 khung (a) M2 vẫn
> hoãn. KHÔNG push. KHÔNG release/tag. KHÔNG sửa production
> (preview.tsx giữ 530e10a7 — fix của T3, T5 không đụng). CẤM kiểm
> lại TTS 39; birefnet không thử (RAM dưới guard 6 GiB theo cách đọc
> của T4; xem §9.2).

## 1. Kết luận ngắn

1. **POSTBOOT BOOT MỚI PASS — CỜ VIẾT 05:48:02Z (poll 2).**
   Boot 1ca1feaa (btime 05:29:34Z theo `stat /proc/1`, 05:29:18Z theo
   `uptime -s` — chênh 16 s, cùng boot_id): replay DANG CHAY lúc T5
   mở (05:41Z, boot +11m: dpkg 2 dòng / 0 installs, apt-get update
   pid 814 + wrapper os-intent pid 793 đang chạy, GST 0 file, lists
   3) NHƯNG XONG NHANH: dpkg **1545 dòng / 221 installs** (TRÙNG
   baseline d2e66749/78b55838), dòng cuối 05:45:44Z
   (gstreamer1.0-tools, boot +16m10s); GST **269 file**; lists 39;
   partial 0; **gstreamer1.0-plugins-bad ĐÃ CÀI 1.24.2-1ubuntu4**; gl
   1.24.2-1ubuntu0.7 ĐÃ CÀI; 0 proc apt/dpkg/wrapper lúc 05:46:09Z.
   **term.log 0 dòng `Get:` — replay không download gì, cài toàn bộ
   từ cache bền vững** (156M / 178 .deb). Postboot poll0 **PASS exit
   0 ngay 05:45:10Z** (11 gói đích đủ TRƯỚC khi gói cuối tools xong
   05:45:44Z — tools không nằm trong NEED, xem §2.1); watcher b89 v6
   2 poll (05:47:01Z, 05:48:02Z) đều exit 0, TRIGGER=NO cả 2 (đúng —
   PASS, không có gì để repair) → **cờ `POSTBOOT_PASS` viết
   05:48:02Z (poll 2)**, watcher exit 0. T4 đọc cờ ở poll #9
   (05:48:28Z, 26 s sau khi ghi) và mở cửa yên 1 lần, attempt1 chạy
   thành công 05:48:28Z → exit 0 05:52:42Z (xem §7). **--repair: 0
   lần.**
2. **STARTED_AT LƯỢT 136: KHÔNG BỊ VIẾT LẠI — GIẢ THUYẾT TINH CHỈNH
   ĐỨNG VỮNG (§6).** Run đợt 136 `7283f96f-f23f-44c5-ab5a-02c22af0f3ed`:
   sched = started_at = 1794980151 (05:35:51Z), jitter **0 s**,
   status running lúc kiểm 05:48Z. Boot 1ca1feaa (btime 05:29:34Z)
   xảy ra **TRƯỚC** lượt (sched 05:35:51Z) — không có reboot nào
   GIỮA lượt để kích hoạt viết lại, đúng như giả thuyết "viết lại
   một lần duy nhất tại reboot đầu tiên GIỮA lượt". Run đợt 135
   f2fa4088: started_at VẪN 1794972956 (03:35:56Z), status nay
   `succeeded` — **không viết lại lần 2** (xác nhận lần nữa).
3. **LƯỢT YÊN #13 ĐO ĐƯỢC, HỢP LỆ — NHƯNG THƯA EVENT (§8).**
   Attempt1 T4 (20/20 pass, JSON 2.944.128 B, sha256 `266767c0…`,
   flip afterPass=5 wallMs=29731): **tickCost median 58,0 ms** (n=516;
   post n=381 median 58,0) — DƯỚI ngưỡng ≤60 ms nhưng **biên chỉ
   còn 2 ms, CAO NHẤT trong 11 lượt yên hợp lệ** (trước đó cao nhất
   56,0 ms). (c2)=1 (seq 334, lag +1f), coverage log draw **1/1**
   (delta +56 ms), blendTick hậu-flip 307/307 trong ±500 ms của log.
   **P1: YẾU** (1/1 trong ±1 tick run-end, p≈0,22 — n=1 không kết
   luận mạnh); **P2: DUNG** (1/1 lag +1f, 0 lag âm); **P3: YẾU**
   (1/1 đóng băng-tai-tick, p≈0,30); **P4: KHÔNG DUNG theo khoảng**
   ((c2) thuần +1f = 1 < 2; tổng skp=0 = 1 < 2; skp=1 = 0; lag ≥+5f
   = 0); **P5: KHÔNG DUNG hoàn toàn** (3/4 tiêu chí con ngoài
   khoảng, đều ở biên: snap−label 52 ms vs 34–48; label-floor +1
   62,7% vs 63–76; run ≥3 tick = 23 vs 13–22; raw−label 10 ms trong
   8–10); **P6: không verdict** (bin0 42,0% vs 33–39; +1/+2 32,6%
   vs 33–53; +3 14,2% vs 3–19); **P7: DUNG (làm yếu desync)** —
   coverage 1/1, 0 entry ≥+1 (caveat: log thưa hơn, drawSrc gap
   median 109 ms vs 82 ms đợt 135). **Cộng dồn: P1 22/22** (21/21 +
   1/1), **P3 21/22** (20/21 + 1/1). **Ngưỡng ≤60 ms GIỮ.**
   **Logger đã nới KIỂM CHỨNG RUNTIME LẦN 2 LIÊN TIẾP: c2DrawLog
   n=994 phủ loop 1–21, 20 wrap, 1 epoch** — củng cố quyết GIỮ fix
   530e10a7 (đã quyết từ đợt 135).
4. **0 reboot trong phiên T5** (05:41Z–06:03Z, boot 1ca1feaa xuyên
   suốt) — đợt thứ 2 liên tiếp T5 không phải làm lại pha 1.
5. **Headroom inotify: 2281 (mở) → 2276 (cuối)** — giảm ~113 so
   với cuối đợt 135 (2389); vẫn trên ngưỡng báo user (< ~1.800)
   ~476, chỉ theo dõi. RAM phiên T5: **1,95–6,11 GB** (mở ~6,1 GB,
   cuối ~1,95 GB — xem §9.2).
6. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (mỗi đợt nhắc 1 lần;
   T5 đợt 135 viết 17 đã bị đính chính, không lặp lại).
7. **F-135-T5-3 ĐÃ ĐÓNG:** script pha 2 đã sửa field `label` →
   `frame` (fallback `label` giữ cho JSON cũ); regression trên JSON
   đợt 135 cho label-floor {0: 207, 1: 617} khớp rerun T3, diff còn
   lại duy nhất là dòng đó (xem §8.7).
8. **Stale vite.lock: KHÔNG KIỂM đợt này** (T5 không đụng
   lock/queue; T6 kiểm lockhealth — ghi rõ để khỏi đọc thành "đã
   kiểm là sạch").

## 2. Timeline — 1 boot duy nhất trong phiên T5 (đợt 136)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 1ca1feaa | 05:29:34 | còn sống (06:03Z: ~34 phút) | Replay xong nhanh 1545/221 (boot +16m10s), postboot PASS ngay, cờ 05:48:02Z; T4 attempt1 20/20 pass |

- Boot bcc71e61 (đợt 135, btime 03:35:20Z) chết ~05:29Z (reboot
  GIỮA đợt 135 và 136, sau khi T10-135 đóng sổ 03:38Z); cờ
  POSTBOOT_PASS của 78b55838 (02:45:13Z) thành STALE, nằm ở
  `round135-t5/` — T5 KHÔNG đụng (thư mục khác; watcher b89 ghi
  `NO_FLAG_AT_START` vì `round136-t5/` chưa có cờ).
- Chốt chặn `round-in-progress.md` TỒN TẠI suốt phiên T5 — là marker
  MỞ ĐỢT 136 do parent tạo (05:35Z), KHÔNG phải đợt main-chat
  (tiền lệ đợt 130–135). T5 tiến hành bình thường.

### 2.1 Boot 1ca1feaa — replay đang chạy lúc mở, xong nhanh

- Boot lúc T5 mở (05:41:00Z): btime 05:29:34Z (theo `stat /proc/1`),
  tuổi ~11 phút. dpkg.log **2 dòng / 0 installs** (dòng cuối
  "startup packages configure" 05:35:43Z); GST 0 file (thư mục chưa
  tồn tại); lists 3; partial 0. **apt-get update pid 814 + wrapper
  os-intent pid 793 ĐANG CHẠY** — replay ĐÃ BẮT ĐẦU (khác dạng (B):
  có proc apt). plugins-bad/gl/tools CHƯA CÀI lúc mở.
- **Bracket replay (kẹp từ dpkg.log + quan sát live):**
  configure 05:35:43Z (boot +6m09s) → install đầu tiên 05:42:34Z
  (boot +13m00s — **apt-get update mất ~6m51s**) → plugins-bad cài
  05:44:30Z → gói cuối gstreamer1.0-tools 05:45:44Z (boot +16m10s).
  Tổng bracket: (configure +6m09s, xong +16m10s]; installs chạy
  (05:42:34Z, 05:45:44Z] (~3m10s cho 221 installs — nhanh vì toàn
  bộ từ cache).
- **0 dòng `Get:` trong `/var/log/apt/term.log`** — replay không
  download gói nào; cài từ cache bền vững (`/var/cache/apt/archives`:
  156M, 178 .deb — TRÙNG số đợt 135, bind-mount từ host). `partial/`
  trống. `history.log`: ~50 transaction `apt-get install` (mỗi
  gói/nhóm một invocation, khớp vòng lặp per-package đã xác định
  đợt 135 §6.2); plugins-bad cài trong transaction 05:44:30Z.
- **Chênh btime 16 s (ghi rõ, không phải mâu thuẫn):** `uptime -s`
  = 05:29:18Z; `stat /proc/1` = 05:29:34Z; `who -b` = 05:29. Cờ
  POSTBOOT_PASS của T5 ghi btime=05:29:34Z (theo `stat /proc/1`,
  đúng quy ước đợt 134–135); poller T4 ghi btime=05:29:18Z (theo
  /proc/stat). Cùng boot_id 1ca1feaa; không có reboot nào trong phiên
  nên chênh này không ảnh hưởng khung chết. T4 cũng ghi nhận chênh
  này ở LIMITS T4 §4. (Đính chính nhỏ: T4 §4 viết "(T5 ghi lúc
  watcher phát hiện boot mới)" — không chính xác: T5 ghi btime theo
  `stat /proc/1`, không phải thời điểm watcher phát hiện boot; xem
  F-136-T5-5.)
- Postboot poll0 05:45:10Z: **PASS exit 0** (wrapper/libs/GST/apt đủ
  — xem §3). Watcher b89 v6 2 poll (05:47:01Z, 05:48:02Z) đều exit 0,
  TRIGGER=NO cả 2 (đúng), **cờ `POSTBOOT_PASS` viết 05:48:02Z**
  (boot +18m28s, poll 2). Tổng trên boot này: postboot PASS 3/3
  (poll0 + watcher 2 poll), 0 FAIL. **KHÔNG --repair.**
- **Vì sao poll0 PASS lúc 05:45:10Z trong khi gói cuối tools chỉ
  xong 05:45:44Z:** 11 gói NEED đã đủ trước 05:45:10Z (plugins-bad
  xong 05:44:30Z); gstreamer1.0-tools là gói cuối trong ledger
  nhưng KHÔNG nằm trong NEED 11 gói của postboot-check. PASS lúc
  05:45:10Z là đúng theo định nghĩa "đủ điều kiện chạy WebKit" của
  script — không phải lỗi đo. Ghi rõ để khỏi đọc thành "poll0 PASS
  trước khi replay xong là sai".
- preview.tsx md5 lúc mở = lúc đóng = **530e10a7** (fix T3 còn nguyên;
  T5 không đụng).
- RAM lúc mở ~6.115.608 kB (≈6,1 GB — xem §9.2 về guard birefnet).

## 3. Postboot script — sửa 2 lần (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5 `7f4d3d02…`
(cuối đợt 135) → **`31eec0b6…`** (đợt 136, boot 1ca1feaa):

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 05:42–05:44Z | 1ca1feaa | `7f4d3d02…` → `bdf4119a…` | header (đoạn Dot 136) + say: boot mới, replay đang chạy lúc 05:41Z — **nhưng say khẳng định sai "poll0 FAIL lúc mở" (F-136-T5-1: viết trước khi chạy poll0)** |
| 2 | 05:46Z | 1ca1feaa | `bdf4119a…` → `31eec0b6…` | sửa say cho đúng thực tế: replay xong nhanh 1545/221 (dòng cuối 05:45:44Z), poll0 PASS exit 0 lúc 05:45:10Z |

- `bash -n` OK sau mỗi lần sửa. **KHÔNG đổi logic** (không đổi thứ
  tự apt/GST, không đổi NEED/threshold).
- Lưu ý: dòng `say` đầu in `[postboot 2026-11-18 05:29:18]` — đó là
  `$BOOT` (`uptime -s`), KHÔNG phải giờ chạy script (poll0 chạy
  05:45:10Z). Hành vi có sẵn của script (say dùng BOOT làm prefix),
  không phải lỗi mới; ghi rõ để khỏi đọc nhầm timestamp log
  (đã ghi từ đợt 135 §3).

## 4. Watcher — b89 v6 (cùng logic C4/EVAL, chỉ đổi boot/header)

| Watcher | Boot | md5 | Chạy | Kết cục |
|---|---|---|---|---|
| b89 | 1ca1feaa | `27778508…` | 05:47:01–05:48:02Z, 2 poll | PASS ổn định → cờ 05:48:02Z, exit 0 |

- Copy từ b88 v6 đợt 135 (`5c83b9b6…`); diff sau chuẩn hoá (đổi tên
  round/boot/btime/mốc dpkg): **chỉ còn header + btime +
  LAST_LINE_TS — KHÔNG đổi logic C4/EVAL/luật (C)/ngưỡng poll nào.**
  `bash -n` OK trước khi chạy.
- `NO_FLAG_AT_START 05:47:01Z` (thư mục round136-t5/ mới, không có cờ
  stale — cờ 78b55838 nằm ở round135-t5/, không đụng).
- Lỗi hiển thị đã biết, KHÔNG sửa (đã ghi từ đợt 127 §7.3 mục 5):
  `last_install` vẫn đọc "installed" thay vì tên gói (awk lấy nhầm
  cột). Không ảnh hưởng EVAL.

## 5. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL

### 5.1 Watcher b89 (boot 1ca1feaa) — TRIGGER=NO cả 2 poll (đúng)

| Poll | Thời gian | dpkg / installs | silent | (1) FAIL tươi | (2a) 0 proc | (4) dạng | TRIGGER |
|---|---|---|---|---|---|---|---|
| 1 | 05:47:01Z | 1545 / 221 | 77 s | no (exit 0) | yes | - (no) | **NO** |
| 2 | 05:48:02Z | 1545 / 221 | 138 s | no (exit 0) | yes | - (no) | **NO** → FLAG_WRITTEN |

- Poll 1: `frozen=no` (poll đầu chưa có PREV_LINES — hành vi đã biết).
  Poll 2: frozen=yes + PASS streak 2 → FLAG_WRITTEN 05:48:02Z.
- Luật (C): KHÔNG KÍCH HOẠT (a=no cả 2 poll; 0 proc đang chạy).
- **A2 KHÔNG kích hoạt đợt này — ĐÚNG:** replay cài đủ 11/11 package
  (plugins-bad có sẵn 1.24.2-1ubuntu4), postboot exit 0 nên C1=no,
  C4=no. A2 chỉ bắt hình dạng "replay xong mà thiếu gói đích" — hình
  dạng đó không xuất hiện boot này. Trạng thái widen: "A2 đã kích
  hoạt live đợt 134 (plugins-bad)" giữ nguyên; watcher v6 giữ nguyên,
  không cần sửa.

## 6. Kiểm started_at — giả thuyết tinh chỉnh ĐỨNG VỮNG

Truy vấn `scheduler.job_runs` (qua `muse.db`, lúc ~05:48Z 18/11/2026,
job `vcut-build-loop`):

| Run | sched_utc | started_at_utc | Jitter | Status |
|---|---|---|---|---|
| Đợt 136 `7283f96f-f23f-44c5-ab5a-02c22af0f3ed` | 1794980151 (05:35:51Z) | 1794980151 (05:35:51Z) | **0 s** | running |
| Đợt 135 `f2fa4088-300b-4f7f-934e-26985120baa6` | 1794969351 (02:35:51Z) | 1794972956 (03:35:56Z) | +3605 s | **succeeded** |

- **Lượt 136: KHÔNG bị viết lại.** started_at = sched đúng từng giây
  (jitter 0 s). Boot 1ca1feaa btime 05:29:34Z xảy ra **TRƯỚC** sched
  05:35:51Z (sched − btime = +377 s — đây là khoảng cách boot→lượt
  hẹn, KHÔNG phải offset viết lại; không nằm trong dải 31–46 s của
  các lần viết lại trước, và không được đọc thành offset viết lại).
  Không có reboot nào GIỮA lượt (từ sched 05:35:51Z tới lúc kiểm)
  nên không có điều kiện kích hoạt viết lại — **khớp chính xác giả
  thuyết tinh chỉnh của T7: "viết lại một lần duy nhất tại reboot đầu
  tiên GIỮA lượt"**.
- **Lượt 135: KHÔNG viết lại lần 2.** started_at vẫn 1794972956
  (03:35:56Z = btime bcc71e61 03:35:20Z + 36 s) như T10-135 đã ghi lúc
  đóng; status nay `succeeded`. Chuỗi offset sau btime giữ nguyên:
  46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) —
  đều trong dải 31–46 s; lượt 136 không thêm offset nào vì không có
  viết lại.
- **Hàm ý:** giả thuyết đã được kiểm chứng ở cả hai chiều — có reboot
  giữa lượt → viết lại 1 lần (đợt 131–135); không có reboot giữa lượt
  (chỉ reboot trước lượt) → không viết lại (đợt 136). T10 kiểm lại
  lúc đóng đợt 136 xem có reboot nào xảy ra sau 05:48Z không; nếu
  có, started_at lượt 136 dự kiến bị viết lại 1 lần theo mẫu btime +
  ~31–46 s.

## 7. Cờ gate-visible — tới kịp, T4 mở cửa 1 lần

- Cờ 1ca1feaa (05:48:02Z, poll 2) TỚI ĐƯỢC GATE: T4 poll #9 05:48:28Z
  đọc `t5flag=PASS` (26 s sau khi ghi) + gate A đủ (RAM 4782 MB,
  load5 1,99) → **cửa mở, attempt1 chạy ngay** (20/20 pass,
  run-attempt exit 0 05:52:42Z). Không có lần mở nào bị bỏ lỡ (khác
  đợt 135 — poller T4 đợt này đã sửa lỗi gọi nhầm script, F-135-T4-1
  đã khắc phục).
- **Blockers=6 ở poll #6 T4 (05:46:13Z) — danh tính vẫn chưa xác
  định; đoán của T4 về watcher b89 là SAI THỜI GIAN (F-136-T5-4):**
  b89 chỉ khởi động 05:47:01Z, 48 s SAU poll #6, nên không thể là
  blocker lúc đó. Giả thuyết hàng đầu chưa chứng minh: vite harness
  của T8 (chạy song song, process vite khớp mẫu `[v]ite` của poller)
  và/hoặc chính lần chạy postboot check-only của poller T4 (đường
  dẫn script chứa `webkit`, khớp mẫu `[w]ebkit` — poller không loại
  trừ tiến trình con của chính nó). Không có ps snapshot nên không
  kết luận được — nợ vẫn mở, xem §12 mục 5.
- Cờ stale 78b55838 vẫn ở `round135-t5/` — không đụng, không mâu thuẫn
  cờ (T4 đọc đúng `round136-t5/POSTBOOT_PASS`).
- **Kiểm đúng đường dẫn cờ (brief item 5):** T5 xác nhận
  `round136-t4.done` CHƯA tồn tại lúc 05:53Z (T4 đang viết LIMITS)
  và XUẤT HIỆN lúc 05:57Z — đọc đúng
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/
  round136-t4.done`, không nhầm với thư mục `round136-t4/` hay cờ
  đợt khác. Không lặp lại mâu thuẫn cờ đợt 135 (F-135-T5-5).

## 8. PHA 2 — Lượt yên #13: ĐO ĐƯỢC, HỢP LỆ, NHƯNG THƯA EVENT

### 8.0 Dữ liệu đầu vào (đủ trigger pha 2 đầy đủ)

- Attempt1 T4: 20/20 pass, run-attempt exit 0 05:52:42Z, JSON
  `preview-b-f3-flip-webkit-t4-attempt1.json` **2.944.128 B, sha256
  `266767c0f7fe270dc7f0673f78ad5c341ed4d3decac2399237d777b1282a2847`**
  (T5 tự tính — khớp sha T4 công bố), flip afterPass=5 wallMs=29731,
  engine webkit 27.2, pageErrs=[].
- Labellag T4: `analyze-t4-attempt1-labellag.txt` ((c2) skp=0 n=1;
  (c2) skp=1 n=0).
- Script pha 2 `t5-c2-drawlog-analysis.py` (copy từ đợt 135 + sửa
  field label→frame, xem §8.7) chạy được ngay trên JSON đầy đủ —
  output `t5-c2-drawlog-analysis.txt` (exit 0). Rerun code T3
  `t3-step2-verify136.py` (đọc code, chạy lại — KHÔNG copy kết quả
  T3) — output `t5-histogram-rerun.txt` (exit 0).
- **Lưu ý về T4.done/T3:** `round136-t4.done` xuất hiện 05:57Z (T4
  đã viết LIMITS); `round136-t3.done` CHƯA xuất hiện lúc T5 đóng
  (~06:03Z) — verdict bước 2 của T3 chưa công bố. Pha 2 của T5 đối
  chiếu với **LIMITS T4 đã đọc được** (§8.5) và với **rerun code T3**
  (§8.6) — không phụ thuộc vào file .done của T3 (JSON + labellag
  đã final từ 05:52:42Z). T10 kiểm lại verdict T3 khi nó xuất hiện;
  số liệu pha 2 không đổi theo .done. **Rerun code T3 KHÔNG được
  tính là kiểm chứng độc lập thứ ba** (theo brief): kiểm chứng độc
  lập gồm 2 lần tính — script riêng của T5 + phân tích của T4; rerun
  code T3 chỉ là đối chiếu chéo.

### 8.1 Kết quả — tính độc lập bằng script riêng (khớp 100% với T4)

| Hạng mục | T5 tính lại (độc lập) | T4 công bố (LIMITS T4) | Đối chiếu |
|---|---|---|---|
| JSON sha256 | `266767c0…` (2.944.128 B) | như vậy | **KHỚP** |
| flip | afterPass=5, wallMs=29731 | như vậy | **KHỚP** |
| blendTick / tickCost | n=411 / n=516, median **58,0 ms** | n=411 / n=516, median 58,0 | **KHỚP** |
| tickCost post (flip+2000) | n=381, median 58,0 | n=381, median 58,0 | **KHỚP** |
| tickCost p90 / max / min | 89,0 / 153 / 31 | 89,0 / 153 / 31 | **KHỚP** |
| wallbands median | 60,0 / 58,0 / 56,0 / 52,0 / 64,0 / 59,0 | y hệt | **KHỚP** (p90 lệch do cách nội suy percentile khác nhau — xem §8.5) |
| c2DrawLog | n=994, loopNo 1–21, 20 wrap, 1 epoch, wallMs 11164→89072 (span 77.908 ms) | y hệt | **KHỚP** |
| (c2) skp=0 | n=1: seq 334 (presented 16, label 15, lag +1f) | y hệt | **KHỚP** |
| (c2) skp=1 | n=0 | n=0 | **KHỚP** |
| coverage (c2) | 1/1 (seq 334, delta +56 ms) | 1/1 (delta +56 ms) | **KHỚP** |
| blendTick hậu-flip trong ±500 ms log | 307/307 (100%) | 307/307 (100%) | **KHỚP** |
| lag ≥+5f | 0 event | 0 event | **KHỚP** |
| histogram (m*−label) | {−13: 5, −12: 6, −11: 2, −9: 2, −5: 1, −1: 46, 0: 258, +1: 74, +2: 126, +3: 87, +4: 7} (rerun T3) | y hệt (script T4) | **KHỚP** |
| skew | snap−label median 52,0 ms; raw−label median 10,0 ms | 52 ms / 10 ms | **KHỚP** |
| label-floor | {0: 229, 1: 385} → +1 = 62,7% | (T3 rerun: y hệt) | **KHỚP** |
| curPix run ≥3 tick | 23 run, 103/307 tick trong run | 23 run | **KHỚP** |
| lớp B | 5/5 ĐẠT (theo file classb T4) | 5/5 ĐẠT | **KHỚP** |
| F6' | ĐÓNG lần 2 (77/77, 100%) | ĐÓNG lần 2 | **KHỚP** |

- Bổ sung của T5 so với T4: B2 cặp drawSrc→rawUnit `{0: 478}`
  (rawUnit luôn cùng frame với drawSrc gần nhất); B3 chi tiết từng
  loop (drawSrc n=19–31/loop, loop 1: 19, loop 12: 1 — 2 entry biên
  tại wrap, khớp byLoop của T4 khi cộng cả rawUnit); B5 drawSrc gap
  median **109,0 ms** (min 47, max 1546; >33 ms: 515/515; >66 ms:
  492/515 — log thưa hơn đợt 135: 82,0 ms, xem caveat P7 §8.4); B-P7
  chi tiết seq 334 (entry gần n=12, drawSrc 6 lag [−1, −1, 0, 0, 0,
  0], rawUnit 6 lag y hệt).

### 8.2 Verdict từng dự báo P1–P7 (lượt #13)

- **P1: YẾU (n=1, không kết luận mạnh)** — (c2) 1/1 trong ±1 tick
  của run-end (seq 334 đúng cuối run (332, 334, 3), dist 0); đối
  chứng: 67/307 tick post (21,8%) gần run-end; p nhị thức ≈ 0,22
  (rerun T3: baseline 67/307, p=0,218; baseline riêng của T3 69/307,
  p=0,225 — lệch 2 tick do định nghĩa baseline khác nhau, xem
  §8.5). Run-end là (c2): 1/23 run-end. Độ dài run kết thúc tại
  (c2): [3]; run TB 4,5, max 7. **Không đủ mẫu để củng cố hay bác
  prereg** — verdict "YẾU" là của chính script T3 (n≤2).
- **P2: DUNG** — 1/1 (c2) lag ≥ +1f (toàn +1f), 0 lag âm.
- **P3 (A1): YẾU (n=1, không kết luận mạnh)** — đóng băng-tai-tick
  1/1 [334]; tick bắt kịp 0; đối chứng: 92/306 tick post (30,1%)
  đóng băng; p ≈ 0,30 (rerun T3). Cùng lý do như P1: n=1.
- **P4: KHÔNG DUNG theo khoảng** — (c2) thuần +1f = 1 (dự báo 2–8);
  tổng skp=0 = 1 (2–12); skp=1 = 0 (đúng 0); lag ≥+5f = 0 (đúng 0).
  Lượt này thưa event (chỉ 1 (c2) so với 7 ở lượt #12) nên số đếm
  rơi dưới khoảng — đây là hệ quả của mẫu nhỏ, không phải bằng
  chứng chống lại cơ chế ghost-freeze (lag vẫn +1f, freeze vẫn
  đúng tại seq duy nhất).
- **P5: KHÔNG DUNG hoàn toàn** — 3/4 tiêu chí con ngoài khoảng, đều
  ở biên: snap−label median **52,0 ms** (34–48 — vượt 4 ms);
  raw−label median **10,0 ms** (8–10 — trong, ở biên trên);
  label-floor +1 **62,7%** (63–76 — thiếu 0,3 điểm %);
  run ≥3 tick = **23** (13–22 — vượt 1). Cả 3 lệch đều cùng chiều
  với tickCost tăng (median 58 vs 40 ms đợt 135) — nhất quán với
  lượt chậm hơn, không phải mâu thuẫn mới. **Đây là lần đầu P5
  không dung kể từ khi prereg được đặt** — ghi rõ để T3/T10 xem
  có cần hiệu chỉnh khoảng P5 không (không phải việc của T5).
- **P6: KHÔNG VERDICT (theo thiết kế)** — khoảng thực nghiệm, 2/3
  bin ngoài khoảng ở biên: bin 0 = 42,0% (33–39 — vượt 3,0 điểm %);
  +1/+2 = 32,6% (33–53 — thiếu 0,4 điểm %); +3 = 14,2% (3–19 —
  trong). Histogram n_ghost=614, nomatch=0. Đuôi +3 tăng mạnh so với
  đợt 135 (3,3% → 14,2%) và đuôi âm tăng (6,3% → 10,1%) — nhất quán
  với snap−label tăng 35 → 52 ms.
- **P7: DUNG (làm yếu desync)** — coverage 1/1; tại 12 entry log
  trong ±500 ms của tick (c2): floor(ct*30)−frameIdx = {−1: 4, 0: 8}
  — **0 entry ≥+1** (drawSrc không trễ sau ct); chỉ drawSrc {−1: 2,
  0: 4}; cặp rawUnit−drawSrc {0: 6}. **Caveat (ghi rõ, mạnh hơn đợt
  135):** log draw thưa hơn (drawSrc gap median 109 ms ≈ 3,3
  frame, so với 82 ms đợt 135) nên không phân giải được lệch 1
  frame (33 ms) — P7 làm yếu giả thuyết desync, không loại trừ hoàn
  toàn lệch dưới 1 frame. Đây là giới hạn của phương pháp, không
  phải lỗi đo.
- **Verdict tổng lượt #13: ĐO ĐƯỢC, HỢP LỆ (median 58,0 ≤ 60 ms),
  NHƯNG THƯA EVENT — P1/P3 YẾU, P4/P5 NGOÀI KHOẢNG Ở BIÊN.**
  Không đủ sức mạnh để củng cố hay bác prereg ghost-freeze/skew;
  cũng không có bằng chứng nào chống lại nó (seq duy nhất vẫn lag
  +1f, freeze đúng, coverage đầy). **Ngưỡng ≤60 ms GIỮ NGUYÊN**
  (median 58,0 ms; chuỗi 11 lượt hợp lệ: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / **58,0**, trung bình
  47,3 ms — đính chính: trung bình 10 lượt trước là 46,3 ms, không
  phải 46,6 ms như LIMITS đợt 135 đã viết; F-136-T1-3 của T1-136 đã
  ghi). **Cộng dồn: P1 22/22** (21/21 + 1/1), **P3 21/22** (20/21 +
  1/1).

### 8.3 Ghi chú skew toàn-tick (bổ sung, không thay số P5)

- Script pha 2 tính skew trên cửa sổ post (n=307): snap−label 52 ms,
  raw−label 10 ms. Tính lại trên TOÀN BỘ tick (n=411):
  snap−label median **49 ms**, raw−label 10 ms — cả hai đều ngoài
  khoảng P5 (34–48) nên verdict P5 không đổi theo cách tính nào.
  Label-floor toàn-tick: {0: 311, 1: 511} → +1 = 62,2% (cũng ngoài
  63–76). Ghi để khỏi ai tính lại toàn-tick rồi tưởng mâu thuẫn.

### 8.4 Logger đã nới — KIỂM CHỨNG RUNTIME LẦN 2 LIÊN TIẾP

- c2DrawLog n=994 phủ **loopNo 1–21** (loop 3–11 và 13–21 mỗi loop
  38–60 entry; loop 1: 36, loop 12: 1 — 2 entry biên/cắt, xem
  caveat T4 §6), **20 wrap**, 1 epoch duy nhất, wallMs 11164→89072
  (span 77.908 ms ≈ 26 vòng video 3 s). Khác hẳn logger cũ (chỉ
  loop 1–2).
- **Fix loop-gate nới + re-enable không xóa mảng (530e10a7) TIẾP TỤC
  HOẠT ĐỘNG ĐÚNG Ở RUNTIME — lần kiểm chứng thứ 2 liên tiếp.**
  Quyết GIỮ fix của parent (đợt 135 §12.3(a)) được củng cố thêm.
  T5 đồng ý đề xuất GIỮ fix của T4 (LIMITS T4 §10.2).
- Lưu ý đọc đúng: log chứng minh logger GHI ĐƯỢC loop ≥3 + wrap, và
  P7 dùng được log để kiểm desync — nhưng log thưa hơn đợt 135 (gap
  median 109 ms vs 82 ms) nên P7 chỉ làm yếu desync, không chứng
  minh "không desync tuyệt đối" (xem caveat §8.2 P7).

### 8.5 Đối chiếu với T4 — khớp 100%, 2 khác biệt nhỏ về định nghĩa

- **Baseline P1 67 vs 69:** script T5 + dòng "đối chiếu T5
  signed-dist" của rerun T3 đều cho 67/307 tick post trong ±1 tick
  của run-end; dòng P1 riêng của T3 cho 69/307. Lệch 2 tick do định
  nghĩa baseline khác nhau (signed-dist vs định nghĩa riêng của T3),
  không phải lệch dữ liệu — p ≈ 0,22 cả hai cách, verdict P1 YẾU
  không đổi. Ghi rõ để khỏi đọc thành "T4 với T5 lệch 2 tick".
- **p90 wallbands:** T5 tính bằng nearest-rank (0–20k: 90; 20–32k:
  91; 62–70k: 99) trong khi T4 dùng nội suy percentile (89,2 / 86,5 /
  94,2). **Median — số quyết định verdict — khớp chính xác cả 6
  dải.** p90 không ảnh hưởng verdict nào; ghi rõ để khỏi đọc thành
  lệch số.
- Mọi số còn lại khớp chính xác giữa T5 và T4 (xem bảng §8.1).

### 8.6 Đối chiếu với rerun code T3 (chạy lại, không copy — KHÔNG tính là kiểm chứng độc lập thứ ba)

- Chạy `t3-step2-verify136.py` (code T3 đợt 136) trên cùng JSON +
  cùng GT frames: **khớp 100% mọi số với T5** — sha256, flip,
  blendTick 411/post 307, tickCost median 58,0 (post 381), histogram
  y hệt, skew 52/10 ms, label-floor {0: 229, 1: 385}, (c2) 1/1 +
  skp=1 0, P1 k=1/1 p≈0,22, P3 1/1 p≈0,30, P4/P5/P6/P7 y hệt.
- Verdict T3 bước 2 chưa công bố lúc T5 đóng (T3 đang chờ T4.done —
  `round136-t3.done` chưa xuất hiện 06:03Z); nhưng vì mọi số đầu
  vào khớp 100% giữa 2 lần tính độc lập (T5 + T4) và rerun code T3,
  verdict T3 kỳ vọng khớp T5 trên mọi dự báo — nếu T3 công bố khác
  thì đó là khác biệt diễn giải (đặc biệt ở P4/P5: "ngoài khoảng"
  vs "yếu"), không phải khác biệt số. T10 đối chiếu khi T3 công bố.
- Đối chiếu T4: mọi số khớp (§8.1) + khớp verdict "lượt #13 đo
  được, median 58,0, ngưỡng giữ, biên 2 ms, logger kiểm chứng lần
  2". Không có số nào lệch giữa 3 lần tính (T5, T4, code T3).

### 8.7 Sửa schema label-floor — F-135-T5-3 ĐÃ ĐÓNG (có kiểm chứng)

- Script pha 2 đợt 136 lấy `g.get("frame", g.get("label"))` (dòng
  đã sửa, có comment FIX đợt 136) thay vì chỉ `g["label"]`.
- **Kiểm chứng hồi quy:** chạy script đã sửa trên JSON đợt 135 +
  labellag đợt 135 → output `t5-regression-135.txt` KHÁC output
  đợt 135 của T5 ở ĐÚNG 1 dòng: `label-floor: {0: 207, 1: 617}`
  (trước đây `{}`), khớp chính xác rerun T3 đợt 135. Mọi số còn lại
  giống hệt (diff 1 dòng duy nhất). **F-135-T5-3 ĐÓNG.**

## 9. Headroom inotify + RAM

### 9.1 Headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 133 cuối (T5) | 2623 | boot 07da9c50 |
| Đợt 134 mở / cuối (T5) | 2506 / 2499 | boot d2e66749 / cc1f9de0 |
| Đợt 135 mở / cuối (T5) | 2393 / 2389 | boot 78b55838 |
| **Đợt 136 mở (T5, boot 1ca1feaa)** | **2281** | **headroom-open.txt** |
| **Đợt 136 cuối (T5, boot 1ca1feaa)** | **2276** | **headroom-end.txt** |

- Giảm ~113 so với cuối đợt 135 (2389 → 2276); trong lượt chỉ giảm
  5 (2281 → 2276). Chuỗi dài hạn: …2625 → 2623 → 2506 → 2499 →
  2393 → 2389 → **2281 → 2276**. Vẫn gấp ~1,4 lần số watch vite
  thường cần (~1586). **Vite thường chạy được. Chưa tới ngưỡng báo
  user (< ~1.800) — chỉ theo dõi** (còn ~476). Trần 63747 cần can
  thiệp host — ngoài tầm luồng này.

### 9.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

- Phiên T5 (05:41Z–06:03Z): **1.950–6.115 MB** (tự đo theo
  MemAvailable). Các mốc T5: mở đợt 6.116 MB (05:45:10Z) → 6.134 MB
  (05:45:11Z) → 5.286 MB (watcher poll 1, 05:47:01Z) → 4.940 MB
  (poll 2, 05:48:02Z) → 2.000 MB (đóng 06:03:16Z). Poll log T4 cùng
  cửa sổ: 3.628–5.985 MB (min 3322 MB theo sampler T4 giữa lượt đo).
- **Về guard birefnet 6 GB:** số cao nhất T5 quan sát được là
  6.115.608 kB ≈ 6,12 GB (thập phân) nhưng chỉ ≈ 5,83 GiB — dưới
  guard 6 GiB (6.144 MB) theo cách đọc của T4 (LIMITS T4 §9: "RAM
  đã >6 GB lúc poll #4 — 5985 MB, vẫn dưới guard 6 GB"). T5 KHÔNG
  thử birefnet (không thuộc brief T5; việc của T9). Ghi rõ 2 cách
  đọc để khỏi ai lấy số 6,12 GB thập phân rồi kết luận "đã qua
  guard".
- RAM ≥1024 MB xuất hiện suốt phiên → cửa yên mở được ngay poll #9
  của T4 (khác đợt 134).

## 10. Fix instrumentation T3 — trạng thái cuối (T5 chỉ ghi nhận, không sửa)

- preview.tsx md5 cuối: **530e10a7** (fix còn nguyên; T5 kiểm lúc mở
  05:45:10Z và lúc đóng 06:03:16Z đều 530e10a7). media.ts `2c384ed1`,
  vite.config.ts `ee80d093` — KHÔNG ĐỔI (theo LIMITS T4 §0; T5 không
  đụng các file này).
- T4 (LIMITS T4 §10 mục 2) + T5 (§8.4) đều đề xuất **GIỮ fix cho đợt
  137 trở đi** (logger đã kiểm chứng runtime lần 2 liên tiếp: loop
  1–21, 20 wrap, coverage 1/1; quyết GIỮ đã có từ parent đợt 135
  §12.3(a)). Bản gốc 805409f0 vẫn còn nguyên tại
  `round134-t3/preview.tsx.orig-805409f0` nên revert sau vẫn làm được
  trong 1 bước nếu parent đổi ý.
- preview.tsx KHÔNG nằm trong stage file của T5 (việc của T3).

## 11. R9 (a) vẫn mở (ghi nhận, nhắc lần 16)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Đợt 136 là bằng chứng ngược: **0 reboot giữa lượt** — watcher b89
  chỉ cần 2 poll là xong; R9 (a) không ảnh hưởng đợt này. Nhưng
  reboot giữa đợt 135 và 136 (bcc71e61 → 1ca1feaa) vẫn là bằng chứng
  R9 (a) có giá trị khi reboot dồn dập; không có cơ sở rút lại đề
  xuất.
- **Nhắc lần 16.** (Đợt 135 là lần 16; số đếm VẪN LÀ 16, không tăng.)

## 12. Nợ mở sang đợt sau

1. **Ngưỡng tickCost ≤60 ms: biên chỉ còn 2 ms (median 58,0, cao
   nhất 11 lượt).** Không đổi ngưỡng từ một lượt; đợt 137 xem median
   có ở lại vùng ≥55 ms không — nếu có thì bàn lại ngưỡng/bar hoặc
   điều tra tải song song (giả thuyết hàng đầu của T4: load CPU
   song song đợt 136; RAM đã loại trừ). T5 không đổi ngưỡng.
2. **P4/P5 ngoài khoảng ở biên + P1/P3 YẾU (n=1)** — T3/T10 xem có
   cần hiệu chỉnh khoảng prereg (P5: snap−label 34–48, label-floor
   63–76%, run 13–22; P4: 2–8) hay giữ nguyên và chờ thêm lượt có
   nhiều event (c2) hơn. Không phải việc của T5.
3. **Lượt yên #14** — đo tiếp với logger đã nới trên boot 1ca1feaa
   nếu còn sống (postboot đã PASS, cờ 05:48:02Z còn hiệu lực cho boot
   này — kiểm boot_id/btime khớp trước khi dùng) hoặc boot mới.
   Cộng dồn hiện tại: **P1 22/22, P3 21/22**; ngưỡng ≤60 ms GIỮ.
4. **F-136-T4-1 (blockers=6 chưa xác định):** đợt sau thêm log `ps`
   snapshot khi blockers>0 trong poller T4 (T4 đã ghi nợ; T5 chỉ
   nhắc lại + đính chính: b89 không phải thủ phạm lúc poll #6, xem
   F-136-T5-4).
5. **started_at lượt 136:** T10 kiểm lại lúc đóng xem có reboot nào
   sau 05:48Z không; nếu có, dự kiến viết lại 1 lần theo mẫu btime +
   ~31–46 s (xem §6).
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 135 §12: mù #55
   mới (việc T2); G1 chờ user quyết; birefnet (chỉ thử lại khi quan
   sát được available ≥ 6 GiB, u2net là fallback chính thức);
   ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release
   gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 13. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng). `media.ts`: KHÔNG đổi (`2c384ed1`); `apps/web/vite.config.ts`:
  KHÔNG đổi (`ee80d093`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 2 lần
  (header + dòng `say`; md5 `7f4d3d02…` → `bdf4119a…` → `31eec0b6…`;
  không đổi logic).
- Watcher v6 trong hidden_files (KHÔNG stage): b89 (`27778508…`,
  2 poll, cờ 1ca1feaa 05:48:02Z); `bash -n` OK.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock/queue của luồng khác.
- `tsc` / `vite build`: KHÔNG chạy (không sửa production; tsc 0 +
  vite build PASS là của T3 lúc sửa preview.tsx).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM dưới guard
  6 GiB theo cách đọc của T4; xem §9.2).
- Postboot: boot 1ca1feaa PASS 3/3 (poll0 + watcher 2 poll).
  **--repair: 0 lần** (không cần — replay đủ). **TRIGGER: 0 lần**
  (A2/(B)/(C) đều NO — đúng vì PASS).
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=YES: 0.**
  **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT lần nào.**
- **Widen trigger A2: KHÔNG KÍCH HOẠT đợt này (đúng — không có hình
  dạng thiếu gói).** Trạng thái: "A2 đã kích hoạt live đợt 134
  (plugins-bad)" giữ nguyên.
- Headroom: 2281 (mở) → 2276 (cuối).
- RAM phiên T5: 1.950–6.115 MB (tự đo); min 3322 MB theo sampler T4
  giữa lượt đo.
- Stale vite.lock: không có (không kiểm lock dir đợt này — ghi rõ:
  T5 không đụng lock/queue; T6 kiểm lockhealth).
- **Pha 2 (c2): CÓ DỮ LIỆU ĐẦY ĐỦ — lượt #13 ĐO ĐƯỢC, HỢP LỆ nhưng
  THƯA EVENT: P1/P3 YẾU (n=1), P2 + P7 DUNG, P4/P5 NGOÀI KHOẢNG Ở
  BIÊN, P6 trong/ngoài khoảng thực nghiệm (không verdict).** Lượt
  #13 hợp lệ (median tickCost 58,0 ms ≤ 60 ms). Cộng dồn P1 22/22,
  P3 21/22. Ngưỡng ≤60 ms GIỮ.
- **Reboot GIỮA LUỘT: 0 lần** (boot 1ca1feaa xuyên suốt phiên T5).
- **started_at lượt 136: KHÔNG bị viết lại (jitter 0 s)** — giả
  thuyết tinh chỉnh đứng vững (xem §6).

## 14. Sai số của T5 đợt này (F-136-T5-N)

- **F-136-T5-1 — Dòng `say` khẳng định sai poll0 FAIL trước khi
  chạy poll0:** lúc sửa script lần 1 (~05:44Z), T5 viết say "postboot
  poll0 FAIL luc mo" dựa trên trạng thái lúc 05:41Z (replay đang
  chạy, GST 0) mà chưa chạy poll0. Thực tế poll0 PASS exit 0 lúc
  05:45:10Z (replay xong 05:45:44Z nhưng 11 gói đích đã đủ trước
  đó). T5 sửa lại say cho đúng trong lần 2 cùng đợt (md5 `bdf4119a`
  → `31eec0b6`), trước khi watcher chạy poll nào dùng script mới
  (b89 khởi động 05:47:01Z, sau lần sửa 2). Hậu quả: không có — log
  poll0 đầu (t5-postboot-poll0.log) chạy bằng script lần 1 nên in
  say sai ở dòng đầu, nhưng các dòng PASS/FAIL và exit code trong
  log đó đều đúng; không hành động nào dựa trên dòng say sai. Bài
  học: không khẳng định kết quả kiểm tra trong text tĩnh trước khi
  chạy kiểm tra đó.
- **F-136-T5-2 — Snippet tickCost lần đầu crash do sai tên field:**
  snippet tay dùng `costMs`/`ms`/`durMs` trong khi tickCost dùng
  field `total` — crash `TypeError` ở `statistics.median` (None).
  Tính lại bằng field đúng: total n=516 median 58,0 / post n=381
  median 58,0 — khớp T4 chính xác. Chỉ là snippet tay của T5, không
  ảnh hưởng phân tích (cùng lớp lỗi với F-135-T5-4).
- **F-136-T5-3 — pgrep tự khớp vẫn xuất hiện nhưng đã đọc đúng:**
  lệnh kiểm lúc mở dùng `pgrep -a -f 'apt[-]get|dpkg|wrapper'` trả
  về cả shell exec của chính T5 (pid 2512, command line chứa chuỗi
  'dpkg'/'apt-get') — lần này T5 nhận ra ngay là self-match (bài học
  F-135-T5-1 đã áp dụng: chỉ đếm pid 793 replay shell + pid 814
  apt-get là thật). Không có đọc nhầm nào xảy ra; ghi để khẳng định
  bài học đã được áp dụng.
- **F-136-T5-4 (ghi chú, đính chính T4) — Đoán blockers=6 là watcher
  b89 sai thời gian:** T4 (LIMITS T4 §5 F-136-T4-1) viết blockers=6
  ở poll #6 (05:46:13Z) "nhiều khả năng là tiến trình watcher/
  postboot của T5 — b89". **Không đúng thời gian:** b89 chỉ khởi
  động 05:47:01Z (WATCHER_START), 48 s SAU poll #6. Danh tính thật
  của 6 blocker vẫn chưa xác định (không có ps snapshot). Ứng viên
  chưa chứng minh: vite harness của T8 và/hoặc chính lần chạy
  postboot check-only của poller T4 (đường dẫn script chứa `webkit`,
  khớp mẫu grep `[w]ebkit` của poller — poller không loại trừ tiến
  trình con của chính nó). Ghi để T10/T4 đợt sau không truy vết sai
  hướng.
- **F-136-T5-5 (ghi chú, đính chính nhỏ) — T4 §4 diễn giải sai nguồn
  btime của cờ T5:** T4 viết "(T5 ghi lúc watcher phát hiện boot
  mới)" cho btime 05:29:34Z trong cờ POSTBOOT_PASS. Thực tế T5 ghi
  btime theo `stat /proc/1` (quy ước từ đợt 134), không phải thời
  điểm watcher phát hiện boot. Chênh 16 s với /proc/stat (05:29:18Z)
  là chênh nguồn đo, không ảnh hưởng khung chết (cùng boot_id, 0
  reboot trong phiên). Không ảnh hưởng số liệu nào.
- **F-136-T5-6 (ghi chú, không phải lỗi T5) — T3.done chưa xuất
  hiện lúc T5 đóng (~06:03Z):** T3 đã viết script verify136 + chạy
  dryrun, nhưng verdict bước 2 chưa công bố (`round136-t3.done`
  chưa có). Pha 2 của T5 đối chiếu với LIMITS T4 (đã đọc) + rerun
  code T3 (§8.6) — số liệu không phụ thuộc .done của T3. T10 kiểm
  lại verdict T3 khi nó xuất hiện; nếu T3 công bố khác thì đó là
  khác biệt diễn giải, không phải khác biệt số.

## 15. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 2 lần:
  header + dòng `say` cho boot 1ca1feaa; md5 cuối `31eec0b6…`;
  không đổi logic).
- `docs/PHASE9_ROUND136_T5_INFRA_LIMITS.md` (file này — mới; pha 1
  postboot boot mới + kiểm started_at + pha 2 lượt #13).
- Harness trong hidden_files (KHÔNG stage): `round136-t5/`
  (t5-start.txt, headroom-open/end.txt (2281/2276),
  ram-open/end.txt, postboot-check.md5.before/after, watcher.md5.before,
  t5-postboot-poll0.log, t5-postboot-b89-poll1.log,
  t5-postboot-b89-poll2.log,
  `POSTBOOT_PASS` (cờ gate-visible — boot 1ca1feaa, PASS 05:48:02Z
  poll 2), `t5-wait-replay-b89.sh` + `.log` + `.nohup.log`,
  `t5-c2-drawlog-analysis.py` (đã sửa field label→frame) +
  `t5-c2-drawlog-analysis.txt` (pha 2 lượt #13, khớp 100% T4),
  `t5-regression-135.txt` (hồi quy script đã sửa trên JSON đợt 135:
  label-floor {0: 207, 1: 617} — F-135-T5-3 ĐÓNG),
  `t5-tickcost-histogram.txt` (tickCost median 58,0 độc lập +
  skew/label-floor toàn-tick),
  `t5-histogram-rerun.txt` (rerun code T3, khớp 100% T5),
  `t5-c2-input.sha256` (266767c0…),
  `t5-partial-drawlog-check.py` (copy từ đợt 135, không cần dùng đợt
  này — JSON đầy đủ)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round136-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round136-t5.done` (ghi rõ: postboot boot
  1ca1feaa PASS cờ 05:48:02Z poll 2, A2 không kích hoạt (đúng);
  started_at lượt 136 không bị viết lại (jitter 0 s); pha 2 lượt
  #13 ĐO ĐƯỢC, HỢP LỆ nhưng THƯA EVENT — median 58,0 ms (biên 2 ms),
  (c2)=1, P1/P3 YẾU, P4/P5 ngoài khoảng ở biên, P7 DUNG, cộng dồn
  P1 22/22, P3 21/22; logger nới kiểm chứng lần 2, GIỮ fix).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Pha 2 (c2) — chạy lại phân tích log draw khi có JSON attempt ĐẦY ĐỦ + labellag T4:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round136-t5/t5-c2-drawlog-analysis.py <json-t4-day-du> <labellag-t4.txt> <out.txt>
# Pha 2 (han che) — kiểm tra JSON partial (flip chua toi):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round136-t5/t5-partial-drawlog-check.py <json-partial> <out.txt>
# Histogram #13 bằng code T3 (khi có JSON đầy đủ; không sửa script T3):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round136-t3/t3-step2-verify136.py <json-t4-day-du> <out.txt>
# Bật (c2) log draw (harness, trong browser console):
window.__vcutC2DrawLog = true
# Đọc entries (sau 2 vòng loop quanh wrap):
window.__vcutC2DrawLogEntries
```
