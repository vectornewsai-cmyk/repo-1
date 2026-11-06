# Phase 9 đợt 36, luồng S5 — Rehydrate media sau reload + trạng thái phiên

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo. Đóng nợ §3.5
> của `docs/PHASE9_ROUND35_LIMITS.md` (nợ lớn nhất của R6) và §3 mục 5
> của R6 LIMITS: bytes `asset:` đã bền trong IndexedDB nhưng App không
> nạp lại media bin; media mẫu mất sau reload; autosave không chứa
> playhead/playing/reverse.
>
> Kết quả kiểm chứng đầy đủ: `benchmarks/results/v36-s5-rehydrate.json`
> (probe trình duyệt thật, xem §3). Unit test: 19/19 (file test mới).
> KHÔNG claim discard thật hàng giờ / Safari / máy thật — probe chỉ
> reload có chủ ý trên Chromium Linux, giống giới hạn của R6.

## 1. Quyết định sản phẩm — trạng thái phiên (trả lời §3.5 trước khi sửa format)

| Trạng thái | Sau reload | Vì sao |
|---|---|---|
| playhead | GIỮ (clamp về duration project, snap frame) | Playhead là con trỏ làm việc, như con trỏ soạn thảo: user reload giữa chừng thì muốn tiếp tục đúng chỗ. Không gây hại: chỉ là vị trí, không tự phát. |
| playing | RESET về pause (không lưu) | Tự phát sau reload là bất ngờ, có thể phát tiếng đột ngột; trình duyệt cũng có thể chặn autoplay có tiếng. User bấm phát là chủ đích. |
| reversePlayback | RESET về tắt (không lưu) | Chế độ phát ngược là mode phát nhất thời, gắn với cache frame/decode của phiên cũ (đã mất); giữ cờ mà không giữ cache chỉ gây nhầm. |

Format autosave: envelope thêm field tuỳ chọn `session: { playhead }`
(`AutosaveSession` trong projectRepo.ts). Tương thích ngược hai chiều:

- Envelope cũ (không có `session`) → `loadAutosave().session = null` →
  App giữ hành vi cũ (playhead 0). File `.vcut.json` cũ mở bình thường
  (parseProjectText vốn bỏ qua field lạ).
- File `.vcut.json` tải xuống KHÔNG mang session (saveProject →
  serializeProject không truyền session): file là project di động, không
  mang vị trí phát của máy này. Session chỉ sống trong autosave
  localStorage.
- Giá trị session xấu (âm, NaN, chuỗi, session không phải object) →
  null, không throw, không đoán (test khóa đủ case).
- Lần ghi lại autosave khi chuẩn hóa style (đường O6 D7) nay mang theo
  session đã đọc — nếu không, lần khôi phục đầu tiên có sửa style sẽ
  ghi đè mất playhead bền vững ngay lập tức.

Ghi playhead bằng hai đường, không đường nào ghi đè spec của tab khác:

- Spec đổi → autosave debounce 5s kèm playhead tại thời điểm đó.
- Trang ẩn/kết thúc → `persistSessionPlayhead()` CHỈ cập nhật field
  `session` của envelope đã có, không chạm spec/name/savedAt. Lý do
  thiết kế này là một lỗi phát hiện trong lúc probe (xem §4): bản đầu
  dùng `autosaveNow` toàn envelope ở pagehide đã ghi đè seed kiểm
  chứng của pha B — và trong đời thật sẽ ghi đè spec mới hơn của tab
  khác. Chưa có autosave thì không tạo envelope rỗng.

## 2. Hướng mẫu đã chọn: AssetStore persistence (KHÔNG tái sinh mẫu)

Hai hướng R6 nêu ra, chỉ làm một tới nơi:

- **Đã chọn: đưa mẫu vào AssetStore + rehydrate.** `buildSampleProject`
  ingest blob mẫu vào AssetStore ngay lúc tạo mẫu (kèm width/height/
  duration/thumbnail); bước rehydrate lúc khởi động nạp lại media bin
  từ đó, trước `checkMissingMedia()`. Spec giữ nguyên src cũ
  (`mau-1.webm`, `mau-2.webm`) nên không đổi format spec, không đụng
  đường export/render (vốn map theo tên file).
- **Không chọn: tự tái sinh mẫu khi autosave trỏ tới mẫu.** Tái sinh
  bằng MediaRecorder mất ~8s realtime cho 2 clip (4s × 2), bytes mỗi
  lần khác nhau, thất bại khi thiếu MediaRecorder — và chỉ cứu được
  đúng project mẫu, không cứu clip `asset:` nào khác. Hướng AssetStore
  cứu cả hai bằng một cơ chế.

Chi tiết cơ chế (module mới `apps/web/src/lib/rehydrate36S5.ts`):

- `collectMediaSrcs(spec)`: quét src media distinct, kể cả lá trong
  subSpec nested (canonical `subSpec.tracks` + legacy `tracks` trên clip
  nested, cùng quy ước relink.ts), chống vòng lặp theo nhánh, trần sâu
  64. Text clip không có src nên không được thu.
- `planRehydrate(srcs, manifests)`: `asset:<id>` khớp theo assetId;
  tên thô khớp theo `originalName`; `blob:` skipped (URL phiên cũ đã
  chết); `http(s):`/`data:` skipped — rehydrate không tạo MediaItem
  cho chúng (lưu ý: luật riêng của relink.ts vẫn có thể liệt kê http
  src là thiếu vì không có trong mediaNames — hành vi có sẵn, ngoài
  phạm vi đợt này).
- Nhiều manifest cùng tên → bản mới nhất theo `ingestedAt` thắng.
  Đây là điểm yếu đã biết: tạo mẫu nhiều lần cho bytes khác nhau cùng
  tên nên phải có luật thắng; `buildSampleProject` tỉa manifest mẫu cũ
  cùng tên sau mỗi lần ingest để kho mẫu không phình (tối đa 2 asset
  mẫu). Với file user, luật newest-wins có thể nạp nhầm bytes khi hai
  file khác nhau cùng tên cùng được ingest — chấp nhận ở đợt này vì
  đường import chưa ingest (trong thực tế hôm nay chỉ có manifest
  mẫu); hướng sửa triệt để là chuyển src sang `asset:` khi
  import-ingest lên sau (xem §5).
- MediaItem dựng lại mang `file` thật (`new File([blob], originalName)`)
  chứ không chỉ url preview: bytes IndexedDB chính là bytes gốc nên
  File dựng từ chúng upload lên bridge render được như file import gốc.
  Item nào không dựng được (thiếu blob, kind `other`) rơi vào
  failedSrcs — App vẫn chạy `checkMissingMedia()` sau đó nên clip đó
  hiện panel Relink như cũ, không im lặng mất media.
- Ingest mẫu là best-effort tuyệt đối: IndexedDB/crypto.subtle không
  khả dụng (private mode, non-secure context) thì mẫu vẫn chạy trong
  phiên, chỉ không bền qua reload; lỗi được nuốt, không làm hỏng
  loadSample.
- Thứ tự khởi động mới trong App: replaceProject (bin rỗng) →
  khôi phục playhead từ session → rehydrate từ AssetStore (fail-soft
  khi IDB bị chặn) → checkMissingMedia → toast/báo cáo load. Thứ tự
  rehydrate-trước-check là điểm sửa chính: trước đây check chạy khi
  bin còn rỗng nên mọi clip đều hiện Relink oan.
- Store thêm action `restoreMediaBin(items)`: thêm item chưa có (khớp
  theo tên), không đụng spec/history/selection, idempotent (gọi lại
  không nhân đôi).

Quy ước code đáng chú ý (để luồng sau khỏi vấp lại):

- Module rehydrate KHÔNG import value từ file anh em (chỉ import
  type): Node ESM từ chối import không đuôi `.ts`, còn tsc của app cấm
  đuôi `.ts` khi `allowImportingTsExtensions` tắt. Hai helper `asset:`
  trong module là bản sao 3 dòng của assetStore.ts (tiền tố ổn định,
  test khóa hành vi); `parseSessionPlayhead` sống trong projectRepo.ts
  vì file đó được test bằng Node nên cũng không được import value từ
  file anh em. Vi phạm quy ước này đã gây hồi quy thật trong đợt này
  (projectRepo.test.ts + textStyle32O6D7.test.ts lỗi
  ERR_MODULE_NOT_FOUND) và đã được sửa + kiểm chứng lại (xem §4).

## 3. Kết quả kiểm chứng

### 3a. Unit test — 19/19, exit 0

`node apps/web/src/lib/rehydrate36S5.test.ts` (fake deps, không cần
trình duyệt; AssetStore thật đã có test riêng 22/22):

- plan: bare-name khớp originalName, `asset:` khớp assetId, thiếu
  manifest → skipped, nhiều manifest cùng tên → mới nhất thắng,
  blob/http/data → skipped, src trùng → 1 candidate.
- collect: bỏ text clip, lấy lá nested + legacy nested, vòng lặp
  subSpec theo nhánh thì dừng (không treo).
- rehydrate: dựng đủ field (duration/width/thumbnail/file.name =
  originalName), blob thiếu → failedSrcs (cả hai src cùng assetId đều
  failed — hành vi đúng), kind `other` → failed.
- session: envelope cũ → null; playhead hợp lệ giữ nguyên (kể cả 0);
  giá trị xấu → null không throw.
- session-flush: chỉ đổi session, spec/name/savedAt giữ nguyên; chưa
  có autosave → không tạo envelope; JSON hỏng / playhead xấu → không
  throw, không ghi.

Test lân cận chạy lại sau sửa (exit 0 tất cả): projectRepo 10/10,
textStyle32O6D7 6/6, discardRestore35R6 8/8, assetStore 22/22.

### 3b. Probe trình duyệt thật — allPass = true

`apps/web/scripts/probe-round36-s5-rehydrate-pipe.mjs`, bundle probe
build riêng ra `/tmp/vcut-s5-dist` (KHÔNG build đè dist của repo để
khỏi nhiễm các luồng khác đang đo; bundle đo:
`assets/index-DAS3nyo_.js`, sha256 `e02b786973edd1c3…` — lưu ý /tmp
còn giữ file JS cũ của lần build trước vì outDir ngoài root không
được dọn tự động, nhưng index.html trỏ đúng bundle mới). Chrome
headless-new (Playwright chromium-1248), cổng 4295, profile mới.

Pha A — phiên mẫu thật rồi reload (đường user đi):

- Autosave mẫu xuất hiện (1597 ký tự), seek ruler tới 00:04.0 / 00:08.0.
- Sau reload: transport vẫn `00:04.0 / 00:08.0` → playhead 4 → 4
  (khôi phục đúng, sai lệch 0).
- Panel Relink VẮNG (trước đợt này R6 đo được panel liệt kê đủ
  mau-1/mau-2 — nay không còn).
- Media bin sau reload chứa đúng `mau-1.webm | mau-2.webm`.
- Nút phát ở trạng thái pause (không tự phát sau reload).
- Autosave có `session.playhead = 4`, khớp playhead đã seek.

Pha B — đối chứng âm (rehydrate không che media thiếu thật):

- Sửa autosave: đổi 1 clip src thành `file-that-does-not-exist-xyz.mp4`
  → reload → panel Relink HIỆN và liệt kê đúng tên đó
  (`Media thiếu (1)`, `Video · dùng trong 1 clip`).

### 3c. tsc / vite build

- `tsc --noEmit` (apps/web): file của luồng này SẠCH. Lỗi duy nhất còn
  lại nằm ở `src/lib/reversePreviewGate.test.ts` (luồng S3 đợt 36, 3 lỗi
  TS5097/TS7006) — không phải file của luồng này, không đụng vào, đã
  báo để luồng S3 tự sửa; file đó cũng chưa nằm trong tsconfig exclude.
- `vite build` (ra /tmp probe dist): pass, 193 module.

## 4. Lỗi phát hiện trong lúc làm (đã sửa, có bằng chứng)

1. **pagehide ghi đè seed (thiết kế, đã sửa):** bản đầu dùng
   `autosaveNow` toàn envelope ở pagehide → probe pha B thất bại vì
   lần reload ghi đè seed src giả bằng spec trong bộ nhớ. Sửa thành
   `persistSessionPlayhead()` chỉ cập nhật field session → pha B pass.
   Tác dụng phụ tốt: hết hazard ghi đè spec mới hơn của tab khác.
2. **Hồi quy import Node-testable (đã sửa):** projectRepo.ts import
   value từ rehydrate36S5.ts (không đuôi) → projectRepo.test.ts và
   textStyle32O6D7.test.ts lỗi ERR_MODULE_NOT_FOUND. Sửa bằng cách
   chuyển `parseSessionPlayhead` về projectRepo.ts + quy ước không
   import value file anh em (§2); chạy lại đủ test lân cận, exit 0.
3. **Test sai kỳ vọng 2 lần (test sai, code đúng):** lần 1 tưởng
   rehydrate cho 2 item nhưng spec có 3 src distinct; lần 2 tưởng blob
   thiếu chỉ fail 1 src nhưng hai src cùng assetId đều fail. Cả hai
   đều sửa test theo hành vi đúng, không sửa code cho vừa test.

## 5. Trường hợp nào vẫn mất media + nợ còn lại

Vẫn mất (hiện panel Relink như cũ — đúng, không phải bug mới):

- **Autosave mẫu cũ (tạo trước đợt này):** bytes mẫu chưa từng được
  ingest nên AssetStore trống → reload vẫn hiện Relink cho mau-1/mau-2
  một lần. Chỉ project mẫu tạo mới từ bản này trở đi mới bền. Không
  tự tái sinh mẫu cũ (đó là hướng đã loại ở §2).
- **Media user import trong phiên cũ:** đường importFiles chưa ingest
  vào AssetStore nên bytes không bền; reload vẫn mất như trước. Code
  rehydrate đã sẵn sàng cho chúng ngay khi import-ingest lên (khớp
  `asset:` hoặc originalName) — đây là nợ tiếp theo có giá trị nhất.
- **Clip `asset:` mà bytes đã bị xoá khỏi IndexedDB** (xoá tay, mở ở
  máy khác, quota evict): không có gì để nạp → Relink.
- **Clip `blob:` trong spec cũ:** URL phiên đã chết vĩnh viễn, không
  cứu được bằng cơ chế nào (chỉ relink tay).
- **Export sau reload chưa kiểm chứng end-to-end:** File dựng từ blob
  là thật và đúng tên gốc, nhưng đường upload lên bridge render chưa
  được chạy thử (bridge không chạy trong probe này) — không claim
  export sau reload đã thông.
- **Mở file `.vcut.json` có src `asset:`:** rehydrate hiện chỉ nối
  vào đường khôi phục autosave lúc khởi động App; đường mở file
  (ProjectMenu → replaceProject + checkMissingMedia) chưa chạy
  rehydrate nên project `asset:` mở từ file vẫn hiện Relink cho tới
  khi nối thêm — nợ nhỏ, cùng một hàm, cần sửa ProjectMenu.
- **Chưa đo:** discard thật dưới áp lực bộ nhớ / tab ẩn hàng giờ /
  bfcache / Safari / máy thật / dpr > 1 cho đường này (kế thừa giới
  hạn R6); IndexedDB bị quota-evict giữa chừng; playhead khôi phục
  khi spec đã bị sửa ngắn lại (chỉ mới clamp theo duration, chưa đo
  hành vi với clip đã xóa).

## 6. File đổi / thêm (chỉ file text, KHÔNG binary, KHÔNG push)

Mới:

- `apps/web/src/lib/rehydrate36S5.ts` — module rehydrate thuần +
  plan/collect (không chạm IDB/DOM).
- `apps/web/src/lib/rehydrate36S5.test.ts` — 19 test.
- `apps/web/scripts/probe-round36-s5-rehydrate-pipe.mjs` — probe pha
  A + pha B (CDP WebSocket, không cần package playwright).
- `docs/PHASE9_ROUND36_S5_REHYDRATE_LIMITS.md` — file này.
- `benchmarks/results/v36-s5-rehydrate.json` — kết quả probe
  (allPass = true).

Sửa (file chung — ghi rõ để coordinator đối chiếu khi gộp đợt 36):

- `apps/web/src/App.tsx` — import rehydrate/AssetStore; effect khởi
  tạo: playhead từ session + rehydrate trước checkMissingMedia;
  autosave kèm playhead; pagehide/visibilitychange chỉ flush session;
  afterFix giữ session.
- `apps/web/src/store.ts` — thêm action `restoreMediaBin` (cộng thêm,
  không đổi action cũ); cập nhật chú thích replaceProject.
- `apps/web/src/sample.ts` — ingest mẫu vào AssetStore + tỉa manifest
  mẫu cũ (best-effort, try/catch).
- `apps/web/src/lib/projectRepo.ts` — `AutosaveSession`,
  `parseSessionPlayhead`, `serializeProject`/`autosave`/`autosaveNow`
  nhận thêm session tuỳ chọn, `loadAutosave` trả thêm `session`,
  `persistSessionPlayhead` (cập nhật phẫu thuật field session).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (mẫu
  chung của mọi `.test.ts`).
