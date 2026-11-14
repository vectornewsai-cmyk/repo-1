# Phase 9 — Đợt 106: Đóng nợ LIMITS gộp đợt 105 §4 (Re-arm, 2 MiB, Zombie, Blur, Ghost, Harness, EPERM) — GỘP, 8/9 LUỒNG VỀ ĐỦ (5 LATE MERGE)

> Ngày: 13/11/2026. Lượt cron 21:35 +07. 9 luồng H1–H9 spawn song song; **chỉ H5, H6, H9 về đủ đúng hạn** — reboot #33 (14:50:59Z, gap #32→#33 chỉ 19'07", phá sàn cũ 31'47") cắt ngang đúng lúc các luồng đo dài đang chạy. **H1, H2, H3, H4, H7 về muộn bằng late merge từ dữ liệu thô trên đĩa** (LIMITS + batch stage, không probe live mới); **H8 không về gì** (chỉ có poll.log 14:40Z, không có dữ liệu thô để khôi phục). KHÔNG push. HEAD a7308ee9 (sau PUSH #5).
>
> **Đính chính tổng sau đợt 105:** PUSH #5 đã đẩy 12 chunk đợt 67–105 (HEAD 5f548ef8 → a7308ee9, bỏ lại file 6.370.678 byte `benchmarks/results/webkit-blob-flaky-96x3.json`). Tổng chờ push trước đợt 106 chỉ còn file oversize đó.

## 1. Kết quả từng luồng

### H1 — Re-arm: HOÀN THÀNH MUỘN (late merge, từ dữ liệu thô)
- Watcher: 4 check, **trigger ĐẠT ở check 4** (14:42:04Z): RAM khả dụng 2.425.576 kB ≥ 2.400.000, load1 3,98 < 4,0, sibProcs 0. Các check trước: 791.924 → 1.158.252 → 2.227.524 kB.
- f6r (gop250): 3 CAP [5181, 5159, 5007] ms, 135 samples, rate 0,129, max freeze 4.866 ms. f7 (gop30): 2 CAP [5020, 5111] ms, 115 samples, rate 0,101, max freeze 7.315 ms; RAM đầu lượt f7 2.367.940 kB (< ngưỡng trigger), load1 đầu lượt 9,51.
- **Cả 2 lượt đều LOẠI, 0 lượt A/B hợp lệ → re-arm A/B RAM cao VẪN MỞ, không có số A/B mới.** Lý do loại: `preview.tsx` đổi mtime giữa cả 2 lượt (f6r 11:52:15Z → 14:42:56Z; f7 14:43:09Z → 14:43:56Z) do H5 sửa comment giữa lượt — vi phạm tiêu chí cây không đổi dù sửa chỉ là comment; verdict PASS/PASS của cả 2 lượt cũng loại theo. 5 CAP / 2 lượt = 2,50 CAP/lượt chỉ ghi nhận, không so với baseline f1–f5 2,80 (khác cây + đều loại).
- Tính lại độc lập khớp 100% headline H9 đã cứu + `cap-pattern-rows.json`. Batch: 1 entry (LIMITS-only).

### H2 — 2 MiB: HOÀN THÀNH MUỘN (late merge, từ dữ liệu thô)
- **3/3 run H2Q lỗi cùng chỗ:** `page.evaluate: Target page, context or browser has been closed` (14:48:06–14:48:11Z), chưa tới bước media nào. Pull log mỗi run chỉ 10 dòng `F2PROBE start`, **vắng `WebKitWebProcess`** (đối chiếu run F2 thành công: WebProcess + 176 PULL / 146 APUSH / 1782 ATAKE). Pipeline media chưa từng tồn tại. Nguyên nhân browser chết: **không xác định được** (không crash/OOM log; RAM lúc đầu còn 2,82 GB). Reboot #33 xảy ra sau H2 ~2'48" nên không phải nguyên nhân H2 chết — chỉ cắt việc viết LIMITS/batch.
- **Đính chính quan trọng so với headline H9:** 3 file GST log **0 byte**, dot/ rỗng, 0 PULL/PUSH — phép thử hiện diện queue2 chưa từng chạy trên pad thật nào. "0 chuỗi queue2 trong GST log" đúng về đếm nhưng **vô nghĩa về chứng cứ** (log rỗng thì grep ra 0 là tất yếu). Kết luận: **không có bằng chứng queue2 theo hướng nào**; trạng thái 2 MiB không đổi so với G6 (queue2.max-size-bytes = 2097152 vẫn chỉ là ứng viên chưa chứng minh).
- Adapter probe: code đúng thiết kế (diff với f2 chỉ 2 đổi đã ghi; `.so` build 14:45:55, load thành công). **H2EXT/H2C8 không chạy; mitigation `.mp4` chưa đo.** Batch: 5 entry (adapter probe .c + probe + analyzer + JSON + LIMITS).

### H3 — Zombie: HOÀN THÀNH MUỘN (late merge, từ dữ liệu thô)
- **y1 seek-across: 23/23 seek bắn đủ** (driver đã sửa; F4 chỉ bắn 2/23). Zombie Δ = **0 ở 12/12 biên** đo được; 11 biên lẻ→chẵn không đo được (clip lẻ không có dbg/pump — giới hạn phương pháp). Capture trong cửa sổ clip lẻ: **0/12** (gộp G2: 0/36).
- **Kill latency trực tiếp (E4b), lần đầu đo được: n=12, min 0,10 / median 0,20 / max 1,00 / mean 0,27 ms** — CHỈ seek lẻ, chỉ clip blur. Mẫu lệch đã giải thích: JSON chỉ có đúng 12 kill entry, toàn clip chẵn (có pump); seek chẵn kill clip lẻ (không blur, không pump) nên không có entry. Kill clip không-blur là **không đo được**, không phải 0.
- **Gate (b) VẪN CHƯA QUAN SÁT ĐƯỢC** (lượt thứ 5 liên tiếp). Test draws-gap thật trên dữ liệu y1 (phân tích gốc không có): 4 gap >300 ms (max 473 ms), 0 gap có gate-(b) skips + playhead chạy tự do bền vững (gap dph=1,30 là mẫu "nhảy 1 bước + plateau" đã bị G2 loại). gstd D = 0/787; E4a tick stale 0/11.
- **Confound build identity:** y1 ghi trước chạy md5 `e5e1d292…` (14:42:56Z), file đổi 14:43:56Z → `ced42efd…` (H5 sửa comment); `e5e1d292…` không khớp land `f0b9e496…` — chuỗi đổi không khôi phục được (repo local không có .git). Số y1 ghi nhận kèm caveat "đo trên cây đổi giữa lượt".
- **Đính chính giờ y2:** log tới 14:51:28Z nhưng reboot 14:50:59Z — đồng hồ boot cũ nhanh ~29 s (cùng hiện tượng H6 đính chính cho reboot #29). y2 pause-burst: 0 dữ liệu dùng được. Batch: 2 entry (LIMITS + probe đã sửa).

### H4 — Blur: HOÀN THÀNH MUỘN (late merge, từ dữ liệu thô)
- **B-band c0 — VẪN MỞ, KHÔNG ĐẠT bar.** Tính lại độc lập khớp 100% headline H9: 4 lượt xong r39/r39c0/r40c0/r40; gộp F6+G7+H4: **c0 5/72 (6,9%) vs c2 2/54 (3,7%), Fisher một phía p=0,3545** (hai phía p=0,6978), tệ đi so với G7 (p=0,22). Còn thiếu **c0 43 / c2 61 B-cap** tới ~115/nhóm. Hiệu số +3,2pp, 95% CI Newcombe [−6,4pp, +12,0pp]; power tại hiệu ứng gốc 59% (normal-approx) / 53% (Fisher-exact, mô phỏng 20.000 lần), tại hiệu ứng quan sát chỉ 18%.
- Cờ heterogeneity hết ý nghĩa: c0-only vs c0 3-clip gộp G7+H4: 4/39 vs 1/33, p=0,3662 — 2 thiết kế vẫn gộp được.
- **D floor: 0/2371** (p=4,32e-12 vs pre-fix; CI trên 0,127%).
- **Cụm A stripes — vẫn mở, KHÔNG ĐO ĐƯỢC bằng strip:** feasibility FAIL (second-nearest MAD med 0,00; 90/90 frame < 30, bar ≥30; 968 cặp MAD<1) → bar (a)/(b) prereg không áp được; giả thuyết E6 chưa chứng minh/bác. Weights không giải thích được g≈0,44: w ≈ [1/3,1/3,1/3] mọi filter nhưng fit yếu (R² med ≤0,156); tách riêng 43 triple thuần: g_live 0,625 vs dự đoán 0,596 (lệch +0,029).
- r41c0 LOẠI (chết do reboot #33, không có results) — không chạy bù. Lượt r39 "lai build" (H5 sửa comment giữa lượt) vẫn gộp theo prereg vì F3 tắt. Batch: 2 entry (probe + LIMITS).

### H5 — Ghost: HOÀN THÀNH (về đúng hạn)
- **Sửa comment sai số (a):** 6 chỗ trong `apps/web/src/preview.tsx` ghi "0/30 clean" nay ghi "rawAnchor 70,4% ≈ frameIdx 70,0% (mọi occurrence), không lợi ích" + ghi rõ số cũ là artifact dedup. md5 `f0b9e496…` → `ced42efd…`; marker 104f3 vẫn 50 dòng/58 lần; 0 dòng code dùng rawAnchor. Đây là **file production duy nhất đổi đợt này**.
- **Analyzer distinct đã sửa (c) — bias HẾT.** Dedup theo `(label, pix, labelSrc)` + kèm phép đếm mọi occurrence. Chạy lại dữ liệu cũ: rawAnchor distinct B 0/11 → **20/31 = 64,5%**, B2 0/6 → **14/20 = 70,0%**, flip C 0/13 → **32/47 = 68,1%** — khớp mọi occurrence. Headline chỉ nhích nhẹ: B 70,8→73,0%, B2 76,1→79,6%, B3 87,2→86,6%, A 45,7% không đổi, flip C 73,6→79,2%, D 48,6% không đổi. Thứ hạng + kết luận bar G1 không đổi. Phép đếm mọi occurrence mới tái tạo chính xác số G1 trên cả 6 run cũ. Phát hiện thêm: vòng lặp labelSrc của flip analyzer vốn thiếu hẳn `"rawAnchor"` — đã thêm.
- **Flip-leg trên cây land (b) — KHÔNG ĐẠT bar dưới tải nặng.** C2 **68,5%** (100/146), lặp lại C2b **63,0%** (97/154), gộp 65,7%; bar là ≥70% và ≥ D+20pt (68,6%). Gap presented−expected vẫn 100% |≤3| cả hai run. Nguyên nhân là tải, không phải code land: độ phủ anchor tươi 92,4% (C) → 83,2%/82,4% (tickCost trung vị 14,1/13,4 ms vs 6,7 ms; rAF gap 32/30 ms vs 18 ms; load1 ~5–6,5 do luồng đợt 106 khác). Suy luận chặn dưới G1 §4.3 không bị bác — verdict flip-leg là **phụ thuộc tải**. Land F8 không bị lật; nợ mở: đo lại flip lúc máy yên.
- **Độ phủ → clean (d):** gradient mới 82,4%→63,0%; 83,2%→68,5%; 92,4%→79,2%; 94,6%→73,0%; 98,2%→79,6%; 99,1%→86,6%.
- Spread (e): đuôi lỏng max ~75 vẫn mở (C2b 75,4; C2 47,5 là 1 run, không kết luận). F6' WebKit không làm (không có driver ghost).
- Hồi quy xanh trên cây đã sửa comment: tsc 0, vite build PASS (12,43 s), ghostBlend 15/15, previewEngine 27/27. Batch: 4 entry (preview.tsx + 2 analyzer mới + LIMITS).

### H6 — Harness: HOÀN THÀNH (về đúng hạn)
- **Điều tra G4 flake — 0/7 mẫu mới, cơ chế vẫn chưa biết.** Harness E1 đã thêm log chẩn đoán (chỉ thêm log, `node --check` PASS): `setEnhCheckbox` ghi BẤM/KHÔNG-bấm + snapshot hook; khối G4 ghi snapshot enhance/hook/idle sau patchClip, sau setEnhCheckbox, sau setPlayhead + poll waitIdle ghi mọi lần đổi trạng thái.
- E1 run4–10 (tiếp F8): **7/7 lần 10/10 PASS, 0 flake**; G3→G4 1,72–2,33 s (trung vị 2,22 s), G4 tap=true, R=0,51 cả 7; G5 PASS chắc (run6 2 vòng, combined 0,93). N10 ×2: 4/4 (1,00×/0,91×).
- Tỉ lệ gộp **2/28 = 7,1% (Wilson 95% ~2–23%)**, nhưng 0/7 **không bác được tỉ lệ cũ** vì 7 lần mới chạy máy yên/tải nhẹ (load 1,1–5,0), trong khi 2 ca cũ đều tải nặng (load 15–19); xác suất 0/7 khi tỉ lệ thật 1/10 là ~48%.
- Probe đã đo được ngân sách đường khỏe: sau patchClip enhance=`null` + hook false; sau checkbox BẤM store=`{"deinterlace":true}` + hook tap=true trong ~1,1–1,4 s; waitIdle 0–0,51 s. Ca flake 11,5 s thừa ~9 s — lần flake tới probe sẽ chỉ ra thừa ở bước nào. Checkbox: 143 BẤM / 1 KHÔNG-bấm (đúng, run6 G5 vòng 2 slot 0) / 0 cảnh báo hook.
- **Keydown chậm gộp: 49 lần / 671 slot / 1342 toggle, max 1004 ms (kỷ lục cũ giữ), 0 retry/fallback/abort — vẫn mở.** Mới thêm 9 lần/110 slot/220 toggle, max 213 ms.
- **Đính chính giờ reboot #29 trong LIMITS G3 — đã sửa.** Giờ đúng **08:56:39Z**; khoảng 08:57:06–08:58:12Z của G3 sai do đồng hồ boot cũ chạy nhanh ~25–27 s.
- Reboot giữa chừng: lần chạy đầu chết sau 41 s do reboot **14:50:59Z** (boot `75697729` → `63a52041`); gap **19'07" — phá sàn cũ 31'47"**; chạy lại xong 15:10:14Z, không mất dữ liệu đo nào.
- Lỗi của chính H6 (trung thực): `summ_e1` trong `run-h6.sh` lỗi `IndexError` ×7 → 7 dòng tóm tắt E1 thiếu trong `run-h6.log`; đã khôi phục đủ từ report JSON. Batch: 3 entry (harness + LIMITS G3 đã sửa + LIMITS H6 mới).

### H7 — EPERM: HOÀN THÀNH MUỘN (late merge, từ dữ liệu thô)
- **Probe #25 (checklist P8 §2.3, ĐÚNG 1 lần):** status 14:39:40Z DEAD/STALE (age 10.878 s, last #24 11:38:22Z, boot 3e4f237a) → once 14:39:40Z **boot=75697729, ok=2 fail=0**, exit 0 → status ALIVE (age 5 s, n=25). Log probe 64 → 67 dòng (+3 đúng checklist).
- **Reboot #32 = 14:31:52Z** (chốt từng giây, đo trực tiếp 2 lần + H9 xác minh độc lập). **Reboot #33 = 14:50:59Z** — chính #33 đã cắt ngang H7 gốc trước khi viết LIMITS/batch. **Gap #32→#33 chỉ 19'07" — SÀN MỚI, ngắn nhất từng ghi** (phá 31'47").
- **Mù #24 (11:38:22Z→14:39:40Z, 3h01'18") — KHÔNG ĐÓNG HOÀN TOÀN (kết luận mới quan trọng nhất):** lỗ không-bản-ghi **2h03'11"** (12:28:41Z→14:31:52Z) trong cả hai cây giám sát + dist + chrome-userdata + /tmp; 47 file ngoài hai cây đều là ghi rời rạc runtime/main-agent (snapshot, reconciliation, chunk PUSH #5), không loại trừ được reboot; khoảng trống không-ghi dài nhất 56'43" vẫn > 2×sàn mới (38'14"). Trong mù: ít nhất 1 reboot (#32), có thể nhiều hơn — không xác định được. **Hệ quả: số thứ tự #32/#33 là TẠM THỜI** (dịch +k nếu lỗ chứa k reboot ẩn). Không thể đóng hồi tố bằng probe tương lai — probe #26 chỉ đóng mù #25.
- **Hệ quả sàn mới:** mù #23 vẫn đóng hoàn toàn (17'37" và 31'47" đều < 38'14"); mù #22 vẫn đóng trên hoạt động nhưng cửa sổ hình thức mở rộng [05:45:25Z, 06:37:37Z] — kiểm lại: 520 bản ghi, khoảng trống tối đa 78 s, cửa sổ lý thuyết nay **≤78 s** (trước ≤30 s). **Không tự quyết** mù #22/#21/reboot #16 — để parent/user quyết.
- **Sóng EPERM:** 0 thật trong 58 *.log có mtime trong mù #24; 2 dòng "đã tắt" (G9 O8) là dương tính giả đã biết; sóng gần nhất vẫn ~11:55–12:11Z 11/11 (~50h28' trước probe #25). EPERM không tuyên bố hết.
- **Quét writeFileSync:** NEWSTD **154 file / 494 dòng**, R7B 171/519, COPIES 17/25; **chênh 0 lần thứ 12 liên tiếp** (494+25=519); tổng 3 bảng 1.038 dòng. +22/+6 vs G8, giải thích đúng hết bằng diff; 0 file biến mất. Async `.writeFile(` vẫn đúng 2 vị trí trong helper retry đã biết, 0 stray.
- RAM: 850.592/798.288 kB; max trong mù #24 là 1.326 MB (21,6% guard) — birefnet 0 lần, không chạy. **Dự báo #34: ~16:51:58Z**, dải 15:10:06Z–18:05:07Z (trung bình 33 lần ≈ 2h01'/lần; dự báo điểm kém tin cậy). Batch: 1 entry (LIMITS).

### H8 — Kiểm chứng chéo: KHÔNG VỀ
- Chỉ có poll.log 14:40Z, không có dữ liệu thô, không LIMITS, không batch. Vai trò kiểm chứng chéo được H9 bao phủ một phần (đối chiếu headline H5/H6 + cứu số H1–H4/H7 từ dữ liệu gốc).

### H9 — Verify: HOÀN THÀNH (về đúng hạn)
- **Về đủ: 2/8** (H5, H6) lúc poll cuối; H1/H2/H3/H4/H7 có dữ liệu thô trên đĩa (đã kiểm đĩa trước khi kết luận thiếu), H8 không có gì. Poll 9 vòng 14:40–16:12Z + kiểm đĩa 16:13Z. Reboot #33 SIGTERM poller H9 lần 1 (đã khởi động lại).
- **Cây gộp XANH** (đóng băng 16:16:21Z, `preview.tsx` ced42efd, boot 63a52041): tsc web 0, desktop 0; vite build PASS 8,74 s; **27/27 mục suite exit 0 ngay lần đầu**, 0 dòng "not ok" (Hold 75/75, Pacing 19/19, previewEngine 18+27, seek 21/21, seekSkip 9/9, previewLoop 20/20, ghostBlend 15/15, rvfcClipWindow 13+21, driftConfirm 12/12, css60/61 60/60, P7 8/8, orphans 17/17, r6 dict 2767, U4 141/141, media 25+2+7, retry 7/7, watchdog 9/9, deint 17/17, deint-100b7 13/13, armHeld 16/16, vite-regex 9/9, xvfb-lock PASS, test-preview-engine.sh 354 assertions).
- **O8 21/21 cả 2 engine** (chr S5 Δx=0,112, S7 0,112/0,113; wk S5 0,194, S7 0,194/0,197 — khớp từng chữ với G9; E0 0 lỗi). Lưu ý: Chromium lần 1 exit=2 do H9 quên copy fixture — lỗi setup của H9, chạy lại 21/21 ngay, đã ghi vào LIMITS §3.5.
- **Đối chiếu headline H5/H6 KHỚP toàn bộ** (tính lại Fisher/Wilson + chạy lại analyzer: H5 flip C2 100/146 = 68,5%, C2b 97/154 = 63,0%; H6 flake gộp 2/28 = 7,1%, Wilson [2,0%–22,6%]; keydown gộp 49/671/1342/max 1004 ms).
- **Dữ liệu thô cứu được (H9 tự tính lại, các luồng late merge sau đó tính lại độc lập và khớp):** H4 B-band p=0,3545, D floor 0/2371; H3 y1 23/23 seek + kill latency median 0,20 ms; H1 trigger RAM hợp lệ nhưng 2 lượt đều loại; H7 probe #25 ok=2 fail=0; H2 3/3 run lỗi, 0 chuỗi "queue2" trong GST log — **H2 late merge sau đó đính chính: log GST 0 byte nên "0 queue2" vô nghĩa về chứng cứ**.
- Batch: 1 entry (LIMITS). Tổng chờ push H9 đếm lúc đó: 390/2500/1528 (đợt 67–106, trước late merge).

## 2. Ghi chú gộp parent

- **Reboot #33 phá sàn:** gap #32→#33 chỉ 19'07" (trước đó sàn 31'47"). Đây là nguyên nhân trực tiếp khiến 5/8 luồng không về đúng hạn. Bài học: luồng đo dài phải chia lượt nhỏ + lưu sớm + viết LIMITS/batch ngay khi có số, đừng đợi cuối lượt. Boot hiện tại 63a52041 (14:50:59Z), ổn định tới lúc gộp (16:38Z, ~1h47').
- **Late merge hoạt động:** 5/5 luồng muộn về đủ bằng dữ liệu thô; mọi headline H9 cứu được đều được tính lại độc lập và khớp 100% (trừ đính chính H2 về "0 queue2"). H8 là luồng duy nhất mất trắng.
- **Confound chung đợt này — H5 sửa `preview.tsx` giữa lượt:** H1 (2 lượt f6r/f7) và H3 (y1) đều đo trên cây đổi giữa lượt; H4 r39 "lai build" vẫn gộp theo prereg vì F3 tắt. Đợt sau: **đóng băng preview.tsx trước khi probe chạy**; luồng sửa production phải báo trước cho các luồng đo.
- **Đồng hồ boot cũ chạy nhanh:** H3 y2 ~29 s, H6 đính chính #29 ~25–27 s — hiện tượng đã biết, cần chốt giờ bằng `uptime -s` trực tiếp.
- **Mù #22 / G1 — vẫn chờ user quyết:** mù #22 cửa sổ lý thuyết nay ≤78 s (sàn mới mở rộng); G1 metric G5/M2 + khung (c) vẫn mở. Parent không tự quyết.
- Parent kiểm chứng độc lập: đếm lại trực tiếp từ đĩa khớp H7 — **395 batch / 2511 entry / 1539 file duy nhất** (đợt 67–106), 0 thiếu; `preview.tsx` md5 `ced42efd…`, marker 104f3 50 dòng. Không chạy lại toàn bộ suite (H9 vừa chạy 27/27 + O8 21/21 trên đúng cây này; H4 chạy lại tsc 0 + vite build pass 9,53 s + previewEngine 27/27 sau late merge).

## 3. Kiểm chứng parent (cây đã gộp)

- tsc web 0 (H5, H4 chạy lại); vite build PASS (H9 8,74 s; H4 9,53 s — cùng cây ced42efd).
- 27/27 suite exit 0 ngay lần đầu (H9); test-preview-engine.sh 354 assertions; O8 21/21 cả 2 engine (H9, trên cây đã sửa comment H5).
- Đếm lại trực tiếp từ đĩa: **395 batch / 2511 entry / 1539 file duy nhất** (đợt 67–106) — khớp H7.

## 4. Nợ mở cho đợt 107

1. **G1 — chờ user quyết** (metric G5 hay M2; khung (c) 26–27/32 = 81,25% kịch bản xấu; khuyến nghị G5: M2 + khung (c), đóng có điều kiện tự mở lại). 6 câu hỏi Q1–Q6 trong file quyết định.
2. **Mù #22 — chờ user quyết** mức tin cậy (cửa sổ lý thuyết nay ≤78 s sau sàn mới; mù #21 + reboot #16 cũng chờ quyết).
3. **Re-arm A/B RAM cao — VẪN MỞ.** Cần ≥2 lượt hợp lệ trên cây đóng băng (cấm luồng khác sửa `preview.tsx` trong cửa sổ đo); watcher chạy NGAY sau reboot; vá driver kiểm lại RAM trước mỗi lượt + sửa ENV join `ram`/`load1` null trong cap-pattern-rows.json.
4. **2 MiB:** chạy lại H2Q trên máy yên + ghi stdout launcher; H2EXT và H2C8 vẫn chưa đo; mitigation `.mp4` chưa đo; nếu browser lại chết sớm ở `page.evaluate` thì bắt log crash WebProcess ngay; cân nhắc flush probe ngay thay vì đệm 128 KiB; kiểm tra queue2 bằng GST_DEBUG queue2:5 trên pad thật (lần này chưa chạy được vì log rỗng).
5. **Zombie gate (b):** lượt thứ 5 liên tiếp chưa quan sát được — cần lượt máy yên + state100 dày; kill trực tiếp cần probe log cho clip không-blur (hoặc đóng bằng đọc code); rerun f4y3 và y3 seek-across lặp chưa chạy; đóng băng preview.tsx trước khi probe.
6. **Blur:** B-band c0 còn thiếu 43+61 B-cap (p=0,3545, power ~53%); cụm A stripes vẫn mở (strip feasibility FAIL — cần stimulus/phương pháp khác); lệch g triple +0,03 chưa giải thích.
7. **Ghost:** flip-leg đo lại lúc máy yên (dưới tải nặng C2 68,5%/C2b 63,0% không đạt bar); F6' pixel-verified skipLatest cho WebKit vẫn mở; spread đuôi lỏng max ~75 vẫn mở.
8. **Harness:** G4 flake 2/28 (7,1%) — cần chạy E1 dưới tải nặng (load ~15+) với harness đã thêm log để bắt mẫu flake có probe; keydown chậm tự nhiên vẫn mở (0/1342 toggle).
9. **EPERM:** probe #26 + mù #25 (mù #24 KHÔNG đóng được hồi tố); số thứ tự reboot #32/#33 là tạm thời (lỗ 2h03'11" có thể chứa reboot ẩn); cron riêng 10 phút vẫn chờ user quyết.
10. Birefnet-general trong gói: chỉ thử lại khi RAM đổi — vẫn 0 lần chạy thành công.
11. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
12. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
13. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.
14. **Quy trình đợt sau:** chia lượt probe dài thành lượt nhỏ + lưu sớm; đóng băng file production trước khi probe; luồng sửa production báo trước cho luồng đo; số reboot chốt bằng `uptime -s` trực tiếp (đồng hồ boot cũ chạy nhanh ~25–29 s).

## 5. Batch đã stage (KHÔNG push)

- Đợt 106: 8 luồng, **19 entry / 8 file** (H1 1, H2 5, H3 2, H4 2, H5 4, H6 3, H7 1, H9 1; H8 0).
- Closing đợt 106: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §35).
- **Tổng chờ push sau đợt 106: 2513 entry / 396 file batch / 1540 file duy nhất** (đợt 67–106; trước closing: 2511/395/1539 theo đếm trực tiếp từ đĩa; closing +2 entry / +1 batch / +1 unique — LIMITS gộp mới là unique mới, gap analysis đã có trong unique từ trước). HEAD vẫn a7308ee9. KHÔNG push.
- **Đính chính parent (13/11):** số 2513/396/1540 là tổng lũy kế paths-loop đợt 67–106 — đợt 67–105 đã lên GitHub ở PUSH #5 (HEAD a7308ee9). Chưa lên thật: 21 file duy nhất đợt 106 + 1 file oversize = **22 file (10 batch / 22 entry)**.
- Chưa lên: các batch đợt 106 + file oversize `benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 byte, vượt giới hạn mỗi lần đẩy).
- Dict i18n 2767 key, không đổi.
