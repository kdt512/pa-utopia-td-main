#!/usr/bin/env python3
"""Convert PNG images to JPG and center-crop to 720x1280 using macOS sips."""

import sys
import subprocess
from pathlib import Path

TARGET_W, TARGET_H = 720, 1280


def get_dimensions(src: Path) -> tuple[int, int]:
    out = subprocess.check_output(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(src)], text=True)
    props = {}
    for line in out.splitlines():
        line = line.strip()
        if ":" in line:
            k, v = line.split(":", 1)
            props[k.strip()] = v.strip()
    return int(props["pixelWidth"]), int(props["pixelHeight"])


def convert(src: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    dest = out_dir / (src.stem + ".jpg")

    w, h = get_dimensions(src)

    # Scale so both dimensions are >= target (cover mode)
    if w * TARGET_H > h * TARGET_W:
        # wider — scale by height
        new_w, new_h = w * TARGET_H // h, TARGET_H
    else:
        # taller — scale by width
        new_w, new_h = TARGET_W, h * TARGET_W // w

    # Scale + convert to JPEG
    subprocess.run(
        ["sips", "-z", str(new_h), str(new_w), "-s", "format", "jpeg",
         "-s", "formatOptions", "90", str(src), "--out", str(dest)],
        check=True, capture_output=True,
    )

    # Center crop to exact target size (sips takes height then width)
    subprocess.run(
        ["sips", "-c", str(TARGET_H), str(TARGET_W), str(dest)],
        check=True, capture_output=True,
    )

    print(f"  {src.name}  →  {dest}  [{TARGET_W}x{TARGET_H}]")


def main():
    args = sys.argv[1:]
    if not args:
        print("Usage:")
        print("  python3 convert_images.py <file.png> [file2.png ...]")
        print("  python3 convert_images.py <folder>")
        print()
        print("Output is saved to ./output/ next to each source file.")
        sys.exit(0)

    sources: list[Path] = []
    for arg in args:
        p = Path(arg)
        if p.is_dir():
            sources.extend(sorted(p.glob("**/*.png")))
            sources.extend(sorted(p.glob("**/*.PNG")))
        elif p.is_file():
            sources.append(p)
        else:
            print(f"Warning: '{arg}' not found, skipping.")

    if not sources:
        print("No PNG files found.")
        sys.exit(1)

    print(f"Converting {len(sources)} file(s) to {TARGET_W}x{TARGET_H} JPG...\n")
    for src in sources:
        out_dir = src.parent / "output"
        convert(src, out_dir)

    print("\nDone.")


if __name__ == "__main__":
    main()
