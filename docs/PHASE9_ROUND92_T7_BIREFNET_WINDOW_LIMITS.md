# Phase 9 Round 92 — T7: Cửa sổ yên RAM cho birefnet-general trong gói — THỬ LẠI — LIMITS

Ngày: 12/11/2026 (lượt cron 03:35 +07 = 20:35Z 11/11/2026). Luồng T7 đợt 92.
Repo: `vectornewsai-cmyk/repo-1`, branch main (cây local `~/workspace/repo-1`).
Nhiệm vụ: đóng nợ LIMITS gộp đợt 91 §4 mục 7 — birefnet-general vẫn 0 lần
chạy thành công trong gói; cần cửa sổ yên RAM ≥ 6 GB ~7 phút hoặc máy nhiều
RAM — KHÔNG ép chạy khi RAM không đủ.
**KHÔNG push, KHÔNG release/tag, KHÔNG sửa code production, KHÔNG đụng TTS 39.**

> TRẠNG THÁI: HOÀN TẤT 20:49Z 11/11/2026. **KHÔNG CHẠY birefnet-general —
> không đủ cửa sổ yên, và đó là kết quả hợp lệ theo đúng nhiệm vụ.**
> RAM khả dụng cao nhất trong cửa sổ quan sát 10 phút chỉ **1707 MB**
> (27,8% ngưỡng 6144 MB). RAM guard P7 đã kiểm tra lại và **vẫn chặn đúng**
> khi RAM thấp: quyết định live bằng code trong gói tại 495 MB → fallback;
> cả hai chiều ngưỡng + biên 6143/6144 MB đều đúng; unit test guard repo
> 8/8 pass; toàn bộ file `bgremove.py` trong gói giống hệt source.
> **Birefnet-general vẫn 0 lần chạy thành công trong gói — nợ mục 7 còn mở.**

## 0. Kết luận ngắn

1. **RAM khả dụng thật lúc bắt đầu lượt: 512 MB** (`free -m`, 20:38Z; tổng
   7934 MB, swap 1023 MB đã dùng 318 MB). 20 mẫu MemAvailable cách nhau
   30s trong 10 phút (20:38:47–20:48:17Z): **450 / 500 / 725 / 926 / 861 /
   1175 / 1352 / 1383 / 1707 / 1131 / 761 / 1187 / 739 / 1009 / 833 / 884 /
   803 / 798 / 692 / 1592 MB** — trung vị 872,5 MB, cao nhất 1707 MB,
   chỉ bằng **27,8% ngưỡng guard 6144 MB**. Không có khoảnh khắc nào gần
   ngưỡng, nên không thể có cửa sổ yên ≥ 6 GB duy trì ~7 phút.
2. **KHÔNG chạy birefnet-general trong gói** — quyết định theo đúng điều kiện
   nhiệm vụ (chỉ chạy nếu RAM khả dụng ≥ 6 GB và duy trì được suốt lần chạy).
   Không có frame xong/fail, không RSS đỉnh để ghi — vì không chạy.
3. **RAM guard (P7 đợt 88) vẫn chặn đúng khi RAM thấp** — kiểm tra 3 lớp:
   (a) toàn bộ file `bgremove.py` trong gói giống hệt source repo (diff
   cả file — identical, không chỉ vùng guard dòng 40–100); (b) gọi trực
   tiếp `ram_guard_decision` của code trong gói với MemAvailable thật
   495 MB → `fallback` cho birefnet-general, và đối chứng 6500 MB →
   `allow`, biên 6143 MB → `fallback`, 6144 MB → `allow`; (c) unit test
   guard repo `test_bgremove_ramguard.py` chạy trực tiếp: **8/8 pass,
   0 fail**.
4. **AppImage Q9 đã verify lại trước khi kết luận:** 557.008.461 byte,
   sha256 `9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`
   (khớp hồ sơ R5/Q9 và S8 đợt 91). Không có AppImage mới hơn nào được
   build trong đợt 92 tính đến lúc luồng này kiểm tra (quét
   `find ~/workspace -name '*.AppImage' -newermt '2026-11-11 13:16'` chỉ
   trả về đúng file Q9; hai bản trong `apps/desktop/release/` và
   `release-round55-l4/` vẫn là bản K7 cũ 576.688.128 / 576.688.069 byte).
5. **Birefnet-general vẫn 0 lần chạy thành công trong gói.** Nợ gốc đợt 88
   §4 mục 2 / đợt 90 §4 mục 7 / đợt 91 §4 mục 7 **còn mở**, cần cửa sổ yên
   ≥ 6 GB ~7 phút hoặc máy nhiều RAM.

## 1. Điều kiện chạy (trung thực — VM vừa reboot, RAM rất thấp)

- VM 4 vCPU, tổng RAM **7934 MB**. Uptime lúc bắt đầu lượt chỉ **1 giờ
  15 phút** (20:38Z) → VM boot khoảng **19:23Z** — thêm một lần reboot nữa
  sau lần ~17:24Z ghi ở S8 đợt 91 (lần reboot thứ ~10 trong ~2 ngày).
  Không rõ nguyên nhân reboot lần này trong phạm vi luồng này.
- Load average trong lúc lấy mẫu: 1 phút 0,87–6,17 (đỉnh 6,17 lúc mẫu 11
  — các luồng đợt 92 khác đang chạy song song). Swap đã dùng 317–443 MB
  trong suốt cửa sổ — VM đang swap liên tục, thêm một dấu hiệu RAM căng.
- Cửa sổ quan sát: 20 mẫu × 30s = 10 phút (20:38:47–20:48:17Z), cộng 2 lần
  `free -m` rời (512 MB lúc 20:38Z, 1056 MB lúc 20:48Z). Log mẫu đầy đủ:
  `~/workspace/tmp-r92-t7-birefnet-window/ram-samples.log`.
- Trung thực về giới hạn quan sát: cửa sổ 10 phút dài hơn ~7 phút mà một
  lần chạy birefnet cần — nhưng kết luận không phụ thuộc độ dài cửa sổ:
  đỉnh cao nhất 1707 MB còn chưa tới 1/3 ngưỡng, nên dù quan sát thêm cũng
  không thể thành cửa sổ yên ≥ 6 GB trừ khi RAM tăng gấp ~3,6 lần và giữ
  vững, điều không thấy trong bất kỳ mẫu nào của 3 lượt đo gần nhất
  (R5 max 2340 MB, S8 đợt 91 max 1629 MB, lần này max 1707 MB).

## 2. RAM khả dụng — số đo đầy đủ

| # | Thời điểm (UTC) | MemAvailable | Load 1m |
|---|---|---|---|
| 1 | 20:38:47Z | 450 MB | 0,87 |
| 2 | 20:39:17Z | 500 MB | 1,25 |
| 3 | 20:39:47Z | 725 MB | 1,63 |
| 4 | 20:40:17Z | 926 MB | 1,57 |
| 5 | 20:40:47Z | 861 MB | 2,27 |
| 6 | 20:41:17Z | 1175 MB | 3,16 |
| 7 | 20:41:47Z | 1352 MB | 3,29 |
| 8 | 20:42:17Z | 1383 MB | 2,05 |
| 9 | 20:42:47Z | **1707 MB (max)** | 1,86 |
| 10 | 20:43:17Z | 1131 MB | 3,00 |
| 11 | 20:43:47Z | 761 MB | 6,17 |
| 12 | 20:44:17Z | 1187 MB | 4,47 |
| 13 | 20:44:47Z | 739 MB | 2,90 |
| 14 | 20:45:17Z | 1009 MB | 2,73 |
| 15 | 20:45:47Z | 833 MB | 1,65 |
| 16 | 20:46:17Z | 884 MB | 1,70 |
| 17 | 20:46:47Z | 803 MB | 1,55 |
| 18 | 20:47:17Z | 798 MB | 1,02 |
| 19 | 20:47:47Z | 692 MB | 1,78 |
| 20 | 20:48:17Z | 1592 MB | 1,71 |

- Trung vị 872,5 MB; trung bình 975,4 MB; min 450 MB; max 1707 MB =
  27,8% ngưỡng 6144 MB.
- So với S8 đợt 91 (max 1629 MB, trung vị 740 MB): lần này nhỉnh hơn
  chút ở đỉnh nhưng vẫn cùng một bậc — xa dưới ngưỡng. Xu hướng RAM
  trong các lượt gần đây không cải thiện.
- `free -m` lúc bắt đầu: total 7934 / used 7422 / free 141 / buff-cache
  708 / **available 512**. Lúc cuối cửa sổ: available 1056 MB.

## 3. Quyết định không chạy birefnet-general (đúng điều kiện nhiệm vụ)

Điều kiện chạy: RAM khả dụng ≥ 6144 MB và duy trì suốt lần chạy (~7 phút).
Thực tế: đỉnh 10 phút chỉ 1707 MB. **Không chạy.** Không ép bằng
`--no-ram-guard`, không thử "xem sao" — thử khi RAM ~1,7 GB sẽ bị
OOM-kill như 6 lần chết liên tiếp đã ghi ở đợt 86, chỉ tốn tài nguyên
của các luồng song song khác.

Hệ quả trung thực: không có số frame xong/fail, thời gian chạy, RSS đỉnh
hay fallback u2net nào để ghi trong lượt này — vì không chạy. Nợ "1 lần
chạy birefnet thành công trong gói" vẫn 0 lần, không tiến triển. Đây là
lần thử lại thứ hai liên tiếp (S8 đợt 91 → T7 đợt 92) cho cùng kết quả:
không có cửa sổ yên trên VM này trong giờ cao điểm của vòng lặp.

## 4. Kiểm tra RAM guard P7 khi RAM thấp — CHẶN ĐÚNG (3 lớp)

Guard nằm ở `server/bgremove/bgremove.py` (repo) và bản đóng gói trong
AppImage Q9 tại
`resources/vcut-server/server/bgremove/bgremove.py`
(`~/workspace/tmp-q9-round89-ship/ship-full/linux-unpacked/...`).
Ngưỡng mặc định `DEFAULT_MIN_RAM_MB = 6144`.

### (a) Code guard trong gói giống hệt source repo

```bash
diff server/bgremove/bgremove.py \
  <gói>/resources/vcut-server/server/bgremove/bgremove.py
# → WHOLE_FILE_IDENTICAL (không khác một dòng, cả file 23.500 byte)
diff <(sed -n '40,100p' ...) <(sed -n '40,100p' ...)
# → GUARD_REGION_IDENTICAL
```

`bgremove.py` trong gói có 7 lần `ram_guard`, `bridge/src/bgremove.js`
có 5 lần — khớp hồ sơ R5/S8.

### (b) Quyết định live bằng code trong gói, với RAM thật

Import trực tiếp `bgremove.py` của gói (không load model, không chạy job)
và gọi `ram_guard_decision` / `get_mem_available_mb`:

| Trường hợp | MemAvailable | Quyết định |
|---|---|---|
| birefnet-general, RAM thật lúc test | **495 MB** | `fallback` — "RAM khả dụng 495 MB < ngưỡng 6144 MB" |
| u2net, RAM thật lúc test | 495 MB | `allow` — "session không phải birefnet" |
| birefnet-general, đối chứng | 6500 MB | `allow` — "đủ RAM" |
| birefnet-general, biên dưới | 6143 MB | `fallback` — "RAM khả dụng 6143 MB < ngưỡng 6144 MB" |
| birefnet-general, biên đúng ngưỡng | 6144 MB | `allow` — "đủ RAM" |

Cả hai chiều của ngưỡng và đúng biên đều đúng: dưới ngưỡng thì chặn,
tại/trên ngưỡng thì cho chạy. Đây là kiểm tra logic quyết định của guard,
không phải một job e2e đầy đủ trong gói (xem §5).

### (c) Unit test guard của repo: 8/8 pass

`python3 test_bgremove_ramguard.py` (chạy trực tiếp, không cần pytest):

```
✓ get_mem_available_mb: đọc /proc/meminfo, lỗi -> None
✓ ram_guard_decision: fallback/allow/allow-unknown/biên
✓ resolve_min_ram_mb: mặc định/CLI/env/--no-ram-guard
✓ main: RAM thấp -> chuyển u2net ngay, marker đầy đủ
✓ main: đủ RAM -> chạy birefnet, không fallback
✓ main: guard + --no-fallback -> chặn thẳng, không chạy
✓ main: u2net không bị guard
✓ main: --no-ram-guard -> chạy thẳng birefnet
== KẾT QUẢ: 8 pass, 0 fail ==
```

## 5. Giới hạn — chưa làm được / chưa test (trung thực)

- **Birefnet-general: vẫn 0 lần chạy thành công trong gói.** Không có cửa
  sổ yên ≥ 6 GB trong lượt này (đỉnh 1707 MB). Nợ còn mở, cần máy nhiều
  RAM hoặc một lượt chạy vào lúc VM gần như trống — điều chưa từng xảy ra
  trong 6 lượt gần nhất có đo (R5 max 2340 MB, S8 đợt 91 max 1629 MB,
  lần này max 1707 MB). Hai lần thử lại liên tiếp đều thất bại ở cùng
  một điều kiện tiên quyết, không phải ở code: guard đúng, AppImage đúng,
  chỉ thiếu RAM. Đề xuất cho parent: cân nhắc dừng thử lại mỗi lượt và
  chỉ thử lại khi có tín hiệu RAM thay đổi (VM nâng RAM, hoặc lượt chạy
  vào lúc vòng lặp tạm dừng), thay vì đốt một luồng mỗi lượt cho cùng
  một phép đo.
- **Không chạy lại job e2e u2net đầy đủ trong gói ở lượt này.** R5 đã làm
  job đó 15:03Z 11/11 (guard chặn, u2net 17/17 frame, MOV byte-identical
  với Q9) trên cùng AppImage và cùng code guard (đã verify identical cả
  file ở §4a). Chạy lại một job u2net ~186s chỉ để lặp lại kết quả đã biết
  sẽ tăng tải cho các luồng đợt 92 đang chạy song song mà không cho thông
  tin mới — nên luồng này chỉ kiểm tra guard ở mức quyết định + unit test.
  Nếu parent muốn bằng chứng e2e mới, chạy lại driver Q9 theo §7.
- **VM reboot ~19:23Z** (uptime 1h15 lúc bắt đầu lượt) — thêm một lần
  reboot sau lần ~17:24Z của đợt 91; nguyên nhân không điều tra trong
  luồng này (ngoài phạm vi T7). Reboot làm mất /tmp và có thể làm mất dep
  WebKit như các lần trước — các luồng khác cần lưu ý.
- **Không sửa code nào trong luồng này** — toàn bộ là đo + kiểm tra trên
  AppImage đã build sẵn và code có sẵn. Batch stage chỉ có file LIMITS này.
- Nợ cũ giữ nguyên: TTS 39 cấm kiểm lại; ci-security 403; `.deb` full chưa
  build; macOS/Windows/arm64 không build được từ Linux.

## 6. File trong batch (stage chờ push — text only)

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND92_T7_BIREFNET_WINDOW_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: AppImage 557 MB + `linux-unpacked/` + log mẫu RAM
(`~/workspace/tmp-r92-t7-birefnet-window/ram-samples.log`, giữ ngoài repo
để parent đối chiếu; AppImage là binary).

## 7. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
# 1. Đo RAM khả dụng thật (lấy mẫu 10 phút):
free -m; grep MemAvailable /proc/meminfo
for i in $(seq 1 20); do date -u +%H:%M:%SZ; grep MemAvailable /proc/meminfo; sleep 30; done
#   Kỳ vọng trên VM này: max ~1,6–2,3 GB, xa dưới ngưỡng 6144 MB.
#   Chỉ thử birefnet trong gói khi MemAvailable ≥ 6144 MB duy trì suốt
#   lần chạy (~7 phút); nếu không, KHÔNG chạy — ghi số đo và dừng.

# 2. Kiểm tra quyết định guard bằng code trong gói (không load model):
python3 -c "
import importlib.util
spec = importlib.util.spec_from_file_location('bg',
  '<gói>/resources/vcut-server/server/bgremove/bgremove.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
print(m.get_mem_available_mb())
print(m.ram_guard_decision('birefnet-general', m.get_mem_available_mb()))
"
#   Kỳ vọng khi RAM thấp: {'action': 'fallback', ...}.

# 3. Unit test guard repo:
cd ~/workspace/repo-1/server/bgremove && python3 test_bgremove_ramguard.py
#   Kỳ vọng: 8 pass, 0 fail.

# 4. Job e2e đầy đủ trong gói (chỉ khi cần bằng chứng mới, driver Q9):
Q9_WORK=~/workspace/tmp-r92-t7-birefnet-window/e2e-u2net \
Q9_APPIMAGE=~/workspace/tmp-q9-round89-ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage \
Q9_EXPECTED_SHA=9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78 \
Q9_MODELS_DIR=~/workspace/tmp-q9-round89-ship/models \
  node apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs
#   Kỳ vọng trên VM ít RAM: guard chặn birefnet, u2net hoàn tất
#   17/17 frame, MOV 1.715.896 byte (như R5/Q9).
```
