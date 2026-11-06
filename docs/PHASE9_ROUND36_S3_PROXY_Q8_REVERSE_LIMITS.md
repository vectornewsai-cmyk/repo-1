# Phase 9 đợt 36, luồng S3 — Đo fps ngược của proxy Q8 + cổng opt-in cho Q3 — LIMITS

Ngày: 02/11/2026 (giờ +07; log probe ghi UTC 01:19–01:37).
KHÔNG push, KHÔNG release/tag, KHÔNG binary vào repo, KHÔNG code giả.
Luồng này đóng nợ §3.3 của `docs/PHASE9_ROUND35_LIMITS.md` ("nối Q3 vào
preview": chỉ biện minh được như thử nghiệm opt-in; đo fps proxy Q8 cho
chiều ngược trước khi chọn proxy làm hướng chính; đo lại trên máy có
GPU thật). Luồng này KHÔNG nối module Q3 (`reverseDecodeAhead.ts`) vào
đường vẽ preview — nó đo để quyết định có nên nối hay không, và hiện
thực hoá cổng quyết định đó thành code + test. Mọi số dưới đây đều là
số đo của chính 3 phiên này, gắn nhãn tải từng lượt; KHÔNG claim
30 fps ngược liên tục (chưa đo — xem verdict §0.4).

Đọc trước khi làm: `docs/PHASE9_ROUND35_R4_WEBCODECS_GPU_LIMITS.md`,
`docs/PHASE9_ROUND34_Q3_DECODE_AHEAD_LIMITS.md`,
`docs/PHASE9_ROUND34_Q2_REVERSE_WIRING_LIMITS.md`.

## 0. Kết luận ngắn (không vượt số đo)

1. **Proxy KHÔNG cứu được đường element cũ.** Phát ngược kiểu stepping
   bằng `<video>` seek (đúng luật K4/L2 của preview: playhead lùi
   1 frame / 1 frameDur wall, chỉ phát seek mới khi không seeking,
   tick không có frame mới thì hold) trên footage nhiễu chỉ trình bày
   được **0,32–0,99 frame mới/giây** — cả file gốc lẫn proxy 480p,
   cả 2 lần lặp. Proxy 480p không hơn gốc một cách đo được (2–3 frame
   mới trong cửa sổ 89 frame ở cả hai; chênh lệch 1 frame là nhiễu
   mẫu, không phải hiệu ứng). Với footage phẳng, proxy 480p khá hơn
   gốc ~2× (11,7–17,9 so với 5,2–9,2 fps) nhưng vẫn dưới 30 fps.
   **Verdict: element + proxy KHÔNG phải hướng chính cho chiều ngược.**
   Nút thắt là độ trễ seek (mỗi lần seek ngược phải decode lại từ
   keyframe + overhead seek của trình duyệt), không phải throughput
   decode từng frame — giảm phân giải không gỡ được nút này.
2. **Proxy + WebCodecs (phần mềm) LÀ hướng duy nhất đo được trên
   30 fps cho footage nhiễu.** Decode 1 GOP bằng `ReverseFrameCache`
   thật (prefer-software, đúng đường Q2 đã nối): nhiễu 720p gốc
   17,0 / 21,1 fps; proxy 480p của nó **61,0 / 69,1 fps**; nhiễu
   1080p gốc 8,6 / 12,5 fps; proxy 720p của nó **64,7 / 65,3 fps**.
   Present unpaced từ cache đều > 50 fps (proxy 115–269 fps) nên
   present không phải nút thắt. Proxy làm decode vượt ngưỡng 30 fps
   ở CẢ HAI cặp gốc/proxy, cả hai lần lặp — tức proxy thoả điều
   kiện cần về throughput của cửa sổ Q3 (`decodeFps >= playbackFps`)
   trong khi file gốc thì không.
3. **Cổng opt-in cho Q3 đã hiện thực hoá thành code** (module thuần
   mới `reversePreviewGate.ts`, test 12/12): Q3 chỉ được nối/bật như
   thử nghiệm opt-in khi cờ bật VÀ (máy chứng minh có hardware
   decode HOẶC footage dễ decode theo định nghĩa §4). Chạy cổng bằng
   đúng số đo đợt này: Q3 trên nhiễu gốc → **blocked**; Q3 trên proxy
   (480p hoặc 720p) → **allowed-experiment kèm 3 cảnh báo** (thử
   nghiệm / đo under-load / chưa có hardware decode); cờ tắt (mặc
   định) → **blocked** dù footage nào. Cổng KHÔNG tự nối gì vào
   preview và KHÔNG đổi mặc định — code nối preview ở đợt sau bắt
   buộc phải hỏi cổng này trước.
4. **CHƯA ĐO — nên KHÔNG claim: phát ngược LIÊN TỤC 30 fps bằng
   proxy + WebCodecs + cửa sổ Q3 qua nhiều GOP.** Những gì đã đo là
   decode 1 GOP và present unpaced từ cache, chưa phải paced reverse
   nhiều GOP có decode-ahead. Cổng `resolveProxyMainDirection` cũng
   từ chối kết luận "proxy là hướng chính" khi chưa có số displayed
   fps paced cho đường WebCodecs (trả `no` với lý do
   `proxy-displayed-fps-not-measured`) — đó là hành vi đúng, không
   phải lỗi. Vì vậy: proxy + WebCodecs + Q3-window là **hướng chính
   ĐỀ XUẤT cho đợt nối tiếp (dưới cờ opt-in)**, chưa phải **hướng
   chính ĐÃ CHỨNG MINH**. Ai đọc verdict này mà viết thành "đã đạt
   30 fps ngược" là đọc sai.
5. **Đo trên máy có GPU thật VẪN LÀ NỢ MỞ (không mạo nhận).**
   Cả 3 phiên đợt này tái xác nhận: `prefer-hardware: false` cho mọi
   fixture (720p/1080p/480p), `/dev/dri` không tồn tại — cùng kết
   luận R4. Mọi số ở đây chỉ đúng cho máy không có hardware decode;
   trên máy có GPU, cả file gốc lẫn proxy đều phải đo lại từ đầu.

## 1. Phương pháp đo (để ai cũng tái chạy được)

### 1.1 Fixture và proxy (proxy tạo bằng đúng code Q8, không binary vào repo)

| Fixture | Nguồn | Hình học / fps / GOP | Kích thước / bitrate |
|---|---|---|---|
| Nhiễu 720p gốc | `noise-30s.mp4` của Q3 (tái dùng) | 1280×720, 30 fps, GOP 300, keys [0,300,600], 900 sample, bf=0 | 210.771.214 byte, ~56 Mbps |
| Nhiễu 1080p gốc | Tự tạo đợt này, công thức khớp Q3 (xem §1.4) | 1920×1080, 30 fps, 15 s, GOP 300, keys [0,300], 450 sample, bf=0 | 239.570.102 byte, ~128 Mbps |
| Phẳng 720p gốc | `sparse-gop-flat.mp4` của P5/O5 (tái dùng) | 1280×720, 30 fps, GOP 300, keys [0,300,600], 900 sample | 45.369 byte |
| Proxy 480p của nhiễu 720p | `generateProxy` Q8 thật, height 480 | 854×480, 30 fps, keys [0,45,107,183,432,497,572,621,682], 900 sample, có B-frame (ffprobe `has_b_frames=2`) | 37.122.084 byte, ~9,9 Mbps |
| Proxy 720p của nhiễu 1080p | `generateProxy` Q8 thật, height 720 | 1280×720, 30 fps, keys [0,33,68,112,149,202], 450 sample | 42.389.653 byte, ~22,6 Mbps |
| Proxy 480p của phẳng | `generateProxy` Q8 thật, height 480 | 854×480, 30 fps, keys [0,250,500,750], 900 sample | 34.697 byte |

Proxy CHỈ nằm ở scratch (`~/workspace/tmp-round36-s3/wc/`), không vào
repo. Lưu ý quan trọng về GOP proxy: Q8 KHÔNG ép GOP 300 — proxy dùng
GOP mặc định của x264 (scenecut), keyframe thưa và không đều (nhiễu
480p có GOP dài nhất 249 frame, 183→432). Vì vậy mọi cửa sổ đo đều
lấy từ `keyIndices` do demux thật trả về (thứ tự decode), KHÔNG suy
từ ffprobe (thứ tự presentation — lệch nhau khi có B-frame).

### 1.2 Hai phép đo, hai metric khác nhau (đừng lẫn)

- **WC decode fps** = số frame `ReverseFrameCache.decodeGop` decode
  được / wall, trên đúng 1 GOP đầy đủ mỗi file (GOP chọn động từ
  keys demux: GOP đầu tiên không tính GOP đầu file có độ dài
  150–300 frame; nhiễu 1080p gốc chỉ có 2 GOP nên lấy GOP [300,449]
  150 frame). Sau decode, đo thêm **present unpaced fps** =
  `presentReverse` drawImage từ cache / wall. Rồi `closeAll` ngay
  (đỉnh giữ tối đa 1 GOP, tránh OOM như R4).
- **Element displayed fps** = Số frame MỚI trình bày được / wall
  trong cửa sổ stepping ngược có pacing 30 fps. Probe mô phỏng sát
  luật preview: playhead lùi 1 frame mỗi 1/30 s wall bất kể video
  có kịp hay không; chỉ phát seek mới khi `!video.seeking` (luật
  L2); tick không có frame mới thì đếm hold (giữ hình cũ — đúng
  hành vi preview); một frame chỉ đếm khi `currentTime` đổi sang
  frame khác. Cửa sổ 89 bước frame, mỗi file vượt đúng 1 keyframe
  (để so sánh công bằng): nhiễu gốc 349→260 (vượt key 300), proxy
  nhiễu 480→391 (vượt key 432), phẳng gốc 349→260 (vượt key 300),
  phẳng proxy 540→451 (vượt key 500). Server của pipe hỗ trợ Range
  (bắt buộc để `<video>` seek được); wall tính SAU seek khởi tạo
  (không tính chi phí seek đầu tiên vào fps).
- **Đọc đúng metric element:** probe đếm MỌI frame mới tới được
  (kể cả frame tới muộn, lag tới 52 frame) — tức là cận TRÊN của tốc
  độ nội dung mới mà preview trình bày được, vì preview còn loại
  frame lag > 2 s (luật L2) mà probe vẫn đếm. Số element ở đây vì
  vậy đã là phía lạc quan cho đường element.

### 1.3 Nhãn tải (cùng tiêu chí R4 đợt 35)

QUIET khi và chỉ khi load1 < 2,0 VÀ 0 Chrome ngoài cây probe VÀ
0 tiến trình nặng khác. **Cả 24 lượt đợt này đều under-load**
(load1 2,60–6,47; 2–17 Chrome ngoài cây — các luồng đợt 36 khác đang
chạy song song; 2–3 tiến trình nặng khác ở một số lượt). Vì vậy
KHÔNG có baseline quiet mới, mọi fps đều gắn nhãn under-load, cấm
dùng làm baseline quiet hay claim hồi quy. Chiều đọc under-load:
tải chỉ làm chậm thêm, nên (a) số decode proxy 61–69 fps đo dưới
tải vẫn là bằng chứng tốt rằng throughput vượt 30 (số quiet nếu có
khó mà thấp hơn), nhưng (b) số element ~1 fps dưới tải KHÔNG cho
phép kết luận "khi quiet element sẽ đủ 30" — khoảng cách là 30×,
không phải vài chục %; claim đó sẽ là suy đoán, không phải kết luận.

### 1.4 Bài học về fixture: nhiễu phải là nhiễu temporal (ghi rõ lỗi của mình)

Lần tạo 1080p đầu tiên của luồng này dùng `noise=alls=25` (không cờ
temporal) cho ra file chỉ 13 Mbps — SAI fixture, đã xoá. Kiểm tra
chỉ ra: nhiễu không-temporal là pattern tĩnh lặp lại mỗi frame nên
nén rất tốt (5 s 720p: 6,6 Mbps), trong khi nhiễu temporal
(`noise=alls=25:allf=t`) cho đúng 56,2 Mbps — khớp chính xác fixture
Q3 (56 Mbps). File 1080p dùng trong mọi kết luận ở đây là bản tạo
lại bằng `noise=alls=25:allf=t` (127,8 Mbps = 56 × 2,25 đúng tỉ lệ
pixel). Ai tái tạo fixture nặng kiểu Q3 mà quên cờ `t` sẽ đo trên
footage nhẹ hơn nhiều mà tưởng là nặng — đó là bẫy đã gặp thật ở
đợt này, không phải lý thuyết.

## 2. Kết quả đo

### 2.1 WebCodecs decode 1 GOP, prefer-software (đường Q2 đã nối)

| Cell | GOP (decode idx) | Lần 1 | Lần 2 | Đọc |
|---|---|---|---|---|
| Nhiễu 720p gốc | [300,599] (300 fr) | 17,0 fps | 21,1 fps | Dưới 30 cả hai lần |
| Proxy 480p của nhiễu 720p | [183,431] (249 fr) | 61,0 fps | 69,1 fps | **Trên 30 cả hai lần, ~3,4× gốc** |
| Nhiễu 1080p gốc | [300,449] (150 fr) | 8,6 fps | 12,5 fps | Xa dưới 30 |
| Proxy 720p của nhiễu 1080p | [202,449] (248 fr) | 64,7 fps | 65,3 fps | **Trên 30, ổn định, ~5–7× gốc** |
| Phẳng 720p gốc | [300,599] (300 fr) | 545,9 fps | 598,2 fps | Dễ decode (đối chứng) |
| Proxy 480p của phẳng | [250,499] (250 fr) | 1246,3 fps | 803,9 fps | Dễ hơn nữa |
| Phẳng (phiên 1080p) gốc / proxy | như trên | 495,5 / 966,4 fps | 498,6 / 1050,9 fps | Nhất quán với phiên 720p |

Present unpaced từ cache (cùng lượt): nhiễu gốc 51–104 fps, proxy
nhiễu 115–269 fps, phẳng 117–282 fps — mọi ô đều trên 30 nên present
không phải nút thắt ở bất kỳ đường nào; nút thắt duy nhất là decode
(đường WC) hoặc seek (đường element, §2.2).

### 2.2 Element reverse stepping, cửa sổ 89 bước vượt 1 keyframe

| Cell | Cửa sổ | Lần 1: drawn / displayed | Lần 2: drawn / displayed | Seeks hoàn tất |
|---|---|---|---|---|
| Nhiễu 720p gốc | 349→260 | 3/89, **0,99 fps** | 2/89, **0,67 fps** | 3, rồi 2 |
| Proxy 480p của nhiễu | 480→391 | 2/89, **0,67 fps** | 1/89, **0,32 fps** | 2, rồi 1 (lần 2 chỉ có frame khởi tạo + 1 seek không kịp hoàn tất trong cửa sổ) |
| Phẳng 720p gốc | 349→260 | 28/89, 9,20 fps | 16/89, 5,19 fps | 28, rồi 16 |
| Proxy 480p của phẳng | 540→451 | 54/89, 17,94 fps | 35/89, 11,69 fps | 53, rồi 35 |

Đọc đúng: (a) Với nhiễu, đường element sụp đổ ở cả gốc lẫn proxy —
mỗi lần seek ngược tốn ~1 s trở lên (decode lại từ keyframe), trong
khi playhead đã lùi xa (lag trung vị 12 frame ở gốc lần 1, 52 frame
ở proxy lần 1 — video kẹt ở frame cũ trong lúc playhead chạy).
(b) Chênh lệch gốc–proxy ở nhiễu (3 so với 2, 2 so với 1 frame) là
nhiễu mẫu, KHÔNG được viết thành "proxy tệ hơn gốc" — kết luận đứng
là "cả hai đều sụp, không đo được lợi thế proxy trên đường element".
(c) Với phẳng, proxy tốt hơn gốc ~2× ở cả hai lần lặp nhưng vẫn
< 30 fps và dao động mạnh theo tải (gốc 9,2 → 5,2 fps giữa hai lần
lặp với tải tương đương) — đường element ngay cả footage dễ cũng
chưa đủ 30 fps ngược ổn định trên VM này.
(d) So sánh với tiền lệ: con số ~1 fps cho nhiễu GOP thưa khớp với
đo đợt 27/28 ("hình kẹt 8,5 s, ~1,3 fps hiển thị") — probe này không
phát minh ra hiện tượng mới, nó đo lại hiện tượng cũ trên cả proxy.

### 2.3 Hardware (tái xác nhận, không phải số mới)

Cả 3 phiên, mọi fixture: `isConfigSupported` prefer-hardware =
`false` (trong khi prefer-software = `true`); `/dev/dri` không tồn
tại; Chrome 156.0.8078.4 headed qua Xvfb :99 (phiên 1–2) và phiên
1080p. Kết luận R4 đứng nguyên: VM này không có hardware decode.
Không thử lấy `chrome://gpu` lại (R4 đã chứng minh 3 cách đều không
lấy được nội dung trong môi trường này — không lặp lại phép đo đã
biết là không trả lời được).

## 3. Verdict hướng chính (đọc §0 cùng bảng này)

| Hướng | Kết quả đo | Verdict |
|---|---|---|
| Element (mặc định hiện tại) + file gốc, nhiễu | 0,67–0,99 fps | Không đạt (đã biết từ đợt 27/28, đo lại vẫn vậy) |
| Element + proxy Q8, nhiễu | 0,32–0,67 fps | **KHÔNG phải hướng chính** — proxy không gỡ nút seek |
| Element + proxy Q8, phẳng | 11,7–17,9 fps | Tốt hơn gốc ~2× nhưng vẫn < 30 — không đạt |
| WebCodecs (opt-in) + file gốc, nhiễu | decode 8,6–21,1 fps | Không đủ throughput cho Q3 (deficit throughput, đúng kết luận Q3) |
| WebCodecs (opt-in) + proxy Q8, nhiễu | decode 61,0–69,1 fps | **Đủ điều kiện cần của Q3** (decode > playback) — hướng đề xuất |
| WebCodecs + proxy + Q3 window, phát ngược liên tục nhiều GOP | **CHƯA ĐO** | Chưa được claim 30 fps ngược — việc của đợt nối tiếp |

Thứ tự làm tiếp mà số đo này biện minh (không phải mệnh lệnh cho
đợt sau, chỉ là hệ quả logic): (1) nối Q3 window vào controller
WebCodecs SAU cổng opt-in, mặc định tắt, chỉ cho footage proxy
(hoặc máy HW-proven / footage dễ); (2) đo paced reverse nhiều GOP
bằng proxy + Q3 window (cả quiet lẫn under-load, ghi đủ tải) rồi
mới kết luận có đạt 30 fps ngược liên tục không; (3) đo lại toàn bộ
trên máy có GPU thật trước khi nói gì về máy user.

## 4. Cổng opt-in đã hiện thực hoá (code, không chỉ ghi chú)

Module mới `apps/web/src/lib/reversePreviewGate.ts` (thuần, không
DOM — test bằng Node strip-types, không cần browser):

- `isHardwareDecodeProven(proof)`: true chỉ khi
  prefer-hardware supported VÀ decode thật > 0 frame (bài học R4:
  supported một mình không chứng minh HW; decode 0 frame dù
  supported cũng = chưa chứng minh).
- `isEasyDecodeFootage(measurement, playbackFps)`: decode phần mềm
  trên đúng footage đó >= 2× fps phát (mặc định 60 fps khi phát
  30 fps). Hệ số 2 là biên chống dao động tải (Q3/R4 đo được decode
  nhiễu dao động 7,7–37 fps theo tải — ngưỡng 30 trần trụi không đủ
  biên). Số under-load đạt >= 60 vẫn tính là dễ vì tải chỉ làm chậm
  thêm, nhưng verdict kèm cảnh báo under-load, không mạo nhận quiet.
- `resolveDecodeAheadGate(input)`: `blocked` khi opt-in tắt, hoặc
  khi không có HW-proven lẫn footage dễ (kèm mã lý do:
  `opt-in-off`, `hardware-decode-absent`, `hardware-decode-unproven`,
  `software-decode-below-easy-threshold`, ...); `allowed-experiment`
  khi đủ điều kiện, kèm 3 cảnh báo hiển thị (thử nghiệm opt-in /
  số under-load / chưa có hardware decode nếu áp dụng).
- `resolveProxyMainDirection(input)`: `yes` chỉ khi proxy displayed
  fps đo được >= fps phát VÀ không thua gốc VÀ (nếu có) proxy
  decode >= fps phát; còn lại `no` kèm lý do. Đặc biệt: chưa đo
  displayed thì trả `no` (`proxy-displayed-fps-not-measured`) chứ
  không suy từ decode — đây là lý do §0.4 chưa claim hướng chính
  đã chứng minh cho đường WebCodecs.
- Hằng chuỗi cảnh báo tiếng Việt để UI tái dùng (không phải logic):
  `REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI`,
  `REVERSE_UNDER_LOAD_WARNING_VI`, `REVERSE_NO_HARDWARE_WARNING_VI`,
  `REVERSE_PROXY_MAIN_DIRECTION_NOTE_VI`.

Đánh giá cổng bằng đúng số đo đợt này (script scratch
`gate-eval.ts`, không vào repo): nhiễu gốc 19 fps → blocked
(`hardware-decode-absent` + `software-decode-below-easy-threshold`);
proxy 480p/720p 65 fps → allowed-experiment + 3 cảnh báo; opt-in
tắt → blocked (`opt-in-off`); proxy-hướng-chính qua displayed
element 0,67 fps → no (`proxy-displayed-below-playback-fps`).

**Cái gì KHÔNG làm (ghi rõ để khỏi hiểu lầm):** (a) Không nối
`reverseDecodeAhead` vào `ReversePreviewController` hay
`drawVideoClip` — cổng chỉ là hàm thuần chờ code nối ở đợt sau hỏi;
(b) Không thêm toggle UI (cần store + i18n — thuộc luồng sở hữu 2
mảng đó; cờ console `__vcutReverseWebcodecs` mặc định tắt vẫn là
công tắc duy nhất, và cổng này mặc định blocked khi cờ tắt);
(c) Không sửa `preview.tsx`, `reverseWebcodecs.ts`,
`reverseDecodeAhead.ts`, `mp4Demux.ts` hay bất kỳ file luồng khác
nào — chỉ thêm 1 dòng exclude test vào `tsconfig.json` chung (theo
mẫu các test strip-types khác; parent gộp cần đối chiếu nếu luồng
khác cũng sửa file này).

## 5. Kiểm chứng của luồng

- Test cổng mới `reversePreviewGate.test.ts`: **12/12 pass**
  (`node --experimental-strip-types`): opt-in tắt → blocked; HW
  proven / supported-nhưng-decode-0 / R4 (supported=false +
  0/300) → phân biệt đúng; opt-in + HW proven → allowed; opt-in +
  phẳng ~1000 fps → allowed + cảnh báo under-load; opt-in + nhiễu
  36 fps → blocked (dưới ngưỡng dễ 60); opt-in + chưa đo gì →
  blocked; proxy yes/no (đủ 30 + hơn gốc / dưới 30 / chưa đo /
  thua gốc) đủ 4 trường hợp.
- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0** (sau khi thêm
  exclude cho test mới; trước đó 2 lỗi TS5097/TS7006 đúng ở file
  test mới, không ở module sản phẩm).
- `node --check` cả 2 script probe mới: pass. Esbuild module cổng:
  pass.
- Probe browser thật: Chrome 156 headed qua pipe CDP + Xvfb :99,
  demux + decode bằng module thật đã biên dịch từ repo hiện tại
  (sha256 nguồn + đích trong JSON), serve có Range cho `<video>`.
  24 lượt chạy trong JSON gộp, 0 error (`errors: []`): WC 16 lượt
  (8 cặp × 2 lần, gồm 2 phiên 720p/1080p) + element 8 lượt (4 cell ×
  2 lần lặp).
- **Đính chính của chính mình (ghi đủ, không giấu):** bản probe chạy
  3 phiên đã báo cáo trường `cttsDetected: false` cho mọi fixture,
  nhưng `Mp4VideoTrack` không có field này nên giá trị đó luôn là
  false — là số giả, KHÔNG được dùng để kết luận gì về ctts. JSON
  gộp giữ nguyên các lượt đo (không sửa lịch sử) nhưng đã thêm
  mục `corrections` ghi rõ điều này; script probe đã sửa để bỏ
  trường đó khỏi output. Không kết luận nào ở §0–§3 phụ thuộc vào
  trường này (decode fps dùng decode-index + đếm frame decode đủ;
  element dùng seek theo thời gian).
- KHÔNG chạy `vite build`: dist là tài nguyên chia sẻ, các luồng
  đợt 36 khác đang đo song song — tránh phá phép đo của họ (theo
  tiền lệ Q3/R4). Build thuộc bước gộp của parent.
- Lưu ý môi trường: `/tmp` đầy (512M tmpfs, do scratch luồng khác
  — không phải của luồng này, không đụng vào); mọi output của luồng
  này đều ghi ra scratch workspace, không ghi `/tmp`.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/reversePreviewGate.ts` (cổng quyết định
  Q3 + proxy, thuần, có ghi chú luật).
- Mới: `apps/web/src/lib/reversePreviewGate.test.ts` (12/12).
- Mới: `apps/web/scripts/probe-round36-s3-proxy-reverse-page.js`
  (trang probe: supportCodec / load / wcdecode / elementReverse).
- Mới: `apps/web/scripts/probe-round36-s3-proxy-reverse-pipe.mjs`
  (pipe CDP + Xvfb :99 + HTTP Range + nhãn tải từng lượt; hỗ trợ
  env `S3_SKIP_WC` / `S3_SKIP_ELEMENT` / `S3_OUT` /
  `S3_NOISE_PROXY_*` để tái chạy từng case — 3 phiên đợt này đều
  chạy bằng đúng script này).
- Mới: `benchmarks/results/v36-s3-proxy-reverse.json` (JSON gộp duy
  nhất: 24 lượt + fixtures + build sha + 3 phiên; 2 file JSON phiên
  lẻ đã gộp xong và xoá để khỏi trùng lặp).
- Mới: `docs/PHASE9_ROUND36_S3_PROXY_Q8_REVERSE_LIMITS.md` (file này).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude
  `src/lib/reversePreviewGate.test.ts`).
- Không sửa: `preview.tsx`, `reverseWebcodecs.ts`,
  `reverseDecodeAhead.ts`, `mp4Demux.ts`, `reversePlayback.ts`,
  i18n, store, bridge, mọi file luồng khác, paths-loop,
  build-loop-log. Scratch chỉ nằm ngoài repo
  (`~/workspace/tmp-round36-s3/wc/` — fixture + proxy + module biên
  dịch + JSON copy; `gate-eval.ts`, `merge.mjs` — script đánh giá/
  gộp, không vào batch).

## 7. Nợ còn lại

1. **Đo paced reverse liên tục nhiều GOP bằng proxy + Q3 window**
   (đường WebCodecs, sau cờ opt-in): đây là phép đo duy nhất còn
   thiếu để claim "30 fps ngược" — decode 1 GOP + present unpaced
   chưa đủ. Cần cả quiet lẫn under-load, ghi đủ tải + gap rAF.
2. **Nối Q3 window vào controller sau cổng này** (đợt nối tiếp):
   hỏi `resolveDecodeAheadGate` trước khi bật; mặc định tắt; chỉ
   cho footage proxy / HW-proven / footage dễ; kèm cảnh báo UI bằng
   đúng chuỗi §4 (toggle UI thuộc luồng store/i18n).
3. **Đo trên máy có GPU thật:** hardware decode fps + paced reverse
   cả gốc lẫn proxy — VM này không trả lời được (tái xác nhận §2.3).
4. **Đo quiet thật** cho cả WC decode lẫn element (cần parent điều
   phối cửa sổ tạm dừng probe luồng khác — nợ đứng từ R4/R5).
5. **Nợ chung chưa đo:** Safari / máy thật / dpr > 1 / footage
   B-frame thật — proxy Q8 CÓ B-frame (ffprobe `has_b_frames=2`)
   nhưng probe này KHÔNG xác minh được demux có áp đúng ctts cho
   proxy hay không (xem đính chính §5: trường `cttsDetected` trong
   JSON là số giả, phải bỏ qua); đường present theo presentation
   timestamp của proxy vì vậy chưa được kiểm chứng, dù decode theo
   decode-index đã đủ GOP; độ phân giải khác (4K nguồn → proxy
   720p); đường `asset:`.
6. **Nợ đứng từ đợt 35 §3 (không thuộc luồng này):** baseline quiet
   đóng băng 3+3, buffer file đo heap file lớn, rehydrate media sau
   reload, snapshot backup ngoài VM — xem LIMITS đợt 35.
