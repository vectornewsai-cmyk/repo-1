# LIMITS — Phase 9 đợt 86, luồng N3: W6 seek chậm — frame giữ + audio graph

Ngày: 11/11/2026 (lượt cron 09:35 +07). Repo local `~/workspace/repo-1`,
HEAD `5f548ef8`. **CHỈ stage, KHÔNG push, KHÔNG release/tag, KHÔNG binary
vào batch, KHÔNG file `.github/workflows`.** Không kiểm lại TTS 39.
Không thêm i18n key.

## 0. Kết luận (đọc trước)

### (a) Bỏ drawImage element đang seeking là ĐÚNG — nhưng phải bỏ qua cả lần render, không vẽ frame giữ mỗi tick
- Probe thô A (element + rAF kiểu app, clip testsrc2 30 fps):
  - **WebKit GOP 30 playing: draw 902 ms → skip 120 ms (~7,5×);
    held (vẽ frame giữ mỗi tick) 902 ms — KHÔNG cải thiện.** GOP 250:
    draw 1181 → skip 783, held 888.
  - **Chromium GOP 250 playing: draw 1025 → held 213, skip 285
    (~4–5×).** GOP 30: mọi biến thể đều nhanh (20–63 ms).
  - **Vẽ giữ ĐÚNG 1 lần mỗi seek (heldonce, probe A2): WebKit GOP 30
    142 ms ≈ skip 120 ms; clearRect mỗi tick lúc seeking: 293 ms.**
    Chi phí nằm ở drawImage LẶP LẠI mỗi tick trong lúc seek, không
    phải ở 1 lần vẽ.
  - **Paused: held KHÔNG nhanh hơn draw** (WebKit GOP 250: 459 vs
    374 ms; Chromium: 459 vs 374 ms) → gate chỉ áp cho đường đang
    phát; nhánh pause/scrub giữ nguyên.
- Vì renderFrame xóa nền mỗi tick nên "không vẽ clip đang seeking"
  trong drawVideoClip sẽ thành đen; cách duy nhất giữ được frame cũ
  mà không tốn drawImage nào là **bỏ qua cả lần render của tick đó**
  (canvas giữ nguyên frame trước seek). Đó là thay đổi production
  duy nhất được giữ (xem §1). **Không chọn "seeking→hold trong
  decideVideoFrame"** — held mỗi tick vẫn chậm 902 ms trên WebKit
  GOP 30, đúng bằng draw.
- Độ đúng frame: sau `seeked`, frame đúng trình bày trong ~10–60 ms
  (probe A paused 6/6 khớp; playing: ready ≈ seeked + ~10 ms khi đo
  được). Probe A2 "pause ngay khi seeked" cho 0/18 khớp trên GOP 30 —
  đó là **artifact của cách đo** (pause đúng lúc `seeked` làm
  pipeline WebKitGTK không trình bày frame mới nữa), KHÔNG phải
  frame sai (xem §3.3).

### (b) Audio graph KHÔNG góp phần chậm seek — câu hỏi mở lớn nhất của M4 ĐÃ ĐÓNG
- Probe B (graph y hệt `audioEngine.ts`, `AudioContext.state =
  "running"`, cả clip có/không có audio, churn draw/nochurn):
  không có so sánh nào graph (g1/g2) chậm hơn không-graph (g0) vượt
  quá nhiễu; ở phép đo sạch nhất (nochurn) g1 ≈ g0 (WebKit: audio
  86 vs 202 ms, no-audio 81 vs 88 ms; Chromium: 132 vs 122,
  93 vs 85). **Không sửa production cho (b).**
- Ghi nhận phụ: unmuted không graph (g3) có vẻ chậm hơn trên Chromium
  (170 vs 89 ms, audio clip) — không phải cấu hình của app (app luôn
  dùng graph sau lần play đầu), chỉ ghi nhận, không hành động.

## 1. Thay đổi production (đã giữ)

**Bỏ qua renderFrame của tick đang phát khi có clip video xuôi đang
seeking** (probe "skip" → code). Vùng sửa trong `preview.tsx`
(anchor "Đợt 86 N3", luồng khác cũng chạm file này — gộp theo anchor):
- `apps/web/src/lib/seekSkipRender86N3.ts` (MỚI): helper thuần
  `shouldSkipRenderWhileSeeking(reversePlayback, actives)` — true khi
  có active VIDEO xuôi đang seeking; false khi phát ngược toàn cục /
  clip reverse (stepping) / chỉ audio / không seeking.
- `syncMedia` nay trả `boolean` (tính SAU mọi seek/play của tick, sau
  `engine.update`); nhánh pause bỏ qua giá trị trả về.
- Nhánh playing trong tick: khi cờ bật thì KHÔNG gọi `renderFrame`,
  KHÔNG gán `lastDrawn` (vòng lặp không ngủ khi đang phát — xem
  `previewLoopShouldSleep` — nên tick sau vẫn chạy và vẽ lại khi seek
  xong); `lastRequested` vẫn gán = t như cũ; syncMedia + audio +
  expose media state vẫn chạy đủ. Counter tích lũy
  `seekSkipRenderTicks86N3`, phơi qua
  `window.__vcutSeekSkipRenderTicks86N3` (+ dọn ở cleanup).
- Loại trừ phát ngược: phát ngược toàn cục + clip reverse dùng đường
  stepping đã hold qua `stepDrawAllowedWithCompletion`; gate mà áp vào
  đó sẽ đóng băng canvas vĩnh viễn vì element stepping seeking gần
  như mọi tick.
- Hành vi khi seek kẹt vĩnh viễn: canvas đóng băng ở frame trước seek
  (đúng bằng hành vi cũ — drawImage element seeking kẹt cũng chỉ hiện
  frame cũ); vòng lặp không ngủ khi đang phát nên không deadlock;
  đường phục hồi decoder kẹt (R6) vẫn chạy trong syncMedia.

### 1.1 Kiểm chứng thay đổi production
- Unit: `seekSkipRender86N3` **9/9 xanh** (mới);
  `holdFrame` **13/13 xanh** (chạy lại, không sửa).
  `previewLoop50F2.test.ts` KHÔNG chạy được bằng node strip-types
  trực tiếp (import extensionless — đã ghi sẵn trong header của chính
  file test đó, lỗi có từ trước, không phải do N3); ngữ nghĩa ngủ
  được khóa bởi tsc + build + harness (đang phát thì không ngủ).
- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build` (apps/web): **PASS** (5,89 s; cảnh báo chunk > 500 kB
  đã có từ trước). `dist/` gitignored, không stage.
- Harness trong app thật
  `apps/web/scripts/clicktest-86n3-seek-skip-render.mjs` (vite dev +
  1 clip GOP 250 30 s, scrub dồn dập khi đang phát — xem §4):
  **Chromium PASS, WebKit PASS** (gate bắn, canvas sáng ~117–119,
  playhead chạy tiếp sau scrub, 0 window error / unhandled rejection).

## 2. Số đo probe A — vẽ frame giữ (heldframe)

Clip testsrc2 30 fps, 640×360, H.264: GOP 250 (`w6_h264_30s_g250_640.mp4`,
keyframe 8,33 s) + GOP 30 (`w6_h264_30s_g30_640.mp4`). 3 vị trí
(0,1/0,5/0,9) × 3 rep, rAF kiểu app (play() mỗi tick + drawImage mỗi
rAF). `seekedMs` = event `seeked`; `frameReadyMs` = từ lúc gán
currentTime tới khi drawImage+hash lần đầu khớp frame tham chiếu
(seek sạch, chờ seeked + 1000 ms; hash 2 lần đều ổn định —
`refStable: true` toàn bộ).

### 2.1 Chromium (load 17,35→9,25 — tải rất cao do các luồng song song)

| case | medSeeked | medReady | timeouts seeked/frame | seekedMs | frameReadyMs |
|---|---|---|---|---|---|
| g250 draw playing | 1025 | 1094 | 0 / 2 | 1025,1923,320,503,1532,472,984,2412,1052 | 1094,1985,397,585,1592,491,–,2418,– |
| g250 held playing | 213 | 213 | 0 / 1 | 809,1015,428,175,303,203,117,213,71 | 812,1023,–,183,306,209,119,217,74 |
| g250 skip playing | 285 | 290 | 0 / 0 | 287,808,204,203,474,112,285,561,212 | 349,816,210,210,477,114,290,567,214 |
| g30 draw playing | 20 | 25 | 0 / 0 | 93,73,6,6,7,20,39,15,71 | 100,78,8,10,9,25,103,19,73 |
| g30 held playing | 29 | 62 | 0 / 0 | 74,76,85,6,14,12,29,15,70 | 85,78,120,8,27,62,36,20,71 |
| g30 skip playing | 63 | 80 | 0 / 0 | 63,76,83,17,87,25,6,13,71 | 68,87,100,20,93,91,8,16,80 |
| g250 draw paused | 374 | 385 | 0 / 0 | 366,801,382,111,722,291 | 376,803,394,114,724,298 |
| g250 held paused | 459 | 466 | 0 / 0 | 350,610,495,422,911,176 | 360,614,500,431,913,183 |

- GOP 250 playing: held/skip nhanh hơn draw ~4–5× (trung vị).
  GOP 30: mọi biến thể < 100 ms, chênh lệch không có ý nghĩa.
- Paused: held không nhanh hơn draw (459 vs 374) → không mở gate
  sang pause/scrub.
- frameReady ≈ seeked + ~10 ms khi đo được; 2–1 timeout frame ở
  g250 playing là do video vẫn phát sau `seeked` nên frame mục tiêu
  trôi qua sau ~33 ms trước khi poll kịp bắt (xem §3.2).

### 2.2 WebKit (load 7,32→1,77; dùng lib GStreamer trích từ cache — xem §5)

| case | medSeeked | medReady | timeouts seeked/frame | seekedMs |
|---|---|---|---|---|
| g250 draw playing | 1181 | 693* | 0 / 2 | 525,1405,386,489,1181,685,1929,1198,1373 |
| g250 held playing | 888 | 909* | 0 / 1 | 875,922,888,1004,1327,809,611,1105,412 |
| g250 skip playing | 783 | 785* | 0 / 8 | 614,1315,910,691,783,418,897,1002,683 |
| g30 draw playing | 902 | 144* | 0 / 7 | 902,2915,181,97,171,1808,1702,592,2330 |
| g30 held playing | 902 | –* | 0 / 9 | 911,902,987,319,1393,1525,536,315,643 |
| g30 skip playing | 120 | 124* | 0 / 2 | 120,97,115,135,120,141,122,139,120 |
| g250 draw paused | 211 | 243 | 0 / 0 | 202,559,191,219,505,124 |
| g250 held paused | 281 | 284 | 0 / 0 | 279,412,164,283,485,215 |

\* `frameReadyMs` ở chế độ playing trên WebKit KHÔNG đáng tin (poll
trong lúc video vẫn phát + frame trình bày sau `seeked` một khoảng
biến thiên — xem §3.2/§3.3). Chỉ dùng paused (6/6 khớp, ready ≈
seeked + ~2–60 ms) làm bằng chứng frame đúng.
- **GOP 30 playing là điểm khác biệt lớn nhất vs Chromium: skip 120 ms
  so với draw/held 902 ms (~7,5×), phân phối chặt [97,141] so với
  [97,2915].** GOP 250: skip 783 vs draw 1181 (1,5×), held 888.
- Paused: held không nhanh hơn draw (281 vs 211) — cùng kết luận
  Chromium.

## 3. Số đo probe A2 — tách cơ chế + độ đúng frame (chỉ WebKit)

### 3.1 Phần 1 — cái gì đắt? (playing, 3 vị trí × 2 rep)
| case | medSeeked | seekedMs |
|---|---|---|
| g250 clear (clearRect mỗi tick lúc seeking) | 322 | 272,609,371,267,484,255 |
| g250 heldonce (vẽ giữ ĐÚNG 1 lần/seek) | 506 | 479,614,533,468,631,181 |
| g30 clear | 293 | 589,295,36,802,290,261 |
| g30 heldonce | 142 | 181,258,127,125,142,141 |

So với probe A (cùng engine): draw/held 902, skip 120 (g30).
- heldonce ≈ skip (142 vs 120) → **1 lần vẽ giữ không làm chậm
  seek; chi phí nằm ở drawImage LẶP LẠI mỗi tick trong lúc seek.**
- clear (293) chậm hơn skip/heldonce nhưng nhanh hơn nhiều so với
  draw/held (902) → clearRect mỗi tick cũng tốn kém nhưng ít hơn
  drawImage; giả thuyết cơ chế: drawImage (kể cả canvas→canvas)
  trên WebKitGTK/Xvfb phần mềm ép compositor/readback mỗi tick, cộng
  hưởng với pipeline GStreamer đang seek (chưa chứng minh ở mức
  syscall — chỉ là giả thuyết phù hợp với số đo).
- Lưu ý: clear g250 (322) nhanh hơn skip g250 của probe A (783) là
  so sánh KHÁC lượt chạy (tải khác nhau) — không kết luận clear <
  skip; chỉ kết luận trong-cùng-lượt: heldonce ≈ skip < clear <
  held ≈ draw trên g30.

### 3.2 mid=pre KHÔNG dùng được (cả 2 probe, cả 2 engine)
`midEqualsPre` (hash canvas giữa lúc seek có bằng frame trước seek
không) cho kết quả thấp cả ở biến thể draw (WebKit paused 0/6,
Chromium g30 0–1/9): hash canvas đi qua 2 lần scale (video→320×180
→160×90) so với hash tham chiếu 1 lần scale (video→160×90) nên
lượng tử 4 bit lệch nhau trên scaler của WebKit/Chromium; cộng thêm
seek nhanh (< 100 ms) đã xong trước mẫu 100 ms. **Không dùng
mid=pre làm bằng chứng đúng/sai frame.** Bằng chứng đúng frame là
frameReady ở chế độ paused + ct hạ cánh (xem §3.4).

### 3.3 Phần 2 — pause ngay khi seeked: frameReady hầu hết null (ARTIFACT, không phải frame sai)
Thiết kế: playing, khi `seeked` bắn thì pause element ngay rồi poll
draw+hash so với frame tham chiếu (tối đa 2 s). Kết quả WebKit:
g250 draw 1/6 khớp (409 ms), held 2/6 (577, 1166 ms), skip 1/6
(803 ms); **g30 0/18 khớp** (cả 3 biến thể). Trong khi probe A chế
độ paused (seek khi đã paused) khớp 6/6 (ready ≈ seeked + ~10 ms).
- Giải thích: khi seek lúc đang phát, frame mới trình bày SAU
  `seeked` một khoảng biến thiên; pause đúng lúc `seeked` làm
  pipeline WebKitGTK không trình bày frame mới nữa (drawImage vẫn
  thấy frame cũ trong 2 s poll) — pause quá sớm đóng băng frame.
  Đây là hành vi của engine, không phải frame sai vị trí: probe A
  playing (không pause) bắt được frame mục tiêu 7–8/9 trường hợp
  ngay sau `seeked`.
- Hệ quả cho app: đường pause/scrub của app seek khi đã paused
  (giống probe A paused, frame về đúng) nên không chạm vào hành vi
  này; đường phát xuôi không pause ở `seeked` nên cũng không chạm.
  Ghi nợ: kiểm tra Seeker có chỗ nào pause đúng lúc `seeked` không
  (xem §6).

### 3.4 ct hạ cánh (probe A WebKit)
- Paused: ct sau seek khớp target 6/6 cả draw lẫn held (sai số
  < 0,6 s: 0 trường hợp lệch).
- Playing: ctAfter đo sau poll frameReady (tới 5 s) + 400 ms nên bị
  nhiễm (video phát tiếp; hết clip → play() restart từ 0 theo đúng
  spec — các ca 27 s → ct ~1,4–1,8 là restart sau khi phát tới cuối,
  không phải seek sai vị trí). Không dùng ctAfter playing làm bằng
  chứng hạ cánh; bằng chứng là `seeked` bắn + ct tiếp tục chạy từ
  target trong các mẫu (xem log harness §4).

## 4. Harness trong app thật (clicktest-86n3-seek-skip-render.mjs)

Vite dev + 1 clip GOP 250 30 s, scrub dồn dập 8 cú/400 ms khi đang
phát (để ép element seeking liên tục), đo `__vcutSeekSkipRenderTicks86N3`,
độ sáng canvas (toDataURL, clip import dạng File → blob URL cùng
origin nên không taint), playhead/ct, window error.
- **Chromium: PASS** — gate 1→22→25 tick; canvas sáng ~118–119
  (frame thật ~126 theo ffmpeg); playhead chạy tiếp sau scrub;
  0 lỗi.
- **WebKit: PASS** — gate 7→41 tick; canvas sáng 117; playhead
  chạy tiếp; 0 lỗi. (Lần chạy đầu gate 90→126 nhưng FAIL do
  harness: clip phát tới cuối → playing=false rồi check playingOn
  FAIL oan; lần 2 gate kẹt 0 vì seek đơn dưới tải thấp xong trước
  cả 1 tick rAF — đã sửa harness thành scrub dồn dập + tự togglePlay
  lại sau khi clip hết.)
- Chẩn đoán phụ (diag `webkit_app_diag`, ngoài repo): trên WebKit,
  element có lúc `readyState` tụt 0 + `videoWidth` 0 trong lúc phát
  (đói decoder, có từ trước) và seek kẹt 2+ s ở ct 4,1 (GOP 250 dưới
  tải) — trong lúc seek kẹt, gate bắn đúng (skipTicks 87→128),
  canvas giữ frame cũ; sau khi seek xong, frame vẽ lại (draw 6,
  canvas sáng 117). Canvas tối (mean 12) trước frame đầu là do chưa
  từng có frame tốt để vẽ (hold/skip đều không có gì để giữ) —
  hành vi có từ trước, không phải do thay đổi này. Sáng 12 ở
  playhead=30 là đúng (hết clip, không còn clip active → nền trống),
  không phải frame đen.

## 5. Số đo probe B — audio graph (webkit_seek_audiograph_86n3)

Graph dựng y hệt `audioEngine.ts`: MediaElementSource → lowshelf
100 Hz → highshelf 3000 Hz → comp (thr 0/ratio 1) → GainNode →
master → Analyser (fftSize 2048) → destination; element volume=1,
muted=false (g1/g2; g2 gain 0 = track mute). `AudioContext` tạo sau
1 cú click chuột thật (user gesture) — `ctx.state = "running"` ở
mọi case g1/g2 (graph xử lý thật). Clip 10 s GOP 30 640 px, có audio
(AAC 440 Hz) vs không audio; 3 vị trí (0,2/0,5/0,8) × 2 rep.
Biến thể: g0 không graph + muted | g1 graph gain 1 | g2 graph
gain 0 | g3 không graph + unmuted. Churn: draw (rAF play()+drawImage
như app) vs nochurn.

### 5.1 Chromium (load 4,75→3,07)
| case | g0 | g1 | g2 | g3 |
|---|---|---|---|---|
| audio, draw | 89 [28,81,104,106,89,88] | 85 [283,81,190,88,73,35] | 99 [98,272,100,98,89,108] | 170 [145,277,198,109,170,169] |
| audio, nochurn | 122 [120,87,205,181,123,96] | 132 [40,136,128,190,196,38] | — | — |
| no-audio, draw | 107 [117,182,96,86,126,93] | 97 [144,108,83,85,77,254] | 103 [88,132,110,96,102,103] | 138 [180,166,109,21,227,84] |
| no-audio, nochurn | 85 [82,87,106,21,80,113] | 93 [23,13,92,94,105,94] | — | — |

### 5.2 WebKit (load 0,87→8,52 — tăng mạnh giữa lượt, nhiễu lớn)
| case | g0 | g1 | g2 | g3 |
|---|---|---|---|---|
| audio, draw | 532 [218,1523,521,813,506,543] | 756 [1774,587,829,12,807,704] | 950 [1279,328,1092,1284,808,599] | 649 [899,22,791,507,2609,497] |
| audio, nochurn | 202 [414,8,213,187,190,323] | 86 [83,84,88,185,102,22] | — | — |
| no-audio, draw | 1712 [1987,686,2297,599,1710,1714] | 1298 [898,3094,2391,646,627,1697] | 986 [2192,476,488,767,1204,2395] | 1279 [1380,624,687,1177,3799,2480] |
| no-audio, nochurn | 88 [83,183,92,76,95,33] | 81 [75,87,69,92,107,16] | — | — |

- Kết luận: **graph không làm chậm seek.** Ở phép đo sạch nhất
  (nochurn) g1 ≈ g0 trên cả 2 engine, cả 2 loại clip (WebKit:
  86 vs 202 và 81 vs 88; Chromium: 132 vs 122 và 93 vs 85).
  Với churn draw, phương sai lớn nuốt mọi hiệu ứng (WebKit draw
  [12..3799] ms). Không có bằng chứng nào cho việc "graph nối vào
  clip video không audio làm chậm seek" — dù `collectActives` đẩy
  mọi video clip vào `audioSources` (đã xác nhận bằng code).
- Caveat: so sánh LIÊN-clip (audio vs no-audio, draw churn) bị
  nhiễm load tăng dần trong lượt (no-audio chạy sau, load cao hơn)
  — chỉ so sánh g0-vs-g1 TRONG cùng clip mới có ý nghĩa.
- Phụ: g3 (unmuted, không graph) chậm hơn g0 trên Chromium ở cả 2
  clip (170 vs 89; 138 vs 107) — có thể là chi phí đường audio ra
  loa/dummy sink; app không dùng cấu hình này nên không hành động.

## 6. Môi trường / sự cố trong lượt (ghi trung thực)

- VM reboot 2 lần trong lượt (~02:0x UTC và ~03:25 UTC): /tmp tmpfs
  mất 2 lần (clip encode lại 2 lần bằng cùng công thức ffmpeg);
  dep apt WebKit mất sau mỗi reboot (lần thứ 3–4 hiện tượng này).
- `install-deps webkit` thất bại 5 lần do apt lock: replay os-intent
  của platform giữ lock (`apt-get update` chạy 10–16 phút, thư mục
  lists partial 221 MB do mirror trùng azure + cogentco) + luồng
  song song khác cũng retry install-deps. Workaround (chỉ phục vụ
  đo, KHÔNG chạm repo): trích .deb GStreamer/GTK từ
  `/var/cache/apt/archives` ra `/tmp/n3/webkit-libs`, copy 108 file
  `.so` (không ghi đè file có sẵn) vào `minibrowser-gtk/sys/lib/`
  của Playwright cache; probe/harness truyền `GST_PLUGIN_PATH` +
  `GST_PLUGIN_SCANNER` + `GST_REGISTRY`. WebKit đã verify phát video
  thật (ct chạy, rs 4, decode H.264 qua libav). Replay sau đó vẫn
  cài dần các gói này vào hệ thống; lần sau chỉ cần thử lại
  install-deps khi lock rảnh thay vì workaround này.
- Probe A WebKit lần chạy đầu mất do runtime restart giữa chừng
  (không có JSON/log) — đã chạy lại sau khi encode lại clip.
- Tải VM biến động mạnh trong lượt (load 0,87–17,35) do 8–10 luồng
  đợt 86 chạy song song; mọi số timing tuyệt đối mang caveat đó —
  so sánh tương đối trong-cùng-lượt mới là bằng chứng.
- File tạm `apps/web/vite.n3.config.mjs` của harness còn sót sau lần
  chạy cuối — đã xoá tay, không stage.

## 7. Nợ còn lại / giới hạn

1. **Probe A2 chưa chạy trên Chromium** (chỉ WebKit) — heldonce/clear
   trên Chromium chưa đo; không ảnh hưởng quyết định production
   (skip-vs-draw đã đo cả 2 engine).
2. **frameReady sau `seeked` trên WebKit khi đang phát chưa đo sạch:**
   poll hash bị trôi frame sau ~33 ms; cần rVFC-tương đương khác
   (rVFC không bắn trên WebKitGTK — M4 đã chứng minh) hoặc đo bằng
   cách pause SAU khi frame đã trình bày (không phải ngay lúc
   `seeked`).
3. **"Pause đúng lúc `seeked` làm đóng băng frame" (§3.3):** kiểm tra
   Seeker/đường pause có chỗ nào pause đúng lúc `seeked` không —
   nếu có, đó là bug tiềm ẩn (frame không bao giờ về).
4. **WebKitGTK đói decoder (rs tụt 0, vw 0 trong lúc phát)** làm canvas
   tối trước frame đầu — hành vi có từ trước (hold chỉ cứu được sau
   khi đã có frame tốt), chưa tách nguyên nhân.
5. **W7 nửa WebKit còn MỞ** (1 quan sát chưa tái hiện, đợt 85 M4) —
   luồng này không chạm tới; trace M4 vẫn có sẵn.
6. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
   CapCut thật.
