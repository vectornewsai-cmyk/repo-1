# PHASE 9 — ĐỢT 70: LIMITS GỘP (đóng 10 nợ mở đợt 69 §4)

Ngày: 09/11/2026 (lượt cron 06:35 +07). 9 luồng X1–X9 + X10 kiểm chứng/đóng sổ.
KHÔNG push, KHÔNG release/tag. HEAD GitHub vẫn 5f548ef8 (push #4).

## §0. Bảng kết quả từng luồng

| Luồng | Nhiệm vụ (nợ đợt 69 §4) | Verdict | File đổi / stage | Kiểm chứng của luồng |
|---|---|---|---|---|
| X1 | Mục 1 — áp trilinear LOD-bias −0,5 vào production (Chrome filter) | **XONG** — `chrome-resample.mjs` dùng trilinear mọi thang; pooled MAD 0,0020 / madPeak 0,21 (s<0,5); verdict w1440: noise05 LỆCH Δcorr [0,197, 0,014, 0,024], noise10 KHỚP [0,118, 0,008, 0,026] | 3 file (script + test + LIMITS) | `chrome-resample-67u2` 8/8; tsc 0 (chạy lại TRỰC TIẾP, không pipe); vite build PASS 6,48s |
| X2 | Mục 2 — thử gate mở rộng (cửa sổ 2) kiểm chứng giả thiết A1 | **KHÔNG XÁC NHẬN A1 — GIỮ GATE 6 s CŨ.** Gate2 FAIL cả 2 phiên có số; FP 4/5 slot (80%, Wilson [38%, 96%]); time-course 6–16 s KHÔNG sụp (0,99x) trong khi cửa sổ 2 chỉ 1,00 fps → sụp draw là đặc thù thủ tục resume-từ-pause, không phải "vẽ sụp sau 6 s" | 3 file (launcher + analyzer + LIMITS); KHÔNG sửa code sản phẩm/harness | 1 phiên hoàn chỉnh exit 0 (S4, load lặng); `node --check` OK cả 2 script |
| X3 | Mục 3 — chạy lại click-test toast keyframe H (240 s) | **INCONCLUSIVE — H VẪN MỞ.** Toast không thấy trong 240 s NHƯNG harness MÙ từ +84,5 s (10 evaluate timeout liên tiếp); baseline loadavg 5,11 > 3,0; 2 lần toast H từng thấy đều rơi trong khoảng mù → "KHÔNG THẤY" không có giá trị bằng chứng | 1 file (LIMITS); chỉ sửa harness ở scratch, chưa kiểm chứng bằng run | tsc web 0; keyframe 62R4 19/19, 63R4 13/13, 64R10 11/11, 65S6 15/15, 66T6 9/9, 67U5 11/11, capThumb 2/2 |
| X4 | Mục 4 — OSV npm thử lần cuối rồi đóng nợ | **ĐÃ ĐÓNG NỢ — KHÔNG CÓ SỐ CVE npm.** OSV timeout lần 4 liên tiếp (curl exit 28, 25 s, 0 byte); `npm audit` 403 `policy_denied` lần 4 liên tiếp | 2 file (SECURITY.md §2.6 + LIMITS) | Không chạy lại 20 batch (đã chứng minh fail hết) |
| X5 | Mục 5 — đo lại birefnet sau bump + TTS gradio | **Birefnet VẪN KHÔNG CÓ SỐ fps** — 0/3 predict hoàn thành (chết exit 137 SIGKILL, RSS ~2 GB, cả lúc máy yên); TTS 39 CVE còn nguyên (gradio 6.31.0 vẫn kẹp pillow<13); bgremove 0 lỗ hổng (verify lại) | 1 file (LIMITS) | Fallback 7/7, smooth 4/4 PASS; pip-audit bgremove 0 / TTS 39 |
| X6 | Mục 6 — headed noise vẫn LỆCH-THỐNG-KÊ, tìm hướng khác | **TÌM RA NGUYÊN NHÂN: delta0.** Base chroma ước lượng 2×2 của khung nhiễu khác base derived của khung plain; sau trừ delta0, Δcorr R-G sụp 0,20 → 0,01 (w1440 noise05), ≤ 0,03 mọi ô; **4/6 KHỚP dưới trilinear** (5/6 nếu chọn mô hình tốt nhất từng cửa sổ). **Đính chính W5 §7:** verdict nhiễu trilinear của W5 trộn pha — tỉ lệ đúng 1/6 chứ không phải 1/2 | 2 file (harness `parity-66t3-compare.mjs` + LIMITS); KHÔNG sửa code production | `chrome-resample-67u2` 8/8; harness E7 chạy end-to-end exit 0, khớp đúng số |
| X7 | Mục 7 — trần keyframe 90 s vs tải nặng + đo WebKit | **GIỮ NGUYÊN trần 90 s + 1,2 ms/KiB, KHÔNG đổi code.** Ngoại suy tải nặng 105–137 s ĐÃ XÁC NHẬN bằng đo trực tiếp; nhưng trần 90 s KHÔNG BAO GIỜ là ràng buộc (công thức tối đa ở cap 64 MiB là 78,536 ms < 90 s). **WebKit ĐO ĐƯỢC LẦN ĐẦU:** VideoDecoder có ở main + worker; decode 64,0 MiB thật qua worker hết 21,5 s (0,328 ms/KiB) sau khi cài plugin GStreamer | 1 file (LIMITS) | Keyframe 19/19+13/13+11/11+15/15+9/9+11/11, capThumb 2/2; tsc web 0 |
| X8 | Mục 8 — sửa production vidstab (ép frame non-writable) + đo lại spread 1080p + SEGFAULT | **XONG — SỬA PRODUCTION.** Chèn `copy` ngay trước `vidstabtransform` trong `buildEnhancePreChain` (enhance.js). Spread: 720p/1080p/VP9 đều **0/150–0/250** với `copy` (kể cả threads mặc định); 60 s h264 + `copy` + threads1: **0/1800**, sha giống hệt. SEGFAULT: **1/20 (5%)** không `copy`, **0/18** có `copy` (n nhỏ, chưa claim chắc). Render thật 720p toggle TẮT/BẬT cho **cùng sha MP4 55dd8123…** | 3 file (enhance.js + harness + LIMITS) | `test:unit` 7/7; enhance/trfCache self-test xanh; V2 harness 11/11; tsc web 0 |
| X9 | Mục 9 — ci-security.yml + ci-build.yml vẫn 403 | **VẪN 403 — repo vẫn 0 lần chạy Actions.** HEAD remote 5f548ef8 không đổi; `contents/.github/workflows` 404; `actions/runs` total 0. `ci-local.sh` lần 2: **PASS 7 / FAIL 1 (TTS 39) / BLOCKED 3 (npm-audit 403)**; bgremove 66 → 0 (verify lần 3) | 4 file (ci-local.sh + CI_MANUAL_ADD_GUIDE.md + SECURITY.md + LIMITS); KHÔNG đưa workflow .yml vào batch | YAML parse đúng; pins khớp; `bash -n` OK |
| X10 | Kiểm chứng + đóng sổ | Xem §2 | 1 file (LIMITS gộp này, stage ở closing) | Xem §2 |

## §1. Ghi chú gộp của parent (X10)

1. **File chung duy nhất: `SECURITY.md` (X4 + X9) — KHÔNG xung đột, KHÔNG cần sửa gộp.**
   Cả hai sửa đều có mặt và nhất quán: X4 thêm khối "ĐÓNG NỢ — 09/11/2026" ở §2.6
   (dòng 93); X9 đính chính "bgremove đã sạch (66 → 0)" ở §3.5 (dòng 281–282) và
   dòng 87. Parent đã đọc trực tiếp các đoạn này — không rách, không ghi đè lẫn nhau.
   Bảng §3.5 giữ nguyên snapshot 08/11 theo đúng ý X9.
2. **Không luồng nào đụng `ExportPanel.tsx`, `render.js`, `vi.json`/`en.json`.**
   Dict i18n giữ nguyên vi == en == 2378 key lá (xác nhận lại bằng r6-i18n-check §2).
3. **Đính chính W5 §7 do X6 phát hiện (đã ghi trong LIMITS X6, nhắc lại ở đây để
   đợt sau khỏi dùng số cũ):** verdict nhiễu dưới trilinear của W5 trộn pha
   (render (0,0)-aligned vs preview canvas-aligned) — noise10 w1440 KHÔNG KHỚP
   (Δkurt R 0,45); tỉ lệ đúng là 1/6, không phải 1/2.
4. **Đính chính về SEGFAULT vidstab (X8):** giả thuyết "crash gắn với `-threads 1`"
   là SAI — crash xảy ra ở cả 2 cấu hình threads (C0 baseline 2 crash + E 1/20).
   Gợi ý `copy` ngăn luôn crash (0/18) nhưng n quá nhỏ để claim chắc.
5. **Lưu ý phương pháp đo (X1, X2, X3):** X1 lần build đầu pipe qua `tail` nên exit
   code đọc được là của `tail` — đã chạy lại tsc TRỰC TIẾP, exit 0, xác nhận lại.
   X2: 4/6 phiên gate 1 chết do sóng load của luồng khác (delta đúng bằng 2 — trạng
   thái "máy không đủ sức vẽ" điển hình, gate 1 làm đúng việc); chỉ S1 partial + S4
   hoàn chỉnh có số gate2. X3: harness mù poll từ +84,5 s — "KHÔNG THẤY toast" trong
   lượt này không phải bằng chứng vắng toast.
6. **Không có sửa gộp nào khác của parent.** Cây đã gộp = cây các luồng để lại;
   closing batch chỉ chứa LIMITS gộp này.

## §2. Kiểm chứng của parent (X10, cây đã gộp, 09/11/2026 ~09:00–09:30 +07)

Kiểm chứng sớm (giữa lượt, 06:41–06:49 +07, cây đang bị sửa dở): tsc web 0,
desktop 0; P7 8/8; orphans 16/16; css60 59/59; css61 60/60; r6 PASS; dict 2378.
Kiểm chứng cuối (cây đã gộp, X1–X9 xong):

| Kiểm chứng | Kết quả |
|---|---|
| `npx tsc --noEmit` apps/web (trực tiếp, không pipe) | **0 lỗi** (EXIT=0, log 0 byte) |
| `npx tsc --noEmit` apps/desktop (trực tiếp) | **0 lỗi** (EXIT=0, log 0 byte) |
| `npm run build` apps/web (tsc + vite build) | **PASS, built in 10,04 s** (EXIT=0; cảnh báo chunk >500 kB có sẵn từ trước) |
| i18nAudit59P7 | **8/8 pass** |
| i18nOrphans60Q4 | **16/16 pass** |
| cssClasses60Q2 | **59/59 pass** |
| cssClasses61R4 | **60/60 pass** (xanh lần thứ 2 liên tiếp) |
| r6-i18n-check | **PASS** (vi=en=2378; literal 585; key R6 458; transition 82; text anims 22) |
| chrome-resample-67u2 (X1) | **8/8 pass** (fail 0) |
| `npm run test:unit` (X8) | **7/7** (lut/effects/sticker/chroma/textfx/keyframes/mask) |
| enhance.js self-test (X8) | **pass** (assert `,copy,vidstabtransform=` cả 2 nhánh) |
| V2 stab-toggle harness (X8) | **11/11 pass** (render thật 720p BẬT/TẮT, log cờ đúng) |
| Keyframe 62R4–67U5 (X3/X7) | **19/19, 13/13, 11/11, 15/15, 9/9, 11/11 — tất cả xanh** |
| recordPackMedia61R5 | **pass** |
| X6 parity harness (rerun, R66T3_OUT=/tmp) | **EXIT=0**, tái hiện đúng số E7: noise05/noise10 chrome-rgb + chrome-trilinear KHỚP-THỐNG-KÊ, Δcorr ≤ 0,026 |
| X2 scripts `node --check` | OK (launcher + analyzer) |
| X8 harness `node --check` | OK |
| `bash -n scripts/ci-local.sh` (X9) | SYNTAX OK |

Không chạy lại toàn bộ harness đo nặng của X8 (pha A–F, ffmpeg nhiều lần) — X8 đã
chạy xong đầy đủ trong lượt; parent chạy lại V2 + test:unit + self-test là đủ để
xác nhận sửa production không phá render. Không chạy lại click-test H của X3
(máy vừa hết lượt, không đủ tiền đề yên) — H vẫn mở, xem §4 mục 1.

## §3. Batch đã stage + tổng chờ push

KHÔNG push. HEAD GitHub vẫn 5f548ef8.

| Batch | Entry | Ghi chú |
|---|---|---|
| phase9-round70-x1-chrome-trilinear.txt | 3 | |
| phase9-round70-x2-gate-window.txt | 3 | |
| phase9-round70-x3-toast-harness.txt | 1 | chỉ LIMITS |
| phase9-round70-x4-osv-npm.txt | 2 | |
| phase9-round70-x5-birefnet-tts.txt | 1 | chỉ LIMITS |
| phase9-round70-x6-sharpen-noise.txt | 2 | |
| phase9-round70-x7-keyframe-ceiling.txt | 1 | chỉ LIMITS |
| phase9-round70-x8-vidstab-fix.txt | 3 | |
| phase9-round70-x9-ci-workflows.txt | 4 | |
| phase9-round70-closing.txt | 1 | LIMITS gộp này (X10) |
| **Đợt 70** | **21 entry / 10 file batch** | |
| Đợt 67 | 68 entry / 9 file | đếm lại trực tiếp, khớp log |
| Đợt 68 | 57 entry / 9 file | đếm lại trực tiếp, khớp log |
| Đợt 69 | 33 entry / 9 file | đếm lại trực tiếp, khớp log đợt 69 (158/27) |
| **Tổng chờ push sau đợt 70** | **179 entry / 37 file batch (129 file duy nhất)** | đếm trực tiếp từng file NUL-delimited; không file nào lệch khỏi log; mọi entry tồn tại, là text, không binary, không workflow |

## §4. Nợ mở cho đợt 71

1. **Toast keyframe H vẫn mở** (X3): cần một lần chạy H headed với baseline loadavg
   ≤ ~3,0, không mù poll, toast thấy trong 75–240 s. Harness nên abort
   `INCONCLUSIVE-poll-blind` khi mù > ~60 s; chỉ chạy H khi không có luồng khác
   đang test/build nặng (kiểm tra `ps`, không chỉ tin một lần đo).
2. **Δkurt R còn lại ở w1440 (0,45–0,49) + w1920 n10 trilinear (0,42)** (X6):
   cần capture toàn bộ pixel ở headed; probe bộ lọc với nguồn VIDEO thật (U2/W5
   probe bằng ảnh/canvas; kurt R w1920 "thích" 1-kernel hơn trilinear gợi ý đường
   video có bias khác). Chưa đo verdict sau hiệu chỉnh delta0 trên nội dung tự
   nhiên (ocean/slovenska/basgo).
3. **Gate 6 s FN 3/9 (33%) vẫn chưa bắt được** (X2): nếu vẫn muốn bắt FN, đừng đo
   "phát tiếp không seek" — thủ tục đó tự làm draw đóng băng. Ứng viên: đo 2 lần
   seek-0 cách nhau 10 s, hoặc đo lại gate 1 sau 1 slot; điều tra vì sao
   resume-từ-pause làm canvas draw đứng yên trong khi presented vẫn 21 fps
   (nghi ngờ `__vcutPreviewIdle` / holdFrame sau pause).
4. **Birefnet fps vẫn chưa có số** (X5): cần máy yên/RAM lớn hơn, hoặc thử
   birefnet-general-lite, hoặc đo trên máy khác. Init 48,7–104,1 s, RSS ~2 GB,
   chết SIGKILL cả 3 lần.
5. **TTS 39 CVE còn nguyên** (X5/X9): chờ upstream — gradio gỡ kẹp pillow<13
   (6.31.0 vẫn kẹp) hoặc vieneu bỏ dep gradio.
6. **CVE npm chưa có số** (X4/X9): chỉ đóng được khi CI GitHub chạy lần đầu —
   phụ thuộc user thêm `.github/workflows/ci-security.yml` qua web (App vẫn 403
   workflows:write). Không thử lại OSV/npm audit local trừ khi egress đổi.
7. **Safari thật (macOS/iOS, VideoToolbox) vẫn chưa đo** (X7); WebKit trên VM này
   đã đo được (21,5 s / 64 MiB) nhưng không thay thế Safari thật.
8. **Toast trạng thái khi trial keyframe chạy lâu (~30 s+) chưa làm** (X7):
   cần đợt riêng đánh giá (1 keyframe = 1 lần decode() duy nhất, không có tiến
   độ thật để báo cáo — cần thiết kế khác nếu muốn).
9. **SEGFAULT vidstab** (X8): cần ~60 lần chạy không crash + stack trace mới
   claim được `copy` ngăn crash; hiện chỉ có 0/18 (gợi ý, chưa đủ n).
10. **Ngưỡng halve 0,45–0,63 vẫn chưa đo** (nợ U2 §7.1, nhắc lại X6).
11. **5 workflow vẫn chờ user thêm tay qua web** (X9, 403 từ Phase 6);
    `pip install pip-audit` trong workflow không pin version (quyết định parent).
12. **Lệch tách được 2D ở s≥0,6 (maxAbs 11–12) + điểm 2D bằng code production
    chưa đo lại; V_1D s=0,30 lệch −0,0090 (bản half-down, nhỏ, 1 thang)** (X1);
    mô hình nhiễu preview (noise05 w1440) cần đợt riêng; GPU thật chưa đo.
