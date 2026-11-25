# LIMITS — Phase 9 đợt 188, T1: verify đợt 187 (đếm cuối GỒM closing + GAP §116)

## 0. Tóm tắt

- **Verdict: PASS với MỘT đính chính đếm (F-188-T1-2).** Mọi số đếm tái kiểm đều KHỚP quyết parent §12.3 (q) đợt 186 từng số; 0 file thiếu; chuỗi khớp nối dài lần thứ 102 (xem §4 — với caveat F-188-T1-2 về số T10 công bố ở §10.1).
- **Đếm cuối đợt 187 (GỒM closing) = 10/23/22/21** (10 batch / 23 entry / 22 đường dẫn / 21 file mới). Lũy kế 111–187 = 758/1.317/1.145/967. Chờ push 166–187 = 220/338/307/303. Tổng 1–187 = 1.406/7.187/3.950/3.950. Tổng 1–186 = 1.396/7.164/3.929.
- **F-188-T1-2 (đính chính quan trọng): §10.1 + §12.1(q) + §12.2(r) của T10-187b ghi số TRƯỚC closing làm số cuối** (9/21/21/20; 757/1.315/1.144/966; 219/336/306/302; 1.405/7.185/3.949) — thiếu delta closing (+1 batch/+2 entry/+1 đường dẫn/+1 file mới). Số ĐÚNG theo quy ước đứng (tiền lệ đợt 185/186: đếm cuối GỒM closing) là 10/23/22/21. Báo cả hai số, KHÔNG tự hòa giải — parent quyết (q) cuối ở §12.3 aggregate 187.
- **F-188-T1-1: LIMITS T5-187 44.315 B — VƯỢT giới hạn push 37.768 B (+6.547 B).** 1/9 LIMITS đợt 187 vượt; T8 37.744 B (dư 24 B) và T9 37.753 B (dư 15 B) sát giới hạn.
- **F-188-T1-3: aggregate 187 KHÔNG CÓ header §12.3** (chỉ §12.1/§12.2; §12.2 ghi "(trống — chờ quyết parent)") — parent cần thêm header §12.3 khi viết quyết.
- GAP §116 đã tạo mới (GAP chưa có §116 — §115 là mục cuối); GAP 1.036.017 B → xem §8.
- Phạm vi: CHỈ verify đếm đợt 187 + cập nhật GAP — KHÔNG chạy lại suite, KHÔNG xác minh lại O8/lượt yên/harness.

## 1. Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)

- **Phương pháp 1 (python):** `hidden_files/round188-t1/recount-188-t1.py` — viết mới hoàn toàn trong lượt này, không dùng script cũ, không dùng bất kỳ script nào mang nhãn parent. Quét toàn bộ `phase9-round*.txt`, sắp xếp theo SỐ ROUND tăng dần (tránh lặp F-173-T1-3 / F-185-T1-2), chuẩn hóa đường dẫn tuyệt đối về tương đối trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn số round vào lũy kế cũ — tiền lệ đợt 126–127), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa.
- **Phương pháp 2 (shell):** `hidden_files/round188-t1/crosscheck-188-t1.sh` — viết mới hoàn toàn trong lượt này. Chỉ dùng `tr` / `sort -u` / `comm` / `wc`: union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union(trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa.
- Cả hai phương pháp chạy HAI lần mỗi phương pháp: lần 1 TRƯỚC closing, lần 2 SAU closing (xem §2). Bốn lần chạy đều exit 0, KHỚP TỪNG SỐ với nhau trong cùng mốc đếm.

## 2. Số đếm — MỐC ĐẾM (trước/sau closing)

T10-187b đóng đợt 187 song song: lần 1 TIMEOUT ~23:36Z khi aggregate mới tới §3 (18.586 B); lần 2 (retry) đóng tiếp từ §4. Closing `phase9-round187-closing.txt` stage lúc 23:54Z (54 B, 2 entry: `docs/PHASE9_ROUND187_LIMITS.md` + `PHASE9_GAP_ANALYSIS.md` — đã kiểm bằng `od -c`).

### 2.1 Lần 1 — TRƯỚC closing (23:46–23:49Z; closing CHƯA có)

- Quét **1.405 file** `phase9-round*.txt` (round 1–187, không thiếu round nào); purity 0 cảnh báo; tổng entry thô 7.185; tổng đường dẫn duy nhất toàn cục 3.949.
- **Đợt 187 = 9/21/21/20** (9 batch: t0/t1/t2/t4/t5/t6/t7/t8/t9 — entry theo batch: 1+2+1+5+1+1+1+1+8 = 21; 21 đường dẫn; 20 file mới; đường dẫn duy nhất không mới: `PHASE9_GAP_ANALYSIS.md`, first-seen đợt 59).
- Lũy kế 111–187 = 757/1.315/1.144/966. Chờ push 166–187 = 219/336/306/302. Tổng 1–187 = 1.405/7.185/3.949/3.949. Tổng 1–186 = 1.396/7.164/3.929/3.929. 0 file thiếu.
- **KHỚP TỪNG SỐ với T10-187b** — cả lần đếm trước (23:30Z) lẫn lần đếm cuối (23:45Z python + 23:47Z shell) của T10 đều cho đúng các số này (`recount-187-t10-before.out`, `recount-187-t10-final.out`, `crosscheck-187-t10-final.out` — T1 đọc trực tiếp).

### 2.2 Lần 2 — SAU closing (23:57–23:58Z; closing ĐÃ có, 54 B)

- Quét **1.406 file** `phase9-round*.txt` (round 1–187, không thiếu round nào); purity 0 cảnh báo; tổng entry thô 7.187; tổng đường dẫn duy nhất toàn cục 3.950.
- **Đợt 187 = 10/23/22/21** — đúng trước closing + delta closing (+1 batch/+2 entry/+1 đường dẫn/+1 file mới: aggregate 187 là đường dẫn mới, first-seen đợt 187; GAP đã có trong tập toàn cục qua batch T1).
- **Lũy kế 111–187 = 758/1.317/1.145/967. Chờ push 166–187 = 220/338/307/303. Tổng 1–187 = 1.406/7.187/3.950/3.950.** Tổng 1–186 KHÔNG ĐỔI = 1.396/7.164/3.929.
- **0 file thiếu trên đĩa** (kiểm trực tiếp 3.950 đường dẫn duy nhất, cả hai phương pháp; python `missing=0 []`, shell `missing=0 total_uniq=3950`).
- First-seen đợt 187 (22 đường dẫn): 21 file mới đợt 187 + GAP (first-seen đợt 59). 21 file mới gồm 9 LIMITS (T0/T1/T2/T4/T5/T6/T7/T8/T9) + aggregate 187 + 4 script T4 (`distinct-seq-187.py`, `poll-wait-t4-187.sh`, `run-analyzers-187.sh`, `run-attempt-187.sh`) + 7 file T9 (`birefnet-autotrigger-DESIGN.md`, `sampler-autotrigger.py`, `t9-187-analyze-output.txt`, `t9-187-analyze.py`, `t9-187-baseline-notes.md`, `test-autotrigger-offline-output.txt`, `test-autotrigger-offline.py`).

## 3. Tái kiểm 111–186 vs quyết parent (q) đợt 186

- **Tái kiểm 111–186 = 748/1.294/1.124/946 — KHỚP quyết parent (q) đợt 186 TỪNG SỐ** (cả hai phương pháp, cả hai mốc đếm). Tái kiểm 111–185 = 738/1.275/1.110/932 (KHỚP (q) đợt 185); 111–184 = 728/1.259/1.096/918; 111–183 = 718/1.244/1.082/904.
- Nguồn quyết dùng: **§12.3 aggregate 186 BẢN PARENT** (`docs/PHASE9_ROUND186_LIMITS.md`, 107.950 B, quyết (a)–(r), SẠCH không điền sẵn — lần đầu sạch kể từ đợt 183, tổng điền sẵn vẫn 18; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 99, CHỈ dedup python).

## 4. Chuỗi khớp

- **99 (parent-186) → 100 (T1-187) → 101 (T10-187, trước closing) → 102 (T1-188, lần này).**
- Cơ sở lần 102: đếm TRƯỚC closing của T1 khớp từng số với T10 (cả hai phương pháp T10, cả hai lần chạy của T10); đếm SAU closing = trước closing + delta closing đúng chuẩn (closing 2 entry đã kiểm bằng `od -c`); hai phương pháp của T1 khớp từng số với nhau ở cả hai mốc.
- Caveat (F-188-T1-2): số T10 CÔNG BỐ ở §10.1/§12.1(q)/§12.2(r) là số TRƯỚC closing — T1 KHÔNG tự gán số đó là sai thay parent; parent quyết (q) cuối ở §12.3 aggregate 187. Nếu parent chấp nhận số sau closing, chuỗi khớp vẫn nối dài (số sau closing suy ra trực tiếp từ số T10 + delta closing đã kiểm chứng trên đĩa).

## 5. Kích thước 9 LIMITS đợt 187 vs giới hạn push 37.768 B (đo bằng stat)

| Luồng | Kích thước | So với 37.768 B |
|---|---|---|
| T0 | 19.564 B | dưới (dư 18.204 B) |
| T1 | 17.381 B | dưới (dư 20.387 B) |
| T2 | 19.487 B | dưới (dư 18.281 B) |
| T4 | 35.977 B | dưới (dư 1.791 B) |
| T5 | **44.315 B** | **VƯỢT +6.547 B — F-188-T1-1** |
| T6 | 36.574 B | dưới (dư 1.194 B) |
| T7 | 16.004 B | dưới (dư 21.764 B) |
| T8 | 37.744 B | dưới (**dư 24 B**) |
| T9 | 37.753 B | dưới (**dư 15 B**) |

- **1/9 LIMITS VƯỢT giới hạn push (T5).** T5-187 44.315 B: 2 cờ POSTBOOT_PASS + 2 watcher + 2 reboot trong một đợt; lúc push cần `ENABLE_PRIVSEP=0` (tiền lệ script T8 38.737/43.653 B).
- T8 (dư 24 B) và T9 (dư 15 B) đều nằm trong 25 B dưới giới hạn — bất kỳ lần sửa/gộp muộn nào chạm 2 file này đều vượt (bài học F-187-T1-1 đã báo trước: 5/9 LIMITS đợt 186 nằm trong 32 B dưới giới hạn; đợt 187 T5 đã vượt thật).
- Aggregate 187 = **56.056 B** lúc T10 đóng (23:54:05Z) — VƯỢT giới hạn push (mọi aggregate đều vượt; lúc push cần `ENABLE_PRIVSEP=0`).

## 6. F- mới đợt 188 (T1) + đính chính

- **F-188-T1-1 — LIMITS T5-187 VƯỢT giới hạn push (+6.547 B).** Xem §5. T5-187 là file LIMITS vượt đầu tiên ở trạng thái đóng cờ kể từ khi F-187-T1-1 cảnh báo 5/9 file đợt 186 nằm trong 32 B dưới giới hạn. Bài học: các luồng viết LIMITS dài (nhiều boot/cờ/watcher trong một đợt) cần chừa biên an toàn hoặc tách phụ lục — không chờ tới lúc đóng cờ mới gọn.
- **F-188-T1-2 — §10.1 + §12.1(q) + §12.2(r) của T10-187b ghi số TRƯỚC closing làm số cuối.** Bằng chứng T1 kiểm trực tiếp: (1) `recount-187-t10-final.out` (23:45Z) và `crosscheck-187-t10-final.out` (23:47Z) đều ghi `files=1405`, đợt 187 = 9/21/21/20 — closing CHƯA stage lúc đó; (2) closing stage 23:54Z (54 B, `od -c` đã kiểm, 2 entry); (3) §10.1 aggregate 187 (mtime 23:54:05Z) vẫn ghi 9/21/21/20; (4) đếm lại độc lập của T1 SAU closing cho 10/23/22/21 (cả hai phương pháp, §2.2). Số T10 (trước closing) KHỚP số T1 (trước closing) từng số — lệch chỉ ở chỗ closing chưa được cộng vào §10.1. **Báo cả hai số, không tự hòa giải — parent quyết (q) cuối.** Ghi chú: §10.2 của T10 nói tái dùng script lần 1 sau khi đọc lại — T1 không phán về việc tái dùng script; script của T1 viết mới hoàn toàn.
- **F-188-T1-3 — Aggregate 187 KHÔNG CÓ header §12.3.** Kiểm trực tiếp: `grep -n "^## §12"` chỉ ra §12.1 (dòng 144) và §12.2 (dòng 165); §12.2 ghi "(trống — chờ quyết parent)" và trỏ tới §12.3 dưới — nhưng không có header `## §12.3` nào trong file. Parent cần thêm header §12.3 khi viết quyết (khác đợt 186: T10-186 để header §12.3 trống hoàn toàn).
- **Đính chính nhỏ — T10 đóng sổ lần 2 quá hạn cứng:** T10 lần 1 TIMEOUT ~23:36Z (aggregate mới tới §3, 18.586 B); lần 2 đóng tiếp từ §4, aggregate xong 23:54:05Z (56.056 B) — quá hạn cứng ~23:35Z ~20–30' theo §10.3. 9/9 cờ đã đủ từ 23:24Z nên không phạt luồng nào. **Cờ `round187-t10.done` CHƯA CÓ lúc T1 đọc lần cuối 00:00Z 25/11** (aggregate không đổi từ 23:54:05Z) — T10 có thể còn viết cờ sau khi T1 đóng; parent kiểm lại cờ khi đọc §12.3.
- **Không có đính chính nào khác cho brief:** số kỳ vọng trong brief T1-188 (đợt 187 ≈ 10/23/22/21 sau closing; lũy kế 758/1.317/1.145/967; chờ push 220/338/307/303) KHỚP số T1 đếm sau closing từng số. Brief ghi T5-187 44.315 B VƯỢT, T8 dư 24 B, T9 dư 15 B — đều KHỚP đo trực tiếp (§5).

## 7. Bối cảnh đợt 187 (chỉ ghi nhận từ LIMITS/cờ trên đĩa — T1 không xác minh lại nội dung chuyên môn)

- **Cờ: 9/9 có nội dung** (T0 21:07Z, T1 21:22Z, T2 21:35Z, T4 21:28Z, T5 21:45Z, T6 21:04Z, T7 22:54Z, T8 21:55Z, T9 23:24Z). T9 trễ hạn cờ ~24' do runtime restart (F-187-T9-1), trong hạn cứng. **KHÔNG có luồng nào gộp muộn. Chuỗi 9/9 = 9 nếu parent tính tiếp (8 → 9).**
- Lượt yên #56: **CÓ LƯỢT HỢP LỆ ngay attempt đầu** (attempt1-#109, 20/20, B 5/5, tickCost median 39,0 ms) — chuỗi 0 → 1 (khởi động lại, tiền lệ đợt 179; parent quyết). Kiểm chứng live lần 7 ĐẠT. 0 vi phạm phía T4.
- **FULL PASS: KHÔNG — chuỗi GIỮ 0** (3 chân trên #109 + 2 chân trên #110 — reboot 21:13:21Z chia đôi đợt, không đủ 5/5 cùng boot).
- Run 187 **FAILED** 20:17:06Z (margin +1.125 s; claimed→finished 202 s — **CA ≥60 s MỚI thứ 19 toàn lịch sử / thứ 16 trong cửa sổ**; chuỗi SUCCEEDED 182→186 (5 lượt) ĐỨT). Run 188 vẫn RUNNING lúc T7-187 đóng — kết cục thuộc T7-188.
- (m) #108 **DƯƠNG** (CUỐI cấp T2; +39,438 s, TRONG [33; 49,8]); (m) #107/#109 **KHÔNG CÓ ĐIỂM**; (m) #110 thô +43,959 s (T2-188 phân loại). INSIDE #107/#108/#109 KHÔNG TÍNH ĐƯỢC (chuỗi GIỮ 7). n ứng viên 47/48 → 48/49 nếu parent chấp nhận #108 DƯƠNG; n chính thức GIỮ 14.
- POSTBOOT_PASS: **#109 CÓ 20:50:24Z, #110 CÓ 21:22:15Z** (replay-đầy-đủ, poll=0, KHÔNG caveat); **#108 KHÔNG CÓ** (không thử repair; tổng boot không cờ 24 → 25 nếu parent chấp nhận #105 + #108). Boot mới 257c1eae (btime 23:10:44Z — ứng viên #111, chờ T0-188).
- Harness 6/6 trên #110; B2 live sạch lần 2; V2 (f'') 4/4 kẹt @125 s; 0 FP trên 23 log sạch; 84l10 PASS chuỗi 7 (đề xuất); 86n2-P1 lần 10; B1 live sạch lần 5. F-186-T8-3 ĐÃ XÁC MINH — số log sạch chuẩn 21 → 23.
- Headroom 0 lần thứ 47 liên tiếp; guard 0 mẫu ≥ guard; birefnet 0 lần thứ 41; auto-trigger ĐÃ THIẾT KẾ + KIỂM OFFLINE 13/13 PASS (live từ đợt 188 nếu parent duyệt); cửa sổ thoáng CẢ BA BOOT KHÔNG QUAN SÁT ĐƯỢC (lần 4); E-238 vẫn ghim; ENOSPC đợt thứ 36 liên tiếp.
- OUTAGE #2: điều tra "cố định theo giờ" đã mở — khung 23/11 xác minh lại KHỚP T7-179; 20–22/11 sạch; **T7-188 KẾT LUẬN**.
- 0 vi phạm phía T4/T9 (chuỗi 0 vi phạm 2 → 3 nếu đợt 187 sạch — parent quyết).

## 8. GAP §116 đã cập nhật

- GAP chưa có §116 (§115 là mục cuối, 2.407 dòng, 1.036.017 B lúc T1 bắt đầu) — T1 **tạo mới §116** với 3 bullet: T10 verify + T1 verify 187 + nợ mở đợt 188 (T10-187b append bullet đóng sổ vào §116 SAU bullet của T1 theo brief — T1 chỉ append ở cuối file, KHÔNG ghi đè nội dung cũ).
- GAP trước cập nhật: **1.036.017 B**; sau cập nhật: **1.042.188 B** (tăng 6.171 B; đo bằng stat sau khi append).
- Nội dung §116: xem `PHASE9_GAP_ANALYSIS.md` §116.

## 9. Deliverables

- LIMITS: `docs/PHASE9_ROUND188_T1_VERIFY187_LIMITS.md` (file này; kích thước xem cờ — dưới 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round188-t1-verify187.txt` (2 entry NUL-delimited: LIMITS + GAP đã cập nhật §116; đã kiểm `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round188-t1.done`.
- Work dir: `hidden_files/round188-t1/` (`recount-188-t1.py` + `recount-188-t1-before.out` + `recount-188-t1-after.out` + `crosscheck-188-t1.sh` + `crosscheck-188-t1-before.out` + `crosscheck-188-t1-after.out`).
- KHÔNG sửa MEMORY.md / build-loop-log.md. KHÔNG PUSH.
