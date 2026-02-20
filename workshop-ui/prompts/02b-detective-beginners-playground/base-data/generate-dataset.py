"""Parse a Datasaurus CSV and write a reduced, renamed CSV.

Reads an input CSV that contains at least the columns ``dataset``, ``x`` and ``y``
and writes a new CSV named ``datasaurus-parsed.csv`` with the header
``figur,X,Y`` containing only the following subdatasets (renamed):

- ``circle`` -> ``bamfu``
- ``bullseye`` -> ``wuppi``
- ``star`` -> ``zonki``
- ``dino`` -> ``plinki``

If an input filename is not provided the script will try to read
``datasaurus.csv`` from the same directory; if that doesn't exist it will fall
back to ``datasaurus-full.csv`` which is the common filename in the exercises.
This script is intentionally small and dependency-free (uses the standard
library only).

Usage:
	python3 generate-dataset.py [--input PATH] [--output PATH]

The default output file is ``datasaurus-parsed.csv`` in the same directory as
the script.
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
import random
from typing import Dict


DEFAULT_INPUT_CANDIDATES = ["datasaurus.csv", "datasaurus-full.csv"]
DEFAULT_OUTPUT = "datasaurus-parsed.csv"

# mapping of accepted dataset names to output figur names
NAME_MAP: Dict[str, str] = {
	"circle": "bamfu",
	"bullseye": "wuppi",
	"star": "zonki",
	"dino": "plinki",
}


def find_input_file(provided: str | None, base_dir: str) -> str | None:
	if provided:
		path = os.path.abspath(provided)
		if os.path.isfile(path):
			return path
		return None

	for candidate in DEFAULT_INPUT_CANDIDATES:
		path = os.path.join(base_dir, candidate)
		if os.path.isfile(path):
			return path
	return None


def parse_and_write(input_path: str, output_path: str) -> int:
	"""Read input CSV, filter and remap rows, write output CSV.

	Returns the number of written rows (excluding header).
	"""
	written = 0

	with open(input_path, newline="", encoding="utf-8") as inf:
		reader = csv.DictReader(inf)
		# Expecting columns named dataset, x, y (case-insensitive)
		lower_field_map = {name.lower(): name for name in reader.fieldnames or []}
		if "dataset" not in lower_field_map or "x" not in lower_field_map or "y" not in lower_field_map:
			raise ValueError(
				f"Input file {input_path!r} must contain columns 'dataset', 'x', 'y' (found: {reader.fieldnames})"
			)

		dataset_field = lower_field_map["dataset"]
		x_field = lower_field_map["x"]
		y_field = lower_field_map["y"]

		# Collect matching rows first so we can scramble them before writing
		rows_to_write: list[tuple[str, str, str]] = []
		for row in reader:
			ds = (row.get(dataset_field) or "").strip()
			if not ds:
				continue
			key = ds.lower()
			if key not in NAME_MAP:
				continue
			figur = NAME_MAP[key]

			x = row.get(x_field, "").strip()
			y = row.get(y_field, "").strip()

			rows_to_write.append((figur, x, y))

		# Scramble the collected rows
		random.shuffle(rows_to_write)

		# Write output file and header
		with open(output_path, "w", newline="", encoding="utf-8") as outf:
			writer = csv.writer(outf)
			writer.writerow(["figur", "X", "Y"])
			for figur, x, y in rows_to_write:
				writer.writerow([figur, x, y])
				written += 1

	return written


def main(argv: list[str] | None = None) -> int:
	argv = argv if argv is not None else sys.argv[1:]
	base_dir = os.path.dirname(os.path.abspath(__file__))

	parser = argparse.ArgumentParser(description="Generate reduced Datasaurus CSV with renamed subdatasets")
	parser.add_argument("--input", "-i", help="Path to input CSV (optional)")
	parser.add_argument("--output", "-o", help=f"Output file name (default: {DEFAULT_OUTPUT})")
	args = parser.parse_args(argv)

	input_path = find_input_file(args.input, base_dir)
	if not input_path:
		print("Error: could not find input CSV. Tried provided path and default candidates:", file=sys.stderr)
		for c in DEFAULT_INPUT_CANDIDATES:
			print("  -", c, file=sys.stderr)
		return 2

	output_path = os.path.abspath(args.output) if args.output else os.path.join(base_dir, "..", DEFAULT_OUTPUT)

	try:
		count = parse_and_write(input_path, output_path)
	except Exception as e:
		print("Error while processing:", e, file=sys.stderr)
		return 3

	print(f"Wrote {count} rows to {output_path}")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
