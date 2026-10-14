"""
HYT ATS - Phase 0 Verification Test Suite
=========================================
Verifies that all Phase 0 Post-Check requirements pass completely:
1. Directory structure matches specification
2. config.yaml is fully defined and loads cleanly
3. Config loader validates weights sum to 1.0 and rejects invalid configs
4. Dynamic environment variable overrides work
5. All Pydantic models are importable and functional
6. Structured logging writes JSON-Lines logs correctly
7. Atomic CacheManager read/write round-trip operates properly
8. .gitignore covers required paths
"""

import os
import sys
import json
import pytest
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.utils.config import load_config, get_config, AppConfig, Gate6Weights
from src.utils.logger import init_logger, StructuredJsonFormatter
from src.utils.cache import CacheManager
from src.models.schemas import (
    JobDescription,
    JobDescriptionRaw,
    ResumeStructured,
    Skill,
    ExperienceEntry,
    EducationEntry,
    LedgerEntry,
    ScoringBreakdown,
    ScoringLedger,
    CandidateRecord,
    DecisionType,
    DimensionType,
    SeniorityLevel,
)


def test_directory_structure():
    """Verify all required directories exist per plan.md 0.1."""
    required_dirs = [
        "src/gates",
        "src/models",
        "src/utils",
        "eval",
        "data/sample",
        "data/golden",
        "data/jds",
        "cache",
        "logs",
        "tests",
    ]
    for rel_path in required_dirs:
        full_path = PROJECT_ROOT / rel_path
        assert full_path.exists(), f"Missing required directory: {rel_path}"
        assert full_path.is_dir(), f"Path is not a directory: {rel_path}"


def test_config_load_and_validation():
    """Verify config.yaml loads cleanly and validates mathematical constraints."""
    config_path = PROJECT_ROOT / "config.yaml"
    assert config_path.exists(), "config.yaml does not exist"

    config = load_config(str(config_path))
    assert isinstance(config, AppConfig)
    assert config.llm.model is not None
    assert config.embeddings.model_name is not None
    assert config.gate7.high_threshold > config.gate7.low_threshold

    # Verify weights sum to exactly 1.0
    w = config.gate6.weights
    total = w.technical + w.experience + w.seniority + w.education + w.location
    assert pytest.approx(total, 1e-4) == 1.0, f"Weights sum {total} != 1.0"


def test_config_invalid_weights_rejected():
    """Verify that Gate 6 weights NOT summing to 1.0 raises a ValueError."""
    with pytest.raises(ValueError, match="must sum to exactly 1.0"):
        Gate6Weights(technical=0.5, experience=0.5, seniority=0.2, education=0.05, location=0.05)


def test_dynamic_env_override(monkeypatch):
    """Verify that environment variables dynamically override configuration values."""
    monkeypatch.setenv("HYT_GATE7_HIGH_THRESHOLD", "88.5")
    config = load_config(str(PROJECT_ROOT / "config.yaml"))
    assert config.gate7.high_threshold == 88.5


def test_pydantic_schemas():
    """Verify all core Pydantic schemas can be constructed and validated."""
    # 1. Skill
    skill = Skill(name="Python", context="Developed backend microservices", is_verified=True, years_experience=4.0)
    assert skill.is_verified is True

    # 2. JobDescription
    jd = JobDescription(
        job_id="test_001",
        title="Senior Python Engineer",
        seniority_level=SeniorityLevel.SENIOR,
        min_years_experience=5.0,
        must_have_skills=["Python", "PostgreSQL", "Docker"],
        nice_to_have_skills=["Redis", "Kafka"],
        content_hash="abc123hash",
    )
    assert len(jd.must_have_skills) == 3

    # 3. ResumeStructured
    resume = ResumeStructured(
        candidate_id="cand_001",
        estimated_years_experience=6.0,
        seniority_level=SeniorityLevel.SENIOR,
        skills=[skill, Skill(name="Kafka", is_verified=False)],
        experience=[
            ExperienceEntry(
                title="Software Engineer",
                company="TechCorp",
                years=3.0,
                bullets=["Built streaming pipeline in Python"],
                skills_demonstrated=["Python"],
            )
        ],
        content_hash="def456hash",
    )
    assert len(resume.verified_skills) == 1
    assert len(resume.unverified_skills) == 1

    # 4. Evidence Ledger & Scoring
    ledger_entry = LedgerEntry(
        dimension=DimensionType.TECHNICAL,
        requirement="Python",
        evidence="Developed backend microservices",
        is_verified=True,
        score_contribution=25.0,
        gap=None,
    )
    breakdown = ScoringBreakdown(
        technical_score=85.0,
        experience_score=90.0,
        seniority_score=100.0,
        education_score=60.0,
        location_score=100.0,
        weighted_total=88.0,
    )
    ledger = ScoringLedger(
        candidate_id="cand_001",
        job_id="test_001",
        entries=[ledger_entry],
        breakdown=breakdown,
        verified_must_haves_count=1,
        total_must_haves_count=1,
    )
    assert ledger.breakdown.weighted_total == 88.0


def test_structured_logger(tmp_path):
    """Verify logger writes structured JSON-lines to file correctly."""
    log_dir = str(tmp_path / "logs")
    logger = init_logger(log_dir=log_dir, log_level="DEBUG", console_output=False)

    logger.gate_entry("GATE0", "cand_999", "Starting hidden text check")
    logger.gate_exit("GATE0", "cand_999", "PASSED", latency_ms=12.5)

    # Inspect the generated JSON-Lines log file
    log_files = list(Path(log_dir).glob("*.jsonl"))
    assert len(log_files) == 1, "Log file not created"

    with open(log_files[0], "r", encoding="utf-8") as f:
        lines = [json.loads(line) for line in f if line.strip()]

    assert len(lines) >= 2
    assert lines[0]["gate"] == "GATE0"
    assert lines[0]["candidate_id"] == "cand_999"
    assert lines[0]["event_type"] == "GATE_ENTRY"
    assert lines[1]["latency_ms"] == 12.5


def test_cache_manager_atomic_roundtrip(tmp_path):
    """Verify atomic disk caching read/write/miss lifecycle."""
    cache_dir = str(tmp_path / "cache")
    cache = CacheManager(cache_dir=cache_dir)

    # 1. Miss handling (never raises)
    assert cache.get("resumes", "nonexistent_key") is None
    assert cache.has("resumes", "nonexistent_key") is False

    # 2. Write & Read dict
    payload = {"candidate_id": "cand_123", "score": 92.5, "skills": ["Python", "AWS"]}
    success = cache.set("resumes", "cand_123", payload)
    assert success is True
    assert cache.has("resumes", "cand_123") is True

    cached_val = cache.get("resumes", "cand_123")
    assert cached_val == payload

    # 3. Write & Read Pydantic model
    skill = Skill(name="Golang", is_verified=True, years_experience=3.0)
    cache.set("resumes", "skill_01", skill)
    retrieved_skill = cache.get_model("resumes", "skill_01", Skill)
    assert retrieved_skill is not None
    assert retrieved_skill.name == "Golang"
    assert retrieved_skill.is_verified is True

    # 4. Delete
    assert cache.delete("resumes", "cand_123") is True
    assert cache.get("resumes", "cand_123") is None


def test_gitignore_coverage():
    """Verify .gitignore includes sensitive paths per plan.md 0.1."""
    gitignore_path = PROJECT_ROOT / ".gitignore"
    assert gitignore_path.exists(), ".gitignore does not exist"

    with open(gitignore_path, "r", encoding="utf-8") as f:
        content = f.read()

    required_patterns = ["cache/", "logs/", "data/raw/", "data/sample/", ".env"]
    for pattern in required_patterns:
        assert pattern in content, f".gitignore missing: {pattern}"
