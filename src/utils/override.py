"""
HYT ATS - Recruiter Decision Override Audit Logger
==================================================
Logs human recruiter overrides to an immutable JSONL audit trail (logs/overrides.jsonl)
per master.md Section 3 Gate 10 and plan.md Task 7.3.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from src.models.schemas import DecisionType
from src.utils.logger import get_logger

logger = get_logger("DECISION_OVERRIDE")
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_OVERRIDES_PATH = PROJECT_ROOT / "logs" / "overrides.jsonl"


def log_decision_override(
    candidate_id: str,
    new_decision: DecisionType,
    reason: str,
    original_decision: Optional[DecisionType] = None,
    job_id: Optional[str] = None,
    recruiter_id: str = "human_recruiter",
    overrides_file: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Appends an immutable audit log entry for a human decision override.
    
    Args:
        candidate_id: Unique candidate identifier.
        new_decision: Overridden DecisionType.
        reason: Human explanation for the override.
        original_decision: Original system decision.
        job_id: Target job identifier.
        recruiter_id: Name or ID of reviewing recruiter.
        overrides_file: Optional path override.
        
    Returns:
        The logged audit entry dictionary.
    """
    path = overrides_file or DEFAULT_OVERRIDES_PATH
    path.parent.mkdir(parents=True, exist_ok=True)

    entry = {
        "timestamp": datetime.now().isoformat(),
        "candidate_id": candidate_id,
        "job_id": job_id or "UNKNOWN",
        "original_decision": original_decision.value if original_decision else "UNKNOWN",
        "new_decision": new_decision.value,
        "reason": reason.strip(),
        "recruiter_id": recruiter_id,
    }

    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    logger.info(
        f"Logged human decision override for {candidate_id}: "
        f"{original_decision.value if original_decision else '?'} -> {new_decision.value} "
        f"(Reason: '{reason}')",
        candidate_id=candidate_id,
    )

    return entry
