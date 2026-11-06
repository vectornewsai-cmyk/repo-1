# Phase 9 đợt 31, luồng N1 — Sửa 2 bug seek của đợt 30 M1 — LIMITS

> Sửa code sản phẩm thật, KHÔNG push, KHÔNG tag/release, KHÔNG binary
> vào repo, KHÔNG tự ghi file paths-loop (parent stage gộp).
> KHÔNG đụng: CLI, i18n/toast ProjectMenu, scripts harness CDP, trọng
> số dip, logic fps ngược. Nhánh phát xuôi (ngưỡng 0,35s) và phát ngược
> stepping KHÔNG được đo trong luồng này — để nợ, không claim.

## 0. Kết quả nói trước

Cả 2 bug seek của đợt 30 M1 đều đã sửa và kiểm chứng bằng browser
thật trên cùng một bundle cuối:

- **Bug A (lùi đúng 1 frame bị bỏ seek): ĐÃ SỬA, kiểm chứng sạch.**
  Probe M1 chạy lại đầy đủ 11/11 KHỚP, mọi case sweep dk0 = 0,000
  từng bit — gồm 4 case back1f trước đây cho frame trước (FG, SAN ×2,
  FW, FB) và case SAN fwd1f từ 2,0s trước đây cho frame trước.
- **Bug B (seek > timeout 1200ms → nền đen vĩnh viễn): ĐÃ SỬA, kiểm
  chứng dưới tải nặng nhân tạo.** 3 probe từng DARK-FIRST ở M1 v2
  chạy lại dưới tải 4 nhân bão hòa: 1 KHỚP ngay, 2 còn lại tự hội tụ
  về đúng frame đích (hash canvas sau idle trùng từng bit với hash
  frame đúng ở lượt không tải), KHÔNG cần scrub thêm, draw +1 và
  skip +0 ở cả 3 probe — tức triệu chứng "đen vĩnh viễn" đã hết.
  2 verdict LỆCH ở lần đo đầu dưới tải chỉ là artefact cửa sổ đo
  (seek 4,6s, cửa sổ poll ~6s đóng trước khi seek xong) — xem §4.
- **Hồi quy K3: 18/18 KHỚP, exit 0, 0 exception**, resampled 0,000
  ở cả 18 case chính, trên cùng bundle cuối với probe.
- **Unit test seek mới: 13/13. `tsc --noEmit` (web): 0 lỗi.**
  `vite build` pass.

## 1. Bug A — so chỉ số frame thay vì epsilon giây

### Sửa (`apps/web/src/lib/seek.ts`)

`needsSeek` cũ: `|currentTime − target| > 1/fps` (epsilon đúng
1 frame). Chrome báo `currentTime` đã lượng tử hóa xuống micro giây
(luôn ≤ giá trị đã set, M1 §4), nên bước lùi đúng 1 frame cho khoảng
cách báo cáo = 1 frame − δ < epsilon → bỏ seek; bước tiến 1 frame
từ giây nguyên cũng bị bỏ vì sai số float (diff − epsilon =
−1,18e−16). Nay `needsSeek` so **chỉ số frame đã làm tròn**
(`frameIndexOf`, cùng quy ước `Math.round(t*fps)` với
`snapToFrame`): khác frame → seek, cùng frame → thôi. Lượng tử hóa
≤ ~1,4µs không bao giờ đổi frame (nửa frame ở 30fps là ~16ms), nên
ngữ nghĩa "đã đúng frame thì không seek, tránh nhấp nháy" được giữ
nguyên mà không còn bỏ seek bước 1 frame. `seekEpsilonFor` giữ lại
để tương thích (không còn caller nào trong `src/` ngoài chính nó
trước đây — đã kiểm tra bằng grep); fps phân số (24000/1001) được
test riêng (frame 100, lượng tử hóa không đổi frame).

### Bằng chứng browser (bundle cuối `index-D6dGXQYg.js`,
sha256[:16] = `2971b5a7e356ce69`, Chromium headed thật qua pipe,
footage K SHA khớp J3)

Probe M1 đầy đủ 11 probe, exit 0, 0 exception, 0 ERROR:

| Probe (trước đây) | Nay: frame hiển thị (sweep) | seek? |
|---|---|---|
| FG-OUT back1f (trước: frame 84) | **83 = đích, dk0 0,000** | CÓ (1 set) |
| SANITY back1f (trước: frame 49) | **48 = đích, dk0 0,000** | CÓ (1 set) |
| SANITY back1f-repeat | **48 = đích, dk0 0,000** | CÓ |
| FW-IN back1f (trước: frame 12) | **11 = đích, dk0 0,000** | CÓ |
| FB-OUT back1f (trước: frame 75) | **74 = đích, dk0 0,000** | CÓ |
| SANITY fwd1f từ 2,0 (trước: frame 47) | **48 = đích, dk0 0,000** | CÓ |
| FG/FW/FB fwd1f, SAN/FG fwd0 | đích, dk0 0,000 (không đổi) | CÓ |

Mọi probe: `ct` lúc đo khớp kỳ vọng, hash không đổi sau idle 2s.
JSON: `benchmarks/results/v31-n1-seek-probe-final.json`.

## 2. Bug B — timeout thì không vẽ, không đánh dấu đã vẽ, không ngủ

### Sửa (2 chỗ, và 1 phát hiện thêm bắt buộc phải sửa thì B mới hết)

1. **`apps/web/src/preview.tsx` (nhánh `.then` của seek pause):**
   điều kiện vẽ thêm `outcome.timedOut === 0`. Trước đây seek
   timeout vẫn đi vào nhánh vẽ vì `Seeker` resolve `ok: true` ngay
   cả khi timedOut — tick vẽ đó chạy lúc element chưa seek xong nên
   `decideVideoFrame` skip, nhưng `renderFrame` đã xóa nền trước →
   canvas đen, rồi `lastDrawn = t` khiến vòng lặp NGỦ với nền đen
   vĩnh viễn. Nay timeout rơi xuống nhánh dưới reset `lastRequested
   = null` → tick sau retry; vòng lặp không ngủ vì
   `lastDrawn ≠ playhead`. Hành vi `failed` (không timeout, vd lỗi
   metadata) giữ nguyên như cũ — ngoài phạm vi bug này.
2. **`apps/web/src/lib/seek.ts` — `seekElement` viết lại thành vòng
   `attempt`:** listener `seeked` gắn TRƯỚC khi gán `currentTime`;
   nếu element đang `seeking` thì CHỈ chờ `seeked`, không gán lại
   (gán lại sẽ hủy seek đang bay và giải mã lại từ đầu, khiến seek
   chậm không bao giờ kịp timeout qua các lần retry); khi `seeked`
   bắn thì kiểm tra lại rồi mới phát seek của mình nếu vẫn lệch
   (seeked đó có thể là của seek cũ đang bay tới target khác).
3. **Phát hiện thêm (bắt buộc, §3):** kiểm tra "đã đúng frame" nay
   bị chặn bởi `!el.seeking` — đang seeking thì LUÔN chờ `seeked`
   rồi mới kiểm tra lại, dù `currentTime` đã báo đúng target.

### Bằng chứng browser dưới tải (4 tiến trình `yes` bão hòa 4 nhân)

3 probe từng DARK-FIRST ở M1 v2, chạy lại với bundle cuối
(`round31-n1-slow2`, seek đo được 2704–4594ms, đều > 1200ms):

| Probe | Trước (M1 v2) | Nay dưới tải |
|---|---|---|
| FG fwd0 (seek 2704ms) | DARK-FIRST | **KHỚP ngay, dk0 0,000**, draw +1, skip +0 |
| FG fwd1f (seek 4594ms) | DARK-FIRST | LỆCH ở lần đo đầu (MAD 37,774 — canvas giữa seek, KHÔNG phải nền), **sau idle hash = 3657936 = đúng hash frame đích** ở lượt không tải, draw +1, skip +0 |
| FB fwd1f (seek 4583ms) | DARK-FIRST | LỆCH ở lần đo đầu (MAD 74,324 — frame cũ trong lúc seek), **sau idle hash = 2144067 = đúng hash frame đích** ở lượt không tải, draw +1, skip +0 |

Cả 3 probe: `skip +0` (không còn tick vẽ-then-skip nào như M1),
`draw +1`, element sau idle ở đúng target với `readyState = 4`,
`seeking = false`, và canvas tự hội tụ về frame đích mà KHÔNG cần
scrub thêm — đúng phần đã hứa của sửa B ("đừng đánh dấu đã vẽ/ngủ"
+ "vẽ lại khi seeked đến muộn"). JSON:
`benchmarks/results/v31-n1-seek-probe-slow2.json` (tải đã dừng ngay
sau lượt chạy, không còn tiến trình `yes` nào).

## 3. Vì sao lượt tải đầu (bundle chưa có chặn seeking) vẫn đen — bài học

Lượt tải đầu tiên của luồng này (bundle `bwcje758`, mới có sửa
preview + `attempt` chưa chặn seeking) vẫn cho 3/3 DARK-FIRST với
dấu vết `draw +0, skip +1` — tức một tick vẽ-then-skip vẫn xảy ra.
Truy nguyên từ JSON: trong lúc seek, Chrome báo `currentTime` =
target NGAY KHI seek bắt đầu trong khi vẫn đang giải mã (poll ghi
`seeking = true, ct = 3.5, rs = 1`). Lần retry sau timeout thấy
`currentTime` đã bằng target → kết luận "xong" ngay (kiểm tra
`needsSeek` đứng trước kiểm tra `seeking`) → preview vẽ ngay →
skip (rs < 2) → đen + ngủ. Đây là lỗ hổng chỉ mở ra ở lần retry
(lần đầu element chưa seeking nên không gặp), và là lý do sửa B
không thể chỉ là "timeout thì không vẽ" — phải chặn cả đường kết
luận xong giả này. Sau khi thêm chặn `!el.seeking`, lượt tải thứ
hai cho kết quả §2. Unit test khóa lỗ này:
"đang seeking mà currentTime đã báo = target → KHÔNG kết luận
xong" và "không có seeked → timeout, không kết luận xong giả".

## 4. Cái gì CHƯA chứng minh / còn mở (trung thực)

1. **2 verdict LỆCH ở lần đo đầu dưới tải (§2) không phải là "đã
   sửa hoàn toàn mọi trường hợp":** chúng chứng minh app tự hội tụ
   về frame đúng sau khi seek xong (hash sau idle trùng frame
   đúng), nhưng lần đo đầu vẫn lệch vì cửa sổ poll ~6s của probe
   đóng trước khi seek 4,6s hoàn tất dưới tải bão hòa nhân tạo
   (rAF/debounce cũng bị đói CPU nên seek bắt đầu muộn). Trên máy
   thật không bão hòa, seek 1,4–1,9s của M1 v2 sẽ nằm trong cửa sổ
   và vẽ đúng ngay như FG fwd0 ở đây. Không claim "mọi lần đo đầu
   đều KHỚP dưới mọi tải".
2. **Nhánh phát xuôi (ngưỡng re-seek 0,35s) và phát ngược stepping
   (`stepEps` 0,5 frame) KHÔNG được đo** — M1 đã ghi rõ hai nhánh
   đó không suy ra được từ số scrub-pause; luồng này cũng không đo
   chúng. Không kết luận gì về chúng.
3. **Tỉ lệ gặp cơ chế B trên máy thật / footage GOP dày / Safari /
   GPU decode chưa đo** (số 1,4–4,6s là của VM CPU với footage K
   GOP thưa; ngưỡng 1200ms thì không đổi).
4. **Quy tắc sub-µs chính xác của Chrome** (M1 §8.1: 61/30 →
   2,033332, thấp hơn floor µs 1µs) vẫn chưa giải thích được —
   chiều xuống đã đủ cho cơ chế A, nhưng con số 1µs đó vẫn mở.
5. **Hành vi khi seek không bao giờ xong** (seeked không bao giờ
   bắn, vd media hỏng): vòng retry timeout vô hạn ở nhịp ~1,2s +
   debounce, giống hành vi nhánh lỗi cũ (không ngủ với frame sai).
   Đây là hành vi cố tình (thử lại), không phải kẹt — nhưng chưa
   đo thời gian dài thực tế.
6. **Đường `failed` (không timeout) vẫn vẽ như cũ** — giữ nguyên
   theo phạm vi bug, chưa đánh giá có nên đổi hay không.

## 5. Kiểm chứng đã chạy (số thật, bundle cuối D6dGXQYg)

- Unit: `node --experimental-strip-types
  apps/web/src/lib/seek.test.ts` → **13/13** (5 needsSeek/
  frameIndex, 8 seekElement gồm 2 test khóa lỗ seeking, 1 timeout,
  1 retry-sau-timeout).
- `tsc --noEmit` (apps/web): **0 lỗi** (lúc giữa lượt có 2 lỗi ở
  `projectRepo.ts` do một luồng đợt 31 khác đang sửa dở — không
  phải file của luồng này, không đụng tới; tới cuối lượt luồng đó
  đã sửa xong nên tsc về 0).
- `vite build`: pass (bundle `index-D6dGXQYg.js`,
  sha256[:16] = `2971b5a7e356ce69`; đã đối chiếu code minified:
  có gate `We.timedOut===0` ở preview và `!e.seeking&&!VN(...)` ở
  seek).
- K3 hồi quy trên bundle cuối: **18/18 KHỚP, exit 0, 0 exception**,
  resampled 0,000 cả 18 case (lượt K3 đầu trên bundle bwcje758 cũng
  18/18 — ghi cả hai, không giấu lượt đầu).
- Probe M1 đầy đủ trên bundle cuối: **11/11 KHỚP, exit 0,
  0 exception**; probe tải nặng §2: 3/3 tự hội tụ về frame đúng.
- File kết quả của M1 được backup trước mỗi lần harness ghi đè và
  khôi phục nguyên vẹn sau đó (chỉ file `v31-n1-*` mới là bằng
  chứng của luồng này; không làm mất bằng chứng đợt 30).

## 6. File đổi/thêm (text, không binary — parent gộp batch)

- Sửa: `apps/web/src/lib/seek.ts` — `needsSeek` so chỉ số frame
  (`frameIndexOf` mới); `Seekable` thêm `seeking?`; `seekElement`
  thành vòng `attempt` (chờ seeked khi đang seeking, không gán lại,
  chặn kết luận xong giả khi seeking); `Seeker` bỏ parameter
  property sang khai tường minh (để file chạy được bằng
  strip-types như các test lib khác — không đổi hành vi).
- Sửa: `apps/web/src/preview.tsx` — nhánh `.then` seek pause thêm
  điều kiện `outcome.timedOut === 0` mới được vẽ/đánh dấu đã vẽ.
- Sửa: `apps/web/tsconfig.json` — thêm `src/lib/seek.test.ts` vào
  exclude (theo quy ước: mọi file `*.test.ts` đều exclude vì import
  `.ts` trực tiếp cho strip-types).
- Mới: `apps/web/src/lib/seek.test.ts` — 13 test (xem §5).
- Mới: `docs/PHASE9_ROUND31_N1_SEEK_FIX_LIMITS.md` — file này.
- Mới (bằng chứng, không phải code): `benchmarks/results/
  v31-n1-k3-rerun.json`, `v31-n1-k3-rerun-final.json`,
  `v31-n1-seek-probe.json`, `v31-n1-seek-probe-final.json`,
  `v31-n1-seek-probe-slow2.json`.
- KHÔNG sửa: `apps/web/scripts/clicktest-dip-*.mjs` (chỉ chạy),
  không file CLI/i18n/ProjectMenu/harness CDP nào, không file của
  luồng khác. KHÔNG ghi paths-loop, KHÔNG push, KHÔNG tag.

## 7. Lưu ý cho parent khi gộp

- `dist/` đã bị một luồng đợt 31 khác build lại sau lượt chạy này
  (19:35:59, bundle `CVKi_f1y`) — dist KHÔNG đưa vào batch như mọi
  khi; mọi số browser ở đây đều gắn với bundle snapshot có sha ghi
  rõ, không phụ thuộc dist hiện tại.
- File `benchmarks/results/v27-k3-canvas-dip-browser.json` và
  `v30-m1-seek-probe*.json` đã được khôi phục đúng bản của M1 sau
  mỗi lần harness ghi đè (backup ở `/tmp/n1-*-backup.json`); nếu
  parent muốn stage bằng chứng mới thì stage các file `v31-n1-*`,
  đừng stage lại file M1 đã bị ghi đè rồi khôi phục.
