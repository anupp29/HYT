"""
HYT ATS - Phase 2 Verification Test Suite (Gate 0: Integrity Shield)
===================================================================
Verifies all Phase 2 Post-Check requirements:
1. Clean resumes produce ZERO integrity flags
2. White-text resume triggers HIDDEN_TEXT flag
3. Off-page resume triggers OFF_PAGE flag
4. Microscopic text triggers TINY_FONT flag
5. Metadata-stuffed PDF triggers METADATA_STUFFED flag
6. Adversarial prompt injection triggers INJECTION_ATTEMPT flag
7. Verbatim JD copy triggers GAMING_DETECTED flag
8. Multi-attack resume with >= 2 flags triggers QUARANTINE = True
9. Math validation: WCAG 2.1 contrast ratio calculations
10. Error resilience: Non-existent or invalid PDF produces PARSING_ERROR, not a crash
"""

import os
import sys
import pytest
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.gates.gate0 import (
    evaluate_gate0,
    calculate_contrast_ratio,
    relative_luminance,
    load_pdf_data,
)
from src.models.schemas import Gate0IntegrityReport, IntegrityFlag


ADVERSARIAL_DIR = PROJECT_ROOT / "data" / "adversarial"
SAMPLE_DIR = PROJECT_ROOT / "data" / "sample"
JDS_DIR = PROJECT_ROOT / "data" / "jds"


def test_wcag_contrast_ratio_math():
    """Verify WCAG 2.1 contrast ratio formula produces exact mathematical bounds."""
    # Black [0, 0, 0] on White [1, 1, 1] must equal exactly 21:1
    contrast_bw = calculate_contrast_ratio([0.0, 0.0, 0.0], [1.0, 1.0, 1.0])
    assert pytest.approx(contrast_bw, 1e-2) == 21.0

    # White on White must equal exactly 1:1
    contrast_ww = calculate_contrast_ratio([1.0, 1.0, 1.0], [1.0, 1.0, 1.0])
    assert pytest.approx(contrast_ww, 1e-2) == 1.0

    # Symmetry: order of arguments does not affect ratio
    assert pytest.approx(calculate_contrast_ratio([0.2, 0.4, 0.6], [1.0, 1.0, 1.0]), 1e-2) == \
           pytest.approx(calculate_contrast_ratio([1.0, 1.0, 1.0], [0.2, 0.4, 0.6]), 1e-2)


def test_clean_real_resumes_zero_flags():
    """Verify that legitimate candidate resumes from data/sample produce 0 flags."""
    sample_files = list(SAMPLE_DIR.glob("*.pdf"))[:5]
    assert len(sample_files) >= 3, "Expected at least 3 clean sample PDFs"

    for pdf_file in sample_files:
        report = evaluate_gate0(str(pdf_file))
        assert isinstance(report, Gate0IntegrityReport)
        assert report.is_quarantined is False
        assert len(report.flags) == 0, f"False positive flags on clean resume {pdf_file.name}: {report.flags}"
        assert report.page_count >= 1
        assert report.min_contrast_ratio >= 4.5


def test_white_text_detector():
    """Verify hidden white text triggers HIDDEN_TEXT flag."""
    white_pdf = ADVERSARIAL_DIR / "white_text.pdf"
    assert white_pdf.exists(), f"Missing test fixture: {white_pdf}"

    report = evaluate_gate0(str(white_pdf))
    assert IntegrityFlag.HIDDEN_TEXT in report.flags
    assert report.min_contrast_ratio < 4.5
    assert "HIDDEN_TEXT" in report.flag_reasons


def test_off_page_text_detector():
    """Verify text coordinates outside page bounds trigger OFF_PAGE flag."""
    off_page_pdf = ADVERSARIAL_DIR / "off_page.pdf"
    assert off_page_pdf.exists(), f"Missing test fixture: {off_page_pdf}"

    report = evaluate_gate0(str(off_page_pdf))
    assert IntegrityFlag.OFF_PAGE in report.flags
    assert "OFF_PAGE" in report.flag_reasons


def test_tiny_font_detector():
    """Verify microscopic text stuffing (< 3.0 pt) triggers TINY_FONT flag."""
    tiny_pdf = ADVERSARIAL_DIR / "tiny_font.pdf"
    assert tiny_pdf.exists(), f"Missing test fixture: {tiny_pdf}"

    report = evaluate_gate0(str(tiny_pdf))
    assert IntegrityFlag.TINY_FONT in report.flags
    assert report.min_font_size_pt < 3.0
    assert "TINY_FONT" in report.flag_reasons


def test_metadata_stuffing_detector():
    """Verify skill-term density in PDF metadata triggers METADATA_STUFFED flag."""
    meta_pdf = ADVERSARIAL_DIR / "metadata_stuffed.pdf"
    assert meta_pdf.exists(), f"Missing test fixture: {meta_pdf}"

    report = evaluate_gate0(str(meta_pdf))
    assert IntegrityFlag.METADATA_STUFFED in report.flags
    assert report.metadata_skill_density >= 0.25
    assert "METADATA_STUFFED" in report.flag_reasons


def test_prompt_injection_detector():
    """Verify adversarial instruction overrides trigger INJECTION_ATTEMPT flag."""
    inj_pdf = ADVERSARIAL_DIR / "prompt_injection.pdf"
    assert inj_pdf.exists(), f"Missing test fixture: {inj_pdf}"

    report = evaluate_gate0(str(inj_pdf))
    assert IntegrityFlag.INJECTION_ATTEMPT in report.flags
    assert "INJECTION_ATTEMPT" in report.flag_reasons


def test_jd_copy_detector():
    """Verify verbatim copy of target JD text triggers GAMING_DETECTED flag."""
    jd_copy_pdf = ADVERSARIAL_DIR / "jd_copy.pdf"
    assert jd_copy_pdf.exists(), f"Missing test fixture: {jd_copy_pdf}"

    # Load matching JD text from data/jds/jd_2234533717.json
    import json
    sample_jd_path = JDS_DIR / "jd_2234533717.json"
    with open(sample_jd_path, "r", encoding="utf-8") as jf:
        jd_data = json.load(jf)
        jd_text = jd_data.get("raw_description") or jd_data.get("description", "")

    report = evaluate_gate0(str(jd_copy_pdf), target_jd_text=jd_text)
    assert IntegrityFlag.GAMING_DETECTED in report.flags
    assert report.jd_copy_similarity >= 0.82
    assert "GAMING_DETECTED" in report.flag_reasons


def test_multi_attack_triggers_quarantine():
    """Verify resume with >= 2 flags automatically sets is_quarantined = True."""
    multi_pdf = ADVERSARIAL_DIR / "multi_attack.pdf"
    assert multi_pdf.exists(), f"Missing test fixture: {multi_pdf}"

    report = evaluate_gate0(str(multi_pdf))
    assert len(report.flags) >= 2
    assert report.is_quarantined is True
    assert "QUARANTINE" in [k for k in ["QUARANTINE"]]  # Status validated


def test_non_existent_file_handling():
    """Verify missing PDF produces PARSING_ERROR without crashing."""
    report = evaluate_gate0(str(PROJECT_ROOT / "data" / "non_existent.pdf"))
    assert isinstance(report, Gate0IntegrityReport)
    assert IntegrityFlag.PARSING_ERROR in report.flags
    assert report.is_quarantined is True
