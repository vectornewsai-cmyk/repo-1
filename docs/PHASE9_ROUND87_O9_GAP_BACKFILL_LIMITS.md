# LIMITS — Phase 9 đợt 87, luồng O9: backfill gap analysis §14/§15 + cập nhật trạng thái E5/A1/E1/E3

Ngày: 11/11/2026 (lượt cron 12:35 +07). Luồng docs-only: chỉ sửa
`PHASE9_GAP_ANALYSIS.md` + file này + log luồng. KHÔNG push, KHÔNG
release/tag, KHÔNG binary, KHÔNG đụng TTS 39, KHÔNG đụng file workflow.

## 0. Việc đã làm

1. **Viết `## 14. Cập nhật sau đợt 85` và `## 15. Cập nhật sau đợt 86`**
   vào cuối `PHASE9_GAP_ANALYSIS.md`, theo đúng định dạng các mục
   §6–§13 (gạch đầu dòng, in đậm kết quả, ghi tổng chờ push + dict key,
   ghi "Nợ mở cho đợt sau: xem ...").
2. **Cập nhật trạng thái trong gap §2** (xem §1): các hàng A1, E1, E2,
   E3, E5, P2, P5 — thêm "ĐÃ ĐÓNG (đợt ...)" + giữ lại phần nợ còn lại.
   KHÔNG viết lại toàn bộ file, KHÔNG đổi kết luận §5. Thêm 2 sửa nhất
   quán ở §0 (Motion tracking, Proxy workflow — cùng sự kiện với E5/P5).
3. **Đính chính trong §15:** số tổng worker báo 1765 là SAI, đúng là
   1805 (parent đếm lại); đợt 85 +4 entry muộn.

## 1. Hàng gap đã sửa (nguồn kiểm chứng từng hàng)

| Hàng | Sửa | Nguồn kiểm chứng |
|---|---|---|
| A1 | ĐÃ XONG: ASS karaoke `\k` render + highlight từng từ preview + style template karaoke có tên + xuất/nhập SRT-VTT | `server/render/src/render.js:484-488` (`\k`); `apps/web/src/lib/captions.ts` (`karaokeActiveWordIndex`, `caption.karaokeStyle*`, chú thích "Đợt 74 B9"); `apps/web/src/lib/subtitles.ts` (header "Phase 9 R4"); kiểm chứng headed đợt 59 P5 7/7 vi+en (theo §0.2 của gap file) |
| E1 | ĐÃ ĐÓNG (Phase 9 R2): pre-render PNG + movie+blend, không còn `geq` từng pixel | `server/render/src/render.js` (`buildMaskPngChain`, `maskPng` map, render.js:1648-1678); `packages/video-spec/src/mask.ts` header: "dùng chung đường movie+blend nhanh của R2, KHÔNG dùng geq chậm" |
| E2 | LUT ĐÃ XONG, còn transition/effect | `apps/web/src/lib/webglLut.ts` (lưới 3D + trilinear 8 tap); test 7/7 từ đợt 58 O7 (theo §0 của gap file) |
| E3 | Preview ĐÃ ÁP enhance (đợt 60–77) | `apps/web/src/lib/enhancePreview.ts` (`enhancePreviewPlan`); `apps/web/src/preview.tsx:171,1839` import + dùng plan; test `enhancePreview60Q1`…`enhancePreview77E1` có trên đĩa |
| E5 | Text/video ĐÃ BÁM track (Phase 9 D3); chỉ còn mask chưa bám | `packages/video-spec/src/index.ts:155,163,289,295` (field `clip.track` cho text + video); `apps/web/src/components/sticker/TrackPanel.tsx:16,41` ("text và video cũng gắn được quỹ đạo", "mask bám track vẫn chưa làm") |
| P2 | ĐÃ ĐÓNG (Phase 9 R2, xem E1) | Như E1 |
| P5 | ĐÃ TỰ ĐỘNG (cơ bản từ R3, đóng nốt đợt 84 L9) | `apps/web/src/lib/proxy.ts` (`autoProxySkipReason`, `AUTO_PROXY_HEIGHT_KEY`); đợt 84 L9 + đợt 86 N9 click-test 24/24 (theo `docs/PHASE9_ROUND86_LIMITS.md` §0 + build-loop-log mục N9) |
| §0 Motion tracking | Text/video ĐÃ bám track từ D3; mask chưa bám (đợt 87 đang làm) | Như E5 — sửa nhất quán thêm, ngoài danh sách task gốc |
| §0 Proxy workflow | Nay TỰ ĐỘNG khi import >720p | Như P5 — sửa nhất quán thêm, ngoài danh sách task gốc |

## 2. Nguồn từng số trong §14/§15

- §14: `docs/PHASE9_ROUND85_LIMITS.md` (gộp, §0/§3/§4) + các mục
  gộp đợt 85 trong build-loop-log (M1–M10, M4 bổ sung sau closing).
- §15: `docs/PHASE9_ROUND86_LIMITS.md` (gộp, §0/§3/§4) + các mục
  gộp đợt 86 trong build-loop-log (N1–N10, GỘP PARENT).
- Tổng chờ push: sau đợt 85 = **1220/190/768** (ROUND85_LIMITS §3,
  đã gồm +4 muộn M4); sau đợt 86 = **1805/201/1107**
  (ROUND86_LIMITS §3 + build-loop-log mục GỘP PARENT đợt 86).
- Dict: **2507 key** sau đợt 85 (M7 +11, M8 +7), không đổi qua đợt 86
  (ROUND85_LIMITS header, ROUND86_LIMITS header + §1.3).
- HEAD GitHub vẫn `5f548ef8` (theo hồ sơ; bản local không có `.git`
  nên không verify bằng git tại chỗ).

## 3. Chỗ không rõ trong nguồn (ghi rõ, không bịa)

1. **Số fps mask đo lại sau R2: KHÔNG RÕ trong nguồn.** Code chứng
   minh đường nhanh đã thay geq (E1), nhưng không file LIMITS/log nào
   O9 đọc được ghi số fps mask mới. Hàng E1/P2 ghi rõ "không rõ trong
   nguồn" thay vì giữ số 0,97 fps cũ như số hiện tại.
2. **Số tổng sau đợt 84 trong §13 của gap file (1033/178/680) lệch
   với số parent chốt ở closing đợt 84 (1053/179/681).** Gap §13 do
   worker viết trước closing; parent đã sửa số tổng trong log (mục
   GỘP PARENT đợt 84, phần 2) nhưng file gap trên đĩa vẫn giữ số cũ.
   O9 KHÔNG sửa §13 (ngoài phạm vi task, thuộc về parent closing);
   §14/§15 dùng số parent đã chốt (1220 sau đợt 85, 1805 sau đợt 86)
   và ghi chú lệch này tại đây để parent quyết.
3. **Mâu thuẫn nội bộ trong `docs/PHASE9_ROUND86_LIMITS.md`:** §1.1
   ghi "sau closing = 1800 entry" và §1.4 ghi "1804 đúng" — cả hai
   đều dùng base 1216 (chưa tính +4 muộn của M4 đợt 85). Số cuối đúng
   theo §3 của chính file đó + build-loop-log là **1805**. O9 dùng
   1805 và ghi chú tại đây; không sửa file LIMITS gộp đợt 86 (thuộc
   về parent).
4. **Cosine voice cloning M7 có 2 số, đừng lẫn:** ref × clone =
   0,7618 (độ giống giọng mẫu); clone vs preset Hải Đăng = 0,4570
   (chứng minh không sụp về preset). Cả hai đều có trong log M7
   (`build-loop-log.md` mục Đợt 85 M7).
5. **Dict lúc M7 đo (2489 → 2500) khác dict closing (2507)** vì các
   luồng khác đang sửa cùng dict; closing recount 2507 là số chốt
   (ROUND85_LIMITS §1.3). §14 ghi cả hai mốc để khỏi lẫn.

## 4. Nợ mở / việc cho parent

1. §13 gap file giữ số tổng đợt 84 cũ (1033/178/680) — parent quyết
   có sửa thành 1053/179/681 không (xem §3.2).
2. `docs/PHASE9_ROUND86_LIMITS.md` §1.1/§1.4 ghi 1800/1804 — parent
   quyết có sửa thành 1805 cho khớp §3 không (xem §3.3).
3. Đo lại fps mask thật sau R2 để thay số 0,97 fps cũ ở hàng E1/P2
   (xem §3.1).
4. Mask bám track (E5) đang làm ở đợt 87 — khi xong, cập nhật hàng E5
   + §0 Motion tracking.
5. KHÔNG viết LIMITS gộp đợt 87 (việc parent closing).

## 5. Kiểm chứng

- Đọc lại `PHASE9_GAP_ANALYSIS.md` sau sửa: §14 + §15 có mặt, các
  hàng A1/E1/E2/E3/E5/P2/P5 + 2 hàng §0 đã đổi, kết luận §5 không đổi.
- Không chạy tsc/vite build (chỉ sửa file .md, không đụng code).
- Batch stage: `phase9-round87-o9-gap-backfill.txt` — xem log luồng
  `hidden_files/round87-o9.md`.
