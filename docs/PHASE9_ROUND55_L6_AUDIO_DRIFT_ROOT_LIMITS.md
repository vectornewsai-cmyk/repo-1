# LIMITS — Phase 9, Đợt 55, Luồng L6: nguyên nhân GỐC của audio drift khi phát xuôi

Ngày: 07/11/2026 (lượt cron 09:35 +07). Repo: `~/workspace/repo-1`
(local; KHÔNG push từ phiên nền).
Nhiệm vụ: nợ K9 đợt 54 — audio re-seek còn sàn 9–11/lượt do drift gốc
(`docs/PHASE9_ROUND54_K9_AUDIO_RESEEK_LIMITS.md` §3.2/§3.4). Đo lại
drift gốc bằng sampler trong trang 50 ms, thử ≥ 2 hướng giảm drift
gốc, chỉ giữ hướng cải thiện rõ.

## 1. Nguyên nhân gốc (đo thật — và K9 đã suy sai một nửa)

### 1.1 Kịch bản đo
Harness mới `apps/web/scripts/probe-55l6-audio-drift.mjs` (dựa trên
probe K9, giữ nguyên fixture project mẫu 8 s + tone 440 Hz 8 s import
thật, 2 tiến trình `yes` đốt CPU, mẫu ngoài CDP 250 ms để so sánh
được với K9; THÊM sampler trong trang mỗi 50 ms đọc element thật qua
hook mới `__vcutMediaEls`, log event seeking/seeked/waiting trên
element AUDIO, chuỗi rAF riêng, và một AudioContext thăm dò độc lập).
Xvfb display riêng :156, TMPDIR riêng /tmp/vcut55l6, cổng dev
5481–5499 / debug 9671–9689 / tone 5581–5599 (không dùng chung với
luồng khác). Bằng chứng thô: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l6/drift-*.json`
(9 lượt) — kết quả từng lượt harness.
Lưu ý đo: sampler trong trang chạy trên main thread nên khoảng mẫu
thực tế chỉ p50 85–200 ms (p95 tới 430 ms) khi main thread bận — vẫn
tốt hơn hẳn poll CDP 250 ms của K9, nhưng không phải đúng 50 ms.

### 1.2 Phát hiện quyết định: drift là LỖI TỐC ĐỘ, không phải spike
K9 suy ra (từ mẫu 250 ms) rằng re-seek kích hoạt bởi "spike thoáng
qua giữa các mẫu". Đo 50 ms bác bỏ một nửa suy luận đó:

1. **Đồng hồ audio chạy CHẬM ĐỀU ~0,47–0,57× wall-clock dưới tải.**
   Ngoài lúc seeking, `currentTime` audio chỉ tiến 0,48–0,57× thời
   gian wall (3 lượt baseline: 0,48 / 0,49 / 0,57). Phân loại bước
   tiến theo tốc độ (dCt/dt): ~60–90% số bước ở vùng chậm (rate
   0,1–0,7), ~0–7% đóng băng, **0 cơn đóng băng ≥ 150 ms** trong
   cả 3 lượt baseline. Lag tăng đều ~0,44–0,47 s/s (tính theo từng
   đoạn giữa 2 lần seek), không phải tăng theo cơn.
2. **AudioContext thăm dò độc lập chạy chậm Y HỆT: 0,47–0,53×.**
   Một `AudioContext` mới, không nối element nào, `state=running`,
   mà `currentTime` của nó cũng chỉ tiến ~0,47–0,53× wall. Element
   audio (nối vào AudioContext của engine qua
   `createMediaElementSource`) chỉ bám theo đúng đồng hồ audio đó —
   element không hỏng, decoder không hỏng, mà **toàn bộ đồng hồ
   audio của Chromium bị đói CPU trên VM 2 vCPU đang tải cao**
   (load average 5–14 trong lúc đo, do các luồng đợt 55 khác chạy
   song song + 2 tiến trình `yes`). Khi tải giảm (base-noburn,
   load ~5,2), tốc độ audio nhích lên 0,57×; khi tải 13,7 chỉ còn
   ~0,48×. Đây là tính chất môi trường, không phải bug code.
3. **Playhead tiến ~1× wall NHƯNG NHẢY BÙ theo cơn.** Tỉ lệ
   playhead/wall 0,97–1,02; sau mỗi gap rAF dài (p95 200–430 ms,
   max tới 900 ms) playhead nhảy bù tới +0,43–0,50 s trong 1 tick
   (17 bước nhảy > 0,2 s ở base2). Mỗi cú nhảy cộng ngay ~0,3–0,5 s
   vào lag — đây mới là thành phần "spike" mà K9 thấy qua mẫu thưa:
   lag vừa tăng đều (audio chậm) vừa nhảy bậc (playhead bù).
4. **Seek vẫn chính xác và nhanh (khi CPU cho phép).** Seek tới
   target rồi đáp xuống chỉ tụt sau playhead ~0,02–0,07 s (đo ở mẫu
   ngay sau seek); độ dài seek p50 107–190 ms, p95 tới 602 ms.
   `waiting` bắn kèm mọi chu kỳ seek (9–11 lần/lượt) — element cạn
   dữ liệu render mỗi khi đồng hồ audio chậm lại, rồi syncMedia
   seek để đuổi kịp. Chuỗi đầy đủ: audio chậm đều → lag tăng
   0,44–0,47 s/s → chạm ngưỡng 0,35 s sau ~0,6–0,9 s → seek (đáp
   ~0,03 sau) → lặp lại → **7–8 audio re-seek / 8 s**.
5. **Giải thích lại số 0 trong `lagAtReseek` của K9.** Với lag tăng
   đều 0,45 s/s thì lag không thể từ 0 vọt lên > 0,35 trong 250 ms
   giữa 2 mẫu K9 — các số 0 đó là mẫu rơi đúng lúc seek vừa đáp
   (lag ~0,02–0,06, làm tròn 0,000 ở 3 chữ số thập phân trong một số
   lượt) rồi seek tiếp theo kích hoạt sau đó trong cùng khoảng mẫu.
   Không có spike bí ẩn nào nữa.

### 1.3 Baseline TRƯỚC sửa (code K9, 3 lượt)

| Lượt | Load | FPS | Tỉ lệ ph/wall | Re-seek (V/A) | Lag mean/max | Audio rate | Tăng lag/s | Ctx slope |
|---|---|---|---|---|---|---|---|---|
| base1 | 8,2→5,4 | 10 | 0,986 | 13 (5/8) | 0,206/0,464 | ~0,48\* | ~0,47\* | ~0,47\* |
| base2 | 6,7→5,4 | 8,6 | 0,974 | 9 (1/8) | 0,189/0,375 | 0,49 | ~0,44\* | 0,476 |
| base-noburn† | 5,4→5,2 | 7,5 | 1,016 | 9 (2/7) | 0,234/0,462 | 0,571 | ~0,47\* | 0,528 |

\* base1: harness cũ báo audio rate 0,70 / ctx slope 0 do 2 bug phân
tích (phân loại bước theo dCt tuyệt đối thay vì tốc độ; hồi quy
ctxT tính t bằng ms mà ctxT bằng giây) — đã sửa harness rồi tính lại
bằng Python từ mẫu thô: audio rate 0,48, ctx slope 0,47, tăng lag
0,47/s. base2/base-noburn: tăng lag tính lại bằng Python (hồi quy
toàn cửa sổ trên dữ liệu răng cưa ra ~0 — đã sửa thành tính theo
từng đoạn giữa 2 seek): 0,436 / 0,465.
† base-noburn đặt `BURNERS=0` nhưng VM vẫn tải ~5,2 do các luồng đợt
55 khác — "không đốt" không có nghĩa là "không tải" (giống cảnh báo
after3 của K9). Chưa có lượt nào đo ở VM thực sự nhàn.

## 2. Hướng đã thử

### 2.1 Hướng C — playbackRate catch-up (GIỮ LẠI)
**Lý do thử, đối chiếu §3.4 K9:** K9 chưa làm vì (a) cho rằng drift
là "đóng băng theo cơn" — §1.2 trên bác bỏ: drift tăng đều, 90% bước
ở vùng chậm, 0 cơn đóng băng ≥ 150 ms; (b) "playbackRate bị gán lại
mỗi tick" — luật này được cài ĐÚNG chỗ gán duy nhất đó (syncMedia),
không có vòng điều khiển thứ hai; (c) "chưa đo trên máy thật" — vẫn
đúng (xem §5): trên máy thật audio 1× thì drift < 0,08 s nên luật
này là no-op, không ảnh hưởng gì.
**Cơ chế:** tốc độ tiến của media time = tốc độ render của audio
thread × playbackRate. Khi audio thread chỉ render được ~0,5×, đặt
rate 1,5× thì media time tiến ~0,75× thay vì 0,5×.
**Đã làm:** helper thuần mới `forwardCatchUpRate` trong
`apps/web/src/lib/playheadPacing.ts` + nối vào nhánh forward của
`syncMedia` (`apps/web/src/preview.tsx`), chỉ element AUDIO:
- drift (target − currentTime) trong (0,08, 0,35] → rate =
  speed × (1 + min(0,5; drift × 1,5)): drift 0,1 → 1,15×; 0,2 →
  1,3×; ≥ 0,34 → trần 1,5×. Drift ≤ 0,08 → giữ speed; drift vượt
  ngưỡng seek 0,35 → giữ speed để seek xử lý; drift âm (audio chạy
  trước) → chậm lại tối đa −15%.
- Không bù khi đang seeking / tick vừa hoàn tất seek.
- Giữ `clip.speed`: rate = speed × hệ số bù.
- Tránh đảo rate 2 lần/tick: nhánh gán `speed` ở đầu vòng lặp được
  bỏ qua với AUDIO phát xuôi (nhánh forward tự gán rate catch-up).
  Video giữ nguyên rate = speed.
**Đo SAU sửa (4 lượt, burners=2):**

| Lượt | Load | FPS | Tỉ lệ ph/wall | Re-seek (V/A) | Lag mean/max | Audio rate | Tăng lag/s | Ctx slope |
|---|---|---|---|---|---|---|---|---|
| rate1 | 11,1→13,7 | 12 | 1,000 | 6 (1/5) | 0,220/0,344 | 0,65 | 0,285 | 0,511 |
| rate2 | 13,7→11,1 | 10 | 0,990 | 9 (4/5) | 0,218/0,373 | 0,676 | 0,147 | 0,556 |
| final1 | 6,7→6,6 | 15 | 1,001 | 8 (0/8) | 0,181/0,353 | 0,635 | 0,223 | 0,528 |
| final2 | 2,5→1,9 | 30 | 0,996 | 6 (0/6) | 0,177/0,347 | 0,612 | 0,323 | 0,484 |

**Kết quả (trung bình catch-up vs baseline):**
- Audio re-seek: **7,7 → 6,0/lượt (−22%)**, các lượt 5, 5, 8, 6 —
  đều < 9 (tiêu chí giữ). 2/4 lượt giảm rõ (5 vs 7–8); final1 ra 8
  do seek chậm bất thường đợt đó (p50 195 ms, p95 425 ms — xem §4).
- Tốc độ audio ngoài seek: **0,48–0,57 → 0,61–0,68** (cả 4 lượt
  đều cao hơn mọi lượt baseline) — cơ chế bù rate hoạt động đúng
  như lý thuyết.
- Tăng lag: **~0,45 → 0,15–0,32/s** (giảm ~một nửa).
- Lag trung bình (mẫu ngoài): 0,210 → 0,199 (tương đương); lag max
  (mẫu ngoài): 0,434 → 0,354 (giảm).
- Video re-seek: 2,7 → 1,25/lượt (không phá video; số này vốn phụ
  thuộc tải mạnh). Tỉ lệ playhead/wall giữ ~1,0; tickErrorDelta = 0
  mọi lượt; 0 lỗi console/CDP mới.
- Rate áp dụng trung bình 1,25–1,26× (min 1,0 / max 1,5), số lần
  `ratechange` 58–138/lượt (~7–17/s, tăng theo fps) — các bước điều
  chỉnh nhỏ, liên tục theo drift. Chưa đo cảm nhận pitch/artefact
  trên nhạc/lời thật (fixture là tone 440 Hz liên tục nên đổi tempo
  không nghe được — xem §5).
**Quyết định: GIỮ.** Đạt tiêu chí giữ (audio re-seek < 9 mọi lượt,
lag trung bình không tăng, lag max giảm, video không phá). Đây là
giảm nhẹ (mitigation), không phải chữa gốc: đồng hồ audio vẫn chậm
do đói CPU; catch-up chỉ bù một phần.

### 2.2 Hướng B — seek-with-lead (ĐÃ THỬ, ĐÃ REVERT)
**Ý tưởng:** seek mất ~0,1–0,2 s, trong lúc seek playhead vẫn tiến
nên element đáp xuống tụt sau ~thời gian seek. Seek tới
target + lead (lead = EMA độ dài seek, trần 0,2 s) để đáp đúng
playhead hơn. Chỉ AUDIO; video giữ seek chính xác từng frame.
**Đo SAU sửa (trên catch-up, 2 lượt):**

| Lượt | Load | FPS | Re-seek (V/A) | Lag mean/max | Audio rate | Tăng lag/s | Landing |
|---|---|---|---|---|---|---|---|
| lead1 | 2,6→6,3 | 12 | 9 (3/6) | 0,175/0,433 | 0,575 | 0,391 | tới −0,151 |
| lead2 | 6,3→10,2 | 15 | 12 (4/8) | 0,188/0,375 | 0,562 | 0,372 | tới −0,083 |

**Kết quả âm tính — đã revert toàn bộ code lead** (helper
`updateSeekLeadEma`, WeakMap `forwardSeekStartMs`/`forwardSeekLeadS`,
mọi dòng trong `preview.tsx`; grep xác nhận 0 tham chiếu còn lại):
- Audio re-seek KHÔNG giảm: 6, 8 (so với catch-up đơn 5, 5, 8, 6)
  — lead1 ra 6, lead2 ra 8, tức tệ hơn hoặc bằng.
- **Overshoot có thật:** landing âm (audio đáp TRƯỚC playhead)
  tới −0,151 s (lead1) và −0,083 s (lead2), trong khi catch-up đơn
  landing chỉ tới −0,039. Nguyên nhân đúng như đã lường trước khi
  cài: độ dài seek đo bằng tick phát hiện hoàn tất bao gồm trễ 1
  tick (rAF gap 100–400 ms dưới tải) nên EMA ước cao hơn seek thật
  → lead quá lớn → đáp trước. Trừ khi đo độ dài seek bằng event
  `seeked` chính xác (chưa làm — tốn thêm listener production),
  hướng này không cứu được.
- (b) pre-buffer/seek chính xác hơn trước khi phát: KHÔNG cần làm
  thêm — forceSeek lúc bấm Phát đã đáp đúng (target 0, durMs 1 ms),
  và seek thường đáp ~0,03 sau playhead; độ chính xác seek không
  phải nút thắt.
**Hướng (a) AudioContext làm clock chuẩn:** đã phân tích bằng số
liệu thay vì cài đặt — element đã bám đúng đồng hồ AudioContext
(ctx slope ≈ audio rate, §1.2.2), nên lấy ctx làm chuẩn cho playhead
đồng nghĩa với việc playhead cũng chạy 0,5× (preview slow-motion
dưới tải) — đổi hẳn ngữ nghĩa pacing mà vòng lặp giữ từ đợt 29
(playhead ~1× wall). Không cài; ghi lại để đợt sau cân nhắc nếu
user chấp nhận trade-off này.

## 3. Đã sửa gì (giữ lại)

**Production:**
- `apps/web/src/lib/playheadPacing.ts` — `forwardCatchUpRate`,
  `FORWARD_CATCH_UP_START_S = 0,08`,
  `FORWARD_CATCH_UP_MAX_EXTRA = 0,5`,
  `FORWARD_CATCH_UP_MAX_SLOW = 0,15` (+ chú thích đối chiếu §3.4 K9).
- `apps/web/src/preview.tsx` — nhánh forward của `syncMedia` gán
  rate catch-up cho AUDIO; đầu vòng lặp bỏ qua gán speed với AUDIO
  phát xuôi (tránh đảo rate 2 lần/tick); hook đo mới
  `__vcutMediaEls` (tham chiếu element thật cho sampler 50 ms —
  cùng mẫu hook đo `__vcutMediaState` đã có, chỉ phục vụ đo).
- `apps/web/tsconfig.json` — exclude file test mới (theo mẫu K9).

**Test:** `apps/web/src/lib/playheadPacing55L6.test.ts` (mới, 12/12:
ngưỡng bắt đầu bù, bù tỉ lệ gain 1,5/s, trần +50%, chậm lại −15%,
không bù khi seeking/vừa hoàn tất seek, giữ clip.speed, maxExtra
tùy chọn, đầu vào lạ).

**Harness headed:** `apps/web/scripts/probe-55l6-audio-drift.mjs`
(mới; sampler trong trang 50 ms + probe AudioContext + event log;
L6_* env; display :156; retry nút Phát tối đa 3 lần vì check 300 ms
của K9 quá nhanh dưới tải nặng — lần đầu chạy base1 đã lỗi đúng chỗ
này rồi retry cứu được).

**Không đưa vào batch:** `apps/web/dist/` (build ghi ra),
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l6/`
(log + JSON thô 9 lượt đo), `/tmp/vcut55l6/` (profile Chrome + TMPDIR).

## 4. Kiểm chứng hồi quy (số thật)

- Unit mới `playheadPacing55L6`: **12/12** (đỏ-trước: test import
  helper chưa tồn tại trước khi cài — 1 lần fail do chính test tính
  sai 0,333×1,5=0,4995, đã sửa test dùng 0,34).
- Hồi quy: `playheadPacing54K9` 11/11, `audioEngine52I2` 15/15,
  `audioEngine44Z2` 6/6, `previewEngine` 14/14,
  `previewEngine51H6` 15/15, `playheadPacingRound29L2` 10/10,
  `playheadPacing53J5` 5/5, `reversePlayback` 10/10,
  `reversePlaybackRound28L2` 17/17, `reversePlaybackRound39T6` 10/10.
- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- `npm run build` (apps/web): **PASS** (16,59 s; chỉ cảnh báo chunk
  > 500 kB có sẵn từ trước).
- Headed xác nhận cuối (code cuối cùng, đã revert lead): final1 +
  final2 — audio re-seek 8 và 6, video 0 và 0, tickErrorDelta 0,
  ratio 1,001 và 0,996, 0 lỗi mới.

## 5. Nợ mở / chưa làm được

1. **Drift gốc vẫn là môi trường, chưa chữa dứt.** Catch-up chỉ bù
   một phần (audio rate 0,51 → 0,64). Trên máy thật / thiết bị audio
   thật, đồng hồ audio có thể đã chạy 1× và toàn bộ vấn đề này
   không tồn tại — **chưa đo trên máy thật**, nên đừng trích số
   5–6 re-seek/lượt như hằng số sản phẩm. Nếu trên máy thật drift
   vẫn còn thì mới xét tăng trần bù hoặc pacing playhead theo đồng
   hồ audio (§2.2 cuối).
2. **Số re-seek/lượt dao động lớn theo độ dài seek tức thời**
   (p50 5–195 ms giữa các lượt; final1 ra 8 vì seek chậm p50
   195 ms + playhead nhảy bù trong lúc seek khiến element đáp xuống
   đã tụt ~0,33 s). Sàn thực sự bây giờ là độ dài seek, không còn
   là tốc độ drift nữa. Muốn hạ thêm phải rút ngắn seek (decode
   nhanh / pre-decode) — hướng khác, chưa làm.
3. **Chưa đo cảm nhận:** pitch/artefact của rate 1,15–1,5× trên
   nhạc/lời thật (fixture tone 440 Hz không đo được); tempo trung
   bình 1,25× là nghe rõ trên nhạc/lời nếu tải nặng kéo dài. Chưa
   đo: clip dài > 8 s, nhiều clip audio đồng thời (mỗi element có
   rate riêng — đúng thiết kế — nhưng chưa đo thực tế), Safari, máy
   thật.
4. **Sampler 50 ms thực tế chỉ 85–200 ms** (main thread bận) —
   muốn bắt spike < 100 ms thì cần sampler chạy ngoài main thread
   (worker) hoặc đọc trực tiếp từ vòng preview; hiện tại đủ để kết
   luận drift tăng đều (đoạn tăng lag 0,44–0,47 s/s đã rõ).
5. Harness: lần chạy base1 đầu tiên lỗi "bấm Phát không có tác dụng"
   (check 300 ms quá nhanh dưới tải) — đã thêm retry 3 lần; socket
   X156 stale sau kill phải xóa tay (`rm /tmp/.X11-unix/X156`) —
   harness tự kiểm tra socket tồn tại thì lỗi thay vì dùng chung,
   nhưng không tự dọn socket stale của chính nó.

## 6. Môi trường / ghi chú vận hành
- VM 2vCPU/8GB, nhiều luồng đợt 55 chạy song song: load average
  1,85–13,71 giữa các lượt; FPS 7,5–30 tùy tải — số tuyệt đối chỉ
  có nghĩa khi kèm load/fps lúc đo (xem bảng §1.3/§2.1).
- Harness tự chọn cổng trống (dev 5481–5499, debug 9671–9689, tone
  5581–5599), Xvfb :156 riêng, TMPDIR /tmp/vcut55l6 riêng.
- KHÔNG push/tag/release từ phiên này (luật cứng).
