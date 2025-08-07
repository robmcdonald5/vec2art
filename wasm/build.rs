use std::env;

fn main() {
    // Only build C libraries when the features are enabled
    let target = env::var("TARGET").unwrap();
    let is_wasm = target.contains("wasm32");
    
    // Set up environment for WASM compilation
    if is_wasm {
        println!("cargo:rustc-link-arg=--export-dynamic");
        println!("cargo:rustc-link-arg=-z");
        println!("cargo:rustc-link-arg=stack-size=1048576"); // 1MB stack
    }
    
    // Build Potrace if feature is enabled
    #[cfg(feature = "potrace")]
    {
        build_potrace();
    }
    
    // Build Autotrace if feature is enabled  
    #[cfg(feature = "autotrace")]
    {
        build_autotrace();
    }
}

#[cfg(feature = "potrace")]
fn build_potrace() {
    println!("cargo:rerun-if-changed=src/external/potrace");
    
    let mut build = cc::Build::new();
    
    // Configure for target
    let target = env::var("TARGET").unwrap();
    if target.contains("wasm32") {
        build.target(&target);
        build.opt_level(2);
        build.flag("-fPIC");
        build.flag("-DWASM_BUILD");
        // Disable threading for WASM
        build.define("NO_THREADS", None);
    }
    
    // Add Potrace source files
    build
        .file("src/external/potrace/potrace_wrapper.c")
        .include("src/external/potrace/")
        .compile("potrace");
        
    println!("cargo:rustc-link-lib=static=potrace");
}

#[cfg(feature = "autotrace")]  
fn build_autotrace() {
    println!("cargo:rerun-if-changed=src/external/autotrace");
    
    let mut build = cc::Build::new();
    
    // Configure for target
    let target = env::var("TARGET").unwrap();
    if target.contains("wasm32") {
        build.target(&target);
        build.opt_level(2);
        build.flag("-fPIC");
        build.flag("-DWASM_BUILD");
        build.define("NO_THREADS", None);
    }
    
    // Add Autotrace source files
    build
        .file("src/external/autotrace/autotrace_wrapper.c")
        .include("src/external/autotrace/")
        .compile("autotrace");
        
    println!("cargo:rustc-link-lib=static=autotrace");
}