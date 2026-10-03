#!/bin/bash
# ./encode-preview.sh iphone|ipad|mac input.mov  → input-AppStore-<device>.mp4
set -euo pipefail

case "$1" in
  iphone) W=886; H=1920 ;;
  ipad) W=1600; H=1200 ;;
  mac) W=1920; H=1080 ;;
  *) echo "device: iphone | ipad | mac"; exit 1 ;;
esac
IN="$2"; OUT="${IN%.*}-AppStore-$1.mp4"

SILENCE=()
if ! ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | grep -q .; then
  SILENCE=(-f lavfi -i anullsrc=r=48000:cl=stereo -shortest)
fi

ffmpeg -y -loglevel error -i "$IN" ${SILENCE[@]+"${SILENCE[@]}"} \
  -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p \
  -vf "scale=$W:$H:force_original_aspect_ratio=disable,setsar=1:1" -r 30 \
  -b:v 10M -maxrate 12M -bufsize 12M \
  -movflags +faststart "$OUT"

LEVEL=$(ffprobe -v error -select_streams v:0 -show_entries stream=level -of csv=p=0 "$OUT" | tr -d '[:space:]')
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
[ "$LEVEL" = "40" ] && echo "✓ $OUT · ${W}x${H} · level 4.0 · ${DUR}s" || { echo "✗ level $LEVEL, expected 40"; exit 1; }
