# PHASE9_ROUND117_T3_LOADBREAK_LIMITS.md — Điểm gãy tải: s79 TRUNG GIAN ở 26,98 (thiếu GIỮ đúng ~5 tick); s80b TRUNG GIAN ở 12,03 — liều-đáp ứng KHÔNG đơn điệu; bar (c) TUYÊN BỐ KHÔNG ÁP DỤNG cho chế độ nice-hog (xám lần 6); s80 nhiễm H3e + reboot #53 cắt, VOID; kẹt 0/8

**Ngày:** 15/11/2026. **Luồng:** T3 (Phase 9 đợt 117). **Chủ đề:** Điểm gãy
tải — (1) đẩy CAO HƠN 21,07 tìm điểm gãy thật, (2) lượt xác nhận biên
GIỮ 21,07, (3) chẩn đoán chỉ số đói pump — bar (c) vùng xám lần thứ 4
(nợ #3 đợt 116; quyết parent #15: biên GIỮ 21,07, giữ chuẩn tải hog
nice -n 19, đẩy cao hơn đợt 117).
**Bối cảnh:** docs/PHASE9_ROUND116_S3_LOADBREAK_LIMITS.md (toàn bộ —
s78b: 1957 tick, trung vị 0, 80,9% ±1, GIỮ ở load1 mean 21,07, GIỮ
SÁT NGƯỠNG chỉ hơn ~17 tick, tải HAI ĐỈNH median 11,73; bar (c) xám
lần 4: tickRate 2,19/s, skipStale 31,52%; kẹt 0/6; luật dial mới ĐẠT
2/2; lock v2 0 DEFERRED) + docs/PHASE9_ROUND115_R3_LOADBREAK_LIMITS.md
+ hidden_files/round117-t3/prereg-t3.md (viết TRƯỚC mọi lượt đo mới —
gồm §12 bổ sung H3e nhiễm s80 + §13 bổ sung reboot #53 cắt s80) +
docs/PHASE9_ROUND116_LIMITS.md §10 mục 3 + build-loop-log.md (lượt
cron 15:35 +07 15/11 mở đợt 117, 10 luồng T1–T10; chốt chặn đã xóa).
**Build lúc viết prereg:** preview.tsx md5
`03bf029f09b8890b285eacc10a02172b` (khớp S3/R3 — không đổi).
**Boot lúc viết prereg:** uptime -s **2026-11-15 08:29:12Z**, boot_id
`22536366-8716-46f0-a999-cd4199080854` — **boot #52 (SỐ THỨ TỰ TẠM
THỜI)**. Reboot #53 cắt s80 (xem §0). RAM khả dụng lúc viết prereg
dao động 1279–2050 MB theo sibling. Headroom inotify ~961 watch sau
reboot #51 — vite tạm `watch.ignored` vẫn bắt buộc; probe R9 đợt 115
dừng ở ~1092 watch (ENOSPC).
F3 tap+relabel TẮT trong mọi lượt. Chỉ chạy chromium (đường rVFC).
Không probe WebKit → không chạy vcut-webkit-postboot-check.sh. Không
sửa production (T3 không sửa; T2 sửa rồi revert — xem §0). Không push
GitHub, không release/tag, không TTS 39, không birefnet. Repo local
không có `.git` (bản làm việc; HEAD kiểm qua public API bởi parent).

**Kết quả lớn nhất đợt này:**
- **(a) s79 TRUNG GIAN ở load1 mean 26,98 — biên GIỮ 21,07 KHÔNG được
  xác nhận, GIỮ vững lùi về 19,63:** 1757 tick, trung vị 0, **79,7%
  trong ±1 — thiếu ngưỡng GIỮ 80% đúng ~5 tick** (1401/1757; vạch
  80% = 1405,6). Đây KHÔNG phải lượt xác nhận sạch ở cùng mức tải
  (sampled mean s79 = 26,98, cao hơn s78b 21,07) — xem §2. Vùng
  chuyển tiếp GIỮ→TRUNG GIAN nằm trong (21,07, 26,98].
- **(b) s80b TRUNG GIAN ở load1 mean 12,03 — PHÁ VỠ liều–đáp ứng:**
  1697 tick, trung vị +1, mean +1,19, **64,4% trong ±1** (1093/1697;
  thiếu vạch 80% tới ~265 tick), 0,0% ≤ −2 (KHÔNG lag — presented
  ĐI TRƯỚC expected). Lượt tải THẤP NHẤT lại có offset TỆ NHẤT
  trong 4 lượt nice-hog (19,63→88,7%; 21,07→80,9%; 26,98→79,7%;
  12,03→64,4%) — load1 mean KHÔNG dự báo được offset trong chế độ
  này (xem §2, §5).
- **(c) Bar (c) — TUYÊN BỐ KHÔNG ÁP DỤNG ĐƯỢC cho chế độ hog nice
  -n 19 (theo quyết đăng ký trước prereg-t3 §3):** s79 xám lần 5
  (1,98/s, 32,92%) + s80b xám lần 6 (1,96/s, 27,17%) — cả hai lượt
  hợp lệ mới đều xám → dừng kiểm chứng bar (c) ở chế độ này. Chẩn
  đoán D1/D2/D3: skipStale PHẲNG trong khi offset dao động (không
  theo dõi offset); ngưỡng tickRate ≥5/s chưa bao giờ tới được ở
  chế độ nice-hog (5/5 lượt 1,96–3,37/s); ngữ nghĩa skip-stale là
  guard đúng (đọc code), không phải đói pump (xem §3).
- **(d) Bar (b) — playhead kẹt ở biên clip: KHÔNG TÁI HIỆN, 0/8 lần
  thử thực chạy** (s79 = #7, s80b = #8; s80 bị reboot cắt nên KHÔNG
  tính). s79: 30 s min advance 16,07 s; s80b: 17,97 s; 0 cửa sổ 10 s
  <1,33 s cả hai lượt; 0 chuỗi mẫu đứng yên (xem §4).
- **(e) s80 VOID hoàn toàn (2 lý do độc lập):** (i) T2 sửa cây H3e
  giữa lúc s80 đang dial (md5 03bf029f → af4d5753, cờ EDITING) —
  nhiễm cây; (ii) reboot #53 cắt ở ph 110,8/750 (14,8%). Chỉ giữ
  partial + stall-watch 25 mẫu làm vết audit; KHÔNG phân loại,
  KHÔNG tính bar nào. Chạy lại s80b trên cây cuối 03bf029f (H3e BỎ)
  — xem §0.
- **(f) Luật dial mới ĐẠT 3/3 lượt đợt này** (s79: 31,61/344 s;
  s80: 39,24/387 s; s80b: 38,26/158 s — cả ba đều 2 mẫu liên tiếp
  trong dải + hog-runtime ≥90 s; luật ≥90 s từ chối ĐẠT đúng 4 lần
  trong đợt). Lũy kế luật mới: 5/5 (S3 2/2 + T3 3/3).
- **(g) Lock v2: 0 TIMEOUT cho T3 đợt này.** Dry-t3 (retry) chờ
  632 s trong hàng đợi sau t4-hold (giữ 600 s) — waiter chờ >600 s
  sống đầu tiên, ghi cho T4 (điều kiện #3 đổi spec). Lock của s80
  thành stale do reboot, được lần acquire của T2 dọn qua đường tắt
  boot-đổi (xem §8).

---

## §0. Bối cảnh chạy (H3e sửa cây giữa dial s80; reboot #53 cắt s80; hàng đợi lock T4-hold; dry-t3 nhiễm tải sibling)

- **T2 sửa production giữa lúc T3 đo (H3e):** s80 check_tree PASS
  trước dial (~09:38:0xZ, md5 03bf029f, cờ round117-tree CHƯA TỒN
  TẠI). Trong lúc dial s80 (387 s), T2 apply H3e ("một lần đọc video
  mỗi tick" — giữ storeHeldFrame mỗi tick; các lần vẽ khác trong
  tick ở ĐƯỜNG PLAIN đọc từ held canvas thay vì đọc lại video — chạm
  trực tiếp đường tick/pump mà probe đo): md5 **03bf029f →
  af4d5753**, cờ `round117-tree` xuất hiện với `status: EDITING`
  (note: "T1 done, T3 probe xong, lock trong, khong probe nao chay").
  **T2 kiểm tra lock (trống) nhưng KHÔNG thấy dial của T3** — dial
  diễn ra NGOÀI lock theo thiết kế (fairness đợt 114), nên cờ lock
  không báo được "đang dial". Kẽ hở phối hợp đã biết: luồng sửa cây
  chỉ nhìn lock + cờ, luồng đo chỉ kiểm tra cây TRƯỚC dial; dial dài
  (387 s) là cửa sổ mù. T2 tin T3 đã xong probe vì s79 vừa xong
  09:37:56Z (prereg T2 §12 ghi "apply H3e chờ T3 xong probe" — T2
  không biết s80 sắp chạy; không đổ lỗi, chỉ ghi cơ chế để đợt sau
  tránh: luồng đo dài nên ghi cờ "đang dial" hoặc luồng sửa cây phải
  hỏi trực tiếp trước khi apply).
- **Quyết ngay khi phát hiện (prereg §12, TRƯỚC khi s80 phát xong):
  s80 ĐÁNH DẤU NHIỄM (LAI về cây)** — cho chạy hết lượt (đã trả giá
  dial + đang giữ lock), phân tích CHỈ MÔ TẢ trên cây mới, KHÔNG dùng
  để đóng khoảng, KHÔNG đếm vào quyết D bar (c), KHÔNG tính vào tỉ
  lệ tái hiện kẹt. Quyết này theo luật §0 (lượt lai), không đổi luật
  hậu kiểm.
- **Reboot #53 = 2026-11-15 09:47:08Z** (boot_id
  `574e3d6b-4a99-4b6b-b6e4-307148232a98`). Gap #52 (08:29:12Z) → #53
  (09:47:08Z) = **1h17'56"** — trong dải chứng nhận [19'07",
  3h14'08"], KHÔNG phá sàn. Số thứ tự #53 vẫn tạm thời (mù #35 đã
  mở, nay chứa cả #49/#50/#51/#52/#53 — T7 owns). Caveat đồng hồ như
  #47/#48/#49: mốc uptime -s sớm hơn đồng hồ tường ~30–40 s (mẫu
  stall-watch cuối s80 09:47:43.837Z + dòng playhead cuối
  09:47:43.724Z đều sau mốc uptime -s; reboot thực trong khoảng
  09:47:44–09:48:50Z).
- **s80 bị cắt ở ph 110,8/750 (14,8%) — LOẠI HOÀN TOÀN** (luật §0,
  cộng thêm nhiễm H3e §12): dial ĐẠT 09:44:49Z (load1 39,24,
  hog-runtime 387 s, 64 hog) → phát 09:44:49Z → playhead tới 110,8
  lúc 09:47:43.724Z thì reboot cắt. Driver + probe + vite chết theo
  máy; trap cleanup KHÔNG chạy — hog-count.txt còn kẹt 64 trong khi
  0 hog thật còn sống (kiểm sạch bằng bracket-trick 09:51:38Z, đã
  reset về 0 bằng tay + ghi cờ hogs-off). Bằng chứng reboot (không
  phải lỗi probe): T2 cũng chết theo máy và lấy lại lock 09:48:50Z
  với ghi nhận stale "boot đổi"; phiên exec của T3 cũng báo service
  restarted cùng lúc. Dữ liệu thô giữ làm vết audit trong
  `hidden_files/round117-t3/chr-code-blur-s80/` (chỉ
  frame-parity-partial.json 16.233 byte + stall-watch.jsonl 25 mẫu —
  KHÔNG có results json).
- **H3e BỎ, cây cuối về baseline:** T2 revert H3e tạm để chạy B1
  (md5 về 03bf029f 09:57:37Z), rồi verdict **H3e BỎ** (~10:05Z):
  cờ cuối `md5-final: 03bf029f`, `status: NO-CHANGE`, "cây đã về
  đúng baseline 03bf029f; fix giữ dạng patch h3e-fix.patch +
  apply-h3e.py trong LIMITS". **Cây cuối = cây prereg (md5 đầy đủ
  03bf029f09b8890b285eacc10a02172b — kiểm lại byte-identical, xem
  §9).** s80b đo trên cây cuối này nên so sánh trực tiếp được với
  s79/s78b.
- **s80b (chạy lại sạch):** driver117t3b.sh riêng — chờ T2 DONE
  (wait_tree_done: poll cờ 60 s + yêu cầu md5 ổn định 60 s sau
  NO-CHANGE; hạn 11:30Z) → dry-t3b PASS → s80b dial ĐẠT 10:10:04Z
  → phát → exit=0. Chi tiết §1/§2.
- **Hàng đợi lock lúc dry (T4-hold giữ 600 s):** dry-t3 lần 1
  DEFERRED sau 600 s chờ vite (T6 giữ lock/vite 08:42–~08:56Z,
  rồi T2 giữ tới ~09:01Z); retry vào run-attempt 09:02:19Z, xếp
  sau t4-hold (giữ từ 09:02:17Z) + t4-wb, chờ **632 s** rồi
  ACQUIRED 09:12:51Z (xem §8). Đây là lần đầu một waiter thường
  chờ >600 s sống (ghi cho T4).
- **Tải nền sibling:** T1 (E4, cần lượt yên loadN=0), T6 (ghost
  seek, lượt yên), T9 + T4 (lock test) chạy song song. Tải sibling
  có trong sampled mean (đó là tải probe thực sự chịu; ghi rõ,
  không tách). Hog T3 chỉ bật trong cửa sổ đo của T3 (dial + phát
  + teardown), nhả ngay sau mỗi lượt; hog-count.txt + status.txt
  cập nhật liên tục. **Ngoại lệ đáng ghi:** dry-t3 chạy DƯỚI tải
  sibling load1 ~27 (không phải dry yên — xem §1/§6).
- **RAM:** freeMB tối thiểu trong lúc phát: s79 **315 MB** (watcher;
  s78b cũng 315 MB — trùng số), s80b **265 MB**; dry-t3b min 916 MB
  (lúc phát). Không OOM lượt nào.
- **ENOSPC — 0 lần:** vite tạm `server.watch.ignored: ["**/**"]` +
  CFG_DIR riêng /tmp/round117-t3; vite lên ngay cả 4 lượt (dry-t3,
  dry-t3b, s79, s80b) + s80 (trước khi bị cắt).

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | median load1 | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-dry-t3 | stripes-code-blur | chạy khô, không hog | — | **27,37** (n=4) | 27,67 | 30,0 | **40** | 4,45 | 46 | **0** (−1..+4) | 72,5% | **TRUNG GIAN (chỉ validate dụng cụ — NHƯNG chạy dưới tải sibling, không phải dry yên; không tính bar)** |
| chr-code-blur-s79 | stripes-code-blur | [25, 40] | **ĐẠT 31,61** (56 hog nice -n 19, hog-runtime 344 s) | **26,98** (n=179) | 20,17 | 62,9 | **1757** | 1,98 | 106 | **0** (−3..+43) | **79,7%** | **TRUNG GIAN (HỢP LỆ: ≥50 tick, md5 sạch)** |
| chr-code-blur-s80 (att.1) | stripes-code-blur | [30, 45] | **ĐẠT 39,24** (64 hog nice -n 19, hog-runtime 387 s) | — (bị cắt) | — | — | — (partial) | — | — (partial) | — | — | **LOẠI HOÀN TOÀN (nhiễm H3e + reboot #53 cắt ở ph 110,8/750)** |
| chr-code-blur-dry-t3b | stripes-code-blur | chạy khô, không hog | — | **1,64** (n=4) | 1,65 | 2,2 | **249** | 26,23 | 229 | **0** (−1..+1) | 100% | **GIỮ (validate dụng cụ trên cây cuối, YÊN thật)** |
| chr-code-blur-s80b | stripes-code-blur | [30, 45] | **ĐẠT 38,26** (24 hog nice -n 19 — xem §5, hog-runtime 158 s) | **12,03** (n=175) | 9,86 | 30,9 | **1697** | 1,96 | 102 | **+1** (−1..+25) | **64,4%** | **TRUNG GIAN (HỢP LỆ: ≥50 tick, md5 sạch)** |

- **dry-t3 (nclips=3, 9 s media, boot #52):** 40 tick — CHỈ bằng
  ~1/10 dry S3 (383/449 tick). Nguyên nhân đo được: chạy DƯỚI tải
  sibling load1 26,57–27,72 suốt lượt (4/4 mẫu ~27; threadsR 26–36;
  loadAtPlay 27,53). tickRate 4,45/s (so với 33–47/s của dry yên),
  skipStale 37,0% (17/46), offset 72,5% ±1 (TRUNG GIAN — nhưng dry
  không phân loại). Caps 46 phân bố đều c0/c1/c2 (16/13/17) — sampler
  bình thường. **Kết luận:** dry-t3 validate được dụng cụ (probe
  exit=0, trích đủ chunk, mtimeChanged=false, pageErrs=0) nhưng
  KHÔNG phải dry yên — mọi số dry-t3 đều là số "dry dưới tải",
  không dùng làm baseline yên. Dry yên thật là dry-t3b (xem dưới).
  Lần 1 DEFERRED (vite bận 600 s — T6 rồi T2 giữ); retry PASS.
- **s79 (nclips=250, 750 s media, boot #52):** dial ĐẠT 09:19:46Z
  (load1 31,61, 2 mẫu liên tiếp trong [25,40], hog-runtime 344 s);
  acquire lock ngay (wait 0 s); app boot OK; phát 09:19:47Z →
  ~09:35:10Z (tường phát 889,6 s, playhead 749,0/750 s); trích xong
  ~09:37:53Z; probe exit=0. **1757 tick — gấp 35 lần ngưỡng 50.**
  Phân loại TRUNG GIAN theo offset, **HỢP LỆ** (md5 03bf029f →
  03bf029f, mtimeChangedMidRun=False, không reboot cắt ngang).
- **s80 attempt 1 (nclips=250, boot #52):** dial ĐẠT 09:44:49Z
  (load1 39,24, hog-runtime 387 s, 64 hog) → acquire lock ngay
  (wait 1 s) → phát 09:44:49Z → playhead tới **110,8/750 s (14,8%)**
  lúc 09:47:43.724Z thì reboot #53 cắt. Partial + stall-watch 25
  mẫu giữ làm audit, KHÔNG phân tích phân loại. Đã nhiễm H3e từ
  trước khi phát (md5 af4d5753 lúc phát) nên dù không bị reboot cắt
  thì lượt này vẫn LAI về cây.
- **dry-t3b (nclips=3, boot #53, cây cuối 03bf029f):** 249 tick,
  GIỮ 100% ±1, tickRate 26,23/s, skipStale 1,3% (3/230), caps 229
  đều c0/c1/c2 (74/81/74), loadSamples mean 1,64 — **dry yên thật**,
  validate probe117t3 trên cây cuối. md5 03bf029f trước = sau.
- **s80b (nclips=250, 750 s media, boot #53, cây cuối 03bf029f):**
  dial ĐẠT 10:10:04Z (load1 38,26, hog-runtime 158 s — NHƯNG chỉ
  24 hog, xem §5); acquire lock ngay (wait 1 s); app boot OK; phát
  10:10:05Z → ~10:25:14Z (tường phát 861,3 s, playhead tới cuối
  media; load mẫu trong lúc phát n=175); trích xong ~10:27:31Z;
  probe exit=0. **1697 tick — gấp 34 lần ngưỡng 50.** Phân loại
  TRUNG GIAN theo offset, **HỢP LỆ** (md5 03bf029f → 03bf029f,
  mtimeChangedMidRun=False, không reboot cắt ngang).
- **Hai sampler khớp nhau về tải trong lúc phát (ở mức mean):**
  s79: probe loadSamples mean 26,98 (n=179) vs driver sampler 5 s
  mean 23,37 (n=280, max 59,55) — chênh do cửa sổ khác nhau (driver
  sampler bao gồm cả giai đoạn dial trước khi phát, nên thấp hơn
  vì dial có đoạn sụp) + dao động tải lớn (xem §5). s80b: probe
  12,03 (n=175) vs driver sampler 16,66 (n=236, max 49,20) — driver
  cao hơn vì bao gồm đoạn dial [30,45] lúc tải sibling còn cao.
  Mức tải trong lúc phát được đo chắc chắn ở ~12 (s80b) và ~27
  (s79) theo probe loadSamples.

## §2. Bar (a) — điểm gãy: VẪN MỞ; GIỮ vững lùi về 19,63; vùng chuyển tiếp (21,07, 26,98]; liều–đáp ứng KHÔNG đơn điệu (s80b tệ nhất ở tải thấp nhất)

- **Điểm gãy: VẪN MỞ** (không có lượt GÃY nào). Không có lượt GIỮ
  mới nào trong đợt này: s79 TRUNG GIAN ở 26,98; s80b TRUNG GIAN ở
  12,03. Analyzer: "Bar (a): co 2 luot blur hop le nhung KHONG co
  GIU/GAY (toan TRUNG-GIAN) -> diem gay VAN MO".
- **Biên GIỮ 21,07 KHÔNG được xác nhận — GIỮ vững lùi về 19,63
  (s77c, 88,7%):** s79 là lượt "xác nhận" theo prereg §5, nhưng
  sampled mean của nó là 26,98 (cao hơn s78b 21,07 — do tải sibling
  trong lúc phát cao hơn), không phải một lượt lặp ở đúng 21,07.
  Kết quả TRUNG GIAN 79,7% ở 26,98 cho thấy: (i) biên 21,07 của
  s78b là GIỮ sát ngưỡng (80,9%, hơn ~17 tick) và lượt tải cao hơn
  đã lật xuống dưới ngưỡng — biên này YẾU, không vững như 19,63
  của s77c (88,7%); (ii) **vùng chuyển tiếp GIỮ→TRUNG GIAN nằm
  trong (21,07, 26,98]** — khoảng này chứa điểm cắt vạch 80%, nhưng
  KHÔNG phải điểm gãy (điểm gãy cần GÃY, tức <50% ±1 + trung vị
  ≤ −2; chưa lượt nào GÃY).
- **s79 thiếu GIỮ đúng ~5 tick (tính lại từ results json thô):**
  trong ±1 = 1401/1757 (79,74%); vạch 80% = 1405,6 tick → thiếu
  4,6 tick. Trung vị 0, mean +0,69, ≤−2 chỉ 0,17% (3/1757), dải
  −3..+43 (đuôi dương dài — presented đi trước expected, như s78b
  mean +0,66). Theo quý (D1): Q1 78,1% / Q2 73,4% / Q3 85,7% /
  Q4 81,8% — nửa đầu 76,9% (783 tick, 1,76/s), nửa sau 82,0%
  (974 tick, 2,19/s): offset CẢI THIỆN trong nửa sau dù tải vẫn
  dao động mạnh (xem §5).
- **s80b TRUNG GIAN ở 12,03 — phá vỡ liều–đáp ứng:** trong ±1 =
  1093/1697 (64,41%); vạch 80% = 1357,6 → thiếu 264,6 tick. Trung
  vị **+1** (lần đầu trung vị khác 0 ở lượt dài nice-hog), mean
  +1,19, ≤−2 = **0,0%** (0/1697 — KHÔNG lag chút nào), dải −1..+25.
  Phân bố offset: −1: 203 / 0: 529 / 1: 361 / 2: 278 / 3: 204 /
  4: 46 / 5: 31 / 6: 19... — 35,6% ≥ +2 (presented đi trước ≥2
  frame). **Không phải chỉ lệch +1 hệ thống:** trong [0,+2] (tức
  ±1 quanh trung vị +1) cũng chỉ 68,8% — vẫn xa vạch 80%. Theo quý
  (D1): Q1 65,6% / Q2 65,1% / Q3 64,1% / Q4 62,8% — PHẲNG ~63–66%
  cả lượt (khác s79: quý dao động 73–86%).
- **Bảng liều–đáp ứng gộp (4 lượt nice-hog hợp lệ, cùng cây
  03bf029f, cùng probe họ):**

| lượt | load1 mean | median load1 | %±1 | trung vị off | mean off | phân loại |
|---|---|---|---|---|---|---|
| s77c (R3) | 19,63 | — | 88,7% | 0 | +0,70 | GIỮ |
| s78b (S3) | 21,07 | 11,73 | 80,9% | 0 | +0,66 | GIỮ |
| s79 (T3) | 26,98 | 20,17 | 79,7% | 0 | +0,69 | TRUNG GIAN |
| s80b (T3) | 12,03 | 9,86 | 64,4% | +1 | +1,19 | TRUNG GIAN |

  **Không đơn điệu:** tải thấp nhất (12,03) cho offset tệ nhất
  (64,4%); tải cao nhất (26,98) cho offset tốt thứ hai (79,7%).
  Mean offset cũng không tăng theo tải (+0,70 → +0,66 → +0,69 →
  +1,19 — s80b cao nhất dù tải thấp nhất). **Kết luận:** trong chế
  độ hog nice -n 19 trên cell này, sampled mean load1 KHÔNG phải
  trục đơn điệu dự báo offset. Điểm gãy như một hàm của load1 mean
  có thể KHÔNG TỒN TẠI ở dạng sắc nét — dữ liệu ủng hộ "vùng chuyển
  tiếp rộng + nhiễu lớn giữa các lượt" hơn là "một điểm gãy".
  (Caveat: chỉ 4 lượt; s80b có 2 yếu tố khác biệt — 24 hog lúc phát
  và boot #53 mới 23 phút — xem §5; không đủ dữ liệu để tách yếu tố
  nào gây ra 64,4%.)
- **Caveat chế độ tải (§5 R3/S3) VẪN ĐỨNG:** biên 21,07/19,63 đo
  bằng hog nice -n 19. Dãy hog không-nice (N5/P5/Q3) vẫn dừng ở biên
  GIỮ 9,59 — chưa có lượt không-nice nào vượt qua 9,59 mà GIỮ. Hai
  con số này là hai biên trên hai chế độ tải khác nhau, KHÔNG phải
  một khoảng duy nhất.
- **Câu hỏi trục đo (S3 §10 mục 1, chờ parent quyết — T3 KHÔNG tự
  đổi):** phân loại vẫn theo sampled MEAN như prereg. Nếu dùng
  trung vị: s78b 11,73 / s79 20,17 / s80b 9,86 — thứ tự tải đổi hẳn
  (s79 cao nhất, s80b thấp nhất, s78b ở giữa); nếu dùng phân vị
  cao (p90): s79 ~55 / s80b ~20 / s78b ~? — cũng đổi thứ tự. Mọi
  trục đều cho cùng kết luận "không đơn điệu" vì %±1 của s80b
  (64,4%) tệ nhất dù nó thấp nhất trên MỌI trục (mean/median/max
  đều thấp nhất: 12,03/9,86/28,08). Ghi rõ để parent quyết trục cho
  đợt sau.
- **Toán tích tick prereg ĐÚNG:** prereg tính ~1960 tick ở rate
  2,19/s; thực tế s79 1757 tick ở 1,98/s, s80b 1697 tick ở 1,96/s.
  Điểm hòa vốn 50 tick (0,056/s) không bị chạm tới.

## §3. Bar (c) — chỉ số đói pump: TUYÊN BỐ KHÔNG ÁP DỤNG ĐƯỢC cho chế độ nice-hog (xám lần 5 + 6) + chẩn đoán "bar sai"

- **Quy tắc đã đăng ký trước (giữ nguyên prereg-q3 §2, đăng ký lại
  trong prereg-t3 §3 — KHÔNG chỉnh ngưỡng sau khi thấy s77/s77c/
  s78b/s79/s80b):** tickRate = nBlendTick / wall_s; skipStale = số
  pump `decision == "skip-stale-frame"` / tổng số pump entry. Dự báo
  GIỮ iff tickRate ≥ 5/s VÀ skipStale ≤ 20%; dự báo KHÔNG-GIỮ iff
  tickRate < 1/s HOẶC skipStale > 35%; còn lại vùng xám. Bar ĐẠT iff
  lượt hợp lệ (≥50 tick) VÀ dự báo khớp phân loại offset.
- **Kết quả s79:** tickRate **1,98/s**, skipStale **32,92%**
  (721/2190 pump; các decision còn lại: capture 1445, skip-stale
  10, reset-capture 7, skip-seeking 4, duplicate 3) → rơi vào
  **VÙNG XÁM** → không dự báo. Phân loại offset: TRUNG GIAN (hợp
  lệ). Đây là lần xám **thứ 5** liên tiếp ở lượt tải dài nice-hog.
- **Kết quả s80b:** tickRate **1,96/s**, skipStale **27,17%**
  (558/2054 pump; capture 1478, skip-stale 6, reset-capture 8,
  skip-seeking 3, duplicate 1) → rơi vào **VÙNG XÁM** → không dự
  báo. Phân loại offset: TRUNG GIAN (hợp lệ). Đây là lần xám **thứ
  6** liên tiếp.
- **TUYÊN BỐ (theo quyết đăng ký trước prereg-t3 §3 D-quyết, theo
  S3 §10 mục 2):** cả hai lượt hợp lệ mới (s79 + s80b) đều xám →
  **bar (c) như đã đăng ký KHÔNG ÁP DỤNG ĐƯỢC cho chế độ hog nice
  -n 19; DỪNG kiểm chứng nó ở chế độ này.** Tuyên bố này chỉ về BAR
  NHƯ ĐÃ ĐĂNG KÝ, không phải về sức khỏe pump (pump vẫn được đo
  bằng offset GIỮ/GÃY §0). Bar (c) vẫn có thể kiểm chứng ở chế độ
  khác (hog không-nice: tickRate <1/s, skipStale >35% — đã có 4
  lượt tham chiếu hậu kiểm khớp hướng; hoặc lượt yên: tickRate
  ≥5/s, skipStale ≤20% — dry-t3b 26,23/s + 1,3% dự báo GIỮ, khớp
  GIỮ 100% — xem bằng chứng phụ dưới đây).
- **Bảng tham chiếu cập nhật (thêm s79 + s80b):**

| lượt | phân loại | tick rate (/s) | skip-stale-frame | dự báo | khớp? |
|---|---|---|---|---|---|
| s75 (control) | GIỮ | 17,35 | 10,8% | GIỮ | có |
| s73 (N5) | TRUNG-GIAN | 1,6 | 40,3% | KHÔNG-GIỮ | có |
| s77 (P5) | TRUNG-GIAN (k.h.lệ) | 0,17 | 46,2% | KHÔNG-GIỮ | có |
| s78 (P5) | TRUNG-GIAN (k.h.lệ) | 0,26 | 41,0% | KHÔNG-GIỮ | có |
| s76 (Q3) | TRUNG-GIAN (k.h.lệ) | 0,09 | 44,26% | KHÔNG-GIỮ | có (hướng), chưa kết luận |
| s77 (R3 att.1) | GIỮ (LAI, k.h.lệ) | 2,17 | 30,68% | XÁM | không đối chiếu được |
| s77c (R3 att.3) | GIỮ (HỢP LỆ) | 3,37 | 29,73% | XÁM | không đối chiếu được |
| s78b (S3 att.2) | GIỮ (HỢP LỆ) | 2,19 | 31,52% | XÁM | không đối chiếu được |
| **s79 (T3)** | **TRUNG-GIAN (HỢP LỆ)** | **1,98** | **32,92%** | **XÁM** | **không đối chiếu được** |
| **s80b (T3)** | **TRUNG-GIAN (HỢP LỆ)** | **1,96** | **27,17%** | **XÁM** | **không đối chiếu được** |
| dry-t3b (T3) | GIỮ (validate) | 26,23 | 1,3% | GIỮ | có |
| dry-t3 (T3, dưới tải) | TRUNG-GIAN (validate) | 4,45 | 37,0% | KHÔNG-GIỮ | có (hướng) |

  (k.h.lệ = không hợp lệ để đóng khoảng; "khớp" ở các lượt k.h.lệ
  chỉ là so hướng, không phải bar pass.)
- **Bằng chứng phụ (không tính bar):** dry-t3b tickRate 26,23/s +
  skipStale 1,3% (3/230) → dự báo GIỮ, khớp phân loại GIỮ của dry
  (100% trong ±1). dry-t3 (dưới tải sibling load1 ~27): 4,45/s +
  37,0% (17/46) → dự báo KHÔNG-GIỮ, khớp hướng TRUNG GIAN (72,5%
  ±1) — nhưng dry-t3 chỉ có 40 tick (<50) và là lượt validate,
  không tính vào bar. Nhất quán, nhưng dry là lượt validate dụng cụ.
- **Chẩn đoán D1 — tương quan theo quý (đăng ký trước, §3 prereg):**
  - **s79:** skipStale PHẲNG cả 4 quý (32,2% / 33,3% / 32,8% /
    33,5%) trong khi %±1 dao động 73,4–85,7% (Q1 78,1% / Q2 73,4% /
    Q3 85,7% / Q4 81,8%) → **skipStale KHÔNG theo dõi offset**
    trong lượt này. tickRate dao động 1,55–2,35/s: Q2 thấp nhất
    (1,55/s) ĐÚNG là quý tệ nhất (73,4%); nhưng Q1 (1,98/s, 78,1%)
    vs Q4 (2,25/s, 81,8%) vs Q3 (2,35/s, 85,7%) — chênh lệch nhỏ,
    n=4 quý, không đủ để tuyên bố tickRate dự báo được offset (xem
    nuance dưới đây). Capture rate theo quý: 1,64 / 1,32 / 1,94 /
    1,80/s — cùng chiều với %±1 (Q2 thấp nhất cả hai).
  - **s80b:** cả ba chỉ số đều PHẲNG theo quý: %±1 65,6% / 65,1% /
    64,1% / 62,8%; tickRate 2,09 / 1,98 / 1,94 / 1,87/s; skipStale
    29,8% / 23,3% / 30,0% / 25,7% — quý có skipStale THẤP NHẤT
    (Q2, 23,3%) KHÔNG có %±1 tốt nhất (65,1% vs Q1 65,6% với
    skipStale 29,8%) → **skipStale không theo dõi offset** (lần 2).
    Capture rate phẳng 1,59–1,86/s.
  - **Kết luận D1:** skipStale không mang thông tin về offset trong
    cả hai lượt mới (phẳng trong khi offset dao động 12 điểm ở s79;
    thấp nhất ở quý không tốt nhất ở s80b). tickRate có co-move yếu
    ở s79 (nửa đầu 1,76/s + 76,9% → nửa sau 2,19/s + 82,0%; Q2 thấp
    nhất cả hai) nhưng phẳng ở s80b (1,87–2,09/s trong khi %±1
    62,8–65,6%) — không nhất quán giữa hai lượt. **Nuance ghi rõ:**
    dữ liệu KHÔNG loại trừ khả năng tickRate ĐƠN ĐỘC mang tín hiệu
    yếu; nhưng bar (c) như đăng ký gộp tickRate VÀ skipStale với
    ngưỡng ≥5/s + ≤20% — vùng dự báo GIỮ của nó không tới được,
    vùng KHÔNG-GIỮ gần như không tới được (skipStale tối đa 32,9%
    ở lượt hợp lệ; tickRate tối thiểu 1,96/s) — bar không phân biệt
    được gì trong chế độ này bất kể tickRate có tín hiệu yếu hay
    không. Nếu đợt sau muốn thử lại, phải đăng ký lại bar MỚI (vd
    chỉ tickRate, ngưỡng trong [1,5]) — KHÔNG chỉnh ngưỡng hậu kiểm
    trên dữ liệu này.
- **Chẩn đoán D2 — khả năng đạt ngưỡng:** 5/5 lượt tải dài nice-hog
  hợp lệ có tickRate 1,96–3,37/s (s77: 2,17; s77c: 3,37; s78b: 2,19;
  s79: 1,98; s80b: 1,96) và skipStale 27,2–32,9% — TẤT CẢ rơi vào
  vùng xám (tickRate 1–5/s, skipStale 20–35%). Ngưỡng GIỮ ≥5/s chưa
  bao giờ tới được (dry yên 26–51/s; dry dưới tải 4,45/s). Vùng
  xám nuốt trọn chế độ nice-hog — bar (c) như đăng ký KHÔNG phân
  biệt được gì ở chế độ này. Đây là bằng chứng thứ 6, đủ để tuyên
  bố không-áp-dụng theo luật đã đăng ký.
- **Chẩn đoán D3 — ngữ nghĩa skip-stale-frame (đọc code TRƯỚC khi
  đo, `apps/web/src/preview.tsx` ~dòng 2216, trong `rvfcCallback`):**
  `skip-stale-frame` bắn khi `currentTime − mediaTime > 1/fps +
  0,5ms`, tức callback rVFC bắn TRỄ — element đã chuyển sang frame
  mới hơn metadata. Pump BỎ QUA lần capture đó để KHÔNG gán nhầm
  nhãn frame cũ cho pixels frame mới (comment trong code: "thà
  skip" — skip nhầm chỉ tạo lỗ 1 frame trong ring, nhãn vẫn đúng;
  capture nhầm thì đầu độc snapshot). → skip-stale là GUARD ĐÚNG
  khi main thread bận, không phải bằng chứng pump đói frame. Dưới
  tải cao, callback trễ là tất yếu nên skipStale cao (~30%) có thể
  CÙNG TỒN TẠI với offset GIỮ (s78b: 31,52% skipStale mà 80,9% ±1)
  lẫn TRUNG GIAN (s79/s80b). Câu chuyện nhân quả của bar
  ("skipStale >35% ⇒ dự báo KHÔNG-GIỮ") ĐẢO NGƯỢC cơ chế: skip càng
  nhiều thì nhãn càng sạch, presented càng bám expected — dữ liệu
  D1 (skipStale phẳng, offset dao động) phù hợp với diễn giải này.
  **Hạn chế của D3:** đây là diễn giải cơ chế từ đọc code + tương
  quan D1, không phải can thiệp nhân quả (không có A/B tắt guard —
  tắt guard sẽ đầu độc snapshot, không phải thí nghiệm sạch). Ghi
  rõ để đợt sau không trích D3 như chứng minh nhân quả.
- **Đánh giá cuối bar (c):** 6 lần kiểm chứng không kết luận được
  liên tiếp ở lượt tải dài nice-hog (s77 lai, s77c, s78b, s79,
  s80b + s76 thiếu tick). Tuyên bố KHÔNG ÁP DỤNG cho chế độ này
  (xem trên). Bar (c) còn nguyên giá trị ở chế độ không-nice và
  lượt yên — nhưng đó là việc của đợt sau, với prereg mới.

## §4. Bar (b) — playhead kẹt ở biên clip: KHÔNG TÁI HIỆN (0/8 lần thử thực chạy)

- **Định nghĩa stall đăng ký trước (giữ nguyên P5/Q3/R3/S3):** xem
  prereg-t3 §0.
- **Kết quả s79:** **0 episode stall** (163 mẫu watcher, tường 5,8–
  888,5 s, playhead 3,47 → 748,47). **Kết quả s80b:** **0 episode
  stall** (157 mẫu watcher, tường 5,9–868,7 s, playhead 2,70 →
  748,83). **Tỉ lệ tái hiện gộp 0/8 lần thử thực chạy** (s77-P5,
  s78-P5, s76-Q3, s77-R3-attempt1, s77c-R3-attempt3, s78b-S3-attempt2,
  s79-T3, s80b-T3; s77b attempt 2 + s78 attempt 1 + s80 attempt 1
  bị reboot cắt nên KHÔNG tính — T3 KHÔNG tuyên bố "0/9" hay
  "0/11"). stall-events.json KHÔNG có file ở cả hai lượt (watcher
  không ghi khi 0 episode); stallBlocks=[] trong results json cả
  hai lượt.
- **Kiểm chứng độc lập từ mẫu thô (tính lại từ stall-watch.jsonl,
  không tin mù watcher — analyzer analyze117t3-s79stall.py /
  analyze117t3-s80bstall.py):**
  - **s79:** Cửa sổ 30 s (mọi cặp, wall-diff [25,30]s): n=158, min
    advance **16,07 s** (333827→360714, ph 279,67 → 295,73). Không
    stall. Cửa sổ 10 s (P8, mọi cặp [8,10]s): n=1, min advance
    **8,93 s**; **0 cửa sổ advance <1,33 s**. Cửa sổ 10 s (phương
    pháp thay thế — mẫu đầu tiên ≥10 s sau mỗi mẫu): n=161, min
    advance **4,23 s** (333827→344309, ph 279,67 → 283,90). Dải mở
    rộng [8,12]s: n=160, min advance cũng 4,23 s. Kiểm tra đóng băng
    trực tiếp: **0 chuỗi mẫu liên tiếp đứng yên** ph. Khoảng liên
    tiếp chậm nhất vẫn tiến **1,97 s trong 4,99 s** tường (wall
    339322, ph 281,93). `playing=false`: 0/163 mẫu. Gap mẫu watcher
    min 4608 ms / median 5486 ms / max 6276 ms.
  - **s80b:** Cửa sổ 30 s: n=152, min advance **17,97 s**
    (291219→317901, ph 255,13 → 273,10). Không stall. Cửa sổ 10 s
    (P8): n=1, min advance **7,63 s**; **0 cửa sổ <1,33 s**. Phương
    pháp thay thế: n=155, min advance **5,73 s** (306033→317901, ph
    267,37 → 273,10). Dải [8,12]s: n=148, min advance cũng 5,73 s.
    **0 chuỗi mẫu liên tiếp đứng yên.** Khoảng liên tiếp chậm nhất
    vẫn tiến **3,30 s trong 5,51 s** tường (wall 615222, ph 529,27).
    `playing=false`: 0/157 mẫu. Gap mẫu watcher min 4486 ms /
    median 5506 ms / max 7502 ms.
  - **Vùng chậm nhất:** s79 ph ~266–296 (wall ~317–360 s); s80b ph
    ~255–291 (wall ~291–338 s) — CÙNG VÙNG clip c85–c97 (mỗi clip
    3 s: ph 255–291 ≈ clip c85–c97). s78b: vùng chậm nhất ph
    ~446–468 (clip c148–c156); s77c: ph ~148–157. Hai lượt T3 cùng
    chậm ở ph ~255–296 — trùng nhau 2/2 lượt đợt này nhưng khác
    vùng của S3/R3. Ghi lại để đợt sau đối chiếu; chưa đủ để tuyên
    bố "vùng clip xấu ổn định" (chỉ 2 lượt, vùng chậm vẫn tiến đều
    4–6 s/10 s, không freeze, không stall theo định nghĩa).
  - **Nguồn kết luận:** analyzer stall chạy trên stall-watch.jsonl
    của ĐÚNG tag từng lượt (s79/s80b) — không dùng dòng log driver
    (bài học S3 §4). Driver cũng ghi đúng tag ("s79 ... lan thu #7:
    KHONG", "s80b ... lan thu #8: KHONG").
- **Đánh giá H1–H4:** stall không tái hiện lần thứ 7 + 8 liên tiếp.
  Với **0/8 lần thử** ở đúng điều kiện s72 lần 1 (nclips≥20, dial
  [15,30] / [25,40] / [30,45], load đỉnh ~28–60, playhead ratio
  0,42–0,89), vụ kẹt 3,5 phút của s72 lần 1 càng giống sự kiện hiếm/
  khó tái hiện. **Giữ mức ưu tiên thấp** — không tích mẫu mù thêm
  bằng lượt dài kiểu này nữa (như R3 §4, S3 §4).

## §5. Dị thường — tải dao động hai chế độ + dial ĐẠT nhờ tải sibling + load1 mean không đại diện

- **s79 tải hai đỉnh, dao động theo quý (mạnh nhất từ trước tới
  nay):** probe loadSamples (n=179): mean 26,98 nhưng phân bố
  [0,5): 25,7% / [5,12): 14,0% / [12,20): 9,5% / [20,25): 3,9% /
  [25,40): 10,1% / [40,99): 36,9% — **~40% mẫu <12 và ~37% mẫu
  >40**, gần như không có mẫu ở giữa. Theo quý tải: Q1 mean 45,64
  (trung vị 51,89) / Q2 mean 5,54 (trung vị 3,98) / Q3 mean 48,63
  (trung vị 51,91) / Q4 mean 8,52 (trung vị 5,80) — tải NHẢY giữa
  hai chế độ ~50 và ~6 theo từng quý (dao động có chu kỳ ~200 s).
  Mean 26,98 rơi vào vùng thưa mẫu (chỉ 3,9% mẫu ở [20,25)). So
  với s78b (51% <12, 27% >40; quý 7,81 / 33,79 / 20,60 / 22,06):
  s79 dao động MẠNH HƠN (biên độ quý 5,5↔48,6 so với 7,8↔33,8).
- **Cơ chế (diễn giải, có bằng chứng):** như R3 §5 / S3 §5
  (throttle cgroup): khi hog vượt quota CPU của cell (~1,5 CPU),
  task bị throttle không còn counted là runnable nên load1 đọc thấp
  dù hàng đợi vẫn đầy (threadsR ~63). s79 cho thấy thêm: load1
  KHÔNG chỉ sụp rồi ở yên mức thấp mà DAO ĐỘNG giữa hai trạng thái
  (throttle / không throttle) theo từng đợt ~200 s — có thể do các
  luồng sibling đợt 117 (T1/T6/T9…) bật/tắt tải nền làm tổng nhu cầu
  CPU của cell vượt/rớt khỏi quota theo thời gian. Bằng chứng phụ:
  Q1/Q3 tải cao ↔ Q2/Q4 tải thấp xen kẽ đều; threadsR mean 62,9
  (driver sampler 65,4) — hàng đợi vẫn đầy cả lúc load1 đọc ~5.
  **Caveat:** diễn giải throttle + tải sibling là suy luận từ số đo
  (load1 + threadsR + phân bố theo quý), không phải đo trực tiếp
  cgroup cpu.stat hay scheduler. Ghi rõ để luồng sau kiểm chứng nếu
  cần — không dùng diễn giải này để phân loại lượt (phân loại vẫn
  theo offset §0 và sampled mean load1 như prereg).
- **s80b: dial ĐẠT nhờ tải sibling, phát sụp vì sibling rút
  (mới, quan trọng):** dial s80b ĐẠT 10:10:04Z với load1 38,26
  nhưng chỉ **24 hog** (trần 64 chưa tới; ramp: 16 → 24 vì load1
  đã vào [30,45] từ sớm nhờ tải nền sibling cao — load1 lúc bắt
  đầu phát 35,20, threadsR 32). Trong lúc phát, tải sibling rút:
  load1 rơi 0,82 lúc 10:14:34Z (24 hog vẫn sống) rồi dao động
  0,46–28,08; sampled mean chỉ **12,03** (median 9,86, max 28,08,
  0% mẫu >40; quý tải 8,66 / 15,55 / 14,18 / 9,65 — dao động nhẹ
  hơn s79, không có đỉnh >40). **Hệ quả:** dial ĐẠT không đảm bảo
  tải trong lúc phát — dải dial [30,45] đo tải TỔNG (hog T3 +
  sibling), còn sampled mean trong lúc phát mới là tải probe thực
  sự chịu. Cần gạt hog của T3 (24 hog) KHÔNG đủ để giữ tải cao khi
  sibling rút. Đây là giới hạn của luật dial hiện tại: dial đo lúc
  bắt đầu, không khóa được tải trong 15 phút phát. Ghi rõ để parent
  quyết (vd: dial lại giữa lượt? hog dự phòng? — T3 KHÔNG tự đổi
  luật).
- **Dial s79/s80 cũng sụp rồi hồi (tái hiện):** s79: load1 25,45
  lúc bắt đầu dial → sụp 2,15 (160 s) → 0,50 (270 s) → hồi 13,78
  (290 s) → ĐẠT 31,61 (344 s). s80: 33,43 (10 s, từ chối vì
  hog-runtime <90 s) → sụp 0,73 (270 s) → hồi 30,96 (360 s) →
  ĐẠT 39,24 (387 s). Mẫu chung: load1 ì/sụp 150–300 s rồi nhảy vọt
  lên dải trong ~30–60 s cuối. Luật dial mới (600 s + hog ≥90 s)
  là điều kiện cần để bắt được cú nhảy này (xem §7).
- **loadAtPlay là số gây hiểu lầm (nhắc lại R3 §11.3, S3 §5):**
  s79 loadAtPlay = 44,07; s80b loadAtPlay = 27,83 (mẫu đơn lúc bắt
  đầu phát) — không dùng; chỉ sampled mean trong lúc phát đáng tin
  (s79: 26,98; s80b: 12,03).

## §6. Metric thay thế + dụng cụ (mô tả, không phân loại)

- **offset100 (CHỈ MÔ TẢ, như prereg):** s79 n=1345, trung vị +2,
  mean +1,80, 27,3% trong ±1, 7,2% ≤ −5 (dải −61..+27); s80b
  n=1187, trung vị +3, mean +3,11, 22,9% trong ±1, 2,5% ≤ −5 (dải
  −41..+35); dry-t3b n=88, trung vị +1, 67,0% trong ±1, 0% ≤ −5;
  dry-t3 n=32, trung vị 0, 18,8% trong ±1, 28,1% ≤ −5. offset100
  của cả hai lượt dài đều tệ (nền nhiễu ±3 trên control yên + suy
  thoái theo đói tick — như M7/N5/P5/Q3/R3/S3). Vẫn không dùng để
  phân loại.
- **Caps coverage vẫn sụp sau clip c2 (lần thứ 5 liên tiếp ở lượt
  dài):** s79 chỉ có 106 caps, mà 90/106 thuộc clip c2 (c0: 6, c1:
  10, c2: 90); s80b 102 caps (c0: 5, c1: 7, c2: 90) — Y HỆT
  s76/s77/s77c/s78b. Nhưng dry-t3b caps 229 phân bố đều c0/c1/c2
  (74/81/74) và dry-t3 caps 46 đều (16/13/17). **Kết luận củng cố
  (R3 §6/§11.6, S3 §6):** sampler chết sau c2 chỉ xảy ra ở lượt
  DÀI (nclips lớn), không xảy ra ở lượt khô ngắn — sampler dừng sau
  ~9 s media vì lý do khác (nghi cap buffer đầy / sampler chỉ bám
  3 clip đầu), không phải bằng chứng đói main-thread. Đừng dùng
  caps-chết làm bằng chứng đói nữa (xem §10 mục 4).
- **threads-R:** dry-t3b 2,2 / s79 62,9 (driver sampler 65,4) /
  s80b 30,9 (driver sampler 32,3) — bám theo số hog đang sống +
  sibling, không bám CPU thật (như M7/N5/P5/Q3/R3/S3). Không đề xuất
  thay load1, nhưng là chỉ số phụ bắt buộc kèm theo khi báo tải
  (xem §5).
- **Tick rate:** 26,23/s (dry-t3b) / 1,98/s (s79) / 1,96/s (s80b) —
  PHẲNG theo thời gian (s79: nửa đầu 1,76/s → nửa sau 2,19/s; s80b:
  2,04/s → 1,88/s). Capture rate: 23,91/s (dry-t3b) / 1,64/s (s79)
  / 1,72/s (s80b) — cùng bậc với tickRate, như kỳ vọng (mỗi tick
  ~1 capture).
- **Playhead ratio:** 0,845 (s79) / 0,867 (s80b) — media clock chạy
  ~85–87% thời gian thực dưới tải (so với 0,838 của s78b 56 hog,
  0,894 của s77c 40 hog).
- **Gate v2 (mô tả):** ĐẠT ở s79 + s80b, KHÔNG ĐẠT ở dry-t3b (đúng
  vì dry không tải; dry-t3 ĐẠT vì chạy dưới tải sibling — minh họa
  gate v2 đo tải chứ không đo lượt). Đạt gate v2 không suy ra
  presented GIỮ (như M7/N5/P5/Q3/R3/S3).
- **Element chết format error: 0/163 mẫu (s79) + 0/157 mẫu (s80b)**
  — lần thứ 5 + 6 liên tiếp không có (s77 0/130, s77c 0/121, s78b
  0/163, s79 0/163, s80b 0/157; chỉ s76 có 97/97). Pattern "pool
  giữ element lỗi" của s76 là sự cố đơn lẻ của lượt đó. Hạ mức ưu
  tiên (xem §10 mục 7).
- **Dụng cụ trích kết quả (tái dùng S3):** trích cuối chia 5 chunk
  + snapshot từng phần mỗi 60 s + stuck watcher 5 s. Probe117t3 =
  copy byte của probe116s3, chỉ đổi SCRATCH/CFG_DIR (diff chỉ dòng
  đổi tên, node --check PASS). **Kết quả:** 4/4 lượt chạy trích đủ
  dữ liệu (dry-t3, dry-t3b, s79, s80b), **0 chunk lỗi**
  (extraction.errors = [] cả 4 lượt); s80 bị reboot cắt vẫn để lại
  partial + stall-watch 25 mẫu (checkpoint tăng dần đã hoạt động):

| lượt | A-blend | B-caps | D-state | E-scalars | C-px (lớn nhất) |
|---|---|---|---|---|---|
| dry-t3 | OK | OK | OK | OK | OK |
| dry-t3b | OK | OK | OK | OK | OK |
| s79 | 3967 ms | 801 ms | OK | OK | OK (3 lát) |
| s80b | 5187 ms | 973 ms | OK | OK | OK (3 lát) |
| s80 att.1 (bị cắt) | — (partial) | — | — | — | — (stall-watch 25 mẫu) |

  (Thời gian trích từng chunk của s79/s80b ngoài A/B không ghi riêng
  trong log driver — chỉ ghi "trích xong ~09:37:53Z / ~10:27:31Z";
  tổng thời gian trích ~2,5–2,7 phút kể từ khi phát xong. Ghi rõ
  thiếu sót này thay vì bịa số.)
- **Không đổi logic đo:** metric chính vẫn blendTick rVFC; sampler/
  caps/state100 giữ nguyên; diff probe117t3 vs probe116s3 chỉ gồm
  các dòng đổi tên (đã soát).
- **Analyzer:** copy analyze116s3b.py → analyze117t3.py (đổi tag
  dry-t3/s79/dry-t3b/s80b; giữ nguyên công thức offset100 đã sửa +
  tickRate + skipStale + dự báo bar (c); THÊM bảng theo quý D1 +
  capture rate — chỉ thêm báo cáo, không đổi công thức phân loại
  cũ). **1 lỗi nhỏ do T3 tự phát hiện + sửa trước khi báo cáo:**
  nhánh else của Bar (a) in "khong co luot blur hop le nao" ngay
  cả khi có lượt hợp lệ toàn TRUNG-GIAN (s79 + s80b) — đã sửa thành
  câu phân biệt hai trường hợp, chạy lại — JSON đồng nhất (số liệu
  không đổi), chỉ câu Bar (a) đổi cho đúng. Analyzer stall s79/s80b
  mới, chỉ đọc dữ liệu thô (copy analyze116s3-s78bstall.py, đổi
  tag; đã sửa tên file output bị sót "s78stall" do sed đổi tên —
  bài học S3 §6).
- **Driver:** driver117t3.sh (dựa trên driver116s3b.sh; đổi tag
  dry-t3/s79/s80; trần hog theo lượt 56/64; hạn bắt đầu lượt dài
  mới 11:30Z) + driver117t3b.sh (chạy lại s80b: chờ T2 DONE +
  BASE_MD5 linh hoạt thay vì hard-code 03bf029f; dry-t3b + s80b).
  Driver117t3.sh gốc chết theo reboot #53 (không chạy được trap
  cleanup — hog-count.txt kẹt 64, đã reset tay). Driver117t3b.sh
  chạy dry-t3b PASS + s80b exit=0, nhả lock sạch.

## §7. Luật dial MỚI — ĐẠT 3/3 lượt đợt này (lũy kế 5/5)

- **Luật đã đăng ký trước (prereg-t3 §2, giữ nguyên S3):** cửa sổ
  dial tối đa 600 s; hog phải chạy ≥90 s trước khi được tuyên bố
  ĐẠT; ĐẠT chỉ khi đủ cả hai: (a) hog-runtime ≥90 s, VÀ (b) 2 mẫu
  load1 liên tiếp (cách nhau 10 s) đều trong dải mục tiêu. Ramp: bắt
  đầu 16 hog, ±8 mỗi 10 s, trần theo lượt (56 s79 / 64 s80+s80b),
  sàn 8.
- **s79 (dial [25,40]):** load1 ì/sụp 2,15 (160 s) → 0,50 (270 s)
  → hồi 13,78 (290 s) → **31,61 lúc acquire 09:19:46Z**
  (hog-runtime 344 s). 0 lần từ chối ĐẠT sớm (load1 chưa vào dải
  trước 90 s). Với luật cũ (cửa sổ 300 s) lượt này đã KHÔNG ĐẠT.
- **s80 (dial [30,45]):** load1 33,43 (10 s, 16 hog — TRONG DẢI
  NHƯNG hog-runtime 10 s < 90 s → TỪ CHỐI tuyên bố ĐẠT, đúng luật)
  → 30,91 (20 s — từ chối lần 2) → sụp 0,73 (270 s) → hồi 30,96
  (360 s — mẫu 1/2) → **39,24 (370 s — mẫu 2/2 → ĐẠT 09:44:49Z)**.
  Luật ≥90 s đã từ chối ĐẠT đúng 2 lần trong lượt này.
- **s80b (dial [30,45]):** ramp mượt nhờ tải sibling: 4,88 (10 s)
  → 8,35 → 12,66 → ... → **38,26 lúc acquire 10:10:04Z**
  (hog-runtime 158 s, chỉ 24 hog). 2 lần từ chối ĐẠT sớm (load1
  vào dải trước 90 s — ghi từ log driver117t3b; xem caveat §5:
  dial ĐẠT nhờ tải sibling, không phải nhờ hog T3).
- **Tổng đợt này: 4 lần từ chối ĐẠT sớm** (s80: 2, s80b: 2; s79:
  0) + **3/3 ĐẠT**. Lũy kế luật mới: **5/5** (S3 2/2 + T3 3/3).
  Load1 đáp ứng chậm 150–390 s đã tái hiện ở cả 3 lượt (s79 ~290 s,
  s80 ~360 s, s80b ~150 s nhờ sibling). **Giữ luật này làm luật
  đứng cho lượt tải cao sau** (đề xuất vào LIMITS gộp đợt 117 —
  như S3 §10 mục 3 đã đề xuất, nay có thêm 3/3 bằng chứng).
- **Hạn chế mới của luật (ghi rõ, không tự đổi luật):** dial ĐẠT
  không khóa được tải trong lúc phát (s80b: dial 38,26 → sampled
  mean 12,03). Luật hiện tại không có cơ chế giữ tải (vd: dial lại
  giữa lượt, hoặc hog tối thiểu). Đợt sau cần parent quyết có bổ
  sung cơ chế này không (xem §10 mục 8).

## §8. Lock v2 — dùng thật cho lượt dài + lượt chạy lại: 0 TIMEOUT cho T3; waiter chờ 632 s sống

- **Cấu hình:** `apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600` (mặc định mới S4), `VITE_LOCK_POLL_S=5`,
  mỗi attempt giữ lock đúng lúc chạy probe qua `run-attempt
  <thread> <port> 900 30 long -- <cmd>` (acquire → chạy đúng 1
  attempt → nhả trong trap). KHÔNG dùng lock v1 trong luồng này
  (migration nguyên tử, v2-only).
- **Kết quả (từ vite-lock-v2.log, chỉ thread t3-round117):**

| attempt | ticket | acquire | wait | hold | nhả |
|---|---|---|---|---|---|
| dry-t3 retry | normal | 09:12:51Z | **632 s** | 70 s | sạch |
| s79 | long (0-…) | 09:19:47Z | 0 s | 1089 s | sạch |
| s80 | long (0-…) | 09:44:50Z | 1 s | — (chết theo reboot #53, không có RELEASED) | — |
| dry-t3b | normal | 10:06:45Z | 0 s | 40 s | sạch |
| s80b | long (0-…) | 10:10:06Z | 1 s | 1047 s | sạch |

  **0 lần TIMEOUT, 0 lần DEFERRED do lock** cho T3 đợt này (dry
  lần 1 DEFERRED là do `wait_vite_free` chờ vite bận 600 s — T6
  rồi T2 giữ — không phải lock timeout; xem §0). Tổng 6 TIMEOUT
  trong vite-lock-v2.log là lũy kế toàn đợt (gồm test cố ý của T4
  và các luồng khác), không phải của T3.
- **Waiter chờ 632 s sống (ghi cho T4 — điều kiện #3 đổi spec):**
  ticket dry-t3 (prio normal, tạo 09:02:19Z) xếp sau t4-hold (giữ
  từ 09:02:17Z, giữ đúng 600 s — test hold của T4) + t4-wb, rồi
  ACQUIRED 09:12:51Z sau **632 s chờ**. Đây là waiter thường đầu
  tiên chờ >600 s (vượt ngưỡng aging 600 s) mà vẫn acquire thành
  công trong 900 s timeout — bằng chứng sống cho điều kiện #3 của
  S4 §5 (cần ít nhất 1 waiter chờ >600 s). T3 chỉ ghi số đo; quyết
  đổi spec thuộc về parent/T4.
- **Stale-lock recovery sau reboot ĐÃ HOẠT ĐỘNG (lần 2):** lock dir
  của s80 còn lại sau reboot #53 (owner pid 245244 chết, boot đổi)
  được lần acquire của T2 (09:48:50Z) dọn qua đường tắt boot-đổi,
  không chờ đủ STALE_MIN — log T2 ghi "stale: owner pid 245244
  chết + không vite trên cổng 5590 + curl 000 + boot đổi (tuổi
  240s) — XÓA lock stale và thử lại". (Lần 1: S3 §8, attempt 1 →
  attempt 2 sau reboot #49.)
- **Caveat nhỏ:** 2 dòng "KHÔNG NHẢ — owner hiện tại là '?'" ở
  cuối log driver117t3b là cleanup trap của driver gọi release sau
  khi run-attempt đã nhả — không phải lỗi (lock đã trống, không còn
  owner; S3 §8 ghi cùng hiện tượng). Cooldown: 21 file trong
  QUEUEDIR lúc kiểm tra cuối — chỉ là file marker, không chặn ai.
- **Caveat driver:** driver117t3.sh gốc chết theo reboot #53 nên
  trap cleanup KHÔNG chạy (hog-count.txt kẹt 64 — đã reset tay sau
  khi kiểm sạch). Đây là hạn chế đã biết của trap EXIT khi máy
  reboot (không phải lỗi lock).

## §9. Kiểm chứng (cây cuối 03bf029f — không đổi so với prereg)

- `tsc --noEmit` (apps/web): **KHÔNG chạy lại trong luồng này** —
  cây cuối 03bf029f byte-identical với cây S10 đã chạy tsc 0 + vite
  build PASS + suite 27/27 (gộp muộn đợt 116, 22:48–22:52Z 14/11,
  boot #49) và T3 không sửa production (T2 sửa rồi revert về đúng
  md5 này — md5 đầy đủ `03bf029f09b8890b285eacc10a02172b` kiểm lại
  sau revert, khớp prereg). Chạy tsc lúc 10:3xZ sẽ tốn CPU trong
  lúc các luồng sibling khác còn chạy và không thêm thông tin (md5
  khớp = cùng cây). Ghi rõ thiếu sót này thay vì giấu — parent/T10
  có thể chạy lại tsc trên cây gộp đợt 117.
- `vite build`: **KHÔNG chạy trong luồng này** (cùng lý do; S10 đã
  chạy vite build PASS trên cùng cây 03bf029f).
- Không sửa production trong luồng này (T3); preview.tsx md5 đầy
  đủ 03bf029f trước = sau cả 4 lượt chạy đủ (dry-t3, dry-t3b, s79,
  s80b); s80 phát trên af4d5753 (H3e) rồi bị reboot cắt — đã loại
  hoàn toàn, không tính.
- Probe copy `probe117t3-frame-parity.mjs`: node --check PASS trước
  lượt đầu; diff với probe116s3 chỉ gồm các dòng đổi tên.
- Analyzer `analyze117t3.py`: tính lại toàn bộ từ results json
  thô; bảng §1 khớp output analyzer (đếm lại từ đĩa, không tin mù
  log driver). **Kiểm chứng độc lập:** (i) số tick thiếu vạch 80%
  tính lại trực tiếp từ results json thô (s79 thiếu 4,6 tick;
  s80b thiếu 264,6 tick — xem §2); (ii) phân bố tải hai đỉnh +
  quý tải tính lại trực tiếp từ `loadSamples` thô (s79: mean 26,98
  / median 20,17, khớp summary dict; quý tải Q1 45,64 / Q2 5,54 /
  Q3 48,63 / Q4 8,52 — xem §5); (iii) offset hist tính lại từ
  `blendTick` thô (s80b: trong [0,+2] 68,8% vs trong ±1 64,4% —
  xem §2); (iv) s80 partial: stall-watch 25 mẫu, ph cuối 110,7667
  (khớp dòng playhead cuối driver).
- Stall: kiểm chứng độc lập từ stall-watch.jsonl thô (§4) — khớp
  kết luận watcher (0 episode cả hai lượt). Lưu ý nguồn của kết
  luận 0/8 (§4).
- Lock đã nhả sạch sau s80b (kiểm tra lock TRỐNG 10:27:39Z);
  không vite mồ côi (pgrep "vite" chỉ trúng shell của T6 chứa chuỗi
  "vcut-vite-lock-v2.sh" trong lệnh — đã kiểm bằng ps, không phải
  tiến trình vite); hog-count.txt = 0; cờ hogs-off 10:27:39Z (boot
  #53).

## §10. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng).** GIỮ vững: **19,63**
   (s77c). Vùng chuyển tiếp GIỮ→TRUNG GIAN: **(21,07, 26,98]**.
   Biên 21,07 là GIỮ yếu (80,9%, một lượt duy nhất — không được xác
   nhận; lượt "xác nhận" s79 ở tải cao hơn đã TRUNG GIAN). Cần
   parent quyết: (i) trục đo cho lượt tải dao động mạnh — giữ
   sampled MEAN hay chuyển sang trung vị/phân vị (s80b thấp nhất
   trên mọi trục mà offset tệ nhất — đổi trục không cứu được liều–
   đáp ứng, xem §2); (ii) có chấp nhận "vùng chuyển tiếp rộng +
   nhiễu lớn giữa các lượt" thay cho một điểm gãy sắc không, hay
   cần thêm lượt ở cùng mức tải để tách nhiễu (vd: lặp lại s79 đúng
   56 hog/dial [25,40] thêm 1–2 lượt xem %±1 dao động bao nhiêu ở
   cùng cấu hình)? (iii) Chuẩn tải vẫn là hog nice -n 19 (quyết
   15/11) — dãy không-nice vẫn dừng ở 9,59. Đợt sau: nếu còn đẩy
   tải cao hơn thì cần cơ chế GIỮ tải trong lúc phát (xem mục 8),
   vì dial ĐẠT không khóa được tải (s80b: dial 38,26 → mean 12,03).
2. **Chỉ số đói pump (bar (c)): TUYÊN BỐ KHÔNG ÁP DỤNG ĐƯỢC cho chế
   độ hog nice -n 19 (xám 6 lần liên tiếp: s77/s77c/s78b/s79/s80b +
   s76 thiếu tick). DỪNG kiểm chứng nó ở chế độ này** (quyết theo
   prereg §3 D-quyết + S3 §10 mục 2). Nếu đợt sau muốn thử lại thì
   phải đăng ký bar MỚI (vd: chỉ tickRate, ngưỡng trong [1,5]) —
   KHÔNG chỉnh ngưỡng hậu kiểm trên dữ liệu này. Bar (c) còn nguyên
   giá trị ở chế độ không-nice (4 lượt tham chiếu khớp hướng) và
   lượt yên (dry-t3b khớp) — nhưng đó là việc của đợt sau với
   prereg mới. Nuance tickRate co-move yếu ở s79 (xem §3 D1) ghi
   lại để đợt sau tham khảo, không phải kết luận.
3. **Luật dial mới (600 s + hog ≥90 s) ĐẠT 5/5 lũy kế — đề xuất
   thành luật đứng cho lượt tải cao sau** (xem §7). Không còn nợ
   kiểm chứng luật này; chỉ cần giữ nguyên trong prereg các lượt
   sau.
4. **Sampler chết sau clip c2 — cần luồng khác kiểm tra (nhắc lại R3
   §10 mục 4, S3 §10 mục 4):** s79 + s80b lần thứ 5 + 6 liên tiếp
   (c2 chiếm 90/106 và 90/102 caps). Đừng dùng caps-chết làm bằng
   chứng đói nữa.
5. **Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN 0/8 lần thử thực chạy.**
   Giữ mức ưu tiên thấp (xem §4). Nếu còn theo đuổi thì cần đổi cách
   kích hoạt (tái hiện đúng điều kiện s72 lần 1: hog không-nice +
   RAM thấp + lượt dài), không tích mẫu mù thêm bằng lượt nice-hog.
   Ghi thêm: 2 lượt T3 cùng chậm ở ph ~255–296 (clip c85–c97) —
   đối chiếu đợt sau xem có phải vùng clip "xấu" ổn định không.
6. **Freeze ~12 s ở ph 44,77 trong s76 (Phần A R3):** s79 không có
   freeze nào ≥10 s (min advance 10 s = 4,23 s; 0 chuỗi mẫu đứng
   yên); s80b cũng không (min advance 10 s = 5,73 s; 0 chuỗi đứng
   yên). Không có dữ liệu mới cho cơ chế freeze s76.
7. **Element chết format error — pattern KHÔNG lặp lại (6 lượt liên
   tiếp không có):** s76 97/97 mẫu vs s77 0/130, s77c 0/121, s78b
   0/163, s79 0/163, s80b 0/157. "Pool giữ element lỗi" là sự cố đơn
   lẻ của lượt s76. Hạ mức ưu tiên; không kết luận thêm.
8. **Dial ĐẠT không khóa được tải trong lúc phát (mới, từ s80b §5):**
   dial [30,45] ĐẠT 38,26 nhờ tải sibling → sampled mean trong lúc
   phát chỉ 12,03 khi sibling rút. Đợt sau cần parent quyết: có bổ
   sung cơ chế giữ tải không (vd: dial lại giữa lượt, hog tối thiểu
   theo lượt, hoặc phát ngay sau dial không chờ vite lâu)? T3 KHÔNG
   tự đổi luật. Liên quan: **kẽ hở phối hợp dial–sửa cây (§0):**
   luồng sửa cây chỉ nhìn lock + cờ, không thấy dial (ngoài lock);
   luồng đo dài nên ghi cờ "đang dial" hoặc luồng sửa cây phải hỏi
   trực tiếp trước khi apply — đề xuất vào LIMITS gộp đợt 117.
9. **load1 không đo được tải thật khi hog vượt CPU quota (nhắc lại
   Q3 §5, tái hiện ở s79 §5 + s80b §5):** load1 sụp về 0,46–0,83
   trong khi hog sống + threadsR ~30–63; dao động hai chế độ
   (s79: quý ~50 ↔ ~6). Đợt sau báo tải kèm threadsR + tick rate +
   skip-stale + PHÂN BỐ tải (mean/median/phân vị/quý), đừng tin
   "dial ĐẠT" hay "load1 sụt" theo nghĩa đen trong cell này.
10. **Reboot #53 (09:47:08Z, gap 1h17'56") — ghi cho T7 đối chiếu:**
    mù #35 đã mở, nay chứa cả #49, #50, #51, #52 và #53; probe #36
    ở đợt 117 đối chiếu từ mốc này. Tần suất reboot ~1–2 h/lượt —
    lượt dài ~35 phút có nguy cơ bị cắt ~30%; checkpoint tăng dần
    của probe đã cứu dữ liệu thô s80 khỏi mất hoàn toàn (partial +
    stall-watch 25 mẫu).
11. **T2 H3e verdict BỎ — cây đã revert về 03bf029f, patch giữ dạng
    h3e-fix.patch + apply-h3e.py (xem cờ round117-tree cuối).** Nợ
    zombie H3e đóng theo hướng BỎ (xem LIMITS T2 đợt 117). Không còn
    nợ T3 với T2.
12. Các nợ ngoài phạm vi T3 (giữ nguyên từ LIMITS gộp đợt 116 §10):
    E4 (T1 đợt 117 đang tái hiện), zombie hướng sửa mới (T2 verdict
    BỎ H3e), lock v2 3 điều kiện (T4 đợt 117 đang làm — waiter
    632 s của T3 ghi ở §8), mù #35 + probe #36 (T7), B-Q8-1 hướng
    khác (T9), G1 deinterlace (chờ user quyết), mù #22/#28/#29/#30/
    #31 (chờ user quyết), birefnet (CẤM thử lại khi RAM chưa đổi),
    TTS 39 (CẤM kiểm lại), ci-security.yml 403 (chờ user), release
    gate giữ nguyên.

---

## File đổi/thêm (đợt 117 T3)

- `apps/web/scripts/probe117t3-frame-parity.mjs` — probe copy
  probe116s3, chỉ đổi SCRATCH/CFG_DIR (diff chỉ dòng đổi tên;
  node --check PASS; **48.898 byte > 37.768 — ghi chú rõ cho lúc push**).
- `docs/PHASE9_ROUND117_T3_LOADBREAK_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round117-t3/` (không stage): prereg-t3.md (gồm §12 +
  §13 bổ sung),
  driver117t3.sh + driver117t3.log + runner117t3.sh +
  runner117t3.out (driver gốc — dry-t3 + s79 + s80 bị reboot #53
  cắt; chết theo máy),
  driver117t3b.sh + driver117t3b.log + runner117t3.sh +
  runner117t3b.out (chạy lại — dry-t3b PASS + s80b SẠCH, exit=0),
  analyze117t3.py + analyze117t3.txt/.json (dry-t3 + s79 + dry-t3b
  + s80b; đã vá nhánh else Bar (a) — xem §6),
  analyze117t3-s79stall.py + analyze117t3-s79stall.txt/.json
  (stall s79; 0 episode),
  analyze117t3-s80bstall.py + analyze117t3-s80bstall.txt/.json
  (stall s80b; 0 episode),
  analyze117t3-s80stall.py (copy chưa dùng — s80 bị reboot cắt,
  không có results json để phân loại; chỉ dùng stall-watch.jsonl
  thô làm audit),
  hog-count.txt (= 0), hog-load-chr-code-blur-s79-attempt1.txt +
  hog-load-chr-code-blur-s80-attempt1.txt +
  hog-load-chr-code-blur-s80b-attempt1.txt (sampler driver 5 s; dry
  không có file sampler vì không hog), status.txt, 5 thư mục lượt
  probe dry-t3/dry-t3b/s79/s80/s80b (mỗi thư mục có
  frame-parity-results.json + part files + frame-parity-partial.json +
  stall-watch.jsonl + .log + vite-attempt1.log — trừ s80 chỉ có
  partial + stall-watch vì bị reboot cắt; s79/s80b không có
  stall-events.json vì 0 episode; dry-t3 40 tick, dry-t3b 249 tick,
  s79 1757 tick, s80b 1697 tick).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).
