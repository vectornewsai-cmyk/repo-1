# PHASE9_ROUND111_M6_ENOSPC_LIMITS — Phần C: trade-off stale-module của watch.ignored

> Luồng M6, đợt 111, lượt cron 12:35 +07 14/11/2026 (làm việc 05:38–05:51Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ LIMITS gộp đợt 110 §10 mục 9 (phần C chưa đo — script L8 đã sửa, đợt này chạy lại).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (`preview.tsx` md5
> `9b27abe5…` trước/sau mọi lượt đo — không đổi). KHÔNG đụng TTS/birefnet.
> Chỉ thêm 1 file docs này (+ script đo + log trong hidden_files, không stage).
> WebKit: KHÔNG probe trong luồng này (đo vite bằng curl) nên không chạy
> postboot-check; M8 cùng đợt đã chạy postboot-check + launch WebKit trên
> boot #40 riêng (xem `round111-m8/`, không phải kết quả của M6).

## 1. Kết luận ngắn

1. **Phần C ĐÃ ĐO XONG bằng số thật (10 lượt scratch hợp lệ): vite với
   `server.watch.ignored ["**/**"]` PHỤC VỤ MODULE CŨ (stale) sau khi file
   đổi — 4/4 lượt edit module đã load (app.js 3/3, dep.js 1/1) vẫn trả nội
   dung cũ sau 32 s, trong khi vite thường nhận nội dung mới ngay lượt
   poll đầu (≤2 s, 4/4).** Restart vite ignored là phục vụ nội dung mới
   ngay (10/10 lượt kiểm sau restart) — stale nằm ở cache transform /
   module graph trong bộ nhớ, không phải do file trên đĩa.
2. **Stale CHỈ ảnh hưởng module đã từng được transform.** File mới tạo sau
   khi vite chạy (`new.js`, 1/1 mỗi bên) và `index.html` sửa sau khi chạy
   (1/1 mỗi bên) đều được phục vụ mới NGAY CẢ ở vite ignored (0 s) —
   giống hệt vite thường. Cơ chế khớp: vite transform lại file chưa có
   trong module graph; chỉ module đã cache mới cần watcher để invalidate.
3. **Khuyến nghị: DÙNG `watch.ignored ["**/**"]` cho mọi vite tạm của
   luồng đo, với 3 điều kiện** (xem §5): (a) không sửa file mà probe đang
   đọc trong lúc chạy — hoặc restart vite sau mỗi lần sửa; (b) config tạm
   giữ `hmr: false` (như O8/L7 đã làm); (c) KHÔNG dùng cho dev tương tác.
   Trade-off đã đo là có thật nhưng hẹp và tránh được bằng restart.
4. **Headroom ENOSPC trên boot #40: 1655 trước vite / 1647 sau vite
   (trần 63747, ngoài cell ~62,1k watch) — GIẢM MẠNH so với K8 (2538).**
   1 vite thường (1586 watch) chỉ còn dư ~69 watch. **Vite thứ hai
   (thường) chết chắc; ngay cả 1 vite thường cũng đã sát trần** — nếu
   watch ngoài cell tăng thêm ~70 thì 1 vite cũng ENOSPC. Vite nối tiếp
   vẫn BẮT BUỘC; vite ignored (0 watch) là cách duy nhất để 1 vite
   thường + vite tạm cùng sống.
5. **A/B trên cây hiện tại (lặp lại L8, 2 lượt mỗi bên): vite config gốc
   1586 watch, vite ignored 0 watch, trang `/` 200 cả hai.** Khớp L8
   (1585/0; +1 watch do repo lớn lên).

## 2. Bối cảnh đo

- Boot #40: `uptime -s` = **2026-11-14 05:16:36Z** (boot id `73316ed9…`
  theo giao việc). Gap #39 (02:50:48Z) → #40 = **2h25'48"** — KHÔNG phá
  sàn gap 19'07" (L9 §0.1: khoảng đã chứng nhận [19'07", 3h14'08"]).
  Reboot #40 xảy ra trước khi M6 bắt đầu (~05:16Z), không cắt ngang lượt
  đo nào của M6.
- Trần `fs.inotify.max_user_watches` = **63747** trên boot #40 (K8 đo
  63756 trên boot #36 — trần thay đổi theo boot, đã biết từ K8 §3.1).
- `preview.tsx` md5 `9b27abe57975ec5b69ec2e21c3fa281c` (= L1-fix) lúc bắt
  đầu và lúc kết thúc — M6 không sửa production.
- RAM khả dụng lúc bắt đầu: 2115 MB. Không probe TTS/birefnet.
- Phối hợp vite đợt 111: M6 giữ `vite.lock` 05:41:20–05:51:20Z (owner
  `m6-round111`, cổng 5599), nhả xong kiểm `ps` + `curl` cổng 000, không
  còn vite nào. M8 cùng đợt đang chờ lock này để chạy vite-test của họ
  (`vcut-vite-lock.sh acquire m8 5599 1500 ...` thấy trong `ps` lúc
  05:46Z) — lock đã nhả lúc 05:51:20Z cho M8.

## 3. Phương pháp (sửa 2 lỗi của L8 — đọc trước khi trích số)

Script: `hidden_files/round111-m6/m6-measure.sh`, log
`m6-measure.log`, log vite từng lượt `m6-vite-*.log` /
`m6-scratch-*.log`. Thiết kế phần C theo L8 nhưng sửa 2 lỗi làm lần
đó VÔ HIỆU:

1. **Chạy vite bằng `node <vite/bin/vite.js>` trực tiếp, không qua npx.**
   `$!` chính là pid node giữ watch; kill theo pid đó (TERM, chờ cổng về
   000 tối đa 10 s, rồi KILL). L8 kill vỏ npx nên node con mồ côi và curl
   phần C trúng vite B còn sống.
2. **Ready-check + kiểm cổng bằng marker thật.** Trước mỗi lượt bật vite,
   assert cổng 5599 trả 000; ready-check của scratch yêu cầu `/app.js`
   chứa đúng marker `APP-V1` (L8 chỉ grep `console.log` chung chung nên
   trúng index.html của vite mồ côi).

Thiết kế phần C (scratch root `/tmp/m6-vite-root`, làm mới mỗi lượt):
`index.html` (title `TITLE-V1`) + `app.js` (`import "./dep.js"`,
`console.log("APP-V1")`) + `dep.js` (`console.log("DEP-V1")`). Config
thường `{ server: { hmr: true } }`; config ignored
`{ server: { hmr: false, watch: { ignored: ["**/**"] } } }`. Sau khi
vite phục vụ `APP-V1`, sửa file mục tiêu thành V2 rồi poll curl mỗi 2 s
tới tối đa 32 s, ghi thời điểm đầu tiên thấy V2 (hoặc `STALE@32s`).
Sau đó kill vite, restart cùng config (không sửa file nữa) và kiểm lại
— để phân biệt "file trên đĩa sai" với "cache trong bộ nhớ stale".
Các lượt phụ: sửa `dep.js` (module được import), tạo file mới `new.js`
sau khi vite chạy, sửa `index.html` sau khi vite chạy.

**2 lỗi script của chính M6 trong lúc chạy (đã sửa, ghi rõ để khỏi
trích nhầm lượt):**

- Lần chạy đầu (05:41:20Z): `local mode=$1 rep=$2 logf=...$mode...`
  trong cùng một lệnh `local` — bash expand `$mode` trước khi gán nên
  `set -u` báo `mode: unbound variable`, script chết ngay, chưa bật vite
  nào. Đã tách thành 2 dòng `local` và chạy lại.
- Lần chạy 05:43:14Z (VÔ HIỆU, toàn bộ lượt ABORTED trong ~3 s):
  `port_code` trả `"000000"` khi cổng trống (curl `-w` đã in `000` rồi
  `|| echo 000` in thêm `000`), nên `assert_port_free` tưởng cổng bận ở
  mọi lượt. Đã sửa `port_code` (bỏ `|| echo 000`) và chạy lại lần 3.
  **Chỉ lần chạy 05:44:53–05:50:04Z là hợp lệ; mọi số trong LIMITS này
  đều từ lần đó.** Log lần vô hiệu vẫn nằm trong `m6-measure.log`
  (header `20261114T054314Z`) — đừng trích số từ đoạn đó.

## 4. Kết quả đo

### 4.1 A/B watch trên apps/web (cây hiện tại, cổng 5599)

| | A: config gốc repo | B: config tạm `watch.ignored ["**/**"]` |
|---|---|---|
| Lượt 1 — tổng watch / vite | 1600 / **1586** | 14 / **0** |
| Lượt 2 — tổng watch / vite | 1600 / **1586** | 14 / **0** |
| Trang `/` | 200, 1291 byte (lượt 1) | 200, 1093 byte (cả 2 lượt) |
| Vite log | `ready in 1298 ms` (lượt 1) / `249 ms` (lượt 2) | `ready in` cả 2 lượt |
| Sau kill | tổng về 14, vite 0, cổng 000 | tổng về 14, vite 0, cổng 000 |

- Baseline trước mỗi lượt: tổng 14 watch, vite 0. Khớp L8 (1585/0);
  vite thường nay 1586 (+1 watch — repo lớn lên từ đợt 110).
- **Dị thường duy nhất (ghi rõ, không giấu): lượt A2 trang `/` trả 0 byte
  / HTTP 000 ở 2 lần curl đo, dù vite log `ready in 249 ms` và watch
  đếm đúng 1586 như lượt 1.** Không có lỗi trong vite log lượt A2, và
  dọn dẹp sau đó bình thường (tổng về 14, cổng 000). Nguyên nhân chưa
  xác định — có thể là glitch loopback nhất thời lúc máy tải cao (M8
  đang chạy WebKit launch song song). Đây là 1 lần fetch lỗi trong 4
  lần đo A/B, không đổi kết luận về số watch (2/2 lượt khớp nhau), nhưng
  ghi lại để đợt sau khỏi coi 200 là đảm bảo tuyệt đối ở mọi lượt.

### 4.2 Phần C — stale-module (10 lượt scratch hợp lệ)

| Lượt | Chế độ | Sửa gì | Lần đầu thấy nội dung mới | Sau restart |
|---|---|---|---|---|
| app1 | thường | `app.js` V1→V2 | **0 s** (poll đầu, ≤2 s) | V2 |
| app1 | ignored | `app.js` V1→V2 | **STALE@32s** (vẫn V1) | V2 |
| app2 | thường | `app.js` V1→V2 | **0 s** | V2 |
| app2 | ignored | `app.js` V1→V2 | **STALE@32s** | V2 |
| app3 | thường | `app.js` V1→V2 | **0 s** | V2 |
| app3 | ignored | `app.js` V1→V2 | **STALE@32s** | V2 |
| dep1 | thường | `dep.js` V1→V2 | **0 s** (+ `app.js` re-transform với `?t=` mới) | V2 |
| dep1 | ignored | `dep.js` V1→V2 | **STALE@32s** (`app.js` vẫn import `/dep.js` cũ, không `?t=`) | V2 |
| new1 | thường | tạo mới `new.js` sau khi chạy | **0 s** | V1 (file mới) |
| new1 | ignored | tạo mới `new.js` sau khi chạy | **0 s** | V1 (file mới) |
| new1 | thường + ignored | sửa `index.html` TITLE-V1→V2 sau khi chạy | **0 s** cả hai | — |

- Gộp app-edit: thường **3/3 nhận V2 trong ≤2 s**; ignored **3/3 vẫn V1
  sau 32 s**. Dep-edit: thường 1/1 V2 ≤2 s; ignored 1/1 STALE@32s.
- Watch của vite scratch: thường **6**, ignored **0** (mọi lượt).
- Sau restart: **10/10 lượt** phục vụ nội dung mới — file trên đĩa luôn
  đúng; stale là cache transform/module graph trong bộ nhớ của tiến
  trình vite đang chạy. Vite ignored không có watcher nên không có sự
  kiện nào để invalidate cache đó.
- File mới + `index.html`: vite ignored phục vụ mới ngay (0 s) — chỉ
  module ĐÃ TỪNG được transform mới stale. (Lưu ý: HTTP status trước
  khi tạo `new.js` là 200 ở cả hai chế độ vì vite fallback trả index.html
  cho path lạ — chỉ marker `NEW-V1` mới là bằng chứng; đã đo bằng marker.)

### 4.3 Headroom ENOSPC (probe K8, `k8-headroom.py`)

| Thời điểm | Trần | Headroom đo được (2 lần) | Cell thấy | Ngoài cell (suy ra) |
|---|---|---|---|---|
| Trước vite (05:40Z) | 63747 | **1655 / 1655** | 14 wd | ~62.078 |
| Sau vite (05:51Z) | 63747 | **1647 / 1647** | 16 wd | ~62.084 |

- Headroom giảm từ 2538 (K8, boot #36) → 1655/1647 (boot #40). 2 lần đo
  trong mỗi cặp giống hệt nhau — ổn định theo phút, không phải nhiễu.
- Số học: 1655 − 1586 (1 vite thường) = **~69 watch dư**. Vite thường
  thứ hai cần 1586 → thiếu ~1517 → **chết chắc**. Nhưng đáng báo động
  hơn: **ngay cả 1 vite thường cũng chỉ còn dư ~69** — watch ngoài cell
  chỉ cần tăng ~70 nữa là vite đầu tiên cũng ENOSPC khi khởi động.
- 2 watch dư trong cell lúc đo sau (tổng 16 thay vì 14) thuộc về
  `WebKitWebProcess` pid 17082 của M8 (đang chạy launch WebKit song
  song), không phải của M6 — vite của M6 để lại 0 watch sau kill (kiểm
  bằng `ps` + đếm theo tiến trình).
- Trần 63747 (boot #40) so với 63756 (boot #36): lại đổi theo boot, khớp
  hiện tượng K8 §3.1 (chưa chứng minh cơ chế).

### 4.4 Dọn dẹp + kiểm tra kill vite

- Mọi lượt: sau kill, tổng watch về 14 (hoặc 16 do WebKit của M8),
  `vite_wd` = 0, cổng 5599 về 000, không còn tiến trình `node.*vite`
  nào trong `ps`. Không có vite mồ côi nào của M6.
- **Bài học kill (bổ sung L8 §3.4):** lượt A2 báo `WARN kill_node: pid
  10428 still alive after KILL` nhưng tổng watch đã về 14 và cổng đã
  000 — pid đó là **zombie** chưa được shell cha reap, `kill -0` vẫn
  trả thành công với zombie. Kiểm chết của vite phải dựa vào **cổng về
  000 + watch về baseline**, không dựa vào `kill -0`.

## 5. Kết luận + khuyến nghị (điều kiện dùng watch.ignored)

**Khuyến nghị: DÙNG `server.watch.ignored ["**/**"]` cho mọi vite tạm
của luồng đo** (O8, K7-quiet, ghost driver, probe…), vì:

- Tiết kiệm toàn bộ 1586 watch/vite → 1 vite thường + bao nhiêu vite
  tạm ignored cũng vừa headroom 1655 (mỗi vite ignored = 0 watch).
  Đây là cách duy nhất để 2 vite cùng sống khi headroom chỉ ~1655.
- Trade-off stale-module đã đo là **có thật nhưng hẹp**: chỉ stale với
  module đã load; file mới và `index.html` không stale; restart vite là
  hết stale ngay (10/10).

**Điều kiện (bắt buộc ghi vào hướng dẫn dùng):**

1. **Không sửa file mà probe đang đọc trong lúc vite ignored chạy.**
   Probe nào cần sửa file giữa chừng (vd sửa `preview.tsx` rồi đo lại)
   thì hoặc dùng vite thường, hoặc **restart vite ignored sau mỗi lần
   sửa** rồi mới đo.
2. **Config tạm giữ `hmr: false`.** Với ignored + hmr bật, HMR client sẽ
   không bao giờ nhận update (không có sự kiện file) — đo này không kiểm
   HMR client qua browser (chỉ curl), nên không dùng ignored+hmr:true
   cho probe nào trông chờ HMR.
3. **KHÔNG dùng cho dev tương tác** (sửa code chờ reload) — đó đúng là
   trường hợp stale gây hại.
4. **Vite nối tiếp vẫn bắt buộc với vite THƯỜNG** — ignored chỉ giải
   phóng slot cho vite tạm, không thay luật 1-vite-thường tại một thời
   điểm. Luồng nào bật vite thường vẫn phải giữ `vite.lock` và kiểm
   headroom bằng probe trước khi bật (headroom nay chỉ ~1655, sát trần).
5. **Cảnh báo mới: headroom 1655, dư ~69 so với 1 vite.** Nếu một lượt
   nào đó thấy vite thường chết ENOSPC ngay từ đầu (không phải vite thứ
   hai), nguyên nhân có thể là headroom đã tụt dưới 1586 — đo lại
   headroom bằng probe trước khi kết luận lỗi khác.

## 6. Giới hạn của chính M6 (đọc trước khi trích số)

1. **Phát hiện stale bằng curl, không qua browser/HMR client.** Với
   `hmr: false` trong config ignored thì không có HMR client để kiểm
   anyway; nhưng chưa đo hành vi của trang đang mở trong browser thật
   khi file đổi (vd WebSocket HMR có báo gì không). Kết luận chỉ đúng
   cho "nội dung vite phục vụ qua HTTP".
2. **Cửa sổ stale chỉ tới 32 s.** Ignored vẫn stale ở 32 s; cơ chế
   (không watcher → không invalidate) và kiểm restart (10/10) cho thấy
   stale kéo dài tới khi restart, nhưng M6 KHÔNG đo stale ở 5–10 phút.
   Nói "stale cho tới khi restart" là suy luận từ cơ chế + restart test,
   không phải quan sát trực tiếp dài hạn.
3. **Poll mỗi 2 s nên "0 s" nghĩa là ≤2 s.** Vite thường có thể nhận V2
   trong <2 s; M6 không đo độ trễ chính xác dưới 2 s. Đủ để kết luận
   "ngay lập tức so với stale", không đủ để so độ trễ HMR.
4. **Dep-edit và new-file/index chỉ n=1 mỗi chế độ.** App-edit n=3 mỗi
   chế độ là phần có lặp lại; các lượt phụ là bằng chứng định hướng,
   chưa đủ n để tính tỉ lệ.
5. **Scratch root tối giản** (2 module + index.html). Vite thật của
   apps/web có module graph lớn hơn nhiều; M6 không đo stale trên cây
   thật (chỉ đo watch A/B trên cây thật). Cơ chế invalidate là chung,
   nhưng chưa kiểm stale của 1 module cụ thể trong `apps/web`.
6. **Headroom là ảnh chụp thời điểm** (K8 §4.1 đã nói): 1655/1647 đo lúc
   05:40Z/05:51Z boot #40; watch ngoài cell dao động theo giờ/boot.
7. **Dị thường A2 (§4.1)** — 1 lần fetch `/` lỗi (0B/000) dù vite ready
   và watch đúng; nguyên nhân chưa xác định, không ảnh hưởng kết luận
   watch.
8. **M6 không chạy `tsc`/`vite build`/suite** — không sửa production,
   không có gì để hồi quy; verify build do luồng verify đợt 111 chạy.

## 7. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND111_M6_ENOSPC_LIMITS.md` (file này — mới).
- Harness/log trong hidden_files (KHÔNG stage — tiền lệ K7/K8/L8):
  `round111-m6/` (`m6-measure.sh`, `m6-measure.log`,
  `m6-vite-*.log` ×4, `m6-scratch-*.log` ×20, `m6-headroom-before*.log`,
  `m6-headroom-after*.log`, `m6-progress.md`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round111-m6-enospc.txt`
  (NUL-delimited, 1 entry: file này).
- Cờ done: `hidden_files/round111-m6-done` (tạo sau khi LIMITS + batch xong).

```bash
# Đo lại headroom inotify (rẻ, ~2 s; tự dọn sạch):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Chạy lại toàn bộ đo A/B + phần C (cần giữ vite.lock trước, cổng 5599 trống):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round111-m6/m6-measure.sh
```

## 8. Nợ mở sang đợt sau (cập nhật từ LIMITS gộp đợt 110 §10)

1. **Phần C ĐÃ ĐÓNG (M6 đợt này):** stale-module của watch.ignored đã
   đo xong — khuyến nghị + điều kiện ở §5. Không còn nợ đo phần C.
2. **ENOSPC — headroom nay chỉ ~1655 (dư ~69 so với 1 vite).** Vite nối
   tiếp bắt buộc; vite ignored cho vite tạm (đã có khuyến nghị). Theo
   dõi headroom mỗi đợt: nếu tụt dưới ~1586 thì ngay cả 1 vite thường
   cũng không lên được — lúc đó chỉ còn vite ignored hoặc chờ host.
3. **52→51 file clicktest-*.mjs còn ghi đè vite log** (L9 đính chính L8:
   51, không phải 52) — sửa hàng loạt theo mẫu O8.
4. **`run-k7-quiet.sh` còn thiếu `vite.config.k7-temp.ts`** — tạo lại theo
   mẫu O8 (react plugin + `watch.ignored`, HMR tắt).
5. **Lock vite:** M8 cùng đợt 111 đang chuẩn hóa bằng script
   `apps/web/scripts/vcut-vite-lock.sh` (thấy trong `ps` lúc M6 chạy) —
   đợt sau dùng script đó thay cho `mkdir` tay; lưu ý M6 giữ lock kiểu
   cũ 05:41–05:51Z trong lúc M8 test.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 110 §10: G1 + mù #22
   chờ user quyết; E4 cuộc đua tail-ceiling/restart-seek; 2 MiB offset
   (preload-before-seek, ring 8 MiB); zombie gate (b) dạng mạnh + stall
   5 s (L3 đợt 110 không chạy được); EPERM probe #30 + mù #29 (mù #28
   KHÔNG đóng hoàn toàn, khe 4'32"); F6' đã đóng, nợ đo mức pixel;
   birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml 403.
