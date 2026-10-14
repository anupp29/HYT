"""
HYT ATS — Main Pipeline Command-Line Interface
===============================================
Terminal-only CLI for applicant screening, evaluation, and verification.
"""

import os
import sys
import argparse
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.gates.jd_input import process_jd_input
from src.gates.jd_extraction import extract_job_description
from src.gates.jd_embedding import embed_job_requirements
from src.utils.logger import init_logger, get_logger
from src.utils.config import get_config


def main():
    parser = argparse.ArgumentParser(
        prog="hyt-ats",
        description="HuntYourTribe (HYT) — AI Screening Assistant CLI",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: verify-jd
    jd_parser = subparsers.add_parser("verify-jd", help="Extract and inspect structured requirements from a JD")
    jd_parser.add_argument("--input", "-i", type=str, help="Path to raw JD file (JSON or TXT)")
    jd_parser.add_argument("--job-id", "-j", type=str, help="Select one of the 6 standard JDs by ID (e.g. 2234533717)")
    jd_parser.add_argument("--refresh", action="store_true", help="Bypass cache and force re-extraction")

    # Command: list-jds
    subparsers.add_parser("list-jds", help="List all available pre-configured JDs in data/jds")

    args = parser.parse_args()

    # Initialize structured logger
    init_logger(console_output=True)
    logger = get_logger("CLI")

    if args.command == "list-jds":
        list_jds()
    elif args.command == "verify-jd":
        verify_jd_command(args)
    else:
        parser.print_help()


def list_jds():
    """Lists all available job descriptions in data/jds."""
    jds_dir = PROJECT_ROOT / "data" / "jds"
    if not jds_dir.exists():
        print(f"Error: JDs directory not found at {jds_dir}")
        return

    print("\n" + "=" * 70)
    print("HYT ATS — AVAILABLE JOB DESCRIPTIONS")
    print("=" * 70)
    for f in sorted(jds_dir.glob("*.json")):
        import json
        with open(f, "r", encoding="utf-8") as jf:
            data = json.load(jf)
        jid = data.get("job_id", f.stem)
        title = data.get("title", "N/A")
        company = data.get("company", "N/A")
        seniority = data.get("seniority_level", "N/A")
        yoe = data.get("min_years_experience", "N/A")
        print(f"  [{jid}] {title} @ {company} | Seniority: {seniority} | Min YoE: {yoe}")
    print("=" * 70 + "\n")


def verify_jd_command(args):
    """Executes Gates A1, A2, and A3 for a given Job Description."""
    jd_path = None
    if args.job_id:
        jd_path = PROJECT_ROOT / "data" / "jds" / f"jd_{args.job_id}.json"
        if not jd_path.exists():
            # try without prefix
            alt_path = PROJECT_ROOT / "data" / "jds" / f"{args.job_id}.json"
            if alt_path.exists():
                jd_path = alt_path
            else:
                print(f"Error: Could not find JD file for job_id '{args.job_id}' at {jd_path}")
                sys.exit(1)
    elif args.input:
        jd_path = Path(args.input)
        if not jd_path.exists():
            print(f"Error: File not found: {jd_path}")
            sys.exit(1)
    else:
        print("Error: You must provide either --input <file> or --job-id <id>")
        sys.exit(1)

    print(f"\n[HYT ATS] Ingesting Job Description from: {jd_path} ...")
    
    # Gate A1: Input & Content Hashing
    raw_jd = process_jd_input(jd_path)
    print(f"[OK] Gate A1 Passed: Job ID = {raw_jd.job_id} | Hash = {raw_jd.content_hash[:16]}...")

    # Gate A2: Structured Extraction (Cached)
    structured_jd = extract_job_description(raw_jd, force_refresh=args.refresh)
    print(f"[OK] Gate A2 Passed: Structured Schema Extracted")

    # Gate A3: Dense Embeddings (Cached)
    embeddings = embed_job_requirements(structured_jd, force_refresh=args.refresh)
    print(f"[OK] Gate A3 Passed: Generated {len(embeddings['must_haves'])} requirement embeddings (dim={embeddings['dimension']})")

    # Render Clean Recruiter Verification Summary
    print("\n" + "=" * 70)
    print(f"RECRUITER VERIFICATION CARD — {structured_jd.title.upper()}")
    print("=" * 70)
    print(f"Company:               {structured_jd.company}")
    print(f"Target Seniority:      {structured_jd.seniority_level.value.upper()}")
    print(f"Minimum Experience:    {structured_jd.min_years_experience} years")
    print(f"Location & Policy:     {structured_jd.location} ({structured_jd.remote_policy})")
    print(f"Education Baseline:    {structured_jd.education_requirement}")
    print(f"Domain Context:        {structured_jd.domain_context}")
    print("-" * 70)
    print("STRICT MUST-HAVE SKILLS (Hard Gate):")
    for idx, skill in enumerate(structured_jd.must_have_skills, 1):
        print(f"  {idx:2d}. {skill}")
    print("-" * 70)
    print("NICE-TO-HAVE SKILLS (Secondary / Preferred):")
    for idx, skill in enumerate(structured_jd.nice_to_have_skills, 1):
        print(f"  {idx:2d}. {skill}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
