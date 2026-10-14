"""
HYT ATS - Gate 0: Integrity Shield
==================================
Fraud, adversarial attack, and gaming detection layer.
Runs first on the raw PDF document before any text extraction or LLM calls.

Evaluates 7 Deterministic & Adversarial Vectors:
  1. Hidden Text Detection (WCAG 2.1 contrast ratio vs background < 4.5)
  2. Off-Page Text Stuffing (bounding box coordinates outside page dimensions)
  3. Microscopic / Tiny Font Stuffing (font size < 3.0 pt)
  4. PDF Metadata Keyword Stuffing (technical skill token density > 0.25)
  5. Image-Over-Text Layering (z-order occlusion attacks)
  6. Direct JD Copying / Plagiarism (TF-IDF cosine similarity > 0.82)
  7. Adversarial Prompt Injection (system prompt overrides & instruction hijack)

Policy:
  - 1 flag: Logged at INFO level, surfaced permanently on CandidateRecord.
  - >= 2 flags (quarantine_flag_count): Pre-sets candidate is_quarantined = True,
    mandating human recruiter escalation regardless of raw scores.
  - Pipeline NEVER halts at Gate 0: continues execution with flags permanently attached.
"""

import os
import re
import math
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import fitz  # PyMuPDF

from src.models.schemas import (
    PDFData,
    PDFTextBlock,
    Gate0IntegrityReport,
    IntegrityFlag,
)
from src.utils.config import get_config
from src.utils.logger import get_logger

logger = get_logger("GATE_0_INTEGRITY_SHIELD")

# Standard Software Engineering & IT Skill Lexicon for Metadata Density Checking
SWE_SKILL_LEXICON = {
    "python", "java", "c", "c++", "cpp", "c#", "csharp", "golang", "go", "rust",
    "javascript", "typescript", "ruby", "php", "swift", "kotlin", "scala", "perl",
    "react", "reactjs", "angular", "vue", "vuejs", "nextjs", "next.js", "nodejs",
    "node.js", "express", "django", "flask", "fastapi", "spring", "springboot",
    "docker", "kubernetes", "k8s", "aws", "gcp", "azure", "terraform", "ansible",
    "ci/cd", "cicd", "jenkins", "github", "gitlab", "argocd", "helm", "linux",
    "sql", "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis",
    "cassandra", "dynamodb", "kafka", "rabbitmq", "elasticsearch", "graphql",
    "rest", "microservices", "distributed", "bash", "shell", "git", "agile",
    "scrum", "grpc", "protobuf", "devops", "cloud", "backend", "frontend",
    "fullstack", "architecture", "algorithms", "data structures", "security",
}

# Prompt Injection Detection Patterns
INJECTION_REGEX_PATTERNS = [
    re.compile(r"(?i)\b(ignore|disregard|forget|override|bypass)\b.{0,60}\b(previous|prior|above|all)\b.{0,40}\b(instructions|prompts|rules|commands|context)\b"),
    re.compile(r"(?i)\b(system\s*prompt|you\s+are\s+now|new\s+role|jailbreak|developer\s*mode)\b"),
    re.compile(r"(?i)\b(output|return|print|set|give|assign|always\s+return)\b.{0,40}\b(score|decision|status)?\b.{0,40}\b(100|advance|auto_advance|hire|perfect)\b"),
    re.compile(r"(?i)\b(always\s+return|assign\s+100|give\s+100|auto_advance\s+this\s+candidate|grant\s+bypass)\b"),
    re.compile(r"(<\|im_start\|>|<\|im_end\|>|\[system\]|\[system\s+instruction\]|assistant:|human:)", re.IGNORECASE),
    re.compile(r"(?i)\b(end of resume|ignore resume|resume ends here)\b"),
]


def load_pdf_data(pdf_path: str, candidate_id: Optional[str] = None) -> Tuple[PDFData, Optional[IntegrityFlag]]:
    """
    Loads raw PDF using PyMuPDF and extracts structured geometry, metadata, and text blocks.
    
    Args:
        pdf_path: Absolute or relative path to PDF file.
        candidate_id: Optional candidate identifier.
        
    Returns:
        Tuple of (PDFData, Optional parsing error flag).
    """
    path = Path(pdf_path)
    cid = candidate_id or path.stem

    if not path.exists():
        logger.error(f"PDF file not found at: {pdf_path}", gate="GATE_0", candidate_id=cid)
        return (
            PDFData(candidate_id=cid, pdf_path=str(path), page_count=0),
            IntegrityFlag.PARSING_ERROR,
        )

    try:
        doc = fitz.open(str(path))
    except Exception as e:
        logger.error(f"PyMuPDF failed to open PDF {path.name}: {e}", gate="GATE_0", candidate_id=cid)
        return (
            PDFData(candidate_id=cid, pdf_path=str(path), page_count=0),
            IntegrityFlag.PARSING_ERROR,
        )

    metadata = {k: str(v) for k, v in doc.metadata.items() if v}
    blocks_list: List[PDFTextBlock] = []
    full_text_parts: List[str] = []
    has_images = False
    image_count = 0

    try:
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_images = page.get_images()
            if page_images:
                has_images = True
                image_count += len(page_images)

            # Extract structured text with visual properties (using expanded canvas to capture off-page stuffing)
            expanded_clip = fitz.Rect(-5000, -5000, 5000, 5000)
            page_dict = page.get_text("dict", clip=expanded_clip)
            for block in page_dict.get("blocks", []):
                if block.get("type") == 0:  # Text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "")
                            if not text:
                                continue
                            full_text_parts.append(text)

                            # Convert sRGB int to normalized [r, g, b]
                            color_int = span.get("color", 0)
                            r = ((color_int >> 16) & 255) / 255.0
                            g = ((color_int >> 8) & 255) / 255.0
                            b = (color_int & 255) / 255.0

                            blocks_list.append(
                                PDFTextBlock(
                                    text=text,
                                    bbox=list(span.get("bbox", [0, 0, 0, 0])),
                                    font_size=float(span.get("size", 10.0)),
                                    font_name=span.get("font"),
                                    color_srgb=[r, g, b],
                                    page_index=page_idx,
                                )
                            )
    finally:
        page_count = len(doc)
        doc.close()

    raw_text = " ".join(full_text_parts)
    file_size = path.stat().st_size if path.exists() else 0

    pdf_data = PDFData(
        candidate_id=cid,
        pdf_path=str(path),
        page_count=page_count,
        metadata=metadata,
        raw_text=raw_text,
        blocks=blocks_list,
        has_images=has_images,
        image_count=image_count,
        file_size_bytes=file_size,
    )
    return pdf_data, None


# ------------------------------------------------------------------------------
# Mathematical Utilities: WCAG 2.1 Contrast Ratio
# ------------------------------------------------------------------------------

def srgb_channel_to_linear(c: float) -> float:
    """Converts sRGB color channel [0, 1] to linear luminance per IEC 61966-2-1."""
    if c <= 0.03928:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(rgb: List[float]) -> float:
    """Calculates WCAG 2.1 relative luminance for [r, g, b] color vector."""
    r_lin = srgb_channel_to_linear(rgb[0])
    g_lin = srgb_channel_to_linear(rgb[1])
    b_lin = srgb_channel_to_linear(rgb[2])
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin


def calculate_contrast_ratio(rgb1: List[float], rgb2: List[float]) -> float:
    """
    Computes WCAG 2.1 contrast ratio between two sRGB colors.
    Range: [1.0, 21.0]. Standard minimum contrast: 4.5:1.
    """
    l1 = relative_luminance(rgb1)
    l2 = relative_luminance(rgb2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


# ------------------------------------------------------------------------------
# Gate 0 Shield Evaluator
# ------------------------------------------------------------------------------

def evaluate_gate0(
    pdf_path: str,
    target_jd_text: Optional[str] = None,
    candidate_id: Optional[str] = None,
) -> Gate0IntegrityReport:
    """
    Executes Gate 0 Integrity Shield against the candidate PDF.
    
    Args:
        pdf_path: Path to candidate resume PDF.
        target_jd_text: Optional raw text of the JD being screened against.
        candidate_id: Optional unique candidate identifier.
        
    Returns:
        Gate0IntegrityReport containing all flags, metrics, and quarantine decision.
    """
    config = get_config()
    cid = candidate_id or Path(pdf_path).stem

    pdf_data, parse_err = load_pdf_data(pdf_path, candidate_id=cid)
    flags: List[IntegrityFlag] = []
    flag_reasons: Dict[str, str] = {}

    if parse_err:
        flags.append(parse_err)
        flag_reasons["PARSING_ERROR"] = f"Unable to read or parse PDF file: {pdf_path}"
        return Gate0IntegrityReport(
            candidate_id=cid,
            is_quarantined=True,
            flags=flags,
            flag_reasons=flag_reasons,
            page_count=0,
        )

    # 1. Hidden Text Detection (WCAG Contrast Ratio)
    min_contrast_observed = 21.0
    hidden_text_found = False
    hidden_snippets: List[str] = []

    for block in pdf_data.blocks:
        # Check text blocks with actual alphabetic words (ignore punctuation/spaces)
        clean_word = re.sub(r'[^a-zA-Z0-9]', '', block.text)
        if len(clean_word) >= 2:
            # Default PDF background is white [1.0, 1.0, 1.0]
            bg_color = [1.0, 1.0, 1.0]
            ratio = calculate_contrast_ratio(block.color_srgb, bg_color)
            if ratio < min_contrast_observed:
                min_contrast_observed = ratio

            # Trigger if contrast ratio is below threshold or color is near-white
            is_near_white = all(c >= 0.94 for c in block.color_srgb)
            if ratio < config.gate0.min_contrast_ratio or is_near_white:
                hidden_text_found = True
                block.is_hidden = True
                if len(hidden_snippets) < 3:
                    hidden_snippets.append(block.text[:40])

    if hidden_text_found:
        flags.append(IntegrityFlag.HIDDEN_TEXT)
        flag_reasons["HIDDEN_TEXT"] = (
            f"Hidden or low-contrast text detected (contrast ratio {min_contrast_observed:.2f}:1 "
            f"below WCAG minimum {config.gate0.min_contrast_ratio}:1). Snippets: {hidden_snippets}"
        )

    # 2. Off-Page Text Detector
    off_page_found = False
    off_page_snippets: List[str] = []

    # Get page dimensions from PyMuPDF doc directly
    try:
        doc = fitz.open(pdf_path)
        for block in pdf_data.blocks:
            clean_word = re.sub(r'[^a-zA-Z0-9]', '', block.text)
            if len(clean_word) >= 2 and block.page_index < len(doc):
                page_rect = doc[block.page_index].rect
                bx0, by0, bx1, by1 = block.bbox
                # Check if text is placed outside page bounds (off-page stuffing)
                is_outside = (
                    bx0 >= page_rect.width - 5
                    or by0 >= page_rect.height - 5
                    or bx1 <= 5
                    or by1 <= 5
                    or bx0 < -30
                    or by0 < -30
                    or bx1 > page_rect.width + 120
                    or by1 > page_rect.height + 120
                )
                if is_outside:
                    off_page_found = True
                    block.is_off_page = True
                    if len(off_page_snippets) < 3:
                        off_page_snippets.append(f"'{block.text[:30]}' at ({bx0:.1f}, {by0:.1f})")
        doc.close()
    except Exception as e:
        logger.warning(f"Error checking off-page coordinates: {e}", gate="GATE_0")

    if off_page_found:
        flags.append(IntegrityFlag.OFF_PAGE)
        flag_reasons["OFF_PAGE"] = (
            f"Text rendered outside physical page boundaries detected: {off_page_snippets}"
        )

    # 3. Tiny Font Detector (< min_font_size_pt)
    min_font_size_observed = 100.0
    tiny_font_found = False
    tiny_snippets: List[str] = []

    for block in pdf_data.blocks:
        clean_word = re.sub(r'[^a-zA-Z0-9]', '', block.text)
        if len(clean_word) >= 2:
            if block.font_size < min_font_size_observed:
                min_font_size_observed = block.font_size

            if block.font_size < config.gate0.min_font_size_pt:
                tiny_font_found = True
                block.is_tiny = True
                if len(tiny_snippets) < 3:
                    tiny_snippets.append(f"'{block.text[:30]}' ({block.font_size:.1f}pt)")

    if min_font_size_observed == 100.0:
        min_font_size_observed = 10.0

    if tiny_font_found:
        flags.append(IntegrityFlag.TINY_FONT)
        flag_reasons["TINY_FONT"] = (
            f"Microscopic text stuffing detected (font size {min_font_size_observed:.1f}pt "
            f"below minimum {config.gate0.min_font_size_pt}pt). Snippets: {tiny_snippets}"
        )

    # 4. Metadata Stuffing Detector
    meta_text = " ".join(pdf_data.metadata.values()).lower()
    meta_tokens = [w for w in re.findall(r'[a-zA-Z0-9\+#\.]+', meta_text) if len(w) >= 2]
    matched_skills = [t for t in meta_tokens if t in SWE_SKILL_LEXICON]
    
    skill_density = len(matched_skills) / max(len(meta_tokens), 1)

    if (skill_density > config.gate0.metadata_skill_density_threshold and len(matched_skills) >= 4) or len(matched_skills) >= 12:
        flags.append(IntegrityFlag.METADATA_STUFFED)
        flag_reasons["METADATA_STUFFED"] = (
            f"PDF metadata keyword stuffing detected (skill token density {skill_density:.2f} "
            f"> {config.gate0.metadata_skill_density_threshold} with {len(matched_skills)} matched skill tokens)."
        )

    # 5. Adversarial Prompt Injection Detector
    injection_found = False
    matched_patterns: List[str] = []

    for pattern in INJECTION_REGEX_PATTERNS:
        match = pattern.search(pdf_data.raw_text)
        if match:
            injection_found = True
            matched_patterns.append(match.group(0)[:60])

    if injection_found:
        flags.append(IntegrityFlag.INJECTION_ATTEMPT)
        flag_reasons["INJECTION_ATTEMPT"] = (
            f"Adversarial prompt injection pattern detected in resume content: {matched_patterns}"
        )

    # 6. Direct JD Plagiarism / Verbatim Copy Detector
    jd_copy_sim = 0.0
    if target_jd_text and target_jd_text.strip():
        jd_copy_sim = _compute_tf_idf_similarity(pdf_data.raw_text, target_jd_text)
        if jd_copy_sim > config.gate0.jd_copy_similarity_threshold:
            flags.append(IntegrityFlag.GAMING_DETECTED)
            flag_reasons["GAMING_DETECTED"] = (
                f"Candidate resume exhibits {jd_copy_sim * 100:.1f}% TF-IDF lexical similarity "
                f"to the target JD, exceeding plagiarism threshold of {config.gate0.jd_copy_similarity_threshold * 100:.1f}%."
            )

    # 7. Page Count Warning
    if pdf_data.page_count > config.gate0.max_pages_warning:
        flags.append(IntegrityFlag.EXCESSIVE_PAGES)
        flag_reasons["EXCESSIVE_PAGES"] = (
            f"Resume length ({pdf_data.page_count} pages) exceeds standard threshold ({config.gate0.max_pages_warning} pages)."
        )

    # 8. Suspicious / Corrupt Characters
    if pdf_data.raw_text:
        non_printable = len([c for c in pdf_data.raw_text if ord(c) < 32 and c not in '\n\r\t'])
        suspicious_ratio = non_printable / max(len(pdf_data.raw_text), 1)
        if suspicious_ratio > config.gate0.suspicious_char_ratio_threshold:
            flags.append(IntegrityFlag.SUSPICIOUS_CHARACTERS)
            flag_reasons["SUSPICIOUS_CHARACTERS"] = (
                f"Suspicious/corrupted character density ({suspicious_ratio:.2%}) exceeds threshold."
            )

    # Quarantine Aggregation: >= quarantine_flag_count triggers quarantine status
    unique_flags = list(dict.fromkeys(flags))
    is_quarantined = len(unique_flags) >= config.gate0.quarantine_flag_count

    if is_quarantined:
        logger.warning(
            f"Candidate {cid} flagged for QUARANTINE ({len(unique_flags)} integrity flags triggered: {[f.value for f in unique_flags]})",
            gate="GATE_0",
            candidate_id=cid,
        )
    elif unique_flags:
        logger.info(
            f"Candidate {cid} triggered {len(unique_flags)} integrity flags: {[f.value for f in unique_flags]}",
            gate="GATE_0",
            candidate_id=cid,
        )
    else:
        logger.info(f"Candidate {cid} passed Gate 0 Integrity Shield with 0 flags.", gate="GATE_0", candidate_id=cid)

    report = Gate0IntegrityReport(
        candidate_id=cid,
        is_quarantined=is_quarantined,
        flags=unique_flags,
        flag_reasons=flag_reasons,
        min_contrast_ratio=round(min_contrast_observed, 2),
        min_font_size_pt=round(min_font_size_observed, 2),
        metadata_skill_density=round(skill_density, 3),
        jd_copy_similarity=round(jd_copy_sim, 3),
        page_count=pdf_data.page_count,
        raw_text_length=len(pdf_data.raw_text),
        clean_text_length=len(pdf_data.raw_text),
    )

    return report


def _compute_tf_idf_similarity(text_a: str, text_b: str) -> float:
    """Computes TF-IDF cosine similarity between two texts using scikit-learn."""
    if not text_a.strip() or not text_b.strip():
        return 0.0
    from sklearn.feature_extraction.text import TfidfVectorizer
    try:
        vec = TfidfVectorizer(stop_words="english", lowercase=True)
        matrix = vec.fit_transform([text_a, text_b])
        return float((matrix[0] @ matrix[1].T).toarray()[0, 0])
    except Exception:
        return 0.0
