# Phase 9 đợt 89 — Q5: Xác nhận seek trước khi đo + timeout `Seeker` dưới tải

**Nợ gốc:** LIMITS gộp đợt 88 §4 mục 11 — "Harness O8 cần xác nhận seek hoàn tất trước khi đo (khung stale cho PASS rỗng như S7 lần 2 của P5); xem lại timeout fallback của `Seeker` khi seek WebKit chậm dưới tải."
**Ngày:** 2026-11-11. **Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** ĐÃ ĐÓNG — harness xác nhận seek (4 tín hiệu) + `Seeker` gia hạn timeout; click-test Chromium 21/21, WebKit 20/21 → 21/21 sau khi sửa thêm (a2) (xem §5).

## 1. Vấn đề gốc (đợt 88 P5)

- WebKit lần 1: 20/21 — S5 fail do khung stale sau seek pause dưới tải.
- WebKit lần 2: 21/21 nhưng S7 t=5 đo khung stale mà vẫn PASS rỗng: `measureAtPlayhead` chỉ kiểm canvas ổn định; `VIDEOS_FN` luôn trả `[]` (video preview không nằm trong DOM truy vấn được — `__vcutMediaEls` trước đây chỉ refresh ở nhánh playing).
- Tỉ lệ khung stale WebKit: 2/6 phép đo pause-seek t=5 trong 3 lần chạy gần nhất.

## 2. Số đo seek thật (probe `apps/web/scripts/probe89q5-seek-latency.mjs`)

Clip `o8-ball-720p-6s.mp4` (GOP 250, ô đen di chuyển theo thời gian nguồn; đã verify bằng ffmpeg+PIL). 6 trial/lượt, xen kẽ t=1/t=5. `tElement` = element `currentTime` tới đích + `seeking=false`; `tCanvas` = canvas khớp vị trí bóng kỳ vọng + ổn định 2 lần đo liên tiếp. Đối chứng immediate-stale (đo ngay sau setPlayhead bằng baseline): đúng 24/24 lượt (đều stale như kỳ vọng).

| Engine | Tải nền | tElement median | tElement max | tCanvas median | tCanvas max | confirmed | immStale |
|---|---|---|---|---|---|---|---|
| Chromium | không | 1535 ms | 2445 ms | 1800 ms | 2500 ms | 6/6 | 6/6 |
| Chromium | 3× `yes` (loadavg 5,44; RAM khả dụng 1125 MB) | 4024 ms | 7335 ms | 5173 ms | 9401 ms | 6/6 | 6/6 |
| WebKit | không | 3288 ms | 6418 ms | 3490 ms | 6627 ms | 6/6 | 6/6 |
| WebKit | 3× `yes` (loadavg 16,16; RAM khả dụng 745 MB) | 8310 ms | 9723 ms | 8613 ms | 15974 ms | 6/6 | 6/6 |

Chi tiết từng trial trong `~/workspace/goals/capcut-clone-video-editor/hidden_files/round89-q5/probe-{chromium,webkit,chromium-load,webkit-load}/probe-results.json`. Baseline (trước khi bật tải): Chromium t=1 tElement 2216 ms; WebKit t=1 tElement 3931 ms.

**Hai phát hiện:**

1. **Timeout 1200 ms không đủ ngay cả khi không tải.** Seek chậm dần theo khoảng cách từ keyframe (clip GOP dài): Chromium t=1: 690–867 ms, t=5: 1535–2445 ms; WebKit t=1: 1596–3900 ms, t=5: 3288–6418 ms. Với timeout cũ, một seek WebKit dưới tải tốn tới **8 lần timeout + retry** (9723/1200) — sát cap `PAUSE_SEEK_FAILURE_CAP = 10` (`pauseSeekCap42X2.ts:66`): 10 lần timeout/error liên tiếp thì preview ngủ ở trạng thái lỗi → canvas kẹt stale (cơ chế khả thi cho khung stale của P5 lần 1; dưới tải nặng hơn đợt đo này, seek có thể vượt 12 s = 10 attempt → cạn cap thật).
2. **`seeked` ≠ đã vẽ.** Dưới tải, canvas chậm hơn element tới ~7 s (WebKit tải, trial 3: tElement 9028 ms → tCanvas 15974 ms). Vì vậy harness phải xác nhận cả canvas, không chỉ element — và preview cũng có độ trễ vẽ riêng sau khi seek xong (xem §6).

## 3. Sửa `Seeker` — gia hạn timeout khi element vẫn đang seeking

**`apps/web/src/lib/seek.ts`:**

- `SeekOpts.timeoutExtensions?: number` (mặc định 0 = hành vi cũ, mọi test cũ không đổi). Khi timer cháy mà `el.seeking === true` (trình duyệt đang tích cực giải mã), re-arm timer thêm một `timeoutMs` nữa, tối đa N lần; listener `seeked` giữ nguyên qua các lần gia hạn (không gỡ/gắn lại). Khi `seeking === false` (metadata lỗi / seek kẹt) thì timeout ngay như cũ.
- `SEEK_TIMEOUT_EXTENSIONS = 5` → ngân sách **7,2 s/attempt** cho preview. Căn cứ: phủ hết seek không tải cả 2 engine trong ĐÚNG 1 attempt (max 6,4 s); seek WebKit dưới tải max 9,7 s → tối đa 2 attempt (1 timeout)/seek, còn xa cap 10. Đánh đổi: seek kẹt thật (seeked không tới) phát hiện chậm hơn — 7,2 s/attempt thay vì 1,2 s (trường hợp hiếm: file hỏng/metadata lỗi).
- `DEFAULT_SEEK_TIMEOUT_MS = 1200` giữ nguyên (không đổi timeout cơ sở — gia hạn có chọn lọc tốt hơn tăng phẳng cho mọi trường hợp).

**`apps/web/src/preview.tsx`:**

- Call-site `seekAll` (dòng ~4331) truyền `timeoutExtensions: SEEK_TIMEOUT_EXTENSIONS`.
- Hook đo ở nhánh pause (dòng ~4178, mirror khối nhánh playing): công bố `__vcutMediaEls` + `__vcutMediaState` mỗi tick pause — trước đây chỉ refresh khi playing nên lúc pause-seek harness không đọc được element thật. Chỉ phục vụ đo, không đổi hành vi. Đã chứng minh hoạt động: `__vcutMediaEls` lúc đầu nay có VIDEO element (`t=0, paused=true, seeking=false`, Chromium `readyState=4`, WebKit `readyState=3`) thay vì `[]`.

**Test khóa hành vi — `apps/web/src/lib/seek.test.ts` (20/20 PASS, chạy bằng `node --experimental-strip-types`):**

- 4 test Q5 mới: extensions=0 → timeout đúng hẹn dù đang seeking; seeked tới muộn trong lần gia hạn → `{seeked:true}`; hết lượt gia hạn mà vẫn seeking → timedOut sau đủ 2× timeoutMs; timer cháy mà không còn seeking → timeout ngay, không gia hạn.
- 1 test pin hằng số `SEEK_TIMEOUT_EXTENSIONS = 5` (đổi số phải có ý thức + cập nhật comment ở `seek.ts`).
- 15 test cũ vẫn xanh (hồi quy: timeout 30 ms không extension, O3 gỡ listener, retry sau timeout).
- `tsc --noEmit` ở `apps/web`: exit 0.

## 4. Sửa harness O8 — xác nhận seek trước khi đo

Áp dụng cho cả `clicktest-87o8-mask-track-headed.mjs` (Chromium) và `clicktest-87o8-mask-track-webkit.mjs` (WebKit):

- `measureAtPlayhead` mới với **4 tín hiệu độc lập** (deadline 30 s): (E) element `currentTime ≈ target (±1 frame)` VÀ `seeking === false` (chọn element có `currentTime` GẦN target nhất — không lấy element đầu tiên, không match theo src blob); (P) store playhead == target; (C) canvas ĐÃ ĐỔI so với baseline chụp TRƯỚC setPlayhead (chỉ khi `expectChange`); (S) 2 lần đo liên tiếp khớp < 0,01. `confirmed = (E||P) && S && (C nếu expectChange)`; hết 30 s chưa confirmed → `stale=true`, caller PHẢI FAIL với lý do STALE (không dùng số đo làm PASS). Thêm `ELS_FN` đọc `__vcutMediaEls` live.
- S4 truyền `{clipSrc}` (expectChange=false, mask tĩnh); S5/S7 truyền `{clipSrc, expectChange:true}` + gate STALE trước verdict.
- S7 thêm kiểm tra di chuyển: mask Δx ≥ 0,10 VÀ bóng Δx ≥ 0,10 (kỳ vọng ~0,19 ở canvas gần như không letterbox; ~0,11 ở canvas letterbox — xem §6); nếu đo được bóng mới mà không di chuyển → FAIL "PASS RỖNG — khung stale".
- S5 (a2) đo lúc PHÁT cũng phải xác nhận khung đã đổi (phát hiện thêm khi chạy lại, xem §5): sau setPlayhead(0.5)+play, preview phải seek về 0.5 rồi mới vẽ khung mới; chờ canvas đổi khỏi khung t=5 (poll 500 ms, tối đa 15 s), hết hạn → FAIL STALE thay vì đo bằng sleep cố định 2000/2500 ms.
- `MEASURE_PLAYHEAD_FN` — đo blob + playhead TRONG CÙNG 1 evaluate ở (a2): đọc riêng 2 evaluate, mỗi cái ~1 s dưới tải, làm playhead chạy tiếp trong lúc chờ → blob "lag" giả ~0,7 s (WebKit lần 2 lệch 0,034, chỉ hơn ngưỡng 0,03); đọc nguyên tử khử artifact này (lần 3 lệch 0,0006).

**Hạ tầng harness/probe (cần thiết để đo được dưới sóng EPERM — xem §7):**

- Probe đo seek viết lại `confirmedSeek` thành sampler trong trang (1 evaluate, setInterval 50 ms đọc element + playhead + canvas — bản cũ poll 3 evaluate/vòng, mỗi cái ~1 s dưới tải, làm trial kéo đủ 30 s deadline dù canvas xong sau ~3 s).
- `--configLoader native` khi spawn vite (cả probe + 2 harness): vite import trực tiếp config, KHÔNG bundle qua `loadConfigFromBundledFile` (ghi file `timestamp-*.mjs` cạnh config — chết EPERM khi sóng bật; đã chứng minh native-loader không tạo file tạm nào).
- Fetch kiểm tra vite lên có timeout 3 s (`AbortSignal.timeout(3000)`): vite kẹt (sống nhưng không serve) từng treo vòng poll vô hạn vì `fetch()` không timeout.
- Chờ sóng EPERM tắt bằng ghi thử rẻ (mỗi 10 s, tối đa 10 phút) trước khi khởi động vite; **chỉ test WRITE** — unlink là dọn dẹp best-effort (xem §7).
- Probe spawn Xvfb NGAY trước launch (không spawn sớm): Xvfb spawn sớm chết trong lúc chờ vite (~4 phút) → "Failed to open display" lúc launch (lần chạy 12:50).

## 5. Kết quả click-test O8 (cây đã sửa)

| Lần chạy | Kết quả | Ghi chú |
|---|---|---|
| Chromium 13:05–13:08 (load ~22 lúc đầu) | **21/21 PASS** | S4/S5/S7 đều `confirmed=true`; S7 mask Δx=0,112, bóng Δx=0,113 |
| Chromium lần 2 (sau sửa (a2) đọc nguyên tử, xem dưới) | **21/21 PASS** | (a2): playhead local=0,77, blob x=0,4372 vs kỳ vọng 0,4371 (lệch 0,0001; trước 0,028) |
| WebKit lần 1, 13:11–13:13 | **20/21** — S5 (a2) FAIL | Playhead local=3,7 nhưng blob vẫn ở vị trí t=5: canvas kẹt ở khung t=5 trong lúc phát sau seek (xem dưới). S4/S5(a)/S7 đều `confirmed=true`; S7 mask Δx=0,194, bóng Δx=0,197 (kỳ vọng ~0,19) |
| WebKit lần 2, 13:16–13:18 | **20/21** — S5 (a2) FAIL kiểu khác | Playhead local=2, blob=0,4177 vs kỳ vọng 0,4515 (lệch 0,034, chỉ hơn ngưỡng 0,03): blob và playhead đọc ở 2 evaluate riêng, mỗi cái ~1 s dưới tải, playhead chạy tiếp trong lúc chờ → artifact đo, không phải hành vi sản phẩm (xem dưới) |
| WebKit lần 3, 13:26–13:28 (sau reboot VM + sửa (a2) đọc nguyên tử) | **21/21 PASS** | (a2): playhead local=1,07, blob x=0,4065 vs kỳ vọng 0,4059 (lệch 0,0006); S7 mask Δx=0,194, bóng Δx=0,197 |

**Phân tích S5 (a2) FAIL lần 1 (không phải hồi quy từ sửa Q5):** sau setPlayhead(0.5)+play, preview phải seek element về 0.5 (WebKit dưới tải ~8 s) rồi mới vẽ khung mới; trong lúc đó store playhead vẫn chạy theo đồng hồ wall-clock còn canvas giữ khung t=5 (khung pause-seek trước đó) vì vòng lặp phát bỏ vẽ khi đang seeking (N3, đợt 86). Sleep cố định 2500 ms đo phải khung cũ. Với timeout cũ 1200 ms, kết quả ở 2,5 s cũng y hệt (seek vẫn đang bay) — lỗi có từ trước, chỉ lộ ra khi seek chậm dưới tải. Harness nay chờ canvas đổi (tối đa 15 s) rồi mới đo.

**Phân tích S5 (a2) FAIL lần 2 (artifact đo, đã sửa):** lần 2 canvas ĐÃ đổi (không còn STALE) nhưng blob lệch kỳ vọng 0,034 — chỉ hơn ngưỡng 0,03. Nguyên nhân: blob và playhead đọc ở 2 `evaluate` riêng; mỗi cái ~1 s dưới tải, playhead chạy tiếp trong lúc chờ → blob "lag" ~0,7 s so với kỳ vọng. Bằng chứng: lần 1 Chromium (a2) cũng lag 0,028 (vừa trong ngưỡng) với cùng cơ chế. Sửa: `MEASURE_PLAYHEAD_FN` — đọc blob + playhead TRONG CÙNG 1 evaluate (cả 2 harness). Lần 3 WebKit: lệch chỉ còn 0,0006. **Nợ sản phẩm còn lại:** playhead và canvas có thể lệch nhau nhiều giây trong lúc phát sau seek dưới tải — chưa sửa trong Q5 (xem §6).

Chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round87-o8/headed/o8-clicktest-report.json` (Chromium) và `.../webkit/o8w-clicktest-report.json` (WebKit).

## 6. Giới hạn còn lại (trung thực)

1. **Playhead chạy trước canvas lúc phát sau seek (nợ sản phẩm, chưa sửa):** store playhead tăng theo wall-clock trong khi element đang seek và canvas chưa vẽ khung mới — lệch tới nhiều giây trên WebKit dưới tải. Sửa thật cần thay đổi vòng lặp phát (vd: không tăng playhead khi đang seeking, hoặc vẽ khung giữ chỗ) — ngoài phạm vi Q5 (harness + `Seeker`), để đợt sau.
2. **`seeked` ≠ đã vẽ:** canvas chậm hơn element tới ~7 s dưới tải (WebKit trial 3: 9028 → 15974 ms). Harness đã xác nhận canvas; nhưng preview thật vẫn có độ trễ vẽ riêng sau seek — người dùng scrub nhanh dưới tải sẽ thấy khung đến muộn.
3. **Gia hạn làm phát hiện seek kẹt chậm hơn:** tối đa 7,2 s/attempt (cũ 1,2 s). Chỉ ảnh hưởng file hỏng/metadata lỗi; seek chậm bình thường nay xong trong 1 attempt.
4. **Nhãn kỳ vọng S7 lẫn hệ tọa độ (mỹ phẩm, không sai verdict):** log S7 ghi "(kỳ vọng ~0,19)" theo project-coords; trên canvas letterbox (Chromium: videoRect 191,0,489×275 trong canvas 871×275) Δx đo được là ~0,11 — đúng theo canvas-coords, gate Δx ≥ 0,10 (canvas) vẫn đúng. Trên WebKit (videoRect 12,9,0,846×476, gần như không letterbox) Δx ~0,19 khớp nhãn. Nên sửa nhãn theo từng engine cho khỏi nhầm.
5. **Test timing Q5 có thể flake dưới tải cực nặng:** test "timer cháy mà không còn seeking" assert promise resolve trong 180 ms (timeoutMs=100, không gia hạn → ~100 ms; có gia hạn → ~300 ms). Timer Node dưới tải có thể trễ > 80 ms — chưa flake trong lần chạy này (20/20) nhưng cần biết khi chạy lại dưới tải.
6. **Sóng EPERM vẫn ảnh hưởng các lần ghi khác:** log bridge/probe có thể fail ghi (eperm-retry 5 lần rồi bỏ); chỉ vite-start và Xvfb-start đã được miễn nhiễm/kháng sóng. Xem §7.
7. **Số đo chỉ cho clip GOP 250, 6 s, 720p:** seek gần keyframe nhanh hơn nhiều (t=1 luôn nhanh hơn t=5 ~2×); clip GOP ngắn/keyframe dày sẽ nhanh hơn; không suy ra cho mọi clip.

## 7. Môi trường: sóng EPERM (phát hiện thêm trong lúc đo)

- Sóng bật/tắt theo chu kỳ vài phút; cửa sổ tắt có thể ngắn (< 1 phút). Vite chết ngay ở `loadConfigFromBundledFile` nếu khởi động lúc sóng bật — probe tải fail 8/8 lần × 2 lượt liên tiếp trước khi có `--configLoader native`.
- **Lỗi theo tiến trình:** tiến trình spawn lúc sóng bật có thể `unlink` fail mãi dù `write` đã thành công (probe 12:36–12:45: write OK mỗi 10 s nhưng unlink fail suốt 40 lần lặp, trong khi tiến trình song song unlink 6/6 OK cùng lúc). Vì vậy vòng chờ sóng chỉ được test WRITE; unlink chỉ là dọn dẹp best-effort, không nằm trong điều kiện thoát.
- Xvfb spawn sớm chết trong lúc chờ vite (~4 phút) → spawn ngay trước launch + verify socket tồn tại.
- `fetch()` không timeout treo vòng poll vite vô hạn khi vite kẹt — đã thêm `AbortSignal.timeout(3000)`.
- Không tự cài đặt gì thêm theo hướng dẫn hệ thống (dep WebKit đã được os-intent replay của hệ thống khôi phục trước đó: libgtk-4, libgstreamer, libevent + thư mục plugin gstreamer).

## 8. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/seek.ts` — `SeekOpts.timeoutExtensions`, re-arm timer, `SEEK_TIMEOUT_EXTENSIONS = 5`.
- `apps/web/src/lib/seek.test.ts` — 5 test Q5 mới (20/20 PASS).
- `apps/web/src/preview.tsx` — hook `__vcutMediaEls` nhánh pause; `seekAll` truyền `timeoutExtensions`.
- `apps/web/scripts/probe89q5-seek-latency.mjs` — sampler trong trang, wave-wait (write-only), `--configLoader native`, fetch timeout, Xvfb spawn muộn + retry.
- `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` — `measureAtPlayhead` 4 tín hiệu + gate STALE, S7 movement check, (a2) wait-for-change, wave-wait, `--configLoader native`, fetch timeout.
- `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` — như trên (bản WebKit).
- `docs/PHASE9_ROUND89_Q5_SEEK_CONFIRM_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round89-q5-seek-confirm` (`~/workspace/repo-1-push/paths-loop/phase9-round89-q5-seek-confirm.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round89-q5.md`.
