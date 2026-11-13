# PHASE9_ROUND87_O5_MASK_TRACK_UI_LIMITS.md — Đợt 87, luồng O5: mask bám motion track — UI gắn track + i18n

## Đã làm (11/11/2026, KHÔNG PUSH)

UI cho thiết kế đợt 87 (tracked mask = tâm mask bám quỹ đạo `clip.track` đã
có; khi clip vừa có track vừa có mask thì mask bám theo track). Chỉ sửa UI +
i18n + test, KHÔNG đụng render/preview/spec/validator.

### 1. MaskPanel — khối trạng thái mask bám track (clip video, có mask)

Helper pure export được `maskTrackUiState(clip)` → `"follow" | "attach" |
"transition" | "none"`, component rẽ nhánh theo đó:

- **follow** (video + mask + track, không transition): hint
  `mask.trackFollow` ("🎯 Mask đang bám theo motion track — tâm mask di
  chuyển theo quỹ đạo gắn trên clip…") + nút `mask.trackDetach` ("Gỡ quỹ
  đạo khỏi clip"). Nút này gỡ quỹ đạo khỏi clip qua `patchClip({track:
  undefined})` — cùng cơ chế thật với nút "Gỡ quỹ đạo" của TrackPanel.
  KHÔNG có toggle riêng cho mask vì track gắn ở clip, không gắn ở mask;
  nhãn nói rõ gỡ quỹ đạo sẽ dừng cả clip lẫn mask.
- **attach** (video + mask, chưa track): hint `mask.trackAttachHint` +
  nút `mask.trackAttachBtn` ("🎯 Gắn motion track…") cuộn tới TrackPanel
  có sẵn trong Inspector (`document.querySelector(".track-panel")?.
  scrollIntoView(...)`) — không viết lại flow gắn track.
- **transition** (video + mask + track + transitionIn/Out): cảnh báo
  `motionTrack.transitionIgnored` + `motionTrack.maskNotFollowing` thay vì
  hint bám (validator: track bị bỏ qua ở unit đã merge — xem D3_LIMITS.md).
- **none**: clip ảnh (không gắn được track — TrackPanel không render cho
  ảnh, validator bỏ qua track trên ảnh) và clip chưa có mask → không hiện
  khối track nào. Clip text vẫn giữ nhánh `tipUnsupported` cũ (mask trên
  text bị render bỏ qua hoàn toàn); cảnh báo ASS cho text nằm ở TrackPanel.

### 2. TrackPanel — cảnh báo khi track bị render bỏ qua

Helper pure export được `trackIgnoredReason(clip)` → `null` (track có tác
dụng) hoặc `{kind: "ass", reason}` / `{kind: "transition"}`, khớp đúng điều
kiện validator (`server/render/src/validate.js`):

- Text `typewriter` → reason `"typewriter"`; có `karaoke` (dù animation
  khác) → `"karaoke"` (karaoke thắng, cùng thứ tự thắng như render);
  animation parity `tiltIn | skewIn | slideReveal | curtainIn` →
  reason là tên animation đó. Danh sách parity để ở module scope
  (`PARITY_ANIMATIONS`) và test khóa khớp từng chữ với
  `server/render/src/textAnimParity.js`.
- Video có `transitionIn`/`transitionOut` → `{kind: "transition"}`.
- Sticker / text thường / video không transition → `null`.

Khi track ĐÃ gắn mà `trackIgnored` thì: gợi ý `motionTrack.followNote`
("Clip sẽ bám theo vật thể…") bị ẨN, thay bằng cảnh báo
`motionTrack.assIgnored` ({reason}) hoặc `motionTrack.transitionIgnored`
(class `.error` sẵn có), kèm `motionTrack.maskNotFollowing` ("Mask cũng
không bám theo track.") khi clip có mask. Khi track chưa gắn thì không
cảnh báo gì (không có gì bị bỏ qua). Dòng "Đã gắn quỹ đạo: N điểm" vẫn
giữ (đúng sự thật: track đã gắn, chỉ bị render bỏ qua).

### 3. i18n — 7 key mới, fragment riêng (chưa gộp vào dict)

`apps/web/src/i18n/fragments/round87-o5.json` (`{vi, en}`), theo mẫu M1
đợt 56 — KHÔNG sửa `vi.json`/`en.json` trực tiếp để khỏi xung đột luồng
song song; parent gộp ở cuối đợt:

- `mask.trackFollow`, `mask.trackDetach`, `mask.trackAttachHint`,
  `mask.trackAttachBtn`
- `motionTrack.assIgnored` (placeholder `{reason}`),
  `motionTrack.transitionIgnored`, `motionTrack.maskNotFollowing`

vi/en parity, placeholder khớp, vi khác en, không đụng key đã có trong
dict (test khóa). Không còn literal VI cứng cho các chuỗi này trong 2
panel (khóa quét i18n sweep).

### 4. Test — `apps/web/src/components/mask/maskTrackUi87O5.test.ts` (18/18 pass)

- A. Fragment: đúng 7 key, parity, placeholder, không đụng dict.
- B. Parity list UI khớp `textAnimParity.js` từng chữ.
- C. Source wiring: đúng key ở đúng panel, không literal cứng; component
  dùng helper quyết định nhánh.
- D. Probe logic thuần (không mock store): `maskTrackUiState` 6 case +
  `trackIgnoredReason` 5 case (typewriter, karaoke thắng typewriter, cả 4
  parity, fadeUp/karaoke rỗng → null, video transition 2 đầu, sticker → null).
- E. SSR smoke: MaskPanel state khởi tạo → tipSelect; TrackPanel → rỗng.

Chạy: esbuild bundle `--format=cjs` + node (mẫu M1/splitPatch), xem đầu file test.

## Kiểm chứng

- `maskTrackUi87O5.test.ts`: **18/18 pass**.
- `tsc --noEmit` (apps/web): **0 lỗi** (đã sửa 1 lỗi narrow `rawClip |
  undefined` bằng cách tách early return — không đổi hành vi).
- `vite build`: **pass** (45,5s; chỉ warning chunk >500 kB có sẵn từ trước).
- `i18nOrphans60Q4.test.ts`: **16/16 pass** (dict không đụng: vẫn 2507 key).

## Giới hạn thật / nợ mở (không giấu)

1. **Hint "mask bám track" phụ thuộc luồng render/preview đợt 87 (O1–O4).**
   Lúc O5 xong, `server/render/src/D3_LIMITS.md` §1 vẫn ghi mask chưa bám
   track ở render ("clip chạy khỏi mask"). Hint trong MaskPanel mô tả đúng
   *thiết kế đợt 87*, nhưng chỉ đúng sự thật khi wiring render/preview của
   luồng khác lên. Nếu cuối đợt 87 wiring đó không lên, hint này SAI và phải
   gỡ/gate lại — parent cần verify bằng render test thật của luồng render
   trước khi coi đợt 87 xong. O5 không tự bịa kết quả render.
2. **Key mới chỉ nằm ở fragment, chưa gộp vào dict.** Cho tới khi parent
   gộp `round87-o5.json` vào `vi.json`/`en.json`, UI sẽ render ra đúng tên
   key (`mask.trackFollow`…) thay vì chuỗi tiếng Việt. Đây là quy trình
   chuẩn của đợt (M1), không phải bug — nhưng đừng demo UI trước khi gộp.
   Sau gộp, dict lên 2507 + 7 = 2514 key mỗi bên; test khóa số key
   (`i18nOrphans60Q4`, `i18nSweep81I9`, `ProjectMenu.i18n55L1`) cần parent
   bump số đếm lúc gộp (O5 không tự sửa các test đó vì dict chưa đổi).
3. **Nhánh UI chưa được render thật trên browser.** `renderToStaticMarkup`
   dùng `getServerSnapshot` của zustand nên luôn thấy state khởi tạo, dù
   `useStore.setState` đã đổi selection/spec (đã chứng minh bằng probe
   11/11: state sau setState đúng nhưng panel vẫn render nhánh tipSelect).
   Đây là giới hạn đã ghi trong repo (L1 đợt 55). Vì vậy test O5 khóa
   logic quyết định nhánh bằng helper pure + wiring + SSR smoke, KHÔNG
   giả vờ render đủ nhánh. Cần click-test trên browser thật: chọn clip
   video mask+track → thấy hint + nút gỡ (bấm gỡ thì track mất thật);
   clip mask chưa track → bấm "Gắn motion track" thì cuộn tới TrackPanel;
   text typewriter/karaoke + track → thấy cảnh báo ASS, không thấy gợi ý bám.
4. **Nút "Gắn motion track" chỉ cuộn, không focus/highlight TrackPanel.**
   Nếu layout Inspector đổi (TrackPanel không còn class `.track-panel`
   hoặc không render cho video), nút thành no-op im lặng (đã guard bằng
   `?.`, không crash). Nút "Gỡ quỹ đạo khỏi clip" gỡ TOÀN BỘ quỹ đạo
   khỏi clip (clip cũng dừng bám) — đúng thiết kế (track gắn ở clip) nhưng
   user có thể tưởng chỉ tắt bám của mask; nhãn + hint đã nói rõ.
5. **Cảnh báo transition trong MaskPanel là mở rộng của nguyên tắc (c).**
   Task chỉ yêu cầu cảnh báo cho text typewriter/karaoke; O5 thêm trường
   hợp video + transition vì cùng lỗi "hiện gợi ý sai" và cùng validator
   (D3_LIMITS.md). Nếu parent muốn thu hẹp, chỉ cần xóa nhánh
   `"transition"` trong `maskTrackUiState` + TrackPanel giữ nguyên.
6. Không đụng: TTS 39, file workflow, render, spec, validator, dict chính.

## File đổi (stage, không push)

- `apps/web/src/components/mask/MaskPanel.tsx` (helper `maskTrackUiState` + khối track)
- `apps/web/src/components/sticker/TrackPanel.tsx` (helper `trackIgnoredReason` + cảnh báo, early return tách để tsc narrow)
- `apps/web/src/i18n/fragments/round87-o5.json` (7 key mới vi+en)
- `apps/web/src/components/mask/maskTrackUi87O5.test.ts` (18 test)
- `docs/PHASE9_ROUND87_O5_MASK_TRACK_UI_LIMITS.md` (file này)
