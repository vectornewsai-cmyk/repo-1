# Phase 9 Round 90 — R5: AppImage mới (đợt 89 Q9 build) — smoke + orphan-relaunch + click-test trong gói — LIMITS

Ngày: 11/11/2026 (lượt cron 21:35 +07). Luồng R5 đợt 90. Repo:
`vectornewsai-cmyk/repo-1`, branch main (cây local `~/workspace/repo-1`,
không có `.git` — đẩy qua push-files API). Nhiệm vụ: đóng nợ LIMITS gộp
đợt 89 §4 mục 5 — "Smoke + orphan trong AppImage mới chưa hoàn tất
(không phải FAIL): `package-ship --skip-build` đã PASS verify + probe
8/8 rồi bị cell/VM restart ~13:21Z giết giữa bước smoke".
**KHÔNG push, KHÔNG release/tag, KHÔNG build lại AppImage, KHÔNG đè
AppImage K7, KHÔNG code giả, KHÔNG đụng TTS 39.**

> TRẠNG THÁI: HOÀN TẤT 15:10Z 11/11/2026. Nợ đợt 89 §4 mục 5 **ĐÃ ĐÓNG**:
> smoke + orphan-relaunch trong AppImage mới đều PASS 2/2 lần chạy;
> click-test gói thật **8/8 PASS ngay lần 1**; spot-check u2net bgremove
> trong gói PASS (guard chặn birefnet, u2net 17/17 frame). Birefnet-general
> vẫn 0 lần chạy thành công trong gói (không có cửa sổ yên ≥ 6 GB).

## 0. Kết luận ngắn

1. **AppImage mới đợt 89 Q9 đã verify lại trước khi test:** 557.008.461
   byte, sha256
   `9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`
   (khớp hồ sơ Q9). Guard P7 có trong gói: `bgremove.py` 7 lần
   `ram_guard`, `bgremove.js` 5 lần.
2. **`package-ship --profile full --skip-build` trên AppImage mới:
   ALL GREEN 2/2 lần chạy liên tiếp** (run 1: 14:52:35–14:55:10Z;
   run 2: 14:55:26–14:58:37Z): verify-packaged-tree PASS (đủ 4 venv),
   probe AI **8/8 available:true** cả hai lần, smoke PASS
   (textLen 4171, title "VCut Studio — Trình dựng video"), orphan
   PASS cả hai lần (run 1: bridge cũ 35809 chết → mới 36007 healthy;
   run 2: cũ 38115 chết → mới 38364 healthy; smoke lần 2 ok, note null).
3. **Click-test gói thật: 8/8 PASS ngay lần 1** (14:59:18–15:03:12Z):
   K1–K6 PASS; **K7 export MP4 qua UI PASS ngay lần 1** (TYPED_OK,
   SAVE_CLICK 1084/799, job `846594deff9986ea` done sau 39s, download
   484.316 byte + đích native 484.316 byte, ffprobe duration
   8,000000s cả hai); K8 thoát sạch (app 39162 + bridge 40111 chết,
   pidfile xoá, cổng 8787 trống). Không cần K7b fallback.
4. **Spot-check u2net bgremove trong gói: PASS** (driver e2e Q9,
   work dir mới, 15:03:37–15:09:51Z): bridge healthy sau 5,5s; job
   session `birefnet-general` → guard chặn (RAM khả dụng 1869 MB <
   ngưỡng 6144 MB), `sessionUsed=u2net`, `fallbackFrom=birefnet-general`,
   HTTP 200 sau 185,8s; MOV đầu ra **1.715.896 byte** (bằng đúng byte
   với lần Q9 — đầu ra u2net xác định), 960×540, rgba, **17/17 frame**,
   ~0,08 fps; frame 7: 59,3% trong suốt / 40,7% bán trong / 0% đục,
   alphaMean 8,9 — giống hệt Q9. `birefnetRan=false`.
5. **Birefnet-general vẫn 0 lần chạy thành công trong gói.** Max
   MemAvailable thấy trong lúc chạy e2e: 2340 MB (mẫu 20s: 1583 /
   2340 / 1083 / 673 / 1672 / 1428 / 953 / 993 / 1562 MB) — xa dưới
   ngưỡng 6144 MB. Nửa "1 lần chạy birefnet thành công" của nợ gốc
   đợt 88 §4 mục 2 vẫn mở, cần cửa sổ yên ≥ 6 GB ~7 phút hoặc máy
   nhiều RAM.

## 1. Điều kiện chạy (trung thực — môi trường xấu hơn Q9)

- RAM khả dụng lúc bắt đầu lượt chỉ **396–1095 MB** (dao động mạnh;
  lúc 21:52 +07 chỉ 662 MB), loadavg 7,38 — các luồng đợt 90 khác
  đang render nặng song song (ffmpeg trackgeq Q3 đang chạy lúc bắt
  đầu). Mọi bước nặng trong luồng này chạy TUẦN TỰ.
- RAM cải thiện dần trong lượt (1566 MB lúc ship-run1, 2388 MB lúc
  ship-run2, 3004 MB lúc click-test) rồi lại tụt (1114 MB lúc e2e).
- Sóng EPERM: **không gặp trong lượt này** — ghi file test OK lúc
  đầu; mọi report/log (ship-full-report.json, clicktest-report.json,
  e2e-report.json) đều ghi đủ size, không có file 0 byte.
- Không có VM reboot nào trong lượt (uptime 1:29 lúc bắt đầu →
  chạy xuyên suốt tới 15:10Z).
- /tmp tmpfs 512 MB đã dùng 84% (83 MB trống) — mọi TMPDIR đều trỏ
  work dir trên /home (`~/workspace/tmp-r90-r5-appimage-new-smoke/`,
  `tmp-q9-round89-ship/tmp-run`), không dùng /tmp. Không dính ENOSPC.

## 2. Smoke + orphan trong gói mới — PASS 2/2

Lệnh: `node scripts/package-ship.mjs --profile full --work
~/workspace/tmp-q9-round89-ship --skip-build` (không build lại;
AppImage + `linux-unpacked/` dùng lại của Q9). Log:
`~/workspace/tmp-r90-r5-appimage-new-smoke/ship-run{1,2}.log`;
report: `~/workspace/tmp-q9-round89-ship/ship-full/ship-full-report.json`
(ghi đè report 0 byte của Q9 — Q9 bị restart giết trước khi ghi).

| Bước | Run 1 (14:52:35–14:55:10Z) | Run 2 (14:55:26–14:58:37Z) |
|---|---|---|
| verify-packaged-tree | PASS (4 venv: caption/tts/reframe/bgremove, Python 3.12.3) | PASS |
| probe-ai-packaged | **8/8 available:true** (caption/translate/tts/bgremove/reframe venv depsOk+modelOk=true; silence/scene/beats system) | **8/8 available:true** (giống hệt) |
| smoke-appimage | PASS — `bridgeUrl=null textLen=4171`, `bridgeFromRenderer:"ok"`, rootChildren 1, secureContext true | PASS — giống hệt |
| orphan-kill9-relaunch | PASS — bridge cũ **35809** sống+healthy sau kill -9 → mở lại dọn chết → bridge mới **36007** healthy, smoke lần 2 ok | PASS — bridge cũ **38115** → mới **38364** healthy, smoke lần 2 ok |
| Kết quả | **ALL GREEN, SHIP-EXIT:0** | **ALL GREEN, SHIP-EXIT:0** |

So với K7/L1 trên AppImage K7: cùng mẫu PASS 2 lần liên tiếp, không
còn dòng `bridge state -> failed` nào; các sửa K7 (socketConnected,
timeout health check tính lại theo tải, guard smoke 60s, poll
healthy2 120s, fix scoping pid2) tiếp tục đúng trên gói mới. Nợ đợt
89 §4 mục 5 **ĐÃ ĐÓNG**.

## 3. Click-test gói thật — 8/8 PASS lần 1

Lệnh: `K7_WORK=~/workspace/tmp-r90-r5-appimage-new-smoke/clicktest
K7_APPIMAGE=<appimage-mới> K7_DISPLAY=97 K7_CDP_PORT=9222
K7_BRIDGE_PORT=8787 node scripts/clicktest-ship-full.mjs` (harness
K7+L1, không sửa). Log `clicktest-run1.log`, report
`clicktest/clicktest-report.json` (allPass:true), export thật
`clicktest/export.mp4` + `clicktest/export-ui.mp4` (484.316 byte mỗi
file). Chạy 14:59:18–15:03:12Z (~3m54s).

| Bước | Kết quả |
|---|---|
| K1 mở app + CDP lên | PASS — Chrome/156.0.8078.80, page app://vcut/index.html, **CDP sau 87s** (chậm hơn K7 24s / L1 20s — do tải VM cao lúc mở app, không phải lỗi gói) |
| K2 UI mount | PASS — #root 1 con, textLen=4226, title "VCut Studio — Trình dựng video" |
| K3 bridge healthy từ renderer | PASS — healthy sau 4s, HTTP 200 ok:true (bridge pid 40111, cổng 8787) |
| K4 import clip mẫu | PASS — clip1.mp4 (104.028 byte) vào bin; autosave binMedia [mau-1.webm, mau-2.webm, clip1.mp4] |
| K5 thêm clip vào timeline | PASS — .tl-clip 3→4, clipCount=3 |
| K6 preview play | PASS — time-display 00:00.0→00:04.5 / 00:08.0 (video currentTime đổi=false như mọi lần trước — quirk có sẵn, xem §5) |
| K7 export MP4 qua UI | **PASS ngay lần 1** — dialog GTK Viewable 1124x822 tại (0,0), TYPED_OK, SAVE_CLICK x=1084 y=799; job `846594deff9986ea` done sau 39s; download 484.316 byte, duration 8,000000s; **đích native 484.316 byte, duration 8,000000s** |
| K8 thoát sạch | PASS — app pid 39162 chết, bridge pid 40111 chết, pidfile đã xoá, cổng 8787 trống |

Lưu ý: K7 lần này PASS ngay lần 1, không gặp lại bài học đợt 83
(hộp thoại native không xử lý được bằng XTEST) — harness L1 (chọn
dialog theo cây X Viewable ≥400px, keysym dấu câu, Ctrl+A, click
Save theo tọa độ tương đối) vẫn đúng trên gói mới; dialog vẫn
1124x822 tại (0,0), tên cửa sổ vẫn rỗng. Không cần K7b fallback
(render smoke qua bridge) vì K7 UI đã PASS.

## 4. Spot-check u2net bgremove trong gói — PASS

Lệnh: driver e2e Q9 (`apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs`,
không sửa) với `Q9_WORK=~/workspace/tmp-r90-r5-appimage-new-smoke/e2e-u2net`,
`Q9_MODELS_DIR=~/workspace/tmp-q9-round89-ship/models`. Log
`e2e-u2net-run1.log`, report `e2e-u2net/e2e-report.json` (allPass:true).
Chạy 15:03:37–15:09:51Z.

| Mục | Số đo thật |
|---|---|
| AppImage | 557.008.461 byte, sha256 `9680cef1…` (preflight khớp) |
| Launch | Xvfb :91 pid 41933; AppImage pid 41934; cổng bridge 8787 tìm thấy sau ~147s (khởi động chậm dưới tải — xem §5); **bridge healthy sau 5,5s** |
| RAM trước job | **1884 MB** (ngưỡng guard 6144 MB) — guard dự kiến chặn |
| Job | POST `/api/bgremove` session=`birefnet-general`, clip 0,5s (0,566667s, 17 frame) → **HTTP 200 sau 185,8s** (chậm hơn Q9 135,0s — tải VM cao hơn, loadavg chạm 22,3 sau job) |
| Guard | `sessionUsed=u2net`, `fallbackFrom=birefnet-general`, `fallbackReason="RAM guard: RAM khả dụng 1869 MB < ngưỡng 6144 MB nên không thử birefnet-general (tránh OOM-kill) — đã dùng u2net ngay từ đầu"`; `guardBlocked=true`, `birefnetRan=false` |
| Đầu ra | `clip-0.5s_no_bg.mov` **1.715.896 byte** — bằng đúng byte với lần Q9 (đầu ra u2net xác định), 960×540, codec png, pix_fmt **rgba**, duration 0,566667s, **17/17 frame đọc được**, ~0,08 fps |
| Alpha thật | Frame 7: 518.400 px — **59,3% trong suốt, 40,7% bán trong, 0% đục**, alphaMax 254, alphaMean 8,9 — giống hệt Q9 |
| Dọn dẹp | Cổng 8787 trống sau kill, app pid chết; không còn process vcut/AppImage/Xvfb :91/:97 sót sau lượt |

Lưu ý trung thực (giống Q9): chuỗi marker `RAM_GUARD` 0 dòng trong
`app-stdout.log` — bằng chứng guard nằm ở done event
(`fallbackReason` nhắc đúng "RAM guard") và bridge log, là đủ cho
verdict; không cần marker stdout.

## 5. Giới hạn — chưa làm được / chưa test (trung thực)

- **Birefnet-general: vẫn 0 lần chạy thành công trong gói.** Max
  MemAvailable trong lúc chạy e2e: 2340 MB; toàn lượt không có cửa
  sổ yên ≥ 6 GB nào. Cần cửa sổ yên ≥ 6 GB khả dụng ~7 phút hoặc
  máy nhiều RAM (nợ gốc đợt 88 §4 mục 2, nửa "1 lần chạy thành công"
  vẫn mở).
- **K1 CDP sau 87s** (K7: 24s, L1: ~20s) và **tìm BRIDGE_PORT sau
  ~147s** trong e2e (Q9 lần 2: 34s) — khởi động app chậm dưới tải
  VM cao (loadavg 5–8 lúc mở app, RAM khả dụng lúc đó ~1,1–1,5 GB),
  không phải lỗi gói: cả hai lần đều lên healthy sau đó (bridge
  healthy 4–5,5s) và mọi bước sau đều PASS. Nếu đợt sau gặp
  timeout ở đây: retry / chờ tải hạ, đừng kết luận gói hỏng.
- **Job u2net 185,8s** (Q9: 135,0s) — chậm hơn do tải; ~0,08 fps.
  Không phải hồi quy: cùng clip, cùng đầu ra byte-identical.
- **K6 quirk có sẵn (không phải lỗi R5):** `video currentTime
  đổi=false` trong khi time-display vẫn chạy (00:00.0 → 00:04.5)
  — giống mọi lần chạy 12–19 của K7/L1. K6 PASS theo tiêu chí
  time-display đổi; chưa điều tra vì sao currentTime đứng yên.
- **Nút Save click theo tọa độ tương đối (heuristic, nợ từ L1 §6):**
  harness bấm Save tại (rộng-40, cao-23) tính từ góc dialog — đo
  thật lần này vẫn 1124x822 tại (0,0). Nếu GTK/theme/màn hình khác
  đổi layout action-area, click có thể trượt (sẽ thấy
  `DIALOG_STILL_OPEN` rồi K7 fail honest, không PASS giả).
- **Không sửa code production hay harness nào trong luồng này** —
  toàn bộ test chạy trên AppImage đã build sẵn + script có sẵn.
  Batch stage chỉ có file LIMITS này.
- Nợ cũ giữ nguyên: `.deb` full chưa build; macOS/Windows/arm64
  không build được từ Linux; tải model 3,7 GB lần đầu chưa đo tốc
  độ thật; `VCUT_NODE` override / `bin/node` thật chưa ship;
  ci-security.yml 403; TTS 39 cấm kiểm lại.

## 6. File trong batch (stage chờ push — text only)

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND90_R5_APPIMAGE_NEW_SMOKE_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: AppImage 557 MB + `linux-unpacked/` +
`userdata-*/` + report JSON + log chạy + file xuất test (đều ở
`~/workspace/tmp-q9-round89-ship/` và
`~/workspace/tmp-r90-r5-appimage-new-smoke/`, giữ ngoài repo để
parent đối chiếu; AppImage là binary), `apps/desktop/dist-web/` /
`build/` (artifact).

## 7. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
cd ~/workspace/repo-1
# Smoke + orphan trong AppImage mới (không build lại):
node apps/desktop/scripts/package-ship.mjs --profile full \
  --work ~/workspace/tmp-q9-round89-ship --skip-build
#   Kỳ vọng: ALL GREEN — verify PASS, probe 8/8, smoke PASS,
#   orphan PASS (bridge cũ chết, bridge mới healthy).
# Click-test gói thật (K1–K8):
K7_WORK=~/workspace/tmp-r90-r5-appimage-new-smoke/clicktest \
K7_APPIMAGE=~/workspace/tmp-q9-round89-ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage \
K7_DISPLAY=97 K7_CDP_PORT=9222 K7_BRIDGE_PORT=8787 \
  node apps/desktop/scripts/clicktest-ship-full.mjs
#   Kỳ vọng: 8/8 PASS (K7 export UI PASS ngay lần 1 nếu dialog
#   GTK vẫn 1124x822 tại (0,0); K1 CDP có thể chậm ~90s dưới tải).
# Spot-check u2net bgremove trong gói (driver Q9, không sửa):
Q9_WORK=~/workspace/tmp-r90-r5-appimage-new-smoke/e2e-u2net \
Q9_APPIMAGE=~/workspace/tmp-q9-round89-ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage \
Q9_EXPECTED_SHA=9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78 \
Q9_MODELS_DIR=~/workspace/tmp-q9-round89-ship/models \
  node apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs
#   Kỳ vọng trên VM ít RAM: guard chặn birefnet, u2net hoàn tất
#   17/17 frame, MOV 1.715.896 byte, alpha frame 7 ~59,3% trong suốt.
```
