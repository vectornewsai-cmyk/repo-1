# Đợt 101 C8 — Harness: chứng minh đường retry/fallback Space-toggle bắn thật + N10 chờ-trạng-thái chiều PHÁT

Ngày: 13/11/2026 (lượt cron 06:35 +07; đo 23:54Z 12/11 – 00:06Z 13/11).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; boot-id 3a12a7d3-4230-4835-800b-5f34e015c7eb — reboot #25
~23:52:16Z, xem §7; load 1-phút 0,69–14,35 trong cửa sổ — 8–10 luồng đợt
101 chạy song song; RAM khả dụng 1278 MB lúc driver bắt đầu).
Nợ: LIMITS gộp đợt 100 §4 (từ B7) — đường retry/fallback của fix B7 CHƯA
bắn thật + N10 chưa có chờ-trạng-thái ở chiều PHÁT.
Trạng thái G1 trước vòng: G1 VẪN MỞ, chờ user quyết metric G5/M2. C8 KHÔNG
đóng G1, KHÔNG đổi ngưỡng, KHÔNG đổi metric, KHÔNG sửa production — chỉ
sửa harness/probe (E1 + N10) + thêm fault-injection env-gated trong
harness E1 (mặc định TẮT).

## 1. Kết luận ngắn

- **Đường retry ĐÃ bắn thật (lần đầu tiên):** E1 fault-retry — keydown
  Space #1 bị nuốt, sau 5066ms `playing` vẫn false → thử lại Space #2
  → lật sau 28ms, `playMethod="space-retry"`, lần đo hoàn thành 11/11,
  G5 1,07×. Harness cũ (sleep 400ms + throw ngay) đã abort ở ca này —
  vì `playing` vẫn false sau 5066ms, vượt xa 400ms.
- **Đường fallback store ĐÃ bắn thật (lần đầu tiên ở E1):** E1
  fault-fallback — cả 2 keydown Space bị nuốt, sau 5282ms + 5279ms
  `playing` vẫn false → fallback store `setState({playing:true})` lần 1
  → lật sau 13ms, `playMethod="store-fallback"`, lần đo hoàn thành 11/11,
  G5 1,06×. Harness cũ cũng đã abort ở ca này.
- **N10 chiều PHÁT nay có chờ-trạng-thái** (theo mẫu E1/B7: poll
  `playing` tối đa 5s/lần + thử lại Space 1 lần + fallback store 2 lần,
  cả hai chiều; mỗi slot ghi `playMethod`/`pauseMethod` +
  `playWaitMs`/`pauseWaitMs`). **2/2 lần N10 60fps hoàn thành, 11/11
  mỗi lần** — 1,08× và 0,99× (cả hai tải), so với B7 0,86× yên / 0,91×
  tải: cùng tầm, không hồi quy (chênh do tải, không do đổi toggle — xem
  §5).
- **0 abort vẫn giữ sau thay đổi:** 5/5 lần chạy exit 0 (3 E1 + 2 N10),
  55 slot, 110 toggle, 1 retry + 1 fallback (cả hai đều cứu thật),
  0 abort. E1 thường (fault TẮT) 22/22 toggle `"space"`, playWaitMs tối
  đa 199ms. Pixel G2/G7a/G7b/G8 giống hệt lịch sử B7 cả 3 lần E1
  (MAD 0,5821 / 0,6903 / 0,0119 / 1,5522) — harness mới không đụng đường
  vẽ. H9/C3 0 lỗi trang cả 5 lần.
- **Hạn chế trung thực nhất (§7):** đường retry/fallback của N10 chiều
  PHÁT (mới thêm) CHƯA bắn thật — cả 44 toggle N10 đều `"space"`;
  và vòng lặp fallback thứ 2 của E1 (keydown muộn lật lại sau fallback
  #1) CHƯA bắn thật — fault-injection dọn listener ngay sau toggle nên
  keydown phát lại muộn không bao giờ tới. Cơ chế đã chứng minh xong ở
  E1; N10 dùng đúng cơ chế đó nhưng chưa có lần cứu thật.

## 2. Phương pháp fault-injection — keydown chậm > 400ms có kiểm soát

Không dùng tải CPU nhân tạo (không định lượng được, làm bẩn số đo FPS)
mà dùng **fault-injection trong harness/test** (env-gated, mặc định TẮT,
không sửa hành vi production):

- Cài đặt: listener capture-phase trên `window` trong trang đo, chỉ
  chặn `keydown` có `code === "Space"` (số lượng `E1_FAULT_KEYDOWN_COUNT`
  lần đầu, ở đúng slot `E1_FAULT_SLOT`, chiều `E1_FAULT_WHICH`).
  `stopImmediatePropagation()` chặn handler Space của `App.tsx`
  (`window.addEventListener("keydown", onKey)`, bubble-phase, không
  check `isTrusted`) — keydown "chưa được xử lý kịp" y hệt ca gốc A7
  run2 slot 7, nhưng có kiểm soát và đo được.
- Keydown bị nuốt được lên lịch phát lại sau `E1_FAULT_KEYDOWN_DELAY_MS`
  bằng `setTimeout` + `KeyboardEvent` tổng hợp (`code: "Space"`,
  đánh dấu `__e1FaultRedispatch` để listener không nuốt lại chính nó).
- Dọn ngay sau khi toggle xong (cả 3 đường thoát của
  `togglePlayExpect`: space / space-retry / store-fallback / throw):
  gỡ listener + `clearTimeout` các lần phát lại đang chờ — keydown
  muộn không lọt vào cửa sổ đo 3s của slot, slot đo sạch.
- Kịch bản: `DELAY=7000 + COUNT=1` → Space #1 quá hạn 5s → retry bắn;
  `DELAY=12000 + COUNT=2` → cả 2 Space quá hạn 5s+5s → fallback bắn.
  Chứng cứ thời gian (log UTC): F1 Space #1 ~23:55:17, timeout lần 1
  23:55:22.595 (5066ms), retry lật 23:55:23.038 (28ms), dọn 23:55:23.216
  — TRƯỚC lịch phát lại 23:55:24. F2 Space #1 ~23:58:26, timeout lần 1
  23:58:32.017 (5282ms), timeout lần 2 23:58:37.716 (5279ms), fallback
  lật 23:58:37.741 (13ms), dọn 23:58:37.845 — TRƯỚC cả hai lịch phát lại
  (~23:58:38 và ~23:58:44). Retry/fallback cứu thật, không phải keydown
  phát lại muộn vô tình lật.

## 3. Thay đổi code — chỉ harness/probe, không sửa production

### 3.1 E1 `clicktest-77e1-deint-fps.mjs`

- Thêm env fault-injection (mặc định TẮT): `E1_FAULT_KEYDOWN_DELAY_MS`
  (0), `E1_FAULT_KEYDOWN_COUNT` (0), `E1_FAULT_SLOT` (0),
  `E1_FAULT_WHICH` ("lần 1"); `FAULT_INSTALL_FN` /
  `FAULT_CLEANUP_FN` (chuỗi eval cài/gỡ listener capture-phase).
- `togglePlayExpect`: cài fault (nếu đúng slot/chiều) trước lần Space
  đầu, dọn sau khi toggle xong ở mọi đường thoát. Không đổi logic
  chờ-trạng-thái / retry / fallback của B7; không đổi ngữ nghĩa
  `playWaitMs`/`pauseWaitMs` (thời gian chờ của lần thử THÀNH CÔNG —
  tổng thời gian toggle của slot fault chỉ đọc được từ timestamp log,
  xem §7).
- Lưu ý: fault áp cho slot 0 của MỖI vòng G5 nếu lần 2 chạy (vùng xám);
  đợt này cả 3 lần đều 1 vòng nên chỉ slot 0 vòng 1 bị fault.

### 3.2 N10 `probe-86n10-config-fps.mjs`

- Thêm `N10_TOGGLE_TIMEOUT_MS` (5000), `N10_TOGGLE_RETRIES` (1);
  `waitPlaying(want, timeoutMs)` (poll `SAMPLE_FN.playing` mỗi 250ms)
  + `togglePlayExpect(want, key, slotIdx, which)` theo đúng mẫu E1/B7.
  Hàm `togglePlay()` cũ (Space + không chờ) đã XOÁ để khỏi dùng nhầm.
- Chiều PHÁT: thay `togglePlay(); sleep(800); if (!a.playing) throw`
  bằng `togglePlayExpect(true, ...)`; sample `a` lấy SAU KHI xác nhận
  `playing=true` (mẫu E1/B7 §3.5). Chiều DỪNG: thay sleep 400 + kiểm
  1 lần + fallback 1 lần bằng `togglePlayExpect(false, ...)` (chờ +
  thử lại + fallback 2 lần). Giữ nguyên cụm message lỗi cũ
  ("bấm Space mà playing vẫn false" / "bấm Space lần 2 mà playing vẫn
  true" / "Space + store-fallback đều không pause được") để grep log cũ
  vẫn khớp. Row thêm `playMethod`/`playWaitMs`/`pauseWaitMs`
  (trước chỉ có `pauseMethod`).

## 4. Kết quả đo

Driver: `hidden_files/round101-c8/run-c8.sh` (tuần tự 5 lần, md5 harness
trước/sau mỗi lần — không đổi cả 5 lần:
E1 `d18e04653cea44c7ce8e6bc6d0f4dcde`,
N10 `3bc93119839a298ad743b2144b398e41`).
Cả 5 lần đều mode **tải** (load 0,69–14,35) — không lần yên nào, không
đóng góp thêm vào chân yên G1.

### 4.1 E1 30fps ×3

| Lần | Exit | Slot | G5 (tỉ lệ drift-corrected) | Baseline mean | Mode | Toggle slot 0 |
|---|---|---|---|---|---|---|
| fault-retry (DELAY 7000, COUNT 1) | 0 | 11/11 | **1,07×** (0,28/1,44/1,02/1,20/1,40) | 4,76 fps (slot 0: 13,81) | tải | play `space-retry` (lần 1: 5066ms không lật; lần 2: lật 28ms) |
| fault-fallback (DELAY 12000, COUNT 2) | 0 | 11/11 | **1,06×** (0,97/1,07/1,30/0,97/1,01) | 6,00 fps | tải | play `store-fallback` (lần 1: 5282ms; lần 2: 5279ms; fallback #1 lật 13ms) |
| normal-run1 (fault TẮT) | 0 | 11/11 | **1,12×** (1,16/1,27/0,69/0,61/1,89) | 6,20 fps | tải | 22/22 `space` |

- Tổng E1: 66 toggle, **1 retry + 1 fallback (cả hai cứu thật)**,
  0 abort. Toggle không fault: playWaitMs tối đa 374ms (F1) / 298ms
  (F2) / 199ms (thường); pauseWaitMs tối đa 217 / 87 / 91ms.
- Tỉ lệ G5 dao động rộng (0,28–1,89) do baseline chỉ 2–14 fps dưới
  tải — cùng caveat như B7: số tải phồng, đừng trích làm tốc độ deint.
- Pixel cả 3 lần giống hệt lịch sử B7: G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 1,5522. H9 0 lỗi trang ×3.

### 4.2 N10 60fps deint-only ×2 (chờ-trạng-thái chiều PHÁT mới)

| Lần | Exit | Slot | Tỉ lệ drift-corrected | Baseline mean | Combo mean | Mode | Toggle |
|---|---|---|---|---|---|---|---|
| c8-run1 | 0 | 11/11 | 0,89/0,92/1,62/1,22/0,77 → **1,08×** | 4,53 fps (slot 0: 4,22) | 5,00 fps | tải | 22/22 `space` (playWait ≤ 125ms, pauseWait ≤ 206ms) |
| c8-run2 | 0 | 11/11 | 0,93/0,50/1,03/1,32/1,17 → **0,99×** | 4,55 fps (slot 0: 2,95) | 4,49 fps | tải | 22/22 `space` (playWait ≤ 414ms, pauseWait ≤ 84ms) |

- C1 cả hai lần: hook tap=true, MAD vs baseline = 0,3835 (5,77%
  pixel đổi) — config áp thật. C3 0 lỗi trang ×2.
- So với B7 (0,86× yên / 0,91× tải): C8 1,08× tải / 0,99× tải —
  cùng tầm, **không hồi quy**. Chênh lệch do tải (baseline B7 run1 yên
  13,98 fps; C8 cả hai lần tải ~4,5 fps), không do đổi toggle: code
  toggle mới chỉ thay cách CHỜ (sleep cố định → poll), không đổi cách
  lấy mẫu (sample `a` sau khi xác nhận playing, như E1).

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ harness/probe (xem §3) |
| `node --check` 2 script đã sửa | **PASS** cả hai |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** xanh |
| `node --test deint-fps-verdict-100b7.test.mjs` | **13/13** xanh |
| `node deint-fps-verdict.mjs` (self-test) | **16 case PASS hết** |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (chạy lại sau reboot #25 — lần đầu bị service restart giết giữa chừng, xem §7) |
| `npx vite build` (apps/web) | **pass, 10,03s** (cảnh báo chunk > 500kB có từ trước) |
| E1 ×3 (fault-retry, fault-fallback, thường) | **3/3 exit 0, 11/11 mỗi lần, 0 abort** — retry + fallback bắn thật mỗi đường 1 lần (§4.1) |
| N10 60fps ×2 | **2/2 exit 0, 11/11 mỗi lần, 0 abort** — 44/44 toggle `"space"` (§4.2) |
| Harness md5 trước/sau mỗi lần | **không đổi cả 5 lần** (E1 d18e0465…, N10 3bc93119…) |
| Pixel E1 ×3 | G2/G7a/G7b/G8 MAD giống hệt lịch sử B7 (0,5821/0,6903/0,0119/1,5522) |
| H9/C3 (mọi lần chạy C8) | **0 lỗi trang** (E1 11/11 ×3, N10 11/11 ×2) |
| Không process mồ côi sau đo | vite/chrome/xvfb của C8 đã tắt hết; các process còn chạy là của luồng C5/C7 đợt 101 (vite :5173 từ 23:52, probe101c5, e1-run7 của C7) — không phải C8 |

## 6. Cách chạy lại

```bash
# Fault retry (E1, slot 0 chiều PHÁT — nuốt 1 Space, phát lại sau 7s):
E1_FAULT_KEYDOWN_DELAY_MS=7000 E1_FAULT_KEYDOWN_COUNT=1 E1_FAULT_SLOT=0 \
  E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c8/e1-fault-retry \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Fault fallback (nuốt 2 Space, phát lại sau 12s):
E1_FAULT_KEYDOWN_DELAY_MS=12000 E1_FAULT_KEYDOWN_COUNT=2 E1_FAULT_SLOT=0 \
  E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c8/e1-fault-fallback \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# E1 thường (fault TẮT — mặc định):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c8/e1-normal-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# N10 60fps (chờ-trạng-thái chiều PHÁT mới):
N10_LABEL=60fps-deint-c8-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c8/60fps-deint-c8-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Driver chạy cả 5 lần tuần tự:
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c8/run-c8.sh
```

## 7. Giới hạn — đọc trước khi trích số

1. **Đường retry/fallback của N10 chiều PHÁT chưa bắn thật.** Cả 44
   toggle N10 đều `"space"` (playWaitMs tối đa 414ms — dưới ngưỡng
   800ms của code cũ nên code cũ cũng không abort). Cơ chế N10 là bản
   sao đúng mẫu E1 đã chứng minh bắn thật ở §4.1, nhưng bản thân N10
   chưa có lần cứu thật. Đừng trích "N10 đã cứu X lần".
2. **Vòng lặp fallback thứ 2 của E1 chưa bắn thật.** Fault-injection
   dọn listener ngay sau toggle xong (thiết kế để slot đo sạch) nên
   keydown phát lại muộn không bao giờ tới — trường hợp "keydown chậm
   lật lại sau fallback #1, phải fallback #2 mới giữ được" vẫn chỉ là
   lập luận code, chưa có lần bắn thật. Muốn chứng minh cần kịch bản
   fault không hủy lịch phát lại (để keydown muộn lọt vào đúng cửa sổ
   xác nhận fallback) — chưa làm, vì sẽ làm bẩn slot đo.
3. **`playWaitMs`/`pauseWaitMs` là thời gian chờ của lần thử THÀNH
   CÔNG, không phải tổng thời gian toggle.** Slot fault F1: playWaitMs
   ghi 28ms nhưng tổng toggle ~6,2s (5066ms lần 1 + retry); F2:
   playWaitMs 13ms, tổng ~11,6s. Tổng thời gian chỉ đọc được từ
   timestamp log. Đừng trích "toggle chỉ mất 28ms" cho ca fault.
4. **Cả 5 lần đều tải, không lần yên nào** — không đóng góp thêm vào
   chân yên G1; G5 các lần này (1,06–1,12×) là số phồng do tải, đừng
   trích làm tốc độ deint (tỉ lệ từng slot 0,28–1,89).
5. **N10 run2 có 1 toggle play chậm 414ms** (không retry — dưới 5s
   timeout nên chỉ chờ rồi lật). Đó là keydown chậm thật dưới tải
   (load 14,35 lúc bắt đầu run2), được hấp thụ bởi chờ-trạng-thái —
   code cũ (sleep 800ms) cũng hấp thụ được ca này nên không tính là
   "cứu", chỉ ghi nhận đường chờ đã hoạt động ngoài đời.
6. **Reboot #25 ~23:52:16Z trong phiên** (boot aa3f2b67 → 3a12a7d3;
   uptime 7 phút lúc 23:59:16Z). Lần chạy `tsc` + `vite build` đầu
   tiên bị service restart giết giữa chừng (file /tmp mất sau reboot);
   đã chạy lại sau reboot trên boot mới: tsc 0, vite build pass 10,03s.
   Mọi lần đo C8 đều trên boot 3a12a7d3. Giờ reboot này ghi cho luồng
   EPERM đợt 101 (khoảng mù #19 bắt đầu sau reboot #24 ~21:41:50Z —
   nay đã có reboot #25 kẹp giữa).
7. **`vite build` đã chạy lại** (kiểm chứng §5) và ghi đè
   `apps/web/dist/` — đó là output build, KHÔNG đưa vào batch stage.
8. G1 vẫn MỞ, chờ user quyết metric G5/M2 — C8 không thay đổi gì ở
   quyết định này; birefnet 0 lần thành công (không thử — RAM ~1,3 GB
   khả dụng); TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ user.

## 8. File đã đổi/thêm (stage, không push)

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` — fault-injection
  keydown chậm (env-gated, mặc định TẮT) + dọn listener sau toggle.
- `apps/web/scripts/probe-86n10-config-fps.mjs` — chờ-trạng-thái chiều
  PHÁT (và đồng bộ chiều DỪNG) theo mẫu E1/B7; `playMethod`/
  `playWaitMs`/`pauseWaitMs` vào slot row; `togglePlay()` cũ đã xoá.
- `docs/PHASE9_ROUND101_C8_HARNESS_LIMITS.md` (file này).
- Log + dữ liệu thô: `hidden_files/round101-c8/` (runs.log, driver.out,
  run-c8.sh, e1-fault-retry + log, e1-fault-fallback + log,
  e1-normal-run1 + log, 60fps-deint-c8-run1/2 + log).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round101-c8-harness.txt`.
