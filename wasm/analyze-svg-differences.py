#!/usr/bin/env python3
"""
SVG Artistic Effects Analysis Tool
Compares SVG outputs to quantitatively measure differences between artistic presets
"""

import re
import sys
import json
import math
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import xml.etree.ElementTree as ET

@dataclass
class PathAnalysis:
    """Analysis results for a single SVG path"""
    path_index: int
    path_length: int
    num_commands: int
    stroke_width: Optional[float]
    stroke_opacity: Optional[float]
    coordinate_variance: float
    has_curves: bool
    num_curve_commands: int
    
@dataclass
class SVGAnalysis:
    """Complete analysis of an SVG file"""
    filename: str
    file_size: int
    num_paths: int
    total_path_length: int
    avg_path_length: float
    stroke_widths: List[float]
    stroke_width_variance: float
    has_variable_strokes: bool
    path_complexities: List[int]
    total_curve_commands: int
    coordinate_precision: float
    
def parse_path_data(path_d: str) -> Tuple[int, int, float, bool, int]:
    """Parse SVG path data and extract metrics"""
    # Count commands
    commands = re.findall(r'[MLHVCSQTAZmlhvcsqtaz]', path_d)
    num_commands = len(commands)
    
    # Check for curves
    curve_commands = re.findall(r'[CSQTAcsqta]', path_d)
    has_curves = len(curve_commands) > 0
    num_curve_commands = len(curve_commands)
    
    # Extract all numeric values
    numbers = re.findall(r'-?\d+\.?\d*', path_d)
    float_numbers = [float(n) for n in numbers]
    
    # Calculate coordinate variance (measure of "tremor")
    coord_variance = 0.0
    if len(float_numbers) > 2:
        # Calculate differences between consecutive coordinates
        diffs = [abs(float_numbers[i+1] - float_numbers[i]) 
                for i in range(len(float_numbers)-1)]
        if diffs:
            mean_diff = sum(diffs) / len(diffs)
            coord_variance = sum((d - mean_diff)**2 for d in diffs) / len(diffs)
    
    return len(path_d), num_commands, coord_variance, has_curves, num_curve_commands

def analyze_svg(filepath: Path) -> SVGAnalysis:
    """Analyze an SVG file and extract metrics"""
    
    # Basic file metrics
    file_size = filepath.stat().st_size
    
    # Parse SVG
    tree = ET.parse(filepath)
    root = tree.getroot()
    
    # Find all paths
    namespaces = {'svg': 'http://www.w3.org/2000/svg'}
    paths = root.findall('.//svg:path', namespaces) or root.findall('.//path')
    
    num_paths = len(paths)
    path_analyses = []
    stroke_widths = []
    total_curve_commands = 0
    
    for i, path in enumerate(paths):
        path_d = path.get('d', '')
        stroke_width_str = path.get('stroke-width', '1')
        stroke_opacity_str = path.get('stroke-opacity', '1')
        
        # Parse stroke width
        try:
            stroke_width = float(stroke_width_str)
        except:
            stroke_width = 1.0
        stroke_widths.append(stroke_width)
        
        # Parse stroke opacity
        try:
            stroke_opacity = float(stroke_opacity_str)
        except:
            stroke_opacity = 1.0
            
        # Analyze path data
        path_length, num_commands, coord_variance, has_curves, num_curve_commands = parse_path_data(path_d)
        total_curve_commands += num_curve_commands
        
        path_analyses.append(PathAnalysis(
            path_index=i,
            path_length=path_length,
            num_commands=num_commands,
            stroke_width=stroke_width,
            stroke_opacity=stroke_opacity,
            coordinate_variance=coord_variance,
            has_curves=has_curves,
            num_curve_commands=num_curve_commands
        ))
    
    # Calculate aggregate metrics
    total_path_length = sum(p.path_length for p in path_analyses)
    avg_path_length = total_path_length / num_paths if num_paths > 0 else 0
    
    # Calculate stroke width variance
    stroke_width_variance = 0.0
    if stroke_widths:
        mean_stroke = sum(stroke_widths) / len(stroke_widths)
        stroke_width_variance = sum((w - mean_stroke)**2 for w in stroke_widths) / len(stroke_widths)
    
    has_variable_strokes = stroke_width_variance > 0.001
    
    # Path complexities
    path_complexities = [p.num_commands for p in path_analyses]
    
    # Coordinate precision (average decimal places)
    all_coords = []
    for path in paths:
        path_d = path.get('d', '')
        numbers = re.findall(r'-?\d+\.(\d+)', path_d)
        all_coords.extend([len(n) for n in numbers])
    
    coord_precision = sum(all_coords) / len(all_coords) if all_coords else 0
    
    return SVGAnalysis(
        filename=filepath.name,
        file_size=file_size,
        num_paths=num_paths,
        total_path_length=total_path_length,
        avg_path_length=avg_path_length,
        stroke_widths=stroke_widths,
        stroke_width_variance=stroke_width_variance,
        has_variable_strokes=has_variable_strokes,
        path_complexities=path_complexities,
        total_curve_commands=total_curve_commands,
        coordinate_precision=coord_precision
    )

def compare_svgs(svg1_path: Path, svg2_path: Path) -> Dict:
    """Compare two SVG files and highlight differences"""
    
    analysis1 = analyze_svg(svg1_path)
    analysis2 = analyze_svg(svg2_path)
    
    comparison = {
        'file1': svg1_path.name,
        'file2': svg2_path.name,
        'size_difference': analysis2.file_size - analysis1.file_size,
        'size_ratio': analysis2.file_size / analysis1.file_size if analysis1.file_size > 0 else 0,
        'path_count_diff': analysis2.num_paths - analysis1.num_paths,
        'avg_path_length_diff': analysis2.avg_path_length - analysis1.avg_path_length,
        'stroke_variance_diff': analysis2.stroke_width_variance - analysis1.stroke_width_variance,
        'variable_strokes_change': (analysis1.has_variable_strokes, analysis2.has_variable_strokes),
        'curve_commands_diff': analysis2.total_curve_commands - analysis1.total_curve_commands,
        'coordinate_precision_diff': analysis2.coordinate_precision - analysis1.coordinate_precision,
        'analysis1': analysis1,
        'analysis2': analysis2
    }
    
    return comparison

def print_comparison_report(comparison: Dict):
    """Print a detailed comparison report"""
    print("=" * 80)
    print(f"SVG COMPARISON: {comparison['file1']} vs {comparison['file2']}")
    print("=" * 80)
    
    print("\n📊 FILE METRICS:")
    print(f"  Size difference: {comparison['size_difference']:+d} bytes ({comparison['size_ratio']:.2%} ratio)")
    print(f"  Path count difference: {comparison['path_count_diff']:+d}")
    
    print("\n✏️ ARTISTIC EFFECTS INDICATORS:")
    
    # Key indicator 1: Stroke width variance
    stroke_var_diff = comparison['stroke_variance_diff']
    if abs(stroke_var_diff) < 0.0001:
        print(f"  ❌ Stroke width variance: NO CHANGE (diff: {stroke_var_diff:.6f})")
    else:
        print(f"  ✅ Stroke width variance: CHANGED by {stroke_var_diff:+.6f}")
    
    # Key indicator 2: Variable strokes
    var_strokes = comparison['variable_strokes_change']
    if var_strokes[0] == var_strokes[1]:
        print(f"  ❌ Variable strokes: NO CHANGE (both: {var_strokes[0]})")
    else:
        print(f"  ✅ Variable strokes: CHANGED from {var_strokes[0]} to {var_strokes[1]}")
    
    # Key indicator 3: Path complexity
    avg_path_diff = comparison['avg_path_length_diff']
    if abs(avg_path_diff) < 1:
        print(f"  ❌ Average path length: NO SIGNIFICANT CHANGE ({avg_path_diff:+.2f})")
    else:
        print(f"  ✅ Average path length: CHANGED by {avg_path_diff:+.2f} chars")
    
    # Key indicator 4: Curve commands (for tremor effects)
    curve_diff = comparison['curve_commands_diff']
    if curve_diff == 0:
        print(f"  ❌ Curve commands: NO CHANGE")
    else:
        print(f"  ✅ Curve commands: CHANGED by {curve_diff:+d}")
    
    # Key indicator 5: Coordinate precision
    precision_diff = comparison['coordinate_precision_diff']
    if abs(precision_diff) < 0.1:
        print(f"  ❌ Coordinate precision: NO SIGNIFICANT CHANGE ({precision_diff:+.3f})")
    else:
        print(f"  ✅ Coordinate precision: CHANGED by {precision_diff:+.3f} decimal places")
    
    print("\n📈 DETAILED METRICS:")
    a1, a2 = comparison['analysis1'], comparison['analysis2']
    
    print(f"\n  {a1.filename}:")
    print(f"    - Paths: {a1.num_paths}")
    print(f"    - Total path length: {a1.total_path_length:,} chars")
    print(f"    - Stroke widths: min={min(a1.stroke_widths):.3f}, max={max(a1.stroke_widths):.3f}" if a1.stroke_widths else "    - No strokes")
    print(f"    - Curve commands: {a1.total_curve_commands}")
    
    print(f"\n  {a2.filename}:")
    print(f"    - Paths: {a2.num_paths}")
    print(f"    - Total path length: {a2.total_path_length:,} chars")
    print(f"    - Stroke widths: min={min(a2.stroke_widths):.3f}, max={max(a2.stroke_widths):.3f}" if a2.stroke_widths else "    - No strokes")
    print(f"    - Curve commands: {a2.total_curve_commands}")
    
    # Overall verdict
    print("\n🎯 VERDICT:")
    effects_detected = (
        abs(stroke_var_diff) > 0.0001 or
        var_strokes[0] != var_strokes[1] or
        abs(avg_path_diff) > 1 or
        curve_diff != 0 or
        abs(precision_diff) > 0.1
    )
    
    if effects_detected:
        print("  ✅ ARTISTIC EFFECTS ARE BEING APPLIED")
        print("     Effects detected in stroke variance, path complexity, or curve usage")
    else:
        print("  ❌ NO ARTISTIC EFFECTS DETECTED")
        print("     SVGs are essentially identical - effects may not be working")

def main():
    """Main analysis routine"""
    print("\n" + "="*80)
    print("SVG ARTISTIC EFFECTS ANALYZER")
    print("="*80)
    
    # Define test pairs
    test_pairs = [
        # Checkerboard tests (simple geometry, effects should be most visible)
        ("examples/outputs/debug_artistic_effects/none/checkerboard.svg",
         "examples/outputs/debug_artistic_effects/subtle/checkerboard.svg",
         "Checkerboard: None vs Subtle"),
        
        ("examples/outputs/debug_artistic_effects/none/checkerboard.svg",
         "examples/outputs/debug_artistic_effects/medium/checkerboard.svg",
         "Checkerboard: None vs Medium"),
        
        ("examples/outputs/debug_artistic_effects/none/checkerboard.svg",
         "examples/outputs/debug_artistic_effects/strong/checkerboard.svg",
         "Checkerboard: None vs Strong"),
        
        ("examples/outputs/debug_artistic_effects/none/checkerboard.svg",
         "examples/outputs/debug_artistic_effects/sketchy/checkerboard.svg",
         "Checkerboard: None vs Sketchy"),
        
        # Complex image tests
        ("examples/outputs/debug_artistic_effects/none/anime-girl.svg",
         "examples/outputs/debug_artistic_effects/sketchy/anime-girl.svg",
         "Anime Girl: None vs Sketchy"),
        
        # Custom parameter tests
        ("examples/outputs/debug_artistic_effects/analysis/custom_zero.svg",
         "examples/outputs/debug_artistic_effects/analysis/custom_max.svg",
         "Custom Parameters: Zero vs Max"),
        
        # Detail level tests
        ("examples/outputs/debug_artistic_effects/analysis/devil_low_none.svg",
         "examples/outputs/debug_artistic_effects/analysis/devil_low_sketchy.svg",
         "Devil Low Detail: None vs Sketchy"),
        
        ("examples/outputs/debug_artistic_effects/analysis/devil_high_none.svg",
         "examples/outputs/debug_artistic_effects/analysis/devil_high_sketchy.svg",
         "Devil High Detail: None vs Sketchy"),
    ]
    
    results = []
    
    for file1, file2, description in test_pairs:
        path1 = Path(file1)
        path2 = Path(file2)
        
        if not path1.exists():
            print(f"\n⚠️  Skipping {description}: {file1} not found")
            continue
        if not path2.exists():
            print(f"\n⚠️  Skipping {description}: {file2} not found")
            continue
            
        print(f"\n\n🔍 ANALYZING: {description}")
        comparison = compare_svgs(path1, path2)
        print_comparison_report(comparison)
        results.append({
            'description': description,
            'comparison': comparison
        })
    
    # Summary report
    print("\n\n" + "="*80)
    print("SUMMARY REPORT")
    print("="*80)
    
    effects_found = 0
    no_effects = 0
    
    for result in results:
        comp = result['comparison']
        has_effects = (
            abs(comp['stroke_variance_diff']) > 0.0001 or
            comp['variable_strokes_change'][0] != comp['variable_strokes_change'][1] or
            abs(comp['avg_path_length_diff']) > 1 or
            comp['curve_commands_diff'] != 0 or
            abs(comp['coordinate_precision_diff']) > 0.1
        )
        
        if has_effects:
            effects_found += 1
            print(f"✅ {result['description']}: EFFECTS DETECTED")
        else:
            no_effects += 1
            print(f"❌ {result['description']}: NO EFFECTS")
    
    print(f"\n📊 Total: {effects_found} with effects, {no_effects} without effects")
    
    if effects_found == 0:
        print("\n⚠️  WARNING: No artistic effects detected in any comparison!")
        print("   This suggests the hand-drawn effects are not being applied.")
    elif no_effects > 0:
        print("\n⚠️  WARNING: Some comparisons show no effects.")
        print("   Effects may be inconsistently applied.")
    else:
        print("\n✅ SUCCESS: Artistic effects detected in all comparisons!")

if __name__ == "__main__":
    main()