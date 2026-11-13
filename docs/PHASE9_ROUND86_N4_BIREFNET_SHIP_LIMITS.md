# Phase 9 Round 86 — N4: Birefnet-general chạy thật trong gói AppImage — LIMITS

Ngày: 11/11/2026 (lượt cron 09:35 +07). Luồng N4 đợt 86. Repo: `vectornewsai-cmyk/repo-1`, branch main.
Nhiệm vụ: nối tiếp M6 đợt 85 — lấy 1 lần chạy `birefnet-general` THÀNH CÔNG thật
trong AppImage profile `full` (K7). Trạng thái đầu lượt: 7/8 job AI đã chạy thật
trong gói; chỉ còn bgremove `birefnet-general` chưa có lần chạy thành công nào
(session mặc định của `POST /api/bgremove`, M6: SIGKILL nghi OOM-kill, bridge
fallback sang u2net, job hoàn tất bằng u2net sau 412,5s).
**KHÔNG push, KHÔNG release/tag, KHÔNG binary vào batch, KHÔNG file workflow.**

## 0. Kết luận ngắn

**Birefnet-general VẪN CHƯA chạy thành công lần nào trong gói — 0/4 lần thử
trong gói ở đợt này (cộng M6 đợt 85 và 2 lần chẩn đoán standalone: tổng cộng
6 lần chết liên tiếp với cùng 1 chữ ký).** Mọi lần đều chết vì SIGKILL trong
lúc model đang load hoặc đang predict frame đầu, bridge tự fallback sang u2net
và job vẫn hoàn tất bằng u2net (17/17 frame) — fallback hoạt động đúng thiết
kế, nhưng KHÔNG lần nào được tính là birefnet chạy được.

**Có tiến triển thật (đã đo):** sửa production tắt CPU memory arena + memory
pattern của ONNX Runtime cho session birefnet đã giảm đỉnh RSS từ **~4,74 GB
xuống ~2,62 GB (−45%)** và kéo dài thời gian sống standalone từ ~4,5–5,5 phút
lên ~6,5 phút — nhưng vẫn chưa đủ để qua được trên VM này trong giờ vòng lặp
(tải các luồng khác vọt lên 10–33, RAM khả dụng chỉ 0,6–2,5 GB lúc chết).
**7/8 job AI trong gói giữ nguyên** (chưa đóng được nợ birefnet).

AppImage dùng: `~/workspace/tmp-j8-electron/ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage`,
**556.967.608 byte, sha256 `0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c`
(verify khớp ở preflight của cả 4 attempt)** — AppImage K7, KHÔNG build lại.
Models: `~/workspace/tmp-j8-electron/ship/models/` qua `VCUT_MODELS_DIR`;
`bgremove/birefnet-general.onnx` 972.666.916 byte. rembg 2.0.87, onnxruntime 1.23.2
(trong venv bundle của gói).

## 1. Cách kiểm chứng

- Script M6 `apps/desktop/scripts/e2e-ship-services-birefnet-retry.mjs` (clip
  0,5s = 17 frame, session `birefnet-general`, quy tắc FAIL cứng nếu
  `sessionUsed != birefnet-general` hoặc có `fallbackFrom`) + script N4 mới
  `apps/desktop/scripts/e2e-ship-services-birefnet-retry-n4.mjs` (giữ nguyên
  mọi bước verify của M6: sha AppImage → Xvfb + app thật → đọc cổng bridge
  thật từ `service-manager.log` → job bgremove → verify MOV bằng ffprobe/PIL
  → report JSON + dọn sạch; khác M6 ở 2 điểm, xem §2.1).
- Sampler RAM/CPU riêng của N4 (mỗi 5s: MemAvailable, loadavg, RSS tiến trình
  `bgremove.py`, RSS tổng vcut) tại
  `~/workspace/tmp-n4-ship-e2e-birefnet/mem-sample.csv` — dùng để bắt đỉnh RSS
  thật thay vì đoán.
- Chẩn đoán standalone: chạy thẳng venv python bundle + `bgremove.py` của gói
  (không Electron) trên cùng clip 0,5s, để tách riêng "python cần bao nhiêu RAM"
  khỏi "Electron chiếm bao nhiêu".
- Clip test: `server/render/examples/media/clip1.mp4` cắt 0,5s (0,566667s,
  17 frame, 1280×720 → `--max-side` 960 → 960×540), mode `alpha`,
  `--temporal 0.4 --feather 1` (đúng tham số bridge truyền).

## 2. Diễn biến 4 attempt + 2 chẩn đoán

### 2.1 Attempt 1 — FAIL ở khởi động (KHÔNG phải lần thử birefnet)

Chạy script M6 nguyên bản qua `APPIMAGE_EXTRACT_AND_RUN=1`, 02:44:26 UTC.
Sau 120s (giới hạn chờ cổng bridge của script M6), `service-manager.log`
không xuất hiện — script kill app. Điều tra sau đó: **giải nén lạnh chỉ được
~49% sau 120s (9.367/19.034 file, 1,1/2,4 GB)** — file mới nhất trong cây giải
nén có mtime đúng lúc bị kill (02:46:27), tức giải nén vẫn đang chạy; Electron
chưa từng khởi động (vcutRSS 1–3 MB suốt cửa sổ 120s, không có userdata dir,
`app-stdout.log` chỉ có 10.368 dòng liệt kê file giải nén, không có output
Electron nào). Load lúc đó thấp (0,5–1,0), memAvail 0,7–2,0 GB. L7/M6 đã chứng
minh bước giải nén + khởi động AppImage chạy được, nên N4 không chứng minh lại:
**attempt 2 trở đi chạy thẳng AppRun đã giải nén ĐẦY ĐỦ** (19.034 file /
2,4 GB, cùng AppImage sha đã verify; script N4 kiểm chứng cây giải nén ở
preflight: `app.asar` + `vcut-server` có mặt, số file ≥ 18.000; chờ cổng
bridge nới lên 300s). Nội dung gói chạy là byte-identical — chỉ bỏ bước giải
nén lại đã được L7/M6 chứng minh.

### 2.2 Attempt 2 — in-app, CHƯA sửa (FAIL: SIGKILL)

02:53:24 UTC, load 1,38, memAvail 1,84 GB. Bridge 8787, healthy sau 9,2s
(vcutRSS ~977 MB). Tiến trình birefnet python RSS leo dần 1,3 → 1,8 → 2,2 →
2,4 → 2,8 GB (mẫu 5s), **đỉnh 4.464 MB** (sampler) / 4.571.592 KB theo `ps`
(~4,46 GB), rồi biến mất trong khoảng 02:58:17–02:59:55 (~5–6 phút tuổi).
Bridge gửi event fallback: *"Session birefnet-general thất bại (bị SIGKILL)
— tự chuyển sang u2net (nhẹ hơn)."* U2net fallback hoàn tất 17/17 frame.
Tổng job 529.589 ms (≈ 8,8 phút). Lúc chết: load 31–33, memAvail ~1,1–1,8 GB.
Report: `attempt2-e2e-report.json`.

### 2.3 Chẩn đoán standalone, CHƯA sửa (chết — tách được Electron ra khỏi nghi vấn)

03:05:46 UTC, load 17,56, memAvail 2,51 GB. Chỉ venv python + `bgremove.py`
của gói, không Electron. RSS plateau **4.743 MB**, chết ~03:10–03:11 (~4,5–5,5
phút), `.mov` 185 byte (writer vừa tạo, chưa có frame nào), không traceback.
Kết luận: **python một mình đã cần ~4,7 GB** — Electron (~1 GB) KHÔNG phải
nguyên nhân duy nhất; birefnet tự thân đã quá nặng so với RAM khả dụng của VM.

### 2.4 Sửa production — tắt ORT arena cho session birefnet

`server/bgremove/bgremove.py` (`run_once`): với session trong
`BIREFNET_SESSIONS`, tạo `ort.SessionOptions()` với
`enable_cpu_mem_arena = False` + `enable_mem_pattern = False` rồi truyền
`sess_opts=` vào `rembg.new_session` (rembg 2.0.87 nhận `sess_opts`, ort
1.23.2; `new_session` còn tôn trọng `OMP_NUM_THREADS`). Chỉ áp cho birefnet
(u2net giữ nguyên hành vi). Có log stderr
`[bgremove] birefnet low-memory: cpu_mem_arena=off, mem_pattern=off` để
quan sát. Lý do: BiRefNet luôn predict ở **1024×1024 cố định**
(`rembg/sessions/birefnet_general.py` normalize `(1024, 1024)`) nên
`--max-side` KHÔNG giảm được đỉnh RAM — chỉ có ORT options mới tác động được.
File đã sửa được đồng bộ sang cây giải nén của gói (diff khớp) để attempt 3/4
chạy đúng code đã sửa. Test nhanh sau sửa: `test_bgremove_fallback.py` 7/7,
`test_bgremove_smooth.py` 4/4, `py_compile` OK (không chạy
`test_bgremove.py` vì cần model + chạy thật — đã có các lần chạy thật thay thế).

### 2.5 Chẩn đoán standalone, ĐÃ sửa (chết muộn hơn — sửa có tác dụng thật)

03:16:55 UTC, load 4,09, memAvail 2,74 GB. RSS plateau **2.615 MB** (giảm
~45% so với 4.743 MB chưa sửa), sống tới ~6,5 phút (writer tạo 03:23,
`.mov` 185 byte), chết ~03:23–03:24 trong lúc predict frame đầu, load lúc
chết ~20, memAvail ~1,5 GB, không traceback. **Sửa giảm đỉnh và kéo dài thời
gian sống, nhưng chưa đủ:** đỉnh predict đầu vẫn vượt RAM khả dụng.

### 2.6 Attempt 3 — in-app, ĐÃ sửa (FAIL: SIGKILL, chết sớm)

03:27:02 UTC, load 2,57, memAvail 1,57 GB. Bridge healthy 5,6s. Birefnet chết
trong khoảng 03:29:30–03:29:39 (**chỉ ~2 phút tuổi**, lúc đang load model) —
sampler ghi đỉnh spike 3.746 MB (tổng gộp cả probe `python -c 'import rembg'`
của bridge chạy chồng lên lúc khởi động). Load lúc chết ~13, memAvail
~1,7–1,8 GB. U2net fallback 17/17; tổng job 204.307 ms (≈ 3,4 phút).
Report: `attempt3-e2e-report.json`.

### 2.7 Attempt 4 — in-app, ĐÃ sửa, cửa sổ yên nhất (FAIL: SIGKILL)

03:34:02 UTC, pre-launch **load 0,54, memAvail 4,32 GB** (yên nhất trong cả
lượt). Bridge healthy 5,2s. Nhờ cache ấm, birefnet tới được bước tạo writer
chỉ sau ~30s (ffmpeg writer đã chạy lúc 03:34:42) rồi chết ~1 phút tuổi trong
lúc predict frame đầu; sampler ghi đỉnh spike 3.809 MB; memAvail tụt xuống
**0,81 GB** lúc 03:34:42 (luồng khác vào việc), load lên 2,7–7,3. U2net
fallback 17/17; tổng job 152.666 ms. Report: `attempt4-e2e-report.json`.

## 3. Bằng chứng OOM (và giới hạn của bằng chứng)

- **Bridge báo rõ SIGKILL** trong cả 3 lần in-app (attempt 2/3/4): event
  fallback + `fallbackReason="session birefnet-general bị SIGKILL (nghi
  OOM-kill trên máy ít RAM)"`. Timeout bridge là 30 phút — không phải timeout.
- **Chữ ký chết giống hệt nhau 6 lần** (M6 đợt 85 + attempt 2/3/4 + 2 lần
  standalone): tiến trình biến mất đột ngột, **không traceback, không exception**
  (log chỉ dừng ở dòng khởi tạo session / writer vừa tạo), `.mov` 36–185 byte
  (chỉ header, chưa có frame), RSS trước khi chết ở mức đỉnh 2,6–4,7 GB,
  memAvail lúc chết 0,6–2,5 GB, load 6–33.
- **dmesg/journal KHÔNG đọc được trong container này** (dmesg 0 dòng,
  journalctl trống) nên **không có xác nhận cấp kernel** rằng OOM-killer là
  thủ phạm — kết luận "OOM-kill" là suy luận mạnh nhất từ chữ ký trên, không
  phải bằng chứng kernel trực tiếp. Đã ghi rõ để đợt sau không trích quá mức.
- OOM trên VM 8 GB **không phải mới**: `server/bgremove/BGREMOVE_LIMITS.md`
  §2.1 đã đo từ 19/10/2026 (cả `birefnet-general` 973 MB và
  `birefnet-general-lite` 214 MB đều bị OOM-kill) — đó là lý do quyết định đợt
  73 (u2net là fallback chính thức) vẫn đúng. Số đo mới của N4: cơ chế là
  **đỉnh RSS 4,5–4,7 GB** (chưa sửa) / **2,6–3,8 GB** (đã sửa, spike lúc
  predict đầu), trong khi RAM khả dụng của VM trong giờ vòng lặp chỉ
  0,6–5,5 GB và dao động mạnh theo tải các luồng khác.
- VM reboot 1 lần trong lượt (~03:25 UTC, uptime reset): sampler chết theo,
  đã khởi động lại; các dòng `mem-sample.csv` trước reboot bị ghi đè mất khi
  sampler khởi động lại — mọi số đỉnh đã trích ở trên đều còn trong
  report/log từng attempt, không mất số liệu kết luận.

## 4. Giới hạn — chưa làm được / chưa test (trung thực)

- **Birefnet-general: 0 lần chạy thành công trong gói** (M6 + N4 attempt 1–4 +
  2 chẩn đoán standalone). 7/8 job AI trong gói giữ nguyên; nợ Phase 10 "app
  đóng gói chưa chạy đủ services" vẫn còn đúng 1 job này.
- **Sửa arena đã stage nhưng CHƯA chứng minh được hiệu quả trong gói:**
  standalone chứng minh giảm đỉnh −45% và sống lâu hơn, nhưng cả 2 lần in-app
  sau sửa vẫn SIGKILL — sửa là cải thiện thật, không phải sửa xong là chạy được.
- **Chưa thử:** `OMP_NUM_THREADS=1` trong gói (kỳ vọng tiết kiệm thêm chỉ
  vài trăm MB, đổi lại predict chậm hơn nhiều → phơi lâu hơn dưới tải; không
  đủ lấp khoảng trống ~2–3 GB nên N4 dừng ở 4 attempt thay vì thử mò); chạy
  ngoài giờ vòng lặp khi VM thật sự yên dài (~7 phút liên tục — các cửa sổ yên
  trong lượt chỉ kéo dài 1–3 phút); máy nhiều RAM hơn.
- **Không đổi default session, không đề xuất đổi:** quyết định thuộc
  parent/user. `birefnet-general-lite` là session khác, không phải bằng chứng
  cho `birefnet-general`.
- Attempt 1 cho thấy **giải nén lạnh AppImage 557 MB mất >120s** trên VM này
  (đĩa chậm + cache lạnh sau reboot) — script M6 (chờ cổng 120s) sẽ FAIL khởi
  động trong điều kiện đó; script N4 đã nới lên 300s và có đường chạy AppRun
  đã giải nén. L7/M6 chạy được vì cache ấm.
- Không thêm i18n key nào (không tự bump test khóa số key — parent bump ở
  closing nếu cần; thực tế không có key mới). Không kiểm TTS 39.

## 5. Đề xuất tiếp theo (quyết định thuộc parent/user)

1. **Giữ sửa arena** (đã stage trong batch này): giảm đỉnh thật, không đổi
   hành vi u2net, test nhanh xanh. Cần 1 lần chạy thành công để chứng minh
   trong gói — chưa có.
2. **RAM guard (đề xuất, CHƯA làm):** trước khi chạy session birefnet, bridge
   kiểm tra RAM khả dụng; nếu < ~6 GB thì báo rõ cho user / tự chuyển u2net
   ngay thay vì để chết SIGKILL sau vài phút rồi mới fallback. Tránh trải
   nghiệm "đợi 5 phút rồi mới có kết quả u2net".
3. **Chạy lại ngoài giờ vòng lặp** (đêm/khi không còn luồng khác) hoặc trên máy
   nhiều RAM: với đỉnh ~2,6–3,8 GB (đã sửa) + Electron ~1 GB, cần ~4–5 GB RAM
   khả dụng ổn định trong ~7 phút liên tục — VM này chỉ đạt được khi không có
   luồng khác chạy cùng.
4. **Không thử thêm cùng 1 công thức trong giờ vòng lặp:** 4 attempt / 6 lần
   chết đã đủ bằng chứng; thử lại chỉ tốn lượt.

## 6. File trong batch (stage chờ push — text only)

| File | Đổi gì |
|---|---|
| `server/bgremove/bgremove.py` (sửa) | Session birefnet: `ort.SessionOptions` tắt `enable_cpu_mem_arena` + `enable_mem_pattern`, truyền `sess_opts` vào `rembg.new_session`; log stderr `birefnet low-memory`; chỉ áp cho `BIREFNET_SESSIONS`, u2net không đổi |
| `apps/desktop/scripts/e2e-ship-services-birefnet-retry-n4.mjs` (mới) | Script retry N4: như M6 nhưng chạy AppRun đã giải nén đầy đủ (preflight kiểm chứng cây 19.034 file), chờ cổng bridge 300s, mọi verify job giữ nguyên |
| `docs/PHASE9_ROUND86_N4_BIREFNET_SHIP_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: `~/workspace/tmp-n4-ship-e2e-birefnet/` (report JSON từng
attempt, console log, sampler CSV, diag log, output u2net — giữ ngoài repo để
parent đối chiếu), cây giải nén AppImage (`tmp-m6-.../tmp-run/`, 2,4 GB),
AppImage/model/venv, `__pycache__` (đã gitignore), binary, workflow.

## 7. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
# Chỉ chạy khi VM yên (load < 5, memAvail > 4 GB) — xem §5.3.
cd ~/workspace/repo-1
# In-app (qua AppRun đã giải nén đầy đủ; AppImage sha verify ở preflight):
node apps/desktop/scripts/e2e-ship-services-birefnet-retry-n4.mjs
# Kỳ vọng: BgremoveBirefnet=PASS khi đủ RAM yên ~7 phút; FAIL với fallback
# u2net khi VM tải cao (như 4 attempt của N4).
# Report + output ở ~/workspace/tmp-n4-ship-e2e-birefnet/ (đổi N4R_WORK nếu cần).
# Standalone (chẩn đoán, không qua app — chỉ để đo đỉnh RSS):
#   VCUT_MODELS_DIR=~/workspace/tmp-j8-electron/ship/models <venv python>
#   server/bgremove/bgremove.py --input <clip-0.5s> --output <out.mov>
#   --mode alpha --session birefnet-general --temporal 0.4 --feather 1
```

## 8. Tương tác với luồng khác trong đợt 86

- Chỉ sửa 1 file production (`server/bgremove/bgremove.py`) + 2 file mới
  (script + LIMITS này); KHÔNG sửa file của luồng khác.
- Lưu ý: batch của luồng N8 (`phase9-round86-n8-eperm-wiring.txt`, 534 entry)
  cũng liệt kê `apps/desktop/scripts/e2e-ship-services-birefnet-retry-n4.mjs`
  — file trên đĩa vẫn là nội dung của N4 (mtime 02:54 UTC, N8 không sửa;
  log N8 không nhắc birefnet). Tính trùng lặp khi tổng hợp: **file duy nhất
  mới của batch này là 2 file — LIMITS này + `server/bgremove/bgremove.py`**
  (bgremove.py lần đầu được stage từ sau PUSH #4; 6 lần stage trước đó đều ở
  đợt ≤ 52).
- VM reboot 1 lần trong lượt (~03:25 UTC); sóng tải các luồng khác là nguyên
  nhân trực tiếp khiến memAvail tụt (0,81 GB lúc attempt 4 chết) — các luồng
  chạy AppImage khác nên tránh chạy job AI nặng cùng lúc nếu có thể.
- Không đụng `.github/workflows/*`, không đụng TTS/Gradio, không đụng model/venv.
