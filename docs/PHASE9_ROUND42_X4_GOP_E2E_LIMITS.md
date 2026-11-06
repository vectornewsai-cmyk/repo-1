# Phase 9 đợt 42, luồng X4 — GOP: headed end-to-end + chia sẻ kết quả probe — LIMITS

Ngày: 04/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist vào
batch, KHÔNG đổi ngưỡng 32 MiB, KHÔNG đổi mặc định TẮT của GOP,
KHÔNG mở lại đường > 128 MiB (vẫn khóa, cần đo heap browser headed
riêng — ngoài luồng này). Không tự stage paths-loop hay ghi
build-loop-log (parent gộp).
Đóng nợ đợt 41 §5.5, mục GOP: (a) headed test proxy → probe → GOP →
frame ngược trên canvas; (b) chia sẻ kết quả probe vào T3 (hiện 2
HEAD trùng nhau).

## 0. Kết luận ngắn (không vượt số đo)

1. **Headed thật: proxy chưa biết size → probe → GOP → frame ngược
   vẽ được lên canvas.** File 35,38 MiB (> ngưỡng 32 MiB, giữ
   nguyên), controller GOP bật tường minh, KHÔNG truyền size trước:
   `gopMode = gop-range`, probe `{source: "head", size: 37100156}`,
   0 GET toàn file, vẽ ngược 91 frame, missing 0, canvas 100%
   pixel khác 0. Cửa sổ lặp lại cùng mốc: **0 request / 0 byte** —
   tiết kiệm đúng 1 lần tải toàn file (37.100.156 byte) so với đường
   tải lại. Lượt đầu GOP tốn 101,16% file (thừa ~1,16%) — KHÔNG
   claim tiết kiệm ở lượt đầu, đúng như W4 đã chốt.
2. **2 HEAD trùng nhau đã hết, chứng minh cả ở Node lẫn browser
   headed.** Probe trả thêm `acceptRanges`; T3 nhận `sharedSizeProbe`
   và bỏ HEAD của nó khi size khớp. Controller probe → T3 nay chỉ
   còn đúng 1 HEAD tổng cộng (của probe) — test Node khóa, và log
   headed trên path GOP cũng chỉ có đúng 1 HEAD (trước X4 là 2).
   API cũ nguyên vẹn: không truyền `sharedSizeProbe`, hoặc probe
   lệch size / size không hợp lệ → T3 HEAD lại như cũ.
3. **Mặc định TẮT giữ nguyên, chứng minh headed.** Controller không
   bật GOP trên cùng footage: `gopMode = off`, `probe = null`,
   đúng 1 GET toàn file (37.100.156 byte), vẫn vẽ ngược 91 frame
   missing 0 — đường cũ không vỡ vì X4.

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopSharedProbe42X4.test.ts` — 10 test (§3.1).
- `apps/web/scripts/gop-headed-e2e-42x4.mjs` — harness headed (§3.2).
- `docs/PHASE9_ROUND42_X4_GOP_E2E_LIMITS.md` — file này.

### 1.2 Sửa

- `apps/web/src/lib/gopSizeProbe41W4.ts` — kết quả probe thêm field
  `acceptRanges: string | null` (giá trị `Accept-Ranges` của chính
  response đã cho size: HEAD hoặc Range 0-0; null = response đó
  không báo, không bịa). Không đổi thứ tự probe, không đổi hợp
  đồng throw/chỉ-throw-khi-url-rỗng.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — option mới
  `sharedSizeProbe?: { size, acceptRanges? }` (interface
  `GopSharedSizeProbe`). Khi size hợp lệ (> 0, hữu hạn) VÀ khớp
  `knownSizeBytes` nếu caller có truyền → BỎ HEAD, dùng size +
  `acceptRanges` của probe (null/vắng thì bước tiền tố điền như
  cũ). Không khớp / không hợp lệ / vắng → HEAD lại như cũ, không
  tin size lạ. Không đổi probe 1 KiB, tiền tố 512 KiB, gate, demux,
  chia GOP, hay bất kỳ fallback nào.
- `apps/web/src/lib/reverseWebcodecs.ts` — trong
  `ensureWindowForTime`, probe vừa chạy trong lượt này được truyền
  sang T3 qua `sharedSizeProbe` (biến cục bộ của lượt, không lưu
  thành trạng thái controller — tránh dùng lại probe cũ cho lần T3
  khác). Không đổi ngưỡng V2, gate U2, cổng S4, logic decode-ahead/
  settle-drop, hay getter `gopSizeProbe` (giữ nguyên shape
  `{source, size}` để test cũ không vỡ).
- `apps/web/src/lib/gopSizeProbe41W4.test.ts` — CHỈ sửa 1 kỳ vọng
  của test controller HEAD: HEAD tổng 2 → 1, kèm chú thích "đợt 42
  X4". Đây là hệ quả đúng của việc chia sẻ, không phải nới test:
  206 vẫn 8, 0 GET toàn file, `gop-range` giữ nguyên. Mọi test khác
  của file này không đụng.
- `apps/web/tsconfig.json` — chỉ thêm 1 dòng exclude cho test mới
  (tiền lệ V2/W4: test chạy bằng esbuild, không qua tsc project).

### 1.3 Không đụng (ghi rõ)

`gopCache40V2.ts`, `gopWiring40V2.ts`, `reverseRangeGate38U2.ts`,
`proxy.ts`, `preview.tsx`, ngưỡng 32 MiB / trần 128 MiB / cache GOP
32 MiB, mọi file luồng khác đợt 42. `apps/web/dist/` build lại lúc
kiểm chứng không vào batch theo tiền lệ. Không tự stage paths-loop
hay ghi build-loop-log (parent gộp).

## 2. Kiến trúc chia sẻ probe (đọc kỹ trước khi trích dẫn)

```
ensureWindowForTime(timeSec) — controller chưa biết size, GOP bật:
  → discoverSizeBytes(url)            # 1 HEAD (nguồn head) hoặc Range 0-0
      → size + acceptRanges (cùng response)
  → applyKnownFileSize(size)          # wiring V2 như cũ
  → fetchVideoTrackByGopRange(url, { knownSizeBytes: size,
        sharedSizeProbe: { size, acceptRanges } })
      → size khớp → BỎ HEAD của T3 → probe 1 KiB → tiền tố → moov → GOP
      → size lệch / không hợp lệ → HEAD lại như cũ (fail-safe)
```

Trước X4, controller chưa biết size tốn 2 HEAD (probe 1 + T3 1);
sau X4 còn 1 HEAD. Tổng request lượt đầu trên file headed: 63
(1 HEAD + 62×206 = probe + tiền tố + 60 GOP) thay vì 64. Tiết kiệm
là 1 request nhẹ, không phải tiết kiệm byte lượt đầu — lượt đầu
vẫn ~101,16% file vì T3 fetch mọi GOP; lợi ích byte nằm ở cửa sổ
thứ hai (0 request/0 byte) và fetch bù 1 GOP xa (W4 đã đo 94,9%).

Trường hợp KHÔNG được chia sẻ (cố tình): controller đã biết size
từ đầu (không probe) → T3 vẫn HEAD 1 lần như cũ (test khóa);
không có chuyện "biết size là bỏ HEAD" — bỏ HEAD chỉ khi vừa
probe cùng URL trong cùng lượt. Đây là ranh giới an toàn: size cũ
từ constructor có thể lỗi thời, probe vừa đo thì không.

## 3. Kiểm chứng + số đo thật

### 3.1 Test Node mới + hồi quy (esbuild bundle, như V2/W4)

```
./node_modules/.bin/esbuild apps/web/src/lib/gopSharedProbe42X4.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r42x4.test.cjs \
  && node /tmp/r42x4.test.cjs
```

| Nhóm | Kết quả thật |
|---|---|
| Probe acceptRanges (3) | HEAD có length → `acceptRanges = "bytes"`; HEAD không length → Range 0-0 cho `"bytes"`; HEAD không báo header → `null`, không bịa |
| T3 dùng lại probe (2) | Khớp size + `"bytes"` → 0 HEAD, gop-range 6 GOP, chunk byte-khớp toàn bộ sample; `acceptRanges = null` → vẫn 0 HEAD, gate lấy từ header tiền tố |
| T3 không bỏ HEAD (3) | Probe lệch `knownSizeBytes` → HEAD 1, vẫn gop-range; size 0 → HEAD 1; không truyền probe → HEAD 1 (hồi quy API cũ) |
| Controller (2) | Chưa biết size + probe → gop-range, tổng HEAD đúng 1, 206 = 8, 0 GET toàn file; đã biết size từ đầu (không probe) → T3 vẫn HEAD 1, `gopSizeProbe = null` |

Test mới **10/10** ngay lần chạy đầu (không sửa test sau khi chạy).
Hồi quy chạy lại: W4 `gopSizeProbe41W4` **15/15** (sau khi sửa kỳ
vọng HEAD 2 → 1), T3 `gopRangeFetch39T3` **10/10**, V2 `gopWiring40V2`
**16/16**. `vite build` **pass (5,17 s)**, chỉ cảnh báo chunk
> 500 kB cũ.

Lưu ý tsc (trung thực, không giấu): `tsc --noEmit -p
apps/web/tsconfig.json` tại thời điểm X4 chạy **đỏ**, nhưng 4 lỗi
đều nằm ở file của luồng song song khác đợt 42
(`pauseSeekCap42X2.test.ts` TS5097 + `preview.tsx` 3 biến
`seekFailure*` chưa dùng) — grep toàn bộ output tsc không có lỗi
nào ở file X4 (`gopSharedProbe42X4`, `gopSizeProbe41W4`,
`gopRangeFetch39T3`, `reverseWebcodecs`). X4 không sửa file luồng
khác nên không đụng vào 4 lỗi đó; parent gộp cần chạy lại tsc sau
khi luồng X2 xong việc của họ, không được đọc "tsc đỏ" thành "X4
làm vỡ type".

### 3.2 Headed end-to-end (Chromium headed thật, CDP)

Harness: `node apps/web/scripts/gop-headed-e2e-42x4.mjs [fixture]`
(từ gốc repo; tự bundle lib, không cần vite build/preview nên
không bị HMR reload khi luồng khác sửa file song song).

Giàn đo (để người khác lặp lại được):
- Fixture ffmpeg thật (lệnh chính xác, tạo lại được byte-identical
  — đã kiểm chứng tạo 2 lần cùng size 37.100.156 byte):
  `ffmpeg -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=60"
  -f lavfi -i "sine=frequency=440:duration=60" -map 0:v -map 1:a
  -c:v libx264 -pix_fmt yuv420p -crf 18 -g 30 -bf 3 -c:a aac -b:a
  128k -movflags +faststart headed-bframe-audio.mp4`
  → 60 s, 1800 frame, 1280×720, `has_b_frames = 2` (394 B / 244 P /
  22 I đếm bằng ffprobe ở bản 22 s thử nghiệm; bản 60 s giữ nguyên
  công thức), audio AAC xen kẽ trong mdat (overhead audio trong
  range GOP vì vậy đã nằm trong số đo, không còn là giới hạn "chưa
  đo audio" của W4 cho đường này).
- Server node:http trong harness (2 path cùng 1 file, Range thật,
  log mọi request): HEAD → 200 + `Content-Length` + `Accept-Ranges:
  bytes`; GET Range → 206 + `Content-Range`; GET không Range → 200
  toàn file. Đây là "proxy" ở mức hợp đồng HTTP (URL chưa biết size
  từ đầu, server hỗ trợ Range) — KHÔNG phải bridge Express thật của
  W4; bridge thật đã được W4 đo, harness này đo tầng browser +
  controller, không mạo nhận đã chạy qua bridge.
- Browser: Chromium headed thật từ cache ms-playwright
  (chromium-1248), KHÔNG cờ `--headless`, dưới Xvfb (màn hình ảo —
  ghi rõ, không mạo nhận màn hình vật lý), `--disable-gpu` (render
  phần mềm) + `--no-first-run`. Hai bẫy đã gặp và sửa trong harness
  (ghi để luồng sau khỏi vấp lại):
  1. Không `--disable-gpu` dưới Xvfb này: process Chrome sống nhưng
     `/json/list` rỗng, không mở cổng CDP.
  2. `/json/list` trả nhiều target: `list[0]` là
     `chrome://webui-toolbar`, evaluate chạy sai context nên page
     mãi không ready — harness nay chỉ nhận target `type === "page"`.
- Trong page: controller GOP (`gopRangeEnabled: true`, KHÔNG truyền
  size) `ensureWindowForTime(59.0)` → `presentCachedReverse` vẽ lên
  canvas 1280×720; rồi `ensureWindowForTime(59.0)` lần nữa (pipe
  snapshot log server trước/sau từng bước, không đoán delta từ log
  tổng); rồi controller mặc định (không bật GOP) trên path riêng.

Kết quả (10/10 cổng, JSON đầy đủ tại `/tmp/round42-x4/result.json`
— scratch, không vào batch; fixture cũng chỉ nằm ở scratch):

| Đo | Số thật |
|---|---|
| GOP: gopMode / probe | `gop-range`, probe `{source: "head", size: 37100156}`, `fallback: null`, `ready: true` |
| GOP: request lượt đầu | 63 request = **1 HEAD** (chỉ của probe — T3 HEAD đã bỏ, bằng chứng headed của việc chia sẻ) + 62×206 (probe + tiền tố + 60 GOP); **0 GET toàn file** |
| GOP: byte lượt đầu | 37.528.720 byte = **101,16% file** (thừa ròng 428.564 byte = tiền tố 512 KiB + probe 1 KiB, trừ đi các byte đầu file như moov không nằm trong range GOP — đọc đúng: lượt đầu KHÔNG tiết kiệm) |
| GOP: frame ngược lên canvas | `ensure = true`, **drawn 91, missing 0**, cache 91; canvas **921.600/921.600 pixel khác 0 (100%)** |
| Cửa sổ lặp cùng mốc | **delta 0 request / 0 byte** → tiết kiệm đúng 37.100.156 byte so với tải lại toàn file |
| Mặc định (không bật GOP) | `gopMode = off`, `probe = null`, 1 HEAD + **1 GET toàn file = 37.100.156 byte**, vẽ ngược drawn 91, missing 0, pixel 100% |

Đọc đúng về "91 frame": cửa sổ present mặc định 75 frame, nhưng
decode GOP-aligned từ keyframe nên decode 91 sample (B-frame làm
thứ tự present khác thứ tự decode — đây chính là lý do footage có
B-frame là bằng chứng mạnh hơn testsrc2 không B-frame nặng của W4).
Overhead audio xen kẽ: nằm trong 62 range GOP (range GOP bao cả
byte audio giữa các sample video, như giới hạn T3 đã ghi) — số
101,16% đã bao gồm nó, không tách riêng được từ log HTTP này vì
server chỉ đếm byte range, không đếm byte audio trong range.

### 3.3 Nợ đã đóng / chưa đóng

Đóng trong luồng này: headed proxy → probe → GOP → frame ngược;
chia sẻ probe vào T3 (Node + headed); footage B-frame/audio xen
kẽ cho đường GOP/probe (W4 §5.2); mặc định TẮT giữ nguyên (headed).
Vẫn khóa, không thuộc luồng này: quyết mở lại > 128 MiB (cần đo
heap browser headed riêng trên file 128 MiB+ thật); moov 16 MiB
thật (W4 chỉ chứng minh nhánh bằng override); Safari / máy thật /
màn hình vật lý (toàn bộ headed ở đây là Chromium Linux dưới Xvfb,
render phần mềm); bridge Express thật cho headed (W4 đã đo bridge,
harness này đo tầng browser — muốn nối đủ cả hai cần chạy headed
qua route `/api/proxy/file/:name` của bridge, chưa làm).

## 4. Số đo tóm tắt (để parent trích, không hard-code lại trong code)

- Ngưỡng giữ nguyên: (32 MiB, 128 MiB]; mặc định GOP TẮT; cache GOP
  32 MiB + 32 segment (không đổi).
- Chia sẻ probe: controller chưa biết size nay tốn 1 HEAD (trước: 2);
  T3 bỏ HEAD chỉ khi `sharedSizeProbe` khớp size, còn lại HEAD như cũ.
- Headed, file 35,38 MiB (720p, B-frame, audio AAC): lượt đầu GOP
  63 request / 37.528.720 byte (101,16%), 0 GET toàn file, vẽ ngược
  91 frame missing 0, canvas 100% pixel khác 0; cửa sổ lặp 0 request
  / 0 byte (tiết kiệm 37.100.156 byte); mặc định off: 1 GET toàn file
  + vẽ ngược 91 frame missing 0.

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật.**
   Headed ở đây là Chromium Linux + Xvfb + `--disable-gpu` — đủ để
   chứng minh đường controller/decode/canvas, không đủ để claim
   hiệu năng hay hành vi GPU/Safari.
2. **CHƯA ĐO: file 128 MiB+ và heap browser headed** — quyết mở lại
   > 128 MiB vẫn khóa; cần đo heap snapshot /
   `performance.measureUserAgentSpecificMemory` + bộ nhớ VideoFrame
   trên file lớn thật trước khi bàn đổi trần S4.
3. **CHƯA ĐO: moov > 16 MiB thật** (kế thừa W4: chỉ chứng minh nhánh
   bằng ngưỡng override); **CHƯA ĐO: headed qua bridge Express thật**
   (harness này dùng server node:http tối giản; W4 đo bridge ở tầng
   Node, chưa có lần headed nào đi qua route bridge thật).
4. **CHƯA ĐO: baseline quiet / fps ngược.** Mọi số headed đều
   under-load (các luồng đợt 42 khác đang chạy, trong đó có 1 Chrome
   khác) — cấm dùng làm baseline hiệu năng hay claim fps; số frame
   vẽ được (91) là bằng chứng chức năng, không phải tốc độ.
5. **Harness phụ thuộc fixture ngoài repo:** fixture 37 MB chỉ nằm
   ở `/tmp/round42-x4/` (tmpfs — đã từng bị xóa sạch giữa các lượt,
   phải tạo lại bằng đúng lệnh §3.2); muốn chạy lại harness phải tạo
   fixture trước, script tự fail rõ ràng khi thiếu thay vì bịa số.
   `/tmp` cũng là nơi duy nhất giữ `result.json`, bundle, profile
   Chrome — không thứ nào trong số đó vào batch.
6. **tsc toàn dự án đang đỏ do luồng song song X2** (§3.1): parent
   gộp cần chạy lại tsc sau khi X2 xong, và không được gán 4 lỗi đó
   cho X4 (grep đã chứng minh không lỗi nào ở file X4).

## 6. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopSizeProbe41W4.ts` (sửa: + field `acceptRanges` vào kết quả probe)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (sửa: + `GopSharedSizeProbe` / option `sharedSizeProbe` / nhánh bỏ HEAD)
- `apps/web/src/lib/reverseWebcodecs.ts` (sửa: truyền probe vừa chạy sang T3 trong `ensureWindowForTime`)
- `apps/web/src/lib/gopSharedProbe42X4.test.ts` (mới, 10 test)
- `apps/web/src/lib/gopSizeProbe41W4.test.ts` (sửa: 1 kỳ vọng HEAD 2 → 1 + chú thích X4)
- `apps/web/tsconfig.json` (sửa, chỉ +1 dòng exclude)
- `apps/web/scripts/gop-headed-e2e-42x4.mjs` (mới, harness headed)
- `docs/PHASE9_ROUND42_X4_GOP_E2E_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `/tmp/round42-x4/` (fixture 37 MB,
bundle, page.html, profile Chrome, `result.json`, log debug) —
KHÔNG đưa vào batch.
