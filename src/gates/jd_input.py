"""
HYT ATS - Gate A1: Job Description Input Handler
================================================
Accepts JD as free text, JSON/TXT file path, or dictionary.
Validates required content and computes deterministic SHA-256 content hash.
"""

import os
import json
from pathlib import Path
from typing import Union, Dict, Any, Optional

from src.models.schemas import JobDescriptionRaw
from src.utils.cache import compute_sha256
from src.utils.logger import get_logger

logger = get_logger("GATE_A1_JD_INPUT")


def process_jd_input(
    jd_input: Union[str, Dict[str, Any], Path],
    job_id: Optional[str] = None,
    title: Optional[str] = None,
    company: Optional[str] = None,
) -> JobDescriptionRaw:
    """
    Ingests and validates raw Job Description input.
    
    Args:
        jd_input: Raw text string, file path, or dictionary containing JD data.
        job_id: Optional unique job identifier. Generated if not supplied.
        title: Optional title hint.
        company: Optional company hint.
        
    Returns:
        JobDescriptionRaw with content_hash computed from raw_text.
        
    Raises:
        ValueError: If input is empty, too short, or unreadable.
        FileNotFoundError: If file path does not exist.
    """
    raw_text = ""
    inferred_job_id = job_id
    inferred_title = title
    inferred_company = company

    if isinstance(jd_input, Path) or (isinstance(jd_input, str) and os.path.exists(jd_input)):
        file_path = Path(jd_input)
        if not file_path.is_file():
            raise FileNotFoundError(f"Job description file path does not exist: {file_path}")
            
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().strip()
            
        if file_path.suffix.lower() == ".json":
            try:
                data = json.loads(content)
                if isinstance(data, dict):
                    raw_text = data.get("raw_description") or data.get("description") or data.get("raw_text") or content
                    inferred_job_id = inferred_job_id or str(data.get("job_id", file_path.stem))
                    inferred_title = inferred_title or data.get("title")
                    inferred_company = inferred_company or data.get("company")
                else:
                    raw_text = content
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON in job description file {file_path}: {e}")
        else:
            raw_text = content
            inferred_job_id = inferred_job_id or file_path.stem

    elif isinstance(jd_input, dict):
        raw_text = (
            jd_input.get("raw_description")
            or jd_input.get("description")
            or jd_input.get("raw_text")
            or ""
        )
        inferred_job_id = inferred_job_id or str(jd_input.get("job_id", ""))
        inferred_title = inferred_title or jd_input.get("title")
        inferred_company = inferred_company or jd_input.get("company")

    elif isinstance(jd_input, str):
        raw_text = jd_input.strip()

    else:
        raise ValueError(f"Unsupported job description input type: {type(jd_input)}")

    # Strict Validation
    if not raw_text or len(raw_text.strip()) < 40:
        raise ValueError(
            f"Job description content is invalid or too short ({len(raw_text)} chars). "
            "Must be at least 40 characters of descriptive text."
        )

    # Compute deterministic SHA-256 hash of the normalized text
    content_hash = compute_sha256(raw_text)
    final_job_id = inferred_job_id or f"job_{content_hash[:8]}"

    logger.info(
        f"Processed raw JD input: job_id={final_job_id}, hash={content_hash[:12]}..., length={len(raw_text)} chars",
        gate="JD_INPUT",
        candidate_id="N/A",
    )

    return JobDescriptionRaw(
        job_id=final_job_id,
        raw_text=raw_text,
        title=inferred_title,
        company=inferred_company,
        content_hash=content_hash,
    )
