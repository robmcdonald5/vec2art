#include "autotrace_wrapper.h"
#include <stdlib.h>
#include <string.h>
#include <math.h>

// Default options
autotrace_options_t* autotrace_options_new(void) {
    autotrace_options_t *opts = malloc(sizeof(autotrace_options_t));
    if (!opts) return NULL;
    
    opts->corner_threshold = 60.0;           // degrees
    opts->line_threshold = 0.5;              // pixel deviation
    opts->line_reversion_threshold = 0.01;   // curve straightening
    opts->filter_iterations = 4;             // smoothing passes
    opts->centerline = false;                // outline by default
    opts->preserve_width = false;            // uniform width
    opts->despeckle_level = 2.0;            // noise removal
    
    return opts;
}

void autotrace_options_free(autotrace_options_t *opts) {
    if (opts) free(opts);
}

// Bitmap management
autotrace_bitmap_t* autotrace_bitmap_new(int width, int height) {
    autotrace_bitmap_t *bm = malloc(sizeof(autotrace_bitmap_t));
    if (!bm) return NULL;
    
    bm->width = width;
    bm->height = height;
    bm->data = calloc(width * height * 3, sizeof(uint8_t));
    
    if (!bm->data) {
        free(bm);
        return NULL;
    }
    
    return bm;
}

void autotrace_bitmap_free(autotrace_bitmap_t *bm) {
    if (bm) {
        if (bm->data) free(bm->data);
        free(bm);
    }
}

void autotrace_bitmap_set_pixel(autotrace_bitmap_t *bm, int x, int y, uint8_t r, uint8_t g, uint8_t b) {
    if (x >= 0 && x < bm->width && y >= 0 && y < bm->height) {
        int idx = (y * bm->width + x) * 3;
        bm->data[idx] = r;
        bm->data[idx + 1] = g;
        bm->data[idx + 2] = b;
    }
}

// Simple edge detection for centerline tracing
static bool is_edge_pixel(autotrace_bitmap_t *bm, int x, int y, double threshold) {
    if (x <= 0 || x >= bm->width - 1 || y <= 0 || y >= bm->height - 1) {
        return false;
    }
    
    // Sobel edge detection
    int gx = 0, gy = 0;
    
    // Sobel X kernel
    gx += -1 * bm->data[((y-1) * bm->width + (x-1)) * 3];
    gx += -2 * bm->data[((y) * bm->width + (x-1)) * 3];
    gx += -1 * bm->data[((y+1) * bm->width + (x-1)) * 3];
    gx += 1 * bm->data[((y-1) * bm->width + (x+1)) * 3];
    gx += 2 * bm->data[((y) * bm->width + (x+1)) * 3];
    gx += 1 * bm->data[((y+1) * bm->width + (x+1)) * 3];
    
    // Sobel Y kernel
    gy += -1 * bm->data[((y-1) * bm->width + (x-1)) * 3];
    gy += -2 * bm->data[((y-1) * bm->width + (x)) * 3];
    gy += -1 * bm->data[((y-1) * bm->width + (x+1)) * 3];
    gy += 1 * bm->data[((y+1) * bm->width + (x-1)) * 3];
    gy += 2 * bm->data[((y+1) * bm->width + (x)) * 3];
    gy += 1 * bm->data[((y+1) * bm->width + (x+1)) * 3];
    
    double magnitude = sqrt(gx * gx + gy * gy);
    return magnitude > threshold;
}

// Simple path tracing for centerline detection
static autotrace_segment_t* trace_centerline(autotrace_bitmap_t *bm, int start_x, int start_y, 
                                           bool *visited, autotrace_options_t *opts) {
    autotrace_segment_t *first_seg = NULL;
    autotrace_segment_t *current_seg = NULL;
    
    int x = start_x, y = start_y;
    
    // Directions for 8-connectivity
    int dx[] = {-1, -1, 0, 1, 1, 1, 0, -1};
    int dy[] = {0, -1, -1, -1, 0, 1, 1, 1};
    
    while (true) {
        // Create new segment
        autotrace_segment_t *seg = malloc(sizeof(autotrace_segment_t));
        if (!seg) break;
        
        seg->type = AUTOTRACE_LINETO;
        seg->p1.x = x;
        seg->p1.y = y;
        seg->width = opts->preserve_width ? 1.0 : 0.0;
        seg->next = NULL;
        
        if (!first_seg) {
            first_seg = seg;
            current_seg = seg;
        } else {
            current_seg->next = seg;
            current_seg = seg;
        }
        
        // Find next edge pixel
        bool found = false;
        for (int i = 0; i < 8; i++) {
            int nx = x + dx[i];
            int ny = y + dy[i];
            
            if (nx >= 0 && nx < bm->width && ny >= 0 && ny < bm->height) {
                int idx = ny * bm->width + nx;
                if (!visited[idx] && is_edge_pixel(bm, nx, ny, opts->line_threshold * 100)) {
                    x = nx;
                    y = ny;
                    visited[idx] = true;
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) break;
    }
    
    return first_seg;
}

// Main tracing function
autotrace_spline_list_t* autotrace_image(autotrace_bitmap_t *bm, autotrace_options_t *opts) {
    autotrace_spline_list_t *list = malloc(sizeof(autotrace_spline_list_t));
    if (!list) return NULL;
    
    list->splines = NULL;
    list->spline_count = 0;
    list->status = 0;
    
    // Track visited pixels
    bool *visited = calloc(bm->width * bm->height, sizeof(bool));
    if (!visited) {
        free(list);
        return NULL;
    }
    
    autotrace_spline_t *current_spline = NULL;
    
    // Find edge pixels and trace paths
    for (int y = 1; y < bm->height - 1; y++) {
        for (int x = 1; x < bm->width - 1; x++) {
            int idx = y * bm->width + x;
            
            if (!visited[idx] && is_edge_pixel(bm, x, y, opts->line_threshold * 100)) {
                // Start new spline
                autotrace_spline_t *spline = malloc(sizeof(autotrace_spline_t));
                if (!spline) continue;
                
                if (opts->centerline) {
                    spline->segments = trace_centerline(bm, x, y, visited, opts);
                } else {
                    // For outline mode, use similar logic but trace boundaries
                    spline->segments = trace_centerline(bm, x, y, visited, opts);
                }
                
                spline->closed = false; // Could implement closure detection
                spline->next = NULL;
                
                // Set color from original pixel
                int pixel_idx = (y * bm->width + x) * 3;
                spline->color[0] = bm->data[pixel_idx];
                spline->color[1] = bm->data[pixel_idx + 1];
                spline->color[2] = bm->data[pixel_idx + 2];
                
                if (!list->splines) {
                    list->splines = spline;
                    current_spline = spline;
                } else {
                    current_spline->next = spline;
                    current_spline = spline;
                }
                
                list->spline_count++;
                visited[idx] = true;
            }
        }
    }
    
    free(visited);
    return list;
}

void autotrace_spline_list_free(autotrace_spline_list_t *list) {
    if (!list) return;
    
    autotrace_spline_t *spline = list->splines;
    while (spline) {
        autotrace_spline_t *next_spline = spline->next;
        
        // Free segments
        autotrace_segment_t *seg = spline->segments;
        while (seg) {
            autotrace_segment_t *next_seg = seg->next;
            free(seg);
            seg = next_seg;
        }
        
        free(spline);
        spline = next_spline;
    }
    
    free(list);
}

// Utility functions
int autotrace_spline_segment_count(autotrace_spline_t *spline) {
    int count = 0;
    if (!spline) return 0;
    
    autotrace_segment_t *seg = spline->segments;
    while (seg) {
        count++;
        seg = seg->next;
    }
    return count;
}