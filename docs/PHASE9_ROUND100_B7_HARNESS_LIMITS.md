# Đợt 100 B7 — Harness: sửa Space-toggle flaky dưới tải + quy tắc phân loại slot-tải-đầu trong lần yên

Ngày: 13/11/2026 (lượt cron 03:35 +07; đo 20:46–21:15Z ngày 12/11).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; boot-id 66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd, KHÔNG reboot
trong cửa sổ đo; load 1-phút 1,58–17,57 trong cửa sổ — 8–10 luồng đợt 100
chạy song song).
Nợ: LIMITS gộp đợt 99 §4 mục 11 (harness Space-toggle flaky dưới tải +
quy tắc phân loại slot-tải-đầu trong lần yên CHƯA CÓ).
Trạng thái G1 trước vòng: G1 VẪN MỞ, chờ user quyết metric G5/M2 (A7/A9
đợt 99). B7 KHÔNG đóng G1, KHÔNG đổi ngưỡng, KHÔNG đổi metric, KHÔNG
sửa production — chỉ sửa harness/probe + thêm quy tắc phân loại.

## 1. Kết luận ngắn

- **Fix Space-toggle ĐÃ LAND vào harness E1** (`clicktest-77e1-deint-fps.mjs`):
  chờ-trạng-thái sau Space (poll `playing` tới khi lật, tối đa 5s/lần)
  + thử lại Space 1 lần + fallback store `setState({playing:<want>})`
  theo mẫu N10/M1 — chỉ throw khi cả 3 đường đều không lật được.
  **9/9 lần E1 hoàn thành, 0 abort** (trước đây A7: 7/8 lần, 1 abort ở
  slot 7); **2/2 lần N10 60fps hoàn thành, 4/4 mỗi lần.**
- **Quy tắc phân loại slot-tải-đầu ĐÃ CÀI** (`deint-fps-verdict.mjs` +
  test riêng 13/13): lần yên (baseline mean ≥ 10 fps) mà **slot 0
  < 6 fps** thì gắn cờ `"yên-slot-tải-đầu"` — vẫn tính vào chân yên cho
  verdict chính, nhưng phân tích độ nhạy phải tính lại pool KHÔNG có
  các lần bị gắn cờ. Quy tắc xác định, test được offline, đã validate
  trên 24 lần lịch sử còn fpsSlots (A7 + Z9, E1 + N10): chỉ đúng 1 lần
  bị gắn cờ — A7 run7, đúng ca gốc.
- **Tính lại run7 với quy tắc mới: chân yên 30fps còn 16/20 = 80%** —
  vẫn đủ mốc 16/20, nhưng HẾT BIÊN (xem §5). Verdict chính không đổi
  (run7 vẫn tính yên PASS); chỉ độ nhạy đổi. Chân yên 60fps không đổi
  (n=14, 14/14 PASS — không lần yên 60fps nào bị gắn cờ).
- **Hạn chế trung thực nhất (§7): đường retry/fallback của fix CHƯA
  bắn thật trong đợt này** — cả 220 lần toggle E1 đều lật ngay bằng
  Space (wave 2 đo được tối đa 66ms; wave 1 không ghi waitedMs nên
  không biết chính xác, chỉ biết không có lần nào retry/fallback).
  Fix được chứng minh bằng cơ chế + 0 abort/9 lần (tỉ lệ abort cũ
  1/8 lần), KHÔNG bằng một lần cứu thật. Đường fallback store thì đã
  có tiền lệ bắn thật 3 lần ở M1/N10.

## 2. Nguyên nhân Space-toggle flaky — ĐÃ XÁC ĐỊNH (không sửa production)

Ca gốc: A7 run2 E1 abort ở slot 7, 17:45:15Z — `"deint slot 7: bấm
Space lần 2 mà playing vẫn true"`, exit 2. Slot 0–6 chạy xong
(baseline ~23 fps), load vọt 3,16 → 9,08 giữa lần đo, slot fps rơi
23 → 8,29.

Điều tra (đọc code, không sửa production):

1. **Store `playing` chỉ đổi qua `togglePlay()`** (`store.ts:922-931`:
   `set({ playing: !playing })`, trừ nhánh phát-lại-khi-hết-video và
   phát ngược — không liên quan slot đo). **Không có vòng lặp nào
   trong app tự set lại `playing=true`** — các lệnh `el.play()` mỗi
   tick trong `preview.tsx` (~4869) chỉ tác động media element, không
   chạm store flag. Kết luận A4 ("app tự gọi play() mỗi tick") nói về
   media element, KHÔNG giải thích được `playing` store vẫn true.
2. **Space đi qua đúng một đường:** keydown `window` trong `App.tsx`
   (`e.code === "Space"` → `st.togglePlay()`), có guard return sớm
   khi focus trong INPUT/TEXTAREA/SELECT/contentEditable và khi là
   phím tắt menu desktop. Harness đã `blur()` activeElement trước mỗi
   Space nên guard này không phải thủ phạm thường xuyên — nhưng nó là
   một đường nuốt event có thật nếu focus kịp rơi vào ô nhập giữa
   `blur()` và keydown.
3. **Cơ chế còn lại duy nhất: keydown chưa được renderer xử lý kịp
   trong cửa sổ chờ cố định 400ms.** Dưới tải (load 9+, slot fps
   ~8), main thread bão hoà — CDP `Input.dispatchKeyEvent` đã gửi
   nhưng handler React/Zustand chưa chạy khi harness đọc `STATE_FN`
   ở +400ms → đọc state cũ (`playing=true`) → throw abort. Bằng
   chứng gián tiếp: slot 7 của run2 kéo dài ~12 giây (bình thường
   ~6,7 giây) — `setEnhCheckbox`/`waitIdle` đã chậm hẳn trước khi
   Space #2 bắn; load 1-phút vọt 3,16 → 9,08 đúng trong lúc đo.
4. **Tiền lệ M1 §6 khớp:** N10 đã gặp đúng lỗi này 3 lần ("Space
   không pause được dưới tải") và đã chữa bằng fallback store
   `useStore.setState({playing:false})` — từ đó N10 không abort nữa
   (A7: 5/5 hoàn thành). E1 KHÔNG có fallback này — đó là khoảng
   trống B7 lấp.

## 3. Fix là gì — chỉ harness E1 (`clicktest-77e1-deint-fps.mjs`)

Hàm cũ `togglePlay()` (Space + sleep cố định 800ms/400ms + throw ngay)
đã XOÁ, thay bằng `togglePlayExpect(want, key, slotIdx, which)`:

1. **Chờ-trạng-thái:** sau mỗi Space, poll `SAMPLE_FN.playing` mỗi
   250ms tới khi về đúng trạng thái mong muốn, tối đa
   `E1_TOGGLE_TIMEOUT_MS` (mặc định 5000ms). Lần 1 chờ `playing=true`,
   lần 2 chờ `playing=false`. Log khi chờ > 1000ms hoặc phải thử lại.
2. **Thử lại Space 1 lần** (`E1_TOGGLE_RETRIES`, mặc định 1) nếu sau
   5s vẫn chưa lật. Chờ đủ lâu trước khi thử lại để keydown đầu (nếu
   chỉ chậm chứ không mất) kịp xử lý — tránh double-toggle: keydown
   chậm + Space thử lại = 2 lần toggle = về như cũ.
3. **Fallback store** (mẫu N10/M1): `useStore.setState({playing:<want>})`
   — set TUYỆT ĐỐI nên không sợ double-toggle với keydown chậm. Thử
   tối đa 2 lần (keydown chậm chỉ có thể lật lại 1 lần vì mỗi Space
   chỉ là 1 event keydown duy nhất). Chỉ khi cả 2 lần fallback đều
   không giữ được trạng thái mới throw — message giữ nguyên cụm cũ
   (`"bấm Space lần 2 mà playing vẫn true"` / `"bấm Space mà playing
   vẫn false"`) để grep log cũ vẫn khớp.
4. **Ghi rõ vào từng slot row:** `playMethod` / `pauseMethod`
   (`"space"` | `"space-retry"` | `"store-fallback"`) và
   `playWaitMs` / `pauseWaitMs` (thời gian chờ lật, ms). **Toggle nào
   > 400ms là lần mà code cũ đã abort** — đọc được trực tiếp từ
   report JSON, không cần suy từ log.
5. **Sample `a` nay lấy SAU KHI xác nhận `playing=true`** (thay cho
   sleep 800 cố định): nếu keydown chậm, cửa sổ đo 3 giây không còn
   bị ăn mất phần đầu khi đang pause — đo sạch hơn (không làm thay
   đổi công thức tỉ lệ, chỉ lấy mẫu đúng lúc hơn).

Chi phí thời gian: lần đo bình thường không chậm thêm (flip ~50ms,
poll đầu tiên đã thấy); chỉ lần nào keydown chậm mới trả thêm tối đa
~10s + fallback trước khi abort — thay cho abort ngay ở 400ms.

**Không sửa:** `probe-86n10-config-fps.mjs` (N10 đã có fallback store
từ M1, A7 5/5 hoàn thành — không có abort để sửa; chỉ ghi nhận ở §7
là N10 chưa có chờ-trạng-thái ở chiều PHÁT, là nợ mở nhỏ).

## 4. Quy tắc phân loại slot-tải-đầu trong lần yên — đã cài

### 4.1 Định nghĩa (`deint-fps-verdict.mjs`, hàm thuần túy, không I/O)

- `IDLE_MEAN_FPS = 10` — baseline mean ≥ 10 fps → lần yên (luật từ X6,
  giữ nguyên).
- `LOAD_SLOT_FPS = 6` — một slot baseline < 6 fps là "slot tải" (tải sâu).
- `classifyIdleRound(baselineSlots)` (6 slot baseline của 1 vòng, đúng
  thứ tự slot 0,2,4,6,8,10): mean < 10 → `"tải"`; mean ≥ 10 và
  slot 0 < 6 → `"yên-slot-tải-đầu"`; mean ≥ 10 và slot 0 ≥ 6 → `"yên"`.
  Trả kèm `loadSlots` (chỉ số các slot < 6 fps, để minh bạch) và
  `slot0Fps`.
- `classifyIdleRun(roundsBaselineSlots)` (1–2 vòng): có vòng tải + vòng
  yên → `"hỗn hợp"` (luật Z9 §3.3, giữ nguyên); mọi vòng yên nhưng ≥1
  vòng bị gắn cờ → `"yên-slot-tải-đầu"`; còn lại `"yên"` / `"tải"`.

### 4.2 Vì sao chỉ slot 0, vì sao ngưỡng 6

- **Chỉ slot 0 mới gắn cờ** ("tải ĐẦU" = đầu lần đo): slot giữa/cuối
  sụt là nhiễu trong lần, không phải tải đầu. Ví dụ: A7 N10 run3 slot
  2 (chỉ số 1) = 5,01 fps nhưng slot 0 = 10,83 → yên sạch; A7 N10
  run5 slot 8 = 2,74 fps nhưng slot 0 = 16,62 → yên sạch. Các slot
  này vẫn liệt kê trong `loadSlots`, chỉ không đổi mode.
- **Ngưỡng 6 chọn từ dữ liệu thật, không đặt tay mò:** run7 slot 0 =
  5,52 và slot 4 = 5,93 (cả hai < 6); Z9 run4 slot thấp nhất 6,47
  (≥ 6, không gắn cờ — khớp cách Z9 đã tính yên không caveat); các
  lần yên sạch khác có slot thấp nhất ≥ 9,72 (Z9 run1). 6 nằm giữa
  hai nhóm, không lần lịch sử nào rơi vào vùng mơ hồ 6,0–6,47.
- **Lần bị gắn cờ VẪN TÍNH vào chân yên cho verdict chính** (như A7
  đã tính run7) — quy tắc chỉ thêm nhãn + bắt buộc phân tích độ nhạy
  (tính lại pool không có các lần bị gắn cờ). Nếu loại hết lần gắn cờ
  mà mốc không còn đủ thì kết luận "đủ mốc" phải ghi rõ là phụ thuộc
  vào các lần đó (xem §5).

### 4.3 Validate trên 24 lần lịch sử còn fpsSlots (A7 + Z9)

Script: `hidden_files/round100-b7/validate-rule.py` (đọc report JSON
thật, không sửa). Kết quả: **chỉ đúng 1/24 lần bị gắn cờ — A7 run7**;
Z9 run4 yên sạch (slot 0 = 6,47); Z9 run5 hỗn hợp (vòng 1 yên +
vòng 2 tải, đúng luật cũ); mọi lần tải vẫn tải kể cả khi slot 0 cao
(Z9 run6 slot 0 = 20,36 nhưng mean 6,73 → tải; A7 run3 vòng 1 slot 0
= 10,17 nhưng mean 8,10 → tải). Không lần nào đổi mode ngoài run7
được gắn thêm cờ.

### 4.4 Gắn vào harness

E1 ghi `idleClass` vào từng `g5Rounds[i]` và `g5Verdict.idleClass`
trong report JSON + log một dòng `"Phân loại yên/tải (đợt 100 B7): ..."`
mỗi lần chạy — report đọc được mà không cần tính lại từ `fpsSlots`.

## 5. Tính lại verdict các lần cũ với quy tắc mới

Script: `hidden_files/round100-b7/recompute-pool100b7.py`, nguồn
`benchmarks/results/g1-evidence-v10-99a7.json` (pool A7 đã công bố),
cùng công thức CI t-Student như `analyze-pool99a7.py`. **Tái tạo đúng
số A7 trước khi loại** (chân yên 30fps n=21, median 0,940, mean 0,915,
PASS 17/21; CI tính lại [0,849; 0,982] so với A7 công bố [0,852; 0,979]
— lệch 0,003 do làm tròn hệ số t, không đổi kết luận).

| Pool | A7 công bố | Không run7 (quy tắc mới) |
|---|---|---|
| Chân yên 30fps | n=21, median 0,940, mean 0,915, CI [0,852; 0,979], **PASS 17/21 = 81%** | n=20, median 0,935, mean 0,910, CI [0,841; 0,979], **PASS 16/20 = 80%** |
| Chân yên 60fps | n=14, median 0,945, mean 0,956, CI [0,927; 0,984], 14/14 = 100% | **không đổi** (không lần yên 60fps nào bị gắn cờ) |

- **Mốc 16/20 vẫn đủ, nhưng hết biên:** 16/20 = 80% đúng ngưỡng;
  cả ba tiêu chí chặt vẫn đạt (median 0,935 ≥ 0,75 ✓; PASS 80% ✓;
  CI cận dưới 0,841 ≥ 0,75 ✓) — nhưng 1 lần FAIL yên nữa là về
  16/21 = 76%.
- **Verdict chính KHÔNG đổi:** run7 vẫn tính yên PASS (1,02×);
  pool 30fps gộp (57/66) và pool 60fps (44/47) không đổi vì quy tắc
  chỉ thêm nhãn, không loại lần nào khỏi pool chính.
- **Giới hạn của phép tính lại:** chỉ 13/21 lần yên 30fps còn fpsSlots
  để kiểm (A7 7 lần + Z9 6 lần — trong đó chỉ run7 bị gắn cờ); 8 lần
  yên cũ hơn (I5/J3/L3/T6/U6/V5/X6) đã mất fpsSlots nên KHÔNG kiểm
  lại được — phép tính trên giả định chúng yên sạch như đã công bố.
  Nếu một lần cũ thực ra cũng có slot-tải-đầu thì chân yên còn thấp
  hơn 16/20. Ghi rõ giả định này, không giấu.

## 6. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ harness/probe + test (xem §8) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** xanh (giữ nguyên, không đụng) |
| `node --test deint-fps-verdict-100b7.test.mjs` (mới, 13 test luật phân loại) | **13/13** xanh |
| `node deint-fps-verdict.mjs` (self-test) | **16 case PASS hết** |
| `node --check` 3 script đã sửa/mới | **PASS** cả ba |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** |
| `npx vite build` (apps/web) | **pass, 7,28s** (cảnh báo chunk > 500kB có từ trước) |
| E1 30fps ×9 lần headed, harness mới (20:46–21:15Z) | **9/9 hoàn thành, 10/10 mỗi lần, 0 abort, 0 `HARNESS LỖI`** — G5: 1,01 / 1,05 / 1,06 / 1,00 (2 vòng) / 1,49 / 0,98 / **0,95 / 0,98 / 0,96 (3 lần yên)**; baseline: 6,00 / 6,53 / 8,38 / 2,53+2,96 / 3,70 / 4,93 / **18,26 / 17,76 / 18,96**; mode: tải ×6, yên ×3 |
| N10 60fps ×2 lần (probe chưa sửa — chỉ để phân loại + đối chứng) | **2/2 hoàn thành, 4/4 mỗi lần** — run1 0,86× yên (baseline 13,98, slot0 14,17 → yên sạch); run2 0,91× tải (baseline 5,15) |
| Toggle: 220 lần Space E1 (9 lần × 11 slot × 2, lần 4 có 2 vòng) | **0 lần retry, 0 lần fallback** — tất cả lật ngay bằng Space; wave 2 (lần 7–9, có ghi waitedMs): play max 66ms, pause max 52ms; wave 1 (lần 1–6) chưa ghi waitedMs (instrument thêm sau lần 6) nên chỉ biết không retry/fallback, không biết chính xác latency |
| Pixel 9 lần E1 mới | G2 MAD 0,5821; G7a MAD 0,6903; G7b MAD 0,0119; G8 MAD 1,5522 — **giống hệt lịch sử N5→A7 cả 9 lần** (harness mới không đụng đường vẽ) |
| H9/C3 (mọi lần chạy B7) | **0 lỗi trang** (E1 10/10 ×9, N10 4/4 ×2) |
| Harness md5 trước/sau mỗi lần | **không đổi trong từng lần** (E1 script đổi 1 lần GIỮA wave 1 và wave 2 để thêm waitedMs — cùng logic toggle, chỉ thêm ghi số; xem §7) |
| Không process mồ côi sau đo | không vite/chrome/xvfb nào của B7 còn chạy; boot-id không đổi 66fb273d, không reboot trong cửa sổ đo |

## 7. Giới hạn — đọc trước khi trích số

1. **Đường retry/fallback CHƯA bắn thật.** Cả 220 toggle đều lật ngay
   bằng Space. Bằng chứng fix hiệu quả là: (a) cơ chế — flip chậm
   0,4–10s nay được hấp thụ thay vì abort ở 400ms, chỉ flip chậm
   >10s + fallback hỏng 2 lần mới abort; (b) 0 abort/9 lần dưới load
   1,58–17,57, so với tỉ lệ abort cũ 1/8 lần (A7); (c) đường fallback
   store đã bắn thật 3 lần ở M1/N10. Nhưng (a) là lập luận cơ chế,
   (b) với n=9 chưa đủ mạnh thống kê (nếu tỉ lệ abort cũ giữ nguyên,
   P(0 abort/9 lần) ≈ 30%), (c) là của N10, không phải của E1.
   **Đừng trích "fix đã cứu X lần" — chưa có lần cứu nào.**
2. **Wave 1 (lần 1–6) không có waitedMs** — instrument `playWaitMs` /
   `pauseWaitMs` chỉ thêm vào sau lần 6. Không khẳng định được latency
   toggle lớn nhất trong wave 1; chỉ khẳng định không lần nào vượt
   quá 5s (vì không retry) và không lần nào fallback.
3. **Tính lại chân yên (§5) giả định 8 lần yên cũ là yên sạch** (mất
   fpsSlots, không kiểm lại được). Nếu một lần cũ cũng có slot-tải-đầu
   thì chân yên sau khi loại còn dưới 16/20.
4. **Chân yên sau khi loại run7 chỉ vừa đủ mốc (16/20 = 80%, hết
   biên)** — 1 lần FAIL yên nữa là về 16/21 = 76%. Đừng trích "đủ
   mốc" mà không ghi "hết biên".
5. **N10 chưa có chờ-trạng-thái ở chiều PHÁT** (chỉ có fallback ở
   chiều DỪNG từ M1): N10 vẫn throw ngay nếu `a.playing` false sau
   800ms. A7 N10 5/5 + B7 N10 2/2 chưa abort ở chiều này, nhưng cùng
   lỗi tiềm ẩn như E1 cũ. Nợ mở cho đợt sau nếu muốn đồng bộ.
6. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 8–10 luồng song
   song.** Cửa sổ yên đợt này mở muộn (lần 7–9, sau 21:10Z khi load
   hạ xuống ~1,6); 6 lần đầu toàn tải (baseline 2,53–8,38 fps).
   G5 các lần tải (1,49× lần 5) vẫn là số phồng do tải, đừng trích
   làm tốc độ deint.
7. **E1 script đổi giữa wave 1 và wave 2** (thêm `playWaitMs` /
   `pauseWaitMs` vào row — md5 62b0976e → 400efa0a). Logic toggle
   giống hệt nhau ở cả hai bản; chỉ khác ghi số. N10 không dùng
   script này nên không ảnh hưởng.
8. **`vite build` đã chạy lại** (kiểm chứng §6) và ghi đè `apps/web/dist/`
   — đó là output build, KHÔNG đưa vào batch stage.
9. G1 vẫn MỞ, chờ user quyết metric G5/M2 — B7 không thay đổi gì ở
   quyết định này; birefnet 0 lần thành công; TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user.

## 8. Cách chạy lại

```bash
# 1 lần E1 30fps bằng harness mới (đổi E1_SCRATCH mỗi lần; chạy tuần tự):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round100-b7/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# 1 lần N10 60fps (probe chưa sửa — phân loại offline từ fpsSlots):
N10_LABEL=60fps-deint-runX N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round100-b7/60fps-deint-runX \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Test offline (luật verdict 98Z8 + luật phân loại slot-tải-đầu đợt 100 B7):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs   # 17/17
node --test apps/web/scripts/deint-fps-verdict-100b7.test.mjs  # 13/13
# Validate quy tắc trên 24 lần lịch sử + tính lại chân yên:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round100-b7/validate-rule.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round100-b7/recompute-pool100b7.py
# Ép timeout toggle (chỉ để xem log chờ-trạng-thái; KHÔNG dùng cho số đo pool):
E1_TOGGLE_TIMEOUT_MS=5000 E1_TOGGLE_RETRIES=1 node apps/web/scripts/clicktest-77e1-deint-fps.mjs
```

## 9. File đã đổi/thêm (stage, không push)

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` — fix Space-toggle
  (`togglePlayExpect` + `waitPlaying` + ghi `playMethod`/`pauseMethod`/
  `playWaitMs`/`pauseWaitMs` vào slot row + gắn `idleClass` vào
  `g5Rounds`/`g5Verdict`).
- `apps/web/scripts/deint-fps-verdict.mjs` — `IDLE_MEAN_FPS` /
  `LOAD_SLOT_FPS` / `classifyIdleRound` / `classifyIdleRun`.
- `apps/web/scripts/deint-fps-verdict-100b7.test.mjs` (mới) — 13 test
  luật phân loại, số thật A7/Z9.
- `docs/PHASE9_ROUND100_B7_HARNESS_LIMITS.md` (file này).
- Log + dữ liệu thô: `hidden_files/round100-b7/` (boot-id, runs.log,
  runs-wave2.log, e1-run1..9 + log, 60fps-deint-run1..2 + log,
  validate-rule.py, recompute-pool100b7.py, run-b7.sh, run-b7-wave2.sh).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round100-b7-harness.txt`.
