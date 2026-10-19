#!/usr/bin/env python3
"""Test server/caption/translate.py KHÔNG cần model faster-whisper.

- parse_args: argv parse đúng
- build_result: schema output có đủ trường translation, track label đúng
- import: translate.py tái sử dụng được module caption (không circular)
Chạy: python3 test_translate.py
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import translate as tr  # noqa: E402

PASS = 0
FAIL = 0

def ok(name, fn):
    global PASS, FAIL
    try:
        fn()
        PASS += 1
        print(f"  ✓ {name}")
    except Exception as e:
        FAIL += 1
        print(f"  ✗ {name}\n    {type(e).__name__}: {e}")

def _assert_parse():
    a = tr.parse_args(["--input", "a.mp4", "--out", "b.json"])
    assert a.input == "a.mp4", a.input
    assert a.out == "b.json", a.out
    assert a.lang == "vi", a.lang  # default nguồn = vi

def _assert_parse2():
    a = tr.parse_args(["--input", "a.mp4", "--lang", "auto", "--out", "b.json",
                       "--max-chars", "30"])
    assert a.lang == "auto", a.lang
    assert a.max_chars == 30, a.max_chars

def _assert_help():
    r = subprocess.run([sys.executable,
                        os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                     "translate.py"),
                        "--help"], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[:200]
    assert "translate" in r.stdout.lower()

def _assert_schema():
    args = tr.parse_args(["--input", "vid.mp4", "--out", "o.json"])
    words = [
        {"start": 0.5, "end": 0.9, "word": "Hello"},
        {"start": 0.9, "end": 1.4, "word": "everyone."},
        {"start": 2.0, "end": 2.4, "word": "Thanks"},
        {"start": 2.4, "end": 2.9, "word": "for"},
        {"start": 2.9, "end": 3.4, "word": "watching."},
    ]
    res = tr.build_result(args, words, "vi", 10.0, 2.5)
    assert res["source_language"] == "vi", res["source_language"]
    assert res["target_language"] == "en", res["target_language"]
    assert res["engine"] == "faster-whisper-translate", res["engine"]
    assert res["spec_version"] == "0.2.0", res["spec_version"]
    assert res["video_spec_track"]["label"] == "Phụ đề (EN)", \
        res["video_spec_track"]["label"]
    assert len(res["segments"]) >= 1
    assert res["segments"][0]["text"] == "Hello everyone.", res["segments"][0]
    assert res["realtime_factor"] == 0.25, res["realtime_factor"]

def _assert_group():
    args = tr.parse_args(["--input", "v.mp4", "--out", "o.json",
                          "--max-chars", "42", "--max-dur", "5.0"])
    words = [{"start": i * 0.4, "end": i * 0.4 + 0.3, "word": f"w{i}"}
             for i in range(3)]
    res = tr.build_result(args, words, "vi", 5.0, 1.0)
    # 3 từ ngắn kề nhau -> gộp thành 1 caption (heuristic caption.py)
    assert len(res["segments"]) == 1, res["segments"]
    assert res["segments"][0]["text"] == "w0 w1 w2"

def _assert_json():
    args = tr.parse_args(["--input", "v.mp4", "--out", "o.json"])
    words = [{"start": 0.1, "end": 0.5, "word": "Hi"}]
    res = tr.build_result(args, words, "vi", 1.0, 0.2)
    s = json.dumps(res, ensure_ascii=False)
    assert "Phụ đề (EN)" in s

print("== [1] parse_args ==")
ok("parse argv cơ bản", _assert_parse)
ok("parse --lang auto + --max-chars", _assert_parse2)
ok("--help thoát mã 0", _assert_help)

print("== [2] build_result (không cần model) ==")
ok("schema output đầy đủ trường translation", _assert_schema)
ok("tái sử dụng group_words của caption (gộp câu ngắn)", _assert_group)
ok("JSON serialize được (ensure_ascii=False)", _assert_json)

print(f"\n{'='*44}\n{'🎉' if FAIL == 0 else '❌'} TRANSLATE UNIT: {PASS} pass, {FAIL} fail\n{'='*44}")
sys.exit(1 if FAIL else 0)
