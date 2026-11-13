# PHASE9_ROUND100_B5_ZOMBIE_EARLY_RETURN_LIMITS — quan sát khe early-return ngoài đời

> Luồng B5, đợt 100. Lượt cron 03:35 +07 13/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **Không sửa production** — chỉ probe (`probe100b5-frame-parity.mjs`) + analyze (`round100-b5-analyze.py`).
> Nợ: LIMITS gộp đợt 99 §4 mục 6 (khe early-return ngoài đời chưa quan sát được).
> Boot id lúc bắt đầu: `66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd`. Chốt chặn: không có `round-in-progress.md` lúc bắt đầu.

## 0. Tóm tắt verdict

**KHÔNG quan sát được khe early-return ngoài đời.** 4 lượt đường bình thường (kill BẬT + check BẬT), 12 clip/lượt → **24 biên blur→noblur mới, 0 capture tiền-seek (frameIdx ≥ 85) rơi vào cửa sổ clip kế, 0 lần `skip-clip-inactive` bắn, zombie Δ = 0/0/0/0/0/0 ở mọi lượt.** Cộng với A6 (9 biên) + Z6 (4 biên): **tổng 37 biên đường bình thường, 0 ca.**

**Đối chứng dương (R5, kill TẮT + check BẬT) chứng minh thiết bị đo đủ nhạy:** `skip-clip-inactive` bắn **6/6 biên** (1/biên, frameIdx 0, 1, 0, 1, 0, 5 — toàn frame post-seek của clip kế), fb `clip-inactive` ×6, zombie Δ vẫn 0 (so với A6 ctrl kill TẮT + check TẮT: zombie +25, 22 capture post-seek). Nghĩa là: khi kill bị trễ/mất, check bắt được ngay; ở đường bình thường kill không trễ tới mức đó trong 37 biên đã đo.

**Đường kill-miss thực tế đã được tập luyện mà vẫn 0 ca:** tick bỏ vẽ do seeking (N3, `__vcutSeekSkipRenderTicks86N3`) tăng 2–6 tick/cửa sổ clip ở R4/R5 (tổng 37 tick trong lúc phát mỗi lượt) — tức renderFrame đã bị skip nhiều lần trong lúc phát (owner-note trong `drawVideoClip` không chạy ở các tick đó) — nhưng không một lần nào trùng đúng tick vượt biên + có callback rVFC bắn trong cửa sổ 1 tick đó. Khe tồn tại trên lý thuyết (xem §1) nhưng tần suất ngoài đời dưới ngưỡng đo này (< 1/37 biên; khoảng tin cậy 95% theo rule-of-three: < ~8%).

## 1. Cơ chế khe — đọc lại code trước khi đo (bổ sung A6 §1)

- Playhead tăng ở **đầu** `tickInner` (trước `syncMedia`); `syncMedia` chạy sau đó trong cùng tick, nhánh playing.
- Owner-kill (Z6) KHÔNG nằm trong `syncMedia`: `rvfcNoteVideoElementOwner` được gọi trong **`drawVideoClip`**, mà `drawVideoClip` chạy qua `renderFrame` — và `renderFrame` **bị bỏ qua cả tick khi `skipRenderSeeking` = true** (N3: clip xuôi đang seeking thì không vẽ, tránh làm seek chậm 3–11×). Vì vậy đường kill-miss thực tế nhất ngoài đời là: **tick vượt biên đúng lúc element clip kế đang seeking** → tick đó không vẽ → owner-note không bắn → pump cũ sống thêm tới tick vẽ được đầu tiên của clip mới. Cửa sổ khe = 1 tick (tới tick sau, trừ khi seek kéo dài nhiều tick dưới tải).
- Các early-return trong `tickInner` trước `syncMedia` chỉ còn `!canvas || !wrap` và `!ctx` (cả hai gần như không xảy ra sau boot; vòng lặp đã kín đường `!ctx` từ đợt 50 F2) và exception giữa lúc tăng playhead và `syncMedia` (bọc try/catch của `loop`, đếm vào `tickErr`).
- Bằng chứng đo: `tickErr` = 0 ở mọi mẫu state100 của cả 5 lượt; `playing+sleeping` = 0 mẫu (vòng lặp không ngủ trong lúc phát); seek-skip tick thì nhiều (R4/R5: 37 tick/lượt) nhưng không trùng biên theo cách gây ra straggler.

## 2. Đo (probe100b5, Chromium, scroll-mixed-alt, 12 clip × 3 s: chẵn blur / lẻ không blur → 6 biên blur→noblur/lượt)

| Lượt | Điều kiện | Load lúc phát | RAM khả dụng | caps / pumpN | state100 (n mẫu) | Zombie Δ (6 biên) | Capture trong cửa sổ clip lẻ (post <45 / pre ≥85) | `skip-clip-inactive` | fb |
|---|---|---|---|---|---|---|---|---|---|
| R1 chr-mixedalt-b5n1 | thường | 1,32 | 1582 MB | 511 / 259 | 383 | 0/0/0/0/0/0 | 0 / 0 (cả 6 cửa sổ) | 0 | clip-change ×6 |
| R2 chr-mixedalt-b5n2 | thường, tải nền cao (chờ yên hết 120 s) | 5,98 | 1891 MB | 213 / 86 | 236 | 0×6 | 0 / 0 | 0 | clip-change ×6 |
| R3 chr-mixedalt-b5s1 | `--stall 1600` (chặn main thread ở tick đầu clip 0/1) | 13,98 | 2695 MB | 108 / 35 | 154 | 0×6 | 0 / 0 | 0 | clip-change ×5 + no-callback ×1 (c0, xem §4) |
| R4 chr-mixedalt-b5l1 | `--sysload 2` (2 CPU hog trong lúc phát) | 1,91 (+2 hog) | 2386 MB | 99 / 37 | 129 | 0×6 | 0 / 0 | 0 | clip-change ×6 |
| R5 chr-mixedalt-b5c1 | **đối chứng dương** `--disable-owner-kill` (check BẬT) | 10,24 | 2427 MB | 272 / 125 | 234 | 0×6 | 0 / 0 | **6** (1/biên) | **clip-inactive ×6** |

- Build đo: R1 chạy trên build md5 `2efb80d3` (xem §4 về sửa giữa lượt); R2–R5 trên build md5 `94ee64c0`. Marker "Đợt 99 A6" ×5 còn nguyên ở cả hai build; cơ chế pump/kill không đổi giữa hai build theo kiểm tra marker + mẫu fb.
- `pageErrs` = 0 ở cả 5 lượt. Playhead chạy ~0,45–0,76× wall dưới tải (timeline 36 s kéo dài 72–85 s wall).
- Pixel parity (tâm dải theo tỉ lệ gStd, baseline noblur W3): clip lẻ (không blur) C 89–100% ở mọi lượt (R1: 94–100%); clip chẵn A chiếm đa số khi lượt dày (R1: A 50–74%); `out` = 0 ở mọi clip, mọi lượt. Không hồi quy pixel. Tỉ lệ D/B dao động theo mật độ capture (n nhỏ ở lượt thưa dưới tải) — tâm dải mới là bằng chứng parity, như A6 §3.
- dbgFinal lastFrame: 89/89/89 ở lượt dày (R1: 89, 89, 89, 89, 89, 85; R5: 89 ×6); lượt thưa dưới tải có lastFrame < 89 (R4 c0 = 48, n=1 capture) — nhiễu mật độ, không phải check (check chỉ bắn sau biên), như A6 §2.

### Chi tiết từng biên (đường bình thường R1–R4, 24 biên)

Tất cả 24 biên giống nhau: zombie Δ = 0, 0 capture trong cửa sổ clip lẻ (cả post-seek lẫn pre-seek), `skip-clip-inactive` = 0. Chi tiết từng biên xem file analyze trong `hidden_files/round100-b5/analysis-b5n1.txt`, `analysis-b5n2.txt`, `analysis-b5s1.txt`, `analysis-b5l1.txt`.

### Đối chứng dương R5 (6 biên, kill TẮT + check BẬT)

| Biên | `skip-clip-inactive` (relPlayMs / frameIdx / seq) | Độ trễ kill trực tiếp (skip event − b_k nội suy) | fb |
|---|---|---|---|
| c0→c1 | 3901 / 3 / 18 | 37 ms | clip-inactive |
| c2→c3 | 10301 / 1 / 44 | 125 ms | clip-inactive |
| c4→c5 | 16723 / 0 / 67 | 1 ms | clip-inactive |
| c6→c7 | 23421 / 1 / 88 | 36 ms | clip-inactive |
| c8→c9 | 29806 / 0 / 112 | 9 ms | clip-inactive |
| c10→c11 | 36617 / 5 / 124 | 110 ms | clip-inactive |

- Không có capture tiền-seek nào (frameIdx ≥ 85) trong cửa sổ clip lẻ ngay cả khi kill tắt: các callback bắn sau biên đều mang frame post-seek (0–5) và bị check chặn trước khi capture. So với A6 check-run (3/3 biên, frameIdx 6, 84, **89**): lần này không bắt được mẫu tiền-seek nào — mẫu 89 của A6 vẫn là lần duy nhất quan sát được straggler tiền-seek, và chỉ xuất hiện khi kill bị tắt.
- (5b) đo trực tiếp từ pump event (timestamp `tInvoke`) lần đầu cho số đo kill-latency không qua sampler: 1–125 ms.

## 3. Cải thiện độ trễ kill âm (nhiệm vụ 3) — kết quả + giới hạn đo còn lại

Thay đổi probe (không đụng production):
1. **state100 100 ms → 25 ms**, cap 1200 → 20000, xoá mẫu tiền-phát lúc bấm play.
2. **b_k nội suy** tuyến tính giữa 2 mẫu state100 kề biên (ph vs relPlay).
3. **Độ trễ kill trực tiếp từ pump event**: event `skip-inactive`/`skip-clip-inactive` đầu tiên sau biên (timestamp `tInvoke` trực tiếp) − b_k nội suy — không qua sampler fbAt.

Kết quả:
- Độ trễ kill đường bình thường (fbAt − b_k nội suy): R1 0/0/−72/0/+38/+40 ms; R2 +117/0/−83/+126/+475/+136 ms; R3 −3109(c0, xem §4)/+205/+96/+130/+150/+77 ms; R4 +60/+37/+98/+10/+188/+49 ms. Giá trị âm còn lại (−72, −83) là **lượng tử đo**, không phải kill sớm: fbAt (sampler rAF+10 ms) và state100 (interval riêng) chạy trên 2 timer độc lập, nên chênh < 100 ms là nhiễu pha giữa 2 sampler.
- **Giới hạn còn lại (trung thực): interval 25 ms KHÔNG đạt cadence 25 ms dưới tải.** Gap thực giữa các mẫu state100: median 28–486 ms, max 95–775 ms quanh biên (R4 chỉ 129 mẫu cho ~74 s phát; R1: 383 mẫu). Nguyên nhân: sampler `setInterval` chạy cùng main thread đang đói — tăng tần suất không giúp khi chính main thread là nút cổ chai. Vì vậy b_k nội suy chỉ thu hẹp ước lượng khi bracket gap nhỏ; khi gap lớn (R2 c8: bracket ~470 ms → khoảng trễ kill [3, ~475] ms) thì nội suy tuyến tính không đáng tin — playhead tiến theo cụm tick (burst), không tuyến tính trong gap dài. Con số đáng tin nhất hiện tại: **kill rơi vào khoảng 0–~200 ms sau biên thật ở đường bình thường** (1 tick + 1 frame video), với độ bất định bằng đúng gap sampler quanh biên đó.
- Đo trực tiếp từ pump event chỉ khả thi khi có callback sau kill (đường đối chứng: 1–125 ms). Ở đường bình thường pump chết qua owner-kill mà không có callback nào bắn sau đó (không có event `skip-inactive` nào ở R1–R4) nên không có timestamp trực tiếp — muốn đo chính xác hơn cần ghi timestamp tại điểm kill trong production (xem nợ mục 2, §5).

## 4. Dị thường đã ghi (không giấu)

1. **R1 `mtimeChanged=true`:** một luồng đợt 100 khác sửa `preview.tsx` giữa lượt (md5 `2efb80d3` → `ca9ea4bb` lúc 20:44:55Z, trong lúc phát). Vite dev đã load module từ trước nên lượt R1 vẫn đo trên build cũ `2efb80d3`; marker A6 ×5 còn nguyên sau sửa; R2–R5 chạy trên build `94ee64c0` (lại sửa tiếp giữa R1 và R2). Va chạm song song này không làm mất dữ liệu nhưng khiến build đo không đồng nhất giữa các lượt — đã ghi md5 từng lượt vào analyze.
2. **R3 c0: `lastFrame=90`, fb=`no-callback`, fbAt sớm hơn b_k tới 3175 ms.** Stall 1600 ms ở relPlay 2701 (ngay đầu clip 0) chặn main thread trong khi element vẫn phát trên media thread tới mediaTime 3,0 (frame 90, vượt `out`=3,0); pump capture đúng 1 frame (frame 90, trước biên) rồi chết vì không còn callback (`no-callback`) trước cả khi biên tới (b1=7786). Không phải straggler: 0 capture trong cửa sổ c1. Đây là bằng chứng stall giết pump bằng stale trước cả biên.
3. **Stall clip 1 không bắn (R3):** `stallBlocks` chỉ có clip 0 (relPlay 2701); watcher clip 1 không đủ điều kiện `tickLen > tickAtEntry` dưới tải cực nặng (load1 13,98) nên stall ở biên c0→c1 như thiết kế đã không xảy ra. R3 vì vậy chỉ là một lượt tải nặng nữa, không phải "stall đúng biên". Muốn stall đúng biên cần trigger theo playhead (≥ 2,9 s) thay vì theo clip-entry — chưa làm (xem nợ §5).
4. **Chờ yên hết 120 s ở R2/R3/R5** (load1 6–14 lúc phát, do 10 luồng đợt 100 chạy song song + hog của R4 còn sót? Không — hog R4 đã kill sạch, kiểm tra `ps` = 0 sau R4; tải cao là do các luồng song song). Các lượt vẫn phát và cho kết quả hợp lệ, nhưng mật độ capture thấp (caps 99–213 so với 511 ở R1) — đây cũng chính là điều kiện tải nặng mà nhiệm vụ yêu cầu.
5. **R4 c0 caps=1, lastFrame=48:** pump gần như không capture được gì ở clip đầu dưới sysload (element/callback đói CPU), nhưng fb vẫn `clip-change` (owner-kill chạy đúng).

## 5. Tàn dư + nợ còn lại

1. **Khe early-return ngoài đời: CHƯA quan sát được sau 37 biên đường bình thường (0 ca).** Đây là bằng chứng âm tính có độ nhạy đã chứng minh (đối chứng dương 6/6), không phải "không đo được". Không cần probe thêm theo cùng mẫu trừ khi có cách ép tick vượt biên early-return trực tiếp (xem mục 3).
2. **Cách ép khe trực tiếp chưa có:** stall theo clip-entry không bắn đúng biên (R3); các early-return `!canvas/!wrap/!ctx` không ép được từ probe; exception giữa tăng playhead và `syncMedia` không có hook fault-injection (chỉ có 2 hook A6 cho kill/check). Đề xuất cho đợt sau (không làm trong luồng này): (a) trigger stall theo playhead (≥ 2,9 s, 1 lần/biên) để chặn đúng tick vượt biên; (b) hook test ép `skipRenderSeeking` ở đúng tick biên (seek giả của element clip kế) — mô phỏng kill-miss qua đường N3 mà không cần tải thật; (c) ghi timestamp trực tiếp tại điểm kill trong production (owner-note + clip-inactive kill) để đo độ trễ kill không qua sampler.
3. **Độ trễ kill vẫn có độ bất định bằng gap sampler** (tới ~775 ms dưới tải nặng). Nội suy tuyến tính chỉ là cải thiện một phần; đo chính xác hơn cần timestamp tại kill (mục 2c) hoặc sampler ngoài main thread (Worker) — cả hai đều ngoài phạm vi luồng này.
4. **Hook test A6 giữ nguyên** (`__vcut99a6DisableOwnerKill` / `__vcut99a6DisableClipActiveCheck`, mặc định tắt); probe100b5 dùng chúng cho đối chứng dương.
5. **Không đụng:** TTS 39, birefnet, `.github/workflows/*`, cloud/collab, nhạc bản quyền, production code (0 file production đổi trong luồng này).

## 6. Kiểm chứng + batch đã stage (KHÔNG push)

- Harness mới: `apps/web/scripts/probe100b5-frame-parity.mjs` (copy probe99a6 + state100 25 ms/cap 20000/xoá mẫu tiền-phát + `--sysload N` + ghi `seekSkip` vào state100; `node --check` PASS; đã sửa 1 lỗi tự bắt: comment `//` trong chuỗi evalJs làm mất lệnh togglePlay — sửa trước khi chạy lượt nào).
- Analyze mới: `hidden_files/round100-b5-analyze.py` (copy A6 + b_k nội suy + (5b) kill latency trực tiếp từ pump event + (2b) độ thưa sampler + (2c) sleeping/tickErr + (2d) seekSkip theo cửa sổ; đã sửa 2 lỗi `UnboundLocalError` — `pump`/`end_rel` dùng trước khi gán — trong lúc chạy).
- Dữ liệu thô: `hidden_files/round100-b5/` — 5 thư mục lượt (`chr-mixedalt-b5n1/n2/s1/l1/c1`, mỗi thư mục `frame-parity-results.json` + `frame-parity-log.txt`) + 5 file `analysis-b5*.txt` + log luồng `round100-b5.md`.
- Hồi quy: pixel parity đứng ở cả 5 lượt (clip lẻ C 89–100%, `out` = 0, xem §2); `pageErrs` = 0/5 lượt. Không sửa production nên không có suite nào quy cho B5; snapshot nhanh trên cây hiện tại: `tsc --noEmit` **0 lỗi** (chạy nền trong lúc viết LIMITS, xong sau các lượt probe).
- Batch stage: `phase9-round100-b5-zombie.txt` — **2 entry** (chỉ file text trong cây repo, read-back OK, 0 binary, 0 workflow):
  - `apps/web/scripts/probe100b5-frame-parity.mjs`
  - `docs/PHASE9_ROUND100_B5_ZOMBIE_EARLY_RETURN_LIMITS.md` (file này)
- Ngoài repo, lưu tại `~/workspace/goals/capcut-clone-video-editor/hidden_files/` (không đưa vào batch push của repo theo quy ước paths-loop): `round100-b5-analyze.py`, `round100-b5.md`, thư mục dữ liệu `round100-b5/`.
