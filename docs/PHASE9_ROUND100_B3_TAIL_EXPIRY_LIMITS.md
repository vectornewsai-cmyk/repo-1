# Phase 9 đợt 100 — luồng B3: Re-arm f4 tail-expiry — luật burst-rate cho đuôi ân hạn

- **Ngày:** 2026-11-12/13 (code + đo 20:44–21:00Z ngày 2026-11-12; viết doc 2026-11-13 giờ VN).
- **Nợ đóng:** LIMITS gộp đợt 99 §4 mục 4 — "f4 tail-expiry: luật tail '2 advance = resume ổn' bị burst +1,16 s lừa → drift re-seek bắn ngay sau khi grace tắt, seek kẹt 5,5 s+".
- **Kết luận ngắn:** **FIX ĐÃ LAND.** Luật đuôi nay chỉ đếm lần tăng LÀNH (tốc độ tăng trong chính tick ≤ 1,5× playbackRate); burst bị chặn + reset bộ đếm. Offline 65/65 test (9 test mới B3-R1..R9, gồm replay f4). Live 6 lượt WebKitGTK: **f4-like 0/6** (baseline f4 đợt 99: 1 ca), **burst bị chặn 3 lần ngoài đời** (g1×2, g2×1), grace BỊ CHẶN 6 / LỌT 0, ARM-HELD §6 = 2 (tăng từ 1/18 lượt đợt 99), không hồi quy (tsc 0, vite build PASS, 6 suite xanh). **Nhưng fix chưa triệt để:** burst trải trên 1 gap rAF dài (> ~770 ms cho +1,16 s) có rate ≤ 1,5× nên vẫn lọt — 2 ca như vậy đã quan sát được (g2, g5); cả 2 đều không gây hại (drift ≤ ~1,1, ph đuổi kịp trong 1 tick), nhưng cửa sổ f4 vẫn mở cho burst dài-gap đáp xa (> ~1,5 s). Xem §6.

## §1. Điều tra — vì sao burst +1,16 s qua mặt được luật tail

Luật cũ (`nextResumeGraceTail97Y4`, đợt 97 Y4): đuôi đóng khi element tăng ≥ 1 frame ở 2 tick riêng biệt — **chỉ đo chuyển động, không đo độ lớn/tốc độ của lần tăng, không đo drift**. Tái hiện từ tick thô f4 (`hidden_files/round99-a3/probe-webkit-load4-gop30-f4/probe-results.json`, velocityTicks):

| Probe tick | ct | ph | drift | tail | Chuyện gì xảy ra |
|---|---|---|---|---|---|
| t=9774 | 3,0000 | 1,7333 | +1,27 | mở, advances=0 | watch hết (ct 2,9667→3,0), đuôi mở, lastCt=3,0 |
| t=10469 | 4,2000 | 1,7333 | +2,47 | — (watch mới arm) | burst +1,20 → detector arm watch mới (rearms 1→2) |
| t=10985 | 4,2667 | 2,4000 | +1,87 | mở, advances=0 | watch hết (tăng lành +0,0667), đuôi mở lại, lastCt=4,2667 |
| t=11593 | 5,4242 | 2,9333 | **+2,49** | advances=**1** | **burst +1,1575 trong 1 tick → luật cũ đếm là advance #1** |
| t=11968 | 3,5333 | 3,5333 | 0 | **đóng** | lần tăng sau (không quan sát được ở mẫu probe) = advance #2 → đuôi đóng → drift re-seek bắn ngay (resyncsV 1→2 ở tick sau), seek kẹt 5,5 s+ |

Chuỗi lỗi có 3 mắt xích: (1) burst được đếm như tăng lành — vì luật chỉ kiểm `|Δct| ≥ 1 frame`; (2) lần tăng ngay sau burst (decoder nhích tiếp từ điểm đáp sai) đủ điều kiện advance #2 — vì luật không hỏi "đáp ở đâu"; (3) lúc đuôi đóng, `overCount` của drift re-seek đã = 1 (grace giữ) và drift +2,49 còn vượt xa ngưỡng 0,35, nên seek bắn ở tick kế — đúng 1 tick sau khi grace tắt. Tick app giữa 2 mẫu probe (gap 375–608 ms) không quan sát được, nên advance #2 chỉ suy ra từ việc đuôi đã đóng + resync tăng — nhưng bản thân việc đuôi đóng là số đo trực tiếp (tail=None ở t=11968), không phải suy đoán.

Bối cảnh khiến burst này thường gặp: dưới load4, element tăng ≥ 1 frame chỉ 5 tick/lượt mà 3 tick trong đó Δct > 0,35 (60%, f4) — decoder WebKit đói CPU giao frame theo đợt (burst +1,0–1,3 s rồi đóng băng ~600 ms), không decode đều 1×.

## §2. Phương án đã chọn — luật burst-rate (ít rủi ro nhất)

**Quy tắc mới:** một lần tăng chỉ được đếm khi tốc độ tăng của CHÍNH TICK ĐÓ lành: `rate = |Δct| / (gap tick × playbackRate) ≤ PLAYHEAD_TAIL_BURST_RATE_MAX = 1,5`. Burst (rate > 1,5) thì KHÔNG đếm mà còn **reset advances về 0 + rebase lastCt** về điểm đáp của burst (sau cú nhảy, độ ổn định chưa biết — phải có 2 lần tăng lành MỚI mới được đóng đuôi). Gap tick đo bằng `lastTickMs` (mới, cập nhật MỖI lần gọi kể cả tick đóng băng) nên mẫu số là đúng 1 gap rAF, không bị thời gian đóng băng trước đó làm loãng như khi đo từ lần tăng cuối.

Vì sao ngưỡng 1,5×: decode lành tăng đúng playbackRate × wall-clock (rate ≈ 1,0×, tối đa ~1,2× kể cả jitter lấy mẫu media-clock); burst f4 thấp nhất ~1,9× (gap rAF 200–600 ms dưới tải — xem §6 về cách tính khoảng này); 1,5× nằm giữa hai phía với biên ~1,3–1,6×. Tiền lệ gần nhất phía lành: burst c1 đợt 96 (Y4-R2: +0,58 s/398 ms = 1,46×) vẫn đếm — ngưỡng 1,5 giữ nguyên hành vi Y4 cho ca này, và test B3-R7 khóa lại.

**Phương án đã cân nhắc mà KHÔNG chọn — drift-gate** (chỉ đóng đuôi khi |drift| ≤ 0,35 ở tick đóng): sửa đúng ca f4 một cách xác định, không phụ thuộc gap tick; nhưng cần target của từng element (drift phải đo với target theo speed — `rampSourceTimeAt` — không phải playhead thô) mà chỗ bước đuôi không có sẵn; luồn target vào đây xâm lấn hơn nhiều và dễ đụng B2/B5 (cùng sửa preview.tsx). Luật burst-rate không cần target, đúng với mọi speed qua playbackRate (test B3-R6 khóa clip speed 2×). Đánh đổi: drift-gate chặn được cả burst dài-gap; burst-rate thì không (xem §6).

**Phương án đã cân nhắc mà KHÔNG chọn — kéo dài grace 1 tick sau khi đuôi đóng:** chỉ hoãn seek thêm 1 tick; drift +2,49 vẫn vượt sau đó nên seek vẫn bắn — không sửa nguyên nhân, chỉ dời thời điểm. Loại.

## §3. Thay đổi code (chỉ vùng luật tail/grace, marker "Đợt 100 B3")

- `apps/web/src/lib/playheadHold90R2.ts`:
  - Hằng mới `PLAYHEAD_TAIL_BURST_RATE_MAX = 1,5` (+ header giải thích, §2).
  - `ResumeGraceTail97Y4` thêm trường tùy chọn `lastTickMs?: number` (đuôi cũ không có trường này vẫn chạy — thiếu thì dùng `endedAtMs` làm mốc).
  - `ResumeGraceTailInput` thêm `playbackRate?: number` (mặc định 1); `ResumeGraceTailResult` thêm `burstBlocked?: boolean` (true = tick này vừa chặn 1 burst — để probe đếm trực tiếp).
  - `nextResumeGraceTail97Y4`: luật burst-rate như §2; gap ≤ 0 (cùng timestamp — không đo được tốc độ) thì đếm như cũ, không chặn oan (B3-R9).
- `apps/web/src/preview.tsx` (chỉ vùng đuôi/grace; B2/B4 cùng sửa file này ở vùng draw/mask/blend khác — không xung đột, marker còn nguyên):
  - Bước đuôi mỗi tick: truyền `playbackRate` của element + đếm `burstBlocked` vào biến `resumeTailBurstBlocked100B3`.
  - Hook mới `__vcutTailBurstBlocked100B3` (khai báo kiểu + công bố mỗi tick + dọn ở cleanup) để probe đo trực tiếp.
- `apps/web/scripts/probe100b3.mjs` (copy probe99a3, đổi scratch sang round100-b3, CFG /tmp/round100-b3): sampler ghi thêm `tailBursts` mỗi tick.
- `apps/web/scripts/analyze100b3-tail-expiry.mjs` (mới): đếm tailBursts + phát hiện ca f4-like (đuôi đóng khi drift vượt rồi resyncsV tăng trong 2 tick sau; kèm cờ kẹt seek khi ph đóng băng ≥ 2,5 s sau resync). Đã kiểm chứng trên dữ liệu cũ: f4 baseline → f4-like = 1 + kẹt seek (đúng), g1 → 0.

Không đổi: ngưỡng drift 0,35 s, 2 tick xác nhận, trần đuôi 5000 ms, detector re-arm 300 ms, luật bò Z3, CANCELLED/ARM-HELD §6.

## §4. Số đo live — trước/sau

Probe: WebKitGTK, clip bóng 720p 6 s, chạy tuần tự, 1 instance/lượt, dọn process sau mỗi lượt; `preview.tsx` mtime không đổi suốt 6 lượt (2026-11-12T20:46:39.348Z). Trước = 5 lượt mới f1–f5 đợt 99 (A3) + ca f4; sau = 6 lượt mới g1–g6 đợt 100 B3.

| Chỉ số | Trước (A3, 5 lượt mới) | Sau (B3, 6 lượt) |
|---|---|---|
| f4-like (đuôi đóng-drift-vượt + resync trong 2 tick) | **1** (f4, kèm seek kẹt 5,5 s+) | **0** |
| tailBursts (burst bị luật B3 chặn) | — (chưa có luật) | **3** (g1×2, g2×1) |
| Đuôi đóng khi drift vượt (>0,35) | 1 (f4) | 2 (g2, g5 — cả 2 đều KHÔNG resync sau, xem §4.1) |
| Grace chuỗi ≥2 tick BỊ CHẶN / LỌT (§4 analyzer A3) | 5 mới (f1,f3,f4,f5) / 0 | **6 / 0** (g1×1, g2×2, g3×1, g5×1, g6×1) |
| ARM-HELD §6 | 0/5 lượt mới (1/18 gộp cũ+mới) | **2** (g1-9777 driftCF 0,384/0,793; g4-15578 driftCF 0,72/1,715) |
| CANCELLED hẹp / DELAYED | 1 (f3, artifact probe) / 2 | 0 / 0 |
| Drift re-seek (đã trừ forceSeek+restart) | 1 (f4) trên 5 lượt mới | 3 — đều ở g3, KHÔNG liên quan đuôi (xem §4.2) |
| re-arm / arm-vì-bò | 9 arm / 4 ca bò (5 lượt mới) | 6 arm / 4 ca bò, 0 re-seek sau arm-vì-bò |
| Seeking kẹt ≥3 s | 3 (A3 gộp 18 lượt) | 1 — g5, là seek ĐẦU (forceSeek) 3,08 s dưới load4, không phải drift re-seek (xem §4.2) |
| Probe verdict (giữ playhead trong seek + lúc canvas đổi khung) | 2 PASS / 5 lượt mới | **6/6 PASS** |

### 4.1 Hai ca đuôi đóng khi drift vượt nhưng không gây hại (g2, g5) — kiểm tay

- **g2** (load4 GOP30): đuôi mở ở ct 1,6; tick sau ct nhảy +0,97 (gap probe 684 ms → rate ≤1,5× → đếm là advance #1 — **lọt qua luật burst-rate, đúng điểm mù §6**); tick sau nữa +0,10 → advance #2 → đuôi đóng khi drift +0,50. Không resync sau: drift chỉ +0,5–1,1 và ph đuổi kịp trong 1 gap rAF (~600–800 ms) nên `overCount` reset trước khi đủ 2 tick xác nhận; resync duy nhất sau đó là restartEnded (restartV 0→1 khi ct chạm 6 s, không phải drift).
- **g5** (load4 GOP250): cùng mẫu — nhảy +0,90 qua gap 788 ms (rate 1,14×) đếm là advance #1; +0,67 → đóng đuôi khi drift +0,87; không resync nào sau đó cả lượt (resyncsV=1, chỉ forceSeek); drift về 0 ở cuối lượt (ct=ph=5,6667).
- Cả 2 ca đều là **burst dài-gap lọt luật** (điểm mù đã biết), nhưng drift sau lọt chỉ ~0,5–1,1 — đủ nhỏ để 1 tick ph đuổi kịp — nên không tái hiện chuỗi f4 (cần drift ≳1,5–2 s để seek bắn ngay sau khi grace tắt). Cửa sổ còn lại: burst dài-gap đáp xa (> ~1,5 s) vẫn tái hiện f4 — xem §6.

### 4.2 Ba drift re-seek ở g3 + seek kẹt 3,08 s ở g5 — không liên quan đuôi

- **g3** (load4 GOP30): 3 drift re-seek (resyncsV 1→4, restartV=0), mỗi lần đáp ĐÚNG ph (drift 0,0 ở tick mẫu sau seek), không tail nào sống ở các tick đó (tail=None, 0 tick tail sống cả lượt, 0 lần re-arm) — là sửa drift đúng thiết kế khi không có grace, không phải f4-like. Sau mỗi seek, seeking 1,49–1,63 s rồi phát tiếp bình thường, không kẹt.
- **g5**: khoảng seeking 703→3784 ms (3,08 s) là **seek đầu tiên (forceSeek tới t=5)** dưới load4, trước khi đuôi nào mở — hành vi cũ, không do fix gây ra. Không có drift re-seek nào cả lượt.
- Trần 5000 ms: ứng viên trần 1 (g3, stall 5,80 s) — ph vẫn đứng sau mốc trần, **nhả trần vẫn 0 quan sát** (như A3: 0/18) — ngoài phạm vi B3, ghi nợ lại.

### 4.3 Burst bị chặn ngoài đời (3 lần) — kiểm tay

- **g1** t≈8278: advances 1→0 + tailBursts 0→1 (burst +0,44 trong gap ngắn bị chặn, rebase lastCt=4,3333); t≈10078: advances 1→0 + tailBursts 1→2 (burst thứ 2 bị chặn). Sau đó watch re-arm tiếp quản đuôi (rearms 1→2, crawlArms=1), không resync nào bắn — đúng đường handoff thiết kế.
- **g2** t≈14598: tailBursts 0→1 cùng lúc restartEnded seek (ct 6→5,3667): cú nhảy seek bị luật burst-rate chặn đếm (đúng — seek jump không phải resume-advance), advances reset về 0.
- Lưu ý: cú nhảy +1,40 ở g1 (t=8278→9168, gap probe 890 ms) VẪN ĐẾM là advance #1 — gap dài nên rate ≤1,5×. Đây cũng là điểm mù §6; không gây hại ở lượt này (drift sau đó về 0, không resync).

## §5. Hồi quy (cây cuối, sau mọi sửa đổi)

- `tsc` web: **0 lỗi** (chạy 2 lần: sau sửa + cuối lượt).
- `vite build`: **PASS** (31,43 s).
- `playheadHold90R2.test.ts`: **65/65** (56 cũ + 9 mới B3-R1..R9, gồm replay f4 B3-R2, blind spot B3-R5, speed 2× B3-R6, tương thích ngược B3-R7).
- `playheadPacing54K9.test.ts`: 19/19; `previewEngine.test.ts`: 25; `seek.test.ts`: 21; `seekSkipRender86N3.test.ts`: 9/9; `armHeld99a3.test.mjs`: 16/16.
- Không sửa production nào ngoài vùng tail/grace; không đụng TTS 39, không thử birefnet.

## §6. Caveat + nợ mở (đọc trước khi trích số)

1. **Điểm mù dài-gap (nợ mới của chính fix này):** burst trải trên 1 gap rAF > ~770 ms (cho +1,16 s) có rate < 1,5× nên vẫn đếm như tăng lành. Dưới load4, gap rAF thường 500–1500 ms (g3: mean 626 ms, p95 1215 ms, max 1492 ms) — điểm mù KHÔNG hiếm: 3/3 cú nhảy lớn dài-gap trong 6 lượt đều lọt (g1 +1,83/1384 ms = 1,32×; g1 +1,40/890 ms; g2 +0,97/684 ms; g5 +0,90/788 ms). Hậu quả thực tế trong 6 lượt = 0 (drift sau lọt ≤ ~1,1, ph đuổi kịp trong 1 tick), nhưng **f4 vẫn tái hiện được nếu burst dài-gap đáp xa > ~1,5 s** (đủ 2 tick xác nhận trước khi ph đuổi kịp). Hướng vá tiếp theo (cho luồng khác, không làm ở đây): drift-gate ở tick đóng (cần target theo speed — xem §2) HOẶC ngưỡng rate động theo gap (vd rate > 1,5× HOẶC |Δct| > 1,0 s bất kể gap — nhưng ngưỡng tuyệt đối này sẽ chặn oan decode lành trên gap dài, cần đo thêm trước khi chọn).
2. **Ngưỡng 1,5× mong manh ở phía lành:** tiền lệ c1 1,46× chỉ cách ngưỡng 0,04×. Burst nào ở 1,4–1,6× là vùng xám — phân loại đúng/sai phụ thuộc jitter lấy mẫu. Không có ca nào trong 6 lượt rơi vào vùng 1,4–1,6× có thể xác minh (gap probe không phân giải được tick app), nên ngưỡng này chưa được kiểm chứng ngoài đời ở biên — chỉ mới kiểm chứng ở 2,9× (B3-R2) và ≤1,32× (g1).
3. **Tick probe ≠ tick app (±1 tick, caveat W5 §6.3) — và hơn thế dưới tải:** gap rAF 300–1500 ms nên NHIỀU tick app có thể ẩn giữa 2 mẫu probe; chuỗi burst/advance trong 1 gap probe không phân giải được tới từng tick app. Verdict f4-like chỉ kết luận trên mẫu probe; số tailBursts là số đo trực tiếp từ hook nên không dính caveat này. Ca suýt-đếm f5 đợt 99 (nhiễm pause-seek) không lặp lại ở 6 lượt này (1 ca g5-14583 nhiễm pause-seek nhưng là NOT-HELD vì watch không sống đủ 2 tick — analyzer A3 đã cờ đúng).
4. **Phạm vi đo hẹp:** chỉ 1 clip 720p 6 s, WebKitGTK, GOP 30/250, load 1–4, 6 lượt; không đo Chromium; RAM khả dụng lúc đo ~2,7 GB (free lúc bắt đầu g1). Số đo là bằng chứng ngoài đời trên cấu hình này, không phải đảm bảo cho mọi clip/máy.
5. **G1 (deinterlace) vẫn mở, chờ user quyết** (metric G5 hay M2 — đợt 99 A9).
6. **Trần 5000 ms vẫn 0 nhả quan sát** (ứng viên trần g3: stall 5,80 s, ph vẫn đứng sau mốc) — chưa đo được hành vi trần.
7. **ci-security.yml vẫn 403** (chờ user); **TTS 39 và birefnet vẫn cấm**.
8. ARM-HELD §6 tăng lên 2/6 lượt (từ 1/18) — có thể là nhiễu mẫu nhỏ (6 lượt), không phải bằng chứng fix làm tăng ARM-HELD; chỉ ghi nhận, không kết luận.

## Phụ lục — file liên quan

- Fix + test: `apps/web/src/lib/playheadHold90R2.ts` (`PLAYHEAD_TAIL_BURST_RATE_MAX`, `lastTickMs`, `playbackRate`, `burstBlocked`), `apps/web/src/lib/playheadHold90R2.test.ts` (B3-R1..R9), `apps/web/src/preview.tsx` (chỉ vùng đuôi/grace + hook `__vcutTailBurstBlocked100B3`).
- Probe + analyzer: `apps/web/scripts/probe100b3.mjs`, `apps/web/scripts/analyze100b3-tail-expiry.mjs`.
- Log + dữ liệu thô: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round100-b3/` (`boot-id.txt`, `probe-webkit-load*-g*`, `analyze-g1-g6-b3.txt`, `analyze-g1-g6-a3.txt`, `final-regression.log`, `run-log.md`).
- Doc tiền lệ: `docs/PHASE9_ROUND99_A3_REARM_CANCELLED_LIMITS.md` §4.6 + §7 (nợ f4), `docs/PHASE9_ROUND97_Y4_REARM_LIMITS.md` (luật đuôi gốc).
- Stage (không push): `~/workspace/repo-1-push/paths-loop/phase9-round100-b3-tail-expiry.txt`.
