#!/usr/bin/env bash
# ci-local.sh — Chạy cục bộ các bước của .github/workflows/ci-security.yml
# (đợt 67 U9; xem docs/PHASE9_ROUND67_U9_CI_SECURITY_LIMITS.md).
#
# Mục đích: dự đoán lần chạy CI thật đầu tiên trên GitHub sẽ xanh hay đỏ,
# TRƯỚC khi file workflow được user thêm qua web GitHub (quyền App vẫn 403).
#
# Các bước mô phỏng đúng workflow (thứ tự như file YAML):
#   0. YAML parse của ci-security.yml (bước kiểm tra thêm, local-only)
#   1. Pin check: 5 requirements.txt mọi pin đều `==` + 3 package-lock.json
#      tồn tại (điều kiện để workflow quét đúng phạm vi như thiết kế)
#   2. npm audit --audit-level=high ×3 (root workspaces, mcp-server, cli)
#   3. pip-audit ×5 requirements (caption, tts, reframe, bgremove, tracking)
#   4. Secret scan local-only — BƯỚC THÊM, workflow KHÔNG có bước này
#      (workflow ghi rõ: quét secret dùng GitHub secret scanning ở repo
#      settings). Chỉ grep mẫu token/private-key độ tin cậy cao.
#
# Giới hạn đã biết trên VM này (verify 08/11/2026, đợt 66 T10 + đợt 67 U9;
# cập nhật 09/11/2026, đợt 69 W1/W7 + đợt 70 X9):
#   - `npm audit` bị chặn 403 policy_denied (policy registry nội bộ
#     zz_managed_internal_spaces_package_registries) → bước 2 báo BLOCKED,
#     KHÔNG phải PASS/FAIL. CVE npm chỉ đo được khi chạy trên GitHub.
#     Verify lại 09/11 (X9, lần thứ 4 liên tiếp kể từ 20/10).
#   - Quét CVE npm qua OSV API (bulk query 3 lockfile, 490 name@version)
#     cũng CHƯA có số: đợt 69 W1 thử 3 lần đều ReadTimeout 300 s ở
#     api.osv.dev:443 (xem hidden_files/round69-w1-osv-npm.txt). Vì vậy
#     script này KHÔNG thêm bước OSV-npm (sẽ treo hàng chục phút mỗi lần
#     chạy mà không cho số); chỉ đo CVE npm trên runner GitHub.
#   - pip-audit chạy được qua OSV API (không bị chặn) → bước 3 cho số thật.
#     Trạng thái 09/11 (X9): caption/reframe/tracking sạch; bgremove SẠCH
#     (66 → 0 sau bump U8: rembg 2.0.87 + Pillow 13.0.0, verify lại W1);
#     tts còn 39 advisory (toàn Pillow 12.3.0, gradio kẹp pillow<13 —
#     W7 đã chứng minh không bump được, chờ gradio gỡ kẹp).
#   - pip-audit 2.10.1: cài vào venv tạm /tmp/vcut-ci-local-venv (ngoài repo).
#     Venv này KHÔNG đưa vào batch stage. Lưu ý: /tmp là tmpfs, venv mất
#     sau restart (verify 09/11 X9: venv đợt 67 đã mất, script tự tạo lại).
#
# Exit code: 0 = mọi bước chạy được đều PASS; 1 = có ít nhất 1 bước FAIL;
#            2 = có bước BLOCKED và không có bước FAIL nào.
# Cách chạy: bash scripts/ci-local.sh   (từ thư mục gốc repo)
#   Biến môi trường: CI_LOCAL_VENV (đường dẫn venv pip-audit, mặc định
#   /tmp/vcut-ci-local-venv), CI_LOCAL_KEEP_VENV=1 để giữ venv sau khi chạy.

set -u
cd "$(dirname "$0")/.." || exit 1

REPO_ROOT="$(pwd)"
VENV_DIR="${CI_LOCAL_VENV:-/tmp/vcut-ci-local-venv}"
PIP_AUDIT_VERSION="2.10.1"   # bản đã verify qua OSV ở đợt 66 T10 / đợt 67 U9
WORKFLOW=".github/workflows/ci-security.yml"

PASS=0; FAIL=0; BLOCKED=0; SKIPPED=0

step() { # step <name> <status: PASS|FAIL|BLOCKED|SKIPPED> <detail>
  printf '[ci-local] %-28s %-8s %s\n' "$1" "$2" "$3"
  case "$2" in
    PASS) PASS=$((PASS+1)) ;;
    FAIL) FAIL=$((FAIL+1)) ;;
    BLOCKED) BLOCKED=$((BLOCKED+1)) ;;
    *) SKIPPED=$((SKIPPED+1)) ;;
  esac
}

echo "[ci-local] repo: $REPO_ROOT"
echo "[ci-local] workflow: $WORKFLOW"
echo "[ci-local] pip-audit venv: $VENV_DIR (pin $PIP_AUDIT_VERSION)"

# --- Bước 0: YAML parse -------------------------------------------------
if python3 -c "import yaml,sys; yaml.safe_load(open('$WORKFLOW')); print('yaml ok')" >/dev/null 2>&1; then
  JOBS=$(python3 -c "import yaml; d=yaml.safe_load(open('$WORKFLOW')); print(','.join(sorted(d['jobs'].keys())))")
  step "yaml-parse" PASS "jobs: $JOBS"
else
  step "yaml-parse" FAIL "khong parse duoc $WORKFLOW (xem stderr)"
fi

# --- Bước 1: pin check --------------------------------------------------
PIN_FAIL=""
for req in server/caption/requirements.txt server/tts/requirements.txt \
           server/reframe/requirements.txt server/bgremove/requirements.txt \
           server/tracking/requirements.txt; do
  if [ ! -f "$req" ]; then PIN_FAIL="$PIN_FAIL missing:$req"; continue; fi
  # mọi dòng pin (không comment, không trống) phải chứa ==
  BAD=$(grep -vE '^\s*(#|$)' "$req" | grep -v '==' || true)
  [ -n "$BAD" ] && PIN_FAIL="$PIN_FAIL $req:unpinned:$(echo "$BAD" | head -1)"
done
for lock in package-lock.json mcp-server/package-lock.json cli/package-lock.json; do
  [ ! -f "$lock" ] && PIN_FAIL="$PIN_FAIL missing:$lock"
done
if [ -z "$PIN_FAIL" ]; then
  step "pin-check" PASS "5 requirements toan pin ==, 3 lockfile ton tai"
else
  step "pin-check" FAIL "$PIN_FAIL"
fi

# --- Bước 2: npm audit ×3 ----------------------------------------------
for dir in "." "mcp-server" "cli"; do
  LABEL="npm-audit:${dir:-root}"
  [ "$dir" = "." ] && LABEL="npm-audit:root"
  OUT=$(cd "$dir" && npm audit --audit-level=high 2>&1)
  RC=$?
  if [ $RC -eq 0 ]; then
    step "$LABEL" PASS "exit 0, khong co CVE high/critical"
  elif echo "$OUT" | grep -q "policy_denied\|403 Forbidden"; then
    step "$LABEL" BLOCKED "403 policy_denied (registry noi bo chan endpoint npm audit) — khong do duoc local, chi do duoc tren GitHub"
  else
    VULN=$(echo "$OUT" | grep -E "vulnerabilit" | head -1)
    step "$LABEL" FAIL "exit $RC ${VULN:-xem output}"
  fi
done

# --- Bước 3: pip-audit ×5 ----------------------------------------------
if [ ! -x "$VENV_DIR/bin/pip-audit" ]; then
  echo "[ci-local] tao venv pip-audit tai $VENV_DIR ..."
  python3 -m venv "$VENV_DIR" 2>/dev/null
  "$VENV_DIR/bin/pip" install -q "pip-audit==$PIP_AUDIT_VERSION" 2>&1 | tail -2
fi
if [ -x "$VENV_DIR/bin/pip-audit" ]; then
  PA_VER=$("$VENV_DIR/bin/pip-audit" --version 2>/dev/null | head -1)
  echo "[ci-local] pip-audit: $PA_VER"
  for req in server/caption/requirements.txt server/tts/requirements.txt \
             server/reframe/requirements.txt server/bgremove/requirements.txt \
             server/tracking/requirements.txt; do
    NAME=$(basename "$(dirname "$req")")
    OUT=$("$VENV_DIR/bin/pip-audit" --requirement "$req" 2>&1)
    RC=$?
    if [ $RC -eq 0 ]; then
      step "pip-audit:$NAME" PASS "sach — No known vulnerabilities found"
    else
      # pip-audit in: "Found N known vulnerabilities in M package(s)" + bang
      COUNT=$(echo "$OUT" | grep -oE "Found [0-9]+ known vulnerabilities" | grep -oE "[0-9]+" | head -1)
      [ -z "$COUNT" ] && COUNT="?"
      PKGS=$(echo "$OUT" | awk '$2 ~ /^[0-9]+\./ {print $1}' | sort -u | tr '\n' ',' | sed 's/,$//')
      step "pip-audit:$NAME" FAIL "exit $RC — $COUNT advisory, package: ${PKGS:-?} (chi tiet: chay lai pip-audit --requirement $req)"
    fi
  done
else
  for NAME in caption tts reframe bgremove tracking; do
    step "pip-audit:$NAME" BLOCKED "khong cai duoc pip-audit vao $VENV_DIR"
  done
fi

# --- Bước 4: secret scan local-only (THÊM, workflow KHÔNG có) -----------
# Chỉ mẫu độ tin cậy cao; loại node_modules, venv, dist, build, .git và
# mọi đường dẫn site-packages (code thư viện bên thứ ba đã đóng gói).
# ALLOWLIST (giá trị giả có chủ ý trong test fixture, KHÔNG phải secret thật):
#   - ghp_abcdefghijklmnopqrstuvwx : token mẫu trong
#     server/bridge/test/test-error-detail.cjs:48 (chuỗi alphabet tuần tự,
#     dùng để test logic redact — xem test "không còn ghp_ token mẫu").
SCAN_EXCLUDES="--exclude-dir=node_modules --exclude-dir=.venv --exclude-dir=.venv2 --exclude-dir=dist --exclude-dir=build --exclude-dir=slim-venv --exclude-dir=.git --exclude-dir=.cache"
ALLOWLIST='ghp_abcdefghijklmnopqrstuvwx'
# shellcheck disable=SC2086
HITS=$(grep -rInE --binary-files=without-match $SCAN_EXCLUDES \
  -e 'ghp_[A-Za-z0-9]{20,}' -e 'gho_[A-Za-z0-9]{20,}' -e 'github_pat_[A-Za-z0-9_]{20,}' \
  -e 'AKIA[0-9A-Z]{16}' -e '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----' \
  -e 'sk-live-[A-Za-z0-9]{10,}' -e 'xox[baprs]-[A-Za-z0-9-]{10,}' \
  -e 'AIza[0-9A-Za-z_-]{35}' \
  -- . 2>/dev/null | grep -v 'site-packages/' | grep -vF "$ALLOWLIST" | grep -v '^./scripts/ci-local.sh' || true)
ALLOWLISTED=$(grep -rInE --binary-files=without-match $SCAN_EXCLUDES \
  -e "$ALLOWLIST" -- . 2>/dev/null | wc -l)
if [ -z "$HITS" ]; then
  NOTE="khong thay token/private-key mau tren (grep mau do tin cay cao)"
  [ "$ALLOWLISTED" -gt 0 ] && NOTE="$NOTE; da bo qua $ALLOWLISTED dong allowlist (token mau trong test fixture)"
  step "secret-scan:local-only" PASS "$NOTE"
else
  echo "$HITS" | head -20
  step "secret-scan:local-only" FAIL "$(echo "$HITS" | wc -l) dong trung mau — xem tren"
fi

# --- Tổng kết ------------------------------------------------------------
echo "[ci-local] SUMMARY: PASS=$PASS FAIL=$FAIL BLOCKED=$BLOCKED SKIPPED=$SKIPPED"
if [ "$FAIL" -gt 0 ]; then
  echo "[ci-local] KET LUAN: DO — co buoc FAIL (xem tren). Tren GitHub, job tuong ung cung se do."
  exit 1
elif [ "$BLOCKED" -gt 0 ]; then
  echo "[ci-local] KET LUAN: KHONG XAC DINH HOAN TOAN — co buoc BLOCKED (npm audit bi chan local). Cac buoc chay duoc deu PASS."
  exit 2
else
  echo "[ci-local] KET LUAN: XANH — lan chay CI that dau tien co co hoi xanh."
  exit 0
fi
