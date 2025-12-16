# Quick Start

Convert your first image to SVG in five steps.

## 1. Open the Converter

Navigate to the converter page at `/converter` or click "Start Converting" from the homepage.

## 2. Upload an Image

Drag and drop an image onto the upload area, or click to browse. Supported formats:

- JPEG
- PNG
- WebP
- BMP
- GIF

## 3. Select an Algorithm

Choose a vectorization algorithm based on your image type:

| Algorithm  | Best For                                         |
| ---------- | ------------------------------------------------ |
| Edge       | Line drawings, sketches, technical illustrations |
| Dots       | Portraits, artistic effects, vintage style       |
| Centerline | Logos, text, bold graphics                       |
| Superpixel | Abstract art, stylized illustrations             |

See [Algorithm Overview](../algorithms/overview.md) for detailed guidance.

## 4. Adjust Parameters

Use the settings panel to fine-tune output:

- **Detail**: Controls line sensitivity (0-10)
- **Stroke Width**: Line thickness (0.1-10px)
- **Algorithm-specific settings**: Vary by selected algorithm

Default settings work well for most images. Adjust as needed based on preview.

## 5. Download

Click "Download SVG" to save the vectorized result. Additional export options:

- PNG rasterization
- PDF export
- Copy SVG to clipboard

## Tips

**Image preparation**:

- Higher contrast images produce cleaner results
- Remove complex backgrounds before processing
- Crop to the subject area

**Performance**:

- Images under 2048x2048 process in under 2 seconds
- Large images may take longer; consider resizing first

## Next Steps

- [Algorithm Overview](../algorithms/overview.md) - Understanding each algorithm
- [Parameters Reference](../reference/parameters.md) - All configuration options
