# LIMITS — Phase 9, Đợt 54, Luồng K9: audio re-seek nhánh forward

Ngày: 07/11/2026 (lượt cron 06:35 +07). Repo: `~/workspace/repo-1`
(local; KHÔNG push từ phiên nền).
Nhiệm vụ: audio re-seek ~10–12/lượt KHÔNG đổi sau sửa clamp dt đợt 53
J5 (`docs/PHASE9_ROUND53_J5_PROXY_PREVIEW_LIMITS.md` §6(b) +
`docs/PHASE9_ROUND53_LIMITS.md` §4.7) — điều tra nguyên nhân gốc, sửa
nhánh forward của `syncMedia`, đo trước–sau bằng cùng 1 harness.

## 1. Nguyên nhân gốc (đo thật, không phải đoán)

### 1.1 Kịch bản đo
Harness mới `apps/web/scripts/probe-54k9-audio-reseek.mjs` (dựa trên
probe J5, lấy mẫu mỗi 250 ms thay vì 500 ms, thêm thống kê độ tụt
audio theo từng mẫu): vite dev + Chromium headed qua Xvfb + CDP,
project mẫu 8 s + clip audio tone 440 Hz 8 s import thật, 2 tiến trình
`yes` đốt CPU trong cửa sổ phát (tái hiện VM tranh chấp như J5).
Số đo chính: re-seek/lượt (tách video/audio qua
`__vcutSyncReseeks*`), độ tụt audio = playhead − `currentTime` element
AUDIO theo từng mẫu (mean/p50/p95/max, tỉ lệ mẫu > 0,35 s), số mẫu
AUDIO đang `seeking`, lag ngay trước/sau mỗi lần re-seek audio.
Bằng chứng thô: `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
(không stage): xem `k9-*.json` — kết quả từng lượt harness.

### 1.2 Baseline TRƯỚC sửa (2 lượt, code cũ)

| Lượt | Tỉ lệ playhead/wall | Re-seek tổng (video/audio) | Lag audio mean/p50/p95/max | Mẫu lag > 0,35 s | Mẫu AUDIO seeking |
|---|---|---|---|---|---|
| before1 | 1,011 | 16 (5/11) | 0,158 / 0,189 / 0,326 / 0,326 | 0/20 | 8/20 (40%) |
| before2 | 0,995 | 18 (6/12) | 0,138 / 0,136 / 0,308 / 0,308 | 0/20 | 6/20 (30%) |

Hai phát hiện quyết định (đều từ mẫu thô `drift-before*.json`):
1. **Lag lấy mẫu KHÔNG BAO GIỜ vượt 0,35 s** (max 0,326) nhưng
   re-seek vẫn kích hoạt 11–12 lần — các lần seek kích hoạt bởi
   spike thoáng qua giữa các mẫu, không phải drift tăng đều.
   `lagAtReseek` (lag ở mẫu ngay TRƯỚC mỗi lần re-seek tăng) có
   **4–5/11 giá trị bằng 0** (vd before1:
   `[0,269; 0; 0,266; 0,254; 0,326; 0; 0,2; 0,188; 0,268; 0; 0]`) —
   tại thời điểm lấy mẫu lag = 0 mà giữa 2 mẫu vẫn có seek phát ra.
2. **Element AUDIO đóng băng ở target cũ trong lúc seeking.**
   Vd before1: `ct=4,500, seeking=1` kẹt qua 2 mẫu liên tiếp
   (playhead 4,5 → 4,7) trong khi `reseeksAudio` tăng 6 → 7 ngay
   trong khoảng đó. Chromium trả `currentTime` = target của seek
   đang bay; playhead vẫn tiến nên |currentTime − target| lại vượt
   0,35 s → nhánh forward (không kiểm tra `el.seeking`) phát seek
   MỚI chồng lên seek cũ → decoder restart, seek cũ không bao giờ
   hoàn tất. Đúng mẫu bệnh L2 đã gặp ở nhánh reverse (410/426 seek
   bị thay thế trước khi hoàn tất, đợt 28 L2).

### 1.3 Cơ chế dư (đo được, KHÔNG sửa được bằng chặn nhịp)
Giữa các lần seek, `currentTime` audio chỉ tiến ~0,5× tốc độ playhead
theo từng đợt (vd after1: playhead +0,6 s thì audio chỉ +0,345 s),
xen kẽ những cơn đóng băng ~300–600 ms (audio gần như không tiến,
vd after2b: playhead 3,733 → 4,100 mà audio chỉ 3,430 → 3,589).
Đây là đồng hồ audio bị đói CPU dưới tải (luồng render audio của
Chromium trên VM 2 vCPU tranh chấp với các luồng đợt 54 chạy song
song — load average có lúc 13,84): element đóng băng rồi nhảy, không
phải chạy chậm đều. Cộng thêm seek chậm (~300–400 ms dưới tải):
seek hoàn tất thì playhead đã tiến ~0,3 s nên element rơi lại ~0,3 s
sau target → lại đủ điều kiện seek tiếp. Hai cơ chế này đặt sàn cho
số re-seek audio (~9–11/lượt) mà chặn nhịp không thể hạ thêm — xem
§3.4. **KHÔNG đo trên máy thật / thiết bị audio thật**, nên chưa biết
độ tụt này có tồn tại ngoài VM này không (xem §5).

## 2. Đã sửa gì

**Không chạm `audioEngine.ts`** (đúng như J5 đã cố tình giữ — file
dùng chung, vấn đề nằm ở `syncMedia`, không phải engine).

### 2.1 Luật mới — nhánh forward mirror nhánh reverse (L2/T6)
File `apps/web/src/preview.tsx`, nhánh `else` (phát xuôi) của
`syncMedia`; helper thuần mới trong `apps/web/src/lib/playheadPacing.ts`
(`shouldIssueForwardReseek`, `FORWARD_RESEEK_THRESHOLD_S = 0,35`,
`FORWARD_RESEEK_CONFIRM_TICKS = 2`):
1. **Đang seeking → KHÔNG phát seek mới** (chờ seek cũ hoàn tất).
2. **Tick vừa hoàn tất seek → KHÔNG phát seek mới** (1 tick ổn định,
   dùng chung `steppingPrevSeeking` + `justCompletedSeek` với nhánh
   reverse).
3. **Drift phải vượt ngưỡng 2 tick LIÊN TIẾP mới seek** (đếm chuỗi
   không đứt đoạn qua WeakMap `forwardDriftOverCount` theo element;
   chuỗi đứt → đếm lại từ đầu — lọc jitter 1 tick).
Ngưỡng giữ đúng 0,35 s cũ; drift thật tăng đều vẫn seek, chỉ chậm
tối đa 1 tick so với cũ. `forceSeek` (cạnh lên nút Phát) giữ nguyên
đường riêng, seek ngay, không qua chặn nhịp. Bộ đếm
`__vcutSyncReseeks*` giữ nguyên ngữ nghĩa (đếm cả forceSeek) để
trước–sau so sánh được.

### 2.2 Test mới
`apps/web/src/lib/playheadPacing54K9.test.ts`: **11/11** (ngưỡng,
xác nhận 2 tick, chuỗi đứt đếm lại, chặn khi seeking, chặn ở tick
vừa hoàn tất, overCount lạ NaN/âm, ngưỡng tùy chọn). Thêm exclude
cho file test vào `apps/web/tsconfig.json` (theo đúng mẫu các file
test khác — import `.ts` cần exclude).

## 3. Đo SAU sửa (cùng harness, cùng kịch bản)

| Lượt | Tỉ lệ playhead/wall | Re-seek tổng (video/audio) | Lag audio mean/p50/p95/max | Mẫu lag > 0,35 s | Mẫu AUDIO seeking |
|---|---|---|---|---|---|
| after1 | 1,013 | 11 (0/11) | 0,175 / 0,156 / 0,324 / 0,359 | 1/25 | 0/25 (0%) |
| after2b | 0,992 | 10 (1/9) | 0,219 / 0,203 / 0,404 / 0,511 | 2/25 | 2/25 (8%) |
| after3-noburn* | 1,020 | 16 (5/11) | 0,208 / 0,208 / 0,410 / 0,410 | 3/20 | 7/20 (35%) |

\* after3 đặt `K9_BURNERS=0` nhưng VM vẫn nặng do các luồng đợt 54
chạy song song (fps chỉ ~12, gap p50 83 ms) — "không đốt" không có
nghĩa là "không tải". Xem §3.3.
Lượt after2 (đầu) harness lỗi CDP timeout 60 s khi VM load 13,84 —
chỉ có dữ liệu dở tới playhead 7,4 s (audio 9, video 2), không tính
vào bảng; chạy lại thành after2b.

### 3.1 Cải thiện thật
- **Tổng re-seek: 16–18 → 10–11 (−35–40%) ở 2/3 lượt sạch.**
  Động lực chính là **video: 5–6 → 0–1** (churn ở biên clip ~4 s
  hết hẳn ở tải vừa — nhánh forward của video cũng được chặn nhịp).
- **Seek chồng hết:** `lagAtReseek` sau sửa toàn 0,23–0,36 (seek
  kích hoạt bởi drift thật, không còn số 0 — after1:
  `[0,3; 0,246; 0,359; 0,317; 0,247; 0,243; 0,317; 0,229; 0,324;
  0,275; 0,257]`); seek rơi gần playhead hơn (`lagAfterReseek`
  0,0–0,16, tập trung ~0,06–0,1, so với trước 0,1–0,2).
- **Tỉ lệ playhead/wall giữ ~1,0** (0,992–1,020), `tickErrorDelta = 0`
  mọi lượt, 0 lỗi console/CDP mới. Không phá đồng bộ ở mức trung bình.

### 3.2 Hạn chế trung thực — audio chỉ giảm nhẹ
- **Audio: 11–12 → 9–11/lượt.** KHÔNG đạt "giảm rõ rệt" cho riêng
  audio. Sàn ~9–11 do 2 cơ chế ở §1.3 (đồng hồ audio đói CPU +
  seek chậm rơi lại ~0,3 s) — chặn nhịp chỉ gỡ được phần seek chồng,
  không gỡ được drift gốc.
- **Lag trung bình tăng nhẹ: 0,14–0,16 → 0,18–0,22 s** (+0,04–0,06 s);
  lag max thoáng qua tăng trong 1 lượt (0,511 ở after2b vs 0,326
  trước — cơn stall 370 ms mà seek tới chậm hơn ~1 tick do xác nhận
  2 tick; phần lớn mức tăng max là stall, không phải trễ xác nhận).
  Mức này vẫn trong vùng tụt 0,2–0,3 s mà J5 đã ghi là trạng thái
  trước đây, nhưng là đánh đổi có thật: ít giật do seek hơn, đổi lại
  độ tụt trung bình nhỉnh hơn một chút.

### 3.3 after3-noburn: cảnh báo về phương sai theo tải
Lượt này tổng re-seek quay lại 16 (video 5, audio 11) dù đã sửa —
VM lúc đó chỉ chạy ~12 fps vì các luồng đợt 54 khác đang nặng.
Kết luận: **số re-seek tuyệt đối phụ thuộc mạnh vào tải VM lúc đo**
(9–11 ở 30–60 fps, 11–16 ở ~9–12 fps); hiệu quả của fix ổn định
nhất ở 2 chỉ số không phụ thuộc tải tuyệt đối: (a) video re-seek
về ~0 ở tải vừa, (b) `lagAtReseek` không còn số 0 (seek nào cũng
do drift thật). Đừng trích số 10–11 như hằng số của sản phẩm.

### 3.4 Vì sao KHÔNG làm thêm catch-up bằng playbackRate
Đã cân nhắc (bù drift 0,15–0,35 s bằng rate 1,05–1,1× thay vì seek):
không làm, vì (a) drift gốc là đồng hồ audio đóng băng theo cơn
dưới tải, không phải lệch tốc độ đều — rate bù không sửa được cơn
đóng băng; (b) `playbackRate` đang bị `syncMedia` gán lại bằng
`clip.speed` mỗi tick, vòng điều khiển rate sẽ đánh nhau với speed
effect; (c) chưa đo trên máy thật — có thể drift này chỉ tồn tại
trên VM headless này. Để đợt sau, sau khi đo trên máy thật.

## 4. Kiểm chứng hồi quy (số thật)

- Unit mới `playheadPacing54K9`: **11/11**.
- Hồi quy: `audioEngine52I2` 15/15, `audioEngine44Z2` 6/6,
  `previewEngine` 14/14, `previewEngine51H6` 15/15,
  `playheadPacingRound29L2` 10/10, `playheadPacing53J5` 5/5,
  `reversePlayback` 10/10, `reversePlaybackRound28L2` 17/17,
  `reversePlaybackRound39T6` 10/10.
- `npx tsc --noEmit` (apps/web): **0 lỗi** — chạy lần đầu (trước khi
  K7 sửa file đó) cho 0 lỗi toàn chương trình; sau khi K7 sửa xong
  (00:13:22 UTC 07/11) chạy lại vẫn 0 lỗi.
- `npm run build` (apps/web): **PASS** (14,20 s; chỉ cảnh báo chunk
  > 500 kB có sẵn từ trước). 2 lần chạy trước bị chặn bởi lỗi cú pháp
  của K7 (`rehydrate36S5.ts:254`, xem §5) — không phải do code K9;
  sau khi K7 sửa xong thì build xanh. Vite dev cũng đã phục vụ thành
  công cả 4 lượt headed sau sửa (after1/after2/after2b/after3) với
  `preview.tsx` + `playheadPacing.ts` đã sửa.

## 5. Nợ mở / chưa làm được

1. **Lỗi cú pháp của luồng K7** (`apps/web/src/lib/rehydrate36S5.ts:254`):
   `checkProxyUrl?(url: string) => Promise<ProxyLiveness>;` trong
   interface phải là `checkProxyUrl?: (url: string) => ...` hoặc
   `checkProxyUrl?(url: string): Promise<...>` — thiếu `:`/`?:`.
   File sửa lúc 00:09:40 UTC 07/11, làm `tsc`/`npm run build` đỏ
   trong lúc K9 kiểm chứng (2 lần build fail) — **K9 KHÔNG tự sửa
   file của luồng khác**. K7 đã tự sửa xong lúc 00:13:22 UTC 07/11;
   chạy lại sau đó: `tsc` 0 lỗi, `npm run build` PASS (14,20 s).
   Nợ này đã đóng trong lúc K9 làm việc, ghi lại để khỏi nhầm là
   lỗi của K9.
2. **Audio re-seek còn ~9–11/lượt** do drift gốc (§1.3) — cần đo
   trên máy thật / thiết bị audio thật để biết có phải bệnh của VM
   headless không; nếu còn thì mới xét catch-up rate (§3.4).
3. Chưa đo: FPS cao, Safari, máy thật, clip dài > 8 s, nhiều clip
   audio đồng thời (mỗi element có WeakMap đếm riêng — đúng thiết
   kế — nhưng chưa đo thực tế).
4. Mở: tick mà seek vừa hoàn tất, `currentTime` có thể vẫn đọc
   target cũ trong 1 tick (Chromium) — grace tick đã bao, nhưng
   chưa đo riêng hiệu ứng này khỏi 2-tick confirm.

## 6. File đã chạm (đợt này)

**Production** (không chạm `audioEngine.ts`):
- `apps/web/src/lib/playheadPacing.ts` — `FORWARD_RESEEK_THRESHOLD_S`,
  `FORWARD_RESEEK_CONFIRM_TICKS`, `shouldIssueForwardReseek`
- `apps/web/src/preview.tsx` — nhánh forward dùng helper mới +
  WeakMap `forwardDriftOverCount` (import thêm
  `shouldIssueForwardReseek`)
- `apps/web/tsconfig.json` — exclude `playheadPacing54K9.test.ts`

**Test:** `apps/web/src/lib/playheadPacing54K9.test.ts` (mới, 11/11).

**Harness headed:** `apps/web/scripts/probe-54k9-audio-reseek.mjs`
(mới; K9_* env, mẫu 250 ms, thống kê lag audio).

**LIMITS:** `docs/PHASE9_ROUND54_K9_AUDIO_RESEEK_LIMITS.md` (file này).

**Không đưa vào batch:** `apps/web/dist/` (build ghi ra),
fixture/scratch `~/workspace/tmp-round54-k9/reseek/` (log/result
JSON các lượt đo — bằng chứng, ngoài repo).

## 7. Môi trường / ghi chú vận hành
- VM 2vCPU/8GB, nhiều luồng đợt 54 chạy song song: load average
  tới 13,84; 1 lượt harness lỗi CDP timeout 60 s (after2) — chạy lại
  thành after2b. FPS giữa các lượt dao động 9–60 tùy tải sibling —
  số tuyệt đối chỉ có nghĩa khi kèm fps/load lúc đo.
- Shell đôi khi chặn ghi file có mtime cũ (EPERM) — không gặp ở
  lượt này.
- Harness tự chọn cổng trống (dev 5281–5299, debug 9471–9489,
  tone 5381–5399, Xvfb :90–:99) vì nhiều luồng chạy cùng lúc.
