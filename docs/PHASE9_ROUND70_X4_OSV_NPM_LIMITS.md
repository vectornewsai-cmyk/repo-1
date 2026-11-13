# PHASE9_ROUND70_X4_OSV_NPM_LIMITS.md — Đóng nợ OSV npm (thử lần cuối)

> Đợt 70 X4 — 09/11/2026 ~07:11–07:13 +07. Nợ mở đợt 69 §4 mục 4.
> Verdict: **ĐÃ ĐÓNG NỢ — không có số CVE npm.** Cả hai đường quét npm đều bị
> chặn ở tầng egress/proxy của môi trường build; đã thử 4 lần liên tiếp, không
> bịa số CVE.

## 1. Lịch sử chặn (4 lần liên tiếp)

| Lần | Đợt | Đường thử | Kết quả |
|---|---|---|---|
| 1 | 67 U8 | OSV querybatch POST, timeout 180s | ReadTimeout, 0 byte |
| 2 | 68 V1 | OSV querybatch POST, timeout 300s | ReadTimeout, batch 1–2/20 fail |
| 3 | 69 W1 | OSV querybatch POST, timeout 300s, 3 attempt/batch | ReadTimeout, batch 1–2/20 fail 3/3; checkpoint `hidden_files/round69-w1-osv-npm.json` (done 2/20, failed [1,2]) |
| 4 | **70 X4** | OSV querybatch POST 1 batch nhỏ (3 pkg), timeout 25s + `npm audit` 1 lần | **curl exit 28, HTTP 000, 0 byte sau 25,008s**; **npm audit exit 1, 403 `policy_denied`** |

## 2. Kết quả thử lần cuối (đợt 70 X4, số đo thật)

### 2.1. OSV API — `POST https://api.osv.dev/v1/querybatch`
- Lệnh: `curl -m 25 -X POST https://api.osv.dev/v1/querybatch` với 3 package
  `express@4.22.3`, `react@18.3.1`, `multer@2.4.0`.
- Kết quả: `curl: (28) Operation timed out after 25008 milliseconds with
  0 bytes received` — HTTP 000, exit code 28, 07:11:53 +07.
- Không chạy lại toàn bộ 20 batch: 3 lần trước đã chứng minh fail hết
  (≈5 giờ vô ích nếu chạy lại).

### 2.2. npm audit — 1 lần, repo root
- Lệnh: `timeout 120 npm audit --audit-level=high --json`
- Kết quả: exit 1 sau ~6,7s (07:12:17 +07):
  `403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick
  - policy_denied`; policy `zz_managed_internal_spaces_package_registries`,
  rule `POST /-/npm/v1/security/audits/quick`; header
  `x-hatch-policy: zz_managed_internal_spaces_package_registries`.
- Cùng lỗi U8 đợt 67 đã chứng minh — chính sách registry nội bộ, không phải
  lỗi mạng thoáng qua.

### 2.3. Sự cố môi trường trong lúc thử
- Lần thử OSV đầu tiên bằng python `requests` (timeout 30s) bị gián đoạn do
  exec service restart giữa chừng (2 lệnh trùng gửi cùng lúc, session abort);
  file script `/tmp/osv-final-try.py` chưa kịp ghi. Thử lại bằng curl chạy
  nền mới có kết quả §2.1. Không ảnh hưởng kết luận: cả hai công cụ đều bị chặn.
- Tổng thời gian thử mạng đợt này: ~10 phút (đúng giới hạn 30–40 phút của nhiệm vụ).

## 3. Đóng nợ bằng văn bản (đã làm)

- `SECURITY.md` §2.6: thêm khối **"ĐÓNG NỢ — 09/11/2026 (đợt 70 X4)"** ghi rõ
  "không có số CVE npm", liệt kê cả 4 lần chặn, và lưu ý OSV chỉ bị chặn ở
  đường querybatch POST cho npm (pip-audit Python vẫn chạy được 08/11).
- `SECURITY.md` §3.5: cập nhật câu cuối — CVE npm chưa đo được, chỉ CI GitHub
  mới quét được, không bịa số.
- Không sửa/xóa nội dung cũ nào khác trong SECURITY.md; không viết trùng.

## 4. Giới hạn còn lại (trung thực)

1. **CVE npm chưa đo được — không có con số nào.** Câu "không có CVE nghiêm
   trọng nào được biết tới" trong SECURITY.md §2.6 vẫn chỉ là đánh giá theo
   kiến thức hiện có tại thời điểm audit 20/10, KHÔNG phải kết quả quét.
2. **Không quét được npm local bằng bất kỳ công cụ nào hiện có**: `npm audit`
   bị policy chặn, OSV querybatch POST timeout, `osv-scanner` dùng cùng API
   nên sẽ gặp cùng lỗi (không thử thêm — cùng đường egress).
3. **Hướng mở duy nhất**: job `npm audit` trong `.github/workflows/ci-security.yml`
   chạy trên GitHub Actions (không qua egress của VM này) — nhưng file workflow
   vẫn local-only vì App thiếu quyền `workflows:write` (403, xem SECURITY.md §4);
   tới khi user tự thêm file qua web GitHub và CI chạy lần đầu thì mới có số
   CVE npm thật.
4. **pip-audit (Python) không bị ảnh hưởng**: đã quét 08/11 — caption/reframe/
   tracking sạch, tts 39 + bgremove 66 lỗ hổng; bgremove đã bump về 0 ở đợt
   67 U8 (xem SECURITY.md §3.3). Nợ này chỉ liên quan npm.
5. Checkpoint W1 (`hidden_files/round69-w1-osv-npm.json`, done 2/20) giữ
   nguyên làm bằng chứng lịch sử — không chạy tiếp, không xóa.

## 5. File đổi trong đợt

- `SECURITY.md` (sửa 2 chỗ: §2.6 thêm khối đóng nợ, §3.5 cập nhật câu cuối)
- `docs/PHASE9_ROUND70_X4_OSV_NPM_LIMITS.md` (file này, mới)
- Bằng chứng thô: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round70-x4-osv-npm.txt`
  (không đưa vào batch push — file log ngoài repo)
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round70-x4.md`
  (không đưa vào batch push)

## 6. Nợ còn lại

- Không còn nợ nào từ X4. Nợ duy nhất liên quan: **CVE npm chưa có số** — chỉ
  đóng được khi CI GitHub chạy lần đầu (phụ thuộc user thêm workflow qua web).
  Không lặp lại thử OSV/npm audit local nữa trừ khi môi trường egress thay đổi.
