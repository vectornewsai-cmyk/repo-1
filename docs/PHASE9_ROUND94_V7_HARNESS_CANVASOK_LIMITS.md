# Phase 9 đợt 94 — V7: Sửa tiêu chí canvasOk trong harness đo seek GOP

**Nợ gốc:** LIMITS đợt 93 U7 §7 mục 2 — probe Q5 `canvasOk` không phân biệt
khung mới tới vs khung cũ trùng đích (artifact trial 6 WebKit GOP30:
tCanvas=712 ms < tElement=2291 ms vì canvas kẹt khung t=1 từ trial 5).
**Ngày:** 2026-11-12 (lượt cron 09:35 +07; làm việc 02:41–02:52Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** ĐÃ XONG — tiêu chí mới đã sửa + chạy lại đủ 6 tổ hợp;
artifact đã bắt lại được ngoài đời (WebKit GOP250 trial 4) và bị loại đúng;
kết luận U7/T3 còn đứng.

## 1. Tiêu chí MỚI (đã sửa trong probe89q5-seek-latency.mjs)

**Cũ:** `canvasOk = darkN>0 && |darkCx − exp.cx| < 0.03` (+ ổn định 2 poll
liên tiếp trong 0.005). Khung cũ trùng đích → PASS nhầm ngay, tCanvas vô
nghĩa (có thể nhỏ hơn cả tElement).

**Mới:** thêm điều kiện `sawChange` — canvas phải ĐÃ ĐỔI khỏi baseline
trước seek (darkCx lệch ≥ **0.01** đơn vị canvas) rồi mới được tính là
khớp đích. `canvasOk = darkN>0 && sawChange && |darkCx − exp.cx| < 0.03`
(+ ổn định 2 poll như cũ).
- **Hiệu chuẩn ngưỡng 0.01 (đo thật, không đoán):** nhiễu ổn định giữa 2
  poll < 0.005 (dùng trong check stable); bước khung thật NHỎ NHẤT là
  t=0→t=1: darkCx 0.3544→0.4025, Δ=0.048. Ngưỡng 0.01 = 2× nhiễu nhưng
  ~5× nhỏ hơn bước thật nhỏ nhất. Mọi trial confirmed đợt này đều có
  `maxDevFromBase` = 0.1938–0.195 (đúng biên độ khung t=1↔t=5), tức cách
  ngưỡng 19× — không có trial nào suýt soát ngưỡng.
- Khung decode trung gian đi qua cũng tính là đổi — đúng vì nó chứng minh
  khung mới đã tới (khớp đích + ổn định sau đó mới xác nhận).
- Baseline không có vùng tối (darkN=0): khung tối đầu tiên xuất hiện tính
  là đổi (không gặp trong đợt này — mọi baseline đều có darkCx).
- **Verdict 3 loại** (ghi vào JSON mỗi trial): `confirmed` |
  `already-at-target` (canvas vốn trùng đích, không đổi trong 30 s — KHÔNG
  kết luận được khung mới có tới hay không; không tính confirmed, không
  tính stale, không tính vào median) | `stale-timeout` (canvas không tới
  đích trong 30 s).
- Ghi thêm mỗi trial: `changedMs` (lúc canvas đổi khỏi baseline lần đầu),
  `maxDevFromBase`, `sawChange`, `alreadyAtTarget`.
- Probe thêm `--scratch <dir>` để kết quả đợt 94 vào
  `hidden_files/round94-v7/` thay vì ghi đè số đợt 93.

## 2. Chạy lại đủ 6 tổ hợp với tiêu chí mới

Lệnh: `probe89q5-seek-latency.mjs --engine <chromium|webkit> --load
--trials 6 --clip <gop250|gop60|gop30> --tag gop<N> --scratch round94-v7`,
chạy tuần tự. Keyframe verify bằng ffprobe: GOP250 [0]; GOP60 [0,2,4];
GOP30 [0,1,2,3,4,5]. Mỗi tổ hợp 6 trial (3× t=5, 3× t=1 xen kẽ).

**Kết quả pause-seek (tElement / tCanvas, median ms, chỉ tính trial confirmed):**

| Engine | target | GOP 250 | GOP 60 | GOP 30 |
|---|---|---|---|---|
| Chromium | t=5 | 1081 / 1564 (3/3) | 602 / 625 (3/3) | 502 / 646 (3/3) |
| Chromium | t=1 | 580 / 680 (3/3) | 703 / 725 (3/3) | 588 / 911 (3/3) |
| WebKit | t=5 | 2920 / 3010 (2/3) | 1708 / 1917 (3/3) | 1098 / 1197 (3/3) |
| WebKit | t=1 | 2886 / 3005 (2/3) | 1715 / 2579 (2/3) | 1109 / 1197 (3/3) |

**Tổng: 33/36 confirmed + 1 already-at-target + 2 stale-timeout**
(đợt 93: 35/36 confirmed với tiêu chí cũ).

## 3. Trial nào đổi verdict so với 35/36 cũ — và tại sao

**Đổi do tiêu chí mới (1 trial):**
- **WebKit GOP250 trial 4 (t=1) → `already-at-target`** (đợt 93: không có
  trial nào ở GOP250 bị vậy). Trial 3 trước đó stall: element tới t=5 sau
  3235 ms nhưng canvas kẹt khung t=1 (darkCx=0.4025) suốt 30 s deadline
  (`sawChange=false`, `maxDev=0`). Trial 4 seek về t=1: element tới sau
  1138 ms, canvas vẫn là khung t=1 cũ, không đổi lần nào trong 30 s.
  Tiêu chí CŨ sẽ PASS nhầm trial này với tCanvas ≈ 100 ms (khớp ngay từ
  poll đầu) — đúng y pattern artifact trial 6 WebKit GOP30 đợt 93.
  Tiêu chí MỚI từ chối xác nhận: không có bằng chứng khung mới tới.
  Đây là lần bắt sống artifact ngoài đời, chứng minh bản sửa hoạt động.

**Không đổi verdict do tiêu chí, nhưng số tCanvas đợt 93 là vô nghĩa (1 trial):**
- **WebKit GOP30 trial 6 (t=1):** đợt 93 tCanvas=712 ms < tElement=2291 ms
  (bogus). Đợt này trial 5 KHÔNG stall (confirmed tE=1331/tC=1710) nên
  trial 6 đo được thật: tE=1300, tC=1705, `changedMs=1300`,
  `sawChange=true` — khung mới tới đích đàng hoàng. Verdict confirmed giữ
  nguyên nhưng con số lần này mới có nghĩa.

**Không-confirmed nhưng KHÔNG phải do tiêu chí mới (2 trial — tiêu chí cũ
cũng sẽ không-confirmed vì canvas không bao giờ khớp đích):**
- **WebKit GOP250 trial 3 (t=5) → `stale-timeout`:** element tới t=5 sau
  3235 ms, canvas kẹt khung t=1 suốt 30 s (`maxDev=0`).
- **WebKit GOP60 trial 6 (t=1) → `stale-timeout`:** element tới t=1 sau
  902 ms (keyframe t=0, chỉ decode 30 frame), canvas kẹt khung t=5
  (darkCx=0.5963) suốt 30 s (`maxDev=0`).
- Cả hai đều là stall canvas > 30 s trong khi element đã tới đích — xem §4.

**Không đổi (Chromium cả 3 GOP 18/18 confirmed; WebKit GOP30 6/6):** mọi
trial đều `sawChange=true`, `changedMs` ghi được, `maxDev` 0.1938–0.195.
Tiêu chí mới không gây false negative nào ở Chromium.

## 4. Kết luận U7/T3 còn đứng không — CÒN ĐỨNG, có thêm bằng chứng

**Kết luận 1 (U7) — latency pause-seek phụ thuộc GOP: CÒN ĐỨNG.**
Thứ tự t=5 (xa keyframe nhất) giữ nguyên cả 2 engine, cả 2 đợt:
Chromium 1081 → 602 → 502 ms (2,2×); WebKit 2920 → 1708 → 1098 ms
(2,7×). So với đợt 93 (Chromium 1704→1087→805; WebKit 4502→2185→1202),
thứ tự giống hệt, chỉ số tuyệt đối nhanh hơn — xem caveat tải ở §5.
- t=1 ít phụ thuộc GOP như đợt 93 đã nói (chỉ cách keyframe t=0 có 30
  frame ở mọi GOP): thứ tự t=1 KHÔNG ổn định giữa 2 đợt (Chromium đợt 93:
  698/814/495; đợt này: 580/703/588 — GOP250 nhanh nhất, GOP60 chậm
  nhất). Đây là nhiễu tải với n=3, không phải hiệu ứng GOP — đúng như
  đợt 93 kết luận "t=1 ít phụ thuộc hơn".

**Kết luận 2 (T3) — stall canvas không do GOP (CPU/pipeline đói): CÒN
ĐỨNG, thêm 2 bằng chứng độc lập.**
- WebKit GOP250 trial 3: clip GOP thưa nhất, element đã decode xong tới
  t=5 (3235 ms) nhưng canvas kẹt khung cũ > 30 s.
- WebKit GOP60 trial 6: element tới t=1 chỉ sau 902 ms, canvas kẹt khung
  t=5 > 30 s.
- Cả hai stall đều ở phase trình chiếu SAU KHI element đã tới đích, trên
  2 GOP khác nhau — không thể giải thích bằng mật độ keyframe. Đúng cơ
  chế T3 §1.1 (frame trình chiếu tụt sau currentTime dưới tải).
- Thêm số đo mới: `changedMs` (lúc canvas bắt đầu đổi) thường bằng đúng
  `tElementMs` (cùng poll 50 ms), nhưng có lúc canvas trễ element tới
  ~680 ms (Chromium GOP30 trial 4: changedMs 1021 vs tE 588; WebKit GOP60
  trial 4: 2396 vs 1715) — độ trễ trình chiếu là đại lượng riêng, tách
  biệt với latency decode của element.

## 5. Caveat (trung thực)

- Số tuyệt đối KHÔNG so được ngang phiên (đã cảnh báo từ đợt 93): đợt
  này nhanh hơn đợt 93 rõ rệt ở mọi ô (vd WebKit GOP250 t=5: 4502→2920
  ms; Chromium GOP250 t=5: 1704→1081 ms). Tải ambient khác nhau giữa các
  lượt (loadavg lúc chạy: 0.55–14.25; VM vừa reboot 6 phút trước lượt).
  Chỉ thứ tự GOP trong cùng phiên + verdict từng trial là kết luận vững.
- n=3 mỗi target mỗi tổ hợp — mẫu nhỏ; dao động giữa các trial lớn.
- Chỉ 1 clip (720p, 6 s, cùng hình học bóng), 1 cửa sổ tải; không suy ra
  cho clip dài/4K/codec khác.
- Median tCanvas WebKit GOP250/GOP60 t=1 chỉ tính trên 2 trial confirmed.
- Ngưỡng đổi 0.01 hiệu chuẩn trên clip bóng này (bước khung nhỏ nhất
  0.048). Clip khác (chuyển động chậm hơn / vùng tối nhỏ hơn) có thể cần
  hiệu chuẩn lại — probe không tự hiệu chuẩn ngưỡng theo clip.
- `already-at-target` tốn trọn 30 s deadline mỗi lần (trial chờ đủ 30 s
  mới kết luận) — chấp nhận được với n=6, nhưng nếu thiết kế trial xen kẽ
  dày hơn thì nên rút deadline cho trường hợp này.

## 6. Sự cố chạy (ghi trung thực)

- **Chromium GOP250 lần 1 fail (rc=2, Xvfb không lên sau 3 lần thử):**
  display :194 bị luồng song song khác (đợt 94) chiếm giữa lúc picker
  kiểm tra và lúc spawn — race điều phối display :193–:197 khi nhiều
  luồng chạy probe cùng lúc (picker chỉ kiểm tra socket, không có lock
  giành quyền). Không phải lỗi tiêu chí mới. Chạy lại sau khi dọn socket
  + lock mồ côi của :193/:195 (PID đã chết, xác nhận bằng `ps` trước khi
  xóa) thì PASS 6/6.
- Không gặp sóng EPERM (vite lên lần đầu mọi lượt; wave-wait qua ngay).
- Không process/scratch mồ côi của luồng này: mọi probe tự tắt
  bridge/vite/Xvfb/browser cuối lượt; `yes` của probe tự kill theo PID
  (kiểm tra cuối lượt: 0 tiến trình probe89q5 còn chạy).

## 7. Kiểm chứng

- `node --check` probe89q5-seek-latency.mjs sau sửa: **pass**.
- Không đụng code TS (`src/` không đổi) → không cần tsc/vite build lại;
  không đụng `seek.test.ts` (brief: chỉ sửa khi số đo mới chứng minh phải
  sửa — không có số đo nào như vậy; T1/T2 vẫn như kết luận đợt 93 U7 §2:
  0 flake trong 60 lần, không sửa).
- Probe Q5 6 tổ hợp: **33/36 confirmed + 1 already-at-target + 2
  stale-timeout**; mọi trial confirmed đều có `sawChange=true` +
  `maxDev` 0.1938–0.195; **0 trial có tCanvas < tElement** (đợt 93 có 1
  trial như vậy — artifact đã hết).
- Không sửa production (không đụng `src/`, không đụng TTS 39, không đụng
  `.github/workflows`).

## 8. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/probe89q5-seek-latency.mjs` — tiêu chí canvasOk mới
  (sawChange ≥ 0.01), verdict 3 loại, trường changedMs/maxDevFromBase,
  `--scratch`.
- `docs/PHASE9_ROUND94_V7_HARNESS_CANVASOK_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round94-v7-harness-canvasok`
(`~/workspace/repo-1-push/paths-loop/phase9-round94-v7-harness-canvasok.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v7.md`.
Số liệu thô: `hidden_files/round94-v7/probe-{chromium,webkit}-load-gop{250,60,30}/probe-results.json`
+ `run-*.log` (gồm `run-chromium-gop250.log` lần 1 fail Xvfb và
`run-chromium-gop250-retry1.log` lần chạy lại PASS).

## 9. Nợ còn lại cho đợt sau

1. **Race display Xvfb khi nhiều luồng chạy probe song song** (mục §6):
   picker :193–:197 không có lock giành quyền; luồng khác chiếm display
   giữa check và spawn → fail cả lượt. Hướng sửa: picker thử spawn rồi
   mới chốt display, hoặc mở rộng dải display, hoặc retry toàn lượt khi
   lỗi Xvfb (hiện runner đã chạy lại thủ công).
2. **Ngưỡng đổi 0.01 chưa tự hiệu chuẩn theo clip** (§5): clip chuyển
   động chậm/vùng tối khác có thể cần ngưỡng khác; nên đo bước khung nhỏ
   nhất từ clip trước khi chạy rồi đặt ngưỡng = 1/4 bước đó.
3. **T2 mỏng (nợ đợt 93 U7 §7 mục 1, còn mở):** chưa có flake mới, vẫn
   chưa sửa — hướng sửa vẫn là assert theo số lần re-arm.
4. **Trần 5000 ms của T3 vẫn chưa có bằng chứng ngoài đời** (nợ đợt 92 §4
   mục 3 — không thuộc brief V7, nhắc lại): đợt này bắt thêm 2 stall
   canvas > 30 s ở phase pause-seek (khác phase phát của T3).
5. **Số seek GOP chỉ 1 clip 720p/6 s, n=3/target** — cần mẫu lớn hơn +
   clip dài hơn nếu muốn kết luận phân phối.
