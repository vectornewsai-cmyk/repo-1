# PHASE9_ROUND97_Y7_ZOMBIE_PUMP_LIMITS — kill pump khi clip đổi

> Luồng Y7, đợt 97. Lượt cron 18:35 +07 12/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> Nợ: LIMITS gộp đợt 96 §4 mục 11 / X5 §6 (zombie pump).
> Boot mới 11:30:25Z (reboot #19) trước lượt. RAM khả dụng 664–2772 MB trong lượt.

## 0. Tóm tắt verdict

**ĐÃ SỬA + ĐÃ ĐO — zombie gần như triệt tiêu.** Kill pump clip cũ ngay khi
clip kế khẳng định pump trên cùng element (`rvfcKillZombiePumpsOnElement`,
lý do `"clip-change"`). Zombie capture mỗi lần đổi clip: **+27 → 0 / 0**
(lượt fix1) và **0 / +1** (lượt fix2 xác nhận) — giảm ~98–100% so với
baseline. Thống kê theo clip hết phồng: dbgFinal caps c0 55→19, c1 75→19
(fix1); c0 46, c1 27 (fix2, own-only). Không mất frame đầu clip mới ở mức
đo được (ring fill +97–221ms sau mốc đổi clip thật, xem §4; pixel parity
giữ nguyên ở tâm các dải, xem §3). Không sửa vùng blend (Y2), drift/re-seek
(Y4), watchdog (Y5).

## 1. Cơ chế + phương án đã chọn

MediaPool tái dùng cùng element cho clip kế; pump clip cũ không biết clip
đã đổi nên capture frame clip kế vào ring clip cũ cho tới ngưỡng stale
1500ms (X5 §6: ~40 frame, phồng caps ~40%). Code cũ (`ensureRvfcPump`)
chỉ kill pump khi CÙNG clipId mà element đổi — không xử lý cùng element,
khác clipId.

Phương án chọn — **kill-on-element-reuse** (kill pump ngay khi clip đổi,
hiểu theo nghĩa element đổi chủ): khi `ensureRvfcPump` khẳng định/tạo pump
cho clip B trên element E, kill mọi pump khác đang bám E. Lý do chọn thay
vì loại-khỏi-thống-kê: capture đã mang `pump.clipId` (sai chính ở đó);
muốn loại đúng phải có registry element→clip hiện tại cập nhật từ draw
path (ngoài vùng pump), phức tạp hơn mà không diệt được capture thừa.
Kill-on-reuse diệt tận gốc (không còn callback, không còn capture thừa)
và chỉ chạm vùng pump.

Triển khai (`apps/web/src/preview.tsx`, marker "Đợt 97 Y7" ×2):

- Helper mới `rvfcKillZombiePumpsOnElement(el, exceptClipId)` ngay trước
  `ensureRvfcPump`: duyệt `rvfcPumps`, kill pump khác clipId + cùng
  element + còn active (bỏ qua pump đã chết sẵn); `rvfcKillPump(id,
  "clip-change")` (huỷ callback đang chờ) + xoá khỏi map + xoá khỏi
  `rvfcDeadClips` để clip cũ nếu phát lại vẫn tạo pump mới (mirror đường
  element-change) — trừ khi clip đó đã chết vì lý do khác trước đó
  (`wasDead`: giữ nguyên dead, không hồi sinh pump từng bị watchdog kill).
- 1 call site trong `ensureRvfcPump`, sau early-return silent-engine,
  trước mọi nhánh tạo/revive/re-affirm → bao phủ cả 3 đường.
- An toàn ping-pong: thứ tự vẽ theo timeline (clip cũ trước, clip mới
  sau) → trong 1 tick biên, clip mới tạo pump sau và kill pump cũ; tick
  sau clip cũ hết active nên không hồi sinh. Hai clip chồng lấn thời gian
  không thể chung 1 element (1 element chỉ phát 1 src) nên không có
  ping-pong kéo dài. Trường hợp xấu nhất nếu giả định sai: clip bị kill
  oan rơi về đường tick (hành vi tiền-rVFC), không vỡ pixel.
- `"clip-change"` không chạm memo engine im lặng (chỉ `"no-callback"`
  mới đếm) và ghi vào `dbg.rvfcFallback` để probe đọc được (bằng chứng
  kill đã bắn, xem §2).

Không sửa: `rvfcCallback` (stale 1500ms giữ nguyên làm lưới an toàn),
`rvfcWatchdogMiss` (Y5), blend (Y2), drift/re-seek (Y4).

## 2. Đo trước/sau (probe97y7, kế thừa probe96x5b: 3 clip × 3s, scroll-blur, Chromium)

| Chỉ số | baseline chr-blur-y7base2 (pre-fix) | fix chr-blur-y7fix | fix2 chr-blur-y7fix2 |
|---|---|---|---|
| Build preview.tsx | 2740ec30 (Y2+Y5) | a0a078e1 (Y7+Y4) | a0a078e1 |
| Load lúc phát / RAM khả dụng | 1,10 / 1791 MB | 0,77 / **664 MB** | 1,91 / 1158 MB |
| mtimeChanged / pageErrs | false / 0 | false / 0 | false / 0 |
| Zombie Δ caps c0 (state100) | **+27** (28→55) | **0** (19→19) | **0** (46→46) |
| Zombie Δ caps c1 (state100) | **+27** (48→75) | **0** (19→19) | **+1** (26→27) |
| dbgFinal caps c0/c1/c2 | 55 / 75 / 59 | 19 / 19 / 36 | 46 / 27 / 37 |
| dbgFinal lastFrame c0/c1/c2 | 40 / 41 / 87 | 89 / 89 / 89 | 89 / 2* / 88 |
| dbgFinal fb c0/c1/c2 | '' / '' / '' | clip-change / clip-change / '' | clip-change / clip-change / '' |
| Pump event skip-stale | 2 | 0 | 0 |
| Pump events (capture / skip-stale-frame) | 186 / 34 (n=225) | 74 / 17 (n=91) | 109 / 16 (n=129) |
| fbAt c0 / c1 (relPlay ms) | — | 3614 / 7047 | 4483 / 7820 |

\* fix2 c1 lastFrame=2: đúng 1 capture zombie sót (frame 2 của c2) trước
khi kill tới — xem §4. c1 own kết thúc ở frame 89 (state100: 26/89 tại
mốc đổi clip 7696), sau đó 26→27 và lastFrame lật về 2.

Đọc thêm:

- **Kill bắn đúng lúc đổi clip.** fix1: fbAt c0=3614 ≈ mốc đổi clip
  state100 3612 (+2ms); c1=7047 trong cửa sổ mốc đổi clip (7038–7138,
  state100 cadence 100ms). fix2: fbAt c0=4483 = đúng mốc 4483; c1=7820,
  ~124–224ms sau mốc 7696 (xem §4 về +1 sót).
- **lastFrame hết bị ghi đè.** Trước fix: c0/c1 lastFrame 40/41 = frame
  của clip KẾ (zombie). Sau fix (fix1): 89/89/89 = frame cuối clip của
  chính mình. fix2: c0 89, c2 88, c1 2 (1 zombie sót, xem trên).
- **Phồng thống kê theo clip: hết.** c0 caps 55→19 (−65%), c1 75→19
  (−75%) ở fix1 (cùng điều kiện so sánh trực tiếp: own ~28/~48 + zombie
  27). fix2: c0 46, c1 27 — own-only (c2 đối chứng nội bộ, không có clip
  kế: 59→36/37, chỉ dao động theo mật độ capture của lượt).
- **Tỉ lệ zombie/own:** trước fix 27/28 ≈ 96% (c0), 27/48 ≈ 56% (c1);
  sau fix 0–1 capture/lần đổi clip (≈0–4%).

## 3. Không hồi quy: pixel parity + test suite

- **Tâm các dải gStdRatio KHÔNG đổi** (baseline noblur W3, cùng cách tính
  X5b). Mean theo dải, base2 → fix → fix2:
  A 0.438–0.439 → 0.438–0.441 → 0.438;
  B 0.767–0.781 → 0.761–0.773 → 0.770–0.776;
  C 1.000–1.004 → 0.999–1.000 → 1.000–1.002;
  D 0.304 → 0.306 → 0.307.
  Blend window không đổi (đúng kỳ vọng: fix không chạm blend).
- **Tỉ lệ mix A/B dao động theo lượt** (fix1: c1 A 22%/B 61%; fix2: c1 A
  52%/B 39%, c2 A 64%/B 31%; base2: c1 A 75%, c2 A 92%). Đây là hiệu ứng
  tải đã biết (X5 §1.3: capture thưa → ring 2 snapshot → pair B thay vì
  triple A), không phải hồi quy của fix: cả hai lượt fix đều chạy chậm
  hơn baseline2 (playhead qua 3,0 ở relPlay 3612/4483 so với 3232;
  capture 74/109 so với 186; RAM lượt fix1 chỉ 664 MB). Tâm dải không
  đổi là bằng chứng pixel parity; mix chỉ phản ánh mật độ capture.
- **Test suite offline trên build đã sửa (ebace541, rồi tsc lại 0 trên
  cây gộp a0a078e1 sau edit Y4):** tsc web 0 lỗi; vite build PASS 8,03s;
  previewEngine 25/25; playheadHold90R2 50/50 (tăng từ 44 — Y4 thêm
  test, vẫn xanh); playheadPacing54K9 19/19; seek 21/21.
- Ghi chú harness: `test-preview-engine.sh` (compile CJS) LỖI SẴN
  `Cannot find module './previewClipKey62R6.ts'` — script cũ không theo
  kịp import `.ts` explicit trong `previewEngine.ts` (có từ trước đợt 96,
  không do Y7); chạy đúng cách như X9b
  (`node --experimental-strip-types .../previewEngine.test.ts`) thì 25/25.

## 4. Frame đầu clip mới — KHÔNG mất (trong nhiễu đo)

ringFirstAt so với mốc đổi clip THẬT (state100, không phải mốc danh nghĩa
3000/6000 — playhead các lượt đều lag):

| Lượt | c1 ring fill sau mốc | c2 ring fill sau mốc |
|---|---|---|
| base2 | +74ms | +111ms |
| fix1 | +192ms | +97ms |
| fix2 | +221ms | +169ms |

c1 chậm thêm ~118–147ms ở hai lượt fix, c2 −14/+58ms (trái dấu). Không
có bằng chứng hệ thống cho rằng fix làm mất frame đầu: (a) helper chỉ là
quét map (µs) trước khi tạo pump mới — không có cơ chế nào trì hoãn tạo
pump; (b) độ chậm tương quan với độ lag chung của lượt (playhead 0,67–
0,83× ở lượt fix so với 0,93× base2; RAM thấp); (c) lượng tử state100 là
±100ms nên chênh ~120ms nằm trong ~1,5× lượng tử; (d) minFrame sampler
(c1: 3, c2: 4–7 ở lượt fix so với 0 ở base2) là artifact sampler — tick
thưa dưới tải nhảy qua frame (c2 fix1: ring đã đầy ở +97ms NHANH HƠN
base2 +111ms nhưng minFrame vẫn là 7, chứng tỏ minFrame đo tick chứ
không đo ring). Pump vẫn capture từ ~frame 0–3 của clip mới; không có
frame nào của clip mới bị bỏ khỏi ring vì fix.

**Tàn dư 0–1 capture/lần đổi clip:** kill bắn ở lần khẳng định pump đầu
tiên của clip mới (tick đầu tiên vẽ clip mới với blur), tức ~0–224ms sau
mốc đổi clip thật; trong cửa sổ đó callback đang chờ của pump cũ có thể
bắn 1 lần (fix2 c1: đúng 1 capture frame 2 của c2 trước kill 7820).
Triệt tiêu hẳn cần kill ở draw path ngay khi phát hiện đổi clip (trước
khi khẳng định pump) — ngoài vùng pump, lợi ích chỉ 1 frame thống kê,
không làm.

## 5. Nợ còn lại

1. **Clip kế KHÔNG blur → zombie còn nguyên.** Clip kế không gọi
   `ensureRvfcPump` nên helper không chạy; pump cũ vẫn capture tới stale
   1500ms như cũ. Cần hook ở draw path / MediaPool (ngoài phạm vi luồng
   này) nếu muốn diệt hẳn.
2. **Tàn dư 0–1 capture/lần đổi clip** (xem §4) — kill gắn với lần khẳng
   định pump đầu tiên của clip mới, không phải mốc đổi clip tuyệt đối.
3. **Đo lặp khi yên hơn:** cả hai lượt fix đều chạy chậm hơn baseline2
   (playhead 0,67–0,83×; RAM 664/1158 MB so với 1791 MB) nên mix A/B và
   ringFirstAt còn nhiễu tải; tâm dải đã đủ để kết luận parity, nhưng một
   lượt fix yên (load <1, RAM >1,7 GB) sẽ chốt mix A/B về mức base2.
4. **Va chạm song song đợt 97 (đã ghi, không mất mát):** Y2/Y5 sửa
   preview.tsx 11:41:59Z + 11:47:48Z (md5 6cac637d → 9a9812e5 →
   b951a47d → 2740ec30) trong lúc Y7 đo baseline — baseline đầu
   chr-blur-y7base nhiễm tải nặng (load 15,00; 31 caps) đã LOẠI, chỉ dùng
   base2. Y4 sửa thêm 5 dòng 12:02:15Z SAU khi Y7 implement (ebace541 →
   a0a078e1); đã kiểm tra fix Y7 còn nguyên (marker + helper + call
   site) và tsc lại 0 trên cây gộp trước khi chạy probe hậu-fix. Probe
   nào cũng ghi mtimeChanged=false (không ai sửa file giữa lượt chạy).
   Bài học lặp lại: baseline phải đợi file ổn định + đo lại tsc sau mỗi
   lần sibling chạm file.

## 6. Kiểm chứng + batch đã stage (KHÔNG push)

- Harness: `apps/web/scripts/probe97y7-frame-parity.mjs` (copy
  probe96x5b, chỉ đổi scratch → round97-y7 + header) +
  `hidden_files/round97-y7-analyze.py` (mới: zombie Δ từ state100,
  dbgFinal, ringFirstAt, band gStd).
- Dữ liệu: `hidden_files/round97-y7/` — chr-blur-y7base (loại, nhiễm tải),
  chr-blur-y7base2, chr-blur-y7fix, chr-blur-y7fix2 (+ log driver, log test).
- Log luồng: `hidden_files/round97-y7.md`.
- Batch stage: `phase9-round97-y7-zombie-pump.txt` — 3 entry, read-back
  OK, 0 binary, 0 workflow:
  - `apps/web/src/preview.tsx`
  - `apps/web/scripts/probe97y7-frame-parity.mjs`
  - `docs/PHASE9_ROUND97_Y7_ZOMBIE_PUMP_LIMITS.md` (file này)
