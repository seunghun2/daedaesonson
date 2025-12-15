#!/bin/bash

# PDF to PNG converter using macOS qlmanage

PDF_DIR="/Users/el/Desktop/daedaesonson/archive5"
OUTPUT_DIR="/Users/el/Desktop/daedaesonson/archive5_images"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Counter
count=0
total=$(find "$PDF_DIR" -name "*.pdf" | wc -l | tr -d ' ')

echo "Found $total PDF files to convert"
echo ""

# Convert each PDF
for pdf in "$PDF_DIR"/*.pdf; do
    if [ -f "$pdf" ]; then
        count=$((count + 1))
        filename=$(basename "$pdf" .pdf)
        
        echo "[$count/$total] Converting: $(basename "$pdf")"
        
        # Use qlmanage to generate thumbnail
        qlmanage -t -s 2000 -o "$OUTPUT_DIR" "$pdf" > /dev/null 2>&1
        
        # Rename the output file (qlmanage adds .png.png)
        if [ -f "$OUTPUT_DIR/${filename}.pdf.png" ]; then
            mv "$OUTPUT_DIR/${filename}.pdf.png" "$OUTPUT_DIR/${filename}.png"
            echo "  ✅ Success"
        else
            echo "  ❌ Failed"
        fi
        
        # Progress update every 100 files
        if [ $((count % 100)) -eq 0 ]; then
            echo ""
            echo "📊 Progress: $count/$total files processed"
            echo ""
        fi
    fi
done

echo ""
echo "================================="
echo "✅ Conversion complete!"
echo "Total: $total"
echo "Output: $OUTPUT_DIR"
echo "================================="
