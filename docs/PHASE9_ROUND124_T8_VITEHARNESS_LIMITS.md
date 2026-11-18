# Đợt 124 T8 — Vite harness: sửa bền 68v2 (tự ghi config mirror) + kiểm lại 201/201 sau reboot #68

Ngày: 17/11/2026 (lượt cron 00:35 +07; làm 17:41–17:52Z). Máy đo: VM này (CPU-only, Chromium qua Xvfb).
Phạm vi: CHỈ sửa 1 harness test (`clicktest-68v2-stab-toggle-headed.mjs`) + LIMITS này. KHÔNG sửa production (`apps/web/vite.config.ts`, `media.ts`, `preview.tsx` không động), KHÔNG push, KHÔNG release/tag.
Nợ: docs/PHASE9_ROUND123_T8_VITEHARNESS_LIMITS.md §10 mục 3, ý 1 (68v2 tự ghi config mirror như 57n9).

## 0. Boot giữa các đợt — đọc trước

Lượt này chạy trên boot **#68** (boot_id `69359761…`, btime **17:34:06Z 16/11/2026**, up 7 phút lúc T8 bắt đầu 17:41Z). Boot trước #67 (btime 14:52:19Z) chỉ sống ~2h42. `/tmp` lại bị xóa ở reboot (clip `r3-auto-proxy-test.mp4` đã mất — tái tạo bằng ffmpeg testsrc2 1920x1080 5s, 3.841.283 B, đúng kích thước đợt 123 — trước khi smoke; xem §5). File trên đĩa bền (`/home/hatch`) không ảnh hưởng. apt: **0 tiến trình** (đếm bằng `pgrep -x apt`, không dùng grep-ps).

## 1. Kết luận ngắn

- **68v2 ĐÃ SỬA BỀN VỮNG (nợ đợt 123 §10 mục 3 ý 1 — ĐÃ ĐÓNG):** harness `clicktest-68v2-stab-toggle-headed.mjs` giờ **tự ghi config mirror** `/tmp/round68-v2/vite.v2.config.mjs` trước khi spawn, đúng mẫu 57n9 đợt 123 (**+7/−2 dòng**; md5 `331bb9fe…` → `5f74da1e…`, 30.551 B < ngưỡng oversize 37.768 B). Không còn phụ thuộc file config ngoài repo `hidden_files/round68-v2/vite.config.cjs`.
- **Kiểm lại 201/201 mirror còn nguyên vẹn sau reboot #68:** 25/25 file mirror L8 đợt 122 khớp `md5_after` trong `round122-t8/edit-log.json`; 57n9 khớp md5 đợt 123 (`4a2694a7…`); production không động (`vite.config.ts` `ee80d093…`, `media.ts` `2c384ed1…`, `preview.tsx` `03bf029f…` — khớp đúng số đợt 123).
- **Kiểm kê lại toàn repo: 237 file ứng viên, 0 mới, 0 mất.** Chỉ 2 hàng khác so với kiểm kê đợt 123: 57n9 (đã sửa đợt 123) và 68v2 (sửa đợt này) — cả hai đều lật sang `has_ignored=true`. **201/201 harness vite dev đã phủ mirror: 199 tự ghi + 2 thừa hưởng + 0 config ngoài repo.** Không còn harness nào phụ thuộc file ngoài repo.
- **Smoke sweep 14/14 PASS** (13 mẫu đợt 123 + 68v2 mới sửa): vite lên, HTTP 200, **0 inotify watch**, 0 ENOSPC, 0 vite mồ côi của T8 sau đo. 68v2: vite pid 14731, port 5820, lên sau 2,1 s, 0 watch, HTTP 200.
- File config ngoài repo cũ (`hidden_files/round68-v2/vite.config.cjs`, đã mirror tay đợt 123) **không sửa trong đợt này** và giờ không còn được harness nào dùng (xem §2.4) — giữ lại nguyên trạng, không xóa (tránh phá thứ khác có thể tham chiếu).

## 2. Sửa bền 68v2 — tự ghi config mirror

### 2.1 Vấn đề gốc

Harness spawn vite `-c <đường dẫn tuyệt đối tới hidden_files/round68-v2/vite.config.cjs>` và chỉ kiểm tra file tồn tại (`if (!fs.existsSync(VITE_CFG)) throw …`). File nằm ngoài repo nên không stage/push được; nếu `hidden_files` bị dọn, harness chết. Đợt 123 đã mirror tay file này (1 dòng `watch.ignored`) nhưng ghi rõ đó chỉ là sửa tạm, sửa bền là để harness tự ghi config như 57n9.

### 2.2 Thay đổi (diff vs backup, +7/−2 dòng)

Backup file gốc tại `hidden_files/round124-t8/backup/clicktest-68v2-stab-toggle-headed.mjs` (md5 `331bb9fe…`).

1. Dòng `VITE_CFG` (dòng 59): đường dẫn ngoài repo → `"/tmp/round68-v2/vite.v2.config.mjs"` (đổi đuôi `.cjs` → `.mjs` ESM, giống 57n9).
2. Thay dòng kiểm tra tồn tại (dòng 378 cũ) bằng khối tự ghi (mẫu đợt 123 57n9, +6/−1 dòng tại chỗ này):
   - 4 dòng comment giải thích (mẫu đợt 123 57n9; sao y nội dung gốc V2 + `watch.ignored`; ghi lại mỗi lần chạy vì `/tmp` mất sau reboot; không còn phụ thuộc file ngoài repo).
   - `fs.mkdirSync("/tmp/round68-v2", { recursive: true });`
   - `writeFileEpermRetry(VITE_CFG, <template>)` — dùng đúng hàm đã import sẵn trong file (dòng 46), không thêm import mới.
   - Dòng spawn `-c` giữ nguyên (dùng biến `VITE_CFG`), không đổi hành vi nào khác: vẫn đúng 1 plugin react, `hmr: false`, thêm `watch.ignored`.

### 2.3 Kiểm chứng 3 lớp (như 57n9 đợt 123)

1. `node --check` PASS.
2. Trích template từ file đã sửa (`round124-t8/verify-68v2-config.mjs` — cần `path` + `WEB_DIR` trong scope eval, bài học từ lỗi lần đầu của script này, xem §6) → config sinh ra (279 B, md5 `7bd32d22…`) → dynamic-import OK: `server={"hmr":false,"watch":{"ignored":["**/**"]}}`, đúng 1 plugin (react). Nội dung tương đương ngữ nghĩa với config gốc V2 đã mirror tay đợt 123 (`server` giống hệt, 1 plugin).
3. Smoke (§5): harness tự ghi lại `/tmp/round68-v2/vite.v2.config.mjs` rồi spawn vite lên, HTTP 200, 0 watch — tức **lần đầu tiên 68v2 chạy được mà không cần file config ngoài repo**.

### 2.4 File config ngoài repo cũ — trạng thái

`hidden_files/round68-v2/vite.config.cjs` (269 B, md5 sau mirror đợt 123 `1596c6ec…`) không đổi trong đợt này; bản sao lưu tại `round124-t8/backup/vite.config.cjs.round68-v2.mirrored123`. Grep `round68-v2/vite.config` trên `apps/web/scripts/` + `docs/`: **không còn file code nào tham chiếu tới nó** — chỉ còn nhắc tới trong các file LIMITS cũ (ghi chép lịch sử) và LIMITS đợt này. Trong harness đã sửa, `round68-v2` chỉ còn xuất hiện ở SCRATCH (profile Chrome headed) và TMPDIR, không phải config. File được giữ lại nguyên trạng (không xóa) vì nằm ngoài repo — xóa là việc dọn dẹp, không thuộc nợ đợt này.

## 3. Kiểm lại mirror 201/201 sau reboot #68

- **25/25 file mirror L8 đợt 122 khớp `md5_after`** trong `round122-t8/edit-log.json`, 0 file đổi (log chi tiết từng file: `round124-t8/mirror-verify.log`).
- **57n9 khớp md5 đợt 123** (`4a2694a7ba9cdbf46a3a3d227ff1a112`, 35.052 B) — sửa đợt 123 còn nguyên sau reboot.
- **Production không động:** `apps/web/vite.config.ts` md5 `ee80d09370b6bfb1ad86efd9a737e411`, `apps/web/src/media.ts` md5 `2c384ed13703809d5e999311147745e7`, `apps/web/src/preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b` — khớp đúng số đợt 123.
- **4 config `/tmp` đã sinh lại trong lúc smoke đều chứa mirror** (xác minh bằng `cat` trực tiếp, xem §6 về lỗi grep lần đầu): `/tmp/round57-n9/vite.n9.config.mjs`, `/tmp/round68-v2/vite.v2.config.mjs` (mới), `/tmp/round65-r8/vite.r8-presented.config.mjs`, `/tmp/round77-e1/vite.e1.headed.config.mjs` — cả 4 đều `watch: { ignored: ["**/**"] }`.

## 4. Kiểm kê lại toàn repo

Phương pháp: chạy lại `inventory.py` của T9 (copy sang `round124-t8/inventory124.py`, chỉ đổi đường dẫn output — không đổi logic), chạy 2 lần: trước sửa 68v2 và sau sửa 68v2.

| Nhóm | Đợt 123 | Đợt 124 (sau sửa 68v2) |
|---|---|---|
| File ứng viên quét được (candidate) | 237 | **237 (0 mới, 0 mất)** |
| Chứa `watch.ignored` trong source (`has_ignored`) | 199 (sau cộng tay 57n9) | **200** (199 harness + 1 file config sinh `vite.n3.config.mjs`) |
| Harness vite dev (tổng) | 201 | **201** |
| File không chạy vite dev | 35 | **35** (không đổi) |

- **Chỉ 2 hàng khác so với kiểm kê đợt 123:** 57n9 (đã lật ở đợt 123 — kiểm kê đợt 123 chạy trước khi sửa) và 68v2 (lật ở đợt này: `has_ignored` False→True, `hmr_lines` [379, 383], size 29.997→30.551). Không file nào khác đổi trạng thái.
- **Trạng thái cuối:**

| Nhóm vite dev (201) | Số | Cách phủ mirror |
|---|---|---|
| Tự ghi config mirror trong source | **199** | 198 đợt 123 (đã gồm 57n9) + 1 mới sửa (68v2) |
| Chỉ tiêu thụ config của harness khác (thừa hưởng) | 2 | 65r8-perf-overlay ← 65r8-presented; 82j3 ← 77e1-deint-fps |
| Tiêu thụ config ngoài repo | **0** | 68v2 đã tự ghi — nhóm này về 0 lần đầu |
| **Tổng phủ mirror** | **201/201** | Không còn harness vite dev nào dùng config không-mirror hay ngoài repo |

- 35 file không chạy vite dev giữ nguyên danh mục đợt 123/T9 (29 file cờ `spawns_vite` nhưng là `-pipe`/`vite preview`/lock script/launcher + 6 file không spawn vite) — cùng đúng tập file đợt 123 (0 mới/0 mất), không liệt kê lại.
- **Nợ "4 file chỉ tiêu thụ config khác" (T9 §10 mục 2) vẫn ĐÃ ĐÓNG** (đợt 123); nợ "68v2 tự ghi" (đợt 123 §10 mục 3 ý 1) **ĐÃ ĐÓNG trong đợt này**.

## 5. Kiểm chứng — smoke sweep 14/14

Driver `hidden_files/round124-t8/smoke-sweep.py` (copy từ đợt 123, chỉ đổi đường dẫn output + thêm entry 68v2; cơ chế thử HTTP **`localhost` trước rồi mới `127.0.0.1`** giữ nguyên). Chạy tuần tự trên boot #68, log từng file tại `hidden_files/round124-t8/smoke/<tag>.log`, tổng hợp `smoke-summary.json`. Clip `check-proxy-auto` cần đã tái tạo trước khi chạy (xem §0).

- **PASS: 14/14** (vite lên, HTTP 200, **0 inotify watch**, 0 ENOSPC). Vite lên sau 2,0–4,9 s mỗi file.

| # | Harness | Cổng | Vite lên sau | Watch | HTTP |
|---|---|---|---|---|---|
| 1 | c3-round13-clicktest.cjs (.cjs) | 5193 | 2,1 s | 0 | 200 |
| 2 | p5-round11-clicktest.cjs (.cjs) | 5191 | 2,1 s | 0 | 200 |
| 3 | r14-round14-clicktest.cjs (.cjs) | 5199 | 2,1 s | 0 | 200 |
| 4 | t5-round12-clicktest.cjs (.cjs) | 5192 | 2,1 s | 0 | 200 |
| 5 | v10-parity-clicktest.cjs (.cjs) | 5190 | 2,1 s | 0 | 200 |
| 6 | check-proxy-auto.mjs | 5173 | 3,2 s | 0 | 200 |
| 7 | clicktest-51h6-keyframe-panel.mjs | 5261 | 2,1 s | 0 | 200 |
| 8 | clicktest-53j5-proxy-persist.mjs | 5281 | 4,9 s | 0 | 200 |
| 9 | probe-media-clock.mjs --serve | 5173 | 2,1 s | 0 | 200 |
| 10 | clicktest-68v8-export-dest-electron.mjs | 5173 | 2,1 s | 0 | 200 |
| 11 | clicktest-57n9-timeline-core-ops.mjs | 5370 | 2,1 s | 0 | 200 |
| 12 | **clicktest-68v2-stab-toggle-headed.mjs (mới sửa)** | **5820** | **2,1 s** | **0** | **200** |
| 13 | measure-65r8-presented-fps.mjs (writer cho 65r8-overlay) | 5550 | 2,1 s | 0 | 200 |
| 14 | clicktest-77e1-deint-fps.mjs (writer cho 82j3) | 5580 | 2,2 s | 0 | 200 |

- **0 lần ENOSPC** trong toàn bộ 14 log smoke (grep toàn bộ).
- **Không process mồ côi của T8 sau đo:** 0 vite dùng config T8 còn sống (quét `/proc/*/cmdline` theo đúng 4 đường dẫn config, không dùng pkill -f).
- **Giới hạn của smoke (như T9/T8):** chỉ chứng minh vite lên qua config mirror, không chứng minh từng case đo của harness vẫn pass. Không chạy đầy đủ harness nào trong lượt này — 68v2 chỉ được smoke tới lúc vite lên (driver kill cả process group), chưa chạy lại các case H0–H7 headed.

## 6. Ghi chú môi trường + tác dụng phụ (trung thực)

- **Reboot #68 (17:34:06Z, #67 → #68):** T8 không gây ra. `/tmp` mất theo reboot như mọi lần — clip proxy đã tái tạo; các harness tự ghi config đã chứng minh ghi lại được trong smoke.
- **Lỗi verify script lần đầu:** script `verify-68v2-config.mjs` chạy lần đầu lỗi `ReferenceError: path is not defined` vì template eval cần `path` + `WEB_DIR` trong scope (đợt 123 đã định nghĩa sẵn trong script của họ, đợt này quên lúc đầu). Sửa script (thêm import + const) rồi chạy lại thì PASS đầy đủ. Không ảnh hưởng kết quả (config đã verify lại đầy đủ sau đó).
- **Lỗi grep kiểm tra lần đầu:** `grep -c "watch.ignored"` trả 0 cho cả 4 config `/tmp` dù file có mirror — vì chuỗi thật trong file là `watch: { ignored:` (không liền nhau), còn pattern grep `watch.ignored` (regex `.` = 1 ký tự) không khớp. Đã xác minh lại bằng `cat` trực tiếp: cả 4 file đều chứa mirror. Đây là lỗi câu lệnh kiểm tra, không phải lỗi config.
- **Lệnh grep tham chiếu config cũ chạy chậm rồi bị kill:** 2 lần `grep -rln` trên cả cây `apps/` (kèm `node_modules`) / nhiều thư mục lớn đều treo >60–100 s không ra output nên bị kill bằng SIGTERM (không tác dụng phụ — chỉ đọc). Làm lại hẹp (`apps/web/scripts/` + `docs/`) thì xong trong <1 s: chỉ còn nhắc tới trong các file LIMITS (ghi chép lịch sử), không còn file code nào tham chiếu (xem §2.4). Bài học: không grep đệ quy cả cây repo nữa — hẹp phạm vi + `--exclude-dir=node_modules` ngay từ đầu.
- **Disk:** 71 GB trống trên `/home/hatch` (giống đợt 122/123).
- **Không kiểm lại TTS 39; không thử birefnet; không sửa production; không push.** Không probe lại trần inotify đợt này (tránh tranh trần với các luồng khác) — số ~2.830 watch của T5 đợt 123 vẫn là chuẩn đứng.
- **Không kiểm lại headroom `/proc`:** số ~63.733 đã bị bác ở đợt 123, không trích lại.

## 7. Giới hạn — đọc trước khi trích số

1. **Headroom `/proc` không phải headroom dùng được** (đợt 123 §8 mục 1, vẫn đứng). Đừng trích "còn trống ~63.733 watch" — số đo trực tiếp (T5, 2 boot) là ~2.830.
2. **Mirror là điều kiện để chạy, không chỉ phòng ngừa** (đợt 123 §8 mục 2, vẫn đứng) — với ~2.830 watch trống, 2 vite config mặc định chạy song song sẽ ENOSPC.
3. **Smoke chỉ chứng minh vite lên** (xem §5). Các harness cũ vẫn có thể bit-rot vì fixture/API đổi. 68v2 chưa chạy lại đầy đủ các case H0–H7 sau sửa — chỉ chứng minh vite lên qua config tự ghi.
4. **Config `/tmp` không sống qua reboot.** 68v2 giờ tự ghi lại mỗi lần chạy (bền, như 57n9). 65r8-overlay/82j3 vẫn phụ thuộc harness viết chạy trước (đã ghi trong code của 65r8-overlay; 82j3 không có kiểm tra trước — nợ còn lại, xem §9).
5. **Số đo chỉ đúng trên VM này** trong giờ vòng lặp 8–10 luồng song song (load là biến số lớn nhất).
6. **Chế độ SHARED của gopHeaded47C5/48D4/49E2** (dùng vite :5173 đang chạy thì không spawn vite mirror) vẫn như đợt 122 mục 4 — không kiểm lại trong đợt này.
7. File config ngoài repo cũ của 68v2 còn tồn tại nhưng không còn được dùng; việc xóa/dọn nó chưa làm (xem §2.4).

## 8. Cách chạy lại

```bash
# Kiểm kê lại (quét toàn repo; chỉ đổi đường dẫn output so với T9):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round124-t8/inventory124.py
# Kiểm mirror L8 25/25 + production md5:
python3 - <<'EOF'
import json, hashlib, os
ROOT="/home/hatch/workspace/repo-1"
d=json.load(open("/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round122-t8/edit-log.json"))
ok=sum(1 for e in d if hashlib.md5(open(os.path.join(ROOT,e["file"]),'rb').read()).hexdigest()==e["md5_after"])
print(f"{ok}/25")
EOF
# node --check file đã sửa:
cd ~/workspace/repo-1/apps/web/scripts
node --check clicktest-68v2-stab-toggle-headed.mjs
# Trích template 68v2 -> import-check config:
node ~/workspace/goals/capcut-clone-video-editor/hidden_files/round124-t8/verify-68v2-config.mjs
# Smoke mẫu 14 (driver tự kill khi vite lên):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round124-t8/smoke-sweep.py
# Smoke 1 harness:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round124-t8/smoke-sweep.py 68v2
```

## 9. Nợ cho đợt sau

1. **ĐÃ ĐÓNG:** 68v2 tự ghi config mirror (đợt 123 §10 mục 3 ý 1). Không còn harness nào phụ thuộc file ngoài repo.
2. Còn lại từ đợt 123 §10 mục 3 ý 2: thêm kiểm tra tồn tại config cho 82j3 (như 65r8-overlay đã có) để lỗi rõ ràng hơn khi chạy trước writer sau reboot.
3. Còn lại từ T9 §10 mục 3–6 + đợt 122 §9 mục 2: khôi phục fixture cho 7 harness EXIT:2 đợt 121; WebKit headed (thiếu `libevent-2.1.so.7`); chạy đầy đủ thêm các harness fps/parity quan trọng khi có cửa sổ yên — gồm chạy lại đầy đủ 68v2 (H0–H7 headed) sau sửa lần này.
4. Theo dõi trần inotify thực (probe T5) qua các boot sau — nếu số ~2.830 giữ nguyên thì đây là trần vận hành mới, và mọi harness mới PHẢI sinh ra đã có mirror.
5. G1 vẫn MỞ chờ user quyết; ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round124-t8-viteharness.txt` — 2 file (LIMITS này + harness 68v2 đã sửa), đã verify read-back, 0 binary. **0 file > 37.768 B** (68v2: 30.551 B). File config ngoài repo cũ KHÔNG có trong batch vì nằm ngoài repo và giờ không còn được dùng. Dữ liệu thô: `hidden_files/round124-t8/` (inventory124.py + inventory.json, smoke-sweep.py, smoke/ 14 log + smoke-summary.json + smoke-sweep-full.log, verify-68v2-config.mjs, mirror-verify.log, backup/ 2 file).
