# PHASE9 ROUND116 S9 — SEEK/PRELOAD: sửa cuộc đua ring-wrap ở pull đầu + chạy lại bar B-Q8-1 — LIMITS

- **Đợt:** 116, luồng S9. **Ngày:** 2026-11-14 (UTC). **Boot:** #49 (`9c6b5543-8edd-4362-a093-ca6020892737`, uptime 21:46:46Z; reboot #49 lúc 21:46:46Z, gap #48→#49 = 2h03'00", trong khoảng đã chứng nhận).
- **Cây:** `preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b`, `media.ts` md5 `2c384ed13703809d5e999311147745e7` — **không đổi trước/sau lượt** (đã verify nhiều lần, lần cuối 22:43Z).
- **Prereg:** `hidden_files/round116-s9/prereg-s9.md` (+ Addendum B 21:43Z, Addendum C 21:53Z) — viết TRƯỚC mọi đo/sửa.
- **Tiếp nối:** R8 (`docs/PHASE9_ROUND115_R8_SEEKPRELOAD_LIMITS.md`), Q8 (`docs/PHASE9_ROUND114_Q8_SEEKPRELOAD_LIMITS.md`).

## 0. Verdict — BỎ cả hai fix, KHÔNG sửa production

| Hạng mục | Kết quả |
|---|---|
| Fix V1 `preload-none` (`el.preload="auto"`→`"none"`) | **BỎ** — FAILED 3/5, tệ hơn control (2/5) |
| Fix V2 `reset-swap` (`removeAttribute("src")` + `load()` trước khi gán blob) | **BỎ** — FAILED 2/5, bằng đúng control (2/5), không cải thiện |
| Bar FIX prereg §2 (treatment FAILED ≤1/5 VÀ SURVIVED ≥3/5) | **KHÔNG ĐẠT** — không biến thể nào đạt (a) |
| Production `apps/web/src/media.ts` | **KHÔNG ĐỔI** (md5 `2c384ed1…` trước/sau). Không có patch production nào được áp; patch thử chỉ tồn tại trong bundle probe (`benchmarks/render/webkit_blob_flaky_116s9_2mib.mjs`, nhánh `S9MATRIX`) |
| B-Q8-1 chạy lại | **KHÔNG CHẠY** — điều kiện vào prereg §4 (bar FIX đạt) không thỏa. Xem §4 cho quan sát post-hoc |
| Bar seek lạnh | **CHỈ ĐỀ XUẤT** (xem §6). Không có dữ liệu F2 mới trong lượt này (không chạy SEEKFAST) |

**Tỉ lệ lỗi pull đầu (FAILED = blob bị bỏ, finalSrc http):**

| | Trước (baseline) | Sau fix |
|---|---|---|
| Control `fresh-element` (baseline S9, tải sạch, boot #49) | **2/5 (40%)** | — |
| V1 `preload-none` | — | **3/5 (60%)** — tệ hơn |
| V2 `reset-swap` | — | **2/5 (40%)** — bằng control |
| Baseline R8 gộp Q8+R8 (để tham chiếu) | 13/23 (57%) lỗi; 14/23 (61%) bị ảnh hưởng | — |
| R8 lượt 2 tải sạch (để tham chiếu) | 5/5 lỗi | — |

**Ý nghĩa sản phẩm (quan trọng):** cả 7 run FAILED đều phát **382–384 frames trên HTTP sau fallback** — fallback blob→HTTP hoạt động 7/7, video không vỡ. Cuộc đua ring-wrap tốn một lần fetch lại qua HTTP, không phá trải nghiệm xem. Đây là lý do verdict BỎ là an toàn: không có fix DOM-level nào hiệu quả, và hậu quả khi race xảy ra đã được fallback che.

## 1. Bảng kết quả leg matrix (15 run, boot #49, tải sạch)

Protocol Q8PAUSED, clip c8 (`~/workspace/round96-x1/clips-faststart/c8.mp4`, 8.182.985 B, 32 s, md5 `98598372`), shim L2 `l2_queue2_probe.so` (md5 `b208e8de`), J2 ring = 4.194.304 B. Matrix xen kẽ 5 vòng × 3 biến thể, chạy 22:20:48–22:33:34Z. Load1 từng run 0,49–1,86 — **tất cả < 3** (xem §7: leg thực tế chạy trên tải sạch dù cổng Addendum B cho phép tới <60).

Phân loại (xem §5 về định nghĩa): **FAILED** = bắt đầu trên blob, kết thúc trên http (blob bị bỏ); **SURVIVED** = kết thúc trên blob + `preloadWaitMs ≥ 19.000` (chờ đủ 20 s trên blob); **STARVE** = blob không chết nhưng 0 frames + rs=0 (mode đói R8) — **0 run trong leg này**.

| run | variant | load1 | failKind | frames | finalSrc | preloadWaitMs | firstPull req_off=0 | wrapPulls | bogusGST | → |
|---|---|---|---|---|---|---|---|---|---|---|
| r1 | fresh-element | 0,52 | ok | 383 | http | 657 | `16f76b79…` | 2/1108 | 1 | FAILED |
| r1 | preload-none | 0,73 | error-event | 384 | http | 20.049 | `16f76b79…` | 2/1108 | 1 | FAILED |
| r1 | reset-swap | 1,82 | ok | 384 | blob | 20.098 | `00000020…` | 0/1112 | 0 | SURVIVED |
| r2 | fresh-element | 1,73 | ok | 384 | blob | 20.065 | `00000020…` | 0/1080 | 0 | SURVIVED |
| r2 | preload-none | 1,17 | ok | 384 | blob | 20.060 | `00000020…` | 0/1080 | 0 | SURVIVED |
| r2 | reset-swap | 0,49 | ok | 384 | blob | 20.079 | `00000020…` | 0/1118 | 0 | SURVIVED |
| r3 | fresh-element | 0,53 | ok | 384 | blob | 20.076 | `00000020…` | 0/1110 | 0 | SURVIVED |
| r3 | preload-none | 0,95 | error-event | 384 | http | 20.052 | `00000020…` | 0/1138 | 0 | FAILED † |
| r3 | reset-swap | 0,81 | ok | 384 | blob | 20.050 | `00000020…` | 0/1112 | 0 | SURVIVED |
| r4 | fresh-element | 1,86 | ok | 384 | http | 726 | `16f76b79…` | 2/1108 | 1 | FAILED |
| r4 | preload-none | 1,17 | ok | 384 | blob | 20.069 | `00000020…` | 0/1080 | 0 | SURVIVED |
| r4 | reset-swap | 0,60 | ok | 383 | http | 826 | `16f76b79…` | 2/1108 | 1 | FAILED |
| r5 | fresh-element | 0,96 | ok | 384 | blob | 20.052 | `00000020…` | 0/1080 | 0 | SURVIVED |
| r5 | preload-none | 0,57 | error-event | 384 | http | 20.044 | `16f76b79…` | 2/1110 | 1 | FAILED |
| r5 | reset-swap | 0,71 | ok | 382 | http | 948 | `16f76b79…` | 2/1108 | 1 | FAILED |

† **preload-none-r3 là ngoại lệ thứ hai của mode lỗi không wrap** (xem §3): firstPull đúng `00000020 66747970`, 0 wrap, 0 bogus — nhưng vẫn error-event + fallback HTTP. Giống ngoại lệ L2 PLAYING r2 của R8.

**Tổng hợp:** fresh-element FAILED 2/5, SURVIVED 3/5; preload-none FAILED 3/5, SURVIVED 2/5; reset-swap FAILED 2/5, SURVIVED 3/5. **STARVE 0/15** — mode đói R8 không tái hiện trong leg này (tất cả run hoặc sống trên blob, hoặc fallback HTTP và phát đủ frames).

**Bảng nhạy cảm theo tải (Addendum B):** nhóm load1 < 3: 15/15 run; nhóm load1 ≥ 3: **0 run (rỗng)** — leg chạy hoàn toàn trên tải sạch nên không có gì để tách. Bar tính trên toàn bộ 15 run hợp lệ (không loại run nào vì tải).

## 2. Chấm bar FIX prereg §2 theo chữ

Bar (phải đạt đủ cả 3 mới GIỮ):
- **(a) Tỉ lệ lỗi pull đầu treatment ≤1/5 (≤20%)** — V1: 3/5 ✗; V2: 2/5 ✗. **KHÔNG ĐẠT.**
- **(b) Pha blob sống ≥20 s ở ≥3/5 run treatment** — V1: 2/5 ✗; V2: 3/5 ✓ (nhưng (a) đã fail).
- **(c) Không hồi quy (tsc 0, vite build pass, media tests pass, test-preview-engine.sh pass, HTTP fallback vẫn chạy)** — **không áp dụng được**: không có cây fix để chạy suite. Ghi rõ: suite KHÔNG chạy trong lượt này vì không có thay đổi production nào; cây byte-identical với trạng thái prereg (md5 đã verify), nên kết quả suite cũ vẫn đứng.

**Kết luận §2: BỎ cả hai fix.** V2 bằng đúng control trên cả hai tiêu chí (2/5 FAILED, 3/5 SURVIVED) — không có bằng chứng nào cho thấy teardown đồng bộ trước swap chạm được vào race. V1 tệ hơn control (3/5 FAILED) — element virgin không giúp; nếu có gì thì việc không preload HTTP làm lỗi xuất hiện MUỘN hơn (xem §5) chứ không ít hơn. Với n=5/arm, chênh lệch 1 run không đủ để kết luận V1 "gây hại" chắc chắn — chỉ kết luận được V1 **không đạt bar** và **không có hướng cải thiện**.

## 3. Cơ chế wrap được xác nhận lại (lần thứ ba)

Dấu vân tay pull đầu (`req_off=0` trả `16f76b79e5248c07…` = byte ở file offset 4.194.304 thay vì `00 00 00 20 66 74 79 70…`):
- **wrap ⟹ fail: 6/6 run** có firstPull wrap đều FAILED (kèm đúng 2 wrap pulls và đúng 1 dòng GST `bogus size 385313657` mỗi run).
- **không wrap ⟹ survive: 8/9 run** (ngoại lệ duy nhất: preload-none-r3, error không wrap — mode thứ hai, hiếm).
- **SURVIVED ⟹ không wrap: 8/8.**

Gộp với R8 (9/9 wrap ⟺ error, 1 ngoại lệ khác): cơ chế R8 **đứng vững qua 3 lượt đo độc lập** (Q8+R8+S9). Cuộc đua xảy ra ở pull đầu tiên, trước khi bất kỳ logic DOM nào của `media.ts` có thể can thiệp — cả hai ý tưởng sửa ở tầng DOM đều không chạm được vào nó. Đây là bằng chứng mạnh nhất cho verdict BỎ: race nằm **dưới tầng DOM** (trong pipeline GStreamer/queue2/urisourcebin), không phải trong code `videoFor`/prefetch của chúng ta.

## 4. B-Q8-1 — KHÔNG chạy lại; quan sát post-hoc nửa PAUSED

**Verdict đăng ký: B-Q8-1 KHÔNG CHẠY LẠI trong lượt này.** Điều kiện vào prereg §4 (bar FIX đạt) không thỏa. Không có lượt PAUSED/PLAYING/SEEKFAST/HTTP nào được chạy thêm ngoài leg matrix Q8PAUSED.

**Quan sát post-hoc (KHÔNG phải verdict đóng bar):** 3 run control sống sót (fresh-element r2/r3/r5, boot #49, tải sạch) thỏa **5/5 điều kiện nửa PAUSED** của bar Q8 §3 (C < 31,5 s; flatness ≤ 0,1 s; T_c ≤ 2 s; im lặng GST ≥ 18 s; 0 progress sau suspend):

| run | C (s) | flat5s (s) | T_c (s) | im lặng GST pha chờ | progress sau suspend |
|---|---|---|---|---|---|
| FE r2 | 17,421 | 0,0 | 0,62 | 19.769 ms | 0 |
| FE r3 | 17,421 | 0,0 | 0,85 | 19.507 ms | 0 |
| FE r5 | 17,421 | 0,0 | 0,81 | 19.596 ms | 0 |

(Trần 17,421 s tái hiện 3/3; `suspend` ở 0,62–0,85 s; `seek_dur` 0,43–0,49 s sau 20 s chờ — đây là seek ấm, KHÔNG phải F2.)

**Vì sao đây KHÔNG đóng được bar:** (a) 3 run được **chọn post-hoc** từ 5 run (2 run còn lại FAILED — bar yêu cầu 3 run LIỀN nhau theo protocol, không chọn lọc run sống sót); (b) **thiếu arm PLAYING** (≥1/2 run đạt full trong 20 s) — matrix chỉ chạy Q8PAUSED; (c) lượt chạy lại đã đăng ký không được kích hoạt. Kết luận đúng: H1 vẫn được hỗ trợ về cơ chế khi blob sống sót; bar B-Q8-1 **vẫn mở**, cần 1 lượt tải sạch đầy đủ (PAUSED gộp 3 + PLAYING) vào đợt sau — nhưng lượt đó chỉ có ý nghĩa nếu race được sửa hoặc nếu chấp nhận chấm bar trên các run sống sót với luật chọn mẫu ghi rõ trước.

## 5. Hai phát hiện về đo lường (cho đợt sau)

### 5.1. `failKind` / `firstErrCode` KHÔNG phân biệt được error-event

- `summarizeLoad` (runner) **bỏ `errEvents` khỏi JSON case** — chỉ giữ `firstErrCode` (= `errEvents[0].code`, **luôn null** vì code error-event blob luôn null, R8 đã ghi) và `failKind`.
- `failKind="ok"` chỉ có nghĩa là `played=true` (frames > 0 và `play()` không reject) — **không** có nghĩa là không có error-event. 4 run FAILED của leg này có `failKind="ok"` (FE r1/r4, RS r4/r5): blob chết sớm (~0,7–0,9 s, `preloadWaitMs` 657–948, `preloadFull=True` trên HTTP), fallback xong **trước khi `play()` được gọi**, nên `play()` thành công ngay lần đầu → `failKind` vẫn "ok".
- **Suy luận fallback phải qua error handler (không qua watchdog):** stall-watchdog 96X3 cần 8 s không tiến triển VÀ `playIntended95W2=1` — trong lúc chờ, probe chưa gọi `play()` nên `playIntended` chưa set, watchdog không thể chạy; fallback xảy ra trong <1 s sau khi gán blob → đường duy nhất còn lại là error handler của pool → **đã có error-event**, chỉ là JSON không lưu lại.
- **Phân loại đúng cho leg này dùng `finalSrc` + `preloadWaitMs`** (classifier `s9_classify.py` đã sửa sau lần chạy đầu — xem §7): run bắt đầu trên blob mà kết thúc trên http = blob bị bỏ. Lần chạy classifier đầu dùng `firstErrCode` đã sai (luôn null) và đã được sửa + chạy lại; output cuối trong `s9-classify-matrix.txt`.
- **Đề xuất cho lượt sau:** giữ `errEvents` (ít nhất là count + thời gian) trong JSON của `summarizeLoad`, để phân biệt error vs starve không cần suy luận. Sửa runner, không sửa production.

### 5.2. Thời gian lỗi khác nhau giữa các biến thể (quan sát, n nhỏ)

- FE/RS FAILED: lỗi **sớm** (fallback <1 s sau blob, trong pha chờ 20 s).
- PN FAILED: lỗi **muộn** (error ở lúc seek/play sau 20 s chờ; `preloadWaitMs` ~20.044–20.052, fallback ở ~30–31 s page-time; `evs` PN-r1: `waiting` 30,32 s → fallback `loadstart` 31,02 s).
- Giải thích có thể: với `preload="none"`, pipeline không kéo blob cho tới khi seek/play buộc nó phải demux → lỗi wrap chỉ lộ ra lúc đó. Chưa chứng minh; ghi làm quan sát. Hệ quả thực tế: V1 không giảm lỗi, chỉ **dời** lỗi từ lúc chờ sang lúc seek — tệ hơn cho UX (lỗi lộ ra đúng lúc user seek).

## 6. Bar seek lạnh — CHỈ ĐỀ XUẤT (không dữ liệu mới)

Không chạy SEEKFAST trong lượt này nên **không có số F2 mới**. Đề xuất giữ nguyên từ prereg (đăng ký trước khi đo):

> Thay bar F2 hiện tại (`seekImmMs ≤ 940 ms` = P2SEEK 440 ms ± 500 ms) bằng bar theo phân phối: **median `seekImmMs` ≤ 1,0 s và p90 ≤ 1,2 s trên ≥6 run SEEKFAST, `seekedOk` 6/6, phát tới cuối clip 6/6.**

Lý do (như prereg): P2SEEK 0,44 s là số warm-element; seek lạnh issue lúc metadata chưa load nên ±500 ms quá chặt. Dữ liệu tham chiếu: F2 gộp 6 lượt median 802 ms, 4/6 ≤ 940 ms (R8). Verdict F2 trong lượt này **không chấm** (không có run SEEKFAST mới).

## 7. Phương pháp, caveat và nhật ký vận hành

- **Prereg trước đo:** `prereg-s9.md` + Addendum B (cổng tải nới: bắt đầu khi load1 < 60 ở 2 mẫu liên tiếp; bar không đổi; ghi load1 từng run; bảng nhạy cảm) + Addendum C (reboot #49, chạy lại toàn leg trên boot mới, OUT cũ dời riêng).
- **Reboot #49 (21:46:46Z)** giết driver + runner giữa run 3 của leg đầu. 2 case boot #48 (fresh-element-r1, preload-none-r1) đã lưu riêng tại `webkit-blob-flaky-116s9-seekpreload-b48partial.json` — **KHÔNG gộp vào bar**. Leg bar tính trên 15 run boot #49.
- **Leg 22:09 fail toàn bộ 15/15** (`page.evaluate: Target page, context or browser has been closed`, GST log 0 byte): GST plugins chưa replay xong sau reboot (WebProcess chết khi load video). Đã smoke-test 1 run Q8PAUSED PASS (GST log 867 KB) rồi chạy lại leg. Leg fail này **không tính** vào bar (lỗi hạ tầng, không phải lỗi blob).
- **BUG cổng driver (tìm ra ~22:19Z):** `pgrep -c` in "0" cả khi không match → `HG="0\n0"` → cổng không bao giờ mở khi hogs=0. Đã sửa (`|| true`), test lại bằng extraction với `bash -x`. Driver #2 mở được vì hogs=56 (pgrep có match). Bug này làm mất ~6 phút, không ảnh hưởng số liệu (leg chạy sau khi sửa).
- **libevent mất sau reboot #49** (~22 phút, do apt replay của hệ thống); driver chờ theo Addendum C (poll 60 s, tối đa 60 phút) rồi tự tiếp tục khi libevent trở lại 22:08:35Z.
- **Cờ cây `round116-tree`:** lúc S9 bắt đầu, S2 giữ EDITING; S2 đã xong và tự lật cờ thành **DONE / NO-CHANGE** (verdict BỎ H2, md5-final `03bf029f…`, finished 21:31:05Z, boot #48). S9 **không ghi đè cờ**, chỉ append dòng NO-CHANGE của mình sau khi xong (xem §10). S9 không chạm production nên không cần xin cờ EDITING.
- **S3 load-break ramp** chạy song song trong lúc chờ (tối đa 56 hog `nice -n 19`); leg matrix thực tế chạy khi hogs=0, load1 0,49–1,86.
- **Sai số phân loại lần đầu (đã sửa, ghi rõ):** classifier v1 dùng `firstErrCode` (luôn null) nên xếp 4 run FAILED thành OTHER?; regex pull thiếu trường `el=0x…` nên `firstPull=None`. Cả hai đã sửa; output cuối `s9-classify-matrix.txt` dùng phân loại `finalSrc` + `preloadWaitMs` (§5.1) và regex đã sửa (đã verify: mọi run đều có firstPull + wrap count).
- **Vì sao control boot #49 (2/5 FAILED) thấp hơn R8 (lượt 2 sạch 5/5, gộp 57%)?** **Chưa giải thích được.** Các yếu tố khác nhau giữa hai lượt: boot khác (#47 vs #49), RAM khả dụng sau reboot #49 cao hơn (1.858 MB theo S10, so với 653–1.632 MB lúc R8), trạng thái replay GST khác. Không có cơ chế nào được chứng minh; n nhỏ (5 vs 5). Ghi là phương sai chưa giải thích, không suy diễn. Gộp control hai lượt tải sạch: 7/10 FAILED.
- **Suite liên quan:** không chạy (không có cây fix; cây byte-identical, md5 đã verify). Nếu đợt sau áp một fix thật, chạy đủ: tsc, vite build (lock v2), media tests (blobPrefetch90R3, retryPlay95W2/96X3, stallWatchdog96X3, captureThumb66T6), `test-preview-engine.sh`.
- **Thời gian:** slot cron 3 h (20:35Z–23:35Z); leg matrix xong 22:33Z; LIMITS + stage xong ~22:55Z. Không đủ thời gian cho A/B production + suite trong lượt này — nhưng verdict BỎ làm việc đó không cần thiết.

## 8. Nợ mở cho đợt sau

1. **Race ring-wrap vẫn mở (nợ #9 đợt 115 chưa đóng).** Hai ý tưởng DOM-level đã thử hết và đều BỎ. Hướng tiếp theo phải nằm **dưới tầng DOM** (pipeline GStreamer/queue2/urisourcebin của WebKit) hoặc chấp nhận fallback làm hành vi chính thức:
   - (a) Điều tra xem ring của queue2 trong urisourcebin của WebKit có cấu hình được không (vd: `ring-buffer-max-size=0` như L2 đã chứng minh tắt splice ở nhóm F? — nhưng đó là probe shim, production không có shim; cần tìm đường cấu hình thật qua WebKit/GStreamer, nếu có).
   - (b) Chấp nhận fallback: fallback đã 7/7 thành công; cân nhắc ghi nhận "blob race → HTTP fallback" là hành vi được thiết kế (đo thêm chi phí: thời gian fallback, băng thông fetch lại) thay vì tiếp tục tìm fix DOM.
   - (c) Giữ `errEvents` trong JSON runner (§5.1) trước khi đo tiếp, để không phải suy luận error-vs-starve.
2. **B-Q8-1 vẫn mở** (§4): cần 1 lượt tải sạch đầy đủ (PAUSED gộp 3 + PLAYING ≥1/2) với luật chọn mẫu đăng ký trước. Chỉ chạy khi race đã sửa, hoặc khi chấp nhận chấm trên run sống sót với luật ghi rõ.
3. **Bar seek lạnh** (§6): đề xuất median ≤1,0 s / p90 ≤1,2 s / ≥6 run — cần lượt sau phê duyệt rồi mới đo theo bar mới.
4. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31 chờ user quyết; `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet chỉ thử lại khi RAM đổi (u2net là fallback chính thức). Xem LIMITS gộp đợt 115 §10.

## 9. File và dữ liệu

- Runner S9: `benchmarks/render/webkit_blob_flaky_116s9_2mib.mjs` (~78 KB — **>37.768 B, cần `ENABLE_PRIVSEP=0` khi push**). Nhánh mới `S9MATRIX` (5 vòng × 3 biến thể xen kẽ, protocol Q8PAUSED, J2=4.194.304); dùng lại runner R8, đổi env `S9_DIR`/`F2_OUT`.
- Analyzer S9: `benchmarks/render/q8_analyze_116s9.py` (copy 115r8, đổi env R8→S9; logic không đổi, giữ fix silence của R8).
- LIMITS này: `docs/PHASE9_ROUND116_S9_SEEKPRELOAD_LIMITS.md`.
- OUT JSON leg bar (15 case, boot #49): `benchmarks/results/webkit-blob-flaky-116s9-seekpreload.json`.
- OUT b48 partial (2 case, boot #48 — KHÔNG gộp bar): `benchmarks/results/webkit-blob-flaky-116s9-seekpreload-b48partial.json`.
- OUT smoke (1 run PASS): `benchmarks/results/webkit-blob-flaky-116s9-smoke.json`.
- Dữ liệu thô + prereg + driver + classifier + log (KHÔNG stage): `hidden_files/round116-s9/` (`prereg-s9.md`, `tree-intent.md`, `s9-progress.md`, `run-s9-matrix.sh`, `run-s9-smoke.sh`, `s9_classify.py`, `s9-classify-matrix.txt`, `s9-analysis-matrix.txt`, `s9-matrix.log`, `gst/`, `pull/`, `bundle/`).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round116-s9-seekpreload.txt` (NUL-delimited; chỉ file text đã đổi/thêm, không binary, không workflow).
