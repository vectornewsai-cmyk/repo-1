# PHASE9 ROUND 151 — T0: Nối probe V19 pixelate geq vào `test_integration.sh` (đếm 11 → 12)

- **Ngày:** 20/11/2026 (lượt cron 09:35 +07 = 02:35:51Z). Node v24.22.1, FFmpeg 8.1.2.
- **Nhiệm vụ:** quyết parent **(j)** đợt 150, aggregate `docs/PHASE9_ROUND150_LIMITS.md` §12.3 —
  nối probe V19 (`server/render/src/test_v19_pixelate_probe.js`, bản geq 34/34 assert từ đợt 149–150)
  vào `test_integration.sh`, đếm integration đổi 11 → 12, `npm test` vẫn exit 0 sau khi nối.
- **Kết quả: XONG — integration 12 pass, 0 fail; `npm test` đầy đủ exit 0.**

## 1. Đổi gì

Chỉ sửa **1 file** (probe V19 và implementation đều KHÔNG đụng):

| File | Đổi |
|---|---|
| `server/render/test_integration.sh` | Thêm **§5 mới** — chạy probe V19 sau §4 (test_pixelate_render), md5 `0fc58438…` → `a6b8cfc0ad4aec856f34059713ccf00e` |
| `docs/PHASE9_ROUND151_T0_V19_INTEGRATION_LIMITS.md` | Mới — file này |
| `server/render/src/test_v19_pixelate_probe.js` | **KHÔNG đổi** (md5 `fb392111…` giữ nguyên như đợt 150) |
| `server/render/src/effects.js` | **KHÔNG đổi** (không đụng implementation) |

Nội dung §5 thêm vào (sau §4, trước dòng `KẾT QUẢ`):

```bash
echo "== 5. Probe V19 pixelate geq (đợt 151: nối vào suite theo quyết parent (j) đợt 150) =="
if node "$RENDER_DIR/src/test_v19_pixelate_probe.js" > "$OUT/v19-pixelate.log" 2>&1; then
  pass "test_v19_pixelate_probe (34 assert geq)"
else
  fail "test_v19_pixelate_probe" "xem log: $OUT/v19-pixelate.log"
fi
```

- Probe chạy bằng đường dẫn tuyệt đối từ `$RENDER_DIR` (không phụ thuộc cwd — `npm test`
  chạy từ repo root, probe tự resolve `ROOT` từ `__dirname` như khi chạy độc lập).
- Output đầy đủ của probe giữ lại trong `$OUT/v19-pixelate.log` (mặc định
  `/tmp/itest/v19-pixelate.log`) để soi khi rớt — khác §4 (test_pixelate_render
  chỉ nuốt output): V19 có 34 assert, khi rớt cần biết assert nào rớt.
- Probe tự xoá thư mục `/tmp` riêng của nó như trước; log `$OUT` là bản sao ngoài.

## 2. Đếm đổi 11 → 12 — bảng đếm mới (ghi rõ để T1/T10 đối chiếu)

| Mục | Trước (11) | Sau (12) |
|---|---|---|
| §1 fixture (video testsrc, audio sine, PNG alpha) | 3 | 3 |
| §2 LUT có sẵn | 1 | 1 |
| §3 demo (lut, effects, sticker, chroma, transitions, textfx) | 6 | 6 |
| §4 test_pixelate_render (20 case) | 1 | 1 |
| **§5 test_v19_pixelate_probe (34 assert geq) — MỚI** | — | **1** |
| **Tổng dòng `== KẾT QUẢ: N pass, 0 fail ==`** | **11** | **12** |

- `npm test` = unit 7/7 self-test (lut/effects/sticker/chroma/textfx/keyframes/mask)
  + integration 12 pass — vẫn exit 0. Tổng số mục pass in ra: 7 + 12 = 19
  (trước: 7 + 11 = 18).

## 3. Đếm chéo với T1/T10 — KHÔNG vỡ, nhưng số trong log đổi (đọc kỹ)

- **Suite 28/28 của T1 KHÔNG vỡ:** suite gộp của T1 đếm `npm test` là **1 mục**
  (mục cuối trong 28), không đếm từng pass-line bên trong — đã kiểm
  `round150-t1-verify.sh`: script chỉ `run "npm-test-full" "npm test"`, **không
  assert cứng chuỗi "11 pass" trong code** (grep "11 pass" / "KẾT QUẢ" trong
  script: 0 kết quả). T1-151 chạy lại suite vẫn đếm 28 mục như cũ.
- **Số đổi là dòng KẾT QUẢ trong log `npm test`:** từ
  `== KẾT QUẢ: 11 pass, 0 fail ==` thành `== KẾT QUẢ: 12 pass, 0 fail ==`.
  **T1-151 / T10-151 khi đọc log suite phải đọc 12, không phải 11.** Mọi văn bản
  cũ ghi "`npm test` 11 pass" (LIMITS đợt 149–150, aggregate §1/§10) nay là **số cũ** —
  đúng cho tới đợt 150, sai từ đợt 151 trở đi.
- **Tôi KHÔNG đổi quy ước đếm của luồng khác** (theo đúng lệnh giao việc): không sửa
  script verify của T1, không sửa cách T1 đếm 28 mục, không sửa LIMITS đã đóng của
  đợt 149/150. Chỉ ghi rõ đổi đếm ở đây (§2–§3) và báo parent trong báo cáo đóng.

## 4. Kiểm chứng tổng (số đo thật, chạy trên máy này)

| Lệnh | Kết quả | Thời gian |
|---|---|---|
| Probe V19 độc lập (baseline trước khi nối) `node src/test_v19_pixelate_probe.js` | **34/34 assert KHÓA-ĐẠT, 0 KHÓA-RỚT, exit 0** | 22,3 s |
| `bash server/render/test_integration.sh --out-dir /tmp/itest-151t0` | **`== KẾT QUẢ: 12 pass, 0 fail ==`, exit 0** (§5 V19 PASS trong suite) | 4m07s |
| `npm test` đầy đủ (repo root) | **exit 0** — unit 7/7 + integration 12 pass, 0 fail | 5m11s |
| `npm run test:unit` (chạy riêng để ghi rõ) | 7/7 self-test pass (lut/effects/sticker/chroma/textfx/keyframes/mask) | ~5 s |
| Log probe trong lần `npm test` (`/tmp/itest/v19-pixelate.log`) | **34 KHÓA-ĐẠT, 0 KHÓA-RỚT**, dòng cuối `KẾT: mọi assert khóa đều đạt (exit 0)` | — |

- Trong lần `npm test` đầy đủ, §5 in `✅ PASS test_v19_pixelate_probe (34 assert geq)`
  và dòng tổng là `== KẾT QUẢ: 12 pass, 0 fail ==` (đã đọc từ output thật, không suy ra).
- `demo_effects` PASS ở mức 1 item trong suite (như mọi đợt); **không đếm lại 16/16
  riêng trong đợt này** — số 16/16 vẫn là của T0-149, không claimed lại.

## 5. Caveat (trung thực)

1. **Thời gian `npm test` tăng, nhưng KHÔNG quy hết cho V19:** đợt 150 `npm test`
   ~3m16s, đợt này 5m11s. V19 độc lập chỉ 22,3 s; phần tăng còn lại là tải song song
   (các luồng đợt 151 khác đang chạy cùng lúc — T1/T4/T8/T9 đã mở thư mục lúc suite
   chạy) + biến thiên render demo. Chạy integration riêng lúc tải nhẹ hơn: 4m07s.
   Không có số đo "npm test trên máy nhàn" trong đợt này — không claimed.
2. **Probe exit 2 khi `applyPixelate` thiếu trong `effectCanvas.ts` vẫn tính FAIL
   trong suite (chủ ý):** khóa phải được bắt buộc chạy; nếu feature mất, suite phải
   đỏ chứ không được lặng lẽ bỏ qua. Hành vi này giữ nguyên từ probe gốc, không đổi.
3. **Log probe nằm trong `$OUT` (`/tmp/itest/v19-pixelate.log` mặc định) — không stage:**
   `/tmp` không thuộc repo; nếu T1/T10 cần soi lại log V19 của đợt này thì log còn
   trên máy tại `/tmp/itest/v19-pixelate.log` (lần `npm test`) và
   `/tmp/itest-151t0/v19-pixelate.log` (lần integration riêng). Log sẽ mất khi reboot
   hoặc `/tmp` bị dọn — chấp nhận được vì probe chạy lại được trong 22 s.
4. **Không chạy lại bench geq / demo_effects 16/16 / tsc / vite build trong đợt này:**
   không đổi implementation hay probe — không có gì mới để bench/build lại.
   `tsc` chỉ chạy ngầm bên trong probe (transpile `effectCanvas.ts`) và đã chạy xanh
   trong cả 3 lần probe (baseline + integration + npm test).
5. **Không đụng nợ đứng:** TTS 39 cấm kiểm lại; ci-security.yml 403 chờ user;
   G1/R9 chờ user (để yên, không nhắc lại).

## 6. Tóm tắt file đổi (stage)

```
server/render/test_integration.sh                      (sửa — thêm §5 V19, đếm 11 → 12)
docs/PHASE9_ROUND151_T0_V19_INTEGRATION_LIMITS.md     (mới — file này)
```

Cờ: `workspace/goals/capcut-clone-video-editor/hidden_files/round151-t0.done`
(02:52Z 20/11/2026 — trong hạn cờ ~05:00Z, hạn cứng 05:30Z).
