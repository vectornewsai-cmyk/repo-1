# PHASE9_ROUND109_K7_WEBKIT_GHOST_LIMITS — Port driver ghost sang Playwright WebKit + pixel-verified skipLatest: F6' MỞ MỘT PHẦN (bar số đạt, thiếu lượt xác nhận lúc yên)

> Luồng K7, đợt 109, lượt cron 06:35 +07 14/11/2026 (bắt đầu ~23:40Z 13/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — push qua API
> như các đợt trước).
> Nợ đợt 108 §4 mục 8 (J6 §5.3): F6' pixel-verified skipLatest cho WebKit.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào — preview.tsx
> ĐÓNG BĂNG cả đợt (md5 `ced42efd785724c8c0d1b16fc32c7341` trước/sau mọi lượt).
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính (4 ý):**
> 1. **Driver ghost đã port xong sang Playwright WebKit và CHẠY ĐƯỢC THẬT:**
>    WebKit 27.2 (webkit-2388) launch qua Xvfb, `page.evaluate(string)` chạy
>    nguyên vẹn logic trong trang của driver J6, video decode qua GStreamer
>    phát được, 20 pass case B hoàn thành, probe_exit=0, JSON 3.065.156 byte.
>    Đây là lần đầu tiên protocol ghost (flip / skipLatest) chạy được trên
>    WebKit — rào cản "không có driver ghost cho WebKit" (G1/H5/I1/J6) đã
>    được gỡ về mặt công cụ.
> 2. **Bar số F6' ĐẠT trên lượt WebKit đầu tiên: (1) nhãn 78/78 = 100,0%
>    tick skippedLatest=1 không chứa ghost == presented; (2) pixel-verified
>    78/78 = 100,0% không có vi phạm thật nào; n=78 ≥ 30.** Ghi rõ: lượt này
>    KHÔNG đạt gate yên của prereg nên chưa đủ để đóng F6' (xem ý 3).
> 3. **F6' MỞ MỘT PHẦN, chưa đóng:** lượt đo bắt đầu lúc tải cao (load
>    5,07/8,62 lúc poll hết hạn; 2,13/3,97 lúc bắt đầu đo; K3 đang chạy
>    probe chromium + vite + hogs) và tickCost trung vị 66ms vượt ngưỡng
>    hợp lệ prereg (≤20ms, hiệu chuẩn cho Chromium). Lượt xác nhận lúc máy
>    thật yên đã chờ 10 phút mà không có cửa (sóng tải của các luồng khác
>    liên tục) nên chưa chạy được. Cần đúng 1 lượt xác nhận lúc yên nữa thì
>    F6' mới đóng — script đã để sẵn (`run-k7-quiet.sh` + `poll-confirm-k7.sh`).
> 4. **Không hồi quy:** tsc 0, vite build PASS (6,79s), ghostBlend 15/15,
>    previewEngine 27/27 — trên cây đóng băng `ced42efd…`.

## 0. Môi trường đo + bar đăng ký trước

- Boot **#36 = 2026-11-13 22:53:56Z** trong suốt lượt đo (kiểm `uptime -s`
  lúc bắt đầu poll và lúc đo). **Reboot #37 = 2026-11-14 00:55:42Z xảy ra
  SAU khi mọi việc đo + phân tích đã xong** (confirm poll kết thúc 00:55:25Z,
  reboot 17s sau) — không mất dữ liệu: JSON + log + analyzer đã nằm trên đĩa
  trước reboot. RAM khả dụng: ~645 MB lúc bắt đầu → 2159 MB đầu lượt đo →
  2144 MB cuối lượt. Birefnet KHÔNG chạy (RAM dưới ngưỡng guard).
- **Code lúc đo:** `preview.tsx` md5 `ced42efd785724c8c0d1b16fc32c7341`
  (kiểm trước/sau lượt đo và sau hồi quy: không đổi). Không luồng đợt 109
  nào khác sửa file này trong phiên K7. `round-in-progress.md` KHÔNG tồn tại.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0 tại
  `/home/hatch/scratch-round63-r4/node_modules/playwright-core`. Launch
  headed qua Xvfb, display :193 (lượt đo; smoke dùng :194).
- **GStreamer (ghi rõ giá trị đã dùng):**
  `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` VÀ
  `GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` — cả hai
  cùng giá trị, truyền qua `env` của `webkit.launch` (I3 đợt 107 dùng biến
  thứ nhất; probe93u3 dùng biến thứ hai; K7 export cả hai để khỏi phụ thuộc
  vào biến nào được WebKitGTK ưu tiên).
- **Bar đăng ký trước** (ghi trong `round109-k7/prereg-k7.md` TRƯỚC khi đo,
  có 1 lần sửa định nghĩa (2) TRƯỚC khi có dữ liệu WebKit — xem §5.2):
  case B, 20 pass, `--disable-rvfc` (đường tick — trạng thái tự nhiên trên
  WebKit vì rVFC không tồn tại), flip sau pass 5 (đặt lại cờ
  `__vcutDisableRvfc` làm mốc wallMs cho analyzer — no-op trên WebKit),
  tap ON + relabel ON (mặc định, như C3 — để so sánh chỉ khác engine).
  F6' ĐÓNG khi trên tick hậu flip+2000ms, viaRvfc=0: (1) ≥90% tick
  skippedLatest=1 không chứa ghostPix với `frame == presented` VÀ (2)
  ≥90% tick skippedLatest=1 không có VI PHẠM THẬT (ghost label==presented
  mà strip pixel khớp đúng frame presented), với n ≥ 30 tick.
- **Gate yên đăng ký trước:** load1 < 2 VÀ load5 < 2 VÀ không còn process
  probe/vite/browser nào của luồng đợt 109 khác. Poll mỗi 60s, tối đa
  20 phút; hết 20 phút thì chạy 1 lượt duy nhất nhãn "nhiễm tải" và lượt
  đó KHÔNG được dùng làm bằng chứng đóng F6' nếu không đạt gate yên —
  để nợ chạy lại lúc yên. **Chính điều này đã xảy ra** (§2).

## 1. Những gì K7 đã làm

| Bước | Nội dung | Kết quả |
|---|---|---|
| 1 | Đọc LIMITS J6 + dữ liệu round108-j6 (driver, analyzer, JSON C3b-quiet) + LIMITS I3/J5 (GST) | Bối cảnh §0 |
| 2 | Viết prereg (bar F6', gate yên, quy tắc nhiễm tải) TRƯỚC khi đo | `round109-k7/prereg-k7.md` |
| 3 | Port driver ghost sang Playwright WebKit (chỉ thay vận chuyển, giữ nguyên logic trong trang) | §3 — chạy được thật |
| 4 | Smoke test: launch + `page.evaluate(string)` + decode video | §3.1 — launch/evaluate OK; video fail giả do đói CPU lúc tải 27 (xem §3.1) |
| 5 | Viết analyzer skipLatest mới + hiệu chuẩn trên JSON Chromium J6 | §5 — tái tạo đúng số J6, phát hiện bar (2) cũ đo sai thứ cần đo → sửa lần 1 |
| 6 | Poll chờ cửa yên 20 phút (K5 tạo tải, sóng hog của luồng khác) | §2 — không có cửa yên |
| 7 | Vite crash ENOSPC 2 lần → sửa config tạm (watch ignore tất cả, 0 inotify FD) | §2.1 — vite sống ổn sau sửa |
| 8 | Chạy lượt đo WebKit (nhiễm tải theo prereg) | §4 — probe_exit=0, 20 pass |
| 9 | Phân tích flip + skipLatest trên JSON WebKit | §4–§5 — (1)/(2) 100%/100%, n=78 |
| 10 | Poll xác nhận lúc yên thêm 10 phút | §6 — không có cửa, dừng (không chạy nhiễm tải nữa) |
| 11 | Hồi quy trên cây đã đo + viết LIMITS + stage batch | §7 — tất cả xanh |

## 2. Phối hợp tải — không có cửa yên trong 20 phút + 10 phút

- **Lúc bắt đầu K7 (23:40–23:44Z):** load1 1,24 → 1,70 rồi vọt 15,41 —
  K5 đang chạy thí nghiệm tạo tải (30 spin, phương pháp A, settle tối đa
  360s; đạt dial load5 ≥ 8 sau 70s, kết thúc 23:45:37Z). Cửa yên chưa mở.
- **Poll 1–20 (00:07–00:27Z):** load1 dao động 0,79 ↔ 39,91; load5 không
  bao giờ < 2 (thấp nhất 9,56). Nguyên nhân: các luồng khác thức dậy theo
  đợt — K5 chạy E1 dưới tải nặng, K2 chạy probe webkit blob (K2-progress:
  "31 hog của luồng khác thức dậy theo đợt, load1 dao động 0,6 ↔ 39"),
  K4 chạy probe chromium, K3 chạy probe chromium + hog
  `node -e while(true){Math.sqrt(...)}`. Cửa yên thật (load1<2 VÀ load5<2
  VÀ không còn process probe/browser nào) KHÔNG xuất hiện lần nào trong
  20 phút.
- **Hết 20 phút poll (00:27:11Z):** chạy 1 lượt duy nhất nhãn "nhiễm tải"
  theo prereg. Lúc bắt đầu đo (00:28:11Z) load 5,07/8,62 — nhưng lượt này
  fail ngay ở vite (ENOSPC, §2.1).
- **Lượt đo thật bắt đầu 00:38:27Z** (sau 2 lần sửa vite): load 2,13/3,97;
  K3 lúc đó đang chạy probe chromium + vite + 3 hog. Trong lúc đo load1
  hạ dần 2,13 → 1,07 (00:40:03Z) → 0,83 (00:40:20Z, cuối lượt); load5
  3,97 → 2,98. Tức là phần lớn thời gian đo máy ở mức load1 ~1–2 (tương
  đối yên), nhưng **gate yên đăng ký trước tính tại lúc BẮT ĐẦU lượt**
  (load1 2,13 > 2, load5 3,97 > 2, K3 đang chạy) nên lượt này KHÔNG đạt
  gate — nhãn "nhiễm tải" giữ nguyên, không tự nới gate sau khi thấy số.
- **Poll xác nhận 10 phút (00:45–00:55Z):** poll 2–4 load đã yên
  (0,70/1,71; 0,47/1,45; 0,21/1,19 — load1<2 VÀ load5<2 ✓) nhưng gate
  process KHÔNG mở (vite + MiniBrowser webkit-2388 của luồng khác vẫn đang
  chạy probe); từ poll 5 trở đi sóng hog quay lại (load1 3,22 → 9,88 →
  9,15 → 6,51 → 4,44 → 3,35). Hết 10 phút, dừng theo đúng kế hoạch
  (không chạy nhiễm tải lần nữa — đã có 1 lượt nhiễm tải rồi).

### 2.1 ENOSPC — vite crash 2 lần, cách sửa (ghi rõ để đợt sau dùng lại)

- **Lần 1 (00:28:11Z, exit=3):** vite :5184 "ready in 267 ms" rồi crash
  `ENOSPC: System limit for number of file watchers reached` khi watch
  `apps/web/scripts/probe-round34-q3-decode-ahead-pipe.mjs`
  (max_user_watches=63756; các vite khác đang giữ watcher). Curl check
  30s không lần nào thành công → run-k7.sh exit 3.
- **Lần 2 (00:33Z):** sau khi thêm `server.watch.ignored` cho
  `scripts/**`, vite crash ENOSPC ở `src/lib/reverseCompat44Z6.test.ts` —
  thư mục `src/` tự nó đã đủ nhiều file để tràn khi các vite khác đang giữ
  phần lớn hạn mức. Driver đã launch WebKit xong rồi mới fail ở
  `page.goto: Could not connect to localhost: Connection refused`.
- **Cách sửa (đã kiểm chứng):** config tạm `vite.config.k7-temp.ts` đặt
  `server.watch.ignored: ["**/**"]` — vite gần như không dùng inotify
  watch nào (đo trực tiếp: **0 inotify FD**), vẫn phục vụ trang bình
  thường (HMR đã tắt nên không cần watch). Vite test sống ổn >25s, lượt
  đo thật sau đó chạy trọn 20 pass không crash. **Không sửa
  max_user_watches ở cấp hệ thống** (J6 §8.4 đã nêu là ngoài phạm vi luồng
  đo — K7 cũng không đổi; chỉ ghi nợ, xem §8).
- **Bài học phụ:** `pkill -f "vite.*k7-temp"` trong lúc dọn vite test đã
  tự kill chính shell exec của K7 (pattern xuất hiện trong chính command
  line của shell) — lần sau dùng pattern có backslash (`vite\.config…`)
  hoặc kill theo PID. Không mất dữ liệu (chỉ là shell chờ bị kill).

## 3. Port driver ghost sang Playwright WebKit

- **File:** `hidden_files/round109-k7/probe104f3-ghost-k7.webkit.mjs`
  (865 dòng, port từ `probe104f3-ghost-j6.cdp.mjs` 886 dòng).
- **Giữ nguyên 100% logic trong trang:** MEASURE_FN_SRC (đo pixel canvas
  preview thật), STORE_FN (đọc store), vòng pass (pause baseline → 20 pass
  play ghi mọi khung rAF → flip sau pass 5 → dump pump/blend-tick log),
  phân tích offline (trail/edge, gStd spread theo frame + theo cửa sổ đã
  vẽ + theo presented, analysis theo mốc t), định dạng JSON — để số so
  được trực tiếp với J6/C3b-quiet. Chỉ thay lớp vận chuyển:
  spawn chromium-1254 + WebSocket CDP thô → `webkit.launch` + Xvfb +
  `page.evaluate`.
- **Điểm kỹ thuật đã kiểm chứng:**
  - `page.evaluate(chuỗi)` của Playwright đánh giá chuỗi như biểu thức JS
    trong ngữ cảnh trang (như Runtime.evaluate) — mọi biểu thức IIFE của
    driver J6 chạy nguyên vẹn (smoke: IIFE trả đúng 42, object, `1+1`=2).
  - `page.setDefaultTimeout(120000)` cho các evaluate dài (mỗi pass là 1
    evaluate chứa hàng chục–trăm rAF + getImageData).
  - Xvfb: chọn display trống :193–:197 (dọn socket mồ côi nếu process đã
    chết); **chờ socket tới 10s bằng poll 500ms** thay vì 900ms cố định —
    smoke lần 1 fail giả vì Xvfb lên chậm hơn 900ms đúng lúc K5 spin 30
    luồng (máy tải 27).
  - Launch env ghi vào JSON (`engine: "webkit"`, `webkitVersion: "27.2"`,
    `gstPluginPath`, `gstPluginSystemPath`, `pageErrs: []`).
- **Khác biệt engine (ghi rõ, không giấu):** rVFC không tồn tại trên
  WebKitGTK → pump chạy đường tick ngay từ đầu; `--disable-rvfc` là trạng
  thái tự nhiên, flip sau pass 5 chỉ là mốc wallMs. Tap/relabel được kỳ
  vọng vô dụng (không có rVFC để nuôi presented) — đo với tap ON +
  relabel ON (mặc định, như C3) và kiểm chứng bằng `anchorSrc` (§4.1:
  284/284 tick hậu flip+2000ms có anchorSrc=frameIdx, 0 tick tap — tap
  vô dụng trên WebKit đã được chứng minh bằng dữ liệu, đúng như H5 §7 dự
  đoán).

### 3.1 Smoke test (trước lượt đo)

- WebKit 27.2 launch OK; `page.evaluate(string)` OK; User-Agent WebKit
  27.2/Safari.
- **Video KHÔNG phát trong smoke lần 2** (playOk=false, currentTime=0,
  readyState=0, paused=false, không có error event, 10s không tiến) —
  lúc đó máy tải 27,22 (K5 E1 + K2 + các luồng khác). Đây là **đói CPU
  của WebProcess**, không phải lỗi GST: cùng lúc K2 cũng ghi "WebProcess
  đói CPU; typefind tìm caps mất 2,59s, pipeline kẹt không dữ liệu", và
  lượt đo thật sau đó (load1 ~1) phát video bình thường. Không kết luận
  GST hỏng từ smoke nhiễm tải này; ghi rõ để đợt sau khỏi chẩn đoán sai.

## 4. Lượt đo WebKit (nhiễm tải) — số đo

Lượt duy nhất: 00:38:27–00:40:20Z (113s), case B, 20 pass,
`--disable-rvfc`, flip sau pass 5 (wallMs=33590), tap ON + relabel ON,
vite :5184, Xvfb :193, probe_exit=0. JSON:
`round109-k7/preview-b-f3-flip-land-webkit.json` (3.065.156 byte).

| Chỉ số | WebKit (K7, nhiễm tải) | Chromium C3b-quiet (J6, yên) | Nhận xét |
|---|---|---|---|
| BlendTick / pass | 406 / 20 pass | 1892 / 20 pass | WebKit tick thưa: tBlend gap trung vị 112ms, p90 208ms (~9 tick/s) |
| Khung rAF / pass | 20–35 (3 pass 72–132) | 30–131 (đa số 100+) | Mỗi rAF+measure ~70ms trên WebKit (canvas lớn hơn + decode GStreamer chậm) |
| Canvas preview | 872×476, scale 0,661 | 872×276, scale 0,383 | Kích thước canvas khác engine (layout) — gStd vẫn so được (cùng vùng tương đối) |
| **Clean distinct hậu flip+2000ms** | **44/102 = 43,1%** | **74/94 = 78,7%** | Thấp hơn 35,6pt — nhãn ghost trên WebKit nhiễu hơn nhiều (xem §4.1) |
| Clean mọi occurrence | 316/461 = 68,5% | 2926/2997 = 97,6% | |
| Gap presented−expected \|≤3\| | 284/284 = 100% (tất cả đúng 0) | 100% | Presented trên WebKit KHÔNG lệch bao giờ (offset 0 tuyệt đối; Chromium có 550 tick offset +1) |
| Phủ anchor | anchorSrc frameIdx 284/284 (100%), tap 0 | tap 1476/1506 (98,0%) | Tap vô dụng trên WebKit — đúng dự đoán H5 §7 |
| tickCost total trung vị / p90 | **66,0 / 104,0 ms** (max 194) | 11,4 / 15,0 ms | Vượt ngưỡng hợp lệ prereg (≤20ms) — xem §5.3 |
| gStd spread (cửa sổ đã vẽ) med / max | 47,4 / 76,2 (44 nhóm) | 0,7 / 47,8 (126 nhóm) | Cửa sổ blend WebKit không ổn định (xem §4.2) |
| gStdMed tại t=0,5 / 1 / 1,5 | 84,0 / 84,2 / 38,4 (pause ~114) | 37,6 / 37,5 / 37,5 (pause ~112) | Blend WebKit lúc 0,5–1s gần như không blur (84 ≈ giữa pause 114 và tmix 37,5) |
| trailMax / edgeL/R med | 0 / 1,2 / 2,2 px | 0 / 1,2 / 2,1 px | Mask + mép đúng như Chromium |
| cx lệch median / max | 0,001 / 0,0008 | 0,001 / 0,0008 | Tâm mask đúng track như Chromium |
| ring sau phát / ringClears | 3 / 52 | 3 / 40 | Ring đủ 3 snapshot như Chromium |
| pageErrs | [] (0 lỗi trang) | — | Không có pageerror/console.error nào |

### 4.1 Clean distinct thấp (43,1%) — vì sao, và vì sao không lật skipLatest

- Phân loại distinct hậu flip+2000ms (n=137): clean 44, mislabeled 58,
  ambiguous 35. Mọi anchor đều là frameIdx (không có tap để cứu nhãn).
  Trên Chromium, tap nuôi presented tươi (98,0%) nên nhãn ghost chính xác;
  trên WebKit nhãn chỉ còn frameIdx từ currentTime lúc tick — mà tick
  WebKit thưa (112ms) và chậm nên nhãn lệch nhiều frame (xem §5.1 mục (3):
  72 ghost "đáng ngờ" ở tick skippedLatest=0, lệch nhãn tới 5–18 frame).
- **Điều này KHÔNG lật kết luận skipLatest:** clean-distinct đo ĐỘ ĐÚNG
  NHÃN của ghost (snapshot nào, frame nào) — còn skipLatest chỉ hỏi
  snapshot mới nhất (= presented) có bị loại khỏi pool không. Một ghost
  nhãn lệch (vd nhãn 46 nhưng pixel là frame 64) vẫn là ghost CŨ (không
  phải presented tại tick đó thì vẫn khác presented) — trừ khi pixel của
  nó đúng là presented, và đó chính là kiểm tra (2) pixel-verified (§5).
  Hai metric đo hai thứ khác nhau; không được dùng clean-distinct 43,1%
  để bác skipLatest 100% — cũng như không được dùng skipLatest 100% để
  nói nhãn ghost WebKit là tốt (nó đang rất nhiễu, 43,1%).

### 4.2 Cửa sổ blend WebKit không ổn định (spread median 47,4)

- gStd spread theo cửa sổ đã vẽ: median 47,4 (Chromium 0,7), max 76,2 —
  cùng một cửa sổ blend đã vẽ cho gStd khác nhau tới ~76 qua các pass.
  gStdMed tại t=0,5 là 84 (giữa pause 114 và tmix đúng 37,5) — tức nhiều
  tick blend ra ảnh gần như không blur. Cơ chế có thể: snapshot ring trên
  WebKit được capture thưa (tick 112ms) nên pool ghost thường chứa frame
  cũ/xa nhau, blend không còn là tmix 3 frame liên tiếp nữa; cộng thêm
  ringClears 52 lần (clear rồi refill liên tục). Đây là chẩn đoán, chưa
  chứng minh nhân quả — cần đo riêng, không thuộc phạm vi F6'.
- Hệ quả cho F6': spread lớn không ảnh hưởng kiểm tra (1)/(2) (hai kiểm
  tra đó chỉ dùng nhãn + strip của từng ghost, không dùng gStd), nhưng nó
  giải thích vì sao clean-distinct thấp và vì sao WebKit cần hiệu chuẩn
  ngưỡng riêng (tickCost, spread) thay vì bê ngưỡng Chromium sang.

## 5. F6' — phân tích skipLatest (analyzer mới `analyze-k7-skiplatest.py`)

Tính trên blend tick hậu flip+2000ms, viaRvfc=0 (284 tick). Ground-truth
`round97-y2/frames-stripes`, `match_set` span=3/thresh=2 (như flip
analyzer).

| | skippedLatest=1 (CHÍNH) | skippedLatest=0 (đối chứng) | Chromium C3b-quiet skp=1 (tham chiếu) |
|---|---|---|---|
| n tick | 78 (≥30 ✓) | 206 | 679 |
| (1) Nhãn: tick KHÔNG chứa ghost==presented | **78/78 = 100,0%** | 206/206 = 100,0% | 678/679 = 99,9% |
| (2) Pixel-verified: tick KHÔNG có vi phạm thật | **78/78 = 100,0%** | 206/206 = 100,0% | 679/679 = 100,0% |
| (2) Ứng viên ghost label==presented | 0 strip | 0 strip | 1 strip (không khớp presented) |
| (3) Ghost strip khớp presented, label khác: alias / đáng ngờ | 59 / 7 | 45 / 72 | 97 / 7 |
| (4) Label-clean distinct | 9/17 = 52,9% | 44/102 = 43,1% | 71/82 = 86,6% |
| (4b) Label-clean mọi-occurrence | 133/141 = 94,3% | 183/320 = 57,2% | 1337/1356 = 98,6% |

- **Bar (1) và (2) đều đạt 100,0% ≥ 90%, n=78 ≥ 30.** Không có tick
  nào trong 78 tick skippedLatest=1 chứa ghost mang nhãn presented, và
  không có ứng viên nào để kiểm pixel (0 ghost label==presented) nên vi
  phạm thật = 0 một cách hiển nhiên — ghi rõ: (2) đạt 100% ở đây là vì
  (1) đã loại hết ứng viên, không phải vì đã kiểm pixel của nhiều ứng
  viên. Đây là điểm yếu của lượt này (n ứng viên = 0): kiểm tra pixel
  chỉ có ý nghĩa đầy đủ khi có ứng viên để kiểm. Trên Chromium cũng vậy
  (1 ứng viên, 0 khớp). Ghi rõ để đợt xác nhận sau chú ý: nếu lượt yên
  cũng cho 0 ứng viên thì (2) vẫn là hệ quả của (1), không phải bằng
  chứng pixel độc lập mạnh.
- **(3) đáng ngờ — cần đọc kỹ:** skp=1 có 7 ghost (trong 156) có strip
  khớp presented nhưng nhãn khác, gồm 1 ca lẻ (seq 210: label 25,
  presented 33, lệch 8) và 1 cụm 6 tick liên tiếp (seq 301–306: label 46,
  presented 64, lệch 18, cùng một ghost tồn tại qua 6 tick). skp=0 có
  tới 72 ca (lệch 5–18 frame). Giải thích phù hợp nhất: **nhãn snapshot
  trên đường tick WebKit bị trễ (capture lag)** — snapshot được gán nhãn
  theo currentTime lúc bắt đầu capture nhưng pixel thực tế là frame mới
  hơn nhiều (tick thưa 112ms + decode GStreamer chậm). Các ca này KHÔNG
  tính là vi phạm skipLatest vì (a) nhãn của chúng ≠ presented (quyết
  định skip dựa trên nhãn), (b) 59/66 ca skp=1 giải thích được bằng alias
  (strip gt[label]==strip gt[presented]: frame trùng nhau trong footage
  gốc — 10 cặp full-frame identical — hoặc alias chu kỳ sọc 48px).
  7 ca còn lại là chẩn đoán, không vào bar; đợt sau nên điều tra capture
  lag trên WebKit (đo độ trễ nhãn–pixel trực tiếp) thay vì suy diễn thêm.
- **(4) cho thấy tick skippedLatest=1 "sạch" hơn tick skippedLatest=0
  một cách có hệ thống** (distinct 52,9% vs 43,1%; mọi-occurrence 94,3%
  vs 57,2%): khi pump bắt kịp (lastCaptured == presented, tức điều kiện
  để skipLatest=1) thì nhãn cũng chính xác hơn — phù hợp với giả thuyết
  "pump bắt kịp → nhãn tươi". Đây là quan sát, không phải kết luận nhân
  quả.

### 5.1 Sửa bar lần 1 — ghi lại minh bạch

- (2) gốc trong prereg ("≥90% ghostPix strip clean theo nhãn") đo ĐÚNG
  SAI NHÃN của mọi ghost, không đo claim skipLatest. Kiểm chứng trên
  JSON Chromium C3b-quiet TRƯỚC khi có dữ liệu WebKit: (2) cũ cho skp=1
  chỉ 86,6% distinct (71/82) trong khi (1) là 99,9% (678/679) và
  all-occurrences 98,6% — cơ chế skipLatest hoạt động rõ ràng nhưng bar
  cũ vẫn fail vì nhiễu nhãn. Bar cũ đo sai thứ cần đo nên phải sửa
  TRƯỚC khi đo WebKit (ghi trong prereg-k7.md mục "Sửa lần 1" + docstring
  analyzer). (2) mới chỉ hỏi: ghost nào DANH NGHĨA là presented thì pixel
  của nó có ĐÚNG LÀ presented không. (2) cũ chuyển thành chẩn đoán (4),
  không vào bar.
- (3) cũng tinh chỉnh theo cùng kiểm chứng: alias định nghĩa trực tiếp
  bằng strip gt[label]==strip gt[presented] (bao gồm frame trùng nhau
  trong footage gốc + alias chu kỳ sọc 4 frame), thay cho proxy (P−L)%4.
  Footage gốc có 10 cặp frame liên tiếp pixel-identical (đo trực tiếp từ
  ground-truth): (14,15), (26,27), (32,33), (38,39), (50,51), (56,57),
  (62,63), (74,75), (80,81), (86,87).

### 5.2 Vì sao kết luận là "MỞ MỘT PHẦN" chứ không phải "ĐÓNG"

- Bar số đạt (100%/100%, n=78) nhưng **prereg quy định rõ**: lượt chạy
  sau 20 phút poll không có cửa yên thì nhãn "nhiễm tải" và "KHÔNG được
  dùng làm bằng chứng đóng F6' nếu không đạt gate yên". Lượt này không
  đạt gate yên (lúc bắt đầu load 2,13/3,97; K3 đang chạy probe + vite +
  hogs; tickCost trung vị 66ms vượt ngưỡng hợp lệ ≤20ms hiệu chuẩn cho
  Chromium; sampling thưa 406 tick so với 1892 của Chromium).
- Lượt xác nhận lúc yên đã chờ thêm 10 phút mà không có cửa (§2), nên
  chưa có dữ liệu yên để đóng. **F6' MỞ MỘT PHẦN:** cơ chế skipLatest đã
  được chứng minh hoạt động trên WebKit với số đo mạnh (100%/100%), nhưng
  việc đóng chính thức còn chờ đúng 1 lượt xác nhận lúc máy thật yên
  (load1<2, load5<2, không còn probe/browser nào khác). Script đã để sẵn
  trong `round109-k7/` (`run-k7-quiet.sh`, `poll-confirm-k7.sh`) — đợt
  sau chỉ việc chạy lại, không cần viết lại driver/analyzer.
- Lưu ý trung thực: tải có xu hướng làm nhãn tệ đi (nhiều vi phạm hơn),
  không làm số đẹp lên — nên 100%/100% dưới tải là bằng chứng thiên về
  hướng mạnh, không phải hướng yếu. Nhưng quy tắc prereg vẫn đứng: không
  tự nới gate sau khi thấy số. Đợt xác nhận sẽ là phán quyết cuối.

## 6. Lượt xác nhận — đã chờ, chưa chạy được

- Poll xác nhận 10 phút (00:45–00:55Z): poll 2–4 load đã yên
  (0,70/1,71; 0,47/1,45; 0,21/1,19) nhưng gate process không mở (vite +
  MiniBrowser webkit-2388 của luồng khác vẫn chạy probe); từ poll 5 sóng
  hog quay lại (load1 3,22 → 9,88 → 9,15 → 6,51 → 4,44 → 3,35). Hết
  10 phút, dừng theo kế hoạch (không chạy nhiễm tải lần nữa).
- Reboot #37 (00:55:42Z) xảy ra 17s sau khi poll xác nhận kết thúc —
  không ảnh hưởng dữ liệu (đã lưu đĩa), nhưng mọi process nền đều chết;
  đợt sau chạy xác nhận phải kiểm tra lại boot/load từ đầu.

## 7. Kiểm chứng hồi quy (cây đóng băng, md5 `ced42efd…`)

- `tsc` apps/web (`npx --prefix apps/web tsc --noEmit -p apps/web/tsconfig.json`): **exit 0**.
- `vite build` (từ `apps/web`, config gốc): **PASS 6,79s** (cảnh báo chunk >500kB có từ trước).
- `ghostBlend.probe.test.ts` (`node --experimental-strip-types`): **15/15 PASS**.
- `previewEngine.test.ts`: **27 test passed**.
- Không sửa file production nào; config tạm `vite.config.k7-temp.ts` đã XOÁ
  sau khi đo xong (như J6). Không đụng drift Y4 / watchdog Y5 / clip-change
  Y7 / re-arm Z3 / TTS 39 / birefnet / `.github/workflows`.

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND109_K7_WEBKIT_GHOST_LIMITS.md` — file này. **File duy
  nhất trong repo mà K7 thay đổi** (K7 là luồng đo, cây đóng băng — không
  sửa code; config tạm đã xoá, không stage).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round109-k7-webkit-ghost.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k7/`
  (prereg-k7.md, probe104f3-ghost-k7.webkit.mjs, smoke-k7.mjs,
  smoke-k7.log, analyze-k7-flip.py, analyze-k7-skiplatest.py,
  analyze-k7-flip-webkit.txt, analyze-k7-skiplatest-webkit.txt,
  analyze-k7-test-on-j6.txt, poll-k7.sh, poll-confirm-k7.sh,
  run-k7.sh, run-k7-quiet.sh, chain-k7.log, vite-5184-k7.log,
  run-webkit.log, preview-b-f3-flip-land-webkit.json 3.065.156 byte).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền lệ
  H5/I1/J6: chỉ LIMITS + file repo; dữ liệu đo ở lại hidden_files, đủ để
  kiểm chứng lại).
- Cờ xong: `hidden_files/round109-k7-done` (tạo SAU KHI LIMITS + batch xong).

## 9. Nợ mở + đề xuất cho đợt sau

1. **F6' — MỞ MỘT PHẦN (nợ duy nhất để đóng):** chạy 1 lượt xác nhận bằng
   `run-k7-quiet.sh` khi cửa yên thật mở (load1<2, load5<2, không còn
   probe/vite/browser nào khác). Nếu lượt yên cũng đạt (1) ≥90% và (2)
   ≥90% với n ≥ 30 thì F6' ĐÓNG. Nếu lượt yên cho số khác hẳn (vd (1)
   tụt <90%) thì phải điều tra lại — không gộp chung hai lượt. Script +
   analyzer đã sẵn, không cần viết lại.
2. **ENOSPC inotify watchers 63756 — nghẽn hạ tầng, tái diễn 2 lần trong
   lượt này** (vite K7 crash 2 lần; J6/I5/J1/J7 đã gặp). Workaround của K7
   (`server.watch.ignored: ["**/**"]`, vite dùng 0 inotify FD) đã kiểm
   chứng và nên áp dụng cho mọi vite tạm của các luồng đo sau. Nợ hệ
   thống: cân nhắc tăng `fs.inotify.max_user_watches` (K7 KHÔNG tự đổi —
   cần quyết ở cấp hệ thống).
3. **Ngưỡng hợp lệ cho WebKit cần hiệu chuẩn riêng:** tickCost trung vị
   WebKit 66ms (p90 104ms) vs Chromium 11,4ms; tBlend gap trung vị 112ms
   vs ~33ms; sampling ~30 khung/pass vs ~100. Bê ngưỡng Chromium sang
   WebKit sẽ fail oan — đợt sau nên đặt ngưỡng WebKit từ chính dữ liệu
   này (vd tickCost median ≤100ms) thay vì ≤20ms.
4. **Nhãn ghost WebKit nhiễu (clean distinct 43,1% vs Chromium 78,7%):**
   mọi anchor là frameIdx, tap vô dụng (đã chứng minh bằng dữ liệu);
   capture lag trên đường tick (strip khớp frame mới hơn nhãn tới 18
   frame, cụm seq 301–306). Đợt sau nên đo độ trễ nhãn–pixel trực tiếp
   trên WebKit thay vì suy diễn từ (3).
5. **Cửa sổ blend WebKit không ổn định** (spread median 47,4; gStdMed
   84 tại t=0,5–1s): blend thường không ra tmix đúng trên WebKit — cần
   đo riêng, không thuộc F6' (F6' chỉ hỏi skipLatest, không hỏi chất
   lượng blend).
6. **Phối hợp nhiều luồng đo cùng 1 cell:** cửa yên thật rất hiếm (K7
   chờ 20+10 phút không có); sóng hog của các luồng khác (K3/K5) làm
   load1 dao động 0,2 ↔ 39. Đợt sau nên xếp lịch nối tiếp cho các lượt đo
   yên (như J6 §2 đã đề xuất) thay vì để các luồng cùng poll chờ yên.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 108 §4:** G1 chờ user quyết
   metric (G5/M2); mù #22 chờ user quyết; Re-arm A/B tắt E4; 2 MiB
   (queue2); Zombie gate (b); B-band c0; cụm A E6; Harness G4 flake;
   EPERM probe + mù; birefnet 0 lần; TTS 39 CẤM kiểm lại;
   ci-security.yml 403; release gate không đổi.
