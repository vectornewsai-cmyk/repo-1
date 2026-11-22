# PHASE9_ROUND153_T5_INFRA_LIMITS — WATCHER-152 CHẾT THEO #44; BOOT #45 (401fca75) REPLAY MUỘN 63 PHÚT; KẾT LUẬN (b) CẦN CƠ CHẾ RESPAWN TỐI THIỂU

> Luồng T5, đợt 153, lượt cron 15:35 +07 20/11/2026 (mở 08:35:51Z;
> T5 mở thực tế ~08:37Z). Repo `~/workspace/repo-1` (cây làm việc,
> KHÔNG có `.git` local — KHÔNG push). **BOOT MỚI #45
> 401fca75-bece-45b6-88fa-b12f602d6390** (btime **07:32:38Z** —
> /proc/stat btime 1795159958; `who -b` 07:32; /proc/1 07:32:49Z;
> uptime neo boot 07:32:38Z — khớp btime tới từng giây).
> **KẾT LUẬN (b) — WATCHER CẦN CƠ CHẾ RESPAWN TỐI THIỂU SAU
> REBOOT (phác thảo ở §7, KHÔNG code ngay — parent quyết).**
> Bằng chứng ở §4–§6: watcher-152 chết theo #44 (log dừng
> 07:04:36Z, 0 NEWBOOT, không watcher nào chạy từ đó tới nay);
> **đợt 152 KHÔNG thiệt hại gì** (O8 xong trước #44, sampler T9
> tự khởi động lại bằng tay sau 71 s, T7/T10 đóng bình thường
> trên #44) — nhưng **đợt 153 thiệt hại thật, đo được: boot #45
> replay bắt đầu muộn boot+63'02" và hệ thống chỉ đủ 11 gói
> lúc ~boot+76', chậm ~38' so với đường watcher ở #43
> (cờ boot+37'55")**; cửa sổ reboot → phiên mở (63+ phút)
> không có ai giám sát, và khởi động lại bằng tay không bao
> giờ bao phủ được cửa sổ đó (quyết (q) đợt 149 chỉ đúng khi
> có agent trong phiên). **KHÔNG push. KHÔNG release/tag.**
> T5-153 KHÔNG khởi động watcher mới, KHÔNG chạy repair,
> KHÔNG chạy postboot check-only (replay đang giữ lock apt +
> T0-153 đang làm boot survey — tránh tranh chấp; xem §4.3).
> **KHÔNG tự chạy birefnet** (thuộc T9). KHÔNG đụng file
> workflow (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM
> kiểm lại. Mâu thuẫn đồng hồ mới (§5) giao T2-153 phán.

## 1. Timeline (giờ UTC, 20/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 05:20:57Z | Reboot #43, boot 18e179e0 (btime; xem LIMITS T5-152) |
| 05:44:02Z | Watcher-152 START, pid 17990, boot 18e179e0 |
| 05:46:03Z | EARLY-REPAIR (h) kích hoạt (boot+25m06s); verify form-B exit=1 |
| 05:58:52Z | --repair exit=0; postboot poll1 exit=0; **cờ POSTBOOT_PASS boot 18e179e0** (poll=1) |
| 06:14:27–06:17:18Z | O8-152 PASS 3/3 trên boot 18e179e0 (chuỗi FULL PASS 9 → 10) |
| 06:38Z | T8-152 đóng cờ |
| 07:04:11Z | **Reboot #44, boot c741f5e6** (btime 1795158251; T7-152 + T9-152) |
| 07:04:36Z | **Heartbeat CUỐI watcher-152** (poll, boot 18e179e0) — log dừng hẳn sau dòng này |
| 07:05:32Z | Sampler + B2-watcher T9 khởi động lại **bằng tay** (pid 1827/1828) — gap 71 s |
| 07:31:54Z | T7-152 kiểm lần 5: boot vẫn c741f5e6 (ghi trong NOTES.md) |
| 07:32:38Z | **btime boot 401fca75 (#45)** — CHỒNG LẤN với hoạt động trên c741f5e6 (xem §5) |
| 07:42:34Z | Mẫu sampler CUỐI trên c741f5e6 (38 mẫu boot này, 07:05:32–07:42:34Z) |
| 07:54:47Z | T9-152 đóng cờ (sampler đã dừng lấy mẫu từ 07:42:34Z) |
| 07:57:26–47Z | T7-152 kiểm cuối: boot vẫn c741f5e6 |
| 08:02:00Z | T7-152 đóng cờ (0 byte — quyết (l) nhắc T7 đợt sau ghi nội dung) |
| 08:14:28Z | T10-152 đóng cờ — "Boot lúc đóng c741f5e6 (#44)" |
| 08:18:19Z | Aggregate 152 mtime lần cuối — "không reboot nào sau #44" |
| 08:35:13Z | Replay os-intent trên boot #45 bắt đầu (pid 895; xem §3) — boot+~63' |
| 08:35:40Z | dpkg.log boot #45: 2 dòng startup đầu tiên (boot+63'02") |
| 08:35:51Z | Lượt cron đợt 153 mở; T0-153 bắt đầu boot survey |
| ~08:37Z | T5-153 mở: boot 401fca75, uptime 1:04, **không watcher nào chạy** |
| ~08:47Z | apt-get update của replay xong (~12', mirror chậm); chuyển sang install |
| 08:48:27Z | Đo bằng script (§A): dpkg 848 dòng, lists 39, GST 107; 7/11 gói installed |
| 08:49:10Z | **11/11 gói installed, GST 269** (= debroot) — hệ thống đủ gói lúc ~boot+76' |
| 08:49:10Z | Replay VẪN CHẠY (apt-get pid 27294, closing pass); chưa có postboot check-only nào PASS |

## 2. Watcher-152 đã chết — xác nhận bằng script từ log gốc

File: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t5/replay-watch-152.log`
(mtime cuối 07:04:36Z; 17.354 B; số đếm ở §A.1).

| Đếm | Giá trị |
|---|---|
| Tổng dòng | 143 |
| Dòng `REPLAY-WATCH-152-START` | 1 (05:44:02Z, pid 17990, boot 18e179e0) |
| Dòng poll (` poll `) | 136 |
| Dòng `NEWBOOT` | **0** |
| Dòng `REPLAY-WATCH-152-END` | 0 |
| Dòng `EARLY-REPAIR` / `FLAG-WRITTEN` | 1 / 1 (05:46:03Z / 05:58:52Z) |
| Giá trị `boot=` xuất hiện | **chỉ `18e179e0`** |
| Dòng chứa `401fca75` / `c741f5e6` | **0 / 0** |

- Dòng cuối log (nguyên văn):
  `2026-11-20T07:04:36Z boot=18e179e0 poll dpkg_lines=795 md5=d964a240 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=110 lists=75`
- Heartbeat cuối 07:04:36Z — **25 s SAU btime #44 (07:04:11Z)**,
  cùng họ nghịch lý đồng hồ đã biết (btime boot mới sớm hơn mẫu
  cuối boot cũ; xem LIMITS T5-152 §2.2 — không phải mâu thuẫn mới).
- **Không watcher nào chạy lúc T5-153 mở** (~08:37Z) và lúc đo
  script (08:48:27Z): `pgrep -af 'replay-watch-15[23]\.sh'`
  trả về rỗng. (Caveat: lệnh `pgrep -af 'replay-watch'` không
  neo pattern đã khớp chính shell exec của T5 — pid 2152 —
  đã nhận diện là tự khớp, không phải watcher; xem F-153-T5-1.)
- Watcher-152 đã hết hạn cứng 08:30Z từ trước khi T5-153 mở;
  dù không chết theo #44 thì nó cũng đã hết hạn. Nhưng điểm
  mấu chốt: **từ 07:04:36Z tới nay (~08:48Z, hơn 1 giờ) không
  có watcher nào giám sát bất kỳ boot nào** — gồm toàn bộ
  thời gian sống của boot #44 sau 07:04Z và toàn bộ 63 phút
  đầu của boot #45.

## 3. Boot #45 (401fca75) — replay MUỘN, rootfs làm mới, hiện gần đủ

Trạng thái đo trực tiếp (script §A.5–§A.6, lúc 08:48:27Z;
đo lại tay 08:49:10Z):

| Chỉ số | Boot #45 (401fca75) lúc 08:48:27Z | Boot #43 (18e179e0) lúc T5-152 mở | Boot #41 (2e430750, tới tự nhiên) |
|---|---|---|---|
| Hoạt động dpkg đầu | 08:35:40Z (**boot +63'02"**) | 05:35:44Z (boot +14m47s) | 01:26:35Z (boot +44s) |
| Dòng dpkg lúc đo | 848 (đang tăng; 1.247 lúc 08:49:10Z) | 2 (rồi im) | 1.545 (xong boot +4m22s) |
| md5 dpkg.log | 7b7c468b (đang đổi — replay chạy) | fabf6f20 (đứng yên) | 51d12c3d (đứng yên sau khi xong) |
| apt/dpkg proc | 1 apt-get update → install (pid 895 + con) | 0 | 0 (sau khi xong) |
| Cache APT | **178 .deb** (sống; mtime 16–18/11 — RV-backed) | 0 .deb | 178 .deb/156M |
| lists | 3 skeleton → **39** (sau update) | 5 | 37 |
| GST hệ thống | 0 → **107** (08:48Z) → **269** (08:49:10Z) | 0 | 269 (= debroot) |
| 11 gói postboot | 7 installed + 1 unpacked + 3 not-installed (08:48Z) → **11/11 installed (08:49:10Z)** | 0/11 (cần repair) | 11/11 sau replay |
| 5 lib | 5/5 CÓ (08:48Z) | 0/5 | 5/5 |

- **Rootfs làm mới ở #45:** dpkg.log chỉ 2 dòng lúc 08:35:40Z
  (không còn 795 dòng của #43), lists chỉ còn skeleton
  (auxfiles/lock/partial), GST không tồn tại lúc đầu — cùng
  chữ ký "rootfs rebuild" như #43 (dpkg.log #43 cũng chỉ 2
  dòng dù #41 có 1.545 dòng). Cache 178 .deb sống qua rebuild
  (RV-backed, đúng comment trong payload replay) — lần thứ 2
  cache sống trong chuỗi gần đây (#41: 178 sống, #43: 0,
  #45: 178 sống).
- **Replay (os-intent, pid 895) bắt đầu ~08:35:13Z, boot+~63':**
  `dpkg --configure -a` ghi 2 dòng 08:35:40Z, rồi `apt-get
  update` (pid 916) chạy ~08:35:41Z → ~08:47Z (~12', mirror
  chậm — cùng độ chậm với repair #43), rồi chuyển install
  (pid 25260 lúc 08:48Z, pid 27294 lúc 08:49:10Z). Đây là replay
  của nền tảng (preflight-opportunistic), KHÔNG phải watcher
  hay agent nào kích hoạt — không có bằng chứng cho rằng lượt
  cron 153 (mở 08:35:51Z) kích hoạt nó: replay bắt đầu
  ~08:35:13Z, TRƯỚC lượt cron 38 s. Chỉ ghi nhận trùng thời
  điểm, không kết luận nhân quả.
- **Hệ thống đủ 11 gói + 5 lib + GST 269 lúc ~08:49:10Z
  (boot+~76')** — nhưng **CHƯA CÓ postboot check-only nào
  xác nhận PASS** trên boot #45 (T5-153 cố tình không chạy:
  replay đang giữ lock apt + T0-153 đang survey). T0-153 /
  T8-153 phải tự xác nhận trước khi chạy O8.
- **POSTBOOT_PASS trên đĩa VẪN LÀ cờ cũ của #43**
  (18e179e0, ghi 05:58:52Z, poll=1 — nguyên văn ở §A.2).
  Không có cờ nào cho #44 (c741f5e6) hay #45 (401fca75).
  Cờ #43 là STALE đối với boot hiện tại: T4-153 KHÔNG được
  dùng nó làm gate cho O8-153 (poller grep full UUID sẽ
  không khớp 401fca75).

## 4. Đánh giá thiệt hại: watcher chết có gây vấn đề THẬT không?

### 4.1 Đợt 152 / boot #44 — KHÔNG thiệt hại nào đo được

| Hạng mục | Bằng chứng | Kết quả |
|---|---|---|
| O8 / WebKit | T8-152 xong 06:14–06:17Z, TRƯỚC #44 (07:04:11Z). `find` repo-1: **0 file `*clicktest*` hay `benchmarks/*` nào sửa trong 07:00–08:36Z** | Không có lượt O8 nào cần postboot trên #44 |
| Sampler T9 | Chết theo #44, **khởi động lại bằng tay 07:05:32Z** (pid 1827/1828, ghi trong `reboot44-restart-note.txt`); gap chỉ **71 s**; 38 mẫu trên #44 tới 07:42:34Z | Tự hồi phục, không cần watcher |
| Scheduler (T7) | Kiểm 07:31:54Z + 07:57:26Z trên #44 bình thường; requeue run 152 ghi được (điểm (m) thứ 5, DƯƠNG) | Không ảnh hưởng |
| T10 đóng sổ | Cờ mtime 08:14:28Z, "Boot lúc đóng c741f5e6" | Đóng bình thường |
| Postboot trên #44 | Không có cờ nào cho #44 — và **không có việc nào cần nó** (không O8, không repair) | Thiếu cờ nhưng vô hại |
| Replay trên #44 | **KHÔNG XÁC ĐỊNH ĐƯỢC** (dpkg.log #44 mất theo rootfs rebuild ở #45) | Ghi nhận là chưa biết, không tính là thiệt hại |

### 4.2 Đợt 153 / boot #45 — thiệt hại THẬT, đo được: chậm ~38 phút tới lúc đủ điều kiện

- Hệ thống chỉ đủ 11 gói lúc ~boot+76' (08:49:10Z), trong khi
  đường watcher ở #43 cho cờ lúc **boot+37'55"**. Chênh lệch
  **~38 phút** O8 chưa thể chạy (và vẫn cần thêm 1 lần
  postboot check-only xác nhận PASS — chưa chạy lúc T5-153
  đóng cờ này).
- Nguyên nhân gốc là **replay bắt đầu muộn boot+63'02"** —
  hành vi của nền tảng, ngoài tầm watcher. Nhưng watcher là
  cơ chế DUY NHẤT đã chứng minh (live ở #43) có thể rút ngắn
  đường này xuống boot+38' bằng repair sớm (h). Watcher chết
  = mất cơ chế giảm nhẹ đó, đúng vào lúc cần nhất (boot mới
  = boot replay vắng/muộn).
- T0-153 đang phải tự xử lý postboot ngay lúc mở phiên
  (boot survey + O8 JSON) mà không có cờ sẵn — việc này làm
  được bằng tay (như T8-151 đã dùng DEBROOT), nhưng là việc
  thêm, và quyết định "chờ replay hay repair" phải đưa ra
  trong lúc replay đang chạy (lock apt) — đúng tình huống
  (h) được thiết kế để tránh.

### 4.3 Những gì T5-153 KHÔNG làm — và vì sao

- **Không khởi động watcher-153:** nhiệm vụ này là "kiểm tra
  có giới hạn — không xây cơ chế ngay"; khởi động watcher là
  hành động vượt phạm vi, và có thể tranh chấp với T0-153
  (survey) + replay đang giữ lock apt. Nếu parent quyết (b),
  watcher/respawn do đợt sau triển khai theo phác thảo §7.
- **Không chạy postboot check-only / --repair:** cùng lý do
  (lock apt + T0 owns survey). Trạng thái gói/lib/GST ở §3
  đo bằng `dpkg-query`/`ls` chỉ đọc, không chạm lock.
- **Không đụng scheduler DB / run 152-153:** thuộc T7-153.

## 5. Mâu thuẫn đồng hồ MỚI — btime #45 chồng lấn 45m41s với hoạt động trên #44 (giao T2-153)

Đây là phát hiện lớn nhất ngoài nhiệm vụ watcher, và nó ảnh
hưởng trực tiếp câu hỏi "boot hiện tại là sau #44 hay #45".

**Số liệu (script §A.7 — trích từ log gốc, không gõ tay):**

| Mốc hoạt động cuối trên boot #44 (c741f5e6) | Thời gian ghi | Sau btime #45 (07:32:38Z) |
|---|---|---|
| Mẫu sampler cuối (ram-sampler.log dòng 124) | 07:42:34Z | +596 s (10') |
| T7 kiểm cuối (NOTES.md) | 07:57:47Z | +1.509 s (25') |
| Cờ T10-152 (mtime) | 08:14:28Z | +2.510 s (42') |
| Aggregate 152 (mtime) | 08:18:19Z | **+2.741 s (46')** |

- **Nghịch lý đồng hồ tối thiểu: 2.741 s (45m41s)** — gấp
  **~137 lần** kỷ lục cũ của chuỗi (~20 s ở #41; 15 s ở #42;
  ≥10 s ở #44). Sampler là tiến trình sống, đóng dấu boot_id
  mỗi mẫu 60 s: 13 mẫu liên tiếp 07:30:33–07:42:34Z đều ghi
  `boot=c741f5e6` — không thể là sampler "sống sót" qua reboot
  (reboot giết tiến trình; boot_id mới sẽ là 401fca75).
- **Phía bên kia cũng tự nhất quán:** btime #45 07:32:38Z =
  uptime neo (4.549 s lúc 08:48:28Z → boot 07:32:38Z, khớp
  từng giây); /proc/1 07:32:49Z; journal boot #45 237 entry,
  wall chạy trơn 07:32:49Z → 08:42:15Z, **quét toàn bộ không
  có bước nhảy nào >75 s hay lùi** (script §A, `done` không
  có dòng JUMP); `date -u` lúc này khớp đồng hồ scheduler
  (tin nhắn giao việc 15:37:08 +07, exec đầu 08:37:15Z);
  wtmp chỉ còn boot #45; `journalctl --list-boots` chỉ còn
  #45. Đồng hồ của cell hiện tại KHÔNG nhảy trong suốt boot
  này.
- **Kết luận T5-153:** hai dòng thời gian đều tự nhất quán
  nhưng chồng lấn nhau ~46 phút — ít nhất một bên lệch
  ~42–46 phút, và **không thể xác định bên nào lệch từ trong
  cell hiện tại** (journal/wtmp của #44 đã mất theo #45).
  Các giả thuyết (đều CHƯA chứng minh, chỉ ghi nhận):
  (i) cell đã bị thay thế giữa 08:18:19Z và 08:35:51Z, cell
  mới khởi động trong lúc cell cũ chưa dừng hẳn (hai cell
  chồng lấn, đồng hồ lệch nhau); (ii) đồng hồ cell cũ nhảy
  tiến ~42–46 phút vào khoảng sau 07:42:34Z (sampler không
  ghi được bước nhảy vì đã dừng lấy mẫu lúc 07:42:34Z —
  nhưng T7/T10 vẫn ghi boot c741f5e6 tới 08:14:28Z, nên bước
  nhảy nếu có phải xảy ra sau 08:14:28Z, tức là ngay trước
  khi cell cũ dừng — cửa sổ hẹp ~4 phút).
- **Hệ quả:**
  - Đánh số **#45 vẫn đứng** (theo thứ tự btime:
    07:32:38Z > 07:04:11Z) — btime là thứ tự duy nhất còn
    dùng được. Xác nhận giả thuyết trong brief ("có thể
    reboot #45 sau #44").
  - **Cửa sổ mù của #45 KHÔNG tin cậy được ở độ chính xác
    phút:** khoảng trống giữa hoạt động cuối #44 và boot #45
    không xác định được trong ±46 phút. **Giao T2-153**
    phán khi xử lý mù #76? (reboot #45) — không dùng btime
    07:32:38Z làm mốc tuyệt đối cho gap.
  - T7-153 lưu ý khi xử lý run 152/153: timestamp scheduler
    trong cửa sổ chồng lấn có thể lệch khung tham chiếu.
  - Đây là nghịch lý đồng hồ lớn nhất chuỗi từ trước tới nay
    — nếu parent thấy cần, giao một đợt sau điều tra riêng
    (đối chiếu log scheduler / runtime bên ngoài cell);
    T5-153 không đào sâu thêm (ngoài phạm vi kiểm tra có
    giới hạn).

## 6. Counterfactual: watcher sống sót thì #45 ra sao? (suy luận theo tương tự, ghi rõ là ước tính)

- Script watcher-152 **xử lý được dpkg.log chưa tồn tại**
  (dòng 87–88: `wc -l < /var/log/dpkg.log 2>/dev/null || echo -1`
  → lines=-1; dòng 62: mtime fallback về thời điểm khởi động;
  không `set -e` giết script) — nên watcher respawn sớm trên
  #45 sẽ KHÔNG crash khi dpkg.log còn trống.
- Điều kiện (h) trên #45 (nếu watcher chạy từ đầu boot):
  boot_age ≥900 s đạt lúc 07:47:38Z (wall, theo btime); 0 proc
  apt/dpkg (replay chưa chạy tới 08:35Z); dòng dpkg -1/0 <100;
  chưa repair boot này. Trigger (h) sẽ kích hoạt khoảng
  **boot+15'–25'**, verify form-B exit=1 (11 gói thiếu, GST 0
  — đúng như #43), --repair ~13' (update mirror chậm) →
  **cờ POSTBOOT_PASS khoảng boot+38'** (tương tự #43:
  trigger boot+25'06", cờ boot+37'55").
- **Ước tính tiết kiệm: ~38 phút** so với thực tế (đủ gói
  boot+76'). Đây là SUY LUẬN THEO TƯƠNG TỰ, không phải đo —
  nhưng tương tự rất sát (#43 cùng chữ ký: 2 dòng startup,
  cache 0, lists 5, GST 0; #45 còn "sạch" hơn: 0 dòng dpkg).
  Caveat: nếu watcher respawn MUỘN (sau khi replay đã chạy,
  như lúc lượt 153 mở 08:35:51Z) thì điều kiện 0-proc KHÔNG
  thỏa — watcher chỉ giám sát, không repair. Giá trị của
  respawn nằm ở việc nó chạy TỪ ĐẦU BOOT, không phải ở việc
  khởi động lại lúc mở phiên.

## 7. Kết luận (b) — CẦN cơ chế respawn tối thiểu sau reboot

**Quyết (b): watcher CẦN sống qua reboot — hiểu đúng là CẦN
ĐƯỢC KHỞI ĐỘNG LẠI TỰ ĐỘNG sau reboot** (tiến trình nền
không thể "sống sót" qua reboot theo nghĩa đen; reboot giết
mọi process — điều cần là có thứ gì đó sinh lại nó ở boot
mới). Bằng chứng tóm tắt:

- **Cho (b):** (1) #45 đo được: replay muộn boot+63', đủ gói
  boot+76', chậm ~38' so với đường watcher; (2) mẫu "replay
  vắng/muộn" nay là 3 đợt liên tiếp (#43 cần repair, #44
  không xác định được, #45 muộn 63'); (3) cửa sổ reboot →
  phiên mở (63+ phút ở #45) KHÔNG CÓ agent nào trong phiên
  — khởi động lại bằng tay (quyết (q)) không bao giờ bao phủ
  được cửa sổ này, mà đó chính là cửa sổ hệ thống cần giám
  sát nhất; (4) watcher là cơ chế giảm nhẹ DUY NHẤT đã kiểm
  chứng live (h ở #43).
- **Chống lại (b) — ghi rõ để parent cân:** (1) đợt 152
  hoàn thành mà không thiệt hại gì — hồi phục bằng tay đã
  đủ cho 152 (T9 71 s, T8 DEBROOT, T10 đóng bình thường);
  (2) tính khả thi của respawn trong cell này CHƯA CHỨNG
  MINH (chưa biết user systemd / @reboot cron có chạy không;
  rootfs rebuild có xóa cơ chế không — dpkg.log/lists/GST
  đều bị reset ở #45, nên cơ chế đặt trong /etc có thể mất
  theo); (3) rủi ro mới: watcher repair trong lúc platform
  replay đang chạy có thể tranh lock apt (điều kiện 0-proc
  của (h) giảm thiểu nhưng không triệt tiêu race).
- **Phác thảo cơ chế (KHÔNG code ngay — parent quyết rồi giao
  đợt sau):**
  - **Phương án 1 (đề xuất): user systemd unit**
    `vcut-replay-watch.service` — file unit + script watcher
    đặt trong `~/workspace/.../hidden_files/` (persistent),
    cài vào `~/.config/systemd/user/` + `loginctl
    enable-linger` + `systemctl --user enable`, `Restart=
    on-failure`, `ExecStart` chạy watcher với END = +3h sau
    boot. **Bước kiểm chứng trước khi tin:** ghi marker vào
    `~/.config/` rồi xem còn sau reboot không (kiểm tra
    persistence của home qua rebuild); kiểm tra `systemctl
    --user` có chạy trong cell không. Nếu một trong hai
    KHÔNG, phương án 1 chết — chuyển phương án 2/3.
  - **Phương án 2: @reboot cron trong cell** — `crontab -e`
    thêm `@reboot .../replay-watch-15x.sh` (cần crond chạy
    trong cell — chưa biết; kiểm tra trước). Yếu hơn phương
    án 1 (không Restart, không END rõ ràng).
  - **Phương án 3 (không cơ chế — dự phòng nếu parent không
    muốn đầu tư): quy tắc đứng mới "T0 mở phiên: kiểm tra
    watcher ngay khi mở, khởi động lại nếu chết"** — không
    cần code, chỉ cần ghi vào brief T0. **Caveat:** vẫn để
    hở cửa sổ reboot → phiên mở (như #45: 63 phút không ai
    xem) — parent chấp nhận rủi ro này nếu chọn phương án 3.
- **Đề xuất cho parent:** chọn phương án 1 (thử nghiệm có
  kiểm chứng persistence trước), nếu phương án 1 chết thì
  phương án 3 làm mặc định. Nếu parent chọn (a) (không cần
  watcher sống qua reboot) thì cũng cần phương án 3 để cửa
  sổ hở có người chịu trách nhiệm — nếu không, #46 lặp lại
  đúng kịch bản #45.

## 8. Nợ mở chuyển đợt 154 (từ T5-153)

1. **Mâu thuẫn đồng hồ ≥2.741 s (§5)** — giao T2-153 phán
   (mù #76? của #45; không dùng btime 07:32:38Z làm mốc
   tuyệt đối). Nếu parent thấy cần, giao đợt sau điều tra
   riêng bằng log ngoài cell.
2. **Watcher respawn (§7)** — chờ quyết parent (b): phương
   án 1/2/3. T5-153 không khởi động watcher, không code cơ
   chế.
3. **POSTBOOT_PASS cho #45 CHƯA CÓ** — T0-153/T8-153 phải tự
   chạy postboot check-only xác nhận PASS trước O8 (cờ #43
   trên đĩa là stale, không dùng làm gate). Replay vẫn chạy
   lúc 08:49:10Z (closing pass) — chờ nó xong hẳn rồi hãy
   check.
4. **F-152-T5-3 còn nợ:** timestamp poll1 trong cờ (giờ
   trigger thay vì giờ hoàn tất) — watcher đợt sau (nếu có)
   truyền timestamp hoàn tất poll1 vào `write_flag` (tham số
   $8 đã có sẵn, chỉ cần truyền đúng).
5. **Header comment postboot script còn ghi Dot 151** (ghi
   nhận từ T5-152 §5.4 — chưa ai quyết) — T5 đợt sau quyết
   có cập nhật theo Dot hay không.
6. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết
   G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết
   parent: để yên, không nhắc lại). R9 (a) VẪN CHỜ user (số
   đếm VẪN LÀ 16; quyết parent: để yên, không nhắc lại).
   ci-security.yml vẫn 403 chờ user. TTS 39 cấm kiểm lại.
   Mù #22/#28–#31/#35/#37/#38 G chờ user quyết. Mâu thuẫn
   full boot_id b47f7932 vẫn mở theo quyết (g) đợt 143.
   u2net là fallback chính thức cho birefnet. Run 152 thuộc
   T7-153 (kết cục + ghi NỘI DUNG vào cờ theo quyết (l)).

## 9. Sai số của chính T5-153

- **F-153-T5-1 — Lệnh `pgrep -af 'replay-watch'` đầu phiên
  tự khớp shell exec của chính T5 (pid 2152)** vì pattern
  xuất hiện trong cmdline của lệnh gọi (cùng lỗi họ với
  F-152-T5-1: grep toàn hidden_files tràn output). Đã nhận
  diện ngay là tự khớp (cmdline là lệnh exec, không phải
  script watcher) và kiểm tra lại bằng pattern neo
  `replay-watch-15[23]\.sh` → rỗng. Bài học giữ nguyên:
  luôn neo pattern để loại tự khớp; không bao giờ `grep -r`
  toàn bộ hidden_files.
- **F-153-T5-2 — Nghi ngờ sai về chênh lệch uptime/journal:**
  giữa phiên T5 thoáng thấy monotonic journal [4106 s] lớn
  hơn uptime đọc trước đó (~3.915 s) và suýt kết luận có
  lệch; kiểm tra lại bằng một lệnh neo duy nhất (`date` +
  `/proc/uptime` + journal tail cùng lúc) cho thấy khớp:
  uptime 4.201 s, journal monotonic 4.176 s (chênh 25 s =
  đúng khoảng cách giữa hai lần đọc). Không có lệch nào.
  Bài học: so sánh hai đồng hồ phải đọc cùng một lúc, không
  so số ở hai lệnh cách nhau nhiều phút.
- **F-153-T5-3 — Lệnh `find` repo-1 theo mtime chạy 18 s**
  (repo lớn) và bị đẩy nền; không ảnh hưởng kết quả (trả về
  0 file đúng). Không phải sai số, chỉ ghi nhận để đợt sau
  giới hạn `find` vào thư mục con khi cần.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS
  này đều từ script `t5-stats-153.py` (§A) hoặc đọc trực
  tiếp có ghi giờ (dpkg 1.247 dòng + 11/11 gói lúc 08:49:10Z
  đo lại tay sau script). Btime/boot_id đọc từ
  `/proc/sys/kernel/random/boot_id` + `/proc/stat` ở nhiều
  thời điểm và khớp nhau (401fca75, btime 07:32:38Z).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round153-t5/t5-stats-153.py`
(output đầy đủ lưu tại `t5-stats-153-output.txt` cùng dir).
Chạy lúc 2026-11-20T08:48:27Z. Nguyên văn output:

```
=== PHU LUC SO LIEU T5-153 (trich bang script, 2026-11-20T08:48:27Z) ===

--- 1. replay-watch-152.log ---
tong_dong=143
START=1 poll=136 NEWBOOT=0 END=0 EARLY-REPAIR=1 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-152-START 2026-11-20T05:44:02Z pid=17990 boot=18e179e0 btime=2026-11-20 05:20:57Z end=2026-11-20T08:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=fabf6f20 init_mtime=05:35:45Z cache=0 lists=5 gst_sys=0
dong_cuoi: 2026-11-20T07:04:36Z boot=18e179e0 poll dpkg_lines=795 md5=d964a240 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=110 lists=75
boot_xuat_hien=['18e179e0']
dong_chua_401fca75=0 dong_chua_c741f5e6=0
mtime_log=2026-11-20T07:04:36Z size=17354

--- 2. POSTBOOT_PASS (mtime 2026-11-20T05:58:52Z) ---
boot 18e179e0-365e-4298-92b8-b61b147f9600 (btime 2026-11-20 05:20:57Z; watcher-152) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-20T05:46:03Z; POSTBOOT_PASS moi ghi 2026-11-20T05:58:52Z poll=1 (repair-som-quyet-h); co cu 2e430750 luu POSTBOOT_PASS-2e430750
--- 2. POSTBOOT_PASS-2e430750 (mtime 2026-11-20T05:58:52Z) ---
boot 2e430750-6ba0-47b6-bf22-902953eff096 (btime /proc/stat 01:25:51Z 20/11; reboot #41) — REPLAY TOI TU NHIEN: dpkg 1545 dong (106 startup / 169 install / 9 upgrade / 178 configure / 1040 status / 43 trigproc; md5 51d12c3d), hoat dong dau 01:26:35Z boot+44s, cai xong 01:30:13Z boot+4m22s (goi cuoi gstreamer1.0-tools), 0 entry sau do; cache APT SONG 178 .deb/156M (mtime truoc boot — chuoi 0 .deb 2 lan DUT, khong keo dai sang lan 3); lists 37 (1 mirror azure); GST thu muc that (apt) 269 file = debroot 269; postboot PASS poll2 doc lap exit 0 luc 02:40:23Z (poll1: T4 manual 02:38Z, cung PASS); POSTBOOT_PASS moi ghi 2026-11-20T02:48:41Z poll=2 (replay-day-du, KHONG can repair); co cu e9295700 luu POSTBOOT_PASS-e9295700; DINH DANG: ghi full boot_id (sua F-151-T5-1 — poller T4 grep full UUID)

--- 3. ram-sampler.log (T9-152) ---
tong_mau=124
boot 18e179e0: n=86 dau=2026-11-20T05:39:17 cuoi=2026-11-20T07:04:21
boot c741f5e6: n=38 dau=2026-11-20T07:05:32 cuoi=2026-11-20T07:42:34
mau 07:30-07:43Z (boot stamp):
  2026-11-20T07:30:33Z boot=c741f5e6
  2026-11-20T07:31:33Z boot=c741f5e6
  2026-11-20T07:32:33Z boot=c741f5e6
  2026-11-20T07:33:33Z boot=c741f5e6
  2026-11-20T07:34:33Z boot=c741f5e6
  2026-11-20T07:35:33Z boot=c741f5e6
  2026-11-20T07:36:33Z boot=c741f5e6
  2026-11-20T07:37:33Z boot=c741f5e6
  2026-11-20T07:38:33Z boot=c741f5e6
  2026-11-20T07:39:33Z boot=c741f5e6
  2026-11-20T07:40:33Z boot=c741f5e6
  2026-11-20T07:41:33Z boot=c741f5e6
  2026-11-20T07:42:34Z boot=c741f5e6

--- 4. T7-152 NOTES + co round152 ---
  ## Kiểm lần 1 (~05:37–05:40Z 20/11) — boot MỚI 18e179e0 (btime 1795152057 = 05:20:57Z, reboot #43 TRƯỚC phiên)
  ## Kiểm lần 2 (~06:10:28Z 20/11) — boot vẫn 18e179e0, btime 1795152057 (KHÔNG reboot mới sau #43)
  ## Kiểm lần 3 (~06:40:49Z 20/11) — boot vẫn 18e179e0, btime 1795152057 (KHÔNG reboot mới sau #43)
  ## Kiểm lần 4 (~07:05:01Z 20/11) — ⚠️ REBOOT #44 GIỮA PHIÊN (boot mới c741f5e6, btime 1795158251 = 07:04:11Z)
  ## Kiểm lần 5 (~07:31:54Z 20/11) — boot vẫn c741f5e6, btime 1795158251 (KHÔNG reboot mới sau #44)
  ## Kiểm cuối (~07:57:26–07:57:47Z 20/11) — boot vẫn c741f5e6, btime 1795158251 (KHÔNG reboot mới sau #44)
round152-t7.done mtime=2026-11-20T08:02:00Z size=0
round152-t9.done mtime=2026-11-20T07:54:47Z size=796
round152-t10.done mtime=2026-11-20T08:14:28Z size=1750
aggregate152 mtime=2026-11-20T08:18:19Z size=41961
  aggregate: - Boot lúc đóng: `c741f5e6` (btime 07:04:11Z, #44); không reboot nào sau #44.

--- 5. Boot hien tai (do truc tiep) ---
boot_id=401fca75-bece-45b6-88fa-b12f602d6390
btime_epoch=1795159958 = 2026-11-20T07:32:38Z
uptime_s=4549 -> boot_theo_uptime=2026-11-20T07:32:38Z
now=2026-11-20T08:48:28Z
/proc/1 mtime=2026-11-20T07:32:49Z
journal_boots: IDX BOOT ID FIRST ENTRY LAST ENTRY | 0 401fca75bece45b688fab12f602d6390 Fri 2026-11-20 07:32:49 UTC Fri 2026-11-20 08:47:56 UTC
watcher_proc: KHONG CO
replay_pid895: 895 12:47 /bin/sh -c # Same RLIMIT_AS as the reconcile payload; this
aptget_update_con_cua_895: 25260 apt-get -o DPkg::Post-Invoke::=if [ -d /var/lib/hatch/os-intent ] && { [ -f
dpkg_lines=848 md5=7b7c468b mtime=2026-11-20T08:48:27Z
cache_deb=178 lists_entries=39 lists=auxfiles,cli.github.com_packages_dists_stable_InRelease,cli.github.com_packages_dists_stable_main_binary-amd64_Packages,lock,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_InRelease,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_main_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_main_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_multiverse_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_multiverse_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_universe_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_universe_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_InRelease,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_main_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_main_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_multiverse_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_multiverse_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_restricted_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_restricted_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_universe_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_universe_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_InRelease,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_main_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_main_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_multiverse_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_multiverse_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_restricted_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_restricted_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_universe_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_universe_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_InRelease,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_main_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_main_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_multiverse_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_multiverse_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_restricted_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_restricted_i18n_Translation-en,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_universe_binary-amd64_Packages,mirror.cogentco.com_pub_linux_ubuntu_dists_noble_universe_i18n_Translation-en,partial,
gst_sys_files=107
apt_procs=1 dpkg_procs=1

--- 6. Trang thai 11 goi + 5 lib (boot hien tai) ---
  libevent-2.1-7t64: installed
  gstreamer1.0-plugins-base: installed
  gstreamer1.0-plugins-good: unpacked
  gstreamer1.0-plugins-bad: not-installed
  gstreamer1.0-plugins-good: installed
  gstreamer1.0-plugins-ugly: not-installed
  gstreamer1.0-gl: installed
  gstreamer1.0-libav: installed
  gstreamer1.0-x: not-installed
  libavif16: installed
  libgstreamer1.0-0: installed
  libevdev2: installed
  libevent-2.1.so.7: CO
  libEGL.so.1: CO
  libavif.so.16: CO
  libdw.so.1: CO
  libevdev.so.2: CO

--- 7. Chong lan dong ho: btime #45 vs hoat dong cuoi tren #44 ---
  sampler mau cuoi c741f5e6 2026-11-20T07:42:34Z: sau btime #45 596 s (10 phut)
  T7 kiem cuoi c741f5e6 2026-11-20T07:57:47Z: sau btime #45 1509 s (25 phut)
  co T10-152 mtime 2026-11-20T08:14:28Z: sau btime #45 2510 s (42 phut)
  aggregate152 mtime 2026-11-20T08:18:19Z: sau btime #45 2741 s (46 phut)
  => nghich ly dong ho TOI THIEU: 2741 s (tu aggregate mtime)
  ky luc cu (chuoi #41/#42/#44): ~20 s  => gap ~137 lan

--- 8. Replay boot #45 ---
dpkg.log dong dau 08:35:40Z; boot+ = 3782 s (63.0 phut)
doi chieu #43 (watcher-152): dong dpkg dau boot+14m47s; trigger (h) boot+25m06s; co POSTBOOT_PASS boot+37m55s
doi chieu #41 (replay tu nhien): dong dau boot+44s; xong boot+4m22s
```

Bổ sung sau script (đo tay 08:49:10Z — replay vẫn chạy, closing pass):
`dpkg_lines=1247; 11/11 gói installed (bad/ugly/x/good đều installed); GST 269 file; apt-get pid 27294 vẫn chạy.`

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round153-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round153-t5/`
  (không nằm trong repo nên không stage): `t5-stats-153.py`,
  `t5-stats-153-output.txt`.
