# PHASE9 ROUND117 T4 — Lock v2: đo 3 điều kiện đổi spec sang v2 — LIMITS

- Đợt: 117, luồng T4 (lock v2). Ngày: 15/11/2026, 08:44–09:18Z
  (15:44–16:18 +07). Boot #52 (`22536366…`, uptime 14 phút lúc bắt
  đầu, không reboot trong lúc đo).
- Nhiệm vụ (nợ #4 đợt 116, `docs/PHASE9_ROUND116_LIMITS.md` §10 mục 4;
  tiếp nối `docs/PHASE9_ROUND116_S4_LOCKV2MIGRATION_LIMITS.md` §5 và
  `docs/PHASE9_ROUND115_R4_LOCKV2_LIMITS.md` §9): chạy 3 phép đo còn
  thiếu để quyết đổi `VCUT_VITE_LOCK_FREEZE_SPEC` sang v2:
  (a) mẫu waiter thật đủ dày; (b) vá C đo dưới tải hog — 1 waiter
  timeout ~300 s dưới load1 >15; (c) 1 waiter chờ >600 s để quan sát
  aging. Chỉ đưa bằng chứng + khuyến nghị — KHÔNG tự đổi spec
  (quyết đổi spec là của parent).
- KHÔNG push/tag/binary. KHÔNG sửa script lock, KHÔNG sửa production,
  KHÔNG sửa/xóa v1 frozen (md5 `fd21193c` — kiểm trước = sau, nguyên
  vẹn). Cây `preview.tsx` md5 `03bf029f` trước = sau. V2-only trong
  đợt vẫn tiếp tục (mọi driver đợt 117 đều v2; không luồng nào gọi v1).

## 0. Thiết kế lượt đo (1 lượt giữ chung cho (b)+(c))

- Driver `hidden_files/round117-t4/run-t4-measure.sh`: dial load1 vào
  [15,30] (luật S3: 2 mẫu liên tiếp + hog-runtime ≥90 s) → holder
  `t4-hold` giữ 630 s → waiter B `t4-wb` timeout 300 s + waiter C
  `t4-wc` timeout 900 s cùng xếp hàng → waiter long `t4-wl` tới muộn
  ở holder+612 s (sau ngưỡng aging 600 s của wc). Cổng riêng T4
  5570–5573. `VITE_LOCK_AGING_S=600` explicit.
- Chờ lock trống trước khi dial: **720 s** (t6 giữ 779 s, t1 chờ 773 s
  phía trước) — hàng đợi đợt 117 sâu, các lượt giữ dài 600–800 s là
  bình thường lúc này (xem §5).
- Dial ĐẠT 08:57:37Z: load1 24,90, hog-runtime 107 s, 20 hog
  `nice -n 19 node` (khởi 16, +4 vì load <15 lúc đầu).

## 1. Điều kiện (a) — mẫu waiter thật: ĐẠT

Đếm từ `hidden_files/vite-lock-v2.log` (phân tích
`hidden_files/round117-t4/analyze-t4.sh`, log 133 dòng lúc chốt):

| Nhóm | Ticket | Acquired | TIMEOUT | Ghi chú |
|---|---|---|---|---|
| R4 pilot đợt 115 | 6 | 5 | 1 (cố ý, tiền-vá C) | wait max 185 s |
| S4 probe đợt 116 | 8 | 7 | 1 (cố ý, 45 s) | wait max 66 s |
| Đợt 116 thật (S2/S3/S5/S6/S8/S10) | 15 | 15 | 0 | wait max 9 s |
| Đợt 117 thật tới lúc chốt (t1/t2/t3/t6/t8 + t4-hold/wc) | 13 | 11 | 2 (t1 902 s, t8 121 s — xem §5) | wait max 773 s |
| T4 đo đợt 117 (wb/wl) | 2 | 0 | 2 (đo timeout) | — |
| **Tổng cộng** | **44** | **38** | **6** | **STALE-LOCK 2, STALE-TICKET 0** |

- **31 lượt giữ thật** (không tính probe): 5 (R4) + 15 (đợt 116) +
  11 (đợt 117). **5 waiter chờ >600 s rồi vẫn giữ được lock** trong
  đợt 117: t1 773 s, t8 634 s, t3 632 s, t4-wc 702 s, t2 668 s.
- **Không có waiter nào bị đói / bị vượt mặt trái thiết kế:** mọi
  TIMEOUT đều giải thích được bằng timeout do caller đặt so với độ
  sâu hàng đợi (t8 121 s với timeout 120 s; t1 902 s với timeout
  900 s; t4-wl 302 s với timeout 300 s — cả 3 đều xếp sau ticket tới
  trước, FIFO giữ nguyên). Không STALE-TICKET nào; 2 STALE-LOCK đều
  là dọn lock chết sau reboot đúng cơ chế (R3 tái tạo + S3 đợt 116).
- Mẫu đủ dày để quyết: 44 ticket / 38 lần giữ / 31 lượt thật, trải
  3 đợt, gồm cả chờ dài >600 s và timeout dưới tải.

## 2. Điều kiện (b) — vá C dưới tải hog: ĐẠT VỚI CAVEAT VỀ TẢI

- **Waiter B `t4-wb` (timeout danh nghĩa 300 s): TICKET 09:02:18Z →
  TIMEOUT 09:07:19Z, log `waited=300s` → tường 301 s, giãn
  301/300 = 1,003×.** Trước vá: giãn 1,34× (900 s → 1204 s, pilot
  R4). Nếu vá C không có tác dụng, waiter này phải chờ ~400 s tường
  mới nổ timeout — thực tế nổ sau 301 s. **Vá C xác nhận đúng dưới
  tải hog.**
- Điểm dữ liệu thứ hai: **`t4-wl` TIMEOUT 09:17:35Z, `waited=302s`,
  tường 303 s (giãn 1,010×)** — nhưng lúc này tải đã thấp (~1–2),
  chỉ chứng minh thêm cơ chế wall-clock nói chung, không phải dưới
  tải hog.
- **Caveat — tải KHÔNG giữ >15 suốt 300 s:** sampler 5 s
  (`hidden_files/round117-t4/hog-load-t4.txt`, 61 mẫu trong cửa chờ
  của wb): min 0,43 / max 26,99 / **mean 16,91 / >15 trong 38/61 mẫu
  (62%)**. Đoạn >15 liên tục dài nhất: **09:03:15–09:06:24Z = 189 s,
  đỉnh 26,99**; 57 s đầu là đoạn leo từ đáy dip (0,43 → 15) và 55 s
  cuối là đoạn rơi (15 → 6,43).
- Nguyên nhân (đo được, chưa lý giải tới cùng — xem §6): **load1
  dao động theo chu kỳ ~5 phút trên cell này** — hogs `nice -n 19
  node` (20 con) lúc thì đẩy load lên 25–27, lúc thì chỉ còn ~2–6%
  CPU mỗi con dù `procs_running` vẫn ~28 (hogs sống, không chết).
  Pha BẬT (load cao) chỉ kéo dài ~200 s rồi tắt; pha TẮT ~200 s rồi
  lại bật. Dial "ĐẠT" theo luật S3 chỉ bắt được 2 mẫu trong pha BẬT,
  không đảm bảo tải giữ suốt 300 s. **Một phép đo timeout 300 s nằm
  trọn trong pha BẬT ~200 s là không thể với cách hog hiện tại** —
  đây là giới hạn của phương pháp đo, không phải của vá C.
- Đánh giá: overshoot chỉ **1 s** (so với ~100 s nếu còn lỗi cũ) và
  189 s liên tục ở load 15–27 là đủ để kết luận vá C đúng — phần tải
  cao nằm giữa cửa chờ mới là đoạn gây trôi poll-loop, và trôi đó
  không xảy ra. Ghi caveat đầy đủ để parent quyết có cần đo lại
  nghiêm ngặt hơn không (xem §7).

## 3. Điều kiện (c) — aging 600: ĐẠT ĐẦY ĐỦ

- **Waiter C `t4-wc`: TICKET 09:02:20Z (class 1, normal) →
  ACQUIRED 09:14:02Z, `wait_s=702` → chờ 702 s (>600 s), giữ 5 s,
  nhả sạch.** Timeout danh nghĩa 900 s, còn 198 s đệm.
- **Lật hạng quan sát trực tiếp trong `queue`:** snapshot 20 s
  (`hidden_files/round117-t4/queue-snapshots.txt`): key của wc là
  `1-1794733340838409205-…` tới snapshot 09:12:04Z, đổi thành
  `0-1794733340838409205-…` từ snapshot 09:12:25Z — đúng quanh mốc
  created+600 s = 09:12:20Z. Cùng snapshot đó: t3 (created 09:02:19Z)
  cũng lật sang `0-`, còn t2/t1 (created 09:03:03Z/09:03:14Z, chờ
  ~550 s) vẫn `1-` — đối chứng trong cùng một ảnh chụp.
- **Hiệu ứng chống đói chứng minh bằng thứ tự giữ lock:** lúc holder
  nhả 09:12:47Z, hàng đợi là t3 (aged, 09:02:19) → wc (aged,
  09:02:20) → t2 (aged, 09:03:03) → t1 (aged, 09:03:14) → wl (long,
  09:12:32). **Waiter long tới sau cùng (wl) xếp CUỐI dù mang prio
  long** — 4 ticket normal đã già đều vượt nó nhờ aging + timestamp
  sớm hơn. Thứ tự giữ thực tế: t3 (wait 632 s) → wc (wait 702 s) →
  t2 (wait 668 s) → … → wl TIMEOUT 302 s vì t2+t1 còn đứng trước
  (xem §5 — timeout của wl là hệ quả độ sâu hàng đợi, không phải lỗi
  aging: nó xếp sau wc đúng thứ tự).
- Kết luận: aging 600 có tác dụng thật trên lock sống — lật hạng đúng
  mốc 600 s, waiter già không bị waiter long mới tới vượt mặt, và
  waiter chờ >600 s vẫn giữ được lock trong timeout 900 s.

## 4. Khuyến nghị: ĐỦ ĐIỀU KIỆN ĐỔI SPEC SANG v2

- Cả 3 điều kiện đều đạt ((a) đạt; (b) đạt với caveat tải đã ghi rõ
  ở §2; (c) đạt đầy đủ). **Khuyến nghị parent đổi
  `VCUT_VITE_LOCK_FREEZE_SPEC` sang v2 ở đợt 117/118.**
- Giữ `vcut-vite-lock.sh` frozen làm sao lưu (md5 `fd21193c` nguyên
  vẹn) — không xóa. V2-only trong đợt vẫn tiếp tục như hiện tại.
- Không cần đo lại (b) trừ khi parent yêu cầu nghiêm ngặt "load1 >15
  suốt 300 s" — với phương pháp hog hiện tại thì phép đo đó gần như
  không thể (pha BẬT ~200 s), cần đổi phương pháp đo trước (xem §7).

## 5. Hạn chế trung thực + nợ mở

- **t1 TIMEOUT ngoài ý muốn trong đợt 117 (09:18:16Z, `waited=902s`,
  timeout 900 s):** t1 xếp sau t4-hold (giữ 630 s) + t3 (70 s) + t2
  (đang giữ) — tổng chờ vượt 900 s. Lượt giữ 630 s của T4 GÓP PHẦN
  gây ra timeout này. Đây là hành vi timeout đúng thiết kế (FIFO giữ
  nguyên, không ai vượt t1), không phải lỗi fairness — nhưng là bằng
  chứng rằng giữ lock 600 s+ trong đợt đông sẽ làm waiter timeout
  900 s đói. Luồng sau giữ dài nên cân nhắc.
- **Lỗi đo của driver T4 (đã phát hiện, không ảnh hưởng kết luận):**
  `run-t4.log` ghi "wb ket thuc … wall_ms=613782 (~613s)" là SAI —
  driver gọi `wait $WB_PID` sau đoạn sleep 608 s chờ wl, nên số này
  là thời gian tới lúc driver thu hoạch tiến trình, không phải thời
  gian chạy của wb. Số đúng lấy từ log lock: TICKET 09:02:18Z →
  TIMEOUT 09:07:19Z = 301 s (khớp `waited=300s` + `wb.out` "HẾT
  300s"). Số wall của wc (706 s) và wl (304 s) thì đúng vì chúng kết
  thúc sau khi khối wait bắt đầu. Đừng trích số 613 s cho wb.
- **Tải dao động (xem §2, §6):** dial ĐẠT không đồng nghĩa tải giữ —
  luật dial S3 chỉ kiểm 2 mẫu liên tiếp. Các phép đo tải của đợt 117
  (kể cả biên GIỮ của S3) nên đọc kèm lưu ý này.
- **Hogs tốn RAM:** 20 hog node ≈ 1,4 GB RSS; freeMB tụt 2027 → ~786
  trong lúc đo, hồi lại sau khi kill hogs. Không OOM, nhưng luồng sau
  chạy nhiều hog song song nên để ý freeMB.
- **wl TIMEOUT 302 s:** wl tới muộn để kiểm chứng aging nhưng không
  kịp giữ lock (t2+t1 đứng trước, t2 giữ dài) — bằng chứng thứ tự
  (wc trước wl) vẫn đủ, nhưng không có số wait/acquire của wl.
- **T8 TIMEOUT 121 s (timeout 120 s do caller đặt):** waiter timeout
  ngắn sẽ nổ khi holder giữ dài — hành vi đúng thiết kế, ghi lại để
  khỏi nhầm là lỗi lock.
- Không đụng: TTS 39, birefnet, `.github/workflows/*`, production
  code, `preview.tsx`, `vcut-poll-quiet-v2.sh`, `test-vite-lock-v2.sh`.
  Không chạy lại test suite (script lock không đổi trong đợt này).

## 6. Ghi chú chẩn đoán tải dao động (chưa kết luận cơ chế)

- Hiện tượng: 20 hog `nice -n 19 node` sống suốt (pgrep 20–21) nhưng
  load1 lên 25–27 rồi rơi về 2–3 theo chu kỳ ~5 phút; mỗi hog chỉ
  được ~2–6% CPU trong pha TẮT dù `procs_running` ~28 và máy rảnh
  (load1 ~2,6). `ps` %CPU hog 1,2–4,2%; utime 1 hog tăng 173 tick /
  30 s (≈5,8% 1 core) trong pha TẮT.
- Đã loại trừ: hog chết (pgrep còn đủ 20), cgroup quota nhìn thấy
  được (`/proc/self/cgroup` = `/`, không có `cpu.max` — cgroupfs có
  vẻ bị che/virtualized nên không kiểm được quota thật), memory
  pressure (freeMB ≥786).
- Giả thuyết mạnh nhất (chưa chứng minh): quota CPU của cell có burst
  — pha BẬT đốt burst tích lũy lúc máy rảnh, pha TẮT là lúc bị bóp về
  quota (~1,5 CPU) rồi burst nạp lại. Khớp chu kỳ ~5 phút và khớp
  việc S3 đợt 116 cũng thấy load rơi theo hàm mũ sau khi hogs dừng
  (file `hog-load-*.txt` của S3: 22,35 → 9,77 trong ~1 phút).
- Hệ quả thực tế: **không thể tin load1 >15 sẽ giữ suốt một phép đo
  dài chỉ vì dial ĐẠT** — cần ghi trace sampler 5 s kèm mọi kết luận
  tải. Đề xuất cho đợt sau: thử hog từ nhiều session (nếu quota tính
  theo session thì mỗi session có burst riêng, xếp chồng được pha
  BẬT dài hơn) hoặc giảm số hog để pha BẬT kéo dài (chưa thử — chỉ
  là giả thuyết, không đo trong đợt này).

## 7. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND117_T4_LOCKV2_LIMITS.md` | Mới (tài liệu này) |

Không đổi: `apps/web/scripts/vcut-vite-lock-v2.sh` (md5 `8b02ddc8`
trước = sau), `apps/web/scripts/vcut-vite-lock.sh` (frozen md5
`fd21193c`), production code, `preview.tsx` (md5 `03bf029f`).
Stage: `repo-1-push/paths-loop/phase9-round117-t4-lockv2.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round117-t4/` (run-t4-measure.sh,
run-t4.log, hold.out, wb.out, wc.out, wl.out, hog-load-t4.txt,
queue-snapshots.txt, analyze-t4.sh, analyze-baseline.txt,
analyze-final.txt).

## 8. Timeline đo (UTC, boot #52)

- 08:44:02Z driver bắt đầu; chờ lock trống 720 s (t6 giữ 779 s).
- 08:55:50Z lock trống → dial; 08:57:37Z dial ĐẠT (load1 24,90).
- 08:57:37Z t4-hold lấy ticket; 09:02:17Z ACQUIRED (wait 280 s).
- 09:02:18Z t4-wb TICKET; 09:02:19Z t3 TICKET; 09:02:20Z t4-wc TICKET.
- 09:07:19Z t4-wb TIMEOUT `waited=300s` (tường 301 s).
- 09:12:20Z mốc aging 600 s của wc (lật key 1→0 giữa snapshot
  09:12:04Z và 09:12:25Z).
- 09:12:32Z t4-wl TICKET (long); 09:12:47Z holder RELEASED hold 630 s.
- 09:12:51Z t3 ACQUIRED wait 632 s; 09:14:01Z t3 RELEASED hold 70 s.
- 09:14:02Z t4-wc ACQUIRED wait 702 s; 09:14:07Z RELEASED hold 5 s.
- 09:14:11Z t2 ACQUIRED wait 668 s (vẫn giữ lúc driver kết thúc).
- 09:17:35Z t4-wl TIMEOUT `waited=302s` (tường 303 s).
- 09:17:37Z driver xong (exit 0), hogs đã kill hết, md5 sau =
  md5 trước. 09:18:16Z t1 TIMEOUT `waited=902s` (sau khi driver xong;
  ghi nhận từ log).
