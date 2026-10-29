# Phase 9 đợt 14 — Luồng R3: đo lại ghost + split-v trên canvas thật (LIMITS)

Ngày: 2026-10-27. Chạy trong đợt lớn đợt 14 (preview–render parity vòng 5,
đóng nợ đợt 13 C3).
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG code giả.
Không tự tạo file stage paths-loop (parent gộp batch sau — xem §7).

## 0. Kết luận ngắn

- **Blocker seek pause của đợt 13 đã tìm ra nguyên nhân thật và đã sửa:
  đó là BUG SẢN PHẨM, không phải chỉ do môi trường.** Vòng lặp rAF của
  `PreviewCanvas` gọi `Seeker.request(t)` MỖI frame trong khi playhead
  chưa được vẽ, mà `Seeker` debounce 80ms nên timer bị reset liên tục
  và seek không bao giờ chạy khi rAF ~16ms (xem §3).
- **Sau fix, ghost đo được LẦN ĐẦU trên canvas thật: PASS**
  (baseline off-vs-off = 0.00, signal on-vs-off = 12.10, ngưỡng 3.00).
- **split-v đo được LẦN ĐẦU trên canvas thật: PASS**
  (trong vùng 100.0%, ngoài vùng 2.2%, chờ frame mới 163ms).
- **diamondclose (từng PASS ở chẩn đoán, FAIL ở full5) nay PASS ổn định:**
  trong vùng 100.0%, ngoài vùng 0.0%, chờ frame mới 201ms.
- Đối chứng A/B trên cùng snapshot chỉ khác 1 hunk: gỡ fix → ghost
  FAIL lại (on-capture đói 3×20s, MAD = 0.00). Fix là nguyên nhân của
  thay đổi, không phải do máy rỗi hơn hay do luồng khác sửa ké.

## 1. Nguyên nhân blocker — bug thật ở `preview.tsx` (đã sửa)

### 1.1 Chuỗi sự kiện

`apps/web/src/preview.tsx`, nhánh pause của vòng lặp rAF (trước fix):

```ts
if (t !== lastDrawnTRef.current) {
  lastRequestedTRef.current = t;
  void seekerRef.current!.request(t, (tt) => seekAll(...))
    .then((outcome) => { /* vẽ khi ok */ });
}
```

`apps/web/src/lib/seek.ts`, `Seeker.request(t, run)`:

- `request` mới hủy mọi request đang chờ (`flushPending`) và reset
  timer debounce 80ms; chỉ sau 80ms không có `request` mới thì `run`
  mới chạy.

Vòng lặp rAF chạy mỗi ~16.7ms (60fps). Miễn là `t !== lastDrawnT`
(tức là frame chưa vẽ được), mỗi frame lại gọi `request` mới →
timer 80ms không bao giờ tới hạn → `seekAll` không bao giờ chạy →
không có lần vẽ nào → `lastDrawnT` không đổi → vòng lặp lại gọi
`request`… **đói vĩnh viễn (starvation), không phải seek chậm.**

Chỉ khi rAF chậm hơn 80ms (CPU tải, VM 2 CPU, decode tranh chấp)
thì timer mới kịp nổ — giải thích đúng mẫu thất thường của đợt 13:
có lượt seek tới sau 8.1s, có lượt 42s, có lượt không bao giờ tới.
Đợt 13 nghi ngờ "webm thiếu Cues + decode mềm" — giả thuyết đó
KHÔNG phải nguyên nhân chính: với fix, cùng media webm MediaRecorder
đó seek hoàn tất trong 92–1381ms (xem §2). Cues có thể vẫn góp phần
vào độ trễ giải mã, nhưng không còn là blocker.

### 1.2 Bằng chứng mô phỏng (không đụng code sản phẩm)

Mô phỏng trung thực logic `Seeker` + vòng lặp rAF (`/tmp/seeker-sim.mjs`,
chạy Node, không lưu trong repo):

| Trường hợp | rAF | seek `run()` trong 3s | draw |
|---|---|---|---|
| Code cũ, request mỗi frame | 16ms | 0 | 0 |
| Code cũ, rAF chậm do CPU tải | 100ms | 1 | 1 |
| Có guard `lastRequested` (fix) | 16ms | 1 | 1 |

### 1.3 Fix (duy nhất 1 hunk trong `preview.tsx`)

- Guard: chỉ gọi `request` khi `t !== lastDrawnTRef.current`
  **VÀ** `t !== lastRequestedTRef.current`. `lastRequestedTRef` vốn đã
  tồn tại nhưng trước đây chỉ được gán, không bao giờ được đọc để
  chặn — guard này khôi phục đúng ý đồ ban đầu của nó.
- Khi outcome bị hủy/thất bại mà không có request mới hơn, reset
  `lastRequestedTRef` về `null` để frame sau thử lại (tránh kẹt vĩnh
  viễn ở trạng thái "đã request nhưng chưa vẽ"). Khi đã có request
  mới hơn thì `lastRequested` đã là t mới nên nhánh này không chạy,
  outcome cũ vẫn bị bỏ qua đúng ngữ nghĩa latest-wins.
- Không đổi `seek.ts`, không đổi debounce 80ms, không đổi ngữ nghĩa
  scrub: kéo nhanh đổi t liên tục vẫn chỉ seek lần cuối, vì mỗi t mới
  đều khác `lastRequested` nên request mới hủy request cũ như cũ.

### 1.4 Quan sát phụ (KHÔNG sửa, ghi làm nợ)

Ở lượt đối chứng không fix, có lần seek "chạy sporadic" nhưng vẽ ra
frame gần đen (lit 3%, chỉ còn chữ phủ — video chưa giải mã kịp) rồi
lần sau mới ra frame video 100%. Cơ chế nghi ngờ: `seekAll` trả
`ok: true` ngay cả khi mọi target timeout (xem `seek.ts`: outcome
`ok` chỉ phản ánh generation, không phản ánh `done`), nên
`PreviewCanvas` vẽ ngay cả khi element chưa có frame giải mã xong.
Với fix, hiện tượng này không xuất hiện trong các lần đo (frame về
đủ và ổn định MAD = 0.00), nhưng chưa chứng minh là đã triệt tiêu —
luồng sau có thể xét việc chỉ vẽ khi `done > 0` hoặc khi
`readyState >= HAVE_CURRENT_DATA`. Không claim đã sửa điểm này.

## 2. Kết quả đo — snapshot CÓ fix (chạy chính)

Harness: `apps/web/scripts/r14-round14-clicktest.cjs` (sao chép từ C3,
xem §6). Chạy trên snapshot cô lập `/tmp/r14repo/apps/web` (copy từ
repo + symlink `packages`, để luồng khác sửa file giữa lúc đo không
làm HMR reset app — bài học từ lượt baseline §4). Cùng cổng/dev
riêng: vite 5199, CDP 9349. Ngưỡng sáng LIT = 32 như C3; lưới phân
loại 80×45, lưới chờ 40×23; tiêu chí PASS type như C3 (trong ≥ 90%,
ngoài ≤ 10%); ghost theo ngưỡng P5 (signal > max(3×baseline, 3.0)).

**Tổng: 6 PASS, 0 FAIL, 0 SKIP** (gồm C0/C0b) — script exit 0.

### 2.1 Ghost motion blur (clip 1, pause tại 2.500s) — PASS lần đầu

- Blur bật xác minh bằng click thật: checked = true, 3 slider weights.
- 4 lần chụp pause, mỗi lần chỉ cần attempt 1 (trước đây 3 attempt
  đều MAD = 0.00):
  - off1: chờ 155ms, MAD vs frame 1.0s = 24.96, lit 100%.
  - off2: chờ 1381ms, MAD vs frame 1.0s = 24.96, lit 100%.
  - on (blur bật): chờ 1224ms, MAD vs frame 1.0s = 6.36, lit 100%.
    (MAD vs frame 1.0 nhỏ hơn vì frame blend kéo về phía snapshot cũ
    hơn — không phải bất thường; signal tính theo so sánh on-vs-off
    như thiết kế probe, xem dưới.)
  - off3: chờ 92ms, MAD vs frame 1.0s = 24.96, lit 100%.
- **baseline off-vs-off = 0.00, signal on-vs-off = 12.10,
  ngưỡng max(3×0.00, 3.00) = 3.00 → PASS**, vượt ngưỡng 4.0×.
- Baseline 0.00 chứng tỏ giải mã xác định ở cùng playhead (đúng như
  thiết kế probe pause của đợt 13 §3) — và signal 12.10 là tín hiệu
  blend thật, không phải nhiễu thời gian (khác hẳn baseline 53/7.89
  của cách đo lúc đang phát đã bị loại).

### 2.2 Transition trên canvas (clip 2, p = 0.5, playhead 7.0s)

| Type | Kết quả | Trong vùng sáng | Ngoài vùng sáng | Chờ frame mới | Ổn định |
|---|---|---|---|---|---|
| diamondclose | PASS | 1778/1778 (100.0%) | 0/1822 (0.0%) | 201ms | MAD 0.00 |
| split-v | PASS | 1800/1800 (100.0%) | 40/1800 (2.2%) | 163ms | MAD 0.00 |
| squareopen (đối chứng) | PASS | 2000/2000 (100.0%) | 40/1600 (2.5%) | 183ms | MAD 0.00 |

- Khung đo mọi type: bbox 872×492@(0,142), sel = true, dur = 2.0,
  playhead = 7.000.
- split-v trước đây CHƯA TỪNG quan sát được frame đúng trên canvas
  (full5 + diag6 đều 45s timeout); nay là lần đầu PASS.
- Phần ngoài vùng sáng 2.2–2.5% là điểm biên antialias + pixel video
  tối như các PASS của đợt 13, không phải sai clip path.

## 3. Đối chứng A/B — cùng snapshot, gỡ fix

Snapshot y hệt, chỉ revert hunk guard ở `preview.tsx` về code cũ
(trong `/tmp`, không đụng repo). Chế độ ghost-only
(`R14_TYPES=` rỗng):

- off1: attempt 1 "thành công" sau 4024ms nhưng ra frame gần đen
  (MAD vs frame 1.0 = 56.24, lit 3% — chỉ còn chữ phủ, video chưa
  giải mã; xem §1.4).
- off2: attempt 1 sau 72ms ra frame video (MAD 61.84, lit 100%) —
  off1/off2 không so sánh được với nhau (một đen, một video).
- on (blur bật): **3 attempt đều MAD = 0.00 sau 20166/20903/20485ms**,
  canvas đóng băng — đúng blocker đợt 13.
- **Kết quả: FAIL ghost (probe lỗi, không đo được signal),
  tổng 2 PASS (C0/C0b), 1 FAIL, script exit 1.**

Kết luận A/B: cùng media, cùng máy, cùng snapshot — có fix thì
ghost PASS sạch trong ~1s/lần chụp, không fix thì không đo được.
Fix là nguyên nhân, không phải nhiễu môi trường.

## 4. Lượt baseline trên repo live (trước fix) — đọc có điều kiện

Chạy `c3-round13-clicktest.cjs full` trực tiếp trên repo live trước
khi sửa, kết quả phần đầu tái lập đúng blocker đợt 13:

- Ghost: 3 attempt đều MAD = 0.00, lit cuối 3%, mỗi attempt 20s.
- diamondclose: 45s không thấy frame mới (MAD cuối 0.00,
  lit cuối 4% vs kỳ vọng 51%).
- **Phần sau của lượt này KHÔNG dùng làm bằng chứng:** trong lúc chạy,
  một luồng đợt 14 khác sửa `preview.tsx`/`transitionPreview.ts`/
  `dissolveFrand.ts` (mtime 20:07–20:08) khiến vite HMR reload app
  giữa chừng — các type sau đó FAIL hàng loạt dạng "không tìm thấy
  card transition, clip đang chọn: [không có]". Đó là nhiễu do đo
  trên repo đang được sửa song song, không phải kết quả sản phẩm.
  Đây chính là lý do các lượt đo chính sau đó chuyển sang snapshot
  cô lập. Lượt baseline này không được tính vào tổng kết §2/§3.

## 5. Kiểm chứng khác

- `tsc --noEmit` trên snapshot có fix: **0 lỗi trong
  `preview.tsx`** (và 0 lỗi nào khác ngoài file test
  `src/components/speed/nestedSpeedcurve.test.ts`: 3 lỗi TS5097/
  TS2352 — file của luồng khác, luồng này không đụng, không sửa).
- Vite dev đã phục vụ snapshot thành công trong cả 3 lượt chạy
  trình duyệt (có fix / không fix / baseline) — coi như kiểm chứng
  build ở mức dev. Không chạy `vite build` riêng (dev server đã
  transform toàn bộ module khi app load và chạy thật).
- Không chạy lại toàn bộ 14 type: 12 type đã PASS ở đợt 13, 2 type
  nợ (diamondclose, split-v) + 1 đối chứng (squareopen) đã PASS ở
  đây; chạy full 14 trên snapshot là việc nên làm ở lượt gộp sau khi
  các luồng đợt 14 ngừng sửa file (tránh HMR), không phải nợ đo mới
  của luồng này.

## 6. Giới hạn trung thực — lần đo này KHÔNG chứng minh

- Chỉ p = 0.5, chỉ lớp A (transitionOut), chỉ clip 2 tại 7.0s, chỉ
  ghost clip 1 tại 2.5s với weights mặc định (chưa đo weights đổi thì
  pixel đổi bao nhiêu), chỉ khung 1280×720, chỉ media mẫu tổng hợp
  (webm canvas, không phải footage quay thật), chỉ Chromium headless
  trên VM — chưa đo trình duyệt thật/máy thật, chưa đo HD/1080p,
  chưa đo FPS khi blend, chưa đo lớp B (transitionIn).
- Không chứng minh hình học đúng với render FFmpeg (đó là V11/V12,
  MAD 0.00 cho split-v) — chỉ chứng minh canvas áp đúng spec và
  ghost blend lộ ra trên canvas thật.
- Không chứng minh scrub nhanh nhiều playhead liên tiếp vẫn đúng
  (fix giữ ngữ nghĩa latest-wins theo lý thuyết, chưa có test scrub
  dồn dập); không chứng minh quan sát phụ §1.4 đã triệt tiêu.
- Snapshot đo là copy tại thời điểm chạy; repo live sau đó có thể
  được luồng khác sửa tiếp — trước khi gộp batch, parent nên kiểm
  tra lại hunk guard còn nguyên ở `preview.tsx` (dòng ~1668) và chạy
  lại harness R14 trên code đã gộp.

## 7. File đổi/thêm (tương đối từ repo root, KHÔNG push)

- `apps/web/src/preview.tsx` (sửa 1 hunk: guard `lastRequestedTRef`
  + reset khi outcome hủy/thất bại, kèm comment R14).
- `apps/web/scripts/r14-round14-clicktest.cjs` (mới: sao chép từ
  C3, thu hẹp — cổng 5199/9349, `R14_WEB_DIR` để chạy snapshot,
  `R14_TYPES` chọn type, `R14_SKIP_GHOST=1` để bỏ ghost; mặc định
  không đặt env thì chạy full như C3).
- `docs/PHASE9_ROUND14_R3_GHOST_SPLITV_LIMITS.md` (mới, file này).

Không sửa file sản phẩm nào khác. Không tạo tag, không push, không
tạo file stage paths-loop (parent gộp). Snapshot đo và log chạy
(`/tmp/r14repo/`, `/tmp/r14-fixed.log`, `/tmp/r14-nofix.log`,
`/tmp/seeker-sim.mjs`) chỉ là bằng chứng tạm, không thuộc batch.
