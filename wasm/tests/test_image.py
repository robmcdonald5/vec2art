#!/usr/bin/env python3
"""
Dot Mapping Test Image Generator and Validator

This script creates additional test images and performs validation tasks for the
dot mapping system. It complements the Rust-based testing infrastructure with
Python's image processing capabilities.
"""

import os
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import argparse
import json
from datetime import datetime
import subprocess
import time

class DotMappingTestGenerator:
    """Generate test images and validate dot mapping results"""
    
    def __init__(self, output_dir="examples/images_in"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def create_all_test_images(self):
        """Create comprehensive set of test images"""
        print("🖼️ Generating comprehensive test images for dot mapping validation...")
        
        # Create various test scenarios
        self.create_portrait_variations()
        self.create_landscape_variations() 
        self.create_technical_variations()
        self.create_artistic_variations()
        self.create_edge_case_images()
        self.create_performance_test_images()
        
        print("✅ All test images generated successfully")
        
    def create_portrait_variations(self):
        """Create portrait test images with various characteristics"""
        print("📸 Creating portrait variations...")
        
        # High-contrast portrait silhouette
        img = Image.new('RGB', (400, 500), color='white')
        draw = ImageDraw.Draw(img)
        
        # Draw face outline
        draw.ellipse([100, 50, 300, 300], fill='#333333', outline='#111111', width=3)
        # Draw neck
        draw.rectangle([150, 280, 250, 400], fill='#333333')
        # Add some facial features for complexity
        draw.ellipse([140, 120, 160, 140], fill='black')  # Left eye
        draw.ellipse([240, 120, 260, 140], fill='black')  # Right eye
        draw.arc([170, 160, 230, 200], 0, 180, fill='black', width=2)  # Smile
        
        img.save(self.output_dir / "portrait_high_contrast.png")
        
        # Soft portrait with gradients
        img = Image.new('RGB', (350, 450), color='#f5f5f5')
        draw = ImageDraw.Draw(img)
        
        # Create gradient effect manually
        for y in range(450):
            for x in range(350):
                # Distance from center
                cx, cy = 175, 225
                dist = np.sqrt((x - cx)**2 + (y - cy)**2)
                
                if dist < 150:
                    # Inside face area - create soft gradient
                    intensity = int(200 - (dist / 150) * 100)
                    color = (intensity, intensity, intensity + 10)
                    img.putpixel((x, y), color)
                    
        img.save(self.output_dir / "portrait_soft_gradient.png")
        print("  ✓ Portrait variations created")
        
    def create_landscape_variations(self):
        """Create landscape test images"""
        print("🌄 Creating landscape variations...")
        
        # Mountain landscape with sky gradient
        img = Image.new('RGB', (600, 400), color='white')
        
        # Create sky gradient (blue to light blue)
        for y in range(200):
            intensity = int(135 + (y / 200) * 120)
            sky_color = (100, 150, intensity)
            for x in range(600):
                img.putpixel((x, y), sky_color)
                
        # Draw mountains (triangular shapes)
        draw = ImageDraw.Draw(img)
        mountain_points = [
            (0, 400), (150, 180), (250, 220), (350, 160), (450, 200), (600, 400)
        ]
        draw.polygon(mountain_points, fill='#4a4a4a', outline='#333333')
        
        # Add some trees (simple shapes)
        for i in range(0, 600, 80):
            tree_x = i + 40
            draw.rectangle([tree_x-3, 250, tree_x+3, 400], fill='#654321')  # Trunk
            draw.ellipse([tree_x-15, 220, tree_x+15, 260], fill='#228b22')  # Leaves
            
        img.save(self.output_dir / "landscape_mountains.png")
        
        # Abstract landscape with color blocks
        img = Image.new('RGB', (500, 300), color='white')
        draw = ImageDraw.Draw(img)
        
        # Create color field regions
        draw.rectangle([0, 0, 500, 100], fill='#87ceeb')      # Sky
        draw.rectangle([0, 100, 500, 180], fill='#90ee90')    # Hills
        draw.rectangle([0, 180, 500, 240], fill='#daa520')    # Fields
        draw.rectangle([0, 240, 500, 300], fill='#8b4513')    # Ground
        
        img.save(self.output_dir / "landscape_color_fields.png")
        print("  ✓ Landscape variations created")
        
    def create_technical_variations(self):
        """Create technical drawing test images"""
        print("📐 Creating technical variations...")
        
        # Circuit diagram style
        img = Image.new('RGB', (500, 400), color='white')
        draw = ImageDraw.Draw(img)
        
        # Draw circuit elements
        draw.rectangle([50, 50, 150, 100], fill=None, outline='black', width=2)
        draw.text((75, 70), "IC1", fill='black')
        
        # Draw connecting lines
        draw.line([(150, 75), (200, 75)], fill='black', width=2)
        draw.line([(200, 75), (200, 150), (250, 150)], fill='black', width=2)
        
        # Draw resistor symbol
        draw.rectangle([250, 140, 300, 160], fill=None, outline='black', width=2)
        draw.text((260, 170), "R1", fill='black')
        
        # Draw more connections
        draw.line([(300, 150), (350, 150), (350, 200)], fill='black', width=2)
        draw.ellipse([340, 190, 360, 210], fill=None, outline='black', width=2)
        
        img.save(self.output_dir / "technical_circuit.png")
        
        # Architectural blueprint style
        img = Image.new('RGB', (600, 450), color='#f8f8ff')
        draw = ImageDraw.Draw(img)
        
        # Draw floor plan
        draw.rectangle([100, 100, 500, 350], fill=None, outline='black', width=3)  # Outer walls
        draw.line([(300, 100), (300, 350)], fill='black', width=2)  # Room divider
        draw.line([(100, 225), (500, 225)], fill='black', width=2)  # Horizontal divider
        
        # Draw doors
        draw.arc([285, 220, 315, 250], 0, 90, fill='black', width=2)
        draw.arc([180, 95, 220, 105], 0, 180, fill='black', width=2)
        
        # Add dimension lines
        draw.line([(100, 80), (500, 80)], fill='blue', width=1)
        draw.text((280, 60), "400cm", fill='blue')
        
        img.save(self.output_dir / "technical_blueprint.png")
        print("  ✓ Technical variations created")
        
    def create_artistic_variations(self):
        """Create artistic style test images"""
        print("🎨 Creating artistic variations...")
        
        # Abstract art with organic shapes
        img = Image.new('RGB', (400, 400), color='white')
        draw = ImageDraw.Draw(img)
        
        # Create flowing organic shapes
        colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b']
        
        for i in range(5):
            # Create irregular ellipse
            x_center = np.random.randint(50, 350)
            y_center = np.random.randint(50, 350)
            width = np.random.randint(60, 150)
            height = np.random.randint(60, 150)
            
            draw.ellipse([
                x_center - width//2, y_center - height//2,
                x_center + width//2, y_center + height//2
            ], fill=colors[i], outline=None)
            
        img.save(self.output_dir / "artistic_abstract.png")
        
        # Mandala-style pattern
        img = Image.new('RGB', (400, 400), color='white')
        draw = ImageDraw.Draw(img)
        
        center_x, center_y = 200, 200
        
        # Draw concentric circles with patterns
        for radius in range(20, 180, 20):
            draw.ellipse([
                center_x - radius, center_y - radius,
                center_x + radius, center_y + radius
            ], fill=None, outline='black', width=2)
            
            # Add radial lines
            for angle in range(0, 360, 30):
                angle_rad = np.radians(angle)
                x1 = center_x + radius * 0.8 * np.cos(angle_rad)
                y1 = center_y + radius * 0.8 * np.sin(angle_rad)
                x2 = center_x + radius * np.cos(angle_rad)
                y2 = center_y + radius * np.sin(angle_rad)
                draw.line([(x1, y1), (x2, y2)], fill='black', width=1)
                
        img.save(self.output_dir / "artistic_mandala.png")
        print("  ✓ Artistic variations created")
        
    def create_edge_case_images(self):
        """Create edge case test images"""
        print("⚠️ Creating edge case images...")
        
        # Very high contrast image
        img = Image.new('RGB', (300, 300), color='white')
        draw = ImageDraw.Draw(img)
        
        # Checkerboard pattern with very small squares
        square_size = 10
        for y in range(0, 300, square_size):
            for x in range(0, 300, square_size):
                if ((x // square_size) + (y // square_size)) % 2 == 0:
                    draw.rectangle([x, y, x + square_size, y + square_size], fill='black')
                    
        img.save(self.output_dir / "edge_case_high_contrast.png")
        
        # Nearly monochrome image (tests threshold sensitivity)
        img = Image.new('RGB', (250, 250), color=(128, 128, 128))
        draw = ImageDraw.Draw(img)
        
        # Add very subtle variations
        for y in range(250):
            for x in range(250):
                variation = int(5 * np.sin(x * 0.1) * np.cos(y * 0.1))
                color_val = 128 + variation
                img.putpixel((x, y), (color_val, color_val, color_val))
                
        img.save(self.output_dir / "edge_case_low_contrast.png")
        
        # Very busy/noisy image
        img = Image.new('RGB', (300, 300), color='white')
        
        # Add random noise
        pixels = img.load()
        for y in range(300):
            for x in range(300):
                noise_r = np.random.randint(0, 256)
                noise_g = np.random.randint(0, 256) 
                noise_b = np.random.randint(0, 256)
                pixels[x, y] = (noise_r, noise_g, noise_b)
                
        img.save(self.output_dir / "edge_case_noise.png")
        print("  ✓ Edge case images created")
        
    def create_performance_test_images(self):
        """Create images for performance benchmarking"""
        print("⚡ Creating performance test images...")
        
        # Different sizes for scalability testing
        sizes = [
            (200, 200, "perf_tiny"),
            (500, 500, "perf_small"),
            (800, 600, "perf_medium"),
            (1200, 900, "perf_large"),
            (1920, 1080, "perf_xlarge"),
        ]
        
        for width, height, name in sizes:
            img = Image.new('RGB', (width, height), color='white')
            
            # Create complex but predictable pattern
            for y in range(height):
                for x in range(width):
                    # Multi-frequency pattern
                    fx = x / width * 10
                    fy = y / height * 8
                    
                    pattern = (np.sin(fx) * np.cos(fy) + 
                             np.sin(fx * 2.3) * 0.5 +
                             np.cos(fy * 1.7) * 0.3)
                    
                    intensity = int((pattern + 1.5) / 3 * 255)
                    img.putpixel((x, y), (intensity, intensity, intensity))
                    
            img.save(self.output_dir / f"{name}.png")
            print(f"  ✓ Created {name}.png ({width}x{height})")
            
    def validate_dot_mapping_results(self, results_dir="examples/outputs/dot_mapping"):
        """Validate generated dot mapping results"""
        print(f"\n🔍 Validating dot mapping results in {results_dir}...")
        
        results_path = Path(results_dir)
        if not results_path.exists():
            print(f"❌ Results directory {results_dir} does not exist")
            return False
            
        svg_files = list(results_path.glob("*.svg"))
        if not svg_files:
            print(f"❌ No SVG files found in {results_dir}")
            return False
            
        validation_results = []
        
        for svg_file in svg_files:
            result = self.validate_single_svg(svg_file)
            validation_results.append(result)
            status = "✅" if result["valid"] else "❌"
            print(f"  {status} {svg_file.name}: {result['message']}")
            
        # Summary
        valid_count = sum(1 for r in validation_results if r["valid"])
        total_count = len(validation_results)
        success_rate = (valid_count / total_count) * 100 if total_count > 0 else 0
        
        print(f"\n📊 Validation Summary:")
        print(f"  Valid files: {valid_count}/{total_count} ({success_rate:.1f}%)")
        
        if success_rate >= 95:
            print("🎉 Validation PASSED - Results meet quality standards")
            return True
        else:
            print("⚠️ Validation FAILED - Some results need attention")
            return False
            
    def validate_single_svg(self, svg_file):
        """Validate a single SVG file"""
        try:
            with open(svg_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Basic SVG structure checks
            if not content.startswith('<?xml') and '<svg' not in content:
                return {"valid": False, "message": "Invalid SVG structure"}
                
            # Check for dots (circles)
            circle_count = content.count('<circle')
            if circle_count == 0:
                return {"valid": False, "message": "No circles found - not dot mapping output"}
                
            # Check file size (should be reasonable)
            file_size = svg_file.stat().st_size
            if file_size < 100:
                return {"valid": False, "message": f"File too small ({file_size} bytes)"}
            elif file_size > 10 * 1024 * 1024:  # 10MB
                return {"valid": False, "message": f"File too large ({file_size} bytes)"}
                
            return {
                "valid": True, 
                "message": f"Valid SVG with {circle_count} dots ({file_size} bytes)"
            }
            
        except Exception as e:
            return {"valid": False, "message": f"Error reading file: {str(e)}"}
            
    def run_performance_benchmark(self):
        """Run performance benchmarks on generated images"""
        print("\n⚡ Running performance benchmarks...")
        
        # Test images with expected processing times (ms)
        test_cases = [
            ("perf_tiny.png", 300),
            ("perf_small.png", 800), 
            ("perf_medium.png", 1200),
            ("perf_large.png", 1500),
        ]
        
        results = []
        
        for image_name, expected_time_ms in test_cases:
            image_path = self.output_dir / image_name
            if not image_path.exists():
                print(f"  ⚠️ Skipping {image_name} - file not found")
                continue
                
            output_path = f"examples/outputs/dot_mapping/bench_{image_name.replace('.png', '.svg')}"
            
            # Run dot mapping with timing
            start_time = time.time()
            try:
                cmd = [
                    "cargo", "run", "--release", "--bin", "vectorize-cli", "--",
                    "trace-low", str(image_path), output_path,
                    "--backend", "dots", 
                    "--dot-density", "0.1",
                    "--dot-size-range", "0.5,2.5"
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
                processing_time_ms = (time.time() - start_time) * 1000
                
                if result.returncode == 0:
                    status = "✅ PASS" if processing_time_ms <= expected_time_ms else "⚠️ SLOW"
                    print(f"  {status} {image_name}: {processing_time_ms:.0f}ms (expected <{expected_time_ms}ms)")
                    results.append({
                        "image": image_name,
                        "time_ms": processing_time_ms,
                        "expected_ms": expected_time_ms,
                        "success": True
                    })
                else:
                    print(f"  ❌ FAIL {image_name}: Processing failed")
                    print(f"    Error: {result.stderr}")
                    results.append({
                        "image": image_name,
                        "time_ms": 0,
                        "expected_ms": expected_time_ms,
                        "success": False
                    })
                    
            except Exception as e:
                print(f"  ❌ ERROR {image_name}: {str(e)}")
                
        # Performance summary
        if results:
            avg_time = np.mean([r["time_ms"] for r in results if r["success"]])
            max_time = max([r["time_ms"] for r in results if r["success"]], default=0)
            success_count = sum(1 for r in results if r["success"])
            
            print(f"\n📈 Performance Summary:")
            print(f"  Successful tests: {success_count}/{len(results)}")
            print(f"  Average time: {avg_time:.0f}ms")
            print(f"  Maximum time: {max_time:.0f}ms")
            print(f"  Performance target (<1500ms): {'✅ MET' if max_time <= 1500 else '❌ EXCEEDED'}")
            
def main():
    parser = argparse.ArgumentParser(description="Dot Mapping Test Image Generator and Validator")
    parser.add_argument("--generate", action="store_true", help="Generate test images")
    parser.add_argument("--validate", action="store_true", help="Validate dot mapping results")
    parser.add_argument("--benchmark", action="store_true", help="Run performance benchmarks")
    parser.add_argument("--all", action="store_true", help="Run all operations")
    parser.add_argument("--output-dir", default="examples/images_in", help="Output directory for test images")
    
    args = parser.parse_args()
    
    if len(sys.argv) == 1:
        args.all = True
        
    generator = DotMappingTestGenerator(args.output_dir)
    
    if args.generate or args.all:
        generator.create_all_test_images()
        
    if args.validate or args.all:
        generator.validate_dot_mapping_results()
        
    if args.benchmark or args.all:
        generator.run_performance_benchmark()
        
    print("\n🎯 Test operations complete!")

if __name__ == "__main__":
    main()