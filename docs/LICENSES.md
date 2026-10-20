# LICENSES.md — Bảng giấy phép đầy đủ của VCut Studio

> Cập nhật: 2026-10-20 (audit R1-101/R1-103, Batch J).
> Giấy phép của chính dự án: **MIT** (`LICENSE` ở repo root).

**Kết luận audit**: không có dependency runtime nào dùng GPL/copyleft mạnh.
Xem phân tích chi tiết tại `SECURITY.md` §2.6.

---

## 1. Dependencies Node.js trực tiếp (runtime)

| Package | Phiên bản | License | Dùng ở |
|---|---|---|---|
| `react` | 18.3.1 | MIT | apps/web |
| `react-dom` | 18.3.1 | MIT | apps/web |
| `zustand` | 5.0.15 | MIT | apps/web |
| `jszip` | 3.10.2 | **MIT OR GPL-3.0-or-later** (dual — dự án dùng theo MIT) | apps/web (archive .vcut.zip) |
| `@modelcontextprotocol/sdk` | 1.32.1 | MIT | mcp-server |
| `zod` | 3.23.8 | MIT | mcp-server |
| `express` | 4.22.3 | MIT | server/bridge |
| `cors` | 2.8.6 | MIT | server/bridge |
| `multer` | 2.4.0 | MIT | server/bridge |
| `js-yaml` | 4.3.2 | MIT | server/bridge (parse openapi.yaml) |

## 2. Dependencies Python (local AI)

| Package | License | Dùng ở | Ghi chú |
|---|---|---|---|
| `faster-whisper` | MIT | server/caption | Transcribe + translate |
| `ctranslate2` | MIT | server/caption (transitive) | Inference engine |
| `onnxruntime` | MIT | server/caption, server/tts (transitive) | |
| `vieneu` | **Apache-2.0** | server/tts | TTS tiếng Việt bản 0.5B. ⚠️ Bản 0.3B là CC-BY-NC — cấm dùng |
| `rembg` | **MIT** | server/bgremove | Xoá nền. ⚠️ Session `bria-rmbg`/`RMBG-2.0` non-commercial — bị chặn bằng code |
| `opencv-python-headless` | Apache-2.0 | server/bgremove, server/reframe | |
| `numpy` | BSD-3-Clause | server/bgremove, server/reframe | |
| `Pillow` | HPND (permissive) | server/bgremove (transitive) | |
| `tqdm` | **MPL-2.0 AND MIT** | transitive | Weak copyleft cấp file; dùng nguyên bản không sửa → tương thích MIT |

## 3. Model AI (weights)

| Model | License | Nguồn | Ghi chú |
|---|---|---|---|
| faster-whisper `small` (462MB) | MIT (code) + model Systran | HuggingFace | Tải 1 lần, không commit |
| VieNeu-TTS v3 Turbo 0.5B (~2.3GB) | **Apache-2.0** (verify 2 nguồn: PyPI + HF) | HuggingFace `pnnbao-ump/VieNeu-TTS-v3-Turbo` | Watermark đã tắt trong `tts.py` |
| BiRefNet-general (973MB) | **MIT** (verify GitHub API `ZhengPeng7/BiRefNet`) | qua `rembg` session | OOM trên RAM 8GB — fallback `u2net` |
| ❌ RVM (Robust Video Matting) | GPL-3.0 | — | **ĐÃ LOẠI** — xung đột với MIT |
| ❌ MatAnyone 2 | NTU S-Lab non-commercial | — | **ĐÃ LOẠI** — chỉ benchmark, không bundle |

## 4. Assets (kho tài nguyên)

Attribution chi tiết từng file: **`assets/SOURCES.md`** (527 dòng, đối chiếu 1:1
với file thực tế — xem `SECURITY.md` §2.7).

| Loại | Số lượng | License |
|---|---|---|
| Stickers PNG | 203 | Twemoji CC-BY-4.0, Noto Emoji Apache-2.0, tự vẽ (dự án) |
| LUT `.cube` | 104 | MIT, CC-BY-4.0, tự generate (dự án) |
| Text presets CSS | 56 | MIT (animate.css 3.7.2), tự viết (dự án) |
| Effects GLSL | 7 | MIT (pixi-filters) |
| Audio OGG | 12 + catalog 948 | CC0 (Kenney, uisfx) |
| Fonts | 43 | OFL-1.1 (Google Fonts, 100% hỗ trợ tiếng Việt) |
| Templates JSON | 10 | Tác phẩm gốc của dự án |

## 5. Trường hợp đặc biệt (đã đánh giá, KHÔNG vi phạm)

1. **`jszip` dual license `(MIT OR GPL-3.0-or-later)`**: dual licensing cho phép
   người dùng CHỌN một trong hai. Dự án phân phối theo lựa chọn **MIT** —
   không nhiễm GPL.
2. **`tqdm` MPL-2.0**: weak copyleft ở cấp file; dự án dùng nguyên bản không sửa
   đổi — được phép trong dự án MIT.
3. **`caniuse-lite` CC-BY-4.0**: dữ liệu build-time của devDependency
   (browserslist), không ship trong runtime bundle.
4. **`argparse` Python-2.0**: license permissive của Python Software Foundation,
   transitive dev tool.

## 6. Toàn bộ npm transitive dependencies (206 packages)

| Package | Version | License |
|---|---|---|
| @babel/code-frame | 7.29.7 | MIT |
| @babel/compat-data | 7.29.7 | MIT |
| @babel/core | 7.29.7 | MIT |
| @babel/generator | 7.29.8 | MIT |
| @babel/helper-compilation-targets | 7.29.7 | MIT |
| @babel/helper-globals | 7.29.7 | MIT |
| @babel/helper-module-imports | 7.29.7 | MIT |
| @babel/helper-module-transforms | 7.29.7 | MIT |
| @babel/helper-plugin-utils | 7.29.7 | MIT |
| @babel/helper-string-parser | 7.29.7 | MIT |
| @babel/helper-validator-identifier | 7.29.7 | MIT |
| @babel/helper-validator-option | 7.29.7 | MIT |
| @babel/helpers | 7.29.10 | MIT |
| @babel/parser | 7.29.9 | MIT |
| @babel/plugin-transform-react-jsx-self | 7.29.7 | MIT |
| @babel/plugin-transform-react-jsx-source | 7.29.7 | MIT |
| @babel/template | 7.29.7 | MIT |
| @babel/traverse | 7.29.10 | MIT |
| @babel/types | 7.29.8 | MIT |
| @esbuild/aix-ppc64 | 0.25.12 | MIT |
| @esbuild/android-arm | 0.25.12 | MIT |
| @esbuild/android-arm64 | 0.25.12 | MIT |
| @esbuild/android-x64 | 0.25.12 | MIT |
| @esbuild/darwin-arm64 | 0.25.12 | MIT |
| @esbuild/darwin-x64 | 0.25.12 | MIT |
| @esbuild/freebsd-arm64 | 0.25.12 | MIT |
| @esbuild/freebsd-arm64 | 0.25.12 | MIT |
| @esbuild/freebsd-x64 | 0.25.12 | MIT |
| @esbuild/linux-arm | 0.25.12 | MIT |
| @esbuild/linux-arm64 | 0.25.12 | MIT |
| @esbuild/linux-ia32 | 0.25.12 | MIT |
| @esbuild/linux-loong64 | 0.25.12 | MIT |
| @esbuild/linux-mips64el | 0.25.12 | MIT |
| @esbuild/linux-ppc64 | 0.25.12 | MIT |
| @esbuild/linux-riscv64 | 0.25.12 | MIT |
| @esbuild/linux-s390x | 0.25.12 | MIT |
| @esbuild/linux-x64 | 0.25.12 | MIT |
| @esbuild/netbsd-arm64 | 0.25.12 | MIT |
| @esbuild/netbsd-x64 | 0.25.12 | MIT |
| @esbuild/openbsd-arm64 | 0.25.12 | MIT |
| @esbuild/openbsd-x64 | 0.25.12 | MIT |
| @esbuild/openharmony-arm64 | 0.25.12 | MIT |
| @esbuild/sunos-x64 | 0.25.12 | MIT |
| @esbuild/win32-arm64 | 0.25.12 | MIT |
| @esbuild/win32-ia32 | 0.25.12 | MIT |
| @esbuild/win32-x64 | 0.25.12 | MIT |
| @jridgewell/gen-mapping | 0.3.13 | MIT |
| @jridgewell/remapping | 2.3.5 | MIT |
| @jridgewell/resolve-uri | 3.1.2 | MIT |
| @jridgewell/sourcemap-codec | 1.6.0 | MIT |
| @jridgewell/trace-mapping | 0.3.31 | MIT |
| @napi-rs/lzma-linux-x64-gnu | 1.5.1 | MIT |
| @rolldown/pluginutils | 1.0.0-beta.27 | MIT |
| @rollup/rollup-android-arm-eabi | 4.64.10 | MIT |
| @rollup/rollup-android-arm64 | 4.64.10 | MIT |
| @rollup/rollup-darwin-arm64 | 4.64.10 | MIT |
| @rollup/rollup-darwin-x64 | 4.64.10 | MIT |
| @rollup/rollup-freebsd-arm64 | 4.64.10 | MIT |
| @rollup/rollup-freebsd-x64 | 4.64.10 | MIT |
| @rollup/rollup-linux-arm-gnueabihf | 4.64.10 | MIT |
| @rollup/rollup-linux-arm-musleabihf | 4.64.10 | MIT |
| @rollup/rollup-linux-arm64-gnu | 4.64.10 | MIT |
| @rollup/rollup-linux-arm64-musl | 4.64.10 | MIT |
| @rollup/rollup-linux-loong64-gnu | 4.64.10 | MIT |
| @rollup/rollup-linux-loong64-musl | 4.64.10 | MIT |
| @rollup/rollup-linux-ppc64-gnu | 4.64.10 | MIT |
| @rollup/rollup-linux-ppc64-musl | 4.64.10 | MIT |
| @rollup/rollup-linux-riscv64-gnu | 4.64.10 | MIT |
| @rollup/rollup-linux-riscv64-musl | 4.64.10 | MIT |
| @rollup/rollup-linux-s390x-gnu | 4.64.10 | MIT |
| @rollup/rollup-linux-x64-gnu | 4.64.10 | MIT |
| @rollup/rollup-linux-x64-musl | 4.64.10 | MIT |
| @rollup/rollup-openbsd-x64 | 4.64.10 | MIT |
| @rollup/rollup-openharmony-arm64 | 4.64.10 | MIT |
| @rollup/rollup-win32-arm64-msvc | 4.64.10 | MIT |
| @rollup/rollup-win32-ia32-msvc | 4.64.10 | MIT |
| @rollup/rollup-win32-x64-gnu | 4.64.10 | MIT |
| @rollup/rollup-win32-x64-msvc | 4.64.10 | MIT |
| @types/babel__core | 7.20.5 | MIT |
| @types/babel__generator | 7.27.0 | MIT |
| @types/babel__template | 7.4.4 | MIT |
| @types/babel__traverse | 7.28.0 | MIT |
| @types/estree | 1.0.9 | MIT |
| @types/node | 26.6.5 | MIT |
| @types/prop-types | 15.7.15 | MIT |
| @types/react | 18.3.31 | MIT |
| @types/react-dom | 18.3.7 | MIT |
| @vitejs/plugin-react | 4.7.0 | MIT |
| accepts | 1.3.8 | MIT |
| append-field | 1.0.0 | MIT |
| argparse | 2.0.1 | Python-2.0 |
| array-flatten | 1.1.1 | MIT |
| baseline-browser-mapping | 2.11.29 | Apache-2.0 |
| body-parser | 1.20.8 | MIT |
| browserslist | 4.29.3 | MIT |
| bytes | 3.1.2 | MIT |
| call-bind-apply-helpers | 1.0.2 | MIT |
| call-bound | 1.0.4 | MIT |
| caniuse-lite | 1.0.30001816 | CC-BY-4.0 |
| content-disposition | 0.5.4 | MIT |
| content-type | 1.0.5 | MIT |
| convert-source-map | 2.0.0 | MIT |
| cookie | 0.7.2 | MIT |
| cookie-signature | 1.0.7 | MIT |
| core-util-is | 1.0.3 | MIT |
| cors | 2.8.6 | MIT |
| csstype | 3.2.3 | MIT |
| debug | 4.4.3 | MIT |
| depd | 2.0.0 | MIT |
| destroy | 1.2.0 | MIT |
| dunder-proto | 1.0.1 | MIT |
| ee-first | 1.1.1 | MIT |
| electron-to-chromium | 1.5.459 | ISC |
| encodeurl | 2.0.0 | MIT |
| es-define-property | 1.0.1 | MIT |
| es-errors | 1.3.0 | MIT |
| es-object-atoms | 1.1.2 | MIT |
| esbuild | 0.25.12 | MIT |
| escalade | 3.2.0 | MIT |
| escape-html | 1.0.3 | MIT |
| etag | 1.8.1 | MIT |
| express | 4.22.3 | MIT |
| fdir | 6.5.0 | MIT |
| finalhandler | 1.3.2 | MIT |
| forwarded | 0.2.0 | MIT |
| fresh | 0.5.2 | MIT |
| fsevents | 2.3.3 | MIT |
| function-bind | 1.1.2 | MIT |
| gensync | 1.0.0-beta.2 | MIT |
| get-intrinsic | 1.3.0 | MIT |
| get-proto | 1.0.1 | MIT |
| gopd | 1.2.0 | MIT |
| has-symbols | 1.1.0 | MIT |
| hasown | 2.0.4 | MIT |
| http-errors | 2.0.1 | MIT |
| iconv-lite | 0.4.24 | MIT |
| immediate | 3.0.6 | MIT |
| inherits | 2.0.4 | ISC |
| ipaddr.js | 1.9.1 | MIT |
| isarray | 1.0.0 | MIT |
| js-tokens | 4.0.0 | MIT |
| js-yaml | 4.3.2 | MIT |
| jsesc | 3.1.0 | MIT |
| json5 | 2.2.3 | MIT |
| jszip | 3.10.2 | (MIT OR GPL-3.0-or-later) |
| lie | 3.3.0 | MIT |
| loose-envify | 1.4.0 | MIT |
| lru-cache | 5.1.1 | ISC |
| math-intrinsics | 1.1.0 | MIT |
| media-typer | 0.3.0 | MIT |
| merge-descriptors | 1.0.3 | MIT |
| methods | 1.1.2 | MIT |
| mime | 1.6.0 | MIT |
| mime-db | 1.52.0 | MIT |
| mime-types | 2.1.35 | MIT |
| ms | 2.1.3 | MIT |
| multer | 2.4.0 | MIT |
| nanoid | 3.3.20 | MIT |
| negotiator | 0.6.3 | MIT |
| node-releases | 2.0.59 | MIT |
| object-assign | 4.1.1 | MIT |
| object-inspect | 1.13.4 | MIT |
| on-finished | 2.4.1 | MIT |
| pako | 1.0.11 | (MIT AND Zlib) |
| parseurl | 1.3.3 | MIT |
| path-to-regexp | 0.1.13 | MIT |
| picocolors | 1.1.1 | ISC |
| picomatch | 4.0.7 | MIT |
| postcss | 8.5.30 | MIT |
| process-nextick-args | 2.0.1 | MIT |
| proxy-addr | 2.0.8 | MIT |
| qs | 6.16.1 | BSD-3-Clause |
| range-parser | 1.2.1 | MIT |
| raw-body | 2.5.3 | MIT |
| react | 18.3.1 | MIT |
| react-dom | 18.3.1 | MIT |
| react-refresh | 0.17.0 | MIT |
| readable-stream | 2.3.8 | MIT |
| rollup | 4.64.10 | MIT |
| safe-buffer | 5.2.1 | MIT |
| safer-buffer | 2.1.2 | MIT |
| scheduler | 0.23.2 | MIT |
| semver | 6.3.1 | ISC |
| send | 0.19.2 | MIT |
| serve-static | 1.16.3 | MIT |
| setimmediate | 1.0.5 | MIT |
| setprototypeof | 1.2.0 | ISC |
| side-channel | 1.1.1 | MIT |
| side-channel-list | 1.0.1 | MIT |
| side-channel-map | 1.0.1 | MIT |
| side-channel-weakmap | 1.0.2 | MIT |
| source-map-js | 1.2.2 | BSD-3-Clause |
| statuses | 2.0.2 | MIT |
| string_decoder | 1.1.1 | MIT |
| tinyglobby | 0.2.17 | MIT |
| toidentifier | 1.0.1 | MIT |
| type-is | 1.6.18 | MIT |
| typescript | 5.6.3 | Apache-2.0 |
| undici-types | 8.9.0 | MIT |
| unpipe | 1.0.0 | MIT |
| update-browserslist-db | 1.3.4 | MIT |
| util-deprecate | 1.0.2 | MIT |
| utils-merge | 1.0.1 | MIT |
| vary | 1.1.2 | MIT |
| vite | 6.4.4 | MIT |
| yallist | 3.1.1 | ISC |
| zustand | 5.0.15 | MIT |

*(Nguồn: `package-lock.json` tại thời điểm audit. Bảng này cần regenerate khi
dependencies thay đổi: `node -e` script trong audit hoặc `npx license-checker`.)*
