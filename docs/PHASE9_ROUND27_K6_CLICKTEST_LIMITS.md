# Phase 9 đợt 27, luồng K6 — Click-test nốt phần J6 còn thiếu + dọn key i18n mồ côi (nợ #6 của đợt 26) — LIMITS

Ngày: 2026-10-31 (lượt cron 02:03, chạy thực tế buổi tối theo giờ
Asia/Saigon). Luồng K6 trong đợt lớn round 27. KHÔNG push, KHÔNG
tag/release, KHÔNG binary vào repo, KHÔNG code giả, KHÔNG stage
batch (parent gộp), KHÔNG tự ghi build-loop-log. Chỉ sửa file thuộc
luồng mình (panel tách lá + dict i18n + harness K6 mới + LIMITS này
+ JSON kết quả); không reformat phần người khác.

Đóng 4 nợ trong docs/PHASE9_ROUND26_J6_CLICKTEST_LIMITS.md §8:
(1) ô nhập mốc rỗng, (2) mốc ngoài miền ở chain ≥ 2 tầng qua panel,
(3) locale en trên panel, (4) dọn key `nested.deepNestedEditNote`.

## 0. Kết luận ngắn (không vượt số đo)

1. **Ô nhập mốc rỗng — BASELINE đã an toàn nhưng câu báo gây hiểu
   lầm, nên đã FIX tại panel (không phải chỉ ghi nhận):** bundle cũ
   (đo baseline) cho ô rỗng → `Number("") = 0` → store chặn
   OutOfRange kèm toast, không tách sai, không crash, không sinh
   undo — đúng tiêu chí tối thiểu của nhiệm vụ, nhưng câu báo nói
   "nằm ngoài phần khả kiến" trong khi user chưa nhập gì là sai
   ngữ nghĩa. Fix đợt 27 K6: panel chặn riêng ô rỗng / không phải
   số bằng câu mới `nested.splitOffsetEmpty`, không gọi store,
   không toast, không sinh undo. Click-test khóa cả hai trạng thái:
   baseline 8/8 (câu cũ) và guard 8/8 (câu mới) trên browser thật.
   Xem §1.
2. **Mốc ngoài miền ở chain ≥ 2 tầng QUA PANEL — PASS:** gõ "99" ở
   chain 2 tầng (TOP-SPLIT2) và chain 3 tầng (TOP-SPLIT3) đều chặn
   đúng OutOfRange (msg + toast), spec không đổi, lá còn 1,
   Ctrl+Z no-op. Trước đây nhánh này mới chỉ khóa ở tầng store
   (test I2 O). Xem §2.
3. **Locale en trên panel — PASS:** nút, nhãn, aria, msg, toast đều
   tiếng Anh đúng; msg en không rơi key thô (`nested.`), không rò
   tiếng Việt; nút trung gian sâu + nút lá sâu ở en đều đúng;
   spec không đổi, autosave không nhận curve khi bị chặn. Xem §3.
4. **Dọn key `nested.deepNestedEditNote` — XONG, đã kiểm chứng:**
   key chỉ còn trong 2 dict, không còn code nào gọi (grep toàn bộ
   `apps/web/src/` = 0 kết quả sau khi dọn; 2 comment nhắc tên key
   trong panel đã sửa cho khỏi stale); đã xóa khỏi cả vi.json và
   en.json; `r6-i18n-check.cjs` PASS (vi = en = 852 key, parity
   giữ nguyên); bundle mới không còn chứa chuỗi key cũ. Xem §4.
5. **Hồi quy — J6 17/17 trên bundle mới, I6 13/14 với fail duy nhất
   là nhiễu thoáng qua đã biết (§5h):** R3 tối canvas với mean nền
   10.492883671078541 — đúng y hệt số nền của 2 lần hồi quy đợt 26,
   trong khi R1/R2 khớp frame chính xác — không phải hồi quy hệ
   thống, không chạy thêm lần nữa chỉ để săn nhiễu (tiền lệ J6).
   **D7 pass ở lần này (0 exception)** trong khi hồi quy đợt 26
   fail xác định 5 exception text-style — đây KHÔNG phải fix của
   luồng này (luồng này không đụng preview/text): bundle đo được
   build từ cây đang có cả sửa đổi của các luồng round 27 khác,
   nên không quy được công; chỉ ghi nhận số đo, giao parent xác
   nhận luồng nào đã sửa. Xem §5.
6. **Kiểm chứng code:** `tsc --noEmit` trong `apps/web` exit 0
   (không còn lỗi J5 cũ như đợt 26 — cây hiện tại đã sạch);
   `vite build` ra scratch riêng pass (4.25s, chỉ warning chunk
   > 500kB cũ); `r6-i18n-check.cjs` PASS; test store I2 20/20;
   harness qua `node --check` sau mọi lần sửa.

## 1. Ô nhập mốc rỗng (K1) — baseline, fix, và khóa guard

Harness gõ "11.4641" rồi xoá trắng thật bằng click + Ctrl+A +
Backspace CDP (method `cdp-backspace`, không fallback lần nào),
xác nhận input = "" rồi bấm "Tách lá tại mốc ngoài" trên lá trực
tiếp TOP-SPLIT-OUT (start = 10).

| Trạng thái | Bundle đo | Msg sau click | Toast | Spec / undo |
|---|---|---|---|---|
| Baseline (chưa fix) | index-z7wG6h2H.js, sha[:16] = ac5a3ca747d7d076 (dist của cây lúc 19:29, do luồng khác build) | `Mốc ngoài nằm ngoài phần khả kiến của clip lá — không tách.` | 1 toast cùng câu | Lá còn 1, spec không đổi sau 7000ms, Ctrl+Z no-op |
| Guard (sau fix) | index-mIzUrd00.js, sha[:16] = ae6342b5876a41c0 (build từ cây lúc 19:34, xem lưu ý §6 về thành phần bundle) | `Chưa nhập mốc ngoài (ô đang trống) — không tách.` | 0 toast (cố ý — xem dưới) | Lá còn 1, spec không đổi sau 7000ms, Ctrl+Z no-op |

Fix (panel `NestedClipPanel.tsx`, hàm `splitAtOuterOffset`):
ô rỗng hoặc `Number()` không hữu hạn thì `onMsg` câu mới rồi
`return`, không gọi store. Lý do từng lựa chọn:

- Không gọi store: tránh `Number("") = 0` bị dịch thành OutOfRange
  (sai ngữ nghĩa) và tránh NaN đi vào đảo τ (store đã an toàn nhờ
  guard `isFinite` → OutOfRange, nhưng panel chặn sớm thì câu báo
  mới đúng ý user).
- Không toast: msg nằm ngay cạnh ô nhập, user thấy ngay; theo
  tiền lệ action trung gian sâu không tự toast (J10). Các nhánh
  chặn qua store (OutOfRange, TooCloseToEdge…) vẫn toast như cũ —
  chỉ riêng nhánh validation panel này là msg-only.
- Không sinh undo: guard `return` trước mọi `execCommand`, khóa
  bằng Ctrl+Z no-op trong click-test.
- Key mới `nested.splitOffsetEmpty` thêm vào cả vi.json và en.json
  (ngay sau `splitOffsetButton`); câu en: `No outer time entered
  (the field is empty) — not split.` — câu en của guard chưa được
  bấm thật ở phiên en (phiên en chỉ bấm nhánh OutOfRange), xem
  giới hạn §7.

Lưu ý trung thực về NaN: input là `type="number"` nên Chrome đã
sanitize về "" với ký tự không phải số — qua UI này gần như không
tạo được NaN thật; nhánh `!isFinite` trong guard là phòng thủ,
không có case click-test riêng cho NaN (không mạo nhận đã bấm
NaN). Store vẫn an toàn với NaN (guard `isFinite` trong
`nestedSplitOffset` → OutOfRange, đã đọc code, không đổi store).

## 2. Mốc ngoài miền ở chain ≥ 2 tầng qua panel (K2, K3)

Seed J6-MAIN tái sử dụng (top ramp 1→3). Gõ "99" (vượt xa cửa sổ
khả kiến, cửa sổ các top sâu đều bắt đầu ở 0):

| Case | Chain qua panel | Bằng chứng (cả baseline lẫn guard đều pass) |
|---|---|---|
| K2-out-of-range-two-level | TOP-SPLIT2 > MID-SPLIT2 > lá (chainIds 1 tầng) | msg + toast OutOfRange đúng; lá còn 1; spec không đổi; Ctrl+Z no-op |
| K3-out-of-range-three-level | TOP-SPLIT3 > A-SPLIT3 > B-SPLIT3 > lá (chainIds 2 tầng) | msg + toast OutOfRange đúng; lá còn 1; spec không đổi; Ctrl+Z no-op |

Cả hai đều là lần đầu nhánh ngoài miền được bấm QUA PANEL ở
chain sâu (đợt 26 mới bấm thành công ở chain sâu, còn ngoài miền
ở chain sâu chỉ có test store I2 O). Hướng "trước cửa sổ" ở chain
sâu không bấm riêng qua panel: các fixture sâu đều bắt đầu ở 0
nên mốc âm không gõ đáng tin cậy được vào input `type="number"`
(gõ "-" cho value "" → về nhánh guard/mốc rỗng ở code mới);
hướng trước/sau cửa sổ ở chain sâu đã khóa ở tầng store bởi test
I2 O (20/20, xem §6).

## 3. Locale en trên panel (K4, K5)

Phiên en riêng (Chrome profile mới, `localStorage vcut-lang=en`
đặt trước reload — app đọc locale lúc init module i18n nên cách
này đủ, không cần bấm công tắc ngôn ngữ trên UI). Harness tham số
hoá theo locale: nút drill (`View inside` thay cho `Xem bên
trong`), title mở panel (`Create and manage nested clips
(compound clips)`), aria + text nút tách.

| Case | Bằng chứng (cả 2 bundle đều pass) |
|---|---|
| K4-en-split-out-of-range | Hàng lá OUT ở en: nút `Split leaf at outer time`, `Use playhead`, aria `Outer time (outer timeline, seconds):` đều đúng; gõ "9.9" → msg + toast en `The outer time is outside the leaf clip's visible window — not split.`; msg không chứa `nested.`, không chứa marker vi (`Mốc`, `không tách`, `clip lá`, `quá sát mép`, `tổ tiên`, `đang reverse`); toàn bộ text panel không chứa `nested.`; spec không đổi, Ctrl+Z no-op |
| K5-en-intermediate-and-leaf-check | Hàng DEEP-TARGET ở en: nút `Save inner clip` (không còn ghi chú H6); hàng lá CHK: nút `Set 1× curve on leaf`; msg en `Cannot place a speed curve on the leaf clip inside nested clip “TOP-LEAFCHK”: Ancestor nested clip “MID-CHK” is reversed — the render worker forbids reverse on a curve-carrying level.`; không `nested.`, không `tổ tiên`/`đang reverse`; autosave lá không nhận curve |
| K7-no-crash-en | 0 `Runtime.exceptionThrown` trong phiên en |

## 4. Dọn key `nested.deepNestedEditNote`

- Grep trước khi xóa: key chỉ xuất hiện ở 3 chỗ trong `src/` —
  `vi.json:779`, `en.json:779`, và 2 comment trong
  `NestedClipPanel.tsx` (không có `i18nT("nested.deepNestedEditNote")`
  nào trong code — panel đã ngừng dùng từ đợt 25 I3, đúng như nợ
  đã ghi). Không có test hay script nào tham chiếu key này.
- Đã xóa dòng key khỏi cả 2 dict (dòng trước là `deepLevelHead`
  còn dấu phẩy, dòng sau là `twoLevelTopReverse` — JSON vẫn hợp
  lệ, kiểm chứng bằng `JSON.parse` cả 2 file).
- 2 comment trong panel đã sửa để không nhắc tên key cũ (tránh
  grep tương lai hiểu lầm là còn dùng): dòng H6 ở đầu file và
  dòng ghi chú ở `DeepInnerLevel` đều ghi rõ "key i18n của ghi chú
  cũ đã dọn ở đợt 27 K6".
- Grep sau khi dọn: `apps/web/src/` = 0 kết quả. (Các file LIMITS
  cũ nhắc tên key vẫn giữ nguyên — đó là hồ sơ lịch sử, không
  sửa.)
- `r6-i18n-check.cjs`: PASS — vi = en = 852 key (trước khi dọn cũng
  852 mỗi bên: có key cũ, chưa có key mới; sau khi dọn vẫn 852 vì
  vừa xóa 1 vừa thêm 1 — parity không vỡ vì xóa/thêm cả hai bên,
  và key mới `splitOffsetEmpty` được code dùng qua literal nên qua
  cả kiểm tra code→dict).
- Bundle mới: `grep -c deepNestedEditNote` = 0; `grep -c "Chưa nhập
  mốc ngoài"` = 1.

## 5. Hồi quy (trên bundle mới index-mIzUrd00.js)

Chạy bản copy tạm của 2 harness cũ (đổi scratch/display/port/tên
JSON + snapshot từ dist-k6 thay cho `apps/web/dist/`; copy tạm đã
xóa sau khi chạy, chỉ giữ JSON kết quả — theo tiền lệ J6):

- **J6 (split-intermediate): 17/17 PASS, 0 fail, 0 seed-rejected.**
  Toàn bộ J0–J15 giữ nguyên hành vi trên bundle mới, kể cả J5/J6/J7
  tách thành công + Ctrl+Z, J8 playhead, J9/J10 trung gian sâu,
  J13/J14 nhánh risky. Kết luận: guard mốc rỗng + dọn key không
  làm vỡ đường tách/chặn cũ.
- **I6 (deep-leaf + ramp): 13/14.** Nhóm deep 9/9 (D0, D3, D4, D5,
  D6, D1, D2, D8, D7 đều PASS); nhóm ramp R0/R1/R2/R4 PASS, chỉ R3
  FAIL.
  - **R3 FAIL = nhiễu thoáng qua §5h đã biết, không phải hồi quy:**
    canvas tối sau phát-dừng, mean nền đúng 10.492883671078541 —
    trùng tuyệt đối số nền của cả 2 lần hồi quy đợt 26 (lần 1 R2
    tối / R3 pass, lần 2 R2 pass / R3 tối; lần này R2 pass / R3
    tối). R1 khớp neo 3.0208 (meanAbs 4.993), R2 khớp neo 5.5430
    (meanAbs 0.825) — ramp vẫn đúng, chỉ frame playback của R3
    chưa decode kịp trên VM quá tải. Không chạy thêm lần nữa chỉ
    để săn nhiễu này.
  - **D7 PASS lần này (0 exception phiên deep-leaf), khác hồi quy
    đợt 26 (5 exception text-style lúc load, xác định cả 2 lần).**
    Luồng này KHÔNG sửa preview/text nên không nhận công: bundle
    đo được build từ cây đang có cả sửa đổi của các luồng round 27
    khác (xem §6), nên D7 hết có thể do một sửa đổi khác trên cây
    — giao parent xác nhận luồng nào đã sửa trước khi tuyên bố nợ
    D7 đã đóng. Không dùng kết quả này để claim D7 đã fix trong
    phạm vi K6.

## 6. Harness, bundle đo và kiểm chứng code

- Harness mới: `apps/web/scripts/clicktest-k6-round27-pipe.mjs`
  (kế thừa infra J6: pipe CDP + snapshot dist + seed qua autosave
  + đóng WelcomeModal/RelinkPanel bằng click thật; thêm: tham số
  locale, helper `clearRowInput` (Ctrl+A + Backspace thật, fallback
  native setter có ghi rõ), chế độ `K6_EMPTY_MODE`
  baseline|guard, `K6_DIST_DIR` để snapshot từ build scratch thay
  vì `dist/` chung, gate guard-mode pin thêm chuỗi `Chưa nhập mốc
  ngoài` trong bundle).
- Bundle đo:
  - Baseline: `index-z7wG6h2H.js`, sha256[:16] = ac5a3ca747d7d076
    (snapshot từ `apps/web/dist/` lúc 19:29–19:31; dist này do một
    luồng khác build — K6 không tự build vào `dist/` chung để khỏi
    đua với các luồng round 27 đang chạy song song).
  - Guard + hồi quy: `index-mIzUrd00.js`, sha256[:16] =
    ae6342b5876a41c0 (`vite build --outDir` vào scratch riêng
    `~/workspace/tmp-round27-k6/dist-k6`, không đụng `dist/` chung).
    **Lưu ý thành phần bundle:** build lúc 19:34 lấy toàn bộ cây
    trên đĩa tại thời điểm đó — ngoài sửa đổi của K6 (panel guard
    + 2 dict) có thể còn sửa đổi đang dở của các luồng round 27
    khác; các case K6/J6/I6 chỉ chứng minh đường panel tách/chặn
    và deep-leaf/ramp không vỡ trên bundle đó, không chứng minh
    bundle đó = đúng phần K6.
- Kết quả JSON (parent quyết có stage hay không):
  - `benchmarks/results/v27-k6-clicktest-baseline.json` — 8/8
    (mode baseline, bundle cũ).
  - `benchmarks/results/v27-k6-clicktest.json` — 8/8 (mode guard,
    bundle mới).
  - `benchmarks/results/v27-k6-regress-j6.json` — 17/17 (copy tạm
    harness J6, bundle mới).
  - `benchmarks/results/v27-k6-regress-i6.json` — 13/14 (copy tạm
    harness I6, bundle mới; R3 là nhiễu §5h).
- `node --check` harness K6 + 2 copy hồi quy: pass. `tsc --noEmit`
  trong `apps/web`: exit 0, 0 lỗi. `vite build` scratch: pass
  (4.25s). `r6-i18n-check.cjs`: PASS. Test store I2 (esbuild
  bundle, `store.nestedSplitOffset25I2.test.ts`): 20 pass, 0 fail.
- Sự cố harness trong lượt (ghi rõ, không giấu): lần chạy baseline
  đầu tiên fail 5 case do lỗi patch của chính harness — script
  patch chỉ thay occurrence đầu tiên của `__j6f` nên
  `window.__k6f` không khớp với các hàm còn mang `__j6f` (lỗi
  harness, không phải lỗi app); đã sửa bằng thay toàn bộ rồi chạy
  lại sạch 8/8, JSON lần lỗi đã bị ghi đè bởi lần chạy đúng. Lần
  chạy đầu tiên nữa bị BLOCKER do display :98 / cổng 4198 đang có
  harness khác dùng tại thời điểm đó — đổi sang :93/4193 thì chạy
  được (không kill tiến trình của luồng khác).

## 7. Chưa xong / giới hạn (không mạo nhận)

- Câu guard en (`No outer time entered…`) chưa được bấm thật ở
  phiên en — phiên en chỉ bấm nhánh OutOfRange; câu en của guard
  được khóa bởi parity dict + cùng code path với câu vi đã bấm
  (guard không phân biệt locale ngoài `i18nT`), không mạo nhận đã
  bấm en cho nhánh này.
- Mốc âm / trước cửa sổ ở chain sâu qua panel chưa bấm riêng (lý
  do ở §2); store đã khóa cả hai hướng ở chain sâu (test I2 O).
- NaN qua UI không bấm được (input `type="number"` sanitize về
  ""); nhánh `!isFinite` trong guard chỉ là phòng thủ, store cũng
  đã an toàn với NaN.
- D7 (text clip không style ném exception lúc load, phát hiện đợt
  26 §6) pass ở lần hồi quy này nhưng chưa rõ do đâu — KHÔNG
  tuyên bố đã đóng, chờ parent xác nhận luồng sửa (xem §5).
- Máy thật / Safari / touch / dpr > 1 / viewport khác: toàn bộ đo
  là Chromium headed dưới Xvfb, raster phần mềm, dpr = 1, cửa sổ
  1920×1200 — cấm trích thành hành vi trên máy user.
- Scrub ruler chỉ đo ở J8 đợt 26, không đo lại ở K6 (K6 không có
  case playhead mới); các case K6 dùng gõ tay hoặc xoá trắng, trừ
  K1 dùng Backspace thật.
- Scratch của luồng (`~/workspace/tmp-round27-k6/` với dist-k6 và
  dist-snapshot, `~/workspace/tmp-round27-k6-regress/` và
  `~/workspace/tmp-round27-k6-regress-i6/`) đều được dọn cuối luồng,
  xác nhận bằng `ls` trước khi báo cáo (chỉ còn scratch tmp-round27
  của các luồng khác, không đụng tới).

## 8. File đổi/thêm (text, không binary — parent gộp batch)

- Sửa: `apps/web/src/components/nested/NestedClipPanel.tsx` —
  guard mốc rỗng trong `splitAtOuterOffset` + comment K6 + sửa 2
  comment nhắc key cũ.
- Sửa: `apps/web/src/i18n/vi.json` — thêm `nested.splitOffsetEmpty`
  (vi), xóa `nested.deepNestedEditNote`.
- Sửa: `apps/web/src/i18n/en.json` — thêm `nested.splitOffsetEmpty`
  (en), xóa `nested.deepNestedEditNote`.
- Mới: `apps/web/scripts/clicktest-k6-round27-pipe.mjs` — harness
  K6 (pipe CDP + snapshot dist + seed J6-MAIN + drill theo locale
  + clear input thật + 2 phiên vi/en).
- Mới: `docs/PHASE9_ROUND27_K6_CLICKTEST_LIMITS.md` — file này.
- Mới: `benchmarks/results/v27-k6-clicktest-baseline.json` — 8/8
  baseline (bundle z7wG6h2H).
- Mới: `benchmarks/results/v27-k6-clicktest.json` — 8/8 guard
  (bundle mIzUrd00).
- Mới: `benchmarks/results/v27-k6-regress-j6.json` — 17/17 (copy
  tạm harness J6 đã xóa sau khi chạy).
- Mới: `benchmarks/results/v27-k6-regress-i6.json` — 13/14 (copy
  tạm harness I6 đã xóa sau khi chạy; R3 nhiễu §5h).
- KHÔNG đụng: `apps/web/dist/` (không build vào đó), store.ts,
  test của luồng khác, file của các luồng round 27 khác.
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub
  connector, KHÔNG stage (parent gộp batch).
