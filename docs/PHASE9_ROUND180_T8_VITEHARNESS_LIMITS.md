# Đợt 180 T8 — DRIVER hb128 CHUẨN: WEBKIT 3/3 + CHROMIUM 3/3 TRÊN #96; ĐỐI CHỨNG CHUẨN CŨ KẸT (P4-lần1); REBOOT #96 GIỮA PHIÊN

Ngày: 23/11/2026 (lượt cron 03:35 +07 = 20:35:51Z; T8 mở ~20:57Z, đóng 22:54Z — TRONG hạn cờ ~23:00Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) ĐỔI driver harness sang hb128 làm chuẩn (quyết (j) đợt 179); (2) Plan B F-179-T8-5; (3) F-178-T8-6 diag W2-setup; (4) O8 trên boot đo; (5) checklist (o); (6) H3 thụ động; (7) đối chứng bản chuẩn cũ 86n2.
Nợ: LIMITS T8-179 (37.744 B — chỉ dư 24 B); GAP §11 + §12.3 đợt 179 (parent CHẤP NHẬN; (j) đổi driver từ đợt 180).

## 0. Kết luận ngắn — HARNESS hb128 SẠCH 6/6; CHUỖI FULL PASS VẪN 0 (CHÂN TÁCH BOOT); 1 KẸT NGOÀI HARNESS

- **#95 XÁC NHẬN 9 nguồn (T0-180)** — boot `95b483a2`, btime 19:10:22Z, gap #94→#95 = 6.793 s. Marker sống qua **47 reboot #49–#95**. **#96 MỚI GIỮA PHIÊN** (boot `8d2a69df`, btime 21:20:56Z, gap #95→#96 = 7.834 s; số hiệu chờ T0-181) — giết waiter T8 lần 1 + watcher-180; root KHÔNG bền sau #96 (libs 1/6, GST 0, dpkg 2 — về mẫu #92/#93/#94).
- **T4-180: lượt yên #49 HỢP LỆ — chuỗi 42 → 43** (attempt1-`95b483a2`, 20/20 + B 5/5 + median 44,0 ms; cửa mở poll #18 21:17:29Z; attempt 21:17:29–21:20:58Z; ngân sách 1/3; **0 vi phạm — chuỗi 1 → 2**). **POSTBOOT_PASS #96 ĐÃ CÓ 22:08:08Z** (repair-sớm-quyết-h, poll=1, **CÓ caveat repair** — tools CHƯA cài, gst-inspect vắng; xem §1). **#95 KHÔNG CÒN là boot đo — xem §7.1.**
- **Harness DRIVER hb128 (CHUẨN MỚI): WebKit 3/3 + Chromium 3/3 — SẠCH 6/6 trên #96** (84l10, 85m4, 86n2-hb128; exit 0 cả 6; 0 WATCHDOG, 0 live-diag, 0 FRESH-CONTENT). **Kẹt harness cộng dồn GIỮ 25** (không kẹt mới trong harness). **86n2-P1 KHÔNG kẹt lần thứ năm liên tiếp.**
- **Đối chứng bản chuẩn cũ 86n2 (backup, ngoài harness): WebKit KẸT exit 124 ở waitForPlaySync-P4-lần1; Chromium PASS.** Kẹt này KHÔNG đếm vào tally harness (tiền lệ diag-179: chạy ngoài harness không đếm) — nhưng chứng minh họ kẹt evaluate VẪN CÓ trên #96; hb128 PASS một phần là may mắn (xem §2).
- **O8 T8 PASS 3/3 trên #96**: WebKit 21/21 ×2 (md5 report `18ebdd50`/`55916c89`) + Chromium 21/21 (`6953d640`), exit 0, 22:09:22–22:11:59Z (2'37"). Gate (a) — POSTBOOT_PASS #96 (repair, caveat). **O8 WebKit chạy bằng lib DEBROOT** (thiết kế gốc) — xem §A.
- **Plan B F-179-T8-5 (TRÌNH, KHÔNG tự triển khai): B1 bọc `resetPlayhead0()` bằng hbStart/hbStop** — kiểm offline ĐẠT (synthetic TRIGGER @125 s, span 120 s; 60 s OK; 0 FP). B2/B3 dự phòng (§C).
- **F-178-T8-6 diag W2-setup: PASS exit 0 (70 s) trên #96** — W1 ×3 PASS + W2 PASS (6 tick) + E4 PASS; 0 tick `W2-setup`. **Ca kẹt setup CHƯA tái hiện lần thứ ba.**
- **(c')/(f') V1: live 0 kích hoạt (harness sạch); replay C5.1 ĐẠT** (kẹt-164 @125 s, kẹt-178 TRIGGER, **0 FP trên 14 log sạch thật** — thêm 180-sach-85m4). **(c') + (f') ĐƯỢC GIỮ.** Q3 84l10: WebKit W2 6 tick + E4 0; Chromium W2 5 + E4 0 — đúng thiết kế.
- **H3: CHỈ GIÁM SÁT THỤ ĐỘNG — 1 kẹt mới ngoài harness (WebKit-only, điểm mới waitForPlaySync-P4-lần1); 86n2-P1 PASS lần thứ năm; H3-D1 tiếp tục bị bác bỏ.** Watchdog (i): 3 dòng (1 kẹt thật, ngoài harness); live-diag (1b): 2; (1c'): 0. 4 snapshot stall trong round180-t8/smoke/ (đúng thư mục). RAM sampler n=32: balloon max 88,5% trần, 0 ghim; avail min **458 MB**.
- **Boot lúc đo = `8d2a69df` (#96) — 0 reboot trong phiên đo. Boot lúc đóng cờ: `8d2a69df`.** T7/T9 CHƯA đóng cờ lúc T8 đóng (22:52Z). **X11 TRỐNG lúc mở + lúc đóng; 0 process sót.** Lock vite TRỐNG; fixture md5 khớp.

## 1. Dòng thời gian (gọn)

- 19:10:22Z **REBOOT #95** (đợt 179; T0-180 XÁC MINH 9 nguồn). 20:35:51Z Đợt 180 mở. 20:57–21:01Z T8 mở: đọc LIMITS T8-179 + GAP §11 + quyết §12.3; cây + 7 script KHỚP md5 đợt 179; copy driver 179→180 + đổi nhãn (waiter deadline → 22:30Z, replay thêm entry 180 + **sửa nhãn sai "179-ket" (F-180-T8-2)**); **symlink diag goals + apps/web → round180-t8 lúc 21:00Z**; **khôi phục file probe S1** (vắng từ đợt 179 — md5 `453d1082`, giống hệt 175–178, chỉ đổi nhãn); **selfcheck #1: libs 6/6, GST .so 269, dpkg 1.545** (trên #95); fixture /tmp KHỚP md5 (đã rebuild ở 179); **mở: 0 process sót, X11 trống, lock trống.**
- 21:01:32Z Waiter lần 1 bắt đầu (deadline 22:30Z); postboot=1 (POSTBOOT_PASS #95), t4=0. 21:17:29Z **Cửa yên mở (poll #18 T4)** → attempt1 chạy; 21:20:58Z **attempt1 XONG: 20/20 + B 5/5 — LƯỢT YÊN #49 (chuỗi 42 → 43)**; 21:21:23Z poller T4 thoát (0 vi phạm, chuỗi 1 → 2).
- 21:20:56Z **REBOOT #96** (boot `8d2a69df`, gap 7.834 s) — giết waiter T8 lần 1 (poll cuối 21:20:35Z) + watcher-180 (poll cuối 21:21:20Z) + runtime restart (vòng chờ của T8 bị gián đoạn, đã khôi phục bằng kiểm tra trên đĩa). **Root KHÔNG bền sau #96: selfcheck #2 lúc 21:35:55Z — libs 1/6 (chỉ libevent), GST .so 0, dpkg 2, cache 0, lists 3.**
- 21:29–21:30Z T4 + T2 viết cờ (trên #96). 21:52:39Z **T8 TIẾP QUẢN watcher-180 (F-180-T8-1)** — T5 vắng 31' sau #96, không watcher nào sống; watcher tự chạy EARLY-REPAIR ngay (boot_age 1.903 s, frozen 1.862 s, dpkg 2; verify form-B exit=1 đúng kỳ vọng) → apt update 21:52–~22:05Z (~13') → install → **POSTBOOT_PASS #96 22:08:08Z (repair-sớm-quyết-h, poll=1, dpkg 804, cache 111, lists 75; CÓ caveat repair: tools CHƯA cài, `gst-inspect-1.0: command not found`, GST .so 269).**
- 22:08:35Z **GATE-FOUND poll=47 (cờ T4 + POSTBOOT_PASS #96, đường a)**. 22:08:43Z selfcheck #3 (libs 6/6, GST .so 269, dpkg 804) + rebuild fixture (md5 khớp).
- 22:09:22–22:11:59Z **O8 T8 PASS 3/3 trên #96** (§A). 22:13:03–22:28:37Z **Harness hb128: WebKit 3/3 + Chromium 3/3** (§2). 22:29:04–22:48:11Z **Đối chứng chuẩn cũ: WebKit KẸT exit 124, Chromium PASS** (§F). 22:49:28–22:50:38Z **Diag W2-setup PASS** (§F).
- 22:51–22:5xZ Trích số liệu + replay; viết LIMITS + paths + cờ (ghi giờ thật ở cờ).

## A. O8 — PASS 3/3 trên boot `8d2a69df` (#96); CHUỖI FULL PASS GIỮ 0 (CHÂN TÁCH BOOT)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 22:09:22–22:10:14 | 0 | **21/21 PASS** — S1 PASS, md5 report `18ebdd50` |
| 2 | O8 WebKit attempt2 | 22:10:14–22:11:07 | 0 | **21/21 PASS** — S1 PASS, md5 report `55916c89` |
| 3 | O8 Chromium (đối chứng) | 22:11:07–22:11:59 | 0 | **21/21 PASS** — S1 PASS, md5 report `6953d640` |

- Report JSON kiểm độc lập bằng python: 3× 21 checks (n=21). **BA FILE STAMPED RIÊNG BIỆT.** 0 `HARNESS LỖI` / `Target crashed` / `WATCHDOG-137` trong log O8.
- **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH`; debroot còn nguyên: GST .so 269). Bằng chứng "WebKit chạy bằng system libs" là harness 84l10/85m4/86n2-hb128 PASS + W1 ×3 PASS trên cùng boot đo (#96), libs 6/6 — **ĐẦY ĐỦ cho O8; và lần này harness CŨNG sạch 3/3 nên đủ cho cả harness.**
- **Gate cho boot đo `8d2a69df`: (a) CÓ — POSTBOOT_PASS #96 22:08:08Z (repair-sớm-quyết-h, poll=1, CÓ caveat repair — tools CHƯA cài, gst-inspect vắng).** O8 T8 chạy sau gate (a) + cờ T4 (GATE-FOUND 22:08:35Z). Caveat ghi rõ — parent/T10 quyết giá trị chân gate cho chuỗi FULL PASS (tiền lệ #90/#94 repair-caveat).
- **Chuỗi WebKit FULL PASS: GIỮ 0 — CHÂN TÁCH BOOT.** 4 chân đợt này: (1) lượt yên hợp lệ #49 trên **#95**; (2) gate (a) cho **#96** (repair, caveat); (3) O8 T0 PASS 3/3 trên **#95** (21:13:23–21:16:02Z, sau cờ 816 s — theo cờ T0); (4) O8 T8 PASS 3/3 + harness 3/3 trên **#96**. Harness sạch nhưng chân (1)+(3) ở boot khác — **không đủ điều kiện lên 1. T8 KHÔNG đề xuất gì khác — parent/T10 quyết.** O8 đợt này 2'37" tổng (179: 2'31", 178: 2'37").

## 2. Kết quả harness — DRIVER hb128 LÀM CHUẨN (quyết (j) đợt 179): WebKit 3/3, Chromium 3/3

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 22:13:06–22:14:17 | **PASS** — W1 +1/+1/+1, W2 PASS, E4 PASS; HB128: W2 6, E4 0 — **Q3 đúng thiết kế** |
| 2 | WebKit 85m4 | 0 | 22:14:32–22:16:43 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1; HB128 19 dòng |
| 3 | WebKit 86n2-hb128 | 0 | 22:16:58–22:20:59 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**, P6 KHÔNG-KẸT; **86n2-P1 KHÔNG kẹt lần thứ năm liên tiếp** |
| 4 | Chromium 84l10 | 0 | 22:21:14–22:22:14 | **PASS** — W1 +1/+1/+1, W2 PASS, E4 PASS; HB128: W2 5, E4 0 |
| 5 | Chromium 85m4 | 0 | 22:22:30–22:24:31 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**; HB128 19 dòng |
| 6 | Chromium 86n2-hb128 | 0 | 22:24:46–22:28:37 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**, P6 KHÔNG-KẸT; HB128 21 dòng |

- 6 report JSON kiểm độc lập: ok=True cả 6. Môi trường: system libs trên boot `8d2a69df` (selfcheck #3 libs 6/6 + GST .so 269 + dpkg 804; repair xong trước O8). **WebKit launch + W1 ×3 PASS bằng system libs** trên ĐÚNG boot đo.
- **Harness 15'34"** (22:13:03–22:28:37Z) — ngắn nhất từ đợt 178 (28'26" ở 179 vì 1 timeout 900 s; đợt này 0 timeout).
- **Đối chứng Chromium cùng pha: N cộng dồn N=42 mỗi pha** (đợt 137/139/141–180 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt.
- **Kẹt harness cộng dồn GIỮ 25** (0 kẹt mới trong harness). 84l10 PASS 2 đợt liên tiếp (179–180); 85m4 P4 +1/+1/+1; 86n2-P1 PASS lần thứ năm liên tiếp (176–180).
- **Driver switch:** hb128 md5 `1e3a1612` (41.196 B, oversize — cần ENABLE_PRIVSEP=0); bản chuẩn cũ md5 `628088bd` (39.194 B, oversize) **GIỮ làm backup** — đối chứng riêng (§F). 85m4 đã hb128 từ đợt 128 (`610ee003`); 84l10 chuẩn `baaa13c0` (chỉ Q3 W2/E4 + bản copy diag w2setup có hb). **(c') nay tự động áp dụng cho cả log 86n2-hb128** (hệ quả đổi driver; §C).

## 3. Watchdog + 4 bước kiểm — 3 DÒNG (1 KẸT THẬT, NGOÀI HARNESS) + LIVE-DIAG 2 + (1c') 0 KÍCH HOẠT (HARNESS SẠCH)

- **Watchdog (i): 3 dòng WATCHDOG-137 (1 pha × 3) — ĐÚNG** (1 kẹt thật ngoài harness, 0 FP). **Live-diag (1b): 2 kích hoạt (86n2-std WebKit ×2) — ĐÚNG** (im lặng 129 s @22:34:14Z + 369 s @22:38:14Z). **(1c')/(f') V1: 0 kích hoạt live (harness sạch, không có gì để bắt); check-fresh trên log kẹt đối chứng: OK maxspan=0 s (0 dòng HB128 — script chuẩn không có heartbeat). (c') + (f') ĐƯỢC GIỮ.**
- 4 snapshot stall (1 timeout124 + 2 live-silence + 1 watchdog-dump) trong round180-t8/smoke/ — **ĐÚNG THƯ MỤC** (symlink cập nhật trước harness). Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–179).
- **(1)** Watchdog chẩn đoán trong 3 script (VÁ 142, GIỮ NGUYÊN 143–180) + `t8-diag-stall.sh` → 180 (cả hai symlink — §5). 6 harness + 3 O8 + 2 control + 1 diag; **1 kẹt thật (ngoài harness) → 3 dòng, 0 FP — ĐÚNG.** **(1b)** Driver canh im lặng >120 s, tối đa 2 lần/lần chạy, ≥240 s: `live_diags=2` ở 86n2-std WebKit, 0 mọi pha còn lại — **ĐÚNG.** **(1c')** helper check-fresh + khối FRESH-CONTENT trong `run_one`: **0 kích hoạt live (harness sạch); replay C5.1 ĐẠT (§C). (c') + (f') ĐƯỢC GIỮ.**
- **(2)** Cột Balloon vào RAM sampler: n=32, pinned=0, min=5.001.372 max=5.702.604 (88,5% trần) mean=5.376.470; avail min=458 MB @22:08:43Z / max 1.626 MB. **(3)** Đối chứng Chromium cùng pha: **84l10 PASS, 85m4 PASS, 86n2-hb128 PASS** — exit 0 cả 3; N cộng dồn **N=42 mỗi pha** — Chromium 0 kẹt mọi đợt. **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **1 lần kẹt (ngoài harness) → 1 snapshot timeout124 (đúng)**.

# §C — (1c')/(f') V1 + PLAN B F-179-T8-5: REPLAY C5.1 ĐẠT; B1 TRÌNH (KHÔNG TRIỂN KHAI)

## C1. Thiết kế (c') + (f') V1 (triển khai đợt 173, giữ nguyên đợt 174–180, không đổi code)

- **(c'):** trailing run HB128 **cùng tag + cùng playhead + cùng ct**, kích hoạt khi span ≥ 120 s VÀ chuỗi dài ≥3 dòng VÀ (e)/(f) trên dòng mới nhất. **(f') V1:** miễn (f) khi sub-run `paused=true + seeking=true` đã ≥300 s. Ngân sách chung với (1b) ≤2 lần/lần chạy, ≥240 s; diag-only; phạm vi: 85m4 + 84l10 W2/E4 từ Q3 **+ 86n2-hb128 từ đợt 180** (hệ quả đổi driver — §2). V2 (f'') giữ làm dự phòng, KHÔNG triển khai.
## C2. Kiểm chứng offline TRƯỚC harness (check-fresh-180t8.py — ~21:0xZ, trên #95)

| Log | HB128 | check-fresh-180t8.py |
|---|---|---|
| 179-kẹt 85m4 | 11 dòng | **OK maxspan=0 s** (xác nhận lại lỗ hổng: 0 dòng trong lúc kẹt) |
| 180-sạch 85m4 (sau harness) | 19 dòng | OK maxspan=5 s |
| 180-sạch 86n2-hb128 | 21 dòng | OK maxspan=5 s |
| 180-kẹt 86n2-std | 0 dòng | **OK maxspan=0 s** (script chuẩn mù hoàn toàn với (c')) |

## C3. Replay sau harness (replay-1c-180t8.py + replay-f-fix-180t8.py, ~22:52Z)

- **(c') V1 (f-fix): kẹt-164 TRIGGER @125 s; kẹt-178 TRIGGER @125 s (TRUE POSITIVE); kẹt-179 KHÔNG ở mọi variant — C5.1 ĐẠT** (0 FP trên **14 log sạch thật** 163/165–177 + 180-sach-85m4; kẹt-171 cũng KHONG — (c') hiện tại KHÔNG ĐẠT; (f') V1-180/300/600 và V2 đều ĐẠT, FP 0). **(c') + (f') ĐƯỢC GIỮ.**
- **(f') V1-300: ĐẠT** — kẹt-164 TRIGGER @125 s; kẹt-171 TRIGGER @305 s (V1-300); V1-180: 164@125 s (kẹt-171 KHÔNG); V1-600: cả hai; V2: cả hai.
- **180-ket-86n2-std: 0 dòng HB128 — mọi variant đều KHÔNG** (script chuẩn không heartbeat; bắt được nhờ (i)+(1b), không nhờ (c')). Cùng họ lỗ hổng với F-179-T8-5, nhưng ở vùng ĐÃ có heartbeat trong bản hb128 (waitForPlaySync) — chỉ script chuẩn là mù.
## C4. PLAN B — PHƯƠNG ÁN SỬA LỖ HỔNG PHỦ SÓNG F-179-T8-5 (TRÌNH, parent quyết sau; KHÔNG tự đổi thiết kế)

**Chẩn đoán (số liệu mới đợt 180).** (c') chỉ phủ 3 helper có hbStart (`waitForPlaySync` / `waitForNotSeeking` / `sampleFor`). Ngoài 3 helper này, mọi `await ev()` đều mù: audit 85m4-hb128 cho **5 lệnh `resetPlayhead0` trần** (dòng 402/461/481/508/556) + ~20 `ev(STATE_FN)` lẻ trong thân pha + khối setup (248–276); 86n2-hb128 cùng hình (5 reset + đuôi P6); 84l10: setup + W2-setup :443/:425 + evaluate E4 (Q3 chỉ phủ TRONG vòng W2/E4). Kẹt 179 nằm đúng ở `resetPlayhead0:320` — giữa P4 và P5, khi mọi heartbeat đã dừng (`finally { hbStop(); }`). **Số liệu biên:** reset sạch P4→P5 chỉ ~0,5 s (P4-last-PASS → P5-HB-đầu 5,5–5,9 s gồm 5 s chờ HB đầu, n=5 log sạch 177/179/180); kẹt 179 im lặng 60,7 s trước WATCHDOG, 0 dòng HB, tổng 903 s tới timeout. **Ràng buộc:** khoảng lặng hợp lệ dài nhất là P6 86n2 (~97 s, chờ 90 s không heartbeat) — mọi ngưỡng im lặng phải >98 s (ngưỡng (1b) 120 s chỉ dư 23 s). Cơ chế then chốt: `hbStart` là `setInterval` phía Node — **vẫn tick trong lúc `await ev()` treo** (event loop Node không bị chặn; chính comment trong script đã ghi "Nếu evaluate treo, log vẫn tiếp tục với state cuối cùng đã biết + elapsed tăng dần").

**B1 (KHUYẾN NGHỊ) — bọc `resetPlayhead0()` bằng hbStart/hbStop.** Một điểm sửa duy nhất trong mỗi script hb128, phủ cả 5 call-site: tag `resetPlayhead0`, summary = playhead/ct cuối đã biết (đóng băng khi treo → trailing run đồng nhất → (c') trigger @120 s). **Kiểm offline đợt 180 ĐẠT:** log tổng hợp (85m4 Chromium 179 sạch + 25 dòng HB `resetPlayhead0 P4-P5` giả lập treo, span 120 s) → **TRIGGER elapsed=125 s span=120 s run_len=25** (cùng chữ ký kẹt-164); bản 60 s → OK maxspan=55 s (không FP dưới ngưỡng). Chi phí: reset sạch ~0,5 s < chu kỳ 5 s → thường **0 dòng thêm**/lần chạy (tối đa 1 dòng/reset × 5 = ≤5 dòng). Biên an toàn: ngưỡng 120 s so với reset sạch 0,5 s (240×). **Bước kiểm trước khi live (đề xuất):** (i) replay lại với log tổng hợp trên (đã xong); (ii) bản copy chẩn đoán có `sleep(150 s)` trong wrapper reset → live TRIGGER kỳ vọng, rồi bỏ; (iii) pilot 1 đợt trên 85m4 WebKit+Chromium.
**B2 (MỞ RỘNG, hoãn) — B1 + bọc setup + vòng chờ P6 90 s của 86n2.** Playhead P6 đóng băng ở 30 suốt 90 s → trailing run hợp lệ đã 90 s, biên với ngưỡng 120 s chỉ còn 30 s. **Chỉ làm sau khi B1 chứng minh live.**
**B3 (KHÔNG KHUYẾN NGHỊ) — giữ nguyên, chấp nhận (c') chỉ là lớp bổ sung sau (i)+(1b).** (1b) đã bắt kẹt 179 + kẹt 180-std (live-diag ×2 mỗi ca). Nhược: (c') vẫn mù giữa các pha; biên (1b) 120 s so với lặng hợp lệ 97 s chỉ 23 s.
**Parent quyết: B1 / B2 / B3.** (c')/(f') V1 vẫn ĐƯỢC GIỮ trong lúc chờ quyết (replay C5.1 ĐẠT, 0 FP trên 14 log sạch).
# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 9 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, CHẠY KIỂM LẠI ĐỢT NÀY — 84l10 PASS LẠI)

## D1. Phạm vi (parent chốt đợt 171, giữ nguyên tới đợt 180): 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; cùng script `baaa13c0`) + ca 178 W2-setup :443. KHÔNG gộp 85m4-P4 / 86n2-P4-lần3. 86n2-P1 (đợt 175) theo dõi riêng — PASS lần thứ năm liên tiếp (176–180). **Đợt 9: 84l10 PASS (WebKit 71 s + Chromium 60 s).**

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 180 (ĐÚNG CẢ HAI ENGINE)

| Engine | W2 HB128 | E4 HB128 | Kết quả |
|---|---|---|---|
| WebKit | **6 tick** (như đợt 179: 6) | **0 tick** | PASS (W1 +1/+1/+1, W2 PASS, E4 PASS) |
| Chromium | **5 tick** (như đợt 178/179: 5) | **0 tick** | PASS |

- **Không FP từ Q3** (check-fresh log 84l10 WebKit: OK maxspan=5 s). **Hồ sơ 4 điểm kẹt 84l10:** 157 E4 :457; 170 W2 :433; 171 W2-setup :425; **178 W2-setup :443**. Đợt 180 PASS — không thêm ca mới. **Diag w2setup lần 3 (§F) cũng PASS, 0 tick `W2-setup`.**
- **Chuỗi 84l10 PASS: 2 đợt (179–180)** sau khi đứt ở 178. Tần suất kẹt 84l10: 4 ca / 24 đợt (157–180) ≈ 17%.
## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG, mở rộng ở F-178-T8-6 — ĐÃ DUYỆT THỬ, §F)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — ca kẹt ngoài harness đợt này cũng là evaluate treo (waitForPlaySync-P4-lần1).
- **Q2 — Lib hệ thống hay engine?** **THU HẸP MẠNH:** libs 6/6 + GST .so 269 đầy đủ trên #96; Chromium 4/4 PASS cùng boot/cùng RAM → kẹt là WebKitGTK-specific.
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 180 — heartbeat đúng cả hai engine.**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — chỉ tương quan thời điểm.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 24 đợt).
# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 180 (1 KẸT MỚI NGOÀI HARNESS; 86n2-P1 KHÔNG KẸT — ĐIỀU KIỆN MỞ H3 KHÔNG ĐẠT)

## B1. Trạng thái giả thuyết sau đợt 180 (H3 ỦNG HỘ — 1 kẹt mới WebKit-only, ngoài harness)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — avail min 458 MB lúc đo, NHƯNG Chromium 4/4 PASS cùng cửa sổ RAM.
- **H2 "RAM tụt trong lúc kẹt là nguyên nhân": KHÔNG ỦNG HỘ (đứng nguyên)** — balloon max 88,5% trần lúc đo nhưng Chromium không kẹt cùng điều kiện.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ — 1 KẸT MỚI ở điểm MỚI (waitForPlaySync-P4-lần1)** (evaluate treo + probe TIMEOUT + browser sống), Chromium 4/4 PASS đối chứng cùng boot. Điểm kẹt dời theo từng đợt (resetPlayhead0 → waitForPlaySync) — ủng hộ "treo kênh evaluate" hơn lỗi pha cụ thể.
- **H3-D1 "Process WebKit bị kẹt tự ăn thêm RAM/CPU": BÁC BỎ (đứng nguyên; browser sống, không OOM-kill).**
- Đợt 180 T8 chỉ giám sát thụ động H3: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy O8** (đều trên #96, qua gate (a)) + **1 kẹt trong 1 lần chạy đối chứng chuẩn cũ** + **0 kẹt Chromium/diag**. Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS lần thứ năm liên tiếp.** H3 vẫn chỉ giám sát thụ động.
## B3. Chữ ký kẹt — đợt 180: 1 KẸT NGOÀI HARNESS (đối chiếu đợt 179: 1 kẹt exit 124, 903 s, probe TIMEOUT; đợt 180: 1 kẹt exit 124, 901 s, probe TIMEOUT; browser sống).

# §E — CHECKLIST (o) ĐỢT 180 (quyết (o) đợt 179 + các F-179 còn lại — 21/21, 0 mục bỏ sót)

- o1. F-179-T0-1 (gap) — **GHI NHẬN**; gap #94→#95 = 6.793 s (T0-180 đã xác minh); gap #95→#96 = **7.834 s** (tính từ btime; số hiệu #96 chờ T0-181).
- o2. F-179-T0-3 + run 178 TIMEOUT — **GHI NHẬN**; run 179 TIMEOUT (margin −28 s, cf 7 s — theo cờ T0-180) — thuộc T7-180.
- o3. F-179-T1-1/T1-2 (lệch prose) — **GHI NHẬN**; thuộc T1-180 (đã đóng cờ; T1 sửa + stage batch đợt 180 theo quyết (p) 179).
- o4. F-179-T1-3 (boot mới sau T10 đóng) — **LẶP LẠI:** #96 sau T10-179 (chờ T0-181); #95 đã xác minh.
- o5. F-179-T1-4 (RAM dao động) — **GHI NHẬN**; avail 458–1.626 MB, balloon max 88,5% (thuộc T9).
- o6. F-179-T4-2 (check-classb) — **GHI NHẬN**; 0 vi phạm theo T4 (chuỗi 1 → 2 — cờ T4-180).
- o7. F-179-T4-3 (X193) — **GHI NHẬN**; T4-180 không báo lặp lại.
- o8. F-179-T5-1 (watcher overlap) — **GHI NHẬN**; watcher-179 chết theo #95 (+26 s, mẫu thứ mười một, F-180-T5-1); watcher-180 chết theo #96 (+24 s — mẫu thứ mười hai, §8).
- o9. F-179-T5-2 (ledger ts) — **GHI NHẬN** (thuộc T5-180).
- o10. F-179-T5-3 (lệch btime 11 s) — **GHI NHẬN** (F-175-T5-3 VẪN ĐÓNG).
- o11. F-174-T5-6 KHÔNG áp dụng — **GHI NHẬN** (#95 replay-đầy-đủ; #96 repair-sớm — F-180-T8-1).
- o12. F-179-T6-1 (chồng pha) — **GHI NHẬN**; harness T8 SAU cờ T4; O8 T0 bàn giao sạch cho T4.
- o13. F-179-T6-4 (mâu thuẫn poll=0) — **GHI NHẬN** (thuộc T6; T6-180 đã đóng cờ).
- o14. F-179-T6-5 (watcher chưa chạy lúc snapshot) — **GHI NHẬN**.
- o15. F-179-T7-1 (sleep bị SIGTERM) — **GHI NHẬN**; T7-180 chưa đóng cờ lúc T8 đóng.
- o16. F-179-T7-4 (lỗi nhãn T0-176/T0-177) — **GHI NHẬN** (thuộc T7; F-178-T7-4 ĐÃ LÀM RÕ).
- o17. F-179-T7-5 (tuổi run cộng thừa 600 s) — **GHI NHẬN** (thuộc T7).
- o18. F-179-T8-1..10 — **ĐÃ THỰC HIỆN** (xem §8; F-179-T8-5 ở §C; F-178-T8-6 ở §F).
- o19. Quyết (o) 179 (cửa slot LÀNH lần 5; HB 47/472, DR 53/308) — **GHI NHẬN**; số mới thuộc T7-180 (chưa đóng cờ).
- o20. Quyết (l) 152 (hạn cờ; marker; gap) — **ĐÃ THỰC HIỆN:** marker 47 reboot (#49–#95 đã xác nhận); T8 đóng 22:54Z, TRONG hạn cờ ~23:00Z.
- o21. Quyết (j) 179 (đổi driver sang hb128; Plan B; F-178-T8-6 tiếp tục; H3 giám sát) — **ĐÃ THỰC HIỆN (§2, §C, §F, §B)**.
# §F — F-178-T8-6 (DIAG W2-SETUP) + ĐỐI CHỨNG BẢN CHUẨN CŨ: DIAG PASS LẦN 3; ĐỐI CHỨNG KẸT

- **Diag W2-setup trên #96 (22:49:28–22:50:38Z): SẠCH, exit=0 (70 s).** W1-lần1/2/3 PASS (+1/+1/+1); W2 PASS (6 tick HB128); E4 PASS (ct 3.967). **0 tick `W2-setup`** (setup nhanh như mọi lần PASS). **Ca kẹt setup CHƯA tái hiện lần thứ ba** (179-lần1 bị #95 giết, 179-lần2 PASS, 180 PASS). File `clicktest-84l10-webkit-w2setup-hb128.mjs` md5 `3d41b015` (36.113 B; gốc `baaa13c0` KHÔNG đổi). **Kết luận F-178-T8-6: giữ bản copy làm công cụ chẩn đoán; ca kẹt setup vẫn chưa tái hiện sau 3 lần chạy — parent quyết có tiếp tục không.**
- **Đối chứng bản chuẩn cũ 86n2 (backup `628088bd`, ngoài harness, cùng boot #96): WebKit KẸT exit 124 (22:29:04–22:44:05Z, 901 s), Chromium PASS exit 0.** WebKit: P1/P2/P3 PASS; **kẹt ở waitForPlaySync-P4-lần1** (im lặng từ 22:29:58Z; WATCHDOG 22:31:35Z + probe TIMEOUT 22:32:05Z; live-diag ×2; browser sống). **0 dòng HB128** ((c') mù hoàn toàn). Verdict **KHÁC NHAU** (chuẩn cũ KẸT, hb128 PASS) — do kẹt evaluate ngẫu nhiên theo đợt, KHÔNG phải do heartbeat. **hb128 PASS không chứng minh đã hết kẹt; chỉ chứng minh driver mới đo đúng + (c') phủ rộng hơn.**
- **Chi phí:** hb128 +2.002 B so với chuẩn (39.194 → 41.196 B), cả hai oversize (cần ENABLE_PRIVSEP=0); w2setup-hb128 36.113 B, DƯỚI giới hạn push. Run sạch: +21 dòng HB128/log (86n2), +0–6 dòng (84l10 W2), 0 FP, 0 ảnh hưởng verdict.

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7 → 530e10a7; `media.ts` 2c384ed1 → 2c384ed1; `vite.config.ts` ee80d093 → ee80d093; `84l10` baaa13c0; `85m4-hb128` 610ee003; `86n2` **628088bd (backup)**; **`86n2-hb128` 1e3a1612 (CHUẨN MỚI)**; **`84l10-w2setup-hb128` 3d41b015**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e. Tất cả không đổi so với đợt 179.
- **T8 chỉ thêm 1 file repo đợt này: LIMITS này.** Driver đổi so với 179: nhãn/lock → `180`/`t8-round180`, waiter deadline → **22:30Z**, replay thêm entry 180 + **sửa nhãn sai "179-ket" (F-180-T8-2)**, 86n2 chuẩn → hb128, thêm script đối chứng `run-control-86n2-std-180t8.sh`. Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round180-t8/`**.
- Extract: glob TẤT CẢ log waiter (lần 1: 20 poll + REBOOT #96; lần 2: 47 poll + GATE-FOUND poll=47); **1 REBOOT trong lúc waiter chạy** (#96, 21:20:56Z).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** Cả hai symlink (`goals/.../t8-diag-stall.sh` + `apps/web/scripts/t8-diag-stall.sh`) cập nhật → round180-t8 lúc **21:00Z, TRƯỚC harness** → 4 dump stall rơi ĐÚNG round180-t8/smoke/. Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink (đã làm 2 đợt liên tiếp).
- **Probe S1: ĐÃ KHÔI PHỤC.** File `o8-s1-probe-180t8.mjs` vắng sau copy 179→180 (179 cũng vắng — attempt1 PASS nên không ai phát hiện); đã copy từ 178 (md5 `453d1082` giống hệt 175–178, chỉ đổi nhãn; `node --check` PASS). O8 đợt này PASS attempt1 nên probe không chạy — chỉ dự phòng.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 nhả lock 22:11:59Z; harness nhả lock sau mỗi lần chạy (xong 22:28:37Z); control nhả lock 22:48:11Z; diag nhả lock 22:50:38Z. **Không lock stale nào** (waiter lần 1 chết theo #96 nhưng không giữ lock vite).
- Kiểm cuối ~22:52Z (trên #96): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG (0 ticket + 102 cooldown); `/tmp/.X11-unix/` TRỐNG — **X194/X195 KHÔNG tái xuất (lần thứ tư liên tiếp)**.
- Fixture /tmp: **rebuild lần 1 trên #96 sau khi /tmp bị wipe** (md5 khớp: `a1fb8549` / `fbaa3d1a` / `ba0c7c62` / `f05daed8`).
- **Reboot #96 (boot `8d2a69df`, btime 21:20:56Z, gap #95→#96 = 7.834 s):** giết waiter T8 lần 1 + watcher-180 + runtime restart (vòng chờ của T8 bị gián đoạn — đã khôi phục bằng kiểm tra trên đĩa, không chạy lại việc đã xong). **Root KHÔNG bền sau #96** (libs 1/6, GST 0, dpkg 2 — về mẫu cũ); chỉ /tmp bị wipe + process chết. **Số hiệu #96 CHỜ T0-181; (m) #96 + INSIDE #96 thuộc T2-181.** T7/T9 chưa đóng cờ lúc T8 đóng — thuộc T7-180/T9-180 + T10-180.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt ngoài watcher T5 (xem F-180-T8-1); không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 + harness + control + diag CHẠY TRÊN BOOT `8d2a69df` (#96, CHƯA XÁC MINH — số hiệu chờ T0-181)** — không đổi trong phiên đo 22:09–22:51Z. **Chuỗi FULL PASS GIỮ 0 — CHÂN TÁCH BOOT (lượt yên #49 + O8 T0 trên #95, gate + O8 T8 + harness trên #96).**
2. **Harness WebKit 3/3 + Chromium 3/3 — kẹt harness cộng dồn GIỮ 25.** Đừng gộp kẹt đối chứng chuẩn cũ (ngoài harness) vào tally harness; cũng đừng gộp verdict pha con với verdict pha, đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** — dù system libs đầy đủ trên `8d2a69df` lúc đo (libs 6/6 + GST .so 269 sau repair). Bằng chứng "WebKit chạy bằng system libs" là 84l10/85m4/86n2-hb128 PASS + W1 ×3 PASS trên cùng boot đo — **ĐẦY ĐỦ cho O8 và cho harness lần này (3/3).**
4. **POSTBOOT_PASS cho boot đo CÓ — gate (a) — NHƯNG CÓ caveat repair** (repair-sớm-quyết-h, poll=1; tools CHƯA cài, gst-inspect vắng; dpkg 804 ≠ 1.545 của #95 replay-đầy-đủ). **CẦN PARENT/T10 XÁC NHẬN LẠI giá trị chân gate cho chuỗi FULL PASS** (tiền lệ #90/#94 repair-caveat).
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=32, max 88,5% trần; avail min 458 MB; 0 kẹt harness nên không kết luận) — giao T9 đối chiếu sampler.
6. **86n2-hb128 41.196 B (>37.768 B) + 86n2 chuẩn 39.194 B (>37.768 B)** — cả hai oversize, lúc push cần `ENABLE_PRIVSEP=0`. 84l10 (34.880 B), 85m4 (37.111 B), **w2setup-hb128 (36.113 B)** dưới giới hạn. **LIMITS này viết gọn, DƯỚI giới hạn push** (xem `wc -c` lúc stage).
7. **Chuỗi verdict: 84l10 PASS 2 đợt liên tiếp (179–180); 85m4 P4 +1/+1/+1; 86n2-P1 PASS lần thứ năm liên tiếp; hb128 verdict giống hệt bản chuẩn ở pilot 179 — NHƯNG đối chứng 180 cho verdict KHÁC (chuẩn cũ KẸT, hb128 PASS) do kẹt ngẫu nhiên, không do heartbeat.** H3 ỦNG HỘ (§B). Điều tra 84l10 ĐỢT 9 (§D).
8. **Diag w2setup PASS trên #96 — boot CHƯA XÁC MINH, CÓ POSTBOOT_PASS #96 (repair, caveat).** Ca kẹt setup CHƯA tái hiện lần thứ ba.
9. **T8 ĐÓNG 22:54Z, TRONG hạn cờ ~23:00Z; 1 reboot trong phiên T8 (#96).** **0 reboot trong phiên đo.**
10. **Reboot #96 GIỮA PHIÊN (số hiệu chờ T0-181; btime 21:20:56Z); #95 XÁC MINH 9 nguồn; marker sống 47 reboot #49–#95**; (m) #95 DƯƠNG ứng viên (T0-180) — thuộc T2-180 + parent 180; (m) #96 + INSIDE #96 thuộc T2-181.
11. **(1c') + (f') V1: 0 kích hoạt live đợt này (harness sạch); replay C5.1 ĐẠT; 86n2-hb128 sạch, check-fresh OK (W 5 s, C 5 s). Plan B trình ở §C4 — parent quyết B1/B2/B3.**
12. **T7/T9 CHƯA ĐÓNG CỜ lúc T8 đóng** (kiểm 22:52Z) — checklist (o) ghi "thuộc T2/T7/T9", không phán thay.

## 8. Sai số mới (F-180-T8-N)

- **F-180-T8-1 — REBOOT #96 GIỮA PHIÊN (21:20:56Z, boot `8d2a69df`) + T8 TIẾP QUẢN WATCHER-180.** #96 giết waiter T8 lần 1 + watcher-180 (poll cuối 21:21:20Z, **+24 s sau btime — mẫu overlap thứ mười hai**) + runtime restart. T5-180 đã viết cờ lúc 21:05Z (cho #95) và **vắng 31' sau #96** (không watcher nào sống, không file mới trong round180-t5 từ 21:21Z); selfcheck #2 cho libs 1/6 + GST 0 + dpkg 2 — **harness KHÔNG thể chạy trên #96 nếu không replay**. T8 khởi động lại watcher-180 (script T5, đường tuyệt đối, 21:52:39Z) → EARLY-REPAIR kích ngay (boot_age 1.903 s, frozen 1.862 s) → verify form-B exit=1 → `--repair` (apt update ~13') → **POSTBOOT_PASS #96 22:08:08Z (repair-sớm-quyết-h, poll=1, dpkg 804)**. **T8 KHÔNG tự chạy apt tay** — chỉ khởi động lại script watcher tự trị của T5 (cùng mẫu "tiếp quản" T5-179/watcher-178; script tự chặn repair khi apt đang chạy, 1 repair/boot, dừng ở hạn cứng). **Ghi rõ để parent/T10 phán việc tiếp quản; cờ #96 vẫn kiểm lại được độc lập (poll1 exit=0, dpkg 804, GST .so 269).**
- **F-180-T8-2 — NHÃN SAI TRONG REPLAY SCRIPT (lỗi copy 179→180).** Entry `179-ket-85m4` trong cả hai replay script trỏ về `round180-t8/smoke/run-webkit-85m4.log` (do sed đổi 179→180 cả đường dẫn) — tức log SẠCH đợt 180 bị gắn nhãn kẹt-179. **ĐÃ SỬA:** `179-ket` trỏ lại `round179-t8/...` (log kẹt thật, BỎ LỠ đúng); thêm `180-sach-85m4` (19 dòng HB, maxspan 5 s, 0 FP) + `180-ket-86n2-std` (0 dòng HB). C5.1 vẫn ĐẠT sau sửa. Nợ đợt sau: checklist copy driver gồm "kiểm lại đường dẫn entry replay sau sed".
- **F-180-T8-3 — NHÃN LIVE-DIAG CŨ TRONG SCRIPT ĐỐI CHỨNG.** `run-control-86n2-std-180t8.sh` (copy từ pilot) vẫn ghi `LIVE-DIAG-179` (2 dòng) — chỉ sai nhãn, diag vẫn chạy đúng (2 kích hoạt @22:34:14Z + 22:38:14Z). Đã ghi nhận; sửa nhãn ở đợt sau.
- **F-180-T8-4 — ĐỐI CHỨNG CHUẨN CŨ KẸT, hb128 PASS (CÙNG BOOT #96).** 86n2 chuẩn cũ WebKit KẸT exit 124 ở **waitForPlaySync-P4-lần1** (điểm MỚI; WATCHDOG 22:31:35Z + probe TIMEOUT 22:32:05Z; live-diag ×2; browser sống; 0 dòng HB128). hb128 PASS exit 0 trước đó 8' (22:16:58–22:20:59Z). **KHÔNG đếm vào tally harness (ngoài harness); KHÔNG kết luận hb128 chống kẹt** — heartbeat không ngăn evaluate treo; kẹt là ngẫu nhiên theo đợt (H3). Chromium chuẩn cũ PASS. **Chuỗi "P3 không kẹt" GIỮ 3** (kẹt ở P4, sau P3 PASS — không đổi); kẹt harness GIỮ 25; kẹt ngoài harness: 1 mới.
- **F-180-T8-5 — FILE PROBE S1 VẮNG SAU COPY (ĐÃ KHÔI PHỤC).** `o8-s1-probe-180t8.mjs` không có sau `cp -r` 179→180 (179 cũng vắng — O8 PASS attempt1 nên không phát hiện). Đã copy từ 178 (md5 `453d1082` giống hệt 175–178, chỉ đổi nhãn; `node --check` PASS). O8 đợt này không cần probe (attempt1 PASS) — chỉ dự phòng. Nợ đợt sau: checklist copy driver gồm "kiểm file probe S1 tồn tại".
- **F-180-T8-6 — GST-INSPECT VẮNG TRÊN #96 (TOOLS CHƯA CÀI).** Selfcheck #3: `gst-inspect-1.0: command not found` → đếm plugin = 0, dù GST .so = 269 đầy đủ. Cùng caveat repair như #94 (T5-179). T5 postboot check-only vẫn exit=0 (kiểm plugin, không cần binary tools). Ghi rõ để không ai trích "GST 0" thành "thiếu plugin".

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS: GIỮ 0 — CHÂN TÁCH BOOT (lượt yên #49 + O8 T0 trên #95; gate + O8 T8 + harness 3/3 trên #96).** Parent/T10 quyết cuối.
2. **Gate (a) cho #96 CÓ caveat repair (F-180-T8-1 + F-180-T8-6): parent/T10 xác nhận lại giá trị chân gate + việc T8 tiếp quản watcher có hợp lệ không.**
3. **Plan B F-179-T8-5 (§C4): parent quyết B1 (bọc resetPlayhead0 — khuyến nghị, kiểm offline ĐẠT) / B2 (mở rộng, hoãn) / B3 (giữ nguyên).** (c')/(f') vẫn ĐƯỢC GIỮ (replay C5.1 ĐẠT, 0 FP trên 14 log sạch).
4. **F-178-T8-6: ca kẹt setup CHƯA tái hiện lần thứ ba (diag PASS) — parent quyết giữ bản copy làm công cụ chẩn đoán hay dừng.**
5. **Số hiệu #96 (boot `8d2a69df`, btime 21:20:56Z) — thuộc T0-181 xác minh 9 nguồn.** Marker sống 47 reboot #49–#95; qua 48 NẾU #96 được xác nhận. (m) #96 + INSIDE #96 thuộc T2-181.
6. **(m) #95 DƯƠNG ứng viên (T0-180: +38,743 s, TRONG dải) — thuộc T2-180 + parent 180.** (m) #56 lần 23 (T2-180).
7. **Đối chứng Chromium cùng pha: N cộng dồn N=42 mỗi pha** — Chromium 0 kẹt mọi đợt.
8. **(1c') + (f') V1: 0 kích hoạt live đợt này (harness sạch) → ĐƯỢC GIỮ.** V2 (f'') giữ làm dự phòng. F-180-T8-2/-T8-3/-T8-5 đưa vào checklist copy driver đợt 181.
9. Mở từ trước, vẫn đứng: G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 34 (chờ T9-180); R9 (a) lần 19; file oversize 6,4 MB chưa quyết; E-205 kết cục (T9-180); prune 55 (T6-180); mù #96?/#95?/#94?/#88?/#77? (hole-recheck 24, T2-180) + (m) #56 lần 23; KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức.
