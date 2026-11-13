# LIMITS gộp — Phase 9 đợt 84: đóng nợ đợt 83 §4 (9 mục, 10 luồng)

Ngày: 11/11/2026 (lượt cron 03:35 +07 → worker báo cáo 05:15 +07).
10 luồng song song L1–L10. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 84: **10/10 luồng xong + stage.** Worker đợt này TỰ GỘP một
> phần (log entry + gap analysis §13 + goal entry) nhưng KHÔNG viết
> LIMITS gộp và KHÔNG tạo closing batch — parent viết nốt (xem §1).
> Dict 2463 → **2489** (L9 +2 key, L8 +24 key). Tổng chờ push sau
> đợt 84: **1053 entry / 179 file batch / 681 file duy nhất** (đợt 67: 68/9;
> đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
> đợt 72: 53/10; đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9;
> đợt 76: 67/10; đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10;
> đợt 80: 123/11; đợt 81: 63/11 (51 + 12 muộn); đợt 82: 58/9;
> đợt 83: 44/10; đợt 84: 82/11 — xem §3). HEAD GitHub vẫn `5f548ef8`.
> KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 83 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| L1 | §4.1 K7 export UI | **HOÀN THÀNH: click-test gói thật 8/8 PASS ×2 lần (run 18 + 19), orphan-kill9-relaunch 4 lần ALL GREEN** (K7 run3/4 + L1 run18/19). K7 export UI nay PASS đầy đủ lần đầu: job done sau 22s/32s; download + đích native **484.316 byte, duration 8,000000s**; TYPED_OK ngay lần 1; K8 thoát sạch. Ship-run3 (19:27) + run4 (19:35) ALL GREEN: probe AI 8/8, smoke PASS, orphan PASS. **Ngoại lệ duy nhất:** Enter trong ô Name/location KHÔNG đóng dialog (lần 15/16: gõ xong, 15s sau panel không đổi; dialog vẫn mở trên ảnh chụp) — xem §4. | Click-test 8/8 ×2 |
| L2 | §4.2 Mitchell residual | **Phần dư sqw4 (~2,5–2,8 MAD) — ĐÃ TÌM RA CƠ CHẾ, ĐÓNG.** Không phải base-mismatch, không phải kernel, không phải gain/phase/blur tuyến tính. Cơ chế: đường plain của preview vẽ... (xem LIMITS L2 §1). MAD sau fit 1,448/1,255. Thang ~2 sạch, Mitchell thắng mọi thang. | Residual probes |
| L3 | §4.3 Deint median | **Pool 20 lần: median 0,805×, CI [0,774; 0,914], luật (b) CHƯA ĐẠT; cơ chế biến động đã tách. L3 KHÔNG TỰ ĐÓNG G1 — để parent/user quyết.** Verdict PHỤ THUỘC CHẾ ĐỘ TẢI (không phải ngẫu nhiên): tỉ lệ PASS ≥ 0,75× là 15/20 = 75% < 80% — tiêu chí tỉ lệ PASS KHÔNG đạt trên pool 20. | Pool 20 |
| L4 | §4.4 Vidstab tpad | **Thành phần hoạt động của tpad là `cache_stop` ref** — TPAD1 (pull + cache_stop + 1 frame EOF) khử hoàn toàn (0/1500, replicate K10), trong khi pull một mình (869/1500, p=0,81) và frame EOF một mình (853/1500, p=0,71) đều không khử. Bằng chứng dương cho họ (b): `copy` cũng khử hoàn toàn (0/1500). **Sửa parser showinfo** (K10 §5.8): `family.endsWith("pad")` → `family.includes("pad")`. | Per-frame 0/1500 |
| L5 | §4.5 Lineart | **Delta ĐÃ ĐỊNH VỊ ĐƯỢC — nó nằm ở khâu upscale video của đường plain, KHÔNG PHẢI Ở EFFECT CANVAS.** Effect canvas + composite MAD 0; **bt709 ĐÚNG — nợ H3 §5.2 đóng.** Baseline chỉ giải thích 10–15% delta preview trên lineart. | Effect-canvas probes |
| L6 | §4.9 EPERM watch | **Sóng EPERM TÁI PHÁT trong lượt này — KHÔNG hết hẳn.** Probe #2 dính đúng mẫu lúc 20:58Z (0 byte lặng). Helper retry đã nối vào 6 điểm. Còn 723 writeFileSync chưa nối (xem §4). | EPERM probes |
| L7 | §4.7 Ship services E2E | **Nợ mở Phase 10 "app đóng gói chưa chạy đủ services" ĐÃ ĐÓNG ở mức kiểm chứng E2E (3/3 job).** 3 job AI chạy được thật trong AppImage profile `full` (TTS/caption/bgremove). KHÔNG sửa file của L1. | E2E 3/3 |
| L8 | §4.8 TTS voice cloning | **Kho giọng lưu lại được (cosine 0,9024).** Mẫu là giọng **tổng hợp** (preset "Hải Đăng"), KHÔNG phải giọng người thật — voice cloning trên giọng người thật vẫn chưa đo. Dict +24 key (18 `tts.*` + 6 `bridgeErrors.*`). | clonedVoices 14/14 |
| L9 | §4.9 Proxy auto | **Đóng 3 khoảng trống còn lại của proxy tự động; giữ mặc định BẬT** (như R3). User tắt được bằng checkbox. Dict +2 key (`mediabin.proxyHeightLabel` + `mediabin.proxyNoOriginalFile`); `autoProxyHint`, `proxyCreateTitle`, `proxyStaleTitle` nay dùng placeholder `{height}` thay cho số 720p cứng. | proxyAuto 35/35 |
| L10 | §4.2 WebKit loop W1 | **W1 ĐÃ CHỨNG MINH ĐƯỢC ĐẦY ĐỦ trên WebKitGTK headed: 10/10 vòng × 6 clip.** Đường nối production ĐÃ CHỨNG MINH bằng counter riêng. MediaRecorder vẫn `undefined`. **Đính chính nợ K9:** WebKitGTK khởi động và chạy headed bình thường lúc đo đợt này (VM reboot trước lượt, dep apt còn đủ — 160 `.deb` trong cache) — hồi quy K9 đã hết (hoặc chỉ đúng lúc K9 đo, trước khi os-intent replay cài lại dep). | WebKit loop 10/10 × 6 |

## 1. Ghi chú parent merge

1. **Worker tự gộp một phần — parent kiểm lại + viết nốt.**
   Worker đã viết log entry gộp + gap analysis §13 + goal entry,
   nhưng KHÔNG viết LIMITS gộp và KHÔNG tạo closing batch. Parent
   viết LIMITS gộp này + closing batch (xem §3). **Đính chính số
   tổng trong log entry của worker:** entry đó nói MEMORY.md ghi
   971/168/636 nhưng "đếm trực tiếp từ file paths-loop trên đĩa
   của parent là 962/167/630" — **sai.** Đếm lại trực tiếp từ đĩa
   (đếm theo từng đợt, xem log entry đính chính kèm theo): đợt
   67–83 = **971 entry / 168 file / 636 unique** (khớp số MEMORY.md);
   con số 962/167/630 của worker thiếu đúng **1 file:
   `phase9-round83-closing.txt` (9 entry, 6 unique mới)** — worker
   đếm sót closing batch đợt 83. Tổng cuối sau đợt 84 của worker
   (1033/178/680) vẫn đúng vì worker đếm tổng cuối trực tiếp từ
   đĩa; chỉ có số base 962 là sai. Parent dùng 971/168/636 làm
   chuẩn.
2. **Snapshot test CHƯA bump — parent sửa (mẫu đợt 71/72).**
   L8 (+24 key) và L9 (+2 key) đưa dict lên 2489 nhưng KHÔNG bump
   test khóa số key: `i18nOrphans60Q4.test.ts` vẫn assert 2463 và
   KHÔNG file test nào nhắc 2489. Worker nói "r6-i18n PASS
   (2489/2489)" — đúng cho r6 (kiểm vi==en + đếm), nhưng **orphans
   + P7 + css60 §8 đều đỏ** nếu chạy nguyên trạng. Parent đã bump:
   **18 file** — 12 file assert 2463 → 2489 (ProjectMenu,
   saveToast31, structuredNotes32, reverseBadge46B6,
   reverseCompat44Z6, reversePlaybackI18n49E2,
   reverseToggleI18n48D4, i18nRound57N4, i18nAudit59P7,
   i18nOrphans60Q4, codecProbeUi75C6, i18nModals79G9) + css60 §8
   TtsButton (keys 20 → 38, call site 26 → 48 — đếm bằng đúng regex
   của checkI18n: 48 total, 38 unique; +18 key tts.* voice cloning
   của L8) + 5 file comment chuỗi thành phần (speedWarn, codecProbe-
   Debts, i18nModals80H7, i18nSweep81I9, errorDetail34Q4). Sau sửa:
   orphans 16/16, P7 8/8, css60 59/59. **Tất cả 18 file nằm trong
   closing batch.**
3. **Xung đột file chung: gộp sạch.** vi.json/en.json (L8+L9) — kiểm
   đĩa đủ key cả hai luồng (L9: `mediabin.proxyHeightLabel` +
   `mediabin.proxyNoOriginalFile`; L8: 18 `tts.*` + 6
   `bridgeErrors.*`), không mất key; dict 2489/2489, 0 mismatch.
   serviceManager.js / main.ts / package-ship.mjs (L1, tiếp K7) —
   tsc desktop **0**. Không binary, không workflow. Không batch nào
   thiếu NUL cuối (cả 10 batch L đều NUL: True).
4. **L9 test cần format esm (bẫy chạy test quen thuộc).** Lần chạy
   đầu của parent bằng CJS fail ở top-level await (dòng 179) —
   **lỗi cách chạy, không phải lỗi code**; chạy lại bằng esm:
   **35 pass, 0 fail**.
5. **Log: worker đã viết entry gộp; parent viết thêm entry đính
   chính** (số base 962 sai → 971 đúng; snapshot-bump parent fix).
   Các entry riêng của từng luồng giữ nguyên làm hồ sơ.

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 85 chưa bắt đầu, cây yên).
- vite build: **PASS** (built in 5,90s).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16** (sau parent fix §1.2).
  cssClasses60Q2: **59/59** (sau parent fix §1.2).
  cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2489).
- Suite luồng: L8 clonedVoices **14/14**; L9 proxyAuto **35/35**
  (format esm — file có top-level await).
- Chưa chạy lại: L1/L2/L3/L4/L5/L6/L7/L10 (tin LIMITS từng luồng:
  L1 click-test 8/8 ×2 + orphan 4×; L2 residual probes; L3 pool 20;
  L4 per-frame 0/1500; L5 effect-canvas probes; L6 EPERM probes;
  L7 E2E 3/3; L10 WebKit loop 10/10 × 6).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round84-l1-ship-clicktest-finish.txt` (7),
  `l2-mitchell-residual.txt` (9), `l3-deint-pool20.txt` (3),
  `l4-vidstab-tpad-component.txt` (3), `l5-lineart-effect-canvas.txt` (6),
  `l6-eperm-watch.txt` (3), `l7-ship-services-e2e.txt` (2),
  `l8-tts-voice-cloning.txt` (17), `l9-proxy-auto.txt` (7),
  `l10-webkit-loop-w1.txt` (5),
  `phase9-round84-closing.txt` (20: LIMITS gộp + gap analysis + 18 file snapshot-bump).
- Tổng đợt 84: **82 entry / 11 file**. Tổng chờ push sau đợt 84:
  **1053 entry / 179 file batch / 681 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
  đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
  đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
  đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11;
  đợt 81: 63/11 (51 + 12 muộn); đợt 82: 58/9; đợt 83: 44/10;
  đợt 84: 82/11). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 85 (§8)

1. **G1 đóng hay chưa — parent/user quyết** (L3: pool 20 median
   0,805×, CI [0,774; 0,914] trên ngưỡng, nhưng tỉ lệ PASS 15/20 =
   75% < 80%; verdict phụ thuộc chế độ tải).
2. **Deint combo + fixture 60fps** (L3: combo lần đầu; fixture
   60fps chưa đo headed).
3. **Danh tính toán tử video** (L2: phần dư sqw4 đã đóng; còn danh
   tính toán tử video + noise Δcorr thang ~2).
4. **Vidstab aliasing offset** (L4: `cache_stop` là thành phần hoạt
   động; còn aliasing offset hướng clip nhiễu seed riêng + backport
   parser showinfo).
5. **W7 restart dư** (L10: W1 đã chứng minh đầy đủ; còn W7 +1
   restart dư + W6 seek chậm).
6. **EPERM chưa hết** (L6: 723 writeFileSync còn lại chưa nối
   helper; sóng tái phát probe #2 lúc 20:58Z).
7. **Ship services** (L7: 3/3 job E2E đã đóng; còn reframe/
   translate/silence/scene + birefnet thật).
8. **Voice cloning** (L8: kho giọng lưu lại được, cosine 0,9024;
   còn mẫu giọng người thật + export/backup giọng).
9. **Proxy** (L9: 3 khoảng trống đã đóng; còn click-test headed +
   tiến trình %/hàng đợi thử lại).
10. **Enter trong ô Name/location KHÔNG đóng dialog** (L1, lần 15/16).
11. **TTS 39:** vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**
    (đã kiểm 6 lần liên tiếp không đổi; chỉ kiểm khi có tín hiệu
    stable mới).
12. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App).
13. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.
