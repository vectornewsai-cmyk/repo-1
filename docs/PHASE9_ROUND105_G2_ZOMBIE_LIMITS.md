# PHASE9_ROUND105_G2_ZOMBIE_LIMITS — hoàn thiện F4 đợt 104 từ dữ liệu thô

> Luồng G2, đợt 105. Lượt cron 18:35 +07 13/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> Nợ: LIMITS gộp đợt 104 §4 mục 1 + §1 F4 (F4 chết do reboot #29 lúc 08:56:39Z,
> chỉ để lại dữ liệu thô — không LIMITS, không batch).
> **Không sửa production** — chỉ probe đã có (`probe104f4-frame-parity.mjs`,
> F4 tạo lúc 08:41) + analyze (G2 viết mới, xem §8).

## 0. Tóm tắt verdict — F4 ĐÃ HOÀN THIỆN TỪ DỮ LIỆU THÔ; ZOMBIE VẪN ĐỨNG, NỢ GATE-(b) VẪN MỞ

**Zombie core trên cây hiện tại vẫn đứng (fix D3 sync-kill + E4 gate (b) còn nguyên, đã đo lại):**

- **Zombie Δ = 0 ở 12/12 biên đo được × 2 lượt** (f4y1 + f4y2); **0 capture trong
  cửa sổ clip lẻ (24/24 cửa sổ)** — 0 post-seek, 0 pre-seek straggler.
- **`skip-clip-inactive` = 0 ở cả 2 lượt** (check A6 không cần bắn — sync kill
  giết trước); fb **`seek-inactive` 11/12 (f4y1) + 9/12 (f4y2)**, còn lại
  `no-callback` (pump chết bởi watchdog trước biên, không phải zombie).
- Pixel parity đứng: clip lẻ (không blur) **C 75–100%, D = 0, out = 0** cả 2 lượt.

**Nợ chính của F4 — gate (b) đóng băng canvas trong khi playhead chạy tự do
(E4 §1.6): VẪN CHƯA QUAN SÁT ĐƯỢC, không đóng, không bác:**

- Spread test trên draws-gap: **0/267 gap** có gate-(b) skips + playhead chạy
  tự do bền vững (đính chính `drawsgap-all.txt` cũ — xem §3).
- Freeze v2 (dense runs): f4 **0/19 freeze thật có playhead chạy** (max 321 ms,
  dph = 0,00 hết); gộp e4: 0/20, trừ ca clip-18 e4y1 vốn là **1 bước nhảy +
  plateau, không phải chạy tự do**.
- Phép đo thiếu độ nhạy dưới tải (state100 thưa, bracket tới 2725 ms) — cần
  lượt máy yên + state100 dày mới kết luận được.

**Phát hiện phương pháp (mới, §4):** draws-check cho **8/46 "stale" danh nghĩa**,
nhưng giám định từng ca → **0/46 xác nhận**: 7 ca là frame cuối clip cũ vẽ
trước khi biên thật qua (seekRel nội suy sớm do state100 thưa), 1 ca là drift
+0,356 s trong lúc playhead bị hold (vượt ngưỡng 0,35 đúng 6 ms, trong sai số
nội suy). Main-canvas stale xác nhận: **0/46**. Draws-check cần guard bracket
ở đợt sau (đề xuất §4.3).

**KHÔNG chạy probe live mới trong luồng này:** RAM khả dụng lúc bắt đầu chỉ
~518 MB (E4 cần 1,5–2,6 GB), 8–10 luồng song song đang chạy; dữ liệu thô F4
đủ cho mọi kết luận trên; probe mới dưới tải này chỉ lặp lại độ thưa đã có
(f4y1 load lúc phát 20,00 là bằng chứng). Quyết định ghi rõ, không retry.

## 1. Dữ liệu thô F4 — kiểm đĩa trước khi kết luận (đủ, trừ f4y3)

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f4/`:

| File | Trạng thái |
|---|---|
| `chr-mixedalt-f4y1/frame-parity-results.json` (11 MB) | Đủ — 349 draws, 41 tick, 296 state100, pumpN=66 |
| `chr-mixedalt-f4y2/frame-parity-results.json` (12 MB) | Đủ — 392 draws, 27 tick, 382 state100, pumpN=70 |
| `chr-mixedalt-f4y3/` | CHỈ có `frame-parity-error.txt` — `ERR_CONNECTION_REFUSED :5591`, reboot #29 giết lúc 08:56:39Z; không có results |
| `chains-spread.txt`, `drawsgap-all.txt`, `freeze-f4y1/f4y2/y1y2(-v2).txt` | Đủ (nhưng `drawsgap-all.txt` dùng tiêu chí cũ dph>0,30 — xem §3) |
| `driver.log`, `driver-pb.log` | Đủ — f4y1/y2 rc=0, f4y3 rc=2 |
| `round104-f4-drawsgap.py`, `round104-f4-freeze.py` | Có, chạy lại tái hiện đúng số trên đĩa (§3) |

- **Driver seek-across chỉ bắn 2/23 (f4y1) và 0/23 (f4y2)** — vòng lái poll
  150 ms, playhead nhảy burst qua cửa sổ `[b−1, b)` dưới tải → 2 lượt thực
  chất là **phát tick-by-tick + sysload 2**, không phải seek-across. Đây là
  giới hạn lớn nhất của dữ liệu F4 với câu hỏi seek-across (chỉ 2 cú seek
  thật, xem §2 E4a/E4b). f4y2 `--seek-across --pause-burst`: pause-burst
  cũng không bắn lần nào (nhánh else-if sau seek-across, cửa sổ bị seek-across
  phủ — với cả 2 cờ thì pause-burst không tới được).
- **f4y1 nhiễm tải nặng:** chờ yên 120 s hết mà load vẫn 20,00 lúc phát
  (27/1039 proc, RAM khả dụng 1912 MB); draws 349 (so với 2000 ở e4y1),
  state100 296 mẫu (gap quanh biên tới 908 ms), tick 41.
  **f4y2:** load lúc phát 1,64 nhưng vẫn thưa (draws 392, state100 382 mẫu,
  gap quanh biên tới 1655 ms) — tải sibling trong lúc phát, không phải lúc
  đo load.
- **f4y1 `mtimeChanged=true`:** sibling sửa `preview.tsx` c2251e39→ca378bbf
  lúc 08:44:33Z trong lúc chờ yên, TRƯỚC khi phát (08:45:05) — HMR hot-swap,
  không reload trang (state100 liên tục); cả lượt phát thực chất trên
  **ca378bbf**. f4y2 `mtimeChanged=false`, toàn bộ trên ca378bbf.
  **Cây hiện tại lúc viết file này: md5 ca378bbf — trùng build f4y2.**
  Marker E4 còn nguyên (25 lần `103E4|103e4`, điều kiện gate
  `overCount >= 1` nguyên vẹn), D3 còn nguyên (7 lần
  `rvfcClipWindow|seek-inactive|rvfcKillPumpsOutsidePlayhead`).
  E4 đã verify code E4 còn nguyên trên c2251e39 ở đợt 103 (§4 LIMITS E4).

## 2. Kiểm chứng độc lập — phương pháp C5/D3/E4 chạy lại trên dữ liệu F4

Script G2 `round105-g2-analyze.py` (copy `analyze-post` E4, chỉ đổi thư mục
dữ liệu → round104-f4). Kết quả đầy đủ: `hidden_files/round105-g2/round105-g2-analysis.txt`.

| Lượt | Điều kiện | Build | Zombie Δ (12 biên) | Capture cửa sổ lẻ (12 cửa sổ) | skip-clip-inactive | fb clip chẵn | Pixel parity clip lẻ |
|---|---|---|---|---|---|---|---|
| f4y1 | tick + sysload 2 (load 20) | ca378bbf* | **0×12** | **0 / 0 post / 0 pre** | **0** | seek-inactive 11/12, no-callback c0 | C 75–100%, D=0, out=0 |
| f4y2 | tick + sysload 2 | ca378bbf | **0×12** | **0 / 0 post / 0 pre** | **0** | seek-inactive 9/12, no-callback c4/c18/c20 | C 75–100%, D=0, out=0 |

\* f4y1 mtimeBefore c2251e39, nhưng phát thực chất trên ca378bbf (xem §1).

- `pageErrs` = 0 cả 2 lượt. `playing+sleeping` = 0 mẫu, `tickErr` = 0 cả 2 lượt.
- `fbAt − b_k` (thô) ≈ 0 ms ở hầu hết biên chẵn (sync kill tại biên); nội suy
  +65…+883 ms là lượng tử sampler (state100 thưa), không phải trễ kill —
  như C5/E4 đã ghi.
- Pump events: f4y1 n=66 {capture 37, skip-stale-frame 25, skip-stale 2,
  reset-capture 2}; f4y2 n=70 {capture 45, skip-stale-frame 18, skip-stale 3,
  reset-capture 3, duplicate 1}. **Không có pump event nào frameIdx > 89**
  cả 2 lượt (media dài đúng 3,000 s).
- SeekSkip N3 vẫn hoạt động mạnh: f4y1 delta 1–50 tick/cửa sổ (c2 +36, c14
  +50); f4y2 c4 +80, c7 +41, c22 +84 — đường skip-render khi seeking là nền,
  như các đợt trước.

### E4a — stale-draw ở tick đầu sau nhảy (chỉ 2 cú driver seek)

- f4y1 k=1: cap ok (frameIdx 5, exp ~5,0). k=2: cap **STALE-CANVAS**
  (frameIdx 68, exp ~5,0, tag=tick, +21 ms sau seekRel chính xác từ tSeekRaw).
  **Không chứng minh draw stale:** không có tick record nào sau cú seek
  trong cửa sổ (tick n=41, thưa); cap tag=tick là sampler đọc lại tick record
  mới nhất lúc lấy mẫu — tick đó vẽ frame 68 **trước** cú seek (element ở
  ct 2,27 trong lúc chơi c1). Draws-check k=2 (§4) cho first video draw
  +294 ms ct=0,4333 ok — không có draw stale sau cú seek này.
- f4y2: 0 cú driver seek → E4a examined 0/0.
- **E4a tổng: tick 0/0, cap 1/2 stale-canvas (1 ca là đọc lại tiền-seek).**

### E4b — độ trễ kill trực tiếp

- **Không đo lại được trên cây hiện tại:** không tìm thấy kill entry khớp 2 cú
  driver seek (kills=11 ở f4y1). Giải thích, không phải lỗi fix: k=1 biên
  c0→c1 — pump c0 đã chết trước bởi watchdog (fb `no-callback`, caps=0);
  k=2 biên c1→c2 — c1 không blur nên không có pump để kill. Các kill entry
  có được (ph 9,33 / 15,17 / 21,20 …) đều là sync kill ở biên tick-by-tick,
  không có tSeekRaw để đối chiếu.
- Số E4 (median 0,10–0,20 ms, max 6,20 ms) vẫn đứng theo code kill đồng bộ
  không đổi (cùng md5 ca378bbf, marker nguyên vẹn). Muốn số mới cần lượt
  seek-across bắn đủ 23/23 cú (xem nợ §7.2).

### E4c — counter gate vẽ E4

- f4y1: `driftConfirmSkips103e4` = 112 (state100 e4skip 1→112, delta 111);
  f4y2: 203 (1→203, delta 202). `seekSkipTicks86N3` = 181 / 277.
  Gate (b) có bắn ở cả 2 lượt (không phải gate chết), nhưng phần lớn skips
  tập trung thành đợt dài (xem §3), không phải 1 tick/biên như e4y2 (23).

## 3. Nợ F4 — gate (b) đóng băng canvas trong khi playhead chạy tự do: KHÔNG QUAN SÁT ĐƯỢC

### 3.1 Draws-gap, spread test (chạy lại script F4, đính chính tiêu chí cũ)

- G2 chạy lại `round104-f4-drawsgap.py` trên cả 4 lượt (e4y1/e4y2/f4y1/f4y2):
  **267 gaps >300 ms, 0 gap có gate-(b) skips + playhead chạy tự do bền vững
  (spread=True), max_unheld_gap = 0 ms.** Output:
  `hidden_files/round105-g2/round105-g2-drawsgap.txt`.
- **Đính chính `drawsgap-all.txt` trên đĩa (62 ca "UNHELD+SKIPS"):** file đó
  dùng tiêu chí cũ dph>0,30 s. dph qua biên gap bị thổi phồng bởi cú nhảy
  seek-landing **1 bước** (playhead nhảy 1 lần rồi plateau), không phải chạy
  tự do bền vững. Bằng chứng: ph trace clip-18 e4y1
  `47743:53.10 → 48225:54.20 → 48725:54.20 …` (nhảy +1,10 rồi phẳng);
  `chains-spread.txt` cho `spread_advance=False` ở mọi chain liệt kê
  (e4y1 1/22, f4y1 3/33, f4y2 9/39 chain). Tiêu chí spread (mẫu giữa nằm
  nghiêm ngặt giữa mẫu đầu–cuối trong gap) là đúng; 62 ca cũ rút về **0**.

### 3.2 Freeze v2 (dense runs, chạy lại script F4)

- f4y1: 11 dense run, **6 freeze thật (skips≥2), max 189 ms, advancing 0**
  (dph = 0,00 hết — ph trace phẳng: 7,57 / 42,03 đứng yên).
  f4y2: 27 dense run, **13 freeze thật, max 321 ms, advancing 0**
  (ph 12,80 / 21,23 / 67,37 đứng yên).
- Gộp e4: 20 freeze thật, advancing 1 — chỉ clip-18 e4y1 (3107 ms, dph 1,10,
  skips 185) vốn là 1 bước nhảy + plateau (§3.1), không phải chạy tự do.
- `watchN`/`tailN` (F4 thêm để quy freeze về grace X4/Y4): các freeze thật
  đều `watch_max=0`, `tail_max=0/1` — **không quy được về nguồn grace nào
  rõ rệt**. Ghi nhận trung thực: dữ liệu F4 không trả lời được "freeze này
  do watch hay tail giữ".
- Output: `hidden_files/round105-g2/round105-g2-freeze.txt`.

### 3.3 Kết luận §3

Nợ E4 §1.6 ("trần skip cho gate (b) nếu quan sát được grace dài mà playhead
không bị giữ") **vẫn chưa quan sát được sau 4 lượt** (e4y1/e4y2/f4y1/f4y2):
0 ca chạy tự do bền vững trong lúc gate-(b) skip. Không đóng (chưa quan sát
được ≠ đã bác bỏ): phép đo thiếu độ nhạy — state100 thưa (bracket tới
2725 ms) làm spread test và dense-freeze đều mất lực. Cần lượt máy yên +
state100 dày (xem nợ §7.1).

## 4. Draws-check — phát hiện phương pháp: 8/46 danh nghĩa, 0/46 sau giám định

### 4.1 Tái hiện phương pháp (script G2 `round105-g2-draws-check.py`)

- Chạy trên e4y1/e4y2: **0/23 + 0/23 draws stale, main 0/23 + 0/23** — khớp
  đúng `draws-check-y1/y2.txt` của E4 → script đúng, khác biệt nằm ở dữ liệu
  F4 (thưa), không phải phương pháp đổi.
- Chạy trên f4y1/f4y2: **draws stale 4/23 + 4/23 = 8/46; main stale 0/23 + 1/23
  = 1/46.** Output: `hidden_files/round105-g2/round105-g2-draws-check-f4.txt`.

### 4.2 Giám định từng ca (`round105-g2-adjudicate.py`)

| Ca | First draw sau seekRel | Chuỗi draws quanh biên | Phán quyết |
|---|---|---|---|
| f4y1 k=3 | +29 ms, ct=3,0, exp 0,04 | ct 2,66→2,87→**3,0**→0,33 liên tục; cap 17804 ph 8,567 els ct=3 (element đã ở cuối file khi ph còn trong c2) | **(A) frame cuối clip cũ, vẽ trước biên thật** |
| f4y1 k=9 | +163 ms, ct=3,0, exp 0,14 | ct 2,44→…→2,85→**3,0**→0,33; tick 73→78→85 tiến đều; cap 42103 ph 26,833 els ct=3 | **(A)** |
| f4y1 k=13 | +82 ms, ct=3,0, exp 0,09 | bracket state100 2725 ms; cap 59132 ph 37,933 els ct=3 | **(A)** |
| f4y1 k=21 | +6 ms, ct=3,0, exp 0,01 | ct 2,38→2,89→**3,0**→0,279; cap 97004 ph 62,967 els ct=3 | **(A)** |
| f4y2 k=7 | +672 ms, ct=0,5864, exp 0,23 | element 0,233→0,586 trong 490 ms trong khi ph hold 21,23; draw sau cũng 0,5864 (element đứng) | **(C) drift +0,356 trong lúc hold — biên (xem dưới)** |
| f4y2 k=9 | +52 ms, ct=3,0, exp 0,17 | ct 2,81→2,98→**3,0**→0,567; cap 53426 ph 26,93 els ct=3 | **(A)** |
| f4y2 k=13 | +602 ms, ct=3,0, exp 0,55 | bracket 1655 ms; cap 70719 ph 38,633 els ct=3 paused | **(A)** |
| f4y2 k=15 | +239 ms, ct=3,0, exp 0,35 | bracket 1621 ms; cap 78813 ph 44,767 els ct=3 paused | **(A)** |

- **(A) — 7 ca ct=3,0:** cơ chế false-positive của draws-check dưới sampling
  thưa. Playhead nhảy theo **bước** (step) dưới tải, không chạy đều;
  seekRel nội suy tuyến tính đặt mốc **sớm hơn bước nhảy thật** tới cả
  bracket gap (tới 2725 ms). Draw frame-cuối clip cũ (element tiến liên tục
  tới cuối file 3,0 s — hành vi hợp lệ của clip cũ) rơi vào giữa seekRel nội
  suy và bước nhảy thật → bị gán nhầm thành draw stale sau biên. Bằng chứng
  quyết định: **draw đầu tiên SAU mẫu state100 đầu tiên qua biên luôn đúng
  ct ở cả 8 ca** (vd k=3: draw 18395 ct=0,333 sau mẫu 18028 ph=9,33).
  Bracket gap của 8 ca: 908 / 798 / 2725 / 225 / 1172 / 194 / 1655 / 1621 ms
  (E4: max 508 ms) — 2 ca bracket nhỏ (225/194 ms) vẫn là (A) vì draw rơi
  trong cửa sổ không chắc của bước nhảy (draw +6 ms sau seekRel nhưng +31 ms
  sau mẫu tiền-biên cuối; bước nhảy thật không xác định được chính xác hơn
  bracket).
- **(C) — 1 ca k=7 f4y2 (main-draw danh nghĩa duy nhất):** element chạy tiếp
  0,233→0,586 trong khi playhead bị R2 hold ở 21,23 → drift **+0,356 s**,
  vượt ngưỡng re-seek 0,35 đúng **6 ms** — trong sai số nội suy (bracket
  1172 ms). Đây là drift-trong-hold, không phải stale leftover (ct cũ
  2,4–3,0). Không tính là draw stale xác nhận.
- **Kết luận §4: draws stale xác nhận 0/46; main-canvas stale xác nhận 0/46.**
  Gate (b) đường vẽ vẫn đứng trên cây hiện tại theo mọi bằng chứng đã giám định.

### 4.3 Đề xuất cho đợt sau (phương pháp)

Draws-check chỉ tin biên có **bracket gap ≤ 300 ms**, hoặc yêu cầu draw nằm
sau mẫu state100 đầu tiên qua biên (không dùng seekRel nội suy khi bracket
lớn). Nếu không, dưới tải nặng check này cho false-positive tới ~17% (8/46
ở đây) và sẽ báo động giả về hồi quy gate (b).

## 5. Dị thường đã ghi (không giấu)

1. **Reboot #29 ~08:56:39Z** (boot `8c1c5131` → `cff65e89`) giết f4y3
   (pause-burst) ngay lúc bắt đầu — không có dữ liệu f4y3. 2 lượt y1/y2 đủ
   cho kết luận zombie; f4y3 chỉ là biến thể pause-burst, C5 R4 đã đo
   pause-burst 0/12.
2. **f4y2 `lastFrame` 98–115** (c2 98, c6 94, c8 104, c10 98, c12 115, c14 113,
   c16 92, c22 92): **KHÔNG phải pump capture vượt clip** — pump events
   frameIdx>89 = 0 cả 2 lượt; media dài đúng 3,000 s. `dbg.lastFrame` nay là
   frame **RELABEL của F3** (`f3RelabelFrameIndex`, `preview.tsx:2036`) —
   nhãn anchor, không còn là media frameIdx thô; không so sánh trực tiếp
   được với pre-104 (E4: lastFrame 53–81). Caps frameIdx=90 (ct=3,0 đúng
   cuối file): 4 (f4y1) + 1 (f4y2) — end-frame, khớp §4.
3. **f4y1 c0 `no-callback`, caps=0** — pump chết bởi watchdog trước biên đầu
   (load 20). Không ảnh hưởng kết luận (11/12 biên còn lại đủ).
4. **Driver seek-across bắn 2/23 + 0/23** (§1) — dữ liệu F4 yếu với câu hỏi
   seek-across; kết luận zombie ở đây chủ yếu là đường tick-by-tick dưới tải.
5. **Không chạy probe live mới** (§0): RAM khả dụng ~518 MB lúc bắt đầu,
   8–10 luồng song song; probe Chromium mới sẽ còn thưa hơn f4y1 và không
   thêm thông tin. Ghi rõ, không retry.
6. E3 marker biến mất (E4 đã ghi đợt 103) — G2 không kiểm lại, ngoài phạm vi
   zombie; E9 phụ trách.

## 6. Hồi quy cây hiện tại (md5 ca378bbf, chạy lại bởi G2)

- `npx tsc --noEmit` (web): **0 lỗi**.
- `npx vite build`: **PASS** (14,74 s).
- Suites (`round105-g2-run-suites.sh`, copy mẫu E4): Hold **75/75**,
  Pacing54K9 **19 pass, 0 fail**, previewEngine **27**, seek **21**,
  seekSkip86N3 **9/9**, previewLoop **20**, ghostBlend **15 kiểm chứng xanh**,
  rvfcClipWindow102D3 **21**, driftConfirmSkip103E4 **12/12 PASS**,
  `test-preview-engine.sh` **354 assertions pass**. Tất cả exit=0.
- `node --check` probe104f4: **PASS**.
- Không sửa production trong luồng này (0 file production đổi) nên không có
  suite nào quy cho G2 ngoài hồi quy trên.

## 7. Nợ mở (cho đợt sau, không làm trong luồng này)

1. **Gate (b) freeze trong khi playhead chạy tự do — vẫn chưa quan sát được
   (nợ F4 gốc).** Cần lượt máy yên + state100 dày (bracket ≤300 ms) + đủ
   23/23 cú seek-across thật (driver poll cần cửa sổ rộng hơn hoặc poll
   nhanh hơn dưới tải). Không đóng, không bác.
2. **Độ trễ kill trực tiếp trên cây hiện tại chưa đo lại** (chỉ 2 cú driver
   seek, không khớp kill entry — §2 E4b). Số E4 (median 0,10–0,20 ms) vẫn
   đứng theo code không đổi.
3. **Draws-check cần guard bracket** (§4.3) trước khi dùng lại dưới tải nặng.
4. **f4y3 pause-burst chưa chạy lại** (reboot giết) — không cấp thiết
   (C5 R4: pause-burst 0/12).
5. Nợ chung đợt 104 §4 (G1, 2 MiB, ghost F8b, re-arm F5 chờ A/B RAM cao,
   blur r7, EPERM probe #24, birefnet, TTS 39 CẤM kiểm lại, ci-security.yml
   403, release gate) — không thuộc G2.

## 8. Kiểm chứng + batch đã stage (KHÔNG push)

- Harness (F4 tạo, G2 stage): `apps/web/scripts/probe104f4-frame-parity.mjs`
  (kế thừa probe103e4 + state100 ghi thêm `watchN`/`tailN`; diff chỉ header
  + 3 dòng; `node --check` PASS).
- Analyze mới (G2, tại `hidden_files/round105-g2/`, không vào batch repo):
  `round105-g2-analyze.py` (copy analyze-post E4, đổi thư mục → round104-f4),
  `round105-g2-draws-check.py` (+ `round105-g2-draws-check-e4.txt` tái hiện
  0/23 E4 + `round105-g2-draws-check-f4.txt`),
  `round105-g2-adjudicate.py` + `.txt`, `round105-g2-bracket.py` + `.txt`,
  `round105-g2-stale-draws.py`, `round105-g2-drawsgap.txt`,
  `round105-g2-freeze.txt`, `round105-g2-analysis.txt`,
  `round105-g2-run-suites.sh` + `round105-g2-suites.log`, `round105-g2.md`
  (log luồng).
- Dữ liệu thô F4: `hidden_files/round104-f4/` (không đổi, chỉ đọc).
- Batch stage: `phase9-round105-g2-zombie.txt` — **2 entry** (chỉ file text
  trong cây repo, read-back OK, 0 binary, 0 workflow):
  - `apps/web/scripts/probe104f4-frame-parity.mjs`
  - `docs/PHASE9_ROUND105_G2_ZOMBIE_LIMITS.md` (file này)
