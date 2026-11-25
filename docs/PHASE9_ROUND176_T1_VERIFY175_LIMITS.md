# PHASE9 — Đợt 176, T1: Verify đợt 175 (lượt cron 12:35 +07 23/11/2026)

**Verdict: PASS — nội dung đợt 175 đứng vững toàn bộ; không có đính chính có trọng lượng.**
Đếm khớp từng số quyết parent (q) §12.3 đợt 175 bằng script dedup toàn cục VIẾT MỚI HOÀN TOÀN
(`recount-176-t1.py`, không tái dùng script T1-175/T10-175/`round176-parent/count-verify-175-parent.py`
— file này mang nhãn parent nhưng theo MEMORY không phải của parent; T1 không đọc/không dùng) +
kiểm chéo lần 2 bằng shell union-trừ (khớp từng số). Suite chạy lại **28/28 exit 0** trên boot mới
`15618ce8` (btime 05:26:26Z — reboot sau khi T10-175 đóng sổ; số hiệu thuộc T0-176);
`npm test` **12 pass, 0 fail**; **0 file thiếu**; **9/9 cờ đợt 175 có nội dung** (+ cờ closing T10);
O8 đợt 175 xác nhận độc lập từ JSON gốc (T0 PASS 3/3 trên #86 + T8 PASS 3/3 trên #87);
lượt yên #44 tính lại độc lập từ JSON gốc (passes=20, tickCost median=41,0, n=632).

## §1. Đếm: khớp lần thứ 74 liên tiếp

- Script `recount-176-t1.py` (VIẾT MỚI, `hidden_files/round176-t1/`): quét **1.286 file**
  `phase9-round*.txt` (round 1–175), sắp xếp theo **số round tăng dần** (bài học F-173-T1-3).
  Purity 0 cảnh báo: 0 entry rỗng/newline/trùng trong file, 0 file thiếu NUL cuối.
- **Đợt 175 = 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới.**
- **Lũy kế 111–175 = 638/1.120/972/794.**
- **Chờ push 166–175 = 100/141/132/130.**
- **Tái kiểm 111–174 = 628/1.106/959/781** (khớp quyết parent (q) đợt 174);
  111–173 = 618/1.092/946/768; 111–172 = 608/1.077/933/755.
- **Tổng 1–175 = 1.286 batch / 6.990 entry / 3.777 đường dẫn duy nhất / 3.777 file mới.**
- **0 file thiếu trên đĩa** (kiểm trực tiếp 3.777 đường dẫn duy nhất, chuẩn hóa tuyệt đối/tương đối).
- Kiểm chéo lần 2 (`crosscheck-176-t1.sh`, shell union-trừ qua `tr/sort -u/comm`, lọc round bằng awk
  theo số): **khớp từng số** với phương pháp python — đợt 175 10/14/14/13; 111–175 638/1.120/972/794;
  166–175 100/141/132/130; 111–174 628/1.106/959/781; 111–173 618/1.092/946/768;
  tổng 1–175 1.286/6.990/3.777/3.777.
- F-176-T1-2: aggregate §10.3 đợt 175 ghi "quét 1.285 file" nhưng thực tế là **1.286 file**
  (đếm trực tiếp `ls | wc -l` = 1.286; khớp tổng batch 1.286). Lệch prose 1, cùng họ F-175-T1-3
  (tổng toàn cục T10 thiếu 1) — các số quyết (q) không bị ảnh hưởng, không đổi verdict.

## §2. Suite chạy lại: 28/28 exit 0 trên boot 15618ce8

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (05:45:30–05:52:53Z, 7m23s,
  boot `15618ce8`, RAMavail lúc mở 1.331 MB). Script `round176-t1-verify.sh` (adapt từ T1-175;
  `run()` ghi thời gian bắt đầu/kết thúc từng mục). Log `round176-t1-suites.log` (970 dòng —
  đúng bằng T1-175).
- **`npm test` đầy đủ: 12 pass, 0 fail** — 12 dòng `✅ PASS` chính xác trong mục npm-test-full
  (đếm bằng chuỗi chính xác, không đếm lỏng); 0 dòng `❌ FAIL`; dòng tổng
  `== KẾT QUẢ: 12 pass, 0 fail ==` khớp.
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`,
  vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`,
  test_integration.sh `a6b8cfc0` — khớp hồ sơ T1-175 lúc đóng. Các luồng đợt 176 khác chạy song song
  nhưng KHÔNG sửa 6 file theo dõi này trong cửa sổ verify.
- Suite NHANH hơn T1-175 (7m23s vs 12m10s) dù cùng 28 mục — mục U4 chiếm ~2m46s
  (05:47:20–05:50:06Z), npm-test-full ~2m23s. RAMavail dao động trong phiên
  (1.040 MB lúc 05:42Z → 2.204 MB lúc poll #3 của T4 → 1.458 MB lúc đóng) — xem F-176-T1-4.
  0 fail, 0 rerun. 0 process suite nào của T1 còn sống lúc đóng (`VERIFY DONE 05:52:53Z`).
- **Quy tắc đứng:** suite chạy lúc T4-176 ở pha poll-wait (poll #3 05:44:57Z lúc mở suite,
  poll #13 05:52:31Z lúc đóng suite; gate0=T5, gateA RAM≥1024) — KHÔNG nằm trong cửa sổ attempt;
  T1 không probe dpkg, không chạy script nặng nào ngoài suite theo nhiệm vụ. Poller T4 vẫn ở
  poll-wait lúc T1 đóng (poll #17, 0 attempt mở trong cửa sổ suite) — không có chồng chéo attempt.
- **Caveat (cùng mẫu F-175-T1-4):** suite chạy trên boot `15618ce8` (reboot sau T10-175 đóng sổ),
  KHÔNG phải boot #88 của đợt 175. Suite kiểm lại code (không phụ thuộc boot) nên 28/28 vẫn là
  bằng chứng độc lập đứng; các số O8/T4 đợt 175 xác minh từ file gốc đã đóng băng trên #86/#87.

## §3. O8 đợt 175 — xác nhận độc lập từ JSON gốc (6/6 file)

T1 KHÔNG chạy O8 riêng cho đợt 175: cả 6 file JSON gốc còn đủ trên đĩa; xác minh độc lập bằng cách
đếm lại từng file bằng python + tính lại md5 (đường dẫn thực tế: T0 ở `goals/.../hidden_files/round175-t0/`,
T8 ở `repo-1/hidden_files/round175-t8/` — T8-175 làm việc trong repo-1 theo nhiệm vụ đợt 175):

### §3.1. Bộ O8 T0-175 trên boot 70b7f7ee (#86) — PASS 3/3

- `round175-t0/o8-webkit/o8w-clicktest-report-2026-11-23T02-40-54-70b7f7ee-pid17203.json`
  (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `30e46593…` — KHỚP aggregate §10.2.
- `.../o8w-clicktest-report-2026-11-23T02-42-35-70b7f7ee-pid20731.json` (WebKit attempt2):
  **21 kết quả, 21 ok=true, 0 fail**, md5 `55c9d481…` — KHỚP aggregate §10.2.
- `round175-t0/o8-chromium/o8-clicktest-report-2026-11-23T02-44-45-70b7f7ee-pid29459.json`:
  **21 kết quả, 21 ok=true, 0 fail**, md5 `67824d3e…` — KHỚP aggregate §10.2.

### §3.2. Bộ O8 T8-175 trên boot ca31fac1 (#87) — PASS 3/3

- `round175-t8/o8-webkit/o8w-clicktest-report-2026-11-23T03-34-41-ca31fac1-pid14228.json`
  (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `9f26034f…` — KHỚP aggregate §8/§10.2.
- `.../o8w-clicktest-report-2026-11-23T03-35-32-ca31fac1-pid14618.json` (WebKit attempt2):
  **21 kết quả, 21 ok=true, 0 fail**, md5 `773f037b…` — KHỚP aggregate §8/§10.2.
- `round175-t8/o8-chromium/o8-clicktest-report-2026-11-23T03-36-20-ca31fac1-pid14986.json`:
  **21 kết quả, 21 ok=true, 0 fail**, md5 `12039812…` — KHỚP aggregate §8/§10.2.

### §3.3. Phạm vi chưa kiểm

- **Bộ O8 của T8-176 chưa có lúc T1 đóng** (T8-176 còn đang làm việc) — thuộc T8-176/T10-176.
  T1 KHÔNG xác nhận và KHÔNG bác bộ O8 của T8-176.
- **Bộ O8 MỚI của T0-176** (nếu có) thuộc T0-176/T10-176 — T1 chỉ xác minh 2 bộ của đợt 175.

## §4. Lượt yên #44 — tính lại độc lập từ JSON gốc attempt1

File gốc `hidden_files/round175-t4/preview-b-f3-flip-webkit-t4-attempt1-ca31fac1.json`
(tính bằng code python riêng của T1, percentile nội suy tuyến tính; không chạy script
`analyze-t4-tickcost.py` của T4):

- **mode=measure, passes=20, engine=webkit, webkit=27.2, pageErrs=[]** — KHỚP aggregate §4/§10.2.
- **tickCost total: n=632, median=41,0, p90=68,0, max=103, min=28** — KHỚP từng số với T4-175
  (`analyze-t4-attempt1-ca31fac1-tickcost.txt`: n=632 median=41,0 p90=68,0 max=103 min=28).
- Hậu flip+2000ms: n=472, median=40,0 — KHỚP T4. Frames/pass: 33–44 (median rAF/pass 37 theo T4).
- **Lượt yên #44 CÓ lượt hợp lệ — chuỗi 37 → 38 — ĐÃ XÁC NHẬN ĐỘC LẬP** về mặt passes/engine/tickCost
  (lớp B 5/5 + phân tích P1/P2/P3/P7 thuộc T4-175, T1 không đạo lại).

## §5. Cờ `.done` đợt 175: 9/9 có mặt trên đĩa, TẤT CẢ CÓ NỘI DUNG

| Cờ | mtime (Z) | Dung lượng | Khớp aggregate §10.1 |
|---|---|---|---|
| round175-t0.done | 02:48 | 1.346 B | ✓ |
| round175-t1.done | 02:55 | 2.499 B | ✓ |
| round175-t2.done | 03:30 | 3.869 B | ✓ |
| round175-t4.done | 03:31 | 1.087 B | ✓ |
| round175-t5.done | 02:45 | 672 B | ✓ |
| round175-t6.done | 03:05 | 853 B | ✓ |
| round175-t7.done | 05:11 | 2.252 B | ✓ |
| round175-t8.done | 04:31 | 1.915 B | ✓ |
| round175-t9.done (cả hai vị trí: gốc + thư mục con round175-t9/) | 05:12 | 4.107 B | ✓ |
| round175-t10.done (closing) | 05:21 | 693 B | ✓ |

- **Cờ T9 byte-identical cả hai vị trí** (md5 `7477e0a6f324784cb59eb5532e81dcff` cả hai —
  khác đợt 174, đúng mẫu đã sửa sau F-175-T1-7). Quyết (l) đợt 152 giữ trọn vẹn lần thứ 24 liên tiếp.

## §6. X11 — F-176-T1-1: trio X193/X194/X195 tái xuất LẦN THỨ 5 liên tiếp

- Lúc T1 mở (05:41Z): `/tmp/.X11-unix/` TRỐNG (reboot 05:26:26Z đã xóa tmpfs; T8-175 đã dọn
  hoặc reboot dọn trio đợt 175).
- 05:44:59Z: **X188 xuất hiện** (Xvfb của T4-176, cùng số hiệu với X188 của T4-175).
- Lúc T1 đóng (~05:53Z): **X188 đã vắng, trio X193/X194/X195 (mtime 05:50:16Z) lại có mặt** —
  xuất hiện đúng lúc mục xvfb-lock của suite T1 chạy (05:50:16–05:50:26Z), cùng mẫu F-175-T1-1.
  0 process Xvfb còn sống lúc đóng. T1 KHÔNG tự dọn socket (T8 sở hữu dọn socket lúc đóng
  theo checklist (o)) — **giao T8-176 dọn**.

## §7. Findings

- **F-176-T1-1 — 3 socket X11 mồ côi X193/X194/X195 tái xuất lần thứ 5 liên tiếp** (xem §6) —
  giao T8-176 dọn lúc đóng theo checklist (o).
- **F-176-T1-2 — Aggregate §10.3 đợt 175 ghi "quét 1.285 file" nhưng thực tế 1.286 file**
  (xem §1) — lệch prose 1, không ảnh hưởng số quyết.
- **F-176-T1-3 — Reboot mới sau khi T10-175 đóng sổ:** boot `15618ce8`, btime 05:26:26Z
  (epoch 1795411586), gap #88→boot mới = 1795411586 − 1795410257 (#88 btime 05:04:17Z) = **1.329 s**
  (22m09s — KHÔNG phải chuỗi reboot nhanh ~7 s như #85→#86→#87→#88; boot mới đến ~11 phút sau khi
  T10-175 đóng sổ ~05:15:37Z).
  Boot lúc T1 mở và lúc T1 đóng đều là `15618ce8` — không reboot mới trong phiên T1. Số hiệu reboot
  này thuộc T0-176 (T0-176 đã có `boot-survey-176t0.txt` 05:41:50Z, btime khớp). Suite chạy trên boot
  mới (xem §2 caveat).
- **F-176-T1-4 — RAMavail dao động mạnh trong phiên suite** (1.040 MB lúc 05:42Z → 2.204 MB lúc
  poll #3 của T4 → 1.458 MB lúc đóng; T4 ghi RAMavail 1.169–2.204 MB qua các poll). Suite vẫn 28/28
  và nhanh hơn T1-175 (7m23s vs 12m10s) — chỉ ghi nhận, không đổi verdict.
- **F-176-T1-5 — Phạm vi kiểm có giới hạn (cùng mẫu F-175-T1-4).** Các claim T2 (merged gap/sessions/
  hole-recheck, (m) #86/#87/#88, INSIDE #86/#87), T7 (scheduler DB, HB/DR, run 174/175), T5
  (apt/dpkg internals, POSTBOOT_PASS #86/#87/#88), T9 (attribution từng spike, ranh giới chuỗi
  E-187..E-190), T6 (120 lần kiểm soát churn, #87/#88 có giết holder không), T0 (số hiệu boot
  15618ce8) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại
  từ đầu. **Kết cục run 175 thuộc T7-176** (T1 không phán). **(m) #88 + INSIDE #88 thuộc T2-176.**
  **Số hiệu boot 15618ce8 thuộc T0-176.** **Bộ O8 của T8-176 thuộc T8-176/T10-176** (chưa có lúc
  T1 đóng — xem §3.3). **Bộ O8 mới của T0-176 (nếu có) thuộc T0-176/T10-176.**

## §8. Kết luận

Nội dung đợt 175 đứng vững toàn bộ trên boot mới `15618ce8` (suite) + file gốc đóng băng #86/#87
(O8/T4): đếm khớp lần thứ 74 liên tiếp, đợt 175 = 10/14/14 đường dẫn / 13 file mới (khớp aggregate
§10.3/footer/GAP §104 + quyết parent (q) §12.3 đợt 175); suite đầy đủ 28/28 (7m23s);
`npm test` 12 pass; O8 đợt 175 xác nhận độc lập từ JSON gốc (T0 PASS 3/3 trên #86 + T8 PASS 3/3
trên #87); lượt yên #44 tính lại độc lập (passes=20, tickCost median=41,0, n=632);
**9/9 cờ đợt 175 còn trên đĩa, đều có nội dung** (+ cờ closing T10); cờ T9 byte-identical cả hai vị
trí. Không có đính chính nào có trọng lượng — chỉ 3 socket X11 (F-176-T1-1) + lệch prose 1 file
của T10-175 (F-176-T1-2) + reboot mới sau đóng sổ (F-176-T1-3) + RAM dao động mạnh (F-176-T1-4) +
phạm vi kiểm có giới hạn (F-176-T1-5), không đổi verdict.

## Batch stage

- `phase9-round176-t1-verify175.txt` — 1 entry (T1: LIMITS này).
