# PHASE9 ROUND187 T1 — Verify đợt 186: PASS, đếm khớp lần thứ 100 liên tiếp

Đợt 187 mở lượt cron 03:35 +07 25/11/2026 (= 20:35:51Z 24/11); T1 đóng cờ ~21:2xZ
24/11/2026, trong hạn cờ ~23:00Z. Nhiệm vụ: tái kiểm độc lập toàn bộ số đếm đợt 186
bằng hai phương pháp viết mới + kiểm kích thước LIMITS đợt 186 + cập nhật GAP §115
+ ghi nhận §12.3 aggregate 186 (parent viết 21:07Z sau khi T10-186 đóng 20:59:43Z —
T1 kiểm lại lần cuối ~21:1xZ, xem §5).

## Verdict: PASS — mọi số đếm đợt 186 KHỚP từng số bằng hai phương pháp viết mới

- **Đợt 186 = 10 batch / 19 entry / 18 đường dẫn khác nhau / 14 file mới** (sau closing;
  trước closing 9/17/17/13 — xem §2).
- **Lũy kế 111–186 = 748/1.294/1.124/946.**
- **Chờ push 166–186 = 210/315/286/282.**
- **Tái kiểm 111–185 = 738/1.275/1.110/932 — KHỚP quyết parent (q) đợt 185.**
- **Tái kiểm 111–184 = 728/1.259/1.096/918 — KHỚP quyết parent (q) đợt 184.**
- **Tái kiểm 111–183 = 718/1.244/1.082/904 — KHỚP quyết parent (q) đợt 183.**
- **Tổng 1–186 = 1.396/7.164/3.929; tổng 1–185 = 1.386/7.145/3.915 — KHỚP (q) đợt 185.**
- **0 file thiếu trên đĩa** (kiểm trực tiếp 3.929 đường dẫn duy nhất trong khoảng 1–186
  bằng shell + 3.932 đường dẫn toàn cục (gồm 3 LIMITS đợt 187 đã stage) bằng python —
  cả hai phương pháp đều 0 thiếu).
- **Chuỗi khớp nối dài lần thứ 100 liên tiếp:** T10-185 = 95 → parent-185 = 96 →
  T1-186 = 97 → T10-186 = 98 → parent-186 = 99 → **T1-187 = 100** (số thứ tự
  T10-186 = 98 và parent-186 = 99 lấy từ §10.3/§12.3 aggregate 186; T1 xác nhận
  số của mình là 100 vì mọi số (q) đều khớp dedup độc lập của T1).

## 1. Phương pháp (cả hai viết mới hoàn toàn, không dùng script cũ, không dùng script mang nhãn parent)

- **Python** `hidden_files/round187-t1/recount-187-t1.py` → `recount-187-t1.out`
  (PY_EXIT=0; chạy lần cuối sau closing 21:1xZ). Quét **1.399 file** `phase9-round*.txt`
  (round 1–187 — gồm 3 file đợt 187 đã stage lúc đếm lần cuối: t0/t5/t6; các khoảng
  ≤186 không bị ảnh hưởng); purity 0 cảnh báo (0 entry rỗng, 0 file thiếu NUL cuối).
  Chuẩn hóa đường dẫn tuyệt đối của T2 về tương đối trước khi dedup. Sắp xếp theo
  SỐ ROUND tăng dần (tránh lặp F-173-T1-3 / F-185-T1-2). Đếm lại toàn cục, không cộng dồn.
- **Shell** `hidden_files/round187-t1/crosscheck-187-t1.sh` → `crosscheck-187-t1.out`
  (SH_EXIT=0, chạy ~224 s). Chỉ dùng `tr`/`sort -u`/`comm`/`wc` — không dùng python;
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union(trước khoảng).
  **KHỚP từng số** với phương pháp python (cả 8 khoảng + 0 file thiếu).
- **Kiểm trực tiếp trên đĩa:** mọi đường dẫn duy nhất đều tồn tại dưới `~/workspace/repo-1`
  (python `Path.exists` + shell `[ -e ]` — hai lần kiểm độc lập, cùng 0 thiếu).

## 2. Số đếm chi tiết đợt 186 (trước và sau closing — T1 đếm cả hai lần, KHỚP T10)

- **Trước closing** (đếm lần đầu ~20:4xZ, 9 batch, chưa có closing): 9/17/17/13
  (T0 1, T1 2, T2 1, T4 5, T5 1, T6 1, T7 1, T8 4, T9 1; không có T3).
- **Sau closing** (đếm lần cuối ~21:1xZ, closing 54 B, 2 entry NUL-delimited đã kiểm
  bằng `od -c`): **10/19/18/14** — closing +1 batch, +2 entry, +1 đường dẫn,
  +1 file mới. **KHỚP §10.3 T10-186 và (q) §12.3-186 từng số.**
- 4/18 đường dẫn TOÀN ĐỢT KHÔNG phải file mới:
  `PHASE9_GAP_ANALYSIS.md` (first_seen round 59 — T1 cập nhật §112 + §114, closing
  thêm §115) + 3 script harness T8 đã stage từ trước: `clicktest-84l10-webkit-loop-w1.mjs`
  (first_seen round 84), `clicktest-85m4-webkit-w7-hb128.mjs` (round 128),
  `clicktest-86n2-webkit-w7-hb128.mjs` (round 178) — đợt này chỉ đổi nội dung/md5.
  File mới đợt 186 (14): 9 LIMITS + 4 script T4 (`poll-wait-t4-186.sh`,
  `run-attempt-186.sh`, `run-analyzers-186.sh`, `distinct-seq-186.py`) + aggregate 186.
- Lũy kế 111–186 = **748/1.294/1.124/946**; chờ push 166–186 = **210/315/286/282**;
  tổng 1–186 = **1.396/7.164/3.929**.
- **Cảnh báo phương pháp (đã tránh):** cộng dồn số học từ (q) đợt 185 sẽ cho file mới
  đợt 186 = 16 (17 − 1 GAP) là SAI — dedup toàn cục cho 13 vì 3 script T8 đã có
  từ trước. Đây là lý do bắt buộc đếm lại toàn cục mỗi đợt, không cộng dồn.

## 3. Cờ đợt 186: 9/9 có nội dung (8/9 trong hạn cờ, T9 trễ ~12' trong hạn cứng)

- 9/9 file `.done` có mặt trên đĩa, kích thước 713–3.457 B, đều có nội dung:
  T0 18:07Z, T1 17:53Z, T2 18:37Z, T4 18:25Z, T5 18:09Z, T6 18:30Z, T7 20:00Z
  (đúng hạn cờ ~20:00Z), T8 19:26:47Z, T9 20:12Z.
- **T9 trễ ~12' so với hạn cờ ~20:00Z, trong hạn cứng ~20:35Z** — KHÔNG có gộp muộn
  (T9 đóng trước khi T10-186 bắt đầu đóng sổ; parent đã kiểm trực tiếp lúc 20:02Z:
  LIMITS T9 đã có trên đĩa 42.233 B, đang làm việc). **Chuỗi 9/9 = 8 nếu parent
  tính tiếp** (tiền lệ đợt 182/183/184: trễ trong hạn cứng vẫn tính tiếp; parent
  quyết cuối ở §12.3-186).

## 4. Kích thước LIMITS đợt 186: 0/9 VƯỢT giới hạn push — nhưng 5 file sát giới hạn (F-187-T1-1)

| Luồng | Kích thước | So với 37.768 B |
|---|---|---|
| T0 | 21.322 B | dư 16.446 B |
| T1 | 8.314 B | dư 29.454 B |
| T2 | 37.736 B | **dư 32 B** |
| T4 | 36.777 B | dư 991 B |
| T5 | 37.767 B | **dư 1 B** |
| T6 | 37.754 B | **dư 14 B** |
| T7 | 15.197 B | dư 22.571 B |
| T8 | 37.749 B | **dư 19 B** |
| T9 | 37.739 B | **dư 29 B** |

- **0/9 file VƯỢT giới hạn push 37.768 B** (đo trực tiếp bằng `stat` lúc ~20:5xZ).
- **F-187-T1-1 (mới — quan sát, không vi phạm): 5/9 LIMITS đợt 186 nằm trong 32 B
  dưới giới hạn push** (T5 chỉ dư **1 B**, T6 dư 14 B, T8 dư 19 B, T9 dư 29 B,
  T2 dư 32 B) — bất kỳ lần sửa/gộp muộn nào chạm 5 file này đều vượt giới hạn;
  T9 đã phải gọn LIMITS từ **42.233 B xuống 37.739 B** trong lúc đóng cờ
  (parent kiểm trực tiếp lúc 20:02Z: 42.233 B, mtime 20:01:45Z). Bài học: các luồng
  viết LIMITS sát giới hạn cần chừa biên an toàn, đừng cắt gọn vào phút cuối.
- Script T8 đợt 186 (đo trực tiếp): 84l10 35.917 B (dưới giới hạn);
  **85m4 38.737 B VƯỢT 969 B; 86n2 43.653 B VƯỢT** — lúc push cần `ENABLE_PRIVSEP=0`
  (đã ghi trong log parent; T1 xác nhận lại bằng stat).
- **Aggregate 186 = 107.950 B lúc T1 đo lần cuối (~21:1xZ) — VƯỢT giới hạn push**
  (lúc push cần `ENABLE_PRIVSEP=0`); 96.703 B lúc T10 đóng 20:59:43Z, tăng do parent
  viết §12.3 (xem §5).

## 5. §12.3 aggregate 186 — ĐÃ ĐƯỢC PARENT VIẾT, SẠCH (không điền sẵn)

- **§12.3-186 ĐÃ ĐƯỢC VIẾT — SẠCH, không điền sẵn (lần đầu sạch kể từ đợt 183;
  tổng số lần điền sẵn VẪN 18).** Bằng chứng T1 kiểm trực tiếp trên đĩa:
  (1) cờ `round186-t10.done` ghi rõ "§12.3 aggregate 186 ĐỂ TRỐNG HOÀN TOÀN" +
  "Aggregate: 96.703 B lúc T10 đóng"; (2) tiêu đề §12.3 ghi parent viết trực tiếp
  lượt cron 03:35 +07 25/11/2026 (21:07Z 24/11), "§12.3 TRỐNG khi parent đọc
  (aggregate 96.703 B lúc T10 đóng 20:59:43Z, không đổi lúc parent kiểm 21:03Z
  và 21:07Z)"; (3) aggregate hiện 107.950 B (khớp mục log "Aggregate sau quyết
  parent = 107.950 B"); (4) tiêu đề §12.2 đã đánh dấu "(đã quyết ở §12.3 dưới)".
- **Verify (q) trong §12.3: KHỚP dedup của T1 từng số** — đợt 186 = 10/19/18/14;
  lũy kế 111–186 = 748/1.294/1.124/946; chờ push 166–186 = 210/315/286/282;
  tái kiểm 111–185 = 738/1.275/1.110/932; tổng 1–186 = 1.396/7.164/3.929;
  0 file thiếu; chuỗi 9/9 = 8. Parent kiểm bằng dedup python viết mới
  `/tmp/count-186-parent.py` — CHỈ python (không chạy lại shell crosscheck) —
  **lần thứ 99 liên tiếp**; T1-187 verify độc lập bằng cả hai phương pháp là
  **lần thứ 100**. T1 KHÔNG phán thay parent về nội dung các quyết (a)–(r) ngoài
  số đếm (q); tóm tắt quyết chính: (b) FULL PASS 1 → 0 (ĐỨT); (c) #107 CÓ cờ
  (CÓ caveat), #105 KHÔNG cờ, tổng boot không cờ 23 → 24; (d) INSIDE #104 TRUE
  (FULL150, 5 → 6) + INSIDE #105 TRUE (FULL151, 6 → 7); **(e) mâu thuẫn số hiệu
  QUYẾT THEO T0: cea79500 = #107, #106 = reboot chưa xác minh (ước ~15:13:32Z),
  hệ quả 7ea9d047 = #108, 6f1d9f87 = #109 (btime 20:30:33Z)**; (f) (m) #105 DƯƠNG
  (CUỐI); (g) n 47/48, chính thức GIỮ 14; (h) E-232/E-233 GIỮ TÁCH; (i) holder
  chuỗi 10/11 (theo cách T0; #106 không tính); (j) B1 live sạch lần 4, 84l10
  PASS = 6, 86n2-P1 = 9, F-186-T8-3 số log sạch chuẩn 21 (md5); (m) lượt yên #55
  không hợp lệ, chuỗi 47 → 0; (n) run 185 + 186 đều là CA ≥60 s mới (thứ 17 + 18);
  **(o) OUTAGE 8.406 s TÍNH LÀ OUTAGE #2 + MỞ ĐIỀU TRA hướng "cố định theo giờ"**
  (T7-187 thu thập khung 23/11; T7-188 kết luận); **(p) 0 vi phạm 1 → 2; live lần 6
  ĐẠT; F-186-T4-2 KHÔNG TÁCH luật B2; F-186-T9-1 TÍNH LÀ "guard mở lần đầu" +
  ĐỒNG Ý auto-trigger về nguyên tắc** (T9-187 thiết kế + kiểm offline; live từ
  đợt 188 nếu đạt); (q) đếm chấp nhận (ghi chú: 3.930 đường dẫn trên đĩa lúc parent
  kiểm — hơn tổng file mới 1 vì LIMITS T6-187; lúc T1 kiểm lần cuối là **3.932** —
  thêm LIMITS T0-187 + T5-187 đã stage sau đó); (r) KHÔNG PUSH — 210/315/286/282
  chờ user push.

## 6. GAP §112 / §114 — F-185-T1-1 ĐÃ ĐÓNG, xác nhận lại

- Cụm từ `"chuỗi 9/9 = 4 DỪNG Ở 4"` còn **0 lần trong §112** (dòng 2364–2376) —
  prose §112 đã ở trạng thái sau gộp muộn T7 đợt 183 ("9/9 luồng đã xong (T7 gộp
  muộn 08:08Z)"; "chuỗi 9/9 = 5"). **F-185-T1-1 ĐÓNG — đã xác nhận độc lập.**
- Cụm từ còn đúng **1 lần trong toàn GAP, tại dòng 2392 trong §114** — là trích dẫn
  lịch sử trong bullet "T1 verify 184" (ghi lại nội dung F-185-T1-1 lúc phát hiện),
  giữ nguyên đúng — KHÔNG phải prose §112 chưa sửa.
- GAP §114 đã có bullet "T1 verify 185" (T1-186 bổ sung). GAP §115 do T10-186 tạo
  (header + bullet T10 verify) — T1 đã bổ sung 2 bullet verify + nợ mở đợt 187 vào
  §115 (xem §8; GAP 1.029.530 B lúc T1 bắt đầu, 1.032.254 B sau closing T10-186).

## 7. Tóm tắt đợt 186 (đọc từ LIMITS 9 luồng + log parent; T1 chỉ verify số đếm, KHÔNG chạy lại đo đạc)

- **Run 185 SUCCEEDED 14:31:59Z (margin +232 s, jitter 0, viết lại ×1 tại #105;
  claimed→finished 94 s → CA ≥60 s MỚI thứ 17)** + **run 186 SUCCEEDED 14:52:42Z
  (margin +9.789 s, jitter 0; claimed→finished 128 s → CA MỚI thứ 18)** — họ CA
  đếm lại toàn bộ từ DB tươi: 18 ca toàn lịch sử / 15 trong cửa sổ; run 182→186
  SUCCEEDED liên tiếp (5 lượt, 0 timeout mới).
- **Lượt yên WebKit #55: KHÔNG CÓ LƯỢT HỢP LỆ** — cả 3 attempt đều 20/20 nhưng đều
  bị loại (median leo 60,0 → 68,0 → 79,0 ms; B2 vi phạm do burst tự-tải) —
  **chuỗi lượt yên 47 → 0 (ĐỨT)**; **FULL PASS đề xuất 1 → 0 (ĐỨT)** — 4/5 chân
  cùng boot #107, thiếu chân lượt yên. Quyết (p) kiểm chứng live lần 6: ĐẠT.
- **B2 ĐÃ MỞ** (quyết (j) đợt 185): offline ĐẠT + live SẠCH; harness 6/6 trên #107;
  O8 T8 3/3; replay V2 4/4 kẹt @125 s, V1-300 đối chứng 3/4, 0 FP trên 21 log sạch.
- **GUARD BỊ VƯỢT LẦN ĐẦU SAU 39 ĐỢT (F-186-T9-1 — phát hiện lớn nhất đợt):**
  3 mẫu liên tiếp ≥ guard trên #107 (17:48:05–17:50:05Z, max 106,0% guard, balloon
  xả về 0); 0 lần chạy birefnet — nhưng KHÔNG còn đọc là "guard chặn đúng"; chuỗi
  0 mẫu ≥ guard ĐỨT ở đợt 186; chuỗi 0 lần chạy vẫn 40 đợt. Parent/T10 quyết.
- **POSTBOOT_PASS #107 ĐÃ CÓ 17:48:46Z** (repair-sớm-quyết-h, poll=1, CÓ caveat);
  **#105 KHÔNG CÓ cờ — KHÔNG THỬ REPAIR** (boot đã chết; tiền lệ #100/#83 (b2)) —
  tổng boot không cờ 23 → 24 nếu parent chấp nhận. Hướng (3) VẪN ĐỨNG lần 33.
- **OUTAGE scheduler 8.406 s LẶP LẠI (F-186-T7-1):** im lặng hoàn toàn
  15:15:34Z–17:35:40Z, 0 execution mọi job; mọi số đo trùng OUTAGE 179 tới từng
  giây (chỉ lệch 1 s ở hai đầu mốc); lần này outage NẰM TRONG cửa đợt. **Cửa slot
  đợt 186 KHÔNG LÀNH — chuỗi cửa lành 11 lần DỪNG** (HB 9/12, DR 3/5; muộn HB 10 → 11).
- **MÂU THUẪN SỐ HIỆU CHƯA QUYẾT:** T0-186 gọi cea79500 là #107 (#106 CHƯA XÁC MINH,
  F-186-T0-1), T2-186 gọi là #106 — ảnh hưởng chuỗi holder, (m) #106, FULL;
  T10-186 đối chiếu, parent quyết cuối ở §12.3-186. Reboot mới ứng viên #108
  (7ea9d047, btime 19:09:52Z, gap #107→mới = 6.602 s).
- **(m) #105 DƯƠNG** (+34,931 s, TRONG dải [33; 49,8] nhưng SÁT biên dưới 1,931 s —
  chặt nhất từ trước tới nay; overlap watcher-185 +24 s không lật verdict);
  **INSIDE #104 TRUE (FULL150, chuỗi 5 → 6) + INSIDE #105 TRUE (FULL151, chuỗi
  6 → 7)**; **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 29**; mù VẪN MỞ (hole-recheck lần 30,
  NEW=0; U union-B max ĐỔI 7.861 → 8.643 s — hố lặng chứa boot #106 đã biết,
  KHÔNG phải hố mù mới, F-186-T2-9).
- **(A) 120/120 lần thứ 36** (tổng 4.320/4.320); prune lần 61 (xóa 2, queue 102 → 100);
  F-147-T6-1 chuỗi VẪN 0 lần thứ tám; headroom 0 lần thứ 46; ENOSPC lần thứ 35
  (105 dòng trực tiếp, ngoại suy ≈113); E-233 VẪN GHIM lúc đóng.

## 8. Nợ mở đợt 187 (đã bổ sung vào GAP §115 — lấy từ §11 aggregate 186 + quyết parent §12.3-186)

Kết cục run 187 (T7-187 — viết lại ×1 tại #108; jitter 0; hạn 20:35:51Z) + số hiệu
#106/#107 ĐÃ QUYẾT THEO T0 (cea79500 = #107; #106 chưa xác minh, ước ~15:13:32Z;
7ea9d047 = #108; 6f1d9f87 = #109, btime 20:30:33Z) + (m) #107/#108 + INSIDE #107/#108
(FULL153/FULL154) thuộc T2-187; (m) #106 KHÔNG PHÂN LOẠI ĐƯỢC (0 requeue) + (m) #105
DƯƠNG + INSIDE #104/#105 TRUE (parent 186 quyết cuối; n ứng viên 47/48) + E-233 nếu
ghim tiếp (T9-187; tách E-232/E-233 GIỮ TÁCH theo quyết (h)) + B2 đã mở (T8-187 kiểm
live tiếp — chưa bắt kẹt thật; F-186-T8-3 số log sạch chuẩn 21) + OUTAGE #2 — MỞ ĐIỀU
TRA hướng "cố định theo giờ" (T7-187 thu thập khung 23/11; T7-188 kết luận) +
F-186-T9-1 guard mở lần đầu (T9-187 thiết kế auto-trigger + kiểm offline; live từ
đợt 188 nếu đạt) + F-186-T4-2 KHÔNG TÁCH luật B2 (T4-187 tích lũy dữ kiện) +
(m) #56 lần 30 (T2-187) + mù #96?/#95?/#94?/#88? (hole-recheck lần 31)/#77?
(U union-B max 8.643 s) + prune lần 62 (T6-187) + OUTAGE 179 nguyên nhân chưa xác
định (host-side — theo dõi; HB-late 11) + headroom 0 lần 47? (T9-187) + ENOSPC
(T9-187) + birefnet 0 lần chạy trong 40 đợt (chuỗi 0 mẫu ≥ guard ĐỨT ở đợt 186) +
nhắc mọi luồng: kiểm gate trước VÀ trong lúc script dài chạy (F-184-T2-8) + gọn file
LIMITS dưới 37.768 B khi có thể (T5 37.767 B — chỉ dư 1 B; 5/9 file trên 37.700 B) +
script 85m4-hb128 38.737 B + 86n2-hb128 43.653 B VƯỢT giới hạn push (lúc push cần
ENABLE_PRIVSEP=0) + fixture /tmp mất theo reboot 7ea9d047 — T8-187 rebuild lại +
G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user;
TTS 39 cấm kiểm lại; file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`
— số phận vẫn chưa quyết; replay đình trệ xen kẽ (#102 không, #103 có, #104 không)
— #105 KHÔNG XÁC ĐỊNH ĐƯỢC, nợ host-side quyết (k) đợt 174 VẪN MỞ.

## F mới đợt này

- **F-187-T1-1** — 5/9 LIMITS đợt 186 nằm trong 32 B dưới giới hạn push (T5 chỉ dư
  1 B); T9 đã phải gọn LIMITS từ 42.233 B xuống 37.739 B trong lúc đóng cờ (xem §4).
  Quan sát, không vi phạm; giao các luồng đợt sau chừa biên an toàn khi viết LIMITS.
- **Không phát sinh F-187-T1-n nào khác** — mọi số đếm đều khớp; F-185-T1-1 đã đóng
  và được xác nhận độc lập (xem §6).

## Paths

- `docs/PHASE9_ROUND187_T1_VERIFY186_LIMITS.md` (file này)
- `PHASE9_GAP_ANALYSIS.md` (§115 đã bổ sung 2 bullet verify + nợ mở đợt 187)

KHÔNG PUSH. KHÔNG release/tag. KHÔNG code giả.
