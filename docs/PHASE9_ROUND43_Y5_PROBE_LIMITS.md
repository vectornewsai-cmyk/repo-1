# Phase 9 đợt 43, luồng Y5 — Probe chain: Q6 mang perSeek + trần 1000 mẫu trên Chrome thật — LIMITS

Ngày: 04/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào batch,
KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ X5).
KHÔNG chạy phiên solo A/B thật, KHÔNG khóa cổng CPU — hai mục đó
vẫn là nợ mở chờ cửa sổ yên từ main chat (xem §5). Mọi số timing
dưới đây đều under-load (chạy cùng các luồng đợt 43 khác: ffmpeg
113%, tsc, vite build, Chrome của luồng khác — load 3,5–16,6 lúc
chạy) — cấm dùng làm baseline quiet hay claim fps.

Đọc trước: `docs/PHASE9_ROUND42_X5_PROBE_CHAIN_LIMITS.md` §5,
`docs/PHASE9_ROUND40_V1_SOLO_PERSEEK_LIMITS.md` §4.3,
`docs/PHASE9_ROUND42_LIMITS.md` §5.6.

## 0. Kết luận ngắn

1. **Q6 labeled NÊN mang perSeek — và nay đã mang (nợ V1 §4.3
   ĐÃ ĐÓNG).** Quyết định có căn cứ, không phải sửa cho có:
   labeled là file bằng chứng bền, mang đi được của lượt đo, trong
   khi forward-hold chỉ nằm trong scratch phù du của N2 (labeled cũ
   chỉ trỏ tới n2Log); ai chỉ giữ labeled thì mất sạch bằng chứng
   cơ chế, và hai góc nhìn mâu thuẫn nhau (solo present nhưng Q6
   absent). Nguyên tắc của chính protocol Q6 là "mỗi lần đo PHẢI ghi
   kèm, trong cùng 1 file output" — perSeek là bằng chứng cơ chế
   của cùng lượt đo, bỏ nó ra là phá nguyên tắc đó. Chi phí ~0:
   passthrough thuần đối tượng N2 đã tạo, không đo thêm, không đổi
   logic nhãn/fps, không đổi probe/N2/solo/cổng. Phương án tóm tắt
   (chỉ summary) đã bị loại có lý do: summary làm mất mẫu thô cần
   để tái tạo/validate nhãn cơ chế — labeled phải tự chứa bằng
   chứng, không phải con trỏ.
2. **Trần 1000 mẫu ĐÃ CHẠM trên Chrome thật lần đầu tiên (nợ đợt 42
   §5.6 ĐÃ ĐÓNG).** Phiên Chrome thật với mạng nhỏ giọt 64 KiB/s:
   cả 3 entry đều giữ đúng 1000 mẫu, `droppedSeekingSamples`
   339/225/311, entry vẫn chốt `completed` bình thường, validate
   0 problem. Đây là hành vi Chrome thật, không phải vm fake của
   X5 — nhưng là seek dưới mạng chậm (điều kiện thật ngoài đời),
   KHÔNG phải seek local file bình thường; xem §3 để khỏi đọc sai.
3. **Phát hiện đính chính quan trọng (không liên quan code Y5 nhưng
   ảnh hưởng mọi lượt sau): fixture `sparse-gop-noise.mp4` KHÔNG
   phải GOP 300.** Hộp `stss` trong moov ghi đúng 30 sync sample,
   cách nhau đúng 30 frame (1 s) — GOP thật là 30 frame, không phải
   300 như ghi chú K4/W5/X5 vẫn dẫn. Ba mốc seek của phiên cap
   (25/5/15 s) đều rơi đúng keyframe, nên mỗi seek chỉ cần ~2,5 MB
   và giải mã +4 frame — đó là lý do seek nhanh dù nhỏ giọt, không
   phải throttle hỏng (xem §3.3).

## 1. Q6 mang perSeek — thiết kế + tương thích ngược

- Thay đổi duy nhất ở production path của Q6: `buildLabeled` thêm
  khóa top-level `perSeek: n2?.perSeek ?? null` (copy nguyên vẹn,
  KHÔNG pick field — nên 17 trường spec của mỗi entry và các trường
  v2 không thể rơi mất do pick sót). Mọi khóa labeled cũ giữ nguyên
  tên/giá trị (chuỗi thật §2 kiểm tra: 0 khóa cũ thiếu).
- Ngữ nghĩa 3 trạng thái, khóa trong test:
  - `perSeek` là object đầy đủ (entries + mẫu seeking) khi probe bật;
  - `perSeek: null` khi probe tắt hoặc harness cũ không ghi perSeek
    (lượt mới của Q6 luôn có khóa, null = "lượt này không ghi");
  - khóa VẮNG MẶT chỉ gặp ở file labeled cũ (trước Y5) = "không rõ",
    cấm đọc thành probe tắt hay probe bật.
- `buildLabeled` được export thêm (hunk `ROUND43-Y5`) để test seam
  sau này dùng được; nhưng module Q6 vẫn tự chạy mode run khi load
  (hành vi cũ) nên test Y5 đi qua CLI `classify` thật thay vì import
  — classify và run dùng chung `buildLabeled`, và chuỗi thật §2
  chứng minh đường run. Đây là giới hạn test, ghi rõ để luồng sau
  khỏi tưởng export là đủ để import test.
- Solo runner KHÔNG đổi: nó vẫn đọc forward-hold trực tiếp như V1;
  labeled mang perSeek là bằng chứng dự phòng, không phải nguồn mới
  cho solo — tránh hai nguồn truth lệch nhau.

## 2. Chuỗi probe thật solo → Q6 → N2 (Q6 nay present)

Hai lượt chạy chuỗi; lượt 1 (fixture noise, như X5) chết ở phase
ngược do CDP evaluate timeout 120 s dưới tải song song (xem §4);
lượt 2 (fixture flat, cùng 720p/30fps/900 frame, decode nhẹ) thành
công — bằng chứng perSeek không phụ thuộc fixture, chỉ phụ thuộc
đường truyền cờ + copy của Q6.

- Lệnh lượt 2 (attempt 2 của vòng lặp thử lại, attempt 1 cũng chết
  N2 exit 2 dưới tải — xem §4): `N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10
  node apps/web/scripts/per-seek-probe-chain-run.mjs --fixture
  ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 --scratch
  /tmp/round43-y5/chain2 --display :96 --port 4196`.
- Kết quả (đọc từ `/tmp/round43-y5/chain2/probe-chain-evidence.json`
  và `q6-labeled.json`, không vào repo):
  - Q6 labeled: `perSeekFieldInLabeled = "present"`,
    `perSeekEntryCountInLabeled = 41`,
    `perSeekVersionInLabeled = "per-seek-v2"`,
    `q6PerSeekMatchesN2 = true`;
  - `labeled.perSeek` deep-equal đúng `forward-hold.json` perSeek
    (`identical-to-labeled: true`); validate 41/41 entry sạch, 0
    trường spec thiếu, max mẫu/entry trong lượt app này 43,
    `droppedSeekingSamples` max 0 (lượt app không nhỏ giọt — đúng
    kỳ vọng, và khớp max 42 của X5/W5);
  - solo report: `status = present, entryCount = 41`;
    N2 log: `perSeek: 41 entries (reverse 22), counts =
    {seeked-no-draw: 8, completed: 26, unresolved: 2, superseded: 5}`;
  - Q6 exit 1 (do N2 exit 1, PARTIAL — không phải lỗi Q6),
    `loadLabel = under-load`, `frozenDistValidity = VALID`.
- So với X5: cùng tiêu chí CHAIN-OK, nay thêm tầng Q6 present —
  chuỗi solo → Q6 → N2 cho `perSeek present` ở CẢ BA tầng, không
  còn tầng nào absent.

## 3. Trần 1000 mẫu trên Chrome thật (phiên cap)

### 3.1 Thiết kế (Chrome thật, pipeline media thật, chỉ mạng chậm)

Script mới `per-seek-probe-chrome-cap-run.mjs`: trang tối giản độc
lập (chỉ `<video>` + `per-seek-probe-page.js`, không qua app VCut
để khỏi lẫn hold-frame/preview), video phục vụ qua HTTP Range
server nhỏ giọt: range > 256 KiB chảy theo tốc độ đặt, range nhỏ
(moov 6 KiB, probe đầu file) đi ngay. Seek tới vị trí chưa buffer
buộc Chrome chờ đủ byte rồi mới seeked — seeking kéo dài, rAF tick
tích mẫu seeking thật. CDP pipe theo đúng mẫu N2 (getTargets →
createTarget → attach → navigate); 3 lần đầu script chết vì lỗi
harness (socket Xvfb sai đường, pipe thiếu error handler, attach
sai mẫu) — đã sửa theo mẫu N2, không sửa probe hay Chrome.

### 3.2 Kết quả: chạm trần ở cả 3 entry (đợt 2, 64 KiB/s)

| Seek | Seek latency | Mẫu giữ | dropped | Tổng tick | Trạng thái |
|---|---|---|---|---|---|
| 25 s | 38.993 ms | 1000 | 339 | 1339 | completed |
| 5 s | 37.998 ms | 1000 | 225 | 1225 | completed |
| 15 s | 39.404 ms | 1000 | 311 | 1311 | completed |

(Đọc từ `/tmp/round43-y5/cap2/cap-evidence.json` +
`cap-entries.json`.) `validateProblemsTotal = 0`; mẫu giữ là 1000
mẫu đầu, số đếm tràn khớp đúng phần vượt (giữ + đếm = tổng tick,
không mất lặng lẽ — đúng thiết kế X5 đã chứng minh bằng vm, nay
có bằng chứng Chrome thật). Sau trần, entry vẫn chốt `completed`
bình thường, drawLatency chỉ 0–12 ms. Tốc độ mẫu thực tế ~33–35
mẫu/s (rAF dưới tải + display chia sẻ), nên trần 1000 tương đương
~29–30 s seeking trong điều kiện này, không phải 16,7 s ở 60 fps
lý thuyết — ghi rõ để khỏi quy đổi sai.

### 3.3 Đối chiếu đợt 1 (1024 KiB/s) — vì sao chưa chạm, và vì sao đó không phải lỗi throttle

Đợt 1: max 131 mẫu/entry, dropped 0, seek chỉ ~2,8–3,4 s. Lúc đầu
nghi throttle hỏng, nhưng nhật ký range đợt 2 chứng minh ngược
lại: mỗi seek Chrome xin range từ đúng offset mốc seek và đọc
~2.490.368 byte rồi seeked nổ — 2,49 MB / 64 KiB/s ≈ 38 s, khớp
chính xác thời gian seek đợt 2; và 2,49 MB / 1024 KiB/s ≈ 2,4 s,
khớp đợt 1. Throttle hoạt động đúng; seek nhanh ở đợt 1 vì mỗi
seek chỉ cần ~2,5 MB (mốc seek rơi đúng keyframe — xem §0.3) chứ
không cần hàng chục MB như giả thiết GOP 300 ban đầu. Số liệu
phụ: mỗi seek giải mã thêm đúng 4 frame (decoded 0→4→8→12),
`decodedDeltaWhileSeeking` chỉ 2–3 — phù hợp seek trúng keyframe,
không phù hợp giải mã xuôi cả GOP dài.

### 3.4 Giới hạn của kết quả cap (không mạo nhận)

- Trần chạm được NHỜ mạng chậm (64 KiB/s, chậm hơn thực tế dùng
  bình thường). Trên seek local file / mạng nhanh, max vẫn ~42–43
  mẫu/entry (X5, W5, và chuỗi §2) — trần 1000 vẫn là lưới an toàn
  cho trường hợp xấu, không phải ngưỡng thường gặp.
- Trang đo tối giản, không phải app VCut: số này chứng minh hành
  vi probe + Chrome, không chứng minh app VCut sẽ kẹt seek 40 s.
- rAF ~35/s trong phiên này là under-load; trên máy quiet, 1000
  mẫu tương đương ~16,7 s seeking — vẫn chưa đo được trên máy
  quiet (cần cửa sổ yên, như phiên solo).

## 4. Lỗi gặp dọc đường (trung thực, không giấu lần chạy hỏng)

1. **Chain lượt 1 (noise): N2 exit 2, CDP timeout
   `Runtime.evaluate` sau 120 s ở phase ngược** (log
   `/tmp/round43-y5/chain1/q6-n2.log`: import OK, xuôi xong 12 mẫu,
   load trước ngược 3,89, rồi treo tới 01:18:13). Đây là treo dưới
   tải song song (lúc đó ffmpeg luồng khác 113% CPU, chromePre 0 →
   chromePost 19 — Chrome luồng khác mọc giữa lượt), không phải
   lỗi code Y5 (probe đã install, Q6 đã đóng băng dist đúng).
   Evidence lượt này vẫn ghi đủ để chẩn đoán (n2 = null, không
   claim perSeek).
2. **Chain lượt 2 attempt 1: N2 exit 2 tiếp; và attempt đầu tiên
   của vòng lặp chết sớm hơn do race copy dist** — chain script
   `cpSync` toàn bộ `apps/web/dist` trong lúc luồng khác đang build
   lại dist (`ENOENT .../frozen-dist/stickers`). Đây là race có sẵn
   của chain script dưới đợt nhiều luồng (X5 không gặp vì lúc đó
   ít build chồng nhau hơn), không phải lỗi Y5; vòng lặp thử lại
   đã vượt qua ở attempt 2. Đề xuất cho luồng sau: copy dist có
   retry, hoặc đợi cửa sổ không build — không sửa trong Y5 để khỏi
   động vào đường đo của X5 khi chưa cần.
3. **Cap script chết 3 lần trước khi chạy được** (socket Xvfb sai
   `/tmp/.X<num>-Xvfb` thay vì `/tmp/.X11-unix/X<num>`; pipe CDP
   thiếu error handler nên Chrome chết sớm thành crash
   `ECONNRESET`; attach sai mẫu `setDiscoverTargets` thay vì
   getTargets → createTarget → attach của N2). Tất cả đều là lỗi
   harness mới của Y5, đã sửa và chạy sạch sau đó; không số đo nào
   từ 3 lần chết được dùng.

## 5. Kiểm chứng đã chạy (lệnh + số thật)

- `node --check` cho cả 3 script sửa/mới → pass.
- Test: `node --test` 4 file → **54/54 pass, 0 fail** (Q6 mới 4/4,
  probe 21/21, solo 16/16, gate v3 13/13 — đúng số đợt 42 cộng 4
  test Y5 mới).
- Chuỗi thật §2: CHAIN-OK, `q6PerSeekMatchesN2 = true`.
- Cap thật §3: đợt 1 max 131 mẫu/entry (chưa chạm), đợt 2 chạm
  trần 1000 ở 3/3 entry, dropped 339/225/311, validate 0 problem.

## 6. Cái gì CHƯA làm (nợ còn lại — không mạo nhận)

1. **Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat** (nợ gốc, giữ nguyên từ đợt 42
   §5.1): kiểm tra `perSeekProbe.status` lượt đầu (nay có cơ sở
   kỳ vọng `present` cả ở tầng Q6, không chỉ solo), chạy wrapper
   X6 → U4 đầy đủ rồi mới quyết khóa/sửa/loại ngưỡng CPU; quy tắc
   nhãn §4.3 của W5 vẫn là ứng viên, mẫu flat vẫn 0 lần trên Chrome
   thật (phiên cap này toàn `rising`).
2. **Trần 1000 trên máy quiet / trong app VCut thật vẫn chưa đo:**
   cap chứng minh bằng trang tối giản + mạng chậm; seek 40 s trong
   app VCut dưới mạng chậm, và seek kẹt trên máy quiet, vẫn chưa
   có số.
3. **Ghi chú K4/W5/X5 về "GOP 300" cần đính chính ở tài liệu gốc:**
   Y5 chỉ đính chính trong file này (§0.3); các LIMITS cũ vẫn ghi
   GOP 300 — luồng sau sửa tài liệu cũ hoặc ghi chú đính chính tập
   trung, Y5 không sửa file của luồng khác.
4. **Race copy frozen-dist của chain script** (§4.2) — cần retry
   hoặc cửa sổ không build; để luồng sở hữu chain script quyết.
5. **Nợ đứng chung:** Safari / máy thật / footage B-frame / đường
   WebCodecs (probe mù) — vẫn chưa đo.

## 7. File đổi/thêm (chỉ của Y5 — text, không binary, không dist)

- Sửa: `apps/web/scripts/probe-round34-q6-measure-protocol.mjs`
  (header Y5 + `perSeek` passthrough trong `buildLabeled` + export
  `buildLabeled`; mọi hunk đều có marker `ROUND43-Y5`).
- Sửa: `apps/web/scripts/per-seek-probe-chain-run.mjs`
  (header + tầng Q6 ghi 3 trạng thái present/present-null/absent +
  `perSeekEntryCountInLabeled` + `q6PerSeekMatchesN2`; hunk
  `ROUND43-Y5`; không đổi tiêu chí chainVerdict cũ).
- Mới: `apps/web/scripts/probe-round34-q6-measure-protocol.test.mjs`
  (4 test Y5 qua CLI classify + seam solo→Q6).
- Mới: `apps/web/scripts/per-seek-probe-chrome-cap-run.mjs`
  (harness Chrome thật + server Range nhỏ giọt cho trần 1000).
- Mới: `docs/PHASE9_ROUND43_Y5_PROBE_LIMITS.md` (file này).
- Không sửa: probe trang v2, module phân tích, harness N2, solo
  runner, cổng v2/v3, code sản phẩm, paths-loop, build-loop-log.
  Không push, không tag, không stage batch (theo lệnh luồng).
  Scratch ngoài repo (không stage): `/tmp/round43-y5/` (chain1
  hỏng, chain2 thành công, cap1, cap2 + log attempt).
