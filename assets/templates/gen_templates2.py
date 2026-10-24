#!/usr/bin/env python3
"""
gen_templates2.py — P5 (Phase 7): 20 video template mẫu vòng 2 cho VCut Studio.

Nối tiếp gen_templates.py (10 template vòng 1). Cùng định dạng JSON:
  "template": metadata (id, name, description, category, version, author, license, placeholders)
  "spec": video-spec JSON (SPEC_VERSION 0.2.0) dùng marker {{placeholder_id}}.

Thiết kế gốc 100% — không sao chép layout/preset độc quyền của CapCut.
Chỉ dùng 9 category đã có trong build_templates_ts.py (không thêm category mới).
Ràng buộc validator đã tuân thủ:
  - transitionOut chỉ trên video clip trong cặp kề nhau (không dùng trên clip đơn/image).
  - ImageClip không có transitionOut/filter/effects.
  - Text animation chỉ dùng tên trong TEXT_ANIMATIONS (fadeUp, slideInLeft, ...).
  - Sticker dùng src literal (file PNG do người dùng cung cấp khi render).

License: MIT (tài sản gốc của dự án VCut Studio).
Chạy: python3 assets/templates/gen_templates2.py  (ghi 20 file *.json)
Sau đó: python3 assets/templates/build_templates_ts.py  (regen templates.ts)
"""
import json
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)))
SPEC_VERSION = "0.2.0"

_vid_seq = 0
_txt_seq = 0
_img_seq = 0
_aud_seq = 0
_stk_seq = 0


def _next(prefix):
    global _vid_seq, _txt_seq, _img_seq, _aud_seq, _stk_seq
    if prefix == "v":
        _vid_seq += 1
        return f"v{_vid_seq}"
    if prefix == "t":
        _txt_seq += 1
        return f"t{_txt_seq}"
    if prefix == "i":
        _img_seq += 1
        return f"i{_img_seq}"
    if prefix == "a":
        _aud_seq += 1
        return f"a{_aud_seq}"
    _stk_seq += 1
    return f"s{_stk_seq}"


def reset_seq():
    global _vid_seq, _txt_seq, _img_seq, _aud_seq, _stk_seq
    _vid_seq = _txt_seq = _img_seq = _aud_seq = _stk_seq = 0


def video_clip(src, start, duration, **kw):
    c = {"kind": "video", "id": _next("v"), "src": src, "start": start,
         "duration": duration, "in": kw.pop("in_", 0), "out": kw.pop("out_", duration)}
    c.update(kw)
    return c


def image_clip(src, start, duration, fit="cover", **kw):
    c = {"kind": "image", "id": _next("i"), "src": src,
         "start": start, "duration": duration, "fit": fit}
    c.update(kw)
    return c


def audio_clip(src, start, duration, **kw):
    c = {"kind": "audio", "id": _next("a"), "src": src, "start": start,
         "duration": duration, "in": kw.pop("in_", 0), "out": kw.pop("out_", duration)}
    c.update(kw)
    return c


def text_clip(text, start, duration, style, **kw):
    c = {"kind": "text", "id": _next("t"), "text": text,
         "start": start, "duration": duration, "style": style}
    c.update(kw)
    return c


def sticker_clip(src, start, duration, x=0.5, y=0.5, scale=0.25, **kw):
    c = {"kind": "sticker", "id": _next("s"), "src": src,
         "start": start, "duration": duration, "x": x, "y": y, "scale": scale}
    c.update(kw)
    return c


def style(font_size, color="#ffffff", x=0.5, y=0.5, animation="fadeUp",
          bold=True, background=None, italic=False):
    s = {"fontFamily": "Be Vietnam Pro", "fontSize": font_size, "color": color,
         "x": x, "y": y, "animation": animation, "bold": bold, "italic": italic}
    if background:
        s["backgroundColor"] = background
    return s


def track(tid, kind, label, clips, **kw):
    t = {"id": tid, "kind": kind, "label": label, "clips": clips}
    t.update(kw)
    return t


def ph(pid, kind, label, default):
    return {"id": pid, "kind": kind, "label": label, "default": default}


def make_template(tid, name, description, category, tags, width, height, fps,
                  placeholders, tracks):
    reset_seq()
    spec = {"version": SPEC_VERSION,
            "meta": {"name": name, "width": width, "height": height, "fps": fps},
            "tracks": tracks}
    duration = max((c["start"] + c["duration"] for t in tracks for c in t["clips"]), default=0)
    return {"template": {"id": tid, "name": name, "description": description,
                         "category": category, "version": "1.0.0", "author": "VCut Studio",
                         "license": "MIT", "tags": tags, "aspect": f"{width}:{height}",
                         "durationSec": round(duration, 2), "placeholders": placeholders},
            "spec": spec}


# ---------------------------------------------------------------- 1. wedding-teaser
t1 = make_template(
    "wedding-teaser", "Teaser đám cưới", "Mở đầu video cưới: khoảnh khắc + tên cô dâu chú rể.",
    "cinematic", ["đám cưới", "teaser", "lãng mạn"], 1920, 1080, 30,
    [ph("footage", "video", "Video khoảnh khắc", "wedding-moment.mp4"),
     ph("couple", "text", "Tên cô dâu & chú rể", "Minh & An"),
     ph("date", "text", "Ngày cưới", "12 . 12 . 2026")],
    [track("v1", "video", "Nền", [
        video_clip("{{footage}}", 0, 8, filter={"lut": "vcut-blush-pink"}),
    ]),
     track("t1", "text", "Tên", [
        text_clip("{{couple}}", 1.0, 6.0, style(88, x=0.5, y=0.42, animation="fadeUp")),
     ]),
     track("t2", "text", "Ngày", [
        text_clip("{{date}}", 2.0, 5.0, style(40, color="#FBCFE8", x=0.5, y=0.58, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 2. food-reel
t2 = make_template(
    "food-reel", "Reel món ăn", "Video dọc review món: 3 cảnh cắt nhanh + hook + tên món.",
    "social", ["food", "reel", "dọc", "review"], 1080, 1920, 30,
    [ph("clip1", "video", "Cảnh 1 (mở đầu)", "food-1.mp4"),
     ph("clip2", "video", "Cảnh 2", "food-2.mp4"),
     ph("clip3", "video", "Cảnh 3 (chốt)", "food-3.mp4"),
     ph("hook", "text", "Câu hook", "MÓN NÀY NGON BẤT NGỜ!"),
     ph("dish", "text", "Tên món", "Bánh mì chảo")],
    [track("v1", "video", "Món ăn", [
        video_clip("{{clip1}}", 0, 4, transitionOut={"type": "dissolve", "duration": 0.4}),
        video_clip("{{clip2}}", 4, 4, transitionOut={"type": "dissolve", "duration": 0.4}),
        video_clip("{{clip3}}", 8, 4),
    ]),
     track("t1", "text", "Hook", [
        text_clip("{{hook}}", 0.5, 3.5, style(64, x=0.5, y=0.12, animation="popIn", background="#000000")),
     ]),
     track("t2", "text", "Tên món", [
        text_clip("{{dish}}", 8.5, 3.0, style(56, color="#FDE68A", x=0.5, y=0.85, animation="slideUp")),
     ])],
)

# ---------------------------------------------------------------- 3. gaming-highlight
t3 = make_template(
    "gaming-highlight", "Highlight game", "Video dọc highlight: 2 pha xử lý + tỉ số nổi bật.",
    "social", ["game", "highlight", "dọc"], 1080, 1920, 30,
    [ph("clip1", "video", "Pha 1", "game-1.mp4"),
     ph("clip2", "video", "Pha 2 (cao trào)", "game-2.mp4"),
     ph("score", "text", "Tỉ số / kết quả", "PENTAKILL!")],
    [track("v1", "video", "Gameplay", [
        video_clip("{{clip1}}", 0, 5, filter={"lut": "vcut-neon-nights"},
                   transitionOut={"type": "fade", "duration": 0.3}),
        video_clip("{{clip2}}", 5, 5, filter={"lut": "vcut-neon-nights"}),
    ]),
     track("t1", "text", "Tỉ số", [
        text_clip("{{score}}", 5.5, 4.0, style(72, color="#FACC15", x=0.5, y=0.15, animation="bounce")),
     ])],
)

# ---------------------------------------------------------------- 4. breaking-news
t4 = make_template(
    "breaking-news", "Tin nóng", "Khung tin truyền hình: video nền + headline + dòng chạy.",
    "broadcast", ["tin tức", "breaking", "truyền hình"], 1920, 1080, 30,
    [ph("footage", "video", "Video hiện trường", "news-footage.mp4"),
     ph("headline", "text", "Tiêu đề tin", "TIN NÓNG: SỰ KIỆN VỪA XẢY RA"),
     ph("ticker", "text", "Dòng chạy dưới", "Cập nhật liên tục — theo dõi kênh để nhận tin mới nhất")],
    [track("v1", "video", "Hiện trường", [
        video_clip("{{footage}}", 0, 6),
    ]),
     track("t1", "text", "Headline", [
        text_clip("{{headline}}", 0.5, 5.0, style(58, x=0.5, y=0.12, animation="slideInLeft", background="#DC2626")),
     ]),
     track("t2", "text", "Dòng chạy", [
        text_clip("{{ticker}}", 0.5, 5.0, style(30, color="#FDE68A", x=0.5, y=0.92, animation="slideInRight")),
     ])],
)

# ---------------------------------------------------------------- 5. quote-card
t5 = make_template(
    "quote-card", "Thẻ trích dẫn", "Ảnh vuông trích dẫn: câu nói + tên tác giả.",
    "cinematic", ["quote", "trích dẫn", "vuông"], 1080, 1080, 30,
    [ph("bg", "image", "Ảnh nền", "quote-bg.jpg"),
     ph("quote", "text", "Câu trích dẫn", "“Hãy làm điều bạn sợ nhất.”"),
     ph("author", "text", "Tác giả", "— Người truyền cảm hứng")],
    [track("i1", "image", "Nền", [
        image_clip("{{bg}}", 0, 6, fit="cover"),
    ]),
     track("t1", "text", "Trích dẫn", [
        text_clip("{{quote}}", 0.5, 5.0, style(64, x=0.5, y=0.42, animation="fadeUp", italic=True)),
     ]),
     track("t2", "text", "Tác giả", [
        text_clip("{{author}}", 1.5, 4.0, style(36, color="#E9D5FF", x=0.5, y=0.62, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 6. tutorial-vertical
t6 = make_template(
    "tutorial-vertical", "Hướng dẫn dọc", "Video dọc 3 bước: mỗi bước 1 cảnh + chữ bước.",
    "social", ["tutorial", "hướng dẫn", "dọc", "how-to"], 1080, 1920, 30,
    [ph("step1", "video", "Bước 1", "step-1.mp4"),
     ph("step2", "video", "Bước 2", "step-2.mp4"),
     ph("step3", "video", "Bước 3", "step-3.mp4"),
     ph("label1", "text", "Nhãn bước 1", "Bước 1: Chuẩn bị"),
     ph("label2", "text", "Nhãn bước 2", "Bước 2: Thực hiện"),
     ph("label3", "text", "Nhãn bước 3", "Bước 3: Hoàn thành")],
    [track("v1", "video", "Các bước", [
        video_clip("{{step1}}", 0, 4, transitionOut={"type": "slideleft", "duration": 0.4}),
        video_clip("{{step2}}", 4, 4, transitionOut={"type": "slideleft", "duration": 0.4}),
        video_clip("{{step3}}", 8, 4),
    ]),
     track("t1", "text", "Nhãn bước", [
        text_clip("{{label1}}", 0.5, 3.0, style(52, x=0.5, y=0.88, animation="fadeUp", background="#000000")),
        text_clip("{{label2}}", 4.5, 3.0, style(52, x=0.5, y=0.88, animation="fadeUp", background="#000000")),
        text_clip("{{label3}}", 8.5, 3.0, style(52, x=0.5, y=0.88, animation="fadeUp", background="#000000")),
     ])],
)

# ---------------------------------------------------------------- 7. unboxing
t7 = make_template(
    "unboxing", "Mở hộp sản phẩm", "Video vuông unbox: cảnh mở hộp + tên + giá.",
    "ads", ["unboxing", "mở hộp", "sản phẩm", "vuông"], 1080, 1080, 30,
    [ph("footage", "video", "Video mở hộp", "unbox.mp4"),
     ph("product", "text", "Tên sản phẩm", "Tai nghe Aurora X"),
     ph("price", "text", "Giá", "1.290.000đ")],
    [track("v1", "video", "Mở hộp", [
        video_clip("{{footage}}", 0, 10, filter={"lut": "vcut-skin-glow"}),
    ]),
     track("t1", "text", "Tên sản phẩm", [
        text_clip("{{product}}", 1.0, 8.0, style(60, x=0.5, y=0.10, animation="slideInDown")),
     ]),
     track("t2", "text", "Giá", [
        text_clip("{{price}}", 7.0, 2.5, style(72, color="#FACC15", x=0.5, y=0.85, animation="popIn")),
     ])],
)

# ---------------------------------------------------------------- 8. fitness-promo
t8 = make_template(
    "fitness-promo", "Quảng cáo gym", "Video ngang tập luyện: khẩu hiệu + kêu gọi đăng ký.",
    "ads", ["fitness", "gym", "quảng cáo"], 1920, 1080, 30,
    [ph("footage", "video", "Video tập luyện", "workout.mp4"),
     ph("slogan", "text", "Khẩu hiệu", "KHÔNG CÓ GIỚI HẠN"),
     ph("cta", "text", "Kêu gọi", "Đăng ký hôm nay — buổi đầu miễn phí")],
    [track("v1", "video", "Tập luyện", [
        video_clip("{{footage}}", 0, 8, filter={"lut": "vcut-stadium-night"}),
    ]),
     track("t1", "text", "Khẩu hiệu", [
        text_clip("{{slogan}}", 0.5, 7.0, style(84, x=0.5, y=0.38, animation="fadeUp")),
     ]),
     track("t2", "text", "Kêu gọi", [
        text_clip("{{cta}}", 1.5, 6.0, style(40, color="#FDE68A", x=0.5, y=0.58, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 9. lofi-visual
t9 = make_template(
    "lofi-visual", "Nhạc lofi thư giãn", "Ảnh nền tĩnh + tên bài + nhạc nền (audio placeholder).",
    "music", ["lofi", "nhạc", "thư giãn"], 1920, 1080, 30,
    [ph("bg", "image", "Ảnh nền", "lofi-bg.jpg"),
     ph("track", "audio", "File nhạc", "lofi-track.mp3"),
     ph("song", "text", "Tên bài", "Đêm mưa lofi"),
     ph("artist", "text", "Nghệ sĩ", "by Lofi Vietnam")],
    [track("i1", "image", "Nền", [
        image_clip("{{bg}}", 0, 12, fit="cover"),
    ]),
     track("a1", "audio", "Nhạc", [
        audio_clip("{{track}}", 0, 12),
    ]),
     track("t1", "text", "Tên bài", [
        text_clip("{{song}}", 0.5, 11.0, style(64, x=0.5, y=0.42, animation="fadeIn")),
     ]),
     track("t2", "text", "Nghệ sĩ", [
        text_clip("{{artist}}", 1.5, 10.0, style(36, color="#E9D5FF", x=0.5, y=0.56, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 10. album-teaser
t10 = make_template(
    "album-teaser", "Teaser album", "Ảnh bìa vuông + tên album + ngày phát hành.",
    "music", ["album", "teaser", "âm nhạc", "vuông"], 1080, 1080, 30,
    [ph("cover", "image", "Ảnh bìa", "album-cover.jpg"),
     ph("album", "text", "Tên album", "MÙA HÈ KHÔNG TÊN"),
     ph("release", "text", "Ngày phát hành", "Ra mắt 01.06.2027")],
    [track("i1", "image", "Bìa", [
        image_clip("{{cover}}", 0, 8, fit="cover"),
    ]),
     track("t1", "text", "Tên album", [
        text_clip("{{album}}", 0.5, 7.0, style(60, x=0.5, y=0.80, animation="fadeUp", background="#000000")),
     ]),
     track("t2", "text", "Ngày phát hành", [
        text_clip("{{release}}", 1.5, 6.0, style(36, color="#FDE68A", x=0.5, y=0.90, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 11. interview-cut
t11 = make_template(
    "interview-cut", "Cắt phỏng vấn", "Video ngang 2 góc máy xen kẽ + tên người nói.",
    "podcast", ["phỏng vấn", "interview", "talkshow"], 1920, 1080, 30,
    [ph("host", "video", "Góc máy host", "host.mp4"),
     ph("guest", "video", "Góc máy khách", "guest.mp4"),
     ph("name1", "text", "Tên host", "MC Thanh Huyền"),
     ph("name2", "text", "Tên khách", "Khách mời: Đạo diễn Lâm")],
    [track("v1", "video", "Góc máy", [
        video_clip("{{host}}", 0, 6, transitionOut={"type": "fade", "duration": 0.4}),
        video_clip("{{guest}}", 6, 6),
    ]),
     track("t1", "text", "Tên người nói", [
        text_clip("{{name1}}", 0.5, 5.0, style(40, x=0.5, y=0.88, animation="slideInLeft", background="#000000")),
        text_clip("{{name2}}", 6.5, 5.0, style(40, x=0.5, y=0.88, animation="slideInLeft", background="#000000")),
     ])],
)

# ---------------------------------------------------------------- 12. audiobook-promo
t12 = make_template(
    "audiobook-promo", "Quảng cáo sách nói", "Ảnh bìa vuông + tên sách + giọng đọc.",
    "podcast", ["audiobook", "sách nói", "vuông"], 1080, 1080, 30,
    [ph("cover", "image", "Ảnh bìa sách", "book-cover.jpg"),
     ph("book", "text", "Tên sách", "Đắc Nhân Tâm — Bản sách nói"),
     ph("narrator", "text", "Giọng đọc", "Giọng đọc: Minh Đức")],
    [track("i1", "image", "Bìa", [
        image_clip("{{cover}}", 0, 8, fit="cover"),
    ]),
     track("t1", "text", "Tên sách", [
        text_clip("{{book}}", 0.5, 7.0, style(52, x=0.5, y=0.78, animation="fadeUp", background="#000000")),
     ]),
     track("t2", "text", "Giọng đọc", [
        text_clip("{{narrator}}", 1.5, 6.0, style(34, color="#E9D5FF", x=0.5, y=0.88, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 13. event-invite
t13 = make_template(
    "event-invite", "Thiệp mời sự kiện", "Video dọc mời tham dự: ảnh + tên + ngày/địa điểm.",
    "social", ["sự kiện", "thiệp mời", "dọc"], 1080, 1920, 30,
    [ph("bg", "image", "Ảnh sự kiện", "event-bg.jpg"),
     ph("event", "text", "Tên sự kiện", "ĐÊM NHẠC MÙA THU"),
     ph("when", "text", "Thời gian & địa điểm", "20h — 15.11.2026 | Nhà hát Lớn HN")],
    [track("i1", "image", "Nền", [
        image_clip("{{bg}}", 0, 8, fit="cover"),
    ]),
     track("t1", "text", "Tên sự kiện", [
        text_clip("{{event}}", 0.5, 7.0, style(64, x=0.5, y=0.30, animation="fadeUp")),
     ]),
     track("t2", "text", "Thời gian", [
        text_clip("{{when}}", 1.5, 6.0, style(36, color="#FDE68A", x=0.5, y=0.45, animation="fadeIn")),
     ]),
     track("s1", "sticker", "Trang trí", [
        sticker_clip("sparkle.png", 2.0, 5.0, x=0.85, y=0.15, scale=0.12),
     ])],
)

# ---------------------------------------------------------------- 14. real-estate-tour
t14 = make_template(
    "real-estate-tour", "Tour bất động sản", "Video ngang 3 không gian + địa chỉ + giá.",
    "ads", ["bất động sản", "nhà đất", "tour"], 1920, 1080, 30,
    [ph("room1", "video", "Phòng khách", "living.mp4"),
     ph("room2", "video", "Phòng ngủ", "bedroom.mp4"),
     ph("room3", "video", "Bếp & sân", "kitchen.mp4"),
     ph("address", "text", "Địa chỉ", "Căn hộ Skyline — Quận 2, TP.HCM"),
     ph("price", "text", "Giá", "4.8 tỷ — Liên hệ 0900 xxx xxx")],
    [track("v1", "video", "Không gian", [
        video_clip("{{room1}}", 0, 4, transitionOut={"type": "wipeleft", "duration": 0.5}),
        video_clip("{{room2}}", 4, 4, transitionOut={"type": "wipeleft", "duration": 0.5}),
        video_clip("{{room3}}", 8, 4),
    ]),
     track("t1", "text", "Địa chỉ", [
        text_clip("{{address}}", 0.5, 11.0, style(44, x=0.5, y=0.08, animation="slideInDown", background="#000000")),
     ]),
     track("t2", "text", "Giá", [
        text_clip("{{price}}", 8.5, 3.0, style(48, color="#FACC15", x=0.5, y=0.88, animation="popIn")),
     ])],
)

# ---------------------------------------------------------------- 15. recipe-card
t15 = make_template(
    "recipe-card", "Công thức nấu ăn", "Video dọc nấu ăn: cảnh nấu + tên món + nguyên liệu.",
    "social", ["nấu ăn", "recipe", "dọc", "food"], 1080, 1920, 30,
    [ph("footage", "video", "Video nấu ăn", "cooking.mp4"),
     ph("dish", "text", "Tên món", "Cơm tấm sườn nướng"),
     ph("ingredients", "text", "Nguyên liệu chính", "Sườn • Trứng • Đồ chua • Cơm tấm")],
    [track("v1", "video", "Nấu ăn", [
        video_clip("{{footage}}", 0, 12, filter={"lut": "vcut-honey-glow"}),
    ]),
     track("t1", "text", "Tên món", [
        text_clip("{{dish}}", 0.5, 11.0, style(60, x=0.5, y=0.10, animation="slideInDown")),
     ]),
     track("t2", "text", "Nguyên liệu", [
        text_clip("{{ingredients}}", 1.5, 10.0, style(36, color="#FDE68A", x=0.5, y=0.90, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 16. travel-diary
t16 = make_template(
    "travel-diary", "Nhật ký du lịch", "Slideshow ngang 4 ảnh + chú thích từng điểm đến.",
    "slideshow", ["du lịch", "slideshow", "kỷ niệm"], 1920, 1080, 30,
    [ph("photo1", "image", "Ảnh 1", "trip-1.jpg"),
     ph("photo2", "image", "Ảnh 2", "trip-2.jpg"),
     ph("photo3", "image", "Ảnh 3", "trip-3.jpg"),
     ph("photo4", "image", "Ảnh 4", "trip-4.jpg"),
     ph("cap1", "text", "Chú thích 1", "Hà Giang — đèo Mã Pí Lèng"),
     ph("cap2", "text", "Chú thích 2", "Hội An — phố đèn lồng")],
    [track("i1", "image", "Ảnh", [
        image_clip("{{photo1}}", 0, 3),
        image_clip("{{photo2}}", 3, 3),
        image_clip("{{photo3}}", 6, 3),
        image_clip("{{photo4}}", 9, 3),
    ]),
     track("t1", "text", "Chú thích", [
        text_clip("{{cap1}}", 0.5, 5.0, style(44, x=0.5, y=0.88, animation="fadeUp", background="#000000")),
        text_clip("{{cap2}}", 6.5, 5.0, style(44, x=0.5, y=0.88, animation="fadeUp", background="#000000")),
     ])],
)

# ---------------------------------------------------------------- 17. birthday-card
t17 = make_template(
    "birthday-card", "Thiệp sinh nhật", "Ảnh vuông sinh nhật: tên + lời chúc + sticker.",
    "social", ["sinh nhật", "thiệp", "vuông"], 1080, 1080, 30,
    [ph("bg", "image", "Ảnh nền", "birthday-bg.jpg"),
     ph("name", "text", "Tên người nhận", "Chúc mừng sinh nhật Linh!"),
     ph("wish", "text", "Lời chúc", "Tuổi mới nhiều niềm vui và thành công nhé!")],
    [track("i1", "image", "Nền", [
        image_clip("{{bg}}", 0, 6, fit="cover"),
    ]),
     track("t1", "text", "Tên", [
        text_clip("{{name}}", 0.5, 5.0, style(64, x=0.5, y=0.35, animation="bounce")),
     ]),
     track("t2", "text", "Lời chúc", [
        text_clip("{{wish}}", 1.5, 4.0, style(36, color="#FDE68A", x=0.5, y=0.52, animation="fadeIn")),
     ]),
     track("s1", "sticker", "Trang trí", [
        sticker_clip("heart.png", 1.0, 4.5, x=0.5, y=0.22, scale=0.15),
     ])],
)

# ---------------------------------------------------------------- 18. sale-banner
t18 = make_template(
    "sale-banner", "Banner giảm giá", "Video ngang sale: nền + chữ giảm giá lớn + điều kiện.",
    "ads", ["sale", "giảm giá", "banner"], 1920, 1080, 30,
    [ph("footage", "video", "Video nền", "sale-bg.mp4"),
     ph("sale", "text", "Mức giảm", "SALE 50%"),
     ph("terms", "text", "Điều kiện", "Áp dụng đến hết 31.10 — toàn bộ cửa hàng")],
    [track("v1", "video", "Nền", [
        video_clip("{{footage}}", 0, 6, filter={"lut": "vcut-chili-ember"}),
    ]),
     track("t1", "text", "Mức giảm", [
        text_clip("{{sale}}", 0.5, 5.0, style(110, color="#FACC15", x=0.5, y=0.38, animation="popIn")),
     ]),
     track("t2", "text", "Điều kiện", [
        text_clip("{{terms}}", 1.5, 4.0, style(36, x=0.5, y=0.62, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 19. documentary-title
t19 = make_template(
    "documentary-title", "Tiêu đề phim tài liệu", "Mở đầu tài liệu: cảnh quay + tên phim + số tập.",
    "cinematic", ["tài liệu", "documentary", "mở đầu"], 1920, 1080, 30,
    [ph("footage", "video", "Cảnh quay", "doc-footage.mp4"),
     ph("title", "text", "Tên phim", "DÒNG SÔNG KỂ CHUYỆN"),
     ph("episode", "text", "Số tập", "Tập 1 — Thượng nguồn")],
    [track("v1", "video", "Cảnh quay", [
        video_clip("{{footage}}", 0, 6, filter={"lut": "vcut-monsoon-rain"}),
    ]),
     track("t1", "text", "Tên phim", [
        text_clip("{{title}}", 1.0, 4.5, style(72, x=0.5, y=0.42, animation="fadeUp")),
     ]),
     track("t2", "text", "Số tập", [
        text_clip("{{episode}}", 2.0, 3.5, style(38, color="#E9D5FF", x=0.5, y=0.58, animation="fadeIn")),
     ])],
)

# ---------------------------------------------------------------- 20. outro-creator
t20 = make_template(
    "outro-creator", "Kết video creator", "Kết video: cảm ơn + đăng ký + tên kênh.",
    "outro", ["outro", "creator", "subscribe"], 1920, 1080, 30,
    [ph("footage", "video", "Video nền", "outro-bg.mp4"),
     ph("thanks", "text", "Lời cảm ơn", "Cảm ơn bạn đã xem đến cuối!"),
     ph("channel", "text", "Tên kênh", "@KenhCuaBan"),
     ph("subscribe", "text", "Kêu gọi đăng ký", "Nhấn Đăng ký + chuông để không bỏ lỡ video mới")],
    [track("v1", "video", "Nền", [
        video_clip("{{footage}}", 0, 8, filter={"lut": "vcut-warm-bloom"}),
    ]),
     track("t1", "text", "Cảm ơn", [
        text_clip("{{thanks}}", 0.5, 7.0, style(64, x=0.5, y=0.30, animation="fadeUp")),
     ]),
     track("t2", "text", "Tên kênh", [
        text_clip("{{channel}}", 1.5, 6.0, style(52, color="#22D3EE", x=0.5, y=0.48, animation="slideInRight")),
     ]),
     track("t3", "text", "Đăng ký", [
        text_clip("{{subscribe}}", 2.5, 5.0, style(36, x=0.5, y=0.64, animation="fadeIn")),
     ]),
     track("s1", "sticker", "Huy hiệu", [
        sticker_clip("badge.png", 2.5, 5.0, x=0.85, y=0.2, scale=0.12),
     ])],
)

TEMPLATES = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10,
             t11, t12, t13, t14, t15, t16, t17, t18, t19, t20]

for t in TEMPLATES:
    tid = t["template"]["id"]
    path = os.path.join(OUT, f"{tid}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(t, f, ensure_ascii=False, indent=2)
    print(f"wrote {tid}.json ({t['template']['durationSec']}s, {len(t['template']['placeholders'])} placeholders)")
