# PHASE9_ROUND112_N4_F6P60MS_LIMITS — F6' WebKit: chốt ngưỡng ≤60 ms bằng 1 lượt yên thật + label-at-capture (mô phỏng offline)

> Luồng N4, đợt 112, lượt cron 15:35 +07 14/11/2026 (bắt đầu 08:40Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — push qua API
> như các đợt trước).
> Nợ LIMITS gộp đợt 111 §10 mục 8 (từ M5 đợt 111): (a) 1 lượt yên thật trên
> fixture mới để chốt ngưỡng WebKit ≤60 ms; (b) label-at-capture — đo lại
> bằng chính fixture mới để so sánh (b) trước/sau.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào (chỉ N1
> được sửa preview.tsx đợt này — N4 không đụng). Không đụng TTS 39,
> birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính (4 ý):**
> 1. **Ngưỡng WebKit ≤60 ms: GIỮ (chốt theo quy tắc prereg).** Lượt yên Q1
>    cho tickCost median **58,0 ms** (n=537) — ≤60 theo đúng quy tắc đăng
>    ký trước. NHƯNG biên chỉ 2 ms và tải nền trôi lên giữa lượt (xem
>    caveat §1) — verdict này MỎNG, cần 1 lượt yên xác nhận ở vòng sau
>    trước khi coi ≤60 là đã vững.
> 2. **Label-at-capture LÀM XẤU nhãn — KHÔNG đề xuất (A) với định nghĩa
>    này.** Mô phỏng offline trên lượt yên Q1 + đối chứng chéo M5 N1:
>    skp=1, % lag==0 sụp từ 72,2% → 15,9% (Q1) và 79,5% → 41,8% (N1);
>    mean|lag| tăng 0,56f → 1,34f (Q1). Cơ chế đã rõ: nhãn hiện tại ĐÃ
>    đi trước labelCt ~1 frame (frame = floor(labelCt×30)+1 trong 73%
>    ca) nên cộng thêm trễ label→snap (~50 ms) là overshoot +1..+2 frame.
> 3. **(b) unique-match trên lượt yên tái hiện gần hệt M5 N1:** skp=1
>    n=126 median 0f max +4f; skp=0 n=532 median 1f max +4f; nomatch
>    0/658; (c2) 3 ca lag 1f; KHÔNG ghost stale sau seek, KHÔNG lag ≥+5f.
> 4. **F6' vẫn đứng trên nhãn + cây hiện tại:** (1)/(2) 63/63 (skp=1) và
>    266/266 (skp=0), 0 ứng viên ghost label==presented. Bar F6' KHÔNG
>    cần định nghĩa lại — vì (A) không được đề xuất nên ngữ nghĩa nhãn
>    không đổi; ghi rõ điều kiện "nếu (A) làm thật thì bar phải định
>    nghĩa lại" để vòng sau khỏi áp dụng bar cũ cho nhãn mới.

## 0. Môi trường đo + prereg + cây đo

- **Boot trong lúc đo: 2026-11-14 08:05:10Z (reboot #42, sau #41
  06:53:26Z; gap #41→#42 = 1h11'44").** Postboot-check PASS hai lần:
  N7 check1 lúc ~08:41Z + N4 chạy lại `vcut-webkit-postboot-check.sh`
  (không --repair) lúc ~08:42Z — wrapper K1 PASS, libs đủ
  (libevent/libEGL/libavif/libdw/libevdev), GST hệ thống 269 file
  (thư mục thật apt, không phải symlink debroot), isomp4 + libav đủ,
  apt đủ 10 package. WebKit launch được, decode mp4 đủ.
- **Prereg:** `hidden_files/round112-n4/prereg-n4.md` — viết TRƯỚC lượt
  đo, đăng ký: định nghĩa lượt yên, quy tắc quyết định ngưỡng (median
  ≤60 → giữ; median >60 → hiệu chuẩn lại, KHÔNG tự nâng ngưỡng),
  định nghĩa + công thức mô phỏng label-at-capture, tiêu chí diễn giải
  trước/sau (đổi % lag==0 >10 điểm % = tệ hơn rõ).
- **Cây đo `c4198206…`** (= cây M5 đợt 111, fix E4 của M1). preview.tsx
  md5 `c4198206cb916c0f1c6d8996330335a1` kiểm trước/sau lượt đo — KHÔNG
  ĐỔI (c4198206 → c4198206). N4 không sửa production.
- **Fixture `stripes-nonperiodic.mp4` còn trên đĩa, md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5** (cả public/ lẫn
  hidden_files/round111-m5). Không cần gen lại. GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng nguyên vẹn từ round111-m5.
  Mp4 là binary local-only, KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb :193 (probe tự chọn display trống; :195 đang bị N7 giữ lúc đó).
  Env launch GST như M5/L7.
- **RAM khả dụng:** 1089 MB lúc bắt đầu lượt, 2059 MB lúc kết thúc.
  Birefnet KHÔNG chạy (RAM dưới ngưỡng guard).

### 0.1 Lỗi poll tự đếm chính mình — đã vá trong poll-n4.sh

- Poll lần 1 (08:45:49Z, MAXPOLL=1) báo `blockers=1` dù không có
  process nào khác: nguyên nhân là pattern grep trong poll script chứa
  chuỗi trần `WebProcess` — process `grep -E` của chính poll script tự
  khớp pattern của nó (các phần `[v]ite`/`[p]robe104f3`/… đã có bracket
  trick nên không tự khớp, riêng `WebProcess` trần thì có).
- N4 vá `poll-n4.sh` thêm `grep -v "grep -E"` vào pipeline blockers;
  poll lại 08:47:39Z cho `blockers=0` và cửa yên mở ngay poll 1.
- Lưu ý cho vòng sau: mẫu poll của M5/L7 mang cùng lỗi (+1 blocker
  giả thường trực). Với M5 nó không đổi kết quả (blockers thật luôn
  ≥5), nhưng mọi luồng dùng mẫu này nên vá tương tự — nếu không, cửa
  yên sẽ không bao giờ mở khi máy thật sự yên.

## 1. Lượt yên Q1 — ngưỡng WebKit ≤60 ms: GIỮ (biên mỏng 2 ms)

### 1.1 Lượt yên có thật không?

| Điều kiện gate (prereg) | Lúc bắt đầu probe 08:47:45Z | Lúc kết thúc 08:49:06Z |
|---|---|---|
| load1 < 2 | 1,34 ✓ | 4,11 ✗ |
| load5 < 2 | 1,04 ✓ | 2,08 ✗ |
| vite.lock luồng khác | không ✓ | không ✓ |
| blocker process | 0 ✓ | — (vite N4 tự chạy) |

- Gate ĐẠT lúc bắt đầu (poll 1, 08:47:39Z: load1=1,37 / load5=1,04,
  lock=không, blockers=0). Theo prereg, đây là lượt yên (gate định
  nghĩa tại lúc bắt đầu).
- **NHƯNG tải nền trôi lên giữa lượt:** load1 1,34 → 4,11, load5 1,04 →
  2,08 trong 81 giây probe. Bằng chứng tải ngoài: luồng N6 chạy phân
  tích blind30 đúng trong cửa sổ này (file `blind30-hole-outside.txt`
  08:47, `blind30-gap747-outside.txt` 08:49, `blind30-gap747-births.txt`
  08:51). Tải này KHÔNG phải của probe N4 (vite + WebKit + Xvfb của
  N4 cũng góp phần — như M5 N1 cũng kết thúc ở 4,06/4,02 — nhưng phần
  tăng thêm trùng thời gian với N6).
- Hệ quả: median 58,0 ms dưới đây có thể đã bị thổi lên so với lượt
  yên hoàn toàn sạch. Ghi rõ, không giấu.

### 1.2 Số đo tickCost Q1 vs các lượt trước (cùng định nghĩa: median toàn lượt)

| Lượt | Fixture | Tải | tickCost median | p90 | max | tBlend gap median | BlendTick/pass | rAF/pass median |
|---|---|---|---|---|---|---|---|---|
| L7 yên (đợt 110) | tuần hoàn | 0 hog, gate yên | **40,5** | 64,9 | 94 | 77 | 19,5 | — |
| N1 (M5) | không tuần hoàn | 0 hog, chưa thật yên (load5 3,58) | **50,0** | 80,1 | 115 | 92 | 22,2 | 34 |
| **Q1 (N4)** | **không tuần hoàn** | **0 hog, gate yên lúc bắt đầu, tải trôi lên giữa lượt** | **58,0** | **79,0** | **121** | **96** | **21,9** | **34** |
| K7 tải (đợt 109) | tuần hoàn | tải luồng khác | **66,0** | 103,5 | 194 | 112 | 20,3 | — |
| N2 (M5) | không tuần hoàn | 1 hog | **86,0** | 105,0 | 271 | 122 | 17,1 | 27 |
| N3 (M5) | không tuần hoàn | 3 hog | **167,0** | 253,2 | 520 | 279 | 10,2 | 20 |

- Q1: tickCost total n=537, median **58,0**, p90 79,0, max 121, min 28;
  hậu flip+2000ms n=394, median 57,0. tBlend gap n=436, median 96,0,
  p90 121,0, max 1289. BlendTick/pass 21,9; rAF/pass median 34
  (min 30, max 40). pageErrs [].
- **Verdict theo quy tắc prereg (median ≤60 → giữ): GIỮ ngưỡng ≤60 ms.**
  Với n=6 lượt hiện có, ≤60 ms cho qua đúng 3 lượt yên (40,5; 50,0;
  58,0) và chặn đúng 3 lượt tải (66,0; 86,0; 167,0). Biên yên↔tải nay
  là 58,0 → 66,0 (8 ms, hẹp hơn biên 50,0 → 66,0 lúc M5 đề xuất).
- Phụ chứng p90 ≤90 ms: Q1 p90 79,0 ≤90 ✓ — vẫn tách đúng lượt yên
  này khỏi 3 lượt tải (p90 103,5 / 105,0 / 253,2).
- **Caveat (ghi rõ, không giấu):** (i) biên chỉ 2 ms (58,0 vs 60);
  (ii) tải trôi lên giữa lượt (§1.1) nên 58,0 có thể cao hơn median
  của lượt yên hoàn toàn sạch — nói cách khác, ngưỡng ≤60 có thể
  đang được "cứu" bởi chính sự nhiễm tải nhẹ, hoặc ngược lại, lượt
  sạch hơn có thể cho ~50 ms như N1; không phân biệt được từ 1 lượt
  này; (iii) hiệu chuẩn từ n=6 lượt, trong đó 2 lượt cũ dùng fixture
  khác. **Khuyến nghị: 1 lượt yên xác nhận ở vòng sau (chờ máy thật
  yên cả lượt, không luồng khác chạy phân tích nặng) trước khi coi
  ≤60 là đã vững.** Theo prereg, KHÔNG tự siết tiếp xuống ~55 ms chỉ
  từ 1 lượt này (dù median ≤45 ms cũng không siết — và Q1 cũng không
  đạt ≤45).

## 2. Label-at-capture (mô phỏng offline) — LÀM XẤU nhãn, KHÔNG đề xuất (A)

### 2.1 Định nghĩa + dữ liệu đầu vào (đăng ký trước trong prereg)

- label-at-capture (mô phỏng) = nhãn ghost SẼ có nếu nhãn được gán tại
  thời điểm snapshot pixels capture xong (snapMs) thay vì tại thời
  điểm gán nhãn hiện tại (labelMs).
- Công thức: `label' = floor(((labelCt + (snapMs − labelMs)/1000) mod
  3.0) × 30) mod 90` (video 3 s, 30 fps, loop). Giả định: currentTime
  chạy 1:1 theo wall giữa label và snap (đúng khi không seek/stall
  trong ~50 ms đó).
- Cơ sở dữ liệu: JSON probe ghi cho mỗi ghost `labelMs`, `labelCt`,
  `snapMs`, `frame`. Kiểm tra trên Q1: `snapCt` LUÔN null (0/874) nên
  không dùng được trực tiếp; `labelCt` luôn có (874/874).
- Khoảng label→snap trên Q1: `snapMs − labelMs` median **50 ms**,
  p90 73 ms, max 118 ms, min 26 ms (n=874). Trên M5 N1: median 37 ms,
  p90 76 ms, max 95 ms.
- **Phát hiện về cơ chế (đo trước khi mô phỏng):** trên Q1,
  `frame − floor(labelCt×30)` = **+1 trong 639/874 (73%)**, 0 trong
  235 ca — tức nhãn hiện tại ĐÃ đi trước labelCt ~1 frame (khớp M5
  N1: +1 trong 609/888, 69%). Nhãn không phải là "frame tại labelCt"
  mà đã là frameIdx tính ở thời điểm muộn hơn labelCt một chút.
- Script mới: `analyze-n4-labelcapture.py` (chỉ đọc JSON + GT frames,
  không sửa production). Chạy trên JSON Q1 + JSON M5 N1 làm đối chứng
  chéo. Lát cắt: tick hậu flip+2000ms, viaRvfc=0, tách skp=1/skp=0;
  lag = M − label, lag' = M − label', M là frame match duy nhất
  (|M|==1). Ghost stale sau seek (label 0, M≥60) báo cáo riêng —
  Q1 và N1 đều có 0 ca.

### 2.2 Kết quả trước/sau — cả hai dataset đều xấu đi ở skp=1

| Dataset / skp | n (b) | % lag==0 TRƯỚC → SAU | mean\|lag\| TRƯỚC → SAU | median TRƯỚC → SAU | max dương TRƯỚC → SAU | Dịch label'−label |
|---|---|---|---|---|---|---|
| Q1 skp=1 | 126 | **72,2% → 15,9% (−56,3 điểm %)** | 0,56f → 1,34f | 0f → −1f | +4f → +3f | 0:+23, +1:59, +2:44 |
| Q1 skp=0 | 532 | 23,5% → 17,1% (−6,4) | 1,50f → 1,32f | 1f → 1f | +4f → +4f | 0:151, +1:309, +2:70, +3:2 |
| N1 skp=1 (đối chứng) | 122 | **79,5% → 41,8% (−37,7 điểm %)** | 0,44f → 0,89f | 0f → 0f | +3f → +2f | 0:54, +1:50, +2:17, +3:1 |
| N1 skp=0 (đối chứng) | 526 | 25,5% → 23,4% (−2,1) | 1,39f → 1,28f | 1f → 1f | +4f → +3f | 0:222, +1:239, +2:63, +3:2 |

Phân phối (b) Q1 skp=1: trước {0:91, <0:5, 1–2:17, 3–4:13} → sau
{<0:82, 0:20, 1–2:21, 3–4:3} — khối lag 0 sụp, khối lag âm phình ra.
Q1 skp=0: trước {1–2:264, 0:125, 3–4:86, <0:57} → sau {<0:161, 0:91,
1–2:254, 3–4:26} — khối 3–4f thu hẹp (tốt) nhưng khối âm phình (xấu),
ròng mean|lag| chỉ cải thiện 0,18f trong khi % lag==0 vẫn giảm.

- **Verdict theo tiêu chí prereg (% lag'==0 giảm >10 điểm % = tệ hơn
  rõ): label-at-capture LÀM XẤU nhãn — KHÔNG đề xuất (A) với định
  nghĩa này.** Ở skp=1 (lát cắt chính của bar F6'), mức xấu đi là
  −56,3 điểm % (Q1) và −37,7 điểm % (N1) — vượt xa ngưỡng 10 điểm %,
  tái hiện ở cả hai dataset độc lập. Ở skp=0 có cải thiện nhỏ về
  mean|lag| (−0,18f / −0,11f) nhưng % lag==0 vẫn giảm, max dương
  không cải thiện (Q1: +4f → +4f) — không đủ để cứu kết luận.
- Cơ chế (đã có bằng chứng, không phải suy đoán): nhãn hiện tại đã đi
  trước labelCt ~1 frame (§2.1); cộng thêm trễ label→snap (~50 ms ≈
  1,5 frame) đẩy label' lên +1..+2 frame so với pixels thật — overshoot
  có hệ thống. Trễ dương tối đa chỉ giảm 4f → 3f (1 frame), trong khi
  56–73% occurrence bị đẩy sang lag âm.
- **Giới hạn của kết luận này (ghi rõ):** mô phỏng chỉ kiểm định nghĩa
  "nhãn = currentTime lúc snap". Nó KHÔNG kiểm định nghĩa khác —
  "nhãn = frame đã giải mã thật trong canvas" (anchor theo frame đã
  giải mã thay vì currentTime) — định nghĩa đó mới chạm được decode
  lag (nhãn chạy trước pixels tới −58f lúc tải nặng, M5 §2.2), trong
  khi cả nhãn hiện tại lẫn label-at-capture đều dẫn xuất từ
  currentTime nên đều không chạm được decode lag. Nếu vòng sau muốn
  nhãn tốt hơn thì phải đi hướng anchor-theo-frame-đã-giải-mã, không
  phải label-at-capture theo currentTime. Nợ (A) theo nghĩa hẹp
  (label-at-capture theo currentTime) coi như ĐÃ ĐO XONG, kết quả là
  không đáng làm; nợ theo nghĩa rộng (nhãn theo frame đã giải mã)
  vẫn mở.
- snapCt luôn null (0/874 Q1, 0/888 M5 N1): production không ghi
  currentTime lúc snap — nếu vòng sau muốn đo label-at-capture trực
  tiếp thay vì mô phỏng thì phải ghi snapCt trước đã (thay đổi nhỏ
  trong đường capture, nhưng vẫn là sửa production — chỉ N1 hoặc
  luồng được giao mới làm).

## 3. (b) unique-match + F6' trên lượt yên Q1 (kiểm lại, không đóng lại)

### 3.1 (b) tái hiện gần hệt M5 N1

| Lát cắt (b) | Q1 (lượt yên này) | N1 M5 (0 hog, chưa thật yên) |
|---|---|---|
| skp=1: n / nomatch | **126/126 (100%), 0** | 122, 0 |
| skp=1: median / p90 / max / min | 0f / 2f / **+4f** / −1f | 0f / 2f / +3f / −12f* |
| skp=0: n / nomatch | **532/532 (100%), 0** | 526, 0 |
| skp=0: median / p90 / max / min | 1f / 3f / **+4f** / −10f | 1f / 3f / +4f / −15f |
| (b) lag ≥+5f / ≥+10f (cả 2 skp) | **0 / 0** | 0 / 0 (loại stale-seek) |
| (c2) đáng ngờ thật | 3 ca, đều lag **1f** (seq 218, 284, 351: presented 15/16/15, label 14/15/14) | 4 ca, đều lag 1f |
| ghost stale sau seek (label 0 / pixels 67–76) | **0** | 0 |

\* N1 skp=1 min −12f là 1 ghost decode-lag đơn lẻ; Q1 skp=1 min −1f
(lượt yên sạch hơn, không có decode lag sâu — phù hợp kỳ vọng).
- Tổng (b) Q1: 658 occurrence, tất cả match duy nhất 1 frame, nomatch
  0 — fixture + pipeline GT hoạt động đúng trên lượt yên mới.
- Trễ dương thông thường max vẫn +4f (133 ms) như M5 — không có cụm
  lag lớn mới; (c2) vẫn chỉ là nhãn trễ 1 frame so với presented
  (pixels đúng là presented, nhãn trễ 1f), không phải ghost thật.

### 3.2 F6' trên cây + fixture mới (lượt yên)

| | Q1 | N1 (M5) |
|---|---|---|
| nTick skp=1 hậu flip+2000ms (cần ≥30) | **63** | 61 |
| (1) nhãn: tick KHÔNG chứa ghost==presented | **63/63 (100%)** | 61/61 (100%) |
| (2) pixel-verified: tick KHÔNG vi phạm thật | **63/63 (100%)** | 61/61 (100%) |
| ứng viên ghost label==presented | 0 strip | 0 strip |
| (1)/(2) skp=0 (đối chứng) | 266/266 (100%) | — |
| presented−expected \|gap\|≤3 | 329/329 (100%, đều =0) | 324/324 (100%) |

- Bar (1)/(2) đạt 100%, n=63 ≥30 — nhất quán với K7/L7/M5. (2) vẫn là
  hệ quả của (1) (0 ứng viên) — bằng chứng pixel độc lập thực sự nằm
  ở (b) §3.1, như M5 đã kết luận.
- **F6' vẫn ĐÃ ĐÓNG từ L7 — N4 không đóng lại, không mở lại.**
- Nhãn ghost vẫn nhiễu (cấu trúc, không đổi): clean distinct skp=1
  9/39 (23,1%), skp=0 20/135 (14,8%); mọi occurrence skp=1 91/125
  (72,8%), skp=0 125/520 (24,0%) — cùng bậc với M5 (skp=1 ~80%,
  skp=0 ~26–43%). Nhãn không đáng tin nhưng bar (1) vẫn đứng vì skip
  dựa trên nhãn; bar pixel (2) cần (b) để độc lập (nay đã có, §3.1).

### 3.3 Bar F6' có cần định nghĩa lại không? — KHÔNG (lúc này)

- Bar (1)/(2) hiện tại đo trên nhãn HIỆN TẠI (frameIdx từ currentTime
  lúc gán nhãn). Vì (A) label-at-capture KHÔNG được đề xuất (§2.2) nên
  ngữ nghĩa nhãn không đổi → bar không cần định nghĩa lại.
- **Điều kiện ghi rõ cho vòng sau:** NẾU một ngày nào đó (A) — hay bất
  kỳ cơ chế đổi thời điểm/nguồn gán nhãn nào — được làm thật thì bar
  F6' phải định nghĩa lại trước khi đo (nhãn đổi ngữ nghĩa, không tự
  áp dụng bar cũ), như M5 §9.2 đã cảnh báo. Định nghĩa lại lúc đó phải
  bao gồm cả cách tính lag' và ngưỡng % lag'==0, không chỉ (1)/(2).

## 4. Đo phụ: gStd spread + trail/edge (chẩn đoán, không vào bar)

Trên Q1 (fixture sọc hẹp — các metric này KHÔNG so được trực tiếp với
L7/K7 sọc rộng, chỉ ghi số như M5 §6):

| | Q1 | N1 (M5) |
|---|---|---|
| gStd spread cửa sổ đã vẽ: median / max / nGroups | 11,2 / 41,4 / 61 | 8,9 / 45,6 / 71 |
| gStd spread + presented: median | 9,3 | 7,9 |
| nSkipped (mẫu loại khỏi nhóm) | 246 | 272 |
| trailMax / trailFramesGt0 | 8 / 166 | 7 / 158 |
| edgeLMed / edgeRMed (px) | 2,2 / 0,7 | 2,2 / 0,7 |
| edgeLMax / edgeRMax (px) | 144,7 / 241,2 | 208,5 / 237,0 |
| pause gStd (t=0,5/1/1,5) | 115,6 / 114,6 / 116,6 | ~115,6 / 114,6 / 116,6 |

- Cùng bậc với M5 N1 — không có hồi quy. Pause baseline khớp L7 (~115)
  — blur gốc vẫn đúng. Spread 11,2 (so với 0,6 của L7) + trailMax 8 +
  edgeMax ~145–241 px là độ nhạy của METRIC với sọc hẹp (M5 §6 đã giải
  thích), không phải lỗi blend. Không kết luận gì thêm từ các metric này.

## 5. Kiểm chứng hồi quy (cây đo `c4198206…`, sau lượt đo)

- `tsc` apps/web (`npx --no-install tsc --noEmit`): **exit 0** (log
  trống — sạch; chạy 08:54Z).
- `ghostBlend.probe.test.ts`: **15/15 PASS** (10 kiểm chứng + 5 mask
  R1 đợt 90), chạy bằng `node --experimental-strip-types` từ gốc repo
  như header file hướng dẫn (log `ghostblend-n4.log`).
  - Ghi rõ sự cố thao tác: N4 chạy thử `npx vitest run` trước và nhận
    `No test suite found` — file này KHÔNG phải vitest suite (nó là
    probe Node thuần với `process.exitCode`), vitest là runner sai.
    Chạy lại đúng cách → 15/15. Không phải lỗi sản phẩm.
- `vite build` (config gốc): KHÔNG chạy lại đợt này — M5 đã chạy PASS
  11,40s trên cùng cây `c4198206…` đợt 111, N4 không sửa production
  (md5 không đổi), nên build không cần chạy lại; ghi rõ để khỏi hiểu
  là đã chạy.
- preview.tsx md5 `c4198206…` không đổi trong suốt lượt đo + hồi quy.
- Không sửa file production nào.

## 6. Sự cố hạ tầng trong lúc đo (đã xử lý, không mất dữ liệu)

1. **Poll tự đếm chính mình (§0.1):** đã vá, cửa yên mở ngay sau đó.
2. **Tải nền trôi lên giữa lượt (§1.1):** N6 chạy phân tích blind30
   đúng trong cửa sổ probe (08:47–08:51) — không phải lỗi, chỉ là
   cạnh tranh CPU giữa các luồng đợt 112; ghi rõ ảnh hưởng tới
   verdict ngưỡng (§1.2).
3. **Hai lệnh tsc song song va nhau (08:54Z):** N4 vô tình phát 2 lệnh
   tsc giống hệt cùng lúc; một lệnh bị abort khi service restart,
   lệnh còn lại chạy xong exit 0. Không ảnh hưởng cây đo (md5 kiểm
   lại không đổi). Bài học: không chạy 2 lệnh nặng giống nhau song
   song trong cùng một lượt.
4. **Không có reboot trong lúc đo** (boot #42 suốt lượt). Lock vite
   acquire 1 lần thành công ngay (không chờ), nhả sạch: kill-vite
   pid node 8781 chết, ps sạch, curl :5184 = 000. Không vite mồ côi.

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND112_N4_F6P60MS_LIMITS.md` — file này. **File duy
  nhất trong repo mà N4 thay đổi** (probe copy + analyzer + dữ liệu đo
  đều ở hidden_files; mp4 fixture ở public/ là binary local-only đã
  có từ M5, KHÔNG stage, md5 không đổi).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round112-n4-f6p60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
  - Ghi rõ về yêu cầu "LIMITS + probe script" trong task giao: probe
    N4 dùng là bản copy NGUYÊN VẸN của M5 (đã vá expectCx từ M5, md5
    `a690d8285c57929c0e8ed0d7ed5d7af9`), không đổi một dòng — không có
    file probe mới nào trong repo để stage. Analyzer mới
    `analyze-n4-labelcapture.py` nằm ở hidden_files (ngoài repo, theo
    tiền lệ M5/L7: analyzer + dữ liệu đo ở lại hidden_files, đủ để
    kiểm chứng lại). Batch 1 file LIMITS là đúng tiền lệ.
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round112-n4/`
  (prereg-n4.md, probe104f3-ghost-k7.webkit.mjs [copy M5],
  analyze-n4-{labellag,skiplatest,tickcost}.py [copy M5],
  analyze-n4-labelcapture.py [MỚI] + analyze-n4-labelcapture-q1-n1.txt,
  b.json, vite.n4-temp.config.mjs, vcut-vite-lock-n4.sh [bản copy đóng
  băng, md5 fd21193c…], run-n4.sh, poll-n4.sh, poll-n4.log,
  chain-n4.log, run-webkit-q1.log, vite-5184-n4-q1.log,
  preview-b-f3-flip-webkit-q1.json (2,8 MB),
  analyze-n4-{skiplatest,labellag,tickcost}-q1.txt,
  tsc-n4.log, ghostblend-n4.log).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền
  lệ M5/L7).
- Cờ xong: `hidden_files/round112-n4-done` (tạo SAU KHI LIMITS + batch
  xong).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ theo prereg, nhưng MỎNG — cần 1 lượt yên
   xác nhận ở vòng sau** (chờ máy thật yên cả lượt, không luồng khác
   chạy phân tích nặng). Nếu lượt xác nhận cho median ≤45 ms thì biên
   an toàn lớn (không tự siết xuống ~55 chỉ từ 1–2 lượt); nếu lượt xác
   nhận >60 ms thì hiệu chuẩn lại theo quy tắc prereg (không tự nâng
   ngưỡng sau khi thấy số).
2. **(A) label-at-capture theo currentTime: ĐÃ ĐO XONG, KHÔNG đáng làm**
   (§2.2). Không đề xuất làm (A) với định nghĩa này. Nợ theo nghĩa rộng
   (nhãn theo frame đã giải mã thật) vẫn mở — đó mới là hướng chạm
   được decode lag.
3. **Nhãn ghost vẫn nhiễu (cấu trúc):** clean distinct skp=1 23,1% /
   skp=0 14,8% trên lượt yên. Muốn nhãn tốt hơn phải đổi cơ chế
   anchor/label (vd anchor theo frame đã giải mã) — không phải chờ
   máy yên.
4. **Poll script tự đếm chính mình (§0.1):** mẫu poll M5/L7 mang lỗi
   +1 blocker giả (pattern `WebProcess` trần). Vòng sau vá mẫu chung
   (thêm `grep -v "grep -E"` hoặc bỏ `WebProcess` trần khỏi pattern).
5. **snapCt luôn null:** nếu vòng sau muốn đo label-at-capture trực
   tiếp (không mô phỏng) thì phải ghi snapCt trong đường capture trước
   — đó là sửa production, chỉ luồng được giao mới làm.
6. **Nợ khác đứng yên theo LIMITS gộp đợt 111 §10:** G1 + mù #22 +
   mù #28 + mù #29 chờ user quyết; E4 cơ chế mới m1f4 (M1 đợt 111) +
   quyết đóng có điều kiện; quyết bar CDP; ring 8 MiB cần thêm lượt;
   điểm gãy tải cần tích đủ tick; postboot-check cập nhật lên #41 —
   N4 ghi nhận boot hiện tại đã là **#42 (08:05:10Z)**, N7 đang cập
   nhật script; birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml
   403; release gate không đổi. Reboot #42 (gap #41→#42 = 1h11'44")
   đã qua, apt replay đủ (postboot PASS) — không còn nợ infra từ
   reboot này.
