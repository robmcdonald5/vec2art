#ifndef POTRACE_WRAPPER_H
#define POTRACE_WRAPPER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Simplified Potrace-style API for WASM
typedef struct {
    int width;
    int height;
    uint8_t *data; // 1-bit data (0 or 255)
} potrace_bitmap_t;

typedef struct {
    double turdsize;        // Filter speckles of this many pixels
    double turnpolicy;      // How to resolve ambiguities
    double alphamax;        // Corner threshold
    bool opticurve;         // Use Bezier curves
    double opttolerance;    // Curve optimization tolerance
} potrace_param_t;

typedef struct {
    double x, y;
} potrace_point_t;

typedef enum {
    POTRACE_CORNER = 1,
    POTRACE_CURVETO = 2
} potrace_segment_type_t;

typedef struct potrace_segment {
    potrace_segment_type_t type;
    potrace_point_t c[3]; // Control points (up to 3 for cubic curves)
    struct potrace_segment *next;
} potrace_segment_t;

typedef struct potrace_path {
    potrace_segment_t *curve;   // Linked list of curve segments
    struct potrace_path *next;  // Next path
    bool sign;                  // '+' or '-' (outer or inner path)
    double area;               // Area of path
} potrace_path_t;

typedef struct {
    potrace_path_t *plist;     // Linked list of paths
    int status;                // Success/error status
} potrace_state_t;

// Core API functions
potrace_param_t* potrace_param_default(void);
void potrace_param_free(potrace_param_t *p);

potrace_bitmap_t* potrace_bitmap_new(int width, int height);
void potrace_bitmap_free(potrace_bitmap_t *bm);
void potrace_bitmap_set_pixel(potrace_bitmap_t *bm, int x, int y, bool value);

potrace_state_t* potrace_trace(potrace_param_t *param, potrace_bitmap_t *bm);
void potrace_state_free(potrace_state_t *st);

// Utility functions for converting to SVG-style paths
int potrace_path_count(potrace_path_t *path);
potrace_segment_t* potrace_path_get_curve(potrace_path_t *path);

#ifdef __cplusplus
}
#endif

#endif // POTRACE_WRAPPER_H