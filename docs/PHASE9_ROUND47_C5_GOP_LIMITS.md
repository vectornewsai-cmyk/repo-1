# Phase 9 đợt 47, luồng C5 — GOP trailing/moov — LIMITS

Ngày: 05/11/2026 (giờ +07). TIẾP TỤC sau daemon restart: lượt chạy
trước của luồng này bị giết giữa chừng, KHÔNG có báo cáo cuối. Việc
đã làm vẫn còn trên đĩa đã được kiểm tra trước khi làm tiếp — phần
code udta + test C5 + mặc định bật GOP + toggle TopBar đều đã có
sẵn trên đĩa từ lượt trước; lượt này chỉ hoàn thiện phần còn dở:
chạy test + hồi quy, fixture encode thật, headed, LIMITS này.
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist
vào batch. Trần wiring 128 MiB / trần moov 16 MiB / tiền tố mặc
định 512 KiB GIỮ NGUYÊN. Gate U2 GIỮ NGUYÊN. Không tự stage
paths-loop hay ghi build-loop-log (parent gộp, như tiền lệ B4).
Đóng nợ B4 §7.2 (udta), §7.3 (hậu tố ngoài cửa sổ đuôi), §7.5
(file trailing 37 MiB encode thật — ĐÃ ĐO, xem §2), §7.6 (app UI
mặc định bật GOP + click-test app thật — ĐÃ ĐO, xem §5).
Fragmented: đo LẠI, kết luận giữ nguyên như B4 (KHÔNG hỗ trợ).

## 0. Kết luận ngắn (không vượt số đo)

1. **Moov + hậu tố `udta` sau moov nay ra gop-range.** Allowlist
   của `trailingSuffixValid` mở từ `free`/`skip`/`wide` sang thêm
   `udta`, đối xử đúng như `free` (chỉ kiểm tra header + size nằm
   gọn, chuỗi đi đúng tới EOF; không kiểm tra payload — payload
   udta là metadata người dùng tùy ý, có thể không đi thành cây
   box con). `udta` không mang sample và không nằm trong sample
   table mà demux dựng từ moov; T3 chỉ cắt đúng byte moov rồi
   demux nên byte hậu tố không bao giờ tới demux. Hậu tố khác
   (`mdat`/`moof`/chuỗi vỡ) vẫn fallback — test khóa từng cái.
2. **Hậu tố ngoài cửa sổ đuôi 16 MiB: QUYẾT GIỮ cửa sổ, không mở
   rộng.** Bằng chứng đo thật (§4): free trailer 17 MiB sau moov
   đẩy moov bắt đầu trước `tailStart` 1.048.640 byte; cửa sổ cần
   để thấy moov là 17.825.856 byte (> 16 MiB). Mở cửa sổ là tăng
   ngân sách fetch đuôi + RAM transient cho padding bệnh lý, trong
   khi hành vi hiện tại là fallback an toàn (T3 full-file, 0 GOP,
   0 sai dữ liệu). Không đề xuất số mới nào.
3. **Fragmented vẫn KHÔNG hỗ trợ, đo lại bằng fixture mới.**
   File fragmented thật (ffmpeg `empty_moov` + `moof`, top boxes
   `ftyp,moov,moof,mdat,…,mfra`) qua T3 vẫn fallback
   `demux-moov: track không có sample`, 0 GOP — cùng kết luận B4,
   cần parser moof mới (tfhd/tfdt/trun/mfra), không phải nhánh gate.
4. **File trailing 37 MiB ENCODE THẬT (không pad): ĐÃ ĐO, 15/15
   cổng pass.** Fixture 38.996.431 byte (37,19 MiB), 1280×720,
   30 fps, 72 s, 2160 frame, `-g 30` → 72 GOP, KHÔNG faststart,
   KHÔNG pad — mọi byte đều là sample/mdat thật. Qua controller
   wiring + vite :5173 → bridge :8787 thật: `gopMode=gop-range`,
   decode cửa sổ thật thành công
   (`ensureWindowForTime(0)=true`, `cacheSize=1`), T3 trực tiếp
   2160 sample / 72 GOP / chunk byte-khớp (38.971.744 byte),
   0 GET toàn file ở cả 2 phase (76 + 76 request). Lần chạy đầu
   ăn 429 ở phase T3 do rate-limit bridge chia sẻ (xem §2.2) —
   T3 fallback an toàn; lần pass đã chờ 65 s reset cửa sổ rate.
   Server dùng ké của luồng khác đợt 47 (cùng code, cùng cổng)
   vì cổng bận — ghi rõ ở §2.4.
5. **App UI mặc định BẬT GOP: ĐÃ ĐO trên app thật.** Toggle TopBar
   "Phát ngược WebCodecs (GOP)" trên profile Chrome mới: mặc định
   `aria-pressed=true`, localStorage `vcut-reverse-webcodecs`
   = null (chưa set = bật), class `tbtn play`; bấm 1 lần →
   `false` + localStorage `"0"`; bấm lần 2 → `true` + `"1"`.
   Click-test 4/4 cổng pass (§5). Đường nối đã có sẵn: preview
   chỉ gọi WebCodecs khi `resolveReverseEngine() === "webcodecs"`
   (mặc định bật từ C5) và luôn truyền `{ gopRangeEnabled: true }`
   cho controller — nên file trong (32, 128] MiB dùng GOP Range
   ngay từ lần phát ngược đầu tiên, không cần bật tay.

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopTail47C5.test.ts` — 11 test (§6; đã có sẵn
  trên đĩa từ lượt trước, lượt này chạy + kiểm chứng).
- `apps/web/scripts/gopHeaded47C5.mjs` — harness headed mới của
  lượt này: fixture encode thật (§2) + click-test app thật (§5).
- `docs/PHASE9_ROUND47_C5_GOP_LIMITS.md` — file này.

### 1.2 Sửa (marker ROUND47-C5, đã có sẵn trên đĩa từ lượt trước)

- `apps/web/src/lib/gopTail45A4.ts` — allowlist
  `trailingSuffixValid` thêm `udta`; cập nhật comment module +
  comment cửa 1 + giới hạn cố tình. Không đổi 3 cửa gốc, trần,
  hay thứ tự chọn ứng viên (vẫn start nhỏ nhất).
- `apps/web/src/lib/reversePlayback.ts` — `readReverseWebcodecsOptIn`
  mặc định BẬT ở browser (localStorage vắng → `true`; cờ console
  tường minh thắng; không window → TẮT để test Node cũ không đổi
  hành vi); `setReverseWebcodecsOptIn` ghi cả localStorage lẫn cờ
  window; thêm `REVERSE_WEBCODECS_STORAGE_KEY`.
- `apps/web/src/TopBar.tsx` — toggle "Phát ngược WebCodecs (GOP)"
  (`data-testid="reverse-webcodecs-toggle"`, `aria-pressed`,
  class `play` khi bật; title Việt trực tiếp, chưa thêm key i18n
  — xem nợ §7.4).
- `apps/web/src/lib/reversePreviewGate.ts` — CHỈ comment đầu file
  (ghi nhận mặc định bật từ C5); không đổi luật cổng nào.
  (Comment này đã có sẵn trên đĩa từ lượt trước; ghi rõ để
  parent đối chiếu baseline không tưởng là sửa luật.)
- `apps/web/tsconfig.json` — +1 dòng exclude
  `src/lib/gopTail47C5.test.ts` (cùng mẫu A4/B4; đã có sẵn trên
  đĩa từ lượt trước).

### 1.3 Không đụng (ghi rõ)

`reverseRangeGate38U2.ts` (gate nguyên vẹn — quyết giữ),
`gopRangeFetch39T3.ts` (không đổi code — udta chỉ cần tail-scan,
T3 dùng lại đường cũ), `gopSizeProbe41W4.ts`,
`gopCache40V2.ts`, `reverseWebcodecs.ts` (controller nguyên vẹn —
headed dùng đúng wiring sẵn có, preview đã truyền
`gopRangeEnabled: true` từ V2), `preview.tsx` (không đổi — đã nối
sẵn từ V2 + gate `resolveReverseEngine()`),
`server/bridge/src/index.js` (chỉ chạy code thật, không sửa),
mọi file luồng khác đợt 47. Không tự stage paths-loop hay ghi
build-loop-log (parent gộp).

## 2. Headed qua vite :5173 → bridge :8787 thật + controller wiring

### 2.1 Giàn đo

Harness `gopHeaded47C5.mjs` (kế thừa B4, khác 2 điểm quyết định):
- Fixture ENCODE THẬT, không pad: ffmpeg testsrc2 1280×720
  30 fps 72 s, `-g 30`, crf 18, preset veryfast, KHÔNG faststart.
  Lần encode thăm dò 45 s ra 24.401.745 byte (23,27 MiB — DƯỚI
  ngưỡng wiring 32 MiB nên không dùng được); 72 s ra đúng
  38.996.431 byte (37,19 MiB). Script tự encode; nếu encode ra
  ngoài (32, 128] MiB thì in NOT-MEASURED và thoát mã 2 — KHÔNG
  pad thêm để ép số (pad là điều B4 đã làm, C5 cấm lặp lại).
- Click-test app thật (§5) trên cùng harness: mở app VCut ở
  `http://127.0.0.1:5173/` bằng Chrome profile mới.
- Bridge THẬT nguyên vẹn trên cổng 8787 (mặc định production),
  work-dir trong scratch, `BRIDGE_RATE_GENERAL=5000`. Vite dev
  THẬT trên cổng 5173. Page + bundle test đặt TẠM vào
  `apps/web/public/` trong lúc chạy và XÓA SẠCH trong `finally`.
  Nếu cổng 5173/8787 đã có server khác, harness in NOT-MEASURED
  và thoát mã 2, không chiếm cổng người dùng (đúng điều này đã
  xảy ra ở lần chạy đầu — xem §2.4).
- Kế toán CDP Network tách phase bằng mốc (controller, rồi T3
  trực tiếp). "Full-file GET" = GET không có header Range.

### 2.2 Số đo thật (fixture encode thật) — 15/15 cổng pass

| Đo | Số thật |
|---|---|
| Fixture | ffmpeg testsrc2 1280×720 30 fps 72 s, `-g 30`, crf 18: **38.996.431 byte (37,19 MiB)**, boxes `ftyp,free,mdat,moov` (moov cuối, start 38.971.792), tiền tố 512 KiB mặc định không thấy moov, trong (32, 128] MiB = true; ffprobe video `nb_frames=2160`, duration 72 s, 1280×720 |
| Bridge trực tiếp | HEAD → 200 + `Content-Length: 38996431` + `Accept-Ranges: bytes`; Range 0-0 → 206 + `Content-Range: bytes 0-0/38996431` |
| Page origin | `http://127.0.0.1:5173` (vite thật) |
| CORS từ page | HEAD 200 đọc được `Accept-Ranges: bytes`; Range 0-0 206 đọc được `Content-Range: bytes 0-0/38996431` từ JS |
| Controller phase | `gopMode=gop-range`, `ready=true`, `fallbackReason=null`; `ensureWindowForTime(0)=true`, `cacheSize=1`, `retained=539570` (decode thật bằng VideoDecoder của Chrome, không chỉ demux) |
| Controller phase: request (CDP) | **76 request, 0 GET toàn file**: HEAD, probe `0-1023`, prefix `0-524287`, tail `22219215-38996430` (đúng 16 MiB cuối), GOP×72 (`48-539617` … `38438669-38971791`) |
| T3 trực tiếp (phase riêng) | mode `gop-range`, sampleCount **2160** (= ffprobe nb_frames), gopCount **72**, chunk bytes tổng **38.971.744** = sample bytes **38.971.744** |
| T3 trực tiếp: request | kinds `head,probe,prefix,tail,gop×72`; CDP phase T3: 76 request, 0 GET toàn file; tail ranges `[[22219215,38996430]]` |

Lưu ý kế toán (trung thực, không giấu):
- Controller + T3 đều fetch CẢ 72 GOP ngay lượt đầu (như B4 đã
  ghi: T3 fetch mọi GOP ngay lượt đầu dù cửa sổ decode chỉ cần
  GOP đầu) — đây là hành vi hiện tại của T3, không phải "chỉ
  tải GOP cần thiết". Lợi ích tiết kiệm byte của đường GOP ở cỡ
  này đến từ việc không tải moov + header thừa (tail 16 MiB +
  prefix + GOP ≈ 16,5 MiB request so với 37,19 MiB toàn file),
  nhưng tail 16 MiB là chi phí cố định của đường này.
- Lần chạy harness đầu (trước lần pass) gặp đúng lỗi đã lường
  trước ở chế độ SHARED: phase T3 ăn `429` giữa chừng
  (`gop-status-429: server không trả 206 cho Range
  19516819-20056090`) vì bridge chia sẻ có rate-limit mặc định
  120/phút và 2 phase cộng lại ~152 request trong < 1 phút.
  T3 fallback an toàn về full-file (0 sai dữ liệu). Lần chạy
  pass đã chờ 65 s giữa 2 phase cho cửa sổ rate reset (xem
  §2.4). Đây là bằng chứng sống: rate-limit của bridge là có
  thật và T3 xử lý 429 bằng fallback, không crash.

### 2.3 Hai giới hạn trung thực của số headed này

- Toàn bộ headed là Chromium Linux + Xvfb + render phần mềm,
  under-load (nhiều luồng đợt 47 chạy song song) — cấm dùng làm
  baseline quiet hay claim fps; số frame/GOP là bằng chứng chức
  năng + wiring, không phải tốc độ.
- Chưa đo: Safari, máy thật, màn hình vật lý, GPU thật, baseline
  quiet / fps.

### 2.4 Tình trạng chạy headed (TRUNG THỰC — đã chạy xong ở chế độ SHARED)

Lần chạy harness đầu tiên (07:29) thoát NOT-MEASURED mã 2:
`cổng 5173 (vite) đã có server khác trả 200 — không chạy đè`.
Kiểm tra lúc đó: vite pid 2570 (`vite --port 5173 --strictPort
--host 127.0.0.1`, cwd `apps/web`, chạy từ 07:06) và bridge pid
2633 (`server/bridge/src/index.js --port 8787`, chạy từ 07:06,
work dir mặc định `/tmp/vcut-bridge-jobs`) đều thuộc các luồng
khác đợt 47 đang chạy (C4 TTS vẫn ghi `results.jsonl` lúc 07:27;
Chrome của C3/C6 vẫn chạy lúc 07:26–07:27). Lượt này đã chờ 10
phút (07:29–07:39) mà cổng vẫn bận, nên chuyển sang chế độ
SHARED của harness (`C5_USE_SHARED_SERVERS=1`, ghi rõ trong
script): dùng đúng vite :5173 + bridge :8787 ĐANG CHẠY (cùng code
production `server/bridge/src/index.js` nguyên vẹn, cùng cổng,
cùng URL), không spawn/kill server; fixture chỉ copy tạm vào
thư mục proxies mặc định của bridge
(`/tmp/vcut-bridge-jobs/proxies/trail-c5.mp4`) rồi XÓA trong
`finally` (đã kiểm tra sau chạy: thư mục rỗng, `public/` sạch).
Page/bundle test tạm trong `public/` (tên `__c5-…` duy nhất) cũng
được vite đang chạy serve rồi xóa sạch.
- Khác biệt duy nhất so với giàn B4: tiến trình server do luồng
  khác khởi động, không phải do harness spawn; và bridge chia sẻ
  dùng rate-limit MẶC ĐỊNH 120/phút (không phải
  `BRIDGE_RATE_GENERAL=5000` như harness tự spawn). Lần chạy
  SHARED đầu gặp 429 ở phase T3 (xem lưu ý §2.2); lần chạy pass
  đã chờ 65 s giữa 2 phase. Không có bằng chứng nào cho thấy
  request của C5 làm nhiễu luồng khác: C4 không còn drive qua
  bridge từ 07:29 (trước khi C5 chạy SHARED), bridge log không
  có 429 nào ngoài 2 lần của chính C5, và fixture tạm đã xóa.
- Phase B (click-test app thật) ĐÃ đo được ngay trên vite :5173
  đang chạy đó — chỉ bằng GET đọc (không sửa server, không chiếm
  cổng) — 4/4 cổng pass, xem §5. Fixture encode thật có sẵn tại
  `~/scratch-round47-c5/trailing-real37.mp4` (KHÔNG đưa vào repo,
  không đưa vào batch). Muốn chạy lại harness ở chế độ chuẩn
  (tự spawn server) thì chạy `node
  apps/web/scripts/gopHeaded47C5.mjs` khi cổng 5173/8787 rảnh;
  chạy lại ở chế độ SHARED thì thêm
  `C5_USE_SHARED_SERVERS=1`.

## 3. Kết quả xử lý có căn cứ cho 3 trường hợp nợ B4

### 3.1 (a) Moov + hậu tố `udta` sau moov — SỬA CODE, có test

Luật mới trong `trailingSuffixValid` (C5): allowlist thêm `udta`,
đối xử đúng như `free`/`skip`/`wide` — mỗi box header đủ + size
nằm gọn trong phần còn lại, chuỗi kết thúc đúng ở EOF, ít nhất
1 box; `size == 0` chỉ hợp lệ khi là box cuối; largesize
(size==1 + 64-bit) được hỗ trợ như các type khác. Vì sao an toàn:
- `udta` top-level là metadata người dùng (ISO BMFF user data —
  vd ©xyz, tên tác giả, meta tùy writer), không mang sample và
  không nằm trong sample table mà demux dựng từ moov. T3 chỉ cắt
  đúng byte moov rồi demux nên byte hậu tố không bao giờ tới
  demux — demux vẫn là cửa cuối (moov parse lỗi → fallback).
- Payload udta KHÔNG kiểm tra (có thể là bất kỳ metadata nào,
  kể cả chuỗi không đi thành cây box con — giống hệt payload
  của `free`): test khóa dùng payload `0xAB` cố tình không đi
  thành cây box để khóa tính chất này.
- Chuỗi phải parse sạch tới EOF: chuỗi giả trong mdat muốn lọt
  phải tự chế cả moov (mvhd+trak hợp lệ) lẫn chuỗi hậu tố hợp
  lệ — cùng mức chế tác như giới hạn A4/B4 đã ghi, và demux vẫn
  chặn. Các trường hợp vẫn fallback (có test khóa từng cái): hậu
  tố `mdat` sau `udta`, `udta` vỡ (size khai vượt phần còn lại).
- Test T3: trailing thật + `udta` 24 byte sau moov, tiền tố 4096
  → gop-range, 6 GOP, 60 sample, chunk byte-khớp file gốc, tail
  1, moov 0, GOP 6, 0 GET toàn file.

### 3.2 (b) Hậu tố ngoài cửa sổ đuôi 16 MiB — QUYẾT GIỮ, có test khóa + số đo

Quyết giữ cửa sổ đuôi 16 MiB (= trần moov), không mở rộng, với
bằng chứng đo thật (không phải "chưa làm nên giữ"):
- **Số đo thuần:** file 18.025.888 byte (moov + free trailer
  17 MiB sau moov): moov bắt đầu ở 200.032, `tailStart` =
  1.248.672 → moov bắt đầu trước cửa sổ **1.048.640 byte**; cửa
  sổ cần để thấy moov là **17.825.856 byte** (> 16.777.216 byte).
- **Số đo T3:** cùng họ file ở cỡ lớn hơn (file 18.118.582 byte,
  free trailer 17 MiB sau moov, tiền tố 4096) → T3 full-file, lý
  do `tail-scan-no-candidate`, 0 GOP, chỉ tốn 1 request tail
  16 MiB (`1341366–18118581`); cửa sổ cần để thấy moov là
  17.827.271 byte.
- **Lý do giữ:** free trailer > 16 MiB là padding bệnh lý, không
  phải file thực tế mà đường GOP phục vụ; mở cửa sổ là tăng ngân
  sách fetch đuôi + RAM transient cho mọi file trailing để cứu một
  họ file bệnh lý, trong khi hành vi hiện tại là fallback an
  toàn (tải toàn file — đường cũ — không sai dữ liệu, chỉ mất
  lợi ích tiết kiệm byte). Mở cửa sổ chỉ nên bàn lại khi có file
  thật (không phải fixture chế) có trailer lớn + đo RAM transient
  — đợt này không đề xuất số mới nào.

### 3.3 (c) File fragmented — đo LẠI, kết luận giữ nguyên KHÔNG HỖ TRỢ

Khảo sát lại bằng fixture mới (ffmpeg `-movflags
+frag_keyframe+empty_moov+default_base_moof`, 2 s, 320×240,
`-g 10`, file 93.356 byte). Box top-level đo được:
`ftyp,moov,moof,mdat,moof,mdat,moof,mdat,moof,mdat,moof,mdat,moof,mdat,mfra`
(giống hệt B4). T3 trên file này (tiền tố mặc định, Range thật):
full-file, lý do `demux-moov: track không có sample`, 0 GOP.
- Vì sao không thể "cứu" bằng gate/tail-scan: như B4 §3.3 —
  sample của fragmented không nằm trong sample table của moov mà
  nằm rải trong từng `moof` (`traf`/`trun` + `mdat` sau nó). Muốn
  dựng range GOP phải viết parser moof mới — một demux mới, không
  phải một nhánh gate. Nằm ngoài phạm vi luồng C5 và không được
  làm ẩu dưới danh nghĩa "hỗ trợ fragmented".
- Hành vi hiện tại là đúng: fallback về tải toàn file (đường cũ
  cũng dùng cùng demux nên cũng không decode được fragmented —
  đây là giới hạn của cả preview, không riêng đường GOP).

## 4. Trần 128 MiB + trần moov 16 MiB + gate U2 — giữ nguyên, không bằng chứng mới

C5 không thêm bằng chứng nào cho 3 điều kiện đợt 42 (T3 vẫn fetch
mọi GOP ngay lượt đầu; VideoFrame native tách riêng vẫn chưa đo;
cửa sổ quiet vẫn chưa có — mọi số headed đều under-load). Tail-scan
udta chỉ cứu thêm một lớp file trong trần hiện có, như B4. Gate U2
cho file trailing nhỏ giữ nguyên theo quyết B4 §4 (tỉ lệ
sample/file 0,9835 — GOP chỉ bớt 1,65%; wiring vẫn below-threshold
nên đổi gate không cứu đường production nào). Không đề xuất trần
hay gate mới nào.

## 5. App UI mặc định bật GOP + click-test app thật

### 5.1 Đường nối mặc định bật (code đã có sẵn trên đĩa từ lượt trước)

- `readReverseWebcodecsOptIn()` (browser): cờ console tường minh
  thắng → localStorage `vcut-reverse-webcodecs` (`"0"` = tắt,
  `"1"` hoặc vắng = bật) → không có window (Node/test) → TẮT.
  localStorage lỗi (private mode) → BẬT.
- `preview.tsx` chỉ gọi WebCodecs khi `resolveReverseEngine() ===
  "webcodecs"` (mặc định bật từ C5) và luôn truyền
  `{ gopRangeEnabled: true }` cho controller ở cả 2 điểm gọi
  (draw + badge) — từ V2, C5 không đổi. Nên file trong
  (32, 128] MiB dùng GOP Range ngay từ lần phát ngược đầu tiên.
- Toggle TopBar (`data-testid="reverse-webcodecs-toggle"`):
  `useState(readReverseWebcodecsOptIn)` làm giá trị khởi tạo nên
  nút hiển thị đúng trạng thái thật ngay lần render đầu;
  `aria-pressed` + class `play` khi bật; click ghi cả localStorage
  lẫn cờ window nên preview đọc ngay ở tick stepping kế tiếp,
  không cần reload. Tắt thì preview ngược rơi về đường
  element-seek cũ; mọi fallback vẫn nguyên vẹn.

### 5.2 Click-test thật trên app (4/4 cổng pass)

Chạy bằng probe tạm `/tmp/c5-apptest.mjs` (KHÔNG vào repo) trên
vite :5173 thật đang chạy (của luồng khác đợt 47 — chỉ GET đọc,
không chiếm cổng, không sửa server) + Chrome headed thật (Xvfb,
profile MỚI trong `~/scratch-round47-c5/c5-app-profile`):

| Cổng | Kết quả thật |
|---|---|
| app-toggle-present | PASS — nút toggle xuất hiện trên app thật |
| app-toggle-default-on | PASS — profile mới: `aria-pressed=true`, localStorage `vcut-reverse-webcodecs=null`, class `tbtn play` (mặc định BẬT = chưa set cờ, nút sáng) |
| app-toggle-click-off | PASS — sau 1 click: `aria-pressed=false`, localStorage=`"0"` |
| app-toggle-click-on | PASS — sau click thứ 2: `aria-pressed=true`, localStorage=`"1"` |

Probe thêm (không phải cổng PASS): trong page app,
`window.__vcutReverseWebcodecs=true` và `VideoDecoder` có sẵn —
đường WebCodecs đủ điều kiện chạy. Lưu ý trung thực: click-test
này chứng minh toggle mặc định + phản hồi click trên app thật,
KHÔNG chứng minh một project có clip lớn phát ngược thật trong
app dùng GOP (đường đó đã được chứng minh ở tầng controller +
T3 qua harness §2, và preview nối đúng 2 điểm gọi có sẵn từ V2
— nhưng chưa có một lần chạy end-to-end "mở file 37 MiB trong
app → bật phát ngược → thấy frame" nào; đó vẫn là nợ, xem §7.2).

## 6. Kiểm chứng + hồi quy

```
# Test mới C5 (esbuild bundle, định dạng esm — như A4/B4)
./node_modules/.bin/esbuild apps/web/src/lib/gopTail47C5.test.ts \
  --bundle --platform=node --format=esm --outfile=/tmp/r47c5.test.mjs \
  && node /tmp/r47c5.test.mjs
# Hồi quy (esbuild bundle, format esm)
./node_modules/.bin/esbuild apps/web/src/lib/<tên>.test.ts \
  --bundle --platform=node --format=esm --outfile=/tmp/r47c5-reg-<tên>.mjs \
  && node /tmp/r47c5-reg-<tên>.mjs
# Headed (vite :5173 + bridge :8787 thật)
node apps/web/scripts/gopHeaded47C5.mjs
```

| Nhóm | Kết quả thật |
|---|---|
| C5 mới `gopTail47C5` | **11/11** (6 pure udta + 1 pure giữ-cửa-sổ + 1 T3 udta + 1 T3 giữ-cửa-sổ + 1 fragmented đo lại + 1 opt-in Node) |
| Hồi quy A4 `gopTail45A4` | **18/18** |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** |
| Hồi quy Z4 `gopMoovHeader44Z4` | **19/19** |
| Hồi quy Y4 `gopMoovLarge43Y4` | **10/10** |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** |
| Hồi quy V2 `gopWiring40V2` | **16/16** |
| Hồi quy U2 `reverseRangeGate38U2` | **20/20** |
| Hồi quy B4 `gopTail46B4` | **13/13** |
| Headed C5 `gopHeaded47C5` | **15/15** (bridge 2 + page 2 + controller 3 + T3 4 + click-test app 4; §2 + §5) — lần chạy đầu 12/15 do 429 rate-limit ở phase T3 (đã sửa bằng chờ 65 s + siết gate + sửa parse ffprobe) |
| `tsc --noEmit -p apps/web/tsconfig.json` | **Sạch, exit 0** (lần chạy 2; lần chạy 1 thấy 1 lỗi `store.ts:174 TS6133 projectGeneration` — đó là file của luồng C1 đang sửa dở lúc đó, không thuộc C5; chạy lại sau thì sạch — xem §7.7) |
| `vite build` (từ `apps/web/`, outDir /tmp) | **pass (36,71 s)**, chỉ cảnh báo chunk > 500 kB cũ |

Lưu ý chạy hồi quy (để khỏi vấp lại): lần chạy đầu của B4 đã vấp
lỗi đuôi `.mjs` vs `.cjs` — C5 chạy tất cả bằng esm + đuôi `.mjs`
nên không vấp. Lệnh `tsc` đo mã thoát phải chạy KHÔNG qua pipe
(`tsc > file; echo $?`) — lần đầu C5 đo qua `| head` nên mã thoát
đọc được là của `head`, không phải của `tsc`.

## 7. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA MỞ: trần 128 MiB và trần moov 16 MiB giữ nguyên** (§4).
   Muốn bàn lại vẫn cần đủ 3 điều kiện đợt 42 + file thật vượt
   trần + đo RAM transient.
2. **CHƯA ĐO: end-to-end trong app thật với file lớn.** Chưa có
   lần chạy "mở file 37 MiB trong app → bật phát ngược → thấy
   frame ngược" nào. Click-test §5 chứng minh toggle + mặc định;
   harness §2 chứng minh controller + T3 qua wiring — nhưng nối
   2 tầng đó trong app đầy đủ (project thật, clip reverse thật)
   vẫn chưa được đo.
3. **CHƯA LÀM: key i18n cho toggle TopBar.** Toggle dùng title
   Việt trực tiếp (như nút "Phát ngược" K4) để khỏi xung đột file
   i18n với luồng khác đợt 47; cần đợt riêng thêm key vi + en
   (parity đếm lúc đó).
4. **CHƯA LÀM: file fragmented** (§3.3) — cần parser moof mới
   (tfhd/tfdt/trun/mfra), không phải nhánh gate.
5. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật,
   baseline quiet / fps.** Toàn bộ headed ở đây là Chromium
   Linux + Xvfb + render phần mềm, under-load.
6. **Harness phụ thuộc fixture ngoài repo:** fixture headed chỉ
   nằm ở `~/scratch-round47-c5/` (mp4 encode thật + bundle/page/
   profile Chrome + bridge work-dir — KHÔNG đưa vào batch); muốn
   chạy lại harness thì script tự tạo fixture bằng ffmpeg, không
   cần file sẵn. Test Node dùng fixture trong os.tmpdir(), cũng
   không vào repo. Muốn chạy lại ở chế độ chuẩn (tự spawn server)
   thì chạy `node apps/web/scripts/gopHeaded47C5.mjs` khi cổng
   5173/8787 rảnh; chế độ SHARED thì thêm
   `C5_USE_SHARED_SERVERS=1`.
7. **Quan sát xuyên luồng (không thuộc C5):** lần chạy `tsc` đầu
   của C5 thấy 1 lỗi ở `store.ts:174` (`projectGeneration` của
   luồng C1 — vá race loadSample B1 §6.2) trong khi file
   `store.ts` đang được sửa dở (mtime 07:23); chạy lại thì tsc
   sạch exit 0. C5 không đụng `store.ts`. Các luồng song song
   cùng đợt nên tránh chạy `tsc` toàn dự án trong lúc luồng khác
   đang sửa file chung, hoặc chấp nhận lỗi thoáng qua rồi chạy
   lại để xác nhận.

## 8. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopTail47C5.test.ts` (mới, 11 test — đã có
  sẵn trên đĩa từ lượt trước, lượt này chạy + kiểm chứng)
- `apps/web/scripts/gopHeaded47C5.mjs` (mới, harness headed vite
  :5173 → bridge :8787 + click-test app thật)
- `apps/web/src/lib/gopTail45A4.ts` (sửa: allowlist `udta` +
  comment; marker ROUND47-C5 — đã có sẵn trên đĩa từ lượt trước)
- `apps/web/src/lib/reversePlayback.ts` (sửa: mặc định BẬT ở
  browser + `setReverseWebcodecsOptIn` + key localStorage; marker
  ROUND47-C5 — đã có sẵn trên đĩa từ lượt trước)
- `apps/web/src/TopBar.tsx` (sửa: toggle WebCodecs GOP; marker
  ROUND47-C5 — đã có sẵn trên đĩa từ lượt trước)
- `apps/web/src/lib/reversePreviewGate.ts` (sửa: CHỈ comment đầu
  file; marker ROUND47-C5 — đã có sẵn trên đĩa từ lượt trước)
- `apps/web/tsconfig.json` (sửa: +1 dòng exclude
  `src/lib/gopTail47C5.test.ts` — đã có sẵn trên đĩa từ lượt trước)
- `docs/PHASE9_ROUND47_C5_GOP_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/scratch-round47-c5/` (fixture headed
encode thật, bundle/page/profile Chrome, bridge work-dir — KHÔNG
đưa vào batch). Probe tạm `/tmp/c5-apptest.mjs` cũng ngoài repo,
không đưa vào batch.
