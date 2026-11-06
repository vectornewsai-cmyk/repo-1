# Phase 9 đợt 48, luồng D5 — Probe: khóa cơ chế "10 lần thử seek 20 timeout không gán currentTime" + mốc trung gian WEBCODECS → failed + trần 1000 trên đường sync — LIMITS

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo.
KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ C6/Z5/A5/B5).

Đọc trước: `docs/PHASE9_ROUND47_C6_PROBE_COMPAT_LIMITS.md` §1.2/§1.4/§3.2/§7
(nợ §4.7: test khóa cơ chế 10-lần-thử-seek-20, mốc trung gian
WEBCODECS → failed, trần 1000 đường sync), `docs/PHASE9_ROUND46_B5_PROBE_LIMITS.md`
§5, `apps/web/src/lib/pauseSeekCap42X2.ts` (cap 10), `apps/web/src/lib/pauseSeekRecovery43Y2.ts`
(phục hồi drop element), `apps/web/src/lib/seek.ts` (N1: seeking → chỉ chờ, không gán).

## 0. Kết luận ngắn

1. **Test khóa cơ chế "10 lần thử seek 20 timeout mà không gán currentTime" — XONG, 7/7 xanh.** Đỏ-trước: cùng assertions với seek "ngây thơ" luôn gán (tiền-N1) thì FAIL — 10 lần thử gán 10 lần (`/tmp/round48-d5/red-check.mjs`, exit 1, `10 !== 0`); xanh-sau trên code thật (seekElement/seekAll + classify/advance/plan/maySleep): 10 lần thử đều timeout, 0 lần gán, trạng thái cuối khớp đúng endIdle C6 (count 10, exhausted, kind timeout, target 20, recreated 1, seeking 1). File `apps/web/src/lib/seekStuckNoAssign48D5.test.ts`.
2. **Mốc trung gian WEBCODECS → failed — ĐÃ GHI ĐƯỢC, 10/10 PASS.** Hook MutationObserver + poll 50 ms trong trang: badge hiện `◀ NGƯỢC: WEBCODECS` trước khi bấm Phát; bấm Phát ở tMs 28382,5; **lật sang failed ở tMs 28457,5 — độ trễ flip 75,0 ms**, bắt bằng mutation (không phải poll). Không có trạng thái trung gian: 3 mutation cùng 1 ms, text+title+nền amber đổi trong cùng một lần render React. Poll ngoài chỉ thấy ở 0,3 s — đúng như C6 nói "≤ ~1 s" nhưng số thật nay là 75 ms.
3. **Trần 1000 trên đường sync — ĐÃ CHẠM, capHit=true.** Episode scrub liên tục 30 bước / 31,1 s: entry k=1 (seek 5) tích lũy **1000 mẫu giữ + 88 dropped = 1088 tick** trong 35,6 s seeking (~28 mẫu/s under-load), mẫu thứ 1000 ở +35,8 s sau request. Trong suốt 30 lần scrub, entries giữ nguyên 2 và count giữ 0 — không một lần gán mới nào, đúng như thiết kế. Bound C6 (<780 cho episode seek đơn) bị vượt vì scrub liên tục reset cap + supersede lần thử trước; bound mới: trần 1000 chạm được khi thời gian seeking × tốc độ rAF ≥ ~1000.
4. Hồi quy: B5 5/5, A6 12/12, seek.test 15/15, tsc 0 lỗi. B6 7/8 và Z6 9/10 — test fail duy nhất ở mỗi bộ là snapshot đếm key i18n (971 so với 968) do luồng D4 đợt 48 thêm 3 key toggle GOP trong lúc chạy; parity vi=en vẫn giữ (971=971, 0 key lệch một bên). Không phải do D5, không sửa (xem §5).

## 1. Cơ chế được khóa — tái dựng từ evidence C6 (không đoán)

Trước khi viết test, luồng này đọc lại evidence sync2 của C6
(`~/workspace/tmp-round47-c6/sync2/sync-cap-evidence.json`,
tailSamples + endIdle từng phase) thay vì chỉ đọc LIMITS C6.
Chuỗi sự kiện đã xác nhận bằng số đo (không còn là suy luận):

- **S2 (scrub 5, drip):** tails cho thấy `seekFailureCount` leo
  0 → 2 → 3 → 5 → 6 → 8 → 10 trong 13,4 s, `entries` giữ nguyên 2
  suốt phase — tức sau lần gán đầu tạo entry k=1, 9 lần retry sau
  KHÔNG gán lần nào. Hết S2: count 10, exhausted true, target 5,
  recreated 1, seeking 1.
- **Khoảng giữa S2 → S3 (bấm Proxy lần 2, gắn hang URL):** tail
  đầu S3 (atSec 1,0) đã có `entries = 3`, `lastDrawn = null`,
  count 0 — tức entry k=2 (gán 1 lần lên element mới el 1,
  target 5, src hang) xảy ra trong phase gắn proxy, TRƯỚC khi
  scrub 20; vòng lặp đã reset lastDrawn/lastRequested (redrawFlag
  do store đổi khi gắn proxy) rồi request lại seek 5 trên element
  mới. Đây là lần gán DUY NHẤT lên el 1.
- **S3 (scrub 20, hang):** tails cho thấy count leo 0 → 2 → 3 →
  4 → 6 → 8 → 9 → 10 trong 15,4 s, `entries` giữ nguyên 3 suốt
  phase — tức 10 lần thử seek 20 đều timeout mà KHÔNG lần nào gán
  `currentTime` (probe chặn ở prototype: 0 lần gán = không gán).
  Hết S3: count 10, exhausted true, kind timeout, target 20,
  recreated 1, seeking 1 — khớp đúng endIdle C6 §1.2.
- **Vì sao 0 lần gán:** el 1 đã kẹt `seeking = true` (seek tới 5
  đã bắt đầu sau khi metadata về, nguồn hang không bao giờ giao
  đủ dữ liệu nên `seeked` không bắn) — và `seekElement`
  (`seek.ts`, N1) khi thấy `seeking` thì CHỈ chờ `seeked`, không
  gán lại. Mỗi lần thử chỉ là timer 1200 ms rồi timeout. Đây là
  hành vi của code thật, không phải giả thuyết.

## 2. Test khóa (file + đỏ-trước/xanh-sau)

File: `apps/web/src/lib/seekStuckNoAssign48D5.test.ts` (7 test, chạy bằng
`node --experimental-strip-types` từ gốc repo, mẫu seek.test.ts /
pauseSeekCap42X2.test.ts). MockEl mô phỏng đúng 2 hành vi Chrome mà
cơ chế dựa vào: seeking=true trong lúc seek bay + seeked không bắn
khi nguồn kẹt; setter chỉ ghi lại lần gán (giá trị báo cáo do test
điều khiển). Driver vòng lặp mô phỏng ĐÚNG các nhánh request-seek /
.then / ngủ của preview.tsx (trích số dòng trong comment từng bước);
nó khóa logic quyết định bằng code thật, không mạo nhận là bằng chứng
browser (bằng chứng browser ở §4).

**Đỏ-trước** (scratch `/tmp/round48-d5/red-check.mjs`, KHÔNG commit):
cùng assertions episode S3 nhưng thay seekElement thật bằng seek
"ngây thơ" luôn gán currentTime kể cả khi seeking (hành vi tiền-N1).
Kết quả: `episode S3 = {count:10, exhausted:true, kind:"timeout",
target:20, recreated:1, seekingN:1, sets:11}`, assertion
`10 !== 0` FAIL, exit 1. Chú ý: đếm cap vẫn đúng (10, exhausted) —
chỉ assertion 0-lần-gán mới phân biệt được, đúng chỗ cần khóa.
**Xanh-sau** (code thật): 7/7 pass, exit 0:

| Test | Khóa cái gì |
|---|---|
| Hằng 1200 ms / cap 10 | `DEFAULT_SEEK_TIMEOUT_MS = 1200`, `PAUSE_SEEK_FAILURE_CAP = 10` (đổi hằng phải đo lại bound) |
| Cap ranh giới | `seekFailureAdvance("timeout", 9)` → `{10, exhausted:true}` |
| Lõi: 10 lần seekElement trên element kẹt seeking | đều `{seeked:false, timedOut:true}`, **0 lần gán** (lần đầu gán 1 lần để seek bắt đầu) |
| Lõi seekAll | kẹt seeking → `{done:0, timedOut:1, failed:0}`, 0 lần gán |
| Đối chứng (mock ghi được gán) | không kẹt seeking thì gán đúng 1 lần — nên 0 lần gán ở test lõi là thật, không phải mock hỏng |
| Vòng lặp S2 | seek 5 trên el0: 1 lần gán, 10 lần timeout, cạn cap, drop 1 element đang seeking (khớp endIdle C6 S2) |
| Vòng lặp S2→S3 đầy đủ | interlude k=2 gán đúng 1 lần lên el1 mới; S3: 10 lần thử seek 20, **0 lần gán**; trạng thái cuối khớp endIdle C6 S3 (count 10, exhausted, kind timeout, target 20, recreated 1, seeking 1); `seekFailureMaySleep(true,false,20,20) === true`; tổng lần gán S2+interlude+S3 = 2 (k=1 và k=2) |

Bài học trong lúc viết test (ghi rõ, không giấu): lần chạy đầu test
S2→S3 fail (`0 !== 10` attempt cho S3) vì driver kiểm tra
`exhausted` trước khi reset cap — trong khi vòng lặp thật reset cap
ở tick scrub 20 rồi mới đếm lại từ 0. Đã sửa driver: tách
`resetCapIfTargetChanged` dùng chung cho tick mở đầu episode và
nhánh request-seek. Test tự bắt được lỗi mô hình của chính nó trước
khi xanh — đó là bằng chứng test thực sự chạy logic, không phải
assert suông.

## 3. Mốc trung gian WEBCODECS → failed

Script mới: `apps/web/scripts/clicktest-round48-d5-compat-flip-run.mjs`
(bản sao script C6 rút gọn chỉ còn phase B + hook; không sửa file C6).
Lệnh (từ gốc repo; scratch + display/port riêng tránh đụng D6):

```
node apps/web/scripts/clicktest-round48-d5-compat-flip-run.mjs \
  --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
  --dist ~/workspace/tmp-round47-c6/app-dist \
  --scratch ~/workspace/tmp-round48-d5/compat-flip \
  --display :97 --port 4299
```

App thật: dist đóng băng bundle `index-D4oCKuDp.js`, Chromium thật
headed Xvfb :97, load đầu phiên `2.71 6.42 4.56` (under-load).
Evidence: `~/workspace/tmp-round48-d5/compat-flip/compat-flip-evidence.json`
(ngoài repo, không stage). **10/10 PASS.**

Mốc trung gian đã ghi được (log trong trang, đồng hồ
`performance.now()` duy nhất):

| tMs | kind | Badge |
|---|---|---|
| 27878,7 | hook-installed | `◀ NGƯỢC: WEBCODECS` (nền xanh `rgba(40,120,180,0.92)`) |
| 28382,5 | click-play | `◀ NGƯỢC: WEBCODECS` (text trước khi bấm) |
| 28457,5 | mutation ×3 | `◀ NGƯỢC: ELEMENT (decode WebCodecs lỗi)` (nền amber `rgba(140,90,0,0.92)`, title đúng key `titleElementFailed`) |
| 28479,2 | poll (backup) | failed (chậm hơn mutation 21,7 ms) |

- **Độ trễ flip = 28457,5 − 28382,5 = 75,0 ms**, bắt bằng
  MutationObserver (kind `mutation`), không phải poll. Poll ngoài
  (250 ms) chỉ thấy ở 0,3 s — đúng như C6 ghi "≤ ~1 s" nhưng số thật
  nay là 75 ms, nhanh hơn ~13 lần giới hạn đo cũ.
- **Không có trạng thái trung gian nào:** giữa click và failed,
  `intermediateTexts = []`, `intermediateCount = 0`. Cả 3 mutation
  cùng 1 ms, đều đã mang text+title+nền failed — tức badge lật trong
  MỘT lần render React (đổi đồng thời text, title, background), không
  qua trạng thái "đang chuyển". Ai trích "badge hiện WEBCODECS rồi
  mới lật" thì nay có mốc: WEBCODECS là trạng thái ngay trước click
  (ghi ở cả hook-install và click-play), failed là trạng thái ngay
  sau 75 ms, không có trạng thái thứ ba ở giữa.
- Tiền đề được kiểm chứng lại: badge hiện WEBCODECS lúc pause (sau
  scrub 5, trước hook) — controller chưa fail khi pause, đúng bài học
  C6 compat1 (phải PHÁT clip controller mới fail).

## 4. Trần 1000 trên đường sync — episode scrub liên tục

Script mới: `apps/web/scripts/per-seek-probe-sync-cap-run48-d5.mjs`
(bản sao script C6 + mode `long-scrub`; không sửa file C6). Lệnh:

```
node apps/web/scripts/per-seek-probe-sync-cap-run48-d5.mjs --mode long-scrub \
  --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
  --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
  --dist ~/workspace/tmp-round47-c6/app-dist \
  --scratch ~/workspace/tmp-round48-d5/sync-long \
  --display :95 --port 4298 --bridge-port 4296 --rate-kbs 64 \
  --long-scrub-sec 30 --scrub-step-sec 1
```

App thật + fake bridge drip 64 KiB/s (cùng hạ tầng C6), load đầu
`13.44 7.80 4.29` → cuối `6.67 7.94 4.82` (under-load, chạy cùng
luồng D6). Evidence:
`~/workspace/tmp-round48-d5/sync-long/sync-cap-evidence.json` +
`sync-cap-entries.json` (ngoài repo, không stage).

### 4.1 Kết quả: trần 1000 ĐÃ CHẠM trên đường sync

| Entry | Seek | Mẫu giữ / dropped | Trạng thái | Ghi chú |
|---|---|---|---|---|
| k=0, el 0, target 25 (S1) | scrub 25 | 0 / 0 | `completed` | Lại artifact fallback như C6 (latency 229,5 ms, vẽ thật sau ~44,8 s) |
| k=1, el 0, target 5 | scrub 5 + scrub liên tục | **1000 / 88** | `completed` | **capHit=true**; 1088 tick trong lúc seeking |
| k=2, el 0, target 23 | retry sau khi k=1 đóng | 133 / 0 | `unresolved` | Gán 1 ms sau khi k=1 đóng (xem §4.3) |

- k=1: mẫu đầu tMs 53739, mẫu thứ 1000 ở **+35,8 s** sau request,
  mẫu cuối 89379; 1088 tick / 35,6 s ≈ **28,1 mẫu/s** (under-load).
  `seekLatencyMs = 38203,4` (fallback đóng, `seekedEvent: false`),
  decoded 4 → 7 trong lúc seeking (decode đứng gần như yên — đúng
  bản chất drip chậm, không phải seek-scheduling).
- Trong suốt 30 bước scrub (31,1 s): tails cho thấy entries giữ
  nguyên 2, `seekFailureCount` giữ 0, `poolSeeking = [true]` ở mọi
  mốc — **không một lần gán mới nào, cap không đếm lần nào** trong
  lúc scrub. Đúng như thiết kế: mỗi scrub sang target mới reset cap
  (preview.tsx ~2864) + supersede lần thử trước (gen guard) nên vòng
  lặp không bao giờ cạn cap; entry k=1 tích lũy mẫu suốt episode.
- Bound C6 (<780 mẫu cho episode seek đơn) bị vượt — không phải vì
  C6 sai, mà vì bound đó chỉ đúng cho episode MỘT target. **Bound
  mới: trần 1000 chạm được khi thời gian seeking × tốc độ rAF ≥
  ~1000.** Ở tốc độ rAF lượt này (~28/s) cần ~36 s seeking; ở
  60/s chỉ cần ~17 s. Giới hạn vận hành thật của đường sync nay là
  (a) media kẹt seeking được bao lâu (drip giao đủ dữ liệu thì seek
  đáp — ở đây sau 38,2 s) và (b) user scrub liên tục được bao lâu,
  không còn là abort 10-fail nữa.

### 4.2 Vì sao S1 (k=0) lại artifact — nhắc lại, không phải số mới

Như C6 §1.3: k=0 chốt `completed` sau 229,5 ms bằng rAF-fallback
(`seekedEvent: false`, `seekingSeen: false`) trong khi frame đầu
chỉ decode sau ~23,7 s và vẽ sau ~44,8 s. Không trích "seek 229 ms"
làm seek nhanh.

### 4.3 Sau khi k=1 đóng: loop gán ngay target 23 (k=2)

k=1 đóng (fallback) ở tMs 91752; k=2 (target 23, cùng element el 0)
được gán ở tMs 91752 — **chênh đúng 1 ms**. Tức ngay khi seeking
của seek cũ tắt, lần thử tiếp theo của vòng lặp cho target cuối
(23) thấy `seeking = false` nên gán ngay (đúng nhánh N1 ngược lại:
không seeking thì gán). k=2 tích lũy 133 mẫu trong 6,4 s rồi vòng
lặp cạn cap lần nữa (count 10, target 23, recreated 1, seeking 1)
và ngủ ở waitSleepSec 14,1. Đây là bằng chứng trực tiếp cho cơ chế
§1 ở phía ngược lại: gán chỉ xảy ra khi seeking đã tắt.

### 4.4 EndPool sau drop — giải thích, không còn là ẩn số như C6

EndPool S2b vẫn hiện 1 video (ct 0, readyState 1, seeking false)
dù `seekElementRecreated = 1` (đã drop el 0). Giải thích bằng code
+ quan sát: tick ngay sau `.then` drop vẫn chạy `syncMedia` ở đầu
nhánh pause (preview.tsx ~2762) TRƯỚC khi `scheduleNext` cho ngủ —
`syncMedia` gọi `videoFor` tạo element MỚI (el 1) dưới cùng key
pool, rồi vòng lặp mới ngủ. Nên video trong endPool là el 1 mới
(ct 0, metadata đã về nhanh — readyState 1), còn element của k=2
(el 0) lúc `read()` flush có readyState 0 (đã bị drop gỡ src).
Mức tin cậy: cao (khớp code + cả hai snapshot), nhưng chưa có
fingerprint elementId trực tiếp cho el 1 (không có entry nào sau
đó để đối chiếu) — ghi rõ giới hạn này.

### 4.5 Hạn chế của lượt đo

- Mọi số under-load (load 13,4 đầu phiên; tốc độ rAF ~28/s, chưa
  tới 60/s). Baseline quiet vẫn chờ cửa sổ yên.
- Drip 64 KiB/s là mô phỏng có nhật ký range, không phải mạng chậm
  thật; seed vẫn dùng blob stand-in flat 45 KB cho IDB (như C6).
- Chỉ đo trên drip + Chrome headed Xvfb; đường WebCodecs / Safari /
  máy thật / footage B-frame vẫn chưa đo (nợ đứng).

## 5. Kiểm chứng đã chạy (lệnh + số thật)

- `node --check` cho cả 2 script mới → pass.
- Test mới D5: `node --experimental-strip-types apps/web/src/lib/seekStuckNoAssign48D5.test.ts` → **7/7 pass**, exit 0.
- Red-check: `node --experimental-strip-types /tmp/round48-d5/red-check.mjs` → **FAIL như kỳ vọng** (exit 1, `10 !== 0`) với seek ngây thơ luôn gán.
- Hồi quy probe/compat (esbuild bundle `--format=esm` từ gốc repo, bundle ra `/tmp/d5-reg`; B5 chạy `node --test` trực tiếp):
  - B5 `per-seek-probe-pool-cap-46b5.test.mjs`: **5/5 pass**, fail 0.
  - B6 `reverseBadge46B6.test.ts`: **7/8 pass** — test fail duy nhất là snapshot đếm key i18n (`971 !== 968`).
  - A6 `reverseBadge45A6.test.ts`: **12/12 pass**, fail 0.
  - Z6 `reverseCompat44Z6.test.ts`: **9/10 pass** — test fail duy nhất cũng là snapshot đếm key i18n (`971 !== 968`).
  - Thêm: `seek.test.ts` **15/15 pass** (vùng seek, đối chứng).
- **Vì sao B6/Z6 mất 1 test — KHÔNG phải do D5, KHÔNG sửa:** cả hai
  test fail đều assert `viKeys.size === 968` / `enKeys.size === 968`
  (snapshot lúc B6/Z6 viết). File `apps/web/src/i18n/vi.json` +
  `en.json` hiện có **971 key mỗi bên, parity giữ nguyên (971=971,
  0 key lệch một bên)** — 3 key mới do luồng D4 đợt 48 thêm cho
  toggle GOP trên TopBar (`topbar.reverseWebcodecs`,
  `topbar.reverseWebcodecsOn`, `topbar.reverseWebcodecsOff` — xem
  `NEW_KEYS` trong file test D4 `reverseToggleI18n48D4.test.ts`,
  timestamp 13:09, vi.json 13:08, trong khi test B6 từ 01:10). Sửa
  snapshot 968→971 là việc của parent lúc gộp (cập nhật snapshot theo
  key mới), không phải việc của D5 — D5 không đụng i18n, không đụng
  file test của luồng khác. Mọi test logic badge/display còn lại của
  B6 (7/7) và Z6 (9/9) đều pass.
- `npx tsc --noEmit` (từ `apps/web`) → **0 lỗi** (sau khi thêm
  exclude cho file test mới, theo tiền lệ các test trước).
- Headed Chromium thật: sync long-scrub (§4, capHit=true),
  compat-flip (§3, 10/10 PASS). App vẫn đáp evaluate sau mọi phiên.

## 6. Cái gì CHƯA làm (nợ còn lại — không mạo nhận, không ép đóng)

1. Baseline quiet vẫn chờ cửa sổ yên từ main chat (nợ đứng nhiều đợt).
2. Trần 1000 trên đường WebCodecs / Safari / máy thật / footage B-frame vẫn chưa đo.
3. Filmstrip không chạy trong lượt sync C6 (§1.5): phép đối chứng target captureFrame trên file có duration hữu hạn chưa thu được.
4. Safari/Firefox/máy thật/màn hình vật lý vẫn CHƯA ĐO.
5. EndPool sau drop (§4.4): giải thích bằng code + quan sát, chưa có fingerprint elementId trực tiếp cho element mới.
6. Snapshot đếm key i18n 968 của B6/Z6 đã lỗi thời do D4 thêm 3 key (971) — parent cập nhật lúc gộp; D5 không sửa file luồng khác.

## 7. File đổi/thêm (chỉ của D5 — text, không binary, không dist)

Mới:
1. `apps/web/src/lib/seekStuckNoAssign48D5.test.ts` — test khóa cơ chế 10-lần-thử-seek-20 (7/7 pass, đỏ-trước/xanh-sau).
2. `apps/web/scripts/per-seek-probe-sync-cap-run48-d5.mjs` — script sync mode long-scrub (bản sao script C6 + mode mới, không sửa file C6).
3. `apps/web/scripts/clicktest-round48-d5-compat-flip-run.mjs` — script compat-flip với hook MutationObserver + poll 50 ms (bản sao script C6 rút gọn, không sửa file C6).
4. `docs/PHASE9_ROUND48_D5_PROBE_LIMITS.md` — tài liệu này.

Sửa:
5. `apps/web/tsconfig.json` — thêm 1 dòng exclude cho file test mới (`src/lib/seekStuckNoAssign48D5.test.ts`, theo tiền lệ các test trước). Không đổi gì khác.

Không đổi (ghi rõ để parent khỏi tìm): mọi file `.ts` production
(`seek.ts`, `pauseSeekCap42X2.ts`, `pauseSeekRecovery43Y2.ts`,
`preview.tsx`, i18n, bridge), mọi file của luồng khác (kể cả test
B6/Z6 và file C6 gốc), paths-loop, build-loop-log. Không push,
không tag, không stage batch (parent gộp).

Scratch ngoài repo (không stage):
`~/workspace/tmp-round48-d5/` — `sync-long/` (sync-cap-evidence.json +
sync-cap-entries.json + chrome-stderr.log + chrome-profile),
`compat-flip/` (compat-flip-evidence.json + chrome-stderr.log +
chrome-profile); `/tmp/d5-reg/` (bundle hồi quy), `/tmp/round48-d5/`
(red-check.mjs — scratch /tmp, nội dung đỏ đã ghi verbatim ở §2).

