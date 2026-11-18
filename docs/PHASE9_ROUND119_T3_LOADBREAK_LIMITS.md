# PHASE9_ROUND119_T3_LOADBREAK_LIMITS.md — Lặp s79 trên cây H3f: s79r3 GIỮ SÁT VẠCH 80,1% @24,80; s79r4 TRUNG GIAN 56,9% @27,35 — cùng cấu hình, cùng cây, chênh 23,2 điểm; nhiễu giữa các lượt lớn nhất từ trước tới nay; điểm gãy VẪN MỞ; kẹt 0/12

**Ngày:** 16/11/2026. **Luồng:** T3 (Phase 9 đợt 119, lượt cron
06:35 +07). **Chủ đề:** Điểm gãy tải — LẶP LẠI s79 ĐÚNG 56 hog /
dial [25,40], 2 lượt (quyết parent đợt 118 §12 mục 3; xem
docs/PHASE9_ROUND118_LIMITS.md §3 + §10 mục 4;
docs/PHASE9_ROUND118_T3_LOADBREAK_LIMITS.md toàn bộ).
**Bối cảnh:** s79 gốc (đợt 117): TRUNG GIAN 79,7% @26,98; s79r1
(đợt 118): GIỮ 83,5% @13,22; s79r2 (đợt 118): TRUNG GIAN 79,0%
@27,75 — tái hiện gần đúng s79 gốc. Điểm gãy VẪN MỞ; GIỮ vững
19,63 (s77c); vùng chuyển tiếp (21,07, 26,98] củng cố ở đầu trên.
Nhiễu giữa các lượt ở tải ~12–13 lên tới 19,1 điểm (s80b vs
s79r1). Bar (b) kẹt 0/10. Bar (c) TUYÊN BỐ KHÔNG ÁP DỤNG cho chế
độ nice-hog — DỪNG kiểm chứng. Luật dial đứng (600 s + hog ≥90 s)
ĐẠT 7/7 lũy kế. Trục đo giữ sampled MEAN.
**CÂY ĐỢT NÀY ĐỔI — CAVEAT SO SÁNH (ghi ngay đầu, đọc trước mọi
con số):** đợt 119 T1 apply patch H3f (108 dòng, 5 hunks;
docs/PHASE9_ROUND118_T2_ZOMBIE_LIMITS.md §161: baseline 03bf029f
→ patched md5 kỳ vọng 5be5a250a552357c50cc189de9a9c08a; quyết
parent: CHẤP NHẬN apply H3f + đo A/B). **Các lượt s79 đợt này đo
TRÊN CÂY H3f md5 `5be5a250`, KHÔNG phải cây 03bf029f của
s79/s79r1/s79r2.** H3f bỏ lần đọc video trong tick nóng (loopMs
≥100) / frame chưa đổi — có thể làm %±1 thay đổi vì lý do khác
tải. So sánh s79r3/r4 với s79r1/r2 chỉ có giá trị MÔ TẢ + caveat;
KHÔNG tuyên bố điểm gãy dời chỉ vì %±1 khác trên cây mới. Mọi
phân loại dưới đây vẫn theo offset + sampled mean như prereg,
nhưng biên GIỮ 19,63 (đo trên cây cũ) KHÔNG được dời bằng dữ liệu
cây mới — xem §2.
**Build lúc viết prereg:** preview.tsx md5 `03bf029f` (H3f CHƯA
apply). **Cây lúc đo:** preview.tsx md5 **`5be5a250a552357c50cc
189de9a9c08a`** — KHỚP ĐÚNG md5 kỳ vọng của T2 (không cảnh báo
sai lệch). **Cờ round119-t1-applied:** xuất hiện 23:57Z sau 660 s
chờ (nội dung cờ: baseline 03bf029f, patch apply rc=0, tsc exit 0
23:57:29Z + vite build PASS 7,03 s 23:57:43Z, chân A baseline xong
trước apply, DIAG-GATE ĐẠT). **Boot lúc viết prereg:** uptime -s
**2026-11-15 23:33:34Z**, boot_id `27c8b1d9-33dd-4c63-9989-
f9254a66dbc2` — **boot MỚI sau #55 (số thứ tự TẠM THỜI — T7 owns,
mù #37 mở)**. **REBOOT giữa đợt (xem §0):** boot mới
`622b3a92-62f0-4514-af82-b78c6fde51d6`, uptime -s **2026-11-16
00:53:41Z** — giết lượt s79r4 attempt 1 lúc đang trích (đã chạy
lại từ đầu theo prereg). Gap thô từ boot trước (23:33:34Z) =
1h20'07" (hiệu số đồng hồ VM, CHƯA hiệu chỉnh giây nháy — T6
owns). RAM khả dụng lúc viết prereg ~1058 MB. F3 tap+relabel TẮT
trong mọi lượt. Chỉ chạy chromium (đường rVFC). Không probe
WebKit. Không sửa production (T3). Không push GitHub, không
release/tag, không TTS 39, không birefnet. Repo local không có
`.git` (bản làm việc; HEAD kiểm qua public API bởi parent).

**Kết quả lớn nhất đợt này:**
- **(a) s79r3 GIỮ 80,1% @24,80 — nhưng SÁT VẠCH, chỉ hơn vạch
  80% ~2 tick:** 1832 tick, trung vị 0, mean +0,65 (1468/1832 =
  80,13%; vạch 80% = 1465,6). Đây là lượt GIỮ đầu tiên ở tải
  >21,07 kể từ s78b (80,9% @21,07) — NHƯNG chỉ 1 lượt, trên cây
  H3f mới, và sát vạch tới mức 3 tick đổi chiều là đủ lật phân
  loại. KHÔNG dời biên GIỮ vững (xem §2).
- **(b) s79r4 TRUNG GIAN 56,9% @27,35 — TỆ NHẤT trong mọi lượt
  dài nice-hog từ trước tới nay:** 1350 tick (ít nhất trong các
  lượt dài), trung vị +1, mean +1,53, tickRate chỉ 1,50/s (thấp
  nhất). Ở tải gần bằng s79r2 (27,35 vs 27,75) mà %±1 kém tới
  **22,1 điểm** (56,9% vs 79,0%). Yếu tố khác biệt chưa tách
  được (xem §2): s79r4 chạy lại trên boot MỚI chỉ ~5 phút sau
  reboot (dial bắt đầu 00:58:23Z, boot 00:53:41Z) trong lúc máy
  còn ổn định lại + các luồng khác khởi động lại; trung vị offset
  +1 hệ thống cả 4 quý (chưa lượt dài nào như vậy ngoài s80b).
- **(c) Cùng cấu hình, cùng cây H3f, 2 phân loại khác nhau —
  chênh 23,2 điểm ở tải chênh chỉ 2,55:** s79r3 GIỮ 80,1% @24,80
  vs s79r4 TRUNG GIAN 56,9% @27,35. Đây là bằng chứng nhiễu
  giữa các lượt MẠNH NHẤT từ trước tới nay (vượt cặp s80b/s79r1
  19,1 điểm đợt 118). sampled mean load1 KHÔNG dự báo được
  offset ở độ phân giải ~1 điểm tải — nay có 2 cặp độc lập chứng
  minh (19,1 điểm ở ~12–13 trên cây cũ; 23,2 điểm ở ~25–27 trên
  cây H3f).
- **(d) Pattern "quý tải cao → %±1 tốt hơn" (3/3 lượt dài gần
  nhất, đợt 117–118) BỊ PHÁ VỠ đợt này — 0/2:** s79r4 quý tải
  cao nhất Q3 (mean 52,55) có %±1 TỆ NHẤT (53,1%); s79r3 quý tải
  thấp nhất Q2 (mean 3,94) có %±1 TỐT NHẤT (83,2%). Giả thuyết
  throttle (load1 thấp = đang bị bóp = main thread đói → offset
  tệ) YẾU ĐI ĐÁNG KỂ — xem §5.
- **(e) Bar (b) — kẹt ở biên clip: KHÔNG TÁI HIỆN, 0/12 lần thử
  thực chạy** (s79r3 = #11, s79r4 = #12; cả hai 0 episode stall,
  kiểm chứng độc lập từ stall-watch.jsonl thô).
- **(f) Luật dial đứng ĐẠT 3/3 lượt dial đợt này (lũy kế 10/10).**
  Cả 3 lượt dial (s79r3, s79r4 attempt 1, s79r4 chạy lại) đều có
  mẫu ì/sụp cực đoan: load1 rơi đơn điệu xuống 0,41–0,68 với đủ
  56 hog rồi nhảy vọt lên ~31–34 trong 30–60 s; ĐẠT ở 333 s /
  374 s / 355 s hog-runtime. 0 lần từ chối ĐẠT sớm (load1 chưa
  vào dải trước ~290 s trong cả 3 lượt).
- **(g) Cờ DIALING mở rộng hoạt động đúng cả 2 lượt chạy đủ**
  (tạo lúc bắt đầu dial, xóa CHỈ khi hog đã tắt hẳn sau lượt —
  phủ cả chờ lock + phát; xem §8). Lỗi vận hành: cờ của attempt
  bị reboot giết còn sót lại sau reboot (hogs đã chết nhưng file
  còn) — đã dọn tay lúc resume; ghi để đợt sau lưu ý.
- **(h) Lock v2: 0 TIMEOUT cho T3 đợt này; stale-lock sau reboot
  được dọn đúng luật** (chủ cũ pid 54295 chết + không vite trên
  cổng + boot đổi, tuổi 1650 s → acquire sau 3 s chờ). Lock được
  nhả sau MỖI attempt (hold 37 s / 1111 s / 1148 s) — không giữ
  xuyên lượt.
- **(i) Lỗi driver do T3 tự phát hiện + sửa giữa đợt (ghi rõ,
  không giấu):** `time_left()` so `%H%M < 0145` vô hiệu qua nửa
  đêm UTC — lần chạy driver đầu (23:47Z) bỏ qua TẤT CẢ các lượt
  với lý do "hết giờ" dù còn ~2 giờ. Đã sửa thành so epoch với
  hạn 2026-11-16 01:45Z + phân biệt rc=2 (hết giờ) với rc=0 +
  chỉ kết luận stall khi có results.json thật; chạy lại driver
  00:57Z và mọi lượt chạy đủ. Hai dòng "s79r3/s79r4 KHÔNG stall
  #11/#12" lúc 23:59:15/35Z trong driver log là của lần chạy lỗi
  đó — KHÔNG có giá trị, kết luận stall thật ở 00:30:15Z /
  01:23:36Z (xem §0/§4).
- **(j) Bar (c): KHÔNG kiểm chứng đợt này** (quyết parent).
  Chỉ ghi mô tả: s79r3 tickRate 2,04/s, skipStale 32,3%; s79r4
  1,50/s, 33,8% — cả hai lại rơi vào vùng xám cũ (không đếm).
  D1: không lượt nào cho tương quan đơn điệu sạch theo quý (xem
  §3).

---

## §0. Bối cảnh chạy (1 reboot giữa đợt giết s79r4 attempt 1 lúc đang trích; chạy lại từ đầu; lỗi driver time_left đã sửa)

- **Reboot 00:53:41Z (boot mới 622b3a92…):** s79r3 + dry đã xong
  trước reboot (dry 00:05–00:06Z, s79r3 00:06–00:30Z, boot
  27c8b1d9…). s79r4 attempt 1: dial ĐẠT 00:36:49Z (33,86 @374 s),
  phát 00:36:50Z → playhead tới 743,5/750 lúc tường 875,9 s,
  trích xong chunk A-blend (5094 ms) + B-caps (679 ms) lúc
  00:52:12Z, đang trích D-state thì reboot 00:53:41Z giết driver
  + probe + hogs. Không có frame-parity-results.json → lượt
  KHÔNG hợp lệ, KHÔNG tính vào bar nào, KHÔNG đếm vào tỉ lệ kẹt
  (xem §4). Theo prereg §0 (lượt reboot cắt ngang → chạy lại từ
  đầu, tối đa 1 lần chạy lại): **s79r4 chạy lại từ đầu** sau
  resume 00:57:03Z (driver mới; dry + s79r3 được bỏ qua vì đã có
  results.json — resume lanh, xem dưới). Attempt chạy lại: dial
  00:58:23Z → ĐẠT 01:04:18Z (31,36 @355 s) → phát 01:04:21Z →
  probe exit 01:23:30Z, exit=0, đủ results.json. **Không reboot
  nào nữa trong đợt** (boot 622b3a92… giữ nguyên tới cuối đợt
  01:23:36Z).
- **Lỗi driver time_left + sửa (ghi rõ):** lần chạy driver đầu
  23:47:15Z chờ cờ T1 660 s (cờ xuất hiện 23:57Z, md5 5be5a250
  đúng kỳ vọng) rồi bỏ qua dry + s79r3 + s79r4 với lý do "hết
  giờ" lúc 23:59:15Z — vì `time_left()` so `date +%H%M` (2359)
  `< 0145` (sai: hạn 01:45Z là ngày UTC HÔM SAU). Driver kết
  thúc 23:59:35Z với rc=0 giả (run_long trả 0 khi hết giờ) và 2
  dòng stall "KHÔNG #11/#12" giả (không có results.json nào).
  T3 phát hiện khi kiểm log lúc 00:02Z, sửa driver: (1)
  time_left so epoch với hạn `2026-11-16 01:45:00Z`; (2) run_long
  trả 2 khi hết giờ (MAIN phân biệt với rc=0); (3) run_dry trả 1
  khi hết giờ ở lần đầu; (4) MAIN chỉ kết luận stall khi có
  frame-parity-results.json thật. `bash -n` PASS + kiểm logic
  time_left (TRUE lúc 00:04Z). Chạy lại driver 00:57:03Z (sau
  reboot; driver tự chờ cờ — cờ đã có nên qua ngay, md5 ổn định
  60 s = 5be5a250). Bài học: hạn giờ trong driver phải dùng epoch
  tuyệt đối, không dùng %H%M, khi hạn qua nửa đêm UTC.
- **Resume lanh sau reboot (patch driver trước khi chạy lại):**
  MAIN bỏ qua dry + s79r3 nếu đã có frame-parity-results.json
  (dry 00:05–00:06Z PASS, s79r3 exit=0 00:30:10Z — dữ liệu còn
  nguyên vẹn sau reboot, md5 5be5a250 trước = sau). Chỉ s79r4
  chạy lại từ đầu (đã xóa chunk A/B + partial cũ của attempt bị
  giết — xem §4 về stall-watch). Dọn tay: xóa cờ DIALING sót
  lại của attempt bị giết (hogs đã chết theo reboot nhưng file
  còn — kẽ hở: cờ DIALING không tự hủy theo reboot), reset
  hog-count.txt về 0.
- **T1 không sửa cây trong lúc T3 đo:** md5 preview.tsx 5be5a250
  trước = sau mọi lượt chạy đủ (dry, s79r3, s79r4 chạy lại);
  mtimeChangedMidRun=False cả 3 lượt; cờ round119-t1-applied còn
  nguyên suốt đợt; không có cờ round119-tree. T1 đã xong chân A
  baseline + apply H3f trước khi T3 đo (tsc 0 + vite build PASS
  7,03 s lúc 23:57Z, theo nội dung cờ). Chân B của T1 chạy song
  song trong lúc T3 đo (T1 xong chân B 00:04:25Z theo driver-t1
  .log — trước reboot; sau reboot T1 chưa thấy chạy lại lúc T3
  resume — không ảnh hưởng số liệu T3 ngoài tải sibling).
- **Tải nền sibling:** T1/T2/T4/T5/T6/T7/T8/T9/T10 đợt 119 chạy
  song song + khởi động lại sau reboot. Tải sibling có trong
  sampled mean (đó là tải probe thực sự chịu; ghi rõ, không tách).
  Hog T3 chỉ bật trong cửa sổ đo của T3 (dial + phát + teardown),
  nhả ngay sau mỗi lượt; hog-count.txt = 0 lúc kiểm cuối; cờ
  hogs-off 01:23:36Z (boot 622b3a92…).
- **RAM:** freeMB tối thiểu trong lúc phát: s79r3 **341 MB**,
  s79r4 **283 MB** (từ stall-watch; xem §4). Không OOM lượt nào.
  RAM khả dụng lúc resume ~1165 MB (00:58Z).
- **ENOSPC — 0 lần:** vite tạm `server.watch.ignored: ["**/**"]`
  + CFG_DIR riêng /tmp/round119-t3; vite lên ngay cả 3 lượt chạy
  đủ. Lưu ý: /tmp/round119-t3 + CFG vite có thể đã mất sau reboot
  — probe tạo lại khi chạy lại, không lỗi.

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0; cây H3f 5be5a250)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | median load1 | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-dry-t3-119 | stripes-code-blur | chạy khô, không hog | — | **5,12** (n=3) | 5,19 | 5,3 | **274** | 30,54 | 214 | **0** (−1..+2) | 99,6% | **GIỮ (chỉ validate dụng cụ)** |
| chr-code-blur-s79r3 | stripes-code-blur | [25, 40] | **ĐẠT 32,46** (56 hog, hog-runtime 333 s) | **24,80** (n=181) | 17,51 | 61,3 | **1832** | 2,04 | 108 | **0** (−3..+23) | **80,1%** | **GIỮ (HỢP LỆ: ≥50 tick, md5 sạch) — SÁT VẠCH** |
| chr-code-blur-s79r4 | stripes-code-blur | [25, 40] | **ĐẠT 31,36** (56 hog, hog-runtime 355 s; chạy lại sau reboot) | **27,35** (n=183) | 19,89 | 62,6 | **1350** | 1,50 | 105 | **+1** (−3..+25) | **56,9%** | **TRUNG GIAN (HỢP LỆ: ≥50 tick, md5 sạch)** |
| chr-code-blur-s79r4 attempt 1 | stripes-code-blur | [25, 40] | **ĐẠT 33,86** (56 hog, hog-runtime 374 s) | — (không có results.json) | — | — | — | — | — | — | — | **LOẠI (reboot cắt lúc đang trích D-state; chạy lại)** |

- **dry-t3-119 (nclips=3, 9 s media, boot 27c8b1d9…):** 274 tick,
  GIỮ 99,6% ±1 (273/274), tickRate 30,54/s, skipStale 5,2%
  (11/212), caps 214 phân bố đều c0/c1/c2 (70/73/71 — xem §6),
  loadSamples mean 5,12 — dry dưới tải sibling nhẹ (load ~5).
  Đủ validate probe119t3 trên cây H3f: probe exit=0, trích đủ
  chunk, mtimeChanged=false, pageErrs=[]. offset100 mô tả: 95,3%
  ±1, trung vị 0.
- **s79r3 (nclips=250, 750 s media, boot 27c8b1d9…):** dial ĐẠT
  00:11:38Z (load1 32,46, 2 mẫu liên tiếp trong [25,40],
  hog-runtime 333 s, 56 hog, 0 lần từ chối ĐẠT sớm); acquire lock
  ngay (wait 1 s); app boot OK; phát 00:11:39Z → probe exit
  00:30:10Z (tường phát + trích 1111 s giữ lock; tường phát riêng
  898,3 s, playhead tới 747,3/750 s — mẫu watcher cuối); probe
  exit=0. **1832 tick — gấp 36 lần ngưỡng 50.** Phân loại GIỮ
  theo offset, **HỢP LỆ** (md5 5be5a250 → 5be5a250,
  mtimeChangedMidRun=False, không reboot cắt ngang). **SÁT VẠCH:**
  1468/1832 = 80,13%; vạch 80% = 1465,6 — chỉ vượt ~2 tick. Nửa
  đầu 81,9% (916 tick) / nửa sau 78,4% (916 tick) — lượt SUY DẦN
  nhẹ theo thời gian.
- **s79r4 (nclips=250, 750 s media, boot 622b3a92… — chạy lại):**
  dial ĐẠT 01:04:18Z (load1 31,36, hog-runtime 355 s, 56 hog, 0
  lần từ chối ĐẠT sớm); acquire lock sau khi dọn stale-lock (wait
  3 s — xem §8); app boot OK; phát 01:04:21Z → probe exit
  01:23:30Z (tường phát + trích 1148 s giữ lock; tường phát riêng
  902,7 s, playhead tới 749,0/750 s — mẫu watcher cuối); probe
  exit=0. **1350 tick — gấp 27 lần ngưỡng 50.** Phân loại TRUNG
  GIAN theo offset, **HỢP LỆ** (md5 5be5a250 → 5be5a250,
  mtimeChangedMidRun=False, không reboot cắt ngang trong lần chạy
  lại). Thiếu vạch 80% tới 312 tick (768/1350 = 56,89%; vạch 80%
  = 1080). Nửa đầu 58,5% / nửa sau 55,3% — tệ đều cả lượt, không
  phải suy dần.
- **Hai sampler khớp nhau về tải trong lúc phát (ở mức mean):**
  s79r3: probe loadSamples mean 24,80 (n=181) vs driver sampler
  5 s mean 21,73 (n=283, max 59,34) — driver thấp hơn vì bao gồm
  cả giai đoạn dial sụp (load ~0,5–1 trong ~280 s đầu dial).
  s79r4: probe 27,35 (n=183) vs driver sampler 25,16 (n=293, max
  62,53) — cùng lý do (dial sụp tới 0,41). Mức tải trong lúc phát
  được đo chắc chắn ở ~25 (s79r3) và ~27 (s79r4) theo probe
  loadSamples.
- **Số hog lúc phát: đủ 56 cả hai lượt** (không như s79r1 đợt 118
  chỉ 24 hog — lần này load1 không vượt trần [25,40] trong lúc
  ramp, nên luật dial không giảm hog). Đây là 2 lượt lặp s79 đầu
  tiên chạy với đủ 56 hog lúc phát trên cả hai lượt.

## §2. Bar (a) — điểm gãy: VẪN MỞ; GIỮ vững vẫn 19,63 (cây cũ); nhiễu 23,2 điểm ở tải ~25–27 trên cây H3f

- **Điểm gãy: VẪN MỞ** (không có lượt GÃY nào). Không có lượt
  GIỮ mới nào trên cây cũ 03bf029f (cả hai lượt đợt này đều trên
  cây H3f). Analyzer (chỉ trong phạm vi 2 lượt đợt này): "Bar
  (a): chi co GIU (cao nhat load1mean=24.8), KHONG co GAY -> diem
  gay VAN MO, giu toi 24.8" — câu này CHỈ đúng trong phạm vi đợt
  này + trên cây H3f; kết luận gộp toàn lịch sử (xem dưới) mới là
  chuẩn: **GIỮ vững vẫn 19,63 (s77c, cây 03bf029f)**.
- **s79r3 GIỮ 80,1% @24,80 — KHÔNG dời biên GIỮ, vì 3 lý do độc
  lập (chỉ cần 1 đã đủ):** (i) chỉ 1 lượt GIỮ ở tải này, trong khi
  lượt còn lại cùng cấu hình + cùng cây ở tải cao hơn một chút
  lại TRUNG GIAN sâu (56,9% @27,35) — hai lượt MÂU THUẪN nhau về
  biên; (ii) GIỮ sát vạch (~2 tick trên vạch 80%): với nhiễu
  giữa các lượt ≥19 điểm đã đo được, một lượt GIỮ sát vạch không
  đủ sức nặng để dời biên; (iii) cây H3f khác cây đo biên 19,63
  — prereg §3 đã đăng ký trước: dời biên cần 2 lượt GIỮ, và dữ
  liệu cây mới không gộp thẳng vào biên cây cũ. Biên GIỮ 21,07
  của s78b vẫn là GIỮ yếu, không được xác nhận thêm (s79r3 GIỮ ở
  24,80 không xác nhận 21,07 vì 24,80 > 21,07 và sát vạch).
- **Bảng liều–đáp ứng gộp (8 lượt nice-hog hợp lệ; 6 lượt cây
  cũ 03bf029f + 2 lượt cây H3f 5be5a250 — hai cây KHÔNG gộp
  chung, kẻ vạch rõ):**

| lượt | cây | load1 mean | median load1 | %±1 | trung vị off | mean off | phân loại |
|---|---|---|---|---|---|---|---|
| s80b (T3, đợt 117) | 03bf029f | 12,03 | 9,86 | 64,4% | +1 | +1,19 | TRUNG GIAN |
| s79r1 (T3, đợt 118) | 03bf029f | 13,22 | 9,32 | 83,5% | 0 | +0,55 | GIỮ |
| s77c (R3) | 03bf029f | 19,63 | — | 88,7% | 0 | +0,70 | GIỮ |
| s78b (S3) | 03bf029f | 21,07 | 11,73 | 80,9% | 0 | +0,66 | GIỮ |
| s79 (T3, đợt 117) | 03bf029f | 26,98 | 20,17 | 79,7% | 0 | +0,69 | TRUNG GIAN |
| s79r2 (T3, đợt 118) | 03bf029f | 27,75 | 26,22 | 79,0% | 0 | +0,71 | TRUNG GIAN |
| s79r3 (T3, đợt 119) | **5be5a250 (H3f)** | 24,80 | 17,51 | **80,1%** | 0 | +0,65 | GIỮ (sát vạch) |
| s79r4 (T3, đợt 119) | **5be5a250 (H3f)** | 27,35 | 19,89 | **56,9%** | +1 | +1,53 | TRUNG GIAN |

  **Không đơn điệu — nay có bằng chứng nhiễu trực tiếp THỨ HAI,
  mạnh hơn lần đầu:** s79r3 GIỮ 80,1% @24,80 vs s79r4 TRUNG GIAN
  56,9% @27,35 — chênh **23,2 điểm** ở tải chênh chỉ 2,55, cùng
  cây H3f, cùng probe, cùng cấu hình dial, cùng 56 hog lúc phát.
  Cặp này mạnh hơn cặp s80b/s79r1 (19,1 điểm) vì nó loại được
  yếu tố "số hog lúc phát khác nhau" (cả hai đều đủ 56 hog) và
  "cây khác nhau" (cùng cây H3f). Yếu tố khác biệt chưa tách
  được: s79r3 chạy trên boot 27c8b1d9… đã ~40 phút tuổi (dial
  00:06Z, boot 23:33Z), s79r4 chạy lại trên boot 622b3a92… mới
  ~5 phút tuổi (dial 00:58Z, boot 00:53:41Z) trong lúc máy còn
  ổn định lại sau reboot (T7 replay/postboot + các luồng khác
  khởi động lại); RAM min lúc phát s79r3 341 MB vs s79r4 283 MB;
  tickRate s79r3 2,04/s vs s79r4 1,50/s; trung vị offset s79r4 là
  +1 hệ thống cả 4 quý (s79r3 là 0). **Kết luận:** trong chế độ
  hog nice -n 19, sampled mean load1 KHÔNG dự báo được offset ở
  độ phân giải ~1–3 điểm tải; nhiễu giữa các lượt ở cùng tải có
  thể ≥23 điểm. Mô hình "vùng chuyển tiếp rộng + nhiễu lớn giữa
  các lượt" (quyết parent đợt 117) được củng cố thêm — nay có 2
  cặp nhiễu trực tiếp độc lập (19,1 + 23,2 điểm).
  (Caveat: chỉ 8 lượt; cặp s79r3/s79r4 khác nhau ở boot age +
  thời điểm sau reboot + tickRate — không đủ dữ liệu để tách yếu
  tố nào gây ra 23,2 điểm. Đặc biệt s79r4 chạy quá sớm sau reboot
  là confound lớn nhất — xem §10 mục 1.)
- **So sánh s79r4 với s79r2 (cùng tải ~27, khác cây):** s79r2
  79,0% @27,75 (cây cũ, boot #54 đã 56 phút) vs s79r4 56,9%
  @27,35 (cây H3f, boot mới 5 phút). Chênh 22,1 điểm. KHÔNG thể
  kết luận H3f làm tệ đi — vì s79r3 trên CÙNG cây H3f đạt 80,1%,
  và s79r4 có confound boot-mới-sau-reboot. Việc tách ảnh hưởng
  của H3f khỏi nhiễu giữa các lượt thuộc về phép đo A/B của T1
  (chân A/B cùng spec), không phải dữ liệu T3. T3 chỉ ghi: trên
  cây H3f, 2 lượt lặp s79 cho 80,1% và 56,9% — phân tán 23,2
  điểm, lớn hơn phân tán của cặp s79/s79r2 trên cây cũ ở cùng
  tải (0,7 điểm).
- **Caveat chế độ tải VẪN ĐỨNG:** biên 19,63/21,07 đo bằng hog
  nice -n 19 trên cây cũ. Dãy hog không-nice (N5/P5/Q3) vẫn dừng
  ở biên GIỮ 9,59. Ba con số này là biên trên các chế độ/cây khác
  nhau, KHÔNG phải một khoảng duy nhất.
- **Toán tích tick prereg ĐÚNG (s79r3) / THẤP HƠN DỰ KIẾN
  (s79r4):** prereg tính ~1700–1960 tick ở rate ~2/s; thực tế
  s79r3 1832 tick ở 2,04/s (đúng), s79r4 chỉ 1350 tick ở 1,50/s
  (thấp hơn — tickRate thấp nhất trong mọi lượt dài nice-hog:
  các lượt trước 1,91–3,37/s). Điểm hòa vốn 50 tick không bị chạm
  tới (1350 >> 50), nhưng tickRate 1,50/s của s79r4 là dị thường
  cần ghi (xem §5/§6).
- **Trong [0,+2] (tức ±1 quanh trung vị +1) của s79r4 chỉ
  66,3%** (tính lại từ blendTick thô: off ∈ {0,1,2} = 426+238+
  235 = 899/1350) — s79r4 không phải chỉ lệch +1 hệ thống (như
  s80b: trong [0,+2] chỉ 68,8%). s79r3 trung vị 0 nên không có
  vấn đề này.

## §3. Bar (c) — KHÔNG kiểm chứng đợt này (quyết parent); chỉ ghi mô tả + D1 không ủng hộ

- **Quyết đăng ký trước (prereg-t3 §3, theo quyết parent đợt
  117):** bar (c) như đã đăng ký TUYÊN BỐ KHÔNG ÁP DỤNG ĐƯỢC cho
  chế độ hog nice -n 19; đợt này KHÔNG kiểm chứng nó, chỉ ghi
  tickRate + skipStale mô tả, không dự báo, không đếm xám. Phần
  này tuân thủ quyết đó.
- **Số mô tả:** s79r3 tickRate **2,04/s**, skipStale **32,3%**
  (719/2224 pump; capture 1470, skip-stale 15, reset-capture 10,
  skip-seeking 5, duplicate 5); s79r4 tickRate **1,50/s**,
  skipStale **33,8%** (596/1766 pump; capture 1136, skip-stale
  19, reset-capture 4, skip-seeking 7, duplicate 4). Cả hai đều
  rơi vào vùng xám cũ (tickRate 1–5/s, skipStale 20–35%) — lần
  xám thứ 9 + 10 NẾU đếm; **không đếm**, vì đã dừng kiểm chứng.
  Dry-t3-119: 30,54/s + 5,2% (11/212) — ngoài vùng xám, như kỳ
  vọng ở lượt nhẹ.
- **Chẩn đoán D1 — tương quan theo quý (MÔ TẢ, đăng ký trước):**
  - **s79r3:** skipStale theo quý 30,5% / 34,7% / 34,3% /
    29,8% vs %±1 80,6% / 83,2% / 78,8% / 78,0% — quý skipStale
    CAO NHẤT (Q2 34,7%) có %±1 TỐT NHẤT (83,2%); quý skipStale
    thấp nhất (Q4 29,8%) có %±1 tệ nhất (78,0%) — NGƯỢC hướng
    kỳ vọng. tickRate theo quý 2,34 / 2,10 / 1,99 / 1,83/s vs
    %±1 80,6 / 83,2 / 78,8 / 78,0 — không đơn điệu (Q1 tickRate
    cao nhất nhưng %±1 chỉ 80,6%). Capture rate 1,85 / 1,63 /
    1,63 / 1,54/s — cùng chiều yếu với %±1 (Q1 cao nhất, Q4 thấp
    nhất) nhưng Q2=Q3 bằng nhau mà %±1 chênh 4,4 điểm.
  - **s79r4:** skipStale theo quý 36,2% / 33,0% / 34,2% /
    31,5% vs %±1 59,4% / 57,7% / 53,1% / 57,4% — quý skipStale
    cao nhất (Q1 36,2%) có %±1 tốt nhất (59,4%); quý skipStale
    thấp nhất (Q4 31,5%) có %±1 57,4% (gần tốt nhất); quý %±1 tệ
    nhất (Q3 53,1%) có skipStale 34,2% (giữa). KHÔNG đơn điệu.
    tickRate 1,66 / 1,43 / 1,43 / 1,49/s — gần phẳng trong khi
    %±1 dao động 53,1–59,4%.
  - **Kết luận D1 (mô tả):** cả hai lượt đợt này đều KHÔNG ủng
    hộ "skipStale + tickRate theo dõi offset theo quý" — ngược
    với s79r2 đợt 118 (đơn điệu sạch). Gộp 4 lượt gần nhất (s79r1
    phẳng, s79r2 đơn điệu sạch, s79r3 ngược, s79r4 không đơn
    điệu): bằng chứng HỖN HỢP, thiên về không có quan hệ ổn định.
    n=4 quý mỗi lượt, không đủ để tuyên bố lại bar (c) hay mở
    lại kiểm chứng. Ghi lại để đợt sau tham khảo NẾU parent muốn
    đăng ký bar MỚI — KHÔNG chỉnh ngưỡng hậu kiểm trên dữ liệu
    này, KHÔNG tự mở lại bar (c).
- **D2/D3 (đợt 117) vẫn đứng, không đo lại:** ngưỡng GIỮ ≥5/s
  chưa bao giờ tới được ở lượt dài nice-hog (9 lượt hợp lệ:
  1,50–3,37/s — s79r4 1,50/s là thấp nhất); ngữ nghĩa skip-stale
  là guard đúng (đọc code preview.tsx ~dòng 2216), không phải
  bằng chứng pump đói.

## §4. Bar (b) — playhead kẹt ở biên clip: KHÔNG TÁI HIỆN (0/12 lần thử thực chạy)

- **Định nghĩa stall đăng ký trước (giữ nguyên P5/Q3/R3/S3):**
  xem prereg-t3 §0.
- **Kết quả s79r3:** **0 episode stall** (163 mẫu watcher, tường
  6,1–897,6 s, playhead 4,17 → 747,27). **Kết quả s79r4 (chạy
  lại):** **0 episode stall** (164 mẫu watcher, tường 5,2–906,0
  s, playhead 2,17 → 749,03). **Tỉ lệ tái hiện gộp 0/12 lần thử
  thực chạy** (s77-P5 #1, s78-P5 #2, s76-Q3 #3, s77-R3-att1 #4,
  s77c-R3-att3 #5, s78b-S3-att2 #6, s79-T3 #7, s80b-T3 #8, s79r1-T3
  #9, s79r2-T3 #10, s79r3-T3 #11, s79r4-T3 #12; s77b att2 + s78
  att1 + s80 att1 bị reboot cắt nên KHÔNG tính; **s79r4 attempt 1
  đợt này cũng bị reboot cắt (lúc đang trích) nên KHÔNG tính** —
  dù phần phát của nó đã xong 743,5/750, không có results.json
  nên không phải một lần thử hoàn chỉnh).
- **Cảnh báo về 2 dòng log stall giả lúc 23:59Z (ghi rõ để đợt
  sau không đếm nhầm):** lần chạy driver đầu (lỗi time_left) đã
  ghi "s79r3 CHUA co stall — lan thu #11: KHONG" và "s79r4 …
  #12: KHONG" lúc 23:59:15/35Z khi CHƯA CÓ lượt nào chạy. Hai
  dòng đó VÔ GIÁ TRỊ và KHÔNG được đếm vào 0/12. Kết luận thật:
  s79r3 #11 lúc 00:30:15Z (sau probe exit=0, có results.json) và
  s79r4 #12 lúc 01:23:36Z (sau probe exit=0, có results.json).
  Driver đã vá để chỉ kết luận khi có results.json (xem §0).
- **Kiểm chứng độc lập từ mẫu thô (tính lại từ stall-watch.jsonl,
  không tin mù watcher — analyzer analyze119t3-s79r3stall.py /
  analyze119t3-s79r4stall.py):**
  - **s79r3:** Cửa sổ 30 s (mọi cặp, wall-diff [25,30]s): n=158,
    min advance **16,47 s**. Không stall. Cửa sổ 10 s (P8, mọi
    cặp [8,10]s): n=0 — KHÔNG CÓ CẶP NÀO (cadence mẫu ~5,4 s nên
    diff đôi cặp nhảy qua dải [8,10]s); **0 cửa sổ advance
    <1,33 s**. Cửa sổ 10 s (phương pháp thay thế — mẫu đầu tiên
    ≥10 s sau mỗi mẫu): min advance **4,70 s**. Dải mở rộng
    [8,12]s: n=154, min advance cũng 4,70 s. Kiểm tra đóng băng
    trực tiếp: **0 chuỗi mẫu liên tiếp đứng yên** ph. Khoảng liên
    tiếp chậm nhất vẫn tiến **0,20 s trong 2,12 s** tường (wall
    751800, ph 627,13 — một nhịp chậm đơn lẻ, không phải freeze:
    mẫu sau đó tiếp tục tiến). `playing=false`: 0/163 mẫu. Gap
    mẫu watcher min 2119 ms / median 5482 ms / max 10184 ms (1
    gap >10 s duy nhất — xem dưới).
  - **s79r4 (chạy lại):** Cửa sổ 30 s: n=159, min advance
    **16,93 s**. Không stall. Cửa sổ 10 s (P8): n=3, min advance
    **7,53 s**; **0 cửa sổ <1,33 s**. Phương pháp thay thế: min
    advance **5,53 s**. Dải [8,12]s: n=157, min advance cũng
    5,53 s. **0 chuỗi mẫu liên tiếp đứng yên.** Khoảng liên tiếp
    chậm nhất vẫn tiến **2,07 s trong 5,73 s** tường (wall
    877085, ph 730,1). `playing=false`: 0/164 mẫu. Gap mẫu
    watcher min 4807 ms / median 5495 ms / max 6599 ms.
  - **Vấn đề stall-watch s79r4 bị TRỘN 2 attempt — đã tách sạch
    (ghi rõ phương pháp):** probe append vào stall-watch.jsonl
    của tag (không ghi đè), nên file sau lần chạy lại chứa 325
    dòng: 161 dòng của attempt 1 (wall tới 882396 ms, ph 749,5)
    + 164 dòng của lần chạy lại (wall 5221 → 906000 ms, ph 2,17
    → 749,03). Analyzer chạy lần đầu trên file trộn cho ra số
    vô nghĩa (gap min −877175 ms, advance −9,03 s — artifact
    trộn). T3 đã tách: backup file trộn thành
    `stall-watch.jsonl.mixed-attempts`, giữ lại đúng 164 dòng
    của lần chạy lại (điểm reset wall duy nhất ở dòng 161: wall
    882396 → 5221, ph 749,5 → 2,17), chạy lại analyzer trên file
    sạch — mọi số s79r4 trong LIMITS này đều từ file sạch đó.
    Các file khác của s79r4 không bị trộn (results.json +
    part-A..E ghi đè mới; hog-load-attempt1.txt ghi đè mới bởi
    driver process mới).
  - **Vùng chậm nhất:** s79r3 ph ~605–640 (wall ~720–770 s,
    clip c202–c213); s79r4 ph ~713–749 (wall ~855–906 s, cuối
    clip) và ph ~137–143 (wall ~166–176 s). Lại KHÁC vùng của đợt
    117 (ph ~255–296) và đợt 118 (s79r1 ph ~225–241; s79r2 ph
    ~59–66 và ~502–509) và khác nhau giữa hai lượt đợt này. Giả
    thuyết "vùng clip xấu ổn định" càng yếu: 6 lượt dài gần nhất
    chậm ở 6 vùng khác nhau. Vùng chậm vẫn tiến đều 4,7–7,5 s/
    10 s, không freeze, không stall theo định nghĩa.
  - **Nguồn kết luận:** analyzer stall chạy trên stall-watch.jsonl
    của ĐÚNG tag từng lượt (s79r3 file gốc; s79r4 file đã tách
    sạch) — không dùng dòng log driver (trừ 2 dòng giả 23:59Z đã
    loại ở trên).
- **Đánh giá H1–H4:** stall không tái hiện lần thứ 11 + 12 liên
  tiếp. Với **0/12 lần thử** ở đúng điều kiện s72 lần 1, vụ kẹt
  3,5 phút của s72 lần 1 càng giống sự kiện hiếm/khó tái hiện.
  **Giữ mức ưu tiên thấp** — không tích mẫu mù thêm bằng lượt dài
  kiểu này nữa.

## §5. Dị thường — tải dao động hai chế độ + dial sụp cực đoan 3/3 + pattern quý tải cao bị phá vỡ

- **Tải hai đỉnh, dao động theo quý (mạnh như s79/s79r2):**
  - **s79r3:** probe loadSamples (n=181): mean 24,80 nhưng phân
    bố <5: 29,3% / [5,12): 15,5% / [12,20): 7,7% / [20,25):
    4,4% / [25,40): 8,8% / ≥40: 34,3% — ~30% mẫu <5 và ~34%
    mẫu >40, gần như không có mẫu ở giữa. Theo quý tải: Q1 mean
    42,23 (trung vị 48,06) / Q2 mean 3,94 (trung vị 2,42) / Q3
    mean 45,72 (trung vị 49,61) / Q4 mean 7,66 (trung vị 5,43) —
    tải NHẢY giữa hai chế độ ~45 và ~5 theo từng quý (chu kỳ
    ~200 s), y hệt s79 gốc (45,64 / 5,54 / 48,63 / 8,52) và s79r2
    (13,57 / 42,52 / 5,14 / 49,81). Mean 24,80 rơi vào vùng thưa
    mẫu (chỉ 4,4% mẫu ở [20,25)).
  - **s79r4:** probe loadSamples (n=183): mean 27,35, phân bố
    <5: 25,7% / [5,12): 14,8% / [12,20): 9,8% / [20,25): 3,8% /
    [25,40): 9,8% / ≥40: 36,1%. Theo quý tải: Q1 mean 40,07
    (trung vị 47,12) / Q2 mean 8,41 (trung vị 3,19) / Q3 mean
    52,55 (trung vị 53,66) / Q4 mean 9,55 (trung vị 7,13) — cùng
    mẫu hai chế độ, Q3 là quý tải cao nhất trong mọi lượt dài
    (52,55).
- **Quý tải cao → %±1 tốt hơn: BỊ PHÁ VỠ (0/2 đợt này, xem
  §2(d)):** s79r4: Q3 tải 52,55 → %±1 53,1% (tệ nhất); Q1 tải
  40,07 → 59,4% (tốt nhất); Q2 tải 8,41 → 57,7%; Q4 tải 9,55 →
  57,4%. s79r3: Q2 tải 3,94 → %±1 83,2% (tốt nhất); Q1 tải 42,23
  → 80,6%; Q3 tải 45,72 → 78,8%; Q4 tải 7,66 → 78,0% (tệ nhất).
  Gộp 5 lượt dài gần nhất (s79, s79r1, s79r2, s79r3, s79r4): 3
  lượt đầu ủng hộ pattern, 2 lượt đợt này không (s79r4 ngược
  hẳn). **Giả thuyết throttle (load1 thấp = đang bị bóp = main
  thread đói → offset tệ) YẾU ĐI ĐÁNG KỂ:** nó dự báo Q3 của
  s79r4 (tải cao nhất, hog chưa bị throttle) phải tốt nhất,
  nhưng thực tế tệ nhất. Diễn giải này vẫn chỉ là suy luận từ số
  đo (không đo trực tiếp cgroup cpu.stat hay scheduler) — nay có
  bằng chứng ngược, không dùng để phân loại lượt (phân loại vẫn
  theo offset §0 và sampled mean load1 như prereg).
- **Dial ĐẠT không khóa được tải trong lúc phát (tái hiện lần
  4 + 5):** s79r3 dial ĐẠT 32,46 → sampled mean 24,80; s79r4 dial
  ĐẠT 31,36 → sampled mean 27,35. Dải dial [25,40] đo tải TỔNG
  (hog T3 + sibling) lúc bắt đầu, còn sampled mean trong lúc
  phát mới là tải probe thực sự chịu. Lần này dial ĐẠT gần với
  sampled mean hơn s79r1 (38,35 → 13,22), nhưng vẫn chênh 7,7 /
  4,0 điểm. Cơ chế GIỮ tải trong lúc phát vẫn là NỢ MỞ — chỉ ghi
  nhận, không giải quyết đợt này (xem §10 mục 8).
- **loadAtPlay là số gây hiểu lầm (nhắc lại R3 §11.3, S3 §5,
  T3-117 §5, T3-118 §5):** s79r3 loadAtPlay = 45,81; s79r4
  loadAtPlay = 53,33 (mẫu đơn lúc bắt đầu phát) — không dùng; chỉ
  sampled mean trong lúc phát đáng tin (s79r3: 24,80; s79r4:
  27,35).
- **tickRate s79r4 thấp bất thường (1,50/s):** thấp nhất trong
  9 lượt dài nice-hog hợp lệ (trước đó thấp nhất 1,91/s s79r2).
  Nửa đầu 1,53/s, nửa sau 1,46/s — phẳng và thấp cả lượt, không
  phải suy dần. Chưa rõ nguyên nhân (boot mới sau reboot? H3f
  đổi hành vi tick? tải sibling sau reboot?). Ghi rõ để luồng sau
  đối chiếu — không suy diễn nhân quả từ 1 lượt. Lưu ý: H3f bỏ
  lần đọc video trong tick nóng thì LẼ RA tick phải nhanh hơn
  (ít việc hơn), không phải chậm hơn — nên tickRate thấp của s79r4
  khó đổ cho H3f; confound boot-mới-sau-reboot có khả năng hơn.

## §6. Metric thay thế + dụng cụ (mô tả, không phân loại)

- **offset100 (CHỈ MÔ TẢ, như prereg):** s79r3 n=1551, trung vị
  +2, mean +0,61, 23,9% trong ±1, 11,3% ≤ −5 (dải −38..+32);
  s79r4 n=1055, trung vị +2, mean +1,33, 20,4% trong ±1, 13,6%
  ≤ −5 (dải −39..+29); dry-t3-119 n=85, trung vị 0, 95,3%
  trong ±1, 0% ≤ −5. offset100 của cả hai lượt dài đều tệ (nền
  nhiễu ±3 trên control yên + suy thoái theo đói tick — như
  M7/N5/P5/Q3/R3/S3/T3-117/T3-118). Vẫn không dùng để phân loại.
- **Caps coverage vẫn sụp sau clip c2 (lần thứ 9 + 10 liên tiếp ở
  lượt dài):** s79r3 chỉ có 108 caps, mà 91/108 thuộc clip c2
  (c0: 7, c1: 10, c2: 91); s79r4 105 caps (c0: 6, c1: 8, c2: 91)
  — Y HỆT s79/s80b/s79r1/s79r2. Nhưng dry-t3-119 caps 214 phân
  bố đều c0/c1/c2 (70/73/71). **Kết luận củng cố (R3 §6/§11.6,
  S3 §6, T3-117 §6, T3-118 §6):** sampler chết sau c2 chỉ xảy ra
  ở lượt DÀI (nclips lớn), không xảy ra ở lượt khô ngắn — sampler
  dừng sau ~9 s media vì lý do khác (nghi cap buffer đầy /
  sampler chỉ bám 3 clip đầu), không phải bằng chứng đói
  main-thread. Đừng dùng caps-chết làm bằng chứng đói nữa (xem
  §10 mục 4).
- **threads-R:** dry-t3-119 5,3 / s79r3 61,3 (driver sampler
  60,6) / s79r4 62,6 (driver sampler 59,5) — bám theo số hog đang
  sống + sibling, không bám CPU thật (như M7/N5/P5/Q3/R3/S3/
  T3-117/T3-118). Không đề xuất thay load1, nhưng là chỉ số phụ
  bắt buộc kèm theo khi báo tải (xem §5).
- **Tick rate:** 30,54/s (dry-t3-119) / 2,04/s (s79r3) / 1,50/s
  (s79r4) — PHẲNG theo thời gian (s79r3: nửa đầu 2,20/s → nửa sau
  1,90/s; s79r4: 1,53/s → 1,46/s). Capture rate: 19,3–26,7/s
  theo quý (dry) / 1,65/s (s79r3) / 1,26/s (s79r4) — cùng bậc với
  tickRate, như kỳ vọng (mỗi tick ~1 capture).
- **Playhead ratio:** 0,835 (s79r3) / 0,831 (s79r4) — media clock
  chạy ~83% thời gian thực dưới tải (so với 0,845 của s79 gốc,
  0,867 của s80b, 0,846/0,830 của s79r1/s79r2 — ổn định quanh
  0,83–0,85).
- **Gate v2 (mô tả):** ĐẠT ở s79r3 + s79r4 (analyzer tính gần
  đúng True), KHÔNG ĐẠT ở dry-t3-119 (đúng vì dry không tải).
  Đạt gate v2 không suy ra presented GIỮ (như M7/N5/P5/Q3/R3/S3/
  T3-117/T3-118).
- **Element chết format error: 0/163 mẫu (s79r3) + 0/164 mẫu
  (s79r4)** — lần thứ 9 + 10 liên tiếp không có (s77 0/130,
  s77c 0/121, s78b 0/163, s79 0/163, s80b 0/157, s79r1 0/162,
  s79r2 0/165, s79r3 0/163, s79r4 0/164; chỉ s76 có 97/97).
  Pattern "pool giữ element lỗi" của s76 là sự cố đơn lẻ của lượt
  đó. Hạ mức ưu tiên (xem §10 mục 7).
- **Dụng cụ trích kết quả (tái dùng đợt 118):** trích cuối chia 5
  chunk + snapshot từng phần mỗi 60 s + stuck watcher 5 s.
  Probe119t3 = copy byte của probe118t3, chỉ đổi SCRATCH/CFG_DIR
  (diff chỉ 3 dòng đổi tên + 1 dòng header, node --check PASS).
  **Kết quả:** 3/3 lượt chạy đủ trích đủ dữ liệu (dry-t3-119,
  s79r3, s79r4 chạy lại), **0 chunk lỗi** (extraction.errors = []
  cả 3 lượt):

| lượt | A-blend | B-caps | D-state | E-scalars | C-px (lớn nhất) |
|---|---|---|---|---|---|
| dry-t3-119 | 278 ms | 183 ms | 112 ms | 3 ms | OK (5 lát) |
| s79r3 | 3781 ms | 623 ms | 149708 ms | 390 ms | OK (3 lát) |
| s79r4 | 5561 ms | 1121 ms | 144577 ms | 520 ms | OK (3 lát) |

  (Chunk D-state (state100) trích chậm ở lượt dài — 149,7 s
  (s79r3) / 144,6 s (s79r4) — nhưng vẫn OK; tổng thời gian trích
  ~2,5–3 phút kể từ khi phát xong, như đợt 117/118. Ghi rõ để đợt
  sau biết trích D-state là chunk chậm nhất. **Lưu ý:** chính
  D-state chậm là lý do s79r4 attempt 1 bị reboot giết giữa lúc
  trích (trích xong A/B lúc 00:52:12Z, reboot 00:53:41Z trong lúc
  trích D-state) — cửa sổ trích dài ~2,5 phút làm tăng nguy cơ
  bị reboot cắt.)
- **Không đổi logic đo:** metric chính vẫn blendTick rVFC;
  sampler/caps/state100 giữ nguyên; diff probe119t3 vs probe118t3
  chỉ gồm các dòng đổi tên (đã soát).
- **Analyzer:** copy analyze118t3.py → analyze119t3.py (đổi tag
  dry-t3-119/s79r3/s79r4; BAR_A_TAGS = {s79r3, s79r4}; giữ nguyên
  công thức offset100 đã sửa + tickRate + skipStale mô tả + bảng
  theo quý D1 + capture rate — chỉ thêm báo cáo, không đổi công
  thức phân loại cũ). **Không có nuance median lần này:** trường
  `loadSampleSummary.median_load1` trong results json khớp median
  chuẩn tính lại cả hai lượt (s79r3: 17,51 = 17,51; s79r4: 19,89 =
  19,89) — khác đợt 118 (median-high 26,37 vs 26,22).
- **Driver:** driver119t3.sh (dựa trên driver118t3.sh; đổi tag
  dry-t3-119/s79r3/s79r4, hog tối đa 56, dial [25,40], lock v2
  BẢN COPY trong thư mục làm việc + VITE_LOCK_AGING_S=600, CHỜ cờ
  round119-t1-applied tối đa 3600 s + BASE_MD5 động (cây H3f, kỳ
  vọng 5be5a250), cờ DIALING mở rộng phủ cả chờ lock + phát, hạn
  bắt đầu lượt dài mới 01:45Z (so epoch), cờ hogs-off round119-t3,
  `boundary_stall_seen` kiểm ĐÚNG tag lượt đó, lần thử kẹt #11/
  #12). **2 lỗi do T3 tự phát hiện + sửa trước/sau khi chạy:**
  (1) lúc viết driver bằng chuỗi replace, khối MAIN + hàm
  wait_tree_stable đã được thay đúng (đã rút kinh nghiệm lỗi
  replace câm đợt 118 — script adapt có assert, `bash -n` +
  grep toàn bộ tag/cờ trước khi chạy); (2) lỗi time_left %H%M
  qua nửa đêm UTC (xem §0) — phát hiện khi kiểm log, đã sửa
  thành so epoch + phân biệt rc + chỉ kết luận stall khi có
  results.json, chạy lại driver 00:57Z. Không ảnh hưởng lượt đo
  đã chạy đủ (dry/s79r3/s79r4 chạy lại đều chạy trên driver đã
  sửa, trừ dry + s79r3 chạy trên driver trước khi sửa — nhưng
  lỗi time_left chỉ ảnh hưởng việc BẮT ĐẦU lượt mới sau 01:45Z
  giả, không ảnh hưởng logic đo trong lượt; dry + s79r3 bắt đầu
  00:05Z/00:06Z, trước hạn thật nên không bị ảnh hưởng).

## §7. Luật dial ĐỨNG — ĐẠT 3/3 lượt dial đợt này (lũy kế 10/10)

- **Luật đã đăng ký trước (prereg-t3 §2, giữ nguyên S3/T3-117/
  T3-118):** cửa sổ dial tối đa 600 s; hog phải chạy ≥90 s trước
  khi được tuyên bố ĐẠT; ĐẠT chỉ khi đủ cả hai: (a) thời gian hog
  đã chạy ≥ 90 s, VÀ (b) 2 mẫu load1 liên tiếp (cách nhau 10 s)
  đều trong dải mục tiêu [25,40]. Ramp: bắt đầu 16 hog, ±8 mỗi
  10 s, trần 56, sàn 8.
- **s79r3 (dial [25,40]):** load1 ì/sụp đơn điệu 3,99 → 0,55
  trong ~200 s với ramp lên đủ 56 hog (3,99 / 3,89 / 3,30 / 2,79
  / 2,44 / 2,06 / 1,82 / 1,54 / 1,46 / 1,24 / 1,12 / 0,95 / 1,01
  / 0,85 / 0,72 / 0,68 / 0,66 / 0,56 / 0,55) → hồi chậm 0,62 →
  0,97 trong ~80 s → nhảy vọt 5,96 (292 s) → 14,81 → 21,89 →
  28,00 → **32,46 (333 s — mẫu 2/2 → ĐẠT 00:11:38Z,
  hog-runtime 333 s, 56 hog)**. 0 lần từ chối ĐẠT sớm (load1 chưa
  vào dải trước ~290 s).
- **s79r4 attempt 1 (dial [25,40], bị reboot giết lúc trích):**
  load1 ì/sụp đơn điệu xuống **0,46** lúc 300 s với đủ 56 hog →
  nhảy vọt 2,95 (310 s) → 11,33 → 18,59 → 24,80 → 29,75 →
  **33,86 (374 s — mẫu 2/2 → ĐẠT 00:36:49Z, hog-runtime 374 s,
  56 hog)**. 0 lần từ chối ĐẠT sớm. (Attempt này không có
  results.json nên chỉ ghi dial trace làm bằng chứng luật dial,
  không dùng cho bar nào.)
- **s79r4 chạy lại (dial [25,40]):** load1 ì/sụp đơn điệu 6,42
  → **0,41** trong ~280 s với đủ 56 hog → nhảy vọt 1,01 → 0,86 →
  0,72 → 9,38 (324 s) → 20,29 → 26,16 → **31,36 (355 s — mẫu 2/2
  → ĐẠT 01:04:18Z, hog-runtime 355 s, 56 hog)**. 0 lần từ chối
  ĐẠT sớm.
- **Tổng đợt này: 0 lần từ chối ĐẠT sớm + 3/3 ĐẠT.** Lũy kế luật
  đứng: **10/10** (S3 2/2 + T3-117 3/3 + T3-118 2/2 + T3-119 3/3
  lượt dial). Load1 đáp ứng chậm 333–374 s đã tái hiện ở cả 3
  lượt dial đợt này (và là mẫu ì/sụp cực đoan: đáy 0,41–0,68).
  **Giữ luật này làm luật đứng cho lượt tải cao sau.** Với luật
  cũ (cửa sổ 300 s) cả 3 lượt này đều đã KHÔNG ĐẠT (ĐẠT lúc
  333/355/374 s, đều quá 300 s).
- **Hạn chế của luật (ghi rõ, không tự đổi luật):** dial ĐẠT
  không khóa được tải trong lúc phát (s79r3: dial 32,46 →
  sampled mean 24,80; s79r4: dial 31,36 → 27,35). Luật hiện tại
  không có cơ chế giữ tải (vd: dial lại giữa lượt, hoặc hog tối
  thiểu). Đợt sau cần parent quyết có bổ sung cơ chế này không
  (xem §10 mục 8).

## §8. Lock v2 + cờ DIALING (mở rộng) — dùng thật cho lượt dài: 0 TIMEOUT cho T3; stale-lock sau reboot được dọn đúng luật

- **Cấu hình:** **BẢN COPY** `hidden_files/round119-t3/
  vcut-vite-lock-v2.sh` (copy byte từ production, md5 5cac10af
  khớp lúc copy), `VITE_LOCK_AGING_S=600` (mặc định mới S4),
  `VITE_LOCK_POLL_S=5`, mỗi attempt giữ lock đúng lúc chạy probe
  qua `run-attempt <thread> <port> 900 30 long -- <cmd>` (acquire
  → chạy đúng 1 attempt → nhả trong trap). KHÔNG dùng lock v1
  trong luồng này (migration nguyên tử, v2-only).
- **Kết quả (từ hidden_files/vite-lock-v2.log, chỉ thread
  t3-round119):**

| attempt | ticket | acquire | wait | hold | nhả |
|---|---|---|---|---|---|
| dry-t3-119 | normal | 00:05:27Z | 10 s | 37 s | sạch |
| s79r3 | long (0-…) | 00:11:39Z | 1 s | 1111 s | sạch |
| s79r4 attempt 1 | long (0-…) | 00:36:50Z | 1 s | — (chết theo reboot 00:53:41Z, không nhả) | — |
| s79r4 chạy lại | long (0-…) | 01:04:22Z | **3 s** (sau khi dọn stale-lock) | 1148 s | sạch |

  **0 lần TIMEOUT, 0 lần DEFERRED do lock** cho T3 đợt này.
  Port vite: cả 4 attempt đều dùng 5590. **Lock được nhả sau
  MỖI attempt** (không giữ xuyên lượt — đúng yêu cầu đợt 119:
  không giữ lock 1055 s xuyên lượt như s79r1 đợt 118; hold dài
  nhất 1148 s là trong MỘT lượt phát 750 s, không tránh được).
- **Stale-lock sau reboot được dọn đúng luật (ghi cho T1/T9 +
  parent):** ticket chạy lại tạo 01:04:19Z, lock script ghi
  `STALE-LOCK stale: owner pid 54295 chết + không vite trên cổng
  5590 + curl 000 + boot đổi (tuổi 1650s)` rồi ACQUIRED port 5590
  lúc 01:04:22Z sau **3 s chờ**. Đường tắt boot-change của
  stale-recovery v2 hoạt động đúng — không cần chờ hết aging.
- **Cờ DIALING mở rộng (mới đợt 119 — vá kẽ hở đợt 118 §0/§8):
  HOẠT ĐỘNG ĐÚNG cả 2 lượt chạy đủ.** Driver tạo file
  `hidden_files/round119-t3/DIALING` NGAY KHI bắt đầu dial và
  XÓA **chỉ khi hog đã tắt hẳn sau lượt** (sau stop_hogs cuối
  lượt): s79r3 tạo 00:06:05Z → xóa 00:30:10Z (phủ dial 333 s +
  phát 898 s + trích); s79r4 chạy lại tạo 00:58:23Z → xóa
  01:23:31Z (phủ dial 355 s + phát 903 s + trích). Trong cả hai
  lượt, không có xung đột sửa cây nào (T1 không apply gì trong
  lúc T3 giữ hog — cờ round119-t1-applied đã có từ trước). **Kẽ
  hở còn lại (ghi rõ):** cờ DIALING của s79r4 attempt 1 (tạo
  00:30:35Z) còn sót lại sau reboot (hogs đã chết nhưng file còn
  — file không tự hủy theo reboot); T3 đã xóa tay lúc resume
  00:56Z. Đợt sau: luồng nào thấy cờ DIALING sau reboot thì kiểm
  tra hog còn sống không trước khi tin cờ (hoặc ghi boot_id vào
  cờ để nhận biết cờ cũ boot).
  **Caveat nhỏ:** 3 dòng "co DIALING da xoa" ở cuối log driver
  (01:23:31Z/01:23:36Z/01:23:37Z) là cleanup trap của driver gọi
  clear_dialing sau khi run_long_once đã xóa — không phải lỗi
  (cờ đã không còn; `rm -f` im lặng). 2 dòng "co DIALING da xoa"
  lúc 23:59:35Z là trap của lần chạy driver lỗi đầu — không phải
  lỗi. 2 dòng "KHÔNG NHẢ — owner hiện tại là 't1'" ở cuối log
  cũng là cleanup trap gọi release sau khi run-attempt đã nhả —
  không phải lỗi (lock đã trống lúc đó; S3 §8 + T3-117 §8 + T3-118
  §8 ghi cùng hiện tượng).
- **Cooldown:** driver nghỉ 20 s giữa 2 lượt dài (≥15 s, công
  bằng hàng đợi) — lần này chỉ áp dụng giữa s79r3 và s79r4
  attempt 1 (00:30:15Z → 00:30:35Z).

## §9. Kiểm chứng (cây cuối 5be5a250 — cây H3f, khớp kỳ vọng T2)

- `tsc --noEmit` (apps/web): **KHÔNG chạy lại trong luồng này**
  — cây H3f đã được T1 verify: tsc exit 0 lúc 23:57:29Z + vite
  build PASS 7,03 s lúc 23:57:43Z (ghi trong cờ
  round119-t1-applied; T3 đọc lại nội dung cờ khi driver chờ).
  T3 không sửa production; md5 đầy đủ
  `5be5a250a552357c50cc189de9a9c08a` kiểm lại sau đợt, khớp prereg
  bổ sung (cờ T1) + kỳ vọng T2. Chạy tsc lúc 01:2xZ sẽ tốn CPU
  trong lúc các luồng sibling khác còn chạy và không thêm thông
  tin (md5 khớp = cùng cây). Ghi rõ thiếu sót này thay vì giấu —
  parent/T10 có thể chạy lại tsc trên cây gộp đợt 119.
- `vite build`: **KHÔNG chạy trong luồng này** (cùng lý do; T1 đã
  chạy vite build PASS trên cùng cây 5be5a250).
- Không sửa production trong luồng này (T3); preview.tsx md5 đầy
  đủ 5be5a250 trước = sau cả 3 lượt chạy đủ (dry-t3-119, s79r3,
  s79r4 chạy lại); 1 reboot cắt ngang s79r4 attempt 1 (đã chạy
  lại, xem §0).
- Probe copy `probe119t3-frame-parity.mjs`: node --check PASS
  trước lượt đầu; diff với probe118t3 chỉ gồm 3 dòng đổi tên + 1
  dòng header.
- Analyzer `analyze119t3.py`: tính lại toàn bộ từ results json
  thô; bảng §1 khớp output analyzer (đếm lại từ đĩa, không tin mù
  log driver). **Kiểm chứng độc lập:** (i) số tick trong ±1 tính
  lại trực tiếp từ `blendTick` thô (s79r3 1468/1832 = 80,13%,
  vượt vạch 80% ~2 tick; s79r4 768/1350 = 56,89%, thiếu vạch 80%
  312 tick — xem §1/§2); (ii) phân bố tải hai đỉnh + quý tải
  tính lại trực tiếp từ `loadSamples` thô (s79r3: mean 24,80 /
  median 17,51, khớp summary dict; quý tải Q1 42,23 / Q2 3,94 /
  Q3 45,72 / Q4 7,66 — xem §5); (iii) offset hist tính lại từ
  `blendTick` thô (s79r3: −1: 256 / 0: 846 / 1: 366 / 2: 190 /
  3: 107...; s79r4: −1: 104 / 0: 426 / 1: 238 / 2: 235 / 3: 186...
  — xem §1); (iv) dial trace tính lại từ log driver (s79r3 sụp
  3,99 → 0,55 rồi nhảy lên 32,46 @333 s; s79r4 chạy lại sụp tới
  0,41 rồi nhảy lên 31,36 @355 s — xem §7); (v) trong [0,+2] của
  s79r4 tính lại = 66,3% (899/1350 — xem §2).
- Stall: kiểm chứng độc lập từ stall-watch.jsonl thô (§4) — khớp
  kết luận watcher (0 episode cả hai lượt). Lưu ý nguồn của kết
  luận 0/12 (§4) + việc tách file trộn của s79r4 (§4).
- Lock đã nhả sạch sau s79r4 (kiểm tra lock TRỐNG 01:23:36Z —
  driver trap gọi release sau run-attempt đã nhả, báo "KHÔNG NHẢ
  — owner 't1'" là hiện tượng đã biết, xem §8); không vite mồ
  côi của T3 (pgrep "vite" lúc kiểm cuối chỉ trúng shell lệnh
  của chính phiên kiểm tra — đã kiểm bằng ps, không phải tiến
  trình vite); hog-count.txt = 0; cờ hogs-off 01:23:36Z (boot
  622b3a92…).

## §10. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng).** GIỮ vững:
   **19,63** (s77c, cây cũ 03bf029f). Vùng chuyển tiếp GIỮ→TRUNG
   GIAN: **(21,07, 26,98]** trên cây cũ — nay có thêm 2 lượt trên
   cây H3f ở (24,80, 27,35] cho 2 phân loại khác nhau (GIỮ sát
   vạch 80,1% vs TRUNG GIAN sâu 56,9%). Cần parent quyết: (i)
   trục đo — giữ sampled MEAN (quyết đợt 117) hay chuyển sang
   trung vị/phân vị (đổi trục không cứu được liều–đáp ứng: s79r3
   vs s79r4 chênh 23,2 điểm ở tải gần bằng nhau trên MỌI trục —
   mean chênh 2,55, median chênh 2,38, max chênh 3,19 — xem §2);
   (ii) có chấp nhận "vùng chuyển tiếp rộng + nhiễu lớn giữa các
   lượt" thay cho một điểm gãy sắc không — nay có 2 cặp nhiễu
   trực tiếp độc lập (19,1 điểm ở ~12–13 cây cũ; 23,2 điểm ở
   ~25–27 cây H3f); (iii) có cần thêm lượt ở cùng mức tải để tách
   nhiễu không — đợt này cho thấy 2 lượt ở ~25–27 KHÔNG đủ (cho
   2 phân loại đối lập); **đặc biệt cần tách confound "chạy sớm
   sau reboot"**: s79r4 chạy lại chỉ ~5 phút sau reboot cho
   56,9% — đợt sau nên đăng ký 1–2 lượt lặp s79 KHÔNG chạy trong
   30 phút đầu sau reboot (hoặc ghi rõ boot age vào prereg) để
   xem %±1 có hồi về ~79% như s79/s79r2 không.
2. **Chỉ số đói pump (bar (c)): TUYÊN BỐ KHÔNG ÁP DỤNG ĐƯỢC cho chế
   độ nice-hog — DỪNG kiểm chứng (quyết parent đợt 117).** Đợt
   này chỉ ghi mô tả (xem §3). D1 đợt này không ủng hộ (s79r3
   ngược, s79r4 không đơn điệu) — gộp 4 lượt gần nhất: bằng chứng
   HỖN HỢP, thiên về không có quan hệ ổn định. Ghi lại để đợt sau
   tham khảo NẾU parent muốn đăng ký bar MỚI — KHÔNG tự mở lại.
3. **Luật dial đứng (600 s + hog ≥90 s) ĐẠT 10/10 lũy kế — giữ
   nguyên làm luật đứng cho lượt tải cao sau** (xem §7). Không còn
   nợ kiểm chứng luật này. Lưu ý: cả 3 lượt dial đợt này đều ĐẠT
   muộn (333–374 s) — với luật cũ 300 s đã không ĐẠT.
4. **Sampler chết sau clip c2 — cần luồng khác kiểm tra (nhắc lại
   R3 §10 mục 4, S3 §10 mục 4, T3-117 §10 mục 4, T3-118 §10 mục
   4):** s79r3 + s79r4 lần thứ 9 + 10 liên tiếp (c2 chiếm 91/108
   và 91/105). Đừng dùng caps-chết làm bằng chứng đói nữa.
5. **Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN 0/12 lần thử thực
   chạy.** Giữ mức ưu tiên thấp (xem §4). Giả thuyết "vùng clip
   xấu ổn định" càng yếu (6 lượt dài gần nhất chậm ở 6 vùng khác
   nhau).
6. **Freeze ~12 s ở ph 44,77 trong s76 (Phần A R3):** s79r3 không
   có freeze nào ≥10 s (min advance 10 s = 4,70 s; 0 chuỗi mẫu
   đứng yên); s79r4 cũng không (min advance 10 s = 5,53 s; 0
   chuỗi đứng yên). Không có dữ liệu mới cho cơ chế freeze s76.
   (Caveat: s79r3 có 1 gap watcher 10,18 s — chỉ là gap lấy mẫu,
   không phải freeze: cửa sổ 30 s quanh đó vẫn advance ≥16,47 s.)
7. **Element chết format error — pattern KHÔNG lặp lại (10 lượt
   liên tiếp không có):** s76 97/97 mẫu vs s77 0/130, s77c 0/121,
   s78b 0/163, s79 0/163, s80b 0/157, s79r1 0/162, s79r2 0/165,
   s79r3 0/163, s79r4 0/164. "Pool giữ element lỗi" là sự cố đơn
   lẻ của lượt s76. Hạ mức ưu tiên; không kết luận thêm.
8. **Dial ĐẠT không khóa được tải trong lúc phát (mới, từ s80b
   §5, tái hiện lần 4 + 5 ở đợt này §5):** dial [25,40] ĐẠT 32,46
   → mean 24,80 (s79r3); ĐẠT 31,36 → mean 27,35 (s79r4). Đợt sau
   cần parent quyết: có bổ sung cơ chế giữ tải không (vd: dial
   lại giữa lượt, hog tối thiểu theo lượt, hoặc phát ngay sau dial
   không chờ vite lâu)? T3 KHÔNG tự đổi luật. Liên quan: **kẽ hở
   phối hợp sau reboot (§0/§8):** cờ DIALING sót lại sau reboot
   dù hog đã chết — đề xuất ghi boot_id vào cờ DIALING (hoặc
   luồng nào thấy cờ sau reboot thì kiểm tra hog còn sống không
   trước khi tin cờ).
9. **load1 không đo được tải thật khi hog vượt CPU quota (nhắc lại
   Q3 §5, tái hiện ở s79 §5 + s80b §5 + s79r2 §5 + s79r3/s79r4 §5
   + cả 3 lượt dial đợt này):** load1 sụp về 0,41–0,68 trong khi
   56 hog sống + threadsR ~60; dao động hai chế độ (s79r3: quý
   ~45 ↔ ~5; s79r4: quý ~52 ↔ ~9). Đợt sau báo tải kèm threadsR
   + tick rate + skip-stale + PHÂN BỐ tải (mean/median/phân vị/
   quý), đừng tin "dial ĐẠT" hay "load1 sụt" theo nghĩa đen trong
   cell này.
10. **Trong lượt, quý tải cao cho offset tốt hơn (mới, 3/3 lượt dài
    đợt 117–118) — BỊ PHÁ VỠ đợt này (0/2):** s79r4 quý tải cao
    nhất (52,55) có %±1 tệ nhất (53,1%); s79r3 quý tải thấp nhất
    (3,94) có %±1 tốt nhất (83,2%). Giả thuyết throttle (load1
    thấp = đang bị bóp = main thread đói) YẾU ĐI ĐÁNG KỂ (xem §5).
    Cần luồng sau kiểm chứng bằng đo trực tiếp (cgroup cpu.stat /
    scheduler) nếu parent muốn — T3 chỉ ghi pattern + bằng chứng
    ngược, không tuyên bố nhân quả.
11. **Reboot 00:53:41Z (boot mới 622b3a92…, gap thô từ boot trước
    1h20'07") — số thứ tự boot TẠM THỜI, T7 owns (mù #37 mở):**
    reboot giết s79r4 attempt 1 lúc đang trích D-state (cửa sổ
    trích dài ~2,5 phút làm tăng nguy cơ bị cắt — xem §6). Đợt sau
    cân nhắc trích nhanh hơn hoặc checkpoint results.json sớm hơn
    (probe đã có snapshot từng phần 60 s — nhưng results.json chỉ
    ghi cuối; partial.json đã có từ trước reboot nhưng analyzer
    không dùng partial để phân loại).
12. **Lỗi driver time_left %H%M qua nửa đêm UTC (mới, T3 tự phát
    hiện + sửa giữa đợt — xem §0):** hạn giờ trong driver phải
    dùng epoch tuyệt đối khi hạn qua nửa đêm UTC. Đã sửa trong
    driver119t3.sh (so epoch + rc=2 + chỉ kết luận stall khi có
    results.json). Đợt sau: kiểm tra lại mọi driver còn dùng
    `%H%M` so hạn qua nửa đêm.
13. **tickRate s79r4 thấp bất thường 1,50/s (mới — xem §5):**
    thấp nhất trong 9 lượt dài nice-hog hợp lệ; phẳng cả lượt
    (1,53 → 1,46/s). Chưa rõ nguyên nhân (boot mới sau reboot?
    H3f? tải sibling?). Cần thêm lượt trên cây H3f ở boot già
    để tách — không suy diễn từ 1 lượt.
14. **H3f — hiệu quả thật thuộc về phép đo A/B của T1, không
    suy từ dữ liệu T3:** trên cây H3f, 2 lượt lặp s79 cho 80,1%
    và 56,9% (phân tán 23,2 điểm) — phân tán lớn hơn cặp
    s79/s79r2 trên cây cũ ở cùng tải (0,7 điểm), nhưng confound
    boot-mới-sau-reboot của s79r4 chưa tách được. Đừng dùng số
    T3 để kết luận H3f tốt/xấu.
