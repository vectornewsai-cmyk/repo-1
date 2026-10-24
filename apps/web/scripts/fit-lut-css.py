#!/usr/bin/env python3
"""
fit-lut-css.py — Đo + fit lại ánh xạ LUT -> CSS filter trong previewEngine.ts.

Mục đích (Q1 Phase 8): LUT preview hiện là CSS viết tay, xấp xỉ cảm giác màu.
Script này đo sai số thật của từng entry so với file .cube (nội suy trilinear,
giống FFmpeg lut3d) trên lưới màu train + màu ngẫu nhiên held-out, rồi fit lại
THAM SỐ của cùng chuỗi filter (cùng hàm, cùng thứ tự) bằng least squares.
Chỉ chấp nhận entry mới khi sai số held-out < 0.7 x sai số cũ.

Chạy:  python3 fit-lut-css.py [--apply] [--limit N]
  --apply : ghi các entry đạt ngưỡng vào apps/web/src/lib/previewEngine.ts
            (mặc định chỉ in báo cáo, không sửa file)
  --limit : chỉ xử lý N LUT đầu (để chạy thử nhanh)

Lưu ý semantics duplicate key: previewEngine.ts hiện có 2 key trùng
(vcut-matcha, vcut-coral-reef). Theo semantics JS, key SAU thắng ở cả
vite/esbuild lẫn tsc emit (đã kiểm chứng bằng test tối thiểu); script parse
theo đó. Khi --apply, script giữ lại occurrence CUỐI (giá trị production
đang chạy) và xoá occurrence trước, để hết lỗi TS1117.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import least_squares

REPO = Path(__file__).resolve().parents[3]  # apps/web/scripts -> repo root
ENGINE = REPO / "apps/web/src/lib/previewEngine.ts"
FILTERS = REPO / "assets/filters"
RNG = np.random.default_rng(20261024)

# --- .cube -----------------------------------------------------------------
def parse_cube(path: Path):
    size = None
    data = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("LUT_3D_SIZE"):
            size = int(line.split()[1])
            continue
        if line.startswith(("TITLE", "DOMAIN_", "LUT_1D_SIZE", "LUT_3D_INPUT_RANGE")):
            continue
        parts = line.split()
        if len(parts) == 3:
            try:
                data.append([float(p) for p in parts])
            except ValueError:
                pass
    arr = np.array(data, dtype=np.float64)
    assert size is not None and arr.shape == (size ** 3, 3), f"{path}: size={size} rows={arr.shape}"
    # .cube: R biến nhanh nhất, rồi G, rồi B -> reshape (B, G, R, 3)
    return arr.reshape(size, size, size, 3), size


def apply_lut(grid: np.ndarray, size: int, rgb: np.ndarray) -> np.ndarray:
    """Trilinear trên lưới RGB [0,1] -> [0,1]. rgb: (N,3)."""
    x = np.clip(rgb, 0, 1) * (size - 1)
    x0 = np.floor(x).astype(int)
    x1 = np.minimum(x0 + 1, size - 1)
    f = x - x0
    # grid[b, g, r]
    c000 = grid[x0[:, 2], x0[:, 1], x0[:, 0]]
    c100 = grid[x0[:, 2], x0[:, 1], x1[:, 0]]
    c010 = grid[x0[:, 2], x1[:, 1], x0[:, 0]]
    c110 = grid[x0[:, 2], x1[:, 1], x1[:, 0]]
    c001 = grid[x1[:, 2], x0[:, 1], x0[:, 0]]
    c101 = grid[x1[:, 2], x0[:, 1], x1[:, 0]]
    c011 = grid[x1[:, 2], x1[:, 1], x0[:, 0]]
    c111 = grid[x1[:, 2], x1[:, 1], x1[:, 0]]
    fr, fg, fb = f[:, 0:1], f[:, 1:2], f[:, 2:3]
    c00 = c000 * (1 - fr) + c100 * fr
    c01 = c001 * (1 - fr) + c101 * fr
    c10 = c010 * (1 - fr) + c110 * fr
    c11 = c011 * (1 - fr) + c111 * fr
    c0 = c00 * (1 - fg) + c10 * fg
    c1 = c01 * (1 - fg) + c11 * fg
    return np.clip(c0 * (1 - fb) + c1 * fb, 0, 1)


# --- CSS filter (ma trận affine sRGB, theo W3C Filter Effects) --------------
LUM = np.array([0.213, 0.715, 0.072])


def mat_brightness(b):
    return np.eye(3) * b, np.zeros(3)


def mat_contrast(c):
    return np.eye(3) * c, np.full(3, (1 - c) * 0.5)


def mat_saturate(s):
    m = np.array([
        [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
    ])
    return m, np.zeros(3)


def mat_grayscale(g):
    return mat_saturate(1 - g)


def mat_sepia(s):
    sep = np.array([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131],
    ])
    return (1 - s) * np.eye(3) + s * sep, np.zeros(3)


def mat_hue_rotate(deg):
    a = np.radians(deg)
    c, si = np.cos(a), np.sin(a)
    m = np.array([
        [0.213 + 0.787 * c - 0.213 * si, 0.715 - 0.715 * c - 0.715 * si, 0.072 - 0.072 * c + 0.928 * si],
        [0.213 - 0.213 * c + 0.143 * si, 0.715 + 0.285 * c + 0.140 * si, 0.072 - 0.072 * c - 0.283 * si],
        [0.213 - 0.213 * c - 0.787 * si, 0.715 - 0.715 * c + 0.715 * si, 0.072 + 0.928 * c + 0.072 * si],
    ])
    return m, np.zeros(3)


def mat_invert(i):
    return np.eye(3) * (1 - 2 * i), np.full(3, i)


FILTERS_FN = {
    "brightness": (mat_brightness, (0.0, 3.0)),
    "contrast": (mat_contrast, (0.0, 3.0)),
    "saturate": (mat_saturate, (0.0, 3.0)),
    "grayscale": (mat_grayscale, (0.0, 1.0)),
    "sepia": (mat_sepia, (0.0, 1.0)),
    "hue-rotate": (mat_hue_rotate, (-180.0, 180.0)),
    "invert": (mat_invert, (0.0, 1.0)),
}

TOKEN_RE = re.compile(r"(brightness|contrast|saturate|grayscale|sepia|hue-rotate|invert)\(([^)]+)\)")


def parse_css(css: str):
    """-> [(tên, giá trị)] theo đúng thứ tự chuỗi."""
    out = []
    for name, val in TOKEN_RE.findall(css):
        v = val.strip()
        if v.endswith("deg"):
            v = v[:-3]
        out.append((name, float(v)))
    return out


def apply_css(tokens, rgb: np.ndarray) -> np.ndarray:
    """Áp chuỗi filter theo thứ tự, clamp cuối (như CSS paint)."""
    m_total = np.eye(3)
    o_total = np.zeros(3)
    for name, val in tokens:
        fn, _ = FILTERS_FN[name]
        m, o = fn(val)
        # filter mới áp SAU filter cũ: x' = m (M x + o) + o_new
        o_total = m @ o_total + o
        m_total = m @ m_total
    return np.clip(rgb @ m_total.T + o_total, 0, 1)


def _num(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".")


def fmt_css(tokens) -> str:
    parts = []
    for name, val in tokens:
        if name == "hue-rotate":
            v = round(val) if abs(val - round(val)) < 0.05 else round(val, 1)
            parts.append(f"hue-rotate({v}deg)")
        else:
            parts.append(f"{name}({_num(val)})")
    return " ".join(parts)


def parse_map(text: str):
    """Parse LUT_CSS từ source, key sau thắng (semantics vite/esbuild)."""
    m = re.search(r"const LUT_CSS[^=]*=\s*\{(.*?)\n\};", text, re.S)
    assert m, "không tìm thấy LUT_CSS"
    out = {}
    for key, val in re.findall(r'"([^"]+)":\s*"([^"]*)"', m.group(1)):
        out[key] = val  # gán lại -> sau thắng trước
    return out


def main():
    apply = "--apply" in sys.argv
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    text = ENGINE.read_text()
    css_map = parse_map(text)
    ids = sorted(css_map)
    if limit:
        ids = ids[:limit]

    # lưới train 6^3 + held-out ngẫu nhiên 500
    levels = np.linspace(0, 1, 6)
    train = np.array(np.meshgrid(levels, levels, levels)).reshape(3, -1).T
    val = RNG.random((500, 3))

    report = []
    new_entries = {}
    for lut_id in ids:
        cube_path = FILTERS / f"{lut_id}.cube"
        if not cube_path.exists():
            print(f"SKIP {lut_id}: không có .cube")
            continue
        grid, size = parse_cube(cube_path)
        target_tr = apply_lut(grid, size, train)
        target_va = apply_lut(grid, size, val)
        tokens = parse_css(css_map[lut_id])
        if not tokens:
            print(f"SKIP {lut_id}: CSS rỗng")
            continue

        def rmse(pred, tgt):
            return float(np.sqrt(np.mean((pred - tgt) ** 2)) * 255)

        cur_tr = rmse(apply_css(tokens, train), target_tr)
        cur_va = rmse(apply_css(tokens, val), target_va)
        x0 = np.array([v for _, v in tokens])
        lo = np.array([FILTERS_FN[n][1][0] for n, _ in tokens])
        hi = np.array([FILTERS_FN[n][1][1] for n, _ in tokens])

        def resid(x):
            tk = [(n, float(v)) for (n, _), v in zip(tokens, x)]
            return (apply_css(tk, train) - target_tr).ravel() * 255

        try:
            res = least_squares(resid, np.clip(x0, lo, hi), bounds=(lo, hi), method="trf", max_nfev=400)
            fit_tokens = [(n, float(v)) for (n, _), v in zip(tokens, res.x)]
            fit_va = rmse(apply_css(fit_tokens, val), target_va)
        except Exception as e:  # noqa: BLE001
            print(f"SKIP {lut_id}: fit lỗi {e}")
            continue
        accepted = fit_va < 0.7 * cur_va
        report.append({
            "id": lut_id, "css_old": css_map[lut_id], "css_new": fmt_css(fit_tokens),
            "rmse_old_val": round(cur_va, 2), "rmse_new_val": round(fit_va, 2),
            "accepted": accepted,
        })
        if accepted:
            new_entries[lut_id] = fmt_css(fit_tokens)
        print(f"{lut_id}: cũ {cur_va:.2f} -> mới {fit_va:.2f} {'✅' if accepted else '—'}")

    olds = np.array([r["rmse_old_val"] for r in report])
    news = np.array([r["rmse_new_val"] if r["accepted"] else r["rmse_old_val"] for r in report])
    print(f"\nLUT đo được: {len(report)}, chấp nhận fit: {len(new_entries)}")
    print(f"RMSE trung bình (0-255/kênh, held-out): cũ {olds.mean():.2f} -> mới {news.mean():.2f}")
    print(f"RMSE lớn nhất: cũ {olds.max():.2f} -> mới {news.max():.2f}")

    out_path = REPO / "apps/web/scripts/fit-lut-css-report.json"
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"Báo cáo: {out_path}")
    if apply:
        lines = text.splitlines(keepends=True)
        # 1) ghi entry fit đạt ngưỡng vào occurrence CUỐI (giá trị production)
        for lut_id, css in new_entries.items():
            idxs = [i for i, ln in enumerate(lines)
                    if re.match(rf'\s*"{re.escape(lut_id)}":', ln)]
            if not idxs:
                continue
            indent = re.match(r"(\s*)", lines[idxs[-1]]).group(1)
            lines[idxs[-1]] = f'{indent}"{lut_id}": "{css}",\n'
        # 2) dọn mọi key trùng còn lại TRONG KHỐI LUT_CSS (giữ occurrence
        # cuối = giá trị production đang chạy)
        start = next(i for i, ln in enumerate(lines) if "const LUT_CSS" in ln)
        end = next(i for i in range(start, len(lines)) if lines[i].rstrip() == "};")
        seen = {}
        for i in range(start + 1, end):
            mm = re.match(r'\s*"([^"]+)":', lines[i])
            if mm:
                seen.setdefault(mm.group(1), []).append(i)
        drop = []
        for _k, idxs in seen.items():
            if len(idxs) > 1:
                drop.extend(idxs[:-1])
        for i in sorted(drop, reverse=True):
            del lines[i]
        ENGINE.write_text("".join(lines))
        print(f"Đã ghi {len(new_entries)} entry fit + dọn {len(drop)} dòng trùng vào previewEngine.ts")
    elif apply:
        print("Không có entry nào đạt ngưỡng, không ghi file.")


if __name__ == "__main__":
    main()
