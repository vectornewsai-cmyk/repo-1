# PHASE9_ROUND138_T3_DEF_LIMITS — T3 đợt 138: VIẾT DEF v0.5 (kiểm chứng lượt yên WebKit) — XONG

> **Verdict: DEF v0.5 ĐÃ VIẾT XONG (`docs/DEF_v0.5.md`, 38.237 B) theo đúng
> quyết parent đợt 137 §12.3(b): P5 snap-label 34–52 ms + bổ sung P3'
> stall-based làm prereg từ lượt yên #15; P1/P2/P3-A1/P4/P6/P7 GIỮ
> NGUYÊN; tickCost ≤60 ms GIỮ NGUYÊN; fix 530e10a7 thành instrumentation
> VĨNH VIỄN; điều tra (c2) ĐÓNG với kết luận "ghost-freeze ĐƯỢC ỦNG HỘ
> MẠNH". Khoảng P5 kiểm lại ĐỘC LẬP từ JSON gốc 5 lượt (#9/#10/#12/#13/
> #14): snap 44/35/35/52/50 ms — khớp 100% số T4. Định nghĩa P3' đã
> chốt chặt (stall_truoc, baseline, luật verdict, đơn vị đếm theo seq
> riêng biệt) và tái hiện đúng stall [3, 6, 4, 2, 4] của T3-137.
> Đính chính 2 số gần đúng của T3-137 §4.3 (độ nhạy ngưỡng P3') — kết
> luận không đổi, thậm chí mạnh hơn. KHÔNG sửa cây (preview.tsx giữ
> 530e10a7). KHÔNG push.**

## 0. Môi trường lúc T3 làm việc (11:37–11:4xZ 18/11)

- Boot lúc mở đợt: **17db9652 = #94?** (đã xác nhận theo quyết parent
  đợt 137 §12.3(g)); **0 reboot** trong phiên T3.
- `preview.tsx` lúc kiểm (11:41Z): md5 **530e10a7** (fix GIỮ theo quyết
  parent §12.3(a) đợt 136 + (a) đợt 137 — T3 kiểm lại trước khi viết
  DEF và sau khi viết xong, đều 530e10a7). **KHÔNG SỬA CÂY.**
- Chốt chặn `round-in-progress.md` là marker MỞ ĐỢT 138 do parent tạo
  lúc dispatch 11:35Z (ghi rõ đợt 138, cron 18:35) — T3 làm việc bình
  thường trong đợt này, KHÔNG xóa chốt chặn (chỉ T10 xóa lúc đóng).
- `~/workspace/repo-1` **không phải git repo** — md5 là phương pháp đối
  chiếu file duy nhất.

## 1. Việc đã làm (theo brief T3 đợt 138)

1. **Đọc kỹ dự thảo DEF v0.5** ở `docs/PHASE9_ROUND137_T3_C2_LIMITS.md`
   §6 (bảng hiệu chỉnh: P5 snap 34–52 ms ứng viên; P3' stall-based;
   P6/P4 giữ nguyên + ghi chú +2f; tickCost không đổi trong DEF).
2. **Đọc kiểm chứng của T10** ở LIMITS gộp đợt 137 §10.1(e): khoảng
   ứng viên 34–52 ms nhất quán với mọi snap-median đã biết
   (#9: 44, #10: 35, #12: 35, #13: 52, #14: 50 ms); các lượt #1–#8
   không recompute lại (là dữ liệu đặt khoảng prereg gốc 34–48 ms,
   nên theo cấu trúc nằm trong 34–48 ⊂ 34–52).
3. **Đọc quyết parent đợt 137 §12.3(a)–(b)** trong LIMITS gộp
   (đã quyết ở §12.3 dưới — T3 trích nguyên văn, không diễn giải
   thêm): (a) ĐÓNG điều tra (c2), GIỮ fix vĩnh viễn, giám sát thụ
   động, mở lại nếu P1 gãy / lag âm / +2f thường xuyên; (b) CHẤP NHẬN
   DEF v0.5 (P5 34–52 ms + P3' stall-based cho đợt 138+, KHÔNG hồi
   tố; T3/T10 viết ở đợt 138).
4. **Đọc prereg gốc (v0.4 của dòng DEF này):**
   `hidden_files/round132-t3/prereg-t3.md` (đăng ký 17:45Z 17/11/2026
   + bổ sung A1 17:50Z) — toàn bộ định nghĩa P1–P7, luật verdict,
   bảng hiệu chuẩn 8 lượt, và lý do A1 loại mệnh đề "nhảy ≥100 ms"
   (baseline mệnh đề gộp 70,3% — không falsifiable). Đây là cơ sở
   để viết DEF v0.5 đầy đủ, không chỉ phần đổi.
5. **Kiểm tra vị trí đặt file DEF:** KHÔNG có file DEF_v0.4 nào cho
   dòng DEF (c2) — "v0.4" của dòng này chính là prereg đợt 132 nêu
   trên. File DEF v0.4 duy nhất trong repo là
   `docs/PHASE9_ROUND128_T1_PSIAXIS_DEF_V04.md` — thuộc dòng DEF
   trục tải PSI, không liên quan. Theo brief, DEF v0.5 viết thành
   `docs/DEF_v0.5.md` (đặt cạnh các file DEF khác trong `docs/`);
   lưu ý phân biệt hai dòng DEF đã ghi rõ trong header file DEF
   (xem F-138-T3-3).
6. **Kiểm lại độc lập khoảng P5** từ JSON gốc (xem §2) và **chốt chặt
   định nghĩa P3'** bằng cách tái hiện stall của #14 (xem §3).
7. **Viết DEF v0.5 đầy đủ** (`docs/DEF_v0.5.md`, §0–§17) + LIMITS này;
   stage batch; touch cờ `round138-t3.done`.

## 2. Kiểm lại độc lập khoảng P5 34–52 ms (script riêng, không dùng code T4/T3 cũ)

Script: `hidden_files/round138-t3/t3-def-verify.py` (viết mới, pure
Python — `statistics.median`, không numpy/PIL, không GT matching;
chỉ đọc trường `ghostPix` của JSON gốc). Output:
`t3-def-verify-138a1.txt`. Lý do không cần GT matching cho kiểm này:
`nomatch = 0` ở cả 5 lượt theo file histogram của T4, nên mọi ghost
occurrence hợp lệ đều đóng góp snap/raw/label-floor — tính trực tiếp
từ trường JSON cho kết quả y hệt script histogram của T4.

SHA256 JSON gốc đã kiểm (khớp các sha T3 các đợt trước đã công bố):
- #9 (`round131-t4/...`): `d867c227…` (n=656)
- #10 (`round133-t4/...`): `e3ca1ac5…` (khớp dry-run T3-136)
- #12 (`round135-t4/...`): `2efceefd…` (khớp dry-run T3-136/137)
- #13 (`round136-t4/...`): `266767c0…` (khớp dry-run T3-137)
- #14 (`round137-t4/...`): `d0585125…` (khớp T3-137 §2, T4, T5)

| Lượt | nGhost | snap med (T3-138) | snap med (T4) | raw med | label-floor +1 | run ≥3 | Khớp T4? |
|---|---|---|---|---|---|---|---|
| #9 | 656 | **44** | 44 | 9 | 68,1% | 21 | ✓ 100% |
| #10 | 752 | **35** | 35 | 8 | 76,5% | 12 | ✓ 100% |
| #12 | 824 | **35** | 35 | 8 | 74,9% | 15 | ✓ 100% |
| #13 | 614 | **52** | 52 | 10 | 62,7% | 23 | ✓ 100% |
| #14 | 592 | **50** | 50 | 9 | 67,9% | 22 | ✓ 100% |

- **Kết luận: cả 5 snap-median đều nằm trong 34–52 ms; khớp 100%
  số T4 trên mọi số so sánh được** (snap, raw, label-floor, run —
  kể cả danh sách run #14 khớp từng run với file
  `t4-histogram-with14.txt`). Cộng với #1–#8 từ bảng hiệu chuẩn
  prereg (39, 35, 45, 36, 38, 45, 34, 44 ms — dữ liệu đặt khoảng
  gốc, không recompute lại trong phiên này, cùng cách làm của T10
  §10.1(e)) thì **cả 12 lượt yên hợp lệ đều nằm trong 34–52 ms;
  không có lượt nào ngoài khoảng ứng viên.**
- Ghi thêm từ bảng kiểm này (đã có trong DEF §8, nhắc lại vì quan
  trọng cho quyết giữ nguyên các tiêu chí P5 còn lại):
  - #10 đã lệch biên 2/4 từ trước (label-floor 76,5% vượt 0,5pp;
    run 12 thiếu 1) — T3-133 ghi rõ và quyết KHÔNG đổi DEF.
  - #13 lệch 3/4 (snap 52, label-floor 62,7% thiếu 0,3pp = thiếu
    đúng 2 occurrence, run 23 vượt 1).
  - #14: label-floor (67,9%) và run (22) đều về trong khoảng; chỉ
    snap (50 ms) còn ngoài khoảng cũ — đúng mẫu "chữ ký lượt chậm"
    mà parent chấp nhận hiệu chỉnh.

## 3. Chốt chặt định nghĩa P3' — tái hiện stall lượt #14

Dùng cùng script `t3-def-verify.py` (§2), định nghĩa `stall_truoc`
theo T3-137 §4.3: độ dài chuỗi đóng băng nhãn kết thúc tại tick
`i−1` (không tính tick (c2)).

| seq (c2) | stall_truoc (T3-138) | stall (T3-137 §4.3) | Khớp? |
|---|---|---|---|
| 145 | 3 (nhãn 36664 giữ 3 tick 142–144, nhảy +837 ms tại 145) | 3 | ✓ |
| 265 | 6 (nhãn 58859 giữ 6 tick 259–264, nhảy +950 ms tại 265) | 6 | ✓ |
| 327 | 4 (chuỗi 70137 dài 5 tick 323–327, đóng băng tại tick) | 4 | ✓ |
| 368 | 2 (chuỗi 77399 dài 3 tick 366–368, đóng băng tại tick) | 2 | ✓ |
| 389 | 4 (chuỗi 80771 dài 5 tick 385–389, đóng băng tại tick) | 4 | ✓ |

- **5/5 seq riêng biệt có stall ≥ 2.** Baseline tính lại:
  cặp tick đóng băng 65/295 = 22,0% (khớp T3-137); tick có
  stall ≥ 2: **65/294 = 22,1%**; stall ≥ 3: 38/294 = 12,9%
  (khớp T3-137); stall ≥ 4: 24/294 = 8,2%.
- p nhị thức: **P(X≥5 | n=5, p0=0,2211) = 0,000528 ≈ 0,0005**
  (T3 ghi 0,000519 với p0=65/295 — chênh không đáng kể, xem
  F-138-T3-2).
- Độ nhạy ngưỡng (tính lại chính xác — đính chính T3-137 §4.3,
  xem F-138-T3-1): stall ≥ 3 → 4/5, **p ≈ 0,0013** (T3 ghi
  ≈0,002); stall ≥ 4 → 3/5, **p ≈ 0,0048** (T3 ghi ≈0,02).
  Cả hai vẫn dưới 0,01 — kết luận "mẫu stall mạnh" đứng vững.
- Định nghĩa P3' trong DEF (§6) đã chốt thêm 3 điểm mà phân tích
  khám phá của T3-137 chưa ghi rõ, để T4 đợt 138+ thực thi được
  không mơ hồ:
  - (i) **Đơn vị đếm: seq riêng biệt** (không phải occurrence —
    vì stall là thuộc tính của tick; 2 occurrence tại seq 145
    chia sẻ một giá trị stall). Độ nhạy theo occurrence cũng ghi
    trong DEF: 6/6, p≈0,0001 (bảo thủ hơn khi đếm theo seq).
  - (ii) **Baseline mẫu số 294** (số tick post có stall xác định,
    i≥2) thay vì 295 của T3 (xem F-138-T3-2).
  - (iii) **Luật verdict đầy đủ** (ĐÚNG/SAI/YẾU/VÔ HIỆU + xử lý
    seq có stall không xác định: loại khỏi mẫu số, ghi rõ; nếu
    >1/3 seq bị loại thì verdict YẾU).

## 4. Nội dung DEF v0.5 (tóm tắt — chi tiết xem file)

- **ĐỔI:** P5 snap-label **34–48 → 34–52 ms** (bằng chứng §2);
  **thêm P3' stall-based** làm prereg từ #15 (§6 DEF, chốt chặt
  ở §3 trên); fix 530e10a7 từ "giữ tới khi verdict" thành
  **instrumentation VĨNH VIỄN**; điều tra (c2) **ĐÓNG** với kết luận
  "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH".
- **GIỮ NGUYÊN:** P1 (28/28 cộng dồn), P2 (19/19), P3-A1 (24/28;
  SAI ở #14 vẫn ĐỨNG, không hồi tố), P4 (+ ghi chú +2f đơn lẻ
  không vi phạm; xem lại nếu +2f ≥3 occurrence/lượt), P5 raw 8–10
  ms / label-floor 63–76% / run 13–22, P6 (không verdict),
  P7 (cộng dồn 14/14 theo quy ước từng seq đã chốt ở §10.1(b)
  đợt 137), tickCost ≤60 ms (bàn lại chỉ khi #15 vượt 60 ms hoặc
  3 lượt liên tiếp ≥55 ms mà đã loại trừ tải — quyết (c) đợt 137).
- **Giám sát thụ động từ #15:** T4 đếm (c2) tự động mỗi lượt yên;
  **mở lại điều tra chỉ khi:** P1 gãy (SAI với n≥3) / xuất hiện
  lag âm (P2 SAI) / +2f ≥3 occurrence trong một lượt. P3-A1 SAI
  một mình, P3' SAI một mình, hay P5/P6 ngoài khoảng đều KHÔNG
  tự mở lại — chỉ ghi rõ làm dị thường.
- DEF ghi đầy đủ: định nghĩa (c2) vận hành (theo script bước 2
  của T3), P1–P7 + luật verdict, bảng lịch sử P5 12 lượt, chuỗi
  tickCost 12 lượt, caveats (P3' gốc post-hoc; P5 snap là khoảng
  min–max quan sát; P7 chỉ "làm yếu desync"; baseline P1 có hai
  cách tính; lượt #11 không tồn tại), lịch sử phiên bản v0.4 →
  v0.5, tài liệu tham chiếu.
- **KHÔNG đổi:** ngưỡng tickCost, bar, hay bất kỳ prereg nào ngoài
  những gì quyết parent §12.3(b) đã chấp nhận.

## 5. Trạng thái sau đóng (kiểm cuối 11:4xZ 18/11)

- preview.tsx md5 cuối: **530e10a7** (GIỮ fix; KHÔNG revert; không
  sửa cây trong đợt này).
- Boot 17db9652 còn sống; 0 reboot trong phiên T3.
- Không process đo nào còn chạy của T3 (chỉ đọc file + chạy script
  phân tích trên JSON gốc).
- File viết: `docs/DEF_v0.5.md` (**38.237 B — vượt giới hạn
  push-files 37.768 B đúng 469 B; push cần `ENABLE_PRIVSEP=0`**,
  cùng mẫu các LIMITS oversize đợt 137) + LIMITS này
  (`docs/PHASE9_ROUND138_T3_DEF_LIMITS.md`).
- Stage: `phase9-round138-t3-def.txt` (2 entry NUL-delimited:
  DEF v0.5 + LIMITS này — verify od/read-back). KHÔNG push.
- Cờ `round138-t3.done` ghi khi DEF + LIMITS + stage xong.
- Hồ sơ: `hidden_files/round138-t3/` — `t3-def-verify.py`
  (script kiểm độc lập P5 + P3'), `t3-def-verify-138a1.txt`
  (output kiểm chứng).

## 6. Sai số / ghi chú của chính T3 (ghi trung thực)

1. **F-138-T3-1 (đính chính số gần đúng của T3-137 §4.3 — độ nhạy
   ngưỡng P3'; kết luận KHÔNG đổi):** T3-137 ghi độ nhạy
   "stall ≥3 → 4/5, p≈0,002" và "stall ≥4 → 3/5, p≈0,02".
   Tính lại chính xác từ JSON gốc #14 (script §2):
   stall ≥3 → **p ≈ 0,0013** (p0 = 38/294 = 12,9%);
   stall ≥4 → **p ≈ 0,0048** (p0 = 24/294 = 8,2%).
   Số "≈0,02" của T3 có lẽ do dùng lại baseline của ngưỡng ≥3
   (p0≈0,129) cho ngưỡng ≥4 — với p0=0,129 thì P(X≥3|n=5)
   ≈ 0,018 ≈ 0,02, khớp số T3 ghi. Cả hai số đúng đều NHỎ HƠN
   số T3 ghi (0,0013 < 0,002; 0,0048 < 0,02) và đều dưới 0,01 —
   kết luận "mẫu stall mạnh ở cả hai ngưỡng nhạy" đứng vững,
   thậm chí mạnh hơn. DEF v0.5 §6.2 ghi số đã đính chính này.
2. **F-138-T3-2 (ghi chú phương pháp — mẫu số baseline P3'):**
   T3-137 §4.3 ghi baseline `P(stall ≥ 2) = 65/295 = 22,0%`
   (tỉ lệ cặp tick đóng băng). Định nghĩa chặt trong DEF v0.5 §6.1
   dùng mẫu số 294 (số tick post có stall xác định, i≥2):
   `65/294 = 22,1%`. p tương ứng: 0,000519 (theo 65/295) vs
   0,000528 (theo 65/294) — chênh 0,000009, cả hai đều ≈0,0005,
   không đổi kết luận nào. DEF chốt mẫu số 294 làm chuẩn prereg.
3. **F-138-T3-3 (ghi chú đặt tên file — không phải lỗi):** dòng DEF
   (c2) chưa từng có file DEF_v0.4 riêng — "v0.4" của nó là prereg
   đợt 132 (`hidden_files/round132-t3/prereg-t3.md`). File DEF v0.4
   duy nhất trong repo là PSIAXIS DEF (trục tải PSI, dòng khác).
   T3 viết DEF v0.5 thành `docs/DEF_v0.5.md` theo brief, và đã ghi
   rõ sự phân biệt hai dòng DEF trong header file để luồng sau
   khỏi nhầm (đặc biệt vì PSIAXIS DEF v0.4 §11 cũng nhắc tới một
   "v0.5 (dự kiến)" của riêng dòng PSI).
4. **F-138-T3-4 (ghi chú lịch sử P5 — không phải lỗi mới):** khi
   kiểm lại toàn bộ P5 (§2), T3 xác nhận #10 đã lệch biên 2/4 từ
   trước (label-floor 76,5% vượt 0,5pp; run 12 thiếu 1) — T3-133
   đã ghi rõ và quyết KHÔNG đổi DEF lúc đó. DEF v0.5 likewise
   KHÔNG đổi label-floor/run (chỉ đổi snap) vì cả hai lệch đều là
   biên nhỏ (≤1 run, ≤0,5pp) và tự về trong khoảng ngay lượt sau
   (#12 cho #10; #14 cho #13). Ghi rõ để T10 khỏi tính đây là
   bằng chứng mới đòi nới thêm khoảng.
5. **F-138-T3-5 (ghi chú phương pháp — baseline P1 có hai cách
   tính; đã chốt cách chuẩn):** script T3 (unsigned-dist) vs
   script đối chiếu T5 (signed-dist) lệch baseline 1 tick ở #14
   (66/296 vs 65/296) và 2 tick ở #13 (69/307 vs 67/307)
   (F-136-T3-1, F-137-T3-3 — không phải phát hiện mới của T3-138).
   DEF v0.5 §3 chốt unsigned-dist làm cách tính CHUẨN (mọi verdict
   P1 từ #9 tới #14 đều tính bằng nó) và yêu cầu báo cả hai nếu
   một lượt sau hai cách cho verdict khác nhau.
