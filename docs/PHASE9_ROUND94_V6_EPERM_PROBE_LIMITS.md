# PHASE9 ROUND94 V6 — EPERM: probe #13 + khoảng mù #12 + quét writeFileSync (nợ LIMITS gộp đợt 93 §4 mục 6)

> Luồng V6, đợt 94 vòng lặp Phase 9 VCut Studio (lượt cron 09:35 +07,
> 12/11/2026; làm việc ~02:38–02:45Z 12/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #12
> (23:40:34Z 11/11) + quét lại writeFileSync với danh sách loại trừ
> chuẩn mới (S7/T8) + ghi RAM hiện tại (birefnet: KHÔNG chạy — không
> nằm trong nhiệm vụ V6, và không có tín hiệu RAM thay đổi). KHÔNG
> push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow, KHÔNG đụng
> TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start loop nền**
> (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 02:38:54Z
  báo **DEAD/STALE** (heartbeat age 10.700 s, last #12 23:40:34Z,
  boot 88ebef2e, exit 1); `once` ngay sau đó là **probe #13,
  boot 9968199e (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=13), exit 0.
- **Khoảng mù #12 (mới): 23:40:34Z → 02:39:01Z (~178 phút)** — dài
  thứ ba trong lịch sử probe (sau khoảng mù #8, ~187'; khoảng mù
  #11, ~182'). Trong đó có **1 lần reboot ĐÃ XÁC NHẬN: #13 lúc
  02:34:42Z** (88ebef2e → 9968199e). Parent ĐÃ để ý reboot này ở
  lúc spawn (~02:35Z, build-loop-log ghi "VM vừa reboot (uptime 1'
  lúc spawn)") nhưng **không ghi boot-id hay giờ chính xác**
  (grep `9968199e`/`02:34` trong build-loop-log = 0 hit) — probe
  #13 mới chốt được giờ + boot-id. Đây là lần đầu tiên một reboot
  được parent để ý ngay lúc spawn nhưng vẫn cần probe để chốt số.
- **Không tìm thấy bằng chứng sóng EPERM trong các bản ghi còn lại
  của khoảng mù** (U1/U2/U3/U5: 0 lần nhắc EPERM; U4: 1 lần nhưng
  chỉ là tên file `server/eperm-retry.cjs` trong mô tả phương pháp;
  U6: "0 dấu EPERM trong 8 log đo"; U7: "Không gặp sóng EPERM").
  Nhưng **~58 phút cuối khoảng mù (01:37Z → 02:34:42Z) hoàn toàn
  không có bản ghi nào** — không thể kết luận "không có sóng", chỉ
  kết luận "không có bằng chứng trong các bản ghi còn tồn tại". Sóng
  gần nhất vẫn là **~11:55–12:11Z** (R7) — ~14h28' trước probe #13.
  EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 222 dòng / 80 file** (phạm vi
  2.509 file) — source thật **102** (+6 vs U8), mẫu trong docs
  **120** (+10 vs U8). Đối chiếu phương pháp R7 cũ (chạy lại đúng,
  R7b): **247 dòng / 11.902 file**; đối chiếu chéo 222 + 25 bản
  copy = **247, khớp tuyệt đối với R7b** — lần đầu tiên không còn
  chênh lệch (U8 chênh +5 do file mới xuất hiện giữa hai lần find).
  **Không còn đường ghi production nào chưa nối helper.** Async
  `fs.writeFile(` production ngoài helper: **0**.
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).
- **RAM: 2 mẫu MemAvailable 992 / 1221 MB** (parent ghi ~1,8 GB lúc
  spawn 02:35Z; max ~1,8 GB = 29% ngưỡng guard 6144 MB) — birefnet
  KHÔNG chạy, không có tín hiệu RAM thay đổi so với đợt 93.

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| `bash scripts/probe-eperm-v2.sh status` | 02:38:54Z | **DEAD/STALE**, exit 1 — heartbeat n=12, ts 23:40:34Z, boot 88ebef2e, age **10.700 s**; last sample probe #12; last start duy nhất 08:49:50Z; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 02:39:01Z | **probe #13, boot=9968199e, ok=2 fail=0**, exit 0; có dòng `boot changed 88ebef2e -> 9968199e` |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 02:39:01Z | **ALIVE**, age 0 s, n=13, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 31 dòng, trước lượt 28 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=13, ts
02:39:01Z, pid=2220, boot 9968199e-2e69-4835-b5fd-584f1cd2e66e).

## 2. Điều tra khoảng mù kể từ probe #12

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 02:38–02:42Z)

- Boot hiện tại: `uptime -s` = **2026-11-12 02:34:42Z** (lần đọc đầu
  02:38:54Z, uptime 4'; đọc lại sau vẫn 02:34:42 — khớp), boot_id
  `9968199e-2e69-4835-b5fd-584f1cd2e66e` — khác boot của probe #12
  (88ebef2e).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z,
  pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa từng được
  start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 9968199e…,
  first entry 02:34:52Z, last 02:38:55Z). `last -x reboot`: chỉ 1
  dòng (02:34, still running). wtmp bắt đầu 02:34:52Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 02:39:01Z ghi vào log chỉ ghi
  **88ebef2e → 9968199e** — nó gộp mọi reboot trung gian thành một
  bước nhảy (heartbeat chỉ nhớ boot của mẫu cuối).

### 2.2 Reboot #13 trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 13 | 02:34:42Z | 88ebef2e → 9968199e | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 02:34:52Z); `last -x reboot` (02:34, still running); wtmp bắt đầu 02:34:52Z. Parent ĐÃ để ý ở lúc spawn (~02:35Z, build-loop-log: "VM vừa reboot (uptime 1' lúc spawn, RAM khả dụng ~1,8 GB)") nhưng **không ghi boot-id/giờ chính xác** — grep `9968199e`/`02:34` trong build-loop-log = 0 hit; probe #13 mới chốt số. |

Chu kỳ reboot nay là **13 lần trong ~30h16'** (từ ~20:18Z 10/11 tới
02:34:42Z 12/11) — trung bình ~2h20'/lần. Mọi probe nền đều chết
theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
phục bằng 1 mẫu mới.

Lưu ý nhỏ (không sửa log sibling): log U1 đợt 93 ghi "VM reboot
~23:33 +07 11/11" — thực ra là 23:33**Z** (U8 đã chốt 23:33:21Z);
U2/U3 ghi "~23:36Z" theo số ước lượng trong brief giao việc. Đây
là sai số múi giờ/số ước lượng trong log của luồng khác, V6 không
sửa file của luồng khác, chỉ ghi nhận ở đây để lượt sau khỏi nhầm.

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 93

Khoảng mù 23:40:34Z → 02:39:01Z (~178') được phủ bởi các luồng
sibling đợt 93 (làm việc tới ~00:52Z) + closing của parent (tới
~01:36:50Z) và hoàn toàn mù từ 01:37Z → 02:34:42Z (~58').
Đã đọc lại log thật của các luồng (grep `eperm|EPERM|reboot` trên
`round93-u*.md` + mtime của `hidden_files/` và `docs/`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| U1, U2, U3, U5 (`round93-u1..u3,u5.md`) | ~23:40–00:52Z | **0 lần nhắc EPERM** (grep -c = 0 mỗi file) |
| U4 (`round93-u4.md`, 1 lần nhắc) | 23:40–00:15Z | Chỉ là tên file `server/eperm-retry.cjs` trong mô tả phương pháp baseline — không phải sóng |
| U6 (`round93-u6.md`, 1 lần nhắc) | 23:42–23:59Z | "0 dấu EPERM trong 8 log đo" (G1 evidence v5, 8 lần đo) — **không gặp sóng** |
| U7 (`round93-u7.md`, 1 lần nhắc) | 23:39–00:12Z | "Không gặp sóng EPERM" (O8 21/21 cả 2 engine) — **không gặp sóng** |
| Parent closing (LIMITS gộp đợt 93 + build-loop-log) | 00:52–01:36:50Z | Gộp 7 luồng, kiểm chứng tsc 0 / vite build PASS 6,29 s, r6 PASS sau sửa, U4 141/141 — **không ghi nhận EPERM hay reboot nào** (reboot #12 lúc 23:33:21Z đã được U8 ghi trước đó) |
| 01:37Z → 02:34:42Z | — | **Không có bản ghi nào**: `build-loop-log.md` dừng ở closing đợt 93 (~01:36:50Z, theo mtime LIMITS gộp); không file nào trong `hidden_files/` hay `docs/` sửa đổi trong cửa sổ này (find `-newermt` = 0 hit); memory log 12/11 chưa có mục nào về cửa sổ này hay reboot #13 |

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **58 phút cuối (01:37Z → 02:34:42Z) là mù hoàn toàn**,
  đủ dài để chứa một sóng ~16 phút mà không để lại dấu vết nào
  trong hồ sơ — và đã chứng minh chứa được một reboot (#13,
  02:34:42Z) mà không ai ghi boot-id/giờ chính xác.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~14h28' trước probe
  #13. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- Reboot #13 là reboot thứ ba liên tiếp **không được ghi boot-id
  lúc nó xảy ra** (sau #10 và #12; #11 là ngoại lệ: T9 phát hiện
  trong lượt vì đang chạy lúc đó; #13 được parent để ý ở spawn
  nhưng không chốt số). Chỉ probe #13 mới chốt được giờ + boot-id.
- Reboot trung gian khác trong 01:37Z → 02:34:42Z không loại trừ
  được (journal/wtmp chỉ giữ boot hiện tại; dòng `boot changed`
  gộp mọi reboot trung gian). Trong 23:40:34Z → 01:36:50Z, hoạt động
  liên tục của U1–U7 + closing làm một reboot không-ai-thấy khó xảy
  ra (một reboot sẽ giết phiên đang chạy, như #11 đã giết script
  chờ của T9) — nhưng không chứng minh tuyệt đối được.

### 2.4 Bảng 12 lần chết / khoảng mù (cập nhật từ bảng 11 lần của U8 §2.4)

| # | Probe | Mẫu cuối | Khoảng chết/mù | Nguyên nhân (mức chắc chắn) |
|---|---|---|---|---|
| 1 | K8 (đợt 83) | #5 18:21Z 10/11 | 18:21–18:31Z | **Chưa rõ** — chết trước reboot kế (~20:18Z) ~2h; giả thuyết mạnh nhất: runtime dọn phiên (GC); không loại trừ reboot trung gian |
| 2 | L6 (đợt 84) | #10 22:18:49Z 10/11 | 22:18–22:28Z | **Chưa rõ** — chết trước reboot kế (~23:28Z) ~60'; cùng giả thuyết GC |
| 3 | M5 (đợt 85) | #11 01:21:56Z 11/11 | 01:22–01:32Z | **Chưa rõ** — chết trước reboot kế (~02:03Z) ~30–40'; cùng giả thuyết GC |
| 4 | N8 (đợt 86) | #5 03:19:38Z | 03:19–03:29Z | **Chưa rõ** — không đủ dữ kiện uptime lúc đó |
| 5 | O10 (đợt 87) | #9 07:13:35Z | 07:13–07:23Z | **Chưa rõ** — chết trước reboot 08:24:39Z ~60'; khoảng mù 07:13–08:49Z không quan sát |
| 6 | v2 loop 13674 (đợt 88) | #5 09:19:52Z | chết ~09:21:17Z | **CHẮC CHẮN: reboot 09:21:17Z** — lần đầu tiên một cái chết có nguyên nhân ghi nhận (boot d473b560 → e10b9199) |
| 7 | — (đợt 89 Q8) | #6 09:41:01Z | mù 09:41:01–11:37:37Z (~116') | **Không có observer** (không loop nào được start sau #6) + **reboot 11:34:38Z** ở cuối khoảng mù (boot e10b9199 → 7439870b); không loại trừ reboot trung gian khác |
| 8 | — (đợt 89, sau Q8) | #7 11:37:37Z | mù 11:37:37–14:44:26Z (~187') | **Không có observer + SÓNG EPERM ~11:55–12:11Z (2 nhân chứng Q1/Q7) + reboot 13:21:06Z** (boot 7439870b → 62b088d2). **Lần đầu tiên một khoảng mù được chứng minh là có chứa sóng** |
| 9 | — (đợt 90 R7 → đợt 91 S7) | #9 14:51:17Z | mù 14:51:17–17:39:23Z (~168') | **Không có observer + 2 REBOOT ĐÃ XÁC NHẬN** (~15:29Z → 0799d357; 17:24:01Z → 182a689e). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (R4/R5/R6/R8/R1/R3 tới ~15:57Z); nhưng **~87' cuối (15:57Z → 17:24Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 10 | — (đợt 91 S7 → đợt 92 T8) | #10 17:39:23Z | mù 17:39:23–20:38:56Z (~180') | **Không có observer + 1 REBOOT ĐÃ XÁC NHẬN 19:22:48Z** (→ 14e10da9, **không ai ghi nhận lúc xảy ra** — chỉ probe #11 phát hiện). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (S1–S9 tới ~19:20Z + closing tới 19:37:20Z); nhưng **~62' cuối (19:37:20Z → 20:38:56Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 11 | — (đợt 92 T8 → đợt 93 U8) | #11 20:38:56Z | mù 20:38:56–23:40:34Z (~182') | **Không có observer + 2 REBOOT ĐÃ XÁC NHẬN** (~21:35:58Z → 09e8d2af, T9 ghi trong lượt; **23:33:21Z → 88ebef2e, không ai ghi nhận lúc xảy ra — chỉ probe #12 phát hiện**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (T1–T9 tới ~22:34Z + closing tới 22:40:42Z; T6 chỉ có EPERM do fault-injection tự viết); nhưng **~60' cuối (22:40:42Z → 23:40:34Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 12 | — (đợt 93 U8 → đợt 94 V6) | #12 23:40:34Z | mù 23:40:34–02:39:01Z (~178') | **Không có observer + 1 REBOOT ĐÃ XÁC NHẬN 02:34:42Z** (→ 9968199e; parent để ý ở spawn ~02:35Z nhưng **không ghi boot-id/giờ chính xác — chỉ probe #13 chốt số**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (U1–U7 tới ~00:52Z + closing tới ~01:36:50Z; U4/U6/U7 đều ghi không gặp sóng); nhưng **~58' cuối (01:37Z → 02:34:42Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |

## 3. Quét writeFileSync — áp dụng danh sách loại trừ chuẩn mới

### 3.1 Phương pháp (chuẩn mới, áp dụng từ đợt 91 theo quyết định parent đợt 90 mục 7)

`find` liệt kê file `*.js/*.ts/*.mjs/*.cjs/*.sh/*.py/*.md`, loại:
`node_modules`, `.venv*`, `dist`, `chrome-userdata`,
`.eperm-probe*`, `assets`, `bundled-server` ở gốc — như R7 — **cộng
thêm loại trừ chuẩn mới: mọi thư mục tên `release*` hoặc `build` ở
MỌI cấp** (`release*/**` + `build/**`). Đếm theo **dòng**
(`xargs -0 grep -c writeFileSync` trên danh sách NUL-delimited),
chỉ tính file có count > 0 — như S7/T8 (đã sửa lỗi lần quét đầu của
S7/T8).

Để đối chiếu, V6 chạy cả hai phạm vi: chuẩn mới và phương pháp R7 cũ
(chỉ loại `release*`/`bundled-server`/`assets` ở **gốc**, giữ nguyên
base prune như chuẩn mới).

**Sửa lỗi script của U8:** script `scan-wfs.sh` của U8 để trong
`hidden_files/round93-u8/` vẫn còn lỗi R7-method (quên base prune
node_modules/.venv* → 70.802 file / 441 dòng ở lần chạy đầu của
U8; U8 đã chạy lại tay R7b đúng nhưng không sửa script). V6 viết
script mới `hidden_files/round94-v6/scan-wfs.sh` với R7b đã sửa
ngay trong script (base prune + chỉ loại release*/bundled-server/
assets ở gốc) — lượt sau dùng script này, đừng dùng lại script U8
cho phần R7.

### 3.2 Kết quả (snapshot 02:41:17–02:41:47Z)

| Nhóm | Chuẩn mới | R7 cũ đúng (R7b, đối chiếu) | U8 (~23:43Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.509** | 11.902 | 2.494 / 11.890 |
| Source code thật | **102** | 102 | 96 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **120** | 120 | 110 |
| **Tổng writeFileSync (dòng)** | **222** | **247** | **206** |

Đối chiếu chéo: chuẩn mới 222 + bản copy 25 (3 build + 22 release)
= **247**; R7b = **247** — **khớp tuyệt đối, chênh 0** (lần đầu
tiên kể từ khi có đối chiếu chéo; U8 chênh +5 do 2 file probe mới
xuất hiện giữa hai lần find). Hit list chuẩn mới có **0 đường dẫn
chứa `release*/` hay `build/`** (verify bằng grep — 0 hit).

**Chi tiết source thật 102 dòng** (U8: 96, **+6**):

| Thư mục | Dòng | So với U8 |
|---|---|---|
| apps/web/scripts | 60 | 54 → 60 (+6) |
| apps/web/src | 5 | = |
| apps/desktop/src | 25 | = |
| server | 11 | = |
| mcp-server/src | 1 | = |

**Docs 120 dòng** (U8: 110, **+10**): +8 từ chính file LIMITS của
U8 (`PHASE9_ROUND93_U8_EPERM_PROBE_LIMITS.md`, viết sau khi U8
quét), +1 từ LIMITS gộp đợt 93 (`PHASE9_ROUND93_LIMITS.md`,
closing 01:36:50Z), +1 từ `PHASE9_GAP_ANALYSIS.md` (6 → 7 lần
nhắc, §22 mới ở closing) — toàn là tài liệu trích dẫn
`writeFileSync` trong văn bản, không chạy.

**Giải thích +6 source vs U8 (đối chiếu trực tiếp từng file,
không suy luận từ mtime):** 3 file mới xuất hiện trong hit list
chuẩn mới so với `wfs-newstd.txt` của U8, 0 file biến mất, 0 file
đổi số dòng ngoài GAP_ANALYSIS.md:

- `apps/web/scripts/probe93u1-rvfc-pump.cdp.mjs` — **1 dòng**
  (luồng U1 đợt 93, harness đo rVFC pump).
- `apps/web/scripts/probe93u3-rvfc-webkit.mjs` — **4 dòng**
  (luồng U3 đợt 93, harness đo rVFC WebKit — file này cũng là 1
  trong 2 file gây chênh +5 của U8, nay đã có mặt trong cả hai
  lần quét nên đối chiếu khớp).
- `apps/web/scripts/probe93u7-q5-timing-flake.mjs` — **1 dòng**
  (luồng U7 đợt 93, harness timing Q5 — file còn lại gây chênh +5
  của U8).

1 + 4 + 1 = 6, khớp đúng chênh lệch. Cả ba đều là harness đo một
lần mới của đợt 93, không phải đường ghi production.

### 3.3 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`:
**4 hit** — giống hệt U8:

- `apps/desktop/src/services/epermRetry.js:116`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  desktop.
- `apps/web/scripts/eperm-retry.mjs:71`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  web.
- 2 hit asset JS vendored của Gradio trong `server/tts/.venv2/…`
  (`worker-BzdDEeh7.js`, `Video-C27INCFQ.js`) — API `writeFile` của
  ffmpeg.wasm FS trong bộ nhớ (virtual FS), không phải ghi đĩa Node
  — R7/S7/T8/T9/U8 đã ghi, không tính là đường ghi production.

**Async `fs.writeFile(` production ngoài helper: 0.**

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry. Số "code" theo chuẩn mới là 102 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Luôn lọc count > 0 trước khi cộng** (bài học S7/T8 §4.1).
2. **R7-cũ phải giữ nguyên base prune** (node_modules/.venv*/dist/
   chrome-userdata/.eperm-probe*) — chỉ khác chuẩn mới ở chỗ
   release*/build chỉ loại ở gốc thay vì mọi cấp. Script U8 vẫn
   còn lỗi này trong phần R7-method — **dùng script V6
   (`hidden_files/round94-v6/scan-wfs.sh`) cho lượt sau**, đừng
   dùng lại script U8.
3. **Trích bản copy phải loại node_modules**: `mime/src/build.js`
   nằm dưới `node_modules` trong cả `release*/` lẫn `build/` —
   regex `(^|/)build/` bắt nhầm 4 dòng; bản copy đúng phạm vi là 25
   dòng / 17 file (3 build + 22 release), khớp T8/S7/U8.
4. **Quét trong lượt nhiều luồng song song là snapshot động:**
   file mới có thể xuất hiện giữa hai lần find (U8: 2 file probe
   U3/U7, +5 dòng). Lượt này may mắn khớp tuyệt đối (chênh 0) vì
   không file mới nào chứa `writeFileSync` xuất hiện giữa hai lần
   find (02:41:17Z → 02:41:47Z). Ghi rõ cửa sổ snapshot và đối
   chiếu chéo số chênh, đừng ép hai lần quét phải khớp tuyệt đối
   khi cây đang đổi.
5. Scratch quét để trong
   `hidden_files/round94-v6/` (sống qua reboot), không để /tmp —
   scratch của S7/T8/T9 trong /tmp đều đã mất sau reboot.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #13 OK 2/2) — và 58 phút cuối khoảng mù #12 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~14h28' trước
   probe #13.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2): lệnh cron
   chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). V6 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #12 dài ~178' chứa **reboot #13**, và là **khoảng mù
   thứ 5 liên tiếp (#8–#12) chứa reboot**; khoảng mù #8 đã chứng
   minh có thể chứa cả một sóng đầy đủ.
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3; 3 dòng lạ 11:59–12:00Z
   vẫn còn trong log, không thêm dòng lạ mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h20'/lần** (13 lần/~30h16'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 2 mẫu 992 /
   1221 MB (parent ghi ~1,8 GB lúc spawn; max ~1,8 GB = 29% ngưỡng
   guard 6144 MB), không có tín hiệu RAM thay đổi so với đợt 93
   (max ~1,9 GB). Đúng quyết định parent đợt 92 §3 mục 7: chỉ thử
   lại khi có tín hiệu RAM thay đổi. Birefnet-general vẫn 0 lần
   chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND94_V6_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round94-v6-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v6.md`
(log luồng); scratch quét trong `hidden_files/round94-v6/` (`scan-wfs.sh`,
`scan-meta.txt`, `files-newstd.bin`, `wfs-newstd.txt`, `files-r7b.bin`,
`wfs-r7b.txt`, `files-copies.txt`, `wfs-copies.txt`); log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
