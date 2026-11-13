# Đợt 103 E8 — Harness: kiểm tra lại độc lập D6-A + triệt mơ hồ N10 fallback lần 2 + O8

Ngày: 13/11/2026 (đo 05:43–06:03Z, lượt cron 12:35 +07).
Máy đo: VM này (CPU-only, Chromium qua Xvfb + CDP `--disable-gpu`, WebKitGTK 27.2;
boot-id 9576eac3 — reboot #27 ~05:26:18Z 13/11, ~10 phút trước lượt này;
load 1-phút 0,58–17,82 trong cửa sổ — 8–10 luồng đợt 103 chạy song song;
RAM khả dụng 1266–3555 MB).
Nợ: LIMITS gộp đợt 102 §4 mục 8 — D6-A chưa được kiểm tra lại độc lập (D9 chưa
chạy lại); mơ hồ ±100–200ms ở N10 fallback lần 2 (chạy lại với DELAY=20000 sẽ
triệt); keydown chậm tự nhiên lọt đúng cửa sổ 2s của fallback #1 chưa quan sát
được ngoài đời.
Trạng thái: G1 VẪN MỞ, chờ user quyết metric G5/M2. E8 KHÔNG đóng G1, KHÔNG đổi
ngưỡng, KHÔNG đổi metric, KHÔNG sửa production, KHÔNG sửa harness — chỉ đo +
tính lại (1 file docs mới).

## 1. Kết luận ngắn

- **D6 recheck: KHỚP HOÀN TOÀN.** Chạy lại đúng 2 script quantify của D6 trên
  cùng dữ liệu 24 đuôi → output giống D6 từng byte. Tính lại độc lập bằng code
  viết mới (cách đếm khác: max−min counter thay vì cộng dồn từng bước tăng) →
  khớp D6 trên cả 24 đuôi, từng cột số. **0/24 đuôi đạt tiêu chí ổn định-lệch —
  kết luận D6 đứng; D6-A vẫn bị bác.**
- **Mơ hồ N10 fallback lần 2 ĐÃ TRIỆT.** Chạy lại fault N10 fallback với
  DELAY=20000: fallback #1 setState lật sau 88ms (05:50:35.833Z); redispatch #1
  hẹn ≈05:50:44.94 — tức ~9,1 giây SAU lần lật, và đã bị cleanup hủy lúc
  05:50:35.838Z trước khi tới hẹn. Lần lật này chỉ có thể là setState, không
  thể là redispatch.
- **Keydown chậm tự nhiên: KHÔNG quan sát được — VẪN MỞ.** E8 chạy thêm N10
  thường ×2 + E1 thường ×1 (44 slot, 88 toggle, wait chậm nhất 583ms — còn
  thấp hơn timeout 5000ms tới 8,6 lần), 0 retry, 0 fallback. Gộp toàn bộ quan
  sát tự nhiên từng có (22 lần chạy, 319 slot, 638 toggle): wait chậm nhất
  804ms, 0 retry, 0 fallback — xem §4 vì sao khó bắt.
- **O8 21/21 cả 2 engine, khớp D7/C9 từng chữ số:** Chromium S5 Δx=0,112; S7
  mask 0,112 / bóng 0,113; WebKit S5 Δx=0,194; S7 mask 0,194 / bóng 0,197.
  Fixture md5 khớp đợt 101/102. 0 retry trong đo S5/S7. E0 0 lỗi cả 2 engine.
  (Chromium lần 1 exit=2 do E8 quên copy fixture — lỗi setup harness, chạy lại
  sạch; xem §5.)
- **0 abort vẫn giữ:** 1 lần fault hoàn thành đợt này (11 slot, 22 toggle, 1
  fallback cứu thật), 0 toggle abort; gộp D7: 5 lần fault, 55 slot, 110 toggle,
  2 retry + 3 fallback cứu thật, 0 abort. Harness md5 không đổi một byte so với
  D7 đã land (E1 `4ba1d86c…`, N10 `9ca985cd…`).

## 2. Kiểm tra lại độc lập kết luận D6 "0/24 đuôi đạt tiêu chí ổn định-lệch"

### 2.1 Chạy lại đúng 2 script của D6 — khớp từng byte

| Script D6 | Dữ liệu | Kết quả chạy lại của E8 |
|---|---|---|
| `quantify-burst-vs-stable.py` | 12 lượt h (round101-c3) | diff vs `quantify-burst-vs-stable.txt` của D6 = **rỗng** |
| `quantify-i1-i12-burst-vs-stable.py` | 12 lượt i (round102-d6) | diff vs `quantify-i1-i12-burst-vs-stable.txt` của D6 = **rỗng** |

### 2.2 Tính lại độc lập bằng code viết mới — khớp từng đuôi

E8 viết lại từ đầu theo đặc tả D6 §2.2 (`recheck-d6-independent.py`, không copy
code D6): chia đoạn bằng `groupby` theo `tail.endedAtMs`, đếm gate chặn bằng
**max−min của counter `tailDriftGate` trong đoạn** (D6 cộng dồn từng bước tăng —
hai cách phải bằng nhau nếu counter đơn điệu; E8 kiểm luôn: số lần counter giảm
trong đoạn = **0 ở cả 38 đoạn**). So từng đuôi với bảng D6:

- **24/24 đuôi bị chặn khớp D6 trên mọi cột** (tuổi, blocks, blk/s, % đóng băng,
  biên drift, drift min–max, nhảy vọt): **0 đuôi lệch.**
- Gộp theo nhóm (chỉ 24 đuôi bị chặn): h blk/s trung vị **1,20** (max 2,56),
  đóng băng trung vị **14%** (min 0%), biên drift trung vị **0,450s** (min
  0,298s), nhảy vọt **34/76**; i blk/s trung vị **1,25** (max 2,08), đóng băng
  trung vị **25%** (min 5%), biên drift trung vị **0,847s** (min 0,429s), nhảy
  vọt **42/85** — khớp đúng từng số D6 đã ghi (§2.2 LIMITS D6).

### 2.3 14 đoạn 0-block ngoài 24 đuôi D6 — không đe dọa kết luận

Lưới của E8 bắt rộng hơn D6 (D6 lọc bỏ đoạn có `nblocks == 0`): tổng **38 đoạn**
(18 h + 20 i), trong đó 14 đoạn có 0 lần gate chặn. Kiểm từng đoạn:

- 6 đoạn 1 tick (nint=0: i6 ended=6605/8081, i2 14493/16267, i3 5908, i8 11501)
  "đạt" 2/3 tiêu chí (đóng băng 0% + biên drift 0,000) **chỉ do suy biến**: 0
  khoảng mẫu nên tỉ lệ đóng băng = 0% và 1 mẫu nên biên drift = 0; blk/s =
  0,00 — trượt tiêu chí thứ ba. Không phải ca ổn định-lệch thật.
- 8 đoạn nhiều tick (h1 803, h9 1582, h7 2087, h11 2264, h10 1304, h6 2770, i1
  2206, i10 9903): drift không vượt ngưỡng chặn (max ≤ +0,42, phần lớn ≤ +0,37)
  nên gate không bắn lần nào.
- Tất cả 14 đoạn đều có 0 lần chặn → **không thể kích hoạt D6-A** (luật này cần
  2 lần chặn liên tiếp có |Δdrift| ≤ 0,10). Đọc rộng nhất: **0/38 đoạn** đạt
  cả 3 tiêu chí.

**Kết luận §2:** "0/24 đuôi đạt tiêu chí ổn định-lệch" **KHỚP** (tính lại độc lập
2 cách). D6-A vẫn bị bác bằng dữ liệu; không có gì để sửa, không thử lại D6-A.

## 3. N10 fault-fallback với DELAY=20000 — mơ hồ ±100–200ms ĐÃ TRIỆT

Chạy trên file harness THẬT đã land đợt 102 (N10 md5 `9ca985cd…`, không sửa
code — chỉ đổi env DELAY 12000 → 20000). Lệnh chạy lại: xem §7.

### 3.1 Timeline từng bước (giờ UTC, log `n10-fallback-delay20000-run.log`)

| Thời điểm | Sự kiện |
|---|---|
| 05:50:24.529Z | fault BẬT (`installed`) — nuốt 2 keydown Space tiếp theo, phát lại sau 20000ms |
| ≈05:50:24.94 | keydown Space #1 gửi → **bị nuốt** → redispatch #1 hẹn **≈05:50:44.94** |
| 05:50:30.121Z | timeout lần 1 sau **5180ms** (playing=false) — thử lại Space |
| ≈05:50:30.53 | keydown Space #2 gửi → **bị nuốt** → redispatch #2 hẹn **≈05:50:50.53** |
| 05:50:35.722Z | timeout lần 2 sau **5197ms** (playing=false) |
| 05:50:35.833Z | **fallback #1 setState → lật sau 88ms**, `playMethod="store-fallback"` |
| 05:50:35.838Z | dọn listener (`cleaned`) — cả 2 redispatch đang chờ **đã hủy** |

Thời điểm gửi keydown #1/#2 suy từ `(timeout-end − waitedMs)` vì harness không
ghi dòng riêng lúc gửi: #1 ≈ 30.121 − 5.180 = 24.941; #2 ≈ 35.722 − 5.197 =
30.525. Sai số suy luận ±~50ms do evalJs round-trip (timer `setTimeout` của
fault được hẹn **lúc nuốt keydown**, xem code `N10_FAULT_INSTALL_FN` — hẹn từ
lúc keydown tới, không phải lúc cài fault).

### 3.2 Vì sao mơ hồ đã triệt

- Lần lật của fallback #1 (35.833Z) cách redispatch #1 hẹn (44.94Z) **~9,1
  giây**, cách redispatch #2 hẹn (50.53Z) **~14,7 giây**. Ở D7 (DELAY=12000)
  khoảng cách này chỉ ~100–200ms nên không loại trừ được redispatch đã góp
  phần lật; nay khoảng cách gấp ~50 lần, và **cả hai redispatch đều đã bị
  cleanup hủy ở 35.838Z — ~9 giây trước khi cái sớm nhất tới hẹn**. Lần lật
  này chỉ có thể là `setState` của fallback #1.
- Fallback #2 không bắn (đúng kỳ vọng: fallback #1 giữ được, không có keydown
  muộn nào lật lại). Log chỉ có đúng 1 dòng fallback trong cả lần chạy.

### 3.3 Kết quả đo

- Exit **0**, **11/11 slot, 4/4 pass**, ratio **1,13×** (tải — load 11,43 lúc
  bắt đầu; đừng trích làm tốc độ deint).
- `playMethods`: slot 0 `store-fallback`, 10 slot còn lại `space`;
  `pauseMethods`: 11/11 `space`. Slot 0: playWaitMs **88ms**, pauseWaitMs
  72ms, drawFps 2,18, playheadRate 0,78.
- H9/C3: **0 lỗi trang** trong cả phiên.
- Caveat (như D7 §7.2): `playWaitMs`=88ms là thời gian chờ của lần fallback
  thành công, **không phải tổng thời gian toggle** (~11,3s: 5180 + 5197 + 88ms
  + overhead). Đừng trích "toggle chỉ mất 88ms" cho ca fault.

## 4. Keydown chậm tự nhiên lọt cửa sổ 2s của fallback #1 — VẪN MỞ

### 4.1 E8 quan sát ngoài đời (không fault, không keydown tổng hợp)

| Lần chạy | Exit | Slot | Pass | playWait max | pauseWait max | Methods | Fallback/retry |
|---|---|---|---|---|---|---|---|
| N10 thường 1 (60fps deint) | 0 | 11 | 4/4, ratio 1,05× | 583ms | 105ms | toàn `space` | **0** |
| N10 thường 2 (60fps deint) | 0 | 11 | 4/4, ratio 0,88× | 196ms | 105ms | toàn `space` | **0** |
| E1 thường 1 (30fps deint) | 0 | 22 | 10/10 | 480ms | 199ms | toàn `space` | **0** |

Tổng E8: **44 slot, 88 toggle, wait chậm nhất 583ms** (N10 lần 1, tải 17,82 lúc
bắt đầu lần 2), 0 retry, 0 fallback. Log cả 3 lần: 0 dòng `fallback store` /
`space-retry` / `chưa giữ được`.

### 4.2 Bối cảnh: toàn bộ quan sát tự nhiên từng có

| Nguồn | Lần chạy | Slot | Toggle | Wait chậm nhất | Retry / fallback |
|---|---|---|---|---|---|
| E1 sibling đợt 103 (đọc log, chỉ đọc) | 5 hoàn thành | 66 | 132 | 322ms | 0 / 0 |
| D8 đợt 102 (lịch sử: E1 ×9 + N10 ×5) | 14 | 209 | 418 | **804ms** (E1 run8) | 0 / 0 |
| E8 đợt 103 (mục 4.1) | 3 | 44 | 88 | 583ms | 0 / 0 |
| **Gộp** | **22** | **319** | **638** | **804ms** | **0 / 0** |

### 4.3 Vì sao khó bắt (ghi rõ, không giấu)

Để fallback #2 bắn tự nhiên cần chuỗi 3 điều kiện cùng xảy ra ở một slot/chiều:
(1) keydown Space #1 quá hạn 5000ms; (2) keydown Space #2 (thử lại) cũng quá
hạn 5000ms — tức **2 lần trễ >5s liên tiếp**; (3) một trong hai keydown muộn đó
tới đúng trong cửa sổ chờ 2s sau setState của fallback #1 để lật `playing` về
lại. Wait chậm nhất từng quan sát trong 638 toggle tự nhiên là **804ms — thấp
hơn timeout 5000ms tới 6,2 lần**; phân phối wait tự nhiên trong đợt này
(196–583ms, dưới tải tới 17,8) không chạm ngưỡng 5000ms. Sự kiện cần độ trễ gấp
~6× kỷ lục từng thấy, xảy ra 2 lần liên tiếp, rồi lọt cửa sổ 2s — với 22 lần
chạy quan sát được thì xác suất bắt gặp trong một lượt là rất thấp. E8 **không
dùng tải nhân tạo** để ép sự kiện này: tải nhân tạo sẽ làm bẩn bằng chứng
"yên" G1 của luồng sibling đang đo song song, và khi đó keydown cũng không còn
là "tự nhiên" theo đúng nghĩa nhiệm vụ.
Điều đã biết nếu nó xảy ra: vòng lặp fallback #2 **đã bắn thật bằng fault tổng
hợp** (D7 E1 FB2 — lật sau 112ms) nên cơ chế xử lý đúng; chỉ thiếu một lần quan
sát tự nhiên để khép nợ này.

## 5. O8 21/21 cả 2 engine trên cây hiện tại

Driver: `run-e8-o8.sh` (+ `run-e8-o8-chromium.sh` chạy lại Chromium). Fixture copy
từ `round87-o8/headed`, md5 khớp D7/C9 từng byte: white `07bc0cb9…`, ball
`6df873f7…`, track `cdf9a252…`. `preview.tsx` `ed260e62…` lúc O8 bắt đầu
05:45:48Z (= cây D9 đóng băng đợt 102).

| Engine | Exit | Kết quả | S5 Δx | S7 mask Δx / bóng Δx | S4 tĩnh | E0 |
|---|---|---|---|---|---|---|
| Chromium | 0 (05:49:18Z, chạy lại) | **21/21** | **0,112** | **0,112 / 0,113** | blob (0,4158, 0,5) n=2364 | 0 lỗi JS |
| WebKitGTK 27.2 | 0 (05:47:38Z) | **21/21** | **0,194** | **0,194 / 0,197** | blob (0,3546, 0,5004) n=7082 | 0 lỗi JS/pageerror/crash |

- Khớp D7/C9 **từng chữ số thập phân thứ 3** (S5/S7/S4 cả 2 engine).
- Số retry trong đo S5/S7: **0** (log không có dòng retry nào; 2 lần "click lần
  2" trong log là setup S1 tắt auto-proxy, không phải retry đo).
- **Chromium lần 1 exit=2 (HARNESS LỖI, lỗi setup của E8 — không phải lỗi sản
  phẩm):** thiếu fixture trong SCRATCH `round103-e8/o8-chromium` (E8 quên copy
  3 fixture; script WebKit đọc thẳng từ `round87-o8/headed` nên không dính).
  Đã copy đủ 3 fixture (md5 khớp) và chạy lại exit=0. Không giấu lần lỗi này.
- Ảnh PNG chụp lại md5 KHÁC đợt 101/102 (screenshot phụ thuộc thời điểm render
  — như D7 §7.6 đã ghi); thước đo thật (tọa độ blob S5/S7) giống hệt.
- **Lưu ý cây đổi giữa đợt:** `preview.tsx` đổi `ed260e62…` → `110a51b9…` lúc
  05:59:24Z do sibling sửa (E8 không đụng file này; O8 đo trên `ed260e62`).
  E9 kiểm chứng lại trên cây gộp cuối.

## 6. 0 abort vẫn giữ + chuẩn D7 về code fault-injection

- E8: **6 lần đo hoàn thành** (O8 Chromium chạy lại, O8 WebKit, N10 DELAY=20000,
  N10 thường ×2, E1 thường ×1), **0 toggle abort** (không lần nào Space +
  fallback đều thất bại). Cộng lần O8 Chromium exit=2 (lỗi setup harness, không
  phải abort toggle).
- Fault-injection gộp với D7: **5 lần fault hoàn thành, 55 slot, 110 toggle, 2
  retry + 3 fallback cứu thật, 0 abort.**
- **Harness không đổi một byte:** E8 KHÔNG sửa file harness nào. md5 thật lúc
  bắt đầu lần fault (05:49:44Z) và lúc cuối lượt (06:03Z): E1 `4ba1d86c…`, N10
  `9ca985cd…` — đúng md5 D7 đã land; sibling E1 ghi md5-truoc/md5-sau giống hệt
  qua 6 lần chạy. Không có code fault-injection mới để land nên không phát sinh
  bước diff file thật vs bản sao — chuẩn D7 được thỏa bằng "không đổi một byte"
  (md5 khớp D7).
- `node --check` cả 2 script harness: **PASS**. Không process mồ côi của E8 sau
  đo (Xvfb :194 còn chạy là của luồng E2 — để yên, không phải của E8).

## 7. Cách chạy lại

```bash
# D6 recheck — chạy lại đúng script D6 (diff vs .txt gốc phải rỗng):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d6/quantify-burst-vs-stable.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d6/quantify-i1-i12-burst-vs-stable.py
# D6 recheck — tính lại độc lập (code viết mới):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e8/recheck-d6-independent.py
# N10 fault-fallback DELAY=20000 (triệt mơ hồ D7):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e8/run-e8-n10-fallback-delay20000.sh
# Quan sát keydown chậm tự nhiên (N10 thường x2 + E1 thường x1):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e8/run-e8-natural.sh
# O8 Chromium + WebKit:
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e8/run-e8-o8.sh
```

## 8. Giới hạn — đọc trước khi trích số

1. **D6 recheck dùng cùng dữ liệu gốc C3/D6, không đo mới** — đây là kiểm tra
   lại phép tính, không phải kiểm tra lại dữ liệu gốc. Nếu dữ liệu gốc sai thì
   recheck không phát hiện được.
2. **Thời điểm gửi keydown #1/#2 ở §3.1 là suy từ timeout** (timeout-end −
   waitedMs), sai số ±~50ms. Dù nới sai số tới ±500ms thì khoảng cách tới
   redispatch vẫn ~9s — kết luận triệt mơ hồ không đổi.
3. **Tỉ lệ N10 DELAY=20000 (1,13×) và các lần chạy tự nhiên (0,88–1,05×) là số
   tải** (load 11–18 lúc đo, baseline thấp) — đừng trích làm tốc độ deint; các
   lần này không đóng góp chân yên G1.
4. **Keydown chậm tự nhiên vẫn mở** (xem §4) — 22 lần chạy / 638 toggle tự
   nhiên chưa từng thấy retry/fallback nào.
5. **O8 đo trên `preview.tsx` ed260e62**; file đã đổi lúc 05:59:24Z bởi sibling
   — E9 kiểm chứng lại trên cây gộp cuối.
6. G1 vẫn MỞ, chờ user quyết metric G5/M2 — E8 không thay đổi gì ở quyết định
   này; birefnet 0 lần thành công (không thử — RAM khả dụng 1,2–3,5 GB); TTS 39
   CẤM kiểm lại; ci-security.yml vẫn 403 chờ user.
7. `vite build` / `tsc` không chạy lại trong luồng này: E8 không đổi code nào
   (chỉ thêm 1 file docs), đã verify bằng `node --check` 2 script harness +
   6 lần chạy thật đều mount app thành công qua vite dev. Không chạy `vite
   build` riêng để khỏi ghi đè `apps/web/dist/` và khỏi tranh tải với các luồng
   đợt 103 đang chạy.

## 9. File đã đổi/thêm (stage, không push)

- `docs/PHASE9_ROUND103_E8_HARNESS_LIMITS.md` (file này) — file repo duy nhất
  E8 đổi/thêm.
- Log + dữ liệu thô: `hidden_files/round103-e8/` (quantify-h/i-recheck.txt,
  recheck-d6-independent.py + .txt, o8.log, o8-chromium.log,
  o8-chromium + o8-webkit + report JSON, run-e8-o8.sh, run-e8-o8-chromium.sh,
  n10-fallback-delay20000-run.log + thư mục
  `60fps-deint-e8-n10-fallback-delay20000/`, run-e8-fault.log,
  run-e8-n10-fallback-delay20000.sh, run-e8-natural.log,
  `60fps-deint-e8-n10-natural1/2` + run log, `e8-e1-natural1` + run log,
  run-e8-natural.sh).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round103-e8-harness.txt`
  (1 entry, NUL, read-back OK).
