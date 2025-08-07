#include "potrace_wrapper.h"
#include <stdlib.h>
#include <string.h>
#include <math.h>

// Default parameters
potrace_param_t* potrace_param_default(void) {
    potrace_param_t *p = malloc(sizeof(potrace_param_t));
    if (!p) return NULL;
    
    p->turdsize = 2.0;      // Filter small speckles
    p->turnpolicy = 0.4;    // Balanced turn policy  
    p->alphamax = 1.0;      // Smooth corners
    p->opticurve = true;    // Use curves
    p->opttolerance = 0.2;  // Curve fitting tolerance
    
    return p;
}

void potrace_param_free(potrace_param_t *p) {
    if (p) free(p);
}

// Bitmap management
potrace_bitmap_t* potrace_bitmap_new(int width, int height) {
    potrace_bitmap_t *bm = malloc(sizeof(potrace_bitmap_t));
    if (!bm) return NULL;
    
    bm->width = width;
    bm->height = height;
    bm->data = calloc(width * height, sizeof(uint8_t));
    
    if (!bm->data) {
        free(bm);
        return NULL;
    }
    
    return bm;
}

void potrace_bitmap_free(potrace_bitmap_t *bm) {
    if (bm) {
        if (bm->data) free(bm->data);
        free(bm);
    }
}

void potrace_bitmap_set_pixel(potrace_bitmap_t *bm, int x, int y, bool value) {
    if (x >= 0 && x < bm->width && y >= 0 && y < bm->height) {
        bm->data[y * bm->width + x] = value ? 255 : 0;
    }
}

// Simplified contour tracing algorithm (Moore neighborhood)
static potrace_segment_t* trace_boundary(potrace_bitmap_t *bm, int start_x, int start_y, bool *visited) {
    // Moore neighborhood directions (8-connectivity)
    int dx[] = {-1, -1, 0, 1, 1, 1, 0, -1};
    int dy[] = {0, -1, -1, -1, 0, 1, 1, 1};
    
    potrace_segment_t *first_seg = NULL;
    potrace_segment_t *current_seg = NULL;
    
    int x = start_x, y = start_y;
    int dir = 0; // Starting direction
    
    do {
        // Create new segment
        potrace_segment_t *seg = malloc(sizeof(potrace_segment_t));
        if (!seg) break;
        
        seg->type = POTRACE_CORNER;
        seg->c[0].x = x;
        seg->c[0].y = y;
        seg->next = NULL;
        
        if (!first_seg) {
            first_seg = seg;
            current_seg = seg;
        } else {
            current_seg->next = seg;
            current_seg = seg;
        }
        
        // Find next boundary pixel
        bool found = false;
        for (int i = 0; i < 8; i++) {
            int new_dir = (dir + i) % 8;
            int nx = x + dx[new_dir];
            int ny = y + dy[new_dir];
            
            if (nx >= 0 && nx < bm->width && ny >= 0 && ny < bm->height) {
                int idx = ny * bm->width + nx;
                if (bm->data[idx] > 128 && !visited[idx]) {
                    x = nx;
                    y = ny;
                    dir = new_dir;
                    visited[idx] = true;
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) break;
        
    } while (x != start_x || y != start_y);
    
    return first_seg;
}

// Main tracing function
potrace_state_t* potrace_trace(potrace_param_t *param, potrace_bitmap_t *bm) {
    potrace_state_t *st = malloc(sizeof(potrace_state_t));
    if (!st) return NULL;
    
    st->plist = NULL;
    st->status = 0;
    
    // Track visited pixels
    bool *visited = calloc(bm->width * bm->height, sizeof(bool));
    if (!visited) {
        free(st);
        return NULL;
    }
    
    potrace_path_t *current_path = NULL;
    
    // Find contours
    for (int y = 0; y < bm->height; y++) {
        for (int x = 0; x < bm->width; x++) {
            int idx = y * bm->width + x;
            
            if (bm->data[idx] > 128 && !visited[idx]) {
                // Start new path
                potrace_path_t *path = malloc(sizeof(potrace_path_t));
                if (!path) continue;
                
                path->curve = trace_boundary(bm, x, y, visited);
                path->next = NULL;
                path->sign = true; // Assume outer path for now
                path->area = 0.0;  // Calculate if needed
                
                if (!st->plist) {
                    st->plist = path;
                    current_path = path;
                } else {
                    current_path->next = path;
                    current_path = path;
                }
                
                visited[idx] = true;
            }
        }
    }
    
    free(visited);
    return st;
}

void potrace_state_free(potrace_state_t *st) {
    if (!st) return;
    
    potrace_path_t *path = st->plist;
    while (path) {
        potrace_path_t *next_path = path->next;
        
        // Free segments
        potrace_segment_t *seg = path->curve;
        while (seg) {
            potrace_segment_t *next_seg = seg->next;
            free(seg);
            seg = next_seg;
        }
        
        free(path);
        path = next_path;
    }
    
    free(st);
}

// Utility functions
int potrace_path_count(potrace_path_t *path) {
    int count = 0;
    while (path) {
        count++;
        path = path->next;
    }
    return count;
}

potrace_segment_t* potrace_path_get_curve(potrace_path_t *path) {
    return path ? path->curve : NULL;
}