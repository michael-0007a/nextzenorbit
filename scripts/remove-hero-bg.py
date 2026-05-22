from __future__ import annotations

from pathlib import Path
from PIL import Image


def average_color(colors: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    r = sum(c[0] for c in colors) // len(colors)
    g = sum(c[1] for c in colors) // len(colors)
    b = sum(c[2] for c in colors) // len(colors)
    return (r, g, b)


def remove_bg(input_path: Path, output_path: Path, tolerance: int = 22) -> None:
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    corners = [
        pixels[0, 0][:3],
        pixels[width - 1, 0][:3],
        pixels[0, height - 1][:3],
        pixels[width - 1, height - 1][:3],
    ]
    bg = average_color(corners)
    tol_sq = tolerance * tolerance

    def is_bg(color: tuple[int, int, int]) -> bool:
        return sum((color[i] - bg[i]) ** 2 for i in range(3)) <= tol_sq

    visited = bytearray(width * height)
    stack: list[tuple[int, int]] = []

    for x in range(width):
        stack.append((x, 0))
        stack.append((x, height - 1))
    for y in range(height):
        stack.append((0, y))
        stack.append((width - 1, y))

    while stack:
        x, y = stack.pop()
        idx = y * width + x
        if visited[idx]:
            continue
        visited[idx] = 1

        r, g, b, a = pixels[x, y]
        if not is_bg((r, g, b)):
            continue

        pixels[x, y] = (r, g, b, 0)

        if x > 0:
            stack.append((x - 1, y))
        if x < width - 1:
            stack.append((x + 1, y))
        if y > 0:
            stack.append((x, y - 1))
        if y < height - 1:
            stack.append((x, y + 1))

    img.save(output_path)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    input_file = root / "public" / "hero.png"
    output_file = root / "public" / "hero-clean.png"
    remove_bg(input_file, output_file)
    print(f"Saved {output_file}")
