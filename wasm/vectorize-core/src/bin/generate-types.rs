//! TypeScript type generation binary
//!
//! This binary generates TypeScript interfaces from the Rust parameter registry
//! and outputs them to stdout or a specified file.

use std::env;
use std::fs;
use std::io::{self, Write};
use vectorize_core::parameters::codegen;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    
    // Generate TypeScript interfaces
    let typescript_code = codegen::generate_typescript_file()?;
    
    if args.len() > 1 {
        // Output to specified file
        let output_path = &args[1];
        fs::write(output_path, typescript_code)?;
        println!("TypeScript types generated to: {}", output_path);
    } else {
        // Output to stdout
        io::stdout().write_all(typescript_code.as_bytes())?;
    }
    
    Ok(())
}