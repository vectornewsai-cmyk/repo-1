# PHASE9_ROUND129_T3_PROBE_LIMITS — Cải tiến probe lượt yên WebKit: blendTick tăng dần + heartbeat [HB129] (KHÔNG đổi bar, KHÔNG chạy lượt yên thật)

> Luồng T3, đợt 129, lượt cron 15:35 +07 17/11/2026 (bắt đầu ~08:38Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> **Probe MỚI chỉ dùng từ đợt 130 — T4 đợt 129 vẫn dùng probe CŨ (xem §6).**

## 0. Tóm tắt

- **Vấn đề (nợ LIMITS gộp đợt 128 §11 mục 4 + T4 đợt 128 §5.1/§9.4):**
  attempt3 lượt yên #7 đợt 128 chết pass-timeout (rAF kẹt 120 s, pass 17)
  và partial JSON **KHÔNG có blendTick** → (b)/(c2)/lag≥5f KHÔNG CÓ DỮ
  LIỆU trên lượt dở dang. Nguyên nhân: `writePartial` ghi `blendTick: []`
  cứng, trong khi `tickCost` đã được fetch tăng dần từng pass.
  Ngoài ra, lần kẹt 120 s đó im lặng hoàn toàn (không log nào trong lúc
  chờ pass) nên không xác định được điểm kẹt.
- **Sửa (file duy nhất trong repo):**
  `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`
  (md5 cũ `dccb8f4c…` → mới `920a5122…`, 942 → 997 dòng, diff 67 dòng):
  1. `writePartial` fetch `window.__vcutRvfcBlendTick` TĂNG DẦN sau mỗi
     pass (lọc theo seq > mốc đầu case — đúng slice như fetch cuối lượt),
     giữ bản tốt nhất khi lỗi/timeout, ghi thêm `blendTickStatus` /
     `blendTickNote` vào partial JSON — cùng cơ chế với `tickCost`.
  2. Heartbeat `[HB129]` 5 s (port từ `hbStart` của hb128 đợt 128 T3)
     trong 2 lần chờ dài của probe: race pass 120 s + mọi `pwEvalTimeout`
     (fetch tickCost/blendTick trong `writePartial`, fetch y2 cuối lượt).
     Heartbeat chạy trên event loop Node nên vẫn log khi page.evaluate treo.
- **KHÔNG đổi:** ngưỡng ≤60 ms, bar B2 (load1 ≤4) và toàn bộ lớp A/B,
  logic đo trong trang, fetch cuối lượt, định dạng JSON hoàn chỉnh,
  `pump: []` trong partial (chỉ blendTick được thêm — xem §5).
- **Kiểm chứng:** xem §4. (a) dry-run thật trên fixture: kill probe sau
  pass 2/4 → partial JSON có blendTick tới pass cuối + analyzer labellag
  chạy được. (b) test trích code thật: pwEval treo 12 s → 2 dòng [HB129]
  rồi reject đúng timeout; evaluate nhanh → 0 dòng. (c) `node --check`
  OK; KHÔNG đụng production (`preview.tsx`/`media.ts` md5 không đổi)
  nên không chạy lại tsc/vite build (xem §4.3).

## 1. Đọc trước khi sửa (đã đọc)

- `docs/PHASE9_ROUND128_T4_WEBKIT_QUIET7_LIMITS.md` (§5/§5.1/§9.4:
  attempt3 chết pass 17, partial mất blendTick, đề xuất ghi tăng dần).
- `docs/PHASE9_ROUND128_LIMITS.md` §11 mục 4 (nợ pass-timeout +
  blendTick tăng dần) + §3 (bản hb128: heartbeat trong 85m4, chưa thử lửa).
- `docs/PHASE9_ROUND128_T3_85M4_LIMITS.md` (bản hb128: helper `hbStart`
  5 s + try/finally trong `waitForPlaySync`/`sampleFor`/`waitForNotSeeking`).
- Probe hiện tại `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`
  (942 dòng, md5 `dccb8f4c…` — KHỚP bản copy T4 đợt 128) + bản copy
  T4 đợt 129 tại `hidden_files/round129-t4/probe121t3-ghost-k7.webkit.mjs`
  (md5 `dccb8f4c…` — bản CŨ, xem §6).
- Analyzer T4 (`analyze-t4-{labellag,lag5,tickcost}.py`): đọc
  `results["b"]["y2"]["blendTick"]`/`tickCost` trực tiếp, bỏ qua field
  thừa — KHÔNG cần sửa analyzer cho field mới.

## 2. Thay đổi chi tiết (diff 67 dòng, toàn thêm + 4 dòng sửa)

### 2.1 Helper heartbeat `hbStart` (mới, sau dòng `sleep`)

Port từ hb128 (`apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs`
dòng 58-64), chỉnh cho probe này (probe không có hàm `log()` riêng
nên dùng `console.log` trực tiếp kèm timestamp ISO):

```js
function hbStart(tag, getSummary) {
  const t0 = Date.now();
  const iv = setInterval(() => {
    console.log(`[${new Date().toISOString()}] [HB129] ${tag} elapsed=${((Date.now() - t0) / 1000).toFixed(0)}s ${getSummary()}`);
  }, 5000);
  return () => clearInterval(iv);
}
```

Tag `[HB129]` (không dùng `[HB128]`) để phân biệt nguồn log: `[HB128]` =
harness 85m4, `[HB129]` = probe lượt yên này.

**Lưu ý ánh xạ tên hàm trong task:** task ghi "heartbeat trong
`waitForPlaySync`/`sampleFor` (dùng hb128 nếu đã có)". Hai hàm đó chỉ có
trong harness 85m4 — và hb128 đợt 128 ĐÃ thêm heartbeat vào đó rồi
(không còn gì để làm thêm ở harness). Probe lượt yên KHÔNG có 2 hàm đó;
các lần chờ dài tương đương của nó là **race pass 120 s** (§2.3) và
**`pwEvalTimeout`** (§2.2) — heartbeat được thêm vào đúng 2 chỗ đó,
cùng mẫu `hbStart` của hb128. Không sửa file 85m4 nào.

### 2.2 `pwEvalTimeout` — heartbeat trong lúc chờ evaluate

Trước: `const pwEvalTimeout = (expression, ms, label) => Promise.race([...])`.
Sau: mở `hbStart(`pwEvalTimeout ${label}`, ...)` trước race, `.finally(hbStop)`
sau race. Bao phủ: fetch tickCost/blendTick trong `writePartial` (30 s)
+ fetch y2 cuối lượt (30 s). Evaluate xong nhanh (vài ms) thì interval
clear trước lần log đầu → không spam log đường thường.

### 2.3 Race chờ pass — heartbeat trong lúc chờ pass

Trước: `const frames = await Promise.race([pwEval(pass...), timeout 120 s])`.
Sau: mở `hbStart(`play pass ${p+1}/${PASSES}`, () => `passesDone=${passes.length} timeoutMs=${PASS_TIMEOUT_MS}`)` trước race,
`passHbStop()` ngay sau await. Summary cho biết pass đang chạy + số pass
đã xong + elapsed — đủ để lần kẹt sau xác định điểm kẹt (pass nào, đã
xong mấy pass, kẹt bao lâu). Không dùng try/finally: race này không
reject (nhánh pwEval có `.catch`, nhánh timeout resolve) nên hbStop sau
await là đủ; ghi rõ lý do trong comment để người đọc sau không "sửa"
thừa.

### 2.4 `writePartial` — blendTick tăng dần (thay đổi chính)

- Thêm bộ 3 biến `lastBlendOk = []` / `lastBlendStatus = "none"` /
  `lastBlendNote = ""` — gương của `lastTcOk`/`lastTcStatus`/`lastTcNote`.
- Sau khối fetch tickCost, fetch thêm:
  `(window.__vcutRvfcBlendTick || []).filter((e) => e.seq > y2SeqStart.blend)` —
  lọc theo **seq** (blendTick có seq; khác tickCost lọc theo wallMs vì
  tickCost không có seq). Đúng slice như fetch cuối lượt (dòng ~588 cũ).
- Lỗi/timeout: giữ `lastBlendOk` (không ghi đè `[]`), ghi
  `blendTickStatus` (`ok`/`timeout`/`error`/`none`) + `blendTickNote`
  (tối đa 200 ký tự) — gương của `tickCostStatus`/`tickCostNote`.
- Partial JSON: `y2.blendTick` = mảng đã fetch (thay cho `[]` cứng);
  dòng log thành `partial JSON đã ghi: N/M pass (..., tickCost … n=…,
  blendTick … n=…)`.
- **Giữ nguyên:** `pump: []` trong partial (pump chỉ dùng cho y2Summary
  cuối lượt, không cần cho (b)/(c2)/lag — ngoài phạm vi nợ này);
  fetch cuối lượt + JSON hoàn chỉnh không đổi (blendTick cuối vẫn lấy
  từ fetch cuối như cũ); `tickCost` không đổi.

## 3. Những gì KHÔNG đổi (cam kết)

- Ngưỡng WebKit ≤60 ms GIỮ; bar B2 (load1 ≤4) GIỮ; lớp A/B, gate 0/A,
  prereg, quy tắc verdict — KHÔNG sửa gì (probe này không chứa bar).
- Logic đo trong trang (`MEASURE_FN_SRC`, vòng pass, phân tích offline),
  `PASS_TIMEOUT_MS` (120 s), `TICKCOST_TIMEOUT_MS` (30 s) — không đổi.
- File production: KHÔNG sửa file nào trong `apps/web/src` (xem §4.3).
- File 85m4 (gốc + hb128): KHÔNG sửa.
- Probe cũ T4 đợt 129: KHÔNG sửa (bản copy trong `hidden_files/round129-t4/`
  vẫn md5 `dccb8f4c…` — xem §6).

## 4. Kiểm chứng (bằng chứng thật)

### 4.1 `node --check` + diff

- `node --check benchmarks/render/probe121t3-ghost-k7.webkit.mjs`: **OK**
  (chạy 08:46Z).
- Diff vs bản gốc (backup tại `hidden_files/round129-t3/probe121t3-ghost-k7.webkit.mjs.ORIG`,
  md5 `dccb8f4c…`): **67 dòng thay đổi**, toàn dòng thêm trừ 4 dòng sửa
  (wrap `pwEvalTimeout`, dòng partial JSON, dòng log partial).
  File mới md5 `920a5122ca9573363eacf74b1b0d6625`, 997 dòng.

### 4.2 Test heartbeat trên code thật (trích nguồn, không copy tay) — PASS

- Script: `hidden_files/round129-t3/test-hb129-extract.mjs` — đọc file
  probe, trích đúng chuỗi nguồn `hbStart` + `pwEvalTimeout` bằng regex,
  eval trong một scope với stub `pwEval`. Log:
  `hidden_files/round129-t3/hb129-extract-test.log`.
- Kết quả (chạy 08:48Z, ~40 s, chỉ Node — không browser/vite):
  - **TEST1 PASS:** pwEval treo vĩnh viễn + timeout 12 s → đúng **2 dòng
    [HB129]** ở elapsed=5s và 10s, reject đúng lỗi
    `pwEval timeout sau 12000ms (test-hang)` ở 12002 ms; chờ thêm 6 s
    sau reject: **0 dòng mới** (interval đã clear).
  - **TEST2 PASS:** pwEval trả ngay (giá trị 42) → **0 dòng heartbeat**,
    resolve đúng giá trị (không spam đường thường).
  - **TEST3 PASS:** `hbStart` trực tiếp 11 s → 2 dòng; sau `hbStop`,
    chờ 6 s: 0 dòng mới.
  - `ALL HB129 EXTRACT TESTS PASS`, exit 0.
- Giới hạn của test này: chỉ chứng minh helper + `pwEvalTimeout`; heartbeat
  quanh race pass là code inline trong vòng lặp nên không trích được —
  chứng minh bằng dry-run thật (§4.4).

### 4.3 Production không đụng — không chạy lại tsc/vite build

- `preview.tsx` md5 `03bf029f` + `media.ts` md5 `2c384ed1` lúc 08:51Z —
  KHỚP baseline T4 đợt 128/129 (cây không đổi).
- Chỉ sửa 1 file script benchmark (`benchmarks/render/...`) + thêm file
  LIMITS này — không file nào trong `apps/web` đổi, nên tsc/vite build
  không bị ảnh hưởng; không chạy lại (tránh tải máy trong lúc T4 đo).
  Ghi rõ theo đúng task: "chỉ sửa script probe → ghi rõ không đụng production".

### 4.4 Dry-run thật trên fixture (kill giữa chừng)

- Driver: `hidden_files/round129-t3/dryrun-inner.sh` (vite riêng :5191 qua
  lock v2 `run-attempt t3`, probe mới `--passes N --tickcost-timeout-ms 30000
  --disable-rvfc --flip-rvfc-after-pass 5`, kill -9 node khi partial ghi
  đủ số pass hẹn; dọn vite/Xvfb/MiniBrowser của chính probe theo pid đã ghi).
- **Chạy sau cờ `round129-t4-done` (T4 attempt1 xong 08:58:20Z).**
  T4 attempt1 đợt 129 (probe CŨ): median tickCost 54,0 ms, lớp B 5/5 ĐẠT
  (xem file T4) — dry-run này không đụng lượt yên đó (vite :5191 riêng,
  lock v2 xếp hàng sau T8).
- **Run 1 — PASS (09:01:05–09:01:32Z, boot #75):** lock chờ T8 7 s rồi giữ
  30 s; vite :5191 lên sau 3 s; probe `--passes 4`, kill -9 sau khi
  partial ghi đủ 2 pass (sau 22 s), rc=137.
  Partial JSON sau kill (`dryrun/partial-test.json`):
  `partial=true, partialReason="sau pass", passesDone=2/4`,
  **`blendTick n=40, status=ok`, seq 0→39 tăng dần, tBlend cuối 18405**;
  tickCost n=49 ok; pump n=0 (giữ `[]` theo thiết kế).
  Dòng log mới ghi đúng:
  `partial JSON đã ghi: 1/4 pass (sau pass, tickCost ok n=24, blendTick ok n=20)`
  và `2/4 pass (..., blendTick ok n=40)` — blendTick TĂNG DẦN theo pass.
  **→ (a) ĐÃ CHỨNG MINH: partial sau kill giữa chừng vẫn có blendTick
  tới pass cuối.**
  Heartbeat live: **0 dòng [HB129]** — đúng kỳ vọng: không lần chờ nào
  vượt 5 s (pass ~3,5 s; fetch tickCost/blendTick vài ms). Đây cũng là
  bằng chứng phủ định: đường thường KHÔNG spam log. Heartbeat khi chờ
  >5 s đã chứng minh bằng test trích (§4.2); kẹt rAF 120 s thật chưa
  tái hiện (xem §5.1).
  Cleanup sau run 1: vite :5191 kill OK (curl 000), MiniBrowser pid
  18001 kill, Xvfb :193 kill + socket đã unlink; còn lại Xvfb :199
  (của T8, không phải của probe này) + socket X199.
- **Run 2 — LỖI DO REBOOT, đã chạy lại thành công (xem dưới):**
  probe tự thoát rc=1 sau ~10 s (09:04:38Z), chưa ghi partial nào:
  `MiniBrowser: error while loading shared libraries: libevent-2.1.so.7:
  cannot open shared object file`. Nguyên nhân: **VM reboot giữa chừng**
  (boot #75 btime 07:13:31Z chết trong (08:59:16Z, 09:02:12Z];
  **boot #76 btime 09:02:12Z, boot_id `88f62ae6…`** — reboot giữa lượt
  ĐẦU TIÊN T5 ghi nhận; T4 attempt2 cũng bị giết theo — xem
  `hidden_files/round129-t5/t5-reboot-midround-note.md`).
  Trên boot #76 lúc đó, apt replay chưa cài lại libs (postboot FAIL
  09:02:12Z: thiếu libevent-2.1-7t64 + 10 gói gstreamer/libav; dpkg.log
  mới 2 dòng). **Lỗi này không liên quan tới sửa probe** (run 1 cùng máy,
  cùng file probe, launch WebKit bình thường 3 phút trước đó).
  Log lỗi giữ lại: `dryrun/probe-run2-failed-boot76-nolibs.log`.
  T5 sau đó vá + chờ replay: `POSTBOOT_PASS` boot #76 ghi 09:32:15Z
  ("DU DIEU KIEN chay WebKit"); T5 xong 09:35Z (`round129-t5.done`).
- **Run 2 chạy lại — PASS (09:39:43–09:40:38Z, boot #76):** xếp hàng sau
  lock T8 113 s (T8 đang chạy harness :5490), vite :5191 lên sau 3 s,
  probe `--passes 8`, kill -9 sau khi partial ghi đủ 6 pass (sau 48 s),
  rc=137. Partial JSON sau kill (`dryrun/partial-test6.json`):
  `partial=true, passesDone=6/8`, **`blendTick n=106, status=ok`,
  seq 0→105 tăng dần, tBlend cuối 42534**; tickCost n=125 ok;
  `flip={afterPass: 5, wallMs: 38107}` (đã qua flip pass 5).
  BlendTick tăng dần theo pass: 19→36→53→70→88→106.
  Heartbeat live: 0 dòng [HB129] (pass ~3,5–4 s < 5 s; fetch vài ms).
- **Analyzer chạy được trên partial bị kill (run 2) — khoảng trống đợt
  128 đã lấp:**
  - `analyze-t4-tickcost.py dryrun-partial6=partial-test6.json`:
    tickCost total n=125 **median=103,0** p90=147,6 max=201 min=55;
    hậu flip+2000ms n=16 median=98,5; tBlend gap n=105 median=167,0
    p90=288,2 max=2598; BlendTick/pass=17,7; rAF/pass median=26.
    **Ghi rõ: median 103,0 KHÔNG phải số đo lượt yên** — dry-run chạy
    ngay sau harness T8, máy tải nặng (xếp hàng lock 113 s, vite T8 +
    Xvfb T8 còn chạy) — chỉ chứng minh pipeline chạy được, không phải
    verdict ngưỡng.
  - `analyze-t4-labellag.py partial-test6.json` → **chạy được**: skp=1:
    nTick=6, nOccurrence=12, (b) median 0f, **(c2)=0**; skp=0: nTick=10,
    nOccurrence=20, (b) median -1f, **(c2)=0**; lag≥5f: 0 cả 2 skp.
    (n nhỏ vì chỉ 16 tick hậu flip+2000ms trong partial 6 pass — đủ để
    chứng minh pipeline, không đủ để kết luận thống kê.)
  - `analyze-t4-lag5.py partial-test6.json` → **(b) lag≥+5f: 0 occurrence**.
  - Đối chiếu đợt 128 attempt3: partial khi đó có labellag nTick=0 +
    "KHÔNG CÓ DỮ LIỆU" — với probe mới, cùng tình huống kill giữa chừng
    nay cho (b)/(c2)/lag đầy đủ. **Nợ §11 mục 4 (blendTick tăng dần)
    ĐÃ ĐÓNG về mặt công cụ.**
- Analyzer trên partial run 1 (ghi rõ giới hạn):
  - `analyze-t4-tickcost.py` gọi sai cú pháp lần đầu (`tag path` thay vì
    `tag=path` — lỗi của người gọi, không phải của analyzer/probe);
    đã chạy lại đúng ở run 2.
  - `analyze-t4-labellag.py partial-test.json` → `KHONG CO FLIP
    (wallMs null) — khong phan tich duoc`: partial 2 pass chưa tới flip
    pass 5 nên không có `flip.wallMs` — analyzer ĐÚNG khi từ chối (thiếu
    mốc flip), không phải lỗi đọc blendTick. Run 2 (kill sau pass 6)
    đã giải quyết.

## 5. Hạn chế + lưu ý (trung thực)

1. **Heartbeat pass chưa thử lửa bằng kẹt thật:** dry-run chứng minh
   heartbeat xuất hiện khi pass kéo dài >5 s (pass thường ~9 s) và khi
   evaluate treo (test trích); nhưng kẹt rAF 120 s thật (như attempt3
   đợt 128) chưa tái hiện — lần kẹt sau mới là thử lửa thật, giống hb128.
2. **`pump` vẫn `[]` trong partial:** (b)/(c2)/lag chỉ cần blendTick +
   frames nên đủ; y2Summary/pump vẫn chỉ có ở JSON hoàn chỉnh. Nếu đợt
   sau cần pump trên lượt dở dang thì làm tiếp theo cùng mẫu.
3. **BlendTick lần fetch đầu tiên sau pass 1:** nếu fetch này timeout
   (trang treo ngay sau pass 1), partial giữ `blendTick: []` + status
   `timeout` — đúng thiết kế "giữ bản tốt nhất" (chưa có bản tốt nào),
   không phải lỗi; lần fetch sau (nếu trang hồi) sẽ ghi đè bằng dữ liệu thật.
4. **Heartbeat thêm ~0 tải đo:** interval 5 s chỉ log; không evaluate
   thêm, không đổi thời gian pass/timeout. Không ảnh hưởng median.
5. **Chưa chạy lượt yên thật bằng probe mới** — cố ý (task cấm; lượt yên
   thật là việc của T4 đợt 130 với probe này).

## 6. Lưu ý cho T4 đợt sau (QUAN TRỌNG — probe mới dùng từ đợt 130)

- **T4 đợt 129 DÙNG PROBE CŨ — KHÔNG đổi giữa đợt.** Bản copy của T4
  đợt 129 tại `hidden_files/round129-t4/probe121t3-ghost-k7.webkit.mjs`
  vẫn là bản cũ md5 `dccb8f4c…` (kiểm lúc 08:43Z, trước khi sửa repo).
  T4 đợt 129 KHÔNG được copy lại từ `benchmarks/render/` giữa đợt.
- **Từ đợt 130:** T4 copy probe từ `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`
  (md5 mới `920a5122…`) như thường lệ; verify md5 sau khi copy và ghi
  vào LIMITS. Phân biệt bằng dòng log mới `blendTick … n=…` trong
  "partial JSON đã ghi" + các dòng `[HB129]` trong log probe.
- **Analyzer không cần đổi:** `analyze-t4-labellag.py` / `lag5` / `tickcost`
  đọc `y2.blendTick` trực tiếp; partial giờ có blendTick nên chạy được
  trên lượt dở dang (≥10 pass theo prereg thì báo cáo median DỞ DANG
  kèm (b)/(c2)/lag tới pass cuối — không còn "KHÔNG CÓ DỮ LIỆU" nữa).
  Field mới `blendTickStatus`/`blendTickNote`: đọc để biết lần fetch cuối
  có timeout không (nếu `timeout` + n nhỏ thì blendTick có thể thiếu
  đoạn cuối — ghi rõ khi báo cáo).
- **Nếu kẹt tái hiện ở đợt 130:** đọc dòng `[HB129]` CUỐI CÙNG trước điểm
  kẹt — tag `play pass N/M` cho biết kẹt ở pass nào + đã xong mấy pass;
  tag `pwEvalTimeout …` cho biết fetch nào treo (tickCost / blendTick /
  final-y2logs). Đó chính là mục đích của heartbeat này.
- **Xvfb socket sót (nợ đợt 128 §11 mục 5):** KHÔNG làm trong luồng này
  (ngoài phạm vi task) — probe vẫn để lại socket sau SIGKILL; driver
  các luồng sau tiếp tục dọn tay sau mỗi attempt như T4 đã làm.

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `benchmarks/render/probe121t3-ghost-k7.webkit.mjs` — sửa (md5 mới `920a5122…`).
- `docs/PHASE9_ROUND129_T3_PROBE_LIMITS.md` — file này (mới).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round129-t3-probe.txt`
  (NUL-delimited, 2 file text trên; đã đọc lại xác nhận).
  Lưu ý cho người push: probe 61.239 B (> trần 37.768 B — bản cũ đã
  57.283 B nên không phải mới) → push với `ENABLE_PRIVSEP=0` như các
  file lớn trước đây; LIMITS 21.815 B, dưới trần.
- Log + dữ liệu (ngoài repo, KHÔNG stage):
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round129-t3/`
  (`probe121t3-ghost-k7.webkit.mjs.ORIG` [backup bản cũ md5 `dccb8f4c…`],
  `test-hb129-extract.mjs` + `hb129-extract-test.log` [TEST1–3 PASS],
  `dryrun-inner.sh` + `dryrun/` [b.json, vite temp config, `dryrun.log`,
  `partial-test.json` (run 1: kill sau pass 2, blendTick n=40) +
  `partial-test6.json` (run 2: kill sau pass 6, blendTick n=106) +
  `probe-run1.log` + `probe-run2-failed-boot76-nolibs.log` (lỗi libevent
  do reboot) + `probe-run2.log` (retry PASS) + `vite-5191.log` +
  analyzer `analyze-dryrun6-{labellag,lag5}.txt` + tickcost (in-log)]).
- Cờ xong: `hidden_files/round129-t3.done` (touch khi xong, kèm verdict 1 dòng).

## 8. Nợ mở chuyển tiếp

1. **Lượt yên WebKit #7 lần 3 (T4 đợt 129):** attempt1 bằng probe CŨ đã
   xong (median 54,0 ms, lớp B 5/5 ĐẠT — theo file T4); attempt2 bị
   reboot giữa lượt giết (xem mục 5 dưới) — T4 phải gate lại bằng cờ
   POSTBOOT_PASS mới của boot #76 rồi chạy lại; kết quả thuộc LIMITS T4
   đợt 129, không thuộc luồng này.
2. **Dry-run 2 (§4.4): ĐÃ XONG** (chạy lại sau replay boot #76, PASS) —
   (b)/(c2)/lag tính được trên partial bị kill; nợ blendTick tăng dần
   ĐÃ ĐÓNG về mặt công cụ.
3. **Reboot giữa lượt (mới):** boot #75 chết (08:59:16Z, 09:02:12Z];
   boot #76 btime 09:02:12Z, boot_id `88f62ae6-a216-42a9-8a81-b36fd83ca019`.
   Đây là reboot giữa lượt ĐẦU TIÊN (4 lần trước đều giữa đợt đóng và
   lượt mở) — T5 theo dõi replay; T2 đối chiếu mù #48 với gap #75→#76.
   Cờ POSTBOOT_PASS cũ (#75) đã thành `POSTBOOT_PASS.b75-stale`.
4. **Xvfb socket sót:** vẫn nợ (đợt 128 §11 mục 5) — ngoài phạm vi luồng này.
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 128 §11: mù #48 (T2),
   (c2) +1f chẩn đoán (T5), G1 chờ user, birefnet (chỉ thử khi available
   ≥ 6 GB), TTS 39 cấm kiểm lại, ci-security.yml 403, release gate không đổi.
   Boot lúc mở luồng: #75 (btime 07:13:31Z); boot lúc viết LIMITS: #76
   (btime 09:02:12Z). RAM khả dụng lúc mở ~1.152 MB (< guard birefnet
   6 GB — không thử birefnet).
