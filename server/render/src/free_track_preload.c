/**
 * free_track_preload.c — Phase 9 đợt 75, luồng C3.
 *
 * Theo dõi vòng đời các chunk 2.073.600 byte (plane Y 1080p) để trả lời
 * câu hỏi còn mở sau B7/C3: AI ĐÃ FREE chunk đích td->src.data[0] trước
 * khi vsFrameCopy crash vào nó?
 *
 * Cách làm: interpose malloc / posix_memalign / free, gọi thẳng các hàm
 * nội bộ __libc_malloc/__libc_free/__libc_memalign của glibc (không qua
 * dlsym — dlsym trong constructor/lazy-resolve sẽ đệ quy vì loader gọi
 * malloc ngay khi relocation, trước khi constructor chạy; đã crash thật
 * ở bản đầu). Ghi log mỗi lần cấp/phóng chunk đúng cỡ 2073600 kèm backtrace:
 *   - ALLOC: địa chỉ + backtrace (để nhận diện chunk nào là td->src:
 *     backtrace chứa vsFrameAllocate/vsTransformPrepare; chunk nào là
 *     buffer decoder: backtrace chứa av_malloc/av_buffer_alloc).
 *   - FREE: địa chỉ + backtrace (để biết AI free, gọi từ đâu).
 * Chỉ log đúng cỡ 2073600 (không log mọi malloc/free — ffmpeg làm hàng
 * triệu lần; tra bảng hash O(1) nên overhead nhỏ). Log file lấy từ env
 * FREE_TRACK_LOG (mặc định ./free-track.log), mở O_APPEND, chỉ dùng
 * write() để an toàn trong interposer. Chống đệ quy bằng cờ thread-local.
 *
 * Dùng kèm segv handler: LD_PRELOAD="free_track_preload.so:segv_backtrace_preload.so"
 * để khi crash, đối chiếu RDI trong regs với log FREE (địa chỉ nào đã bị
 * free trước crash, và backtrace của lần free đó).
 *
 * Biên dịch: gcc -shared -fPIC -O2 -o free_track_preload.so free_track_preload.c -rdynamic
 * Lưu ý: chỉ dùng cho thí nghiệm (không phải code production).
 */
#define _GNU_SOURCE
#include <errno.h>
#include <execinfo.h>
#include <fcntl.h>
#include <pthread.h>
#include <signal.h>
#include <stdarg.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <unistd.h>

/* Hàm thật của glibc (không bị interpose) — dùng thẳng để tránh đệ quy
   khi loader gọi malloc trong lúc relocation, trước cả constructor. */
extern void *__libc_malloc(size_t size);
extern void __libc_free(void *ptr);
extern void *__libc_memalign(size_t alignment, size_t size);

#define TRACK_SIZE 2073600UL /* plane Y 1920x1080 */
#define TABLE_SLOTS 8192

static int logfd = -1;
static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
static __thread int in_hook = 0;

typedef struct { void *addr; size_t size; int active; } entry_t;
static entry_t table[TABLE_SLOTS];

static unsigned hash_addr(void *a) {
  unsigned long x = (unsigned long)a >> 4;
  x ^= x >> 16;
  return (unsigned)(x % TABLE_SLOTS);
}

static void table_insert(void *a, size_t sz) {
  unsigned i = hash_addr(a);
  for (unsigned n = 0; n < TABLE_SLOTS; n++) {
    unsigned j = (i + n) % TABLE_SLOTS;
    if (!table[j].active) {
      table[j].addr = a;
      table[j].size = sz;
      table[j].active = 1;
      return;
    }
  }
}

static int table_remove(void *a, size_t *sz_out) {
  unsigned i = hash_addr(a);
  for (unsigned n = 0; n < TABLE_SLOTS; n++) {
    unsigned j = (i + n) % TABLE_SLOTS;
    if (!table[j].active) return 0;
    if (table[j].addr == a) {
      *sz_out = table[j].size;
      table[j].active = 0;
      table[j].addr = NULL;
      return 1;
    }
  }
  return 0;
}

static void emit_str(const char *s) {
  if (logfd < 0) return;
  size_t len = strlen(s);
  while (len > 0) {
    ssize_t w = write(logfd, s, len);
    if (w <= 0) return;
    s += (size_t)w;
    len -= (size_t)w;
  }
}

/* Ghi 1 dòng log + backtrace (dạng rút gọn: chỉ lấy symbol+offset).
   Gọi khi đang giữ lock; dùng backtrace_symbols_fd (không malloc). */
static void log_event(const char *kind, void *addr, size_t sz) {
  if (logfd < 0) return;
  char buf[256];
  int n = snprintf(buf, sizeof(buf), "[free_track] %s addr=%p size=%lu tid=%ld\n",
                   kind, addr, (unsigned long)sz, (long)gettid());
  if (n > 0) emit_str(buf);
  void *frames[16];
  int depth = backtrace(frames, 16);
  backtrace_symbols_fd(frames, depth, logfd);
}

void *malloc(size_t size) {
  if (in_hook || size != TRACK_SIZE) return __libc_malloc(size);
  in_hook = 1;
  void *p = __libc_malloc(size);
  if (p) {
    pthread_mutex_lock(&lock);
    table_insert(p, size);
    log_event("ALLOC-malloc", p, size);
    pthread_mutex_unlock(&lock);
  }
  in_hook = 0;
  return p;
}

int posix_memalign(void **memptr, size_t alignment, size_t size) {
  /* posix_memalign qua __libc_memalign (cùng ngữ nghĩa khi alignment là
     lũy thừa của 2 và >= sizeof(void*); các trường hợp khác trả EINVAL
     như posix_memalign). */
  if (alignment == 0 || (alignment & (alignment - 1)) != 0 ||
      alignment < sizeof(void *))
    return EINVAL;
  if (in_hook || size != TRACK_SIZE) {
    void *p = __libc_memalign(alignment, size);
    if (!p) return ENOMEM;
    *memptr = p;
    return 0;
  }
  in_hook = 1;
  void *p = __libc_memalign(alignment, size);
  int r = p ? 0 : ENOMEM;
  if (r == 0) {
    *memptr = p;
    pthread_mutex_lock(&lock);
    table_insert(p, size);
    log_event("ALLOC-memalign", p, size);
    pthread_mutex_unlock(&lock);
  }
  in_hook = 0;
  return r;
}

void free(void *ptr) {
  if (!ptr || in_hook) {
    __libc_free(ptr);
    return;
  }
  in_hook = 1;
  pthread_mutex_lock(&lock);
  size_t sz = 0;
  int tracked = table_remove(ptr, &sz);
  if (tracked) log_event("FREE", ptr, sz);
  pthread_mutex_unlock(&lock);
  __libc_free(ptr);
  in_hook = 0;
}

__attribute__((constructor))
static void init_free_track(void) {
  const char *path = getenv("FREE_TRACK_LOG");
  if (!path || !*path) path = "./free-track.log";
  logfd = open(path, O_WRONLY | O_CREAT | O_APPEND, 0644);
  if (logfd >= 0) {
    char buf[160];
    int n = snprintf(buf, sizeof(buf), "[free_track] === start pid=%ld ===\n",
                     (long)getpid());
    if (n > 0) emit_str(buf);
  }
}
