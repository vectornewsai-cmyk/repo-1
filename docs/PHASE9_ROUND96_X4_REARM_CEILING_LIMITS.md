# Phase 9 đợt 96 — X4 (+ nối tiếp X4b): Trần stall re-arm — ân hạn 1 tick, kẹp dt/slew, trần 5000 ms

**Nợ gốc:** LIMITS gộp đợt 95 §4 mục 4 — ân hạn 1 tick sau re-arm (W5)
chưa hủy được re-seek nào ngoài đời; hướng tương lai: kẹp dt playhead
mỗi tick hoặc slew sau stall (chu kỳ stall dài → nhảy dt 1,0–1,7 s/tick
→ drift re-seek → seek kẹt 6–9 s WebKit → stall dài tiếp); trần 5000 ms
chưa có bằng chứng nhả ngoài đời.
**Ngày:** 12/11/2026 (lượt cron 15:35 +07; X4 làm việc 09:03–09:23Z,
**reboot #18 09:24:17Z (boot mới 04b83831) giết X4 giữa chừng**;
X4b nối tiếp 10:10–10:30Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** **ĐÃ SỬA (ân hạn suốt-watch), ĐÃ ĐO TRƯỚC + SAU SỬA —
nợ GIẢM THÊM, CHƯA ĐÓNG HẲN** (xem §1 + §5): kẹp dt cố định BỊ BÁC
bằng đo; ân hạn suốt-watch chưa hủy được re-seek nào ngoài đời (0/1
lần arm đủ điều kiện hậu-fix, và 1 re-seek hậu-fix bắn ngoài watch —
đúng thiết kế, không phải lỗi fix); trần 5000 ms VẪN chưa có bằng
chứng nhả (0 ứng viên / 7 lượt).

## 0. Luồng nối tiếp — dữ liệu nào của X4 gốc, dữ liệu nào X4b chạy thêm

- **X4 gốc (trước reboot #18):** 5 lượt đo tiền-sửa b1/b2/b3/b4c/b5
  (09:03–09:21Z, build chỉ có fix X2, `preview.tsx` mtime
  08:58:45Z — kiểm trước/sau mọi lượt, không đổi), 2 lượt b4/b4b
  lỗi setup (pause-seek không xác nhận canvas sau 30 s — loại, xem
  §6 mục 1); analyzer `analyze96x4-grace-ceiling.mjs`; **đã implement
  fix + 5 test mới trước reboot** (`preview.tsx` + `playheadHold90R2.ts`
  mtime 09:22–09:23Z, test mtime 09:22:56Z/09:23:14Z). X4 chưa kịp
  viết LIMITS/stage batch — X4b viết thay từ đĩa, không chạy lại đo
  tiền-sửa.
- **X4b chạy thêm (sau reboot):** chạy lại analyzer của X4 trên cả 5
  JSON gốc (kết quả khớp đúng nhận định trong comment test của X4 —
  xem §1.1); 2 lượt đo hậu-fix c1/c2 bằng bản sao probe
  `probe96x4b.mjs` (chỉ đổi scratch sang `round96-x4b`, không đụng
  logic đo); kiểm chứng lại tsc/build/5 suite trên cây đã gộp
  (X2+X4, `preview.tsx` mtime 09:41:00Z — sửa nhãn của X2, không đổi
  từ lúc X2 xong).
- **Dữ liệu X4 gốc không bị ghi đè:** mọi file X4b nằm ở
  `hidden_files/round96-x4b/` + `round96-x4b-analysis/`; probe hậu-fix
  dùng Xvfb lock (`:193`) + vite/bridge riêng, không đụng tiến trình
  luồng khác.

## 1. Kết quả

### 1.1 Câu (1) — Ân hạn 1 tick (W5) có hủy được re-seek nào không?

**Không — 0 lần hủy trong 3 lần grace kích hoạt có drift đủ xác nhận
(p3b đợt 95 + b1/b2 đợt 96), cả 3 đều DELAYED (seek bắn ngay sau arm).**
Bằng chứng mới đợt này (phân tích lại JSON gốc bằng analyzer X4,
`round96-x4b-analysis/analyze-b1b2b3b4cb5.txt`):

| Lượt | rAF gap mean | Re-arm | Kết quả grace |
|---|---|---|---|
| b1 load2 GOP250 | 643 ms (nặng) | 1 (relMs 12394, drift 1,033) | DELAYED (resync +2 tick) |
| b2 load1 GOP30 | 208 ms (nhẹ) | 1 (relMs 7215, drift 0,367) | DELAYED (resync +2 tick) |
| b3 load2 GOP30 | 162 ms (nhẹ) | 0 | — |
| b4c load2 GOP250 | 224 ms (nhẹ) | 0 | — |
| b5 load3 GOP30 | **312 ms (TẢI VỪA)** | 0 | — |

- **Trong dải tải vừa mục tiêu (300–500 ms) chỉ có đúng 1 lượt (b5),
  0 re-arm** — câu hỏi brief đặt ra cho tải vừa KHÔNG được trả lời
  bằng một lần hủy nào; bằng chứng DELAYED đến từ ngoài dải (nặng +
  nhẹ). Mẫu mỏng, ghi thẳng.
- **Truy vết b2 (rõ nhất):** tick arm t=7425 (rearms 0→1, rTicks 6→7,
  ph giữ 5,5667, ct đóng băng 5,2, drift 0,367); tick sau t=7713 ct
  burst về 5,5667 = ph (drift 0); nhưng resyncsV vẫn 1→2 ở t=7901
  (+2 tick, hook chậm 1 nhịp — caveat W5 §6.3): seek đã quyết ở tick
  ngay sau arm, trước khi element resume kịp hiển thị trong tick app
  — đúng mẫu p3b. **b1 y hệt:** arm t=12965 (drift 1,033 sau nhảy hại
  Δph=+1,300 ở t=11988); t=13474 ct burst về 5,0667 = ph (drift 0);
  resync vẫn tăng sau đó.
- Kết luận (1): cửa sổ 1 tick quá hẹp — element thường resume 1–2
  tick sau arm, ngay sau khi grace hết. Đây là cơ sở đo cho sửa §2
  (mở grace ra suốt thời gian watch còn sống).

### 1.2 Câu (2) — Kẹp dt / slew: kẹp cố định BỊ BÁC, slew chưa làm

- **Kẹp dt playhead cố định 0,35 s/tick: BỊ BÁC bằng đo.** Tick element
  TĂNG ≥1 frame: tiền-sửa 56 tick, trong đó Δct > 0,35 là **23/56
  (41%)**; hậu-fix c1 5/20 (25%), c2 0/34 (0%); **gộp 7 lượt 28/110
  (25%)**. Một kẹp cứng 0,35 sẽ cắt 1/4–2/5 tick tăng lành — phá phát
  bình thường dưới tải, không phải chỉ cắt burst. (Dưới tải nhẹ c2
  là 0% — kẹp chỉ "an toàn" khi không cần nó.)
- **Chu kỳ stall dài → nhảy hại → re-seek → seek kẹt: XÁC NHẬN LẠI,
  có thêm 1 ca kẹt seek 5,08 s (b5).** Nhảy hại strict (Δph ≥ 0,5 &
  Δct < 1 frame): 1 (b1, Δph=+1,300, drift 1,033). **Ca b5 bị analyzer
  bỏ sót ở ngưỡng:** t=5605 ph 0,5→1,333 (Δph=+0,833) trong khi ct
  0,5333→0,5667 (Δct=+0,0334 — hơn đúng 0,0001 s so với 1 frame
  1/30 = 0,03333 nên test `< FRAME` trượt); tick sau t=5928 ct burst
  1,8667 = ph rồi seeking=True **5,08 s liền (5592→10670, mẫu 100 ms,
  resyncsV 1→2)** — drift re-seek bắn rồi kẹt seek, probe kết thúc
  lúc element vẫn seeking. Đây là chu kỳ W5 §2.3 sống động nhất từ
  trước tới nay (kẹt 5,08 s, chưa tới 6–9 s như W5 nhưng cùng dạng).
  Drift re-seek gộp tiền-sửa ≈ 3/5 lượt (b1, b2, b5); seeking kẹt
  ≥3 s: 1.
- **Slew (giới hạn tốc độ đuổi thay vì kẹp cứng): CHƯA làm, CHƯA đo.**
  Sửa X4 chọn hướng khác (grace suốt-watch, §2) vì nó không chạm
  đường playhead/Δct nên không có nguy cơ cắt tick lành như kẹp.
  Slew vẫn là nợ mở nếu grace suốt-watch cũng không đủ.

### 1.3 Sửa X4 — ân hạn drift re-seek SUỐT thời gian watch còn sống (marker "Đợt 96 X4" / `96X4`)

**Cơ chế:** `preview.tsx` tính mỗi tick tập `resumeWatchLive96X4` =
`liveResumeWatchElements(resumeWatches91S2)` (helper mới trong
`playheadHold90R2.ts`, thuần: `new Set(watches.map(w => w.el))`) —
tập element video xuôi đang có watch resume-stall CÒN SỐNG — và
truyền vào `syncMedia` làm graceTick cho `shouldIssueForwardReseek`
(cùng tham số W5 đã thêm, helper KHÔNG đổi). Ân hạn 1 tick của W5
chỉ là trường hợp riêng (watch vừa arm đã nằm trong tập live).
Chỉ video xuôi, chỉ đường drift qua helper; `freshSeekDue` /
`restartEnded` / đường pause không ân hạn (như W5). Watch sống tới
khi element tăng ≥1 frame qua `ctAtCompletion` hoặc trần 5000 ms —
grace tối đa ~5 s trong ca bệnh (element không resume), nhưng
playhead trong lúc đó ĐANG BỊ GIỮ bởi chính watch đó nên không trôi;
hết grace mà drift vẫn vượt thì seek ngay (overCount giữ ở
`confirmTicks−1` trong suốt grace — pin X4-R1).

**Đo hậu-fix (X4b, c1/c2, build X2+X4, mtime 09:41:00Z không đổi
trước/sau cả 2 lượt):**

| Lượt | rAF gap mean | Re-arm | Kết quả |
|---|---|---|---|
| c1 load2 GOP250 | 208 ms (nhẹ — tải VM tụt, loadavg 0,81 lúc bắt đầu) | 1 | NOT-DUE (drift chưa đủ xác nhận lúc arm; xem §3.1) |
| c2 load1 GOP30 | 109 ms (nhẹ) | 0 | — |

- **Chưa có CANCELLED hậu-fix nào:** c1 arm NOT-DUE (không test được
  grace), c2 không có arm. Fix đúng về mặt unit test nhưng **chưa
  chứng minh hủy được re-seek ngoài đời** — nợ vẫn mở, cần thêm lượt
  đo ở tải vừa/nặng khi VM bận hơn (2 lượt hậu-fix này rơi vào lúc
  tải VM tụt: loadavg 0,8–2,6, gap 109–208 ms — xem §5 mục 2).
- **c1 cho 1 quan sát đúng-thiết-kế (không phải lỗi fix):** 1 drift
  re-seek vẫn bắn (resyncsV 1→2 ở t=4576) trong lúc **không có watch
  nào sống** (watchCeil None từ t=3372) — drift 0,68 ở t=3770
  (ct 1,9823, ph 1,3) đủ 2 tick xác nhận rồi element seek về 1,5667
  = ph ở t=4099. Grace chỉ áp dụng khi watch sống; ca này watch đã
  hết từ trước (element burst qua completion rồi stall lại ở ct mới)
  nên fix không can thiệp — đúng thiết kế, nhưng cũng là **lỗ hổng
  còn lại**: stall mới sau khi watch cũ hết vẫn đi đường drift
  re-seek cũ (xem §5 mục 3). Bù lại, ngay sau đó watch MỚI arm
  (rTicks 4→9, watchCeil 4900) và giữ playhead 1,5667 suốt stall ~2 s
  tiếp theo, không re-seek thêm.

### 1.4 Câu (3) — Bằng chứng nhả trần 5000 ms: VẪN KHÔNG CÓ

- **0 ứng viên trần (stall ≥4,5 s) / 7 lượt** (5 tiền-sửa + 2 hậu-fix);
  **0 lần nhả trần quan sát được.** Stall dài nhất: b5 ~4,2 s
  (ct 0,5 đóng băng t≈899→5102, rTicks 0→5, playhead giữ 0,5) —
  kết thúc do element tự tăng (ct 0,5333→0,5667), KHÔNG phải trần
  nhả; stall dài thứ hai b1 3,01 s (ct 0,5, rel 3593→6604) cũng kết
  thúc do element tăng. Stall dài nhất trước đây vẫn là 3,904 s (U3)
  và 6,98 s giữ-bởi-watch-S2 (W5 p4 — cũng không chạm trần).
- **Hạ tầng đo trần nay đã có:** hook mới `__vcutResumeWatch96X4`
  (mảng `{el, ctAtCompletion, completedAtMs}` theo đồng hồ
  `performance.now()` của trang) + trường `watchCeil` trong
  velocityTicks = `completedAtMs − t0` của sampler (trần thật =
  watchCeil + 5000 ms). Ví dụ c1: watchCeil=1892 ở t=2299 → trần
  6892, watch hết ở t≈2898 do element tăng — còn cách trần ~4 s.
  Lần sau chỉ cần 1 stall ≥5 s là đo được mốc trần chính xác tới
  ±1 tick thay vì suy luận.

### 1.5 Kiểm chứng (cây đã gộp X2+X4, X4b chạy lại)

- tsc web **0 lỗi**; vite build **PASS** (6,37 s).
- `playheadPacing54K9.test.ts` **19/19** (17 cũ + 2 mới X4-R1/R2);
  `playheadHold90R2.test.ts` **44/44** (41 cũ + 3 mới X4-R1/R2/R3);
  `seek.test.ts` **21/21**; `seekSkipRender86N3.test.ts` **9/9**;
  `previewLoop50F2.test.ts` **20/20**.
- O8 **không chạy lại ở X4b**: X2 đã chạy O8 trên đúng cây này
  (cùng mtime preview.tsx 09:41:00Z, không đổi sau đó — kiểm trước/
  sau cả 2 lượt c1/c2) — Chromium **21/21** + WebKit **21/21**
  (10:01–10:06Z, xem LIMITS X2 §2.1). X9b kiểm chứng cây gộp đợt 96.

## 2. Vì sao sửa là grace suốt-watch (không phải kẹp dt)

1. 3/3 lần grace-1-tick kích hoạt có drift đủ xác nhận (p3b, b1, b2)
   đều DELAYED với cùng chữ ký: element resume 1 tick SAU khi grace
   hết (ct burst về bằng ph ở tick arm+1, resync tăng ở tick arm+2
   do hook chậm 1 nhịp). Mở grace ra suốt-watch cho element thêm
   nhiều tick để resume — đúng chỗ hẹp.
2. Kẹp dt cứng bị bác bằng đo (§1.2): 25–41% tick tăng lành vượt
   0,35 s. Slew là phương án chưa đo, rủi ro tương tự ở ngưỡng.
3. Grace suốt-watch không đổi đường playhead, không đổi helper, chỉ
   giữ `graceTick=true` lâu hơn ở caller — diện tích thay đổi nhỏ
   nhất cho đúng cuộc đua đã đo được.

## 3. Đo hậu-fix — truy vết c1

### 3.1 c1 — re-arm NOT-DUE (load2 GOP250, gap mean 208 ms)

| t | ct | ph | rearms | rTicks | resyncsV | watchCeil | Diễn giải |
|---|---|---|---|---|---|---|---|
| 2299 | 0,5113 | 0,5 | 0 | 1 | 1 | 1892 | watch S2 giữ (stall 668 ms, ct 0,5→0,6) |
| 2898 | 0,6 | 0,7 | 0 | 2 | 1 | None | watch hết (element tăng qua completion); ph nhảy +0,2 |
| 3172 | 1,3843 | 0,7 | **1** | 3 | 1 | 2504 | **re-arm arm**; element burst +0,78 qua ph đã giữ; drift \|ct−ph\| = 0,684 nhưng drift tick trước chỉ 0,1 → chưa đủ 2 tick xác nhận → grace là no-op |
| 3372 | 1,4 | 0,9667 | 1 | 3 | 1 | None | watch hết (element tăng qua completion 0,6) |
| 3770 | 1,9823 | 1,3 | 1 | 3 | 1 | None | drift 0,68, không watch → drift re-seek đủ điều kiện |
| 4099 | 1,5667 | 1,5667 | 1 | 3 | 1 | None | element seek về = ph (drift re-seek hoàn tất) |
| 4576 | 1,5667 | 1,5667 | 1 | 3 | **2** | None | hook resyncsV lên 2 (chậm 1 nhịp) |
| 5375→6468 | 1,5761 | 1,5667 | 1 | 4→9 | 2 | 4900 | watch MỚI arm, giữ ph suốt stall ~2 s, không re-seek thêm |

### 3.2 c2 — lượt sạch, không tín hiệu (load1 GOP30, gap mean 109 ms)

0 re-arm, 0 drift re-seek, 0 nhảy hại; 1 stall 371 ms (ct 4,899);
34 tick tăng element, 0 tick Δct > 0,35. Lượt này chỉ chứng minh
không hồi quy ở tải nhẹ, không test được grace.

## 4. File thay đổi (stage, KHÔNG push)

- `apps/web/src/preview.tsx` — tập `resumeWatchLive96X4` + truyền
  vào `syncMedia` (Đợt 96 X4); hook `__vcutResumeWatch96X4`.
- `apps/web/src/lib/playheadHold90R2.ts` — helper
  `liveResumeWatchElements` (Đợt 96 X4).
- `apps/web/src/lib/playheadPacing54K9.test.ts` — 2 test mới X4-R1/R2
  (19/19).
- `apps/web/src/lib/playheadHold90R2.test.ts` — 3 test mới X4-R1/R2/R3
  (44/44).
- `apps/web/scripts/probe96x4.mjs` — probe đo grace/trần (copy
  probe95w5 + sampler watchCeil + tách restartV).
- `apps/web/scripts/analyze96x4-grace-ceiling.mjs` — analyzer 3 câu
  hỏi (grace/trần/kẹp).
- `apps/web/scripts/probe96x4b.mjs` — bản sao probe của X4b, chỉ đổi
  scratch sang `round96-x4b` (X4b thêm).
- `docs/PHASE9_ROUND96_X4_REARM_CEILING_LIMITS.md` — tài liệu này
  (X4b viết thay X4 từ đĩa sau reboot #18).

Batch stage: `phase9-round96-x4-rearm-ceiling`
(`~/workspace/repo-1-push/paths-loop/phase9-round96-x4-rearm-ceiling.txt`).
Log X4 gốc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x4/probe-b*.log`
+ `probe-webkit-load*-gop*-b*/probe-results.json`.
Log X4b: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x4b-analysis/`
(`analyze-b1b2b3b4cb5.txt`, `analyze-c1.txt`, `analyze-c2.txt`,
`probe-c1.log`, `probe-c2.log`) +
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x4b/probe-webkit-load2-gop250-c1/`
+ `probe-webkit-load1-gop30-c2/` (`probe-results.json`).

## 5. Giới hạn còn lại (trung thực)

1. **Nợ re-arm trễ 1 tick CHƯA ĐÓNG HẲN, chỉ giảm thêm một nấc nữa:**
   grace suốt-watch đã implement + pin unit, nhưng **0 lần CANCELLED
   ngoài đời** (tiền-sửa 0/2 arm đủ điều kiện; hậu-fix 0/0 arm đủ
   điều kiện — c1 NOT-DUE, c2 không arm). Cần thêm lượt đo ở tải
   vừa/nặng để bắt 1 lần hủy-seek thật, hoặc chấp nhận grace chỉ là
   giảm tần suất re-seek thừa.
2. **Dải tải vừa (300–500 ms) vẫn thiếu dữ liệu:** chỉ 1/7 lượt rơi
   vào dải (b5, 312 ms, 0 re-arm); 2 lượt hậu-fix rơi về tải nhẹ
   (gap 208/109 ms) vì tải VM tụt giữa lượt (loadavg 0,8–2,6 lúc
   c1/c2 bắt đầu, so với 9,7 lúc b1). Muốn bắt re-arm cần đo lúc VM
   bận (nhiều luồng song song) — nghịch lý: đo nặng thì nhiễm chéo,
   đo nhẹ thì không có hiện tượng.
3. **Lỗ hổng còn lại (c1 §3.1):** drift re-seek vẫn bắn khi stall mới
   xuất hiện SAU khi watch cũ hết (element burst qua completion rồi
   stall lại ở ct mới) — grace không bao phủ khoảng trống giữa 2
   watch. Hướng sau: arm watch sớm hơn cho stall 2+ không qua seek,
   hoặc slew sau stall; chưa đo, chưa làm.
4. **Trần 5000 ms VẪN chưa có bằng chứng nhả ngoài đời** (0 ứng viên
   / 7 lượt; stall dài nhất ~4,2 s kết thúc do element tăng). Hạ
   tầng đo nay đã có (`__vcutResumeWatch96X4` + `watchCeil`) — lượt
   sau chỉ cần 1 stall ≥5 s.
5. **Kẹp dt cứng đã đóng bằng đo âm tính** (§1.2: 28/110 tick lành
   vượt 0,35) — không làm lại nếu không có số đo mới ở tải khác hẳn.
   Slew chưa đo, chưa bác, chưa làm.
6. **Analyzer có 1 ngưỡng mong manh:** test nhảy hại đòi Δct < 1 frame
   tuyệt đối — ca b5 (Δct = 0,0334 vs frame 0,03333, hơn 0,0001 s)
   bị bỏ sót; X4b phát hiện bằng đọc tay trace. Lần sau nới thành
   Δct < 1,5 frame hoặc báo ca biên riêng.
7. **Số đo chỉ cho 1 clip video, 720p, 6 s, WebKitGTK 27.2** — GOP
   30/250; Chromium không stall ở cùng tải nên không đo được stall
   2+ trên Chromium. Tick probe ≠ tick app (±1 tick), hook resyncsV
   chậm 1 nhịp (kế thừa W5 §6.3).

## 6. Chuyện bên lề khi đo (đã xử lý)

1. **b4/b4b lỗi setup (X4 gốc):** pause-seek tới t=5 không xác nhận
   canvas sau 30 s (tElement=2907/1077 ms, tCanvas=null) — probe dừng
   đúng thiết kế, không dùng làm bằng chứng; b4c chạy lại (loadN 2
   thay vì 3) rc=0. Cùng lỗi đã gặp ở W5 p3 / U3 GOP 30 r2 (seek quá
   chậm dưới tải).
2. **Reboot #18 giết X4 giữa chừng:** X4 đã kịp implement fix + test
   (mtime 09:22–09:23Z) nhưng chưa viết LIMITS/batch; X4b phân tích
   lại từ đĩa, chạy lại analyzer (khớp nhận định trong comment test
   của X4), đo thêm 2 lượt hậu-fix, viết LIMITS này. Không file X4
   gốc nào bị ghi đè.
3. **Va chạm X2→X4 đã ghi 2 bên:** X2 sửa `preview.tsx` 08:58:45Z
   (fix blend) trước mọi lượt đo của X4 — các lượt b* đều chạy trên
   build hậu-fix X2, mtime kiểm trước/sau không đổi; X4 sửa cùng
   file 09:22–09:23Z sau khi đo xong; X2 sửa tiếp 09:28:20Z +
   09:41:00Z (nhãn ringSize). Marker X2 ×16 còn nguyên, marker X4
   ×5 còn nguyên (X2 đã xác nhận tsc 0 sau cả hai — X4b chạy lại
   tsc 0 + build PASS + 5 suite xanh, §1.5).
4. **Tải VM thay đổi mạnh trong lượt:** loadavg 9,73 lúc b1 bắt đầu
   → 0,81 lúc c1 bắt đầu (RAM khả dụng 801 MB lúc c1 — thấp nhưng
   probe vẫn PASS). So sánh trước/sau chỉ so được theo bậc độ lớn;
   gap mean các lượt: 643/208/162/224/312 (tiền-sửa) → 208/109
   (hậu-fix).
