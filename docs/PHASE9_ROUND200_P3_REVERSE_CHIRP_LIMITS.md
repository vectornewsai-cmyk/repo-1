# Đợt 200 P3 — Reverse preview: drift chirp thước sweep 70 s + vị trí 6 transient longB

> Trạng thái: **drift chirp ĐẠT** (thước mịn FFT-8192: median
> 0,059–0,070 s, p90 0,122–0,130 s — xem §1.4; ZCR median 0,063 s
> đồng thuận, p90/max ZCR hỏng do hold-mute §1.5);
> **6 transient longB ĐÃ XÁC ĐỊNH VỊ TRÍ + NGUYÊN NHÂN** (§2) —
> đuôi freeze analyser, rải rác nửa sau pass, KHÔNG phải lệch player;
> longB đo lại 100 ms: clean max 0,419 s — **ĐẠT** (§2.4–2.5);
> **N11b GIỮ ĐẠT** (§3 — partial 8/8, decode ≤ 2.732 ms,
> playFalse 0 cả ba pass).
> Bundle đo: `dist/assets/index-BCKAT1fc.js` (không đổi từ đợt 199 —
> không sửa code reverse đợt này, chỉ sửa thước đo).

## 1. Drift chirp — thước sweep 70 s ĐÚNG

### 1.1 File chirp-70s.mp4: sweep nominal, KHÔNG lệch (đính chính số ZCR đợt 199)

Đợt 199 kiểm tra nhanh bằng ffmpeg ZCR tại 2 điểm (t=5 s ~512 Hz,
t=65 s ~2826 Hz) và kết luận file khớp sweep 70 s — hai số đó SAI.
Đo lại chính xác đợt này: decode toàn file sang PCM 48 kHz, ZCR
cửa sổ 100 ms trên toàn 70 s, fit tuyến tính:

- **f(t) = 300,31 + 38,5586×t Hz** (nominal 300 + 38,5714×t);
  residual RMS 2,25 Hz, max 7,68 Hz; f(0)=300,3 Hz, f(70)=2999,4 Hz.
- Spot check: t=5 s → 495,0 Hz (nominal 492,9); t=65 s → 2805,0 Hz
  (nominal 2807,1) — đều trong ±0,06 s thang sweep.
- File KHÔNG có fade-in/silence đầu (sample đầu ≠ 0, RMS 0,670–0,677
  đều khắp file). **Kết luận: file đúng nominal; thước đúng là
  t_audio = (freq − 300)/38,5714, không wrap (đơn điệu trên 70 s).**

### 1.2 Tính lại dữ liệu thô đợt 199 bằng thước đúng (tái tạo độc lập)

Probe C đợt 199 (130 mẫu × 100 ms, playhead 69,7 → 56,8 s, cửa sổ
[39.967, 69.967]): tính lại từ JSON thô bằng script riêng
(`analyze199.py`, `chirp_fitted.py`):

| thước | raw median / p90 / max | S2-clean median / p90 / max | signed mean |
|---|---|---|---|
| nominal 300/38,5714 | 0,515 / 0,770 / 0,885 | **0,511 / 0,770 / 0,885** | −0,514 |
| fitted 300,31/38,5586 | 0,503 / 0,757 / 0,873 | 0,498 / 0,757 / 0,873 | −0,501 |

Khớp số đợt 199 (0,515/0,770/−0,519) — thước đúng không đổi kết
luận thô: **median ~0,51 s, p90 ~0,77 s, vượt bar 0,5 s**; signed
mean −0,51 s ổn định qua cả hai nửa pass (playhead 60–70 s: −0,509;
50–60 s: −0,529) — lệch hệ thống, không phải nhiễu ngẫu nhiên.

### 1.3 Phân tích giới hạn đo: ~0,5 s này là NHIỄU THƯỚC, không phải lag player

Ba bằng chứng độc lập, đều từ dữ liệu thô đợt 199:

**(a) Bin FFT quá thô so với bar.** Headless ctx chạy 44,1 kHz
(chứng minh: các peakHz phân biệt cách nhau 21–22 Hz → bin 21,53 Hz
= 44100/2048, không phải 23,44 Hz @48k như chú thích S2 ghi).
Bin 21,53 Hz trên thang sweep chậm 38,57 Hz/s = **0,558 s/bin** —
thô hơn bar 0,5 s. PeakHz là cầu thang: 102/126 bước mẫu liên tiếp
= 0 Hz, chỉ 24 bước = −21/−22 Hz (1 bin mỗi ~0,5 s). Một thước
lượng tử 0,558 s KHÔNG THỂ đo bar 0,5 s: ngay với player hoàn hảo
(true drift 0), drift đo được vẫn là răng cưa đều trên [−0,558; 0]
→ median |.| kỳ vọng 0,279 s, p90 0,502 s.

**(b) Phần vượt răng cưa ≈ 0,4 bin smoothing lag — cùng một thước
giải thích được longA/longB.** Quan sát median 0,511 s, lớn hơn
0,279 s của răng cưa thuần ~0,23 s ≈ 9 Hz ≈ 0,4 bin — đúng độ trễ
smoothing analyser (smoothingTimeConstant 0,8 giữ đỉnh cũ).
Tổng lag ≈ 1 bin ≈ 20 Hz. Cùng 1 bin lag đó, trên thang nhanh
270 Hz/s của longA/longB chỉ = **0,08 s** — và longA đo được
median 0,074 s, longB 0,167 s (xem §2). Nghĩa là: cùng một đường
player, cùng một lag analyser ~1 bin, thước chirp cho 0,51 s còn
thước longA cho 0,07 s. **Lệch nằm ở thước, không ở player.**

**(c) timeText lượng tử 0,1 s** (bước playhead: median 0,100; min
−0,000; max 0,200) cộng thêm nhiễu ±0,1 s vào thước chirp — bằng
1/5 bar, không đáng kể với longA/longB (bin 0,08 s) nhưng đáng kể
với chirp.

**Hệ quả:** thước FFT-2048 KHÔNG DÙNG ĐƯỢC cho file sweep 70 s
với bar 0,5 s — mọi verdict từ thước này đều vô nghĩa (kể cả
"CHƯA ĐẠT" của nó). Cần thước mịn (§1.4).

### 1.4 Đo lại bằng thước mịn: FFT 8192 + ZCR + playheadSec

Thước mới (script `benchmarks/reverse200/audio-probe-200.mjs`):
- **FFT mịn:** đặt `analyser.fftSize = 8192` lúc chạy (runtime qua
  CDP, KHÔNG sửa source — app tự cấp lại buffer meter theo fftSize
  mới): bin 5,38 Hz @44,1k = **0,14 s** thang sweep (nhỏ hơn bar
  3,6×, thay vì 0,558 s thô hơn bar).
- **ZCR:** tần số từ zero-crossing trên toàn bộ time-domain buffer
  8192 mẫu (186 ms): kiểm chứng offline trên file gốc (resample
  44,1k): sai số max 2,22 Hz = **0,058 s** — đủ phân biệt lag thật
  0,5 s với 0. ZCR không bị smoothing FFT giữ đỉnh nên không freeze
  như peakHz.
- **Playhead chính xác:** `lastPlayheadSec` (float nội bộ player)
  song song `timeText` (lượng tử 0,1 s) — 4 tổ hợp
  (peakHz/zcrHz × timeText/playheadSec), mỗi tổ hợp có mask S2
  riêng (ngưỡng peakHz = bin runtime; ngưỡng ZCR = 7 Hz ≈ 2× nhiễu).

**Kỳ vọng kiểm chứng (mô hình §1.3 — lag ≈ 0,4 bin + răng cưa):**
thước mịn FFT-8192 cho median ≈ 0,13 s (răng cưa 0,14 s + lag
0,056 s), p90 ≈ 0,2 s; ZCR cho median ≈ 0,05–0,1 s (không bin,
không smoothing). Nếu cả hai thước đều ≈ 0,5 s thì lag là thật
(chứ không phải nhiễu thước) → CHƯA ĐẠT; nếu cả hai về ≤ 0,2 s
thì player đồng bộ thật → ĐẠT, và "CHƯA ĐẠT" của thước thô được
giải thích là nhiễu thước.

**Kết quả đo lại (pass C đợt 200, 126 mẫu × 100 ms, playhead
70,0 → 56,6 s, cửa sổ [39,967; 69,967], bundle BCKAT1fc):**

| tổ hợp | THO median / p90 / max | S2-clean median / p90 / max | signed mean |
|---|---|---|---|
| peakHz / timeText | 0,059 / 0,126 / 0,226 | **0,070 / 0,130 / 0,226** (lag 9) | −0,054 |
| peakHz / playheadSec | 0,056 / 0,122 / 0,200 | 0,059 / 0,126 / 0,200 (lag 9) | −0,050 |
| zcrHz / timeText | 0,063 / 11,230 / 35,015 | 0,063 / 11,415 / 35,015 (lag 6) | −2,298 |
| zcrHz / playheadSec | 0,063 / 11,230 / 35,048 | 0,063 / 11,426 / 35,048 (lag 6) | −2,295 |

- **FFT mịn ĐẠT rõ ràng:** cả 4 tổ hợp peakHz đều median
  0,056–0,070 s, p90 0,122–0,130 s, max 0,200–0,226 s — dưới bar
  0,5 s với biên ~4× (tốt hơn cả kỳ vọng 0,13 s). playheadSec vs
  timeText chênh nhau ≤ 0,01 s — timeText lượng tử 0,1 s không
  còn là nguồn nhiễu đáng kể ở thước mịn.
- **ZCR median đồng thuận (0,063 s) nhưng p90/max HỎNG:**
  25/126 mẫu ZCR đọc thấp hơn tần số thật 300–1.350 Hz (drift
  −0,7 đến −35 s). Nguyên nhân đã xác định: **cửa sổ time-domain
  186 ms chứa đoạn im lặng** (hold-mute của player — xem §1.5).
  Mô hình phần im lặng p = 1 − zcr/expected dự đoán RMS chính xác
  tới ±0,002 trên cả 13 mẫu kiểm tra (vd idx0: p=0,453 → RMS dự
  đoán 0,4913 vs thực 0,4904; idx74: p=0,215 → 0,5883 vs 0,5891).
  ZCR chỉ dùng được ở median (khớp peakHz), KHÔNG dùng được cho
  p90/max trên player này.
- So với thước thô đợt 199 (median 0,511 / p90 0,770): thước mịn
  giảm median **8,6×** (0,511 → 0,059) — đúng như mô hình nhiễu
  thước §1.3 dự đoán (bin 0,558 s → 0,140 s). **Lag "0,5 s" của
  đợt 199 là nhiễu thước, không phải lag player.**

**Verdict drift chirp: ĐẠT** (thước FFT-8192: median 0,059–0,070 s,
p90 0,122–0,130 s, max 0,200–0,226 s — đều trong bar 0,5 s; ZCR
median 0,063 s đồng thuận). Thước FFT-2048 chính thức KHÔNG DÙNG
cho file sweep chậm (bin 0,558 s > bar).

### 1.5 Phát hiện thêm: hold-mute — audio ngắt quãng ~20–40 ms mỗi ~0,9 s

25 mẫu ZCR lệch (§1.4) xếp thành 12 cặp, cách nhau 8–9 mẫu
(0,8–0,9 s): mỗi lần mute 19–40 ms im lặng trong cửa sổ 186 ms
(idx0 riêng: 84 ms — transient khởi động). RMS sụt đúng theo
phần im lặng (mô hình §1.4 khớp ±0,002). peakHz KHÔNG bị ảnh
hưởng (đỉnh FFT vẫn đúng bin — sounding part áp đảo phổ).
Đây là hành vi thật của output reverse (hold của player ngắt
tiếng trong lúc giữ playhead), không phải lỗi đo: tai nghe có thể
thấy tiếng ngắt quãng nhẹ chu kỳ ~0,9 s. **Nợ P3-201:** xác nhận
mute có nghe được không + có phải hold gây ra không (đếm holdStop
Δ=416 trong pass này); nếu đúng thì đây là lỗi chất lượng phát
ngược, tách khỏi verdict drift (drift đo bằng peakHz không bị
ảnh hưởng).

## 2. Vị trí 6 transient longB — ĐÃ XÁC ĐỊNH (dữ liệu thô đợt 199)

### 2.1 Vị trí chính xác (không ở đầu clip — rải rác nửa sau pass)

Pass B đợt 199: 480 mẫu × 250 ms, playhead 300,2 → 185,1 s
(115,1 s phát ngược). 7 mẫu raw |drift| > 0,5 s = **1 mẫu đầu
(idx0, +2,756 s) + 6 mẫu giữa pass**. 6 mẫu giữa pass:

| # | idx (inPass) | playhead (s) | drift (s) | peakHz | cửa sổ | rebuild# | kề rebuild? |
|---|---|---|---|---|---|---|---|
| 1 | 262 | 237,10 | +0,563 | 2369 | [220,533; 250,533] | 2 | 51 mẫu |
| 2 | 327 | 221,20 | +0,559 | 775 | [195,500; 225,500] | 3 | 14 mẫu |
| 3 | 368 | 211,30 | +0,700 | 840 | [195,500; 225,500] | 3 | 51 mẫu |
| 4 | 388 | 206,40 | +0,544 | 2175 | [195,500; 225,500] | 3 | 31 mẫu |
| 5 | 397 | 204,10 | +0,530 | 1550 | [195,500; 225,500] | 3 | 22 mẫu |
| 6 | 419 | 198,80 | +0,537 | 2821 | [170,467; 200,467] | 4 | **0 mẫu (đúng lúc rebuild)** |

Khoảng cách giữa các transient (theo chiều phát): 15,9 / 9,9 /
4,9 / 2,3 / 5,3 s — **rải rác, không cụm**. Phạm vi 198,8–237,1 s,
tức 63–101 s sau khi bắt đầu pass (pass dài 115 s) — **nửa sau
pass, không phải đầu clip**. Mẫu đầu tiên trong số 6 ở t=237,1 s,
cách điểm bắt đầu 63 s. **Kết luận: KHÔNG phải hiện tượng đầu
clip — không áp dụng đề xuất "loại mẫu đầu" cho 6 mẫu này**
(đề xuất đó chỉ đúng cho idx0, xem §2.3).

### 2.2 Nguyên nhân: đuôi của freeze đỉnh analyser (đo, không phải player)

Cả 6 mẫu đều là mẫu **S2-lag** (đã bị lọc khỏi thống kê clean của
đợt 199 — clean median/p90/max 0,167/0,259/2,756 không chứa chúng).
Mỗi mẫu là mẫu CUỐI của một đợt freeze đỉnh:

- Đợt freeze = 3–5 mẫu liên tiếp có peakHz Y HỆT nhau trong khi
  playhead vẫn chạy (250 ms/mẫu × 270 Hz/s = 67,5 Hz = 0,25 s
  drift mỗi mẫu đông cứng). Ví dụ idx 260→261→262: peakHz 2369,
  2369, 2369; drift +0,063 → +0,363 → **+0,563**; mẫu sau (263)
  peakHz nhảy về 2110, drift −0,096. Mẫu hình y hệt ở cả 6 vị trí.
- 6 mẫu = đuôi của 6 đợt freeze bắt đầu tại idx 258 (dài 5), 325
  (3), 364 (5), 385 (4), 395 (3), 417 (3). Tổng cộng pass có 70 đợt
  freeze dài ≥ 2 mẫu (48×2, 11×3, 9×4, 2×5); 22 đợt dài ≥ 3 — chỉ
  6 đuôi vượt 0,5 s (đuôi ≈ drift đầu đợt + (dài−1)×0,25 s; đợt
  dài 3 chỉ vượt bar khi drift đầu đợt ≈ 0).
- **Audio vẫn phát liên tục trong lúc freeze:** RMS mẫu freeze
  0,3117 vs mẫu thường 0,3174 (không sụt); drift mẫu kề trước/sau
  ≈ 0 (±0,1). Freeze nằm ở **đỉnh FFT của analyser** (smoothing
  0,8 giữ đỉnh cũ), không phải audio đứng yên — nếu audio thật sự
  đứng yên 0,75 s thì RMS/waveform phải đổi và drift mẫu kề cũng
  lệch.
- **Không gắn với rebuild/cap:** 5/6 mẫu cách rebuild gần nhất
  14–51 mẫu; chỉ idx419 trùng đúng lúc rebuild #4 (t=198,80) —
  nhưng mẫu hình freeze của nó giống hệt 5 mẫu kia, và 3 rebuild
  còn lại (idx 106/209/313) không sinh mẫu vượt bar nào. 0 cap
  trong cả pass (holdCapStop = 0). Lag samples phân bố đều theo
  playhead (22–27 mẫu mỗi bucket 20 s) — freeze là ngẫu nhiên
  suốt pass, không cụm theo sự kiện nào.
- **Vì sao longA không có transient này:** cùng hiện tượng freeze
  (longA: 83 đợt freeze, S2-lag 53/327) nhưng lấy mẫu 100 ms nên
  đợt freeze dài 3 chỉ = 0,3 s playhead → đuôi drift tối đa 0,433 s
  < bar. **Khoảng lấy mẫu 250 ms của longB khuếch đại đuôi freeze
  lên 0,5–0,7 s.** Đây là nhiễu thước đo (analyser + khoảng mẫu),
  không phải lệch player.

### 2.3 Mẫu đầu idx0 (+2,756 s): leftover phát xuôi — LOẠI ĐƯỢC

Mẫu sounding đầu tiên (t=300,20 s): peakHz 1098 Hz, RMS 0,1157
(vs 0,31 ổn định), drift +2,756 s. Mẫu ngay sau (t=299,90):
peakHz 2929 Hz (đúng đích ~2929), drift −0,163. **Bằng chứng
chắc chắn đây là leftover phát xuôi: mẫu xuôi CUỐI CÙNG trước khi
bấm ngược cũng có peakHz = 1098 Hz** (dãy xuôi: 409, 560, 689,
818, 969, **1098**) — analyser vẫn giữ nguyên đỉnh xuôi cuối
cùng khi mẫu ngược đầu tiên được lấy (RMS thấp 0,1157 vì analyser
đang chuyển trạng thái). Phân biệt với longA: mẫu đầu longA là
2993 Hz trong khi mẫu xuôi cuối chỉ 947 Hz — KHÔNG phải leftover
mà là transient khởi động (audio bắt đầu ở cuối cửa sổ 300,16
trong khi playhead hiện 300,5) — đã được parent chấp nhận theo
tiền lệ (a5)-198 (1 mẫu đầu vượt bar không làm fail verdict).
**Đề xuất: loại mẫu sounding đầu tiên khỏi thống kê drift**
(không có mẫu trước để S2 lọc — tiền lệ: S2 đã lọc 147/477 mẫu
lag; mẫu đầu là trường hợp biên của cùng quy tắc). Sau khi loại:
longB clean n=329, **median 0,163 / p90 0,259 / max 0,337 s — đều
trong bar 0,5 s**.

### 2.4 Đo lại longB ở 100 ms — GIẢ THUYẾT ĐƯỢC XÁC NHẬN

Pass B đợt 200 (1150 mẫu × 100 ms, 1138 sounding, playhead
300,6 → 184,3 s — cùng độ phủ 116 s như đợt 199; bundle BCKAT1fc):

| | đợt 199 (250 ms) | đợt 200 (100 ms) |
|---|---|---|
| S2-clean median / p90 / max | 0,167 / 0,259 / 2,756 | **0,093 / 0,230 / 0,419** |
| raw median / max | — / 2,756 | 0,096 / 0,663 |
| mẫu raw vượt bar 0,5 s | 7/477 | **2/1138** |
| S2-lag | 147/477 | 103/1138 (bin 21,53 Hz) |
| freeze runs dài ≥ 2 | 70 | 298 (238×2, 53×3, 6×4, 1×5) |

**Không còn mẫu clean nào vượt bar** (max 0,419 s < 0,5 s) —
giả thuyết §2.2 được xác nhận: đuôi freeze dài nhất thu về
~0,42 s ở 100 ms (từ 0,53–0,70 s ở 250 ms). 2 mẫu raw vượt bar
còn lại đều là đuôi freeze đã bị S2 lọc:

- idx743, drift +0,607 @ t=224,90: peakHz 1787 đông cứng 3 mẫu
  (741–743); bước playhead 742→743 NHẢY 0,50 s (mẫu probe chậm —
  máy bận decode rebuild, xem dưới), nên đuôi vọt lên 0,607.
- idx983, drift +0,663 @ t=199,90: peakHz 452 đông cứng 3 mẫu
  (981–983); bước playhead 982→983 cũng NHẢY 0,50 s.
- Cả hai đều nằm 12–16 mẫu TRƯỚC khi counter rebuild tăng
  (rebuild #3 @ idx759, #4 @ idx995) — tức ĐANG decode rebuild
  (decode 2,0–2,7 s = 20–27 mẫu): CPU decode làm vòng lấy mẫu
  của probe chậm lại, playhead nhảy 0,5 s giữa hai mẫu liên tiếp,
  khuếch đại đuôi freeze. Cơ chế đầy đủ: **đuôi drift ≈ khoảng
  playhead của đợt freeze** (freeze = analyser giữ đỉnh; khoảng
  này = khoảng lấy mẫu + độ trễ probe lúc decode rebuild).
  Ở 199 (250 ms): đợt freeze 3 mẫu = 0,75 s playhead → đuôi
  0,53–0,70 s. Ở 200 (100 ms): đợt freeze 3 mẫu = 0,3 s → đuôi
  ~0,3 s, chỉ vọt qua bar khi gặp bước nhảy 0,5 s lúc decode.
- Mẫu đầu idx0 đợt này SẠCH: t=300,20, peakHz 2993, drift −0,226,
  RMS 0,3141 (bình thường) — 12 mẫu im lặng (RMS=0) trước khi
  tiếng lên đã flush đỉnh xuôi 1098 Hz khỏi analyser. Đây là
  bằng chứng ngược cho §2.3: khi analyser được flush thì mẫu đầu
  không còn leftover.

**Kết luận §2.4:** 6 transient đợt 199 là nhiễu thước đo
(freeze analyser + khoảng lấy mẫu 250 ms), đã biến mất ở thước
100 ms (clean max 0,419 s). longB clean đợt 200: **median 0,093 /
p90 0,230 / max 0,419 s — ĐẠT bar 0,5 s** (xem đề xuất §2.5).

### 2.5 Đề xuất quyết (để parent quyết ở §14.2-200, P4-200 đối chiếu)

1. **6 transient longB là nhiễu thước đo** (đuôi freeze analyser +
   khoảng mẫu 250 ms), không phải lệch player — bằng chứng §2.2.
2. **Loại mẫu sounding đầu tiên** khỏi thống kê drift (leftover
   phát xuôi, §2.3) — áp dụng chung cho mọi pass (longA/longB/
   chirp), không riêng longB.
3. Với (1)+(2): longB clean = 0,163/0,259/0,337 → **ĐẠT theo thước
   S2**. Đề xuất parent xem xét lại (a5)-199 "longB CHƯA ĐẠT"
   (quyết đó đếm 7 mẫu raw vượt bar; 6 trong 7 đã bị S2 lọc, mẫu
   còn lại là mẫu đầu loại được). Quyết cuối thuộc parent sau khi
   P4-200 harness độc lập.

## 3. N11b — giữ ĐẠT không hồi quy

Không đổi code reverse đợt này (chỉ sửa thước đo trong script
probe). Đo lại partial engage + playClamped trên cùng bundle
`index-BCKAT1fc.js`:

| pass | Δpartial / Δfull / ΔpartialFail | decode cửa sổ (ms) | load cửa sổ đầu | playClamped / playFalse / playOk |
|---|---|---|---|---|
| C chirp (130×100 ms) | **1 / 0 / 0**, reason null | **326** (bar 5.000) | 484 ms | 0 / **0** / 29 |
| B longB (1150×100 ms) | **5 / 0 / 0**, reason null | **701 / 2.081 / 2.008 / 2.732 / 2.073** (bar 5.000) | 845 ms | **1 / 0 / 312** |
| A longA (400×100 ms, chạy lại lúc máy rỗi) | **2 / 0 / 0**, reason null | **2.012 / 1.538** (bar 5.000) | 3.639 ms | **5 / 0 / 81** |

Chirp: partial engage thật (cửa sổ [39,967; 69,967], chứa frame
cuối stts 256 — như đợt 199), không fallback, không fail.
playFalse = 0 (playhead trong cửa sổ suốt pass 13 s, không cần
clamp — khác longA/longB là playhead chạm mép cuối file).
holdMaxSec 0,131 s, holdCapStop Δ=0, 0 rebuild (pass ngắn, 1 cửa sổ).
LongB: partial engage thật cả 5 lần (cửa sổ đầu + 4 rebuild),
không fallback, không fail; decode lớn nhất 2.732 ms < bar 5.000 ms
với biên 1,8×. playClamped Δ=1, playFalse Δ=0 (clamp sau load cửa
sổ đầu hoạt động như đợt 199). holdMaxSec 0,290 s, holdCapStop Δ=0.
LongA (chạy lại lúc máy rỗi, load 0,40): partial engage thật cả
2 lần, decode 2.012/1.538 ms, playFalse Δ=0, drift S2-clean median
0,063 / p90 0,174 s (trong bar), max 0,744 s (1 mẫu tại cap đầu
idx34, hold 2,47 s — tiền lệ (a5)-198: 1 transient tại cap không
làm fail verdict). Ghi chú: pass longA đầu đợt này chạy lúc máy
tải nặng (load 4,43) cho decode rebuild 5.372 ms (> bar) và
playFalse Δ=3 — đã chạy lại lúc máy rỗi và số về trong bar;
JSON pass nhiễu giữ lại làm bằng chứng
(`audio-probe-200-longA-polluted-load44.json`). 7 cap ở cả hai
pass longA đợt này (holdMaxSec 2,47–2,89 s) khác đợt 199 (0 cap,
0,351 s) — nguyên nhân chưa rõ (tải máy khi decode cửa sổ?),
ghi làm nợ quan sát đợt 201 (§5.6); không ảnh hưởng verdict N11b
(partial + playFalse đều xanh) và drift median/p90 đều xanh.
Bundle BCKAT1fc → BCKAT1fc cả ba pass (dist không bị rebuild giữa
chừng).

**Verdict N11b: GIỮ ĐẠT — không hồi quy** (partial engage thật
8/8 lần load cửa sổ qua 3 pass, 0 full fallback, 0 partial fail;
decode ≤ 2.732 ms; playFalse = 0 cả ba pass).

## 4. Thay đổi code + test

- **MỚI `benchmarks/reverse200/audio-probe-200.mjs`** (từ 199,
  sửa thước): env P200_* (port 4242–4244/CDP 9266–9268/profile
  riêng mỗi pass), fftSize runtime (P200_FFTSIZE), ZCR `zcrHz` +
  `sr`/`fftSize` mỗi mẫu, `playheadSec` mỗi mẫu, thước drift theo
  file (sweep-70s vs periodic-10s), bin S2 đọc từ mẫu thật
  (sr/fftSize — 21,53 Hz @2048, 5,38 Hz @8192), mask S2 riêng cho
  ZCR (7 Hz), khối SWEEP-70s 4 tổ hợp trong KET LUAN.
- **Bug thước trong script (tự phát hiện + sửa trước pass longB):**
  `inPass.map(driftOf)` truyền (sample, index, array) vào
  `driftOf(s, freqKey, headKey)` nên các số drift chính của KET
  LUAN in "?" ở pass chirp (chạy trước khi sửa) — khối SWEEP-70s
  của pass chirp không bị ảnh hưởng (gọi driftOf tường minh) và
  đã kiểm chứng độc lập bằng script riêng (§1.4, khớp từng số).
  Đã sửa thành `map((s) => driftOf(s))` trước pass longB/longA;
  pass longB/longA in đủ số drift chính.
- **KHÔNG sửa source app** (`reverseAudio*.ts` giữ nguyên như
  đợt 199 — bundle đo vẫn `index-BCKAT1fc.js` cả 3 pass, dist
  không bị rebuild giữa chừng).
- **Kiểm chứng:** `npx tsc --noEmit`: **0 lỗi** (12:22Z). Test
  reverse cũ không chạy lại đợt này (không đổi source — suite
  199: 11 test mới + 198: 14, 197: 6, 196: 5, 195: 3, 194: 7,
  193: 15, 192: 12, reverseAudio: 7 — đều xanh đợt 199 trên cùng
  bundle). Không đụng render path → không vite build mới.
- **Kiểm chứng độc lập:** script `analyze200.py` tính lại từ JSON
  thô, khớp KET LUAN từng số (chirp 4 tổ hợp; longB clean
  0,093/0,230/0,419; longA clean 0,085/0,233/0,585). Lưu ý nhỏ:
  script phân tích dùng ngưỡng S2 24 Hz (cũ) thay vì bin runtime
  21,53 Hz nên đếm lag nhiều hơn probe (longB 143 vs 103, longA
  74 vs 56) — median/p90/max khớp trong 0,004 s, không ảnh hưởng
  verdict.

## 5. Hạn chế / nợ chuyển đợt 201 (P3-201)

1. **Hold-mute (§1.5):** audio ngắt 19–40 ms mỗi ~0,9 s trong lúc
   phát ngược (đo được qua ZCR + RMS) — xác nhận có nghe được
   không, có phải hold gây ra không, và có cần sửa không. Tách
   khỏi verdict drift (peakHz không bị ảnh hưởng).
2. **ZCR không dùng được làm thước chính** trên player này (cửa sổ
   186 ms chứa đoạn im lặng lúc hold) — chỉ dùng median đối chiếu.
   Thước chính cho file sweep chậm là FFT-8192 (bin 0,14 s).
3. Thước S2 hiện lọc theo peakHz — với file sweep chậm, cân nhắc
   lọc theo ZCR-median hoặc playheadSec (tránh cờ lag giả do
   timeText lượng tử 0,1 s: pass chirp có 9 lag theo timeText
   nhưng 0 lag theo playheadSec).
4. `loadReversedWindow` vẫn fetch toàn file trước khi partial
   decode (nợ cũ từ 198).
5. Guard gần mép của clamp chưa có unit test trực tiếp (nợ 199).
6. **7 cap + hold dài 2,47–2,89 s ở cả hai pass longA đợt này**
   (đợt 199: 0 cap, holdMax 0,351 s) — nguyên nhân chưa rõ; theo
   dõi đợt 201 (có phải tải máy khi decode cửa sổ không). Không
   ảnh hưởng verdict N11b/drift đợt này (partial + playFalse +
   drift median/p90 đều xanh).

## 6. File đổi (stage, xem paths-loop phase9-round200-p3-reverse-chirp.txt)

- `benchmarks/reverse200/audio-probe-200.mjs` (mới — thước đo 200)
- `docs/PHASE9_ROUND200_P3_REVERSE_CHIRP_LIMITS.md` (file này)
- JSON probe thô + log + script phân tích ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round200-p3/`
  (scratch, không stage — gồm audio-probe-200-{chirp-70s,
  longB-300s-gop15-360p, longA-300s-gop300-720p}.json,
  audio-waveform-200-*.json, probe-200-*.log, analyze*.py,
  chirp_fit.py, zcr_*.py, run-probes-200.sh).
- KHÔNG PUSH. KHÔNG sửa `PHASE9_GAP_ANALYSIS.md` (chỉ T01 sửa).
- Phối hợp T4: mọi probe headed + tsc đều chạy SAU khi có
  `round200-t4.done` (12:11:51Z; W1 hợp lệ 12:01:09–12:04:36Z,
  W2/W3 không chạy — poller thoát sau lượt hợp lệ); file phân
  tích + script probe viết trước khi cửa sổ mở (nhẹ, chỉ text).
  0 vi phạm phía P3 đợt này.
