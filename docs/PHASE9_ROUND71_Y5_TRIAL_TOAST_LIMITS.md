# Phase 9 đợt 71 — Y5: toast trạng thái khi trial keyframe chạy lâu (đóng nợ đợt 70 §4 mục 8)

Ngày: 2026-11-09 (lượt cron 09:35 +07). Máy: VM Linux 2 vCPU / 8 GB (chia sẻ 1,5 CPU), không GPU.
Đóng nợ `docs/PHASE9_ROUND70_LIMITS.md` §4 mục 8 (toast trạng thái khi trial keyframe chạy lâu ~30 s+).
KHÔNG push, KHÔNG release/tag. HEAD GitHub vẫn 5f548ef8 (push #4).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **ĐÃ LÀM XONG — tính năng chạy thật trong editor.** Trial keyframe dài nay có toast trạng thái dính: "Đang kiểm tra keyframe đầu (64.0 MiB)… N giây (chưa có % tiến độ)", hiện khi trial vượt ngưỡng 5 s, cập nhật N mỗi 1 s tại chỗ, tự đóng khi trial xong/lỗi/timeout; trial ngắn (< 5 s) không toast gì.
2. **Không bịa % tiến độ** — đúng như X7 §2.3 cảnh báo: 1 keyframe = 1 lần `VideoDecoder.decode()` duy nhất, không có tiến độ từng phần. Toast chỉ báo giai đoạn decode + thời gian đã trôi qua, và nói thẳng trong nội dung "(chưa có % tiến độ)".
3. **Click-test headed PASS cả 2 lượt:** trial dài 64 MiB — toast thấy +53,3 s (elapsed=5 s), tick 5→65 s (56 giá trị, tăng đơn điệu), tự đóng +114,1 s khi decode-ok, 0 lần hiện lại, không toast timeout; trial ngắn 45 KiB — không toast trạng thái nào trong 40 s.
4. **Hồi quy xanh hết:** tsc web 0, desktop 0, vite build pass, i18n parity PASS (vi=en=2379, +1 key mới), keyframe 62R4 19/19, 63R4 13/13, 64R10 11/11, 65S6 15/15, 66T6 9/9, 67U5 11/11, capThumb 2/2; test mới Y5 6/6 + 6/6 + 3/3.

## 1. Thiết kế (vì sao làm được dù không có tiến độ thật)

### 1.1 Vấn đề

- Trước Y5, UI chỉ có toast *timeout* (S6/U5): toast chỉ xuất hiện SAU KHI trial hết timeout (tới 78,5 s), và chỉ khi timeout thật. Trial dài nhưng decode-ok (33–66 s) thì user không thấy gì suốt thời gian đó — file dường như "đứng yên" trong lúc mở.
- X7 §2.3 đã xét và gác phương án "toast theo tiến độ": 1 keyframe = 1 lần decode() duy nhất, không có sự kiện tiến độ nào từ `VideoDecoder` để báo cáo. Muốn toast trạng thái thì phải thiết kế khác: báo *thời gian chờ*, không báo *phần trăm*.

### 1.2 Thiết kế đã chọn: registry run + toast dính + elapsed

| Lớp | File | Vai trò |
|---|---|---|
| Registry run (thuần, test Node được) | `apps/web/src/lib/trialDecodeRunning71Y5.ts` (mới) | `beginTrialDecodeRun` / `endTrialDecodeRun` / `activeTrialDecodeRuns` / `subscribeTrialDecodeRunning` (mẫu `subscribeTrialDecodeTimeoutNotes` của U5). Map các run đang chạy (nhiều controller có thể trial cùng lúc); UI hiện run cũ nhất. |
| Hook T3 | `apps/web/src/lib/gopRangeFetch39T3.ts` | Bọc cả 2 điểm gọi `runTrialDecode` (stream-mode + all-mode) bằng begin/end trong `finally` — probe thắng/thua/timeout/throw đều dọn run, không kẹt lại. |
| Toast dính + cập nhật tại chỗ | `apps/web/src/lib/toast.ts`, `apps/web/src/components/Toasts.tsx` | `pushToast(msg, kind, {sticky:true})` (toast dính: component không hẹn giờ tự đóng 4,5 s, chỉ đóng khi caller dismiss hoặc bấm ×); `updateToast(id, msg)` đổi nội dung tại chỗ, giữ id/vị trí, không reset hẹn giờ. Toast thường không đổi hành vi. |
| UI glue | `apps/web/src/preview.tsx` (effect mới, cạnh effect timeout-note U5) | Đăng ký registry; trial còn chạy sau ngưỡng 5 s (`TRIAL_DECODE_RUNNING_TOAST_DELAY_MS`) thì push toast dính; interval 1 s cập nhật elapsed; run biến mất → đóng toast ngay; user bấm × thì không hiện lại cho run đó (tick thấy `updateToast` false thì dừng). |
| Chuỗi i18n | `gop.trial.running` (vi/en + fragment `round71-y5.json`) | vi: "Đang kiểm tra keyframe đầu ({size} MiB)… {elapsed} giây (chưa có % tiến độ)"; en: "Checking first keyframe ({size} MiB)… {elapsed}s (no % progress yet)". `{size}` = MiB 1 số lẻ, `{elapsed}` = giây nguyên (làm tròn xuống). |

### 1.3 Vì sao ngưỡng 5 s

- Trial thường: sample ≤ 256 KiB decode ~10–70 ms; keyframe 4K ~0,6–1,2 s (đo O6). Ngưỡng 5 s đủ dài để trial thường không bao giờ chạm tới (không làm phiền user mở file bình thường), đủ ngắn để user mở file keyframe lớn thấy phản hồi trước khi chờ hàng chục giây.
- Ngưỡng là hằng UI, không phải timeout decode — trial vẫn chạy tới hết timeout riêng của nó (200 ms–78,5 s).

## 2. Kiểm chứng

### 2.1 Test Node mới (chạy thật, không mock kết quả)

| Test | Kết quả |
|---|---|
| `trialDecodeRunning71Y5.test.ts` (registry) | **6/6** — hằng ngưỡng/tick, begin/end, end id lạ no-op, nhiều run xếp cũ trước, subscribe notify đúng 1 lần/begin-end + unsubscribe, listener lỗi không chặn listener khác |
| `toast71Y5.test.ts` (sticky/update) | **6/6** — toast thường không sticky, sticky mang cờ, update tại chỗ giữ id/thứ tự/kind/sticky, update cùng nội dung, update id lạ false, dismiss/clear đóng được sticky |
| `gopRangeFetch71Y5.test.ts` (T3 tích hợp: fixture ffmpeg thật + server HTTP Range thật) | **3/3** — probe chậm 150 ms: run HIỆN trong lúc chờ (sampleBytes>0, viaWorker=false, timeout 200 ms) rồi BIẾN MẤT sau khi xong; probe trả ngay: xong không còn run; probe ném lỗi sau 100 ms: run hiện trong lúc chờ, dọn sau fail-open |

### 2.2 Hồi quy (cây đã gộp Y5)

- `npx tsc --noEmit` apps/web: **0 lỗi** (trực tiếp, không pipe). apps/desktop: **0 lỗi**.
- `npm run build` apps/web (tsc + vite build): **PASS, built in 39,19 s** (cảnh báo chunk >500 kB có sẵn từ trước).
- `scripts/r6-i18n-check.cjs`: **PASS** (vi=en=2379; +1 key `gop.trial.running`).
- Keyframe: 62R4 **19/19**, 63R4 **13/13**, 64R10 **11/11**, 65S6 **15/15**, 66T6 **9/9**, 67U5 **11/11**, capThumb **2/2**.
- `npm run test:unit` (render) không chạy lại trong luồng này (không đụng server/render; T3/keyframe đã bao đường đổi).

### 2.3 Click-test headed (app thật, bundle `index-DnpjYUK_.js`, snapshot `dist-snap-71y5`)

Harness `~/scratch-round71-y5/clicktest-71y5-trial-toast.mjs` (mẫu V5, CDP pipe + Xvfb :215, port 4215, poll theo đồng hồ tường 500 ms, evaluate timeout 15 s). Kết quả `clicktest-71y5-trial-toast.json`. **Verdict: PASS.**

**Lượt A — trial dài (clip 70 s, keyframe đầu 64,0 MiB):**
- Baseline loadavg 1-phút **13,82** (rất nặng — các luồng đợt 71 khác đang chạy; max trong poll 15,87) — KHÔNG phải điều kiện yên, nhưng trial vẫn decode-ok nên verdict vẫn có giá trị cho hành vi toast.
- Import OK 16,8 s. Bấm Phát ngược → toast trạng thái **thấy lần đầu +53,3 s với elapsed=5 s** → decode bắt đầu ~+48,3 s (fetch remainder 128 chunk 512 KiB tốn ~48 s dưới tải — khớp W2 §3: fetch 50–130 s+ trước khi đồng hồ timeout chạy).
- Elapsed tick **5→65 s, 56 giá trị, tăng đơn điệu** (có khoảng trống 29→35 s: poll trượt ~6,6 s do 1 evaluate chậm 9.952 ms dưới tải — toast trong trang vẫn tick mỗi 1 s, chỉ là poll không lấy được mẫu; không phải lỗi toast).
- Toast **tự đóng +114,1 s** (lần thấy cuối +113,6 s, elapsed=65 s) → decode-ok sau ~66 s, trước timeout 78,5 s. **0 lần hiện lại** trong phần poll còn lại (~126 s). **Không có toast timeout.**
- evalCount 396, evalSlow 1, evalMaxMs 9.952 ms.

**Lượt B — trial ngắn (clip 60 s 1080p tự tạo, keyframe đầu 45.067 byte, file 50 MiB > ngưỡng GOP 32 MiB):**
- Import OK 5,1 s. **Không có toast trạng thái nào trong 40 s poll** — ngưỡng 5 s chặn đúng.
- Ghi nhận (không phải lỗi Y5): toast timeout-note S6 xuất hiện +1,2 s — "Keyframe đầu (0.0 MiB) chưa kiểm chứng kịp trong 200 ms" — trial 45 KiB thua timeout 200 ms dưới tải (loadavg ~5–6 lúc đó). Đây là hành vi fail-open có sẵn, chứng tỏ trial CÓ chạy và vẫn < 5 s nên Y5 không toast — đúng thiết kế. (Toast Bridge không chạy ở cả 2 lượt là nhiễu môi trường click-test, bridge không chạy, không liên quan.)

## 3. File đổi (stage, KHÔNG push)

- `apps/web/src/lib/trialDecodeRunning71Y5.ts` (mới — registry)
- `apps/web/src/lib/trialDecodeRunning71Y5.test.ts` (mới — 6 test)
- `apps/web/src/lib/toast71Y5.test.ts` (mới — 6 test)
- `apps/web/src/lib/gopRangeFetch71Y5.test.ts` (mới — 3 test tích hợp)
- `apps/web/src/lib/toast.ts` (sticky + updateToast)
- `apps/web/src/components/Toasts.tsx` (sticky không tự đóng)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (bọc 2 điểm gọi trial bằng begin/end)
- `apps/web/src/preview.tsx` (effect toast trạng thái + refs)
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (key `gop.trial.running`)
- `apps/web/src/i18n/fragments/round71-y5.json` (mới)
- `apps/web/tsconfig.json` (thêm 3 file test vào exclude, theo mẫu các test khác)
- `docs/PHASE9_ROUND71_Y5_TRIAL_TOAST_LIMITS.md` (file này)

## 4. Giới hạn / nợ còn lại (trung thực)

1. **Toast chỉ bao GIAI ĐOẠN DECODE, không bao giai đoạn fetch remainder.** Trước khi decode bắt đầu, T3 phải fetch phần còn lại của sample 0 (chunked 512 KiB, tới 64 MiB, 128 request): dưới tải nặng bước này tốn ~48 s (đo ở lượt A) và W2 đo 50–130 s+. Trong khoảng đó user vẫn không thấy toast nào của Y5 — toast đầu tiên chỉ xuất hiện 5 s SAU KHI decode bắt đầu. Đây là khoảng trống UX còn lại của chính nợ này; muốn lấp phải thêm trạng thái "đang tải keyframe…" ở T3 (fetch có tiến độ thật theo chunk, khác với decode) — đề xuất cho đợt sau, không làm trong Y5 để giữ thay đổi tối thiểu.
2. **Không có % tiến độ thật — và sẽ không bao giờ có cho 1 keyframe.** Elapsed chỉ là thời gian chờ; decode có thể xong ngay giây sau hoặc còn 60 s nữa. Toast nói rõ "(chưa có % tiến độ)" để không hứa hẹn. Đây là giới hạn thiết kế, không phải bug.
3. **Đổi ngôn ngữ giữa trial đang chạy thì toast đóng + hẹn giờ 5 s chạy lại từ đầu** (effect `[previewLang]` cleanup). User đổi lang đúng lúc trial dài sẽ thấy toast biến mất rồi hiện lại sau ~5 s. Hiếm, chấp nhận được; ghi rõ để đợt sau khỏi tưởng là bug.
4. **Nhiều trial cùng lúc chỉ hiện run cũ nhất.** Mở 2 clip lớn cùng lúc (2 controller trial song song) thì toast chỉ báo run bắt đầu trước. Hiếm trong thực tế (mở 1 file/lần); registry vẫn theo dõi đủ các run.
5. **Khoảng trống poll 29→35 s ở lượt A** là do evaluate CDP chậm dưới tải (9.952 ms), không phải toast ngừng tick — elapsed trong trang vẫn tăng mỗi 1 s; các mẫu poll trước/sau khoảng trống chứng minh tính đơn điệu. Harness sau muốn bắt đủ mọi giây thì poll dày hơn / đọc trực tiếp DOM giữa các lần updateToast.
6. **Lượt A chạy dưới tải rất nặng (baseline 13,82), không phải điều kiện yên.** Verdict PASS cho hành vi toast (hiện/tick/đóng/không hiện lại) vẫn đứng vì decode-ok trước timeout; nhưng thời gian tuyệt đối (fetch ~48 s, decode ~66 s) là số dưới tải, KHÔNG dùng làm baseline hiệu năng lúc yên (lúc yên X7 đo decode 64 MiB 32,7–38,0 s).
7. **Lượt B cho thấy trial 45 KiB thua timeout 200 ms dưới tải** (toast timeout-note S6 xuất hiện). Không phải lỗi Y5, nhưng nhắc lại rằng timeout main-thread 200 ms cho sample nhỏ vẫn mong manh dưới tải — nợ này thuộc về công thức timeout (đợt 58 O6), không thuộc Y5.
8. **Không đụng file chung với luồng khác trong đợt 71 theo kiểm tra lúc làm:** `toast.ts`, `Toasts.tsx`, `preview.tsx`, `gopRangeFetch39T3.ts`, `vi.json`/`en.json` chỉ Y5 sửa trong lượt này (tsc + build + i18n check chạy SAU mọi sửa của Y5 đều xanh). Nếu luồng khác cùng sửa các file này, parent gộp cần kiểm tra lại diff.
9. Harness/probe/log click-test ở `~/scratch-round71-y5/` (ngoài repo, không đưa vào batch): `clicktest-71y5-trial-toast.mjs`, `clicktest-71y5-trial-toast.json`, `clicktest-71y5.log`, `dist-snap-71y5/`, `reg/*.mjs`, `smallkey-60s.mp4` (fixture tự tạo, 52.390.573 byte), `load/`. Fixture `bigkey-64mib-70s.mp4` tái dùng từ `~/scratch-round68-v5/`.
10. `~/workspace/repo-1` KHÔNG có thư mục `.git` (ghi nhận từ đợt 70 X7, vẫn vậy) — staging chỉ là file paths.
