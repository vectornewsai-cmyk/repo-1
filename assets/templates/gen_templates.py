#!/usr/bin/env python3
"""
gen_templates.py — Sinh 10 video template mẫu cho VCut Studio (R1-104/R1-105).

Mỗi template = JSON gồm:
  "template": metadata (id, name, description, category, version, author, license, placeholders)
  "spec": video-spec JSON (SPEC_VERSION 0.2.0) dùng marker {{placeholder_id}} trong
          mọi field chuỗi (src của clip, text của text clip).

Thiết kế gốc 100% — không sao chép layout/preset độc quyền của CapCut.
License: MIT (tài sản gốc của dự án VCut Studio).
"""
import json
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)))

SPEC_VERSION = "0.2.0"

BRAND = {
    "primary": "#7C3AED",
    "accent": "#22D3EE",
    "ink": "#0F0F14",
    "paper": "#F5F3FF",
}

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
    c = {
        "kind": "video", "id": _next("v"),
        "src": src, "start": start, "duration": duration,
        "in": kw.pop("in_", 0), "out": kw.pop("out_", duration),
    }
    c.update(kw)
    return c


def image_clip(src, start, duration, fit="cover", **kw):
    c = {"kind": "image", "id": _next("i"), "src": src,
         "start": start, "duration": duration, "fit": fit}
    c.update(kw)
    return c


def audio_clip(src, start, duration, **kw):
    c = {
        "kind": "audio", "id": _next("a"),
        "src": src, "start": start, "duration": duration,
        "in": kw.pop("in_", 0), "out": kw.pop("out_", duration),
    }
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
    spec = {
        "version": SPEC_VERSION,
        "meta": {"name": name, "width": width, "height": height, "fps": fps},
        "tracks": tracks,
    }
    duration = max((c["start"] + c["duration"] for t in tracks for c in t["clips"]), default=0)
    return {
        "template": {
            "id": tid,
            "name": name,
            "description": description,
            "category": category,
            "version": "1.0.0",
            "author": "VCut Studio",
            "license": "MIT",
            "tags": tags,
            "aspect": f"{width}:{height}",
            "durationSec": round(duration, 2),
            "placeholders": placeholders,
        },
        "spec": spec,
    }


# ---------------------------------------------------------------- 1. youtube-intro
t1 = make_template(
    "youtube-intro", "Intro YouTube", "Mở đầu kênh: tiêu đề kênh bay lên trên nền video điện ảnh.",
    "intro", ["youtube", "intro", "kênh"], 1920, 1080, 30,
    [ph("footage", "video", "Video nền", "intro-bg.mp4"),
     ph("title", "text", "Tên kênh / tiêu đề", "KÊNH CỦA BẠN"),
     ph("subtitle", "text", "Dòng phụ (slogan)", "Video mới mỗi tuần")],
    [
        track("v1", "video", "Nền", [
            # transitionOut bị validator từ chối trên clip đơn lẻ
            # (transition cần 2 clip kề nhau) — intro kết thúc bằng chữ đứng yên.
            video_clip("{{footage}}", 0, 5, filter={"lut": "vcut-cinematic"},
                       transitionIn={"type": "fade", "duration": 0.5}),
        ]),
        track("t1", "text", "Tiêu đề", [
            text_clip("{{title}}", 1.0, 3.2, style(96, x=0.5, y=0.42, animation="fadeUp")),
        ]),
        track("t2", "text", "Dòng phụ", [
            text_clip("{{subtitle}}", 1.6, 2.6, style(44, color="#E9D5FF", x=0.5, y=0.58, animation="slideInLeft")),
        ]),
    ],
)

# ---------------------------------------------------------------- 2. youtube-outro
t2 = make_template(
    "youtube-outro", "Outro YouTube", "Kết thúc video: cảm ơn + kêu gọi đăng ký, kèm huy hiệu.",
    "outro", ["youtube", "outro", "subscribe"], 1920, 1080, 30,
    [ph("footage", "video", "Video nền", "outro-bg.mp4"),
     ph("thanks", "text", "Lời cảm ơn", "Cảm ơn bạn đã xem!"),
     ph("channel", "text", "Tên kênh", "KÊNH CỦA BẠN"),
     ph("cta", "text", "Lời kêu gọi", "Nhớ đăng ký để không bỏ lỡ video mới nhé!")],
    [
        track("v1", "video", "Nền", [
            video_clip("{{footage}}", 0, 8, filter={"lut": "vcut-warm-bloom"},
                       transitionIn={"type": "dissolve", "duration": 0.6}),
        ]),
        track("t1", "text", "Cảm ơn", [
            text_clip("{{thanks}}", 0.5, 7.0, style(72, x=0.5, y=0.32, animation="fadeUp")),
        ]),
        track("t2", "text", "Tên kênh", [
            text_clip("{{channel}}", 1.5, 6.0, style(54, color="#22D3EE", x=0.5, y=0.5, animation="slideInRight")),
        ]),
        track("t3", "text", "Kêu gọi", [
            text_clip("{{cta}}", 2.5, 5.0, style(40, x=0.5, y=0.66, animation="typewriter")),
        ]),
        track("s1", "sticker", "Huy hiệu", [
            sticker_clip("badge.png", 2.5, 5.0, x=0.85, y=0.2, scale=0.12),
        ]),
    ],
)

# ---------------------------------------------------------------- 3. tiktok-viral
t3 = make_template(
    "tiktok-viral", "TikTok dọc", "Video dọc 9:16: 3 cảnh cắt nhanh + chữ hook nổi bật.",
    "social", ["tiktok", "shorts", "dọc", "9:16"], 1080, 1920, 30,
    [ph("clip1", "video", "Cảnh 1 (mở đầu)", "scene-1.mp4"),
     ph("clip2", "video", "Cảnh 2", "scene-2.mp4"),
     ph("clip3", "video", "Cảnh 3 (kết)", "scene-3.mp4"),
     ph("hook", "text", "Câu hook 3 giây đầu", "ĐỪNG BỎ QUA VIDEO NÀY"),
     ph("caption", "text", "Chú thích chạy suốt", "@kenhcuaban")],
    [
        track("v1", "video", "Cảnh", [
            video_clip("{{clip1}}", 0, 5, transitionOut={"type": "dissolve", "duration": 0.4}),
            video_clip("{{clip2}}", 5, 5, transitionOut={"type": "dissolve", "duration": 0.4}),
            video_clip("{{clip3}}", 10, 5),
        ]),
        track("t1", "text", "Hook", [
            text_clip("{{hook}}", 0.5, 4.0, style(64, x=0.5, y=0.14, animation="popIn", background="#000000")),
        ]),
        track("t2", "text", "Chú thích", [
            text_clip("{{caption}}", 5.5, 9.0, style(48, color="#22D3EE", x=0.5, y=0.86, animation="wave")),
        ]),
    ],
)

# ---------------------------------------------------------------- 4. slideshow
t4 = make_template(
    "slideshow", "Slideshow ảnh", "Trình chiếu 4 ảnh với hiệu ứng chuyển cảnh mượt.",
    "slideshow", ["ảnh", "slideshow", "kỷ niệm"], 1920, 1080, 30,
    [ph("photo1", "image", "Ảnh 1", "photo-1.jpg"),
     ph("photo2", "image", "Ảnh 2", "photo-2.jpg"),
     ph("photo3", "image", "Ảnh 3", "photo-3.jpg"),
     ph("photo4", "image", "Ảnh 4", "photo-4.jpg"),
     ph("title", "text", "Tiêu đề album", "Kỷ niệm đáng nhớ")],
    [
        # Lưu ý: ImageClip chưa hỗ trợ transitionOut — slideshow hiện cắt cứng
        # giữa các ảnh (ghi trong TEMPLATES_LIMITS.md).
        track("i1", "image", "Ảnh", [
            image_clip("{{photo1}}", 0, 3),
            image_clip("{{photo2}}", 3, 3),
            image_clip("{{photo3}}", 6, 3),
            image_clip("{{photo4}}", 9, 3),
        ]),
        track("t1", "text", "Tiêu đề", [
            text_clip("{{title}}", 0.5, 2.5, style(64, x=0.5, y=0.1, animation="fadeIn", background="#000000")),
        ]),
    ],
)

# ---------------------------------------------------------------- 5. lyric-video
t5 = make_template(
    "lyric-video", "Lyric video", "Video lời bài hát: 4 câu lyric hiện dần trên nền ảnh.",
    "music", ["lyric", "nhạc", "karaoke"], 1920, 1080, 30,
    [ph("music", "audio", "File nhạc", "song.mp3"),
     ph("bg", "image", "Ảnh nền", "lyric-bg.jpg"),
     ph("line1", "text", "Câu hát 1", "Dòng lyric đầu tiên ở đây"),
     ph("line2", "text", "Câu hát 2", "Dòng lyric thứ hai ở đây"),
     ph("line3", "text", "Câu hát 3", "Dòng lyric thứ ba ở đây"),
     ph("line4", "text", "Câu hát 4", "Dòng lyric cuối cùng ở đây")],
    [
        track("a1", "audio", "Nhạc", [
            audio_clip("{{music}}", 0, 24, fadeIn=1.0, fadeOut=2.0),
        ]),
        # Lưu ý: ImageClip chưa hỗ trợ filter/effects/transition (giới hạn engine)
        track("i1", "image", "Nền", [
            image_clip("{{bg}}", 0, 24),
        ]),
        track("t1", "text", "Lyric", [
            text_clip("{{line1}}", 0.5, 5.5, style(56, x=0.5, y=0.5, animation="fadeUp")),
            text_clip("{{line2}}", 6.5, 5.5, style(56, x=0.5, y=0.5, animation="fadeUp")),
            text_clip("{{line3}}", 12.5, 5.5, style(56, x=0.5, y=0.5, animation="fadeUp")),
            text_clip("{{line4}}", 18.5, 5.0, style(56, x=0.5, y=0.5, animation="fadeUp")),
        ]),
    ],
)

# ---------------------------------------------------------------- 6. lower-third
t6 = make_template(
    "lower-third", "Bảng tên (Lower Third)", "Dải tên người nói ở góc dưới — dùng cho phỏng vấn, tin tức.",
    "broadcast", ["lower third", "tên", "phỏng vấn"], 1920, 1080, 30,
    [ph("footage", "video", "Video nền", "interview.mp4"),
     ph("name", "text", "Tên người nói", "NGUYỄN VĂN A"),
     ph("role", "text", "Chức danh", "Giám đốc Sáng tạo")],
    [
        track("v1", "video", "Nền", [
            video_clip("{{footage}}", 0, 6),
        ]),
        track("t1", "text", "Tên", [
            text_clip("{{name}}", 0.8, 4.4, style(64, x=0.14, y=0.76, animation="slideInLeft", background="#7C3AED")),
        ]),
        track("t2", "text", "Chức danh", [
            text_clip("{{role}}", 1.2, 4.0, style(40, color="#E9D5FF", x=0.14, y=0.85, animation="fadeIn", background="#000000")),
        ]),
    ],
)

# ---------------------------------------------------------------- 7. title-card
t7 = make_template(
    "title-card", "Thẻ tiêu đề", "Màn hình tiêu đề điện ảnh: chữ lớn mờ dần trên nền tối.",
    "cinematic", ["title", "điện ảnh", "mở đầu"], 1920, 1080, 30,
    [ph("bg", "image", "Ảnh nền", "title-bg.jpg"),
     ph("title", "text", "Tiêu đề", "CHƯƠNG MỘT")],
    [
        # Lưu ý: ImageClip chưa hỗ trợ filter/effects (giới hạn engine)
        track("i1", "image", "Nền", [
            image_clip("{{bg}}", 0, 4),
        ]),
        track("t1", "text", "Tiêu đề", [
            text_clip("{{title}}", 0.5, 3.0, style(88, x=0.5, y=0.5, animation="fadeInOut")),
        ]),
    ],
)

# ---------------------------------------------------------------- 8. product-showcase
t8 = make_template(
    "product-showcase", "Giới thiệu sản phẩm", "Quảng cáo vuông 1:1: ảnh sản phẩm + tên + giá + kêu gọi.",
    "ads", ["quảng cáo", "sản phẩm", "bán hàng", "1:1"], 1080, 1080, 30,
    [ph("product", "image", "Ảnh sản phẩm", "product.jpg"),
     ph("name", "text", "Tên sản phẩm", "SẢN PHẨM MỚI"),
     ph("price", "text", "Giá bán", "299.000đ"),
     ph("cta", "text", "Kêu gọi hành động", "Đặt hàng ngay!")],
    [
        track("i1", "image", "Sản phẩm", [
            image_clip("{{product}}", 0, 10, fit="contain"),
        ]),
        track("t1", "text", "Tên", [
            text_clip("{{name}}", 0.5, 9.0, style(64, x=0.5, y=0.1, animation="popIn")),
        ]),
        track("t2", "text", "Giá", [
            text_clip("{{price}}", 1.5, 8.0, style(72, color="#22D3EE", x=0.5, y=0.8, animation="bounce")),
        ]),
        track("t3", "text", "CTA", [
            text_clip("{{cta}}", 3.0, 6.5, style(44, x=0.5, y=0.9, animation="slideInRight", background="#7C3AED")),
        ]),
        track("s1", "sticker", "Ngôi sao", [
            sticker_clip("star.png", 1.0, 8.5, x=0.86, y=0.18, scale=0.14),
        ]),
    ],
)

# ---------------------------------------------------------------- 9. travel-vlog-intro
t9 = make_template(
    "travel-vlog-intro", "Mở đầu Vlog du lịch", "Intro du lịch: tên địa điểm bay vào trên cảnh quay.",
    "intro", ["du lịch", "vlog", "intro"], 1920, 1080, 30,
    [ph("footage", "video", "Cảnh quay địa điểm", "travel.mp4"),
     ph("location", "text", "Tên địa điểm", "ĐÀ LẠT"),
     ph("date", "text", "Thời gian", "Mùa thu 2026")],
    [
        track("v1", "video", "Cảnh", [
            video_clip("{{footage}}", 0, 6, filter={"lut": "vcut-sunset-glow"},
                       transitionIn={"type": "fade", "duration": 0.8}),
        ]),
        track("t1", "text", "Địa điểm", [
            text_clip("{{location}}", 1.0, 4.2, style(84, x=0.5, y=0.44, animation="slideInDown")),
        ]),
        track("t2", "text", "Thời gian", [
            text_clip("{{date}}", 1.8, 3.4, style(40, color="#FFE9C7", x=0.5, y=0.58, animation="fadeIn")),
        ]),
    ],
)

# ---------------------------------------------------------------- 10. podcast-audiogram
t10 = make_template(
    "podcast-audiogram", "Audiogram Podcast", "Video vuông cho podcast: ảnh bìa + tên tập + khách mời.",
    "podcast", ["podcast", "audiogram", "vuông"], 1080, 1080, 30,
    [ph("audio", "audio", "File audio podcast", "episode.mp3"),
     ph("cover", "image", "Ảnh bìa tập", "cover.jpg"),
     ph("episode", "text", "Tên tập", "TẬP 12: CHUYỆN NGHỀ"),
     ph("guest", "text", "Khách mời", "Khách mời: Trần Văn B")],
    [
        track("a1", "audio", "Tiếng", [
            audio_clip("{{audio}}", 0, 30, fadeIn=1.0, fadeOut=2.0),
        ]),
        track("i1", "image", "Bìa", [
            image_clip("{{cover}}", 0, 30, fit="contain"),
        ]),
        track("t1", "text", "Tên tập", [
            text_clip("{{episode}}", 0.5, 29.0, style(56, x=0.5, y=0.06, animation="fadeUp")),
        ]),
        track("t2", "text", "Khách mời", [
            text_clip("{{guest}}", 1.5, 28.0, style(44, color="#E9D3EE", x=0.5, y=0.94, animation="slideInLeft")),
        ]),
    ],
)

TEMPLATES = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10]

for t in TEMPLATES:
    tid = t["template"]["id"]
    path = os.path.join(OUT, f"{tid}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(t, f, ensure_ascii=False, indent=2)
    print(f"wrote {tid}.json ({t['template']['durationSec']}s, {len(t['template']['placeholders'])} placeholders)")
