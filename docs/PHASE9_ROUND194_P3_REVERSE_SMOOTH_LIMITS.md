# PHASE9 ROUND194 P3 — REVERSE SMOOTH: audio đảo chạy xuyên hold + crossfade chứng minh headed + waveform

Đợt 194, luồng sản phẩm (Editing Core — preview/render parity, đợt thứ 4
theo hướng mới lệnh user 15:03 25/11/2026). Nối tiếp LIMITS P3-193
(F-193-P3-1/2 + quyết parent (a2)/(a3)-193). Kết quả ngắn: **(1) (a2)
audio đảo chạy xuyên hold IMPLEMENT XONG — RMS trung bình 0,666 ≈ xuôi
0,67 (193: 0,29–0,60, thấp hơn xuôi rõ rệt), drift trung vị 0,063 s /
tối đa 0,285 s (bar ≤0,5 s ĐẠT), badge hết nhấp nháy theo hold;
(2) (a3) crossfade + restart-exact CHỨNG MINH HEADED LẦN ĐẦU —
restart 17 + restartExact 7 trong 1 pass (193: 0/0), 0 mẫu lặng
in-pass, waveform ghi lại đầy đủ; (3) reverse mượt ĐO LẠI ĐƯỢC KHI
MÁY RẢNH — A/B dense 4 lượt đều giữ load < 3: fps ngược OFF 0,70 /
ON 0,60 (trung vị), prefetch KHÔNG cải thiện (xem §3); reverse vẫn
xa mức mượt (0,55–0,70 fps), nút thắt là decode, không phải prefetch.**

Phạm vi: chỉ sửa reverse preview (audio đảo xuyên hold). Không đụng
prefetch, decode, toggle/cổng, không sửa GAP/aggregate, không push.
Bundle đo: `dist/assets/index-B6KQoZ-Z.js` (1.713.920 B, build 02:5xZ
26/11/2026, vite 42,94 s — chậm do vite-lock + tải cao; xem
F-194-P3-1). Bundle không đổi trong lúc probe (before == after).

## §1. (a2) Audio đảo chạy xuyên hold — IMPLEMENT XONG, chứng minh headed

### 1.1. Quyết parent (a2)-193

Giữ gating hold-stop (S7c) thì tiếng bị gating ~25 Hz (F-193-P3-2:
holdStop 309/609 tick, RMS 0,29–0,60 vs xuôi 0,67). Parent quyết:
CHO AUDIO CHẠY XUYÊN HOLD trong preview ngược, drift tối đa ~0,5 s
(chấp nhận — preview ngược cần nghe liền mạch hơn đồng bộ từng khung;
render vẫn dùng mapping chính xác, không ảnh hưởng).

### 1.2. Code

- `apps/web/src/lib/reverseAudioWiring.ts`:
  - Hằng mới `REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC = 0,5`.
  - `tickInner`: playhead đứng yên → KHÔNG `stopSegments()` nữa.
    Đoạn đang phát được giữ; drift = thời gian giữ, chặn ở 0,5 s thì
    dừng (`holdCapStop`). Hết giữ, playhead bước tiếp → `tickEntry`
    re-sync bằng restart (lệch = thời gian giữ > dung sai 0,12 s)
    hoặc restart-exact (giữ ngắn + sắp hết đoạn). Đoạn 0,5 s tự hết
    sau tối đa 0,5 s giữ nên trần 0,5 s giữ được theo cấu trúc, không
    chỉ theo code chặn.
  - Counters mới `holdKeep` (tick hold mà đoạn được giữ phát) và
    `holdCapStop` (tick hold mà trần 0,5 s buộc dừng); `holdStop` giữ
    nguyên ngữ nghĩa (số tick playhead bị giữ — so sánh được với 193).
  - `holdStartCtxSec` (reset khi playhead bước tiếp + trong
    `stopAll()`); header comment cập nhật theo quyết mới.
- Không đổi `reverseAudio.ts` (player/crossfade giữ nguyên) và không
  đổi đường render (mapping chính xác giữ nguyên — quyết (a2) chỉ
  đổi preview).

### 1.3. Unit test — PASS

`reverseAudio194P3.test.ts` **MỚI, 7/7 PASS**: hold-through (đoạn
không bị dừng, `holdKeep` đếm đúng), hold-cap (giữ quá 0,5 s thì
dừng, `holdCapStop` = 1), resume sau hold ngắn re-sync bằng restart
(lệch 0,2 s → offset mới 0,6 s), hold-through không phá
restart-exact (giữ 0,1 s rồi nối tiếp đúng mẫu 1000),
hold khi chưa có đoạn active (không crash, không đếm keep/cap),
`stopAll` reset mốc giữ (giữ sau stopAll tính lại từ đầu).
- Test cũ `reverseAudio192P3.test.ts` cập nhật 1 case theo hành vi
  mới ("playhead đứng yên thì đoạn CHẠY XUYÊN HOLD, giữ buffer") —
  hành vi cũ S7c đã bị quyết (a2) thay thế có chủ đích, không phải
  hồi quy. **12/12 PASS** trở lại.
- Hồi quy: reverseAudio 7, reverseAudio193P3 16/16, seek 21,
  seek193P3 6/6, reversePlayback 10/10, reversePlayback191P3 7,
  reversePlayback192P3 13, reversePlayback193P3 5/5, reverseCadence 9
  — đều PASS. `npx tsc --noEmit` **0 lỗi**; `npm run build` **PASS**.

### 1.4. Kiểm chứng headed — chirp 10 s (xem §2, cùng 1 pass)

- RMS in-pass (85 mẫu × 100 ms, playhead 9,8→0,1): **0,2914–0,7130,
  trung bình 0,6658** — gần như bằng xuôi (đối chứng cùng pass
  0,6662–0,6725). 193: 0,29–0,60, thấp hơn xuôi rõ. Gating đã hết ở
  độ phân giải RMS (trừ transient khởi động 0,2914 — xem §2.4).
- Drift hình-tiếng (chirp làm đồng hồ, xem §2.3): trung vị **0,063 s**,
  p90 0,100 s, tối đa **0,285 s** (trừ 1 transient khởi động) —
  **bar ≤0,5 s ĐẠT**, còn dư ~0,2 s.
- Badge: 85/85 mẫu in-pass hiện "◀ PHÁT NGƯỢC — audio đảo",
  `playing=True` suốt pass — **hết nhấp nháy theo hold** (193: badge
  nhấp nháy vì `isPlaying` tắt mỗi lần hold-stop). Nợ §5.3 của 193
  (badge đọc trạng thái có độ trễ) coi như ĐÓNG theo hướng khác:
  trạng thái phát nay ổn định vì đoạn không bị dừng nữa.

## §2. (a3) Crossfade + restart-exact đo lại cửa sổ rảnh + waveform

### 2.1. Cửa sổ rảnh

Probe chạy 03:01:28–03:01:56Z, ngay sau khi T4 attempt1 kết thúc
(~02:59Z) và trước khi poller mở lại attempt2 (gate chưa mở:
load5 3,24 ≥ 2 + cây md5 khác — xem §2.5). **Load trong pass
1,09–1,31 suốt** — đạt tiêu chí "máy rảnh" lần đầu kể từ khi có
tiêu chí này (193: không lượt nào giữ < 3). Poll-t4.log kiểm trước
và sau probe: không có "CUA YEN MO" mới trong lúc đo (chỉ 1 lần
mở duy nhất của attempt1 lúc 02:54:11Z) — **không chồng pha (b)**.

### 2.2. Counters headed — crossfade + restart-exact KÍCH HOẠT

Counters cuối pass (delta trong pass, từ mẫu đầu tick=3):
`tick 377, holdStop 153, holdKeep 145, holdCapStop 0, gainStop 0,
negExpected 0, playFalse 2, playOk 24, keep 197, restart 17,
restartExact 7, stopAll 5` (stopAll 5 là từ các lần bấm transport
trước pass, không phải trong pass).
- **`restartExact 7 > 0 và restart 17 > 0 — LẦN ĐẦU chứng minh headed**
  (193: 0/0 — mọi lần (re)start đều sau hold-stop, prevSrc null nên
  không crossfade). Nhờ (a2), đoạn sống trọn 0,5 s nên tới cuối đoạn
  thì nối tiếp đúng mẫu (restart-exact) hoặc re-sync (restart) —
  cả hai đường đều đi qua khối crossfade của player (đoạn cũ mờ
  dần 80 ms trong khi đoạn mới mờ vào).
- `holdKeep 145/153` (94,8% tick hold giữ được đoạn phát);
  8 tick hold còn lại là lúc chưa có đoạn active (khởi động);
  `holdCapStop 0` — không lần nào giữ chạm trần 0,5 s trong pass
  này (giữ dài nhất < 0,5 s; xem §5.4 — trần chưa được kiểm headed).
- `playOk 24 = restart 17 + restartExact 7` — mọi lần phát đoạn đều
  là (re)start có crossfade, không có lần nào phát từ segActive=false
  sau hold-stop như 193. `playFalse 2` là 2 tick đầu trước khi load
  xong (không phải lỗi phát).

### 2.3. Waveform + drift

Probe mới `benchmarks/reverse194/audio-probe-194.mjs` (stage kèm
dữ liệu): lấy mẫu 100 ms, mỗi mẫu ghi RMS + peakHz + waveform
64 điểm time-domain (byte 0–255) + min/max sóng + counters +
load1. Dữ liệu: `benchmarks/reverse194/audio-waveform-194-chirp-10s.json`
(130 mẫu, 69.904 B — text JSON, không binary).
- **0 mẫu lặng in-pass** (85/85 mẫu có tiếng; chuỗi lặng dài nhất
  0). 44 mẫu RMS=0 toàn bộ đều là SAU pass (playhead đã về 0, đã
  dừng — đúng) + 2 mẫu chờ load đầu pass.
- Waveform không phẳng lần nào (max−min < 4: 0/85).
- 23 lần nối đoạn quan sát được giữa 2 mẫu liên tiếp; RMS ngay sau
  điểm nối 0,61–0,71 (trừ 1 lần 0,37 ở cuối pass, playhead ~0,1) —
  **không có khoảng lặng nào tại điểm nối**; RMS tại nối ≈ trung
  bình toàn pass 0,666.
- Drift: chirp f(t) = 300+270t nên t_audio = (peakHz−300)/270;
  drift = t_audio − t_playhead (âm = audio đi trước hình theo chiều
  ngược). Trừ 1 transient khởi động (mẫu đầu playhead 9,8, peakHz
  969 còn vương pass xuôi — xem §2.4): trung vị |drift| 0,063 s,
  p90 0,100 s, tối đa 0,285 s, khoảng đã dấu [−0,285; +0,122] s.
  Độ phân giải bin 23,4 Hz ≈ 0,087 s — đủ dư để kết luận bar 0,5 s.
- peakHz GIẢM 2929→323 trong pass (đúng hướng đảo; mẫu đầu 969 là
  transient, không tính). Xuôi đối chứng: peakHz TĂNG 345→969,
  RMS 0,67 hằng.

### 2.4. Transient khởi động (ghi rõ, không giấu)

Mẫu in-pass đầu (playhead 9,8): RMS 0,2914, peakHz 969, waveform
16 điểm đầu toàn 128 (lặng) nhưng min/max 6/249 — cửa sổ analyser
43 ms chứa một phần lặng (đoạn đảo vừa bắt đầu, fade vào) + đuôi
pass xuôi. Mẫu ngay sau (cùng playhead 9,8): peakHz 2929, RMS
0,6717 — đã đúng. Đây là transient khởi động ~100–200 ms, không
phải khoảng lặng tại điểm nối. Từ mẫu thứ 3 trở đi RMS ≥ 0,61.

### 2.5. Ghi chú T4 (để T10/T4 đối chiếu)

Probe kiểm `poll-t4.log` trước/sau: attempt1 T4 mở cửa 02:54:11Z,
chạy tới ~02:59Z; probe 03:01:28–03:01:56Z nằm giữa attempt1 và
attempt2 (poller đang chờ gate: load5 3,24 + cây md5 khác
`591f9655` vs kỳ vọng `cf331628` — cây đổi do luồng khác sửa
`preview.tsx`, không phải P3; P3 không đụng `preview.tsx` đợt này).
**F-194-P3-1 (tự báo):** vite build của P3 (42,94 s, ~02:55–02:57Z)
chồng lên đầu pha (b) attempt1 T4 (mở 02:54:11Z) — lúc P3 bắt đầu
build (~02:54Z) chưa biết T4 đã mở cửa (dir `round194-t4` chưa tồn
tại lúc P3 kiểm ~02:47Z; poller mở cửa lúc 02:54:11Z trong khi
build đang chạy). Load đạt 13,94 lúc 02:57Z (nhiều luồng cùng
build, không chỉ P3). T4 tự phán attempt1 của mình; P3 ghi nhận
phần chồng lấn của mình để T10/T4 đối chiếu. Từ sau khi biết, P3
kiểm poll-t4.log trước MỌI lần đo nặng (probe audio + A/B §3).
**Bổ sung:** attempt2 T4 mở cửa 03:29:23Z (poll #45), SAU khi A/B
xong (03:27:32Z) — không chồng lấn; nhưng lần chạy lại `tsc
--noEmit` cuối để kiểm trạng thái cuối của P3 (03:31:53–03:32:20Z,
~30 s) lại rơi vào đầu pha (b) attempt2 — P3 ghi nhận thêm lần
chồng lấn nhẹ này (tsc đã PASS từ 02:53Z, lần chạy lại không bắt
buộc; rút kinh nghiệm: không chạy lại kiểm chứng nặng sau khi
cửa T4 đã mở).

## §3. Reverse mượt đo lại — ĐO ĐƯỢC KHI MÁY RẢNH, prefetch KHÔNG cải thiện

Theo §13-192/§13-193: chỉ đo lại lúc máy thật sự rảnh (load < 3
suốt pass) trước khi xét lại prefetch. A/B dense đợt này (fixture
`~/workspace/tmp-round191-p3/dense-gop-ramp191.mp4`, GOP 30,
1280×720, 30 fps, 10 s; harness `measure192.mjs`; script
`run-ab-dense-194.sh`, log `ab-dense-194.log`; chạy 03:23–03:27Z
26/11/2026, bundle `index-CSX2lHaT.js` — build 03:21:54Z của P2,
xem §3.2):

| lượt | fps ngược | presentedFps | stalls >250 ms | frame đầu | load (đầu→cuối pass) |
|---|---|---|---|---|---|
| OFF-1 | 0,70 | 1,45 | 26 | 1689 ms | 2,73→2,87 |
| ON-1 | 0,55 | 1,21 | 21 | 1594 ms | 2,50→1,49 |
| OFF-2 | 0,70 | 1,63 | 21 | 1812 ms | 2,09→1,45 |
| ON-2 | 0,65 | 1,46 | 19 | 1602 ms | 1,50→0,72 |

Tất cả `reverseOk=false`, `holdOk=true`; holdDelta 317–373,
drawDelta 21–26, blackRev=0; presented 47–55 / distinct 45–53;
interval median 185–268 ms, p90 ~1,7–2,2 s. **Cả 4 lượt đều giữ
load < 3 suốt pass đo (cao nhất 2,87)** — lần đầu tiên tiêu chí
này đạt được (193: không lượt nào giữ < 3). Điều kiện: chạy sau
khi P1 đã xong (cờ 03:21Z) + P2 vừa build xong, load lúc mở script
1,57, không còn job headed khác xen vào giữa các lượt.

**Kết luận prefetch: KHÔNG cải thiện.** Trung vị fps ngược OFF
0,70 vs ON 0,60; presentedFps OFF 1,54 vs ON 1,34; stalls >250 ms
OFF 26/21 vs ON 21/19 (ON ít stall hơn chút); frame đầu ON nhanh
hơn chút (1594/1602 ms vs 1689/1812 ms). Net: fps và presentedFps
— hai số chính — đều TỆ HƠN khi bật prefetch; hai số phụ tốt hơn
không đủ đảo chiều. Cùng chiều với 192 (dense OFF 1,51 / ON 1,40
fps) và 193 (không đạt tiêu chí load nên không kết luận). **Giữ
toggle decode-ahead TẮT (mặc định); KHÔNG xét lại prefetch cho
reverse mượt nữa trừ khi có thay đổi lớn ở tầng decode.** Nút thắt
là decode phần mềm serial (0,55–0,70 fps vẽ / 1,2–1,6 fps trình
diễn ở 720p GOP30 ngay cả khi máy rảnh) — thuộc mảng Hiệu suất
(decoder pool / proxy rẻ / giới hạn cửa sổ decode), không phải
prefetch.

### 3.1. Lượt bão tải đã loại (ghi rõ để không nhầm)

Trước A/B sạch, P3 chạy thử 1 lượt OFF lúc 03:12–03:13Z giữa lúc
các luồng khác đang ở pha headed nặng (P2 vite headed + `tsc`,
WebKit MiniBrowser, Chrome P1/T8): fps 0,31, presentedFps 0,52,
stalls 14, frame đầu 6186 ms, **load 4,36 lúc mở harness → 7,30
trước phát xuôi → 8,95 trước phát ngược → 12,73 cuối lượt** —
vỡ tiêu chí load nên LOẠI, không đưa vào bảng trên; scratch của
lượt này đã bị A/B sạch ghi đè (cùng `N2_SCRATCH=run-dense-off-1`).
Số này chỉ còn trong log lượt P3 này + LIMITS này.

### 3.2. Bundle A/B khác bundle probe — có kiểm chứng

A/B chạy trên bundle `index-CSX2lHaT.js` (build 03:21:54Z, sau
probe audio 03:01Z) do P2 build lại sau khi xong việc; probe audio
§2 chạy trên bundle `index-B6KQoZ-Z.js` của P3. Đường decode ngược
không đổi giữa 2 bundle: `reversePlayback.ts` (21:08 25/11),
`seek.ts` (21:07 25/11), `reverseAudio.ts` (21:24 25/11) đều không
đụng trong đợt 194; chỉ `reverseAudioWiring.ts` (02:49Z, P3 — audio,
không ảnh hưởng fps video) và `preview.tsx` (03:05Z, luồng khác)
đổi. P2 LIMITS xác nhận P2 không đụng đường decode ngược (chỉ
đường VideoFrame opt-in `reverseWebcodecs`, không đổi). Vì vậy số
fps A/B so sánh được với 192/193 và kết luận prefetch đứng vững.

### 3.3. F-194-P3-2 (ĐÍNH CHÍNH sau khi đo xong)

Tiêu chí "load < 3 suốt pass" **đạt được** đợt này (4/4 lượt, cao
nhất 2,87) khi chạy trong cửa sổ rảnh thật (P1 xong, không job
headed khác) — giả thuyết "không đạt được bằng harness này" trong
bản nháp §3 là SAI, đã sửa. Điều kiện cần: load lúc mở harness
≲ 2 + không luồng khác vào pha nặng giữa pass; tải tự thân của
harness + decode chỉ đẩy load lên ~2,5–2,9, không vượt 3. Bài học
đứng: đo A/B muộn trong đợt (sau khi các luồng nặng xong) thay vì
đo sớm giữa bão tải.

## §4. File đổi, kiểm chứng tổng

File đổi (xem paths file): `apps/web/src/lib/reverseAudioWiring.ts`
(a2: chạy xuyên hold + counters holdKeep/holdCapStop),
`apps/web/src/lib/reverseAudio194P3.test.ts` (MỚI, 7 test),
`apps/web/src/lib/reverseAudio192P3.test.ts` (sửa 1 case theo (a2)),
`apps/web/tsconfig.json` (exclude test mới),
`benchmarks/reverse194/audio-probe-194.mjs` (MỚI — probe headed
(a3), stage kèm dữ liệu),
`benchmarks/reverse194/audio-waveform-194-chirp-10s.json` (MỚI —
waveform 130 mẫu, 69.904 B text JSON — VƯỢT 37.768 B nên lúc push
cần ENABLE_PRIVSEP=0 theo quy định đứng),
LIMITS này.
Không đụng file luồng khác (đặc biệt không đụng `preview.tsx` —
cây md5 đổi §2.5 là do luồng khác). `dist` build mới không stage.

Kiểm chứng tổng: `npx tsc --noEmit` **0 lỗi**; `npm run build`
**PASS** (bundle `index-B6KQoZ-Z.js` 1.713.920 B); test node:test:
reverseAudio 7, reverseAudio192P3 12/12, reverseAudio193P3 16/16,
reverseAudio194P3 7/7, seek 21, seek193P3 6/6, reversePlayback
10/10, reversePlayback191P3 7, reversePlayback192P3 13,
reversePlayback193P3 5/5, reverseCadence 9 — đều PASS. Headed:
audio chirp 10 s — (a2) RMS mean 0,666 ≈ xuôi + drift max 0,285 s
(§1.4); (a3) restart 17 + restartExact 7, 0 mẫu lặng, waveform đầy
đủ (§2); reverse mượt A/B dense 4 lượt load < 3 — fps OFF 0,70 /
ON 0,60, prefetch không cải thiện (§3).

## §5. Giới hạn còn lại — nợ chuyển sang đợt 195

1. **Trần drift 0,5 s chưa được kiểm headed** (`holdCapStop 0`
   trong pass §2 — không lần nào giữ chạm trần): cần 1 pass có
   hold dài > 0,5 s (seek GOP chậm trên clip dài) để chứng minh
   đoạn dừng đúng trần; hiện chỉ chứng minh bằng unit test.
2. **Decode cửa sổ file ~600 s có thể > 5 s** (nợ 193 §5.4, chưa
   đo): cần fixture ~300–600 s đo thời gian decode + hành vi tại
   mép cửa sổ. Clip 70 s chưa đo lại đợt này (không có cửa sổ rảnh
   thứ hai); clip > 600 s vẫn mute (cổng thiết kế).
3. **F-194-P3-1**: build P3 chồng pha (b) attempt1 T4 — T4/T10 phán
   ảnh hưởng (nếu có) lên attempt1; P3 đã đổi quy trình: kiểm
   poll-t4.log trước mọi lần đo/build nặng từ nay (đã áp dụng cho
   probe §2 + A/B §3).
4. Nợ cũ còn nguyên: reverse mượt dưới tải (mảng Hiệu suất —
   0,55–0,70 fps vẽ ở 720p GOP30 ngay cả khi máy rảnh, §3);
   scrub ngược trên clip dense/GOP dài chưa đo.
5. Prefetch ĐÃ kết luận (§3): giữ toggle TẮT, không xét lại cho
   reverse mượt trừ khi tầng decode thay đổi lớn.

## §6. Ghi chú cho parent

- Khoản (a2) xong dứt khoát, có số headed: RMS mean 0,666 ≈ xuôi
  0,67 (hết gating), drift max 0,285 s < bar 0,5 s, badge hết
  nhấp nháy. Render không đổi.
- Khoản (a3) xong dứt khoát: crossfade + restart-exact lần đầu
  kích hoạt headed (17 + 7), 0 mẫu lặng in-pass, waveform đã stage.
  Đây là bằng chứng còn thiếu từ F-193-P3-1.
- Khoản reverse mượt ĐO ĐƯỢC khi máy rảnh (4/4 lượt load < 3):
  fps ngược OFF 0,70 / ON 0,60 — prefetch KHÔNG cải thiện, giữ
  toggle TẮT, không xét lại nữa. Reverse vẫn xa mức mượt
  (0,55–0,70 fps) — nút thắt là decode, thuộc mảng Hiệu suất.
  Bài học: đo A/B muộn trong đợt (sau khi các luồng nặng xong)
  thay vì đo sớm giữa bão tải (lượt bão 03:12Z đã loại).
- Tự báo 1 chồng lấn với T4 (F-194-P3-1) — T4/T10 phán ảnh hưởng.
