/* h2_adapter_probe.c — Phase 9 đợt 106, luồng H2 (VCut Studio).
 * Bản sao f2_adapter_probe.c (đợt 104) + 2 đổi: (1) gst_pad_pull_range
 * log thêm parent webkitwebsrc (pull do typefind khởi xướng — G6 §5:
 * shim F2 không thấy 40 pull scan của typefind) và queue2 (nếu queue2
 * nằm trong chuỗi pull webkitwebsrc->typefind thì pull_range trên src
 * pad của nó có parent=queue2 — đây là phép thử hiện diện trực tiếp);
 * (2) PULL_CAP 80->400, PUSH_CAP 40->400 để không cắt scan (~40 pull
 * typefind + pull relay của qtdemux trên mỗi instance).
 *
 * Probe ĐO MỚI (nợ LIMITS gộp đợt 103 §4 mục 2): xác định
 * dataReceived/refill nào của adapter webkitwebsrc tạo ra đoạn sai
 * +2 MiB mà E2 đã chứng minh bằng nội dung byte (luồng byte qtdemux
 * nhận = [0..3179] ++ [2MiB+3179..EOF] ++ [42821..]).
 *
 * VÌ SAO KHÔNG CHẶN TRỰC TIẾP dataReceived: WebKitWebSrc::dataReceived
 * là hàm C++ nội bộ của libwebkitgtk — `nm -D` trên
 * libwebkitgtk-6.0.so.4.20.0 KHÔNG có symbol nào cho nó (chỉ có một
 * Inspector::dataReceived không liên quan). LD_PRELOAD chỉ chặn được
 * symbol dynamic export, nên dataReceived KHÔNG chặn trực tiếp được.
 * Thay vào đó chặn API public mà dataReceived/create() dùng để nói
 * chuyện với adapter — cùng một ranh giới, cùng thông tin (refill nào,
 * lúc nào, bao nhiêu byte, nội dung gì):
 *   - gst_adapter_push()      (libgstbase, public): dataReceived đẩy
 *     chunk mạng vào m_adapter — ĐÂY LÀ REFILL.
 *   - gst_adapter_take_buffer() / gst_adapter_take(): create() lấy
 *     byte ra phục vụ pull_range — ĐÂY LÀ ĐIỂM SPLICED BYTE ĐI RA.
 *   - gst_adapter_clear() / gst_adapter_flush(): Reset/flush adapter.
 * Cộng thêm gst_pad_pull_range() + gst_pad_push() y hệt shim E2
 * (để đối chiếu pull bị splice với refill, cùng một clock).
 *
 * QUY TẶC GHI (để không ức chế bogus như TRACE):
 *  - Ghi vào buffer bộ nhớ (128 KiB), flush bằng 1 write() khi đầy
 *    + lúc process exit (destructor) — thay vì 1 write()/dòng như E2.
 *    ~8.000 event/run -> ~16 write()/run thay vì ~8.000.
 *  - Mỗi event 1 dòng ngắn: thời điểm ms (monotonic), pid, con trỏ
 *    adapter (phân biệt webkitwebsrc0 vs webkitwebsrc1), module của
 *    caller (tra return address qua /proc/self/maps — "webkitgtk" =
 *    dataReceived/create của webkitwebsrc; các adapter khác như
 *    qtdemux/typefind có caller khác nên lọc được offline),
 *    avail trước/sau, size, 16 byte đầu (hex — đủ tra file offset).
 *  - Cap 30.000 event adapter / process (không bao giờ chạm tới ở
 *    probe này: ~8.000/run).
 * v2 (đợt 104 F2L2): + chặn gst_adapter_map/unmap/copy/get_buffer/
 * peek (typefind/qtdemux đọc pull-mode bằng map+flush, không qua
 * take_buffer — F2L run1: pull splice ms=5020 nhưng 0 ATAKE ở
 * ms 5020-5030) + refresh bảng maps khi gặp caller "?" (plugin
 * GStreamer load lazy sau init nên bảng lúc init thiếu chúng).
 *
 * Bật:  LD_PRELOAD=<path>/f2_adapter_probe.so F2_DUMP_FILE=<file> <prog>
 * Log:  F2PROBE start pid=<pid> exe=<...>
 *       APUSH <ms> pid=<pid> adap=<ptr> caller=<mod> avail=<n> size=<n> hex16=<...>
 *       ATAKE <ms> pid=<pid> adap=<ptr> caller=<mod> req=<n> got=<n> avail=<n> hex16=<...>
 *       ATAKEB <ms> ... (gst_adapter_take: copy vào buffer người gọi)
 *       ACLEAR/AFLUSH <ms> pid=<pid> adap=<ptr> caller=<mod> avail=<n>
 *       PULL/PUSH ... (như shim E2)
 * Biên dịch: gcc -shared -fPIC -O2 -o f2_adapter_probe.so f2_adapter_probe.c -ldl -lpthread
 */
#define _GNU_SOURCE
#include <dlfcn.h>
#include <execinfo.h>
#include <fcntl.h>
#include <pthread.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

typedef void *gptr;
typedef int (*pull_range_fn)(gptr, unsigned long long, unsigned int, gptr *);
typedef int (*push_fn)(gptr, gptr);
typedef unsigned long (*buffer_extract_fn)(gptr, unsigned long, void *,
                                           unsigned long);
typedef unsigned long (*buffer_get_size_fn)(gptr);
typedef gptr (*pad_get_parent_fn)(gptr);
typedef char *(*object_get_name_fn)(gptr);
typedef gptr (*pad_get_peer_fn)(gptr);
typedef void (*object_unref_fn)(gptr);
typedef void (*g_free_fn)(gptr);
typedef void (*adapter_push_fn)(gptr, gptr);
typedef gptr (*adapter_take_buffer_fn)(gptr, unsigned long);
typedef unsigned long (*adapter_take_fn)(gptr, unsigned long, void *);
typedef void (*adapter_clear_fn)(gptr);
typedef void (*adapter_flush_fn)(gptr, unsigned long);
typedef unsigned long (*adapter_available_fn)(gptr);
typedef gptr (*adapter_map_fn)(gptr, unsigned long);
typedef void (*adapter_unmap_fn)(gptr);
typedef void (*adapter_copy_fn)(gptr, void *, unsigned long, unsigned long);
typedef gptr (*adapter_get_buffer_fn)(gptr, unsigned long);

static pull_range_fn real_pull_range;
static push_fn real_push;
static buffer_extract_fn real_buffer_extract;
static buffer_get_size_fn real_buffer_get_size;
static pad_get_parent_fn real_pad_get_parent;
static object_get_name_fn real_object_get_name;
static pad_get_peer_fn real_pad_get_peer;
static object_unref_fn real_object_unref;
static g_free_fn real_g_free;
static adapter_push_fn real_adapter_push;
static adapter_take_buffer_fn real_adapter_take_buffer;
static adapter_take_fn real_adapter_take;
static adapter_clear_fn real_adapter_clear;
static adapter_flush_fn real_adapter_flush;
static adapter_available_fn real_adapter_available;
static adapter_map_fn real_adapter_map;
static adapter_unmap_fn real_adapter_unmap;
static adapter_copy_fn real_adapter_copy;
static adapter_get_buffer_fn real_adapter_get_buffer;

static int dump_fd = -1;
static pthread_mutex_t dump_mu = PTHREAD_MUTEX_INITIALIZER;
static struct timespec t_start;
static volatile int resolved = 0;

/* ---- batched output: 128 KiB ring, flush khi đầy + destructor ---- */
#define OUT_CAP (128 * 1024)
static char out_buf[OUT_CAP];
static size_t out_len = 0;
static void out_flush_locked(void) {
  if (dump_fd < 0 || out_len == 0) return;
  size_t off = 0;
  while (off < out_len) {
    ssize_t w = write(dump_fd, out_buf + off, out_len - off);
    if (w <= 0) break;
    off += (size_t)w;
  }
  out_len = 0;
}
static void emit_line(const char *line) {
  if (dump_fd < 0) return;
  size_t len = strlen(line);
  pthread_mutex_lock(&dump_mu);
  if (len >= OUT_CAP) {
    out_flush_locked();
    size_t off = 0;
    while (off < len) {
      ssize_t w = write(dump_fd, line + off, len - off);
      if (w <= 0) break;
      off += (size_t)w;
    }
  } else {
    if (out_len + len > OUT_CAP) out_flush_locked();
    memcpy(out_buf + out_len, line, len);
    out_len += len;
  }
  pthread_mutex_unlock(&dump_mu);
}
__attribute__((destructor)) static void f2_fini(void) {
  pthread_mutex_lock(&dump_mu);
  out_flush_locked();
  pthread_mutex_unlock(&dump_mu);
  if (dump_fd >= 0) close(dump_fd);
}

/* ---- caller module: parse /proc/self/maps, tra return address ---- */
#define MAX_MAPS 1024
static long now_ms(void); /* forward: caller_tag dùng now_ms để throttle refresh */
typedef struct {
  unsigned long start, end;
  char name[40];
} map_t;
static map_t maps[MAX_MAPS];
static int n_maps = 0;
static void load_maps(void) {
  FILE *f = fopen("/proc/self/maps", "r");
  if (!f) return;
  char line[1024];
  while (fgets(line, sizeof(line), f)) {
    unsigned long s, e;
    char perms[8];
    char path[512] = "";
    if (sscanf(line, "%lx-%lx %7s %*s %*s %*s %511[^\n]", &s, &e, perms,
               path) < 3)
      continue;
    if (perms[2] != 'x') continue; /* chỉ mapping thực thi */
    const char *base = strrchr(path, '/');
    base = base ? base + 1 : path;
    if (!*base) continue;
    if (n_maps >= MAX_MAPS) break;
    maps[n_maps].start = s;
    maps[n_maps].end = e;
    snprintf(maps[n_maps].name, sizeof(maps[n_maps].name), "%s", base);
    n_maps++;
  }
  fclose(f);
}
static const char *caller_tag(void *ra) {
  unsigned long a = (unsigned long)ra;
  for (int i = 0; i < n_maps; i++)
    if (a >= maps[i].start && a < maps[i].end) return maps[i].name;
  /* Plugin GStreamer load LAZY (dlopen) sau khi shim init: bảng maps
   * lúc init chưa có chúng -> "?" (đã thấy ở F2L: 135/146 APUSH "?").
   * Refresh tối đa 1 lần/200ms khi gặp địa chỉ lạ. */
  static long last_refresh_ms = -1000;
  long now = now_ms();
  if (now - last_refresh_ms >= 200) {
    last_refresh_ms = now;
    int old_n = n_maps;
    n_maps = 0;
    load_maps();
    if (n_maps <= old_n && old_n > 0) {
      /* load_maps thất bại bất ngờ: giữ bảng cũ bằng cách load lại
       * (không có cách khôi phục đơn giản — chấp nhận bảng mới). */
    }
    for (int i = 0; i < n_maps; i++)
      if (a >= maps[i].start && a < maps[i].end) return maps[i].name;
  }
  return "?";
}

#define PULL_CAP 400
#define PUSH_CAP 400
#define ADAP_CAP 30000
#define MAX_TRACK 64
typedef struct {
  char name[64];
  int pull_n;
  int push_n;
} track_t;
static track_t tracks[MAX_TRACK];
static int n_tracks = 0;
static long adap_events = 0;
static int cap_hit_logged = 0;

static void resolve_all(void) {
  real_pull_range = (pull_range_fn)dlsym(RTLD_NEXT, "gst_pad_pull_range");
  real_push = (push_fn)dlsym(RTLD_NEXT, "gst_pad_push");
  real_buffer_extract =
      (buffer_extract_fn)dlsym(RTLD_NEXT, "gst_buffer_extract");
  real_buffer_get_size =
      (buffer_get_size_fn)dlsym(RTLD_NEXT, "gst_buffer_get_size");
  real_pad_get_parent =
      (pad_get_parent_fn)dlsym(RTLD_NEXT, "gst_pad_get_parent_element");
  real_object_get_name =
      (object_get_name_fn)dlsym(RTLD_NEXT, "gst_object_get_name");
  real_pad_get_peer = (pad_get_peer_fn)dlsym(RTLD_NEXT, "gst_pad_get_peer");
  real_object_unref = (object_unref_fn)dlsym(RTLD_NEXT, "gst_object_unref");
  real_g_free = (g_free_fn)dlsym(RTLD_NEXT, "g_free");
  real_adapter_push = (adapter_push_fn)dlsym(RTLD_NEXT, "gst_adapter_push");
  real_adapter_take_buffer =
      (adapter_take_buffer_fn)dlsym(RTLD_NEXT, "gst_adapter_take_buffer");
  real_adapter_take = (adapter_take_fn)dlsym(RTLD_NEXT, "gst_adapter_take");
  real_adapter_clear =
      (adapter_clear_fn)dlsym(RTLD_NEXT, "gst_adapter_clear");
  real_adapter_flush =
      (adapter_flush_fn)dlsym(RTLD_NEXT, "gst_adapter_flush");
  real_adapter_available =
      (adapter_available_fn)dlsym(RTLD_NEXT, "gst_adapter_available");
  real_adapter_map = (adapter_map_fn)dlsym(RTLD_NEXT, "gst_adapter_map");
  real_adapter_unmap =
      (adapter_unmap_fn)dlsym(RTLD_NEXT, "gst_adapter_unmap");
  real_adapter_copy =
      (adapter_copy_fn)dlsym(RTLD_NEXT, "gst_adapter_copy");
  real_adapter_get_buffer = (adapter_get_buffer_fn)dlsym(
      RTLD_NEXT, "gst_adapter_get_buffer");
  resolved = 1;
}

static long now_ms(void) {
  struct timespec ts;
  clock_gettime(CLOCK_MONOTONIC, &ts);
  return (long)((ts.tv_sec - t_start.tv_sec) * 1000 +
                (ts.tv_nsec - t_start.tv_nsec) / 1000000);
}

static track_t *track_for(const char *name) {
  for (int i = 0; i < n_tracks; i++)
    if (strcmp(tracks[i].name, name) == 0) return &tracks[i];
  if (n_tracks >= MAX_TRACK) return NULL;
  track_t *t = &tracks[n_tracks++];
  snprintf(t->name, sizeof(t->name), "%s", name);
  t->pull_n = 0;
  t->push_n = 0;
  return t;
}

static int starts_with(const char *s, const char *pfx) {
  return s && strncmp(s, pfx, strlen(pfx)) == 0;
}

static void hex_of(const unsigned char *b, unsigned long n, char *out) {
  static const char H[] = "0123456789abcdef";
  for (unsigned long i = 0; i < n; i++) {
    out[2 * i] = H[(b[i] >> 4) & 0xf];
    out[2 * i + 1] = H[b[i] & 0xf];
  }
  out[2 * n] = '\0';
}

__attribute__((constructor)) static void f2_init(void) {
  clock_gettime(CLOCK_MONOTONIC, &t_start);
  load_maps();
  const char *path = getenv("F2_DUMP_FILE");
  if (!path || !*path) return;
  dump_fd = open(path, O_WRONLY | O_CREAT | O_APPEND, 0644);
  if (dump_fd < 0) return;
  char exe[512] = "?";
  ssize_t n = readlink("/proc/self/exe", exe, sizeof(exe) - 1);
  if (n > 0) exe[n] = '\0';
  char line[640];
  snprintf(line, sizeof(line), "F2PROBE start pid=%d exe=%s maps=%d\n",
           (int)getpid(), exe, n_maps);
  emit_line(line);
}

/* Giới hạn event adapter: trả 1 khi còn quota, 0 khi hết (ghi 1 dòng). */
static int adap_quota(void) {
  long n = __sync_add_and_fetch(&adap_events, 1);
  if (n > ADAP_CAP) {
    if (!cap_hit_logged) {
      cap_hit_logged = 1;
      char line[128];
      snprintf(line, sizeof(line), "F2CAP hit pid=%d events>%d\n",
               (int)getpid(), ADAP_CAP);
      emit_line(line);
    }
    return 0;
  }
  return 1;
}

static char *parent_name(gptr pad, gptr *elem_out) {
  if (!real_pad_get_parent || !real_object_get_name) return NULL;
  gptr el = real_pad_get_parent(pad);
  if (!el) return NULL;
  char *nm = real_object_get_name(el);
  if (!nm) {
    if (real_object_unref) real_object_unref(el);
    return NULL;
  }
  if (elem_out) *elem_out = el;
  return nm;
}

static void release_name(char *nm, gptr el) {
  if (nm && real_g_free) real_g_free(nm);
  if (el && real_object_unref) real_object_unref(el);
}

/* ================= adapter hooks (refill / take) ================= */

void gst_adapter_push(gptr adapter, gptr buffer) {
  if (!resolved) resolve_all();
  if (!real_adapter_push) return;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  unsigned long bsz = 0;
  unsigned char tmp[16];
  unsigned long got = 0;
  if (buffer && real_buffer_extract && real_buffer_get_size) {
    bsz = real_buffer_get_size(buffer);
    got = real_buffer_extract(buffer, 0, tmp, bsz < 16 ? bsz : 16);
  }
  real_adapter_push(adapter, buffer);
  if (!adap_quota()) return;
  unsigned long avail =
      real_adapter_available ? real_adapter_available(adapter) : 0;
  char hx[33];
  hex_of(tmp, got, hx);
  char line[256];
  snprintf(line, sizeof(line),
           "APUSH %ld pid=%d adap=%p caller=%s avail=%lu size=%lu "
           "hex16=%s\n",
           t0, (int)getpid(), adapter, ctag, avail, bsz, hx);
  emit_line(line);
}

gptr gst_adapter_take_buffer(gptr adapter, unsigned long nbytes) {
  if (!resolved) resolve_all();
  if (!real_adapter_take_buffer) return NULL;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  unsigned long avail_before =
      real_adapter_available ? real_adapter_available(adapter) : 0;
  gptr buf = real_adapter_take_buffer(adapter, nbytes);
  if (!adap_quota()) return buf;
  unsigned long bsz = 0;
  unsigned char tmp[16];
  unsigned long got = 0;
  if (buf && real_buffer_extract && real_buffer_get_size) {
    bsz = real_buffer_get_size(buf);
    got = real_buffer_extract(buf, 0, tmp, bsz < 16 ? bsz : 16);
  }
  char hx[33];
  hex_of(tmp, got, hx);
  char line[256];
  snprintf(line, sizeof(line),
           "ATAKE %ld pid=%d adap=%p caller=%s req=%lu got=%lu "
           "avail=%lu hex16=%s\n",
           t0, (int)getpid(), adapter, ctag, nbytes, bsz, avail_before,
           hx);
  emit_line(line);
  return buf;
}

unsigned long gst_adapter_take(gptr adapter, unsigned long nbytes,
                               void *dest) {
  if (!resolved) resolve_all();
  if (!real_adapter_take) return 0;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  unsigned long avail_before =
      real_adapter_available ? real_adapter_available(adapter) : 0;
  unsigned long got = real_adapter_take(adapter, nbytes, dest);
  if (!adap_quota()) return got;
  char hx[33] = "-";
  if (dest && got >= 16) hex_of((unsigned char *)dest, 16, hx);
  else if (dest && got > 0) hex_of((unsigned char *)dest, got, hx);
  char line[256];
  snprintf(line, sizeof(line),
           "ATAKEB %ld pid=%d adap=%p caller=%s req=%lu got=%lu "
           "avail=%lu hex16=%s\n",
           t0, (int)getpid(), adapter, ctag, nbytes, got, avail_before,
           hx);
  emit_line(line);
  return got;
}

void gst_adapter_clear(gptr adapter) {
  if (!resolved) resolve_all();
  if (!real_adapter_clear) return;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  unsigned long avail_before =
      real_adapter_available ? real_adapter_available(adapter) : 0;
  real_adapter_clear(adapter);
  if (!adap_quota()) return;
  char line[256];
  snprintf(line, sizeof(line),
           "ACLEAR %ld pid=%d adap=%p caller=%s avail=%lu\n", t0,
           (int)getpid(), adapter, ctag, avail_before);
  emit_line(line);
}

void gst_adapter_flush(gptr adapter, unsigned long flush) {
  if (!resolved) resolve_all();
  if (!real_adapter_flush) return;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  unsigned long avail_before =
      real_adapter_available ? real_adapter_available(adapter) : 0;
  real_adapter_flush(adapter, flush);
  if (!adap_quota()) return;
  char line[256];
  snprintf(line, sizeof(line),
           "AFLUSH %ld pid=%d adap=%p caller=%s avail=%lu flush=%lu\n",
           t0, (int)getpid(), adapter, ctag, avail_before, flush);
  emit_line(line);
}

/* typefind/qtdemux đọc pull-mode bằng map (peek) + flush, KHÔNG qua
 * take_buffer — F2L run1 chứng minh: pull splice ở ms=5020 nhưng
 * KHÔNG có ATAKE nào ở ms 5020-5030 trên mọi adapter. Phải chặn map. */
gptr gst_adapter_map(gptr adapter, unsigned long size) {
  if (!resolved) resolve_all();
  if (!real_adapter_map) return NULL;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  unsigned long avail_before =
      real_adapter_available ? real_adapter_available(adapter) : 0;
  gptr data = real_adapter_map(adapter, size);
  if (!adap_quota()) return data;
  char hx[33] = "-";
  if (data) {
    unsigned long n = size < 16 ? size : 16;
    if (n > avail_before) n = avail_before;
    hex_of((unsigned char *)data, n, hx);
  }
  char line[256];
  snprintf(line, sizeof(line),
           "AMAP %ld pid=%d adap=%p caller=%s req=%lu avail=%lu "
           "hex16=%s\n",
           t0, (int)getpid(), adapter, ctag, size, avail_before, hx);
  emit_line(line);
  return data;
}

void gst_adapter_unmap(gptr adapter) {
  if (!resolved) resolve_all();
  if (!real_adapter_unmap) return;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  real_adapter_unmap(adapter);
  if (!adap_quota()) return;
  char line[256];
  snprintf(line, sizeof(line), "AUNMAP %ld pid=%d adap=%p caller=%s\n",
           t0, (int)getpid(), adapter, ctag);
  emit_line(line);
}

void gst_adapter_copy(gptr adapter, void *dest, unsigned long offset,
                      unsigned long size) {
  if (!resolved) resolve_all();
  if (!real_adapter_copy) return;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  unsigned long avail_before =
      real_adapter_available ? real_adapter_available(adapter) : 0;
  real_adapter_copy(adapter, dest, offset, size);
  if (!adap_quota()) return;
  char hx[33] = "-";
  if (dest && size > 0) hex_of((unsigned char *)dest, size < 16 ? size : 16, hx);
  char line[256];
  snprintf(line, sizeof(line),
           "ACOPY %ld pid=%d adap=%p caller=%s off=%lu size=%lu "
           "avail=%lu hex16=%s\n",
           t0, (int)getpid(), adapter, ctag, offset, size, avail_before,
           hx);
  emit_line(line);
}

gptr gst_adapter_get_buffer(gptr adapter, unsigned long nbytes) {
  if (!resolved) resolve_all();
  if (!real_adapter_get_buffer) return NULL;
  long t0 = now_ms();
  const char *ctag = caller_tag(__builtin_return_address(0));
  unsigned long avail_before =
      real_adapter_available ? real_adapter_available(adapter) : 0;
  gptr buf = real_adapter_get_buffer(adapter, nbytes);
  if (!adap_quota()) return buf;
  unsigned long bsz = 0;
  unsigned char tmp[16];
  unsigned long got = 0;
  if (buf && real_buffer_extract && real_buffer_get_size) {
    bsz = real_buffer_get_size(buf);
    got = real_buffer_extract(buf, 0, tmp, bsz < 16 ? bsz : 16);
  }
  char hx[33];
  hex_of(tmp, got, hx);
  char line[256];
  snprintf(line, sizeof(line),
           "AGETB %ld pid=%d adap=%p caller=%s req=%lu got=%lu "
           "avail=%lu hex16=%s\n",
           t0, (int)getpid(), adapter, ctag, nbytes, bsz, avail_before,
           hx);
  emit_line(line);
  return buf;
}

/* ================= pull/push hooks (y hệt shim E2) ================= */

int gst_pad_pull_range(gptr pad, unsigned long long offset, unsigned int size,
                       gptr *buffer) {
  if (!resolved) resolve_all();
  if (!real_pull_range) return -1;
  gptr el = NULL;
  char *nm = parent_name(pad, &el);
  int want = nm && (starts_with(nm, "qtdemux") || starts_with(nm, "typefind") ||
                    starts_with(nm, "webkitwebsrc") || starts_with(nm, "queue2"));
  track_t *tr = NULL;
  if (want) {
    pthread_mutex_lock(&dump_mu);
    tr = track_for(nm);
    int over = !tr || tr->pull_n >= PULL_CAP;
    if (tr && !over) tr->pull_n++;
    pthread_mutex_unlock(&dump_mu);
    if (over) want = 0;
  }
  long t0 = want ? now_ms() : 0;
  int flow = real_pull_range(pad, offset, size, buffer);
  if (!want) {
    release_name(nm, el);
    return flow;
  }
  char line[1024];
  if (flow == 0 && buffer && *buffer && real_buffer_extract &&
      real_buffer_get_size) {
    unsigned long bsz = real_buffer_get_size(*buffer);
    unsigned long n = bsz < 64 ? bsz : 64;
    unsigned char tmp[64];
    unsigned long got = real_buffer_extract(*buffer, 0, tmp, n);
    char hx[129];
    hex_of(tmp, got, hx);
    char mid[129] = "-";
    char tail[129] = "-";
    if (bsz > 1024) {
      unsigned long moff = 4096;
      if (moff + 64 <= bsz) {
        unsigned long mgot = real_buffer_extract(*buffer, moff, tmp, 64);
        hex_of(tmp, mgot, mid);
      }
      unsigned long tgot =
          real_buffer_extract(*buffer, bsz - 64, tmp, 64);
      hex_of(tmp, tgot, tail);
    }
    snprintf(line, sizeof(line),
             "PULL %ld pid=%d elem=%s req_off=%llu req_size=%u flow=%d "
             "buf_size=%lu hex=%s mid=%s tail=%s\n",
             t0, (int)getpid(), nm, offset, size, flow, bsz, hx, mid,
             tail);
  } else {
    snprintf(line, sizeof(line),
             "PULL %ld pid=%d elem=%s req_off=%llu req_size=%u flow=%d "
             "buf_size=- hex=- mid=- tail=-\n",
             t0, (int)getpid(), nm, offset, size, flow);
  }
  emit_line(line);
  release_name(nm, el);
  return flow;
}

int gst_pad_push(gptr pad, gptr buffer) {
  if (!resolved) resolve_all();
  if (!real_push) return -1;
  gptr el = NULL;
  char *nm = parent_name(pad, &el);
  int want = nm && (starts_with(nm, "typefind") ||
                    starts_with(nm, "webkitwebsrc") || starts_with(nm, "queue2"));
  track_t *tr = NULL;
  if (want) {
    pthread_mutex_lock(&dump_mu);
    tr = track_for(nm);
    int over = !tr || tr->push_n >= PUSH_CAP;
    if (tr && !over) tr->push_n++;
    pthread_mutex_unlock(&dump_mu);
    if (over) want = 0;
  }
  long t0 = want ? now_ms() : 0;
  char peer_nm[64] = "?";
  if (want && real_pad_get_peer) {
    gptr peer = real_pad_get_peer(pad);
    if (peer) {
      gptr pel = NULL;
      char *pnm = parent_name(peer, &pel);
      if (pnm) {
        snprintf(peer_nm, sizeof(peer_nm), "%s", pnm);
        release_name(pnm, pel);
      }
      if (real_object_unref) real_object_unref(peer);
    }
  }
  unsigned long bsz = 0;
  unsigned char tmp[64];
  unsigned long got = 0;
  if (want && buffer && real_buffer_extract && real_buffer_get_size) {
    bsz = real_buffer_get_size(buffer);
    unsigned long n = bsz < 64 ? bsz : 64;
    got = real_buffer_extract(buffer, 0, tmp, n);
  }
  int flow = real_push(pad, buffer);
  if (!want) {
    release_name(nm, el);
    return flow;
  }
  char hx[129];
  hex_of(tmp, got, hx);
  char line[512];
  snprintf(line, sizeof(line),
           "PUSH %ld pid=%d elem=%s peer=%s buf_size=%lu hex=%s\n", t0,
           (int)getpid(), nm, peer_nm, bsz, hx);
  emit_line(line);
  release_name(nm, el);
  return flow;
}
