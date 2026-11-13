# PHASE9_ROUND94_V1_RVFC_PUMP_LIMITS — rVFC pump/scheduling (nối tiếp U1 đợt 93)

> Luồng V1, lượt cron 09:35 +07 12/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, không đụng `.github/workflows`, 0 binary.
> **V1 KHÔNG sửa code repo** (xem §1): stack fix đã có trên đĩa từ đợt 93 (closing pass);
> V1 kiểm tra đĩa, đo kiểm chứng, và đo A/B tách đóng góp từng thành phần.
> Batch stage của V1 chỉ có file LIMITS này (xem §9).

## 1. Bối cảnh: log U1 đã cũ, fix đã hạ cánh trước lượt 94

Log `round93-u1.md` dừng ở "đang chờ cửa sổ yên để chạy baseline sạch", nhưng trên đĩa
`~/workspace/round93-u1/out/` đã có thêm 8 file sau thời điểm log, và `preview.tsx`
mtime 01:15Z 12/11. V1 tái dựng dòng thời gian + đọc raw pump events thay vì tin log:

- 00:23 `pump-b-fix1.json` (register-first) → 00:32 `pump-b-oldorder.json` (thứ tự cũ)
  → 00:38/00:41 `pump-{b,c}-eps.json` → 00:51 `pump-c-memo.json` → 00:57
  `preview-abcde-assert.json` → 01:15 sửa `preview.tsx` (siết guard 1,5/fps → 1/fps+0,5ms)
  → 01:17 `preview-abcde-assert2.json` → 01:18 `pump-b-guard.json`.
- Stack fix đã có trên đĩa lúc V1 bắt đầu (xem §2). V1 không viết lại fix từ đầu.

## 2. Stack fix và đóng góp từng thành phần (đo A/B trên đĩa + đo mới đợt 94)

### 2.1 videoFrameIndex +1µs — FIX QUYẾT ĐỊNH (đã có, `src/lib/previewEngine.ts`)

`Math.floor((timeSec + 1e-6) * fps)`. Nguyên nhân gốc của ~33% duplicate (T2/U1):
mediaTime Chromium lượng tử hoá theo µs — PTS k/fps tròn xuống 0,33µs (vd 4/30s →
0,133333) thì t·fps = k−1e-5, floor về k−1. Hệ thống: cứ 3 frame thì 1 frame
(k≡1 mod 3 @30fps: 1,4,7,10,…) không bao giờ được capture.
Bằng chứng raw `pump-b-fix1.json` (trước fix): mt 0,133333→idx 3 (đúng ra 4),
mt 0,233333→idx 6 (đúng ra 7); duplicate 22/67 callback, đúng chu kỳ 3.
Sau fix (`pump-b-eps.json`): idx 1,2,3,4,… liên tục, duplicate 0/71.
Unit test mới cho trường hợp này xanh (`videoFrameIndex: mediaTime lượng tử hoá
µs của Chromium (đợt 93 U1)` — xem §8).

### 2.2 register-first — TRUNG TÍNH lúc yên (đo A/B mới đợt 94)

Đăng ký lại TRƯỚC drawImage (hook `window.__vcutRvfcRegisterFirst=false` để về
thứ tự cũ). Kết quả đo MỚI đợt 94, cùng code hiện tại (eps+guard+memo+V4 fix,
xem §7), tải vừa (loadavg 2,25–2,72), spec B, 3 pass:

| lượt | thứ tự | coverage | captureRatio | dupRate | miss | schedLat med | capMs med | ticks |
|---|---|---|---|---|---|---|---|---|
| `pump94-b-noreg2.json` p1–p3 | cũ (sau capture) | 0,986 / 0,959 / 0,958 | **0,986 / 0,959 / 0,958** | 0 | 0 / 2 / 2 | 30,2 / 30,7 / 30,6ms | 3,3 / 2,8 / 2,8ms | 142 / 145 / 144 |
| `pump-b-guard.json` p1–p3 (đợt 93) | mới (trước capture) | 0,986 / 0,971 / 0,972 | **0,986 / 0,971 / 0,972** | 0 | 0 / 1 / 1 | ~33ms | ~2,3ms | 141 / 133 / 145 |

**Kết luận: lúc tải vừa, thứ tự đăng ký không đổi gì** (0,958–0,986 cả hai chiều,
sai khác trong phương sai pass). Tỉ lệ capture 0,65 của oldorder/fix1 đợt 93 hoàn
toàn do lỗi lượng tử hoá §2.1, KHÔNG phải do thứ tự đăng ký. Giá trị duy nhất còn
lại của register-first là lý thuyết lúc tải nặng (capMs phình → frame trình chiếu
trong lúc capture không có callback chờ sẵn) — **chưa có số đo sạch cho trường
hợp này** (xem §5). KHÔNG nên claim register-first "sửa" capture ratio.

### 2.3 freshness guard 1/fps + 0,5ms — LƯỚI AN TOÀN, không phải cơ chế tăng throughput

Skip capture khi `currentTime − mediaTime > 1/fps + 0,5ms` (decision
`"skip-stale-frame"`). Lúc yên guard KHÔNG bao giờ kích (`pump-b-guard.json`:
otherSkips=0, ctDelta max 12,5ms < 33,8ms). Lúc nhiễm tải guard kích đúng thiết
kế: `pump94-b.json` p1–p2 otherSkips 5/7 (lateMs tới 86,6ms) — mất frame thay vì
snapshot gán sai nhãn. Guard không làm tăng capture ratio; nó ngăn đầu độc ring.

### 2.4 memo canvas alpha theo (clip, frameIdx) — TIẾT KIỆM THẬT, nhỏ, theo pha

1 entry/clip, dung sai hình học 0,005. So sánh spec C (mask bám track, hình học
đổi liên tục) trước/sau memo:

| file | dupMask med (3 pass) | nondupMask med (3 pass) |
|---|---|---|
| `pump-c-eps.json` (trước memo) | 0,8 / **3,9** / 0,6 ms | 0,7 / 0,6 / **3,8** ms |
| `pump-c-memo.json` (sau memo) | **0,7 / 0,6 / 0,7 ms** | 0,7 / **3,8** / 0,7 ms |
| `pump94-c.json` (đợt 94, có memo, tải nặng) | 0,8 / 0,7 / 1,0 / 0,7 / 0,8 ms | 3,8 / 3,8 / 4,0 / 4,0 / 4,4 ms |

- Trước memo, chi phí ~3,8–3,9ms rơi vào tick nào lệch pha với cache hình học
  (lúc thì dup tick, lúc thì non-dup tick — đổi theo từng pass).
- Sau memo, **dup tick luôn rẻ (0,6–1,0ms, 8/8 pass gộp cả hai đợt)** — memo ổn
  định đúng trường hợp nó nhắm tới; tiết kiệm ~3,2ms mỗi dup tick mà trước đây
  miss. Non-dup tick vẫn miss theo pha (3,8ms ở 1/3 pass đợt 93, 5/5 pass đợt 94
  lúc tải nặng — tải nặng làm cache miss nhiều hơn, xem §5).
- Spec B (mask tĩnh): memo là no-op (dupMask = nondupMask = 0,6ms cả trước/sau).
- Tổng tiết kiệm trên C ≈ dupRateTicks (~0,5) × ~3,2ms × tỉ lệ pass miss trước
  memo (~1/3) ≈ **0,5–1,6ms/tick trung bình**; rfMed không đổi (~6,5ms) — mask
  chỉ là phần nhỏ của frame. Không claim nhiều hơn số này.
- Ngoại lệ: `pump94-c2.json` p3 dupMask med 3,9ms (memo miss) — track chạy
  0,3→0,7 trong 2s = 0,0067/frame, nhỉnh hơn dung sai 0,005 nên có pha miss.
  p1 cùng file (tải rất nặng) cả dup lẫn non-dup đều đắt (4,5/6,7ms).

## 3. Baseline SẠCH (đợt 93, tải yên loadavg 0,5–1,6 — V1 xác nhận lại bằng đối chiếu raw)

| biến thể | spec | coverage | captureRatio | dupRate | miss | schedLat med | capMs med |
|---|---|---|---|---|---|---|---|
| oldorder (đăng ký sau, chưa eps) | B | 0,959–0,972 | 0,644–0,667 | 0,31–0,33 | 1–2 | ~33ms | ~2–3ms |
| fix1 (register-first, chưa eps) | B | 0,972–0,986 | 0,653–0,662 | 0,33–0,34 | 0–1 | ~33ms | ~2–3ms |
| eps (+1µs) | B | 0,822–0,986 | 0,797–0,986 | 0 | 0–7 | ~33ms | ~2–3ms |
| eps (+1µs) | C | 0,986 ×3 | 0,986 ×3 | 0 | 0 | ~33ms | ~2–3ms |
| guard siết (1/fps+0,5ms) | B | 0,971–0,986 | 0,971–0,986 | 0 | 0–1 | ~33ms | ~2,3ms |
| memo (+eps) | C | 0,986 ×3 | 0,986 ×3 | 0 | 0 | ~33ms | ~2–3ms |

Lưu ý phương sai: eps B có 1/3 pass chỉ 0,797–0,808 (miss 6–7, schedLat p90
67–75ms) trong khi 2 pass còn lại 0,986 — V1 chưa tái hiện được pass xấu này
lúc yên (đo mới §4 bị nhiễm hoặc vô hiệu). Coi 0,80 là biên dưới thỉnh thoảng,
không phải giá trị điển hình.

## 4. Đo mới đợt 94 của V1 — kết quả theo từng lượt (file `~/workspace/round94-v1/out/`)

| lượt | file | điều kiện | kết quả |
|---|---|---|---|
| B lần 1 | `pump94-b.json` | register-first; trùng V5 e1-run1/run2 | NHIỄM: p1–p2 cap 0,375/0,266 (schedLat med ~80ms, capMs p90 66–87ms, ticks 45/32); p3 gần sạch cap 0,822, ticks 130. Guard kích 5/7/3 skip-stale-frame. |
| B lần 2 | `pump94-b2.json` | V2 sửa `preview.tsx` liên tục 02:52–03:00 (HMR 6 lần + invalidate 03:00:02) | VÔ HIỆU: presented=0, callbacks=0, ticks=0 cả 5 pass (mỗi pass timeout 40s). |
| C lần 1 | `pump94-c.json` | code ổn định, tải nặng loadavg 4,5–5,8 | NHIỄM: cap tụt dần 0,864→0,915→0,594→0,515→0,256; dup=0 mọi pass; dupMask luôn rẻ (memo, §2.4). |
| B lần 3 | `pump94-b3.json` | V4 sửa `preview.tsx` lúc 03:07:45 giữa lượt | p1 cap 0,423 (nhiễm, loadavg 1,44 nhưng sibling burst); p2–p3 VÔ HIỆU (callbacks 6/0 — HMR reset giữa pass, schedLat max 15194ms là artifact đo qua reload). |
| C lần 2 | `pump94-c2.json` | tải nặng loadavg 6,7–8,3 | p1 cap 0,371; p2–p3 callbacks=0 dù code ổn định — tải nặng làm pump không bắn callback nào (presented vẫn 66–72, ticks 56–122: vòng tick chạy, riêng rVFC im). |
| **B-noreg** | **`pump94-b-noreg2.json`** | **thứ tự cũ; code ổn định (mtime 03:07:45); loadavg 2,25–2,72** | **SẠCH: cap 0,986 / 0,959 / 0,958, dup 0, ticks 142–145 — A/B §2.2.** |

## 5. Nhạy tải (chưa có số đo sạch có kiểm soát — chỉ quan sát)

- Lúc yên (loadavg ≤1,6): schedLatency med ~30–33ms (≈ 1 frame @30fps), capMs
  med 2–3ms, invokeGap med ~33ms, jumps toàn 1.
- Lúc nhiễm (sibling probe/ffmpeg/chrome): capMs p90 vọt 66–93ms, schedLatency
  med 73–95ms, invokeGap tới 200ms, jumps 2–9, ticks rớt 130→29–45. Capture
  ratio rơi theo tải (0,26–0,42 lúc nặng nhất). Đây là đặc tính môi trường VM
  2vCPU chia sẻ, không phải lỗi logic pump — nhưng mọi con số "lúc yên" trong
  LIMITS này đều có điều kiện loadavg ≤~2,7 và không có sibling burst.
- Loadavg 1 phút KHÔNG đủ để biết yên hay không: lượt B lần 1 đo lúc loadavg
  1 phút = 0,44–0,66 nhưng vẫn nhiễm (burst của sibling trong đúng vài giây
  pass chạy). Cần kiểm tra cả `ps` (chrome/ffmpeg/vite của luồng khác) trước
  khi đo, không chỉ loadavg.

## 6. Phát hiện mới: assert2 BÁC giả thuyết mislabel của guard (nợ mở)

So sánh `preview-abcde-assert.json` (00:57, guard 1,5/fps) vs
`preview-abcde-assert2.json` (01:17, guard siết 1/fps+0,5ms) — gStdSpread median:

| spec | assert (1,5/fps) | assert2 (1/fps+0,5ms) |
|---|---|---|
| A | 0,3 | 0,2 |
| B | 45,5 | 45,4 |
| C | 29,4 | 29,5 |
| D | 45,3 | 45,7 |
| E | 45,4 | 45,5 |

Siết guard KHÔNG đổi gì: spread vẫn 3 mức gStd rời rạc (37,5 / 61 / 84,6) trên
cùng cửa sổ blend. Giả thuyết trong comment code `preview.tsx` ("callback trễ
33–50ms lọt qua ngưỡng 1,5/fps → snapshot nhãn K chứa pixels K+1") CHƯA được xác
nhận — nếu đúng, siết ngưỡng phải làm spread co lại. 3 mức rời rạc giống
ring-fill khác nhau giữa các pass (cửa sổ blend có 1/2/3 snapshot khác nhau)
hơn là mislabel. **Nợ mở: điều tra riêng nguyên nhân spread gStd B–E; KHÔNG
claim guard đã sửa spread.** (V1 không sửa code cho việc này.)

## 7. Xung đột đo với luồng V2/V4 (ghi để vòng gộp/V8 biết)

- `preview.tsx` bị sửa liên tục trong lúc V1 đo: V2 (re-arm trần stall, marker
  "Đợt 94 V2") 02:52–03:05, rồi V4 (phát hiện "rVFC im lặng" + memo engine,
  marker "Đợt 94 V4", các dòng ~1373–1789) từ 03:07:45. V1 KHÔNG sửa file này
  (tránh đè code V2/V4) và kiểm tra mtime trước/sau mỗi lượt.
- V4 sửa ĐÚNG vùng pump (lifecycle/kill pump), nên mọi số đo pump của V1 sau
  03:07:45 là trên code đã gồm fix V4 (chưa hoàn thiện lúc đó). Số đo sạch duy
  nhất của V1 sau thời điểm này là `pump94-b-noreg2.json` (V4 fix đã vào, pump
  bắn bình thường 70 callback/pass nên fast-path "im lặng" không kích).
- Đề nghị: V8 kiểm chứng lại pump trên cây ĐÃ GỘP (sau khi V2+V4 xong), lúc VM
  yên thật (cả `ps` lẫn loadavg), vì baseline sạch của V1 cho spec C với guard
  siết vẫn chưa có (C lần 1/2 đều nhiễm).

## 8. Kiểm chứng cuối (trên cây hiện tại, `preview.tsx` mtime 03:07:45, không đổi trong lúc kiểm)

- `npx tsc --noEmit` (apps/web): **exit 0, 0 lỗi** — chạy 2 lần (02:49 trước sửa
  V4 và 03:18 sau sửa V2+V4, đều 0 lỗi).
- `npx vite build`: **exit 0, built in 37,49s** (cảnh báo chunk >500kB có sẵn
  từ trước, không phải do V1).
- Unit `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`
  (từ gốc repo): **exit 0, 18 + 25 test passed, 0 fail** — gồm test
  `videoFrameIndex` µs (đợt 93 U1) và `rvfcFrameDecision` (đợt 91 S1).
- Parity MAD sau memo: **CHƯA ĐO LẠI**. `mask-parity-f.json` (00:01, MAD=0 trên
  240.672 px) chạy TRƯỚC khi memo vào (00:51); memo tái dùng canvas alpha trong
  dung sai 0,005 nên về lý thuyết có thể đổi pixel chút ít — cần V8 đo lại
  parity spec F (+ spec C) trên cây gộp.
- Click-test O8 cả 2 engine: **CHƯA CHẠY** (cần code ổn định + VM yên; cả hai
  điều kiện đều không có trong lượt V1 — V4 cũng đang làm O8 trong bước 4 của
  nó). Mở cho V8.

## 9. File V1 tạo/sửa (batch stage)

V1 không sửa code repo. File duy nhất thêm vào repo là LIMITS này. Dữ liệu đo
thô (JSON pump + log vite/tsc/build/unit + script chạy) ở `~/workspace/round94-v1/out/`
(ngoài repo, không đưa vào batch push):

- `docs/PHASE9_ROUND94_V1_RVFC_PUMP_LIMITS.md` (file này)

Stage: `~/workspace/repo-1-push/paths-loop/phase9-round94-v1-rvfc-pump.txt`
(1 file text, đã verify bằng read-back, 0 binary, 0 workflow).

## 10. Môi trường đo

- VM reboot ~02:34 UTC 12/11 (uptime 3' lúc V1 bắt đầu); RAM khả dụng 1,3–1,9 GB
  lúc đo; 2 vCPU chia sẻ với 7 luồng song song khác (V2–V8) — cửa sổ yên thật
  hiếm, mỗi lượt đo ghi loadavg + RAM trong JSON/log.
- Harness: `apps/web/scripts/probe93u1-rvfc-pump.cdp.mjs` (không sửa);
  vite dev cổng 5173 (V1 tự bật, log `~/workspace/round94-v1/out/vite-5173b.log`);
  Chrome headless Playwright chromium-1254; media `stripes-scroll.mp4` trong
  `apps/web/public/`; spec B (ellipse tĩnh) / C (ellipse bám track).
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v1.md`.
