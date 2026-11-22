# VCut Studio — Phase 9, đợt 138, T1: kiểm chứng độc lập đợt 137

- **Nhiệm vụ:** VERIFY độc lập đợt 137 đã đóng (T10 đóng 10:41Z 18/11/2026, verdict CHẤP NHẬN, 9/9 cờ).
- **Người kiểm:** T1 đợt 138. Thời gian kiểm: ~11:37–11:42Z 18/11/2026.
- **Kết luận: PASS — không có sai số nào đổi verdict.** Đợt 137 đứng nguyên như đã đóng; quyết parent §12.3 (a)–(k) đã ghi đủ trong aggregate.
- **Cây lúc kiểm:** preview.tsx md5 **530e10a7** (fix GIỮ VĨNH VIỄN — KHÔNG revert, KHÔNG sửa trong phiên này), media.ts 2c384ed1, vite.config.ts ee80d093 — khớp hoàn toàn cây lúc đóng đợt 137.
- **Boot lúc kiểm:** 17db9652-ad06-409f-989c-cdbdba15d0af, btime 1794994561 = 09:36:01Z — đúng boot lúc đóng đợt 137, = **#94?** theo quyết parent đợt 137 §12.3(g). 0 reboot mới từ lúc đóng đợt 137 tới lúc kiểm.

## §1. Đếm lại độc lập (dedup TOÀN CỤC — đếm lại từ đầu, không cộng dồn số cũ)

Script: `/tmp/t1-138-count.py` (đọc toàn bộ file `phase9-round*.txt` trong `~/workspace/repo-1-push/paths-loop/`, tách entry theo byte NUL, dedup trên tập hợp đường dẫn toàn cục; lọc theo số đợt bằng regex `phase9-round(\d+)-`).

| Phạm vi | Batch (file paths) | Entry | File duy nhất | So với số công bố |
|---|---|---|---|---|
| Đợt 137 | 10 | 15 | 15 | **khớp** (10/15/15) |
| Lũy kế 111–137 | 268 | 605 | 523 | **khớp** (268/605/523) |
| Tái kiểm 111–136 | 258 | 590 | 513 | **khớp** số công bố đợt 136 (lần thứ 16 liên tiếp khớp — T1-137 là lần 14, T10-137 là lần 15, T1-138 là lần 16) |
| Tái kiểm 111–135 | 248 | 578 | 503 | **khớp** số T1-137 đã công bố |

Chi tiết đợt 137 theo từng file paths (entry / duy nhất-trong-file): closing 2/2; t1-verify136 1/1; t2-eperm 1/1; t3-c2 1/1; t4-quiet14 1/1; t5-infra 2/2; t6-lockhealth 1/1; t7-scheduler 1/1; t8-viteharness 4/4; t9-headroom 1/1. Tổng 15 entry, 15 file duy nhất (13 entry luồng + 2 entry closing; 10 file mới-only đợt 137 + 5 file trùng với 111–136: GAP_ANALYSIS.md + postboot-check.sh + 3 script harness clicktest).

Kiểm bổ sung: **cả 523 file duy nhất 111–137 đều tồn tại trên đĩa (0 thiếu)**; **mọi file paths 111–137 đều thuần NUL-delimited (0 ký tự newline)**; 22/523 đường dẫn xuất hiện ở hơn 1 file paths (trùng chéo giữa các đợt, đã dedup đúng — GAP_ANALYSIS.md là trường hợp lớn nhất).

## §2. Cờ .done đợt 137 — 10/10

`round137-t1.done` (09:08:50Z, 0 B) · `round137-t2.done` (09:15:21Z, 0 B) · `round137-t3.done` (10:02:40Z, 790 B) · `round137-t4.done` (09:54:01Z, 329 B) · `round137-t5.done` (09:57:08Z, 1.472 B) · `round137-t6.done` (08:55:20Z, 827 B) · `round137-t7.done` (10:08:29Z, 0 B) · `round137-t8.done` (10:21:32Z, 903 B) · `round137-t9.done` (08:51:23Z, 0 B) · `round137-t10.done` (10:41:15Z, 234 B — nội dung ghi verdict CHẤP NHẬN, suite 27/27, O8 21/21 ×2, đếm 10/15/15, lũy kế 268/605/523, boot đóng 17db9652, lock trống 0+86, preview 530e10a7). T8 xong cuối trong 9 luồng (10:21:32Z) như aggregate ghi; T10 đóng 10:41Z, TRƯỚC hạn cứng ~11:00Z.

## §3. Aggregate đợt 137 — đọc toàn bộ, nhất quán nội bộ

- File `docs/PHASE9_ROUND137_LIMITS.md`: **101.529 B** (đúng kích thước brief ghi), đọc hết 228 dòng (§1–§12.3 + footer).
- **§12.3 quyết parent đủ 11 điểm (a)–(k):** (a) đóng điều tra (c2), kết luận "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH", GIỮ fix 530e10a7 VĨNH VIỄN; (b) CHẤP NHẬN DEF v0.5 (P5 34–52 ms + P3' stall-based, T3/T10 viết ở đợt 138); (c) GIỮ ngưỡng ≤60 ms, điều tra tải song song trước; (d) lag +2f chỉ theo dõi ở #15+; (e) mù #56 A headline giữ 1, ghi kèm 3; (f) GIAO RÕ T9-138 thử birefnet khi cửa sổ mở; (g) số boot 2104246b = #93?, 17db9652 = #94?, khung chết #93? chuẩn (09:35:47Z, 09:36:01Z] (14 s), khung chết #92? chuẩn bản hẹp (08:05:05Z, 08:07:11Z] (126 s), sự kiện gộp #17/#18; (h) bước 4 kiểm kẹt chấp nhận như hiện tại, không can thiệp host; (i) BẮT BUỘC poller T4 chụp ps snapshot TRƯỚC rồi đếm blockers TỪ snapshot; (j) headroom chỉ theo dõi, chưa đưa lên user; (k) CHẤP NHẬN đóng đợt 137 9/9. §12.2 ghi "(đã quyết ở §12.3 dưới)" đúng mẫu.
- **Footer "Batch stage / Tổng batch: 10 batch / 15 entry / 15 file (lũy kế 111–137: 268/605/523)" còn nguyên.**
- Các claim lớn trong aggregate đều có đối chiếu chéo §10.1 ghi rõ, không tự chốt vượt thẩm quyền: số boot (T2/T6/T7/T5/T4/T8), P7 cộng dồn chốt 14/14 theo quy ước từng seq (tiền lệ đợt 136), birefnet (T9 đóng sớm vs T5 vượt guard — khoảng trống phối hợp, không đổ lỗi một luồng), ngưỡng tickCost (điều kiện bàn lại ĐÃ ĐẠT, T10 không đổi ngưỡng), P5 34–52 ms kiểm nhất quán với 5 snap-median đã biết, headroom T5 vs T9 chênh do khác thời điểm đo.
- Số liệu lượt yên #14 khớp 100% giữa T3/T4/T5-pha-2 trên mọi hạng mục so sánh được (tickCost n=518 median 59,0 ms, post n=378 median 58,0 ms; histogram từng bin; (c2)=6, 5 seq, 1 lag +2f đầu tiên seq 145; c2DrawLog n=996, loop 1–21, wraps 20; coverage 6/6; P1 6/6 p≈0,0001; P3 3/6 p=0,125; cộng dồn P1 28/28, P3 24/28). Các lệch đã ghi rõ trong aggregate (baseline P1 lệch 1 tick T3 vs T5; p90 wallbands lệch do cách nội suy percentile) — không đổi verdict.

## §4. Đối chiếu 9 file LIMITS luồng với aggregate

| Luồng | File (byte) | Khớp aggregate |
|---|---|---|
| T1 verify 136 | 35.496 | Đếm 136 = 10/12/12; lũy kế 258/590/513; tái kiểm 111–135 = 248/578/503; 5 sai số F-137-T1-1..5 — khớp §1 |
| T2 EPERM | 52.847 | Probe #56 ok=2 fail=0; boot #93? ngoài dải 710 s; mù #56 hở A (1/3); gap SPAN 9.473 s; CERT 54/FULL 69; 7 sai số F-137-T2-1..7 — khớp §2 |
| T3 (c2) | 31.295 | P1 28/28, P3 24/28, P7 14/14; đề xuất đóng điều tra; DEF v0.5 dự thảo — khớp §3 |
| T4 yên #14 | 30.868 | Median 59,0 ms; (c2)=6/5 seq; F6' đóng lần 3; lớp B 5/5 — khớp §4 |
| T5 infra | 54.245 | 2 boot; replay boot 1 chết 110/221; boot 2 cờ 09:43:47Z; started_at viết lại btime +46 s; RAM 6.781.936 kB lúc 09:00:26Z vượt guard — khớp §5 |
| T6 lock | 47.766 | Lock khỏe 923 dòng/267 cặp; prune lần 12 xóa 0; chuỗi #57→#93? — khớp §6 |
| T7 scheduler | 21.331 | Cửa lành 0 slot thiếu mới; HB 44/211, DR 49/177; started_at viết lại (bằng chứng trực tiếp đầu tiên) — khớp §7 |
| T8 harness | 39.672 | 6/6 ngay lần đầu, 0 retry; 4 bước kiểm; H1 BÁC BỎ, H2 yếu thêm, H3 mở — khớp §8 |
| T9 headroom | 24.982 | Headroom 2.175 (còn 375 trên ngưỡng); RAM 787–2.123 MB; balloon xả ròng −0,90 GB — khớp §9 |

Kiểm độc lập thêm bằng md5: 3 script harness T8 khớp aggregate §8 (84l10 `46ab78a5…`, 85m4 `14bb67e2…`, 86n2 `406abb75…`); postboot-check.sh md5 `02ea211f…` khớp md5 cuối T5 ghi. Tất cả 15 đường dẫn stage đều là file text (kiểm `file`), 0 binary, 0 workflow `.yml`.

## §5. GAP §66 + build-loop log

- **GAP §66 đã viết** trong `~/workspace/repo-1/PHASE9_GAP_ANALYSIS.md` (dòng 1778, section đầy đủ nhiều bullet: T1–T10, lượt yên #14, 1 reboot giữa lượt, cửa lành, started_at viết lại, mù #56/#57, boot #93? ngoài dải, birefnet vượt guard không ai thử, WebKit O8 21/21 lần 15). File GAP hiện 383.504 B (tăng từ 361.530 B lúc đóng đợt 136 — đúng một section §66).
- **Build-loop log mục đợt 137 khớp aggregate:** mở (chốt chặn không tồn tại lúc mở; boot 08:07:11Z ngoài dải), T2 (probe #56, mù #56, WFS lần 43 chênh 0), đóng sổ 10:41Z (suite 27/27, O8 21/21 ×2, WebKit FULL PASS lần 15; đếm 10/15/15, lũy kế 268/605/523; đính chính pre-count 14→15 file do GAP là đường dẫn mới trong đợt), quyết parent (a)–(k) (log dòng 7158) khớp từng điểm với aggregate §12.3. Log cũng ghi "chốt chặn đã xóa" khi đóng.
- **Chốt chặn round-in-progress.md:** file hiện tại là của **đợt 138** (nội dung "Đợt 138 ĐANG CHẠY", mtime 11:36:39Z — sau khi đợt 137 đóng 10:41Z). File đợt 137 đã xóa khi đóng (log + T10 ghi nhận); không còn marker đợt 137 nào sót lại. Xem F-138-T1-1 về mâu thuẫn thời gian ghi nhận của T7 (không ảnh hưởng).

## §6. Sai số (F-138-T1-n) — không sai số nào đổi verdict

- **F-138-T1-1 — Mâu thuẫn thời gian về round-in-progress.md giữa T2 và T7 (ghi chép, không đổi verdict).** T2 (F-137-T2-7) ghi file xuất hiện 08:40:22Z (main agent tạo lúc mở đợt 137). T7 (§2.7) ghi file "KHÔNG tồn tại lúc kiểm lần 1 (~08:43Z)" nhưng TỒN TẠI lúc kiểm lần 3 (~10:06Z) — nếu kiểm lần 1 thật sự lúc ~08:43Z thì file phải đã tồn tại. Bản thân file T7 ghi hai mốc khác nhau cho kiểm lần 1: ~08:40Z (§3, dòng 26) và ~08:43Z (§2.7, dòng 113). Nếu kiểm lần 1 là ~08:40Z (trước 08:40:22Z) thì hai bản ghi hòa giải được. Aggregate §7 lặp lại bản ~08:43Z mà không đối chiếu với F-137-T2-7. Không ảnh hưởng verdict nào: marker là của chính đợt 137 (không phải đợt main-chat chen vào), đã xóa khi đóng, và file hiện tại là marker đợt 138 mới.
- **F-138-T1-2 — Không verify được HEAD df3dffae bằng git cục bộ (giới hạn của chính T1, không phải lỗi đợt 137).** `~/workspace/repo-1` không có thư mục `.git` (git báo "not a git repository"); HEAD df3dffae lấy theo build-loop log + hồ sơ PUSH #7, không kiểm độc lập được từ máy này. Cây làm việc (preview.tsx/media.ts/vite.config.ts) đã kiểm bằng md5 và khớp.
- **F-138-T1-3 — Lỗi pattern trong script đếm của chính T1 (không ảnh hưởng số đếm).** Pattern sanity đầu tiên `phase9-round1[12][0-9]-*.txt` vô tình gồm cả file đợt 110 (197 file, 508 entry) do `[12]` khớp cả "11" và "12" ở vị trí sai; các số chính thức (111–137, 111–136, 111–135) dùng regex `phase9-round(\d+)-` lọc đúng 111–137 nên không bị nhiễm. Ghi rõ để đợt sau khỏi copy pattern này.
- **F-138-T1-4 — Log vòng lặp ghi "1 batch chờ push (đợt 136: 12 file)" ở mục mở đợt 137 (cách diễn đạt lỏng, không đổi số).** Đợt 136 thực tế là 10 batch / 12 entry / 12 file; "1 batch" ở đây ý nói một đợt, nhưng viết tắt gây hiểu nhầm với đơn vị batch trong đếm. Aggregate §10 dùng đúng 10 batch. Chỉ là chữ trong log, không phải số liệu sai.
- **Không tái chạy suite 27/27 / O8 21/21 trong phiên verify này** (quy trình T1 là kiểm chứng tài liệu + đếm + cây, không chạy lại toàn bộ suite; kết quả suite/O8 lấy theo log `round137-t10-suites.log` + `t10-o8.log` của T10, còn trên đĩa trong `hidden_files/round137-t10/`). Ghi rõ giới hạn này thay vì tuyên bố đã chạy lại.

## §7. Nợ mở chuyển đợt 138 (theo aggregate §11 + quyết parent §12.3)

- T3/T10 viết DEF v0.5 (P5 34–52 ms + P3' stall-based, prereg cho 138+, không hồi tố).
- T4 lượt yên #15: giám sát thụ động (c2); poller BẮT BUỘC chụp ps snapshot TRƯỚC rồi đếm blockers TỪ snapshot (quyết (i)); ghi load1/RAM kèm tickCost theo từng pass (quyết (c)).
- T9 ở lại muộn hơn, thử birefnet ngay khi sampler quan sát được available ≥ 6.144 MiB (quyết (f)); u2net là fallback chính thức.
- T2 probe #57 + mù #57; mù #56 A vẫn mở tối đa 1 ẩn (quy ước) / 3 cộng dồn.
- G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user. R9 (a) vẫn chờ user — số đếm VẪN LÀ 16. ci-security.yml vẫn 403 — chờ user. TTS 39 cấm kiểm lại. Headroom 2.175 — chỉ theo dõi. File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.

## Footer
Batch stage / Tổng batch: 1 batch / 1 entry / 1 file (đợt 138 — T1 verify 137; lũy kế 111–138 chưa tính — T10 đợt 138 chốt sau)
