# PHASE9_ROUND116_S3_LOADBREAK_LIMITS.md — Điểm gãy tải: s78b (250 clip, 56 hog) SẠCH, GIỮ ở tải 21,07 — biên GIỮ dời 19,63 → 21,07 (nhưng sát ngưỡng + tải hai đỉnh); luật dial mới ĐẠT 2/2; bar (c) vùng xám lần 4; kẹt 0/6; reboot #49 cắt attempt 1, đợt 116, luồng S3

**Ngày:** 14/11/2026. **Luồng:** S3 (Phase 9 đợt 116). **Chủ đề:** Điểm gãy
tải — đẩy CAO HƠN 19,63 tìm điểm gãy thật (nợ #3 đợt 115; tiếp nối R3
s77c GIỮ ở 19,63).
**Bối cảnh:** docs/PHASE9_ROUND115_R3_LOADBREAK_LIMITS.md (toàn bộ —
s77c: 2231 tick, trung vị 0, 88,7% ±1, GIỮ ở load1 mean 19,63; Phần A
xác nhận đính chính Q9; attempt 1 LAI vì R2 đổi cây; attempt 2 chết
vì reboot #48; dial KHÔNG ĐẠT, load1 sụp 12,7→0,33 lúc dial; bar (c)
vùng xám lần 3) + hidden_files/round115-r3/prereg-r3.md +
hidden_files/round116-s3/prereg-s3.md (viết TRƯỚC mọi lượt đo mới —
gồm §10 bổ sung S2 sửa cây + sửa bug check_tree, §11 bổ sung reboot
#49 + chạy lại attempt 2) + docs/PHASE9_ROUND115_LIMITS.md §10 mục 3
+ build-loop-log.md (QUYẾT PARENT 15/11: chuẩn tải điểm gãy = hog
nice -n 19; VITE_LOCK_AGING_S=600 cho đợt 116 v2-only).
**Build lúc viết prereg:** preview.tsx md5
`03bf029f09b8890b285eacc10a02172b` (khớp N1/N5/P5/Q3/R3 — không đổi).
**Boot lúc viết prereg:** uptime -s **2026-11-14 19:43:46Z**, boot_id
`0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0` — **boot #48 (SỐ THỨ TỰ TẠM
THỜI)**. RAM khả dụng lúc viết prereg ~631 MB; sau reboot #49 hồi lên
~1875–2018 MB. Headroom inotify sau reboot #49: chưa đo lại trong
luồng này (vite tạm `watch.ignored` vẫn bắt buộc; probe R9 đợt 115
dừng ở ~1092 watch sau reboot #47).
F3 tap+relabel TẮT trong mọi lượt. Chỉ chạy chromium (đường rVFC).
Không probe WebKit → không chạy vcut-webkit-postboot-check.sh. Không
sửa production (S3 không sửa; S2 sửa rồi revert — xem §0). Không push
GitHub, không release/tag, không TTS 39, không birefnet. Repo local
không có `.git` (bản làm việc; HEAD kiểm qua public API bởi parent).

**Kết quả lớn nhất đợt này:**
- **(a) s78b (250 clip, 56 hog nice -n 19) SẠCH, HỢP LỆ — GIỮ ở tải
  21,07: 1957 blendTick, trung vị 0, 80,9% trong ±1, 0,1% ≤ −2 →
  biên GIỮ dời 19,63 → 21,07 (chế độ hog nice -n 19). NHƯNG: GIỮ
  SÁT NGƯỠNG (80,9% so với ngưỡng 80% — chỉ hơn ~17 tick) và tải
  HAI ĐỈNH (trung vị load1 chỉ 11,73 trong khi mean 21,07; 51% mẫu
  <12, 27% mẫu >40) — xem §2, caveat §5. Điểm gãy VẪN MỞ (0 lượt
  GÃY).**
- **(b) Luật dial MỚI ĐẠT 2/2 lượt** (attempt 1: 34,38; attempt 2:
  39,90 — cả hai đều cần hog-runtime ≥90 s + cửa sổ 600 s; luật cũ
  300 s/120 s đã thua cả hai). Đây là bằng chứng luật mới hoạt động
  đúng, không phải may mắn một lần (xem §7).
- **(c) Bar (c) — chỉ số đói pump: VÙNG XÁM lần thứ 4 liên tiếp**
  (tickRate 2,19/s, skipStale 31,52%) — KHÔNG kết luận. 4 lượt tải
  dài bằng hog nice đều xám (xem §3).
- **(d) Bar (b) — playhead kẹt ở biên clip: KHÔNG TÁI HIỆN, 0/6 lần
  thử thực chạy.** s78b: 0 episode stall; cửa sổ 30 s min advance
  16,87 s; cửa sổ 10 s (P8) min advance 6,73 s, 0 cửa sổ <1,33 s;
  0 chuỗi mẫu đứng yên (xem §4).
- **(e) Attempt 1 (s78) bị reboot #49 cắt ở ph 270,5/750 (36%) → loại
  hoàn toàn theo luật prereg.** Attempt 2 (s78b) chạy lại từ đầu trên
  boot #49, sạch md5, hợp lệ (xem §0, §11 prereg).
- **(f) Lock v2 dùng thật lần đầu cho lượt dài: 0 lần DEFERRED.**
  run-attempt prio long giữ lock 1132 s, nhả sạch; lock stale sau
  reboot được dọn qua đường tắt boot-đổi, không chờ đủ STALE_MIN
  (xem §8).
- **(g) S2 H2 (zombie capture throttle) verdict BỎ, fix đã revert —
  cây đo của S3 vẫn là cây prereg 03bf029f**, so sánh biên với s77c
  trực tiếp được (xem §0).

---

## §0. Bối cảnh chạy (S2 sửa cây giữa lúc chờ; bug check_tree; reboot #49 cắt attempt 1)

- **S2 sửa production giữa lúc S3 chờ cây:** cờ `round116-tree` lúc
  driver khởi động (21:10:33Z): `S2 H2 EDITING — zombie capture
  throttle 250ms/clip (pump + tick paths)`, bắt đầu 21:08:48Z,
  `status: EDITING (not final; other measure threads: do NOT run
  tsc/build/probe on this tree until FINAL/NO-CHANGE)`. md5 dao động
  03bf029f ↔ 9b724e69 trong lúc S2 làm việc (21:14–21:30Z). Driver
  chờ đúng luật prereg §2 (poll 60 s, tối đa 900 s) → dry attempt 1
  DEFERRED 21:25:34Z sau 900 s.
- **Bug driver do S3 tự phát hiện + sửa TRƯỚC mọi lượt đo:**
  `check_tree` đọc `head -1` của cờ cây, nhưng cờ S2 đặt `status:`
  ở dòng 3, dòng 1 chỉ là tóm tắt ("S2 H2 DONE — verdict BO...")
  nên driver chờ hết 900 s vô ích dù cây đã NO-CHANGE từ 21:31:05Z.
  Sửa: đọc dòng `status:` (fallback dòng 1). Driver cũ kill bằng
  SIGKILL nhóm tiến trình (TERM bị trap cleanup chặn lại rồi chạy
  tiếp vòng chờ — ghi rõ để luồng sau không kill TERM rồi tưởng đã
  chết). Lúc kill: không hog nào chạy, không lock nào giữ
  (hog-count=0, lock v2 TRỐNG); cờ hogs-off do trap TERM ghi đã xóa
  (stale). Chi tiết + prereg §10 bổ sung 21:33Z.
- **S2 H2 DONE 21:31:05Z — verdict BỎ, fix REVERTED, md5-final
  03bf029f, status NO-CHANGE** (patch giữ tại
  `hidden_files/round116-s2/s2-throttle-250ms.patch`; LIMITS S2:
  docs/PHASE9_ROUND116_S2_ZOMBIEH2_LIMITS.md). Cây về đúng md5 lúc
  viết prereg → s78b đo cùng cây với s77c, so sánh biên trực tiếp
  được. Relaunch driver (pid 55264) 21:32:56Z; check_tree PASS ngay.
- **Reboot #49 = 2026-11-14 21:46:46Z** (boot_id
  `9c6b5543-8edd-4362-a093-ca6020892737`). Gap #48 (19:43:46Z) → #49
  (21:46:46Z) = **2h03'00"** — trong dải chứng nhận [19'07",
  3h14'08"], KHÔNG phá sàn. Số thứ tự #49 vẫn tạm thời (mù #33 đã
  mở, nay chứa cả #46/#47/#48/#49). Caveat đồng hồ như #47/#48: mốc
  uptime -s sớm hơn đồng hồ tường ~30–40 s (mẫu stall-watch cuối
  attempt 1 21:47:10.886Z + dòng playhead cuối 21:47:12.872Z đều sau
  mốc uptime -s; reboot thực trong khoảng 21:47:13–21:47:36Z).
- **Attempt 1 (s78) bị cắt:** dial ĐẠT 21:40:51Z (load1 34,38) → phát
  → playhead tới **270,5/750 s (36%)** lúc 21:47:10.886Z thì reboot
  cắt. Theo prereg §0, **loại hoàn toàn** (không phân loại, không
  tính bar nào, không tính vào tỉ lệ tái hiện kẹt). Dữ liệu thô giữ
  lại làm vết audit trong `hidden_files/round116-s3/chr-code-blur-s78/`
  (chỉ frame-parity-partial.json + stall-watch.jsonl 62 mẫu — KHÔNG
  có results json). Load1 2 mẫu cuối sụp về 2,13–2,31 là do máy đang
  tắt dần / hog chết theo reboot, không phải số đo tải.
- **Dọn dẹp sau reboot:** driver chết theo máy; lock v2 còn dir stale
  (owner pid 58855 chết, boot đổi, tuổi 431 s) — lần acquire sau dọn
  qua đường tắt boot-đổi; hog-count.txt stale 56 đã reset về 0 (kiểm
  sạch bằng bracket-trick: 0 hog `node -e` còn sống — số "2" trước
  đó là tự match của lệnh kiểm tra, như bài học R3); RAM hồi lên
  1875 MB.
- **Attempt 2 (s78b) chạy lại từ đầu trên boot #49** (prereg §11 bổ
  sung 21:48Z, TRƯỚC mọi lượt đo attempt 2): tag mới dry-s3b/s78b để
  không ghi đè dữ liệu attempt 1; mọi định nghĩa không đổi.
- **Tải nền sibling:** S1/S2/S4/S5/S7/S8 đợt 116 chạy song song
  (LIMITS của họ đã có trong docs/ lúc viết file này). Tải sibling có
  trong sampled mean (đó là tải probe thực sự chịu; ghi rõ, không
  tách). Hog S3: `nice -n 19`, 56 hog lúc phát s78b.
- **Lock: 0 lần DEFERRED cho S3 đợt này** (cả attempt 1 lẫn attempt
  2 — xem §8). Dry-s3b acquire ngay; s78b acquire ngay sau dial.
- **RAM:** freeMB tối thiểu trong lúc s78b phát: **315 MB** (watcher)
  — thấp nhất trong các lượt dài nice-hog (s77: 461 MB; s77c: 280 MB)
  nhưng không OOM. RAM lúc khởi động driver attempt 2: 2025 MB.
- **ENOSPC — 0 lần:** vite tạm `server.watch.ignored: ["**/**"]` +
  CFG_DIR riêng /tmp/round116-s3; vite lên ngay cả 2 attempt.

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0, offset nhãn − kỳ vọng)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-dry-s3 | stripes-code-blur | chạy khô, không hog | — | **1,39** (n=4) | 3,2 | **383** | 33,38 | 251 | **0** (−1..+1) | 100% | **GIỮ** (chỉ validate dụng cụ, không tính bar) |
| chr-code-blur-s78 (att.1) | stripes-code-blur | [25, 40] | ĐẠT 34,38 (56 hog nice -n 19) | — (bị cắt) | — | — (partial) | — | — (partial) | — | — | **LOẠI HOÀN TOÀN (reboot #49 cắt ở ph 270,5/750)** |
| chr-code-blur-dry-s3b | stripes-code-blur | chạy khô, không hog | — | **1,91** (n=4) | 3,5 | **449** | 47,23 | 266 | **0** (−1..+1) | 100% | **GIỮ** (validate dụng cụ) |
| chr-code-blur-s78b (att.2) | stripes-code-blur | [25, 40] | **ĐẠT 39,90** (56 hog nice -n 19) | **21,07** (n=180) | 62,9 | **1957** | 2,19 | 113 | **0** (−4..+43) | **80,9%** | **GIỮ (HỢP LỆ: ≥50 tick, md5 sạch)** |

- **dry-s3 (nclips=3, 9 s media, boot #48):** 383 tick, GIỮ — validate
  probe116s3 trên cây 03bf029f trước khi S2 revert xong? Không — dry-s3
  chạy 21:36:14–21:36:46Z, SAU khi S2 DONE 21:31:05Z (cây đã về
  03bf029f, NO-CHANGE). md5 03bf029f trước = sau. Chỉ validate dụng cụ.
- **s78 attempt 1 (nclips=250, boot #48):** dial ĐẠT 34,38 lúc
  21:40:51Z (56 hog, hog-runtime ~230 s); acquire lock v2 prio long
  ngay; app boot OK; phát 21:40:51Z → bị reboot #49 cắt ở ph 270,5/750
  (36%). Partial + stall-watch 62 mẫu giữ làm audit, KHÔNG phân tích
  phân loại.
- **dry-s3b (nclips=3, boot #49):** 449 tick, GIỮ — validate probe116s3
  trên boot mới (vite :5590 lên tức thì; lock stale sau reboot đã dọn).
  md5 03bf029f trước = sau.
- **s78b (nclips=250, 750 s media, boot #49):** dial ĐẠT 39,90 lúc
  21:51:43Z (56 hog, hog-runtime 103 s, 2 mẫu liên tiếp trong [25,40]
  — xem §7); acquire lock ngay (lock trống sau khi dọn stale); app boot
  OK; phát 21:51:43Z → ~22:07:15Z (tường phát 894,7 s, playhead
  745,4/750 s — chưa tới 750 s tuyệt đối vì mẫu watcher cuối ở 892,6 s
  tường; probe kết thúc khi playhead tới cuối media); trích xong
  ~22:10:32Z; probe exit=0; driver done 22:10:42Z. **1957 tick — gấp
  39 lần ngưỡng 50.** Phân loại GIỮ theo offset, **HỢP LỆ** (md5
  03bf029f → 03bf029f, mtimeChangedMidRun=False, không reboot cắt ngang).
- **Hai sampler khớp nhau về tải trong lúc phát (ở mức mean):** probe
  loadSamples mean load1 **21,07** (n=180, median 11,73, min 0,64,
  max 58,17); driver sampler 5 s mean load1 **24,16** (n=241, max
  59,85). Chênh nhau do cửa sổ khác nhau (driver sampler bao gồm cả
  giai đoạn dial trước khi phát, nên cao hơn) + dao động tải lớn
  (xem §5). Mức tải trong lúc phát được đo chắc chắn ở ~21–24 (mean)
  với threadsR mean 62,9.

## §2. Bar (a) — điểm gãy: VẪN MỞ, biên GIỮ dời lên 21,07 (chế độ nice-hog) — NHƯNG sát ngưỡng + tải hai đỉnh

- **Điểm gãy: VẪN MỞ** (không có lượt GÃY nào). Nhưng lần đầu tiên có
  lượt tải HỢP LỆ trên 19,63: **s78b GIỮ ở sampled mean load1 21,07**
  → biên GIỮ dời từ **19,63 → 21,07** (trong chế độ hog nice -n 19).
  Analyzer: "Bar (a): chi co GIU (cao nhat load1mean=21.07), KHONG
  co GAY -> diem gay VAN MO, giu toi 21.07".
- **CAVEAT 1 — GIỮ SÁT NGƯỠNG (quan trọng nhất, ghi rõ để không ai đọc
  quá):** 80,9% trong ±1 so với ngưỡng GIỮ 80% — chỉ hơn **~17 tick**
  (80% của 1957 = 1565,6; thực tế trong ±1 = 1583). So với s77c
  (88,7%) thì biên độ an toàn đã mỏng đi rất nhiều. Theo quý: Q1
  80,0% (419 tick) / Q2 84,4% (571) / Q3 79,4% (500) / Q4 79,0%
  (467) — Q3 và Q4 riêng lẻ đã DƯỚI 80% (nhưng phân loại theo luật
  prereg là cả lượt, không phải từng quý). Trung vị offset vẫn 0 ở
  cả 4 quý; mean offset +0,66, dải −4..+43 (đuôi dương dài — presented
  đi trước expected, như s77c mean +0,70). **Kết luận:** GIỮ theo
  đúng luật đã đăng ký, nhưng đây là GIỮ yếu — lượt tải cao hơn nữa
  có thể lật sang TRUNG GIAN/GÃY chỉ với dao động nhỏ. Đợt sau không
  được đọc "21,07" như một biên vững như "19,63" của s77c.
- **CAVEAT 2 — TẢI HAI ĐỈNH (bimodal), mean không đại diện cho "mức
  tải" mà probe chịu:** probe loadSamples (n=180): mean 21,07 nhưng
  **trung vị chỉ 11,73** (analyzer summary in `loadSampleSummary`
  ghi 11,85; tính lại trực tiếp từ results json thô cho 11,73 —
  chênh 0,12 do cách tính trung vị khác nhau, ghi rõ cả hai số).
  Phân bố: [0,5): 33,9% (61 mẫu) / [5,12): 17,2% (31) / [12,20):
  8,9% (16) / [20,25): 3,9% (7) / [25,40): 9,4% (17) / [40,99):
  26,7% (48). Tức **~51% thời gian phát ở load1 <12** (vùng GIỮ đã
  biết từ s77c) và **~27% ở load1 >40**, gần như không có mẫu ở giữa
  (chỉ 13% ở [12,25)). Mean 21,07 rơi vào vùng thưa mẫu. Theo quý
  tải: Q1 mean 7,81 (trung vị 6,11) / Q2 mean 33,79 (trung vị 41,88)
  / Q3 mean 20,60 (trung vị 12,99) / Q4 mean 22,06 (trung vị 15,08).
  **Hệ quả:** "giữ tới 21,07" là phát biểu về MEAN theo đúng luật đã
  đăng ký (§0: trục phân loại = sampled mean), nhưng nó KHÔNG có
  nghĩa là probe đã GIỮ ổn định ở mức tải 21 liên tục. Cần parent
  quyết (§10 mục 1): giữ trục mean, hay chuyển sang trung vị/phân vị
  cho các lượt tải dao động mạnh kiểu này. S3 KHÔNG tự đổi trục hậu
  kiểm — phân loại vẫn theo mean như prereg.
- **CAVEAT 3 — KHÔNG có quan hệ liều–đáp ứng trong lượt:** quý tải
  cao nhất Q2 (mean 33,79) lại có tỉ lệ ±1 TỐT NHẤT (84,4%), trong
  khi Q3/Q4 tải thấp hơn lại dưới 80% (79,4%/79,0%). Offset không
  xấu đi theo tải trong lượt này — ngược với kỳ vọng "tải càng cao
  càng gãy". Cùng với caveat 2, điều này gợi ý: ở chế độ nice-hog,
  load1 (kể cả mean) không còn là trục đơn điệu dự báo offset nữa
  (xem §5). Tick rate cũng PHẲNG: nửa đầu 2,21/s → nửa sau 2,16/s
  (990 vs 967 tick) — khác s77c (tăng 2,91 → 3,84/s) và s76 (suy
  giảm 0,146 → 0,085/s).
- **Caveat chế độ tải (§5 R3) VẪN ĐỨNG:** biên 21,07 đo bằng hog nice
  -n 19. Dãy hog không-nice (N5/P5/Q3) vẫn dừng ở biên GIỮ 9,59 —
  chưa có lượt không-nice nào vượt qua 9,59 mà GIỮ. Hai con số này là
  hai biên trên hai chế độ tải khác nhau, KHÔNG phải một khoảng duy
  nhất.
- **Toán tích tick prereg ĐÚNG:** prereg tính ~2800 tick ở rate s77c
  3,37/s; thực tế 1957 tick ở rate 2,19/s (rate thấp hơn dự báo vì
  56 hog throttle mạnh hơn 40 hog — xem §5). Điểm hòa vốn 50 tick
  (0,060/s) không bị chạm tới. 250 clip cho biên an toàn đủ lớn.

## §3. Bar (c) — chỉ số đói pump: VÙNG XÁM lần thứ 4, KHÔNG kết luận

- **Quy tắc đã đăng ký trước (giữ nguyên prereg-q3 §2, đăng ký lại
  trong prereg-s3 §3 — KHÔNG chỉnh ngưỡng sau khi thấy s77/s77c):**
  tickRate = nBlendTick / wall_s; skipStale = số pump
  `decision == "skip-stale-frame"` / tổng số pump entry. Dự báo GIỮ
  iff tickRate ≥ 5/s VÀ skipStale ≤ 20%; dự báo KHÔNG-GIỮ iff
  tickRate < 1/s HOẶC skipStale > 35%; còn lại vùng xám. Bar ĐẠT iff
  lượt hợp lệ (≥50 tick) VÀ dự báo khớp phân loại offset.
- **Kết quả s78b:** tickRate **2,19/s**, skipStale **31,52%**
  (747/2370 pump; các decision còn lại: capture 1602, skip-seeking 3,
  reset-capture 8, skip-stale 8, duplicate 2) → rơi vào **VÙNG XÁM**
  → không dự báo. Phân loại offset: GIỮ (hợp lệ).
- **KHÔNG kết luận bar đạt/không đạt** — đây là lần kiểm chứng thứ
  tư không kết luận được (s76 thiếu tick; s77 vùng xám + lai; s77c
  vùng xám nhưng hợp lệ; s78b vùng xám, hợp lệ). 4 lượt tải dài bằng
  hog nice đều rơi vào vùng xám (tickRate 2,17–3,37/s, skipStale
  ~30–32%).
- **Bằng chứng phụ (không tính bar):** dry-s3b tickRate 47,23/s +
  skipStale 0,38% (1/266) → dự báo GIỮ, khớp phân loại GIỮ của dry
  (100% trong ±1). dry-s3: 33,38/s + 0,74% (2/271) → dự báo GIỮ, khớp
  GIỮ (100% ±1). Nhất quán, nhưng dry là lượt validate dụng cụ,
  không tính vào bar.
- **Bảng tham chiếu cập nhật (thêm s78b):**

| lượt | phân loại | tick rate (/s) | skip-stale-frame | dự báo | khớp? |
|---|---|---|---|---|---|
| s75 (control) | GIỮ | 17,35 | 10,8% | GIỮ | có |
| s73 (N5) | TRUNG-GIAN | 1,6 | 40,3% | KHÔNG-GIỮ | có |
| s77 (P5) | TRUNG-GIAN (k.h.lệ) | 0,17 | 46,2% | KHÔNG-GIỮ | có |
| s78 (P5) | TRUNG-GIAN (k.h.lệ) | 0,26 | 41,0% | KHÔNG-GIỮ | có |
| s76 (Q3) | TRUNG-GIAN (k.h.lệ) | 0,09 | 44,26% | KHÔNG-GIỮ | có (hướng), chưa kết luận |
| s77 (R3 att.1) | GIỮ (LAI, k.h.lệ) | 2,17 | 30,68% | XÁM | không đối chiếu được |
| s77c (R3 att.3) | GIỮ (HỢP LỆ) | 3,37 | 29,73% | XÁM | không đối chiếu được |
| **s78b (S3 att.2)** | **GIỮ (HỢP LỆ)** | **2,19** | **31,52%** | **XÁM** | **không đối chiếu được** |
| dry-s3b (S3) | GIỮ (validate) | 47,23 | 0,38% | GIỮ | có |

  (k.h.lệ = không hợp lệ để đóng khoảng; "khớp" ở các lượt k.h.lệ chỉ
  là so hướng, không phải bar pass.)
- **Đánh giá:** vùng xám hiện tại (tickRate 1–5/s, skipStale 20–35%)
  nuốt trọn chế độ nice-hog — bar (c) như đăng ký KHÔNG phân biệt
  được gì trong chế độ này (xem §10 mục 2).

## §4. Bar (b) — playhead kẹt ở biên clip: KHÔNG TÁI HIỆN (0/6 lần thử thực chạy)

- **Định nghĩa đăng ký trước (giữ nguyên P5/Q3/R3):** stall =
  playhead tiến < 0,05 s trong bất kỳ cửa sổ tường 30 s nào khi
  playing=true; stall ở biên = playhead trong 0,1 s ngay trước một
  bội số của 3,0 s.
- **Kết quả s78b:** **0 episode stall** (163 mẫu watcher, tường 5,9–
  892,6 s, playhead 4,23 → 746,93). **Tỉ lệ tái hiện gộp 0/6 lần thử
  thực chạy** (s77-P5, s78-P5, s76-Q3, s77-R3-attempt1, s77c-R3-
  attempt3, s78b-S3-attempt2; s77b attempt 2 bị reboot cắt + s78
  attempt 1 bị reboot cắt nên KHÔNG tính — S3 KHÔNG tuyên bố "0/7"
  hay "0/8"). stall-events.json KHÔNG có file (watcher không ghi khi
  0 episode); stallBlocks=[] trong results json.
- **Kiểm chứng độc lập từ mẫu thô (tính lại từ stall-watch.jsonl,
  không tin mù watcher — analyzer analyze116s3-s78bstall.py):**
  - Cửa sổ 30 s (mọi cặp, wall-diff [25,30]s): n=156, min advance
    **16,87 s** (720701→746337, ph 604,93 → 621,80). Không stall.
  - Cửa sổ 10 s (P8, mọi cặp [8,10]s): n=4, min advance **6,73 s**;
    **0 cửa sổ advance <1,33 s** — bảng đầy đủ: không có cửa sổ nào
    vi phạm (khác s76: 2 cửa sổ <1,33 s).
  - Cửa sổ 10 s (phương pháp thay thế — mẫu đầu tiên ≥10 s sau mỗi
    mẫu): n=161, min advance **5,40 s** (552020→562526, ph 462,37 →
    467,77). Dải mở rộng [8,12]s: n=152, min advance cũng 5,40 s.
  - Kiểm tra đóng băng trực tiếp: **0 chuỗi mẫu liên tiếp đứng yên**
    ph. Khoảng liên tiếp chậm nhất vẫn tiến **1,70 s trong 5,10 s**
    tường (wall 88108, ph 73,70).
  - `playing=false`: 0/163 mẫu. Gap mẫu watcher min 3722 ms /
    median 5404 ms / max 7208 ms.
- **Vùng chậm nhất của lượt** (ph ~446–468, wall ~531–578 s): advance
  30 s chỉ 17,67–18,33 s; advance 10 s chỉ 5,40 s; khoảng liên tiếp
  chậm nhất thứ 4 (+2,17 s/5,18 s) cũng rơi vào đây — cả ba đều cùng
  vùng ph ~446–468 s (clip c148–c156). Vùng này chậm nhất lượt nhưng
  vẫn tiến đều (không freeze, không stall theo định nghĩa). Ghi lại
  để đợt sau đối chiếu (s77c: vùng chậm nhất ph ~148–157 s, khác
  vùng này — không có vùng clip "xấu" ổn định).
- **Lưu ý về thông điệp driver:** driver116s3b.sh có dòng log "s78
  CHUA co stall o bien clip — lan thu #6: KHONG" nhưng hàm
  `boundary_stall_seen` của nó kiểm tra file stall-events.json của
  tag CŨ `chr-code-blur-s78` (attempt 1, không có file) chứ không
  phải `chr-code-blur-s78b` — thông điệp đó KHÔNG phải bằng chứng.
  Kết luận 0/6 trong file này dựa vào analyzer stall chạy trên
  stall-watch.jsonl của s78b (số liệu ở trên), không dựa vào dòng log
  driver đó. Ghi rõ để parent/R10 không trích sai nguồn.
- **Đánh giá H1–H4:** stall không tái hiện lần thứ 6 liên tiếp. Với
  **0/6 lần thử** ở đúng điều kiện s72 lần 1 (nclips≥20, dial
  [15,30] hoặc [25,40], load đỉnh ~47–60, playhead ratio 0,42–0,89),
  vụ kẹt 3,5 phút của s72 lần 1 càng giống sự kiện hiếm/khó tái hiện.
  **Giữ mức ưu tiên thấp** — không tích mẫu mù thêm bằng lượt dài
  kiểu này nữa (như R3 §4).

## §5. Dị thường — tải hai đỉnh + load1 sụp trong khi hog sống (mới, quan trọng)

- **Hiện tượng:** s78b dùng 56 hog `nice -n 19`: load1 trong lúc phát
  dao động cực mạnh — probe loadSamples min 0,64 / max 58,17; driver
  sampler mean 24,16 / max 59,85. Các mốc đơn lẻ: 56,72 lúc 21:59:24Z
  → **1,02 lúc 22:04:42Z** (56 hog vẫn sống, hog-count=56) → 8,46
  lúc trích xong 22:10:36Z. Phân bố hai đỉnh (§2 caveat 2): 51% mẫu
  <12, 27% mẫu >40.
- **Cơ chế (diễn giải, có bằng chứng):** như R3 §5 (throttle cgroup):
  khi 56 hog vượt quota CPU của cell (~1,5 CPU), task bị throttle
  không còn counted là runnable nên load1 đọc thấp dù hàng đợi vẫn
  đầy (threadsR ~63). Nhưng s78b cho thấy thêm: load1 KHÔNG sụp rồi
  ở yên mức thấp như s77c (0,33 suốt dial) mà DAO ĐỘNG giữa hai trạng
  thái (throttle / không throttle) theo từng đợt — có thể do các
  luồng sibling đợt 116 (S1/S2/…) bật/tắt tải nền làm tổng nhu cầu CPU
  của cell vượt/rớt khỏi quota theo thời gian. Bằng chứng phụ: Q1
  tải thấp (mean 7,81) → Q2 tải cao (mean 33,79) → Q3/Q4 trung bình
  (~21) — tải nền sibling thay đổi theo lượt của họ, không phải do
  hog S3 (hog S3 giữ nguyên 56 suốt lượt).
- **Hệ quả cho bar (a):** "tải" đo bằng load1 mean càng lúc càng kém
  tin cậy làm trục duy nhất — cùng một lượt, mean 21,07 mà trung vị
  11,73 và phân bố hai đỉnh. Xem §2 caveat 2 + §10 mục 1 (cần parent
  quyết trục đo cho lượt tải dao động mạnh).
- **Caveat:** diễn giải throttle + tải sibling là suy luận từ số đo
  (load1 + threadsR + phân bố theo quý), không phải đo trực tiếp
  cgroup cpu.stat hay scheduler. Ghi rõ để luồng sau kiểm chứng nếu
  cần — không dùng diễn giải này để phân loại lượt (phân loại vẫn
  theo offset §0 và sampled mean load1 21,07 như prereg).
- **loadAtPlay là số gây hiểu lầm (nhắc lại R3 §11.3):** s78b
  loadAtPlay = 24,47 (mẫu đơn lúc bắt đầu phát) — không dùng; chỉ
  sampled mean trong lúc phát đáng tin.

## §6. Metric thay thế + dụng cụ (mô tả, không phân loại)

- **offset100 (CHỈ MÔ TẢ, như prereg):** s78b n=1651, trung vị +2,
  mean +2,02, 28,8% trong ±1, 7,0% ≤ −5 (dải −19..+44); dry-s3b n=94,
  trung vị +2, 38,3% trong ±1, 0% ≤ −5; dry-s3 n=112, trung vị 0,
  98,2% trong ±1. offset100 của s78b tệ hơn s77c (38,7% ±1) dù tick
  dày tương đương — vì offset trung bình dương hơn (+0,66 vs +0,70?
  không — s77c mean offset +0,70, tương đương; offset100 tệ hơn chủ
  yếu do đuôi dương dài hơn). Vẫn không dùng để phân loại (nền nhiễu
  ±3 trên control yên + suy thoái theo đói tick — như M7/N5/P5/Q3/R3).
- **Caps coverage vẫn sụp sau clip c2 (lần thứ 4 liên tiếp ở lượt
  dài):** s78b chỉ có 113 caps, mà 90/113 thuộc clip c2 (c0: 12, c1:
  11, c2: 90) — Y HỆT s76/s77/s77c. Nhưng dry-s3b caps 266 phân bố
  đều c0/c1/c2. **Kết luận củng cố (R3 §6/§11.6):** sampler chết sau
  c2 chỉ xảy ra ở lượt DÀI (nclips lớn), không xảy ra ở lượt khô
  ngắn — sampler dừng sau ~9 s media vì lý do khác (nghi cap buffer
  đầy / sampler chỉ bám 3 clip đầu), không phải bằng chứng đói
  main-thread. Đừng dùng caps-chết làm bằng chứng đói nữa (xem §10
  mục 4).
- **threads-R:** dry-s3b 3,5 / s78b 62,9 (driver sampler 61,0) — bám
  theo số hog đang sống + sibling, không bám CPU thật (như
  M7/N5/P5/Q3/R3). Không đề xuất thay load1, nhưng là chỉ số phụ bắt
  buộc kèm theo khi báo tải (xem §5).
- **Tick rate:** 47,23/s (dry-s3b) / 2,19/s (s78b) — PHẲNG theo thời
  gian (nửa đầu 2,21/s → nửa sau 2,16/s), khác s77c (tăng) và s76
  (suy giảm). Dùng để tính cửa sổ cần thiết, không làm metric chính.
- **Playhead ratio:** 0,947 / 0,838 — media clock chạy ~84% thời gian
  thực dưới tải 56 hog (so với 0,894 của s77c 40 hog, 0,839 của s77).
- **Gate v2 (mô tả):** ĐẠT ở s78b, KHÔNG ĐẠT ở dry-s3b/dry-s3 (đúng vì
  dry không tải). Đạt gate v2 không suy ra presented GIỮ (như
  M7/N5/P5/Q3/R3).
- **Element chết format error: 0/163 mẫu** — lần thứ 4 liên tiếp không
  có (s77 0/130, s77c 0/121, s78b 0/163; chỉ s76 có 97/97). Pattern
  "pool giữ element lỗi" của s76 là sự cố đơn lẻ của lượt đó. Hạ mức
  ưu tiên (xem §10 mục 7).
- **Dụng cụ trích kết quả (tái dùng R3 — CỨU lượt dài lần nữa):**
  trích cuối chia 5 chunk + snapshot từng phần mỗi 60 s + stuck
  watcher 5 s. Probe116s3 = copy byte của probe115r3, chỉ đổi
  SCRATCH/CFG_DIR (diff chỉ dòng đổi tên, node --check PASS). **Kết
  quả:** 3/3 lượt chạy trích đủ dữ liệu (dry-s3, dry-s3b, s78b),
  **0 chunk lỗi** (extraction.errors = [] cả 3 lượt); attempt 1 bị
  reboot cắt vẫn để lại partial + stall-watch 62 mẫu (checkpoint
  tăng dần đã hoạt động — dữ liệu thô không mất hoàn toàn):

| lượt | A-blend | B-caps | D-state | E-scalars | C-px (lớn nhất) |
|---|---|---|---|---|---|
| dry-s3 | OK | OK | OK | OK | OK |
| dry-s3b | OK | OK | OK | OK | OK |
| s78b | 3.789 ms | 720 ms | OK | OK | OK (3 lát) |
| s78 att.1 (bị cắt) | — (partial) | — | — | — | — (stall-watch 62 mẫu) |

  (Thời gian trích từng chunk của s78b ngoài A/B không ghi riêng trong
  log driver — chỉ ghi "trích xong ~22:10:32Z"; tổng thời gian trích
  ~3,2 phút kể từ khi phát xong 22:07:15Z. Ghi rõ thiếu sót này thay
  vì bịa số.)
- **Không đổi logic đo:** metric chính vẫn blendTick rVFC; sampler/
  caps/state100 giữ nguyên; diff probe116s3 vs probe115r3 chỉ gồm
  các dòng đổi tên (đã soát).
- **Analyzer:** copy analyze115r3c.py → analyze116s3b.py (đổi tag
  dry-s3b/s78b; giữ nguyên công thức offset100 đã sửa + tickRate +
  skipStale + dự báo bar (c)). **3 lỗi nhỏ do S3 tự phát hiện + sửa
  trước khi báo cáo:** (i) dòng tiêu đề in ra của analyzer b còn sót
  "(prereg-r3.md §10)" + "attempt 1" (đã sửa thành "(prereg-s3.md
  §11)" + "attempt 2", chạy lại — JSON đồng nhất 100%, số liệu không
  đổi); (ii) analyzer stall copy ban đầu bị hỏng docstring do 2 lệnh
  sed chồng nhau (đã sửa bằng python, parse OK trước khi chạy);
  (iii) analyzer stall chỉ tự ghi .json, .txt phải lưu stdout khi
  chạy (đã chạy lại có redirect — số liệu khớp lần chạy đầu).
  Analyzer stall s78b (analyze116s3-s78bstall.py) mới, chỉ đọc dữ
  liệu thô.
- **Driver:** driver116s3b.sh (dựa trên driver116s3.sh; đổi tag
  dry-s3b/s78b; luật dial mới + lock v2 giữ nguyên). Driver116s3.sh
  gốc (attempt driver 2) đã chạy dry-s3 PASS + s78 attempt 1 tới khi
  bị reboot cắt; driver116s3b.sh chạy dry-s3b PASS + s78b exit=0.

## §7. Luật dial MỚI — ĐẠT 2/2 lượt (bằng chứng luật hoạt động đúng)

- **Luật đã đăng ký trước (prereg-s3 §2):** cửa sổ dial tối đa 600 s;
  hog phải chạy ≥90 s trước khi được tuyên bố ĐẠT; ĐẠT chỉ khi đủ cả
  hai: (a) hog-runtime ≥90 s, VÀ (b) 2 mẫu load1 liên tiếp (cách nhau
  10 s) đều trong [25,40]. Ramp: bắt đầu 16 hog, ±8 mỗi 10 s, trần
  56, sàn 8.
- **Attempt 1 (s78, boot #48):** load1 ì ở 1,1–2,4 trong ~190 s đầu,
  rồi nhảy 10,42 → 18,36 → 24,53 → 30,00 → **34,38 lúc acquire
  21:40:51Z** (hog-runtime ~230 s). Với luật cũ (cửa sổ 300 s) lượt
  này đã KHÔNG ĐẠT (load1 chỉ bắt đầu lên sau ~190 s).
- **Attempt 2 (s78b, boot #49):** ramp mượt hơn hẳn (tải nền sau
  reboot khác): 8,57 (20 s, 24 hog) → 12,56 → 17,15 → 23,96 →
  29,12 (62 s, 56 hog — TRONG DẢI NHƯNG hog-runtime 62 s < 90 s →
  TỪ CHỐI tuyên bố ĐẠT, đúng luật) → 33,42 (72 s — từ chối lần 2) →
  37,20 (82 s — từ chối lần 3) → 39,27 (93 s — đủ 90 s, mẫu 1/2) →
  **39,90 (103 s — mẫu 2/2 → ĐẠT 21:51:43Z)**. Luật ≥90 s đã từ
  chối ĐẠT đúng 3 lần trong lượt này (cộng attempt 1: load1 vào dải
  muộn nên không có từ chối nào ghi nhận — tổng 3 lần từ chối trong
  đợt này; R1 đợt 115 có 18 lần).
- **Kết luận:** luật dial mới (600 s + hog ≥90 s) là điều kiện cần để
  dial [25,40] thành công cả 2 lần. Load1 đáp ứng chậm 150–275 s
  (R1) đã tái hiện ở attempt 1 (~190 s ì); attempt 2 nhanh hơn
  (~60 s) vì tải nền sau reboot khác — dao động lớn giữa các lượt,
  không có hằng số đáp ứng cố định. **Giữ luật này làm luật đứng cho
  lượt tải cao sau (đề xuất vào LIMITS gộp đợt 116).**

## §8. Lock v2 — dùng thật lần đầu cho lượt dài: 0 DEFERRED, nhả sạch

- **Cấu hình:** `apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600`, `VITE_LOCK_POLL_S=5`, mỗi attempt giữ lock
  đúng lúc chạy probe qua `run-attempt <thread> <port> 900 30 long
  -- <cmd>` (acquire → chạy đúng 1 attempt → nhả trong trap). KHÔNG
  dùng lock v1 trong luồng này (migration nguyên tử, v2-only).
- **Kết quả:** dry-s3b acquire ngay (lock trống sau khi dọn stale);
  s78b acquire ngay sau dial; **0 lần DEFERRED** trong cả đợt (cả
  attempt 1 lẫn attempt 2). s78b giữ lock **1132 s** (21:51:43–
  22:10:36Z), nhả sạch (`vite-lock-v2: ĐÃ NHẢ (thread=s3-round116,
  giữ 1132s)`); lock TRỐNG sau lượt cuối; không vite mồ côi
  (kill-vite :5590 "không có vite node, cổng 000 — đã sạch").
- **Stale-lock recovery sau reboot ĐÃ HOẠT ĐỘNG:** lock dir của
  attempt 1 còn lại sau reboot #49 (owner pid 58855 chết, boot đổi)
  được lần acquire của attempt 2 dọn qua đường tắt boot-đổi, không
  chờ đủ STALE_MIN 30 phút — dry-s3b boot vite :5590 lên tức thì
  (21:49:22Z, ~30 s sau khi driver khởi động). Đây là lần đầu đường
  tắt này được kiểm chứng bằng lượt đo thật (trước đây chỉ có test
  standalone R4).
- **Caveat nhỏ:** file cooldown trong QUEUEDIR tích lũy (13 file lúc
  kiểm tra cuối) — chỉ là file marker, không chặn ai (status đếm
  đúng 0 ticket sau khi R4 vá). Không dọn tay (tránh phá trạng thái
  lock của sibling đang chạy).
- **Caveat driver:** 2 dòng "KHÔNG NHẢ — owner hiện tại là '?'" ở
  cuối log là cleanup trap của driver gọi release sau khi run-attempt
  đã nhả — không phải lỗi (lock đã trống, không còn owner).

## §9. Kiểm chứng (cây cuối 03bf029f — không đổi)

- `tsc --noEmit` (apps/web): **KHÔNG chạy lại trong luồng này** —
  cây 03bf029f byte-identical với cây R10 đã chạy tsc 0 + vite build
  PASS + suite 27/27 (gộp muộn đợt 115, 20:45–20:52Z 14/11, boot #48)
  và S3 không sửa production (S2 sửa rồi revert về đúng md5 này).
  Chạy tsc lúc 22:1xZ sẽ tốn CPU trong lúc các luồng sibling khác còn
  chạy và không thêm thông tin (md5 khớp = cùng cây). Ghi rõ thiếu
  sót này thay vì giấu — parent/R10 có thể chạy lại tsc trên cây gộp
  đợt 116.
- `vite build`: **KHÔNG chạy trong luồng này** (cùng lý do; R10 đã
  chạy vite build PASS trên cùng cây 03bf029f).
- Không sửa production trong luồng này (S3); preview.tsx md5
  03bf029f trước = sau cả 3 lượt chạy đủ (dry-s3, dry-s3b, s78b);
  attempt 1 cũng 03bf029f trước khi bị cắt (md5 đổi giữa chừng là do
  S2, trước khi dry bắt đầu — xem §0).
- Probe copy `probe116s3-frame-parity.mjs`: node --check PASS trước
  lượt đầu; diff với probe115r3 chỉ gồm các dòng đổi tên.
- Analyzer `analyze116s3b.py`: tính lại toàn bộ từ results json thô;
  bảng §1 khớp output analyzer (đếm lại từ đĩa, không tin mù log
  driver). **Kiểm chứng độc lập trung vị load1:** tính lại trực tiếp
  từ `chr-code-blur-s78b/frame-parity-results.json` cho median 11,73
  (khớp trường `load1_median` của analyzer; summary dict của analyzer
  ghi 11,85 — chênh 0,12, ghi rõ cả hai số, xem §2 caveat 2).
  Phân bố tải hai đỉnh (§2) tính lại trực tiếp từ cùng file thô.
- Stall: kiểm chứng độc lập từ stall-watch.jsonl thô (§4) — khớp kết
  luận watcher (0 episode). Lưu ý nguồn của kết luận 0/6 (§4).
- Lock đã nhả sạch sau s78b (kiểm tra lock TRỐNG 22:10:42Z); không
  vite mồ côi; hog-count.txt = 0; cờ hogs-off 22:10:42Z (boot #49).

## §10. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng) — biên GIỮ dời lên
   21,07 (chế độ nice-hog), NHƯNG sát ngưỡng + tải hai đỉnh (xem §2
   caveat 1–2). Cần parent quyết:** (i) trục đo cho lượt tải dao động
   mạnh — giữ sampled MEAN (luật hiện tại, s78b = 21,07) hay chuyển
   sang trung vị/phân vị (s78b median chỉ 11,73 — nếu dùng median thì
   biên GIỮ vẫn là 19,63 của s77c, s78b không dời biên)? S3 không tự
   đổi trục hậu kiểm. (ii) Có chấp nhận biên 21,07 với biên độ an
   toàn mỏng (80,9% vs ngưỡng 80%) như một biên "yếu" cần xác nhận
   lại bằng lượt nữa, hay coi như biên chính thức? (iii) Chuẩn tải
   vẫn là hog nice -n 19 (quyết 15/11) — dãy không-nice vẫn dừng ở
   9,59. Đợt sau: lượt tải cao hơn nữa (vd 64 hog và/hoặc dial
   [30,45]) để tìm GÃY; nếu GIỮ tiếp tục sát ngưỡng thì cân nhắc
   tuyên bố "vùng chuyển tiếp" thay vì một điểm gãy sắc.
2. **Chỉ số đói pump (bar (c)): mới kiểm chứng 4 lần, CHƯA kết luận
   lần nào.** s76 thiếu tick; s77 vùng xám + lai; s77c vùng xám nhưng
   hợp lệ; s78b vùng xám, hợp lệ (2,19/s, 31,52%). 4 lượt tải dài
   bằng hog nice đều rơi vào vùng xám — bar (c) như đăng ký KHÔNG
   phân biệt được gì trong chế độ nice-hog. Đợt sau đăng ký lại bar
   này trên lượt hợp lệ đầu tiên rơi ngoài vùng xám (chỉ có chế độ
   hog không-nice hoặc lượt yên mới làm được), và cân nhắc thu hẹp
   vùng xám nếu có thêm dữ liệu (KHÔNG chỉnh ngưỡng hậu kiểm — chỉ
   đăng ký trước cho lượt sau). Nếu sau 2 lượt nữa vẫn xám thì nên
   tuyên bố bar (c) không áp dụng được cho chế độ nice-hog và dừng
   kiểm chứng nó ở chế độ này.
3. **Luật dial mới (600 s + hog ≥90 s) ĐẠT 2/2 — đề xuất thành luật
   đứng cho lượt tải cao sau** (xem §7). Không còn nợ kiểm chứng
   luật này; chỉ cần giữ nguyên trong prereg các lượt sau.
4. **Sampler chết sau clip c2 — cần luồng khác kiểm tra (nhắc lại R3
   §10 mục 4):** s78b lần thứ 4 liên tiếp (c2 chiếm 90/113 caps).
   Đừng dùng caps-chết làm bằng chứng đói nữa.
5. **Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN 0/6 lần thử thực chạy.**
   Giữ mức ưu tiên thấp (xem §4). Nếu còn theo đuổi thì cần đổi cách
   kích hoạt (tái hiện đúng điều kiện s72 lần 1: hog không-nice +
   RAM thấp + lượt dài), không tích mẫu mù thêm bằng lượt nice-hog.
6. **Freeze ~12 s ở ph 44,77 trong s76 (Phần A R3):** s78b không có
   freeze nào ≥10 s (min advance 10 s = 5,40 s; 0 chuỗi mẫu đứng
   yên). Không có dữ liệu mới cho cơ chế freeze s76.
7. **Element chết format error — pattern KHÔNG lặp lại (4 lượt liên
   tiếp không có):** s76 97/97 mẫu vs s77 0/130, s77c 0/121, s78b
   0/163. "Pool giữ element lỗi" là sự cố đơn lẻ của lượt s76. Hạ mức
   ưu tiên; không kết luận thêm.
8. **load1 không đo được tải thật khi hog vượt CPU quota (nhắc lại
   Q3 §5, tái hiện ở s78b §5):** load1 sụp về 0,64–1,02 trong khi 56
   hog vẫn sống + threadsR ~63. Đợt sau báo tải kèm threadsR + tick
   rate + skip-stale + PHÂN BỐ tải (mean/median/phân vị), đừng tin
   "dial ĐẠT" hay "load1 sụt" theo nghĩa đen trong cell này.
9. **Reboot #49 (21:46:46Z, gap 2h03'00") — ghi cho Q6/R7/S9 đối
   chiếu:** mù #33 đã mở, nay chứa cả #46, #47, #48 và #49; probe
   #35 ở đợt 116 đối chiếu từ mốc này. Tần suất reboot ~2 h/lượt —
   lượt dài ~35 phút có nguy cơ bị cắt ~30%; đợt sau cân nhắc chia
   lượt dài thành nhiều lượt ngắn hơn hoặc chấp nhận rủi ro chạy lại
   (checkpoint tăng dần của probe đã cứu dữ liệu thô attempt 1 khỏi
   mất hoàn toàn).
10. **S2 H2 verdict BỎ (throttle capture 250ms/clip) — patch giữ tại
    `hidden_files/round116-s2/s2-throttle-250ms.patch`, cây đã revert
    về 03bf029f.** Nợ zombie H2 chuyển sang hướng khác (xem LIMITS S2
    đợt 116). Không còn nợ S3 với S2.
11. Các nợ ngoài phạm vi S3 (giữ nguyên từ LIMITS gộp đợt 115 §10):
    G1 deinterlace (chờ user quyết), mù #22/#28/#29/#30/#31 (chờ user
    quyết), E4 cần đợt xác nhận tải cao (S1 đợt 116 đang làm), zombie
    chuyển sang hướng sửa (S2 verdict BỎ), ngưỡng WebKit ≤60 ms cần 1
    lượt yên thật, postboot + apt replay, headroom, seek/preload bar
    B-Q8-1 với fix ring-wrap, birefnet (CẤM thử lại khi RAM chưa đổi),
    TTS 39 (CẤM kiểm lại), ci-security.yml 403 (chờ user), release
    gate giữ nguyên.

---

## File đổi/thêm (đợt 116 S3)

- `apps/web/scripts/probe116s3-frame-parity.mjs` — probe copy
  probe115r3, chỉ đổi SCRATCH/CFG_DIR (diff chỉ dòng đổi tên;
  node --check PASS; **48.898 byte > 37.768 — ghi chú rõ cho lúc push**).
- `docs/PHASE9_ROUND116_S3_LOADBREAK_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round116-s3/` (không stage): prereg-s3.md (gồm §10 +
  §11 bổ sung),
  driver116s3.sh + driver116s3.log + runner116s3.sh +
  runner116s3.out (attempt driver 2 — dry-s3 PASS + s78 attempt 1 bị
  reboot #49 cắt),
  driver116s3b.sh + driver116s3b.log + runner116s3b.sh +
  runner116s3b.out (attempt 2 — dry-s3b PASS + s78b SẠCH, exit=0),
  analyze116s3.py + analyze116s3.txt/.json (dry-s3),
  analyze116s3b.py + analyze116s3b.txt/.json (dry-s3b + s78b),
  analyze116s3-s78bstall.py + analyze116s3b-s78stall.txt/.json
  (stall s78b; lưu ý tên file output có "s78stall" do sed đổi tên —
  xem §6),
  analyze116s3-s78stall.py (copy chưa dùng — stall attempt 1 không
  có results json để phân loại; chỉ dùng stall-watch.jsonl thô làm
  audit),
  hog-count.txt (= 0), hog-load-chr-code-blur-s78-attempt1.txt +
  hog-load-chr-code-blur-s78b-attempt1.txt (sampler driver 5 s; dry
  không có file sampler vì không hog), status.txt, 4 thư mục lượt
  probe dry-s3/dry-s3b/s78/s78b (mỗi thư mục có
  frame-parity-results.json + part files + frame-parity-partial.json +
  stall-watch.jsonl + .log + vite-attempt1.log — trừ s78 attempt 1
  chỉ có partial + stall-watch vì bị reboot cắt; s78b không có
  stall-events.json vì 0 episode; dry-s3 383 tick, dry-s3b 449 tick,
  s78b 1957 tick).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).
