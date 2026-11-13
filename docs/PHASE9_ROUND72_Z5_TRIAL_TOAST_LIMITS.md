# Phase 9 đợt 72 — Z5: toast trial keyframe bao cả fetch remainder + đổi ngôn ngữ không đóng toast + báo số file khác (đóng nợ đợt 71 §5 mục 5)

Ngày: 2026-11-09 (lượt cron 12:35 +07). Máy: VM Linux 2 vCPU / 8 GB (chia sẻ 1,5 CPU), không GPU.
Đóng nợ `docs/PHASE9_ROUND71_LIMITS.md` §5 mục 5 (toast trial chỉ bao decode, không bao fetch remainder).
KHÔNG push, KHÔNG release/tag. HEAD GitHub vẫn 5f548ef8 (push #4).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **ĐÃ LÀM XONG — cả 3 điểm của nợ §5 mục 5, tính năng chạy thật trong editor:**
   - (a) Toast nay bao cả GIAI ĐOẠN FETCH remainder: "Đang tải keyframe đầu (x / 64,0 MiB)… N giây" với x là số MiB đã fetch **THẬT theo chunk 512 KiB** (không progress giả), hiện sau ngưỡng 5 s, rồi cùng 1 toast đổi sang "Đang kiểm tra keyframe đầu…" khi fetch xong.
   - (b) Đổi ngôn ngữ giữa trial: toast **KHÔNG đóng nữa** — dịch lại tại chỗ trong ~0,5 s, không hẹn lại 5 s, không reset số giây.
   - (c) Nhiều trial cùng lúc: toast vẫn báo run cũ nhất, nhưng thêm hậu tố "(+N file khác đang kiểm tra)" để user biết còn run khác.
2. **Click-test headed PASS cả 2 lượt:** lượt A (clip 70 s, keyframe 64 MiB) — fetch toast thấy +10,2 s, **44 giá trị fetched tăng đơn điệu 2,3 → 63,8 MiB**, đổi lang 2 chiều mỗi chiều 0 poll trống, decode toast tick 0→45 s, tự đóng +89,0 s, 0 lần hiện lại, không toast timeout; lượt B (trial ngắn 45 KiB) — không toast nào trong 40 s.
3. **Hồi quy xanh hết (trừ 2 nhóm khóa số key chờ luồng đóng sổ bump, xem §4):** tsc web 0, vite build pass, i18n parity PASS (vi=en=2381, **+2 key mới**), registry 6/6 + 6/6, toast 6/6, T3 tích hợp Z5 4/4 + Y5 3/3, N10 17/17, P6 16/16, Q5 15/15, keyframe 62R4 19/19, 63R4 13/13, 64R10 11/11, 65S6 15/15, 66T6 9/9, 67U5 11/11.
4. **Không đụng `toast.ts` / `Toasts.tsx`:** cơ chế sticky + updateToast của Y5 đã đủ, Z5 chỉ dùng lại — không sửa 2 file này.

## 1. Thiết kế

### 1.1 Vấn đề (nợ Y5 §4 mục 1, 3, 4)

- Trước Z5, run trial chỉ được đăng ký khi `runTrialDecode` bắt đầu — tức SAU khi T3 đã fetch xong phần còn lại của sample 0 (chunked 512 KiB, tới 64 MiB, 128 request). Dưới tải nặng bước này tốn ~48 s (Y5 đo) tới 50–130 s+ (W2), trong khi đồng hồ timeout 78,5 s chỉ bắt đầu SAU khi fetch xong. Trong khoảng đó user không thấy toast nào — khoảng trống UX còn lại của chính nợ trial-toast.
- Đổi ngôn ngữ giữa trial thì effect `[previewLang]` chạy lại: toast đóng + hẹn giờ 5 s chạy lại từ đầu.
- Nhiều trial cùng lúc chỉ hiện run cũ nhất, im lặng về các run còn lại.

### 1.2 Thiết kế đã chọn: 1 run bao trọn fetch + decode, 1 toast đổi nội dung theo phase

| Lớp | File | Vai trò |
|---|---|---|
| Registry mở rộng | `apps/web/src/lib/trialDecodeRunning71Y5.ts` | Run thêm `phase: "fetch" \| "decode"`, `phaseStartedAtMs`, `fetchedBytes`, `totalBytes`. `beginTrialFetchRun` (đăng ký từ lúc fetch, `fetchedBytes` khởi tạo = tiền tố AVCC 256 KiB đã có thật) / `updateTrialFetchProgress` (kẹp [0, total], chỉ notify khi đổi) / `markTrialDecodeStarted` (chuyển phase, đặt lại `phaseStartedAtMs`, `fetchedBytes` = đủ sample). `beginTrialDecodeRun` (Y5) mặc định phase "decode", `fetchedBytes` = đủ sample — hành vi cũ không đổi. |
| T3 | `apps/web/src/lib/gopRangeFetch39T3.ts` | `fetchSampleRemainderChunked` thêm tham số tùy chọn `onProgress(fetched)` (gọi sau mỗi chunk, try/catch để callback lỗi không hỏng fetch). Stream-mode: tính `trialPlan` sớm → `beginTrialFetchRun` trước khi fetch → `onProgress` cập nhật registry từng chunk → fetch xong thì `markTrialDecodeStarted` và TÁI DÙNG cùng run id cho decode (không tạo run mới — toast giữ nguyên 1 toast); fetch lỗi giữa chừng thì `endTrialDecodeRun` ngay (không kẹt toast). All-mode không đổi (không có fetch remainder, vẫn `beginTrialDecodeRun`). |
| UI glue | `apps/web/src/preview.tsx` | `trialRunningMessage(run, totalRuns)` hoist ra ngoài effect (dùng chung cho effect chính + effect đổi lang): phase fetch → key `gop.trial.fetching` (`{fetched} / {size} MiB`, elapsed tính từ `phaseStartedAtMs` — fetch 38 s rồi decode 45 s thì toast decode bắt đầu lại từ 0 s, không cộng dồn); phase decode → key `gop.trial.running` như Y5; `totalRuns > 1` thì thêm key `gop.trial.others` ("(+N file khác đang kiểm tra)"). Effect chính dep `[]` (chỉ chạy 1 lần lúc mount — `i18nT` đọc ngôn ngữ hiện tại động nên tick vẫn dùng đúng ngôn ngữ); effect riêng `[previewLang]` dịch lại toast đang hiện TẠI CHỖ bằng `updateToast` (không đóng, không hẹn lại 5 s). Sync khi notify nay luôn `updateToast` (no-op emit khi nội dung không đổi nên mỗi chunk fetch không spam re-render); `updateToast` false → user đã bấm × → dừng, không push lại. |
| Chuỗi i18n | `gop.trial.fetching`, `gop.trial.others` (vi/en + fragment `round72-z5.json`) | vi: "Đang tải keyframe đầu ({fetched} / {size} MiB)… {elapsed} giây"; en: "Downloading first keyframe ({fetched} / {size} MiB)… {elapsed}s". vi: "(+{count} file khác đang kiểm tra)"; en: "(+{count} more file(s) checking)". `{fetched}`/`{size}` = MiB 1 số lẻ, `{elapsed}` = giây nguyên trong từng phase. |

### 1.3 Vì sao tiến độ fetch là thật còn tiến độ decode thì không

- Fetch remainder là 128 request Range 512 KiB nối tiếp: sau mỗi request, số byte ĐÃ CÓ trong tay là biết chắc chắn (tiền tố + chunk đã về) — tiến độ = `fetchedBytes / totalBytes`, không ước lượng, không nội suy. Toast báo đúng số MiB đã tải, không báo % (tránh hứa hẹn tốc độ còn lại — chunk sau có thể chậm hơn chunk trước dưới tải).
- Decode vẫn là 1 lần `decode()` duy nhất, không có sự kiện tiến độ — giữ nguyên thiết kế Y5 (chỉ báo elapsed + "(chưa có % tiến độ)").

## 2. Kiểm chứng

### 2.1 Test Node mới (chạy thật, không mock kết quả)

| Test | Kết quả |
|---|---|
| `trialFetchRunning72Z5.test.ts` (registry mở rộng) | **6/6** — begin fetch (phase/fetchBytes/total/phaseStartedAtMs), update tăng theo chunk + notify mỗi lần đổi + cùng giá trị không notify, kẹp về total + id lạ false, mark decode (phase flip, phaseStartedAtMs đặt lại, fetched = đủ), beginTrialDecodeRun mặc định phase decode, nhiều run fetch+decode xếp cũ trước + end dọn đúng run |
| `gopRangeFetch72Z5.test.ts` (T3 tích hợp: fixture bigkey thật + server HTTP Range thật) | **4/4** — unit onProgress: 6 mốc tăng dần đúng chunk (262144 + k×512 KiB → 3000000) + callback ném lỗi không hỏng fetch; stream + sample 64 MiB + server chậm 25 ms/chunk: **381 snapshot (369 fetch / 12 decode), 128 mốc tiến độ 0,3 → 63,8 MiB**, phase fetch → decode → biến mất; stream + chunk remainder 416: fail-open, run được dọn, không kẹt |

### 2.2 Hồi quy (cây đã gộp Z5)

- `npx tsc --noEmit` apps/web: **0 lỗi** (trực tiếp, không pipe).
- `npm run build` apps/web (tsc + vite build): **PASS, built in 15,37 s** (bundle `index-BIYCmVdZ.js`; cảnh báo chunk >500 kB có sẵn từ trước).
- `scripts/r6-i18n-check.cjs`: **PASS** (vi=en=2381; +2 key `gop.trial.fetching`, `gop.trial.others`).
- Registry Y5 **6/6**, toast Y5 **6/6**, T3 Y5 **3/3**, N10 **17/17**, P6 **16/16**, Q5 **15/15** (chạy bằng esbuild bundle; N10/P6/Q5 phải dùng `--format=esm` vì file có top-level await — header CJS của chúng đã lỗi thời, xem §4 mục 4).
- Keyframe: 62R4 **19/19**, 63R4 **13/13**, 64R10 **11/11**, 65S6 **15/15**, 66T6 **9/9**, 67U5 **11/11**.
- i18nOrphans60Q4: **15/16** — chỉ 1 check đỏ là khóa số key 2379 (xem §4 mục 1); các check còn lại (kể cả không-orphan cho 2 key mới) xanh.

### 2.3 Click-test headed (app thật, bundle `index-BIYCmVdZ.js`, snapshot `dist-snap-72z5`)

Harness `~/scratch-round72-z5/clicktest-72z5-trial-toast.mjs` (adapt từ Y5, CDP pipe + Xvfb :216, port 4216, poll 500 ms). Kết quả `clicktest-72z5-trial-toast.json`. **Verdict: PASS.**

**Lượt A — trial dài (clip 70 s, keyframe đầu 64,0 MiB):**
- Baseline loadavg 1-phút **8,51** (nặng — các luồng đợt 72 khác đang chạy; max trong poll 10,84) — KHÔNG phải điều kiện yên, nhưng trial decode-ok nên verdict vẫn có giá trị cho hành vi toast.
- Import OK 12,9 s. Bấm Phát ngược → toast fetch **thấy lần đầu +10,2 s với elapsed=5 s** (đã tải 2,3 MiB) → fetch remainder bắt đầu ~+5,2 s (HEAD/probe/tiền tố/AVCC trước đó ~5 s dưới tải).
- Fetched **44 giá trị, tăng đơn điệu: 2,3 → 63,8 MiB** (bước 0,5 MiB/chunk, có khoảng trống do poll trượt — toast trong trang vẫn cập nhật mỗi chunk, chỉ là poll 500 ms không lấy được mọi mốc; 128 mốc thật đã chứng minh ở test T3 §2.1). Fetch xong +41,7 s (mốc cuối 63,8 MiB) → **fetch remainder tốn ~36,5 s** dưới tải này (Y5 đo ~48 s dưới tải nặng hơn).
- **Đổi ngôn ngữ 2 chiều giữa fetch:** bấm →EN +12,9 s → toast tiếng Anh thấy +13,4 s (**trễ 0,5 s, 0 poll trống**); bấm →VI +14,3 s → toast tiếng Việt thấy lại +14,9 s (**trễ 0,6 s, 0 poll trống**). Hành vi cũ (Y5) sẽ để trống ~10 poll (~5 s) — đã sửa đúng.
- **Chuyển phase:** toast decode thấy lần đầu +43,2 s với **elapsed=0 s** (đếm lại từ lúc decode bắt đầu, không cộng dồn 38 s fetch — đúng thiết kế §1.2), tick **0→45 s** (42 giá trị, tăng đơn điệu).
- Toast **tự đóng +89,0 s** (lần thấy cuối decode +88,5 s, elapsed=45 s) → decode-ok sau ~45 s, trước timeout 78,5 s. **0 lần hiện lại. Không có toast timeout.**
- evalCount 123, evalSlow 0, evalMaxMs 2.718 ms.
- Ghi nhận (nhiễu môi trường, không phải lỗi Z5): toast "Bridge không chạy (http://127.0.0.1:8787)…" xuất hiện ở cả 2 lượt — bridge không chạy trong click-test, không liên quan.

**Lượt B — trial ngắn (clip 60 s 1080p tự tạo, keyframe đầu 45.067 byte, file 50 MiB):**
- Import OK 13,3 s. **Không có toast trạng thái nào (fetch lẫn decode) trong 40 s poll** — ngưỡng 5 s chặn đúng (hồi quy Y5).

## 3. File đổi (stage, KHÔNG push)

- `apps/web/src/lib/trialDecodeRunning71Y5.ts` (mở rộng registry: phase/fetchBytes/totalBytes + 3 hàm mới)
- `apps/web/src/lib/trialFetchRunning72Z5.test.ts` (mới — 6 test)
- `apps/web/src/lib/gopRangeFetch72Z5.test.ts` (mới — 4 test tích hợp)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (onProgress chunked fetch + đăng ký run từ lúc fetch stream-mode)
- `apps/web/src/preview.tsx` (message theo phase + hậu tố số file khác + effect mount-once + effect dịch lại khi đổi lang)
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (2 key mới `gop.trial.fetching`, `gop.trial.others`)
- `apps/web/src/i18n/fragments/round72-z5.json` (mới)
- `apps/web/tsconfig.json` (thêm 2 file test vào exclude, theo mẫu Y5)
- `docs/PHASE9_ROUND72_Z5_TRIAL_TOAST_LIMITS.md` (file này)

**KHÔNG sửa:** `apps/web/src/lib/toast.ts`, `apps/web/src/components/Toasts.tsx` (cơ chế sticky + updateToast của Y5 đã đủ — Z5 chỉ dùng lại, không cần đổi 2 file này).

## 4. Giới hạn / nợ còn lại (trung thực)

1. **12 test khóa số key + css60 CHƯA bump — luồng đóng sổ làm (đã xác nhận chính xác số cần bump).** Dict nay vi=en=**2381** (+2 key). `i18nOrphans60Q4` chạy lại: **15/16**, chỉ đỏ đúng check đếm key ("vi.json phải có 2379 key lá, nhận 2381"). `cssClasses60Q2` §8: danh sách key `preview.tsx` thiếu đúng 2 key mới (`gop.trial.fetching`, `gop.trial.others`); call site `i18nT` trong `preview.tsx` nay = **50** (48 → 50), unique key = 44. Luồng đóng sổ bump 2379 → 2381 ở 12 file như đợt 71 (ProjectMenu.i18n55L1, speedWarnTooShortDead63R10, reverseToggleI18n48D4, errorDetail34Q4, reverseBadge46B6, reverseCompat44Z6, reversePlaybackI18n49E2, i18nRound57N4, saveToast31, structuredNotes32, i18nAudit59P7, i18nOrphans60Q4) + cập nhật css60 (+2 key, 48 → 50). Z5 cố tình KHÔNG tự bump theo lệnh luồng.
2. **Hậu tố "(+N file khác)" chưa được click-test headed.** (c) chỉ được kiểm chứng ở tầng registry (test multi-run 6/6: 2 run cùng tồn tại, xếp cũ trước) + logic `totalRuns > 1` trong `trialRunningMessage` — chưa có lần chạy headed nào với 2 trial song song thật, vì UI thực tế hiếm khi trial 2 clip cùng lúc (cần 2 controller trial đồng thời; Y5 cũng ghi nhận là hiếm). Rủi ro thấp (3 dòng code, key đã vào dict, i18nOrphans xanh) nhưng ghi rõ: chưa có bằng chứng headed cho hậu tố này.
3. **Khoảng trống poll ở lượt A (fetch 52,3 → 52,8 MiB mất ~2,8 s, elapsed nhảy 30 → 33 s)** là do evaluate CDP chậm / tải (loadavg max 10,84), không phải toast ngừng cập nhật — 128 mốc thật đã chứng minh ở test T3 §2.1. Harness sau muốn bắt đủ mọi mốc thì poll dày hơn / đọc trực tiếp DOM.
4. **Lượt A chạy dưới tải nặng (baseline 8,51, max 10,84), không phải điều kiện yên.** Verdict PASS cho hành vi toast vẫn đứng vì decode-ok trước timeout; nhưng thời gian tuyệt đối (fetch ~36,5 s, decode ~45 s) là số dưới tải, KHÔNG dùng làm baseline hiệu năng lúc yên (Y5: fetch ~48 s, decode ~66 s dưới tải nặng hơn; X7 lúc yên decode 64 MiB 32,7–38,0 s).
5. **Elapsed của toast fetch/decode đếm theo từng phase, không cộng dồn.** User thấy fetch đếm tới 38 s rồi decode đếm lại từ 0 s — đúng thiết kế (tránh cộng dồn thời gian fetch vào số giây decode), nhưng có thể gây hiểu lầm "sao decode lại 0 giây". Đây là lựa chọn có chủ ý, ghi rõ để đợt sau khỏi tưởng là bug.
6. **Header chạy test N10/P6/Q5 ghi `--format=cjs` nhưng file có top-level await** (`await runAll();` cuối file) nên esbuild CJS lỗi "Top-level await is not supported" — phải chạy bằng `--format=esm` + `.mjs` (đã chạy xanh 17/17, 16/16, 15/15 bằng ESM). Header lỗi thời này có từ trước, không phải do Z5; đợt sau sửa header hoặc giữ ESM.
7. Harness/probe/log click-test ở `~/scratch-round72-z5/` (ngoài repo, không đưa vào batch): `clicktest-72z5-trial-toast.mjs`, `clicktest-72z5-trial-toast.json`, `clicktest-72z5.log`, `dist-snap-72z5/`, `chrome-profile-72z5/`. Fixture `bigkey-64mib-70s.mp4` tái dùng từ `~/scratch-round68-v5/`, `smallkey-60s.mp4` từ `~/scratch-round71-y5/`.
8. `~/workspace/repo-1` KHÔNG có thư mục `.git` — staging chỉ là file paths (như các đợt trước).
