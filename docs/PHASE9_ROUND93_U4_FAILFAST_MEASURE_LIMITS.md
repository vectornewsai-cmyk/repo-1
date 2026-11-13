# Phase 9 — Đợt 93 — U4: Fail-fast — đo tiết kiệm + thứ tự lỗi + clip dài / dry-run

**Đợt:** 93 — **Luồng:** U4 — **Ngày:** 2026-11-12 (giờ +07; đo 23:40–00:09Z 11–12/11) — **VM đo:** 4 vCPU, 8 GB RAM, ffmpeg 8.1.2, Python 3.12.3, Node v24.22.1
**Nợ đóng:** LIMITS gộp đợt 92 §4 mục 4 (= T4 §4 mục 2, 3, 7) — tiết kiệm cho stabilize chưa đo số trước/sau; thứ tự lỗi đổi với spec xung đột kép sau bước 3; chưa đo clip dài / dry-run.
**Phạm vi:** CHỈ ĐO — **không sửa production** (không có file production nào đổi). Thêm 1 test đo mới + doc này.
**Kết quả tổng:** test đo mới **141/141** (lượt chạy đầy đủ, 2 lần chạy) + T4 chạy lại **32/32** + S4 **60/60** + P1 **30/30** + tsc web **0 lỗi** + vite build **pass (6,00s)**.

---

## 1. Phương pháp đo "trước" (baseline pre-T4)

Production không revert. Baseline lấy từ **bản sao tạm** `~/workspace/tmp-u4-old/server/render/` (copy toàn bộ `server/render` 11 MB + `server/eperm-retry.cjs`), chỉ khác production ở **đúng 1 dòng**: lệnh gọi cổng sớm trong `main()` (dòng 1596) đã comment — cổng chỉ còn chạy trong `buildFilterGraph` (bước 6) như trước đợt 92 T4. Đã verify bằng `diff`: ngoài 2 dòng comment giải thích, không còn khác biệt nào; `node --check` pass. Bản sao đã **xóa sau khi đo xong**; tái tạo lại bằng đúng cách trên (copy + comment 1 dòng).

Mọi render đo đều dùng `--encoder libx264` (bỏ qua GPU probe 3c — cùng điều kiện 2 bản) và `--no-trf-cache` khi có stabilize (ép vidstabdetect thật mỗi lần, khỏi cache `.trf` làm "trước" nhanh giả). Media: clip đỏ đặc 1280×720 30fps (4s từ cache `~/workspace/q4-media-cache/red.mp4`; 30s/60s sinh mới bằng ffmpeg, 47 KiB / 92 KiB). Mỗi số giây kèm loadavg lúc chạy trong `measurements.json` — số tuyệt đối nhạy tải VM (các luồng đợt 93 chạy song song, load 1,2–17,5); **bằng chứng quyết định là có/vắng mặt log pre-pass + thông điệp lỗi, không phải ngưỡng giây**. Mỗi case đo 2 lần chạy đầy đủ (lượt 1 lúc tải cao, lượt 2 lúc tải thấp) — bảng dưới ghi khoảng (min–max) của 2 lượt.

Workdir bền vững (không dùng /tmp — VM reboot xóa /tmp):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u4/work/` — chứa spec/output từng lần render, shim, `measurements.json` (37 dòng, toàn bộ lần render của lượt chạy đầy đủ).

---

## 2. (a) Tiết kiệm cho stabilize — số trước/sau (A1–A3)

| Case | Trước (OLD, pre-T4) | Sau (NEW, post-T4) | Tiết kiệm |
|---|---|---|---|
| Stabilize 4s (2 lần/bản) | 6,67 / 6,83 s (lượt 1, load 15,7) — 2,59 / 1,99 s (lượt 2, load ~2) | 1,61 / 2,59 s (lượt 1) — 0,18 / 0,19 s (lượt 2) | **~2,4 s (lúc yên) tới ~5,1 s (lúc tải)** |
| Stabilize 30s | 32,59 s (lượt 1) — 19,81 s (lượt 2) | 1,29 s — 0,41 s | **~19,4–31,3 s** |
| Stabilize 60s | 52,30 s (lượt 1) — 79,22 s (lượt 2) | 0,37 s — 1,11 s | **~51,9–78,1 s** |

Bằng chứng quyết định: ở mọi lần OLD đều có log `stabilize "c1" → ...trf` (vidstabdetect bước 3b chạy thật, `.trf` có mặt); ở mọi lần NEW đều **không** có log `.trf` nào. Exit 1 + đúng thông điệp cổng stabilize + không MP4 ở cả 2 bản.

Tiết kiệm tăng gần tuyến tính theo độ dài clip (vidstabdetect phân tích cả clip): ~0,6 s/giây clip lúc yên, ~0,9–1,3 s/giây clip dưới tải. Lưu ý phương sai: OLD 60s dao động 52–79 s giữa 2 lượt (cùng `--no-trf-cache`, cùng media) — detect trên clip đỏ đặc nhạy mức tranh chấp CPU lúc chạy; vì vậy bảng ghi khoảng, không ghi 1 con số.

### Các cổng khác, 4s (A4) — tiết kiệm ~0 như dự báo T4

| Cổng | Trước | Sau | Δ |
|---|---|---|---|
| mask keyframes | 4,52 s — 8,31 s | 0,18 s — 0,28 s | **~4,3–8,0 s** (mask anim D4 vẽ 120 frame) |
| speedKeyframes | 0,18–0,29 s | 0,19–0,24 s | ~0 |
| animations | 0,27–0,56 s | 0,23–0,41 s | ~0 (lượt 2 NEW 0,41 s chậm hơn OLD 0,27 s = nhiễu tải) |
| motion track | 0,43–0,59 s | 0,47–0,61 s | ~0 |
| transition | 0,24–0,59 s | 0,27–0,38 s | ~0 |

Khóa riêng mask keyframes: OLD có log `mask anim "…" →` + `.mkv`; NEW không có. T4 đo F1 5,1 s → 0,2–0,3 s ở lượt 92 — số lượt này (4,5–8,3 s → 0,2–0,3 s) khớp trong biên tải.

---

## 3. (b) Thứ tự lỗi với spec xung đột kép (B1–B2)

### B1 — cổng stabilize + lỗi Ở SAU cổng (vidstabdetect fail, bước 3b): thứ tự ĐỔI, có chủ ý

Lỗi bước 3b ép bằng **shim ffmpeg** (`work/ffmpeg-vidstab-fail.sh`, fault injection theo mẫu shim EPERM của T6): chặn đúng lệnh chứa `vidstabdetect`, còn lại pass-through ffmpeg thật; mỗi lần chặn ghi 1 dòng vào `shim-count.log` để đếm. Probe `-filters` không chứa chuỗi đó nên đi qua bình thường.

| Chạy | Kết quả |
|---|---|
| Control: shim + spec stabilize HỢP LỆ (không dính cổng), production | exit 1, stderr đúng lỗi bước 3b `vidstabdetect cho clip "c1" thất bại`, không thông điệp cổng, shim chặn **1 lần** — chứng minh shim kích hoạt đúng bước 3b |
| OLD (pre-T4): cổng + vidstab fail | exit 1, **lỗi vidstabdetect báo trước**, KHÔNG có thông điệp cổng, shim chặn **1 lần** (0,36–0,99 s) |
| NEW (post-T4): cổng + vidstab fail | exit 1, **thông điệp cổng stabilize báo trước**, KHÔNG có lỗi vidstabdetect, shim đếm **0 lần** — detect chưa từng chạy (0,22–0,38 s) |

Kết luận: **thứ tự lỗi đổi đúng như T4 §4 mục 3 dự báo** — trước đây lỗi bước sau (3b) báo trước vì cổng nằm ở bước 6; nay cổng (ngay sau validate) báo trước. Cùng exit 1, cùng không MP4. Đây là **đổi có chủ ý** (fail fast cấu trúc trước), không phải hồi quy. Spec chỉ 1 lỗi thì không đổi gì (control + mọi case A/C).

### B2 — cổng + lỗi Ở TRƯỚC cổng: thứ tự KHÔNG đổi (cả 3 lỗi, cả 2 bản)

| Lỗi trước-cổng | OLD | NEW |
|---|---|---|
| Version sai `9.9.9` (bước 1, isVideoSpec) | `Spec không qua kiểm tra tối thiểu`, không thông điệp cổng | như OLD (0,13–1,99 s, chênh do tải) |
| validateSpec: speedKeyframes `v=99` ngoài khoảng (bước 2) | `Spec không hợp lệ` + `.v phải trong…`, không thông điệp cổng | như OLD |
| Media thiếu `missing.mp4` (bước 3, validateMedia) | `Media không hợp lệ`, không thông điệp cổng | như OLD |

Bẫy phương pháp đã gặp và sửa (ghi để khỏi mở lại): lần đầu dùng version `"0.1.0"` — vẫn nằm trong `SUPPORTED_VERSIONS` (`"0.1.0"`/`"0.2.0"`, validate.js:56) nên spec qua được bước 1 và chết ở cổng; và dùng speedKeyframes mảng rỗng — `sanitizeKeyframeArrays` xóa field rỗng **trước** validate (render.js, đợt 50) nên validate qua và cổng vẫn chạy. Đã sửa spec (`"9.9.9"`, `v=99` — sanitize không che giá trị ngoài khoảng) và chạy lại: B2 **18/18**.

Lưu ý: lỗi font bước 4 **không kích hoạt được tự nhiên** để làm xung đột kép — `resolveFontFile` fallback lần lượt `DejaVu Sans` → `sans-serif` (validate.js:1092), fontFamily lạ vẫn resolve được. Vì vậy B1 dùng vidstabdetect-fail thay cho font-fail; xung đột kép cổng + lỗi font vẫn là nợ chưa đo (xem §6 mục 3).

---

## 4. (c) Clip dài / dry-run (C1–C2)

### C1 — clip dài 60s, mask keyframes (mask anim D4 vẽ 1800 frame)

| | Trước | Sau | Tiết kiệm |
|---|---|---|---|
| Lượt 1 | 184,59 s (load 1,36 — lúc yên) | 1,71 s (load 17,24) | ~182,9 s |
| Lượt 2 | 144,46 s (load 1,24) | 1,30 s (load 12,72) | ~143,2 s |

OLD có log `mask anim "…" →` + `.mkv`; NEW không có. Exit 1 + đúng thông điệp cổng + không MP4 cả 2 bản. Mask anim ~2,4–3,1 s/giây clip dưới tải VM này — clip càng dài, cổng sớm càng đáng giá.

### C2 — dry-run (`--dry-run`)

| Case | Trước | Sau | Kết luận |
|---|---|---|---|
| Stabilize 4s | 1,88 s — 0,98 s | 0,53 s — 0,51 s | Δ ~0,5 s = **nhiễu tải, không phải tiết kiệm** — không `.trf` ở cả 2 bản (dry-run bỏ qua detect, chỉ đặt placeholder) |
| Stabilize 60s | 1,08 s — 0,79 s | 0,82 s — 0,52 s | Δ ~0,3 s = nhiễu tải; không `.trf` cả 2 bản |
| Mask kf 4s | 11,67 s — 7,70 s | 0,70 s — 0,38 s | **Tiết kiệm ~7,3–11,0 s** — OLD có log mask anim D4, NEW không |
| Mask kf 60s | 156,13 s — 100,32 s | 0,41 s — 0,78 s | **Tiết kiệm ~99,5–155,7 s** — OLD có log mask anim D4, NEW không |

Cả 8 lần dry-run: exit 1, đúng thông điệp cổng, **không in câu lệnh ffmpeg** (chết trước khi tới bước in ở dòng ~2017), không ra MP4. Hành vi lỗi giữ nguyên; chỉ thời gian đổi — đúng như T4 §4 mục 7 suy ra từ vị trí gọi, nay đã có số đo thật: **dry-run chỉ tiết kiệm với mask keyframes** (D4 vẫn chạy trong dry-run ở bản cũ), **không tiết kiệm với stabilize** (detect đã bị bỏ qua trong dry-run từ trước).

---

## 5. Kiểm chứng

Test đo mới: `server/render/test_round93_u4_failfast_measure.js` (141 assert, `U4_SECTIONS=A1,A2,A3,A4,B1,B2,C1,C2`).

| Suite | Kết quả |
|---|---|
| Test đo mới U4 (lượt chạy đầy đủ, 2 lần) | **141/141, 0 fail** (lượt 1: 141 pass — sau khi sửa B2a/B2b; xem §3) |
| `test_round92_t4_failfast_prepass.js` (T4, chạy lại) | **32/32** |
| `test_round91_s4_fallback_warn_ext.js` (S4, chạy lại) | **60/60** |
| `test_round88_p1_mask_fallback.js` (P1, chạy lại) | **30/30** |
| `node --check` test mới + render.js (bản sao cũ) | OK |
| `tsc --noEmit` (apps/web — không đụng web, chạy lại cho chắc) | **0 lỗi** |
| `vite build` (apps/web) | **pass 6,00 s** (1 warning có sẵn về chunk > 500 kB — không phải lỗi, không do luồng này) |

Chạy từng phần trước lượt đầy đủ: A1 14/14; A2+A3+A4+B1+B2 lần đầu 73 pass / 8 fail — toàn bộ 8 fail là B2a/B2b do spec test sai (xem §3), đã sửa spec và chạy lại B2 **18/18**; C1+C2 46/46. Tổng các lần chạy riêng + lượt đầy đủ đều xanh sau khi sửa spec.

Không sửa production nên không có hồi quy nào do luồng này gây ra; các suite trên chạy lại để khóa hành vi cổng không đổi sau khi đã đo.

---

## 6. Giới hạn / nợ mở (trung thực)

1. **Số giây tuyệt đối nhạy tải VM.** Cùng một case, OLD 60s-stab dao động 52–79 s, NEW 4s-stab dao động 0,18–2,59 s giữa 2 lượt (load 1,2–17,5 do các luồng đợt 93 chạy song song). Cổng tự nó chỉ tốn ~ms; phần còn lại của thời gian NEW là khởi động Node + validate + ffprobe. Vì vậy mọi tiết kiệm trong doc này đều ghi **khoảng**, và bằng chứng quyết định là có/vắng mặt log pre-pass (`.trf` / `mask anim` / `.mkv`) + đếm shim, không phải ngưỡng giây.
2. **Chỉ đo tới 60s.** Tiết kiệm ngoại suy tuyến tính cho clip dài hơn (vidstabdetect ~0,9–1,3 s/giây clip; mask anim ~2,4–3,1 s/giây clip) — chưa đo 120s+.
3. **Xung đột kép cổng + lỗi font (bước 4) chưa đo** — `resolveFontFile` fallback DejaVu/sans-serif nên fontFamily lạ không fail được tự nhiên trên VM này; cần fault injection khác (vd shim `fc-match`) nếu muốn đo riêng. Lỗi GPU probe (3c) không bao giờ fail job (fallback libx264) nên không phải ứng viên xung đột kép.
4. **B1 dùng fault injection (shim ffmpeg)**, không phải lỗi vidstabdetect tự nhiên — shim chỉ chặn đúng lệnh detect, control run chứng minh bước 3b chạy thật khi không dính cổng; thứ tự lỗi đo được là thật (cổng vs bước 3b), nhưng một lỗi 3b tự nhiên (media decode lỗi giữa chừng…) có thể có hành vi khác ở khâu detect.
5. **Cổng vẫn throw không catch** (nợ cũ T4 §4 mục 4) — stderr có stack trace Node; không đổi trong đợt này (chỉ đo).
6. **Không đụng:** TTS 39, file workflow, `server/render/src/*`, `mask_anim.py`, `mask_png.py`, `validate.js`, `adjustment.js`, apps/web. Bản sao cũ đã xóa sau khi đo; tái tạo bằng copy `server/render` + `server/eperm-retry.cjs` rồi comment lệnh gọi cổng sớm ở `main()` (render.js:1596).

## 7. Kết luận — nợ LIMITS gộp đợt 92 §4 mục 4: ĐÓNG HOÀN TOÀN (chỉ đo, không sửa code)

- **Stabilize đã có số trước/sau:** 4s tiết kiệm ~2,4–5,1 s; 30s ~19,4–31,3 s; 60s ~51,9–78,1 s — vidstabdetect không chạy ở bản mới (khóa bằng vắng mặt log `.trf`).
- **Thứ tự lỗi xung đột kép:** lỗi SAU cổng (vidstabdetect 3b) đổi thứ tự — OLD báo lỗi 3b trước, NEW báo cổng trước, shim đếm 0 lần — **đổi có chủ ý**; lỗi TRƯỚC cổng (version/validate/media) giữ nguyên thứ tự ở cả 2 bản.
- **Clip dài / dry-run:** mask kf 60s tiết kiệm ~143–183 s (render) và ~99,5–155,7 s (dry-run); stabilize dry-run không tiết kiệm (detect đã bị bỏ qua từ trước) — hành vi lỗi giữ nguyên ở mọi case (exit 1, đúng thông điệp, không MP4, dry-run không in câu lệnh ffmpeg).

## 8. File đổi/thêm (stage, không push)

- `server/render/test_round93_u4_failfast_measure.js` (mới, 141 assert)
- `docs/PHASE9_ROUND93_U4_FAILFAST_MEASURE_LIMITS.md` (mới, file này)
- Batch stage: `phase9-round93-u4-failfast-measure.txt` (2 file text).
- Không stage: bản sao cũ `~/workspace/tmp-u4-old/` (đã xóa), workdir đo + `measurements.json` (nằm trong `hidden_files/round93-u4/work/`, không đưa vào batch push), media 30s/60s (sinh lại được bằng ffmpeg, nằm trong workdir + cache `~/workspace/q4-media-cache/`).
