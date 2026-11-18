# PHASE9_ROUND113_P2_RINGLAG_LIMITS.md — P2: Ring 8 MiB — đo lag push/take trực tiếp tại thời điểm splice

> Luồng P2, Phase 9 đợt 113 (VCut Studio). Chạy: 2026-11-14 11:45Z –
> 12:15Z (18:45–19:15 +07). Boot #44 (10:53:31Z, id
> `6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0`; gap #43→#44 = 1h59'54" —
> trong khoảng đã chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn; số thứ
> tự #44 vẫn TẠM THỜI). KHÔNG reboot trong lượt. Repo local
> `~/workspace/repo-1`. **KHÔNG push, KHÔNG release/tag.** Chỉ stage,
> user tự push sau từ main chat. **KHÔNG sửa file production nào.**
> ĐO LƯỜNG thuần túy (chỉ runner copy + 2 script phân tích mới).
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu),
> Playwright webkit, clip c8 `~/workspace/round96-x1/clips-faststart/c8.mp4`
> (8.182.985 B, 32 s). Postboot-check PASS trên boot #44 (log
> `postboot-check-b44-p2.log`; script vẫn ghi tham chiếu #42 trong
> header — nợ hạ tầng, chỉ chạy không sửa). **Cấm:** TTS 39, birefnet,
> `.github/workflows/*`. Prereg:
> `hidden_files/round113-p2/prereg-p2.md` (+ Addendum A) — viết TRƯỚC
> khi tính bất kỳ thống kê lag nào.

## Kết luận chính (TL;DR)

1. **Lag push/take tại thời điểm splice ĐÃ ĐO ĐƯỢC — và nó NHỎ, CHẶT,
   KHÔNG phải take bị kẹt.** 21 pull spliced logic ở P2CTL mới
   (ring 4 MiB): push_lag 7–86 ms, residence 7–65 ms, splice_delay
   0–21 ms. Pull spliced xảy ra trong vòng 0–21 ms sau khi byte ghi đè
   được take vào ring; take_freshness tại thời điểm splice chỉ 0–3 ms
   (r7/r8). Đối chứng N2 offline (17 pull logic): push_lag 13–510 ms,
   residence 13–91 ms, splice_delay 0–419 ms — cùng bậc, chậm hơn ở
   arm fresh-element dưới tải (N2EL r1). Không có bằng chứng take stall
   gây splice.
2. **B1 — lag KHÔNG phân biệt splice theo luật khoảng đã đăng ký**
   (khoảng spliced 7–86 ms nằm trọn trong khoảng clean −5..155 ms,
   chồng lấn 100% > 50%), DÙ median lệch rõ (spliced 10–86 ms vs
   clean bulk 0 ms, ~98% clean <10 ms). Đọc đúng: lag là DẤU VẾT của
   burst flood (pull tới ngay sau burst), không phải nguyên nhân.
   Biến phân biệt thật là **số byte take kể từ lúc byte đúng được load
   so với wrap** (xem §4), không phải lag wall-clock.
3. **B2 — ĐẠT kỳ vọng: lag tại điểm tương đương của R8 KHÔNG khác hệ
   thống so với pull spliced của control.** Pull req_off=9939 ở R8:
   push_lag 37–78 ms, residence 9–35 ms, splice_delay 26–69 ms —
   cùng dải với pull spliced P2CTL (7–86 / 7–65 / 0–21) — nhưng phục
   vụ ĐÚNG. Lag không giải thích được khác biệt ring; kích thước ring
   mới là thứ khác biệt.
4. **Kiểm chứng wrap TRỰC TIẾP (mới):** với 38 pull spliced logic
   (P2+N2), số byte take trên cùng adapter kể từ lúc byte ĐÚNG được
   load tới lúc pull VƯỢT wrap 4.194.304 trong 33/38 ca; 5 ca còn lại
   ở 95,4–99,6% wrap. Đối chứng gần-miss: pull sạch req_off=9939 ở
   P2CTL r5 có 3.764.384 byte take (89,7% wrap) → phục vụ đúng.
   Ngưỡng nằm giữa 3,76 MB (sạch) và 4,00 MB (splice). Đây là bằng
   chứng đếm trực tiếp rằng splice ⟺ take-vượt-wrap, độc lập với lag.
5. **B3 — seek: seek TỰ NÓ NHANH (0,44 s ×2, seekedOk=TRUE, 0 lỗi),
   nhưng preload-wait chạm trần 20 s mà không full buffer 2/2**
   (preloadFull=FALSE) — tái hiện mẫu M2 P/P0 + N2EL r2. Độ trễ UX
   nằm ở preload-wait, không phải seek. Vấn đề riêng, không trộn vào
   kết luận splice.
6. **Đề xuất production: KHÔNG đổi** (giữ đề xuất M2/L2/N2). Lag đo
   được không mở đường production nào mới: splice là wrap theo số
   byte take, và ring cố định vẫn không phủ được video user lớn hơn.

## 0. Sự cố env + chạy lại (ghi trung thực)

- Lượt P2CTL r1–r4 (12:02–12:04Z) chạy THIẾU `GST_DEBUG_BLOB=1` nên
  runner không set `GST_DEBUG_FILE` → không có `LD_PRELOAD`/
  `F2_DUMP_FILE` → thư mục pull/ và gst/ TRỐNG dù 4 run đều phát
  (r1 694f + error-event fallback http; r2 708f OK; r3 stall-timeout
  0f; r4 705f OK; load1 lúc bắt đầu 10,31 — tải cao do luồng p4 chạy
  song song). 4 case này đã append vào OUT JSON nhưng VÔ HIỆU cho đo
  lag — giữ lại làm vết audit, KHÔNG dùng, KHÔNG xóa. Đã chạy lại
  P2CTL dưới tên run5–run8 (`Q6_START=5`) với `GST_DEBUG_BLOB=1`.
  Bài học: kiểm tra pull log sau run đầu tiên, đừng chờ hết lượt.
- Không run nào bị reboot giết; không dùng run dự phòng (cả 10 run
  kế hoạch đều hợp lệ: frames > 0 VÀ GST > 0 VÀ pull ≥ 100).

## 1. Prereg, Addendum A và tuân thủ

- Prereg viết trước mọi phép đo lag (11:45Z): định nghĩa push_lag /
  residence / splice_delay ở mức adapter (APUSH/ATAKE), 3 arm
  P2CTL4 / P2R8-4 / P2SEEK2, bar B1/B2/B3, ngưỡng <80% khớp thì
  KHÔNG KẾT LUẬN.
- **Addendum A (~12:05Z, TRƯỚC khi tính thống kê lag):** luật
  exact-start thất bại cho push của pull spliced (0/14 N2CTL r1 —
  push là range, không bắt đầu đúng tại O'; đã sửa thêm lỗi P2-a:
  token cuối giữ `'\n'` làm hex16 không khớp). Đổi sang luật
  range-containment (APUSH/ATAKE gán offset bằng hex16→clip, range
  chứa O'; neo theo take mới nhất rồi tìm push mới nhất trước take
  đó). Quy tắc B1/B2/B3 và ngưỡng <80% KHÔNG đổi. Chẩn đoán phương
  pháp (không phải đo lag) đã thấy push chứa O' ở ms 834, take ở
  ms 848, pull ở ms 858 — tức lag mức chục ms; addendum ghi rõ điều
  này để khỏi nhầm là post-hoc.
- Thực hiện: 10/10 run kế hoạch hợp lệ, khớp 100% pull (0
  match_fail mọi run — xem §2). `F2CAP` 0 dòng mọi run (không chạm
  cap adapter 30.000). `PULL_CAP` 2000 không chạm (tối đa 1.492
  PULL/run). Mơ hồ hex16: 0 ở mọi run P2 (3 pull clean ở N2R8 r4
  offline — không ảnh hưởng).
- Runner P2 = copy runner N2, đổi port 8942→8943, Xvfb :198, OUT
  `webkit-blob-flaky-113p2-2mib.json`, thư mục round113-p2, mode key
  P2CTL/P2R8/P2SEEK. Runner KHÔNG dùng vite (http server + esbuild)
  → không cần vite.lock, không tranh watcher ENOSPC. Xvfb :198 chạy
  suốt lượt, kill sau khi xong; không có vite mồ côi (luồng này
  không khởi động vite nào).
- `media.ts` md5 `2c384ed1…` — KHÔNG đổi trong suốt lượt.
  `preview.tsx` md5 `03bf029f…` trước/sau mọi lượt — không đổi.
  Shim `l2_queue2_probe.so` md5 `b208e8de…` (dùng lại của L2, không
  biên dịch lại, không đổi cap).
- **Không chạy tsc / vite build / suite:** không đổi file production
  nào (chỉ runner copy + 2 script phân tích `.py` độc lập, không nằm
  trong tsc); kiểm chứng liên quan là recount + phân tích lag (đã
  chạy, §2–§4). Suite cây gộp thuộc luồng verify đợt 113.

## 2. Bảng quyết định (mọi con số splice từ `n2_recount_112.py`; mọi số lag từ `p2_lag_113.py`, pull logic đã dedupe typefind+qtdemux0)

| Arm | Run | Bogus (dòng / logic, delta) | Flood | Frames / finalCt | Verdict |
|---|---|---|---|---|---|
| P2CTL (J2=4 MiB) | r5 | 0 | 3,36 | 536 / 28,67 | Sạch |
| P2CTL | r6 | 16 / **8**, +4.194.304 | **8,68** | 540 / 28,17 | Bogus (flood cao nhất từng thấy) |
| P2CTL | r7 | 12 / **6**, +4.194.304 | 5,86 | 679 / 28,59 | Bogus |
| P2CTL | r8 | 14 / **7**, +4.194.304 | 5,91 | 704 / 29,31 | Bogus |
| P2R8 (ring 8 MiB) | r1–r4 | 0 / 0 | 3,40–3,42 | 707–712 / 29,5–29,7 | Sạch hết |
| P2SEEK (J2=4 MiB, fresh+seek) | r1–r2 | 0 / 0 | — | 384 / 32,0 | Sạch (xem §5 seek) |

- P2CTL **3/4 bogus** (kỳ vọng prereg ≥1 run bogus — thỏa, dư biên).
  req_off spliced TRÙNG HỆT N2 (9939/48426/66916/80895/97529/114176/
  126851) — chữ ký scan ổn định qua 2 đợt, 2 boot.
- Mọi spliced pull đều delta đúng +4.194.304, 0 OTHER. "14 dòng
  spliced" của N2 = **7 pull logic** (typefind+qtdemux0 ghi trùng
  cùng ms/req_off) — từ nay báo cả hai số.
- P2CTL r6 flood 8,68 là cao nhất từng ghi (vượt L2 7,53 và N2EL r1
  7,47); r6 playOk=false (error-event) nhưng vẫn 540 frames —
  fallback http sau lỗi blob (như P2CTL r1 void).
- P2R8 flood chỉ 3,40–3,42 cả 4 run (thấp, không restart) — như N2R8
  (3,17–4,40). Nợ "R8 flood cao" đã được N2R8LOOP đóng (6,00/6,47
  vẫn 0 splice); đợt này không lặp lại LOOP.

## 3. B1 — Lag tại thời điểm splice (control) vs pull sạch cùng run

### 3.1 Pull spliced — P2CTL mới (21 pull logic)

| Run | n logic | push_lag (ms) min / median / max | residence (ms) | splice_delay (ms) | take_freshness |
|---|---|---|---|---|---|
| r6 | 8 | 7 / **85,5** / 86 | 7 / **65** / 65 | 0 / **20,5** / 21 | 0–20 |
| r7 | 6 | 9 / **10** / 10 | 9 / **9** / 9 | 0 / **1** / 1 | 0 |
| r8 | 7 | 16 / **17** / 17 | 14 / **14** / 14 | 2 / **3** / 3 | 2–3 |

- Cấu trúc burst: r7/r8 mỗi run CHỈ 1 burst (6–7 pull trong 1–2 ms);
  r6 có 2 burst (7 pull ms 1697–1699 + 1 pull ms 2100 ở adapter khác,
  push_lag 7 ms). Trong mỗi burst, lag gần như HẰNG SỐ (r8: residence
  đúng 14 ms cả 7 pull; r7: đúng 9 ms cả 6 pull) — splice là một sự
  kiện burst duy nhất, không phải 7 lần độc lập.
- Tại thời điểm splice: adapter gần đầy — take_avail_before
  ~3,86–3,98 MB, push_avail ~7,58–8,08 MB (push lớn vừa nạp cả file);
  n_aclear_before = 6 (adapter đã clear 6 lần trước burst).
- take_bytes_after của take ghi đè: 0–28.672 B — gần như không có
  take nào xen giữa take ghi đè và pull sai: pull tới ngay sau khi
  byte ghi đè vào ring.
- Đối chứng N2 offline (cùng script): N2CTL r1 7 logic, push_lag
  24–25 (median 25), residence 14, splice_delay 10–11; N2EL r1
  8 logic, push_lag 88–510 (median 192), residence 82–91 (median
  82), splice_delay 6–419 (median 110); N2EL r2 2 logic, 13/13/0.
  Cùng bậc độ lớn, chậm hơn ở arm fresh-element dưới tải.

### 3.2 Pull sạch cùng run (đối chứng)

| Run | n logic | push_lag median / p90 / max | % <10 ms | Violation attribution |
|---|---|---|---|---|
| P2CTL r5 | 710 | 0 / 0 / 155 | 99,3% | 0 |
| P2CTL r6 | 729 | 13.705 / 25.807 / 28.667 | 2,2% | **354 (48,6%) — LOẠI khỏi B1** |
| P2CTL r7 | 717 | 0 / 0 / 145 | 98,5% | 0 |
| P2CTL r8 | 731 | 0 / 0 / 77 | 98,5% | 0 |
| P2R8 r1–r4 | 730–733 | 0 / 0 / 37–78 | ~99% | 0 |
| P2SEEK r1–r2 | 538–539 | 0 / 0 / 64–80 | ~99% | 0 |

- Pull sạch áp đảo là live-served: push→take→phục vụ trong cùng ms
  (median 0, p90 0). Đuôi dài (>1000 ms) tồn tại ở mọi run (vài pull/
  run) — byte nằm trong ring lâu mà chưa bị ghi đè (ring đóng băng/
  pipeline chậm), KHÔNG đủ gây splice một mình.
- **P2CTL r6 clean KHÔNG ĐÁNG TIN — loại khỏi so sánh B1:**
  354/729 pull sạch (48,6%) vi phạm tự-kiểm attribution
  (take_bytes_after > wrap mà vẫn EXACT — take đã chọn không thể
  phục vụ pull đó). Cả 375 pull còn lại cũng có push_lag median
  21.088 ms — toàn bộ phân phối clean của run này lệch (flood 8,68
  + fallback http sau error-event tạo 2 pipeline sống song song;
  take của pipeline này bị gán cho pull của pipeline kia). Cùng mẫu
  với N2EL r1 offline (130/546 vi phạm, 23,8%; clean median
  33.928 ms). Các run 1 pipeline: 0–3 vi phạm.
- **Verdict B1 (theo đúng luật đã đăng ký): KHÔNG PHÂN BIỆT.**
  Khoảng spliced 7–86 ms nằm trọn trong khoảng clean −5..155 ms
  (chồng lấn 100% > 50%), dù median lệch một chiều (spliced 10–86
  vs clean bulk 0). Luật khoảng đã đăng ký không cho kết luận
  "phân biệt" trên dữ liệu này — ghi đúng như vậy, không bẻ luật.
  Diễn giải thêm (ngoài luật): spliced pull nào cũng nằm trong cửa
  sổ 7–86 ms sau burst flood; clean pull nào cũng nằm ở 0 ms (live)
  hoặc ở đuôi đóng băng. Lag là dấu vết của burst, không phải
  nguyên nhân — nguyên nhân là wrap (§4).

## 4. B2 + kiểm chứng wrap — lag không giải thích được ring

### 4.1 Pull tương đương ở R8 (req_off trùng tập spliced của control)

| Run | req_off=9939 (pull scan đầu, adapter blob) | 6 req_off còn lại (adapter http) |
|---|---|---|
| P2R8 r1 | push_lag 56, residence 9, splice_delay 47 | 0 / 0 / 0 (live) |
| P2R8 r2 | 63 / 35 / 28 | 0 / 0 / 0 (1 pull −1) |
| P2R8 r3 | 37 / 11 / 26 | 0 / 0 / 0 |
| P2R8 r4 | 78 / 9 / 69 | 0 / 0 / 0 (1 pull −1) |
| P2CTL r5 (sạch) | 155 / 60 / 95 | 0 / 0 / 0 |
| P2SEEK r1/r2 | 64 / 10 / 54; 80 / 14 / 66 | 0 / 0 / 0 |

- Pull 9939 ở R8 có lag CÙNG DẢI — thậm chí LỚN HƠN — pull spliced
  của control (P2CTL spliced: push_lag 7–86, residence 7–65,
  splice_delay 0–21), nhưng phục vụ ĐÚNG. **B2 ĐẠT kỳ vọng prereg:**
  lag tại điểm tương đương của R8 không khác hệ thống so với pull
  spliced của control → lag không giải thích được khác biệt ring.
- Phân phối residence toàn run: P2R8 median 0, p90 0, max 9–35 ms;
  P2CTL sạch median 0, p90 0 — giống nhau.
- Đối chứng N2 offline: N2R8 pull 9939 có push_lag 44–187 ms (r6
  mỏng: 2.300 ms, residence 307 ms — metadata chậm, vẫn phục vụ
  đúng), residence 10–14 ms — cùng chiều.

### 4.2 Kiểm chứng wrap trực tiếp (`p2_wrapcheck.py`, hidden_files)

Với mỗi pull spliced, lấy take gần nhất chứa byte ĐÚNG (req_off)
trên cùng adapter trước T, đếm byte take trên adapter đó từ take này
tới T:

| Nhóm | Vượt wrap 4.194.304 | Chưa vượt (mức) |
|---|---|---|
| P2CTL r6/r7/r8 (21 logic) | **18/21** | 3 ca: 4.124.672 (98,3%), 4.055.040 (96,7%), 4.001.792 (95,4%) |
| N2CTL r1 + N2EL r1/r2 (17 logic) | **15/17** | 2 ca (N2EL r2): 4.178.080 (99,6%) ×2 |
| **Gộp** | **33/38** | 5 ca, tất cả ≥95,4% wrap |

- 5 ca chưa vượt đều ở 95–100% wrap — sai số đếm (take chưa map
  được, overhead buffer, biên block 4096) chỉ làm con số THIẾU đi,
  không làm thừa: take đúng bị gán nhầm sang adapter khác (nếu có)
  cũng chỉ làm mốc take muộn hơn → đếm ít hơn. Hướng bias ủng hộ
  kết luận, không chống lại.
- Đối chứng gần-miss: pull sạch req_off=9939 ở P2CTL r5 có
  take_bytes_after = 3.764.384 (89,7% wrap) → phục vụ đúng.
  Ngưỡng nằm giữa 3,76 MB (sạch) và 4,00 MB (splice).
- Kết luận §4: **splice ⟺ số byte take kể từ lúc byte đúng được load
  vượt (xấp xỉ) kích thước ring.** Lag wall-clock chỉ là đồng hồ đo
  burst đi kèm, không phải biến quyết định.

## 5. B3 — Seek chậm/lỗi (vấn đề UX riêng, không trộn vào splice)

| Run | seeking → seeked (page t) | Seek thực | seekedOk | errEvents | preloadWait / preloadFull |
|---|---|---|---|---|---|
| P2SEEK r1 | 20,22 → 20,66 s | **0,44 s** | TRUE | 0 | 20.052 ms / FALSE |
| P2SEEK r2 | 20,42 → 20,86 s | **0,44 s** | TRUE | 0 | 20.055 ms / FALSE |
| (đối chứng) N2EL r1 | 31,48 → 49,08 s | 17,6 s | FALSE | 1 | 19.304 ms / TRUE |
| (đối chứng) N2EL r2 | 20,56 → 22,56 s | 2,0 s | TRUE | 0 | 20.006 ms / FALSE |

- Đính chính cách đọc: `seekMs` trong JSON là thời điểm bắt đầu seek
  tính từ đầu page (t0), KHÔNG phải thời lượng seek. Thời lượng seek
  thật = seeked − seeking từ event log (bảng trên). N2 LIMITS §7 mục 3
  ("seek 17,6 s") là thời lượng thật của N2EL r1 — vẫn đúng.
- **Seek tự nó NHANH (0,44 s cả 2 run), không lỗi.** Độ trễ người
  dùng thấy là **preload-wait chạm trần 20 s mà không full buffer
  (2/2)** — tái hiện mẫu M2 P/P0 + N2EL r2 (element kẹt ở trần buffer
  khi paused). Đây là vấn đề UX độc lập: chờ 20 s trước seek mà
  buffer vẫn không đầy. Không dùng để diễn giải splice.
- P2SEEK 0 splice cả 2 run (dù J2=4 MiB) — không gộp vào Fisher hay
  B1/B2 (protocol khác: có seek + fresh-element).

## 6. Caveat bắt buộc + vận hành

1. **Phạm vi:** chỉ c8 (8,2 MB) + protocol wall-30s + adapter-level
   lag. Shim không thấy bên trong ring queue2; lag đo là proxy
   adapter (push vào adapter → take ra khỏi adapter), không phải lag
   slot trong ring. Nếu pull được phục vụ từ ring mà không qua
   adapter take nào thì trường hợp đó được ghi riêng — thực tế
   KHÔNG gặp ca nào như vậy (match 100%, 0 no-take).
2. **Attribution elem→adap chưa có:** shim không ghi quan hệ
   qtdemux/playbin ↔ adapter; gán take cho pull bằng "take chứa O'
   mới nhất" có thể gán nhầm giữa 2 pipeline sống song song. Tự-kiểm
   `take_bytes_after > wrap` bắt được lỗi này ở pull sạch (P2CTL r6
   48,6%, N2EL r1 23,8%) — đã loại các run đó khỏi so sánh clean.
   Pull spliced có take_bytes_after 0–28 KB (tự nhất quán) nên không
   bị ảnh hưởng. Nợ cho vòng sau: gán elem→adap qua L2BINADD/
   playbin (xem §7 mục 4).
3. **Tải máy:** P2CTL r1–r4 void chạy lúc load1 10,31 (luồng p4 chạy
   song song); lượt hợp lệ chạy lúc load1 0,68–5,43, RAM khả dụng
   752–2.715 MB. Sóng tải không làm lệch hướng kết luận (spliced và
   sạch phân bố đều qua các mức tải; r6 flood 8,68 xảy ra lúc load1
   1,32 — tải thấp mà flood vẫn cao nhất).
4. **Số pull logic vs dòng:** mọi thống kê lag dùng pull logic
   (dedupe (ms, req_off, served)); số dòng recount (N2: 14, 16, 4)
   giữ nguyên để đối chiếu.
5. **PULL t0 lấy TRƯỚC `real_pull_range`:** take phục vụ có thể ở
   ms = T hoặc T+1..10 (take_after_pull: 3–118 pull/run ở nhóm
   clean — pull live-served; 0 ở mọi pull spliced). splice_delay âm
   nhỏ (−10..0) ở pull sạch là hệ quả của cách lấy t0, không phải
   lỗi đo.
6. **N2EL r1 clean không dùng để đối chứng B1** (vi phạm 130/546,
   median push_lag 33.928 ms là sai do gán nhầm pipeline — xem §3.2).
   Chỉ dùng pull spliced của N2EL (tự nhất quán) làm đối chứng.
7. **Không có run mỏng ảnh hưởng kết luận:** mọi run P2 đều
   frames ≥ 384, last pull 30,4–31,4 s phủ hết wall (trừ P2SEEK wall
   dài hơn do preload+seek).

## 7. Nợ mở cho đợt sau

1. **Ring 8 MiB — production vẫn bế tắc (giữ đề xuất M2/L2/N2):**
   Fisher đã đạt (N2), lag đã đo trực tiếp (P2: splice là wrap theo
   số byte take, lag chỉ là dấu vết) — nhưng 3 rào cản kiến trúc
   không đổi (shim không ship được; repo không có API đổi ring
   queue2 của WebKit; không có mức cố định phủ video user). Hướng
   duy nhất còn mở là can thiệp WebKit (cần quyết riêng).
2. **Cơ chế flood→wrap: ĐÃ ĐO XONG ở mức adapter (luồng này).**
   Còn mở ở mức ring-nội-bộ: lag slot trong ring (ghi/đọc của queue2)
   vẫn chưa đo được vì shim không có hook trong ring — cần hook mới
   (vd chặn `gst_queue2` nội bộ hoặc đo qua DOT + timing) nếu muốn
   đi sâu hơn; không bắt buộc vì wrap-count đã giải thích đủ.
3. **Seek/preload UX:** preload-wait chạm trần 20 s không full
   buffer tái hiện 2/2 (P2SEEK) — điều tra riêng vì sao element kẹt
   ở trần buffer khi paused (mẫu M2: suspend ~17,5 s). Seek tự nó
   nhanh (0,44 s) nên không phải ưu tiên sửa seek.
4. **Gán elem→adap tuyệt đối (mới):** tự-kiểm attribution phát hiện
   gán nhầm pipeline ở run 2-pipeline (P2CTL r6 48,6% clean,
   N2EL r1 23,8%). Vòng sau nên gán qua L2BINADD (playbin → con) +
   PULL el= để take/pull cùng pipeline mới được so — nếu không, mọi
   so sánh clean ở run đa-pipeline đều phải đi kèm tự-kiểm.
5. **Nợ đứng yên từ đợt 112 (xem LIMITS gộp 112 §10):** G1 + mù
   #22/#28/#29/#30 chờ user quyết; E4 đóng có điều kiện, cần đợt xác
   nhận tải cao; zombie lượt 5 (quyết bar CDP đã có ở parent);
   điểm gãy tải cần tích đủ tick; ngưỡng WebKit ≤60 ms cần 1 lượt
   yên; postboot-check cập nhật tham chiếu lên #44 (header vẫn ghi
   #42 — script vẫn PASS vì check chức năng không phụ thuộc boot);
   O8 Chromium mirror watch.ignored (nợ N8); không sửa lock script
   khi có acquire đang chạy; birefnet 0 lần thành công; TTS 39 CẤM
   kiểm lại; ci-security.yml vẫn 403 chờ user; release gate.

## 8. Batch stage (KHÔNG push)

`phase9-round113-p2-ringlag.txt` (5 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_113p2_2mib.mjs` (runner P2: copy
  N2, port 8943, Xvfb :198, OUT 113p2, mode P2CTL/P2R8/P2SEEK;
  72.791 B — >37.768, cần `ENABLE_PRIVSEP=0` khi push)
- `benchmarks/render/p2_lag_113.py` (phân tích lag range-containment +
  tự-kiểm attribution + bucket; 18.576 B)
- `benchmarks/render/p2_equiv_113.py` (B2: pull tương đương ở R8;
  2.454 B)
- `benchmarks/results/webkit-blob-flaky-113p2-2mib.json` (14 case:
  P2CTL r1–r8 (r1–r4 void — xem §0), P2R8 r1–r4, P2SEEK r1–r2;
  63.794 B — >37.768, cần `ENABLE_PRIVSEP=0` khi push)
- `docs/PHASE9_ROUND113_P2_RINGLAG_LIMITS.md` (file này)

Không stage binary. Dữ liệu thô đầy đủ ở `hidden_files/round113-p2/`
(prereg + Addendum A, progress, `p2_lag_n2_offline.json` 9,7 MB +
`p2_lag_p2.json` 10,4 MB — KHÔNG stage vì oversize,
`p2_equiv_p2.txt`, `p2_wrapcheck.py` + output, 3 log chạy, pull/gst
10 run, xvfb198.log, postboot-check-b44-p2.log). KHÔNG push.
