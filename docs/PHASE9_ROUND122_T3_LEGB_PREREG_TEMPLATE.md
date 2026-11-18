# PREREG TEMPLATE — Bar F2 leg B đợt 122 (trục tải PSI v0.1)

> **Cách dùng:** luồng T3 đợt 122 copy file này thành
> `hidden_files/round122-t3/prereg-t3.md`, điền ĐẦY ĐỦ các mục
> `[ĐIỀN]` **TRƯỚC khi chạy bất kỳ phép đo nào** (kể cả smoke),
> rồi mới đo. Không sửa định nghĩa/ngưỡng/tiêu chí sau khi đo
> bắt đầu. Mọi điều chỉnh vận hành (không đổi định nghĩa) phải
> ghi rõ vào LIMITS với thời gian.
>
> **Căn cứ:** định nghĩa trục PSI v0.1 —
> `docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md` (đọc toàn bộ trước khi
> điền); bar F2 + verdict cũ — `docs/PHASE9_ROUND120_T3_SEEKPRELOAD_LIMITS.md`
> §1/§6 nợ #1; pilot PSI — `docs/PHASE9_ROUND121_T2_PSIAXIS_LIMITS.md`.

## 0. Thông tin chung (điền trước khi đo)

- **Ngày/giờ viết prereg (UTC):** [ĐIỀN, vd 2026-11-16Txx:xxZ]
- **Boot đo:** boot_id `[ĐIỀN]`, btime (uptime -s) `[ĐIỀN]`,
  tuổi boot lúc bắt đầu `[ĐIỀN]`.
- **Cây:** preview.tsx md5 `[ĐIỀN]` (kỳ vọng H3f
  `5be5a250a552357c50cc189de9a9c08a`), media.ts md5 `[ĐIỀN]`
  (kỳ vọng `2c384ed13703809d5e999311147745e7`). Verify lại
  trước/sau mọi leg; cây đổi giữa chừng → VOID toàn bộ leg.
- **Runner/analyzer/classifier:** copy từ đợt 120, đổi chuỗi
  round + PORT (tránh 5187/5188/5189/5191/5590) + thư mục OUT.
  Validate analyzer TRƯỚC khi đo trên dữ liệu đợt 120 (phải
  khớp T_startup/T_seek đã công bố).
- **Lock v2:** copy `apps/web/scripts/vcut-vite-lock-v2.sh`
  (md5 `cd0c05c1…`), cổng lock `[ĐIỀN]`.

## 1. Bar F2 — định nghĩa + ngưỡng (GIỮ NGUYÊN đợt 119/120, không đổi)

- **(a) T_startup** = t(loadedmetadata ĐẦU TIÊN) −
  t(loadstart ĐẦU TIÊN) trong evs. Bar phân phối: trên ≥6 run
  cổng yên, median ≤1,0 s VÀ p90 ≤1,2 s → pha (a) ĐẠT. Chế độ
  chậm (T_startup >1,2 s) báo RIÊNG, không gộp vào median/p90,
  không chấm.
- **(b) T_seek** = t(seeked ĐẦU TIÊN) − t(seeking ĐẦU TIÊN).
  Bar: trên ≥6 run, MỌI run ≤100 ms VÀ median ≤50 ms → pha (b)
  ĐẠT. Caveat phân giải evs 10 ms: 0,00 s nghĩa là "<10 ms",
  không tuyên bố 0 ms.
- **Bar F2 ĐẠT tổng thể** khi cả (a) và (b) đều ĐẠT trên cùng bộ
  run. Nếu (a) không đạt vì chế độ chậm → verdict "KHÔNG ĐẠT —
  chế độ chậm", không gộp chế độ.
- **Verdict hiện tại (đợt 120): KHÔNG ĐẠT — chế độ chậm.**
  Pha (b) ĐẠT (16/16 run SEEKFAST T_seek = 0,00 s gộp các đợt).
  Muốn lật verdict cần EITHER (i) ≥6 run mới toàn chế độ nhanh
  trên CÙNG MỘT boot + cùng cây, HOẶC (ii) parent quyết lại
  ngưỡng/định nghĩa pha (a). T3 không tự đổi luật.

## 2. Bộ run đăng ký đợt này (điền trước khi đo)

- **Cấu hình:** MSB4RB8 (`J2_QUEUE2_MAX_SIZE_BYTES=4194304` +
  `L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608`, L2 max-size UNSET) —
  giữ nguyên đợt 118/119/120.
- **Mục tiêu đợt 122:** `[ĐIỀN — vd: 3 valid nhanh mới trên boot
  hiện tại; nếu boot hiện tại ≠ #61 thì bộ 3 nhanh đợt 120
  (boot #61) KHÔNG gộp được theo luật (i) — cần 6 run nhanh mới
  trên cùng boot này, tối đa 6 attempt/leg, dừng sớm khi đủ]`.
- **Số attempt tối đa:** 6. **Dừng sớm:** khi đủ số valid đăng
  ký. **Không** chạy thêm run ngoài đăng ký để "làm đẹp" bộ số.
- **Run đã có từ đợt trước trên cùng boot này:** `[ĐIỀN — vd: 0
  (boot mới #62); hoặc liệt kê run + T_startup nếu cùng boot]`.

## 3. Trục tải PSI v0.1 (MỚI — thay toàn bộ bracket/dial load1 cũ)

- **Band mục tiêu của leg B này:** **Yên, PSI some avg60 <30%**
  (leg B chạy ở cổng yên như mọi đợt trước; band Vừa/Nặng chỉ
  dùng khi parent ra lệnh leg tải).
- **Trục chính:** PSI cpu.some avg60, mẫu 5 s trong lúc phát.
  **Trục phụ:** threadsR. **Chỉ báo:** tickRate (blendTick).
  **Xác nhận hog:** hog burn + cgroup usage rate.
  **load1 CHỈ ghi để đối chiếu — không dùng trong bất kỳ tiêu
  chí hợp lệ, band, hay kết luận nào.**
- **Dial (vòng kín theo PSI):** 0 hog → chờ ≥90 s → đọc avg60;
  nếu avg60 ≥30% thì CHỜ thêm (ambient đang cao — không tăng
  hog, không chạy run), đọc lại mỗi 90 s cho tới khi avg60
  <30% (tối đa `[ĐIỀN]` phút chờ; quá hạn thì ghi VOID-cổng
  và báo, không chạy chui). Ghi mọi lần đọc + thời gian chờ.
  **Số hog cuối cùng:** `[ĐIỀN sau khi dial, trước run 1]`.
- **Hold trước run 1:** ≥90 s ở mức hog cuối (avg60 đã hội tụ).
  Giữa các run: không đổi hog; nếu avg60 trôi khỏi band giữa
  các run thì chờ lại ≥90 s rồi đọc lại bracket.
- **Bracket (thay bracket load1 <3):** avg60 ngay trước run và
  ngay sau run, cả hai phải <30% (Yên). Ghi cả hai số mỗi run.

## 4. Luật VOID / hợp lệ (theo DEF v0.1 §5 — tóm tắt, bản đầy đủ trong DEF)

Run VOID nếu: (a) avg60 bracket đầu/cuối lệch khỏi band Yên quá
10 điểm (≥40%); (b) trung bình avg60 trong run ≥30%; (c)
hogsAlive < số hog mục tiêu trong bất kỳ mẫu nào; (d) thiếu
>10% mẫu PSI; (e) PSI full avg10 >5%; (f) reboot/đổi boot hoặc
cây đổi giữa run; (g) tiêu chí cũ: shim readback sai, seekedOk
false, finalCt ≠ 32, finalSrc ≠ blob, errEvents > 0. Run VOID
vẫn ghi đầy đủ số + lý do, không giấu.

## 5. Ghi chép mỗi run (bắt buộc — lưu vào results JSON + LIMITS)

boot_id · md5 cây · cấu hình queue2 · band mục tiêu · số hog ·
thời gian hold (s) · PSI avg60 đầu/cuối/trung bình trong run ·
PSI full max · threadsR trung bình · tickRate · hog burn ·
load1 đầu/cuối (ĐỐI CHIẾU ONLY) · T_startup · T_seek ·
T_seek_ms · seekImmMs · frames · shim · full chuỗi mẫu PSI 5 s.

## 6. Báo cáo bắt buộc sau leg (cho DEF v0.2 — xem DEF §6)

- (i) PSI avg60 thực tế trong lúc browser chạy ở band Yên (so
  với pilot hog-only); (ii) T_startup theo band PSI — chế độ
  nhanh/chậm có tách theo band không?; (iii) tickRate theo band
  PSI (kiểm tra lại tương quan +0,90 của T2-120). Đề xuất dời
  ngưỡng (nếu cần) + lý do bằng số.

## 7. Những gì KHÔNG làm

Không sửa production. Không push. Không release/tag. Không chạy
leg tải (Vừa/Nặng) trừ khi parent ra lệnh riêng. Không dùng
load1 làm biến tải. Không tự đổi ngưỡng pha (a)/(b) hay luật
VOID. Không đo chui trên boot thiếu GST (postboot FAIL → chờ
T7 / luật replay-chết đã duyệt từ đợt 121).
