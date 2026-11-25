#!/bin/bash
# vcut-webkit-postboot-check.sh — kiểm tra + khôi phục WebKit sau reboot (đợt 110 L8).
#
# Bối cảnh: sau mỗi reboot cell, (a) package GStreamer/libevent hệ thống mất
# (rootfs rebuild) và được cài lại dần bởi apt replay của hệ thống (ledger
# OS-intent, ~170 package — CHẬM: boot #39 mất ~17 phút mới đủ 10 package,
# boot #40 đã đủ lúc kiểm tra 22 phút sau boot, boot #42 đã đủ lúc kiểm tra
# 36 phút sau boot, boot #44 đã đủ lúc kiểm tra 46 phút sau boot (lần kiểm
# đầu đã đủ — khoảng chính xác chưa kẹp được);
# boot #45 (13:17:42Z) replay KHÔNG chạy: 8 lần kiểm 13:20–14:00Z (43 phút)
# đều FAIL apt/libs, 0 tiến trình apt/dpkg; --repair 14:06Z vá được symlink
# GST -> debroot nhưng apt install FAIL (lists trống, script không chạy
# apt-get update); O8 WebKit 21/21 PASS nhờ debroot, không nhờ apt hệ thống.
# Đợt 114 Q7: --repair nay chạy `apt-get update` trước khi install
# (quyết định có bằng chứng khô: network tới archive OK, sources hợp lệ,
# --print-uris liệt kê 112 URI, không lock; xem
# docs/PHASE9_ROUND114_Q7_INFRA_LIMITS.md §3). Khoảng replay #45 vẫn mở
# (không kẹp được vì boot đã >80 phút tuổi khi Q7 bắt đầu).
# Boot #46 (15:44:49Z) replay CHẠY và kẹp được khoảng: try1 FAIL lúc boot
# 1'23" tuổi, try2 PASS lúc boot 7'08" tuổi → khoảng (1'23", 7'08"]
# (nợ M8 §9.4 ĐÃ ĐÓNG cho boot này; xem LIMITS đợt 114 Q7 §5).
# Boot #47 (17:45:50Z) replay ĐÃ KẸP ĐƯỢC bởi R9 đợt 115: khoảng
# (22.6', 27.7'] — try#5 FAIL lúc boot 22.6', try#6 PASS lúc boot 27.7'
# (nợ M8 §9.4 ĐÃ ĐÓNG cho boot này, boot thứ 2 liên tiếp sau #46;
# chậm hơn #46 gần 4× do apt-get update của replay mất ~12 phút vì
# mirror chậm + ledger ~170 package cài dần). Xem
# docs/PHASE9_ROUND115_R9_INFRA_LIMITS.md §5.
# Boot #48 (19:43:46Z) replay CHẠY và kẹp được bằng dpkg.log (S8 đợt 116):
# hoạt động apt đầu tiên 19:44:26 (boot +40s), cài xong toàn bộ 19:46:30
# (boot +2'44"), 0 entry dpkg/apt nào sau đó → khoảng (0'40", 2'44"],
# NHANH NHẤT trong 3 boot (#46 7'08", #47 27.7'). Lưu ý: bracket này là
# bằng chứng hậu kiểm từ dpkg.log (log này chỉ còn của boot hiện tại),
# KHÔNG phải watcher live — watcher v2 của S8 chỉ PASS ở lần kiểm đầu
# (boot 83.3' tuổi) vì S8 bắt đầu lúc boot đã ~79' tuổi. Xem
# docs/PHASE9_ROUND116_S8_INFRA_LIMITS.md §5.
# Boot #49 (21:46:46Z 14/11): postboot PASS do S10 kiểm live 22:57–22:59Z
# (boot +1h10'), nhưng bracket replay KHÔNG kẹp được (không watcher nào
# chạy trên boot này; dpkg.log đã mất theo rootfs rebuild khi sang #50).
# Boot #50 (~02:17Z 15/11) và #51 (~04:31Z 15/11): chỉ phát hiện qua
# boot_id đổi ở lượt cron 09:35/12:35 +07, KHÔNG có lần postboot-check
# nào, bracket đã mất cùng log (cùng cơ chế mất log như boot #45 — xem
# S8 §7). Ghi nhận ở LIMITS gộp đợt 116 §10 mục 8 / T8 đợt 117 §7.
# Boot #52 (08:29:12Z 15/11, boot_id 22536366-8716-46f0-a999-cd4199080854,
# sau #51 ~04:31Z, gap ~3h58') replay CHẠY và kẹp được bằng dpkg.log
# (T8 đợt 117): hoạt động apt đầu tiên 08:35:40 (boot +6'28"), cài xong
# toàn bộ 08:37:56 (boot +8'44"), 0 entry dpkg/apt nào sau đó → khoảng
# (6'28", 8'44"]. Watcher v2 try#2 của T8 PASS ở lần kiểm đầu (boot
# 10.1' tuổi) nhưng KHÔNG kẹp được FAIL live — replay xong 08:37:56Z,
# T8 bắt đầu 08:38:20Z (sau 24 s), watcher bắt đầu 08:39:19Z (sau 83 s).
# Bracket này là bằng chứng hậu kiểm từ dpkg.log (chỉ còn log boot hiện
# tại), cùng phương pháp S8 #48. Xem
# docs/PHASE9_ROUND117_T8_INFRA_LIMITS.md §5.
# Boot #53 (09:47:08Z 15/11, sau #52 08:29:12Z, gap 1h17'56"): replay
# ĐÌNH TRỆ — không tới trong 65+ phút (0 hoạt động apt; T5 đợt 117 không
# chạy được lượt yên nào trên boot này); không có lần postboot-check nào
# kẹp được bracket; boot_id không còn lưu (log mất theo rootfs rebuild
# khi sang #54). Xem LIMITS gộp đợt 117 §13 Quyết 9 (repair policy).
# Boot #54 (10:48:26Z 15/11, boot_id 48a82db1-a8e4-41fe-9c9d-08719ce19250,
# sau #53 09:47:08Z, gap ~1h01') replay CHẠY và kẹp được bằng dpkg.log
# (T7 đợt 118): hoạt động apt đầu tiên 11:35:40 (boot +47'14" — khởi động
# MUỘN NHẤT từ trước tới nay, sau #52 +6'28" và #47 +22.6'), cài xong toàn
# bộ 11:40:56 (boot +52'30"), 0 entry dpkg/apt nào sau đó → khoảng
# (47'14", 52'30"]. Postboot PASS lúc boot ~53' tuổi (11:41:29Z), exit 0.
# Xem docs/PHASE9_ROUND118_T7_INFRA_LIMITS.md §5.
# Boot #57? (23:33:34Z 15/11, boot_id 27c8b1d9-33dd-4c63-9989-f9254a66dbc2,
# sau #55 12:51:56Z, gap 10h41'38" — SỐ THỨ TỰ TẠM: boot 6805e92d ~20:17Z
# chưa đếm chắc, chờ T6 đợt 119 đếm lại mù #37) replay CHẠY và kẹp được
# bằng dpkg.log (T7 đợt 119): hoạt động apt đầu tiên 23:35:39 (boot
# +2'05" — NHANH, ngang lớp #48 +40s), cài xong toàn bộ 23:41:08 (boot
# +7'34"), 0 entry dpkg/apt nào sau đó → khoảng (2'05", 7'34"], 1509
# dòng dpkg.log (đúng bằng #52/#54, cùng package cuối
# gstreamer1.0-tools). Postboot PASS live lúc boot ~10'11" (23:43:45Z)
# + PASS lại sau khi replay im lúc boot ~10'43" (23:44:17Z), exit 0.
# --repair KHÔNG chạy (replay tới trong ~15' nên chính sách repair 15
# phút — duyệt đợt 117, áp dụng từ đợt 119 — KHÔNG kích hoạt). Headroom
# 670 (rơi tiếp từ 804 #54). Xem docs/PHASE9_ROUND119_T7_INFRA_LIMITS.md §5.
# Boot #58 (00:53:41Z 16/11, boot_id 622b3a92-62f0-4514-af82-b78c6fde51d6,
# sau #57? 1h20'07") + boot #59 (01:47:49Z 16/11, boot_id
# fc62a4b7-623c-40a4-81fd-bc87cc14913a, sau #58 54'08"): CHẾ ĐỘ LỖI MỚI —
# replay TỚI nhưng THIẾU GST. #58: replay kết thúc sau 350 dòng dpkg.log
# (bracket (0'53", 30'02"]) mà 0 dòng về 9 gói GST; postboot FAIL 25/25
# trong 48 phút. #59: replay còn ở giai đoạn đầu lúc +28' (698 dòng,
# vẫn cài libc-bin), postboot FAIL 15/15; kết thúc không quan sát được
# (T4 dừng 02:20Z theo ngân sách). Xem
# docs/PHASE9_ROUND119_T4_WEBKIT60MS_LIMITS.md §2–§3.
# Boot #60? (04:45:49Z 16/11, boot_id 0260101b-acd3-43f4-91d2-670c1960fb7d,
# sau #59 2h58'00" — SỐ THỨ TỰ TẠM, chờ T6 đếm lại mù #37): CHẾ ĐỘ LỖI
# MỚI NẶNG HƠN — replay CHẠM MÀ KHÔNG CÀI: dpkg.log CHỈ 2 dòng "startup
# packages configure" lúc 05:35:40Z (boot +49'51"), sau đó im hoàn toàn
# (0 apt/dpkg đang chạy lúc kiểm 05:41–05:45Z, lock dpkg rảnh);
# /var/log/apt KHÔNG TỒN TẠI; /var/lib/apt/lists TRỐNG (chỉ auxfiles/
# lock/partial — apt-get update chưa từng chạy trong boot này); 0/9 gói
# GST; postboot FAIL (exit 1) lúc boot ~55' (T7 đợt 120, check-only).
# Watcher T7 đợt 120 quan sát 60 phút xem replay có quay lại không;
# luật xử lý chế độ này chỉ ĐỀ XUẤT trong LIMITS đợt 120, KHÔNG tự
# chạy --repair/cài package — chờ parent quyết. Headroom 545 (rơi tiếp
# từ 670 #57?). Xem docs/PHASE9_ROUND120_T7_INFRA_LIMITS.md.
# Boot #61 (06:50:58Z 16/11, boot_id 80a940d7-a69b-4b65-8cea-0e173716d8fa,
# sau #60? 2h05p09 -- SO THU TU TAM, cho T6 dem lai mu #37): replay NHANH,
# bracket (0p40, 5p41], 1509 dong dpkg.log; postboot PASS live luc boot ~6p
# (06:57:14Z); O8 WebKit 21/21 PASS tro lai lan dau sau cac dot thieu GST.
# Xem docs/PHASE9_ROUND120_T4_WEBKIT60MS_LIMITS.md.
# Boot #62? (08:25:47Z 16/11, boot_id 9788ce28-c334-40f4-bc21-e93d298b0f9b,
# sau #61 1h34p49 -- SO THU TU TAM, cho T6 dem lai mu #37): replay DANG CHAY
# luc T5 dot 121 kiem (configure 08:35:39Z, boot +9p52, 2 dong dpkg.log;
# apt-get update pid 815 + wrapper os-intent pid 794 dang chay luc +17p);
# postboot FAIL exit 1 luc boot ~15p (thieu 5 lib + GST + 11 goi apt);
# headroom inotify HIEU DUNG = 0 (k8 probe STOP i=0, xac nhan tren 3 thu muc;
# wd trong cell chi 14/63747 -- watch giu ngoai cell, xem LIMITS dot 121 T5).
# Watcher T5 dot 121 quan sat 60 phut xem replay co xong khong; luat
# replay-chet §8.2 (duyet dot 120, hieu luc tu dot 121) KHONG kich hoat vi
# replay dang SONG (dieu kien 2a khong dat) -- KHONG chay --repair.
# Ket qua #62?: replay XONG (dpkg 2 -> 1509 dong, goi cuoi gstreamer1.0-tools
# 08:52:06Z, boot +26p19; apt het chay o poll 7) nhung boot REBOOT 08:53:05Z
# truoc khi watcher kip kiem postboot PASS (poll 10) -- bracket chi kep duoc
# nua trai (FAIL cuoi 08:44Z, replay-xong 08:52:06Z), PASS khong quan sat duoc.
# Watcher bi giet theo reboot (PID 9480); T5 khoi dong lai watcher cho boot moi.
# Boot #63? (08:53:05Z 16/11, boot_id 725453a2-c8cb-44ba-a6f3-7222d0b2d00b,
# sau #62? 27p18 -- SO THU TU TAM, cho T6 dem lai mu #37): replay bat dau
# NHANH (configure 08:53:53Z, boot +48s); postboot FAIL exit 1 luc boot ~2p39
# (thieu 5 lib + GST + 11 goi apt); apt-get update chua thay chay luc +2p39
# (wrapper dang chay). Watcher T5 (doi 2) quan sat 60 phut cho boot moi.
# Xem docs/PHASE9_ROUND121_T5_INFRA_LIMITS.md (cap nhat §5 + §13).
# Ket qua #63?: replay CHET dang (B) -- wrapper chet live trong cua so
# (09:07:48Z, 09:08:48Z], khong bao gio chay apt-get update; luat
# replay-chet §8.2 kich hoat LAN DAU (du 5/5 dieu kien, verify sach
# 09:12:22Z) -> --repair chay song LAN DAU 09:14:14Z -> 09:26:57Z, exit 0,
# PASS; postboot PASS kiem doc lap 09:27:19Z + watcher xac nhan 4 lan;
# headroom hoi 0 -> 5435-5436. Xem LIMITS dot 121 T5 §7.3/§13.6.
# Boot #64? (11:05:18Z 16/11, boot_id 3fe7e89e-ec8d-49d7-a7f0-2616bed14828,
# sau #63? 2h12m13 -- SO THU TU TAM, cho T6 dem lai mu #37): replay khoi
# dong MUON (configure 11:35:39Z, boot +30m21, 2 dong dpkg.log; apt-get
# update pid 855 + wrapper pid 834 dang chay luc +32m); postboot FAIL
# exit 1 luc boot ~32m (thieu 5 lib + GST + 11 goi apt); headroom 4440
# (hoi tu 0 o #62?, thap hon 5436 o #63?). Watcher T5 dot 122 quan sat
# 60 phut; luat §8.2 KHONG kich hoat luc +32m vi replay dang SONG.
# Xem docs/PHASE9_ROUND122_T5_INFRA_LIMITS.md.
# Ket qua #64?: replay KET dang (C) song nhung ket o apt-get update --
# apt-get update pid 855 chay 64p+ (etime 01:04:26 luc 12:40Z), 0% CPU,
# khong tien trien filesystem ~58p (partial im tu 11:41:39Z, lists dong
# bang 111, dpkg 2 dong); mirror khoe (curl 200 trong 0,79s); luat §8.2
# KHONG kich hoat (apt+wrapper song) -> KHONG repair; postboot FAIL suot
# luot; headroom 4440 -> 4552. Xem docs/PHASE9_ROUND122_T5_INFRA_LIMITS.md.
# Boot #65? (12:53:25Z 16/11, boot_id fbc42445-8967-473e-bab7-d690d49ce13a,
# sau #64? 1h48m07 -- SO THU TU TAM, cho T6 dem lai mu #37): reboot giua
# luot dot 122, giet watcher T5 + gate-wait T4/T9; replay chay that
# (dpkg 2 -> 279 dong luc 13:14Z, -> 599 dong, GST 0 -> 119 file,
# gstreamer1.0-tools 14:01:09Z) nhung KHONG xong han: 14:06:06Z 0 apt/dpkg
# chay, dpkg.log im tu 14:01:09Z, postboot GAN DAT (chi thieu libav +
# 2 goi apt: gstreamer1.0-plugins-bad, gstreamer1.0-libav) -- khong co
# watcher nao ghi co cho boot nay (T5 dot 122 da xong tren #64); T4 att3
# DEFER-POSTBOOT. Xem build-loop-log (T9/T4 dot 122).
# Boot #66? (14:24:43Z 16/11, boot_id 9bbda390-bd64-4679-a1ff-3619899cee7d,
# sau #65? 1h31m18 -- SO THU TU TAM, cho T6 dem lai mu #37): replay khoi
# dong 14:35:39Z (boot +10m56, 2 dong dpkg.log; apt-get update pid 813 +
# wrapper pid 792 dang chay luc +19m, partial dang fetch); postboot FAIL
# exit 1 luc boot ~19m (thieu 5 lib + GST + 11 goi apt); headroom 4447.
# Watcher T5 dot 123 quan sat 60 phut; luat repair dang (C) (quyet parent
# dot 122 §12.4) CO HIEU LUC tu dot nay -- ap dung neu du 5 dieu kien.
# Xem docs/PHASE9_ROUND123_T5_INFRA_LIMITS.md.
# Ket qua #66?: replay CHAY TOT va PASS -- configure 14:35:39Z
# (boot +10m56), apt-get update pid 813 chay 14:35-~14:45Z (xong, khong
# ket), installs 14:45:33-14:48:19Z, dpkg 2 -> 1509 dong, goi cuoi
# gstreamer1.0-tools 14:48:19Z (boot +23m36); postboot PASS exit 0 luc
# 14:48:41Z (boot +23m58, wrapper/libs/GST/apt du); headroom 4447;
# wrapper chet (closing pass xong) giua 14:50:44-14:51:44Z. NHUNG boot
# CHET 14:52:19Z sau chi 27p36 (reboot giua luot) -- PASS chi co gia tri
# cho boot da chet; watcher T5 (7 poll) + phien exec cung chet theo.
# Boot #67? (14:52:19Z 16/11, boot_id 94e29be5-a52c-4840-9ca9-4e896482e4a2,
# sau #66? 27m36 -- SO THU TU TAM, cho T6 dem lai mu #37): replay khoi
# dong NHANH 14:52:59Z (boot +40s, 2 dong dpkg.log; apt-get update pid 808
# + wrapper pid 782 dang chay luc +1m34, partial 67 file dang fetch);
# postboot FAIL exit 1 luc boot ~1m34 (thieu 5 lib + GST + 11 goi apt);
# headroom 2830 (GIAM manh tu 4447 o #66?). Watcher T5 dot 123 (doi 2)
# quan sat 60 phut cho boot moi; luat repair dang (C) van co hieu luc.
# Xem docs/PHASE9_ROUND123_T5_INFRA_LIMITS.md.
# Boot #68? (17:33:51Z 16/11, boot_id 69359761-1650-4956-b3cb-481410689a9b,
# sau #67? 2h41m32 -- SO THU TU TAM, cho T6 dem lai mu #37): replay khoi
# dong NHANH 17:35:42Z (boot +1m51, 2 dong dpkg.log); installs xong
# 17:38:42Z (boot +4m51, dpkg 2 -> 1509 dong, goi cuoi gstreamer1.0-tools);
# postboot PASS exit 0 luc 17:42:03Z (boot +8m12, wrapper/libs/GST/apt du);
# 2 goi tung thieu o #65? (plugins-bad 17:37:27Z, libav 17:37:37Z) DEU
# DUOC CAI o boot nay -- mau hinh thieu 2 goi o #65? KHONG lap lai.
# Boot #69? (20:35:11Z 16/11, boot_id 670c07f6-2299-43f6-951c-0cf1116afd6d,
# sau #68? 3h01m20 -- SO THU TU TAM, cho T6 dem lai mu #37; khung gio
# chet co the 18:50Z-20:35:11Z): dpkg.log chi 2 dong configure 20:35:38/39Z
# (boot +27s/+28s) roi IM -- 0 apt/dpkg chay luc +6m, lists gan trong,
# GST he thong 0 file; postboot try1 FAIL exit 1 luc 20:42:24Z (boot +7m13s);
# giong che do #60? (cham ma khong cai) nhung configure som hon nhieu;
# watcher T5 dot 125 doi toi da 30 poll xem replay co quay lai khong.
# KET CUC: boot #69? CHET ~20:54:4xZ, chi song ~19-20 phut; replay KHONG BAO
# GIO TOI (dpkg dong bang 2 dong, postboot FAIL 12/12 poll + try1 +
# after-edit); co POSTBOOT_PASS cho #69? KHONG BAO GIO duoc viet.
# Xem docs/PHASE9_ROUND125_T5_INFRA_LIMITS.md.
# Boot #70? (20:54:19Z 16/11, boot_id 310f07e4-f789-427a-bee8-a9aefd5a1f02,
# sau #69? 19m08 -- SO THU TU TAM, cho T6 dem lai mu #37): replay DANG
# CHAY -- configure 20:55:02Z (boot +43s), installs tu 20:55:40Z
# (boot +1m21s), dpkg.log 470 dong luc 20:56:53Z (boot +2m34s); watcher
# T5 dot 125 (b70) doi PASS, ghi co POSTBOOT_PASS ngay khi dat.
# headroom 4438 luc mo. Watcher T5 dot 124 quan sat 15 phut sau PASS;
# luat repair dang (C) van co hieu luc (danh gia lan 2 o dot nay).
# Xem docs/PHASE9_ROUND124_T5_INFRA_LIMITS.md.
# Boot #71? (23:25:41Z 16/11, boot_id ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69,
# sau #70? 2h31m22 -- SO THU TU TAM, cho T6 dem lai mu #37; #70? chet trong
# khung (21:48Z, 23:25:41Z]): replay khoi dong MUON 23:35:40Z (boot +9m59s)
# nhung chay NHANH -- installs xong 23:37:46Z (boot +12m05s, dpkg 2 -> 1509
# dong, goi cuoi gstreamer1.0-tools); 2 goi tung thieu o #65? (libav,
# plugins-bad) DEU DUOC CAI; watcher T5 dot 126 (b71) doi PASS, ghi co
# POSTBOOT_PASS ngay khi dat; luat §8.2 dang (B) nguong dpkg im >=10p
# (quyet parent dot 125 §12(b)) -- danh gia o MOI poll khi dpkg dong bang.
# Xem docs/PHASE9_ROUND126_T5_INFRA_LIMITS.md.
# Boot #72? (02:10:17Z 17/11, boot_id 81464315-ba1a-460d-b370-92a1673accc1,
# sau #71? 2h44m36 -- SO THU TU TAM, cho T6 dem lai mu #37; #71? chet trong
# khung (00:44:50Z, 02:10:17Z]): replay khoi dong MUON 02:35:39Z (boot
# +25m22s, 2 dong dpkg.log configure) -- muon hon #71? (+9m59s) va gan
# #64? (+30m21s); apt-get update pid 842 + wrapper pid 821 DANG CHAY luc
# +30m, partial 26 -> 33 file trong ~2 phut (dang fetch, co tien trien --
# chua phai dang (C) ket update); GST he thong 0 file; watcher T5 dot 127
# (b72) doi PASS, ghi co POSTBOOT_PASS ngay khi dat; luat §8.2 dang (B)
# nguong dpkg im >=10p danh gia o MOI poll khi dpkg dong bang + luat (C)
# theo doi apt 0% CPU / partial im >=15p. Xem
# docs/PHASE9_ROUND127_T5_INFRA_LIMITS.md.
# KET CUC #72?: replay CHET dang (A) "toi nhung thieu GST" — update xong
# nhung lists `noble` goc KHONG VE (8 file ket o partial/), chi 48 installs,
# goi cuoi tools 02:48:06Z, wrapper chet; luat §8.2 dang (A) du 5/5 luc
# 03:03:30Z (dpkg im 924s >= 15p); --repair chay 03:04:31Z (GST symlink
# -> debroot XONG) thi CELL REBOOT ~03:04:25Z giet ca repair + watcher
# (boot chet 54m08s); co POSTBOOT_PASS KHONG BAO GIO duoc viet cho #72?.
# Boot #73? (03:04:25Z 17/11, boot_id 5e522260-235e-4394-a888-bce604728204,
# sau #72? 54m08 -- SO THU TU TAM, cho T6 dem lai mu #37): replay KHOE,
# khoi dong NHANH — configure 03:05:03Z (boot +38s), unpack 03:05:42Z,
# installs xong 03:09:2xZ (dpkg 2 -> 1509 dong, 217 installs, goi cuoi
# gstreamer1.0-tools); watcher T5 dot 127 (b73, v4) doi PASS, ghi co
# POSTBOOT_PASS ngay khi dat. Xem docs/PHASE9_ROUND127_T5_INFRA_LIMITS.md.
# KET CUC #73?: CHET trong khung (04:28:53Z, 04:55:04Z] — song ~1h50m;
# lan cuoi con song la T10 dong dot 127 luc 04:28:53Z (uptime 1:24).
# Boot #74? (04:55:04Z 17/11, boot_id c279cf46-a38b-4d93-b6e9-fa251b078108,
# sau #73? 1h50m39 -- SO THU TU TAM, cho T6 dem lai mu #37): replay
# khoi dong MUON 05:35:43Z (boot +40m39s, 2 dong dpkg.log configure —
# muon thu 2 sau #54? +47m14s, muon hon #72? +25m22s) nhung chay NHANH
# va XONG HAN: unpack 05:36:14Z, installs 05:36:14-05:38:51Z (boot
# +43m47s, dpkg 2 -> 1509 dong, 217 installs, goi cuoi
# gstreamer1.0-tools); lists noble GOC DAY DU (71 file, 68 noble,
# partial/ trong) — KHAC #72? (lists noble khong ve, chi 350 dong);
# hinh dang replay TRO LAI baseline 1.509 dong — #72 la ngoai le mot lan
# (xac nhan quyet parent dot 127 §12.2(i): #73 1509 + #74 1509).
# Watcher T5 dot 128 (b74, v4) doi PASS, ghi co POSTBOOT_PASS ngay khi
# dat. Xem docs/PHASE9_ROUND128_T5_INFRA_LIMITS.md.
# KET CUC #74?: CHET trong khung (06:20:05Z, 07:13:31Z] — lan cuoi con
# song la T10 dong dot 128 luc 06:20:05Z; tuoi tho 1h25m01s-2h18m27s.
# Reboot thu 4 lien tiep roi vao khoang giua dot dong va luot mo.
# Boot #75? (07:13:31Z 17/11, boot_id 475406f6-8cd8-4a97-a5b3-e798f24d1a26,
# sau #74? 2h18m27 -- SO THU TU TAM, cho T6 dem lai mu #37): replay
# khoi dong RAT MUON 08:35:43Z (boot +1h22m12s — MUON NHAT tung ghi,
# vuot #54? +47m14s; configure chi 8 giay TRUOC luot cron 15:35 +07
# dispatch 08:35:51Z, giong #74) nhung XONG HAN: unpack 08:36:07Z,
# installs 08:36:07-08:41:46Z (boot +1h28m15s, dpkg 2 -> 1509 dong,
# 217 installs, goi cuoi gstreamer1.0-tools); lists 39 file / 34 noble
# CHI 1 mirror azure (khac #74: 71 file / 68 noble / 2 mirror azure +
# cogentco) — partial/ trong, apt 11/11 PASS, GST 269, chuc nang du.
# Watcher T5 dot 129 (b75, v4) ghi co POSTBOOT_PASS 08:43:05Z
# (boot +1h29m34s). Xem docs/PHASE9_ROUND129_T5_INFRA_LIMITS.md.
# KET CUC #75?: CHET GIUA LUOT trong khung (08:59:16Z, 09:02:12Z] —
# tuoi tho 1h45m45s-1h48m41s; reboot giua luot DAU TIEN T5 ghi nhan;
# T4 attempt2 bi giet giua chung; co POSTBOOT_PASS cua #75? thanh STALE.
# Boot #76? (09:02:12Z 17/11, boot_id 88f62ae6-a216-42a9-8a81-b36fd83ca019,
# sau #75? 1h48m41 -- SO THU TU TAM, cho T6 dem lai mu #37): replay
# dang (B) "cham ma khong cai" — configure 09:03:05Z (boot +53s,
# 2 dong dpkg.log) roi im han, 0 install, lists 5 file, GST 0 file;
# §8.2(B) TRIGGER=YES 09:13:06Z (dpkg im 600s, du 5/5, kiem chung doc
# lap 09:14:42Z); T5 chay --repair 1 lan co giam sat 09:15:07Z:
# apt-get update mat ~14 phut (partial/ 0 -> 123 file, lists 5 -> 75),
# install xong 09:30:23Z (dpkg 2 -> 759 dong, 109 installs — chi 11 goi
# WebKit/GST + deps, KHONG phai toan bo replay 217 goi); postboot PASS;
# watcher T5 dot 129 (b76, v4) ghi co POSTBOOT_PASS moi 09:32:15Z
# (boot +30m03s). GST la symlink -> debroot (repair lam truoc khi apt
# install; file plugin apt cai ghi xuyen symlink vao debroot).
# Xem docs/PHASE9_ROUND129_T5_INFRA_LIMITS.md §3.5.
# KET CUC #76?: CHET trong khung (10:02:05Z, 10:56:31Z] — lan cuoi con
# song: T10 dong dot 129 luc 10:02:05Z (suite 27/27 + O8 21/21 + 21/21
# deu tren boot nay); tuoi tho 59m53s-1h54m19s. Reboot giua dot dong va
# luot mo lan thu 5 lien tiep.
# Boot #77? (10:56:31Z 17/11, boot_id 86538084-410e-41d4-a4bf-e68574dc2d91,
# sau #76? 1h54m19 -- SO THU TU TAM, cho T6 dem lai mu #37): replay
# dang (B) "cham ma khong cai" — configure 11:35:39Z (boot +39m08s,
# chi 12 giay TRUOC dispatch cron 11:35:51Z — trung mau #74/#75),
# 2 dong dpkg.log roi im, 0 install, lists 5 file, GST 0 file;
# §8.2(B) TRIGGER du kien ~11:45:40Z (dpkg im 600s) — xem
# docs/PHASE9_ROUND130_T5_INFRA_LIMITS.md.
# KET CUC #77?: CHET trong khung (13:02:16Z, 13:02:41Z] — lan cuoi con
# song ghi nhan 13:02:16Z (task T5b); tuoi tho 2h05m45s-2h06m10s.
# Reboot GIUA LUOT lan thu 2 lien tiep (#75? chet giua luot dot 129,
# #77? chet giua luot dot 130 — T5b lam postboot cho boot moi).
# Boot #78? (13:02:41Z 17/11, boot_id 57c3e5e2-c31f-4d85-9e0e-28d615c0d061,
# sau #77? 2h06m10s -- SO THU TU TAM, cho T6 dem lai mu #37): replay
# DANG CHAY (KHAC dang (B)) — configure 13:03:24Z (boot +43s),
# apt-get update dang chay tu ~13:03:26Z (pid 805), partial/ tang dan
# 46 -> 62 file luc 13:15Z, dpkg.log 2 dong, 0 install, lists 3 file,
# GST 0 file; postboot FAIL luc mo (0/11 goi apt). Xem
# docs/PHASE9_ROUND130_T5B_INFRA_LIMITS.md.
# KET CUC #78?: CHET trong khung (14:15:34Z, 14:26:41Z] — lan cuoi con
# song ghi nhan 14:15:34Z (heartbeat 21:20:50+07 started, T7 dot 131
# thu hep; khung rong hon (14:09:54Z, 14:26:41Z] tu mtime
# round130-t10.done); tuoi tho 1h12m53s-1h24m00s. Reboot GIUA
# DOT DONG / LUOT MO lan thu 3 lien tiep (#75? giua luot dot 129, #77?
# giua luot dot 130, #78? giua dong 130 / mo 131).
# Boot MOI (14:26:41Z 17/11, boot_id f868abad-66fb-46e7-bbaa-cd3ec0cddf34,
# sau #78? 1h24m00s -- SO THU TU TAM, cho T6 dem lai mu #37 dot 131):
# replay DANG CHAY (KHAC dang (B)) — configure 14:35:39Z (boot +8m58s),
# apt-get update dang chay tu 14:35Z (pid 809), partial/ tang dan
# (92 file luc 14:42Z), dpkg.log 2 dong, 0 install, lists 3 file,
# GST 0 file; postboot FAIL luc mo. Xem
# docs/PHASE9_ROUND131_T5_INFRA_LIMITS.md.
# KET CUC boot f868abad (boot MOI dot 131): CHET trong khung
# (15:00:06Z, 15:01:30Z] — lan cuoi con song ghi nhan 15:00:06Z (mtime
# round131-t4.done, T4 dong luot yen #9 14:59Z); tuoi tho 33m25s-34m49s
# (tu btime 14:26:41Z). Reboot GIUA LUOT lan thu 4 lien tiep (#75?
# giua luot dot 129, #77? giua luot dot 130, #78? giua dong 130 / mo
# 131, f868abad giua luot dot 131 — T5 pha 1 vua xong 14:51Z, T4 dong
# luot yen #9 14:59Z, reboot 15:01:30Z giet session T5 luc cho pha 2).
# Boot MOI THU 2 (15:01:30Z 17/11, boot_id ad1327ef-e045-4d44-ae14-
# 13c76bab50ec, sau f868abad 34m49s -- SO THU TU TAM, cho T6 dem lai
# mu #37 dot 131): replay MOI BAT DAU — configure 15:02:19Z (boot
# +49s), dpkg.log 2 dong, 0 install, lists 5 file, partial 0 file
# luc 15:04Z (chua thay apt-get update chay — theo doi, co the dang
# (B) neu im lau); GST 0 file; postboot FAIL luc mo. Co POSTBOOT_PASS
# cua f868abad (PASS 14:50:18Z) da STALE — T5 viet lai tu dau cho boot
# moi nay. Xem docs/PHASE9_ROUND131_T5_INFRA_LIMITS.md §14.
# KET CUC boot ad1327ef (boot MOI THU 2 dot 131): CHET trong khung
# (16:07Z, 17:24:08Z] — lan cuoi con song ghi nhan 16:07Z (T10 dong dot 131
# luc 16:07Z, suite 27/27 + O8 21/21 + 21/21 deu tren boot nay); tuoi tho
# 1h05m30s-2h22m38s (tu btime 15:01:30Z). Reboot GIUA DOT DONG / LUOT MO
# lan thu 5 lien tiep (#75? giua luot dot 129, #77? giua luot dot 130,
# #78? giua dong 130 / mo 131, f868abad giua luot dot 131, ad1327ef giua
# dong 131 / mo 132). Co POSTBOOT_PASS cua ad1327ef (PASS 15:31:20Z) da
# STALE — T5 dot 132 viet lai tu dau cho boot moi; watcher v5 XOA CO
# STALE truoc khi ghi co moi (ghi de khi boot_id khac) — bai hoc §14.3
# dot 131 (FLAG_EXISTS already).
# Boot MOI THU 3 (17:24:08Z 17/11, boot_id b379ecd7-311c-4053-a43f-
# 507d21432ecc, sau ad1327ef 2h22m38s -- SO THU TU TAM, cho T6 dem lai
# mu #37 dot 132): replay DANG CHAY (KHAC dang (B)) — configure 17:35:39Z
# (boot +11m31s), apt-get update dang chay tu ~17:35Z (pid 814, wrapper
# os-intent pid 793), partial/ tang dan (28 file luc 17:41Z -> 34 luc
# 17:43Z), dpkg.log 2 dong, 0 install, lists 3 file, GST 0 file
# (thu muc chua ton tai); postboot FAIL luc mo. Xem
# docs/PHASE9_ROUND132_T5_INFRA_LIMITS.md.
# Boot MOI THU 4 (19:34:15Z 17/11, boot_id 07da9c50-5836-4481-a4a4-
# 7e22c6260325, sau b379ecd7 2h10m07s -- SO THU TU TAM, cho T6 dem lai
# mu #37 dot 132): b379ecd7 CHET trong khung (19:33:56Z, 19:34:15Z]
# (rong 19s -- khung hep NHAT tung kep) — reboot GIUA LUOT lan thu 6
# lien tiep, giet T4 luc dang cho gate A (0 attempt luot yen #10).
# Replay boot moi CHAY XONG NHANH — configure 19:34:46Z (boot +31s),
# cai xong 19:36:48Z (boot +2m33s, goi cuoi gstreamer1.0-tools),
# dpkg.log 1545 dong / 221 installs, lists 37, partial 0, GST 269 file,
# gstreamer1.0-gl DA CAI BOI REPLAY (19:35:28Z) — KHAC boot b379ecd7
# (thieu goi nay, phai --repair 1 lan); 0 apt/dpkg/wrapper luc T5b mo;
# postboot PASS ngay poll0 (exit 0), KHONG can repair. Xem
# docs/PHASE9_ROUND132_T5B_INFRA_LIMITS.md.
# Dot 133 (luot cron 03:35 +07 18/11, mo 20:35Z 17/11): CUNG boot 07da9c50,
# chua reboot luc mo (btime 19:34:15Z). Replay da xong tu dot 132 (1545 dong
# / 221 installs, GST 269 file, gstreamer1.0-gl da cai boi replay) — postboot
# PASS lai tu poll0. Watcher T5 dot 133 (b84, v6) xac nhan PASS on dinh 2
# poll + ghi co gate-visible vao round133-t5/. Widen trigger §8.2(B) theo
# quyet parent dot 132 §12.3(b) nam trong WATCHER b84 (them dang (A2):
# thieu >=1 goi dich sau khi replay xong), KHONG nam trong script nay —
# script nay chi doi header/say, KHONG doi logic. Xem
# docs/PHASE9_ROUND133_T5_INFRA_LIMITS.md.
# Dot 134 (luot cron 06:35 +07 18/11, mo 23:35Z 17/11): REBOOT MOI sau khi
# dot 133 dong — boot d2e66749 (btime 23:26:58Z 17/11), boot cu 07da9c50
# chet trong khung (22:12Z, 23:26:58Z] (reboot GIUA LUOT lan thu 7 lien
# tiep — sau khi 8/9 luong dot 133 da xong, khong luong nao mat viec).
# Replay boot moi CHAY XONG NHANH — configure 23:35:39Z (boot +8m41s),
# cai xong 23:37:47Z (boot +10m49s, goi cuoi gstreamer1.0-tools),
# dpkg.log 1545 dong / 221 installs (TRUNG SO voi boot cu — replay
# dinh luong), lists 39, partial 0, GST 269 file, gstreamer1.0-gl DA
# CAI BOI REPLAY — KHAC boot b379ecd7 (thieu goi nay, phai --repair 1
# lan); 0 apt/dpkg/wrapper luc T5 mo. Watcher T5 dot 134 (b85, v6)
# xac nhan PASS on dinh 2 poll + ghi co gate-visible vao round134-t5/.
# Widen trigger §8.2(B) v6 (dang A2) nam trong WATCHER b85, KHONG nam
# trong script nay. Quyet parent dot 133 §12.3: PHE DUYET SUA
# instrumentation log draw preview.tsx:705 (T3 dot 134) + do lai luot
# yen #11 voi logger da noi.
# Dot 134 — BOOT MOI THU 2 (23:53:17Z 17/11, boot_id 81335571-099d-4896-
# b180-620577ac8140): boot d2e66749 CHET GIUA LUOT (reboot GIUA LUOT lan
# thu 8 lien tiep) trong luc T4 attempt1 dang chay pass 3/20 — cell
# runtime restart giet ca poller T4 (PID 14270); T4 khoi dong lai
# poll-wait 23:56:13Z, han 01:00Z, cho co POSTBOOT_PASS MOI cua T5 cho
# boot nay. Replay boot moi MOI BAT DAU luc T5 mo lai: dpkg.log chi 2
# dong "startup packages configure" 23:54:09Z (boot +52s), 0 install,
# lists 5, partial 0, GST 0 file, gstreamer1.0-gl CHUA CAI, 0 proc
# apt/dpkg/wrapper — replay co the dang o pha update (chua ghi dpkg.log)
# hoac da dung; watcher b86 theo doi moi 60s + danh gia §8.2(B)/(C) moi
# poll. preview.tsx van 530e10a7 (fix T3 dot 134 CON NGUYEN sau reboot).
# Dot 134 — BOOT MOI THU 3 (00:13:50Z 18/11, boot_id 1d2e984d-7213-4098-
# a222-f8750b26626f): 2 reboot trong ~1 phut — boot 81335571 chet
# ~00:12:55Z (reboot #9) GIUA LUC T5 --repair dang apt-get update (GST
# symlink da sua xong, update dang chay partial=113, install CHUA BAT
# DAU — repair BI GIAN DOAN BOI REBOOT, khong phai that bai; watcher
# b86 chet theo); boot 52ca5d6d (00:12:55Z) chet ~00:13:50Z (reboot #10,
# song <1 phut). Boot 1d2e984d: replay DANG CHAY MANH luc T5 mo lai
# (dpkg 566 dong / 83 installs 00:17:15Z, tang ~300 dong/46s; GST 32
# file dang tang; gstreamer1.0-gl DA CAI; lists 37; apt-get os-intent +
# wrapper dang chay) — watcher b87 theo doi toi khi replay xong +
# postboot PASS on dinh 2 poll roi ghi co gate-visible moi vao
# round134-t5/. preview.tsx van 530e10a7 (fix T3 CON NGUYEN qua 2
# reboot). T4 khoi dong lai poller lan 3 (00:15:37Z, han 01:00Z).
# Dot 134 — BOOT MOI THU 4 (00:17:36Z 18/11, boot_id cc1f9de0-4f66-49e3-
# 91d7-4f3fab07ca39): boot 1d2e984d chet ~00:17:36Z (reboot #11; song
# ~3m46s — replay cua no dang chay manh, dpkg 729 dong luc chet theo
# poll #4 cua T4, chua kip PASS). Boot cc1f9de0: dpkg 2 dong / 0 install
# luc 00:19:49Z (boot +2m13s), GST 0, lists 3, partial 8 (dang tang);
# apt-get update (pid 795) + wrapper os-intent (pid 774) DANG CHAY —
# replay DA BAT DAU (khac 81335571: 0 proc 10 phut). Watcher b87 theo
# doi toi khi replay xong + postboot PASS on dinh 2 poll roi ghi co
# gate-visible moi vao round134-t5/. preview.tsx van 530e10a7 (fix T3
# CON NGUYEN qua 3 reboot). T4 khoi dong lai poller lan 4 (00:19:28Z,
# han 01:00Z). Luu y: dong ho cell cu (1d2e984d) chay nhanh hon gio host
# vai chuc giay — timestamp 2 phia lech nhau o ranh gioi reboot.
# Dot 135 — BOOT MOI (02:27:38Z 18/11, boot_id 78b55838-d09e-4cfc-b491-
# a15935b7a447): boot cc1f9de0 chet ~02:27Z (reboot sau dot 134 dong;
# co POSTBOOT_PASS cua cc1f9de0 01:13:56Z thanh STALE — watcher dot 135
# archive luc khoi dong). Boot moi: replay DA XONG luc T5 mo
# (02:41:48Z, boot +14m10s): dpkg 1545 dong / 221 installs (TRUNG
# baseline d2e66749), dong cuoi 02:37:47Z (gstreamer1.0-tools, boot
# +10m09s); GST 269 file; lists 37; partial 0; gstreamer1.0-plugins-bad
# DA CAI 1.24.2-1ubuntu4 (khac cc1f9de0: replay lan nay KHONG bo qua
# goi nay); gl 1.24.2-1ubuntu0.7 DA CAI; 0 proc apt/dpkg/wrapper luc
# mo. Postboot poll0 PASS exit 0 ngay (02:41Z). Watcher b88 v6 theo
# doi toi khi postboot PASS on dinh 2 poll roi ghi co gate-visible
# moi vao round135-t5/. preview.tsx van 530e10a7 (fix T3 CON NGUYEN).
# RAM luc mo chi ~905 MB (duoi gate A ≥1024 MB — viec cua T4).
# Dot 136 (luot cron 12:35 +07 18/11, mo 05:35Z 18/11): REBOOT MOI giua
# dot 135 va 136 — boot 1ca1feaa (btime 05:29:34Z 18/11, boot_id
# 1ca1feaa-af3b-41dc-aaae-34376329b0a3); boot bcc71e61 (btime 03:35:20Z,
# chet ~05:29Z) — reboot GIUA DOT DONG / LUOT MO; co POSTBOOT_PASS cua
# 78b55838 (02:45:13Z) thanh STALE — watcher dot 136 archive luc khoi
# dong. Boot moi: replay DANG CHAY luc T5 mo (05:41Z, boot +11m):
# dpkg.log chi 2 dong "startup packages configure" 05:35:43Z (boot
# +6m09s), 0 install, lists 3, partial 0, GST 0 file; apt-get update
# pid 814 + wrapper os-intent pid 793 DANG CHAY — replay DA BAT DAU
# (khac dang (B): co proc apt). Watcher T5 dot 136 (b89, v6) theo doi
# toi khi replay xong + postboot PASS on dinh 2 poll roi ghi co
# gate-visible moi vao round136-t5/. preview.tsx 530e10a7 (fix T3 CON
# NGUYEN, khoi phuc theo quyet parent dot 135 §12.3(a)). RAM luc mo
# ~1.374 MB (theo log mo dot). Xem docs/PHASE9_ROUND136_T5_INFRA_LIMITS.md.
# Dot 137 (luot cron 15:35 +07 18/11, mo 08:35Z 18/11): REBOOT MOI giua
# dot 136 dong (07:26Z) va luot mo — boot 2104246b (btime 08:07:11Z theo
# uptime -s / 08:07:26Z theo stat /proc/1, chenh 15 s, boot_id
# 2104246b-04b2-4252-a642-b1a7cadeefe1); boot 1ca1feaa chet ~08:07Z.
# So thu tu TAM #93? (cho T6 dem lai — dai du bao dot 136 cho #93? la
# [05:56:47Z, 07:55:21Z], btime 08:07:11Z NAM NGOAI dai, muon ~12 phut;
# viec T2/T6). Replay khoi dong MUON: configure 08:31:35Z (boot +24m24s,
# 2 dong dpkg.log) — muon thu 3 sau #54? +47m14s va #72? +25m22s; apt-get
# update pid 856 + wrapper os-intent pid 831 DANG CHAY luc +24m; installs
# bat dau ~08:41Z (aspell). DIEM KHAC LON: /var/cache/apt/archives TRONG
# (0 .deb, 0 byte — khac dot 136: 178 .deb / 156M ben vung) nen replay
# lan nay PHAI DOWNLOAD (term.log 0 dong Get: — apt giu Last-Modified
# lam mtime file .deb nen KHONG dung mtime de do tuoi download, dung
# ctime; xem LIMITS); lists 3, partial 0, GST 0 file luc mo. RAM luc mo
# chi ~753 MB (MemAvailable) + Balloon 6.140.668 kB — balloon PHINH TRO
# LAI sau khi dot 136 xa -4,70 GB; gate A >=1024 MB cua T4 co the bi chan
# (viec T4). Headroom mo 2178 (giam tu 2281 mo dot 136; con 378 tren
# nguong bao ~1.800). Watcher T5 dot 137 (b90, v6) theo doi toi khi
# replay xong + postboot PASS on dinh 2 poll roi ghi co gate-visible moi
# vao round137-t5/. preview.tsx 530e10a7 (fix T3 CON NGUYEN). Xem
# docs/PHASE9_ROUND137_T5_INFRA_LIMITS.md (khi viet xong).
# Dot 137 — BOOT MOI THU 2 GIUA LUOT (09:36:01Z 18/11, boot_id
# 17db9652-ad06-409f-989c-cdbdba15d0af): boot 2104246b CHET GIUA LUOT
# trong khung (09:35:47Z, 09:36:01Z] (hep ~14 s: T4 poll #69 09:35:47Z
# con song, btime boot moi 09:36:01Z; tuoi tho ~1h28m45s) — reboot giua
# luot giet watcher b90 (poll 51 cuoi 09:36:02Z dong ho cu, dpkg 753 dong
# / 110 installs, GST 107 file) + poller T4 (poll #69 cuoi) + session
# exec cua T5; co POSTBOOT_PASS cho 2104246b KHONG BAO GIO duoc viet
# (replay dang chay, chua PASS). Replay boot 2104246b: configure
# 08:31:35Z (boot +24m24s) -> installs 08:41-09:33:55Z (110 installs,
# goi libav xong 09:10:32Z, plugins-bad 1 transaction dai 09:10:34-
# 09:33:55Z ~23m21s chi de download, cache 0 -> 131 .deb); bracket
# (configure +24m24s, chet luc 110 installs] — replay KHONG xong.
# Boot moi: replay khoi dong NHANH — configure 09:36:50Z (boot +49s),
# apt-get update pid 806 + wrapper pid 783 dang chay luc +1m30s; cache
# APT SONG QUA REBOOT: 133 .deb / 79M (khac boot 1: 0 .deb luc mo) nen
# replay lan nay chu yeu cai tu cache, du kien nhanh hon nhieu. RAM luc
# mo boot 2 ~1.904 MB, Balloon 4.885.304 kB. Watcher T5 dot 137 (b91,
# v6) theo doi boot moi toi khi PASS on dinh 2 poll roi ghi co
# gate-visible vao round137-t5/ (cung thu muc — co cho boot 1 chua tung
# ton tai nen NO_FLAG_AT_START).
# Dot 138 — BOOT MOI GIUA LUOT (11:52:20Z 18/11, boot_id
# 914964c3-c36a-4893-bf24-d8321e75d299): boot 17db9652 (#94?) CHET GIUA
# LUOT trong khung (11:52:12Z, 11:52:20Z] (hep ~8 s: T4 poll #13
# 11:52:12Z con song, btime boot moi 11:52:20Z; tuoi tho ~2h16m) —
# reboot giua luot giet sampler RAM T5 (mau cuoi 11:51:59Z) + poller T4
# (poll #13 cuoi) + session exec/sleep cua T5 (runtime restart). RAM
# truoc reboot len toi 6.112.624 kB (97,2% guard birefnet 6.144 MiB,
# T5 sampler 11:51:59Z; T4 poll #12 11:51:27Z thay 6.062 MB) — reboot
# cat dung luc RAM sap vuot guard; KHONG ai kip thu birefnet. Replay
# boot #94? da XONG HAN truoc khi chet (1545 dong / 221 installs /
# 462 configure, dong bang tu 09:42:06Z; postboot PASS). Boot moi:
# replay khoi dong — configure 11:53:11Z (boot +51s), apt-get update
# pid 802 dang chay; cache APT SONG QUA REBOOT: 178 .deb / 156M nen
# replay lan nay chu yeu cai tu cache. RAM mo boot moi ~1.748 MB,
# Balloon 5.074.548 kB. Watcher T5 dot 138 (b92, v6) theo doi boot
# moi toi khi PASS on dinh 2 poll roi ghi co gate-visible moi vao
# round138-t5/ (T4-138 doc uu tien round138-t5/, du phong round137-t5/).
# Dot 139 — BOOT MOI SAU DOT 138 (boot_id
# 541524e2-c789-420b-a27b-9287d68c63a3; btime kernel 13:53:41Z uptime -s /
# 13:53:52Z stat /proc/1 — LUU Y: brief dot 139 + round-in-progress.md ghi
# btime 14:03:07Z, MAU THUAN voi 5 nguon kernel (btime /proc/stat, uptime -s,
# stat /proc/1, who -b, journal first entry 13:53:53Z) + dpkg.log hoat dong
# 13:54:12–13:57:33Z tren log moi (khong the truoc boot) — T5-139 lay
# 13:53:41Z lam chuan, ghi sai lech thanh F-139-T5-1, cho T6/T10 phan xu;
# boot 914964c3 (#95? TAM) chet truoc khi T5-139 mo (khung chet cho T6/T2);
# replay boot moi: configure 13:54:12Z (boot +31s), xong 13:57:33Z
# (boot +3m52s) — 1545 dong / 221 installs / 462 configure, NHANH NHAT
# tu truoc toi nay (so voi #94? +6m05s); postboot PASS ngay lan kiem dau
# (T5-139 poll0, boot ~52' tuoi); GST he thong la thu muc THAT (apt)
# 269/269, khong can symlink K1; cache APT SONG: 178 .deb / 156M; lists 37;
# Balloon xa dan: 6.443.824 kB (ket dot 138) -> 5.022.776 kB (14:45:22Z),
# RAM avail 547 MB (mo dot) -> ~1,7 GB — gate A (>=1024 MB) co the mo
# lai o dot nay; KHONG can watcher (replay da xong truoc khi T5 mo),
# KHONG kich hoat luat (C) — (C) chi danh cho replay KET khi postboot FAIL.
# Dot 140 — BOOT MOI SAU DOT 139 (boot_id
# af558fb5-e964-4116-a69b-ec784f3defab; btime kernel 15:54:37Z uptime -s /
# 15:54:52Z stat /proc/1 — KHOP brief dot 140, khong lap lai F-139-T5-1;
# boot 541524e2 (#96? TAM) chet truoc khi T5-140 mo (khung chet cho T6/T2);
# replay boot moi: startup configure 15:55:19Z (boot +42s), GAP 805s
# (15:55:19–16:08:44Z) khong co apt/dpkg nao trong guest log (journal chi
# co housekeeping systemd; apt history Start-Date dau tien 16:08:44Z,
# 0 lan apt-get update) — nguyen nhan gap chua ro, co the host-side;
# cai that 16:08:44–16:11:16Z (2m32s), goi cuoi gstreamer1.0-tools,
# 1545 dong / 221 installs / 462 configure — TRUNG bracket day du,
# nhung boot +16m39s la CHAM NHAT wall-clock trong 3 replay day du
# (#94? +6m05s, #96? +3m52s); postboot PASS ngay poll0 (T5-140, boot
# ~1h45' tuoi); GST he thong that 269/269; cache APT SONG: 178 .deb /
# 156M; lists 39 (+2 cli.github.com vs 37 dot 139); Balloon 6.397.220 kB
# (ket dot 139) -> 5.930.172 kB (mo dot 140), RAM avail ~0,9 GB; headroom
# inotify mo dot 1840 — chi con ~40 tren nguong bao user (< ~1.800);
# KHONG can watcher (replay da xong truoc khi T5 mo), KHONG kich hoat
# luat (C).
# Dot 140 boot 2 — REBOOT GIUA LUOT (boot_id
# 90392aa5-f13b-4048-9c57-e4defc8e74d9; btime kernel 17:52:56Z uptime -s /
# 17:53:11Z stat /proc/1; boot af558fb5 chet giua luot, T4 attempt1 + sampler
# T5 + session T5 chet theo; dong ho cu co le nhanh ~+35s — moc hoat dong
# cuoi boot cu (sampler 17:53:19Z, chain T4 17:53:26Z) nam SAU btime boot
# moi 17:52:56Z, xem F-140-T5-2); replay boot moi CHET YEU: dpkg chi 2 dong
# tu 17:53:48Z, 0 proc apt/dpkg tu poll1, cache apt TRONG (0 .deb — khong
# song qua reboot lan nay), lists 5; watcher v6 poll 9 (18:04:01Z, silent
# 614s) TRIGGER=YES §8.2(B) form B; T5 verify doc lap 5/5 (18:05:06Z) roi
# --repair 1 lan (18:05:45Z): apt-get update OK sau ~9p (mirror cham),
# cai du 11 goi; RE-CHECK PASS; dpkg dong bang 795 dong / 113 installs /
# 230 configure (giong het boot #95? 914964c3 — repair 1 phan, KHONG phai
# replay day du 1545/221/462); GST la SYMLINK -> debroot (269 file, repair
# tao 18:05Z), khong phai thu muc that; watcher ghi co POSTBOOT_PASS
# 18:17:07Z poll 22 (PASS on dinh 2 poll); T4 doc co moi tu poll #29.
# Dot 141 — BOOT MOI SAU DOT 140 (boot_id
# 2c0efe57-5559-4e92-9f8b-aecf1f9866a3; btime kernel 19:54:12Z uptime -s /
# 19:54:22Z stat /proc/1 / 19:54:23Z journal first entry — KHOP brief dot
# 141; boot 90392aa5 (#98? TAM) chet truoc khi T5-141 mo (reboot #23 trong
# luc dong so dot 140); replay boot moi CHAY TOT: startup configure
# 19:54:43Z (boot +31s), cai that 19:55:18–19:58:09Z (2m51s), goi cuoi
# gstreamer1.0-tools, 1545 dong / 221 installs / 462 configure — TRUNG
# bracket day du, xong boot +3m57s (nhanh thu 2 trong cac replay day du,
# sau #96? +3m52s; KHONG co GAP nhu dot 140 boot 1, 805s); cache APT SONG
# QUA REBOOT: 178 .deb / 156M (khac dot 140 boot 2: 0 .deb — gia dinh
# cache song lai dung lan nay, xem F-140-T5-3); lists 39; GST he thong
# that 269/269; term.log 0 dong Get: (cai tu cache); postboot PASS ngay
# poll0 (T5-141 20:40:47Z, boot ~46' tuoi); co POSTBOOT_PASS ghi 20:41:02Z
# poll=0; T4 doc co poll #1 20:42:02Z va MO CUA YEN #17 poll #2 20:42:47Z
# (RAM 1485MB), attempt1 chay ngay; headroom inotify mo dot 1737 — DA
# CHAM DUOI nguong bao user (< ~1.800) lan dau (dot 140 dong 1838; T10
# BAO PARENT RO); KHONG can watcher (replay da xong truoc khi T5 mo),
# KHONG kich hoat luat (C).
# Dot 142 — BOOT MOI SAU DOT 141 (boot_id
# bde599df-eb81-4205-86a0-b71a0ab9790c; btime kernel 22:48:05Z uptime -s /
# 22:48:16Z stat /proc/1 / 22:48:17Z journal first entry; boot 2c0efe57 (#99?
# TAM) chet truoc khi T5-142 mo (reboot #25 luc dong so dot 141);
# replay CHET DANG (B) "cham ma khong cai" — dpkg.log CHI 2 dong
# "startup packages configure" 22:48:39Z (boot +34s) roi im han, 0 proc
# apt/dpkg/wrapper, cache apt TRONG (0 .deb), lists 5 (chi cli.github.com),
# GST dir KHONG TON TAI, /var/log/apt KHONG TON TAI; postboot FAIL exit 1
# poll0 23:42Z (thieu 5 lib + GST + 11 goi apt); §8.2(B) form B TRIGGER=YES
# (verify doc lap 5/5 23:43:32Z: postboot FAIL tuoi, 0 proc, dpkg im
# 3293s >= 600, form B 2 dong/0 installs/GST absent/lists 5, MiniBrowser 0;
# luat (C) KHONG du — lists 5 > 3, khong co apt song) -> --repair 1 lan
# duy nhat 23:44:06Z: GST symlink lai -> debroot (269 file), apt-get update
# OK nhanh (~1 phut, mirror khoe), cai du 11 goi, RE-CHECK toan PASS;
# dpkg dong bang 795 dong / 113 installs / 230 configure (mtime 23:46:02Z,
# goi cuoi libc-bin — Y HET boot 90392aa5 dot 140: repair-1-phan, KHONG
# phai replay day du 1545/221/462); GST la SYMLINK -> debroot; cache
# 110 .deb / 57M; lists 75; postboot PASS kiem doc lap poll1 exit 0;
# headroom inotify mo dot 1614 (giam tu 1720 cuoi dot 141, van DUOI nguong
# bao < ~1.800 — theo doi, khong bao rieng). Xem
# docs/PHASE9_ROUND142_T5_INFRA_LIMITS.md.
# R9 đợt 115: (i) timeout RIÊNG cho apt-get update (1500 s) + install
# (1800 s) trong --repair — báo rõ khi timeout (exit 124) thay vì treo
# cả script khi mirror chậm; (ii) nhánh symlink GST trong --repair BỎ
# QUA khi replay đang chạy (lock/apt/dpkg) để không cướp thư mục plugin
# thật mà replay đang cài (lỗi này đã xảy ra ở boot #45: apt replay ghi
# vào debroot qua symlink).
# lần sau có thể khác); (b) symlink
# /usr/lib/.../gstreamer-1.0 -> debroot của K1 (đợt 109) là ephemeral, mất
# sau reboot; (c) wrapper MiniBrowser của Playwright ghi đè LD_LIBRARY_PATH
# (K1 đã vá 1 dòng, bản vá nằm trong ~/.cache nên sống qua reboot).
#
# Cách dùng (sau mỗi reboot, TRƯỚC khi chạy probe WebKit):
#   bash apps/web/scripts/vcut-webkit-postboot-check.sh [--repair] [--launch-test]
# Không tham số: chỉ kiểm tra, in PASS/FAIL từng mục, exit 0 nếu đủ chạy WebKit
# (launch được; decode video chỉ đủ khi plugin đầy đủ — xem mục GST).
# --repair: vá lại wrapper (nếu bị revert) + tạo lại symlink GST -> debroot
#   (nếu thư mục plugin hệ thống chưa đủ) + chạy `apt-get update` rồi cài apt
#   các package còn thiếu (Q7 đợt 114 — lists trống sau reboot nên install
#   thẳng luôn FAIL; update trước rồi mới install)
#   (CHỈ khi apt không bị khóa; nếu replay hệ thống đang giữ lock thì BỎ QUA
#   bước apt và báo rõ — không tranh lock).
# --launch-test: launch WebKit tối thiểu qua Playwright (cần Xvfb + DISPLAY
#   hoặc để script tự spawn Xvfb :195).
#
# KHÔNG push/tag. Không sửa production. Không reboot máy.
set -u
REPAIR=0; LAUNCH_TEST=0
for a in "$@"; do case "$a" in --repair) REPAIR=1;; --launch-test) LAUNCH_TEST=1;; *) echo "tham số lạ: $a (chỉ nhận --repair, --launch-test)"; exit 2;; esac; done

BOOT=$(uptime -s 2>/dev/null || echo "?")
WRAP=~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/MiniBrowser
WRAP_ORIG=~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k1/MiniBrowser-wrapper.orig
GST_SYS=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
DEBROOT=/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu
DEBROOT_GST=$DEBROOT/gstreamer-1.0
FAIL=0
say() { echo "[postboot $BOOT] $*"; }

# Dot 151 — BOOT MOI SAU DOT 150 (boot_id
# 2e430750-6ba0-47b6-bf22-902953eff096; btime /proc/stat 01:25:51Z
# 20/11 (epoch 1795137951; uptime -s KHOP); /proc/1 01:26:02Z (offset
# 11 s); boot e9295700 chet o reboot #41 (01:25:51Z, GIUA harness
# T8-150), tuoi tho 6.822 s = 1h53m42s (stat->stat: 23:32:09Z ->
# 01:25:51Z); run 150 mo 02:35:51Z — thuoc T7-151 (quyet parent
# 150 (q)); replay boot moi TOI TU NHIEN VA NHANH: hoat dong dpkg
# dau 01:26:35Z (boot +44s), cai xong 01:30:13Z (boot +4m22s),
# 1545 dong / 106 startup / 169 install / 9 upgrade / 178 configure
# / 1040 status / 43 trigproc, goi cuoi gstreamer1.0-tools, md5
# 51d12c3d (KHAC md5 d2b2e788 dot 146/147 — noi dung replay doi, co
# 9 dong upgrade mesa 25.2.8-0ubuntu0.24.04.5); 0 entry sau
# 01:30:13Z; cache APT SONG 178 .deb/156M (mtime truoc boot —
# chuoi 0 .deb 2 lan DUT, khong keo dai sang lan 3; chi ghi nhan
# theo quyet (l) 149 / (r) 150); lists 37 (1 mirror azure); GST
# thu muc that (apt) 269 file = debroot 269 — KHONG can symlink
# repair; postboot PASS poll1 T4 manual 02:38Z + poll2 T5 doc lap
# 02:40:23Z exit 0; co POSTBOOT_PASS moi cho boot 2e430750 ghi
# 02:43:12Z poll=2 (replay-day-du, KHONG can repair); CHIEN LUOC
# MOI (quyet parent 150 (h)): watcher dot 151
# (replay-watch-151.sh) kich --repair som o boot+15' neu dpkg.log
# dong bang / 0 hoat dong apt, khong cho watcher timeout 60' — ap
# cho moi reboot trong phien; headroom: T9-151 do (T5 khong probe
# lai de tranh nhieu T4).
# Dot 150 — BOOT MOI SAU DOT 149 (boot_id
# e9295700-bda0-4a9b-8aab-4dd57661212e; btime /proc/stat 23:32:09Z
# 19/11 (epoch 1795131129; uptime -s KHOP); /proc/1 23:32:24Z (offset
# 15 s); boot 802f358f chet o reboot #40 (23:32:09Z), tuoi tho
# 7.698 s = 2h08m18s (stat->stat: 21:23:51Z -> 23:32:09Z); run 149
# SUCCEEDED 23:04:36Z TRUOC reboot (khong bi viet lai them);
# replay boot moi KHONG TOI: chi 2 dong "startup packages
# configure" 23:35:42Z (boot +3m33s — 9 s truoc khi luot cron 150
# mo 23:35:51Z, cung mau dot 149: replay 13 s truoc run mo),
# sau do im hoan toan — watcher 60' TIMEOUT 00:44:15Z (120 poll,
# dpkg van 2 dong, md5 ba3a7c19 khong doi, 0 apt/dpkg, lists 3,
# /var/log/apt KHONG ton tai); cache APT 0 .deb — LAN THU 2
# LIEN TIEP cache khong song qua reboot (truoc #39 la 5 lan
# song 178 .deb/156M; sau repair dot 149 chi con 110 .deb);
# TRIGGER form B = YES (verify 5/5 00:50:38Z: postboot FAIL tuoi
# exit 1, 0 proc apt/dpkg, dpkg im 4.496 s, 2 dong/0 installs/
# GST absent/lists 3/cache 0, MiniBrowser 0 + WebKitWebProcess 0)
# -> --repair 1 lan 00:50:59–01:04:59Z (14m00s — lau hon dot 149
# vi cache 0 nen phai download lai; GST symlink -> debroot 269
# file + apt-get update + cai du 11 goi, RE-CHECK toan PASS),
# dpkg dong bang 795 dong / 113 installs / 230 configure, goi
# cuoi libc-bin (Y HET mau repair-1-phan dot 140 boot 2 / 142 /
# 149 boot 2); cache sau repair 110 .deb, lists 75; postboot
# PASS poll1 doc lap 01:05:33Z exit 0, co POSTBOOT_PASS moi
# poll=1 (repair-1-phan, KHONG phai replay-day-du); headroom
# inotify mo dot 150 = 318 (tran 63747 khong doi) — DUOI nguong
# bao < ~1.800 lan 10 lien tiep; testsrc2 QUY DUOC CHU (xem
# LIMITS T5-150 §7: 40 ffmpeg testsrc2, 9 PPID — test scripts
# T0: demo_lut/demo_effects/demo_sticker/test_pixelate_render/
# bench_pixelate_geq.sh, --out-dir /tmp/itest/...); run 150
# jitter 0 s (started 23:35:51Z = scheduled).
# F-175-T5-3 (sua dot 176): dong say DOT-151 cu in cung ket qua lich su
# ("poll2 doc lap 02:40:23Z") tren moi lan chay — de doc nham thanh
# ket qua live. Lich su DOT-151 van luu o comment ngay tren day;
# dong live chi in boot hien tai, ket qua that o cac dong PASS phia sau.
say "boot=$BOOT (postboot check-only — ket qua live o cac dong PASS/KET LUAN phia sau)"

# 1. Wrapper MiniBrowser: phải giữ lại LD_LIBRARY_PATH truyền vào.
if [ -f "$WRAP" ]; then
  if grep -q 'LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib:${LD_LIBRARY_PATH}"' "$WRAP"; then
    say "PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)"
  elif grep -q 'LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib"' "$WRAP"; then
    say "FAIL wrapper: bản gốc (ghi đè LD_LIBRARY_PATH)"
    if [ "$REPAIR" = 1 ]; then
      [ -f "$WRAP_ORIG" ] && cp "$WRAP" "$WRAP.pre-l8-repair.$(date -u +%Y%m%dT%H%M%SZ)" || true
      sed -i 's|LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib"|LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib:${LD_LIBRARY_PATH}"|' "$WRAP"
      grep -q ':${LD_LIBRARY_PATH}"' "$WRAP" && say "REPAIRED wrapper: đã vá lại 1 dòng" || { say "REPAIR-FAIL wrapper"; FAIL=1; }
    else FAIL=1; fi
  else say "WARN wrapper: nội dung lạ, kiểm tra tay"; FAIL=1; fi
else say "FAIL wrapper: không thấy $WRAP"; FAIL=1; fi

# 2. lib hệ thống mà MiniBrowser cần (K1 §6.3: 5 lib từng thiếu sau reboot #37).
MISSING_LIBS=""
for lib in libevent-2.1.so.7 libEGL.so.1 libavif.so.16 libdw.so.1 libevdev.so.2; do
  ldconfig -p 2>/dev/null | grep -q "$lib" || MISSING_LIBS="$MISSING_LIBS $lib"
done
if [ -z "$MISSING_LIBS" ]; then say "PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)"; else say "FAIL libs: thiếu:$MISSING_LIBS"; FAIL=1; fi

# 3. Plugin GStreamer: đếm file + kiểm tra element sống còn (isomp4, libav).
if [ -L "$GST_SYS" ]; then say "INFO GST: $GST_SYS là symlink -> $(readlink $GST_SYS) (vá tạm K1, ephemeral)"
elif [ -d "$GST_SYS" ]; then say "INFO GST: $GST_SYS là thư mục thật (apt)"
else say "FAIL GST: $GST_SYS không tồn tại"; FAIL=1; fi
N_SYS=$(ls "$GST_SYS" 2>/dev/null | wc -l)
N_DEB=$(ls "$DEBROOT_GST" 2>/dev/null | wc -l)
say "INFO GST: file plugin hệ thống=$N_SYS, debroot=$N_DEB"
HAS_ISOMP4=0; HAS_LIBAV=0
[ -f "$GST_SYS/libgstisomp4.so" ] && HAS_ISOMP4=1
[ -f "$GST_SYS/libgstlibav.so" ] && HAS_LIBAV=1
if [ "$HAS_ISOMP4" = 1 ] && [ "$HAS_LIBAV" = 1 ]; then
  say "PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)"
else
  say "FAIL GST: thiếu isomp4=$((1-HAS_ISOMP4)) libav=$((1-HAS_LIBAV)) — decode mp4/H.264 qua plugin hệ thống chưa đủ"
  if [ "$REPAIR" = 1 ] && [ -d "$DEBROOT_GST" ]; then
    # R9 đợt 115: KHÔNG symlink khi replay đang chạy — replay cài plugin
    # vào thư mục GST thật; symlink lúc này sẽ cướp đường dẫn đó, apt của
    # replay sẽ ghi vào debroot qua symlink (như đã xảy ra ở boot #45) và
    # làm sai lệch cả bracket replay lẫn trạng thái hệ thống. Bỏ qua, để
    # FAIL cho lần kiểm sau khi replay xong.
    if fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || pgrep -x apt-get >/dev/null || pgrep -x dpkg >/dev/null; then
      say "SKIP GST symlink: replay hệ thống đang chạy (apt/dpkg) — KHÔNG cướp thư mục plugin thật; chạy lại script sau khi replay xong"
      FAIL=1
    else
      if [ ! -L "$GST_SYS" ] && [ -d "$GST_SYS" ]; then rm -rf "$GST_SYS"; fi
      ln -sfn "$DEBROOT_GST" "$GST_SYS" && say "REPAIRED GST: symlink lại -> debroot ($N_DEB file)" || { say "REPAIR-FAIL GST symlink"; FAIL=1; }
    fi
  else FAIL=1; fi
fi
if [ -n "$(ls $GST_SYS/*.dpkg-new 2>/dev/null)" ]; then say "WARN GST: còn file .dpkg-new trong plugin dir (replay apt đang dở hoặc bị cắt) — $(ls $GST_SYS/*.dpkg-new 2>/dev/null)"; fi

# 4. apt: các package cần có (ledger OS-intent đã ghi — replay sẽ cài lại dần).
# Q7 đợt 114: thêm libevdev2 (package thứ 11) — mục libs ở trên đòi
# libevdev.so.2 nhưng NEED cũ (10 package) không chứa nó; trên các boot
# replay chạy thì libevdev2 về theo ~170 package replay, còn boot #45
# replay KHÔNG chạy nên --repair phải tự cài nó, nếu không postboot
# mãi FAIL libs dù 10 package kia đã đủ.
NEED="libevent-2.1-7t64 gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16 libgstreamer1.0-0 libevdev2"
MISS_PKGS=""
for p in $NEED; do dpkg-query -W -f '${Status}' "$p" 2>/dev/null | grep -q "install ok installed" || MISS_PKGS="$MISS_PKGS $p"; done
if [ -z "$MISS_PKGS" ]; then say "PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)"
else
  say "FAIL apt: chưa cài:$MISS_PKGS (replay hệ thống có thể đang cài dần — kiểm tra ps apt/dpkg)"
  if [ "$REPAIR" = 1 ]; then
    if fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || pgrep -x apt-get >/dev/null || pgrep -x dpkg >/dev/null; then
      say "SKIP apt: lock đang bị giữ (replay hệ thống) — KHÔNG tranh lock, chạy lại script sau"
    else
      # Q7 đợt 114: lists trống sau reboot (replay không chạy) nên install
      # thẳng luôn FAIL "Unable to locate package" (P8, /tmp/l8-postboot-apt.log).
      # Chạy `apt-get update` trước (đã chứng minh khô: network tới archive OK,
      # sources hợp lệ, --print-uris liệt kê đủ URI, không lock giữ).
      # Nếu update FAIL thì không install mù — báo rõ và để FAIL.
      say "INFO apt: lists có thể trống sau reboot — chạy apt-get update trước khi install"
      # R9 đợt 115: timeout RIÊNG cho từng bước (Q7: update lần đầu ~12 phút
      # do mirror chậm, lần sau lists đã có ~99 s; không timeout thì mirror
      # treo sẽ treo cả script). update 1500 s, install 1800 s; timeout
      # (exit 124) báo rõ và KHÔNG install mù.
      if DEBIAN_FRONTEND=noninteractive timeout 1500 apt-get update >>/tmp/l8-postboot-apt.log 2>&1; then
        say "INFO apt: apt-get update OK (xem /tmp/l8-postboot-apt.log)"
        if DEBIAN_FRONTEND=noninteractive timeout 1800 apt-get install -y --no-install-recommends $MISS_PKGS >>/tmp/l8-postboot-apt.log 2>&1; then
          say "REPAIRED apt: đã cài:$MISS_PKGS"
        else
          EC=$?
          [ "$EC" = 124 ] && say "REPAIR-FAIL apt install TIMEOUT 1800s (xem /tmp/l8-postboot-apt.log)" || say "REPAIR-FAIL apt install (xem /tmp/l8-postboot-apt.log)"
          FAIL=1
        fi
      else
        EC=$?
        [ "$EC" = 124 ] && say "REPAIR-FAIL apt update TIMEOUT 1500s (mirror chậm/treo — xem /tmp/l8-postboot-apt.log)" || say "REPAIR-FAIL apt update (xem /tmp/l8-postboot-apt.log)"
        say "KHÔNG install mù khi lists chưa về"
        FAIL=1
      fi
    fi
  else FAIL=1; fi
fi

# 4b. Kiểm lại sau repair (Q7 đợt 114): các mục 1–4 chạy TRƯỚC khi --repair
# cài apt, nên FAIL ghi lúc đó vẫn còn dù libs đã đủ sau install (bằng chứng:
# repair 14:49–15:01Z cài đủ 10 package nhưng script vẫn kết luận CHUA DU
# exit 1). Khi --repair, kiểm lại toàn bộ 4 cửa và tính lại FAIL trước khi
# kết luận — nếu không script không bao giờ PASS trong cùng một lần chạy.
if [ "$REPAIR" = 1 ]; then
  FAIL=0
  if [ -f "$WRAP" ]; then
    if grep -q 'LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib:${LD_LIBRARY_PATH}"' "$WRAP"; then
      say "RE-CHECK wrapper: PASS (đã vá K1)"
    else say "RE-CHECK wrapper: FAIL"; FAIL=1; fi
  else say "RE-CHECK wrapper: FAIL (không thấy file)"; FAIL=1; fi
  MISSING_LIBS=""
  for lib in libevent-2.1.so.7 libEGL.so.1 libavif.so.16 libdw.so.1 libevdev.so.2; do
    ldconfig -p 2>/dev/null | grep -q "$lib" || MISSING_LIBS="$MISSING_LIBS $lib"
  done
  if [ -z "$MISSING_LIBS" ]; then say "RE-CHECK libs: PASS đủ 5 lib sau repair"
  else say "RE-CHECK libs: FAIL thiếu:$MISSING_LIBS"; FAIL=1; fi
  HAS_ISOMP4=0; HAS_LIBAV=0
  [ -f "$GST_SYS/libgstisomp4.so" ] && HAS_ISOMP4=1
  [ -f "$GST_SYS/libgstlibav.so" ] && HAS_LIBAV=1
  if [ "$HAS_ISOMP4" = 1 ] && [ "$HAS_LIBAV" = 1 ]; then
    say "RE-CHECK GST: PASS đủ isomp4 + libav"
  else say "RE-CHECK GST: FAIL thiếu isomp4=$((1-HAS_ISOMP4)) libav=$((1-HAS_LIBAV))"; FAIL=1; fi
  MISS_PKGS=""
  for p in $NEED; do dpkg-query -W -f '${Status}' "$p" 2>/dev/null | grep -q "install ok installed" || MISS_PKGS="$MISS_PKGS $p"; done
  if [ -z "$MISS_PKGS" ]; then say "RE-CHECK apt: PASS đủ 11 package"
  else say "RE-CHECK apt: FAIL chưa cài:$MISS_PKGS"; FAIL=1; fi
fi

# 5. Launch test (tùy chọn).
if [ "$LAUNCH_TEST" = 1 ]; then
  L8=~/workspace/goals/capcut-clone-video-editor/hidden_files/round110-l8
  if [ -z "${DISPLAY:-}" ]; then
    (Xvfb :195 -screen 0 1280x800x24 >/tmp/l8-postboot-xvfb.log 2>&1 &) ; sleep 3; export DISPLAY=:195
  fi
  if DISPLAY=$DISPLAY node "$L8/l8-webkit-launch.mjs" o8env "$L8/l8-postboot-launch.json" 2>&1 | tail -1; then
    say "PASS launch: WebKit launch + evaluate OK (xem $L8/l8-postboot-launch.json)"
  else say "FAIL launch: WebKit không launch được"; FAIL=1; fi
fi

if [ "$FAIL" = 0 ]; then say "KET LUAN: DU DIEU KIEN chay WebKit (boot $BOOT)"; exit 0
else say "KET LUAN: CHUA DU — chạy lại với --repair, hoặc chờ apt replay xong rồi chạy lại"; exit 1; fi
