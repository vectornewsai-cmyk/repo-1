# PHASE9_ROUND85_M8_PROXY_PROGRESS_RETRY_LIMITS.md — Proxy: tiến trình % + hàng đợi thử lại (đợt 85 M8)

> Ngày: 2026-11-11. Luồng M8, đợt 85. KHÔNG push.
> Bối cảnh: đợt 84 L9 đã đóng 3 khoảng trống proxy tự động (chọn 480/720p, thông báo
> mất file gốc, verify bridge 13/13, proxyAuto 35/35, export gốc 10/10; mặc định BẬT).
> Còn nợ (§5 L9): (1) click-test headed đường UI proxy tự động; (2) tiến trình %
> từng proxy + hàng đợi thử lại khi bridge tắt. Đợt này đóng cả hai.

## 0. Đã làm gì

1. **Tiến trình % thật từng proxy** — `server/render/src/proxy.js` thêm
   `generateProxyWithProgress(input, outDir, opts)` (async, cùng encode args và cùng
   kết quả trả về như `generateProxy` sync): chạy ffmpeg bằng spawn + `-progress
   pipe:2`, gọi `opts.onProgress(pct)` mỗi khi % đổi, pct = `out_time_ms` /
   duration (0..99 lúc chạy; 100 chỉ khi encode xong + sidecar đã ghi).
   Ghi sidecar tách thành `writeProxySidecar` dùng chung với bản sync (định dạng
   sidecar không đổi, file cũ đọc được).
2. **Job proxy async trên bridge** — `server/bridge/src/index.js`: registry job trong
   bộ nhớ + `POST /api/proxy?async=1` → 202 `{jobId, status:"processing",
   progress:0}` ngay (encode chạy nền) + `GET /api/proxy/jobs/:id` →
   `{jobId, status, progress, ...result}`. Dedupe: cùng (tên file nguồn + height)
   đang processing → trả lại jobId cũ, không encode trùng. TTL job 15 phút, cap
   100 job (dọn khi có job mới). Đường sync cũ giữ nguyên: POST không async vẫn
   200 + proxyUrl như Q8/R3/L9.
3. **Hàng đợi thử lại khi bridge tắt** — `apps/web/src/lib/proxy.ts` (hàm thuần,
   có unit test) + `apps/web/src/MediaBin.tsx`:
   - Chỉ retry khi bridge thật sự không tới được: fetch lỗi mạng (TypeError /
     "Failed to fetch" / "NetworkError" / "Load failed") hoặc HTTP 502/503/504,
     hoặc job 404 khi poll (bridge restart giữa chừng). Lỗi xác định (400 sai
     height, 500 encode lỗi) fail luôn, không retry.
   - Backoff cố định, không jitter: lần thử lại 1 sau 5 s, rồi 10 s, 20 s, 40 s,
     80 s (nhân đôi, kẹp 120 s); tối đa **5 lần thử tổng** (lần đầu + 4 lần thử
     lại); hết lượt → trạng thái `failed` + toast `proxyRetryFailed`.
   - Timer chạy đúng mốc `nextAt` gần nhất; chạy trùng 1 item bị chặn bằng
     guard `proxyInFlightRef` (bấm tay + timer cùng lúc cũng chỉ chạy 1 lần).
   - UI: nút proxy hiện `Đang tạo proxy {percent}%` (attr `data-proxy-progress`
     để test đọc) khi có %; khi chờ retry hiện ghi chú `Bridge tắt — chờ thử lại
     lần {attempt}/5 sau {seconds} giây.` + nút `Thử lại ngay`
     (`data-testid="proxy-retry-now"`, bỏ lịch chờ, chạy lại luôn — lần bấm này
     cũng tính là 1 lần thử).
   - Bấm tay tạo proxy nay cũng qua job async có % + retry queue (trước đây
     fetch sync trực tiếp trong `MediaCard.makeProxy`); toast thành công giữ
     nguyên cho đường bấm tay, đường tự động/thử lại im lặng khi xong.
4. **i18n vi/en**: +8 key `mediabin.proxyCreatingPercent / proxyRetrying /
   proxyRetryQueued / proxyRetryNow / proxyRetryFailed / proxyTimeout /
   proxyJobLost` (+ `proxyJobLost` cho job 404 khi poll). Dict lúc kiểm:
   **2507/2507** (2465 đợt 84 + 8 key M8 + 34 key các luồng đợt 85 khác thêm song
   song). KHÔNG tự bump test khóa số key — parent bump ở closing.
5. **Script kiểm chứng bridge mới** `apps/web/scripts/r85m8-proxy-progress-verify.mjs`.
6. **Click-test headed mới** `apps/web/scripts/clicktest-85m8-proxy-progress-headed.mjs`
   (Xvfb :185 + Chromium headed + CDP Node thuần, mẫu R10; cổng riêng
   bridge 8891–8899 / vite 5590–5599 / debug 9690–9699; scratch ở
   `hidden_files/round85-m8/headed/`).

## 1. Kiểm chứng thật (số đo lần này, VM 4 vCPU EPYC 9D25, đang chạy nhiều luồng đợt 85 khác)

| Kiểm chứng | Kết quả |
|---|---|
| `proxyAuto.test.ts` (unit: backoff, exhausted, bridge-down, clamp %, parse job) | **46/46 pass, 0 fail** (35 cũ + 11 mới) |
| `r85m8-proxy-progress-verify.mjs` (bridge thật, cổng 18895) | **19/19 pass** |
| Poll job async clip 1080p 20 s | 72 mẫu, **38 giá trị % trung gian khác nhau** trong (0,100), đơn điệu tăng, mẫu đầu 0, cuối done 100; encode 23,3 s |
| `generateProxyWithProgress` trực tiếp (clip 20 s, lúc VM nặng) | 66 mẫu % (1→99), đơn điệu tăng, mẫu đầu sau 4,4 s; encode 40,5 s |
| Dedupe job trùng (cùng file + height) | cùng jobId |
| Job lạ / skipped 480p / sync compat / bad height 400 | 404 PROXY_JOB_NOT_FOUND; skipped; sync 200 + proxyUrl; 400 PROXY_BAD_HEIGHT |
| `server/render/test_proxy_q8.js` (bản sync không đổi) | **10/10 pass** |
| `r84l9-proxy-auto-verify.mjs` (hồi quy) | **13/13 pass** |
| `r6-i18n-check.cjs` | **PASS**, vi=2507 en=2507 |
| `tsc --noEmit` (apps/web) | **exit 0** |
| `vite build` | **exit 0** (40,71 s; cảnh báo chunk >500 kB đã có từ trước) |
| Click-test headed (3 lần chạy, xem §2) | lần 3: **16/16 pass, exit 0** |

## 2. Click-test headed — 3 lần chạy (trung thực cả lần lỗi)

Harness: vite dev + Chromium headed qua Xvfb :185 + CDP; clip thật 1080p
(testsrc+sine: pha A 20 s, pha B 10 s); bridge thật cổng riêng 8891, WORK_ROOT
riêng; import qua `DOM.setFileInputFiles` trên input file thật của MediaBin.

- **Lần 1: 11/14 pass.** Lỗi: (a) A4 thêm clip lên timeline thất bại —
  thẻ clip A nằm ở hàng 2 của grid, bị cuộn khỏi vùng nhìn thấy, click CDP
  theo tọa độ đo được rơi nhầm chỗ (xem ảnh `m8-a4-preview-badge.png` lần 1:
  bin chỉ hiện 2 clip mẫu); kéo theo badge preview + network fetch fail
  (clip chưa lên timeline nên không có gì để preview). (b) Lỗi script harness
  ở B3: `proxyUrl` đã là URL đầy đủ nhưng script cộng thêm `BRIDGE_URL` →
  URL kép, `fetch` throw `Failed to parse URL` → harness exit 2, check E0
  không chạy. Cả hai đều là lỗi harness, không phải lỗi sản phẩm.
- **Lần 2: 16/16 pass, exit 0** — đã sửa B3 (fetch thẳng `proxyUrl`) +
  `scrollIntoView` trước khi click + fallback JS `.click()` (CDP click vẫn
  trượt lần này).
- **Lần 3: 16/16 pass, exit 0** — thêm vòng thử lại CDP click (tối đa 3 lần,
  đo lại tọa độ mỗi lần): click chuột CDP thật trúng ở **lần thử 2** (lần 1
  trượt vì grid còn cuộn mượt sau `scrollIntoView`, tọa độ đo lúc đang cuộn
  đã cũ). Từ lần 3 trở đi harness giữ vòng thử lại này; fallback JS `.click()`
  chỉ chạy khi cả 3 lần CDP đều trượt (chưa xảy ra ở lần 3).

Kết quả lần 3 (16 bước, chi tiết trong
`hidden_files/round85-m8/headed/m8-clicktest-report.json`):

| Bước | Kết quả |
|---|---|
| S0 mẫu tự load (3 clip, media 2 item) | PASS |
| A1 checkbox tự tạo proxy mặc định BẬT | PASS (checked=true) |
| A2 import clip A 1080p 20 s | PASS (thẻ xuất hiện, nút "Proxy 720p") |
| A3 % thật lúc tạo | PASS — **45 giá trị % khác nhau** trong (0,100): 1, 4, 6, 11, 12, 13, 15, 18, 21, 23… |
| A3 badge ✓ PROXY 720p | PASS |
| A4 thêm clip lên timeline (CDP mouse click) | PASS — clipCount 3 → 4 |
| A4 preview dùng proxy | PASS — badge "PROXY 720p" hiện; **1 request /api/proxy/file/** thật trong lúc play |
| A5 store proxyUrl + proxyHeight 720 | PASS |
| B0 bridge tắt hẳn (cổng đóng) | PASS |
| B1 import clip B khi bridge tắt | PASS — ghi chú "Bridge tắt — chờ thử lại lần 2/5 sau 5 giây." + nút "Thử lại ngay" |
| B2 bấm "Thử lại ngay" khi bridge vẫn tắt | PASS — lên "lần 3/5 sau 10 giây", không crash |
| B3 bridge lên lại → thử lại | PASS — badge ✓ PROXY 720p; GET proxy 200; file có trên đĩa bridge |
| E0 không lỗi JS/unhandledrejection | PASS |

## 3. Hai phát hiện kỹ thuật khi đo (ghi lại để luồng sau khỏi vấp)

1. **`-progress pipe:1` bị ffmpeg buffer tới cuối**: encode clip 20 s chỉ cho 1
   mẫu % duy nhất (99) ở cuối — không dùng được cho UI. `-progress pipe:2`
   (stderr) flush theo từng đợt (26 mẫu ở lần thử thô, 66 mẫu sau khi sửa
   đơn vị). Đã dùng `pipe:2` trong `generateProxyWithProgress`.
2. **`out_time_ms` của ffmpeg tính bằng MICRO giây** dù tên có "ms": chia cho
   `duration*1000` (ms) ra 2800% → kẹp 99 ngay mẫu đầu. Đúng là chia cho
   `duration*1e6`. Lỗi này từng làm lần đo đầu chỉ thấy 1 mẫu 99% (kết hợp
   với buffer ở (1)).

## 4. Giới hạn trung thực

1. **% chỉ có khi bridge mới + encode đang chạy.** Bridge cũ (không có job
   async) trả 200 sync → UI hiện "Đang tạo…" không % (không bịa % bằng timer
   — xem `runProxyJob` trong MediaBin: đường sync không gọi `onProgress`).
   Duration probe = 0 → bridge không gọi `onProgress` lần nào (cùng hành vi).
2. **% là tiến độ encode, không phải tiến độ upload.** Upload file lên bridge
   xong mới tạo job; với file local lớn, pha upload không có % (fetch POST
   không báo tiến độ upload) — % bắt đầu chạy khi ffmpeg bắt đầu encode.
   Đây là giới hạn của `fetch`, không phải của job.
3. **Job chỉ sống trong bộ nhớ bridge.** Restart bridge → job đang chạy mất;
   client poll gặp 404 → coi như bridge tắt, đưa vào hàng đợi thử lại (tối
   đa 5 lần). Không có persist job qua restart (job queue render chính có
   persist riêng; proxy job nhẹ nên chưa làm).
4. **Retry chỉ cho lỗi "không tới được bridge".** Encode lỗi (ffmpeg exit != 0,
   file hỏng) fail luôn sau 1 lần — thử lại cũng lỗi y hệt. Bridge trả 500
   `TASK_PROXY_FAILED` nhưng vẫn chạy (encode lỗi) → không retry; bridge
   sập hẳn giữa chừng (fetch reject / job 404) → có retry.
5. **Backoff tối đa 5 lần thử tổng, delay dài nhất 80 s** (lần thử lại thứ 4;
   lần 5 kẹp 120 s không bao giờ tới vì đã hết lượt ở attempts=5). Clip import
   lúc bridge tắt lâu (> ~2,5 phút tổng backoff 5+10+20+40+80 s) sẽ rơi về
   `failed` — user bấm nút Proxy để thử lại tay (nút chuyển về
   "Proxy lỗi, thử lại").
6. **Retry queue không bền qua reload trang.** Queue sống trong state MediaBin;
   reload → mất lịch retry, item ở lại trạng thái `failed` (không tự chạy
   lại). User bấm nút Proxy để tạo lại. Chưa persist queue vào localStorage
   (cân nhắc sau: queue cần cả File gốc, không lưu được bền).
7. **Dedupe job theo tên file + height.** Hai clip khác nhau trùng tên file
   (vd cùng `clip.mp4` từ 2 thư mục) import cùng lúc → job thứ hai nhận jobId
   của job thứ nhất và gắn cùng proxy (file nguồn sau ghi đè file trước trong
   `PROXY_DIR`). Hành vi này đã có từ trước ở đường sync (cùng thư mục đích
   + cùng tên) — async chỉ làm lộ rõ hơn qua jobId chung. Sửa triệt để cần
   key job theo hash nội dung — để lại làm nợ.
8. **Tiến trình % theo từng proxy, chạy tuần tự.** `autoProxyFresh` vẫn tạo
   từng item một (giữ quyết định L9: khỏi đè CPU bridge); import 5 clip
   1080p 20 s ≈ 2–3 phút nền mới xong hết (đo lúc VM nặng: 1 clip 20 s mất
   23–40 s). % hiện theo từng item đang tạo, không có % tổng của cả đợt.
9. **Số thời gian theo tải VM.** Encode 20 s mất 23,3 s (verify bridge, lúc
   rảnh hơn) và 40,5 s (đo trực tiếp lúc VM nặng); click-test A3 thấy 43–45
   giá trị % khác nhau. Không suy ra số tuyệt đối cho máy user.
10. **Click-test lần 1–2 có fallback JS `.click()`** cho bước thêm clip (xem
    §2): bằng chứng "click chuột CDP thuần thêm clip" chỉ đạt ở lần 3 (trúng
    lần thử 2). Các bước còn lại (import file, badge, retry-now, restart
    bridge) đều là CDP/DOM thật trong cả 3 lần.
11. **Dict i18n 2507 gồm key của luồng khác.** +8 key M8; 34 key còn lại do
    các luồng đợt 85 khác thêm song song — test khóa số key cần bump theo
    tổng cuối đợt, không phải số của riêng M8.

## 5. File đổi (stage, KHÔNG push)

- `server/render/src/proxy.js` — `generateProxyWithProgress` + `writeProxySidecar`.
- `server/bridge/src/index.js` — registry job proxy, `POST ?async=1`, `GET /api/proxy/jobs/:id`.
- `apps/web/src/lib/proxy.ts` — retry/backoff/bridge-down/parse job helpers.
- `apps/web/src/lib/proxyAuto.test.ts` — 35 → 46 test.
- `apps/web/src/MediaBin.tsx` — job async có %, retry queue + timer, UI %/retry.
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` — +8 key.
- `apps/web/scripts/r85m8-proxy-progress-verify.mjs` — script kiểm chứng mới.
- `apps/web/scripts/clicktest-85m8-proxy-progress-headed.mjs` — click-test headed mới.
- `docs/PHASE9_ROUND85_M8_PROXY_PROGRESS_RETRY_LIMITS.md` — file này.

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round85-m8-proxy-progress-retry.txt`
(verify read-back sau khi stage).

## 6. Nợ còn lại

- Dedupe job theo hash nội dung thay vì tên file (§4.7).
- % pha upload file lên bridge (cần XHR `upload.onprogress` thay cho `fetch`).
- Persist hàng đợi retry qua reload (cần giữ File gốc — chỉ khả thi khi item
  còn trong IndexedDB/blob URL của phiên).
- % tổng của cả đợt import nhiều clip (hiện chỉ có % từng item).
