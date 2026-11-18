# PHASE9_ROUND114_Q3_LOADBREAK_LIMITS.md — Điểm gãy tải: lượt dài s76 (70 clip) ĐÃ CHẠY + kiểm chứng chỉ số đói pump, đợt 114, luồng Q3

**Ngày:** 14/11/2026. **Luồng:** Q3 (Phase 9 đợt 114). **Chủ đề:** Điểm gãy
tải — lượt dài s76 (70 clip) + đăng ký chỉ số đói pump làm bar dự báo
(nợ ROUND113_LIMITS §10 mục 1 + §10 mục 4/6).
**Bối cảnh:** docs/PHASE9_ROUND113_P5_LOADBREAK_LIMITS.md (toàn bộ —
điểm gãy VẪN MỞ: biên GIỮ 9,59 (s71); s76 đợt 113 DEFERRED 2 lần vì
p1 giữ lock ~35 phút; control s75 GIỮ 1187 tick, 98,1% → s73 không
phải hiệu ứng build; playhead kẹt 0/2 lần thử chạy được (s77, s78);
tick rate ở tải ~28: 0,24–0,26/s),
hidden_files/round114-q3/prereg-q3.md (viết TRƯỚC mọi lượt probe) +
driver114q3.sh + driver114q3b.sh (resume) + analyze114q3.py,
docs/PHASE9_ROUND113_LIMITS.md §10, docs/VCUT_VITE_LOCK_FREEZE_SPEC.md
(protocol lock đóng băng).
**Build lúc viết prereg + suốt mọi lượt:** preview.tsx md5
`03bf029f09b8890b285eacc10a02172b` (khớp N1/N5/P5 — không đổi trong cả
luồng; mtimeChanged=false mọi lượt). **Boot lúc viết prereg:** uptime -s
**2026-11-14 13:17:42Z**, boot_id
`cd4cac0b-17a6-408d-8c4e-be163f96dc61` — **boot #45 (SỐ THỨ TỰ TẠM
THỜI**, kế thừa từ mù #31 chưa đóng; gap #44 (10:53:31Z) → #45 ≈
2h24'11", trong dải chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn).
**Reboot #46 = 2026-11-14 15:44:49Z** (boot_id
`7a0638c4-950a-45a0-a068-c290310fc0de`) GIỮA LUỒNG — xem §0.
F3 tap+relabel TẮT trong mọi lượt. Chỉ chạy chromium (đường rVFC).
Không probe WebKit → không chạy vcut-webkit-postboot-check.sh (chỉ
bắt buộc trước probe WebKit sau reboot; ghi rõ caveat). Không sửa
production. Không push GitHub, không release/tag, không TTS 39,
không birefnet. Repo local không có `.git` (bản làm việc; HEAD kiểm
qua public API bởi parent).

**Kết quả lớn nhất đợt này:**
- **(a) Lượt dài s76 (70 clip) ĐÃ CHẠY ĐƯỢC — lần đầu tiên hoàn
  thành** (exit=0, 210 s media, tường ~595 s phát + ~150 s trích).
  Nhưng **chỉ 47 blendTick — THIẾU ĐÚNG 3 TICK so với ngưỡng 50**
  nên KHÔNG HỢP LỆ để đóng khoảng. Điểm gãy **VẪN MỞ**; biên GIỮ
  giữ nguyên **9,59** (s71 đợt 112).
- **(b) Tick rate SỤP sâu hơn dự báo prereg:** s76 chỉ **0,09
  tick/s** (so với 0,26/s của s78 ở cùng mức tải) — toán tích tick
  prereg (~100 tick kỳ vọng) SAI vì tick rate không hằng số: nó
  suy giảm theo thời gian dưới tải kéo dài (nửa đầu 0,146/s, nửa
  sau 0,085/s; quý 1: 0,161/s → quý 2: 0,048/s). Cửa sổ cần để đủ
  50 tick: **530,2 s (~177 clip)** ở 0,09/s.
- **(c) Chỉ số đói pump — kiểm chứng đầu tiên, KHÔNG kết luận bar:**
  s76 tickRate 0,09/s + skip-stale-frame **44,26%** (54/122) → dự
  báo KHÔNG-GIỮ theo quy tắc prereg §2; phân loại offset là
  TRUNG-GIAN (không phải GIỮ) — hướng dự báo KHỚP, nhưng s76
  không hợp lệ (<50 tick) nên theo prereg **KHÔNG kết luận bar
  đạt/không đạt**. Đây mới là bằng chứng ban đầu (n=1 lượt mới).
- **(d) Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN — 0/3 lần thử thực
  chạy** (s77, s78 của P5 + s76 đợt này). Kiểm chứng độc lập từ mẫu
  thô stall-watch: cửa sổ 30 s nào playhead cũng tiến ≥4,63 s;
  cửa sổ 10 s nào cũng tiến ≥1,33 s. Vượt biên 21,0 s trong một
  nhịp 5,2 s (19,07 → 22,23) không chậm lại.
- **(e) Lock: 0 lần DEFERRED cho Q3 đợt này.** Ưu tiên lock lượt
  dài CÓ TÁC DỤNG: s76 acquire được ngay lần thử đầu (lock trống
  16:00:46Z). Dial-trước-acquire (fairness mới) hoạt động: dial
  ĐẠT 24,81 trước khi giữ lock; Q2 lấy lock ngay sau khi Q3 nhả.
- **(f) Reboot #46 giết driver giữa lúc chờ cờ Q5 + giết probe Q5
  đang kẹt; resume chạy được, dry trước reboot vẫn giữ nguyên
  hiệu lực.** Cờ Q5 về muộn 1'42" sau hạn chờ 60 phút — s76 chạy
  đúng hẹn theo prereg.
- **(g) Dụng cụ trích chunked CỨU lượt dài lần nữa:** riêng chunk
  D-state tốn **103,4 s** dưới renderer đói — eval cũ 60 s đã thua
  chắc chắn. 6/6 chunk OK, 0 lỗi.

---

## §0. Bối cảnh chạy (reboot #46 giữa luồng; driver chết rồi resume; Q5 kẹt rồi về muộn)

- **Boot #45 lúc viết prereg (13:17:42Z).** Dry chạy trên boot #45
  (14:55:33–14:56:18Z, exit=0). Không reboot nào trong lúc dry.
- **Reboot #46 = 2026-11-14 15:44:49Z** (boot_id `7a0638c4-…`,
  uptime 1 phút lúc 15:46:11Z). Gap #45 → #46 = **2h27'07"**,
  trong dải chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn. Số thứ
  tự #46 vẫn tạm thời (mù #31 chưa đóng).
- **Driver lần 1 chết vì reboot:** driver114q3 (pid 14886, setsid)
  chết lúc reboot; log dừng ở 15:41:38Z ("cho co Q5: 2700s/3600s")
  — đang chờ cờ Q5, chưa bắt đầu s76 nên KHÔNG mất lượt đo nào.
  Dry đã xong trước reboot nên vẫn giữ nguyên hiệu lực (kết quả
  trên đĩa còn đủ, md5 cây đo không đổi — đã kiểm lại sau reboot).
- **Resume (driver114q3b, 15:47:18Z):** bỏ qua dry (đã PASS),
  chờ cờ Q5 đến hạn tuyệt đối 15:56:38Z (hết 60 phút tính từ
  14:56:38Z lúc bắt đầu chờ ở lần 1), rồi chạy s76. Resume driver
  có log riêng driver114q3b.log + runner114q3b.out (không ghi đè
  log lần 1 — rút kinh nghiệm vụ P5 ghi đè runner113p5.out).
- **Q5 — cờ về muộn 1'42" sau hạn:** Q5 chạy sau Q3 ~14:48Z; lần
  1 lỗi launch WebKit (thiếu libevent — postboot #45 FAIL); lần 2
  chạy từ 15:12:02Z, chạy được pass 7–11 tới 15:12:58Z rồi **kẹt
  cứng** (probe 27:40 elapsed mà chỉ 2 s CPU, không flush log
  thêm, vite 5184 vẫn sống) cho tới khi reboot giết lúc 15:44:49Z;
  Q5 nhả lock sạch 15:45:10Z sau reboot. Q5 chạy lại (vite pid
  5493), nhả lock 15:49:13Z, cờ `round114-q5-done` tạo lúc
  **15:58:20Z** — muộn 1'42" so với hạn 15:56:38Z của Q3. Q3 chạy
  s76 đúng hẹn theo prereg §4 (hết 60 phút không thấy cờ thì vẫn
  chạy, ghi rõ caveat). Không có xung đột đo: cửa sổ yên của Q5
  đã kết thúc ~15:49Z (probe xong), cờ về lúc 15:58:20Z trong khi
  Q3 đang dial (chưa giữ lock; acquire lock 16:00:46Z sau khi cờ
  đã về). Ghi nhận đúng trình tự, không tuyên bố Q5 "xong trước".
- **RAM thấp rồi hồi sau reboot:** lúc viết prereg avail 687 MB;
  lúc launch driver lần 1 chỉ **392 MB**; sau dry vọt 2329 MB;
  lúc resume 1568–1694 MB; trong lúc s76 phát tối thiểu **349 MB**
  (driver sampler) / 380 MB (watcher). Không lần nào OOM hay dừng
  sớm vì RAM.
- **ENOSPC — 0 lần:** vite tạm `server.watch.ignored: ["**/**"]`
  + CFG_DIR riêng /tmp/round114-q3; mọi vite lên ngay attempt 1.
- **Tải nền của luồng đợt 114 khác:** Q1/Q2/Q7/Q8/Q9 resume sau
  reboot (load1 vọt 6,03 lúc 15:52Z); Q4/Q6 đã done trước reboot;
  Q5/Q7 done trong lúc Q3 chạy. Tải sibling có trong sampled mean
  (đó là tải probe thực sự chịu; ghi rõ, không tách).
- **Vite khác xen giữa:** lúc bắt đầu s76 lần 1, có vite lạ cổng
  5560 (pid 9698, config /tmp/round87-o8 — luồng khác resume sau
  reboot); driver chờ vite trống (wait_vite_free) rồi mới dial —
  đúng protocol nối tiếp.

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0, offset nhãn − kỳ vọng)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-dry | stripes-code-blur | chạy khô, không hog | — | **2,31** (n=4) | 1,5 | **313** | 32,55 | 235 | **0** (−1..+1) | 100% | **GIỮ** (chỉ validate dụng cụ, không tính bar) |
| chr-code-blur-s76 | stripes-code-blur | [15, 30] | ĐẠT 24,81 (40 hog) | **23,05** (n=119) | 51,2 | **47** | 0,09 | 85 | **+1** (0..+24) | 55,3% | TRUNG-GIAN (**không hợp lệ: n<50**) |

- **Dry (nclips=3, 9 s media, boot #45):** 313 tick, GIỮ — validate
  probe114q3 (xem §7). Chạy dưới tải sibling (load1 ~2,3) mà
  offset vẫn 100% trong ±1.
- **s76 (nclips=70, 210 s media, boot #46):** dial ĐẠT 24,81 lúc
  16:00:44Z (ổn định 2 mẫu, 40 hog) sau ~130 s dial; acquire lock
  ngay 16:00:46Z (lock trống); app boot OK 16:02:38Z; playhead
  209,4/210 s lúc tường 593,2 s; trích xong ~16:16Z; probe exit=0;
  driver done 16:16:37Z. **47 tick — thiếu đúng 3 tick** so với
  ngưỡng 50. Phân loại TRUNG-GIAN nhưng KHÔNG HỢP LỆ để đóng
  khoảng (prereg §7).
- **Không lượt nào GÃY** (0% ≤ −2 ở cả 2 lượt — s76 fracLeNeg2 =
  0,0%). Dạng lệch vẫn DƯƠNG (trung vị +1, mean +3,98, 44,7%
  tick ≥ +2, max +24).
- **Hai sampler độc lập khớp nhau về tải trong lúc phát:** probe
  loadSamples mean load1 **23,05** (n=119, median 22,98, min 0,49,
  max 48,98); driver sampler 5 s trong đúng cửa sổ phát mean
  load1 **24,0** (n=113, median 23,59, min 0,49, max 48,98).
  Chênh nhau 0,95 — mức tải trong lúc phát được đo chắc chắn ở
  ~23–24, không phải số đọc một phía.

## §2. Bar (a) — điểm gãy ở tải ~23: KHÔNG ĐÓNG ĐƯỢC (s76 thiếu 3 tick)

- **Điểm gãy: VẪN MỞ.** Biên GIỮ giữ nguyên **9,59** (s71, đợt 112).
  Không có lượt GÃY nào; không có lượt tải nào đủ ≥50 tick để
  phân loại (s76: 47 tick ở sampled mean 23,05).
- **Toán tích tick prereg SAI — và đã biết vì sao:** prereg tính
  ~103 tick từ tick rate s78 (0,26/s, lượt ngắn 112 s tường). Thực
  tế s76 chỉ 0,09/s. Tick rate KHÔNG hằng số — nó suy giảm theo
  thời gian dưới tải kéo dài:
  - Nửa đầu lượt (tBlend 0–249 s): 26 tick, **0,146/s**, trung vị
    off +3, 42,3% trong ±1.
  - Nửa sau lượt (tBlend 249–498 s): 21 tick, **0,085/s**, trung
    vị off 0, 71,4% trong ±1.
  - Theo quý: Q1 0,161/s (20 tick) → Q2 0,048/s (6 tick) → Q3
    0,088/s (11 tick) → Q4 0,080/s (10 tick).
  - Suy giảm mạnh nhất sau quý 1: rVFC callback đói dần khi tải
    kéo dài (pump skip-stale-frame 44,26% — xem §3). Lượt càng dài
    thì tick rate trung bình càng thấp — ngoại suy tuyến tính từ
    lượt ngắn ĐÁNH GIÁ THẤP độ đói của lượt dài. Bài học cho đợt
    sau: đừng tính cỡ lượt dài từ tick rate lượt ngắn.
- **Cửa sổ cần để đủ 50 tick (analyzer): 530,2 s (~177 clip)** ở
  0,09/s. Nhưng vì tick rate suy giảm theo thời gian, 177 clip
  chưa chắc đã đủ 50 tick — con số này là cận dưới lạc quan (giả
  sử rate giữ 0,09/s). Lượt dài hơn nữa cũng tốn tường ~25–30
  phút/lượt + trích ~150 s — cần cân nhắc hiệu quả trước khi chạy
  lượt 177 clip.
- **Dial vẫn không điều khiển được load1** (như N5/P5): dial ĐẠT
  24,81 rồi load1 dao động mạnh trong lúc phát (driver sampler:
  min 0,49, max 48,98; có đoạn load1 ~1 kéo dài trong khi 40 hog
  vẫn sống — xem §5). Chỉ sampled mean TRONG LÚC PHÁT đáng tin,
  và ở đây hai sampler khớp nhau (23,05 vs 24,0).

## §3. Bar (c) — chỉ số đói pump tức thời: kiểm chứng đầu tiên, KHÔNG kết luận

- **Quy tắc đã đăng ký trước (prereg §2):** tickRate = nBlendTick /
  wall_s; skipStale = số pump `decision == "skip-stale-frame"` /
  tổng số pump entry. Dự báo GIỮ iff tickRate ≥ 5/s VÀ skipStale
  ≤ 20%; dự báo KHÔNG-GIỮ iff tickRate < 1/s HOẶC skipStale > 35%;
  còn lại vùng xám. Bar ĐẠT iff s76 hợp lệ (≥50 tick) VÀ dự báo
  khớp phân loại offset.
- **Kết quả s76:** tickRate **0,09/s**, skipStale **44,26%**
  (54/122 pump; các decision còn lại: capture 44, skip-stale 22,
  skip-seeking 2) → dự báo **KHÔNG-GIỮ**. Phân loại offset:
  TRUNG-GIAN (không phải GIỮ) → hướng dự báo KHỚP với phân loại.
- **KHÔNG kết luận bar đạt/không đạt:** s76 không hợp lệ (47 <
  50 tick) nên theo prereg §2 chỉ báo hai số + vùng dự báo, không
  kết luận. Đây mới là bằng chứng ban đầu (n=1 lượt mới + 4 lượt
  tham chiếu hậu kiểm P5/N5); cần thêm lượt hợp lệ mới tuyên bố
  bar dự báo đã chứng minh.
- **Bằng chứng phụ (không tính bar):** dry run tickRate 32,55/s +
  skipStale 2,54% (6/236) → dự báo GIỮ, khớp phân loại GIỮ của
  dry (100% trong ±1). Nhất quán, nhưng dry là lượt validate dụng
  cụ, không tính vào bar.
- **Bảng tham chiếu cập nhật (thêm s76 vào dãy P5/N5):**

| lượt | phân loại | tick rate (/s) | skip-stale-frame | dự báo | khớp? |
|---|---|---|---|---|---|
| s75 (control) | GIỮ | 17,35 | 10,8% | GIỮ | có |
| s73 (N5) | TRUNG-GIAN | 1,6 | 40,3% | KHÔNG-GIỮ | có |
| s77 (P5) | TRUNG-GIAN (k.h.lệ) | 0,17 | 46,2% | KHÔNG-GIỮ | có |
| s78 (P5) | TRUNG-GIAN (k.h.lệ) | 0,26 | 41,0% | KHÔNG-GIỮ | có |
| **s76 (Q3)** | **TRUNG-GIAN (k.h.lệ)** | **0,09** | **44,26%** | **KHÔNG-GIỮ** | **có (hướng), chưa kết luận** |
| dry (Q3) | GIỮ (validate) | 32,55 | 2,54% | GIỮ | có |

  (k.h.lệ = không hợp lệ để đóng khoảng do <50 tick; "khớp" ở các
  lượt k.h.lệ chỉ là so hướng, không phải bar pass.)

## §4. Bar (b) — playhead kẹt ở biên clip 21,0 s: KHÔNG TÁI HIỆN (0/3 lần thử thực chạy)

- **Định nghĩa đăng ký trước (giữ nguyên P5):** stall = playhead
  tiến < 0,05 s trong bất kỳ cửa sổ tường 30 s nào khi playing=true;
  stall ở biên = playhead trong 0,1 s ngay trước một bội số của 3,0 s.
- **Kết quả:** s76: **0 episode stall** (97 mẫu watcher, tường
  5,7–590,7 s, playhead 1,07 → 207,23). **Tỉ lệ tái hiện gộp 0/3
  lần thử thực chạy** (s77, s78 của P5 + s76 đợt này; s76 đợt 113
  là lần thử #1 nhưng KHÔNG CHẠY nên không tính — Q3 KHÔNG tuyên
  bố "0/4").
- **Kiểm chứng độc lập từ mẫu thô (tính lại từ stall-watch.jsonl,
  không tin mù watcher):** cửa sổ 30 s nào playhead cũng tiến
  ≥ **4,63 s** (cửa sổ bắt đầu wallMs 127682, span 27,8 s); cửa sổ
  10 s nào cũng tiến ≥ **1,33 s** (bắt đầu wallMs 83184, span
  9,4 s). Playhead không đứng yên ở bất kỳ thang nào — kể cả thang
  ngắn hơn ngưỡng đăng ký 30 s. Vượt biên 21,0 s trong một nhịp
  5,2 s (19,07 → 22,23) không chậm lại.
- **Trạng thái element trong lúc phát (snapshot watcher):**
  - `seeking=true` thoáng qua ở element đang phát: 41 mẫu element
    (trên 97 mẫu watcher) — seeking theo từng lần chuyển clip,
    không kẹt (mẫu kế tiếp đã hết seeking và playhead đã tiến).
  - `decoderErrorRecoveredPlaying` = 0, `tickErrors` = 0 suốt lượt
    — đường phục hồi lỗi decoder (R6) KHÔNG kích hoạt lần nào.
  - **Dị vật — element chết y hệt s77 của P5:** đúng 1 element
    chết (ct=0, paused, readyState=0, networkState=3, error
    `4:MEDIA_ELEMENT_ERROR: Format error`, bufEnd=null) hiện diện
    trong CẢ 97 mẫu — element stale từ lúc seed/import (đã lỗi
    trước khi phát tiến), không phải element đang phát (element
    đang phát error=null, readyState=4, ct tiến theo playhead).
    Nó không chặn phát (ticks vẫn ghi, playhead vẫn tiến) và không
    đổi trong suốt lượt nên không phải cơ chế của vụ kẹt s72 lần 1.
    Đây là lần thứ 2 liên tiếp xuất hiện (s77 P5 + s76 Q3) — pool
    giữ element lỗi từ đầu lượt là pattern lặp lại, không phải sự
    cố một lần (xem §9 mục 9).
  - `playing=false`: 0/97 mẫu — store tưởng đang phát suốt lượt.
- **Đánh giá H1–H4 (đăng ký trước):** stall không tái hiện lần thứ
  3 liên tiếp nên KHÔNG có bằng chứng mới cho hay chống lại giả
  thuyết nào. H1 (step-seek không xong) / H2 (lỗi decoder) / H3
  (pause-retry/tail-gate) / H4 (pipeline Chromium đói) đều vẫn mở
  như trước — nhưng với **0/3 lần thử** ở đúng điều kiện s72 lần 1
  (nclips≥20, dial [15,30], load đỉnh ~49, playhead ratio ~0,42),
  vụ kẹt 3,5 phút của s72 lần 1 trông càng giống sự kiện hiếm/khó
  tái hiện hơn là hành vi hệ thống. Theo prereg §6: cân nhắc hạ
  mức ưu tiên (xem §9 mục 2).
- **Caveat watcher:** khoảng cách giữa các mẫu watcher tới 12,0 s
  (median 5,9 s) dưới tải (cadence danh nghĩa 5 s; eval watcher
  timeout 20 s, mẫu khuyết không phá vòng chờ). Một stall < ~12 s
  có thể lọt giữa hai mẫu — nhưng stall mục tiêu dài ~3,5 phút
  nên không bị ảnh hưởng; và kiểm chứng 10 s ở trên dùng đúng các
  mẫu đã có nên kết luận "không stall ≥10 s" là vững.

## §5. Dị thường mới — load1 sụp giữa lượt trong khi hog vẫn sống (cơ chế throttle)

- **Hiện tượng:** dial ĐẠT 24,81 (16:00:44Z), probe ghi loadAtPlay
  48,85, nhưng trong lúc phát load1 có đoạn rơi về ~0,25–1,15
  kéo dài (driver sampler 5 s: min 0,49; ví dụ 16:07:24–16:07:46Z
  load1 1,15 → 0,81) trong khi **40 hog vẫn sống** (pgrep 41 tiến
  trình `Math.sqrt`, hog-count.txt = 40) và threadsR vẫn ~45–52.
  Sau đó load1 vọt lại 42,34 (16:10:16Z) rồi 27,16 — dao động
  mạnh, không phải decay một chiều như s77 của P5.
- **Cơ chế (diễn giải, có bằng chứng):** mỗi hog chỉ tích ~20 s
  CPU sau 9:40 elapsed (~3,5% CPU/hog) — 41 hog × ~3,5% ≈ 1,4
  CPU, đúng trần CPU chia sẻ của cell (~1,5 CPU). Hogs bị throttle
  bởi cgroup quota: task bị throttle không còn counted là runnable
  nên load1 đọc thấp dù hàng đợi runnable (threadsR) vẫn ~50.
  Load1 trong môi trường này KHÔNG đo được "tải CPU thật" khi hog
  vượt quota — nó đo số task đang chạy trong cửa sổ throttle.
  Bằng chứng: threadsR mean 51,2 (probe) / 50,0 (driver, cửa sổ
  phát) bám sát số hog + sibling, trong khi load1 dao động 0,49–
  48,98. **Hệ quả cho đợt sau:** đừng tin "dial ĐẠT" hay "load1
  sụt" theo nghĩa đen trong cell này — tải thật phải đọc qua
  threadsR + tick rate + skip-stale (chỉ số đói pump §3), và
  sampled mean load1 chỉ có nghĩa khi kèm threadsR.
- **Caveat:** diễn giải throttle là suy luận từ số đo (CPU time/
  hog + threadsR + load1), không phải đo trực tiếp cgroup
  cpu.stat. Ghi rõ để luồng sau kiểm chứng nếu cần — không dùng
  diễn giải này để phân loại lượt (phân loại vẫn theo offset §0
  và sampled mean load1 23,05 như prereg).

## §6. Metric thay thế + offset100 (mô tả, không phân loại)

- **offset100 (CHỈ MÔ TẢ, như prereg):** s76 n=110, trung vị −23,
  mean −13,91, 8,2% trong ±1, 61,8% ≤ −5 (dải −31..+18); dry n=90,
  trung vị +1, 63,3% trong ±1, 0% ≤ −5. offset100 suy thoái mạnh
  theo mức đói tick (càng ít tick, pres trong snapshot càng stale
  so với ph) — đúng như đã đăng ký: nền nhiễu ±3 trên control yên,
  không dùng được để phân loại. Giá trị −23 của s76 phản ánh tick
  starvation (47 tick / 498 s tường), không phải bằng chứng trễ âm
  của blendTick (trung vị blendTick s76 là +1, 0% ≤ −2).
- **Caps coverage sụp sau ~9 s media:** s76 chỉ có 85 caps, mà
  73/85 thuộc clip c2 (c0: 6, c1: 6, c2: 73) — sampler (rAF +
  interval 10 ms) gần như không chụp được gì sau clip c2 dưới tải
  kéo dài. BlendTick (rVFC pump) vẫn ghi 47 tick suốt lượt. Đây là
  bằng chứng độc lập thứ hai cho đói main-thread (cùng với tick
  rate suy giảm §2) — sampler chết trước, pump chết sau.
- **threads-R:** dry 1,5 / s76 51,2 — bám theo số hog đang sống +
  sibling, không bám CPU thật (như M7/N5/P5). Không đề xuất thay
  load1, nhưng là chỉ số phụ bắt buộc kèm theo khi báo tải (xem §5).
- **Tick rate:** 32,55/s (dry, 9 s) / 0,09/s (s76) — sụp theo tải +
  độ dài lượt; dùng để tính cửa sổ cần thiết (§2), không làm metric
  chính.
- **Playhead ratio:** 0,936 / 0,421 — media clock chậm lại dưới tải
  nặng, như N5/P5 (s76 chậm hơn s78: 0,421 so với 0,534 — tải kéo
  dài hơn).
- **Gate v2 (mô tả):** ĐẠT ở s76, KHÔNG ĐẠT ở dry (đúng vì dry
  không tải). s76 TRUNG-GIAN (không hợp lệ) mà vẫn đạt gate — đạt
  gate v2 không suy ra presented GIỮ (như M7/N5/P5).

## §7. Dụng cụ trích kết quả (tái dùng P5 — CỨU lượt dài lần nữa)

- **Thiết kế (giữ nguyên P5):** trích cuối chia 6 chunk (A blend/
  pump/tick 180 s; B caps-metadata 180 s; C px theo lát 50 cap
  120 s/lát; D state100/draws 180 s; E scalars 60 s), ghi part file
  ngay khi nhận; snapshot từng phần mỗi 60 s; stuck watcher 5 s.
  Probe114q3 = copy byte của probe113p5, chỉ đổi SCRATCH/CFG_DIR
  (diff 4 dòng, node --check PASS).
- **Kết quả:** 2/2 lượt chạy trích đủ dữ liệu, **0 chunk lỗi**
  (extraction.errors = [] cả 2 lượt):

| lượt | A-blend | B-caps | D-state | E-scalars | C-px (lớn nhất) |
|---|---|---|---|---|---|
| dry | OK | OK | 133 ms | 3 ms | 1.666 ms (5 lát) |
| s76 | 2.317 ms | 6.015 ms | **103.380 ms** | 2.505 ms | **25.602 ms** (lát 0–50), 15.913 ms (lát 50–85) |

- **Bằng chứng quyết định:** riêng chunk D-state đã tốn 103,4 s
  dưới renderer đói — eval cũ gộp toàn bộ payload trong 60 s (N5)
  đã thua chắc chắn ở lượt này. Tổng thời gian trích ~150 s. Trích
  chunked không còn là "cải tiến" mà là điều kiện cần để lượt dài
  có dữ liệu. Snapshot từng phần (`frame-parity-partial.json`) cũng
  có mặt ở cả 2 lượt (bảo hiểm incremental, lần này không cần dùng
  tới vì trích cuối thành công).
- **Không đổi logic đo:** metric chính vẫn blendTick rVFC; sampler/
  caps/state100 giữ nguyên; diff probe114q3 vs probe113p5 chỉ gồm
  4 dòng đổi tên (đã soát).
- **Analyzer:** copy analyze113p5.py → analyze114q3.py (đổi S5 +
  tag dry/s76; THÊM mục tính tickRate + skipStale + dự báo bar (c)
  — chỉ thêm báo cáo, không đổi công thức phân loại cũ). **2 lỗi
  nhỏ do Q3 tự phát hiện + sửa trước khi báo cáo:** (i) dòng ghi
  file .txt còn sót tên cũ `analyze113p5.txt` (đã sửa thành
  analyze114q3.txt, chạy lại — số liệu không đổi); (ii) analyzer
  tìm hog file theo tên `hog-load-<tag>.txt` trong khi driver đặt
  tên theo attempt (`hog-load-<tag>-attempt1.txt`) nên hogDriver
  báo n=0 ở lần chạy đầu (đã thêm fallback glob, chạy lại —
  hogDriver n=196, mean load1 19,35). Cả hai chỉ ảnh hưởng báo cáo,
  không ảnh hưởng số đo.
- **Driver:** driver114q3.sh (dựa trên driver113p5b.sh, đã sửa bug
  `set -u` ở `boundary_stall_seen` + dial TRƯỚC acquire + chờ cờ
  Q5 + tối đa 3 lần thử s76 + ghi status.txt + ghi owner lock khi
  DEFERRED) và driver114q3b.sh (resume sau reboot — bỏ qua dry,
  chờ cờ Q5 đến hạn tuyệt đối 15:56:38Z). **1 bug do Q3 tự phát
  hiện + sửa trước khi chạy:** `run_s76` đọc `$?` sau khối `if`
  nên mất exit code 2 (hết giờ) — đã sửa thành gán `rc=$?` ngay
  sau lệnh gọi. Driver chạy đủ tới "done" 16:16:37Z; lock đã nhả
  sạch (cleanup cuối bị từ chối đúng vì Q2 đã giữ lock — không
  phải lỗi).

## §8. Kiểm chứng (cây cuối, md5 03bf029f)

- `tsc --noEmit` (apps/web): **0 lỗi** (16:21:32Z, trên build
  03bf029f, boot #46).
- `vite build`: **pass (10,97 s)** (16:21:45Z, trên build 03bf029f;
  chậm hơn P5 6,56 s — cache lạnh sau reboot, không phải lỗi).
- Không sửa production trong luồng này; preview.tsx md5 cuối
  `03bf029f09b8890b285eacc10a02172b` (khớp lúc viết prereg, cả
  trước và sau reboot).
- Probe copy `probe114q3-frame-parity.mjs`: node --check PASS trước
  lượt đầu + sau reboot (kiểm lại 15:46Z); diff với probe113p5 chỉ
  gồm 4 dòng đổi tên.
- Analyzer `analyze114q3.py` (trong `hidden_files/round114-q3/`):
  tính lại toàn bộ từ results json thô; bảng §1 khớp output analyzer
  (đếm lại từ đĩa, không tin mù log driver). Đã sửa 2 lỗi báo cáo
  (§7) và chạy lại — số liệu headline không đổi.
- Stall: kiểm chứng độc lập từ stall-watch.jsonl thô (§4) — khớp
  kết luận watcher (0 episode).
- Lock đã nhả sạch sau s76; Q2 giữ lock ngay sau đó (bình thường);
  không vite mồ côi (kiểm ps + lock status TRỐNG sau lượt cuối;
  vite build ở §8 chạy sau khi lock đã trống).

## §9. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng).** Biên GIỮ vẫn 9,59
   (s71 đợt 112). Không có điểm GÃY nào. s76 TRUNG-GIAN nhưng
   không hợp lệ (47 < 50 tick — thiếu đúng 3 tick). **Đợt sau:
   hoặc chạy lượt dài hơn (~177 clip theo tính toán, nhưng tick
   rate suy giảm theo thời gian nên 177 clip chưa chắc đủ 50 tick
   — cần tính lại bằng rate nửa sau 0,085/s → ~590 s tường, ~197
   clip, tường ~30 phút/lượt); hoặc tìm metric presented không
   phụ thuộc mật độ tick rVFC (nợ gốc từ P5).** Cân nhắc hiệu quả:
   lượt 70 clip đã tốn ~19 phút (dial + phát + trích); lượt ~200
   clip tốn ~35–40 phút.
2. **Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN 0/3 lần thử thực chạy
   (s77, s78, s76).** Đề xuất hạ mức ưu tiên: sự kiện hiếm, đã 0/3
   ở đúng điều kiện s72 lần 1; H1–H4 vẫn mở, chưa có bằng chứng
   mới. Nếu còn theo đuổi thì cần lượt dài hơn nữa (nhiều biên clip
   hơn) hoặc đổi cách kích hoạt — không tích mẫu mù thêm.
3. **Chỉ số đói pump (bar (c)): mới kiểm chứng lần đầu, CHƯA kết
   luận.** Cần thêm lượt HỢP LỆ (≥50 tick) để đối chiếu dự báo với
   phân loại. Ngưỡng hiện tại (tickRate ≥5/s + skipStale ≤20% →
   GIỮ; tickRate <1/s hoặc skipStale >35% → KHÔNG-GIỮ) khớp hướng
   trên 5 lượt (s73/s75/s77/s78/s76) + dry — nhưng 4/5 trong số đó
   là hậu kiểm hoặc không hợp lệ. Đợt sau đăng ký lại bar này trên
   lượt hợp lệ đầu tiên.
4. **load1 không đo được tải thật khi hog vượt CPU quota (mới, §5):**
   load1 sụp về ~1 trong khi 40 hog vẫn sống + threadsR ~50. Đợt
   sau báo tải kèm threadsR + tick rate + skip-stale; đừng tin
   "dial ĐẠT" hay "load1 sụt" theo nghĩa đen trong cell này.
5. **Element chết với format error — lần thứ 2 liên tiếp (mới, §4):**
   1 element stale (ct=0, readyState=0, error 4) tồn tại suốt lượt
   s76 (97/97 mẫu), y hệt s77 của P5 — pool giữ element lỗi từ đầu
   lượt là pattern lặp lại, không phải sự cố một lần. Cần luồng
   khác kiểm xem pool có giữ element lỗi quá lâu không (vệ sinh
   pool, không phải lỗi đo). Không ưu tiên cao.
6. **Dial tải bằng hog vẫn không điều khiển được load1** (xem §2):
   đừng tin "dial ĐẠT" — chỉ tin sampled mean TRONG LÚC PHÁT
   (kèm threadsR, xem mục 4).
7. **Gate v2 không suy ra presented GIỮ** (đạt ở cả lượt TRUNG-GIAN).
8. **offset100 không dùng được để phân loại** (nền nhiễu ±3; suy
   thoái theo đói tick — xem §6).
9. **Q5 kẹt cứng rồi bị reboot giết (quan sát ngoài phạm vi Q3,
   ghi để Q5/Q9 đối chiếu):** probe WebKit của Q5 (lần 2) kẹt ở
   pass ~12/20, 27:40 elapsed mà chỉ 2 s CPU, không flush log —
   không phải do Q3 (Q3 đang chờ, không giữ lock, không chạy hog
   trong lúc đó). Q5 đã tự xử lý sau reboot (cờ done 15:58:20Z).
10. Các nợ ngoài phạm vi Q3 (giữ nguyên từ LIMITS gộp đợt 113 §10):
    G1 deinterlace (chờ user quyết), mù #22/#28/#29/#30 (chờ user
    quyết), E4 cần đợt xác nhận tải cao, ring 8 MiB đo lag push/take
    trực tiếp, zombie chẩn đoán cơ chế chuyển clip, ngưỡng WebKit
    ≤60 ms cần 1 lượt yên thật, postboot-check #45 FAIL apt replay
    (Q7 đợt 114 đang xử lý), ENOSPC (vite nối tiếp bắt buộc;
    watch.ignored giữ), birefnet (CẤM thử lại khi RAM chưa đổi),
    TTS 39 (CẤM kiểm lại), ci-security.yml 403 (chờ user), release
    gate giữ nguyên.

---

## File đổi/thêm (đợt 114 Q3)

- `apps/web/scripts/probe114q3-frame-parity.mjs` — probe copy
  probe113p5, chỉ đổi SCRATCH/CFG_DIR (diff 4 dòng; node --check
  PASS; **48.898 byte > 37.768 — ghi chú rõ cho lúc push**).
- `docs/PHASE9_ROUND114_Q3_LOADBREAK_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round114-q3/` (không stage): prereg-q3.md,
  driver114q3.sh + driver114q3.log + runner114q3.sh +
  runner114q3.out (driver lần 1 — chết vì reboot 15:44:49Z lúc
  đang chờ cờ Q5), driver114q3b.sh + driver114q3b.log +
  runner114q3b.sh + runner114q3b.out (resume — chạy đủ tới done
  16:16:37Z), analyze114q3.py + analyze114q3.txt/.json/.stdout.txt,
  vcut-vite-lock-frozen.sh (bản copy đóng băng của vcut-vite-lock.sh,
  md5 khớp repo `fd21193c…`), hog-count.txt,
  hog-load-chr-code-blur-s76-attempt1.txt (sampler driver 5 s;
  dry không có file sampler vì không hog), status.txt, 2 thư mục
  lượt probe dry/s76 (mỗi thư mục có frame-parity-results.json +
  part files + frame-parity-partial.json + stall-watch.jsonl + .log
  + vite-attempt1.log; s76 không có stall-events.json vì 0 episode;
  dry có 313 tick, s76 có 47 tick).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).
