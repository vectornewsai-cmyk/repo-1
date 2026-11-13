# Phase 9 đợt 93 — U7: Harness O8/Q5 — nhãn kỳ vọng S7 + timing flake Q5 + đo seek GOP 30/60/250

**Nợ gốc:** LIMITS gộp đợt 92 §4 mục 12 (3 việc: (a) nhãn kỳ vọng S7 lẫn hệ
tọa độ — Q5 §6 mục 4; (b) test timing Q5 có thể flake dưới tải cực nặng —
Q5 §6 mục 5; (c) số đo seek chỉ cho clip GOP 250 — nay T3 đã mở rộng sang
GOP 30/60 cho stall sau seekDone, cần kiểm chứng lại bằng đo độc lập).
**Ngày:** 2026-11-12 (lượt cron 06:35 +07; làm việc 23:39–00:12Z 11/11).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** ĐÃ XONG cả 3 việc — (a) nhãn S7 đã sửa + chứng minh bằng O8
21/21 cả 2 engine; (b) KHÔNG flake trong 60 lần/scenario dưới tải nặng,
KHÔNG sửa test (có căn cứ số đo, xem §2); (c) pause-seek GOP 30/60/250 đã
đo đủ 6 tổ hợp — GOP ảnh hưởng mạnh tới latency seek, nhưng KHÔNG phủ nhận
T3 (xem §3 — hai đại lượng khác nhau).

## 1. (a) Nhãn kỳ vọng S7 lẫn hệ tọa độ — ĐÃ SỬA (mỹ phẩm, không đổi logic đo)

**Nguyên nhân gốc (đúng như Q5 §6 mục 4 chẩn đoán):** bóng/track đi project
0.40 → 0.60 (Δx project = 0.20), nhưng Δx đo được là **tọa độ canvas** =
0.20 × (dw/W của videoRect). Chromium letterbox mạnh (videoRect ~489×275
trong canvas ~871×275, dw/W ≈ 0,56) nên Δx canvas ≈ **0,112**; WebKit gần
như không letterbox (dw/W ≈ 0,97) nên Δx canvas ≈ **0,194**. Nhãn cũ
"(kỳ vọng ~0.19)" là số project-coords (0.20 làm tròn), **sai trên
Chromium** (đo thật 0,112–0,113 trong khi nhãn nói 0,19) và chỉ tình cờ
đúng trên WebKit. Gate Δx ≥ 0,10 không sai (0,10 < cả hai giá trị đúng),
chỉ nhãn gây nhầm — đúng như Q5 ghi "mỹ phẩm, không sai verdict".

**Sửa** (`clicktest-87o8-mask-track-headed.mjs` + `...-webkit.mjs`, khối S7):
tính `deltaExpS7` từ videoRect thật qua `canvasExpected` (mẫu S5 cùng file:
`canvasExpected(m1, projW, projH, 0.60, 0.5).cx - canvasExpected(m1, projW,
projH, 0.40, 0.5).cx`), dùng trong comment + thông điệp PASS/FAIL thay cho
hardcode "~0.19". Không đổi gate (0,10), không đổi logic đo hay xác nhận.

**Chứng minh bằng chạy lại O8 (scratch riêng round93-u7, display :190/:191):**

| Engine | S7 đo được | Nhãn mới | Kết quả |
|---|---|---|---|
| Chromium | mask Δx=0,112, bóng Δx=0,113 | kỳ vọng canvas **0,112** | **21/21 PASS** |
| WebKit | mask Δx=0,194, bóng Δx=0,197 | kỳ vọng canvas **0,194** | **21/21 PASS** |

- S5 cùng lượt cũng cho Δx=0,112 (Chromium) / 0,194 (WebKit) — khớp đúng
  `deltaExpS7` vì cùng công thức qua `canvasExpected`.
- Ghi chú T9 (đợt 92): O8 Chromium Δx=0,112 — lượt này đo lại 0,112/0,113,
  **xác nhận 0,112 là giá trị ổn định của Chromium ở layout này**, không
  phải dao động.
- Caveat nhỏ: `deltaExpS7` dùng hình học của phép đo t=1 (m1); nếu canvas
  resize giữa 2 phép đo thì kỳ vọng lệch — trong thực tế cửa sổ cố định
  1440×900 nên không xảy ra; không xử lý thêm.

## 2. (b) Test timing Q5 có thể flake dưới tải cực nặng — ĐÃ ĐO, KHÔNG FLAKE, KHÔNG SỬA TEST

**Đối tượng:** 2 test trong `apps/web/src/lib/seek.test.ts` (Q5 §6 mục 5):
- **T1** "seeked tới muộn trong lần gia hạn": `sleep(60)` rồi assert promise
  CHƯA resolve (deadline resolve ~120 ms = 40 + 2×40). Biên danh nghĩa 60 ms.
- **T2** "timer cháy mà không còn seeking": `sleep(180)` rồi assert promise
  ĐÃ resolve (deadline ~100 ms, không gia hạn). Biên danh nghĩa 80 ms.

**Probe mới** `apps/web/scripts/probe93u7-q5-timing-flake.mjs` (chạy bằng
`node --experimental-strip-types`, `--reps N --load N`): chạy đúng kịch bản
2 test, đếm flake + ghi phân phối độ trễ thực của sleep và của promise.

**Bẫy probe v1 — đã bắt được và sửa trước khi kết luận (ghi rõ để khỏi ai
tin số cũ):** bản đầu `res.t1.push({resolvedAtCheck: resolved})` SAU
`await p` — lúc đó `resolved` luôn là true nên tóm tắt báo T1 flake
**30/30 sai**. Phát hiện vì JSON thô mâu thuẫn: `sleepElapsed` ~93 ms mà
`resolveElapsed` ~302 ms — không thể đã resolve lúc check. Tính lại độc
lập từ JSON thô (flake thật ⇔ resolveElapsed ≤ sleepElapsed) cho 0/30 cả
hai tải, khớp probe v2 sau khi sửa (chụp `resolvedAtCheck` TRƯỚC `await p`).
File JSON load3/load6 trên đĩa là của probe v2 (ghi đè); số v1 chỉ còn
trong log này.

**Kết quả (probe v2, mỗi scenario 30 reps):**

| Scenario | 3× `yes` | 6× `yes` (150% CPU trên VM 4 vCPU) |
|---|---|---|
| T1 flake | **0/30** | **0/30** |
| T2 flake | **0/30** | **0/30** |

- **T1:** sleep(60) thực tế median ~100 ms (min 69, max 114); promise
  resolve median ~295–299 ms, min 140–148 ms. Timer 40 ms nối nhau tích
  lũy độ trễ (~+60 ms mỗi nhịp dưới tải) nên deadline hiệu dụng ~300 ms
  chứ không phải 120 ms — check ở ~100 ms vẫn còn biên tối thiểu **46 ms**
  (load 3×) / **99 ms** (load 6×). Không flake.
- **T2:** sleep(180) thực tế median ~199 ms (min 179, max 218); promise
  resolve median ~102 ms, **max 184 ms** (load 6×). Biên (sleep − resolve)
  median ~96–97 ms nhưng **min 0 ms** (load 6×, rep 17: sleep 184 ms =
  resolve 184 ms — trúng đúng lúc, assert vẫn qua nhờ thứ tự microtask),
  3/30 rep biên < 30 ms ở load 6×. **Chưa flake trong 60 lần, nhưng biên
  đã cạn ở tải cực nặng — test này CÓ THỂ flake nếu tải nặng hơn nữa.**
- **Suite thật:** `seek.test.ts` chạy **10/10 lần 20/20 PASS** dưới 3× `yes`
  (loadavg lên tới 16,49 lúc chạy — có cả tải của luồng song song).

**Quyết định: KHÔNG sửa `seek.test.ts`. Căn cứ bằng số đo:**
- Không flake nào quan sát được (0/60 mỗi scenario + 10/10 suite).
- Không có ngưỡng sạch để nới: đường không-gia-hạn resolve max 184 ms,
  đường có-gia-hạn resolve min 140 ms dưới tải — hai phân phối CHỒNG nhau
  ở đuôi, nên mọi ngưỡng thời gian (vd assert resolve < 250 ms) đều không
  phân biệt chắc chắn "có gia hạn" vs "không gia hạn" dưới tải. Nới sleep
  180 → 300 ms cũng không giúp: nó chỉ dời điểm check, không tăng biên
  phân biệt (resolve của đường không-gia-hạn cũng trễ theo tải).
- Nợ còn lại: T2 là test mỏng nhất của Q5; nếu một lượt sau thấy nó flake,
  hướng sửa đúng là đổi assert sang **đếm số lần timer re-arm** (kiểm tra
  hành vi gia hạn trực tiếp, không qua thời gian wall-clock) thay vì nới
  số ms — chưa làm trong lượt này vì chưa có flake để sửa.

**Sự cố vệ sinh tiến trình (ghi trung thực):** sau vòng 10× seek.test tôi
chạy `pkill -f "^yes$"` để tắt tải nền của mình — mẫu này khớp MỌI tiến
trình `yes`, không chỉ của tôi, nên có thể đã giết cả `yes` của luồng song
song đang đo tải. Ngay sau đó vẫn thấy 3 tiến trình `yes` (PID 11996,
12001, 12002), rồi chúng biến mất — không xác định được chủ sở hữu. Bài
học: chỉ kill theo PID đã spawn (như probe93u7 làm), không dùng `pkill`
theo tên chung. Không lặp lại.

## 3. (c) Số đo seek GOP 30/60/250 — ĐÃ ĐO ĐỦ 6 TỔ HỢP, XÁC NHẬN CÓ ĐIỀU KIỆN

**Công cụ:** `probe89q5-seek-latency.mjs` đã thêm `--clip <path>` + `--tag`
(đợt 93 U7) + `CFG_DIR` theo PID (tránh 2 probe song song ghi đè cùng vite
config / wave-probe trong /tmp). Keyframe verify bằng ffprobe trước mỗi
lượt (ghi vào JSON): GOP250 chỉ t=0; GOP60 ở 0/2/4 s; GOP30 ở 0/1/2/3/4/5 s.
Mỗi tổ hợp 6 trial (3× t=1, 3× t=5, xen kẽ), tải nền 3× `yes` trong probe +
tải ambient của các luồng song song (ghi loadavg từng lượt — xem caveat).

**Kết quả pause-seek (tElement / tCanvas, median, ms):**

| Engine | target | GOP 250 | GOP 60 | GOP 30 |
|---|---|---|---|---|
| Chromium | t=5 | 1704 / 1828 | 1087 / 1213 | 805 / 1225 |
| Chromium | t=1 | 698 / 906 | 814 / 1317 | 495 / 585 |
| WebKit | t=5 | 4502 / 5006 | 2185 / 2270 | 1202 / 1998* |
| WebKit | t=1 | 1967 / 3526 | 1888 / 2070 | 1408 / 982† |

\* WebKit GOP30 t=5 chỉ 2/3 trial confirmed (xem dưới).
† WebKit GOP30 t=1 tCanvas median bị kéo xuống bởi artifact trial 6 (xem dưới);
loại trial 6 thì median ≈ 1326 ms.

**Kết luận 1 — latency seek PHỤ THUỘC GOP (mạnh):** t=5 (xa keyframe nhất)
nhanh dần rõ rệt theo mật độ keyframe: Chromium 1704 → 1087 → 805 ms
(2,1×); WebKit 4502 → 2185 → 1202 ms (3,7×). Đúng cơ chế decode: GOP250
t=5 phải decode ~150 frame từ keyframe t=0; GOP30 t=5 có keyframe ngay
tại t=5. t=1 ít phụ thuộc hơn (gần keyframe ở mọi GOP), nhưng GOP30 vẫn
nhanh nhất vì có keyframe đúng tại t=1.

**Kết luận 2 — KHÔNG phủ nhận T3; hai đại lượng khác nhau, phải nói rõ:**
T3 kết luận "stall do CPU đói, không do GOP" cho **stall SAU seekDone
trong lúc PHÁT** (element đóng băng 1–2,8 s sau khi seek xong, rồi chu kỳ
drift re-seek). Lượt này đo **latency pause-seek** (tElement/tCanvas tới
khi xác nhận) — đại lượng khác, và nó phụ thuộc GOP như trên. Hai kết luận
cùng đúng: GOP quyết định seek tới đích mất bao lâu (decode), còn sau khi
đã tới đích thì frame có trình chiếu kịp hay không là chuyện CPU/pipeline
(không phụ thuộc GOP).

**Bằng chứng mới ủng hộ phần "CPU đói" của T3 (đo độc lập, không phải lặp
lại số T3):** WebKit GOP30 trial 5 — clip có keyframe ĐÚNG tại t=5,
element tới t=5 chỉ sau **1013 ms** (seeking=false, readyState=4), nhưng
**canvas kẹt ở khung t=1 suốt 30 s deadline** (tCanvas=null,
confirmed=false, lastDarkCx=0,4025). Stall canvas > 30 s trên GOP dày
nhất không thể là do GOP — đúng cơ chế T3 §1.1 (frame trình chiếu tụt sau
currentTime dưới tải). Đây cũng là lần đầu probe Q5 ghi nhận trial
không-confirmed vì canvas (trước đây mọi trial đều confirmed).

**Artifact đo phát hiện thêm (probe Q5, ghi để đợt sau xử lý):** WebKit
GOP30 trial 6 (t=1): tCanvas=712 ms NHỎ HƠN tElement=2291 ms — vì canvas
vốn đã (stale) ở khung t=1 từ trial 5, nên tiêu chí `canvasOk` thỏa ngay
mà không cần khung mới tới. `canvasOk` của probe không phân biệt "khung
vừa tới đích" với "khung cũ tình cờ trùng đích". Số tCanvas của trial 6
là vô nghĩa; median t=1 đã hiệu chỉnh ở bảng trên. Không sửa probe trong
lượt này (cần đổi tiêu chí thành "canvas ĐÃ ĐỔI khỏi baseline rồi mới khớp
đích" — để đợt sau, vì nó đổi logic xác nhận của Q5).

**Caveat (trung thực):**
- Tải ambient khác nhau giữa các lượt (loadavg lúc bật tải: Chromium
  0,97–10,03; WebKit 11,51–15,65) — số tuyệt đối KHÔNG so được ngang phiên
  (số Chromium-load lượt này nhanh hơn Q5 gốc 2–3×: tElement median 1593
  ms vs 4024 ms ở Q5 — do tải ambient nhẹ hơn lúc đó, không phải do code
  nhanh lên). Chỉ thứ tự GOP trong cùng phiên là kết luận vững.
- n=3 mỗi target mỗi tổ hợp — mẫu nhỏ; dao động giữa các trial lớn
  (vd WebKit GOP250 t=1 tElement 1967–3392 ms).
- Chỉ 1 clip (720p, 6 s, cùng hình học bóng), 1 cửa sổ tải; không suy ra
  cho clip dài/4K/codec khác.
- Trial WebKit GOP30 #5 không-confirmed làm median tCanvas t=5 chỉ tính
  trên 2 trial confirmed.

## 4. Môi trường lượt này

- VM reboot ~23:36Z 11/11 trước lượt (uptime 6 phút lúc 23:39Z); KHÔNG
  reboot thêm trong lượt (uptime 27 phút lúc 00:01Z). RAM khả dụng
  ~0,95–1,3 GB suốt lượt.
- Dep WebKitGTK còn nguyên sau reboot (269 plugin gstreamer,
  libgtk-4.so.1) — **không cần khôi phục từ debroot**; WebKit 27.2 launch
  được ngay, O8 WebKit 21/21.
- Không gặp sóng EPERM (vite lên lần đầu mọi lượt; wave-wait qua ngay).
- Không process/scratch mồ côi của luồng này: mọi probe/harness tự tắt
  bridge/vite/Xvfb/browser cuối lượt; `yes` của probe tự kill theo PID.
  (Ngoại lệ: vụ `pkill` ở §2 — xem ghi chú ở đó.)

## 5. Kiểm chứng

- `tsc --noEmit` apps/web: **0 lỗi**.
- `vite build`: **pass (22,21 s)**.
- `seek.test.ts`: **20/20** (chạy 10 lần dưới 3× `yes`: 10/10 lần 20/20).
- Click-test O8 sau sửa nhãn S7: Chromium **21/21**, WebKit **21/21**
  (S7 nhãn mới khớp số đo cả 2 engine — §1).
- Probe Q5 6 tổ hợp GOP: 35/36 trial confirmed (chỉ WebKit GOP30 trial 5
  không-confirmed vì canvas stall > 30 s — đã phân tích ở §3).
- Probe timing flake v2: T1/T2 0/30 + 0/30 (3× và 6× `yes`).
- `node --check` cho cả 3 script .mjs đã sửa/mới: pass.
- Không sửa production (không đụng `src/`, không đụng TTS 39, không đụng
  `.github/workflows`).

## 6. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` — S7: nhãn
  `deltaExpS7` tính theo canvas (thay hardcode ~0.19).
- `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` — như trên (bản WebKit).
- `apps/web/scripts/probe89q5-seek-latency.mjs` — `--clip`/`--tag`,
  `CFG_DIR` theo PID, ghi keyframe/clip vào JSON.
- `apps/web/scripts/probe93u7-q5-timing-flake.mjs` — MỚI: probe đo flake
  timing Q5 (T1/T2) dưới tải.
- `docs/PHASE9_ROUND93_U7_HARNESS_O8Q5_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round93-u7-harness-o8q5`
(`~/workspace/repo-1-push/paths-loop/phase9-round93-u7-harness-o8q5.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u7.md`.
Số liệu thô: `hidden_files/round93-u7/q5-timing-flake-load{0,3,6}.json`
(load0 là probe v1 — chỉ dùng resolveElapsed/sleepElapsed thô, KHÔNG dùng
trường resolvedAtCheck của nó; load3/load6 là probe v2),
`hidden_files/round93-u7/probe-{chromium,webkit}-load-gop{250,60,30}/probe-results.json`,
`hidden_files/round93-u7/o8-{headed,webkit}/o8*-clicktest-report.json`.

## 7. Nợ còn lại cho đợt sau

1. **T2 mỏng (Q5 §6 mục 5 còn mở một nửa):** biên min 0 ms ở 6× `yes` —
   có thể flake nếu tải nặng hơn. Hướng sửa đã đề xuất: assert theo số
   lần re-arm thay vì thời gian wall-clock (chưa làm vì chưa có flake).
2. **Probe Q5 `canvasOk` không phân biệt khung mới tới vs khung cũ trùng
   đích** (artifact trial 6 WebKit GOP30): đổi tiêu chí thành "canvas đã
   đổi khỏi baseline rồi mới khớp đích".
3. **Trần 5000 ms của T3 vẫn chưa có bằng chứng ngoài đời** (nợ đợt 92 §4
   mục 3 — không thuộc brief U7, nhắc lại): lượt này cũng không bắt được
   stall > 1500 ms nào ở phase phát (chỉ bắt được canvas stall > 30 s ở
   phase pause-seek, là chuyện khác).
4. **Số seek GOP chỉ 1 clip 720p/6 s, n=3/target** — cần mẫu lớn hơn + clip
   dài hơn nếu muốn kết luận phân phối.
