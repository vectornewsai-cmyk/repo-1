# Phase 9 đợt 42, luồng X5 — Probe v2: bằng chứng runtime chuỗi solo → Q6 → N2 + stress trần 1000 mẫu — LIMITS

Ngày: 04/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo,
KHÔNG tự stage batch paths-loop (parent gộp). Luồng này CHỈ sửa
file probe/runner + test của riêng nó (xem §6) — không sửa logic
luồng khác, không sửa probe trang v2, không sửa harness N2, không
sửa cổng solo, không đổi ngưỡng A/B nào.

Đọc trước: `docs/PHASE9_ROUND41_LIMITS.md` §5.6,
`docs/PHASE9_ROUND41_W5_PROBE_V2_LIMITS.md`,
`docs/PHASE9_ROUND40_V1_SOLO_PERSEEK_LIMITS.md`.

## 0. Kết luận ngắn

1. **Nợ §5.6 nửa (a) ĐÃ ĐÓNG ở mức chuỗi probe (không phải phiên
   solo A/B).** Lần đầu tiên cờ `N2_PERSEEK=1` được chứng minh
   bằng runtime chảy qua đủ 3 tầng solo → Q6 → N2: script chuỗi
   mới dùng đúng `buildProbeEnv` + `extractPerSeekReport` của
   solo runner, spawn Q6 thật, Q6 spawn N2 headed thật, và
   `perSeekProbe.status = present` ở đầu ra tầng solo (32 entry,
   validate 32/32 sạch). Trước đợt này, V1 chỉ có unit/audit
   và W5 chỉ chạy N2 trực tiếp.
2. **Tầng Q6 ghi `absent` — ĐÚNG THIẾT KẾ, không phải lỗi chuỗi.**
   `q6-labeled.json` không có trường `perSeek` (nợ V1 §4.3 vẫn
   mở: Q6 chưa mang perSeek sang labeled). Bằng chứng Q6 truyền
   cờ không nằm ở labeled mà nằm ở tầng dưới: N2 đọc được cờ
   (`install=installed gopSec=10`) và trả 32 entry — nếu Q6 làm
   mất cờ thì N2 đã tắt probe và soloReport đã là `absent`.
3. **Trần 1000 mẫu ĐÃ ĐƯỢC THỬ THÁCH (pure logic, không browser).**
   1200 tick seeking: giữ đúng 1000 mẫu đầu (dãy decoded
   1..1000 liên tục), đếm đúng 200 mẫu tràn vào
   `droppedSeekingSamples`, không crash, entry vẫn chốt
   `completed` bình thường sau trần. Hành vi ở trần là
   **cắt + đếm tràn** (không đóng băng vòng probe, không mất
   mẫu cũ lặng lẽ: giữ + đếm = 1200 = tổng tick).
4. **KHÔNG kết luận gì về cổng solo, KHÔNG khóa ngưỡng, KHÔNG
   thêm nhãn cơ chế.** Lượt chuỗi là under-load, verdict N2
   PARTIAL (như W5); mẫu `flat` vẫn 0 lần trên Chrome thật;
   mẫu stall sau seeked kiểu k=22 của W5 KHÔNG tái hiện trong
   lượt này (k=22 lần này là rising) — càng củng cố quyết
   không thêm nhãn của W5 §4.

## 1. Chuỗi probe thật đã chạy (tham số thật)

- Lệnh (từ gốc repo, scratch/display/port riêng để khỏi đụng
  các luồng đợt 42 khác):
  `N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10 node
  apps/web/scripts/per-seek-probe-chain-run.mjs --fixture
  ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 --scratch
  /tmp/round42-x5/chain1 --display :99 --port 4199`
- Thời gian: 04/11/2026 02:10–02:11 +07 (19:10–19:11 UTC ngày
  03/11). Thời lượng lượt ≈ 58 s (từ log N2).
- Fixture: sparse-gop-noise.mp4 (1280×720, 30 s, 30 fps, GOP
  300 — cùng fixture W5). Bundle đóng băng: dist trên đĩa lúc
  > [Đính chính Z5 04/11/2026 — KHÔNG xoá dòng gốc] Nhãn "GOP 300"
  > trên là SAI về GOP hiệu dụng: file này đặt -g 300 nhưng scenecut
  > chèn keyframe mỗi 30 frame (hộp stss: 30 mục, cách nhau đúng 30
  > frame — đo lại Z5, xem docs/PHASE9_ROUND44_Z5_PROBE_LIMITS.md).
  > Kết luận CHAIN-OK của X5 không phụ thuộc GOP nên vẫn đứng.
  chạy được copy vào scratch của luồng
  (`chain1/frozen-dist`, bundle `index-BYY2c2Ob.js`,
  manifest `66178302…`, Q6 kiểm tra frozenDist **VALID**,
  problems `[]`) — nên luồng khác build lại `apps/web/dist`
  giữa lượt cũng không làm lệch lượt này.
- Chrome: `/opt/meta-chromium/chrome` headed qua Xvfb `:99`
  (harness N2 tự bật Xvfb, như W5).
- Điều kiện tải — ghi rõ để khỏi đọc thành quiet: load lúc
  bắt đầu `1.36`, trước phát xuôi `1.33`, trước phát ngược
  `1.44`, cuối lượt `1.11`. Đây là lượt probe chạy cùng các
  luồng đợt 42 khác → **under-load**, cấm trích làm baseline
  quiet hay claim fps sản phẩm.
- Kết quả N2: exit 1, verdict **PARTIAL** (giống W5):
  fps ngược 0,43 (draw 10 / wall 23,30 s), tốc độ xuôi nội suy
  0,329, Q6 loadLabel `under-load`.

### 1.1 Bằng chứng perSeekProbe ở từng tầng (đọc từ evidence JSON)

| Tầng | Bằng chứng runtime | Trạng thái |
|---|---|---|
| Solo runner (env) | `buildProbeEnv` trả về giữ nguyên `N2_PERSEEK=1`, `N2_PERSEEK_GOP_SEC=10`, đủ 6/6 khóa `Q6_*` (`Q6_DISPLAY=:99`, `Q6_PORT=4199`, `Q6_DIST=<scratch>/frozen-dist`) | cờ đi qua, không mất, không tự sinh |
| Q6 gate | Q6 exit 1 (do N2 exit 1, không phải lỗi Q6), labeled ghi được, `frozenDist VALID`; **không có trường `perSeek` trong `q6-labeled.json`** | `absent` by design (xem §1.2) |
| N2 harness | Log N2: `probe per-seek: defined=defined install=installed gopSec=10`; `perSeek: 32 entries (reverse 11), counts={unresolved:12, completed:13, superseded:7}, summaryReverse={mixed:10, undetermined:1}`; `forward-hold.json`: `perSeekEnabled=true`, `version=per-seek-v2`, `gopSeconds=10`, `droppedOverflow=0` | `present` |
| Solo report | `extractPerSeekReport(raw)` — đúng hàm `runOneVariant` dùng — trả `status=present, entryCount=32`, validate 32/32 sạch (0 problem) | `present` |

Evidence đầy đủ (không vào repo): `/tmp/round42-x5/chain1/
probe-chain-evidence.json`; log N2 `/tmp/round42-x5/chain1/
q6-n2.log`; forward-hold `/tmp/round42-x5/chain1/
forward-hold.json`.

### 1.2 Vì sao tầng Q6 `absent` mà chuỗi vẫn CHAIN-OK

Q6 (`probe-round34-q6-measure-protocol.mjs`) spawn N2 bằng
`env = { ...process.env, N2_SCRATCH, K4_VIDEO, … }` — nó
không ghi đè, không xóa `N2_PERSEEK`, và cũng không copy
`perSeek` từ forward-hold sang labeled (labeled chỉ pick field
cũ — đúng nợ V1 §4.3). Vì vậy:

- `absent` ở labeled là **thiếu trường mang bằng chứng**,
  không phải bằng chứng cờ bị mất: nếu Q6 làm mất cờ, N2 đã
  không install probe và soloReport đã là `absent`.
- Chuỗi được kết luận CHAIN-OK theo tiêu chí đặt trước trong
  script: `soloReport.status === "present"` VÀ
  `perSeekEnabled === true` ở forward-hold. Tiêu chí này ghi
  rõ trong evidence (`chainVerdict`), không suy diễn thêm.

### 1.3 Đối chiếu với thiết kế V1 (bảng §2 của V1, nay có runtime)

| Tầng (V1) | V1: bằng chứng cũ | X5: bằng chứng mới |
|---|---|---|
| solo → Q6 | unit test `buildProbeEnv` giữ cờ | **runtime**: cùng hàm đó, trong cùng lượt spawn, env giữ cờ + đủ 6 khóa `Q6_*` |
| Q6 → N2 | audit code (`...process.env`, không ghi đè cờ) | **runtime gián tiếp**: N2 install probe thành công với `gopSec=10` đúng giá trị đặt ngoài solo — cờ chỉ tới được N2 qua env Q6 truyền |
| N2 đọc cờ | audit dòng `PERSEEK_ENABLED = process.env.N2_PERSEEK === "1"` | **runtime**: log install + 32 entry thật |
| solo đọc lại | fixture tổng hợp qua `extractPerSeekReport` | **runtime**: forward-hold thật của lượt qua cùng hàm → `present, entryCount 32` |

### 1.4 Đối chiếu với phiên W5 (cùng fixture, cùng cờ, khác đường chạy)

- Giống: 32 entry, reverse 11, unresolved 12 (11 thumbnail-strip
  + 1 entry phát chính k=31 bị cắt bởi `read()` cuối phiên —
  kiểm tra lại bằng elementId: unresolved gồm đúng 12 id
  0,1,2,3,5,6,7,8,9,10,11,4; k=31 là id 4 duy nhất).
- Khác: W5 completed 10 / superseded 9 / seeked-no-draw 1;
  X5 completed 13 / superseded 7 / seeked-no-draw 0 — lượt
  này ít seek bị đè hơn (tải khác, không phải thay đổi code).
- Reverse đã hoàn tất: W5 có 9 entry (k=22–30); X5 có 10
  (k=21–30), **cả 10 đều `rising`** qua `analyzeSeekingSamples`
  (delta 5–32, `decodedDeltaToFirstDraw = 0`, drawLat 0–349 ms
  — k=21 drawLat 349 ms nhưng decoded đã tăng xong trong lúc
  seeking nên vẫn thuộc phía seek theo logic W5 §3.1).
  Mẫu stall sau seeked kiểu k=22 của W5 (seek 19,7 ms, draw
  trễ 6700,7 ms) **không tái hiện**: k=22 lần này seek
  2464 ms, draw 0 ms, rising delta 29.
- Mẫu `flat`: vẫn **0 lần** (cả 10 reverse completed đều
  rising; toàn phiên max 42 mẫu/entry, `droppedSeekingSamples`
  toàn 0) — trần 1000 không bị chạm trong lượt headed này,
  đúng như W5 dự báo (seek dài nhất ~3,5 s).

## 2. Stress trần 1000 mẫu (pure logic, vm fake — KHÔNG browser)

Lý do dùng pure logic: trần là logic thuần trong
`per-seek-probe-page.js` (`pushSeekingSample`: đủ 1000 thì
tăng `droppedSeekingSamples`, không push thêm). Seek kẹt
> 16 s trên Chrome thật chưa từng quan sát được (W5 §5.3),
  nên ép trần bằng browser thật đồng nghĩa bịa một seek kẹt
  20 s — mô phỏng vm với 1200 tick rAF là cách thử thách đúng
  tầng logic mà không mạo nhận số Chrome.

- **1200 tick seeking (≈ 20 s ở 60 fps):** giữ đúng 1000 mẫu,
  `droppedSeekingSamples = 200`, dãy giữ là decoded 1..1000
  liên tục (mẫu đầu = tick 1, mẫu cuối được giữ = tick 1000,
  không phải tick 1200) → mẫu cũ không bị ghi đè, không mất
  lặng lẽ; giữ + đếm = 1200 = tổng tick, mọi mẫu đều có dấu
  vết. `analyzeSeekingSamples`: sampleCount 1000, dropped 200,
  progress `rising`. Sau trần, seeked + draw tick → entry
  chốt `completed`, mẫu và số đếm giữ nguyên.
- **Biên trần:** đúng 1000 tick → dropped 0; tick 1001 →
  dropped đúng 1, vẫn giữ 1000.
- **Trần theo entry, không toàn cục:** entry đầu tràn 5 mẫu
  rồi chốt completed; entry thứ hai sau đó vẫn được cấp lại
  đủ 1000 (10 tick → 10 mẫu, dropped 0) — trần không làm
  liệt probe cho các seek sau.
- **Validate:** mọi entry trong các test trần đều
  `validatePerSeekEntry` sạch — số đếm tràn không phá
  tính hợp lệ của entry.

## 3. Lỗi gặp trong lượt và cách sửa (trung thực)

- **Lỗi đường dẫn REPO ở script chuỗi mới (bắt trước khi đo).**
  Lần chạy đầu chết ngay ở bước copy frozen dist:
  `lstat '…/apps/apps/web/dist'` — `path.resolve(dirname,
  "../..")` từ `apps/web/scripts/` chỉ lên tới `apps/`, đúng
  lỗi đợt 38 mà LIMITS V1 đã ghi chú (2 lần `".."` → REPO
  sai). Sửa thành 3 cấp `"..", "..", ".."` + comment cảnh
  báo trong file; chạy lại từ đầu, lượt đo sạch là lượt thứ
  hai (evidence `runAt 19:11 UTC`). Không số đo nào từ lần
  chạy lỗi được dùng (nó chết trước khi spawn Q6).
- Không lỗi nào khác: Q6 frozenDist VALID, N2 install probe
  ngay lần đầu, không phải sửa probe/harness/solo runner.

## 4. Kiểm chứng đã chạy (lệnh + số thật)

- `node --check apps/web/scripts/per-seek-probe-chain-run.mjs`
  → pass.
- `node --test apps/web/scripts/per-seek-probe.test.mjs` →
  **21/21 pass** (18 cũ — 10 T2 + 8 V6 — + 3 mới X5 §2).
- Hồi quy runner/cổng (không sửa, chỉ chạy lại):
  `node --test apps/web/scripts/seek-ab-solo-run.test.mjs` →
  16 pass; `node --test apps/web/scripts/seek-ab-gate-v3.test.mjs`
  → 13 pass. **Tổng 3 file: 50 pass, 0 fail.**
- Chuỗi probe thật §1: CHAIN-OK (tiêu chí §1.2), evidence
  JSON đã ghi.
- Không chạy: `tsc` / `vite build` (luồng không sửa TypeScript
  hay code sản phẩm — chỉ script `.mjs` đo lường; dist dùng
  là dist sẵn có trên đĩa, copy nguyên vẹn làm frozen-dist).

## 5. Cái gì CHƯA làm (nợ còn lại — không mạo nhận)

1. **Phiên solo A/B thật vẫn chờ cửa sổ yên ~20–40 phút từ
   main chat** (nợ gốc T1, giữ nguyên). Lượt X5 chỉ chạy
   ĐƯỜNG CODE của một lượt probe, không chạy
   `runOneVariant` trực tiếp: hàm đó không export, lại đòi
   cổng yên + dist đóng băng khớp `SOLO.expectedBundle` +
   fixture sha — tức đúng phiên solo thật bị cấm ở đây.
   Phiên solo thật vẫn phải kiểm tra `perSeekProbe.status`
   ở lượt đầu trước khi chạy tiếp (nay đã có bằng chứng
   chuỗi rằng lượt đầu đó sẽ ra `present` khi cờ bật).
2. **Q6 labeled vẫn chưa mang perSeek** (V1 §4.3): tầng Q6
   vẫn `absent` trong labeled; muốn labeled mang bằng chứng
   cơ chế cần copy tường minh — để luồng sở hữu Q6 quyết,
   không thuộc X5.
3. **Trần 1000 trên Chrome thật vẫn chưa chạm** (seek kẹt
   > 16 s chưa từng quan sát): test X5 chứng minh logic
   trần đúng, không chứng minh Chrome thật sẽ kẹt đủ lâu
   để chạm trần — hai claim khác nhau, không được gộp.
4. **Nhãn cơ chế:** không thêm nhãn mới (flat vẫn 0 lần;
   mẫu stall k=22 của W5 không tái hiện nên quy tắc §4.3
   của W5 vẫn ở trạng thái ứng viên, chờ phiên quiet).
5. **Nợ đứng chung:** Safari / máy thật / footage B-frame /
   đường WebCodecs (probe mù) — vẫn chưa đo.

## 6. File đổi/thêm (chỉ của X5 — text, không binary, không dist)

- MỚI: `apps/web/scripts/per-seek-probe-chain-run.mjs`
  (script chuỗi probe 3 tầng, ghi `probe-chain-evidence.json`
  vào scratch ngoài repo; không tự chạy phiên solo A/B).
- Sửa: `apps/web/scripts/per-seek-probe.test.mjs` (+3 test
  trần 1000: 1200 tick, biên 1000/1001, trần theo entry;
  không sửa kỳ vọng test cũ nào).
- MỚI: `docs/PHASE9_ROUND42_X5_PROBE_CHAIN_LIMITS.md`
  (file này).
- Không sửa: probe trang v2, module phân tích, harness N2,
  probe Q6, solo runner, cổng v2/v3, code sản phẩm,
  paths-loop, build-loop-log. Không push, không tag, không
  stage batch (theo lệnh luồng). Scratch ngoài repo (không
  stage): `/tmp/round42-x5/` (chain1 + chain1.log +
  evidence JSON).
