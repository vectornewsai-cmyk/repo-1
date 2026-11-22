# PHASE9_ROUND136_T3_C2_LIMITS — T3 đợt 136: bước 2 với dữ liệu mới lượt yên #13 (THƯA EVENT — (c2)=1)

> **Verdict: BƯỚC 2 CÓ DỮ LIỆU MỚI — lượt yên #13 ĐO ĐƯỢC (1 attempt hợp lệ, 20/20 pass). NHƯNG THƯA EVENT: (c2) chỉ 1 seq (334, lag +1f) so với 7 seq ở lượt #12. P1 YẾU (1/1, p≈0,22), P2 ĐÚNG (0 lag âm), P3 YẾU (1/1, p≈0,30), P4 KHÔNG ĐUNG theo khoảng đếm (thuần +1f = 1 < 2; tổng skp=0 = 1 < 2; skp=1 = 0 ĐÚNG; lag ≥+5f = 0 ĐÚNG), P5 KHÔNG ĐUNG LẦN ĐẦU (snap 52 ms vs 34–48; label-floor +1 = 62,7% vs 63–76; run ≥3 = 23 vs 13–22; chỉ raw 10 ms trong 8–10), P6 ngoài khoảng 2/3 bin (không verdict theo thiết kế), P7 ĐÚNG (coverage 1/1, 0 drawSrc trễ — làm yếu desync, lần kiểm chứng thứ 2 liên tiếp). tickCost median 58,0 ms — ĐẠT ngưỡng ≤60 ms nhưng biên chỉ còn 2 ms (cao nhất 11 lượt). Logger nới KIỂM CHỨNG RUNTIME LẦN 2 LIÊN TIẾP (c2DrawLog n=994, loop 1–21, 20 wrap).**
> **KẾT LUẬN ĐIỀU TRA (c2): CHƯA ĐỦ BẰNG CHỨNG ĐẠT VERDICT CUỐI — ĐỀ XUẤT GIỮ FIX TIẾP QUA ĐỢT 137 (xem §5). Hướng bằng chứng vẫn nhất quán (mọi (c2) đều +1f, đúng cuối run, đóng băng-tai-tick; P7 8/8 coverage, 0 trễ), nhưng lượt #13 đóng góp gần như không có sức mạnh thống kê mới (n=1), P5 lần đầu ngoài khoảng và P4 ngoài khoảng đếm. KHÔNG REVERT preview.tsx trong đợt này (quyết parent §12.3(a) đợt 135: GIỮ fix làm instrumentation tới khi điều tra đạt verdict — điều kiện verdict chưa xảy ra). Không đổi production.**

## 0. Môi trường lúc T3 làm việc (05:41–06:2xZ 18/11, chờ T4.done + T8.done)

- Boot hiện tại: **1ca1feaa-af3b-41dc-aaae-34376329b0a3**, btime /proc/stat **05:29:18Z** (T5 ghi 05:29:34Z trong cờ POSTBOOT_PASS — chênh 16 s, cùng boot_id, cùng mẫu đợt 135; /proc/stat là chuẩn của T3). **0 reboot** trong phiên T3 (boot 1ca1feaa xuyên suốt từ lúc mở đợt tới lúc đóng bước 2).
- RAM available: 1472 MB lúc 05:41Z → 5976 MB (05:45Z, balloon xả) → 3565 MB (05:55Z) → 2139 MB (06:05Z).
- `preview.tsx` lúc bắt đầu: md5 **530e10a7** (fix GIỮ theo quyết parent §12.3(a) đợt 135 — parent đã khôi phục lúc mở đợt; T3 kiểm lại 05:41Z và 06:15Z đều 530e10a7). **KHÔNG REVERT.**
- `~/workspace/repo-1` **không phải git repo** — md5 là phương pháp đối chiếu file duy nhất.
- Chốt chặn `round-in-progress.md` còn đó — T3 KHÔNG xóa (chỉ T10 xóa).

## 1. Giai đoạn A — chuẩn bị script bước 2 (05:41–05:45Z, TRƯỚC khi có dữ liệu)

- Script mới `hidden_files/round136-t3/t3-step2-verify136.py` (dựa trên script đợt 135, giữ nguyên logic prereg/(c2)/P1–P7/p nhị thức; **sửa F-135-T3-3:** nhánh JSON đầy đủ nay in phân phối loopNo + loop≥2/loop≥3 + wraps + point + frameIdx distinct + log max − flip ở mục P7).
- **Validate khô TRƯỚC khi T4.done có (05:41–05:45Z):**
  - Dry-run 1 — JSON lượt #12 đầy đủ (sha `2efceefd…`): exit 0, **khớp 100%** output đợt 135 — diff chỉ đúng 3 dòng mới (loopNo={1:63…22:1}, loop≥2=1262, loop≥3=1196, wraps=21; point drawSrc 682/rawUnit 643, frameIdx distinct 65, log max − flip +52425 ms; dòng LOGGER). File `t3-step2-dryrun-136-135a1.txt`.
  - Dry-run 2 — JSON lượt #10 đầy đủ (sha `e3ca1ac5…`): exit 0, **khớp 100%** file dry-run đợt 134 — diff chỉ 3 dòng mới (loopNo={1:66, 2:71}, loop≥3=0, wraps=1; log max − flip −10119 ms). File `t3-step2-dryrun-136-133a1.txt`.
  - Dry-run 3 — JSON partial đợt 134 (sha `b402b3f3…`): exit 0, diff **RỖNG** so với file dry-run đợt 135. File `t3-step2-dryrun-136-134partial.txt`.
- Chờ T4.done + T8.done bằng `wait-t4t8.sh` (poll 10 phút, hạn 07:30Z): **T4.done xuất hiện giữa poll 05:55Z và 06:05Z; T8.done 06:08Z; wait thoát 06:15:10Z, exit 0.** 0 reboot trong lúc chờ (khác đợt 135 — wait lần này không bị giết).

## 2. Giai đoạn B — bước 2 trên JSON lượt yên #13 (phân tích độc lập từ JSON gốc)

File: `hidden_files/round136-t4/preview-b-f3-flip-webkit-t4-attempt1.json` — size **2.944.128 B**, sha256 `266767c0f7fe270dc7f0673f78ad5c341ed4d3decac2399237d777b1282a2847` (khớp T4 + `t5-c2-input.sha256`), engine webkit 27.2, pageErrs=[], `partial=None`. Script chạy 06:1xZ, exit 0, output `hidden_files/round136-t3/t3-step2-136a1.txt`.

### 2.1 Số liệu độc lập (T3) — đối chiếu T4 + T5-pha-2

| Hạng mục | Số độc lập (T3) | T4 | T5 pha 2 | Khớp? |
|---|---|---|---|---|
| flip | afterPass=5, wallMs=29731, passes=20 | như vậy | như vậy | ✓ |
| blendTick | n=411, post (flip+2000, viaRvfc=0) = 307, seq 104→410 | n=411, post 307 | seq 104→410 | ✓ |
| tickCost | n=516, median **58,0** ms (p90 89, max 153, min 31); post n=381 median **58,0** ms → **ĐẠT (≤60), biên 2 ms** | n=516 median 58,0; post n=381 median 58,0 | — (không tính tickCost) | ✓ |
| histogram (m*−label) | n_ghost=614, nomatch=0, hist {-13: 5, -12: 6, -11: 2, -9: 2, -5: 1, -1: 46, 0: 258, +1: 74, +2: 126, +3: 87, +4: 7} | hist y hệt | rerun y hệt (xem §3) | ✓ |
| snap/raw-label | snap median **52** ms (n=614), raw median **10** ms (n=614); occ0 snap 52 / raw 10 (n=307) | snap 52 (mean 54,4, p90 87), raw 10 | snap 52,0 (n=307 occ0), raw 10,0 | ✓ |
| label-floor | {0: 229, 1: 385} → +1 = **62,7%** (63–76) | không báo riêng | {0:229, 1:385} | ✓ |
| curPix run ≥3 tick | **23 run** [(104,109,6), (119,123,5), (128,130,3), (140,146,7), (150,152,3), (162,168,7), (186,188,3), (207,213,7), (228,232,5), (251,255,5), (258,260,3), (271,275,5), (290,295,6), (304,306,3), (310,313,4), (332,334,3), (335,337,3), (344,346,3), (347,352,6), (357,359,3), (369,371,3), (384,386,3), (388,394,7)] | 23 run | 23 run, y hệt danh sách | ✓ |
| (c2) skp=0 | n=**1**: (334, 16, 15, 1) — lag +1f | n=1, y hệt | n=1, y hệt | ✓ |
| (c2) skp=1 | n=**0** | 0 | 0 (labellag skp=1: (c)=0) | ✓ |
| (c) dạng ngờ skp=0 | n=1, skp=1 n=0 | 1 / 0 | 1 / 0 | ✓ |
| c2DrawLog | n=**994** (drawSrc 516 / rawUnit 478); loopNo 1–21 {1:36, 2:58, 3:50, 4:48, 5:60, 6:38, 7:50, 8:52, 9:58, 10:52, 11:51, 12:1, 13:53, 14:48, 15:48, 16:50, 17:52, 18:40, 19:51, 20:44, 21:54}; **loop≥2 = 958, loop≥3 = 900**; wraps (frameIdx giảm) = **20**; frameIdx 0–71 (distinct 60); wallMs 11164→89072 (span 77.908 ms); srcKind 'canvas 1280x720' 994/994; readyState 4 994/994; seeking False 994/994 | n=994, byLoop y hệt, wraps 20 | n=994, loopNo [1..21], wraps 20, B4 liệt kê 10 wrap đầu | ✓ |
| P7 coverage | **1/1** (seq 334, tBlend=74639, log gần nhất 74695, delta +56 ms); blendTick hậu-flip trong ±500 ms của log: 307/307 | 1/1, delta +56 | 1/1, delta +56 | ✓ |
| P7 lag gần (c2) | floor(ct*30)−frameIdx: {-1: 4, 0: 8}; chỉ drawSrc {-1: 2, 0: 4}; cặp rawUnit−drawSrc {0: 6} | — | {-1: 4, 0: 8}; drawSrc {-1: 2, 0: 4}; cặp {0: 6} | ✓ |
| Lớp B | (không thuộc bước 2 — ghi theo T4) 5/5 ĐẠT | 5/5 | — | ✓ |
| F6' (skippedLatest=1) | 0 vi phạm thật / 77 tick (theo labellag T4 — T3 không tính lại, chỉ đối chiếu) | ĐÓNG lần 2 liên tiếp (100% ≥90%, n=77 ≥30) | — | ✓ |
| lag ≥+5f | 0 event | 0 | — | ✓ |

### 2.2 P1–P7: từng cái KIỂM ĐƯỢC — kết quả phân hóa (lần đầu không còn "tất cả ĐÚNG")

- **P1 (curPix run ≥3 tick, (c2) gần run-end): YẾU** — k=1/1 (seq 334 đúng cuối run (332,334,3), dist 0), baseline 69/307 = 0,225, p = 0,225. n=1 → script kết luận YẾU theo đúng quy tắc (n≤2, không kết luận mạnh). T5 độc lập (signed-dist): baseline 67/307 = 0,218, p = 0,218 — lệch 2 tick do định nghĩa baseline khác nhau (xem F-136-T3-1); k=1/1 không đổi.
- **P2 (100% (c2) lag ≥ +1f, 0 lag âm): ĐÚNG** — 1/1 lag +1f, 0 lag âm. (Caveat: n=1 — đúng theo nghĩa đen, sức nặng thấp.)
- **P3 (A1, đóng băng-tại-tick): YẾU** — đóng băng 1/1 [334]; tick bắt kịp 0; baseline 92/306 = 0,301, p = 0,301. n=1 → YẾU. T5 độc lập: 1/1, baseline 92/306 (30,1%) — khớp chính xác.
- **P4 (thuần +1f 2–8; tổng skp=0 2–12; skp=1 = 0; lag ≥+5f = 0): KHÔNG ĐUNG THEO KHOẢNG ĐẾM** — thuần +1f = 1 (< 2); tổng skp=0 = 1 (< 2); skp=1 = 0 (ĐÚNG); lag ≥+5f = 0 (ĐÚNG). Đây là hệ quả của mẫu nhỏ (chỉ 1 (c2)), không phải bằng chứng chống lại cơ chế ghost-freeze: event duy nhất vẫn thuần +1f, vẫn freeze, vẫn 0 skp=1 / 0 lag lớn. Ghi rõ để T10 khỏi đọc "P4 SAI" thành "cơ chế bị bác".
- **P5 (snap-label median 34–48 ms; raw-label 8–10 ms; label-floor +1 63–76%; run ≥3 tick 13–22): KHÔNG ĐUNG — LẦN ĐẦU KỂ TỪ KHI PREREG ĐƯỢC ĐẶT** — snap 52 ms (vượt 4 ms); raw 10 ms (trong, ở biên trên); label-floor +1 = 62,7% (thiếu 0,3 điểm % — cần 387 occ, có 385, thiếu đúng 2 occ); run ≥3 = 23 (vượt 1). Cả 3 lệch đều cùng chiều với tickCost tăng (median 58 vs 40 ms đợt 135): lượt chậm hơn → snap-label dài hơn, curPix giữ lâu hơn → nhiều run ≥3 hơn, label-floor dịch nhẹ. Đây là "chữ ký lượt chậm", không phải mâu thuẫn mới về (c2). Nhưng P5 đã chính thức ngoài khoảng — T10/parent xem có cần hiệu chỉnh khoảng P5 không (xem §5, §8).
- **P6 (khoảng thực nghiệm 8 lượt, KHÔNG verdict): NGOÀI KHOẢNG 2/3 BIN** — bin0 = 42,0% (33–39, vượt 3,0 điểm %); +1/+2 = 32,6% (33–53, thiếu 0,4 điểm %); +3 = 14,2% (3–19, trong). Đuôi +3 tăng mạnh so với đợt 135 (3,3% → 14,2%), đuôi âm tăng (6,3% → 10,1%, 62/614 occ); xuất hiện bin mới −13/−12/−5/+4 — m* matching nhiễu hơn khi tick chậm. Không verdict theo thiết kế; ghi để đợt sau theo dõi.
- **P7 (log draw phủ ≥1 seq (c2), drawSrc không trễ sau ct): ĐÚNG — KIỂM ĐƯỢC LẦN 2 LIÊN TIẾP** — coverage 1/1; tại 12 entry log trong ±500 ms của tick (c2): floor(ct*30)−frameIdx chỉ −1/0, **0 entry drawSrc trễ ≥+1f** → làm yếu giả thuyết desync seek-latency lần thứ hai. Cặp rawUnit−drawSrc gần nhất: {0: 6} (cùng frame). Caveat giữ nguyên và mạnh hơn đợt 135: log còn thưa hơn (drawSrc gap median **109,0 ms** vs 82,0 ms đợt 135, n=515, >66 ms: 492) nên không phân giải lệch 1 frame; chỉ có 12 entry gần (c2) (đợt 135: 173 entry) — P7 là "làm yếu desync", không phải "bác bỏ tuyệt đối". Cộng dồn P7: coverage **8/8** (7/7 + 1/1), 0 drawSrc trễ trong cả hai lượt kiểm được.
- **Cộng dồn (prereg đứng nguyên, không sửa sau khi thấy dữ liệu):** P1 **22/22** (21/21 + 1/1), P3 **21/22** (20/21 + 1/1). Ghi rõ: lượt #13 đóng góp 1/1 vào cả hai — cộng dồn tăng về số đếm nhưng KHÔNG tăng sức mạnh thống kê (p lượt #13 ≈ 0,22 / 0,30, không có ý nghĩa); sức mạnh vẫn nằm ở 21/21 và 20/21 tới lượt #12.
- **Ngưỡng ≤60 ms GIỮ (đồng ý với T4):** chuỗi 11 lượt yên hợp lệ nay 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / **58,0** ms, trung bình **47,3 ms**. Không đề xuất đổi ngưỡng, bar hay DEF từ một lượt duy nhất — nhưng đây là median cao nhất 11 lượt, biên chỉ 2 ms; nếu đợt 137 median vẫn ≥55 ms thì phải bàn lại (xem §5, §8). **Đính chính số cũ:** trung bình 10 lượt trước là **46,3 ms** (tổng 462,5 / 10 = 46,25), không phải 46,6 ms như LIMITS đợt 135 đã ghi — lỗi này T1-136 đã phát hiện (F-136-T1-3), T3 chỉ kiểm lại độc lập và mang sang (xem F-136-T3-3).

### 2.3 Logger đã nới — KIỂM CHỨNG RUNTIME LẦN 2 LIÊN TIẾP

- c2DrawLog n=994 phủ **loop 1–21 đầy đủ**: loop 3–11 và 13–21 mỗi loop 38–60 entry; loop≥3 = 900 entry (90,5% log); **20 wrap**. Caveat biên: loop 1 chỉ 36 entry (log bắt đầu wallMs 11164, giữa loop 1 — logger bắt đầu ghi sau warm-up); loop 12 chỉ 1 entry biên tại wrap. Không ảnh hưởng coverage (seq 334 ở loop ~20, delta +56 ms).
- 1 epoch duy nhất (không re-arm giữa chừng); log phủ toàn bộ hậu-flip (log max − flip = +59.341 ms); blendTick hậu-flip 307/307 trong ±500 ms của log.
- **Kết luận: fix loop-gate nới + re-enable không xóa mảng TIẾP TỤC HOẠT ĐỘNG ĐÚNG ở runtime — lượt thứ hai liên tiếp.** Đây là bằng chứng tích lũy cho quyết GIỮ fix (xem §5).

### 2.4 Quan sát thêm: tỉ lệ (c2) giảm

- Tỉ lệ (c2)/tick post: lượt #12: 7/412 = 1,70%; lượt #13: 1/307 = 0,33% — giảm ~5 lần. P(X≤1 | n=307, p=7/412) = **0,033** (nhị thức chính xác, tính lại độc lập). Chỉ có ý nghĩa biên (một phép so sánh duy nhất, p≈0,03) — ghi là quan sát, không phải verdict: có thể là dao động ngẫu nhiên, cũng có thể lượt chậm hơn làm thay đổi cách ghost event được lấy mẫu (ít tick post hơn: 307 vs 412; nhưng tỉ lệ theo tick đã tính tới điều đó). Đợt 137 cần xem tỉ lệ này có hồi về ~1–2% không.

## 3. Đối chiếu chéo với T5 pha 2

- **T5 pha 2 CÓ dữ liệu mới.** File `round136-t5/t5-c2-drawlog-analysis.txt` (script độc lập `t5-c2-drawlog-analysis.py`): **khớp 100% mọi số so sánh được** — (c2) 1 seq/lag, coverage 1/1 + delta +56 ms, loopNo 1–21, wraps 20, P1 1/1 (baseline signed-dist 67/307, p≈0,22), P3 1/1 (baseline 92/306, 30,1%), skew occ0 snap 52 / raw 10, label-floor {0:229, 1:385}, P7 lag {-1:4, 0:8} / drawSrc {-1:2, 0:4} / cặp {0:6}, drawSrc gap median 109,0 ms, B2 cặp {0:478}, B3 mỗi loop 0 lần lùi frame.
- **T5 LIMITS §8 xác nhận lại:** "P1/P3 YẾU, P4/P5 ngoài khoảng ở biên, P2 + P7 ĐÚNG, P6 trong/ngoài khoảng thực nghiệm (không verdict); cộng dồn P1 22/22, P3 21/22; ngưỡng ≤60 ms GIỮ; logger kiểm chứng runtime lần 2 liên tiếp" — **khớp hoàn toàn kết luận bước 2 của T3 (§2.2)**. T5 cũng ghi P5 "lần đầu không dung kể từ khi prereg được đặt" — khớp T3.
- **T5 histogram rerun KHÔNG độc lập (lặp lại mẫu đợt 135):** `t5-histogram-rerun.txt` giống hệt output script T3 `t3-step2-136a1.txt` (diff chỉ khác đường dẫn file tương đối/tuyệt đối ở dòng đầu) — T5 đã chạy lại chính script bước 2 của T3, không phải implementation riêng. Ghi rõ để T10 khỏi tính đây là kiểm chứng độc lập thứ ba cho histogram/P1/P3; kiểm chứng độc lập thật cho P1/P3/coverage là T5 `t5-c2-drawlog-analysis.py` + analyzer của T4.
- T5 không tính tickCost — không mâu thuẫn với số T3 (median 58,0).
- **1 khác biệt duy nhất: baseline P1 (xem F-136-T3-1)** — T3 (unsigned dist) 69/307, T5 (signed-dist) 67/307; cả hai đều cho k=1/1, p≈0,22–0,23, verdict YẾU không đổi. Không phải lệch số liệu.

## 4. Lỗi quy trình của T4 trong lượt này (ghi lại, không thuộc bước 2)

- **F-136-T4-1 (T4 tự ghi §5 LIMITS T4):** poll #6 blockers=6, lại không xác định được danh tính (không có ps snapshot) — bài học đợt 135 §10.3 ("đợt sau nên log ps snapshot khi blockers>0") KHÔNG được đưa vào `poll-wait-t4-136.sh` khi adapt script. Không mất dữ liệu đo (cửa cũng không mở ở poll đó vì load5 >2); chỉ mất khả năng truy vết. T4 đã đề xuất khắc phục cho đợt sau (ghi ps khi blockers>0). T3 không sửa gì thêm.
- **F-136-T4-2 (T4 tự ghi, ghi chú — không phải lỗi):** load1 max 2,42 (class-B) nằm ngoài các mẫu sampler của T4 (0,95–1,17) — mẫu max nằm giữa các lần ghi log, cùng mẫu F-133-8. Không ảnh hưởng verdict B2 (2,42 ≤ 4, ĐẠT).
- **F-135-T4-1 ĐÃ KHẮC PHỤC:** adapt đợt 136 đã grep toàn bộ chuỗi `135`/`134` (= 0 kết quả) + `ls` file được gọi — cửa mở lần duy nhất (poll #9) chạy attempt ngay, không bỏ lỡ.

## 5. KẾT LUẬN ĐIỀU TRA (c2): CHƯA ĐỦ BẰNG CHỨNG ĐẠT VERDICT — ĐỀ XUẤT GIỮ FIX TIẾP QUA ĐỢT 137

Câu hỏi của brief: điều tra (c2) đã đủ bằng chứng đạt verdict chưa (GIỮ fix tiếp / đã đủ để quyết)? Trả lời theo từng mảnh bằng chứng:

**Ủng hộ "đã đủ" (mạnh, nhưng không mới ở lượt này):**
- (c2) luôn thuần +1f, 0 lag âm, 0 skp=1, 0 lag ≥+5f — qua 13 event cộng dồn (#10: 5, #12: 7, #13: 1), không một ngoại lệ nào về hướng lag.
- P1 22/22, P3 21/22 cộng dồn; P7 coverage 8/8, 0 drawSrc trễ qua 2 lượt kiểm được liên tiếp.
- F6' đóng lần 2 liên tiếp (77/77 + 75/75 tick không vi phạm thật).
- Logger nới kiểm chứng runtime lần 2 liên tiếp (loop 1–21, 20 wrap) — fix làm đúng nhiệm vụ instrumentation.

**Chống lại "đã đủ" (mới ở lượt này, và là lý do chưa quyết):**
- Lượt #13 chỉ có n=1 (c2): P1/P3 YẾU (p≈0,22/0,30), không thêm sức mạnh thống kê mới; tỉ lệ (c2) giảm 1,70% → 0,33% (p≈0,033, ý nghĩa biên) — chưa rõ là dao động hay lượt chậm làm thay đổi cơ chế lấy mẫu.
- P5 lần đầu ngoài khoảng (3/4 tiêu chí con) và P4 ngoài khoảng đếm — các khoảng prereg đặt từ 8 lượt nhanh hơn (median 39,5–56 ms) đang bị lượt chậm nhất (58 ms) phá vỡ ở biên. Nếu khoảng prereg không còn mô tả được lượt chậm thì verdict dựa trên prereg cũ sẽ thiếu vững.
- P7 lần này chỉ dựa trên 1 seq + 12 entry log gần (đợt 135: 7 seq + 173 entry), log thưa hơn (gap median 109 ms) — "làm yếu desync" lần 2 là thật nhưng mỏng hơn lần 1.

**Đề xuất (có bằng chứng, không đổi production):**
1. **GIỮ fix 530e10a7 tiếp** — giữ đứng làm instrumentation chẩn đoán qua đợt 137 (đúng quyết parent §12.3(a) đợt 135; KHÔNG revert đợt này, KHÔNG revert ở đợt 137 trừ khi parent quyết khác).
2. **Đợt 137 là lượt quyết định cho điều tra (c2):** nếu lượt #14 cho (c2) ≥3 với mẫu đúng hướng (lag +1f, run-end, frozen, P7 coverage đầy) thì cộng dồn đủ mạnh để parent quyết verdict cuối (đóng điều tra, giữ fix làm instrumentation vĩnh viễn hoặc gỡ sau khi verdict đã có). Nếu #14 cũng thưa (n≤2) thì parent quyết trên bằng chứng cộng dồn hiện có (P1 22/22+, P3 21/22+, P7 8/8) và chấp nhận P5/P6 cần hiệu chỉnh khoảng — không kéo dài điều tra vô hạn vì thưa event.
3. **Ngưỡng tickCost ≤60 ms: GIỮ, không đổi từ một lượt** (đồng ý T4) — nhưng nếu #14 median vẫn ≥55 ms thì bàn lại ngưỡng/bar hoặc điều tra tải song song (load1 max 2,42 lúc đo, 8–10 luồng chạy cùng lúc; RAM 3,3–6,0 GB loại trừ RAM là yếu tố thúc đẩy — T8 cũng đã bác H1 RAM tuyệt đối thấp gây kẹt bằng 4 bằng chứng độc lập).
4. **P5/P6 cần xem lại khoảng ở đợt sau:** các khoảng đặt từ lượt nhanh có thể cần hiệu chỉnh cho lượt chậm (snap-label, run ≥3, bin0/+1/+2) — việc của T3/T10 đợt sau, không sửa prereg giữa chừng trong đợt này.

## 6. Trạng thái sau đóng (kiểm cuối 06:2xZ 18/11)

- preview.tsx md5 cuối: **530e10a7** (GIỮ fix; KHÔNG revert; không sửa cây trong đợt này).
- Boot 1ca1feaa còn sống; 0 reboot trong phiên T3 (wait-script không bị giết lần nào).
- Không process đo nào còn chạy của T3 (chỉ đọc file + chạy script phân tích).
- Stage: `phase9-round136-t3-c2.txt` (1 entry: LIMITS này — **KHÔNG đưa preview.tsx vào batch vì lần này KHÔNG sửa cây**), verify read-back. KHÔNG push.
- Cờ `round136-t3.done` ghi khi LIMITS + stage xong (tóm tắt: bước 2 có dữ liệu mới lượt #13, (c2)=1, P1/P3 YẾU, P2+P7 ĐÚNG, P4/P5 ngoài khoảng ở biên, P6 ngoài 2/3 bin, P7 kiểm được lần 2, logger kiểm chứng lần 2; CHƯA ĐỦ verdict — đề xuất GIỮ fix qua đợt 137; preview.tsx giữ 530e10a7).
- Hồ sơ: `hidden_files/round136-t3/` — `t3-step2-verify136.py` (script bước 2, sửa F-135-T3-3), `t3-step2-dryrun-136-135a1.txt`, `t3-step2-dryrun-136-133a1.txt`, `t3-step2-dryrun-136-134partial.txt`, `t3-step2-136a1.txt` (output bước 2 lượt #13), `PREP.md`, `wait-t4t8.sh` + `wait-t4t8.log`.

## 7. Sai số / ghi chú của chính T3 (ghi trung thực)

1. **F-136-T3-1 (ghi chú phương pháp, không phải lỗi — baseline P1 lệch 2 tick giữa T3 và T5):** T3 (unsigned dist, |seq − run_end| ≤ 1) baseline 69/307, p=0,225; T5 (signed-dist) baseline 67/307, p=0,218. Hai tick chênh lệch là **335 và 347**: mỗi tick nằm trong một run nhưng cách run-end của nó ≥2 tick, đồng thời cách run-end của run kề trước đúng 1 tick — hai cặp run kề nhau (332,334)/(335,337) và (344,346)/(347,352). Unsigned-dist tính chúng là "gần run-end" (qua run trước), signed-dist tính là "đang trong run, còn xa run-end" (qua run chứa nó). Cả hai đều cho k=1/1, verdict P1 YẾU không đổi. T5 LIMITS §8.5 đã ghi nhận lệch này độc lập — khớp với phân tích của T3. (Cùng hiện tượng đã ghi trong script từ dữ liệu #9: "run kề nhau làm chênh 2 tick".)
2. **F-136-T3-2 (quan sát, không phải lỗi — tỉ lệ (c2) giảm):** 7/412 (1,70%) → 1/307 (0,33%), P(X≤1 | n=307, p=7/412) = 0,033. Ý nghĩa biên, một phép so sánh — ghi là quan sát cần đợt 137 kiểm lại, không dùng làm verdict.
3. **F-136-T3-3 (đính chính số cũ, không phải lỗi mới của T3):** trung bình 10 lượt yên hợp lệ trước #13 là 46,3 ms (tổng 462,5 / 10 = 46,25), không phải 46,6 ms như LIMITS đợt 135 (và log vòng lặp) đã ghi. Lỗi gốc do T3-135/T10-135; T1-136 đã phát hiện (F-136-T1-3); T3-136 kiểm lại độc lập từ 10 số gốc và mang số đúng sang. Trung bình 11 lượt nay: 47,3 ms (520,5 / 11 = 47,32). Không ảnh hưởng verdict ngưỡng (58,0 < 60).
4. **F-135-T3-3 ĐÃ SỬA (đợt này):** script bước 2 nay in phân phối loopNo ở nhánh đầy đủ — dry-run #12 tái hiện đúng byLoop của T4 (loop≥3 = 1196) và lượt #13 cho byLoop khớp T4 từng số (loop≥3 = 900, wraps = 20). Không còn phải tính thêm bằng one-liner riêng.
5. **F-135-T3-1 (tie ±27 ms ở seq 251, đợt 135):** không tái diễn đợt này — seq 334 duy nhất có log gần nhất rõ ràng (delta +56 ms, không có entry nào cách đều).

## 8. Câu hỏi cho parent (T10 đưa vào §12 LIMITS gộp)

1. **Điều tra (c2): GIỮ fix tiếp qua đợt 137 hay quyết verdict ngay trên bằng chứng cộng dồn?** T3 đề xuất GIỮ qua đợt 137, lấy lượt #14 làm lượt quyết định (xem §5). Nếu parent quyết verdict ngay: verdict dựa trên P1 22/22, P3 21/22, P7 8/8, F6' đóng 2 lần — và chấp nhận P5/P6 cần hiệu chỉnh khoảng.
2. **P5/P6 có cần hiệu chỉnh khoảng cho lượt chậm không?** Lần đầu P5 ngoài khoảng (snap 52, label-floor 62,7%, run 23) và P6 ngoài 2/3 bin — đều cùng chiều với tickCost tăng. Giữ nguyên prereg hay nới khoảng theo median tickCost?
3. **Ngưỡng tickCost ≤60 ms:** median 58,0 (biên 2 ms, cao nhất 11 lượt). Nếu đợt 137 median vẫn ≥55 ms thì bàn lại ngưỡng/bar hay điều tra tải song song trước?
4. **F-136-T4-1:** có cần bắt buộc log ps snapshot khi blockers>0 trong poller các đợt sau không? (Bài học đợt 135 chưa được thực hiện ở đợt 136.)
