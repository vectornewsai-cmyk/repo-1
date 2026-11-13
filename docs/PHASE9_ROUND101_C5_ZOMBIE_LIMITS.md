# PHASE9_ROUND101_C5_ZOMBIE_LIMITS — khe early-return: QUAN SÁT ĐƯỢC ngoài đời qua đường seek

> Luồng C5, đợt 101. Lượt cron 06:35 +07 13/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> Nợ: LIMITS gộp đợt 100 §4 mục 7 (khe early-return ngoài đời chưa quan sát được — 37 biên, 0 ca; đối chứng dương B5 6/6).
> Boot lúc bắt đầu: `aa3f2b67-7aa9-497a-bc8c-6c2973417b10`; **reboot #25 lúc 23:51:21Z** (boot `aa3f2b67` → `3a12a7d3-4230-4835-800b-5f34e015c7eb`) giết driver giữa R2 — chạy tiếp R2–R6 sau reboot. Chốt chặn: không có `round-in-progress.md` lúc bắt đầu.
> **Không sửa production** — chỉ probe (`probe101c5-frame-parity.mjs`) + analyze (`round101-c5-analyze.py`).

## 0. Tóm tắt verdict — ĐỀ XUẤT ĐÓNG NỢ, GIỮ CODE PHÒNG THỦ

**Khe kill-miss/early-return ĐÃ QUAN SÁT ĐƯỢC ngoài đời — qua đường seek (nhảy playhead qua biên), không qua phát tick-by-tick.**

- 5 lượt đường bình thường (kill BẬT + check BẬT) × 24 clip = **60 biên blur→noblur mới**:
  - Phát tick-by-tick (R1 thường, R2 `--sysload 2`, R4 `--pause-burst`): **36 biên, check A6 bắn 0 lần**, zombie Δ = 0, 0 capture post-seek.
  - Seek-across (R3 `--seek-across`, R5 `--seek-across --sysload 2`): **24 biên, check A6 bắn 24/24 (1/biên)**, frameIdx 67–89 (tiền-seek, gồm 85/86/89), fb toàn bộ 24 pump = `'clip-inactive'` (check kill, không phải owner-kill); zombie Δ = 0, 0 capture post-seek — check là thứ duy nhất kill pump cũ sau cú seek, trước khi nó kịp capture zombie.
- Cộng dồn với các đợt trước: **94 biên đường bình thường** (70 phát tick-by-tick — 36 C5 + 24 B5 + 6 A6 base/final + 4 Z6 — 0 lần check bắn; 24 seek-across — 24 lần check bắn). Lưu ý cách đếm: B5 ghi "37 biên" (24 B5 + 9 A6 + 4 Z6) nhưng 9 biên A6 gồm 3 biên của lượt check (kill TẮT — fault-injection); đếm chặt đường bình thường từ A6 là 6 biên, nên tổng chặt là 94, không phải 97.
- **Đối chứng dương trên build mới (c5c3, 12 clip, kill TẮT + check BẬT, build `a6e34691`): check bắn 6/6 biên**, frameIdx 0–1 (post-seek — chữ ký khác với seek-across, xem §1), fb `'clip-inactive'` ×6, lastFrame 89 ×6, zombie Δ = 0. Thiết bị đo vẫn đủ nhạy trên build hiện tại.
- **Độ trễ kill trực tiếp (skip − timestamp cú seek, không qua sampler): 23–31 ms (R3, yên), 47–123 ms (R5, sysload)** — check bắn ở callback rVFC đầu tiên sau cú nhảy, ~1 frame (yên) / ~2–4 frame (tải).
- **Đề xuất: ĐÓNG nợ "khe chưa quan sát được"** (nay đã quan sát được + đo được tần suất theo điều kiện: 100% khi seek qua biên, 0% khi phát thường). **GIỮ nguyên code phòng thủ** (check A6 + hook test): check đã chứng minh giá trị ngoài đời thật (24 ca thật + 6 ca đối chứng); xóa nó sẽ mở lại đúng cửa sổ vừa đo được. KHÔNG tự ý xóa code — chỉ đề xuất, theo đúng lệnh luồng.
- **Nợ mới (xem §5):** stale first-frame của pump MỚI sau seek (2 ca, tự sửa bằng reset-capture); nguyên nhân navigation giết 2 lượt đối chứng 24-clip chưa xác định; driver ghi exit sai (đã biết cơ chế, đã sửa mẫu).

## 1. Cơ chế — vì sao seek-across ép được khe mà phát thường không

### 1.1 Đọc lại cơ chế (B5 §1, A6 §1)

- Playhead tăng ở đầu `tickInner`; `syncMedia` + `drawVideoClip` chạy sau trong cùng tick. Owner-kill (Z6) nằm trong `drawVideoClip` (qua `rvfcNoteVideoElementOwner`); `drawVideoClip` chạy qua `renderFrame`, và `renderFrame` bị bỏ cả tick khi `skipRenderSeeking` = true (N3: clip xuôi đang seeking thì không vẽ).
- Check A6 trong `rvfcCallback`: nếu playhead (store) đã ra khỏi `[clipStart, clipStart+clipDuration)` thì kill pump ngay (`skip-clip-inactive`), không chờ kill draw-path.
- Trong phát tick-by-tick, khe chỉ mở khi tick vượt biên đúng lúc không chạy `syncMedia`/`draw` (early-return/idle/seek-skip) VÀ có callback rVFC của pump cũ bắn trong cửa sổ đó. B5 đã đo 37 biên không gặp; C5 thêm 36 biên nữa không gặp (tổng 70).

### 1.2 Vì sao seek-across mở khe 24/24

- Cú seek nhảy playhead từ `b−1,0` sang `b+0,15` **giữa hai tick** (driver gọi `setPlayhead` từ ngoài). Ngay sau cú nhảy, playhead đã ở ngoài cửa sổ clip cũ, nhưng chưa có tick nào chạy `syncMedia`/`draw` cho clip mới — owner-kill chưa có cơ hội chạy. Callback rVFC của pump cũ (đã đăng ký từ trước, đang chờ frame kế) bắn trong khoảng trống này → check đọc playhead đã qua biên → kill ngay (`skip-clip-inactive`).
- Khác với fault-injection A6/B5 (tắt kill rồi mới thấy check bắn): đây là **hành vi người dùng thật** (click timeline qua một cut / seek nhanh) — không tắt gì cả, kill BẬT, check BẬT.
- Chữ ký frameIdx phân biệt hai đường kích hoạt check:
  - **Seek-across (R3/R5): frameIdx 67–89** — element cũ chưa seek xong (ct 2,2–2,97), callback mang frame tiền-seek của clip cũ. Check bắn 23–31 ms sau cú nhảy (R3) — tức ở callback đầu tiên sau nhảy.
  - **Đối chứng kill-tắt (c5c3, phát thường): frameIdx 0–1** — pump cũ sống qua biên, element mới đã seek về 0, callback mang frame post-seek của clip kế. Check bắn ở biên +5…+15 ms (fbAt − b_k).
  - Cả hai đều là cùng một check, bắt cùng một lớp sự kiện: "callback bắn khi playhead đã ra khỏi cửa sổ clip mà kill draw-path chưa chạy".
- Pause-burst KHÔNG mở khe (R4, 0/12): pause/resume dồn dập ngay trước biên không tạo cửa sổ callback-trước-kill — sau resume, tick chạy `syncMedia`/`draw` bình thường rồi mới tới biên; owner-kill vẫn bắn trước (fb `'clip-change'` ×12). Bằng chứng âm tính có giá trị: không phải mọi nhiễu loạn quanh biên đều mở khe.
- SeekSkip (N3) vẫn hoạt động mạnh trong các lượt seek-across: R3 delta 2–6 tick/cửa sổ clip (tổng 82 tick), R5 tương tự — đường kill-miss qua skip-render vẫn là nền, nhưng bằng chứng trực tiếp ở đây là cửa sổ giữa cú nhảy và tick kế (check bắn trước cả tick đó), không cần chứng minh tick nào bị skip.

### 1.3 Hai ca "capture trong cửa sổ clip lẻ" — đã xác minh KHÔNG phải zombie

Cả hai đều là **stale first-frame của pump MỚI** (clip kế), không phải zombie của pump cũ — và cả hai tự sửa bằng `reset-capture`:

| Ca | Lượt | Sự kiện | Bằng chứng phân biệt |
|---|---|---|---|
| R3 seq 63 | seek-across | capture frameIdx 73, mediaTime 2,4333, relPlayMs 26416, trong cửa sổ c9 [24119, 26499) | `presentedFrames` 369 (nhảy từ 335 của pump c8) → element khác; 105 ms sau `reset-capture` frameIdx 10, mediaTime 0,3333 (seq 64, cùng pump, presentedFrames 370); ring c10 lastFrame 69 — frame cũ không ở lại trong ring |
| R4 seq 65 | pause-burst | capture frameIdx 89, mediaTime 2,9667, relPlayMs 18422, trong cửa sổ c3 [14197, 18626) | `presentedFrames` 228 (nhảy từ 176 của pump c2 seq 62–64 — pump c2 đã chết đúng lúc, fb `'clip-change'`, lastFrame 89); 369 ms sau `reset-capture` frameIdx 5, mediaTime 0,1667 (seq 66); capture nằm 34 ms SAU b4 nội suy (18388) nhưng 204 ms TRƯỚC b4 quan sát được (18626) → gán nhầm cửa sổ do lượng tử sampler (đúng caveat A6 §3) |

- Cơ chế chung: pump mới được tạo trên pooled element vẫn giữ `currentTime` cũ (2,43 / 2,97) từ lần dùng trước; callback đầu tiên bắn trước khi seek về in-point đáp → capture 1 frame cũ; khi seek đáp, pump reset ring và capture đúng frame. Frame cũ không tồn tại trong ring sau reset (lastFrame c10 = 69, c4 = 89 là frame thật cuối clip — c4 chơi tới frame 89 hợp lệ sau reset).
- Chưa rõ frame cũ có kịp vẽ lên canvas trong ~105–369 ms đó không (cùng file stripes cho mọi clip nên pixel parity không phân biệt được) — xem nợ §5 mục 3.

## 2. Đo (probe101c5, Chromium, scroll-mixed-alt, 24 clip × 3 s: chẵn blur / lẻ không blur → 12 biên blur→noblur/lượt; đối chứng 12 clip)

| Lượt | Điều kiện | Load lúc phát | RAM khả dụng | caps / pumpN | state100 (n mẫu) | Zombie Δ (12 biên) | Capture trong cửa sổ clip lẻ (post <45 / pre ≥85) | `skip-clip-inactive` | fb |
|---|---|---|---|---|---|---|---|---|---|
| R1 chr-mixedalt-c5n1 | thường (chờ yên hết 120 s, load 4,84) | 4,84 | 1534 MB | 1192 / 539 | 921 | 0×12 | 0 / 0 | 0 | clip-change ×12 |
| R2 chr-mixedalt-c5l1 | `--sysload 2` | 10,11 | 1697 MB | 409 / 177 | 391 | 0×12 | 0 / 0 | 0 | clip-change ×12 |
| R3 chr-mixedalt-c5x1 | `--seek-across` (23/23 cú nhảy) | 1,98 | 2417 MB | 496 / 236 | 460 | 0×12 | 0 / 0 (+1 stale new-pump, xem §1.3) | **12** (1/biên) | **clip-inactive ×12** |
| R4 chr-mixedalt-c5p1 | `--pause-burst` (23/23 burst) | 0,54 | 2644 MB | 599 / 331 | 978 | 0×12 | 0 / 0 (+1 stale new-pump, xem §1.3) | 0 | clip-change ×12 |
| R5 chr-mixedalt-c5xl1 | `--seek-across --sysload 2` (23/23 cú nhảy) | 4,96 | 2611 MB | 287 / 141 | 294 | 0×12 | 0 / 0 | **12** (1/biên) | **clip-inactive ×12** |
| R6c chr-mixedalt-c5c3 | **đối chứng dương** `--disable-owner-kill`, 12 clip | 1,03 | 1762 MB | 998 / 485 | 999 | 0×6 | 0 / 0 | **6** (1/biên) | **clip-inactive ×6** |

- Build đo: R1–R5 trên build md5 `94ee64c0` (giống B5 R2–R5); R6c trên build md5 `a6e34691` (sibling sửa `preview.tsx` + `playheadHold90R2.ts` lúc 00:07:56Z giữa R5 — xem §4). Marker "Đợt 99 A6" ×5 còn nguyên ở cả hai build; hook test A6 còn nguyên.
- `pageErrs` = 0 ở cả 6 lượt hoàn thành. `playing+sleeping` = 0 mẫu, `tickErr` = 0 ở mọi lượt (state100).
- Pixel parity (tâm dải theo tỉ lệ gStd, baseline noblur W3 — chỉ báo cáo tỉ lệ C/A, xem analyze): clip lẻ (không blur) C 83–100% ở mọi lượt (R1: 98–100%; R3: 88–97%; R5: 83–100%); clip chẵn A chiếm đa số khi lượt dày; `out` = 0 ở mọi clip, mọi lượt. Không hồi quy pixel. (Tâm dải chi tiết xem file analyze; tỉ lệ D/B dao động theo mật độ capture như A6/B5 đã ghi.)

### Chi tiết 24 ca check bắn ở lượt seek-across (R3 + R5)

Độ trễ kill trực tiếp = timestamp skip − timestamp cú seek của driver (không qua sampler state100/fbAt):

| Biên | R3: frameIdx / trễ (ms) | R5: frameIdx / trễ (ms) |
|---|---|---|
| c0→c1 | 74 / 23 | 86 / 61 |
| c2→c3 | 83 / 31 | 80 / 81 |
| c4→c5 | 72 / 28 | 83 / 57 |
| c6→c7 | 77 / 25 | 78 / 57 |
| c8→c9 | 71 / 25 | 80 / 47 |
| c10→c11 | 72 / 26 | 83 / 54 |
| c12→c13 | 69 / 28 | 85 / 60 |
| c14→c15 | 74 / 26 | 71 / 60 |
| c16→c17 | 67 / 24 | 68 / 59 |
| c18→c19 | 80 / 28 | 83 / 60 |
| c20→c21 | 73 / 25 | **89** / 123 |
| c22→c23 | 67 / 29 | 79 / 65 |

- R3: trễ 23–31 ms (đều ~1 frame sau cú nhảy). R5: 47–123 ms (sysload làm callback thưa; ca c20→c21 = 123 ms là max).
- Đối chiếu với độ trễ qua sampler (skip − b_k nội suy): R3 −89…+27 ms, R5 −268…+95 ms — giá trị âm là lượng tử sampler (b_k nội suy từ mẫu state100 kẹp cú nhảy, không phải kill sớm); số đo trực tiếp skip − cú nhảy mới là số đáng tin.
- Đối chứng c5c3 (kill TẮT): 6 ca, frameIdx 0/1/0/0/0/0, fbAt − b_k = +6/+14/+5/−16/+13/−3 ms — check bắn ngay sau biên, trước khi pump kịp capture zombie (zombie Δ = 0, 0 capture post-seek trong mọi cửa sổ lẻ — giống B5 R5 6/6 và A6 check 3/3).

### Đường chạy thường không đổi (R1/R2/R4 vs B5)

- Zombie Δ = 0 ở mọi biên đo được (chỉ đo được ở clip chẵn có pump; clip lẻ không có pump nên Δ = None — như B5).
- Check không bắn lần nào ở R1/R2/R4 (owner-kill bắn trước, fb `'clip-change'`); lastFrame 89 ở đa số clip chẵn dày (R1: 89 ×10/12, 88 ×1; R4: c2 lastFrame 89, fb `'clip-change'`).
- R2 thưa dưới tải (caps 409, state100 391 mẫu) nhưng fb vẫn `'clip-change'` ×12 — owner-kill chạy đúng cả khi callback đói CPU.

## 3. Cải thiện đo độ trễ kill (nhiệm vụ phụ, kế thừa B5 §3)

B5 §5 mục 2c đề xuất "ghi timestamp trực tiếp tại điểm kill trong production" — C5 làm được một nửa bằng timestamp driver: cú seek do driver phát ra có timestamp wall chính xác, và skip event có `tInvoke` trực tiếp → **skip − cú seek = độ trễ kill không qua sampler** (23–31 ms yên, 47–123 ms tải). Đây là số đo trực tiếp đầu tiên cho đường kill-miss thật (B5 chỉ đo được đường đối chứng 1–125 ms; đường thường không có event để đo).
- Giới hạn còn lại (trung thực): số này đo độ trễ của **check** (skip-clip-inactive), không phải của owner-kill — owner-kill ở đường thường vẫn không có timestamp trực tiếp (không có event nào bắn khi nó chạy). Muốn đo owner-kill trực tiếp vẫn cần ghi timestamp tại điểm kill trong production (B5 §5 mục 2c, chưa làm).

## 4. Dị thường đã ghi (không giấu)

1. **Reboot #25 lúc 23:51:21Z** (boot `aa3f2b67` → `3a12a7d3`, `uptime -s`): giết driver giữa R2 (đang chờ yên, chưa có results). R1 đã xong trước reboot. Chạy tiếp R2–R6 bằng `round101-c5-run2.sh`. Không mất dữ liệu R1.
2. **R6 đối chứng chết 2 lần liên tiếp (c5c1, c5c2 — 24 clip):** cùng lỗi `page.evaluate: Execution context was destroyed, most likely because of a navigation` lúc lấy kết quả (00:11:16Z và 00:25:46Z), có `frame-parity-error.txt`, không có `results.json`. **Không có file nào sửa trong cửa sổ lỗi của c5c2** (find mtime 00:24–00:26Z = rỗng) — loại trừ sibling edit cho lần 2. Nguyên nhân chưa xác định; giả thuyết mạnh nhất (chưa chứng minh): renderer crash/OOM cuối lượt khi 12 pump zombie sống (ring buffer tích lũy) — nhưng `dmesg`/`journalctl` không đọc được trên VM này nên không xác nhận được. Chạy lại lần 3 với 12 clip (c5c3) thì **thành công**, log chỉ có 1 dòng NAVIGATION là lần `page.goto` ban đầu (00:30:55Z), không có navigation giữa lượt. Probe nay đã có log NAVIGATION + snapshot tiến triển 5 s (`frame-parity-progress.json` khi lỗi) để bắt lại nếu tái diễn — xem §5 mục 4.
3. **Driver ghi exit sai:** `run.sh`/`run2.sh` in `END ... exit=0` cho MỌI lượt kể cả lượt lỗi — `$(date ...)` trong cùng lệnh echo đã ghi đè `$?` trước khi in. Tính hợp lệ của lượt chỉ đánh giá theo file trên đĩa (`results.json` vs `error.txt`), không theo exit code driver. Đã sửa mẫu trong `run3.sh`/`run4.sh` (`rc=$?` trước khi gọi date). B5 có thể mắc cùng lỗi — ghi chú cho parent kiểm tra lại log đợt 100 nếu cần.
4. **R5 `mtimeChanged=true`:** sibling sửa `preview.tsx` (md5 `94ee64c0` → `a6e34691`, mtime 00:07:56Z) giữa lượt R5, cùng lúc sửa `playheadHold90R2.ts` + `.test.ts`. Vite HMR hot-swap không reload trang (state100 liên tục n=294, gap max 704 ms quanh lúc sửa). Sửa rơi vào relPlay ≈61 s — SAU sự kiện check cuối cùng (60290) và sau biên cuối; 12 ca check ở R5 đều xảy ra trước sửa. R3 (build sạch, không sửa) cho cùng mẫu 12/12 độc lập → kết luận không phụ thuộc vào sửa đó. Marker A6 ×5 còn nguyên sau sửa.
5. **R1 nhiễm tải:** hết 120 s chờ yên, load lúc phát 4,84 (sibling). R1 vì vậy là "thường dưới tải nhẹ" chứ không phải lượt yên — vẫn là lượt đường bình thường hợp lệ, và kết quả của nó (0 check) khớp R4 (load 0,54, cũng 0 check).
6. **R2 thưa:** caps 409 / state100 391 mẫu dưới load 10,11 + sysload 2 — mật độ thấp nhưng fb `'clip-change'` ×12 đầy đủ, không mất biên nào (b_k xác định được cả 23 biên).
7. **Probe sửa giữa lượt:** `probe101c5` có 2 revision — rev1 (chỉ driver modes) chạy R1–R5; rev2 (+ log NAVIGATION + snapshot tiến triển, xem §6) chạy c5c3. Khác biệt chỉ là instrumentation chẩn đoán, không đổi hành vi driver/probe. File stage là rev2 (mới nhất, `node --check` PASS).

## 5. Verdict đóng/giữ + nợ còn lại

### Verdict

1. **ĐÓNG nợ LIMITS gộp đợt 100 §4 mục 7 ("khe early-return ngoài đời chưa quan sát được").** Nay đã quan sát được: 24/24 biên seek-across, check bắn 1/biên, độ trễ trực tiếp 23–123 ms, chữ ký frameIdx tiền-seek 67–89 (gồm 85/86/89). Tần suất theo điều kiện đã đo: seek qua biên 100% (24/24), phát tick-by-tick 0% (0/70).
2. **GIỮ nguyên code phòng thủ** — check A6 trong `rvfcCallback` + hook test `__vcut99a6DisableOwnerKill` / `__vcut99a6DisableClipActiveCheck`. Lý do cụ thể: check đã chứng minh bắn đúng 24 ca thật ngoài đời (không còn chỉ là fault-injection) + 6 ca đối chứng; nó là thứ duy nhất ngăn zombie capture sau cú seek qua biên (zombie Δ = 0, 0 capture post-seek ở cả 24 biên — trong khi đối chứng A6 ctrl kill-tắt+check-tắt cho 22 capture zombie). Xóa check sẽ mở lại đúng cửa sổ vừa đo được (23–123 ms sau mỗi cú seek qua biên). Không đề xuất xóa code; không sửa production trong luồng này.
3. **Khe early-return theo nghĩa hẹp** (tick vượt biên early-return trong phát tick-by-tick, không qua seek) **vẫn chưa quan sát được (0/70)** — nhưng nay đã biết nó không phải đường duy nhất gây kill-miss; đường seek mới là đường thực tế. Không cần probe thêm theo mẫu tick-by-tick trừ khi có cách ép early-return trực tiếp (hook ép `skipRenderSeeking` ở đúng tick biên — B5 §5 mục 2b, chưa làm, nay kém cấp thiết).

### Nợ còn lại (cho đợt sau, không làm trong luồng này)

1. **Stale first-frame của pump mới sau seek (mới, 2 ca):** pump mới capture 1 frame cũ của pooled element trước khi seek đáp (R3 seq 63: ct 2,43 → reset sau 105 ms; R4 seq 65: ct 2,97 → reset sau 369 ms); tự sửa bằng `reset-capture`, frame cũ không ở lại trong ring. Chưa rõ frame cũ có kịp vẽ lên canvas trong cửa sổ 105–369 ms không — cùng file stripes cho mọi clip nên pixel parity không phân biệt được. Đề xuất: (a) đo lại với file khác nhau cho từng clip (frame cũ sẽ lộ pixel sai); (b) xem có nên chặn capture đầu khi element đang seeking không.
2. **Nguyên nhân navigation giết 2 lượt đối chứng 24-clip (c5c1/c5c2) chưa xác định:** không có file sửa trong cửa sổ lỗi c5c2; giả thuyết renderer crash/OOM cuối lượt (12 pump zombie sống) chưa chứng minh được (dmesg/journal không đọc được). Probe nay đã có log NAVIGATION + snapshot tiến triển 5 s — nếu tái diễn sẽ có URL navigation + dữ liệu từng phần. Nếu cần đối chứng 24-clip trên build mới, chạy lại khi VM yên hơn và xem log NAVIGATION.
3. **Độ trễ owner-kill trực tiếp vẫn chưa đo được** (chỉ đo được check — §3). Cần ghi timestamp tại điểm kill trong production (B5 §5 mục 2c) nếu đợt sau muốn số này.
4. **Driver ghi exit sai** (run.sh/run2.sh — `$(date)` ghi đè `$?`): đã sửa mẫu ở run3.sh/run4.sh; các lượt cũ chỉ tin file đĩa. Parent nên kiểm tra xem driver các đợt trước có cùng lỗi không khi đọc log exit code cũ.
5. **Không đụng:** TTS 39, birefnet, `.github/workflows/*`, cloud/collab, nhạc bản quyền, production code (0 file production đổi trong luồng này).

## 6. Kiểm chứng + batch đã stage (KHÔNG push)

- Harness mới: `apps/web/scripts/probe101c5-frame-parity.mjs` (copy probe100b5 + 3 cờ driver `--seek-across` / `--seek-near-boundary` / `--pause-burst` + ghi `driverActions` vào JSON + [rev2] log `NAVIGATION`/`PAGE-CLOSED`/`CONSOLE-ERROR` + snapshot tiến triển 5 s vào `frame-parity-progress.json` khi lỗi; `node --check` PASS cả 2 rev).
- Analyze mới: `hidden_files/round101-c5-analyze.py` (copy B5 + in `driverActions`).
- Dữ liệu thô: `hidden_files/round101-c5/` — 7 thư mục lượt (`chr-mixedalt-c5n1/l1/x1/p1/xl1/c1/c2/c3`; c1/c2 chỉ có `frame-parity-error.txt` + log — không có results) + `analysis-all.txt` (R1–R5) + `analysis-c5c3.txt` (đối chứng) + log driver `round101-c5-driver.log` + log luồng `round101-c5.md` + script chạy `round101-c5-run*.sh`.
- Hồi quy: pixel parity đứng ở cả 6 lượt hoàn thành (clip lẻ C 83–100%, `out` = 0, xem §2); `pageErrs` = 0/6 lượt. Không sửa production nên không có suite nào quy cho C5; snapshot nhanh trên cây hiện tại: `tsc --noEmit` (web) **0 lỗi** (chạy sau các lượt probe, trên build `a6e34691`).
- Batch stage: `phase9-round101-c5-zombie.txt` — **2 entry** (chỉ file text trong cây repo, read-back OK, 0 binary, 0 workflow):
  - `apps/web/scripts/probe101c5-frame-parity.mjs`
  - `docs/PHASE9_ROUND101_C5_ZOMBIE_LIMITS.md` (file này)
- Ngoài repo, lưu tại `~/workspace/goals/capcut-clone-video-editor/hidden_files/` (không đưa vào batch push của repo theo quy ước paths-loop): `round101-c5-analyze.py`, `round101-c5.md`, `round101-c5-run*.sh`, `round101-c5-driver.log`, thư mục dữ liệu `round101-c5/`.
