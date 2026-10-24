#!/usr/bin/env python3
"""
gen_templates3.py — Q4 (Phase 8): 20 video template mẫu vòng 3 cho VCut Studio.

Nối tiếp gen_templates.py (10) và gen_templates2.py (20). Cùng định dạng JSON:
  "template": metadata (id, name, description, category, version, author, license, placeholders)
  "spec": video-spec JSON (SPEC_VERSION 0.2.0) dùng marker {{placeholder_id}}.

Thiết kế gốc 100% — không sao chép layout/preset độc quyền của CapCut.
Chỉ dùng 9 category đã có (social, ads, cinematic, music, podcast, broadcast,
outro, slideshow, intro). Ràng buộc validator đã tuân thủ:
  - transitionOut chỉ trên video clip trong cặp kề nhau (không dùng trên clip đơn/image).
  - ImageClip không có transitionOut/filter/effects.
  - Text animation chỉ dùng tên trong TEXT_ANIMATIONS.
  - Sticker dùng src literal (file PNG do người dùng cung cấp khi render).

License: MIT (tài sản gốc của dự án VCut Studio).
Chạy: python3 assets/templates/gen_templates3.py  (ghi 20 file *.json)
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


def write(tpl):
    with open(os.path.join(OUT, tpl["template"]["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump(tpl, f, ensure_ascii=False, indent=2)
    print("wrote", tpl["template"]["id"])


# ---------------------------------------------------------------- 1. podcast-studio
write(make_template(
    "podcast-studio", "Studio podcast", "Tập podcast ngang: 2 góc máy + tên tập + tên khách mời.",
    "podcast", ["podcast", "studio", "trò chuyện"], 1920, 1080, 30,
    [ph("cam1", "video", "Góc máy 1 (host)", "host-cam.mp4"),
     ph("cam2", "video", "Góc máy 2 (khách)", "guest-cam.mp4"),
     ph("episode", "text", "Tên tập", "TẬP 12: KHỞI NGHIỆP"),
     ph("guest", "text", "Tên khách mời", "Khách mời: Lan Anh")],
    [track("v1", "video", "Góc máy", [
        video_clip("{{cam1}}", 0, 5, transitionOut={"type": "fade", "duration": 0.4}),
        video_clip("{{cam2}}", 5, 5),
    ]),
     track("t1", "text", "Tên tập", [
        text_clip("{{episode}}", 0.5, 4.0, style(56, x=0.5, y=0.12, animation="slideInLeft", background="#111827")),
     ]),
     track("t2", "text", "Khách mời", [
        text_clip("{{guest}}", 5.5, 4.0, style(40, color="#FDE68A", x=0.5, y=0.85, animation="fadeUp")),
     ])],
))

# ---------------------------------------------------------------- 2. morning-news
write(make_template(
    "morning-news", "Bản tin sáng", "Mở đầu bản tin: video thành phố + tên chương trình + ngày.",
    "broadcast", ["tin tức", "sáng", "truyền hình"], 1920, 1080, 30,
    [ph("city", "video", "Video thành phố sáng", "city-morning.mp4"),
     ph("show", "text", "Tên chương trình", "BẢN TIN SÁNG"),
     ph("date", "text", "Ngày phát sóng", "Thứ Bảy, 24/10/2026")],
    [track("v1", "video", "Thành phố", [
        video_clip("{{city}}", 0, 7, filter={"lut": "vcut-cinematic"}),
    ]),
     track("t1", "text", "Tên chương trình", [
        text_clip("{{show}}", 0.5, 6.0, style(72, x=0.5, y=0.15, animation="popIn", background="#1E3A8A")),
     ]),
     track("t2", "text", "Ngày", [
        text_clip("{{date}}", 1.5, 5.0, style(36, color="#BFDBFE", x=0.5, y=0.82, animation="fadeIn")),
     ])],
))

# ---------------------------------------------------------------- 3. concert-teaser
write(make_template(
    "concert-teaser", "Teaser concert", "Video dọc teaser đêm nhạc: 2 cảnh sân khấu + tên nghệ sĩ + ngày diễn.",
    "music", ["concert", "nhạc", "teaser", "dọc"], 1080, 1920, 30,
    [ph("stage1", "video", "Cảnh sân khấu 1", "stage-1.mp4"),
     ph("stage2", "video", "Cảnh sân khấu 2", "stage-2.mp4"),
     ph("artist", "text", "Tên nghệ sĩ", "LIVE: MINH TUẤN"),
     ph("date", "text", "Ngày diễn", "20.12.2026 — SVĐ MỸ ĐÌNH")],
    [track("v1", "video", "Sân khấu", [
        video_clip("{{stage1}}", 0, 4, filter={"lut": "vcut-neon-nights"},
                   transitionOut={"type": "dissolve", "duration": 0.4}),
        video_clip("{{stage2}}", 4, 4, filter={"lut": "vcut-neon-nights"}),
    ]),
     track("t1", "text", "Nghệ sĩ", [
        text_clip("{{artist}}", 0.5, 7.0, style(68, color="#FACC15", x=0.5, y=0.18, animation="bounce")),
     ]),
     track("t2", "text", "Ngày diễn", [
        text_clip("{{date}}", 4.5, 3.0, style(38, x=0.5, y=0.85, animation="fadeUp")),
     ])],
))

# ---------------------------------------------------------------- 4. album-cover
write(make_template(
    "album-cover", "Bìa album", "Video vuông giới thiệu album: ảnh bìa + tên album + tên nghệ sĩ.",
    "music", ["album", "nhạc", "vuông"], 1080, 1080, 30,
    [ph("cover", "image", "Ảnh bìa album", "album-cover.jpg"),
     ph("album", "text", "Tên album", "ĐÊM PHỐ"),
     ph("artist", "text", "Tên nghệ sĩ", "Hà My")],
    [track("i1", "image", "Bìa", [
        image_clip("{{cover}}", 0, 6, fit="cover"),
    ]),
     track("t1", "text", "Tên album", [
        text_clip("{{album}}", 0.5, 5.0, style(72, x=0.5, y=0.38, animation="fadeUp")),
     ]),
     track("t2", "text", "Nghệ sĩ", [
        text_clip("{{artist}}", 1.5, 4.0, style(40, color="#FBCFE8", x=0.5, y=0.58, animation="fadeIn")),
     ])],
))

# ---------------------------------------------------------------- 5. cooking-show
write(make_template(
    "cooking-show", "Show nấu ăn dọc", "Video dọc nấu ăn: 3 bước + tên món + tip nhanh.",
    "social", ["nấu ăn", "dọc", "công thức"], 1080, 1920, 30,
    [ph("step1", "video", "Bước 1", "cook-1.mp4"),
     ph("step2", "video", "Bước 2", "cook-2.mp4"),
     ph("step3", "video", "Bước 3 (thành phẩm)", "cook-3.mp4"),
     ph("dish", "text", "Tên món", "CƠM GÀ XỐI MỠ"),
     ph("tip", "text", "Mẹo nhanh", "TIP: Ướp gà 30 phút trước khi chiên")],
    [track("v1", "video", "Các bước", [
        video_clip("{{step1}}", 0, 4, transitionOut={"type": "slideleft", "duration": 0.4}),
        video_clip("{{step2}}", 4, 4, transitionOut={"type": "slideleft", "duration": 0.4}),
        video_clip("{{step3}}", 8, 4),
    ]),
     track("t1", "text", "Tên món", [
        text_clip("{{dish}}", 0.5, 3.5, style(60, x=0.5, y=0.1, animation="popIn", background="#000000")),
     ]),
     track("t2", "text", "Mẹo", [
        text_clip("{{tip}}", 8.5, 3.0, style(36, color="#FDE68A", x=0.5, y=0.88, animation="slideUp")),
     ])],
))

# ---------------------------------------------------------------- 6. travel-montage
write(make_template(
    "travel-montage", "Montage du lịch", "Video ngang montage: 3 điểm đến + tên chuyến đi.",
    "cinematic", ["du lịch", "montage", "ngang"], 1920, 1080, 30,
    [ph("place1", "video", "Điểm 1", "place-1.mp4"),
     ph("place2", "video", "Điểm 2", "place-2.mp4"),
     ph("place3", "video", "Điểm 3", "place-3.mp4"),
     ph("trip", "text", "Tên chuyến đi", "HÀ GIANG — MÙA HOA TAM GIÁC MẠCH")],
    [track("v1", "video", "Các điểm", [
        video_clip("{{place1}}", 0, 4, filter={"lut": "vcut-sunset-glow"},
                   transitionOut={"type": "fade", "duration": 0.5}),
        video_clip("{{place2}}", 4, 4, filter={"lut": "vcut-sunset-glow"},
                   transitionOut={"type": "fade", "duration": 0.5}),
        video_clip("{{place3}}", 8, 4, filter={"lut": "vcut-sunset-glow"}),
    ]),
     track("t1", "text", "Tên chuyến", [
        text_clip("{{trip}}", 8.5, 3.0, style(52, x=0.5, y=0.85, animation="fadeUp")),
     ])],
))

# ---------------------------------------------------------------- 7. gym-transformation
write(make_template(
    "gym-transformation", "Hành trình gym", "Video dọc before/after: 2 cảnh tập + số kg + slogan.",
    "social", ["gym", "thể hình", "dọc"], 1080, 1920, 30,
    [ph("before", "video", "Cảnh trước", "gym-before.mp4"),
     ph("after", "video", "Cảnh sau", "gym-after.mp4"),
     ph("result", "text", "Kết quả", "-15KG TRONG 6 THÁNG"),
     ph("slogan", "text", "Slogan", "KHÔNG BỎ CUỘC")],
    [track("v1", "video", "Hành trình", [
        video_clip("{{before}}", 0, 4, transitionOut={"type": "wipeleft", "duration": 0.5}),
        video_clip("{{after}}", 4, 4),
    ]),
     track("t1", "text", "Kết quả", [
        text_clip("{{result}}", 4.5, 3.0, style(64, color="#4ADE80", x=0.5, y=0.15, animation="popIn")),
     ]),
     track("t2", "text", "Slogan", [
        text_clip("{{slogan}}", 0.5, 3.5, style(48, x=0.5, y=0.85, animation="bounce")),
     ])],
))

# ---------------------------------------------------------------- 8. book-trailer
write(make_template(
    "book-trailer", "Trailer sách", "Video ngang trailer sách: ảnh bìa + trích đoạn + tên sách.",
    "cinematic", ["sách", "trailer", "ngang"], 1920, 1080, 30,
    [ph("cover", "image", "Ảnh bìa sách", "book-cover.jpg"),
     ph("quote", "text", "Trích đoạn", "“Cuốn sách thay đổi cách bạn nhìn thế giới.”"),
     ph("title", "text", "Tên sách", "NHỮNG NGÀY NẮNG")],
    [track("i1", "image", "Bìa sách", [
        image_clip("{{cover}}", 0, 7, fit="cover"),
    ]),
     track("t1", "text", "Trích đoạn", [
        text_clip("{{quote}}", 0.5, 6.0, style(52, x=0.5, y=0.35, animation="fadeUp", italic=True)),
     ]),
     track("t2", "text", "Tên sách", [
        text_clip("{{title}}", 1.5, 5.0, style(44, color="#FDE68A", x=0.5, y=0.6, animation="fadeIn")),
     ])],
))

# ---------------------------------------------------------------- 9. webinar-invite
write(make_template(
    "webinar-invite", "Mời webinar", "Video ngang mời hội thảo trực tuyến: diễn giả + chủ đề + giờ.",
    "broadcast", ["webinar", "mời", "trực tuyến"], 1920, 1080, 30,
    [ph("speaker", "image", "Ảnh diễn giả", "speaker.jpg"),
     ph("topic", "text", "Chủ đề", "AI CHO NGƯỜI MỚI BẮT ĐẦU"),
     ph("time", "text", "Thời gian", "20:00 — Thứ 7, 31/10/2026")],
    [track("i1", "image", "Diễn giả", [
        image_clip("{{speaker}}", 0, 6, fit="cover"),
    ]),
     track("t1", "text", "Chủ đề", [
        text_clip("{{topic}}", 0.5, 5.0, style(60, x=0.5, y=0.2, animation="slideInLeft", background="#0F172A")),
     ]),
     track("t2", "text", "Thời gian", [
        text_clip("{{time}}", 1.5, 4.0, style(38, color="#BFDBFE", x=0.5, y=0.85, animation="fadeUp")),
     ])],
))

# ---------------------------------------------------------------- 10. charity-appeal
write(make_template(
    "charity-appeal", "Kêu gọi từ thiện", "Video ngang kêu gọi: cảnh thực địa + thông điệp + số tài khoản.",
    "ads", ["từ thiện", "kêu gọi", "cộng đồng"], 1920, 1080, 30,
    [ph("field", "video", "Video thực địa", "field.mp4"),
     ph("message", "text", "Thông điệp", "MỘT BỮA ĂN — MỘT TƯƠNG LAI"),
     ph("cta", "text", "Lời kêu gọi", "Chung tay ngay hôm nay")],
    [track("v1", "video", "Thực địa", [
        video_clip("{{field}}", 0, 7, filter={"lut": "vcut-warm-bloom"}),
    ]),
     track("t1", "text", "Thông điệp", [
        text_clip("{{message}}", 0.5, 6.0, style(58, x=0.5, y=0.3, animation="fadeUp")),
     ]),
     track("t2", "text", "Kêu gọi", [
        text_clip("{{cta}}", 1.5, 5.0, style(40, color="#FECACA", x=0.5, y=0.75, animation="fadeIn")),
     ])],
))

# ---------------------------------------------------------------- 11. app-launch
write(make_template(
    "app-launch", "Ra mắt ứng dụng", "Video dọc ra mắt app: màn hình app + tên app + tagline.",
    "ads", ["app", "ra mắt", "dọc"], 1080, 1920, 30,
    [ph("screen", "video", "Video màn hình app", "app-screen.mp4"),
     ph("name", "text", "Tên ứng dụng", "NOTA — GHI CHÚ THÔNG MINH"),
     ph("tagline", "text", "Tagline", "Nghĩ ít hơn, nhớ nhiều hơn")],
    [track("v1", "video", "Màn hình", [
        video_clip("{{screen}}", 0, 6, filter={"lut": "vcut-cinematic"}),
    ]),
     track("t1", "text", "Tên app", [
        text_clip("{{name}}", 0.5, 5.0, style(60, x=0.5, y=0.15, animation="popIn")),
     ]),
     track("t2", "text", "Tagline", [
        text_clip("{{tagline}}", 1.5, 4.0, style(38, color="#E9D5FF", x=0.5, y=0.85, animation="fadeUp")),
     ])],
))

# ---------------------------------------------------------------- 12. fashion-lookbook
write(make_template(
    "fashion-lookbook", "Lookbook thời trang", "Video dọc lookbook: 3 set đồ + tên bộ sưu tập.",
    "social", ["thời trang", "lookbook", "dọc"], 1080, 1920, 30,
    [ph("look1", "video", "Set 1", "look-1.mp4"),
     ph("look2", "video", "Set 2", "look-2.mp4"),
     ph("look3", "video", "Set 3", "look-3.mp4"),
     ph("collection", "text", "Tên bộ sưu tập", "THU ĐÔNG 2026")],
    [track("v1", "video", "Các set", [
        video_clip("{{look1}}", 0, 3, transitionOut={"type": "dissolve", "duration": 0.3}),
        video_clip("{{look2}}", 3, 3, transitionOut={"type": "dissolve", "duration": 0.3}),
        video_clip("{{look3}}", 6, 3),
    ]),
     track("t1", "text", "Bộ sưu tập", [
        text_clip("{{collection}}", 6.5, 2.5, style(56, x=0.5, y=0.12, animation="slideInRight")),
     ])],
))

# ---------------------------------------------------------------- 13. wedding-vows
write(make_template(
    "wedding-vows", "Lời thề đám cưới", "Video ngang khoảnh khắc lễ cưới: video lễ + lời thề + tên đôi.",
    "cinematic", ["đám cưới", "lễ cưới", "ngang"], 1920, 1080, 30,
    [ph("ceremony", "video", "Video buổi lễ", "ceremony.mp4"),
     ph("vow", "text", "Lời thề", "“Dù giàu sang hay nghèo khó, anh vẫn ở đây.”"),
     ph("couple", "text", "Tên đôi", "Minh & An — 12.12.2026")],
    [track("v1", "video", "Buổi lễ", [
        video_clip("{{ceremony}}", 0, 8, filter={"lut": "vcut-blush-pink"}),
    ]),
     track("t1", "text", "Lời thề", [
        text_clip("{{vow}}", 0.5, 7.0, style(52, x=0.5, y=0.35, animation="fadeUp", italic=True)),
     ]),
     track("t2", "text", "Tên đôi", [
        text_clip("{{couple}}", 1.5, 6.0, style(38, color="#FBCFE8", x=0.5, y=0.62, animation="fadeIn")),
     ])],
))

# ---------------------------------------------------------------- 14. graduation-celebration
write(make_template(
    "graduation-celebration", "Mừng tốt nghiệp", "Video dọc mừng tốt nghiệp: cảnh lễ + tên + niên khóa.",
    "social", ["tốt nghiệp", "dọc", "kỷ niệm"], 1080, 1920, 30,
    [ph("ceremony", "video", "Video buổi lễ", "graduation.mp4"),
     ph("name", "text", "Tên người tốt nghiệp", "CHÚC MỪNG THU HẰNG!"),
     ph("year", "text", "Niên khóa", "KHÓA 2022 — 2026")],
    [track("v1", "video", "Buổi lễ", [
        video_clip("{{ceremony}}", 0, 6),
    ]),
     track("t1", "text", "Tên", [
        text_clip("{{name}}", 0.5, 5.0, style(60, color="#FDE68A", x=0.5, y=0.2, animation="bounce")),
     ]),
     track("t2", "text", "Niên khóa", [
        text_clip("{{year}}", 1.5, 4.0, style(38, x=0.5, y=0.85, animation="fadeUp")),
     ])],
))

# ---------------------------------------------------------------- 15. podcast-highlight
write(make_template(
    "podcast-highlight", "Highlight podcast dọc", "Video dọc cắt highlight: 1 đoạn nói + câu quote nổi bật.",
    "podcast", ["podcast", "highlight", "dọc"], 1080, 1920, 30,
    [ph("clip", "video", "Đoạn highlight", "highlight.mp4"),
     ph("quote", "text", "Câu quote", "“THÀNH CÔNG LÀ 99% KIÊN TRÌ.”"),
     ph("show", "text", "Tên show", "PODCAST KHỞI NGHIỆP — TẬP 12")],
    [track("v1", "video", "Highlight", [
        video_clip("{{clip}}", 0, 7),
    ]),
     track("t1", "text", "Quote", [
        text_clip("{{quote}}", 0.5, 6.0, style(56, x=0.5, y=0.25, animation="popIn", background="#000000")),
     ]),
     track("t2", "text", "Tên show", [
        text_clip("{{show}}", 1.5, 5.0, style(34, color="#FDE68A", x=0.5, y=0.88, animation="fadeIn")),
     ])],
))

# ---------------------------------------------------------------- 16. desk-setup
write(make_template(
    "desk-setup", "Góc làm việc", "Video dọc khoe góc setup: 2 cảnh bàn làm việc + tên chủ góc.",
    "social", ["setup", "bàn làm việc", "dọc"], 1080, 1920, 30,
    [ph("desk1", "video", "Cảnh bàn 1", "desk-1.mp4"),
     ph("desk2", "video", "Cảnh bàn 2", "desk-2.mp4"),
     ph("owner", "text", "Tên chủ góc", "GÓC CỦA TUẤN")],
    [track("v1", "video", "Góc làm việc", [
        video_clip("{{desk1}}", 0, 4, transitionOut={"type": "fade", "duration": 0.4}),
        video_clip("{{desk2}}", 4, 4),
    ]),
     track("t1", "text", "Chủ góc", [
        text_clip("{{owner}}", 4.5, 3.0, style(56, x=0.5, y=0.85, animation="slideUp")),
     ])],
))

# ---------------------------------------------------------------- 17. outro-subscribe
write(make_template(
    "outro-subscribe", "Kết video kêu gọi đăng ký", "Video ngang kết: cảm ơn + nút đăng ký + video tiếp theo.",
    "outro", ["outro", "đăng ký", "ngang"], 1920, 1080, 30,
    [ph("thanks", "text", "Lời cảm ơn", "CẢM ƠN BẠN ĐÃ XEM!"),
     ph("subscribe", "text", "Kêu gọi đăng ký", "NHẤN ĐĂNG KÝ ĐỂ KHÔNG BỎ LỠ VIDEO MỚI"),
     ph("next", "text", "Video tiếp theo", "TIẾP THEO: HÀNH TRÌNH 30 NGÀY")],
    [track("t1", "text", "Cảm ơn", [
        text_clip("{{thanks}}", 0.5, 5.0, style(64, x=0.5, y=0.3, animation="popIn")),
     ]),
     track("t2", "text", "Đăng ký", [
        text_clip("{{subscribe}}", 1.5, 4.0, style(40, color="#FCA5A5", x=0.5, y=0.55, animation="fadeUp")),
     ]),
     track("t3", "text", "Tiếp theo", [
        text_clip("{{next}}", 2.5, 3.0, style(34, color="#BFDBFE", x=0.5, y=0.75, animation="fadeIn")),
     ])],
))

# ---------------------------------------------------------------- 18. intro-logo
write(make_template(
    "intro-logo", "Mở đầu logo", "Video ngang mở đầu: logo + tên kênh + slogan.",
    "intro", ["intro", "logo", "ngang"], 1920, 1080, 30,
    [ph("logo", "image", "Ảnh logo", "logo.png"),
     ph("channel", "text", "Tên kênh", "KÊNH SÁNG TẠO"),
     ph("slogan", "text", "Slogan", "Mỗi ngày một ý tưởng mới")],
    [track("i1", "image", "Logo", [
        image_clip("{{logo}}", 0, 5, fit="contain"),
    ]),
     track("t1", "text", "Tên kênh", [
        text_clip("{{channel}}", 0.5, 4.0, style(68, x=0.5, y=0.6, animation="bounce")),
     ]),
     track("t2", "text", "Slogan", [
        text_clip("{{slogan}}", 1.5, 3.0, style(36, color="#E9D5FF", x=0.5, y=0.78, animation="fadeUp")),
     ])],
))

# ---------------------------------------------------------------- 19. family-slideshow
write(make_template(
    "family-slideshow", "Slideshow gia đình", "Video ngang slideshow: 3 ảnh kỷ niệm + lời nhắn.",
    "slideshow", ["gia đình", "slideshow", "ảnh"], 1920, 1080, 30,
    [ph("photo1", "image", "Ảnh 1", "family-1.jpg"),
     ph("photo2", "image", "Ảnh 2", "family-2.jpg"),
     ph("photo3", "image", "Ảnh 3", "family-3.jpg"),
     ph("message", "text", "Lời nhắn", "GIA ĐÌNH LÀ NƠI BÌNH YÊN NHẤT")],
    [track("i1", "image", "Các ảnh", [
        image_clip("{{photo1}}", 0, 3, fit="cover"),
        image_clip("{{photo2}}", 3, 3, fit="cover"),
        image_clip("{{photo3}}", 6, 3, fit="cover"),
    ]),
     track("t1", "text", "Lời nhắn", [
        text_clip("{{message}}", 6.5, 2.5, style(52, x=0.5, y=0.85, animation="fadeUp")),
     ])],
))

# ---------------------------------------------------------------- 20. sale-countdown
write(make_template(
    "sale-countdown", "Đếm ngược sale", "Video dọc đếm ngược: sản phẩm + mức giảm + thời gian.",
    "ads", ["sale", "đếm ngược", "dọc"], 1080, 1920, 30,
    [ph("product", "video", "Video sản phẩm", "product.mp4"),
     ph("discount", "text", "Mức giảm", "GIẢM ĐẾN 50%"),
     ph("deadline", "text", "Thời hạn", "CHỈ TRONG 24H — KẾT THÚC 23:59")],
    [track("v1", "video", "Sản phẩm", [
        video_clip("{{product}}", 0, 6, filter={"lut": "vcut-chili-ember"}),
    ]),
     track("t1", "text", "Mức giảm", [
        text_clip("{{discount}}", 0.5, 5.0, style(68, color="#FCA5A5", x=0.5, y=0.15, animation="bounce", background="#7F1D1D")),
     ]),
     track("t2", "text", "Thời hạn", [
        text_clip("{{deadline}}", 1.5, 4.0, style(38, x=0.5, y=0.85, animation="wave")),
     ])],
))
