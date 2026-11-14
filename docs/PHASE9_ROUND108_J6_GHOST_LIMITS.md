# PHASE9_ROUND108_J6_GHOST_LIMITS — C3b chạy lại lúc MÁY YÊN: ĐẠT bar; spread đuôi ~75 là THẬT; F6' vẫn mở

> Luồng J6, đợt 108, lượt cron 03:35 +07 14/11/2026 (20:35Z 13/11). Repo `~/workspace/repo-1`
> (cây làm việc, KHÔNG có `.git` local — push qua API như các đợt trước).
> Nợ đợt 107 (LIMITS gộp §4 mục 8): (a) chạy lại C3b lúc máy yên; (b) spread
> đuôi lỏng max ~75 vẫn mở; (c) F6' pixel-verified skipLatest cho WebKit vẫn mở.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào — preview.tsx
> ĐÓNG BĂNG cả đợt (md5 `ced42efd…` trước/sau mọi lượt). Không đụng TTS 39,
> birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính (4 ý):**
> 1. **C3b chạy lại lúc máy yên ĐẠT bar: clean distinct hậu flip+2000ms
>    74/94 = 78,7%** (bar ≥70% và ≥ D+20pt = 68,6%; +30,1pt vs baseline flip D
>    48,6%). Độ phủ anchor tươi 98,0% — cao nhất từ trước. Cặp xác nhận
>    độc lập lúc yên: C3 81,6% + C3b-quiet 78,7% — flip-leg trên code land
>    ĐẠT bar vững, không phải 1 run may mắn.
> 2. **Spread đuôi lỏng ~75 là THẬT, không phải hiệu ứng mật độ:** gộp 6 run
>    flip (562 nhóm cửa sổ đã vẽ), max-drawn 75,4; 3 run độc lập đạt ≥70;
>    theo frame max ~75,5 ở CẢ 6 RUN; max không giảm theo nGroups (137 nhóm
>    vẫn 74,7). Cơ chế: gStd lưỡng đỉnh (pause ~112 vs play ~37,5).
> 3. **F6' WebKit KHÔNG đo được trong lượt này** — driver ghost hiện tại là
>    Chromium-CDP thuần, không chạy được trên WebKit; Playwright webkit-2388
>    có sẵn nhưng chưa có driver ghost cho WebKit. Ghi nợ có căn cứ (§5),
>    không claim suông.
> 4. **Không hồi quy:** tsc 0, vite build PASS (14,67s), ghostBlend 15/15,
>    previewEngine 27/27 — trên cây đóng băng `ced42efd…`.

## 0. Môi trường đo + bar đăng ký trước

- Boot **mới sau reboot #34 = 2026-11-13 20:34:17Z** (`uptime -s` đo trực
  tiếp lúc bắt đầu; gap #33→#34 = 5h43'18"). Reboot #35 chưa xảy ra trong
  suốt phiên J6 (kiểm lại cuối phiên vẫn cùng boot). RAM khả dụng: ~1456 MB
  lúc bắt đầu → 2286 MB đầu C3b-quiet → 1789 MB cuối lượt. Birefnet KHÔNG
  chạy (RAM dưới ngưỡng guard).
- **Code lúc đo:** `preview.tsx` md5 `ced42efd785724c8c0d1b16fc32c7341` (cây H5
  đã sửa comment, không đổi logic). Kiểm lại trước/sau C3b-quiet và sau hồi
  quy: vẫn `ced42efd…`. Không luồng đợt 108 nào khác sửa file này trong
  phiên J6. `round-in-progress.md` KHÔNG tồn tại lúc bắt đầu.
- **Tải lúc bắt đầu — hai lần hoãn trước khi đo được:** lúc nhận việc
  (20:39–20:44Z) load1 2,2–3,5, J4/J5 đang chạy probe (Chromium + vite);
  20:53:44Z cửa yên mở (load1 0,57) nhưng J5 chạy lại noblur-r45 ngay lúc
  20:53:58Z nên hoãn lần 2; cửa yên mở lại 20:59:40Z (J4 driver done,
  J5 driver done, không còn process probe nào, load1 1,23) → bắt đầu
  C3b-quiet 20:59:56Z ở load1 0,96 / load5 1,89. Nhóm nặng (J3/J7) chờ đủ 3 cờ
  round108-j4/j5/j6-done — lúc J6 bắt đầu mới có 0/3 cờ (J4 tạo cờ lúc
  ~20:57Z, J2 tạo cờ lúc ~21:04Z — không nằm trong 3 cờ J7 chờ).
- **Bar đăng ký trước** (ghi trong `round108-j6/prereg-j6.md` TRƯỚC khi đo,
  không đổi sau khi thấy số; kế thừa bar G1/H5/I1): run C3b-quiet, case B,
  20 pass, `--disable-rvfc`, flip rVFC sau pass 5, tap ON + relabel ON
  (mặc định), hậu flip+2000ms, analyzer MỚI H5 (dedup theo
  (label, pix, labelSrc) + kèm mọi occurrence). ĐẠT khi clean distinct
  ≥70% VÀ hơn baseline flip D (48,6%) ≥20 điểm (tức ≥68,6%). Kỳ vọng nếu
  verdict "phụ thuộc tải" đúng: ≈81,6% (mức C3) ± nhiễu; độ phủ kỳ vọng
  trở lại ~92–97%. Cửa bắt đầu: load1 <2 VÀ load5 <2 VÀ không còn process
  probe/vite/chromium nào của luồng đợt 108 khác đang chạy VÀ chưa có cờ
  round108-*-done nào của luồng nặng xuất hiện trước lúc bắt đầu. Lượt
  HỢP LỆ (yên) khi phủ ≥90% VÀ tickCost trung vị ≤13ms VÀ rAF gap trung
  vị ≤25ms; nếu không thì là "nhiễm tải", ghi rõ và chạy lại (tối đa 2 lần).
  Nếu C3b-yên ĐẠT → chạy thêm 1 lượt xác nhận C3c CHỈ KHI máy vẫn yên;
  nếu máy đã ồn thì 1 lượt sạch là đủ.
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
  WebKit: KHÔNG chạy được (không có driver ghost, như G1/H5/I1) — xem §5.
- Vite riêng J6 trên **5183**, config tạm `vite.config.j6-temp.ts` (HMR TẮT,
  đóng băng code lúc khởi động). Probe dùng `--url http://localhost:5183/`.
  Sau khi đo xong: vite đã tắt, config tạm đã XOÁ (không stage).

## 1. Những gì J6 đã làm

| Bước | Nội dung | Kết quả |
|---|---|---|
| 1 | Đọc LIMITS G1/H5/I1 + dữ liệu H5/I1 (driver, analyzer, JSON C3/C3b) | Bối cảnh §0 |
| 2 | Viết prereg (bar C3b, bar spread, F6', quy tắc hoãn) TRƯỚC khi đo | `round108-j6/prereg-j6.md` |
| 3 | Hoãn 2 lần vì J4/J5 đang probe (ghi chain log, không chạy đè tải) | §2 |
| 4 | Đo C3b-quiet trên cây đóng băng, máy yên | §3 — 78,7%, ĐẠT bar |
| 5 | Tính gộp spread 5 run cũ + run mới (tính trực tiếp từ JSON) | §4 — đuôi ~75 là THẬT |
| 6 | Đánh giá F6' (đọc code skipLatest + driver + hạ tầng WebKit) | §5 — không đo được, nợ có căn cứ |
| 7 | Quyết định KHÔNG chạy C3c (máy ồn lại ngay sau lượt) | §3.3 |
| 8 | Kiểm chứng hồi quy trên cây đã đo: tsc, vite build, ghostBlend, previewEngine | §6 — tất cả xanh |
| 9 | Dừng vite, xoá config tạm, viết LIMITS này, stage batch | §7 |
| 10 | Tạo cờ `round108-j6-done` SAU KHI mọi việc xong (mở cửa nhóm nặng) | §7 |

## 2. Phối hợp tải — hai lần hoãn (ghi rõ để đợt sau rút kinh nghiệm)

- **Hoãn lần 1 (20:39–20:53Z):** J4/J5 (nhóm yên đợt 108, cùng với J6) chạy
  probe từ ~20:41Z — J4 B-band 8 lượt (r44c0→r47, xong 20:51:44Z), J5 cụm A
  6 lượt (xong đợt 20:43:46Z rồi chạy lại). Load1 2,2–3,5, chưa <2. J6 chỉ
  chuẩn bị script/prereg + đánh giá F6' (việc nhẹ, không tạo tải) trong lúc
  chờ, đúng quy định "trong lúc chờ cổng yên chỉ chuẩn bị, không chạy probe".
- **Hoãn lần 2 (20:53:44–20:59:40Z):** cửa yên mở thoáng qua (load1 0,57 lúc
  20:53:44Z, không còn process probe) nhưng J5 chạy lại noblur-r45 ngay
  20:53:58Z — J6 chưa kịp khởi động vite. Bài học: cửa yên giữa các lượt
  của luồng khác chỉ dài ~1–2 phút; muốn chớp phải có script sẵn sàng bấm
  chạy ngay (J6 đã có `run-c3b-quiet.sh` sẵn từ 20:53Z — lần 3 đã chớp
  được trong ~16s sau khi cửa mở).
- **Cửa đo thật (20:59:40–21:02:09Z):** J4 driver done + J5 driver done,
  không còn process probe/vite/chromium nào, load1 0,96–1,23. C3b-quiet
  chạy 20:59:56–21:02:09Z (133s), load cuối 0,98.
- **Nhiễu nhỏ TRONG lượt (ghi rõ, xem §3.2):** J5 khởi động lại r47/r48
  (ENOSPC, vite crash — xem dưới) ngay giữa lượt J6, trùng biên flip.
  Chỉ là launch rồi chết, không phát video; ảnh hưởng bị chặn trong 1 pass.
- **Sau lượt:** máy ồn lại ngay — load1 5,17 lúc 21:04:49Z (J5 phát lại
  chr-code-blur + J1 retry Re-arm; cờ j2 + j4 đã xuất hiện). C3c không chạy
  được (§3.3).
- **Nhận xét về mô hình phối hợp đợt 108:** 5 luồng đo (J1/J2/J4/J5/J6)
  cùng chia sẻ 1 cell 1,5 CPU, mỗi luồng đều cần cửa yên — cửa yên thật
  (không còn browser nào khác) rất hiếm và ngắn (~2–3 phút giữa các đợt
  probe). Đợt sau nên xếp các lượt đo yên nối tiếp nhau theo lịch hẹn
  (ai đo trước/sau) thay vì để 5 luồng cùng poll chờ yên — như đợt này J6
  phải hoãn 2 lần và suýt mất lượt.

## 3. Run C3b-quiet — flip-leg chạy lại lúc MÁY YÊN: ĐẠT BAR

| Chỉ số | C3b-quiet (J6, yên) | C3 (I1, yên) | C3b (I1, nhiễm tải) | C2b (H5, tải nặng) |
|---|---|---|---|---|
| BlendTick / pass | 1892 / 20 pass | 1850 / 20 pass | 720 / 20 pass | 935 / 20 pass |
| Khung rAF / pass | 30–131 (đa số 100+) | 31–131 | 23–65 | 36–77 |
| **Clean distinct hậu flip+2000ms** | **74/94 = 78,7%** | **80/98 = 81,6%** | **94/153 = 61,4%** | **97/154 = 63,0%** |
| Bar (≥70% và ≥ D+20pt = 68,6%) | **ĐẠT (+8,7pt / +10,1pt)** | Đạt | KHÔNG ĐẠT | KHÔNG ĐẠT |
| Hơn baseline flip D (48,6%) | **+30,1pt** | +33,0pt | +12,8pt | +14,4pt |
| Nhãn tap clean (distinct) | 67/76 = 88,2% | 68/73 = 93,2% | 67/88 = 76,1% | 67/90 = 74,4% |
| Nhãn frameIdx clean (distinct) | 7/18 = 38,9% | 12/25 = 48,0% | 27/65 = 41,5% | 30/64 = 46,9% |
| Độ phủ anchor tap hậu flip (tick) | 1476/1506 = **98,0%** | 1451/1488 = 97,5% | 329/479 = 68,7% | 549/666 = 82,4% |
| Clean mọi occurrence | 2926/2997 = **97,6%** | 2870/2943 = 97,5% | 626/823 = 76,1% | 1048/1242 = 84,4% |
| Mọi occurrence: tap / fallback | 98,6% / 53,1% (n=64) | 98,6% / 54,7% (n=75) | 86,5% / 46,5% | 92,5% / 47,8% |
| Gap presented−expected \|≤3\| | 100% mọi cửa sổ | 100% | 100% | 100% |
| Gap tại seek hậu flip | 0 hoặc 1 (14/14 seek) | 0 hoặc 1 | 0 hoặc 1 | 0 hoặc 1 |
| tickCost total trung vị / p90 | 11,4 / 15,0 ms | 11,6 / 18,1 ms | 17,8 / 85,2 ms | 13,4 / 72,8 ms |
| rAF gap blend-tick trung vị / p90 | 19,1 / 31,3 ms | 19,5 / 34,1 ms | 74,8 / 118,1 ms | 30,2 / 91,7 ms |

- **C3b-quiet ĐẠT bar với biên đủ rộng (+8,7pt trên 70%, +10,1pt trên
  68,6%)** — không phải sát nút. Phủ 98,0% là cao nhất từ trước tới nay
  (vượt C3 97,5%), tickCost/rAF gap đều trong dải yên, gap |≤3| 100%.
- **Cặp xác nhận độc lập lúc yên: C3 81,6% (n=98) + C3b-quiet 78,7%
  (n=94)** — cả hai cùng đạt bar, chênh nhau 2,9pt, trong nhiễu lấy mẫu
  (SE mỗi run ≈ 4,2pt). Flip-leg trên code land ĐẠT bar vững, không phải
  một run may mắn; nợ H5 §8 mục 1 / I1 §7 mục 1 (chạy lại C3b lúc máy yên)
  **ĐÓNG**.
- **Fallback mọi occurrence vẫn thấp (53,1%, 34/64)** — cùng mẫu như C3
  (54,7%): tập fallback là tập hiếm, đã chọn lọc (chỉ tick mà tap KHÔNG
  tươi trong 50ms — đúng những tick khó nhất), n nhỏ; không suy diễn thêm
  (H5 §4.2 mục 4, I1 §2). Headline không bị ảnh hưởng (fallback chỉ 2,1%
  tick hậu flip).

### 3.1 Gradient phủ → clean (cập nhật I1 §4.2, distinct, cách đếm mới)

| Nguồn | Độ phủ anchor tươi | Clean distinct | Tải ghi nhận |
|---|---|---|---|
| E3 B (cách đếm cũ) | 34% | ~49,5% | tải nặng |
| I1 C3b flip | 68,7% | 61,4% | nhiễm tải giữa lượt (tự gây) |
| H5 C2b flip | 82,4% | 63,0% | tickCost 13,4ms, load1 ~5–6,5 |
| H5 C2 flip | 83,2% | 68,5% | tickCost 14,1ms, load1 ~5–6,5 |
| G1 C flip | 92,4% | 79,2% | tải nhẹ–trung bình |
| G1 B case B | 94,6% | 73,0% | tải nhẹ–trung bình |
| **I1 C3 flip** | **97,5%** | **81,6%** | **máy yên** |
| **J6 C3b-quiet flip** | **98,0%** | **78,7%** | **máy yên** |
| G1 B2 case B | 98,2% | 79,6% | tải nhẹ |
| G1 B3 case B | 99,1% | 86,6% | tải nhẹ nhất |

- Điểm mới duy nhất: C3b-quiet 98,0% → 78,7% thấp hơn C3 97,5% → 81,6%
  2,9pt dù phủ cao hơn 0,5pt — **đảo nhẹ ở đầu dải phủ cao**, trong nhiễu
  lấy mẫu (n≈95, SE ≈ 4pt); không lật gradient (độ dốc gradient nằm ở
  dải phủ 69–83%, nơi clean rơi 61–68,5%). Hai run yên gộp: phủ 97,7%,
  clean 80,1% (154/192) — đầu dải cao bão hoà quanh ~80%, đúng kỳ vọng
  "phủ cao → clean cao nhưng có trần nhiễu".
- **Giới hạn như H5/I1:** tải KHÔNG kiểm soát — là tải nền từ các luồng
  khác, không phải tải tổng hợp do J6 tạo. Gradient trên là quan sát,
  không phải thí nghiệm A/B tải.

### 3.2 Nhiễu nhỏ trong lượt — J5 r47/r48 chết ENOSPC trùng biên flip

- J5 khởi động lại driver lúc ~21:00:00Z (ngay sau khi J6 bắt đầu 20:59:56Z):
  r47 "phat" 21:00:00Z, chromium launched 21:00:31Z, **exit=2 lúc 21:00:33Z**;
  r48 "phat" 21:00:33Z, vite lên 21:00:36Z, Xvfb 21:00:37Z, chromium launched
  21:00:38Z, **exit=2 lúc 21:00:39Z**. Nguyên nhân (đọc trực tiếp log J5):
  `vite-attempt1.log` — `Error: ENOSPC: System limit for number of file
  watchers reached` (max_user_watches=63747) — cùng nghẽn hạ tầng I5 đợt 107
  / J1 đợt 108. Cả hai lượt đều chết ở khâu launch, **KHÔNG phát video**
  (không có khung play nào trong log J5).
- Thời điểm trùng biên flip của J6: flip wallMs=32274 (~21:00:35Z, tính từ
  page load ~21:00:03Z). J5 launch/chết 21:00:31–21:00:39Z trùng đúng
  flip + 4s đầu cửa sổ hậu flip+2000ms.
- **Ảnh hưởng đo được, bị chặn trong 1 pass:** phủ theo pass hậu flip:
  pass 6: 6/7 = 86% (n=7, nhỏ); **pass 7: 30/40 = 75%** (pass duy nhất
  dưới 95%); pass 8–20: 95–100% (13/13 pass ≥95%, 6 pass 100%). Pass 7
  chỉ chiếm 40/1506 tick hậu flip (2,7%). Nếu loại pass 7, phủ gộp là
  1446/1466 = 98,6% (so với 98,0% có pass 7) — headline 78,7% có thể bị
  kéo xuống tối đa ~1pt bởi nhiễu này, không đổi kết luận ĐẠT bar.
- **Phân loại theo bar prereg:** lượt HỢP LỆ (yên) — phủ 98,0% ≥90% ✓,
  tickCost trung vị 11,4ms ≤13ms ✓, rAF gap trung vị 19,1ms ≤25ms ✓.
  Ghi rõ nhiễu thay vì giấu; không chạy lại vì máy sau lượt đã ồn lại
  (§3.3) và ảnh hưởng đã lượng hoá là nhỏ.

### 3.3 C3c — KHÔNG CHẠY (quyết định theo prereg, ghi rõ)

- Máy ồn lại ngay sau lượt: load1 5,17 lúc 21:04:49Z (J5 phát lại
  chr-code-blur, J1 retry Re-arm với load 8,59 lúc 21:04:09Z); cờ
  round108-j2-done + round108-j4-done đã xuất hiện. Prereg J6: "nếu máy
  đã ồn thì 1 lượt sạch là đủ".
- C3 (81,6%) + C3b-quiet (78,7%) đã là **cặp xác nhận độc lập cùng đạt bar
  lúc yên** — giá trị biên của lượt thứ ba (C3c) thấp, rủi ro nhiễm tải cao.
  Không chạy C3c; không để nợ mở cho việc này.

## 4. Spread — đuôi lỏng max ~75: THẬT, không phải hiệu ứng mật độ (ĐÓNG)

Tính gộp trực tiếp từ JSON gốc 6 run flip cùng protocol/cây (C, C2, C2b, C3,
C3b-cũ, C3b-quiet) — xem `round108-j6/spread-j6-analysis.md`. Khóa chính:
`gStdSpreadDrawn` (theo cửa sổ đã vẽ, T2); phụ: `gStdSpread` (theo frameIdx).

| Run | Điều kiện | DRAWN nGroups / med / max | FRAME nGroups / med / max |
|---|---|---|---|
| C (G1) | yên nhẹ | 137 / 0,8 / **74,7** | 186 / 45,9 / 75,6 |
| C2 (H5) | tải nặng | 74 / 0,5 / 47,5 | 169 / 45,9 / 75,7 |
| C2b (H5) | tải nặng | 73 / 0,9 / **75,4** | 186 / 45,8 / 75,7 |
| C3 (I1) | yên | 116 / 0,6 / 47,8 | 183 / 0,9 / 75,4 |
| C3b (I1) | nhiễm tải | 36 / 0,6 / **75,4** | 169 / 45,8 / 75,5 |
| **C3b-quiet (J6)** | **yên** | **126 / 0,7 / 47,8** | **196 / 0,8 / 75,4** |
| **GỘP** | | **562 nhóm** | **1089 nhóm** |

- **Verdict theo bar prereg J6 §(b) (đăng ký trước): đuôi ~75 là THẬT.**
  Max-drawn gộp 75,4 (≥70 ✓); **3/6 run độc lập đạt max-drawn ≥70**
  (C 74,7; C2b 75,4; C3b-cũ 75,4 ✓); nhóm spread >40 trong phần yên gộp
  (C+C3+C3b-quiet = 379 nhóm) >0 — riêng mỗi run đã có ≥5 nhóm >40 trong
  top-5 (C3b-quiet top-5 drawn: 47,8; 47,5; 47,3; 47,3; 47,2 ✓).
- **Giả thuyết "hiệu ứng mật độ" BỊ BÁC:** max KHÔNG giảm đơn điệu theo
  nGroups — 36 nhóm → 75,4; 73 → 75,4; 74 → 47,5; 116 → 47,8;
  **137 nhóm (lớn nhất) → 74,7**; run mới 126 nhóm → 47,8. Run nhiều
  nhóm nhất vẫn chạm ~75 — ngược hướng dự đoán của giả thuyết mật độ.
- **Theo frame, max ~75,5 ổn định ở CẢ 6 RUN** (75,4–75,7) với 169–196
  nhóm mỗi run, bất kể tải/yên. Artifact mật độ lấy mẫu không thể cho max
  gần như hằng số qua 6 run độc lập. Run mới bổ sung thêm 2 nhóm đuôi
  ~75 theo frame (frameIdx 56: 75,4; 58: 74,2).
- **Cơ chế cấu trúc (không phải nhiễu):** gStd lưỡng đỉnh — pause ~111–112
  vs play triple-blend ~37,5; hiệu ~75 ≈ 112,4 − 37,0. Bất kỳ nhóm nào
  trộn 1 mẫu gần-pause (khung chưa blend / sau seek / stall) với mẫu blend
  thường (~37,5) đều cho spread ≈75. Đuôi là hệ quả thật của phân bố lưỡng
  đỉnh này, không phải của n nhỏ.
- **Nuance trung thực:** khóa cửa sổ đã vẽ đôi khi KHÔNG bắt được đuôi
  hiếm — C2/C3/C3b-quiet max-drawn chỉ ~47,5–47,8 dù theo frame vẫn ~75,5.
  Max-drawn là ước lượng DƯỚI của đuôi (under-estimate khi đuôi hiếm),
  không phải ước lượng trên; báo max-drawn 47,8 ở C3/C3b-quiet không chứng
  minh đuôi đã hết. Median spread nhỏ (0,5–0,9 drawn) nghĩa là ĐA SỐ cửa
  sổ ổn định; đuôi là thiểu số nhóm (≥5 nhóm >40/run chỉ tính riêng top-5;
  tỉ lệ thật không tính được vì JSON chỉ lưu top-5 + aggregates).
- **Hệ quả:** spread đuôi lỏng **ĐÓNG** ở mức "tồn tại thật trong dữ liệu".
  Việc đuôi này có cần fix sản phẩm không vẫn là câu hỏi mở (nối G1 §4.4 /
  H5 §8 mục 3: headline phụ thuộc độ phủ — đuôi spread là một mặt khác của
  cùng hiện tượng cửa sổ blend không ổn định). Không mở thêm lượt đo spread
  riêng; mọi run flip sau này tự động đóng góp thêm nhóm vào pool.

## 5. F6' — pixel-verified skipLatest cho WebKit: VẪN MỞ (nợ có căn cứ)

**Không đo được trong lượt này. Ghi rõ cần gì — không claim suông.**

### 5.1 skipLatest là gì (đọc code thật, `preview.tsx:2934`)

```ts
const skipLatest = frameIdx >= 0 && lastCaptured !== undefined && lastCaptured === presented;
const ghostPool = skipLatest ? arr.slice(0, arr.length - 1) : arr;
```

Khi pump đã bắt kịp frame đang trình chiếu (`lastCaptured === presented`),
snapshot mới nhất bị loại khỏi pool ghost (không dùng frame hiện tại làm
ghost cho chính nó) — blend dùng các snapshot cũ hơn. Quyết định ghi vào
stash `blendPresentedFrame` (`skippedLatest: 0/1`, `ringSize`, `presented`)
và debug state `dbg.lastDrawnSkippedLatest` — chính là thứ probe ghost đọc
để kiểm chứng trên Chromium (mỗi pass log đều có `lastDrawnSkippedLatest`).
Pixel-verified nghĩa là: đối chiếu pixel của cửa sổ blend đã vẽ với
ground-truth frame để chứng minh snapshot bị skip thật sự không có mặt
trong ảnh blend (chứ không chỉ tin cờ `skippedLatest`).

### 5.2 Vì sao không đo được trong lượt này

- **Driver ghost hiện tại là Chromium-CDP thuần:** `probe104f3-ghost-j6.cdp.mjs`
  spawn trực tiếp binary `chromium-1254`, mở `--remote-debugging-port=9229`,
  nói CDP websocket thô (`Page.enable`, `Runtime.enable`, `Page.navigate`,
  `Runtime.evaluate`). Không có lớp trừu tượng engine — không chạy được
  trên WebKit bằng cách đổi cờ.
- **Không có driver ghost cho WebKit** (G1 §0, H5 §7, I1 §7.3 — vẫn đúng).
  Repo CÓ probe WebKit khác (`probe93u3-rvfc-webkit.mjs`,
  `probe94v4-rvfc-webkit.mjs`, clicktest-webkit-*) dùng Playwright WebKit,
  nhưng không probe nào trong số đó đo ghost/pixel-strip theo protocol
  flip (case B, 20 pass, flip sau pass 5).
- **Playwright webkit-2388 CÓ sẵn** trong `~/.cache/ms-playwright/` — hạ tầng
  chạy WebKit không phải rào cản. Rào cản là công viết driver mới.
- **Trên WebKit, tap/relabel vô dụng theo thiết kế** (H5 §7: rVFC không tồn
  tại trên WebKitGTK nên anchor tap không nuôi được presented) — skipLatest
  trên WebKit chạy trên đường tick với anchor frameIdx, timing pump khác
  Chromium (decode qua GStreamer). Kết quả Chromium không suy ra được cho
  WebKit; phải đo riêng.
- **GStreamer:** mọi probe WebKitGTK sau này phải export
  `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` (I3 đợt 107:
  thiếu biến này thì video crash ngay lúc tạo media pipeline).

### 5.3 Cần gì để đóng F6' (cho luồng riêng sau này)

1. Port driver ghost sang **Playwright WebKit**: launch webkit-2388, mở
   editor, `page.evaluate` thay cho CDP `Runtime.evaluate`; giữ nguyên
   protocol (case B, 20 pass, flip sau pass 5, tap/relabel OFF vì vô dụng
   trên WebKit — hoặc đo cả hai để chứng minh chúng vô dụng bằng pixel).
2. Pixel readback: đọc strip 48px từ canvas blend đã vẽ trên WebKit
   (cùng `snap_strip`/`match_set` với ground-truth frames `round97-y2/`).
3. Thiết kế đo: với mỗi blend tick có `skippedLatest=1`, kiểm tra pixel
   ghost tương ứng với frame `presented` có vắng mặt trong cửa sổ blend
   không (so với tick `skippedLatest=0` làm đối chứng); bar đăng ký trước
   kiểu: ≥90% tick skipLatest=1 không chứa pixel của frame presented
   trong ghost pool.
4. Ước lượng: 1 luồng riêng, không nhét chung với lượt đo khác (port driver
   + hiệu chuẩn timing WebKit là việc chính, không phải chạy thêm 1 lượt).
   Không thử launch WebKit nửa vời trong lượt này để tránh thêm nhiễu cho
   các luồng J1/J5 đang chạy (J6 đã không launch WebKit lần nào).

## 6. Kiểm chứng hồi quy (cây đóng băng, md5 `ced42efd…`)

- `tsc` apps/web (`npx --prefix apps/web tsc --noEmit -p apps/web/tsconfig.json`): **exit 0** (21:05:51Z).
- `vite build` (từ `apps/web`, config gốc): **PASS 14,67s** (cảnh báo chunk >500kB có từ trước).
- `ghostBlend.probe.test.ts` (`node --experimental-strip-types`): **15/15 PASS**.
- `previewEngine.test.ts`: **27 test passed**.
- Không sửa file production nào; không đụng drift Y4 / watchdog Y5 /
  clip-change Y7 / re-arm Z3 / TTS 39 / birefnet / `.github/workflows`.
- Phương pháp kiểm chứng chéo của J6: analyzer flip + analyzer ghost chạy
  trên JSON mới; script đo phủ/tickCost/rAF-gap của J6 đã kiểm chứng trước
  bằng cách tái tạo đúng số C3 của I1 (phủ 97,5%, tickCost 11,6/18,1,
  rAF gap 19,5/34,1) trước khi áp lên dữ liệu mới.

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND108_J6_GHOST_LIMITS.md` — file này. **File duy nhất
  trong repo mà J6 thay đổi** (J6 là luồng đo, cây đóng băng — không sửa code).
- XOÁ (không stage): `apps/web/vite.config.j6-temp.ts` — config tạm của J6,
  xoá sau khi đo xong như kế hoạch (như H5/I1).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round108-j6-ghost.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round108-j6/`
  (prereg-j6.md, j6-done-note.md, chain-j6.log, run-c3b-quiet.sh,
  run-c3b-quiet.log, vite-5183-j6.log, preview-b-f3-flip-land-c3b-quiet.json
  7.556.244 byte, analyze-flip-j6-runC3b-quiet.txt,
  analyze-ghost-j6-runC3b-quiet.txt, spread-j6-analysis.md,
  probe104f3-ghost-j6.cdp.mjs, analyze106h5-ghost-flip-j6.py,
  analyze106h5-ghost-j6.py, regression-j6.log).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền lệ H5/I1:
  chỉ LIMITS + file repo; dữ liệu đo ở lại hidden_files, đủ để kiểm chứng lại).
- Cờ xong: `hidden_files/round108-j6-done` (tạo SAU KHI mọi lượt probe +
  hồi quy + LIMITS đã xong — nhóm nặng J3/J7 chờ cờ này; bài học I1/C3b
  đợt 107 đã được áp dụng đúng: không tạo cờ sớm).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Ghost flip-leg — ĐÓNG ở mức đo lường.** Cặp yên C3 81,6% + C3b-quiet
   78,7% cùng đạt bar; C3b nhiễm tải cũ đã được thay bằng lượt sạch.
   Không cần thêm lượt flip trên cây này trừ khi code flip đổi.
2. **Spread đuôi lỏng — ĐÓNG ở mức "tồn tại thật".** Đuôi ~75 có thật
   (cơ chế lưỡng đỉnh gStd). Câu hỏi còn lại là sản phẩm: có cần giảm
   đuôi bằng cách ổn định cửa sổ blend (nới gate tap 50ms → 75ms, tăng phủ
   dưới tải) không — nối G1 §4.4 / H5 §8 mục 3, chờ quyết hướng fix.
3. **F6' WebKit — VẪN MỞ.** Cần 1 luồng riêng port driver ghost sang
   Playwright WebKit (§5.3). Không đo bằng Chromium rồi suy ra WebKit.
4. **ENOSPC inotify watchers 63747 — nghẽn hạ tầng, tái diễn trong lượt
   này:** J5 r47/r48 chết ENOSPC ngay giữa lượt J6; J1 cũng chết ENOSPC
   20:48Z. Cân nhắc tăng max_user_watches ở cấp hệ thống (ngoài phạm vi
   luồng đo — cần quyền hệ thống), hoặc xếp các vite không chạy chồng nhau.
5. **Phối hợp 5 luồng đo cùng 1 cell:** cửa yên thật rất hiếm/ngắn; đợt sau
   nên xếp lịch nối tiếp cho các lượt đo yên thay vì để các luồng cùng poll
   chờ yên (§2).
6. **Nợ khác đứng yên theo LIMITS gộp đợt 107 §4:** G1 chờ user quyết metric
   (G5/M2); mù #22 chờ user quyết; Re-arm A/B tắt E4 (J1 đang làm);
   2 MiB (queue2 ứng viên, J2 đang làm); Zombie gate (b); B-band c0
   (J4 đang làm); cụm A E6 (J5 đang làm); Harness G4 flake; EPERM probe #27
   + mù #26; birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml 403;
   release gate không đổi.
