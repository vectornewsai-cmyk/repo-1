# Đợt 125 T8 — Vite harness: 82j3 check config + khôi phục fixture 7 harness EXIT:2 + libevent + chạy đầy đủ 68v2 (8/8)

Ngày: 17/11/2026 (lượt cron 03:35 +07; làm 20:41–21:36Z). Máy đo: VM này (CPU-only, Chromium qua Xvfb, WebKitGTK 27.2).
Phạm vi: CHỈ 2 harness (`probe-82j3-sample-load.mjs`, `clicktest-68v2-stab-toggle-headed.mjs`) + fixture khôi phục + LIMITS này. KHÔNG sửa production (`preview.tsx` `03bf029f…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` — khớp đúng số đợt 124, không động), KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet.
Nợ: docs/PHASE9_ROUND124_T8_VITEHARNESS_LIMITS.md §9 mục 2–3 + docs/PHASE9_ROUND124_LIMITS.md §10 mục "Vite harness".

## 0. Boot giữa đợt — reboot #70

Lượt này chạy qua **2 boot**: mở trên boot **#69** (boot_id `670c07f6…`, btime 20:35:11Z), rồi **reboot lúc 20:54:19Z** sang boot **#70** (boot_id `310f07e4-f789-427a-bee8-a9aefd5a1f02`, `uptime -s` 20:54:19Z, `stat /proc/1` 20:54:30Z — chênh 11 s giữa hai nguồn, cùng mẫu chênh các boot trước). `/tmp` bị xóa theo reboot như mọi lần — toàn bộ fixture `/tmp` vừa tạo lại ở đầu lượt bị mất, phải tạo lại lần 2 (lệnh y hệt, md5 khớp lần 1 — ffmpeg xác định). T5 đợt 125 làm postboot cho #70 và PASS lúc 20:59:21Z (poll 3, `t5-wait-replay-b70`). Không mất file trên đĩa bền (`/home/hatch`).

## 1. Kết luận ngắn

- **82j3 — ĐÃ XONG (nợ đợt 124 §9 mục 2 — ĐÃ ĐÓNG):** `probe-82j3-sample-load.mjs` giờ kiểm tra tồn tại config trước khi spawn, đúng mẫu 65r8-overlay (**+4 dòng**; md5 `25c8456c…` → `edb86968…`, 8.146 B). Kiểm chứng cả hai chiều: (a) config vắng → lỗi rõ "`không thấy vite config /tmp/round77-e1/vite.e1.headed.config.mjs (chạy clicktest-77e1-deint-fps.mjs trước để tạo)`", không spawn gì, không process mồ côi; (b) sau khi writer 77e1 chạy (10/10 pass) → 82j3 qua check, vite lên, probe tự kết luận "PROJECT ĐÃ LOAD (3 clip + hook)".
- **7 harness EXIT:2 đợt 121 — HẾT EXIT:2 (nợ đợt 124 §9 mục 3 ý 1 — ĐÃ ĐÓNG):** khôi phục đủ 7 fixture (xem §3), chạy lại đầy đủ cả 7: **7/7 exit 0** (76d8 11/11, r80h4 3/3, r81i4 3/3, 81i7 + 84l10 + 85m4 + 86n2 nhánh chromium đều KHÔNG FAIL). 4 harness webkit phải chạy dưới Xvfb ngoài (harness không tự spawn Xvfb — như N3 đợt 121).
- **libevent — ĐÃ HẾT (nợ đợt 124 §9 mục 3 ý 2 — ĐÃ ĐÓNG theo hướng replay):** `libevent-2.1.so.7` giờ CÓ trên VM — replay hệ thống (postboot #70 của T5) đã cài `libevent-2.1-7t64` 2.1.12-stable-9ubuntu2.2; T8 **không tự cài apt** (chờ replay xong mới kết luận). WebKit launch được; 81i7-webkit chạy đầy đủ **exit 0, W1+W2 PASS** (xem §4 — cần thêm biến môi trường GST, xem dưới).
- **68v2 đầy đủ H0–H7 — 8/8 PASS, exit 0 (nợ đợt 124 §9 mục 3 ý 3 — ĐÃ ĐÓNG):** lần chạy đầu exit 2 vì Chrome FATAL "Socket path too long" (TMPDIR dài); sửa bền TMPDIR → `/tmp/round68-v2/tmp` (đã tái hiện độc lập). Lần chạy 2: 7/8 — H1 fail oan do probe đọc nhầm hint (`.preset-desc` đầu tiên của dialog); sửa selector hint → chạy lại: **8/8 pass**. md5 harness `5f74da1e…` → `12b9b7a2…`, 31.685 B < ngưỡng oversize 37.768 B.
- **tsc-web exit 0, vite build exit 0** (built 6,70 s) sau mọi sửa code.

## 2. 82j3 — kiểm tra tồn tại config (mẫu 65r8-overlay)

Backup gốc tại `hidden_files/round125-t8/backup/probe-82j3-sample-load.mjs` (md5 `25c8456c…`).

Thay đổi (+4 dòng, đầu khối `try`, trước khi spawn Xvfb — fail-fast, không để lại process mồ côi):

```js
if (!fs.existsSync(VITE_CFG)) throw new Error(`không thấy vite config ${VITE_CFG} (chạy clicktest-77e1-deint-fps.mjs trước để tạo)`);
```

(Kèm 3 dòng comment giải thích mẫu + lý do. `fs` đã import sẵn; không thêm import.)

Kiểm chứng 2 chiều (log `hidden_files/round125-t8/`):

1. **Chiều âm — config vắng** (`/tmp/round77-e1/` không tồn tại sau reboot #69): chạy 82j3 → `PROBE LỖI: Error: không thấy vite config /tmp/round77-e1/vite.e1.headed.config.mjs (chạy clicktest-77e1-deint-fps.mjs trước để tạo)` trong `round82-j3/probe-sample-load/probe.log`, kết thúc ngay, 0 Xvfb/vite/chrome mồ côi. (Tác dụng phụ, ghi rõ: lần chạy này ghi đè `probe.log` gốc của đợt 82 trong `round82-j3/probe-sample-load/` — số liệu gốc vẫn còn trong doc đợt 82; các lần chạy sau đã dùng `J3P_SCRATCH` riêng.)
2. **Chiều dương — config có**: chạy writer `clicktest-77e1-deint-fps.mjs` (`E1_SCRATCH=round125-t8/e1-scratch`, exit 0, **10/10 pass**, config `/tmp/round77-e1/vite.e1.headed.config.mjs` 2.121 B) → chạy 82j3 (`J3P_SCRATCH=round125-t8/j3p-scratch`): qua check, "`vite đã lên`", poll t+10s `nClips=3 + hook`, tự kết luận "PROJECT ĐÃ LOAD (3 clip + hook) — chỉ chậm, không hỏng", tự kill vite/chrome/xvfb, không cần kill tay. Log `j3p-run.log` + `j3p-scratch/probe.log`.
3. `node --check` PASS.

## 3. Khôi phục fixture cho 7 harness EXIT:2 đợt 121 — 7/7 exit 0

### 3.1 Fixture nào thiếu/hỏng (xác định lại từng cái)

| # | Harness | Fixture thiếu | Nguyên nhân | Cách khôi phục |
|---|---|---|---|---|
| 1 | `clicktest-76d8-codec-probe-debts.mjs` | `/tmp/round76-d8/hevc-a.mp4` | `/tmp` mất sau reboot | ffmpeg libx265 1920×1080 2 s + sine 440 Hz AAC, `-movflags +faststart` (đúng doc D8 §2.2) |
| 2 | `r80h4-headed-capture.mjs` | `round80-h4/media/blend-tp-ocean-a50.mp4` | **CHƯA TỪNG được build** — screen H4 chỉ tính tp-ocean a0125/a025 (chỉ là nhãn, không phải file mp4); harness mặc định `BLEND_NAME=blend-tp-ocean-a50` nên file này không hề tồn tại ngay cả ở đợt 80 (đợt 80 chạy bằng env override a65/a85) | Build mới theo ĐÚNG method `r80h4-blend-build.mjs`: blend RGB (1−α)·test-pattern + α·ocean, α=0,50, frame plain 1280×720, libx264 crf 18, 4 s @30fps still |
| 3 | `clicktest-81i7-webkit-loop-wire.mjs` | `/tmp/round81-i7/i7-clip-10s.mp4` | `/tmp` mất sau reboot | ffmpeg testsrc2 640×360 10 s libx264 (đúng doc I7 §8) |
| 4 | `r81i4-headed-capture.mjs` | `round81-i4/media/blend-tp-slov-a085.mp4` | Tên lệch nhãn: build script gốc (`r81i4-media-build.mjs`) chỉ viết ra `blend-tp-slov-a85.mp4`, còn harness chờ `a085` (H4 doc: "sàng ghi nhãn a085, build ghi a85 — cùng α=0,85") | Chạy đúng script gốc với spec `blend:tp-slov:a085` (chuỗi Z2 MAD=0, encode MAD=1,325) → copy byte-identical `a85.mp4` → `a085.mp4` (md5 `f4c35a6a…` cả hai) |
| 5 | `clicktest-84l10-webkit-loop-w1.mjs` | `/tmp/l10/clips/h_h264_320x180_30s.mp4` + `g_h264_320x180_4s.mp4` | `/tmp` mất sau reboot | ffmpeg testsrc2 320×180 libx264, 30 s + 4 s (đúng quy ước tên L10) |
| 6 | `clicktest-85m4-webkit-w7.mjs` | `/tmp/m4/clips/h_h264_320x180_30s.mp4` | `/tmp` mất sau reboot | Copy byte-identical từ file `/tmp/l10` vừa encode (cùng clip H.264 320×180 30 s) |
| 7 | `clicktest-86n2-webkit-w7.mjs` | `/tmp/n2/clips/h_h264_320x180_30s.mp4` | `/tmp` mất sau reboot | Như trên (copy từ `/tmp/l10`) |

Script build one-off cho mục 2: `hidden_files/round125-t8/build-tp-ocean-a50.mjs` (không sửa script lịch sử; trung gian `.rgb`/decoded30 giữ ở `round125-t8/fixtures/`). Kết quả build: chuỗi Z2 MAD=0, encode check MAD=1,475 (lossy crf 18, nhỏ như kỳ vọng method H4); ffprobe: h264 1280×720, 4,0 s, 881.516 B. Các clip `/tmp` đều verify bằng ffprobe (codec/res/duration đúng spec); md5 sau tạo lại lần 2 (post-reboot) khớp lần 1: hevc-a `ba0c7c62…`, i7-clip `f05daed8…`, h-30s `fbaa3d1a…`, g-4s `a1fb8549…`.

**KHÔNG stage binary:** các file mp4 khôi phục nằm ở `/tmp` (mất sau reboot — tạo lại bằng lệnh/script đã ghi ở đây) hoặc `hidden_files/*/media/` (binary ngoài repo). Chỉ stage script gen + LIMITS này.

### 3.2 Chạy lại — 7/7 exit 0

Driver `hidden_files/round125-t8/rerun-exit2.sh` (chạy tuần tự, scratch riêng `round125-t8/` để không ghi đè evidence các đợt cũ; log từng harness tại `smoke/rerun-<tag>.log`, tổng hợp `smoke/rerun-exit2-summary.txt`):

- **76d8: exit 0, 11/11 pass** (38 s) — hevc import đúng race, badge, reload, Escape, 0 lỗi trang.
- **r80h4: exit 0, 3/3 pass** (24 s) — với fixture blend-tp-ocean-a50 MỚI build: D1 snapshot plain 2 lần pixel-identical (rect 489×275, mean 127,69), D3 cùng-khung (hash `50d1c225`, ct khớp), H9 0 lỗi trang.
- **r81i4: exit 0, 3/3 pass** (23 s) — với `a085` (copy của a85 vừa build lại).

**Bài học giữa chừng (driver lần 1):** 4 harness webkit (81i7/84l10/85m4/86n2) chạy nhánh chromium **không có DISPLAY** → exit 1 sau 1–2 s: "looks like you launched a headed browser without having a XServer running" (harness không tự spawn Xvfb — như N3 đợt 121). Log vẫn chứng minh đã qua bước fixture (dòng đầu "`vite dev sẵn sàng … (clip: …)`"), lỗi chỉ ở browser launch. Sửa driver: chạy dưới Xvfb :195 tự dựng.

**Reboot #70 xen giữa (20:54:19Z):** `/tmp` bị xóa ngay sau khi driver lần 1 xong 3/7 — 4 harness webkit chạy lại dưới Xvfb :195 liền sau đó lại EXIT:2 vì clip `/tmp` vừa mất. Đã tạo lại toàn bộ fixture `/tmp` (md5 khớp) + chạy lại bằng driver `rerun-post-reboot.sh` (77e1 → 76d8 → 4 webkit/chromium dưới :195):

- **77e1: exit 0, 10/10 pass** (post-reboot, tạo lại config cho 82j3).
- **76d8 (chạy lại post-reboot): exit 0, 11/11 pass.**
- **81i7 chromium: exit 0** (23 s) — W1 PASS + W2 PASS.
- **84l10 chromium: exit 0** (58 s).
- **85m4 chromium: exit 0** (~2 phút).
- **86n2 chromium: exit 0** (~3,7 phút, P5 40 s quan sát xong).

Tổng kết mục 3.2: **7/7 harness không còn EXIT:2; 7/7 chạy đầy đủ exit 0** (3 cái pre-reboot + 4 cái post-reboot; 76d8 chạy lại cả hai lần đều exit 0). Log đầy đủ: `smoke/rerun-exit2-summary.txt`, `smoke/rerun-post-reboot-summary.txt` + từng `rerun-*.log`.

## 4. WebKit headed — libevent đã hết; cần thêm biến GST

### 4.1 Chẩn đoán

- Trước replay #70: `ldd MiniBrowser` thiếu ~21 lib, trong đó có `libevent-2.1.so.7` (chỉ có `libevent_core-2.1.so.7`); `apt-cache policy libevent-2.1-7` trống; cache apt chỉ có 2 file .deb, 0 libevent.
- T5 postboot #70 PASS (20:59:21Z) → kiểm lại: `libevent-2.1-7t64` **2.1.12-stable-9ubuntu2.2 đã installed**, `libevent-2.1.so.7` + `libevent-2.1.so.7.0.1` có trong `/usr/lib/x86_64-linux-gnu/`. `ldd MiniBrowser` chỉ còn thiếu 4 lib — và 2 trong 4 (`libwebkitgtk-6.0.so.4`, `libjavascriptcoregtk-6.0.so.1`) thực ra **nằm trong bundle Playwright** (`webkit-2388/minibrowser-gtk/lib/`, Playwright tự set đường dẫn khi launch) nên "not found" của ldd trực tiếp là hiểu lầm. **T8 không chạy apt install nào** — libevent về nhờ replay hệ thống; không sửa được từ trong VM cũng không còn đúng nữa vì replay đã làm.
- Bằng chứng độc lập WebKit chạy được: probe T9 đợt 125 chạy WebKit 27.2 **20/20 pass** lúc 21:08–21:12Z trên cùng boot #70.

### 4.2 81i7-webkit: 2 lần crash sớm → tìm ra biến GST → full pass

Chạy `I7_ENGINE=webkit` dưới Xvfb ngoài (harness không tự spawn Xvfb):

| Lần | Điều kiện | Kết quả |
|---|---|---|
| 1 | DISPLAY=:195, không GST env | exit 1 sau 8 s: `page.evaluate: Target crashed` (vite đã lên; KHÔNG còn lỗi libevent — launch qua được bước load lib) |
| 2 | DISPLAY=:195, không GST env (sau khi dọn 4 process WebKit mồ côi của lần 1) | exit 1, y hệt sau ~6 s — **xác định, không phải flaky** |
| 3 | DISPLAY=:195 + `GST_PLUGIN_PATH` + `GST_PLUGIN_SYSTEM_PATH`=`/usr/lib/x86_64-linux-gnu/gstreamer-1.0` (mẫu probe T9) | Vượt qua setup + **W1 PASS** (video readyState 4, reseeks 3→4), nhưng **kẹt ở W2**: không còn log nào sau W1 PASS 21:15:51Z tới khi `timeout 600` kill (exit 124) — `page.evaluate` trong vòng W2 treo (W2 có trần 20 s nhưng evaluate không timeout riêng nên treo vô hạn); lỗi cuối "Target page, context or browser has been closed" là hệ quả của timeout kill, không phải verdict |
| 4 | DISPLAY=:194 (Xvfb mới) + GST env như lần 3 | **exit 0, KHÔNG FAIL** (28 s): W1 PASS (reseeks 3→4), **W2 PASS** (playhead cuối=10, reseek tự nhiên Δ=0, errors=0) |

Kết luận §4: **nợ libevent ĐÃ ĐÓNG** (lib đã có + launch được + chạy đầy đủ pass). Hai điểm mới ghi lại cho đợt sau: (a) harness webkit-headed cũ (81i7/84l10/85m4/86n2) **cần `GST_PLUGIN_PATH` + `GST_PLUGIN_SYSTEM_PATH`** trỏ tới `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` thì WebKitGTK mới decode/play được — không có 2 biến này thì target crash ngay ở evaluate đầu (2/2 lần); (b) **W2 kẹt 1 lần trên display :195** (đã chạy nhiều lượt trước đó) nhưng không tái hiện trên :194 mới — ghi là flaky/display, không kết tội đường nối; nếu gặp lại thì thử display mới trước.

Chưa chạy 84l10/85m4/86n2 nhánh webkit (chỉ mới chromium) — nợ mở nhỏ, xem §9. Lần 1 để lại 4 process WebKit mồ côi (MiniBrowser + WebProcess + NetworkProcess, ~700 MB RSS) — đã kill tay sau khi xác minh pid/start-time thuộc lượt chạy của T8; lần 2/3/4 không để lại mồ côi.

## 5. 68v2 đầy đủ H0–H7 — 8/8 pass sau 2 lần sửa

### 5.1 Lần chạy 1: exit 2 — Chrome FATAL "Socket path too long"

`vite dev :5820` lên (qua config tự ghi đợt 124 — phần sửa đợt 124 vẫn đúng), nhưng Chrome chết ngay: `FATAL: ... Socket path too long: /home/hatch/.../hidden_files/round68-v2/tmp/org.chromium.Chromium.iCHf7w/SingletonSocket.` → "`không lấy được page target CDP (debug :9920)`" sau 90 s.

Nguyên nhân: harness đặt `TMPDIR` = `hidden_files/round68-v2/tmp` (dài); Chrome đặt SingletonSocket tại `$TMPDIR/org.chromium.Chromium.XXXXXX/SingletonSocket` — tổng ~128 ký tự, vượt giới hạn `sun_path` 108 ký tự của Unix socket. **Tái hiện độc lập** (ngoài harness): cùng Chrome + `TMPDIR` dài → FATAL y hệt; (lệnh test B với TMPDIR ngắn chưa chạy được vì `pkill -f` match luôn shell của chính lệnh test — lỗi thao tác của T8, không ảnh hưởng kết luận vì lần chạy harness sau sửa là bằng chứng trực tiếp).

Sửa 1 (đã backup file gốc đợt 124, md5 `5f74da1e…`): `TMPDIR` → `"/tmp/round68-v2/tmp"` (~64 ký tự cho socket path). `/tmp/round68-v2` đã được harness `mkdirSync` sẵn (dòng config mirror); `/tmp` mất sau reboot thì harness tạo lại + dọn luôn singleton stale — đúng ý đồ TMPDIR riêng ban đầu. Chỉ đổi TMPDIR, không đổi profile (vẫn `SCRATCH/chrome-userdata`), không đổi hành vi khác. Cập nhật luôn comment header.

### 5.2 Lần chạy 2: 7/8 — H1 fail oan do probe đọc nhầm hint

H0, H2–H7 PASS. H1 FAIL: toggle `found=true, checked=true`, label đúng, nhưng hint đọc được là "`1920×1080 @30fps — chất lượng tốt, dung lượng vừa phải …`" trong khi chờ "`Bật: ffmpeg decode clip chống rung bằng 1 luồng`".

Nguyên nhân: `TOGGLE_FN` lấy hint bằng `dlg.querySelector(".preset-desc")` — tức `.preset-desc` **ĐẦU TIÊN** trong dialog (mô tả preset xuất, `ExportPanel.tsx:1501`). Hint thật của toggle nằm ở `<p class="tips preset-desc">{stabStrings.hint}</p>` **kề sau** hàng `.preset-row` chứa toggle (`ExportPanel.tsx:1657–1659`); dict `vi.json:1614` vẫn có đúng text chờ. Đây là **lỗi probe, không phải lỗi app** (label/checked/H2–H6 đều đúng).

Sửa 2: `TOGGLE_FN` lấy hint từ `t.closest(".preset-row").nextElementSibling` nếu có class `preset-desc`, không fallback về querySelector đầu tiên (fail rõ thay vì pass sai).

### 5.3 Lần chạy 3: 8/8 pass, exit 0

`V2_SCRATCH=round125-t8/v2-scratch`, 21:34:20–21:34:45Z (loadavg cuối 3,11 — T4 đang chạy leg tải song song, xem §7): H0 setup 3 clip/lang vi; H1 toggle BẬT + nhãn/hint vi đúng (`hint="Bật: ffmpeg decode clip chống rung bằng 1 luồng — output chố…"`, localStorage=null = chưa có key); H2 TẮT + localStorage "0"; H3 BẬT lại + "1"; H4 persist BẬT qua reload; H5 persist TẮT qua reload; H6 dry-run 1× `-threads 1` khi BẬT / 0 khi TẮT; H7 0 lỗi trang. Log `smoke/run-68v2-full3.log`; report `v2-scratch/v2-results.json`.

Diff vs backup đợt 124: **+21/−5 dòng** (2 sửa + comment); md5 `5f74da1e…` → `12b9b7a2…`; 31.685 B < ngưỡng oversize. `node --check` PASS cả hai lần sửa.

## 6. Kiểm chứng sau mọi sửa code

- `node --check` trên cả 2 file đã sửa: PASS (82j3 sau sửa; 68v2 sau mỗi lần sửa).
- `npx tsc --noEmit` (apps/web): **exit 0** (`tsc-web.log`).
- `npx vite build` (apps/web): **exit 0**, built 6,70 s (`vite-build.log`).
- Production không động: `preview.tsx` `03bf029f…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` (khớp số đợt 124).
- Không process mồ côi của T8 sau đo: 0 vite/chrome trên các cổng T8 dùng; Xvfb :194/:195 tự dựng đã kill sau khi dùng xong (Xvfb của luồng khác — :193 T9, :198, :176, :180, :270-socket — không đụng).

## 7. Ghi chú môi trường + tác dụng phụ (trung thực)

- **Reboot #70 (20:54:19Z) giữa lượt:** giết driver rerun lần 1 giữa chừng (không mất log — driver đã ghi xong 3/7), xóa `/tmp` (fixture + config 77e1 + Xvfb :195 socket). Fixture tạo lại lần 2, md5 khớp lần 1. Một lệnh `exec` sleep của T8 cũng bị service restart cắt giữa chừng (không ảnh hưởng driver — driver chạy bằng nohup riêng).
- **T9 lượt yên mở cửa 21:08:29Z + chạy probe 21:08–21:12Z; T2 lượt 8 chạy 21:11–21:12Z:** T8 cố tình KHÔNG chạy 68v2/81i7-webkit trong cửa sổ đó (chờ lock trống + không còn probe nào chạy, kiểm tra bằng `ps` + log T1/T2/T9 + lock status TRỐNG lúc 21:13Z) rồi mới chạy. T4 gate0 ĐẠT 21:15:44Z và chạy leg tải song song với các lần chạy 68v2 sau đó — loadavg cuối lần 68v2 pass là 3,11 (ghi rõ làm caveat, các case H là chức năng nên không nhạy tải).
- **RAM khả dụng dao động 690–1.640 MB trong lượt** (T4 gate0-wait ghi 690 MB lúc 21:13:44Z) — dưới guard 6 GB, birefnet không thử (đúng luật).
- **Lỗi thao tác của T8:** (a) lần chạy 82j3 kiểm chứng chiều âm ghi đè `probe.log` gốc đợt 82 (đã ghi ở §2); (b) `grep` 1 lần quét trúng file JSON chứa base64 dài trong `round81-i4/headed-*` (output >100 KB, đã cắt — không ảnh hưởng kết quả, chỉ tốn 1 lượt đọc); (c) `pkill -f 'remote-debugging-port=9931'` match luôn shell của chính lệnh test → test B (TMPDIR ngắn độc lập) chưa chạy được — kết luận vẫn đứng nhờ lần chạy harness sau sửa.
- Disk: 71 GB trống trên `/home/hatch` (không đổi). Không kiểm lại TTS 39; không thử birefnet; không sửa production; không push.

## 8. Giới hạn — đọc trước khi trích số

1. **7/7 exit 0 là nhánh chromium** (trừ 81i7 đã pass cả hai nhánh: chromium exit 0 + webkit exit 0 với GST env + display mới). 84l10/85m4/86n2 nhánh webkit chưa chạy — xem §9.
2. **Fixture `/tmp` không sống qua reboot** — mọi clip `/tmp` trong §3 đều phải tạo lại sau mỗi reboot bằng đúng lệnh đã ghi; file media trong `hidden_files/*/media/` thì bền.
3. **blend-tp-ocean-a50 KHÔNG phải file gốc đợt 80** — file này chưa từng tồn tại trước đợt này; nó được build mới theo đúng method H4 (α=0,50) để harness mặc định chạy được. Số đo D1/D3 trên file này là số đo trên file tái tạo, không phải số gốc đợt 80 (đợt 80 không có số nào cho a50).
4. **blend-tp-slov-a085 là bản copy byte-identical của a85** (cùng α=0,85, đúng quy ước đặt tên H4 §1.2) — không phải encode riêng.
5. **W2 kẹt 1 lần trên :195** (§4.2 lần 3) chưa giải thích được — nếu trích "webkit-headed ổn định" thì phải kèm caveat này + điều kiện GST env + display mới.
6. **68v2 H1 pass nhờ sửa probe, không phải sửa app** — app vốn đúng; đừng trích H1 như bằng chứng app được sửa.
7. Số đo chỉ đúng trên VM này trong giờ vòng lặp 8–10 luồng song song (load là biến số lớn nhất).

## 9. Nợ cho đợt sau

1. **ĐÃ ĐÓNG đợt này:** 82j3 check config; 7 harness EXIT:2; libevent (nhờ replay); 68v2 đầy đủ H0–H7.
2. **Mới:** chạy 84l10/85m4/86n2 nhánh **webkit** với GST env + display mới (như 81i7 đã pass) để có số đối chiếu webkit đầy đủ sau mirror — nợ nhỏ, chỉ cần cửa sổ yên.
3. **Mới:** 25 file config mặc định (§6.1 đợt 121 T9) vẫn chưa mirror — cần parent quyết (nâng trần host hay viết config riêng + `-c`).
4. **Mở từ trước, vẫn đứng:** G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; mù #40 B / #43 chờ quyết parent; luật repair dạng (C) chưa được thử trong kịch bản mục tiêu.
5. **Cân nhắc:** `probe-82j3-sample-load.mjs` vẫn exit 0 ngay cả khi probe lỗi (catch-all không set exit code) — hành vi có từ trước, không sửa trong đợt này; nếu đợt sau muốn fail rõ thì set `process.exitCode = 2` trong catch.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round125-t8-viteharness.txt` — **3 file** (LIMITS này + 2 harness đã sửa), đã verify read-back, 0 binary, **0 file > 37.768 B** (82j3: 8.146 B; 68v2: 31.685 B). Fixture binary KHÔNG có trong batch (đúng luật). Dữ liệu thô: `hidden_files/round125-t8/` (backup/ 2 file, build-tp-ocean-a50.mjs, rerun-*.sh, smoke/ 20+ log + 3 summary, e1/j3p/v2 scratch, fixtures/, tsc-web.log, vite-build.log).
