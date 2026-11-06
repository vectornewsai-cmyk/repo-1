# Phase 9 đợt 29, luồng L2 — Sửa playhead snap nửa frame 1.158× ở vòng phát xuôi — LIMITS

Ngày: 31/10/2026. KHÔNG push, KHÔNG release/tag, KHÔNG code giả.
Luồng này KHÔNG stage batch, KHÔNG ghi paths-loop hay build-loop-log
(parent lo 2 file đó). Không chạm App.tsx, ExportPanel.tsx,
LoadReportPanel.tsx. Phát ngược đợt 28 giữ nguyên code, chỉ chạy lại
test hồi quy (xem §5).

## 1. Chỗ snap gây 1.158× (xác định chính xác, không đoán)

Chuỗi gây bug, đã đọc code tận nơi:

1. Vòng lặp phát xuôi trong `apps/web/src/preview.tsx` (nhánh
   `playing && !reversePlayback`, trước đợt này): mỗi tick rAF gọi
   `st.setPlayhead(st.playhead + dt)` với `dt = min(0.1, (now-last)/1000)`.
2. `setPlayhead` trong `apps/web/src/store.ts` (~dòng 760):
   `set({ playhead: snapToFrame(clamp(t, …), fps) })`.
3. `snapToFrame` trong `packages/video-spec/src/timebase.ts`:
   `toSeconds(toFrames(t, fps))` với `toFrames = Math.round(t * fps)`.
   Ở 30 fps, 1 frame = 33.33 ms, nửa frame = 16.67 ms ≈ đúng 1 tick
   rAF. Nên tick nào `dt >= 16.67 ms` cũng bước NGUYÊN 1 frame, tick
   nào `dt` nhỏ hơn thì bước 0. Tốc độ playhead trung bình thành
   (tỷ lệ tick bước) × 1 frame / dt trung bình — chỉ bằng 1.00× khi
   phân bố dt trùng khớp đúng, còn không thì lệch hẳn.
4. Số đo phần cứng của đợt 28 L2 (viện dẫn, không đo lại ở đợt này):
   playhead +7.167 s / 6.189 s wall = **1.158×**, trong khi Σdt của
   vòng lặp ≈ wall (1.012×) và 63.37% tick có `dt >= 1/60 s` — đúng
   bằng tỷ lệ tick mà playhead bước. Tức dt không sai, chỉ snap sai.
5. Hệ quả đã đo ở đợt 28: độ lệch (playhead − currentTime element,
   element chạy đúng 1.00×) tích lũy → chạm ngưỡng drift-seek 0.35 s
   của syncMedia sau mỗi ~1.2–1.4 s → drift-seek chu kỳ → trên GOP
   thưa mỗi seek bắt decoder giải mã lại từ keyframe → cụm hold
   3–29 tick → ~40–54 hold mỗi pass xuôi. Bug này ở vòng phát xuôi
   dùng chung, không phải ở decoder hay ở phát ngược.

## 2. Sửa (chỉ vòng phát xuôi trong preview.tsx)

Nguyên tắc: tích lũy phần dư frame như `reverseStep` đã làm cho
chiều ngược từ đợt 27 K4 — KHÔNG đổi ngữ nghĩa `setPlayhead` toàn
cục (scrub/trim/move vẫn cần snap về frame gần nhất, và các luồng
khác đang dùng `setPlayhead` đó).

- Mới `apps/web/src/lib/playheadPacing.ts`: `forwardStep`
  (tích lũy dt, `Math.floor` → số frame nguyên, phần dư < 1 frame
  giữ lại tick sau) và `forwardPlayhead` (tiến đúng bội số frame,
  chạm duration thì kẹp + `reachedEnd`).
- Sửa `apps/web/src/preview.tsx`, chỉ nhánh phát xuôi:
  - Thêm biến `forwardAcc` (đối xứng `reverseAcc`), reset khi tạm
    dừng, khi chuyển sang phát ngược, và khi chạm cuối.
  - Tick chưa đủ 1 frame → KHÔNG gọi `setPlayhead`: playhead đứng
    yên trên lưới frame thay vì bị snap nhảy sớm 1 frame.
  - Đủ frame → `setPlayhead(forwardPlayhead(…))`; playhead đang
    trên lưới nên bước nguyên frame giữ đúng lưới, snap thành đồng
    nhất, sai số tích lũy bị chặn bởi 1 frame (≤ 33.3 ms ở 30 fps)
    thay vì tăng theo thời gian.
  - Giữ hành vi cũ khi timeline rỗng (`duration <= 0`): dừng ngay
    tick đầu, không chờ đủ 1 frame mới dừng.
- Không đổi: `store.ts` (`setPlayhead` vẫn snap như cũ), `timebase.ts`
  (`snapToFrame` vẫn `Math.round`), toàn bộ vùng phát ngược/hold/
  stepping của đợt 27–28, ngưỡng drift-seek 0.35 s của syncMedia
  (không cần hạ ngưỡng nữa vì nguồn lệch đã hết; ngưỡng vẫn là lưới
  an toàn cho trường hợp element thật sự chậm).

Trường hợp biên đã tính: playhead lệch lưới lúc bắt đầu phát (hiếm,
vd duration không chia hết cho frame) thì bước đầu có thể bị
`setPlayhead` snap dịch tối đa nửa frame MỘT LẦN, không tích lũy;
sau đó khóa lưới như thường.

## 3. Test mới (thuần Node, không cần browser headed)

File `apps/web/src/lib/playheadPacingRound29L2.test.ts` — 10 test,
chạy bằng `node --experimental-strip-types` từ gốc repo. Mô phỏng
cũ dùng đúng `snapToFrame` thật của `timebase.ts`; mô phỏng mới dùng
đúng `forwardStep`/`forwardPlayhead` thật — nhưng vẫn là MÔ PHỎNG
vòng lặp, không phải số đo phần cứng (xem §6).

Kết quả (số thật từ lần chạy cuối):

| Mô phỏng | Cũ (snap Math.round) | Mới (tích lũy) |
|---|---|---|
| Jitter rAF 1200 tick, 14–20 ms, wall 20.41 s | **1.0912×** | **0.9998×** |
| Cùng chuỗi: lần vượt ngưỡng drift-seek 0.35 s | **9 lần** | **0 lần**, lệch max 0.0333 s (= 1 frame) |
| Tie đúng 60 Hz (dt = 1/60 s) | **0.1333×** (sụp do làm tròn float ở biên .5) | **1.0000×** |
| Mẫu 17/16/16 ms lặp lại | **0.6803×** (chậm) | **1.0000×** |

Đọc đúng bảng này: cùng một cơ chế snap-round cho 0.13×, 0.68×,
1.09× và (đo phần cứng đợt 28) 1.158× tùy phân bố dt — tức tốc độ
playhead cũ KHÔNG đáng tin theo cả hai chiều, không chỉ "nhanh".
Sau sửa, mọi phân bố đều về ~1.00× với sai số < 1 frame. Unit test
kèm theo: nửa frame tích lũy đúng 2 tick = 1 frame, dt 0/âm/
frameDur xấu → 0 bước, tab lag 0.1 s bước bù 3 frame, chạm cuối
kẹp + `reachedEnd`, playhead mới luôn trên lưới frame.

## 4. File đổi/thêm (text, không binary — parent gộp batch)

- Sửa: `apps/web/src/preview.tsx` — import `playheadPacing`, biến
  `forwardAcc`, nhánh phát xuôi dùng `forwardStep`/`forwardPlayhead`
  (~40 dòng thay đổi, chỉ vùng phát xuôi + reset accumulator).
- Mới: `apps/web/src/lib/playheadPacing.ts` — `forwardStep`,
  `forwardPlayhead` (thuần, không DOM/React).
- Mới: `apps/web/src/lib/playheadPacingRound29L2.test.ts` — 10 test.
- Sửa: `apps/web/tsconfig.json` — thêm file test mới vào exclude
  (đúng quy ước repo: mọi `*.test.ts` đều exclude).
- Mới: `docs/PHASE9_ROUND29_L2_PLAYHEAD_SNAP_LIMITS.md` — file này.
- Không sửa: `store.ts`, `timebase.ts`, `reversePlayback.ts`,
  `App.tsx`, `ExportPanel.tsx`, `LoadReportPanel.tsx`.
- Build output `apps/web/dist/` đã build lại tại chỗ để kiểm chứng —
  parent quyết có stage hay không.

## 5. Kiểm chứng (số thật, từng suite)

- Mới `playheadPacingRound29L2.test.ts`: **10/10 pass**.
- Hồi quy phát ngược + liên quan (không hồi quy, code ngược không
  đụng tới): `reversePlayback.test.ts` 10/10,
  `reversePlaybackRound28L2.test.ts` 17/17, `holdFrame.test.ts`
  13/13, `previewEngine.test.ts` 14/14, `nestedPreview.test.ts`
  46/46, `nestedRampPreview.test.ts` 34/34,
  `transitionPreview.test.ts` 31/31.
- `vite build` (apps/web): **pass** (bundle 987.59 kB JS, build 8.71 s;
  cảnh báo chunk > 500 kB đã có từ trước, không phải do đợt này).
- `tsc --noEmit` (apps/web): **KHÔNG sạch toàn repo** — 3 lỗi ở
  `src/lib/curveFix.ts` (dòng 252, 259, 260: thiếu `changeItems`
  trong kiểu trả về). Đây là việc dở dang của một luồng song song
  khác trong đợt 29 (kiểu `SanitizeCurveResult` vừa được thêm trường
  `changeItems`), KHÔNG phải do file của luồng này: grep toàn bộ
  output tsc cho `playheadPacing` và `preview.tsx` cho 0 lỗi, và
  luồng này không chạm `curveFix.ts`. Ghi rõ để parent không nhầm
  là hồi quy của đợt này; không tự sửa file của luồng khác.

## 6. Giới hạn còn lại — đọc kỹ trước khi coi là xong

1. **Chưa có số đo phần cứng mới cho pass xuôi sau sửa.** Test ở
   đây chứng minh bằng mô phỏng dùng đúng hàm thật; vòng lặp trong
   `preview.tsx` là code React nên chỉ kiểm chứng bằng tsc + vite
   build, không unit-test trực tiếp được. Xác nhận cuối cùng ngoài
   đời thật vẫn cần chạy lại harness clicktest K4/đợt 28 trên
   Chromium thật (pass xuôi GOP thưa) và thấy hold giảm từ ~40–54
   về mức GOP dày (~5–7) — đó là việc đo, chưa làm trong luồng này,
   và hạ tầng VM chặn/khó CDP headed là lý do không chạy harness
   đó ở đây (không mạo nhận đã đo). Cho đến khi có số đó, claim
   chính xác là: "pacing xuôi đã đúng theo mô hình dùng hàm thật",
   chưa phải "đã đo hold giảm trên trình duyệt".
2. **30 fps ngược thật trên GOP thưa vẫn cần WebCodecs + cache
   frame** (đợt 28 §5): đường element dừng ở ~7.8 fps GOP thưa;
   đợt này không đụng tới, không claim 30 fps.
3. **Artifact thống kê `maxHoldAgeSec` qua nhảy playhead** (đợt 28
   §2.3 cuối) vẫn chưa sửa — ngoài phạm vi luồng này.
4. **Playhead chỉ bám wall-clock khi rAF chạy đều:** tab bị nền/
   throttle thì dt clamp 0.1 s vẫn bước bù tối đa 3 frame/tick ở
   30 fps rồi bắt kịp wall; nếu tab ngủ dài, hành vi bắt kịp này
   giống trước (không tệ hơn), nhưng frame trung gian vẫn bị bỏ qua
   cho hiển thị như mọi player.
5. **Đồng bộ audio:** syncMedia/audio vẫn dùng playhead làm target
   như cũ; sau sửa target hết lệch tích lũy nên drift-seek không
   còn kích hoạt chu kỳ, nhưng bản thân đường audio không đổi và
   không được đo lại ở đây.
6. **Không đổi ngưỡng drift-seek 0.35 s:** giữ làm lưới an toàn;
   nếu element thật sự chậm (vd máy yếu, GOP cực thưa), drift-seek
   vẫn có thể xảy ra đúng lúc cần — đó là hành vi mong muốn, không
   phải hồi quy.
