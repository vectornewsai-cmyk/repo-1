#!/usr/bin/env python3
"""
Test fallback birefnet -> u2net của bgremove.py (Phase 7 P6).

KHÔNG cần rembg/cv2/model: test stub run_once của module (import module chỉ
cần argparse/os/subprocess/sys) rồi gọi main() với argv giả. Test thật phần
orchestration (quyết định fallback, thứ tự retry, thông báo); phần chạy
rembg thật vẫn do test_bgremove.py cũ kiểm chứng khi có model.

Chạy:  python3 test_bgremove_fallback.py
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


def run_main_with_stub(calls, fail_sessions, argv_extra=None):
    """Chạy main() với run_once stub: fail nếu session trong fail_sessions.

    Trả về (stderr_text, exit_message hoặc None)."""
    orig = bgremove.run_once

    def stub(args, session_name):
        calls.append(session_name)
        if session_name in fail_sessions:
            raise RuntimeError(f"giả lập lỗi {session_name} (OOM)")
        return None

    bgremove.run_once = stub
    try:
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


def test_decide():
    assert bgremove.decide_fallback("birefnet-general") == "u2net"
    assert bgremove.decide_fallback("birefnet-general-lite") == "u2net"
    assert bgremove.decide_fallback("u2net") is None
    assert bgremove.decide_fallback("birefnet-general", fallback_enabled=False) is None
    assert bgremove.decide_fallback("BiRefNet-General") == "u2net"


def test_fallback_success():
    calls = []
    err, exit_msg = run_main_with_stub(calls, {"birefnet-general"})
    assert exit_msg is None, f"không được exit khi fallback thành công: {exit_msg}"
    assert calls == ["birefnet-general", "u2net"], f"thứ tự retry sai: {calls}"
    assert "FALLBACK session=birefnet-general -> u2net" in err
    assert "fallback_from=birefnet-general" in err


def test_no_fallback_when_u2net_requested():
    calls = []
    err, exit_msg = run_main_with_stub(
        calls, {"u2net"}, argv_extra=["--session", "u2net"])
    assert exit_msg is not None, "u2net lỗi phải exit"
    assert calls == ["u2net"], f"u2net lỗi không được retry: {calls}"
    assert "FALLBACK" not in err


def test_no_fallback_flag():
    calls = []
    err, exit_msg = run_main_with_stub(
        calls, {"birefnet-general"}, argv_extra=["--no-fallback"])
    assert exit_msg is not None, "--no-fallback + lỗi phải exit"
    assert calls == ["birefnet-general"], f"--no-fallback không được retry: {calls}"
    assert "FALLBACK" not in err


def test_both_fail_reports_both():
    calls = []
    err, exit_msg = run_main_with_stub(calls, {"birefnet-general", "u2net"})
    assert exit_msg is not None, "cả 2 session lỗi phải exit"
    assert calls == ["birefnet-general", "u2net"]
    assert "birefnet-general" in exit_msg and "u2net" in exit_msg, exit_msg


def test_first_try_success_no_fallback():
    calls = []
    err, exit_msg = run_main_with_stub(calls, set())
    assert exit_msg is None
    assert calls == ["birefnet-general"]
    assert "FALLBACK" not in err


def test_forbidden_still_blocked():
    calls = []
    _err, exit_msg = run_main_with_stub(
        calls, set(), argv_extra=["--session", "bria-rmbg"])
    assert exit_msg is not None and "BỊ CẤM" in exit_msg, exit_msg
    assert calls == [], "session cấm không được chạy"


if __name__ == "__main__":
    test("decide_fallback: birefnet -> u2net, u2net/no-fallback -> None", test_decide)
    test("birefnet lỗi -> retry u2net thành công + marker rõ", test_fallback_success)
    test("u2net lỗi -> không retry", test_no_fallback_when_u2net_requested)
    test("--no-fallback -> không retry", test_no_fallback_flag)
    test("cả 2 lỗi -> exit báo cả 2 session", test_both_fail_reports_both)
    test("lần đầu thành công -> không fallback", test_first_try_success_no_fallback)
    test("session cấm vẫn bị chặn", test_forbidden_still_blocked)
    print(f"\n== KẾT QUẢ: {PASS} pass, {FAIL} fail ==")
    if FAIL:
        print(f"Thua ở: {', '.join(FAILED)}")
        sys.exit(1)
