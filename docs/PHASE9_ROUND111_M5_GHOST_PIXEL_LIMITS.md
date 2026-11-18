# PHASE9_ROUND111_M5_GHOST_PIXEL_LIMITS — F6' bảo đảm mức pixel: fixture không tuần hoàn + hiệu chuẩn ngưỡng WebKit + nhãn ghost nhiễu + capture lag

> Luồng M5, đợt 111, lượt cron 12:35 +07 14/11/2026 (bắt đầu 05:38Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — push qua API
> như các đợt trước).
> Nợ LIMITS gộp đợt 110 §4 (từ L7 đợt 110): bảo đảm mức pixel + ngưỡng
> WebKit median ≤100 ms chưa phân biệt tải + nhãn ghost nhiễu 41,1% +
> capture lag max ~16f (cụm seq 326–327).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào (chỉ M1
> sửa đợt này — xem §0.1). Không đụng TTS 39, birefnet, `.github/workflows`,
> 0 binary vào batch.
>
> **Kết quả chính (6 ý):**
> 1. **Bằng chứng pixel độc lập mạnh ĐÃ CÓ (nợ 1 ĐÓNG):** fixture sọc
>    không tuần hoàn mới cho lát (b) n=648/484/314 occurrence, TẤT CẢ
>    match duy nhất 1 frame, nomatch 0/0/0 — lần đầu tiên trễ tuyệt đối
>    từng ghost đo được (L7/K7: (b) n=0).
> 2. **"Capture lag max ~16f (533 ms)" của L7 là SẢN PHẨM CỦA ALIAS, không
>    phải trễ thật:** trên fixture mới, trễ dương (pixels mới hơn nhãn,
>    loại trừ ghost stale sau seek) max chỉ +4f (133 ms) ở cả 3 lượt;
>    tập (c2) "đáng ngờ" sụp từ n=7/64 (L7) xuống n=0/4/0, max lag 1f.
>    Cụm seq 326–327 (16f) KHÔNG tái diễn.
> 3. **Hai cơ chế trễ THẬT, đều tăng theo tải (đo được tuyệt đối lần đầu):**
>    (a) decode lag — nhãn chạy trước pixels 5–15f lúc vừa tải, tới
>    −58f (1,9 s) lúc tải nặng; (b) stale canvas sau seek — snapshot
>    gán nhãn 0 ngay sau seek về 0 nhưng pixels vẫn là frame 67–76
>    trước seek, tồn tại 4–8 tick, tăng theo tải (N1: 0 ghost; N2: 1;
>    N3: 3).
> 4. **Nhãn ghost nhiễu là CẤU TRÚC — và tệ hơn con số 41,1%:** 41,1%
>    của L7 được đo bằng matching chịu alias (lệch ±4k frame vẫn tính
>    clean). Với strip duy nhất, tỉ lệ nhãn ĐÚNG TUYỆT ĐỐI chỉ 25,5%
>    (N1, skp=0, mọi occurrence) — skp=1: ~80% ổn định cả 3 lượt,
>    skp=0: 25,5%/42,6%/41,2%. Sai số thường nhỏ (|lag|≤3 chiếm ~99%
>    ở N1) nhưng nhãn sai là trạng thái thường xuyên, không phải ngoại lệ.
> 5. **Ngưỡng WebKit: ĐỀ XUẤT SIẾT từ median ≤100 ms xuống median ≤60 ms:**
>    3 lượt M5 cùng fixture/cây, chỉ khác số hog: median 50,0 → 86,0 →
>    167,0 ms (0/1/3 hog) — tách rời rạc, không chồng lấn. Kết hợp L7
>    yên 40,5 và K7 tải 66,0: ngưỡng ≤60 ms cho qua đúng 2 lượt yên
>    (40,5; 50,0) và chặn đúng 3 lượt tải (66,0; 86,0; 167,0). p90 ≤90 ms
>    cũng tách đúng cùng 5 lượt (phụ chứng). Caveat: hiệu chuẩn từ n=5
>    lượt, N1 chưa thật yên (load5 3,58 lúc bắt đầu) — xem §5.
> 6. **F6' vẫn đứng trên cây + fixture mới:** bar (1)/(2) 61/61, 72/72,
>    55/55 (100%) ở cả 3 lượt, n≥30, 0 ứng viên ghost label==presented
>    cả 3 lượt — nhưng (2) vẫn là hệ quả của (1) (0 ứng viên). Bằng
>    chứng pixel độc lập mới nằm ở (b)/(c2) (§2), không nằm ở (2).
>    M5 KHÔNG tuyên bố đóng lại F6' (đã đóng từ L7).

## 0. Môi trường đo + prereg + cây đo

- **Boot trong lúc đo: 2026-11-14 05:16:36Z (reboot #40).** Gap
  #39→#40 = 2h25'48" (02:50:48 → 05:16:36Z) — dài nhất từ #32→#33
  (sàn 19'07" đã phá từ lâu, chỉ ghi nhận). Postboot-check PASS lúc
  05:38Z (đủ 10 package, plugin hệ thống 269 file).
- **Prereg:** `hidden_files/round111-m5/prereg-m5.md` — viết TRƯỚC lượt
  đo đầu, đăng ký hướng (B) fixture không tuần hoàn, 3 mức tải, bar /
  tiêu chí. Hai sửa đổi thiết kế TRƯỚC khi đo (ghi trong prereg + §1):
  bề rộng sọc 24–48 → 6–16 px + encode lossless (sau 2 lần gen FAIL
  tiêu chí (i)); cây đo đổi 9b27abe5 → c4198206 (M1 sửa production,
  xem §0.1).
- **Gate yên N1 KHÔNG đạt:** poll 15 phút (05:51–06:06Z) không có cửa
  (load1<2, load5<2, không lock, không blocker) — sóng tải M7 (4 hog
  node, load1 tới 27,05) + lock luân phiên giữa M6/M7/M1/M8/M3. Theo
  prereg, N1 chạy ở tải thấp nhất có thể và ghi rõ load (không gọi là
  "lượt yên"): bắt đầu load1 0,65 / load5 3,58, kết thúc 4,06 / 4,02.
- **RAM khả dụng:** 650 MB (lúc N1 lần 1 bắt đầu) – 2506 MB. Birefnet
  KHÔNG chạy (RAM dưới ngưỡng guard).
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb :193. Env launch GST như L7.
- **Protocol:** case B, 20 pass, `--disable-rvfc`, flip sau pass 5,
  tap ON + relabel ON, vite riêng :5184 (config tạm
  `vite.m5-temp.config.mjs`, HMR tắt, `server.watch.ignored:
  ["**/**"]`), driver `probe104f3-ghost-k7.webkit.mjs` tái dùng (bản
  copy M5, chỉ vá 1 lỗi crash xem §0.2).

### 0.1 Cây đo `c4198206…` — M1 đã sửa production đợt 111

- Lúc M5 bắt đầu (~05:38Z): preview.tsx md5 `9b27abe5…` (cây L1 đợt
  110). **05:46:19Z: M1 sửa production** (fix E4: đóng đuôi khi ended
  + ct>=duration-0,1s — `nextResumeGraceTail97Y4`, wiring + hook
  `__vcutTailEndedClosed111M1`; thêm `src/lib/playheadHold90R2.ts` +
  test; xem `hidden_files/round111-m1/round111-m1-status.md` +
  `md5-fixed.txt`). preview.tsx md5 mới:
  `c4198206cb916c0f1c6d8996330335a1`.
- M5 đo trên cây `c4198206…` (giống L7 đợt 110 đo trên cây L1-fix thay
  vì cây đóng băng). md5 kiểm trước/sau MỖI lượt đo — không đổi trong
  cả 3 lượt (c4198206 → c4198206).
- Xác minh M1 không đụng đường ghost: grep marker `111M1` /
  `endedClosed` / `Tail97Y4` trong preview.tsx cho 6 vị trí, TẤT CẢ
  trong code tail/resume (dòng 6252–6728), KHÔNG vị trí nào trong hàm
  ghost/ring/snapshot (`sampleStripeStrip`, `rvfcCaptureFrame`,
  compositeMotionBlur, skipLatest). Không có diff trực tiếp
  9b27abe5 → c4198206 (không có bản sao cây cũ local) — đây là bằng
  chứng gián tiếp mạnh nhất có được, ghi rõ giới hạn này.
- Hồi quy M5 tự chạy trên cây `c4198206…`: tsc exit 0, vite build
  PASS 11,40s, ghostBlend 15/15, previewEngine 27/27. (M1 cũng tự
  kiểm: playheadHold90R2 84 passed, tsc 0, vite build 0.)

### 0.2 Hai sự cố hạ tầng trong lúc đo (đã xử lý, không mất dữ liệu)

1. **N1 lần 2 crash sau 20 pass — lỗi probe, không phải lỗi sản phẩm:**
   `TypeError: job.expectCx is not a function` (dòng 758) — chế độ
   `--spec` đặt `expectCx: null` nhưng vòng phân tích offline gọi
   `job.expectCx(f.ph)` không guard (chỉ khối ASSERT mới guard). 20
   pass đã chạy tốt (seed OK, sanity count=30650, pause gStd ~115)
   nhưng JSON chưa ghi. M5 vá BẢN COPY probe (expectCx mặc định
   `() => 0.5` cho spec B — chỉ dùng cho chẩn đoán cxDev in-log,
   không ảnh hưởng JSON), `node --check` OK, chạy lại N1 lần 3 thành
   công (probe_exit=0). Lỗi này tồn tại từ gốc (mọi luồng `--spec`
   đều sẽ gặp) — vòng sau dùng `--spec` cần vá này.
2. **Lock script bị sửa giữa chừng làm acquire crash giả (06:21:07Z):**
   N1 lần 1 acquire THÀNH CÔNG ("ĐÃ GIỮ thread=m5 port=5184") nhưng
   process crash `port: unbound variable` (dòng 246) vì file
   `vcut-vite-lock.sh` bị sửa lúc 06:06:18Z (M8) trong khi acquire
   đang chạy (bash đọc script tăng dần → lệch offset). Run script
   hiểu nhầm là timeout và thoát; trap release cũng crash theo, để
   lại lock mồ côi owner m5/pid 22713 (đã chết). M5 kiểm đủ 3 điều
   kiện stale (pid chết + không vite :5184 + curl 000) và nhả tay
   bằng `release m5` (06:24:19Z, exit 0 — file lúc đó đã ổn định).
   Từ đó M5 dùng BẢN COPY đóng băng
   `round111-m5/vcut-vite-lock-m5.sh` (md5
   `502371e2fde3fabf7000c90489d07c46`, `bash -n` OK) cho mọi lượt sau.
   Bài học cho vòng sau: KHÔNG sửa lock script khi có acquire đang
   chạy; acquire đang chạy phải dùng bản copy đóng băng (M8 cũng gặp
   hiện tượng tương tự — xem log M8).
3. **Cạnh tranh lock:** N1 chờ acquire tổng ~25 phút (M6 → M7 ×3 →
   M1 → m3r2 → M5). M7 nhả rồi giữ lại ngay sau ~8 s (acquire thăm
   10 s có thể bỏ lỡ cửa — đúng cảnh báo trong spec lock M8). Lock
   từng do `chr-mixedalt-m3r1/r2/r3-fr4` (M3) giữ xen kẽ. Không có
   vụ việc stale-lock nào khác; không vite mồ côi sau các lượt M5
   (kill-vite + kiểm ps/curl sau mỗi lượt).

## 1. Fixture không tuần hoàn — thiết kế, tiêu chí, kết quả gen

**Chọn hướng (B), lý do (đăng ký trước):** (A) label-at-capture là thay
đổi production trong đường capture/snapshot (đổi ngữ nghĩa nhãn mà bar
F6' đang dựa vào), rủi ro hồi quy + xung đột với luồng sửa production
khác đợt 111; đo bằng (B) trước mới biết trễ thật bao nhiêu để quyết
có cần (A) không. (A) vẫn là nợ mở cho vòng sau nếu cần (xem §8).

- Video `stripes-nonperiodic.mp4`: 1280x720, 30 fps, 3 s (90 frame),
  sọc dọc đen/trắng cuộn 12 px/frame như `stripes-scroll.mp4` nhưng
  dãy sọc pseudo-random (seed screening, bề rộng sọc 6–16 px, xen kẽ
  đen/trắng), tổng dãy ~2559 px. Gen bằng
  `gen-nonperiodic-fixture.py` (PIL + ffmpeg libx264 crf 0 lossless,
  yuv420p) — deterministic từ seed; mp4 chỉ nằm local ở
  `apps/web/public/` (binary, KHÔNG stage); script gen ở hidden_files.
- GT strips: decode mp4 bằng ffmpeg ra 90 PNG `frames-nonperiodic/`,
  tính strip bằng đúng hàm `snap_strip` của analyzer L7 (resize
  640x360 BILINEAR, hàng y=180, x0=128, 48 px kênh G, ngưỡng >128).
- Spec: copy `b-blur.json` → `b.json` (chỉ đổi `src` thành
  `stripes-nonperiodic.mp4`), probe chạy `--spec b.json --media
  stripes-nonperiodic.mp4` (job name `b` nên analyzer tái dùng được).

| Lần gen | Thiết kế | Kết quả verify-fixture.py |
|---|---|---|
| 1 | sọc 24–48 px, crf 12 | FAIL (i): GT pairwise Hamming min=1 tại frames (5,22) — cửa sổ 96 px chỉ chứa ~3 sọc rộng nên 2 cửa sổ cách nhau 204 px trùng nhau gần hết |
| 2 | sọc 12–32 px, seed screening 200 seed (ngưỡng phân tích min≥8) | FAIL: min pairwise 0–4 ở MỌI seed — debug cho thấy strip 48-bit không phải 48 bit độc lập mà chỉ ~4–5 run do bề rộng sọc quyết định (mỗi run lượng tử hoá theo lưới 2 px), số mẫu strip khả thi chỉ ~10³–10⁴ nên va chạm là tất yếu |
| 3 | sọc 6–16 px, crf 0 lossless, seed screening 500 seed (ngưỡng min≥6) | **PASS**: (i) min pairwise = 6 tại frames (16,45); (ii) decode-vs-src flips max = 0 (mean 0,00); (iii) frame kề min = 28 (median 36); bit-1 min 17 / max 27 / median 22 |

- Seed được chọn ghi trong `fixture-seed.txt`. Mp4 140.828 byte.
- **Kiểm chứng in vivo (mạnh hơn verify offline):** cả 3 lượt đo,
  nomatch = 0/648, 0/484, 0/314 occurrence — mọi strip ghost đều khớp
  đúng 1 frame GT trong thresh ≤2. Fixture + pipeline GT hoạt động
  đúng như thiết kế trên dữ liệu thật.

## 2. Bằng chứng pixel độc lập + trễ tuyệt đối từng ghost (nợ 1)

Analyzer `analyze-m5-labellag.py` (copy L7, đổi FRAMES_DIR; lát (a)/(b)/
(c) như L7). Vì mọi strip đều match duy nhất 1 frame nên (a) ≡ (b) ở
cả 3 lượt — số dưới đây là (b).

| Lát cắt | N1 (0 hog) | N2 (1 hog) | N3 (3 hog) | L7 (tham chiếu, sọc tuần hoàn) |
|---|---|---|---|---|
| (b) unique-match n | **648/648 (100%)** | **484/484 (100%)** | **314/314 (100%)** | 0 (cả skp=1 và skp=0) |
| (d) nomatch | 0/648 (0%) | 0/484 (0%) | 0/314 (0%) | 0% |
| (b) skp=1: median / p90 / max | 0f / 2f / **+3f** | 0f / 0f / +68f* | 0f / 76f / +76f* | median 8f, max 16f |
| (b) skp=0: median / p90 / max | 1f / 3f / **+4f** | 0f / 2f / +68f* | 0f / 1f / +76f* | median 4f, max 16f |
| (b) skp=1: lag ≥5f / ≥10f | 0 / 0 | 4 / 4* | 24 / 24* | — |
| (b) skp=0: lag ≥5f / ≥10f | 0 / 0 | 3 / 3* | 9 / 9* | — |
| (b) lag âm nhỏ nhất | −15f | −14f | −58f | — |
| (c2) đáng ngờ thật: skp=1 n / skp=0 n (max lag) | 0 / 4 @1f | 0 / 0 | 0 / 0 | 7 / 64, max 16f |

\* Mọi lag ≥+5f đều là ghost stale sau seek (label 0, pixels 67–76,
xem §2.2) — KHÔNG phải trễ capture thông thường. Loại trừ chúng, trễ
dương max là +4f ở cả 3 lượt.

### 2.1 "Capture lag max 16f" của L7 là alias — bằng chứng

- Trên fixture mới, trễ dương (pixels mới hơn nhãn) max +4f (133 ms)
  ở cả 3 mức tải. Tập (c2) sụp từ n=7 (skp=1) / 64 (skp=0) ở L7 xuống
  n=0 / 4 / 0, và 4 ca ở N1 đều lag đúng 1f (seq 204, 254, 386, 436:
  presented 14/13/13/48, label 13/12/12/47).
- **Cụm seq 326–327 (label 6 → presented 22, lag 16f) KHÔNG tái diễn:**
  không occurrence nào có lag dương ≥5f ngoài ghost stale sau seek
  (§2.2); không cụm lag lớn nào lặp lại ở ≥2 lượt.
- Giải thích (đã được L7 cảnh báo ở §6.2 nhưng chưa đo được): với sọc
  tuần hoàn chu kỳ 4, một strip khớp cả {K, K±4, K±8, …}; lát (c2)
  của L7 chỉ kiểm "presented có thuộc M không" — trễ báo cáo
  (presented − label) là cận trên, có thể phóng đại tới 4k frame so
  với trễ thật. Fixture mới loại bỏ hoàn toàn mơ hồ này (min pairwise
  Hamming 6 > 2×thresh).
- Hệ quả cho bar (2): (2) vẫn 100% vì 0 ứng viên (xem §3) — nhưng nay
  đã có bằng chứng pixel ĐỘC LẬP thực sự: (b) với n lớn cho thấy
  pixels của ghost trong pool hầu như không bao giờ là presented
  (trừ 4 ca lag 1f ở N1, đều là ghost có label = presented−1, tức
  pixels đúng là presented nhưng nhãn trễ 1 frame — xem §2.3).

### 2.2 Hai cơ chế trễ thật (đo tuyệt đối lần đầu)

**(a) Decode lag — nhãn chạy trước pixels (lag âm).** Nhãn = frameIdx
từ currentTime lúc capture; pixels = frame đã giải mã xong lúc đó.
Dưới tải, GStreamer decode tụt sau đồng hồ media: label−pixels tăng
theo tải.

| | N1 (0 hog) | N2 (1 hog) | N3 (3 hog) |
|---|---|---|---|
| lag âm ≤−5f: số occurrence | 6/648 (0,9%) | ~60/484 (~12%) | ~53/314 (~17%) |
| lag âm nhỏ nhất | −15f (500 ms) | −14f (467 ms) | **−58f (1,9 s)** |
| dạng | 3 ghost, mỗi ghost tồn tại 2 tick | nhiều cặp 2 tick | nhiều cặp 2 tick + 1 ghost −58f tồn tại 3 tick (seq 85–86) |

Bằng chứng cơ chế (không phải suy đoán): mỗi ghost lag âm có cùng
(labelMs, snapMs) qua 2 tick, và labelMs→snapMs chỉ ~30–40 ms trong
khi lệch label−pixels tới 300–1900 ms (vd N2 seq 109/110: labelMs
35995, snapMs 36032 — chênh 37 ms — nhưng labelCt 1,717 (frame 51)
trong khi pixels là frame 37). Lệch không thể đến từ khoảng label→snap
mà đến từ decode tụt sau currentTime. Ví dụ cực đoan N3 seq 85–86:
label 58 (ct 1,933) nhưng pixels frame 0 — decoder kẹt ở frame 0 sau
loop restart trong khi currentTime đã chạy tới 1,93 s (stall tBlend
tới 8,9 s trong lượt này).

**(b) Stale canvas sau seek — nhãn 0, pixels 67–76 (lag dương lớn).**
Snapshot capture ngay sau seek về 0 (đầu pass mới, `setPlayhead(0)`):
nhãn = 0 (đúng theo currentTime sau seek) nhưng canvas vẫn giữ frame
trước seek vì chưa có frame mới được giải mã.

| | N1 | N2 | N3 |
|---|---|---|---|
| ghost stale sau seek (label 0) | 0 | 1 ghost (pixels 68), 7 occ, tồn tại 4 tick (seq 327–330) | 3 ghost (pixels 67/69/76), 33 occ |
| lag báo cáo | — | +68f (2,27 s) | +67/+69/+76f (2,2–2,5 s) |

Số 68/76f KHÔNG phải "trễ capture 2,3 s" theo nghĩa thông thường —
đó là pixels cũ trước seek bị gán nhãn mới sau seek. Phân biệt rõ
trong LIMITS này để vòng sau khỏi trích sai. Ghost stale tồn tại lâu
hơn khi tải nặng (N2: 4 tick; N3: tới ~7–8 tick mỗi ghost).

**Phụ: ghost trùng lặp trong 1 tick.** N2: 106/343 tick có 2 ghostPix
cùng labelMs (cùng snapshot xuất hiện 2 lần trong ghostPix của 1
tick — vd seq 327–329: 2 entry giống hệt nhau, label 0/pixels 68).
Chưa rõ là ring giữ trùng hay ghostPix liệt kê trùng vai trò; không
ảnh hưởng bar (1)/(2) (cả hai entry đều không phải presented). Nợ nhỏ
cho vòng sau nếu muốn điều tra.

### 2.3 Phân phối lag đầy đủ (histogram, unique-match)

- N1 (n=648): {−15:2, −12:2, −10:2, −1:38, 0:231, 1:147, 2:153, 3:71,
  4:2}. |lag|≤3 chiếm 642/648 (99,1%).
- N2 (n=484): {−14:15, …, 0:267, 1–2:37, 3–4:26, +68:7 (1 ghost)} —
  khối +1/+2 thu hẹp, khối âm phình ra (xem §4.3).
- N3 (n=314): {−58:3, −19:1, −18:3, −17:5, −16:4, −13:4, −12:2,
  −10:2, −5:4, −2:21, −1:41, 0:169, 1:14, 2:4, 3:2, 4:2, +67:11,
  +69:7, +76:15}. Median 0 ở cả 3 lượt.
- Lưu ý: chữ "LƯU Ý (a)/(b)" trong output analyzer M5 vẫn là text cũ
  của L7 (nói về sọc tuần hoàn) — text đó ĐÃ LỖI THỜI trên fixture
  mới, chỉ số mới là đúng. Analyzer chưa cập nhật text (ghi rõ để
  khỏi trích nhầm).

## 3. F6' trên cây + fixture mới (kiểm lại, không đóng lại)

Analyzer `analyze-m5-skiplatest.py` (copy K7, đổi FRAMES_DIR), tick hậu
flip+2000ms, viaRvfc=0.

| | N1 | N2 | N3 | L7 (tham chiếu) |
|---|---|---|---|---|
| nTick skp=1 (cần ≥30) | 61 | 72 | 55 | 53 |
| (1) nhãn: tick KHÔNG chứa ghost==presented | 61/61 (100%) | 72/72 (100%) | 55/55 (100%) | 53/53 (100%) |
| (2) pixel-verified: tick KHÔNG vi phạm thật | 61/61 (100%) | 72/72 (100%) | 55/55 (100%) | 53/53 (100%) |
| ứng viên ghost label==presented | 0 strip | 0 strip | 0 strip | 0 strip |
| (3) alias / đáng ngờ | 0 / 0 | 0 / 0 | 0 / 0 | 59 alias / 7 đáng ngờ (skp=1) |
| presented−expected \|gap\|≤3 | 324/324 (100%, đều =0) | — | — | 281/281 (100%) |

- Bar (1)/(2) đạt 100% cả 3 lượt, n≥30 — nhất quán với K7/L7 trên
  cây mới + fixture mới. **Nhưng (2) vẫn là hệ quả của (1)** (0 ứng
  viên cả 3 lượt, như K7/L7). Bằng chứng pixel độc lập thực sự là
  §2 — không phải (2).
- M5 KHÔNG tuyên bố đóng lại F6' (đã đóng từ L7). Nếu vòng sau muốn
  "đóng lại" trên cây mới thì phải định nghĩa lại bar (2) sao cho có
  ứng viên để kiểm — với cơ chế skip hiện tại, ứng viên label==
  presented gần như không bao giờ xuất hiện (đó chính là điều bar
  (1) đo).

## 4. Nhãn ghost nhiễu — xác nhận cấu trúc + đính chính con số 41,1%

### 4.1 Số đo trên cây hiện tại (fixture mới, matching tuyệt đối)

"Clean" ở đây = strip của ghost khớp đúng nhãn của nó (classify
`match_set` span=3/thresh=2). Với strip duy nhất thì clean ⟺ lag = 0
chính xác (xem §4.2 vì sao).

| Metric | N1 | N2 | N3 | L7 (sọc tuần hoàn) |
|---|---|---|---|---|
| distinct, skp=1: clean / determinable | 8/29 (27,6%) | 5/13 (38,5%) | 3/4 (75,0% — n quá nhỏ) | 15/28 (53,6%) |
| distinct, skp=0: clean / determinable | 25/144 (17,4%) | 29/89 (32,6%) | 21/60 (35,0%) | 37/90 (41,1%) |
| mọi occurrence, skp=1: clean | 97/121 (80,2%) | 122/131 (93,1%) | 85/86 (98,8%) | 87/100 (87,0%) |
| mọi occurrence, skp=0: clean | 134/519 (25,8%) | 145/283 (51,2%) | 84/165 (50,9%) | 164/327 (50,2%) |
| **tỉ lệ nhãn đúng tuyệt đối (clean / mọi occurrence)** | skp=1: 97/122 (79,5%); skp=0: 134/526 (25,5%) | skp=1: 122/144 (84,7%); skp=0: 145/340 (42,6%) | skp=1: 85/110 (77,3%); skp=0: 84/204 (41,2%) | — |

### 4.2 Đính chính: 41,1% của L7 bị alias thổi phồng

- Cơ chế thổi phồng (nói chính xác): `classify` gọi strip là "clean"
  khi strip khớp strip GT của chính nhãn (`dist(strip, gb[label]) ≤
  2`). Với sọc tuần hoàn chu kỳ 4 frame, `gb[label] == gb[true]` mỗi
  khi `label ≡ true (mod 4)` — nên clean ⟺ sai số nhãn là bội số của
  4 (gồm cả 0). Tức 41,1% đếm cả những ghost nhãn sai 4/8/12 frame.
  Với strip duy nhất, `gb[label] == gb[true]` chỉ khi `label ==
  true` — clean ⟺ lag = 0 chính xác. Hai con số đo hai thứ khác nhau;
  41,1% không phải tỉ lệ nhãn đúng tuyệt đối và không so được trực
  tiếp với 17,4%.
- **Kết luận cấu trúc vẫn đứng, và mạnh hơn:** nhãn ghost nhiễu không
  phải do tải (N1 ít tải nhất đã có tỉ lệ đúng tuyệt đối thấp nhất ở
  skp=0: 25,5%); nó là đặc tính của đường tick WebKit (anchor frameIdx
  từ currentTime lúc tick, tick thưa, tap vô dụng — L7 đã chứng minh
  tap 0/281; N1/N2/N3: anchorSrc hậu flip+2000ms toàn frameIdx, 324/
  242/157 tick, gap presented−expected đều = 0).
- **skp=1 luôn sạch hơn skp=0 một cách có hệ thống** (đúng tuyệt đối
  ~80% vs ~26–43% mọi occurrence, cả 3 lượt) — như K7/L7: khi pump
  bắt kịp (điều kiện để skipLatest=1) thì nhãn cũng chính xác hơn.
  Đây là tính chất ổn định nhất trong các số đo nhãn.
- **Caveat khi so sánh clean% giữa các lượt:** clean% trên
  "determinable" (loại nomatch) bị phình giả dưới tải — occurrence
  lag lớn (|lag|>3) thành "nomatch" và rời mẫu số (vd N3 skp=1:
  85/86 = 98,8% chỉ vì 24 occurrence stale +68f đã thành nomatch).
  Dùng tỉ lệ clean / MỌI occurrence (§4.1 hàng cuối) mới so được.
  Chênh skp=0 N1 (25,5%) → N2/N3 (~42%) chưa có cơ chế giải thích
  chắc chắn (khối lag +1/+2 thu hẹp dưới tải, khối lag 0 phình ra —
  xem §2.3; có thể do tick chậm → capture thưa → ghost tồn tại lâu
  và được lấy mẫu lặp lại; chưa chứng minh, ghi là câu hỏi mở).
- **Ảnh hưởng tới bar:** nhãn không đáng tin (chỉ ~26–43% đúng tuyệt
  đối ở skp=0) nhưng bar (1) vẫn đứng vì quyết định skip dựa trên
  nhãn; bar pixel (2) cần (b) để độc lập (nay đã có, §2). Nếu vòng
  sau muốn nhãn tốt hơn thì phải đổi cơ chế anchor/label trên WebKit,
  không phải chờ máy yên (kết luận này của L7 vẫn đứng).

## 5. Ngưỡng WebKit — hiệu chuẩn 3 mức tải + đề xuất siết xuống ≤60 ms

| Lượt | Fixture | Tải lúc bắt đầu (load1/load5) | Hogs của lượt | tickCost median | p90 | max | tBlend gap median | BlendTick/pass |
|---|---|---|---|---|---|---|---|---|
| L7 yên (đợt 110) | tuần hoàn | 0,31 / 1,78 (gate yên) | 0 | **40,5** | 64,9 | 94 | 77 | 19,5 |
| N1 (M5) | không tuần hoàn | 0,65 / 3,58 (không đạt gate yên) | 0 | **50,0** | 80,1 | 115 | 92 | 22,2 |
| K7 tải (đợt 109) | tuần hoàn | 2,13 / 3,97 | 0 (+ tải luồng khác) | **66,0** | 103,5 | 194 | 112 | 20,3 |
| N2 (M5) | không tuần hoàn | 6,49 / 5,34 | 1 | **86,0** | 105,0 | 271 | 122 | 17,1 |
| N3 (M5) | không tuần hoàn | 1,21 / 3,75 | 3 | **167,0** | 253,2 | 520 | 279 | 10,2 |

- Trong series M5 (cùng fixture, cùng cây, chỉ khác số hog): median
  50,0 → 86,0 → 167,0 — đơn điệu, tách rời rạc, không chồng lấn
  (khoảng cách 36 ms và 81 ms). tBlend gap cũng đơn điệu (92 → 122 →
  279). rAF/pass giảm đơn điệu (34 → 27 → 20).
- **Đề xuất: ngưỡng hợp lệ WebKit mới = tickCost median ≤60 ms**
  (thay ≤100 ms). Với 5 lượt hiện có, ≤60 ms cho qua đúng 2 lượt yên
  (40,5; 50,0) và chặn đúng 3 lượt tải (66,0; 86,0; 167,0) — biên
  50,0 → 66,0 (16 ms). Phụ chứng: p90 ≤90 ms cũng tách đúng cùng 5
  lượt (64,9; 80,1 | 103,5; 105,0; 253,2).
- **Caveat (ghi rõ, không giấu):** hiệu chuẩn từ n=5 lượt, trong đó
  2 lượt cũ dùng fixture khác (tickCost có thể lệch vài ms theo
  fixture — N1 50,0 vs L7 40,5 ở tải nền khác nhau nên chưa tách được
  ảnh hưởng fixture khỏi ảnh hưởng tải); N1 chưa thật yên (load5 3,58
  lúc bắt đầu) nên 60 ms có thể hơi lỏng — lượt yên thật trên fixture
  mới có thể cho median ~40–45 ms và cho phép siết tiếp xuống ~55 ms.
  Đề xuất này là "ngưỡng hiệu chuẩn tốt nhất hiện có", không phải
  hằng số vĩnh viễn; vòng sau đo thêm lượt yên trên fixture mới thì
  hiệu chuẩn lại.
- Nếu parent không chấp nhận đề xuất (vì n=5 còn mỏng): giữ ≤100 ms
  và ghi rõ nó KHÔNG phân biệt được tải (cả 5 lượt đều qua ≤100 ms
  trừ N3 167 ms — tức ≤100 ms chỉ chặn được tải rất nặng).
- Lưu ý: N3 post-flip median 133,0 < median toàn lượt 167,0 — tick
  sau flip rẻ hơn tick trước flip (đường tick ổn định dần); dùng
  median toàn lượt làm chuẩn như L7/K7 (không đổi định nghĩa).

## 6. Đo phụ: gStd spread + trail/edge (chẩn đoán, không vào bar)

Cả 3 lượt dùng fixture sọc HẸP nên các metric này KHÔNG so được trực
tiếp với L7/K7 (sọc rộng) — chỉ ghi số + giải thích.

| | N1 | N2 | N3 | L7 yên (tham chiếu) |
|---|---|---|---|---|
| gStd spread cửa sổ đã vẽ: median / max / nGroups | 8,9 / 45,6 / 71 | 5,0 / 42,8 / 25 | 7,9 / 34,8 / 9 | 0,6 / 76 / 48 |
| gStd spread + presented: median | 7,9 | 5,0 | 7,9 | 0,3 |
| nSkipped (mẫu loại khỏi nhóm) | 272 | 183 | 141 | — |
| trailMax / trailFramesGt0 | 7 / 158 | 7 / 75 | 7 / 55 | 0 / 0 |
| edgeLMed / edgeRMed (px) | 2,2 / 0,7 | 2,3 / 1,2 | 1,1 / 0,6 | 1,2 / 2,2 |
| edgeLMax / edgeRMax (px) | 208,5 / 237,0 | 141,2 / 228,8 | 91,6 / 255,6 | — |
| pause gStd (t=0,5/1/1,5) | ~115,6 / 114,6 / 116,6 | — | — | ~113,9 (pause) |

- **Spread 5–9 (so với 0,6 của L7) KHÔNG phải hồi quy sản phẩm:**
  (i) không đơn điệu theo tải (N2 5,0 < N1 8,9 < N3 7,9); (ii)
  pause baseline khớp L7 (~115 vs ~114) — blur gốc vẫn đúng; (iii)
  sọc hẹp làm gStd nhạy pha sub-pixel: cửa sổ blend lệch 1 frame
  (sọc dịch 12 px ≈ 1 bề rộng sọc) đổi hẳn tương phản hàng lõi, nên
  cùng nhãn cửa sổ vẫn cho gStd khác nhau nhiều qua các pass. Đây là
  độ nhạy của METRIC với fixture, không phải lỗi blend.
- **trailMax = 7 ở cả 3 lượt (không phụ thuộc tải), edgeMax ~90–256
  px trong khi median chỉ ~1–2 px:** heuristic mép/vệt (đi từ tâm
  mask ra tới khi hàng R rơi dưới ngưỡng) bị sọc hẹp đánh lừa — hàng
  lõi có hàng chục lần chuyển đen/trắng nên bước đi dừng sai chỗ,
  và vài pixel sáng nằm ngoài sharpLeft tính từ tâm mask (tâm mask
  ước lượng từ centroid nên jitter vài px khi sọc hẹp). Pause baseline
  cũng đã có trail=2 (lượt N1 lần 2 hỏng). Medians vẫn đúng → mask +
  mép vẫn tốt; chỉ các metric "max" này không dùng được trên sọc hẹp.
  Vòng sau nếu cần trail/edge thì đo trên sọc rộng hoặc sửa heuristic
  (vd quét vệt chỉ tính pixel R>128 LIỀN MẠCH từ mép mask).
- nGroups giảm theo tải (71 → 25 → 9): tick chậm → ít cửa sổ lặp lại
  qua pass; spread trên nGroups nhỏ (N3: 9) kém tin cậy hơn.

## 7. Kiểm chứng hồi quy (cây đo `c4198206…`, sau các lượt đo)

- `tsc` apps/web: **exit 0** (chạy 05:5xZ, sau fix M1).
- `vite build` (config gốc): **PASS 11,40s** (cảnh báo chunk >500kB
  có từ trước).
- `ghostBlend.probe.test.ts`: **15/15 PASS**.
- `previewEngine.test.ts`: **27 test passed**.
- preview.tsx md5 `c4198206…` không đổi trong suốt 3 lượt đo + hồi
  quy (kiểm trước/sau mỗi lượt trong chain-m5.log).
- Không sửa file production nào (M5 chỉ tạo config tạm vite + spec
  tạm trong hidden_files; mp4 fixture local-only ở public/, KHÔNG
  stage).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND111_M5_GHOST_PIXEL_LIMITS.md` — file này. **File
  duy nhất trong repo mà M5 thay đổi** (config vite tạm + spec + probe
  copy + analyzer + dữ liệu đo đều ở hidden_files; mp4 fixture ở
  public/ là binary local-only, KHÔNG stage).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round111-m5-ghost-pixel.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round111-m5/`
  (prereg-m5.md, probe104f3-ghost-k7.webkit.mjs [bản copy đã vá
  expectCx], analyze-m5-*.py, gen-nonperiodic-fixture.py,
  verify-fixture.py, fixture-seed.txt, frames-nonperiodic/ (GT decode
  từ mp4), frames-nonperiodic-src/ (PNG nguồn), stripes-nonperiodic.mp4,
  b.json, vite.m5-temp.config.mjs, vcut-vite-lock-m5.sh (bản copy đóng
  băng), run-m5.sh, poll-m5-quiet.sh, poll-m5.log, chain-m5.log,
  run-webkit-n{1,2,3}.log, vite-5184-m5-n{1,2,3}.log,
  preview-b-f3-flip-webkit-n{1,2,3}.json (2,9 / 2,2 / 1,7 MB),
  analyze-m5-{skiplatest,labellag,flip,tickcost}-n{1,2,3}.txt,
  progress.log).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền
  lệ L7: chỉ LIMITS + file repo; dữ liệu đo ở lại hidden_files, đủ để
  kiểm chứng lại).
- Cờ xong: `hidden_files/round111-m5-done` (tạo SAU KHI LIMITS + batch
  xong).

## 9. Nợ mở + đề xuất cho đợt sau

1. **(B) fixture không tuần hoàn ĐÃ XONG — bằng chứng pixel độc lập
   mạnh đã có.** Không cần đo lại (b) trên fixture này trừ khi cây
   ghost thay đổi.
2. **(A) label-at-capture vẫn mở:** nay đã biết trễ thật gồm decode
   lag (tới −58f lúc tải nặng) + stale sau seek (label 0 / pixels
   67–76). Nếu vòng sau làm (A) (gán nhãn lúc capture xong thay vì
   lúc bắt đầu, hoặc gán nhãn theo frame đã giải mã thay vì
   currentTime), đo lại bằng chính fixture này để so sánh trực tiếp
   (b) trước/sau. Lưu ý: (A) đổi ngữ nghĩa nhãn → bar F6' phải định
   nghĩa lại, không tự áp dụng bar cũ.
3. **Ngưỡng WebKit ≤60 ms (đề xuất mới, §5):** cần 1 lượt yên thật
   trên fixture mới để chốt (N1 chưa thật yên). Nếu lượt đó cho
   median ~40–45 ms thì giữ ≤60; nếu >60 ms thì hiệu chuẩn lại từ
   dữ liệu, không tự nâng ngưỡng sau khi thấy số.
4. **Nhãn ghost vẫn nhiễu (cấu trúc):** tỉ lệ đúng tuyệt đối chỉ
   ~26–43% (skp=0), ~80% (skp=1). Muốn nhãn tốt hơn phải đổi cơ chế
   anchor/label trên WebKit (vd anchor theo frame đã giải mã thay vì
   currentTime) — không phải chờ máy yên. Đề xuất này trùng hướng
   với (A).
5. **P1 (lượt đối chứng fixture tuần hoàn) KHÔNG CHẠY — lý do ghi
   rõ:** hết thời gian sau 3 lượt N + 2 sự cố hạ tầng (chờ lock ~25
   phút, acquire crash, probe crash); và giá trị biên đã thấp — (c2)
   + cụm 326–327 đã được trả lời tốt hơn bằng fixture mới, còn số
   41,1% đã biết là alias-inflated nên đo lại nó chỉ tái hiện một số
   đã biết là sai lệch. Nếu parent vẫn muốn P1 thì chạy lại protocol
   L7 đúng hệt trên cây c4198206 (ước ~15 phút khi có lock).
6. **Lock script bị sửa giữa chừng (M8, 06:06:18Z) làm acquire của M5
   crash giả + lock mồ côi (§0.2):** vòng sau (a) không sửa
   `vcut-vite-lock.sh` khi có acquire đang chạy, (b) acquire nên
   dùng bản copy đóng băng như M5 đã làm, (c) run script không nên
   diễn giải mọi exit != 0 của acquire là "timeout" (M5 đã sửa
   message trong run-m5.sh của mình).
7. **Probe `--spec` crash expectCx (§0.2):** mọi luồng dùng `--spec`
   đều gặp; đã vá trong bản copy M5 — vòng sau nên vá vào probe gốc
   hoặc luôn dùng `--cases`.
8. **Ghost trùng lặp trong 1 tick (106/343 tick ở N2):** chưa rõ cơ
   chế (ring giữ trùng hay ghostPix liệt kê trùng); không ảnh hưởng
   bar; điều tra nếu vòng sau đụng ring.
9. **Trail/edge max + gStd spread trên sọc hẹp (§6):** metric cũ
   không dùng được trên fixture mới; nếu cần các metric này thì đo
   trên sọc rộng hoặc sửa heuristic.
10. **Nợ khác đứng yên theo LIMITS gộp đợt 110 §4:** G1 chờ user
    quyết; mù #22 + mù #28 chờ user quyết; 2 MiB (queue2); E4 đã sửa
    xong đợt này (M1) — A/B xác nhận E4 là việc của M1, không phải M5;
    E6 đã đóng đợt 110 (L4); EPERM probe #30 + mù #29 (L6 đợt 110);
    birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml 403; release
    gate không đổi. Reboot #40 (05:16:36Z, gap #39→#40 = 2h25'48")
    đã qua, apt replay đủ (postboot PASS) — không còn nợ infra từ
    reboot này.
