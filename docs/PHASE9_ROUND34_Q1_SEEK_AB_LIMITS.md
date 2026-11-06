# Phase 9 đợt 34, luồng Q1 — A/B `seekElement` đóng dư fps ngược thưa ~20% — LIMITS

Ngày: 01/11/2026 (giờ +07; log harness ghi UTC 13:21–13:26).
KHÔNG push, KHÔNG release/tag, KHÔNG binary vào repo, KHÔNG code giả.
Luồng này KHÔNG sửa code sản phẩm vĩnh viễn, KHÔNG đụng
`reverseWebcodecs.ts`, `previewRafHook.ts`, `reversePlayback.ts`,
i18n, bridge. Đọc trước khi làm:
`docs/PHASE9_ROUND33_LIMITS.md` §3 mục 1 và
`docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md` §7.7.

## 0. Kết luận ngắn (kèm số liệu, không đoán)

**Dư thưa ~20% (quiet retry 6,85–7,21, tv 7,09 so với 1 điểm N2 8,97)
KHÔNG phải do settle-wait của retry-loop.** Bằng chứng:

1. **Cặp matched quiet-ish duy nhất (liền nhau, cùng điều kiện):**
   retry-4 = **6,02** fps (fwd 1,008, rAF ngược P50 4,6 ms, 0 gap
   > 100 ms exclFirst) vs single-4 = **6,18** fps (fwd 0,998, rAF
   ngược P50 4,4 ms, 0 gap > 100 ms exclFirst) — chênh **+2,7%**,
   cùng cỡ với độ lặp lại của chính retry (retry-3 5,83 → retry-4
   6,02 = +3,2%). Một chi phí settle-wait hệ thống 20% phải hiện
   ra ở đây dưới dạng single cao hơn retry ~20%; nó không có.
2. **A/B 3+3 dưới tải song song:** trung vị retry **1,99** vs
   single **1,80** (chênh +10,5% theo hướng NGƯỢC — retry cao hơn),
   trung bình 3,04 vs 2,71. Tỉ số từng cặp xen kẽ đổi dấu:
   2,21× (retry thắng), 0,24× (single thắng), 3,24× (retry thắng)
   — dấu hiệu nhiễu tranh tài nguyên áp đảo, không phải hiệu ứng
   biến thể.
3. **Phương sai lượt-lượt áp đảo hiệu ứng cần đo:** 8 lượt cùng
   video, cùng harness, chỉ đổi bundle seek, cho 0,90–6,18 fps
   (gấp ~6,9×). Một điểm đơn N2 8,97 (n=1) nằm trong vùng nhiễu
   này và cao hơn cả mức quiet-ish tốt nhất đo được ở đây (6,18)
   tới 45%. Vì vậy **giả thuyết (b) — phương sai của điểm N2 n=1
   (cộng với trôi cây/bundle giữa đợt 31 và nay) — là lời giải
   thích phù hợp nhất với số liệu.** Không claim "đã chứng minh
   8,97 là nhiễu": chứng minh chặt cần quiet 3+3 (xem nợ §6.1),
   nhưng A/B này loại bỏ giả thuyết (a) ở mức hiệu ứng lớn (~20%).

Hệ quả thực tiễn: **KHÔNG revert `seekElement`** (đúng như P5 §7.3
đã dặn); đường sửa đúng cho 30 fps ngược vẫn là WebCodecs.
Số quiet-ish mới của cây đợt 34 (retry 5,83–6,02) thấp hơn quiet
đợt 33 (6,85–7,21) — xem §5.3 về trôi cây, không phải hồi quy
do seek (A/B cùng cây cho thấy seek không gây ra nó).

## 1. Phương pháp A/B (thiết kế để chỉ còn 1 biến khác nhau)

- **Harness y nguyên đợt 31 N2:**
  `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
  (không sửa 1 dòng). Video y nguyên đợt 28/31/33:
  `~/workspace/tmp-round27-k4/sparse-gop-flat.mp4` (GOP 300,
  1280×720, 30 s, 30 fps, H.264). Display `:90` / port `4190`
  (tránh :91–:99 của luồng khác). Mỗi lượt: seed autosave rỗng,
  import qua input file thật, phát xuôi 6 s rồi ngược 14 s.
- **Hai bundle chỉ khác đúng 1 hunk trong `seekElement`:**
  - retry (sản phẩm hiện tại): vòng attempt của
    `apps/web/src/lib/seek.ts` — ở `seeked` thì kiểm tra lại
    (đang seeking / đúng frame chưa), chưa settle thì chờ
    `seeked` tiếp theo.
  - single (kiểu N2): cùng file, cùng mọi thứ khác, chỉ đổi
    callback `seeked` thành `finish(true, false)` ngay ở `seeked`
    đầu tiên, không kiểm tra lại seeking/đúng frame.
  - Patch đầy đủ (1 hunk, 3 dòng cũ → 5 dòng mới, toàn bộ là
    thân callback + comment): xem
    `apps/web/scripts/seek-ab-single-shot.patch`. Mọi helper khác
    (`needsSeek`, fast-path "đã đúng frame và không seeking",
    timeout 1200 ms, gỡ listener O3) giữ nguyên cả hai bên.
- **Cây đóng băng (frozen tree) — bắt buộc vì cây live đang bị
  luồng khác sửa giữa chừng (xem §2):** copy toàn bộ
  `apps/`, `packages/`, `package.json` sang scratch
  `~/workspace/tmp-round34-q1/frozen/` tại 1 thời điểm, symlink
  `node_modules` về gốc (workspace dep `@repo-1/video-spec` vẫn
  resolve về bản gốc, ổn định trong suốt đợt — không có luồng nào
  sửa `packages/`). Cả 2 bundle đều build từ cây đóng băng này
  (chỉ khác hunk seek), nên khác biệt bundle = khác biệt seek.
- **Xác minh bundle mỗi lượt (chống nhiễm dist chia sẻ):** trước
  mỗi lượt, copy snapshot bundle vào `apps/web/dist`, kiểm tra
  sha256; sau mỗi lượt, kiểm tra lại sha256 của
  `dist-snap/assets/*.js` mà harness đã phục vụ. Cả 8 lượt đều
  khớp — không lượt nào bị hủy vì nhiễm.
  - retry: `index-4i4xoITZ.js`, 1 013,79 kB,
    sha256 `18cc5b2601018a74c393b5253f8e2702636d98566cc8899ec353e9a538e092ae`,
    209 module.
  - single: `index-Bk6WxuML.js`, 1 013,79 kB,
    sha256 `6775f81481ba72d989da6d3239e3f9815bcf11fe8a96f968ef7887cd7ee77eb3`,
    209 module (cùng số module — thêm bằng chứng chỉ khác seek).
  - Cả 2 bundle đều chứa đủ dấu K4 (`Phát ngược`,
    `__vcutHoldStats`, `toggleReversePlayback`).
- **Thứ tự xen kẽ** (chống trôi theo thời gian):
  retry-1, single-1, retry-2, single-2, retry-3, single-3,
  rồi 1 cặp bonus retry-4, single-4 khi máy yên hơn (§4).
- **Quy tắc đo theo P5 §7.5:** mỗi lượt ghi đủ tải máy
  (loadavg), tốc độ xuôi nội suy, gap rAF phase ngược
  (P50/P95, số gap > 100 ms, biến thể exclFirst). Loadavg được
  ghi nhưng KHÔNG dùng làm thước yên tĩnh duy nhất (xem §5.2:
  loadavg 8–11 vẫn có lượt fwd 1,001 và rAF hoàn hảo).

## 2. Sự cố trong lượt: nhiễm bundle ở lần build đầu — đã loại bỏ

1. **Build single đầu tiên (bundle `Cao1Pxfd`, đã HỦY, không dùng)
   bị nhiễm:** trong cửa sổ build, luồng khác đã ghi
   `ExportPanel.tsx` (13:08:05), `i18n/en.json` (13:07:47),
   `reverseDecodeAhead.ts` (13:07:39) — `ExportPanel` import
   module mới `errorDetailSummary.ts` nên số module của cây tăng
   187 → 188 giữa 2 lần build. Bằng chứng: build lại cây live
   sau đó cho bundle khác (`M8MgMXGf`, 188 module), khác hẳn
   bundle retry build trước đó (`Cqp7uur1`, byte-identical với
   dist đợt 33). Vì vậy `Cao1Pxfd` không còn là "chỉ khác seek"
   nữa — đã loại bỏ hoàn toàn, không đưa số nào của nó vào kết
   luận.
2. **Cách sửa:** chuyển sang cây đóng băng (§1) và build lại CẢ
   HAI biến thể từ đó. Bundle retry/singe cuối cùng đều 209
   module (cây đóng băng đã nhận thêm file của luồng khác trước
   thời điểm copy — nhưng cả hai arm chia sẻ cùng cây đó nên
   A/B vẫn sạch).
3. **Phát hiện thêm trong lúc copy:** `preview.tsx` live đã được
   luồng Q2 nối hook rAF + đường WebCodecs opt-in (mặc định TẮT)
   NGAY SAU thời điểm copy — cây đóng băng KHÔNG có wiring này.
   Không ảnh hưởng A/B: hook chỉ ghi mẫu đo, đường cache chỉ
   chạy khi opt-in; đường element-seek đo ở đây giống nhau ở
   cả hai arm. Ghi rõ để parent khỏi nhầm cây đo với cây live.
4. **Lỗi tsc hiện tại KHÔNG phải của luồng này, không sửa:**
   cây đóng băng (và cây live lúc đó) fail `tsc` ở file của luồng
   khác: `reverseDecodeAhead.test.ts` TS5097 (import `.ts` khi
   chưa bật `allowImportingTsExtensions`) và `reverseWebcodecs.ts`
   TS2322/TS2531 (đang được luồng khác sửa dở). Vì vậy 2 bundle
   A/B build bằng `vite build` (không qua `tsc`); build sản phẩm
   ở cây sạch trước đó (lượt retry live đầu buổi) đã pass
   `tsc && vite build` (bundle `Cqp7uur1` byte-identical với dist
   đợt 33 — xem §3). Luồng này không đụng các file đó.

## 3. Trạng thái cây sau lượt (khôi phục sạch)

- `apps/web/src/lib/seek.ts` live: **không đổi 1 byte** so với đầu
  buổi. sha256 trước = sau =
  `efb0160b93019a3d6d9486ebc84951003889195358e99bdadf9854476b7af11c`,
  diff với bản backup rỗng. Chỉnh sửa tạm chỉ tồn tại trong cây
  đóng băng (đã khôi phục về bản gốc trong đó sau khi build).
- `apps/web/dist` live: đã khôi phục về snapshot trước buổi đo
  (`index-Cqp7uur1.js`, sha256
  `a585b7c7172736f7ce5ebef3990dff80bcb4fe0eb317a660415968ac182844b9`
  — đúng bundle đợt 33). Lúc khôi phục, dist vẫn chứa bundle
  single-4 của chính luồng này (không luồng nào build đè lên
  giữa chừng), nên khôi phục là an toàn, không phá build của ai.
- Build live đầu buổi (`tsc && vite build`): pass, bundle
  byte-identical với dist đợt 33 — chứng tỏ cây live lúc đó vẫn
  tương đương cây đợt 33 (trước khi các luồng đợt 34 ghi đè).

## 4. Số đo (8 lượt, cùng video, cùng harness)

Giờ UTC 01/11/2026 (giờ +07 = +7h: 20:21–20:26). Verdict PARTIAL
ở 4 lượt chỉ là artefact mẫu chuyển tiếp (mẫu đầu = frame cũ,
cùng họ với PARTIAL của N2/P5): phát ngược vẫn đúng hướng
(29,5 → ~15–16), `blackRev = 0` ở cả 8 lượt, badge ngược/giữ đều
thấy, hold kích hoạt ở cả 8 lượt. Fwd = tốc độ xuôi nội suy
(mẫu 2 → cuối); load = loadavg 1 phút trước phase ngược.

| Lượt | Biến thể | fps ngược (draw/wall) | Fwd | rAF ngược P50 / P95 | Gap >100ms exclFirst | Load trước ngược | Verdict |
|---|---|---|---|---|---|---|---|
| retry-1 13:21 | retry | **1,99** (30/15,11 s) | 0,765 | 12,1 / 82,6 ms | 10 | 1,59 | PARTIAL |
| single-1 13:22 | single | **0,90** (14/15,47 s) | 0,706 | 25,0 / 101,9 ms | 20 | 10,85 | PARTIAL |
| retry-2 13:22 | retry | **1,30** (19/14,60 s) | 0,648 | 13,7 / 83,5 ms | 6 | 17,52 | PARTIAL |
| single-2 13:23 | single | **5,43** (75/13,80 s) | 0,896 | 5,0 / 47,6 ms | 0 | 14,07 | PASS |
| retry-3 13:24 | retry | **5,83** (80/13,71 s) | 1,001 | 4,7 / 38,9 ms | 0 | 8,96 | PASS |
| single-3 13:24 | single | **1,80** (26/14,48 s) | 0,963 | 8,6 / 75,5 ms | 0 | 8,28 | PARTIAL |
| retry-4 13:25 | retry | **6,02** (83/13,79 s) | 1,008 | 4,6 / 42,0 ms | 0 | 3,47 | PASS |
| single-4 13:26 | single | **6,18** (85/13,75 s) | 0,998 | 4,4 / 42,5 ms | 0 | 3,65 | PASS |

Tổng hợp (script `seek-ab-summarize.mjs`, tính trên số thật):

| Tập | retry | single | Chênh lệch |
|---|---|---|---|
| 3+3 chính (dưới tải song song) | trung vị **1,99**, tb 3,04, khoảng 1,30–5,83 | trung vị **1,80**, tb 2,71, khoảng 0,90–5,43 | trung vị +0,19 fps (**+10,5% theo hướng retry**) |
| Cặp bonus liền nhau (retry-4/single-4) | 6,02 | 6,18 | **+0,16 fps (+2,7% theo hướng single)** |
| Tỉ số từng cặp xen kẽ (retry/single) | 2,21× / 0,24× / 3,24× (3+3) | — | đổi dấu → không hiệu ứng hệ thống |

Chi tiết từng lượt (load đầy đủ, mẫu playhead/gray, gap rAF
phase xuôi + ngược): xem 8 file JSON
`benchmarks/results/v34-q1-seek-ab-*.json`.

## 5. Đọc số (và không đọc quá số)

### 5.1 Vì sao cặp bonus là bằng chứng mạnh nhất

retry-4 và single-4 chạy liền nhau (~1 phút cách nhau), cùng
cửa sổ máy yên hơn (không còn probe Chrome nào của luồng khác
đang chạy; load 1 phút 3,2–3,7), fwd 1,008 vs 0,998 (chênh 1%),
rAF ngược gần như đồng nhất (P50 4,6 vs 4,4 ms, P95 42,0 vs
42,5 ms, 0 gap > 100 ms exclFirst cả hai), cùng PASS, cùng
không mẫu đen. Đây là cặp so sánh sạch nhất trong đợt: mọi
proxy tải đo được đều khớp, chỉ khác dạng seek. Chênh lệch
+2,7% nằm trong độ lặp lại của chính retry (5,83 → 6,02).
Nếu settle-wait gây ra 20% thì cặp này phải cho ~+20% theo
hướng single — không có.

### 5.2 Vì sao 3+3 chính không cho hiệu ứng dù tải cao

Đợt 34 có 6 luồng chia sẻ VM; trong cửa sổ 3+3, load 1 phút
dao động 1,6–17,5 và ít nhất 1 probe Chrome của luồng Q3 chạy
xuyên suốt (renderer 60% CPU + decode-ahead). Fps ngược dao
động 0,90–5,83 ngay trong cùng biến thể. Đáng chú ý:
loadavg là proxy kém — retry-3 có loadavg 8,96 nhưng fwd
1,001 và rAF hoàn hảo (5,83 fps), trong khi single-1 có
loadavg 10,85 nhưng fwd 0,706 và rAF tệ (0,90 fps). Phân loại
"yên tĩnh" phải dựa vào fwd + gap rAF như P5 §7.5 đã quy định,
không dựa vào loadavg một mình.

### 5.3 Điểm bất thường single-3 — bằng chứng về nhiễu decode ẩn

single-3 (1,80 fps) có fwd 0,963 và rAF ngược hoàn hảo (P50
8,6 ms, 0 gap > 100 ms exclFirst, predictedRate 0,998) nhưng
chỉ vẽ được 26 frame trong 14,48 s, trong khi retry-3 liền
trước đó (fwd 1,001, rAF tương đương) vẽ được 80. Giải thích
phù hợp nhất (đúng cảnh báo P5 §1.3): decode/seek chạy trên
thread/process khác của Chrome nên rAF khỏe KHÔNG chứng minh
decode không bị tranh CPU — luồng khác đang giải mã video
cùng lúc có thể đói decode của lượt đo mà fwd (decode tuần
tự rẻ) và rAF (main thread) không thấy. Hệ quả: ngay cả tiêu
chuẩn "quiet theo fwd + rAF" cũng chưa đủ để chứng nhận
"quiet cho decode ngược". Điểm này được ghi lại, không giấu,
không loại khỏi thống kê (nó nằm trong 3+3 và trong mọi tổng
hợp trên).

### 5.4 Mức tuyệt đối thấp hơn đợt 33 — trôi cây, không phải seek

Mức quiet-ish của cây đóng băng đợt 34 (retry 5,83–6,02) thấp
hơn quiet đợt 33 trên bundle `Cqp7uur1` (6,85–7,21). A/B cùng
cây chứng minh seek không gây ra chênh này (single ≈ retry).
Nguyên nhân còn lại: cây đã nặng thêm (209 module so với 187
ở bundle đợt 33 — các tính năng luồng khác thêm vào) và/hoặc
phương sai phiên. Vì vậy KHÔNG so sánh mức tuyệt đối đợt 34
với N2/r33 để kết luận hồi quy; chỉ so sánh TRONG A/B (cùng
cây, cùng phiên) mới có giá trị — và so sánh đó cho kết quả
ở §0.

### 5.5 Không được claim

- Không claim "settle-wait tốn đúng 0%": cặp matched là n=1,
  và §5.3 cho thấy vẫn còn nhiễu decode ẩn. Claim chính xác là:
  **không có hiệu ứng lớn ~20%**; hiệu ứng nếu có thì chỉ ở
  mức vài % (trong nhiễu lặp lại), không giải thích được dư 20%.
- Không claim "8,97 chắc chắn là nhiễu": cần quiet 3+3 (nợ §6.1)
  để đo lại phân phối quiet của chính cây hiện tại. Nhưng với
  phương sai 6,9× đã đo trong cùng phiên, việc dùng 1 điểm n=1
  làm baseline hồi quy 20% là không đủ cơ sở — đó là kết luận
  về phương pháp đo, không phải phỏng đoán.

## 6. Nợ còn lại

1. **Quiet 3+3 thật (đợt sau, cần parent điều phối):** chạy lại
   A/B này trong cửa sổ máy quiesced thật — tạm dừng probe
   browser của các luồng khác, xác nhận bằng cả fwd ~1,0 lẫn
   rAF sạch (và, sau bài học single-3, tốt nhất kèm thêm tín
   hiệu decode: ví dụ đếm draw/hold từng tick để phát hiện đói
   decode ẩn). Chỉ khi đó mới khóa được phân phối quiet của
   cây hiện tại và vị trí tương đối của điểm N2 8,97.
2. **Probe tranh decode (nợ phương pháp):** fwd + rAF không đủ
   để chứng nhận quiet cho decode ngược (single-3). Cần một
   proxy decode-side trước khi mọi số fps ngược được gọi là
   "quiet".
3. **Không làm:** không revert `seekElement`, không sửa
   `reverseWebcodecs.ts` / `previewRafHook.ts` / `preview.tsx`
   (phần của luồng khác), không nối WebCodecs vào preview trong
   luồng này.

## 7. File đổi/thêm (text, không binary — parent gộp batch)

- Mới: `apps/web/scripts/seek-ab-run.sh` (chạy 1 lượt harness
  N2 cho 1 biến thể: thay dist bằng snapshot, kiểm tra sha256
  trước/sau, in dòng JSON tóm tắt; `bash -n` pass).
- Mới: `apps/web/scripts/seek-ab-summarize.mjs` (tổng hợp các
  forward-hold.json thành bảng + trung vị/tb/khoảng + chênh
  lệch; `node --check` pass; lưu ý: script nhận đường dẫn
  tuyệt đối, không tự expand `~`).
- Mới: `apps/web/scripts/seek-ab-single-shot.patch` (patch 1
  hunk tái tạo chính xác biến thể single từ `seek.ts` gốc).
- Mới: `docs/PHASE9_ROUND34_Q1_SEEK_AB_LIMITS.md` (file này).
- Mới: `benchmarks/results/v34-q1-seek-ab-retry-1.json`,
  `v34-q1-seek-ab-retry-2.json`, `v34-q1-seek-ab-retry-3.json`,
  `v34-q1-seek-ab-retry-4.json`, `v34-q1-seek-ab-single-1.json`,
  `v34-q1-seek-ab-single-2.json`, `v34-q1-seek-ab-single-3.json`,
  `v34-q1-seek-ab-single-4.json` (JSON gốc của harness cho 8 lượt;
  đã đối chiếu fps/verdict với log runner).
- Không sửa: `apps/web/src/lib/seek.ts` (khôi phục byte-identical,
  sha256 ở §3), mọi code sản phẩm khác, mọi file luồng khác,
  paths-loop, build-loop-log. Bundle nhiễm `Cao1Pxfd` chỉ nằm ở
  scratch, không stage. Scratch làm việc (cây đóng băng, snapshot
  dist, bản backup seek): `~/workspace/tmp-round34-q1/` (ngoài
  repo, không stage).

## 8. Kiểm chứng đã chạy

- `npm run build` (tsc + vite) trên cây live đầu buổi: pass,
  bundle byte-identical với dist đợt 33.
- `npx vite build` trên cây đóng băng: retry pass (209 module,
  `4i4xoITZ`), single pass (209 module, `Bk6WxuML`); cả hai
  chứa đủ dấu K4. `tsc` trên cây đóng băng fail ở file luồng
  khác (§2.4) — không phải lỗi của luồng này, không sửa.
- Harness N2 nguyên vẹn, 8/8 lượt chạy xong, 8/8 snapshot
  bundle khớp sha256 kỳ vọng, 0 lượt bị hủy vì nhiễm.
- `node --check` script summarize pass; `bash -n` script runner
  pass; script summarize đã chạy lại trên 8 JSON cho bảng §4.
- `seek.ts` live khôi phục byte-identical (sha256 §3);
  `dist` live khôi phục về bundle đợt 33 (§3).
