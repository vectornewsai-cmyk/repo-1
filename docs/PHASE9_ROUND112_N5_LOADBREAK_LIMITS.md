# PHASE9_ROUND112_N5_LOADBREAK_LIMITS.md — Điểm gãy tải: tích đủ tick bằng phát dài, đợt 112, luồng N5

**Ngày:** 14/11/2026. **Luồng:** N5 (Phase 9 đợt 112). **Chủ đề:** Điểm gãy
tải — tích đủ tick dưới tải (nợ LIMITS gộp đợt 111 §10 mục 9).
**Bối cảnh:** docs/PHASE9_ROUND111_M7_LOADBREAK_LIMITS.md (toàn bộ —
điểm gãy VẪN MỞ: GIỮ tới sampled mean 1,87 (r69); r65–r68 TRUNG-GIAN vì
đói tick 17/36/30/8 < 50; tick rate 29,65/s → 0,91/s; dial hog không
điều khiển được load1; chỉ sampled mean TRONG LÚC PHÁT đáng tin; gate
v2 không suy ra presented GIỮ; 0 lỗi CDP/project-load),
hidden_files/round112-n5/prereg-n5.md (viết TRƯỚC mọi lượt probe) +
phân tích hiệu chuẩn metric phụ trên dữ liệu M7 cũ (§5 prereg).
**Build lúc viết prereg:** preview.tsx md5
`c4198206cb916c0f1c6d8996330335a1` (khớp M7). **Build lúc chạy các lượt
có tải:** md5 **`03bf029f09b8890b285eacc10a02172b`** — N1 (luồng E4
steady-close, đợt 112) sửa preview.tsx lúc **09:08:07Z** (file
441.338 → 442.673 byte), GIỮA control s74 và lượt tải đầu tiên (xem
§0). **Boot lúc viết prereg:** #42 `cc39f151-05bc-42bf-b5fa-ee9ac5ff28ba`
(08:05:20Z). **Boot lúc chạy các lượt có tải:** **#43
`1af50bdb-2872-4542-aaa6-dbec82fa1b51`** (08:53:48Z; gap #42→#43 ≈
48'28", không phá sàn 19'07") — reboot #43 giết driver N5 giữa dial
s70 (xem §0). F3 tap+relabel TẮT trong mọi lượt. Chỉ chạy chromium
(đường rVFC). Không probe WebKit → không chạy vcut-webkit-postboot-check.sh
(chỉ bắt buộc trước probe WebKit sau reboot; N1 đã chạy postboot-check
cho boot #43 — xem `round112-n1/postboot-check-b43.log`). Không push
GitHub, không release/tag, không TTS 39, không birefnet.

**Kết quả lớn nhất đợt này:**
- **Điểm gãy: VẪN MỞ — nhưng biên GIỮ đã đẩy từ 1,87 lên 9,59.**
  s71 (sampled mean load1 9,59): **283 blendTick, 84,1% trong ±1,
  trung vị 0 → GIỮ** (hợp lệ). s70 (load1 18,2): 159 tick, 58,5%
  trong ±1, trung vị +1 → TRUNG-GIAN (hợp lệ). s72 (load1 28,38):
  chỉ 30 tick < 50 → không phân loại được một mình. Không có lượt
  nào GÃY (<50% trong ±1 VÀ trung vị ≤ −2) ở bất kỳ mức tải nào.
- **Phát dài (nclips=20, 60 s) CÓ TÁC DỤNG tới tải ~18 nhưng KHÔNG
  đủ ở tải ~28:** s70 tích được 159 tick (M7 r67 cùng dải tải chỉ
  có 30 tick), s71 tích được 283 tick, s73 121 tick; nhưng s72 ở
  load1 28,38 chỉ được 30 tick (tick rate 0,24/s) — cần cửa sổ
  **208,7 s (~70 clip)** mới đủ 50 tick. Tick rate sụp siêu tuyến
  tính theo tải: 12,35/s (load 1,65) → 4,36/s (9,59) → 2,19/s
  (18,2) → 0,24/s (28,38).
- **Dị thường s73: TRUNG-GIAN ở tải THẤP NHẤT (load1 0,91, 121 tick,
  chỉ 47,1% trong ±1, trung vị +2)** — tệ hơn cả s71 ở tải 9,59.
  Tải (sampled mean load1) KHÔNG đơn điệu với chất lượng presented
  trong dữ liệu N5: GIỮ ở 1,65 và 9,59 xen kẽ TRUNG-GIAN ở 0,91 và
  18,2. Bằng chứng chỉ về pump đói trong lúc load đang decay
  (load5 6,6 trong khi load1 0,91; tick rate chỉ 1,6/s; skip-stale
  40,3%) + nhiễu sibling — nhưng KHÔNG loại trừ được nhiễu do đổi
  build (s73 chạy trên 03bf029f, control s74 chạy trên c4198206).
  Cần 1 lượt control trên build mới để tách (xem §9).
- **Dạng lệch dưới tải là DƯƠNG (skip-ahead), không phải trễ âm:**
  trung vị offset +2/+1/0/+2 (s73/s70/s71/s72); off ≥ +2 chiếm
  52,9% / 41,5% / 15,9% / 56,7% và bám sát tỉ lệ pump
  `skip-stale-frame` (40,3% / 36,6% / 21,8% / 37,7%). Dạng gãy
  "trễ âm" của K4 r56 (trung vị −4) vẫn KHÔNG tái hiện ở bất kỳ mức
  tải nào tới 28,38.
- **Hai lỗi dụng cụ mới phát hiện:** (a) trích kết quả probe timeout
  sau lượt phát dài 340 s dưới tải nặng (s72 lần 1: EVAL_TIMEOUT
  60 s — mất toàn bộ dữ liệu lượt đó); (b) playhead kẹt ~3,5 phút
  ở biên clip 21,0 s dưới load1 ~44 rồi tự hồi (s72 lần 1). Cả hai
  đều là giới hạn của phép đo phát-dài dưới tải nặng, không phải
  bằng chứng GÃY.

---

## §0. Bối cảnh chạy (reboot #43 giết driver; N1 đổi build giữa chừng; tranh lock)

- **Reboot #43 (08:53:48Z) giết driver N5:** driver khởi động
  08:50:38Z, chạy xong control s74 (08:53:33Z, exit=0). Lúc 08:53:54
  s72 bắt đầu acquire lock thì máy reboot (boot #42 → #43); toàn bộ
  cây tiến trình driver + hog + sampler chết lúc ~08:54:10Z (log
  dừng giữa dial s70, sampler chỉ ghi 1 mẫu). "Service restart" mà
  agent thấy cùng lúc chính là reboot này (không phải lỗi riêng của
  service). Driver được khởi động lại bằng runner setsid
  (`runner112n5.sh`, tách session để không bị restart giết nữa),
  chạy lại 4 lượt tải còn lại (s72/s70/s71/s73) từ 09:00:52Z trên
  boot #43. **Hậu quả:** s74 chạy trên boot #42 + build c4198206;
  mọi lượt tải chạy trên boot #43 + build 03bf029f. Phân loại
  GIỮ/GÃY tính trong từng lượt nên đổi boot không làm mất hiệu lực
  phân loại, nhưng so sánh tuyệt đối control ↔ lượt tải bị nhiễu
  2 biến (boot + build) — ghi rõ, không giấu.
- **N1 đổi preview.tsx giữa control và lượt tải:** mtime 09:08:07Z,
  md5 `c4198206` → **`03bf029f`** (+1.335 byte; fix E4 steady-close
  của N1 — xem `round112-n1/prereg-n1.md`). Đổi xảy ra TRONG lúc
  dial s72 lần 1, TRƯỚC khi probe s72 phát (probe ghi
  mtimeBefore=mtimeAfter=`03bf029f`) — nên s72 lần 1 KHÔNG phải lượt
  "lai" theo nghĩa prereg §4 (md5 ổn định trong lượt), mà là lượt
  sạch trên build mới; chỉ tiếc là dữ liệu của nó mất ở bước trích
  kết quả (xem §8). Mọi lượt tải còn lại đều chạy trọn trên
  `03bf029f` ổn định trước/sau (mtimeChanged=false cả 4 lượt).
  Không có lượt "lai" nào trong N5. N1 không sửa thêm sau 09:08:07Z
  (md5 cuối vẫn `03bf029f` lúc 10:11:06Z).
- **Lock vite tranh chấp cả đợt:** s72 lần 1 DEFERRED 1 lần
  (acquire bị reboot giết, không phải timeout thật — log ghi "hết
  900 s" sau 15 s vì tiến trình acquire con bị giết cùng reboot;
  thông điệp log này gây hiểu lầm, xem §0 ghi chú); retry s72 chờ
  lock n3 ~360 s rồi n1 cướp lock ngay khi n3 nhả (poll 5 s vẫn bỏ
  lỡ cửa — n1 poll trúng trước); s70 chờ n3 ~300 s; s71 chờ ngắn;
  s73 lấy lock ngay. Tổng thời gian chờ lock ~15 phút trong lượt.
  Vite lock stale của N5 sau reboot đã được nhả tay (release đúng
  owner thread n5-round112) để n3 tiếp tục — không xóa lock của
  luồng khác.
- **ENOSPC — 0 lần:** vite config thêm `server.watch.ignored:
  ["**/**"]` + CFG_DIR riêng /tmp/round112-n5; mọi vite lên ngay
  attempt 1.
- **RAM thấp trong lúc phát nặng:** freeMB tối thiểu lúc phát: s74
  1931 / s73 839 / s71 863 / s70 686 / s72 545 (lần 1) và 545 (lần
  retry, theo loadAtPlay). Không lần nào OOM hay dừng sớm vì RAM.
- **Tải nền của luồng đợt 112 khác:** n1/n3 chạy probe song song
  (vite xen kẽ, freeze-run nclips 24) — tải sibling có trong
  sampled mean (đó là tải probe thực sự chịu; ghi rõ, không tách).

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0, offset nhãn − kỳ vọng)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-s74 | stripes-code-blur | control, không hog | — | **1,65** (n=15) | 10,9 | **841** | 12,35 | 184 | **0** (−1..+3) | 97,6% | **GIỮ** |
| chr-code-blur-s73 | stripes-code-blur | [2, 3,5] | ĐẠT 20 s (2,67) | **0,91** (n=17) | 18,2 | **121** | 1,60 | 88 | **+2** (−1..+8) | 47,1% | TRUNG-GIAN |
| chr-code-blur-s71 | stripes-code-blur | [8, 15] | KHÔNG ĐẠT 300 s (vọt 27, xả hog 40 → 4, load cuối 16,41) | **9,59** (n=15) | 7,3 | **283** | 4,36 | 121 | **0** (−1..+3) | 84,1% | **GIỮ** |
| chr-code-blur-s70 | stripes-code-blur | [5, 8] | KHÔNG ĐẠT 300 s (vọt 23,32, xả hog còn 12) | **18,2** (n=17) | 21 | **159** | 2,19 | 98 | **+1** (−1..+20) | 58,5% | TRUNG-GIAN |
| chr-code-blur-s72 | stripes-code-blur | [15, 30] | ĐẠT 150 s (22,54) — lần retry; lần 1 ĐẠT 270 s (21,27) nhưng mất dữ liệu | **28,38** (n=32) | 49,2 | **30** | 0,24 | 49 | **+2** (−1..+37) | 43,3% | TRUNG-GIAN (không hợp lệ: n<50) |

- **Control s74 (build c4198206, boot #42):** 841 tick, GIỮ —
  validate dụng cụ phát-dài: nclips=20 không tự nó làm hỏng offset
  (97,6% trong ±1, gần bằng r69 100%). Caps bão hòa ở c2 như dự báo
  prereg §2 (c0:54, c1:39, c2:91) — caps KHÔNG phải metric chính.
- **s73 (build 03bf029f, boot #43):** dial ĐẠT nhanh (20 s, 2,67)
  nhưng load sụt còn sampled mean 0,91 lúc phát (mẫu M7 r65 lặp
  lại: dial 2,21 → phát 0,93) — mà offset vẫn tệ (trung vị +2).
  Xem §4.
- **s71 (build 03bf029f):** lượt GIỮ ở tải cao nhất từ trước tới
  nay trong chuỗi load-break (vượt L4 3,19 và M7 1,87). Off dải
  −1..+3, 0% ≤ −2.
- **s70 (build 03bf029f):** TRUNG-GIAN hợp lệ (159 tick). Off dải
  −1..+20 (1 tick +20 — nhảy ahead sau stall ngắn).
- **s72 (build 03bf029f):** lần retry 30 tick — dưới ngưỡng 50 nên
  KHÔNG dùng một mình để đóng khoảng (prereg §4). Cửa sổ cần để đủ
  50 tick: **208,7 s (~70 clip)** ở tick rate 0,24/s.
- **Không lượt nào GÃY** (0% ≤ −2 ở cả 5 lượt — mọi lượt đều có
  fracLeNeg2 = 0,0%).

## §2. Bar (a) — điểm gãy: VẪN MỞ; biên GIỮ nay là 9,59

- **Điểm GIỮ:** s71 (sampled mean load1 9,59, 283 tick, trung vị
  offset 0, 84,1% trong ±1 → GIỮ) — và s74 control (1,65, 841 tick,
  97,6% → GIỮ, nhưng trên build cũ c4198206 nên chỉ dùng để
  validate dụng cụ, không dùng để đóng khoảng cùng các lượt tải
  trên build mới). Trên cùng build 03bf029f, điểm GIỮ cao nhất là
  **9,59** (s71).
- **Không có điểm GÃY:** không lượt nào <50% trong ±1 với trung vị
  ≤ −2. Lượt TRUNG-GIAN hợp lệ duy nhất trên build mới là s70
  (18,2; 58,5% trong ±1, trung vị +1) — lệch DƯƠNG, không phải dạng
  gãy trễ âm.
- **Không đóng được khoảng (A, B]:** chỉ có GIỮ, không có GÃY →
  điểm gãy (nếu có) nằm trên 9,59. So với M7 (giữ tới 1,87): biên
  GIỮ tăng ~5× nhờ phát dài tích đủ tick — nhưng đây là tiến bộ của
  DỤNG CỤ ĐO, không phải bằng chứng sản phẩm tốt hơn (build cũng
  đã đổi; s74 trên build cũ giữ tới 1,65 với 97,6%).
- **Dạng gãy "trễ âm" của K4 không tái hiện lần nữa:** r56 K4 vẫn
  là điểm tham chiếu duy nhất cho dạng trễ âm. Trên build mới, ở
  tải tới 28,38, presented lệch DƯƠNG (trung vị 0..+2), không âm.

## §3. Bar (b) — load1 EMA ~60 s có đủ để dự báo không: KHÔNG ĐỦ (thêm bằng chứng mạnh)

- **Không đơn điệu:** phân loại theo sampled mean load1: 0,91 →
  TRUNG-GIAN; 1,65 → GIỮ; 9,59 → GIỮ; 18,2 → TRUNG-GIAN; 28,38 →
  TRUNG-GIAN (không hợp lệ). Lượt tải thấp nhất (s73, 0,91) tệ hơn
  lượt tải cao gấp 10× (s71, 9,59). Dải load1 của GIỮ (1,65–9,59)
  và TRUNG-GIAN (0,91–28,38) chồng lấn hoàn toàn → tiêu chí prereg
  §3 Bar (b) KHÔNG thỏa ("ĐỦ" cần dải tách biệt). **load1 không dự
  báo được phân loại lượt.**
- **Dial vẫn không điều khiển được load1:** s72 lần 1 ĐẠT ở 270 s
  (21,27) rồi load chạy tiếp tới 44 lúc phát; s70 KHÔNG ĐẠT 300 s
  (vọt 0,5 → 23,32, xả hog 40 → 12); s71 KHÔNG ĐẠT (vọt 0,6 → 27,
  xả hog 40 → 4, load cuối dial 16,41, phát ở 9,59); s73 ĐẠT 20 s (2,67) rồi sụt còn
  0,91 lúc phát. Cả 4 lượt đều xác nhận: "ĐẠT" lúc dial không giữ
  được tới lúc phát; chỉ sampled mean TRONG LÚC PHÁT mới là số tải
  thật (như M7). Throttle nhấp nháy theo pha ~2–5 phút: siết sâu
  (load1 0,4–0,5 với 40 hog) rồi nhả đột ngột (vọt 20–27 trong
  ~10–20 s).
- **Hệ quả:** muốn đo điểm gãy phải phân nhóm hậu kiểm theo sampled
  mean thật (như N5 đã làm) và chấp nhận rằng dải mục tiêu chỉ là
  ý định dial, không phải mức tải đo được.

## §4. Dị thường s73 — TRUNG-GIAN ở tải thấp nhất (phân tích, không kết luận vội)

- **Số liệu:** s73: dial [2,3,5] ĐẠT 20 s (2,67); sampled mean
  load1 lúc phát **0,91** (n=17, median 0,86, max 1,42) nhưng
  load5 mean **6,6** (load lúc phát 1,42 / load5 7,49 / load15
  9,28 — tải đang DECAY từ mức cao); threadsR mean 18,2;
  **121 tick, tick rate chỉ 1,60/s** (so với control s74 12,35/s
  ở load1 1,65); pump `skip-stale-frame` 60/149 (**40,3%**);
  off trung vị **+2**, 47,1% trong ±1, dải −1..+8; off ≥ +2 chiếm
  52,9%.
- **Diễn giải có cơ sở nhất:** pump đói trong lúc load đang decay
  — load1 EMA thấp (0,91) che giấu backlog: load5 6,6 + threadsR
  18,2 + tick rate 1,6/s đều chỉ ra renderer vẫn đói CPU trong
  lúc phát, và skip-stale-frame 40,3% sinh offset dương (cơ chế
  §7). Cùng mẫu với r65 của M7 (dial 2,21 → phát 0,93, trung vị
  +2, 35,3% trong ±1, skip-stale cao) — r65 cũng là lượt "tải thấp
  nhưng offset tệ" và M7 cũng quy cho throttle + sibling burst.
- **Caveat không loại trừ được:** s73 chạy trên build mới
  `03bf029f` (fix E4 steady-close của N1), còn control s74 chạy
  trên build cũ `c4198206`. Hai biến (build + trạng thái decay)
  thay đổi cùng lúc nên **không tách được** hiệu ứng build khỏi
  hiệu ứng tải bằng dữ liệu N5. Fix của N1 chạm luật đuôi/pause
  (tailDriftGate), không chạm trực tiếp đường blend/pump — nhưng
  presented được tính từ playhead nên không thể khẳng định bằng
  0. **Luồng sau cần 1 lượt control không tải trên build
  `03bf029f`** để kiểm xem build mới tự nó có làm offset tệ đi
  không (như M7 đã làm với r69 cho build c4198206).
- **Hệ quả cho Bar (a):** s73 TRUNG-GIAN không phải là bằng chứng
  "gãy ở tải thấp" — nó là bằng chứng load1 (EMA) không mô tả
  được trạng thái đói thật của pump trong lúc phát (xem §3).

## §5. Bar (c) — metric thay thế: KHÔNG CÓ METRIC NÀO TÁCH ĐƯỢC

- **threads-R:** s73 threadsR mean 18,2 ở load1 0,91; s71 threadsR
  7,3 ở load1 9,59; s70 threadsR 21 ở load1 18,2; s72 threadsR 49,2
  ở load1 28,38. threadsR bám theo số hog đang sống + sibling,
  không bám CPU thật được cấp (như M7). Không đề xuất thay load1.
- **Tick rate (blendTick/giây tường):** 12,35 (s74) / 1,60 (s73) /
  4,36 (s71) / 2,19 (s70) / 0,24 (s72) — KHÔNG đơn điệu theo tải
  (s73 thấp hơn s71 dù tải thấp gấp 10×). Tick rate phản ánh đói
  pump tức thời (throttle phase + sibling burst), không phải mức
  tải EMA. Không đề xuất làm metric chính; chỉ dùng để tính cửa sổ
  cần thiết (§6).
- **Playhead ratio (media/wall):** 0,881 / 0,792 / 0,924 / 0,827 /
  0,479 — s72 thấp nhất (0,479) và tệ nhất, nhưng s73 (0,792)
  TRUNG-GIAN trong khi s74 (0,881) GIỮ và s70 (0,827) TRUNG-GIAN
  — không tách sạch GIỮ/TRUNG-GIAN. Chỉ cho thấy media clock chậm
  lại dưới tải nặng.
- **offset100 (metric phụ §5 prereg, CHỈ MÔ TẢ):** s74 n=444 trung
  vị +1, 56,3% trong ±1; s73 n=82 trung vị +3, 18,3%; s71 n=177
  trung vị +2, 30,5%; s70 n=116 trung vị +3, 14,7%; s72 n=26 trung
  vị −0,5, 15,4%, 11,5% mẫu ≤ −5 (3/26 — lượt duy nhất có mẫu trễ
  sâu, nhưng n=26 quá nhỏ). offset100 KHÔNG phân loại được GIỮ/
  TRUNG-GIAN (control chỉ 56,3% trong ±1, tệ hơn rVFC 97,6%) —
  đúng như đăng ký trước: nền nhiễu ±3 do sai số pha lấy mẫu 100
  ms. **Erratum prereg §5 (phát hiện qua s74, sửa TRƯỚC khi phân
  tích lượt tải):** công thức clip = min(2, floor(ph/3)) trong
  prereg chỉ đúng với nclips=3 (M7); với nclips=20 nó đọc nhầm
  snapshot c2 đã dừng (pres kẹt ~89) trong khi expected tính từ
  ph tiếp tục tăng → offset100 trung vị −608,5 (vô nghĩa). Đã sửa
  analyzer dùng clip thật = floor(ph/3) (0..19); ý định "snapshot
  của clip ĐANG PHÁT" không đổi. Số offset100 trong LIMITS này đã
  dùng công thức sửa; số hiệu chuẩn M7 trong prereg §5 (r69 75,3%
  trong ±1) không bị ảnh hưởng vì nclips=3.
- **state100 bị đói theo:** số mẫu state100 thực tế / danh nghĩa
  (cadence 100 ms × thời gian sampler sống, từ lúc cài tới lúc trích
  kết quả): s74 1099/~1480 (74%); s72 retry 229/~2500 (9%); s70
  222/~1130 (20%); s71 244/~940 (26%); s73 195/~1210 (16%) —
  interval 100 ms tự nó bị đói dưới tải (main thread starved).
  Mọi metric lấy mẫu theo tường-đồng-hồ đều mất mẫu dưới tải nặng
  — đó là lý do metric chính phải là rVFC event-driven.
- **Kết luận Bar (c):** không đề xuất metric thay thế nào.

## §6. Tích đủ tick — phương pháp phát dài: hiệu quả tới ~18, hết hiệu lực ở ~28

- Tick rate theo sampled mean load1 (rVFC, blendTick/giây tường):
  12,35/s @1,65 → 4,36/s @9,59 → 2,19/s @18,2 → 0,24/s @28,38
  (s73 ngoại lệ: 1,60/s @0,91 — xem §4). Sụp siêu tuyến tính:
  tăng tải 1,65 → 28,38 (×17) làm tick rate sụp ×51.
- **Cửa sổ cần để đủ 50 tick (tính từ tick rate đo được):**
  s71: 11,5 s (đã đủ với 60 s); s70: 22,8 s (đã đủ); s73: 31,3 s
  (đã đủ); s72: **208,7 s (~70 clip)** — phát 60 s chỉ được 30
  tick. Muốn đo điểm gãy ở tải ~28 bằng probe này cần nclips≈70
  (210 s phát), tức mỗi lượt ~4–6 phút phát + rủi ro stall/trích
  kết quả tăng theo (xem §8). Phát dài là đáp án đúng hướng nhưng
  **không mở rộng được tới tải rất nặng** nếu không sửa thêm dụng
  cụ (trích kết quả theo đợt / metric không phụ thuộc mật độ tick).
- **So với M7 (9 s phát):** cùng dải tải, N5 tích được gấp ~5×
  tick (r67 30 → s71 283 ở load ~9–21; r66 36 → s70 159 ở load
  ~8–18). Nhờ đó mới có điểm GIỮ hợp lệ đầu tiên trên 5 (s71) và
  lượt TRUNG-GIAN hợp lệ đầu tiên trên 10 (s70).

## §7. Cơ chế lệch dương — skip-stale-frame (bằng chứng pump)

- Tỉ lệ pump `skip-stale-frame` và tỉ lệ off ≥ +2 theo lượt:
  s74: 19,7% skip → 2,4% off≥+2; s71: 21,8% → 15,9%; s70: 36,6%
  → 41,5%; s73: 40,3% → 52,9%; s72: 37,7% → 56,7%. Hai tỉ lệ
  bám nhau chặt: pump bỏ qua frame stale rồi presented nhảy ahead
  (offset dương). Đây là cơ chế sinh offset dương dưới tải, không
  phải lỗi nhãn. (M7 đã thấy mẫu này ở r65: skip-stale 9/22 —
  đính chính M9 — và trung vị +2.)
- Tag cross-check (draw vs tick) suy giảm dưới tải: tagAgree
  s74 1142/2031 (56%) → s72 63/555 (11%) — nguồn draw của sampler
  cũng đói theo main thread; chỉ dùng blendTick (nguồn tick) để
  phân loại, như M7.

## §8. Bar (d) + (e) — quan hệ với gate v2 L5; mẫu lỗi CDP/project-load; lỗi dụng cụ mới

- **Gate v2 (Bar d):** điều kiện gate v2 (load1 ≥ ~8 VÀ load5 ≥ ~8
  ở 2 mẫu liên tiếp) ĐẠT trong lúc phát ở s71 (GIỮ), s70 và s72
  (TRUNG-GIAN) — cả GIỮ lẫn TRUNG-GIAN đều đạt gate. **Đạt gate v2
  không suy ra presented GIỮ** (như M7). Quan hệ là mô tả.
- **Mẫu lỗi CDP/project-load (Bar e): 0 lần** trong 5 lượt hoàn
  thành (kể cả s72 ở load1 sampled mean 28,38, max 46,98). Probe
  frame-parity (playwright launch trực tiếp) sống sót ở tải mà
  harness E1 chết (L5 run26/run28) — không suy rộng sang E1.
- **Lỗi dụng cụ (a) — trích kết quả timeout (s72 lần 1, mất dữ
  liệu):** lượt phát xong hoàn toàn (playhead tới 59,8 sau ~350 s
  tường, loadSamples n=71) nhưng bước trích kết quả
  (`evalTimeout(..., 60000)`) timeout sau 60 s → exit=2, KHÔNG
  ghi frame-parity-results.json (chỉ có error + log). Nguyên nhân
  có thể: payload trích quá lớn sau lượt phát dài (state100 danh
  nghĩa ~3500 mẫu + caps px 96×54 mỗi cap + pump/tick/draws) gặp renderer đói
  (freeMB ~674 lúc đó). Lần retry (146 s tường) trích thành công.
  **Hệ quả phương pháp:** phát càng dài, trích càng nặng — cần sửa
  dụng cụ trước khi chạy nclips≈70 (trích theo đợt / tăng timeout
  trích / giảm payload), nếu không lượt dài sẽ mất dữ liệu đúng
  lúc cần nhất. Đây là nợ cho luồng sau, không sửa trong N5 (đổi
  instrument giữa chừng sẽ làm mất tính so sánh được).
- **Lỗi dụng cụ (b) — playhead kẹt ở biên clip (s72 lần 1):**
  playhead kẹt cứng ở **20,9667** (ngay trước biên clip 21,0 s =
  clip c7) từ ~09:15:43Z tới ~09:19:0xZ (**~3,5 phút**) trong khi
  load1 đã sụt từ ~44 về ~2,3 — kẹt KHÔNG tự hồi khi tải giảm, rồi
  tự hồi không rõ nguyên nhân và phát tiếp tới cuối (tổng 340 s
  tường). Nghi là seek chuyển clip bị đói decoder, nhưng vì
  playhead kẹt cả khi tải đã giảm nên có thể là watchdog/seek của
  app không hồi — cần luồng riêng chẩn đoán (không phải phạm vi
  N5). Lần retry không kẹt (146 s tường, tỉ lệ 0,48) — stall không
  tái hiện lần 2 liên tiếp.
- **Không gặp mẫu lỗi CDP/project-load nào** trong cả lần 1 (đã
  phát xong, chỉ mất bước trích).

## §9. Kiểm chứng (cây cuối, md5 03bf029f)

- `tsc --noEmit` (apps/web): **0 lỗi** (10:10:54Z, trên build
  03bf029f — cây đã gồm fix N1).
- `vite build`: **pass (6,18 s)** (10:11:06Z, trên build 03bf029f).
- Không sửa production trong luồng này (N1 sửa lúc 09:08:07Z, trước
  mọi lượt tải); không push GitHub; không release/tag; không TTS 39;
  không birefnet. preview.tsx md5 cuối `03bf029f09b8890b285eacc10a02172b`.
- Probe copy `probe112n5-frame-parity.mjs`: node --check PASS trước
  lượt đầu; diff với probe111m7 chỉ 2 dòng SCRATCH/CFG_DIR.
- Analyzer `analyze112n5.py` (trong `hidden_files/round112-n5/`,
  không stage): tính lại toàn bộ từ results json thô; kết quả khớp
  bảng §1 (đếm lại từ đĩa, không tin mù log driver).

## §10. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng).** Đã có điểm GIỮ hợp
   lệ ở sampled mean 9,59 (s71, 283 tick, 84,1% trong ±1 — trên
   build 03bf029f); không có điểm GÃY nào (tải tới 28,38 vẫn không
   trễ âm). s70 TRUNG-GIAN hợp lệ ở 18,2 (159 tick); s72 ở 28,38
   chỉ 30 tick, cần ~70 clip mới đủ 50. Đợt sau: chạy nclips≈70 ở
   tải ~28 (SAU KHI sửa trích kết quả, xem mục 3), hoặc tìm metric
   presented không phụ thuộc mật độ tick rVFC.
2. **Dị thường s73 cần 1 lượt control trên build mới:** chạy
   control không tải (nclips=20, stripes-code-blur) trên build
   `03bf029f` để tách hiệu ứng build N1 khỏi hiệu ứng tải-decay.
   Tới lúc đó, không dùng s73 để kết luận gì về build.
3. **Trích kết quả timeout sau phát dài (s72 lần 1):** sửa dụng cụ
   trước khi chạy lượt dài hơn (trích theo đợt / tăng timeout /
   giảm payload state100+caps). Lượt phát càng dài càng dễ mất dữ
   liệu ở bước cuối.
4. **Playhead kẹt ~3,5 phút ở biên clip dưới tải (s72 lần 1):**
   cần luồng riêng chẩn đoán (seek chuyển clip / watchdog) — kẹt
   cả khi tải đã giảm, không tái hiện lần 2.
5. **Dial tải bằng hog vẫn không điều khiển được load1** (xem §3):
   đừng tin "dial ĐẠT" — chỉ tin sampled mean TRONG LÚC PHÁT.
6. **Load1 không dự báo được phân loại lượt** (xem §3): GIỮ và
   TRUNG-GIAN chồng lấn hoàn toàn theo load1. Cần chỉ số đói pump
   tức thời hơn nếu muốn dự báo (vd tỉ lệ skip-stale-frame trong
   lúc phát — chỉ là ứng viên, chưa đăng ký bar).
7. **Gate v2 không suy ra presented GIỮ** (đạt ở cả s71 GIỮ lẫn
   s70/s72 TRUNG-GIAN).
8. **offset100 không dùng được để phân loại** (nền nhiễu ±3; xem
   §5 + erratum công thức clip).
9. Các nợ ngoài phạm vi N5 (giữ nguyên từ LIMITS gộp đợt 111 §10):
   G1 deinterlace (chờ user quyết), mù #22/#28/#29 (chờ user
   quyết), E4 (N1 đang sửa — cơ chế mới m1f4; fix steady-close đã
   vào build 03bf029f lúc 09:08:07Z, chưa có verdict mới từ N1),
   ring 8 MiB cần thêm lượt, quyết bar CDP, ngưỡng WebKit ≤60 ms
   cần 1 lượt yên thật, postboot-check đã cập nhật lên boot #43
   (N1), ENOSPC (vite nối tiếp bắt buộc; watch.ignored giữ),
   birefnet (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
   ci-security.yml 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 112 N5)

- `apps/web/scripts/probe112n5-frame-parity.mjs` — probe copy
  probe111m7 (chỉ đổi SCRATCH → round112-n5, CFG_DIR →
  /tmp/round112-n5; node --check PASS; diff chỉ 2 dòng đó).
- `docs/PHASE9_ROUND112_N5_LOADBREAK_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round112-n5/` (không stage): prereg-n5.md,
  driver112n5.sh + driver112n5.log, runner112n5.sh +
  runner112n5.out (chạy lại sau reboot #43), analyze112n5.py +
  .txt/.json, vcut-vite-lock-frozen.sh (bản copy đóng băng của
  vcut-vite-lock.sh, md5 khớp repo), probe112n5-frame-parity.mjs
  (bản sao lưu), hog-load-chr-code-blur-s72/-s72-retry/-s70/-s71/
  -s73.txt (sampler driver 5 s), 5 thư mục lượt probe s74/s72/s70/
  s71/s73 (mỗi thư mục có frame-parity-results.json + .log +
  vite-attempt1.log; s72 còn frame-parity-error.txt của lần 1),
  hog-count.txt.
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).
