#!/bin/bash

echo "🧪 Vec2Art Algorithm Testing Suite"
echo "=================================="

# Create directories
mkdir -p examples/images_in
mkdir -p examples/images_out

echo "📸 Creating sample test images in examples/images_in..."
cargo test --example test_conversion test_create_sample_images

echo ""
echo "🧪 Running unit tests..."
cargo test

echo ""
echo "🔄 Running integration tests..."
cargo test --test integration_tests

echo ""
echo "🎯 Processing all images in examples/images_in..."
echo "================================================"

input_dir="examples/images_in"
output_dir="examples/images_out"

# Check if input directory has any images
found_images=false
for ext in jpg jpeg png webp JPG JPEG PNG WEBP; do
    if ls "${input_dir}"/*."${ext}" 1> /dev/null 2>&1; then
        found_images=true
        break
    fi
done

if [ "$found_images" = false ]; then
    echo "⚠️  No images found in $input_dir"
    echo "   Supported formats: .jpg, .jpeg, .png, .webp"
    echo "   Please add some test images and run again."
else
    # Process each image file
    for image_file in "${input_dir}"/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}; do
        # Check if file actually exists (in case no files match the pattern)
        if [ -f "$image_file" ]; then
            # Get base filename without path and extension
            basename=$(basename "$image_file")
            filename="${basename%.*}"
            
            echo ""
            echo "🖼️  Processing: $basename"
            echo "────────────────────────────────"
            
            echo "  Edge Detection..."
            if cargo run --example test_conversion "$image_file" edge_detector "${output_dir}/${filename}_edges.svg" 2>/dev/null; then
                echo "    ✅ Generated ${filename}_edges.svg"
            else
                echo "    ❌ Failed"
            fi
            
            echo "  Path Tracing..."
            if cargo run --example test_conversion "$image_file" path_tracer "${output_dir}/${filename}_paths.svg" 2>/dev/null; then
                echo "    ✅ Generated ${filename}_paths.svg"
            else
                echo "    ❌ Failed"
            fi
            
            echo "  Geometric Fitting (quick mode)..."
            if cargo run --example test_conversion "$image_file" geometric_fitter "${output_dir}/${filename}_geometric.svg" 2>/dev/null; then
                echo "    ✅ Generated ${filename}_geometric.svg"
            else
                echo "    ❌ Failed"
            fi
        fi
    done
fi

echo ""
echo "📊 Results Summary:"
echo "=================="
echo "Input folder:  $input_dir"
echo "Output folder: $output_dir"
echo ""
echo "Generated SVG files:"
if ls "${output_dir}"/*.svg 1> /dev/null 2>&1; then
    for svg_file in "${output_dir}"/*.svg; do
        if [ -f "$svg_file" ]; then
            echo "  - $(basename "$svg_file")"
        fi
    done
else
    echo "  (No SVG files generated)"
fi

echo ""
echo "Unit test outputs:"
if ls test_*.svg 1> /dev/null 2>&1; then
    for test_file in test_*.svg; do
        if [ -f "$test_file" ]; then
            echo "  - $test_file"
        fi
    done
else
    echo "  (No unit test SVG files found)"
fi

echo ""
echo "✅ Testing complete! Open the .svg files in a browser to view results."
echo "💡 Tip: Add your own images to examples/images_in/ and run this script again."