# Đợt 64 R4 — Ghosting denoise trên footage quay thật + tốc độ pan khác: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt ~05:40–06:40, giờ +07).
Máy đo: VM này (4 vCPU, RAM ~7.8GB, CPU-only, FFmpeg 8.1.2, libx264).
Đóng nợ đợt 63 R2 §8 mục 3: đo ghost trên footage quay thật + tốc độ pan khác
(12px/frame, 48px/frame đã đề xuất — xem §6 vì sao không đạt được).
Harness mới: `server/render/src/test_round64_r4_ghost_real_footage.js`
(**59/59 pass, exit 0**). Self-test `enhance.js`: pass.
Log đầy đủ tại `workspace/goals/capcut-clone-video-editor/hidden_files/round64-r4.md`
+ `~/workspace/.scratch-r64r4/` (quét tốc độ, kiểm chứng) và
`~/workspace/.scratch-r64r4-9h00Sj/` (harness run, `summary.json`).
Không sửa code production, không đụng web (không cần tsc/vite — xem §5).

## 1. Kết luận ngắn — trả lời câu hỏi nghiên cứu

**KHÔNG cần điều chỉnh ngưỡng cảnh báo denoise ≥0,7 theo tốc độ pan —
trong dải tốc độ đo được (0,6–7,9 px/frame ở 720p).** Bước nhảy b_small
0,5→0,7 gần như KHÔNG ĐỔI ở mọi tốc độ: **+0,058 (0,6 px/f) / +0,071
(2,5 px/f) / +0,057 (6,0 px/f) / +0,077 (7,9 px/f)** — không có xu hướng
tăng theo tốc độ (điểm 2,5 px/f nhảy mạnh hơn điểm 6,0 px/f). Bước nhảy
0,7→0,8 nhỏ hơn ở mọi đoạn (+0,019–0,029), khớp R2: bước lớn nhất nằm ở
0,5→0,7. Cảnh báo ≥0,7 của đợt 61/63 giữ nguyên — và dữ liệu còn cho thấy
bước nhảy này xuất hiện NGAY CẢ khi camera gần như đứng yên (ocean 0,6
px/f vẫn +0,058), nên không có cơ sở để chỉ cảnh báo khi clip nhanh:
nếu có cảnh báo thì áp ở ≥0,7 bất kể tốc độ (trong dải đã đo).

**Nhưng mức ghost TUYỆT ĐỐI phụ thuộc nội dung nhiều hơn tốc độ.**
b_small ở 0,7: 0,417–0,437 trên 3 đoạn đầu, nhưng **0,581 trên slov-fast**
(đường phố, mặt đường phẳng trượt nhanh + xe chạy) — cao hơn hẳn ~0,15.
Nội dung (bề mặt phẳng chuyển động) mới là yếu tố phân biệt, không phải
tốc độ pan. Đây là giả thuyết, chưa phải kết luận (xem §4.3).

**Hai phát hiện phụ quan trọng:**
- **Sàn encode CRF23 đã ghost sẵn trên footage thật** (b_small ctrl
  0,079–0,126; trail small ctrl 1,76–2,79 mức). Kiểm chứng: encode trực
  tiếp bằng ffmpeg CRF23 cho số GIỐNG HỆT render.js ctrl tới 4 chữ số
  thập phân — sàn này là của x264 (dự đoán liên-frame + lượng tử hoá trên
  texture), không phải của pipeline render.js. Mọi kết luận về denoise
  trong tài liệu này tính trên PHẦN VƯỢT SÀN (b − b_ctrl).
- **Claim "không ghost trên cạnh lớn" của R2 KHÔNG chuyển được nguyên vẹn.**
  b_large tuyệt đối ở 0,8 là 0,042–0,175 trên footage thật (R2: ≤0,039
  trên pan ảnh tĩnh); phần vượt sàn 0,033–0,136, cao nhất ở basgo-mid
  (2,5 px/f, +0,136) chứ không phải ở đoạn nhanh nhất. Dải large trên
  footage thật không chỉ có cạnh cứng — nó lẫn texture chuyển động vừa
  (|dC| vừa vượt 24) mà hqdn3d vẫn blend một phần.

## 2. Footage thật dùng để đo (license rõ ràng, chỉ ở scratch)

| Clip | Nguồn | License | Quay thật? | Dài / fps / cỡ |
|---|---|---|---|---|
| `ocean06.ogv` | Wikimedia Commons, File:Ocean surface waves 06.ogv (Mostafameraji) | CC0 | Có — sóng biển, camera gần như đứng yên | 6,4s / 25fps / 1920×1080 |
| `basgo.webm` | Wikimedia Commons, File:Panorama from Basgo monastery, Ladakh.webm | CC BY 3.0 | Có — panorama núi | 26,1s / 30fps / 1920×1080 |
| `slovenska.webm` | Wikimedia Commons, File:Traffic on Slovenska street.webm | CC BY 3.0 | Có — đường phố, camera tĩnh + xe chạy, có đoạn pan nhanh ~37–40s | 54,2s / 25fps / 1920×1080 |

SHA256 đã verify trong harness (ocean `4b9e690d…`, basgo `7ed32bc7…`,
slovenska `ae8f684c…`). Footage KHÔNG đưa vào batch push (chỉ script/harness
+ LIMITS này được stage). Mọi đoạn đo đều cắt 5s, scale 1280×720, CRF18,
rồi render thật qua `render.js` (veryfast/CRF23) với enhance denoise
0.5/0.7/0.8 + đối chứng không enhance.

**Đã khảo sát nhưng KHÔNG dùng:** Big Buck Bunny (Blender, CC BY 3.0,
archive.org) — phim CG, không phải camera vật lý; file "720p" thực chất
chỉ 640×360; các cửa sổ "nhanh" ở quét thô 2fps hoá ra là cắt cảnh
(response phase correlation ~0,04) và ở fps native chỉ còn ~2,9 px/frame.
Pexels bị chặn 403 qua curl nên không dùng được.

## 3. Tốc độ pan — ĐO, không đoán (phase correlation, crop giữa, như R2)

| Đoạn | Tốc độ đo lại trên đúng 5s đã dùng | resp median | Phân loại |
|---|---|---|---|
| ocean-slow (t=0) | 0,60 px/frame @720p (15,1 px/s; p90 138 px/s — sóng vỗ từng đợt) | 0,564 | chậm |
| basgo-mid (t=15) | 2,48 px/frame (74,3 px/s) | 0,862 | vừa |
| basgo-fast (t=0) | 5,98 px/frame (179,5 px/s) | 0,868 | nhanh |
| slov-fast (t=36) | 7,86 px/frame (196,6 px/s; p90 425 px/s) | 0,434 | nhanh |

Tốc độ là median trên 124–149 cặp frame. Response thấp ở slov-fast
(0,434) vì phase correlation kém tin khi pan nhanh (motion blur + dịch
lớn); kiểm chứng theo từng giây: 37–40s duy trì 208–357 px/s nên phân
loại "nhanh" vẫn vững, chỉ con số median tuyệt đối kém chắc hơn. Ocean
resp 0,564 vì sóng là chuyển động không cứng (non-rigid).

## 4. Số đo ghost (phương pháp y hệt R2 §3 — trail + b từng dải)

### 4.1 b_small — con số kết luận (dải 2<|dC|≤8, nhạy ghost nhất)

| Đoạn (tốc độ) | ctrl (sàn encode) | 0.5 (vượt sàn) | 0.7 (vượt sàn) | 0.8 (vượt sàn) | Nhảy 0.5→0.7 | Nhảy 0.7→0.8 |
|---|---|---|---|---|---|---|
| ocean-slow (0,6 px/f) | 0,126 | 0,379 (+0,253) | 0,437 (+0,311) | 0,460 (+0,334) | **+0,058** | +0,023 |
| basgo-mid (2,5 px/f) | 0,116 | 0,346 (+0,229) | 0,417 (+0,300) | 0,442 (+0,325) | **+0,071** | +0,025 |
| basgo-fast (6,0 px/f) | 0,116 | 0,378 (+0,262) | 0,434 (+0,319) | 0,454 (+0,338) | **+0,057** | +0,019 |
| slov-fast (7,9 px/f) | 0,079 | 0,503 (+0,424) | 0,581 (+0,501) | 0,610 (+0,530) | **+0,077** | +0,029 |

- Nhảy 0,5→0,7: 0,057–0,077, trung bình 0,066, KHÔNG đơn điệu theo tốc độ.
- Mức tuyệt đối ở 0,7: slov-fast 0,581 vượt 3 đoạn còn lại (0,417–0,437)
  tới ~0,15 — hiệu ứng nội dung, không phải tốc độ (xem §4.3).
- So với R2 (pan ảnh tĩnh 24 px/f): b_small 0,49/0,59/0,63 ở 0.5/0.7/0.8 —
  footage thật cho số THẤP HƠN ở cùng strength (trừ slov-fast), dù tốc độ
  chậm hơn nhiều. Pan 24 px/f của R2 vẫn là trường hợp xấu hơn chưa đo lại
  được trên footage thật.

### 4.2 Trail tuyệt đối, dải small (mức xám/255, mean) — và sàn flat

| Đoạn | ctrl small / flat | 0.5 small / flat | 0.8 small / flat | Trail small trừ sàn flat: 0.5 → 0.8 |
|---|---|---|---|---|
| ocean-slow | 2,79 / 0,61 | 4,01 / 1,51 | 4,84 / 1,92 | 2,50 → 2,93 |
| basgo-mid | 2,47 / 1,42 | 3,75 / 2,58 | 4,81 / 3,34 | 1,17 → 1,47 |
| basgo-fast | 2,06 / 1,21 | 3,39 / 2,24 | 4,23 / 2,99 | 1,15 → 1,24 |
| slov-fast | 1,76 / 1,13 | 3,81 / 2,55 | 4,95 / 3,53 | 1,26 → 1,41 |

- Ngưỡng trail <2 mức của đợt 61 càng không áp dụng được: trail small ở
  ctrl đã 1,76–2,79 (3/4 đoạn vượt 2 chỉ vì encode), và ở 0.5 đã 3,39–4,01.
- Trail small trừ sàn flat KHÔNG tăng theo tốc độ (ocean chậm nhất lại có
  trail trừ sàn lớn nhất, 2,50–2,93 — do texture sóng).

### 4.3 Vì sao slov-fast ghost mạnh hơn? (giả thuyết, có số đỡ)

slov-fast: b_flat 0,81–0,98 (cao nhất), b_small 0,50–0,61 (cao nhất),
trong khi sàn encode lại THẤP nhất (ctrl b_small 0,079). Nội dung: mặt
đường + vỉa hè phẳng, ít texture, trượt nhanh dưới pan 7,9 px/f — đúng
vùng nhạy nhất của hqdn3d (gradient phẳng chuyển động nhanh, giống gradient
tổng hợp đợt 61 hơn là ảnh texture). Dải small chiếm 25,5% frame. Giả
thuyết: **độ phẳng của bề mặt chuyển động dự báo ghost tốt hơn tốc độ pan.**
Chưa kiểm chứng (cần đo thêm clip mặt phẳng vs clip texture ở cùng tốc độ)
— không dùng làm ngưỡng, chỉ ghi hướng cho đợt sau.

### 4.4 b_large (dải |dC|>24) — R2 không chuyển nguyên vẹn

| Đoạn | ctrl | 0.5 | 0.8 | Vượt sàn ở 0.8 |
|---|---|---|---|---|
| ocean-slow | 0,047 | 0,085 | 0,144 | +0,097 |
| basgo-mid | 0,039 | 0,094 | 0,175 | **+0,136** |
| basgo-fast | 0,030 | 0,064 | 0,117 | +0,087 |
| slov-fast | 0,009 | 0,021 | 0,042 | +0,033 |

Không có xu hướng theo tốc độ (cao nhất ở 2,5 px/f). Lý do: dải large
trên footage thật gồm cả cạnh cứng (không blend) lẫn texture chuyển động
vừa (|dC| vừa vượt 24, dưới ngưỡng temporal hqdn3d sau lọc không gian)
nên blend một phần. Harness KHÔNG assert b_large (đã sửa giữa chừng, xem
§6) — chỉ báo số để LIMITS này đánh giá theo từng đoạn.

### 4.5 Tỉ lệ pixel theo dải |dC| (5 frame đầu, %)

| Đoạn | flat ≤2 | small 2–8 | mid 8–24 | large >24 |
|---|---|---|---|---|
| ocean-slow | 77,5 | 10,6 | 9,3 | 2,5 |
| basgo-mid | 30,2 | 27,4 | 26,1 | 16,4 |
| basgo-fast | 38,8 | 27,7 | 21,8 | 11,7 |
| slov-fast | 46,0 | 25,5 | 15,4 | 13,2 |

Dải small đủ pixel ở mọi đoạn (10,6–27,7%) nên b_small đo được vững.
Ocean có tới 77,5% pixel flat (mặt nước phẳng) — giải thích b_flat cao
và trail flat lớn.

## 5. Kiểm chứng gộp

- Harness chính: **59/59 pass, exit 0** (3 lần chạy: run 1 dừng giữa chừng
  do đổi script đo — xem §6; run 2 fail 1 check b_large do tiền đề sai;
  run 3 xanh sau khi sửa assert thành báo cáo).
- `enhance.js --self-test`: **pass**.
- Tính xác định: số ocean tái lập GIỐNG HỆT tới 4 chữ số thập phân giữa
  run 2 và run 3 (render + encode + đo đều xác định) — không cần đo lặp
  spread như stabilize (vấn đề .trf không xác định không áp dụng ở đây).
- Kiểm chứng sàn encode: encode trực tiếp `ffmpeg -c:v libx264 -preset
  veryfast -crf 23` trên đoạn ocean cho số giống hệt render.js ctrl
  (b_small 0,1257, trail small 2,7947) — sàn là của x264, không phải của
  render.js.
- Không sửa code production; không đụng web → không chạy tsc/vite.

## 6. Giới hạn — đọc trước khi trích số

1. **Chỉ 4 đoạn, 3 clip, mỗi đoạn 5s, 720p, CRF23/veryfast, n=1 mỗi
   (đoạn, strength).** Ngoại suy clip dài/1080p/CRF khác chưa kiểm chứng.
   Tính xác định của pipeline bù lại việc không lặp (số tái lập y hệt),
   nhưng n=1 vẫn có nghĩa mọi kết luận "không có xu hướng" chỉ vững trong
   4 điểm đo này.
2. **Dải tốc độ chỉ 0,6–7,9 px/frame.** Không tìm thấy pan thật nào nhanh
   hơn ~8 px/f trong các clip CC0/CC-BY khảo sát (kể cả BBB); pan 24 px/f
   của R2 (720 px/s — quét hết khung 1280px trong <2s, tức whip-pan) vẫn
   chưa có số trên footage thật. Kết luận "không cần điều chỉnh ngưỡng"
   CHỈ có giá trị tới ~8 px/f.
3. **Tốc độ slov-fast kém chắc hơn** (resp 0,434; phase correlation yếu
   khi pan nhanh + motion blur). Phân loại "nhanh" vững nhờ phân tích
   từng giây (37–40s duy trì 208–357 px/s), nhưng con số 7,86 px/f là
   ước lượng, không phải đo chính xác.
4. **b_small là hệ số hồi quy, không phải ngưỡng tri giác đã hiệu chuẩn.**
   Chưa có đo nào cho biết b_small bao nhiêu thì mắt người thấy vệt.
   Đừng dịch "b_small 0,58" thành "người dùng sẽ thấy ghost".
5. **Chỉ đo hqdn3d qua enhance.js** (strength → `hqdn3d=24s:18s:24s:18s`).
   Denoiser khác / preset encode khác (CRF, preset) sẽ cho sàn khác.
6. **Lịch sử assert đã sửa (ghi rõ):** (i) bản đầu của harness assert
   ctrl b≈0 (|b|<0,05) như R2 — sai tiền đề trên footage thật vì sàn
   encode CRF23 đã ~0,08–0,13; đã đổi sang assert sàn <0,25 + denoise
   vượt rõ sàn. (ii) assert "vượt sàn b_large ở 0.8 < 0,05" fail trên
   ocean (+0,097) — tiền đề "dải large = cạnh cứng" sai trên sóng biển;
   đã đổi thành chỉ báo số, đánh giá theo đoạn trong LIMITS này.
   (iii) bản đo ghost đầu dùng PNG + PIL: quá chậm dưới tải nặng
   (loadavg ~32, chỉ ~5% CPU) nên đã đổi sang frame gray thô + bincount
   (cùng công thức, cùng pixel — số ocean trước/sau đổi giống hệt nhau,
   kiểm chứng bằng run 2 vs run 3). (iv) lần chạy đầu của harness bị dừng
   giữa chừng để đổi script đo; harness đã làm resumable (tái dùng
   render/đoạn/frame đã có) để chạy lại không mất công.
7. **Tải VM là biến số về thời gian, không về số đo.** Loadavg 0,85–32
   trong các phiên; wall time render dao động 4,6–30,6s cho cùng 1 render
   5s. Số ghost không phụ thuộc tải (pipeline xác định), nhưng đừng trích
   wall time render làm tốc độ sản phẩm.

## 7. Cách chạy lại

```bash
node server/render/src/test_round64_r4_ghost_real_footage.js  # ~10-20 phút tùy tải; resumable
node server/render/src/enhance.js --self-test
```

## 8. Nợ mở thêm (cho đợt sau)

- **Pan thật >8 px/f (whip-pan):** tìm clip CC0/CC-BY có whip-pan thật
  (thể thao, xe chạy) hoặc dựng pan nhanh từ footage thật bằng cách quay
  lại — không dùng crop ảnh tĩnh (đã làm ở R2). Đây là dải tốc độ duy nhất
  chưa có số, và là nơi ngưỡng ≥0,7 có thể cần xem lại.
- **Giả thuyết "bề mặt phẳng chuyển động dự báo ghost tốt hơn tốc độ pan"**
  (§4.3): đo 2 clip cùng tốc độ ~6 px/f, một mặt phẳng (đường/sàn) một
  texture (rừng/đá), so b_small. Nếu đúng, cảnh báo denoise nên dựa vào
  độ phẳng của nội dung chứ không phải tốc độ.
- **Hiệu chuẩn tri giác b_small:** chưa biết b_small bao nhiêu thì thấy
  được bằng mắt — cần đo ABX hoặc ít nhất chụp frame so sánh ở các mức.
- **Cảnh báo EnhancePanel ≥0,7:** theo số đợt này, áp ở ≥0,7 bất kể tốc
  độ (trong dải đã đo), không cần detector tốc độ pan. Quyết định UI thuộc
  luồng làm EnhancePanel, không thuộc luồng đo này.
