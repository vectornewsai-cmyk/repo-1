# Phase 9 đợt 35, luồng R4 — Đo quiet đối chứng + đo GPU cho đường WebCodecs — LIMITS

Ngày: 02/11/2026 (phiên đo 02:19–02:21 +07; log probe ghi UTC 19:19–19:21
01/11). KHÔNG push, KHÔNG release/tag, KHÔNG binary vào repo, KHÔNG
code giả. Luồng này CHỈ ĐO: không sửa code sản phẩm, không sửa
`preview.tsx`, không sửa `reverseWebcodecs.ts`, không nối module Q3
(`reverseDecodeAhead.ts`) vào preview, không ghi paths-loop hay
build-loop-log (parent đợt 35 gộp).

Đọc trước khi làm: `docs/PHASE9_ROUND34_LIMITS.md` §3 mục 4 và
`docs/PHASE9_ROUND34_Q2_REVERSE_WIRING_LIMITS.md` +
`docs/PHASE9_ROUND34_Q3_DECODE_AHEAD_LIMITS.md`.

## 0. Kết luận ngắn (không vượt số đo)

1. **Hardware decode KHÔNG CÓ trên Chrome của VM này — kết luận này
   xác định được, không phải đoán.** `VideoDecoder.isConfigSupported`
   với `avc1.64001F` 1280×720 trả `prefer-hardware: false`
   (trong khi `prefer-software: true`, mặc định: `true`); decode thật
   với cấu hình `prefer-hardware` cho **0/300 frame trong cả 10 lượt**
   (5 phẳng + 5 nhiễu), hỏng trong vài ms — tức decoder không dựng
   được, không phải decode chậm. Nhánh "hardware decode ≥ 60 fps thì
   kết luận decode-ahead đảo ngược" của khung đợt 34 **ĐÓNG đối với
   môi trường này**: không có hardware decode để đảo ngược.
2. **Đo quiet KHÔNG ĐẠT: 20 lượt thử, 0 lượt quiet** (mỗi ô
   fixture × cấu hình tối đa 5 lượt; xem §3). Vì vậy KHÔNG có
   baseline quiet mới — baseline quiet mới nhất vẫn là đợt 33 của P5
   (thưa tv 7,09; dày tv 22,39 — đó là số preview, không phải số
   decode, xem §5.4). Mọi fps dưới đây đều gắn nhãn `under-load`,
   cấm dùng làm baseline quiet hay claim hồi quy.
3. **Decode phần mềm footage nhiễu dưới tải đợt này: trung vị 36,0 fps
   (5 lượt: 21 / 35,6 / 36 / 36,4 / 37)** — trên 30 fps, NHƯNG đây là
   số under-load, không phải quiet, và lượt nặng tải nhất chỉ 21 fps.
   Nhánh "software decode vẫn < 30 fps" của khung đợt 34 vì vậy
   **không được kích hoạt sạch cũng không bị bác sạch**: số đo cho
   thấy decode phần mềm nhạy tải mạnh (21 → 37 fps trong cùng một
   phiên khi tải đổi), đúng bản chất deficit throughput mà Q3 đã kết
   luận dưới tải nặng hơn (7,7–26 fps). Không được lấy cụm 35,6–37
   fps này để tuyên bố "đã đủ 30 fps ngược footage nhiễu".
4. **Nối Q3 vào preview: CHƯA ĐỦ ĐIỀU KIỆN cho claim tổng quát.**
   Ba điều kiện đợt 34 đặt ra: (a) Q2 chốt — CÓ (đã nối sau cờ opt-in,
   ctts/elst xong); (b) ctts/elst — CÓ (Q2); (c) đo GPU — NAY XONG,
   kết quả là hardware decode vắng mặt trên VM này. Việc nối (là của
   đợt sau, không phải đợt này) chỉ được biện minh như thử nghiệm
   opt-in cho footage dễ decode, hoặc trên máy nào chứng minh được
   hardware decode — không được nối rồi claim 30 fps ngược footage
   nhiễu nói chung.
5. **Hướng rẻ nhất — CHỈ ĐỀ XUẤT, không nối trong đợt này:**
   (1) phát ngược bằng proxy độ phân giải thấp từ hạ tầng Q8 (decode
   rẻ theo số pixel; cần đo fps proxy trước khi claim);
   (2) giữ đường hold-frame cũ và báo rõ giới hạn: "footage nhiễu
   nặng không đạt 30 fps ngược ổn định trên máy không có hardware
   decode; nhịp ngược phụ thuộc tải CPU". Đề xuất (1) làm hướng
   chính, (2) làm nhãn trung thực trong lúc chờ (1) được đo.

## 1. Xác định hardware acceleration (nhiệm vụ 1)

### 1.1 Bằng chứng trực tiếp (VideoDecoder)

Chrome: Playwright chromium-1248 = Chrome 156.0.8078.4, headed qua
Xvfb :98, cùng 1 phiên với mọi phép đo decode (§3). Cả 2 fixture đều
demux ra codec `avc1.64001F`, 1280×720, 900 sample, keyframe
[0, 300, 600].

| Kiểm tra | Kết quả | Đọc đúng |
|---|---|---|
| `isConfigSupported`, `prefer-software` | `supported: true` | Decoder phần mềm có |
| `isConfigSupported`, `prefer-hardware` | `supported: false` | **Không có decoder phần cứng cho cấu hình này** |
| `isConfigSupported`, không đặt trường | `supported: true` | Mặc định rơi về phần mềm (vì phần cứng không có) |
| Decode thật `prefer-hardware`, phẳng, 5 lượt | 0/300 frame, wall 0,002–0,011 s | Dựng decoder hỏng ngay, không phải decode chậm |
| Decode thật `prefer-hardware`, nhiễu, 5 lượt | 0/300 frame, wall 0,065–0,185 s | Như trên |
| Decode thật `prefer-software`, phẳng / nhiễu | 300/300 mọi lượt | Đường phần mềm hoạt động bình thường |

Cảnh báo đã ghi trong script và vẫn đúng: `isConfigSupported` trả
`true` một mình KHÔNG chứng minh decode phần cứng (Chrome vẫn trả
`true` khi fallback phần mềm) — nhưng ở đây chiều ngược lại mới là
bằng chứng: `prefer-hardware: false` + decode 0/300 là hai tín hiệu
độc lập cùng kết luận "không có hardware decode". Không suy diễn
vượt: kết luận này chỉ đúng cho Chrome này trên VM này, không nói
gì về máy user hay máy có GPU thật.

### 1.2 Bằng chứng phụ (môi trường không GPU)

- `/dev/dri`: **không tồn tại** (không có device node GPU nào).
- WebGL trong trang probe: `getContext("webgl2") || getContext("webgl")`
  trả null → `webglRenderer = "no-webgl-context"`. Đây chỉ là chứng
  cứ phụ: renderer WebGL không có không đồng nghĩa suy ra video
  decode, nhưng nó phù hợp với môi trường không tăng tốc đồ họa.
- Tiến trình GPU **CÓ tồn tại** (`--type=gpu-process`, cmdline ghi
  trong JSON) — điều này KHÔNG phải bằng chứng có hardware decode:
  Chrome luôn spawn tiến trình GPU kể cả khi nó chạy phần mềm
  (SwiftShader). Ai đọc cmdline GPU process mà kết luận "có GPU"
  là đọc sai.

### 1.3 chrome://gpu — KHÔNG lấy được nội dung (ghi rõ, không giấu)

Đã thử 3 cách, cả 3 đều không cho nội dung "Video Acceleration
Information":

1. **Pipe CDP headed (trong pipe chính):** tạo target, navigate
   `chrome://gpu`, poll `document.body.innerText` 30 s → rỗng
   (0 ký tự), ghi `gpu.error` vào JSON.
2. **Diagnostic CDP headed (scratch `/tmp/r4-gpu-diag.mjs`):** tạo
   target thẳng bằng URL `chrome://gpu` → trang load thật (title
   "GPU Internals", URL `chrome://gpu/`), nhưng sau 10 s body vẫn
   rỗng: `innerHTML` chỉ còn `<info-view></info-view>` (skeleton,
   617 ký tự HTML). Component WebUI không được nạp dữ liệu qua Mojo
   trong môi trường pipe-CDP này.
3. **Headless `--dump-dom chrome://gpu`:** trả về trang New Tab
   (headless chặn URL chrome:// nội bộ), không phải nội dung GPU.

Kết luận về phương pháp: chrome://gpu không đọc được bằng các cách
trên trong môi trường này — đây là giới hạn của phương pháp, KHÔNG
phải bằng chứng về phần cứng. Vì §1.1 đã trả lời trực tiếp câu hỏi
VideoDecoder, việc thiếu chrome://gpu không làm kết luận §0.1 yếu đi,
nhưng file này không mạo nhận đã đọc chrome://gpu. Lần sau muốn số
chrome://gpu thật cần mở trình duyệt có UI thật (người dùng mở tay)
hoặc lấy qua `chrome://gpu` trên máy có GPU — không cố lách bằng
cách khác trong đợt này.

## 2. Phương pháp đo decode fps (nhiệm vụ 2)

### 2.1 Fixture (tái dùng, không tạo binary mới vào repo)

| Fixture | Nguồn | Hình học / fps / GOP | Kích thước |
|---|---|---|---|
| Phẳng | `tmp-round27-k4/sparse-gop-flat.mp4` của P5/O5 (symlink vào scratch) | 1280×720, 30 fps, GOP 300, 900 sample, key [0,300,600] | 45.369 byte (~12 kbps — gần như tĩnh) |
| Nhiễu | `tmp-round34-q3/wc/noise-30s.mp4` của Q3 (symlink vào scratch) | 1280×720, 30 fps, GOP 300, 900 sample, key [0,300,600] | 210.771.214 byte (~56 Mbps) |

Cả 2 đều demux bằng `mp4Demux.ts` hiện tại của repo và decode bằng
`ReverseFrameCache.decodeGop` thật (không sửa 2 module này; pipe biên
dịch chúng bằng esbuild ra scratch, chỉ sửa specifier import
`"./mp4Demux"` → `"./mp4Demux.js"` trong bản biên dịch ở scratch để
browser ESM resolve được; sha256 nguồn + đích ghi trong JSON).

### 2.2 Thiết kế lượt đo

- Mỗi lượt đo = decode đúng 1 GOP giữa **[300, 599]** (300 frame),
  rồi `closeAll` ngay — đỉnh giữ tối đa 1 GOP, không giữ 900 frame
  như thang Q3, để tránh OOM khi đo song song đợt 35 (MemAvailable
  lúc đo chỉ 768–1.728 MB).
- Trước mỗi fixture: warm-up 1 GOP [600, 899] bằng prefer-software,
  không tính vào lượt đo (decoder tạo mới mỗi GOP nên warm-up chỉ
  warm Chrome/codec, không warm decoder cụ thể — ghi rõ).
- Mỗi ô (fixture × preferHardware) chạy tới khi đủ 2 lượt quiet hoặc
  hết tối đa 5 lượt. `prefer-software` là đường preview đã nối thật
  (controller Q2 gọi `decodeGop(..., false)`); `prefer-hardware` là
  đường tiềm năng.
- Nhãn tải ghi TRƯỚC mỗi lượt (loadavg `/proc` + đếm tiến trình):
  **QUIET khi và chỉ khi** load1 < 2,0 (ngưỡng Q6, máy 4 vCPU) VÀ
  0 tiến trình Chrome ngoài cây probe VÀ 0 tiến trình nặng khác
  (ffmpeg/vite/tsc/esbuild/probe khác). Không đạt 1 trong 3 → nhãn
  `under-load` kèm lý do. Tiêu chí rAF-gap của probe Q6 không áp
  dụng ở đây vì probe này không đo vòng lặp preview (không có rAF
  loop để đo gap) — chỉ dùng load + tiến trình tranh chấp, và ghi
  rõ sự khác biệt này thay vì mạo nhận theo đủ chuẩn Q6.
- Lưu ý về đếm Chrome: `chromeOther` đếm mọi tiến trình có args chứa
  `chrome-linux64/chrome` ngoài cây probe, **kể cả crashpad-handler**
  (tên chứa chuỗi đó) — tức là đếm bảo thủ, có thể cao hơn số
  "trình duyệt khác" thực sự. Điều này chỉ làm nhãn quiet khó đạt
  hơn, không làm số quiet bị thổi phồng.

## 3. Kết quả đo (tất cả đều under-load — KHÔNG có lượt quiet nào)

Phiên: Chrome 156.0.8078.4 headed, Xvfb :98, port 4198, VM 4 vCPU /
8 GB. Tải song song đợt 35 suốt phiên: luồng R1 chạy Chrome thật
(profile `tmp-round35-r1/...`), socket Xvfb X86–X93 + X98 tồn tại.

### 3.1 Warm-up (không tính)

| Fixture | prefer | Wall / 300 frame | fps | Ghi chú |
|---|---|---|---|---|
| Phẳng | software | 0,390 s | 769,6 | Decode lạnh đầu phiên, chậm hơn các lượt sau (§5.2) |
| Nhiễu | software | 13,303 s | 22,6 | Decode lạnh đầu fixture, chậm hơn hẳn cụm sau |

### 3.2 Phẳng — prefer-software (đường đang nối)

| Lượt | fps | Wall | load1 trước / sau | Chrome ngoài cây | Lý do under-load |
|---|---|---|---|---|---|
| 1 | 1371,7 | 0,219 s | 1,90 / 1,90 | 2 | 2 Chrome ngoài cây probe |
| 2 | 976,2 | 0,307 s | 1,90 / 1,90 | 2 | như trên |
| 3 | 1051,5 | 0,285 s | 1,90 / 1,90 | 2 | như trên |
| 4 | 1097,3 | 0,273 s | 1,90 / 1,90 | 2 | như trên |
| 5 | 1069,1 | 0,281 s | 1,90 / 1,90 | 2 | như trên |

Trung vị **1069,1 fps**, khoảng 976–1372 fps. Lượt phẳng suýt quiet:
load1 1,90 đã dưới ngưỡng 2,0 — chỉ vướng 2 tiến trình Chrome ngoài
cây probe (luồng R1). So với số quiet 577–607 fps của P5: số này
CAO hơn nhưng KHÔNG được kết luận "nhanh hơn" — khác chế độ tải,
khác cách đo (1 GOP + closeAll ngay so với giữ nhiều GOP), và decode
phẳng nhanh tới mức sai số đo chiếm phần lớn (xem §5.4).

### 3.3 Nhiễu — prefer-software (đường đang nối, số chính của đợt)

| Lượt | fps | Wall | load1 trước / sau | Chrome ngoài cây | Tiến trình nặng khác | Lý do under-load |
|---|---|---|---|---|---|---|
| 1 | 21,0 | 14,256 s | 2,48 / 2,57 | 18 | 4 | load1 ≥ 2,0 + Chrome khác + tiến trình nặng |
| 2 | 36,4 | 8,239 s | 2,57 / 2,48 | 2 | 0 | load1 ≥ 2,0 + Chrome khác |
| 3 | 36,0 | 8,326 s | 2,48 / 2,40 | 2 | 0 | như trên |
| 4 | 37,0 | 8,103 s | 2,40 / 2,34 | 2 | 0 | như trên |
| 5 | 35,6 | 8,425 s | 2,34 / 2,39 | 2 | 0 | như trên |

Trung vị **36,0 fps**, khoảng 21–37 fps; cụm lượt 2–5 ổn định
35,6–37,0 fps. Lượt 1 (21 fps) chạy đúng lúc các luồng khác spawn
Chrome + tiến trình nặng (18 Chrome ngoài cây, 4 tiến trình nặng) —
minh họa trực tiếp độ nhạy tải của decode phần mềm.

### 3.4 Cả 2 fixture — prefer-hardware (đường tiềm năng)

| Fixture | Lượt 1–5 (decoded / wall) | Kết quả |
|---|---|---|
| Phẳng | 0/300, wall 0,011 / 0,005 / 0,002 / 0,003 / 0,006 s | Decoder không dựng được, mọi lượt |
| Nhiễu | 0/300, wall 0,065 / 0,086 / 0,105 / 0,185 / 0,093 s | Như trên |

Không có fps phần cứng nào để trung vị — ô này không phải "0 fps vì
chậm" mà là "không decode được frame nào". Tải của các lượt này
cũng đều under-load (load1 1,90–2,39 + Chrome khác), nhưng tải không
phải nguyên nhân: `isConfigSupported` đã trả false trước khi đo (§1.1).

### 3.5 Tổng kết quiet

| Ô | Lượt đã thử | Lượt quiet | Đạt 2 quiet? |
|---|---|---|---|
| Phẳng × software | 5 | 0 | KHÔNG |
| Phẳng × hardware | 5 | 0 | KHÔNG (và decode 0 frame) |
| Nhiễu × software | 5 | 0 | KHÔNG |
| Nhiễu × hardware | 5 | 0 | KHÔNG (và decode 0 frame) |
| **Tổng** | **20** | **0** | **KHÔNG ĐẠT** |

Không chạy thêm phiên thứ hai: sau phiên đo, Chrome của luồng R1
vẫn còn sống và load vẫn ~1,4 — điều kiện "0 Chrome ngoài cây"
không thể đạt trong khi các luồng đợt 35 khác đang chạy. Việc cố
chạy lại chỉ lặp lại cùng kết quả under-load. Lượt quiet đối chứng
thật cần parent điều phối cửa sổ tạm dừng các probe khác (như nợ
Q1/Q6 của đợt 34 đã nêu) — đó là việc của đợt sau, không phải của
luồng này.

## 4. Đọc kết quả theo khung đợt 34 + đề xuất (không nối)

Khung đợt 34 §3 mục 4 đặt 2 nhánh:

- **Nhánh hardware ≥ 60 fps → đảo ngược kết luận decode-ahead:**
  KHÔNG xảy ra ở đây vì hardware decode không tồn tại trên VM này
  (§1.1, §3.4). Trên máy có GPU thật, câu hỏi này vẫn mở và phải đo
  lại từ đầu — số của đợt này không được dùng để kết luận cho máy đó.
- **Nhánh software < 30 fps → hướng rẻ nhất:** số under-load đợt này
  (trung vị nhiễu 36,0 fps) không kích hoạt sạch nhánh này, nhưng
  cũng không bác được nó: (a) không lượt nào là quiet; (b) lượt nặng
  tải nhất chỉ 21 fps; (c) Q3 dưới tải nặng hơn đo 7,7–26 fps cùng
  fixture. Hình ảnh nhất quán là **decode phần mềm footage nhiễu
  dao động quanh ngưỡng 30 fps theo tải** — đủ để nói "không đảm
  bảo", không đủ để nói "đã đủ". Vì vậy Q3 vẫn đứng: cửa sổ
  decode-ahead không cứu được deficit throughput khi tải nặng; và
  claim "30 fps ngược footage nhiễu" vẫn chưa có bằng chứng quiet.

**Đề xuất (chỉ đề xuất, đợt này không nối, không sửa preview):**

1. **Hướng chính — phát ngược bằng proxy độ phân giải thấp (hạ tầng
   Q8):** decode proxy rẻ theo số pixel, không phụ thuộc hardware
   decode của máy. Trước khi claim phải đo: decode fps proxy nhiễu
   (cùng fixture hạ độ phân giải) + present ngược từ proxy, cả quiet
   lẫn under-load, rồi mới quyết định độ phân giải proxy mặc định
   cho chiều ngược.
2. **Nhãn trung thực trong lúc chờ (giữ đường hold-frame cũ):**
   preview khi phát ngược footage nhiễu nặng trên máy không có
   hardware decode phải báo rõ giới hạn — nhịp ngược phụ thuộc tải
   CPU, có thể rớt dưới 30 fps — thay vì im lặng chạy hold-frame
   như hiện tại. Đây là việc ghi nhãn/UI, không phải claim hiệu năng.

**Verdict nối Q3 (để đợt sau dùng):** CHƯA ĐỦ ĐIỀU KIỆN cho claim
tổng quát. Điều kiện (a) Q2 chốt và (b) ctts/elst đã có; điều kiện
(c) đo GPU nay xong nhưng cho kết quả phủ định trên VM này. Đợt sau
chỉ nên nối Q3 vào preview sau cờ (như Q2) với phạm vi đã ghi rõ
(footage dễ decode / máy có hardware decode đã chứng minh), hoặc
sau khi hướng proxy (1) được đo xong — không nối rồi quảng bá
30 fps ngược footage nhiễu nói chung.

## 5. Caveat và giới hạn đo (ghi đủ)

1. **Tải song song đợt 35:** mọi lượt đều under-load vì luồng R1 (và
   các luồng khác) chạy Chrome + build cùng lúc. Số fps ở đây là số
   "dưới tải đợt 35", không so được với số quiet của P5/Q3 và không
   thay thế baseline quiet.
2. **Hiệu ứng decode lạnh:** warm-up nhiễu 22,6 fps so với cụm sau
   35,6–37 fps; warm-up phẳng 769,6 fps so với cụm sau 976–1372 fps.
   Lượt đầu của một fixture luôn chậm hơn — đo 1 GOP đơn lẻ vì vậy
   nhạy với trạng thái warm-up; các lượt sau warm-up mới ổn định.
3. **Lỗi decoder phần cứng không được ghi chuỗi lỗi:** `decodeGop`
   nuốt `decoderError` (chỉ trả số frame decode được) nên JSON chỉ
   có 0/300, không có thông điệp lỗi của VideoDecoder. Kết luận
   "không có hardware decode" dựa vào `isConfigSupported: false`
   (độc lập với decodeGop) + 0/300, không dựa vào chuỗi lỗi vắng mặt.
4. **Không so sánh được trực tiếp với P5 quiet:** P5 đo phẳng
   577–607 fps quiet bằng phương pháp giữ nhiều GOP; đợt này đo
   1 GOP + closeAll ngay dưới tải. Chênh lệch phẳng (976–1372 vs
   577–607) có thể do phương pháp, tải, hoặc cả hai — không quy kết,
   không claim cải thiện.
5. **Không đo RSS/bộ nhớ lần này:** Q2/Q3 đã có số VideoFrame thật
   (2,40 / 1,50 MiB/frame ở 720p); đợt này giữ tối đa 300 frame nên
   không cần đo lại, và MemAvailable thấp (768 MB ở lượt nhiễu 1)
   là lý do giữ thiết kế 1 GOP.
6. **Chưa đo:** máy có GPU thật, Safari, máy thật, dpr > 1, viewport
   khác, footage có B-frame (fixture đợt này `bf=0`, không B-frame),
   độ phân giải khác 720p, và decode fps của proxy Q8 (đề xuất §4
   mục 1). Tất cả vẫn là nợ mở.
7. **Phạm vi của "phẳng":** fixture phẳng đợt này gần như tĩnh
   (45 KB / 30 s) — nó đại diện cho đầu dễ của phổ decode, không
   đại diện cho footage thật có chuyển động vừa. So sánh phẳng–nhiễu
   ở đây vì vậy là so sánh biên, không phải so sánh footage thật
   điển hình.

## 6. Kiểm chứng của luồng

- `node --check` cả 2 script mới: pass.
- Pipe chạy trọn phiên, exit 0 (phiên hoàn thành; quiet không đạt là
  kết quả, không phải lỗi harness): 22 lượt chạy trong trang
  (2 warm-up + 20 lượt đo), 0 error trong JSON (`errors: []`),
  decode software đủ 300/300 mọi lượt, decode hardware 0/300 mọi lượt.
- Không chạy `tsc` / `vite build`: không sửa code sản phẩm nên không
  có gì để build lại; dist là tài nguyên chia sẻ, tránh phá phép đo
  luồng khác (theo tiền lệ Q3).
- Không chạy lại số của luồng khác để đối chiếu: số P5/Q3/Q2 dẫn ở
  đây chỉ để đặt ngữ cảnh, mọi kết luận của đợt này dựa trên số đo
  của chính phiên này.

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/scripts/probe-round35-r4-webcodecs-gpu-page.js`
  (trang probe: handshake lệnh, support, load/unload, decode 1 GOP).
- Mới: `apps/web/scripts/probe-round35-r4-webcodecs-gpu-pipe.mjs`
  (pipe CDP + Xvfb :98: chrome://gpu, snapshot tải + nhãn quiet,
  lái từng lượt decode, ghi JSON).
- Mới: `benchmarks/results/v35-r4-webcodecs-gpu.json` (toàn bộ số đo:
  GPU, support, fixture + sha256, 22 lượt chạy kèm load trước/sau).
- Mới: `docs/PHASE9_ROUND35_R4_WEBCODECS_GPU_LIMITS.md` (file này).
- Không sửa: `preview.tsx`, `reverseWebcodecs.ts`, `mp4Demux.ts`,
  `reverseDecodeAhead.ts`, mọi file luồng khác, paths-loop,
  build-loop-log. Scratch chỉ nằm ngoài repo
  (`~/workspace/tmp-round35-r4/wc/` — module biên dịch + symlink
  fixture + bản JSON copy; `/tmp/r4-gpu-diag.mjs`,
  `/tmp/r4-gpu-dump.html` — diagnostic chrome://gpu), không vào batch.

## 8. Nợ còn lại

1. **Lượt quiet thật (cần parent điều phối cửa sổ dừng probe khác):**
   2+ lượt quiet cho mỗi ô phẳng/nhiễu × software, trên cùng bundle
   đóng băng, để thay baseline và phán quyết dứt khoát nhánh
   software < 30 fps.
2. **Đo trên máy có GPU thật:** hardware decode fps + chrome://gpu
   thật (nội dung Video Acceleration) — VM này không trả lời được.
3. **Đo fps proxy Q8 cho chiều ngược** (đề xuất §4 mục 1) trước khi
   chọn proxy làm hướng chính.
4. **Lấy chuỗi lỗi VideoDecoder khi cấu hình prefer-hardware thất
   bại** (cần sửa `decodeGop` để trả lỗi ra ngoài, hoặc probe riêng
   không qua cache) — hiện chỉ có 0/300 + isConfigSupported.
5. **Nợ chung chưa đo:** Safari / máy thật / dpr > 1 / footage
   B-frame / độ phân giải khác (xem §5.6).
