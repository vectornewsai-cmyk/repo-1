/* e2_pull_probe.c — Phase 9 đợt 103, luồng E2 (VCut Studio).
 *
 * Probe ĐO MỚI (B1 §8.4): ghi lại NỘI DUNG BYTE của buffer đầu tiên
 * qtdemux nhận, để đối chiếu với byte gốc của file tại cùng offset:
 * splice ở đâu, byte nào lệch, độ lệch có đúng +2 MiB không.
 *
 * Cơ chế: LD_PRELOAD shim chặn 2 hàm public của libgstreamer-1.0
 *   - gst_pad_pull_range(): qtdemux (pull mode) gọi trên sink pad của
 *     nó để lấy byte từ typefind; typefind cũng gọi trên sink pad của
 *     nó để lấy byte từ webkitwebsrc. Ghi requested offset/size + 64
 *     byte đầu của buffer trả về.
 *   - gst_pad_push(): đường push (webkitwebsrc -> typefind -> qtdemux
 *     trong phase scan). Ghi 64 byte đầu + element đích (peer).
 * Không sửa production, không sửa GStreamer/WebKit, không cần header
 * dev (mọi hàm resolve qua dlsym(RTLD_NEXT), mọi con trỏ Gst* là void*).
 * Ghi log tối thiểu (1 write() / 1 dòng, cap số pull/push mỗi element)
 * để giảm hiệu ứng thiết bị đo — TRACE logging đã ức chế bogus
 * (D1: C1 0/4 vs nhẹ 16/18, Fisher p=0,0021).
 *
 * Bật:  LD_PRELOAD=<path>/e2_pull_probe.so E2_DUMP_FILE=<file> <prog>
 * Log:  PULL <ms> pid=<pid> elem=<tên element cha của pad> req_off=<u64>
 *       req_size=<u32> flow=<int> buf_size=<n> hex=<64 byte đầu, hex>
 *       mid=<64 byte tại offset 4096 trong buffer, hoặc -> tail=<64 byte
 *       cuối buffer, hoặc -> (v2: để xem vùng splice kéo dài bao xa
 *       trong buffer lớn; chỉ khi buf_size > 1024)
 *       PUSH <ms> pid=<pid> elem=<src> peer=<dst> buf_size=<n> hex=<...>
 *       E2PROBE start pid=<pid> exe=<...>
 * Chỉ log pull của pad có element cha bắt đầu bằng "qtdemux" hoặc
 * "typefind", push của pad có element cha bắt đầu bằng "typefind" hoặc
 * "webkitwebsrc"; cap 80 pull / 40 push mỗi tên element (mỗi process).
 * Biên dịch: gcc -shared -fPIC -O2 -o e2_pull_probe.so e2_pull_probe.c -ldl -lpthread
 */
#define _GNU_SOURCE
#include <dlfcn.h>
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

static pull_range_fn real_pull_range;
static push_fn real_push;
static buffer_extract_fn real_buffer_extract;
static buffer_get_size_fn real_buffer_get_size;
static pad_get_parent_fn real_pad_get_parent;
static object_get_name_fn real_object_get_name;
static pad_get_peer_fn real_pad_get_peer;
static object_unref_fn real_object_unref;
static g_free_fn real_g_free;

static int dump_fd = -1;
static pthread_mutex_t dump_mu = PTHREAD_MUTEX_INITIALIZER;
static struct timespec t_start;
static volatile int resolved = 0;

#define PULL_CAP 80
#define PUSH_CAP 40
#define MAX_TRACK 64
typedef struct {
  char name[64];
  int pull_n;
  int push_n;
} track_t;
static track_t tracks[MAX_TRACK];
static int n_tracks = 0;

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
  resolved = 1;
}

static long now_ms(void) {
  struct timespec ts;
  clock_gettime(CLOCK_MONOTONIC, &ts);
  return (long)((ts.tv_sec - t_start.tv_sec) * 1000 +
                (ts.tv_nsec - t_start.tv_nsec) / 1000000);
}

/* Trả về slot track cho tên element (tạo mới nếu chưa có); NULL nếu đầy. */
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

/* Ghi 1 dòng duy nhất bằng 1 write() (O_APPEND) — tránh xé dòng khi nhiều
 * process WebKit cùng ghi 1 file. */
static void emit_line(const char *line) {
  if (dump_fd < 0) return;
  size_t len = strlen(line);
  pthread_mutex_lock(&dump_mu);
  ssize_t w = write(dump_fd, line, len);
  (void)w;
  pthread_mutex_unlock(&dump_mu);
}

__attribute__((constructor)) static void e2_init(void) {
  clock_gettime(CLOCK_MONOTONIC, &t_start);
  const char *path = getenv("E2_DUMP_FILE");
  if (!path || !*path) return;
  dump_fd = open(path, O_WRONLY | O_CREAT | O_APPEND, 0644);
  if (dump_fd < 0) return;
  char exe[512] = "?";
  ssize_t n = readlink("/proc/self/exe", exe, sizeof(exe) - 1);
  if (n > 0) exe[n] = '\0';
  char line[640];
  snprintf(line, sizeof(line), "E2PROBE start pid=%d exe=%s\n",
           (int)getpid(), exe);
  emit_line(line);
}

/* Lấy tên element cha của pad (caller phải g_free + unref). NULL nếu lỗi. */
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

int gst_pad_pull_range(gptr pad, unsigned long long offset, unsigned int size,
                       gptr *buffer) {
  if (!resolved) resolve_all();
  if (!real_pull_range) return -1; /* GST_FLOW_ERROR */
  /* Chỉ quan tâm pad của qtdemux / typefind. */
  gptr el = NULL;
  char *nm = parent_name(pad, &el);
  int want = nm && (starts_with(nm, "qtdemux") || starts_with(nm, "typefind"));
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
    /* v2: mẫu giữa + mẫu cuối cho buffer lớn — xem vùng splice kéo
     * dài bao xa trong buffer (đầu 64 byte không đủ kết luận). */
    char mid[129] = "-";
    char tail[129] = "-";
    if (bsz > 1024) {
      unsigned long moff = 4096;
      if (moff + 64 <= bsz) {
        unsigned long mgot =
            real_buffer_extract(*buffer, moff, tmp, 64);
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
                    starts_with(nm, "webkitwebsrc"));
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
  /* Peer (element đích) — chỉ tính khi sẽ log. */
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
