# Phase 9 đợt 52, luồng I8 — LIMITS: pixel landing-0 đủ mẫu + nhân quả seekable

Ngày: 06–07/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ thêm 1 harness + LIMITS này; production code
KHÔNG đổi — không phát hiện bug sản phẩm nào cần sửa (xem §6). Mọi số
dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ, không mạo
nhận. Mọi số timing đều under-load (8–10 luồng đợt 52 chạy song song
trên VM 2vCPU), và lượt 1 bị VM restart cắt giữa chừng (xem §7).

Nối nợ đợt 51 H3 (docs/PHASE9_ROUND51_H3_FAILFAST_QUIRK_LIMITS.md
§2.3, §4.3; docs/PHASE9_ROUND51_LIMITS.md §2.3, §4.3):
- Nợ 1 (§8.1 H3): pixel của một lần landing-0 thật chưa đo được
  (3 probe pixel nolength đều đáp đúng, 0/3 trúng landing-0).
- Nợ 2 (§8.2 H3): cơ chế seekable=[0,0] mới là tương quan 6/6,
  chưa phải nhân quả.
- Nợ 3 (§8.3 H3): "155 + http chunked" chưa đo trực tiếp.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Pixel của landing-0 thật ĐÃ ĐO ĐƯỢC — 24/24 là frame 0.0
   (§2).** 46 probe pixel qua server không Content-Length
   (broken-gap + valid-gop): landing-0 xảy ra 24/46 (≈52%),
   và mọi lần landing-0 đều hiển thị đúng frame 0.0
   (hash `d4828fc3`, 24/24); mọi lần đáp đúng 2.5 đều hiển thị
   frame 2.5 (hash `8a8a7fa5`, 22/22). Suy luận của H3 ("landing-0
   hiển thị frame 0.0") nay đã có bằng chứng trực tiếp.
2. **Nhân quả seekable MẠNH HƠN NHIỀU so với tương quan 6/6 của
   H3 (§3) — nhưng vẫn là nhân quả ở mức hành vi, chưa phải
   chứng minh từ code Chromium.** Phân tách hoàn hảo mở rộng
   thành **56/56** (preSeekable `[[0,0]]` ⟺ landing-0,
   `[[0,3]]` ⟺ đáp đúng). Can thiệp chờ 12 s KHÔNG cứu được:
   seekable không tự xác định theo thời gian trong 6/10 tab
   (dính ở `[0,0]` suốt 12 s rồi vẫn đáp 0) — loại trừ giả
   thuyết "chỉ là race nhất thời, đợi thêm là hết". Liều-đáp
   ứng: seek ngay tại loadedmetadata → landing-0 10/16 (62,5%),
   cao hơn seek ở 3 s (gap 5/10, valid 3/10). Đường clamp cụ
   thể trong source Chromium vẫn chưa đọc — không claim.
3. **"155 + http chunked" VẪN CHƯA ĐO ĐƯỢC hành vi seek (§4),
   nhưng bản thân sự chặn đã được đo kỹ: 70/70 lần navigate tới
   loopback bị chặn** (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`)
   trên binary 155.0.8059.91 — cả với `127.0.0.1` lẫn `localhost`,
   cả với cờ chuẩn lẫn cờ tắt `BlockInsecurePrivateNetworkRequests`.
   Cần daemon chạy binary này hoặc đổi policy hệ thống — ngoài
   phạm vi, như H3 đã kết luận.
4. **KHÔNG thêm kiểm tra pixel vào đường seek (§6)** — giữ
   nguyên kết luận H3. Bằng chứng mới không đổi cán cân chi
   phí/lợi ích: tầng seek đã bắt được landing-0 (fail-fast H3
   §2), còn kiểm tra pixel trong đường seek nóng vẫn đắt và
   dễ false-positive. Điểm mới: bằng chứng nay chỉ ra biện pháp
   rẻ hơn — **kiểm tra `seekable` trước khi seek** (phân tách
   56/56) — ghi làm đề xuất cho đợt sau, KHÔNG implement ở đây
   (cần quyết định sản phẩm: fail/retry/đổi element khi gặp
   `[0,0]`, và arm W cho thấy đợi 12 s không cứu được 6/10).
5. **Hồi quy (§7):** seek 15/15, pauseSeekRecovery43Y2 9/9,
   pause45A2 14/14 (38/38). `tsc --noEmit` sạch (0 lỗi).

## 1. Phương pháp

Harness: `apps/web/scripts/pause52I8-seek-pixel.mjs` (mẫu H3:
Xvfb + chromium-1248 156.0.8078.4 + cờ C3, tab mới mỗi probe,
drawImage 160×90, hash FNV-1a + mean RGB). Fixture copy từ
scratch H3 (`~/workspace/tmp-round51-h3-quirk/`), md5 đã verify
khớp H3 §1: valid-gop `2c2e4771954fd26e1c377ce5900e377d`,
broken-gap `f0e11b602e714246466f6936e58afcd1`. Scratch + log lượt
này ở `~/workspace/tmp-round52-i8-seek-pixel/` (KHÔNG /tmp —
bài học đợt 51 §4.10; lượt 1 bị VM restart cắt ngang nhưng log
vẫn còn nguyên nhờ ở ~/workspace).

Server (1 server, 2 đường — biến duy nhất là Content-Length,
như H3): `/media/` đặt Content-Length; `/media-nolength/` không
đặt (Node tự dùng Transfer-Encoding: chunked khi pipe — đúng
kiểu serve43 của Y2). Range header bỏ qua (trả 200 toàn file).

Trang probe (`pixel.html`, viết bởi harness): ghi `preSeek`
ngay trước khi gán `currentTime` (seeking, readyState,
currentTime, buffered, seekable), ghi `atSeeked`, drawImage
sau `seeked` 500 ms (hash + mean), ghi `atDraw` (snapshot sau
draw — thêm ở lượt 2 để xem seekable có tự hết `[0,0]` sau
seek không). Ba mode seek:
- `std`: seek ở 3 s sau load (giống H3, để so sánh được).
- `wait` (can thiệp): poll seekable mỗi 100 ms từ
  loadedmetadata, seek ngay khi seekable end ≥ 2.9, tối đa 12 s
  rồi seek dù sao (ghi `waitMs`, `waitTimedOut`).
- `immediate` (liều-đáp ứng): seek ngay trong handler
  loadedmetadata.

Đối chứng phương pháp (lượt 1): ref valid 0.0 → `d4828fc3`
mean [121,106,126]; valid 2.5 → `8a8a7fa5` mean [122,106,126]
— trùng hệt H3 §4.1. Target mọi arm: seek tới 2.5.

## 2. Pixel landing-0 — ĐO ĐƯỢC (Chrome 156)

### 2.1 Bảng tổng hợp arm (156.0.8078.4)

| Arm | Server / file / mode | n | Landing-0 | Pixel landing-0 = frame 0.0 (`d4828fc3`) | Đáp đúng 2.5 | Pixel đáp đúng = frame 2.5 (`8a8a7fa5`) |
|---|---|---|---|---|---|---|
| L | CÓ Length / broken-gap / std 3 s | 10 | **0/10** | — | 10/10 | 10/10 |
| B | nolength / broken-gap / std 3 s | 10 | **5/10** | 5/5 | 5/10 | 5/5 |
| C | nolength / valid-gop / std 3 s | 10 | **3/10** | 3/3 | 7/10 | 7/7 |
| W | nolength / broken-gap / wait-seekable | 10 | **6/10** | 6/6 | 4/10 | 4/4 |
| E | nolength / broken-gap / immediate | 16 | **10/16 (62,5%)** | 10/10 | 6/16 | 6/6 |

Gộp nolength: **46 probe pixel, landing-0 24/46 (≈52%)**;
pixel landing-0 = frame 0.0: **24/24**; pixel đáp đúng =
frame 2.5: **22/22**. Không có lần nào landing-0 hiển thị
frame khác 0.0, không có lần nào đáp đúng hiển thị frame khác
2.5. Nợ H3 §8.1 ĐÃ ĐÓNG.

Gộp std ở 3 s (B+C): landing-0 8/20 = 40% — khớp tỉ lệ
~40–44% của H3 (gap 4/9, valid 2/5). Không có mâu thuẫn giữa
hai đợt.

### 2.2 Chi tiết từng arm

**Arm L (đối chứng CÓ Content-Length):** 10/10 `seeked@2.500`,
hash `8a8a7fa5`, preSeekable `[[0,3]]`, preBuffered `[[0,3]]`
cả 10. Server có Content-Length không bao giờ sinh landing-0
— đối chứng sạch, khớp H3.

**Arm B (nolength, gap, 3 s):** landing-0 ở run 1, 2, 4, 5, 6;
đáp đúng ở run 3, 7, 8, 9, 10. Mọi lần landing-0 đều có
preSeekable `[[0,0]]` + preBuffered `[[0,2.367]]`; mọi lần đáp
đúng đều có preSeekable `[[0,3]]` + preBuffered `[[0,3]]`.
Phân tách 10/10. (Về `buffered` dừng đúng ở 2.367: xem §5.3 —
chưa giải thích được.)

**Arm C (nolength, valid, 3 s):** landing-0 ở run 1, 2, 3
(file lành cũng đáp 0, như H3); đáp đúng run 4–10. Cùng mẫu
phân tách 10/10 như arm B, kể cả `buffered [[0,2.367]]` ở các
lần đáp 0 — tức cutoff 2.367 không phải do nội dung file hỏng.

**Arm W (can thiệp chờ):** `waitMs` = 12100, 101, 12100, 12100,
12001, 154, 12001, 12052, 101, 101. 6 lần chờ tới timeout 12 s
(seekable không bao giờ đạt 2.9) → seek dù sao với
preSeekable `[[0,0]]` → đáp 0 cả 6, pixel frame 0.0 cả 6.
4 lần seekable thành `[0,3]` sau chỉ 101–154 ms → đáp đúng
cả 4, pixel frame 2.5 cả 4. **Đợi không cứu được khi trạng
thái đã dính ở `[0,0]`** (xem §3.2).

**Arm E (immediate):** lượt 1: 6 probe → đáp 0 ở run 1–4,
đáp đúng run 5–6; lượt 2: 10 probe → đáp 0 ở run 1, 2, 4, 5,
6, 7, đáp đúng run 3, 8, 9, 10. Tổng 10/16 đáp 0. Ở các lần
đáp 0, preBuffered tại loadedmetadata chỉ là `[]` (2 lần),
`[0,0.1]` (6 lần), `[0,0.233]` (2 lần) — tức seek xảy ra khi
gần như chưa buffer gì. atDrawSeekable (chỉ lượt 2 ghi):
`[[0,0]]` ở 6/6 lần đáp 0, `[[0,3]]` ở 4/4 lần đáp đúng —
**seekable vẫn `[0,0]` cả sau khi `seeked@0` đã bắn + 500 ms**,
không tự hồi phục sau seek.

## 3. Nhân quả seekable=[0,0] — mạnh hơn tương quan, chưa phải code Chrome

### 3.1 Phân tách hoàn hảo mở rộng: 56/56

Trên toàn bộ 56 probe 156 (L 10 + B 10 + C 10 + W 10 + E 16):
mọi lần landing-0 (24) đều có preSeekable `[[0,0]]`, mọi lần
đáp đúng (32) đều có preSeekable `[[0,3]]` (end ≥ 2.9). Không
có ngoại lệ nào, trên cả file lành lẫn file hỏng, cả 3 mode
seek. H3 có 6/6 ở tầng seekElement; I8 có 56/56 ở tầng
seek + pixel (trong đó 46/46 ở đường nolength).

### 3.2 Can thiệp chờ (arm W): loại trừ "race nhất thời"

Giả thuyết cạnh tranh: seekable `[0,0]` chỉ là trạng thái
chuyển tiếp — đợi thêm vài giây là nó thành `[0,3]` rồi seek
sẽ đúng. Arm W bác trực tiếp: trong 6/10 tab, sau 12 s poll
liên tục seekable vẫn `[0,0]`; seek sau đó vẫn đáp 0. Trạng
thái seekable được quyết định sớm (trước/tại loadedmetadata —
arm E cho thấy có tab đã `[0,3]` ngay tại metadata, có tab
`[0,0]` từ đầu) và **dính** suốt vòng đời tab, không tự hết
theo thời gian. Điều này cũng giải thích vì sao H3 thấy tỉ lệ
flaky ~40% theo từng tab chứ không theo từng lần fetch
(giả thuyết first-fetch đã bị H3 bác).

### 3.3 Liều-đáp ứng (arm E so với arm B/C)

Seek càng sớm (seekable càng chưa xác định) → tỉ lệ landing-0
càng cao: immediate 10/16 (62,5%) > std gap 5/10 (50%) >
std valid 3/10 (30%). Chênh lệch immediate vs std là nhỏ
(62,5% so với 50% trên cùng file gap) nên liều-đáp ứng chỉ là
bằng chứng phụ; bằng chứng chính vẫn là phân tách 56/56 +
tính dính của trạng thái (§3.2).

### 3.4 Kết luận nhân quả — ghi đúng mức

**Được khẳng định (mức hành vi):** trạng thái `seekable` tại
thời điểm seek quyết định landing: seek khi seekable là
`[0,0]` thì đáp 0; seek khi đã là `[0,3]` thì đáp đúng.
Đã loại trừ các giả thuyết cạnh tranh đã kiểm tra được:
fixture hỏng (file lành cũng đáp 0), binary Chrome (cùng
156, chỉ đổi server), cache/first-fetch (H3 đã bác), race
nhất thời tự hết (arm W đã bác).

**Chưa khẳng định (mức code Chromium):** đường clamp cụ thể
trong source Chromium (hàm nào clamp seek về đầu range khi
seekable chưa xác định) vẫn chưa đọc. Suy luận cơ chế của H3
vẫn đứng và nay có thêm 3 điểm khớp: `seeking@0.000`
(currentTime đã là 0 ngay khi seeking bắn — clamp tại lúc
gán, không phải đáp sai sau decode), pixel = frame 0.0
(24/24), seekable vẫn `[0,0]` sau khi seeked (atDraw).
Nhưng đó vẫn là suy luận từ số đo, không phải trích dẫn code.

Nói gọn để trích dẫn: **"nhân quả ở mức hành vi, tương quan
hoàn hảo 56/56 + 2 can thiệp ủng hộ; chưa chứng minh ở mức
source Chromium."**

## 4. "155 + http chunked" — VẪN CHƯA ĐO ĐƯỢC HÀNH VI SEEK

"155" = binary meta-chromium 155.0.8059.91 (`/opt/meta-chromium/
chrome`) + server HTTP chunked (không Content-Length), seek trên
broken-gap.mp4. H3 chỉ đo 155 qua data: URL (fully-buffered).

Kết quả lượt này: binary khởi động được qua CDP (version
`155.0.8059.91` đã assert), policy validator in lại
`hatch-webgl-all-origins-v1 sha256=8097045f…` — **nhưng mọi
lần navigate tới trang probe loopback đều bị chặn**:

| Lượt chạy | Host | Cờ | Kết quả navigate |
|---|---|---|---|
| 3 (lần 1) | 127.0.0.1 | chuẩn + policy | 14/14 chặn |
| 4 (lần 1 + lần 2) | 127.0.0.1 | chuẩn, rồi + `--disable-features=BlockInsecurePrivateNetworkRequests` | 28/28 chặn |
| 5 (lần 1 + lần 2) | localhost | chuẩn, rồi + cờ PNA như trên | 28/28 chặn |

Tổng **70/70 lần navigate bị chặn**, lỗi duy nhất:
`net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`, 0 probe tới
được trang. Cờ tắt `BlockInsecurePrivateNetworkRequests` KHÔNG
mở được (lần 2 vẫn 14/14 chặn) — tức sự chặn không nằm ở
feature-flag đó, mà ở policy/check khác của build này (D3 §4.2
đã chẩn đoán chặn loopback khi chạy tay; nay tái hiện cả qua
CDP, cả 2 host, cả 2 bộ cờ).

**Kết luận:** hành vi seek của "155 + http chunked" vẫn là
**NOT_MEASURED**. Đường còn lại: nhờ browser-daemon chạy binary
này với policy/cờ riêng của nó, hoặc đổi policy hệ thống
(`/etc/opt/chrome`) — cả hai đều ngoài phạm vi luồng này, như
H3 đã kết luận. Nợ H3 §8.3 vẫn mở, nhưng nay đã đo được sự
chặn một cách đầy đủ (70/70) thay vì chỉ chẩn đoán tay.

## 5. Quan sát phụ (ghi nhận, không giải thích vội)

### 5.1 `buffered` dừng đúng ở 2.367 trong mọi lần đáp 0 (mode std)

Ở arm B/C/W, mọi lần landing-0 ở mode std đều có preBuffered
`[[0,2.367]]` chính xác (không phải 2.36 hay 2.37), trên cả
file lành lẫn file hỏng; mọi lần đáp đúng đều `[0,3]`. 2.367
≈ frame 71/30fps. Chưa rõ 2.367 là biên gì (không phải biên
GOP: GOP 30 frame → biên 2.0/3.0; không phải do nội dung file
vì valid cũng vậy). Ghi nhận để đợt sau: có thể liên quan tới
cách Chrome fetch/parse response chunked không Content-Length,
nhưng chưa đo thêm (cần soi network/fetch, ngoài nhiệm vụ).

### 5.2 `seekable` sau seek không hồi phục

atDrawSeekable (lượt 2, arm E): `[[0,0]]` ở 6/6 lần đáp 0 —
sau khi `seeked@0` đã bắn 500 ms, seekable vẫn chưa xác định.
Người dùng bấm seek lại trên cùng element có thể vẫn đáp 0
nếu không load lại — khớp hành vi Y2 §3.4 (seek lại không cứu
được element) ở khía cạnh trạng thái dính, dù cơ chế khác.

## 6. Có nên thêm kiểm tra pixel vào đường seek? — KHÔNG (giữ H3)

Bằng chứng mới **không đổi** kết luận của H3, vì:

1. Tầng seek đã bắt được landing-0: fail-fast `seekElement`
   (H3 §2) fail sau đúng 3 landing sai liên tiếp trong 10–84 ms.
   Pixel chỉ phát hiện thêm được cùng một lỗi đó, không thêm
   lớp lỗi mới nào ở đường seek nóng (quirk pixel còn lại duy
   nhất vẫn là file cắt đuôi — H3 §4 — ngoài đường landing-0).
2. Kiểm tra pixel trong đường seek nóng vẫn đắt và dễ
   false-positive: cần frame tham chiếu theo timestamp (không
   có sẵn rẻ) hoặc heuristic "frame không đổi sau seek" (nội
   dung tĩnh / seek trong cùng frame cũng không đổi → báo sai
   oan). Bằng chứng mới (landing-0 luôn là frame 0.0) chỉ cho
   thấy pixel *phát hiện được*, không làm nó *rẻ* hay *chắc*.
3. Bằng chứng mới chỉ ra biện pháp rẻ hơn và đúng chỗ hơn:
   **kiểm tra `seekable` trước khi seek** — phân tách 56/56,
   không tốn readback. Đề xuất cho đợt sau (KHÔNG implement ở
   đây — không đổi production code theo lệnh task, và còn câu
   hỏi thiết kế mở): khi pre-seek thấy `seekable=[[0,0]]` thì
   nên fail-fast / thử load lại element / báo lỗi, chứ không
   seek mù rồi đợi fail-fast đếm 3 lần sai. Lưu ý từ arm W:
   đợi 12 s không cứu được 6/10, nên "đợi seekable" không phải
   chiến lược khắc phục đáng tin — cần hành động khác (fail
   nhanh hoặc reload), không phải đợi lâu hơn.

Không sửa production code trong luồng này (đúng lệnh task:
chỉ sửa tối thiểu nếu probe phát hiện bug thật — probe không
phát hiện bug sản phẩm, chỉ đặc tả hành vi Chrome/server).

## 7. Kiểm chứng gộp của luồng

- Hồi quy test Node (chạy lại độc lập): seek **15/15**,
  pauseSeekRecovery43Y2 **9/9**, pause45A2 **14/14** — cộng
  **38/38, fail 0**. pause45A2 bundle ra scratch ~/workspace
  (không dùng /tmp).
- `npx tsc --noEmit` (apps/web): **sạch, exit 0** — 30 lỗi
  file TTS của luồng khác đợt 51 (H3 §6) đã không còn trong cây
  hiện tại; luồng này không thêm/sửa file `.ts` nào.
- `node --check` harness mới: OK.
- Headed 156: 58 probe (2 ref + L 10 + B 10 + C 10 + W 10 +
  E 16), 0 lỗi harness; 155: 70 lần navigate đều bị chặn
  (xem §4), 0 probe tới được trang.
- **Sự cố môi trường:** lượt 1 bị VM/container restart cắt
  ngang ở E-run6 (~17:53 UTC; `uptime` sau đó báo "up 1 min").
  Không mất dữ liệu probe nào: log ở `~/workspace/` còn nguyên;
  arm E chạy bù ở lượt 2 (10 probe mới), arm 155 chạy ở lượt
  3–5. Tổng số probe 156 đã gộp cả 2 lượt chạy E.
- KHÔNG chạy lại: mọi phép đo browser headed/FPS của các luồng
  khác đợt 52, phiên solo thật, đo IDB thật, Safari / máy thật.

## 8. Bug harness tự tìm ra trong lúc làm (đã sửa, ghi để đợt sau khỏi lặp)

1. Lượt 2: filter `I8_ARMS` áp cả cho arm 155 → browser 155
   khởi động xong nhưng 0 probe chạy (log "bỏ qua arm M155…").
   Đã sửa: cờ `applyArmsFilter` chỉ áp cho arm 156.
2. `summarize()` phân loại pixel bằng ref đo được trong lượt —
   ở lượt chạy bù không có ref thì `pixelFrame0OnLanding0`
   báo 0/6 oan (log thô cho thấy 6/6 là `d4828fc3`). Đã sửa:
   dùng hằng `REF0_HASH`/`REF25_HASH` đã kiểm chứng ở lượt 1;
   CONTROL vẫn đo lại ref khi chạy đủ bộ.
3. Nhánh retry cờ PNA của H3 là dead code trong thực tế: lỗi
   probe không ném (runArm bắt từng probe) nên điều kiện retry
   theo exception không bao giờ đúng. Đã sửa: đếm
   probed/blocked từ results rồi mới retry (lượt 4–5).
4. Log message cuối harness ghi cứng tên file results; đã sửa
   dùng `I8_RESULTS`.

## 9. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

MỚI (1 harness + LIMITS này):

- `apps/web/scripts/pause52I8-seek-pixel.mjs` — harness: 5 arm
  156 (ref/L/B/C/W/E) + 2 lượt 155 (cờ chuẩn + cờ PNA) +
  host `127.0.0.1`/`localhost` (env `I8_HOST`); env
  `I8_ARMS`/`I8_N`/`I8_RESULTS`/`I8_155_PNA` để chạy bù.
- `docs/PHASE9_ROUND52_I8_SEEK_PIXEL_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file `.ts`/`.tsx` production, `store.ts`,
`seek.ts`, `pause45A2.ts`, `tsconfig.json`, paths-loop,
build-loop-log (parent ghi log lượt). Scratch + fixture +
log + results JSON ở `~/workspace/tmp-round52-i8-seek-pixel/`
(run1–run5.log, i8-results-run2/3/4/5.json, parse scripts,
pixel.html, webgl-policy.txt). Không binary nào vào repo
(fixture .mp4 chỉ nằm ở scratch ngoài repo).

## 10. Nợ mở (không mạo nhận đã xong)

1. **"155 + http chunked" vẫn NOT_MEASURED** (§4): 70/70
   navigate bị chặn; cần daemon hoặc đổi policy hệ thống.
2. **Đường clamp trong source Chromium chưa đọc** (§3.4):
   nhân quả mới ở mức hành vi; ai cần khẳng định mức code thì
   đọc Chromium source (media pipeline / HTMLMediaElement seek
   clamp theo seekable).
3. **Cutoff `buffered [[0,2.367]]` chưa giải thích** (§5.1):
   xuất hiện trong mọi lần đáp 0 ở mode std, cả file lành.
4. **Guard `seekable` pre-seek chưa implement** (§6.3): đề xuất
   cho đợt sau, cần quyết định sản phẩm (fail/retry/reload khi
   gặp `[0,0]`).
5. **Compat trình duyệt thứ 2 vẫn chưa đo** (không có binary
   Firefox/Safari — như H3 §8.6): mọi số/hash trong file này
   vẫn là số của Chromium 155/156 headed dưới Xvfb trên VM này.
6. **Số đo under-load + 1 lần VM restart giữa chừng** (§7):
   thời gian tuyệt đối không phải baseline quiet — chỉ dùng để
   so sánh tương đối trong cùng lượt.
