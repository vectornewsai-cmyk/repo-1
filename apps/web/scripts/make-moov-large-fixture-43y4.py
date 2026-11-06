#!/usr/bin/env python3
"""make-moov-large-fixture-43y4.py — Tạo file MP4 có moov ~16 MiB thật
(Phase 9 đợt 43, luồng Y4; chỉ dùng làm fixture đo, KHÔNG phải asset sản phẩm).

Cách làm (trung thực, không bịa moov): lấy file faststart thật của ffmpeg
(ftyp, moov, mdat), chèn thêm một box `free` ~16 MiB làm con cuối của
moov, rồi cộng delta vào mọi entry stco/co64 (chunk offset tuyệt đối
dịch theo đúng số byte moov phình ra, vì moov đứng trước mdat).
Không đụng mvhd/trak/sample table ngoài stco/co64, không đổi thứ tự box.

Kiểm chứng sau khi chạy (script tự làm, fail rõ nếu sai):
  - ffprobe vẫn đọc được duration/sample như file gốc (trừ offset dịch).
  - parseMp4VideoTrack trên toàn file (Node, ngoài script này) cho cùng
    số sample như file gốc, offset mỗi sample = gốc + delta.
  - Box moov đo bằng ffprobe/box scan đúng ~16 MiB.

Dùng:
  python3 make-moov-large-fixture-43y4.py <input-faststart.mp4> <output.mp4> [moov_target_bytes]
Mặc định moov_target_bytes = 16 MiB (16777216).
"""
import struct
import sys


def read_boxes(buf, start, end):
    """Yield (type, box_start, box_size, header_len) cho các box top-level
    hoặc con trực tiếp trong [start, end)."""
    off = start
    while off + 8 <= end:
        (size,) = struct.unpack_from(">I", buf, off)
        typ = buf[off + 4:off + 8].decode("latin1")
        header = 8
        if size == 1:
            (big,) = struct.unpack_from(">Q", buf, off + 8)
            size = big
            header = 16
        elif size == 0:
            size = end - off
        if size < header or off + size > end:
            break
        yield typ, off, size, header
        off += size


def find_moov(buf):
    for typ, off, size, _ in read_boxes(buf, 0, len(buf)):
        if typ == "moov":
            return off, size
    raise SystemExit("không thấy box moov top-level (file phải faststart)")


def shift_chunk_offsets(moov, delta):
    """Cộng delta vào mọi stco (32-bit) và co64 (64-bit) trong moov.
    Trả về (moov_mới, số_entry_đã_dịch)."""
    out = bytearray(moov)
    count = 0
    # Quét đệ quy các box con: chỉ cần đi sâu qua mọi container; stco/co64
    # là lá, sửa tại chỗ (cùng độ dài nên không đổi kích thước moov).
    stack = [(8, len(moov))]  # moov payload: sau header 8 byte
    while stack:
        s, e = stack.pop()
        for typ, off, size, header in read_boxes(bytes(out), s, e):
            if typ in ("stco", "co64"):
                body = off + header
                ver_flags = out[body:body + 4]
                (n,) = struct.unpack_from(">I", out, body + 4)
                p = body + 8
                if typ == "stco":
                    for _ in range(n):
                        (v,) = struct.unpack_from(">I", out, p)
                        struct.pack_into(">I", out, p, v + delta)
                        p += 4
                else:
                    for _ in range(n):
                        (v,) = struct.unpack_from(">Q", out, p)
                        struct.pack_into(">Q", out, p, v + delta)
                        p += 8
                count += n
            elif typ in ("trak", "mdia", "minf", "stbl", "edts", "dinf",
                         "moov", "udta", "meta"):
                # meta có 4 byte version/flags sau header trước khi chứa box con.
                inner = off + header + (4 if typ == "meta" else 0)
                stack.append((inner, off + size))
    return bytes(out), count


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    src, dst = sys.argv[1], sys.argv[2]
    target = int(sys.argv[3]) if len(sys.argv) > 3 else 16 * 1024 * 1024
    buf = open(src, "rb").read()
    moov_off, moov_size = find_moov(buf)
    # moov phải đứng trước mdat đầu tiên (faststart) thì delta mới là
    # dịch mdat; nếu không, từ chối thay vì tạo file sai offset lặng lẽ.
    mdat_off = None
    for typ, off, size, _ in read_boxes(buf, 0, len(buf)):
        if typ == "mdat":
            mdat_off = off
            break
    if mdat_off is None or moov_off > mdat_off:
        raise SystemExit("file không faststart (moov không đứng trước mdat)")
    moov = buf[moov_off:moov_off + moov_size]
    # free box chèn vào cuối moov: header 8 + payload 0 → tổng moov mới
    # = moov cũ + free_size; chọn free_size để moov mới >= target.
    free_size = target - moov_size
    if free_size < 16:
        raise SystemExit(f"moov gốc {moov_size} đã >= target {target}")
    free_box = struct.pack(">I", free_size) + b"free" + b"\x00" * (free_size - 8)
    new_moov_body = moov[8:] + free_box
    new_moov_size = 8 + len(new_moov_body)
    if new_moov_size >= 2 ** 32:
        raise SystemExit("moov mới vượt 32-bit size (không dùng largesize ở đây)")
    new_moov = struct.pack(">I", new_moov_size) + b"moov" + new_moov_body
    delta = new_moov_size - moov_size
    new_moov, shifted = shift_chunk_offsets(new_moov, delta)
    out = buf[:moov_off] + new_moov + buf[moov_off + moov_size:]
    open(dst, "wb").write(out)
    print(f"moov: {moov_size} -> {new_moov_size} byte "
          f"({new_moov_size / 1048576:.2f} MiB), delta stco/co64 = {delta}, "
          f"entries đã dịch = {shifted}, file: {len(buf)} -> {len(out)} byte")
    if shifted == 0:
        raise SystemExit("CẢNH BÁO: không dịch được entry stco/co64 nào — "
                         "file ra có thể sai offset, không dùng làm fixture")
    return 0


if __name__ == "__main__":
    sys.exit(main())
