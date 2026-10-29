# Demo nested sequence + adjustment layer (luồng N6, Phase 9) — VIẾT LẠI ĐỢT 6 (R6)

Chứng minh đầu-cuối bằng CODE THẬT: một compound clip 2 cấp được làm
phẳng bằng `flattenSpecForRender` trong `server/render/src/nested.js`
(luồng N2) rồi render thật qua `render.js` (điểm nối N2: flatten trước
validate). Demo này KHÔNG qua UI editor. Adjustment layer trong demo
chỉ còn ở mức minh họa — xem §4 và `docs/NESTED_ROUND6_LIMITS.md`
trước khi claim bất cứ điều gì về adjustment.

## 1. Project mẫu là gì

Timeline chính: một compound clip 2 cấp đặt ở 1→5s, 640×360, 30fps.
Render.js tính tổng thời lượng bằng clip kết thúc muộn nhất nên MP4
dài 5s (không pad đuôi đen 5→6s như bản demo tay đợt 5).

```
timeline 0 ─── 1 ─── 2 ─── 3 ─── 4 ─── 5 (giây)
compound-outer:  [======== 4s ========]
  leaf-a:        [-- 2s --]
  compound-inner:        [--- 2s ---]
    leaf-b1:             [- 1s -]
    leaf-b2:                      [- 1s -]
adjustment adj-1 (MINH HỌA, chưa nối render): [== 3s (2→5) ==]
```

Flatten thật (nested.js) ra 3 clip phẳng — KHÔNG cắt tại biên
adjustment, vì nested.js không biết adjustment:

| Clip phẳng | Timeline | in/out nguồn |
|------------|----------|--------------|
| leaf-a | 1→3s | 0→2 |
| leaf-b1 | 3→4s | 0→1 |
| leaf-b2 | 4→5s | 0→1 |

## 2. Tạo bằng tay từng bước

Spec mẫu sống trong `apps/web/src/sample-nested.ts`
(`NESTED_DEMO_SPEC` dạng compound/leaf + hàm chuyển đổi
`nestedDemoAsNestedSpec()` sang đúng shape N2: track + clip kind
`"nested"` + `subSpec` + `trim`). Hàm chuyển đổi này chỉ viết lại
dữ liệu, KHÔNG tính flatten — flatten do `nested.js` làm.

Các bước tự làm lại từ đầu:

1. **Viết spec N2:** dùng `nestedDemoAsNestedSpec()`, hoặc chép JSON
   tương đương: track ngoài `"v-out"` có 1 nested clip
   `"compound-outer"` (start 1, duration 4, trim `{ in: 0, out: 4 }`),
   subSpec track `"sub-v"` có leaf-a (video, `a.mp4`, 0→2, in 0, out 2)
   và nested clip `"compound-inner"` (start 2, duration 2,
   trim `{ in: 0, out: 2 }`), subSpec của nó track `"inner-v"` có
   leaf-b1 (`b.mp4`, 0→1) và leaf-b2 (`c.mp4`, 1→2).
2. **Flatten thật:** `flattenSpecForRender(spec)` trong
   `server/render/src/nested.js` → phải ra đúng bảng ở mục 1, stats
   2 nested clip / 3 clip phẳng / 2 track mới / 0 warning.
3. **Chạy test web:** `node apps/web/src/lib/nestedDemo.test.ts`
   → kỳ vọng 8 pass, 0 fail. Lưu ý: test web chỉ kiểm tra spec mẫu
   hợp lệ và shape sau chuyển đổi — nó KHÔNG test flatten (flatten
   được test ở bước 4, phía server).
4. **Chạy test đầu-cuối:** `node server/render/src/test_nested_e2e.js`
   → kỳ vọng 28 pass, 0 fail:
   - Phần A: flatten thật như mục 1 + render qua `render.js` ra MP4
     640×360, duration ≈ 5s.
   - Phần B: project con chứa audio (tone sine 440Hz, 1→5s trên
     timeline ngoài) render qua `render.js` ra MP4 có audio AAC;
     đo bằng volumedetect: đoạn 0→0.9s câm (mean −91 dB),
     đoạn 2→4s có tiếng (mean −24,1 dB).
   - Phần C: 9 field chưa hỗ trợ trên nested clip đều throw fail fast.
   MP4 nằm trong thư mục tạm in ra ở đầu log (mặc định
   `/tmp/nested-e2e-*/`), không ghi binary vào repo.
5. **Xem thử bằng mắt (khuyến nghị, chưa tự động):** mở MP4 phần A,
   kiểm tra 1→3s là testsrc, 3→4s xanh dương, 4→5s đỏ. Bước này chưa
   có kiểm tra pixel tự động (xem LIMITS).

## 3. File liên quan

- `apps/web/src/sample-nested.ts` — spec mẫu + hàm chuyển đổi sang
  shape N2 (đợt 6 đã xóa `flattenNestedDemo` tự viết).
- `apps/web/src/lib/nestedDemo.test.ts` — 8 test shape + validate.
- `server/render/src/test_nested_e2e.js` — test đầu-cuối 28 kiểm tra:
  flatten thật + render thật qua render.js + audio lồng nhau + fail fast.
- `server/render/src/nested.js` — flatten thật (luồng N2).
- `docs/NESTED_DEMO_LIMITS.md` — những gì demo này chưa chứng minh.
- `docs/NESTED_ROUND6_LIMITS.md` — bảng LIMITS tổng hợp đợt 6.

## 4. Adjustment trong demo này là gì (đọc kỹ)

`NESTED_DEMO_SPEC.adjustments` (adj-1, 2→5s, `hue=s=0`) chỉ còn là
dữ liệu minh họa trong spec mẫu: nó KHÔNG được đưa vào spec N2
(`nestedDemoAsNestedSpec()` không xuất adjustment), KHÔNG được
flatten, và KHÔNG được render. Lý do: render.js chưa đọc adjustment
và adjustment.js chưa nối vào render.js (xem
`docs/NESTED_ROUND_LIMITS.md` mục 1). Bảng phẳng 4 đoạn có cắt tại
biên adjustment của đợt 5 đã bị bỏ ở đợt 6 vì nó là sản phẩm của
flatten tự viết, không phải của code thật. Đừng dùng demo này để
claim adjustment đã render được.
