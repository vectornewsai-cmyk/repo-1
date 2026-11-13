# Phase 9 đợt 93 — U3: Bằng chứng trần 5000 ms + lag dư WebKit + rVFC WebKitGTK

**Nợ gốc:** LIMITS gộp đợt 92 §4 mục 3 — (a) trần giữ 5000 ms của T3 chưa có
bằng chứng ngoài đời; (b) lag đỉnh còn 0,65–0,85 s do frame trình chiếu
WebKit tụt; (c) rVFC WebKitGTK không bao giờ bắn callback dù supported=true;
(d) O8 Chromium Δx=0,112 của T9 đợt 92 (nhỏ hơn kỳ vọng ~0,19) để đối chiếu.
**Ngày:** 2026-11-11/12 (lượt cron 03:35 +07 12/11; làm việc 23:40–00:10Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). **Không sửa code
production** — chỉ thêm 3 script đo + tài liệu này.
**Trạng thái:** (a) **ĐÃ BẮT ĐƯỢC stall >1500 ms ngoài đời — trần giữ đúng**
(8 stall 1,6–3,9 s, playhead đứng yên Δ=0,000 trong mọi stall); (b) **lag dư
là frame trình chiếu WebKit tụt, xác nhận là đặc tính pipeline WebKitGTK**
(lagEl tới 1,48 s ở tải 3×yes, 1,83 s ở tải 4×yes; Chromium tối đa 0,40 s);
(c) **rVFC WebKitGTK KHÔNG BAO GIỜ bắn callback — ĐÃ XÁC NHẬN bằng probe tối
thiểu** (0/4 chuỗi, video phát sạch; Chromium cùng trang 280+/chuỗi);
(d) **Δx=0,112 là ĐÚNG** (kỳ vọng hệ canvas là 0,112; ~0,19 là hệ project —
T9 so nhầm hệ tọa độ). Phát hiện mới (§5): trần chỉ bảo vệ stall ĐẦU TIÊN
sau mỗi lần seek hoàn tất — stall sau đó (không có seek mới) không được giữ.

## 1. (a) Trần 5000 ms — bắt được stall >1500 ms ở lượt post

### 1.1 Phương pháp

Probe mới `apps/web/scripts/probe93u3-stall-evidence.mjs` (copy probe92t3,
đổi scratch sang `round93-u3`, thêm `--load4` = 4×`yes`, sửa đường clip
GOP30/60 — xem §6). Cùng kịch bản T3: pause-seek t=5 xác nhận →
`setPlayhead(0.5)` + phát, sampler 100 ms trong trang (playhead store,
element `__vcutMediaEls`, darkCx canvas → ballTime), rVFC attach riêng,
phân tích bằng `analyze92t3-canvas-stale.mjs` (cũ) + analyzer mới
`analyze93u3-lagdecay.mjs` (lag ở cuối stall và +500/+1000/+2000 ms sau
khi stall hết, re-seek, lag ổn định). Mỗi lượt phase khác nhau để không
ghi đè JSON (bài học T3 §4). 7 lượt WebKit + 1 lượt Chromium, clip bóng
720p 6 s, GOP 250/30/60.

Môi trường: VM reboot ~23:36Z 11/11 (uptime 6 phút lúc bắt đầu lượt);
RAM khả dụng ~1,1 GB lúc bắt đầu; dep WebKitGTK còn nguyên sau reboot
(269 plugin, KHÔNG cần khôi phục debroot); loadavg lúc bật tải 1,6–13,3
tùy lượt (luồng sibling đợt 93 chạy song song).

### 1.2 Kết quả — stall sau seekDone (phát + !seeking + ΔelT < 0,005/mẫu, ≥300 ms)

| Lượt | Tải | Stall >1500 ms (ms) | Playhead trong stall | Re-seek | lagEl max | lagPh max |
|---|---|---|---|---|---|---|
| WebKit GOP 250 r1 | 3×yes | 0 (stall dài nhất 1113) | giữ Δ0,000 (stall 1113) | 0 | 1,016 s | 0,607 s |
| WebKit GOP 250 r2 | 3×yes | **1695** | **giữ Δ0,000** | 0 | 1,167 s | 0,867 s |
| WebKit GOP 250 r3 | 4×yes | **3246, 3190, 2831** | **giữ Δ0,000 cả 3** | 3 | 1,832 s | 1,832 s |
| WebKit GOP 30 r1 | 3×yes | **1593, 3020, 3904** | **giữ Δ0,000 cả 3** | 2 | 1,483 s | 1,483 s |
| WebKit GOP 60 r1 | 3×yes | **1620** | **giữ Δ0,000** | 0 | 0,988 s | 0,488 s |
| WebKit GOP 30 r2 | 3×yes | — (không đo được, xem §6) | — | 0 | — | — |
| Chromium GOP 250 r1 | 3×yes | 0 (stall dài nhất 386) | giữ Δ0,000 | 0 | 0,396 s | 0,104 s |

**Tổng: 8 stall >1500 ms bắt được ngoài đời (1620–3904 ms), tất cả đều
giữ playhead đứng yên Δ=0,000 s trong suốt stall; 0 re-seek trong lúc
stall.** Đây là bằng chứng trực tiếp đầu tiên cho trần 5000 ms mà T3
chưa có (lượt post của T3 stall dài nhất chỉ 906–1285 ms). Trần chưa bao
giờ chạm tới giới hạn 5000 ms (stall dài nhất 3904 ms) nên **hành vi nhả
ở 5000 ms vẫn chưa được chứng minh ngoài đời** — chỉ có unit test
T3-R1/R2 (giữ ở 2109/2829 ms, nhả ở 5001 ms). Không có stall nào >5000 ms
trong 7 lượt WebKit, dù đã đẩy tải lên 4×yes.

Ngoại lệ có chủ ý (xem §5): 2 stall NGẮN sau stall đầu KHÔNG được giữ —
GOP 250 r1 stall 486 ms (playhead +0,433 s), GOP 60 r1 stall 306 ms
(playhead +0,367 s) — vì watch đã đóng sau lần resume đầu tiên.

### 1.3 Kết luận (a)

Trần 5000 ms **giữ đúng ngoài đời tới ít nhất 3904 ms** (8/8 stall
>1500 ms). Nợ "chưa có bằng chứng ngoài đời" của T3 **đã đóng ở mức
trần-chưa-chạm-giới-hạn**: chứng minh được giữ-qua-1500 ms, chưa chứng
minh được nhả-ở-5000 ms (cần stall 5 s+ ngoài đời, chưa gặp).

## 2. (b) Lag dư — phân rã playhead vs element vs frame trình chiếu

### 2.1 Số đo sau khi stall hết (analyzer lagdecay)

Lag trình chiếu `lagEl = element currentTime − ballTime` (ballTime = đồng
hồ độc lập từ centroid ô đen trên canvas) ở cuối stall và sau đó:

| Lượt | Cuối stall dài nhất | +500 ms | +1000 ms | +2000 ms | LagEl ổn định (20 mẫu cuối) |
|---|---|---|---|---|---|
| GOP 250 r2 (stall 1695) | −0,019 s | 0,048 s | 0,048 s | **1,167 s** | mean 0,345 s |
| GOP 250 r3 load4 (stall 3246) | −0,019 s | −0,019 s | 0,048 s | **1,514 s** | mean 0,312 s, max 1,832 s |
| GOP 30 r1 (stall 3904) | 0,018 s | 0,036 s | 0,084 s | **1,284 s** | mean 0,728 s, max 1,483 s |
| GOP 60 r1 (stall 1620) | 0,006 s | 0,073 s | 0,079 s | 0,458 s | mean 0,310 s |
| Chromium GOP 250 | −0,019 s | 0,225 s | 0,225 s | 0,229 s | mean 0,198 s |

Chú thích: cột cuối là 20 mẫu cuối tính TỪ lúc canvas lần đầu rời khung
t=5 (canvasChangeIdx) trở đi — bản analyzer đầu lấy cả mẫu chuyển tiếp
seekDone→canvas-đổi-khung (canvas còn hiện khung t=5, lagEl ≈ −4,5) nên
mean âm giả; đã sửa analyzer và chạy lại, các số trên là số sau sửa.

### 2.2 Phân rã — lag dư là frame trình chiếu tụt, KHÔNG phải playhead chạy trước

- **Trong stall, playhead ≈ element ≈ frame trình chiếu** (lagPh ≈
  lagEl ≈ −0,02 s ở cuối mọi stall dài): cả ba đồng hồ cùng đứng yên —
  trần giữ đúng, không có độ lệch nào tích lũy trong stall.
- **Sau khi stall hết, element currentTime chạy lại nhưng frame trình
  chiếu KHÔNG theo kịp:** lagEl tăng lên 0,4–1,5 s trong 2 s sau stall
  (GOP 250 r2: 1,167 s; GOP 30 r1: 1,106–1,483 s; load4: 1,514 s),
  trong khi `ph − elT` nhỏ (≤0,10 s ở các lượt tải 3×yes) — tức playhead
  và media clock gần như trùng nhau, chỉ có **frame canvas tụt sau cả
  hai**. Tick vẫn chạy và vẫn vẽ trong khoảng stale (draw +1..3,
  skipN3 = 0, hold = 0 — như T3): `drawImage` trả frame cũ vì
  decoder/compositor WebKitGTK chưa kịp trình frame mới.
- **Chromium không bị:** lagEl max 0,396 s, rVFC đo trực tiếp lag trình
  chiếu (ct − mediaTime) mean 0,034 s, p95 0,095 s, max 0,095 s (16 mẫu).
  Cùng tải, cùng clip, cùng kịch bản — vấn đề là **đặc tính pipeline
  media WebKitGTK (GStreamer) trên VM này**, không phải lỗi vòng lặp
  preview. Khẳng định lại kết luận T3 §1.1, với số lớn hơn: lag dư nay
  đo tới **1,48 s ở tải 3×yes** (T3: 0,65–0,85 s ở tải nhẹ hơn cuối
  lượt) và **1,83 s ở tải 4×yes**.
- **Phân rã không đều theo thời gian:** lagEl sau stall không phân rã
  đơn điệu — nó tăng vọt trong ~2 s đầu sau stall (decoder đuổi theo
  nhưng trình frame cũ), rồi mới giảm dần khi decoder bắt kịp. Không có
  hằng số thời gian duy nhất để báo cáo; xem chuỗi mẫu từng lượt trong
  `analyze-*.txt`.

### 2.3 Chu kỳ mới dưới tải cực đoan (load4, GOP 250 r3) — phát hiện mới

Ở tải 4×yes (rAF gap mean 464 ms, max 1310 ms; renderMs mean 288 ms),
sau khi stall 1 hết (3246 ms, giữ đúng), element resume CHẬM (elT chỉ
tăng 0,067 s trong 1,5 s wall đầu sau resume — decoder đuổi theo theo
từng đợt bùng) trong khi playhead chạy theo wall-clock → drift
ph−elT = 0,566 s (> ngưỡng 0,35 s) → **drift re-seek** → element seeking
5,4 s (canvas đóng băng ở khung cũ, playhead giữ kiểu R2) → seek đáp →
stall 2 (3190 ms, giữ đúng nhờ watch mới từ re-seek) → resume chậm →
drift → re-seek #2 → stall 3 (2831 ms, giữ đúng) → drift → re-seek #3.
Tổng: 3 re-seek, stale 5958 ms / 22315 ms cửa sổ (27%), cộng thêm
~6,2 s + ~1,7 s seeking với ball đóng băng.

Đây là chu kỳ KHÁC chu kỳ pre-fix của T3 (stall → nhả giữa stall →
drift → re-seek): chu kỳ mới là **stall → giữ đúng → resume chậm →
drift → re-seek → stall lại**. Trần 5000 ms đã đóng đường "nhả giữa
stall", nhưng đường "resume chậm → drift" vẫn mở dưới tải cực đoan.
Ở tải 3×yes, GOP 30 r1 cũng có 2 re-seek theo cùng cơ chế (sau stall
3020/3904 ms). Hướng sửa tương lai (nợ, không làm trong luồng này):
sau khi resume-stall hold nhả, playhead có thể đuổi theo media clock
bằng slew thay vì chạy ngay 1× wall, hoặc ngưỡng drift tính thêm độ trễ
đuổi-kịp sau stall.

## 3. (c) rVFC WebKitGTK — ĐÃ XÁC NHẬN không bao giờ bắn callback

### 3.1 Probe tối thiểu (ngoài app)

`apps/web/scripts/probe93u3-rvfc-webkit.mjs`: trang HTML tĩnh, 2 video
cùng clip bóng 6 s — 1 HIỂN THỊ (640×360) + 1 ẨN (1×1, opacity:0,
offscreen, để kiểm tra giả thuyết "rVFC chỉ bắn cho video được
composite") — attach rVFC trước khi play (chuỗi A) + attach lại sau
12 s đã phát (chuỗi B), seek tới 3,0 ở 8 s, sampler currentTime 100 ms,
chạy 20 s. Server tĩnh có hỗ trợ Range 206 (bản đầu không hỗ trợ Range
đã gây MEDIA_ERR_NETWORK code 2 trên WebKit sau seek — đã sửa và chạy
lại sạch, xem §6).

### 3.2 Kết quả

| Engine | Lần chạy | vis A | vis B | hid A | hid B | Video có phát không |
|---|---|---|---|---|---|---|
| WebKitGTK 27.2 | lần 1 (chưa Range) | 0 | 0 | 0 | 0 | vis phát tới ct 5,333 rồi lỗi code 2 sau seek; hid lỗi code 2 ở ~3 s |
| WebKitGTK 27.2 | lần 2 (có Range) | **0** | **0** | **0** | **0** | vis phát sạch tới ct 5,933, 81 frame trình chiếu (dropped 31), 0 lỗi; hid ct tới 3,0, 0 frame trình chiếu |
| Chromium 158 | đối chứng | 280 | 116 | 281 | 121 | cả 2 video phát + loop bình thường, ctMax 6 |

`protoHas=true`, `instHas=true` ở cả 2 engine — API tồn tại, nhưng
**WebKitGTK không gọi callback lần nào trong 4/4 chuỗi × 2 lần chạy**
(trước-play, sau-play, hiển thị, ẩn), trong khi Chromium cùng trang bắn
hàng trăm callback. Lần 2 loại trừ biến nhiễu lỗi phát: video hiển thị
phát sạch 20 s, trình 81 frame, vẫn 0 callback. Kết luận T3 ("rVFC
WebKitGTK không bao giờ bắn callback dù supported=true") **đã xác nhận
độc lập ngoài app** — không phải do app VCut, không phải do attach sai
thời điểm, không phải do video ẩn/hiện.

Cộng với 7 lượt probe app đợt này (rvfcSamples = 0/7 lượt WebKit;
Chromium 16 mẫu, lag trình chiếu mean 0,034 s) và 5/5 lượt WebKit của
T3: tổng **0 callback trong 12 lượt WebKit + 2 probe tối thiểu**.

### 3.3 Nguyên nhân (suy luận có căn cứ, không đo được từ ngoài)

rVFC trong WebKit là tính năng theo từng backend media player
(`MediaPlayerPrivate*`): API ở tầng `HTMLVideoElement` tồn tại nhưng
callback chỉ được gọi khi backend trình frame qua compositor và báo lại.
Bằng chứng bên ngoài khớp mẫu này: WebKit bug 267324
(https://bugs.webkit.org/show_bug.cgi?id=267324) ghi nhận
`MediaPlayerPrivateWebM` không hỗ trợ rVFC — "videoFramePromise will
never resolve" (bug đó nói backend WebM, không phải GStreamer, nên chỉ
dùng làm chứng cho CƠ CHẾ backend-phụ-thuộc, không phải bằng chứng trực
tiếp cho GStreamer). Trên WebKitGTK 27.2 + GStreamer ở đây, triệu chứng
y hệt: API có, callback không bao giờ tới. Không thể đo sâu hơn từ ngoài
trình duyệt (cần build WebKit với log media-player). **Hệ quả thực
hành: mọi tính năng dựa vào rVFC trên WebKitGTK đều không dùng được —
phải có đường fallback (sampler currentTime / rAF) như hiện tại.**

## 4. (d) O8 Chromium Δx — ĐÃ ĐỐI CHIẾU, không có bất thường

Chạy lại click-test O8 Chromium
(`clicktest-87o8-mask-track-headed.mjs`, scratch mới
`round93-u3/o8-chromium`, display :187, loadavg lúc chạy ~10,6 do luồng
sibling): **21/21 PASS, 0 fail**.

- S5 (a): t=1 blob x=0,4436; t=5 blob x=0,556; **Δx=0,112 (kỳ vọng
  0,112)**.
- S7: mask Δx=0,112; bóng Δx=0,113 (kỳ vọng canvas 0,112).

Kỳ vọng trong harness (`deltaExp`, dòng 819/1009) được tính bằng
`canvasExpected(...)` — tức **hệ tọa độ canvas đã qua letterbox**
(video 1280×720 vào canvas 871×275, videoRect rộng 488,9 px từ x=191,1):
0,20 project × 488,9/871 ≈ 0,112 canvas. Số "~0,19" mà T9 ghi là hiệu
project (0,60−0,40 = 0,20) — **so nhầm hệ tọa độ**. Δx=0,112 đã xuất hiện
3 lần độc lập (đợt 87, T9 đợt 92, U3 đợt 93) và khớp kỳ vọng canvas
trong cả 3 lần. **Đóng mục (d): không có bất thường, không cần đo lại.**

## 5. Phát hiện mới — trần chỉ bảo vệ stall ĐẦU TIÊN sau mỗi lần seek

Đọc code `preview.tsx:4851–4862` (filter dọn `resumeWatches91S2`):
watch bị xóa ngay khi `|el.currentTime − ctAtCompletion| ≥ 1 frame` —
tức watch đóng the moment decoder resume lần đầu. Watch chỉ được arm
lại khi có seek xuôi hoàn tất mới (`forwardSeekCompletedThisTick`).
Hệ quả: **stall xảy ra sau khi element đã resume một lần (không có seek
mới) thì KHÔNG được giữ** — playhead chạy tiếp trong lúc element đóng
băng.

Bằng chứng bằng số đo (hook `__vcutPlayheadHold90R2` trong mẫu sampler):

- GOP 250 r1: stall 1 (1113 ms) giữ, `resumeTicks` tăng tới 6 rồi ĐÓNG
  BĂNG ở 6 sau khi resume (~2904 ms); stall 2 (486 ms, 5595→6081 ms)
  playhead 2,967→3,400 (**+0,433 s**, vượt ngưỡng drift 0,35 s) với
  `resumeTicks` vẫn 6, `resumeHolds` vẫn 1 — không có tick giữ nào mới.
- GOP 60 r1: tương tự — stall 1 (1620 ms) giữ, `resumeTicks` đóng băng
  ở 6; stall 2 (306 ms, 6097→6403 ms) playhead 2,800→3,167 (**+0,367 s**),
  không tick giữ mới.

Ngược lại, mọi stall sau một re-seek đều được giữ (stall 2/3 ở load4,
stall 2/3 ở GOP 30 r1) vì re-seek arm watch mới. Đây là **nợ mới cho
đợt sau** (không sửa trong luồng này — brief là đo bằng chứng): cân
nhắc arm lại watch mỗi khi element resume rồi lại đóng băng (stall lặp),
hoặc giữ-while-frozen không phụ thuộc watch một lần. Lưu ý: stall sau
đó thường ngắn (306–486 ms trong 2 lượt này) nhưng playhead vượt
+0,35 s trong cả 2 trường hợp — đủ tự kích drift re-seek.

## 6. Chuyện bên lề khi đo (đã xử lý trong probe/luồng)

1. **2 lượt GOP 30/60 đầu fail ngay do sai đường clips** — blanket
   replace `round92-t3` → `round93-u3` khi copy probe đã đổi cả
   `T3_CLIPS` (clip GOP 30/60 vẫn nằm ở `round92-t3/clips/`). Sửa đường
   trỏ lại `round92-t3/clips`, chạy lại 3 lượt (GOP 30 r1/r2, GOP 60 r1)
   thành công. Lỗi chỉ ở script đo, không đụng code production.
2. **Driver báo EXIT 0 sai cho lượt fail** — `$(date ...)` trong chuỗi
   `echo` ghi đè `$?` trước khi nó được expand. Lỗi ghi log, không ảnh
   hưởng kết quả (probe đã exit 2 đúng). Đã sửa driver (bắt `rc=$?`
   trước).
3. **Analyzer lagdecay: mean âm ở cửa sổ 20-mẫu-cuối** — `slice(-20)`
   lấn sang mẫu trước seekDone (khung t=5, lagEl ≈ −4,5) ở lượt mẫu ít.
   Đã sửa 2 lần: chỉ lấy mẫu sau seekDone, rồi chỉ lấy từ lúc canvas
   lần đầu rời khung t=5 (canvasChangeIdx) trở đi; giá trị max/từng mốc
   thời gian không bị ảnh hưởng. Số cuối trong LIMITS §2.1 là số sau
   lần sửa thứ hai (chạy lại toàn bộ 6 JSON).
4. **Probe rVFC v1 thiếu hỗ trợ Range** — server trả 200 cả thân file
   cho yêu cầu Range, WebKitGTK báo MEDIA_ERR_NETWORK (code 2) sau
   seek (vis) và ở ~3 s (hid). Đã thêm 206 Partial Content + Content-
   Range, chạy lại lần 2 sạch (0 lỗi, vis trình 81 frame) — kết luận
   rVFC 0 callback đứng vững trên cả 2 lần chạy.
5. **GOP 30 r2 không đo được** — seek tới 0,5 quá chậm dưới tải
   (loadavg 6,25 lúc bật tải; pause-seek t=5 trước đó đã 2092 ms),
   probe dừng sớm theo thiết kế ("playhead đóng băng ≥2,5 s trong lúc
   seeking", đúng hành vi giữ R2) khi seek chưa xong; chỉ 1 mẫu sau
   seekDone. Lượt này KHÔNG dùng làm bằng chứng stall/lag — chỉ ghi
   nhận R2 seeking-hold giữ đúng trong seek dài ~6 s. (So sánh: GOP 30
   r1 pause-seek tElement 5289 ms — seek tự nó đã chậm nhiều giây dưới
   tải.)
6. **Chạy vitest trực tiếp fail "No test suite found"** — các file
   test này chạy bằng Node type-stripping theo header của chúng, không
   phải vitest. Chạy đúng cách thì xanh (xem §8). Không phải hồi quy.

## 7. Giới hạn còn lại (trung thực)

1. **Trần 5000 ms mới được chứng minh tới 3904 ms.** Stall dài nhất
   bắt được là 3904 ms (GOP 30 r1); không có stall nào chạm 5000 ms
   nên hành vi nhả-ở-trần vẫn chỉ có unit test. Cần lượt tải nặng hơn
   hoặc nhiều lượt hơn để bắt stall ≥5000 ms — nhưng tải 4×yes đã gây
   chu kỳ re-seek (§2.3) làm nhiễu phép đo stall thuần.
2. **Trần chỉ bảo vệ stall đầu sau mỗi seek** (§5) — stall sau đó
   (306–486 ms đo được) làm playhead vượt +0,37–0,43 s, đủ tự kích
   drift re-seek. Nợ mới cho đợt sau.
3. **Chu kỳ resume-chậm → drift → re-seek dưới tải cực đoan** (§2.3)
   vẫn mở: load4 có 3 re-seek, GOP 30 r1 (3×yes) có 2 re-seek. Trần
   5000 ms không sửa được đường này vì drift xảy ra SAU khi stall hết.
4. **Lag trình chiếu sau stall lớn hơn T3 báo cáo** (tới 1,48 s ở
   3×yes, 1,83 s ở 4×yes, so với 0,65–0,85 s của T3) — một phần do tải
   lượt này nặng hơn (sibling đợt 93 + `yes`), một phần do dao động
   giữa các lượt lớn (stall 906–3904 ms ở cùng GOP 30 tùy tải). Số
   tuyệt đối chỉ so được theo bậc độ lớn, không so từng chữ số.
5. **rVFC WebKitGTK: kết luận "không bao giờ bắn" dựa trên 12 lượt
   app + 2 probe tối thiểu trên WebKitGTK 27.2 (Playwright
   webkit-2388) + GStreamer của VM này.** Chưa kiểm tra WebKitGTK bản
   khác / Safari thật / backend khác (WebM, MSE). Nguyên nhân tầng
   backend là suy luận từ bug 267324, chưa đo được từ ngoài.
6. **Độ phân giải sampler suy giảm dưới tải cực đoan:** setInterval
   100 ms chỉ bắn được ~1 mẫu/2 s ở lượt GOP 30 r2 (loadavg 6,25) và
   ~2 mẫu/s ở load4 (rAF gap max 1310 ms) — biên khoảng stall thô
   ±~500 ms ở các lượt đó; giá trị lag tại thời điểm mẫu vẫn chính
   xác. Stall 306 ms ở GOP 60 r1 nằm gần giới hạn phân giải này.
7. **Probe tự nó thêm tải** (sampler `getImageData` toàn canvas mỗi
   ~100–400 ms) — như T3 §5 mục 7; trước/sau dùng cùng sampler nên so
   sánh tương đối vẫn hợp lệ, số tuyệt đối hơi bi quan.
8. **Số đo chỉ cho 1 clip video, 720p, 6 s, 1 lần chạy mỗi tổ hợp**
   (trừ GOP 250 chạy 3 lần, GOP 30 chạy 2 lần) — chưa phải phân phối
   đầy đủ; kết luận "stall không phụ thuộc GOP" của T3 vẫn đứng (stall
   >1500 ms gặp ở cả GOP 30/60/250).

## 8. Kiểm chứng

- tsc web **0 lỗi** (chạy 00:04Z 12/11, cây cuối sau mọi sửa của luồng
  này — luồng này không sửa production).
- vite build **PASS** (32,71 s).
- `playheadHold90R2.test.ts` **31/31** (Node type-stripping).
- `seek.test.ts` **20/20**; `seekSkipRender86N3.test.ts` **9/9**;
  `previewLoop50F2.test.ts` **20/20**.
- O8 Chromium **21/21** (scratch `round93-u3/o8-chromium`,
  `o8-clicktest-report.json`).
- Không sửa production, không đụng TTS 39, không đụng `.github/workflows`.

## 9. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/probe93u3-stall-evidence.mjs` — probe đo stall/lag
  post-fix (copy probe92t3 + `--load4` + sửa đường clip GOP30/60).
- `apps/web/scripts/analyze93u3-lagdecay.mjs` — phân rã lag sau stall
  (mới).
- `apps/web/scripts/probe93u3-rvfc-webkit.mjs` — probe tối thiểu rVFC
  WebKitGTK vs Chromium (mới; server Range 206).
- `docs/PHASE9_ROUND93_U3_CANVAS_STALL_EVIDENCE_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round93-u3-canvas-stall`
(`~/workspace/repo-1-push/paths-loop/phase9-round93-u3-canvas-stall.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u3.md`.
Dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u3/probe-*/probe-results.json`
+ `analyze-*.txt` (T3 analyzer) + `rvfc-*/rvfc-results.json` + `o8-chromium/o8-clicktest-report.json`.
Clip GOP 30/60: fixture của T3 ở `round92-t3/clips/` (binary, KHÔNG stage).
