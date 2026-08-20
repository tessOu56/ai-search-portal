#!/usr/bin/env python3
"""Emit a tiny brand-colored PNG favicon (no deps)."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

# Portal favicon tile fill (#3a2a18) + accent (#ffda76) cross approximation
BG = (0x3A, 0x2A, 0x18, 0xFF)
FG = (0xFF, 0xDA, 0x76, 0xFF)


def png(size: int, path: Path) -> None:
    rows = []
    for y in range(size):
        row = bytearray([0])  # filter none
        for x in range(size):
            # rounded-ish square + cross
            edge = size // 8
            in_square = edge <= x < size - edge and edge <= y < size - edge
            mid = size // 2
            arm = max(1, size // 10)
            on_cross = abs(x - mid) <= arm or abs(y - mid) <= arm
            color = FG if in_square and on_cross else BG
            row.extend(color)
        rows.append(bytes(row))
    raw = b"".join(rows)
    compressed = zlib.compress(raw, 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    out = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")
    path.write_bytes(out)


def ico(png_bytes: bytes, path: Path) -> None:
    # Single PNG-compressed ICO (Vista+)
    count = 1
    header = struct.pack("<HHH", 0, 1, count)
    # width/height 0 means 256; for 32 use 32
    entry = struct.pack("<BBBBHHII", 32, 32, 0, 0, 1, 32, len(png_bytes), 6 + 16)
    path.write_bytes(header + entry + png_bytes)


root = Path(__file__).resolve().parents[1] / "public"
png32 = root / "favicon-32.png"
png16 = root / "favicon-16.png"
png(32, png32)
png(16, png16)
ico(png32.read_bytes(), root / "favicon.ico")
print("wrote", png16, png32, root / "favicon.ico")
