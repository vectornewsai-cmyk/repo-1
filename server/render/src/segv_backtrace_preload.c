/**
 * segv_backtrace_preload.c — Phase 9 đợt 72, luồng Z6 (gốc); đợt 73 A2 bổ sung
 * dump thanh ghi + tra /proc/self/maps.
 *
 * LD_PRELOAD library in ra backtrace khi process nhận SIGSEGV, rồi
 * re-raise signal để process vẫn chết bởi SIGSEGV (caller thấy
 * status=null, signal=SIGSEGV như bình thường).
 *
 * Vì sao cần: core dump bị chặn ở tầng container (RLIMIT_CORE hard=0,
 * root cũng không nâng được — đợt 71 Y6 §3) và gdb hunt 30 lần không
 * bắt được crash nào (Y6 pha G). LD_PRELOAD handler chỉ cài 1 signal
 * handler lúc load, không dùng ptrace nên gần như không đổi thời gian
 * tương đối của race decode→transform (khác gdb, vốn serialize thread).
 *
 * Bổ sung đợt 73 A2 (phân tích trace Z6): trace n=1 của Z6 xác định
 * được lệnh lỗi (store trong memcpy, xem docs/PHASE9_ROUND73_A2_*) nhưng
 * KHÔNG cho biết thanh ghi tại thời điểm lỗi — nên không phân biệt
 * được con trỏ đích (RDI) hay con trỏ nguồn (RSI) bị hỏng, cũng không
 * biết fault addr có nằm trong mapping nào không. Handler giờ in thêm:
 *  - regs: RIP/RDI/RSI/RDX/RSP/RBP tại thời điểm lỗi (ucontext, x86_64);
 *  - fault addr == RDI (lỗi ghi vào đích) hay == RSI (lỗi đọc từ nguồn);
 *  - dòng /proc/self/maps chứa fault addr, hoặc "NOT in any mapping"
 *    (đích/source đã bị munmap — vd buffer mmap lớn đã free).
 * Định dạng backtrace cũ giữ nguyên (dòng đầu + các frame), chỉ thêm
 * các dòng "[segv_backtrace] regs: ..." / "maps: ..." sau đó, để
 * harness cũ (regex +0x...) vẫn trích được như trước.
 *
 * Giới hạn (trung thực): backtrace() không phải async-signal-safe
 * tuyệt đối (nhưng là cách làm chuẩn trong thực tế); ffmpeg và các .so
 * đều stripped nên backtrace chỉ cho tên symbol dynamic gần nhất +
 * offset, không cho tên hàm static (vd vsDoTransform trong
 * vf_vidstabtransform.c) — vẫn đủ để xác định crash nằm trong
 * libavfilter / libvidstab / libavcodec nào và ở offset nào. Đọc
 * /proc/self/maps trong handler cũng là best-effort: nếu đọc lỗi thì
 * chỉ in regs, không làm sai lệch hành vi chết bởi SIGSEGV.
 *
 * Bổ sung đợt 75 C3 (phân tích regs+maps đợt 74 B7): handler giờ in thêm
 * CỬA SỔ maps quanh fault/RDI/RSI — mapping chứa địa chỉ, hoặc lỗ hổng
 * bao quanh (prev_end..next_start) kèm kích thước lỗ. Để phân biệt
 * chunk đích bị munmap TOÀN BỘ (lỗ ~2 MB = 507 trang của plane Y 1080p)
 * với chỉ mất trang cuối (lỗ 4 KiB), và kiểm tra nguồn RSI còn mapped
 * không. Tra MỘT lần, TRƯỚC backtrace() (lý do như A2).
 *
 * Biên dịch: gcc -shared -fPIC -O2 -o segv_backtrace_preload.so segv_backtrace_preload.c -rdynamic
 * Dùng: LD_PRELOAD=/đường/dẫn/segv_backtrace_preload.so ffmpeg …
 */
#define _GNU_SOURCE
#include <signal.h>
#include <execinfo.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <fcntl.h>
#ifdef __x86_64__
#include <ucontext.h>
#endif

static void emit_str(const char *s) {
  size_t len = strlen(s);
  while (len > 0) {
    ssize_t w = write(STDERR_FILENO, s, len);
    if (w <= 0) return;
    s += (size_t)w;
    len -= (size_t)w;
  }
}

/* Đọc số hex (dừng ở ký tự không phải hex), trả về giá trị + con trỏ sau số. */
static const char *parse_hex(const char *p, unsigned long *out) {
  unsigned long v = 0;
  int n = 0;
  while ((*p >= '0' && *p <= '9') || (*p >= 'a' && *p <= 'f') ||
         (*p >= 'A' && *p <= 'F')) {
    v = (v << 4) +
        (unsigned long)(*p <= '9' ? *p - '0' : (*p <= 'F' ? *p - 'A' + 10 : *p - 'a' + 10));
    p++;
    n++;
  }
  *out = v;
  return n > 0 ? p : 0;
}

/* Tìm dòng /proc/self/maps chứa addr; in dòng đó (cắt ngắn), hoặc báo
   "NOT in any mapping". Best-effort: mọi lỗi đọc đều bỏ qua lặng lẽ
   (đã có regs + backtrace), không bao giờ làm handler treo. */
static void emit_maps_line(unsigned long addr) {
  int fd = open("/proc/self/maps", O_RDONLY);
  if (fd < 0) return;
  static char chunk[4096];
  static char line[512];
  size_t linelen = 0;
  int found = 0;
  for (;;) {
    ssize_t r = read(fd, chunk, sizeof(chunk));
    if (r <= 0) break;
    for (ssize_t i = 0; i < r && !found; i++) {
      char c = chunk[i];
      if (c == '\n') {
        line[linelen] = '\0';
        unsigned long start = 0, end = 0;
        const char *p = parse_hex(line, &start);
        if (p && *p == '-') {
          p = parse_hex(p + 1, &end);
          if (p && addr >= start && addr < end) {
            char buf[640];
            int n = snprintf(buf, sizeof(buf),
                             "[segv_backtrace] maps: fault addr in mapping: %s\n", line);
            if (n > 0) emit_str(buf);
            found = 1;
          }
        }
        linelen = 0;
      } else if (linelen + 1 < sizeof(line)) {
        line[linelen++] = c;
      }
    }
    if (found) break;
  }
  close(fd);
  if (!found) {
    char buf[160];
    int n = snprintf(buf, sizeof(buf),
                     "[segv_backtrace] maps: fault addr 0x%lx NOT in any mapping (unmapped)\n",
                     addr);
    if (n > 0) emit_str(buf);
  }
}

/* Đợt 75 C3: tra CỬA SỔ maps quanh 3 địa chỉ (fault, RDI, RSI) trong MỘT
   lần đọc /proc/self/maps, TRƯỚC backtrace(). Với mỗi địa chỉ in một dòng:
   - IN  start-end perms: địa chỉ còn nằm trong mapping (kèm perms);
   - HOLE prev_end..next_start, hole=<số byte>: địa chỉ nằm trong lỗ hổng
     (đã munmap / chưa từng map), kèm khoảng cách từ địa chỉ tới 2 biên.
   Dùng để phân biệt chunk đích mất toàn bộ (lỗ ~2.076.672 byte = 507 trang)
   với chỉ mất trang cuối (lỗ 4.096 byte). Best-effort như emit_maps_line. */
static void emit_maps_windows(unsigned long fault, unsigned long rdi,
                              unsigned long rsi) {
  int fd = open("/proc/self/maps", O_RDONLY);
  if (fd < 0) return;
  static char chunk[4096];
  static char line[512];
  size_t linelen = 0;
  unsigned long addrs[3];
  const char *names[3] = {"fault", "RDI", "RSI"};
  addrs[0] = fault;
  addrs[1] = rdi;
  addrs[2] = rsi;
  /* Mỗi địa chỉ: mapping chứa nó (nếu có) + biên lỗ gần nhất 2 phía
     + tên mapping kề (vd "[heap]", "" = anonymous). Tên giúp phân biệt
     chunk nằm trong heap/arena (prev=[heap]) với chunk mmap riêng. */
  unsigned long in_start[3] = {0, 0, 0}, in_end[3] = {0, 0, 0};
  unsigned long prev_end[3] = {0, 0, 0}, next_start[3] = {0, 0, 0};
  char perms[3][8];
  char in_name[3][48], prev_name[3][48], next_name[3][48];
  int in_map[3] = {0, 0, 0};
  for (int k = 0; k < 3; k++) {
    perms[k][0] = '\0';
    in_name[k][0] = '\0';
    prev_name[k][0] = '\0';
    next_name[k][0] = '\0';
  }
  for (;;) {
    ssize_t r = read(fd, chunk, sizeof(chunk));
    if (r <= 0) break;
    for (ssize_t i = 0; i < r; i++) {
      char c = chunk[i];
      if (c == '\n') {
        line[linelen] = '\0';
        unsigned long start = 0, end = 0;
        const char *p = parse_hex(line, &start);
        if (p && *p == '-') {
          p = parse_hex(p + 1, &end);
          if (p && *p == ' ') {
            /* perms: 4 ký tự sau khoảng trắng (vd "rw-p"), cắt ở khoảng trắng tiếp */
            const char *q = p + 1;
            char pb[8];
            int pi = 0;
            while (*q && *q != ' ' && pi < 7) pb[pi++] = *q++;
            pb[pi] = '\0';
            /* pathname: sau perms còn 3 field (offset, dev, inode) rồi tới
               tên (có thể rỗng = anonymous). Lấy tối đa 47 ký tự. */
            char pn[48];
            {
              const char *s = q;
              int field;
              for (field = 0; field < 3; field++) {
                while (*s == ' ') s++;
                while (*s && *s != ' ') s++;
              }
              while (*s == ' ') s++;
              int ni = 0;
              while (*s && ni < 47) pn[ni++] = *s++;
              pn[ni] = '\0';
            }
            for (int k = 0; k < 3; k++) {
              unsigned long a = addrs[k];
              if (a >= start && a < end) {
                in_map[k] = 1;
                in_start[k] = start;
                in_end[k] = end;
                size_t pl = strlen(pb);
                if (pl >= sizeof(perms[k])) pl = sizeof(perms[k]) - 1;
                memcpy(perms[k], pb, pl);
                perms[k][pl] = '\0';
                size_t nl = strlen(pn);
                if (nl >= sizeof(in_name[k])) nl = sizeof(in_name[k]) - 1;
                memcpy(in_name[k], pn, nl);
                in_name[k][nl] = '\0';
              } else if (end <= a && end > prev_end[k]) {
                prev_end[k] = end;
                size_t nl = strlen(pn);
                if (nl >= sizeof(prev_name[k])) nl = sizeof(prev_name[k]) - 1;
                memcpy(prev_name[k], pn, nl);
                prev_name[k][nl] = '\0';
              } else if (start > a && (next_start[k] == 0 || start < next_start[k])) {
                next_start[k] = start;
                size_t nl = strlen(pn);
                if (nl >= sizeof(next_name[k])) nl = sizeof(next_name[k]) - 1;
                memcpy(next_name[k], pn, nl);
                next_name[k][nl] = '\0';
              }
            }
          }
        }
        linelen = 0;
      } else if (linelen + 1 < sizeof(line)) {
        line[linelen++] = c;
      }
    }
  }
  close(fd);
  for (int k = 0; k < 3; k++) {
    char buf[512];
    int n;
    if (in_map[k]) {
      n = snprintf(buf, sizeof(buf),
                   "[segv_backtrace] maps-window: %s=0x%lx IN 0x%lx-0x%lx %s %s\n",
                   names[k], addrs[k], in_start[k], in_end[k], perms[k],
                   in_name[k][0] ? in_name[k] : "anon");
    } else {
      unsigned long hole = (next_start[k] > prev_end[k])
                               ? (next_start[k] - prev_end[k])
                               : 0;
      n = snprintf(buf, sizeof(buf),
                   "[segv_backtrace] maps-window: %s=0x%lx HOLE prev_end=0x%lx "
                   "next_start=0x%lx hole=%lu (0x%lx) prev=%s next=%s %s-prev_end=+%lu next_start-%s=+%lu\n",
                   names[k], addrs[k], prev_end[k], next_start[k], hole, hole,
                   prev_name[k][0] ? prev_name[k] : "anon",
                   next_name[k][0] ? next_name[k] : "anon",
                   names[k], (unsigned long)(addrs[k] - prev_end[k]),
                   names[k],
                   next_start[k] > addrs[k]
                       ? (unsigned long)(next_start[k] - addrs[k])
                       : 0);
    }
    if (n > 0) emit_str(buf);
  }
}

static void segv_handler(int sig, siginfo_t *info, void *ucontext) {
  (void)ucontext;
  char buf[256];
  int n = snprintf(buf, sizeof(buf),
    "\n[segv_backtrace] caught signal %d (%s), fault addr=%p — backtrace:\n",
    sig, strsignal(sig), info ? info->si_addr : (void *)0);
  if (n > 0) {
    ssize_t w = write(STDERR_FILENO, buf, (size_t)n);
    (void)w;
  }
  void *frames[64];
  /* Đợt 75 C3: tra maps TRƯỚC backtrace() — backtrace() lần đầu tiên
     load lười libgcc_s.so.1, và mapping mới này có thể rơi đúng vào
     trang vừa fault (đã thấy thật ở A2) khiến kết luận "còn mapped" bị
     sai. Cả 2 lần tra maps (dòng fault + cửa sổ fault/RDI/RSI) đều làm
     ở đây, trước mọi backtrace(). */
  if (info) {
    emit_maps_line((unsigned long)info->si_addr);
#ifdef __x86_64__
    if (ucontext) {
      ucontext_t *uc0 = (ucontext_t *)ucontext;
      emit_maps_windows((unsigned long)info->si_addr,
                        (unsigned long)uc0->uc_mcontext.gregs[REG_RDI],
                        (unsigned long)uc0->uc_mcontext.gregs[REG_RSI]);
    }
#endif
  }
  int depth = backtrace(frames, 64);
  backtrace_symbols_fd(frames, depth, STDERR_FILENO);
#ifdef __x86_64__
  /* Đợt 73 A2: dump thanh ghi + tra maps — để lần crash sau phân biệt
     được đích (RDI) hay nguồn (RSI) bị hỏng và buffer còn mapped không. */
  if (ucontext && info) {
    ucontext_t *uc = (ucontext_t *)ucontext;
    unsigned long rip = (unsigned long)uc->uc_mcontext.gregs[REG_RIP];
    unsigned long rdi = (unsigned long)uc->uc_mcontext.gregs[REG_RDI];
    unsigned long rsi = (unsigned long)uc->uc_mcontext.gregs[REG_RSI];
    unsigned long rdx = (unsigned long)uc->uc_mcontext.gregs[REG_RDX];
    unsigned long rsp = (unsigned long)uc->uc_mcontext.gregs[REG_RSP];
    unsigned long rbp = (unsigned long)uc->uc_mcontext.gregs[REG_RBP];
    unsigned long fault = (unsigned long)info->si_addr;
    /* si_code phân biệt "địa chỉ không mapped" (MAPERR) với "không có
       quyền truy cập" (ACCERR) — vd ghi vào vùng chỉ đọc. */
    const char *code =
      info->si_code == SEGV_MAPERR ? "MAPERR (dia chi khong mapped)" :
      info->si_code == SEGV_ACCERR ? "ACCERR (khong co quyen truy cap)" :
                                     "si_code khac";
    /* Chỉ kết luận đích/nguồn khi fault KHỚP CHÍNH XÁC thanh ghi (lệnh
       lỗi truy cập đúng địa chỉ trong thanh ghi). Các trường hợp khác
       (vd memcpy ERMS copy ngược: lỗi ở store cuối vùng đích, fault =
       dest+n-0x80, RDI vẫn ở đầu vùng) KHÔNG ép kết luận — in offset
       để người đọc tự đối chiếu: fault-RDI / fault-RSI. */
    const char *side =
      fault == rdi ? "== RDI (ghi vao dich — vd memcpy dest)" :
      fault == rsi ? "== RSI (doc tu nguon — vd memcpy src)" :
                     "khac RDI/RSI (xem offset duoi)";
    /* rbuf 512 byte: khối 3 dòng này dài ~330 ký tự, buf[256] chung
       sẽ cắt cụt dòng offsets (lỗi A2: đã từng cắt mất). */
    char rbuf[512];
    n = snprintf(rbuf, sizeof(rbuf),
      "[segv_backtrace] regs: RIP=0x%lx RDI=0x%lx RSI=0x%lx RDX=0x%lx RSP=0x%lx RBP=0x%lx\n"
      "[segv_backtrace] fault addr=0x%lx %s, si_code=%d (%s)\n"
      "[segv_backtrace] offsets: fault-RDI=%+ld (0x%lx) fault-RSI=%+ld (0x%lx)\n",
      rip, rdi, rsi, rdx, rsp, rbp, fault, side,
      info->si_code, code,
      (long)(fault - rdi), (unsigned long)(fault - rdi),
      (long)(fault - rsi), (unsigned long)(fault - rsi));
    if (n > 0) emit_str(rbuf);
    /* (maps đã tra ở đầu handler, trước backtrace — xem chú thích trên;
       không tra lại ở đây vì backtrace() có thể đã load lười libgcc_s
       lên đúng trang vừa fault.) */
  }
#endif
  /* Re-raise với handler mặc định để process vẫn chết bởi đúng signal
     (caller thấy status=null, signal=SIGSEGV — không biến crash thành
     exit bình thường). */
  signal(sig, SIG_DFL);
  raise(sig);
}

__attribute__((constructor))
static void install_segv_handler(void) {
  struct sigaction sa;
  memset(&sa, 0, sizeof(sa));
  sa.sa_sigaction = segv_handler;
  sa.sa_flags = SA_SIGINFO | SA_RESETHAND;
  sigemptyset(&sa.sa_mask);
  sigaction(SIGSEGV, &sa, NULL);
}
