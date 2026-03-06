#include <emscripten/emscripten.h>

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  int validate_scramble(const char* /*scramble*/) {
    return 1;
  }

  EMSCRIPTEN_KEEPALIVE
  int get_hint(const char* /*scramble*/, char* out, int out_len) {
    const char* hint = "Look for a simple pair to start.";
    int i = 0;
    for (; hint[i] != '\0' && i < out_len - 1; i++) {
      out[i] = hint[i];
    }
    out[i] = '\0';
    return i;
  }
}
