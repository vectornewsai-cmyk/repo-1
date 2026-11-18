# PHASE9_ROUND135_T3_C2_LIMITS — T3 đợt 135: bước 2 với dữ liệu mới lượt yên #12 + xử lý revert

> **Verdict: BƯỚC 2 CÓ DỮ LIỆU MỚI — lượt yên #12 ĐO ĐƯỢC (1 attempt hợp lệ, 20/20 pass). P1–P7 KIỂM ĐƯỢC ĐẦY ĐỦ, TẤT CẢ ĐÚNG: P1 7/7 (p=1,9e-07), P2 ĐÚNG (0 lag âm), P3 7/7 (p=2,1e-05), P4 ĐÚNG (thuần +1f = 7, skp=1 = 0, lag ≥+5f = 0), P5 ĐÚNG (snap 35 ms, raw 8 ms, label-floor +1 = 74,9%, run ≥3 = 15), P6 trong khoảng thực nghiệm, P7 KIỂM ĐƯỢC LẦN ĐẦU (coverage 7/7, 0 drawSrc trễ — LÀM YẾU desync). Logger đã nới ĐƯỢC KIỂM CHỨNG RUNTIME LẦN ĐẦU: c2DrawLog n=1325, loop 1–22, loop ≥3 = 1196 entry, 21 wrap. Ngưỡng ≤60 ms GIỮ (median 40,0 ms).**
> **REVERT ĐÃ THỰC HIỆN (03:47–03:48Z): preview.tsx về bản gốc md5 805409f0 (khôi phục từ file .orig, diff với bản gốc = RỖNG — chính xác từng byte); tsc 0 lỗi; vite build PASS (6,86 s). Fix 530e10a7 đã hoàn thành nhiệm vụ chẩn đoán (kiểm chứng runtime loop 1–22, 21 wrap, coverage 7/7) và đã được gỡ theo quyết parent §12.3(a). T4 + T5 đề xuất GIỮ — ghi đầy đủ ở §5; quyết cuối thuộc về parent (có thể khôi phục fix từ diff đã lưu).**

## 0. Môi trường lúc T3 làm việc (02:40–03:48Z 18/11, chờ T8 rồi revert)

- Boot hiện tại: **78b55838-d09e-4cfc-b491-a15935b7a447**, btime 02:27:27Z (T5 ghi 02:27:38Z trong cờ — chênh 11 s, cùng boot_id; xem LIMITS T4 §4), **0 reboot** trong phiên T3 tới 03:06Z.
- **REBOOT giữa lúc chờ T8.done:** boot 78b55838 chết (last-seen 03:25:45Z, first-seen 03:36:08Z) → boot mới **bcc71e61-6d1b-4657-a80b-ba3e2e559140** (up 0' lúc 03:36:08Z, RAM 2000 MB). Wait-script `wait-t8.sh` bị SIGTERM theo reboot; T3 kiểm lại đĩa 03:36Z (T8.done vẫn chưa có; T5.done + T7.done đã có; preview.tsx vẫn 530e10a7) rồi khởi động lại wait-t8.sh. T5 phiên 02:41–03:11Z ghi 0 reboot trong phiên của mình — reboot này xảy ra SAU khi T5 đóng.
- RAM available: 873 MB lúc 02:41Z → 1656 MB (02:43Z) → 1387 MB (03:06Z).
- `~/workspace/repo-1` **không phải git repo** — md5 là phương pháp đối chiếu file duy nhất.
- Chốt chặn `round-in-progress.md` còn đó — T3 KHÔNG xóa (chỉ T10 xóa).

## 1. Giai đoạn A — chuẩn bị script bước 2 (02:41–02:45Z, TRƯỚC khi có dữ liệu)

- Script mới `hidden_files/round135-t3/t3-step2-verify135.py` (dựa trên script đợt 134, thêm nhánh partial — sửa lỗi F-134-T3-2): nếu `flip.wallMs is None` thì in "KHÔNG CÓ DU LIEU POST-FLIP" có kiểm soát, phân tích riêng log draw (loopNo/wrap) + tickCost pre-flip (ghi rõ KHÔNG phải số lượt yên), P1–P7 ghi KHÔNG KIỂM ĐƯỢC, exit 0 — không crash `TypeError`; thêm nhánh 0 post tick; guard median rỗng (`med()`).
- **Validate khô TRƯỚC khi T4.done có (02:41–02:45Z):**
  - Dry-run 1 — JSON partial đợt 134 (sha `b402b3f3…76bc6`): exit 0, khớp 100% phân tích riêng đợt 134 (n=53, loopNo {1:53}, wrap 0, loop≥3 = 0, tickCost median 58 pre-flip). File `t3-step2-dryrun-134partial.txt`.
  - Dry-run 2 — JSON lượt #10 đầy đủ (sha `e3ca1ac5…`): exit 0, khớp 100% nội dung file dry-run đợt 134 (median 39,5; post 39,0; (c2)=5 seq 166/218/293/323/394; P1 5/5; P3 5/5; coverage 0/5; hist khớp). File `t3-step2-dryrun-133a1.txt` (chỉ khác file gốc ở dòng in thêm `partial=`).
- Chờ T4.done bằng `wait-t4.sh` (poll 10 phút, hạn 04:30Z): **T4.done xuất hiện 03:03:15Z** (poll #3), T8.done chưa có lúc đó.
- `preview.tsx` lúc bắt đầu: md5 **530e10a7** (fix GIỮ theo quyết parent đợt 134 §12.3(a)). Bản gốc **805409f0** còn nguyên tại `hidden_files/round134-t3/preview.tsx.orig-805409f0` (đối chiếu lại 03:06Z: `805409f0046dbf43358aeec95bf46f15` — khớp).

## 2. Giai đoạn B — bước 2 trên JSON lượt yên #12 (phân tích độc lập từ JSON gốc)

File: `hidden_files/round135-t4/preview-b-f3-flip-webkit-t4-attempt1.json` — size **3.763.122 B**, sha256 `2efceefde7b26765a3c0a1466d715096ac453389c6d9170972fee708451b31df`, engine webkit 27.2, pageErrs=[], `partial=None`. Script chạy 03:03Z, exit 0, output `hidden_files/round135-t3/t3-step2-135a1.txt`.

### 2.1 Số liệu độc lập (T3) — đối chiếu T4 + T5-pha-2

| Hạng mục | Số độc lập (T3) | T4 | T5 pha 2 | Khớp? |
|---|---|---|---|---|
| flip | afterPass=5, wallMs=25478, passes=20 | như vậy | như vậy | ✓ |
| blendTick | n=557, post (flip+2000, viaRvfc=0) = 412, seq 145→556 | n=557, post 412 | seq 145→556 | ✓ |
| tickCost | n=682, median **40,0** ms (p90 65, max 101, min 28); post n=501 median **40,0** ms → **ĐẠT (≤60)** | n=682 median 40,0; post n=501 median 40,0 | — (không tính tickCost) | ✓ |
| histogram (m*−label) | n_ghost=824, nomatch=0, hist {-11: 2, -9: 2, -1: 48, 0: 319, +1: 216, +2: 210, +3: 27} | hist y hệt (t4-histogram-with12.py) | rerun y hệt (xem §4) | ✓ |
| snap/raw-label | snap median **35** ms (n=824), raw median **8** ms (n=824); occ0 snap 35 / raw 8 (n=412) | snap 35 (mean 40,9, p90 59), raw 8 | snap 35,0 (n=412 occ0), raw 8,0 | ✓ |
| label-floor | {0: 207, 1: 617} → +1 = **74,9%** (63–76) | không báo riêng | {} (không tính) — không mâu thuẫn | — |
| curPix run ≥3 tick | **15 run** [(163,166,4), (189,193,5), (217,222,6), (244,251,8), (274,278,5), (302,305,4), (330,332,3), (342,345,4), (356,363,8), (387,393,7), (416,421,6), (445,447,3), (473,479,7), (504,506,3), (531,534,4)] | 15 run | 15 run, y hệt danh sách | ✓ |
| (c2) skp=0 | n=**7**: (166,15,14,1), (251,15,14,1), (305,13,12,1), (363,13,12,1), (448,12,11,1), (480,13,12,1), (534,16,15,1) — toàn lag +1f | n=7, y hệt | n=7, y hệt | ✓ |
| (c2) skp=1 | n=**0** | 0 | 0 (labellag skp=1: (c)=0) | ✓ |
| (c) dạng ngờ skp=0 | n=7, skp=1 n=0 | 7 / 0 | 7 / 0 | ✓ |
| c2DrawLog | n=**1325** (drawSrc 682 / rawUnit 643); loopNo 1–22; **loop≥2 = 1262, loop≥3 = 1196**; wraps (frameIdx giảm) = **21**; frameIdx 0–72 (distinct 65); wallMs 9256→77903 (span 68.647 ms); srcKind 'canvas 1280x720' 1325/1325; readyState 4 1325/1325; seeking False 1325/1325 | n=1325, byLoop y hệt {1:63 … 22:1}, wraps 21 | n=1325, loopNo [1..22], wraps 21, B4 liệt kê 10 wrap đầu | ✓ |
| P7 coverage | **7/7** (delta −25…+31 ms); blendTick hậu-flip trong ±500 ms của log: 412/412 | 7/7 | 7/7, delta y hệt | ✓ (xem F-135-T3-1) |
| P7 lag gần (c2) | floor(ct*30)−frameIdx: {-1: 91, 0: 82}; chỉ drawSrc {-1: 46, 0: 41}; cặp rawUnit−drawSrc {0: 86} | — | {-1: 91, 0: 82}; drawSrc {-1: 46, 0: 41}; cặp {0: 86} | ✓ |
| Lớp B | (không thuộc bước 2 — ghi theo T4) 5/5 ĐẠT | 5/5 | — | ✓ |
| F6' (skippedLatest=1) | 0 vi phạm thật / 75 tick (theo labellag T4 — T3 không tính lại, chỉ đối chiếu) | ĐÓNG (100% ≥90%, n=75 ≥30) | — | ✓ |

### 2.2 P1–P7: từng cái KIỂM ĐƯỢC — tất cả ĐÚNG

- **P1 (curPix run ≥3 tick, (c2) gần run-end): ĐÚNG** — k=7/7, baseline 45/412 = 0,109, p = 1,85e-07. 5/15 run-end là (c2) [166, 251, 305, 363, 534]; T5 độc lập: 7/7 trong ±1 tick của run-end (kỳ vọng ngẫu nhiên 0,8).
- **P2 (100% (c2) lag ≥ +1f, 0 lag âm): ĐÚNG** — 7/7 lag +1f, 0 lag âm.
- **P3 (A1, đóng băng-tại-tick): ĐÚNG** — đóng băng 7/7 [166, 251, 305, 363, 448, 480, 534]; tick bắt kịp 0; baseline 88/411 = 0,214, p = 2,06e-05. T5 độc lập: 7/7, labelMs occ0 khớp tick trước từng seq.
- **P4 (thuần +1f 2–8; tổng skp=0 2–12; skp=1 = 0; lag ≥+5f = 0): ĐÚNG** — thuần +1f = 7; tổng skp=0 = 7; skp=1 = 0; lag ≥+5f = 0.
- **P5 (snap-label median 34–48 ms; raw-label 8–10 ms; label-floor +1 63–76%; run ≥3 tick 13–22): ĐÚNG** — snap 35 ms; raw 8 ms; label-floor +1 = 74,9%; run ≥3 = 15.
- **P6 (khoảng thực nghiệm 8 lượt, KHÔNG verdict): TRONG KHOẢNG** — bin0 = 38,7% (33–39); +1/+2 = 51,7% (33–53); +3 = 3,3% (3–19). Ghi chú: hist có 4 occ ở bin −11/−9 (2+2, 0,5% ghost occ) — artifact aliasing của m* (xem F-135-T3-2); không ảnh hưởng P6.
- **P7 (log draw phủ ≥1 seq (c2), drawSrc không trễ sau ct): ĐÚNG — KIỂM ĐƯỢC LẦN ĐẦU SAU 4 LƯỢT** — coverage 7/7; tại entry gần (c2): floor(ct*30)−frameIdx chỉ −1/0, **0 entry drawSrc trễ ≥+1f** → làm yếu giả thuyết desync seek-latency. Cặp rawUnit−drawSrc gần nhất: {0: 86} (cùng frame). Caveat giữ nguyên: log thưa (drawSrc gap median 82,0 ms, n=681, >66 ms: 567) nên không phân giải lệch 1 frame — P7 là "làm yếu desync", không phải "bác bỏ tuyệt đối".
- **Cộng dồn (prereg đứng nguyên, không sửa sau khi thấy dữ liệu):** P1 **21/21** (14/14 + 7/7), P3 **20/21** (13/14 + 7/7). P2/P4 đúng cộng dồn.
- **Ngưỡng ≤60 ms GIỮ:** chuỗi 10 lượt yên hợp lệ nay 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / **40,0** ms, trung bình 46,6 ms (trước đây 46,9 ms với 9 lượt). Không đề xuất đổi ngưỡng, bar hay DEF.

### 2.3 Logger đã nới — KIỂM CHỨNG RUNTIME LẦN ĐẦU (điểm fix cần chứng minh)

- c2DrawLog n=1325 phủ **loop 1–22 đầy đủ**: loop 3–19 mỗi loop 62–72 entry; loop≥3 = 1196 entry (90,3% log); **21 wrap** (frameIdx giảm liên tiếp). Khác hẳn đợt 134 partial (n=53, toàn loop 1, 0 wrap) và logger cũ đợt 133 (byLoop chỉ {1:66, 2:71} — bị cắt ở loop 2).
- Hai entry biên loop 20 và loop 22 chỉ có 1 entry mỗi loop (T4 ghi "2 entry biên tại wrap") — log kết thúc giữa loop 22 (entry cuối wallMs 77903, loop 22, frameIdx 70); không phải lỗi ghi — probe kết thúc sau pass 20.
- 1 epoch duy nhất (không re-arm giữa chừng); log phủ toàn bộ hậu-flip (log max − flip = +52.425 ms).
- **Kết luận: fix loop-gate nới + re-enable không xóa mảng ĐÃ HOẠT ĐỘNG ĐÚNG ở runtime.** Đây là lần đầu tiên logger ghi được loop ≥3 — đúng thứ mà quyết parent đợt 134 §12.3(a) yêu cầu đo trước khi quyết revert.

## 3. Đối chiếu chéo với T5 pha 2

- **T5 pha 2 CÓ dữ liệu mới** (khác đợt 134 — khi đó T5 pha 2 chưa có lúc T3 đóng). File `round135-t5/t5-c2-drawlog-analysis.txt` (03:02:05Z, script độc lập `t5-c2-drawlog-analysis.py` viết 02:52Z): **khớp 100% mọi số so sánh được** — (c2) 7 seq/lag, coverage 7/7 + delta, loopNo 1–22, wraps 21, P1 7/7 (baseline 45/412), P3 7/7 (baseline 88/411), skew occ0 snap 35 / raw 8, P7 lag {-1:91, 0:82} / drawSrc {-1:46, 0:41} / cặp {0:86}, drawSrc gap median 82,0 ms.
- **T5 LIMITS §8 xác nhận lại (cờ `round135-t5.done` 03:16Z):** "P1–P5, P7 ĐỀU DUNG (độc lập bằng script riêng + chạy lại code T3 — khớp 100% mọi số với T4 và với rerun T3; chỉ 1 khác biệt tie-break ở seq 251, xem §8.5). P6 trong khoảng thực nghiệm. Cộng dồn: P1 21/21, P3 20/21." — khớp hoàn toàn kết luận bước 2 của T3 (§2.2). T5 cũng ghi điều kiện revert "sau khi đo" ĐÃ XẢY RA với kết quả tốt và **đồng ý đề xuất GIỮ fix 530e10a7** (quyết cuối thuộc parent; T4 cũng đề xuất GIỮ) — xem §5.
- **T5 histogram rerun KHÔNG độc lập:** `t5-histogram-rerun.txt` (03:04:07Z) giống hệt output script T3 `t3-step2-135a1.txt` (diff chỉ khác đường dẫn file tương đối/tuyệt đối ở dòng đầu) — T5 đã chạy lại chính script bước 2 của T3, không phải implementation riêng. Ghi rõ để T10 khỏi tính đây là kiểm chứng độc lập thứ ba cho histogram/P1/P3; kiểm chứng độc lập thật cho P1/P3/coverage là T5 `t5-c2-drawlog-analysis.py` + analyzer của T4.
- T5 không tính label-floor (ghi `{}`) và không tính tickCost — không mâu thuẫn với số T3 (74,9% / median 40,0).
- T5 B3: mỗi loop drawSrc có 6–12 lần lặp frame và 16–22 lần nhảy >1 frame, 0 lần lùi frame — phù hợp log thưa ~82 ms (không phải bằng chứng desync; xem caveat P7 §2.2).

## 4. Lỗi quy trình của T4 trong lượt này (ghi lại, không thuộc bước 2)

- **F-135-T4-1 (T4 tự ghi §5 LIMITS T4):** poller gọi nhầm `run-attempt-134.sh` (file không tồn tại) → exit 127, cửa yên mở lần 1 (poll #6, 02:46:33Z, RAM 1031 MB) bị bỏ lỡ, 0 attempt chạy. Đã sửa trong 1 phút, cửa mở lại 02:50:57Z (RAM 1632 MB), attempt1 thành công. Không mất dữ liệu đo; chỉ mất ~4 phút. T3 không sửa gì thêm — ghi lại để T10/T8 rút kinh nghiệm adapt script (grep toàn bộ chuỗi số đợt cũ + `ls` file được gọi trước khi mở poller).
- Blockers=3 ở poll #5 poller 1 chưa xác định danh tính (T4 ghi "không lưu ps tại poll đó") — không ảnh hưởng attempt1; nợ cho đợt sau (log ps snapshot khi blockers>0).

## 5. Xử lý REVERT — ĐÃ REVERT (T4.done 03:03Z + T8.done 03:39Z đều có)

- T4.done có 03:03Z; T8.done có 03:39Z (T8: harness 3/3 exit 0 sau 1 retry — 84l10 TIMEOUT 124 lần 1, retry exit 0; 85m4 + 86n2 exit 0; fixture rebuild 6/6 md5 khớp; cây 530e10a7 suốt lượt; 1 reboot SAU khi xong việc 78b55838 → bcc71e61). Cả hai cờ đều có trước hạn chờ 04:30Z → đủ điều kiện revert theo brief.
- **Reboot giữa lúc chờ T8.done** (03:25–03:36Z, 78b55838 → bcc71e61) giết wait-script lần 1; T3 kiểm lại đĩa và khởi động lại wait — T8.done được phát hiện ở poll 03:46:39Z. Reboot không ảnh hưởng cây (preview.tsx vẫn 530e10a7 sau reboot) và không ảnh hưởng T8 (harness đã xong trước reboot).
- Điều kiện đo trong brief: T4 đã đo được **≥1 attempt hợp lệ với logger đã nới** (attempt1, 20/20 pass) → theo cây quyết định của brief, **REVERT về 805409f0** — đã thực hiện 03:47Z:
  1. Lưu bản trước revert: `hidden_files/round135-t3/preview.tsx.pre-revert-530e10a7` (md5 `530e10a7…` — khớp cây lúc đo).
  2. Khôi phục: `cp hidden_files/round134-t3/preview.tsx.orig-805409f0 → apps/web/src/preview.tsx`.
  3. Verify md5 sau revert = **805409f0** (đầy đủ `805409f0046dbf43358aeec95bf46f15`).
  4. `diff preview.tsx.orig-805409f0 preview.tsx` = **RỖNG — file sau revert giống hệt bản gốc từng byte** (không thừa/thiếu dòng nào); `grep c2DrawLogMaxLoop|__vcutC2DrawLogReset` = 0 lần xuất hiện (code fix đã gỡ sạch).
  5. Diff revert (`hidden_files/round135-t3/preview-revert.diff`, 41 dòng): gỡ đúng 4 hunk của fix — hàm `c2DrawLogMaxLoop()`, khai báo `__vcutC2DrawLogReset`, nhánh reset có điều kiện → khôi phục reset vô điều kiện, loop-gate nới → khôi phục gate `> 2`.
  6. **tsc 0 lỗi** (03:47Z); **vite build PASS** (03:48Z, 6,86 s, `dist/assets/index-C8_2QH0R.js` 1.689,69 kB; chỉ cảnh báo chunk >500 kB như mọi lần — không phải lỗi mới).
- **Cân nhắc ngược (T4 + T5 đề xuất GIỮ — ghi đầy đủ để parent/T10 quyết cuối):** T4 LIMITS §6/§10.1 và T5 LIMITS §8 cùng đề xuất GIỮ fix 530e10a7 vì fix đã chứng minh ghi được loop ≥3 + wrap và coverage 7/7 lần đầu; revert sẽ khiến các lượt yên sau lại mất khả năng kiểm P7 (logger cũ cắt ở loop 2, coverage 0/5 như lượt #10). T3 ghi nhận đề xuất này là có căn cứ kỹ thuật, NHƯNG brief T3 (quyết parent §12.3(a): "revert sau khi có một lượt đo hợp lệ") và cây quyết định trong brief chỉ hướng revert — T3 đã làm theo brief. **Hệ quả đã rõ cho đợt 136:** nếu đo lượt yên #13 bằng cây hiện tại (805409f0), P7 sẽ lại KHÔNG kiểm được trừ khi T3 đợt 136 sửa lại fix trước khi đo; nếu parent quyết GIỮ thì khôi phục fix bằng `preview-fix.diff` đã lưu (`round134-t3/preview-fix.diff`) + verify md5 530e10a7 + build lại — 1 bước, không mất dữ liệu.
- **preview.tsx ĐƯA VÀO stage file đợt này** (net-change của đợt: revert fix đã duyệt sau khi đo xong — đúng quy trình; T10 đối chiếu md5 lúc đóng: 805409f0).

## 6. Trạng thái sau đóng (kiểm cuối 03:48Z 18/11)

- preview.tsx md5 cuối: **805409f0** (đã revert; fix 530e10a7 đã gỡ).
- Boot bcc71e61 còn sống (up 11' lúc 03:46Z); không reboot thêm trong lúc T3 revert + build.
- tsc 0 lỗi; vite build PASS sau revert. Không process đo nào còn chạy của T3 (chỉ đọc file + chạy script phân tích + build kiểm chứng).
- Stage: `phase9-round135-t3-c2.txt` (2 entry: LIMITS này + `apps/web/src/preview.tsx`), verify read-back. KHÔNG push.
- Cờ `round135-t3.done` ghi khi LIMITS + stage xong (tóm tắt: bước 2 có dữ liệu mới, P1–P7 đều ĐÚNG, P7 kiểm được lần đầu; ĐÃ REVERT về 805409f0 sau khi T4.done + T8.done đều có; md5 cuối 805409f0).
- Hồ sơ: `hidden_files/round135-t3/` — `t3-step2-verify135.py` (script bước 2 đã sửa lỗi partial), `t3-step2-dryrun-134partial.txt`, `t3-step2-dryrun-133a1.txt`, `t3-step2-135a1.txt` (output bước 2 lượt #12), `PREP.md`, `wait-t4.sh` + `wait-t4.log`, `wait-t8.sh` + `wait-t8.log`, `preview.tsx.pre-revert-530e10a7`, `preview-revert.diff`.

## 7. Sai số / ghi chú của chính T3 (ghi trung thực)

1. **F-135-T3-1 (quan sát, không phải lỗi — tie ±27 ms ở seq 251):** log entry gần nhất của (c2) seq 251 (tBlend=40899) có HAI entry cách đều ±27 ms (40872 và 40926). Script T3 và T5 chọn 40926 (delta +27); coverage-check của T4 chọn 40872 (delta −27). Cả hai đều trong ±500 ms → COVERED; coverage 7/7 không đổi. Chỉ khác dấu delta do cách phá tie khác nhau, không phải lệch số liệu.
2. **F-135-T3-2 (ghi chú histogram):** hist có 4 ghost occ ở bin −11/−9 (2+2, 0,5% trong 824 occ) — m* là frame khớp gần label nhất trong GT alias chu kỳ 4 frame nên có thể nhảy xa khi strip mơ hồ; không phải bằng chứng lag âm thật (P2 xét trên (c2) pixel-thật, vẫn 0 lag âm). Các bin này cũng xuất hiện ở lượt #10 (−9: 2). Không ảnh hưởng P1–P7.
3. **F-135-T3-3 (nhỏ — script bước 2 thiếu thống kê loopNo ở nhánh đầy đủ):** nhánh JSON đầy đủ của `t3-step2-verify135.py` không in phân phối loopNo (chỉ nhánh partial có); T3 phải tính thêm bằng one-liner riêng (§2.1, loop≥2 = 1262, loop≥3 = 1196). Số liệu đã kiểm chứng chéo với T4/T5 (byLoop y hệt) nên không ảnh hưởng kết luận; đợt sau nên thêm dòng in loopNo vào nhánh đầy đủ.
4. **F-134-T3-2 ĐÃ SỬA (đợt này):** script bước 2 nay chịu được JSON partial (validate khô §1) — lỗi crash `TypeError` đợt 134 không tái diễn; nhánh partial không cần dùng vì lượt #12 có JSON đầy đủ, nhưng đã chứng minh chạy được.

## 8. Câu hỏi cho parent (T10 đưa vào §12 LIMITS gộp)

1. **REVERT hay GIỮ fix 530e10a7 — T3 ĐÃ REVERT theo brief** (§5). T4 + T5 đề xuất GIỮ (đã kiểm chứng runtime tốt; revert thì lượt sau mất khả năng kiểm P7). Nếu parent quyết GIỮ thì lần sau chỉ cần khôi phục lại fix từ diff đã lưu (`round134-t3/preview-fix.diff`, verify md5 530e10a7 + build lại).
2. **Lượt yên #13 đo bằng logger nào?** Nếu đã revert: logger cũ (P7 lại không kiểm được, coverage 0/5 như lượt #10) trừ khi T3 đợt 136 sửa lại fix trước khi đo. Nếu giữ: logger nới tiếp tục đo được P7.
3. **F-135-T4-1:** có cần quy định kiểm tra tên file được gọi (ls thực tế) trước khi mở poller ở các đợt sau không? (T4 đã đề xuất trong LIMITS T4 §10.2.)
