# Phase 9 đợt 105 — luồng G4: Re-arm (finalize) — hoàn thiện F5 đợt 104, kế hoạch A/B RAM cao + E4

- **Ngày:** 2026-11-13 (lượt cron 18:35 +07 = 11:35Z).
- **Nhiệm vụ:** hoàn thiện luồng F5 đợt 104 (Re-arm) — xác minh watcher A/B RAM cao từ đĩa, điền §10b vào LIMITS F5, viết kế hoạch A/B cụ thể cho đợt sau, stage batch. KHÔNG chạy đo live mới trong đợt này (xem §2).
- **Quan hệ với file F5:** `docs/PHASE9_ROUND104_F5_REARM_LIMITS.md` là tài liệu gốc (phân tích + đo live f1–f5); file này chỉ ghi phần G4 làm thêm: xác minh watcher, trạng thái máy lúc G4 làm việc, kiểm tra script còn dùng được sau reboot #30, và kế hoạch A/B chi tiết. Mọi kết luận số của F5 (§1–§8) được dùng tiếp, không đo lại.
- **Kết luận ngắn:**
  1. Watcher A/B RAM cao của F5 đã kết thúc 09:52:26Z mà KHÔNG bắt được cửa sổ (50 check, RAM cao nhất 2.356.708 kB = 2.301,7 MB, thiếu ~42,3 MB so với ngưỡng; 0/50 check đạt ngưỡng). F9 ghi đúng, không cần đính chính.
  2. A/B RAM cao VẪN MỞ; RAM vẫn là nghi phạm số 1 chưa được kiểm ở mức cao. Không có bằng chứng mới nào thay đổi kết luận F5 §8.
  3. Không đo live mới đợt này: reboot #30 lúc 11:26:51Z, RAM khả dụng dao động 518–1.866 MB trong lúc làm việc, 8–9 luồng đợt 105 đang chạy song song — mọi đo live lúc này đều nhiễu nặng và RAM thấp.
  4. Script A/B còn dùng được sau reboot #30 (xem §3); kế hoạch A/B chi tiết cho đợt sau ở §4.

## §1. Xác minh watcher từ đĩa (kiểm độc lập bởi G4)

Nguồn duy nhất: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f5/wait-hiram.out` (50 check, đọc toàn bộ) + `wait-hiram.sh` (logic trigger) + sự vắng mặt của `run-f5-hiram.log`.

| Hạng mục | Số liệu trên đĩa | Đối chiếu |
|---|---|---|
| Watcher bắt đầu | 09:14:54Z, boot `cff65e89-0058-4c4e-8ba3-691a3e05b031` (reboot #29) | khớp LIMITS F5 §10 |
| Watcher kết thúc | 09:52:26Z, dòng `NO HIRAM WINDOW in ~37 min`, boot id khớp | khớp F9 từng giây — **không cần đính chính** |
| Số check | 50 check × 45 s (09:14:54–09:51:41Z) + dòng kết thúc 09:52:26Z | khớp |
| RAM cao nhất | check 5, 09:17:55Z: **2.356.708 kB = 2.301,7 MB** | thiếu 43.292 kB (~42,3 MB) so với ngưỡng 2.400.000 kB |
| Số check đạt ngưỡng RAM | **0/50** (đếm lại bằng grep toàn bộ dòng `avail=`; top 5: 2.356.708 / 2.023.404 / 1.938.968 / 1.843.436 / 1.688.884 kB) | — |
| Load1 tại check 5 (đỉnh RAM) | **4,25** — vượt gate load (< 4,0) | chặn kép: dù RAM có vượt ngưỡng, trigger vẫn bị chặn bởi load |
| sibProcs | check 1–4: 13–15; check 5 trở đi: 0 | đỉnh RAM trùng lúc sibling vừa thoát |
| RAM cuối phiên | check 50: 527.276 kB; `free` cuối: avail 527 MB, swap đã dùng 406 MB | khớp F9 |
| `run-f5-hiram.log` | **không tồn tại** → driver hiram chưa chạy lần nào; 0 lượt f6r/f7 | khớp LIMITS F5 §10 ("chưa stage batch") |

**Diễn biến RAM (tóm tắt từ 50 check):** check 1–4 avail 892–959 MB (sibling đang chạy); check 5 nhảy vọt +1.429.752 kB (~+1,4 GB) lên 2.356.708 kB đúng lúc sibProcs 13 → 0 (một process sibling thoát, giải phóng RAM); check 6–50 decay đều ~50–190 MB/check xuống 527 MB; sau check 26 RAM không hồi phục quá ~1.010 MB. Cửa sổ RAM cao (nếu có) chỉ là spike thoáng qua < 1 chu kỳ poll — watcher poll 45 s khó bắt được dạng spike này.

**Lưu ý kiểm chứng:** lần đếm đầu bằng awk cho kết quả sai (38 check ≥ ngưỡng) do lỗi split-array của awk; đếm lại bằng grep + sort cho 0/50, nhất quán với max 2.356.708 kB. Số 0/50 là số đúng, đã đối chiếu 2 phương pháp độc lập.

**Đính chính F9:** không có gì để đính chính. Câu "watcher kết thúc 09:52:26Z, KHÔNG bắt được cửa sổ RAM cao" là chính xác.

## §2. Vì sao KHÔNG đo live mới trong đợt này

- **Reboot #30 lúc 11:26:51Z** (boot `3e4f237a-adf1-47c6-af18-9debf7436cd0`; uptime 11–12 phút lúc G4 làm việc). Mọi tiến trình watcher/driver của F5 đều chết theo reboot #29 → #30; không còn process nào của F5 đang chạy.
- **RAM khả dụng lúc G4 làm việc: 518 MB (11:38Z) → 1.866 MB (11:39Z)** — dao động mạnh theo sibling, thấp hơn nhiều so với dải j (2.173–2.843 MB) và ngưỡng A/B (2.400 MB). Swap đã dùng 331–434 MB.
- **8–9 luồng đợt 105 đang chạy song song** (vd G9 đang dựng verify script + O8, các luồng khác khởi động probe/browser) — load 0,20 → 1,78 trong vài phút. Bất kỳ lượt f6r/f7 nào chạy lúc này cũng rơi vào đúng điều kiện mà F5 §8 đã bác là không giải thích được CAP (RAM thấp + nhiễu), và sẽ làm nhiễu cửa sổ của sibling.
- Kết luận: đo live lúc này không đo được gì mới; ghi rõ làm lý do A/B RAM cao vẫn mở. Quyết định này khớp lệnh brief G4.

## §3. Script A/B còn dùng được không sau reboot #30 (kiểm tra, không sửa)

| File | Trạng thái kiểm tra 11:39Z |
|---|---|
| `hidden_files/round104-f5/wait-hiram.sh` | còn, executable, `bash -n` OK; logic trigger: RAM ≥ 2.400.000 kB + load1 < 4,0 + sibProcs = 0 (grep `probe10[234]\|clicktest\|chrome-linux64\|MiniBrowser\|webkit-2388`, loại `probe104f5`), poll 45 s × 50 check (~37 phút) |
| `hidden_files/round104-f5/run-f5-hiram.sh` | còn, executable, `bash -n` OK; chạy f6r gop250 rồi f7 gop30, log RAM/load đầu mỗi lượt, mtime check + verdict mỗi lượt, timeout 900 s/lượt |
| `apps/web/scripts/probe104f5.mjs` | còn (44.638 byte, mtime 08:43Z), `node --check` OK |
| `apps/web/src/preview.tsx` | md5 `ca378bbf` — **không đổi** so với lúc F5 đo live (F3 `104f3` land 08:44:33Z); vùng đuôi/gate/flatten không đổi |
| `apps/web/src/lib/playheadHold90R2.ts` | md5 `00cce1ac` — không đổi |
| `apps/web/src/lib/driftConfirmSkip103E4.ts` | còn (3.019 byte, mtime 06:28Z, md5 `2748b6f3…`) — module E4 còn nguyên cho A/B toggle đợt sau |
| `hidden_files/round104-f5/run-f5.sh` + analyzer | còn (dùng cho ma trận 6 lượt nếu A/B E4 cần chạy lại toàn bộ) |

**Hạn chế đã biết của script (ghi cho đợt sau, không sửa trong đợt này):** `run-f5-hiram.sh` không kiểm tra lại RAM trước mỗi lượt — một lượt chỉ được tính là "RAM cao" nếu RAM ghi ở đầu lượt đó ≥ 2.400.000 kB (xem tiêu chí §4.1); nếu RAM đã tụt dưới 2.173 MB (đáy dải j) trước khi lượt bắt đầu thì lượt đó phải ghi là lượt RAM thấp, không được tính vào A/B. Đề xuất đợt sau thêm gate RAM trong `run_one` (bỏ lượt + ghi log khi RAM < 2.173.000 kB) trước khi chạy.

## §4. Kế hoạch A/B cho đợt sau (đăng ký trước)

### §4.1 A/B RAM cao — ưu tiên 1 (chạy trước; E4 toggle hoãn lại)

- **Ma trận:** đúng 2 lượt load4 trên cây hiện tại: **f6r gop250** (chạy lại lượt f6 lỗi harness) + **f7 gop30**, bằng `run-f5-hiram.sh` (probe `probe104f5.mjs`, analyzer `analyze-f5-cap-pattern.py` tái dùng).
- **Điều kiện kích hoạt (chính xác, theo `wait-hiram.sh`):** `MemAvailable ≥ 2.400.000 kB` (2.343,75 MiB — trong dải j 2.173–2.843 MB) **và** `load1 < 4,0` **và** `sibProcs = 0` (không process `probe10[234]/clicktest/chrome-linux64/MiniBrowser/webkit-2388` nào, trừ chính probe104f5). Poll mỗi 45 s, tối đa 50 check (~37 phút).
- **Thời điểm chạy watcher — bài học quan trọng nhất:** cửa sổ RAM cao duy nhất quan sát được trong ngày là **09:01:17Z (2.943 MB, boot+5 phút sau reboot #29)** và biến mất sau 19 s khi sibling bật Chrome; watcher F5 khởi động muộn (09:14:54Z, boot+18 phút) nên đã bỏ lỡ. **Đợt sau phải khởi động `wait-hiram.sh` NGAY sau reboot, trước mọi driver khác** (kể cả driver ma trận chính). Nếu không bắt được cửa sổ trong ~5 phút đầu sau boot thì chạy ma trận chính trước, để watcher chạy tiếp sau.
- **Cửa sổ boot+1–2 phút:** sau reboot #29, driver lần 1 (08:57:46Z) fail toàn bộ do WebKit `libevent-2.1.so.7` (môi trường chưa sẵn sàng); nếu trigger rơi vào cửa sổ này thì retry 1 lần sau 60 s, không tính lượt lỗi vào số lượt hợp lệ.
- **Tiêu chí lượt hợp lệ:** verdict PASS + mtime preview.tsx không đổi trong lượt; lượt chỉ được tính là "RAM cao" nếu RAM ghi ở đầu lượt ≥ 2.400.000 kB (tối thiểu chấp nhận được: ≥ 2.173.000 kB = đáy dải j; dưới mức này là lượt RAM thấp, ghi log, không tính vào A/B).
- **Tiêu chí quyết định (đăng ký trước):**
  - CAP/lượt ở RAM cao về **~0** (như j 0/6) **và** freeze-trong-đuôi-mở trung vị về **~1,2 s** → **RAM/swap là nguyên nhân (đủ để giải thích)** — nợ ĐÓNG, không đụng code; E4 không cần A/B.
  - CAP/lượt ở RAM cao vẫn **≥ ~1,5** (như k) **và** freeze vẫn **~4,9 s** → **RAM bị loại** → chuyển sang A/B tắt E4 (§4.2) trong lượt sau.
  - Không bắt được cửa sổ trong ~37 phút → ghi rõ, nợ VẪN MỞ, lặp lại ở đợt sau (ưu tiên bắt cửa sổ ngay sau reboot).

### §4.2 A/B tắt E4 — ưu tiên 2 (chỉ khi RAM cao vẫn cho CAP cao)

- **Biến duy nhất:** E4 fix (`apps/web/src/lib/driftConfirmSkip103E4.ts` + điểm gọi trong `preview.tsx`). Tắt bằng cách tạm thời vô hiệu hoá điểm gọi (giữ file module nguyên), chạy lại đúng ma trận 6 lượt load4 (f1–f6 tương đương, qua `run-f5.sh`), rồi **KHÔI PHỤC NGAY** và kiểm md5 `preview.tsx` về đúng giá trị trước toggle trước khi viết LIMITS. Không revert E5 (đã chứng minh no-op trên phẳng — A/B nó không đo được gì).
- **So sánh trên cùng mức RAM (bắt buộc):** lượt E4-off phải so với lượt E4-on (f1–f5: RAM bắt đầu 1.464–2.015 MB, 2,80 CAP/lượt) ở **cùng dải RAM** — nếu E4-off chạy ở RAM cao còn E4-on ở RAM thấp thì RAM làm nhiễu so sánh. Thực tế: chạy E4-off ở dải RAM thấp như f (1.464–2.015 MB) vì cửa sổ RAM cao hiếm; chỉ khi đó chênh lệch CAP/lượt mới quy được cho E4.
- **Tiêu chí quyết định:** CAP/lượt E4-off về ~0 ở cùng dải RAM → E4 có đóng góp (khi đó mới sửa production kèm unit test + tsc/vite build/test liên quan). CAP/lượt E4-off vẫn ~2,8 → E4 được minh oan; nghi phạm còn lại là thay đổi `preview.tsx` 06:38:03 hoặc yếu tố môi trường chưa đo (swap/IO) — ghi làm nợ mở, KHÔNG đoán thêm fix.
- **Rủi ro va chạm:** chỉ toggle trong cửa sổ yên, khôi phục ngay sau ma trận (ước ~12 phút); sibling đang sửa `preview.tsx` thì mtime-đổi sẽ loại lượt theo quy định; ghi rõ md5 trước/sau toggle trong log.

### §4.3 Những gì KHÔNG làm trong A/B

- Không A/B E5 trên phẳng (đã chứng minh cấu trúc no-op, F5 §3.1/§4).
- Không đo TTS 39, không đụng birefnet, không đụng `.github/workflows/*`, không đụng cloud/collab.
- Không sửa production trước khi A/B chứng minh được nguyên nhân + fix có đo được.

## §5. Nợ còn lại sau G4

1. **A/B RAM cao VẪN MỞ** (nghi phạm số 1 chưa được kiểm ở mức cao) — kế hoạch ở §4.1; cần cửa sổ RAM ≥ 2.400 MB, thường chỉ xuất hiện ngay sau reboot.
2. **A/B tắt E4 hoãn lại** — chỉ chạy nếu RAM cao vẫn cho CAP cao (§4.2); E4 vẫn là nghi phạm chưa loại được vì confound thời gian hoàn hảo, nhưng KHÔNG có đường cơ chế (vị ngữ thuần, chỉ bỏ 1 lần `renderFrame`).
3. **E3 CDP** là confound thứ ba — đo live máy yên đợt sau tự động loại (không có E3 chạy cùng lúc nữa).
4. Thay đổi `preview.tsx` 06:38:03 (md5 → `c2251e39`) chưa xác định được nội dung — chỉ vào diện nghi phạm nếu cả RAM cao lẫn E4-off đều không giải thích được CAP.
5. Batch F5+G4 đã stage (không push): `~/workspace/repo-1-push/paths-loop/phase9-round105-g4-rearm.txt`.

## Phụ lục — file liên quan

- LIMITS F5 (gốc, đã cập nhật §10b): `docs/PHASE9_ROUND104_F5_REARM_LIMITS.md`
- Log G4: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round105-g4/round105-g4.md`
- Dữ liệu watcher: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f5/wait-hiram.out` (50 check), `wait-hiram.sh`, `run-f5-hiram.sh` (chưa từng chạy — không có `run-f5-hiram.log`)
- Probe F5 (thêm đợt 104, stage kèm trong batch G4): `apps/web/scripts/probe104f5.mjs`
- Stage (không push): `~/workspace/repo-1-push/paths-loop/phase9-round105-g4-rearm.txt`
