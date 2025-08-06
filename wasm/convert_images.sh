#!/bin/bash

echo "🎨 Vec2Art Image Conversion"
echo "==========================="

# Create directories if they don't exist
mkdir -p examples/images_in
mkdir -p examples/images_out

input_dir="examples/images_in"
output_dir="examples/images_out"

echo "Input folder:  $input_dir"
echo "Output folder: $output_dir"
echo ""

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
    echo ""
    echo "💡 You can also run test_runner.sh to generate sample images first."
    exit 1
fi

echo "🎯 Converting all images..."
echo "=========================="

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
        if cargo run --example test_conversion "$image_file" edge_detector "${output_dir}/${filename}_edges.svg" >/dev/null 2>&1; then
            echo "    ✅ Generated ${filename}_edges.svg"
        else
            echo "    ❌ Failed"
        fi
        
        echo "  Path Tracing..."
        if cargo run --example test_conversion "$image_file" path_tracer "${output_dir}/${filename}_paths.svg" >/dev/null 2>&1; then
            echo "    ✅ Generated ${filename}_paths.svg"
        else
            echo "    ❌ Failed"
        fi
        
        echo "  Geometric Fitting..."
        if cargo run --example test_conversion "$image_file" geometric_fitter "${output_dir}/${filename}_geometric.svg" >/dev/null 2>&1; then
            echo "    ✅ Generated ${filename}_geometric.svg"
        else
            echo "    ❌ Failed"
        fi
    fi
done

echo ""
echo "📊 Conversion Complete!"
echo "======================"
echo "Generated SVG files in $output_dir:"
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
echo "✅ Done! Open the .svg files in a browser to view results."