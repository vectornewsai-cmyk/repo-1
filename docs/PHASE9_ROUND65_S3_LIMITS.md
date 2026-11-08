# Đợt 65 S3 — Ghosting whip-pan >8 px/f + kiểm chứng giả thuyết bề mặt phẳng: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt cron 15:35 +07).
Máy đo: VM này (4 vCPU, RAM ~7,9 GB, CPU-only, FFmpeg 8.1.2, libx264, python3 + numpy 1.26.4, cv2 qua server/tracking/.venv).
Đóng nợ đợt 64 R4 (docs/PHASE9_ROUND64_LIMITS.md §8 mục 3 + §4.3): (a) pan thật
>8 px/f (whip-pan) chưa có số; (b) giả thuyết "bề mặt phẳng dự báo ghost tốt hơn
tốc độ pan" chưa kiểm chứng.
Harness mới: `server/render/src/test_round64_r4_ghost_real_footage.js` là bản R4;
bản đợt này: `server/render/src/test_round65_s3_whip_pan_ghost.js`
(**96/96 pass, exit 0**, lượt chạy 2; lượt 1 bị SIGTERM giữa chừng ở 876s sau
khi xong 4/6 segment — xem §6 — lượt 2 resumable chạy nốt, số 4 segment đầu
lấy từ lượt 1, đã kiểm chứng khớp lại trong lượt 2 qua summary.json).
`enhance.js --self-test`: **pass**.
Log đầy đủ tại `workspace/goals/capcut-clone-video-editor/hidden_files/round65-s3.md`
+ `~/workspace/.scratch-r65s3/` (harness-run1.log, harness-run2.log, summary.json).
Không sửa code production, không đụng web (không cần tsc/vite).

## 1. Kết luận ngắn — trả lời 2 câu hỏi nghiên cứu

**Câu 1 — whip-pan >8 px/f: ghost KHÔNG tăng theo tốc độ, trong dải 14–49 px/f.**
b_small vượt sàn ở 0,7: mặt phẳng 0,588 → 0,529 → 0,516 (14 → 26 → 49 px/f);
nền chi tiết 0,505 → 0,534 → 0,489. Không có xu hướng tăng; nếu có thì hơi
GIẢM nhẹ (−0,072 phẳng / −0,017 chi tiết trên cả dải tốc độ 3,5x). Đặt cạnh
số cũ: R4 footage thật 0,6–7,9 px/f cho 0,42–0,58 ở 0,7; R2 pan ảnh tĩnh
24 px/f cho 0,59. Toàn bộ dải 0,6 → 49 px/f, b_small ở 0,7 chỉ nằm trong
khoảng 0,42–0,63 — **không đơn điệu theo tốc độ ở bất kỳ thang nào**. Bước
nhảy 0,5→0,7 cũng ổn định theo tốc độ: 0,063–0,094 ở cả 6 điều kiện.
**Kết luận cho cảnh báo denoise ≥0,7: không cần điều chỉnh theo tốc độ, mở
rộng từ "tới ~8 px/f" (R4) lên "tới ~49 px/f".**

**Câu 2 — giả thuyết "bề mặt phẳng dự báo ghost tốt hơn tốc độ": ĐƯỢC HỖ TRỢ
MỘT PHẦN, YẾU VÀ KHÔNG NHẤT QUÁN — không kết luận dứt khoát được.**
Chênh flat−tex của b_small vượt sàn (cùng tốc độ, cùng clip, cùng sweep):
ở 14 px/f +0,071 → +0,100 (cả 3 mức strength đều dương); ở 26 px/f
−0,015 → +0,026 (hỗn hợp, ~0); ở 49 px/f +0,014 → +0,051 (dương nhưng
nhỏ). Trung bình 9 ô so sánh: **+0,039**, 7/9 ô dương. Hướng đúng với giả
thuyết ở 2/3 tốc độ, nhưng hiệu ứng nhỏ (≤0,10, so với bước nhảy strength
0,5→0,7 là ~0,08 và mức tuyệt đối b_small ~0,5) và biến mất ở 26 px/f —
không đủ để làm căn cứ ngưỡng. Điểm sáng duy nhất nhất quán: **b_large vượt
sàn ở 0,8 tách phẳng vs chi tiết SẠCH ở cả 3 tốc độ: phẳng 0,080–0,086 vs
chi tiết 0,022–0,029 (~3x), không đổi theo tốc độ trong từng bề mặt.**
Đó là hướng theo dõi cho đợt sau, không phải kết luận (xem §4.3).

## 2. Thiết kế đo — whip-pan tổng hợp trên footage thật

Nguồn: `slovenska.webm` (Wikimedia Commons, CC BY 3.0, camera tĩnh, đã verify
sha256 `ae8f684c…` ở đợt 64), cửa sổ t=5s (camera gần như tĩnh, median ~0,7 px/f).
R4 §8 cho phép dựng pan nhanh từ footage thật ("không dùng crop ảnh tĩnh" —
đã làm ở R2); ở đây mỗi frame đều là footage quay thật, chỉ chuyển động pan
là tổng hợp.

- Upscale 2x (3840×2160, lanczos) rồi crop cửa sổ 1280×720 chuyển động ngang
  với tốc độ không đổi → pan ảo trên footage thật. Tốc độ ĐO LẠI bằng phase
  correlation (không tin số danh nghĩa).
- 2 bề mặt TRÊN CÙNG MỘT CLIP, cùng tốc độ, cùng sweep (so sánh có kiểm soát):
  flat = dải dưới (mặt đường/vỉa hè, y=1440/2160); tex = dải trên
  (nhà/cây/trời, y=0/2160). Độ phẳng đo bằng gradient không gian trung bình
  trên frame clean: **flat 1,145–1,161 vs tex 4,838–5,026 (chênh ~4,2x)**.
- 3 tốc độ danh nghĩa 12 / 24 / 48 px/f; dài 5s / 4s / 2s (cửa sổ crop hết
  hành trình 2560 px nên clip 48 px/f chỉ dài 2s — xem §6).
- Mỗi điều kiện render thật qua render.js (veryfast/CRF23): ctrl + denoise
  0,5/0,7/0,8 → 6 điều kiện × 4 render = **24 render thật**.
- Phương pháp ghost Y HỆT R4 (trail + b từng dải |dC|, b_small là số kết luận,
  kết luận tính trên PHẦN VƯỢT SÀN b − b_ctrl). Thêm: std/SE của b gộp theo
  từng cặp frame; assert số frame tối thiểu hạ 60 → 40 cho clip 2s.

### Bẫy đã gặp khi dựng pan (ghi để đợt sau khỏi vấp lại)

Dùng `-ss` TRƯỚC `-i` làm biến đếm `n` của filter crop bắt đầu từ ~125
(5s × 25fps) thay vì 0, nên `x='24*n'` vượt max 2560 và bị kẹp đứng yên —
**3 biểu thức khác nhau (`24*n`, `24*t*25`, `-ss` sau `-i`) cho ra file mp4
BYTE-IDENTICAL** (cùng sha256), và phase correlation đo chỉ ~1,5–1,9 px/f
trong khi mean|f24−f0| trên dải tex đã 28,8 (dấu hiệu mâu thuẫn phát hiện ra
bẫy). Cách sửa: `trim=start=5,setpts=PTS-STARTPTS` trong filter chain để
`n` đếm từ 0. Đã kiểm chứng bằng testsrc (`x='10*n'` không `-ss` thì chạy
đúng) và bằng tốc độ đo lại khớp danh nghĩa + offset (xem §3).

## 3. Tốc độ pan — ĐO, không đoán (phase correlation, như R4)

| Đoạn | Danh nghĩa | Đo lại (px/f @720p) | px/s | p90 px/s | resp median | Cặp |
|---|---|---|---|---|---|---|
| flat-12 | 12 | **14,35** | 358,7 | 496,8 | 0,814 | 124 |
| flat-24 | 24 | **25,77** | 644,2 | 738,4 | 0,808 | 99 |
| flat-48 | 48 | **49,13** | 1228,2 | 1260,2 | 0,779 | 49 |
| tex-12 | 12 | **13,98** | 349,5 | 504,2 | 0,859 | 124 |
| tex-24 | 24 | **25,79** | 644,8 | 745,0 | 0,847 | 99 |
| tex-48 | 48 | **49,23** | 1230,8 | 1252,8 | 0,837 | 49 |

- Đo lại cao hơn danh nghĩa +1,1 → +2,4 px/f: chuyển động riêng của nguồn
  (xe/người đi bộ, camera gần như tĩnh) phóng đại 2x qua crop zoom. Đây là
  offset thật, không phải sai số đo (resp 0,78–0,86, tin được — tốt hơn hẳn
  resp 0,434 của slov-fast ở R4).
- Hai bề mặt khớp nhau trong 0,4 px/f ở cùng tốc độ danh nghĩa → so sánh
  flat-vs-tex ở cùng tốc độ là có kiểm soát về tốc độ.
- Từ đây trở đi, "tốc độ" trong tài liệu này là SỐ ĐO (14 / 26 / 49 px/f),
  không phải số danh nghĩa.

## 4. Số đo ghost

### 4.1 b_small vượt sàn (b − b_ctrl) — con số kết luận

| Đoạn (tốc độ đo) | grad | ctrl | 0,5 (vượt) | 0,7 (vượt) | 0,8 (vượt) | Nhảy 0,5→0,7 | Nhảy 0,7→0,8 |
|---|---|---|---|---|---|---|---|
| flat-12 (14,4) | 1,159 | 0,043 | 0,560 (+0,518) | 0,631 (+0,588) | 0,651 (+0,609) | +0,071 | +0,021 |
| flat-24 (25,8) | 1,161 | 0,040 | 0,506 (+0,466) | 0,569 (+0,529) | 0,591 (+0,551) | +0,063 | +0,023 |
| flat-48 (49,1) | 1,145 | 0,030 | 0,478 (+0,448) | 0,546 (+0,516) | 0,566 (+0,537) | +0,068 | +0,021 |
| tex-12 (14,0) | 4,838 | 0,028 | 0,446 (+0,418) | 0,533 (+0,505) | 0,565 (+0,538) | +0,088 | +0,032 |
| tex-24 (25,8) | 4,912 | 0,018 | 0,458 (+0,440) | 0,552 (+0,534) | 0,585 (+0,567) | +0,094 | +0,033 |
| tex-48 (49,2) | 5,026 | 0,014 | 0,411 (+0,397) | 0,503 (+0,489) | 0,537 (+0,523) | +0,092 | +0,034 |

- **Theo tốc độ (cùng bề mặt, ở 0,7):** phẳng 0,588 → 0,529 → 0,516
  (−0,072 trên dải 14→49 px/f); chi tiết 0,505 → 0,534 → 0,489 (−0,017).
  Không tăng; hơi giảm. Trail small cũng vậy (phẳng 0,5: 3,34 → 3,01 → 2,96;
  chi tiết 0,5: 3,69 → 3,68 → 3,57).
- **Theo bề mặt (cùng tốc độ, ở 0,7):** 14 px/f +0,083; 26 px/f −0,005;
  49 px/f +0,027. Trung bình 9 ô (3 tốc độ × 3 mức): +0,039; theo tốc độ:
  14 px/f +0,085; 26 px/f +0,002; 49 px/f +0,031.
- **Bước nhảy strength là hiệu ứng ổn định nhất:** 0,5→0,7 là +0,063 → +0,094
  ở cả 6 điều kiện (trung bình ~0,079); 0,7→0,8 là +0,021 → +0,034. Không
  phụ thuộc tốc độ hay bề mặt. Đây là hiệu ứng lớn nhất trong bảng, lớn hơn
  cả chênh lệch phẳng−chi tiết lẫn chênh lệch theo tốc độ.
- **Sàn encode CRF23 tự nó GIẢM theo tốc độ:** b_small ctrl phẳng
  0,043 → 0,040 → 0,030; chi tiết 0,028 → 0,018 → 0,014 (giảm ~30–50% từ
  14 lên 49 px/f). Mọi kết luận trên đã trừ sàn riêng của từng đoạn nên
  không bị lẫn; nhưng ai trích số tuyệt đối phải nhớ sàn này khác nhau theo
  tốc độ. (Sàn ở đây thấp hơn R4 — 0,08–0,13 — vì segment là crop upscale
  CRF18, ít texture cao tần hơn full-frame.)

### 4.2 b_large vượt sàn ở 0,8 — tín hiệu phẳng/chi tiết sạch nhất

| Đoạn | ctrl | 0,8 | Vượt sàn ở 0,8 |
|---|---|---|---|
| flat-12 | 0,0073 | 0,0935 | **+0,086** |
| flat-24 | 0,0066 | 0,0922 | **+0,086** |
| flat-48 | 0,0058 | 0,0862 | **+0,080** |
| tex-12 | 0,0024 | 0,0312 | **+0,029** |
| tex-24 | 0,0025 | 0,0314 | **+0,029** |
| tex-48 | 0,0020 | 0,0243 | **+0,022** |

Phẳng 0,080–0,086 vs chi tiết 0,022–0,029 ở CẢ 3 tốc độ (~3x), không đổi
theo tốc độ trong từng bề mặt. Cơ chế có thể: trên nền phẳng, pixel dải
large là vạch kẻ đường/cạnh vỉa hè trượt nhanh mà hqdn3d vẫn blend; trên nền
chi tiết, dải large là cạnh cứng nhà cửa được giữ lại. Chỉ là giả thuyết cơ
chế — chưa chứng minh. Lưu ý tiền lệ R4: dải large là hỗn hợp, không đồng
nghĩa "cạnh cứng"; ở đây so sánh được vì cùng clip, cùng tốc độ, cùng sweep.
b_flat (|dC|≤2) cũng cao hơn ở phẳng mọi điều kiện (0,5: 0,73/0,69/0,62 vs
0,60/0,63/0,51) nhưng mẫu số hồi quy rất nhỏ nên chỉ ghi nhận, không dùng
làm số kết luận.

### 4.3 Vì sao không kết luận dứt khoát giả thuyết? (ghi rõ 3 điểm yếu)

1. **Hiệu ứng nhỏ và không nhất quán theo tốc độ:** chênh flat−tex lớn nhất
   ở 14 px/f (+0,085) nhưng ~0 ở 26 px/f (+0,002) rồi lại +0,031 ở 49 px/f.
   Không có SE riêng cho b_small (chỉ có SE của blend gộp, 0,0006–0,014;
   SE của b_small ước ~2–3x blend SE do ít pixel hơn) nên không loại trừ
   được nhiễu ở các chênh ≤0,03; chỉ các chênh ở 14 px/f (+0,07 → +0,10)
   là vượt rõ ngưỡng nhiễu ước lượng.
2. **Tốc độ bị lẫn với độ dài clip + phạm vi quét không gian:** 12 px/f dài
   5s quét 1488 px; 24 px/f dài 4s quét 2376 px; 48 px/f dài 2s quét
   2352 px. Clip 12 px/f chỉ đi qua nửa trái khung hình, 2 clip còn lại đi
   gần hết chiều rộng — nội dung khác nhau một phần. So sánh flat-vs-tex ở
   CÙNG tốc độ thì sạch (cùng dài, cùng sweep, cùng nguồn); so sánh THEO
   tốc độ thì không sạch hoàn toàn.
3. **Chỉ 1 clip nguồn, 1 cửa sổ thời gian (t=5s), n=1 mỗi ô.** Chưa lặp lại
   trên clip khác / cửa sổ khác. Kết luận "không tăng theo tốc độ" vững hơn
   kết luận về bề mặt vì nó lặp lại ở cả 2 bề mặt + khớp R2/R4, còn kết
   luận bề mặt chỉ có 3 điểm tốc độ trên cùng một cặp dải.

### 4.4 Tỉ lệ pixel theo dải |dC| (5 cặp đầu, %)

| Đoạn | flat ≤2 | small 2–8 | mid 8–24 | large >24 |
|---|---|---|---|---|
| flat-12 | 22,1 | 34,5 | 39,9 | 3,5 |
| flat-24 | 14,2 | 26,7 | 50,3 | 8,9 |
| flat-48 | 15,3 | 28,3 | 44,5 | 12,0 |
| tex-12 | 18,5 | 21,7 | 28,1 | 31,7 |
| tex-24 | 15,0 | 17,2 | 27,9 | 39,9 |
| tex-48 | 13,8 | 13,5 | 25,6 | 47,0 |

Dải small đủ pixel ở mọi đoạn (13,5–34,5%) nên b_small đo được vững.
Lưu ý: tỉ lệ |dC| dưới pan KHÔNG phải thước đo độ phẳng (nó phản ánh
chuyển động × gradient); thước đo phẳng dùng ở đây là gradient không gian
(§2), còn tỉ lệ |dC| chỉ cho biết đủ pixel để đo. Khi pan nhanh, pixel rời
dải small sang mid/large (phẳng: large 3,5% → 12,0%; chi tiết: 31,7% →
47,0%) — hiệu ứng chọn lọc này có thể góp phần làm b_small hơi giảm theo
tốc độ (pixel còn lại trong dải small là những pixel ít thay đổi nhất),
nhưng đây là suy luận, chưa tách được khỏi số liệu.

## 5. Kiểm chứng

- Harness chính: **96/96 pass, exit 0** (lượt 2; lượt 1: 65 pass, 0 fail
  trước khi bị SIGTERM — xem §6). Các assert: resp phase correlation
  >0,3; tốc độ đo >8 px/f; tốc độ đo khớp danh nghĩa trong 30%; sàn encode
  b_small ctrl <0,25; denoise 0,5 vượt sàn +0,05; dải small ≥2% pixel.
- `enhance.js --self-test`: **pass**.
- Tính xác định: lượt 2 tái dùng render/frame của lượt 1 và cho cùng số
  (summary.json khớp log lượt 1 tới 4 chữ số thập phân ở 4 segment đầu) —
  pipeline xác định, không cần đo lặp spread.
- Số đo tốc độ độc lập 2 cách: phase correlation (§3) và kiểm chứng tay
  bằng mean|f24−f0| + testsrc (phát hiện bẫy `-ss`, §2).

## 6. Giới hạn — đọc trước khi trích số

1. **Chỉ 1 clip nguồn (slovenska), 1 cửa sổ t=5s, 6 điều kiện, n=1 mỗi ô.**
   Ngoại suy sang clip khác / 1080p / CRF khác / denoise khác hqdn3d chưa
   kiểm chứng.
2. **Pan là tổng hợp (crop chuyển động trên footage thật), không phải camera
   whip-pan thật.** Không có motion blur quang học của pan thật; upscale 2x
   làm mềm texture một phần (lanczos) và phóng đại chuyển động riêng của
   nguồn 2x. Tốc độ đo đã bao gồm offset này (+1,1 → +2,4 px/f).
3. **Độ dài clip khác nhau theo tốc độ (5s/4s/2s)** vì hành trình crop có
   hạn (2560 px). Clip 48 px/f chỉ có 49 cặp frame — b trung bình trên 49
   cặp vẫn ổn nhưng SE lớn hơn (~1,6x so với 124 cặp). Không có SE riêng
   cho b_small (xem §4.3 mục 1).
4. **b_small là hệ số hồi quy, không phải ngưỡng tri giác đã hiệu chuẩn**
   (như R4 đã ghi). Đừng dịch "b_small 0,55" thành "người dùng sẽ thấy ghost".
5. **Chỉ đo hqdn3d qua enhance.js** (strength → thang hqdn3d). Denoiser
   khác / preset encode khác sẽ cho sàn khác.
6. **Sự cố lượt chạy 1:** harness lượt 1 bị SIGTERM sau 876s (~14,6 phút),
   đúng lúc agent gọi `nothing_to_do` để đáp một thông báo nền cũ — runtime
   dọn luôn tiến trình nền của lượt chạy. 4/6 segment đã xong được giữ lại
   (render + frame + số trong log), lượt 2 resumable chạy nốt 2 segment
   còn lại và cho tổng 96/96. Bài học vận hành: không kết thúc lượt bằng
   `nothing_to_do` khi còn tiến trình nền đang chạy.
7. **Tải VM là biến số về thời gian, không về số đo.** Các luồng đợt 65
   khác chạy song song (vite build, đo FPS) nên wall time render dao động
   1,9–21,1s cho cùng loại render. Số ghost không phụ thuộc tải (pipeline
   xác định). Đừng trích wall time render làm tốc độ sản phẩm.
8. **Chưa đo:** pan thật bằng camera (có motion blur quang); clip dài hơn
   ở 48 px/f (cần nguồn rộng hơn hoặc pan 2 chiều); hiệu chuẩn tri giác
   b_small; b_small SE riêng từng dải.

## 7. Cách chạy lại

```bash
node server/render/src/test_round65_s3_whip_pan_ghost.js  # ~15-25 phút tùy tải; resumable
node server/render/src/enhance.js --self-test
```

## 8. Nợ mở thêm (cho đợt sau)

- **Giả thuyết bề mặt phẳng — cần đo sạch hơn:** 2 clip khác nhau hoàn toàn
  (một mặt phẳng thật như mặt nước/sàn trống, một texture thật như rừng/đá)
  ở cùng tốc độ + cùng độ dài + cùng phạm vi quét; tính SE riêng cho b_small
  để phân biệt hiệu ứng thật vs nhiễu. b_large vượt sàn là ứng viên metric
  tốt hơn b_small cho câu hỏi này (tách sạch 3x ở cả 3 tốc độ đợt này).
- **Pan thật bằng camera:** tìm clip CC0/CC-BY có whip-pan thật (thể thao)
  để đối chiếu với pan tổng hợp — kiểm tra motion blur quang học có đổi
  kết luận "ghost không tăng theo tốc độ" không.
- **Hiệu chuẩn tri giác b_small:** chưa biết b_small bao nhiêu thì thấy
  được bằng mắt (nợ từ R4, vẫn mở).
- **Cảnh báo EnhancePanel ≥0,7:** theo số đợt này + R4 + R2, áp ở ≥0,7 bất
  kể tốc độ (trong dải đã đo 0,6–49 px/f), không cần detector tốc độ pan.
  Quyết định UI thuộc luồng làm EnhancePanel, không thuộc luồng đo này.
- **Bẫy `-ss` + biến `n` của filter crop:** đã ghi §2; mọi harness sau dùng
  pan bằng crop phải dùng trim+setpts hoặc kiểm chứng tốc độ đo lại.
