# LIMITS — Phase 9 đợt 189, T1: verify đợt 188 (đếm cuối GỒM closing + GAP §117)

## 0. Tóm tắt

- **Verdict: PASS, KHÔNG đính chính đếm.** Mọi số đếm tái kiểm đều KHỚP quyết parent §12.3 (q) đợt 187 từng số; 0 file thiếu; chuỗi khớp nối dài lần thứ 107 (xem §4).
- **Đếm cuối đợt 188 (GỒM closing) = 10/16/15/14** (10 batch / 16 entry / 15 đường dẫn / 14 file mới). Lũy kế 111–188 = 768/1.333/1.159/981. Chờ push 166–188 = 230/354/321/317. Tổng 1–188 = 1.416/7.203/3.964/3.964. Tổng 1–187 = 1.406/7.187/3.950.
- **F-188-T1-2 ĐÃ ĐƯỢC ÁP DỤNG ĐÚNG:** T10-188 ghi số SAU closing làm số cuối ở §10.1 + §12.1(q)/(r) — KHÔNG có F- mới về số cuối đợt này (khác đợt 187, khi T10-187b ghi số trước closing làm số cuối).
- **F-189-T1-1 (mới): aggregate 188 KHÔNG CÓ header §12.3** (chỉ §12.1/§12.2 — cùng mẫu F-188-T1-3 đợt 187; parent cần thêm header §12.3 khi viết quyết).
- **0/9 LIMITS đợt 188 VƯỢT giới hạn push 37.768 B** (cao nhất T6 37.711 B, dư 57 B — kiểm lại độc lập bằng stat, KHỚP §10.4 aggregate 188 từng số).
- GAP §117 đã tạo mới (GAP chưa có §117 — §116 là mục cuối); GAP 1.046.315 B → xem §8.
- Phạm vi: CHỈ verify đếm đợt 188 + cập nhật GAP — KHÔNG chạy lại suite, KHÔNG xác minh lại O8/lượt yên/harness.

## 1. Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)

- **Phương pháp 1 (python):** `hidden_files/round189-t1/recount-189-t1.py` — viết mới hoàn toàn trong lượt này, không dùng script cũ, không dùng bất kỳ script nào mang nhãn parent. Quét toàn bộ `phase9-round*.txt`, sắp xếp theo SỐ ROUND tăng dần (tránh lặp F-173-T1-3 / F-185-T1-2), chuẩn hóa đường dẫn tuyệt đối về tương đối trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn số round vào lũy kế cũ — tiền lệ đợt 126–127), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa.
- **Phương pháp 2 (shell):** `hidden_files/round189-t1/crosscheck-189-t1.sh` — viết mới hoàn toàn trong lượt này. Chỉ dùng `tr` / `sort -u` / `comm` / `wc`: union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union(trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1).
- Cả hai phương pháp chạy HAI lần mỗi phương pháp: lần 1 TRƯỚC closing, lần 2 SAU closing (xem §2). Bốn lần chạy đều exit 0, KHỚP TỪNG SỐ với nhau trong cùng mốc đếm, và KHỚP TỪNG SỐ với cả hai phương pháp của T10-188 ở cả hai mốc.

## 2. Số đếm — MỐC ĐẾM (trước/sau closing)

T10-188 đóng đợt 188 song song (bắt đầu 02:41Z, aggregate xong 02:51:56Z, closing stage 02:52Z). Closing `phase9-round188-closing.txt` stage lúc 02:52Z (54 B, 2 entry: `docs/PHASE9_ROUND188_LIMITS.md` + `PHASE9_GAP_ANALYSIS.md` — đã kiểm bằng `od -c`).

### 2.1 Lần 1 — TRƯỚC closing (02:44–02:47Z; closing CHƯA có)

- Quét **1.415 file** `phase9-round*.txt` (round 1–188, không thiếu round nào); purity 0 cảnh báo; tổng entry thô 7.201; tổng đường dẫn duy nhất toàn cục 3.963.
- **Đợt 188 = 9/14/14/13** (9 batch: t0/t1/t2/t4/t5/t6/t7/t8/t9 — entry theo batch: 1+2+1+5+1+1+1+1+1 = 14; 14 đường dẫn; 13 file mới; đường dẫn duy nhất không mới: `PHASE9_GAP_ANALYSIS.md`, first-seen đợt 59).
- Lũy kế 111–188 = 767/1.331/1.158/980. Chờ push 166–188 = 229/352/320/316. Tổng 1–188 = 1.415/7.201/3.963/3.963. Tổng 1–187 = 1.406/7.187/3.950/3.950. 0 file thiếu.
- **KHỚP TỪNG SỐ với T10-188** — cả phương pháp python (`recount-188-t10-before.out`, 02:43Z) lẫn shell (`crosscheck-188-t10-before.out`, 02:45Z) của T10 đều cho đúng các số này (T1 đọc trực tiếp).

### 2.2 Lần 2 — SAU closing (02:54–02:56Z; closing ĐÃ có, 54 B)

- Quét **1.416 file** `phase9-round*.txt` (round 1–188, không thiếu round nào); purity 0 cảnh báo; tổng entry thô 7.203; tổng đường dẫn duy nhất toàn cục 3.964.
- **Đợt 188 = 10/16/15/14** — đúng trước closing + delta closing (+1 batch/+2 entry/+1 đường dẫn/+1 file mới: aggregate 188 là đường dẫn mới, first-seen đợt 188; GAP đã có trong tập toàn cục qua batch T1).
- **Lũy kế 111–188 = 768/1.333/1.159/981. Chờ push 166–188 = 230/354/321/317. Tổng 1–188 = 1.416/7.203/3.964/3.964.** Tổng 1–187 KHÔNG ĐỔI = 1.406/7.187/3.950.
- **0 file thiếu trên đĩa** (kiểm trực tiếp 3.964 đường dẫn duy nhất, cả hai phương pháp; python `missing=0 []`, shell `missing=0 total_uniq=3964`).
- First-seen đợt 188 (15 đường dẫn): 14 file mới đợt 188 + GAP (first-seen đợt 59). 14 file mới gồm 9 LIMITS (T0/T1/T2/T4/T5/T6/T7/T8/T9) + aggregate 188 + 4 script T4 (`distinct-seq-188.py`, `poll-wait-t4-188.sh`, `run-analyzers-188.sh`, `run-attempt-188.sh`).

## 3. Tái kiểm 111–187 vs quyết parent (q) đợt 187

- **Tái kiểm 111–187 = 758/1.317/1.145/967 — KHỚP quyết parent (q) đợt 187 TỪNG SỐ** (cả hai phương pháp, cả hai mốc đếm). Tái kiểm 111–186 = 748/1.294/1.124/946 (KHỚP (q) đợt 186); 111–185 = 738/1.275/1.110/932 (KHỚP (q) đợt 185); 111–184 = 728/1.259/1.096/918; 111–183 = 718/1.244/1.082/904.
- Nguồn quyết dùng: **§12.3 aggregate 187 BẢN PARENT** (`docs/PHASE9_ROUND187_LIMITS.md`, 68.918 B sau đính chính của parent, quyết (a)–(r), nguồn gốc CHƯA NGÃ NGŨ — tổng điền sẵn GIỮ 18; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 105, CHỈ dedup python).

## 4. Chuỗi khớp

- **105 (parent-187) → 106 (T10-188) → 107 (T1-189, lần này).**
- Cơ sở lần 107: đếm TRƯỚC closing của T1 khớp từng số với T10 (cả hai phương pháp T10, cả hai lần chạy của T10); đếm SAU closing = trước closing + delta closing đúng chuẩn (closing 2 entry đã kiểm bằng `od -c`); hai phương pháp của T1 khớp từng số với nhau ở cả hai mốc; số SAU closing của T1 khớp từng số với §10.1 + §12.1(q)/(r) aggregate 188 của T10.
- Chuỗi đầy đủ theo (q) đợt 187: 101 (parent-186, lượt 06:38) → 102 (T10-187b, trước closing) → 103 (T1-188, sau closing) → 104 (lời ghi "parent-187" lúc 00:27Z, chưa xác minh) → 105 (parent-187) → 106 (T10-188, sau closing) → 107 (T1-189, sau closing).

## 5. Kích thước 9 LIMITS đợt 188 vs giới hạn push 37.768 B (đo bằng stat)

| Luồng | Kích thước | So với 37.768 B |
|---|---|---|
| T0 | 21.714 B | dưới (dư 16.054 B) |
| T1 | 15.020 B | dưới (dư 22.748 B) |
| T2 | 22.077 B | dưới (dư 15.691 B) |
| T4 | 34.118 B | dưới (dư 3.650 B) |
| T5 | 36.365 B | dưới (dư 1.403 B) |
| T6 | **37.711 B** | dưới (**dư 57 B**) |
| T7 | 20.364 B | dưới (dư 17.404 B) |
| T8 | 37.694 B | dưới (**dư 74 B**) |
| T9 | 37.698 B | dưới (**dư 70 B**) |

- **0/9 LIMITS VƯỢT giới hạn push** — tốt hơn đợt 187 (1/9 vượt: T5 44.315 B). KHỚP §10.4 aggregate 188 từng số (đo độc lập bằng stat).
- T6 (dư 57 B), T9 (dư 70 B), T8 (dư 74 B) đều nằm trong 75 B dưới giới hạn — bất kỳ lần sửa/gộp muộn nào chạm 3 file này đều vượt (bài học F-187-T1-1 đã báo trước; đợt 187 T5 đã vượt thật).
- Aggregate 188 = **48.141 B** lúc T10 đóng (02:51:56Z) — VƯỢT giới hạn push (mọi aggregate đều vượt; lúc push cần `ENABLE_PRIVSEP=0`).

## 6. F- mới đợt 189 (T1) + đính chính

- **F-189-T1-1 — Aggregate 188 KHÔNG CÓ header §12.3.** Kiểm trực tiếp: `grep -n "^## "` chỉ ra §12.1 (dòng 167) và §12.2 (dòng 188), tiếp theo là `## Batch stage / Tổng batch` (dòng 190); §12.2 ghi "(đã quyết ở §12.3 dưới)" — nhưng không có header `## §12.3` nào trong file. Parent cần thêm header §12.3 khi viết quyết (cùng mẫu F-188-T1-3 đợt 187; khác đợt 186: T10-186 để header §12.3 trống hoàn toàn).
- **KHÔNG có F- mới về số cuối:** T10-188 đã ghi số SAU closing làm số cuối ở §10.1 + §12.1(q)/(r) (10/16/15/14; 768/1.333/1.159/981; 230/354/321/317; 1.416/7.203/3.964) — KHỚP HỆT số T1 đếm độc lập. Đính chính F-188-T1-2 (đợt 187: T10-187b ghi số trước closing làm số cuối) ĐÃ ĐƯỢC ÁP DỤNG ĐÚNG đợt này — không lặp lại lỗi.
- **Ghi nhận — F-188-T10-1 (T10 tự phát hiện + tự sửa):** 14 đường dẫn TUYỆT ĐỐI cũ trong paths files (round 143/153/175–184) — shell crosscheck ban đầu của T10 ghép prefix repo vào chúng nên báo sai "thiếu 14" trong file `crosscheck-188-t10-before-188.out` (missing-in-range=14 cho lũy kế/tổng, =10 cho chờ push); python xử lý đúng nên báo 0 thiếu. T10 đã sửa script shell (đường dẫn tuyệt đối kiểm trực tiếp) và chạy lại — cả hai phương pháp đều 0 thiếu, nội dung đếm không đổi. Script shell của T1 viết mới đã xử lý đúng trường hợp này ngay từ đầu (nhánh `/*` kiểm trực tiếp) — cả hai lần chạy của T1 đều `missing=0`.
- **Đính chính nhỏ — T10 đóng sổ quá hạn cứng do lịch cron dời:** lượt cron 06:35 +07 dời việc đóng sang lượt 09:35 +07 để tránh timeout (run 188 TIMEOUT 23:38:46Z, T10-187 chưa xong close); T10 bắt đầu 02:41Z, aggregate xong 02:51:56Z, closing 02:52Z — quá hạn cứng ~02:35Z ~17'. Nguyên nhân quá hạn là lịch dời của cron, không phải luồng nào chậm thêm — 9/9 cờ đã đủ từ 02:13Z. Ghi nhận, không phạt luồng nào.
- **Không có đính chính nào khác cho brief:** số kỳ vọng trong brief T1-189 (đợt 188 ≈ 10/16/15/14 sau closing; lũy kế 768/1.333/1.159/981; chờ push 230/354/321/317) KHỚP số T1 đếm sau closing từng số. Brief ghi "cao nhất T6 37.711 B, tất cả dưới giới hạn" — KHỚP đo trực tiếp (§5).

## 7. Bối cảnh đợt 188 (chỉ ghi nhận từ LIMITS/cờ trên đĩa — T1 không xác minh lại nội dung chuyên môn)

- **Cờ: 9/9 có nội dung** (T0 00:22Z, T1 00:03Z, T2 01:50Z, T4 01:41Z, T5 00:22Z, T6 00:21Z, T7 02:04Z, T8 02:13Z, T9 01:59Z). T7 trễ hạn cờ ~4', T8 trễ ~13', T9 sửa LIMITS 02:01Z — tất cả trong hạn cứng ~02:35Z. **KHÔNG có luồng nào gộp muộn. Chuỗi 9/9 = 9 → 10 nếu parent tính tiếp.**
- Lượt yên #57: **KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt, 0 lần cửa yên mở** (balloon host-side GHIM ~6,44 GB — RAM avail <1024 MB trong 101/136 poll thật (74%), <500 MB trong 60/136, min 375 MB; mọi điều kiện khác đều từng xanh cùng lúc — chỉ thiếu RAM). Chuỗi lượt yên hợp lệ 1 → 0 (ĐỨT, sau khi parent (m)-187 chấp nhận 0 → 1 cho #56) — parent quyết. Kiểm chứng live lần 8 KHÔNG THỂ KIỂM (0 attempt — không tính ĐẠT, không tính HỎNG; chuỗi live GIỮ 7).
- **FULL PASS: KHÔNG — chuỗi GIỮ 0** (chỉ 3 chân đủ trên #111: gate (a), O8 T0, O8 T8; lượt yên ✗ + harness ✗ 5/6).
- Run 188 **TIMEOUT** 23:38:46Z (margin −175 s; claimed→finished 146 s — **CA ≥60 s MỚI thứ 20 toàn lịch sử / thứ 17 trong cửa sổ**, timeout thứ ba trong họ; lý do: hết 10800 s budget — T10-187 chưa xong close). Run 187 FAILED xác minh lại KHỚP T7-187 từng số. Run 189 vẫn RUNNING lúc T7-188 đóng, start TRỄ +175 s (lần đầu).
- (m) #110 **DƯƠNG** (CUỐI cấp T2; +43,959 s, TRONG [33; 49,8]); (m) #111 SỐ THÔ DƯƠNG (+37,468 s — T2-189 phán cuối); INSIDE #110/#111 KHÔNG TÍNH ĐƯỢC (thiếu btime #106) — chuỗi INSIDE GIỮ 7; n ứng viên 48/49 → 49/50 nếu parent chấp nhận #110 DƯƠNG; n chính thức GIỮ 14 (đề xuất).
- POSTBOOT_PASS: **#111 CÓ 00:11:36Z (repair-sớm-quyết-h, poll=1, CÓ caveat** — GST symlink → debroot ephemeral + tools CHƯA CÀI + dpkg 768/1 transaction); **replay #111 ĐÌNH TRỆ** (heal 23:11:21Z viết 2 dòng dpkg rồi dừng; watcher repair thay thế — chuỗi đình trệ: #111 CÓ); tổng boot không cờ GIỮ 25 theo quyết (c)-187 (#105 + #108 đều không cờ). Không có boot mới đợt 188 (257c1eae = #111 đã quyết (e)-187).
- Holder: **#110/#111 KHÔNG GIẾT HOLDER — chuỗi 13 → 15**; (A) 120/120 lần thứ 38 (tổng 4.560/4.560); prune lần 63 xóa 2 file, queue 102 → 100, KHÔNG PHẢI CHỜ.
- Harness 5/6 trên #111; kẹt cộng dồn 26 → 27 (86n2-P5 lần đầu); **B2/V2 BẮT KẸT THẬT LIVE LẦN ĐẦU** (trigger @125 s via=f; V2 replay 5/5 kẹt @125 s, V1-300 4/5; 0 FP trên 25 log sạch); **B1 live sạch DỪNG ở 5** (lần đầu bắt kẹt thật); vùng mới B2 sạch lần 3; 84l10 PASS chuỗi 7 → 8 (đề xuất); 86n2-P1 không kẹt lần 10 (đề xuất); số log sạch chuẩn 23 → 25.
- Headroom 0 lần thứ 48 liên tiếp; guard 0 mẫu ≥ guard; birefnet 0 lần thứ 42; auto-trigger CHƯA BẬT LIVE (quyết (o)-187) — 3 câu hỏi ĐÃ TRẢ LỜI (fixture clip1.mp4 104.028 B, 8,0 s, 240 frames; giới hạn load1 < 4,0 đề xuất; KHÔNG "hẹn chạy sau attempt"); kiểm offline 17/17 PASS; dry-run song song 118 mẫu, 0 WOULD-FIRE — live từ đợt 189 nếu parent duyệt. E-238 KẾT THÚC BỞI REBOOT #111; 5 episode mới E-239–E-243; tổng ghim 42/123 (34,1%); ENOSPC đợt thứ 37 liên tiếp.
- OUTAGE #2: điều tra "cố định theo giờ" — T7-188 KẾT LUẬN: **ĐƯỢC ỦNG HỘ MẠNH, CHƯA KHẲNG ĐỊNH TUYỆT ĐỐI** (23/11 + 24/11 stall cùng khung tới từng giây; 20–22/11 sạch; điểm quyết định là khung 25/11 — T7-188 KHÔNG kiểm được; giao T7-194 phán cuối, T7-193 kiểm onset).
- 0 vi phạm phía T2/T4/T5/T9 (chuỗi 0 vi phạm 3 → 4 nếu đợt 188 sạch — parent quyết). F-187-T9-3 đồng hồ nhanh — T0-188 ĐÃ XÁC MINH ĐỘC LẬP: XÁC NHẬN cả (a)+(b) (δ >22 s trước #110, >10 s trước #111).

## 8. GAP §117 đã cập nhật

- GAP chưa có §117 (§116 là mục cuối, 2.414 dòng, 1.046.315 B lúc T1 bắt đầu — đã gồm bullet đóng sổ đợt 188 của T10-188, +2.466 B) — T1 **tạo mới §117** với 3 bullet: T10 verify + T1 verify 188 + nợ mở đợt 189 (T10-189 append bullet đóng sổ vào §117 SAU bullet của T1 theo brief — T1 chỉ append ở cuối file, KHÔNG ghi đè nội dung cũ).
- GAP trước cập nhật: **1.046.315 B**; sau cập nhật: **1.053.592 B** (tăng 7.277 B; đo bằng stat sau khi append).
- Nội dung §117: xem `PHASE9_GAP_ANALYSIS.md` §117.

## 9. Deliverables

- LIMITS: `docs/PHASE9_ROUND189_T1_VERIFY188_LIMITS.md` (file này; kích thước xem cờ — dưới 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round189-t1-verify188.txt` (2 entry NUL-delimited: LIMITS + GAP đã cập nhật §117; đã kiểm `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round189-t1.done`.
- Work dir: `hidden_files/round189-t1/` (`recount-189-t1.py` + `recount-189-t1-before.out` + `recount-189-t1-after.out` + `crosscheck-189-t1.sh` + `crosscheck-189-t1-before.out` + `crosscheck-189-t1-after.out`).
- KHÔNG sửa MEMORY.md / build-loop-log.md. KHÔNG PUSH.
