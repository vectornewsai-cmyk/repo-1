# PHASE9 ROUND117 T9 — SEEK/PRELOAD: B-Q8-1 với hướng RING-LAYER (ring 8 MiB) — LIMITS

- **Đợt:** 117, luồng T9. **Ngày:** 2026-11-15 (UTC). **Boot:** lúc viết prereg
  `uptime -s` = 2026-11-15 08:29:12Z — là boot **#52** (id `22536366…`,
  khớp xác nhận của T7 đợt 117 probe #36, cùng uptime -s). Không có
  reboot nào trong lúc T9 đo (uptime -s không đổi từ prereg tới cuối
  extra 09:43:57Z; reboot tiếp theo xảy ra ~09:47:08Z, SAU khi T9 xong
  hết mọi run — không ảnh hưởng số liệu).
- **Cây:** `preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b`, `media.ts`
  md5 `2c384ed13703809d5e999311147745e7` — **không đổi trước/sau mọi leg**
  (verify trước/sau matrix, trước/sau extra, trước/sau playing-clean).
- **Prereg:** `hidden_files/round117-t9/prereg-t9.md` — viết TRƯỚC mọi đo.
- **Tiếp nối:** S9 (`docs/PHASE9_ROUND116_S9_SEEKPRELOAD_LIMITS.md`), R8
  (`docs/PHASE9_ROUND115_R8_SEEKPRELOAD_LIMITS.md`), N2
  (`docs/PHASE9_ROUND112_N2_RING8_LIMITS.md`).

## 0. Verdict — đọc kỹ: bar FIX "đạt theo chữ" nhưng KHÔNG chứng minh được nhân quả

| Hạng mục | Kết quả |
|---|---|
| Bar FIX prereg §2 (treatment FAILED+STARVE ≤1/5 VÀ SURVIVED ≥3/5) | **ĐẠT THEO CHỮ** — RING8: FAILED 0/5, SURVIVED 5/5 |
| So sánh A/B thật (RING8 vs CTL cùng leg, xen kẽ) | **KHÔNG KẾT LUẬN ĐƯỢC** — CTL cũng chỉ FAILED 1/5 (SURVIVED 4/5); Fisher hai phía **p=1,0000** |
| Cuộc đua ring-wrap trong leg này | **KHÔNG HỀ XẢY RA Ở CẢ 2 ARM** — PULL req_off=0 trả byte wrap: **0/14 run** (~15.000 pull); bogus GST: **0/14 run** |
| B-Q8-1 PAUSED arm (RING8 r1–r3) | **ĐẠT 5/5 điều kiện** (xem §4) — nhưng với trần **9,22 s**, không phải 17,421 s |
| B-Q8-1 PLAYING arm | **KHÔNG ĐẠT 0/2** (xem §4) — cả 2 run sạch đều ở trên blob nhưng không đạt full [0,32] trong 20 s (chỉ tới [0,23,4]/[0,24,6]) |
| B-Q8-1 tổng | **KHÔNG ĐẠT** — PAUSED đạt, PLAYING không đạt |
| Production `apps/web/src/media.ts` | **KHÔNG ĐỔI** (md5 `2c384ed1…` trước/sau). Không có patch production nào; treatment là env/shim-only, không ship được qua app (xem §5) |
| `preview.tsx` (không thuộc probe) | **ĐỔI giữa chừng** (03bf029f → af4d5753, 09:41:30Z, do luồng khác đợt 117) — KHÔNG ảnh hưởng probe (bundle chỉ import `media.ts`; xem §8) |
| Mode lỗi không-do-wrap | **TÁI HIỆN LẦN 3** (CTL r3): error-event + fallback dù firstPull đúng, 0 wrap, 0 bogus — nay có thêm bằng chứng 2 instance qtdemux cùng chết (xem §3) |

**Ý nghĩa trung thực (quan trọng, đọc trước mọi con số):** bar FIX đạt vì
leg này KHÔNG CÓ wrap event nào ở cả hai arm — treatment không có gì để
ngăn, nên 0/5 của RING8 không chứng minh được ring 8 MiB "chữa" race
trên protocol Q8PAUSED. Control 1/5 FAILED (thấp hơn hẳn S9 2/5 và R8
lượt sạch 5/5) cũng cho thấy tỉ lệ race biến động mạnh theo leg/boot
mà chưa rõ nguyên nhân. Điều leg này chứng minh được là: (a) **trần buffer
khi paused PHỤ THUỘC cấu hình queue2** — ring 8 MiB (max-size 2 MiB)
cho trần **9,22 s**, khác hẳn 17,421 s của ring 4 MiB (xem §6 — bằng chứng
mới cho thấy trần bám theo max-size-bytes); (b) **B-Q8-1 PAUSED arm đạt
đủ 5/5 điều kiện dưới env RING8** với 3 run liên tiếp đăng ký trước;
(c) mode lỗi không-do-wrap là có thật và đã tái hiện 3 lần (R8, S9, T9).
Kết luận cho parent: **KHÔNG có bằng chứng nào trong leg này để tuyên bố
ring 8 MiB là fix cho B-Q8-1** — và vì treatment không ship được qua app,
quyết định "chấp nhận race + fallback" vẫn là quyết định của parent, nay
có thêm bằng chứng: fallback đã **1/1** phát đủ frames trong leg này
(CTL r3: 325 frames; gộp S9 7/7 → **8/8**).

## 1. Bảng kết quả leg matrix (10 run, boot #52, xen kẽ)

Protocol Q8PAUSED, clip c8 (`~/workspace/round96-x1/clips-faststart/c8.mp4`,
8.182.985 B, 32 s, md5 `98598372`), shim L2 `l2_queue2_probe.so` (md5
`b208e8de`), bundle prod `fresh-element` cả 2 arm. Matrix 5 vòng × 2 arm,
vòng lẻ CTL trước, vòng chẵn RING8 trước. Chạy 08:50:49–09:01:27Z. Cổng
vào leg đạt (load1 1,18, hogs 0); trong leg có sóng tải của luồng khác
(load1 từng run 0,66–23,08 — xem bảng nhạy cảm §2).

Phân loại theo S9 (finalSrc + preloadWaitMs): **FAILED** = bắt đầu trên blob,
kết thúc trên http; **SURVIVED** = kết thúc trên blob + `preloadWaitMs ≥
19.000`; **STARVE** = blob không chết nhưng 0 frames + rs=0.

| run | arm | load1 | failKind | errEv | frames | finalSrc | preloadWaitMs | firstPull req_off=0 | wrapPulls | bogusGST | shim L2Q2 | → |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1 | CTL ring-4MiB | 1,18 | ok | 0 | 369 | blob | 20.063 | `00000020…` | 0/1110 | 0 | OK 4194304/4194304 | SURVIVED |
| r1 | RING8 ring-8MiB | 0,95 | ok | 0 | 371 | blob | 20.068 | `00000020…` | 0/1080 | 0 | OK 2097152/8388608 | SURVIVED |
| r2 | CTL | 0,66 | ok | 0 | 372 | blob | 20.024 | `00000020…` | 0/1080 | 0 | OK | SURVIVED |
| r2 | RING8 | 1,06 | ok | 0 | 370 | blob | 20.080 | `00000020…` | 0/1080 | 0 | OK | SURVIVED |
| r3 | CTL | 4,48 | ok | **1** | 325 | **http** | **1.144** | `00000020…` | 0/1136 | 0 | OK | **FAILED †** |
| r3 | RING8 | 6,13 | ok | 0 | 236 | blob | 20.070 | `00000020…` | 0/1080 | 0 | OK | SURVIVED |
| r4 | CTL | 20,01 | ok | 0 | 139 | blob | 20.096 | `00000020…` | 0/1110 | 0 | OK | SURVIVED |
| r4 | RING8 | 23,08 | ok | 0 | 133 | blob | 20.047 | `00000020…` | 0/1080 | 0 | OK | SURVIVED |
| r5 | CTL | 5,94 | ok | 0 | 144 | blob | 20.081 | `00000020…` | 0/1080 | 0 | OK | SURVIVED |
| r5 | RING8 | 1,58 | ok | 0 | 196 | blob | 20.096 | `00000020…` | 0/1080 | 0 | OK | SURVIVED |

† **CTL r3 là mode lỗi không-do-wrap lần 3** (xem §3): firstPull đúng,
0 wrap, 0 bogus — nhưng error-event ở t=1,07 s + fallback HTTP
(preloadFull=True trên HTTP, 325 frames, phát tới cuối clip).

**Tổng hợp:** CTL FAILED 1/5, SURVIVED 4/5, STARVE 0/5; RING8 FAILED 0/5,
SURVIVED 5/5, STARVE 0/5. **STARVE 0/10** — mode đói R8 không tái hiện.
Fallback HTTP: 1/1 run FAILED phát đủ frames (325) — gộp S9 7/7 → **8/8**.

**Kiểm chứng shim (prereg §1, bắt buộc):** mọi run đều có dòng `L2Q2 ...
OK` trong pull log với readback đúng mức kỳ vọng: CTL
max-size-bytes=4194304 / ring-buffer-max-size=4194304; RING8
max-size-bytes=2097152 (mặc định, J2 unset) / ring-buffer-max-size=
8388608. Case JSON ghi đúng `j2Queue2MaxSizeBytes` /
`l2Queue2RingBufferMaxSize` theo arm. Không run nào MISMATCH/vô hiệu.

## 2. Chấm bar FIX prereg §2 theo chữ + bảng nhạy cảm theo tải

- **(a) Tỉ lệ lỗi pull đầu treatment ≤1/5** — RING8: **0/5 ✓**.
- **(b) Pha blob sống ≥20 s ở ≥3/5 run treatment** — RING8: **5/5 ✓**.
- **(c) Không hồi quy production** — không áp dụng như bar hồi quy (không
  có thay đổi production nào để kiểm); thay bằng: production md5 giữ
  nguyên trước/sau leg ✓ (`03bf029f` / `2c384ed1…`).
- **Kết luận §2: ĐẠT THEO CHỮ — NHƯNG KHÔNG CÓ Ý NGHĨA NHÂN QUẢ.**
  Fisher hai phía RING8 0/5 vs CTL 1/5: **p=1,0000** (bảng [[0,5],[1,4]]).
  Quan trọng hơn: **0 wrap pull trong toàn bộ leg (0/10 run, ~11.000
  pull)** — race không hề nổ ra ở cả hai arm, nên treatment không thể
  được ghi công là "đã ngăn race". Bar FIX đạt là do leg sạch wrap, không
  phải do ring 8 MiB chữa được gì trên protocol này. So sánh với N2
  (play-ngay, blob-file): N2R8 0/8 vs control 7/10, p=0,0040 — ở đó
  control CÓ nổ race nên 0/8 mới có ý nghĩa; ở T9, control KHÔNG nổ
  race nên 0/5 không phân biệt được treatment với may mắn của leg.
  **T9 KHÔNG tuyên bố ring 8 MiB là fix cho Q8PAUSED.**

**Bảng nhạy cảm theo tải:** nhóm load1 < 3: CTL 2 run (r1/r2, 0 FAILED),
RING8 3 run (r1/r2/r5, 0 FAILED); nhóm load1 ≥ 3: CTL 3 run (r3/r4/r5,
1 FAILED — r3 là mode không-wrap), RING8 2 run (r3/r4, 0 FAILED). Mỗi
nhóm n nhỏ; không tách được ảnh hưởng tải lên lỗi (1 FAILED duy nhất
nằm ở nhóm tải ≥3 nhưng là mode không-wrap, không phải race ring).
Tải KÉO DÀI thời gian rõ rệt (T_c 7,0 s ở RING8 r4 load1 23,08; frames
133–144 ở các run load1 ≥ 5,94 so với 369–372 ở load1 ~1) nhưng KHÔNG
ngăn blob sống sót: cả 4 run load1 ≥ 5,94 đều SURVIVED (trừ CTL r3 lỗi
không-wrap). Phù hợp R8 §5: tải không quyết định lỗi pull đầu.

**Vì sao control leg này tốt hơn S9/R8? Chưa giải thích được.** Control
T9 1/5 FAILED vs S9 2/5 vs R8 lượt 2 sạch 5/5 vs gộp Q8+R8 13/23 (57%).
Các yếu tố khác nhau: boot mới (#52, uptime ~20 phút lúc leg
bắt đầu), RAM khả dụng 1.019–1.172 MB, GST replay sau reboot. Không có
cơ chế nào được chứng minh; n nhỏ. Ghi là phương sai leg/boot chưa giải
thích — và là lý do không được suy diễn từ 0/5 của treatment. Gộp
FAILED mọi leg Q8PAUSED tương đương (Q8+R8 13/23 + S9 5/15 + T9 1/10):
**19/48 (40%)**.

## 3. Mode lỗi không-do-wrap — tái hiện lần 3 (CTL r3)

- **Dấu vân tay (đầy đủ):** swap blob ở 300 ms; error-event t=1,07 s
  (code null, msg null, rs=0, ns=3, src đã là `http` lúc ghi event —
  handler fallback chạy trước khi listener đọc src); `emptied` 1,07 s →
  `loadstart` http 1,08 s → full [0,32] trên HTTP lúc 1,44 s →
  seek 16 s xong 2,28 s → 325 frames, phát tới cuối clip (finalCt 32).
  firstPull đúng `00000020 66747970`, wrapPulls **0/1136**, bogusGST
  **0**. Không phải race ring-wrap theo mọi dấu hiệu đã biết.
- **Bằng chứng mới — 2 instance qtdemux cùng chết:** GST log có 2 dòng
  lỗi liên tiếp: `qtdemux0` 0,865 s và `qtdemux1` 1,024 s, cùng
  "Internal data stream error" / "streaming stopped, reason error
  (-5)", KHÔNG có dòng bogus-size nào. Fresh-element tạo 2 element
  (el1 http → el2 blob) nên có 2 pipeline/2 qtdemux; chưa xác định được
  lỗi thuộc pipeline nào (pull log không gán qtdemux instance cho từng
  pull). Đây là manh mối mới so với R8 (1 dòng "Internal data stream
  error" không bogus) và S9 (V1-r3, chưa soi GST 2 instance).
- **Đếm:** mode này nay có 3 instance (R8 L2 PLAYING r2; S9 V1-r3;
  T9 CTL r3) trên tổng ~48 run blob Q8PAUSED tương đương (~6%).
  Tần suất thấp nhưng đều đặn — không phải nhiễu 1 lần. Cơ chế vẫn
  CHƯA RÕ. Không suy diễn thêm.
- **Đính chính grep thô (để khỏi hiểu lầm):** `grep 16f76b79` trên pull
  log tìm thấy 10 dòng ATAKE (8 ở arm CTL, 2 ở ring8p) — đó KHÔNG phải
  bằng chứng wrap. ATAKE không có req_off; kiểm tra số học: take đó có
  `avail=3.988.681` trước khi take, tức đã tiêu thụ đúng
  8.182.985 − 3.988.681 = **4.194.304 byte** — take bắt đầu đúng ở file
  offset 4.194.304, nơi byte đầu TIÊN đúng là `16f76b79…`. Đó là đọc
  tuần tự đúng offset, không phải pull sai offset. Bằng chứng wrap duy
  nhất vẫn là PULL req_off=0 trả byte wrap — **0/14 run** trong T9.

## 4. B-Q8-1 — PAUSED arm ĐẠT 5/5; PLAYING arm KHÔNG ĐẠT 0/2

**PAUSED arm (đăng ký trước: 3 run ĐẦU TIÊN của arm RING8 trong matrix,
r1–r3, cả 3 đều SURVIVED — không chọn lọc post-hoc):**

| run | C (s) | flat5s (s) | T_c (s) | im lặng GST pha chờ | progress sau suspend |
|---|---|---|---|---|---|
| RING8 r1 | **9,22** | 0,0 | 1,07 | 19.411 ms | 0 |
| RING8 r2 | **9,22** | 0,0 | 1,03 | 19.520 ms | 0 |
| RING8 r3 | **9,22** | 0,0 | 1,68 | 18.902 ms | 0 |
| Bar Q8 §3 | < 31,5 | ≤ 0,1 | ≤ 2 | ≥ 18 s | 0 |

Cả 3 run thỏa cả 5 điều kiện: C 9,22 < 31,5 ✓; flatness 0,0 ✓; T_c
≤ 2 s ✓; im lặng ≥18 s ✓ (18,902–19,520 ms); 0 progress sau suspend ✓.
**PAUSED arm: ĐẠT.** Lưu ý: C = 9,22 s, KHÔNG phải 17,421 s (xem §6 —
trần đổi theo cấu hình queue2; bar chỉ yêu cầu C < 31,5 s nên vẫn đạt,
nhưng giá trị trần khác là phát hiện cần ghi rõ, không giấu).
Seek ấm sau 20 s chờ: seek_dur 0,58 / 0,52 / 1,51 s (r3 chậm do tải
load1 6,13); seekedOk 3/3.

**PLAYING arm: KHÔNG ĐẠT 0/2 (chạy lại sạch theo Addendum D của prereg).**
2 run Q8PLAYING env RING8 trong cửa sổ sạch (bracket load1 < 3 trước +
sau mỗi run; xem §8): r1 load1 0,86, r2 load1 0,56 — cả 2 đều ở trên blob
suốt 20 s (finalSrc blob, 0 errEvents, 0 wrap, 0 bogus), nhưng KHÔNG đạt
full [0,32] trong 20 s:

| run | load1 | blobReadyMs | frames (dropped) | firstBuf | lastBuf | lastCt |
|---|---|---|---|---|---|---|
| PLAYING-clean r1 | 0,86 | 915 | 99 (18) | [[0, 9,279], [17,078, 24,201]] | [[0, 23,397]] | 14,375 |
| PLAYING-clean r2 | 0,56 | 1.195 | 101 (18) | [[0, 9,279]] | [[0, 24,565]] | 15,542 |
| Bar (≥1/2 full [0,32] trong 20 s) | — | — | — | — | **cần [0, 32]** | — |

Cả 2 run đều KHÔNG full → PLAYING arm **KHÔNG ĐẠT**. 2 run PLAYING
nhiễm tải trong extra (load1 24,28 / 12,42: 177/188 frames, lastBuf
[0, 26,066]/[0, 26,482]) cũng không full — nhất quán, không phải do
tải: dưới env RING8, đường blob chỉ buffer được tới ~23–26 s trong
20 s chơi. Đối chiếu R8 (cùng protocol, env J2=4 MiB): PLAYING sạch
440/451 frames, full [0,32] 2/2. Sự khác biệt duy nhất có hệ thống là
cấu hình queue2 (max-size-bytes 2 MiB thay vì 4 MiB) — phù hợp giả
thuyết §6: cùng một throttle (max-size) vừa hạ trần paused (17,421 →
9,22 s) vừa bóp tốc độ buffer khi chơi (không kịp full trong 20 s).
Đây là bằng chứng trực tiếp rằng **ring 8 MiB KHÔNG đóng được B-Q8-1**:
nó cho PAUSED đạt 5/5 nhưng làm PLAYING rớt 0/2 — đổi một bar lấy một
bar khác, không phải fix. (Caveat: n=2/arm; nhưng cả 4 run PLAYING
RING8 — 2 sạch + 2 nhiễm — đều không full, trong khi R8 4/4 full
dưới J2=4 MiB; chênh lệch đủ lớn để kết luận theo hướng này.)

**Verdict B-Q8-1 tổng: KHÔNG ĐẠT** (PAUSED đạt 5/5, PLAYING 0/2).

## 5. Hệ quả production (theo prereg §5 — không suy diễn quá)

- **Không có patch production nào từ leg này.** Treatment là env/shim-only
  (`L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608`, J2 unset) — chỉ tồn tại
  trong probe WebKitGTK; app production (Chromium/Electron) không có
  queue2/shim để chỉnh. T9 không áp gì vào `media.ts` (md5 không đổi).
- **Bằng chứng cho parent quyết CHẤP NHẬN race + fallback:**
  (i) 2 fix DOM-level đã BỎ ở S9; (ii) hướng ring-layer KHÔNG chứng
  minh được hiệu quả trên Q8PAUSED (leg sạch wrap cả 2 arm, Fisher
  p=1,0); (iii) fallback HTTP phát đủ frames **8/8** (S9 7/7 + T9 1/1;
  run FAILED duy nhất của T9 phát 325 frames tới cuối clip);
  (iv) mode lỗi không-wrap (~6%) cũng được fallback che (cả 3 instance
  đều phát đủ frames sau fallback). T9 KHÔNG tự quyết chấp nhận —
  parent quyết.
- **Không đề xuất tắt prefetch / hạ ngưỡng prefetch** (S9 đã loại: giết
  coverage clip D; prereg T9 §5 giữ nguyên).
- **Hướng mở (không phải kết luận):** kiểm tra Chromium/Electron
  production có race tương tự không — ngoài phạm vi T9; nếu race chỉ
  tồn tại trong probe WebKitGTK thì toàn bộ B-Q8-1 là vấn đề của môi
  trường đo, không phải của sản phẩm. T9 không có dữ liệu Chromium
  nên không khẳng định.

## 6. Phát hiện mới: trần buffer khi paused bám theo max-size-bytes, không phải ring

- **Số liệu:** arm CTL (max-size-bytes=4.194.304, ring=4.194.304):
  C = **17,421 s** ở cả 4 run SURVIVED (r1/r2/r4/r5), flat5s 0,0.
  Arm RING8 (max-size-bytes=2.097.152 mặc định, ring=8.388.608):
  C = **9,22 s** ở cả 5/5 run, flat5s 0,0. Sau seek tới 16 s, buf
  RING8 là [[0, 9,22], [10,763, 25,189]] (có khoảng trống) so với
  CTL [[0, 32]] đầy.
- **Số học (chưa chứng minh, ghi là giả thuyết có cơ sở):** bitrate
  trung bình c8 = 8.182.985 / 32 = 255.718 B/s. 17,421 s ≈ 4.455.000 B
  (≈ max-size 4.194.304 + 6%); 9,22 s ≈ 2.358.000 B (≈ max-size
  2.097.152 + 12%). Cả hai trần đều ≈ max-size-bytes + ~6–12% (VBR
  ±10%), trong khi ring đổi chiều ngược lại (4 MiB → 8 MiB mà trần
  lại GIẢM 17,421 → 9,22). Phù hợp với giả thuyết "trần = lượng byte
  queue2 giữ được khi paused" — queue2 ngừng nhận khi đạt max-size-bytes.
  Đây là lần đầu 2 cấu hình tách được max-size-bytes khỏi
  ring-buffer-max-size trên cùng protocol (N2 tách 2 biến nhưng đo
  splice, không đo trần). Cần 1 leg đối chứng nữa (vd max-size 4 MiB +
  ring 8 MiB) để khẳng định — nợ cho đợt sau, không kết luận vội.
- **Hệ quả cho B-Q8-1:** bar C < 31,5 s thỏa ở cả 2 cấu hình; giá trị
  trần không phải hằng số 17,421 s của sản phẩm mà là tính chất của
  pipeline đo. H1 ("trần buffer khi paused") vẫn được hỗ trợ về cơ chế
  (suspend → 0 progress, im lặng GST ~19 s, flatness 0,0 — tái hiện ở
  cả 2 arm, 9/9 run SURVIVED), nhưng con số trần phải ghi kèm cấu hình.

## 7. Bar seek lạnh F2 — số mới (extra, nhiễm tải — báo đúng, không chấm vội)

- 2 run Q8SEEKFAST env RING8 (xen kẽ với PLAYING, 09:06–09:07Z):
  r1 **seekImmMs 2.271 ms** (load1 24,79), r2 **1.399 ms** (load1 6,99);
  seekedOk 2/2, phát tới cuối clip 2/2 (finalCt 32), finalSrc blob,
  0 errEvents, 0 wrap, 0 bogus. Cả 2 đều VƯỢT bar cũ ≤940 ms.
- Gộp 8 lượt SEEKFAST (Q8 653/810 + R8-L1 997/794 + R8-L2 1008/760 +
  T9 2271/1399): median **903,5 ms**, range 653–2.271 ms, seekedOk 8/8,
  phát tới cuối 8/8. Đề xuất bar phân phối của S9 §6 (median ≤1,0 s /
  p90 ≤1,2 s / ≥6 run): median 903,5 ms ✓, nhưng p90 ≈ 1.400–2.271 s
  (tùy cách nội suy) ✗ — **không đạt nếu gộp cả 2 run nhiễm tải nặng
  này**. Cả 2 run T9 đều nhiễm tải (load1 6,99–24,79) nên không dùng
  để bác đề xuất bar mới; chỉ ghi số. Verdict F2 theo bar cũ: **KHÔNG
  tái xác nhận** (2/2 vượt 940 ms, nhưng nhiễm tải). Cần lượt SEEKFAST
  sạch để chấm lại — nợ cho đợt sau.
- Lưu ý: firstBuf SEEKFAST là [0, 9,22] — trần 9,22 s tái hiện cả ở
  arm SEEKFAST (cùng env RING8), nhất quán với §6.

## 8. Phương pháp, caveat và nhật ký vận hành

- **Prereg trước đo:** `prereg-t9.md` 08:42Z (trước mọi run đo; smoke
  chạy sau prereg). Bar FIX + luật A/B + điều kiện B-Q8-1 + hệ quả
  production đều đăng ký trước.
- **Smoke test (1 run CTL Q8PAUSED, trước matrix):** SURVIVED (blob
  sống 20 s, trần 17,421, 355 frames, 0 wrap, shim OK). Chỉ dùng để
  kiểm harness (runner copy + classifier + shim); KHÔNG tính vào bar
  (chạy trước matrix, không xen kẽ). Dữ liệu smoke đã xóa sau khi
  kiểm xong (chỉ giữ log `t9-smoke-ctl.log`).
- **Sự cố driver Xvfb (lần chạy matrix đầu, 08:46Z):** `xdpyinfo`
  KHÔNG có trên VM này (command not found) nên driver cũ tưởng display
  trống + tưởng Xvfb khởi động thất bại, trong khi cả 3 Xvfb :197/:198/
  :199 đều đã chạy — driver thoát, bỏ lại 3 Xvfb mồ côi. Đã sửa driver
  sang probe socket unix (`/tmp/.X11-unix/X<d>`, python3 connect),
  kill 3 Xvfb mồ côi (pid 25003/25114/25311), dọn log spam của waiter
  playing-clean (vòng chờ không sleep khi vỡ ngay mẫu 1 — đã vá sleep
  30 s). Matrix chạy lại từ đầu sau khi sửa; không run đo nào bị ảnh
  hưởng (OUT chưa từng được ghi trước khi sửa).
- **Sóng tải trong leg:** luồng khác chạy hog ramp (load1 vọt tới
  49,04 trong lúc chờ playing-clean). Matrix xen kẽ nên drift áp đều
  cho cả 2 arm; per-run load1 ghi trong JSON từng case. Không có reboot
  nào trong lúc T9 đo.
- **Suite liên quan:** không chạy (không có thay đổi production nào;
  cây byte-identical, md5 đã verify 3 lần). Nếu đợt sau áp một fix thật,
  chạy đủ: tsc, vite build (lock v2), media tests, test-preview-engine.sh.
- **Thời gian:** slot cron 3 h (08:35–11:35Z); matrix xong 09:01Z;
  extra xong 09:07Z; playing-clean xong 09:43:57Z.
- **`preview.tsx` đổi giữa chừng (09:41:30Z) — ghi rõ, không giấu:**
  md5 `03bf029f` → `af4d57538e03b05a9ec402996148e187`, mtime
  2026-11-15 09:41:30Z — do một luồng khác của đợt 117 sửa (không phải
  T9). Thời điểm đổi nằm TRONG lúc waiter playing-clean đang chờ cửa sổ
  sạch (trước khi 2 run PLAYING-clean bắt đầu 09:42:31Z — "md5 truoc"
  đã ghi af4d5753). **2 run PLAYING-clean vẫn hợp lệ:** bundle probe
  chỉ import `../../apps/web/src/media` (entry
  `webkit-blob-prefetch-entry.ts`) — `preview.tsx` không nằm trong
  bundle, runner chỉ đọc nó để ghi `env.previewMd5`. `media.ts` không
  đổi trong toàn bộ lượt T9 (mtime 2026-11-12, md5 `2c384ed1…` verify
  trước/sau matrix, extra, playing-clean). Các leg trước playing-clean
  (matrix + extra) chạy khi preview.tsx còn `03bf029f` — không bị ảnh
  hưởng gì thêm.
- **Addendum D (prereg §6 sau):** cổng sạch cho PLAYING đổi từ "load1 <
  3 ổn định 5 phút" sang "2 mẫu liên tiếp load1 < 3 (60 s yên) + bracket
  load1 < 3 trước/sau mỗi run" — vì sóng tải chu kỳ ~8 phút, khoảng yên
  chỉ ~3 phút, cổng 5 phút không đạt được sau ~50 phút chờ (3 lần vỡ ở
  mẫu 5–7). Addendum viết TRƯỚC khi chạy PLAYING-clean; bar PLAYING
  không đổi; 2 run sạch đều đạt bracket (r1 1,01/0,72; r2 0,72/0,78).
  2 run PLAYING nhiễm tải trong extra vẫn không dùng để chấm bar.
- **Không đụng:** TTS 39, birefnet, `.github/workflows/*`, production
  code. T9 không sửa `preview.tsx` (chỉ ghi nhận đổi của luồng khác).

## 9. Nợ mở cho đợt sau

1. **B-Q8-1 KHÔNG ĐẠT (PAUSED đạt, PLAYING 0/2).** Ring 8 MiB đổi một
   bar lấy một bar khác — không phải fix. Đợt sau muốn đóng B-Q8-1 phải
   thử cấu hình khác (vd max-size 4 MiB + ring 8 MiB: giữ trần 17,421 s
   và tốc độ buffer khi chơi — đồng thời kiểm chứng §6) hoặc chấp nhận
   bar không đóng được trên probe WebKitGTK.
2. **Chấp nhận race + fallback?** — quyết parent (bằng chứng §0/§5).
   Nếu chấp nhận: ghi nhận "blob race → HTTP fallback" là hành vi
   thiết kế + đo thêm chi phí fallback (thời gian, băng thông fetch lại).
3. **Mode lỗi không-do-wrap (3 instance):** cơ chế chưa rõ; cần hook
   gán qtdemux instance cho từng pull (pull log hiện không ghi instance
   demuxer) + 1 run tái hiện có kiểm tra error propagation.
4. **Trần 9,22 s vs 17,421 s (§6):** cần leg đối chứng tách max-size
   khỏi ring (vd max-size 4 MiB + ring 8 MiB) để khẳng định trần bám
   theo max-size-bytes.
5. **F2 seek lạnh:** cần lượt SEEKFAST sạch (load1 < 3) để chấm lại bar
   cũ (≤940 ms) và đề xuất bar phân phối (S9 §6).
6. **Race biến động theo leg/boot:** control FAILED 1/5 (T9) vs 2/5
   (S9) vs 5/5 (R8 lượt 2) — chưa rõ nguyên nhân; cần ghi boot/RAM/
   GST-replay vào mọi leg sau để đối chiếu.
7. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35 chờ user quyết;
   `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet
   chỉ thử lại khi RAM đổi (u2net là fallback chính thức). Xem LIMITS
   gộp đợt 116 §10.

## 10. File và dữ liệu

- Runner T9: `benchmarks/render/webkit_blob_flaky_117t9_2mib.mjs` (copy
  S9, chỉ đổi OUT/DIR/round; ~78 KB — **>37.768 B, cần `ENABLE_PRIVSEP=0`
  khi push**).
- Analyzer T9: `benchmarks/render/q8_analyze_117t9.py` (copy S9, chỉ đổi
  OUT/DIR mặc định qua env — logic không đổi; KHÔNG stage nếu parent
  thấy trùng, T9 liệt kê để đủ dấu vết).
- LIMITS này: `docs/PHASE9_ROUND117_T9_SEEKPRELOAD_LIMITS.md`.
- OUT JSON leg bar (5 case/arm, boot #52):
  `benchmarks/results/webkit-blob-flaky-117t9-seekpreload-ctl.json`,
  `...-ring8.json` (KHÔNG stage, theo lệ `benchmarks/results/`).
- OUT JSON extra: `...-ring8-playing.json` (2 case nhiễm tải),
  `...-ring8-seekfast.json` (2 case),
  `...-ring8-playing-clean.json` (2 case sạch, bracket-valid).
- Dữ liệu thô + prereg (+ Addendum D) + driver + classifier + log
  (KHÔNG stage): `hidden_files/round117-t9/` (`prereg-t9.md`,
  `run-t9-matrix.sh`, `run-t9-extra.sh`, `run-t9-playing-clean.sh`,
  `t9_classify.py`, `t9-progress.md`, `t9-classify-*.txt`,
  `t9-analysis-*.txt`, `t9-*.log`, `ctl/`, `ring8/`, `ring8p/`,
  `ring8f/`, `ring8pc/`).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round117-t9-seekpreload.txt`
  (NUL-delimited; chỉ file text đã đổi/thêm, không binary, không workflow).
