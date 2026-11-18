# PHASE9_ROUND112_LIMITS — Verify độc lập đợt 112 (N1–N7 + cây gộp)

> Luồng N8 (verify), đợt 112, lượt cron 15:35 +07 14/11/2026. Bắt đầu 08:41Z,
> xong ~10:26Z 14/11/2026. Boot trong lúc đo #42 (08:05:10Z,
> `cc39f151…`) rồi #43 (08:53:37Z, `1af50bdb…`, gap #42→#43 = 48'27" —
> trong khoảng đã chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn). Reboot
> #43 giết poller N8 ở POLL#2 + lượt N3-R1 lần 1 + dial N5-s70, nhưng
> không luồng nào mất dữ liệu đo (chạy lại từ đầu). KHÔNG push. KHÔNG
> release/tag. Chỉ N1 sửa production (preview.tsx + playheadHold90R2).
> Phương pháp: tính lại headline từng luồng từ dữ liệu thô bằng code riêng
> (script `recount-n8-*.py` trong `hidden_files/round112-n8/`), không tin mù
> LIMITS; chạy lại toàn bộ suite + O8 trên cây gộp; đếm batch từ đĩa.
> File verify: `hidden_files/round112-n8/` (recount-n8-n1/n2/n3/n5/n6,
> recount-n8-n4-*.txt, `round112-n8-suites.log`, `round112-n8-o8.log`,
> `poll-n8.log`, `postboot-check-b43-n8.log`, `baseline-md5.txt`).

## 0. Kết luận ngắn

| Luồng | Verdict | Headline đã xác nhận |
|---|---|---|
| N1 tail-steady/E4 | **KHỚP** | Fix steady-close đã vào production (preview.tsx `03bf029f…`); A/B 2+2 = **0 CAP/180 tick**, 4 steady-close đã xác minh (tuổi 1393/1902/2396/1614 ms) + 1 ended-close (807 ms); Fisher vs K1-on p=0,0862 → **ĐÓNG CÓ ĐIỀU KIỆN** theo prereg (không đủ lực cho ĐÓNG đầy đủ); đính chính m1f4 của N1 đã xác minh từ dữ liệu thô (freeze 5,9667 là DO PAUSE, không phải quirk live) |
| N2 ring 8 MiB | **KHỚP** | Ring 8 MiB: **0/8 run splice** (M2 0/2 + N2 0/6); Fisher vs control gộp 7/10 **p=0,0040** → **bar ĐẠT**; LOOP flood 6,00/6,47 vẫn 0 splice (tách flood ĐẠT); preload/el1-el2 2/2 bogus (không ngăn được splice); L2-A recount khớp 100% qua pull log thô |
| N3 Zombie lượt 4 | **KHỚP kèm đính chính nhỏ** | Dạng mạnh **1/3 lượt** (R1, 2 gap freeze sạch 337/398 ms, cả 2 straddle biên 6/12 s); gộp toàn chuỗi **5/15 lượt**; CDP **0/3 lượt** trong dải → đồng ý bỏ bar CDP vẫn đứng (gộp dải chặt 0/10, mọi lượt 0/11); giả thuyết chuyển clip vẫn CHƯA KẾT LUẬN (n=2 < 5); stall 5 s 0/3 (gộp 0/8) |
| N4 F6' ≤60 ms | **KHỚP** | Lượt yên Q1 tickCost median **58,0 ms** (n=537) → **ngưỡng ≤60 ms GIỮ** (biên mỏng 2 ms); label-at-capture LÀM XẤU nhãn (skp=1 %lag==0 −56,3 điểm % Q1, −37,7 N1) → **KHÔNG đề xuất**; (b) unique-match 126/126 + 532/532, nomatch 0; F6' 63/63 + 266/266 vẫn đứng |
| N5 Điểm gãy tải | **KHỚP** | **Biên GIỮ đẩy từ 1,87 lên 9,59** (s71: 283 tick, 84,1% trong ±1, trung vị 0); s70 TRUNG-GIAN hợp lệ ở 18,2 (159 tick); s72 ở 28,38 chỉ 30 tick (cần ~70 clip); **không lượt nào GÃY**; load1 KHÔNG đơn điệu với phân loại (s73 TRUNG-GIAN ở load1 0,91); lệch dương do skip-stale-frame |
| N6 EPERM probe #31 + mù #30 | **KHỚP** | Probe #31 ok=2 fail=0 (08:40:59Z, boot #42); reboot #42 = 08:05:10Z xác nhận; **mù #30 KHÔNG ĐÓNG HOÀN TOÀN** — 3 cửa sổ mở 11'32" + 72 s + 18'06" (tổng 30'50"); gap stats FULL36 tính lại khớp 100%; WFS lần 18: 613 dòng / 182 file, đối chiếu chéo chênh 0 |
| N7 Infra postboot+O8+lock | **KHỚP kèm đính chính nhỏ** | Postboot boot #42 PASS (N8 chạy lại trên boot #43 cũng PASS); O8 Chromium tự copy fixture (code đã kiểm, nhánh "đã có, bỏ qua" chạy thật trong lần O8 của N8); stale-recovery PASS cả 3 ca (log đã kiểm); headroom boot #42: 1534, boot #43: **1511** (N8 tự đo) |

**Cây gộp cuối đợt (N8 tự chạy, boot #43, 10:16–10:24Z): tsc web 0, tsc
desktop 0, vite build PASS (6,69 s), 27/27 suite exit 0
(playheadHold90R2 93 passed — 84 cũ + 9 mới của N1), O8 WebKit 21/21
PASS. O8 Chromium exit=2 — BỊ CHẶN BỞI ENOSPC HẠ TẦNG (không phải lỗi
sản phẩm): vite thường của script Chromium cần ~1586 watcher nhưng
headroom boot #43 chỉ 1511 (xem §9.2).** `preview.tsx` md5
`03bf029f…` suốt lúc verify — không đổi.

**Batch đợt 112 (đếm từ đĩa, chưa gồm batch N8 này): 7 batch / 19 entry /
19 file duy nhất, 0 binary, 0 workflow.** 11 file >37.768 byte (cần
`ENABLE_PRIVSEP=0` khi push). File oversize đợt 109
`benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 B) vẫn chờ.

## 0.1 Reboot #43 — giờ chính xác + sàn gap (đính chính N3)

`uptime -s` trực tiếp trên boot mới = **2026-11-14 08:53:37Z**,
boot_id `1af50bdb-2872-4542-aaa6-dbec82fa1b51`. Gap #42→#43 =
**48'27"** (08:05:10Z → 08:53:37Z) — con số của N1/N2 là chính xác.
N3 viết "≈48'50" (08:05:10Z → ~08:54Z)" — cao hơn 23 s vì dùng ước
lượng ~08:54Z thay vì `uptime -s` (N3 đã tự ghi caveat lệch RTC ~30 s).
Cả hai đều trong khoảng chứng nhận, **sàn 19'07" không đổi**. Reboot #43
giết: poller N8 (POLL#2 là cuối trước reboot; N8 khởi động lại poller
08:54:53Z), driver N5 (giữa dial s70), lượt N3-R1 lần 1 (trong
WAIT-BAND, chưa đo gì). N1 spawn lại sau reboot (scratch chỉ có prereg
tới ~09:04Z, probe chạy 09:24–09:33Z). Số thứ tự #43 vẫn TẠM THỜI (kế
thừa từ mù #29/#30 chưa đóng — xem §6).

## 1. N1 — tail-steady/E4: KHỚP (verdict: ĐÓNG CÓ ĐIỀU KIỆN)

### 1.1 Tính lại từ dữ liệu thô (recount-n8-n1.py, code riêng)

Đọc 4 `probe-results.json`, nhóm velocityTicks thành đuôi theo
`tail.endedAtMs`, xác định loại đóng từ delta counter ở tick null đầu
sau đuôi (steady/ended/rearm). Tất cả khớp N1 §4:

| Lượt | GOP | ticks | tails | CAP | steady-close (tuổi) | ended-close (tuổi) | max age |
|---|---|---|---|---|---|---|---|
| n1f1 | 250 | 57 | 2 | 0 | 2 (1393, 1902 ms) | 0 | 1902 |
| n1f2 | 30 | 35 | 1 | 0 | 1 (2396 ms) | 0 | 2396 |
| n1f3 | 250 | 41 | 2 | 0 | 0 | 1 (807 ms) | 4087 (rearm) |
| n1f4 | 30 | 47 | 2 | 0 | 1 (1614 ms) | 0 | 2887 (rearm) |
| **gộp** | | **180** | **7** | **0** | **4** | **1** | **4087** |

Fisher tính lại bằng code riêng: vs K1-on [[0,180],[6,278]]
**p=0,0862** ✓; vs L1-fix p=0,4986 ✓; vs M1-fix [[0,180],[1,156]]
**p=0,4659** ✓. Code fix đã đọc trực tiếp trên đĩa:
`PLAYHEAD_TAIL_STEADY_CLOSE_ADVANCES = 4`
(`playheadHold90R2.ts:622`), `steadyAdvances`, hook
`__vcutTailSteadyClosed112N1` + đếm `resumeTailSteadyClosed112N1`
(`preview.tsx:6257–6272`). Unit test 9 mới N1: N8 chạy lại trong cây
gộp — **playheadHold90R2: 93 passed** (84 cũ + 9 mới), khớp N1 §3.
md5 khớp: preview.tsx `03bf029f…`, playheadHold90R2.ts `1b68849a…`
(đúng N1 §0), probe `53239bc0…` (không kiểm lại vì không ảnh hưởng số).

### 1.2 Đính chính m1f4 của N1 — đã xác minh từ dữ liệu thô đợt 111

N8 đọc lại `round111-m1/probe-webkit-load4-gop30-m1f4/probe-results.json`:
- Vel tick t=9004: đuôi mở (endedAtMs 3807, advances 0), ct 5,8667;
  tick t=9401: tail=None, ct 5,8667, ph 5,9667 — đuôi đóng ở tuổi ~5593 ms.
- rafSamples: `playing=False` từ t≈9516 (sau khi đuôi đóng);
  probe-log 06:21:01.515Z "chờ phát tới localPh>=5.0: đạt" rồi probe
  pause app ở ph 5,967. Sampler dừng ở relMs 8993 (localPh 5,467,
  playing=True).
- **Kết luận: đính chính của N1 ĐÚNG** — element ngồi ở 5,9667 VÌ BỊ
  PAUSE (probe teardown), không phải freeze live. `ended` không bao giờ
  đúng vì phát dừng trước khi ct chạm 6,0. Cơ chế gốc (lead bền vững
  +0,4…+0,7 s → C3 chặn mọi lần tăng → đuôi kẹt tới trần) vẫn đứng
  theo số vel tick (gate 0→8, advances 0).

### 1.3 Caveat N1 (giữ nguyên, không đổi verdict)

Tải thấp (load1 đầu lượt 3,53→1,13 so với M1 8–37) — 0 CAP này là trên
cây đã sửa **trong điều kiện tải thấp**; Fisher so với K1-on (tải cao)
bị nhiễu bởi tải. n=180 tick, 7 đuôi. Đuôi re-arm ở frame cuối sau
steady-close #2 (n1f1 tick 50) vẫn chưa đo được (probe pause ở
localPh≥5,0). Cửa sổ stall-watch 3 tick quá hẹp (N1 đã đo lại cửa sổ
rộng: 0 stall, seek dài nhất 1401 ms — N8 không tính lại từng tick
stall-watch, chỉ ghi nhận số đã báo; không ảnh hưởng verdict CAP).

## 2. N2 — Ring 8 MiB: KHỚP

### 2.1 Tính lại từ pull log thô + byte clip (recount-n8-n2.py, code riêng)

Đọc trực tiếp từng `.pull.log` (12 run + 1 run bị giết), so 16 byte đầu
mỗi pull với clip c8 tại req_off / req_off+delta (1M/2M/4M/8M), cộng
APUSH → flood. **Khớp 100% bảng N2 §2** (EXACT/PULL/spliced/flood/
queue2/first-last ms):

| Arm | Run | spliced | EXACT/PULL | flood | queue2 |
|---|---|---|---|---|---|
| N2CTL | r1 | 14 (+4.194.304) | 1458/1476 | 5,83 | 2 |
| N2CTL | r2 | 0 | 1446/1448 | 3,26 | 1 |
| N2R8 | r1–r6 | 0/0/0/0/0/0 | 1458/1460, 1462/1464, 1432/1434, 1450/1452, 1448/1450, 566/568 | 3,36/3,40/3,17/4,40/3,39/2,76 | 1 |
| N2R8LOOP | r1/r2 | 0/0 | 1964/1969, 2518/2522 | 6,00/6,47 | 2 |
| N2EL | r1/r2 | 16/4 (+4.194.304) | 1092/1112, 1116/1120 | 7,47/5,54 | 2 |
| (ngoài bar) r6 bị giết | — | 0/917 pull | 915/917 | 3,01 | 1 |

Chi tiết splice khớp: N2EL r1 có 2 pull req_off=0 ở ms 39319 (pipeline
el1) + 14 pull ms 41699–41806 (pipeline el2); N2EL r2 có 4 pull ms
10221 (78 ms sau queue2 #1). Fisher tính lại: R8 0/8 vs control gộp
7/10 **p=0,0040** ✓; vs control cũ 6/8 p=0,0070 ✓; vs control hẹp 4/6
p=0,015 ✓; riêng N2R8 0/6 vs 7/10 p=0,0114 ✓. JSON case khớp bảng
(frames/finalCt/elLog/preloadFull/seekedOk: EL r1 preloadFull=TRUE
19304 ms, r2 seekedOk=TRUE; finalSrcKind r1 http). media.ts md5
`2c384ed1…` không đổi ✓.

### 2.2 Đính chính nhỏ cho N2 (không đổi verdict)

N2 §3: "nếu 1 trong 8 run R8 đã bogus thì p vẫn 0,0406 (tính trước ở
prereg)". Số 0,0406 là Fisher hai phía của [[1,7],[6,2]] — tức so với
control CŨ 6/8, không phải control gộp chính 7/10. So với control gộp
7/10, 1/8 bogus cho **p=0,0248** (một phía 0,0230) — vẫn <0,05, kết
luận "có biên" còn mạnh hơn N2 viết. Ghi rõ cơ sở so sánh để khỏi nhầm.
Không đính chính nào khác: run mỏng r6 (9 frames) loại khỏi Fisher vẫn
p=0,0098 (0/7 vs 7/10, tính lại) — kết luận không dựa vào run mỏng.

## 3. N3 — Zombie lượt 4: KHỚP kèm đính chính nhỏ

### 3.1 Tính lại từ dữ liệu thô (recount-n8-n3.py, parse analysis.txt)

| Lượt | draws-gap >300 | dạng mạnh | CDP recv-gap >300 / đạt bar | load5 median | in-band | draws/s |
|---|---|---|---|---|---|---|
| R1 | 6 | **2** (337 ms 5,00→6,20; 398 ms 11,53→12,13) | 11 / **0** | 5,70 | 15/15 | 30,6 |
| R2 | 0 | 0 | 3 / **0** | 7,85 | 16/16 | 32,4 |
| R3 | 0 | 0 | 3 / **0** | 7,72 | 16/16 | 22,1 |

Bar CDP được tính lại từng dòng §4 theo đúng luật (Δe4skip>0 VÀ
Δph ≥ 0,7×gap VÀ Δdraws==0): **0 verdict nào sai khác analyzer**.
Cả 2 gap mạnh đều straddle biên clip 3 s (6 s, 12 s), bracket 1102/
766 ms. p Poisson-binomial tính lại: **0,0149** (p0=dur/3); p cố định
0,25: **0,0625** ✓. Gộp toàn chuỗi: dạng mạnh **5/15 lượt** (J3 0/4 +
K3 1/3 + L3 2/2 + M3 1/3 + N3 1/3); CDP dải chặt **0/10 lượt** (K3 0/3 +
L3 0/1 + M3 0/3 + N3 0/3), mọi lượt 0/11 — đồng ý bỏ bar CDP làm bar
song song vẫn đứng, falsifier không kích hoạt. Stall 5 s: 0/3 (gộp
L3+M3+N3 0/8); stall giữa clip c15: 0/3 (gộp 1/8). driftConfirmSkips
23 cả 3 lượt (gộp M3+N3 6/6) — khớp N3 §6.

### 3.2 Đính chính cho N3 (nhỏ)

1. **Số workerTicks R1:** N3 LIMITS §2.1 viết "workerTicks gộp 5071".
   File analysis ghi "drained 4635 + tail 437 => gộp **5072**"; 5071
   là số w-gap/r-gap (n=5071), không phải số tick. Lỗi nhãn 1 đơn vị,
   không ảnh hưởng verdict (R2 5066 và R3 3928 trong LIMITS là số
   gap trong lúc phát, khớp analysis §5).
2. **Gap reboot #43:** N3 viết "≈48'50"" (ước lượng ~08:54Z). Giờ
   chính xác từ `uptime -s` là 08:53:37Z → **48'27"** (xem §0.1).
   Không phá sàn theo cả hai cách tính.

## 4. N4 — F6' WebKit ≤60 ms + label-at-capture: KHỚP

Chạy lại cả 4 analyzer của N4 trên JSON Q1 (và JSON M5 N1 làm đối
chứng) — **output giống hệt file N4 đã lưu (diff 0 dòng)**:

| Kiểm tra | Kết quả chạy lại |
|---|---|
| tickcost Q1 | median **58,0** ms, p90 79,0, max 121, n=537; hậu flip+2000ms median 57,0 (n=394); tBlend gap median 96,0; BlendTick/pass 21,9; rAF/pass median 34 — **giống hệt** |
| labellag Q1 | (b) skp=1 n=126 median 0f max +4f; skp=0 n=532 median 1f max +4f; nomatch 0/658; (c2) 3 ca lag 1f — **giống hệt** |
| skiplatest Q1 | F6' (1)/(2) 63/63 (skp=1), 266/266 (skp=0), 0 ứng viên — **giống hệt** |
| labelcapture Q1+N1 | Q1 skp=1 %lag==0 72,2%→**15,9%** (−56,3); N1 skp=1 79,5%→**41,8%** (−37,7); mean\|lag\| Q1 0,56f→1,34f — **giống hệt** |

Verdict ngưỡng ≤60 ms **GIỮ** theo đúng quy tắc prereg (median 58,0 ≤
60) — nhưng biên chỉ 2 ms và tải trôi lên giữa lượt (load1 1,34→4,11,
N6 chạy phân tích blind30 trong cửa sổ) nên N8 đồng ý với N4: verdict
MỎNG, cần 1 lượt yên xác nhận ở vòng sau. Label-at-capture theo
currentTime LÀM XẤU nhãn — KHÔNG đề xuất, khớp N4 §2.2 (cơ chế: nhãn
hiện tại đã đi trước labelCt ~1 frame trong 73% ca). Fixture md5
`2e00e91c…` khớp bản M5 (N8 không gen lại; chỉ kiểm md5 file public/
đã ghi trong LIMITS N4 — N8 xác nhận file tồn tại, md5 khớp như N4
ghi). N4 không sửa production (preview.tsx c4198206 trong lúc đo —
đúng, vì N4 đo trước khi N1 sửa 09:08:07Z; xem §1.3 N1 về nhiễm chéo).

## 5. N5 — Điểm gãy tải: KHỚP

Tính lại từ 5 `frame-parity-results.json` thô (recount-n8-n5.py:
offset = presented − expected trên blendTick; sampled mean load1 từ
loadSamples; skip-stale-frame đếm exact decision). **Khớp 100% bảng
N5 §1 + §7**:

| Lượt | n tick | med off | trong ±1 | mean load1 | tick/s | caps | skip-stale | phân loại |
|---|---|---|---|---|---|---|---|---|
| s74 control | 841 | 0 | 97,6% | 1,65 | 12,35 | 184 | 19,7% | GIỮ |
| s73 | 121 | +2 | 47,1% | 0,91 | 1,60 | 88 | 40,3% | TRUNG-GIAN |
| s71 | 283 | 0 | 84,1% | 9,59 | 4,36 | 121 | 21,8% | GIỮ |
| s70 | 159 | +1 | 58,5% | 18,20 | 2,19 | 98 | 36,6% | TRUNG-GIAN |
| s72 retry | 30 | +2 | 43,3% | 28,38 | 0,24 | 49 | 37,7% | TRUNG-GIAN (n<50) |

0% mẫu ≤ −2 ở cả 5 lượt — không lượt nào GÃY. **Biên GIỮ nay 9,59**
(s71, trên build 03bf029f) — tăng ~5× so với M7 (1,87) nhờ phát dài.
Dị thường s73 (TRUNG-GIAN ở load1 thấp nhất 0,91, load5 mean 6,6 đang
decay) đã tái hiện mẫu r65 của M7 — N8 xác nhận số, không thêm diễn
giải. md5 trước/sau khớp mọi lượt (s74 trên c4198206, 4 lượt tải trên
03bf029f, mtimeChanged=false). Ghi chú phương pháp (lỗi của N8, không
phải N5): đếm skip-stale bằng substring "skip-stale" sẽ thổi phồng
(s72 45,3% thay vì 37,7%) vì decision `skip-stale` (không `-frame`)
là loại khác — đếm exact `skip-stale-frame` mới khớp N5.

## 6. N6 — EPERM probe #31 + mù #30: KHỚP

### 6.1 Probe #31 + reboot #42

Log probe v2: **86 dòng** ✓ (82 sau M4 + 3 dòng checklist + 1 dòng DEAD
08:56:42Z). `probe#31 boot=cc39f151 tmp+ws ok=2 fail=0` 08:40:59Z ✓;
heartbeat n=31, ts 08:40:59Z, boot cc39f151 ✓. Reboot #42 = 08:05:10Z:
N8 xác nhận độc lập bằng `uptime -s` trên boot #43 không đo lại được
#42, nhưng N6 đã đo 2 lần trực tiếp + N7 độc lập + N8 xác nhận boot
#43 nối tiếp (gap 48'27"). Gap #40→#41 = 5810 s (1h36'50"),
#41→#42 = 4304 s (1h11'44") — tính lại từ giờ reboot, khớp N6.

### 6.2 Gap stats — tính lại bằng code riêng (recount-n8-n6.py)

| Thống kê | CERT22 | FULL32 | FULL34 | FULL36 (mới) |
|---|---|---|---|---|
| mean / median | 1h52'05" / 1h59'16" | 2h01'58" / 1h59'16" | 1h59'51" / 1h59'16" | **1h57'52" / 1h58'30"** |
| p10 / p90 | 1h08'41" / 2h57'18" | 51'50" / 3h05'08" | 38'06" / 3h05'01" | **41'30" / 3h04'54"** |
| sd / min / max | 43'58" / 19'07" / 3h14'08" | 1h03'55" / 19'07" / 5h43'18" | 1h04'16" / 19'07" / 5h43'18" | **1h03'01" / 19'07" / 5h43'18"** |

**Khớp 100% số N6** (cả 3 cross-check cũ + FULL36 mới; đếm 19/5/6/2
khớp). Dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn đã
chứng nhận (n=22).

### 6.3 Mù #30 — KHÔNG ĐÓNG HOÀN TOÀN (N8 kiểm spot)

- Số học cửa sổ tính lại tại cả 4 biên: w1-lo 07:12:33 (gap1 19'07",
  gap2 52'37"), w1-hi 07:24:05 (30'39"/41'05"), w3-lo 07:27:57
  (34'31"/37'13"), w3-hi 07:46:03 (52'37"/19'07") — **khớp N6**.
- Session U4 `proc_d5d8eabae4c1`: `stat` cho birth **07:24:05.144Z**,
  modify **07:27:23.586Z** ✓ (N8 suýt ghi sai do tự đổi epoch nhầm —
  đã sửa bằng output `stat %w` trực tiếp; nội dung log có U4 141/141
  ở cuối). Trừ 38 s sống sót → khe 72 s [07:26:45Z, 07:27:57Z] đứng.
- Spot-check lỗ bằng `find` trực tiếp: lỗ 747 s (07:11:38Z→07:24:05Z)
  chỉ có đúng file cờ `round111-m9-done` ở biên 07:11:38Z (không có
  file nào BÊN TRONG lỗ); phần đầu lỗ lớn [07:27:57Z, 07:46:03Z] có
  **0 file** trong cả hai cây — khớp N6.
- WFS: đếm độc lập bằng grep trên 2814 file trong `files-newstd.bin`:
  **613 occurrence** ✓; scan-meta ghi NEWSTD 613/182, R7B 638/199,
  COPIES 25/17 ✓. Async `.writeFile(`: N8 không đếm lại (tin số N6
  đã đối chiếu 2 vị trí helper retry — ghi rõ là chưa kiểm lại độc
  lập).
- Sóng EPERM: N8 không đếm lại 116 log (tin số N6: 0 "vẫn bật", 0
  "Operation not permitted", 6 "đã tắt" đều là launcher giả) — ghi rõ
  là chưa kiểm lại độc lập.

## 7. N7 — Infra: KHỚP kèm đính chính nhỏ

- **Postboot boot #42 PASS** (log `n7-postboot-check1.log` đã đọc:
  wrapper, 5 lib, GST 269=269, apt 10/10, launch WebKit 3 chế độ
  2405/882/1925 ms). **N8 chạy lại postboot-check trên boot #43
  (10:1xZ): PASS exit 0** — wrapper, libs, GST 269=269, apt 10/10,
  kết luận ĐỦ ĐIỀU KIỆN (log `round112-n8/postboot-check-b43-n8.log`).
  Script vẫn ghi tham chiếu "#42 = 08:05:10Z" trong header (chữ cũ;
  check chức năng so với boot hiện tại nên vẫn PASS) — xem §10 mục 11.
- **O8 tự copy fixture:** code đã đọc trực tiếp
  (`clicktest-87o8-mask-track-headed.mjs:601–619` — copy 3 file từ
  `hidden_files/round87-o8/headed/`, idempotent, không ghi đè). Trong
  lần O8 của N8, nhánh "đã có trong SCRATCH, bỏ qua (không ghi đè)"
  chạy thật cả 3 file (vì N8 copy trước theo mẫu M9) — nhánh copy
  chưa được thử lại trong lần này; bản dry-run của N7 đã kiểm copy
  3/3 md5 khớp. **Chưa có bằng chứng mới nào cho thấy fix này sai.**
- **Stale-recovery:** log `n7-lock-stale-test.log` đã đọc — cả 3 ca
  PASS (owner chết + tuổi già; dir trống kiểu L4; đối chứng âm lock
  tươi không bị xóa). Lock script KHÔNG sửa đợt này (md5
  `fd21193c…` — khớp bản N3 đóng băng và bản N8 dùng).
- **Headroom:** N7 đo boot #42: 1534. **N8 đo lại boot #43:
  1511** (probe K8; trần 63747; cell-visible wd chỉ 14 — ~62k watch
  nằm ngoài cell). Cảnh báo của N7 (§5) đã ứng nghiệm ở O8 Chromium
  đợt này (xem §9.2).

### 7.1 Đính chính cho N7 (nhỏ)

N7 §2.1 viết gap #41→#42 "KHÔNG phá sàn 19'07" (đợt 106) / 26'03"
(đợt 110)". **26'03" KHÔNG phải sàn và chưa từng là sàn** — sàn chứng
nhận vẫn là 19'07" duy nhất (M9 đã đính chính ở LIMITS gộp đợt 111
§0.1; đây là lỗi thứ ba liên tiếp về sàn sau L5/L7/L8 đợt 110 và M8
đợt 111). Kết luận "không phá sàn" vẫn đúng vì 1h11'44" > 19'07".

## 8. Hạ tầng đợt 112 (gộp)

- **Reboot #43** 08:53:37Z (xem §0.1). Không reboot nào khác trong đợt
  (boot #43 suốt từ 08:53:37Z tới cuối verify 10:26Z).
- **ENOSPC / vite nối tiếp:** headroom boot #43 chỉ **1511** (N8 đo) —
  thấp hơn cả boot #42 (1534) và boot #40 (1657/1640). Vite thường
  (~1586 watch) KHÔNG chạy được trên boot này; mọi vite tạm của luồng
  đo đều dùng `watch.ignored ["**/**"]` (0 watch) — đúng quy định.
  Lock vite: tranh chấp cả đợt (N5 chờ ~15 phút tổng; N1 chờ từ
  09:24:40Z tới 09:31:37Z; N3 chờ N5 16 + 8 phút). N8 giữ lock
  10:16:39Z–10:25:15Z cho suite + O8, nhả sạch, không vite mồ côi
  (ps sạch, curl 5554/5564/5184/5590 đều 000 sau khi xong).
- **Build đổi giữa chừng:** N1 sửa preview.tsx 09:08:07Z (c4198206 →
  03bf029f, +1335 byte) giữa control s74 và các lượt tải N5, giữa R1
  và R2 của N3 — cả hai luồng đều ghi rõ và xử lý theo addendum/tiền
  lệ (không lượt "lai" nào; md5 ổn định trong từng lượt).
- **Poll tự đếm chính mình (N4 §0.1):** mẫu poll M5/L7 mang lỗi +1
  blocker giả (pattern `WebProcess` trần) — N4 đã vá trong poll của
  mình; vòng sau vá mẫu chung.

## 9. Cây gộp cuối đợt — N8 tự chạy (10:16–10:24Z, boot #43, máy yên)

Trước khi chạy: `ps` không còn vite nào; giữ `vite.lock` có owner
`n8-round112` (bản copy đóng băng md5 `fd21193c…`, poll 5 s), nhả sau
khi xong. `preview.tsx` md5 `03bf029f…` trước/sau mọi lượt kiểm — không
đổi. Postboot-check chạy trước (boot #43 mới): PASS toàn bộ.

### 9.1 Suite 27 mục — 27/27 exit 0 (log `round112-n8-suites.log`, 904 dòng)

| Mục | Kết quả |
|---|---|
| tsc-web | exit 0 (0 lỗi) |
| tsc-desktop | exit 0 (0 lỗi) |
| vite build | PASS, built in 6,69 s (chunk >500 kB cảnh báo cũ) |
| playheadHold90R2 | **93 passed** (84 cũ + 9 mới của N1 — xác nhận claim N1 §3) |
| playheadPacing54K9 | 19 pass, 0 fail |
| previewEngine | 27 test passed |
| seek | 21 passed |
| seekSkipRender86N3 | 9/9 test pass |
| previewLoop50F2 | 20 passed |
| ghostBlend.probe | 15 kiểm chứng xanh |
| rvfcClipWindow102D3 | 21 test passed |
| driftConfirmSkip103E4 | 12/12 + 5/5 PASS |
| css60 | PASS (60/60) |
| css61 | PASS (60/60) |
| P7-esbuild | 8/8 pass |
| orphans | 17 pass, 0 fail |
| r6 | PASS (i18n check) |
| U4 | 141 pass, 0 fail |
| media-tests | 3/3 PASS (blobPrefetch 25 pass; captureThumb PASS 2 FAIL 0; retryPlay95W2) |
| media-retry96X3 | 7 pass, 0 fail |
| media-watchdog96X3 | 9 pass, 0 fail |
| deint-verdict | 17 pass, 0 fail |
| deint-verdict-100b7 | exit 0 |
| armHeld99a3 | exit 0 |
| vite-diagnosis-regex | exit 0 |
| xvfb-lock | PASS (không lỗi) |
| test-preview-engine.sh | 354 assertions pass |

### 9.2 O8 — WebKit 21/21 PASS; Chromium BỊ CHẶN BỞI ENOSPC (log `round112-n8-o8.log`)

- **WebKit 10:23:18–10:23:54Z (LD_LIBRARY_PATH debroot): 21/21 pass,
  0 fail, 0 note**, exit 0; report JSON `o8-webkit/o8w-clicktest-report.json`.
  S7: mask Δx=0,194, bóng Δx=0,197 (kỳ vọng 0,194) — giống L9/M9.
- **Chromium 10:21:04–10:22:59Z: exit=2, KHÔNG chạy được scenario nào
  (không phải lỗi sản phẩm).** Vite dev của script Chromium chết 8/8
  lần thử với `ENOSPC: System limit for number of file watchers
  reached, watch '.../apps/web/src/i18n/fragments/round63-r5.json'`
  (log `o8-chromium/o8-vite-attempt1.log`). Nguyên nhân gốc: script
  Chromium viết vite config tạm **không có** `server.watch.ignored`
  (`clicktest-87o8-mask-track-headed.mjs:647` — chỉ `server: { hmr:
  false }`), trong khi script WebKit có workaround L8
  (`watch.ignored: ["**/**"]`, dòng 268) nên chạy được trên cùng
  boot. Headroom boot #43 do N8 đo độc lập: **1511 < ~1586** watcher
  của 1 vite thường; cell-visible wd chỉ 14 — phần thiếu nằm ngoài
  cell, không giải phóng được. Trên boot #41 (M9) Chromium O8 đã
  PASS — headroom khi đó đủ; đây là giới hạn hạ tầng theo boot,
  không phải hồi quy sản phẩm.
- **N8 KHÔNG sửa script Chromium** (ngoài phạm vi luồng verify; sửa
  harness thuộc luồng hạ tầng có prereg, như L8 đã làm cho WebKit ở
  đợt 110). Đề xuất cho đợt sau: mirror `watch: { ignored: ["**/**"] }`
  vào config tạm của script Chromium (xem §10 mục 12). Fixture không
  phải nguyên nhân lần này: cả 3 fixture đã có trong SCRATCH (N8 copy
  trước theo mẫu M9; script N7 cũng log "đã có, bỏ qua" đúng nhánh mới).

### 9.3 File production đổi so với đầu đợt (find file đổi từ 08:41Z)

Chỉ N1 đổi production: `apps/web/src/preview.tsx`,
`apps/web/src/lib/playheadHold90R2.ts`,
`apps/web/src/lib/playheadHold90R2.test.ts`. Ngoài ra chỉ có
script/benchmark/docs (đều nằm trong batch §9.4) + 1 file binary
local-only của M5 đợt trước (`apps/web/public/stripes-nonperiodic.mp4`,
KHÔNG stage — đã có từ đợt 111, md5 không đổi). Không có file lạ nào
khác đổi trong đợt.

### 9.4 Đếm batch từ đĩa (đọc trực tiếp paths-loop)

| Batch | Entry |
|---|---|
| phase9-round112-n1-tailfreeze.txt | 5 |
| phase9-round112-n2-ring8.txt | 4 |
| phase9-round112-n3-zombie.txt | 2 |
| phase9-round112-n4-f6p60ms.txt | 1 |
| phase9-round112-n5-loadbreak.txt | 2 |
| phase9-round112-n6-eperm.txt | 1 |
| phase9-round112-n7-infra.txt | 4 |
| phase9-round112-n8-verify.txt (N8) | 1 |
| **Tổng đợt 112** | **8 batch / 20 entry / 20 file duy nhất** |

**0 binary, 0 `.github/workflows/*`.** Mọi file staged đều tồn tại
trên đĩa. 11 file >37.768 byte (cần `ENABLE_PRIVSEP=0` khi push):
clicktest-87o8-mask-track-headed.mjs 70.530 B; probe112n1.mjs 46.646 B;
probe112n3-frame-parity.mjs 58.391 B; probe112n5-frame-parity.mjs
39.133 B; playheadHold90R2.test.ts 50.701 B; playheadHold90R2.ts
56.791 B; preview.tsx 442.673 B;
webkit_blob_flaky_112n2_2mib.mjs 72.785 B;
webkit-blob-flaky-112n2-2mib.json 53.852 B;
PHASE9_ROUND112_N3_ZOMBIE_LIMITS.md 38.676 B;
PHASE9_ROUND112_N6_EPERM_LIMITS.md 51.303 B.
**Lũy kế chờ push đợt 106–112 (đếm trực tiếp từ paths-loop): 67 batch /
139 entry / 127 file duy nhất + 1 file oversize**
`benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 B, vẫn chờ).
Lưu ý đối chiếu: M9 §9.4 đếm lũy kế 106–111 là 58/118/111 — đúng tại
thời điểm M9 xong (07:11Z); sau đó parent stage thêm
`phase9-round111-closing.txt` (07:24:05Z, 1 entry:
PHASE9_GAP_ANALYSIS.md) nên lũy kế 106–111 nay là 59/119/111. Đợt 112
thêm 8/20/20 (trùng 4 file cũ: preview.tsx, playheadHold90R2.ts/.test.ts,
vcut-webkit-postboot-check.sh) → 67/139/127.

## 10. Nợ mở sang đợt sau (cập nhật từ LIMITS gộp đợt 111 §10)

1. **G1 + mù #22 chờ user quyết** (metric G5/M2; mù #22 cửa sổ lý
   thuyết ≤78 s) — không đổi. Thêm: **mù #28 chờ user quyết** (chấp
   nhận "ít nhất 2 reboot, có thể 3" hay để mở), **mù #29 KHÔNG ĐÓNG
   HOÀN TOÀN** (lỗ thật 13'33" theo M9, khe 79 s), **mù #30 KHÔNG ĐÓNG
   HOÀN TOÀN** (mới đợt này — 3 cửa sổ mở, tổng 30'50"; 2 reboot đã
   chốt + tối đa 2 ẩn; số thứ tự #41/#42/#43 vẫn TẠM THỜI).
2. **E4: ĐÓNG CÓ ĐIỀU KIỆN (N1 đợt này, 0 CAP/180 tick, Fisher
   p=0,0862).** Cần 1 đợt xác nhận tải cao (load1 ~8–30 như M1) trên
   cây 03bf029f để Fisher vs K1-on có cơ đạt p<0,05 → ĐÓNG đầy đủ;
   hoặc user quyết đóng có điều kiện là đủ. Thêm nợ mới: probe không
   pause ở localPh≥5,0 (hoặc timeline dài hơn 6 s) để quan sát đuôi
   re-arm ở frame cuối sau steady-close + quirk ended-không-bao-giờ-
   đúng trong lúc đang phát (nếu tồn tại); đăng ký stall-watch cửa sổ
   rộng ngay từ đầu. Pause-deadlock đã chết (0 paused); fix
   endedClosed của M1 đã bắn live lần đầu (n1f3, 807 ms).
3. **Ring 8 MiB: Fisher ĐÃ ĐẠT (N2: 0/8 vs 7/10, p=0,0040)** — lần đầu
   đạt ngưỡng prereg. Production vẫn bế tắc (giữ đề xuất M2/L2: không
   đưa chặn set-lại ring thành sửa production; giữ fallback http).
   Còn lại: đo trực tiếp lag push/take tại thời điểm splice (nợ M2
   §9.2); seek chậm/lỗi là vấn đề UX độc lập (N2EL r1 seek 17,6 s).
   G6 §8.5c nay có thêm (d) preload-el1 + seek-el2: 2/2 bogus — bác.
4. **Zombie gate (b) dạng mạnh: VẪN MỞ, tần suất gộp 5/15 lượt.**
   N3: 1/3 lượt (R1, 2 gap). **Quyết bar CDP: N3 đồng ý bỏ làm bar
   song song** (điều kiện chữ thỏa từ M3, N3 kiểm chứng độc lập +
   falsifier không kích hoạt; gộp dải chặt 0/10, mọi lượt 0/11) —
   chờ parent quyết cuối. Giả thuyết freeze ở chuyển clip: mẫu mới
   n=2 (2/2 straddle) — CHƯA KẾT LUẬN, cần tích tới n≥5 theo quy tắc
   prereg §3.2 (gộp mô tả 9/10, caveat double-dip). Stall 5 s biên
   60 s: 0/8 lượt (L3+M3+N3); stall giữa clip kiểu c15: 1/8 lượt —
   nguyên nhân gây seek giữa clip vẫn chưa xác định. draws/s dao động
   1,5–3× giữa các lượt chưa rõ nguyên nhân; bracket vẫn phồng dù
   state100 dày nhất chuỗi. Vòng sau nên đăng ký build cố định cho cả
   đợt (đợt này N1 đổi build giữa R1/R2 của N3 và giữa control/lượt
   tải của N5).
5. **E6: ĐÃ ĐÓNG** (L4 đợt 110, 18/18; M7 đợt 111 thêm 2 → 20/20).
   H-alt không tái hiện lần 3 liên tiếp — dừng dùng H-alt để diễn giải.
6. **E1 bar ≥7: ĐÃ ĐẠT** (L5 run31 đợt 110). Gate v2: N5 xác nhận đạt
   gate v2 không suy ra presented GIỮ (s71 GIỮ, s70/s72 TRUNG-GIAN
   đều đạt gate) — gate là cổng liveness, không phải cổng chính xác.
7. **EPERM probe #32 + mù #31 đợt sau** (mù #30 KHÔNG đóng hoàn toàn
   — xem §6; probe #31 ok=2 fail=0 trên boot #42; baseline log cho
   lượt sau là **86 dòng**, không phải 85). Đề xuất cron riêng 10 phút
   vẫn chờ user quyết (lý do mới: mù #30 không đóng được LÀ VÌ poller
   M9 đã exit lúc 06:49:11Z và không còn observer thường trực nào sau
   đó — cùng mẫu mù #28/#29).
8. **F6': ĐÃ ĐÓNG (L7); ngưỡng WebKit ≤60 ms GIỮ theo prereg nhưng
   MỎNG (N4: median 58,0, biên 2 ms, tải trôi lên giữa lượt) — cần 1
   lượt yên xác nhận ở vòng sau** (chờ máy thật yên cả lượt, không
   luồng khác chạy phân tích nặng). (A) label-at-capture theo
   currentTime: **ĐÃ ĐO XONG, KHÔNG đáng làm** (N4 §2.2) — hướng nhãn
   tốt hơn (nếu muốn) là anchor theo frame đã giải mã thật, không
   phải label-at-capture. Nhãn ghost vẫn nhiễu (cấu trúc). Bar F6'
   KHÔNG cần định nghĩa lại lúc này (ngữ nghĩa nhãn không đổi).
9. **Điểm gãy tải: VẪN MỞ (N5).** Biên GIỮ nay **9,59** (s71, 283
   tick, 84,1%); không có điểm GÃY nào tới load1 28,38; s70
   TRUNG-GIAN hợp lệ ở 18,2; s72 ở 28,38 chỉ 30 tick — cần ~70 clip
   (~210 s phát) mới đủ 50 tick, và PHẢI sửa dụng cụ trích kết quả
   trước (s72 lần 1 mất dữ liệu do EVAL_TIMEOUT 60 s sau phát 340 s).
   Playhead kẹt ~3,5 phút ở biên clip 21,0 s dưới tải (s72 lần 1,
   kẹt cả khi tải đã giảm) — cần luồng riêng chẩn đoán. Dị thường
   s73 cần 1 lượt control không tải trên build 03bf029f để tách hiệu
   ứng build N1 khỏi hiệu ứng tải-decay. Dial hog không điều khiển
   được load1; load1 không dự báo được phân loại lượt (GIỮ và
   TRUNG-GIAN chồng lấn hoàn toàn). Gate v2 không suy ra GIỮ.
   offset100 không dùng được để phân loại.
10. **ENOSPC: vite nối tiếp bắt buộc** (headroom boot #43 chỉ 1511;
    1 vite thường ~1586 watch). `watch.ignored ["**/**"]` đã chứng
    minh 0 watch — áp dụng cho mọi vite tạm của luồng đo. Phần C đã
    đo (đợt 111): vite thường V2 ≤2 s, vite ignored STALE@32s —
    trade-off stale-module vẫn mở (cần quyết có chấp nhận STALE@32s
    không). Stale-recovery của lock script đã được N7 kiểm lại PASS
    cả 3 ca trên bản hiện tại (không sửa script đợt này).
11. **WebKit sau reboot: đã có đường bền vững** (apt replay + script
    postboot-check; N8 chạy PASS trên boot #43 — **cần cập nhật tham
    chiếu trong script lên #43** vì header vẫn ghi "#42 = 08:05:10Z";
    check chức năng không phụ thuộc boot nên vẫn PASS). Replay mất
    ~13–36 phút sau boot mới đủ package — probe WebKit đầu đợt sau
    reboot phải chạy postboot-check trước. Vite mồ côi: kill vite
    phải theo pid node thật, kiểm `ps` + `curl` cổng sau khi kill
    (đợt này không còn vite mồ côi sau khi xong).
12. **O8 Chromium BỊ CHẶN BỞI ENOSPC trên boot #43 (mới, §9.2):**
    script Chromium dùng vite thường (không có watch.ignored) nên
    chết 8/8 lần thử; script WebKit có workaround L8 nên PASS 21/21.
    **Đề xuất: mirror `watch: { ignored: ["**/**"] }` vào config tạm
    của script Chromium** (luồng hạ tầng đợt sau, có prereg — N8
    không sửa). Tới lúc đó, O8 Chromium trên boot headroom thấp sẽ
    tiếp tục không chạy được — không được diễn giải là lỗi sản phẩm.
13. **Birefnet 0 lần thành công** — chỉ thử lại khi RAM đổi (guard
    6 GB; RAM khả dụng ~0,7–2,5 GB; max RAM trong mù #30 là 1.468 MB).
    **TTS 39 CẤM kiểm lại.**
14. **Lock script + quy trình:** (a) KHÔNG sửa `vcut-vite-lock.sh`
    khi có acquire đang chạy (N7 đã viết spec đóng băng
    `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md` đợt này — dùng bản copy đóng
    băng + poll 5 s + chờ ≥15 s sau khi nhả nếu định giữ lại ngay);
    (b) không diễn giải mọi exit != 0 của acquire là "timeout" (N5
    gặp log "hết 900 s" sau 15 s vì acquire bị reboot giết; N1 gặp
    log driver trỏ sai file run-m1.log do sed); (c) poll script mẫu
    M5/L7 mang lỗi tự đếm chính mình (pattern `WebProcess` trần) —
    vá mẫu chung (N4 đã vá trong poll của mình).
15. **ci-security.yml vẫn 403, chờ user** (workflow chưa từng lên
    GitHub). **Release gate không đổi** (chỉ release khi ngang/hơn
    CapCut thật). **KHÔNG push** khi user chưa nhắn "push đi".

## 11. Ghi chú verify (N8)

- Poll N8: POLL#0 08:41:15Z → POLL#2 08:51:15Z (boot #42), reboot #43
  cắt poller; N8 khởi động lại poller 08:54:53Z, POLL#3 → POLL#19
  10:15:01Z (mỗi 300 s). 7/7 done lúc 10:15:01Z (N7 08:51, N4 ~08:59,
  N6 ~09:09, N2 09:24, N1 09:33, N3 09:52, N5 10:15). Hạn chờ ~10:40Z
  — N8 không cần chờ hết hạn vì tất cả đã về trước hạn.
- Reboot trong đợt N8: #43 08:53:37Z (giữa POLL#2 và POLL#3). N8 kiểm
  cây gộp trên boot #43 sau postboot-check PASS.
- N8 không chạy suite cuối trước khi 7/7 luồng xong (tránh tranh
  vite); suite chạy 10:16–10:20Z, O8 10:21–10:24Z, đều sau khi N5
  xong và lock đã tự do.
- Không có luồng nào sửa production ngoài N1 (kiểm bằng md5 + find
  file đổi từ 08:41Z, xem §9.3). N4 có 1 file binary local-only
  (stripes-nonperiodic.mp4, đã có từ M5) không stage — đúng quy định.
- N8 tự kiểm lại 3 claim không có output gốc đủ mạnh: stale-recovery
  của N7 (§7 — PASS cả 3 ca theo log), tickCost/labelcapture của N4
  (§4 — chạy lại analyzer, giống hệt), và đính chính m1f4 của N1
  (§1.2 — đọc lại JSON thô đợt 111, xác nhận pause là nguyên nhân
  freeze 5,9667). N8 cũng tự tìm 3 đính chính nhỏ: số workerTicks R1
  của N3 (5072 không phải 5071), gap #43 của N3 (48'27" không phải
  48'50"), và lỗi sàn 26'03" lặp lại của N7 (§7.1).
- N8 KHÔNG kiểm lại độc lập: số sóng EPERM trong 116 log của N6 (§6
  — tin số N6), đếm async `.writeFile(` của N6 (§6), từng tick
  stall-watch rộng của N1 (§1.3), và số đếm chi tiết của N7 (launch
  WebKit 3 chế độ — chỉ đọc log). Các mục này được ghi rõ trong từng
  §.

## 12. File đã đổi + batch (KHÔNG push)

- `docs/PHASE9_ROUND112_LIMITS.md` — file này.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round112-n8-verify.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu verify:
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round112-n8/`
  (poll-n8.sh, poll-n8.log, baseline-md5.txt, recount-n8-n1/n2/n3/n5/n6.py
  + .txt, recount-n8-n4-tickcost/labellag/skiplatest/labelcapture.txt,
  postboot-check-b43-n8.log, lock-acquire.log,
  vcut-vite-lock-frozen.sh, round112-n8-verify.sh,
  round112-n8-suites.log, round112-n8-o8.sh, round112-n8-o8.log,
  o8-chromium/, o8-webkit/).
- Cờ xong: `hidden_files/round112-n8-done` (tạo SAU KHI LIMITS + batch
  xong).
