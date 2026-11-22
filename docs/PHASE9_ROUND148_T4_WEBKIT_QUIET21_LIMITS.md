# PHASE9_ROUND148_T4_WEBKIT_QUIET21_LIMITS.md

**Đợt:** 148. **Luồng:** T4 — sửa probe kẹt + đo lượt yên WebKit #21
trên boot mới. **Ngày:** 19/11/2026.
**Boot đo:** d8a11644 (btime 17:27:53Z /proc/stat, epoch 1795109273;
`/proc/1` = 17:28:08Z — chênh 15 s đã hòa giải ở F-148-T2-1/8: độ trễ
init 15,21 s, không phải nghịch lý đồng hồ; xem F-148-T4-9).
Reboot #35 (T2-148 xác nhận trong build-loop log; reboot xảy ra
trong lúc T10-147 đóng sổ — claim "0 reboot trong phiên" đợt 147
đã sai, xem log T2).
**Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở poller, lúc
start/end cả 3 attempt, lúc đóng — không đổi). **Trạng thái:
#21 ĐÓNG — LƯỢT HỢP LỆ ĐẦU TIÊN SAU 2 ĐỢT (attempt3, 20/20, lớp B
ĐẠT 5/5, tickCost median đúng 60,0 ms). Probe đã sửa: 0 kẹt trong
3/3 attempt thật (so với 2/2 kẹt đợt 147).**

## 0. Verdict tổng

- **Attempt1-d8a11644 (17:59:48–18:03:21Z): 20/20 pass, tickCost
  median 66,0 ms (n=470; p90 94,0; max 205; min 31; post-flip 67,0)
  — KHÔNG KẸT, nhưng lớp B VI PHẠM (chỉ B2: load1_max=4,29 trong cửa
  sổ 14 s lúc khởi động).** Theo luật đứng: lượt nhiễm tải, KHÔNG
  dùng verdict; poller RETRY 1→2. (c2)=0 seq. **Không cộng dồn.**
- **Attempt2-d8a11644 (18:04:20–18:07:53Z): 20/20 pass, tickCost
  median 65,5 ms (n=506; p90 89,5; max 163; min 30; post-flip 66,0),
  lớp B ĐẠT 5/5 — NHƯNG CỔNG tickCost LOẠI live LẦN ĐẦU TIÊN
  (65,5 > 60).** Poller RETRY 2→3. (c2)=0 seq. **Không cộng dồn.**
- **Attempt3-d8a11644 (18:08:37–18:12:08Z): 20/20 pass, tickCost
  median 60,0 ms (n=525; p90 85,0; max 117; min 30; post-flip 60,0),
  lớp B ĐẠT 5/5 — LUOT HOP LE, poller thoát exit 0.** (c2)=1 seq
  (219, lag +1f), coverage 1/1, P3' 1/1 ĐẠT, P1 YẾU, P3-A1 YẾU,
  P7 ĐÚNG, F6' ĐÓNG (77 tick post-flip, 100%). **#21 ĐÓNG.**
- **Median tái tính độc lập (statistics.median + np.median trên
  trường `total` của JSON): A1 66,0000; A2 65,5000; A3 60,0000 —
  khớp đúng analyzer, KHÔNG phải làm tròn hiển thị.** A3: 269/525
  tick ≤60, 256 >60, 9 tick đúng =60 — median là 60 thật, không
  phải 59,95–60,04 làm tròn lên.
- **Caveat trung thực (đọc kỹ): median A3 = 60,0 ĐÚNG NGƯỠNG —
  biên = 0.** Boot d8a11644 chạy ~65 ms ở A1/A2; A3 nhanh hơn ~5 ms
  mà load/RAM không giải thích được (r ≈ 0 cả hai). #21 đóng theo
  luật (median ≤60) nhưng là lượt sát nút tuyệt đối — xem §10 (c).
- **Số cộng dồn (c2) — 18 lượt hợp lệ:** P1 52/52, P2 43/43,
  P3-A1 47/52, P3' 24/24, P7 38/38. Điều tra (c2) vẫn ĐÓNG,
  verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng nguyên.
- **Thứ tự O8:** O8 của T8 chạy TRƯỚC attempt của T4 trong đợt này
  (theo brief 148): 17:41:02–17:45:04Z, WebKit 21/21 ×2 attempt +
  Chromium 21/21, exit 0 — T4 kiểm độc lập từ JSON gốc (xem §2).
  Khác chuẩn "O8 sau cờ T4" trong MEMORY (quyết 147) — xem §10 (f).
- **Ngân sách dùng 3/3; poller thoát exit 0 lúc 18:12:45Z.**
  0 reboot trong phiên. Không process T4 nào còn sống lúc đóng
  (vite.lock đã nhả, xem §8).

## 1. Vá probe TRƯỚC khi đo — sửa F-147-T4-1 (kẹt) + F-147-T4-2 (tee) + F-147-T4-3 (nhãn)

### 1.1 Điểm kẹt thật (tinh chỉnh từ F-147-T4-1)

Đợt 147 kết luận "probe kẹt sau writePartial timeout" nhưng chưa
chỉ đúng dòng kẹt. Đối chiếu lại 2 lần kẹt đợt 147 với code:

- Cả 2 lần kẹt đều dừng ngay sau một pass thuộc danh sách re-arm
  `C2_REARM_AFTER_PASSES = [4, 7, 9, 11, 13, 15, 17]` (A1 sau pass
  17, A2 sau pass 11) — và ngay sau một writePartial mà cả 3 fetch
  đều timeout 30 s (trang đã wedged).
- Trong khối re-arm, sau writePartial, code chạy HAI `await pwEval`
  THÔ (bật/tắt cờ `window.__vcutC2DrawLog`) — KHÔNG timeout, nằm
  NGOÀI race 120 s/pass. Trang đã wedged thì evaluate không bao giờ
  trả lời → probe đứng vĩnh viễn. Đây là điểm kẹt, không phải
  writePartial (các fetch trong writePartial ĐÃ có pwEvalTimeout
  30 s từ đợt 121 — đó là lý do partial JSON vẫn được ghi rồi mới kẹt).
- Cùng họ: FLIP sau pass 5 cũng là `await pwEval` thô (chỉ có
  `.catch`, không timeout — evaluate treo thì catch không bao giờ chạy).

### 1.2 Các vá đã làm (file `probe121t3-ghost-k7.webkit.mjs`, md5 `4291e539ce1d330bd35ec7b3b6764f05`)

1. **Timeout wall-clock TOÀN ATTEMPT (mới):** cờ
   `--attempt-wall-timeout-ms`, mặc định **1.200.000 ms = 20 phút**
   (sàn 5.000 ms để test ép nhánh). Watchdog `setTimeout` đặt từ
   lúc node khởi động, KHÔNG unref (phải nổ ngay cả khi event loop
   chỉ còn promise treo); khi nổ: log `WALL-TIMEOUT` + `process.exit(2)`
   (partial JSON trên đĩa giữ nguyên — đã ghi sau mỗi pass từ đợt 116).
   **Lý do chọn 20 phút:** attempt khỏe ~3–6 phút (20 pass × ~3,3 s
   + vite ~30 s + fetch cuối + phân tích offline ~2 phút), 20 phút
   >3× khỏe, <1/5 lần kẹt 108 phút đợt 147-A1; trường hợp xấu nhất
   mọi fetch đều timeout (20 × (120 s pass-timeout + 90 s writePartial)
   = 70 phút) vẫn bị cắt ở 20 phút. `clearTimeout` ở cuối lượt khỏe
   (trước `browser.close()`).
2. **Tự thoát khi trang wedged (mới):** writePartial đánh dấu
   `pageWedged=true` khi CẢ 3 fetch đều timeout trong cùng một lần
   gọi; vòng pass kiểm cờ ngay sau `writePartial("sau pass")` và
   `process.exit(2)` — không chạy pass tiếp theo. **Lý do:** bằng
   chứng đợt 147 cho thấy sau lần 3-timeout, trang không bao giờ hồi
   (A1 kẹt ngay ở re-arm pass 17; A2 chạy thêm 3 pass rồi kẹt ở
   re-arm pass 11). Chỉ abort khi cả 3 timeout — 1–2 fetch lỗi thì
   vẫn chạy tiếp như cũ.
3. **Re-arm → pwEvalTimeout (điểm kẹt chính):** cả hai lần bật/tắt cờ
   đổi sang `pwEvalTimeout(..., 30000, "rearm-c2DrawLog-off/on")`;
   timeout thì log rõ và chạy tiếp (không abort lượt vì một lần
   bật/tắt cờ lỗi — pass tiếp theo vẫn được race 120 s bảo vệ).
   Fetch vet epoch giữa hai lần bật/tắt đã dùng pwEvalTimeout từ trước.
4. **FLIP → pwEvalTimeout:** `flip-rvfc-off`, 30 s; timeout thì
   flipWallMs=null (như cũ khi `.catch`) và lượt chạy tiếp.
5. **Còn lại (nợ — xem F-148-T4-6):** các `await pwEval` thô ở pha
   setup (y2SeqStart, vòng chờ booted, pause/sanity) vẫn chưa có
   timeout riêng — chỉ được watchdog 20 phút bảo vệ. Giữ nguyên để
   diff nhỏ, có thể review được; không sửa trong lúc đo.

### 1.3 Kiểm khói trước khi đo thật (S2/S3/S3b — chạy thật trên WebKit, sau O8)

| Test | Lệnh / tham số | Kết quả |
|---|---|---|
| S2 abort-3-timeout | inner `smoke-tc1-d8a11644 1 1` (passes=1, tctimeout=1 ms) 17:47:19–17:48:11Z | **PASS.** Pass 1 khỏe (22 khung rAF, 6.383 ms); cả 3 fetch writePartial TIMEOUT sau 1 ms → `CA 3 FETCH DEU TIMEOUT` → partial JSON 1/1 (tickCostStatus=timeout) → `PAGE-WEDGED: thoat sau pass 1` → probe exit 2, lock nhả sau 52 s. Không kẹt. |
| S3 watchdog-setup | inner `smoke-wall-d8a11644 20 30000 20000` 17:48:17–17:49:02Z | **PASS (có lưu ý).** `WALL-TIMEOUT` nổ đúng 20,0 s sau node start (17:48:37.488 → 17:48:57), exit 2, lock nhả sau 36 s. NHƯNG nổ trong pha setup (0/20 pass — setup ~18 s: WebKit launch + app boot + pause) nên chưa có partial JSON. Xem F-148-T4-4/5. |
| S3b watchdog-mid-loop | inner `smoke-wall45-d8a11644 20 30000 45000` 17:49:17–17:50:14Z | **PASS.** Nổ đúng 45 s giữa lúc đo (17:49:24.714 → 17:50:09), sau 4/20 pass; partial JSON giữ nguyên 4 pass (tickCost n=65, blendTick n=54, c2DrawLog n=128), exit 2, lock nhả sau 56 s. Pass re-arm 4 chạy qua bản vá mới không kẹt. |

- `node --check` probe OK; `bash -n` OK cả 5 script (poll-wait,
  run-attempt, inner, check-classb, wait).
- **Kết luận kiểm khói:** cả hai đường thoát mới (abort-3-timeout +
  watchdog) đều đã kích hoạt live trên trang thật trước khi đo; bản
  vá re-arm/flip đã chạy qua live ở pass re-arm 4 (S3b) và toàn bộ
  các pass re-arm 4/7/9/11/13/15/17 ở cả 3 attempt thật (§3–§5).

### 1.4 Bỏ 1 tee (F-147-T4-2) — ĐÃ SỬA XONG, kiểm bằng đếm

- Đã bỏ `| tee -a chain-t4.log` ở pipe LOCKV2 VÀ pipe check-classb
  trong `run-attempt-148.sh` (RC lấy trực tiếp, không còn
  PIPESTATUS); tee của poller thành writer duy nhất vào chain-t4.log.
- **Kiểm sau 3 attempt:** chain-t4.log có đúng **60 dòng "partial
  JSON đã ghi" = 20×3** (mỗi sự kiện 1 dòng), **3 dòng inner-end**,
  0 dòng WALL-TIMEOUT/PAGE-WEDGED trong 3 attempt thật; file
  run-webkit riêng mỗi attempt đúng 20 dòng. **F-147-T4-2 ĐÓNG.**

### 1.5 Nhãn analyzer (F-147-T4-3) — ĐÃ SỬA

- `run-attempt-148.sh` truyền `T4-148a${ATTNUM}=` theo attempt thật
  (ATTNUM trích từ TAG). File A1/A2/A3 ghi đúng `== T4-148a1:` /
  `== T4-148a2:` / `== T4-148a3:`. **F-147-T4-3 ĐÓNG.**

### 1.6 Script đã vá (đợt 148)

Copy từ đợt 147, đổi 147→148 (cờ T5 round148-t5 + dự phòng
round147-t5, hạn cắt poller 19:30Z, hạn waiter 19:35Z, nhãn analyzer
T4-148a, kiểm file vòng trước round147-*). Các script làm việc nội
bộ ở `hidden_files/round148-t4/`; bản snapshot để stage ở
`apps/web/scripts/` (xem §8 — theo brief đợt 148):

| File | md5 | Thay đổi chính |
|---|---|---|
| `probe121t3-ghost-k7.webkit.mjs` | `4291e539ce1d330bd35ec7b3b6764f05` | §1.2 (1)–(5) |
| `poll-wait-t4-148.sh` | `31921cd3956a820b0032d202e572a6d7` | Cờ T5 148, hạn 19:30Z; cổng tickCost giữ nguyên |
| `run-attempt-148.sh` | `7310c2461f4ef396de080c03fddc68a3` | Bỏ 2 tee (F-147-T4-2), nhãn T4-148a (F-147-T4-3) |
| `t4-attempt-inner.sh` | `67a3c10c39aa4d9eae0090e707e9cdc9` | Thêm $4=WALL_TIMEOUT_MS (mặc định 1200000), truyền `--attempt-wall-timeout-ms` cho probe |

Không đổi: `check-classb-t4.sh`, `wait-t4-148.sh` (chỉ đổi hạn +
đường dẫn), `vite.t4-temp.config.mjs`, `b.json`, 10 analyzer
`analyze-t4-*.py` (p1p3p7 đã có guard (c2)=0 từ đợt 146).
**Lưu ý:** p1p3p7 KHÔNG được run-attempt gọi tự động (tiền lệ từ
trước — cả đợt 147 cũng vậy); T4-148 chạy tay sau khi poller thoát
cho cả 3 attempt (xem F-148-T4-1).

## 2. Poller — 13 poll, cửa mở poll #13, 3 attempt, thoát exit 0

- **Test (POLL_TEST=1) 17:46:59Z:** 1 poll, exit 7. blockers=0
  (legacy=0), lock=khong, tree YES 530e10a7, **T5 flag PASS
  (round148-t5/POSTBOOT_PASS, boot d8a11644, pass_at 17:44:24Z,
  poll=2, dpkg 1545/221)**, postboot exit 0, RAM 2184 MB, load1 2,27
  load5 4,36 (gate A chưa đủ lúc đó), dpkg_lines=1545.
- **Poll #1–#12 (17:50:41–17:59:00Z):** load1 6,23 → 5,05 → 3,79 →
  3,63 → 2,12 → 1,60 → 1,85 → 1,67 → 1,34 → 1,08 → 0,80 (chưa đủ
  vì load5 còn ≥2); blockers=0, lock=khong, RAM 1.963–3.188 MB,
  T5 PASS suốt, tree YES, apt=0, dpkg=1545.
- **Poll #13 (17:59:45Z): CỬA MỞ:** load1=0,66 load5=1,87
  RAM=1.963 MB, gate0 T5, apt=0, dpkg=1545, cây YES — chạy attempt1.
- **Tải trong lúc chờ:** job render của luồng khác
  (`node server/render/src/render.js ... round93-u4 ... --dry-run`
  + python3 90% CPU, xem §7) làm load1 lên 6,44 lúc 17:50:26Z rồi
  hạ dần; poller chỉ chờ, không can thiệp.
- **O8 chạy TRƯỚC attempt (phối hợp qua lock + log, theo brief
  148):** T8 giữ lock 17:41:02–17:45:04Z (owner thread=t8-round148,
  port 5560), `O8 DONE 2026-11-19T17:45:04Z webkit1=0 webkit2=0
  chromium=0`. T4 kiểm độc lập từ JSON gốc: `o8-webkit/
  o8w-clicktest-report.json` **21 results, ok=true 21/21**;
  `o8-chromium/o8-clicktest-report.json` **21/21 ok=true**; log
  `o8-148t8.log` có 2 dòng "KẾT QUẢ CLICK-TEST O8 WebKit: 21/21
  pass" + 2 dòng Chromium 21/21. T4 bắt đầu poller 17:50:41Z, sau
  khi O8 đã nhả lock (không có chồng lấn).
- Poller không bao giờ chạm hạn cắt 19:30Z; thoát exit 0 lúc
  18:12:45Z (`LUOT HOP LE`).

## 3. Attempt1-d8a11644 — 20/20 pass, median 66,0 ms, B2 VI PHẠM

- **20/20 pass** (probe-start 17:59:48Z; pass 20 xong 18:01:23Z;
  inner-end 18:03:21Z probe_exit=0; run-attempt exit 18:03:25Z;
  poller finalize 18:04:08Z). tickCost median **66,0 ms** (n=470;
  post-flip 67,0; p90 94,0; max 205; min 31). tBlend gap n=370
  median 111,0. BlendTick/pass=18,6. rAF/pass median 28 (25–33).
  webkit=27,2; pageErrs=[]. FLIP wallMs=30370.
- **Per-pass:** median/pass 51,0–72,5 ms; load1 mean/pass 2,12–4,29;
  RAM mean/pass 1.093–1.462 MB (giảm dần trong 20 pass); Pearson
  median~load1 r=+0,15, median~RAM r=−0,19 (không tương quan).
- **Wallbands:** (xem file) TOÀN LUOT n=470 median=66,0;
  HAU FLIP+2000ms n=343 median=67,0.
- **Lớp B VI PHẠM — CHỈ B2:** sampler n=105, load1_max=4,29,
  RAM_min=1.083 MB, 0 mẫu <500 MB, 0 mẫu <1.024 MB; load5 cuối 1,99;
  B1/B3/B4 ĐẠT. **Đỉnh load1 4,29 chỉ trong cửa sổ 14 s
  (18:00:40–18:00:52Z, 7 mẫu 4,01–4,29, nr_running 5–9)** — trùng
  pha khởi động WebKit + app boot / đầu pass 1; ps-before/after chỉ
  liệt kê vite của chính attempt (không có process phân tích của
  luồng khác) nên nguồn burst không quy được chắc chắn (xem
  F-148-T4-3). Trong 20 pass đã đo, load1 mean/pass ≤4,29 nhưng
  median tick vẫn 66,0 — burst không giải thích được mức 66 ms
  (xem §4: A2 sạch B vẫn 65,5 ms).
- **(c2): 0 seq** (labellag không có occurrence "dang ngo that" nào;
  P3' không có seq để kiểm; lag5 (b) 0 occurrence; skiplatest=1
  nTick=62, pixel-verified 100%/100%). **Không cộng dồn** (lượt
  nhiễm tải + median vượt ngưỡng).

## 4. Attempt2-d8a11644 — 20/20 pass, median 65,5 ms, B ĐẠT 5/5, cổng tickCost LOẠI live lần đầu

- **20/20 pass** (probe-start 18:04:20Z; inner-end 18:07:53Z
  probe_exit=0; run-attempt exit 18:07:57Z; poller 18:08:25Z).
  tickCost median **65,5 ms** (n=506; post-flip 66,0; p90 89,5;
  max 163; min 30). tBlend gap n=406 median 107,0. BlendTick/pass=
  20,4. rAF/pass median 29 (25–34). webkit=27,2; pageErrs=[].
  FLIP wallMs=30219.
- **Per-pass:** median/pass 57,5–73,0 ms — KHÔNG pass nào dưới 57,5;
  load1 mean/pass 0,69–2,50; RAM mean/pass 3.002–3.780 MB; Pearson
  median~load1 r=−0,05, median~RAM r=−0,02 (không tương quan).
- **Wallbands:** TOÀN LUOT n=506 median=65,5; HAU FLIP+2000ms n=367
  median=66,0 — phẳng, không suy giảm dần.
- **Lớp B ĐẠT 5/5:** sampler n=105, load1_max=2,61, RAM_min=3.001 MB,
  0 mẫu <500 MB, 0 mẫu <1.024 MB; load5 cuối 1,72; B1/B3/B4 ĐẠT.
- **Cổng tickCost (quyết (j) đợt 146) KÍCH HOẠT LIVE LẦN ĐẦU:**
  poller đọc median 65,5 từ analyze-tickcost, so >60 → ghi
  `attempt2 ... NHUNG tickCost median=65.5ms >60 (cong F-146-T4-1) -
  luot KHONG hop le` và RETRY 2→3. Lần đầu tiên cổng từ chối một
  lượt 20/20 + B sạch — đúng như thiết kế (unit-test đợt 147 chỉ
  chứng minh nhánh logic, đây mới là lần thử lửa thật).
- **(c2): 0 seq** (như A1; skiplatest=1 nTick=66, 100%/100%).
  **Không cộng dồn.**

## 5. Attempt3-d8a11644 — 20/20 pass, median 60,0 ms, B ĐẠT 5/5 → LƯỢT HỢP LỆ, #21 ĐÓNG

- **20/20 pass** (probe-start 18:08:37Z; inner-end 18:12:08Z
  probe_exit=0; run-attempt exit 18:12:11Z; poller 18:12:45Z
  `LUOT HOP LE, thoat poller`). tickCost median **60,0 ms** (n=525;
  post-flip 60,0; p90 85,0; max 117; min 30). tBlend gap n=424
  median 105,0. BlendTick/pass=21,2. rAF/pass median 30 (26–35).
  webkit=27,2; pageErrs=[]. FLIP wallMs=30323.
- **Per-pass:** median/pass 41,0–68,0 ms; load1 mean/pass 1,46–2,63;
  RAM mean/pass 1.854–2.554 MB; Pearson median~load1 r=+0,23,
  median~RAM r=−0,14 (không tương quan).
- **Wallbands:** 0–20k median 58,0; 20–32k 60,0; 32–45k 59,0;
  45–62k 60,0; 62–70k 64,0; 70–80k 61,0 ms — phẳng quanh 60.
- **Lớp B ĐẠT 5/5:** sampler n=105, load1_max=2,63, RAM_min=1.844 MB,
  0 mẫu <500 MB, 0 mẫu <1.024 MB; load5 cuối 1,36; B1/B3/B4 ĐẠT.
- **(c2): 1 seq (219, presented 18, label 17, lag +1f)**, coverage
  1/1 (tBlend=51411, log gần nhất 51431, delta +20 ms); blendTick
  hậu-flip trong ±500 ms của log: 321/321 (100,0%).
  P3' 1/1 ĐẠT (seq 219: labelMs=50229, stall_truoc=4).
  P1 YẾU (1/1 gần run-end, p=0,2336, n=1 <3); P3-A1 YẾU (1/1,
  p=0,2844); P7 ĐÚNG (tre ≥+1f: 0 entry; đối chứng toàn bộ drawSrc
  post: 0/392). lag5 (b) 0 occurrence. F6' ĐÓNG (skippedLatest=1
  post-flip 77 tick ≥30, pixel-verified 100%/100%).
- **Cộng dồn (lượt hợp lệ):** P1 +1 → 52/52; P2 +1 (lag +1f ≥+1f,
  không âm) → 43/43; P3-A1 +1 → 47/52; P3' +1 → 24/24; P7 +1 → 38/38.

## 6. Số cộng dồn (c2) — 18 LƯỢT HỢP LỆ

- **P1 52/52, P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38** — theo
  quy ước chỉ đếm occurrence trong lượt hợp lệ; A1/A2 đợt này đều
  không hợp lệ nên không cộng (A1/A2 còn có (c2)=0 nên dù có cộng
  cũng không đổi tử số — ghi rõ để tránh nhầm).
- Ghi nhận ngoài cộng dồn: A1/A2 (c2)=0 seq, lag5 (b) 0 occurrence,
  skiplatest 62/62 + 66/66 tick không vi phạm thật — đều khớp hướng
  "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH", không dùng làm bằng chứng cộng dồn.

## 7. RAM / load trong lúc đo (brief §4 — chụp burst + đối chiếu T5/T9)

- **Burst snapshot 17:50:26Z (trước attempt, lúc load cao nhất):**
  loadavg 6,44/4,99/3,22, **nr_running=5**/470 threads; free total
  7.934 MB, used 4.554, buff/cache 2.768, avail 3.380 MB; swap đã
  dùng 331/1.023 MB. Top CPU: python3 pid 22032 90% (con của node
  render.js round93-u4 --dry-run của luồng khác — nguồn tải lúc chờ
  cửa, xem §2), hatch daemon 312 MB RSS. `used − buff/cache` =
  1.786 MB — **không có khoảng ~6,5 GB chưa giải thích như đợt 147**
  trong snapshot này (nhưng T4 chỉ lưu top-15 RSS nên không đối
  chiếu đầy đủ tổng RSS — ghi rõ giới hạn).
- **Trong 3 attempt (sampler 2 s):** A1 RAM 1.083–1.909 MB (giảm dần
  trong lượt, hồi lại sau khi attempt kết thúc — inner-end RAM
  1.407 MB, lúc đóng T4 RAM avail 2.450 MB); A2 RAM 3.001–3.928 MB;
  A3 RAM 1.844–3.178 MB. **0 mẫu <500 MB và 0 mẫu <1.024 MB trong
  cả 3 attempt (315 mẫu)** — hiện tượng RAM sập đợt 147 KHÔNG tái
  diễn trong cửa sổ đo đợt này.
- **Tải không giải thích được mức tick ~65 ms:** A2 sạch B
  (load1_max 2,61) vẫn median 65,5; A3 (load1_max 2,63) median 60,0;
  tương quan median~load1 r=−0,05/+0,15/+0,23 và median~RAM r=
  −0,02/−0,19/−0,14 qua 3 attempt — đều ~0. Mức 60–66 ms là
  baseline của boot d8a11644 (so với 51/37 ms partial trên boot
  6fb582df và 97–101 ms trên boot 98a7c93f) — dao động giữa các boot
  ~±15 ms, xem §10 (c).

## 8. Bằng chứng + files

- **LIMITS này:** `docs/PHASE9_ROUND148_T4_WEBKIT_QUIET21_LIMITS.md`.
- **Script đã vá — bản snapshot để stage (theo brief đợt 148),
  trong repo `apps/web/scripts/` (md5 khớp bản làm việc ở
  `hidden_files/round148-t4/`, xem §1.6):**
  `probe121t3-ghost-k7.webkit.mjs`,
  `poll-wait-t4-148.sh`, `run-attempt-148.sh`, `t4-attempt-inner.sh`.
  Không trùng tên với file nào đã có trong `apps/web/scripts/`
  (đã kiểm trước khi copy). Các file này là snapshot của bản
  round-148; bản làm việc trực tiếp vẫn ở `hidden_files/round148-t4/`.
  Rủi ro: file mới không được app import (chỉ là script đo/poll) nên
  không ảnh hưởng build — T10 chạy suite 27/27 sẽ xác nhận.
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-148.sh`, `run-attempt-148.sh`, `t4-attempt-inner.sh`,
  `check-classb-t4.sh`, `wait-t4-148.sh`; tái dùng từ đợt 147:
  `vite.t4-temp.config.mjs`, `b.json`, 10 analyzer `analyze-t4-*.py`.
- **Log/evidence (hidden_files/round148-t4/, không stage):**
  `poll-t4.log` (test poll + poll #1–#13 + RETRY 1→2 + RETRY 2→3 +
  LUOT HOP LE), `poll-t4.nohup.log`, `chain-t4.log` (60 dòng partial
  JSON = 20×3, 3 inner-end — HẾT trùng, xem §1.4),
  `wait-t4-148.nohup.log`, `postboot-t4-148-gate0wait-1.log`,
  `tree-md5.txt` (530e10a7),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-d8a11644.json`
  (2.606.075 / 2.723.084 / 2.842.141 B),
  `preview-b-f3-flip-webkit-t4-smoke-{tc1,wall45}-d8a11644.json`
  (68.077 / 394.754 B; smoke-wall 20 s không có JSON vì nổ trước
  pass 1 — xem §1.3),
  `classb-t4-attempt{1,2,3}-d8a11644.txt`,
  `load-mid-t4-attempt{1,2,3}-d8a11644.log` (105 mẫu mỗi attempt),
  `analyze-t4-attempt{1,2,3}-d8a11644-*.txt` (tickcost/c2coverage/
  stall/p1p3p7/labellag/lag5/skiplatest/c2drawlog/wallbands/perpass
  — p1p3p7 chạy tay sau khi poller thoát, xem F-148-T4-1),
  `ps-before/after-t4-attempt{1,2,3}-d8a11644.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-d8a11644.txt`,
  `attempt-done-attempt{1,2,3}-d8a11644` (exit=0 cả ba),
  `coverage-check-attempt{1,2,3}-d8a11644.txt` ((c2)=0, 0, 1/1),
  `run-webkit-t4-attempt{1,2,3}-d8a11644.log`,
  `run-webkit-t4-smoke-{tc1,wall,wall45}-d8a11644.log`,
  `vite-5187-t4-attempt{1,2,3}-d8a11644.log`,
  `burst-snapshot-1749Z.txt`, `marker-t4-attempt{1,2,3}-d8a11644`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 4 script
  snapshot (§8); không process T4 nào còn sống lúc đóng (poller đã
  thoát exit 0 lúc 18:12:45Z, vite.lock đã nhả, RAM avail 2.450 MB
  lúc đóng 18:15Z).
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round148-t4-quiet21.txt`
  (NUL-delimited, 5 entry — LIMITS + 4 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round148-t4.done` (18:15Z).

## 9. Sai số F-148-T4-1..9

- **F-148-T4-1 — p1p3p7 KHÔNG được run-attempt gọi tự động (tiền lệ
  từ trước, cả đợt 147 cũng vậy).** run-attempt chỉ chạy 9 analyzer
  (c2drawlog/labellag/skiplatest/lag5/tickcost/wallbands/perpass/
  c2coverage/stall); p1p3p7 lấy seqs từ labellag nên phải chạy tay
  sau. T4-148 đã chạy tay cho cả 3 attempt sau khi poller thoát
  (A1/A2 (c2)=0 → thoát sớm; A3 seq 219 → đủ P1/P3-A1/P7) — số cộng
  dồn §6 đã gồm kết quả này, không thiếu. **Nợ:** đưa p1p3p7 vào
  run-attempt ở đợt sau để khỏi sót (đề xuất, không tự sửa trong
  lúc đo — xem §10 (d)).
- **F-148-T4-2 — Median A3 đúng 60,0 ms: sát nút tuyệt đối.** Không
  phải sai số đo (tái tính độc lập đúng 60,0000; 269 ≤60 vs 256 >60).
  #21 đóng theo luật nhưng biên = 0 — parent/T10 phán (xem §10 (c)).
- **F-148-T4-3 — B2 A1 vi phạm do burst khởi động 14 s, nguồn không
  quy được chắc chắn.** Đỉnh 4,29 lúc 18:00:40–52Z trùng pha launch
  WebKit + app boot / đầu pass 1 (có thể là burst của chính probe);
  ps-before/after chỉ có vite của chính attempt nên không loại trừ
  được job ngắn hạn của luồng khác. Không ảnh hưởng verdict (A1 đã
  bị loại; A2/A3 sạch B).
- **F-148-T4-4 — Smoke S3 nổ trong pha setup, S3b mới nổ giữa lúc
  đo.** S3 (wall 20 s) nổ ở 0 pass vì setup ~18 s; bằng chứng
  watchdog đầy đủ phải đọc cả S3 (nổ đúng giờ + exit 2) và S3b
  (nổ giữa loop + partial JSON giữ nguyên).
- **F-148-T4-5 — Câu chữ watchdog "partial JSON giữ nguyên" gây
  hiểu nhầm nhẹ khi nổ trước pass 1** (S3: chưa có file nào để giữ).
  Hành vi đúng (exit 2, không kẹt); chỉ câu log chưa phân biệt hai
  trường hợp. Cosmetic.
- **F-148-T4-6 — Các pwEval thô pha setup còn lại** (y2SeqStart,
  vòng chờ booted, pause/sanity — dòng 334–463 file probe): chỉ
  được watchdog 20 phút bảo vệ, không có timeout riêng. Nợ cho đợt
  sau (xem §10 (e)).
- **F-148-T4-7 — Waiter đầu tiên chết theo wrapper exec** (không
  tách được khỏi shell gọi); T4 khởi động lại tay (pid 24210,
  theo dõi poller 23583 tới khi thoát). Không ảnh hưởng poller hay
  số liệu.
- **F-148-T4-8 — (c2)=0 ở A1/A2.** Hai attempt 20/20 không có
  occurrence "dang ngo that" nào (labellag (c) n=0 cả hai khối
  skippedLatest 0/1 ở A1, và tương tự A2). Không cộng dồn theo quy
  ước (cả hai đều không hợp lệ); ghi nhận là dữ kiện, không phải
  bằng chứng chống mô hình (A3 có 1 occurrence ngay sau đó).
- **F-148-T4-9 — Lệch 15 s giữa hai nguồn btime (brief giao
  ~17:28:08Z, T4 đo 17:27:53Z).** ĐÃ CÓ ĐÁP ÁN từ T2-148 (F-148-T2-1/8,
  build-loop log): `/proc/stat` = kernel boot 17:27:53Z, `/proc/1` =
  PID 1 start 17:28:08Z, chênh = độ trễ init 15,21 s — không phải
  nghịch lý đồng hồ. T4 dùng `/proc/stat` suốt (mọi poll/attempt đều
  ghi btime 17:27:53Z) nên số liệu T4 nhất quán nội bộ; chuẩn nào
  dùng cho gap thì parent/T10 chốt (T2 giữ `/proc/1` theo brief +
  tiền lệ series).

## 10. Chờ quyết parent / nợ đợt 149

- **(a) #21 ĐÃ ĐÓNG — xác nhận?** Attempt3 lượt hợp lệ (20/20, B
  ĐẠT 5/5, median đúng 60,0 ms). Chuỗi lượt hợp lệ 17 → 18;
  P1 52/52, P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38.
- **(b) #22 mở ở đợt 149?** Theo brief: không tự chuyển sang #22
  khi chưa có lượt hợp lệ mà không ghi lý do — nay ĐÃ có lượt hợp
  lệ (A3) nên #22 là lượt tiếp theo; T4-149 đo #22 với cùng cổng
  tickCost ≤60 ms + probe đã vá.
- **(c) Biên median = 0 (60,0 đúng ngưỡng): có xem lại ngưỡng 60 ms
  không?** Ba boot gần nhất: 6fb582df median partial 51,0/37,0 ms;
  d8a11644 median 66,0/65,5/60,0 ms; 98a7c93f median 99,0/101,0/
  97,0 ms. Dao động giữa các boot ~±15 ms; ngưỡng 60 ms hiện tại
  nằm GIỮA dải boot (không phải giữa dải attempt — trong cùng boot,
  3 attempt chỉ dao động 60,0–66,0). Giữ nguyên 60 ms hay hiệu
  chỉnh theo boot? Parent phán — T4 không tự đổi ngưỡng.
- **(d) F-148-T4-1: đưa p1p3p7 vào run-attempt tự động ở đợt sau?**
  (Chạy tay sau poller đã đủ cho đợt này nhưng dễ sót.)
- **(e) F-148-T4-6: bọc timeout cho các pwEval thô pha setup
  (y2SeqStart, booted check, pause/sanity) hay giữ watchdog 20
  phút làm backstop duy nhất?**
- **(f) Thứ tự O8: đợt này O8 chạy TRƯỚC attempt (theo brief 148),
  xong nhanh (17:45:04Z) và không nhiễm tải vào phép đo** — khác
  chuẩn "O8 sau cờ T4" trong MEMORY (quyết 147). Parent/T10 phán
  chuẩn cho 149 (O8-trước-T4 hay O8-sau-T4?).
- **(g) RAM sập đợt 147 (sập ~6,5 GB không nằm trong RSS + cụm
  spike C load1 4,80): KHÔNG tái diễn đợt này** (RAM min ≥1.083 MB
  trong attempt, 0 mẫu <500; snapshot 17:50Z không có khoảng chưa
  giải thích tương đương) — đóng nợ đối chiếu hay giữ mở cho T5/T9?
- Các nợ đứng khác giữ nguyên từ đợt 147 §11, trừ: mù #67 ĐÃ ĐÓNG
  HOÀN TOÀN ở đợt này (T2-148, chuỗi đóng hoàn toàn lên 3; gap
  18.882 s → CERT 67 / FULL 82); khung chết #110? ứng viên
  (17:24:10Z, 17:28:08Z] 238 s (T2-148, chờ parent chốt); chuỗi
  INSIDE 6 ĐỨT, về 0 (d8a11644 OUTSIDE dải FULL81). Còn lại: G1 chờ
  user, R9, ci-security.yml 403, file oversize 6,4 MB, TTS 39 cấm
  kiểm lại.
