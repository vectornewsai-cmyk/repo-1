# MARKERS_LIMITS.md — Timeline markers + MixerMeter (Phase 9)

Batch: marker/chapter trên timeline + thanh đo mức mix tổng của preview.
Test: `node apps/web/scripts/markers.test.cjs` (48 check pass: TS + JS mirror
+ parity + round-trip JSON). i18n check: `node apps/web/scripts/r6-i18n-check.cjs`
pass (vi=en=552 key). tsc 0 lỗi, vite build pass.

## 1. Marker — đã làm thật

- Spec: `Marker { id, time, label?, color? }` trong
  `packages/video-spec/src/markers.ts` (+ mirror `markers.js` viết tay, giữ
  khớp theo quy ước DEVELOPER.md §4). `VideoSpec.markers?` (optional) trong
  `index.ts`. Không có field = không có marker — project cũ load bình thường,
  không cần migration.
- Validate: `validateMarkers` bắt id rỗng/trùng, time âm/NaN/không phải số,
  label/color không phải chuỗi. Không có hàm `validateProject` tập trung
  trong video-spec (chỉ có validator của render worker), nên validate được
  gọi ở tầng store khi thêm marker (thêm fail → trả null, không ghi spec bẩn).
- UI (`Timeline.tsx`): marker vẽ trên ruler (vạch màu + nhãn), click marker
  → seek tới đó + mở panel sửa; nút "📍 Marker" trên toolbar + phím `M`
  (App.tsx) thêm marker tại playhead; panel sửa nhãn (commit khi blur/Enter
  để mỗi lần sửa chỉ tốn 1 bước undo), đổi màu từ bảng 6 màu, xoá marker.
  Mọi thao tác qua `execCommand` nên undo/redo được.
- Lưu trữ: marker nằm trong `spec.markers` nên save/load project JSON, autosave
  và export JSON đều giữ nguyên — đã kiểm chứng bằng round-trip test
  (stringify → parse → validate sạch, byte-identical).
- Render worker: validator hiện tại không từ chối field top-level lạ nên
  project có markers vẫn render bình thường; render worker đơn giản BỎ QUA
  field này (không đọc, không vẽ).

## 2. MixerMeter — đo nguồn nào (đọc kỹ, đừng claim quá)

- **Meter đo MIX TỔNG của preview, không phải 1 clip riêng lẻ.**
  Nguồn là `AnalyserNode` của master bus trong `AudioEngine`
  (`lib/audioEngine.ts`, getter mới `getAnalyser()`): chuỗi
  `element → FX → gain riêng → master GainNode → AnalyserNode → loa`.
  Mọi media element đang phát trong preview (video, audio, tiếng kế thừa)
  đều đi qua master này, nên thanh meter phản ánh đúng cái người dùng nghe.
- **MONO, không tách L/R.** Một AnalyserNode duy nhất trên master bus chỉ
  cho time-domain đã mix; `getByteTimeDomainData` không tách kênh.
  Muốn L/R thật phải chèn `ChannelSplitterNode` trước master — chưa làm.
- **Chỉ đo khi preview đã phát ít nhất 1 lần trong phiên.** AudioContext
  chỉ được tạo từ user gesture (nút play); trước đó analyser = null và
  meter hiện idle "chưa phát" (0, −∞ dBFS), không bịa số.
- **Không đo được reverb/noiseReduction của render.** Hai hiệu ứng này
  không có node Web Audio tương đương nên preview không áp dụng chúng
  (xem AUDIOFX_LIMITS.md) — meter đo tín hiệu preview thực tế, có thể khác
  nhỏ so với file render cuối khi bật 2 hiệu ứng đó.
- **Vẽ bằng rAF + DOM trực tiếp (không setState mỗi frame)**, peak-hold giữ
  đỉnh 1 giây rồi decay. Vu-meter cũ trong preview.tsx vẫn giữ nguyên;
  MixerMeter là thanh thứ hai, chi tiết hơn (peak-hold + dBFS).

## 3. Chưa làm (trung thực)

- Marker **chưa export chapter** ra file (không có cue chapter trong MP4,
  không xuất file .cue/.chapters, không nhúng metadata chapter khi render).
- Marker **chưa snap** khi thêm (thêm đúng playhead đã snap theo frame của
  store; không snap tới mép clip hay marker khác) và **chưa kéo-thả** marker
  trên ruler để đổi time (muốn đổi time hiện chỉ xoá rồi thêm lại).
- **Chưa có phím tắt tới marker trước/sau** (hàm thuần `nearestMarkerBefore`
  đã có sẵn trong markers.ts để dùng sau).
- Marker **chưa hiện trên thanh tiến trình của preview** (chỉ trên ruler
  của Timeline) và **chưa có danh sách marker tổng quan** (chỉ click từng
  marker trên ruler để sửa).
- Trùng time được phép (nhiều marker cùng 1 thời điểm vẽ chồng nhau trên
  ruler; click sẽ trúng marker trên cùng theo thứ tự DOM).
- **Chưa có click-test Playwright cho marker.** Test Playwright cần Chromium
  (môi trường này không cài được browser — nợ chung hạ tầng của dự án, xem
  các *_LIMITS khác). UI marker mới chỉ được kiểm chứng bằng tsc + vite build
  (biên dịch qua, không chạy browser thật); logic thuần đã có test Node đầy đủ.
- MixerMeter **chưa tách L/R, chưa có dải tần (spectrum)** và **chưa đo
  từng track riêng** (muốn meter theo track phải gắn analyser riêng cho mỗi
  GainNode của element — chưa làm).

## 4. File của batch

- `packages/video-spec/src/markers.ts`, `packages/video-spec/src/markers.js`
- `packages/video-spec/src/index.ts` (export markers + field `markers?`)
- `apps/web/src/store.ts` (addMarkerAtPlayhead/updateMarker/deleteMarker)
- `apps/web/src/Timeline.tsx` (vẽ marker trên ruler + panel sửa + nút thêm)
- `apps/web/src/App.tsx` (phím tắt M)
- `apps/web/src/components/MixerMeter.tsx` (mới)
- `apps/web/src/lib/audioEngine.ts` (chỉ thêm getter `getAnalyser()`)
- `apps/web/src/preview.tsx` (chỉ mount MixerMeter cạnh vu-meter)
- `apps/web/src/styles.css` (style marker + mixer-meter)
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (key
  `timeline.marker*` + section `mixer`)
- `apps/web/scripts/markers.test.cjs` (test)
- `apps/web/src/components/MARKERS_LIMITS.md` (file này)
- KHÔNG chạm: `packages/video-spec/src/audio.ts`, `server/render/src/render.js`,
  `apps/web/src/components/audiofx/AudioFxPanel.tsx` (đang có agent khác sửa).
