# PHASE9_ROUND145_T4_WEBKIT_QUIET20_LIMITS.md

**Đợt:** 145. **Luồng:** T4 — lượt yên WebKit #20 (làm lại: luồng T4 trước bị
lỗi model ngay đầu phiên, chưa đo; T4 này tái dùng script đã chuẩn bị, vá
thêm B4 + perpass — xem §1). **Ngày:** 19/11/2026. **Boot đo:** e146ca67
(btime 07:56:16Z, boot duy nhất cả phiên — không reboot). **Cây:**
`apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở poller, lúc attempt, lúc
đóng — không đổi). **Trạng thái: LƯỢT YÊN #20 HỢP LỆ ngay attempt1.**

## 0. Verdict tổng

- **Attempt1-e146ca67 (08:53:03–08:56:39Z): 20/20 exit 0, tickCost median
  58,0 ms (n=508; post-flip 58,0; p90 88,3; max 239; min 31) ≤ 60 ms,
  lớp B DAT 5/5 (với B4 đã vá — pgrep -x=0, dpkg delta=0, ps
  exact-comm=0). Poller thoát exit 0 lúc 08:57:13Z. Ngân sách dùng 1/3,
  không retry, không reboot, không lỗi setup.**
- **Cộng dồn 17 lượt hợp lệ:** P1 **51/51**, P2 **42/42**, P3-A1 **46/51**,
  P3' **23/23**, P7 **37/37**. Chuỗi median 17 lượt: 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 /
  47,0 / 49,0 / 55,0 / **58,0 ms** (trung bình 48,8 ms). Không lượt hợp lệ
  nào vượt ngưỡng 60 ms.
- **Bằng chứng (c2) của riêng lượt này YẾU (n=2):** P1 YẾU 2/2 (p=0,0529),
  P3-A1 YẾU 2/2 (p=0,0789) — cả hai seq đều khớp nhưng n<3 và p>0,01 nên
  không đủ mạnh độc lập (luật DEF §3/§5). P3' DAT 2/2, P7 DUNG (0/372 tre
  ≥+1f), P2 2/2 lag +1. Cả hai occurrence đều khớp nên vẫn cộng dồn theo
  quy ước các đợt trước (chỉ đếm occurrence trong lượt hợp lệ).
- **Không có gì chờ quyết parent đợt này.** Điều tra (c2) vẫn ĐÓNG,
  verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng nguyên. Quyết parent đợt
  141 §11 (A1 rớt dưới 2/3 → xem lại): A1 lượt này = 2/2 = 100%, không
  kích hoạt. Ba điều kiện mở lại điều tra (DEF §13): không xảy ra.

## 1. Vá poller trước khi đo (quyết parent đợt 144 §12.3(b))

Luồng T4 trước (lỗi model) đã chuẩn bị sẵn và T4 này **tái dùng nguyên**:
`poll-wait-t4-145.sh` (ngân sách theo đợt trên đĩa + tag attempt theo boot
+ TESTMODE), `run-attempt-145.sh` (trap EXIT ghi `attempt-done-$TAG` +
baseline dpkg/apt trước attempt), `t4-attempt-inner.sh` (sampler truncate +
tag `boot=` mỗi dòng). T4 này **vá thêm 2 chỗ** trước khi đo:

- **(a) B4 (check-classb-t4.sh):** bỏ grep chuỗi con (`ps aux | grep -E
  '[a]pt-get|[d]pkg|...'`, thủ phạm F-144-T4-2). Thay bằng 3 lớp:
  `pgrep -x apt-get/dpkg/unattended-upgrade` + delta số dòng
  `/var/log/dpkg.log` trong cửa sổ attempt (baseline do run-attempt ghi)
  + quét exact-comm trong ps-before/after. Số grep cũ chỉ ghi tham
  chiếu. **Kiểm chứng:** B4 DAT — pgrep -x=0, dpkg 1545→1545 (delta 0),
  ps exact-comm 0/0; grep cũ tham chiếu cũng 0 (lần này không có shell
  nào nhắc tới apt/dpkg trong cửa sổ).
- **(b) Perpass (analyze-t4-perpass.py — vá sau attempt, xem F-145-T4-1):**
  regex sampler cho phép tiền tố `boot=<boot8> ` tùy chọn.
- **Kiểm thử trước khi đo thật:** `POLL_TEST=1` chạy 1 vòng poll PASS
  (gate0=T5, postboot 0, apt=0, dpkg 1545) rồi mới chạy poller thật.
  `bash -n` OK cả 5 script.

## 2. Poller — 7 poll, cửa mở poll #7 bằng cờ T5 chính

| Poll | Thời gian | RAMavail | load1/load5 | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| #1 | 08:48:32Z | 2.470 MB | 2,66/2,76 | T5 PASS | load cao, chờ |
| #2 | 08:49:17Z | 2.857 MB | 2,57/2,69 | T5 PASS | blockers=1 (F-145-T4-2) |
| #3 | 08:50:02Z | 2.793 MB | 2,10/2,55 | T5 PASS | load vẫn >2 |
| #4 | 08:50:47Z | 2.621 MB | 2,84/2,63 | T5 PASS | load vẫn >2 |
| #5 | 08:51:32Z | 2.409 MB | 1,76/2,37 | T5 PASS | load5 vẫn >2 |
| #6 | 08:52:18Z | 2.171 MB | 0,96/2,07 | T5 PASS | load5 vẫn >2 |
| #7 | 08:53:03Z | 2.021 MB | 0,50/1,79 | **T5 PASS** | **CỬA MỞ, chạy attempt1** |

- Gate0 = cờ T5 chính cả 7 poll (`round145-t5/POSTBOOT_PASS`,
  pass_at 08:45:28Z, poll=2, repair=none/replay-full, dpkg=1545/221,
  boot_id khớp e146ca67). Dự phòng T4-check-only không cần dùng đợt này
  (postboot check-only vẫn chạy theo lịch 4 poll, exit 0).
- Gate A ≥1024 MB GIỮ NGUYÊN; RAM 2.021–2.857 MB cả 7 poll. Lock không
  có; cây YES 530e10a7; apt/dpkg = 0 mọi poll; dpkg.log 1545 dòng không
  đổi; apt history entry cuối 08:00:09Z (trước phiên).
- Poll test (POLL_TEST=1, 08:48:25Z) ghi thêm 1 dòng vào poll-t4.log —
  chỉ là dòng kiểm thử, đã ghi nhãn TEST-POLL-OK, không ảnh hưởng đếm
  poll thật (#1–#7 ở trên).

## 3. Attempt1-e146ca67 — lượt yên #20 HỢP LỆ

- **20/20 exit 0** (08:53:06–08:56:35Z probe; run-attempt exit 0
  08:56:39Z). tickCost median **58,0 ms** (n=508; post-flip 58,0; p90
  88,3; max 239; min 31). tBlend gap n=404 median 102,0.
  BlendTick/pass=20,2; rAF/pass median=32 (25–40). webkit=27,2; pageErrs=[].
- **Lớp B DAT 5/5:** sampler n=104 (103 mẫu + 1 dòng sampler-start),
  load1_max=1,78, RAM_min=1308 MB, RAM_max=1975 MB, 0 mẫu <1024 MB,
  0 mẫu <500 MB; load5 lúc kết thúc 1,32; boot không đổi; B4 DAT (§1a).
  Sampler SẠCH: cả 103 mẫu đều tag `boot=e146ca67` (vá F-144-T4-3 có tác
  dụng — không trộn boot). ps-before/after: chỉ vite/probe của chính T4,
  không có process phân tích nặng của luồng khác.
- **(c2):** seqs [295, 399] (labellag: (295,29,28,1), (399,54,53,1)),
  coverage **2/2** (log gần nhất −26 ms / −25 ms). P3' DAT 2/2 (stall
  trước 2 và 3 tick). P1 YẾU 2/2 (baseline run 69/300=0,2300; p=0,0529;
  signed p=0,0514). P3-A1 YẾU 2/2 (baseline 84/299=0,2809; p=0,0789).
  P7 DUNG — (c2) drawSrc delta {-1: 11, 0: 7}, tre ≥+1f: 0; đối chứng
  toàn bộ drawSrc: 0/372 (log thua ~100 ms — chỉ làm yếu, không bác
  tuyệt đối). P2: 2/2 lag +1, 0 âm.
- **Per-pass (sau vá F-145-T4-1):** load1 mean theo pass tăng dần
  0,46 → ~1,70 (load5 dư từ trước cửa, decay chậm), RAM mean
  1.408–1.560 MB; median tick/pass 41–64 ms. Tương quan Pearson 20
  pass: median~load1_mean **r=0,18**, median~RAM_mean **r=−0,08** — đều
  yếu. Không có spike load nào trong lượt (max 1,78); câu B2 (tải tự
  sinh của stack đo) vẫn chưa có bằng chứng ủng hộ — tải tăng dần đều
  theo load5 dư, không phải spike do probe.

## 4. Balloon — xả sâu lúc đóng

- Lúc đóng (08:58Z): balloon **3.269.540 kB**, RAMavail 3.453 MB,
  load 0,90/1,17 — xả sâu nhất kể từ đợt 143 (đóng đợt 144:
  5.354.516 kB lúc 06:18Z). Không cần can thiệp host. Headroom inotify
  do T9-145 báo — không ghi số ở đây.

## 5. Sai số F-145-T4-1..2

- **F-145-T4-1 — Perpass không đọc được sampler sau vá boot-tag.**
  `t4-attempt-inner.sh` thêm tiền tố `boot=e146ca67 ` vào mỗi dòng
  sampler, nhưng regex `SAMP_RE` trong `analyze-t4-perpass.py` yêu cầu
  dòng bắt đầu bằng timestamp (`^YYYY-...`) → file perpass chạy trong
  attempt báo "sampler mau: 0", không tính được tương quan theo pass.
  Dữ liệu sampler không mất (classb đọc đúng n=104). Đã vá regex cho
  phép tiền tố `boot=` tùy chọn và chạy lại perpass → 103 mẫu, kết quả
  ở §3. Bài học: vá format log phải vá cả mọi parser đọc nó — kiểm
  `analyze-t4-*.py` còn lại: chỉ perpass đọc sampler (classb dùng
  grep token, không phụ thuộc vị trí đầu dòng).
- **F-145-T4-2 — Poll #2 blockers=1 đếm nhầm.** Process bị đếm là shell
  của T2-145 (pid 20409, chạy `eperm-sweep64.py`/`ram-max64.py` + lệnh
  `md5sum ... vite.config.ts`) — bộ đếm blockers grep `[v]ite` khớp
  chuỗi "vite.config.ts" trong cmdline. Chỉ làm chậm 1 poll (45 s);
  poll #3 trở đi blockers=0, không ảnh hưởng attempt. Nợ đợt 146: cân
  nhắc loại trừ chuỗi `vite.config.ts` (md5sum-arg) khỏi bộ đếm
  blockers, hoặc khớp tên process thay vì chuỗi con.

## 6. Files + stage

- **LIMITS này:** `docs/PHASE9_ROUND145_T4_WEBKIT_QUIET20_LIMITS.md`
  (file duy nhất T4 tạo mới trong repo).
- **Script đã vá (trong hidden_files, không stage — file làm việc nội
  bộ):** `check-classb-t4.sh` (vá B4 §1a), `analyze-t4-perpass.py`
  (vá regex sampler F-145-T4-1); tái dùng từ luồng trước:
  `poll-wait-t4-145.sh`, `run-attempt-145.sh`, `t4-attempt-inner.sh`,
  `wait-t4-145.sh`, `vite.t4-temp.config.mjs`,
  `probe121t3-ghost-k7.webkit.mjs`, `b.json`, 10 analyzer
  `analyze-t4-*.py`.
- **Log/evidence (hidden_files/round145-t4/, không stage):**
  `poll-t4.log` (7 poll thật + 1 dòng test POLL_TEST),
  `poll-t4.nohup.log`, `chain-t4.log`,
  `postboot-t4-145-gate0wait-*.log` (check-only exit 0),
  `blockers-ps-2.txt` + `blockers-list-2.txt` (F-145-T4-2),
  `tree-md5.txt` (530e10a7),
  `preview-b-f3-flip-webkit-t4-attempt1-e146ca67.json` (2.914.713 B),
  `classb-t4-attempt1-e146ca67.txt` (DAT 5/5),
  `load-mid-t4-attempt1-e146ca67.log` (104 dòng, toàn boot=e146ca67),
  `analyze-t4-attempt1-e146ca67-*.txt` (tickcost/c2coverage/stall/
  p1p3p7/perpass/labellag/lag5/skiplatest/c2drawlog/wallbands),
  `ps-before/after-t4-attempt1-e146ca67.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt1-e146ca67.txt`,
  `attempt-done-attempt1-e146ca67` (exit=0),
  `coverage-check-attempt1-e146ca67.txt` (2/2),
  `run-webkit-t4-attempt1-e146ca67.log`, `vite-5187-t4-*.log`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này; không reboot
  trong phiên; không process T4 nào còn sống lúc đóng (0 vite/probe
  của T4; vite.lock không còn).
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round145-t4-quiet20.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round145-t4.done` (1 dòng tóm tắt).
- **Log vòng lặp:** 1 dòng tóm tắt đã ghi vào
  `workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
  (mục đợt 145).
