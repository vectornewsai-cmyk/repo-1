# PHASE9_ROUND110_L2_2MIB_LIMITS.md — L2: offset +4.194.304 trên c8 + tách biến ring + attribution fresh-element

> Luồng L2, Phase 9 đợt 110 (VCut Studio). Chạy: 2026-11-14 02:50Z –
> 03:35Z (14/11 09:50–10:35 +07). Boot #37 lúc bắt đầu, REBOOT #38 giữa
> 02:45–02:54Z (uptime reset "up 3 min" lúc 02:54Z). Repo local
> `~/workspace/repo-1`.
> **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push sau từ main chat.
> ĐO LƯỜNG thuần túy — KHÔNG sửa file production nào.
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4`
> (2.139.973 B) + c8 cùng thư mục (8.182.985 B) + c16 tự tạo (c8 loop 2×
> stream-copy, 16.365.151 B, 64 s, probe-only, KHÔNG stage).
> **Cấm:** TTS 39, birefnet, `.github/workflows/*`. Prereg:
> `hidden_files/round110-l2/prereg-l2.md` (viết TRƯỚC khi chạy, ngân sách
> 14 run hợp lệ/mỏng — đã dùng 14/14).

## Kết luận chính (TL;DR)

1. **Dự đoán offset +4.194.304 trên c8 ĐÃ XÁC NHẬN (nhiệm vụ 1):** c8
   blob-file, ring 4 MiB, wall 30 s → CẢ 2 RUN đều có 14 spliced pulls,
   toàn bộ delta đúng +4.194.304 (req_off 9939/48426/66916/80895/97529/
   114176/126851, typefind + qtdemux0, ms ~12,2–12,5 s). 0 pull +2.097.152.
   Lever quyết định là wall dài (30 s → ~5,3 flood, so với H r4 đợt 109
   chỉ ~2,5 flood trong 10 s → 0 splice).
2. **Tách biến: RING-BUFFER-MAX-SIZE quyết định offset splice (nhiệm vụ 2),
   KHÔNG phải max-size-bytes.** S1 (max-size=1 MiB + ring=4 MiB): 0/2
   splice. S2 (max-size=4 MiB + ring=1 MiB): 1/2 bogus, delta đúng
   +1.048.576 (= ring, KHÔNG phải max-size 4 MiB — nếu max-size quyết
   định thì phải +4.194.304 hoặc 0 splice vì ring 4 MiB > file 2,1 MB).
   DOT đối chiếu: queue2 node mang đúng cặp giá trị tách của từng cấu hình.
3. **Attribution fresh-element: ĐÃ GÁN ĐƯỢC splice cho từng playbin
   (nhiệm vụ 3) — và fresh-element KHÔNG tránh được splice.** Cả 2 run
   đều bogus (r1: 2 pulls; r2: 6 pulls, chữ ký J2/K2). Chuỗi bin-add đầy
   đủ: r1 2/2 pull → blob-media-player-2; r2 2 pull đầu → blob-media-
   player-1, 4 pull sau → blob-media-player-2. Splice xảy ra trên CẢ HAI
   blob pipeline, gồm blob-2 (player blob cuối trước khi phát) ở cả 2 run.
   Dư: chưa phân biệt tuyệt đối blob-1/blob-2 cái nào là el2 (xem §5).
4. **Tỉ lệ bogus trên c8 wall dài (nhiệm vụ 4):** 1/2 (ring mặc định,
   wall 30 s); gộp K2 (wall 10 s, 1/2) = 2/4. Flaky ~50%, không phải
   xác định. Run sạch (F r1) và run bogus (F r2) khác nhau ở số flood:
   3,36 (sạch, 1 instance, không restart) vs 7,53 (bogus, restart).
5. **c16 ring 4 MiB: 0 splice trong 4 run** (E 2 run cửa sổ hẹp + G 2 run
   phủ hết wall sau khi nâng PULL_CAP). Flood 16 MB KHÔNG tạo lag đủ nếu
   pipeline phát sạch một mạch không restart — biến vận hành dường như là
   số lần writer vượt reader (gắn với restart/re-flood), không phải kích
   thước flood (giả thuyết, chưa chứng minh trực tiếp).
6. **Đề xuất production (nhiệm vụ 5 — CHỈ ĐỀ XUẤT, CHỜ QUYẾT): KHÔNG đưa
   "chặn set-lại ring" thành sửa production.** Lý do: cơ chế chặn là
   LD_PRELOAD shim chặn GStreamer nội bộ — không thể ship trong web app;
   và queue2 do WebKit tạo nội bộ, repo không có API nào đổi được
   ring-buffer-max-size của nó. Mitigation "ring > file" chỉ khả thi khi
   ring vượt kích thước file lớn nhất (không giới hạn được với video user).
   Hướng production thực tế: giữ fallback http hiện có (đã cứu được phát
   lại sau splice ở mọi run bogus), và đo hướng tránh đường splice bằng
   preload đầy đủ trước seek (G6 §8.5c, chưa đo) ở đợt sau — không quyết
   hộ ở đây.

## 1. Prereg và tuân thủ

- Prereg viết trước mọi probe (`hidden_files/round110-l2/prereg-l2.md`):
  7 nhóm A–G, ngân sách cứng 14 run; tiêu chí tách biến + attribution
  + xác nhận offset đăng ký trước.
- Thực hiện: 14/14 run hợp lệ/mỏng (A2 B2 C2 D2 E2 F2 G2), 0 run vô hiệu
  (không run nào 0 frames/stall hoàn toàn — khác K2: đợt này không có
  run stall dù tải có lúc lên 35).
- Shim L2 = copy shim J2 (md5 gốc `e46dc0e4…`) + vá: (i) 2 env riêng
  `L2_QUEUE2_MAX_SIZE_BYTES` / `L2_QUEUE2_RING_BUFFER_MAX_SIZE`;
  (ii) log `L2PLAYBIN` (playbin + playbin3 — phát hiện giữa lượt: WebKit
  dùng **GstPlayBin3**, factory `playbin3`, nên bản shim đầu chỉ bắt được
  playbin thường); (iii) hook `gst_bin_add` (`L2BINADD`); (iv) PULL thêm
  `el=<ptr>`; (v) nhóm G nâng `PULL_CAP` 400 → 2000.
  Md5 shim theo lượt: A `5f229860…` (bản đầu) → B–F `357f89d8…` (playbin3)
  → G `b208e8de…` (PULL_CAP 2000). Runner L2 ghi shimMd5 vào JSON env
  mỗi lần chạy.
- `preview.tsx` md5: `ced42efd…` lúc 02:40Z (đầu phiên) → L1 sửa thành
  `9b27abe57975ec5b69ec2e21c3fa281c` lúc 02:54:12Z (trước lượt A). **Mọi
  run probe đều dùng preview 9b27abe5** (ghi trong JSON env). `media.ts`
  mtime 2026-11-12 — KHÔNG đổi trong suốt lượt, nên bundle probe
  (đường media pool) ổn định qua các lượt. `round-in-progress.md` không
  tồn tại lúc chạy → không bị chốt chặn.
- Runner L2 = copy runner K2 (port 8940, Xvfb :197, OUT 110l2), thêm mode
  L2SPLIT/L2C8LAG/L2C16LAG/L2C8RATE/L2C8LOOP/L2FRESH + clip c16 + ghi
  previewMd5/shimMd5 vào JSON env. Runner KHÔNG dùng vite (http server +
  esbuild riêng) nên không đua watcher ENOSPC. Xvfb :197 đã tắt sau lượt G.

## 2. Bảng quyết định (mọi con số offset từ `l2_offsets_110.py`, đọc trực tiếp từ clip)

| Nhóm | Cấu hình | Run | Bogus (spliced pulls) | Error-event | Instances | Frames / finalCt | Verdict |
|---|---|---|---|---|---|---|---|
| A | c8 blob-file, ring 4 MiB, wall 30 s | r1 | YES (14, +4.194.304) | 0 | 2 (qtdemux0/1) | 84 / 10,25 s | **Offset +4.194.304 XÁC NHẬN** |
| A | c8 blob-file, ring 4 MiB, wall 30 s | r2 | YES (14, +4.194.304) | 0 | 3 (qtdemux0/1/2) | 11 / 13,33 s | Như trên (cùng 7 req_off) |
| B=S1 | c2 blob-file, max-size=1 MiB + ring=4 MiB | r1 | NO (0, 396 EXACT) | 0 | 1 | 148 / 8 s | Tách biến hướng 1: sạch |
| B=S1 | c2 blob-file, max-size=1 MiB + ring=4 MiB | r2 | NO (0, 396 EXACT) | 0 | 1 | 178 / 8 s | Như trên |
| C=S2 | c2 blob-file, max-size=4 MiB + ring=1 MiB | r1 | NO (0, 396 EXACT) | 1 | 2 | 189 / 8 s | Error có nhưng không splice |
| C=S2 | c2 blob-file, max-size=4 MiB + ring=1 MiB | r2 | YES (2, +1.048.576) | 1 | 2 | 187 / 8 s | **Delta = ring (1 MiB), không phải max-size** |
| D | fresh-element c2, ring mặc định | r1 | YES (2, +2.097.152) | 1 | 2 | 165 / 8 s | Splice → blob-player-2 |
| D | fresh-element c2, ring mặc định | r2 | YES (6, +2.097.152) | 1 | 2 | 186 / 8 s | Splice → blob-player-1 (2 pull) + blob-player-2 (4 pull) |
| E | c16 blob-file, ring 4 MiB, wall 30 s | r1 | NO* (0, 798 EXACT) | 0 | 1 | 669 / 28,70 s | *Cửa sổ hẹp (cap ms 19143) |
| E | c16 blob-file, ring 4 MiB, wall 30 s | r2 | NO* (0, 798 EXACT) | 0 | 1 | 618 / 29,30 s | *Cửa sổ hẹp (cap ms 16876) |
| F | c8 blob-file, ring mặc định, wall 30 s | r1 | NO* (0, 798 EXACT) | 0 | 1 | 486 / 29,20 s | *Cửa sổ hẹp (cap ms 17299) |
| F | c8 blob-file, ring mặc định, wall 30 s | r2 | YES (8, +2.097.152) | 1 | 2 | 420 / 27,96 s | Tỉ lệ c8 wall dài 1/2 |
| G | c16 blob-file, ring 4 MiB, wall 30 s, cap 2000 | r1 | NO (0, 1368 EXACT) | 0 | 1 | 192 / 25,92 s | Phủ hết wall (last pull ms 30446) |
| G | c16 blob-file, ring 4 MiB, wall 30 s, cap 2000 | r2 | NO (0, 1110 EXACT) | 0 | 1 | 18 / 20,08 s | Phủ hết wall (last pull ms 33500) |

- Gộp với K2: blob-file c2 ring mặc định 3/4 bogus (K2) + S2-ring-1MiB 1/2;
  blob-file c2 ring 4 MiB 0/5 (K2 0/3 + S1 0/2); ring 8 MiB 0/2 (K2);
  c8 blob-file ring mặc định 2/4 (K2 1/2 + L2-F 1/2); c8 ring 4 MiB 2/2
  bogus +4.194.304 (L2-A); c16 ring 4 MiB 0/4 (E 0/2 cửa sổ hẹp + G 0/2
  phủ hết wall); fresh-element 2/2 bogus (K2-E) + 2/2 bogus (L2-D, đã
  gán được playbin).
- Mẫu chữ ký splice: nhóm A req_off 9939/48426/66916/80895/97529/114176/
  126851 (7 vị trí, typefind + qtdemux0, ms ~12,2–12,5 s); nhóm F r2 có
  4/7 vị trí sau của cùng dãy (80895/97529/114176/126851, ms 2317–2369);
  nhóm D/S2 giữ chữ ký c2 cũ (req_off 0/3179/41666). Offset luôn đúng
  đúng bằng ring-buffer-max-size, không pull nào lệch.

## 3. Tách biến — ring-buffer-max-size quyết định (nhiệm vụ 2)

- S1 (max-size=1 MiB, ring=4 MiB): L2Q2 cả 2 run đọc lại đúng
  max-size-bytes=1048576 + ring-buffer-max-size=4194304 (OK); J2Q2SET
  override ring 2097152→4194304; DOT: queue2 node mang đúng cặp
  1048576/4194304 (3 file). 0 splice, 0 error, 1 instance, playOk=true.
- S2 (max-size=4 MiB, ring=1 MiB): L2Q2 cả 2 run đọc lại đúng
  max-size-bytes=4194304 + ring-buffer-max-size=1048576 (OK); J2Q2SET
  override ring 2097152→1048576; DOT: queue2 node mang đúng cặp
  4194304/1048576 (3 file). r2 bogus 2 pulls delta đúng +1.048.576.
- Suy luận quyết định: nếu max-size-bytes là vòng ring thì S2 (ring 4 MiB
  > file c2 2,1 MB) không thể wrap → phải 0 splice; thực tế splice xảy
  ra ở đúng +1.048.576 = ring-buffer-max-size. Đây là phản-ví-dụ trực
  tiếp bác "max-size-bytes quyết định", theo tiêu chí prereg. Chiều ngược
  lại (S1 0/2) chỉ là "phù hợp với ring quyết định" (n=2), nhưng kết hợp
  với phản-ví-dụ S2 r2 thì verdict "ring-buffer-max-size quyết định
  OFFSET" đứng được. Caveat: S2 r1 0 splice dù ring chỉ 1 MiB (có error +
  restart nhưng không splice) — tỉ lệ xảy ra vẫn flaky; verdict này là
  về OFFSET (biến nào quyết định delta khi splice xảy ra), không phải
  về tỉ lệ tuyệt đối.
- Hệ quả cho mitigation: đổi max-size-bytes một mình (vd qua playbin
  `buffer-size`? — cần kiểm tra nó map vào property nào) có thể VÔ TÁC
  DỤNG nếu nó không đổi ring-buffer-max-size. Mọi đề xuất mitigation
  phải nhắm đúng ring-buffer-max-size (xem §6).

## 4. Attribution fresh-element (nhiệm vụ 3)

- Shim L2 sau khi vá playbin3 bắt đủ 4 playbin/run, theo thứ tự tạo
  (cùng đồng hồ shim với PULL):
  - r1: regular-media-player-0 (ms 697, factory playbin) →
    blob-media-player-1 (ms 810, playbin3) → blob-media-player-2
    (ms 1069, playbin3) → regular-media-player-3 (ms 1141, playbin).
  - r2: regular-0 (ms 525) → blob-1 (ms 573) → blob-2 (ms 722) →
    regular-3 (ms 861).
- Chuỗi bin-add đầy đủ (qtdemux → parsebin → urisourcebin →
  uridecodebin3 → playbin), suy tên bin "?" lúc add bằng con trỏ qua các
  dòng khác (script `l2_attrib_110.py` đã sửa bug strip newline):
  - r1: 2/2 pull splice (ms 1132) → **blob-media-player-2** (tạo ms 1069,
    splice 63 ms sau khi tạo).
  - r2: 2 pull đầu (ms 671) → **blob-media-player-1** (tạo ms 573);
    4 pull sau (ms 761–762) → **blob-media-player-2** (tạo ms 722,
    splice 39 ms sau khi tạo).
- regular-3 tạo 9 ms (r1) / 99 ms (r2) SAU pull splice cuối — khớp
  fallback http sau error-event (đường media.ts: error handler thu hồi
  blob + đổi src về http → pipeline http mới). Đây là bằng chứng độc lập
  rằng error/fallback xảy ra SAU splice, không phải trước.
- **Verdict:** fresh-element KHÔNG tránh được splice — splice xảy ra trên
  cả hai blob pipeline, gồm blob-2 (player blob cuối cùng trước khi phát)
  ở cả 2 run. Caveat còn lại: chưa phân biệt tuyệt đối blob-1/blob-2 cái
  nào là el2 (element mới) và cái nào là element phụ do vòng poll
  `videoFor` tạo thêm — cần log phía page (dropElement/videoFor + thứ tự
  element) mới gán el1/el2 tuyệt đối. Nhưng kết luận "fresh-element vẫn
  splice" không phụ thuộc vào đó, vì cả hai blob pipeline đều splice.
- Phát hiện phụ (cho đợt sau): WebKit dùng **GstPlayBin3** (factory
  `playbin3`) cho blob URL, còn `playbin` thường cho http URL — shim các
  đợt trước chỉ hook `playbin` nên đã bỏ sót mọi lần tạo blob player.
  DOT xác nhận: label `<GstPlayBin3>\nblob-media-player-0\n...uri="blob:..."`.

## 5. Caveat bắt buộc + vận hành

1. **n nhỏ:** mỗi cấu hình chỉ 2 run. 0/2 chỉ là "phù hợp", không phải
   chứng minh — trừ các verdict bác-bỏ bằng phản-ví-dụ (S2 r2 bác
   max-size-bytes; D bác fresh-element tránh splice).
2. **Đồng hồ khác nhau:** page-clock vs shim-clock (ms) vs GST-clock có
   gốc khác nhau, KHÔNG so trực tiếp được. Mọi kết luận thứ tự chỉ dùng
   thứ tự TRONG cùng một log (shim-clock cho playbin/splice; page-clock
   cho error/fallback — riêng regular-3 tạo sau splice là so trong
   shim-clock, chắc chắn).
3. **Tải máy + reboot:** reboot #38 (02:45–02:54Z) cắt giữa chuẩn bị và
   lượt A; load dao động 0,66 ↔ 37,12 theo sóng hog của luồng khác
   (30 hog `python3 -c while True`); các lượt hợp lệ đều chạy trong cửa
   yên (load1 0,66–6,86 lúc bắt đầu lượt), trừ lượt A bắt đầu lúc load
   5,72. Không run nào stall hoàn toàn đợt này. RAM khả dụng lúc chạy
   727–4597 MB (thấp nhất lúc lượt A: 727 MB lúc chờ, 1497–1747 MB trong
   run — run c8 vẫn mỏng: 84/11 frames nhưng PULL ≥ 620 nên verdict
   offset không phụ thuộc frames).
4. **playOk=false ở nhóm A:** play() timeout 10 s do metadata chậm tới
   t=12,5–17 s (RAM thấp + tải), nhưng pipeline vẫn phát (84/11 frames,
   finalCt 10,25/13,33 s, PULL 620/759 ≥ 100, GST 349/441 KB) → hợp lệ
   theo thực hành J2/K2; bằng chứng splice là byte đọc trực tiếp.
5. **PULL_CAP 400 (shim H2/J2):** nhóm E + F r1 chạm cap (400 pull/
   element, last pull ms ~17–19 s) nên "0 splice" của chúng chỉ có giá
   trị trong cửa sổ quan sát. Nhóm G (cap 2000) đã đóng caveat này cho
   c16: phủ hết wall 30 s (last pull ms 30446/33500), vẫn 0 splice.
   Nhóm A/F r2 không chạm cap (số pull/element < 400 nhờ restart chia
   pull sang instance mới) nên verdict của chúng không bị ảnh hưởng.
6. **Tên case trùng E/G trong JSON:** nhóm G dùng lại tên case
   `Lc16-l2C16LAG-run1/2` nên JSON có 4 case cùng tên (2 E + 2 G, phân
   biệt bằng trường `date`: E 03:14:21/03:14:52Z, G 03:18:49/03:19:37Z)
   VÀ file pull/gst thô của E đã bị G ghi đè (runner unlink trước mỗi
   run). Kết quả phân tích của E vẫn còn nguyên trong JSON summary +
   `l2-progress.md` (0 splice, cap ms 19143/16876, frames 669/618) — mất
   chỉ là file log thô, không mất verdict. Bài học: lượt chạy lại phải
   đổi tag/startIdx (đã ghi vào progress để đợt sau tránh).
7. **L1 sửa production giữa lượt:** preview.tsx đổi md5 lúc 02:54:12Z
   (ced42efd → 9b27abe5); mọi run probe dùng 9b27abe5. `media.ts` không
   đổi (mtime 2026-11-12) nên bundle probe ổn định. Nếu L1 sửa media.ts
   ở đợt sau thì các run trước/sau không còn so được trực tiếp — cần ghi
   md5 media.ts vào JSON env (nợ nhỏ, xem §7).
8. **Cơ chế "writer vượt reader hơn một vòng ring" vẫn là GIẢ THUYẾT**
   giải thích dữ liệu (offset = đúng ring-buffer-max-size; ring càng lớn
   càng khó splice; c16 không restart → không splice dù flood 16 MB),
   chưa đo trực tiếp lag push/take tại thời điểm splice. Đừng trích dẫn
   như kết luận đã chứng minh.

## 6. Đề xuất production — mitigation ring (nhiệm vụ 5, CHỜ QUYẾT)

Đề xuất (không phải quyết định — chờ user/main-chat quyết):

1. **KHÔNG đưa "chặn set-lại ring" (shim J2b/L2) thành sửa production.**
   - Nó là LD_PRELOAD chặn `g_object_set`/`gst_element_factory_make`
     trong WebProcess — một web app không thể ship cơ chế này; và
     queue2 do WebKit tạo nội bộ, repo không có API nào chạm tới nó.
   - Giá trị thật của shim là chẩn đoán (đã xác định đúng biến:
     ring-buffer-max-size), không phải là code sửa.
2. **Mitigation "ring > file" không khả thi dạng hằng số.** Đã đo: ring
   4 MiB tắt splice trên c2 (2,1 MB) nhưng KHÔNG tắt trên c8 (8,2 MB,
   splice +4.194.304); ring 8 MiB tắt trên c2 (K2-G) nhưng chưa đo trên
   c8. Video user có thể hàng trăm MB–GB nên không có mức ring cố định
   nào phủ hết. Muốn theo hướng này phải đổi ring ĐỘNG theo kích thước
   file — mà repo không có đường đổi (xem mục 1).
3. **Hướng production thực tế nhất hiện có: giữ nguyên + đo tiếp.**
   - Fallback http hiện có đã cứu phát lại sau mọi run bogus (finalCt
     tới cuối clip ở các run có error; không run nào kẹt vĩnh viễn).
     Tác hại user thấy chỉ là giật/lỗi thoáng qua rồi phát tiếp, không
     phải video hỏng.
   - Hướng tránh đường splice ở tầng repo (không đụng WebKit): preload
     đầy đủ trước seek (G6 §8.5c, chưa đo) — đề xuất đo ở đợt sau thay vì
     quyết mitigation ngay bây giờ.
   - Nếu sau này có đường can thiệp WebKit (vd Playwright/GStreamer env
     hoặc nâng cấp WebKit cho phép set `buffer-size` của playbin), thì
     mục tiêu đúng phải là **ring-buffer-max-size** (không phải
     max-size-bytes) và phải lớn hơn file lớn nhất — đã có bằng chứng
     đợt này để đặt spec.

## 7. Nợ mở cho đợt sau

1. **Gán el1/el2 tuyệt đối cho attribution:** log phía page khi
   dropElement/videoFor tạo element mới (thứ tự + identity), rồi đối
   chiếu với L2PLAYBIN ms — để kết luận blob-1 hay blob-2 là element mới.
2. **G6 §8.5c — preload đầy đủ trước seek:** hướng tránh splice duy nhất
   còn lại ở tầng repo, chưa đo.
3. **Ring 8 MiB trên c8:** chưa đo (K2 chỉ đo trên c2) — cần để biết
   "ring > file" có tắt splice trên c8 không (dự đoán: có, vì 8 MiB
   ~ file 8,2 MB vẫn nhỏ hơn file một chút — thực ra 8.388.608 >
   8.182.985 nên vừa đủ; đáng đo 2 run).
4. **Ghi md5 media.ts (+ entry bundle) vào JSON env** để phát hiện L1
   (hoặc luồng khác) sửa đường media giữa các lượt.
5. **Tên case duy nhất khi chạy lại cùng mode** (tag/startIdx khác) để
   không ghi đè log thô như E/G đợt này.
6. Nợ đứng yên từ đợt 107/108/109 (xem LIMITS gộp đợt 109 §4 + §7):
   G1 + mù #22 chờ user quyết, re-arm A/B tắt E4, zombie gate (b), blur
   B-band, cụm A, ghost C3b, harness E1, EPERM probe #29 + mù #28,
   ENOSPC vite nối tiếp bắt buộc, xử lý bền vững WebKit sau reboot,
   birefnet 0 lần thành công, TTS 39 CẤM kiểm lại, ci-security.yml 403,
   release gate.

## 8. Batch stage (KHÔNG push)

`phase9-round110-l2-2mib.txt` (5 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_110l2_2mib.mjs` (runner L2: copy
  runner K2, port 8940, Xvfb :197, OUT 110l2, thêm clip c16 + mode
  L2SPLIT/L2C8LAG/L2C16LAG/L2C8RATE/L2C8LOOP/L2FRESH + ghi previewMd5/
  shimMd5 vào JSON env)
- `benchmarks/render/l2_offsets_110.py` (đọc offset thực từng pull —
  tổng quát hoá k2_offsets: kiểm tra delta +1.048.576 / +2.097.152 /
  +4.194.304; đã kiểm chứng lại trên log K2: khớp 6/0/2 pulls)
- `benchmarks/render/l2_attrib_110.py` (gán pull splice cho playbin qua
  chuỗi bin-add + suy tên bin "?" theo con trỏ; đã kiểm chứng trên cả
  2 run nhóm D)
- `benchmarks/results/webkit-blob-flaky-110l2-2mib.json` (14 case: A2 B2
  C2 D2 E2 F2 G2; lưu ý 2 tên case Lc16 trùng E/G — phân biệt bằng
  trường date, xem §5 mục 6; mọi case đều có j2/l2Queue2* + gstPluginPath)
- `docs/PHASE9_ROUND110_L2_2MIB_LIMITS.md` (file này)

Không stage binary (`.so` ở lại `hidden_files/round110-l2/`, như tiền lệ
H2/I3/J2/K2; shim L2 có 3 md5 theo lượt: 5f229860 / 357f89d8 / b208e8de).
Không stage c16.mp4 (binary, clip probe-only trong clips-faststart).
Dữ liệu thô đầy đủ ở `hidden_files/round110-l2/` (prereg, gst/pull/dot,
progress, shim `l2_queue2_probe.c` + `.so`) — NGOẠI TRỪ file pull/gst thô
của nhóm E đã bị nhóm G ghi đè (xem §5 mục 6); DOT của E vẫn còn (tên file
có timestamp riêng). KHÔNG push.
