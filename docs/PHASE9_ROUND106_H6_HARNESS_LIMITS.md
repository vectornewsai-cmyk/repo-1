# Đợt 106 H6 — Harness: điều tra G4 flake (probe G3→G4) + keydown chậm gộp + đính chính giờ reboot #29

Ngày: 13/11/2026 (lượt cron 21:35 +07). Máy đo: VM này (CPU-only, Chromium
qua Xvfb + CDP `--disable-gpu`; boot `63a52041` từ 14:50:59Z — reboot giữa
chừng cắt ngang lần chạy đầu, xem §6; RAM khả dụng 1557–4903 MB; load
1,1–6,7 trong lúc đo). KHÔNG sửa production, KHÔNG push, KHÔNG
release/tag. Chỉ đổi 1 script harness (thêm log) + 1 file docs sửa đính
chính + 1 file LIMITS mới này.

Nợ: LIMITS G3 đợt 105 §4 — G4 flake tái hiện 2/21 lần E1 (9,5%), cơ chế
chưa biết, cần "log thêm trạng thái enhance/clip giữa G3→G4"; §5 keydown
chậm tự nhiên 40 lần/1122 toggle vẫn mở; E1 run4–10 của driver F8 còn là
danh nghĩa; LIMITS G3 ghi SAI giờ reboot #29.

## 1. Kết luận ngắn

- **G4 flake: KHÔNG bắt thêm được mẫu nào — 0/7 lần E1 mới.** Cả 7 lần
  E1 run4–10 đều **10/10 PASS**, G4 tap=true, R=0,51, G3→G4 chỉ
  **1,72–2,33s** (trung vị 2,22s). Tỉ lệ gộp nay là **2/28 = 7,1%
  (Wilson 95% ~2–23%)**, giảm từ 2/21 = 9,5% — nhưng **0/7 này KHÔNG
  bác được tỉ lệ cũ**: 7 lần mới chạy trên máy yên/tải nhẹ (load lúc bắt
  đầu 1,10–5,01), trong khi cả 2 ca flake cũ đều dưới tải nặng (load
  15–19). Cơ chế flake **VẪN CHƯA BIẾT** (xem §4).
- **Probe chẩn đoán G4 đã land và hoạt động đúng.** 38 dòng `G4-probe`
  trên 7 lần chạy, ghi snapshot enhance/hook/idle sau từng bước G3→G4
  + mọi lần đổi trạng thái trong waitIdle. Phát hiện phụ (xem §4.3):
  sau G3 enhance về `null` (không phải `{"deinterlace":false}`) và
  patchClip giữ nguyên `null`; checkbox BẤM → store về đích + hook tap
  áp trong ~1,1–1,4s; waitIdle chỉ 0–0,51s trên máy này. Ngân sách thời
  gian đường khỏe đã đo được: G3→G4 ≈ 1,7–2,3s — ca flake 11,5s thừa
  ~9s, lần flake tới probe sẽ chỉ ra thừa ở bước nào.
- **Keydown chậm tự nhiên: VẪN MỞ.** Thêm 9 lần chạy / 110 slot /
  220 toggle, wait chậm nhất **213ms**, **0 retry, 0 fallback, 0 abort**.
  Gộp toàn bộ: **49 lần / 671 slot / 1342 toggle, max 1004ms** (kỷ lục
  cũ F8 E1-2 vẫn giữ), vẫn thấp hơn timeout 5000ms 5,0 lần.
- **E1 run4–10 của driver F8: ĐÃ CHẠY XONG (7/7, 10/10)** — không còn
  nợ danh nghĩa. G5: 6 lần PASS chắc ngay vòng 1 (0,90–1,12×), run6
  vòng 1 mean 0,86 (vùng xám) → vòng 2, combined 0,93 PASS chắc.
  N10 thường ×2: 4/4 cả 2, tỉ lệ 1,00×/0,91× (số tải, xem §7).
- **Reboot giữa chừng phá sàn gap reboot.** Lần chạy đầu (boot
  `75697729`, 14:31:52Z) chết sau 41s do reboot lúc **14:50:59Z**
  (boot mới `63a52041`) — gap chỉ **19'07"**, phá sàn cũ 31'47"
  (#30→#31). Đánh số theo prereg đợt 106: đây là **#33** (14:31:52Z =
  #32 theo prereg; H1 chưa xác minh độc lập #32 — xem §6).
- **Đính chính giờ reboot #29: ĐÃ SỬA trong LIMITS G3.** Giờ đúng
  **08:56:39Z** (F7 đo trực tiếp `uptime -s` + F9 xác minh độc lập);
  khoảng 08:57:06–08:58:12Z của G3 là SAI do đồng hồ boot cũ chạy
  nhanh ~25–27s (xem §6.2 + khối đính chính đã chèn vào file G3).
- **Lỗi driver của chính H6 (trung thực):** `summ_e1` trong `run-h6.sh`
  lỗi `IndexError` (thiếu label) nên 7 dòng tóm tắt E1 thiếu trong
  `run-h6.log` — số liệu đã khôi phục đủ từ report JSON, ghi trong
  `run-h6.log` (bổ sung sau driver) và §3.

## 2. Harness đã đổi — chỉ thêm log, không đổi đo

File duy nhất đổi trong repo (ngoài 2 file docs):
`apps/web/scripts/clicktest-77e1-deint-fps.mjs` — md5
`4ba1d86c458a9b2de1e8b423eb31ca7f` (giữ nguyên từ D7 qua F8/G3) →
**`ae6cd34a7dff3f6bda62199b5ab6c6fc`**. `node --check` PASS. md5 này
không đổi một byte suốt driver (ghi trước/sau mỗi lần chạy trong
`run-h6.log`). Script N10 `probe-86n10-config-fps.mjs` không đổi
(`9ca985cd7c38978ce5aaadeedcf758e8`).

Nội dung thêm (xem header script, mục "Đợt 106 H6"):

1. `setEnhCheckbox`: ghi rõ **BẤM hay KHÔNG-bấm** + hook trước bấm, và
   snapshot hook ngay sau khi store về đích. Trước đây hàm này không
   ghi log nào — ca flake 11,5s im lặng một phần là vì thế.
2. Khối G4: `g4Probe(tag)` snapshot `store enhance / hook tap /
   hasEnhance / applied / offscreen / idle sleeping+ticks` sau
   patchClip clean720, sau setEnhCheckbox(true), sau setPlayhead(1.0);
   `waitIdleTraced` thay `waitIdle` — poll STATE_FN mỗi 500ms, ghi mọi
   lần đổi trạng thái (sleeping/ticks/hook/store) + tổng thời gian chờ.
3. Dòng log G4 + thông báo FAIL ghi thêm `store enhance` + hook đầy đủ
   (phân biệt "store chưa bật" với "store đã bật nhưng preview chưa vẽ
   tap" — điểm mù chính của ca flake cũ). Dòng log G3 ghi thêm
   `hasEnhance/applied/store enhance`.

Không đổi ngưỡng, không đổi luồng đo, không đổi production. Bằng chứng
log mới không làm lệch đo: 7/7 lần chạy 10/10, G5 PASS chắc 6/7 ngay
vòng 1, 0 cảnh báo hook slot.

## 3. E1 run4–10 — kết quả đầy đủ (driver run-h6.sh, boot 63a52041)

| Lần chạy | Bắt đầu (Z) | Exit | Pass | G5 (mean, vòng) | Idle | G3→G4 | G4 tap | G4 R | playWait max | pauseWait max |
|---|---|---|---|---|---|---|---|---|---|---|
| E1-4 | 14:52:59 | 0 | 10/10 | 0,90× (1) | yên | 1,83s | true | 0,51 | 174ms | 73ms |
| E1-5 | 14:55:12 | 0 | 10/10 | 1,12× (1) | tải | 2,33s | true | 0,51 | 213ms | 64ms |
| E1-6 | 14:57:15 | 0 | 10/10 | 0,93× gộp (2) | yên | 1,74s | true | 0,51 | 56ms | 61ms |
| E1-7 | 15:00:06 | 0 | 10/10 | 1,10× (1) | tải | 2,28s | true | 0,51 | 198ms | 59ms |
| E1-8 | 15:01:59 | 0 | 10/10 | 0,98× (1) | yên | 2,22s | true | 0,51 | 148ms | 26ms |
| E1-9 | 15:03:48 | 0 | 10/10 | 0,93× (1) | yên | 2,31s | true | 0,51 | 60ms | 49ms |
| E1-10 | 15:05:35 | 0 | 10/10 | 0,91× (1) | yên | 1,72s | true | 0,51 | 43ms | 53ms |

- G5 run6: vòng 1 mean 0,86 median 0,93 → INCONCLUSIVE (vùng xám
  0,6–0,9) → vòng 2 (mean 1,00) → combined 0,93, PASS chắc. Các lần
  khác PASS chắc ngay vòng 1. 0 slot đóng băng cả 7 lần.
- N10 thường ×2 (15:07–15:10Z): 4/4 cả 2, tỉ lệ 1,00× / 0,91×,
  playWait max 87/75ms, pauseWait max 45/58ms, toàn `space`.
- Checkbox: **143 lần BẤM, 1 lần KHÔNG-bấm, 0 cảnh báo hook slot.**
  Lần KHÔNG-bấm duy nhất là run6, G5 vòng 2 slot 0 baseline
  (want=false, store đã false sau vòng 1) — bỏ bấm ĐÚNG, không phải lỗi.
- 0 dòng `fallback store` / `space-retry` / `chưa giữ được` trong mọi
  log (E1 + N10).

## 4. G4 flake — 0/7 mới, cơ chế vẫn chưa biết

### 4.1 Bảng G3→G4 gộp (28 lần E1 hoàn thành có G4)

| Nhóm | Lần chạy | G3→G4 | G4 tap | Ghi chú |
|---|---|---|---|---|
| Lịch sử (G3 §4.1) | 11 lần đợt 104 | 1,90–6,33s (trung vị 2,79s) | true, trừ 1 | F1 run2 flake: 11,50s, tap=false |
| Lịch sử | run8 đợt 103 | 11,9s | false | flake đầu tiên |
| **Mới (H6)** | **7 lần run4–10** | **1,72–2,33s (trung vị 2,22s)** | **true cả 7** | **0 flake** |

Tỉ lệ gộp: **2/28 = 7,1% (Wilson 95% ~2–23%)**, so với 2/21 = 9,5%
(~3–29%) trước đợt này. Đừng trích "7,1%" như hằng số — mẫu vẫn nhỏ,
khoảng vẫn rộng.

### 4.2 Vì sao 0/7 không bác được tỉ lệ cũ

- Cả 2 ca flake cũ đều dưới **tải nặng**: F1 run2 bắt đầu với load
  1-phút **18,74**, FPS slot chỉ 1,9–3,5 fps; run8 đợt 103 cùng chữ ký
  (tap=false, gap ~11,9s). 7 lần H6 bắt đầu với load 1-phút
  **1,10–5,01**, FPS slot 15,43 fps (run6 slot 0) — máy yên/tải nhẹ,
  G5 phân loại 5 yên / 2 tải. Chưa có lần chạy nào dưới tải nặng trong
  đợt này để so sánh trực tiếp.
- Với tỉ lệ thật 1/10, xác suất 0/7 là ~48% — kết quả này hoàn toàn
  tương thích với tỉ lệ cũ. Cần thêm lần chạy **dưới tải nặng** (load
  ~15+) mới kiểm được tỉ lệ; đợt này máy không tải nặng lúc chạy.

### 4.3 Những gì probe mới đã chứng minh được (đường khỏe)

Mẫu probe khỏe — giống hệt nhau cả 7 lần (38 dòng `G4-probe`):

1. **Sau patchClip clean720:** `store enhance=null`, hook tap=false /
   hasEnhance=false / applied=[], idle sleeping=false. (Enhance đã về
   `null` từ G3 — checkbox TẮT chuẩn hóa enhance rỗng thành `null`,
   xem log G3: `store enhance=null, MAD vs A=0`; patchClip
   `{src, in, out}` chỉ merge nên giữ nguyên `null`.)
2. **Sau setEnhCheckbox(true):** `store enhance={"deinterlace":true}`,
   hook tap=true / hasEnhance=true / applied=["deinterlace"], sau
   **~1,1–1,4s** kể từ lúc BẤM (gồm sleep 600ms cố định trong
   clickEnhCheckbox + 2 vòng eval STATE_FN).
3. **Sau setPlayhead(1.0):** không đổi (tap vẫn true); idle có thể
   sleeping=false (vòng vừa thức) hoặc true.
4. **waitIdle:** xong sau **0–0,51s** (0,00 / 0,01 / 0,05 / 0,50 /
   0,51s); chỉ 0–1 lần đổi trạng thái, hook không đổi trong lúc chờ.
5. **G4 đọc:** R=0,51 cả 7 lần, store `{"deinterlace":true}`, idle
   sleeping=true.

Ngân sách đường khỏe: G3→G4 1,72–2,33s ≈ patchClip (~0,05s) +
setEnhCheckbox (~1,1–1,4s) + setPlayhead (~0,01s) + waitIdle (0–0,51s)
+ sleep 500ms + evals. **Ca flake 11,5s thừa ~9s so với ngân sách này**
— với probe mới, lần flake tới sẽ chỉ ra thừa ở bước nào (mỗi bước đã
có timestamp + snapshot riêng), thay vì 11,5s im lặng như trước.

### 4.4 Giả thuyết còn mở (chưa có bằng chứng phân biệt)

- **H-a (waitIdle kẹt dưới tải):** preview chậm ngủ vì video clean720
  đang load/seek + tick thưa (~3 fps) — 9s thừa nằm trong waitIdle,
  hook vẫn false vì chưa có tick nào vẽ với enhance BẬT. Probe sẽ thấy
  waitIdle dài + hook false suốt lúc chờ.
- **H-b (store lật lại sau verify):** click ghi store=true, verify
  xong, rồi một cập nhật store sau đó (re-render panel? patchClip
  muộn?) đưa enhance về `null` trước khi G4 đọc. Probe sẽ thấy store
  true → null giữa "sau setEnhCheckbox" và "G4 đọc".
- **H-c (click trượt/bấm đôi):** click chuột trượt khỏi checkbox (panel
  re-render sau patchClip) hoặc bấm đôi (BẬT rồi TẮT) — verify đọc
  đúng lúc true nhưng trạng thái cuối là false. Probe "BẤM/KHÔNG-bấm"
  + snapshot sau bấm sẽ thấy store không về đích hoặc hook không áp.
- **H-d (preview vẽ từ snapshot clip cũ):** store=true nhưng tick vẽ
  dùng clip snapshot trước toggle (enhance=null) — hook false trong khi
  store true suốt waitIdle. Probe phân biệt H-d với H-b bằng cặp
  (store, hook) trong lúc chờ.
- Không thử "vá" flake (nới ngưỡng G4, ép chờ thêm) khi chưa biết
  nguyên nhân — vá mù là code giả trá hình. Đề xuất đợt sau: chạy E1
  dưới tải nặng (load ~15+, như F1 run2) với harness này để bắt mẫu
  flake có probe; nếu 10 lần tải nặng vẫn 0 flake thì tỉ lệ tải mới
  đáng nghi ngờ lại.

## 5. Keydown chậm tự nhiên — gộp toàn bộ

| Nguồn | Lần chạy | Slot | Toggle | Wait chậm nhất | Retry / fallback / abort |
|---|---|---|---|---|---|
| E8 gộp (LIMITS E8 §4.2) | 22 | 319 | 638 | 804ms | 0 / 0 / 0 |
| Đợt 104 (F8 + F1) | 18 | 242 | 484 | 1004ms | 0 / 0 / 0 |
| **Đợt 106 H6 (mới)** | **9** | **110** | **220** | **213ms** | **0 / 0 / 0** |
| **Tổng** | **49** | **671** | **1342** | **1004ms** | **0 / 0 / 0** |

- Lần mới: E1 ×7 (77 slot, 154 toggle, max 213ms — run5 playWait) +
  N10 ×2 (22 slot, 44 toggle, max 87ms). Toàn `space`, 0 dòng
  retry/fallback trong log.
- Kỷ lục 1004ms (F8 E1-2, dưới tải) vẫn giữ — vẫn thấp hơn timeout
  5000ms **5,0 lần**. Để fallback #2 bắn tự nhiên cần 2 lần trễ >5s
  liên tiếp rồi lọt cửa sổ 2s (E8 §4.3) — với 1342 toggle quan sát được
  sự kiện này vẫn chưa từng xuất hiện. **Vẫn mở.**

## 6. Reboot giữa chừng + đính chính giờ reboot #29

### 6.1 Reboot trong lúc H6 chạy (mới)

- Lần chạy đầu: bắt đầu 14:50:09Z trên boot `75697729`
  (14:31:52Z), vite đã lên 14:50:13Z, **chết do reboot lúc
  14:50:59Z** — log E1 run4 lần 1 chỉ có 2 dòng (vite dev :5580,
  vite đã lên), chưa tới app mount. Không có dữ liệu đo nào mất
  (chưa đo gì).
- Boot mới `63a52041`, `uptime -s` 2026-11-13 14:50:59Z. Driver chạy
  lại từ đầu 14:52:59Z trên boot mới, chạy hết 7 E1 + 2 N10, xong
  15:10:14Z, không reboot thêm trong lúc chạy.
- Gap boot 14:31:52Z → 14:50:59Z = **19'07" — phá sàn gap reboot cũ
  31'47"** (#30 10:54:53Z → #31 11:26:40Z). Đánh số theo prereg đợt
  106 (14:31:52Z "nhiều khả năng là #32"): reboot này là **#33**.
  Caveat như H1: số #32 chưa được xác minh độc lập (không loại trừ
  reboot trung gian không quan sát được giữa #31 và 14:31:52Z) nên số
  #33 cũng mang tính tạm — ghi boot id + giờ chính xác làm chuẩn.
- Hệ quả cho các luồng khác: H1 đã trigger + xong hiram TRƯỚC reboot
  (14:42–14:44Z, trên boot cũ) nên không ảnh hưởng; các luồng đo dài
  khác tự kiểm boot của mình.

### 6.2 Đính chính giờ reboot #29 trong LIMITS G3 (đã sửa)

- File `docs/PHASE9_ROUND105_G3_HARNESS_LIMITS.md` §1, đính chính (1):
  dòng cũ "reboot #29 KHÔNG phải 08:56:39Z … khoảng 08:57:06–
  08:58:12Z" đã gạch bỏ + chèn khối đính chính H6: **giờ đúng là
  08:56:39Z**.
- Bằng chứng (đã kiểm lại từ đĩa, không nghe lại lời brief):
  - F7 đo trực tiếp `uptime -s` = **08:56:39Z** lúc 08:57:38Z trên
    boot mới `cff65e89` (`hidden_files/round105-g8/probe-notes.txt`
    dòng 20).
  - F9 xác minh độc lập: poller restart 08:57:45Z, cùng
    `uptime_since` 08:56:39 (G8 §2.9, `round105-g8.md`).
  - G8 kẹp hoạt động 13s (08:56:38Z→08:56:51Z).
- Vì sao G3 kẹp sai: G3 dùng timestamp log của **boot cũ** (F8 log
  cuối 08:57:05.772Z, F1 log cuối 08:57:03.660Z) — nhưng đồng hồ
  wall-clock của boot cũ chạy nhanh hơn boot mới **~25–27s** (cả hai
  log cuối đều nằm SAU giờ boot mới 08:56:39Z). Timestamp boot cũ
  không kẹp được thời điểm reboot. Bài học: giờ reboot chỉ lấy từ
  `uptime -s` đo trực tiếp trên boot mới (2 nguồn độc lập), không suy
  từ log boot cũ. (F1 đã ghi mâu thuẫn này trong `round104-f1.md`:
  "log lần 5 cũ có dòng tới 08:57:03Z, 24s sau giờ boot".)
- Đính chính (2) của G3 (F1 có 5 N10 + 9 E1) vẫn đúng, không sửa.

## 7. Giới hạn — đọc trước khi trích số

1. **0/7 flake mới không phải bằng chứng tỉ lệ đã giảm** (§4.2) — 7
   lần chạy trên máy yên/tải nhẹ, 2 ca cũ đều dưới tải nặng; xác suất
   0/7 khi tỉ lệ thật 1/10 là ~48%. Đừng trích "flake đã hết" hay
   "tỉ lệ nay 7,1%" như hằng số — Wilson 95% vẫn ~2–23%.
2. **Cơ chế flake vẫn chưa biết** — probe mới chỉ thu hẹp được nơi
   tìm (từng bước G3→G4 đã có timestamp + snapshot), chưa bắt được ca
   nào. Mọi giả thuyết §4.4 đều chưa có bằng chứng phân biệt.
3. **Tỉ lệ G5/N10 (0,90–1,12× / 1,00× / 0,91×) là số tải** — đừng
   trích làm tốc độ deint; 5/7 lần E1 phân loại yên nhưng vẫn chạy
   cùng lúc với luồng sibling (H4 blur probe) nên không phải chân yên
   sạch cho G1.
4. **Keydown gộp 49 lần vẫn chưa có lần fallback #2 tự nhiên nào** —
   0/1342 toggle không chứng minh fallback #2 không bao giờ bắn, chỉ
   chứng minh nó hiếm hơn ~1/1342 toggle-chiều trong điều kiện đã đo.
5. **Giờ reboot #33 mang tính tạm** (§6.1) — số thứ tự dựa trên prereg
   chưa xác minh độc lập; boot id + `uptime -s` mới là chuẩn.
6. `tsc` / `vite build` không chạy lại: H6 không đổi production code
   (chỉ thêm log vào 1 script harness) — theo tiền lệ G3/E8 §8.7;
   `node --check` script harness PASS; 9 lần chạy đều mount app thành
   công qua vite dev. Harness đổi md5 (xem §2) nên mọi lần chạy sau
   đợt 106 dùng md5 mới `ae6cd34a…` — đừng so md5 với `4ba1d86c…` cũ.
7. TTS 39 CẤM kiểm lại (không kiểm); birefnet 0 lần thành công (không
   thử); ci-security.yml vẫn 403 chờ user (ngoài phạm vi).
8. **Lỗi driver H6:** `summ_e1` lỗi `IndexError` ×7 trong
   `run-h6-driver.out` — 7 dòng tóm tắt E1 thiếu trong `run-h6.log`,
   đã khôi phục đủ từ report JSON (xem §1 + bổ sung cuối `run-h6.log`).
   Script phân tích `analyze-h6-g4-keydown.py` đọc trực tiếp JSON nên
   không bị ảnh hưởng.

## 8. File đã đổi/thêm (stage, không push) + cách chạy lại

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` — thêm log chẩn đoán
  G4 (md5 mới `ae6cd34a7dff3f6bda62199b5ab6c6fc`).
- `docs/PHASE9_ROUND105_G3_HARNESS_LIMITS.md` — sửa đính chính giờ
  reboot #29 (08:56:39Z + bằng chứng + bài học).
- `docs/PHASE9_ROUND106_H6_HARNESS_LIMITS.md` (file này).
- Log + dữ liệu: `hidden_files/round106-h6/` (`run-h6.sh`,
  `run-h6.log`, `run-h6-driver.out`, `analyze-h6-g4-keydown.py` +
  `.txt`, `e1-run4..10/` + `-run.log`, `60fps-deint-h6-n10-natural1/2/`
  + `-run.log`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round106-h6-harness.txt`
  (NUL, read-back OK).

```bash
# Chạy lại E1 với harness đã thêm probe (mặc định scratch round77-e1;
# đặt E1_SCRATCH riêng cho mỗi đợt như run-h6.sh):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h6/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Tổng hợp lại G4 + keydown từ đĩa:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h6/analyze-h6-g4-keydown.py
# Lần flake tới: đọc các dòng "G4-probe" trong e1-runX-run.log — bước
# nào ăn thời gian / store-hook lệch nhau sẽ hiện rõ ở đó.
```
