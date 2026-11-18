# LIMITS — Phase 9 đợt 127 T1: Phân tích bàn giấy E4 lượt 9 (KHÔNG đo mới)

> Đo thật, không code giả — và ở đây là PHÂN TÍCH BÀN GIẤY trên dữ liệu đã có.
> Không chạy probe mới, không sửa production, không đo lại.
> Kết luận: **CÙNG KIỂU** — 10 tick sau-đóng (19–33) là cùng một cơ chế
> "tụt-rồi-đuổi-kịp" như tick 35, không phải kiểu khác; dữ liệu đủ để phân biệt.

## 0. Câu hỏi và phương pháp (đăng ký trước khi nhìn dữ liệu chi tiết)

- Câu hỏi duy nhất (quyết parent đợt 126 §12(a)): 10 tick sau steady-close
  vượt 0,35 (19, 20, 21, 23, 25, 29, 30, 31, 32, 33) có phải cùng kiểu
  "tụt-rồi-đuổi-kịp" như tick 35 không, hay là kiểu khác?
- Định nghĩa làm việc, ghi trong script TRƯỚC khi chạy phân tích chi tiết
  (`hidden_files/round127-t1/analyze-desk-t1.py`):
  - Kiểu P35 ("ph-đuổi-kịp"): ở tick drift đóng từ >0,35 xuống ≤0,35,
    ph tăng mạnh trong 1 tick trong khi ct gần đứng yên, ct KHÔNG giảm về
    ph, resyncsV KHÔNG đổi, sampler KHÔNG seeking trong bracket quanh tick.
  - Kiểu SEEK: ct giảm về ph (Δct âm lớn), và/hoặc resyncsV tăng, và/hoặc
    sampler bắt seeking=True.
  - Kiểu KHÁC: drift đóng vì ct đứng yên trong khi ph tăng bình thường,
    hoặc cả hai cùng tăng nhưng ct chậm hơn đều đặn qua nhiều tick.
- Ba kênh độc lập để loại trừ seek: (1) Δct từng tick (seek thật bắt buộc
  ct nhảy GIẢM về ph, Δct ≈ −0,35..−0,5); (2) resyncsV — bộ đếm đơn điệu,
  tăng là có seek; (3) sampler-bracket — seeking=True trong cửa sổ thời
  gian của tick. Một re-seek không thể lọt khỏi cả ba kênh cùng lúc.
- Nguồn dữ liệu (chỉ đọc, không đo lại):
  - Lượt 9: `hidden_files/round126-t1/probe-webkit-load0-gop250-e4a9/probe-results.json`,
    md5 `a403dfa9ceb22b488b398783fddc7c42` — khớp đúng md5 T1 đợt 126 đã ghi.
  - Lượt 7 (đối chiếu): `hidden_files/round125-t1/probe-webkit-load0-gop250-e4a7/probe-results.json`,
    md5 `776a67604eb7307defc3e9f409bd7713` — khớp đúng md5 T1 đợt 125 đã ghi.
  - Script phân tích: `hidden_files/round127-t1/analyze-desk-t1.py` (+ bản tinh
    chỉnh `analyze-desk-t1b.py`), output `analyze-desk-t1.out` (180 dòng),
    `analyze-desk-t1b.out`. Cả hai script đều chạy trên dữ liệu cũ, không
    chạm probe, không chạm production.

## 1. Kết quả — lượt 9: 5/5 tick đóng drift sau steady-close đều cùng kiểu P35

10 tick vượt sau-đóng tạo thành **4 đợt** (run), mỗi đợt đóng ở 1 tick:

| Đợt vượt | Đóng ở tick | Drift trước→sau | Δct | Δph | rateCt | resyncsV | Sampler seeking |
|---|---|---|---|---|---|---|---|
| 19–21 | 22 | 0,4594 → 0,2667 | +0,0406 | +0,2333 | 0,21× | 1→1 | False |
| 23 | 24 | 0,4237 → 0,3000 | +0,0763 | +0,2000 | 0,38× | 1→1 | False |
| 25 | 26 | 0,4238 → 0,2667 | +0,0429 | +0,2000 | 0,24× | 1→1 | False |
| 29–33 | 34 | 0,4520 → 0,2667 | +0,0480 | +0,2333 | 0,17× | 1→1 | False |
| (đóng cuối) | 35 | 0,2667 → 0,0333 | +0,0333 | +0,2667 | 0,26× | 1→1 | False |

Bảng tick đầy đủ (cửa sổ hoạt động, t = ms vel-time):

| tick | t | ct | ph | drift | Δct | Δph | rateCt |
|---|---|---|---|---|---|---|---|
| 12 | 1767 | 0,8887 | 0,5000 | 0,3887 | +0,3220 | 0,0000 | 1,87× |
| 13 | 1994 | 1,0000 | 0,6667 | 0,3333 | +0,1113 | +0,1667 | 0,49× |
| 14 | 2267 | 1,3251 | 0,9000 | 0,4251 | +0,3251 | +0,2333 | 1,19× |
| 15 | 2477 | 1,3667 | 1,1667 | 0,2000 | +0,0416 | +0,2667 | 0,20× |
| 16 | 2796 | 1,8000 | 1,3000 | 0,5000 | +0,4333 | +0,1333 | 1,36× |
| 17 | 3078 | 2,1985 | 1,7000 | 0,4985 | +0,3985 | +0,4000 | 1,41× |
| 18 | 3303 | 2,2333 | 1,9667 | 0,2666 | +0,0348 | +0,2667 | 0,15× |
| 19 | 3500 | 2,6193 | 2,2000 | 0,4193 | +0,3860 | +0,2333 | 1,96× |
| 20 | 3781 | 2,7667 | 2,4000 | 0,3667 | +0,1474 | +0,2000 | 0,52× |
| 21 | 4006 | 3,1261 | 2,6667 | 0,4594 | +0,3594 | +0,2667 | 1,60× |
| 22 | 4198 | 3,1667 | 2,9000 | 0,2667 | +0,0406 | +0,2333 | 0,21× |
| 23 | 4403 | 3,5237 | 3,1000 | 0,4237 | +0,3570 | +0,2000 | 1,74× |
| 24 | 4604 | 3,6000 | 3,3000 | 0,3000 | +0,0763 | +0,2000 | 0,38× |
| 25 | 4802 | 3,9238 | 3,5000 | 0,4238 | +0,3238 | +0,2000 | 1,64× |
| 26 | 4983 | 3,9667 | 3,7000 | 0,2667 | +0,0429 | +0,2000 | 0,24× |
| 27 | 5174 | 4,1667 | 3,8667 | 0,3000 | +0,2000 | +0,1667 | 1,05× |
| 28 | 5391 | 4,3000 | 4,0667 | 0,2333 | +0,1333 | +0,2000 | 0,61× |
| 29 | 5591 | 4,7115 | 4,2667 | 0,4448 | +0,4115 | +0,2000 | 2,06× |
| 30 | 5881 | 4,8667 | 4,4667 | 0,4000 | +0,1552 | +0,2000 | 0,54× |
| 31 | 6007 | 5,1279 | 4,7667 | 0,3612 | +0,2612 | +0,3000 | 2,07× |
| 32 | 6286 | 5,2667 | 4,9000 | 0,3667 | +0,1388 | +0,1333 | 0,50× |
| 33 | 6498 | 5,6187 | 5,1667 | 0,4520 | +0,3520 | +0,2667 | 1,66× |
| 34 | 6779 | 5,6667 | 5,4000 | 0,2667 | +0,0480 | +0,2333 | 0,17× |
| 35 | 6908 | 5,7000 | 5,6667 | 0,0333 | +0,0333 | +0,2667 | 0,26× |

- **Tách hai nhóm sạch (bimodal), không vùng xám:** tick MỞ drift (12, 14, 16,
  19, 23, 25, 29) có Δct 0,3220–0,4333, rateCt 1,19–2,06× — ct BURST.
  Tick ĐÓNG drift sau steady-close (22, 24, 26, 34, 35) có Δct 0,0333–0,0763,
  rateCt 0,15–0,38× — ct CHỮNG. Không có tick nào nằm giữa hai nhóm.
  (Tick 13 đóng sớm trước steady-close, Δct 0,1113 — vẫn nhỏ hơn hẳn nhóm
  burst, cùng họ cơ chế.)
- **Δph ở tick đóng là BÌNH THƯỜNG, không phải nhảy vọt:** Δph tick đóng
  0,2000–0,2667, trong khi Δph trung vị cửa sổ hoạt động là 0,2000 và
  khoảng toàn cửa sổ là 0,0000–0,4000 (tick 17 Δph 0,4000 còn lớn hơn).
  Nghĩa là ở tick đóng, ph chỉ tăng với tốc độ bình thường ~1×; cái làm
  drift đóng là **ct chững lại sau burst**, không phải ph nhảy lên.
  Đây là ĐÍNH CHÍNH cách diễn đạt của đợt 126 ("ph NHẢY LÊN" ở tick 35):
  hiệu ứng thì đúng (playhead đuổi kịp currentTime), nhưng động lực là
  ct-stall, không phải ph-jump.
- **Ba kênh loại trừ seek — toàn bộ âm tính trong cửa sổ 19–33:**
  (1) ct KHÔNG BAO GIỜ giảm sau tick 1: ct đơn điệu không-giảm từ tick 2
  tới tick 195; lần giảm duy nhất toàn lượt là tick 1 (−4,5, transient
  TRƯỚC seek ban đầu ở tick 2, ct 5→0,5). ph KHÔNG BAO GIỜ giảm toàn lượt.
  (2) resyncsV chỉ đổi 1 lần ở tick 2 (seek ban đầu), giữ 1 tới tick 195;
  restartV cuối = 0, không đổi lần nào. (3) Sampler: đúng 1 seeking run
  toàn lượt (samples 0..1, relMs 124..228 — seek ban đầu); 14 sample trong
  cửa sổ vel-time tick 19..33 (3500..6498 ms) toàn seeking=False,
  rsV=1, el_t khớp ct từng tick (2,767 → 5,619).
- Sau tick 35 drift lắng hẳn: tick 36–42 drift −0,1/−0,3 (ph vượt ct khi
  clip ended, ct kẹt 5,7), tick 43 về 0 và giữ 0 tới tick 195 (ct=ph=6).

## 2. Đối chiếu lượt 7 (chân A gop250, boot #70) — cùng kiểu, 9/9

- Lượt 7 có 9 tick đóng drift trong cụm (15, 18, 20, 22, 24, 27, 30, 33,
  35): Δct 0,0000–0,0868 (toàn bộ <0,10), Δph 0,1000–0,3334, rateCt
  0,00–0,59×, resyncsV 1→1 ở mọi tick. Tick mở drift (12, 17, 19, 21, 23,
  25, 28, 31, 34): Δct 0,2730–0,6068, rateCt 1,19–2,80×.
  Cùng tách bimodal sạch như lượt 9, cùng chữ ký ct-burst → ct-stall.
- Lượt 7: ct chỉ giảm ở tick 2 (−4,5 — chính seek ban đầu); ph chỉ giảm ở
  tick 1 (−4,5 — transient trước seek). Sampler đúng 1 seeking run
  (samples 1..2, relMs 421..591 — seek ban đầu); 22 sample trong cửa sổ
  tick 12..34 toàn seeking=False.
- Hai tick "KHÁC (chưa phân loại)" trong phân loại thô ban đầu (lượt 7
  tick 27, 35; lượt 9 tick 24) là giả tạo do ngưỡng 0,20 cứng + sai số
  float (Δph 0,1999999… < 0,20) — với tham chiếu trung vị cửa sổ hoạt
  động, cả ba đều cùng họ: Δct nhỏ (0,067–0,076), ph tăng bình thường,
  không resync, không seeking. Không có trường hợp nào khác kiểu thật sự.
- Tổng cộng: **14/14 tick đóng drift trên hai lượt A đều cùng một cơ chế,
  0 trường hợp SEEK, 0 trường hợp khác kiểu.**

## 3. Kết luận — CÙNG KIỂU, và cơ chế chính xác là gì

- **10 tick sau-đóng (19–33) là cùng kiểu với tick 35: cùng một răng cưa
  (sawtooth) ct-burst → ct-stall.** Chu kỳ: decoder đẩy ct vọt lên
  (rate 1,2–2,1×) → drift vượt 0,35 → ct chững lại (rate 0,15–0,38×)
  → ph đuổi kịp ở tốc độ bình thường → drift đóng. Lặp lại 4 lần sau
  steady-close (đóng ở tick 22, 24, 26, 34) rồi đóng lần cuối ở tick 35.
  Tick 35 không đặc biệt — nó chỉ là lần đóng thứ 5, cùng chữ ký số với
  4 lần trước (Δct 0,0333 nhỏ nhất nhóm, Δph 0,2667 trong khoảng bình thường).
- **Dữ liệu ĐỦ để phân biệt:** tách bimodal Δct (nhóm mở ≥0,27, nhóm đóng
  ≤0,11) không chồng lấn trên 14+14 tick của hai lượt; ba kênh loại trừ
  seek đều âm tính; lượt 7 tái hiện độc lập cùng mẫu trên boot khác.
  Điều có thể làm giả kết luận này — một tick đóng với Δct âm lớn, hoặc
  resyncsV tăng, hoặc sampler seeking=True — không xuất hiện lần nào.
- Cơ chế này cũng giải thích vì sao cụm drift là đặc tính chân A gop250
  (đợt 126 §4): răng cưa burst/stall của decoder với GOP dài; chân B gop30
  (lượt 8, 10) có 0 lần vượt vì ct được cấp đều hơn. Đây là tương quan qua
  5 lượt gần nhất, không phải chứng minh nhân quả — nhưng nhất quán với
  chữ ký số ở đây.

## 4. Điều này thay đổi gì về caveat ĐÓNG CÓ ĐIỀU KIỆN của E4?

- **Verdict E4 KHÔNG đổi: giữ ĐÓNG CÓ ĐIỀU KIỆN; H1/H3 vẫn không phân
  định.** Không có lượt CAUGHT-RESEEK nào trong cả lô 10/10, chỉ số chính
  (seeking-duration của drift re-seek đầu tiên sau steady-close) vẫn VẮNG.
  Phân tích này không tạo ra cặp A+B CAUGHT-RESEEK.
- **Caveat được LÀM MẠNH theo hướng có lợi cho phân loại CAUGHT-NO-RESEEK,
  không yếu đi:** điều kiện kích re-seek (drift >0,35, có 2 đợt 2+ tick
  liên tiếp 19–21 và 29–33) đã đủ KHÔNG PHẢI 1 lần mà 4 lần riêng biệt
  trong ~3,4 s sau steady-close, và hệ thống KHÔNG bắn re-seek lần nào —
  lệch chỉ hết vì playhead tự đuổi kịp. "Không re-seek" ở lượt 9 vì vậy
  không phải một cửa sổ yên tĩnh duy nhất mà là 4 cơ hội kích hoạt bị bỏ
  qua liên tiếp.
- **Nhưng dòng chú thích trong ngoặc của prereg-e4batch §2 là SAI SỰ THẬT
  và parent cần đính chính trước khi dùng kết quả lô:** chú thích viết
  "(drift sau steady-close không bao giờ vượt 0,35 xác nhận 2 tick liên
  tiếp)" — thực tế drift sau steady-close vượt 0,35 ở 10 tick, gồm 2 đợt
  2+ tick liên tiếp (19–21, 29–33). Phân loại CAUGHT-NO-RESEEK của lượt 9
  đứng vững theo ĐỊNH NGHĨA CHÍNH ("KHÔNG có drift re-seek nào trong cửa
  sổ quan sát" — đã xác minh bằng 3 kênh độc lập), nhưng chú thích hẹp
  hơn định nghĩa chính và mâu thuẫn dữ liệu. Đề nghị parent: sửa chú
  thích cho khớp định nghĩa chính (hoặc ghi rõ chú thích đó không phải
  điều kiện phân loại), KHÔNG đổi verdict lượt 9.
- **Đính chính diễn đạt cơ chế (đợt 126 §1, §5):** "ph NHẢY LÊN" → "ct
  chững lại sau burst, ph đuổi kịp ở tốc độ bình thường". Hiệu ứng quan
  sát giống nhau, nhưng nguyên nhân là decoder burst/stall, không phải
  playhead nhảy vọt. Điều này quan trọng nếu sau này có ai đi tìm "vì sao
  ph nhảy" — sẽ tìm sai chỗ.
- **Không mở câu hỏi mới cần đo thêm:** phân tích bàn giấy đã trả lời câu
  hỏi duy nhất được giao; không cần lượt đo E4 mới cho vấn đề này. Mọi
  quyết định tiếp theo về E4 (giữ đóng có điều kiện, đính chính prereg,
  hay mở hướng khác) thuộc về parent/user.

## 5. Ghi chú trung thực / giới hạn

- Đây là phân tích bàn giấy trên n=1 lượt CAUGHT (lượt 9) + n=1 lượt đối
  chiếu (lượt 7). Nó chứng minh "10 tick sau-đóng cùng kiểu với tick 35"
  trong HAI lượt đã quan sát, không chứng minh cho mọi lượt A gop250 chưa đo.
- Sampler có nhịp ~200 ms — một seeking event <200 ms về lý thuyết có thể
  lọt khỏi sampler; nhưng resyncsV (bộ đếm đơn điệu, publish theo từng vel
  tick) và Δct (ct không bao giờ giảm sau tick 2) là hai kênh độc lập còn
  lại, và seek thật bắt buộc phải đổi một trong hai kênh đó. Kết luận
  "không seek" không dựa vào sampler một mình.
- Phân loại thô ban đầu (analyze-desk-t1.py) dùng trung vị toàn lượt (=0 do
  tick sau-ended) làm tham chiếu — sai sót phương pháp đã được phát hiện và
  sửa bằng bản tinh chỉnh (analyze-desk-t1b.py, tham chiếu cửa sổ hoạt
  động). Kết luận cuối dựa trên bản tinh chỉnh; bản thô vẫn lưu để đối chiếu.
- Không đo TTS 39, không thử birefnet, không chạy probe mới, không sửa
  production, không push, không release/tag. Chỉ đọc 2 file probe-results.json
  cũ và ghi file LIMITS + script phân tích này.

## 6. File liên quan

- Phân tích: `workspace/goals/capcut-clone-video-editor/hidden_files/round127-t1/analyze-desk-t1.py`,
  `analyze-desk-t1.out`, `analyze-desk-t1b.py`, `analyze-desk-t1b.out`
- Dữ liệu: `.../round126-t1/probe-webkit-load0-gop250-e4a9/probe-results.json`
  (md5 `a403dfa9ceb22b488b398783fddc7c42`); `.../round125-t1/probe-webkit-load0-gop250-e4a7/probe-results.json`
  (md5 `776a67604eb7307defc3e9f409bd7713`)
- Đối chiếu: `repo-1/docs/PHASE9_ROUND126_T1_E4BATCH_R9_LIMITS.md` (§1, §5);
  `repo-1/docs/PHASE9_ROUND125_T1_E4BATCH_R7_LIMITS.md`; prereg
  `.../round118-t9/e4batch-ledger.md` (lượt 7 att2, lượt 9 att1)
- Batch stage: `repo-1-push/paths-loop/phase9-round127-t1-e4desk.txt`
