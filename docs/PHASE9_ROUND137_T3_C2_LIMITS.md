# PHASE9_ROUND137_T3_C2_LIMITS — T3 đợt 137: bước 2 với dữ liệu mới lượt yên #14 — LƯỢT QUYẾT ĐỊNH (GIÀU EVENT — (c2)=6)

> **Verdict: BƯỚC 2 CÓ DỮ LIỆU MỚI — lượt yên #14 ĐO ĐƯỢC, GIÀU EVENT (6 occurrence / 5 seq riêng biệt, 20/20 pass). P1 ĐÚNG MẠNH NHẤT TỪ TRƯỚC TỚI NAY (6/6, p≈0,0001), P2 ĐÚNG, P4 ĐÚNG (cả 4 tiêu chí con về trong khoảng sau 1 lượt ngoài), P7 ĐÚNG (coverage 6/6, 0 drawSrc trễ — lần kiểm chứng thứ 3 liên tiếp), P6 3/3 bin trong khoảng (không verdict theo thiết kế), P5 3/4 trong khoảng (snap 50 ms vượt 2 ms — lần thứ 2 liên tiếp ngoài khoảng), P3 SAI theo script A1 nghiêm ngặt (3/6 đóng băng, p=0,125). tickCost median 59,0 ms — ĐẠT ngưỡng ≤60 ms nhưng biên chỉ còn 1 ms (cao nhất 12 lượt, lần thứ 2 liên tiếp ≥55 ms — đúng điều kiện quyết parent đợt 136 §12.3(c) bàn lại ngưỡng). Logger nới KIỂM CHỨNG RUNTIME LẦN 3 LIÊN TIẾP (c2DrawLog n=996, loop 1–21, 20 wrap).**
> **ĐỀ XUẤT VERDICT CUỐI CHO PARENT (xem §5 — T3 chỉ đề xuất, không tự quyết): ĐÓNG ĐIỀU TRA (c2) với kết luận "cơ chế ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" (không phải "đã chứng minh tuyệt đối") — dựa trên P1 cộng dồn 28/28, P2 100% lag ≥+1f qua 19 occurrence, P4 về trong khoảng, P7 coverage cộng dồn 14/14, F6' đóng lần 3 liên tiếp, logger kiểm chứng lần 3 — và phân tích khám phá (không thuộc prereg): cả 5 seq (c2) riêng biệt đều nằm ở CUỐI MỘT CHUỖI ĐÓNG BĂNG NHÃN dài ≥2 tick (p≈0,0005 so với baseline), hòa giải được việc P3 A1 nghiêm ngặt SAI ở lượt này. GIỮ fix 530e10a7 làm instrumentation VĨNH VIỄN (không gỡ sau verdict). Dự thảo DEF v0.5 ở §6 (hiệu chỉnh khoảng P5 cho lượt chậm + P3' dựa trên stall, prereg cho đợt 138+ nếu parent chấp nhận).**

## 0. Môi trường lúc T3 làm việc (08:41–10:0xZ 18/11, chờ T4.done)

- Boot lúc mở đợt: **2104246b**, btime /proc/stat **08:07:11Z**. **REBOOT GIỮA PHIÊN lúc 09:36:01Z** → boot mới **17db9652** (btime 09:36:01Z, /proc/stat; cờ T5 ghi 09:36:16Z — chênh 15 s, cùng mẫu đợt 135/136, xem F-137-T3-1). Wait-script của T3 bị reboot giết (SIGTERM, poll cuối 09:35:07Z) và đã khởi động lại 09:37:14Z theo tiền lệ đợt 135.
- RAM available: 852 MB lúc 08:40Z → 2.407 MB (08:44Z, balloon xả) → 517 MB (09:35Z, trước reboot) → 1.832 MB (09:37Z, boot mới) → 1.446 MB (09:47Z).
- `preview.tsx` lúc bắt đầu: md5 **530e10a7** (fix GIỮ theo quyết parent §12.3(a) đợt 136 — T3 kiểm lại 08:41Z, 09:57Z và 10:00Z đều 530e10a7). **KHÔNG REVERT.**
- `~/workspace/repo-1` **không phải git repo** — md5 là phương pháp đối chiếu file duy nhất.
- Chốt chặn `round-in-progress.md` còn đó — T3 KHÔNG xóa (chỉ T10 xóa).

## 1. Giai đoạn A — chuẩn bị script bước 2 (08:41–08:45Z, TRƯỚC khi có dữ liệu)

- Script mới `hidden_files/round137-t3/t3-step2-verify137.py` (dựa trên script đợt 136, giữ nguyên logic prereg/(c2)/P1–P7/p nhị thức theo quyết parent §12.3(b) — **KHÔNG nới khoảng, KHÔNG sửa prereg**; chỉ đổi docstring số đợt/lượt).
- **Validate khô TRƯỚC khi T4.done có (08:42–08:45Z):**
  - Dry-run 1 — JSON lượt #12 đầy đủ (sha `2efceefd…`): exit 0, khớp output đợt 135 trừ đúng dòng path + 3 dòng P7 mới (loopNo/point/LOGGER — do script đợt 135 chưa có; đúng mẫu dry-run đợt 136). File `t3-step2-dryrun-137-135a1.txt`.
  - Dry-run 2 — JSON lượt #13 đầy đủ (sha `266767c0…`): exit 0, **khớp 100%** `t3-step2-136a1.txt` trừ đúng dòng path. File `t3-step2-dryrun-137-136a1.txt`.
- Chờ T4.done bằng `wait-t4.sh` (poll 10 phút, hạn 10:30Z): **T4.done xuất hiện 09:57:14Z; T5.done cũng đã có lúc đó; T8.done chưa có lúc T3 đóng.** Wait bị reboot giết 1 lần (09:36:01Z) và khởi động lại (xem F-137-T3-1). 1 reboot trong phiên T3.

## 2. Giai đoạn B — bước 2 trên JSON lượt yên #14 (phân tích độc lập từ JSON gốc)

File: `hidden_files/round137-t4/preview-b-f3-flip-webkit-t4-attempt1.json` — size **2.780.813 B**, sha256 `d0585125e40051d123510d120e051e3c31366be6b1951729f496bbbce39e1c1a` (khớp T4 + T5), engine webkit 27.2, pageErrs=[], `partial=None`. Script chạy 09:58Z, exit 0, output `hidden_files/round137-t3/t3-step2-137a1.txt`.

### 2.1 Số liệu độc lập (T3) — đối chiếu T4 + T5-pha-2

| Hạng mục | Số độc lập (T3) | T4 | T5 pha 2 | Khớp? |
|---|---|---|---|---|
| flip | afterPass=5, wallMs=29353, passes=20 | như vậy | như vậy | ✓ |
| blendTick | n=406, post (flip+2000, viaRvfc=0) = 296, seq 110→405 | n=406, post 296 | n=406, post 296 | ✓ |
| tickCost | n=518, median **59,0** ms (p90 81, max 114, min 30); post n=378 median **58,0** ms → **ĐẠT (≤60), biên 1 ms** | n=518 median 59,0; post n=378 median 58,0 | n=518 median 59,0; post 378 median 58,0 | ✓ |
| histogram (m*−label) | n_ghost=592, nomatch=0, hist {-14: 5, -13: 2, -11: 6, -10: 8, -9: 2, -4: 2, -3: 2, -1: 54, 0: 207, +1: 83, +2: 118, +3: 96, +4: 7} | hist y hệt | rerun y hệt | ✓ |
| snap/raw-label | snap median **50** ms (n=592), raw median **9** ms (n=592); occ0 snap 50 / raw 10 (n=296) | snap 50, raw 10 (occ0) | snap 50,0 (occ0), raw 10,0 (occ0) / 9 (all) | ✓ |
| label-floor | {0: 190, 1: 402} → +1 = **67,9%** (63–76) | không báo riêng | {0:190, 1:402} | ✓ |
| curPix run ≥3 tick | **22 run** [(123,125,3), (132,134,3), (137,139,3), (142,145,4), (146,148,3), (150,153,4), (160,162,3), (180,182,3), (201,206,6), (215,217,3), (223,227,5), (230,232,3), (239,241,3), (246,249,4), (260,264,5), (281,283,3), (301,305,5), (313,316,4), (323,327,5), (345,348,4), (366,368,3), (385,388,4)] | 22 run | 22 run | ✓ |
| (c2) skp=0 | n=**6**: (145, 17, 15, 2), (145, 17, 16, 1), (265, 19, 18, 1), (327, 17, 16, 1), (368, 18, 17, 1), (389, 16, 15, 1) | n=6, y hệt | n=6, y hệt | ✓ |
| (c2) skp=1 | n=**0** | 0 | 0 | ✓ |
| (c) dạng ngờ skp=0 | n=6, skp=1 n=0 | 6 / 0 | 6 / 0 | ✓ |
| c2DrawLog | n=**996** (drawSrc 518 / rawUnit 478); loopNo 1–21 {1:44, 2:50, 3:54, 4:54, 5:46, 6:48, 7:46, 8:46, 9:48, 10:50, 11:54, 12:42, 13:50, 14:60, 15:48, 16:52, 17:53, 18:1, 19:50, 20:48, 21:52}; **loop≥2 = 952, loop≥3 = 902**; wraps (frameIdx giảm) = **20**; frameIdx 0–69 (distinct 59); wallMs 11652→83996 (span 72.344 ms); srcKind 'canvas 1280x720' 996/996; readyState 4 996/996; seeking False 996/996 | n=996, byLoop y hệt, wraps 20 | n=996, loopNo 1–21, wraps 20 | ✓ |
| P7 coverage | **6/6** (seq 145 delta −25/−25, 265 −23, 327 −23, 368 −26, 389 +46); blendTick hậu-flip trong ±500 ms của log: 296/296 | 6/6, delta −25/−25/−23/−23/−26/+46 | 6/6 | ✓ |
| P7 lag gần (c2) | floor(ct*30)−frameIdx: {-1: 42, 0: 50}; chỉ drawSrc {-1: 21, 0: 25}; cặp rawUnit−drawSrc {0: 46} | — | {-1: 42, 0: 50}; drawSrc {-1: 21, 0: 25}; cặp {0: 46} | ✓ |
| Lớp B | (không thuộc bước 2 — ghi theo T4) 5/5 ĐẠT | 5/5 | — | ✓ |
| F6' (skippedLatest=1) | 0 vi phạm thật / 51 tick (theo labellag T4 — T3 không tính lại, chỉ đối chiếu) | ĐÓNG lần 3 liên tiếp (51/51) | — | ✓ |
| lag ≥+5f | 0 event | 0 | — | ✓ |

### 2.2 P1–P7: từng cái KIỂM ĐƯỢC — lượt quyết định có đủ mẫu để phân biệt

- **P1 (curPix run ≥3 tick, (c2) gần run-end): ĐÚNG — MẠNH NHẤT TỪ TRƯỚC TỚI NAY** — k=6/6 (seq 145 dist 0 ×2, 265 dist +1, 327 dist 0, 368 dist 0, 389 dist +1), baseline 66/296 = 0,223, p = 0,00012. Tính theo seq PHÂN BIỆT: 5/5, p ≈ 0,0005. T5 độc lập (signed-dist): baseline 65/296, p = 0,00011 — lệch 1 tick do định nghĩa baseline khác nhau (xem F-137-T3-3); k=6/6 không đổi.
- **P2 (100% (c2) lag ≥ +1f, 0 lag âm): ĐÚNG** — 6/6 lag ≥ +1f (5× +1f, 1× +2f), 0 lag âm.
- **P3 (A1, đóng băng-tại-tick): SAI theo script** — đóng băng 3/6 [327, 368, 389]; tick bắt kịp 3 [(145, +837 ms) ×2, (265, +950 ms)]; không đóng băng thường 0; baseline 65/295 = 0,220, p = 0,125. Tính theo seq PHÂN BIỆT: 3/5 đóng băng, p ≈ 0,075 — vẫn trên 0,05. **Đây là dự báo duy nhất SAI ở lượt quyết định** — xem §4.3 về diễn giải (phân tích khám phá stall) và §5 về đề xuất verdict.
- **P4 (thuần +1f 2–8; tổng skp=0 2–12; skp=1 = 0; lag ≥+5f = 0): ĐÚNG (cả 4 tiêu chí con)** — thuần +1f = 5 (2–8); tổng skp=0 = 6 (2–12); skp=1 = 0; lag ≥+5f = 0. Về trong khoảng sau 1 lượt ngoài ở #13 (thuần +1f = 1 < 2).
- **P5 (snap-label median 34–48 ms; raw-label 8–10 ms; label-floor +1 63–76%; run ≥3 tick 13–22): 3/4 TRONG KHOẢNG** — snap 50 ms (vượt 2 ms — lần thứ 2 liên tiếp ngoài khoảng, sau 52 ms ở #13); raw 9 ms (all occ) / 10 ms (occ0) — trong; label-floor +1 = 67,9% — trong; run ≥3 = 22 — trong, ở biên trên. Cả 3 lệch ở #13 đã về trong khoảng; chỉ snap còn vượt, cùng chiều với tickCost tăng — nhất quán với "chữ ký lượt chậm".
- **P6 (khoảng thực nghiệm 8 lượt, KHÔNG verdict): 3/3 BIN TRONG KHOẢNG** — bin0 = 35,0% (33–39); +1/+2 = 34,0% (33–53); +3 = 16,2% (3–19). Về trong khoảng sau 1 lượt ngoài 2/3 bin ở #13. Không verdict theo thiết kế; ghi để đợt sau theo dõi.
- **P7 (log draw phủ ≥1 seq (c2), drawSrc không trễ sau ct): ĐÚNG — KIỂM ĐƯỢC LẦN 3 LIÊN TIẾP** — coverage 6/6; tại 92 entry log trong ±500 ms của tick (c2): floor(ct*30)−frameIdx chỉ −1/0, **0 entry drawSrc trễ ≥+1f** → làm yếu giả thuyết desync seek-latency lần thứ ba. Cặp rawUnit−drawSrc gần nhất: {0: 46} (cùng frame). Caveat giữ nguyên: log còn thưa (drawSrc gap median **108,0 ms** vs 109,0 ms đợt 136, n=517, >66 ms: 500) nên không phân giải lệch 1 frame; P7 là "làm yếu desync", không phải "bác bỏ tuyệt đối". Cộng dồn P7 theo đếm từng seq: coverage **14/14** (7/7 + 1/1 + 6/6) — xem F-137-T3-2 về số 9/9 của T5.
- **Cộng dồn (prereg đứng nguyên, không sửa sau khi thấy dữ liệu):** P1 **28/28** (22/22 + 6/6), P3 **24/28** (21/22 + 3/6). P1 cộng dồn: p nhị thức P(X≥28 | n=28, p=0,22) ≈ 4×10⁻¹⁹ — sức mạnh thống kê áp đảo, không còn phụ thuộc vào một lượt nào.
- **Ngưỡng ≤60 ms: ĐẠT NHƯNG BIÊN CHỈ CÒN 1 ms — ĐÚNG ĐIỀU KIỆN BÀN LẠI THEO QUYẾT §12.3(c) ĐỢT 136:** chuỗi 12 lượt yên hợp lệ nay 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / **59,0** ms, trung bình **48,3 ms**. Đây là median cao nhất 12 lượt và là **lần thứ 2 liên tiếp ≥55 ms** (58,0 rồi 59,0). T3 không đổi ngưỡng (việc của parent/T10 — xem §5, §8); chỉ ghi rõ dữ kiện: lúc đo load1 0,61–2,55 / RAM 1.056–1.531 MB (T4) — tải song song lúc đo NHẸ hơn đợt 136 về RAM (3,3–6,0 GB) mà median vẫn tăng 58,0 → 59,0 ms, nên RAM thấp không giải thích được mức tăng; load lúc đo không cao hơn đợt 136 nên cũng chưa chứng minh được nhân quả tải song song.

### 2.3 Logger đã nới — KIỂM CHỨNG RUNTIME LẦN 3 LIÊN TIẾP

- c2DrawLog n=996 phủ **loop 1–21 đầy đủ**: loop 1–17 và 19–21 mỗi loop 42–60 entry; loop≥3 = 902 entry (90,6% log); **20 wrap**. Caveat biên: loop 18 chỉ 1 entry biên tại wrap — cùng mẫu với loop 12 đợt 136 (1 entry biên tại wrap). Không ảnh hưởng coverage (seq 389 muộn nhất ở loop ~21, delta +46 ms).
- 1 epoch duy nhất (không re-arm giữa chừng); log phủ toàn bộ hậu-flip (log max − flip = +54.643 ms); blendTick hậu-flip 296/296 trong ±500 ms của log.
- **Kết luận: fix loop-gate nới + re-enable không xóa mảng TIẾP TỤC HOẠT ĐỘNG ĐÚNG ở runtime — lượt thứ ba liên tiếp.** Đây là bằng chứng tích lũy cho đề xuất GIỮ fix làm instrumentation vĩnh viễn (xem §5).

### 2.4 Quan sát thêm: tỉ lệ (c2) bật trở lại + lag +2f đầu tiên

- Tỉ lệ (c2)/tick post: lượt #12: 7/412 = 1,70%; lượt #13: 1/307 = 0,33%; lượt #14: **6/296 = 2,03%** — bật trở lại trên cả #12. P(X≥6 | n=296, p=1/307) = **0,00047** (so với tỉ lệ #13 — mức giảm #13 gần như chắc chắn là dao động ngẫu nhiên, không phải thay đổi cơ chế); P(X≥6 | n=296, p=7/412) = 0,39 (nhất quán với #12). Cộng dồn 3 lượt gần nhất: 14/1015 = 1,38%.
- **Lag +2f ĐẦU TIÊN trong chuỗi (seq 145, presented 17, label 15):** mọi (c2) trước đây (18 occurrence: #10: 5, #12: 7, #13: 1, #14: 5× +1f) đều thuần +1f. Occurrence +2f này KHÔNG vi phạm prereg nào (P2 chỉ đòi lag ≥ +1f; P4 đếm thuần +1f = 5, trong khoảng 2–8). Seq 145 có 2 occurrence trong cùng một tick (label 15 lag 2f + label 16 lag 1f, cùng presented 17) — nhất quán với nhãn tụt lại 1–2 frame sau một chuỗi đóng băng dài (stall 3 tick trước seq 145, xem §4.3). Ghi là quan sát cần theo dõi ở #15+: nếu +2f trở nên thường xuyên thì xem lại P4; một occurrence đơn lẻ không đổi verdict nào.
- Tổng (c2) cộng dồn qua 4 lượt có event: #10: 5, #12: 7, #13: 1, #14: 6 → **19 occurrence**, 0 lag âm, 0 skp=1, 0 lag ≥+5f, 18× +1f + 1× +2f.

## 3. Đối chiếu chéo với T5 pha 2

- **T5 pha 2 CÓ dữ liệu mới.** File `round137-t5/t5-c2-drawlog-analysis.txt` (script độc lập `t5-c2-drawlog-analysis.py`): **khớp 100% mọi số so sánh được** — (c2) 6 seq/lag, coverage 6/6 + delta, loopNo 1–21, wraps 20, P1 6/6 (baseline signed-dist 65/296, p≈0,00011), P3 3/6 (baseline 65/295, p=0,125), skew occ0 snap 50 / raw 10, label-floor {0:190, 1:402}, P7 lag {-1:42, 0:50} / drawSrc {-1:21, 0:25} / cặp {0:46}, drawSrc gap median 108,0 ms, B2 cặp {0:478}, B3 mỗi loop (loop 18: 1 entry biên).
- **T5 LIMITS §8.2 xác nhận lại:** "P1/P2/P4/P7 DUNG, P3 SAI theo script T3 (p=0,125), P5 3/4 trong khoảng, P6 3/3 trong khoảng; cộng dồn P1 28/28, P3 24/28; ngưỡng ≤60 ms GIỮ; logger kiểm chứng lần 3" — **khớp hoàn toàn kết luận bước 2 của T3 (§2.2)**, trừ 1 khác biệt đếm P7 (xem F-137-T3-2).
- **T5 histogram rerun KHÔNG độc lập (lặp lại mẫu đợt 135/136):** `t5-histogram-rerun.txt` là chạy lại chính script bước 2 của T3 (`t3-step2-verify137.py`), không phải implementation riêng — T5 tự ghi rõ (§8.6) và không tính là kiểm chứng độc lập thứ ba. Kiểm chứng độc lập thật cho P1/P3/coverage là T5 `t5-c2-drawlog-analysis.py` + analyzer của T4.
- **2 khác biệt duy nhất về định nghĩa (không phải lệch số liệu):** (a) baseline P1 66 vs 65 (xem F-137-T3-3); (b) p90 wallbands (T5 nearest-rank vs T4 nội suy percentile — median khớp chính xác cả 6 dải + tổng + post; p90 không ảnh hưởng verdict nào). Cả hai đều không đổi verdict nào.
- T5 không tính tickCost — không mâu thuẫn với số T3 (median 59,0).
- **T5 cũng ghi P3 "SAI theo script T3" và để ngỏ việc T3/T10 diễn giải 3 tick bắt kịp** — phân tích khám phá stall ở §4.3 là câu trả lời của T3 cho câu hỏi đó (ghi rõ: khám phá, không thuộc prereg, không đổi verdict P3 của lượt này).

## 4. Phân tích bổ sung của T3 (KHÁM PHÁ, KHÔNG thuộc prereg — không đổi verdict P1–P7 của lượt này)

### 4.1 3 tick "bắt kịp" của P3: nhảy label là hành vi BÌNH THƯỜNG của lượt chậm, không phải chữ ký riêng của (c2)

- Phân phối nhảy labelMs giữa các tick post liên tiếp (n=295 cặp): nhảy ≥100 ms: **176/295 (59,7%)**; nhảy 50–99 ms: 54; đóng băng (=0): 65; không có nhảy âm. Nhảy lớn nhất 1.401 ms (seq 229); nhiều nhảy 600–1.400 ms.
- 3 tick bắt kịp tại (c2) (+837 ms tại 145 ×2 occurrence, +950 ms tại 265) nằm HOÀN TOÀN TRONG dải nhảy thường gặp của lượt này — không phân biệt được với 176 tick nhảy khác. **Kết luận: không thể dùng "3 tick bắt kịp" làm bằng chứng ủng hộ cơ chế** — chúng không đặc biệt. P3 A1 nghiêm ngặt SAI ở lượt này là kết luận đứng vững; mọi hòa giải phải tới từ một định nghĩa khác (xem §4.3), không phải từ việc diễn giải lại 3 tick này.

### 4.2 Ngưỡng tickCost: điều kiện bàn lại ĐÃ ĐẠT

- Quyết parent đợt 136 §12.3(c): "nếu đợt 137 median vẫn ≥55 ms thì parent bàn lại". Median #14 = 59,0 ms ≥ 55 ms — **điều kiện đã đạt lần thứ 2 liên tiếp** (58,0 → 59,0). T3 không đề xuất giá trị ngưỡng mới (việc của parent/T10 — xem §8); chỉ ghi dữ kiện: 2 lượt chậm liên tiếp đều dưới ngưỡng nhưng biên mỏng dần (2 ms → 1 ms); tải lúc đo không cao hơn đợt 136; RAM lúc đo thấp hơn nhiều mà median vẫn tăng.

### 4.3 Phân tích khám phá: (c2) nằm ở CUỐI CHUỖI ĐÓNG BĂNG NHÃN (stall) — hòa giải P3

- **Định nghĩa khám phá (không thuộc prereg, đặt SAU khi thấy dữ liệu — ghi rõ để T10 khỏi tính là prereg):** stall_truoc(seq) = số tick liên tiếp trước tick (c2) có cùng labelMs (chuỗi đóng băng kết thúc ngay trước tick (c2)).
- **Kết quả (5 seq riêng biệt):** 145 → stall 3 tick (label 36664 giữ 3 tick rồi nhảy +837 ms TẠI tick 145); 265 → stall **6 tick** (label 58859 giữ 6 tick rồi nhảy +950 ms TẠI tick 265); 327 → stall 4 tick (đóng băng tại tick, A1 đúng); 368 → stall 2 tick (A1 đúng); 389 → stall 4 tick (A1 đúng).
- **Baseline:** P(stall ≥ 2 tick) = 65/295 = **22,0%**; P(stall ≥ 3) = 12,9%. P(cả 5 seq riêng biệt đều có stall ≥ 2 | p=0,22) = 0,22⁵ ≈ **0,0005**.
- **Diễn giải (thận trọng, post-hoc):** A1 nghiêm ngặt chỉ kiểm "labelMs tại tick (c2) có bằng labelMs tick trước không" — tức chỉ bắt được trường hợp chuỗi đóng băng KÉO DÀI QUA tick (c2). Nhưng ở lượt chậm, chuỗi đóng băng thường KẾT THÚC ĐÚNG TẠI tick (c2) bằng một cú nhảy (+837/+950 ms): nhãn tụt lại ~0,9 s rồi nhảy vọt tại đúng tick ghost xuất hiện. Cả 5 seq đều nằm ở cuối chuỗi đóng băng — mẫu này nhất quán với "đóng băng rồi bắt kịp tại tick (c2)" hơn là với "không đóng băng". **Đây là bằng chứng khám phá ủng hộ cơ chế, nhưng KHÔNG đổi verdict P3 của lượt này (vẫn SAI theo A1 đã prereg)** — việc đưa định nghĩa stall vào prereg thuộc về DEF v0.5 (xem §6, P3') và quyết của parent, áp dụng cho đợt 138+ nếu được chấp nhận, không áp dụng hồi tố.
- **Caveat của phân tích khám phá:** định nghĩa đặt sau khi thấy dữ liệu (post-hoc) nên p≈0,0005 KHÔNG có cùng trọng lượng như một prereg đã đăng ký trước; stall ≥2 là ngưỡng T3 chọn sau khi thấy các stall 2–6 tick (độ nhạy ngưỡng: stall ≥3 cũng cho 4/5 seq, p≈0,002 — vẫn mạnh; stall ≥4 cho 3/5, p≈0,02 — vẫn dưới 0,05). Parent/T10 quyết có chấp nhận P3' không.

## 5. ĐỀ XUẤT VERDICT CUỐI CHO PARENT (T3 chỉ đề xuất — parent quyết)

Lượt #14 là lượt quyết định theo quyết parent đợt 136 §12.3(a): (c2) = 6 occurrence / 5 seq ≥ 3, đúng hướng (0 lag âm, 0 skp=1, 0 lag ≥+5f) → nhánh (i) của brief áp dụng: đề xuất verdict cuối cụ thể.

### 5.1 Đề xuất: ĐÓNG ĐIỀU TRA (c2) — kết luận "cơ chế ghost-freeze ĐƯỢC ỦNG HỘ MẠNH"

**Ủng hộ (mạnh, tích lũy qua 4 lượt có event + lượt quyết định):**
- P1: **28/28 cộng dồn** (p≈4×10⁻¹⁹); riêng lượt #14 p≈0,0001 — mạnh nhất từ trước tới nay. (c2) luôn nằm ở cuối run curPix.
- P2: **19/19 occurrence** lag ≥ +1f, 0 lag âm, qua mọi lượt có event (#10: 5, #12: 7, #13: 1, #14: 6).
- P4: về trong khoảng đầy đủ ở #14 (thuần +1f = 5, tổng = 6, skp=1 = 0, lag ≥+5f = 0) sau 1 lượt ngoài ở #13.
- P7: coverage cộng dồn **14/14** (7+1+6), 0 drawSrc trễ trong 3 lượt kiểm được liên tiếp — desync seek-latency bị làm yếu 3 lần.
- F6' đóng lần 3 liên tiếp (51/51 tick không vi phạm thật); logger nới kiểm chứng runtime lần 3 liên tiếp.
- Tỉ lệ (c2) bật trở lại 2,03% (p=0,00047 so với tỉ lệ #13) — mức giảm #13 là dao động ngẫu nhiên, không phải thay đổi cơ chế.
- Phân tích khám phá §4.3: cả 5 seq riêng biệt đều ở cuối chuỗi đóng băng nhãn (stall ≥2 tick, p≈0,0005) — hòa giải được P3 A1 nghiêm ngặt (xem dưới).

**Chống lại "đã chứng minh tuyệt đối" (ghi rõ, không giấu):**
- P3 A1 nghiêm ngặt SAI ở lượt quyết định (3/6, p=0,125; cộng dồn 24/28 = 85,7%) — định nghĩa A1 quá hẹp cho lượt chậm (xem §4.3); verdict "ủng hộ mạnh" chứ không phải "mọi dự báo đều đúng".
- Lag +2f đầu tiên (1/19 occurrence) — chưa giải thích được đầy đủ, chỉ ghi nhận là nhất quán với stall dài (3 tick); cần theo dõi ở #15+.
- P5 snap-label ngoài khoảng lần thứ 2 liên tiếp (50 ms vs 34–48) — chữ ký lượt chậm, cần hiệu chỉnh khoảng (DEF v0.5).
- P7: log thưa (gap median 108 ms) nên không phân giải lệch 1 frame — "làm yếu desync", không phải "bác bỏ tuyệt đối".

**Đề xuất cụ thể:**
1. **ĐÓNG điều tra (c2)** với kết luận trên — không kéo dài điều tra vô hạn (đúng tinh thần quyết §12.3(a)). Không mở thêm luồng điều tra (c2) chuyên biệt ở các đợt sau.
2. **GIỮ fix 530e10a7 làm instrumentation VĨNH VIỄN — KHÔNG GỠ sau verdict.** Lý do: (a) logger là công cụ duy nhất làm được P7 (coverage/desync); gỡ nó là phá hủy khả năng kiểm lại; (b) kiểm chứng runtime 3 lần liên tiếp, không gây hại production nào được ghi nhận (chỉ ghi log); (c) bản gốc 805409f0 vẫn còn tại `round134-t3/preview.tsx.orig-805409f0` nên revert sau này vẫn làm được trong 1 bước nếu parent đổi ý.
3. **Giám sát thụ động tiếp tục:** (c2) vẫn được đếm tự động trong analyzer của T4 mỗi lượt yên (không tốn thêm luồng) — nếu một lượt sau cho P1 gãy, xuất hiện lag âm, hoặc +2f trở nên thường xuyên thì mở lại điều tra.
4. **DEF v0.5 (dự thảo §6)** ghi hiệu chỉnh khoảng P5 + P3' stall-based, áp dụng cho đợt 138+ nếu parent chấp nhận — không áp dụng hồi tố cho verdict này.
5. **Ngưỡng tickCost ≤60 ms: KHÔNG đổi trong verdict này** — việc bàn lại thuộc quyết riêng theo §12.3(c) (điều kiện đã đạt: 2 lượt liên tiếp ≥55 ms); T3 chỉ báo dữ kiện (§2.2, §4.2).

**Phương án thay thế nếu parent chưa muốn đóng:** giữ điều tra mở thêm đúng 1 lượt (#15) với P3' stall-based đã prereg trước (không phải A1 nghiêm ngặt) làm dự báo chính — nhưng T3 không khuyến nghị, vì bằng chứng cộng dồn đã đủ mạnh và lượt #14 đã là lượt quyết định theo đúng điều kiện parent đặt ra.

## 6. DỰ THẢO DEF v0.5 (cho parent/T10 duyệt — KHÔNG tự áp dụng)

| Mục | Hiện tại (prereg đợt 132, giữ qua #14) | Đề xuất hiệu chỉnh (DEF v0.5) | Căn cứ |
|---|---|---|---|
| P5 snap-label median | 34–48 ms | **34–52 ms** (ứng viên — T10 kiểm lại từ chuỗi snap đầy đủ 12 lượt trước khi chốt) | #13: 52 ms, #14: 50 ms — 2 lượt chậm liên tiếp vượt trần cũ cùng chiều với tickCost tăng (58→59 ms); raw/label-floor/run không đổi |
| P5 các tiêu chí còn lại | raw 8–10 ms; label-floor +1 63–76%; run 13–22 | **Giữ nguyên** | Cả 3 đều trong khoảng ở #14 (raw 9/10, 67,9%, 22) |
| P3 (A1 nghiêm ngặt) | labelMs tại tick (c2) = labelMs tick trước | **Giữ A1, BỔ SUNG P3' (stall-based):** tick (c2) nằm ở cuối chuỗi đóng băng nhãn ≥2 tick | #14 khám phá: 5/5 seq riêng biệt ở cuối stall (p≈0,0005); A1 chỉ bắt được stall kéo dài qua tick (c2), bỏ sót stall kết thúc đúng tại tick (c2) bằng cú nhảy. P3' prereg cho đợt 138+ nếu parent chấp nhận; KHÔNG áp dụng hồi tố |
| P6 | bin0 33–39%; +1/+2 33–53%; +3 3–19% (không verdict) | **Giữ nguyên** | 3/3 bin trong khoảng ở #14; lần ngoài ở #13 là nhiễu lượt chậm |
| P4 | thuần +1f 2–8; tổng 2–12; skp=1 = 0; lag ≥+5f = 0 | **Giữ nguyên, thêm ghi chú:** lag +2f đơn lẻ (1/19 occ) không vi phạm; nếu +2f ≥3 occ trong một lượt sau thì xem lại | Lag +2f đầu tiên ở #14, nhất quán với stall dài |
| tickCost ≤60 ms | Ngưỡng giữ | **Ghi nhận trigger §12.3(c) ĐÃ ĐẠT** (2 lượt liên tiếp ≥55 ms) — giá trị ngưỡng mới (nếu có) do parent quyết riêng, không thuộc DEF v0.5 này | #13: 58,0; #14: 59,0; biên chỉ còn 1 ms |
| Fix 530e10a7 | Instrumentation tạm, giữ tới khi verdict | **Instrumentation VĨNH VIỄN** | Logger kiểm chứng runtime 3 lần; là công cụ duy nhất cho P7 |

## 7. Trạng thái sau đóng (kiểm cuối 10:0xZ 18/11)

- preview.tsx md5 cuối: **530e10a7** (GIỮ fix; KHÔNG revert; không sửa cây trong đợt này).
- Boot 17db9652 còn sống (btime 09:36:01Z); 1 reboot giữa phiên T3 (09:36:01Z) — wait-script bị giết và đã khởi động lại; không reboot nào nữa tới lúc T3 đóng.
- Không process đo nào còn chạy của T3 (chỉ đọc file + chạy script phân tích).
- Stage: `phase9-round137-t3-c2.txt` (1 entry: LIMITS này — **KHÔNG đưa preview.tsx vào batch vì lần này KHÔNG sửa cây**), verify read-back. KHÔNG push.
- Cờ `round137-t3.done` ghi khi LIMITS + stage xong (tóm tắt: bước 2 có dữ liệu mới lượt #14, (c2)=6/5 seq, P1 ĐÚNG p≈0,0001, P2+P4+P7 ĐÚNG, P3 SAI theo A1, P5 3/4, P6 3/3, logger kiểm chứng lần 3; ĐỀ XUẤT ĐÓNG điều tra — ghost-freeze được ủng hộ mạnh, GIỮ fix vĩnh viễn; dự thảo DEF v0.5 kèm theo; preview.tsx giữ 530e10a7).
- Hồ sơ: `hidden_files/round137-t3/` — `t3-step2-verify137.py` (script bước 2, giữ nguyên logic prereg), `t3-step2-dryrun-137-135a1.txt`, `t3-step2-dryrun-137-136a1.txt`, `t3-step2-137a1.txt` (output bước 2 lượt #14), `PREP.md`, `wait-t4.sh` + `wait-t4.log`.

## 8. Sai số / ghi chú của chính T3 (ghi trung thực)

1. **F-137-T3-1 (ghi chú vận hành — wait-script bị reboot giết, đã khởi động lại):** wait-t4.sh (chạy nền từ 08:45Z) bị SIGTERM khi VM reboot 09:36:01Z (boot 2104246b → 17db9652), poll cuối 09:35:07Z. T3 phát hiện qua handoff runtime 09:37Z, kiểm lại đĩa (T4 vẫn đang poll cửa trên boot cũ tới #69, chưa có attempt JSON; preview.tsx 530e10a7) và khởi động lại wait 09:37:14Z, hạn cắt giữ 10:30Z. T4.done tới 09:57:14Z. Không mất dữ liệu. Cùng mẫu đợt 135 (wait bị reboot giết).
2. **F-137-T3-2 (khác biệt đếm với T5 — cộng dồn P7):** T5 LIMITS §8.2 ghi cộng dồn P7 = **9/9 (8/8 + 1)**; T3 tính theo đếm từng seq (quy ước từ đợt 136: "coverage 8/8 (7/7 + 1/1)") là **14/14 (7/7 + 1/1 + 6/6)**. Số "+1" của T5 dường như cộng cả lượt #14 như 1 đơn vị thay vì 6 seq — trộn hai đơn vị đếm. T3 giữ 14/14 (từng seq) làm số chính; T10 đối chiếu và chốt quy ước đếm P7 cộng dồn.
3. **F-137-T3-3 (ghi chú phương pháp, không phải lỗi — baseline P1 lệch 1 tick giữa T3 và T5):** T3 (unsigned dist) baseline 66/296, p=0,00012; T5 (signed-dist) baseline 65/296, p=0,00011. Tick chênh lệch là **1 tick** (cùng hiện tượng run kề nhau như F-136-T3-1, khi đó lệch 2 tick). Cả hai đều cho k=6/6, verdict P1 ĐÚNG không đổi.
4. **F-137-T3-4 (ghi chú — T4 F-137-T4-1):** poll #68 boot cũ blockers=1, snapshot đã lưu theo luật §12.3(h) nhưng process thoát trước khi chụp nên không xác định được danh tính (race đếm-chụp <1 s). Không mất dữ liệu đo (chưa có attempt nào chạy; cửa cũng không mở ở poll đó). T4 đề xuất khắc phục cho đợt sau (chụp ps trước, đếm từ snapshot). T3 chỉ ghi nhận, không sửa gì thêm.
5. **F-136-T3-2 ĐÃ ĐƯỢC KIỂM LẠI (tỉ lệ (c2) giảm ở #13):** tỉ lệ bật trở lại 2,03% ở #14 (p=0,00047 so với tỉ lệ #13) — mức giảm #13 gần như chắc chắn là dao động ngẫu nhiên. Quan sát đợt 136 nay đã có lời giải, không còn là câu hỏi mở.
6. **F-136-T3-3 (đính chính số cũ):** trung bình 11 lượt yên hợp lệ trước #14 là 47,3 ms (520,5 / 11) — đã ghi đúng ở LIMITS đợt 136; trung bình 12 lượt nay 48,3 ms (579,5 / 12 = 48,29). Không ảnh hưởng verdict ngưỡng (59,0 < 60).

## 9. Câu hỏi cho parent (T10 đưa vào §12 LIMITS gộp)

1. **Điều tra (c2): ĐÓNG với kết luận "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" + GIỮ fix 530e10a7 làm instrumentation VĨNH VIỄN, hay giữ mở thêm 1 lượt?** T3 đề xuất ĐÓNG (xem §5). Nếu parent đóng: verdict dựa trên P1 28/28, P2 19/19, P4 về trong khoảng, P7 14/14, F6' đóng 3 lần, logger kiểm chứng 3 lần — và chấp nhận P3 A1 nghiêm ngặt SAI ở lượt quyết định (hòa giải bằng phân tích stall §4.3, không áp dụng hồi tố).
2. **DEF v0.5: có chấp nhận hiệu chỉnh P5 snap-label 34–52 ms và bổ sung P3' stall-based cho đợt 138+ không?** (T10 kiểm lại chuỗi snap đầy đủ 12 lượt trước khi chốt khoảng P5.)
3. **Ngưỡng tickCost ≤60 ms:** điều kiện bàn lại theo §12.3(c) ĐÃ ĐẠT (2 lượt liên tiếp ≥55 ms, median 59,0 biên 1 ms). Parent bàn lại ngưỡng/bar hay điều tra tải song song trước?
4. **F-137-T3-2:** chốt quy ước đếm cộng dồn P7 — từng seq (14/14, theo T3) hay cách đếm của T5 (9/9)?
5. **Lag +2f đầu tiên (seq 145):** chỉ ghi nhận theo dõi ở #15+, hay cần điều tra riêng?
