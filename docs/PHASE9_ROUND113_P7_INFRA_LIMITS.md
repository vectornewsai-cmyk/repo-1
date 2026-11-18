# PHASE9_ROUND113_P7_INFRA_LIMITS — Hạ tầng: O8 Chromium watch.ignored + postboot #44 + vá poll mẫu

> Luồng P7, đợt 113, lượt cron 18:35 +07 14/11/2026 (bắt đầu ~11:39Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 112 §10 mục 10–12 + 14.
> Prereg: `hidden_files/round113-p7/prereg-p7.md` (viết TRƯỚC mọi sửa).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (preview.tsx
> md5 `03bf029f…` không đổi trong luồng này). KHÔNG sửa
> `vcut-vite-lock.sh` (md5 `fd21193c…` không đổi — chỉ dùng bản copy đóng
> băng để acquire, theo spec). CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **(b) Postboot boot #44 — PASS TOÀN BỘ ngay lần đầu (11:39:55Z,
   46'24" sau boot 10:53:31Z).** Wrapper K1, đủ 5 lib, GST hệ thống 269
   = 269 debroot, đủ isomp4 + libav, apt 10/10, kết luận ĐỦ ĐIỀU KIỆN.
   Tham chiếu trong script đã cập nhật #42 → #44 (xem §3).
2. **(c) Poll mẫu M5/L7 ĐÃ VÁ — lỗi tự đếm chính mình đã hết.**
   M5 cũ tự đếm +1 (dòng grep tự khớp, chứng minh bằng dòng khop);
   L7 cũ KHÔNG tự đếm (nhờ `grep -v grep` đi trước) — đính chính claim
   của N4 §0.1: chỉ M5 mang lỗi thật, L7 chỉ vá cứng hóa. Sau vá: cả 4
   pipeline (M5/L7/N4/P4) đều bắt được blocker thật (+1 khi thêm
   WebProcess giả) và 0 dòng grep tự khớp (xem §4).
3. **(a) O8 Chromium — PASS 21/21, exit 0, ENOSPC 0 lần** (boot #44,
   headroom 1507 — còn thấp hơn boot #43). Mirror `watch.ignored
   ["**/**"]` vào config vite tạm của script Chromium đã gỡ chặn ENOSPC
   của đợt 112: vite lên ngay attempt 1 (~2 s), 21 scenario chạy
   11:46:45–11:47:40Z, S7 mask Δx=0,112 / bóng Δx=0,113 (kỳ vọng
   0,112). Cả 2 engine O8 nay đều chạy được trên boot headroom thấp.
4. **Headroom boot #44: 1507** (probe K8, 11:39Z; trần 63747) — THẤP
   HƠN cả boot #43 (1511) và #42 (1534); vẫn < ~1586 watch của 1 vite
   thường. Vite thường KHÔNG chạy được trên boot này; vite tạm
   `watch.ignored` vẫn bắt buộc.
5. **Reboot #44** 10:53:31Z (btime 1794653611, boot_id
   `6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0`), sau #43 = 08:53:37Z; gap
   1h59'54" — KHÔNG phá sàn 19'07" (sàn chứng nhận duy nhất, đợt 106).
   Không reboot nào khác trong luồng này (boot_id không đổi từ đầu
   tới cuối).

## 2. O8 Chromium — mirror watch.ignored + chạy full 21/21 — PASS

### 2.1 Đổi duy nhất 1 chỗ (repo)

`apps/web/scripts/clicktest-87o8-mask-track-headed.mjs:647–651`: config
vite tạm `server: { hmr: false }` →
`server: { hmr: false, watch: { ignored: ["**/**"] } }`, y hệt
workaround L8 ở bản WebKit (dòng 268) + comment ghi nguồn (đợt 113 P7,
mirror L8; lý do: vite thường chết ENOSPC 8/8 trên boot headroom thấp
đợt 112 N8). `node --check` OK. Không đổi logic scenario, fixture,
port, bridge, Xvfb. md5 trước `60902575…` → sau `8911ad3d…`
(70.530 → 70.868 byte, +338 byte: config + comment).

### 2.2 Chạy O8 Chromium full 21/21 — PASS (boot #44, headroom 1507)

Driver: `hidden_files/round113-p7/p7-o8-driver.sh` (bản copy đóng băng
lock script md5 `fd21193c…`, poll 5 s, owner pid driver dài 14212,
timeout acquire 1800 s, port 5554). Scratch riêng
`round113-p7/o8-chromium`, DISPLAY :194, DEV 5554, DEBUG 9656, bridge
tự chọn 8851. Fixture copy trước theo mẫu M9/N8 (script log "đã có
trong SCRATCH, bỏ qua" cả 3 — nhánh N7 chạy thật).
Log: `p7-o8-chromium.log` + report JSON `o8-chromium/
o8-clicktest-report.json`.

| Mốc | Thời gian (Z) |
|---|---|
| Driver start | 11:40:54 |
| Acquire lock (chờ P3 ~351 s — xem §5) | 11:46:45 |
| Vite dev lên (attempt 1, ~2 s) | 11:46:47 |
| Scenario đầu S0 PASS | 11:47:06 |
| Kết quả cuối + exit 0 | 11:47:40 |
| Nhả lock | 11:47:40 |

**Kết quả: `== KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note ==`,
exit 0; report JSON đếm độc lập: 21 results, 21 ok, 0 fail.**
S7: mask Δx=0,112, bóng Δx=0,113 (kỳ vọng canvas 0,112) — khớp mẫu
N8/WebKit. E0: không lỗi JS/unhandledrejection.
**ENOSPC: 0 lần** trong cả 3 log (O8 log, `o8-vite-attempt1.log`,
`o8-chrome.log`) — vite chỉ thử 1 lần và lên ngay. Chặn ENOSPC của
đợt 112 (§10 mục 12) ĐÃ HẾT trên boot headroom thấp nhờ mirror
watch.ignored — đúng tiêu chí PASS (a) của prereg.
Sau nhả lock: curl 5554 = 000, không còn vite node nào (3 dòng `ps |
grep vite` lúc đó là process acquire/check của P5/P1 và lệnh kiểm
của chính P7 — đều chứa chữ "vite" trong cmdline, không phải vite
server; xem §5).

### 2.3 Đối chiếu với WebKit đợt 112

WebKit O8 đợt 112 (N8, boot #43): 21/21 PASS. Chromium O8 đợt 113
(P7, boot #44, headroom còn thấp hơn: 1507 < 1511): 21/21 PASS. Hai
engine nay đều chạy được trên boot headroom thấp nhờ cùng workaround
`watch.ignored` — không còn engine nào bị chặn bởi ENOSPC ở O8.

## 3. Postboot boot #44 + cập nhật tham chiếu

### 3.1 Đổi trong postboot-check (repo, chỉ chữ tham chiếu)

`apps/web/scripts/vcut-webkit-postboot-check.sh`:
- Dòng `say` tham chiếu boot: `#42 = 08:05:10Z, sau #41 = 06:53:26Z`
  → `#44 = 10:53:31Z, sau #43 = 08:53:37Z`.
- Header: thêm số đo replay boot #44 (đủ lúc kiểm tra 46' sau boot,
  lần kiểm đầu đã đủ — khoảng chính xác chưa kẹp được).
- `bash -n` OK. Không đổi logic kiểm tra/sửa chữa.

### 3.2 postboot-check lần 1 (11:39:55Z, 46'24" sau boot) — PASS toàn bộ

Log: `hidden_files/round113-p7/p7-postboot-check1.log` (exit 0).

| Mục | Kết quả |
|---|---|
| Wrapper MiniBrowser | PASS — đã vá K1 (giữ LD_LIBRARY_PATH) |
| Lib hệ thống (5 lib) | PASS — đủ libevent/libEGL/libavif/libdw/libevdev |
| Plugin GST | PASS — thư mục thật (apt), 269 file hệ thống = 269 debroot, đủ isomp4 + libav |
| apt (10 package) | PASS — đủ 10/10 |
| Kết luận | ĐỦ ĐIỀU KIỆN chạy WebKit |

Không cần --repair (không mục nào FAIL). **Caveat:** lần kiểm đầu tiên
đã đủ nên khoảng replay chính xác KHÔNG kẹp được — chỉ biết replay xong
trước 46' sau boot (boot #39 ~17', #40 đủ lúc 22', #42 đủ lúc 36').
Nợ M8 §9.4 vẫn mở: đợt sau sau reboot nên chạy postboot-check sớm
(5–10 phút sau boot) để kẹp khoảng chính xác hơn.

## 4. Vá poll mẫu chung (M5/L7) — lỗi tự đếm chính mình

### 4.1 Lỗi gốc (N4 §0.1) + đính chính cho N4

N4 viết "mẫu poll của M5/L7 mang cùng lỗi (+1 blocker giả thường
trực)". Kiểm chứng trực tiếp bằng chạy khô cho thấy **chỉ M5 mang lỗi
thật; L7 không tự đếm**:

- **M5** (`round111-m5/poll-m5-quiet.sh:12`): pipeline
  `ps -eo args | grep -E "[v]ite|...|WebProcess" | grep -v "poll-m5"`
  — process `grep -E` tự khớp vì pattern chứa chuỗi trần `WebProcess`
  (các lựa chọn khác đã có bracket trick, riêng `WebProcess` thì không).
  Dòng khớp trong log: `grep -E [v]ite|[p]robe104f3|[M]iniBrowser|
  [w]ebkit|WebProcess` — chính process grep của poll. M5-cũ = M5-mới
  + 1 trong cả 2 điều kiện (2 vs 1 lúc yên-tương-đối; 3 vs 2 khi thêm
  blocker giả).
- **L7** (`round110-l7/poll-l7.sh:19`): pipeline có `grep -v grep` ĐI
  TRƯỚC `grep -E`, nên process grep đã bị loại trước khi tới bước khớp
  pattern — L7-cũ = L7-mới = 12 (lúc yên-tương-đối) và 13 (khi thêm
  blocker giả), các dòng khớp giống hệt nhau. N4 không chạy khô L7 mà
  suy từ M5; kết luận "L7 cùng lỗi" là SAI — L7 chỉ mang pattern trần
  nhưng không tự đếm nhờ thứ tự pipeline.
- **N4** (`round112-n4/poll-n4.sh:12`): đã vá bằng `grep -v "grep -E"`,
  không tự đếm (N4 §0.1 đúng); nhưng pattern vẫn chứa `WebProcess`
  trần — ai copy phần grep -E mà bỏ `grep -v "grep -E"` sẽ tái lỗi
  (đúng cách M5 đã copy L7 mà bỏ `grep -v grep`).

### 4.2 Sửa (đợt 113 P7) — bracket trick, không đổi logic gate

- `poll-m5-quiet.sh`: `WebProcess` → `[W]ebProcess` + comment ghi lý
  do (N4 §0.1). Không đổi gate/load/lock.
- `poll-l7.sh`: bọc bracket cho TẤT CẢ lựa chọn trần
  (`vite`→`[v]ite`, `MiniBrowser`→`[M]iniBrowser`,
  `WebProcess`→`[W]ebProcess`, `probe.*\.mjs`→`[p]robe.*\.mjs`,
  `playwright`→`[p]laywright`, `chromium`→`[c]hromium`,
  `while True`→`[w]hile True`, `node .*webkit`→`node .*[w]ebkit`,
  `node .*ghost`→`node .*[g]host`) + comment. Pattern nay tự bảo vệ,
  không còn phụ thuộc `grep -v grep` đứng trước (giữ lại `grep -v grep`
  sẵn có). Không đổi gate/load/lock.
- `poll-n4.sh`: `WebProcess` → `[W]ebProcess` (cứng hóa thêm; giữ
  `grep -v "grep -E"` sẵn có). Không đổi hành vi.
- `poll-p4.sh` (đợt 113, luồng P4 ĐANG CHẠY): KHÔNG sửa — file của
  luồng đang chạy (bash đọc script dần, sửa giữa chừng có thể làm hỏng
  process đang chạy, cùng họ nguy cơ như lock script); P4 đã copy bản
  N4 có `grep -v "grep -E"` nên không tự đếm (đã kiểm chứng §4.3).

### 4.3 Kiểm chứng (chạy khô, KHÔNG chạy poll thật 15–90 phút)

Script test: `hidden_files/round113-p7/p7-poll-selfcount-test.sh`
(trước vá — so sánh cũ/mới) + `p7-poll-verify-fixed.sh` (sau vá —
chạy đúng dòng BLOCKERS trích từ file đã sửa).
Log: `p7-poll-selfcount-old.log`, `p7-poll-verify-fixed.log`.
Lưu ý: máy KHÔNG yên lúc kiểm (P3 đang chạy probe Chromium + hog
`while True`, P5 đang chờ lock, acquire của chính P7 đang chạy) nên số
đếm tuyệt đối gồm nhiều blocker thật; bằng chứng tự đếm là HIỆU
cũ − mới và dòng khớp (không phải số tuyệt đối).

| Pipeline | Trước vá, yên-tương-đối | Trước vá, +1 WebProcess giả | Sau vá, hiện tại | Sau vá, +1 WebProcess giả |
|---|---|---|---|---|
| M5 | 2 (1 thật + 1 tự đếm) | 3 | 3 | 4 |
| L7 | 12 (toàn thật) | 13 | 19 | 20 |
| N4 | — (đã vá từ đợt 112) | — | 3 | 4 |
| P4 (không sửa) | — | — | 3 | 4 |

- **Tự đếm sau vá: 0.** Đếm số dòng khớp chứa `grep -E` = 0 trong cả
  2 điều kiện (trước vá M5-cũ có đúng 1 dòng như vậy).
- **Blocker thật vẫn bắt được:** +1 ở CẢ 4 pipeline khi thêm tiến
  trình giả `WebProcess-p7test` (spawn bằng `exec -a`, kill ngay sau
  test) — vá không làm mù.
- **Quét lại sau vá:** `grep -rn --include='*poll*.sh' 'WebProcess'`
  trên hidden_files chỉ còn: (a) `poll-p4.sh` (luồng đang chạy, có
  `grep -v "grep -E"` bảo vệ, không sửa — xem §4.2); (b) 2 script test
  của chính P7 (`p7-poll-selfcount-test.sh`,
  `p7-poll-verify-fixed.sh`) chứa pipeline CŨ verbatim để so sánh
  A/B — không phải poll script dùng thật. Không còn file mẫu nào mang
  pattern trần có thể tự đếm.
- `bash -n` OK cả 3 file đã sửa.

## 5. Vite mồ côi + headroom boot #44 + hàng đợi lock

- **Headroom inotify boot #44: 1507** (probe K8
  `p7-headroom-b44.log`, 11:39Z; trần 63747) — thấp hơn boot #43
  (1511) và #42 (1534). Vite thường (~1586 watch) KHÔNG chạy được;
  chỉ dùng vite tạm `watch.ignored` (0 watch).
- **RAM khả dụng:** 929 MB lúc 11:39Z — birefnet vẫn dưới ngưỡng 6 GB,
  không thử (đứng theo LIMITS gộp).
- **Hàng đợi lock lúc P7 acquire:** P3 giữ lock từ 11:40:09Z (vite
  5590 SERVING, probe Chromium 24 clip); P5 cũng đang chờ acquire
  (timeout 900 s, từ ~11:41Z); P7 chờ bằng bản copy đóng băng, timeout
  1800 s, poll 5 s, owner pid driver dài 14212 — **giữ lock 11:46:45Z
  sau ~351 s chờ, nhả sạch 11:47:40Z** (log `p7-o8-lock.log`: "ĐÃ GIỮ
  … ĐÃ NHẢ"). P3 nhả được là nhờ parent nhả tay `release p3`
  11:46:44Z (run-p3.sh sót `release n3` nên driver P3 không tự nhả —
  xem log đợt 113 P3); P7 thắng race mkdir ngay sau đó (P5 chờ lâu hơn
  nhưng thua — lock không có FIFO/cơ chế ưu tiên, nợ M8 §3.4 vẫn mở).
  Sau khi P7 nhả, P1 giữ lock ngay 11:47:40Z (port 5580); P5 vẫn đang
  chờ acquire lúc 11:48Z, timeout ~11:56Z nếu P1 không nhả trước —
  không thuộc phạm vi P7, chỉ ghi nhận.
- **Không vite mồ côi sau lượt P7:** curl 5554 = 000 sau khi nhả;
  `ps` không còn vite node nào (3 dòng khớp `grep vite` lúc kiểm là
  process acquire của P5, shell kiểm tra của P1 và lệnh kiểm của P7 —
  đều chứa chữ "vite" trong cmdline, không phải vite server).
- **Lock script KHÔNG sửa đợt này** (md5 `fd21193c…` trước/sau —
  khớp bản N8 đóng băng). Stale-recovery KHÔNG kiểm lại: không chạm
  script nên kết quả PASS 3 ca của N7 đợt 112 trên đúng bản này vẫn
  đứng; task chỉ yêu cầu kiểm lại "nếu chạm lock script".

## 6. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi P7. md5 trước/sau: `03bf029f…`
  (bản N1 đợt 112).
- `node --check` script Chromium đã sửa: OK. `bash -n` postboot-check
  + 3 poll script: OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 2 script harness + 2 file chữ + 3 poll mẫu
  trong hidden_files).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM chưa đổi).
- O8 WebKit full: KHÔNG chạy lại trong luồng này (đã PASS 21/21 đợt
  112 N8; task P7 chỉ giao Chromium).

## 7. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND113_P7_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` (sửa: mirror
  `watch.ignored ["**/**"]` vào config vite tạm, §2; 70.530+ B —
  >37.768 byte, cần `ENABLE_PRIVSEP=0` khi push).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa nhỏ: tham chiếu
  boot #42 → #44 + ghi chú replay, §3).
- Poll mẫu trong hidden_files (KHÔNG stage — tiền lệ K7/K8/L8/M8/N7):
  `round111-m5/poll-m5-quiet.sh`, `round110-l7/poll-l7.sh`,
  `round112-n4/poll-n4.sh` (vá bracket trick, §4).
- Harness trong hidden_files (KHÔNG stage): `round113-p7/` (prereg,
  log postboot, log headroom, driver + log O8, script + log test poll
  ×2, scratch `o8-chromium/` với 3 fixture).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round113-p7-infra.txt` (NUL-delimited; chỉ 3 file repo trên).
- Cờ done: `hidden_files/round113-p7-done` (tạo sau khi LIMITS + batch
  xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Vite lock dùng chung (acquire/release/status/kill-vite) — xem spec đóng băng:
bash ~/workspace/repo-1/apps/web/scripts/vcut-vite-lock.sh status
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Chạy lại O8 Chromium (giữ lock bằng bản copy đóng băng trước):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round113-p7/p7-o8-driver.sh
```

## 8. Nợ mở sang đợt sau

1. **O8 Chromium sau fix watch.ignored — ĐÃ XONG, PASS 21/21** (P7
   đợt này, §2). Không còn nợ O8 Chromium bị chặn ENOSPC; nếu boot sau
   headroom hồi trên ~1700 thì vẫn giữ vite tạm ignored cho O8 (đã
   chứng minh không mất gì: HMR tắt từ trước).
2. **Replay apt sau reboot chưa kẹp được khoảng chính xác** (boot #44 đủ
   lúc 46' sau boot, lần kiểm đầu đã đủ) — đợt sau sau reboot chạy
   postboot-check sớm (5–10 phút sau boot) rồi chạy lại tới khi PASS
   (nợ M8 §9.4, vẫn mở).
3. **Headroom boot #44 chỉ 1507 < ~1586 của vite thường** — vite thường
   có nguy cơ ENOSPC; chỉ dùng vite tạm `watch.ignored` trong đợt 113;
   đo lại headroom sau reboot tiếp theo trước khi chạy vite thường.
4. **Poll-p4.sh đợt 113 vẫn mang pattern trần `WebProcess`** (được
   `grep -v "grep -E"` bảo vệ nên không tự đếm) — luồng P4 sau này
   copy mẫu nên lấy bản M5/L7 đã vá thay vì bản N4; không cần sửa file
   của P4 (luồng đã chạy xong thì file đó thành lịch sử).
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 112 §10: G1 + mù #22
   + mù #28 + mù #29 + mù #30 chờ user quyết; E4 cần đợt xác nhận tải
   cao; ring 8 MiB đo lag push/take trực tiếp; zombie tích mẫu chuyển
   clip tới n≥5; điểm gãy tải cần tích đủ tick; ngưỡng WebKit ≤60 ms
   cần 1 lượt yên thật; birefnet 0 lần; TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi; KHÔNG push
   khi user chưa nhắn "push đi".
