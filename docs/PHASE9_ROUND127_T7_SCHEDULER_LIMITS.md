# PHASE9 ROUND127 T7 — Slot scheduler MỚI sau 23:35Z 16/11: 2 slot thiếu thêm (đều DR)

- **Luồng:** T7 đợt 127 (lượt cron 09:35 +07 17/11/2026). Boot lúc làm việc: không xác định trong luồng này (T5 owns boot; đợt 126 ghi boot #71 tạm, btime 23:25:41Z).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 23:35Z 16/11 (lúc lượt cron đợt 126 bắt đầu) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `cron.runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không kiểm lại mù #40 B / #43, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler, ngoài repo).

## 1. Verdict

**Có 2 slot thiếu MỚI, đều là deterministic-doctor — heartbeat 0 thiếu mới, mẫu thiếu đổi dạng.**

| Slot thiếu mới | Giờ (+07 / Z) | Job |
|---|---|---|
| deterministic-doctor 08:00+07 17/11 | 01:00:00Z | deterministic-doctor |
| deterministic-doctor 09:00+07 17/11 | 02:00:00Z | deterministic-doctor |

- DR 03:00+07 17/11 (đã xác nhận thiếu lúc 20:51Z đợt 125) **vẫn thiếu** khi kiểm lại 02:44:47Z — không đổi. DR 06:00+07 (thiếu đợt 126) vẫn thiếu — không đổi.
- **Heartbeat: 0 slot thiếu mới** — 6/6 slot trong cửa đều CÓ. Slot 06:50:50+07 (đợt 126 chưa tới hạn kiểm tra) xác nhận CÓ.
- **vcut-build-loop: 0 slot thiếu** trong cửa này (lượt 06:35:51+07 `succeeded`, lượt 09:35:51+07 đang `running` lúc kiểm).
- Cập nhật lũy kế (cùng phương pháp đợt 125/126, có đính chính mẫu số DR — xem §4): heartbeat **38/148 slot thiếu** (số thiếu không đổi); deterministic-doctor **42/145 slot thiếu** (từ 40/141 đợt 126 — mẫu số 141 của đợt 126 lệch 1 so với toán cửa sổ đúng 142).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 23:35Z 16/11 → 02:45Z 17/11

**Heartbeat (lưới :20:50/:50:50): 6/6 có, 0 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 06:50:50 | 9e2941db | 23:45:34 | −316 s | CÓ |
| 07:20:50 | 2d83145a | 00:15:34 | −316 s | CÓ |
| 07:50:50 | f9b8526d | 00:45:34 | −316 s | CÓ |
| 08:20:50 | a53b7e0a | 01:41:41 | +1251 s | CÓ |
| 08:50:50 | 9bae3339 | 01:45:34 | −316 s | CÓ |
| 09:20:50 | 691c9f78 | 02:35:37 | +887 s | CÓ |

Kiểm lại limit=15 xác nhận không slot nào trong cửa vắng mặt. Cả 6 lượt đều `succeeded`, attempt=1, error_text=null. HB 08:20:50 muộn +1251 s là kỷ lục mới (vượt +1249 s ngày 15/11) và phá mẫu "muộn ~:35:38 trước vcut dispatch" — start thực 01:41:41Z, không có lượt vcut nào gần đó; ghi nhận là dị thường dispatch, không phải slot thiếu. HB 09:20:50 muộn +887 s đúng mẫu đã biết (start 02:35:37Z, 14 s trước khi vcut-build-loop 09:35:51 dispatch).

**Deterministic-doctor (lưới :00:00): 1/3 có, 2/3 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 07:00 | 16312a62 | 00:00:00 | 0 s | CÓ |
| 08:00 | — | — | — | **THIẾU** |
| 09:00 | — | — | — | **THIẾU** |

DR 08:00 được kết luận thiếu sau ~1h41' quá giờ hẹn ở lần kiểm đầu; DR 09:00 sau ~42' quá giờ hẹn ở lần kiểm đầu và vẫn thiếu ở lần kiểm lại 02:44:47Z (~45' quá giờ); DR jitter lịch sử 0–2 s nên ngưỡng này an toàn theo phương pháp đợt 125/126. Lượt có duy nhất `succeeded`, attempt=1, error_text=null.

Slot HB 09:50:50+07 (02:50:50Z) và DR 10:00+07 (03:00Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận.

### 2.2 Không slot thiếu mới nào trùng build-loop đang active

Theo `started_at_utc`/`finished_at_utc` của vcut-build-loop: lượt 06:35:51 kết thúc 00:47:42Z, lượt 09:35:51 bắt đầu 02:35:51Z. Cả 2 slot thiếu mới (01:00Z, 02:00Z) đều nằm giữa hai lượt → **không có build-loop nào active** tại giờ thiếu. Cờ `round-in-progress.md` đợt 127 mở 02:37:39Z — cũng mở SAU cả 2 slot thiếu. Giả thuyết "VM bận / build-loop chiếm slot" vẫn bị bác — nhất quán đợt 125/126.

### 2.3 Trạng thái VM vẫn không quyết định lượt thiếu — không bằng chứng mới

Trong cùng giờ thiếu, heartbeat vẫn chạy bình thường (08:20:50/08:50:50+07 CÓ trong giờ 08:00; 09:20:50+07 CÓ trong giờ 09:00) → trong cùng một giờ có job chạy, có job thiếu. Đúng kết luận đợt 125; **không có quan sát mới nào làm đổi kết luận hay hé lộ cơ chế drop**. Lưu ý thêm: cả 2 slot thiếu mới đều nằm SAU khi gap #70→#71 kết thúc (boot #71 từ 23:25:41Z) — tức thiếu xảy ra khi VM đã boot lại xong, không còn trong gap VM-down; chỉ ghi nhận thời gian, không suy diễn thêm.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `cron.runs` (HB limit=15 rồi kiểm lại limit=15; DR limit=15 rồi kiểm lại limit=15; vcut limit=5). Lưới kỳ vọng như đợt 125/126.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Đối chiếu lịch sử trong cùng lần kiểm: HB 02:20:50/02:50:50+07 và 05:20:50/05:50:50+07 17/11 vẫn vắng trong danh sách limit=15; DR 18:00+07 và 10:00/11:00/12:00/15:00+07 16/11 vẫn vắng → các kết luận đợt 125/126 không đổi.

## 4. Đính chính mẫu số DR đợt 126 (lệch 1, số thiếu không ảnh hưởng)

Toán cửa sổ DR 11/11 09:00 → 17/11 06:00 +07: 11/11 = 15 slot (09:00–23:00) + 5 ngày × 24 + 17/11 tới 06:00 = 7 slot → **142 slot**, không phải 141 như LIMITS đợt 126 ghi. Số thiếu 40 của đợt 126 vẫn đúng (39 + DR 06:00). Từ 142 đúng: +3 slot mới (07:00, 08:00, 09:00) → 145; số thiếu +2 → **42/145**. Kiểm toán HB: cửa sổ 14/11 07:50:50 → 17/11 09:20:50 = 33 + 48 + 48 + 19 = **148** ✓ (khớp 142 + 6 slot mới). Tỉ lệ thiếu lũy kế: HB 38/148 = 25,7%; DR 42/145 = 29,0%.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: KHÔNG có bằng chứng mới — nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này chỉ đếm thêm 2 slot thiếu mới (đều DR, HB 0 thiếu — lần đầu trong 3 đợt gần nhất chỉ một job thiếu); mọi quan sát đều nhất quán với kết luận đợt 125. Không giao điều tra tiếp từ trong VM bằng cùng phương pháp.
2. **Dị thường HB +1251 s (08:20:50+07):** kỷ lục muộn mới, phá mẫu "muộn ~:35:38 trước vcut dispatch". Chỉ ghi nhận, không kết luận — giao luồng hạ tầng nếu muốn đào.
3. **Mù #40 B / #43: KHÔNG ĐỔI** (không kiểm lại). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round127-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round127-t7/NOTES.md` (không nằm trong repo nên không stage).
