#!/usr/bin/env python3
"""Bổ sung cho analyze-82j3-deint-fps.py — đợt 82 J3.
- Fisher exact + Welch t-test: code mới (15 lần: G1 3 + H6 2 + I5 5 + J3 5)
  vs code cũ (4 lần: F1 3 + H6 revert 1).
- H-A: kiểm hoán vị — 2 baseline lớn nhất có phải đúng 2 lần đầu đợt?
- H-B: xu hướng baseline trong lần chạy (Pearson theo slot).
Dùng: python3 analyze-82j3-extra.py
"""
import math, statistics
from math import comb

NEW = [1.51, 0.83, 1.03, 1.28, 0.71, 0.93, 0.75, 0.80, 0.81, 0.94,
       0.68, 0.73, 1.13, 0.75, 1.13]
OLD = [0.59, 0.58, 0.55, 1.20]

def fisher_one_sided(a, b, c, d):
    # bảng [[a,b],[c,d]]; H1: tỉ lệ pass mới > cũ. p = sum_{x>=a} P(X=x)
    n1, n2 = a + b, c + d
    K = a + c  # tổng pass
    N = n1 + n2
    def hg(x):
        return comb(n1, x) * comb(n2, K - x) / comb(N, K)
    return sum(hg(x) for x in range(a, min(n1, K) + 1) if K - x <= n2 and K - x >= 0)

def welch(xs, ys):
    mx, my = statistics.mean(xs), statistics.mean(ys)
    sx2, sy2 = statistics.variance(xs), statistics.variance(ys)
    nx, ny = len(xs), len(ys)
    t = (mx - my) / math.sqrt(sx2 / nx + sy2 / ny)
    df = (sx2 / nx + sy2 / ny) ** 2 / ((sx2 / nx) ** 2 / (nx - 1) + (sy2 / ny) ** 2 / (ny - 1))
    return t, df

a = sum(1 for x in NEW if x >= 0.75); b = len(NEW) - a
c = sum(1 for x in OLD if x >= 0.75); d = len(OLD) - c
print(f"MỚI 15 lần: pass {a}/{len(NEW)} mean={statistics.mean(NEW):.3f} median={statistics.median(NEW):.3f}")
print(f"CŨ  4 lần:  pass {c}/{len(OLD)} mean={statistics.mean(OLD):.3f} median={statistics.median(OLD):.3f}")
print(f"Fisher một phía [[{a},{b}],[{c},{d}]]: p={fisher_one_sided(a, b, c, d):.4f}")
t, df = welch(NEW, OLD)
def t_pdf(x, nu):
    return math.gamma((nu + 1) / 2) / (math.sqrt(nu * math.pi) * math.gamma(nu / 2)) * (1 + x * x / nu) ** (-(nu + 1) / 2)
def t_p_two_sided(tval, nu):
    # tích phân Simpson trên [|t|, 12] của mật độ t (đuôi trên ~0 sau 12 với nu nhỏ)
    a, b, n = abs(tval), 12.0, 20000
    h = (b - a) / n
    s = t_pdf(a, nu) + t_pdf(b, nu)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * t_pdf(a + i * h, nu)
    return 2 * s * h / 3
print(f"Welch t-test trên mean từng lần: t={t:.2f} df~{df:.1f} p hai phía~{t_p_two_sided(t, df):.2f}")

# H-A: hoán vị — xác suất 2 baseline lớn nhất rơi đúng vào 2 lần đầu đợt
print("H-A hoán vị: P(2 baseline lớn nhất = đúng 2 lần đầu đợt | không có hiệu ứng thứ tự) "
      f"= 1/C(10,2) = {1/comb(10,2):.4f}")
print("  baseline 10 lần (I5+J3): 16.35, 3.16, 2.61, 1.77, 1.64, 27.35, 2.47, 0.88, 2.11, 1.56")
print("  2 lớn nhất: 27.35 (J3 lần 1) và 16.35 (I5 lần 1) — đúng 2 lần đầu đợt.")
print("  median 8 lần còn lại: 1.94; lần đầu nhanh hơn 8.4x / 14.1x so với median đó.")
