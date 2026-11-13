#!/bin/bash
# Phase 9 đợt 95, luồng W1 — tái tạo clip faststart dùng cho test blob-load.
# Clip faststart CHỈ dùng để test, KHÔNG thay clip gốc trong repo, KHÔNG stage binary.
# Phương pháp: remux `-c copy` (giữ nguyên bitstream video, chỉ dời moov lên
# đầu file bằng `-movflags +faststart`) — KHÔNG re-encode, để phép thử chỉ
# đổi đúng một biến là vị trí moov. Re-encode lại bằng libx264 sẽ đổi byte
# media và làm nhiễu phép thử (xem LIMITS W1 §2).
# Nguồn: ~/workspace/round91-s3/clips/c2.mp4, c8.mp4 (moov ở cuối).
# Đích: ~/workspace/round95-w1/clips-faststart/c2.mp4, c8.mp4 (moov ở đầu).
set -e
SRC="${1:-/home/hatch/workspace/round91-s3/clips}"
DST="${2:-/home/hatch/workspace/round95-w1/clips-faststart}"
mkdir -p "$DST"
for c in c2 c8; do
  ffmpeg -y -v error -i "$SRC/$c.mp4" -c copy -movflags +faststart "$DST/$c.mp4"
  echo "$c.mp4 $(stat -c%s "$DST/$c.mp4") bytes"
  ffprobe -v error -show_entries format=duration -of csv=p=0 "$DST/$c.mp4"
done
python3 - "$DST" <<'EOF'
import struct, sys
for f in [sys.argv[1]+"/c2.mp4", sys.argv[1]+"/c8.mp4"]:
    with open(f,'rb') as fh:
        off=0; boxes=[]
        while True:
            h=fh.read(8)
            if len(h)<8: break
            size,typ=struct.unpack('>I4s',h)
            boxes.append((typ.decode(),off))
            fh.seek(off+size); off+=size
        print(f, boxes)
        assert boxes[1][0]=='moov', "moov phai la box thu 2 (sau ftyp)"
print("OK: moov truoc mdat o ca 2 clip")
EOF
