# PHASE9_ROUND84_L9_PROXY_AUTO_LIMITS.md — Proxy tự động khi import (đợt 84 L9)

> Ngày: 2026-11-11. Luồng L9, đợt 84. KHÔNG push.
> Bối cảnh: proxy workflow (Phase 8 Q8) + tự động tạo khi import (Phase 9
> R3) đã có sẵn: checkbox tự động mặc định BẬT, badge PROXY, preview dùng
> proxy, export dùng gốc. L9 KHÔNG làm lại phần đó — đợt này đóng 3 khoảng
> trống còn lại của R3: (1) không chọn được chiều cao proxy (kẹt 720p),
> (2) video mất file gốc bị bỏ qua lặng, không giải thích, (3) chưa có
> kiểm chứng đầu-cuối mới cho đường tự động (script R3 dùng Chromium
> headless, nặng; L9 đo lại ở tầng bridge + unit).

## 0. Đã làm gì

1. **Chọn chiều cao proxy 480p/720p** (`MediaBin.tsx` + `lib/proxy.ts`):
   selector cạnh checkbox tự động, lưu `localStorage`
   `vcut-auto-proxy-height`, dùng chung cho cả tạo tay (`makeProxy`) lẫn
   tự động (`autoProxyFresh`). `shouldAutoProxy(item, enabled,
   targetHeight=720)` nay bỏ qua video có chiều cao <= đích (trước đây
   kẹt 720); bridge vốn đã nhận 480|720 (`PROXY_BAD_HEIGHT` nếu khác).
2. **Lý do bỏ qua tường minh** (`lib/proxy.ts`): `autoProxySkipReason()`
   trả `disabled | not-video | no-original-file | already-has-proxy |
   already-small | null`, kèm `parseProxyHeight()` chuẩn hoá giá trị lạ
   về 480|720 (mặc định 720) và `readAutoProxyHeight()`.
3. **Thông báo khi mất file gốc** (`MediaBin.tsx`): video không còn
   `file` (vd media rehydrate/sample sau reload) nay hiện ghi chú ngay
   trên thẻ media thay vì nút Proxy biến mất lặng: “Không còn file gốc
   — không tạo được proxy. Import lại file gốc để tạo proxy; preview
   vẫn dùng bản đã lưu.” (i18n `mediabin.proxyNoOriginalFile`).
   Hành vi: không tạo được proxy khi không còn file gốc (proxy cần
   upload `File` gốc lên bridge); preview vẫn phát bản đã lưu trong kho;
   export vẫn cần file gốc — import lại file là cách duy nhất tạo proxy.
4. **i18n vi/en**: +2 key mới (`mediabin.proxyHeightLabel`,
   `mediabin.proxyNoOriginalFile`); `autoProxyHint`,
   `proxyCreateTitle`, `proxyStaleTitle` nay dùng placeholder `{height}`
   thay cho số 720p cứng. Dict 2463 → **2465**, vi == en.
5. **Script kiểm chứng mới** `apps/web/scripts/r84l9-proxy-auto-verify.mjs`:
   sinh clip thật → chạy bridge thật trên cổng test → POST /api/proxy →
   ffprobe proxy → kiểm tra skip + GET proxy file.

## 1. Kiểm chứng thật (số đo lần này, VM 4 vCPU EPYC 9D25)

| Kiểm chứng | Kết quả |
|---|---|
| `proxyAuto.test.ts` (unit: shouldAutoProxy theo đích, parseProxyHeight, skip reasons, previewUrlFor/badge) | **35/35 pass, 0 fail** (cũ 19 + 16 mới) |
| `r84l9-proxy-auto-verify.mjs` (bridge thật, cổng 18894, WORK_ROOT tạm) | **13/13 pass** |
| Clip 1080p 10 s testsrc h264 30 fps (305.812 byte) → POST height=720 | HTTP 200, **11.280 ms**; proxy 1280x720 h264 30 fps 10 s, 262.589 byte |
| Cùng clip → POST height=480 | HTTP 200, **11.098 ms**; proxy 854x480 h264 |
| Clip 480p → POST height=720 | `{skipped:true}` (không tạo proxy vô ích) |
| GET `/api/proxy/file/<proxy>` | 200 (preview phát được bằng proxy) |
| `server/render/test_proxy_q8.js` (export dùng gốc) | **10/10 pass** — spec trỏ gốc → output 1920x1080 |
| `tsc --noEmit` (apps/web) | **exit 0** |
| `r6-i18n-check.cjs` | **PASS**, vi=2465 en=2465 |
| `vite build` | **exit 0** (built in 35,44 s; cảnh báo chunk >500 kB đã có từ trước) |

## 2. Quyết định mặc định BẬT — bằng chứng

- Tạo proxy chạy **nền sau import**: `importFiles` trả về trước,
  `autoProxyFresh` mới chạy tuần tự từng item; import không đợi proxy.
  Overhead import đo được = **0 ms chặn** (proxy tạo sau, không nằm
  trong đường import).
- Chi phí: ~**11,3 s cho clip 1080p 10 s** trên VM này (~1,1× độ dài
  clip; clip 60 s ≈ 1 phút chạy nền). Đổi lại preview 720p nhanh hơn
  gốc 1080p ~25–40% (đợt 52 I9: 9,8/10,5 fps so với 7,0/8,2 fps).
- Kết luận: **giữ mặc định BẬT** (như R3). User tắt được bằng checkbox
  trong MediaBin; khi tắt, không item nào tự tạo (lý do `disabled`).
  Nếu máy yếu / clip dài, user chọn 480p để proxy tạo nhẹ hơn (cùng
  tốc độ encode trên VM này, file nhỏ hơn).

## 3. Giới hạn trung thực

1. **Chỉ video.** Ảnh/audio không có proxy (decode rẻ, không cần).
   `autoProxySkipReason` trả `not-video`.
2. **Cần File gốc còn giữ được.** Media sau reload chỉ còn spec trong
   IndexedDB mà mất blob (vd sample cũ, kho bị dọn tay) thì không tạo
   được proxy — UI nay ghi rõ, nhưng không có cách tạo proxy từ bản
   đã lưu trong kho (kho chỉ giữ blob gốc khi import qua `importFiles`;
   nếu blob gốc mất thì cũng mất nguồn). Cách sửa duy nhất: import lại.
3. **Cần bridge chạy.** Bridge tắt → auto-proxy fail từng item, chỉ
   toast 1 lần (`mediabin.bridgeDown`); nút Proxy trên thẻ cho tạo lại
   tay khi bridge đã chạy. Không có hàng đợi thử lại tự động.
4. **Tạo tuần tự, không song song.** `autoProxyFresh` chạy từng item
   một để khỏi đè CPU bridge; import 5 clip 1080p 10 s ≈ 55 s nền mới
   xong hết proxy. Không có tiến trình % theo từng proxy — chỉ trạng
   thái “Đang tạo…” trên thẻ (autoStatus `creating`).
5. **Chiều cao chỉ 480|720.** Bridge từ chối giá trị khác (400). Không
   có 360p/1080p; 4K cũng chỉ xuống 720p tối đa (đủ cho preview).
6. **Proxy giữ fps/duration gốc** (đo: 30 fps, 10 s giữ nguyên) nhưng
   **không giữ bitrate/CRF gốc** — encode lại libx264 mặc định của
   bridge; chất lượng preview thấp hơn gốc là đúng thiết kế.
7. **Không kiểm chứng headed trên browser thật trong đợt này.**
   `check-proxy-auto.mjs` (R3, Chromium + vite + DOM.setFileInputFiles)
   không chạy lại — đường UI mới (selector + ghi chú mất file) chỉ
   được kiểm bằng unit + tsc + i18n-check, chưa click-test thật.
   Selector là `<select>` chuẩn nên rủi ro thấp, nhưng chưa phải bằng
   chứng headed.
8. **Số thời gian theo tải VM.** 11,3 s / 10 s clip đo lúc VM đang chạy
   các luồng đợt 84 khác; máy khác / lúc rảnh có thể nhanh hơn. Không
   suy ra số tuyệt đối cho máy user.
9. **Export luôn dùng gốc — nhưng chỉ khi spec còn trỏ gốc.** Render
   worker không tự thay src bằng proxy (PROXY_LIMITS.md, Q8 10/10);
   nếu user tự sửa spec trỏ sang file proxy thì export sẽ ra proxy —
   đó là hành vi tường minh, không phải mặc định.

## 4. File đổi (stage, KHÔNG push)

- `apps/web/src/lib/proxy.ts` — `ProxyHeight`, `parseProxyHeight`,
  `readAutoProxyHeight`, `autoProxySkipReason`, `shouldAutoProxy`
  nhận `targetHeight`.
- `apps/web/src/MediaBin.tsx` — selector 480/720, nối chiều cao vào
  tạo tay + tự động, ghi chú mất file gốc, title/badge theo chiều cao.
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` — +2 key,
  3 chuỗi dùng `{height}`.
- `apps/web/src/lib/proxyAuto.test.ts` — 19 → 35 test.
- `apps/web/scripts/r84l9-proxy-auto-verify.mjs` — script kiểm chứng mới.
- `docs/PHASE9_ROUND84_L9_PROXY_AUTO_LIMITS.md` — file này.

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round84-l9-proxy-auto.txt`
(verify read-back sau khi stage).

## 5. Nợ còn lại

- Click-test headed đường UI mới (selector 480/720 + ghi chú mất file
  gốc) trên browser thật — chưa chạy trong đợt này (§3.7).
- Không có tiến trình % / hàng đợi thử lại khi bridge tắt (§3.3–3.4).
- Không có proxy cho clip mất file gốc ngoài cách import lại (§3.2).
