# Phase 9 Round 91 — S8: Cửa sổ yên RAM cho birefnet-general trong gói — LIMITS

Ngày: 12/11/2026 (lượt cron 00:35 +07 = 17:35Z 11/11/2026). Luồng S8 đợt 91.
Repo: `vectornewsai-cmyk/repo-1`, branch main (cây local `~/workspace/repo-1`).
Nhiệm vụ: đóng nợ LIMITS gộp đợt 90 §4 mục 7 — birefnet-general vẫn 0 lần
chạy thành công trong gói; cần cửa sổ yên RAM ≥ 6 GB ~7 phút hoặc máy nhiều
RAM — KHÔNG ép chạy khi RAM không đủ.
**KHÔNG push, KHÔNG release/tag, KHÔNG sửa code production, KHÔNG đụng TTS 39.**

> TRẠNG THÁI: HOÀN TẤT 17:45Z 11/11/2026. **KHÔNG CHẠY birefnet-general —
> không đủ cửa sổ yên, và đó là kết quả hợp lệ theo đúng nhiệm vụ.**
> RAM khả dụng cao nhất trong cửa sổ quan sát 5 phút chỉ **1629 MB**
> (26,5% ngưỡng 6144 MB). RAM guard P7 đã kiểm tra lại và **vẫn chặn đúng**
> khi RAM thấp: quyết định live bằng code trong gói tại 1372 MB → fallback;
> unit test guard repo 8/8 pass; vùng code guard trong gói giống hệt source.
> **Birefnet-general vẫn 0 lần chạy thành công trong gói — nợ mục 7 còn mở.**

## 0. Kết luận ngắn

1. **RAM khả dụng thật lúc bắt đầu lượt: 535 MB** (`free -m`, 17:38Z; tổng
   7934 MB, swap 1023 MB đã dùng 279 MB). 10 mẫu MemAvailable cách nhau
   30s trong 5 phút (17:38:48–17:43:18Z): **533 / 568 / 554 / 627 / 538 /
   1270 / 983 / 1629 / 1378 / 853 MB** — trung vị 740 MB, cao nhất 1629 MB,
   chỉ bằng **26,5% ngưỡng guard 6144 MB**. Không có khoảnh khắc nào gần
   ngưỡng, nên không thể có cửa sổ yên ≥ 6 GB duy trì ~7 phút.
2. **KHÔNG chạy birefnet-general trong gói** — quyết định theo đúng điều kiện
   nhiệm vụ (chỉ chạy nếu RAM khả dụng ≥ 6 GB và duy trì được suốt lần chạy).
   Không có frame xong/fail, không RSS đỉnh để ghi — vì không chạy.
3. **RAM guard (P7 đợt 88) vẫn chặn đúng khi RAM thấp** — kiểm tra 3 lớp:
   (a) code guard trong gói giống hệt source repo (diff vùng guard dòng
   40–100 của `bgremove.py` — identical); (b) gọi trực tiếp
   `ram_guard_decision` của code trong gói với MemAvailable thật 1372 MB →
   `fallback` cho birefnet-general, và đối chứng 6500 MB → `allow`;
   (c) unit test guard repo `test_bgremove_ramguard.py` chạy trực tiếp:
   **8/8 pass, 0 fail**.
4. **AppImage mới đợt 90 R5/Q9 đã verify lại trước khi kết luận:**
   557.008.461 byte, sha256
   `9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`
   (khớp hồ sơ R5/Q9). Lưu ý: `apps/desktop/release/` và
   `release-round55-l4/` trên đĩa chứa AppImage **cũ hơn** (576.688.128 /
   576.688.069 byte, 06–07/11 — bản K7), bản Q9 nằm ở
   `~/workspace/tmp-q9-round89-ship/ship-full/`.
5. **Birefnet-general vẫn 0 lần chạy thành công trong gói.** Nợ gốc đợt 88
   §4 mục 2 / đợt 90 §4 mục 7 **còn mở**, cần cửa sổ yên ≥ 6 GB ~7 phút
   hoặc máy nhiều RAM.

## 1. Điều kiện chạy (trung thực — VM vừa reboot, RAM rất thấp)

- VM 4 vCPU, tổng RAM **7934 MB**. Uptime lúc bắt đầu lượt chỉ **14 phút**
  (17:38Z) → VM vừa reboot khoảng **17:24Z** — thêm một lần reboot nữa sau
  lần ~15:29Z ghi ở LIMITS gộp đợt 90 (boot 0799d357). Không rõ nguyên nhân
  reboot lần này trong phạm vi luồng này.
- Load average trong lúc lấy mẫu: 0,76–2,35 (1 phút) — các luồng đợt 91
  khác đang chạy song song. Swap đã dùng 279 MB lúc đầu, 404 MB lúc kiểm
  tra guard — VM đang swap, thêm một dấu hiệu RAM căng.
- Cửa sổ quan sát: 10 mẫu × 30s = 5 phút (17:38:48–17:43:18Z), cộng 2 lần
  `free -m` rời (535 MB lúc 17:38Z, 1371 MB lúc kiểm tra guard ~17:44Z).
  Log mẫu đầy đủ: `~/workspace/tmp-r91-s8-birefnet-window/ram-samples.log`.
- Trung thực về giới hạn quan sát: cửa sổ 5 phút ngắn hơn ~7 phút mà một
  lần chạy birefnet cần — nhưng kết luận không phụ thuộc độ dài cửa sổ:
  đỉnh cao nhất 1629 MB còn chưa tới 1/3 ngưỡng, nên dù quan sát thêm cũng
  không thể thành cửa sổ yên ≥ 6 GB trừ khi RAM tăng gấp ~4 lần và giữ
  vững, điều không thấy trong bất kỳ mẫu nào.

## 2. RAM khả dụng — số đo đầy đủ

| # | Thời điểm (UTC) | MemAvailable | Load 1m |
|---|---|---|---|
| 1 | 17:38:48Z | 533 MB | 1,67 |
| 2 | 17:39:18Z | 568 MB | 1,31 |
| 3 | 17:39:48Z | 554 MB | 1,47 |
| 4 | 17:40:18Z | 627 MB | 1,06 |
| 5 | 17:40:48Z | 538 MB | 0,76 |
| 6 | 17:41:18Z | 1270 MB | 2,14 |
| 7 | 17:41:48Z | 983 MB | 2,21 |
| 8 | 17:42:18Z | **1629 MB (max)** | 2,35 |
| 9 | 17:42:48Z | 1378 MB | 2,26 |
| 10 | 17:43:18Z | 853 MB | 1,71 |

- Trung vị 740 MB; trung bình ~993 MB; max 1629 MB = 26,5% ngưỡng 6144 MB.
- So với R5 (đợt 90, 15:03Z 11/11): max MemAvailable lúc chạy e2e là
  2340 MB — lần này còn thấp hơn (1629 MB). Xu hướng RAM trong các lượt
  gần đây không cải thiện.
- `free -m` lúc bắt đầu: total 7934 / used 7398 / free 142 / buff-cache
  734 / **available 535**. Lúc kiểm tra guard: available 1371 MB.

## 3. Quyết định không chạy birefnet-general (đúng điều kiện nhiệm vụ)

Điều kiện chạy: RAM khả dụng ≥ 6144 MB và duy trì suốt lần chạy (~7 phút).
Thực tế: đỉnh 5 phút chỉ 1629 MB. **Không chạy.** Không ép bằng
`--no-ram-guard`, không thử "xem sao" — thử khi RAM ~1,6 GB sẽ bị
OOM-kill như 6 lần chết liên tiếp đã ghi ở đợt 86, chỉ tốn tài nguyên
của các luồng song song khác.

Hệ quả trung thực: không có số frame xong/fail, thời gian chạy, RSS đỉnh
hay fallback u2net nào để ghi trong lượt này — vì không chạy. Nợ "1 lần
chạy birefnet thành công trong gói" vẫn 0 lần, không tiến triển.

## 4. Kiểm tra RAM guard P7 khi RAM thấp — CHẶN ĐÚNG (3 lớp)

Guard nằm ở `server/bgremove/bgremove.py` (repo) và bản đóng gói trong
AppImage Q9 tại
`resources/vcut-server/server/bgremove/bgremove.py`
(`~/workspace/tmp-q9-round89-ship/ship-full/linux-unpacked/...`).
Ngưỡng mặc định `DEFAULT_MIN_RAM_MB = 6144`.

### (a) Code guard trong gói giống hệt source repo

```bash
diff <(sed -n '40,100p' server/bgremove/bgremove.py) \
     <(sed -n '40,100p' <gói>/resources/vcut-server/server/bgremove/bgremove.py)
# → GUARD_REGION_IDENTICAL (không khác một dòng)
```

`bgremove.py` trong gói có 7 lần `ram_guard`, `bridge/src/bgremove.js`
có 5 lần — khớp hồ sơ R5.

### (b) Quyết định live bằng code trong gói, với RAM thật

Import trực tiếp `bgremove.py` của gói (không load model, không chạy job)
và gọi `ram_guard_decision` / `get_mem_available_mb`:

| Trường hợp | MemAvailable | Quyết định |
|---|---|---|
| birefnet-general, RAM thật lúc test | **1372 MB** | `fallback` — "RAM khả dụng 1372 MB < ngưỡng 6144 MB" |
| u2net, RAM thật lúc test | 1372 MB | `allow` — "session không phải birefnet" |
| birefnet-general, đối chứng | 6500 MB | `allow` — "đủ RAM" |

Cả hai chiều của ngưỡng đều đúng: dưới ngưỡng thì chặn, trên ngưỡng thì
cho chạy. Đây là kiểm tra logic quyết định của guard, không phải một job
e2e đầy đủ trong gói (xem §5).

### (c) Unit test guard của repo: 8/8 pass

`python3 test_bgremove_ramguard.py` (chạy trực tiếp, không cần pytest —
`python3 -m pytest` không có sẵn trên VM này; `unittest` chạy file này
được 0 test vì nó dùng runner riêng, không phải lỗi):

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
  sổ yên ≥ 6 GB trong lượt này (đỉnh 1629 MB). Nợ còn mở, cần máy nhiều
  RAM hoặc một lượt chạy vào lúc VM gần như trống — điều chưa từng xảy ra
  trong 5 lượt gần nhất có đo (R5 max 2340 MB, lần này max 1629 MB).
- **Không chạy lại job e2e u2net đầy đủ trong gói ở lượt này.** R5 đã làm
  job đó 15:03Z 11/11 (guard chặn, u2net 17/17 frame, MOV byte-identical
  với Q9) trên cùng AppImage và cùng code guard (đã verify identical ở
  §4a). Chạy lại một job u2net ~186s chỉ để lặp lại kết quả đã biết sẽ
  tăng tải cho các luồng đợt 91 đang chạy song song mà không cho thông tin
  mới — nên luồng này chỉ kiểm tra guard ở mức quyết định + unit test.
  Nếu parent muốn bằng chứng e2e mới, chạy lại driver Q9 theo §7.
- **VM reboot ~17:24Z** (uptime 14 phút lúc bắt đầu lượt) — thêm một lần
  reboot sau lần ~15:29Z của đợt 90; nguyên nhân không điều tra trong
  luồng này (ngoài phạm vi S8). Reboot làm mất /tmp và có thể làm mất dep
  WebKit như các lần trước — các luồng khác cần lưu ý.
- **Không sửa code nào trong luồng này** — toàn bộ là đo + kiểm tra trên
  AppImage đã build sẵn và code có sẵn. Batch stage chỉ có file LIMITS này.
- Nợ cũ giữ nguyên: TTS 39 cấm kiểm lại; ci-security 403; `.deb` full chưa
  build; macOS/Windows/arm64 không build được từ Linux.

## 6. File trong batch (stage chờ push — text only)

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND91_S8_BIREFNET_WINDOW_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: AppImage 557 MB + `linux-unpacked/` + log mẫu RAM
(`~/workspace/tmp-r91-s8-birefnet-window/ram-samples.log`, giữ ngoài repo
để parent đối chiếu; AppImage là binary).

## 7. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
# 1. Đo RAM khả dụng thật (lấy mẫu 5 phút):
free -m; grep MemAvailable /proc/meminfo
for i in $(seq 1 10); do date -u +%H:%M:%SZ; grep MemAvailable /proc/meminfo; sleep 30; done
#   Kỳ vọng trên VM này: max ~1,5–2,3 GB, xa dưới ngưỡng 6144 MB.
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
Q9_WORK=~/workspace/tmp-r91-s8-birefnet-window/e2e-u2net \
Q9_APPIMAGE=~/workspace/tmp-q9-round89-ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage \
Q9_EXPECTED_SHA=9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78 \
Q9_MODELS_DIR=~/workspace/tmp-q9-round89-ship/models \
  node apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs
#   Kỳ vọng trên VM ít RAM: guard chặn birefnet, u2net hoàn tất
#   17/17 frame, MOV 1.715.896 byte (như R5/Q9).
```
