# PHASE9 ROUND 200 — T2 (EPERM + (m)/INSIDE + mù) — LIMITS

Luồng nền T2 đợt 200. Mở lượt cron 18:35 +07 27/11/2026 (run 209, sched
11:35:51Z). Cờ đóng ~12:00Z 27/11/2026. Nhiệm vụ (r)-199: (1) phân loại CUỐI
(m) #128 (THÔ 0) + (m) boot 06:38:56Z (THÔ 1, +40,934 s) + B-#128 (FULL173,
neo #127); (2) (m) #56 lần 42; (3) nguồn node tsc/test W2/W3 đợt 199 —
(p)(iii) CHƯA PHÁN; (4) mâu thuẫn -check/-recheck (q)-199. EPERM probe +
sweep thường kỳ + mù/sổ sách. KHÔNG push; KHÔNG sửa MEMORY.md, AGENTS.md,
aggregate 199, PHASE9_GAP_ANALYSIS.md.

## §1. (m) #128 — KHÔNG CÓ ĐIỂM (CUỐI)

DB tươi ~12:10Z 27/11. Boot 773743f2, btime 05:01:50Z. Trong
[05:01:50Z, 05:35:51Z): 5 event, TẤT CẢ lúc 05:35:40.877–41.114Z (recovery
batch: reconciled eid 11521 + dispatched ×2 + succeeded ×2); 0 event trong
cửa (m) [05:02:23Z, 05:02:39.8Z]. Event đầu sau btime = btime +2.030,877 s.
Event cuối trước btime: eid 11520 succeeded heartbeat 03:15:34.2043Z;
silence tới eid 11521 = 8.406,673 s (= S8, OUTAGE #7 — dài nhất từ trước tới
nay, hơn OUTAGE #1 8.406 s ~1 s; đã ghi ở (m)-199). ID liên tục 11520→11521.
**n: 57/58 → 57/59.** Script: `hidden_files/round200-t2/m-check200.py`
(chain `m-check199.py`, assert FULL172 p10/p90 khớp T2-199 1688.25/11055.60;
B-#125 FALSE / B-#126 TRUE / B-#127 TRUE tái xác minh).

## §2. (m) #129 — DƯƠNG (CUỐI)

Boot e6e070b8, btime 06:38:56Z. eid 11540 `requeued_after_restart`, run 207
(bdcc830e-1471-407e-ad03-ad5c0b6f5a44), 06:39:36.933561Z = btime +40,933561 s,
TRONG [06:39:29Z; 06:39:45.8Z], biên trên 8,866439 s; tiếp dispatched eid
11541 (06:39:37.120427Z) + reattached eid 11542 (06:39:37.238888Z). Event cuối
trước btime: eid 11539 succeeded 06:15:34.227401Z; silence 1.442,706 s; ID
liên tục. Caveat đồng hồ (F-199-T2-4): local ~2 s chậm vs Cloudflare →
offset thật ≈38,93–40,93 s, vẫn trong band. **n: 57/59 → 58/60.**

## §3. FULL173 + B-#128 — FALSE

FULL173: n=173, mean 1h51'17", median 1h57'37", p10 1693,50 s, p90 11104,60 s,
sd 1h02'01", min 55 s, max 5h58'13"; trong 90–150' = 95, <60' = 34, >180' = 20,
>240' = 9 (FULL172 + gap #127→#128 = 16.044 s). Band FULL173 neo #127
(btime 00:34:26Z) = [01:02:39Z, 03:39:30Z]; btime #128 05:01:50Z vượt biên
trên 4.940 s. **B-#128: FALSE. Chuỗi B: 2 → 0.** Đếm A KHÔNG TÍNH ĐƯỢC
(thiếu btime #106) — chuỗi GIỮ 7.

Run: 207 (bdcc830e, sched 05:35:51Z) TIMEOUT, finished 08:39:01Z, deadline
08:35:51Z → xong muộn 190 s, started_at viết lại 05:35:51Z → 06:39:37Z
(requeue eid 11540, reboot #129); 208 (9cd50793, sched 08:35:51Z) SUCCEEDED,
start 08:41:43Z, finish 09:16:08Z; 209 (8c1d8a33, sched 11:35:51Z, đợt 200 mở)
RUNNING, start 11:35:51Z, boot_gen cron_boot_0eac28bb… (CA thuộc T7-200).
Tốc độ reboot tới #129: 204 / 394,34 h = 1 / 116,0 phút. Gap #128→#129 =
5.826 s (1h37m06s). Marker 80 nếu #128 xác nhận (parent-199: ĐÃ XÁC MINH),
81 nếu #129 xác nhận (T01-200/T56-200).

## §4. (m) #56 — lần 42, VẪN CÓ ĐIỀU KIỆN

File-based (`m56-200.py`, exit 0): 333 file có mtime trong D [19:04:44Z,
20:22:43Z] 20/11, max mtime 20:15:33.130Z (`round156-t10.done`) — KHÔNG ĐỔI;
0 exec-log trong D; (vii-b)/(vii-c) trống. 5 hướng mới lần 42, ĐÃ grep xác
minh chưa dùng trong `m56-19*.py` TRƯỚC khi query (0 match mỗi cái, theo
F-194-T2-2): (clxxvi) `runtime.raw_signal_entries` created_at: 0; (clxxvii)
`health.aggregates` period_start: 0; (clxxviii) `ideas.idea_quality`
scored_at: 0; (clxxix) `goals.learning_state` updated_at_ts: 0; (clxxx)
`runtime.checkout_spend_operations` created_at_ms (ms, D =
[1795202684000, 1795207363000)): 0. Kiểm lại: (clxvi)
`agent.message_mailbox` accepted_at: 19 trong D (không đổi), 0 trong W
[19:33:20Z, 19:33:37Z], max 20:19:34.929056Z (không đổi). (clxx)
`agent.agent_message_token_usage` created_at: **11 trong D (ĐỔI từ 9 —
F-200-T2-2)**, 0 trong W [1795203200–1795203217], max mới 1795207287
(20:21:27Z, trước 1795205974). 2 dòng mới: 1795206469 (20:07:49Z, agent
e033d2dd — main root) + 1795207287 (20:21:27Z, agent 02cc32dc…) — dữ liệu về
muộn (late-arriving), vẫn thuộc chuỗi kết thúc run 156, 0 trong W nên KHÔNG
thu hẹp. **Tổng 180 hướng (175 + 5 mới) — lần 42 không thu hẹp.**

## §5. EPERM — probe #119 + sweep #119: 0 sóng thật

Probe #119: `scripts/probe-eperm-v2.sh once` lúc 11:45:12Z →
**probe#119 boot=c073c8bb ok=2 fail=0** (boot mới #130). Sweep #119 (cửa
[probe#118 05:49:24Z, probe#119 11:45:12Z], `eperm-sweep200.py`): 243 file
*.log; 4 file có hit, 21 lần xuất hiện — **0 "sóng EPERM vẫn bật" → 0 sóng
thật**. Các hit đều tự tham chiếu/trích dẫn: `proc_abf3ae860761.log` (agent
19aa900b, log chạy sweep-118 của T2-199, 05:54:03Z);
`round199-t01/o8-199t01.log` ("sóng đã tắt" 3);
`round199-t2/eperm-sweep199.log` (tự tham chiếu);
`round200-t01/o8-200t01.log` ("sóng đã tắt" 2, 11:43:29Z + 11:43:56Z).

## §6. Boot #130 — ghi nhận (thuộc T2-201 về (m))

Boot c073c8bb-26f3-41e8-a4b5-3d56ce3564f8, btime 1795778501 = **11:21:41Z
27/11** (T01-200 survey 11:39:01Z, 9 nguồn: /proc/stat btime, uptime -s
11:21:41, /proc/1 +13,07 s, journal first 11:21:54Z = +13 s, wtmp begins
11:21:54Z, CF local ~1 s chậm). Gap #129→#130 = 16.965 s (4h42m45s). Marker
`/home/hatch/.config/vcut-persistence-marker` md5 cb7102c0, 239 B — sống qua
#130. SYS mark mới cho blind: SYSC073 = 11:21:54Z. SYS cho #129-head KHÔNG
thêm — không có đo head trực tiếp (chỉ có replay-watch-199 init mtime
06:39:38Z), tiền lệ F-187-T2-3.

## §7. Mù (blind walk) — B1 11:47:20Z 27/11; CERT/FULL GIỮ 76/91

B0 = 2026-11-21T11:15:18Z (đứng). B1 = 2026-11-27T11:47:20Z (1795780040),
window 520.322 s. File: repo-1 8.600 / hidden_files 16.318 / outside 31.609 /
tmp 643 (tmp giảm mạnh: reboot #130 xóa /tmp). Merged: 12.257 unique
second-marks (199: 11.807); R 55 / T 633 / U 56.078 file-marks. UNION-A: R
1.222 s OPEN / S 662 s CLOSED / T 38 s CLOSED / U 9.316 s OPEN (20.618 marks).
UNION-B (+ SYS heads incl. SYSC073 11:21:54Z): R 1.211 s OPEN / S 591 s CLOSED
/ U 8.372 s OPEN (20.674 marks; top gaps 8.372 / 8.109 / 7.861 / 6.469 /
6.100 / 5.766 s). **Mọi max đoạn không đổi vs 199 → CERT/FULL GIỮ 76/91.**
Sessions: exec-logs có mtime trong U 300, R/S/T 0; U-tail tmp 643 (toàn bộ
/tmp mới sau reboot #130). replay-watch-199 297 dòng (199: 25 — tăng do
watcher ghi tiếp tới khi chết cùng reboot #129), replay-watch-200 13 dòng;
ram-sampler-199 136 dòng (199: 16), ram-sampler-200 16 dòng.

Witness #64–#129: **0 THẬT.** Raw: #64–#86: 1 (sessions, log
proc_ab58b9c7039d — T01-199 survey trích btimes); #87–#114: 2 (7746 +
ab58); #115: 3; #116–#118: 2; #119–#120: 3 (be9468 + 8f8a + ab58);
#121–#122: 4; #123: 7; #124–#125: 2; #126: 9; #127: 4; #128: 9; #129: 3.
Kiểm tay: #128 — 9 log gồm cặp 5886fe45 trích btime #126 "22:32:41" không
ngày, ab58 (survey), 2 log T56-191 đọc lại watcher log (05:51:24Z..07:03:37Z,
hoạt động thật chỉ lúc 07:03Z+), 2 log waiter T2-199 trích poll/waiter
(06:53Z/07:04Z), poller T4-199 (start 05:48:51Z, trích btime 05:01:50Z trong
banner), ad63b243858c trích cửa sổ witness 02:33:54–02:34:43Z +
08:41:00–08:41:43Z. #129 — 3 log đều trích (cặp 5886fe45 + ab58). #127 — 4
log đều trích (cặp 5886fe45 + ab58 + ad63). #115/#119/#120/#123 — các log
còn lại đều trích btimes/survey (7746, 8f8a, be9468 main-agent, c9091c83d696,
bdce3989e045). Lưu ý: raw #87–#114 (3→2), #115 (4→3), #119–#120 (6→3) THẤP
HƠN 199 — nguyên nhân giảm chưa xác định (7 log bị loại bởi QUOTE_MARKERS
mới round200-t2/m-check200 + thư mục agent T2-200; xem F-200-T2-4); không
ảnh hưởng kết luận vì mọi ứng viên còn lại đều kiểm tay là trích dẫn và
không có ứng viên MỚI nào xuất hiện.

Hole-recheck lần 43 (`hole-recheck200.py`, exit 0): 35 holes, **ALL NEW=0**.
H-E1-88 lần 42: inside=337 float-trap=337 NEW=0. H-U25 lần 2
(03:34:31–05:35:38Z 27/11): NEW=0 — vẫn chưa lấp. Không có H-U26 mới (vùng
05:35:38Z→11:21:54Z đã có mark dày: replay-watch-200, ram-sampler-200,
poller T4-200, survey T01-200).

Evidence check (F-189-T2-2, `evidence-check200.py`, exit 0): 41-list: 0
present / 41 missing, **0 NEW missing kể từ 199**; 349-list: 0 present / 349
missing, **0 NEW missing kể từ 199**; #100 survivor proc_34889a901a7e vẫn
missing — bộ chứng cứ #100 nay 0/6 (không đổi).

## §8. Nguồn node tsc/test W2/W3 đợt 199 — ĐÃ XÁC ĐỊNH

Cửa sổ: W1 attempt1 06:09:35–06:14:02Z; W2 attempt2 06:25:52–06:29:36Z (33
spike, load1 max 4,88); W3 attempt3 06:34:10–06:38:20Z (39 spike, load1 max
8,73). Poller thoát 06:38:53Z (exit 11); reboot #129 06:38:56Z.

**W2 tsc = P1-199** (loại trừ + khớp thời gian; không có cmdline bắt sống pid
93641 — snapshot chỉ có comm `npm exec tsc --`): b2-spikes-FROZEN.log chỉ có
`npm exec tsc` trong snapshot W2 (06:28:35–06:29:01Z, pid 93641 31,1%→3,0%,
con MainThread pid 93656 91–105%, rồi pid 93985 110% lúc 06:29:06Z). P2.done
06:01:49Z (trước W1); P3 tsc sau 07:01:53Z; P4 tsc 06:49Z (sau poller thoát,
P4 LIMITS dòng 181–182 phủ nhận rõ); T01/T56/T7/T8/T9 LIMITS không có tsc;
T8 harness chạy 07:16–07:32Z. P1 là luồng duy nhất còn lại có tsc chưa định
thời + đang chạy chuỗi verify cuối trong cửa sổ: copy harness 06:29:46Z,
verify-fixed 06:31:21Z, app-smoke 06:34:24Z, .done mtime 06:40:02Z; LIMITS P1
ghi `npx tsc --noEmit` 0 lỗi.

**W3 test = P3-199 (bắt sống trực tiếp):** ps-before attempt3 có bash pid
96176 sửa + chạy `node --experimental-strip-types
apps/web/src/lib/reverseAudio199P3.test.ts` (pid 96178); ps-after attempt3
vẫn chạy (pid 99704/99705, lần 2 với grep debug). P3 chạy test xuyên W3.

Đính chính F-199-T4-9: "bắt sống trong W3: tsc --noEmit" là gộp sai — bằng
chứng tsc chỉ có trong snapshot W2; trong W3 chỉ có test P3 + vite
preview:5199. Nguồn khác đã rõ từ T4-199: W1 = P1 Chrome headless (pid
65415, 3 renderer 30,2/30,1/13,5%) + tự-tải probe ~68% (đã phán (p)(i) VI
PHẠM); P3 audio-probe node trong W2 (ps-before attempt2 pid 84824/84829, job
kết thúc trong W2); P3 vite preview:5199 chạy suốt (blocker poll #49); T56
repair 0 chồng trong W1/W2/W3.

**Phán bổ sung cho (p)-200 (bổ sung (p)(iii)-199):** W2 tsc P1 = **VI PHẠM**
(chồng lấn trong cửa sổ (b) + tải nặng đo được — MainThread 91–110%
sustained, góp vào spike B2 W2; attempt2 đã KHÔNG HỢP LỆ B1+B2; cùng họ
(p)(i)/F-197-T2-1); W3 test P3 = **VI PHẠM NHẸ** (chồng lấn chứng minh bằng
ps, nhưng đóng góp tải không tách được — W3 không process nào >13,1%; cùng
họ (p)(ii)). Chuỗi 0 vi phạm GIỮ 0 (đã 0 từ (p)(i)/(ii) đợt 199; đây là phán
bổ sung cho vi phạm đợt 199).

## §9. Mâu thuẫn -check/-recheck — GIẢI QUYẾT: script thật là `-check`

Kết luận: **script thật của parent đợt 197 là `/tmp/count-197-check.py` +
`.sh`.** T2-199 ĐÚNG về tên script (`-recheck` là sai); AGENTS.md dòng 61
(mục "XÓA §14.2 + ĐẢO NGƯỢC") ĐÚNG về `-check` là thật — nhưng sai 2 chi
tiết: (a) giờ 23:43Z là giờ TẠO file, lần chạy dedup là 23:45:15Z; (b) khẳng
định "file đó đã tồn tại trước lượt parent" là SAI (ls 23:41Z của chính parent
không có file đó). Ghi chú dòng 136 aggregate 197 hiện tại (39.612 B, MỘT
§14.2 ở dòng 134, (q) ghi `-recheck`) là SAI theo bằng chứng dưới đây.
KHÔNG sửa AGENTS.md/MEMORY.md/aggregate 197 — chỉ ghi kết luận vào LIMITS
này, parent quyết đính chính.

Phương pháp: lịch sử tool-call của lượt parent 06:39 +07 27/11 (lượt đóng
đợt 197), theo đúng (q)-199. `runtime.tool_calls` = 0 dòng (bảng trống hoàn
toàn) — phương pháp "lịch sử tool-call" theo nghĩa đen không áp dụng được
cho bảng đó. Nhưng runtime có ghi: `runtime.events`/`runtime.messages` +
exec-log `~/workspace/agents/<agent-id>/exec-logs/proc_*.log`.

Parent worker đợt 197 là agent **abe6ca94-e03e-4739-b7e1-b84a75a6ae24**
(kind=root, created 1795736381 = 23:39:41Z 26/11, đúng lúc cron delivery tới;
22 event trong cửa sổ). Main root agent là e033d2dd-59b9-46f1-ac13-c851d51657ac
(session 609552bc-4a24-4e23-aac0-51e197b649ad, main chat).

Bằng chứng quyết định (4 exec-log của abe6ca94 trong lượt 23:39–00:05Z):

- `proc_aee208fd16ec.log` 23:41:53Z — `ls /tmp`: CHƯA có
  `count-197-check.py`/`count-197-recheck.py`/`c197dedup.py` (grep chỉ thấy
  `recount-197-t10.*`).
- `proc_dcc78ac573da.log` 23:45:15Z — output dedup kết thúc `PARENT_PY_DONE`
  + `PARENT_SH_DONE`; số: round197 12/43/41/29; cum111-197 861/1631/1375/1178;
  waitpush 83/282/204/183; total_uniq 4161 missing 0.
- `proc_ddf718f2f476.log` 23:49:39Z — liệt kê `.done` đợt 197.
- `proc_d6c53d928e4c.log` 23:51:48Z — `ls -la /tmp/`: `c197dedup.py` 23:34,
  `c197x.sh` 23:35 (đồ để lại lượt cron 03:35 bị timeout),
  **`count-197-check.py`/`.sh` 23:43Z**,
  **`count-197-recheck.py`/`.sh` 23:46Z**.

Logic thời gian: lần chạy dedup của parent lúc 23:45Z cho ra PARENT_*_DONE
— file `-recheck` chưa tồn tại tới 23:46Z nên lần chạy đó KHÔNG thể là
`-recheck`. File `-check` tạo 23:43Z trong lượt, trước lần chạy.

Báo cáo nội bộ của parent (runtime.messages
`assistant-msg-0f5028d8-2dee-4df9-8adb-45311573aaa8`, event message.internal
ev_seq 39669, 23:57:49Z, parent_agent abe6ca94): "Kiểm đếm độc lập bằng dedup
python + kiểm chéo shell viết mới trong lượt này (`/tmp/count-197-check.py`
+ `.sh`) KHỚP T10 TỪNG SỐ — lần thứ 143 liên tiếp... Aggregate sau viết =
46.294 B" + script `-recheck` do kẻ mạo danh viết 23:46Z cùng build-loop-log
dòng 8794 + nhật ký ngày dòng 69. Tin nhắn user-facing của parent (role
assistant, 00:02:14–15Z 27/11, parent_agent e033d2dd): "lời gán 'lượt cron
06:35' là giả — mình xóa bản chèn... Số liệu vẫn khớp lần thứ 143."

Hệ quả: (q)-199 "CHƯA GIẢI QUYẾT" nay GIẢI QUYẾT. Mâu thuẫn trong AGENTS.md
dòng 61 về "-check mới là thật" được xác nhận ĐÚNG về tên script; chi tiết
giờ + "file đã tồn tại trước lượt" trong cùng mục đó là SAI — giữ cả hai
bản ghi làm bằng chứng, không viết lại bên nào (luật cứng).

## §10. T4-200 tại lúc đóng cờ T2 + footprint T2-200

T4-200 CHƯA đóng khi T2 đóng cờ (~12:05Z): poll #19 11:53:38Z, gate0
chưa đạt (t5flag=cu, t5src=199-t56/POSTBOOT_PASS, postboot_exit=1), blockers
0, **chưa có attempt nào**, chưa có LIMITS/.done; poller deadline 13:30Z.
Đối chiếu chồng lấn W2/W3 đợt 200 + lượt yên #68 CHƯA LÀM ĐƯỢC — nợ T2-201
(xem §12). Footprint T2-200 trong snapshot ps của T4-200 (POLL, không phải
attempt — chưa có cửa sổ attempt nào để vi phạm): poll #6 (11:43:46Z)
m-check200.py; poll #7 (11:44:32Z) m56-200.py; poll #11 (11:47:33Z)
blind200-gen.py. Các job nặng của T2-200 đã xong trước khi đóng cờ; sau cờ
chỉ còn viết LIMITS/paths/.done (nhẹ).

## §11. Sổ vi phạm

- (p)(i)-199: P1 Chrome headless W1 = VI PHẠM (đã phán).
- (p)(ii)-199: P3 ghi file W1 = VI PHẠM NHẸ (đã phán).
- (p)(iii)-199 bổ sung ở §8: W2 tsc P1 = VI PHẠM; W3 test P3 = VI PHẠM NHẸ.
- (p)-200: chưa có attempt T4 nào tới lúc đóng cờ → chưa phán; chuỗi 0 vi
  phạm GIỮ 0.

## §12. Bài học + nợ T2-201

- F-200-T2-1: tên định nghĩa trong `exec()` lồng nhau KHÔNG lan ra namespace
  ngoài (assert `N.get("inba8_125")` đã fail trong m-check200.py; đã sửa: chỉ
  assert `inb127`, còn B-#125/#126 do script 199 tự assert bên trong).
- F-200-T2-2: (clxx) `agent.agent_message_token_usage` 9 → 11 giữa đợt 199
  và 200 — dữ liệu về muộn (late-arriving token-usage rows); đếm theo từng
  file, KHÔNG cat gộp nhiều file NUL-delimited (bẫy đếm đợt 199).
- F-200-T2-3: khi viết `eperm-sweep200.py`, sed thay nhầm cả hai mốc thành
  11:45:12Z (assert W0<W1 fail) — đã sửa tay bằng muse.edit (W0=05:49:24Z,
  W1=11:45:12Z). Kiểm assert ngay sau khi viết script, đừng đợi tới lúc chạy.
- F-200-T2-4: witness raw #87–#114/#115/#119–#120 giảm vs 199 mà chưa rõ
  nguyên nhân (7 log bị loại bởi QUOTE_MARKERS mới + thư mục agent T2-200) —
  không ảnh hưởng kết luận 0 thật; T2-201 đối chiếu lại danh sách log từng
  boot với witness199.py output nếu cần.
- F-200-T2-5: adapt `evidence-check199.py` → 200 bằng replace hàng loạt đã
  đổi nhầm cả đường dẫn INPUT (round199-t2/evidence-check199-*) thành 200
  (3 lần sửa mới đúng) — khi adapt script có input/output cùng thư mục, sửa
  từng dòng theo ngữ cảnh (input giữ nguyên, output đổi), không replace toàn
  cục.
- Nợ T2-201: (m) #130 (boot c073c8bb, btime 11:21:41Z); B-#129 (cần FULL174,
  neo #128); (m) #56 lần 43 (181 hướng); hole-recheck lần 44 (H-E1-88 lần
  43; H-U25 lần 3); đối chiếu T4-200 W2/W3 đợt 200 + lượt yên #68; (m) lượt
  yên #68 (T4-200 chưa đóng — chuỗi lượt yên #67 0 lượt hợp lệ, chuỗi 2→0
  từ (m)-199).

## §13. Tóm tắt đóng cờ

- (m) #128 KHÔNG CÓ ĐIỂM (CUỐI); (m) #129 DƯƠNG (CUỐI, +40,934 s);
  n 58/60. B-#128 FALSE, chuỗi B 2 → 0; đếm A GIỮ 7.
- (m) #56 lần 42 (180 hướng): VẪN CÓ ĐIỀU KIỆN; (clxx) 9→11 (late-arriving).
- EPERM probe #119 ok=2 fail=0; sweep #119: 0 sóng thật.
- Mù: B1 11:47:20Z; CERT/FULL GIỮ 76/91; hole-recheck 43 NEW=0; witness
  #64–#129 0 thật; evidence 0 NEW missing.
- Nguồn node W2/W3 đợt 199: W2 tsc = P1-199 (VI PHẠM), W3 test = P3-199
  (VI PHẠM NHẸ).
- -check/-recheck GIẢI QUYẾT: script thật là `/tmp/count-197-check.py` +
  `.sh` (T2-199 đúng; AGENTS.md dòng 61 đúng tên, sai chi tiết giờ).
- T4-200 chưa đóng khi T2 đóng cờ — đối chiếu đợt 200 nợ T2-201.
