# Phase 9 đợt 76 — D8: Đóng 3 nợ codec-probe của đợt 75 C6 §4 (race mẫu / Escape modal / badge timeline)

Ngày: 10/11/2026, lượt cron 00:35 +07. Repo `~/workspace/repo-1`.
Đóng nợ `docs/PHASE9_ROUND75_C6_CODEC_PROBE_UI_LIMITS.md` §4 mục 5–7
(theo thứ tự trong LIMITS C6: §4.7 race project mẫu, §4.6 Escape
modal, §4.8 badge timeline). KHÔNG push, KHÔNG release/tag, KHÔNG
binary, KHÔNG file workflow.

## 1. Đã làm

### 1.1 Race project mẫu xóa file vừa import (§4.7) — ĐÃ ĐÓNG

**Nguyên nhân gốc (đo được):** `loadSample` (store.ts) là async —
`buildSampleProject()` ghi 2 clip mẫu bằng MediaRecorder nên bay
~8 s. User import file trong lúc đó thì `importFiles` đã `set()` media
mới vào bin (functional set, append đúng), nhưng khi lượt mẫu resolve,
`set({ spec, media: sampleMedia })` ghi đè TOÀN BỘ mảng media → file
vừa import biến mất khỏi bin; kéo clip lên timeline trong lúc đó thì
spec mẫu cũng ghi đè luôn clip vừa thêm. Guard thế hệ (đợt 47 C1)
không cứu được vì import không đổi project nên không tăng
`projectGeneration`.

**Sửa — merge thay vì ghi đè:**

- Mới: `apps/web/src/lib/sampleLoadMerge76D8.ts` (hàm thuần
  `mergeSampleLoad`, test được bằng Node):
  - media = media mẫu + mọi item đang có trong bin mà tên không trùng
    tên mẫu (item import lúc bay được giữ nguyên thứ tự; trùng tên mẫu
    thì lấy bản mẫu → không nhân đôi mau-1/mau-2 khi bấm "Dự án mẫu"
    lần 2).
  - spec = spec mẫu CHỈ khi user không sửa timeline lúc bay
    (`curSpec === specAtStart`, so sánh tham chiếu — zustand set luôn
    tạo spec mới khi sửa). User đã sửa (vd kéo clip vừa import lên
    timeline) thì giữ nguyên spec của họ.
- `store.ts` `loadSample`: chụp `specAtStart = get().spec` trước await,
  gọi `mergeSampleLoad` sau khi qua guard thế hệ; nhánh giữ spec chỉ
  `set({ media: merged.media, ready: true })` — KHÔNG đụng
  spec/projectId/playhead/history, KHÔNG `markSaved` (spec user chưa
  lưu, autosave sẽ ghi sau), KHÔNG `clearHistory` (undo user còn
  nguyên); nhánh mẫu giữ nguyên hành vi cũ (`markSaved` + `clearHistory`
  + `ready: true` + xoay `projectId`).
- **`ready: true` ở nhánh giữ spec là bắt buộc** — bắt được nhờ click-
  test headed (xem §2.2): lần headed đầu nhánh này chỉ set media nên
  `ready` ở lại `false` (khởi đầu), splash "Đang mở dự án..." đè màn
  hình mãi và WelcomeModal không bao giờ hiện (chỉ render khi ready).
  Screenshot R2 lần đầu chỉ có splash — đã sửa + kiểm chứng lại
  (R2d xanh, screenshot R2 lần 2 hiện đủ editor).

### 1.2 Modal codec chưa đóng bằng Escape (§4.6) — ĐÃ ĐÓNG

`components/CodecUnsupportedModal.tsx`: thêm `useEffect` keydown trên
window theo đúng pattern tự chứa của SceneModal / BeatSyncModal /
WelcomeModal (đợt 58 O1): bỏ qua INPUT/TEXTAREA/SELECT, `Escape` →
`onClose()` (đúng đường đóng của nút ✕). Handler Escape toàn cục ở
App.tsx chỉ đóng các modal của App (export/caption/silence/loadReport)
nên không xung đột. Không thêm key i18n mới.

### 1.3 Clip trên timeline chưa có badge (§4.8) — ĐÃ ĐÓNG

`Timeline.tsx` `ClipView`: tra media theo `clip.src` như ClipThumb
(by name) + khớp thêm theo `assetId` khi src là `asset:<id>` (clip từ
file .vcut — xem assetStore.ts); item có `unsupportedCodec` thì hiện
`⚠️` trong `.clip-label` (`data-testid="timeline-codec-badge"`,
`title`/`aria-label` dùng lại key `mediabin.codecBadgeTitle` của C6).
Badge chỉ là dấu hiệu (`<span>`, không phải nút) nên bấm/kéo clip vẫn
như cũ; modal giải thích vẫn mở từ badge trên thẻ MediaBin (không nối
thêm đường mở modal từ timeline — giữ phạm vi luồng). Áp cho clip
video/audio/image (text/nested không có src; sticker src là URL nên
lookup hụt → không badge).

**Dict giữ 2413 key lá, vi==en** — luồng này KHÔNG thêm key i18n mới
nên không bump test khóa số key nào (test mới chỉ khóa vi==en, không
khóa số 2413, để luồng D9 thêm key sau không phải sửa file này).

## 2. Kiểm chứng (chạy thật trên VM này)

### 2.1 Unit — `codecProbeDebts76D8.test.ts`: 14/14 pass

- `mergeSampleLoad` (thuần, 6 case): không đổi → spec mẫu; import 1 /
  nhiều file lúc bay → giữ đủ + giữ thứ tự; sửa timeline lúc bay → giữ
  spec user + vẫn gộp media mẫu; trùng tên mẫu → không nhân đôi; không
  mutate input.
- Nối tĩnh: store chụp `specAtStart` + gọi `mergeSampleLoad`; nhánh giữ
  spec chỉ set media + `ready: true`, không gọi `markSaved` /
  `clearHistory`; nhánh mẫu vẫn `markSaved(merged.spec)` +
  `clearHistory`; không còn `set({ spec, media })` ghi đè trong
  `loadSample` (khoanh đúng hàm — `replaceProject` vẫn set như cũ là
  đúng khi mở file/autosave).
- Nối tĩnh: modal có listener Escape đúng pattern O1 + không còn
  comment cũ "không thêm Escape"; timeline có badge + lookup
  `unsupportedCodec` + khớp `asset:` + badge là `<span>`.
- Dict vi==en, key dùng lại đủ cả hai bên.
- Chạy: `node scripts/run-node-test.mjs
  apps/web/src/lib/codecProbeDebts76D8.test.ts`.

### 2.2 Headed Chromium 1254 (Xvfb + CDP, vite dev) — 11/11 pass

Harness mới `apps/web/scripts/clicktest-76d8-codec-probe-debts.mjs`
(display :176, cổng riêng 5470/9570, profile mới mỗi lần chạy).
File test thật (ffmpeg libx265, 1920×1080, 2 s, sine 440 Hz):
`/tmp/round76-d8/hevc-a.mp4` — **PHẢI có `-movflags +faststart`**,
xem §4.1. Báo cáo JSON + screenshot:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round76-d8/headed/d8-headed-report.json`.

- **R1 race bin-only (t_hevc=2695 ms < t_mau=8392 ms — race được tập
  thật):** import ngay sau mở app → thẻ hevc xuất hiện TRƯỚC thẻ mẫu,
  badge=1 ngay từ đầu; sau khi mẫu load xong, file VẪN trong bin
  (`[mau-1, mau-2, hevc-a]`, badge=1) + mẫu vẫn load đủ 2 clip.
- **R2 race timeline (giữ spec):** import → bấm "Thêm vào playhead"
  trên thẻ hevc TRƯỚC khi mẫu load xong → sau khi mẫu xong, clip hevc
  VẪN trên timeline (`clips=["⚠️hevc-a.mp4"]`, chỉ 1 clip — spec mẫu
  không ghi đè), badge timeline = 1, file còn trong bin, **splash TẮT
  (R2d, splash=false)** — screenshot R2 lần 2 hiện đủ editor (khác lần
  đầu chỉ có splash, xem §1.1).
- **R3 bền vững qua reload:** chờ autosave debounce 5 s → reload →
  hevc còn trong bin + trên timeline, badge bin + badge timeline hiện
  lại (rehydrate probe).
- **R4 Escape đóng modal codec:** bấm badge → modal mở → focus nút ✕
  → Escape thật qua CDP → modal đóng (`modal=false`).
- **R5:** 0 lỗi trang trong phiên.

### 2.3 Hồi quy

- `tsc --noEmit` (apps/web): **0 lỗi** (chạy lại sau fix `ready`).
- `vite build`: **pass** (cảnh báo chunk >500 kB có sẵn).
- `codecProbeUi75C6` **16/16** (C6 không vỡ), `r6-i18n-check` **PASS**,
  `i18nOrphans60Q4` **16/16** (0 key mồ côi).

### 2.4 Hai lần chạy headed đầu — bài học ghi lại (không giấu)

1. **Lần 1 (9/10): R4 FAIL — modal không đóng sau Escape.** Nguyên
   nhân là HARNESS, không phải code modal: `dismissWelcome` ở R2 chạy
   ngay sau khi mẫu load xong, lúc WelcomeModal chưa kịp render nên bỏ
   qua → welcome ở lại đè lên modal codec ở R4 (2 modal chồng nhau —
   user thật không gặp vì backdrop chặn click import; chỉ harness
   `.click()` qua JS mới mở được modal codec khi welcome còn mở).
   Trong trạng thái chồng nhau đó, Escape đóng được welcome nhưng
   không đóng modal codec (chưa xác định được cơ chế chính xác — cả 2
   listener đều trên window, không có `stopPropagation` nào; xem §4.4).
   Harness đã sửa: `dismissWelcome` chờ welcome hiện (tối đa 30 s) rồi
   mới Escape + R4 kiểm tra welcome đã đóng trước khi bấm badge → lần
   chạy sau R4 xanh. Code modal KHÔNG đổi giữa 2 lần chạy (dist đã
   build có listener — kiểm chứng bằng grep).
2. **Lần 1 cũng lộ bug `ready` (§1.1):** screenshot R2 lần đầu chỉ có
   splash. Đã sửa (`ready: true` ở nhánh giữ spec) + thêm assertion
   R2d + chạy lại toàn bộ → 11/11.
3. **Lần chạy chẩn đoán xen giữa (diag/diag2/diag3):** import timeout
   khi máy tải nặng (nhiều luồng round 76 chạy headed song song trên
   1,5 CPU) + profile tái dùng gặp lỗi SingletonLock/TMPDIR + serve
   sai cổng làm mất autosave theo origin. Tất cả đều là vấn đề harness/
   môi trường, không phải code sản phẩm; chi tiết ở §4.4. Các script
   chẩn đoán đã xóa sau khi xong (chỉ giữ harness chính).

## 3. Files (stage, KHÔNG push)

- Mới: `apps/web/src/lib/sampleLoadMerge76D8.ts`,
  `apps/web/src/lib/codecProbeDebts76D8.test.ts`,
  `apps/web/scripts/clicktest-76d8-codec-probe-debts.mjs`,
  `docs/PHASE9_ROUND76_D8_CODEC_PROBE_DEBTS_LIMITS.md`.
- Sửa: `apps/web/src/store.ts` (`loadSample` merge + import),
  `apps/web/src/components/CodecUnsupportedModal.tsx` (Escape),
  `apps/web/src/Timeline.tsx` (badge clip),
  `apps/web/tsconfig.json` (exclude 2 test mới).
- KHÔNG sửa `vi.json`/`en.json` (không thêm key).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round76-d8-codec-probe-debts.txt`
  (8 entry, toàn file text, không binary/workflow).

## 4. Giới hạn / nợ mở

1. **Probe fallback lọt file MP4 không faststart (PHÁT HIỆN MỚI,
   nợ đợt sau — ngoài phạm vi D8).** File test đầu của D8 không có
   `-movflags +faststart` → moov nằm sau mdat → `sniffMp4Codec` trả
   null trong slice 1 MiB → `probeCodecSupport` fallback "lấy ứng viên
   tốt nhất" → H.264 `probably` → verdict `supported` → KHÔNG badge,
   KHÔNG toast, preview đen lặng (đã đo: sniff null, verdict
   supported, codec H.264 — trong khi file là HEVC thật). Đây là quyết
   định thiết kế của B3 ("chỉ QUYẾT unsupported khi mọi ứng viên đều
   ''"), nhưng hậu quả là file HEVC/AV1 không faststart (máy quay/
   tool xuất mặc định thường không faststart) lọt lưới cảnh báo.
   Hướng sau: khi sniff null thì đừng lấy "tốt nhất" mà coi container
   MP4 chưa rõ codec là không chắc chắn (vd verdict `maybe` + badge
   khác, hoặc sniff sâu hơn / tìm moov ngoài slice 1 MiB). File test
   headed của D8 đã dùng faststart nên badge đo được là đúng; nợ này
   chỉ ảnh hưởng file thật không faststart.
2. **Badge timeline không mở modal.** Clip trên timeline chỉ hiện
   `⚠️` + tooltip; muốn đọc cách xử lý thì bấm badge trên thẻ
   MediaBin. Hướng sau: bấm badge timeline cũng mở modal (cần chặn
   `onPointerDown` của clip khi bấm badge — hiện badge là span nên
   chưa làm).
3. **Safari thật vẫn chưa đo** (kế thừa C6): mọi verdict/badge/modal/
   Escape chỉ đo trên Chromium 1254. Cần máy macOS/iOS thật.
4. **Trạng thái 2 modal chồng nhau chưa rõ cơ chế (harness artifact,
   lần chạy đầu §2.4).** Khi WelcomeModal đè lên CodecUnsupportedModal,
   Escape đóng được welcome nhưng không đóng modal codec — chưa xác
   định được vì sao (cả 2 listener đều trên window, không có
   `stopImmediatePropagation` nào trong repo; code modal đã kiểm chứng
   có trong bundle). User thật khó gặp (backdrop chặn click import khi
   welcome còn mở). Hướng sau: nếu muốn chắc, nối modal codec vào
   handler Escape toàn cục của App (R1-107) thay vì listener riêng, hoặc
   cấm mở modal codec khi có modal khác đang mở.
5. **Verdict `maybe` vẫn im lặng** (quyết định B3 giữ nguyên).
   Sniff vẫn giới hạn như B3 (slice đầu 1 MiB, CodecID đầu tiên).
6. **Gợi ý proxy chỉ đúng khi file cao hơn 720p; proxy cần bridge
   chạy** (kế thừa C6 §4 mục 2–3, không đổi).
7. **Harness headed nhạy với môi trường (ghi để luồng sau khỏi mất
   thời gian):** (a) splash chỉ tắt khi `ready` nên chờ mount kiểu
   "topbar + hết splash" là chờ hết cửa sổ race — phải poll input file
   xuất hiện rồi import ngay; (b) localStorage/IndexedDB theo origin
   (kể cả cổng) — tái dùng profile phải serve ĐÚNG cổng cũ không thì
   mất autosave; (c) Chrome cần TMPDIR tồn tại để tạo socket Singleton
   + phải xóa SingletonLock/Socket/Cookie stale sau SIGKILL; (d) chạy
   nhiều headed song song trên VM 1,5 CPU làm import/probe chậm hàng
   chục lần (timeout 90 s từng gặp); (e) `/tmp` bị dọn giữa các lượt —
   file test `hevc-a.mp4` phải tạo lại mỗi lần (lệnh ffmpeg ở §2.2).
8. **Dict là file chung với các luồng round 76 khác.** Lúc D8 xong,
   dict là 2413; nếu luồng khác thêm key sau thời điểm này thì parent
   gộp phải đếm lại và bump các test khóa số key (mẫu B3/B9/C6). Test
   mới của D8 không khóa số 2413 nên không cần sửa khi dict tăng.
