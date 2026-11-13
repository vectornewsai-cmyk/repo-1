# PHASE9_ROUND102_D3_ZOMBIE_LIMITS — FIX khe early-return qua seek-across: ĐÃ LAND + ĐO ĐƯỢC

> Luồng D3, đợt 102. Lượt cron 09:35 +07 13/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> Nợ: LIMITS gộp đợt 101 §4 mục 7 (khe early-return ĐÃ quan sát được qua
> seek-across — C5: check A6 bắn 24/24 biên seek-across, trễ 23–123 ms;
> phát tick-by-tick 0/70; nợ mới C5 §5.1 stale first-frame của pump mới).
> Chốt chặn: không có `round-in-progress.md` lúc bắt đầu.

## 0. Tóm tắt verdict — FIX ĐÃ LAND, KHE ĐÃ ĐÓNG (đo được)

**Khe early-return qua seek-across ĐÃ ĐÓNG bằng kill đồng bộ tại lúc seek
— không còn chờ callback rVFC đầu tiên sau cú nhảy.**

- Trước fix (baseline d3x0, build `07f56792`, 24 clip, 23 cú seek-across):
  check A6 trong `rvfcCallback` bắn **11 lần** (c0 chết bằng owner-kill trước),
  frameIdx 67–89, trễ qua sampler 18–50 ms — khớp mẫu C5 R3 (12/12).
- Sau fix (6 lượt đo, 2 cây): **`skip-clip-inactive` = 0 ở cả 6 lượt** (tổng
  114 biên seek-across + 23 biên thường). Pump cũ chết đồng bộ trong
  `setPlayhead`, ghi fb **`seek-inactive`: 11/11 (d3x1), 10/11 (d3x2),
  11/11 thường (d3n1), 12/12 đối chứng tắt owner-kill (d3c1), 12/12 (d3x3),
  12/12 (d3x4)**.
- **Đối chứng dương decisive (d3c1):** tắt owner-kill (kill draw-path) mà sync
  kill vẫn đóng khe 12/12 — trước fix, C5 c5c3 cùng điều kiện thì check A6
  phải bắn 6/6; nay check bắn 0/12 vì pump đã chết trước callback.
- Zombie Δ = 0 ở mọi biên đo được, mọi lượt; 0 capture trong cửa sổ clip lẻ
  ở 5/6 lượt (1 ca duy nhất ở d3x2 — xem §3, đã vá bằng gate tạo pump và
  verify lại sạch ở d3x3/d3x4).
- Pixel parity đứng: clip lẻ (không blur) C 75–100%, D = 0, out = 0 mọi lượt.
- Hồi quy: tsc web 0, vite build PASS, Hold 75/75, Pacing 19/19,
  previewEngine 27/27, seek 21/21, seekSkip 9/9, previewLoop 20/20,
  ghostBlend 15/15, test-preview-engine.sh 354 assertions pass.

## 1. Fix đã land (production code thật, 3 phần)

### 1.1 D3-1 — Kill đồng bộ khi playhead nhảy (chính)

- Mới: `rvfcKillPumpsOutsidePlayhead(ph)` trong `preview.tsx` + gọi trong
  `useStore.subscribe` của effect preview khi `s.playhead !== prev.playhead`.
  Zustand subscriber chạy **đồng bộ trong `set()`** (tức trong `setPlayhead`),
  trước khi bất kỳ callback rVFC nào kịp bắn (JS đơn luồng) — đóng đúng cửa
  sổ C5 đã đo (seek nhảy playhead qua biên giữa 2 tick; callback cũ bắn
  23–123 ms sau; owner-kill chưa kịp chạy vì chưa có tick nào chạy
  syncMedia/draw).
- Vị ngữ y hệt check A6 (`isPlayheadOutsideClipWindow`, lib mới
  `apps/web/src/lib/rvfcClipWindow.ts` — cửa sổ nửa mở `[start,
  start+duration)`); thứ tự kill y hệt đường A6 (`rvfcKillPump` lý do
  `"seek-inactive"` + xoá khỏi map + hồi dead nếu chưa chết vì lý do khác →
  seek về lại vẫn tạo pump mới được). Check A6 trong `rvfcCallback` nay dùng
  chung vị ngữ (không đổi ngữ nghĩa — giữ làm lớp phòng thủ thứ hai).
- Đếm dồn lên `window.__vcut102d3SeekKills`.
- Tác dụng phụ (đo được ở d3n1): phát tick-by-tick thường cũng thấy fb
  `seek-inactive` (11/11) thay vì `clip-change` — tick `setPlayhead` vượt
  biên → subscriber kill trước cả draw; kết quả như nhau (zombie Δ 0), chỉ
  khác "ai kill". Khe hẹp tick-by-tick (B5/C5 chưa quan sát được, 0/70) cũng
  đóng theo, cùng vị ngữ.
- Không kill oan khi chồng lấn/PiP: mỗi pump xét cửa sổ riêng; duration ≤ 0
  / playhead không hữu hạn → không kill. Chi phí: subscriber chỉ lặp map
  khi map pump không rỗng và playhead đổi.

### 1.2 D3-2 — Chặn capture khi element đang seeking (phụ, nợ C5 §5.1)

- Trong `rvfcCallback`, sau register-first: nếu `pump.el.seeking` thì decision
  `"skip-seeking"`, không capture (callback kế sau khi seek đáp sẽ capture
  đúng frame; không kill pump, không đụng ring). Bắn 5 lần (d3x1) / 2 lần
  (d3x2, d3n1, d3c1) — guard có hoạt động.
- Giới hạn (xem §3): guard chỉ chặn được khi seek ĐÃ bay; tick đầu sau nhảy
  chưa phát seek (cần 2 tick xác nhận drift) thì seeking=false → vẫn lọt
  1 ca ở d3x2. Đã vá bằng §1.3.

### 1.3 Bổ sung — Hoãn tạo pump khi element chưa định vị (gate, sau đo d3x2)

- `ensureRvfcPump` không tạo/khởi động lại pump khi element lệch
  `expectedMediaTime` (= `rampSourceTimeAt(clip, t)` ở call site trong
  `drawVideoClip`) hơn **0,35 s** mà chưa seeking — vị ngữ thuần
  `shouldDeferRvfcPumpCreation` (cùng file lib, test 21/21), ngưỡng lấy đúng
  hằng re-seek `FORWARD_RESEEK_THRESHOLD_S` để 2 đường không lệch nhau.
  Đường tick vẽ frame đó như cũ; tick sau seek đã bay (seeking=true) hoặc
  drift đã nhỏ thì tạo pump bình thường. Chỉ áp lúc tạo/khởi động lại —
  pump đang sống không ảnh hưởng (không đói ring trong lúc hold).
- Trade-off: khi drift bị ân hạn chặn seek lâu (watch/grace 95W5/96X4/97Y4),
  pump tạo muộn hơn (đường tick vẫn vẽ). Không đo được độ trễ tạo pump trực
  tiếp trong các lượt verify — caps dày ở d3x4 (444 capture) cho thấy không
  đói pump trên thực tế.
- Cây verify cuối: `preview.tsx` md5 `e886e754` (lúc land gate) — nhưng các
  lượt d3x3/d3x4 chạy trên md5 `ed260e62` (sibling sửa trong lúc chờ yên,
  xem §4). Code fix còn nguyên vẹn trong cả hai (đã grep kiểm tra từng điểm).

## 2. Đo (probe102d3, Chromium, scroll-mixed-alt, 24 clip × 3 s: chẵn blur / lẻ không blur)

| Lượt | Điều kiện | Build | Load lúc phát | seek | skip-clip-inactive | fb clip chẵn | Zombie Δ | Capture lẻ | Pump events |
|---|---|---|---|---|---|---|---|---|---|
| d3x0-base | seek-across PRE-FIX | 07f56792 | 11,70 | 23 | **11** | clip-inactive 11/11 (c0 clip-change) | 0 | 0 | n=166: cap 102, stale-frame 43, reset 3, skip-clip-inactive 11 |
| d3x1 | seek-across | 833ca8ef | 1,94 | 23 | **0** | seek-inactive 11/11 (c0 no-callback) | 0 | 0 | n=90: cap 58, stale-frame 21, reset 6, skip-seeking 5 |
| d3x2 | seek-across + sysload 2 | 833ca8ef | 15,84 | 23 | **0** | seek-inactive 10/11 (c10 no-callback, caps 0) | 0 | **1** (§3) | n=80: cap 48, stale-frame 26, reset 4, skip-seeking 2 |
| d3n1 | thường (hồi quy) | 833ca8ef | 6,29 | 0 | 0 | seek-inactive 11/11 (c22 no-callback) | 0 | 0 | n=171: cap 123, stale-frame 46, skip-seeking 2 |
| d3c1 | seek-across + disable-owner-kill | 833ca8ef | 9,15 | 23 | **0** | **seek-inactive 12/12** | 0 | 0 | n=172: cap 126, stale-frame 38, reset 6, skip-seeking 2 |
| d3x3 | seek-across + sysload 2 (cây ed260e62) | ed260e62* | 2,99 | 22 | **0** | seek-inactive 12/12 | 0 | 0 | n=128: cap 96, stale-frame 32 |
| d3x4 | seek-across (cây ed260e62) | ed260e62 | 7,27 | 23 | **0** | seek-inactive 12/12 | 0 | 0 | n=463: cap 444, stale-frame 19 |

\* d3x3: `mtimeChanged=True` — sibling sửa `preview.tsx` (3856945b → ed260e62)
lúc 03:21:19Z trong lúc chờ yên, TRƯỚC khi phát (seek đầu 03:23:30); play chạy
hoàn toàn trên ed260e62. Code fix còn nguyên vẹn (đã grep từng điểm sau lượt).
d3x3 chỉ có 22 cú seek (1 biên driver bỏ lỡ cửa sổ poll — biên đó qua
tick-by-tick, sync kill vẫn bắn qua setPlayhead của tick).

- `pageErrs` = 0 cả 7 lượt. `mtimeChanged=False` ở 5/7 lượt (d3x0 và d3x3
  True — xem ghi chú từng lượt ở trên; d3x0: sửa D3 rơi vào lúc thu kết quả,
  sau khi phát xong — fb 11/11 clip-inactive chứng minh fix chưa active ở
  bất kỳ biên nào trong lúc phát).
- Pixel parity: clip lẻ C 75–100% mọi lượt; D = 0, out = 0 mọi clip, mọi lượt.
  Không hồi quy pixel.
- `no-callback` lẻ tẻ (c0 d3x1, c10 d3x2, c22 d3n1): pump chết bởi watchdog vì
  callback đói dưới tải (caps 0–1) — hành vi có từ trước, không do fix (sync
  kill chỉ kill pump ngoài cửa sổ; các pump này chết trước khi tới biên).

## 3. Ca stale first-frame còn lọt ở d3x2 — nguyên nhân + cách vá (§1.3)

- Cửa sổ c11, relPlayMs 40695, capture frameIdx 81 (mediaTime 2,7) — pump c12
  mới, ngay sau driver seek k=12 (35,033 → 36,15); 269 ms sau reset-capture
  frame 16 (seq 33, mediaTime 0,53); không có sampler cap nào cho thấy frame
  81 lên canvas. Tick cùng lúc cũng vẽ frame 90 stale (cap relPlay 40586,
  viaRvfc=0) — đường tick cũng vẽ 1 frame cũ (vấn đề N3 đã biết, ngoài phạm
  vi D3).
- Chuỗi nhân quả (đọc code, khớp sự kiện): re-seek xuôi chỉ phát seek khi
  drift > 0,35 s qua **2 tick liên tiếp** (`shouldIssueForwardReseek`,
  FORWARD_RESEEK_CONFIRM_TICKS = 2) → tick đầu sau nhảy: chưa seek nào bay
  (seeking=false) mà element vẫn ở 2,7 (lệch target 0,15 là 2,55 s); tick đó
  vẽ + tạo pump mới; callback đầu bắn trước khi tick sau phát seek → guard
  `seeking` không chặn được vì seeking=false. Guard vẫn bắn ngay sau đó
  (seq 32 skip-seeking frame 82) rồi reset-capture.
- Sau gate (§1.3): d3x3 (đúng scenario d3x2: seek-across + sysload 2) và d3x4
  đều **0 capture lẻ, 0 skip-seeking, 0 reset-capture** — pump tạo muộn tới
  khi seek đã bay/xong nên callback đầu gặp frame đúng luôn (d3x4 capture
  dày 444 cho thấy gate không làm đói pump).

## 4. Dị thường đã ghi (không giấu)

1. **Baseline nhiễm HMR nhẹ (không ảnh hưởng kết luận):** sửa D3 rơi vào lúc
   thu kết quả baseline (mtimeChanged=True, md5 sau `6ed94ee2` — trạng thái
   trung gian của các edit). Play đã xong trước đó; fb 11/11 clip-inactive
   (0 ca seek-inactive) chứng minh fix chưa active ở bất kỳ biên nào.
2. **Sibling sửa `preview.tsx` cùng lúc, 2 lần:** (a) giữa lần chạy tsc đầu
   (lỗi thoáng qua `MotionBlurDebugState` thiếu field, rồi
   `ensurePresentedTap` unused — cả hai biến mất ở lần chạy sau, không phải
   code D3); (b) trong lúc chờ yên của d3x3 (03:21:19Z). Code D3 còn nguyên
   vẹn sau cả hai (đã grep từng điểm); tsc cuối trên cây ed260e62 = 0.
3. **d3x2 thưa dưới tải:** load 15,84 + sysload 2 → caps 48, c10 caps 0
   (no-callback). Kết luận chính (0 skip-clip-inactive, fb seek-inactive)
   không phụ thuộc mật độ capture — fb ghi ở mọi clip dù capture thưa.
4. **Driver ghi exit sai (đã biết, C5 §4.3):** chỉ tin file trên đĩa
   (`results.json` vs `error.txt`); mọi lượt ở đây đều có results.json.

## 5. Nợ còn lại (cho đợt sau, không làm trong luồng này)

1. **Tick vẽ 1 frame stale sau nhảy (d3x2, cap frame 90):** đường tick vẽ
   frame cũ ở tick đầu sau nhảy vì `shouldSkipRenderWhileSeeking` chỉ skip
   khi seek đang bay — cùng cửa sổ 2-tick như §3 nhưng ở đường tick (không
   qua pump/ring). Cần gate tương tự cho đường vẽ hoặc phát seek sớm hơn —
   ngoài phạm vi D3 (chỉ fix pump).
2. **Độ trễ owner-kill trực tiếp vẫn chưa đo được** (chỉ đo được check A6
   trước đây và nay là sync kill qua fb) — cần ghi timestamp tại điểm kill
   trong production (B5 §5 mục 2c) nếu muốn số này.
3. **Không đụng:** TTS 39, birefnet, `.github/workflows/*`, cloud/collab, nhạc
   bản quyền. Không release/tag.

## 6. Kiểm chứng + batch đã stage (KHÔNG push)

- Harness: `apps/web/scripts/probe102d3-frame-parity.mjs` (copy probe101c5,
  chỉ đổi thư mục scratch → round102-d3 + header; `node --check` PASS).
- Analyze: `hidden_files/round102-d3-analyze.py` (copy C5, chỉ đổi thư mục).
- Dữ liệu thô: `hidden_files/round102-d3/` — 7 thư mục lượt
  (`chr-mixedalt-d3x0-base/x1/x2/n1/c1/x3/x4`) + `analysis-{base,x1,x2,n1,c1,x3,x4}.txt`
  + log driver `round102-d3-driver-{base,post,final}.log` + log luồng
  `round102-d3.md` + script chạy `round102-d3-run-{base,post,final}.sh`.
- Hồi quy trên cây land gate (e886e754): tsc 0, vite build PASS 8,58 s,
  Hold 75/75, Pacing 19/19, previewEngine 27/27, seek 21/21, seekSkip 9/9,
  previewLoop 20/20, ghostBlend 15/15, rvfcClipWindow102D3 21/21,
  test-preview-engine.sh 354 assertions pass. Trên cây cuối (ed260e62):
  tsc 0, rvfcClipWindow102D3 21/21 (D4 cùng đợt đo vite build PASS 10,76 s,
  previewEngine 27/27, test-preview-engine 354 trên cùng cây).
- Batch stage: `phase9-round102-d3-zombie.txt` — **6 entry** (chỉ file text
  trong cây repo, read-back OK, 0 binary, 0 workflow):
  - `apps/web/src/preview.tsx`
  - `apps/web/src/lib/rvfcClipWindow.ts` (mới)
  - `apps/web/src/lib/rvfcClipWindow102D3.test.ts` (mới)
  - `apps/web/tsconfig.json` (thêm test mới vào exclude, theo quy ước repo)
  - `apps/web/scripts/probe102d3-frame-parity.mjs` (mới)
  - `docs/PHASE9_ROUND102_D3_ZOMBIE_LIMITS.md` (file này)
- Ngoài repo, lưu tại `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (không đưa vào batch push của repo theo quy ước paths-loop):
  `round102-d3-analyze.py`, `round102-d3.md`, `round102-d3-run-*.sh`,
  `round102-d3-driver-*.log`, thư mục dữ liệu `round102-d3/`.
