#!/usr/bin/env python3
"""
Test silence.py: tạo audio gồm 3 đoạn "nói" (sine 440Hz) xen 2 khoảng lặng,
chạy silence.py, assert phát hiện đúng 2 khoảng lặng.

Không cần model ML — chỉ cần ffmpeg/ffprobe có sẵn.
"""
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SILENCE_PY = os.path.join(HERE, "silence.py")


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-1500:]}")
    return r


def make_test_audio(wav_path):
    """
    Tạo audio 10s: [0-2s nói][2-4s lặng][4-6s nói][6-8s lặng][8-10s nói].
    "Nói" = sine 440Hz ở -20dB; "lặng" = im hoàn toàn.
    """
    # 3 đoạn sine
    segs = []
    for i, (a, b) in enumerate([(0, 2), (4, 6), (8, 10)]):
        p = os.path.join(os.path.dirname(wav_path), f"seg{i}.wav")
        run(["ffmpeg", "-y", "-v", "error",
             "-f", "lavfi", "-i", f"sine=frequency=440:duration={b - a}:sample_rate=44100",
             "-af", "volume=-20dB", p])
        segs.append(p)
    # Nối bằng silence 2s giữa các đoạn
    sil = os.path.join(os.path.dirname(wav_path), "sil.wav")
    run(["ffmpeg", "-y", "-v", "error",
         "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono:d=2", sil])
    # concat: seg0, sil, seg1, sil, seg2
    lst = os.path.join(os.path.dirname(wav_path), "list.txt")
    with open(lst, "w") as f:
        for p in [segs[0], sil, segs[1], sil, segs[2]]:
            f.write(f"file '{p}'\n")
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
         "-i", lst, "-c:a", "pcm_s16le", wav_path])


def main():
    passed = failed = 0

    def check(name, cond, detail=""):
        nonlocal passed, failed
        if cond:
            passed += 1
            print(f"  ✓ {name}")
        else:
            failed += 1
            print(f"  ✗ {name} {detail}")

    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "test.wav")
        out = os.path.join(tmp, "silence.json")

        print("== [1] tạo audio test 3 nói + 2 lặng ==")
        make_test_audio(wav)
        check("file wav tạo được", os.path.getsize(wav) > 1000)

        print("== [2] chạy silence.py ==")
        r = subprocess.run(
            [sys.executable, SILENCE_PY, "--input", wav,
             "--noise", "-40", "--min-dur", "0.5", "--out", out],
            capture_output=True, text=True)
        check("silence.py exit 0", r.returncode == 0, r.stderr[-500:])
        check("file JSON tạo được", os.path.isfile(out))

        data = json.load(open(out, encoding="utf-8"))
        sils = data["silences"]
        print(f"   phát hiện: {sils}")

        print("== [3] assert kết quả ==")
        check("phát hiện đúng 2 khoảng lặng", len(sils) == 2,
              f"(nhận {len(sils)})")
        if len(sils) == 2:
            check("khoảng 1 bắt đầu ~2.0s", abs(sils[0]["start"] - 2.0) < 0.15,
                  f"(nhận {sils[0]['start']})")
            check("khoảng 1 kết thúc ~4.0s", abs(sils[0]["end"] - 4.0) < 0.15,
                  f"(nhận {sils[0]['end']})")
            check("khoảng 2 bắt đầu ~6.0s", abs(sils[1]["start"] - 6.0) < 0.15,
                  f"(nhận {sils[1]['start']})")
            check("khoảng 2 kết thúc ~8.0s", abs(sils[1]["end"] - 8.0) < 0.15,
                  f"(nhận {sils[1]['end']})")
            check("duration mỗi khoảng ~2.0s",
                  all(abs(s["duration"] - 2.0) < 0.2 for s in sils))
        keep = data.get("keep", [])
        check("keep có 3 đoạn", len(keep) == 3, f"(nhận {len(keep)})")
        check("audio_duration ~10s",
              abs(data["audio_duration_sec"] - 10.0) < 0.3,
              f"(nhận {data['audio_duration_sec']})")

        print("== [4] biên: im lặng đầu/cuối file ==")
        # Audio bắt đầu và kết thúc bằng 1s lặng
        wav2 = os.path.join(tmp, "edge.wav")
        sil1 = os.path.join(tmp, "s1.wav")
        run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
             "-i", "anullsrc=r=44100:cl=mono:d=1", sil1])
        seg = os.path.join(tmp, "seg0.wav")
        lst2 = os.path.join(tmp, "list2.txt")
        with open(lst2, "w") as f:
            for p in [sil1, os.path.join(tmp, "seg0.wav")]:
                f.write(f"file '{p}'\n")
        out2 = os.path.join(tmp, "silence2.json")
        r = subprocess.run(
            [sys.executable, SILENCE_PY, "--input", wav,
             "--noise", "-40", "--min-dur", "0.5", "--out", out2],
            capture_output=True, text=True)
        check("chạy lại vẫn OK", r.returncode == 0)

        print("== [5] validate tham số ==")
        r = subprocess.run(
            [sys.executable, SILENCE_PY, "--input", wav,
             "--noise", "-100", "--min-dur", "0.5",
             "--out", os.path.join(tmp, "x.json")],
            capture_output=True, text=True)
        check("noise ngoài phạm vi → lỗi", r.returncode != 0)
        r = subprocess.run(
            [sys.executable, SILENCE_PY, "--input", "/khong/ton/tai.wav",
             "--out", os.path.join(tmp, "x.json")],
            capture_output=True, text=True)
        check("file không tồn tại → lỗi", r.returncode != 0)

    print()
    print(f"{'=' * 42}")
    if failed == 0:
        print(f"🎉 SILENCE PY PASS: {passed} assertions")
    else:
        print(f"❌ SILENCE PY FAIL: {passed} pass, {failed} fail")
        sys.exit(1)


if __name__ == "__main__":
    main()
