# Phase 9 đợt 27, luồng K4 — Phát ngược trong preview + chứng minh hold-frame kích hoạt trong app thật (nợ #4 đợt 26) — LIMITS

Ngày: 31/10/2026. Luồng K4 trong đợt lớn round 27. KHÔNG push, KHÔNG
release/tag, KHÔNG code giả. Parent lo file paths-loop và build-loop-log;
luồng này KHÔNG tự ghi 2 file đó.

## 1. Việc làm (tóm tắt)

Đợt 26 J4 để lại 2 nợ: (a) phát ngược chưa sửa — `syncMedia` giữ
element ở paused + seek từng frame nên `decideVideoFrame` (suy ra "đang
phát" từ `!paused`) vẫn skip; (b) hold chưa từng được chứng minh kích
hoạt trong app thật (lần chạy hồi quy decode không đói nên chỉ chứng
minh không hồi quy, 0 tick đen). K4 đóng cả 2:

- **Phát ngược TOÀN CỤC (mới):** cờ store `reversePlayback` + action
  `toggleReversePlayback` / `setReversePlayback`. Khi phát ngược, vòng
  lặp preview KHÔNG cộng `dt` vào playhead như phát xuôi mà tích lũy
  `dt` rồi bước lùi đúng từng frame (`reverseStep` + `reversePlayhead`
  trong `lib/reversePlayback.ts`): mỗi frame timeline hiện đúng 1 lần,
  không lặp/skip do làm tròn (phát xuôi cộng `dt` ~16ms rồi snap về
  lưới frame 33ms vẫn đúng vì playhead tiến liên tục, nhưng chiều ngược
  cần bước nguyên frame mới không bị kẹt/lặp). Chạm 0 thì dừng, không
  quấn về cuối. `syncMedia` ở chế độ này pause + seek-stepping TẤT CẢ
  clip (clip xuôi thì target lùi, clip reverse thì target tiến — cùng
  `collectActives` cũ nên đúng chiều), không `play()` element nào.
- **Sửa phát ngược của CLIP reverse (cùng cơ chế):** vòng lặp đặt ngữ
  cảnh `drawTransport = {playing, reversePlayback}` trước mỗi lần gọi
  `renderFrame`; `drawVideoClip` tính `stepping = playing &&
  (reversePlayback || clip.reverse)` và truyền vào `decideVideoFrame`
  (thêm cờ `stepping` — xem `holdFrame.ts`). Nhờ vậy element paused
  nhưng đang seek-stepping thì hold thay vì skip. Không luồn tham số
  qua các wrapper transition/dip/mask (vùng luồng khác) mà dùng biến
  ngữ cảnh module — vòng lặp là nơi duy nhất gọi `renderFrame` nên
  không có đường vẽ nào khác đọc sai ngữ cảnh.
- **Guard frame stale khi stepping:** chỉ draw element khi
  `|currentTime - target| <= 0.5 frame` (`seekOnTarget`, target tính
  bằng `rampSourceTimeAt` như `collectActives`). Seek còn bay mà vẽ thì
  frame trên element vẫn là frame cũ nhưng sẽ bị mạo nhận là frame tại
  `t` — thay vào đó hold frame tốt cũ (nội dung đúng frame trước đó,
  không đen). Để guard và seek khớp nhau, ngưỡng seek của `syncMedia`
  cho clip stepping cũng đổi từ 0.03 cố định sang 0.5/fps (trước đây
  vùng drift (0.5/fps, 0.03] sẽ làm tầng vẽ hold mãi trong khi
  `syncMedia` không seek).
- **Audio khi phát ngược — trung thực, không giả vờ:** phát ngược toàn
  cục mute TOÀN BỘ audio; clip reverse vẫn mute như Phase 7 P1. Web
  Audio không phát ngược đồng bộ được, và tiếng xuôi lệch hình còn tệ
  hơn im. Trạng thái được báo rõ: badge "◀ PHÁT NGƯỢC — không audio"
  trên preview + nút ◀ + title phím tắt.
- **UI:** nút ◀ trong nhóm transport của TopBar (aria-label ổn định
  "Phát ngược", title ghi rõ không có audio đồng bộ), phím J =
  phát ngược / dừng ngược (chuẩn shuttle NLE; xem §5 về hành vi cũ bị
  thay), Space/K = tạm dừng/tiếp tục theo đúng hướng hiện tại, nút ▶
  luôn nghĩa là phát XUÔI (đang ngược thì tắt cờ rồi phát). Badge
  "⏸ FRAME GIỮ" (thêm "(cũ)" khi quá ngưỡng) cập nhật qua DOM trực
  tiếp như các badge khác.
- **Đo tuổi frame giữ + thống kê hold:** cache frame giữ ghi thêm
  `firstHeldT` (playhead lúc bắt đầu giữ) và `holdTicks`; thống kê
  `{draw, hold, skip, maxHoldAgeSec, stale}` phơi qua
  `window.__vcutHoldStats` (cùng kiểu hook đo `__vcutPreviewIdle` đã có
  sẵn, không gây re-render). Vượt ngưỡng 3 s timeline (`MAX_HOLD_AGE_SEC`)
  thì frame VẪN GIỮ — quay lại đen còn tệ hơn — chỉ đánh dấu stale để
  badge/thống kê báo rõ (xem §4).

## 2. Kiểm chứng tầng thuần + build

- `holdFrame.test.ts`: **13/13 pass** (9 cũ + 4 mới cho stepping:
  paused+stepping+RS=1 → hold; paused+stepping+chưa có frame → skip;
  paused không stepping vẫn skip như cũ; stepping không thắng draw).
- `reversePlayback.test.ts` (mới): **10/10 pass** — tích lũy frame
  không skip/lặp (60 tick × 16ms = đúng 28 bước), lùi đúng bội số
  frame, kẹp 0 + reachedStart, holdStale cả 2 chiều playhead
  (khoảng cách `|t - firstHeldT|`, không phải `t - firstHeldT`, vì
  phát ngược thì `t` giảm), seekOnTarget dưới nửa frame là đúng vị
  trí, lệch 1 frame là stale. (Một test ban đầu fail do biên float
  đúng 0.5 frame: `10 + 0.5/30` làm tròn vượt ngưỡng 1 ulp — đã sửa
  test dùng 0.4/0.6 frame thay vì sửa code để "vừa" biên float.)
- Hồi quy: `previewEngine.test.ts` 14/14, `nestedPreview.test.ts`
  46/46, `nestedPreviewFailsoft26J1.test.ts` 6/6,
  `transitionPreview.test.ts` 31/31.
- `tsc --noEmit`: sạch (0 lỗi) tại thời điểm kiểm tra cuối.
- `vite build` pass: `dist/assets/index-mIzUrd00.js` (981.14 kB).

## 3. Chứng minh trên app thật (harness CDP pipe, mẫu J6)

Harness mới `apps/web/scripts/clicktest-reverse-hold-pipe.mjs`
(Chrome headed dưới Xvfb qua `--remote-debugging-pipe`, snapshot dist
đóng băng bundle, seed project rỗng qua autosave như J6, import video
bằng `DOM.setFileInputFiles` lên input file thật của MediaBin, bấm nút
"＋ Thêm" và nút transport bằng `.click()` trên element UI thật —
không gọi store trực tiếp). Lần chạy đầu chết ở CDP handshake vì thiếu
`--no-sandbox` khi chạy dưới root (Chrome thoát ngay, CDP timeout
60 s) — đã sửa theo đúng mẫu J6, ghi rõ trong header script.

Video đo (tự tạo bằng ffmpeg, lệnh trong header script + dưới đây):
1280×720, 30 s, 30 fps, x264, không B-frame, mỗi giây một mức luma
`Y = 20 + 7×giây` để suy ngược được giây nguồn từ mức xám trung tâm
canvas (sau giải mã YUV limited-range: `RGB ≈ (Y-16)×255/219`, đã
kiểm chứng frame giây 10 cho mean 86.0 ≈ (90-16)×255/219 ≈ 86.1).

```sh
# GOP thưa (bệnh lý): 1 keyframe / 300 frame
ffmpeg -f lavfi -i nullsrc=s=1280x720:d=30:r=30 \
  -vf "geq=lum='20+trunc(N/30)*7':cb=128:cr=128" \
  -c:v libx264 -pix_fmt yuv420p -g 300 -bf 0 -preset medium -r 30 \
  sparse-gop-flat.mp4   # 45 KB
# GOP dày (đại diện footage thường): 1 keyframe / 30 frame (1 s)
ffmpeg ... -g 30 ... dense-gop-flat.mp4   # 49 KB
```

Kết quả (JSON đầy đủ ở scratch `~/workspace/tmp-round27-k4/`:
`reverse-hold-sparse.json`, `reverse-hold-dense.json` — parent quyết
có stage vào `benchmarks/results` hay không):

| Đo | GOP thưa (g 300) | GOP dày (g 30) |
|---|---|---|
| Playhead ngược (14 s đo) | 29.5 → 15.7 (lùi đều từng frame, đúng) | 29.5 → 15.8 (lùi đều từng frame, đúng) |
| Khung hình hiển thị (gray suy ngược) | 6×17 mẫu rồi 20×11 mẫu — KHÔNG khớp playhead | 29,29,28,28,…,16,16 — KHỚP playhead từng giây |
| Hold trong pass ngược (delta) | **740** (draw chỉ +7) | **629** (draw +201) |
| Tick đen trong pass ngược | 0 | 0 |
| Tuổi giữ lớn nhất | **9.1 s** (stale = true) | 0.5 s (stale = false) |
| Badge PHÁT NGƯỢC / FRAME GIỮ | thấy cả 2 | thấy cả 2 |
| Verdict | PARTIAL (hold đã chứng minh, hình lag) | **PASS** |
| Pass xuôi đối chứng (6 s) | draw 248, hold 54, tuổi giữ max 0.67 s | draw 352, hold 7, tuổi giữ max 0.033 s |

Đọc kết quả — phân biệt rõ "code đúng" với "nội dung bệnh lý":

- **Hold ĐÃ được chứng minh kích hoạt trong app thật (đóng nợ đợt 26).**
  Pass ngược GOP thưa: 740 tick hold, chỉ 7 tick draw, 0 tick đen,
  badge FRAME GIỮ hiện, tuổi giữ tới 9.1 s. Cơ chế đúng như thiết kế:
  seek ngược từng frame trên GOP 300 bắt decoder giải mã lại từ
  keyframe (tới 870 frame) nên seek không bao giờ kịp bước 33ms —
  hold là thứ duy nhất giữ màn hình không đen.
- **Phát ngược ĐÚNG với footage thường (GOP 1 s):** gray suy ngược
  khớp playhead từng giây trong suốt 14 s, 0 tick đen, tuổi giữ tối
  đa 0.5 s. Đây là bằng chứng phát ngược vẽ đúng frame, không phải
  chỉ "playhead lùi".
- **GOP thưa là bệnh lý của nội dung, không phải bug code:** hình
  hiển thị kẹt ở frame giây 6 (frame tốt cuối của pass xuôi trước đó)
  suốt ~8.5 s, rồi nhảy lên frame giây 20 (seek hoàn thành muộn tới
  đúng vị trí playhead lúc đó ≈ 21 s), rồi kẹt tiếp. Playhead vẫn lùi
  đúng, seek vẫn nhắm đúng target, không frame sai nào bị mạo nhận là
  frame tại `t` — chỉ là tốc độ hiển thị hiệu dụng ≈ 1 frame / 8 s.
  Người dùng xem video GOP thưa (screencast dài, video nén mạnh) ở
  chế độ ngược sẽ thấy hình đứng yên rất lâu — đó là giới hạn thật,
  không giấu.
- **Ngay cả GOP dày, tốc độ hiển thị hiệu dụng cũng chỉ ≈ 14 fps**
  (201 draw / 14 s) thay vì 30 fps: mỗi bước frame đều tốn 1 seek mà
  seek hoàn thành sau ~1–2 tick, các tick giữa đó hold frame trước.
  Nhìn ở độ phân giải mẫu 0.5 s thì vẫn đúng giây, nhưng chuyển động ngược sẽ hơi
  giật so với phát xuôi mượt 60 tick/s. Đây là giá của seek-stepping
  trên `HTMLVideoElement` — không có cách phát ngược mượt mà nào khác
  mà không dùng WebCodecs decode tay (xem §5).
- Pass xuôi đối chứng không đen, hold ít (7 tick trên GOP dày).
  Pass xuôi GOP thưa có 54 hold / tuổi giữ max 0.67 s — chưa giải
  thích được chi tiết (chỉ có stats cuối, không có chuỗi từng mẫu ở
  lần chạy đó; lần chạy GOP dày đã bổ sung chuỗi từng mẫu vào JSON).
  Nghi ngờ là buffering lúc bắt đầu phát + trạng thái element sau
  import, không phải hồi quy từ K4 (đường phát xuôi không stepping
  giữ nguyên logic J4), nhưng ghi rõ là câu hỏi mở, không bịa nguyên
  nhân.

## 4. Giới hạn còn lại — đọc kỹ trước khi coi là xong

- **Chưa từng có frame tốt thì vẫn đen.** Hold chỉ vẽ lại frame đã
  từng draw thành công; bắt đầu phát (xuôi hay ngược) khi decoder
  chưa giao frame đầu thì không có gì để giữ. Đây là giới hạn cố hữu,
  không sửa được ở tầng preview (cần pre-decode frame đầu trước khi
  cho phát — việc khác, chưa làm).
- **Nhánh pause:** seek thất bại thì Seeker reset guard để thử lại
  (hành vi cũ, không đổi). Pause + seek xong mà frame chưa sẵn vẫn
  skip như cũ (không hold) để tránh vẽ frame sai vị trí sau scrub.
- **Frame giữ cũ vô hạn khi đói kéo dài — nay chỉ BÁO, không hết hạn.**
  K4 cố tình không expire về đen (đen là thứ cần tránh); thay vào đó
  tuổi giữ được đo (`maxHoldAgeSec`), đánh dấu stale quá 3 s, badge
  hiện "(cũ)". Hệ quả A/V: tiếng (nếu có, ở phát xuôi) vẫn chạy trong
  khi hình đứng yên — vẫn tốt hơn đen kịt, nhưng không phải "phát
  mượt". Muốn hết hạn "đẹp" hơn cần quyết định sản phẩm (vd dừng phát
  + báo "đang chờ decoder") — chưa có quyết định đó nên không tự ý
  làm.
- **Nội dung giữ cũ nhưng geometry chạy theo `t`** (giới hạn J4 còn
  nguyên): mask/SR/track/opacity tính tại `t` hiện tại nên clip có
  motion/track sẽ thấy khung di chuyển mà mặt hình đứng yên trong lúc
  đói — chấp nhận được cho vài tick, trông lạ nếu đói kéo dài (đo
  được tới 9.1 s ở GOP thưa ngược).
- **Phát ngược + speed ramp / nested:** chưa harness-test riêng. Về
  code, target seek dùng chung `rampSourceTimeAt` (ramp) và spec đã
  làm phẳng nested nên đường đi giống clip thường; nhưng clip
  reverse+ramp vốn bị validator chặn, còn clip ramp ở chế độ ngược
  toàn cục chưa có case đo — không claim đã phủ.
- **Không có audio ngược đồng bộ** (xem §1): mute toàn bộ khi phát
  ngược toàn cục, mute clip reverse như cũ. Render export vẫn dùng
  `areverse` nên bản xuất có tiếng ngược thật — chỉ preview là im.
- **Chi phí:** 1 `drawImage` thêm mỗi tick draw thành công (kế thừa
  J4) + thống kê vài phép gán số mỗi tick (không re-render React).
  Cache tối đa 16 clip như cũ.
- **Video 420 MB đã bỏ:** bản nhiễu `sparse-gop-noise.mp4` (nhiễu
  thời gian, 420 MB) đã tạo nhưng không dùng — GOP thưa một mình đã
  đủ gây đói, file phẳng 45 KB cho cùng kết luận. File nhiễu vẫn nằm
  ở scratch, không đưa vào repo.

## 5. Quyết định đổi hành vi + follow-up

- **Phím J đổi nghĩa:** trước đây J tua -5 s, nay J = phát ngược /
  dừng ngược (chuẩn shuttle NLE: J ngược, K dừng/tiếp tục, L +5 s
  giữ nguyên). Tua lùi nay dùng ArrowLeft (từng frame) hoặc kéo
  playhead. Comment trong `App.tsx` đã cập nhật và trỏ sang LIMITS
  này (không còn câu "preview chưa hỗ trợ reverse").
- **Chuỗi nút ◀ để chữ Việt trực tiếp, không thêm key i18n:** để khỏi
  xung đột file `vi.json`/`en.json` với luồng khác trong cùng đợt;
  tiền lệ chuỗi trực tiếp đã có trong MediaBin. Nếu đợt sau chuẩn
  hóa i18n thì chuyển 2 chuỗi (aria-label "Phát ngược", title nút)
  sang key mà không đổi hành vi.
- **Follow-up (không làm trong K4):** (1) phát ngược mượt bằng
  WebCodecs decode tay (bỏ seek-stepping) nếu muốn 30 fps hiển thị
  thật — việc lớn, cần đánh giá riêng; (2) pre-decode frame đầu để
  bớt đen lúc bắt đầu phát; (3) làm rõ 54 hold ở pass xuôi GOP thưa
  (§3) bằng chuỗi stats từng mẫu; (4) harness-test phát ngược cho
  clip ramp và clip nested.

## 6. File đổi/thêm (text, không binary — parent gộp batch)

- Sửa: `apps/web/src/lib/holdFrame.ts` — thêm cờ `stepping` vào
  `VideoFrameReadiness` + quyết định hold khi stepping (đổi duy nhất
  hành vi paused+stepping; pause thật không đổi).
- Mới: `apps/web/src/lib/reversePlayback.ts` — `reverseStep`,
  `reversePlayhead`, `holdStale`, `seekOnTarget` + hằng số
  `REVERSE_SEEK_TOLERANCE_FRAMES = 0.5`, `MAX_HOLD_AGE_SEC = 3`.
- Mới: `apps/web/src/lib/reversePlayback.test.ts` — 10 test.
- Sửa: `apps/web/src/lib/holdFrame.test.ts` — thêm 4 test stepping
  (tổng 13/13).
- Sửa: `apps/web/src/store.ts` — `reversePlayback` + `setReversePlayback`
  + `toggleReversePlayback`; `togglePlay` thêm nhánh restart ngược
  (ở 0 → về cuối rồi phát ngược, đối xứng nhánh xuôi).
- Sửa: `apps/web/src/preview.tsx` — CHỈ vùng phát ngược/hold: import
  helper; cache frame giữ thêm `firstHeldT`/`holdTicks`; thống kê
  `holdStats` + hook `window.__vcutHoldStats` + ngữ cảnh
  `drawTransport`; nhánh video của `drawVideoClip` (stepping + guard
  stale + thống kê); `renderFrame` reset `tickHadHold`; `syncMedia`
  thêm tham số `reversePlayback` (seek-stepping toàn cục, mute toàn
  bộ, ngưỡng seek 0.5/fps); vòng lặp (bước lùi playhead, đặt ngữ cảnh
  transport, badge FRAME GIỮ); JSX (badge PHÁT NGƯỢC theo React +
  badge FRAME GIỮ qua ref). Không reformat, không đụng vùng vẽ
  transition/dip/mask của luồng khác.
- Sửa: `apps/web/src/TopBar.tsx` — nút ◀ + nút ▶ luôn phát xuôi.
- Sửa: `apps/web/src/App.tsx` — phím J thành phát ngược (xem §5).
- Sửa: `apps/web/tsconfig.json` — thêm `reversePlayback.test.ts`
  vào exclude (đúng quy ước repo).
- Mới: `apps/web/scripts/clicktest-reverse-hold-pipe.mjs` — harness
  đo §3 (tái dùng mẫu J6: pipe CDP + snapshot dist + seed autosave).
- Mới: `docs/PHASE9_ROUND27_K4_REVERSE_HOLD_LIMITS.md` — file này.
- Build output `apps/web/dist/` đã build lại tại chỗ để đo (bundle
  `index-mIzUrd00.js`) — parent quyết có stage hay không. Scratch đo
  (video + JSON + snapshot dist + chrome-profile) nằm ở
  `~/workspace/tmp-round27-k4/` và KHÔNG đưa vào repo (video 420 MB
  bản nhiễu + 2 video phẳng 45/49 KB chỉ phục vụ đo).
