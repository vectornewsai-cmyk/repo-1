# Phase 9 — Đợt 101: Đóng nợ LIMITS gộp đợt 100 §4 (2 MiB, ghost jitter, re-arm burst dài-gap, blur, zombie, EPERM, harness, G1)

> Ngày: 13/11/2026. Lượt cron 06:35 +07. 9 luồng C1–C9 spawn song song; **7 luồng C2–C8 về đủ** (LIMITS + log + batch stage). **C1 (2 MiB junction probe) CHƯA XONG** — chỉ có phân tích log GST thô (`summary-c1.txt`: webKitWebSrcCreate 3236 dòng, typefind 327 dòng) + script đo, không LIMITS, không batch. **C9 (kiểm chứng độc lập) CHƯA XONG** — poll dừng 01:22Z ở 6/8 (boot 3a12a7d3, RAM 984 MB); C4 hạ cánh sau poll cuối; O8 chromium có fixture, webkit còn trống; không LIMITS, không batch, không verify log. Parent gộp 7 luồng đã xong thay C1/C9. C1 + C9 là nợ cho đợt 102. KHÔNG push. HEAD vẫn 5f548ef8.

## 1. Kết quả từng luồng

### C1 — 2 MiB junction probe: CHƯA XONG
- Chỉ có dữ liệu đo thô (`round101-c1/summary-c1.txt` + `matrix101c1.log` + `run-101c1.mjs` + watchdog): phân tích log GST (stopping download 6, high watermark 6, queue-size 12, `max 20971520` 6, `2097152` 8, Range request 10, stop_typefinding 7, find type in pull mode 1, flush-stop 5; qtdemux instances ['0']; queue-size values distinct [32, 128, 1069987, 2070341, 2111301, 2139973]; webKitWebSrcCreate 3236 dòng, typefind 327 dòng). Không LIMITS, không batch, không kết luận — nợ đợt 102.

### C2 — Ghost residual: KHÔNG LAND FIX (nợ §4 mục 4)
- **KHÔNG SỬA PRODUCTION trong luồng này** — mọi kết luận là đo + phân tích code. **Fix hiệu chuẩn pha F5 BỊ BÁC bằng counterfactual:** không có hằng số δ* nào (theo run). Mọi kết luận nhân quả chỉ đo trên Chromium.
- Log lượt riêng đã ghi (build-loop-log dòng 3840).

### C3 — Re-arm drift-gate: FIX ĐÃ LAND (nợ §4 mục 5)
- **Kết luận ngắn: FIX ĐÃ LAND (drift-gate).** Luật đuôi nay có thêm luật thứ hai độc lập với luật burst-rate B3: một lần tăng chỉ được đếm khi element **đáp trong ngưỡng drift 0,35 s** (= ngưỡng drift re-seek); đáp xa hơn thì không đếm + reset advances + rebase lastCt, y hệt burst. Offline 75/75 test (10 test mới C3-R1..R10, gồm replay g2/g5/f4/f2). Live 12 lượt WebKitGTK (gấp đôi B3): **f4-like 0/12** (sau khi loại restartEnded), **drift-gate chặn 44 lần ngoài đời**, burst-rate chặn thêm 31 lần, **đóng ADV2 với drift vượt: 6/7 lượt cũ → 0/5 lượt mới** (1 ca biên +0,363 là drift sau-đóng), grace BỊ CHẶN 11 / LỌT 0, **ARM-HELD §6 = 1/12** (gộp 3 đợt: 4/36 lượt — B3 tăng 2/6 là nhiễu mẫu nhỏ), không hồi quy (tsc 0, vite build PASS, 6 suite xanh), không seek kẹt nào.
- **Đánh đổi đo được:** tuổi đuôi trung vị tăng 1339 → 1942 ms (+45%), 2 đuôi đóng do trần 5000 ms (h4, h8 — đều vô hại); seek sửa drift bị hoãn tối đa tới trần trong chế độ burst mãn tính.
- **Rate không phân biệt được g5:** tốc độ lành tối đa ~1,2× còn g5 chỉ 1,14× — mọi ngưỡng rate chặn được g5 đều chặn oan decode lành. **Thứ phân biệt được là ĐIỂM ĐÁP:** sau lần tăng #1, drift của g2 là +1,07…+1,60 và g5 là +0,93…+1,40 — đều vượt xa ngưỡng drift re-seek 0,35 s — trong khi decode lành đáp với drift ~0.
- **CANCELLED hẹp h11-7863 là artifact, cùng họ với f3-8313:** drift (ph−ct) −0,567 due ở k−1/k, watch arm, drift về 0 ở k+2 — nhưng về 0 bằng **pause-seek của probe** (ct lùi 5,9→5,3333 = đúng ph, không resync/restart nào, đúng lúc probe dừng ở localPh ≥ 5,0). Verdict đúng là NOT-HELD + cờ [NHIỄM-PAUSE-SEEK]; số CANCELLED hẹp = 1 không phải bằng chứng máy chặn được seek thật. Phân loại hẹp càng cho thấy nó đo artifact nhiều hơn đo máy (A3 §5.1 đã kết luận).
- Log lượt riêng đã ghi (build-loop-log dòng 3849).

### C4 — Blur: D floor TRIỆT bằng pad-oldest (nợ §4 mục 6)
- **D floor TRIỆT bằng pad-oldest** (post-fix md5 `07f56792` — chr r17–r19 + wk r25–r26, pad-oldest đã land). **B-band không phải do 2 mode — chốt** (tách 1,66σ). 1 ca duy nhất trong 876 không ảnh hưởng kết luận chung.
- **KHÔNG chạy blind** (đúng nhiệm vụ C4; giữ nguyên kết luận A5 về cửa sổ mù).

### C5 — Zombie early-return: ĐÃ QUAN SÁT qua seek-across (nợ §4 mục 7)
- **Khe early-return: QUAN SÁT ĐƯỢC ngoài đời qua đường seek** (B5: 37 biên, 0 ca — nay đã thấy qua seek-across).
- R5 `mtimeChanged=true`: sibling sửa `preview.tsx` (md5 `94ee64c0` → `a6e34691`, mtime 00:07:56Z) giữa lượt R5, cùng lúc sửa `playheadHold90R2.ts` + `.test.ts`. Vite HMR hot-swap không reload trang (state100 liên tục n=294, gap max 704 ms quanh lúc sửa). Sửa rơi vào relPlay ≈61 s — SAU sự kiện check cuối cùng (60290) và sau biên cuối; 12 ca check ở R5 đều xảy ra trước sửa. R3 (build sạch, không sửa) cho cùng mẫu 12/12 độc lập → kết luận không phụ thuộc vào sửa đó. Marker A6 ×5 còn nguyên sau sửa.
- Harness mới: `apps/web/scripts/probe101c5-frame-parity.mjs` (copy probe100b5 + 3 cờ driver `--seek-across` / `--seek-near-boundary` / `--pause-burst` + ghi `driverActions` vào JSON + [rev2] log `NAVIGATION`/`PAGE-CLOSED`/`CONSOLE-ERROR` + snapshot tiến triển 5 s vào `frame-parity-progress.json` khi lỗi; `node --check` PASS cả 2 rev).

### C6 — EPERM probe #20 (nợ §4 mục 8)
- `once` ngay sau reboot #23 là **probe #20** (boot 66fb273d, exit 1 — rồi `once` ngay sau đó); **khoảng mù #19 ĐÃ ĐÓNG**. **Kết luận: giờ từng giây của reboot #16 KHÔNG chốt được** — đã thử nguồn mới; đây là kết luận "không thấy", không phải "không có". Chờ parent/user quyết.
- **Reboot #25 ~23:52:16Z trong phiên** (boot aa3f2b67 → 3a12a7d3 — ghi cho luồng EPERM đợt 101).

### C7 — G1 evidence (nợ §4 mục 2)
- **Thêm bằng chứng đo cho quyết định metric G5/M2 của user (KHÔNG TỰ ĐÓNG G1).** Không đổi metric, không tự đóng G1, không tự kết luận khung nào mới là khung đúng. Quyết định cuối thuộc parent/user (§7).
- C7: G1 chứng cứ M2 16/20 phụ thuộc khung (worker tóm tắt).

### C8 — Harness (nợ §4 mục 11, từ B7)
- **Chứng minh đường retry/fallback Space-toggle bắn thật + N10 chờ-trạng-thái chiều PHÁT.** Đường retry/fallback của N10 chiều PHÁT chưa bắn thật (44/44 toggle `"space"` — cơ chế sao đúng mẫu E1 đã chứng minh, nhưng chưa có lần cứu thật); vòng lặp fallback thứ 2 của E1 (keydown muộn lật lại sau fallback #1) chưa bắn thật (fault dọn listener nên keydown phát lại không tới); `playWaitMs` là chờ của lần thử thành công, tổng thời gian toggle fault chỉ đọc từ timestamp log (F1 ~6,2s, F2 ~11,6s).

## 2. Ghi chú gộp parent

- **C1 + C9 chưa xong (nợ thật, không phải báo cáo sai):** C1 chỉ có dữ liệu đo thô, không LIMITS/batch; C9 poll dừng 01:22Z ở 6/8 (C4 hạ cánh sau đó), O8 webkit trống. Parent KHÔNG stage phần việc dở dang; C1 + C9 là nợ cho đợt 102.
- C2 và C3 đã tự ghi log lượt riêng (dòng 3840, 3849) — parent không ghi lại trùng; mục gộp này là log hợp nhất của cả đợt.
- Worker báo "cần chờ C1 và C9 về đủ, sau đó parent gộp" — parent gộp 7 luồng đã xong ngay (tiền lệ đợt 93/98/100: gộp phần xong, nợ phần dở cho đợt sau), không chờ thêm.
- Đính chính B9 đợt 100 đã ghi trong log (dòng 3815, 3829): B9 ĐÃ XONG trong đợt 100 (ALL LANDED 22:02Z, LIMITS 22:51:17Z) — tổng sau đợt 100 là 342/2391/1443.

## 3. Kiểm chứng parent (cây đã gộp)

- tsc web 0, desktop 0; vite build PASS (6,46s); r6-i18n-check PASS (dict 2767, không đổi); P7 8/8; orphans 17/17; css60 60/60; css61 60/60.
- playheadPacing 19/19; playheadHold 75/75 (tăng từ 65 — C3 thêm test); C4 previewEngine 27/27; test-preview-engine.sh **354 assertions pass**; U4 failfast 141/141.
- Không chạy lại: C2–C8 harness đo đầy đủ (tin LIMITS từng luồng + số đo JSON trên đĩa); O8 chưa chạy lại (C9 chưa xong — nợ đợt 102).

## 4. Nợ mở cho đợt 102

1. C1 2 MiB junction probe (chỉ có dữ liệu đo thô) + C9 kiểm chứng độc lập C1–C8 + O8 cả 2 engine (chưa xong).
2. G1 đóng hay chưa — user quyết (metric G5 hay M2; C7 thêm chứng cứ M2 16/20 phụ thuộc khung).
3. 2 MiB — điểm nối chính xác (handoff typefind↔webkitwebsrc là hẹp nhất; C1 chưa kết luận).
4. Ghost residual — fix hiệu chuẩn pha F5 bị bác bằng counterfactual; cần hướng fix mới (chỉ đo trên Chromium).
5. Re-arm — drift-gate đã land (C3); tuổi đuôi trung vị +45% (1339 → 1942 ms); 2 đuôi đóng do trần 5000 ms; seek sửa drift bị hoãn tối đa tới trần trong chế độ burst mãn tính; CANCELLED hẹp h11-7863 là artifact pause-seek.
6. Blur parity — D floor đã triệt (pad-oldest); B-band không phải 2 mode (chốt); cap D r7 vẫn mở; cửa sổ mù wk giữ nguyên kết luận A5.
7. Zombie pump — khe early-return ĐÃ quan sát được qua seek-across (C5); cần fix theo hướng đó.
8. EPERM: probe #21 + khoảng mù #20 (bắt đầu sau reboot #25 ~23:52:16Z); giờ từng giây reboot #16 KHÔNG chốt được (chờ parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.
9. Birefnet-general trong gói: chỉ thử lại khi RAM đổi (quyết định parent đợt 92) — vẫn 0 lần chạy thành công.
10. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
11. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
12. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 101: 7 luồng, **19 entry / 7 file** (C2 1, C3 6, C4 5, C5 2, C6 1, C7 1, C8 3).
- Closing đợt 101: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §30).
- **Tổng chờ push sau đợt 101: 2412 entry / 350 file batch / 1455 file duy nhất** (đợt 67–100: 2391/342/1443; đợt 101: 21/8 — 19 entry luồng + closing 2 entry / +12 file duy nhất (LIMITS gộp mới + 11 file luồng mới; gap analysis đã stage từ trước. Đếm lại trực tiếp từ đĩa). HEAD vẫn 5f548ef8. KHÔNG push.
- C1 + C9 không stage (chưa xong, không LIMITS/batch).
