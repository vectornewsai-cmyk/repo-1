# PHASE9_ROUND103_E3_GHOST_LIMITS — F8 relabel snapshot bằng anchor tap: cơ chế đúng, độ phủ thiếu → KHÔNG LAND (revert hoàn toàn)

> Luồng E3, đợt 103, lượt cron 12:35 +07 13/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> Nợ LIMITS gộp đợt 102 §4 mục 3: Ghost residual — F7 tap không land; hướng còn
> đứng: **F8 relabel snapshot bằng anchor tap** (CHƯA thử) + siết ngưỡng tươi
> anchor 500ms → ~50ms.
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính (5 ý):**
> 1. **Cơ chế F8 ĐÚNG và MẠNH khi anchor tươi:** snapshot gắn nhãn từ tap tươi
>    đạt **78–92% clean** (B: 85,7%, B2: 78,1%, flip: 91,9%); presented tươi
>    [0,50ms) chính xác **80,8–87,8%** (D2 đo 69–78% ở cùng dải — gate 50ms
>    siết đúng chỗ).
> 2. **Nhưng headline clean KHÔNG đạt bar:** case B 49,5% (B) / 58,1% (B2) so với
>    baseline 41,9% / 42,1% — dưới bar đăng ký trước (≥70% và hơn baseline
>    ≥20 điểm). Gộp mọi run F8: 62,9% vs baseline 44,1% (+18,8pt) — vẫn trượt
>    cả hai ngưỡng.
> 3. **Nguyên nhân là ĐỘ PHỦ, không phải cơ chế:** anchor tươi (≤50ms) chỉ
>    phủ 34% tick ở run B (tải nặng, tuổi anchor trung vị 87,6ms) → 74% ở B2
>    → 97% hậu flip ở run C. Clean tăng đơn điệu theo độ phủ: 49,5% → 58,1%
>    → 89,5%. Snapshot rơi về nhãn frameIdx chỉ 25–27% clean (tệ hơn cả
>    baseline — đó là tập tick khó: stall/seek/tải, đã chọn lọc âm).
> 4. **Flip-protocol thì ĐẠT bar với biên lớn:** clean hậu flip+2000ms **89,5%**
>    (68/76) vs baseline flip cùng cây 47,9% (+41,6pt); gap presented−expected
>    |≤3| đạt **100% ở mọi cửa sổ**, seek nào gap cũng = 1. Đây là phép đo
>    gần-với-độ-phủ-đầy-nhất của F8 — nhưng bar yêu cầu CẢ case B nên không
>    đủ để land.
> 5. **Production đã REVERT hoàn toàn** (0 marker E3; `presentedFrameIndex` về
>    đúng bản gốc; `previewEngine.ts` không hề chạm). Batch stage chỉ có file này.

## 0. Môi trường đo + xung đột luồng + bar đăng ký trước

- Boot **9576eac3** (reboot #27 ~05:26:18Z 13/11/2026). RAM khả dụng ~1,2 GB lúc
  bắt đầu → ~2,0 GB lúc đo — birefnet KHÔNG chạy.
- **Bar đăng ký trước** (ghi trong `hidden_files/round103-e3/boot.log` TRƯỚC khi
  đo, giữ y như D2): land CHỈ khi clean ≥70% VÀ hơn baseline ≥20 điểm trên
  cùng protocol (case B 20 pass `--disable-rvfc` + flip-protocol), spread
  cải thiện. Không đạt → REVERT HOÀN TOÀN.
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
  **WebKit: KHÔNG chạy được** (không có driver, như C2/D2). Mọi kết luận nhân
  quả chỉ đo trên Chromium. Tap/relabel VÔ DỤNG trên WebKit theo thiết kế
  (rVFC không bắn) — xem phác F6' ở §6.
- Vite riêng E3 trên **5179, HMR TẮT** (config tạm `apps/web/vite.config.e3-temp.ts`,
  đã xoá sau khi đo — xem §7): lần chạy run A đầu tiên CHẾT ở pass 8 vì
  luồng **E4 sửa `preview.tsx` lúc 05:59:24Z giữa chừng** → HMR reload →
  probe mất target ("Inspected target navigated or closed"). Vite HMR-tắt
  serve code đóng băng lúc khởi động nên các run sau miễn nhiễm với sửa
  đổi trên đĩa. Disk `preview.tsx` đổi md5 3 lần trong phiên
  (`110a51b9` → `03fab95d` → `4e954101`, lần cuối 06:28:22Z) do các luồng
  khác; code E3 trên đĩa còn nguyên suốt phiên (17 marker, 7 điểm relabel),
  và mọi run đều đo trên cây đóng băng `110a51b9` (E3 + E4-driftConfirmSkip +
  D3). Sau revert, md5 cuối `c2251e39` (xem §5).
- Marker đối chứng: D3 (rvfcClipWindow) 21 → 23–24 lần xuất hiện (luồng khác
  thêm nhắc D3 — không phải code D3 đổi); C4 (pad-oldest) 7 — còn nguyên.
  `previewEngine.ts` KHÔNG chạm (md5 `cd540de9`, khớp baseline).

## 1. Fix đã thử — F8 relabel snapshot bằng anchor tap (đã revert)

Thiết kế (code đã revert, mô tả để luồng sau tái dùng):

- **Tap** = 1 đăng ký rVFC RIÊNG trên cùng element video (khôi phục thiết kế F7
  của D2): callback CHỈ cập nhật anchor trình chiếu (`lastFrameIdx` +
  `lastExpectedDisplayTime` + `lastCallbackMs`), KHÔNG capture pixels,
  KHÔNG động ring, KHÔNG động pump. Chạy song song với pump; ensure cùng
  block `drawVideoClip` với `ensureRvfcPump` nhưng KHÔNG phụ thuộc
  `snapshotsViaRvfc` hay `__vcutDisableRvfc` (tap phải sống cả khi pump tắt
  — đúng lúc đường tick cần anchor); vòng đời mirror pump (stale >1500ms
  không khẳng định thì dừng đăng ký lại; kill khi element đổi chủ); KHÔNG
  tạo khi `rvfcSilentEngine` (WebKit); hook test
  `__vcut103e3PresentedTap=false` tắt tap.
- **Anchor tươi 50ms** (`freshAnchorFrame`): chọn anchor tươi nhất giữa tap và
  pump (tuổi = thời gian từ callback rVFC gần nhất); chỉ tin khi tuổi
  ≤50ms, cũ hơn thì rơi về `frameIdx`. Ngoại suy trong cửa sổ tươi giữ
  nguyên công thức X2 (`F + số khung trôi qua kể từ E`).
- **`presentedFrameIndex` dùng chung anchor tươi đó** (thay vì chỉ pump không
  gate như trước): nhãn snapshot (F8) và presented ở cùng 1 hệ tọa độ nên
  quyết định `skipLatest` trong `compositeMotionBlurLayer` không lệch nhau
  1 khung. Khi anchor cũ, cả hai cùng rơi về `frameIdx`.
- **Relabel**: lúc capture, nhãn snapshot = anchor tươi thay vì
  `floor(currentTime·30)` / `videoFrameIndex(mediaTime)` — 7 điểm gọi
  `updateMotionBlurSnapshots` đường tick + `rvfcCaptureFrame` đường pump
  (ở đường pump, relabel chỉ +1 khi callback bắn trễ mà vẫn lọt freshness
  guard). Hook test `__vcut103e3Relabel=false` tắt relabel.
- **Log đo mới** (đã revert cùng code): `RvfcBlendTickSample.anchorSrc` /
  `anchorAgeMs` (anchor đã nuôi `presented` ở tick đó); `MotionBlurSnapshotPix.labelSrc`
  (`tap`/`pump`/`frameIdx`/`off` — nguồn nhãn của từng snapshot).

## 2. Protocol đo (6 run, case B, 20 pass)

Probe `probe103e3-ghost.cdp.mjs` (copy D2 + cờ `--disable-relabel`); analyzer
`analyze-e3.py` / `analyze-e3-flip.py` / `analyze-e3-presented.py` (copy D2 +
breakdown theo `labelSrc` + bucket tuổi anchor). Tải máy dao động mạnh giữa
các run (sóng tải từ 8 luồng song song — load 1-min 0,95 → 9,91) nên mỗi
run ghi thêm tốc độ rAF (số khung/pass) làm chỉ thị tải.

| Run | Điều kiện | Ticks | Khung/pass (chỉ thị tải) | Load 1-phút |
|---|---|---|---|---|
| A | baseline: tap OFF + relabel OFF, `--disable-rvfc` | 432 | ~14–45 | ~7 |
| A2 | baseline lặp lại (cùng điều kiện A) | 538 | ~6–53 | 0,95 → 9,91 (tăng giữa run) |
| B | F8 ON, `--disable-rvfc` | 275 | ~6–23 (nặng nhất) | ~7–8 |
| B2 | F8 ON lặp lại, `--disable-rvfc` | 740 | ~13–97 | 7,91 → 1,02 (giảm giữa run) |
| C | F8 ON, flip rVFC sau pass 5 | 2497 (trước 563 / sau 1934) | ~125 (nhẹ nhất) | ~1–3 |
| D | baseline flip (tap+relabel OFF), flip sau pass 5 | 1097 (trước 262 / sau 835) | ~55 | ~1–3 |

## 3. Kết quả

### 3.1 Clean — chỉ số quyết định

| Run | Clean (đơn-nghĩa) | So baseline | labelSrc=tap | labelSrc=frameIdx |
|---|---|---|---|---|
| A (base) | **54/129 = 41,9%** | — | — (off) | — |
| A2 (base) | **53/126 = 42,1%** | — | — (off) | — |
| B (F8) | **54/109 = 49,5%** | +7,6pt | **36/42 = 85,7%** | 18/67 = 26,9% |
| B2 (F8) | **68/117 = 58,1%** | +16,0pt (vs A2) | **57/73 = 78,1%** | 11/44 = 25,0% |
| C flip, hậu flip+2000ms | **68/76 = 89,5%** | **+41,6pt (vs D)** | **68/74 = 91,9%** | 0/2 = 0% |
| D flip base, hậu flip+2000ms | **68/142 = 47,9%** | — | — (off) | — |

- Baseline ỔN ĐỊNH theo tải: A 41,9% / A2 42,1% / D2-A 40,5% / D-flip 47,9%
  (flip cao hơn chút vì mẫu khác — vẫn cùng dải). P2 (rawCt) 40–42% mọi run base.
- Gộp F8 (B+B2+C-hậu-flip): clean 190/302 = **62,9%**; gộp baseline
  (A+A2+D-hậu-flip): 175/397 = **44,1%**; chênh **+18,8pt — vẫn dưới bar
  +20pt và dưới 70%** theo mọi cách gộp trung thực.
- **Kết luận §3.1: bar case-B KHÔNG đạt** (B +7,6pt; B2 +16,0pt — cả hai đều
  dưới +20pt và dưới 70%). Bar flip ĐẠT (89,5%, +41,6pt) nhưng bar yêu cầu
  cả hai chân nên không đủ để land.

### 3.2 Độ phủ anchor — biến số giải thích mọi thứ

| Run | Tick có anchor tươi (≤50ms) | Tuổi anchor trung vị | Clean |
|---|---|---|---|
| B | 94/275 = **34%** | **87,6ms** | 49,5% |
| B2 | 547/740 = **74%** | (phân bố tuổi: [0,50): 547; [50,100): 159; [100,200): 32; [200,500): 2) | 58,1% |
| C hậu flip | 74/76 distinct = **97%** | (tick hậu flip anchor=tap gần như toàn bộ) | 89,5% |

- Clean tăng ĐƠN ĐIỆU theo độ phủ: 34% → 49,5%; 74% → 58,1%; 97% → 89,5%.
- Vì sao tuổi anchor lớn: callback rVFC chỉ bắn khi frame mới trình chiếu;
  dưới tải main-thread (probe `getImageData` toàn canvas mỗi khung rAF +
  8 luồng song song trên VM 1,5 CPU), callback bị trễ tới 100–200ms —
  anchor "tươi" về mặt tường thuật nhưng frame nó mang đã cũ. Gate 50ms
  loại đúng các anchor này (chúng sai 70%+ theo D2), nhưng đồng nghĩa
  phần lớn snapshot rơi về nhãn `frameIdx`.
- Snapshot rơi về `frameIdx` chỉ 25–27% clean — TỆ HƠN baseline 42%: đó là
  tập tick đã chọn lọc âm (stall/seek/tải — đúng lúc nhãn currentTime sai
  nhất). Đây không phải hồi quy của relabel: các snapshot này khi không
  relabel cũng sai y vậy; chỉ là chúng chiếm tỉ trọng lớn khi độ phủ thấp.

### 3.3 Độ chính xác của presented theo tuổi anchor

| | B | B2 |
|---|---|---|
| Presented accuracy tổng | 45,7% (74/162) | 73,5% (299/407) |
| Tuổi [0,50ms) | **87,8%** (43/49) | **80,8%** (249/308) |
| Fallback frameIdx | 27,4% (31/113) | 50,5% (50/99) |
| Baseline A / A2 (frameIdx) | 29,5% / 25,5% | — |

- Gate 50ms được xác nhận độc lập: anchor tươi chính xác 81–88%, cao hơn
  hẳn D2 đo 69–78% ở cùng dải (D2 dùng ngưỡng 500ms nên dải [0,50ms) của
  họ vẫn lẫn anchor cũ hơn? — không, D2 bucket theo tuổi thật; chênh lệch
  này là nhiễu giữa run + cây khác (E4/D3). Không kết luận "tốt hơn D2",
  chỉ kết luận gate 50ms giữ được anchor đúng.
- Fallback ở B2 đạt 50,5% (cao hơn A 29,5%) vì B2 chạy lúc tải giảm dần —
  frameIdx đúng hơn khi video chạy đều; không phải tác dụng của relabel.

### 3.4 Flip-protocol: anchor giữ bounded, clean lên 89,5%

Run C (tap+relabel ON), flip tắt rVFC sau pass 5 (wallMs=31455):

| Hậu flip | n | Gap trung vị | Min–max | \|gap\|≤3 |
|---|---|---|---|---|
| [0, 2000)ms | 115 | 0,0 | 0…1 | 115/115 (100%) |
| [2000, 5000)ms | 170 | 1,0 | 0…1 | 170/170 (100%) |
| [5000, 15000)ms | 576 | 0,0 | 0…1 | 576/576 (100%) |
| [15000ms+) | 1073 | 0,0 | −1…1 | 1073/1073 (100%) |

- Gap tại mỗi seek hậu flip đều = 1 (14/14 seek). 10 gap đầu [0,0,1,0,1,0,0,0,0,0];
  10 gap cuối [−1,0,−1,0,−1,0,0,1,1,0] — không tăng theo seek (C2 không tap:
  +80 … +1028). Claim "tap giữ anchor tươi qua pump chết + seek" của D2
  được tái xác nhận, nay kèm relabel.
- Run D (flip baseline): gap cũng |≤3| 100% — NHƯNG ĐÓ LÀ VACUOUS: không
  có anchor nên `presented` rơi về `frameIdx` (= `expected`) theo thiết kế
  gate mới, gap ≡ 0 theo cấu tạo. Không được trích "gap D bounded" làm
  bằng chứng anchor tốt; chỉ clean D (47,9%) là baseline có nghĩa.
  (Tác dụng phụ đáng ghi của gate 50ms trong `presentedFrameIndex`: nó
  triệt tiêu luôn phân kỳ ngoại suy của C2 — pump chết thì presented về
  frameIdx thay vì trôi +1028. Đó là hành vi an toàn hơn, nhưng không
  phải fix ghost.)

### 3.5 Spread — KHÔNG dùng median để xét nữa

- Spread theo cửa sổ đã vẽ (probe): A 1,5 (nGroups 20); A2 45,7 (39);
  B nGroups=0 (không đo được — xem dưới); B2 0,6 (65); C 0,5 (112);
  D (flip base) 45,5 (112).
- **Median spread là artifact của phân bố lưỡng đỉnh, không phải hiệu ứng
  thật:** tính lại độc lập từ JSON (nhóm theo cửa sổ đã vẽ, đúng luật
  probe): D2-A median 45,6 = 10 nhóm chặt (0–1,7) + 11 nhóm lỏng (45–76);
  E3-A median 1,5 = 11 nhóm chặt + 9 nhóm lỏng. Phân bố GẦN NHƯ GIỐNG
  HỆT — median lật chỉ vì 1 nhóm đổi phía. Các run sau lặp lại mẫu này
  (A2: 45,7; B2: 0,6; C: 0,5 — cùng đuôi lỏng 45–76). **Từ nay các luồng
  sau phải báo PHÂN BỐ spread (số nhóm lỏng spread>15 / tổng), không báo
  median đơn độc.**
- B nGroups=0: nhãn relabel làm khóa cửa sổ (frameIdx,prev,last) phân mảnh
  theo pass (cùng nội dung frame được gán nhãn khác nhau ±1 tùy thời điểm
  callback) nên không còn khóa lặp lại ≥2 pass. Đây là hệ quả đo lường
  của relabel (nhãn kém ổn định qua pass dù đúng hơn từng snapshot),
  không phải hồi quy chất lượng blend — clean (đo từng snapshot) không
  bị ảnh hưởng. Spread vì vậy KHÔNG xét được cho run B; B2/C (nhiều tick
  hơn) vẫn đo được và đuôi lỏng không đổi so với baseline (max ~75).

## 4. Verdict — KHÔNG LAND + vì sao + đã revert những gì

| Tiêu chí đăng ký trước | Kết quả | Đạt? |
|---|---|---|
| Case B clean ≥70% và hơn baseline ≥20pt | B 49,5% (+7,6pt); B2 58,1% (+16,0pt) | **KHÔNG** |
| Flip clean ≥70% và hơn baseline ≥20pt | C 89,5% (+41,6pt vs D) | **CÓ** |
| Spread cải thiện | Phân bố đuôi lỏng không đổi; median là artifact (§3.5) | **KHÔNG ĐÁNH GIÁ ĐƯỢC** |
| Không hồi quy | tsc 0, vite build PASS, ghostBlend 15/15, previewEngine 27/27 (cây revert); baseline A/A2 tái hiện D2 | **CÓ** |

- **KHÔNG LAND vì bar case-B không đạt ở cả hai lần đo độc lập** (B nặng tải,
  B2 nhẹ tải dần). Cơ chế đã chứng minh (nhãn tap 78–92% clean) nhưng
  headline metric bị độ phủ anchor chặn — land lúc này sẽ là "sửa production
  chỉ để trông như đã fix" ở đúng regime chuẩn (case B, pump tắt từ đầu).
- **Đã revert:** toàn bộ code F8 khỏi `preview.tsx` — khối tap
  (`PresentedTapState`, `presentedTaps`, `presentedTapCallback`,
  `ensurePresentedTap`, `freshAnchorFrame`, `relabelFrameIndex`,
  `e3RelabelStash`), `presentedFrameIndex` về đúng bản gốc (pump không
  gate), 7 điểm gọi `updateMotionBlurSnapshots` về `frameIdx`, relabel
  trong `rvfcCaptureFrame`, `labelSrc` khỏi `MotionBlurSnapshotPix` /
  `recordMotionBlurSnapshotPix`, `anchorSrc`/`anchorAgeMs` khỏi
  `RvfcBlendTickSample` / `recordDrawnBlendWindow`, lệnh gọi
  `ensurePresentedTap` trong `drawVideoClip`. Verify: grep marker E3 =
  **0** (kể cả `103e3`, `103 E3`, `freshAnchorFrame`, `relabelFrameIndex`,
  `e3RelabelStash`, `presentedTap`); `previewEngine.ts` không hề chạm
  (md5 `cd540de9` khớp baseline); marker D3 ×23, C4 ×7 còn nguyên (chênh
  D3 21→23 do luồng khác thêm nhắc D3 — không phải code D3 đổi).
- Md5 `preview.tsx`: baseline D9 `ed260e62` → trước revert `4e954101`
  (E3 + E4 + các luồng khác) → sau revert `c2251e39` (chỉ còn code các
  luồng khác; không khôi phục md5 cũ vì sẽ xóa công việc của họ).

## 5. Kiểm chứng (cây đã revert)

- `tsc` apps/web: **0**.
- `vite build`: **PASS 6,43s** (dist 1,68 MB JS).
- `ghostBlend.probe.test.ts`: **15/15 PASS**.
- `previewEngine.test.ts`: **27 test passed**.
- Probe assert: không chạy `--assert` ở các run đo (chỉ đo, không khóa) —
  spread assert cũ đã biết fail ở baseline (D2 run A 1 fail spread).
- Không sửa file Y2/Z2/A2/B2/C2; không đụng drift Y4 / watchdog Y5 /
  clip-change Y7 / re-arm Z3 / B3 / B4 / C3 / D3 / E4.

## 6. Nợ mở + đề xuất cho đợt sau

1. **F8b — nhãn bằng frame anchor THÔ khi anchor cũ (hướng mới, CHƯA thử):**
   khi tuổi anchor >50ms, thay vì rơi về `frameIdx`, gán nhãn = frame của
   callback rVFC gần nhất KHÔNG ngoại suy. Lý thuyết: callback chỉ bắn khi
   frame mới trình chiếu nên nếu chưa có callback mới thì element vẫn đang
   trình chiếu frame đó (đúng cả khi decoder stall — đúng lúc `frameIdx`
   sai nhất). Phản-lý thuyết: callback có thể bị kẹt sau main-thread bận
   trong khi trình chiếu đã sang frame kế (ngoại suy +1..2 mới đúng). Hai
   giả thuyết này PHÂN BIỆT ĐƯỢC bằng dữ liệu đã có: với mỗi snapshot
   fallback ở run B/B2, so strip với frame anchor-thô (tính lại offline
   từ `anchorAgeMs` + `presented` trong JSON — cần ghi thêm frame anchor
   thô vào log ở lần đo sau). Cần A/B riêng với bar clean như cũ; KHÔNG
   tự land. Đây là hướng hứa hẹn nhất vì nó nhắm đúng tập snapshot đang
   kéo clean xuống (25–27%).
2. **Tăng độ phủ anchor dưới tải:** giảm tải probe (đo strip thưa hơn) hoặc
   tách callback tap khỏi main-thread bận (không thể — rVFC vốn chạy trên
   main thread); hoặc nới gate 50ms → 75ms kèm đo lại (D2: [50,100ms) chỉ
   28–31% nên nới gate có thể HẠI nhiều hơn lợi — đo rồi mới kết luận).
3. **F6' pixel-verified skipLatest cho WebKit (CHỈ PHÁC, CHƯA ĐO — xem §6.1).**
4. **Spread:** từ nay báo phân bố (số nhóm lỏng/tổng), không báo median (§3.5).
5. **Flip-gap vacuous (§3.4):** khi `presented` có fallback về `frameIdx`,
   gap ≡ 0 theo cấu tạo — phân tích flip phải báo thêm tỉ lệ tick có
   anchor thật (`anchorSrc != frameIdx`) kèm gap, không báo gap trần.
6. Nợ khác đứng yên theo LIMITS gộp đợt 102 §4: G1 chờ user quyết metric
   G5/M2; 2 MiB; re-arm drift-gate đã land (C3); blur r7; zombie tick
   stale-frame (E4 đang làm); EPERM probe #22 + khoảng mù #21; birefnet
   0 lần; TTS 39 CẤM kiểm lại; ci-security.yml 403; release gate không đổi.

### 6.1 Phác F6' pixel-verified skipLatest (WebKit) — chưa đo, chưa code

- **Bối cảnh:** WebKitGTK không bao giờ bắn rVFC (đo đợt 94 V4: 0 callback) nên
  tap/relabel vô dụng ở đó; ghost residual trên WebKit vẫn còn nguyên. F6'
  (C2 §7) quyết `skipLatest` bằng PIXEL thay vì bằng metadata trình chiếu.
- **Phác cơ chế:** ở `compositeMotionBlurLayer`, trước khi quyết `skipLatest`,
  đọc strip 48 mẫu kênh G của snapshot mới nhất trong ring (đã có sẵn qua
  `motionBlurSnapshotPix` — strip đọc ngay sau `drawImage` lúc capture)
  và strip frame hiện tại vừa vẽ (đường mask: `blendCurrentPixStrip` đã có;
  đường thường: `samplePlainCurrentPixStrip` đã có). Đối chiếu 2 strip
  bằng cùng luật mod-5 của analyzer (`match_set`, cửa sổ ±3, ngưỡng ≤2 bit
  lệch): nếu strip snapshot mới nhất khớp DUY NHẤT frame hiện tại đang vẽ
  (cùng residue mod 5) thì snapshot đó CHÍNH LÀ frame hiện tại → loại
  khỏi tập ghost (`skipLatest=1`); nếu khớp frame khác hoặc mơ hồ thì giữ
  hành vi cũ.
- **Chi phí:** 0 `getImageData` thêm (dùng lại strip đã đọc); chỉ thêm ~48
  phép so sánh bit/tick. Rủi ro: strip mơ hồ khi sọc tuần hoàn chu kỳ 4–5
  khung (2 frame cách nhau 5 khung cho cùng residue) — cần khóa bằng
  `frameIdx` hiện tại (chỉ chấp nhận khớp trong cửa sổ `frameIdx±1`); và
  snapshot đường pump (unit 640×360) vs curPix đường thường (dw×dh) khác
  hình học — phải so strip cùng hình học (resize về cùng w/h như
  `snap_strip` trong analyzer) hoặc chỉ áp F6' ở đường mask-unit trước.
- **Chưa đo gì cả:** chưa code, chưa chạy trên WebKit (VM này không có
  driver WebKit — đo F6' cần driver hoặc máy thật). Luồng sau làm F6' cần
  A/B riêng với bar clean như cũ, đo cả 2 engine.

## 7. Ghi chú vận hành phiên E3 (cho parent/E9)

- **Va chạm luồng:** E4 sửa `preview.tsx` 05:59:24Z làm chết run A lần 1
  (HMR reload). Từ đó E3 chạy vite riêng cổng 5179 với HMR TẮT
  (`vite.config.e3-temp.ts` tạm — đã xoá sau khi đo xong; không stage,
  không push). Các luồng sau đo bằng vite dev nên cân nhắc HMR-tắt khi
  nhiều luồng cùng sửa 1 file.
- **Tải máy dao động 10× giữa các run** (rAF 6fps ↔ 60fps) do 8 luồng song
  song; baseline clean không trôi theo tải (41,9–42,1%) nhưng mọi metric
  phụ thuộc callback (độ phủ anchor, spread median) trôi mạnh — ghi chỉ
  thị tải (khung/pass, load) kèm mọi run sau này.
- `tsconfig.json` bị ghi lại 06:00:04Z (không phải E3 — E3 chỉ chạy
  `tsc --noEmit`); vite log "changed tsconfig file detected" 2 lần — không
  ảnh hưởng đo (vite 5179 HMR-tắt).

## 8. File E3 tạo/sửa (batch stage)

- `docs/PHASE9_ROUND103_E3_GHOST_LIMITS.md` — file này (DUY NHẤT trong batch;
  `preview.tsx` đã revert hoàn toàn nên KHÔNG vào batch).
- Scratch đo (không vào batch):
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e3/`
  (`boot.log`, `round103-e3.md`, `probe103e3-ghost.cdp.mjs` (copy D2 +
  cờ `--disable-relabel`), `analyze-e3.py` (copy D2 + breakdown `labelSrc`),
  `analyze-e3-flip.py` (copy D2 + breakdown `labelSrc`),
  `analyze-e3-presented.py` (copy D2 + bucket tuổi anchor),
  `preview-b-e3-tapoff-relabeloff.json`, `preview-b-e3-tapoff-relabeloff-2.json`,
  `preview-b-e3-tapon-relabelon.json`, `preview-b-e3-tapon-relabelon-2.json`,
  `preview-b-e3-flip-tapon-relabelon.json`, `preview-b-e3-flip-tapoff-relabeloff.json`,
  `run-a-tapoff-relabeloff.log`, `run-a2-tapoff-relabeloff.log`,
  `run-b-tapon-relabelon.log`, `run-b2-tapon-relabelon.log`,
  `run-c-flip-tapon-relabelon.log`, `run-d-flip-tapoff-relabeloff.log`,
  `analyze-e3-*.txt`, `vite-5178-e3.log`, `vite-5179-e3.log`).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round103-e3-ghost.txt`
  (NUL-delimited, 1 entry). KHÔNG push GitHub; user tự push sau từ main chat.
