#!/bin/bash
# ./compile-all.sh shaders/ preamble.glsl epilogue.glsl  → build/{spv,msl,es}/, non-zero exit on any failure
# needs: glslangValidator (brew install glslang), spirv-cross (brew install spirv-cross)
set -uo pipefail

SRC="$1"; PRE="$2"; EPI="$3"
mkdir -p build/{tmp,spv,msl,es}
ok=0; fail=0; failed=()

for f in $(find "$SRC" -name '*.glsl' | sort); do
  key=$(echo "${f#$SRC/}" | sed 's#/#__#g; s#\.glsl$##')
  cat "$PRE" "$f" "$EPI" > "build/tmp/$key.frag"
  if glslangValidator -V --quiet -S frag "build/tmp/$key.frag" -o "build/spv/$key.spv" >"build/tmp/$key.log" 2>&1 \
     && spirv-cross "build/spv/$key.spv" --msl --msl-version 20100 --output "build/msl/$key.metal" 2>>"build/tmp/$key.log" \
     && spirv-cross "build/spv/$key.spv" --es --version 300 --output "build/es/$key.frag" 2>>"build/tmp/$key.log"; then
    ok=$((ok + 1))
  else
    fail=$((fail + 1)); failed+=("$key")
  fi
done

echo "compiled $ok · failed $fail"
for k in "${failed[@]:-}"; do [ -n "$k" ] && { echo "--- $k"; head -5 "build/tmp/$k.log"; }; done
[ "$fail" -eq 0 ]
