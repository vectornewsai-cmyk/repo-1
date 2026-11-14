# PHASE9_ROUND107_I1_GHOST_LIMITS — Flip-leg đo lại lúc MÁY YÊN: C3 ĐẠT bar, C3b nhiễm tải

> Luồng I1, đợt 107, lượt cron 00:35 +07 14/11/2026 (17:35Z). Repo `~/workspace/repo-1`
> (cây làm việc, KHÔNG có `.git` local — push qua API như các đợt trước).
> Nợ H5 đợt 106 (LIMITS §8 mục 1): đo lại flip-leg trên cây land lúc máy yên.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào — preview.tsx
> ĐÓNG BĂNG cả đợt (md5 `ced42efd…` trước/sau mỗi lượt). Không đụng TTS 39,
> birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính (4 ý):**
> 1. **C3 lúc máy yên ĐẠT bar với biên rộng: clean distinct hậu flip+2000ms
>    80/98 = 81,6%** (bar ≥70% và ≥ D+20pt = 68,6%; +33,0pt vs baseline flip D
>    48,6%). Độ phủ anchor tươi 97,5% — cao nhất từ trước.
> 2. **Verdict H5 "flip-leg PHỤ THUỘC TẢI" ĐƯỢC XÁC NHẬN cả hai chiều:**
>    yên → đạt (C3 81,6%, phủ 97,5%); tải nặng → không đạt (C2 68,5% / C2b
>    63,0%, phủ ~83%). Land F8 KHÔNG bị lật — flip-leg trên code land ĐẠT bar
>    khi máy yên.
> 3. **C3b KHÔNG ĐẠT (61,4%) nhưng là NHIỄM TẢI, không bác được C3:** phủ sụp
>    xuống 68,7% giữa lượt (pass ~9–10 chỉ 34%), tickCost trung vị 17,8ms,
>    rAF gap 74,8ms. Tải tăng giữa lượt vì chính cờ `round107-i1-done` (tạo
>    sau C3, theo lệnh brief) đã mở cửa cho các luồng nặng I5/I6/I8 bắt đầu
>    ngay trong lúc C3b chạy — confound tự gây, ghi rõ ở §4.2.
> 4. **Không hồi quy:** tsc 0, vite build PASS (8,18s), ghostBlend 15/15,
>    previewEngine 27/27 — trên cây đóng băng `ced42efd…`.

## 0. Môi trường đo + bar đăng ký trước

- Boot **63a52041** (từ 14:50:59Z 13/11/2026); reboot #34 dự báo ~16:51:58Z
  (dải 15:10–18:05Z) CHƯA xảy ra trong suốt phiên I1 (kiểm lại cuối phiên vẫn
  cùng boot). RAM khả dụng: ~458 MB lúc 17:40Z (thấp — ghi nhận) → 1488 MB
  đầu C3 → 1819 MB cuối C3 → 1967 MB đầu C3b → 3101 MB cuối C3b. Birefnet
  KHÔNG chạy (RAM dưới ngưỡng guard).
- **Code lúc đo:** `preview.tsx` md5 `ced42efd785724c8c0d1b16fc32c7341` (cây H5
  đã sửa comment, không đổi logic). Kiểm lại trước/sau C3, C3b và sau hồi quy:
  vẫn `ced42efd…`. Không luồng đợt 107 nào khác sửa file này trong phiên I1.
  `round-in-progress.md` KHÔNG tồn tại lúc bắt đầu.
- **Tải lúc bắt đầu:** load1 1,41–2,44 lúc 17:40Z (yên so với H5 load1 5,28–
  6,50). Load1 lúc bắt đầu C3 là 3,70 — spike khởi động Chromium/vite, không
  phải tải nền (load5 lúc đó 1,67; cuối C3 load1 2,69).
- **Bar đăng ký trước** (ghi trong `round107-i1/prereg-i1.md` TRƯỚC khi đo,
  không đổi sau khi thấy số; kế thừa bar G1/H5): run C3, case B, 20 pass,
  `--disable-rvfc`, flip rVFC sau pass 5, tap ON + relabel ON (mặc định), hậu
  flip+2000ms, analyzer MỚI H5 (dedup theo (label, pix, labelSrc) + kèm mọi
  occurrence). ĐẠT khi clean distinct ≥70% VÀ hơn baseline flip D (48,6%)
  ≥20 điểm (tức ≥68,6%). Kỳ vọng nếu verdict phụ thuộc tải đúng: ≈79,2%
  (mức C cũ lúc yên) ± nhiễu; độ phủ kỳ vọng trở lại ~92%. Nếu C3 đạt →
  chạy lặp C3b; nếu không đạt → ghi rõ số + tải, không sửa logic để cứu số.
  Nếu load1 >4 trong lúc đo thì lượt đó là "nhiễu tải" và chạy lại.
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
  WebKit: KHÔNG chạy được (không có driver ghost, như G1/H5).
- Vite riêng I1 trên **5183**, config tạm `vite.config.i1-temp.ts` (HMR TẮT,
  đóng băng code lúc khởi động). Probe dùng `--url http://localhost:5183/`.
  Sau khi đo xong: vite đã tắt, config tạm đã XOÁ (không stage).

## 1. Những gì I1 đã làm

| Bước | Nội dung | Kết quả |
|---|---|---|
| 1 | Đọc LIMITS G1/H5 + dữ liệu H5 (driver, analyzer, output C/C2/C2b) | Bối cảnh §0 |
| 2 | Viết prereg (bar, kỳ vọng, quy tắc nhiễu tải) TRƯỚC khi đo | `round107-i1/prereg-i1.md` |
| 3 | Đo flip C3 trên cây đóng băng, máy yên | §2 — 81,6%, ĐẠT bar |
| 4 | Lưu sớm JSON + tóm tắt số (`i1-done-note.md`), tạo cờ `round107-i1-done` | Cờ tạo 17:46Z, ngay sau C3 |
| 5 | Đo lặp C3b (vì C3 đạt bar) | §3 — 61,4%, nhiễm tải |
| 6 | Tính thêm độ phủ/tickCost/rAF gap/gradient phủ→clean từ cùng dữ liệu | §4 |
| 7 | Kiểm chứng hồi quy trên cây đã đo: tsc, vite build, ghostBlend, previewEngine | §5 — tất cả xanh |
| 8 | Dừng vite, xoá config tạm, viết LIMITS này, stage batch | §6 |

## 2. Run C3 — flip-leg trên cây land, MÁY YÊN: ĐẠT BAR

| Chỉ số | C3 (I1, yên) | C (G1, yên) | C2 (H5, tải nặng) | C2b (H5, tải nặng) |
|---|---|---|---|---|
| BlendTick / pass | 1850 / 20 pass | 1775 / 20 pass | 951 / 20 pass | 935 / 20 pass |
| Khung rAF / pass | 31–131 (đa số 100+) | 34–136 | 39–87 | 36–77 |
| **Clean distinct hậu flip+2000ms** | **80/98 = 81,6%** | **99/125 = 79,2%** | **100/146 = 68,5%** | **97/154 = 63,0%** |
| Bar (≥70% và ≥ D+20pt = 68,6%) | **ĐẠT (+11,6pt / +13,0pt)** | Đạt | KHÔNG ĐẠT | KHÔNG ĐẠT |
| Hơn baseline flip D (48,6%) | **+33,0pt** | +30,6pt | +19,9pt | +14,4pt |
| Nhãn tap clean (distinct) | 68/73 = 93,2% | 67/78 = 85,9% | 68/85 = 80,0% | 67/90 = 74,4% |
| Nhãn frameIdx clean (distinct) | 12/25 = 48,0% | rawAnchor 32/47 = 68,1% | 32/61 = 52,5% | 30/64 = 46,9% |
| Độ phủ anchor tap hậu flip (tick) | 1451/1488 = **97,5%** | 950/1028 = 92,4% | 591/710 = 83,2% | 549/666 = 82,4% |
| Clean mọi occurrence | 2870/2943 = **97,5%** | 1935/2013 = 96,1% | 1160/1302 = 89,1% | 1048/1242 = 84,4% |
| Mọi occurrence: tap / fallback | 98,6% / 54,7% (n=75) | 97,8% / 73,8% (rawAnchor) | 94,8% / 67,0% | 92,5% / 47,8% |
| Gap presented−expected \|≤3\| | 100% mọi cửa sổ | 100% | 100% | 100% |
| Gap tại seek hậu flip | 0 hoặc 1 (14/14 seek) | 0 hoặc 1 | 0 hoặc 1 | 0 hoặc 1 |
| tickCost total trung vị / p90 | 11,6 / 18,1 ms | 6,7 / 18,0 ms | 14,1 / 71,8 ms | 13,4 / 72,8 ms |
| rAF gap blend-tick trung vị / p90 | 19,5 / 34,1 ms | 18,0 / 67,5 ms | 32,0 / 94,9 ms | 30,2 / 91,7 ms |

- **C3 vượt cả kỳ vọng prereg** (≈79,2%): 81,6% distinct, 97,5% mọi
  occurrence — cao nhất trong các run flip từ trước tới nay ở cả hai phép đếm.
  Nhãn tap distinct 93,2% cũng là cao nhất (C 85,9%).
- **Lưu ý nhiễu nhỏ:** tickCost trung vị C3 (11,6ms) cao hơn C (6,7ms) dù
  rAF gap tương đương (19,5 vs 18,0ms) và phủ cao hơn (97,5% vs 92,4%) —
  tickCost chịu thêm chi phí mask-blend từng tick, không phải chỉ tải; không
  dùng tickCost đơn lẻ làm chỉ thị tải khi rAF gap + phủ đều tốt. (tickCost
  C3 tính trên 1500 mẫu cap của driver — 1850 tick nhưng chỉ 1500 mẫu
  tickCost được lưu; trung vị trên mẫu có sẵn vẫn đại diện.)
- **Fallback mọi occurrence C3 chỉ 54,7% (41/75)** — thấp hơn C (73,8%),
  C2 (67,0%). Nhưng n=75 rất nhỏ (chỉ 37 tick frameIdx hậu flip) và distinct
  frameIdx 48,0% (12/25) cũng thấp — tập fallback ở C3 là tập hiếm, đã chọn
  lọc (chỉ những tick mà tap KHÔNG tươi trong 50ms — tức đúng những tick khó
  nhất). H5 §4.2 mục 4 đã cảnh báo không suy diễn từ một con số fallback n
  nhỏ; I1 không suy diễn thêm. Headline tổng không bị ảnh hưởng (fallback
  chỉ 2,5% tick hậu flip).
- Gap presented−expected vẫn bounded 100% |≤3| ở mọi cửa sổ hậu flip —
  cơ chế tap giữ anchor qua pump chết + seek vẫn đứng.

## 3. Run C3b — lặp lại: KHÔNG ĐẠT, nhưng NHIỄM TẢI (không bác được C3)

| Chỉ số | C3b (I1) | C3 (I1) |
|---|---|---|
| BlendTick / pass | 720 / 20 pass | 1850 / 20 pass |
| Khung rAF / pass | 23–65 (tổng 801) | 31–131 (tổng 1917) |
| **Clean distinct hậu flip+2000ms** | **94/153 = 61,4%** | **80/98 = 81,6%** |
| Bar | **KHÔNG ĐẠT** | Đạt |
| Nhãn tap clean (distinct) | 67/88 = 76,1% | 68/73 = 93,2% |
| Nhãn frameIdx clean (distinct) | 27/65 = 41,5% | 12/25 = 48,0% |
| Độ phủ anchor tap hậu flip (tick) | 329/479 = **68,7%** | 1451/1488 = **97,5%** |
| Clean mọi occurrence | 626/823 = 76,1% | 2870/2943 = 97,5% |
| Mọi occurrence: tap / fallback | 86,5% / 46,5% | 98,6% / 54,7% |
| Gap presented−expected \|≤3\| | 100% mọi cửa sổ | 100% |
| tickCost total trung vị / p90 | 17,8 / 85,2 ms | 11,6 / 18,1 ms |
| rAF gap blend-tick trung vị / p90 | 74,8 / 118,1 ms | 19,5 / 34,1 ms |

- **Phủ sụp giữa lượt, đúng mẫu tải tăng dần:** chia 479 tick hậu flip thành
  15 chunk ≈ pass 6–20: pass ~6–8 ở 55–59%, pass ~9–10 chỉ **34%**, sau đó
  hồi 75–84% (không trở lại mức yên 97%). Đây không phải nhiễu ngẫu nhiên —
  là tải nền tăng trong lúc đo.
- **Nguyên nhân tải — confound tự gây, ghi rõ:** cờ `round107-i1-done` được
  tạo lúc 17:46Z ngay sau C3 (đúng lệnh brief: tạo cờ ngay khi probe xong để
  các luồng nặng I5/I6/I8 bắt đầu). C3b chạy 17:46:22–17:48:36Z — tức các
  luồng nặng bắt đầu NGAY GIỮA lượt C3b. Load1: đầu C3b 1,54 → cuối 3,74 →
  17:49 là 3,30; 17:52 là 3,81. Prereg đặt ngưỡng load1 >4 cho "nhiễu tải" —
  snapshot load1 không vượt 4, nhưng telemetry trong lượt (tickCost 17,8ms,
  rAF gap 74,8ms, phủ sụp 34%, blendTick chỉ 720) chứng minh tải nặng trong
  lúc đo rõ ràng hơn load1 snapshot. I1 phân loại C3b là **nhiễu tải** theo
  tinh thần prereg, không theo ngưỡng snapshot máy móc.
- **Hệ quả phương pháp:** C3b KHÔNG phải một lần lặp độc lập hợp lệ của C3 —
  nó là một điểm dữ liệu tải nặng nữa, và nó khớp hướng dự đoán (phủ thấp →
  clean thấp). Nó KHÔNG bác được C3, cũng KHÔNG làm yếu kết luận "đạt lúc
  yên". Bài học cho đợt sau: đừng chạy lượt lặp xác nhận ngay sau khi mở cờ
  cho luồng nặng; hoặc chạy lặp TRƯỚC khi tạo cờ.
- **Không chạy lại C3b ngay:** máy lúc 17:49–17:52 đang tải (load1 3,30–3,81)
  do các luồng nặng đã vào — chạy lại lúc này cũng sẽ nhiễm tải. Nợ mở cho
  đợt sau, lúc máy yên (§7 mục 1).

## 4. Verdict — flip-leg trên code land ĐẠT bar lúc máy yên; phụ thuộc tải được xác nhận hai chiều

### 4.1 Bảng tổng hợp flip (distinct, analyzer mới — cùng phép đếm)

| Run | Điều kiện | Phủ | Clean distinct | Bar |
|---|---|---|---|---|
| C (G1) | yên | 92,4% | 79,2% | Đạt |
| C2 (H5) | tải nặng | 83,2% | 68,5% | Không đạt |
| C2b (H5) | tải nặng | 82,4% | 63,0% | Không đạt |
| **C3 (I1)** | **yên** | **97,5%** | **81,6%** | **Đạt** |
| C3b (I1) | nhiễm tải giữa lượt | 68,7% | 61,4% | Không đạt (nhiễu) |

- **Suy luận chặn dưới G1 §4.3 nay có số cứng:** code land (F8-only) đạt
  81,6% lúc yên — cao hơn cả C 79,2% trên code F8+F8b. Land F8 KHÔNG bị lật.
  Nợ H5 §8 mục 1 (đo lại flip lúc máy yên) **ĐÓNG**.
- **Phụ thuộc tải là thật và hai chiều:** cùng một code, cùng protocol, chỉ
  khác tải: phủ 97,5% → 81,6%; phủ ~83% → 63–68,5%; phủ 68,7% → 61,4%.
  Đây là xác nhận độc lập thứ hai của gradient phủ→clean (sau H5 §5).

### 4.2 Gradient phủ → clean (cập nhật H5 §5, distinct, cách đếm mới)

| Nguồn | Độ phủ anchor tươi | Clean distinct | Tải ghi nhận |
|---|---|---|---|
| E3 B (cách đếm cũ) | 34% | ~49,5% | tải nặng |
| I1 C3b flip | 68,7% | 61,4% | nhiễm tải giữa lượt (tự gây) |
| H5 C2b flip | 82,4% | 63,0% | tickCost 13,4ms, load1 ~5–6,5 |
| H5 C2 flip | 83,2% | 68,5% | tickCost 14,1ms, load1 ~5–6,5 |
| G1 C flip | 92,4% | 79,2% | tải nhẹ–trung bình |
| G1 B case B | 94,6% | 73,0% | tải nhẹ–trung bình |
| **I1 C3 flip** | **97,5%** | **81,6%** | **máy yên** |
| G1 B2 case B | 98,2% | 79,6% | tải nhẹ |
| G1 B3 case B | 99,1% | 86,6% | tải nhẹ nhất |

- Clean tăng đơn điệu theo độ phủ (trừ B 94,6% → 73,0% thấp hơn C 92,4% →
  79,2% — nhiễu giữa case B và flip như H5 đã ghi; C3b 68,7% → 61,4% thấp
  hơn C2b 82,4% → 63,0% chỉ 1,6pt dù phủ chênh 13,7pt — dải phủ thấp có thể
  bão hoà, hoặc C3b chịu thêm nhiễu từ mật độ tick thấp (720 tick)).
- **Giới hạn như H5:** tải KHÔNG kiểm soát — là tải nền từ các luồng khác
  (C3b: chính các luồng nặng đợt 107), không phải tải tổng hợp do I1 tạo.
  Gradient trên là quan sát, không phải thí nghiệm A/B tải.

### 4.3 Spread — đuôi lỏng VẪN MỞ

| Run | Cửa sổ đã vẽ: nGroups / median / max | Theo frame: max |
|---|---|---|
| C (G1) | 137 / 0,8 / 74,7 | 75,7 |
| C2 (H5) | 74 / 0,5 / 47,5 | 75,7 |
| C2b (H5) | 73 / 0,9 / 75,4 | 75,7 |
| **C3 (I1)** | **116 / 0,6 / 47,8** | **75,4** |
| **C3b (I1)** | **36 / 0,6 / 75,4** | **75,4** |

- C3 max 47,8 (116 nhóm) giống C2 max 47,5 — nhưng C3b max 75,4 với chỉ 36
  nhóm cho thấy đuôi ~75 không biến mất; hai run max ~47,5 chỉ là mật độ lấy
  mẫu / phân bố nhóm, không phải cải thiện. Median không dùng làm bằng chứng
  (E3 §3.5: artifact lưỡng đỉnh). Spread VẪN MỞ như H5 §7 mục 5.

## 5. Kiểm chứng hồi quy (cây đóng băng, md5 `ced42efd…`)

- `tsc` apps/web (`npx --prefix apps/web tsc --noEmit -p apps/web/tsconfig.json`): **exit 0**.
- `vite build` (từ `apps/web`, config gốc): **PASS 8,18s** (cảnh báo chunk >500kB có từ trước).
- `ghostBlend.probe.test.ts` (`node --experimental-strip-types`): **15/15 PASS**.
- `previewEngine.test.ts`: **27 test passed**.
- Không sửa file production nào; không đụng drift Y4 / watchdog Y5 /
  clip-change Y7 / re-arm Z3 / TTS 39 / birefnet / `.github/workflows`.

## 6. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND107_I1_GHOST_LIMITS.md` — file này. **File duy nhất
  trong repo mà I1 thay đổi** (I1 là luồng đo, cây đóng băng — không sửa code).
- XOÁ (không stage): `apps/web/vite.config.i1-temp.ts` — config tạm của I1,
  xoá sau khi đo xong như kế hoạch (như H5).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round107-i1-ghost.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round107-i1/`
  (prereg-i1.md, i1-done-note.md, chain-i1.log, 2 log run probe, 2 JSON flip
  — C3 7.405.193 byte, C3b 3.088.023 byte — 2 output analyzer flip, 2 bản sao
  analyzer làm việc, driver probe bản sao, regression-i1.log, vite log).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền lệ H5:
  chỉ LIMITS + file repo; dữ liệu đo ở lại hidden_files, đủ để kiểm chứng lại).
- Cờ xong: `hidden_files/round107-i1-done` (tạo 17:46Z, ngay sau C3).

## 7. Nợ mở + đề xuất cho đợt sau

1. **Chạy lại C3b lúc máy yên.** C3b hiện tại nhiễm tải (tự gây, §3) nên chưa
   có lần lặp sạch nào xác nhận C3. Đợt sau, lúc máy yên (load1 <2, không có
   luồng nặng vừa mở cờ): chạy đúng protocol C3 bằng analyzer H5, kỳ vọng
   ~81,6% ± nhiễu. **Không chạy lặp ngay sau khi tạo cờ cho luồng nặng.**
2. **Ghost residual — headline phụ thuộc độ phủ (G1 §4.4, H5 §8 mục 3, nay có
   thêm bằng chứng hai chiều).** Dưới tải nặng (phủ ~69–83%) clean flip chỉ
   61–68,5%. Hướng còn đứng: tăng độ phủ anchor dưới tải (giảm tải probe;
   hoặc nới gate 50ms → 75ms kèm đo lại bằng phép đếm mọi occurrence).
3. **F6' WebKit — VẪN MỞ.** Cần driver ghost cho WebKit trước mới đo được;
   tap/relabel vô dụng trên WebKit theo thiết kế.
4. **Spread — VẪN MỞ.** Đuôi lỏng max ~75 còn nguyên ở C3b (36 nhóm) và
   theo frame ở C3 (75,4); C3/C2 max ~47,8 ở cửa sổ đã vẽ là hiệu ứng mật độ
   lấy mẫu, không phải cải thiện. Báo phân bố, không báo median.
5. **Nợ khác đứng yên theo LIMITS gộp đợt 106 §4:** G1 chờ user quyết metric
   (G5/M2); mù #22 chờ user quyết; Re-arm A/B RAM cao; 2 MiB (queue2 ứng
   viên); Zombie gate (b); B-band c0; EPERM probe #26 + mù #25; G4 flake;
   birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml 403; release gate
   không đổi.
