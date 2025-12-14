#!/bin/bash
echo "🔄 Starting Auto-Restart Loop..."

while true; do
    echo "🚀 Running script..."
    node scripts/process_sheet1_full.js
    
    EXIT_CODE=$?
    echo "⚠️ Script exited with code $EXIT_CODE"
    
    # Optional: If exit code 0 (success/complete), analyze output to see if it really finished?
    # But currently our script prints "Full Update Complete!" at the very end.
    # We can rely on user stopping it, or check log file.
    
    echo "💤 Restarting in 3 seconds... (Press Ctrl+C to stop)"
    sleep 3
done
