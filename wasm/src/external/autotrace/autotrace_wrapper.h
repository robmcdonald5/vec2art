#ifndef AUTOTRACE_WRAPPER_H
#define AUTOTRACE_WRAPPER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Simplified Autotrace-style API for WASM
typedef struct {
    int width;
    int height;
    uint8_t *data; // RGB data (3 bytes per pixel)
} autotrace_bitmap_t;

typedef struct {
    double corner_threshold;     // Corner detection threshold
    double line_threshold;       // Line detection threshold  
    double line_reversion_threshold; // Line reversion threshold
    double filter_iterations;   // Smoothing iterations
    bool centerline;            // Enable centerline tracing
    bool preserve_width;        // Preserve line width information
    double despeckle_level;     // Noise removal level
} autotrace_options_t;

typedef struct {
    double x, y;
} autotrace_point_t;

typedef enum {
    AUTOTRACE_LINETO = 1,
    AUTOTRACE_CURVETO = 2  
} autotrace_segment_type_t;

typedef struct autotrace_segment {
    autotrace_segment_type_t type;
    autotrace_point_t p1, p2, p3; // Points (p1=end, p2,p3=control points for curves)
    double width;                   // Line width (for centerline mode)
    struct autotrace_segment *next;
} autotrace_segment_t;

typedef struct autotrace_spline {
    autotrace_segment_t *segments;    // Linked list of segments
    bool closed;                      // Is this spline closed?
    uint8_t color[3];                // RGB color
    struct autotrace_spline *next;   // Next spline
} autotrace_spline_t;

typedef struct {
    autotrace_spline_t *splines;     // Linked list of splines
    int spline_count;                // Number of splines
    int status;                      // Success/error status
} autotrace_spline_list_t;

// Core API functions
autotrace_options_t* autotrace_options_new(void);
void autotrace_options_free(autotrace_options_t *opts);

autotrace_bitmap_t* autotrace_bitmap_new(int width, int height);
void autotrace_bitmap_free(autotrace_bitmap_t *bm);
void autotrace_bitmap_set_pixel(autotrace_bitmap_t *bm, int x, int y, uint8_t r, uint8_t g, uint8_t b);

autotrace_spline_list_t* autotrace_image(autotrace_bitmap_t *bm, autotrace_options_t *opts);
void autotrace_spline_list_free(autotrace_spline_list_t *list);

// Utility functions
int autotrace_spline_segment_count(autotrace_spline_t *spline);

#ifdef __cplusplus
}
#endif

#endif // AUTOTRACE_WRAPPER_H