# Repo-1 — Trình dựng video trên web (tầm nhìn: đẳng cấp CapCut)

> ⚠️ **Tên thương mại chính thức CHƯA chốt.** Tên cuối cùng sẽ là tên gốc 100% — tuyệt đối không dùng "CapCut" hay bất kỳ trademark nào của ByteDance.

## Tầm nhìn

Xây dựng một trình dựng video chạy trên nền web đạt chuẩn CapCut — timeline đa track, hiệu ứng, text animation, xuất video chất lượng cao — với hai điểm **mạnh hơn cả CapCut gốc**:

1. **AI chạy local**: auto-caption, xoá nền, text-to-speech... tự phát triển, chạy trên máy người dùng, không phụ thuộc cloud.
2. **Lớp tích hợp cho AI agent** (MCP server + REST API + CLI + định dạng "video spec"): để Claude Code, Codex và các AI agent khác điều khiển trình dựng này bằng code, tạo video một cách lập trình.

## Nguyên tắc bất di bất dịch

1. **Trung thực**: không code giả, không stub giả vờ chạy được. Tính năng nào chưa làm thì ghi rõ `TODO`, không bao giờ fake demo.
2. **Gốc 100%**: không copy code, asset hay thiết kế đặc trưng của CapCut/ByteDance. Học hỏi UX rồi viết lại sạch từ đầu.
3. **Giấy phép sạch**: chỉ dùng tài nguyên ngoài có giấy phép MIT / Apache-2.0 / CC0. Mọi tài nguyên đều ghi nguồn đầy đủ trong `assets/SOURCES.md`.
4. **Chất lượng > tốc độ**: mỗi phase phải chạy được thật, kiểm chứng được, mới sang phase tiếp theo.
5. **Giao diện phải đẹp**: dark theme hiện đại, tiếng Việt, UX mượt — không chấp nhận giao diện xấu.

## Trạng thái hiện tại

**Phase 0 — Khởi tạo** (đang thực hiện). Chi tiết từng phase xem `docs/ROADMAP.md`.

## Cấu trúc repo

```
repo-1/
├── apps/web/              # Trình editor: React + TypeScript + Vite (Phase 1)
├── packages/video-spec/   # Định dạng "video spec" JSON + TypeScript types (dùng chung)
├── server/render/         # Render worker: video-spec → MP4 bằng FFmpeg (Phase 1)
├── mcp-server/            # MCP server cho AI agent (Phase 4)
├── assets/                # Kho tài nguyên: transition/effect/filter — chỉ MIT/Apache/CC0 + attribution
├── docs/                  # Tài liệu: kiến trúc, roadmap, ghi chú nghiên cứu
└── README.md / ARCHITECTURE.md / LICENSE
```

## Chạy thử (khi Phase 1 hoàn thành)

```bash
# Editor web
cd apps/web && npm install && npm run dev

# Render từ video-spec
cd server/render && npm install
node src/render.js --spec ../examples/demo.json --out ./demo.mp4
```

## Giấy phép

MIT — xem `LICENSE`. Mọi đóng góp đều là code gốc của dự án.
