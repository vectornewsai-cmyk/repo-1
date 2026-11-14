# Đợt 105 G3 — Harness: hoàn thiện F8 đợt 104 (D6 recheck, G4 flake tái hiện, keydown chậm tự nhiên, O8 qua F9)

Ngày: 13/11/2026 (lượt cron 18:35 +07). Máy đo: VM này (CPU-only, Chromium
qua Xvfb + CDP `--disable-gpu`; boot hiện tại `3e4f237a` từ 11:26:51Z, sau
reboot #30; RAM khả dụng 543 MB lúc bắt đầu → 2087 MB lúc 11:40Z; load
0,13 → 2,11; 8–10 luồng đợt 105 chạy song song). **Không đo live mới**
(lý do §7). KHÔNG sửa production, KHÔNG sửa harness, KHÔNG push, KHÔNG
release/tag. Chỉ 1 file docs mới trong repo.

Nợ: LIMITS gộp đợt 104 §4 mục 1 — F8 chết do reboot #29, chỉ để lại dữ liệu
thô, chưa LIMITS, chưa stage batch. G3 hoàn thiện F8 từ dữ liệu thô đó
(`hidden_files/round104-f8/`), kiểm chứng độc lập toàn bộ, và đối chiếu
với dữ liệu E1 cùng đợt của luồng F1 trên đĩa (cùng script, cùng md5
harness) — đọc đĩa trước khi kết luận, theo tiền lệ báo cáo sai đợt 104.

## 1. Kết luận ngắn

- **D6 recheck: KHỚP HOÀN TOÀN — lần xác nhận thứ ba** (D6 → E8 → G3).
  Chạy lại đúng 2 script quantify của D6 + tính lại độc lập bằng script
  của E8 trên cùng dữ liệu: cả 3 output diff rỗng từng byte so với file
  F8 để lại. **0/24 đuôi bị chặn đạt tiêu chí ổn định-lệch; 0/38 đoạn**
  (kể cả 14 đoạn 0-block); near-miss 6 đều suy biến 1-tick. **D6-A vẫn bị
  bác; không có gì để sửa, không thử lại D6-A.**
- **F8 chạy xong 4/12 lần theo kế hoạch** (N10 thường ×2 + E1 ×2 hoàn
  thành, E1 run3 dở): N10 **4/4 cả 2 lần** (tỉ lệ 1,21× và 1,08×); E1
  **10/10 cả 2 lần** (G5 1,14× và 0,87×, đều PASS chắc, đều idle=tải);
  run3 dở: G0–G5 + G7a đều PASS rồi chết do reboot, không có report JSON.
  Harness md5 không đổi một byte suốt đợt.
- **PHÁT HIỆN CHÍNH — G4 flake TÁI HIỆN, không còn là ca đơn lẻ.**
  F1 run2 (cùng đợt 104, cùng script E1, cùng md5): **FAIL G4,
  tap=false, G3→G4 11,50s** — đúng chữ ký flake E1 run8 đợt 103
  (tap=false, 11,9s). Gộp đợt 104: **1/11 lần E1 hoàn thành (9,1%)**,
  cộng run3 dở: **1/12 (8,3%)**; mọi lần E1 từng có (D8 9 + E8 1 +
  F8 2 + F1 9 = 21 hoàn thành): **2/21 (9,5%, Wilson 95% ~3–29%)**.
  Cơ chế vẫn chưa biết (xem §4).
- **Keydown chậm tự nhiên: VẪN MỞ.** Gộp toàn bộ quan sát từng có:
  **40 lần chạy / 561 slot / 1122 toggle, wait chậm nhất 1004ms**
  (F8 E1 run2), **0 retry, 0 fallback, 0 abort** — vẫn thấp hơn timeout
  5000ms tới 5 lần.
- **O8: F8 không chạy — F9 đã bao phủ.** `run-f8.sh` không có bước O8;
  driver chết trước khi tới O8 (dù có). F9 chạy O8 trên cây gộp cuối
  `ca378bbf` (đã có code F3): **21/21 cả 2 engine, Δx khớp từng chữ**
  với D7/D9/E8/E9. G3 không chạy lại O8 (xem §6).
- **2 đính chính từ đĩa:** (1) ~~reboot #29 KHÔNG phải 08:56:39Z như
  brief — log cuối của F8 08:57:05.772Z, F1 resume 08:58:12Z, nên
  reboot xảy ra trong khoảng **08:57:06–08:58:12Z**~~ — **SAI, xem đính
  chính H6 dưới đây.** (2) LIMITS gộp đợt
  104 §1 đếm thiếu F1: F1 thực tế có **5 run N10 60fps + 9 run E1**
  (run5 lần 1 chết do reboot, resume xong), không phải "3 run deint
  60fps" — chính dữ liệu E1 của F1 mới chứa lần flake tái hiện (§4).

> **Đính chính của H6 (đợt 106, 13/11/2026) — thay thế đính chính (1)
> ở trên: reboot #29 = 08:56:39Z là ĐÚNG; khoảng 08:57:06–08:58:12Z
> của G3 là SAI.** Bằng chứng: F7 đo trực tiếp `uptime -s` = 08:56:39Z
> lúc 08:57:38Z trên boot mới `cff65e89`; F9 xác minh độc lập (poller
> restart 08:57:45Z, cùng `uptime_since` 08:56:39) — xem G8 §2.9
> (`hidden_files/round105-g8/probe-notes.txt` + `round105-g8.md`).
> Vì sao G3 kẹp sai: G3 dùng timestamp log của boot cũ (F8 log cuối
> 08:57:05.772Z, F1 log cuối 08:57:03.660Z) — nhưng đồng hồ wall-clock
> của boot cũ chạy nhanh hơn boot mới ~25–27s (cả hai log cuối đều nằm
> SAU giờ boot mới 08:56:39Z), tức timestamp boot cũ không kẹp được
> thời điểm reboot. Bài học: giờ reboot chỉ lấy từ `uptime -s` đo trực
> tiếp trên boot mới (2 nguồn độc lập), không suy từ log boot cũ.

## 2. D6 recheck — chạy lại độc lập (G3, diff rỗng cả 3)

| Script chạy lại | Dữ liệu | Kết quả G3 |
|---|---|---|
| `quantify-burst-vs-stable.py` (D6, round102-d6) | 12 lượt h | diff vs `quantify-h-recheck.txt` của F8 = **rỗng** |
| `quantify-i1-i12-burst-vs-stable.py` (D6) | 12 lượt i | diff vs `quantify-i1-i12-recheck.txt` của F8 = **rỗng** |
| `recheck-d6-independent.py` (E8, tính lại bằng max−min counter) | 24 file probe | diff vs `recheck-d6-independent.txt` của F8 = **rỗng** |

Số gộp (khớp D6/E8/F8 từng số): h (12 đuôi bị chặn) blk/s trung vị
**1,20** (max 2,56), đóng băng trung vị **14%** (min 0%), biên drift trung
vị **0,450s** (min 0,298s), nhảy vọt **34/76**; i (12 đuôi) blk/s trung vị
**1,25** (max 2,08), đóng băng trung vị **25%** (min 5%), biên drift trung
vị **0,847s** (min 0,429s), nhảy vọt **42/85**. Tính lại độc lập trên 38
đoạn (18 h + 20 i): h blk/s trung vị 1,06, đóng băng 4%, drift 0,400s;
i blk/s 0,92, đóng băng 16%, drift 0,522s; **số lần counter giảm trong
đoạn = 0** (counter đơn điệu — hai cách đếm khớp nhau); **0/38 đoạn**
đạt cả 3 tiêu chí; near-miss 6 đều là đoạn 1-tick suy biến (0 khoảng mẫu
nên đóng băng 0% + biên drift 0,000, nhưng blk/s = 0,00 — trượt tiêu chí
thứ ba). **Kết luận D6 đứng: 0/24 đuôi đạt tiêu chí ổn định-lệch.**

Caveat (như E8 §8.1): recheck dùng cùng dữ liệu gốc C3/D6 — đây là kiểm
tra lại phép tính, không phải kiểm tra lại dữ liệu gốc.

## 3. F8 — những gì chạy xong (đọc lại từ report JSON trên đĩa)

Driver `run-f8.sh` (08:40:09–08:57:05Z, boot `8c1c5131`, load lúc bắt đầu
6,01, RAM 1969 MB): N10 thường ×2 rồi E1 thường ×10. Reboot #29 cắt
ngang trong E1 run3; E1 run4–10 không chạy.

### 3.1 N10 thường ×2 (60fps deint, quan sát keydown chậm tự nhiên)

| Lần chạy | Exit | Slot | Pass | Tỉ lệ | playWait max | pauseWait max | Methods | Retry/fallback |
|---|---|---|---|---|---|---|---|---|
| N10-1 (08:40–08:42Z) | 0 | 11 | 4/4 | 1,21× | 400ms | 208ms | toàn `space` | 0 |
| N10-2 (08:42–08:44Z) | 0 | 11 | 4/4 | 1,08× | 284ms | 121ms | toàn `space` | 0 |

Cả 2 lần: 0 dòng `fallback store` / `space-retry` / `chưa giữ được`
trong log; 0 lỗi trang (C3 PASS). Tỉ lệ là số tải (load tới 19,71 lúc
kết thúc lần 2) — đừng trích làm tốc độ deint.

### 3.2 E1 thường ×2 hoàn thành + run3 dở

| Lần chạy | Exit | Pass | G5 | Idle | playWait max | pauseWait max | G3→G4 | G4 tap |
|---|---|---|---|---|---|---|---|---|
| E1-1 (08:44–08:48Z) | 0 | 10/10 | **1,14× PASS (chắc)** | tải | 371ms | 770ms | 6,33s | true |
| E1-2 (08:48–08:54Z) | 0 | 10/10 | **0,87× PASS (chắc)** | tải | 1004ms | 404ms | 5,18s | true |
| E1-3 (08:54–08:57Z) | — (chết) | — (không report) | 1,35× PASS theo log | tải | — | — | 2,57s | true |

- E1-1: G5 1 vòng (tỉ lệ 1,47/1,24/0,94/0,9/1,14 → mean = median 1,14);
  1 slot đóng băng (slot 2). Ghi chú: tóm tắt của driver ghi `g5=None`
  ở lần 1 là **artifact của script tóm tắt** (nó đọc `combinedMean`,
  trường này chỉ tồn tại khi ≥2 vòng G5) — JSON có `run1.mean=1,14`,
  `verdict=PASS`, `certain=true`. Không có mâu thuẫn thật.
- E1-2: G5 2 vòng (0,89 + 0,85 → combinedMean 0,87, combinedMedian
  0,90), PASS chắc. playWait max 1004ms là wait tự nhiên chậm nhất
  từng quan sát (vượt kỷ lục cũ 804ms, xem §5).
- E1-3 (dở): G0–G5 + G7a đều PASS trong log (G5 mean 1,35× median
  1,41; 11 FPS slot, không slot đóng băng; G7a R 0,67 → 0,51); log dừng
  ở 08:57:05.772Z sau dòng PASS G7a — **không có report JSON, không có
  `c77e1-headed.log`** (script chết trước khi ghi report). G3→G4 2,57s,
  tap=true — quan sát G4 hợp lệ dù lần chạy dở.
- Số slot E1 (11 hay 22) = 11 × số vòng G5 (1 hay 2 vòng tùy lần chạy)
  — đã kiểm JSON: run 1 vòng → 11 slot, run 2 vòng → 22 slot. Không
  phải dị thường.
- Harness không đổi một byte: md5 trước/sau mỗi lần chạy đều
  E1 `4ba1d86c458a9b2de1e8b423eb31ca7f`, N10
  `9ca985cd7c38978ce5aaadeedcf758e8` (= md5 D7 đã land); md5 hiện tại
  kiểm lại lúc 11:40Z khớp đúng 2 giá trị này. `node --check` cả 2
  script harness: **PASS**.

### 3.3 0 abort vẫn giữ

F8 hoàn thành 4 lần chạy, 0 toggle abort (không lần nào Space +
fallback đều thất bại). F8 không chạy lần fault nào nên không thêm dữ
liệu fault: gộp với E8 vẫn là **5 lần fault, 55 slot, 110 toggle,
2 retry + 3 fallback cứu thật, 0 abort**.

## 4. G4 flake TÁI HIỆN — phát hiện chính của đợt này

### 4.1 Bảng G3→G4 đợt 104 (E1 hoàn thành, F8 + F1 — cùng script, cùng md5)

| Lần chạy | G3→G4 | G4 tap | G4 verdict | Pass |
|---|---|---|---|---|
| F8 E1-1 | 6,33s | true | PASS (R 0,51) | 10/10 |
| F8 E1-2 | 5,18s | true | PASS (R 0,51) | 10/10 |
| F1 E1-1 | 2,64s | true | PASS (R 0,51) | 10/10 |
| **F1 E1-2** | **11,50s** | **false** | **FAIL (R 0,48)** | **9/10, exit=1** |
| F1 E1-3 | 3,66s | true | PASS (R 0,51) | 10/10 |
| F1 E1-4 | 4,59s | true | PASS (R 0,51) | 10/10 |
| F1 E1-5 | 2,28s | true | PASS (R 0,51) | 10/10 |
| F1 E1-6 | 1,90s | true | PASS (R 0,51) | 10/10 |
| F1 E1-7 | 2,79s | true | PASS (R 0,51) | 10/10 |
| F1 E1-8 | 2,37s | true | PASS (R 0,51) | 10/10 |
| F1 E1-9 | 2,19s | true | PASS (R 0,51) | 10/10 |
| F8 E1-3 (dở) | 2,57s | true | PASS (R 0,51) | — (không report) |

Phân phối 11 lần hoàn thành: gap sắp xếp 1,90 / 2,19 / 2,28 / 2,37 /
2,64 / **2,79** / 3,66 / 4,59 / 5,18 / 6,33 / **11,50** (trung vị
2,79s; không-flake 1,90–6,33s). Flake 11,50s = **4,1× trung vị**,
1,8× max không-flake — outlier rõ ràng, không phải đuôi phân phối
bình thường. Hai lần chạy của chính F8 (6,33s và 5,18s) là 2 giá trị
không-flake lớn nhất — đều dưới tải nặng (load 1-phút 19,71 lúc bắt đầu
E1-1; E1-2 chạy trong cửa sổ load 5-phút ~7,3).

### 4.2 Flake F1 run2 (08:41:57–08:45:32Z) — đúng chữ ký đợt 103 run8

- G3 PASS 08:43:13.569Z (trả đúng khung gốc, MAD = 0, tap=false).
- **11,50s im lặng hoàn toàn** — không một dòng log nào giữa G3 và G4.
- G4 08:43:25.072Z: R=0,48, hook `tap=false`, `hasEnhance=false`,
  `applied=[]` → **FAIL G4**, lần chạy kết thúc 9/10, exit=1 (lần E1
  duy nhất exit≠0 trong đợt 104).
- Đối chứng trong cùng lần chạy: G2 (08:43:10.979Z) bật deint bình
  thường — R 0,74 → 0,51, tap=true, `applied=["deinterlace"]`,
  MAD=0,5821. Flake chỉ xảy ra ở bước G4, không phải tap hỏng toàn cục.
- So sánh flake đợt 103 run8: tap=false, G3→G4 11,9s. Hai ca giống
  nhau về mọi mặt quan sát được: gap ~11,5–11,9s + im lặng giữa G3→G4
  + `tap=false`/`applied=[]` ở G4 + R vẫn < 0,8 (nên chỉ harness fail
  vì tap, không phải vì R).

### 4.3 Tỉ lệ flake

- Đợt 104 (hoàn thành): **1/11 = 9,1%**; cộng run3 dở: 1/12 = 8,3%.
- Mọi lần E1 từng có G4 (D8 9 + E8 1 + F8 2 + F1 9 = 21 hoàn thành):
  **2/21 = 9,5%** (Wilson 95% ≈ 3–29% — mẫu vẫn nhỏ, khoảng rộng).
- Kết luận: flake G4 **không còn là ca đơn lẻ**; tỉ lệ thực cỡ ~1/10
  lần chạy E1 dưới tải. **Cơ chế vẫn chưa biết** — không có dòng log
  nào giải thích 11,5s im lặng hay vì sao `hasEnhance=false` ở G4
  trong khi G2 cùng lần chạy áp tap bình thường. G3 không sửa gì để
  "vá" flake (chưa biết nguyên nhân — vá mù là code giả trá hình).
  Đề xuất cho đợt sau: log thêm trạng thái enhance/clip giữa G3→G4
  (snapshot `hasEnhance`/`applied` ngay trước khi đọc G4) để bắt cơ
  chế; muốn giảm tỉ lệ thì cần hiểu vì sao tap không áp, không phải
  nới ngưỡng G4.

### 4.4 Kế hoạch E1 ×10 của F8 — chưa đủ số, nhưng mục đích đã đạt

F8 chỉ hoàn thành 2/10 + 1 dở; 7 lần còn lại (run4–10) không chạy.
Nhưng mục đích của khối E1 ×10 là **theo dõi G4 ≥10 lần dưới tải để
bắt flake tái hiện** — mục đích này đã đạt nhờ 9 lần E1 của F1 cùng
đợt (11 lần hoàn thành gộp, 1 flake bắt được). 7 lần còn lại của riêng
F8 là nợ danh nghĩa, để cho đợt sau khi máy yên (xem §7), không phải
nợ chặn.

## 5. Keydown chậm tự nhiên lọt cửa sổ 2s của fallback #1 — VẪN MỞ

### 5.1 Quan sát mới đợt 104 (tính lại từ report JSON trên đĩa)

| Nguồn | Lần chạy | Slot | Toggle | Wait chậm nhất | Retry / fallback |
|---|---|---|---|---|---|
| F8 N10 ×2 | 2 | 22 | 44 | 400ms | 0 / 0 |
| F8 E1 ×2 | 2 | 33 | 66 | **1004ms** (E1-2 playWait) | 0 / 0 |
| F1 E1 ×9 | 9 | 132 | 264 | 837ms (pauseWait run3) | 0 / 0 |
| F1 N10 ×5 | 5 | 55 | 110 | 139ms | 0 / 0 |
| **Đợt 104 gộp** | **18** | **242** | **484** | **1004ms** | **0 / 0** |

(F1 N10 ×5: 20/20 pass, tỉ lệ 0,93–0,98, toàn `space`, 0 dòng FAIL
trong log. F1 E1 ×9: 8 lần 10/10 + 1 lần 9/10 do flake G4 §4 — flake
này không phải toggle abort: methods toàn `space`, không fallback.)

### 5.2 Gộp toàn bộ quan sát tự nhiên từng có

| Nguồn | Lần chạy | Slot | Toggle | Wait chậm nhất | Retry / fallback |
|---|---|---|---|---|---|
| E8 gộp (§4.2 LIMITS E8) | 22 | 319 | 638 | 804ms | 0 / 0 |
| Đợt 104 (F8 + F1) | 18 | 242 | 484 | 1004ms | 0 / 0 |
| **Tổng** | **40** | **561** | **1122** | **1004ms** | **0 / 0** |

Kỷ lục wait tự nhiên tăng 804ms → **1004ms** (F8 E1-2, dưới tải) —
vẫn thấp hơn timeout 5000ms **5,0 lần**. Để fallback #2 bắn tự nhiên
cần 2 lần trễ >5s liên tiếp rồi lọt cửa sổ 2s (xem E8 §4.3) — với 1122
toggle quan sát được thì sự kiện này vẫn chưa từng xuất hiện. Vòng lặp
fallback #2 đã bắn thật bằng fault tổng hợp (D7 E1 FB2, lật sau 112ms)
nên cơ chế xử lý đúng; chỉ thiếu một lần quan sát tự nhiên. **Vẫn mở.**

## 6. O8 — F9 đã bao phủ, G3 không chạy lại

So sánh phạm vi:

| Hạng mục | F8 (kế hoạch) | F9 (đã chạy) |
|---|---|---|
| O8 trong driver | Không có bước O8 trong `run-f8.sh` | `round104-f9-o8.sh` |
| Cây đo | (không đo) | Cây gộp cuối `ca378bbf` — **đã có code F3** (relabel snapshot bằng anchor, đụng `preview.tsx` + cả hai đường tick/pump) |
| Kết quả | — | **21/21 cả 2 engine, ngay lần đầu**; Chromium S5 Δx=0,112, S7 bóng 0,113 / mask 0,112; WebKit S5 Δx=0,194, S7 bóng 0,197 / mask 0,194; 0 retry; E0 0 lỗi |
| Khớp lịch sử | — | Δx khớp đúng từng chữ với D7/D9/E8/E9 |

- **Kết luận bao phủ: phần O8 của F8 được F9 bao phủ hoàn toàn — và
  F9 là O8 có giá trị hơn** (theo chính F9: "O8 sau khi fix land mới là
  O8 có giá trị" — O8 trên cây trước F3 không chứng minh được code F3
  không lệch mask-track). G3 không chạy lại O8.
- Lưu ý: O8 của F9 chạy 11:06–11:07Z trên boot `287705ad`; boot hiện
  tại `3e4f237a` (từ 11:26:51Z) là boot khác, và cây repo đã có thêm
  thay đổi từ các luồng đợt 105 — **O8 cần chạy lại ở đợt verify sau
  nếu cây đổi tiếp**, nhưng đó là nợ của verify, không phải của G3.

### Phần F8 vẫn chưa được kiểm chứng (nợ mở)

1. E1 run4–10 của chính driver F8 (danh nghĩa — thực chất đã bù bằng
   F1 9 lần cho mục đích theo dõi G4; xem §4.4).
2. Keydown chậm tự nhiên (§5) — 0 lần trong 1122 toggle.
3. Cơ chế flake G4 (§4.3) — tỉ lệ đã định lượng (~1/10), nguyên nhân
   chưa biết; cần log thêm trạng thái enhance giữa G3→G4.
4. O8 trên cây sau đợt 105 — thuộc về đợt verify sau, không phải G3.

## 7. Vì sao G3 không đo live mới

- Lúc bắt đầu lượt (11:38Z): RAM khả dụng **543 MB** — dưới ngưỡng
  800 MB trong brief; swap đã dùng 331 MB. E1 cần vite dev + Chromium
  headed — chạy lúc này có nguy cơ OOM/thrash và làm bẩn số đo.
- Sau đó RAM hồi lên 2087 MB (11:40Z) nhưng **8–10 luồng đợt 105 đang
  chạy song song** (load 1-phút 2,11, đang tăng) — máy không yên theo
  định nghĩa F5 (RAM + không probe song song, không phải loadavg).
  Chạy 7 lần E1 còn lại (~30 phút tuần tự) sẽ làm bẩn bằng chứng "yên"
  G1 của luồng sibling — đúng lý do F8 tránh tải nhân tạo trong
  `run-f8.sh`.
- Giá trị biên thấp: flake watch đã đạt mục đích nhờ dữ liệu F1 trên
  đĩa (§4); keydown chậm cần 2 lần trễ >5s liên tiếp — 7 lần E1 thêm
  (~154 toggle) gần như chắc chắn không bắt được (xác suất bắt trong
  1122 toggle qua là 0).
- Quyết định: **không chạy live, ghi rõ lý do; 7 lần E1 còn lại của
  driver F8 để cho đợt sau khi máy yên** (RAM ≥1500 MB, không sibling
  đang đo). Ghi nhận trung thực, không retry vô hạn, không đo gượng.

## 8. Giới hạn — đọc trước khi trích số

1. **D6 recheck dùng cùng dữ liệu gốc C3/D6** — kiểm tra phép tính,
   không kiểm tra dữ liệu gốc (§2 caveat).
2. **Tỉ lệ flake G4 2/21 dựa trên mẫu nhỏ** — Wilson 95% ≈ 3–29%;
   đừng trích "đúng 9,5%" như hằng số. Hai ca flake đều dưới tải
   (đợt 103 run8 và đợt 104 F1 run2, load 1-phút lúc bắt đầu 18,74) —
   chưa có ca flake nào trên máy yên để so sánh.
3. **Dữ liệu F1 dùng ở §4–§5 là đọc log/report trên đĩa, chỉ đọc**
   (F1 sở hữu LIMITS của chính nó) — G3 không chạy lại, không sửa
   gì trong `round104-f1/`. Nếu F1 đính chính số của mình thì bảng
   §4–§5 phải tính lại.
4. **Tỉ lệ N10/E1 (1,21×/1,08×/1,14×/0,87×/0,93–0,98×) là số tải**
   — đừng trích làm tốc độ deint; các lần này không đóng góp chân yên
   G1.
5. **O8 của F9 đo trên boot/cây khác boot hiện tại** (§6) — G3 không
   chạy lại O8; O8 cần chạy lại ở đợt verify sau nếu cây đổi.
6. `tsc` / `vite build` không chạy lại: G3 không đổi code nào (chỉ
   thêm 1 file docs) — theo tiền lệ E8 §8.7; `node --check` 2 script
   harness PASS; 4 lần chạy F8 đều mount app thành công qua vite dev.
7. TTS 39 CẤM kiểm lại (không kiểm); birefnet 0 lần thành công (không
   thử — RAM thấp); ci-security.yml vẫn 403 chờ user (ngoài phạm vi).

## 9. File đã đổi/thêm (stage, không push) + cách chạy lại

- `docs/PHASE9_ROUND105_G3_HARNESS_LIMITS.md` (file này) — file repo
  duy nhất G3 đổi/thêm.
- Log + dữ liệu: `hidden_files/round105-g3/` (script tính lại
  `analyze-g3-g4-keydown.py` + output `.txt`, 3 output recheck
  `recheck-d6-independent-g3.txt` / `quantify-h-g3.txt` /
  `quantify-i1-i12-g3.txt`, log `g3.log`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round105-g3-harness.txt`
  (1 entry, NUL, read-back OK).
- Dữ liệu gốc F8 vẫn ở `hidden_files/round104-f8/` (không sửa, chỉ đọc).

```bash
# D6 recheck — chạy lại đúng script D6 (diff vs .txt F8 phải rỗng):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d6/quantify-burst-vs-stable.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d6/quantify-i1-i12-burst-vs-stable.py
# D6 recheck — tính lại độc lập (script E8):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f8/recheck-d6-independent.py
# Bảng G4 + keydown gộp F8/F1 (script G3):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round105-g3/analyze-g3-g4-keydown.py
# 7 lần E1 còn lại của driver F8 (CHỈ khi máy yên: RAM >=1500MB, không sibling đo):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f8/run-f8.sh
# (driver sẽ chạy lại toàn bộ N10 x2 + E1 x10 — chưa tách riêng E1 run4-10)
```
