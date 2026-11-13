# LIMITS — Phase 9 đợt 78 F4: bump npm 5 CVE (đóng nợ đợt 77 §4.4)

> Đợt 78 F4 — 10/11/2026 ~06:40–07:35 +07 (lượt cron 06:35 +07).
> Đóng nợ đợt 77 §4 mục 4 (npm 5 CVE, phát hiện lần đầu ở đợt 77 E5).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary. Không sửa production code.

## 0. Verdict

| CVE / GHSA | Package | Trước → sau | Kết quả |
|---|---|---|---|
| **CVE-2026-113872** / GHSA-q7qp-rjg7-q26m (high 7,5) | `multer` | 2.4.0 → **2.5.0** | **ĐÃ VÁ** — audit sau bump: 0 hit |
| **CVE-2026-111181** / GHSA-27r3-jxmh-p828 (high 7,5) | `body-parser` | 1.20.8 → **1.20.9** | **ĐÃ VÁ** — audit sau bump: 0 hit |
| **CVE-2026-118662** / GHSA-8g5g-mxqh-grgj (medium) | `vite` | 6.4.4 → **6.4.5** | **ĐÃ VÁ** — audit sau bump: 0 hit |
| **CVE-2026-118764** / GHSA-g3hv-75wg-m249 (medium) | `minimatch` | 9.0.9 + 10.2.6 → **11.0.1** | **ĐÃ VÁ** — audit sau bump: 0 hit |
| **Tổng** | | | **Audit GHSA chạy lại toàn lockfile: 447/447 package, 0 advisory, 0 CVE** (trước bump: 5 advisory / 4 CVE). Nợ §4.4 **ĐÃ ĐÓNG**. |

- Version gốc kiểm tra thực tế trong `package-lock.json` trước khi bump
  **khớp y hệt** E5 (multer 2.4.0, body-parser 1.20.8, vite 6.4.4,
  minimatch 9.0.9 + 10.2.6) — không có lệch version nào cần đính chính.
- Kiểm chứng xanh: tsc web **0**, tsc desktop **0**, vite build **pass**
  (1m39s, vite 6.4.5), `test:unit` **7/7**, bridge diskStorage
  (multer 2.5.0) **7/7**, glob/dir-compare hồi quy **pass** (xem §2).

## 1. Cách bump từng package

| Package | Cách bump | Vì sao đi đường này |
|---|---|---|
| multer 2.5.0 | `npm install multer@2.5.0 -w @repo-1/bridge` — dep trực tiếp của `server/bridge`, range `^2.0.0` → `^2.5.0` | Trong range cho phép; `changed 1 package` |
| body-parser 1.20.9 | `npm update body-parser` — transitive qua `express@4.22.3` (`~1.20.5`, cho phép 1.20.x) | Không thêm direct dep mới; `changed 1 package` |
| vite 6.4.5 | `npm install vite@6.4.5 -w @repo-1/web` — devDep `apps/web`, range `^6.0.3` → `^6.4.5` | Trong range cho phép; `changed 1 package` |
| minimatch 11.0.1 | **npm `overrides` có phạm vi** trong root `package.json`: `{"@electron/universal": {"minimatch": "11.0.1"}, "app-builder-lib": {"minimatch": "11.0.1"}}` + `npm update minimatch` | Range cha kẹp chặt (`@electron/universal ^9.0.3`, `app-builder-lib ^10.2.5`) nên `npm update` thường không thể lên 11; chỉ overrides mới ép được. Không dùng override toàn cục (`"minimatch": "11.0.1"`) để khỏi chạm các bản 3.x/5.x ngoài range dính. |

## 2. Hồi quy minimatch — đã bắt thật và đã sửa thật

`npm update minimatch` ban đầu **làm hỏng cây**: npm dedup xóa luôn 2 bản
`minimatch@3.1.5` lồng dưới `dir-compare` và `glob` (chúng yêu cầu
`^3.0.5`/`^3.1.1`), khiến cả hai resolve lên `minimatch@11.0.1` ở gốc —
và `glob@7.2.3` **crash thật** (`TypeError: Cannot read properties of
undefined (reading 'charAt')` tại `glob/sync.js:148`, do Minimatch v11
đổi hình dạng object nội bộ mà glob 7 dựa vào).

Đã sửa bằng cách **gộp lockfile bằng tay** (script node, từ bản lock
trước khi update minimatch): giữ `minimatch@11.0.1` ở gốc + dep mới
`@isaacs/nonrecursive-glob-match@1.1.0`, xóa 3 entry lồng dưới
`@electron/universal` (đã dedup lên 11.0.1 — đúng override), và **khôi
phục nguyên** các entry lồng `minimatch@3.1.5` + `brace-expansion@1.1.21`
+ `balanced-match@1.0.2` dưới `dir-compare` và `glob`. Sau đó
`npm install` cài lại đúng 6 package đã thiếu. Diff lockfile cuối so với
trước bump chỉ còn **10 key đổi** (4 bump + 1 dep mới + 3 entry xóa dưới
universal + 2 entry workspace đổi range) — không churn.

Kiểm chứng sau sửa (đều chạy thật):

| Kiểm tra | Kết quả |
|---|---|
| `require.resolve('minimatch')` từ `dir-compare` / `glob` | → bản lồng `3.1.5` (đúng) |
| `require.resolve('minimatch')` từ `app-builder-lib` / `@electron/universal` | → gốc `11.0.1` (`dist/commonjs/index.js`, CJS vẫn dùng được) |
| `glob.sync('*.json')`, brace `{web,desktop}`, `**` | pass, ra đúng file |
| `dir-compare.compareSync` | pass (`same: true`) |
| `require('app-builder-lib/out/fileMatcher.js')`, `require('@electron/universal')` | pass |
| `minimatch@11.0.1` trực tiếp (`minimatch()`, `new Minimatch`) | pass |
| `npm install --package-lock-only` sau gộp | lockfile **ổn định, diff 0** |

## 3. Audit GHSA sau bump — script đã port vào repo

- Script E5 (`hidden_files/r77-e5-ghsa-audit.py`, đường dẫn hardcode) đã
  **port vào `scripts/ghsa-audit.py`** với đường dẫn tương đối
  (`REPO` suy từ `__file__`), giữ nguyên logic matcher + resume +
  retry rate-limit. Thêm 2 điểm nhỏ, có ghi trong docstring:
  (a) tùy chọn `--only "name@version,..."` để kiểm lại riêng package
  vừa bump; (b) summary chỉ đếm key còn có trong lockfile hiện tại
  (bản gốc đếm cả key cũ nếu tái dùng file results sau khi đổi version).
- Matcher semver của bản port: tự test **14/14** (gồm cả 5 range dính
  của E5 ở cả 2 phía: version cũ dính, version mới thoát).
- Chạy lại toàn lockfile bằng script đã port:
  `nohup python3 scripts/ghsa-audit.py` — **447/447 package,
  `complete: true`, 0 package dính, 0 advisory, 0 CVE** (trước bump
  E5: 5 advisory / 4 CVE). Không gặp 403 rate-limit lần này.
  Kết quả từng package đích trong `scripts/ghsa-audit/results.json`:
  `multer@2.5.0 → []`, `body-parser@1.20.9 → []`,
  `vite@6.4.5 → []`, `minimatch@11.0.1 → []`
  (cả `minimatch@3.1.5`/`5.1.9` còn lại cũng `[]` — ngoài range dính).
- Bằng chứng thô: `scripts/ghsa-audit/results.json` (447 key),
  `scripts/ghsa-audit/summary.json`, `scripts/ghsa-audit/audit.log`.
  Ba file này là output sinh ra bởi script, **không đưa vào batch push**
  (theo mẫu E5: output audit không stage).

## 4. Kiểm chứng hồi quy (lệnh + kết quả thật)

| # | Lệnh | Kết quả |
|---|---|---|
| 1 | `npx tsc --noEmit` tại `apps/web` | **EXIT 0, 0 lỗi** |
| 2 | `npx tsc -p tsconfig.json --noEmit` tại `apps/desktop` | **EXIT 0, 0 lỗi** |
| 3 | `npx vite build` tại `apps/web` | **pass, 1m39s** (vite 6.4.5; chunk 1,58 MB như trước, cảnh báo chunk >500 kB đã có từ trước) |
| 4 | `npm run test:unit` tại repo root | **7/7** (lut/effects/sticker/chroma/textfx/keyframes/mask self-test) |
| 5 | `bash test/test-diskstorage.sh` tại `server/bridge` | **7 pass, 0 fail** — upload multer 2.5.0 end-to-end (tạo job, rename tmp→job dir, file giả bị từ chối, cap 7 file) |
| 6 | Kiểm tra `glob`/`dir-compare`/`app-builder-lib`/`@electron/universal` sau sửa minimatch | **pass** (xem §2) |
| 7 | `python3 scripts/ghsa-audit.py` (full) | **447/447, 0 advisory** (xem §3) |

Chưa chạy: `test:integration` (render integration, không đụng dep npm
đổi — các self-test unit + diskStorage + build đã bao phủ đường chạm
tới 4 package); `electron-builder --linux` (đóng gói desktop thật —
chưa chạy trong luồng này, xem §5).

## 5. Giới hạn trung thực / nợ còn lại

1. **`npm ls minimatch` báo `ELSPROBLEMS` (invalid) cho 2 bản lồng
   `minimatch@3.1.5` dưới `dir-compare` và `glob`.** Nguyên nhân:
   override có phạm vi áp cho cả cây con của `@electron/universal` và
   `app-builder-lib` (dir-compare nằm dưới universal, glob nằm dưới
   asar ← app-builder-lib), nên npm coi bản lồng 3.1.5 là "sai override".
   **Đây là cảnh báo của npm, không phải lỗi runtime:** Node resolve
   theo cây vật lý nên 2 package vẫn load đúng 3.1.5 (đã đo, §2), và
   `npm install` thường vẫn exit 0 + giữ nguyên lockfile (đã kiểm,
   diff 0). Nhưng **CẤM chạy `npm update minimatch` / `npm dedupe` /
   `npm update` toàn cục** trên cây này — chính `npm update minimatch`
   đã xóa 2 bản lồng và làm crash glob 7 (§2). Nếu đợt sau cần đổi
   minimatch thì sửa lockfile bằng tay theo mẫu §2 rồi `npm install`.
2. **Không có đường nâng cấp upstream sạch cho minimatch.**
   `app-builder-lib` mới nhất vẫn là 26.18.0 với `minimatch ^10.2.5`;
   `@electron/universal@3.0.6` đã bỏ hẳn minimatch nhưng
   `app-builder-lib` kẹp exact `2.0.3` (cùng `@electron/asar ^4.0.0`,
   hiện 3.4.1) — nâng universal/asar là đổi cả chuỗi đóng gói desktop,
   ngoài phạm vi luồng này. Override là cách duy nhất hiện tại.
3. **Chưa chạy `electron-builder --linux` thật** sau khi đổi minimatch
   của app-builder-lib/universal: `require()` của 2 package đã pass,
   nhưng đóng gói AppImage/.deb thật chưa được đo lại trong luồng này
   (đợt sau có build desktop thì đo lại).
4. **TTS 39 CVE Pillow không thuộc luồng này** — vẫn chờ Gradio gỡ kẹp
   `pillow<13` (nợ §4.5 đợt 77, giữ nguyên).
5. `vite 6.4.5` vẫn là devDependency — CVE medium chỉ ảnh hưởng dev
   server (`server.fs.deny` bypass bằng query), không chạy ở runtime
   người dùng. `body-parser`/`multer` là 2 CVE high chạy ở bridge thật
   (upload + parse body HTTP) nên là 2 bump quan trọng nhất.
6. `minimatch@3.1.5`/`5.1.9` còn lại trong cây **không dính CVE này**
   (range dính `>= 7.0.0, < 11.0.1`) — audit xác nhận `[]`.

## 6. File đổi/thêm (batch phase9-round78-f4-npm-cve, KHÔNG push)

- `package.json` — thêm `overrides` (minimatch 11.0.1 cho
  `@electron/universal` + `app-builder-lib`).
- `package-lock.json` — multer 2.5.0, body-parser 1.20.9, vite 6.4.5,
  minimatch 11.0.1 (+ `@isaacs/nonrecursive-glob-match` 1.1.0 mới),
  xóa 3 entry lồng dưới `@electron/universal`, giữ nguyên entry lồng
  3.1.5 dưới `dir-compare`/`glob`.
- `server/bridge/package.json` — `multer ^2.0.0` → `^2.5.0`.
- `apps/web/package.json` — `vite ^6.0.3` → `^6.4.5`.
- `scripts/ghsa-audit.py` — mới, port script audit E5 vào repo
  (đường dẫn tương đối + `--only` + summary lọc key cũ).
- `docs/PHASE9_ROUND78_F4_NPM_CVE_BUMP_LIMITS.md` — file này (mới).
- KHÔNG đổi: code production, `server/tts/requirements.txt`, file
  workflow, test nào. Không stage output audit sinh ra
  (`scripts/ghsa-audit/{results,summary}.json`, `audit.log`).
