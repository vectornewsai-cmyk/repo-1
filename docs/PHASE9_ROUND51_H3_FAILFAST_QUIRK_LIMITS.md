# Phase 9 đợt 51, luồng H3 — LIMITS: fail-fast seek-landing-0 headed + quirk frame khác 0

Ngày: 06/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ thêm file text trong phạm vi luồng (4 harness
+ LIMITS này); production code KHÔNG đổi — không có bằng chứng nào
đủ để sửa production (xem §5). Mọi số dưới đây đều đo/chạy thật; chỗ
nào chưa đo được thì ghi rõ, không mạo nhận. Mọi số timing đều
under-load (8–10 luồng đợt 51 chạy song song trên VM 2vCPU).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Fail-fast seek-landing-0 headed ĐÃ ĐO ĐƯỢC — PASS (§2).**
   Nợ đứng từ Z2 qua B2/C3/D3/E4/F6 cuối cùng đã có bằng chứng:
   `seekElement` fail-fast sau đúng 3 landing sai liên tiếp, trả
   `{seeked:false, timedOut:false}` trong 10–84 ms (không treo tới
   timeout 20 s), đo được 3/6 lượt seekElement qua server không
   Content-Length (2/3 trên broken-gap, 1/3 trên file lành).
2. **Nguyên nhân landing-0 đã rõ — KHÔNG phải fixture hỏng, mà là
   server không Content-Length (§1.3, §2.3).** Y2 dùng serve43
   (không đặt Content-Length, chunked); C3/D3/F6 dùng server CÓ
   Content-Length nên không bao giờ tái hiện được. Trên server
   không Content-Length, seek tới 2.5 đáp 0 với tỉ lệ ~40–44%
   (gap 4/9, valid 2/5, cả file lành cũng đáp 0). Mọi lần đáp 0
   đều có `preSeek.seekable=[[0,0]]` (buffered [0,2.367]); mọi
   lần đáp đúng đều có `seekable=[[0,3]]` — tương quan 6/6 ở
   tầng seekElement. Cơ chế suy luận (chưa đọc code Chrome):
   khi seek, seekable range chưa xác định xong ([0,0]) nên
   Chrome clamp seek về đầu range = 0.
3. **Câu hỏi binary Y2 gốc được trả lời bằng cơ chế, không cần
   binary (§3).** Quirk tái hiện trên chromium-1248 156.0.8078.4
   (cùng binary/cờ F6/E4) chỉ bằng cách đổi server sang Y2-exact.
   Meta-chromium 155.0.8059.91 thử qua data: URL (§3.2) không
   khác 156 trên đường này (cả hai đều đáp đúng 2.5 — data: URL
   là nguồn fully-buffered, không phải http chunked).
4. **Quirk frame khác 0 ở tầng pixel (§4): chỉ 1 dạng hỏng cho
   frame cũ qua đường `seeked` — file cắt đuôi (F6 §2.3, tái
   hiện chính xác).** Mọi dạng hỏng khác đã thử (zero keyframe,
   zero P/B giữa GOP, zero 1 B-frame, zero GOP 0, moov zero)
   đều HỎNG PIPELINE error 3/4, không bắn `seeked`, không có
   frame để giữ. Sau lỗi decode, element vẫn GIỮ frame đã trình
   bày (E1: frame 1.5; E2: frame 0.0) — nhưng tầng seek đã báo
   lỗi/timeout nên preview phân biệt được. **Kết luận: KHÔNG
   thêm kiểm tra pixel vào đường seek (§5)** — bằng chứng không
   ủng hộ, chi phí/lợi ích không xứng.
5. **Hồi quy (§6):** seek 15/15, pauseSeekRecovery43Y2 9/9,
   pause45A2 14/14. tsc: chỉ lỗi ở file của luồng khác (xem §6).

## 1. Tái hiện Y2 — hướng server, không phải fixture (lượt 1)

Harness: `apps/web/scripts/pause51H3-quirk.mjs` (mẫu F6:
Xvfb + chromium-1248 156.0.8078.4 + cờ C3, tab mới mỗi probe,
trang raw + seekElement; thêm `?base=nolength` và các `?mode=`).
Fixture gốc Y2 `valid-gop.mp4` md5 `2c2e4771954fd26e1c377ce5900e377d`,
`broken-gap.mp4` md5 `f0e11b602e714246466f6936e58afcd1` (đã verify
byte-identical với F6 var-gop1zero — cùng md5, cùng 30 packet /
104.408 byte zero ở 101.878–206.286).

### 1.1 Vì sao nghi server, không nghi binary

- D3 §4.1 đã loại trừ 3 cờ (DSF, autoplay, GPU) bằng số.
- D3 §4.2: binary khác duy nhất (meta-chromium 155) không load
  được trang probe loopback khi chạy tay — đã chẩn đoán tới cùng,
  không lặp lại, không sửa policy hệ thống.
- Phát hiện khi đọc lại code: D3 ghi "server Y2-exact không Range"
  nhưng code server của D3 (`pause48D3-chromevar.mjs:338`) VẪN ĐẶT
  `Content-Length` — tức "Y2-exact" của D3 không giống serve43
  thật (serve43.mjs không đặt Content-Length, trả chunked). Biến
  server này chưa từng được loại trừ bằng số. Đó là hướng H1c.

### 1.2 Kết quả lượt 1 (34 probe, instance 1; log /tmp đã bị /tmp
### dọn giữa các lượt — số dưới đây trích từ parse log lúc chạy)

Đối chứng PASS: valid raw 1.5 `seeked@1.500`, valid raw 2.5
`seeked@2.500`, seekElement valid 1.5: 1 landing @1.5, 192 ms,
kind correct.

| Probe | Fixture / seek | Kết quả ở mức raw |
|---|---|---|
| H1 (×6) | broken-gap 2.5, server CÓ Content-Length | `seeked@2.500` cả 6/6 |
| **H1c run1** | **broken-gap 2.5, server KHÔNG Content-Length** | **`seeking@0.000`, `seeked@0.000` — LANDING-0 TÁI HIỆN** |
| H1c run2/3 | broken-gap 2.5, nolength | `seeked@2.500` (đúng) |
| **H1c valid** | **valid-gop 2.5, nolength** | **`seeking@0.000`, `seeked@0.000` — FILE LÀNH CŨNG ĐÁP 0** |
| W1 | var-kf20zero (chỉ keyframe 2.0 zero, 2 packet, 13.146 byte, pos 206.286–223.687), seek 2.5 | **error code 3** `timestamp=2066667 size=4255`, seeking kẹt rs 1 |
| W1b | var-kf20zero, seek 1.5 | `seeked@1.500` (hỏng GOP-local, không lan GOP trước) |
| W2 | var-gop0zero (GOP 0 zero, 30 packet, 100.002 byte, pos 1.876–101.878), seek 0.5 / 2.5 / 0.0 | **error code 3** `timestamp=100000 size=4722`, seeking kẹt rs 1 cả 3 target — error bắn ngay khi load (trước cả seeking), vì decoder decode frame đầu đã hỏng |
| W3a/b | broken-gap 2.5, seek tại loadedmetadata / ngay sau gán src | `seeked@2.500` (beforeSet rs 1 / rs 0) |
| W3c/d | valid 2.5, meta / immediate | `seeked@2.500` |
| W4a/b | broken-gap / valid 2.5, seek khi đang play | `seeked@2.500` / `seeked@2.501` (after.currentTime=3 do video play tiếp tới hết trong lúc chờ) |
| W5a/b/c | valid 3.5 / 10, broken-gap 3.5 (vượt duration 3.0) | `seeked@3.000` cả 3 — clamp về duration, hành vi đúng spec, KHÔNG phải quirk (không tính vào ứng viên fail-fast) |
| W6 | broken-gap, hai bước cùng element: 1.5 rồi 2.5 | events `[loadedmetadata, canplay, seeking@1.500, error, seeking@2.500]`, KHÔNG seeked lần 2; after (chạy lại lượt 2): `{seeking:true, readyState:1, currentTime:2.5}` — element kẹt seeking sau khi seek lại (xem §2.4) |
| W6b | valid, hai bước 1.5→2.5 | cả hai `seeked` đúng |
| W7 | var-p25zero (pts 2.5 + 2.5333, 2 packet, 5.625 byte, pos 268.798–274.423), seek 2.5 | **error code 3** `timestamp=2533333 size=2762`, seeking kẹt rs 1 (lưu ý: range [2.5,2.5334) zero cả packet 2.5333 — giống cách làm F6 V3) |
| W10 | broken-gap 2.5, video KHÔNG append vào DOM | `seeked@2.500` |
| W11 | var-lastb-zero (B-frame cuối GOP 1), seek 1.9 | **VÔ HIỆU — fixture zero 0 packet** (range [1.9667,1.9999) trượt pts thật 1.966667; file y hệt valid). Đã sửa range thành [1.9666,2.0) → 1 packet, 4.970 byte, pos 192.775; đo lại ở §4 (error 3) |
| W12 | var-midp-zero (P-frame giữa GOP 1, pts 1.3–1.7, 12 packet, 38.346 byte, pos 134.351–179.207), seek 1.5 | **error code 3** `timestamp=1300000 size=3146`, seeking kẹt rs 1 |
| W13 | var-moovzero (box moov zero, moov@32 size 1.828; boxes ftyp/moov/free/mdat), seek 1.5 | **error code 4** `DEMUXER_ERROR_NO_SUPPORTED_STREAMS`, rs 0, không metadata |

Lượt 1 chết ở cuối (EXIT=2) do bug chọn display cho instance mới
(dùng lại :90 đã bị luồng khác chiếm — xem §7.1): 34/34 probe
instance 1 đã chạy xong; chỉ thiếu H1b (instance mới) và W6
full-result — chạy nốt ở lượt 2. Không mất dữ liệu probe nào
(log từng probe đã đọc trước khi /tmp bị dọn).

### 1.3 Đọc kết quả H1c

Landing-0 tái hiện — nhưng trên cả file lành, và chỉ trên server
không Content-Length, với tỉ lệ flaky (~1/3 lượt 1). Kết luận
trung gian: **landing-0 không phải quirk của fixture hỏng; nó là
hành vi flaky của đường serve chunked/không độ dài.** Y2 dùng
đúng server đó (serve43) nên quan sát được; C3/D3/F6 dùng server
có Content-Length nên không bao giờ thấy. Giả thuyết "first-fetch"
(lần fetch đầu qua chunked mới đáp 0, fetch lại đúng nhờ cache)
được đặt ra ở đây và bị bác ở lượt 2 (§2.2).

## 2. Fail-fast seek-landing-0 — ĐO ĐƯỢC (lượt 2)

Harness: `apps/web/scripts/pause51H3-quirk-r10.mjs`
(seekel.html thêm `?base=nolength`; display chọn mới mỗi instance
— đã sửa bug lượt 1; log /tmp đã bị dọn, số trích từ parse lúc
chạy). EXIT=0, 9 kiểm tra, FAIL=0. Chrome 156.0.8078.4.

### 2.1 seekElement trên server nolength (R10)

| Probe | Kết quả seekElement (target 2.5, fps 30, timeoutMs 1200) |
|---|---|
| R10c (control) | seekel broken-gap 2.5, length-server: 1 landing @2.5, `{seeked:true, timedOut:false}`, 547 ms — PASS |
| **R10a-1** | seekel broken-gap 2.5, nolength: **3 landings @0**, `{seeked:false, timedOut:false}`, **84 ms**, classified `zero-landing` ×3 (consecutiveWrong 1→2→3, shouldFail=true ở lần 3) — **FAIL-FAST PASS** |
| R10a-2 | seekel broken-gap 2.5, nolength: 1 landing @2.5, `{seeked:true}`, 205 ms |
| **R10a-3** | seekel broken-gap 2.5, nolength: **3 landings @0**, `{seeked:false, timedOut:false}`, **10 ms** — **FAIL-FAST PASS** |
| R10b-1 | seekel valid 2.5, nolength: 1 landing @2.5, `{seeked:true}`, 286 ms |
| **R10b-2** | seekel valid 2.5, nolength: **3 landings @0**, `{seeked:false, timedOut:false}`, **84 ms** — **FAIL-FAST PASS (trên file lành)** |
| R10b-3 | seekel valid 2.5, nolength: 1 landing @2.5, `{seeked:true}`, 199 ms |

Tổng seekElement nolength: **3/6 fail-fast** đúng kỳ vọng Z2
(đúng 3 landing sai liên tiếp → fail, không treo tới timeout
20 s; 10–84 ms, nhanh hơn nhiều so với timeoutMs 1200).
Check `H3-fail-fast-headed` của harness: **PASS**.

### 2.2 Tỉ lệ landing-0 raw qua nolength (gộp lượt 1 + 2)

- broken-gap 2.5: lượt 1: 0, 2.5, 2.5 (1/3); lượt 2 run4–9:
  0, 2.5, 2.5, 0, 0, 2.5 (3/6). **Tổng 4/9 ≈ 44%.**
- valid-gop 2.5: lượt 1: 0 (1/1); lượt 2 run2–5: 2.5, 0, 2.5,
  2.5 (1/4). **Tổng 2/5 = 40%.**
- Giả thuyết first-fetch **BỊ BÁC**: file tên mới
  `valid-copy51.mp4` fetch lần 1 qua nolength → 0, fetch lần 2
  → 0 (2/2). Không phải cache-warmup; là race theo từng tab.
- H1b (instance mới hoàn toàn, length-server): gap freshA 2.5,
  valid freshA 2.5, gap freshB 2.5 — đúng hết. "Tab/instance
  mới" không tự nó sinh landing-0 trên server có Content-Length.

### 2.3 Dấu vết cơ chế: `seekable=[[0,0]]`

Ở mọi lượt seekElement, `preSeek` (đo ngay trước khi seek, sau
loadedmetadata + 3 s chờ) phân biệt hoàn toàn hai nhóm:

| Nhóm | preSeek.buffered | preSeek.seekable | Kết quả |
|---|---|---|---|
| landing-0 (3/3 lượt fail-fast) | [[0, 2.367]] | **[[0, 0]]** | 3 landings @0 |
| đáp đúng (3/3 lượt còn lại + control) | [[0, 3]] | **[[0, 3]]** | 1 landing @2.5 |

Tương quan 6/6. Suy luận (chưa đọc code Chrome, ghi rõ là suy
luận từ số đo): với response chunked không Content-Length,
Chrome chưa xác định được seekable range đầy đủ tại thời điểm
seek (seekable=[0,0]) nên seek tới 2.5 bị clamp về đầu range =
0 — và `seeking@0.000` (currentTime đã là 0 ngay khi seeking
bắn) khớp với clamp tại thời điểm gán, không phải đáp sai sau
decode. Khi seekable đã là [0,3] thì seek đi đúng. Tính flaky
(~40%) là race: seekable range xác định xong trước hay sau lúc
seek (3 s sau load). Đây cũng là lời giải thích nhất quán cho
Y2 25d (serve43, không Content-Length) và cho việc C3/D3/F6
(server có Content-Length, seekable [0,3] ngay) không tái hiện.

### 2.4 W6 chạy lại (full result)

broken-gap 1.5→2.5 cùng element: events `[loadedmetadata,
canplay, seeking@1.500, error, seeking@2.500]`; error code 3
`timestamp=1133333`; `secondSeekAt=1.5`; after:
`{seeking:true, readyState:1, currentTime:2.5}` — seek lần 2
đã gán (seeking@2.500) nhưng không bao giờ `seeked`, không lỗi
mới: element kẹt seeking sau khi seek lại trên decoder đã hỏng.
Khớp hành vi Y2 §3.4 (seekElement lặp gán sau seeked@0) ở khía
cạnh "seek lại không cứu được element hỏng" — nhưng ở đây không
có landing-0 (không có seeked nào), nên không phải ứng viên
fail-fast.

## 3. Binary/cờ phiên Chrome Y2 gốc

### 3.1 Kết luận: không còn cần binary đó nữa

Quirk tái hiện trên chromium-1248 156.0.8078.4 + cờ C3 (cùng
binary/cờ F6/E4) chỉ bằng cách đổi server sang Y2-exact. Biến
quyết định là server, không phải binary. Không còn bản ghi nào
về binary/cờ Y2 gốc (Chrome đó chạy cổng 9223, không có script
khởi động trong thư mục Y2; log Chrome không ghi version/flags)
— và nay không cần truy vết nữa để tái hiện quirk.

### 3.2 Thử meta-chromium 155 qua data: URL (đã làm, để đủ nhiệm vụ)

Harness: `apps/web/scripts/pause51H3-meta155-dataurl.mjs`.
Lý do dùng data: URL: binary 155 chạy tay bị chặn navigation
tới loopback (D3 §4.2, đã chẩn đoán tới cùng — không lặp lại,
không sửa policy hệ thống); D3 đã chứng minh `data:text/html`
load bình thường trên binary này. Probe nhúng cả trang lẫn
fixture (base64) vào một data: URL (~438–447 KB).

- Lượt chạy 1 (EXIT=1, FAIL=2) hỏng do 2 lỗi harness, KHÔNG
  phải do binary: (a) port 9231 đã bị tiến trình khác giữ
  (`vcut-studio` pid 29507, Chrome 156.0.8078.80 — của luồng
  khác đợt 51), version check chạm nhầm Chrome đó, `/json/new`
  trả "Could not ..." không phải JSON; (b) instance 156 dùng
  lại display :90 đã bị chiếm. Đã sửa: thử cổng dự phòng +
  assert version khớp binary kỳ vọng + mỗi instance tự chọn
  display trống. Ngoài ra validator policy cần cả 4 cờ
  (`--hatch-validate-webgl-allowed-domains` +
  `--hatch-webgl-allowed-domains-file=` +
  `--hatch-webgl-allowed-domains-sha256=` + `--version`) —
  thiếu file/sha thì lỗi "requires both file and SHA-256
  switches"; validator in lại
  `hatch-webgl-all-origins-v1 sha256=8097045f0459c96c4cdc76e3a1af4e0f43f640b4b59c43d6db35e3641c0264c6`.
- Lượt chạy 2 (EXIT=0, 5 kiểm tra, FAIL=0):
  - Meta 155.0.8059.91: valid 2.5 → `seeked@2.500`; gap 2.5 ×3
    → `seeked@2.500` cả 3; gap 1.5 → error 3
    `timestamp=1133333` (cùng chữ ký).
  - Đối chứng 156.0.8078.4 (cùng data: URL): valid 2.5 →
    `seeked@2.500`; gap 2.5 ×2 → `seeked@2.500`.
- Kết luận: trên data: URL (nguồn fully-buffered, không Range,
  không chunked) cả 155 và 156 đều đáp đúng; không quan sát
  được khác biệt phiên bản trên đường này. Lưu ý trung thực:
  data: URL ≠ http chunked, nên "155 + http chunked" vẫn chưa
  được đo trực tiếp (không đo được khi chạy tay vì chặn loopback;
  cần daemon chạy hoặc đổi policy hệ thống — ngoài phạm vi).
  Nhưng sau §2.3 thì phép đo đó không còn cần thiết để giải
  thích Y2 nữa.
- Ghi chú: probe M2-run1 trên 155 tốn ~103 s wall (12:00:23 →
  12:02:06) trong khi các probe khác ~10–25 s — nhiều khả năng
  do máy tải nặng lúc đó; kết quả vẫn đúng, không dùng thời gian
  này làm baseline.

## 4. Quirk frame khác 0 ở tầng pixel — dạng hỏng khác

Harness: `apps/web/scripts/pause51H3-quirk-pixels.mjs`
(mẫu F6: drawImage 160×90, hash FNV-1a + mean RGB, tab mới mỗi
probe; thêm `?base=nolength` và `?mode=errdraw`). Scratch
persistent `~/workspace/tmp-round51-h3-quirk/` (fixture rebuild
y hệt lượt 1; /tmp scratch gốc đã bị dọn). Chrome 156.0.8078.4.
Log: `~/workspace/tmp-round51-h3-quirk/pixels-run{1,2}.log`.

### 4.1 Frame tham chiếu + tái hiện F6 (lượt pixel 1: 22 probe, 4 kiểm tra, FAIL=0)

| Frame valid | Hash | mean RGB |
|---|---|---|
| 0.0 | `d4828fc3` | [121,106,126] |
| 0.5 | `6e6e6f23` | [122,106,126] |
| 1.5 | `cdb6c1e3` | [121,107,126] |
| 1.9 | `f86c21ed` | [121,107,125] |
| 2.0 | `bb5c122b` | [121,107,125] |
| 2.5 | `8a8a7fa5` | [122,106,126] |

6 frame đều khác hash nhau. 5/6 hash trùng hệt F6 §2.3 (0.5 là
mới) — phương pháp đã được kiểm chứng lại. Tái hiện F6:
trunc@2.5 → `d4828fc3` = frame 0.0 (×2 lần chạy); trunc@1.5 →
`cdb6c1e3` = valid@1.5.

### 4.2 Các dạng hỏng mới — KHÔNG có frame cũ qua đường `seeked`

| Probe | Fixture / seek | Kết quả pixel |
|---|---|---|
| P-W1 | var-kf20zero, 2.5 | error 3, không frame (không `seeked`) |
| P-W12 | var-midp-zero, 1.5 | error 3, không frame |
| P-W11 | var-lastb-zero (fixture ĐÃ SỬA: 1 packet, 4.970 byte), 1.9 | error 3, không frame — zero 1 B-frame cuối GOP cũng đủ hỏng pipeline (trái với probe W11 vô hiệu ở lượt 1) |
| P-W7 | var-p25zero, 2.5 | error 3, không frame |
| P-W2 / P-W2c | var-gop0zero, 0.5 / 0.0 | error 3, không frame |
| P-W13 | var-moovzero, 1.5 | error 4, không frame |
| P-W6 | broken-gap, 1.5→2.5 | error 3 ở lần seek 1 (trang pixel kết thúc ở error, không đo lần 2 — xem §4.3) |
| P-W6b | valid, 1.5→2.5 | `8a8a7fa5` = frame 2.5 (đối chứng đúng) |
| P-H1 | broken-gap, 2.5 (length-server) | `8a8a7fa5` = frame 2.5 |
| P-H1c (×3) | broken-gap / valid, 2.5 qua nolength | cả 3 đều `seeked@2.5`, hash `8a8a7fa5` = frame 2.5 — **landing-0 KHÔNG tái hiện trong 3 probe pixel này (0/3)** nên pixel của một lần landing-0 thật CHƯA đo được (xem §7.4) |

Kết luận tầng pixel (a): trong mọi dạng hỏng đã thử, chỉ file
cắt đuôi (dữ liệu GOP mất hẳn, moov còn nguyên) cho `seeked`
bắn dù frame đích không còn — và frame hiển thị là frame cũ.
Mọi dạng hỏng khác đều hỏng pipeline trước khi `seeked` kịp bắn.

### 4.3 Frame còn lại SAU LỖI decode (lượt pixel 2, mode=errdraw: 3 probe, 1 kiểm tra, FAIL=0)

Câu hỏi khác F6: khi seek HỎNG (error, không `seeked`), element
có giữ frame đã trình bày không?

| Probe | Luồng | Hash sau lỗi | = frame nào? |
|---|---|---|---|
| P-E1 | var-kf20zero: seek 1.5 đúng trước, rồi seek 2.5 → error 3 | `cdb6c1e3` | **frame 1.5 — frame vừa trình bày** |
| P-E2 | broken-gap: seek 1.5 → error 3 ngay | `d4828fc3` | **frame 0.0 — frame đầu tiên** |
| P-E3 | valid: 1.5→2.5 (đối chứng, không lỗi) | `8a8a7fa5` | frame 2.5 |

Tức Chrome giữ nguyên frame đã trình bày cả khi seek lỗi
(error 3), không chỉ khi `seeked` bắn trên file cắt đuôi. Điểm
khác biệt quan trọng với trường hợp F6: ở đây tầng seek ĐÃ báo
lỗi (error event + `seekElement` timeout, không `seeked`) nên
preview biết seek thất bại — frame cũ hiển thị nhưng không bị
nhận nhầm là frame đích. Chỉ trường hợp cắt đuôi là seek im
lặng báo thành công trong khi frame sai.

## 5. Kết luận: preview có nên thêm kiểm tra pixel vào đường seek?

**KHÔNG — không implement.** Lý do, theo bằng chứng trên:

1. Fail-fast đã đo được (§2): tầng seek (`seekElement` /
   `WrongLandingTracker`) ĐÃ bắt được landing-0 — 3 landing sai
   liên tiếp → fail trong 10–84 ms. Quirk landing-0 không còn
   là "lớp sai vô hình" với tầng seek nữa (nó chỉ vô hình trước
   khi có fixture/server tái hiện được).
2. Lớp sai pixel còn lại chỉ có đúng 1 dạng: file cắt đuôi
   (moov còn nguyên, dữ liệu GOP mất hẳn) — trường hợp biên,
   hiếm gặp với footage thật của user (file hỏng thật thường
   error 3/4 trước khi `seeked` kịp bắn, như §4.2).
3. Kiểm tra pixel trong đường seek nóng tốn kém và có
   false-positive: cần frame tham chiếu theo timestamp (không
   có sẵn rẻ) hoặc so "frame không đổi sau seek" (nội dung tĩnh
   / seek trong cùng frame cũng không đổi → báo sai oan). Lợi
   ích chỉ là bắt 1 trường hợp biên, trong khi đường seek đã
   báo lỗi/timeout cho mọi dạng hỏng còn lại.
4. Không sửa production code (đúng lệnh task: chỉ implement
   nếu bằng chứng ủng hộ — bằng chứng không ủng hộ).

Ghi nhận để đợt sau (không phải cam kết làm): nếu user báo
preview hiển thị sai frame trên file bị cắt đuôi, hướng chẩn
đoán rẻ nhất là kiểm tra `buffered`/`seekable` trước seek
(`seekable=[[0,0]]` đã tương quan 6/6 với landing-0) hoặc kiểm
tra pixel ngoài đường seek (diagnostic, không chặn), chứ không
phải nhét readback vào vòng lặp seek.

## 6. Kiểm chứng gộp của luồng

- Hồi quy test Node (chạy lại độc lập, strip-types): seek
  **15/15**, pauseSeekRecovery43Y2 **9/9**, pause45A2 **14/14**
  — cộng **38/38, fail 0**.
- `npx tsc --noEmit` (apps/web): **30 lỗi, tất cả trong 2 file
  của luồng khác đợt 51** — `src/lib/ttsEstimate51H1.test.ts`
  (10 lỗi TS7006) và `src/lib/ttsEstimate51H2.test.ts` (20 lỗi
  TS7006), đều là file test TTS của luồng H1/H2 đang làm dở —
  KHÔNG phải file của luồng này; luồng này không thêm/sửa file
  `.ts` nào nên không thể gây lỗi tsc mới. Log đầy đủ tại
  `~/workspace/tmp-round51-h3-quirk/tsc-h3.log` (TSC_EXIT=2).
- `node --check` cả 4 harness mới: OK.
- Headed: lượt 1: 34 probe + 3 control PASS; lượt 2 (R10):
  7 probe seekElement + 10 probe raw + 3 probe fresh-instance
  + W6 rerun, 9 kiểm tra FAIL=0; meta155: 8 probe data: URL,
  5 kiểm tra FAIL=0; pixel lượt 1: 22 probe, 4 kiểm tra FAIL=0;
  pixel lượt 2 (errdraw): 3 probe, 1 kiểm tra FAIL=0.
- KHÔNG chạy lại: mọi phép đo browser headed/FPS của các luồng
  khác đợt 51, phiên solo thật, đo IDB thật, Safari / máy thật.

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

MỚI (4 harness + LIMITS này):

- `apps/web/scripts/pause51H3-quirk.mjs` — harness lượt 1:
  13 hướng fixture/mode mới + H1/H1c tái hiện Y2 + W1–W13
  (log lượt 1 đã bị /tmp dọn; số trong LIMITS này).
- `apps/web/scripts/pause51H3-quirk-r10.mjs` — harness lượt 2:
  seekElement fail-fast trên nolength + đo tỉ lệ landing-0 +
  giả thuyết first-fetch + H1b fresh-instance + W6 rerun.
- `apps/web/scripts/pause51H3-meta155-dataurl.mjs` — harness
  binary 155 qua data: URL (policy file + validator + port
  retry + assert version).
- `apps/web/scripts/pause51H3-quirk-pixels.mjs` — harness pixel:
  refs + dạng hỏng mới + tái hiện F6 + nolength + errdraw.
- `docs/PHASE9_ROUND51_H3_FAILFAST_QUIRK_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file `.ts`/`.tsx` production, `store.ts`,
`seek.ts`, `pause45A2.ts`, `tsconfig.json`, paths-loop,
build-loop-log (parent ghi log lượt). Scratch + fixture +
log pixel + log tsc ở `~/workspace/tmp-round51-h3-quirk/`
(persistent — /tmp đã dọn scratch + log các lượt 1/2/meta
giữa các lượt chạy; fixture rebuild được bằng script trong
harness). Không binary nào vào repo (fixture .mp4 chỉ nằm ở
scratch ngoài repo).

## 8. Nợ mở (không mạo nhận đã xong)

1. **Pixel của một lần landing-0 thật chưa đo được** (§4.2):
   3 probe pixel qua nolength đều đáp đúng 2.5 (0/3 trúng
   landing-0; với tỉ lệ ~40% thì 0/3 có xác suất ~22% — không
   lạ). Suy luận "landing-0 hiển thị frame 0.0" (currentTime 0
   + frame 0 decode được) chưa được đo trực tiếp. Đợt sau muốn
   đo thì chạy nhiều probe pixel nolength hơn (≥10) thay vì 3.
2. **Cơ chế seekable=[0,0] là tương quan, chưa phải chứng minh
   nhân quả từ code Chrome** (§2.3): 6/6 ở tầng seekElement +
   nhất quán ở tầng raw, nhưng chưa đọc Chromium source để
   khẳng định đường clamp. Đủ để giải thích Y2 và để chẩn đoán
   (kiểm tra seekable trước seek), chưa đủ để claim "đây là code
   gây ra".
3. **"155 + http chunked" chưa đo trực tiếp** (§3.2): data: URL
   không thay thế được http chunked; đo trực tiếp cần daemon
   chạy binary 155 hoặc đổi policy hệ thống — cả hai đều ngoài
   phạm vi luồng này. Sau §2.3 thì phép đo đó không còn cần
   thiết để giải thích Y2.
4. **W11 raw chưa chạy lại riêng trên fixture đã sửa** (§1.2):
   probe pixel P-W11 (error 3, không `seeked`) đã chứng minh
   hành vi seek của fixture sửa; không chạy lại raw.html riêng
   vì cùng logic trang + cùng kết quả kỳ vọng. Nếu parent muốn
   đủ bộ thì chạy lại 1 probe raw var-lastb-zero 1.9 (dự đoán
   error 3).
5. **/tmp bị dọn giữa các lượt chạy** (§7): log harness lượt 1,
   lượt 2 (R10), meta155 (cả 2 lượt) và scratch /tmp gốc đã mất;
   số liệu chỉ còn trong LIMITS này + log pixel + fixture
   rebuild ở `~/workspace/tmp-round51-h3-quirk/`. Đợt sau nên
   ghi log harness thẳng vào `~/workspace/` thay vì /tmp.
6. **Compat trình duyệt thứ 2 vẫn chưa đo** (không có binary
   Firefox/Safari — như E6 §4.1): mọi số giây/hash trong file
   này vẫn là số của Chromium 155/156 headed dưới Xvfb trên VM
   này.
7. **Số đo under-load:** các lượt đo chạy trong lúc 8–10 luồng
   đợt 51 khác cũng chạy Chrome/build trên cùng VM 2vCPU; thời
   gian tuyệt đối (vd. M2-run1 trên 155 tốn ~103 s) không phải
   baseline quiet — chỉ dùng để so sánh tương đối trong cùng
   lượt.
