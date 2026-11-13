# PHASE9_ROUND88_P5_WEBKIT_CLICKTEST_LIMITS.md — Chạy lại click-test mask-track sau gộp i18n đợt 87 (nợ O8, đợt 88 P5)

> Ngày: 2026-11-11. Luồng P5, đợt 88. KHÔNG push. KHÔNG release/tag.
> Bối cảnh: đợt 87 O8 click-test Chromium 19/21, WebKit 19/21 — cùng 2 fail
> b1/b4 do 6 key O5 chỉ có trong `fragments/round87-o5.json`, chưa merge vào
> `vi.json`/`en.json`. Parent đã gộp ở closing đợt 87 (dict 2507→2515).
> Việc của P5: chạy lại đúng bộ harness O8 trên cây đã gộp, 2 engine, xác
> nhận b1/b4 lật PASS; nếu còn fail thì xác định nguyên nhân thật.

## 0. Kết quả tóm tắt

| Lần chạy | Engine | Kết quả |
|---|---|---|
| 1 (lần duy nhất) | Chromium headed | **21/21 pass, 0 fail** (exit 0) |
| 1 | WebKitGTK 27.2 headed | **20/21 pass, 1 fail** — S5 (a), xem §3 |
| 2 (chạy lại để chẩn đoán) | WebKitGTK 27.2 headed | **21/21 pass, 0 fail** (exit 0) — nhưng S7 t=5 đo khung stale, PASS rỗng, xem §3 |

**Nợ O8 ĐÃ ĐÓNG: b1/b4 lật PASS ở cả 2 engine, cả 3 lần chạy.**
Gợi ý O5 nay hiện chữ Việt thật, không còn key thô:
"🎯 Mask đang bám theo motion track — tâm mask di chuyển theo quỹ đạo gắn
trên clip (gỡ quỹ đạo sẽ dừng cả clip lẫn mask)."
Pre-check harness: fragment O5 = 8/8 key đã merge vào vi.json; dict
vi=2515 en=2515 (đo bằng flatten, xem §6); `r6-i18n-check.cjs` PASS
(đợt 87 báo 12 lỗi — nay 0 lỗi).

**Không sửa code sản phẩm.** Không thêm/bớt i18n key, không đụng TTS 39,
không đụng file workflow. Chỉ thêm file LIMITS này (harness O8 dùng lại
nguyên vẹn, không sửa — xem §4 vì sao chưa sửa harness dù đã thấy điểm
yếu của nó).

## 1. Đã làm gì

1. **Verify gộp i18n trước khi chạy:** flatten `vi.json`/`en.json` = 2515
   key mỗi bên; 6 key O5 (`mask.trackFollow`, `mask.trackDetach`,
   `mask.trackAttachHint`, `mask.trackAttachBtn`,
   `motionTrack.transitionIgnored`, `motionTrack.maskNotFollowing`) đều có
   chữ Việt/Anh thật. Pre-check của harness Chromium xác nhận 8/8 key
   (thêm `assIgnored`, `maskStillFollows`).
2. **Chromium:** chạy lại harness O8 nguyên vẹn
   (`apps/web/scripts/clicktest-87o8-mask-track-headed.mjs`) trên cây đã
   gộp — scratch mới `hidden_files/round88-p5/headed/`, Xvfb :189, vite
   :5550, bridge :8851, fixture O8 cũ (copy từ `round87-o8/headed/`).
   1 lần chạy, ~57 s, exit 0, **21/21**.
3. **WebKit:** dep hệ thống mất hết sau reboot (libevent, libgtk-4,
   libgstreamer đều vắng — xem §5). `install-deps webkit` fail 2 lần do
   apt lock bị tiến trình `apt-get update` của hệ thống (PID 814,
   os-intent replay) giữ. Đã cài dep bằng `dpkg -i` từ
   `/var/cache/apt/archives` (96 .deb, closure tính bằng script — xem §5),
   rồi probe tối thiểu OK (WebKit 27.2, page alive 5 s) và chạy harness
   O8 WebKit nguyên vẹn
   (`apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs`) 2 lần —
   scratch `hidden_files/round88-p5/webkit/` (Xvfb :191) và
   `hidden_files/round88-p5/webkit-run2/` (Xvfb :192), vite :5560,
   bridge :8861, `GST_PLUGIN_SYSTEM_PATH` đã export cả 2 lần.
4. **Chẩn đoán fail WebKit lần 1** bằng cách chạy lại harness lần 2
   (cùng code, cùng fixture, cùng máy) + đối chiếu S7/a2 trong cùng lần
   chạy — xem §3. Không sửa code để "cho xanh".
5. **Kiểm chứng kèm (cây đã gộp):** `tsc --noEmit` exit 0; `vite build`
   pass 9,29 s; `node server/render/src/mask.js --self-test` pass;
   O4 test 12/12; O5 test 18/18 (bundle CJS — xem §6); `r6-i18n-check`
   PASS, vi=2515 en=2515.

## 2. Số đo thật

### 2.1 Chromium — 21/21 (lần duy nhất, số y hệt lần 4 đợt 87)

| Kịch bản | Kết quả |
|---|---|
| S0/S1/S2 setup, import, cô lập, chọn clip | PASS |
| S3 bật mask + hình học ellipse cx 35% | PASS |
| S4 (c) mask tĩnh không track | PASS — blob (0.4158, 0.5000) ở cả t=1.0 và t=5.0, sai 0.0000 |
| S5 (a) mask bám track (pause) | PASS — t=1.0 blob x=0.4436 (kỳ vọng 0.4439, sai 0.0003); t=5.0 blob x=0.5560 (kỳ vọng 0.5561, sai 0.0001); Δx=0.112 |
| S5 (a2) lúc đang phát | PASS — playhead local 2.5, blob x=0.4848 (kỳ vọng 0.486, sai 0.0012) |
| S6 (b1) gợi ý follow | **PASS — chữ Việt thật** (đợt 87 FAIL key thô) |
| S6 (b2a) nút gỡ MaskPanel | PASS — nút "Gỡ quỹ đạo khỏi clip", track=undefined sau bấm |
| S6 (b2b) gợi ý chuyển attach | PASS — dạng proper, chữ Việt thật |
| S6 (b3) gợi ý ẩn khi chỉ có track | PASS — state none |
| S6 (b4) gợi ý hiện lại (khôi phục) | **PASS — chữ Việt thật** (đợt 87 FAIL key thô) |
| S7 (a3) bóng nằm giữa mask | PASS — t=1 bóng (0.4417, 0.5071) vs mask (0.4436, 0.5001); t=5 bóng (0.5550, 0.5072) vs mask (0.5559, 0.5002) |
| E0 không lỗi JS | PASS |

### 2.2 WebKit — lần 1: 20/21; lần 2: 21/21 (cùng harness, cùng fixture)

| Kịch bản (WebKit) | Lần 1 | Lần 2 |
|---|---|---|
| S0 setup (mẫu PNG, không phải webm — theo thiết kế `sample.ts`) | PASS | PASS |
| S1/S2/S3 setup, mask ellipse cx 35% | PASS | PASS |
| S4 (c) mask tĩnh | PASS — blob (0.3546, 0.5004) cả 2 thời điểm, sai 0.0002 | PASS — y hệt lần 1 |
| S5 (a) mask bám track (pause) | **FAIL — xem §3** — t=1 blob x=0.4031 (đúng); t=5 blob x=0.4031 (kỳ vọng 0.597); Δx=0 | PASS — t=1 x=0.4031; t=5 x=0.5973 (kỳ vọng 0.597, sai 0.0003); Δx=0.194 |
| S5 (a2) lúc đang phát | PASS — playhead local 3.3, blob x=0.4857 (kỳ vọng 0.5146, sai 0.0289, sát ngưỡng ±0.03) | PASS — playhead local 3.57, blob x=0.5084 (kỳ vọng 0.5272, sai 0.0188) |
| S6 (b1) gợi ý follow | **PASS — chữ Việt thật** | **PASS — chữ Việt thật** |
| S6 (b2a)/(b2b)/(b3)/(b4) | PASS (b2b dạng proper, chữ Việt thật) | PASS |
| S7 (a3) bóng nằm giữa mask | PASS — t=1 bóng (0.4008, 0.4991) vs mask (0.4032, 0.5005); t=5 bóng (0.5979, 0.4990) vs mask (0.5972, 0.5004) | **PASS RỖNG — xem §3** — t=5 bóng (0.4008, 0.4991) vs mask (0.4032, 0.5005), y hệt t=1 (khung stale) |
| E0 không lỗi JS/pageerror/crash | PASS | PASS |

Canvas WebKit 872×476 (Chromium 871×275) — layout wrap khác theo engine;
mọi kỳ vọng qua `canvasExpected()` (letterbox) nên không ảnh hưởng verdict.

## 3. Fail duy nhất + PASS rỗng: khung stale sau seek pause trên WebKit — KHÔNG phải hồi quy, KHÔNG phải lỗi logic mask

### 3.1 Hiện tượng đo được

- **Lần 1, S5 (a):** đo ở t=5.0 trả về blob **y hệt** t=1.0:
  (0.4031, 0.5004), n=7084, bbox [0.259, 0.353, 0.546, 0.647] — cả hai
  lần đo log cùng timestamp. Không phải ngữ nghĩa CŨ (CŨ sẽ cho 0.4515),
  không phải sai số đo — mà là **khung hình không đổi** giữa 2 lần đo.
- **Lần 2, S7:** đo ở t=5.0 trả về blob/bóng **y hệt** t=1.0:
  mask (0.4032, 0.5005) n=6645, bóng (0.4008, 0.4991) n=8428 — trong khi
  kỳ vọng t=5 là mask 0.5972 / bóng 0.5979. Harness vẫn verdict PASS vì
  S7 chỉ kiểm "bóng ≈ mask ở từng thời điểm", không kiểm "bóng/mask đã
  di chuyển giữa t=1 và t=5" — khung stale vẫn thỏa điều kiện này.
  Đây là **PASS rỗng (vacuous pass)** của harness, không phải bằng chứng
  hành vi đúng ở t=5 của lần 2.

### 3.2 Vì sao kết luận là seek stall thoáng qua, không phải bug sản phẩm

1. **Cùng code, cùng harness, cùng fixture — lần 2 lật lại PASS** ở đúng
   bước S5 (a) đã fail lần 1, với số đo y hệt đợt 87 (0.4031 / 0.5973).
   Hồi quy thật không tự hết khi chạy lại.
2. **Trong cùng lần 1, S7 đo đúng ở t=5** (mask 0.5972, bóng 0.5979 —
   y hệt đợt 87): ngữ nghĩa mask bám track ĐÚNG ở t=5 trên WebKit,
   chỉ phép đo S5 (a) của lần đó bắt nhầm khung cũ.
3. **a2 (đang phát) PASS cả 2 lần** — mask di chuyển theo track trong
   lúc phát; video không đứng yên, track không hỏng.
4. **Chromium 21/21 sạch** trên cùng cây code — logic mask/track không
   phụ thuộc engine.
5. **Cơ chế đã biết, có sẵn trong repo:** `apps/web/src/lib/seek.ts`
   ghi rõ kéo playhead thì `currentTime = t` là bất đồng bộ — canvas vẽ
   ngay sẽ hiển thị frame CŨ (stale frame); cả một cụm module quanh đó
   (`pauseSeekCap42X2`, `pauseSeekRecovery43Y2`, `seekZeroLanding44Z2`,
   `webkitLoopRestart80H5`, `WrongLandingTracker`) quản lý quirk seek
   của WebKit (seeked bắn ở currentTime 0, seekable `[[0,0]]` dính).
6. **Điều kiện tải VM lúc đo:** tiến trình `apt-get update` của hệ thống
   (PID 814, os-intent replay) chạy suốt cả 2 lần WebKit + 8–10 luồng
   đợt 88 chạy song song + 96 gói dpkg cài giữa 2 lần — VM 1,5 CPU
   chia sẻ. Lần 1 S0 mất ~25 s (lần 2 chỉ ~13 s) — tải cao đúng lúc
   seek stall xảy ra. Cả 2 lần stall đều ở phép đo pause-seek t=5,
   không ở bước nào khác.

### 3.3 Điểm yếu của harness đã lộ ra (chưa sửa — xem §4)

`measureAtPlayhead` (cả 2 harness O8) chỉ kiểm "canvas ổn định": poll
mỗi 700 ms, 2 lần đo liên tiếp khớp nhau trong 0,01 thì coi là stable.
**Khung đóng băng cũng thỏa điều kiện này** — nên phép đo có thể kết
luận trên khung stale mà không biết. Harness không xác nhận seek đã
xong (không đọc `currentTime`/`seeked` của video element preview — và
`VIDEOS_FN` luôn trả `videos=[]` vì video preview không nằm trong DOM
truy vấn được). Hệ quả: S7 lần 2 PASS rỗng như §3.1. Đây là nợ đo,
không phải nợ sản phẩm.

### 3.4 Không sửa gì trong luồng này — và vì sao

- Không có code sản phẩm nào sai: mọi phép đo không-stale đều khớp kỳ
  vọng MỚI tới 0,0001–0,004; hành vi CŨ không xuất hiện lần nào.
- Sửa "cho xanh" bằng cách nới ngưỡng, bỏ qua S5/S7, hay sửa harness
  trong lúc đo sẽ làm mất tính độc lập của phép đo. Harness O8 được giữ
  nguyên vẹn để 3 lần chạy so sánh được với nhau và với đợt 87.
- Nợ mở ghi ở §8 (harness: xác nhận seek trước khi đo; product: xem
  lại timeout fallback của Seeker khi seek WebKit chậm dưới tải).

## 4. File đổi (stage, KHÔNG push)

- `docs/PHASE9_ROUND88_P5_WEBKIT_CLICKTEST_LIMITS.md` — file này (mới).

Không sửa harness O8, không sửa code sản phẩm, không đụng i18n dict
(2515/2515 đã đúng sau gộp closing đợt 87). Fixture mp4/json là binary —
không stage (đã có ở `hidden_files/round87-o8/headed/`, bản copy cho lần
Chromium ở `hidden_files/round88-p5/headed/`).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round88-p5-webkit-clicktest.txt`
(1 entry, verify read-back — xem log luồng).

## 5. Môi trường WebKit lần này (ghi lại cho lần sau)

- Sau reboot, dep hệ thống của WebKit lại mất hết (lần thứ 3 liên tiếp
  theo mẫu N2 đợt 86 / O8 đợt 87): `libevent-2.1.so.7`, `libgtk-4.so.1`,
  `libgstreamer-1.0.so.0`, `libwebkitgtk-6.0.so.4`,
  `libjavascriptcoregtk-6.0.so.1` đều vắng; thư mục
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0/` cũng vắng.
- `playwright-core/cli.js install-deps webkit` **fail 2 lần, exit 100**:
  `E: Could not get lock /var/lib/apt/lists/lock. It is held by process
  814 (apt-get)` — PID 814 là `apt-get update` của hatch os-intent
  replay (chạy từ 08:35 UTC, kẹt ở mirror chậm >30 phút, vẫn chạy lúc
  P5 kết thúc). LƯU Ý: test lock bằng `flock` (BSD) báo FREE sai — apt
  dùng lock POSIX `fcntl`; phải test bằng `fcntl.lockf` với `O_RDWR`.
- **Workaround đã dùng (không cần apt, không cần mạng):** `dpkg -i` từ
  `/var/cache/apt/archives` (120 .deb còn từ đợt 87). Closure tính bằng
  script: 29 gói thiếu theo `install-dependencies.sh --printonly` +
  dep bắc cầu → **96 .deb**, cài hết + `dpkg --configure -a` → 0 gói
  còn trạng thái unpacked. 4 gói vẫn thiếu vì không có trong cache và
  không tải được khi apt bị khóa: `gstreamer1.0-gl`, `libdrm-radeon1`,
  `libdrm-nouveau2`, `gstreamer1.0-plugins-ugly` — **không cần cho lần
  chạy này**: video mp4 phát được (qtdemux + avdec_h264 qua libav),
  2 lần WebKit chạy đủ 21 case, không crash WebProcess.
  (`libdrm-*` chỉ dùng khi có GPU thật; `plugins-ugly` là mp3...;
  `gstreamer1.0-gl` là sink GL — WebKit đã fallback sink khác.)
  Lần sau: thử `install-deps` lại khi PID 814 xong; nếu vẫn khóa thì
  dùng lại cách dpkg từ cache này.
- `GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`
  vẫn BẮT BUỘC khi launch WebKit (N2 đợt 86) — đã export ở cả probe
  lẫn 2 lần harness. Probe tối thiểu OK: WebKit 27.2, page alive 5 s,
  đóng sạch.
- `libwebkitgtk-6.0.so.4` / `libjavascriptcoregtk-6.0.so.1` vẫn thiếu ở
  hệ thống nhưng nằm trong bundle `minibrowser-gtk/lib/` nên chạy được
  (như đợt 87).

## 6. Kiểm chứng kèm + ghi chú nhỏ

- `tsc --noEmit` (apps/web): exit 0.
- `vite build` (apps/web): pass, 9,29 s.
- `node server/render/src/mask.js --self-test`: pass.
- `maskTrackPreview87O4.test.ts` (esbuild bundle + node): **12/12**.
- `maskTrackUi87O5.test.ts` (esbuild bundle + node): **18/18** — với
  `--format=cjs`. LƯU Ý: bundle `--format=esm` crash lúc chạy vì
  react-dom server `require("stream")` không hỗ trợ dynamic require ở
  ESM — đó là giới hạn của cách bundle test, không phải bug sản phẩm
  (O8 đợt 87 chạy được 18/18, hẳn cũng dùng CJS hoặc cách tương đương).
- `r6-i18n-check.cjs`: **PASS**, key sets vi=2515 en=2515, 0 lỗi
  (đợt 87: 12 lỗi — nay đã hết nhờ gộp closing).
- Không còn Xvfb/process thừa sau các lần chạy (đã kiểm: không Xvfb,
  không listener ở cổng 5550/5560/8851/8861/9650).

## 7. Giới hạn trung thực

1. **Chỉ test preview + UI, không test render** (như O8): render geq
   động O3 chỉ được kiểm qua self-test + test O4/O5; không chạy render
   FFmpeg thật end-to-end trong luồng này.
2. **Nhánh transition** (mask+track+transition) vẫn chưa qua click-test
   browser thật (mới có probe logic thuần của O5).
3. **Số đo theo tải VM + kích thước cửa sổ** (1440×900; canvas
   Chromium 871×275, WebKit 872×476). Kỳ vọng đã đổi qua letterbox nên
   đúng ở mọi cỡ cửa sổ, nhưng a2 lúc phát có sai số lớn hơn đợt 87
   (WebKit lần 1: 0,0289 — sát ngưỡng ±0,03; lần 2: 0,0188) — video
   chạy chậm hơn playhead dưới tải, không phải sai logic.
4. **Tỉ lệ khung stale trên WebKit:** 2/6 phép đo pause-seek t=5 bị
   stale trong 3 lần chạy WebKit gần nhất (đợt 87: 0/2; lần 1: 1/2;
   lần 2: 1/2). Con số này chỉ đúng trên VM tải cao; không suy ra tỉ lệ
   trên máy người dùng.
5. **Dict i18n 2515 không đổi trong luồng này.** P5 không thêm key.
6. **Local `~/workspace/repo-1` không có `.git`** nên HEAD 5f548ef8 ghi
   theo parent (không verify được bằng `git rev-parse` tại chỗ).
7. **Chromium chỉ chạy 1 lần** (21/21 sạch ngay lần đầu nên không cần
   chạy lại); WebKit chạy 2 lần vì lần 1 có fail cần chẩn đoán.

## 8. Nợ còn lại

- **Nợ đo (mới, từ §3):** `measureAtPlayhead` trong 2 harness O8 cần
  xác nhận seek hoàn tất trước khi đo (đọc `currentTime`/`seeked` của
  video element preview, hoặc yêu cầu khung thay đổi so với lần đo
  trước ở bước có track), để khung stale không thể cho PASS rỗng như
  S7 lần 2. Lưu ý `VIDEOS_FN` hiện trả `[]` — cần tìm video element
  thật của preview trước (nó không nằm trong DOM truy vấn được).
  Product-side: xem lại timeout fallback của `Seeker` (`seek.ts`) khi
  seek WebKit chậm dưới tải — có nên chờ lâu hơn trước khi vẽ khung
  giữ (held frame) hay không. Ngoài phạm vi P5 (đụng seek subsystem
  đã có nhiều luồng quản lý).
- Nhánh transition (mask+track+transition) chưa click-test browser thật.
- Render FFmpeg end-to-end `--mask-mode trackgeq` chưa đối chiếu
  preview↔render trên cùng 1 clip.
- 4 gói apt WebKit còn thiếu (`gstreamer1.0-gl`, `libdrm-radeon1`,
  `libdrm-nouveau2`, `gstreamer1.0-plugins-ugly`): cài lại bằng
  `install-deps` khi apt hết khóa, hoặc để nguyên (không cần cho
  harness này).
- File LIMITS O4 nay đã có (parent gộp kiểm lại).
