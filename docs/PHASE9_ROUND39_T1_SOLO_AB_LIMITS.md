# Phase 9 đợt 39, luồng T1 — Phiên đo solo A/B thật — LIMITS

Ngày: 03/11/2026 (giờ +07). KHÔNG push, KHÔNG release/tag, KHÔNG
binary vào repo, KHÔNG code giả. Luồng này KHÔNG sửa cổng v2/v3,
probe Q6, harness N2, code sản phẩm, hay file của luồng khác — chỉ
sửa runner solo của chính dòng T1 (đợt 38 U6) để sửa 1 bug chặn
chế độ run, thêm 1 test hồi quy, và ghi LIMITS này.

Đọc trước khi làm: `docs/PHASE9_ROUND38_U6_SOLO_RUNNER_LIMITS.md`
toàn bộ và `docs/PHASE9_ROUND38_LIMITS.md` §5 mục 1.

## 0. Kết luận ngắn

1. **Phát hiện + sửa 1 bug chặn toàn bộ chế độ `run` của runner
   đợt 38 U6 (§1).** Đây là lần đầu chế độ `run` được thực thi
   — U6 đã ghi rõ nó "CHƯA TỪNG CHẠY trong đợt này", và đúng là
   nó chưa từng chạy được: đường dẫn probe sai 1 cấp thư mục nên
   mọi lượt đều NO_RESULT. Sau sửa, runner đã sẵn sàng cho phiên
   thật (test hồi quy mới xanh).
2. **Phiên solo thật CHƯA CHẠY ĐƯỢC trong phiên này (§3).**
   Máy không đạt điều kiện solo trong 32 phút quan sát liên tục
   (chrome không về 0 lần nào, load15 không dưới 2,11 lần nào)
   do các luồng đợt 39 khác chạy browser/ffmpeg liên tục. Luồng
   này KHÔNG chạy chen giữa: Chrome của mình sẽ nhiễm số đo
   đang chạy của luồng khác, và lượt của mình cũng bị loại
   (chromePost ≠ 0). Đây là blocker headed-browser theo đúng
   điều khoản dừng của nhiệm vụ — dừng phần đo, không bịa số.
3. **Quyết định khóa: CHƯA KHÓA — và KHÔNG ĐỔI ngưỡng/cổng nào
   (§4).** Không có dữ liệu solo mới nên mọi thay đổi lúc này
   đều là chỉnh hồi tố trên dữ liệu cũ (U6 §2 đã cấm). Giữ nguyên
   2,0 cho load1/load5/load15; bảng nhạy 1,95 vẫn chỉ là phân
   tích; vùng INDETERMINATE_MIXED vẫn chỉ có 1 tiền lệ.
4. **Runner đã sẵn sàng cho phiên thật từ main chat khi máy yên:**
   dry-run exit 0 lúc máy yên, self-test exit 0, test runner
   11/11 (gồm test hồi quy mới), cổng v3 13/13, probe Q6 đã chứng
   minh chạy độc lập được (§2).

## 1. Bug chặn chế độ run của runner đợt 38 (đã sửa — bằng chứng thật)

### 1.1 Triệu chứng

Lệnh chạy đầu phiên (sau dry-run exit 0, port 4191 trống, chrome
= 0, load 0,65/0,40/0,19):

```
node apps/web/scripts/seek-ab-solo-run.mjs run \
  --out-dir benchmarks/solo-seek-ab-round39 \
  --scratch-base ~/workspace/tmp-round39-t1-scratch \
  --display :91 --port 4191
```

Kết quả: exit 0 nhưng TOÀN BỘ 48 lượt đều `NO_RESULT`,
`accepted=undefined fps=undefined`, tổng thời gian chỉ ~6,5 giây
cho 48 lượt (mỗi lượt phải mất ~70 s nếu probe chạy thật). Mọi
thư mục scratch lượt đều trống (không có `q6-labeled.json`,
không có `forward-hold.json`, không có `q6-n2.log`). JSON lượt
mẫu:

```json
{"run": "solo-retry-s1", "variant": "retry", "attempt": 1,
 "counted": true, "status": "NO_RESULT", "q6Exit": 1, "q6Log": "",
 "reason": "probe Q6 không trả forward-hold.json"}
```

`q6Log` trống vì runner chỉ lưu `stdout` của probe; lỗi thật nằm
ở `stderr` và đã bị runner nuốt — đây là điểm yếu ghi log của
runner (ghi nhận, không sửa trong đợt này vì không cần cho phiên
sau khi đường dẫn đã đúng; người chạy phiên sau nên biết: nếu
lại thấy NO_RESULT với q6Log trống thì kiểm tra stderr của probe
trước, đừng kết luận probe hỏng).

### 1.2 Nguyên nhân gốc: REPO sai 1 cấp

Trong `apps/web/scripts/seek-ab-solo-run.mjs` (bản đợt 38):

```js
const HERE = path.dirname(fileURLToPath(import.meta.url)); // = apps/web/scripts
const REPO = path.resolve(HERE, "..", "..");                // = repo-1/apps  (SAI)
```

Cần 3 lần `".."` mới tới gốc repo (scripts → web → apps →
repo-1), nhưng code chỉ có 2 lần nên `REPO` = `repo-1/apps`, và
đường dẫn probe mà chế độ `run` spawn thành
`repo-1/apps/apps/web/scripts/probe-round34-q6-measure-protocol.mjs`
— không tồn tại. Node báo `Cannot find module` (đã tái hiện
trực tiếp bằng lệnh `node` lên đúng đường dẫn sai đó), exit 1,
stdout trống → đúng triệu chứng quan sát. Dry-run và self-test
không dùng `REPO` nên vẫn xanh — đó là lý do bug sống sót qua
đợt 38: hai chế độ đã chạy đều không đi qua đường dẫn này.

### 1.3 Sửa (trước → sau)

`apps/web/scripts/seek-ab-solo-run.mjs`:

- Trước: `const REPO = path.resolve(HERE, "..", "..");`
- Sau: `const REPO = path.resolve(HERE, "..", "..", "..");`
  kèm chú thích ghi rõ lỗi đợt 38.
- Thêm `export const PROBE_Q6 = path.join(REPO,
  "apps/web/scripts/probe-round34-q6-measure-protocol.mjs");`
  và chế độ `run` spawn `PROBE_Q6` thay vì tự nối đường dẫn.
- `apps/web/scripts/seek-ab-solo-run.test.mjs`: thêm 1 test hồi
  quy — `PROBE_Q6` phải tồn tại trên đĩa và không chứa
  `"apps/apps/"` (test này fail trên bản đợt 38, pass trên bản
  sửa — đúng nghĩa hồi quy).

Không đổi logic cổng, ngưỡng, thứ tự xen kẽ, hay điều kiện
dừng nào của runner. Sau sửa: `node --check` cả 2 file pass;
test runner 11/11 (10 cũ + 1 mới); cổng v3 13/13 (§5).

### 1.4 Dọn dẹp sản phẩm lỗi

48 JSON NO_RESULT + summary của lần chạy lỗi đã XOÁ khỏi
`benchmarks/solo-seek-ab-round39/` vì chúng không phải số đo
(đường dẫn probe sai, không lượt nào chạy thật) — không tính
vào dữ liệu, không để lại gây nhầm. Thư mục out-dir sau đó
trống nên đã gỡ luôn; phiên thật sau này chạy lại lệnh `run`
sẽ tự tạo lại thư mục này. Log lần chạy lỗi còn ở scratch
ngoài repo: `~/workspace/tmp-round39-t1-scratch/t1-solo-run.log`
(không stage, chỉ để đối chiếu).

## 2. Chẩn đoán probe độc lập (KHÔNG phải số đo solo — không tính)

Để xác định lỗi nằm ở runner hay ở probe, đã chạy probe Q6 trực
tiếp 1 lần với đúng env mà runner dùng (dist-retry đóng băng,
fixture sparse-gop-flat, display :91, port 4191):

- Probe chạy được thật (~70 s), harness N2 tự bật Xvfb :91,
  sinh đủ `forward-hold.json` + `q6-labeled.json` + `q6-n2.log`
  trong `~/workspace/tmp-round39-t1-scratch/debug-s1/` (scratch
  ngoài repo, không stage).
- `frozenDist validity=VALID`, manifest khớp — cặp bundle đóng
  băng + fixture vẫn nguyên.
- Kết quả lượt chẩn đoán này là **under-load, KHÔNG tính làm dữ
  liệu solo**: `load1 cuối lượt 2,41 ≥ 2` do ffmpeg của luồng
  khác đang encode cùng lúc (PID 3555, `testsrc2 ... duration=120`
  của thư mục `tmp-round39-t5-measure`), kèm `fps ngược 1,139 /
  xuôi 0,885`. Nó chỉ chứng minh probe + harness + Xvfb + port
  đều hoạt động; lỗi nằm ở runner (§1), không ở probe. Không
  trích fps của lượt này vào bất kỳ phân tích A/B nào.

## 3. Điều kiện solo trong phiên này: không đạt trong 32 phút quan sát

### 3.1 Khoảnh khắc máy yên duy nhất (đầu phiên)

Lúc bắt đầu (08:0x): `pgrep Chrome = 0`, load 0,65/0,40/0,19,
port 4191 trống → dry-run exit 0, ok: true (§5). Ngay sau đó các
luồng đợt 39 khác khởi động browser/ffmpeg và máy không yên lại
nữa trong suốt thời gian quan sát.

### 3.2 Bảng quan sát tranh chấp (pgrep mẫu `chrome-linux64/chrome|meta-chromium/chrome`, đúng mẫu của runner)

| Thời điểm (tương đối) | chrome | load1/load5/load15 | Ghi chú |
|---|---|---|---|
| đầu phiên | 0 | 0,65 / 0,40 / 0,19 | dry-run exit 0 |
| dry-run lúc bận | 15 | 4,76 / 4,82 / 2,83 | dry-run exit 2 fail-closed |
| chờ đợt 1: 2–12 phút | 2 → 16 → 12 → 14 → 17 | cao nhất 8,00 / 5,03 / 2,82 | T6 chrome-diag chạy chu kỳ (profile `tmp-round39-t6-chrome-diag-4424`), T5 ffmpeg encode |
| chờ đợt 2: 2–20 phút | 16 → 13 → 2 → 17 → 2 → 15 → 15 → 15 → 28 → 2 | load15 không dưới 2,11 lần nào | chrome chạm 2 (dư process lúc chuyển phiên) nhưng không về 0; load15 cần ~15 phút yên mới hạ dưới 2,0 |

Tổng cộng 32 phút quan sát, **0 cửa sổ solo** (chrome = 0 VÀ cả
ba load < 2,0). Cửa sổ gần nhất cũng chỉ là chrome = 2 với
load15 = 2,11–2,12 — vẫn vi phạm cả hai điều kiện.

### 3.3 Quyết định dừng phần đo (không chạy chen)

- Chạy chen giữa lúc luồng khác đang đo browser sẽ nhiễm số đo
  của họ (Chrome của mình lọt vào chromePre/chromePost của họ)
  và lượt của mình cũng bị loại (chromePost ≠ 0) hoặc kẹt
  gate-timeout — không thu được dữ liệu solo mà còn phá dữ liệu
  người khác. Đúng thiết kế fail-closed của U6: phiên solo chỉ
  chạy khi máy yên, từ main chat hoặc phiên có quyền dừng các
  luồng browser khác — phiên này không có quyền đó nên dừng.
- Phiên solo KHÔNG bị hủy, chỉ hoãn: runner đã sửa xong, mọi
  tiền kiểm đều xanh, chỉ chờ cửa sổ yên. Lệnh chạy lại ở §6.

## 4. Quyết định ngưỡng/cổng: KHÔNG ĐỔI (trước = sau, có lý do)

Không có dữ liệu solo mới nên không có cơ sở nào để đổi ngưỡng
hay cổng. Mọi thay đổi lúc này đều là chỉnh hồi tố trên dữ liệu
cũ — đúng điều U6 §2 đã cấm.

| Mục | Trước (đợt 38 U6) | Sau (đợt 39 T1) | Lý do |
|---|---|---|---|
| load1 / load5 / load15 nhận/loại | < 2,0 (cả ba, đúng module v3) | KHÔNG ĐỔI | không có dữ liệu solo mới |
| lock band ±10% trung bình retry, CI Welch 95% | giữ | KHÔNG ĐỔI | như trên |
| drift nửa đầu/nửa sau ≤ 10% | giữ | KHÔNG ĐỔI | như trên |
| target 8 accepted/phía, trần 48 lượt, xen kẽ khối 8 | giữ | KHÔNG ĐỔI | như trên |
| bảng nhạy load5 = 1,95 (điểm giữa hai cụm cũ) | chỉ báo cáo, không nhận/loại | KHÔNG ĐỔI, vẫn chưa áp dụng | chưa có dữ liệu solo để kiểm tra |
| quy tắc gắn cờ `near-threshold-load5` (accepted có load5max ≥ 1,90; > 25% accepted mang cờ → báo "ngưỡng load5 2,0 mong manh") | đăng ký trước | KHÔNG ĐỔI, vẫn chưa có dữ liệu kiểm tra | 0 lượt solo mới |
| vùng INDETERMINATE_MIXED (tỉ số GOP [0,30, 0,435)) | 1 tiền lệ duy nhất (retry-b8, tỉ số 0,343) | KHÔNG ĐỔI, vẫn 1 tiền lệ | 0 lượt STEADY_SLOW mới |

**Kết luận khóa A/B <10% + chốt cổng v3: CHƯA KHÓA.** Không phải
vì dữ liệu phủ định, mà vì chưa có dữ liệu solo mới nào — tuyên
bố khóa lúc này sẽ là bịa số. Cổng v3 vẫn ở trạng thái "đề xuất"
như U6 đã để lại, chờ phiên solo.

### 4.1 Ghi chú lệch spec nhỏ (không ảnh hưởng quyết định)

Spec U6 §2.2 nói runner gắn cờ `near-threshold-load5` vào JSON
lượt accepted — kiểm tra code cho thấy runner đợt 38 KHÔNG cài
cờ này (không có chuỗi `near` nào ngoài `loadMaxima`). Không sửa
trong đợt này vì không có lượt nào để gắn cờ; dữ liệu cần cho
phân tích sau vẫn có sẵn trong JSON lượt qua
`verifySolo.loadSignals.load5Max` (cổng v3 trả trường này).
Phiên sau tính cờ này lúc phân tích từ trường đó, hoặc một luồng
khác bổ sung cờ vào runner trước phiên — không bắt buộc, vì
không làm thay đổi acceptance.

## 5. Kiểm chứng đã chạy (lệnh + số thật)

- `node apps/web/scripts/seek-ab-solo-run.mjs --dry-run` lúc máy
  yên → **exit 0**, ok: true, soloReady: true, chromePre = 0,
  pre-load 0,26/0,34/0,18; frozenDist retry ok (254 file,
  manifest `71ddbb25…`, bundle `f2fb0166…`), single ok (254 file,
  manifest `b549f690…`, bundle `fffcd2c0…`); fixture 45.369 byte,
  sha `a4ea20eb…` khớp công bố; sampleClassification 6/6 PASS
  (retry-a5, single-a4, retry-b6, retry-b7, single-b7, retry-b8 —
  đúng nhãn U6).
- `node apps/web/scripts/seek-ab-solo-run.mjs --dry-run` lúc máy
  bận → **exit 2** fail-closed đúng thiết kế: chromePre = 15,
  load 4,76/4,82/2,83, problems nêu rõ cả hai vi phạm.
- `node apps/web/scripts/seek-ab-solo-run.mjs --self-test` (sau
  sửa) → **exit 0**, ok: true, failures: []; pairs R1 0,9895 /
  1,0939 (khớp bản công bố); Welch nửa khoảng 1,795 fps =
  19,94% trung bình retry → không khóa (đúng, n < 8);
  lockLocked = false; planFirst8 đúng; drift giả 22% bị gắn cờ.
- `node --test apps/web/scripts/seek-ab-solo-run.test.mjs` (sau
  sửa) → **11 pass, 0 fail** (10 cũ + 1 hồi quy PROBE_Q6 mới).
- `node --test apps/web/scripts/seek-ab-gate-v3.test.mjs` →
  **13 pass, 0 fail** (không sửa v3, chỉ chạy lại).
- `node --check` cả runner và test sau sửa → pass.
- Chế độ `run` lần 1 (trước sửa) → 48 lượt NO_RESULT, 0 accepted
  (nguyên nhân §1, đã dọn §1.4). Chế độ `run` lần 2 → KHÔNG CHẠY
  (máy bận, quyết định §3.3).
- Không chạy: `tsc` / `vite build` (luồng không sửa code sản phẩm
  hay TypeScript — chỉ script .mjs đo lường; parent gộp chạy lại
  theo quy trình chung nếu cần). Không chạy browser headed nào
  ngoài 1 lượt chẩn đoán probe ở §2 (không tính là số đo).

## 6. Nợ mở + điều kiện chạy phiên solo thật

1. **Phiên solo thật vẫn chưa chạy** — việc duy nhất còn lại của
   T1. Người chạy (từ main chat, khi máy yên, không còn luồng
   browser khác):
   ```
   node apps/web/scripts/seek-ab-solo-run.mjs --dry-run   # phải exit 0
   # xác nhận display :91 và port 4191 trống
   node apps/web/scripts/seek-ab-solo-run.mjs run \
     --out-dir benchmarks/solo-seek-ab-round39 \
     --scratch-base ~/workspace/tmp-round39-t1-scratch \
     --display :91 --port 4191
   ```
   Phiên cần tối thiểu 16 lượt accepted (~70 s/lượt + chờ cổng),
   tức một cửa sổ yên liên tục khoảng 20–40 phút; không chạy
   chen giữa các luồng browser khác.
2. **Probe per-seek (U6 §3.3) vẫn chưa cài** — phiên solo (khi
   chạy được) chỉ khóa được A/B <10%, KHÔNG trả lời được cơ chế
   sụp đoạn. Nợ này thuộc luồng sửa harness N2/probe phụ.
3. **Cờ `near-threshold-load5` chưa tự ghi trong runner** (§4.1)
   — tính từ `verifySolo.loadSignals.load5Max` khi phân tích.
4. **Nợ đứng chung:** Safari / máy thật / GPU thật / footage
   B-frame / độ phân giải khác / đường `asset:` — vẫn chưa đo.
5. **Điểm yếu ghi log của runner:** NO_RESULT chỉ lưu stdout của
   probe, nuốt stderr — lần sau gặp NO_RESULT thì kiểm tra
   stderr probe trước khi kết luận probe hỏng.

## 7. File đổi/thêm (chỉ của T1 — text, không binary, không dist)

- Sửa: `apps/web/scripts/seek-ab-solo-run.mjs` (REPO 2 lần `".."`
  → 3 lần; thêm export `PROBE_Q6`; chế độ `run` spawn qua
  `PROBE_Q6`).
- Sửa: `apps/web/scripts/seek-ab-solo-run.test.mjs` (thêm 1 test
  hồi quy `PROBE_Q6` tồn tại và không chứa `"apps/apps/"`).
- Mới: `docs/PHASE9_ROUND39_T1_SOLO_AB_LIMITS.md` (file này).
- Không sửa: cổng v2/v3, probe Q6, harness N2, code sản phẩm,
  file của luồng khác, paths-loop, build-loop-log. Không push,
  không tag. Scratch ngoài repo (không stage):
  `~/workspace/tmp-round39-t1-scratch/debug-s1/` (chẩn đoán probe
  §2) và `t1-solo-run.log` (log lần chạy lỗi §1). Evidence solo
  thật: CHƯA CÓ (0 lượt) — thư mục
  `benchmarks/solo-seek-ab-round39/` đã dọn trống, chờ phiên thật
  tạo lại.
