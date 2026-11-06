# Phase 9 đợt 26 — Preview robustness + nested assets + fade dip canvas — LIMITS tổng hợp

> Đợt lớn 6 luồng song song (J1–J6), KHÔNG push, KHÔNG tag/release,
> KHÔNG binary vào repo. Kiểm chứng gộp của parent (chạy lại độc lập,
> không lấy số của luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi,
> `vite build` pass (4.18s), transitionPreview 31/31, relinkNested
> 13/13, holdFrame 9/9, nestedPreviewFailsoft26J1 6/6,
> projectRepoRound26J5 15/15, nestedPreview 46/46, nestedPreviewR3
> 21/21, nestedRampPreview 34/34, nestedUnify 12 PROVEN, previewEngine
> 14/14, projectRepo 10/10, projectRepoNested22 7/7, store qua esbuild:
> I2 20/20, I3 9/9, T4 11/11, Guard 9/9; node --check 2 script mới pass;
> 5 JSON benchmark parse OK. Sửa duy nhất của parent ở bước gộp: thêm
> `src/lib/projectRepoRound26J5.test.ts` vào tsconfig exclude (J5 quên
> theo quy ước repo; trước đó tsc toàn repo báo TS5097 đúng 1 lỗi này).
> File build phụ (dist, *.tsbuildinfo, vite.config.js/.d.ts emit từ
> vite.config.ts) KHÔNG đưa vào batch.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **J1 preview fail-soft** (`docs/PHASE9_ROUND26_J1_PREVIEW_FAILSOFT_LIMITS.md`):
  `buildPreviewSpecFailsoft` trong nestedPreview.ts — đường nhanh giữ
  nguyên `buildPreviewSpec`; chỉ khi throw mới cô lập từng nested,
  sanitize curve lỗi về tuyến tính 1× (pass 2 force-all cho hợp hai
  tầng vượt ngưỡng, vd lá 2× dưới nested 4× → 8), vẫn throw thì bỏ
  nested đó khỏi preview. Warning có cấu trúc tới user bằng badge
  thường trực + toast dedupe trong preview.tsx. Flatten thuần vẫn
  throw y cũ (hồi quy khóa).
- **J2 relink đệ quy** (`docs/PHASE9_ROUND26_J2_NESTED_RELINK_LIMITS.md`):
  `findMissingAssets` + `relinkAsset` quét subSpec mọi tầng (canonical
  + legacy, chống vòng lặp theo nhánh, sâu tối đa 64), panel hiện chain
  `outer › inner` + breakdown cấp cao/trong nested. Undo vẫn 1 bước
  qua `execCommand` sẵn có của store.
- **J3 wiring dip canvas** (`docs/PHASE9_ROUND26_J3_CANVAS_DIP_LIMITS.md`):
  `drawVideoClipWithDip` trong preview.tsx — vẽ clip qua offscreen
  (strip transition để lấy pixel alpha đầy đủ), composite từng pixel
  bằng `singleClipDipPixel` (trắng / xám mean-kênh), pixel alpha = 0
  (letterbox, góc SR, mask/chroma trong suốt) thì bỏ qua nên dip không
  xóa track vẽ trước. `dipMode` mới trên `TransitionClipVisual`;
  fadeblack giữ đường alpha cũ.
- **J4 giữ frame cuối** (`docs/PHASE9_ROUND26_J4_HOLD_FRAME_LIMITS.md`):
  helper thuần `decideVideoFrame` + cache trong preview.tsx — đang
  phát mà thiếu frame thì vẽ lại frame tốt cuối qua đúng pipeline
  (letterbox/LUT/chroma/mask/SR/opacity tại `t` hiện tại); paused giữ
  hành vi cũ. Hướng nới guard `videoWidth > 0` đã BỊ BÁC bằng harness:
  Chromium ở RS=1 vẽ frame cũ hay no-op tùy trạng thái, không khóa
  được — chỉ cache-hold mới xác định.
- **J5 load-validation** (`docs/PHASE9_ROUND26_J5_LOAD_VALIDATION_LIMITS.md`):
  `checkSpeedKeyframes` + `validateSpecDeep` opts `speedCurveWarnings`
  — v ∈ [0.25, 4], t đơn điệu tăng ngặt, easing hợp lệ (bezier cần
  x1, x2 ∈ [0, 1]), ≥ 1 keyframe, ≤ 128; vi phạm KHÔNG chặn load
  (ok:true + warnings có cấu trúc, tối đa 100), tới UI qua toast lúc
  mở file và lúc khôi phục autosave (App.tsx).
- **J6 click-test I2+I3** (`docs/PHASE9_ROUND26_J6_CLICKTEST_LIMITS.md`):
  harness CDP pipe mới, run2 **17/17 PASS** trên browser thật — tách lá
  theo mốc ngoài 1/2/3 tầng ramp (τ chuỗi khớp số tính tay), nút "Lấy
  từ playhead", chặn ngoài miền/sát mép/curve lỗi, DeepIntermediate
  dời vị trí + chặn combinedRange, nút lá sâu ancestorReverse; phiên
  risky 0 exception (fail-soft J1 đã thay throw bằng toast cảnh báo).

## 2. Quyết badge fadewhite/fadegrays — GIỮ nâng, kèm cảnh báo đọc kỹ

J3 đã nâng cả hai vào `TRANSITION_MATCHED` theo chuẩn badge đã có của
dự án (mô hình cặp KHỚP từ I4 + canvas vẽ đúng projection đơn clip,
wiring 40/40 KHỚP — tiền lệ bars-fade cũng matched dù canvas không vẽ
được crossfade thật). **Nhưng "matched" ở đây KHÔNG có nghĩa frame
canvas cùng p KHỚP pair** — gap đơn-clip-vs-cặp vẫn LỆCH lớn, số đo
đầy đủ trong LIMITS J3 §7, trích chính:

- Phẳng p=0,5: fadewhite vào KHỚP 0,33 cả 3 cặp; ra LỆCH 59,00 /
  30,00 / 39,33. fadegrays vào: 0,33 KHỚP / 63,67 LỆCH / 14,00 LỆCH;
  ra: 38,67 / 63,00 / 30,00 LỆCH.
- Footage K→L: fadewhite ra 46,14 LỆCH (cũ 208,86), vào 0,25 KHỚP;
  fadegrays ra 51,13 LỆCH (cũ 74,63), vào 52,17 LỆCH (cũ 32,52 — wired
  thua cũ ở đúng ô này, cả hai đều LỆCH; cơ chế đã giải thích trong
  LIMITS J3, không phải hồi quy mô hình).
- Đường YUV: fadewhite vào gap = đúng số tắt-offset của I4 (14,37 K→L;
  14,58 J→K) vì canvas RGB không mang offset mức.

Nếu user/main chat muốn chuẩn chặt hơn (frame canvas cùng p cũng phải
KHỚP pair cả 2 cửa sổ) thì cả hai phải về approx — revert chỉ là xóa
2 chuỗi khỏi tập matched, không cần đổi code wiring. Parent giữ nâng
của J3 vì đúng chuẩn badge hiện hành và đã ghi gap công khai tại đây.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Bug mới phát hiện, CHƯA sửa (J6 §6, giao luồng riêng):** text clip
   không có `style` làm preview ném exception lúc load, xác định
   5 lần/phiên (stack tới `drawTextClip` đọc `clip.style.animation`
   khi `style` undefined; seed kích hoạt là TEXT-BLOCKED-LEAF của I6).
   UI sau đó vẫn sống, mọi case D đều pass. Fix đúng cần chuẩn hóa
   style mặc định kèm test hồi quy — chưa xác nhận text clip top-level
   không style có ném tương tự không.
2. **Render vẫn fail-fast với curve vi phạm:** preview fail-soft chỉ
   cứu preview; project vi phạm vẫn không export được cho tới khi user
   sửa curve thật (badge/toast đã nói rõ). UI export báo lỗi render rõ
   ràng hay chưa thì chưa kiểm chứng.
3. **Nhánh dip J3 chưa pixel-test trên browser thật** (subagent không có
   live browser): công thức khóa bằng unit test + harness (B), nhưng
   đường dây component (offscreen/getImageData) cần browser-test ở main
   chat trước khi coi là kiểm chứng đầu-cuối. Perf vòng lặp dip
   ~50–90ms/frame (mô phỏng Node) — tối ưu sau nếu preview giật trong
   transition.
4. **Hold frame J4 chưa chứng minh kích hoạt trong app thật:** lần chạy
   app hồi quy decode không đói nên chỉ chứng minh không hồi quy
   (0 tick đen); hold khóa ở tầng unit + đường code. Vẫn đen khi: chưa
   từng có frame tốt; seek ở nhánh pause mà frame chưa sẵn; vài tick
   đầu khi `play()` chưa chạy xong. Phát ngược CHƯA sửa (element giữ
   paused + seek từng frame nên vẫn skip). Frame giữ có thể cũ vô hạn
   nếu đói kéo dài (audio vẫn chạy → lệch cảm nhận A/V).
5. **J5 chưa có panel/list load-report** xem lại warnings có cấu trúc
   sau khi toast 4.5s đóng; load chỉ cảnh báo, không tự sửa/clamp curve.
6. **J6 chưa click-test:** ô nhập mốc rỗng; mốc ngoài miền ở chain ≥ 2
   tầng qua panel (mới khóa ở tầng store); locale en trên panel; key
   `nested.deepNestedEditNote` vẫn còn trong dict nhưng panel không
   dùng (nợ dọn của I3). Hồi quy I6 chạy lại 12/14 cả 2 lần (nhóm deep
   8/9; R2/R3 tối canvas đổi chỗ giữa 2 lần, cùng mean nền — nhiễu
   thoáng qua kiểu I6 §5h, không phải hồi quy hệ thống).
7. **Phạm vi đo:** toàn bộ đo là Chromium headed dưới Xvfb, raster
   mềm, dpr = 1 — cấm trích thành hành vi máy thật/Safari/touch; chưa
   đo 1080p/4K, sweep p trên footage cho dip, nội dung cực đoan, tổ hợp
   dip + motion blur/SR/track/mask.
8. **Nợ cũ vẫn còn:** text clip không style (mục 1); tab ẩn hàng giờ /
   discard thật / máy thật (từ đợt 24); kho dọc vẫn thiếu cảnh quay
   thuần ngoài vũ trụ (I5 đã rà ~380 tiêu đề, không hạ chuẩn).

## 4. File đổi/thêm (đường dẫn tương đối từ repo root)

- `apps/web/scripts/clicktest-split-intermediate-pipe.mjs` (mới, J6)
- `apps/web/src/App.tsx` (sửa, J5)
- `apps/web/src/components/RelinkPanel.tsx` (sửa, J2)
- `apps/web/src/components/transitions/previewStatus.ts` (sửa, J3)
- `apps/web/src/lib/holdFrame.test.ts` (mới, J4)
- `apps/web/src/lib/holdFrame.ts` (mới, J4)
- `apps/web/src/lib/nestedPreview.ts` (sửa, J1)
- `apps/web/src/lib/nestedPreviewFailsoft26J1.test.ts` (mới, J1)
- `apps/web/src/lib/projectRepo.ts` (sửa, J5)
- `apps/web/src/lib/projectRepoRound26J5.test.ts` (mới, J5)
- `apps/web/src/lib/relink.ts` (sửa, J2)
- `apps/web/src/lib/relinkNested.test.ts` (mới, J2)
- `apps/web/src/lib/transitionPreview.test.ts` (sửa, J3)
- `apps/web/src/lib/transitionPreview.ts` (sửa, J3)
- `apps/web/src/preview.tsx` (sửa, J1+J3+J4 — 3 vùng riêng: failsoft
  loop + badge, nhánh dip, guard hold; parent đã đối chiếu cả 3 hunk
  đều có mặt, tsc 0 sau gộp)
- `apps/web/tsconfig.json` (sửa: exclude J1+J2+J4, parent bổ sung J5)
- `benchmarks/results/clicktest-deep-leaf-ramp-r26j6.json` (mới, J6)
- `benchmarks/results/clicktest-split-intermediate-r26j6.json` (mới, J6)
- `benchmarks/results/v26-j3-canvas-dip-flat.json` (mới, J3)
- `benchmarks/results/v26-j3-canvas-dip-foot-jk.json` (mới, J3)
- `benchmarks/results/v26-j3-canvas-dip-foot-kl.json` (mới, J3)
- `docs/PHASE9_ROUND26_J1_PREVIEW_FAILSOFT_LIMITS.md` (mới)
- `docs/PHASE9_ROUND26_J2_NESTED_RELINK_LIMITS.md` (mới)
- `docs/PHASE9_ROUND26_J3_CANVAS_DIP_LIMITS.md` (mới)
- `docs/PHASE9_ROUND26_J4_HOLD_FRAME_LIMITS.md` (mới)
- `docs/PHASE9_ROUND26_J5_LOAD_VALIDATION_LIMITS.md` (mới)
- `docs/PHASE9_ROUND26_J6_CLICKTEST_LIMITS.md` (mới)
- `docs/PHASE9_ROUND26_LIMITS.md` (mới, file này)
- `server/render/src/measure_r26_j3_canvas_dip.js` (mới, J3)

KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG binary, KHÔNG dist vào batch.
