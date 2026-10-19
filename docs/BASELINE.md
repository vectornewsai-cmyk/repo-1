# BASELINE.md — Báo cáo cài đặt sạch và kiểm thử cơ sở

> **Task:** R1-001 (master plan §10 Batch A)
> **Ngày chạy:** 2026-10-19 ~15:20 (Asia/Saigon)
> **Commit mốc:** `1844e2cc8b98a22ad01d8d321ce83b2f32d99561` (Phase 3c: render.js — LUT/effects/sticker integration)
> **Nguyên tắc:** Mọi con số dưới đây là kết quả chạy THẬT trên máy này, không ước lượng.

---

## 1. Môi trường

| Công cụ | Phiên bản (thật) |
|---|---|
| Node.js | v24.20.0 (`node --version`) |
| npm | 10.9.4 (`npm --version`) |
| Python | 3.12.3 (`python3 --version`) |
| FFmpeg | 8.1.2 (`ffmpeg -version \| head -1` → `ffmpeg version 8.1.2 Copyright (c) 2000-2026 the FFmpeg developers`) |
| OS | Linux htch-runtime 7.0.0-39-generic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux (`uname -a`) |

Ghi chú:
- `ffprobe` có sẵn (đi kèm FFmpeg 8.1.2), dùng trong integration test.
- Python có `caption.py` (server/caption) nhưng `faster_whisper` **chưa cài** trong môi trường này → module caption không chạy được tại đây (cần cài riêng + tải model 462MB).

---

## 2. `npm install` (root)

- **Lệnh:** `npm install` tại `~/workspace/repo-1/`
- **Thời gian:** 4.7s (real 0m4.739s)
- **Kết quả:** ✅ thành công, không lỗi — `added 1 package, and changed 1 package in 4s`
- Workspaces theo root `package.json`: `apps/*`, `packages/*`, `server/*`
- ⚠️ **Lưu ý:** `mcp-server/` nằm ở root repo, KHÔNG khớp glob workspace nào → không phải workspace npm (xem §4).

---

## 3. `npm run build` (root)

- **Lệnh:** `npm run build` tại root → `npm run build --workspaces --if-present`
- **Thời gian:** 22.3s (real 0m22.278s)
- **Kết quả:** ✅ exit 0

| Workspace | Script build | Kết quả |
|---|---|---|
| `apps/web` (@repo-1/web) | `tsc && vite build` | ✅ PASS — 75 modules transformed, dist 211.94 kB JS (gzip 68.48 kB) |
| `packages/video-spec` | (không có) | — (được typecheck gián tiếp qua apps/web) |
| `server/render` | (không có, chỉ có `demo`) | — |
| `mcp-server` | **không chạy** — không phải workspace (xem §4) | — |

---

## 4. Build riêng `mcp-server` — ❌ FAIL

- **Lệnh:** `npm run build` trong `mcp-server/` (`tsc -p tsconfig.json`)
- **Kết quả:** ❌ **FAIL — 15 lỗi TypeScript, exit 2**

| Loại lỗi | Số lượng | Ví dụ |
|---|---|---|
| TS2835 (relative import cần `.js` extension) | 14 | `../packages/video-spec/src/index.ts(16,15): ... Did you mean './transitions.js'?` |
| TS2459 (`Transition` declared locally but not exported) | 1 | `src/validate.ts(15,3)` |

**Phân tích trung thực:**
- Root `npm run build` KHÔNG phát hiện lỗi này vì `mcp-server/` không nằm trong workspaces.
- MCP demo (`npm run demo`) vẫn chạy được — demo dùng tsx/ts-node (lỏng lẻo hơn tsc strict), nhưng `tsc` build chính thức thì đỏ.
- Đây là nợ cần sửa (thuộc R1-003/R1-020): hoặc sửa import có `.js` extension, hoặc đồng bộ `moduleResolution` giữa các tsconfig.

---

## 5. Self-tests của render modules

Chạy `node server/render/src/<module>.js --self-test` từng module (timeout 60s mỗi cái):

| Module | Kết quả | Ghi chú |
|---|---|---|
| `lut.js` | ✅ PASS | "tất cả assertion pass (10 LUT, file .cube đầy đủ)" |
| `effects.js` | ✅ PASS | "tất cả assertion pass" |
| `sticker.js` | ✅ PASS | "tất cả assertion pass" |
| `chroma.js` | ✅ PASS | "tất cả assertion pass" |
| `textfx.js` | ✅ PASS | "tất cả assertion pass" |
| `keyframes.js` | ✅ PASS | "tất cả assertion pass" |
| `transitions.js` | ⚠️ N/A | **Không có self-test** — file không chứa `self-test`/`selfTest`; chạy với `--self-test` exit 0 im lặng (arg bị bỏ qua) |
| `speed.js` | ⚠️ SMOKE | **Không có assertion** — chạy trực tiếp in ra filter string cho 8 case hợp lệ + 4 case từ chối đúng (in "OK từ chối..."); exit 0 |

**Kết luận:** 6/8 module có self-test assertion thật và pass. 2 module (transitions, speed) chưa có self-test đúng nghĩa — nên bổ sung (thuộc R1-003).

---

## 6. Integration test (`server/render/test_integration.sh`)

- **Lệnh:** `bash server/render/test_integration.sh --out-dir /tmp/itest-baseline`
- **Thời gian:** 38.4s (real 0m38.403s)
- **Kết quả:** ✅ **10 pass, 0 fail**

| Nhóm | Chi tiết |
|---|---|
| Fixture media | video testsrc.mp4, audio sine.m4a, PNG alpha circle.png — tạo bằng FFmpeg lavfi |
| LUT | đã có sẵn local (10 file .cube) |
| Demo scripts | demo_lut, demo_effects, demo_sticker, demo_chroma, demo_transitions, demo_textfx — tất cả render MP4 thật + verify |

---

## 7. File rác TEST_*.txt

**Local (`~/workspace/repo-1/`):** không có file TEST_*.txt nào.

**Trên GitHub (branch main, commit 1844e2cc):** tồn tại 2 file rác từ đợt debug push API trước đây:
- `TEST_A.txt` (nội dung: `a`)
- `TEST_PING3.txt` (nội dung: `ping3`)

(Các file `TEST_B.txt`, `TEST_C.txt` được nhắc trong lịch sử — kiểm tra: không thấy trên main tại mốc này, có thể đã được dọn hoặc chưa từng push thành công.)

**Đề xuất xóa:** Dùng GitHub web UI hoặc API delete (push_files không có chức năng xóa). Đây là việc R1-001 yêu cầu ("xóa/giải thích các file thử nghiệm không có vai trò sản phẩm"). Agent hiện tại không có quyền/tool xóa file trên GitHub → ghi nhận là nợ, cần parent agent xử lý bằng quyền phù hợp.

---

## 8. Lệnh test chính thức (R1-002)

Đã thêm vào root `package.json`:

```json
"test": "npm run test:unit && npm run test:integration",
"test:unit": "for m in lut effects sticker chroma textfx keyframes; do node server/render/src/$m.js --self-test || exit 1; done",
"test:integration": "bash server/render/test_integration.sh"
```

- `npm run test:unit` — chạy 6 self-test có assertion (không gồm transitions/speed vì chưa có self-test).
- `npm run test:integration` — chạy fixture + demo + verify (38s).
- Script `baseline` chưa thêm vì `scripts/baseline.js` chưa tồn tại (ngoài phạm vi task này — chỉ được tạo `docs/BASELINE.md` và sửa `package.json`).

---

## 9. Giới hạn còn lại / nợ phát hiện trong đợt baseline

1. **mcp-server build đỏ** (15 lỗi TS) mà root build không phát hiện — cần đưa vào CI (R1-003).
2. **transitions.js và speed.js chưa có self-test** assertion-based.
3. **caption.py không chạy được** ở môi trường này (thiếu faster_whisper + model).
4. **File rác trên GitHub** chưa xóa được (cần tool delete).
5. Chưa có CI workflow (`.github/workflows/` không tồn tại) — thuộc R1-003, ngoài phạm vi task này.
