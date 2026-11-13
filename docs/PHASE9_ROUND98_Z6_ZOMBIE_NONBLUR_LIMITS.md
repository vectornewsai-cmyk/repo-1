# PHASE9_ROUND98_Z6_ZOMBIE_NONBLUR_LIMITS — kill zombie pump khi clip kế không blur + săn tàn dư 0–1 capture

> Luồng Z6, đợt 98. Lượt cron 21:35 +07 12/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> Nợ: LIMITS gộp đợt 97 §4 mục 6 / Y7 §5 (zombie pump — 2 tàn dư).
> Boot #20 13:24:41Z trước lượt; RAM khả dụng 771–1672 MB trong lượt; load cao kéo dài do 10 luồng đợt 98 chạy song song.

## 0. Tóm tắt verdict

**ĐÃ SỬA + ĐÃ ĐO — zombie clip-kế-không-blur đã diệt; tàn dư 0–1 capture còn lại là straggler tiền-seek (frame cuối clip cũ, không phải zombie), không rút ngắn thêm được từ draw path.** Hook kill ở draw path + syncMedia (`rvfcNoteVideoElementOwner`, marker "Đợt 98 Z6" ×5): element đổi chủ thì kill pump cũ ngay tick đầu clip mới, không chờ `ensureRvfcPump`. Zombie capture/lần đổi clip (state100): biên blur→noblur **+6 → 0**; biên blur→blur **0 / +1 (Y7 fix2) → 0 / 0**. Độ trễ kill (fbAt − mốc đổi clip state100): **+3 ms (mixed c0), 0 ms / +1 ms (blur c0/c1)** — trong lượng tử state100, so với +124–224 ms của Y7 fix2. dbgFinal caps c0/c1/c2 13/—/14 → 6/—/6 (mixed) và 14/10/8 (blur), lastFrame đều 89, fb `''` → `clip-change`. Không mất frame đầu clip mới ở mức đo được (ring fill chậm hơn ở lượt tải nặng là nhiễu mật độ capture, xem §2). Pixel parity giữ nguyên ở tâm các dải (xem §3).

## 1. Cơ chế + phương án đã chọn

Y7 đã diệt zombie khi clip kế CÓ blur (kill trong `ensureRvfcPump`), nhưng clip kế không blur không gọi `ensureRvfcPump` nên pump cũ sống tới stale 1500 ms. Đo baseline đợt này (mixed, pre-fix, §2) xác nhận: +6 capture zombie/đổi clip, `lastFrame` clip cũ bị ghi đè 89→31, `fb` không bao giờ set.

Phương án chọn — **owner-change kill ở 2 điểm trong cùng tick biên** (cùng helper, cùng bản ghi chủ):

- Bản ghi chủ mới `rvfcElementOwner: WeakMap<HTMLVideoElement, { clipId, start, duration }>` + helper `rvfcNoteVideoElementOwner(el, clipId, t, clipStart, clipDuration)` đặt ngay sau helper Y7 `rvfcKillZombiePumpsOnElement` (tái dùng đúng helper đó — lý do `"clip-change"`, xoá khỏi map + hồi dead nếu chưa chết vì lý do khác). Ghi nhận ở MỌI lần draw/sync, không chỉ khi có blur.
- **Điểm 1 — drawVideoClip** (ngay sau `pool.videoFor(item)`, TRƯỚC cả quyết định draw/hold/skip): kill bắn ngay tick đầu clip mới dù tick đó hold vì element đang seek — đây là điểm Y7 bỏ lỡ (kill của Y7 gắn với lần draw live-video đầu tiên, tới sau khi seek xong 124–224 ms).
- **Điểm 2 — syncMedia** (ngay sau `collectActives`, trong vòng lặp actives, chỉ element VIDEO): bắn cả khi tick đó bỏ render vì clip đang seeking (86N3). Cần 3 field mới trên `ActiveMedia` (`clipId`, `start`, `duration`) — pump key theo `clip.id`, không theo `clipKey`/instance (lá nested chia pump theo id).
- **Guard chồng lấn/PiP:** chỉ kill khi chủ cũ KHÁC clip này VÀ chủ cũ không còn active ở `t` (`t` ngoài `[start, start+duration)`). Hai clip cùng item còn chồng lấn thời gian thì cả hai đều active → không kill, không ping-pong. Chủ chưa đổi → chỉ ghi nhận, không kill.

Không sửa: `rvfcCallback` (stale 1500 ms giữ nguyên làm lưới an toàn), `rvfcKillZombiePumpsOnElement` (Y7), `ensureRvfcPump`, watchdog (Y5), blend (Y2), drift/re-seek (Y4).

Vì sao KHÔNG kill sớm hơn được nữa (sàn lý thuyết): kill sớm nhất có thể là tick đầu tiên playhead qua biên (cả 2 hook đều bắn ở tick đó — syncMedia chạy trước renderFrame trong cùng tick). Callback rVFC đang chờ (pending) vẫn có thể bắn 1 lần trong khe giữa tick cuối clip cũ và tick đầu clip mới, TRƯỚC khi tick mới kịp chạy — capture đó (frame ~89–90, tiền-seek) không hook draw-path nào chặn được; chặn nó cần kiểm tra "clip còn active không" NGAY TRONG `rvfcCallback` (đọc playhead từ store) — ngoài phạm vi luồng này, lợi ích ≤1 capture/biên, rủi ro chạm core pump. Xem §4.

## 2. Đo trước/sau (probe98z6, kế thừa probe97y7: 3 clip × 3 s, Chromium; config mới scroll-mixed: c0 blur, c1 KHÔNG blur, c2 blur)

| Chỉ số | baseline chr-mixed-z6base (pre-fix) | fix chr-mixed-z6fix | fix blur chr-blur-z6fix |
|---|---|---|---|
| Build preview.tsx | 7238158c (Z2+Z3, chưa Z6) | 41b05c8e (Z6) | 41b05c8e |
| Load lúc phát / RAM khả dụng | 2,10 / 1672 MB | 1,78 / 2200 MB | 0,75 / 1945 MB |
| mtimeChanged / pageErrs | false / 0 | false / 0 | false / 0 |
| Zombie Δ caps c0 (state100, biên c0→c1 noblur) | **+6** (7→13) | **0** (6→6) | **0** (14→14, biên blur) |
| Zombie Δ caps c1 (state100, biên c1→c2 blur) | — (c1 không có pump) | — (c1 không có pump) | **0** (10→10) |
| dbgFinal caps c0/c1/c2 | 13 / — / 14 | 6 / — / 6 | 14 / 10 / 8 |
| dbgFinal lastFrame c0/c1/c2 | 31 / — / 89 | 89 / — / 89 | 89 / 89 / 89 |
| dbgFinal fb c0/c1/c2 | '' / — / '' | clip-change / — / '' | clip-change / clip-change / '' |
| Pump events (capture / skip-stale-frame) | 26 / 16 (n=44) | 12 / 3 (n=15) | 32 / 9 (n=41) |
| fbAt c0 / c1 (relPlay ms) + độ trễ kill | — (không kill) | 3931 / — (+3 ms) | 3819 / 6927 (0 ms / +1 ms) |

Đọc thêm:

- **Zombie noblur đã diệt (baseline → fix):** baseline: 5 capture post-seek frameIdx 10/19/22/28/31 trong cửa sổ c1 (relPlay 4803–5476) + `lastFrame` c0 bị ghi đè về 31; fix: 0 capture post-seek trong cửa sổ c1, `lastFrame` c0 = 89, fb `clip-change` ở +3 ms sau mốc đổi clip.
- **Tàn dư (xem §4):** 0 capture zombie post-seek ở cả 4 biên hậu-fix (2 mixed + 2 blur). Capture duy nhất còn lại trong khe biên là frame cuối clip cũ (frameIdx 86–89, tiền-seek — element chưa seek nên vẫn trình frame cũ), không phải zombie: nó thuộc về clip cũ dù mốc state100 có thể đã qua biên trong lượng tử ±100–190 ms.
- **Không mất frame đầu clip mới:** ring của clip mới vẫn đầy đủ tới frame 89 (dbgFinal lastFrame 89 mọi clip, cả 2 lượt fix); pump events không có `skip-stale` nào tăng thêm do hook. RingFirstAt chậm ở lượt tải nặng (mixed c2 +2527 ms, blur c1 +1113 ms / c2 +1432 ms, so với Y7 fix1 +97–221 ms) là nhiễu mật độ capture, không phải hook làm chậm: hook chỉ là 1 WeakMap lookup (~µs) trước khi tạo pump; cùng lượt mixed, c0 lại fill NHANH hơn baseline (900 ms so với 1181 ms) — trái dấu, đúng mẫu nhiễu tải; lượt blur chỉ có 48 mẫu state100 trong 34 s wall (main thread đói, playhead ~0,25×) nên mọi mốc thời gian tuyệt đối của lượt đó đều giãn.

## 3. Không hồi quy: pixel parity + test suite

- **Tâm các dải gStdRatio** (baseline noblur W3, cùng cách tính X5b/Y7). Mean theo dải, base mixed → fix mixed → fix blur:
  A 0.438/0.437/0.438 → 0.439/0.440/0.438 → 0.439/0.442/0.439;
  B 0.757/—/0.769 → 0.764/—/0.786 → 0.774/0.781/0.768;
  C 1.004/0.999/0.996 → 1.000/0.997/1.004 → 0.999/0.994/0.993;
  D 0.305 (c2) → — → 0.306/—/0.306.
  Tâm dải không đổi trong ±0,01 so với Y7 (A 0,438; B ~0,77; C 1,000; D ~0,306) → pixel parity đứng.
- **Tỉ lệ mix A/B/C theo clip:** base mixed c0 A 69%/B 15%/C 15%, c1 C 92% (noblur, đúng kỳ vọng), c2 D 5% (1/22); fix mixed c0 A 60%/B 20%/C 20% (n=5), c2 A 67% (n=6); fix blur c0 A 56%/B 25%/C 12%/D 6%, c1 A 69%/B 15%/C 15%, c2 D 20% (2/10, n nhỏ). Tỉ lệ D/B dao động theo mật độ capture (Y6: D xuất hiện khi ring thoáng qua size 2) — n=5–16/lượt nên % không kết luận được; tâm dải mới là bằng chứng parity.
- **Test suite trên build đã sửa (41b05c8e):** tsc web **0 lỗi**; vite build **PASS 46,27 s** (chậm do tải chung, không phải lỗi); previewEngine **25/25**; playheadHold90R2 **56/56** (50 cũ + 6 mới Z3-R1..R6 — Z3 thêm test, vẫn xanh); playheadPacing54K9 **19/19**; seek **21/21**.
- Ghi chú harness (lỗi sẵn, không do Z6): `test-preview-engine.sh` lỗi `Cannot find module './previewClipKey62R6.ts'` (có từ trước đợt 96); chạy đúng cách như X9b (`node --experimental-strip-types .../previewEngine.test.ts`) thì 25/25.

## 4. Tàn dư 0–1 capture — phân loại + độ trễ kill

**Kết quả: 0/4 biên hậu-fix có zombie post-seek** (mixed: 2 biên; blur: 2 biên) — tàn dư 0–1 của Y7 (fix2 c1: +1 capture frame 2 của c2) không tái hiện. Độ trễ kill đo được (fbAt − mốc đổi clip state100): mixed c0 **+3 ms**, blur c0 **0 ms**, blur c1 **+1 ms** — kill bắn đúng tick đầu playhead qua biên (syncMedia chạy trước renderFrame trong cùng tick), so với +124–224 ms của Y7 fix2 (kill gắn với lần draw live-video đầu tiên, tới sau khi seek xong). Lưu ý lượng tử: mốc state100 có lượng tử ±100 ms (mixed: 1195 mẫu) tới ±190 ms (blur: chỉ 48 mẫu trong 34 s wall do main thread đói), nên "0/+1/+3 ms" nghĩa là fbAt trùng mẫu state100 đầu tiên thấy clip mới — không phải độ phân giải mili-giây thật.

**Phân loại capture trong khe biên (§6 analyze):** capture duy nhất còn lại gần biên là frame cuối clip cũ (frameIdx 86–89, element chưa seek nên vẫn trình frame cũ): mixed fix relPlay 3831 frame 89 (trước mốc 3928); blur fix relPlay 3724 frame 89 (trước mốc 3819), relPlay 6721 frame 86 + 6905 frame 89 (trước mốc 6926). Đây là capture chính chủ của clip cũ (frame thuộc range của nó), không phải zombie — state100 zombie Δ = 0 ở cả 4 biên chứng minh không capture nào lọt vào ring cũ SAU biên. Các capture frameIdx<45 trong cửa sổ clip kế ở lượt blur (8/11/27, 7/23/34) là capture chính chủ của clip kế (nó có blur + pump riêng), không phải zombie — §6 chỉ là ước lượng trộn, số (2) mới là chuẩn.

**Sàn lý thuyết còn lại (chưa đo được mẫu nào hậu-fix):** pending callback có thể bắn trong khe giữa tick cuối clip cũ và tick đầu clip mới, trước khi tick mới kịp kill. Capture đó sẽ mang frame ~89–90 tiền-seek (frame cuối clip cũ / frame đầu tiên vượt range) — thuộc về clip cũ về mặt pixels nhưng có thể rơi vào cửa sổ clip kế theo relPlay nếu mốc state100 tới trước nó, cho zombie Δ +1 giả. Triệt hẳn cần kiểm tra "clip còn active không" ngay trong `rvfcCallback` (đọc playhead từ store) — ngoài phạm vi luồng này (chạm core pump, lợi ích ≤1 capture thống kê/biên, n=4 biên hậu-fix chưa đủ để ước tỉ lệ). Đề xuất: nếu đợt sau chạy thêm biên (vd probe 6 clip), đếm lại tỉ lệ biên có straggler tiền-seek để ước phân phối độ trễ kill thật.

## 5. Nợ còn lại

1. **Straggler tiền-seek 0–1 capture/biên (chưa quan sát được mẫu nào hậu-fix, n=4 biên):** cần kiểm tra "clip còn active không" trong `rvfcCallback` mới diệt hẳn — ngoài phạm vi luồng này (chạm core pump, lợi ích ≤1 capture thống kê/biên). Đề xuất đợt sau: probe 6 clip để đếm tỉ lệ biên có straggler, ước phân phối độ trễ kill thật.
2. **Đo lặp khi yên hơn:** cả 3 lượt đợt này đều tải nặng (load lúc phát 2,10 / 1,78 / 0,75 nhưng playhead chỉ ~0,25–0,45×; RAM 1672–2200 MB; lượt blur chỉ 48 mẫu state100) nên mix A/B, ringFirstAt và mật độ capture còn nhiễu tải; tâm dải đã đủ kết luận parity, nhưng một lượt fix yên (load <1, RAM >1,7 GB, playhead ≥0,9×) sẽ chốt mix A/B về mức Y7.
3. **Va chạm song song đợt 98 (đã ghi, không mất mát):** Z2 (strip pixels chẩn đoán ghost, marker "Đợt 98 Z2" ×10) + Z3 (detector bò, "Đợt 98 Z3" ×7) sửa `preview.tsx` TRƯỚC khi Z6 đo baseline (md5 a0a078e1 → 7238158c lúc 14:49:01Z) — baseline mixed chạy trên cây đã có Z2+Z3 (đúng cây "trước Z6"); Z2/Z3 không đụng vùng pump/draw-hook/syncMedia của Z6 (marker đếm lại còn nguyên sau edit Z6). Cả 3 probe đều ghi mtimeChanged=false (không ai sửa file giữa lượt chạy); md5 sau edit Z6 là 41b05c8e, không đổi trong suốt quá trình test + probe hậu-fix.

## 6. Kiểm chứng + batch đã stage (KHÔNG push)

- Harness: `apps/web/scripts/probe98z6-frame-parity.mjs` (copy probe97y7, chỉ đổi scratch → round98-z6 + thêm config `scroll-mixed`: c0 blur, c1 không blur, c2 blur) + `hidden_files/round98-z6-analyze.py` (copy Y7 + thêm §6: độ trễ kill + tách zombie post-seek/pre-seek theo frameIdx).
- Dữ liệu: `hidden_files/round98-z6/` — chr-mixed-z6base, chr-mixed-z6fix, chr-blur-z6fix (+ log driver, log test).
- Log luồng: `hidden_files/round98-z6.md`.
- Batch stage: `phase9-round98-z6-zombie-nonblur.txt` — 3 entry, read-back OK, 0 binary, 0 workflow:
  - `apps/web/src/preview.tsx`
  - `apps/web/scripts/probe98z6-frame-parity.mjs`
  - `docs/PHASE9_ROUND98_Z6_ZOMBIE_NONBLUR_LIMITS.md` (file này)
