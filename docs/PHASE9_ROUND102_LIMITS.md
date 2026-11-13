# Phase 9 — Đợt 102: Đóng nợ LIMITS gộp đợt 101 §4 (2 MiB, ghost F7, zombie fix, blur r7, re-arm, EPERM #21, harness N10/E1, G1) + kiểm chứng độc lập D9

> Ngày: 13/11/2026. Lượt cron 09:35 +07. 9 luồng D1–D9 spawn song song;
> **8/8 luồng D1–D8 về đủ** (LIMITS + log + batch stage), **D9 kiểm chứng
> độc lập XONG** (poll 02:40–03:40Z, verify 03:42–03:48Z, boot 249407b6
> suốt, không reboot trong đợt). Đây là đợt đầu tiên kể từ đợt 99 mà cả
> 8 luồng đều về đủ trong một lượt. KHÔNG push. HEAD vẫn 5f548ef8.

## 1. Kết quả từng luồng

### D1 — 2 MiB junction probe: KẾT LUẬN MỚI (nợ §4 mục 1+3)

- **Điểm nối hẹp nhất nay là luồng byte blob→qtdemux trước pull đầu
  tiên của qtdemux** — tái hiện qua cả instance webkitwebsrc+typefind
  hoàn toàn mới (run6 D1b: qtdemux0 bogus rồi qtdemux1 bogus trên
  webkitwebsrc1+typefindelement2 mới tinh, sau cả một lần re-request
  full file mới), và **không tái hiện trên instance http thuần cùng
  file** (qtdemux2 đúng). Chuỗi event typefind:5 trong run bogus
  **giống hệt** run sạch — điểm nối không nhìn thấy được ở mức event,
  chỉ ở mức nội dung byte.
- **Ức chế bởi logging TRACE được xác nhận định lượng:** C1
  (`typefind:5 + webkitwebsrc:7` TRACE) **0/4 bogus** vs logging nhẹ
  (B1+D1a+D1b, `webkitwebsrc:5`, không TRACE) **16/18 run bogus
  (88,9%)**, Fisher một phía **p = 0,0029 (D1 ghi; D9 tính lại 0,0021
  — xem §3)**.
- **Disassembly CHỐT cả hai ngưỡng trong binary thật**
  (`libwebkitgtk-6.0.so.4.20.0`): `HIGH_QUEUE_THRESHOLD = 0x1400000`
  (20.971.520, stopLoaderIfNeeded) và `LOW_QUEUE_THRESHOLD = 0x200000`
  (2.097.152, restartLoaderIfNeeded) — đóng mục mở B1 §7.
- **Đính chính summary-c1.txt:** `'stopping download': 6` thực ra là
  6 dòng `"queue size under high watermark, not stopping download"` —
  **0 lần stop thật, 0 lần restart thật**; `restartLoaderIfNeeded`
  early-return `"download already active"` **1065–1089 lần/run**.
- **Không có seek nào tới đúng 2 MiB:** 0 base = 2097152 trong 20 base
  D1 (gộp B1: 0 trong 18 run nhẹ). Splice chỉ xuất hiện dưới dạng độ
  lệch +2 MiB trong byte đã giao. Số 2.097.152 trùng LOW threshold
  nhưng restart không bao giờ chạy (0 restart trong 22 run) nên
  **KHÔNG được kết luận LOW gây ra splice**.

### D2 — Ghost residual: tap rVFC độc lập F7 — KHÔNG LAND (nợ §4 mục 4)

- **Tap chạy đúng cơ chế, anchor hết phân kỳ sau pump chết + seek
  (CHỨNG MINH):** flip-protocol với tap bật: gap presented−expected
  giữ trung vị **1,0**, |gap|≤3 đạt **94–96% ở mọi cửa sổ hậu flip kể
  cả 15s+** (C2 không tap: +80 ở seek đầu, +1028 ở seek cuối, |gap|≤3
  = 0% sau 5s). Không còn tăng trưởng theo seek.
- **Nhưng ghost residual CHƯA khỏi — KHÔNG LAND:** snapshot-label clean
  chỉ **52,4% (B) / 53,8% (flip)** so với baseline **40,5% / 45,0%** —
  dưới bar đăng ký trước (≥70% và hơn baseline ≥20 điểm). Spread vẫn
  fail (45,3 ở flip).
- **Nguyên nhân:** tap không thể sửa NHÃN snapshot — nhãn lấy từ
  currentTime lúc capture, tap chỉ sửa `presented` → quyết định
  skipLatest. Clean/spread đo nhãn snapshot nên tap không chạm được.
- **Độ chính xác của presented: 26% (frameIdx) → 46% (B) / 60% (flip)**
  theo strip curPix; phụ thuộc mạnh vào tuổi anchor: [0,50ms): 69–78%,
  [50,100ms): 28–31%, [100,200ms): 16–37% — ngưỡng tươi 500ms QUÁ
  LAX, anchor cũ ngoại suy sai 70%+ thời gian.
- **Production đã REVERT hoàn toàn** (0 marker D2; md5 cuối khác
  baseline chỉ do D3 land song song). Hướng mới: **F8 relabel snapshot
  bằng anchor tap** (CHƯA thử) + siết ngưỡng tươi 500ms → ~50ms.

### D3 — Zombie pump: FIX KHE EARLY-RETURN ĐÃ LAND (nợ §4 mục 7)

- **Khe early-return qua seek-across ĐÃ ĐÓNG bằng kill đồng bộ tại lúc
  seek.** Trước fix (baseline d3x0, 24 clip, 23 cú seek-across):
  check A6 bắn **11 lần**. Sau fix (6 lượt đo, 2 cây):
  **`skip-clip-inactive` = 0 ở cả 6 lượt** (tổng 114 biên seek-across
  + 23 biên thường). Pump cũ chết đồng bộ trong `setPlayhead`, ghi fb
  **`seek-inactive`: 11/11, 10/11, 11/11, 12/12, 12/12, 12/12**.
- **Đối chứng dương decisive (d3c1):** tắt owner-kill mà sync kill vẫn
  đóng khe 12/12 — trước fix, C5 c5c3 cùng điều kiện thì check A6 phải
  bắn 6/6; nay check bắn 0/12 vì pump đã chết trước callback.
- Fix gồm 3 phần: kill đồng bộ khi playhead nhảy (chính, lib mới
  `rvfcClipWindow.ts` + gọi trong `useStore.subscribe`); chặn capture
  khi element đang seeking (phụ, nợ C5 §5.1); hoãn tạo pump khi element
  chưa định vị (gate, ngưỡng 0,35 s = hằng re-seek) — vá ca stale
  first-frame còn lọt ở d3x2, verify lại sạch ở d3x3/d3x4.
- Zombie Δ = 0 ở mọi biên đo được; pixel parity đứng (clip lẻ C 75–100%,
  D = 0, out = 0). Hồi quy: tsc 0, vite build PASS, Hold 75/75, Pacing
  19/19, previewEngine 27/27, seek 21/21, seekSkip 9/9, previewLoop
  20/20, ghostBlend 15/15, rvfcClipWindow102D3 21/21 (test mới),
  test-preview-engine.sh 354 assertions pass.

### D4 — Blur parity: 0 cap D mới, r7 VẪN MỞ nhưng đã bị trung hòa (nợ §4 mục 6)

- **0 cap D mới trên 566 cap** (chr 459 + wk 107), mọi điều kiện tải
  (yên / sysload 2–4 / stall 1600ms / tải nền 7–27). **r7 VẪN MỞ** —
  vẫn là ca D gap-6 duy nhất trong lịch sử.
- **Cơ chế r7 CÒN SỐNG nhưng đã bị pad-oldest trung hòa:** 11/566 cap
  (1,9%) có nhãn gap 6 nhưng rơi vào dải A (g 0,434–0,447, đúng dự đoán
  pad-triple gap-2 là 0,449) — nhãn gap 6 + nội dung gap 2, y hệt r7;
  pre-fix cặp này cho D 0,307, post-fix cho A.
- **D floor post-fix gộp: 0/1433** (C4 0/867 + D4 0/566; 95% CI trên
  0,209%; Fisher p=9,5e-09 so với pre-fix 28/1547).
- **Cửa sổ mù wk KHÔNG thu hẹp được:** ước lượng từ state100 được kiểm
  chứng trên lượt C4 (wk r25/r26 c1 = 1120/1341ms, đúng dải Y5
  1018–1480ms). D4 mới: wk c1 n=5, median 1152ms (đúng median Y5
  ~1110–1150) nhưng đuôi tải kéo tới 8124ms; wk c2 n=5, median 1950ms,
  chỉ 1/5 ≈ 0 — memo c2 ~0 chỉ đứng cho lượt yên, không đứng dưới tải.
  Giữ nguyên kết luận A5. (KHÔNG chạy blind probe, theo nhiệm vụ C4.)

### D5 — EPERM probe #21 + đóng khoảng mù #20 (nợ §4 mục 8)

- **Probe #21: ok=2 fail=0** — checklist P8 §2.3 đúng 1 lần: status
  02:39:25Z DEAD/STALE (age 10.769s, exit 1) → once 02:39:32Z probe
  #21, boot 249407b6, ok=2 fail=0, exit 0 → status lại ALIVE (n=21,
  age 0s). Log probe v2 52 → 55 dòng.
- **Khoảng mù #20: 23:39:56Z 12/11 → 02:39:32Z 13/11 (2h59'36") — ĐÃ
  ĐÓNG: chứa đúng 2 REBOOT, cả hai đều có giờ chính xác từng giây:
  #25 23:51:21Z** (aa3f2b67 → 3a12a7d3) **và #26 02:12:10Z**
  (3a12a7d3 → 249407b6). Đây là khoảng mù đầu tiên chứa 2 reboot mà cả
  hai đều chốt được giờ từng giây. Khoảng cách #24→#25 = 2h09'31",
  #25→#26 = 2h20'49". Chu kỳ nay 26 lần / ~53h54' ≈ 2h04'/lần.
  Reboot tiếp theo dự kiến ~04:16Z.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật", 0
  "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật; 14 dòng "đã
  tắt" (C3 ×12 + C9 O8 ×2) đều là dương tính giả đã biết. Sóng gần
  nhất vẫn ~11:55–12:11Z (R7), ~38h29' trước probe #21. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 431 dòng / 132 file** (phạm vi 2658
  file); R7b đối chiếu 456 dòng / 149 file; copies 25 dòng / 17 file;
  đối chiếu chéo 431+25=456=R7b, **chênh 0 — lần thứ tám liên tiếp**.
  +33 dòng / +8 file so với B6, giải thích đúng hết bằng diff.
- RAM 5 mẫu 464/430/1412/989/1795 MB (max ~1,80 GB = 29% ngưỡng guard)
  — birefnet KHÔNG chạy. Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user
  quyết); cron riêng 10 phút vẫn chờ user quyết.

### D6 — Re-arm drift-gate follow-up: KHÔNG SỬA, GIỮ NGUYÊN GATE (nợ §4 mục 5)

- **D6-A "stable-offset close" BỊ BÁC BẰNG DỮ LIỆU:** "drift giống nhau
  giữa 2 lần chặn" ngoài đời KHÔNG phải decoder ổn định — mà là **điểm
  đáp của burst lặp lại** (decoder nhảy vọt lên ~+1 s trước playhead,
  đóng băng, rồi nhảy tiếp). Mô phỏng D6-A trên 24 lượt sẽ đóng sớm 13
  đuôi — gồm cả 2 đuôi đóng trần h4 và i10 — trong lúc decoder đang
  burst, tức tái mở đúng cửa sổ lỗi f4. **0/24 đuôi bị chặn** đạt tiêu
  chí ổn định-lệch.
- Phương án hạ trần 5000 → 3000 ms cũng **không làm**: lợi nhỏ (trung
  vị không đổi, chỉ 4/38 đuôi chạm trần) mà rủi ro không chứng minh
  được an toàn ở cỡ mẫu khả thi.
- Baseline live mới 12/12 lượt (i1–i12, không đổi code): **f4-like
  0/12, gate chặn 59 lần, burst-rate chặn 21 lần, 0 seek kẹt, 2 đóng
  trần đều vô hại** — gate C3 tái hiện đúng trên cây hiện tại. Tuổi
  đuôi trung vị (velocityTicks): h 1509 ms → i 2400 ms — khác phiên
  đo, cùng code gate, không kết luận "gate tệ đi".

### D7 — Harness: N10 retry/fallback chiều PHÁT + E1 vòng fallback thứ 2 ĐÃ bắn thật (nợ §4 mục 1 + §1 C8)

- **O8 cả 2 engine 21/21, giống hệt đợt 101:** Chromium 21/21 (S5
  Δx=0,112; S7 mask 0,112 / bóng 0,113), WebKit 21/21 (S5 Δx=0,194;
  S7 mask 0,194 / bóng 0,197). Fixture md5 khớp đợt 101 từng byte.
  0 retry trong đo S5/S7.
- **Đường retry của N10 chiều PHÁT ĐÃ bắn thật (lần đầu):** keydown
  Space #1 slot 0 bị nuốt, sau 5310ms `playing` vẫn false → thử lại
  Space #2 → lật sau 69ms, `playMethod="space-retry"`, 11/11 slot,
  tỉ lệ 1,08×.
- **Đường fallback của N10 chiều PHÁT ĐÃ bắn thật (lần đầu):** cả 2
  keydown Space bị nuốt (5095ms + 5407ms không lật) → fallback store
  `setState({playing:true})` lần 1 → lật sau 158ms,
  `playMethod="store-fallback"`, 11/11 slot, 4/4 pass.
- **Vòng lặp fallback thứ 2 của E1 ĐÃ bắn thật (lần đầu):** cả 2 Space
  bị nuốt (5284ms + 5106ms) → fallback #1 setState → keydown Space
  muộn tổng hợp lật lại `playing=false` → wait 2s của fallback #1
  chạy hết (2120ms) → fallback #2 setState → lật sau 112ms,
  `playMethod="store-fallback"`, 10/10 slot, G5 1,17× PASS.
  Đồng thời chứng minh keydown tổng hợp qua `window.dispatchEvent`
  toggle được thật (handler Space của App.tsx không check `isTrusted`).
- **0 abort vẫn giữ sau thay đổi:** 4 lần fault hoàn thành (N10 retry,
  N10 fallback lần 2, E1 FB2 + 1 lần verify trên file thật sau land),
  44 slot, 88 toggle, 2 retry + 2 fallback cứu thật, 0 abort. Code
  fault-injection đã land vào file harness thật (E1 md5 mới
  `4ba1d86c…`, N10 `9ca985cd…`; diff file thật vs bản sao = rỗng).
- Hạn chế: cả 3 lần fault đều tải nặng (tỉ lệ 1,08–1,89× là số phồng do
  tải); N10 fallback lần 2 có mơ hồ ±100–200ms về redispatch #1 vs
  setState (không đổi kết luận); FB2 dùng keydown tổng hợp định thời
  xác định, keydown chậm tự nhiên lọt đúng cửa sổ 2s vẫn chưa quan sát
  được ngoài đời.

### D8 — G1 evidence 11: thêm bằng chứng đo cho quyết định metric G5/M2 (nợ §4 mục 2)

- **KHÔNG tự đóng G1, KHÔNG đổi ngưỡng, KHÔNG đổi metric.** Đo mới: E1
  30fps ×9 + N10 60fps ×5 (14 lần, harness C8 — md5 không đổi cả cửa
  sổ đo). Gộp vào pool v12 (30fps n=91, 60fps n=59).
- **14/14 lần PASS dưới cả G5 lẫn M2, 0 lần bất đồng mới.** Đồng thuận
  G5/M2 toàn lịch sử: **112/118 (94,9%)**, vẫn đúng 6 lần bất đồng cũ
  của A9, 0 lần FAIL→PASS. Quy luật "G5 ≥ 1,00 không bao giờ lật" MỞ
  RỘNG: nay 58 lần, 0 lần lật.
- Khung chân yên 30fps dưới M2: **(a)** cố định 20 lần yên đầu tối đa
  **15/20** (trần cứng, KHÔNG đạt); **(b)** trượt 20 lần yên mới nhất
  **19/20** (ĐÃ ĐẠT, đệm 3 lần FAIL liên tiếp); **(c)** tích lũy
  **23–24/29** (cắt ngang mốc — **lần yên tiếp theo là quyết định**:
  PASS → kịch bản xấu 24/30 = 80,0% đúng mốc); **(d)** chỉ lần
  tính-lại-được 23/25 (lệch chọn mẫu); **(e)** yên sạch 21/23; **(f)
  MỚI** trượt 10 lần mới nhất **10/10**; **(g) MỚI** kỷ nguyên hậu-A9
  **11/11** (toàn bộ 5 lần FAIL chặn khung (a) đều trước A9);
  **(h) MỚI** nhạy biên phân loại: **không kiểm được** (0 lần biên
  9–10 fps); **(i) MỚI** biên an toàn khung (b): chịu được 3 lần yên
  FAIL liên tiếp.
- Chân yên 30fps dưới G5: n=29, PASS 25/29 (86%), median 0,950; chân
  yên 60fps: 20/20 PASS (100%) dưới CẢ HAI metric. Cửa sổ yên đợt 102
  nhấp nháy (chỉ 2/9 lần E1 thành yên, 2 lần hỗn hợp — cao nhất từ
  trước tới nay trong một đợt) do load song song 8–10 luồng.
- Mốc mới: E1 run8 slot 2 play 804ms — lần đầu tiên vượt mốc 800ms
  của code cũ (đường chờ-trạng-thái của B7 xử lý được, không cần
  retry/fallback).

### D9 — Kiểm chứng độc lập: XONG (8/8 về đủ, cây gộp xanh)

- Poll đĩa 02:40–03:40Z: 0/8 → 1/8 (D5) → 2/8 (D1) → 5/8 (D2, D7, D8)
  → **8/8 ALL LANDED 03:40Z**. Không reboot trong đợt (boot 249407b6
  suốt). Cây gộp đóng băng 03:41Z, preview.tsx `ed260e62`.
- Verify cây gộp: tsc web 0, desktop 0; vite build PASS 6,28s; **26/26
  mục suite exit 0 ngay lần đầu** (Hold 75/75, Pacing 19/19,
  previewEngine 18+27, seek 21/21, seekSkip 9/9, previewLoop 20/20,
  ghostBlend 15/15, rvfcClipWindow102D3 21/21 (mới), css60/61 60/60,
  P7 8/8, orphans 17/17, r6 dict 2767, U4 141/141, media 3/3, retry
  7/7, watchdog 9/9, deint-verdict 17/17, 100b7 13/13, armHeld 16/16,
  vite-regex 9/9, xvfb-lock PASS, test-preview-engine.sh 354
  assertions); O8 **21/21 cả 2 engine ngay lần đầu** (Chromium S5
  Δx=0,112; WebKit S5 Δx=0,194) trên cây gộp cuối đã có fix D3.
- Đối chiếu headline 8/8 KHỚP với dữ liệu thô trên đĩa (đếm lại trực
  tiếp + tính lại Fisher: D4 gộp p=9,47e-09 khớp từng chữ; D6 gate
  59/burst 21 khớp; D5 log 55 dòng + heartbeat n=21 khớp; D7 O8 +
  fault timestamps khớp; D8 khung M2 khớp từ JSON gộp). Chi tiết:
  `docs/PHASE9_ROUND102_D9_VERIFY_LIMITS.md`; log:
  `hidden_files/round102-d9/` (poll.log, round102-d9-suites.log,
  round102-d9-o8.log).

## 2. Ghi chú gộp

- **Đợt này không cần parent gộp thay:** D9 tự poll + verify + viết
  LIMITS gộp (vai trò C9 đợt 101, nhưng lần này 8/8 về đủ nên không
  có luồng nào thành nợ vì chưa xong).
- **Va chạm gộp — preview.tsx:** 2 luồng cùng sửa (D2 thử tap rồi
  revert + D3 land fix). Trên đĩa lúc đóng băng: marker D3 ×14, D2
  ×0 (revert hoàn toàn), C3 ×5, C4 13 lần xuất hiện (C9 ghi 12 —
  chênh 1 do cách đếm). Thứ tự md5: `07f56792` → `b06e4aad` →
  `833ca8ef` → `e886e754` → `ed260e62` (ổn định từ 03:30Z).
  Thay đổi production có logic mới đợt này (đúng 1): fix zombie D3.
- **Đính chính Fisher D1:** D1 ghi p = 0,0029; D9 tính lại đuôi đúng
  (P(X≤0)) = **0,0021** — cùng kết luận (p < 0,005), số nên trích là
  0,0021.
- **Đính chính giờ reboot #25: 23:51:21Z** (D5 §5 mục 11; C9 đã đính
  chính C8 lệch ~55s) — GAP_ANALYSIS §30 ghi "~23:52:16Z" là giờ C8
  ước lượng, đã sửa trong §31 đợt này. D8 §6 mục 13 ghi "23:51:32Z"
  lệch 11 giây (cùng lỗi C7 đợt 101).
- **Đính chính đếm marker C4:** D9 đếm 13 lần xuất hiện
  (paddedGhosts ×6 + lastDrawnPaddedGhosts ×5 +
  motionBlurPadGhostCount ×2) so với C9 ghi 12 — code pad-oldest còn
  nguyên, test pad 27/27 xanh, không đổi kết luận.
- D6-A là tiền lệ tốt: phương án "trông hứa hẹn trên mô phỏng" vẫn bị
  bác bằng quỹ đạo tick-by-tick — verify sau đừng chỉ kiểm tra số mô
  phỏng, hãy hỏi dữ liệu gốc có phân biệt được hai giả thuyết không.

## 3. Kiểm chứng (cây đã gộp, D9)

- tsc web 0, desktop 0; vite build PASS (6,28s); r6-i18n-check PASS
  (dict 2767, không đổi); P7 8/8; orphans 17/17; css60 60/60; css61
  60/60; playheadPacing 19/19; playheadHold 75/75; previewEngine
  18+27; rvfcClipWindow102D3 21/21; test-preview-engine.sh **354
  assertions pass**; U4 failfast 141/141; O8 21/21 cả 2 engine ngay
  lần đầu (S5 Δx chr 0,112 / wk 0,194; S7 chr 0,112/0,113, wk
  0,194/0,197); E0 0 lỗi cả 2 engine.
- Không reboot trong lúc verify (boot 249407b6 từ 02:39Z tới 03:48Z).

## 4. Nợ mở cho đợt 103

1. G1 đóng hay chưa — user quyết (metric G5 hay M2; D8 thêm khung
   (f)–(i) + Q1–Q6; lần yên tiếp theo là quyết định cho khung tích lũy
   (c); đợt 103 nên đo E1 đầu lượt để bắt cửa sổ yên).
2. 2 MiB — điểm nối hẹp nhất nay là luồng byte blob→qtdemux trước pull
   đầu; bước duy nhất còn lại: probe ghi nội dung byte của buffer đầu
   tiên qtdemux nhận (B1 §8.4 — cần code đo mới). Vì sao đúng 2.097.152
   vẫn mở (trùng LOW threshold nhưng restart không chạy).
3. Ghost residual — F7 tap không land; hướng còn đứng: F8 relabel
   snapshot bằng anchor tap (CHƯA thử) + siết ngưỡng tươi anchor 500ms
   → ~50ms (CHƯA đo lại) + F6' pixel-verified skipLatest cho WebKit.
   Mọi kết luận nhân quả chỉ đo trên Chromium.
4. Zombie pump — khe early-return ĐÃ ĐÓNG (D3); nợ mới: đường tick vẽ
   1 frame stale ở tick đầu sau nhảy (d3x2, cap frame 90) — cùng cửa sổ
   2-tick nhưng ở đường vẽ, chưa fix. Độ trễ owner-kill trực tiếp vẫn
   chưa đo được (cần ghi timestamp tại điểm kill trong production).
5. Re-arm — drift-gate đã land (C3), D6 giữ nguyên; D6-A bị bác (không
   thử lại mà không đọc D6 §2); hạ trần 5000 → 3000 ms không làm;
   tuổi đuôi trung vị velocityTicks h 1509 ms → i 2400 ms (khác phiên
   đo, không kết luận hồi quy); gate bỏ qua khi không tìm được clip
   (fail-open, nested) vẫn mở từ C3.
6. Blur parity — r7 VẪN MỞ (cần strip-confirm 1 ca trong cụm A gap-6
   để chốt nội dung gap 2); D floor post-fix gộp 0/1433 (CI trên
   0,209%); B-band pair-like còn lại sau pad (chr 9/113, wk 8/32) chưa
   giải thích hết; cửa sổ mù wk không thu hẹp được (cần lượt blind yên
   — đang bị cấm trong nhiệm vụ này; đuôi tải đã đo tới 8124/6120ms,
   c2 biến thiên không tương quan tốc độ phát).
7. EPERM: probe #22 + khoảng mù #21 (bắt đầu 02:39:32Z); giờ từng giây
   reboot #16 KHÔNG chốt được (kẹp ~4', chờ parent/user quyết); cron
   riêng 10 phút vẫn chờ user quyết.
8. Harness — mọi đường retry/fallback Space-toggle (E1 + N10, cả 2
   chiều, cả vòng lặp fallback thứ 2) nay ĐÃ bắn thật; còn mở: keydown
   chậm tự nhiên lọt đúng cửa sổ 2s của fallback #1 chưa quan sát được
   ngoài đời; mơ hồ ±100–200ms ở N10 fallback lần 2 (chạy lại với
   DELAY=20000 sẽ triệt); D6-A kiểm tra lại: tính lại độc lập "0/24
   đuôi đạt tiêu chí ổn định-lệch" bằng 2 script quantify của D6
   (D9 chưa chạy lại).
9. Birefnet-general trong gói: chỉ thử lại khi RAM đổi (quyết định
   parent đợt 92) — vẫn 0 lần chạy thành công.
10. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
11. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web
    GitHub hoặc cấp quyền workflows cho App).
12. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 102 (8 luồng): **20 entry / 8 file** (D1 2, D2 1, D3 6, D4 2, D5
  1, D6 3, D7 3, D8 2) / 20 file duy nhất (không trùng file giữa các
  luồng). D9: 1 entry (LIMITS kiểm chứng). Closing đợt 102: 2 entry
  (LIMITS gộp này + gap analysis §31).
- **Tổng chờ push sau đợt 102 (đếm lại trực tiếp từ đĩa, đợt 67–102):
  361 file batch / 2436 entry / 1474 file duy nhất** (trước đợt 102:
  351/2413/1456 — khớp đúng số C9 đợt 101; đợt 102 thêm 10 file batch
  / 23 entry / 18 file duy nhất mới — gap analysis đã có trong 30
  batch trước nên không thêm file duy nhất). HEAD vẫn 5f548ef8.
  KHÔNG push.
