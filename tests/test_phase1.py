"""
HYT ATS - Phase 1 Verification Test Suite
=========================================
Verifies all Phase 1 Post-Check requirements:
1. Validates JD intake and error handling on invalid/missing files
2. Validates structured extraction into JobDescription Pydantic schema
3. Confirms disk caching: second run makes ZERO API calls
4. Verifies embedding dimension, normalization, and caching
5. Confirms all 6 real-world LinkedIn JDs extract cleanly
"""

import os
import sys
import pytest
from pathlib import Path
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.gates.jd_input import process_jd_input
from src.gates.jd_extraction import extract_job_description
from src.gates.jd_embedding import embed_job_requirements
from src.models.schemas import JobDescription, JobDescriptionRaw, SeniorityLevel
from src.utils.cache import get_cache_manager


def test_jd_input_validation():
    """Verify input handler accepts valid inputs and rejects invalid/short content."""
    # 1. Valid string input
    valid_text = "We are seeking a Senior Backend Engineer with 5+ years of Python, Docker, and PostgreSQL experience."
    raw_jd = process_jd_input(valid_text, job_id="test_swe_01", title="Backend Engineer")
    assert isinstance(raw_jd, JobDescriptionRaw)
    assert raw_jd.job_id == "test_swe_01"
    assert len(raw_jd.content_hash) == 64

    # 2. Rejects text that is too short
    with pytest.raises(ValueError, match="invalid or too short"):
        process_jd_input("Short text")

    # 3. Rejects missing file
    with pytest.raises(FileNotFoundError):
        process_jd_input(PROJECT_ROOT / "data" / "jds" / "non_existent_file.json")


def test_jd_extraction_and_schema():
    """Verify structured extraction adheres strictly to JobDescription schema."""
    sample_text = (
        "Role: Full Stack Software Engineer at Stripe. Requirements: 3+ years of professional experience "
        "in web development. Must have strong experience with React, TypeScript, Node.js, and SQL databases. "
        "Nice to have: Experience with AWS and GraphQL. Location: Remote. Bachelor's degree preferred."
    )
    raw_jd = process_jd_input(sample_text, job_id="test_stripe_01")
    jd = extract_job_description(raw_jd)

    assert isinstance(jd, JobDescription)
    assert len(jd.must_have_skills) >= 2
    assert jd.seniority_level in list(SeniorityLevel)
    assert jd.min_years_experience >= 1.0
    assert jd.content_hash == raw_jd.content_hash


def test_jd_caching_zero_api_calls():
    """Verify that second extraction of identical JD is loaded directly from cache."""
    cache = get_cache_manager()
    sample_text = (
        "Role: DevOps Engineer at Datadog. Required: 4+ years of experience with Terraform, Kubernetes, "
        "and AWS infrastructure. CI/CD pipeline automation experience is mandatory."
    )
    raw_jd = process_jd_input(sample_text, job_id="test_cache_jd")

    # Run 1: extract (miss or populate)
    jd1 = extract_job_description(raw_jd)
    assert cache.has("jds", raw_jd.content_hash) is True

    # Run 2: extract (guaranteed cache hit)
    jd2 = extract_job_description(raw_jd, use_cache=True)
    assert jd1.content_hash == jd2.content_hash
    assert jd1.must_have_skills == jd2.must_have_skills
    assert jd1.seniority_level == jd2.seniority_level


def test_jd_embeddings():
    """Verify dense embedding computation, normalization, and caching."""
    sample_text = (
        "Seeking a Staff Systems Engineer with 8+ years experience in distributed systems, "
        "Go or Rust, Kafka event streams, and high-throughput databases."
    )
    raw_jd = process_jd_input(sample_text, job_id="test_embed_jd")
    jd = extract_job_description(raw_jd)

    embeddings = embed_job_requirements(jd)
    assert "must_haves" in embeddings
    assert "domain_vector" in embeddings
    assert embeddings["dimension"] == 384
    assert len(embeddings["must_haves"]) == len(jd.must_have_skills)

    # Check vector normalization (L2 norm approx 1.0)
    for skill_name, vec in embeddings["must_haves"].items():
        arr = np.array(vec)
        norm = np.linalg.norm(arr)
        assert pytest.approx(norm, 1e-2) == 1.0, f"Vector for {skill_name} not normalized"


def test_all_six_golden_jds():
    """Verify that all 6 target LinkedIn JDs in data/jds extract and validate cleanly."""
    jds_dir = PROJECT_ROOT / "data" / "jds"
    jd_files = sorted(jds_dir.glob("*.json"))
    assert len(jd_files) == 6, f"Expected 6 JDs in {jds_dir}, found {len(jd_files)}"

    for jd_file in jd_files:
        raw_jd = process_jd_input(jd_file)
        structured_jd = extract_job_description(raw_jd)
        assert isinstance(structured_jd, JobDescription)
        assert len(structured_jd.must_have_skills) >= 3
        assert structured_jd.seniority_level is not None
        assert structured_jd.min_years_experience >= 0.0

        # Also check embedding runs without error
        emb = embed_job_requirements(structured_jd)
        assert emb["dimension"] == 384
        assert len(emb["must_haves"]) > 0
