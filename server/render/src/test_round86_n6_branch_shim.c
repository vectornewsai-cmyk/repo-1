/* N6 branch shim — interpose av_frame_is_writable() to log, per call,
 * the result the vidstabtransform filter sees (1 = writable -> direct/
 * in-place branch -> libvidstab COPY branch; 0 = not writable -> separate
 * output buffer -> libvidstab NO-COPY branch, raw pointer into the decoder
 * buffer). Call order == frame order (filter_frame runs in presentation
 * order, once per frame). Log file path from env N6_BRANCH_LOG.
 * Build: gcc -shared -fPIC -O2 -o branch_shim.so branch_shim.c -ldl
 */
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

static int (*real_is_writable)(const void *frame) = NULL;
static int logfd = -1;
static unsigned long seq = 0;

__attribute__((constructor)) static void n6_init(void)
{
    const char *path = getenv("N6_BRANCH_LOG");
    if (path && *path)
        logfd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    real_is_writable = (int (*)(const void *))dlsym(RTLD_NEXT, "av_frame_is_writable");
    if (logfd >= 0) {
        char hdr[160];
        int n = snprintf(hdr, sizeof(hdr), "# N6 branch shim: real=%p logfd=%d\n",
                         (void *)real_is_writable, logfd);
        ssize_t w = write(logfd, hdr, (size_t)n);
        (void)w;
    }
}

int av_frame_is_writable(const void *frame)
{
    int r = real_is_writable ? real_is_writable(frame) : 0;
    if (logfd >= 0) {
        char buf[160];
        void *ret = __builtin_return_address(0);
        int n = snprintf(buf, sizeof(buf), "%lu %d %p\n", ++seq, r, ret);
        ssize_t w = write(logfd, buf, (size_t)n);
        (void)w;
    }
    return r;
}
