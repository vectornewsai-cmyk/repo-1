# PHASE9 ROUND102 D5 — EPERM: probe #21 + đóng khoảng mù #20 (nợ LIMITS gộp đợt 101 §4 mục 8)

> Luồng D5, đợt 102 vòng lặp Phase 9 VCut Studio (lượt cron 09:35 +07,
> 13/11/2026; làm việc ~02:39–02:52Z 13/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + đóng khoảng mù #20 kể từ probe #20
> (23:39:56Z 12/11) + quét writeFileSync theo chuẩn mới (đối chiếu
> snapshot B6) + ghi RAM hiện tại (birefnet: KHÔNG chạy — vẫn dưới
> ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền. KHÔNG tự đóng reboot #16 hay EPERM** — chỉ báo cáo
> "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 02:39:25Z
  báo **DEAD/STALE** (heartbeat age 10.769 s, last #20 23:39:56Z
  12/11, boot aa3f2b67, exit 1); `once` ngay sau đó là **probe #21,
  boot 249407b6 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=21), exit 0.
- **Khoảng mù #20: 23:39:56Z 12/11 → 02:39:32Z 13/11 (2h59'36") —
  ĐÃ ĐÓNG: chứa đúng 2 REBOOT, cả hai đều có giờ chính xác từng
  giây: #25 23:51:21Z (aa3f2b67 → 3a12a7d3) và #26 02:12:10Z
  (3a12a7d3 → 249407b6).** Đây là khoảng mù đầu tiên chứa 2 reboot
  mà cả hai đều chốt được giờ từng giây (mù #17 cũng chứa 2 reboot
  nhưng #16 chỉ kẹp ~4'). Khoảng cách #24 → #25 = **2h09'31"**,
  #25 → #26 = **2h20'49"** — đều trong dải quan sát
  (1h11'36"–3h04'35"). Chu kỳ nay là **26 lần / ~53h54' ≈
  2h04'/lần**. Reboot tiếp theo dự kiến **~04:16Z**.
- **Hoạt động liên tục 23:39:56Z → 01:47:27Z** (C6/C1 hạ cánh trên
  boot aa3f2b67, C9 poll 10 phút/lần + C2–C5/C7/C8 hạ cánh + C9
  verify + O8 + parent gộp trên boot 3a12a7d3) — không reboot nào
  khác trong đoạn này. **Khoảng trống không-bản-ghi cuối mù chỉ
  còn ~52'05"** (01:47:27Z → 02:39:32Z) — gồm 24'43" trước reboot
  #26 và 27'22" sau reboot #26 trên boot mới. **Không có reboot
  trung gian trong đuôi:** mọi reboot trung gian đều sẽ đòi một
  khoảng cách ≤24'43" — thấp hơn 3 lần so với khoảng cách chính
  xác ngắn nhất từng ghi (1h11'36") — và 0 file nào trên cả hai
  cây + /tmp trong đuôi (xem §2.3).
- **Không tìm thấy bằng chứng sóng EPERM thật trong các bản ghi còn
  lại của khoảng mù** — 0 dòng "sóng EPERM vẫn bật", 0 dòng
  "CẢNH BÁO: chờ sóng EPERM 10 phút", 0 lần "Operation not
  permitted" thật. 14 dòng "sóng EPERM đã tắt" trong mù (C3 ×12 +
  C9 O8 ×2) đều là **dương tính giả đã biết**. Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — ~38h29' trước probe #21. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 431 dòng / 132 file** (phạm vi
  2658 file); R7b đối chiếu 456 dòng / 149 file; copies 25 dòng /
  17 file; đối chiếu chéo 431+25=456=R7b, **chênh 0 — lần thứ tám
  liên tiếp**. +33 dòng / +8 file so với B6, giải thích đúng hết
  bằng diff (xem §2.6). 0 file biến mất, 0 async `.writeFile(`
  ngoài helper, 0 hit release*/build/.
- **RAM: 5 mẫu MemAvailable 464 / 430 / 1412 / 989 / 1795 MB**
  (max ~1,80 GB = 29% ngưỡng guard 6144 MB) — birefnet KHÔNG chạy,
  đúng quy tắc chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC
  (xem §3).
- **Reboot #16: VẪN MỞ, không quyết thay** — kẹp giữ nguyên
  07:26:03Z → ~07:30:00Z (~4'); C6 đã thử hết mọi nguồn mới (§2.5
  của C6). D5 không thử lại nguồn nào (đã cạn, theo đúng lệnh
  "KHÔNG tự đóng reboot #16").

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 02:39:00–02:39:25Z | boot_id `249407b6-27ba-436a-9aab-abcbde721eb8`; `who -b` Nov 13 02:12; `uptime -s` **2026-11-13 02:12:10Z** (uptime ~26'); journal chỉ 1 boot (249407b6, first entry 02:12:21Z); `last -x reboot` 02:12 still running; wtmp bắt đầu 02:12:21Z |
| `bash scripts/probe-eperm-v2.sh status` | 02:39:25Z | **DEAD/STALE**, exit 1 — heartbeat n=20, ts 23:39:56Z 12/11, boot aa3f2b67, age **10.769 s**; last sample probe #20; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 02:39:32Z | **probe #21, boot=249407b6, ok=2 fail=0**, exit 0; dòng `boot changed aa3f2b67 -> 249407b6` (uptime since 2026-11-13 02:12:10) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 02:39:32Z | **ALIVE**, age 0 s, n=21, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 55 dòng, trước lượt 52 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=21, ts
02:39:32Z, pid=7967, boot 249407b6-27ba-436a-9aab-abcbde721eb8).

Lưu ý phương pháp (nhắc lại A8 §4 mục 6): dòng `boot changed` của
probe **nhảy thẳng aa3f2b67 → 249407b6, bỏ qua boot trung gian
3a12a7d3** — vì không có probe nào chạy trên boot đó. Boot trung
gian được chứng minh bằng log sibling (C9 poll.log: boot
3a12a7d3 từ 23:52:38Z tới 01:22Z; header C3/C4/C5 ghi boot
3a12a7d3) — xem §2.2. Đây là lần thứ hai bước nhảy đơn của probe
che 2 reboot (lần đầu là mù #17 che #16+#17, nhưng lần này cả hai
reboot đều chốt được giờ từng giây từ nguồn độc lập).

## 2. Điều tra khoảng mù kể từ probe #20

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 02:39–02:40Z)

- Boot hiện tại: `uptime -s` = **2026-11-13 02:12:10Z**, boot_id
  `249407b6-27ba-436a-9aab-abcbde721eb8` — khác boot của probe #20
  (aa3f2b67).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 249407b6,
  first entry 02:12:21Z, last 02:38:50Z). `last -x reboot`: chỉ 1
  dòng (02:12, still running). wtmp bắt đầu 02:12:21Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.

### 2.2 Hai reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 25 | **23:51:21Z (chính xác từng giây)** | aa3f2b67 → 3a12a7d3 | C9 poll.log: poll 23:51Z 1/8 trên boot aa3f2b67 → poller chết cùng reboot (ps=0) → khởi động lại 23:52:38Z trên boot 3a12a7d3 (ghi rõ "REBOOT #25 lúc ~23:51:21Z"); C5 + C4 header ghi "reboot #25 23:51:21Z"; C8 ghi "~23:52:16Z" — lệch ~55s, C9 đã đính chính trong log gộp ("C8 lệch ~55s"). Giờ 23:51:21Z là giờ boot đọc từ `uptime -s` sau reboot — cùng phương pháp với #24 (21:41:50Z). |
| 26 | **02:12:10Z (chính xác từng giây)** | 3a12a7d3 → 249407b6 | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 02:12:21Z); `last -x reboot` (02:12, still running); wtmp bắt đầu 02:12:21Z. Không ai ghi nhận lúc xảy ra (không observer nào còn sống sau 01:47:27Z — xem §2.3). |

Chu kỳ reboot nay là **26 lần trong ~53h54'** (từ ~20:18Z 10/11 tới
02:12:10Z 13/11) — trung bình ~2h04'/lần theo cách đếm của W7/X7
(tổng thời gian / số reboot; C6: 24 lần / ~49h24' ≈ 2h03').
Khoảng cách #24 → #25 là **2h09'31"**, #25 → #26 là **2h20'49"**
— đều nằm gọn trong dải quan sát 1h11'36"–3h04'35", không phá kỷ
lục nào. Reboot tiếp theo dự kiến **~04:16Z** (02:12:10Z +
~2h04') — dải khoảng cách quan sát cho phép lệch ~1h như đã thấy
ở #24 (B6 dự báo ~22:36Z, thực tế 21:41:50Z, lệch ~54'). Mọi
probe nền đều chết theo reboot; v2 chỉ đảm bảo cái chết được ghi
nhận + lượt sau hồi phục bằng 1 mẫu mới.

Khoảng mù #20 là **khoảng mù thứ 13 liên tiếp (#8–#20) chứa
reboot**.

### 2.3 Hoạt động trong khoảng mù — vì sao không có reboot nào khác, và đuôi mù ~52' không chứa reboot trung gian

Hoạt động ghi đĩa liên tục 23:39:56Z → 01:47:27Z:

- **23:39–23:51Z (boot aa3f2b67):** C6 LIMITS 23:48:xx, C8
  `probe-86n10-config-fps.mjs` 23:50:xx (file cuối trước reboot),
  C1 benchmark `webkit_blob_flaky_101c1_websrc.mjs` 23:41:xx +
  `.json` 23:43:xx, C8 `clicktest-77e1-deint-fps.mjs` 23:49:xx;
  C9 poll 23:41Z 0/8 → 23:51Z 1/8 (C6) trên boot aa3f2b67. Cửa sổ
  23:39:56Z → 23:51:21Z chỉ 11'25" và có hoạt động suốt — không
  chỗ cho reboot trung gian.
- **23:52:38Z → 01:47:27Z (boot 3a12a7d3):** C9 poll 10 phút/lần
  (23:52Z restart → 00:02Z 1/8 → 00:12Z 2/8 → 00:22Z 3/8 →
  00:32Z 4/8 → 00:42Z 6/8 → 01:22Z 6/8 → 01:32Z "8/8" theo glob,
  thực chất 7/8 + closing — xem C9) — **mọi poll đều ghi boot
  3a12a7d3**; C2 LIMITS 00:27Z, C7 LIMITS 00:22Z, C8 LIMITS
  00:12Z, C3 LIMITS 00:35Z, C5 LIMITS 00:38Z, C4 LIMITS 01:23Z,
  LIMITS gộp đợt 101 01:31Z, GAP_ANALYSIS 01:31Z, C9 VERIFY LIMITS
  01:47Z, build-loop-log 01:47:27Z (parent closing + C9 bổ sung).
  Poller sẽ chết nếu có reboot — không poll nào báo chết giữa
  chừng ngoài #25 lúc 23:51:21Z.
- **Sau 01:47:27Z thì không có bản ghi nào cho tới probe #21:**
  khoảng trống không-bản-ghi **~52'05" (01:47:27Z → 02:39:32Z)** —
  file cuối trước khoảng trống là `build-loop-log.md` 01:47:27Z
  (hidden_files) và `PHASE9_ROUND101_C9_VERIFY_LIMITS.md` 01:47:xxZ
  (repo-1; kẹp bằng cả hai cây theo A8 §4 mục 10 — lấy mốc muộn
  nhất 01:47:27Z). Trong cửa sổ này **không có file nào trên cả
  hai cây** (`find -newermt` 01:47:27Z–02:39:32Z chỉ trả về đúng
  file build-loop-log làm mốc, ngoài log/heartbeat probe của chính
  lượt này) **và không có file nào trong /tmp**. Đuôi mù ~52' dài
  hơn đuôi mù #19 (~48') — vì đợt 101 đã đóng từ 01:47Z và đợt
  102 chỉ spawn lúc 02:35:51Z (09:35:51 +07), chưa kịp ghi file
  nào trước probe #21.

**Không có reboot trung gian trong đuôi ~52':** đuôi này CHỨA
reboot #26 (02:12:10Z) — khác đuôi mù #19 (đã chứng minh không
chứa reboot). Nhưng không có reboot trung gian NÀO KHÁC ngoài
#26, với lập luận sàn khoảng cách mạnh hơn mọi đuôi trước:

- Đuôi chia làm hai đoạn bởi #26: 01:47:27Z → 02:12:10Z
  (**24'43"**, trên boot 3a12a7d3) và 02:12:10Z → 02:39:32Z
  (**27'22"**, trên boot 249407b6).
- Mọi reboot trung gian trong đoạn đầu đều sẽ đòi một khoảng cách
  ≤24'43" (từ reboot đó tới #26); mọi reboot trung gian trong
  đoạn sau đều sẽ đòi một khoảng cách ≤27'22" (từ #26 tới reboot
  đó). Cả hai đều **thấp hơn ~3 lần so với khoảng cách chính xác
  ngắn nhất từng ghi (1h11'36", #23 → #24)** — và thấp hơn cả
  kẹp ngắn nhất chưa chính xác (#16 → #17 ~31'–35').
- Bổ sung: 0 file nào trong đuôi trên cả hai cây + /tmp; cron
  đợt 102 spawn 02:35:51Z nhưng không thread nào ghi file trước
  probe #21 (02:39:32Z).

Đây KHÔNG phải chứng minh tuyệt đối (sàn khoảng cách là thực
nghiệm, không phải định luật — một reboot trung gian với khoảng
cách kỷ lục ngắn vẫn có thể xảy ra về mặt lý thuyết), nhưng là
lập luận loại trừ mạnh nhất từng có cho một đuôi mù: **gần như
chắc chắn chỉ đúng 2 reboot (#25, #26) trong toàn bộ khoảng mù
#20 — đã xác nhận, không còn chỗ hợp lý cho reboot trung gian.**
(Lưu ý như mọi lần: lập luận này chỉ loại trừ reboot, không loại
trừ sóng EPERM — sóng không đổi boot_id/uptime.)

### 2.4 Bảng khoảng cách liên tiếp đã xác nhận (cập nhật từ C6 §2.4)

| Cặp | Khoảng cách |
|---|---|
| #14 ~03:25Z → #15 05:17:47Z | ~1h53' |
| #15 05:17:47Z → #16 ~07:26–07:30Z | ~2h08'–2h12' |
| #16 ~07:26–07:30Z → #17 08:01:15Z | ~31'–35' (kẹp, không phải giờ chính xác) |
| #17 08:01:15Z → #18 09:24:17Z | 1h23'02" |
| #18 09:24:17Z → #19 11:30:25Z | 2h06'08" |
| #19 11:30:25Z → #20 13:24:41Z | 1h54'16" |
| #20 13:24:41Z → #21 15:24:27Z | 1h59'46" |
| #21 15:24:27Z → #22 17:25:39Z | 2h01'12" |
| #22 17:25:39Z → #23 20:30:14Z | 3h04'35" (dài nhất) |
| #23 20:30:14Z → #24 21:41:50Z | **1h11'36" (ngắn nhất có giờ chính xác)** |
| #24 21:41:50Z → #25 23:51:21Z | 2h09'31" |
| #25 23:51:21Z → #26 02:12:10Z | 2h20'49" |

Sàn khoảng cách chính xác vẫn là 1h11'36" (không đổi). Hệ quả cho
§2.3: mọi reboot trung gian trong đuôi mù #20 đều sẽ đòi một
khoảng cách ≤27'22" — dưới 40% sàn này.

### 2.5 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 101 + đợt 102 tới lúc này

Khoảng mù 23:39:56Z 12/11 → 02:39:32Z 13/11 (2h59'36") được phủ
bởi các luồng sibling đợt 101 (C1–C9, làm việc tới ~01:47:27Z) +
khoảng trống ~52' + spawn đợt 102 (~02:35:51Z, chưa có file nào
trước probe #21). Đã đọc lại log thật (grep `sóng EPERM vẫn bật`
/ `CẢNH BÁO: chờ sóng` / `Operation not permitted` trên toàn bộ
cây `hidden_files/round101-*` + `build-loop-log.md`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| C1–C9 (`docs/PHASE9_ROUND101_*.md` + log) | 23:39–~01:47Z | 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật |
| C3 (12 lượt probe WebKit h1–h12) | 00:16–00:23Z | 12 dòng "sóng EPERM đã tắt" (00:16:03Z, 00:16:43Z, 00:17:22Z, 00:18:00Z, 00:18:34Z, 00:19:08Z, 00:19:34Z, 00:20:02Z, 00:21:34Z, 00:22:03Z, 00:22:30Z, 00:23:30Z) — **dương tính giả đã biết** |
| C9 O8 (Chromium + WebKit) | 01:42–01:43Z | 2 dòng "sóng EPERM đã tắt" (01:42:21Z, 01:43:13Z) — **dương tính giả đã biết**; O8 21/21 cả 2 engine ngay lần đầu |
| C6 (file probe-notes của chính C6) | — | Các hit grep chỉ là C6 trích lại số đếm "0 vẫn bật / 0 CẢNH BÁO / 0 Operation not permitted thật" — không phải sự kiện |
| 01:47:27Z → 02:39:32Z | — | **Không có bản ghi nào** (đuôi mù ~52' — xem §2.3) |
| Đợt 102 (D2–D9) | ~02:35Z– | Chưa có file nào trước probe #21 (dir `round102-d2`…`round102-d9` đã tạo, D3/D4 đã có script trên đĩa nhưng mtime sau probe #21) — 0 nhắc EPERM |

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 14 dòng "sóng EPERM đã tắt, khởi động vite"
trong khoảng mù (C3 ×12 + C9 O8 ×2) đều là dòng in khi lần ghi
thử ĐẦU TIÊN thành công ngay (code launcher `waveOff=true` ở
lần write đầu) — in mặc định cả khi không có sóng. Bằng chứng
phân biệt: **0 dòng "sóng EPERM vẫn bật sau …s chờ"** và **0
dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"** trong toàn bộ cây
round101 tới lúc này; **0 lần "Operation not permitted" thật**
(mọi hit grep đều là chữ trong probe-notes của C6).

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **~52' cuối (01:47:27Z → 02:39:32Z) là mù hoàn toàn**,
  đủ dài để chứa nhiều sóng ~16 phút mà không để lại dấu vết nào
  trong hồ sơ — nhưng **đã loại trừ reboot trung gian trong đuôi
  bằng lập luận sàn khoảng cách** (§2.3), nên đuôi mù này "sạch"
  ở khía cạnh reboot, chỉ còn sóng là chưa loại trừ.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~38h29' trước probe
  #21 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được tuyên
  bố là đã hết.
- Khoảng trống không-bản-ghi ~52' dài hơn đuôi mù #19 (~48') —
  vì đợt 101 đóng sớm (01:47Z) và đợt 102 spawn muộn (02:35:51Z).

### 2.6 Quét writeFileSync (snapshot 02:46:25–02:48:23Z)

Chạy lại đúng script chuẩn mới của B6 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round102-d5`:

- Chuẩn mới: **431 dòng / 132 file** (phạm vi 2658 file).
  B6: 398 dòng / 124 file (phạm vi 2629 file).
- R7b (đối chiếu): **456 dòng / 149 file**. B6: 423 / 141.
- Copies: **25 dòng / 17 file** — y hệt B6.
- Đối chiếu chéo 431+25=456=R7b, **chênh 0 — lần thứ tám liên
  tiếp**.
- **+33 dòng / +8 file so với B6, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ ngoại trừ
  GAP_ANALYSIS):
  - +7 `docs/PHASE9_ROUND100_B6_EPERM_PROBE_LIMITS.md` (file LIMITS
    của chính B6 — mới sau snapshot B6)
  - +1 `docs/PHASE9_ROUND100_LIMITS.md`
  - +1 `apps/web/scripts/probe100b3.mjs` (B3 đợt 100)
  - +6 `apps/web/scripts/probe101c5-frame-parity.mjs` (C5 đợt 101)
  - +5 `apps/web/scripts/probe101c4-frame-parity.mjs` (C4 đợt 101)
  - +1 `apps/web/scripts/probe101c3.mjs` (C3 đợt 101)
  - +5 `apps/web/scripts/probe102d4-frame-parity.mjs` (D4 đợt 102
    — đã hạ cánh trước snapshot này)
  - +6 `apps/web/scripts/probe102d3-frame-parity.mjs` (D3 đợt 102
    — đã hạ cánh trước snapshot này)
  - +1 `PHASE9_GAP_ANALYSIS.md` (13 → 14 dòng — closing đợt 101)
  - Tổng: 7+1+1+6+5+1+5+6+1 = **33** ✓
- **0 file biến mất** (scope +29 file: 8 script probe/analyze mới
  + 2 benchmark webkit-blob-flaky + 10 docs LIMITS đợt 100 +
  9 docs LIMITS đợt 101 = 29 ✓).
- Async `.writeFile(` ngoài helper: **0** (chỉ 2 helper
  epermRetry.js:116 + eperm-retry.mjs:71, như mọi lần).
- Hit list **0 đường dẫn release*/build/**.

## 3. RAM (birefnet: KHÔNG chạy)

5 mẫu MemAvailable trong lượt: **464 / 430 / 1412 / 989 / 1795 MB**
(02:39:00Z, 02:39:32Z, ~02:44Z, 02:45:48Z, 02:48:23Z). Max ~1,80 GB
= **29% ngưỡng guard 6144 MB** — ngang max 1,77 GB (29%) của C6
lúc cuối lượt. Mẫu thấp 430 MB gần kỷ lục thấp 447 MB của C6 /
507 MB của X7 — RAM dao động mạnh theo tải các luồng song song
đợt 102 đang spawn. Birefnet KHÔNG chạy, đúng quy tắc parent đợt
92 §3 mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC;
chạm ≥ 6 GB mới thử lại). Birefnet-general vẫn 0 lần chạy thành
công trong gói.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Kẹp khoảng trống không-bản-ghi bằng cả hai cây** (A8 §4 mục
   10): lượt này file cuối trước khoảng trống khác nhau giữa hai
   cây (hidden_files: build-loop-log.md 01:47:27Z; repo-1: C9
   VERIFY LIMITS 01:47:xxZ) — lấy mốc muộn nhất (01:47:27Z).
2. **Đuôi mù nằm gọn trong một boot đã xác định thì loại trừ được
   reboot bằng uptime** (C6 §4 mục 2): áp dụng cho đoạn SAU #26
   (02:12:10Z → 02:39:32Z) — `uptime -s` vẫn 02:12:10Z + boot_id
   không đổi lúc probe #21 nên không có reboot nào trong đoạn
   này. Không áp dụng cho đoạn TRƯỚC #26 (01:47:27Z → 02:12:10Z)
   — đoạn đó dùng lập luận sàn khoảng cách (§2.3).
3. **Lập luận sàn khoảng cách cho đuôi mù chứa reboot đã biết**
   (mới, lượt này): nếu đuôi chứa đúng 1 reboot đã biết giờ (#26
   02:12:10Z), mọi reboot trung gian đều đòi một khoảng cách ≤
   độ dài đoạn đuôi ngắn nhất (ở đây ≤24'43") — thấp hơn ~3 lần
   sàn khoảng cách chính xác từng ghi (1h11'36"). Chỉ dùng khi
   đuôi đã kẹp chặt bằng hoạt động liên tục ở cả hai đầu (ở đây:
   C9 poll tới 01:47Z + probe #21 lúc 02:39:32Z). Ghi rõ đây là
   loại trừ thực nghiệm, không phải chứng minh tuyệt đối.
4. **Dòng `boot changed` của probe có thể bỏ qua boot trung gian**
   (A8 §4 mục 6, nhắc lại): lượt này bước nhảy đơn aa3f2b67 →
   249407b6 che boot 3a12a7d3 — phải đối chiếu log sibling / poll
   để khôi phục boot trung gian, đừng tin bước nhảy là 1 reboot
   duy nhất. Lần này cả hai reboot đều chốt được giờ từng giây từ
   nguồn độc lập (C9 poll.log + uptime -s).
5. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8):** lượt này áp dụng lại: 14 dòng "đã tắt" trong
   khoảng mù (C3 ×12, C9 O8 ×2) đều là dương tính giả; 0 dòng
   "vẫn bật", 0 "Operation not permitted" thật.
6. **Kiểm tra số liệu lịch sử trước khi trích lại** (B6 §4 mục 11):
   lượt này tính lại chu kỳ (26 lần / ~53h54' ≈ 2h04') và các
   khoảng cách #24 → #25 (2h09'31"), #25 → #26 (2h20'49") từ giờ
   boot gốc trong log probe + poll.log, thay vì copy số của C6.
   **Đính chính nhỏ:** giờ reboot #25 đúng là **23:51:21Z** (C9
   đính chính C8 lệch ~55s; C6/MEMORY ghi "~23:52:16Z" là giờ C8
   ước lượng lúc xảy ra, không phải giờ boot).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #21 OK 2/2) — và ~52' cuối khoảng mù #20 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~38h29' trước
   probe #21.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). D5 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #20 dài ~2h59'36" chứa **2 reboot mà chỉ C9 ghi nhận
   gián tiếp qua poller chết** (#25) và **không ai quan sát lúc
   xảy ra** (#26); khoảng trống không-bản-ghi cuối mù nay là ~52'
   (đủ chứa nhiều sóng ~16').
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3, V6 §5 mục 3, W7 §5 mục 3,
   X7 §5 mục 3, Y8 §5 mục 3, Z7 §5 mục 3, A8 §5 mục 3, B6 §5 mục
   3, C6 §5 mục 3; 3 dòng lạ 11:59–12:00Z vẫn còn trong log, không
   thêm dòng lạ mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h04'/lần** (26 lần/~53h54'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục. Reboot tiếp theo dự kiến **~04:16Z**; lúc 02:48:23Z máy vẫn
   trên boot 249407b6. Dải khoảng cách quan sát nay là
   **1h11'36"–3h04'35"**.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 5 mẫu MemAvailable
   **464 / 430 / 1412 / 989 / 1795 MB** (max ~1,80 GB = 29%
   ngưỡng guard 6144 MB). Max vẫn dưới một phần ba ngưỡng guard nên
   chưa đủ mức thử lại theo quy tắc parent đợt 92 §3 mục 7. Ghi rõ
   để parent quyết: nếu RAM khả dụng chạm ≥ 6 GB thì mới thử lại.
   Birefnet-general vẫn 0 lần chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
9. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
   kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
   mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
   cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
   kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
   D5 không thử lại nguồn nào, theo đúng lệnh.
10. **Khoảng mù #21 bắt đầu từ 02:39:32Z** (probe #21) — lượt sau
    (probe #22) đối chiếu từ mốc này. Reboot tiếp theo dự kiến
    ~04:16Z.
11. **Đính chính giờ reboot #25:** đúng là **23:51:21Z** (C9
    đính chính C8 lệch ~55s) — MEMORY/C6 ghi "~23:52:16Z" là giờ
    C8 ước lượng, không phải giờ boot. Số thứ tự #25, boot
    3a12a7d3, và các ước lượng khác đều khớp; chỉ giờ từng giây
    được hiệu chỉnh 55s sớm hơn.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND102_D5_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round102-d5-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d5.md`
(log luồng); scratch trong `hidden_files/round102-d5/` (scan-wfs.sh,
scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
wfs-r7b.txt, files-copies.txt, wfs-copies.txt, probe-notes.txt);
log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
