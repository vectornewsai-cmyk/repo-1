# PHASE9_ROUND115_R3_LOADBREAK_LIMITS.md — Điểm gãy tải: lượt dài s77 (197 clip) ĐÃ CHẠY, 1526 tick, nhưng LAI do R2 sửa production giữa lượt + soi lại s76 bằng cửa sổ 10 s, đợt 115, luồng R3

**Ngày:** 14/11/2026. **Luồng:** R3 (Phase 9 đợt 115). **Chủ đề:** Điểm gãy
tải (VẪN MỞ) + soi lại stall-watch s76 bằng cửa sổ hẹp (nợ ROUND114_LIMITS
§10 mục 3 + §10 mục 12b, theo QUYẾT PARENT 3 ngày 14/11).
**Bối cảnh:** hidden_files/round114-q3/prereg-q3.md +
docs/PHASE9_ROUND114_Q3_LOADBREAK_LIMITS.md (toàn bộ — s76 47 tick, thiếu
3 tick, KHÔNG hợp lệ; tick rate suy giảm theo thời gian; bar (c) kiểm
chứng lần đầu, chưa kết luận) + docs/PHASE9_ROUND114_LIMITS.md §3 + §10
mục 3 (đính chính Q9: claim cửa sổ 10 s ≥1,33 s SAI, freeze ~12 s ở ph
44,77 + tiến chậm 0,77 s/8,5 s ở ph ~109–110 s) +
hidden_files/round115-r3/prereg-r3.md (viết TRƯỚC mọi lượt đo mới) +
driver115r3.sh + analyze115r3.py + analyze115r3-partA.py +
analyze115r3-s77stall.py, docs/VCUT_VITE_LOCK_FREEZE_SPEC.md.
**Build lúc viết prereg:** preview.tsx md5
`03bf029f09b8890b285eacc10a02172b` (khớp N1/N5/P5/Q3 — không đổi).
**Boot lúc viết prereg:** uptime -s **2026-11-14 15:44:49Z**, boot_id
`7a0638c4-950a-45a0-a068-c290310fc0de` — **boot #46 (SỐ THỨ TỰ TẠM
THỜI)**. **REBOOT #47 = 2026-11-14 17:45:50Z** (boot_id
`5578af38-911d-4f3b-93b0-383a1664f225`) xảy ra NGAY SAU khi viết prereg
(lần kiểm tra 17:46:10Z của R3 vẫn thấy boot #46; mốc 17:45:50Z là số
ghi trực tiếp từ uptime -s, chênh ~40 s có thể do đồng hồ VM chưa đồng
bộ ngay sau boot — ghi rõ, không giấu). Gap #46 (15:44:49Z) → #47
(17:45:50Z) = **2h01'01"** — trong dải chứng nhận [19'07", 3h14'08"],
KHÔNG phá sàn. Số thứ tự #47 vẫn tạm thời (mù #33 đã mở, nay chứa cả
#46 và #47). **Mọi lượt đo mới của R3 (dry + s77) chạy trên boot #47.**
RAM khả dụng lúc viết prereg 428 MB; sau reboot hồi lên 3197 MB (lúc
khởi động driver) — RAM không còn là yếu tố hạn chế trong lượt này
(freeMB tối thiểu trong lúc s77 phát: 461 MB, không OOM).
Headroom inotify sau reboot: probe R9 dừng ở 1092 watch (ENOSPC) —
vite tạm `watch.ignored` vẫn bắt buộc.
F3 tap+relabel TẮT trong mọi lượt. Chỉ chạy chromium (đường rVFC).
Không probe WebKit → không chạy vcut-webkit-postboot-check.sh. Không
sửa production (R3 không sửa; xem §0 về việc R2 sửa). Không push
GitHub, không release/tag, không TTS 39, không birefnet. Repo local
không có `.git` (bản làm việc; HEAD kiểm qua public API bởi parent).

**Kết quả lớn nhất đợt này:**
- **(a) Phần A — soi lại s76 bằng cửa sổ 10 s: XÁC NHẬN ĐẦY ĐỦ đính
  chính Q9.** Cửa sổ 30 s: min advance 4,63 s (khớp LIMITS Q3) → 0
  stall theo định nghĩa 30 s, tỉ lệ kẹt 0/3 vẫn đứng. Cửa sổ 10 s
  (P8, mọi cặp [8,10]s): min advance **0,00 s**, đúng **2 cửa sổ
  <1,33 s** — (130594→139502, 0,00 s) và (322693→331214, 0,77 s).
  Freeze ph 44,7667: 3 mẫu liên tiếp đứng yên, 11,82 s, playing=True,
  **cách biên clip 45,0 s đúng 0,23 s** (ngoài cửa sổ 0,1 s đã đăng ký
  cho "stall ở biên", nhưng là freeze GẦN biên). Load1 trong lúc
  freeze chỉ 6,75–8,56 (thấp hơn nhiều so với mean lượt 23,05) —
  freeze KHÔNG xảy ra lúc tải đỉnh.
- **(b) Lượt dài s77 (197 clip) ĐÃ CHẠY — 1526 blendTick (gấp 30 lần
  ngưỡng 50), phân loại GIỮ theo offset (trung vị 0, 80,1% trong ±1,
  0,4% ≤ −2) ở sampled mean load1 25,1 — NHƯNG LAI: preview.tsx đổi
  giữa lượt (03bf029f → a419ae05, mtime 18:04:52Z, ~23 s sau khi phát
  bắt đầu) do luồng R2 sửa production (fix zombie) đúng lúc s77 đang
  phát. Theo luật prereg, lượt lai KHÔNG dùng để đóng khoảng → điểm
  gãy VẪN MỞ, biên GIỮ giữ nguyên 9,59.** Kiểm tra chia trước/sau
  mốc edit: 34 tick trước edit (85,3% ±1) vs 1492 tick sau edit
  (80,0% ±1), cùng trung vị 0 — KHÔNG có đứt gãy hành vi tại mốc
  edit (phù hợp với việc page đã load cây cũ, HMR tắt, không reload),
  nhưng đây chỉ là bằng chứng phụ, không đủ để ghi đè luật prereg.
- **(c) Chế độ tải ĐỔI HẲN so với s76: hog `nice -n 19` + RAM hồi sau
  reboot → tick rate 2,17/s (so với 0,09/s của s76), playhead ratio
  0,839 (so với 0,421), tick rate TĂNG ở nửa sau (1,97 → 2,37/s) thay
  vì suy giảm.** Toán tích tick prereg (§1) vẫn đúng hướng (197 clip
  cho biên an toàn lớn) nhưng cơ chế khác hẳn: hog nice nhường CPU
  cho browser nên pump không đói như hog không-nice. **Hệ quả: số đo
  s77 KHÔNG so sánh trực tiếp được với dãy N5/P5/Q3 (hog không-nice)
  về mặt cơ chế đói — "tải" đo bằng load1 thì tương đương (~25) nhưng
  browser không bị đói CPU như nhau.** Đây là caveat lớn nhất cho
  bar (a) đợt này (xem §2, §9 mục 1).
- **(d) Bar (c) — chỉ số đói pump: VẪN CHƯA kết luận được.** s77:
  tickRate 2,17/s + skipStale 30,68% → rơi vào VÙNG XÁM (không dự
  báo GIỮ cũng không dự báo KHÔNG-GIỮ). Dù s77 có hợp lệ thì bar (c)
  cũng không kiểm chứng được trong chế độ tải này — cần lượt rơi
  ngoài vùng xám (xem §3).
- **(e) Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN — 0/4 lần thử thực
  chạy** (s77-P5, s78-P5, s76-Q3, s77-R3). s77: 0 episode stall theo
  watcher; cửa sổ 30 s min advance 14,73 s; cửa sổ 10 s (pp thay thế,
  xem §4) min advance 5,60 s; 0 chuỗi mẫu đứng yên; khoảng liên tiếp
  chậm nhất vẫn tiến 2,50 s/5,52 s tường. **Element chết format error:
  0/130 mẫu** — pattern "pool giữ element lỗi" của s76 (97/97) KHÔNG
  lặp lại ở s77.
- **(g) CẬP NHẬT 20:13Z — CHẠY LẠI THÀNH CÔNG (attempt 3, tag s77c):
  SẠCH md5, HỢP LỆ, GIỮ ở tải ~19,6.** Xem §11 đầy đủ. Attempt 2
  (s77b) bị reboot #48 cắt ngang (ph 309,87/591) → loại hoàn toàn.
  Attempt 3: **2231 blendTick, trung vị 0, 88,7% trong ±1, 0,0% ≤ −2
  → GIỮ (hợp lệ) ở sampled mean load1 19,63** — biên GIỮ dời từ 9,59
  lên **19,63** (chế độ hog nice -n 19; caveat chế độ tải §5 vẫn
  đứng — dãy hog không-nice vẫn dừng ở 9,59). Bar (c) lại rơi vào
  vùng xám (3,37/s, 29,73%) — lần thứ 3 không kết luận được. Playhead
  kẹt 0/5 lần thử thực chạy.

---

## §0. Bối cảnh chạy (reboot #47 giữa lúc chuẩn bị; R2 sửa production giữa lượt s77)

- **Boot #46 lúc viết prereg (17:46:10Z).** Phần A (phân tích lại dữ
  liệu s76 cũ) không cần lock/vite, không bị ảnh hưởng bởi reboot.
- **Reboot #47 = 2026-11-14 17:45:50Z** (boot_id `5578af38-…`, uptime
  1 phút lúc 17:47Z). Gap #46 → #47 = **2h01'01"**, trong dải chứng
  nhận [19'07", 3h14'08"], KHÔNG phá sàn. Số thứ tự #47 vẫn tạm thời
  (mù #33 chưa đóng). Caveat đồng hồ: lần kiểm tra 17:46:10Z vẫn thấy
  boot #46 trong khi uptime -s của boot mới ghi 17:45:50Z — chênh
  ~40 s, có thể do đồng hồ VM chưa đồng bộ ngay sau boot; mốc
  17:45:50Z là số ghi trực tiếp, dùng làm mốc chính thức. Reboot xảy
  ra trong khoảng 17:46:10–17:48:22Z (R9 early-watch try#1 17:48:22Z
  ghi boot 2,5' tuổi).
- **R2 sửa preview.tsx giữa lượt s77:** file đổi mtime
  2026-11-14T18:04:52.895Z (md5 03bf029f → a419ae05, 443.818 byte),
  đúng lúc s77 đang phát (phát bắt đầu 18:04:29Z, app boot OK
  18:04:15Z). Đây là fix zombie của R2 (đợt 115 chuyển sang hướng
  sửa theo ROUND114_LIMITS §10 mục 2). R3 KHÔNG sửa production —
  thay đổi này do luồng sibling R2. Dry chạy trước đó (17:51–17:52Z)
  sạch: md5 03bf029f trước = sau. s77: mtimeBefore 03bf029f,
  mtimeAfter a419ae05, **mtimeChangedMidRun=True** → lượt LAI theo
  prereg §0/§6. Vite tạm dùng `hmr: false` nên page đã load không
  reload khi file đổi — kiểm tra chia trước/sau mốc edit ở §2 cho
  thấy không có đứt gãy hành vi (bằng chứng phụ, xem §2).
- **RAM hồi sau reboot:** lúc khởi động driver avail 3197 MB; trong
  lúc s77 phát tối thiểu 461 MB (watcher) — không OOM, không dừng
  sớm vì RAM. (So với s76: tối thiểu 349 MB.)
- **ENOSPC — 0 lần:** vite tạm `server.watch.ignored: ["**/**"]` +
  CFG_DIR riêng /tmp/round115-r3; vite lên ngay attempt 1 cả 2 lượt.
- **Tải nền của luồng đợt 115 khác:** R2 chạy validation fix (giữ
  lock 18:18:21–18:24:39Z, load-holder bật/tắt 0–1 hog để giữ load5
  trong [3,8] cho lượt fr4); R8 chờ cờ R2-tree (chưa có lúc s77
  chạy); R9 postboot/early-watch boot #47; R1/R4/R5/R6/R7 chạy song
  song. Tải sibling có trong sampled mean (đó là tải probe thực sự
  chịu; ghi rõ, không tách). Hog R3: `nice -n 19`, 40 hog lúc phát.
- **Lock: 0 lần DEFERRED cho R3 đợt này.** Dry acquire ngay lần đầu
  (lock trống 17:51:31Z); s77 acquire ngay lần đầu (lock trống sau
  khi dry nhả). R2 giữ lock ngay sau khi R3 nhả (18:18:21Z, bình
  thường); lock TRỐNG lúc kiểm tra cuối 18:25:47Z.
- **CẬP NHẬT 18:27:43Z (sau khi s77 xong, trước khi R3 viết xong
  LIMITS): R2 đã REVERT preview.tsx về đúng 03bf029f** (mtime
  18:27:43.250Z, 442.673 byte, md5 `03bf029f09b8890b285eacc10a02172b`
  — kiểm chứng trực tiếp lúc 18:29:47Z). Verdict R2: BỎ fix cap
  snapshot 1280×720 → 640×360 (không đạt bar prereg: capMs median
  chỉ −13,7% so với bar −40%; longtask khớp pump/giây phát TĂNG 65%
  so với bar −20%). Cờ `round115-r2-tree` = NO-CHANGE
  (md5=03bf029f). **Cây hiện tại: 03bf029f, ổn định; R2 đã xong
  (cờ round115-r2-done đã tạo, LIMITS + batch R2 đã stage).** R8 đã
  bắt đầu kiểm cửa sổ tải sạch lúc 18:28:38Z (10 mẫu load1<3, mỗi
  30 s) để chạy lượt tải sạch sau đó. R3 sẽ chạy lại s77 trên cây
  03bf029f ổn định sau khi R8 xong (xem §7 cập nhật).

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0, offset nhãn − kỳ vọng)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-dry | stripes-code-blur | chạy khô, không hog | — | **1,98** (n=4) | 1,8 | **336** | 36,38 | 229 | **0** (−1..+1) | 100% | **GIỮ** (chỉ validate dụng cụ, không tính bar) |
| chr-code-blur-s77 | stripes-code-blur | [15, 30] | ĐẠT 23,44 (40 hog nice -n 19) | **25,10** (n=143) | 50,0 | **1526** | 2,17 | 115 | **0** (−7..+28) | 80,1% | GIỮ theo offset — **LAI (mtimeChangedMidRun=True), KHÔNG HỢP LỆ để đóng khoảng** |

- **Dry (nclips=3, 9 s media, boot #47):** 336 tick, GIỮ — validate
  probe115r3 (xem §6). Chạy dưới tải sibling nhẹ (load1 ~2,0) mà
  offset vẫn 100% trong ±1. md5 03bf029f trước = sau.
- **s77 (nclips=197, 591 s media, boot #47):** dial ĐẠT 23,44 lúc
  17:55:51Z (40 hog nice -n 19) sau ~3,5 phút dial; acquire lock ngay
  18:03:54Z (lock trống); app boot OK 18:04:15Z; phát 18:04:29Z →
  ~18:16:15Z (tường phát 704,2 s, playhead 590,8/591 s); trích xong
  ~18:18:15Z; probe exit=0; driver done 18:18:41Z. **1526 tick —
  gấp 30 lần ngưỡng 50.** Phân loại GIỮ theo offset nhưng **LAI**
  (preview.tsx đổi 18:04:52Z do R2) nên KHÔNG HỢP LỆ để đóng khoảng
  (prereg §0/§6).
- **Không lượt nào GÃY** (s77 fracLeNeg2 = 0,4% — 6/1526 tick ≤ −2;
  dry 0%).
- **Hai sampler độc lập khớp nhau về tải trong lúc phát:** probe
  loadSamples mean load1 **25,10** (n=143, median 28,21, min 0,53,
  max 47,35); driver sampler 5 s trong đúng cửa sổ phát mean load1
  **19,76** (n=303 — bao gồm cả giai đoạn dial trước khi phát, nên
  thấp hơn; median 14,82, min 0,20, max 47,35). Chênh nhau do cửa sổ
  khác nhau, không phải do đo sai — mức tải trong lúc phát được đo
  chắc chắn ở ~25 (probe) với threadsR mean 50,0.

## §2. Bar (a) — điểm gãy ở tải ~25: KHÔNG ĐÓNG ĐƯỢC (s77 LAI)

- **Điểm gãy: VẪN MỞ.** Biên GIỮ giữ nguyên **9,59** (s71, đợt 112).
  Không có lượt GÃY nào; không có lượt tải nào vừa ≥50 tick vừa sạch
  md5 để phân loại (s77: 1526 tick nhưng LAI).
- **Toán tích tick prereg ĐÚNG HƯỚNG nhưng sai cơ chế:** prereg tính
  197 clip cho biên an toàn lớn (rate-muộn 0,05/s → ~94 tick). Thực
  tế s77 cho **1526 tick** — gấp ~16 lần dự báo — vì tick rate KHÔNG
  suy giảm mà còn TĂNG ở nửa sau (1,97 → 2,37/s; theo quý: Q1 342
  tick / Q2 350 / Q3 451 / Q4 383, đều ~80% ±1). Nguyên nhân chính là
  chế độ tải đổi hẳn (xem §5): hog `nice -n 19` nhường CPU cho
  browser (pump không đói như hog không-nice của Q3) + RAM hồi sau
  reboot (3197 MB lúc khởi động vs 392 MB lúc Q3 viết prereg).
  Playhead ratio 0,839 (so với 0,421 của s76) — media clock chạy gần
  như thời gian thực.
- **Kiểm tra chia trước/sau mốc edit (bằng chứng phụ, KHÔNG ghi đè
  luật prereg):** mốc edit 18:04:52Z ≈ tBlend ~37,1 s (tính từ app
  boot OK 18:04:15,8Z; tick đầu tiên tBlend=25,6 s). 34 tick TRƯỚC
  mốc edit: trung vị 0, mean +0,26, 85,3% trong ±1, 0% ≤ −2.
  1492 tick SAU mốc edit: trung vị 0, mean +0,70, 80,0% trong ±1,
  0,4% ≤ −2. Hai phía cùng trung vị 0, cùng dạng GIỮ — KHÔNG có đứt
  gãy hành vi tại mốc edit. Phù hợp với cơ chế: page đã load cây
  03bf029f lúc 18:04:15Z, vite tạm `hmr: false` nên file đổi trên đĩa
  không reload page đang chạy. Ghi rõ: đây là bằng chứng NHẤT QUÁN
  với "đo được cây cũ suốt lượt", nhưng KHÔNG đủ để tuyên bố lượt
  sạch — luật prereg (mtimeChangedMidRun=True → lai → không dùng để
  đóng khoảng) vẫn áp dụng, vì không thể loại trừ hoàn toàn khả năng
  page chạm vào module mới (vd dynamic import) mà không để lại dấu
  trong offset.
- **Dial vẫn không điều khiển được load1 theo nghĩa đen** (như
  N5/P5/Q3): dial ĐẠT 23,44 rồi load1 dao động mạnh trong lúc phát
  (probe loadSamples: min 0,53, max 47,35; driver sampler: min 0,20).
  Chỉ sampled mean TRONG LÚC PHÁT đáng tin, kèm threadsR (xem §5).
- **Caveat chế độ tải (quan trọng — xem §5):** s77 dùng hog nice -n 19
  (theo lệnh giao — nguồn tải đã chứng minh của Q1 đợt 114), khác với
  hog không-nice của N5/P5/Q3. Load1 mean ~25 thì tương đương, nhưng
  browser KHÔNG bị đói CPU như nhau (tick rate 2,17/s vs 0,09/s).
  Vì vậy số GIỮ này (dù có sạch md5) cũng KHÔNG thể gộp thẳng vào
  dãy N5/P5/Q3 để dời biên GIỮ lên 25,1 mà không ghi rõ đổi chế độ
  tải. Cần parent quyết: (i) chuẩn tải cho bar (a) là hog nice hay
  không-nice? (ii) biên GIỮ 9,59 đo bằng hog không-nice có còn là
  mốc so sánh đúng cho lượt nice-hog không? (xem §9 mục 1).

## §3. Bar (c) — chỉ số đói pump tức thời: VÙNG XÁM, KHÔNG kết luận (lần 2)

- **Quy tắc đã đăng ký trước (giữ nguyên prereg-q3 §2, đăng ký lại
  trong prereg-r3 §3 — KHÔNG chỉnh ngưỡng sau khi thấy s76):**
  tickRate = nBlendTick / wall_s; skipStale = số pump
  `decision == "skip-stale-frame"` / tổng số pump entry. Dự báo GIỮ
  iff tickRate ≥ 5/s VÀ skipStale ≤ 20%; dự báo KHÔNG-GIỮ iff
  tickRate < 1/s HOẶC skipStale > 35%; còn lại vùng xám. Bar ĐẠT iff
  lượt hợp lệ (≥50 tick) VÀ dự báo khớp phân loại offset.
- **Kết quả s77:** tickRate **2,17/s**, skipStale **30,68%**
  (563/1835 pump; các decision còn lại: capture 1256, skip-seeking 3,
  reset-capture 7, skip-stale 4, duplicate 2) → rơi vào **VÙNG XÁM**
  (tickRate 1–5/s, skipStale 20–35%) → **không dự báo**. Phân loại
  offset: GIỮ (nhưng LAI — xem §2).
- **KHÔNG kết luận bar đạt/không đạt** vì hai lý do độc lập, lý do nào
  cũng đủ: (i) s77 LAI nên không hợp lệ để đối chiếu; (ii) dù s77 có
  sạch thì dự báo vẫn là vùng xám — bar (c) không kiểm chứng được
  trong chế độ tải nice-hog này. Đây là lần kiểm chứng thứ hai không
  kết luận được (lần đầu s76 thiếu tick; lần này vùng xám + lai).
- **Bằng chứng phụ (không tính bar):** dry run tickRate 36,38/s +
  skipStale 2,99% (7/234) → dự báo GIỮ, khớp phân loại GIỮ của dry
  (100% trong ±1). Nhất quán, nhưng dry là lượt validate dụng cụ,
  không tính vào bar.
- **Bảng tham chiếu cập nhật (thêm s77 vào dãy P5/N5/Q3):**

| lượt | phân loại | tick rate (/s) | skip-stale-frame | dự báo | khớp? |
|---|---|---|---|---|---|
| s75 (control) | GIỮ | 17,35 | 10,8% | GIỮ | có |
| s73 (N5) | TRUNG-GIAN | 1,6 | 40,3% | KHÔNG-GIỮ | có |
| s77 (P5) | TRUNG-GIAN (k.h.lệ) | 0,17 | 46,2% | KHÔNG-GIỮ | có |
| s78 (P5) | TRUNG-GIAN (k.h.lệ) | 0,26 | 41,0% | KHÔNG-GIỮ | có |
| s76 (Q3) | TRUNG-GIAN (k.h.lệ) | 0,09 | 44,26% | KHÔNG-GIỮ | có (hướng), chưa kết luận |
| **s77 (R3)** | **GIỮ (LAI, k.h.lệ)** | **2,17** | **30,68%** | **XÁM (không dự báo)** | **không đối chiếu được** |
| dry (R3) | GIỮ (validate) | 36,38 | 2,99% | GIỮ | có |

  (k.h.lệ = không hợp lệ để đóng khoảng; "khớp" ở các lượt k.h.lệ chỉ
  là so hướng, không phải bar pass.)
- **Hệ quả cho đợt sau:** chế độ nice-hog đẩy cả hai chỉ số vào vùng
  xám (tickRate ~2/s, skipStale ~31%). Muốn kiểm chứng bar (c) thì
  cần lượt rơi ngoài vùng xám: hoặc tải nhẹ hơn (tickRate ≥5/s +
  skipStale ≤20% — gần như chỉ có lượt yên) hoặc tải đói hơn
  (tickRate <1/s hoặc skipStale >35% — chế độ hog không-nice như
  s76). Bar (c) có thể chỉ phân biệt được ở hai đầu, không phân biệt
  được ở giữa — đó tự nó đã là một phát hiện về giới hạn của chỉ số
  (xem §9 mục 3).

## §4. Bar (b) — playhead kẹt ở biên clip: KHÔNG TÁI HIỆN (0/4 lần thử thực chạy)

- **Định nghĩa đăng ký trước (giữ nguyên P5/Q3):** stall = playhead
  tiến < 0,05 s trong bất kỳ cửa sổ tường 30 s nào khi playing=true;
  stall ở biên = playhead trong 0,1 s ngay trước một bội số của 3,0 s.
- **Kết quả s77:** **0 episode stall** (130 mẫu watcher, tường 5,9–
  706,0 s, playhead 4,77 → 590,83). **Tỉ lệ tái hiện gộp 0/4 lần thử
  thực chạy** (s77-P5, s78-P5, s76-Q3, s77-R3; s76 đợt 113 là lần thử
  #0 vì KHÔNG CHẠY nên không tính — R3 KHÔNG tuyên bố "0/5").
  stall-events.json KHÔNG có file (watcher không ghi khi 0 episode);
  stallBlocks=[] trong results json.
- **Kiểm chứng độc lập từ mẫu thô (tính lại từ stall-watch.jsonl,
  không tin mù watcher):**
  - Cửa sổ 30 s (mọi cặp, wall-diff [25,30]s): min advance **14,73 s**
    (cửa sổ 224477→251489, ph 188,87 → 203,60). Không stall.
  - Cửa sổ 10 s (P8, mọi cặp [8,10]s): **n=0 cặp** — cadence mẫu
    ~5,4 s (median 5392 ms, min 4914, max 7181) nên diff đôi cặp
    nhảy qua dải [8,10]s (1 gap ~5,4 s < 8 s; 2 gap ~10,8 s > 10 s).
    Ghi rõ: phương pháp P8 KHÔNG áp dụng được trực tiếp cho s77 vì
    cadence lấy mẫu — không phải vì không có dữ liệu.
  - Cửa sổ 10 s (phương pháp thay thế — mẫu đầu tiên ≥10 s sau mỗi
    mẫu): n=128, min advance **5,60 s** (224477→235109, ph 188,87 →
    194,47). Dải mở rộng [8,12]s: n=126, min advance cũng 5,60 s.
  - Kiểm tra đóng băng trực tiếp: **0 chuỗi mẫu liên tiếp đứng yên**
    ph. Khoảng liên tiếp chậm nhất vẫn tiến **2,50 s trong 5,52 s**
    tường (wall 229592, ph 191,97).
  - `playing=false`: 0/130 mẫu — store tưởng đang phát suốt lượt.
- **So với s76 (Phần A, §8):** s76 có freeze ~12 s + tiến chậm
  0,77 s/8,5 s; s77 KHÔNG có gì tương tự — playhead chạy đều suốt
  lượt (ratio 0,839). Chênh lệch này khớp với chế độ tải khác nhau
  (nice-hog không đói browser như non-nice-hog) — freeze s76 có thể
  là hệ quả của đói CPU kiểu non-nice, không phải hành vi chung dưới
  mọi tải (xem §5).
- **Đánh giá H1–H4 (đăng ký trước):** stall không tái hiện lần thứ 4
  liên tiếp nên KHÔNG có bằng chứng mới cho hay chống lại giả thuyết
  nào. Với **0/4 lần thử** ở đúng điều kiện s72 lần 1 (nclips≥20,
  dial [15,30], load đỉnh ~47, playhead ratio 0,42–0,84), vụ kẹt 3,5
  phút của s72 lần 1 trông càng giống sự kiện hiếm/khó tái hiện hơn
  là hành vi hệ thống. Theo prereg Q3 §6 + prereg-r3 §5: **hạ mức ưu
  tiên** — không tích mẫu mù thêm bằng lượt dài kiểu này nữa; nếu còn
  theo đuổi thì cần đổi cách kích hoạt (vd tái hiện đúng điều kiện
  s72 lần 1: hog không-nice + RAM thấp + lượt dài) thay vì chạy thêm
  lượt nice-hog.
- **Caveat watcher:** khoảng cách giữa các mẫu watcher tới 7,2 s
  (median 5,4 s) dưới tải (cadence danh nghĩa 5 s). Một stall < ~7 s
  có thể lọt giữa hai mẫu — nhưng stall mục tiêu dài ~3,5 phút nên
  không bị ảnh hưởng; và kiểm chứng 10 s thay thế ở trên dùng đúng
  các mẫu đã có nên kết luận "không stall ≥10 s" là vững.

## §5. Dị thường — chế độ tải nice-hog khác hẳn non-nice-hog (mới, quan trọng nhất)

- **Hiện tượng:** s77 dùng hog `nice -n 19` (40 hog): tick rate
  2,17/s (gấp ~24 lần s76: 0,09/s), playhead ratio 0,839 (gấp đôi
  s76: 0,421), tick rate TĂNG ở nửa sau (1,97 → 2,37/s) thay vì suy
  giảm (s76: 0,146 → 0,085/s). Caps vẫn chết sau clip c2 (115 caps,
  c2 chiếm 91 — xem §6) nhưng blendTick vẫn chảy đều 1526 tick.
- **Cơ chế (diễn giải, có bằng chứng):** hog nice -n 19 có độ ưu tiên
  CPU thấp nhất nên kernel nhường CPU cho browser (chromium +
  renderer) mỗi khi browser cần; hog chỉ dùng CPU thừa. Load average
  vẫn cao (mean 25,1, threadsR mean 50,0) vì 40 hog luôn runnable,
  nhưng browser không bị đói CPU thật — pump rVFC vẫn callback đều
  (2,17/s), playhead chạy gần thời gian thực. Ngược lại, hog
  không-nice của Q3 tranh CPU ngang hàng với browser nên pump đói
  (0,09/s, ratio 0,421). Bằng chứng phụ: dial với nice-hog mất
  ~3,5 phút mới ĐẠT 23,44 (load1 chỉ 0,66–2,13 trong lúc tăng hog
  12→40, vì load-average là EMA 1 phút + hog nice không chiếm CPU
  ngay); sau khi ĐẠT, load1 vẫn dao động 0,20–47,35 (sampler driver)
  — load1 sụp về ~0,2 trong khi 40 hog vẫn sống (xem §5 Q3: cgroup
  throttle — hog vượt quota CPU của cell ~1,5 CPU thì bị throttle,
  task bị throttle không còn counted là runnable nên load1 đọc thấp).
- **Hệ quả cho bar (a):** "tải" đo bằng load1 KHÔNG còn là một trục
  duy nhất — cùng load1 ~25, hai chế độ hog cho hai mức đói pump
  khác nhau 24 lần. Biên GIỮ 9,59 (đo bằng hog không-nice, s71) và
  lượt GIỮ ở load1 25,1 (đo bằng hog nice, s77 — lại còn LAI) KHÔNG
  gộp được thành một khoảng. **Đợt sau phải chốt chuẩn tải cho bar
  (a):** hoặc quay về hog không-nice (nhất quán với dãy N5/P5/Q3),
  hoặc định nghĩa lại trục tải bằng threadsR + tick rate + skip-stale
  thay vì load1. R3 khuyến nghị: giữ hog không-nice cho bar (a) (vì
  đó mới là tải làm đói browser — đúng cơ chế cần đo), và dùng
  nice-hog chỉ khi cần tải nền không phá browser (như Q1 đã dùng cho
  E4). Cần parent quyết (xem §9 mục 1).
- **Caveat:** diễn giải nice-yield + throttle là suy luận từ số đo
  (tick rate + ratio + load1 + threadsR), không phải đo trực tiếp
  cgroup cpu.stat hay scheduler. Ghi rõ để luồng sau kiểm chứng nếu
  cần — không dùng diễn giải này để phân loại lượt (phân loại vẫn
  theo offset §0 và sampled mean load1 25,10 như prereg).

## §6. Metric thay thế + offset100 + dụng cụ (mô tả, không phân loại)

- **offset100 (CHỈ MÔ TẢ, như prereg):** s77 n=1188, trung vị +2,
  mean +1,46, 25,8% trong ±1, 7,6% ≤ −5 (dải −57..+26); dry n=86,
  trung vị 0, 79,1% trong ±1, 0% ≤ −5. offset100 của s77 tốt hơn hẳn
  s76 (n=110, trung vị −23, 8,2% ±1) — vì tick dày hơn (1526 vs 47)
  nên snapshot ít stale hơn. Vẫn không dùng để phân loại (nền nhiễu
  ±3 trên control yên + suy thoái theo đói tick — như M7/N5/P5/Q3).
- **Caps coverage vẫn sụp sau clip c2:** s77 chỉ có 115 caps, mà
  91/115 thuộc clip c2 (c0: 13, c1: 11, c2: 91) — sampler (rAF +
  interval 10 ms) gần như không chụp được gì sau clip c2, Y HỆT s76
  (c2: 73/85). Nhưng blendTick (rVFC pump) vẫn ghi 1526 tick suốt
  lượt. **Kết luận mới:** sampler chết sau c2 là hành vi ỔN ĐỊNH
  không phụ thuộc chế độ tải (xảy ra cả ở tick rate 0,09/s lẫn
  2,17/s) — có thể là sampler tự dừng sau ~9 s media vì lý do khác
  (vd cap buffer đầy / sampler chỉ bám 3 clip đầu), không phải bằng
  chứng đói main-thread. Q3 §6 đã dùng caps-chết làm "bằng chứng độc
  lập thứ hai cho đói main-thread" — s77 BÁC diễn giải đó: caps chết
  mà pump vẫn sống khỏe. Cần luồng khác kiểm tra vì sao sampler dừng
  sau c2 (xem §9 mục 4).
- **threads-R:** dry 1,8 / s77 50,0 — bám theo số hog đang sống +
  sibling, không bám CPU thật (như M7/N5/P5/Q3). Không đề xuất thay
  load1, nhưng là chỉ số phụ bắt buộc kèm theo khi báo tải (xem §5).
- **Tick rate:** 36,38/s (dry, 9 s) / 2,17/s (s77) — sụp theo tải
  nhưng ở mức khác hẳn s76 (0,09/s); dùng để tính cửa sổ cần thiết,
  không làm metric chính.
- **Playhead ratio:** 0,974 / 0,839 — media clock gần thời gian thực
  ngay cả dưới tải nice-hog (so với 0,421 của s76 non-nice).
- **Gate v2 (mô tả):** ĐẠT ở s77, KHÔNG ĐẠT ở dry (đúng vì dry không
  tải). s77 GIỮ theo offset (nhưng LAI) mà vẫn đạt gate — đạt gate
  v2 không suy ra presented GIỮ (như M7/N5/P5/Q3).
- **Dụng cụ trích kết quả (tái dùng Q3 — CỨU lượt dài lần nữa):**
  trích cuối chia 6 chunk, ghi part file ngay khi nhận; snapshot từng
  phần mỗi 60 s; stuck watcher 5 s. Probe115r3 = copy byte của
  probe114q3, chỉ đổi SCRATCH/CFG_DIR (diff 4 dòng, node --check
  PASS). **Kết quả:** 2/2 lượt chạy trích đủ dữ liệu, **0 chunk lỗi**
  (extraction.errors = [] cả 2 lượt):

| lượt | A-blend | B-caps | D-state | E-scalars | C-px (lớn nhất) |
|---|---|---|---|---|---|
| dry | OK | OK | ~1 s | OK | ~5 s (5 lát) |
| s77 | 3.613 ms | 814 ms | **97.986 ms** | 701 ms | **5.185 ms** (lát 0–50), 4.813 ms (lát 50–100), 1.121 ms (lát 100–115) |

  Riêng chunk D-state đã tốn ~98 s dưới renderer đói — eval cũ gộp
  toàn bộ payload trong 60 s (N5) đã thua chắc chắn ở lượt này. Tổng
  thời gian trích ~150 s. Trích chunked không còn là "cải tiến" mà là
  điều kiện cần để lượt dài có dữ liệu (như Q3 §7).
- **Không đổi logic đo:** metric chính vẫn blendTick rVFC; sampler/
  caps/state100 giữ nguyên; diff probe115r3 vs probe114q3 chỉ gồm
  4 dòng đổi tên (đã soát).
- **Analyzer:** copy analyze114q3.py → analyze115r3.py (đổi S5 + tag
  dry/s77; giữ nguyên công thức offset100 đã sửa + tickRate +
  skipStale + dự báo bar (c)). **1 lỗi nhỏ do R3 tự phát hiện + sửa
  trước khi báo cáo:** dòng tiêu đề file .txt còn sót tên cũ
  `analyze114q3` (đã sửa thành analyze115r3, chạy lại — số liệu
  không đổi). Analyzer Phần A (analyze115r3-partA.py) + analyzer
  stall s77 (analyze115r3-s77stall.py) mới, chỉ đọc dữ liệu thô.
- **Driver:** driver115r3.sh (dựa trên driver114q3b.sh; thay đổi chính:
  nclips=197, tag s77, hog `nice -n 19`, KHÔNG chờ cờ Q5, tạo cờ
  hogs-off khi hogs tắt, hạn bắt đầu s77 19:30Z). Driver chạy đủ tới
  "done" 18:18:41Z; lock đã nhả sạch (cleanup cuối bị từ chối đúng vì
  R2 đã giữ lock — không phải lỗi); hog-count.txt = 0 cuối lượt;
  không vite mồ côi (kiểm ps + lock TRỐNG sau lượt cuối).

## §7. Vì sao KHÔNG chạy lại s77 NGAY sau lượt lai — và cập nhật: sẽ chạy lại sau khi R8 xong

- Luật prereg (§0/§6): lượt lai → "CHẠY LẠI nếu còn trong hạn; nếu
  không chạy lại được thì lượt lai vẫn báo số nhưng KHÔNG dùng để
  đóng khoảng". Về mặt THỜI GIAN thì còn hạn (s77 xong 18:18:41Z,
  ngân sách tới ~20:43Z; chạy lại tốn ~25 phút).
- Nhưng lúc s77 xong, **R2 đang chạy validation fix** (giữ vite lock
  18:18:21–18:24:39Z, load-holder bật/tắt 0–1 hog để giữ load5 trong
  [3,8] cho lượt fr4 — lượt nhạy tải) và **R8 đang chờ cờ R2-tree**
  (đã chờ từ 17:48Z) để chạy lượt tải sạch (bar B-Q8-1, cần load1 < 3
  ổn định, không hog). Chạy lại s77 lúc đó (40 hog nice -n 19 trong
  ~25 phút + giữ lock) sẽ: (i) phá dải tải [3,8] của R2 — lượt fr4
  đang chờ vào dải sẽ không vào được; (ii) phá cửa sổ sạch của R8 —
  R8 poll cờ mỗi 60 s và sẽ bắt đầu lượt sạch ngay khi cờ R2-tree
  xuất hiện, đúng lúc hog R3 đang chạy.
- R3 quyết định KHÔNG chạy lại ngay lúc đó: cái giá (phá 2 lượt nhạy
  tải của sibling) lớn hơn cái được. Đây là áp dụng đúng nhánh thứ
  hai của luật ("không chạy lại được thì báo số nhưng KHÔNG dùng để
  đóng khoảng"), với lý do chặn là xung đột tài nguyên chia sẻ với
  lượt sibling đang chạy, không phải hết giờ.
- **CẬP NHẬT 18:29Z: tình hình đã đổi — R2 verdict BỎ + revert cây về
  03bf029f lúc 18:27:43Z (xem §0), R2 đã xong; R8 đã bắt đầu kiểm cửa
  sổ sạch 18:28:38Z. R3 SẼ CHẠY LẠI s77 (lượt sạch, attempt 2) trên
  cây 03bf029f ổn định SAU KHI R8 chạy xong lượt tải sạch (cờ
  round115-r8-done), nếu còn trong ngân sách (không bắt đầu lượt
  chạy lại sau 19:45Z để còn phân tích + cập nhật LIMITS + stage
  trước 20:43Z).** Lượt chạy lại đo đúng cây gốc 03bf029f nên thuộc
  về cùng dãy N5/P5/Q3 (không còn là "dãy mới sau fix" như bản nháp
  trước của mục này). Kết quả lượt chạy lại (nếu có) được ghi vào
  §11 bổ sung của file này; nếu R8 không xong kịp thì giữ báo cáo
  lượt lai này và chuyển chạy lại sang đợt sau (xem §10 mục 2 cập
  nhật).

## §8. PHẦN A — soi lại s76 bằng cửa sổ hẹp (xác nhận đầy đủ đính chính Q9)

- **Phương pháp (P8, giữ nguyên recount-q9-all.py §D2):** mọi cặp mẫu
  (i,j) trong stall-watch.jsonl s76 với wall-diff [8,10]s (cửa sổ 10 s)
  / [25,30]s (cửa sổ 30 s). Analyzer: analyze115r3-partA.py (chỉ đọc
  dữ liệu s76 thô — không đo mới, không cần lock/vite).
- **Cửa sổ 30 s:** n=79 cặp, min advance **4,63 s** (cửa sổ
  127682→155511, span 27,8 s, ph 44,77 → 49,40) — KHỚP claim 4,63 s
  của LIMITS Q3. **0 episode stall theo định nghĩa 30 s; tỉ lệ kẹt
  0/3 vẫn đứng.**
- **Cửa sổ 10 s:** n=18 cặp, min advance **0,00 s** — claim "mọi cửa
  sổ 10 s tiến ≥1,33 s" của LIMITS Q3 là **SAI** (Q9 đúng). **Đầy đủ
  mọi cửa sổ advance <1,33 s (đúng 2 cửa sổ):**

| cửa sổ (wallMs) | span | ph đầu → cuối | advance | playing |
|---|---|---|---|---|
| 130594 → 139502 | 8,91 s | 44,7667 → 44,7667 | **0,00 s** | True/True |
| 322693 → 331214 | 8,52 s | 109,2667 → 110,0333 | **0,77 s** | True/True |

  Cửa sổ 10 s tiến ít thứ ba đã là 1,33 s (83184→92591, ph 28,80 →
  30,13) — đúng ngưỡng claim cũ, không vi phạm.
- **Freeze ph 44,7667 — XÁC NHẬN:** 3 mẫu liên tiếp đứng yên
  (wallMs 127682 / 130594 / 139502, **11,82 s**, playing=True), mẫu
  kế tiếp wallMs 143606 ph 46,73 (đã tiến tiếp), mẫu trước đó
  wallMs 119178 ph 39,30. **Vị trí: clip c14, cách biên clip 45,0 s
  đúng 0,23 s** — GẦN biên nhưng NGOÀI cửa sổ 0,1 s đã đăng ký cho
  "stall ở biên" (ph 44,7667 không thỏa định nghĩa stall-ở-biên đã
  đăng ký, và 11,82 s < 30 s nên không thỏa định nghĩa stall). Ghi
  đúng vị trí để đợt sau đối chiếu — đừng gọi nó là "stall ở biên"
  theo định nghĩa đã đăng ký.
- **Tiến chậm ph ~109–110 s — XÁC NHẬN:** chỉ có 2 mẫu trong khoảng
  (wallMs 322693 ph 109,27; wallMs 331214 ph 110,03), advance 0,77 s
  trong 8,52 s tường. Vị trí: clip c36, cách biên clip kế (111,0 s)
  1,73 s — GIỮA clip, không gần biên.
- **Kiểm tra bổ sung (khớp LIMITS Q3 §4):** playing=false 0/97 mẫu;
  element chết format error có mặt trong **97/97 mẫu** (khớp); gap
  giữa các mẫu watcher min 2328 ms / median 5924 ms / max 11993 ms
  (cadence danh nghĩa 5000 ms); load1 trong lúc freeze: 8,56 / 7,88 /
  6,75 (thấp hơn nhiều so với mean lượt 23,05); freeMB trong lúc
  freeze: 519 / 490 / 637.
- **Kết luận Phần A:** (a) playhead kẹt 0/3 theo định nghĩa 30 s
  **vẫn đứng** (min advance 30 s = 4,63 s); (b) cửa sổ 10 s cho thấy
  thêm **1 freeze thật ~12 s ở ph 44,77 (gần biên 45,0 s) + 1 lần
  tiến chậm 0,77 s/8,5 s ở ph ~109–110 s (giữa clip)** — cả hai đều
  không vi phạm định nghĩa stall 30 s, nhưng câu "playhead không
  đứng yên ở bất kỳ thang nào" trong LIMITS Q3 là **sai** (Q9 đúng);
  (c) KHÔNG có cửa sổ 10 s nào khác <1,33 s ngoài 2 cặp Q9 đã liệt
  kê — bảng trên là đầy đủ. **Lưu ý mới:** freeze xảy ra khi load1
  THẤP (6,75–8,56), không phải lúc tải đỉnh — freeze s76 có thể
  không phải do tải đỉnh mà do trạng thái hệ thống khác (vd GC /
  decoder / chuyển clip c14→c15); cần dữ liệu thêm, không suy diễn
  quá mức từ 1 sự kiện.

## §9. Kiểm chứng (cây cuối a419ae05 — đã đổi do R2, không phải do R3)

- `tsc --noEmit` (apps/web): **0 lỗi** (18:2xZ, trên cây a419ae05 lúc
  đó — R2 đã chạy suites-fix.log "ALL DONE 18:09:03Z",
  preview-engine 354 pass trên cùng cây a419ae05). **Lưu ý: tsc này
  chạy khi cây đang là a419ae05 (trước khi R2 revert); cây hiện tại
  đã về 03bf029f — tsc trên cây 03bf029f đã được chạy nhiều lần ở các
  đợt trước (Q3: 0 lỗi 16:21:32Z 14/11) và R2 revert về đúng md5 cũ
  nên không chạy lại tsc trong luồng này (tránh phá cửa sổ sạch của
  R8). Ghi rõ để không ai tưởng tsc 0 này chứng nhận cho cây hiện
  tại.**
- `vite build`: **KHÔNG chạy trong luồng này** — để tránh phá dải tải
  [3,8] của R2 đang validation (build tốn CPU đột biến); tsc 0 +
  suites của R2 trên cây a419ae05 là đủ kiểm chứng cây đó biên dịch
  được. Ghi rõ thiếu sót này thay vì giấu.
- Không sửa production trong luồng này (R3); preview.tsx md5 lúc
  viết prereg 03bf029f → dry xong vẫn 03bf029f → s77 xong a419ae05
  (do R2 sửa 18:04:52Z) → **hiện tại (18:29:47Z) đã về 03bf029f do R2
  revert 18:27:43Z (xem §0 cập nhật)**.
- Probe copy `probe115r3-frame-parity.mjs`: node --check PASS trước
  lượt đầu; diff với probe114q3 chỉ gồm 4 dòng đổi tên.
- Analyzer `analyze115r3.py`: tính lại toàn bộ từ results json thô;
  bảng §1 khớp output analyzer (đếm lại từ đĩa, không tin mù log
  driver). Đã sửa 1 lỗi tiêu đề (§6) và chạy lại — số liệu headline
  không đổi.
- Stall: kiểm chứng độc lập từ stall-watch.jsonl thô (§4, §8) — khớp
  kết luận watcher (0 episode).
- Lock đã nhả sạch sau s77; R2 giữ lock ngay sau đó (18:18:21–
  18:24:39Z, bình thường); lock TRỐNG lúc kiểm tra cuối 18:25:47Z;
  không vite mồ côi; hog-count.txt = 0; không còn tiến trình
  `node -e` hog nào.

## §10. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng) — NHƯNG biên GIỮ đã dời lên
   19,63 (chế độ nice-hog, xem §11.3).** s77c GIỮ hợp lệ ở load1
   19,63; không có lượt GÃY nào. **Cần parent quyết chuẩn tải cho bar
   (a) (§2, §5, §11.3):** (i) hog nice hay không-nice là chuẩn? Dãy
   N5/P5/Q3 dùng hog không-nice (biên 9,59); Q1 + R3 dùng hog nice
   -n 19 (biên 19,63). Cùng load1 ~20–25, hai chế độ cho tick rate
   chênh 24–37 lần — không gộp chung được. R3 khuyến nghị giữ hog
   không-nice cho bar (a) (đó mới là tải làm đói browser — đúng cơ
   chế cần đo). (ii) Nếu giữ chuẩn không-nice thì cần lượt dài ~197
   clip hog không-nice (tốn ~30–40 phút/lượt, tick rate kỳ vọng
   ~0,09/s → ~120 tick) — hoặc tìm metric presented không phụ thuộc
   mật độ tick rVFC (nợ gốc từ P5).
2. **Chạy lại s77 — ĐÃ XONG trong luồng này (attempt 3, s77c, xem
   §11).** Cây 03bf029f ổn định sau khi R2 revert (18:27:43Z); R8
   xong lượt tải sạch (cờ 19:23Z). Attempt 2 (s77b) bị reboot #48 cắt
   (ph 309,87/591) → loại hoàn toàn. Attempt 3 sạch, hợp lệ, GIỮ ở
   tải 19,63. Không còn nợ chạy lại cho R3 trong đợt này.
3. **Chỉ số đói pump (bar (c)): mới kiểm chứng 3 lần, CHƯA kết luận
   lần nào.** s76 thiếu tick; s77 vùng xám + lai; s77c vùng xám nhưng
   hợp lệ (3,37/s, 29,73%). 3 lượt tải dài bằng hog nice đều rơi vào
   vùng xám — bar (c) như đăng ký KHÔNG phân biệt được gì trong chế
   độ nice-hog. Cần lượt rơi ngoài vùng xám (hog không-nice hoặc lượt
   yên) để đối chiếu. Đợt sau đăng ký lại bar này trên lượt hợp lệ đầu
   tiên rơi ngoài vùng xám, và cân nhắc thu hẹp vùng xám nếu có thêm
   dữ liệu (KHÔNG chỉnh ngưỡng hậu kiểm — chỉ đăng ký trước cho lượt
   sau).
4. **Sampler chết sau clip c2 — cần luồng khác kiểm tra (mới, §6):**
   s77 BÁC diễn giải "caps chết = đói main-thread" của Q3 §6 (caps
   chết mà pump vẫn sống khỏe 1526 tick). Vì sao sampler dừng sau c2
   (c2 chiếm 91/115 caps ở s77, 73/85 ở s76)? Nghi cap buffer đầy /
   sampler chỉ bám 3 clip đầu — không phải lỗi đo, không ưu tiên cao,
   nhưng đừng dùng caps-chết làm bằng chứng đói nữa.
5. **Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN 0/5 lần thử thực chạy
   (s77-P5, s78-P5, s76-Q3, s77-R3-attempt1, s77c-R3-attempt3; s77b
   attempt 2 bị reboot cắt nên không tính).** Đề xuất hạ mức ưu tiên
   (xem §4, §11.5): sự kiện hiếm, đã 0/5 ở đúng điều kiện s72 lần 1;
   H1–H4 vẫn mở, chưa có bằng chứng mới. Nếu còn theo đuổi thì cần
   đổi cách kích hoạt (tái hiện đúng điều kiện s72 lần 1: hog
   không-nice + RAM thấp + lượt dài), không tích mẫu mù thêm bằng
   lượt nice-hog.
6. **Freeze ~12 s ở ph 44,77 trong s76 (Phần A, §8):** đã xác nhận
   đầy đủ; freeze xảy ra khi load1 THẤP (6,75–8,56) và cách biên
   45,0 s đúng 0,23 s (ngoài cửa sổ 0,1 s đã đăng ký). Cần dữ liệu
   thêm trước khi gắn cơ chế — không suy diễn quá mức từ 1 sự kiện.
   Theo dõi ở lượt dài sau (cùng phương pháp cửa sổ 10 s).
7. **Element chết format error — pattern KHÔNG lặp lại (3 lượt liên
   tiếp không có):** s76 97/97 mẫu vs s77 0/130, s77c 0/121. "Lần thứ
   2 liên tiếp" (Q3 §9 mục 5) đã đứt từ s77 — pool giữ element lỗi
   là sự cố đơn lẻ của lượt s76 (có thể do seed/import lúc đó), không
   phải hành vi hệ thống. Hạ mức ưu tiên; không kết luận thêm.
8. **load1 không đo được tải thật khi hog vượt CPU quota (nhắc lại
   Q3 §5, tái hiện ở s77):** load1 sụp về 0,20–0,53 trong khi 40 hog
   vẫn sống + threadsR ~50. Đợt sau báo tải kèm threadsR + tick rate
   + skip-stale; đừng tin "dial ĐẠT" hay "load1 sụt" theo nghĩa đen
   trong cell này.
9. **Reboot #47 (17:45:50Z) + #48 (19:43:46Z) — ghi cho Q6/R7 đối
   chiếu:** gap #46→#47 = 2h01'01", gap #47→#48 = 1h57'56" (cả hai
   trong dải chứng nhận, không phá sàn); mù #33 đã mở, nay chứa cả
   #46, #47 và #48; probe #34 ở đợt 115 đối chiếu từ mốc 14:49:23Z.
   Caveat đồng hồ ~40 s ở cả hai reboot (xem §0, §11.1). Tần suất
   reboot dày lên (3 reboot trong ~4 giờ: #46 15:44, #47 17:45, #48
   19:43) — lượt dài ~30 phút có nguy cơ bị cắt ~25% nếu tần suất
   này giữ nguyên; đợt sau cân nhắc chia lượt dài thành nhiều lượt
   ngắn hơn hoặc chấp nhận rủi ro chạy lại.
10. Các nợ ngoài phạm vi R3 (giữ nguyên từ LIMITS gộp đợt 114 §10):
    G1 deinterlace (chờ user quyết), mù #22/#28/#29/#30/#31 (chờ user
    quyết), E4 cần đợt xác nhận tải cao, zombie chuyển sang hướng sửa
    (R2 đang làm), ngưỡng WebKit ≤60 ms cần 1 lượt yên thật, postboot
    + apt replay, headroom rơi còn ~1092 sau reboot #47, seek/preload
    bar B-Q8-1 cần lượt tải sạch (R8 đang chờ), birefnet (CẤM thử lại
    khi RAM chưa đổi), TTS 39 (CẤM kiểm lại), ci-security.yml 403
    (chờ user), release gate giữ nguyên.

## §11. BỔ SUNG — Attempt 2 bị reboot cắt + attempt 3 (s77c) SẠCH, HỢP LỆ, GIỮ ở tải 19,63

### §11.1 Attempt 2 (s77b): reboot #48 cắt ngang — LOẠI HOÀN TOÀN

- **Reboot #48 = 2026-11-14 19:43:46Z** (boot_id
  `0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0`; uptime -s ghi trực tiếp).
  Gap #47 (17:45:50Z) → #48 (19:43:46Z) = **1h57'56"** — trong dải
  chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn. Số thứ tự #48 vẫn tạm
  thời (mù #33 đã mở, nay chứa cả #46, #47, #48). Caveat đồng hồ như
  #47: mẫu stall-watch cuối của s77b ghi wallISO 19:44:10Z (sau mốc
  uptime -s 19:43:46Z) — chênh ~40 s, có thể do đồng hồ VM chưa đồng
  bộ ngay sau boot; mốc 19:43:46Z là số ghi trực tiếp, dùng làm mốc
  chính thức; reboot xảy ra trong khoảng 19:44:10–19:44:30Z.
- s77b đang phát thì bị cắt: playhead tới **309,87/591 s** (64 mẫu
  stall-watch, partial snapshot 925 blendTick, playhead 270,2). Theo
  prereg §0 ("lượt reboot cắt ngang → loại hoàn toàn, chạy lại từ
  đầu"), **s77b KHÔNG tính vào bar nào, không tính vào tỉ lệ tái hiện
  kẹt** (attempt 2 không phải một lần thử — giống s76 đợt 113). Dữ
  liệu thô giữ lại trong `hidden_files/round115-r3/chr-code-blur-s77b/`
  (partial + stall-watch) làm vết audit, KHÔNG phân tích phân loại.
- **Sự cố do R3 tự gây ra (ghi rõ, không giấu):** dry2 attempt 1
  DEFERRED sau 600 s chờ vite — một phần do vite R5 thật (pid 134005,
  cổng 5184, chạy tới ~19:30Z), một phần do **lệnh theo dõi của chính
  R3** (sleep 300 kèm `pgrep` với đúng pattern `node.*\.bin/vite` mà
  driver dùng để phát hiện vite) tự match chính nó từ 19:30:36Z tới
  19:33:36Z — vite_any() của driver trả true vì cmdline của lệnh theo
  dõi chứa pattern, trong khi vite R5 đã thoát từ ~19:30Z. R3 đã rút
  kinh nghiệm: các lệnh theo dõi sau đó KHÔNG chứa pattern đó nữa.
  dry2 PASS ở lần retry (19:35:36–19:36:15Z, 416 tick, mtimeChanged=
  false). Lỗi này chỉ tốn ~3 phút chờ thừa, không ảnh hưởng số đo.
- Sau reboot, driver resume (driver115r3b, setsid) cũng chết theo —
  R3 viết driver115r3c.sh mới (attempt 3, tag dry3/s77c) và chạy lại
  từ đầu, theo đúng luật "chạy lại từ đầu" của prereg.

### §11.2 Attempt 3 (s77c): lượt dài SẠCH — GIỮ ở tải 19,63, HỢP LỆ

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-dry3 | stripes-code-blur | chạy khô, không hog | — | **1,63** (n=4) | 1,5 | **471** | 51,02 | 269 | **0** (−1..+1) | 100% | **GIỮ** (validate dụng cụ) |
| chr-code-blur-s77c | stripes-code-blur | [15, 30] | KHÔNG ĐẠT trong dial (xem dưới) — vẫn phát, phân nhóm theo sampled mean trong lúc phát | **19,63** (n=134) | 45,0 | **2231** | 3,37 | 113 | **0** (−2..+30) | 88,7% | **GIỮ (HỢP LỆ: ≥50 tick, md5 sạch)** |

- **dry3 (nclips=3, boot #48):** 471 tick, GIỮ — validate probe115r3
  trên boot mới (caps theo clip c0/c1/c2 cân bằng hơn hẳn các lượt
  trước — dry3 caps 269, phân bố đều; xem §11.4). md5 03bf029f trước
  = sau.
- **s77c (nclips=197, 591 s media, boot #48):** dial KHÔNG ĐẠT trong
  300 s (xem §11.3); acquire lock ngay 19:59:06Z (lock trống); app
  boot OK; phát ~19:59:20Z → ~20:10:50Z (tường phát 661,1 s, playhead
  586,4/591 s — chưa tới 591 s tuyệt đối vì mẫu watcher cuối ở
  658,2 s tường; probe kết thúc khi playhead tới cuối media); trích
  xong ~20:13Z; probe exit=0; driver done 20:13:22Z. **2231 tick —
  gấp 44 lần ngưỡng 50.** Phân loại GIỮ theo offset, **HỢP LỆ**
  (md5 03bf029f → 03bf029f, mtimeChangedMidRun=False, không reboot
  cắt ngang).
- **Hai sampler khớp nhau về tải trong lúc phát:** probe loadSamples
  mean load1 **19,63** (n=134, median 18,73, min 0,17, max 43,14);
  driver sampler 5 s mean load1 **15,89** (n=224 — bao gồm cả giai
  đoạn dial trước khi phát, nên thấp hơn; median không tính; min
  0,20, max 43,45). Mức tải trong lúc phát được đo chắc chắn ở
  ~19–20 (probe) với threadsR mean 45,0.

### §11.3 Bar (a) — điểm gãy: VẪN MỞ, nhưng biên GIỮ dời lên 19,63 (chế độ nice-hog)

- **Điểm gãy: VẪN MỞ** (không có lượt GÃY nào). Nhưng lần đầu tiên có
  lượt tải HỢP LỆ trên 9,59: **s77c GIỮ ở sampled mean load1 19,63**
  → biên GIỮ dời từ **9,59 → 19,63** (trong chế độ hog nice -n 19).
  Analyzer: "Bar (a): chi co GIU (cao nhat load1mean=19.63), KHONG
  co GAY -> diem gay VAN MO, giu toi 19.63".
- **Caveat chế độ tải (§5) VẪN ĐỨNG, ghi rõ để không ai đọc sai:**
  biên 19,63 đo bằng hog nice -n 19 (browser không đói CPU như
  hog không-nice — tick rate 3,37/s vs 0,09/s của s76). Dãy hog
  không-nice (N5/P5/Q3) vẫn dừng ở biên GIỮ 9,59 — chưa có lượt
  không-nice nào vượt qua 9,59 mà GIỮ. Hai con số này là hai biên
  trên hai chế độ tải khác nhau, KHÔNG phải một khoảng duy nhất.
  Đợt sau vẫn cần parent quyết chuẩn tải cho bar (a) (xem §10 mục 1
  cập nhật).
- **Tick rate TĂNG ở nửa sau (lần 2 liên tiếp):** s77c nửa đầu 2,91/s
  → nửa sau 3,84/s (962 vs 1269 tick); theo quý: Q1 460 / Q2 502 /
  Q3 648 / Q4 621 tick, đều trung vị 0, 85,7–92,4% trong ±1. Ngược
  hẳn với s76 (suy giảm 0,146 → 0,085/s). Nhất quán với diễn giải
  §5: hog nice không đói browser, pump không suy giảm theo thời gian.
- **Dial KHÔNG ĐẠT — dị thường load1 sụp cực đoan (mới, §11.5):**
  trong 300 s dial, load1 chỉ 12,31–12,70 lúc tăng hog lên 32–40
  (19:54:45–19:55:07Z), rồi SỤP về 0,33–0,56 và ở đó suốt tới hết
  dial (19:58:24–19:59:06Z) trong khi 40 hog vẫn sống (hog-count=40,
  threadsR ~45). Driver phát theo luật "dial không đạt vẫn phát ở mức
  đo được". Trong lúc phát, load1 hồi lên mean 19,63 (probe) —
  loadAtPlay tức thời 0,22 (mẫu đơn lúc bắt đầu phát, ngay sau sụp)
  là SỐ GÂY HIỂU LẦM, không dùng; chỉ sampled mean trong lúc phát
  đáng tin (như N5/P5/Q3). Đây là lần sụp load1 mạnh nhất từng quan
  sát (0,17–0,33 trong khi hog sống) — củng cố diễn giải throttle
  cgroup Q3 §5: khi hog vượt quota CPU của cell, task bị throttle
  không còn counted là runnable nên load1 đọc thấp dù hàng đợi vẫn
  đầy (threadsR ~45).

### §11.4 Bar (c) — chỉ số đói pump: VÙNG XÁM lần thứ 3, KHÔNG kết luận

- **Kết quả s77c:** tickRate **3,37/s**, skipStale **29,73%**
  (754/2536 pump; các decision còn lại: capture 1776, skip-seeking 1,
  reset-capture 3, skip-stale 2) → rơi vào **VÙNG XÁM** → không dự
  báo. Phân loại offset: GIỮ (hợp lệ). **KHÔNG kết luận bar đạt/không
  đạt** — đây là lần kiểm chứng thứ 3 không kết luận được (s76 thiếu
  tick; s77 vùng xám + lai; s77c vùng xám nhưng hợp lệ).
- **Bằng chứng phụ:** dry3 tickRate 51,02/s + skipStale 0,37% (1/268)
  → dự báo GIỮ, khớp phân loại GIỮ của dry3 (100% ±1). Nhất quán,
  nhưng dry là lượt validate dụng cụ, không tính vào bar.
- **Bảng tham chiếu cập nhật (thêm s77c):**

| lượt | phân loại | tick rate (/s) | skip-stale-frame | dự báo | khớp? |
|---|---|---|---|---|---|
| s75 (control) | GIỮ | 17,35 | 10,8% | GIỮ | có |
| s73 (N5) | TRUNG-GIAN | 1,6 | 40,3% | KHÔNG-GIỮ | có |
| s77 (P5) | TRUNG-GIAN (k.h.lệ) | 0,17 | 46,2% | KHÔNG-GIỮ | có |
| s78 (P5) | TRUNG-GIAN (k.h.lệ) | 0,26 | 41,0% | KHÔNG-GIỮ | có |
| s76 (Q3) | TRUNG-GIAN (k.h.lệ) | 0,09 | 44,26% | KHÔNG-GIỮ | có (hướng), chưa kết luận |
| s77 (R3 att.1) | GIỮ (LAI, k.h.lệ) | 2,17 | 30,68% | XÁM | không đối chiếu được |
| **s77c (R3 att.3)** | **GIỮ (HỢP LỆ)** | **3,37** | **29,73%** | **XÁM (không dự báo)** | **không đối chiếu được** |
| dry3 (R3) | GIỮ (validate) | 51,02 | 0,37% | GIỮ | có |

- **Đánh giá:** 3 lượt tải dài bằng hog nice đều rơi vào vùng xám
  (tickRate 2,17–3,37/s, skipStale ~30%). Vùng xám hiện tại (tickRate
  1–5/s, skipStale 20–35%) nuốt trọn chế độ nice-hog — bar (c) như
  đăng ký KHÔNG phân biệt được gì trong chế độ này. Muốn kiểm chứng
  bar (c) thì cần lượt rơi ngoài vùng xám — thực tế chỉ có chế độ
  hog không-nice (tickRate <1/s, skipStale >35%) hoặc lượt yên
  (tickRate ≥5/s, skipStale ≤20%) mới làm được. Đây là giới hạn đã
  biết của chỉ số, không phải lỗi đo (xem §10 mục 3 cập nhật).

### §11.5 Bar (b) — playhead kẹt: KHÔNG TÁI HIỆN (0/5 lần thử thực chạy)

- **Định nghĩa đăng ký trước (giữ nguyên P5/Q3):** xem §0.
- **Kết quả s77c:** **0 episode stall** (121 mẫu watcher, tường 5,4–
  658,2 s, playhead 3,57 → 586,37). **Tỉ lệ tái hiện gộp 0/5 lần thử
  thực chạy** (s77-P5, s78-P5, s76-Q3, s77-R3-attempt1, s77c-R3-
  attempt3; s77b attempt 2 bị reboot cắt nên KHÔNG tính — R3 KHÔNG
  tuyên bố "0/6"). stall-events.json KHÔNG có file (0 episode);
  stallBlocks=[] trong results json.
- **Kiểm chứng độc lập từ mẫu thô:**
  - Cửa sổ 30 s (mọi cặp, wall-diff [25,30]s): min advance **14,23 s**
    (166897→193913, ph 147,87 → 162,10). Không stall.
  - Cửa sổ 10 s (P8, mọi cặp [8,10]s): **n=0 cặp** (cadence mẫu
    ~5,4 s — như s77, xem §4). Phương pháp thay thế (mẫu đầu tiên
    ≥10 s sau): n=119, min advance **2,60 s** (172520→183503, ph
    151,80 → 154,40). Dải mở rộng [8,12]s: n=119, min advance cũng
    2,60 s.
  - Kiểm tra đóng băng trực tiếp: **0 chuỗi mẫu liên tiếp đứng yên**
    ph. Khoảng liên tiếp chậm nhất vẫn tiến **1,10 s trong 4,90 s**
    tường (wall 172520, ph 151,80) — chậm nhất trong lượt nhưng vẫn
    tiến, không đứng yên.
  - `playing=false`: 0/121 mẫu. Gap mẫu watcher min 4689 ms / median
    5412 ms / max 6408 ms.
- **Vùng chậm nhất của lượt** (ph ~147–157, wall ~161–199 s): advance
  30 s chỉ 14,23 s; advance 10 s chỉ 2,60 s; khoảng liên tiếp chậm
  nhất 1,10 s/4,90 s — cả ba đều rơi vào cùng vùng ph ~148–157 s.
  Đây là vùng playhead chậm nhất trong lượt, nhưng vẫn tiến đều
  (không freeze, không stall theo định nghĩa). Ghi lại để đợt sau đối
  chiếu — có thể là vùng clip c49–c52 (ph/3 ≈ 49–52) có gì đó khác
  (không suy diễn thêm từ 1 lượt).
- **Đánh giá H1–H4:** stall không tái hiện lần thứ 5 liên tiếp. Với
  **0/5 lần thử** ở đúng điều kiện s72 lần 1, vụ kẹt 3,5 phút của s72
  lần 1 càng giống sự kiện hiếm/khó tái hiện. **Hạ mức ưu tiên** —
  không tích mẫu mù thêm bằng lượt dài kiểu này nữa (như §4).

### §11.6 Metric thay thế + dị thường attempt 3 (mô tả, không phân loại)

- **offset100 (CHỈ MÔ TẢ):** s77c n=1686, trung vị +1, mean +1,15,
  38,7% trong ±1, 2,9% ≤ −5 (dải −27..+14); dry3 n=89, trung vị +1,
  70,8% trong ±1, 0% ≤ −5. Tốt hơn s76 (trung vị −23) nhờ tick dày
  (2231 vs 47). Vẫn không dùng để phân loại.
- **Caps coverage vẫn sụp sau clip c2:** s77c chỉ có 113 caps, mà
  91/113 thuộc clip c2 (c0: 10, c1: 12, c2: 91) — Y HỆT s76/s77.
  Nhưng dry3 caps 269 phân bố đều c0/c1/c2 (84/78/89 theo log probe
  attempt-3 dry — con số này từ KẾT QUẢ probe, analyzer ghi caps=269
  tổng). **Kết luận củng cố (§6):** sampler chết sau c2 chỉ xảy ra ở
  lượt DÀI (nclips lớn), không xảy ra ở lượt khô ngắn — sampler dừng
  sau ~9 s media vì lý do khác (nghi cap buffer đầy / sampler chỉ bám
  3 clip đầu), không phải bằng chứng đói main-thread. Đừng dùng
  caps-chết làm bằng chứng đói nữa (xem §10 mục 4).
- **Element chết format error: 0/121 mẫu** — lần thứ 3 liên tiếp
  không có (s77 0/130, s77c 0/121; chỉ s76 có 97/97). Pattern "pool
  giữ element lỗi" của s76 là sự cố đơn lẻ của lượt đó (có thể do
  seed/import lúc đó), không phải hành vi hệ thống. Hạ mức ưu tiên
  (xem §10 mục 7 cập nhật).
- **freeMB min trong lúc phát: 280 MB** (watcher) — thấp nhất trong
  3 attempt (s77: 461 MB) nhưng không OOM. RAM sau reboot #48 hồi
  chậm (1213 MB lúc khởi động driver attempt 3, 3464 MB lúc xong).
- **Gate v2 (mô tả):** ĐẠT ở s77c, KHÔNG ĐẠT ở dry3 (đúng vì dry3
  không tải). Đạt gate v2 không suy ra presented GIỮ (như M7/N5/P5/Q3).
- **Dụng cụ attempt 3:** probe115r3 không đổi (đã validate); analyzer
  analyze115r3c.py (copy analyze115r3.py, đổi tag dry3/s77c) +
  analyze115r3-s77cstall.py (copy s77stall, đổi thư mục s77c, BỎ khối
  chia trước/sau mốc edit vì attempt 3 không có edit). Driver
  driver115r3c.sh (dựa trên driver115r3b.sh; đổi tag dry3/s77c, hạn
  bắt đầu s77c 20:00Z, bỏ chờ cờ R8 vì cờ đã có từ 19:23Z). Driver
  chạy đủ tới "done" 20:13:22Z; lock đã nhả sạch (cleanup cuối bị từ
  chối đúng vì owner lock lúc đó là '?' — lock đã trống, không phải
  lỗi; kiểm tra lock TRỐNG sau lượt cuối); hog-count.txt = 0; không
  vite mồ côi; không còn tiến trình `node -e` hog nào.

### §11.7 Kiểm chứng attempt 3 (cây cuối 03bf029f — không đổi)

- `tsc --noEmit` (apps/web): **KHÔNG chạy lại trong attempt 3** —
  cây 03bf029f byte-identical với cây Q3 đã chạy tsc 0 (16:21:32Z
  14/11, boot #46) và R2 đã revert về đúng md5 này; chạy tsc lúc
  20:1xZ sẽ tốn CPU trong lúc các luồng sibling khác còn chạy và
  không thêm thông tin (md5 khớp = cùng cây). Ghi rõ thiếu sót này
  thay vì giấu — parent/R10 có thể chạy lại tsc trên cây gộp.
- `vite build`: **KHÔNG chạy trong attempt 3** (cùng lý do; Q3 đã
  chạy vite build PASS 10,97 s trên cùng cây 03bf029f).
- Không sửa production trong luồng này (R3); preview.tsx md5 cuối
  `03bf029f` (khớp lúc viết prereg, cả trước và sau reboot #48).
- Probe copy `probe115r3-frame-parity.mjs`: node --check PASS (đã
  kiểm trước lượt đầu; không đổi trong attempt 2/3).
- Analyzer `analyze115r3c.py`: tính lại toàn bộ từ results json thô;
  bảng §11.2 khớp output analyzer (đếm lại từ đĩa). Stall kiểm chứng
  độc lập từ stall-watch.jsonl thô (§11.5) — khớp kết luận watcher
  (0 episode).
- Lock đã nhả sạch sau s77c (kiểm tra lock TRỐNG 20:1xZ); không vite
  mồ côi; hog-count.txt = 0.

---

## File đổi/thêm (đợt 115 R3)

- `apps/web/scripts/probe115r3-frame-parity.mjs` — probe copy
  probe114q3, chỉ đổi SCRATCH/CFG_DIR (diff 4 dòng; node --check
  PASS; **48.898 byte > 37.768 — ghi chú rõ cho lúc push**).
- `docs/PHASE9_ROUND115_R3_LOADBREAK_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round115-r3/` (không stage): prereg-r3.md (gồm §10 bổ
  sung chạy lại),
  driver115r3.sh + driver115r3.log + runner115r3.sh +
  runner115r3.out (attempt 1),
  driver115r3b.sh + driver115r3b.log + runner115r3b.sh +
  runner115r3b.out (attempt 2 — chờ cờ R8-done, dry2 PASS retry,
  s77b bị reboot #48 cắt),
  driver115r3c.sh + driver115r3c.log + runner115r3c.sh +
  runner115r3c.out (attempt 3 — dry3 + s77c SẠCH),
  analyze115r3.py + analyze115r3.txt/.json (attempt 1),
  analyze115r3c.py + analyze115r3c.txt/.json (attempt 3),
  analyze115r3-partA.py + analyze115r3-partA.txt/.json (Phần A s76),
  analyze115r3-s77stall.py + analyze115r3-s77stall.txt/.json (stall
  s77 attempt 1),
  analyze115r3-s77cstall.py + analyze115r3-s77cstall.txt/.json (stall
  s77c attempt 3),
  vcut-vite-lock-frozen.sh (bản copy đóng băng của vcut-vite-lock.sh,
  md5 khớp repo `fd21193c…`), hog-count.txt,
  hog-load-chr-code-blur-s77-attempt1.txt +
  hog-load-chr-code-blur-s77b-attempt1.txt +
  hog-load-chr-code-blur-s77c-attempt1.txt (sampler driver 5 s; dry
  không có file sampler vì không hog), status.txt, 6 thư mục lượt
  probe dry/s77/dry2/s77b/dry3/s77c (mỗi thư mục có
  frame-parity-results.json + part files + frame-parity-partial.json +
  stall-watch.jsonl + .log + vite-attempt1.log; s77/s77b/s77c không có
  stall-events.json vì 0 episode; s77b chỉ có partial + stall-watch
  vì bị reboot cắt — không có results json; dry 336 tick, s77 1526
  tick, dry2 416 tick, dry3 471 tick, s77c 2231 tick).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).
