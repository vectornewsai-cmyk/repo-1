# Đợt 102 D7 — Harness: O8 2 engine + N10 retry/fallback chiều PHÁT bắn thật + vòng lặp fallback thứ 2 của E1 bắn thật

Ngày: 13/11/2026 (lượt cron 09:35 +07; đo 02:44–03:06Z).
Máy đo: VM này (CPU-only, Chromium qua Xvfb + CDP `--disable-gpu`, WebKitGTK 27.2;
boot-id 249407b6-27ba-436a-9aab-abcbde721eb8 — boot MỚI sau reboot #26, xem §7;
load 1-phút 0,67–25,38 trong cửa sổ — 8–10 luồng đợt 102 chạy song song, D8 chạy
E1/N10 cùng lúc; RAM khả dụng 1030–4303 MB).
Nợ: LIMITS gộp đợt 101 §4 mục 1 + §1 C8 — đường retry/fallback N10 chiều PHÁT
chưa bắn thật (44/44 toggle `"space"` ở C8) + vòng lặp fallback thứ 2 của E1
chưa bắn thật (fault C8 dọn listener nên keydown phát lại muộn không tới).
Trạng thái G1 trước vòng: G1 VẪN MỞ, chờ user quyết metric G5/M2. D7 KHÔNG
đóng G1, KHÔNG đổi ngưỡng, KHÔNG đổi metric, KHÔNG sửa production — chỉ sửa
harness/probe (N10 + E1, fault-injection env-gated, mặc định TẮT).

## 1. Kết luận ngắn

- **O8 cả 2 engine 21/21, giống hệt đợt 101:** Chromium 21/21 (S5 Δx=0,112;
  S7 mask 0,112 / bóng 0,113), WebKit 21/21 (S5 Δx=0,194; S7 mask 0,194 /
  bóng 0,197). Fixture md5 khớp đợt 101 từng byte (white `07bc0cb9…`,
  ball `6df873f7…`, track `cdf9a252…`). 0 retry trong đo S5/S7.
- **Đường retry của N10 chiều PHÁT ĐÃ bắn thật (lần đầu tiên):** N10
  fault-retry — keydown Space #1 slot 0 bị nuốt, sau 5310ms `playing`
  vẫn false → thử lại Space #2 → lật sau 69ms, `playMethod="space-retry"`,
  lần đo hoàn thành 11/11, tỉ lệ 1,08× (C1 MAD 0,3835 — config áp thật).
- **Đường fallback của N10 chiều PHÁT ĐÃ bắn thật (lần đầu tiên):** N10
  fault-fallback lần 2 — cả 2 keydown Space bị nuốt (5095ms + 5407ms
  không lật) → fallback store `setState({playing:true})` lần 1 → lật sau
  158ms, `playMethod="store-fallback"`, lần đo hoàn thành 11/11, 4/4 pass.
  (Lần 1 exit=2 mount timeout do tải 16,35 — chết trước khi fault được
  cài; chạy lại lần 2 mới bắn. Xem §4.2.)
- **Vòng lặp fallback thứ 2 của E1 ĐÃ bắn thật (lần đầu tiên):** E1 FB2 —
  cả 2 Space bị nuốt (5284ms + 5106ms) → fallback #1 setState → keydown
  Space muộn tổng hợp lật lại `playing=false` → wait 2s của fallback #1
  chạy hết (2120ms) → fallback #2 setState → lật sau 112ms,
  `playMethod="store-fallback"`, lần đo hoàn thành 10/10, G5 run1 PASS
  1,17× (tải — đừng trích làm tốc độ deint). Đồng thời chứng minh keydown
  tổng hợp qua `window.dispatchEvent` toggle được thật (handler Space của
  App.tsx không check `isTrusted`) — điều C8 mới giả định.
- **0 abort vẫn giữ sau thay đổi:** 3/3 lần fault hoàn thành exit 0
  (N10 retry, N10 fallback lần 2, E1 FB2), 33 slot, 66 toggle,
  1 retry + 2 fallback (cả ba đều cứu thật), 0 abort. Pixel E1 FB2 giống
  hệt lịch sử B7/C8 (G2 MAD 0,5821 / G7a 0,6903 / G7b 0,0119 / G8 1,5522).
  H9/C3 0 lỗi trang cả 3 lần.
- **Verify sau land:** thêm 1 lần N10 fault-retry trên file thật (exit 0,
  11/11 slot, 4/4 pass, slot 0 `space-retry` sau timeout 5084ms) — xem §5.
  Tổng cộng D7: 4 lần fault hoàn thành, 44 slot, 88 toggle, 2 retry +
  2 fallback cứu thật, 0 abort.
- **Hạn chế trung thực nhất (§7):** cả 3 lần fault đều tải nặng (baseline
  1,6–3,48 fps), tỉ lệ 1,08–1,89× là số phồng do tải; N10 fallback lần 2
  có mơ hồ ±100–200ms về redispatch #1 vs setState (xem §5.3 — không đổi
  kết luận vì cả 2 Space đều đã chứng minh không lật + slot đo sạch sau đó).

## 2. Phương pháp fault-injection

### 2.1 N10 — port đúng cơ chế E1/C8

Thêm vào `probe-86n10-config-fps.mjs` đúng bộ env + hàm của E1 (đổi tên
`__n10Fault` / `N10_FAULT_*`): listener capture-phase trên `window` chỉ
chặn `keydown` có `code === "Space"` (số lượng `N10_FAULT_KEYDOWN_COUNT`
lần đầu, ở đúng slot `N10_FAULT_SLOT`, chiều `N10_FAULT_WHICH`),
`stopImmediatePropagation()` chặn handler Space của `App.tsx`; keydown bị
nuốt được phát lại sau `N10_FAULT_KEYDOWN_DELAY_MS` bằng `setTimeout` +
`KeyboardEvent` tổng hợp (đánh dấu `__n10FaultRedispatch`); dọn listener +
`clearTimeout` các lần phát lại đang chờ ngay sau khi toggle xong ở mọi
đường thoát (space / space-retry / store-fallback / throw) — mẫu E1.
Kịch bản: `DELAY=7000 + COUNT=1` → retry bắn; `DELAY=12000 + COUNT=2` →
fallback bắn. Không đổi logic chờ-trạng-thái / retry / fallback của C8;
không đổi ngữ nghĩa `playWaitMs`/`pauseWaitMs`.

### 2.2 E1 FB2 — keydown muộn TỔNG HỢP, dispatch đúng lúc

Vấn đề của C8: `waitPlaying` của fallback #1 trả ok ngay ở poll đầu
(`playing` đã true sau setState) nên keydown muộn theo timer gần như
không bao giờ lọt vào cửa sổ chờ 2s — vòng lặp fallback #2 không thể bắn
bằng timer-redispatch. D7 thêm `E1_FAULT_FB2` (env-gated, mặc định TẮT):
ngay sau setState của fallback #1 (chỉ `fb===0`), harness dispatch đồng
bộ một keydown Space tổng hợp qua `window.dispatchEvent` (cùng cơ chế
redispatch của C8) rồi mới `waitPlaying(2000)`. Keydown này lật lại
`playing=true → false` TRƯỚC poll đầu của wait — vòng lặp fallback #2
phải bắn thì slot mới xong. Đây vẫn là fault-injection kiểm chứng cơ chế
(vòng lặp fallback #2), chỉ khác C8 ở chỗ trigger được định thời xác định
thay vì đua timer: sự kiện mô phỏng ("keydown chậm tới sau fallback #1")
là cùng một lớp sự kiện, và việc keydown tổng hợp toggle được thật nay đã
có chứng cứ trực tiếp (§4.3). Dùng `DELAY=20000 + COUNT=2` để 2 redispatch
theo timer nằm ngoài mọi cửa sổ chờ và bị cleanup hủy sau toggle (không
bẩn slot đo).

## 3. Thay đổi code — chỉ harness/probe, không sửa production

### 3.1 N10 `probe-86n10-config-fps.mjs` (mới, land đợt này)

- Thêm env fault-injection (mặc định TẮT): `N10_FAULT_KEYDOWN_DELAY_MS`
  (0), `N10_FAULT_KEYDOWN_COUNT` (0), `N10_FAULT_SLOT` (0),
  `N10_FAULT_WHICH` ("lần 1"); `N10_FAULT_INSTALL_FN` /
  `N10_FAULT_CLEANUP_FN` (chuỗi eval cài/gỡ listener capture-phase).
- `togglePlayExpect`: cài fault (nếu đúng slot/chiều) trước lần Space
  đầu, dọn sau khi toggle xong ở mọi đường thoát (kể cả throw). Không đổi
  logic chờ-trạng-thái / retry / fallback của C8.

### 3.2 E1 `clicktest-77e1-deint-fps.mjs` (mới, land đợt này)

- Thêm env `E1_FAULT_FB2` (0) + `FAULT_FB2_DISPATCH_FN` (chuỗi eval
  dispatch keydown Space tổng hợp, đánh dấu `__e1FaultRedispatch`).
- Vòng lặp fallback của `togglePlayExpect`: sau setState của fallback #1
  (`fb===0`) và trước `waitPlaying(2000)`, nếu `FAULT_FB2` thì dispatch
  keydown muộn + ghi log. Không đổi logic còn lại của E1/C8.

### 3.3 Cách land an toàn giữa đợt (ghi cho parent)

D8 đợt 102 đang chạy E1/N10 và ghi md5 3 script trước/sau mỗi lần — D7
KHÔNG sửa file thật trong lúc D8 chạy. Thí nghiệm chạy trên bản sao
`-d7` (cùng thư mục, `node --check` PASS, md5 thật giữ nguyên
E1 `d18e0465…`, N10 `3bc93119…` suốt đợt). **Đã land 03:23Z sau khi D8
xong (driver kết thúc 03:18:56Z, yên30=2/3, 60fps=5/5):**
`hidden_files/round102-d7/apply-d7-fault.py` lên file thật;
`diff` file thật vs bản sao = **rỗng**, `node --check` PASS cả hai,
md5 mới E1 `4ba1d86c…`, N10 `9ca985cd…`; 1 lần N10 fault-retry trên
file thật exit 0, 11/11 slot, slot 0 `space-retry` (xem §5). Bản sao
`-d7` đã xóa sau khi land.

## 4. Kết quả đo

### 4.1 O8 Chromium + WebKit (fixture mới nhất, md5 khớp đợt 101)

Driver: `hidden_files/round102-d7/run-d7-o8.sh` (Chromium :191/5554/9656,
WebKit :192/5564 — cổng/display riêng tránh đụng D8: E1 vite 5580,
chrome 9680, Xvfb :193). Boot 249407b6 (reboot #26, xem §7).
`preview.tsx` `07f56792…` (post-fix C4, không đổi).

| Engine | Exit | Kết quả | S5 Δx | S7 mask Δx / bóng Δx | S4 tĩnh | E0 |
|---|---|---|---|---|---|---|
| Chromium | 0 (02:45:57Z) | **21/21** | **0,112** (kỳ vọng 0,112) | **0,112 / 0,113** | blob (0,4158, 0,5) n=2364 | 0 lỗi JS |
| WebKitGTK 27.2 | 0 (02:48:01Z) | **21/21** | **0,194** (kỳ vọng 0,194) | **0,194 / 0,197** | blob (0,3546, 0,5004) n=7082 | 0 lỗi JS/pageerror/crash |

- So với đợt 101 (C9): Chromium S5 0,112 / S7 0,112/0,113; WebKit S5
  0,194 / S7 0,194/0,197 — **khớp từng chữ số thập phân thứ 3**.
  S4 cả 2 engine cũng khớp đợt 101 (chr n=2364, wk n=7082).
- Ảnh PNG chụp lại md5 KHÁC đợt 101 (a1-track-t1, s5-track-attached) —
  screenshot phụ thuộc thời điểm render, không phải regression: tọa độ
  blob đo được (thước đo thật) giống hệt, verdict 21/21 cả 2 engine.
- Số retry trong đo S5/S7: **0** (log không có dòng retry nào; 2 lần
  "click lần 2" trong log là setup S1 tắt auto-proxy, không phải retry đo).

### 4.2 N10 60fps deint-only ×3 (2 hoàn thành + 1 harness lỗi, chạy lại)

| Lần | Exit | Slot | Tỉ lệ | Baseline | C1 | Toggle slot 0 |
|---|---|---|---|---|---|---|
| fault-retry (DELAY 7000, COUNT 1) | 0 | 11/11 | **1,08×** (0,98/1/1,15/1,16/1,13) | 3,48 fps | MAD 0,3835 (5,77%) | play `space-retry` (lần 1: 5310ms không lật; lần 2: lật 69ms) |
| fault-fallback lần 1 (DELAY 12000, COUNT 2) | **2** | — | — | — | — | **HARNESS LỖI (mount): timeout chờ app mount** (load 16,35 lúc bắt đầu; chết trước khi fault được cài — không phải lỗi fault) |
| fault-fallback lần 2 (DELAY 12000, COUNT 2) | 0 | 11/11 | **1,89×** (1,2/1,55/2,15/2,87/1,66) | 1,6 fps | MAD 0,3835 (5,77%) | play `store-fallback` (lần 1: 5095ms; lần 2: 5407ms; fallback #1 lật 158ms) |

Chứng cứ thời gian (log UTC) — fault-retry:
`02:52:45.187` fault BẬT (installed) → `02:52:51.076` timeout lần 1
(5310ms, playing=false) → `02:52:51.653` Space #2 lật sau 69ms
(`space-retry`) → `02:52:51.870` dọn listener (TRƯỚC lịch phát lại
~02:52:52,2 — retry cứu thật, không phải keydown phát lại muộn).
Chứng cứ — fault-fallback lần 2:
`03:04:41.972` fault BẬT (installed) → `03:04:47.661` timeout lần 1
(5095ms) → `03:04:53.776` timeout lần 2 (5407ms) →
`03:04:54.151` fallback #1 lật sau 158ms (`store-fallback`) →
`03:04:54.358` dọn listener (cả 2 redispatch đang chờ đã hủy).
Tổng N10 fault: 22 toggle hoàn thành, **1 retry + 1 fallback (cả hai
cứu thật)**, 0 abort; các slot còn lại 20/20 `"space"`; pause 22/22
`"space"` (pauseWaitMs tối đa 409ms). Tỉ lệ 1,08×/1,89× là số phồng do
tải (baseline 3,48 / 1,6 fps dưới tải 10–20), đừng trích làm tốc độ deint;
C8 đã đo cùng config 1,08×/0,99× — cùng tầm, không hồi quy.

### 4.3 E1 30fps FB2 ×1 (bản sao -d7)

| Lần | Exit | Slot | G5 | Baseline | Mode | Toggle slot 0 |
|---|---|---|---|---|---|---|
| FB2 (DELAY 20000, COUNT 2, FB2=1) | 0 | 10/10 | **1,17×** (1,56/1,32/1,55/0,73/0,68, PASS theo 98Z8) | 2,25 fps | tải | play `store-fallback` (lần 1: 5284ms; lần 2: 5106ms; fallback #1 KHÔNG giữ được; fallback #2 lật 112ms) |

Chứng cứ thời gian (log UTC):
`02:59:47.980` fault BẬT (nuốt 2 Space, phát lại 20s) →
`02:59:53.759` timeout lần 1 (5284ms) → `02:59:59.369` timeout lần 2
(5106ms) → `02:59:59.664` FB2 dispatch keydown muộn tổng hợp sau
fallback #1 → `03:00:01.784` fallback #1 chưa giữ được (`playing`
cuối=false — wait 2s chạy hết 2120ms) → `03:00:02.083` fallback #2
lật sau 112ms (`store-fallback`) → `03:00:02.273` dọn listener
(2 redispatch 20s/25s đang chờ đã hủy — không toggle muộn).
Slot 0 sau đó đo sạch: drawFps 1,47, playheadRate 0,88,
pauseMethod `"space"` (pauseWaitMs 4ms) — keydown muộn không lọt vào
cửa sổ đo. Các slot còn lại 10/10 `"space"` (playWaitMs tối đa 807ms).
Pixel 10/10 case PASS, G2/G7a/G7b/G8 MAD giống hệt lịch sử B7/C8
(0,5821 / 0,6903 / 0,0119 / 1,5522); H9 0 lỗi trang. G5 1,17× là số tải
(baseline 2,25 fps, load 26,16 lúc đo), không đóng góp chân yên G1.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ harness/probe (xem §3) |
| `node --check` 2 script bản sao `-d7` | **PASS** cả hai (trước khi chạy fault) |
| `node --check` 2 script thật sau land | **PASS** cả hai (03:23Z) |
| `diff` file thật vs bản sao sau land | **rỗng** — nội dung land = nội dung đã thử |
| N10 fault-retry trên file thật sau land | **PASS — exit 0, 11/11 slot, 4/4 pass, tỉ lệ 1,37×**; slot 0 `space-retry` (lần 1 timeout 5084ms 03:25:05.557Z, lần 2 lật sau 129ms 03:25:06.182Z) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** xanh |
| `node --test deint-fps-verdict-100b7.test.mjs` | **13/13** xanh |
| O8 Chromium | **21/21, 0 fail** — S5/S7 Δx khớp đợt 101 |
| O8 WebKitGTK 27.2 | **21/21, 0 fail** — S5/S7 Δx khớp đợt 101 |
| N10 fault-retry | **exit 0, 11/11, 4/4 pass** — retry bắn thật (§4.2) |
| N10 fault-fallback lần 2 | **exit 0, 11/11, 4/4 pass** — fallback bắn thật (§4.2) |
| E1 FB2 | **exit 0, 10/10, G5 PASS** — fallback #2 bắn thật (§4.3) |
| Harness md5 thật suốt đợt (trước khi land) | **không đổi** (E1 d18e0465…, N10 3bc93119… — D8 xác nhận từng lần chạy) |
| Pixel E1 FB2 | G2/G7a/G7b/G8 MAD giống hệt lịch sử B7/C8 |
| H9/C3 (mọi lần chạy D7) | **0 lỗi trang** (O8 ×2, N10 ×2 hoàn thành, E1 FB2 ×1) |
| Không process mồ côi sau đo | vite/chrome/xvfb của D7 đã tắt hết (kiểm tra cuối phiên, xem log luồng) |

## 6. Cách chạy lại

```bash
# O8 Chromium + WebKit (fixture copy từ hidden_files/round87-o8/headed, md5 khớp đợt 101):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d7/run-d7-o8.sh
# N10 fault retry (slot 0 chiều PHÁT — nuốt 1 Space, phát lại sau 7s):
N10_FAULT_KEYDOWN_DELAY_MS=7000 N10_FAULT_KEYDOWN_COUNT=1 N10_FAULT_SLOT=0 \
  N10_LABEL=60fps-deint-d7-n10-retry N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d7/60fps-deint-d7-n10-retry \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# N10 fault fallback (nuốt 2 Space, phát lại sau 12s):
N10_FAULT_KEYDOWN_DELAY_MS=12000 N10_FAULT_KEYDOWN_COUNT=2 N10_FAULT_SLOT=0 \
  N10_LABEL=60fps-deint-d7-n10-fallback2 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d7/60fps-deint-d7-n10-fallback2 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# E1 FB2 (nuốt 2 Space, phát lại 20s + dispatch keydown muộn sau fallback #1):
E1_FAULT_KEYDOWN_DELAY_MS=20000 E1_FAULT_KEYDOWN_COUNT=2 E1_FAULT_FB2=1 E1_FAULT_SLOT=0 \
  E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d7/e1-fb2 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Land lại từ đầu (idempotent — chỉ dùng khi file thật chưa có code D7):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d7/apply-d7-fault.py \
  ~/workspace/repo-1/apps/web/scripts/clicktest-77e1-deint-fps.mjs \
  ~/workspace/repo-1/apps/web/scripts/probe-86n10-config-fps.mjs
```

## 7. Giới hạn — đọc trước khi trích số

1. **Cả 3 lần fault đều tải nặng, không lần yên nào** — không đóng góp
   thêm vào chân yên G1; tỉ lệ N10 1,08×/1,89× và G5 E1 1,17× là số
   phồng do tải (baseline 1,6–3,48 fps), đừng trích làm tốc độ deint.
   G5 E1 FB2 PASS 1,17× theo quy tắc 98Z8 nhưng ở chế độ tải — không
   phải bằng chứng deint nhanh hơn baseline.
2. **`playWaitMs` là thời gian chờ của lần thử THÀNH CÔNG, không phải
   tổng thời gian toggle.** Slot fault N10 retry: playWaitMs ghi 69ms
   nhưng tổng toggle ~6,5s (5310ms lần 1 + retry); N10 fallback lần 2:
   158ms, tổng ~12,4s; E1 FB2: 112ms, tổng ~14,3s (5284 + 5106 + 2120
   + fallback #2). Tổng thời gian chỉ đọc được từ timestamp log. Đừng
   trích "toggle chỉ mất 69ms" cho ca fault.
3. **Mơ hồ ±100–200ms ở N10 fallback lần 2 (§4.2):** redispatch #1 theo
   timer hẹn ~03:04:54,0 trong khi setState của fallback #1 rơi vào
   ~03:04:53,9–54,0 — không loại trừ được bằng timestamp log rằng
   redispatch đã góp phần lật `playing` trước poll đầu (158ms). Không
   đổi kết luận: cả 2 Space đều đã chứng minh không lật (2 timeout 5s+),
   đường fallback là đường duy nhất đưa slot về đích, sample `a` sau
   toggle xác nhận `playing=true`, slot 0 đo sạch 3s sau đó (drawFps
   2,42), cleanup đã hủy cả 2 redispatch đang chờ. Muốn triệt mơ hồ này
   thì chạy lại với DELAY=20000 (như E1 FB2) để redispatch nằm ngoài mọi
   cửa sổ chờ — chưa chạy vì lần 2 đã đủ chứng cứ đường fallback.
4. **FB2 dùng keydown tổng hợp định thời xác định, không phải keydown
   chậm tự nhiên theo timer.** Cơ chế được chứng minh là vòng lặp
   fallback #2 (phát hiện lật lại + fallback lần nữa); trigger là
   harness dispatch đúng lúc. Keydown chậm tự nhiên lọt đúng cửa sổ
   2s của fallback #1 vẫn chưa quan sát được ngoài đời — nhưng nay đã
   biết nó sẽ được xử lý đúng nếu xảy ra (fallback #2 đã bắn thật).
5. **N10 fault-fallback lần 1 exit=2 (mount timeout, load 16,35).**
   Harness lỗi môi trường/tải, không phải lỗi fault: chết ở mount, trước
   khi fault được cài. Chạy lại lần 2 (load 20,65 lúc bắt đầu nhưng mount
   kịp) thì bắn. Không giấu lần lỗi này.
6. **Ảnh PNG O8 md5 khác đợt 101** (xem §4.1) — screenshot phụ thuộc
   thời điểm render; thước đo thật (tọa độ blob S5/S7) giống hệt.
7. **Reboot #26 trong phiên** (boot 3a12a7d3 → 249407b6; uptime 30 phút
   lúc 02:42Z → boot ~02:12Z, trước lượt D7). Mọi lần đo D7 đều trên
   boot 249407b6. Giờ reboot này ghi cho luồng EPERM đợt 102 (khoảng mù
   #20 bắt đầu sau reboot #25 ~23:52:16Z — nay đã có reboot #26 kẹp giữa).
8. G1 vẫn MỞ, chờ user quyết metric G5/M2 — D7 không thay đổi gì ở quyết
   định này; birefnet 0 lần thành công (không thử — RAM ~1,0–4,3 GB khả
   dụng); TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ user.
9. `vite build` / `tsc` không chạy lại trong luồng này: thay đổi chỉ là
   harness `.mjs` (không thuộc tsc), đã verify bằng `node --check` +
   3 lần chạy fault thật + 2 suite deint-verdict xanh (17/17, 13/13);
   vite dev đã biên dịch app thành công trong mỗi lần chạy (O8/N10/E1
   đều mount app thật). Không chạy `vite build` riêng để khỏi ghi đè
   `apps/web/dist/` và khỏi tranh tải với D8 đang chạy.

## 8. File đã đổi/thêm (stage, không push)

- `apps/web/scripts/probe-86n10-config-fps.mjs` — fault-injection
  keydown chậm cho N10 (env-gated, mặc định TẮT) + dọn listener sau toggle.
- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` — fault FB2
  (env-gated, mặc định TẮT): dispatch keydown muộn tổng hợp sau
  fallback #1 để kiểm chứng vòng lặp fallback thứ 2.
- `docs/PHASE9_ROUND102_D7_HARNESS_LIMITS.md` (file này).
- Log + dữ liệu thô: `hidden_files/round102-d7/` (o8.log, run-d7-o8.sh,
  o8-chromium + o8-webkit + report JSON, run-d7-fault.log,
  n10-retry-run.log, n10-fallback-run.log (exit 2),
  n10-fallback2-run.log, run-d7-fault2.log, e1-fb2-run.log,
  n10-retry-landed-run.log + thư mục `60fps-deint-d7-n10-retry-landed/`
  (verify file thật sau land), apply-d7-fault.py,
  run-d7-n10-fallback2.sh).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round102-d7-harness.txt`.
