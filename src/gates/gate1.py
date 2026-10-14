"""
HYT ATS - Gate 1: Layout-Aware Text Extraction
===============================================
Extracts clean plain text from raw PDF resumes using PyMuPDF (fitz).
Preserves natural document reading flow by:
  1. Detecting multi-column (e.g. 2-column) resume layouts by analyzing x-intervals.
  2. Sorting column blocks top-to-bottom, preventing cross-column sentence interleaving.
  3. Extracting tabular grid structures and section headers cleanly.
  4. Strictly excluding PDF metadata fields from extracted body text.
"""

import re
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import fitz  # PyMuPDF

from src.utils.logger import get_logger

logger = get_logger("GATE_1_LAYOUT_EXTRACTION")


def extract_clean_text(pdf_path: str) -> str:
    """
    Extracts structured, layout-aware plain text from a resume PDF.
    
    Args:
        pdf_path: Path to candidate PDF file.
        
    Returns:
        Clean plain text string preserving reading order.
    """
    path = Path(pdf_path)
    if not path.exists():
        logger.error(f"Cannot extract text: file not found at {pdf_path}", gate="GATE_1")
        return ""

    try:
        doc = fitz.open(str(path))
    except Exception as e:
        logger.error(f"Failed to open PDF {path.name}: {e}", gate="GATE_1")
        return ""

    pages_text: List[str] = []

    try:
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_text = _extract_page_layout_aware(page)
            if page_text.strip():
                pages_text.append(page_text.strip())
    finally:
        doc.close()

    full_clean_text = "\n\n".join(pages_text)
    logger.info(
        f"Extracted {len(full_clean_text)} characters across {len(pages_text)} pages for {path.stem}",
        gate="GATE_1",
    )
    return full_clean_text


def _extract_page_layout_aware(page: fitz.Page) -> str:
    """
    Analyzes page block geometry and extracts text according to layout (single vs multi-column).
    """
    rect = page.rect
    width = rect.width
    height = rect.height

    # Extract block structures (type 0 = text)
    page_dict = page.get_text("dict")
    raw_blocks = [b for b in page_dict.get("blocks", []) if b.get("type") == 0 and b.get("lines")]

    if not raw_blocks:
        # Fallback to plain text if no structured blocks
        return page.get_text("text")

    # Filter out off-page noise (blocks outside visible canvas)
    valid_blocks: List[Dict[str, Any]] = []
    for b in raw_blocks:
        bx0, by0, bx1, by1 = b.get("bbox", [0, 0, 0, 0])
        if bx0 >= -5 and by0 >= -5 and bx0 <= width + 5 and by0 <= height + 5:
            # Reconstruct text of block
            block_lines: List[str] = []
            for line in b.get("lines", []):
                line_text = "".join(span.get("text", "") for span in line.get("spans", []))
                if line_text.strip():
                    block_lines.append(line_text.strip())
            if block_lines:
                b_text = "\n".join(block_lines)
                valid_blocks.append({
                    "bbox": b["bbox"],
                    "x0": bx0,
                    "y0": by0,
                    "x1": bx1,
                    "y1": by1,
                    "text": b_text,
                })

    if not valid_blocks:
        return ""

    # Detect 2-Column Layout
    # Check if there is a distinct vertical column split around mid-page
    is_two_column, split_x = _detect_column_split(valid_blocks, width)

    if is_two_column and split_x:
        # Separate into left column and right column
        left_blocks = [b for b in valid_blocks if b["x1"] <= split_x + 20]
        right_blocks = [b for b in valid_blocks if b["x0"] >= split_x - 20]
        spanning_blocks = [b for b in valid_blocks if b["x0"] < split_x - 20 and b["x1"] > split_x + 20]

        # Sort headers/spanning blocks by y0, left column by y0, right column by y0
        top_spanning = sorted([b for b in spanning_blocks if b["y0"] < height * 0.25], key=lambda b: b["y0"])
        bottom_spanning = sorted([b for b in spanning_blocks if b["y0"] >= height * 0.25], key=lambda b: b["y0"])

        sorted_left = sorted(left_blocks, key=lambda b: (b["y0"], b["x0"]))
        sorted_right = sorted(right_blocks, key=lambda b: (b["y0"], b["x0"]))

        ordered_blocks = top_spanning + sorted_left + sorted_right + bottom_spanning
    else:
        # Standard Single Column: Sort primarily by y0 (top to bottom), secondarily by x0
        # Cluster blocks with nearly identical y0 (within 4pt)
        ordered_blocks = sorted(valid_blocks, key=lambda b: (round(b["y0"] / 5.0) * 5.0, b["x0"]))

    # Join blocks with clean linebreaks
    extracted_text = "\n\n".join(b["text"] for b in ordered_blocks)
    return _normalize_whitespace(extracted_text)


def _detect_column_split(blocks: List[Dict[str, Any]], page_width: float) -> Tuple[bool, Optional[float]]:
    """
    Detects whether text blocks form a distinct two-column layout.
    Returns (is_two_column, split_x_coordinate).
    """
    if len(blocks) < 4:
        return False, None

    # Check potential column gutters between 25% and 75% of page width
    min_x = page_width * 0.28
    max_x = page_width * 0.72

    left_candidates = [b for b in blocks if b["x1"] < page_width * 0.55]
    right_candidates = [b for b in blocks if b["x0"] > page_width * 0.40]

    # Substantial amount of content in both potential columns
    if len(left_candidates) >= 3 and len(right_candidates) >= 3:
        # Estimate gutter
        left_max = max(b["x1"] for b in left_candidates)
        right_min = min(b["x0"] for b in right_candidates)
        if right_min >= left_max - 15 and (right_min + left_max) / 2.0 >= min_x and (right_min + left_max) / 2.0 <= max_x:
            split_x = (right_min + left_max) / 2.0
            return True, split_x

    return False, None


def _normalize_whitespace(text: str) -> str:
    """Cleans excessive whitespace and blank lines while preserving paragraph breaks."""
    # Replace non-breaking spaces with standard space
    text = text.replace('\xa0', ' ').replace('\u200b', '')
    # Collapse 3+ newlines to 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()
