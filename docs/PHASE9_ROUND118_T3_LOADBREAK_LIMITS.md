# PHASE9_ROUND118_T3_LOADBREAK_LIMITS.md — Lặp s79: s79r1 GIỮ 83,5% @13,22 (tải thấp — KHÔNG xác nhận 21,07); s79r2 TRUNG GIAN 79,0% @27,75 — tái hiện gần đúng s79 gốc (79,7% @26,98); cùng cấu hình, 2 phân loại khác nhau vì tải trong lúc phát khác nhau; nhiễu giữa các lượt ở tải ~12–13 lên tới 19 điểm (s80b 64,4% vs s79r1 83,5%); kẹt 0/10

**Ngày:** 15/11/2026. **Luồng:** T3 (Phase 9 đợt 118, lượt cron
18:35 +07). **Chủ đề:** Điểm gãy tải — LẶP LẠI s79 ĐÚNG 56 hog /
dial [25,40], 2 lượt (quyết parent đợt 117 §13 mục 3: chấp nhận GIỮ
lùi 19,63 + vùng chuyển tiếp (21,07, 26,98]; bar (c) TUYÊN BỐ KHÔNG
ÁP DỤNG cho nice-hog — DỪNG kiểm chứng nó; luật dial mới (600 s +
hog ≥90 s) thành LUẬT ĐỨNG; trục đo giữ sampled MEAN; mô hình vùng
chuyển tiếp rộng + nhiễu).
**Bối cảnh:** docs/PHASE9_ROUND117_T3_LOADBREAK_LIMITS.md (toàn bộ —
s79 TRUNG GIAN 79,7% @26,98, thiếu vạch GIỮ đúng ~5 tick; s80b
TRUNG GIAN 64,4% @12,03 — tải thấp nhất, offset tệ nhất, phá vỡ
liều–đáp ứng; bar (c) xám lần 5 + 6 → tuyên bố không áp dụng; kẹt
0/8; luật dial ĐẠT 3/3 đợt 117, lũy kế 5/5; lock v2 waiter 632 s)
+ hidden_files/round118-t3/prereg-t3.md (viết TRƯỚC mọi lượt đo mới
— gồm §3: bar (c) KHÔNG kiểm chứng đợt này, chỉ ghi mô tả) +
build-loop-log.md (lượt cron 18:35 +07 15/11 mở đợt 118).
**Build lúc viết prereg:** preview.tsx md5
`03bf029f09b8890b285eacc10a02172b` (khớp baseline s79 gốc — không
đổi). **Boot lúc viết prereg:** uptime -s **2026-11-15 10:48:26Z**,
boot_id `48a82db1-a8e4-41fe-9c9d-08719ce19250` — **boot #54 (SỐ THỨ
TỰ TẠM THỜI)**. Không có reboot nào trong suốt đợt (boot #54 giữ
nguyên tới cuối đợt 12:31:19Z). **Đính chính gap (theo T6 đợt
118 — GIÂY NHÁY):** hiệu số đồng hồ VM 10:48:26Z − 09:47:08Z =
1h01'18" là số CHƯA hiệu chỉnh (đồng hồ VM lùi 17–21 phút tại
#54); gap chứng nhận **#53→#54 ∈ (1h17'48", 1h22'48"]** — trong
dải chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn. Số thứ tự boot
vẫn tạm thời (mù #35 chưa đóng — T6 owns). RAM khả dụng lúc viết prereg ~1049 MB.
Cờ round118-tree: KHÔNG TỒN TẠI trong suốt đợt (T2 đợt 118 chưa
apply H3f / chưa tạo cờ — xem §0). F3 tap+relabel TẮT trong mọi
lượt. Chỉ chạy chromium (đường rVFC). Không probe WebKit. Không sửa
production (T3 không sửa; T2 cũng không sửa cây trong đợt này —
md5 giữ nguyên). Không push GitHub, không release/tag, không TTS
39, không birefnet. Repo local không có `.git` (bản làm việc; HEAD
kiểm qua public API bởi parent).

**Kết quả lớn nhất đợt này:**
- **(a) s79r2 tái hiện gần đúng s79 gốc:** TRUNG GIAN **79,0%**
  trong ±1 @ sampled mean **27,75** (1727 tick, trung vị 0, mean
  +0,71) so với s79 gốc TRUNG GIAN 79,7% @26,98 (1757 tick) — chênh
  chỉ **0,7 điểm** ở tải gần như bằng nhau (27,75 vs 26,98). Vùng
  chuyển tiếp quanh ~27 được củng cố: ở tải ~27, %±1 bám sát vạch
  80% (79,0–79,7%).
- **(b) s79r1 GIỮ 83,5% @13,22 — nhưng ở tải THẤP, KHÔNG xác nhận
  biên 21,07:** 1901 tick, trung vị 0, mean +0,55, ≤−2 0,0%, vượt
  vạch 80% đúng ~66 tick (1587/1901; vạch 80% = 1520,8). Dial ĐẠT
  38,35 nhưng sampled mean trong lúc phát chỉ 13,22 (sibling rút
  sau dial, như s80b). Lượt GIỮ này ở tải thấp hơn cả biên vững
  19,63 nên KHÔNG dời biên GIỮ lên.
- **(c) Cùng cấu hình, 2 phân loại khác nhau — vì tải trong lúc
  phát khác nhau, không phải vì cấu hình:** s79r1 GIỮ @13,22 vs
  s79r2 TRUNG GIAN @27,75. Số hog chỉ là cần gạt, sampled mean mới
  là trục (đúng như prereg §0). Câu hỏi "lặp cùng cấu hình có cho
  cùng %±1 không" KHÔNG trả lời được trực tiếp, vì tải trong lúc
  phát của hai lượt khác nhau (13,22 vs 27,75) — nhưng quan hệ
  tải→%±1 ở ~27 được tái hiện chặt (xem (a)).
- **(d) Nhiễu giữa các lượt ở tải ~12–13 lên tới 19 điểm — bằng
  chứng nhiễu mạnh nhất từ trước tới nay:** s79r1 GIỮ 83,5% @13,22
  (24 hog lúc phát) vs s80b TRUNG GIAN 64,4% @12,03 (24 hog lúc
  phát) — cùng số hog lúc phát, cùng dải tải, chênh **19,1 điểm**.
  Yếu tố khác biệt chưa tách được (s80b chạy trên boot #53 mới 23
  phút; s79r1 trên boot #54 đã 56 phút; tải sibling khác nhau) —
  xem §2.
- **(e) Trong lượt, quý tải CAO có %±1 TỐT HƠN quý tải thấp — lặp
  lại lần thứ 3 liên tiếp:** s79r2: quý tải cao nhất Q2 (mean
  42,52) có %±1 tốt nhất (86,1%); quý tải thấp nhất Q3 (mean 5,14)
  chỉ 80,1%; Q1 (13,57) tệ nhất 74,0%. s79r1: Q4 tải thấp nhất
  (6,27) có %±1 tệ nhất (80,5%). Cùng hướng với s79 đợt 117 (Q2
  tải 5,54 → 73,4% tệ nhất; Q3 tải 48,63 → 85,7% tốt nhất). Giả
  thuyết (chưa chứng minh): load1 đọc thấp = cgroup đang throttle
  = main thread thực sự bị đói → offset tệ; load1 đọc cao = hog
  còn runnable, chưa throttle → main thread còn phần CPU → offset
  tốt. Xem §5.
- **(f) Bar (b) — kẹt ở biên clip: KHÔNG TÁI HIỆN, 0/10 lần thử
  thực chạy** (s79r1 = #9, s79r2 = #10; cả hai 0 episode stall).
- **(g) Luật dial đứng ĐẠT 2/2 lượt đợt này (lũy kế 7/7).** s79r2
  có mẫu ì/sụp cực đoan nhất từ trước tới nay: load1 rơi đơn điệu
  9,87 → 0,24 trong 230 s với đủ 56 hog, rồi nhảy vọt lên 35,64
  trong 40 s. s79r1: luật ≥90 s từ chối ĐẠT sớm đúng 3 lần.
- **(h) Cờ DIALING hoạt động đúng cả 2 lượt** (tạo lúc bắt đầu
  dial, xóa khi dial xong; xem §8). Không có xung đột sửa cây nào
  trong đợt (T2 không apply H3f trong lúc T3 đo — cờ round118-tree
  không tồn tại suốt đợt).
- **(i) Lock v2: 0 TIMEOUT cho T3 đợt này.** s79r2 chờ acquire
  **280 s** vì T2 giữ port 5590 (hold 308 s) — hogs 56 con của T3
  vẫn sống trong lúc chờ, và probe của T2 chạy chồng lên tải hog
  của T3 (xem §0/§8 — ghi cho T2/parent đối chiếu).
- **(j) Bar (c): KHÔNG kiểm chứng đợt này** (theo quyết parent —
  đã tuyên bố không áp dụng). Chỉ ghi mô tả: s79r1 tickRate
  2,14/s, skipStale 28,0%; s79r2 1,91/s, 33,4% — cả hai lại rơi
  vào vùng xám cũ (lần xám thứ 7 + 8 nếu đếm — NHƯNG không đếm,
  vì đã dừng kiểm chứng). D1 mô tả: s79r2 có tương quan theo quý
  skipStale↔%±1 đơn điệu sạch, s79r1 không — bằng chứng hỗn hợp,
  không đủ để mở lại bar (c) (xem §3).

---

## §0. Bối cảnh chạy (không reboot; T2 giữ lock 280 s giữa dial s79r2 và lúc phát; DIALING hoạt động)

- **Không reboot trong đợt:** boot #54 (uptime -s 10:48:26Z,
  boot_id 48a82db1…) giữ nguyên từ lúc viết prereg (~11:40Z) tới
  cuối đợt (12:31:19Z). Cả 3 lượt (dry + s79r1 + s79r2) chạy đủ,
  không lượt nào bị cắt. Gap chứng nhận #53 → #54 ∈ (1h17'48",
  1h22'48"] (theo T6 đợt 118 — GIÂY NHÁY; hiệu số thô 1h01'18"
  là số chưa hiệu chỉnh), trong dải chứng nhận.
- **T2 không sửa cây trong đợt:** md5 preview.tsx 03bf029f trước
  = sau cả 3 lượt (driver ghi md5 trước/sau mỗi lượt; analyzer xác
  nhận mtimeChangedMidRun=False cả 3 lượt); cờ round118-tree
  KHÔNG TỒN TẠI suốt đợt (check_tree trước dry/s79r1/s79r2 đều ghi
  "tree-flag=absent"). H3f của T2 (sau bước chẩn đoán tách riêng
  storeHeldFrame) chưa được apply trong lúc T3 đo — s79r1/s79r2 so
  sánh trực tiếp được với s79 gốc trên cùng cây 03bf029f.
- **T2 giữ lock 280 s giữa dial s79r2 và lúc phát (ghi cho T2 +
  parent đối chiếu):** s79r2 dial ĐẠT 12:07:35Z (load1 35,64, 56
  hog) → driver tạo ticket lock 12:07:36Z → T2 đã ACQUIRED port
  5590 từ 12:07:06Z (ticket normal, hold 308 s, RELEASED
  12:12:14Z) → T3 ACQUIRED port 5591 lúc 12:12:16Z (wait 280 s)
  → phát 12:12:16Z. Hệ quả hai chiều: (i) 56 hog của T3 vẫn sống
  suốt 280 s chờ lock (tổng thời gian hog s79r2 ≈ 283 s dial +
  280 s chờ + ~900 s phát + trích — hog chạy dài hơn s79r1
  đáng kể); (ii) **probe của T2 (12:07:06–12:12:14Z) chạy chồng
  lên 56 hog của T3** — mọi số đo của T2 trong cửa sổ đó đều đo
  dưới tải hog T3, không phải tải yên/sạch (T2 đã tự ghi nhận
  trong LIMITS của họ: load1 med 42,02 do dial 56 hog của T3 đồng
  thời, số tuyệt đối không so được B1 — T3 chỉ ghi chéo, không
  kết luận thêm về số liệu T2). DIALING flag của T3 đã bị xóa lúc 12:07:35Z (dial
  xong) nên T2 không có cách nào biết T3 đang chờ lock với hog còn
  sống — kẽ hở phối hợp còn lại: cờ DIALING chỉ phủ cửa sổ dial,
  không phủ cửa sổ chờ lock + phát (phát thì lock đã báo, nhưng
  chờ lock thì không ai thấy hog). Ghi để đợt sau cân nhắc mở rộng
  cờ thành "đang giữ hog" thay vì chỉ "đang dial".
- **Tải nền sibling:** T1/T2/T4/T5/T6/T7 đợt 118 chạy song song.
  Tải sibling có trong sampled mean (đó là tải probe thực sự chịu;
  ghi rõ, không tách). Hog T3 chỉ bật trong cửa sổ đo của T3
  (dial + phát + teardown + chờ lock s79r2), nhả ngay sau mỗi
  lượt; hog-count.txt = 0 lúc kiểm cuối; cờ hogs-off 12:31:19Z
  (boot #54).
- **RAM:** freeMB tối thiểu trong lúc phát: s79r1 **542 MB**,
  s79r2 **438 MB** (từ stall-watch; xem §4). Không OOM lượt nào.
- **ENOSPC — 0 lần:** vite tạm `server.watch.ignored: ["**/**"]`
  + CFG_DIR riêng /tmp/round118-t3; vite lên ngay cả 3 lượt.

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | median load1 | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-dry-t3-118 | stripes-code-blur | chạy khô, không hog | — | **4,24** (n=3) | 4,22 | 2,0 | **275** | 30,9 | 206 | **0** (−1..+1) | 100% | **GIỮ (chỉ validate dụng cụ)** |
| chr-code-blur-s79r1 | stripes-code-blur | [25, 40] | **ĐẠT 38,35** (24 hog lúc phát — xem §5, hog-runtime 127 s) | **13,22** (n=179) | 9,32 | 33,6 | **1901** | 2,14 | 107 | **0** (−1..+27) | **83,5%** | **GIỮ (HỢP LỆ: ≥50 tick, md5 sạch)** |
| chr-code-blur-s79r2 | stripes-code-blur | [25, 40] | **ĐẠT 35,64** (56 hog, hog-runtime 283 s) | **27,75** (n=182) | 26,22 | 63,2 | **1727** | 1,91 | 107 | **0** (−4..+51) | **79,0%** | **TRUNG GIAN (HỢP LỆ: ≥50 tick, md5 sạch)** |

- **dry-t3-118 (nclips=3, 9 s media, boot #54):** 275 tick,
  GIỮ 100% ±1, tickRate 30,9/s, skipStale 7,5% (16/213), caps 206
  phân bố đều c0/c1/c2 (55/76/75), loadSamples mean 4,24 — dry
  dưới tải sibling nhẹ (load ~4, không phải dry yên tuyệt đối
  load ~1,6 như dry-t3b; nhưng đủ validate probe118t3: probe
  exit=0, trích đủ chunk, mtimeChanged=false, pageErrs=[]).
  offset100 mô tả: 90,2% ±1, trung vị +1.
- **s79r1 (nclips=250, 750 s media, boot #54):** dial ĐẠT
  11:44:30Z (load1 38,35, 2 mẫu liên tiếp trong [25,40],
  hog-runtime 127 s, 3 lần từ chối ĐẠT sớm vì hog-runtime <90 s);
  acquire lock ngay (wait 0 s); app boot OK; phát 11:44:31Z →
  probe exit 12:02:06Z (tường phát + trích 1055 s; tường phát
  riêng 887,0 s, playhead tới 748,3/750 s — mẫu watcher cuối); trích xong ~12:02:06Z; probe exit=0. **1901 tick — gấp
  38 lần ngưỡng 50.** Phân loại GIỮ theo offset, **HỢP LỆ** (md5
  03bf029f → 03bf029f, mtimeChangedMidRun=False, không reboot cắt
  ngang). Vượt vạch 80% đúng ~66 tick (1587/1901 = 83,48%; vạch
  80% = 1520,8).
- **s79r2 (nclips=250, 750 s media, boot #54):** dial ĐẠT
  12:07:35Z (load1 35,64, hog-runtime 283 s, 56 hog, 0 lần từ chối
  ĐẠT sớm — load1 chưa vào dải trước 240 s); chờ lock 280 s (T2
  giữ port 5590 — xem §0); acquire 12:12:16Z; app boot OK; phát
  12:12:16Z → probe exit 12:31:13Z (tường phát + trích 1137 s;
  tường phát riêng 903,9 s, playhead tới 748,8/750 s — mẫu watcher cuối); trích xong ~12:31:13Z; probe exit=0.
  **1727 tick — gấp 34 lần ngưỡng 50.** Phân loại TRUNG GIAN
  theo offset, **HỢP LỆ** (md5 03bf029f → 03bf029f,
  mtimeChangedMidRun=False, không reboot cắt ngang). Thiếu vạch
  80% đúng ~18 tick (1364/1727 = 78,98%; vạch 80% = 1381,6).
- **Hai sampler khớp nhau về tải trong lúc phát (ở mức mean):**
  s79r1: probe loadSamples mean 13,22 (n=179) vs driver sampler
  5 s mean 17,01 (n=233, max 42,32) — driver cao hơn vì bao gồm
  cả giai đoạn dial (load 26–42 lúc dial) + chờ lock không có ở
  s79r1 (wait 0 s). s79r2: probe 27,75 (n=182) vs driver sampler
  24,05 (n=332, max 62,44) — driver thấp hơn vì bao gồm cả giai
  đoạn dial sụp (load 0,24–9,87 trong 230 s đầu dial) + 280 s chờ
  lock. Mức tải trong lúc phát được đo chắc chắn ở ~13 (s79r1)
  và ~28 (s79r2) theo probe loadSamples.
- **Caveat số hog lúc phát (ghi rõ, không giấu):** s79r1 phát
  với **24 hog** (không phải 56) vì luật dial ramp −8 khi load1
  vượt trần [25,40] (48 hog → load 42,32 → giảm dần 40 → 32 →
  24; lúc ĐẠT vẫn 24 hog, load 38,35 — tải lúc đó phần lớn là
  tải sibling). s79r2 phát với đủ 56 hog. Đây KHÔNG phải lệch
  khỏi prereg: prereg đăng ký "trần 56, ramp ±8, sàn 8" — đúng
  luật dial đứng mà s79 gốc cũng dùng (driver s79 gốc có cùng
  luật ramp; s79 gốc kết thúc dial với 56 hog vì load không vượt
  trần). Số hog lúc phát là KẾT QUẢ của luật dial + tải sibling,
  không phải tham số cố định — ghi rõ số hog từng lượt trong
  bảng §1. Nhiệm vụ "lặp đúng 56 hog" được hiểu là đúng CẤU HÌNH
  dial (trần 56 / dải [25,40] / luật đứng), không phải ép 56 hog
  bằng mọi giá (ép giữ 56 hog khi load vượt trần sẽ phá luật
  dial). Nếu parent muốn lượt lặp với 56 hog CỐ ĐỊNH (bất chấp
  load vượt trần) thì phải đăng ký lại luật dial — T3 KHÔNG tự
  đổi.

## §2. Bar (a) — điểm gãy: VẪN MỞ; GIỮ vững vẫn 19,63; s79r2 củng cố vùng chuyển tiếp quanh ~27; nhiễu 19 điểm ở tải ~12–13

- **Điểm gãy: VẪN MỞ** (không có lượt GÃY nào). Không có lượt
  GIỮ mới nào ở tải >19,63: s79r1 GIỮ ở 13,22 (< 19,63), s79r2
  TRUNG GIAN ở 27,75. Analyzer: "Bar (a): chi co GIU (cao nhat
  load1mean=13.22), KHONG co GAY -> diem gay VAN MO, giu toi
  13.22" — câu này chỉ đúng trong phạm vi 2 lượt đợt này; kết
  luận gộp toàn lịch sử (xem dưới) mới là chuẩn: **GIỮ vững vẫn
  19,63 (s77c)**, vì s79r1 GIỮ ở tải thấp hơn không dời biên lên.
- **s79r2 tái hiện s79 gốc gần đúng:** 79,0% @27,75 vs 79,7%
  @26,98 — chênh 0,7 điểm, tải chênh 0,77. Tính lại từ results
  json thô: s79r2 trong ±1 = 1364/1727 (78,98%); s79 gốc
  1401/1757 (79,74%). Hai lượt độc lập, cùng cây, cùng cấu hình
  dial, tải trong lúc phát gần bằng nhau → %±1 gần bằng nhau.
  Đây là lần đầu một lượt dài nice-hog được lặp lại ở cùng tải
  và cho kết quả gần trùng — **vùng chuyển tiếp quanh ~27 được
  củng cố: ở tải ~27, %±1 bám sát vạch 80% (79,0–79,7%)**.
- **s79r1 GIỮ 83,5% @13,22 — KHÔNG xác nhận biên 21,07:** lượt
  này là GIỮ, nhưng sampled mean 13,22 thấp hơn cả biên vững
  19,63. Nó chỉ nói "ở tải ~13 thì GIỮ" (phù hợp s77c GIỮ 88,7%
  @19,63), không nói gì về 21,07. Biên 21,07 của s78b (GIỮ 80,9%,
  một lượt duy nhất) vẫn là GIỮ yếu, không được xác nhận — và nay
  có thêm bằng chứng rằng dial [25,40] không đảm bảo tải trong
  lúc phát quanh 21 (s79r1: dial 38,35 → mean 13,22).
- **Bảng liều–đáp ứng gộp (6 lượt nice-hog hợp lệ, cùng cây
  03bf029f, cùng probe họ):**

| lượt | load1 mean | median load1 | %±1 | trung vị off | mean off | phân loại |
|---|---|---|---|---|---|---|
| s80b (T3, đợt 117) | 12,03 | 9,86 | 64,4% | +1 | +1,19 | TRUNG GIAN |
| s79r1 (T3, đợt 118) | 13,22 | 9,32 | 83,5% | 0 | +0,55 | GIỮ |
| s77c (R3) | 19,63 | — | 88,7% | 0 | +0,70 | GIỮ |
| s78b (S3) | 21,07 | 11,73 | 80,9% | 0 | +0,66 | GIỮ |
| s79 (T3, đợt 117) | 26,98 | 20,17 | 79,7% | 0 | +0,69 | TRUNG GIAN |
| s79r2 (T3, đợt 118) | 27,75 | 26,22 | 79,0% | 0 | +0,71 | TRUNG GIAN |

  **Không đơn điệu — nay có bằng chứng nhiễu trực tiếp ở tải
  gần bằng nhau:** s80b 64,4% @12,03 vs s79r1 83,5% @13,22 —
  chênh **19,1 điểm** ở tải chênh chỉ 1,19, cùng 24 hog lúc
  phát, cùng cây, cùng probe họ. Đây là cặp lượt gần-nhất về tải
  trong toàn lịch sử nice-hog mà cho %±1 khác xa nhất. Yếu tố
  khác biệt chưa tách được: s80b chạy trên boot #53 mới 23 phút
  (10:10Z, reboot #53 lúc 09:47Z), s79r1 trên boot #54 đã 56 phút
  (11:44Z, boot #54 lúc 10:48Z); tải sibling khác nhau (s80b:
  threadsR mean 30,9; s79r1: 33,6 — gần bằng nhau); RAM min lúc
  phát s80b 265 MB vs s79r1 542 MB (s80b RAM thấp hơn đáng kể —
  có thể là một yếu tố, nhưng chỉ 2 lượt, không đủ để tuyên bố
  nhân quả). **Kết luận:** trong chế độ hog nice -n 19, sampled
  mean load1 KHÔNG dự báo được offset ở độ phân giải ~1 điểm
  tải; nhiễu giữa các lượt ở cùng tải có thể ≥19 điểm. Mô hình
  "vùng chuyển tiếp rộng + nhiễu lớn giữa các lượt" (quyết
  parent đợt 117) được củng cố thêm — nay có số đo nhiễu trực
  tiếp, không chỉ suy luận từ tính không đơn điệu.
  (Caveat: chỉ 6 lượt; cặp s80b/s79r1 khác nhau ở boot age +
  RAM min — không đủ dữ liệu để tách yếu tố nào gây ra 19,1
  điểm.)
- **Trong [0,+2] (tức ±1 quanh trung vị +1) của s80b chỉ 68,8% —
  nhắc lại từ đợt 117:** s80b không phải chỉ lệch +1 hệ thống.
  s79r1/s79r2 trung vị đều 0 nên không có vấn đề này.
- **Caveat chế độ tải VẪN ĐỨNG:** biên 19,63/21,07 đo bằng hog
  nice -n 19. Dãy hog không-nice (N5/P5/Q3) vẫn dừng ở biên GIỮ
  9,59. Hai con số này là hai biên trên hai chế độ tải khác nhau,
  KHÔNG phải một khoảng duy nhất.
- **Nuance median (ghi rõ, không ảnh hưởng phân loại):** trường
  `loadSampleSummary.median_load1` trong results json của s79r2
  ghi 26,37, trong khi tính lại chuẩn từ `loadSamples` thô (trung
  bình 2 giá trị giữa của 182 mẫu: 26,07 và 26,37) là **26,22**.
  Json dùng giá trị giữa trên (median-high). s79r1: cả hai cách
  đều 9,32. Chênh 0,15, không ảnh hưởng phân loại hay thứ tự tải.
  LIMITS này dùng số tính lại chuẩn (26,22).
- **Toán tích tick prereg ĐÚNG:** prereg tính ~1700–1960 tick ở
  rate ~2/s; thực tế s79r1 1901 tick ở 2,14/s, s79r2 1727 tick ở
  1,91/s. Điểm hòa vốn 50 tick không bị chạm tới.

## §3. Bar (c) — KHÔNG kiểm chứng đợt này (quyết parent); chỉ ghi mô tả + D1 hỗn hợp

- **Quyết đăng ký trước (prereg-t3 §3, theo quyết parent đợt
  117):** bar (c) như đã đăng ký TUYÊN BỐ KHÔNG ÁP DỤNG ĐƯỢC cho
  chế độ hog nice -n 19; đợt này KHÔNG kiểm chứng nó, chỉ ghi
  tickRate + skipStale mô tả, không dự báo, không đếm xám. Phần
  này tuân thủ quyết đó.
- **Số mô tả:** s79r1 tickRate **2,14/s**, skipStale **28,0%**
  (653/2333 pump; capture 1658, skip-stale 10, reset-capture 8,
  skip-seeking 1, duplicate 3); s79r2 tickRate **1,91/s**,
  skipStale **33,4%** (719/2156 pump; capture 1419, skip-stale
  9, reset-capture 4, skip-seeking 3, duplicate 2). Cả hai đều
  rơi vào vùng xám cũ (tickRate 1–5/s, skipStale 20–35%) — lần
  xám thứ 7 + 8 NẾU đếm; **không đếm**, vì đã dừng kiểm chứng.
  Dry-t3-118: 30,9/s + 7,5% (16/213) — ngoài vùng xám, như kỳ
  vọng ở lượt nhẹ.
- **Chẩn đoán D1 — tương quan theo quý (MÔ TẢ, đăng ký trước):**
  - **s79r1:** skipStale gần phẳng cả 4 quý (28,4% / 30,2% /
    25,6% / 27,7%) trong khi %±1 dao động 80,5–86,1% (Q1 86,1% /
    Q2 81,5% / Q3 85,9% / Q4 80,5%) → skipStale KHÔNG theo dõi
    offset trong lượt này (quý skipStale cao nhất Q2 30,2% có
    %±1 81,5% — gần tệ nhất; nhưng quý skipStale thấp nhất Q3
    25,6% có %±1 85,9% — gần tốt nhất; chênh lệch nhỏ, n=4 quý).
    tickRate dao động 1,81–2,66/s: Q3 cao nhất (2,66/s) có %±1
    85,9% (gần tốt nhất); Q2 thấp nhất (1,81/s) có %±1 81,5%
    (gần tệ nhất) — co-move yếu cùng hướng.
  - **s79r2:** cả ba chỉ số co-move SẠCH theo quý: %±1 74,0% /
    86,1% / 80,1% / 75,7%; skipStale 37,3% / 29,1% / 32,9% /
    34,0% — xếp theo skipStale tăng dần: 29,1%→86,1%,
    32,9%→80,1%, 34,0%→75,7%, 37,3%→74,0% — **đơn điệu giảm
    hoàn toàn** (skipStale thấp nhất ↔ %±1 tốt nhất). tickRate
    1,72 / 2,39 / 2,19 / 1,57/s — quý tickRate cao nhất Q2
    (2,39/s) có %±1 tốt nhất (86,1%); quý tickRate thấp nhất Q4
    (1,57/s) có %±1 75,7% (gần tệ nhất). Capture rate 1,37 /
    2,04 / 1,77 / 1,31/s — cùng chiều với %±1.
  - **Kết luận D1 (mô tả):** bằng chứng HỖN HỢP giữa hai lượt —
    s79r2 ủng hộ "skipStale + tickRate theo dõi offset theo
    quý", s79r1 không (skipStale phẳng, tickRate co-move yếu).
    n=4 quý mỗi lượt, không đủ để tuyên bố lại bar (c) hay mở
    lại kiểm chứng. Ghi lại để đợt sau tham khảo NẾU parent muốn
    đăng ký lại bar MỚI (vd: chỉ tickRate, ngưỡng trong [1,5]) —
    KHÔNG chỉnh ngưỡng hậu kiểm trên dữ liệu này, KHÔNG tự mở
    lại bar (c).
- **D2/D3 (đợt 117) vẫn đứng, không đo lại:** ngưỡng GIỮ ≥5/s
  chưa bao giờ tới được ở lượt dài nice-hog (7 lượt hợp lệ:
  1,91–3,37/s); ngữ nghĩa skip-stale là guard đúng (đọc code
  preview.tsx ~dòng 2216), không phải bằng chứng pump đói.

## §4. Bar (b) — playhead kẹt ở biên clip: KHÔNG TÁI HIỆN (0/10 lần thử thực chạy)

- **Định nghĩa stall đăng ký trước (giữ nguyên P5/Q3/R3/S3):**
  xem prereg-t3 §0.
- **Kết quả s79r1:** **0 episode stall** (162 mẫu watcher, tường
  5,9–887,6 s, playhead 4,30 → 748,27). **Kết quả s79r2:** **0 episode stall** (165
  mẫu watcher, tường 5,7–904,9 s, playhead 3,50 → 748,80).
  **Tỉ lệ tái hiện gộp 0/10 lần thử thực chạy** (s77-P5 #1,
  s78-P5 #2, s76-Q3 #3, s77-R3-att1 #4, s77c-R3-att3 #5,
  s78b-S3-att2 #6, s79-T3 #7, s80b-T3 #8, s79r1-T3 #9, s79r2-T3
  #10; s77b att2 + s78 att1 + s80 att1 bị reboot cắt nên KHÔNG
  tính). stall-events.json KHÔNG có file ở cả hai lượt (watcher
  không ghi khi 0 episode); stallBlocks=[] trong results json cả
  hai lượt.
- **Kiểm chứng độc lập từ mẫu thô (tính lại từ stall-watch.jsonl,
  không tin mù watcher — analyzer analyze118t3-s79r1stall.py /
  analyze118t3-s79r2stall.py):**
  - **s79r1:** Cửa sổ 30 s (mọi cặp, wall-diff [25,30]s): n=157,
    min advance **15,97 s**. Không stall. Cửa sổ 10 s (P8, mọi
    cặp [8,10]s): n=2, min advance **7,70 s**; **0 cửa sổ advance
    <1,33 s**. Cửa sổ 10 s (phương pháp thay thế — mẫu đầu tiên
    ≥10 s sau mỗi mẫu): min advance **4,73 s**. Dải mở rộng
    [8,12]s: n=159, min advance cũng 4,73 s. Kiểm tra đóng băng
    trực tiếp: **0 chuỗi mẫu liên tiếp đứng yên** ph. Khoảng liên
    tiếp chậm nhất vẫn tiến **1,77 s trong 5,00 s** tường (wall
    268889, ph 229,6). `playing=false`: 0/162 mẫu. Gap mẫu
    watcher min 4015 ms / median 5426 ms / max 6900 ms.
  - **s79r2:** Cửa sổ 30 s: n=158, min advance **18,83 s**.
    Không stall. Cửa sổ 10 s (P8): n=3, min advance **8,77 s**;
    **0 cửa sổ <1,33 s**. Phương pháp thay thế: min advance
    **6,10 s**. Dải [8,12]s: n=155, min advance cũng 6,10 s.
    **0 chuỗi mẫu liên tiếp đứng yên.** Khoảng liên tiếp chậm
    nhất vẫn tiến **2,27 s trong 5,86 s** tường (wall 605141, ph
    506,23). `playing=false`: 0/165 mẫu. Gap mẫu watcher min
    4601 ms / median 5404 ms / max 7277 ms.
  - **Vùng chậm nhất:** s79r1 ph ~225–241 (wall ~263–290 s,
    clip c75–c80); s79r2 ph ~59–66 (wall ~70–81 s) và ph
    ~502–509 (wall ~599–611 s). KHÁC vùng của đợt 117 (s79 +
    s80b cùng chậm ở ph ~255–296, clip c85–c97) và khác nhau giữa
    hai lượt đợt này. Giả thuyết "vùng clip xấu ổn định" (đợt 117
    §4) YẾU ĐI: 2/2 lượt đợt 117 trùng vùng, nhưng 2/2 lượt đợt
    118 ở vùng khác nhau và khác đợt 117. Vùng chậm vẫn tiến đều
    4–7 s/10 s, không freeze, không stall theo định nghĩa.
  - **Nguồn kết luận:** analyzer stall chạy trên stall-watch.jsonl
    của ĐÚNG tag từng lượt (s79r1/s79r2) — không dùng dòng log
    driver. Driver cũng ghi đúng tag ("s79r1 ... lan thu #9:
    KHONG", "s79r2 ... lan thu #10: KHONG").
- **Đánh giá H1–H4:** stall không tái hiện lần thứ 9 + 10 liên
  tiếp. Với **0/10 lần thử** ở đúng điều kiện s72 lần 1, vụ kẹt
  3,5 phút của s72 lần 1 càng giống sự kiện hiếm/khó tái hiện.
  **Giữ mức ưu tiên thấp** — không tích mẫu mù thêm bằng lượt dài
  kiểu này nữa.

## §5. Dị thường — tải dao động hai chế độ + dial ĐẠT nhờ tải sibling + quý tải cao cho offset tốt hơn

- **s79r2 tải hai đỉnh, dao động theo quý (mạnh như s79 gốc):**
  probe loadSamples (n=182): mean 27,75 nhưng phân bố <5: 28,0%
  / [5,12): 12,1% / [12,20): 5,5% / [20,25): 3,3% / [25,40):
  13,7% / ≥40: 37,4% — **~40% mẫu <12 và ~37% mẫu >40**, gần
  như không có mẫu ở giữa (gần như y hệt s79 gốc: 25,7% <5 /
  36,9% >40 — lưu ý s79 gốc dùng bucket [0,5) còn đây <5, cùng
  nghĩa). Theo quý tải: Q1 mean 13,57 (trung vị 5,17) / Q2 mean
  42,52 (trung vị 51,52) / Q3 mean 5,14 (trung vị 2,89) / Q4 mean
  49,81 (trung vị 52,87) — tải NHẢY giữa hai chế độ ~50 và ~5
  theo từng quý (dao động có chu kỳ ~200 s), y hệt s79 gốc (quý
  45,64 / 5,54 / 48,63 / 8,52). Mean 27,75 rơi vào vùng thưa mẫu
  (chỉ 3,3% mẫu ở [20,25)).
- **s79r1 tải dao động nhẹ hơn, không có đỉnh >40:** probe
  loadSamples (n=179): mean 13,22, phân bố <5: 39,1% / [5,12):
  15,1% / [12,20): 13,4% / [20,25): 10,6% / [25,40): 21,8% /
  ≥40: **0,0%** (max 34,70). Theo quý tải: Q1 mean 15,42
  (trung vị 11,32) / Q2 mean 13,09 (trung vị 11,27) / Q3 mean
  17,36 (trung vị 15,45) / Q4 mean 6,27 (trung vị 2,07) — dao
  động nhẹ, chỉ Q4 sụp. threadsR mean 33,6 (driver sampler 33,2)
  — hàng đợi vẫn đầy cả lúc load1 đọc ~2 (quý Q4).
- **Quý tải cao → %±1 tốt hơn (lần thứ 3 liên tiếp, xem §2(e)):**
  s79r2: Q2 tải 42,52 → %±1 86,1% (tốt nhất); Q1 tải 13,57 →
  74,0% (tệ nhất); Q3 tải 5,14 → 80,1%; Q4 tải 49,81 → 75,7%
  (ngoại lệ: Q4 tải cao nhất nhưng %±1 chỉ 75,7% — pattern
  không hoàn hảo; Q4 cũng là quý tickRate thấp nhất 1,57/s).
  s79r1: Q4 tải 6,27 → 80,5% (tệ nhất); Q1 tải 15,42 → 86,1%
  (tốt nhất). s79 gốc: Q2 tải 5,54 → 73,4% (tệ nhất); Q3 tải
  48,63 → 85,7% (tốt nhất). **3/3 lượt dài gần nhất đều cho
  quý tải thấp nhất có %±1 tệ nhất hoặc gần tệ nhất.** Diễn
  giải (giả thuyết, chưa chứng minh): load1 đọc thấp là lúc
  cgroup throttle đang bóp — main thread thực sự bị đói → offset
  tệ; load1 đọc cao là lúc hog còn runnable, chưa throttle →
  main thread còn phần CPU → offset tốt. Phù hợp với cơ chế
  throttle (R3 §5 / S3 §5 / T3-117 §5): khi hog vượt quota CPU
  của cell (~1,5 CPU), task bị throttle không còn counted là
  runnable nên load1 đọc thấp dù hàng đợi vẫn đầy (threadsR
  ~33–63). Caveat: diễn giải throttle + tải sibling là suy luận
  từ số đo, không phải đo trực tiếp cgroup cpu.stat hay
  scheduler. Ghi rõ để luồng sau kiểm chứng nếu cần — không dùng
  diễn giải này để phân loại lượt (phân loại vẫn theo offset §0
  và sampled mean load1 như prereg).
- **Dial ĐẠT không khóa được tải trong lúc phát (tái hiện lần
  3):** s79r1 dial ĐẠT 38,35 → sampled mean 13,22; s79r2 dial
  ĐẠT 35,64 → sampled mean 27,75. Dải dial [25,40] đo tải TỔNG
  (hog T3 + sibling) lúc bắt đầu, còn sampled mean trong lúc
  phát mới là tải probe thực sự chịu. s79r1: chỉ 24 hog lúc phát
  (luật dial giảm vì load vượt trần) + sibling rút → mean 13,22.
  Đây là giới hạn của luật dial hiện tại: dial đo lúc bắt đầu,
  không khóa được tải trong 15 phút phát. Cơ chế GIỮ tải trong
  lúc phát vẫn là NỢ MỞ — chỉ ghi nhận, không giải quyết đợt này
  (xem §10 mục 8).
- **loadAtPlay là số gây hiểu lầm (nhắc lại R3 §11.3, S3 §5,
  T3-117 §5):** s79r1 loadAtPlay = 34,70; s79r2 loadAtPlay =
  6,56 (mẫu đơn lúc bắt đầu phát — s79r2 bắt đầu phát ngay sau
  280 s chờ lock, lúc load đang thấp) — không dùng; chỉ sampled
  mean trong lúc phát đáng tin (s79r1: 13,22; s79r2: 27,75).

## §6. Metric thay thế + dụng cụ (mô tả, không phân loại)

- **offset100 (CHỈ MÔ TẢ, như prereg):** s79r1 n=1391, trung vị
  +2, mean +1,92, 28,6% trong ±1, 5,6% ≤ −5 (dải −28..+17);
  s79r2 n=1376, trung vị +2, mean +1,63, 26,4% trong ±1, 9,0%
  ≤ −5 (dải −31..+52); dry-t3-118 n=82, trung vị +1, 90,2%
  trong ±1, 0% ≤ −5. offset100 của cả hai lượt dài đều tệ (nền
  nhiễu ±3 trên control yên + suy thoái theo đói tick — như
  M7/N5/P5/Q3/R3/S3/T3-117). Vẫn không dùng để phân loại.
- **Caps coverage vẫn sụp sau clip c2 (lần thứ 7 + 8 liên tiếp ở
  lượt dài):** s79r1 chỉ có 107 caps, mà 91/107 thuộc clip c2
  (c0: 6, c1: 10, c2: 91); s79r2 107 caps (c0: 6, c1: 10, c2: 91)
  — Y HỆT s79/s80b (106/102 caps, c2 chiếm 90/90). Nhưng
  dry-t3-118 caps 206 phân bố đều c0/c1/c2 (55/76/75). **Kết
  luận củng cố (R3 §6/§11.6, S3 §6, T3-117 §6):** sampler chết
  sau c2 chỉ xảy ra ở lượt DÀI (nclips lớn), không xảy ra ở lượt
  khô ngắn — sampler dừng sau ~9 s media vì lý do khác (nghi cap
  buffer đầy / sampler chỉ bám 3 clip đầu), không phải bằng chứng
  đói main-thread. Đừng dùng caps-chết làm bằng chứng đói nữa
  (xem §10 mục 4).
- **threads-R:** dry-t3-118 2,0 / s79r1 33,6 (driver sampler
  33,2) / s79r2 63,2 (driver sampler 62,3) — bám theo số hog đang
  sống + sibling, không bám CPU thật (như M7/N5/P5/Q3/R3/S3/
  T3-117). Không đề xuất thay load1, nhưng là chỉ số phụ bắt buộc
  kèm theo khi báo tải (xem §5).
- **Tick rate:** 30,9/s (dry-t3-118) / 2,14/s (s79r1) / 1,91/s
  (s79r2) — PHẲNG theo thời gian (s79r1: nửa đầu ~2,0/s → nửa
  sau ~2,3/s theo quý 2,32/1,81/2,66/1,98; s79r2: 1,72/2,39/
  2,19/1,57). Capture rate: 22,13/s (dry-t3-118) / 1,88/s
  (s79r1) / 1,57/s (s79r2) — cùng bậc với tickRate, như kỳ vọng
  (mỗi tick ~1 capture).
- **Playhead ratio:** 0,846 (s79r1) / 0,830 (s79r2) — media clock
  chạy ~83–85% thời gian thực dưới tải (so với 0,845 của s79
  gốc, 0,867 của s80b, 0,838 của s78b).
- **Gate v2 (mô tả):** ĐẠT ở s79r1 + s79r2 (analyzer tính gần
  đúng True), KHÔNG ĐẠT ở dry-t3-118 (đúng vì dry không tải).
  Đạt gate v2 không suy ra presented GIỮ (như M7/N5/P5/Q3/R3/S3/
  T3-117).
- **Element chết format error: 0/162 mẫu (s79r1) + 0/165 mẫu
  (s79r2)** — lần thứ 7 + 8 liên tiếp không có (s77 0/130, s77c
  0/121, s78b 0/163, s79 0/163, s80b 0/157, s79r1 0/162, s79r2
  0/165; chỉ s76 có 97/97). Pattern "pool giữ element lỗi" của
  s76 là sự cố đơn lẻ của lượt đó. Hạ mức ưu tiên (xem §10 mục 7).
- **Dụng cụ trích kết quả (tái dùng đợt 117):** trích cuối chia 5
  chunk + snapshot từng phần mỗi 60 s + stuck watcher 5 s.
  Probe118t3 = copy byte của probe117t3, chỉ đổi SCRATCH/CFG_DIR
  (diff chỉ 3 dòng đổi tên, node --check PASS). **Kết quả:** 3/3
  lượt chạy trích đủ dữ liệu (dry-t3-118, s79r1, s79r2), **0
  chunk lỗi** (extraction.errors = [] cả 3 lượt):

| lượt | A-blend | B-caps | D-state | E-scalars | C-px (lớn nhất) |
|---|---|---|---|---|---|
| dry-t3-118 | 278 ms | 183 ms | 112 ms | 3 ms | OK (5 lát) |
| s79r1 | 4889 ms | 973 ms | 108505 ms | 107 ms | OK (3 lát) |
| s79r2 | 5187 ms | 1287 ms | 169890 ms | 711 ms | OK (3 lát) |

  (Chunk D-state (state100) trích chậm ở lượt dài — 108,5 s
  (s79r1) / 169,9 s (s79r2) — nhưng vẫn OK; tổng thời gian trích
  ~2,5–3 phút kể từ khi phát xong, như đợt 117. Ghi rõ để đợt
  sau biết trích D-state là chunk chậm nhất.)
- **Không đổi logic đo:** metric chính vẫn blendTick rVFC;
  sampler/caps/state100 giữ nguyên; diff probe118t3 vs probe117t3
  chỉ gồm các dòng đổi tên (đã soát).
- **Analyzer:** copy analyze117t3.py → analyze118t3.py (đổi tag
  dry-t3-118/s79r1/s79r2; BAR_A_TAGS = {s79r1, s79r2}; giữ nguyên
  công thức offset100 đã sửa + tickRate + skipStale mô tả + bảng
  theo quý D1 + capture rate — chỉ thêm báo cáo, không đổi công
  thức phân loại cũ). **1 nuance do T3 tự phát hiện:** trường
  `loadSampleSummary.median_load1` trong results json dùng
  median-high (giá trị giữa trên), khác median chuẩn tính lại
  (s79r2: 26,37 vs 26,22 — xem §2). Analyzer in cả hai số (dòng
  summary dict vs dòng mean/med/max tính lại); LIMITS này dùng số
  tính lại chuẩn.
- **Driver:** driver118t3.sh (dựa trên driver117t3b.sh; đổi tag
  dry-t3-118/s79r1/s79r2, hog tối đa 56, dial [25,40], lock v2
  run-attempt prio long + VITE_LOCK_AGING_S=600, kiểm tra cây
  round118-tree trước mỗi lượt, cờ DIALING trong lúc dial, hạn
  bắt đầu lượt dài mới 13:15Z, cờ hogs-off round118-t3,
  `boundary_stall_seen` kiểm ĐÚNG tag lượt đó).
  **1 lỗi nhỏ do T3 tự phát hiện + sửa trước khi chạy:** lúc viết
  driver bằng chuỗi replace, khối MAIN + hàm wait_tree_done chưa
  được thay (pattern không khớp do thứ tự thay thế) — đã phát
  hiện khi soát lại file (grep thấy còn s80b/dry-t3b trong MAIN),
  sửa trực tiếp bằng replace theo nội dung hiện tại của file,
  kiểm lại bằng `bash -n` + grep toàn bộ tag/cờ trước khi chạy.
  Không ảnh hưởng lượt đo (driver chạy là bản đã sửa).

## §7. Luật dial ĐỨNG — ĐẠT 2/2 lượt đợt này (lũy kế 7/7)

- **Luật đã đăng ký trước (prereg-t3 §2, giữ nguyên S3/T3-117):**
  cửa sổ dial tối đa 600 s; hog phải chạy ≥90 s trước khi được
  tuyên bố ĐẠT; ĐẠT chỉ khi đủ cả hai: (a) thời gian hog đã chạy
  ≥ 90 s, VÀ (b) 2 mẫu load1 liên tiếp (cách nhau 10 s) đều trong
  dải mục tiêu [25,40]. Ramp: bắt đầu 16 hog, ±8 mỗi 10 s, trần
  56, sàn 8.
- **s79r1 (dial [25,40]):** ramp mượt lên: 7,30 (10 s, 16 hog) →
  11,08 → 15,75 → 21,02 → **26,74 (50 s, 48 hog — TRONG DẢI
  NHƯNG hog-runtime 55 s < 90 s → TỪ CHỐI tuyên bố ĐẠT, đúng
  luật)** → 33,73 (60 s — từ chối lần 2) → 37,62 (70 s — từ chối
  lần 3) → 40,82 (80 s, vượt trần → ramp giảm hog 48→40) →
  42,32 (90 s, 40 hog) → 41,80 (100 s, 32 hog) → 39,68 (110 s,
  24 hog) → **38,35 (120 s — mẫu 2/2 → ĐẠT 11:44:30Z,
  hog-runtime 127 s, 24 hog)**. Luật ≥90 s đã từ chối ĐẠT đúng
  **3 lần** trong lượt này.
- **s79r2 (dial [25,40]):** load1 ì/sụp ĐƠN ĐIỆU 9,87 → 0,24
  trong 230 s với đủ 56 hog (9,87 / 7,68 / 6,57 / 5,56 / 4,78 /
  4,04 / 3,50 / 2,96 / 2,58 / 2,18 / 1,85 / 1,56 / 1,22 / 1,11 /
  0,94 / 0,79 / 0,67 / 0,57 / 0,48 / 0,41 / 0,34 / 0,29 / 0,24)
  → nhảy vọt 14,16 (240 s) → 21,90 → 29,74 → **35,64 (270 s —
  mẫu 2/2 → ĐẠT 12:07:35Z, hog-runtime 283 s, 56 hog)**. 0 lần
  từ chối ĐẠT sớm (load1 chưa vào dải trước 240 s). Đây là mẫu
  ì/sụp CỰC ĐOAN NHẤT từ trước tới nay (230 s rơi đơn điệu, thấp
  nhất 0,24; s79 gốc: sụp 2,15 lúc 160 s → 0,50 lúc 270 s → hồi
  13,78 lúc 290 s → ĐẠT 31,61 lúc 344 s). Với luật cũ (cửa sổ
  300 s) lượt này đã KHÔNG ĐẠT (ĐẠT lúc 283 s, sát trần 300 s).
- **Tổng đợt này: 3 lần từ chối ĐẠT sớm** (s79r1: 3, s79r2: 0) +
  **2/2 ĐẠT**. Lũy kế luật đứng: **7/7** (S3 2/2 + T3-117 3/3 +
  T3-118 2/2). Load1 đáp ứng chậm 127–283 s đã tái hiện ở cả 2
  lượt. **Giữ luật này làm luật đứng cho lượt tải cao sau.**
- **Hạn chế của luật (ghi rõ, không tự đổi luật):** dial ĐẠT
  không khóa được tải trong lúc phát (s79r1: dial 38,35 →
  sampled mean 13,22; s79r2: dial 35,64 → 27,75). Luật hiện tại
  không có cơ chế giữ tải (vd: dial lại giữa lượt, hoặc hog tối
  thiểu). Đợt sau cần parent quyết có bổ sung cơ chế này không
  (xem §10 mục 8).

## §8. Lock v2 + cờ DIALING — dùng thật cho lượt dài: 0 TIMEOUT cho T3; s79r2 chờ acquire 280 s

- **Cấu hình:** `apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600` (mặc định mới S4), `VITE_LOCK_POLL_S=5`,
  mỗi attempt giữ lock đúng lúc chạy probe qua `run-attempt
  <thread> <port> 900 30 long -- <cmd>` (acquire → chạy đúng 1
  attempt → nhả trong trap). KHÔNG dùng lock v1 trong luồng này
  (migration nguyên tử, v2-only).
- **Kết quả (từ vite-lock-v2.log, chỉ thread t3-round118):**

| attempt | ticket | acquire | wait | hold | nhả |
|---|---|---|---|---|---|
| dry-t3-118 | normal | 11:41:41Z | 0 s | 42 s | sạch |
| s79r1 | long (0-…) | 11:44:31Z | 0 s | 1055 s | sạch |
| s79r2 | long (0-…) | 12:12:16Z | **280 s** | 1137 s | sạch |

  **0 lần TIMEOUT, 0 lần DEFERRED do lock** cho T3 đợt này.
  Port vite: s79r1 dùng 5590, s79r2 dùng 5591 (pick_port tránh
  port bận — T2 đang giữ 5590).
- **s79r2 chờ acquire 280 s (ghi cho T4 + parent):** ticket tạo
  12:07:36Z, xếp sau T2 (ticket normal, ACQUIRED port 5590 lúc
  12:07:06Z, hold 308 s, RELEASED 12:12:14Z), rồi ACQUIRED port
  5591 lúc 12:12:16Z sau **280 s chờ**. Đây là lần thứ 2 một
  waiter dài của T3 chờ >200 s mà vẫn acquire thành công trong
  900 s timeout (lần 1: dry-t3 đợt 117 chờ 632 s). Không có
  timeout nào — hàng đợi lock v2 hoạt động đúng (fairness: T2
  vào trước 30 s được giữ trước).
- **Hold dài 1055 s của s79r1 làm T2 chờ 927 s + góp phần làm
  T9 DEFER-LOCK (ghi cho T4 + parent — bằng chứng fairness):**
  theo build-loop-log (T9 đợt 118), att2 retry của T9 (lô đo lớn
  E4) DEFER-LOCK timeout 900 s lúc 12:02:19Z — trong đó T2 chờ
  927 s sau hold 1055 s của T3 (s79r1, 11:44:31–12:02:06Z). Hold
  dài ~18 phút của lượt dài là giá phải trả của phương pháp (phát
  750 s không thể ngắt quãng); các luồng khác chờ >900 s sẽ
  timeout. Đây là hạn chế đã biết của lock v2 với lượt dài, không
  phải lỗi — ghi để parent cân nhắc khi xếp lịch các lượt dài
  song song.
- **Cờ DIALING (mới đợt 118 — bài học s80 đợt 117 bị T2 sửa cây
  giữa lúc dial):** driver tạo file `hidden_files/round118-t3/
  DIALING` NGAY KHI bắt đầu dial (ghi tag + timestamp UTC + md5
  lúc bắt đầu + số hog) và XÓA ngay khi dial xong (cả khi dial
  ĐẠT lẫn KHÔNG ĐẠT). **Hoạt động đúng cả 2 lượt:** s79r1 tạo
  11:42:23Z → xóa 11:44:30Z; s79r2 tạo 12:02:52Z → xóa 12:07:35Z
  (kiểm lại từ log driver + `ls` cuối đợt: không còn file
  DIALING). Không có xung đột sửa cây nào trong đợt (cờ
  round118-tree không tồn tại suốt đợt). **Caveat:** cờ DIALING
  chỉ phủ cửa sổ dial — không phủ cửa sổ chờ lock (s79r2: hog
  sống thêm 280 s sau khi dial xong, T2 không thấy được từ cờ
  này — xem §0). Đề xuất đợt sau: mở rộng cờ thành "đang giữ
  hog" (tạo lúc bắt đầu dial, xóa lúc hog tắt hẳn) thay vì chỉ
  "đang dial". **Caveat nhỏ:** 2 dòng "co DIALING da xoa" ở cuối
  log driver118t3 là cleanup trap của driver gọi clear_dialing
  sau khi run-attempt đã nhả — không phải lỗi (cờ đã không còn;
  `rm -f` im lặng). 2 dòng "KHÔNG NHẢ — owner hiện tại là '?'" ở
  cuối log cũng là cleanup trap gọi release sau khi run-attempt
  đã nhả — không phải lỗi (lock đã trống; S3 §8 + T3-117 §8 ghi
  cùng hiện tượng).
- **Cooldown:** 27 file trong QUEUEDIR lúc kiểm tra cuối — chỉ
  là file marker, không chặn ai.

## §9. Kiểm chứng (cây cuối 03bf029f — không đổi so với prereg)

- `tsc --noEmit` (apps/web): **KHÔNG chạy lại trong luồng này** —
  cây cuối 03bf029f byte-identical với cây S10 đã chạy tsc 0 + vite
  build PASS + suite 27/27 (gộp muộn đợt 116, 22:48–22:52Z 14/11,
  boot #49) và T3 không sửa production (T2 cũng không sửa cây
  trong đợt này — md5 đầy đủ `03bf029f09b8890b285eacc10a02172b`
  kiểm lại sau đợt, khớp prereg). Chạy tsc lúc 12:3xZ sẽ tốn CPU
  trong lúc các luồng sibling khác còn chạy và không thêm thông
  tin (md5 khớp = cùng cây). Ghi rõ thiếu sót này thay vì giấu —
  parent/T10 có thể chạy lại tsc trên cây gộp đợt 118.
- `vite build`: **KHÔNG chạy trong luồng này** (cùng lý do; S10 đã
  chạy vite build PASS trên cùng cây 03bf029f).
- Không sửa production trong luồng này (T3); preview.tsx md5 đầy
  đủ 03bf029f trước = sau cả 3 lượt chạy đủ (dry-t3-118, s79r1,
  s79r2); không reboot cắt ngang lượt nào.
- Probe copy `probe118t3-frame-parity.mjs`: node --check PASS trước
  lượt đầu; diff với probe117t3 chỉ gồm 3 dòng đổi tên.
- Analyzer `analyze118t3.py`: tính lại toàn bộ từ results json
  thô; bảng §1 khớp output analyzer (đếm lại từ đĩa, không tin mù
  log driver). **Kiểm chứng độc lập:** (i) số tick trong ±1 tính
  lại trực tiếp từ `blendTick` thô (s79r1 1587/1901 = 83,48%,
  vượt vạch 80% ~66 tick; s79r2 1364/1727 = 78,98%, thiếu vạch
  80% ~18 tick — xem §1/§2); (ii) phân bố tải hai đỉnh + quý tải
  tính lại trực tiếp từ `loadSamples` thô (s79r2: mean 27,75 /
  median 26,22, khớp summary dict trừ median-high 26,37 — xem
  §2 nuance; quý tải Q1 13,57 / Q2 42,52 / Q3 5,14 / Q4 49,81 —
  xem §5); (iii) offset hist tính lại từ `blendTick` thô (s79r1:
  −1: 335 / 0: 846 / 1: 406 / 2: 177 / 3: 76...; s79r2: −1: 287 /
  0: 772 / 1: 305 / 2: 175 / 3: 86... — xem §1); (iv) dial trace
  s79r2 tính lại từ log driver (rơi đơn điệu 9,87 → 0,24 trong
  230 s, rồi nhảy 14,16 → 35,64 trong 40 s — xem §7).
- Stall: kiểm chứng độc lập từ stall-watch.jsonl thô (§4) — khớp
  kết luận watcher (0 episode cả hai lượt). Lưu ý nguồn của kết
  luận 0/10 (§4).
- Lock đã nhả sạch sau s79r2 (kiểm tra lock TRỐNG 12:31:19Z);
  không vite mồ côi của T3 (pgrep "vite" lúc kiểm cuối chỉ trúng
  shell lệnh của chính phiên kiểm tra — đã kiểm bằng ps, không
  phải tiến trình vite); hog-count.txt = 0; cờ hogs-off 12:31:19Z
  (boot #54).

## §10. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng).** GIỮ vững: **19,63**
   (s77c). Vùng chuyển tiếp GIỮ→TRUNG GIAN: **(21,07, 26,98]** —
   nay được củng cố thêm ở đầu trên (~27: s79 79,7% + s79r2 79,0%
   cùng bám vạch 80%). Cần parent quyết: (i) trục đo — giữ sampled
   MEAN (quyết đợt 117) hay chuyển sang trung vị/phân vị (đổi trục
   không cứu được liều–đáp ứng: s80b thấp nhất trên mọi trục mà
   offset tệ nhất; s79r1 vs s80b chênh 19,1 điểm ở tải gần bằng
   nhau trên mọi trục — xem §2); (ii) có chấp nhận "vùng chuyển
   tiếp rộng + nhiễu lớn giữa các lượt" thay cho một điểm gãy sắc
   không — nay có số đo nhiễu trực tiếp (19,1 điểm ở tải ~12–13)
   chứ không chỉ suy luận; (iii) có cần thêm lượt ở cùng mức tải
   để tách nhiễu không — câu hỏi này nay đã có câu trả lời một
   phần: 2 lượt ở ~27 cho kết quả gần trùng (chênh 0,7 điểm),
   nhưng 2 lượt ở ~12–13 cho kết quả chênh 19,1 điểm — nhiễu
   phụ thuộc vào mức tải (nhỏ ở ~27, lớn ở ~12–13)? Hay phụ thuộc
   vào yếu tố khác (boot age, RAM min)? Cần thêm lượt ở ~12–13
   để tách — đợt sau có thể đăng ký 2 lượt lặp ở tải THẤP (dial
   [10,15]) xem %±1 dao động bao nhiêu.
2. **Chỉ số đói pump (bar (c)): TUYÊN BỐ KHÔNG ÁP DỤNG ĐƯỢC cho chế
   độ nice-hog — DỪNG kiểm chứng (quyết parent đợt 117).** Đợt
   này chỉ ghi mô tả (xem §3). D1 hỗn hợp (s79r2 đơn điệu sạch,
   s79r1 phẳng) ghi lại để đợt sau tham khảo NẾU parent muốn đăng
   ký bar MỚI — KHÔNG tự mở lại.
3. **Luật dial đứng (600 s + hog ≥90 s) ĐẠT 7/7 lũy kế — giữ
   nguyên làm luật đứng cho lượt tải cao sau** (xem §7). Không còn
   nợ kiểm chứng luật này.
4. **Sampler chết sau clip c2 — cần luồng khác kiểm tra (nhắc lại
   R3 §10 mục 4, S3 §10 mục 4, T3-117 §10 mục 4):** s79r1 + s79r2
   lần thứ 7 + 8 liên tiếp (c2 chiếm 91/107 cả hai lượt). Đừng
   dùng caps-chết làm bằng chứng đói nữa.
5. **Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN 0/10 lần thử thực
   chạy.** Giữ mức ưu tiên thấp (xem §4). Giả thuyết "vùng clip
   xấu ổn định" YẾU ĐI (đợt 118: hai lượt chậm ở vùng khác nhau
   và khác đợt 117).
6. **Freeze ~12 s ở ph 44,77 trong s76 (Phần A R3):** s79r1 không
   có freeze nào ≥10 s (min advance 10 s = 4,73 s; 0 chuỗi mẫu
   đứng yên); s79r2 cũng không (min advance 10 s = 6,10 s; 0
   chuỗi đứng yên). Không có dữ liệu mới cho cơ chế freeze s76.
7. **Element chết format error — pattern KHÔNG lặp lại (8 lượt
   liên tiếp không có):** s76 97/97 mẫu vs s77 0/130, s77c 0/121,
   s78b 0/163, s79 0/163, s80b 0/157, s79r1 0/162, s79r2 0/165.
   "Pool giữ element lỗi" là sự cố đơn lẻ của lượt s76. Hạ mức ưu
   tiên; không kết luận thêm.
8. **Dial ĐẠT không khóa được tải trong lúc phát (mới, từ s80b
   §5, tái hiện lần 3 ở đợt này §5):** dial [25,40] ĐẠT 38,35 →
   mean 13,22 (s79r1); ĐẠT 35,64 → mean 27,75 (s79r2). Đợt sau cần
   parent quyết: có bổ sung cơ chế giữ tải không (vd: dial lại
   giữa lượt, hog tối thiểu theo lượt, hoặc phát ngay sau dial
   không chờ vite lâu)? T3 KHÔNG tự đổi luật. Liên quan: **kẽ hở
   phối hợp chờ lock–hog (§0/§8):** cờ DIALING chỉ phủ cửa sổ
   dial; s79r2 chờ lock 280 s với hog còn sống mà không cờ nào
   báo — đề xuất mở rộng cờ thành "đang giữ hog" (tạo lúc bắt đầu
   dial, xóa lúc hog tắt hẳn).
9. **load1 không đo được tải thật khi hog vượt CPU quota (nhắc lại
   Q3 §5, tái hiện ở s79 §5 + s80b §5 + s79r2 §5):** load1 sụp về
   0,24 trong khi 56 hog sống + threadsR ~63; dao động hai chế độ
   (s79r2: quý ~50 ↔ ~5). Đợt sau báo tải kèm threadsR + tick rate
   + skip-stale + PHÂN BỐ tải (mean/median/phân vị/quý), đừng tin
   "dial ĐẠT" hay "load1 sụt" theo nghĩa đen trong cell này.
10. **Trong lượt, quý tải cao cho offset tốt hơn quý tải thấp
    (mới, 3/3 lượt dài gần nhất):** s79, s79r1, s79r2 đều cho quý
    tải thấp nhất có %±1 tệ nhất hoặc gần tệ nhất. Giả thuyết
    throttle (load1 thấp = đang bị bóp = main thread đói) cần
    luồng sau kiểm chứng bằng đo trực tiếp (cgroup cpu.stat /
    scheduler) nếu parent muốn — T3 chỉ ghi pattern, không tuyên
    bố nhân quả.
11. **Reboot #54 (10:48:26Z theo đồng hồ VM chưa hiệu chỉnh) —
    ghi cho T7 đối chiếu:** gap chứng nhận **#53→#54 ∈ (1h17'48",
    1h22'48"]** (theo T6 đợt 118 — GIÂY NHÁY: đồng hồ VM lùi
    17–21 phút tại #54; hiệu số thô 1h01'18" là số chưa hiệu
    chỉnh, KHÔNG phải gap thật). Mù #35 đã mở, nay chứa cả #49,
    #50, #51, #52, #53 và #54; probe #37 ở đợt 118 đối chiếu từ
    mốc này. Không có reboot nào trong suốt đợt T3 (boot #54 giữ
    nguyên 10:48Z → 12:31Z).
12. **T2 probe 12:07:06–12:12:14Z chạy chồng lên 56 hog của T3
    (xem §0):** nếu T2 cần lượt yên/sạch thì cửa sổ đó nhiễm tải
    hog T3 — ghi cho T2/parent đối chiếu, T3 không kết luận về số
    liệu T2.
13. Các nợ ngoài phạm vi T3 (giữ nguyên từ LIMITS gộp đợt 117
    §10): E4 (T1 đợt 118 đang làm), H3f sau bước chẩn đoán tách
    riêng storeHeldFrame (T2 đợt 118 — chưa apply trong lúc T3
    đo), lock v2 3 điều kiện (T4 đợt 118 đang làm — waiter 280 s
    của T3 ghi ở §8), mù #35 + probe #37 (T7), B-Q8-1 hướng khác
    (T9), G1 deinterlace (chờ user quyết), mù #22/#28–#31 + mù
    #35 (chờ user quyết), birefnet (CẤM thử lại khi RAM chưa đổi),
    TTS 39 (CẤM kiểm lại), ci-security.yml 403 (chờ user), release
    gate giữ nguyên.

---

## File đổi/thêm (đợt 118 T3)

- `apps/web/scripts/probe118t3-frame-parity.mjs` — probe copy
  probe117t3, chỉ đổi SCRATCH/CFG_DIR (diff chỉ 3 dòng đổi tên;
  node --check PASS; **48.898 byte > 37.768 — ghi chú rõ cho lúc push**).
- `docs/PHASE9_ROUND118_T3_LOADBREAK_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round118-t3/` (không stage): prereg-t3.md (viết
  TRƯỚC mọi lượt đo mới),
  driver118t3.sh + driver118t3.log + runner118t3.sh +
  runner118t3.out (dry-t3-118 + s79r1 + s79r2, exit=0 cả 3 lượt;
  driver chạy detached qua runner setsid),
  analyze118t3.py + analyze118t3.txt/.json (dry-t3-118 + s79r1 +
  s79r2),
  analyze118t3-s79r1stall.py + analyze118t3-s79r1stall.json
  (stall s79r1; 0 episode),
  analyze118t3-s79r2stall.py + analyze118t3-s79r2stall.json
  (stall s79r2; 0 episode),
  hog-count.txt (= 0), hog-load-chr-code-blur-s79r1-attempt1.txt +
  hog-load-chr-code-blur-s79r2-attempt1.txt (sampler driver 5 s;
  dry không có file sampler vì không hog), status.txt, 3 thư mục
  lượt probe dry-t3-118/s79r1/s79r2 (mỗi thư mục có
  frame-parity-results.json + part files + frame-parity-partial.json
  + stall-watch.jsonl + .log + vite-attempt1.log — trừ dry-t3-118
  không có partial vì lượt ngắn; s79r1/s79r2 không có
  stall-events.json vì 0 episode; dry-t3-118 275 tick, s79r1 1901
  tick, s79r2 1727 tick).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).
