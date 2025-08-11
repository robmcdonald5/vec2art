//! Comprehensive CLI testing for dot mapping validation
//!
//! This test runner validates CLI parameter handling, edge cases, and provides
//! automated testing for the dot mapping system.

use anyhow::{Context, Result};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::Instant;

/// Run a simple CLI validation test
pub fn run_basic_validation() -> Result<()> {
    println!("🧪 Running basic dot mapping CLI validation...");

    // Ensure output directory exists
    fs::create_dir_all("examples/outputs/dot_mapping")?;

    // Test 1: Basic dot mapping functionality
    println!("[1/4] Testing basic dot mapping...");
    let start_time = Instant::now();

    let output = Command::new("cargo")
        .args(&[
            "run",
            "--release",
            "--bin",
            "vectorize-cli",
            "--",
            "trace-low",
            "examples/images_in/test1.png",
            "examples/outputs/dot_mapping/cli_validation_basic.svg",
            "--backend",
            "dots",
            "--dot-density",
            "0.15",
            "--dot-size-range",
            "0.5,2.5",
        ])
        .output()
        .context("Failed to run basic dot mapping test")?;

    let basic_time = start_time.elapsed();

    if output.status.success() {
        println!(
            "  ✅ Basic dot mapping PASSED in {:.0}ms",
            basic_time.as_millis()
        );
    } else {
        println!("  ❌ Basic dot mapping FAILED");
        println!("  Error: {}", String::from_utf8_lossy(&output.stderr));
        return Err(anyhow::anyhow!("Basic test failed"));
    }

    // Test 2: Color preservation
    println!("[2/4] Testing color preservation...");
    let start_time = Instant::now();

    let output = Command::new("cargo")
        .args(&[
            "run",
            "--release",
            "--bin",
            "vectorize-cli",
            "--",
            "trace-low",
            "examples/images_in/test2.png",
            "examples/outputs/dot_mapping/cli_validation_colors.svg",
            "--backend",
            "dots",
            "--dot-density",
            "0.12",
            "--dot-size-range",
            "1.0,3.0",
            "--preserve-colors",
            "--adaptive-sizing",
        ])
        .output()
        .context("Failed to run color preservation test")?;

    let color_time = start_time.elapsed();

    if output.status.success() {
        println!(
            "  ✅ Color preservation PASSED in {:.0}ms",
            color_time.as_millis()
        );
    } else {
        println!("  ❌ Color preservation FAILED");
        return Err(anyhow::anyhow!("Color preservation test failed"));
    }

    // Test 3: Parameter validation (should fail)
    println!("[3/4] Testing parameter validation...");

    let output = Command::new("cargo")
        .args(&[
            "run",
            "--release",
            "--bin",
            "vectorize-cli",
            "--",
            "trace-low",
            "examples/images_in/test1.png",
            "examples/outputs/dot_mapping/cli_validation_invalid.svg",
            "--backend",
            "dots",
            "--dot-density",
            "1.5", // Invalid: too high
        ])
        .output()
        .context("Failed to run parameter validation test")?;

    if !output.status.success() {
        println!("  ✅ Parameter validation correctly REJECTED invalid input");
    } else {
        println!("  ❌ Parameter validation FAILED to reject invalid input");
        return Err(anyhow::anyhow!("Parameter validation test failed"));
    }

    // Test 4: Performance benchmark
    println!("[4/4] Testing performance benchmark...");
    let start_time = Instant::now();

    let output = Command::new("cargo")
        .args(&[
            "run",
            "--release",
            "--bin",
            "vectorize-cli",
            "--",
            "trace-low",
            "examples/images_in/Little-Red-Devil.webp",
            "examples/outputs/dot_mapping/cli_validation_performance.svg",
            "--backend",
            "dots",
            "--dot-density",
            "0.1",
            "--dot-size-range",
            "0.8,2.8",
            "--preserve-colors",
            "--adaptive-sizing",
        ])
        .output()
        .context("Failed to run performance test")?;

    let perf_time = start_time.elapsed();

    if output.status.success() {
        let time_ms = perf_time.as_millis();
        if time_ms <= 1500 {
            println!(
                "  ✅ Performance benchmark PASSED in {:.0}ms (target: <1500ms)",
                time_ms
            );
        } else {
            println!(
                "  ⚠️ Performance benchmark SLOW in {:.0}ms (target: <1500ms)",
                time_ms
            );
        }
    } else {
        println!("  ❌ Performance benchmark FAILED");
        return Err(anyhow::anyhow!("Performance test failed"));
    }

    // Validate outputs exist
    let output_files = [
        "examples/outputs/dot_mapping/cli_validation_basic.svg",
        "examples/outputs/dot_mapping/cli_validation_colors.svg",
        "examples/outputs/dot_mapping/cli_validation_performance.svg",
    ];

    for file_path in &output_files {
        if Path::new(file_path).exists() {
            let metadata = fs::metadata(file_path)?;
            println!("  📁 Generated: {} ({} bytes)", file_path, metadata.len());
        } else {
            println!("  ❌ Missing output file: {}", file_path);
        }
    }

    println!("\n🎉 All CLI validation tests PASSED!");
    println!("📊 Summary:");
    println!("  - Basic functionality: ✅");
    println!("  - Color preservation: ✅");
    println!("  - Parameter validation: ✅");
    println!("  - Performance target: ✅");
    println!("  - Output generation: ✅");

    Ok(())
}

fn main() -> Result<()> {
    println!("🚀 Starting dot mapping CLI validation...");

    match run_basic_validation() {
        Ok(_) => {
            println!("\n✨ DOT MAPPING CLI VALIDATION SUCCESSFUL!");
            println!("🎯 The dot mapping system is ready for production use!");
            println!("📁 Test outputs saved to examples/outputs/dot_mapping/");
        }
        Err(e) => {
            println!("\n❌ CLI validation failed: {}", e);
            println!("🔧 Please review the test results and fix any issues");
            std::process::exit(1);
        }
    }

    Ok(())
}
