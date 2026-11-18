# PHASE9 ROUND118 T1 — Lock v2 đổi spec (spec mặc định sang v2) — LIMITS

- Đợt: 118, luồng T1 (lock v2 đổi spec). Ngày: 15/11/2026, 11:38–11:45Z
  (18:38–18:45 +07). Boot #54 (`48a82db1…`, boot lúc 10:48Z, không
  reboot trong lúc làm).
- Nhiệm vụ (quyết parent đợt 117 §13 mục 4, xem
  `docs/PHASE9_ROUND117_LIMITS.md` §13 quyết 4 + T4 đợt 117
  `docs/PHASE9_ROUND117_T4_LOCKV2_LIMITS.md` §4): chuyển spec mặc
  định `VCUT_VITE_LOCK_FREEZE_SPEC` sang v2. T4 đã đo đủ 3 điều kiện:
  (a) 44 ticket / 38 lần giữ / 31 lượt thật, 5 waiter chờ >600 s vẫn
  giữ được lock; (b) vá C: waiter B timeout 300 s → 301 s tường (giãn
  1,003×, trước vá 1,34×); (c) aging 600: waiter C chờ 702 s, key lật
  1→0 đúng quanh created+600 s. Parent CHẤP NHẬN đổi spec từ đợt 118,
  giữ v1 frozen làm sao lưu.
- KHÔNG push/tag/binary. KHÔNG sửa production, KHÔNG sửa `preview.tsx`,
  KHÔNG đụng TTS 39, birefnet, `.github/workflows/*`. Chỉ T1 đổi file
  lock script trong đợt này (quy tắc phối hợp đợt 118).

## 0. Trạng thái lúc bắt đầu — lock TRỐNG, không chờ

- 11:38:42Z: `status` → TRỐNG (không có lock), 0 ticket + 22 cooldown;
  `ps` không có tiến trình `vcut-vite-lock` nào đang chạy. **Không cần
  chờ 30 phút** theo nhiệm vụ §4 (chỉ chờ khi lock đang giữ).
- Các luồng round118 khác đã mở thư mục (t2/t3/t6/t7 lúc 11:38Z, sau đó
  đủ t1–t10 trừ t8) nhưng CHƯA luồng nào tạo bản copy lock hay lấy
  ticket lúc T1 kiểm tra — T1 đổi spec trước khi các luồng đo dài (T3
  dial, T4/T5 lượt yên) bắt đầu acquire. T3 sau đó dùng v2
  (`driver118t3.sh: LOCK_SH=apps/web/scripts/vcut-vite-lock-v2.sh`).
- Chốt chặn `round-in-progress.md`: KHÔNG tồn tại — mở đợt bình thường.
- md5 TRƯỚC khi đổi (11:38Z):
  - v1 `apps/web/scripts/vcut-vite-lock.sh`: `fd21193c…` (khớp frozen)
  - v2 `apps/web/scripts/vcut-vite-lock-v2.sh`: `8b02ddc8…` (khớp T4
    đợt 117 §7)

## 1. Đã đổi gì (2 file)

| File | Đổi gì |
|---|---|
| `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md` | **Spec sang v2 (đổi chính):** nguồn chuẩn duy nhất đổi từ `vcut-vite-lock.sh` (v1) sang `vcut-vite-lock-v2.sh`; §1 copy bản v2 + `prio` + `run-attempt`; §2 poll mặc định 2 s (v2) thay 10 s (v1); §3 cooldown 15 s script tự bắt; §5 exit code thêm 3 (`run-attempt` không lấy được lock) + ghi chú timeout wall-clock và overshoot lượng tử hóa poll; §6 stale-recovery v2 (3 điều kiện + đường tắt boot-change, kiểm S4 đợt 116 PASS 211 ms) thay bảng N7 v1 (giữ N7 làm tham chiếu lịch sử); §7 checklist v2; §8 bảng mặc định (aging 600, timeout 1800, cooldown 15, poll 2, đường lock/log); caveat tải dao động chu kỳ ~5 phút mang theo từ T4 §2/§6 |
| `apps/web/scripts/vcut-vite-lock-v2.sh` | **Chỉ đổi comment header** khối "TRẠNG THÁI TRIỂN KHAI": ghi v2 là spec đóng băng duy nhất từ đợt 118 + lịch sử migration (114 test standalone → 115 pilot R4 → 116 v2-only → 117 T4 đủ 3 điều kiện) + v1 frozen md5 `fd21193c` làm sao lưu. **Không đổi một dòng code hành vi nào** (aging/timeout/cooldown/poll giữ nguyên) |

- v1 frozen: KHÔNG sửa, KHÔNG xóa, KHÔNG đổi tên. md5 SAU =
  md5 TRƯỚC: `fd21193c5b4b7ba1769bb16fd5482984` (kiểm 11:41Z).
- v2 md5 SAU (chỉ đổi header comment): `5cac10af3fe948f3986385e6567c3c94`
  (trước `8b02ddc8ce1c5b1d65b4270da2e4b3d7`).
- Không có "mọi bản copy đang được các luồng dùng" nào khác để đổi:
  các bản copy trong `hidden_files/round11*-*/` là bản đóng băng LỊCH SỬ
  của từng đợt cũ (v1) — không sửa bản frozen của đợt cũ; round 118
  chưa có bản copy lock nào lúc đổi (kiểm 11:38Z).

## 2. Kiểm chứng

### 2.1 Smoke test live trên lock thật (lock đang trống, 11:39:24–11:39:49Z)

Script `hidden_files/round118-t1/smoke-live.sh`, cổng 5580, log
`hidden_files/round118-t1/smoke-live.log`, sự kiện trong
`hidden_files/vite-lock-v2.log` (boot `48a82db1`, khớp boot #54):

| Ca | Kết quả | Số đo |
|---|---|---|
| acquire/release ngắn `t1-smoke-a` | PASS (rc=0/0) | ACQUIRED wait_s=0, RELEASED hold_s=0, wall 0 s |
| holder `t1-smoke-hold` giữ 25 s | PASS | ACQUIRED wait_s=0, RELEASED hold_s=25 |
| waiter timeout 5 s `t1-smoke-wt` | PASS (rc=1, TIMEOUT đúng) | TICKET 11:39:27Z → TIMEOUT 11:39:34Z, `waited=7s` |
| waiter long `t1-smoke-wl` (prio long) | PASS (rc=0) | TICKET class `0-…` → ACQUIRED wait_s=15 sau khi holder nhả, RELEASED hold_s=0 |

- **Overshoot timeout ngắn +2 s (5 s → 7 s tường):** là lượng tử hóa
  poll (VITE_LOCK_POLL_S=2 s), KHÔNG phải trôi như lỗi cũ. Bằng chứng:
  log ghi `waited=7s` đúng wall-clock; lỗi trước vá là trôi TỈ LỆ
  (900 s → 1204 s, 1,34×) còn đây là cộng tuyệt đối ≤ ~1 chu kỳ poll
  — với timeout 300 s thì overshoot tương đối chỉ ~0,7% (khớp T4:
  300 s → 301 s). Không sửa gì thêm; ghi rõ để luồng sau khỏi nhầm
  với lỗi vá C.
- Sau smoke: lock TRỐNG lại (status 11:39:49Z), 0 ticket. Cooldown
  +3 file từ 3 thread smoke (22 → 25), đúng cơ chế.

### 2.2 Test suite `test-vite-lock-v2.sh` sau đổi header (lock dir riêng /tmp)

- Lần 1 (11:41:52–11:42:18Z): **8/9** — T1 FIFO, T2 priority, T3
  stale-lock, T4 stale-ticket, T5 release-between-attempts, T6
  cooldown (3196 ms), T8 run-attempt exit code: PASS. **T7 FAIL:
  B1=8 B2=6 (muốn B1−B2=1).**
- Lần 2 (11:42–11:43Z): **8/9** — cùng 8 PASS (T6 cooldown 3474 ms),
  **T7 FAIL: B1=6 B2=6.**
- **T7 FAIL là nhiễu môi trường, KHÔNG liên quan đổi spec:**
  (a) T7 không chạy script lock v2 — nó chạy
  `vcut-poll-quiet-v2.sh` (file này T1 KHÔNG đụng; md5
  `1710e4803c479e0c5214ff7b9c96de54`); (b) T1 chỉ đổi comment header
  trong script v2 — T1–T6/T8 PASS cả 2 lần chứng minh hành vi lock
  không đổi; (c) `count_blockers` đếm mọi process khớp
  vite|probe*.mjs|MiniBrowser|webkit|WebProcess trên máy — lúc kiểm
  (11:43Z) có **7 blocker nền không liên quan** (vite round116-s1 còn
  chạy trên cổng 5580, probe116s1, MiniBrowser/WebKit Playwright,
  `node --check webkit_blob_flaky_118t8.mjs`…), bất kỳ process nào
  trong số đó khởi động/dừng giữa 2 lần poll là vỡ đẳng thức
  B1−B2=1 (lần 1: một blocker khác biến mất cùng lúc, diff 2; lần 2:
  một blocker khác xuất hiện, diff 0). Đây đúng là tính flaky mà S4
  đợt 116 đã ghi ("T7 nhạy nhiễu môi trường… flaky khi luồng khác
  khởi động process giữa 2 poll"). S4 đo được 3× 9/9 lúc máy yên
  (đầu đợt 116); đợt 118 có 9 luồng khác chạy song song nên T7 không
  còn điều kiện yên. **Không chạy lần 3** — 2 lần đã đủ mẫu (B1/B2
  khác nhau mỗi lần = chữ ký nhiễu); không sửa test, không sửa
  poll-quiet (ngoài phạm vi T1, và sửa test để "xanh" thì là gian
  lận số đo).
- Log: `hidden_files/round118-t1/test-v2-after-spec.log` (lần 1),
  `test-v2-after-spec-run2.log` (lần 2).

### 2.3 Không còn caller nào gọi v1

- Grep live code (`apps/web/scripts/`, `scripts/`, trừ self-ref trong
  header chính v1): **0 hit** gọi `vcut-vite-lock.sh`.
- Grep `docs/`: chỉ còn `VCUT_VITE_LOCK_FREEZE_SPEC.md` nhắc v1 — nay
  là câu "v1 đóng băng làm sao lưu, không dùng nữa" (đúng ý đồ).
  Các file LIMITS lịch sử (đợt 111–117) nhắc v1 là hồ sơ cũ — KHÔNG
  sửa hồ sơ.
- Grep `hidden_files/round118-*/`: chỉ T3 nhắc lock, và là v2
  (`LOCK_SH=.../vcut-vite-lock-v2.sh`). Không luồng 118 nào gọi v1.
- Từ đợt 118, spec chuẩn = v2; mọi luồng mới phải copy
  `vcut-vite-lock-v2.sh` theo spec §1. **Bằng chứng spec mới đang
  được dùng thật:** 11:44:31Z (sau khi T1 đổi xong ~11:41–11:42Z),
  `t3-round118` acquire v2 thành công (ticket `0-…`, prio long, vite
  serving cổng 5590) — không gián đoạn, không lỗi.

## 3. Cooldown — QUYẾT: KHÔNG DỌN file nào

- Lúc gộp đợt 117: 22 file. Lúc T1 kiểm (11:38Z): 22 file. Sau smoke
  + test suite: **27 file** (11:44Z) — tăng do chính T1 tạo (3 thread
  smoke + 2 lần test T6), đúng cơ chế, không phải rò rỉ.
- File cũ nhất: `cooldown-r4-round115`, mtime 2026-11-14 18:38:25Z —
  tuổi **17h06'** lúc 11:44Z 15/11, **< 1 ngày**. Luật R4 §8: giữ file
  cooldown < 1 ngày. **Không file nào đủ điều kiện dọn** (0 file
  > 1 ngày) → giữ nguyên 27 file, không xóa gì.
- Lý do giữ (nhắc lại): file cooldown chỉ delay cùng-thread reacquire
  15 s, không chặn luồng khác, không tính là ticket; dọn sớm không
  lợi gì mà có rủi ro xóa nhầm cooldown của thread đang chạy.

## 4. Hạn chế trung thực + nợ mở

- **Caveat tải không giữ >15 suốt 300 s (T4 đợt 117 §2/§6, mang theo
  nguyên văn):** load1 dao động chu kỳ ~5 phút (pha BẬT ~200 s rồi
  tắt); dial ĐẠT không đảm bảo tải giữ. Đây là giới hạn của phương
  pháp đo hog, không phải của vá C hay spec v2. Các phép đo tải đợt
  118 phải kèm trace sampler 5 s.
- **T7 test suite 8/9 hai lần liên tiếp** (xem §2.2): T7 fail do nhiễu
  môi trường khi 9 luồng chạy song song — không phải hồi quy lock.
  Nợ nhỏ cho luồng hạ tầng: chạy lại suite lúc máy yên, hoặc tách T7
  ra khỏi gate 9/9 khi đợt đông (quyết của parent, T1 không tự đổi).
- **Phát hiện ngoài phạm vi (không xử lý):** vite của round116-s1 vẫn
  chạy trên cổng 5580 + MiniBrowser/WebKit Playwright còn sống lúc
  11:43Z (process mồ côi từ đợt cũ, làm nhiễu T7). T1 KHÔNG kill
  (ngoài nhiệm vụ, có thể thuộc luồng khác) — chuyển cho T7 hạ tầng
  đợt 118 xem xét dọn.
- **T3 dùng script v2 trực tiếp, không qua bản copy đóng băng**
  (`driver118t3.sh: LOCK_SH=apps/web/scripts/vcut-vite-lock-v2.sh`):
  trái khuyến nghị spec §1 (bash đọc script dần — sửa file gốc giữa
  chừng có thể làm acquire đang chạy đọc nửa cũ nửa mới). T1 đã đổi
  xong TRƯỚC khi T3 acquire nên lần này an toàn; nhưng các luồng sau
  nên copy về scratch theo spec §1. Nhắc lại ở đây, không sửa driver
  của luồng khác.
- Không đụng: TTS 39, birefnet, `.github/workflows/*`, production code,
  `preview.tsx`, `vcut-poll-quiet-v2.sh`, `test-vite-lock-v2.sh`.

## 5. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md` | Spec sang v2 (11.274 B) |
| `apps/web/scripts/vcut-vite-lock-v2.sh` | Chỉ comment header "SPEC CHUẨN TỪ ĐỢT 118" (27.571 B; md5 `8b02ddc8` → `5cac10af`) |
| `docs/PHASE9_ROUND118_T1_LOCKV2_LIMITS.md` | Mới (tài liệu này) |

Không đổi: `apps/web/scripts/vcut-vite-lock.sh` (frozen md5
`fd21193c` trước = sau), production code, `preview.tsx`,
`vcut-poll-quiet-v2.sh`, `test-vite-lock-v2.sh`.
Stage: `repo-1-push/paths-loop/phase9-round118-t1-lockv2.txt`
(NUL-delimited, 3 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round118-t1/` (smoke-live.sh,
smoke-live.log, test-v2-after-spec.log, test-v2-after-spec-run2.log).
