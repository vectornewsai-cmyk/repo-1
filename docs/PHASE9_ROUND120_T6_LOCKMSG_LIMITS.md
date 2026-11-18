# PHASE9 ROUND120 T6 — Cải tiến thông báo lock "KHÔNG NHẢ — owner '?'" (chỉ sửa TEXT, không sửa logic) — LIMITS

- Đợt: 120, luồng T6. Lượt cron 12:35 +07 16/11/2026.
  Chạy 05:41–05:45Z 16/11/2026 (12:41–12:45 +07).
- Nhiệm vụ (quyết parent §12 mục 8 khi đóng đợt 119): cải tiến thông báo
  lock "KHÔNG NHẢ — owner '?'" (T9 đợt 119: double-release vô hại, rc=1,
  không đổi trạng thái — thông báo cũ gây hiểu lầm). **CHỈ SỬA TEXT,
  KHÔNG SỬA LOGIC** — không đổi acquire/release/timeout/stale-check.
- KHÔNG push/tag/binary. Chỉ sửa 1 file script + 1 file LIMITS này.

## 0. Trạng thái lúc bắt đầu

- Boot #60 (tạm): `0260101b-acd3-43f4-91d2-670c1960fb7d`,
  btime 1794804349 (04:45:49Z 16/11).
- Lock thật lúc bắt đầu: **TRỐNG** (0 ticket + 34 cooldown), kiểm tra
  trước khi sửa và sau khi sửa — T6 không acquire/release lock thật lần
  nào; mọi thí nghiệm dùng lock dir riêng dưới /tmp.
- md5 TRƯỚC (khớp baseline đợt 120):
  - `apps/web/scripts/vcut-vite-lock-v2.sh`: `5cac10af3fe948f3986385e6567c3c94`
  - `apps/web/src/preview.tsx`: `5be5a250` (H3f, parent chấp nhận)
  - `apps/web/src/media.ts`: `2c384ed1`
  - `apps/web/scripts/vcut-vite-lock.sh` (v1 frozen): `fd21193c5b4b7ba1769bb16fd5482984`
  - `apps/web/scripts/test-vite-lock-v2.sh`: `1c0d7eaa1eb4ae6bfadbcb6abfe04702`

## 1. Diff chính xác (duy nhất 1 chỗ, `vcut-vite-lock-v2.sh`, hàm `cmd_release`)

Cũ (dòng 413–416 trước khi sửa — 1 câu chung cho cả 2 trường hợp):

```bash
  if [ "$owner_thread" != "$thread" ]; then
    echo "vite-lock-v2: KHÔNG NHẢ — owner hiện tại là '${owner_thread:-?}', không phải '$thread'"
    return 1
  fi
```

Mới (dòng 413–426 sau khi sửa — guard và `return 1` giữ nguyên từng ký tự;
chỉ nhánh in tách làm 2 theo owner rỗng hay thật, + comment giải thích):

```bash
  if [ "$owner_thread" != "$thread" ]; then
    # T6 round120: chỉ đổi TEXT thông báo, KHÔNG đổi logic guard/rc.
    # Phân biệt 2 trường hợp (trước đây chung 1 câu "owner hiện tại là '?'" gây
    # hiểu lầm, xem docs/PHASE9_ROUND119_T9_LOCKV2_LIMITS.md §2):
    # (a) owner rỗng = lock đã trống — release thừa vô hại (cleanup gọi lại
    # sau khi đã nhả); KHÔNG phải lỗi, KHÔNG phải lock kẹt, không cần can thiệp.
    # (b) owner là thread khác thật = từ chối nhả lock của người khác.
    if [ -z "$owner_thread" ]; then
      echo "vite-lock-v2: BỎ QUA release thừa — lock đã trống (không còn owner; '$thread' đã nhả rồi hoặc chưa từng giữ). KHÔNG phải lỗi, KHÔNG phải lock kẹt, không cần can thiệp"
    else
      echo "vite-lock-v2: KHÔNG NHẢ — lock đang do '$owner_thread' giữ, không phải '$thread' (bảo vệ lock của người khác)"
    fi
    return 1
  fi
```

- Điều kiện guard `[ "$owner_thread" != "$thread" ]` không đổi; `return 1`
  không đổi; nhánh release thành công (rm owner, rmdir, cooldown,
  `log_event RELEASED`) không đụng tới. Nhánh `if [ -z ... ]` mới chỉ
  chọn chuỗi in — không đổi trạng thái, không đổi mã trả về, không đổi
  luồng điều khiển nào khác. `owner_field`, acquire, timeout, stale-check,
  queue, cooldown: không sửa dòng nào.
- md5 SAU: `apps/web/scripts/vcut-vite-lock-v2.sh` =
  `cd0c05c1f9304d58f7aaf041c25bb8b9`. preview.tsx / media.ts / v1 / test
  script: md5 không đổi (xem §4).

## 2. Bằng chứng trước/sau (tái hiện trên lock dir /tmp, KHÔNG đụng lock thật)

Script + log: `hidden_files/round120-t6/repro-before.sh` /
`repro-before.log`, `repro-after.sh` / `repro-after.log`
(cùng 3 thí nghiệm A/B/C như T9 đợt 119).

| Thí nghiệm | TRƯỚC (script cũ) | SAU (script mới) |
|---|---|---|
| **A. Double-release:** acquire tA → release → release lần 2 | `vite-lock-v2: KHÔNG NHẢ — owner hiện tại là '?', không phải 'tA'`, rc=1 | `vite-lock-v2: BỎ QUA release thừa — lock đã trống (không còn owner; 'tA' đã nhả rồi hoặc chưa từng giữ). KHÔNG phải lỗi, KHÔNG phải lock kẹt, không cần can thiệp`, rc=1 |
| **B. Release khi lock trống từ đầu** (chưa từng acquire) | Cùng câu '?' như A, rc=1 | Cùng câu "BỎ QUA release thừa" như A, rc=1 |
| **C. Đối chứng — release sai thread trong lúc người khác giữ** | `KHÔNG NHẢ — owner hiện tại là 'tH', không phải 'tX'`, rc=1 | `KHÔNG NHẢ — lock đang do 'tH' giữ, không phải 'tX' (bảo vệ lock của người khác)`, rc=1 |

- Cả trước và sau: log lock thí nghiệm chỉ có **đúng 1 dòng RELEASED**
  cho mỗi holder; status cuối TRỐNG; rc từ chối vẫn = 1 trong cả 3
  trường hợp (A/B/C). Nghĩa là hành vi không đổi, chỉ câu chữ đổi.
- Trường hợp driver T3 đợt 118 (cleanup gọi release sau khi run-attempt
  đã nhả) từ nay sẽ in câu "BỎ QUA release thừa…" thay vì 2 dòng
  "KHÔNG NHẢ — owner '?'" gây điều tra lại.

## 3. Kiểm chứng độc lập

- `bash -n apps/web/scripts/vcut-vite-lock-v2.sh`: **OK** (sau sửa).
- Suite `test-vite-lock-v2.sh`: **9/9 PASS, exit 0, lần chạy duy nhất**
  (05:43Z, log `hidden_files/round120-t6/test-v2-run1.log`):
  syntax, T1 FIFO (2<4<5), T2 priority, T3 stale-lock (132 ms, log có
  STALE-LOCK), T4 stale-ticket, T5 release-between-attempts (2<6<8),
  T6 cooldown (3058 ms ≥ 2500 ms), T7 poll (3→2, diff 1 — xanh ngay
  giữa đợt đông, dù T9 đợt 119 đã cảnh báo T7 flaky theo bản chất),
  T8 run-attempt (false→1, true→0, lock trống sau cả 2 attempt).
  Suite dùng lock dir /tmp riêng + cổng 599x, không đụng lock thật.
- Quét toàn repo: chuỗi cũ `owner hiện tại là '?'` **không còn trong
  bất kỳ lệnh `echo` nào của v2** — chỉ còn xuất hiện trong (a) comment
  giải thích mới ở v2:415 (cố ý, để người đọc sau biết vì sao đổi),
  (b) tài liệu lịch sử `docs/PHASE9_ROUND119_T9_LOCKV2_LIMITS.md`
  (ghi lại hiện tượng cũ), (c) v1 frozen — xem §4.
- Không chạy tsc/vite build: T6 không sửa code TypeScript hay production
  nào; cây cuối đợt 119 đã được parent chạy lại tsc 0/0 + vite build
  PASS 8,15 s khi đóng đợt.

## 4. Hạn chế trung thực + nợ mở

- **v1 frozen `vcut-vite-lock.sh:191` VẪN in câu cũ**
  (`vite-lock: KHÔNG NHẢ — owner hiện tại là '?'...`). T6 KHÔNG sửa
  vì v1 đã đóng băng (frozen) — mọi luồng từ đợt 114 tới nay đều giữ
  nguyên v1. Nhưng v1 hiện không còn được dùng làm lock chính (v2 là
  bản đang chạy); nếu parent muốn đồng bộ câu chữ sang v1 thì đó là
  việc riêng cần quyết "mở băng" v1 — T6 ghi nợ, không tự làm.
- **Không có chỗ nào khác in thông báo tương tự:** quét
  `grep -rn "KHÔNG NHẢ" apps/web/scripts/` chỉ còn v1:191 (cũ, frozen)
  và v2:423 (mới, trường hợp guard thật). `vcut-poll-quiet-v2.sh` và
  test script không có chuỗi này.
- **Caveat về T7:** suite xanh 9/9 lần này, nhưng T7 vẫn flaky theo
  bản chất (đẳng thức đếm toàn cục trong cửa sổ ~2 s — T9 đợt 119
  §1.2). Lần xanh này không chứng minh T7 hết flaky; quyết tách T7
  khỏi gate khi đợt đông vẫn thuộc về parent.
- **Rủi ro sửa script trong lúc luồng khác đang chạy:** lúc sửa
  (05:42Z) lock thật đang TRỐNG và không có tiến trình nào giữ lock;
  sửa xong chạy lại suite 9/9 ngay — không ghi nhận luồng nào lỗi do
  đọc script giữa chừng. Các luồng round120 khác (t5/t7/t10 đã mở thư
  mục lúc 05:41Z) không báo lỗi liên quan.
- Nợ mở từ đợt 119 §10 không thuộc T6, không đụng: E4 lô lượt 3–10
  (T1), nhiễu s79 (T2), bar F2 leg B (T3), WebKit lượt yên + luật GST
  (T4), mù #37 + probe #39 (T5), hạ tầng boot #60 (T7), G1 (T8),
  sức khỏe lock (T9), driver/đóng đợt (T10).

## 5. File đổi + stage

| File | Đổi gì |
|---|---|
| `apps/web/scripts/vcut-vite-lock-v2.sh` | Mới: nhánh thông báo release trong `cmd_release` (dòng 413–426); md5 `5cac10af` → `cd0c05c1` |
| `docs/PHASE9_ROUND120_T6_LOCKMSG_LIMITS.md` | Mới (tài liệu này) |

Không đổi: `apps/web/scripts/vcut-vite-lock.sh` (frozen `fd21193c`),
`vcut-poll-quiet-v2.sh`, `test-vite-lock-v2.sh` (`1c0d7eaa`),
`apps/web/src/preview.tsx` (`5be5a250`), `apps/web/src/media.ts`
(`2c384ed1`), production code.
Stage: `repo-1-push/paths-loop/phase9-round120-t6-lockmsg.txt`
(NUL-delimited, 2 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round120-t6/` (repro-before.sh/.log,
repro-after.sh/.log, test-v2-run1.log).
