# Phase 9 đợt 36, luồng S1 — Khóa hiệu ứng nhỏ A/B seekElement + cổng decode v2 — LIMITS

Ngày: 02/11/2026 (giờ +07). KHÔNG push, KHÔNG release/tag, KHÔNG
binary vào repo, KHÔNG code giả. Luồng này KHÔNG sửa code sản phẩm
(`seek.ts` live byte-identical sau buổi đo, sha §7), KHÔNG sửa
harness N2, KHÔNG sửa probe Q6, KHÔNG sửa probe decode-side v1 —
chỉ thêm probe v2, runner36, script tổng hợp + file này + JSON kết
quả. Đọc trước khi làm: `docs/PHASE9_ROUND35_LIMITS.md` §3 mục 1
và `docs/PHASE9_ROUND35_R1_SEEK_AB_QUIET_LIMITS.md` (đặc biệt §2:
giới hạn cổng v1) + `docs/PHASE9_ROUND34_Q1_SEEK_AB_LIMITS.md` §5.3.

## 0. Kết luận ngắn (kèm số liệu, không đoán)

**KHÔNG khóa được hiệu ứng nhỏ (<10%) trong đợt này — và nguyên
nhân chính không phải là thiếu cổng đo, mà là không đạt được cửa
sổ quiesced thật trong buổi đo nhiều luồng song song.** 16 lượt
đợt 36 chỉ cho 3 lượt accepted (retry 2, single 1), xa mục tiêu
8+8; 13 lượt còn lại bị loại có lý do (6 STARVED, 4 STEADY_SLOW,
3 HEALTHY nhưng under-load). Vì vậy:

- Đợt 36-only: retry trung vị 6,026 (n=2: 6,405 / 5,647), single
  5,811 (n=1) — không đủ n để tính CI, không kết luận được gì
  về hiệu ứng nhỏ từ riêng đợt 36.
- Đợt 35 R1 phân loại lại bằng v2: retry tb 8,999 / trung vị
  8,907 (n=3), single tb 9,190 / trung vị 9,190 (n=2), chênh lệch
  trung bình +2,12% theo hướng single, CI Welch 95%
  [−10,75%, +14,99%] — VẪN VƯỢT ±10% ở cả hai đầu, nên CHƯA
  KHÓA ĐƯỢC ngay cả khi chỉ dùng dữ liệu R1 (dù đã suýt soát).
- Tập gộp 36+R1 cho CI [−45,36%, +51,86%] và cỡ mẫu yêu cầu
  82/phía — nhưng con số gộp này KHÔNG dùng được: mức tuyệt đối
  đã trôi ~30% giữa hai phiên trên CÙNG bundle (accepted đợt
  36: 5,65–6,40; accepted R1: 8,75–9,35), nên phương sai gộp bị
  thổi phồng bởi trôi phiên, không phải bởi hiệu ứng biến thể
  (xem §5.2). Không được trích CI gộp hay reqN=82 như "số lượt
  cần chạy" mà không kèm caveat trôi phiên; cũng không được
  trích reqN=4 của riêng R1 (tính từ phương sai trong phiên)
  như thể chỉ cần thêm 1 lượt là khóa được.
- **KHÔNG revert `seekElement`:** không có bằng chứng mới nào
  cho thấy retry-loop thua — điểm ước lượng dao động quanh 0
  và đổi dấu theo tập dữ liệu (cặp duy nhất đợt 36: tỉ số
  0,9073 theo hướng retry; R1-v2: +2,12% theo hướng single;
  gộp: +3,25% theo hướng single). Điều kiện revert của R1
  (retry thua có ý nghĩa thống kê) vẫn không xảy ra.
- **Cổng decode v2 ĐẠT mục tiêu (b):** bắt thêm 4 lượt chậm-đều
  trong đợt 36 (retry-b1, retry-b2, retry-b8, single-b1), trong
  đó retry-b8 là lượt QUIET nhưng vẫn STEADY_SLOW (tail 1,125)
  — tức chế độ chậm-đều tái hiện độc lập với nhãn tải và độc
  lập với biến thể (3 retry vs 1 single trong đợt 36). Nếu
  không có v2, retry-b8 đã lọt vào thống kê quiet và kéo trung
  vị retry xuống — đúng kiểu méo mà R1 lo ngại ở single-a4.
- **Phát hiện phương pháp mới (xem §5.2):** nhãn quiet v2 chỉ
  xét load1, nhưng các lượt "quiet" đợt 36 mang load5 ~2,1–2,3
  và load15 ~2,1 (so với R1: load5 ~1,4–1,9, load15 ~0,75–1,3)
  — tức máy vẫn chịu tải nền bền trong suốt phiên dù load1
  từng lúc xuống dưới 2,0. Đây là ứng viên giải thích mức
  tuyệt đối đợt 36 thấp hơn R1 ~30%, và là lỗ hổng cần vá ở
  cổng v3 (thêm load5/load15) trước khi đo khóa lại.

## 1. Phương pháp (kế thừa R1, thay cổng decode v1 bằng v2)

- **Cùng cây đóng băng, cùng bundle với R1** (không build lại):
  retry `index-BqxQgBuf.js` sha256
  `f2fb01664045fcac30275d0d2459e38188f28b4413988d33063331d503b4f65d`,
  single `index-xfaJXEFE.js` sha256
  `fffcd2c019461441b16860879841b0c019ef6fb2085815eb1fa3764b1cf8136a`,
  cùng 212 module, chỉ khác 1 hunk callback `seeked` trong
  `seek.ts`. Mọi lượt kiểm tra sha bundle đóng băng trước/sau
  (runner36 kế thừa runner R1). Vì cùng bundle nên tập gộp
  đợt 36 + đợt 35 R1 (sau khi phân loại lại R1 bằng v2) là so
  sánh hợp lệ — xem §5.
- **Harness y nguyên đợt 31 N2** qua probe Q6 v2 (không sửa),
  video y nguyên các đợt trước:
  `~/workspace/tmp-round27-k4/sparse-gop-flat.mp4` (GOP 300,
  1280×720, 30 s, 30 fps, H.264). Display `:90` / port `4190`
  như R1.
- **Cổng nhận đợt 36 (chặt hơn R1):** lượt chỉ được nhận khi CẢ
  HAI đều đạt: nhãn quiet v2 của Q6 (load1 < 2,0, xuôi
  [0,98, 1,02], rAF xuôi P50 ≤ 0,015 s, predictedRate xuôi
  ≥ 0,98, 0 Chrome trước lượt) VÀ decodeLabel v2 = HEALTHY
  (không STARVED theo v1, không STEADY_SLOW theo §2).
- **Cửa sổ quiesced — trung thực về giới hạn điều phối:** task
  yêu cầu "tạm dừng probe browser khác cùng lúc", nhưng S1 là
  một luồng trong đợt lớn nhiều luồng song song nên KHÔNG có
  quyền dừng luồng khác. Cách làm thực tế: cổng tiền kiểm của
  runner36 (chờ tối đa 10 phút/lượt cho tới khi load1 < 2,0 và
  0 Chrome rồi mới phóng browser) + nhãn v2 + cổng decode v2
  lọc sau. Bằng chứng cửa sổ KHÔNG yên toàn cục: lượt pilot
  retry-b1 gặp chrome=16 ở lần kiểm tra cổng đầu tiên, lượt
  single-b1 gặp chrome=13–28 và load1 2,71–4,78 ở 3 lần kiểm
  tra đầu — tức các luồng khác ĐANG chạy browser song song
  trong buổi đo. Vì vậy "quiesced" ở đây có nghĩa là "từng
  lượt đã qua cổng tiền kiểm + nhãn v2", KHÔNG có nghĩa là
  "toàn bộ buổi đo không có luồng khác" — và mọi lượt bị
  nhiễm giữa chừng vẫn bị loại như R1 (retry-a1 là tiền lệ).
  Lượt gate-timeout (hết 10 phút không có cửa sổ) được thử
  lại tối đa 2 lần rồi ghi là timeout, không tính là lượt đo.
- **Thứ tự xen kẽ:** retry-b1 (pilot) rồi single-b1, retry-b2,
  single-b2, … — cặp ghép theo thứ tự nhận như R1.

## 2. Cổng decode v2: phát hiện chế độ chậm-đều

Cổng v1 chỉ bắt stall (drawDelta = 0) nên bỏ sót single-a4
đợt 35 (7,32 fps, HEALTHY v1, tick 93,1/s, draw 1/khoảng suốt
~4 s cuối). Cổng v2 (`seek-ab-decode-side-v2-analyze.mjs`)
GIỮ NGUYÊN mọi ngưỡng v1 và THÊM nhãn STEADY_SLOW:

- tail = 8 khoảng drawDelta cuối cùng của phase ngược (~4 s
  cuối); STEADY_SLOW khi tailMean < 1,5 VÀ tailMax ≤ 2
  (tương đương tốc độ vẽ đoạn cuối < 3 fps).
- Ngưỡng đặt TRƯỚC khi đo đợt 36, hiệu chuẩn trên toàn bộ 19
  lượt cũ (8 lượt đợt 34 Q1 + 11 lượt đợt 35 R1, mode
  `calibrate` của probe v2): v2 giữ nguyên nhãn v1 của cả 19
  lượt TRỪ single-a4 (HEALTHY → STEADY_SLOW, tailMean 1,0,
  tailMax 1). Không có false positive mới nào: 6 lượt quiet
  HEALTHY v1 của đợt 35 có tailMean 2,375–2,75, tailMax 3–4
  (thấp nhất vẫn cao hơn ngưỡng 58%); lượt khỏe nhất đợt 34
  ở sát ngưỡng nhất (single-2: tailMean đúng 1,5) vẫn qua vì
  điều kiện là < 1,5 nghiêm ngặt. So sánh v1/v2 trên cùng dữ
  liệu: số stall của v2 khớp v1 từng lượt (ví dụ single-3 đợt
  34: stall 9 cả hai bản) — thành phần v1 trong v2 không bị
  lệch khi copy.
- Vì sao không dùng tỉ số tail/head làm cổng chính: mọi lượt
  đều có tail/head ~0,42–0,60 (§3) nên tỉ số không tách an
  toàn bằng ngưỡng tuyệt đối; tỉ số chỉ ghi làm tín hiệu chẩn
  đoán để phân biệt "sụp đoạn GOP2" (tỉ số ~0,20) với "chậm
  toàn cục" (tỉ số ~0,46–0,49, xem §3.3).
- Hệ quả cho dữ liệu cũ: phân loại lại R1 bằng v2 thì tập
  accepted của R1 chỉ còn retry 3 / single 2 (single-a4 bị
  loại). Vì vậy headline 3+3 của R1 (trung vị single 8,813)
  KHÔNG còn đứng dưới cổng v2 — đó chính là lý do đợt 36 cần
  lượt mới thay vì chỉ phân loại lại.

## 3. Điều tra chế độ chậm-đều cuối phase ngược (nợ §3.1 đợt 35)

### 3.1 Đoạn cuối chậm là hiện tượng hệ thống, gắn với biên GOP

Phân tích lại toàn bộ 20 lượt có forward-hold.json (19 lượt
cũ + pilot retry-b1 đợt 36), chia khoảng drawDelta theo đoạn
video: GOP1 (mẫu t ≥ 20 s, keyframe 20 s) vs GOP2 (mẫu t < 20 s,
keyframe 10 s), bỏ khoảng bắc cầu biên:

- MỌI lượt đều chậm lại sau biên 20 s: tỉ số GOP2/GOP1 =
  0,46–0,60 ở mọi lượt khỏe (ví dụ retry-a4 0,58; single-a2
  0,46; retry-4 đợt 34 0,60). Đoạn cuối chậm hơn đầu phase
  là BÌNH THƯỜNG của fixture này, không phải bất thường —
  cổng v2 vì vậy không được gắn cờ chỉ vì "đuôi chậm hơn
  đầu"; nó gắn cờ vì đuôi chậm TUYỆT ĐỐI (dưới 3 fps).
- Trong GOP1, drawDelta tương quan nghịch mạnh với khoảng
  cách tới keyframe: hệ số tương quan Pearson (drawDelta,
  t − 20) = −0,55…−0,92 ở cả 20 lượt (lượt khỏe: −0,78…−0,92).
  Càng gần keyframe 20 s, vẽ càng nhanh (từ ~2 lên ~13–15
  frame/khoảng khi t → 20). Đây là bằng chứng định lượng cho
  mô hình chi phí seek: mỗi bước ngược seek về keyframe rồi
  decode xuôi tới đích, nên chi phí ∝ số frame phải decode
  từ keyframe tới đích. Vượt biên sang GOP2, khoảng cách tới
  keyframe mới (10 s) nhảy vọt lên ~9,9 s nên tốc độ rớt —
  rồi lẽ ra phải hồi dần khi t → 10, nhưng phase ngược kết
  thúc ở t ≈ 15,8 nên chỉ quan sát được đoạn đầu chậm của
  GOP2. Lượt khỏe vẫn hồi nhẹ trong GOP2 (chuỗi 2→3–4);
  single-a4 thì không (xem §3.2).

### 3.2 single-a4: sụp đoạn GOP2, không phải chậm toàn cục

- GOP1 của single-a4 hoàn toàn khỏe: trung bình 4,67
  frame/khoảng, tương quan −0,92, khoảng bắc cầu biên = 7 —
  ngang các lượt khỏe khác (4,72–5,39). Sụp chỉ xảy ra ở
  GOP2: chuỗi đúng [1,1,1,1,1,1,1,1], trung bình 1,0, tỉ số
  GOP2/GOP1 = 0,21 (lượt khỏe thấp nhất là 0,46) — và KHÔNG
  hồi dù khoảng cách tới keyframe 10 s đã thu từ 9,4 xuống
  5,8 s trong đoạn đó. Dưới mô hình chi phí §3.1, đoạn này
  lẽ ra phải hồi lên ~2–3 frame/khoảng như các lượt khỏe;
  nó không hồi — đó là điểm bất thường thật, không phải
  artefact của ngưỡng v2.
- Không có bằng chứng đây là hiệu ứng của biến thể single:
  GOP1 của cùng lượt khỏe như retry, và (xem §3.3) chế độ
  chậm-đều nay đã bắt được ở phía retry. Giả thuyết phù hợp
  nhất còn lại: trạng thái decode của Chrome cho GOP đó
  trong lượt đó (ví dụ keyframe 10 s decode trong điều kiện
  tranh tài nguyên lúc bắt đầu đoạn GOP2 rồi không hồi) —
  nhưng dữ liệu hiện có KHÔNG phân biệt được giả thuyết này
  với các giả thuyết khác (lập lịch thread decode, trạng thái
  seek nội bộ), vì không có tín hiệu nào từ bên trong decoder
  qua CDP pipe. Kết luận trung thực: cơ chế CHUNG của đoạn
  cuối chậm đã rõ (chi phí seek ∝ khoảng cách keyframe);
  cơ chế RIÊNG khiến single-a4 sụp sâu và phẳng thì CHƯA rõ.

### 3.3 Lượt pilot retry-b1: chậm-đều đầu tiên ở phía retry

- retry-b1 (đợt 36, cùng bundle retry R1): 5,07 fps, nhãn v2
  under-load SÁT ngưỡng (predictedRate xuôi 0,976 < 0,98, chỉ
  1 gap 0,133 s) VÀ decode v2 STEADY_SLOW (tailMean 1,375,
  tailMax 2, stall 0, chuỗi GOP2 [1,1,1,1,2,2,1,2]).
- Chẩn đoán khác single-a4: GOP1 của b1 chỉ 2,78 (so với
  ~4,8 ở lượt khỏe) và tỉ số GOP2/GOP1 = 0,49 (bình thường) —
  tức b1 là CHẬM TOÀN CỤC (cả hai GOP đều chậm, phù hợp với
  nhãn under-load sát ngưỡng), còn single-a4 là SỤP ĐOẠN
  (GOP1 khỏe, GOP2 sụp, tỉ số 0,21). Cổng v2 gắn cờ cả hai —
  đúng, vì cả hai đều không phải lượt decode khỏe — nhưng
  tỉ số GOP2/GOP1 (hoặc tailHeadRatio trong output v2) phải
  đọc kèm để không gộp hai chẩn đoán khác nhau thành một.
- Hệ quả: chậm-đều KHÔNG phải đặc sản của biến thể single.
  Bất kỳ kết luận nào về "single chậm-đều hơn retry" đều
  không còn cơ sở sau b1; nếu đợt 36 bắt thêm case chậm-đều
  ở cả hai phía với tỉ lệ tương đương thì đó là nhiễu trạng
  thái máy/GOP, không phải hiệu ứng biến thể.
- Xác nhận từ toàn bộ đợt 36 (xem §4): tổng cộng 4 case
  STEADY_SLOW — retry-b1 (chậm toàn cục, GOP1 2,78, tỉ số
  0,50), retry-b2 (chậm toàn cục, GOP1 2,94, tỉ số 0,47),
  single-b1 (sụp đoạn, GOP1 3,44 khỏe tương đối, GOP2 đúng
  [1×8], tỉ số 0,29, kèm under-load nặng load1 2,92–3,32),
  retry-b8 (sụp đoạn nhẹ + chậm toàn cục, GOP1 3,28, GOP2
  1,12, tỉ số 0,34, nhưng nhãn v2 QUIET đầy đủ — case duy
  nhất trong đợt 36 mà cổng v2 là lý do loại duy nhất).
  Phân bố 3 retry / 1 single đảo ngược hướng nghi ngờ ban
  đầu ở single-a4: chậm-đều là trạng thái máy/GOP tái hiện,
  không phải hiệu ứng biến thể.

## 4. Số đo đợt 36 (16 lượt chạy, 3 accepted — KHÔNG đạt 8+8)

Driver chạy 08:19–08:43 +07 (01:19–01:43 UTC), xen kẽ, 0 lượt
gate-timeout (cổng tiền kiểm luôn tìm được khe load1 < 2,0 và
0 Chrome trong 10 phút, nhưng nhiễm vẫn xảy ra GIỮA lượt —
xem retry-b4). Load = load1 trước-xuôi / trước-ngược / cuối
lượt (chuỗi đầy đủ 1/5/15 phút trong JSON từng lượt). Tất cả
16 lượt N2 đều PASS (exit 0), sha bundle trước/sau khớp 16/16,
dist đóng băng VALID 16/16 theo Q6.

| Lượt | fps | Nhãn v2 | Decode v2 | Nhận? | Xuôi | Load1 trước-xuôi/trước-ngược/cuối | Tail (mean/max) | Stall/tick |
|---|---|---|---|---|---|---|---|---|
| retry-b1 | 5,07 | under-load | STEADY_SLOW | Không | 0,9853 | 1,71/1,52/1,55 | 1,375/2 | 0 / 92,3 |
| single-b1 | 5,56 | under-load | STEADY_SLOW | Không | 0,9789 | 2,92/2,54/3,32 | 1,000/1 | 0 / 83,8 |
| retry-b2 | 5,36 | under-load | STEADY_SLOW | Không | 1,0004 | 1,73/2,35/1,83 | 1,375/2 | 0 / 89,6 |
| single-b2 | 1,31 | under-load | STARVED | Không | 0,7789 | 1,62/1,45/1,13 | 0,375/1 | 10 / 34,6 |
| retry-b3 | 1,45 | under-load | STARVED | Không | 0,9484 | 0,53/0,49/3,59 | 0,375/1 | 8 / 41,2 |
| single-b3 | 0,98 | under-load | STARVED | Không | 0,8092 | 1,29/1,09/0,85 | 0,375/1 | 13 / 26,3 |
| retry-b4 | 0,93 | under-load | STARVED | Không | 0,7299 | 0,64/0,54/0,42 | 0,500/1 | 12 / 30,7 |
| single-b4 | 0,56 | under-load | STARVED | Không | 0,6895 | 0,35/0,29/0,23 | 0,375/1 | 17 / 16,8 |
| retry-b5 | 1,42 | under-load | STARVED | Không | 0,9248 | 0,57/0,52/2,72 | 0,375/1 | 9 / 38,8 |
| single-b5 | 6,43 | under-load | HEALTHY | Không | 1,0055 | 2,56/2,32/2,34 | 1,875/2 | 0 / 94,1 |
| retry-b6 | 6,40 | quiet | HEALTHY | **CÓ** | 0,9993 | 1,66/1,61/1,55 | 1,875/2 | 0 / 90,5 |
| single-b6 | 5,97 | under-load | HEALTHY | Không | 1,0011 | 1,61/1,76/1,96 | 1,750/2 | 0 / 90,8 |
| retry-b7 | 5,65 | quiet | HEALTHY | **CÓ** | 0,9998 | 1,88/1,81/1,96 | 1,500/2 | 0 / 88,7 |
| single-b7 | 5,81 | quiet | HEALTHY | **CÓ** | 1,0070 | 1,90/1,68/1,67 | 1,500/2 | 0 / 93,0 |
| retry-b8 | 5,58 | quiet | STEADY_SLOW | Không | 1,0009 | 1,49/1,53/1,41 | 1,125/2 | 0 / 86,8 |
| single-b8 | 5,32 | under-load | HEALTHY | Không | 0,9430 | 1,86/1,58/1,23 | 1,625/2 | 1 / 84,8 |

Lý do loại đầy đủ từng lượt (chuỗi lý do v2 + decode): xem
JSON từng lượt trong `benchmarks/results/v36-s1-seek-ab-*.json`
và file tổng hợp `v36-s1-seek-ab-summary.json` (script
`seek-ab36-summarize.mjs` tính từ file, không nhập tay).

Tổng hợp (chỉ lượt accepted, cổng v2):

| Tập | retry | single | Chênh lệch trung bình (single − retry) | CI Welch 95% | Kết luận <10% |
|---|---|---|---|---|---|
| Đợt 36-only | n=2, tv 6,026, tb 6,026, sd 0,536 | n=1, 5,811 | −3,57% (n=1 nên không có CI) | không tính được | KHÔNG ĐỦ DỮ LIỆU |
| R1 phân loại lại v2 | n=3, tv 8,907, tb 8,999, sd 0,310 | n=2, tv 9,190, tb 9,190, sd 0,533 | +2,12% | [−10,75%, +14,99%] | CHƯA KHÓA (vượt cả hai đầu) |
| Gộp 36+R1 (cùng bundle) | n=5, tv 8,746, tb 7,810, sd 1,665 | n=3, tv 8,813, tb 8,064, sd 1,987 | +3,25% | [−45,36%, +51,86%] | KHÔNG DÙNG ĐƯỢC (trôi phiên, §5.2) |

Cặp duy nhất cùng phiên đợt 36: retry-b6 / single-b7, tỉ số
0,9073 (−9,27% theo hướng retry). Cặp R1-v2: 0,9895 và 1,0939
(đổi dấu). Không cặp nào, không tập nào cho thấy lợi thế hệ
thống ~10% trở lên theo một hướng.

Tỉ lệ nhận đợt 36: 3/16 (retry 2/8, single 1/8). Phân loại
lượt bị loại: STARVED 6, STEADY_SLOW 4, HEALTHY nhưng
under-load 3. Riêng 6 lượt STARVED đều có xuôi tệ rõ rệt
(0,69–0,95) và tick ngược 16,8–41,2/s — nhiễm tải giữa lượt,
không phải hiệu ứng biến thể.

## 5. Đọc số (và không đọc quá số)

### 5.1 Vì sao mục tiêu 8+8 không đạt — và vì sao đó là kết quả, không phải lỗi đo

Cổng tiền kiểm chỉ bảo vệ ĐẦU lượt: retry-b4 qua cổng với
load1 0,64 và 0 Chrome nhưng kết thúc với xuôi 0,73 và 19 gap
> 100 ms — luồng khác đã phóng browser GIỮA lượt đo (~40 s
cửa sổ phơi nhiễm). Tương tự retry-b3: load cuối lượt vọt
lên 3,59 dù đầu lượt chỉ 0,53. Trong buổi đo, cổng đã ghi
chrome=13–28 và load1 2,7–4,8 ở nhiều lần kiểm tra — tức
các luồng round 36 khác chạy browser gần như liên tục. Với
tỉ lệ nhiễm này, đạt 8 accepted/phía cần cỡ ~40 lượt chạy
(3/16 → 8/phía ≈ 43 lượt) trong cùng điều kiện — không thực
tế trong một lượt cron. Kết luận đúng không phải "chạy thêm
là khóa được", mà là "đo khóa cần phiên đo riêng, không
chạy chung với các luồng browser khác" (xem nợ §6.1).

### 5.2 Trôi mức tuyệt đối giữa hai phiên — cảnh báo gộp số

Accepted đợt 36 (5,65–6,40) thấp hơn accepted R1 (8,75–9,35)
tới ~30% trên CÙNG bundle, CÙNG fixture, CÙNG harness. Hai
dấu hiệu đi kèm, đều đo được từ JSON:

- Load nền bền: lượt quiet đợt 36 có load5 ~2,1–2,3 và
  load15 ~2,1 (retry-b6: "1,66 2,28 2,14" trước-xuôi;
  single-b7: "1,90 2,19 2,12"), trong khi lượt quiet R1 có
  load5 ~1,4–1,9 và load15 ~0,75–1,3 (retry-a4: "0,86 1,44
  1,13"). Nhãn quiet v2 chỉ xét load1 nên không thấy tải
  nền này — đây là lỗ hổng của cổng, không phải lỗi của
  lượt đo, và là ứng viên số 1 giải thích mức fps thấp hơn.
- GOP1 cũng chậm toàn cục: trung bình draw GOP1 ở các lượt
  quiet đợt 36 chỉ 3,06–3,56 (so với 4,72–5,39 ở R1) — tức
  chậm xảy ra ở MỌI đoạn, không riêng đoạn GOP2, phù hợp
  với tải nền bền hơn là với hiệu ứng seek.

Hệ quả: (a) KHÔNG được gộp số hai phiên thành một baseline
mà không hiệu chỉnh trôi phiên; (b) headline quiet mới cho
fixture này KHÔNG phải một số duy nhất — nó là 8,9 (phiên
R1, tải nền thấp) hoặc 6,0 (phiên đợt 36, tải nền cao) tùy
phiên, và mọi so sánh hồi quy sau này phải ghi kèm load5/
load15 của phiên đó; (c) nếu đợt sau vá cổng v3 thêm
load5/load15 thì các lượt "quiet" đợt 36 rất có thể sẽ bị
phân loại lại thành under-load — và đó sẽ là phân loại
đúng hơn, không phải thay đổi kết luận A/B (A/B trong phiên
vẫn là so sánh duy nhất có giá trị).

### 5.3 Chậm-đều không còn là hiện tượng một phía, một lượt

Đợt 36 bắt 4 case STEADY_SLOW: retry 3 (b1, b2, b8) vs
single 1 (b1). Cộng với single-a4 đợt 35, tổng số case là
5, phân bố retry 3 / single 2 — không còn cơ sở nào để gắn
chậm-đều với biến thể single. Hai dạng đã tách được nhờ tỉ
số GOP2/GOP1 (§3.3): chậm toàn cục (b1/b2: tỉ số 0,47–0,50,
GOP1 cũng chậm) và sụp đoạn (single-a4: 0,21; retry-b8:
0,34, chuỗi GOP2 [2,1,1,1,1,1,1,1]). retry-b8 đặc biệt đáng
chú ý: nhãn v2 quiet đầy đủ (xuôi 1,0009, load1 ≤ 1,53) nhưng
vẫn STEADY_SLOW — chứng minh cổng v2 có giá trị độc lập với
nhãn tải, không chỉ là bản sao của under-load.

### 5.4 Mong manh ở biên ngưỡng tailMean = 1,5

Cả hai lượt accepted phía sau của đợt 36 (retry-b7,
single-b7) đều có tailMean ĐÚNG 1,500 — tức nằm ngay trên
biên của điều kiện < 1,5 nghiêm ngặt. Ngưỡng này đã đặt
trước khi đo (hiệu chuẩn từ single-2 đợt 34 cũng đúng 1,5)
nên việc giữ hai lượt này là đúng quy tắc, KHÔNG phải nới
ngưỡng sau khi thấy số — nhưng phải ghi rõ: nếu ngưỡng
từng là ≤ 1,5 thì đợt 36 chỉ còn 1 accepted (retry-b6), và
bất kỳ lần hiệu chuẩn lại nào cũng phải xử lý vùng biên
1,5 này một cách có chủ ý (ví dụ: thêm điều kiện tailMax
hoặc đo lại tail bằng mẫu mịn hơn 0,5 s) thay vì lặng lẽ
đổi dấu bất đẳng thức.

### 5.5 Không được claim

- Không claim "settle-wait tốn 0%" hay "single nhanh hơn
  2–3%": mọi điểm ước lượng đều trong nhiễu và đổi dấu theo
  tập dữ liệu; claim duy nhất đứng được là "không có hiệu
  ứng lớn ~20% theo hướng single" (kế thừa R1) và "hiệu ứng
  <10% chưa khóa được".
- Không claim "mức quiet của fixture là 6,0" hay "là 8,9":
  mức tuyệt đối trôi theo phiên (§5.2); chỉ so sánh TRONG
  phiên mới có giá trị.
- Không claim cơ chế riêng của sụp đoạn GOP2 đã rõ (§3.2):
  chỉ cơ chế chung (chi phí seek ∝ khoảng cách keyframe)
  là có bằng chứng định lượng; phần sụp sâu/phẳng thêm của
  single-a4 và retry-b8 vẫn là bất thường chưa giải thích.
- Không dùng số under-load/STARVED/STEADY_SLOW làm baseline
  hay làm bằng chứng hiệu ứng biến thể: chúng là lượt bị
  loại, chỉ có giá trị chẩn đoán cổng đo và tải máy.

## 6. Nợ còn lại

1. Nếu đợt 36 vẫn chưa khóa <10%: tăng n tiếp hoặc chấp nhận
   hiệu ứng nhỏ là không phân giải được trên VM này (phương
   sai lượt-lượt + nhiễu luồng khác áp đảo); cân nhắc đo trên
   máy yên thật (không có luồng browser khác) thay vì chỉ
   dựa vào cổng tiền kiểm.
2. Cơ chế riêng của sụp đoạn GOP2 kiểu single-a4 vẫn chưa rõ:
   cần tín hiệu decode sâu hơn (ví dụ đo thời gian từng seek
   trong phase ngược, hoặc kéo dài phase ngược qua biên GOP
   tiếp theo để xem đoạn GOP2 có hồi khi t → 10 hay không) —
   ngoài phạm vi A/B này.
3. Cổng v2 hiện gắn cờ cả "sụp đoạn" lẫn "chậm toàn cục":
   đợt sau có thể tách hai nhãn bằng tỉ số GOP2/GOP1 (ngưỡng
   gợi ý từ dữ liệu hiện tại: tỉ số < 0,30 → sụp đoạn), nhưng
   ngưỡng đó CHƯA được hiệu chuẩn trước nên không áp dụng
   hồi tố vào số đợt 36.
4. Không làm: không revert `seekElement` trừ khi bằng chứng
   mới đủ mạnh (điều kiện revert của R1: retry-loop thua có
   ý nghĩa thống kê — xem §5 sau khi có số); không sửa
   `seek.ts` sản phẩm, preview, i18n, bridge; không push,
   không tag.

## 7. File đổi/thêm (text, không binary — parent gộp batch)

- Mới: `apps/web/scripts/seek-ab-decode-side-v2-analyze.mjs`
  (probe decode-side v2: giữ nguyên ngưỡng v1 + nhãn
  STEADY_SLOW theo tail 8 khoảng cuối; `node --check` pass;
  mode `calibrate` tái tạo bảng hiệu chuẩn 19 lượt cũ).
- Mới: `apps/web/scripts/seek-ab-quiet-run36.sh` (runner 1 lượt
  đợt 36, kế thừa runner R1: cổng tiền kiểm 10 phút, probe Q6
  với `Q6_DIST` đóng băng, kiểm tra sha bundle trước/sau,
  probe decode-side v2, gộp 1 JSON kết quả; `bash -n` pass;
  sửa 1 lỗi của bản v35: tạo `runs/` trước khi redirect log
  Q6, nếu không lượt đầu tiên trên scratch mới sẽ NO_RESULT
  với q6_exit=1 — lỗi này đã bắt được ở pilot retry-b1 và đã
  sửa trước khi chạy lại, không ảnh hưởng số liệu).
- Mới: `apps/web/scripts/seek-ab36-summarize.mjs` (tổng hợp
  đợt 36 + phân loại lại R1 bằng v2 + tập gộp; CI Welch 95%
  cho chênh lệch trung bình và verdict khóa <10%; `node
  --check` pass).
- Mới: `docs/PHASE9_ROUND36_S1_SEEK_AB_LOCK_LIMITS.md`
  (file này).
- Mới: `benchmarks/results/v36-s1-seek-ab-*.json` (JSON gộp
  mỗi lượt: nhãn v2 + decode-side v2 + load + sha bundle +
  lý do loại) và `benchmarks/results/v36-s1-seek-ab-summary.json`
  (tổng hợp).
- Không sửa: mọi code sản phẩm, harness N2, probe Q6, probe
  v1, script của luồng khác, paths-loop, build-loop-log.
  Không push, không tag. Scratch
  `~/workspace/tmp-round36-s1/` (driver + runs, ngoài repo,
  không stage); dist đóng băng tái dùng của R1 tại
  `~/workspace/tmp-round35-r1/dist-retry|dist-single`.

## 8. Kiểm chứng đã chạy

- `node --check` probe v2 + script tổng hợp pass; `bash -n`
  runner36 pass.
- Hiệu chuẩn v2 trên 19 lượt cũ: giữ nguyên nhãn v1 của 18
  lượt, chỉ đổi single-a4 HEALTHY → STEADY_SLOW (xem §2);
  số stall v2 khớp v1 từng lượt.
- Pilot retry-b1 chạy đầu-cuối qua runner36 (sau khi sửa lỗi
  redirect): N2 PASS, sha bundle trước/sau khớp, dist đóng
  băng VALID theo Q6.
- `seek.ts` live sha256 trước = sau =
  `efb0160b93019a3d6d9486ebc84951003889195358e99bdadf9854476b7af11c`
  (khớp đợt 34/35); `apps/web/dist` live không bị S1 ghi đè
  (dùng `Q6_DIST`).
