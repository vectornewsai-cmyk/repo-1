# Phase 9 đợt 32, luồng O5 — Phát ngược 30 fps: đo lặp + spike WebCodecs + spec hook gap rAF — LIMITS

Ngày: 01/11/2026 (giờ +07; log harness ghi UTC 01:11–01:33).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo.
Luồng này KHÔNG sửa code sản phẩm. Đặc biệt KHÔNG sửa `preview.tsx`
(luồng O3 đang sửa phần seek ở đó): mọi đo đạc làm ở harness/script/
test, mọi thay đổi trong repo chỉ là script probe mới + LIMITS này +
JSON kết quả. Luồng này KHÔNG tự ghi paths-loop hay build-loop-log
(parent gộp). Đọc trước khi làm: `docs/PHASE9_ROUND31_LIMITS.md` §3.7
và `docs/PHASE9_ROUND31_N2_REVERSE_FPS_LIMITS.md` toàn bộ.

## 0. Kết luận ngắn (không vượt số đo)

1. **Đo lặp fps ngược: GOP thưa 3.83–5.86 (trung vị 4.55), GOP dày
   9.10–11.92 (trung vị 10.70) — CẢ 6 lượt đều DƯỚI khoảng đợt 31,
   khoảng một nửa.** Đợt 31 N2 lúc rảnh: thưa 8.97 (1 lượt), dày
   18.42–24.05 (2 lượt). Tỉ lệ trung vị/đợt 31 ≈ 0.51× (thưa) và
   ≈ 0.50× (dày). Đây là tín hiệu hồi quy có hệ thống ở mức
   bundle, KHÔNG phải phương sai lượt-lượt (phương sai trong đợt
   này chỉ ±~25%, không giải thích được mức lệch 2× và cùng chiều
   ở cả 6 lượt). Nhưng NGUYÊN NHÂN chưa quy kết được: bundle đo
   đợt này (`index-D3yYXWHm.js`) KHÁC bundle đợt 31
   (`index-C0HfodWe.js`) — tức so sánh là bundle-với-bundle, và
   O3 đang sửa seek trong đợt 32. Cần diff bundle + đo lại sau khi
   O3 chốt mới được kết luận "code nào gây hồi quy". Xem §1.
2. **WebCodecs ĐỦ SỨC cho phát ngược 30 fps (kết luận spike, chưa
   phải sản phẩm).** Trên fixture phẳng, decode phần mềm đạt
   235.8–277.4 fps (7.9–9.2× realtime), present ngược từ cache qua
   canvas 2D đạt 74.9–83.6 fps — đều vượt xa 30 fps. Chi phí decode
   1 GOP (thưa 1.08 s / dày 0.13 s) nhỏ hơn nhiều so với thời lượng
   phát ngược của GOP đó (10 s / 1 s) nên decode-ahead giấu được
   hoàn toàn chi phí qua biên GOP. Điều còn thiếu để thành sản phẩm
   là demux MP4 trong browser + cache cửa sổ trượt + đo lại trên
   footage nhiễu/thật — spike này chưa xây cái nào trong đó. Xem §2.
3. **Seek GOP thưa vẫn là bottleneck của đường phát ngược HIỆN TẠI
   (element seek), nhưng KHÔNG còn là bottleneck của thiết kế
   WebCodecs.** Bằng chứng: holdDelta ngược đợt này 487–591 (thưa)
   và 328–396 (dày) — seek từng frame vẫn đắt; trong khi decode
   1 GOP thưa bằng WebCodecs chỉ 1.08 s một lần rồi phát ngược từ
   cache ở 83.6 fps.
4. **Spec hook gap rAF riêng vòng preview đã viết xong (§3), CHƯA
   áp dụng vào sản phẩm.** Hook chèn ở đầu `loop` (ngay trước dòng
   clamp `dt`), cộng cờ `justWoke` từ `wake()`, ghi ring buffer
   tối đa 5000 mẫu vào `window.__vcutPreviewRaf` theo mẫu sẵn có
   của `__vcutPreviewIdle`. Nó sửa đúng 2 giới hạn của probe N2:
   đo đúng 1 vòng lặp (không lẫn rAF khác) và gap/lost là số thật
   của vòng lặp (không còn là cận dưới). O3 hoặc đợt sau implement
   theo §3 mà không xung đột vùng seek.
5. **Latency decode 1 chunk đơn CHƯA đo được** (thí nghiệm chunk
   đơn kẹt 20 s không output — xem §2.4): decoder có vẻ giữ frame
   đơn lẻ tới khi có thêm dữ liệu/flush, nên số latency đơn cần
   thí nghiệm flush-rồi-đếm-output riêng. Số "latency" P50/P95
   trong §2 là latency queue→output khi pipeline đã xếp hàng,
   KHÔNG phải latency 1 frame — đừng trích sai.

## 1. Đo lặp fps ngược (6 lượt, harness N2 nguyên vẹn)

### 1.1 Phương pháp

- Harness y nguyên đợt 31 N2:
  `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
  (không sửa 1 dòng). Mỗi lượt snapshot dist riêng, profile Chrome
  riêng, display `:99` / port `4199` (tránh luồng khác).
- Fixture y nguyên đợt 28/31: `~/workspace/tmp-round27-k4/`
  `sparse-gop-flat.mp4` (GOP 300) và `dense-gop-flat.mp4` (GOP 30);
  cả hai 1280×720, 30 s, 30 fps, H.264 High@L3.1 (`avc1.64001F`).
- Bundle đo: `index-D3yYXWHm.js`, sha256[:16] =
  `7450c68feb9e4ac4` — GIỐNG NHAU ở cả 6 lượt (snapshot mỗi lượt
  đều khớp sha này, và dist trên đĩa vẫn bundle này sau lượt cuối),
  nên so sánh TRONG đợt này là sạch. Bundle này KHÁC bundle đợt 31
  (`index-C0HfodWe.js`) — xem cảnh báo ở §0.1 và §1.3.
- Thứ tự xen kẽ thưa/dày để tránh lệch theo thời gian. 6/6 lượt
  verdict PASS (phát ngược đúng + hold kích hoạt + không mẫu đen).

### 1.2 Bảng số

| Lượt | GOP | fps ngược (draw/wall) | drawDelta | holdDelta | Tốc độ xuôi nội suy | Load 1' trước ngược |
|---|---|---|---|---|---|---|
| sparse-1 | thưa | **5.86** (81/13.82 s) | 81 | 591 | 0.993 | 2.65 |
| sparse-2 | thưa | **4.55** (63/13.83 s) | 63 | 521 | 1.011 | 2.88 |
| sparse-3 | thưa | **3.83** (54/14.09 s) | 54 | 487 | 0.929 | 2.19 |
| dense-1 | dày | **9.10** (131/14.40 s) | 131 | 328 | 1.010 | 1.75 |
| dense-2 | dày | **11.92** (168/14.09 s) | 168 | 396 | 1.018 | 2.39 |
| dense-3 | dày | **10.70** (151/14.11 s) | 151 | 373 | 0.770 | 1.41 |

Tổng hợp (báo khoảng + trung vị, theo đúng yêu cầu đợt này):

| GOP | Đợt 32 O5 (3 lượt) | Đợt 31 N2 lúc rảnh | Tỉ lệ trung vị |
|---|---|---|---|
| Thưa (GOP 300) | **3.83–5.86, trung vị 4.55**, trung bình 4.75 | 8.97 (1 lượt) | 0.51× |
| Dày (GOP 30) | **9.10–11.92, trung vị 10.70**, trung bình 10.57 | 18.42–24.05 (2 lượt) | 0.50× |

Cả 6 lượt đều PASS chi tiết: playhead ngược ~29.6 → ~15.7, gray
đơn điệu, `blackRev = 0`, badge ngược/giữ đều thấy (xem JSON từng
lượt trong `benchmarks/results/v32-o5-reverse-*.json`).

### 1.3 Kết luận hồi quy — và giới hạn của kết luận đó

- **Có tín hiệu hồi quy mạnh ở mức bundle.** 6/6 lượt dưới khoảng
  đợt 31, cùng chiều ở cả 2 loại GOP, tỉ lệ ~0.5× ở cả hai — mẫu
  này không phù hợp với "phương sai lượt-lượt" (phương sai trong
  đợt này: thưa ±~22% quanh trung vị, dày ±~13%; đợt 31 dày ±~25%).
- **Không quy kết nguyên nhân cho code cụ thể.** Các khả năng còn
  mở, theo thứ tự cần kiểm tra: (a) bundle đợt 32 khác đợt 31
  (thay đổi seek/preview/render trong đợt 32, gồm cả phần O3 đang
  sửa dở — dist có thể được build từ cây đang sửa); (b) môi trường
  đo khác (load 1' trước ngược đợt này 1.41–2.88, cao hơn đợt 31
  lúc rảnh 0.54–1.83 — nhưng tốc độ xuôi 4/6 lượt vẫn 0.993–1.018,
  khỏe như đợt 31, nên tải không giải thích được mức rơi 2× ở
  chiều ngược; chỉ 2 lượt cuối xuôi tụt 0.929/0.770, gợi ý contention
  từ luồng song song tăng dần cuối cửa sổ đo); (c) trạng thái ấm
  Chrome khác. Việc cần làm: diff bundle D3yYXWHm với C0HfodWe ở
  đường seek/reverse, rồi đo lại 3+3 lượt trên bundle sạch sau khi
  O3 chốt. Cho tới lúc đó, KHÔNG dùng số đợt này làm baseline mới,
  cũng KHÔNG claim "đợt 32 làm chậm phát ngược" — chỉ claim "bundle
  đo đợt này chậm hơn khoảng đợt 31 một nửa, nguyên nhân chưa rõ".
- **30 fps ngược vẫn xa:** ngay cả số đợt 31 (8.97 / ~21) cũng dưới
  30; số đợt này (4.55 / 10.70) càng xa hơn. Đường element-seek
  hiện tại không có cửa đạt 30 fps — xem §2.

## 2. Spike WebCodecs (tầng harness, không sửa app)

### 2.1 Phương pháp và giới hạn trung thực

- Script mới: `apps/web/scripts/probe-round32-o5-webcodecs-pipe.mjs`
  (pipe CDP + Xvfb, display `:96` / port `4196`, Chrome
  156.0.8078.4 — cùng binary với harness N2). `node --check` pass.
- Dữ liệu KHÔNG qua demux MP4 trong browser: fixture MP4 được
  ffmpeg chuyển offline thành Annex B
  (`-c copy -bsf:v h264_mp4toannexb`, file ở scratch
  `~/workspace/tmp-round32-o5/wc/`, KHÔNG vào repo); script chỉ
  parse NAL trong trang, nhóm frame theo `first_mb_in_slice == 0`,
  đóng gói AVCC (length-prefix) + `description` = bản ghi avcC tự
  dựng từ SPS/PPS thật (`67 64 00 1f…` / `68 eb c3 cb 22 c0`).
  Demux MP4 thật (đọc moov/avcC/sample table) vẫn CHƯA xây, CHƯA
  đo — là bước tiếp theo bắt buộc (§2.5).
- Fixture phẳng như §1.1 nên decode rẻ hơn footage nhiễu/thật:
  mọi fps decode dưới đây là CẬN TRÊN cho footage thật.
- Present ngược đo bằng `ctx.drawImage(frame)` lên canvas 2D
  (readback phần mềm) — chậm hơn đường compositor của player thật,
  nên fps present đo được là CẬN DƯỚI cho present từ cache.
- VideoDecoder không tiết lộ có dùng hardware accel thật không.

### 2.2 isConfigSupported (codec của footage test)

| Codec | prefer-hardware | prefer-software |
|---|---|---|
| avc1.64001F (High@L3.1 — đúng SPS fixture) | **false** | **true** |
| avc1.64001f | false | true |
| avc1.4D401F (Main) | false | true |
| avc1.42001F (Baseline) | false | true |

Trên VM này (Xvfb, không GPU) hardware decode không được hỗ trợ —
mọi số decode dưới đây là DECODE PHẦN MỀM. Máy user có GPU có thể
khác (cần kiểm tra riêng); số phần mềm là trường hợp xấu vẫn đủ
nhanh (xem §2.3). Lưu ý: `configure()` với `prefer-hardware` khi
hardware không hỗ trợ sẽ NÉM "Unsupported configuration" thay vì
tự fallback — code sản phẩm sau này phải chọn accel theo kết quả
`isConfigSupported`, không hardcode `prefer-hardware`.

### 2.3 Decode chuỗi + present ngược từ cache

Parse NAL thành công: sparse 900 frame / 907 NAL, dense 900 frame /
961 NAL — đúng 30 s × 30 fps, chứng tỏ nhóm frame + avcC đúng.

| Đo | GOP thưa (300 frame = 1 GOP, 10 s) | GOP dày (90 frame = 3 GOP, 3 s) |
|---|---|---|
| Frame decode được | 300/300, lỗi null | 90/90, lỗi null |
| Thời gian decode | 1.081 s | 0.382 s |
| **Decode fps** | **277.4** (9.2× realtime) | **235.8** (7.9× realtime) |
| Latency queue→output P50 / P95 / max\* | 479.8 / 995.1 / 1078.6 ms | 200.5 / 324.0 / 333.3 ms |
| **Present ngược từ cache (canvas 2D)** | **83.6 fps** (3.589 s / 300 frame) | **74.9 fps** (1.201 s / 90 frame) |
| Cache lý thuyết (NV12 1280×720×1.5 B/frame) | 414.7 MB / 1 GOP | 124.4 MB / 90 frame (41.5 MB / 1 GOP dày) |

\* Latency này đo khi toàn bộ chunk đã xếp hàng cùng lúc nên nó là
thời gian xả pipeline, KHÔNG phải latency 1 frame — xem §2.4. Nó
vẫn có ích: max ≈ wall decode, cho thấy không có frame nào kẹt lẻ.

### 2.4 Thí nghiệm chunk đơn — KHÔNG đo được (ghi rõ, không giấu)

Decoder riêng, 1 keyframe chunk, `prefer-software`, state =
`configured` sau khi queue: KHÔNG output trong 20 s, KHÔNG error.
Sau đó decode chuỗi vẫn chạy tốt với cùng chunk đó đứng đầu, nên
định dạng chunk không sai. Giả thuyết hợp lý nhất: decoder giữ
frame đơn lẻ chờ thêm dữ liệu/flush (hành vi pipeline), và thí
nghiệm này không đếm output sau flush nên không kết luận được.
Cần thí nghiệm riêng: queue 1 keyframe → `flush()` → đếm output
sau flush (thay vì đếm trước flush). Kết luận này KHÔNG chặn kết
luận §2.3 vì phát ngược thật luôn decode theo chuỗi, không bao giờ
decode đúng 1 chunk đơn lẻ.

### 2.5 Kết luận khả thi + bước tiếp theo cụ thể

**Kết luận: WebCodecs ĐỦ để đạt 30 fps ngược, với thiết kế sau
(chưa xây, chỉ là thiết kế từ số đo):**

1. **Decode-ahead + cache cửa sổ trượt, không cache cả GOP thưa.**
   Chi phí decode 1 GOP: thưa 1.08 s, dày 0.13 s. Thời lượng phát
   ngược của 1 GOP: thưa 10 s, dày 1 s. Decode GOP kế tiếp trong
   lúc đang phát ngược GOP hiện tại luôn xong trước khi chạm biên
   (1.08 < 10; 0.13 < 1) nên chi phí qua biên được giấu hoàn toàn
   — với điều kiện decode-ahead chạy nền song song, không chặn
   vòng present.
2. **Seek vào GOP mới (lần đầu) vẫn tốn 1 lần decode GOP:**
   thưa ~1.1 s, dày ~0.13 s. Đây là chi phí "warm-up" chấp nhận
   được cho thao tác seek (hiện tại seek từng frame thưa đã tốn
   hơn thế rất nhiều, thể hiện ở holdDelta 487–591), nhưng phải
   hiển thị trạng thái chờ thay vì đứng hình không báo.
3. **Bộ nhớ:** cửa sổ trượt ~90 frame ≈ 124 MB (lý thuyết NV12);
   150 frame ≈ 207 MB. Cache cả GOP thưa (415 MB) hay 2 GOP thưa
   (830 MB) là quá lớn nếu giữ nguyên VideoFrame — nên cửa sổ
   trượt + decode-ahead, không giữ 2 GOP thưa cùng lúc. Số MB này
   là lý thuyết (jsHeap chỉ tăng 0.7 → 1.7 MB vì VideoFrame nằm
   ngoài JS heap) — cần đo bộ nhớ thật của VideoFrame khi làm
   prototype.
4. **Độ nhạy với footage thật:** số trên đo trên video phẳng.
   Trước khi claim sản phẩm, phải đo lại decode fps + present fps
   trên footage nhiễu/thật (ví dụ `sparse-gop-noise.mp4` của đợt 27)
   và trên máy có GPU (kiểm tra hardware decode có bật không).

**Bước tiếp theo cụ thể (theo thứ tự, đợt sau làm):**

1. Demux MP4 trong browser: parse moov (avcC + sample table stts/
   stss/stsz/stco) thành `EncodedVideoChunk` — đo chi phí demux
   riêng (kỳ vọng chỉ parse, cỡ ms, nhưng phải có số).
2. Prototype ngoài app (kiểu spike này): decode-ahead + cửa sổ
   trượt 90 frame + present ngược, đo fps ngược bền vững trên
   footage nhiễu + bộ nhớ VideoFrame thật.
3. Thí nghiệm chunk đơn flush-rồi-đếm-output (§2.4) để khóa số
   latency 1 frame phục vụ thiết kế seek.
4. Chỉ sau 1–3 mới đưa thiết kế vào `preview.tsx` (thay đường
   element-seek ở chiều ngược bằng đường WebCodecs khi có cache,
   giữ fallback element-seek khi WebCodecs không hỗ trợ).

## 3. Spec hook đo gap rAF riêng vòng preview (CHƯA áp dụng)

### 3.1 Vì sao cần hook trong preview.tsx (không làm được từ harness)

Probe đợt 31 N2 bọc `window.requestAnimationFrame` toàn cục nên đếm
cả rAF của vòng khác (lúc rảnh ~108–118 callback/s, vượt 60 Hz của
1 vòng — bằng chứng có ≥ 2 luồng rAF xen kẽ, ví dụ PerfOverlay /
MixerMeter). Hệ quả: gap probe là CẬN DƯỚI của gap riêng vòng
preview, loss do clamp chỉ là cận dưới, tốc độ dự báo là cận trên.
Muốn số clamp chính xác thì phải đo NGAY TRONG vòng lặp preview —
và đó là sửa `preview.tsx`, nên đợt này chỉ viết spec, không áp
dụng (tránh xung đột O3).

### 3.2 Vị trí chèn (mốc neo để không xung đột O3)

File `apps/web/src/preview.tsx`, effect vòng lặp preview (bắt đầu
quanh dòng 1936, `useEffect` chứa `loop`). O3 sửa vùng seek/draw
bên dưới; hook này chỉ chạm 4 điểm KHÔNG thuộc vùng đó:

1. **Khai báo, cạnh `idleDebug`** (quanh dòng 1968–1975, ngay trước
   `const loop = ...`): thêm type + object hook, gắn lên `window`
   theo đúng mẫu `__vcutPreviewIdle` đã có.
2. **Đầu `loop`, ngay trước dòng clamp hiện tại**
   `const dt = Math.min(0.1, (now - last) / 1000);` (dòng ~1975):
   tính gap thô TRƯỚC khi `last = now;` — đây là điểm duy nhất đo
   được gap thật, vì sau dòng này `last` đã bị ghi đè. Điểm này
   nằm TRƯỚC nhánh early-return "chưa có canvas/wrap" (dòng ~2034)
   nên cả tick chưa vẽ cũng được đếm.
3. **`wake()`** (quanh dòng 2351): set cờ `justWoke = true` trước
   khi đặt lịch lại (cùng chỗ `last = performance.now();`).
4. **Cleanup của effect** (cạnh dòng xóa `__vcutPreviewIdle`):
   xóa `__vcutPreviewRaf` nếu nó vẫn là object của effect này.

### 3.3 Dữ liệu thu thập

Mỗi tick của vòng lặp ghi đúng 1 mẫu (ring buffer, tối đa 5000
mẫu, mẫu cũ nhất bị đẩy ra — chi phí 1 lần push số mỗi tick, không
đáng kể so với render 1 frame):

```ts
type PreviewRafSample = {
  t: number;          // now (tham số rAF, cùng đồng hồ với dt)
  gapMs: number;      // (now - lastTrước) * 1000 — gap THÔ, chưa clamp
  dtMs: number;       // dt đã clamp * 1000 (dt = min(0.1, gap))
  lostMs: number;     // max(0, gapMs - dtMs) — thời gian playhead mất ở tick này
  playing: boolean;   // st.playing tại tick
  reverse: boolean;   // st.reversePlayback tại tick
  justWoke: boolean;  // tick đầu sau wake() — tick biên, loại khỏi phân tích sustained
  playhead: number;   // st.playhead tại tick
};
// Trong effect, cạnh idleDebug:
const rafDebug: { samples: PreviewRafSample[] } = { samples: [] };
(window as unknown as { __vcutPreviewRaf?: typeof rafDebug }).__vcutPreviewRaf = rafDebug;
// Trong loop, ngay trước dòng dt hiện tại (gap tính TRƯỚC khi last = now):
const gapRaw = (now - last) / 1000;
const dt = Math.min(0.1, gapRaw);
rafDebug.samples.push({
  t: now, gapMs: gapRaw * 1000, dtMs: dt * 1000,
  lostMs: Math.max(0, gapRaw - dt) * 1000,
  playing: st.playing, reverse: st.reversePlayback,
  justWoke, playhead: st.playhead,
});
if (rafDebug.samples.length > 5000)
  rafDebug.samples.splice(0, rafDebug.samples.length - 5000);
justWoke = false;
last = now;
// Trong wake(), cạnh `last = performance.now();`: justWoke = true;
// Trong cleanup: if (winHook.__vcutPreviewRaf === rafDebug) delete winHook.__vcutPreviewRaf;
```

Lưu ý thiết kế (đừng "sửa" khi implement):

- `wake()` đã reset `last` nên tick đầu sau giấc ngủ có gap nhỏ
  theo cấu tạo — cờ `justWoke` đánh dấu đúng tick đó để phân tích
  sustained loại nó ra, thay cho cách N2 phải SUY LUẬN tick biên
  từ dữ liệu (1 gap ~1.4–1.8 s ở đầu phase).
- Dùng `now` (tham số rAF) chứ không gọi `performance.now()` riêng
  để gap khớp đúng đồng hồ mà `dt` dùng.
- Khi vòng lặp NGỦ thì không có tick, không có mẫu — đúng: ngủ
  không phải gap. Khi vòng lặp tick mà không phát (pause), mẫu vẫn
  ghi với `playing: false` để harness lọc đúng phase đang phát.
- Không ghi thêm gì vào `__vcutPreviewIdle` (giữ nguyên shape của
  nó cho script cũ); hook mới là object riêng.

### 3.4 Cách harness dùng hook (để đợt sau khỏi đoán)

Harness đọc `window.__vcutPreviewRaf.samples.length` tại mỗi mark
(`fwd-start`/`fwd-end`/`rev-start`/`rev-end`) rồi cắt mẫu theo chỉ
số (không cắt theo timestamp vì mẫu đã tuần tự). Với mỗi phase
(loại mẫu `justWoke`): tính gap P50/P95/P99, số gap > 100 ms,
`tổng lostMs`, tốc độ dự báo = `1 - tổng lost / wall phase`, đối
chiếu tốc độ playhead đo được. Vì mẫu chỉ từ vòng preview nên
không còn hiệu chỉnh "cận dưới/cận trên" như probe N2.

## 4. Sự cố trong lượt (ghi đủ, không giấu)

1. **Probe WebCodecs lần 1: timeout CDP do socket Xvfb mồ côi.**
   Socket `/tmp/.X11-unix/X96` tồn tại nhưng không có Xvfb sống;
   script ban đầu dùng chung socket chết nên Chrome không lên.
   Đã vá script theo mẫu N2 (pgrep kiểm tra, xóa socket + lock
   mồ côi rồi bật mới).
2. **Probe WebCodecs lần 2: vẫn timeout do bug tự viết — ghi lệnh
   CDP sai fd.** Script ghi lệnh vào `stdio[4]` trong khi Chrome
   pipe đọc lệnh ở fd 3 và trả lời ở fd 4 (mẫu N2 ghi `stdio[3]`).
   Chẩn đoán bằng cách chạy Chrome tay với `--remote-debugging-port`
   (Chrome lên bình thường, chứng tỏ lỗi ở pipe, không ở Chrome).
   Đã sửa thành `stdio[3]`.
3. **Thí nghiệm chunk đơn kẹt** (xem §2.4): lần chạy đầu treo ở
   `await got` tới hết timeout evaluate 120 s; đã vá bằng race
   timeout 20 s + progress marker `__wcProgress` rồi mới thấy rõ
   điểm kẹt là sau `single-decode-queued:state=configured`.
4. **2 lượt cuối tốc độ xuôi tụt (0.929 / 0.770)** trong khi 4 lượt
   đầu 0.993–1.018 — gợi ý contention từ luồng song song tăng dần
   cuối cửa sổ đo. Không loại được ảnh hưởng lên số ngược 2 lượt
   cuối, nhưng 4 lượt đầu (xuôi khỏe) vẫn thấp hơn hẳn đợt 31 nên
   kết luận §1.3 không dựa vào 2 lượt cuối.
5. **Bài học pkill tự kill:** 2 lệnh dọn Chrome chẩn đoán bị SIGTERM
   vì pattern pkill trùng chính cmdline của shell gọi nó. Đã tránh
   bằng cách tách lệnh + dựng pattern động; không ảnh hưởng kết
   quả đo (chỉ là lệnh dọn, không phải harness đo).
6. **Unit test reversePlayback không chạy được ở đây:** 2 file test
   tồn tại (`src/lib/reversePlayback.test.ts`,
   `src/lib/reversePlaybackRound28L2.test.ts`) nhưng runner vitest
   không được cài trong checkout này (không có
   `apps/web/node_modules/.bin/vitest`, cũng không có ở root) nên
   không chạy — KHÔNG tự cài dependency để chạy cho bằng được.
   Bù lại, kiểm chứng mức harness (6 lượt click-test, cùng assertion
   phát ngược đúng + hold kích hoạt) đều PASS. Việc chạy unit test
   thuộc về môi trường đã cài đủ deps.

## 5. File đổi/thêm (text, không binary — parent gộp batch)

- Mới: `docs/PHASE9_ROUND32_O5_REVERSE_WEBCODECS_LIMITS.md` (file này).
- Mới: `apps/web/scripts/probe-round32-o5-webcodecs-pipe.mjs`
  (script spike WebCodecs + probe tiến độ; bản chạy thực tế ở
  scratch `~/workspace/tmp-round32-o5/wc/` — scratch ngoài repo,
  không stage; fixture `.h264` chỉ nằm ở scratch, không vào repo).
- Mới: `benchmarks/results/v32-o5-reverse-sparse-1.json`,
  `benchmarks/results/v32-o5-reverse-dense-1.json`,
  `benchmarks/results/v32-o5-reverse-sparse-2.json`,
  `benchmarks/results/v32-o5-reverse-dense-2.json`,
  `benchmarks/results/v32-o5-reverse-sparse-3.json`,
  `benchmarks/results/v32-o5-reverse-dense-3.json`
  (JSON 6 lượt đo lặp, mỗi file ghi đủ load, gap rAF probe toàn
  cục kiểu N2, mẫu playhead/gray).
- Mới: `benchmarks/results/v32-o5-webcodecs.json`
  (JSON kết quả spike WebCodecs: support, single, sparse, dense).
- Không sửa: mọi code sản phẩm (`preview.tsx` — chỉ đọc, mtime vẫn
  31/10 19:19 trước lượt này — `seek.ts`, `store.ts`, ...), mọi file
  của luồng khác, paths-loop, build-loop-log. Harness N2 dùng nguyên
  vẹn, không sửa.

## 6. Nợ còn lại

1. **Quy kết hồi quy fps ngược (§1.3):** diff bundle D3yYXWHm với
   C0HfodWe ở đường seek/reverse, rồi đo lại 3+3 lượt trên bundle
   sạch sau khi O3 chốt. Tới lúc đó số đợt này chỉ là tín hiệu,
   không phải baseline mới.
2. **Demux MP4 trong browser** (§2.5 bước 1) — chưa xây, chưa đo.
3. **Prototype decode-ahead + cửa sổ trượt** trên footage nhiễu +
   đo bộ nhớ VideoFrame thật (§2.5 bước 2).
4. **Latency 1 chunk đơn** bằng thí nghiệm flush-rồi-đếm-output
   (§2.4).
5. **Hardware decode trên máy có GPU** (§2.2): kiểm tra
   `isConfigSupported(prefer-hardware)` + decode fps thật.
6. **Implement hook rAF §3** (O3 hoặc đợt sau) rồi đo lại clamp
   chính xác, thay cho probe toàn cục của N2.
7. **Unit test reversePlayback** (§4.6): chạy trong môi trường đã
   cài vitest.
