# PHASE9_ROUND121_T2_PSIAXIS_LIMITS.md — Định nghĩa trục tải PSI cho bar F2 leg B (v0.1) + pilot kiểm chứng: PSI phân biệt được mức tải, bão hòa trên ~6 hog

**Ngày:** 16/11/2026. **Luồng:** T2 (Phase 9 đợt 121, lượt cron
15:35 +07). **Nhiệm vụ (quyết parent đợt 120 §12.1):** leg B theo
định nghĩa cũ (trục load1) DỪNG; leg B chạy tiếp CHỈ SAU KHI định
nghĩa tải bằng PSI được viết ra — đó là nhiệm vụ đợt này.
**Kết quả: ĐÃ VIẾT XONG định nghĩa v0.1 + pilot kiểm chứng xong.**
Không sửa production. Không push, không release/tag. Không chạy
s79, không chạy leg B thật (chỉ pilot + định nghĩa).

**Cây:** preview.tsx md5 `5be5a250a552357c50cc189de9a9c08a`, media.ts
`2c384ed13703809d5e999311147745e7` (H3f, kiểm trước pilot — khớp
đợt 120). Không đổi trong đợt. Boot pilot: **#62**
`9788ce28-c334-40f4-bc21-e93d298b0f9b` (btime 08:25:47Z; pilot chạy
08:42–08:49Z, boot ~16–23' tuổi). Không reboot trong lúc pilot.
HEAD a8f26d48 (không đổi — repo-1 local không có .git, HEAD là ref
GitHub).

## §0. Kết luận trước mọi con số

1. **PSI cpu.some avg60 PHÂN BIỆT ĐƯỢC các mức tải — trái với
   load1.** Pilot 4 mức hog (0/2/6/12, mỗi mức 90 s, mẫu 2 s):
   avg60 đuôi pha (30 s cuối, đã hội tụ): 0 hog ~11% · 2 hog
   **72,2%** · 6 hog **91,1%** · 12 hog **94,9%**. Cùng lúc đó
   load1 nói ngược: 2 hog → load1 0,40; 6 hog → load1 0,07
   ("nhàn" trong lúc PSI 72–91% = nghẽn nặng) — thêm một bằng
   chứng trực tiếp load1 vô hiệu.
2. **PSI BÃO HÒA trên ~6 hog.** 6 vs 12 hog chỉ chênh ~4 điểm
   avg60 (91,1% vs 94,9%). Band Nặng do đó là một band duy nhất,
   không chia nhỏ theo số hog. Muốn tái lập một band thì dial
   theo PSI đọc được (vòng kín), không dial theo số hog.
3. **Định nghĩa v0.1 đã viết xong** (file DEF riêng): trục chính
   PSI some avg60 + threadsR phụ + tickRate chỉ báo; band Yên
   <30% / Vừa 30–80% / Nặng >80% (**tạm thời**, chờ hiệu chỉnh
   sau đợt 122); protocol hold ≥90 s + dial vòng kín + bracket
   PSI thay bracket load1; luật VOID theo PSI.
4. **Prereg template cho leg B đợt 122 đã viết sẵn** (file riêng,
   để T3 đợt 122 điền trước khi đo).
5. **Caveat lớn nhất: pilot chạy giữa đợt 121 đang chạy** —
   sibling (vite/browser các luồng khác) đang bận nên BASE 0 hog
   không nhàn thật (avg60 leo 4,5% → 25,6% trong 60 s; ticker
   proxy chỉ ~62/100 tick/s ngay ở BASE). Mọi ngưỡng đều tạm
   thời (n=1 mỗi mức, 1 boot, <1 chu kỳ sóng ngân sách host).

## §1. Pilot: thiết kế + số liệu

**Script:** `benchmarks/render/psi-axis-pilot-121t2.sh` (hog
nice-19, lệnh y hệt driver T3; kèm ticker proxy node
setInterval 10 ms — đo đói kiểu tickRate, CHỈ LÀ PROXY, tickRate
thật của leg B vẫn lấy từ blendTick trong browser). **Log thô:**
`hidden_files/round121-t2/psi-axis-pilot.log` (180 mẫu 2 s:
30 BASE + 45 L2 + 45 L6 + 45 L12 + 15 RECOV). **Phân tích:**
`analyze-pilot.py` → `psi-axis-pilot-analysis.json/.txt`.
hogsAlive sạch mọi mức (2/2, 6/6, 12/12); 0 hog/ticker sót sau
pilot (kiểm pgrep sau khi xong). Thời gian: 08:41:58–08:48:46Z.

**Bảng đuôi pha (30 s cuối mỗi mức — avg60 đã hội tụ):**

| mức | hogs | PSI some avg60 mean [min, max] | PSI some avg10 mean | threadsR mean | ticker proxy (tick/s, chuẩn 100) | hog burn (CPU) | load1 mean (ĐỐI CHIẾU ONLY) |
|---|---|---|---|---|---|---|---|
| BASE | 0 | 11,49% [3,52, 25,60] | 33,17% | 8,1 | 61,9 | 0,00 | 1,37 |
| L2 | 2 | **72,24% [68,51, 75,32]** | 86,59% | 9,5 | 40,9 | 0,36 | 0,40 |
| L6 | 6 | **91,13% [90,53, 91,54]** | 93,95% | 20,8 | 38,1 | 0,26 | 0,07 |
| L12 | 12 | **94,85% [94,60, 95,15]** | 95,48% | 18,4 | 39,5 | 0,54 | 16,45 |
| RECOV | 0 | 78,22% (avg60 còn treo) / avg10 39,61% | — | 3,6 | — (ticker đã kill) | 0,00 | 13,71 |

**Đọc số liệu (5 điểm):**

- **(a) PSI tách mức rõ ở đầu thấp, bão hòa ở đầu cao.**
  Khoảng trống giữa các cụm: ambient-tối-đa 25,6% → 2-hog
  tối-thiểu 68,5% (khoảng 43 điểm); 2-hog tối-đa 75,3% →
  6-hog tối-thiểu 90,5% (khoảng 15 điểm); 6-hog → 12-hog chỉ
  ~4 điểm. Ngưỡng v0.1 đặt giữa các khoảng trống này: Yên
  <30%, Vừa 30–80%, Nặng >80%.
- **(b) load1 lại nói ngược (thêm bằng chứng).** L2/L6: load1
  0,40 / 0,07 trong lúc PSI 72%/91% — "nhàn" đúng lúc nghẽn
  nặng nhất. L12: load1 nhảy lên 16,45 (sóng đang dâng, xem
  T2-120 §5) trong lúc PSI chỉ nhích 91% → 95%. load1 không
  theo tải, chỉ theo pha sóng.
- **(c) BASE bị nhiễm bởi sibling — và đó chính là dữ liệu.**
  BASE bắt đầu nhàn thật (avg60 ~4,5%, avg10 ~5%, 3 mẫu đầu)
  rồi leo đều lên 25,6%/73% cuối pha trong khi hogsAlive = 0
  (sibling ramp-up giữa đợt 121). Ticker proxy ở BASE chỉ
  61,9 tick/s — main-thread-đói đã hiện diện trước cả khi
  bật hog. Hệ quả cho leg B: band Yên <30% là ngưỡng thực tế
  khi đo giữa đợt đang chạy; nếu đòi Yên <10% thì leg B gần
  như không bao giờ đủ cổng khi sibling đang chạy.
- **(d) Hog burn không đơn điệu theo số hog** (0,36 → 0,26 →
  0,54 CPU) và thấp xa mức 1,41 CPU của T2-120 (6 hog, lúc
  máy vắng). Ngân sách host chia sẻ với sibling mới là yếu tố
  giới hạn — số hog không điều khiển được CPU cháy. Do đó dial
  PHẢI vòng kín theo PSI (§4 DEF), không dial theo số hog.
- **(e) avg60 trễ ~60 s sau mọi thay đổi tải.** RECOV (kill hết
  hog): avg10 rơi nhanh về ~10–16% nhưng avg60 vẫn 62–95%
  suốt 30 s quan sát. Protocol hold ≥90 s trước khi đọc avg60
  là bắt buộc; đọc avg60 ngay sau khi đổi hog là sai số.
- **(f) threadsR nhiễu ở mức hog nhỏ:** L6 20,8 vs L12 18,4
  (đảo ngược) — threadsR chỉ xác nhận "cùng tải thật", không
  tách mức. **Ticker proxy bão hòa:** 61,9 (BASE, đã đói) →
  ~40 ở mọi mức hog rồi phẳng — tickRate chỉ phân biệt
  "đói/không đói", không chấm mức tải (phù hợp vai trò chỉ báo
  trong DEF, và phù hợp tương quan +0,90 của T2-120: tickRate
  là triệu chứng đói, không phải trục tải).
- **PSI full = 0,00% suốt mọi mức** (không có task nào bị chặn
  hoàn toàn) — khớp T2-120.

## §2. Định nghĩa v0.1 — tóm tắt (bản đầy đủ: DEF doc)

- **Trục chính:** PSI cpu.some avg60, mẫu 5 s trong lúc phát,
  trung bình trong cửa sổ run + bracket đầu/cuối.
- **Phụ:** threadsR (trung bình trong run). **Chỉ báo:**
  tickRate blendTick theo quý. **Xác nhận:** hog burn +
  cgroup usage rate. **Không dùng load1** cho bất kỳ tiêu chí
  nào.
- **Band (tạm thời):** Yên <30% · Vừa 30–80% · Nặng >80%.
- **Protocol:** hold ≥90 s sau mọi lần đổi hog; dial vòng kín
  theo PSI; bracket PSI thay bracket load1 <3; ghi đủ chuỗi mẫu
  PSI vào results JSON.
- **VOID:** avg60 bracket lệch band >10 điểm; trung bình avg60
  trong run ngoài band; hog chết giữa run; thiếu >10% mẫu PSI;
  PSI full avg10 >5%; reboot/đổi boot/cây đổi; tiêu chí cũ
  (shim/seekedOk/finalCt/finalSrc/errEvents) giữ nguyên.
- **Hiệu chỉnh bắt buộc sau đợt 122** (DEF §6): PSI thực tế
  lúc browser chạy; T_startup theo band; tickRate theo band →
  DEF lên v0.2. Trước đó mọi kết luận dùng ngưỡng v0.1 đều kèm
  chữ "tạm thời".

## §3. Prereg template leg B đợt 122 (file riêng, để sẵn)

`docs/PHASE9_ROUND122_T3_LEGB_PREREG_TEMPLATE.md` — T3 đợt 122
copy thành `hidden_files/round122-t3/prereg-t3.md`, điền trước
khi đo (boot, cây, PORT/lock, bộ run đăng ký, band Yên, dial,
hold, VOID, ghi chép mỗi run, báo cáo cho DEF v0.2). Bar F2
giữ nguyên (T_startup median ≤1,0 s + p90 ≤1,2 s trên ≥6 run;
T_seek mọi run ≤100 ms + median ≤50 ms; chế độ chậm báo riêng).
**Lưu ý quan trọng trong template:** boot #61 (3 run nhanh đợt
120) đã bị reboot #62 thay thế lúc 08:25:47Z — nếu đợt 122 chạy
trên boot khác #61 thì bộ 3 nhanh cũ KHÔNG gộp được theo luật
lật verdict (i) (≥6 run nhanh mới trên cùng một boot + cùng
cây); template bắt T3 ghi rõ bộ run đã có trên cùng boot trước
khi đo.

## §4. Kiểm chứng + những gì KHÔNG làm đợt này

- **Không sửa production:** preview.tsx `5be5a250` / media.ts
  `2c384ed1` trước pilot = sau pilot (kiểm lại sau khi pilot
  xong — xem §6).
- **Không chạy s79, không chạy leg B thật.** Không chạy vite/
  browser (pilot chỉ dùng hog + ticker node; không dùng lock
  v2). Không probe WebKit (T4 owns). Không đụng TTS 39,
  birefnet, `.github/workflows/*`, binary.
- **Pilot sạch:** 0 hog/ticker sót (pgrep sau 08:49Z); log đủ
  180 mẫu; phân tích tính lại bằng script từ log thô (không
  tin mù số tay); spot-check 3 mẫu đầu BASE + 3 mẫu cuối
  BASE/L2 + 2 mẫu cuối L6 khớp số phân tích.
- **Caveat thống kê:** n=1 mỗi mức; 1 boot (#62); pilot dài
  6,5 phút < 1 chu kỳ sóng ngân sách host (~8,5 phút, T2-120
  §5) nên **chưa đo được ảnh hưởng của sóng lên PSI**; BASE
  nhiễm sibling; ngưỡng v0.1 là điểm giữa các cụm quan sát,
  không phải ranh giới vật lý.

## §5. Nợ mở cho đợt sau

1. **DEF v0.2 sau leg B đợt 122** (bắt buộc — DEF §6): PSI lúc
   browser chạy; T_startup theo band; tickRate theo band; dời
   ngưỡng nếu cần.
2. **Ảnh hưởng sóng ngân sách host lên PSI chưa đo:** cần một
   lần chạy hog dài (≥20 phút, 1 mức) để xem avg60 có dao
   động theo chu kỳ ~8,5 phút không — để đợt sau quyết (không
   chạy đợt này: dài + làm nhiễu sibling).
3. **Ngân sách host (~1,5 CPU) + cơ chế tách load1↔runnable
   vẫn chưa rõ** (nợ cũ T2-120 §10 mục 2/3) — không tiến thêm
   đợt này.
4. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35 chờ
   user quyết; `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm
   kiểm lại; birefnet chỉ thử lại khi RAM đổi; R9 (a) vẫn chờ
   user (nhắc lần 6+); luật replay-chết đã duyệt từ đợt 121.
5. **Bar F2 verdict "KHÔNG ĐẠT — chế độ chậm" vẫn đứng** cho
   tới khi leg B đợt 122+ đủ run theo luật (i)/(ii) T3-120 §6.

## §6. File + stage (KHÔNG push)

- **LIMITS này:** `docs/PHASE9_ROUND121_T2_PSIAXIS_LIMITS.md`.
- **Định nghĩa v0.1:**
  `docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`.
- **Prereg template leg B đợt 122:**
  `docs/PHASE9_ROUND122_T3_LEGB_PREREG_TEMPLATE.md`.
- **Script pilot:** `benchmarks/render/psi-axis-pilot-121t2.sh`
  (tự chứa ticker; log mặc định về hidden_files/round121-t2/).
- **Dữ liệu thô + phân tích (KHÔNG stage, trong hidden_files):**
  `hidden_files/round121-t2/` — `psi-axis-pilot.log` (180 mẫu),
  `psi-axis-pilot-analysis.json/.txt`, `analyze-pilot.py`,
  `ticker.mjs`, `ticker.state`, `psi-axis-pilot.stdout`.
- **Stage:** `~/workspace/repo-1-push/paths-loop/
  phase9-round121-t2-psiaxis.txt` (NUL-delimited; 4 entry:
  LIMITS + DEF + prereg template + script pilot) — đã verify
  read-back. KHÔNG push.
- **Cờ:** `hidden_files/round121-t2.done` (tạo sau khi ghi
  LIMITS + stage xong). Log lượt: append
  `hidden_files/build-loop-log.md`.
