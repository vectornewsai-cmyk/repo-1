#!/usr/bin/env python3
"""
Test RAM guard cho session birefnet của bgremove.py (Phase 9 đợt 88 P7,
nợ N4 đợt 86 — xem docs/PHASE9_ROUND88_P7_BIREFNET_RAMGUARD_LIMITS.md).

KHÔNG cần rembg/cv2/model: test logic guard thuần + main() với run_once
stub (như test_bgremove_fallback.py). Phần chạy birefnet/u2net thật do
lượt chạy thật kiểm chứng (guard chặn sớm trên VM ít RAM).

Chạy:  python3 test_bgremove_ramguard.py
"""
import io
import os
import sys
import tempfile
from contextlib import redirect_stderr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bgremove

PASS = 0
FAIL = 0
FAILED = []


def test(name, fn):
    global PASS, FAIL
    try:
        fn()
        PASS += 1
        print(f"  ✓ {name}")
    except Exception as e:
        FAIL += 1
        FAILED.append(name)
        print(f"  ✗ {name}: {e}")


def run_main_with_stub(calls, argv_extra=None, env_extra=None):
    """Chạy main() với run_once stub (ghi lại session được gọi).
    Trả về (stderr_text, exit_message hoặc None)."""
    orig = bgremove.run_once

    def stub(args, session_name):
        calls.append(session_name)
        return None

    bgremove.run_once = stub
    saved_env = {k: os.environ.get(k) for k in (env_extra or {})}
    try:
        for k, v in (env_extra or {}).items():
            os.environ[k] = v
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "out.mov")
            argv = ["--input", "in.mp4", "--output", out] + (argv_extra or [])
            buf = io.StringIO()
            exit_msg = None
            try:
                with redirect_stderr(buf):
                    bgremove.main(argv)
            except SystemExit as e:
                exit_msg = str(e.code)
            return buf.getvalue(), exit_msg
    finally:
        bgremove.run_once = orig
        for k, v in saved_env.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def test_get_mem_available():
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "meminfo")
        with open(p, "w") as f:
            f.write("MemTotal:        8124900 kB\n"
                    "MemFree:          123456 kB\n"
                    "MemAvailable:    1405900 kB\n"
                    "Buffers:          123456 kB\n")
        assert bgremove.get_mem_available_mb(p) == 1405900 // 1024
        # Không có dòng MemAvailable -> None (không đoán).
        with open(p, "w") as f:
            f.write("MemTotal:        8124900 kB\n")
        assert bgremove.get_mem_available_mb(p) is None
        # File không tồn tại / parse lỗi -> None.
        assert bgremove.get_mem_available_mb(os.path.join(d, "nope")) is None
        with open(p, "w") as f:
            f.write("MemAvailable:    không-phải-số kB\n")
        assert bgremove.get_mem_available_mb(p) is None


def test_decision():
    d = bgremove.ram_guard_decision("birefnet-general", 1405)
    assert d["action"] == "fallback", d
    d = bgremove.ram_guard_decision("birefnet-general-lite", 1405)
    assert d["action"] == "fallback", d
    d = bgremove.ram_guard_decision("birefnet-general", 6144)
    assert d["action"] == "allow", d  # đúng ngưỡng thì cho chạy
    d = bgremove.ram_guard_decision("birefnet-general", 8000)
    assert d["action"] == "allow", d
    d = bgremove.ram_guard_decision("birefnet-general", None)
    assert d["action"] == "allow-unknown", d
    d = bgremove.ram_guard_decision("u2net", 100)
    assert d["action"] == "allow", d  # u2net nhẹ, guard không áp
    d = bgremove.ram_guard_decision("BiRefNet-General", 100)
    assert d["action"] == "fallback", d  # không phân biệt hoa/thường
    d = bgremove.ram_guard_decision("birefnet-general", 100, min_ram_mb=50)
    assert d["action"] == "allow", d  # ngưỡng tùy chỉnh được tôn trọng


def test_resolve_min_ram():
    args = bgremove.parse_args(["--input", "i", "--output", "o"])
    assert bgremove.resolve_min_ram_mb(args) == 6144
    args = bgremove.parse_args(
        ["--input", "i", "--output", "o", "--min-ram-mb", "2048"])
    assert bgremove.resolve_min_ram_mb(args) == 2048
    args = bgremove.parse_args(
        ["--input", "i", "--output", "o", "--min-ram-mb", "0"])
    assert bgremove.resolve_min_ram_mb(args) == 0
    args = bgremove.parse_args(
        ["--input", "i", "--output", "o", "--no-ram-guard"])
    assert bgremove.resolve_min_ram_mb(args) == 0
    # Env thắng mặc định, CLI thắng env.
    args = bgremove.parse_args(["--input", "i", "--output", "o"])
    os.environ["BGREMOVE_MIN_RAM_MB"] = "4096"
    try:
        assert bgremove.resolve_min_ram_mb(args) == 4096
        args2 = bgremove.parse_args(
            ["--input", "i", "--output", "o", "--min-ram-mb", "1024"])
        assert bgremove.resolve_min_ram_mb(args2) == 1024
    finally:
        del os.environ["BGREMOVE_MIN_RAM_MB"]
    # Env lỗi -> mặc định, không crash.
    os.environ["BGREMOVE_MIN_RAM_MB"] = "không-phải-số"
    try:
        assert bgremove.resolve_min_ram_mb(args) == 6144
    finally:
        del os.environ["BGREMOVE_MIN_RAM_MB"]


def test_guard_fallback_main():
    # Ép ngưỡng rất cao -> guard chặn birefnet, chỉ gọi u2net 1 lần.
    calls = []
    err, exit_msg = run_main_with_stub(
        calls, argv_extra=["--min-ram-mb", "999999"])
    assert exit_msg is None, f"guard fallback không được exit: {exit_msg}"
    assert calls == ["u2net"], f"guard phải chuyển thẳng sang u2net: {calls}"
    assert "RAM_GUARD" in err, err
    assert "ram_guard_from=birefnet-general" in err, err
    assert "fallback_from=birefnet-general" in err, err
    assert "ram_guard_avail_mb=" in err and "ram_guard_min_mb=999999" in err, err


def test_guard_allow_main():
    # Ngưỡng 1 MB -> RAM thật luôn đủ -> chạy birefnet, không fallback.
    calls = []
    err, exit_msg = run_main_with_stub(
        calls, argv_extra=["--min-ram-mb", "1"])
    assert exit_msg is None, exit_msg
    assert calls == ["birefnet-general"], f"đủ RAM phải chạy birefnet: {calls}"
    assert "RAM_GUARD" not in err, err
    assert "fallback_from" not in err, err


def test_guard_no_fallback_blocks():
    # Guard chặn + --no-fallback -> exit rõ, KHÔNG gọi session nào.
    calls = []
    err, exit_msg = run_main_with_stub(
        calls, argv_extra=["--min-ram-mb", "999999", "--no-fallback"])
    assert exit_msg is not None and "RAM_GUARD" in exit_msg, exit_msg
    assert calls == [], f"guard chặn thì không được chạy session nào: {calls}"
    assert "u2net" in exit_msg, exit_msg


def test_guard_not_for_u2net():
    # Yêu cầu u2net + RAM thấp (ngưỡng cao) -> guard không áp, chạy u2net.
    calls = []
    err, exit_msg = run_main_with_stub(
        calls, argv_extra=["--session", "u2net", "--min-ram-mb", "999999"])
    assert exit_msg is None, exit_msg
    assert calls == ["u2net"], calls
    assert "RAM_GUARD" not in err, err


def test_guard_no_ram_guard_flag():
    # --no-ram-guard -> chạy thẳng birefnet dù ngưỡng mặc định.
    calls = []
    err, exit_msg = run_main_with_stub(calls, argv_extra=["--no-ram-guard"])
    assert exit_msg is None, exit_msg
    assert calls == ["birefnet-general"], calls
    assert "RAM_GUARD" not in err, err


if __name__ == "__main__":
    test("get_mem_available_mb: đọc /proc/meminfo, lỗi -> None", test_get_mem_available)
    test("ram_guard_decision: fallback/allow/allow-unknown/biên", test_decision)
    test("resolve_min_ram_mb: mặc định/CLI/env/--no-ram-guard", test_resolve_min_ram)
    test("main: RAM thấp -> chuyển u2net ngay, marker đầy đủ", test_guard_fallback_main)
    test("main: đủ RAM -> chạy birefnet, không fallback", test_guard_allow_main)
    test("main: guard + --no-fallback -> chặn thẳng, không chạy", test_guard_no_fallback_blocks)
    test("main: u2net không bị guard", test_guard_not_for_u2net)
    test("main: --no-ram-guard -> chạy thẳng birefnet", test_guard_no_ram_guard_flag)
    print(f"\n== KẾT QUẢ: {PASS} pass, {FAIL} fail ==")
    if FAIL:
        print(f"Thua ở: {', '.join(FAILED)}")
        sys.exit(1)
