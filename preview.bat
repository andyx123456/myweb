@echo off
cd /d "%~dp0"
echo Opening local preview at http://127.0.0.1:5500/
echo Keep this window open while you browse. Press Ctrl+C to stop.
start "" "http://127.0.0.1:5500/"
python -m http.server 5500
