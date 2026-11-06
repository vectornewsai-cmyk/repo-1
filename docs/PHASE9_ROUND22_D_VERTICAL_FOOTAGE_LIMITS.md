# Phase 9 đợt 22 (luồng D) — footage DỌC H.264 license sạch + parity: LIMITS trung thực

> Đợt 22, luồng D (footage dọc + parity). Luật cứng đã giữ: KHÔNG push
> GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag, KHÔNG code
> giả, KHÔNG stage (parent stage, theo mẫu R21 T6), KHÔNG tải binary
> vào repo, KHÔNG sửa code sản phẩm, store, preview, video-spec,
> harness chung (chỉ thêm script đo mới của luồng này), KHÔNG ghi
> build-loop-log (parent gộp). Chỉ tạo 3 file text ở §9. Máy đo: VM
> 2 vCPU, FFmpeg/ffprobe 8.1.2, /tmp 512MB.

## 0. Kết luận ngắn (đọc đoạn này là đủ)

Nợ mở từ đợt 21 T6 §6 ("chưa có clip dọc H.264") nay **đóng**:

- Đã tìm và tải **3 clip dọc H.264** (lần đầu bộ footage có dọc ở
  hạng H.264): **J = DoD pistol qualification, H.264 1080×1920
  25fps** (IA, publicdomain mark); **K = DoD Iwo Jima corpsmen,
  H.264 1080×1920 23,976fps** (IA, publicdomain mark); **L = NASA
  AVATAR Vertical Video, H.264 608×1080 30fps** (NASA HQ, bản
  ~large.mp4). J và K là quay thật 9:16 đúng nghĩa; L là video dọc
  khoa học trộn footage + đồ hoạ (ghi rõ, không mạo nhận thuần).
- Parity **RGB24: cả 2 type (dissolve, circleopen) × cả 2 cặp đều
  KHỚP** (MAD 0,0027–0,5036, 100% pixel lệch ≤ 8), và **native
  1080×1920 cũng KHỚP cả 2 type** (dissolve 0,0032, circleopen
  0,4972) — lần đầu đo parity ở native dọc trên footage thật.
- **Phát hiện mới, trung thực: ngưỡng KHỚP YUV crf ≤ 12 của R21
  KHÔNG chuyển nguyên vẹn sang footage dọc.** Trên cặp dọc J→L
  (trường bắn → organ-chip), dissolve ở yuv420p **crf14 chỉ XẤP
  XỈ (2,3471) và crf12 vẫn XẤP XỈ (2,1117)** — lần đầu một cặp đo
  trượt KHỚP ở crf12. Quét bổ sung: cặp này về **KHỚP ở crf10
  (1,9464)**. Kết luận R21 KHÔNG bị sửa (nó đúng trên 2 cặp ngang
  của nó) — chỉ bổ sung: **ngưỡng crf YUV phụ thuộc nội dung, và
  footage dọc chi tiết có thể khó hơn footage ngang**; muốn KHỚP
  miền YUV cho dissolve trên MỌI footage đã đo đến nay thì dùng
  **crf ≤ 10**. Circleopen vẫn KHỚP ở crf14 trên cả 2 cặp dọc.
- Sàn YUV ở crf0 cho dissolve trên footage dọc là **0,5926 (cặp 1)
  và 1,6307 (cặp 2)** — cặp 2 có sàn cao gấp ~2,8 lần cặp 1, chứng
  tỏ sàn pipeline phụ thuộc nội dung mạnh (xem §5.3). Số 0,0000
  của R20 R6 chỉ đúng trên test pattern, không chuyển sang
  footage thật — nhất quán với phát hiện R21 (0,6498).
- Binary chỉ nằm ở `/tmp/vcut-r22-footage`, **không có trong repo,
  không stage**.

## 1. Nguồn đã xác minh license (API từng file, không tin tên file)

### 1.1. BA CLIP DỌC MỚI ĐÃ TẢI (đã nhìn bằng mắt, §4)

| Clip | Nội dung thật (đã nhìn bằng mắt) | ffprobe thật | API nguồn / license | SHA256 |
|---|---|---|---|---|
| J: `clip-j-dod-pistol.mp4` — IA `26-0037-077-dod-111630342`, file `26-0037-077 (DOD_111630342).mp4` | Thủy thủ tập bắn súng ngắn tại trường bắn sa mạc Twentynine Palms: hàng người ngắm bắn, bia, núi, panel chữ cuối khung — quay thật ngoài trời, dọc thật | **H.264, 1080×1920, 25fps**, 59,960 s, 57.277.953 byte | IA metadata API: `licenseurl=https://creativecommons.org/publicdomain/mark/1.0/`, creator=`U.S. Naval Hospital Twentynine Palms` — public domain mark (tác phẩm chính phủ Mỹ) | 07c815384d16325cebd7f2cefcd3b335e550fd7ba706e2417b777e2da740501e |
| K: `clip-k-dod-iwo.mp4` — IA `26-0007-222-b-dod-111566101`, file `26-0007-222B (DOD_111566101).mp4` | Tư liệu lưu trữ Iwo Jima (đen trắng, hạt): quân y vận chuyển thương binh, chữ "7,677 casualties" / subtitle "Navy medical personnel" — quay thật lưu trữ, bản vertical edit (crop dọc từ tư liệu ngang gốc — ghi rõ, không mạo nhận quay dọc gốc) | **H.264, 1080×1920, 23,976fps**, 64,606 s, 45.788.099 byte | IA metadata API: `licenseurl=https://creativecommons.org/publicdomain/mark/1.0/`, creator=`U.S. Defense Health Agency` — public domain mark | 49f33b83f0e7694e560557e08379b4bef628fed4f89662898764d5c12db6d69c |
| L: `clip-l-nasa-avatar-vertical.mp4` — NASA "Artemis II Science - AVATAR Vertical Video", nasa_id `Artemis II Science - AVATAR Vertical Video`, bản `~large.mp4` | Video dọc khoa học Artemis II: tay cầm chip organ-on-a-chip (@24,5s, footage lab thật), xen đồ hoạ phóng xạ (@10s bản medium) và footage động cơ tên lửa (@40s bản medium) — TRỘN footage + đồ hoạ, không phải footage thuần như J/K | **H.264, 608×1080, 30fps**, 75,767 s, 48.827.564 byte | NASA images-api: photographer=(trống), center=`HQ` — item của trụ sở NASA, chấp nhận qua nhánh center (như clip I R21, yếu hơn photographer NASA rõ ràng). Căn cứ license: chính sách NASA (xem §1.3) — KHÔNG phải deed CC0 | 0e2df0ee56dbafb0859f6800d1cf01d6848389057c81414c33e3cdb8b3aa5f94 |

Ghi chú nguồn gốc cần nói rõ:
- **L không đúng 9:16 tuyệt đối:** 608/1080 = 0,5630 so với 9/16 =
  0,5625 — "gần dọc" theo đúng tiêu chí nhiệm vụ (9:16 hoặc gần
  dọc). J và K đúng 9:16 tuyệt đối (1080×1920).
- **Nhãn format IA không đáng tin cho hạng này:** file mp4 của J/K
  có trường format IA là "MPEG4" (không phải "h.264" như cổng R21
  yêu cầu). Đợt này KHÔNG dùng nhãn đó làm cổng mà kiểm chứng
  codec bằng **ffprobe sau tải (codec_name=h264 thật)** — kiểm
  chứng mạnh hơn nhãn metadata, và sự khác biệt được ghi rõ ở
  đây + trong header script, không giấu. Nếu chỉ tin nhãn IA thì
  đã loại oan 2 clip dọc H.264 thật này.
- **NASA không phải CC0:** clip L phải được trích là "NASA
  public-domain-equivalent (US government work)", không trích
  "CC0". Ngoại lệ chính sách NASA vẫn áp dụng (logo/insignia,
  nội dung bên thứ ba, không ngụ ý chứng thực).
- **IA/NASA không bảo đảm license từng file vĩnh viễn:** SHA256
  trong bảng + manifest `/tmp/vcut-r22-footage/LICENSES.txt` là
  bằng chứng về trạng thái tại thời điểm tải (29/10/2026).

### 1.2. BẰNG CHỨNG CỔNG KIỂM TRA HOẠT ĐỘNG — trường hợp phủ định

- **IA `VerticalGlitch`:** licenseurl =
  `http://creativecommons.org/licenses/by-nc-sa/4.0/` (BY-NC-SA,
  nằm ngoài danh sách MIT/CC0/CC-BY/OFL/public-domain) → script
  `--check-only-ia` in REJECT, exit 1. Cổng IA không nể nang nội
  dung có chữ "Vertical" trong tên.
- **IA `81314-vertical-assault-vwr`:** licenseurl =
  `https://creativecommons.org/licenses/by-nc-nd/4.0/` (BY-NC-ND)
  → REJECT, exit 1. Cùng là video "vertical" trong tên nhưng
  giấy phép hạn chế nên loại — đúng mẫu phủ định nhiệm vụ yêu
  cầu ("file tưởng public domain nhưng giấy phép hạn chế").
- **Bẫy "vertical" của NASA (phủ định về HƯỚNG, không phải
  license):** video timelapse Roman
  (`RomansSpacecraftIntegratedPayloadAssemblyTimelapse_1080`,
  GSFC) mô tả "vertical time-lapse" nhưng bản ~small.mp4 đo
  được **640×360 NGANG** — "vertical" ở đây là lắp ráp tàu theo
  chiều dọc, không phải khung dọc. Đã loại khỏi bộ dọc mà không
  tải bản lớn; cổng hướng mới của script (height > width sau
  tải, §2) sẽ bắt trường hợp này nếu ai đó đưa nó vào fetch.
  Cùng bẫy: tìm kiếm NASA q=vertical trả chủ yếu video ngang về
  "Vertical Integration Facility" — tên chứa "vertical" không
  chứng minh khung dọc.
- **Đối chứng chấp nhận:** `--check-only-nasa` clip L: OK, exit
  0 (center HQ, photographer trống — nhánh yếu, đã ghi rõ);
  `--check-only-ia` J/K: OK, exit 0.

### 1.3. Vì sao không dùng Commons/Openverse cho hạng này

- **Wikimedia Commons:** R19 §2 đã chứng minh không có file gốc
  H.264/MP4 nào (0 kết quả filemime:video/mp4); dọc H.264 cũng
  không ngoại lệ — phải sang NASA/IA như R21.
- **Openverse:** R21 đã thử và API video trả 403/empty từ VM này
  nên không dùng được làm nguồn xác minh — đợt này không thử lại
  (không mạo nhận đã kiểm tra qua Openverse), mà xác minh qua
  API sơ cấp của chính nguồn chứa file.

## 2. Script fetch (thứ duy nhất về sau được stage cùng script đo + LIMITS)

`scripts/fetch-r22-footage.sh` (kế thừa mẫu R21, 2 thay đổi có
chủ đích, đều ghi trong header script):
- `--check-only-nasa "<nasa_id>"`: giữ nguyên cổng R21
  (photographer bắt đầu bằng "NASA" HOẶC center NASA).
- `--check-only-ia "<identifier>" [mp4file]`: licenseurl phải chứa
  "publicdomain" VÀ file mp4 tồn tại trong metadata; **không còn
  yêu cầu format IA = "h.264"** (lý do §1.1) — thay bằng cổng
  ffprobe sau tải.
- **Cổng sau tải (mới):** sau mỗi lần tải, ffprobe phải cho
  codec_name=h264 VÀ height > width (khung dọc thật); vi phạm
  thì **XOÁ file và exit 1** (không để file sai hạng nằm lại
  trong OUTDIR).
- **Chốt chặn OUTDIR trong repo: TỪ CHỐI, exit 2** (đã kiểm chứng
  với `assets`).
- Sau mỗi lần tải: ffprobe + ffmpeg giải mã thử 1 frame + ghi
  `LICENSES.txt` trong OUTDIR gồm label, kết quả kiểm tra API,
  URL tải, SHA256.
- Chỉ tải 3 file mẫu, gửi User-Agent định danh, không tải hàng loạt.
- Script có quyền thực thi (chmod +x); chạy được trực tiếp hoặc
  qua `bash` (script R21 gốc không có +x, script này set +x cho
  tiện chạy lại — khác biệt duy nhất về quyền, không về nội dung).

## 3. Phương pháp đo parity trên footage dọc mới

Script đo mới: `server/render/src/measure_r22_vertical_parity.js`
(chuyển thể từ script R21, thay ô native cố định 1920×1080 bằng cờ
`--native=WxH` và chạy native cho MỌI type trong `--types`, không
chỉ dissolve; dùng CHÍNH module chung `harnessShared.js` +
`describeTransition` từ module thật, transpile bằng tsc sang /tmp
— không sửa code sản phẩm):

- **Cửa sổ đo:** cặp 1 J→K: J = 28–30s, K = 28–30s; cặp 2 J→L:
  J = 28–30s, L = 24–26s. Ngữ nghĩa xfade giữ nguyên trong cửa sổ:
  A(win+1.5), B(win+0.5). Cửa sổ in ra log và ghi tại đây.
- **Ô RGB24** (giữ nguyên R18/R19/R21): chuẩn hoá cả 2 đầu vào bằng
  cùng filter chain `fps=30,scale=W:H,format=rgb24,settb=AVTB`, **ép
  rgb24 TRƯỚC xfade**; xfade duration=1 offset=1; chỉ lấy frame
  giữa transition (index 45 @30fps, p=0.5). Khung đo chính:
  **720×1280** (dọc, tương đương pixel 1280×720 ngang).
  Thang V6: KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8; XẤP XỈ = MAD
  ≤ 20 và ≥90% ≤ 8; còn lại LỆCH.
- **Ô YUV420p e2e** (theo ĐÚNG phương pháp R20 R6 §1): encode 2 giây
  bằng libx264 preset medium ở crf cho trước (mặc định 14),
  `format=yuv420p` sau xfade; decode frame 45 ra yuv420p raw (+
  rgb24 để đối chứng MAD-RGB); so yuv với preview chuyển sang
  yuv420p bằng CHÍNH FFmpeg (`harnessShared.ffmpegRgbToYuv420` +
  `yuv420Mad`, kiểu S5b đợt 18). Phân loại V6-tham-chiếu (thang V6
  gốc định nghĩa cho MAD RGB; số miền YUV chỉ tham chiếu, không
  phải badge mới). File mp4 2s bị xoá ngay sau khi decode.
- **Ô bổ sung** (cờ dòng lệnh, không làm thay đổi ô gốc):
  `--native=WxH` (native dọc cho mọi type),
  `--crf0-ref` (dissolve yuv crf0 đối chứng sàn),
  `R22_YUV_CRF=<n>` + `--types=<danh sách>` (quét crf khác / chạy
  riêng 1 type — dùng cho quét crf12/crf10/crf8 ở §5).
- Chỉ ghi 1 frame raw/lần render — không ghi 90 frame.
- Nguồn 25fps (J), 23,976fps (K), 30fps (L) đều được resample về
  30fps bởi cùng chain này, như R21 (25/30/29,97fps).

## 4. Kiểm tra bằng mắt (nội dung quay thật, không phải test pattern)

- **J @29,5s (frame A cặp 1+2):** thủy thủ xếp hàng ngắm bắn tại
  trường bắn sa mạc, bia tím, núi, panel chữ xanh cuối khung —
  quay thật ngoài trời, dọc 9:16, chi tiết cao (std 55,6,
  diff-ngang 5,60 — cao nhất bộ ngang/dọc từng đo, do panel chữ
  + người + cát + núi cùng lúc).
- **K @28,5s (frame B cặp 1):** tư liệu đen trắng Iwo Jima, quân y
  cõng thương binh ngược sáng, subtitle "Navy medical personnel"
  — quay thật lưu trữ, tương phản cực cao (std 84,2, diff-ngang
  1,00: vùng đen lớn + vùng trắng cháy).
- **L @24,5s (frame B cặp 2):** tay cầm chip organ-on-a-chip trong
  suốt trên nền xanh — footage lab thật, chi tiết mảnh (kênh chip
  mỏng, std 52,7, diff-ngang 3,71).
- **L @10s/@40s (bản medium, thăm dò):** @10s là đồ hoạ xám loé
  sáng (visual hoá phóng xạ, không phải footage); @40s là cận
  động cơ tên lửa vàng cam (footage hoặc CGI, không phân biệt
  chắc được bằng 1 frame) — vì vậy L chỉ được gọi là "trộn
  footage + đồ hoạ", không gọi "footage thuần".

## 5. Kết quả đo (số thật, log giữ lại)

Đối chứng trích lặp frame A: tổng lệch tuyệt đối = **0** ở cả 2
cặp (chuỗi chuẩn hoá xác định). RGB lặp lại đúng tới 4 chữ số
thập phân giữa các lần chạy crf khác nhau (vd dissolve cặp 1:
0,0029 ở cả crf14 và crf12).

### 5.1. Cặp 1: J (trường bắn 1080×1920) → K (Iwo Jima 1080×1920), 720×1280 (log `/tmp/r22-parity-pair1-crf14.log`, `/tmp/r22-parity-pair1-crf12.log`)

| Transition | RGB24 (MAD / ≤8 / hạng) | YUV420p crf14 (MAD-YUV / ≤8 / V6-tham-chiếu) | YUV420p crf12 (MAD-YUV / ≤8 / V6-tham-chiếu) | MAD-RGB decode crf14 / crf12 |
|---|---|---|---|---|
| dissolve | 0,0029 / 100,00% / **KHỚP** | 1,9828 (Y=2,0362 U=1,8245 V=1,9278) / 99,74% / **KHỚP (sát ngưỡng)** | 1,6573 (Y=1,6813 U=1,5826 V=1,6356) / 99,93% / **KHỚP** | 9,7103 / 56,64% LỆCH / 9,3700 / 58,76% LỆCH |
| circleopen | 0,4981 / 100,00% / **KHỚP** | 0,9062 (Y=0,9559 U=0,8782 V=0,7353) / 99,99% / **KHỚP** | 0,8582 (Y=0,8938 U=0,8473 V=0,7269) / 100,00% / **KHỚP** | 1,8525 / 99,65% KHỚP / 1,7966 / 99,76% KHỚP |

Đối chứng + ô native (cùng cặp 1, log crf14):
- Dissolve YUV **crf0: MAD-YUV 0,5926** (Y=0,6006 U=0,6523
  V=0,5009) / 100,00% / KHỚP — sàn pipeline cặp 1.
- **Dissolve native 1080×1920 rgb24: MAD 0,0032, ≤8 100,00%,
  KHỚP** — gần như tuyệt đối như ở 720×1280 (0,0029). Lần đầu
  parity được đo ở native dọc trên footage thật; cả 2 clip đều
  native 1080×1920 nên ô này là native thật cho cả 2 phía.
- **Circleopen native 1080×1920 rgb24: MAD 0,4972, ≤8 100,00%,
  KHỚP** — lần đầu circleopen có ô native dọc (R21 chỉ đo native
  cho dissolve).
- Cảnh báo: dissolve crf14 cặp 1 chỉ cách ngưỡng KHỚP **0,0172**
  (1,9828 so với 2,0) — "KHỚP" nhưng biên mỏng nhất từng đo ở
  crf14; trích số này mà không kèm biên là trích thiếu.

### 5.2. Cặp 2: J (trường bắn) → L (organ-chip 608×1080), 720×1280 (log `/tmp/r22-parity-pair2-crf14.log`, `-crf12.log`, `-crf10.log`, `-crf8.log`)

| Transition | RGB24 (MAD / ≤8 / hạng) | YUV420p crf14 (MAD-YUV / ≤8 / V6-tham-chiếu) | YUV420p crf12 (MAD-YUV / ≤8 / V6-tham-chiếu) | MAD-RGB decode crf14 / crf12 |
|---|---|---|---|---|
| dissolve | 0,0027 / 100,00% / **KHỚP** | 2,3471 (Y=2,5458 U=1,8779 V=2,0213) / 98,79% / **XẤP XỈ** | 2,1117 (Y=2,3102 U=1,6865 V=1,7431) / 99,33% / **XẤP XỈ** | 11,1890 / 58,18% LỆCH / 10,9245 / 59,77% LỆCH |
| circleopen | 0,5036 / 100,00% / **KHỚP** | 1,5767 (Y=1,7691 U=1,2234 V=1,1606) / 99,92% / **KHỚP** | 1,5271 (Y=1,7041 U=1,1953 V=1,1505) / 99,98% / **KHỚP** | 2,0658 / 99,47% XẤP XỈ / 1,9661 / 99,66% KHỚP |

Đối chứng + quét bổ sung (cùng cặp 2, chỉ dissolve):
- Dissolve YUV **crf10: MAD-YUV 1,9464** (Y=2,1509 U=1,5242
  V=1,5509) / 99,63% / **KHỚP** — ngưỡng cắt nằm giữa crf12 và
  crf10 cho cặp này.
- Dissolve YUV **crf8: MAD-YUV 1,8316** (Y=2,0502 U=1,3916
  V=1,3970) / 99,79% / **KHỚP**.
- Dissolve YUV **crf0: MAD-YUV 1,6307** (Y=1,8938 U=1,1479
  V=1,0611) / 99,99% / KHỚP — sàn pipeline cặp 2, cao gấp ~2,8
  lần sàn cặp 1 (0,5926).
- Chú ý: circleopen cặp 2 có MAD-RGB-decode **XẤP XỈ ở crf14
  (2,0658)** — lần đầu circleopen trượt KHỚP ở cột decode-RGB
  (R21: ~1,9 KHỚP cả 2 cặp); về KHỚP ở crf12 (1,9661, biên
  0,034). Cột decode-RGB này đo lỗi subsample 4:2:0, không phải
  lỗi parity preview — nhưng biên mỏng của nó trên nội dung
  chi tiết dọc là tín hiệu đáng ghi.

### 5.3. Đọc tổng hợp — ngưỡng crf YUV phụ thuộc nội dung (đối chiếu R20/R21)

| Nội dung | Dissolve YUV crf14 | Dissolve YUV crf12 | Dissolve YUV crf10 | Sàn YUV crf0 |
|---|---|---|---|---|
| Test pattern (R20 R6) | 1,8094 KHỚP | 1,4079 KHỚP | — | 0,0000 |
| Ngang: phóng đêm → phim 1950 (R21 cặp 1) | 2,3436 XẤP XỈ | 1,9930 KHỚP | — | 0,6498 |
| Ngang: phóng đêm → quỹ đạo (R21 cặp 2) | 1,6921 KHỚP | — | — | — |
| **Dọc: trường bắn → Iwo Jima (R22 cặp 1)** | 1,9828 KHỚP (biên 0,0172) | 1,6573 KHỚP | — | 0,5926 |
| **Dọc: trường bắn → organ-chip (R22 cặp 2)** | 2,3471 XẤP XỈ | 2,1117 XẤP XỈ | 1,9464 KHỚP | 1,6307 |

Quy tắc thực hành rút ra (ghi đúng phạm vi đo, không tổng quát
hoá vượt 5 nội dung đã đo): **muốn KHỚP miền YUV cho dissolve
trên mọi footage đã đo thì dùng crf ≤ 10**; crf14 chỉ an toàn
trên nội dung mịn/test pattern (và cặp dọc 1 với biên mỏng);
crf12 an toàn trên trường hợp xấu nhất của R21 nhưng KHÔNG an
toàn trên cặp dọc 2. Circleopen KHỚP ở crf14 trên cả 5 nội dung
(cao nhất 1,5767, cặp dọc 2) nên không cần hạ crf cho type này
— nhưng cột decode-RGB của nó đã sát ngưỡng trên cặp dọc 2.
Giải thích nhất quán cho sàn crf0 cao ở cặp 2: khi đầu ra xfade
là yuv420p, FFmpeg xử lý (blend/chuyển miền) khác với blend
trong rgb24 rồi mới chuyển sang yuv; trên nội dung chi tiết cao
(panel chữ + kênh chip mảnh) khe pipeline này lớn hơn hẳn nội
dung mịn (cặp 1: B là tư liệu đen trắng tương phản cao nhưng
mịn theo chiều ngang, hdiff 1,00; cặp 2: B chi tiết ngang 3,71).
Sàn 1,6307 này là tính chất pipeline + nội dung, không phải bug
script đo (RGB24 của cùng cặp vẫn KHỚP tuyệt đối 0,0027).

## 6. Giới hạn chưa làm được / nợ còn lại (trung thực)

### 6.1. CẢNH BÁO TRƯỚC KHI PHÁT HÀNH (đọc trước khi đưa clip vào kho phát hành)

Dùng 3 clip này **chỉ để đo trong /tmp** là an toàn. Nếu muốn đưa
vào kho asset phát hành kèm sản phẩm thì phải kiểm tra lại từng
clip — bản quyền sạch KHÔNG tự động làm sạch quyền nhân thân hay
nội dung nhạy cảm:

- **Clip J — NGƯỜI NHẬN DIỆN ĐƯỢC + VŨ KHÍ:** thủy thủ tập bắn
  súng ngắn, mặt người nhìn thấy được; quyền nhân thân có thể áp
  dụng độc lập với public domain mark. Nội dung trường bắn cũng
  cần cân nhắc ngữ cảnh phát hành (không phải clip trung tính).
- **Clip K — TƯ LIỆU CHIẾN TRANH + THƯƠNG VONG:** hình ảnh chiến
  tranh Iwo Jima, chữ "7,677 casualties" — nhạy cảm, không phù
  hợp làm asset mẫu chung; nguồn gốc vertical edit (crop từ tư
  liệu ngang) cũng cần ghi rõ nếu phát hành.
- **Clip L — SẠCH NHẤT VỀ NGƯỜI NHƯNG YẾU VỀ NGUỒN:** chỉ có tay
  cầm chip (không mặt), nhưng provenance qua nhánh center HQ
  (photographer trống) yếu hơn clip có photographer NASA; vẫn
  nên quét lại toàn bộ 76 s trước khi phát hành (luồng này chỉ
  nhìn frame @10s/@24,5s/@40s).
- **NASA không phải CC0, IA không bảo đảm vĩnh viễn:** xem §1.1.

### 6.2. Giới hạn đo lường còn lại

- **Chưa đo native cho cặp 2** (chỉ cặp 1 có ô native, vì cả 2
  clip đều native 1080×1920; L bản large là 608×1080 ≠ native của
  J, bản ~orig.mp4 92,7MB chưa tải nên chưa biết khung orig).
- **Chưa đo 4K dọc, chưa đo fade trên footage dọc** (phạm vi nhiệm
  vụ đợt này là dissolve/circleopen), chưa đo 79 type còn lại
  trên footage dọc H.264.
- **Chưa đo crf > 14 cho circleopen** (chưa biết ngưỡng trượt của
  type này trên footage dọc); chưa đo preset khác ở crf10/12/14
  trên footage dọc (R6 chỉ đo preset trên test pattern).
- **Chỉ nhìn 1–3 frame/clip bằng mắt:** nội dung toàn bộ clip (đặc
  biệt L dài 76 s, J/K ~60 s) chưa quét hết từng giây — cảnh báo
  §6.1 dựa trên frame đã nhìn, không phải rà soát toàn clip.
- **Không có FPS canvas / click-test trên footage dọc H.264**
  (blocker headed chung); script đo chỉ chạy ở tầng FFmpeg +
  module preview, không qua trình duyệt.
- **Đa dạng vẫn chưa đủ:** 12 clip tổng cộng sau đợt này (2 R18 +
  4 R19 + 3 R21 + 3 R22), vẫn chưa có 4K quay thật nào được tải,
  chưa có clip dọc 4K, chưa có người nói/chân dung cận cảnh dọc.

## 7. Kiểm chứng đã chạy (lệnh + kết quả)

- `bash -n scripts/fetch-r22-footage.sh`: pass.
- `node --check server/render/src/measure_r22_vertical_parity.js`:
  pass.
- `--check-only-ia VerticalGlitch`: REJECT by-nc-sa/4.0, exit 1
  (§1.2); `--check-only-ia 81314-vertical-assault-vwr`: REJECT
  by-nc-nd/4.0, exit 1 (§1.2).
- `--check-only-nasa` clip L: OK (center HQ), exit 0.
- Chốt chặn OUTDIR trong repo: TỪ CHỐI, exit 2 (chạy với
  `assets`).
- Fetch thật vào `/tmp/vcut-r22-footage`: 3 file, ffprobe (h264 +
  dọc) + giải mã thử 1 frame đều pass, SHA256 trùng với bản thăm
  dò trước đó (log `/tmp/r22-fetch.log`) — tải xác định, script
  chạy lại được.
- Parity cặp 1 crf14+native+crf0-ref chạy trọn vẹn, exit 0 (log
  `/tmp/r22-parity-pair1-crf14.log`); cặp 1 crf12 exit 0 (log
  `/tmp/r22-parity-pair1-crf12.log`); cặp 2 crf14+crf0-ref exit 0
  (log `/tmp/r22-parity-pair2-crf14.log`); cặp 2 crf12 exit 0
  (log `/tmp/r22-parity-pair2-crf12.log`); cặp 2 crf10 exit 0
  (log `/tmp/r22-parity-pair2-crf10.log`); cặp 2 crf8 exit 0
  (log `/tmp/r22-parity-pair2-crf8.log`). RGB lặp lại đúng tới
  4 chữ số giữa các lần chạy.
- Kiểm tra bằng mắt 3 frame đo (`/tmp/r22-eye-j-29p5.jpg` @29,5s,
  `/tmp/r22-eye-k-28p5.jpg` @28,5s, `/tmp/r22-eye-l-24p5.jpg`
  @24,5s) + frame thăm dò J @30s, K @30s, L @10s/@40s (bản
  medium): nội dung như mô tả §4.
- KHÔNG chạy tsc/vite build toàn dự án (không sửa code sản phẩm
  hay code TS nào — script đo chỉ transpile module TS sang /tmp
  để đo, như mẫu R21; script fetch là bash, không liên quan
  build web).
- KHÔNG chạy click-test browser thật (nợ mở chung, §6.2).
- KHÔNG sửa file nào khác: chỉ tạo 3 file mới ở §8, không đụng
  code sản phẩm, harness, store, preview, render, i18n, hay file
  của luồng khác. Thư mục làm việc không phải git repo nên
  không có git status để đối chiếu (parent push qua API).

## 8. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- `scripts/fetch-r22-footage.sh` (MỚI — fetch 3 clip dọc H.264 từ
  IA + NASA về OUTDIR ngoài repo, kèm kiểm tra license API
  NASA/IA + cổng ffprobe codec h264 + khung dọc sau tải +
  manifest LICENSES.txt; binary KHÔNG vào repo)
- `server/render/src/measure_r22_vertical_parity.js` (MỚI — parity
  dissolve/circleopen trên footage dọc H.264 mới, ô rgb24 +
  ô yuv420p e2e crf tuỳ chọn + ô native dọc `--native=WxH` cho
  mọi type, dùng module chung harnessShared)
- `docs/PHASE9_ROUND22_D_VERTICAL_FOOTAGE_LIMITS.md` (MỚI — chính file này)

KHÔNG đưa vào stage (chỉ để trên đĩa / trong /tmp, ghi tên để đối chiếu):
binary mẫu `/tmp/vcut-r22-footage/clip-j-dod-pistol.mp4`,
`clip-k-dod-iwo.mp4`, `clip-l-nasa-avatar-vertical.mp4`, manifest
`/tmp/vcut-r22-footage/LICENSES.txt`, log `/tmp/r22-fetch.log`,
`/tmp/r22-parity-pair1-crf14.log`, `/tmp/r22-parity-pair1-crf12.log`,
`/tmp/r22-parity-pair2-crf14.log`, `/tmp/r22-parity-pair2-crf12.log`,
`/tmp/r22-parity-pair2-crf10.log`, `/tmp/r22-parity-pair2-crf8.log`,
frame kiểm tra bằng mắt `/tmp/r22-eye-j-29p5.jpg`,
`/tmp/r22-eye-k-28p5.jpg`, `/tmp/r22-eye-l-24p5.jpg`, thư mục tmp
của script đo `/tmp/r22-vertical-*` (giữ lại để đối chứng).
Không tạo file binary nào trong repo. Không push, không tag/release.
