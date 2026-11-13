# Phase 9 — Đợt 105: Đóng nợ LIMITS gộp đợt 104 §4 (Ghost, Zombie, Harness, Re-arm, G1, 2 MiB, Blur, EPERM) — GỘP ĐẦY ĐỦ, 9/9 VỀ ĐỦ

> Ngày: 13/11/2026. Lượt cron 18:35 +07. 9 luồng G1–G9 spawn song song; **9/9 về đủ** (LIMITS + log + batch stage). KHÔNG push. HEAD vẫn 5f548ef8.
>
> **Đính chính closing đợt 104 (parent gộp 09:20:43Z):** F1 và F9 đợt 104 thực ra đã về đủ muộn — F1 LIMITS 09:21:42Z + batch `phase9-round104-f1-g1.txt` (2 entry), F9 LIMITS 11:13:27Z + batch `phase9-round104-f9-verify.txt` (1 entry). Tổng đúng sau đợt 104 là **377 batch / 2473 entry / 1506 file duy nhất** (không phải 375/2470/1503 như parent ghi lúc 09:20Z). Đợt 105 cộng thêm 9 batch / 17 entry / 16 file duy nhất mới → **386 batch / 2490 entry / 1522 file duy nhất** (đếm lại trực tiếp từ đĩa, đợt 67–105; G9 đếm khớp đúng số này).

## 1. Kết quả từng luồng

### G1 — Ghost: HOÀN THÀNH — F8 LAND, F8b BỊ BÁC
- **F8 land (file production duy nhất đổi đợt này):** `apps/web/src/preview.tsx` md5 `ca378bbf` → `f0b9e496` — tap rVFC độc lập + gate anchor tươi 50 ms + relabel snapshot + presented chung anchor; đã gỡ nấc rawAnchor F8b.
- Bar đăng ký trước đạt cả hai chân: baseline A phân tích lại độc lập **45,7%** (43/94); B **70,8% (+25,1pt)**; B2 lặp lại **76,1% (+30,4pt)**; B3 trên code đã sửa **87,2% (+41,5pt)**. Chân flip: C **73,6% (+25,0pt)** vs D baseline flip **48,6%**; gap presented−expected |≤3| 100% mọi cửa sổ, gap tại seek 0/1 (14/14 seek).
- **F8b bị bác ở dạng gốc:** rawAnchor gộp 3 run = **216/307 = 70,4%** clean (mọi occurrence) ≈ frameIdx fallback 70,0%, xa mức tap 97,9% — không nâng tập fallback lên gần tap.
- **Tự đính chính phương pháp:** số "rawAnchor 0/30 clean" theo phân tích distinct ban đầu là **artifact của phép dedup** — analyzer gán mỗi cặp (label, pix) cho labelSrc của lần xuất hiện đầu tiên (21/47 cặp rawAnchor ở run B bị gán cho nhãn khác); các LIMITS distinct cũ (E3/D2/C2) đều chịu bias này ở breakdown theo labelSrc (headline tổng không bị ảnh hưởng). Việc gỡ rawAnchor vì vậy là trung tính, giữ lại vì không có lợi ích đo được + code đơn giản hơn + B3 đã kiểm chứng.
- Caveat: headline clean phụ thuộc độ phủ — dưới tải nặng (E3, phủ 34%) clean vẫn chỉ ~50%. Spread đuôi lỏng max ~75 không đổi ở mọi run; tiêu chí spread của bar không đánh giá được rõ ràng.
- Test: 5 run probe mới exit 0; tsc 0; vite build PASS (6,96 s); ghostBlend 15/15; previewEngine 27/27. Batch: 2 entry (`preview.tsx` + LIMITS).

### G2 — Zombie: HOÀN THÀNH (từ dữ liệu thô F4)
- Zombie core trên cây `ca378bbf` vẫn đứng: zombie Δ = **0 ở 12/12 biên × 2 lượt** (f4y1 + f4y2); **0 capture trong cửa sổ clip lẻ (24/24)**; `skip-clip-inactive` = **0**; fb `seek-inactive` 11/12 + 9/12; pixel parity clip lẻ C 75–100%, D = 0, out = 0. Fix D3 + E4 còn nguyên vẹn.
- **Nợ F4 — gate (b) đóng băng canvas trong khi playhead chạy tự do — VẪN CHƯA QUAN SÁT ĐƯỢC** (không đóng, không bác): spread test **0/267 gap**; dense-freeze advancing **0/19** ở f4 (0/20 gộp e4). Đính chính `drawsgap-all.txt` cũ: 62 ca "UNHELD+SKIPS" theo tiêu chí dph>0,30 rút về **0** — dph bị thổi phồng bởi cú nhảy seek-landing 1 bước.
- Phát hiện phương pháp: draws-check cho **8/46 "stale" danh nghĩa → 0/46 sau giám định từng ca** (7 ca frame cuối clip cũ vẽ trước biên thật do seekRel nội suy sớm vì state100 thưa, bracket tới 2725 ms; 1 ca drift +0,356 s vượt ngưỡng 0,35 đúng 6 ms). Main-canvas stale xác nhận **0/46**. Đề xuất guard bracket ≤300 ms cho đợt sau.
- Test: tsc web 0; vite build PASS 14,74 s; Hold 75/75, Pacing 19/19, previewEngine 27, seek 21, seekSkip 9/9, previewLoop 20, ghostBlend 15, rvfcClipWindow 21, driftConfirm 12/12, test-preview-engine.sh **354 assertions pass**. Batch: 2 entry (LIMITS + `probe104f4-frame-parity.mjs` stage từ F4 chưa từng stage).

### G3 — Harness: HOÀN THÀNH (từ dữ liệu thô F8)
- **D6 recheck KHỚP hoàn toàn (xác nhận lần 3: D6 → E8 → G3):** chạy lại đúng 2 script quantify của D6 + tính lại độc lập bằng script E8 — cả 3 output diff rỗng từng byte. **0/24 đuôi bị chặn đạt tiêu chí ổn định-lệch; 0/38 đoạn**; near-miss 6 đều suy biến 1-tick. D6-A vẫn bị bác.
- F8 chạy xong 4/12 lần theo kế hoạch: N10 ×2 đều 4/4 (1,21× và 1,08×); E1 ×2 đều 10/10 (G5 1,14× và 0,87×, đều PASS chắc). E1 run3 dở — G0–G5 + G7a đều PASS rồi chết do reboot, không có report JSON. Harness md5 không đổi một byte.
- **PHÁT HIỆN CHÍNH — G4 flake TÁI HIỆN:** F1 E1 run2 **FAIL G4, tap=false, G3→G4 11,50 s, 9/10, exit=1** — đúng chữ ký flake E1 run8 đợt 103 (11,9 s). Gộp đợt 104: **1/11 lần hoàn thành (9,1%)**; mọi lần E1 từng có: **2/21 (9,5%, Wilson 95% ~3–29%)**. Gap trung vị 2,79 s; flake 11,50 s = 4,1× trung vị. Cơ chế vẫn chưa biết.
- **Keydown chậm tự nhiên VẪN MỞ:** gộp toàn bộ quan sát từng có — **40 lần chạy / 561 slot / 1122 toggle, wait chậm nhất 1004 ms** (F8 E1 run2, vượt kỷ lục cũ 804 ms), **0 retry, 0 fallback, 0 abort** — vẫn thấp hơn timeout 5000 ms 5 lần.
- O8 được F9 bao phủ hoàn toàn (F9 chạy O8 trên cây gộp cuối `ca378bbf`, 21/21 cả 2 engine). Batch: 1 entry (LIMITS).
- **Đính chính giờ reboot #29 của G3 là SAI** (xem §2): G3 ghi 08:57:06–08:58:12Z; giờ đúng vẫn là **08:56:39Z** (G8 bác bằng đo trực tiếp `uptime -s` + kẹp hoạt động 13 s). G3 cần sửa LIMITS của họ ở đợt sau.

### G4 — Re-arm: HOÀN THÀNH (finalize F5)
- **Watcher A/B RAM cao của F5: KHÔNG bắt được cửa sổ.** Chạy 09:14:54–09:52:26Z, đúng **50 check × 45 s**, boot `cff65e89` (reboot #29), kết thúc bằng `NO HIRAM WINDOW in ~37 min`.
- **RAM cao nhất: 2.356.708 kB = 2.301,7 MB** (check 5, 09:17:55Z) — thiếu 43.292 kB (~42,3 MB) so với ngưỡng 2.400.000 kB; **0/50 check** đạt ngưỡng (đếm lại độc lập bằng grep + sort). Tại check 5, load1 = 4,25 nên dù RAM có vượt ngưỡng thì gate load (< 4,0) cũng chặn — chặn kép.
- Diễn biến RAM: check 1–4: 892–959 MB; check 5 nhảy +1,4 GB khi sibling thoát; sau đó decay đều xuống 527 MB lúc check 50. Cửa sổ RAM cao chỉ là spike thoáng qua < 1 chu kỳ poll.
- `run-f5-hiram.sh` chưa chạy lần nào — không có log, 0 lượt f6r/f7, không có số CAP mới. Đính chính F9: không có gì để đính chính (câu watcher kết thúc 09:52:26Z đúng từng giây).
- LIMITS F5 đã điền xong §10b; LIMITS G4 mới viết kế hoạch A/B chi tiết. **Bài học quan trọng nhất: chạy watcher NGAY sau reboot, trước mọi driver khác** — cửa sổ duy nhất trong ngày (09:01:17Z, 2.943 MB, boot+5 phút) biến mất sau 19 s khi sibling bật Chrome; watcher F5 khởi động muộn (boot+18 phút) nên đã bỏ lỡ.
- Kết luận F5 không đổi: máy yên không giảm CAP (14 CAP/5 lượt = 2,80 CAP/lượt, freeze-trong-đuôi-mở 4.900 ms); **A/B RAM cao VẪN MỞ**, RAM vẫn là nghi phạm số 1 chưa được kiểm ở mức cao. Batch: 3 entry (LIMITS F5 đã cập nhật + LIMITS G4 + `probe104f5.mjs` stage từ F5).

### G5 — G1 decision: HOÀN THÀNH (kiểm chứng độc lập số F1)
- **Kiểm chứng lại số F1: KHỚP 100%, 0 số sai.** Chạy lại cả hai script từ dữ liệu gốc (14 report JSON đều có trên đĩa) — output giống hệt từng byte log của F1 (diff 0 dòng). run8: G5 0,91×, M2 0,94×, baseline 21,87; run9: G5 0,90×, M2 0,92×, baseline 27,39; khung (c) 26–27/32, xấu nhất 81,25%; đồng thuận 140/146 (95,9%), 6 lật, 0 lật mới; chuỗi PASS yên liên tiếp 26; số học Q5 khớp (+1 FAIL → 78,8%; +2 PASS → 82,4%).
- Đối chiếu khung (a)–(i): không có mâu thuẫn số học. Bất đồng duy nhất là về luật chơi: (a) KHÔNG BAO GIỜ đạt (5 FAIL chốt trong 20 lần đầu, trần cứng) vs (c) ĐÃ ĐẠT (81,25% kịch bản xấu). Câu hỏi thực sự là "khung nào mới là luật chơi".
- **Khuyến nghị: M2 + khung (c) tích lũy, headline kịch bản xấu 26/32 = 81,25%, đóng G1 ngay với điều kiện tự mở lại nếu 1 lần yên FAIL tương lai (→ 78,8%).** Lý do: M2 nghiêm ngặt hơn G5 đúng một chiều trên 146 lần (6 PASS→FAIL, 0 FAIL→PASS); G5 đã biết báo nhanh 9% trong vùng [0,75; 1,00). Phương án dự phòng: chờ thêm 2 lần yên PASS nữa (28/34 → chịu được 1 FAIL). **G1 vẫn mở — không tự đóng, không đổi ngưỡng/metric; quyết định thuộc user.** 6 câu hỏi Q1–Q6 cho user đã trình bày trong file quyết định.
- Một điểm diễn đạt chưa chính xác (không đổi số): LIMITS F1 §1 viết cửa sổ trượt (b) "X6-1..4 ra" — thực ra trước F1 cửa sổ đã là X6-3..E1-1; đợt này chỉ X6-3 và X6-4 rời cửa sổ. Batch: 1 entry (file quyết định).

### G6 — 2 MiB: HOÀN THÀNH
- **Truy nguyên 2097152 (offline, đo thật):** không phải ranh giới file — chunk 3 bắt đầu 2094129 (sample 187, size 8959); 2097152 nằm **giữa sample 187** (delta +3023). Bytes `204286c4` tại đó khớp từng byte với pull splice (qtdemux đọc thành "atom has bogus size 541230788").
- **Seek/Range tới 2097152 không phải điều kiện cần:** 0/8 run G6 có DoSeek/Range tới đó, nhưng 5/5 run bogus vẫn splice đúng file[2097152].
- **Hằng số 2 MiB duy nhất tìm thấy:** `queue2.max-size-bytes = 2097152` (gst-inspect + giải mã binary: 2 site class-init trong libgstcoreelements.so; site 1 xác nhận là queue2). Nhưng **chưa chứng minh nhân quả** — không có bằng chứng queue2 nằm trong chuỗi pull webkitwebsrc→typefind→qtdemux; playbin offline không splice. Đã loại: queue/multiqueue 10 MiB, playbin buffer-size −1, libsoup, libgstplayback, qtdemux 32 MiB.
- **Scan typefind tái hiện offline:** URI không extension (blob:) → 40 lần đọc trước caps (đuôi file, quét bước 4032, vùng size//2) vs **1 lần đọc 4096 B** khi có đuôi `.mp4`. Mỗi peek nhảy offset ép webkitwebsrc seek + Range mới + refill adapter.
- **Probe phân biệt G6AB (live, xen kẽ, cùng shim, 3+3 run c2): blob-direct KHÔNG giảm bogus** — first-atom E 2/3 vs A 2/3 (Fisher p=1,0); any-splice E 2/3 vs A 3/3 (p=1,0). Swap http→blob không phải điều kiện cần; biện pháp này bị bác bằng số. G6C8 (c8, 2 run): cả 2 sạch nên chưa kết luận được offset với file lớn.
- Phát hiện phương pháp: shim F2 không ghi pull do typefind khởi xướng (lọc theo parent của pad đối số) — peek scan chỉ đọc qua dòng DoSeek trong log GST.
- Probe live chạy được: 8 run, 0 crash/OOM, boot 3e4f237a, RAM 1154–2064 MB, load 1,5–6,1. Không sửa production. Batch: 3 entry (LIMITS + probe mới + JSON kết quả).

### G7 — Blur: HOÀN THÀNH
- **r7 — giả thuyết "nội dung gap 2" BỊ BÁC bằng đo trực tiếp, r7 ĐÓNG với giả thuyết này.** Stimulus mới `frames-noise.mp4` (mosaic ngẫu nhiên + code band 4px + số frame, mỗi frame nhận diện duy nhất bằng pixel) cho strip nhận diện gần như hoàn hảo: MAD tới frame đúng **0,4 (chr) / 1,7 (wk)**, tới frame nhì 47–48. Đường rVFC đáng tin: ghost content == nhãn riêng **157/164 (95,7%)**; trong **5/5 sự kiện blend phân biệt** có label gap 6, content gap == label gap (6,6,6,7,6) — **0 ca content gap 2**. Ca gap-2 duy nhất (1/11 sự kiện) nằm trên đường tick WebKit, giải thích trọn bằng trễ nhãn (presented −5, ghost −1; ring đóng băng, 1 trạng thái lặp 14 tick). Kết hợp F6 timing (0/13) + strip stripes (0/13 xác nhận) → gap-2 chết.
- Phát hiện phương pháp: `blendTick.ringLast` KHÔNG phải nhãn ghost mới nhất ĐÃ BLEND khi `skippedLatest=1` — khi đó là `ringPrev` (tương quan 100%: chr 39/39, wk 36/36); ~48–52% tick bị ảnh hưởng. `predict_pair` của C4/D4/E6/F6 đã có nấc fallback nên các cap gap-6 cũ vẫn giữ gap thật 6 (kiểm lại 4/4 cap F6).
- **B-band c0:** gộp F6+G7: c0 4/41 (9,8%) vs c2 1/36 (2,8%), Fisher một phía **p=0,22 — KHÔNG ĐẠT bar**; power normal-approx nay 46% (F6: 15%). Còn thiếu **74 B-cap c0 + 79 B-cap c2** để đạt ~115/nhóm. Thiết kế c0-only (`--nclips 1`) ĐÃ KIỂM CHỨNG: 24 B-cap c0/lượt (gấp 2× lượt 3-clip). Cờ theo dõi: pair-like c0-only 4/24 (16,7%) vs c0 3-clip 0/17 (p=0,13).
- **D floor post-fix gộp: 0/2041**, Fisher p=5,12e-11, 95% CI trên **0,147%**. Hiệu chuẩn g stimulus mới: triple phân biệt live 0,616–0,635 (lệch +0,03..+0,05 so với dự đoán 0,589 — chưa giải thích được); pad-clone 0,774–0,777.
- Pre-register viết TRƯỚC mọi lượt probe; 8 lượt probe đều exit 0 (4 lượt noise r37 thực chất noblur do lỗi WITH_BLUR — đã sửa, chạy lại r38; 2 lượt stripes r37/r37c0; 2 lượt noise-blur r38). Bar control (b) prereg (exact-match 80%) KHÔNG ĐẠT literal (30,3%) — nhưng phương pháp strip đã tự chứng minh bằng MAD; lần sau đặt bar theo "trong ±1" (đạt 69,1% gộp; chr riêng ~91%).
- G1 land F8 giữa chừng (preview.tsx ca378bbf → f0b9e496 lúc 11:52:15Z, đúng giữa lượt chr r38) nhưng probe tắt F3 nên chế độ đo không đổi; lượt chr r38 vẫn ghi là "lai". Stimulus `frames-noise.mp4` (1.917.759 byte, nhị phân) KHÔNG stage theo luật. Batch: 3 entry (LIMITS + generator + probe).

### G8 — EPERM: HOÀN THÀNH
- **Probe #24 (checklist P8 §2.3, ĐÚNG 1 lần):** status 11:38:19Z DEAD/STALE (age 10.757 s, last #23 08:39:02Z, boot 8c1c5131, exit 1) → once 11:38:22Z **boot=3e4f237a, ok=2 fail=0**, exit 0 → status 11:38:27Z ALIVE (age 5 s, n=24). Log probe 61 → 64 dòng (+3 đúng checklist). Boot vẫn 3e4f237a lúc 11:46:13Z — không reboot trong lúc làm việc.
- **Đính chính lớn — tiền đề lượt SAI: 11:26:40Z là reboot #31, KHÔNG phải #30.** #30 = **10:54:53Z** (cff65e89 → 287705ad), F9 ghi nhận trực tiếp (poller restart 10:55:48Z `uptime_since=10:54:53`, suites log boot 287705ad 10:59:20–11:03:20Z, O8/verify trên boot đó tới 11:13:36Z). #29 = 08:56:39Z (kẹp hoạt động 13 giây: 08:56:38Z→08:56:51Z). Khoảng cách #29→#30 = 1h58'14"; **#30→#31 = 31'47" — SÀN MỚI** (phá sàn cũ 1h11'36"). Chu kỳ 31 lần / ~63h08'30" ≈ 2h02'/lần.
- **Mù #23 (08:39:02Z→11:38:22Z, 2h59'20") — ĐÃ ĐÓNG HOÀN TOÀN**, đúng 3 reboot (#29/#30/#31), cả ba chốt giờ từng giây. Đoạn #29→#30 loại trừ trực tiếp bằng poller F9 (12 poll mỗi 10 phút, không sót, boot cff65e89) + watcher hiram F5 (50 check mỗi ~45 s); hai đoạn còn lại loại trừ bằng sàn; đuôi sau #31 bằng uptime.
- **Hệ quả mù #22: mức tin cậy HẠ.** Sàn mới phá cột sàn của F7 (đoạn trước #28 1h16'20" > 2×31'47" = 1h03'34"), mở cửa sổ hình thức [06:12:11Z, 06:24:57Z]. Kiểm lại: hoạt động dày (bản ghi cách nhau ≤ ~30 s, 5 luồng, chuỗi probe E5 không đứt, 0 run bị giết) — mù #22 **vẫn đóng trên bằng chứng hoạt động, nhưng mức tin cậy hạ** từ "sàn + hoạt động, kín" xuống "chỉ hoạt động, cửa sổ lý thuyết ≤30 s". G8 không tự quyết — **parent/user quyết** giữ "đóng" hay "đóng có điều kiện".
- **Bác đính chính của G3 về giờ #29** (xem G3 trên): **SAI** — F7 đo trực tiếp `uptime -s` = 08:56:39Z lúc 08:57:38Z, F9 xác minh độc lập, kẹp hoạt động 13 s. Giờ #29 giữ nguyên 08:56:39Z.
- **Sóng EPERM:** 339 file *.log có mtime trong mù #23: 0 "vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted" thật; 9 dòng "đã tắt" đều dương tính giả đã biết. Sóng gần nhất ~11:55–12:11Z (R7), ~47h27' trước probe #24. EPERM KHÔNG tuyên bố đã hết. Khoảng trống không-bản-ghi về sóng 22'15" (11:13:36Z→11:35:51Z).
- **Quét writeFileSync (11:41:44–11:42:05Z):** NEWSTD 472 dòng / 148 file; R7B 497 / 165; copies 25 / 17; 472+25=497=R7B, **chênh 0 — lần thứ 11 liên tiếp**. +17 dòng / +6 file vs F7, giải thích đúng hết bằng diff. 0 file biến mất, 0 file hạ cánh trong cửa sổ scan. Async `.writeFile(`: đúng 2 vị trí trong helper retry đã biết, 0 stray.
- **RAM (birefnet KHÔNG chạy):** 5 mẫu 499 / 473 / 497 / 1868 / 1811 MB (max ~1,82 GB = 30% guard 6144 MB). Max trong mù #23: 2356708 kB (~2,30 GB = 37% guard, hiram 09:17:55Z). Birefnet-general vẫn 0 lần thành công.
- **Dự báo:** F9 dự #31 ~12:59Z — sai (thực tế 11:26:40Z, sớm 1h32'). Dự báo mới #32 ~13:28:49Z, dải 11:58:27Z–14:40:48Z (rất rộng sau khi sàn đổi). Batch: 1 entry (LIMITS).

### G9 — Verify: HOÀN THÀNH
- **Về đủ: 8/8** (G1–G8, LIMITS + log + batch stage). Poll đĩa 10 phút: 11:38Z 0/8 → 11:48Z 4/8 → 11:58Z 5/8 → 12:08Z 7/8 → 12:09Z 8/8 (G5 thực ra về 11:40Z — poller glob sót file quyết định không tên LIMITS, đã sửa và ghi bài học).
- **Cây gộp XANH** (đóng băng 12:09:54Z, `preview.tsx` f0b9e496 — G1 land F8-only, file production duy nhất đổi đợt này): tsc web/desktop 0, vite build PASS 6,19 s, **27/27 suite exit 0 ngay lần đầu** (Hold 75, Pacing 19, previewEngine 18+27, seek 21, seekSkip 9/9, ghostBlend 15, rvfcClipWindow 13+21, driftConfirm 12/12, css60/61 60/60, P7 8/8, orphans 17/17, r6 dict 2767, U4 141/141, test-preview-engine.sh 354 assertions), O8 **21/21 cả 2 engine** (chr Δx 0,112/0,113; wk 0,194/0,197 — khớp từng chữ các đợt trước).
- **Đối chiếu headline 8/8 KHỚP** (chạy lại analyzer/script + tính lại Fisher từ dữ liệu gốc).
- Đính chính: 11:26:40Z là reboot #31 (không phải #30); G3 sai về giờ #29; mù #22 mức tin cậy hạ — cần parent/user quyết. Comment "0/30 clean" của rawAnchor trong `preview.tsx` còn ghi sai số đã bị bác (70,4% ≈ 70,0%) — đề nghị sửa comment ở đợt sau, G9 không sửa production.
- Batch: 1 entry (LIMITS). Tổng chờ push G9 đếm: 386/2490/1522 — parent đếm lại khớp đúng.

## 2. Ghi chú gộp parent

- **Đính chính số reboot — tất cả các brief đợt 105 ghi sai:** boot hiện tại 3e4f237a là reboot **#31 (11:26:40Z)**, không phải #30. #30 = 10:54:53Z (boot 287705ad). G6 ghi boot 3e4f237a là "#30" là sai (chỉ sai nhãn, không đổi số đo). G1/G7 đã tự đính chính trong LIMITS của họ. Sàn reboot mới **31'47"** (#30→#31).
- **G3 cần sửa LIMITS:** đính chính giờ #29 (08:57:06–08:58:12Z) là sai; giờ đúng 08:56:39Z. Parent không sửa file của luồng khác; ghi nợ cho đợt 106.
- **Mù #22 — quyết định chờ user:** G8 hạ mức tin cậy xuống "chỉ hoạt động, cửa sổ lý thuyết ≤30 s". Parent không tự quyết giữ "đóng" hay "đóng có điều kiện" — đưa lên cho user cùng với quyết định G1 (metric G5/M2) khi user về.
- **Parent kiểm chứng độc lập cây cuối:** tsc web 0 (chạy lại sau G9, 12:2xZ); `preview.tsx` md5 vẫn `f0b9e496` — không đổi sau đóng băng G9 12:09:54Z. Không chạy lại toàn bộ suite (G9 vừa chạy 27/27 + O8 21/21 trên đúng cây này).
- G9 poller glob sót file quyết định G5 (không tên LIMITS) — bài học: poll phải glob cả `*DECISION*` / `*G1*`, không chỉ `*LIMITS*`.
- G1 land F8 giữa lượt G7 (11:52:15Z) nhưng probe G7 tắt F3 nên chế độ đo không đổi — chấp nhận, đã ghi "lai" ở lượt chr r38.
- Không có reboot nào cắt ngang đợt 105 (reboot #31 xảy ra 11:26:40Z, trước khi các luồng bắt đầu ~11:38Z).

## 3. Kiểm chứng parent (cây đã gộp)

- tsc web 0 (chạy lại); vite build PASS (G9 6,19 s; G2 14,74 s; G7 7,08 s — cùng cây f0b9e496).
- 27/27 suite exit 0 ngay lần đầu (G9); test-preview-engine.sh 354 assertions; O8 21/21 cả 2 engine (G9, trên cây đã land F8 — O8 có giá trị theo chuẩn F9 đợt 104).
- Đếm lại trực tiếp từ đĩa: **386 batch / 2490 entry / 1522 file duy nhất** (đợt 67–105) — khớp G9.

## 4. Nợ mở cho đợt 106

1. **G1 — chờ user quyết** (metric G5 hay M2; khung (c) 26–27/32 = 81,25% kịch bản xấu; khuyến nghị G5: M2 + khung (c), đóng có điều kiện tự mở lại). 6 câu hỏi Q1–Q6 trong file quyết định.
2. **Mù #22 — chờ user quyết** mức tin cậy hạ ("đóng" hay "đóng có điều kiện", cửa sổ lý thuyết ≤30 s).
3. **Re-arm A/B RAM cao — VẪN MỞ.** Kế hoạch đã đăng ký trước (G4 §4): chạy watcher NGAY sau reboot, trước mọi driver khác; trigger RAM ≥ 2.400.000 kB + load1 < 4,0 + sibProcs = 0; f6r gop250 + f7 gop30 qua `run-f5-hiram.sh`. Sau đó mới tới A/B tắt E4 (chỉ khi RAM cao vẫn cho CAP cao; so sánh bắt buộc trên cùng dải RAM).
4. **2 MiB:** queue2 max-size-bytes = 2097152 chưa chứng minh nhân quả (cần đo byte typefind forward/tiêu thụ trong phase scan — sửa shim theo G6 §5; kiểm tra queue2 có trong pipeline WebKit không + thử đổi max-size-bytes xem splice có dời không); c8/clip ~3–4 MiB có splice không; thử gán đuôi `.mp4` cho blob URL để scan về 1 lần đọc (blob-direct đã bị bác).
5. **Zombie gate (b):** cần lượt máy yên + state100 dày (bracket ≤300 ms) + đủ 23/23 cú seek-across thật (driver F4 chỉ bắn 2/23 + 0/23 vì poll 150 ms bị nhảy burst qua); độ trễ kill trực tiếp trên cây hiện tại chưa đo lại; draws-check cần guard bracket; f4y3 pause-burst chưa chạy lại.
6. **Blur:** thành phần content thật của cụm A stripes (g≈0,44) vẫn mở; B-band c0 còn thiếu 74+79 B-cap (p=0,22, power 46%); lệch g triple +0,03..+0,05 chưa giải thích; bar control lần sau đặt theo "trong ±1".
7. **Ghost:** headline clean phụ thuộc độ phủ (cần tăng độ phủ dưới tải); sửa analyzer distinct (dedup theo (label, pix, labelSrc) hoặc báo kèm phép đếm mọi occurrence); flip-leg cho code land chưa đo lại (chỉ có suy luận chặn dưới); F6' pixel-verified skipLatest cho WebKit vẫn mở; spread đuôi lỏng max ~75 vẫn mở; sửa comment "0/30 clean" sai trong `preview.tsx`.
8. **Harness:** G4 flake 2/21 (9,5%) — cơ chế chưa biết, đề xuất log thêm trạng thái enhance giữa G3→G4; keydown chậm tự nhiên vẫn mở (0/1122 toggle); E1 run4–10 của driver F8 (danh nghĩa); sửa đính chính giờ #29 sai trong LIMITS G3.
9. **EPERM:** probe #25 + mù #24 (từ 11:38:22Z); mù #21 (lỗ 17'23") + reboot #16 (kẹp ~4') vẫn chờ parent/user quyết; cron riêng 10 phút vẫn chờ user quyết.
10. Birefnet-general trong gói: chỉ thử lại khi RAM đổi — vẫn 0 lần chạy thành công.
11. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
12. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
13. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 105: 9 luồng, **17 entry / 9 file** (G1 2, G2 2, G3 1, G4 3, G5 1, G6 3, G7 3, G8 1, G9 1).
- Closing đợt 105: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §34).
- **Tổng chờ push sau đợt 105: 2492 entry / 387 file batch / 1523 file duy nhất** (đợt 67–104: 2473/377/1506; đợt 105: 17 entry luồng + closing 2 entry / 10 file batch; +17 file duy nhất — 16 file luồng mới + LIMITS gộp mới; gap analysis đã stage từ trước). Đếm lại trực tiếp từ đĩa sau khi stage closing. HEAD vẫn 5f548ef8. KHÔNG push.
- Dict i18n 2767 key, không đổi.
