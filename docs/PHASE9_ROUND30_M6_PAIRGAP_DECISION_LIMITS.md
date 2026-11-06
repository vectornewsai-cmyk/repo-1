# Phase 9 đợt 30, luồng M6 — Quyết định kiến trúc gap cặp (A) clip ngắn + blur footage thật + thời gian dip thuần

> Đóng nợ đợt 29 LIMITS §3 mục 7–8: (7) gap cặp (A) clip ngắn tới ~248
> cần quyết định kiến trúc; blur browser mới đo trên vạch tổng hợp;
> (8) longtask 4K là cận trên, không phải thời gian hàm dip thuần.
> KHÔNG sửa logic render/preview, KHÔNG push, KHÔNG tag/release,
> KHÔNG binary vào repo. Chỉ đụng: script đo của mình, comment ghi chú
> trong `previewStatus.ts`, LIMITS này. Thang V6: KHỚP = MAD ≤ 2 VÀ
> ≥ 99% ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8; còn lại LỆCH.

## 0. Quyết định (đọc trước)

**GIỮ mô hình đơn clip + badge `matched` + giới hạn ghi rõ. KHÔNG đổi
model cặp trong đợt 30.** Quyết định này có căn cứ đo, không phải giữ
nguyên vì ngại sửa:

1. **M1 (cặp B+C theo cửa sổ ra, "sửa nửa") KHÔNG đạt bar** — LỆCH ở
   đầu vùng chồng mọi combo phẳng (10–93 MAD), và **làm tệ đi các ô
   đang KHỚP**: FW/FW localT=0,6: 2,00→46,00; FB/FB: 1,00→10,33
   (§3). Một "bản sửa" làm hồi quy ô KHỚP thành LỆCH thì không được
   triển khai, dù nó cải thiện các ô tệ nhất (248→2,3 ở cuối vùng).
2. **M2 (đủ 3 clip A/B/C) gần đạt nhưng vẫn chưa đạt KHỚP toàn bộ**
   — 20/21 ô KHỚP/XẤP XỈ, còn 1 ô LỆCH (FW/FG phẳng localT=0,75:
   5,00, le8 66,7%) do **dư số hiệu chuẩn trọng số dip xám**, không
   phải do thiếu clip (§3). Đổi kiến trúc xong vẫn còn ô LỆCH, trong
   khi phần còn lại đó sửa được bằng hiệu chuẩn (rẻ hơn, không đụng
   vòng frame).
3. **Chi phí M2 lớn, lợi ích bị chặn bởi (2)** — viết lại vòng frame
   (ghép cặp/3 clip, nén draw riêng lẻ, tương tác track stacking +
   geometric types chưa có mô hình cặp), 3 offscreen + 2 pass
   ImageData/frame trong vùng chồng, trong khi vòng dip đơn hiện tại
   đã tốn 250–308 ms/frame ở 1080p và ~1,0–1,2 s/frame ở 4K trên
   browser thật (§2) — M1 ≈ 2×, M2 ≈ 2×+ vòng đó nếu giữ nguyên cách
   viết vòng lặp hiện tại.
4. **Vùng ảnh hưởng hẹp** — gap chỉ xuất hiện khi clip ngắn hơn tổng
   2 duration transition, và tệ nhất chỉ ở nửa sau vùng chồng (nơi
   alpha tích = 0); các ô đầu vùng chồng của combo cùng hướng đã
   KHỚP (FW/FW 2,00; FB/FB 1,00 ở localT=0,6).

**Điều kiện kích hoạt việc đổi model sau** (cả 4 phải đủ, theo thứ tự):

- (a) **Hiệu chuẩn lại trọng số dip trước** — dip.a/dip.b + định nghĩa
  gray-mid sao cho mô hình cặp đơn (không ngắn) đạt KHỚP ở mọi p đã
  đo, đặc biệt FW/FG localT=0,75 (hiện M2 còn 5,00). Đây là nút chặn
  thật của M2, rẻ hơn và làm trước được, không cần đụng vòng frame.
- (b) **Harness before/after** — bộ clip ngắn (5 combo phẳng × 3
  localT + 2 combo footage × 3 localT, cùng chuỗi xfade kép tham
  chiếu) + wiring (B) giữ 0,0000 + click-test browser + các suite
  hiện có xanh; bar: model mới đạt KHỚP ở mọi ô (trừ ô đã ghi rõ là
  giới hạn hiệu chuẩn) **và không ô nào tệ đi so với current**.
- (c) **Ngân sách perf** — composite cặp/3 clip trong vùng chồng
  không vượt quá ~1,5× chi phí dip đơn trên cùng máy đo. Với cách
  viết vòng lặp hiện tại thì M1/M2 đều vượt ngân sách này (§2), nên
  điều kiện này kéo theo việc tối ưu vòng lặp trước (biến thể inline
  đo ở Node nhanh hơn 2,8–4,3× và pixel-identical MAD 0,0000 — nhưng
  inline trên browser CHƯA đo, phải đo trước khi claim).
- (d) **Phạm vi họ fade trước** — geometric types (wipe/slide/circle…)
  cần mô hình cặp riêng, chưa có; nếu đổi model mà chỉ họ fade thì
  phải ghi rõ geometric vẫn giữ gap cũ, không claim chung.

**Workaround cho user tới lúc đó** (không phải code, chỉ là cách dùng
tránh gap): đừng đặt tổng 2 duration transition vượt quá duration
clip — đó chính là điều kiện kích hoạt gap. Clip thường (chỉ 1 cửa sổ
active tại 1 thời điểm) không dính gap này.

**Badge:** giữ `matched` cho fadewhite/fadegrays/fadeblack; đã bổ sung
đoạn M6 vào ghi chú (iii) trong `previewStatus.ts` (chỉ comment,
không đổi logic, không đổi tập matched).

## 1. Blur trên footage thật phức tạp (browser thật, Chromium headed)

Hạ tầng trích từ script L6 đợt 29 (pipe CDP, Xvfb, snapshot dist,
click ruler thật, seed autosave). Display :95 / port 4195 (run 1) và
:96 / 4196 (rerun); bundle `index-C0HfodWe.js`
sha256[:16]=`fda3c753e1dccec1`; canvas preview thực 1352×633,
scale 0,3297; 0 exception; exit 0. Mỗi clip mang motionBlur frames 3
weights [1,1,1] + transitionIn fadewhite 1s, đo ở p=0,5
(alpha=0,3466), scrub từng bước để tích lũy snapshot trailing như L6.
Kỳ vọng = trung bình 3 frame control rồi dip trắng. Gating=false
(INFO) như L6.

Footage thật: footage K đợt 28 (1080×1920, 23,976 fps), cắt 6s tại 2
cửa sổ motion đã quét trước bằng scan gray 270×480 @12fps trên 30s
đầu (script quét chỉ ở scratch, không stage):
- 19,0s: mean|diff| 46,93 (19,0s) / 43,62 (19,5s) — mạnh nhất.
- 11,0s: 26,47 / 21,35 / 28,48 (11,0/11,5/12,0s) — mạnh thứ hai.
Tổng hợp phức tạp: FFmpeg `testsrc2` 1080×1920 30fps 6s (chi tiết +
chuyển động xác định, không phải vạch đơn).

| Case (run 1 = rerun, lặp lại từng chữ số) | MAD | ≤8 | maxDiff | Kết luận |
|---|---|---|---|---|
| BLUR-REAL-K19-FW-IN-p05 | 0,624 | 100,00% | 6,7 | KHỚP |
| BLUR-REAL-K11-FW-IN-p05 | 0,487 | 100,00% | 5,3 | KHỚP |
| BLUR-SYNTH-FW-IN-p05 | 1,471 | 93,52% | 88 | XẤP XỈ |

Chẩn đoán từ rerun (run 1 thiếu các trường này do lỗi harness của
chính luồng này — `runCase` không chép trường mới vào record; đã vá
và chạy lại, xem §5):

- Control seek **chính xác từng frame**: ctlTimes = [0,5; 0,4667;
  0,4333] đúng yêu cầu ở cả 3 case — dư số synth KHÔNG phải do
  control seek lệch.
- K19 có motionMean 18,16 (motion mạnh) mà vẫn 100% ≤8; K11
  motionMean 8,47, 100% ≤8. **Ngữ nghĩa blur (trailing-avg + dip) đúng
  trên footage thật, kể cả khi motion mạnh.**
- Synth: motionMean chỉ 1,96 nhưng 6,48% mẫu >8; tách theo motion:
  le8LowMotion = 96,84% (14.811 mẫu motion ≤ 8), còn mẫu motion > 8
  chỉ ~50,7% ≤8 (583/1.149). Tức lệch **tập trung ở nội dung chuyển
  động nhanh + viền cứng** của testsrc2 (pha resample/viền khi map
  project→device, cùng họ với 0,83% pixel biên vạch của L6 nhưng dày
  hơn vì testsrc2 có mật độ viền cao hơn vạch đơn rất nhiều), không
  phải sai ngữ nghĩa blur: appMean ≈ expMean trong ~1 mức ở cả 3
  case. 3,16% mẫu low-motion >8 của synth chưa phân tích tới từng
  pixel (nghiêng về pha resample viền cứng, chưa chứng minh) — ghi
  nhận là nợ nhỏ, không theo đuổi thêm vì use case thật (footage)
  đã sạch.
- Phạm vi: chỉ đo p=0,5, FW-IN, weights [1,1,1] frames 3 — các p/mode/
  weights khác chưa đo; vẫn là Chromium VM, chưa Safari/máy thật.

Kết luận blur: nợ "chưa phải footage thật phức tạp" của đợt 29 đã
đóng cho footage thật (KHỚP cả 2 cửa sổ). Synth XẤP XỈ không đổi
kết luận này và không đổi badge motion-blur (đã là ≈).

## 2. Thời gian hàm dip thuần (tách khỏi seek/decode/rAF)

### 2.1 Node (hàm sản phẩm thật qua tsc, như script L6)

Vòng lặp sao đúng hình dạng `drawVideoClipWithDip` (preview.tsx):
duyệt từng pixel, bỏ qua alpha=0 (buffer fill 10% alpha=0), gọi
CHÍNH `singleClipDipPixel`, alpha=0,5. 3 warmup + 21 rep, báo median
[range]. VM đang chạy nhiều luồng đợt 30 song song nên số có nhiễu
(đặc biệt mode gray: 1080p range 186–802 ms, mean 443 vs median 381
— nhiễu GC do cấp phát 1 mảng/pixel, cũng là chi phí thật của app).

| Kích thước | white median [range] | gray median [range] | inline chẩn đoán (white / gray) |
|---|---|---|---|
| 720p (921.600 px) | 57,6 [55,7..81,2] | 87,1 [82,5..206,6] | 26,8 / 38,8 |
| 1080p (2.073.600 px) | 149,8 [144,8..236,4] | 381,0 [186,6..801,9] | 54,2 / 88,0 |
| 4K (8.294.400 px) | 684,5 [588,0..966,9] | 864,8 [758,1..1109,4] | 239,2 / 378,1 |

Inline = cùng công thức, không gọi hàm, không cấp phát mảng/pixel:
nhanh hơn product 2,8–4,3× (1080p white 54 vs 150 ms; gray 88 vs
381 ms), và **pixel-identical với product (MAD 0,0000)** ở mọi ô.
Đây chỉ là chẩn đoán headroom, KHÔNG phải đề xuất đổi code trong
luồng này, và inline trên browser CHƯA đo.

### 2.2 Browser thật (page context, hàm trích verbatim qua tsc)

Canvas riêng ở đúng kích thước project, fill pattern xác định, tách
3 pha: getImageData / vòng lặp / putImageData. Median các rep
(1080p 5 rep, 4K 3 rep), 2 lần chạy (run 1 / rerun) khớp nhau trong
~5–8%:

| Kích thước / mode | get (run1 / rerun) | **vòng lặp** (run1 / rerun) | put (run1 / rerun) |
|---|---|---|---|
| 1080p white | 16,1 / 15,9 | **250,3 / 254,6** | 2,2 / 2,1 |
| 1080p gray | 16,9 / 19,7 | **297,6 / 307,8** | 2,2 / 2,1 |
| 4K white | 71,8 / 70,2 | **961,4 / 1004,1** | 8,1 / 8,3 |
| 4K gray | 72,5 / 64,3 | **1143,3 / 1238,9** | 8,5 / 8,4 |

Đơn vị ms. Vòng lặp chiếm ~93% tổng (get+loop+put) ở mọi ô.

### 2.3 Đối chiếu với longtask cận trên đợt 29

| | Longtask đợt 29 (gồm seek/decode/rAF) | Vòng dip thuần M6 (browser) | Đọc đúng |
|---|---|---|---|
| 1080p | dip 260–450 ms vs thường 0–95 ms | 250–308 ms | Vòng lặp chiếm phần lớn longtask; phần còn lại (seek/decode/rAF/draw) chỉ ~0–200 ms. |
| 4K | dip 712–1176 ms vs thường ~100 ms | 961–1239 ms | Vòng lặp **một mình đã đạt/vượt** khoảng longtask — seek/decode KHÔNG phải phần chính. Giả thuyết cũ ("longtask chủ yếu là seek/decode") bị bác: bottleneck là vòng lặp ImageData từng pixel với 1 cấp phát mảng/pixel. |

Lưu ý so sánh: longtask đo ở phiên L6, vòng thuần đo ở phiên M6
(cùng loại Chromium headed VM nhưng khác phiên, VM tải nhiều luồng
đợt 30) nên chỉ so khoảng, không so từng ms. Node chậm hơn hay nhanh
hơn browser tùy mode (1080p white: Node 150 vs browser ~250 ms;
4K white: Node 684 vs browser ~960–1004 ms) — cùng bậc độ lớn, đủ
kết luận về bottleneck, không đủ để xếp hạng engine.

Hệ quả cho quyết định §0: **bất kỳ model cặp nào cũng phải đi kèm
đường composite nhanh hơn** (inline typed-array đã đo ở Node, hoặc
GPU/canvas composite) — nếu giữ nguyên cách viết vòng lặp, M1 ≈ 2×
và M2 ≈ 2×+ chi phí dip đơn, tức ~0,5–0,6 s/frame ở 1080p và
~2 s/frame ở 4K trong vùng chồng, không thể coi là "chỉ thêm một
pass rẻ".

## 3. Mô hình cặp ứng cử: M1 vs M2 (offline, code sản phẩm thật)

Chuỗi render tham chiếu = xfade kép FFmpeg 8.1.2 đường rgb
(format=rgb24, như L6 --short): A 4s → B 1,5s → C 4s, mỗi xfade 1s,
offset 3 / 3,5; frame tại B localT = 3+localT. Các mô hình đều dùng
CHÍNH code sản phẩm (`transitionClipVisual`, `singleClipDipPixel`,
`describeTransition`, `compositeFadePixel`):

- **current** = mô hình đơn clip hiện tại (alpha tích, dip theo cửa
  sổ vào — shortModel của L6). Tái tạo đúng số (A) của L6 trên phẳng
  (FW/FW 2,00/6,67/17,67; FB/FW 139,33/248,33/237,33) và footage
  FW/FW (1,56/8,62/23,88) — chứng tỏ cách dựng M1/M2 so sánh đúng
  cùng một tham chiếu.
- **M1** = composite cặp B+C theo cửa sổ RA (xfade thứ hai), coi phía
  A của xfade2 ≈ B (bỏ qua xfade thứ nhất).
- **M2** = composite đủ 3 clip: xfade1(A,B) rồi xfade2(kết quả,C).

### 3.1 Phẳng 320×180 (A=red, B=green, C=magenta)

| Combo | localT | current | M1 | M2 |
|---|---|---|---|---|
| FW/FW | 0,6 / 0,75 / 0,9 | 2,00 KHỚP / 6,67 LỆCH / 17,67 LỆCH | 46,00 LỆCH / 2,33 XẤP XỈ / 1,00 KHỚP | 2,00 KHỚP / 2,33 XẤP XỈ / 1,00 KHỚP |
| FG/FW | 0,6 / 0,75 / 0,9 | 123,00 / 206,33 / 195,33 LỆCH | 15,33 LỆCH / 2,33 XẤP XỈ / 1,00 KHỚP | 2,00 KHỚP / 2,33 XẤP XỈ / 1,00 KHỚP |
| FW/FG | 0,6 / 0,75 / 0,9 | 59,00 / 143,00 / 150,00 LỆCH | 93,33 / 38,00 / 12,33 LỆCH | 2,33 XẤP XỈ / **5,00 LỆCH** / 0,33 KHỚP |
| FB/FB | 0,6 / 0,75 / 0,9 | 1,00 KHỚP / 11,33 LỆCH / 33,33 LỆCH | 10,33 LỆCH / 3,33 XẤP XỈ / 1,33 KHỚP | 1,00 KHỚP / 3,33 XẤP XỈ / 1,33 KHỚP |
| FB/FW | 0,6 / 0,75 / 0,9 | 139,33 / 248,33 / 237,33 LỆCH | 10,33 LỆCH / 2,33 XẤP XỈ / 1,00 KHỚP | 0,67 KHỚP / 2,33 XẤP XỈ / 1,00 KHỚP |

### 3.2 Footage K→L→J ở 360×640 (2 combo: tốt nhất + tệ nhất của L6)

| Combo | localT | current | M1 | M2 |
|---|---|---|---|---|
| FW/FW | 0,6 / 0,75 / 0,9 | 1,56 KHỚP / 8,62 LỆCH / 23,88 LỆCH | 28,08 LỆCH / 2,83 XẤP XỈ / 0,25 KHỚP | 1,54 KHỚP / 2,83 XẤP XỈ / 0,25 KHỚP |
| FB/FW | 0,6 / 0,75 / 0,9 | 139,34 / 246,38 / 231,12 LỆCH | 28,59 LỆCH / 2,83 XẤP XỈ / 0,25 KHỚP | 1,16 KHỚP / 2,83 XẤP XỈ / 0,25 KHỚP |

### 3.3 Cơ chế (đã giải thích bằng số, không đoán)

- **Vì sao M1 tệ ở đầu vùng chồng (localT=0,6, p2=0,1):** ở đó xfade
  thứ nhất mới đi được nửa đường (bAlpha(p1=0,6)≈0,5 + dip trắng),
  nên phía A của xfade2 còn xa mới ≈ B. M1 bỏ qua phần này nên lệch
  tới 46 (FW/FW) / 93 (FW/FG) — tức M1 đổi lỗi cuối vùng lấy lỗi đầu
  vùng, không phải sửa.
- **Vì sao M1 == M2 ở localT ≥ 0,75 (white/black):** từ p2 ≈ 0,196,
  aAlpha(p2) = 0 nên phía A của xfade2 bị triệt tiêu hoàn toàn (trừ
  số hạng dip gray-mid phụ thuộc pixel phía A — đó là lý do duy nhất
  FW/FG 0,75 còn phân biệt M1 (38,00) với M2 (5,00)). Ở cuối vùng,
  M1 "đúng một cách tình cờ" vì phía A đã tắt, không phải vì M1 đúng
  mô hình.
- **Vì sao M2 còn dư số 2,00–2,33 ở nhiều ô và 5,00 ở FW/FG 0,75:**
  trọng số dip (dip.a/dip.b) hiệu chuẩn của product là xấp xỉ so với
  đường cong thật của xfade FFmpeg, và gray-mid (mean RGB của
  canvas) khác đường gray của xfade — cùng họ dư số đã thấy ở đợt
  25 I4 (cặp đơn 0,25–1,55). M2 kế thừa đúng dư số này; nó không biến
  mất khi thêm clip thứ ba. Đây là lý do điều kiện (a) phải làm
  trước: hiệu chuẩn dip là nút chặn, không phải số lượng clip.

## 4. Chi phí đổi model (ước lượng có căn cứ, không phải cảm tính)

Để triển khai M2 thật trong preview, vòng frame phải đổi ở các chỗ:

1. Phát hiện vùng chồng kép (clip có cả 2 cửa sổ active) và nén các
   draw riêng lẻ của A/B/C trong vùng đó thành 1 draw composite.
2. Vẽ mỗi clip tham gia lên offscreen riêng (giữ nguyên mask/SR/
   track/effect từng clip) rồi composite từng pixel 2 lần (xfade1,
   xfade2) — tức 3 draw + 2 pass ImageData/frame, so với hiện tại là
   1 draw + 1 pass.
3. Tương tác với track stacking (clip track khác dưới/trên trong cùng
   frame), với nhánh dip hiện tại (dip trắng/xám đã có pass riêng),
   và với geometric types (mô hình cặp cho wipe/slide/circle… chưa
   tồn tại — compositeFadePixel chỉ phủ họ fade).
4. Perf theo §2: giữ nguyên cách viết vòng lặp thì M2 ≈ 0,5–0,6 s/frame
   ở 1080p và ~2 s/frame ở 4K trong vùng chồng (vốn đã ≤ 1s/clip
   ngắn) — chấp nhận được cho scrub từng frame nhưng không cho phát
   realtime; và vẫn còn ô LỆCH do (a) chưa làm.

So sánh các phương án:

| Phương án | Kết quả đo | Chi phí | Kết luận |
|---|---|---|---|
| Giữ đơn clip + badge + giới hạn (chọn) | Gap (A) tới ~248, chỉ khi clip < tổng 2 duration | 0 | Đủ cho đợt này; gap đã ghi rõ, có workaround |
| M1 (cặp B+C) | LỆCH đầu vùng mọi combo; hồi quy ô KHỚP | 1 draw + 1 pass thêm; vẫn phải sửa vòng frame | **Bác** — không đạt bar không-hồi-quy |
| M2 (đủ 3 clip) | 20/21 KHỚP/XẤP XỈ, 1 ô LỆCH do hiệu chuẩn | Vòng frame mới + 3 draw + 2 pass; cần (a)+(c) trước | **Hoãn** tới khi đủ 4 điều kiện §0 |
| Cảnh báo UI khi inDur+outDur > duration | Không đổi gap, chỉ giúp user tránh | Nhỏ (UX, cần user quyết) | Đề xuất follow-up, KHÔNG làm trong luồng này |

## 5. Lỗi harness của luồng này (trung thực)

Run browser 1 (`v30-m6-blur-browser.json`) thiếu các trường chẩn đoán
ctlTimes/motionMean/le8LowMotion/nLowMotion vì `runCase` (copy từ L6)
xây record bằng danh sách trường cố định và tôi không thêm trường
mới vào đó khi mở rộng `pageMeasureBlur`. Đã vá (thêm 4 trường vào
record) và chạy lại toàn bộ phiên với display/port khác, ghi file
riêng `v30-m6-blur-browser-rerun.json`: verdict blur lặp lại chính
xác từng chữ số (0,624 / 0,487 / 1,471), vòng thuần lặp lại trong
~5–8%. Số chẩn đoán ở §1 lấy từ rerun; số verdict lấy cả 2 run (đồng
nhất). File run 1 giữ nguyên, không ghi đè.

## 6. Chưa đo / nợ còn lại (không mạo nhận)

- Inline vòng lặp trên browser CHƯA đo (chỉ Node) — phải đo trước
  khi dùng làm căn cứ cho điều kiện perf (c).
- Hiệu chuẩn lại trọng số dip (điều kiện (a)) chưa làm — là follow-up
  rẻ nhất và có giá trị độc lập với đổi model (cải thiện cả mô hình
  cặp đơn).
- Blur: chỉ p=0,5, FW-IN, weights [1,1,1]; các p/mode/weights khác,
  Safari/máy thật/dpr > 1 chưa đo (nợ đứng).
- 3,16% mẫu low-motion >8 của synth chưa phân tích tới từng pixel
  (nghiêng về pha resample viền cứng).
- Longtask vs vòng thuần so khoảng khác phiên (cùng loại VM, khác
  thời điểm/tải) — không claim tỉ lệ chính xác từng ms.
- Cảnh báo UI cho clip ngắn (điều kiện kích hoạt gap) là đề xuất,
  chưa triển khai, cần user quyết vì đụng UX.

## 7. Kiểm chứng và file đổi/thêm

- `node --check` cả 2 script đo mới: pass.
- Node pure: 21 rep/size/mode, product-vs-inline MAD 0,0000 mọi ô.
- Node pairgap: current tái tạo đúng số (A) L6 (phẳng + footage) —
  kiểm chứng nội bộ cách dựng M1/M2.
- Browser: 2 phiên đầy đủ, 0 exception, exit 0, bundle giống nhau
  (sha `fda3c753e1dccec1`); blur verdict lặp lại chính xác.
- `previewStatus.ts`: chỉ thêm comment (đoạn M6 vào ghi chú (iii)),
  không đổi logic/verdict — comment không thể làm hỏng tsc nên không
  chạy lại tsc riêng cho sửa này (parent kiểm chứng gộp sẽ chạy).
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (video + snapshot + script quét
  motion chỉ ở `~/workspace/tmp-round30-m6/` ngoài repo; trong repo
  không còn file .raw nào). KHÔNG sửa logic preview/render hay file
  của luồng khác. KHÔNG tự ghi file paths-loop, KHÔNG ghi
  build-loop-log (parent lo).

File đổi/thêm (text, không binary — parent gộp batch):

- Mới: `apps/web/scripts/clicktest-dip-blur-complex-round30-m6.mjs` —
  click-test browser blur footage thật + vòng dip thuần trong page
  (hạ tầng trích từ script L6 đợt 29, phần đo viết mới).
- Mới: `server/render/src/measure_r30_m6_dip_pure_pairgap.js` — đo
  vòng dip thuần Node + mô hình cặp M1/M2 (chế độ --pure / --pairgap).
- Mới: `docs/PHASE9_ROUND30_M6_PAIRGAP_DECISION_LIMITS.md` — file này.
- Mới: `benchmarks/results/v30-m6-dip-pure.json` — vòng thuần Node.
- Mới: `benchmarks/results/v30-m6-pairgap.json` — M1/M2 vs chuỗi
  xfade kép (phẳng 15 ô + footage 6 ô).
- Mới: `benchmarks/results/v30-m6-blur-browser.json` — browser run 1
  (blur + vòng thuần; thiếu 4 trường chẩn đoán, xem §5).
- Mới: `benchmarks/results/v30-m6-blur-browser-rerun.json` — browser
  rerun (đủ trường chẩn đoán; verdict lặp lại chính xác).
- Sửa: `apps/web/src/components/transitions/previewStatus.ts` — chỉ
  thêm đoạn M6 vào comment ghi chú (iii), không đổi logic.
