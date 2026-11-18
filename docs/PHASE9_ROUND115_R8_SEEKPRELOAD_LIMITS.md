# PHASE9_ROUND115_R8_SEEKPRELOAD_LIMITS.md — R8: Chạy lại bar B-Q8-1 trên lượt TẢI SẠCH + trigger blob error-event

> Luồng R8, Phase 9 đợt 115 (VCut Studio). Chạy: 2026-11-14 17:49Z –
> 19:11Z (00:49 – 02:11 +07 15/11). Prereg viết TRƯỚC khi đo (17:50Z,
> `hidden_files/round115-r8/prereg-r8.md` + Addendum A reboot #47).
> **Reboot #47 xảy ra 17:45:50Z** (gap #46→#47 = 2h01'01" — trong khoảng
> đã chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn; số thứ tự vẫn TẠM
> THỜI) — giết các tiến trình round-115 lúc 17:45Z; mọi phép đo R8 chạy
> trên **boot #47** (id `5578af38-911d-4f3b-93b0-383a1664f225`), không
> phải boot #46 như prereg gốc ghi. Repo local `~/workspace/repo-1`.
> **KHÔNG push, KHÔNG release/tag. KHÔNG sửa file production nào.**
> Chỉ ĐO (theo nhiệm vụ). Môi trường: VM 2vCPU/8GB, GStreamer hệ thống
> 1.24.2 (libevent mất sau reboot #47, R7/R9 repair lại trước ~18:09Z),
> Playwright webkit, clip c8 `~/workspace/round96-x1/clips-faststart/c8.mp4`
> (8.182.985 B, 32 s). Prereg: `hidden_files/round115-r8/prereg-r8.md`.
> **Cấm:** TTS 39, birefnet, `.github/workflows/*`.

## Kết luận chính (TL;DR)

1. **Bar B-Q8-1 KHÔNG ĐẠT — nhưng vì tiền đề của bar không xảy ra trên
   lượt sạch, không phải vì H1 sai.** Trong 4 run PAUSED tải sạch, pha
   blob kết thúc sớm vì lỗi ở 3 run (sau 0,7–2,6 s) và đói hoàn toàn ở
   1 run — KHÔNG run nào ở trong pha blob đủ 20 s để đo C / flatness /
   T_c / im lặng GST. 4/6 điều kiện PAUSED của bar là KHÔNG ĐÁNH GIÁ
   ĐƯỢC; 2 điều kiện còn lại ĐẠT (0 progress sau suspend 13/13 run;
   PLAYING đạt full 2/2 cả 2 lượt).
2. **Trigger blob error-event ĐÃ TÌM ĐƯỢC (đáp án cho nợ Q8 §8.3): cuộc
   đua ring-wrap ở lần pull đầu.** Adapter blob là ring 4.194.304 B;
   một pull ở req_off=0 đôi khi trả về byte ở file offset 4.194.304
   (`16 f7 6b 79…`) thay vì offset 0 (`00 00 00 20 66 74 79 70…`) →
   qtdemux đọc atom size 385.313.657 → "atom has bogus size" → "This
   file is invalid" → pipeline chết → element error-event (code null)
   → pool fallback HTTP. Bằng chứng: pull đầu trả byte wrap ⟺ lỗi
   9/9 run có bất kỳ pull wrap nào; 0 pull wrap → sạch 3/4 run (1
   ngoại lệ, xem §5). Tần suất R8: lỗi 8/12 run blob (67%) + 1 đói
   (75% bị ảnh hưởng); gộp Q8+R8: lỗi 13/23 (57%), bị ảnh hưởng 14/23
   (61%). Giả thuyết "lỗi do tải cao" của Q8 BỊ YẾU ĐI: lượt 2 sạch
   lỗi 5/5, trong khi SEEKFAST lượt 1 dưới tải nặng lỗi 0/2. Giả
   thuyết RAM thấp cũng KHÔNG đứng (Q8 SEEKFAST r1 lỗi ở mem 2.866 MB
   cao nhất; xem §5).
3. **Trần 17,421 s vẫn xuất hiện khi pha blob sống sót:** PAUSED r1
   lượt 1: 1 mẫu [0, 17.031] ngay trước lỗi; PLAYING r2 lượt 1:
   firstSample [0, 17.421]. H1 vẫn "được hỗ trợ về cơ chế, chưa đóng
   bar thời gian" — như Q8, nhưng nay đã rõ LÝ DO bar không đóng được:
   đường blob quá flaky (lỗi ring-wrap) để giữ pha blob 20 s.
4. **F2 seek-không-chờ KHÔNG tái xác nhận đầy đủ theo bar chữ:**
   lượt 2 sạch seekImmMs 1008/760 ms (bar ≤940 ms: 1/2 đạt). Gộp 6 lượt
   SEEKFAST (Q8 653/810 + R8-L1 997/794 + R8-L2 1008/760): 4/6 đạt,
   median 802 ms, seekedOk 6/6, phát tới cuối clip 6/6. Khuyến nghị
   thiết kế KHÔNG ĐỔI (seek ngay ~0,8 s vẫn hơn chờ 20 s rồi seek
   0,44 s — tổng 20,4 s so với 0,8 s), nhưng bar ±500 ms so với P2SEEK
   0,44 s là quá chặt cho seek lạnh (metadata chưa load lúc seek).
5. **Đường HTTP đối chứng sạch:** full [0,32] trong 543 ms (lượt 2
   sạch; Q8: 913 ms), 724 frames — trần là tính chất pipeline
   blob/GStreamer, không phải của element nói chung (khẳng định lại
   đính chính M2 §4.1 của Q8).
6. **PAUSED r2 lượt 1 — mode đói mới ("starve"):** blob không error,
   không fallback: qtdemux chết ngay ở pull ĐẦU (byte wrap) trước khi
   typefind nhận diện file → element không bao giờ có metadata,
   rs=0, buf=0,0 suốt 20 s, `stalled` 4,38 s, seek không xong, 0
   frames. Im lặng GST thật trong cửa sổ chờ là 19.611 ms (sau khi
   sửa analyzer — xem §0), nhưng đó là im lặng do đói, KHÔNG phải im
   lặng H1 (không có suspend/canplaythrough).
7. **Không sửa production trong lượt này** (nhiệm vụ chỉ đo; F2
   không đạt bar chữ; cơ chế ring-wrap cần sửa ở tầng adapter/shim
   hoặc pool — ngoài phạm vi đo, xem §8).

## 0. Sự cố env + sóng tải + sự cố do R8 gây ra (ghi trung thực)

- **Reboot #47 (17:45:50Z):** xảy ra giữa 2 lần kiểm tra `uptime -s`
  của R8 (15:44:49Z → 17:45:50Z, cách nhau ~3 phút). Gap #46→#47 =
  2h01'01". Giết các tiến trình round-115 đang chạy (vite-lock test,
  X displays X193/194/195). Driver R8 lần 1 (khởi 17:48:09Z) chạy
  trên boot mới. Prereg được bổ sung Addendum A TRƯỚC khi đo.
- **libevent-2.1.so.7 MẤT trên boot mới** (apt repair của Q7 đợt 114
  KHÔNG giữ được qua reboot #47) — WebKit không launch được cho tới
  khi repair lại. R8 KHÔNG tự chạy apt repair (việc của luồng hạ
  tầng); driver đổi từ "dừng ngay" sang "chờ tối đa 60 phút" cho
  libevent. Quan sát: LIBEVENT_OK trở lại lúc 18:09:58Z (R9
  postboot-b47-final 18:15:06Z). Driver R8 không cần chờ libevent vì
  cờ R2 về sau thời điểm đó.
- **Chờ cờ:** cờ `round115-r2-tree` về trong khoảng 18:18–18:30Z
  (driver guard check 30/100 lúc 18:18Z chưa có; có lúc 18:30Z);
  cờ `round115-r3-hogs-off` + `round115-r3-done` đều CÓ lúc 18:20Z.
  R2 xong (vite lock đã nhả 18:24:39Z). Không cần fallback "R3 chưa
  xong" vì cả 2 cờ R3 đều về trước khi đo.
- **Cửa sổ tải sạch lượt 1:** 18:28–18:33Z, 10 mẫu load1 0,31–1,77
  (ổn định 5 phút, đạt). Arm PAUSED chạy 18:33:40–18:36:43Z, load1
  0,65 → 0,39 — SẠCH.
- **Sóng tải R1:** luồng R1 chạy hog-load (hog-load-r1f1/f2/f3,
  18:41/18:47/18:49Z) bắt đầu ~18:37Z — load1 vọt 0,39 → 25,77 trong
  lúc arm PLAYING (18:36:58–18:38:08Z), rồi 24,17 → 18,02 (SEEKFAST)
  và 17,18 → 11,70 (HTTP). PLAYING x2, SEEKFAST x2, HTTP x1 lượt 1
  đều NHIỄM. Sóng tan lúc ~18:44Z (load1 0,50).
- **Lượt 2 (rerun):** chạy lại PLAYING x2 + SEEKFAST x2 + HTTP x1 +
  PAUSED spare run4 (r2 lượt 1 VÔ HIỆU: 0 frames) trong cửa sổ sạch
  mới 19:01–19:06Z (load1 0,14–0,86), các arm 19:06:52–19:10:43Z,
  load1 0,64 → 1,34 — SẠCH toàn bộ.
- **BUG guard cửa sổ lượt 2 (lần 1):** vòng chờ trong run-r8b.sh
  không sleep khi mẫu đầu fail nên chạy hết 40 vòng trong 2,5 phút
  (load1=7,61 do hog R1 còn chạy) rồi dừng lúc 18:53:49Z. ĐÃ SỬA
  (sleep 30 s sau mỗi vòng fail), chạy lại driver 19:01:50Z — cửa sổ
  đạt ngay vòng 1. (Bug tương tự tồn tại trong run-r8.sh lượt 1
  nhưng không kích hoạt vì cửa sổ đạt ngay vòng 1.)
- **SỰ CỐ DO R8 GÂY RA — ghi đè log thô của Q8 (xin lỗi, ghi rõ để
  Q9/parent xử lý):** runner copy Q8 để nguyên đường dẫn
  `round114-q8/{gst,pull,bundle,dot}` nên lượt 1 đã GHI ĐÈ 8 file
  gst log + 8 file pull log của Q8 (PAUSED r1–r3, PLAYING r1–r2,
  SEEKFAST r1–r2, HTTP r1) và rebuild 4 file bundle lúc 18:39:56Z
  (cùng source, nội dung được cho là giống hệt — KHÔNG verify được
  từng byte vì không có md5 gốc của Q8). Số liệu CÔNG BỐ của Q8
  không mất: còn trong `q8-analysis.txt` + OUT JSON 114q8 +
  LIMITS Q8 (Q9 đã verify 8/8 từ các nguồn này). Log thô GST/pull
  của 8 case Q8 ĐÃ MẤT (chỉ còn r4/r5 PAUSED + PLAYPAUSE r1/r2).
  Khắc phục: log lượt 1 của R8 đã dời về `round115-r8/gst|pull`;
  runner/analyzer đã vá đường dẫn qua env `R8_DIR`/`R8_OUT`;
  chạy lại analyzer cho kết quả IDENTICAL (trừ 1 số silence đã sửa,
  xem dưới). Lượt 2 dùng `R8_DIR=round115-r8/rerun` + OUT riêng —
  không ghi đè thêm gì.
- **SỬA analyzer (q8_analyze_115r8.py) — 1 chỗ, có lý do:** hàm
  silence phase-window của Q8 chỉ tính khoảng giữa 2 event liên tiếp,
  KHÔNG tính khoảng trống đầu/cuối cửa sổ → đánh giá THẤP im lặng
  khi pipeline dừng sớm trong cửa sổ. Đã sửa để tính cả 2 đầu
  (đúng định nghĩa prereg: "khoảng dài nhất không có event trong
  lúc paused"). Ảnh hưởng: ĐÚNG 1 số thay đổi — PAUSED r2 lượt 1:
  phase silence 96 ms → 19.611 ms (im thật ~19,6 s do đói; xem §3).
  Lượt 2 phân tích lại IDENTICAL 100%. Phân tích lượt 1 chạy lại
  sau khi vá cũng IDENTICAL trừ số này.
- `preview.tsx` md5 `03bf029f…` trước/sau cả 2 lượt — không đổi.
  `media.ts` không đụng. Shim `l2_queue2_probe.so` md5 `b208e8de…`
  (dùng lại của L2, không biên dịch lại). Runner R8 = copy Q8, chỉ
  đổi OUT + đường dẫn env + round string (node --check OK);
  KHÔNG dùng vite (http server + esbuild, port 8944, Xvfb :199 —
  đã dọn sạch sau mỗi lượt, không còn tiến trình nào). Không chạy
  tsc/vite build: không đổi production. RAM khả dụng lúc đo:
  653–1.632 MB (thấp hơn Q8: 717–2.866 MB).

## 1. Prereg và tuân thủ

- Prereg viết trước mọi phép đo mới (17:50Z + Addendum A 17:48Z về
  reboot #47 — addendum ghi sau khi viết prereg nhưng TRƯỚC khi đo).
  Bar B-Q8-1 nguyên văn Q8 prereg §4 + quy tắc chờ cờ R2/R3 + cửa sổ
  tải sạch load1 < 3 ổn định 5 phút + quy tắc seek (ghi rõ gốc đo).
- Thực hiện: lượt 1: 8 run (PAUSED r1–r3, PLAYING r1–r2, SEEKFAST
  r1–r2, HTTP r1); lượt 2: 6 run (PAUSED r4 spare, PLAYING r1–r2,
  SEEKFAST r1–r2, HTTP r1). Tổng 14 run, tất cả đều có GST > 0 VÀ
  pull ≥ 100 (theo luật run hợp lệ); PAUSED r2 lượt 1 VÔ HIỆU
  (0 frames) nên chạy spare r4 ở lượt 2 (đúng prereg §3: tối đa 2
  run dự phòng — chỉ dùng 1).
- Gốc đo seek (đính chính Q9, R8 TỰ KIỂM LẠI từ JSON thô Q8 trước
  khi viết prereg): JSON `seekMs` = page-t timestamp lúc issue seek
  (KHÔNG phải duration). Cột Seek dưới đây = issue→seeked = evs
  seeked t − seekMs/1000 (khớp đúng LIMITS Q8: r1 19,82 s…);
  seeking→seeked = evs `seek_dur_s`; SEEKFAST: `seekImmMs` trực tiếp.
  Số trong ngoặc ở cột Seek = seeking→seeked.

## 2. Bảng quyết định (14 run — lượt 1 + lượt 2)

load1 = loadavg[0] ghi trong JSON của case (lúc chạy case). "Pha blob" =
khoảng từ blobReady tới error-event hoặc hết run. "Trần blob" = giá
trị buffered cao nhất của pha blob (từ bufTrace). Seek =
issue→seeked (seeking→seeked trong ngoặc). L1 = lượt 1, L2 = lượt 2.

| Arm | Run | Lượt | load1 | blobReady | Pha blob kết thúc | Trần blob | Seek | Frames | Fail / finalSrc |
|---|---|---|---|---|---|---|---|---|---|
| PAUSED | r1 | L1 sạch | 0,50 | 1.678 ms | error t=4,03 s | **17.031 s** (1 mẫu) | 2,18 s (2,16) / TRUE | 231 | ok / **http**† |
| PAUSED | r2 | L1 sạch | 0,24 | 874 ms | đói, không error | 0,0 s (đói scan) | — / FALSE | 0 | stall-timeout / blob |
| PAUSED | r3 | L1 sạch | 0,13 | 990 ms | error t=3,59 s | — (0 mẫu ≠0) | 1,98 s (1,90) / TRUE | 200 | ok / **http**† |
| PAUSED | r4* | L2 sạch | 0,64 | 328 ms | error t=1,04 s | — (0 mẫu ≠0) | 0,47 s (0,44) / TRUE | 384 | ok / **http**† |
| PLAYING | r1 | L1 NHIỄM | 7,79 | 1.669 ms | error t=4,79 s | — | — | 149 | error-event / **http**† |
| PLAYING | r2 | L1 NHIỄM | 19,23 | 1.086 ms | hết 20 s, còn blob | **17.421 s**‡ | — | 161 | ok / blob |
| PLAYING | r1 | L2 sạch | 0,75 | 588 ms | error t=1,42 s | — | — | 440 | error-event / **http**† |
| PLAYING | r2 | L2 sạch | 1,07 | 187 ms | error t=0,96 s | — | — | 451 | error-event / **http**† |
| SEEKFAST | r1 | L1 NHIỄM | 23,36 | 515 ms | hết run, còn blob | — | seekImm 997 ms / TRUE | 239 | ok / blob |
| SEEKFAST | r2 | L1 NHIỄM | 19,63 | 680 ms | hết run, còn blob | — | seekImm 794 ms / TRUE | 256 | ok / blob |
| SEEKFAST | r1 | L2 sạch | 1,13 | 195 ms | error t=0,78 s | — | seekImm 1008 ms / TRUE | 384 | ok / **http**† |
| SEEKFAST | r2 | L2 sạch | 2,06 | 197 ms | error t=0,73 s | — | seekImm 760 ms / TRUE | 384 | ok / **http**† |
| HTTP | r1 | L1 NHIỄM | 17,17 | — | — (full [0,32]) | — (full 2.818 ms) | — | 357 | ok / http |
| HTTP | r1 | L2 sạch | 1,26 | — | — (full [0,32]) | — (full 543 ms) | — | 724 | ok / http |

\* r4: run spare cho r2 VÔ HIỆU (Q6_START=4). † preloadFull=TRUE /
full buffer của các run này đến từ **fallback HTTP sau error-event
blob** — KHÔNG được tính là blob đạt full. ‡ PLAYING r2 lượt 1:
firstSample buf [[0, 17.421]] (ngay sau play, rs=4, ns=1);
lastSample t=19,88 buf [[0, 32]] — đạt full [0,32] trong lúc phát
(trên blob).

## 3. B-Q8-1 (cơ chế H1) — KHÔNG ĐẠT (tiền đề bar không xảy ra)

Bar đã đăng ký (nguyên văn Q8): PAUSED gộp 3 run: C < 31,5 s cả 3,
flatness ≤0,1 s cả 3, T_c ≤ 2 s cả 3, im lặng GST ≥18 s cả 3,
0 progress sau suspend cả 3; VÀ PLAYING ≥1/2 run đạt full trong 20 s.

- **C < 31,5 s: KHÔNG ĐÁNH GIÁ ĐƯỢC** — pha blob của PAUSED sạch:
  r1 chỉ có ĐÚNG 1 mẫu ≠0 ([0, 17.031] lúc t=4,02, ngay trước lỗi
  4,03); r3/r4 có 0 mẫu ≠0 (blob buf [] suốt tới lúc lỗi); r2 C=0,0
  do đói (không phải trần). Không có run nào cho đủ mẫu để tính C
  (median 5 s cuối) của pha blob.
- **Flatness ≤0,1 s: KHÔNG ĐÁNH GIÁ ĐƯỢC** — cùng lý do (không đủ
  mẫu pha blob; số analyzer in ra — flat5s=32,0 ở r1/r3/r4 — trộn
  cả pha blob [] và pha HTTP [0,32] sau fallback, vô nghĩa cho bar).
- **T_c ≤ 2 s: KHÔNG ĐÁNH GIÁ ĐƯỢC** — chỉ có 1 bound từ r1:
  buffered lần đầu ≥16,93 s trong khoảng (3,91 s, 4,02 s] page-t,
  tức 2,23–2,34 s sau blobReady (1,678 s) — vượt 2 s một chút NHƯNG
  chỉ là bound từ 1 mẫu, không phải phép đo T_c; không kết luận
  đạt/không đạt.
- **Im lặng GST ≥18 s: KHÔNG ĐÁNH GIÁ ĐƯỢC** — pha blob của r1/r3/r4
  chỉ sống 0,7–2,6 s (ngắn hơn 18 s); r2 im thật 19.611 ms trong cửa
  sổ chờ (sau khi sửa analyzer — xem §0) NHƯNG đó là im lặng do ĐÓI
  (không suspend, không metadata, rs=0), không phải im lặng H1
  (suspend sau canplaythrough). Không dùng để chấm bar.
- **0 progress sau suspend: ĐẠT 13/13 run** (mọi run có suspend đều
  có `progress_after_suspend=[]`; r2 không suspend nên không tính).
  Kể cả các run fallback HTTP: sau suspend (trên element HTTP) cũng
  0 progress — khớp H1/H4.
- **PLAYING đạt full: ĐẠT** — lượt 1: 2/2 full [0,32] (r1 http sau
  fallback, r2 blob); lượt 2: 2/2 full [0,32] (cả 2 http sau
  fallback). Caveat: ở lượt 2 sạch, cả 2 run đều full trên HTTP,
  không phải trên blob (blob lỗi trước khi kịp phát xa).
- **Verdict B-Q8-1: KHÔNG ĐẠT — tiền đề bar (pha blob tồn tại đủ
  20 s paused) không xảy ra trên lượt sạch.** Không có bằng chứng nào
  chống lại H1: trần 17,031/17,421 tái hiện khi pha blob sống sót;
  suspend → 0 progress 13/13; HTTP đối chứng đầy trong 543 ms.
  H1 giữ nguyên "được hỗ trợ về cơ chế, chưa đóng bar thời gian" —
  nay đã rõ LÝ DO không đóng được: đường blob quá flaky để giữ pha
  blob 20 s (xem §5). Muốn đóng bar phải đổi protocol (xem §8),
  không phải chạy thêm cùng một kiểu đo.

## 4. F2 seek-không-chờ — KHÔNG tái xác nhận đầy đủ theo bar chữ

Bar đã đăng ký (B-Q8-5 F2, giữ nguyên): seekImmMs ≈ P2SEEK 440 ms
(±500 ms, tức ≤940 ms) và seekedOk=TRUE cả 2 run.

- Lượt 2 sạch: SEEKFAST r1 **1008 ms** (vượt bar 68 ms), r2 760 ms;
  seekedOk=TRUE 2/2, phát 384/384 frames tới cuối clip. → **1/2
  đạt: KHÔNG tái xác nhận đầy đủ.**
- Gộp 6 lượt SEEKFAST mọi đợt: Q8 653/810 ms + R8-L1 997/794 ms +
  R8-L2 1008/760 ms → 4/6 ≤940 ms, median 802 ms, range 653–1008 ms,
  seekedOk 6/6, phát tới cuối 6/6. 2 run vượt bar đều là run1 của
  R8 (997, 1008 ms); run2 của R8 (794, 760 ms) đều đạt. Q8 thì
  ngược (r1 653 < r2 810) nên không có quy luật run1-chậm hệ thống
  — n nhỏ, ghi nhận là phương sai, không suy diễn.
- Lưu ý về gốc đo: seekImmMs của lượt 2 đo trên element HTTP sau
  fallback (cả 2 run lỗi blob trước seek); của lượt 1 đo trên blob
  (cả 2 run còn blob). Không có chênh lệch hệ thống giữa 2 nhóm
  (blob: 794–997; http: 760–1008) — seek nhanh không phụ thuộc src.
- **Khuyến nghị thiết kế KHÔNG ĐỔI:** seek ngay mất ~0,65–1,0 s
  (median ~0,8 s); chờ 20 s rồi seek mất 0,44 s + 20 s chờ = 20,44 s
  tổng. Chờ 20 s vẫn mua được 0 s. Bar ±500 ms so với P2SEEK 0,44 s
  là quá chặt cho seek LẠNH (metadata chưa load lúc issue seek —
  evs cho thấy loadedmetadata bắn CÙNG lúc seeked ở SEEKFAST) — đợt
  sau nên đăng ký bar theo phân phối (vd median ≤1 s, p90 ≤1,2 s)
  thay vì so với số warm-element của P2SEEK.

## 5. Blob error-event trigger — ĐÃ TÌM ĐƯỢC: cuộc đua ring-wrap ở lần pull

### 5.1 Tần suất (ghi đúng điều kiện)

- R8: lỗi error-event (code null, → fallback HTTP) **8/12 run blob**
  (67%): L1 PAUSED r1/r3, PLAYING r1; L2 PAUSED r4, PLAYING r1/r2,
  SEEKFAST r1/r2. Cộng 1 run đói không-error (PAUSED r2 L1) →
  **bị ảnh hưởng 9/12 (75%)**. Chỉ 3/12 run blob chạy trọn không lỗi
  (L1 PLAYING r2, SEEKFAST r1/r2 — cả 3 đều dưới sóng tải R1!).
- Q8 (đối chiếu lại): lỗi 5/11 run blob (45%): PAUSED r4/r5,
  PLAYING r1, PLAYPAUSE r2, SEEKFAST r1.
- **Gộp Q8+R8: lỗi 13/23 run blob (57%), bị ảnh hưởng 14/23 (61%).**
- Lỗi xảy ra 0,44–3,80 s sau blobReady (R8: 0,53–3,12 s; ngoại lệ
  PLAYPAUSE r2 Q8: 23,2 s — lỗi muộn sau thời gian phát dài, không
  tính vào dải này); code LUÔN null (9/9 errEvents R8 có code null,
  msg null).

### 5.2 Cơ chế (bằng chứng byte — xác định)

- **Số bogus là xác định, không ngẫu nhiên:** mọi case lỗi đều có
  cùng một con số trong GST log: `atom has bogus size 385313657`.
  385.313.657 = 4 byte big-endian `16 f7 6b 79`. 4 byte này nằm ở
  **file offset đúng 4.194.304** — chính bằng kích thước ring
  (J2_QUEUE2_MAX_SIZE_BYTES=4194304). Không phải trùng hợp.
- **Pull đầu tiên quyết định:** bảng PULL đầu tiên của mỗi run
  (shim log, req_off=0):
  - Pull đầu trả byte wrap (`16f76b79…`) → lỗi/đói **7/7 run**
    (L1 PAUSED r1/r2/r3, PLAYING r1; L2 PAUSED r4, PLAYING r1).
  - Pull đầu trả đúng byte đầu file (`0000002066747970…`, ftyp) →
    sạch 3/5 run (L1 PLAYING r2, SEEKFAST r1/r2); 2 run còn lại lỗi
    do pull SAU đó trả byte wrap (L2 SEEKFAST r1/r2: pull wrap ở
    shim ms 1140/1151, ~390–450 ms sau pull đầu).
  - Quy tắc gộp: **bất kỳ pull nào trả byte wrap → lỗi 9/9 run;
    không pull wrap nào → sạch 3/4 run** (1 ngoại lệ: L2 PLAYING
    r2 — xem §5.3).
- **Chuỗi nhân quả:** adapter blob là ring 4.194.304 B; cả file
  8.182.985 B được đẩy vào ring → ring wrap; một pull ở req_off=0
  đôi khi đọc được byte ở offset 4.194.304 thay vì offset 0 →
  qtdemux đọc 4 byte đó làm atom size (385.313.657 > kích thước
  file) → "atom has bogus size" → "This file is invalid and cannot
  be played" → "no playable streams" → pipeline chết → element
  error-event (code null) → pool fallback HTTP (phát bình thường).
  Dấu vết phụ: sau whole-file APUSH luôn có 1 push 32 byte = đúng
  32 byte CUỐI file (offset 8.182.953) — xuất hiện ở MỌI run blob
  (cả lỗi lẫn không lỗi) nên đó là hành vi bình thường của adapter,
  không phải trigger.
- **Đối chứng Q8 (log còn sót lại):** PAUSED r4/r5 + PLAYPAUSE r2
  (cả 3 đều lỗi) đều có dòng `bogus size 385313657`; PAUSED r4 có
  pull đầu trả byte wrap y hệt R8; PLAYPAUSE r1 (không lỗi) có 0
  dòng bogus. Cơ chế này giải thích cả lỗi của Q8, không chỉ của R8.
- **Giả thuyết tải cao BỊ YẾU ĐI:** lượt 2 sạch lỗi 5/5, trong khi
  SEEKFAST lượt 1 dưới tải nặng (load1 19–24) lỗi 0/2; Q8 PAUSED
  r1–r3 dưới tải nặng (load1 18–46) lỗi 0/3. Lỗi không cần tải cao.
- **Giả thuyết RAM thấp KHÔNG ĐỨNG:** Q8 SEEKFAST r1 lỗi ở
  memAvailMB 2.866 (cao nhất toàn bộ Q8+R8); Q8 PAUSED r3 không lỗi
  ở 794 MB (thấp). Trong R8, run lỗi có mem 653–1.307 MB, run sạch
  có mem 1.010–1.632 MB — chồng lấn, không tách được.
- **Giả thuyết blobReady nhanh → lỗi KHÔNG ĐỨNG:** blobReady nhanh
  (<600 ms) đi với lỗi ở 5/6 run lượt 2, nhưng Q8 SEEKFAST r2
  blobReady 562 ms không lỗi, còn R8-L1 PAUSED r1 blobReady 1.678 ms
  vẫn lỗi. Không tách được.

### 5.3 Ngoại lệ + phần chưa rõ (để mở, không kết luận vội)

- **L2 PLAYING r2 (1 ngoại lệ):** error-event t=0,96 s nhưng pull
  log KHÔNG có pull wrap nào, GST log chỉ có 1 dòng qtdemux1
  "Internal data stream error" (không có dòng bogus-size). Có thể
  pull gây chết nằm ngoài shim log, hoặc chết ở instance demuxer
  khác — chưa rõ. Cơ chế ring-wrap giải thích 8/9 case bị ảnh
  hưởng của R8 (+ 3/3 case Q8 kiểm được), còn 1 case chưa có dấu
  vân tay.
- **Vì sao pull đôi khi trả byte wrap:** chưa chứng minh — giả
  thuyết mạnh nhất là cuộc đua khởi tạo con trỏ đọc của adapter
  (pull đầu tới trước khi con trỏ reset về 0 sau whole-file push),
  nhưng chưa có bằng chứng timing trực tiếp (cần hook đo con trỏ
  đọc — ngoài phạm vi đo của R8). Ghi là giả thuyết, không phải kết
  luận.
- **Vì sao r2 đói im lặng thay vì error:** suy diễn (chưa chứng
  minh): pull wrap là pull ĐẦU TIÊN và typefind chưa từng nhận
  diện được file → pipeline chết trước khi kịp bắn element error →
  không kích hoạt fallback của pool (fallback chỉ nghe element
  `error`). Các case lỗi khác đều đã có progress event / buffering
  trước khi chết. Cần 1 run tái hiện đói + kiểm tra error event
  propagation để khẳng định.

## 6. Cơ chế byte của trần 17,421 s — vẫn mở, có manh mối mới

- Q8 đã thử ATAKE totals / max qtdemux req_off / frontier — không
  kết luận được. R8 không thêm hook mới (không sửa shim/production)
  nên vẫn không có đáp án trực tiếp.
- Manh mối mới (số học, CHƯA chứng minh): bitrate trung bình c8 =
  8.182.985 / 32 = 255.718 B/s. Trần 17,421 s ≈ 4.455.000 B;
  17,031 s ≈ 4.355.000 B; ring = 4.194.304 B → trần cao hơn ring
  4–6%. Phù hợp với giả thuyết Q8 "ring-full + overhead" (queue2 /
  demux read-ahead), nhưng c8 là VBR nên đổi thời gian → byte có
  sai số ~±10% — KHÔNG đủ để kết luận. Cần đo byte trực tiếp
  (frontier kéo của qtdemux tại thời điểm trần) ở đợt sau.
- Lưu ý: cơ chế ring-wrap (§5) và trần buffer là 2 hiện tượng khác
  nhau nhưng cùng gốc ring 4 MiB — đừng gộp: wrap gây LỖI ở lúc
  pull, trần là ĐÓNG BĂNG buffer khi paused (suspend → không pull).

## 7. Caveat bắt buộc

1. **Sóng tải R1 là nhiễu lớn nhất của lượt 1** (§0): PLAYING /
   SEEKFAST / HTTP lượt 1 đều nhiễm (load1 3–26). Chỉ PAUSED lượt 1
   + toàn bộ lượt 2 là sạch. Mọi số lượt 1 ngoài PAUSED đều là số
   dưới tải, KHÔNG dùng làm số tuyệt đối (chỉ dùng làm bằng chứng
   về error/fallback, vốn không phụ thuộc tải — xem §5).
2. **load1 không đáng tin theo nghĩa đen** (Q3 đợt 114): kết luận
   "tải sạch" dựa trên load1 < 3 ổn định 5 phút KÈM bằng chứng hành
   vi — lượt sạch có blobReady 187–1.678 ms, seek 0,44–0,47 s (PAUSED
   r4), sample bufTrace đúng ~100 ms, frames 200–724 (so với
   149–256 dưới tải). Lượt sạch là sạch thật theo cả 2 thước đo.
3. **Ánh xạ page-t ↔ shim-ms** qua neo wholeFileAPUSH↔swapMs có sai
   số ±giây dưới tải (Q8 §7.2); trên lượt sạch, neo khớp tốt hơn
   (blobReady 187–588 ms, first pull shim ~700–1.200 ms).
4. **n nhỏ và không cân bằng:** PAUSED sạch 4 run (3 lỗi + 1 đói),
   PLAYING sạch 2 run (cả 2 lỗi), SEEKFAST sạch 2 run (cả 2 lỗi),
   HTTP sạch 1 run. Không suy rộng quá n — nhưng cơ chế ring-wrap
   có dấu vân tay byte xác định (không phải thống kê), nên kết luận
   cơ chế không phụ thuộc n.
5. **Analyzer silence đã sửa** (§0): số im lặng phase-window của r2
   (19.611 ms) là số sau sửa; các số khác không đổi. Chạy lại
   analyzer lượt 1 + lượt 2 sau sửa: lượt 1 chỉ đổi đúng 1 số,
   lượt 2 IDENTICAL 100%.
6. **Sự cố ghi đè log Q8** (§0): Q8 mất log thô GST/pull của 8 case;
   số liệu công bố của Q8 còn nguyên trong analysis txt + JSON +
   LIMITS. R8 chịu trách nhiệm về sự cố này; đợt sau cần check
   đường dẫn hardcoded khi copy runner (đã vá bằng env R8_DIR).
7. **Không chạy tsc / vite build / suite:** không đổi file production
   nào (chỉ runner copy + analyzer + LIMITS này); kiểm chứng liên
   quan là recount + phân tích bufTrace/GST/pull (đã chạy, §2–§5).
   Suite cây gộp thuộc luồng verify đợt 115.
8. **Không gộp SEEKFAST vào Fisher/splice nào** (protocol khác).
   Không suy "trần buffer gây splice".

## 8. Nợ mở cho đợt sau

1. **Bar B-Q8-1 cần đổi protocol mới đóng được** (không chạy thêm
   cùng kiểu đo): đề xuất 2 hướng — (a) chạy PAUSED với pool
   fallback TẮT (probe-only, không đổi production) để pha blob tồn
   tại đủ 20 s, đo C/T_c/flatness/silence thuần; (b) đăng ký lại bar
   theo kiểu "survival-conditioned": chạy PAUSED x6, chấm bar trên
   các run sống sót qua pha blob + báo cáo riêng tỷ lệ sống sót.
   Quyết định thuộc parent.
2. **Sửa cuộc đua ring-wrap (hướng sửa, chưa làm):** adapter trả
   byte wrap ở pull req_off=0 — cần reset con trỏ đọc về 0 sau
   whole-file push TRƯỚC khi cho pull, hoặc đồng bộ pull đầu với
   push xong. Đây là bug thật của đường blob (lỗi 57% gộp), không
   phải nhiễu đo. Sửa xong đo lại tần suất lỗi (kỳ vọng về ~0%).
   Sửa ở tầng adapter/shim/pool — cần luồng sửa riêng, không phải
   luồng đo.
3. **Ngoại lệ L2 PLAYING r2** (lỗi không có pull wrap, §5.3) +
   **đói im lặng r2** (vì sao không bắn element error, §5.3) — cần
   1–2 run tái hiện có hook sâu hơn (error propagation, instance
   qtdemux).
4. **Cơ chế byte của trần 17,421 s:** vẫn mở (§6) — cần hook đo
   frontier kéo của qtdemux tại thời điểm trần (không dùng ATAKE
   totals — Q8 đã thử, không kết luận được).
5. **Bar F2 nên đăng ký lại** theo phân phối (median ≤1 s thay vì
   so với P2SEEK 0,44 s warm) nếu muốn tái xác nhận F2 (§4).
6. **Nợ đứng yên từ đợt 114 (LIMITS gộp 114 §10):** G1 + mù #22/#28/
   #29/#30/#31/#33 chờ user quyết; E4 đóng đầy đủ (caveat gộp);
   zombie chuyển sang hướng sửa; điểm gãy tải; migration lock v2
   (đợt 115); ngưỡng WebKit ≤60 ms; ghost stale seq 282–285;
   headroom inotify rơi; birefnet 0 lần thành công; TTS 39 CẤM kiểm
   lại; ci-security.yml vẫn 403 chờ user; release gate.
7. **Hậu quả sự cố ghi đè log Q8** (§0): đợt sau khi copy runner
   phải kiểm tra mọi đường dẫn hardcoded trước khi chạy (đã vá bằng
   env ở runner R8); Q9 verify đợt 115 lưu ý Q8 mất log thô 8 case
   (số công bố vẫn còn).

## 9. Batch stage (KHÔNG push)

`phase9-round115-r8-seekpreload.txt` (3 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_115r8_2mib.mjs` (runner R8:
  copy Q8, đổi OUT + đường dẫn qua env R8_DIR + round string; 78.311 B
  — >37.768, cần `ENABLE_PRIVSEP=0` khi push. Lưu ý: lượt 1 chạy với
  bản chưa vá đường dẫn (hardcoded round114-q8 — gây sự cố §0); lượt 2
  chạy với bản đã vá. File stage là bản đã vá.)
- `benchmarks/render/q8_analyze_115r8.py` (phân tích bufTrace + im
  lặng GST; 7.755 B. Bản đã vá: H/OUT qua env + silence tính cả đầu/
  cuối cửa sổ — xem §0.)
- `docs/PHASE9_ROUND115_R8_SEEKPRELOAD_LIMITS.md` (file này)

Không stage OUT JSON (`benchmarks/results/webkit-blob-flaky-115r8-seekpreload.json`,
106.045 B; `...-rerun.json`, 40.279 B — theo lệnh: không stage
`benchmarks/results/`). Dữ liệu thô đầy đủ ở `hidden_files/round115-r8/`
(prereg + addendum reboot #47, run-r8.sh, run-r8b.sh, r8-progress.md,
r8-driver.log, r8b-driver.log, r8b-driver2.log, r8-*.log 4 arm lượt 1,
r8b-*.log 4 arm lượt 2, r8-analysis.txt (đã sửa silence r2),
r8-analysis-rerun.txt, gst/ + pull/ 8 case lượt 1, rerun/{gst,pull}/
6 case lượt 2, rerun/bundle/). KHÔNG push.
