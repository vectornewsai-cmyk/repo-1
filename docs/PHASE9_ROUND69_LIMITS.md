# LIMITS gộp — Phase 9 đợt 69: đóng nợ đợt 68 §4 (12 mục, 9 luồng)

Ngày: 09/11/2026 (lượt cron 03:35 +07 → worker báo cáo 05:12 +07, chưa
timeout lượt; W9 chưa đóng sổ cuối — parent gộp thay). 9 luồng song song
W1–W9. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 69: 8/9 luồng xong + stage (W1–W8); W9 chỉ kiểm chứng sớm + rà
> soát backlog, chưa đóng sổ cuối (§3–§6 của md W9 còn trống). Parent
> gộp: W3 dọn dict 2379 → 2378 key (xóa 1 key chết), css61 ĐÃ FIX,
> U8 cuối cùng đã stage (W1). Tổng chờ push sau đợt 69:
> **158 entry / 27 file batch** (đợt 67: 68/9; đợt 68: 57/9;
> đợt 69: 33/9 — xem §3). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 68 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| W1 | §4.1 V1/U8 (verify bgremove + stage U8) | **Xong.** Pipeline bgremove end-to-end PASS toàn bộ trên venv 3.12 mới (test_bgremove.py exit 0; fallback 7/7; smooth 4/4; u2net 0,37 fps, khớp baseline ~0,43). pip-audit bgremove **0** (xác nhận lại), TTS **39 không đổi** (gradio kẹp). Backup venv `.venv-py310-bak` (706M) **ĐÃ XÓA** sau khi verify PASS. OSV npm **vẫn timeout** (batch 1–2/20 fail 3/3 attempt, ReadTimeout 300s; tiến trình chết theo runtime restart). Batch U8+W1 stage (4 entry) — **U8 cuối cùng đã lên stage.** | test_bgremove exit 0; pip-audit 0/39; u2net 0,37 fps |
| W2 | §4.3 toast keyframe (click-test khi máy yên) | **N + C ĐÓNG, H vẫn mở (nợ harness).** N (clip 0,1s, tải nặng) PASS ×2 (toast +96,7s / +95,3s, đúng từng ký tự, không toast trùng). C (clip 70s, tải thấp) PASS (không toast trong 120s). H (clip 70s, tải nặng) FAIL (không toast trong 180s) nhưng probe 240s: toast THẤY ở +128,4s → **tiền đề harness sai, KHÔNG phải bug sản phẩm.** Không sửa code sản phẩm. | Suite keyframe 19/19, 13/13, 11/11, 15/15, 9/9, 11/11, 2/2; tsc 0 |
| W3 | §4.2 css61 + dọn i18n | **Xong.** (1) Xóa key chết `legacyAdopt.confirmAllBody` khỏi vi+en.json (Modal dùng `confirmAllBodyMulti` từ đợt 68 V6; key cũ không còn ai trích) — dict **2379 → 2378, vi==en**. (2) Cập nhật 11 test khóa số key 2379 → 2378 (errorDetail34Q4 chỉ có comment, không có assert — parent bump comment cho khớp). (3) **css61 ĐÃ SỬA:** bỏ `mask-check` khỏi label toggle stabilize ở ExportPanel:1503 (class chết tại đó — chỉ scoped dưới `.mask-panel`, không áp style nào; bỏ đi không đổi hiển thị). | css61 **60/60** (trước 59/60); V2 16/16; tsc 0; r6-i18n-check PASS; P7 8/8; i18nOrphans 16/16 (0 key mồ côi) |
| W4 | §4.4 cơ chế vidstab | **Xong — cơ chế ĐÃ RÕ (điều tra, không sửa code).** `vidstabtransform` kiểm tra `av_frame_is_writable(in)`: nếu writable thì warp **ngay trên buffer frame của decoder** (out = in), làm bẩn reference frame — với decode đa luồng, reference bị bẩn khác nhau mỗi lần chạy → output không xác định. Đây là lý do `-threads 1` khử được spread ở 720p (đợt 67 U1). Harness framemd5 từng frame. | M1 (PSNR) + các đo framemd5 |
| W5 | §4.5 dư pha Chrome | **Xong — ĐÃ GIẢI (mô hình, harness only).** Chrome `drawImage` "high" KHÔNG phải 2-stage mà là **trilinear mipmap với LOD bias −0,5** (`λ=log2(1/s)`, `λ*=max(0,λ−0,5)`, mix bilinear 2 mip kề; halve làm tròn nửa-xuống). Trên 18 thang đo (s=0,26–0,63): pooled MAD **0,002** (BASE 2-stage: 0,100–0,119), madPeak 0,21, \|dPeak\| mean 0,27 max 1. **Chưa nối production** (batch chỉ có LIMITS) — nợ còn lại là áp mô hình vào `chromeResampleRgb24` + đo lại. | 18 thang đo; pooled MAD 0,002 |
| W6 | §4.6 sharpen residual | **Xong — 3 phát hiện, 0 sửa code.** (1) Predictor dư direct-branch **ÂM TÍNH** (10 ứng viên, không tách được pixel/ô dư vs sạch; predictor sàn chroma thậm chí NGƯỢC tương quan trên ocean, AUC 0,16–0,24). Giữ verdict V7. (2) Scaler w1920/w2560 đo xong (chéo bil/lanczos 0,89–1,03% basgo — giải thích trọn; ocean 0,66–0,97% — giải thích ~2/3 ở w1920, ~1/5 ở w2560; phần còn lại là sàn decode). (3) Headed noise vẫn LỆCH-THỐNG-KÊ. | Full-res 4 cảnh × 2 mức; chéo scaler |
| W7 | §4.10 TTS 39 (gradio kẹp) | **Xong — KHÔNG gỡ được (upstream).** gradio mới nhất **6.31.0** (28/10/2026, y hệt lúc U8 kiểm tra) vẫn kẹp **`pillow<13.0,>=8.0`**; vieneu **3.8.3** không đổi, vẫn requires `gradio>=5.49.1`. TTS 39 CVE ở nguyên. Chỉ đọc metadata, không chạm venv TTS thật. Script kiểm tra `scripts/check-gradio-pillow-cap.py` để đợt sau chạy lại. | PyPI metadata (gradio 6.31.0, vieneu 3.8.3) |
| W8 | §4.7 gate 6s bỏ lọt suy giảm | **Xong — phân tích offline.** **CÓ, gate 6s bỏ lọt suy giảm: false-negative 3/6 slot (50%, Wilson 95%: 19–81%, n nhỏ).** Gate qua không dự báo được slot tốt (gate 45 → slot 0,69 fps tệ hơn gate 35 → slot 6,11 fps). **Đề xuất: thử nghiệm gate mở rộng (cửa sổ 2: giây 6–16, delta ≥ 20)** — thiết kế + prototype đã sẵn, chưa nối production; chỉ áp dụng sau khi đo thật xác nhận giả thiết A1. | Phân tích 6 slot V4 (không đo mới, không Chrome) |
| W9 | Kiểm chứng + đóng sổ | **Chưa đóng sổ cuối.** Kiểm chứng SỚM (03:48–04:0x): tsc web 0, desktop 0, `npm run build` PASS 18,69s, P7 8/8, i18nOrphans 16/16, captureThumb 2/2, U7 31/31, gopTrialDecode66 9/9, gopTrialDecode67 11/11, css60 59/59, css61 ĐỎ lúc đó (trước khi W3 sửa), r6-i18n-check PASS, dict 2379 lúc đó. Rà soát backlog 125 entry / 18 file — khớp đúng log đợt 68. §3–§6 của md W9 còn trống (chưa điền cuối lượt). **Parent gộp thay W9.** | Xem bảng §1 |

## 1. Ghi chú parent merge (quan trọng)

1. **W9 chưa đóng sổ — parent gộp thay.** W9 chỉ làm kiểm chứng sớm +
   rà soát backlog; các mục "điền cuối lượt" (§3–§6) còn trống, không có
   batch W9. Parent đã kiểm chứng lại độc lập (xem §2) và gộp.
2. **W3 dọn dict — đã kiểm chứng:** key chết `legacyAdopt.confirmAllBody`
   thực sự không còn ai trích (Modal dùng `confirmAllBodyMulti`; grep
   xác nhận chỉ còn trong fragment lịch sử `round67-u6.json`). Dict nay
   **2378/2378, vi==en, 0 mismatch**. 11 test khóa số key đã cập nhật
   (W3); `errorDetail34Q4.test.ts` chỉ có comment nhắc 2379 (không có
   assert) — **parent bump comment → 2378** cho khớp, vào batch closing.
3. **css61 ĐÃ FIX (W3) — parent kiểm chứng lại:** xem §2.
4. **U8 cuối cùng đã stage (W1):** requirements.txt + README.md + LIMITS
   U8 + LIMITS W1 = 4 entry. Nợ U8 còn lại: OSV npm vẫn timeout (cần
   egress policy cho POST api.osv.dev — việc của hạ tầng, không phải
   code); birefnet chưa đo lại tốc độ sau bump (W1 ghi nợ).
5. **W5 giải Chrome filter nhưng CHƯA nối production:** mô hình trilinear
   LOD-bias −0,5 chỉ nằm trong harness; `chromeResampleRgb24` trong code
   vẫn là 2-stage (ngưỡng 0,5 đã pin đợt 68 V3). Đợt sau: áp mô hình vào
   production + đo lại (xem §4).
6. **W2 H vẫn mở (nợ harness):** toast xuất hiện ở +128,4s (probe 240s)
   — harness cần kéo cửa sổ quan sát lên 240s cho clip nặng, hoặc chấp
   nhận H là "toast chậm hơn 180s dưới tải nặng" (không phải bug).
7. **Marker trong LIMITS W3 §5:** dòng cuối danh sách batch là
   `paths-loop/phase9-round53-j9-mirror-probe.txt (MARKER)` — đây là ghi
   chú cho lần push sau (file stage round53 trên đĩa đã là bản sửa, gỡ
   ci-build.yml, 7 entry), KHÔNG phải file repo, KHÔNG có trong batch
   file (batch W3 thực tế 17 entry, LIMITS ghi "18 entry" là tính cả
   marker — doc miscount, batch file mới là chuẩn). Round 53 đã push
   xong ở push #4 nên marker này không ảnh hưởng lần push tới (chỉ push
   đợt 67+).
8. **Worker handoff đợt này có 2 điểm sai (đã đính chính bằng đĩa):**
   (a) "W2 chưa có verdict" — sai, W2 có verdict đầy đủ (N+C đóng, H
   mở dạng harness); (b) "backlog 19 file" — sai, thực tế 18 file trước
   đợt 69 (W9 rà soát khớp log) và 27 file sau đợt 69 (đếm trực tiếp,
   xem §3). "125→129 entry" trong kiểm chứng giữa lượt của W9 cũng chỉ
   là trạng thái giữa chừng (lúc đó W3 chưa stage xong).
9. **Không xung đột file** giữa các luồng (ExportPanel.tsx chỉ W3 sửa
   trong đợt này). Không binary, không workflow, không dist trong batch.
10. **Môi trường:** EPERM không tái diễn trong lượt này (ghi qua
    exec/cp/node đều OK; file repo ghi bằng file-tools). Xvfb + Chrome
    headed chạy được trở lại (W2 chạy click-test headed thành công).

## 2. Kiểm chứng parent trên cây đã gộp

_(Parent chạy sau khi gộp; đợt 70 bắt đầu 06:35 — lúc kiểm chứng cây còn
yên.)_

- tsc web **0**, desktop **0** (chạy lúc đợt 70 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (W9 đã chạy `npm run build` PASS 18,69s đầu lượt;
  chỉ dict/snapshot JSON + md + 1 test fix đổi sau đó).
- P7 i18n audit: **8/8**. cssClasses60Q2: **59/59**. cssClasses61R4:
  **60/60 — XANH LẦN ĐẦU** (fix của W3 đã kiểm chứng lại: bỏ
  `mask-check` khỏi label toggle ở ExportPanel, không đổi hiển thị).
- r6-i18n-check: **PASS** (dict nay 2378).
- Suite luồng: V2 stab **16/16**, i18nOrphans **16/16** (0 key mồ côi),
  U7 **31/31**, V8 **20/20**. W9 đầu lượt cũng xanh: captureThumb 2/2,
  gopTrialDecode66 9/9, gopTrialDecode67 11/11.

## 3. Batch đã stage (KHÔNG push)

- `phase9-round69-w1-bgremove-verify.txt` (4),
  `w2-keyframe-toast.txt` (1), `w3-i18n-cleanup.txt` (17),
  `w4-vidstab-mechanism.txt` (2), `w5-chrome-phase.txt` (1),
  `w6-sharpen-residual.txt` (1), `w7-tts-gradio.txt` (2),
  `w8-gate-window.txt` (3),
  `phase9-round69-closing.txt` (2: LIMITS gộp + errorDetail34Q4 fix).
- Tổng đợt 69: **33 entry / 9 file**. Tổng chờ push sau đợt 69:
  **158 entry / 27 file batch** (đợt 67: 68/9; đợt 68: 57/9;
  đợt 69: 33/9). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.
  (U8: ĐÃ stage trong W1 — không còn file nào chờ stage riêng.)

## 4. Nợ mở cho đợt 70 (§8)

1. **Áp mô hình trilinear LOD-bias −0,5 vào production** (W5): sửa
   `chromeResampleRgb24` từ 2-stage sang trilinear mipmap (halve làm
   tròn nửa-xuống, bias −0,5) + đo lại trên 18 thang (MAD kỳ vọng
   ~0,002) + cập nhật chú thích "đã đo, pin" ở ngưỡng 0,5.
2. **Gate mở rộng (W8):** thử nghiệm cửa sổ 2 (giây 6–16, delta ≥ 20)
   — đo thật xác nhận giả thiết A1 trước khi nối production; nếu đúng,
   thay gate 6s hiện tại.
3. **Harness click-test toast (W2):** kéo cửa sổ quan sát H lên 240s
   cho clip nặng (toast +128,4s đã thấy) hoặc ghi nhận H là "toast chậm
   dưới tải nặng" và đóng nợ.
4. **OSV npm:** vẫn timeout (cần egress policy cho POST api.osv.dev) —
   việc hạ tầng; nếu không mở được, ghi rõ "không có số CVE npm" vào
   SECURITY.md và đóng nợ.
5. **Birefnet:** đo lại tốc độ sau bump (W1 ghi nợ); TTS 39 CVE ở
   nguyên (upstream gradio — kiểm tra lại mỗi đợt bằng script W7).
6. **Sharpen:** predictor direct-branch âm tính (W6) — giữ verdict V7;
   headed noise vẫn lệch-thống-kê — cần hướng khác nếu muốn khớp hẳn.
7. **Keyframe:** trần 90s đã có; tải nặng ngoại suy 105–137s vẫn vượt
   trần; Safari chưa đo được.
8. **Stabilize:** cơ chế vidstab ĐÃ RÕ (W4: in-place write bẩn reference
   frame) — cân nhắc sửa production (ép `av_frame_is_writable` false
   hoặc copy frame trước transform) + đo lại spread 1080p VP9; 1 lần
   SEGFAULT đợt 67 U1 chưa điều tra.
9. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
   web GitHub hoặc cấp quyền workflows cho App). `scripts/ci-local.sh`
   là workaround chạy local.
10. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.
