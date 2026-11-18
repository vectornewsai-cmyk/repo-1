# Phase 9 — Đợt 117, luồng T1: Tái hiện stall r1f3 att2 / r1f4 có kiểm soát

> **Kết quả gọn: KHÔNG TÁI HIỆN ĐƯỢC stall trong 3 lượt đo + 1 lượt
> retry bị DEFER do lock.** Không lượt nào quan sát được steady-close
> (tailSteadyClosed = 0 suốt cả 3 lượt), nên không có drift re-seek nào
> sau steady-close để đo — H1 (seek chậm ~6–13 s, xong) và H3 (seek kẹt
> vĩnh viễn) đều CHƯA PHÂN ĐỊNH ĐƯỢC. E4 giữ **ĐÓNG CÓ ĐIỀU KIỆN**
> theo đúng luật prereg. Đây KHÔNG phải bằng chứng stall không tồn tại
> (r1f3att2/r1f4 là quan sát thật) — chỉ là tiền điều kiện để stall xảy
> ra (decoder ì kéo dài → drift bền vững >0,35) đã không xuất hiện
> trong 3 lượt này.

## 0. Bối cảnh và nhiệm vụ

- Nợ #1 đợt 116 (docs/PHASE9_ROUND116_LIMITS.md §10 mục 1; chi tiết
  trong docs/PHASE9_ROUND116_S1_E4STALL_LIMITS.md): tái hiện stall
  r1f3 att2 / r1f4 — drift re-seek chậm/kẹt của decoder sau steady-close
  (ct đóng băng 2,4667 / 3,6667, seeking=True ≥5771 ms / [2408, 2803] ms).
  S1 đợt 116 chỉ xong phân tích offline; phần đo (lượt A/B) chưa chạy
  vì chờ cờ cây S2.
- Prereg: `hidden_files/round117-t1/prereg-t1.md` (viết TRƯỚC mọi phép
  đo mới, kế thừa toàn bộ prereg-s1.md). Bar quyết định: H1 ĐẠT = A xong
  [6,13] s VÀ B xong [2,0,3,5] s VÀ A/B ≥ 2 VÀ không main-thread stall;
  H3 ĐẠT = A không xong trong 60 s; còn lại (không steady-close sau
  2 attempt, A/B không scale, main-thread stall) = KHÔNG KẾT LUẬN →
  E4 giữ ĐÓNG CÓ ĐIỀU KIỆN. T1 không tự quyết E4, chỉ đưa bằng chứng.
- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b` — kiểm
  trước/sau MỌI lượt, không đổi lần nào. Cổng cây:
  hidden_files/round116-tree = NO-CHANGE suốt (mục cuối S9 DONE
  22:48:00Z 14/11). Không có cờ cây round117 riêng; md5 trước/sau là
  chốt chặn chống luồng T khác sửa cây giữa lượt.
- Boot đo: boot mới bắt đầu 2026-11-15 08:29:12Z, boot_id
  `22536366-8716-46f0-a999-cd4199080854` — **là boot #52, đã được T8
  đợt 117 xác minh độc lập** (uptime -s ×2 + btime 1794731352 + who -b
  + journal 1 boot; xem mục T8 trong build-loop-log). Postboot PASS
  08:39Z (đủ điều kiện chạy WebKit). Không reboot nào giữa các lượt
  (boot_id giống nhau trước/sau cả 4 lần chạy).
- Probe: `apps/web/scripts/probe116s1.mjs` giữ nguyên, không sửa
  (`node --check` OK trước khi đo). Vite tạm `watch.ignored ["**/**"]`
  do probe tự tạo (headroom inotify ~961 watch — vite thường ENOSPC).
  Lock vite v2-only (`VITE_LOCK_AGING_S=600`), acquire riêng từng lượt,
  timeout 900 s. loadN=0 cả 3 lượt (không hog của mình).

## 1. Kết quả các lượt đo (WebKit, loadN=0)

| Lượt | GOP | Phase | Kết quả | Steady-close | Drift re-seek sau steady-close |
|---|---|---|---|---|---|
| A | 250 | t1a | VOID — không steady-close | 0 tick | không có (không đo được) |
| A retry | 250 | t1a2 | VOID — không steady-close | 0 tick | không có (không đo được) |
| B | 30 | t1b | VOID — không steady-close | 0 tick | không có (không đo được) |
| B retry | 30 | t1b2 | **DEFER-LOCK** — timeout acquire 900 s | — (chưa chạy probe) | — |

Tất cả 3 lượt probe chạy xong exit 0, md5 không đổi, không pageerror,
rVFC 0 mẫu cả 3 lượt (quirk WebKit đã biết từ S1 — callback đăng ký
được nhưng không bao giờ bắn).

### 1.1 Lượt A — t1a (gop250, 08:40:20–08:40:54Z)

- Lock v2: wait 0 s, hold 34 s. RAM khả dụng 1304 MB; load lúc bắt đầu
  1,70; loadavgEnd 3,75.
- Phát 0,5→6 trong ~6,5 s tường (**0,92× realtime** — decoder theo kịp).
- resyncsV chỉ đổi 1 lần: 0→1 ở tick 2 (seek ban đầu 5→0,5 lúc bắt đầu
  phát; publish lag 1 tick đúng mẫu S1 §2.3). restartV=0.
- Drift sau seek ban đầu (bỏ 3 tick đầu): **max 0,18, min −0,07** —
  không chạm ngưỡng 0,35 lần nào. tailSteadyClosed=0 suốt;
  tailBursts tối đa 1.
- Sampler: 0 mẫu seeking=True (seek ban đầu quá nhanh, không bắt được).
- Render ticks: n=68, gap median 87 ms, max 252 ms, skipped 3/68.
  rAF top gaps 721/509/252 ms. Không có gap >1000 ms.

### 1.2 Lượt A retry — t1a2 (gop250, 08:42:13–08:55:47Z)

- Lock v2: **wait 773 s** (xếp sau T6 giữ lock 08:42:06–08:55:06Z),
  hold 41 s. RAM 1273 MB; load lúc bắt đầu lượt 2,60, lúc probe bắt
  đầu 6,67 (nhiễu luồng khác); loadavgEnd 9,90.
- Phát 0,5→6 trong ~7,1 s tường (**0,82× realtime**).
- resyncsV 0→1 ở tick 4 (seek ban đầu). restartV=0.
- Drift sau seek ban đầu: **max 0,23, min −0,13** — không chạm 0,35.
  tailSteadyClosed=0 suốt; tailBursts 0.
- Sampler: 1 chuỗi seeking mẫu 0..1, relMs 140..359 (≥219 ms) — là
  seek ban đầu 5→0,5, ct=0,5, rs=4. Không có chuỗi seeking nào khác.
- Render ticks: n=65, gap median 96 ms, max 170 ms, skipped 5/65.
  rAF top gaps 505/393/354 ms. Không gap >1000 ms.
- Pause-seek tới t=5: tElement 491 ms (t1a: 409 ms; S1 ghi 1799 ms
  cho cùng clip gop250 — phương sai lớn giữa các lượt, xem §4).

### 1.3 Lượt B — t1b (gop30, 08:56:32–09:02:16Z)

- Lock v2: **wait 288 s** (xếp sau T2), hold 55 s. RAM 929 MB lúc bắt
  đầu lượt (đỉnh tải môi trường 21,96 — xem §5), 1724 MB lúc probe
  bắt đầu; load lúc probe bắt đầu 0,63; loadavgEnd 0,46.
- Phát 0,5→6 trong ~8,5 s tường (**0,72× realtime** — chậm nhất 3 lượt).
- resyncsV 0→1 ở tick 4 (seek ban đầu). restartV=0.
- **Drift VƯỢT 0,35 tới 8 lần nhưng KHÔNG BAO GIỜ 2 tick liên tiếp:**
  tick 12 (0,5917), 14 (0,3667), 16 (0,4), 18 (0,3667), 20 (0,3686),
  22 (0,3667), 26 (0,3767), 31 (0,4333) — xen kẽ các tick drift thấp
  (0,10 / 0,13 / 0,23 / 0,17 / 0,27). Drift dao động vì decoder decode
  theo burst: ct nhảy vọt rồi playhead đuổi kịp. Điều kiện "drift
  >0,35 đã xác nhận 2 tick" để bắn re-seek KHÔNG BAO GIỜ thỏa.
  tailBursts tăng 0→5 trong lúc phát nhưng tailSteadyClosed=0 suốt —
  đuôi không bao giờ đóng steady.
- Decoder ì lúc mở đầu (cùng chữ ký với r1f3att2 nhưng nhẹ hơn nhiều):
  ct đứng yên ở 0,5 từ tick 3→11 (t=680→2092, ~1,4 s tường) rồi mới
  chạy; r1f3att2 đứng ~4,7 s. Sau đó decoder bắt kịp, không tích
  lũy drift bền vững.
- Sampler: 1 chuỗi seeking mẫu 0..2, relMs 398..620 (≥222 ms) — seek
  ban đầu 5→0,5. Không chuỗi seeking nào khác.
- Render ticks: n=31, gap median 219 ms, max 506 ms, skipped 3/31.
  rAF top gaps **1021**/782/703 ms — có 1 gap rAF 1021 ms (vừa qua
  1000 ms) nhưng KHÔNG nằm trong cửa sổ seeking nào (không có seek
  nào đang chạy lúc đó) và render-tick max chỉ 506 ms; không kết luận
  main-thread stall từ 1 gap rAF đơn lẻ này.
- Pause-seek tới t=5: tElement 662 ms (chậm nhất 3 lượt).

### 1.4 Lượt B retry — t1b2 (DEFER-LOCK, 09:03:14–09:18:17Z)

- Lock v2: TICKET 09:03:14Z, **TIMEOUT waited=902 s** (quá 900 s) —
  không lấy được lock, probe chưa chạy. Hàng đợi lúc chờ: t4-hold giữ
  630 s (09:02:17–09:12:47Z), t3-round117 chờ 632 s rồi giữ 70 s,
  t4-wc và t2 xếp trước tôi. Ticket đã timeout và bị dọn (không còn
  ticket t1 nào sau đó; lock lúc cuối do t2 giữ — không phải của tôi).
- Theo prereg §4/§6: lock timeout 900 s → DEFER, không ép lock. Retry
  này đã dùng hết 1 lần retry cho phép của lượt B → lượt B kết thúc
  ở trạng thái KHÔNG KẾT LUẬN (không chạy thêm lượt săn kết quả).

## 2. Vì sao không tái hiện được stall — phân tích

1. **Tiền điều kiện không xuất hiện:** stall r1f3att2 cần decoder ì
   kéo dài ngay sau khi phát (ct đóng băng 0,5 trong ~4,7 s) để drift
   tích lũy tới 1,1 rồi mới steady-close và bắn re-seek. Trong 3 lượt
   T1, decoder theo kịp (0,72–0,92× realtime); drift lớn nhất sau
   seek ban đầu chỉ 0,18 / 0,23 / 0,59 — và ở lượt B, drift 0,59 chỉ
   là 1 tick đơn lẻ trong chuỗi dao động, không bền vững.
2. **Luật xác nhận drift 2 tick là rào chắn thật:** lượt B cho thấy
   decode burst trên WebKit tạo drift dao động (vượt 0,35 rồi tụt
   ngay tick sau). Với luật hiện tại, re-seek chỉ bắn khi drift vượt
   ngưỡng 2 tick liên tiếp — điều này gần như không xảy ra trong 3
   lượt đo. Đây là quan sát về thiết kế trigger, không phải lỗi:
   nếu parent muốn re-seek bắn thường xuyên hơn thì đó là quyết định
   thiết kế (nới luật xác nhận), không phải sửa bug.
3. **Stall là hiện tượng xác suất, phụ thuộc mức ì của decoder từng
   lượt:** cùng clip gop250, cùng cây, cùng engine — r1f3att2 ì 4,7 s,
   t1a/t1a2 ì ~0 s, t1b (gop30) ì ~1,4 s. Phương sai này lớn; 3 lượt
   không đủ để bắt được đuôi hiếm (mẫu n=3, 0 lần xuất hiện → chỉ
   kết luận được "không thường xuyên", không kết luận "không tồn tại").
4. **Không có bằng chứng main-thread stall trong 3 lượt:** render-tick
   gap tối đa 252/170/506 ms; rAF gap tối đa 721/505/1021 ms (1 lần
   1021 ms ở t1b, ngoài mọi cửa sổ seeking). Nếu stall có xảy ra ở
   lượt khác thì theo S1 nó vẫn là seek của decoder, không phải
   main thread — dữ liệu T1 không mâu thuẫn với kết luận này.
5. **Caveat ngưỡng 2 s (giữ nguyên từ prereg-s1 §4):** phép đo này
   không dùng ngưỡng stall 2 s để quyết H1/H3 vì seek xuôi bình
   thường trên WebKit đã ~2,6 s (r1f4 đính chính). Không có số mới
   nào trong đợt này làm thay đổi caveat đó.

## 3. Verdict — KHUYẾN NGHỊ cho parent (T1 không tự quyết E4)

- **H1 (seek chậm ~6–13 s, xong): CHƯA CHỨNG MINH.** Không lượt nào
  có drift re-seek sau steady-close để đo thời gian seek.
- **H3 (seek kẹt vĩnh viễn): CHƯA CHỨNG MINH.** Không lượt nào có
  seek nào kẹt (mọi seek quan sát được đều xong trong <1 s: seek ban
  đầu 219/222 ms theo sampler; pause-seek 409/491/662 ms).
- **Kết luận theo luật prereg §5: HỖN HỢP / KHÔNG KẾT LUẬN → E4 giữ
  ĐÓNG CÓ ĐIỀU KIỆN.** Nợ #1 đợt 116 vẫn MỞ (chuyển thành nợ đợt 117).
- **Đề xuất bước tiếp theo (để parent quyết, T1 không tự làm):**
  (a) Chấp nhận E4 giữ ĐÓNG CÓ ĐIỀU KIỆN cho tới khi có lượt đo nào
  bắt được steady-close + drift re-seek (cần lô đo lớn hơn, đăng ký
  trước số lượt, KHÔNG chạy tới khi ra số đẹp); (b) hoặc điều tra
  riêng "vì sao decoder ì 4,7 s ở r1f3att2 nhưng ~0 s ở 3 lượt T1"
  (phương sai khởi động decoder WebKit/GStreamer — cần trace sâu hơn
  S1, ngoài phạm vi T1); (c) hoặc parent quyết E4 dựa trên phân tích
  cơ chế offline của S1 (đã rõ: không phải zombie Q2, không phải do
  cổng E4/N3) mà không cần số tái hiện — đó là quyết định về luật,
  T1 chỉ báo cáo cơ chế.
- **Không đề xuất đóng E4 đầy đủ chỉ từ dữ liệu T1:** 3 lượt không
  stall không chứng minh được stall không xảy ra (xác suất bắt được
  đuôi hiếm với n=3 là thấp); ngược lại, 3 lượt này cũng không cho
  thấy E4 gây ra stall nào.

## 4. Số đo phụ (ghi nhận, không dùng để quyết verdict)

- Pause-seek tới t=5 (cùng clip gop250): t1a 409 ms, t1a2 491 ms;
  gop30 t1b 662 ms. S1 ghi 1799 ms cho gop250 (đợt 115) — phương sai
  lớn giữa các lượt (~4×), seek lạnh không ổn định trên WebKit này.
  Không suy ra quy luật GOP từ 3 mẫu.
- Tốc độ phát tường: t1a 0,92×, t1a2 0,82×, t1b 0,72× (ph 0,5→6).
- Drift sau seek ban đầu: t1a max 0,18 / min −0,07; t1a2 max 0,23 /
  min −0,13; t1b max 0,59 / min −0,27.
- rVFC: 0 mẫu cả 3 lượt (quirk WebKit đã biết). readyState=4 suốt
  các chuỗi seeking quan sát được. Không pageerror nào.
- RAM khả dụng: 1304 / 1273 / 929→1724 MB (vẫn <6 GB — birefnet
  không thử, đúng luật; u2net là fallback, không cần ở luồng này).
  TTS 39 không kiểm (CẤM).

## 5. Hạn chế trung thực + nợ mở

1. **Mẫu mỏng (n=3 lượt đo + 1 DEFER):** không đủ để ước xác suất
   stall; chỉ kết luận "không tái hiện được trong đợt này".
2. **Nhiễu tải môi trường từ các luồng T khác của đợt 117:** tải
   lúc bắt đầu lượt dao động mạnh (t1a 1,70; t1a2 2,60→6,67 lúc
   probe; t1b 21,96 lúc bắt đầu lượt nhưng 0,63 lúc probe bắt đầu;
   t1b2 15,30). Tải cao thoáng qua trước lúc chờ lock, không phải
   trong lúc probe chạy (trừ t1a2: loadavgEnd 9,90 — tải vẫn cao
   trong lúc phát). Ghi rõ để đợt sau đối chiếu; không loại lượt nào
   vì prereg không đặt cổng tải (chỉ loadN=0 cho hog của mình).
3. **Lock contention nặng trong đợt 117:** wait 0 / 773 / 288 s và
   1 TIMEOUT 902 s cho 4 lần acquire của T1; t4-hold giữ 630 s,
   t3-round117 chờ 632 s. Đây là dữ liệu waiter sống cho S4 (điều
   kiện migration v2 #1): hàng đợi v2 hoạt động đúng (FIFO, không
   waiter nào bị bỏ qua — t1a2 và t1b đều acquire sau khi holder
   nhả), nhưng holder giữ lâu (630 s) làm waiter timeout 900 s.
   Không có DEFERRED ngoài ý muốn nào khác; không STALE-LOCK.
4. **Chưa kiểm lại Q1 bằng phương pháp sampler-bracket trên dữ liệu
   mới** (không cần — không có drift re-seek nào để đo).
5. **Boot #52 (08:29:12Z) đã được T8 xác minh độc lập.** Mù #35
   (mở 21:04:50Z 14/11) nay chứa 4 reboot (#49–#52) và KHÔNG ĐÓNG
   HOÀN TOÀN (T7) — việc của luồng probe, không phải T1.
6. **Nợ chuyển tiếp (không đổi):** E4 ĐÓNG CÓ ĐIỀU KIỆN chờ tái hiện
   (nợ này); G1 + mù #22/#28–#31/#34/#35 chờ user quyết;
   ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; birefnet
   0 lần thành công (RAM <6 GB); release gate không đổi; KHÔNG push
   khi user chưa nhắn "push đi".

## 6. Kiểm chứng

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b` trước/sau
  cả 4 lần chạy (t1a/t1a2/t1b/t1b2); mtime 2026-11-14T21:31:05.326Z
  không đổi. Không sửa production (chỉ chẩn đoán + thêm LIMITS này).
- Probe: `apps/web/scripts/probe116s1.mjs` không sửa; `node --check`
  OK trước khi đo. Vite tạm `watch.ignored ["**/**"]` (probe tự tạo).
- Phân tích: `hidden_files/round117-t1/analyze-t1.py` (kế thừa logic
  S1: steady-close theo cờ tailSteadyClosed, resyncsV transitions,
  sampler seeking runs + sampler-bracket) → `analyze-t1-all.txt`.
  Chạy lại được: `python3 analyze-t1.py <dir probe-results>`.
- Log lock v2 (`hidden_files/vite-lock-v2.log`): t1 TICKET/ACQUIRED/
  RELEASED/TIMEOUT khớp với §1 (wait 0/773/288 s, TIMEOUT 902 s).
- `tsc` / `vite build` toàn repo: KHÔNG chạy (không sửa production).
- Prereg: `hidden_files/round117-t1/prereg-t1.md` (viết trước mọi phép
  đo mới; verdict ở §3 áp đúng luật đã đăng ký).

## 7. File trong batch

- `docs/PHASE9_ROUND117_T1_E4STALL_LIMITS.md` (file này — mới).
- Dữ liệu + prereg + analyzer + driver (KHÔNG stage, chỉ tham chiếu):
  `hidden_files/round117-t1/` (prereg-t1.md, run-t1.sh,
  run-t1-retry-a.sh, run-t1-retry-b.sh, analyze-t1.py,
  analyze-t1-all.txt, run-t1.log);
  `hidden_files/round116-s1/probe-webkit-load0-gop250-t1a/`,
  `probe-webkit-load0-gop250-t1a2/`,
  `probe-webkit-load0-gop30-t1b/` (probe-results.json + log).
