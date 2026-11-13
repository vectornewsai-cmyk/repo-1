# PHASE9_ROUND87_O8_MASK_TRACK_CLICKTEST_LIMITS.md — Click-test headed mask bám motion track (đợt 87 O8)

> Ngày: 2026-11-11. Luồng O8, đợt 87. KHÔNG push. KHÔNG release/tag.
> Bối cảnh: gap E5 — mask bám motion track. O1 spec/helper hình học, O2 render
> (mask chain), O3 render geq động `--mask-mode trackgeq` (tâm mask = track(T),
> video đứng yên, bỏ shift D3), O4 preview mirror (O4), O5 gợi ý UI + i18n
> (MaskPanel `maskTrackUiState`), O7 bench. Việc của O8: CLICK-TEST THẬT trên
> browser — không sửa code sản phẩm (không phát hiện bug sản phẩm nào ngoài
> §3, vốn đã biết + có chủ).

## 0. Kết quả tóm tắt (lần chạy cuối mỗi engine)

| Engine | Kết quả |
|---|---|
| Chromium headed (lần 4) | **19/21 pass, 2 fail** (cả 2 là cùng bug §3) |
| WebKitGTK 27.2 headed (lần 1) | **19/21 pass, 2 fail** (cùng 2 fail §3, cùng kịch bản) |

Chi tiết Chromium (lần 4) — bảng dưới; chi tiết WebKit — §5.

| Kịch bản | Kết quả |
|---|---|
| (c) Mask tĩnh không track — đúng vị trí ở 2 thời điểm | **PASS** — blob đúng (0.4158, 0.5000) canvas ở cả t=1.0 và t=5.0, sai số 0.0000 so với kỳ vọng qua letterbox |
| (a) Mask + track — tâm mask = vị trí track (pause, 2 thời điểm) | **PASS** — t=1.0: blob x=0.4436 (kỳ vọng 0.4439, sai 0.0003); t=5.0: blob x=0.5560 (kỳ vọng 0.5561, sai 0.0001); Δx=0.112 đúng kỳ vọng 0.112; cy≈0.50 |
| (a2) Mask + track — lúc đang phát | **PASS** — playhead local 2.53, blob x=0.4848 (kỳ vọng 0.4865, sai 0.0017) |
| (a3) Chẩn đoán bóng di chuyển — bóng nằm giữa mask | **PASS** — t=1: bóng (0.4417, 0.5071) vs mask (0.4436, 0.5001); t=5: bóng (0.5550, 0.5072) vs mask (0.5559, 0.5002); video đứng yên, mask bám track |
| (b1) Gợi ý O5 hiện khi đủ mask + track | **FAIL (đã biết, §3)** — khối gợi ý CÓ nhưng hiện KEY THÔ `mask.trackFollow` thay vì chữ Việt |
| (b2a) Bấm nút gỡ của MaskPanel thì track mất thật | **PASS** — nút `mask.trackDetach`, sau bấm `track=undefined` |
| (b2b) Gợi ý chuyển sang attach khi chỉ có mask | **PASS** — hiện `mask.trackAttachHint` (dạng key thô, cùng bug §3) |
| (b3) Gợi ý ẩn khi chỉ có track (đã tắt mask) | **PASS** — không còn khối gợi ý (state none) |
| (b4) Gợi ý hiện lại khi đủ mask + track (khôi phục) | **FAIL (đã biết, §3)** — vẫn key thô `mask.trackFollow` |
| E0 không lỗi JS/unhandledrejection | **PASS** |

**Tổng lần 4: 19/21 pass, 2 fail** (cả 2 fail là cùng 1 nguyên nhân §3).
Lần 3: 18/20 (cùng nội dung, chưa có b2a). Lần 2: 17/20 nhưng S4 FAIL oan
do bẫy hệ tọa độ (§4). Lần 1: 13/18 — VÔ HIỆU, đo nhầm video mẫu (§4);
không dùng số lần 1.

Kiểm chứng kèm (cây đã gộp, lúc 06:10–06:20 UTC 11/11):
- `tsc --noEmit` (apps/web): **exit 0**.
- `vite build` (apps/web): **pass, 6.38 s**.
- `node server/render/src/mask.js --self-test`: **pass** (gồm assert geq động O3).
- `maskTrackPreview87O4.test.ts` (esbuild bundle + node): **12/12 check xanh**.
- `maskTrackUi87O5.test.ts` (esbuild bundle + node): **18/18 pass**.
- `r6-i18n-check.cjs`: **12 lỗi** — toàn bộ là 6 key O5 thiếu ở vi/en (§3);
  key sets vi=2507 en=2507.
- WebKitGTK: **CHẠY ĐƯỢC sau install-deps** (§5) — click-test đủ 21 case,
  19/21 pass (cùng 2 fail §3); WebKit 27.2, probe OK sau khi cài deps.

## 1. Đã làm gì

1. **Harness click-test headed mới**
   `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs`
   (Xvfb :187 + Chromium headed + CDP Node thuần, mẫu N9 đợt 86; cổng riêng
   bridge 8851–8859 / vite 5550–5559 / debug 9650–9659; scratch ở
   `hidden_files/round87-o8/headed/`). 21 bước, 4 lần chạy (xem §4).
2. **Fixture tự tạo, đã verify độc lập bằng PIL** (không dùng clip mẫu):
   - `o8-white-720p-6s.mp4` — 1280×720, 6 s, nền trắng đều (đo tâm mask =
     centroid vùng sáng trên canvas).
   - `o8-ball-720p-6s.mp4` — trắng + ô đen 60×60, tâm ô = track(t)
     (x = 0.35+0.05t, y = 0.5); verify bằng PIL: t=1 → cx 0.400,
     t=5 → cx 0.600, cy 0.5.
   - `o8-track-35-65.json` — quỹ đạo 13 điểm, x 0.35 → 0.65, y = 0.5.
   - Mask đặt qua UI: ellipse, cx 35%, cy 50%, w 30%, h 30%, feather 0
     (khác tâm mặc định 0.5 để phân biệt hành vi MỚI với hành vi CŨ — xem §2).
   - Drawbox với biến `t`/`n` theo frame KHÔNG chạy ở ffmpeg này (`t` vẽ
     sai vị trí, `n` lỗi `Undefined constant`) — phải render từng frame
     bằng PIL rồi pipe sang ffmpeg.
3. **KHÔNG sửa code sản phẩm.** Không phát hiện bug sản phẩm nào ngoài §3
   (đã biết, có chủ là parent gộp fragment ở closing). Không thêm i18n key
   (dict giữ 2507/2507 — cố tình, xem §3). Không đụng TTS 39, không đụng
   file workflow.

## 2. Số đo thật — ngữ nghĩa mask bám track (lần 4, Chromium headed)

Ngữ nghĩa đích (brief O8 + O3 render + O4 preview): clip vừa có mask vừa
có track → **tâm mask = vị trí track, video đứng yên** (bỏ shift D3 để
tránh double-shift `2*track - 0.5`). Hành vi CŨ (D3, chưa sửa): tâm mask =
tâm tĩnh + (track − 0.5), video pan theo track.

Để phân biệt MỚI/CŨ, mask tĩnh đặt lệch tâm (x=0.35 thay vì 0.5):

| localT | track x (project) | Kỳ vọng MỚI (canvas*) | Kỳ vọng CŨ (canvas*) | Đo được (canvas) | Kết luận |
|---|---|---|---|---|---|
| 1.0 (tĩnh, không track) | — | (0.4158, 0.5000) | (0.4158, 0.5000) | (0.4158, 0.5000) | đúng mask tĩnh |
| 1.0 (mask+track) | 0.40 | (0.4439, 0.5000) | (0.3597, 0.5000) | (0.4436, 0.5000) | **MỚI, sai 0.0003** |
| 5.0 (mask+track) | 0.60 | (0.5561, 0.5000) | (0.4719, 0.5000) | (0.5560, 0.5001) | **MỚI, sai 0.0001** |
| 2.53 (đang phát) | 0.476 | (0.4865, 0.5000) | (0.4023, 0.5000) | (0.4848, 0.5002) | **MỚI, sai 0.0017** |

\* Canvas preview 871×275 (wrap-sized, không phải 1280×720); video
letterbox vào rect (191.1, 0, 488.9×275). Mọi kỳ vọng đổi qua
`canvasExpected()` = letterboxFit (xem §4). Ngưỡng PASS ±0.03 canvas.

Chẩn đoán bóng (clip B, cùng mask + track): bóng trùng tâm mask ở cả 2
thời điểm (lệch x 0.0019 / 0.0009; lệch y 0.0070 — ô đen 60×60, sai số
làm tròn pixel/YUV, trong ngưỡng 0.03). Hành vi CŨ sẽ cho bóng ở project
0.30 / 0.70 (t=5 ngoài mask, không thấy bóng) — không xảy ra. Video
đứng yên đã được chứng minh bằng bóng, không chỉ bằng mask.

Gắn track qua UI thật: file input của TrackPanel (CDP setFileInputFiles)
→ store `clip.track` 13 điểm, panel hiện "Đã gắn quỹ đạo: 13 điểm".
Bật mask / đặt hình học qua UI thật (nút "Bật mask" + slider range +
select ellipse). Chọn clip bằng chuột CDP thật (`[data-clip-id]`).
Auto-proxy tắt trước khi import (checkbox CDP, verify như N9).

## 3. FAIL duy nhất: gợi ý O5 hiện key thô — ĐÃ BIẾT, chờ parent gộp fragment

- MaskPanel render đúng khối gợi ý theo đúng state machine của O5
  (`maskTrackUiState`: follow/attach/none + nút gỡ): follow hiện khi đủ
  mask+track, attach khi chỉ có mask, none khi chưa mask; nút gỡ của
  MaskPanel bấm thật gỡ được track (b2a PASS).
- Nhưng cả 4 chuỗi đều hiện **key thô** (`mask.trackFollow`,
  `mask.trackDetach`, `mask.trackAttachHint`, `mask.trackAttachBtn`) thay
  vì chữ Việt, vì 6 key đó (cùng `motionTrack.transitionIgnored`,
  `motionTrack.maskNotFollowing`) chỉ có trong
  `apps/web/src/i18n/fragments/round87-o5.json` (7 key vi+en), **chưa
  merge vào `vi.json`/`en.json`** — pre-check harness: 0/7 key đã merge,
  dict vẫn 2507/2507.
- `r6-i18n-check.cjs` báo đúng 12 lỗi (6 key × vi/en), không lỗi nào khác.
- Đây là **quy trình chuẩn của đợt, không phải bug của O5**: O5 LIMITS §3
  và header test O5 ghi rõ "parent gộp fragment vào vi.json/en.json ở
  cuối đợt — mẫu M1 đợt 56: KHÔNG sửa dict trực tiếp để khỏi xung đột
  luồng song song". O8 KHÔNG tự merge (đúng luật tránh xung đột).
- **Việc còn lại cho parent ở closing:** gộp `fragments/round87-o5.json`
  vào `vi.json`/`en.json` (dict lên 2507+7=2514 mỗi bên) + bump số đếm
  trong các test khóa (`i18nOrphans60Q4`, `i18nSweep81I9`,
  `ProjectMenu.i18n55L1`); sau đó chạy lại harness này — b1/b4 phải
  chuyển PASS với chữ Việt "🎯 Mask đang bám theo motion track — …".
  Cho tới lúc đó, **đừng demo UI mask-track** (O5 LIMITS §3).

## 4. Hai bẫy đo đã gặp (ghi lại cho click-test sau)

1. **Lần 1 đo nhầm video mẫu (vô hiệu).** Nút "Thêm" đưa clip test vào
   track DƯỚI, clip mẫu ở track TRÊN phủ kín 0–8 s nên preview toàn là
   video mẫu (blob đo được là hình ellipse trắng của video mẫu, gần như
   đứng yên). Sửa: cô lập clip test — gỡ mọi clip khác qua
   `store.setState` (setup, mẫu N9 N4) trước mọi lần đo canvas. Harness
   nay làm việc này ở S2/S7 và log rõ.
2. **Lần 2 đo sai hệ tọa độ (S4 FAIL oan).** Canvas preview sized theo
   wrap (`wrap.clientWidth*dpr`, 871×275 ở cửa sổ 1440×900), video
   letterbox vào trong (preview.tsx:223 + `letterboxFit`); đo phân số
   canvas mà so với phân số project thì lệch hệ số — lần 2 tưởng "nén
   ngang 0,5625" (thực ra là đúng letterbox: hệ số = 488.9/871).
   Sửa: mọi kỳ vọng vị trí qua `canvasExpected()` (đổi project-fraction
   → canvas-fraction qua đúng `letterboxFit`). Lần 3/4 đo khớp tới
   0.0001–0.0017, tái hiện y hệt giữa 2 lần chạy.

## 5. WebKitGTK: CHẠY ĐƯỢC — click-test đủ 21 case, 19/21 pass

- Probe tối thiểu ban đầu (playwright-core, `webkit.launch`, headless: false):
  MiniBrowser thoát ngay: `error while loading shared libraries:
  libevent-2.1.so.7: cannot open shared object file` (exit 127).
  Nguyên nhân: sau reboot đầu đợt 87, dep apt của WebKit lại mất
  (cùng mẫu N9 đợt 86): `libwebkitgtk-6.0.so.4`, `libgtk-4.so.1`,
  `libjavascriptcoregtk-6.0.so.1`, `libgstreamer-1.0.so.0`,
  `libevent-2.1.so.7` đều không có trong `/usr/lib/x86_64-linux-gnu/`.
  (Bundle Playwright `minibrowser-gtk/{lib,sys/lib}` còn đủ nhưng thiếu
  `libevent`; `libevent-2.1.so.7` chỉ còn trong
  `/opt/hatch-image/bin/rtc-sidecar-lib/` — không dùng lib của app khác
  để vá.)
- Đã sửa theo đúng mẫu N2 đợt 86: `playwright-core/cli.js
  install-deps webkit` (apt lock đã hết — `apt-get update` chạy được,
  khác đợt N9). `apt-get update` kẹt ở mirror chậm ~10+ phút rồi mới
  sang phase install; **install-deps hoàn thành, exit 0** (log
  `/tmp/round87-o8/webkit-install-deps.log`, 120 dòng "Setting up",
  tới "Processing triggers for libc-bin"). Sau install:
  `libevent-2.1.so.7`, `libgtk-4.so.1`, `libgstreamer-1.0.so.0` OK;
  nhưng `libwebkitgtk-6.0.so.4` và `libjavascriptcoregtk-6.0.so.1`
  vẫn thiếu trong `/usr/lib/x86_64-linux-gnu/` — không sao, 2 lib này
  nằm trong bundle `minibrowser-gtk/lib/` nên probe vẫn chạy được.
- Probe lại sau install: **WEBKIT-PROBE-OK** — WebKit 27.2 launch được,
  page alive sau 5 s, env
  `GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`
  (bắt buộc, N2 đợt 86; Xvfb :188).
- Click-test đủ 21 case trên WebKit (harness Playwright
  `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs`, port từ bản
  Chromium — cùng fixture, cùng kỳ vọng đo, cùng verdict; vite dev
  :5560 + bridge :8861, viewport 1440×900): **19/21 pass, 2 fail**
  — **cùng đúng 2 fail §3** (b1/b4 key thô), mọi kịch bản còn lại
  PASS, số đo thậm chí còn sát kỳ vọng hơn Chromium:

| Kịch bản (WebKit) | Kết quả |
|---|---|
| S4 (c) mask tĩnh không track | **PASS** — blob (0.3546, 0.5004) ở cả t=1.0 và t=5.0; kỳ vọng canvas (0.3544, 0.5), sai 0.0002 |
| S5 (a) mask bám track (pause) | **PASS** — t=1.0: blob x=0.4031 (kỳ vọng 0.403, sai 0.0001); t=5.0: blob x=0.5973 (kỳ vọng 0.597, sai 0.0003); Δx=0.194 đúng kỳ vọng 0.194 |
| S5 (a2) lúc đang phát | **PASS** — playhead local 3.13, blob x=0.5017 (kỳ vọng 0.5058, sai 0.0041) |
| S7 bóng nằm giữa mask | **PASS** — t=1: bóng (0.4008, 0.4991) vs mask (0.4032, 0.5005); t=5: bóng (0.5979, 0.4990) vs mask (0.5972, 0.5004) |
| S6 (b1)/(b4) gợi ý O5 | **FAIL — cùng bug §3**: hiện key thô `mask.trackFollow` |
| S6 (b2a)/(b2b)/(b3), E0 | **PASS** — nút gỡ MaskPanel hoạt động; gợi ý chuyển attach (rawKey); ẩn khi chỉ có track; không lỗi JS/pageerror/crash |

- Lưu ý WebKit: canvas preview 872×476 (Chromium 871×275) — layout
  wrap khác nhau theo engine; mọi kỳ vọng đều qua `canvasExpected()`
  (letterbox) nên không ảnh hưởng verdict. Sample tự load trên WebKit
  là `mau-1.png`/`mau-2.png` (image) thay vì `mau-1.webm`/`mau-2.webm`
  (video) như Chromium — theo thiết kế của `apps/web/src/sample.ts`:
  sample ghi bằng canvas + MediaRecorder, webm trên Chromium, mp4 trên
  Safari, fallback PNG khi webm không hỗ trợ; KHÔNG phải bug, không
  ảnh hưởng kịch bản (clip test W/B đều là mp4). Toàn bộ lần WebKit
  chạy ~54 s, seek ổn định ngay (không gặp stall seek như N1/N2), và
  **không lỗi JS/pageerror/crash** — `GST_PLUGIN_SYSTEM_PATH` đã giữ
  WebProcess sống suốt lần chạy.
- Report: `hidden_files/round87-o8/webkit/o8w-clicktest-report.json`,
  screenshots `o8w-*.png`, log `o8w-vite.log`/`o8w-bridge.log`.

## 6. Giới hạn trung thực

1. **Chỉ test preview + UI, không test render.** Render geq động O3
   (`--mask-mode trackgeq`) chỉ được kiểm qua self-test của O3
   (`mask.js --self-test` pass, gồm assert geq động) + test O4 12/12;
   không chạy render FFmpeg thật end-to-end trong luồng này (O2/O7 đã
   bao phủ mức render — xem LIMITS của họ). Lưu ý O4: preview nay luôn
   theo ngữ nghĩa trackgeq, lệch với render mặc định (png) vốn vẫn shift
   unit (O4_LIMITS §2, chưa có file LIMITS O4 lúc O8 viết).
2. **Chưa test nhánh transition.** `maskTrackUiState` = "transition"
   (mask+track+transition) chỉ có trong test O5 (probe logic thuần);
   click-test không dựng clip có transition vì ngoài phạm vi brief O8.
3. **Nút "Gỡ quỹ đạo" của TrackPanel không bấm trong lần 4** — b2a dùng
   nút gỡ RIÊNG của MaskPanel (theo yêu cầu O5); nút TrackPanel đã được
   bấm ở lần 1–3 (b2 cũ) và hoạt động, nhưng lần 4 không lặp lại.
4. **Số đo theo tải VM + kích thước cửa sổ.** Canvas 871×275 (Chromium) /
  872×476 (WebKit) phụ thuộc
   cửa sổ 1440×900; kỳ vọng đã đổi qua letterbox nên đúng ở mọi cỡ cửa
   sổ, nhưng số tuyệt đối (pixel) chỉ đúng ở cửa sổ này. Encode/clip
   ngắn (6 s) nên không đo được hành vi clip dài.
5. **Dict i18n 2507 không đổi.** O8 không thêm key (O5 đã viết fragment;
   merge là việc của parent ở closing — §3). Không kiểm lại TTS 39.
6. **Local `~/workspace/repo-1` không có `.git`** nên HEAD 5f548ef8 ghi
   theo parent (không verify được bằng `git rev-parse` tại chỗ).
7. **Lần 1 vô hiệu** (đo nhầm video mẫu) — số lần 1 không dùng; report
   JSON lần 1 vẫn giữ trong scratch để đối chiếu.

## 7. File đổi (stage, KHÔNG push)

- `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` — harness mới
  (881 dòng; 4 lần chạy, lần cuối 19/21).
- `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` — harness
  WebKit (Playwright port của bản Chromium; 1 lần chạy, 19/21).
- `docs/PHASE9_ROUND87_O8_MASK_TRACK_CLICKTEST_LIMITS.md` — file này.

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round87-o8-mask-track-clicktest.txt`
(3 entry, verify read-back OK — xem log luồng).

## 8. Nợ còn lại

- Merge fragment O5 ở closing (parent): dict 2507→2514 + bump test khóa
  số key; sau đó chạy lại harness này để b1/b4 chuyển PASS.
- Click-test mask-track trên WebKitGTK — **ĐÃ ĐÓNG trong đợt này** (§5):
  install-deps xong, probe OK, click-test đủ 21 case 19/21 (cùng 2 fail
  §3). Nợ WebKit không còn.
- Nhánh transition (mask+track+transition) chưa qua click-test browser
  thật (mới có probe logic thuần của O5).
- Render FFmpeg thật end-to-end với `--mask-mode trackgeq` (O2/O7 đã
  làm mức render; chưa có click-test nào đối chiếu preview↔render trên
  cùng 1 clip).
- File LIMITS của O4 chưa có lúc O8 viết (chỉ có marker trong code +
  test 12/12); parent gộp sẽ có đủ.
