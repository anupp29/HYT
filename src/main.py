"""
HYT ATS — Main Pipeline Command-Line Interface
===============================================
Terminal-only CLI for applicant screening, evaluation, and verification.
Provides multi-provider AI model selection and diagnostics.
"""

import os
import sys
import time
import json
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
from src.utils.llm_client import get_llm_client


def main():
    parser = argparse.ArgumentParser(
        prog="hyt-ats",
        description="HuntYourTribe (HYT) — AI Screening Assistant CLI",
    )
    parser.add_argument(
        "--provider",
        "-p",
        type=str,
        default=None,
        help="Override LLM provider ('gemini', 'groq', 'ollama', 'openai', 'anthropic')",
    )
    parser.add_argument(
        "--model",
        "-m",
        type=str,
        default=None,
        help="Override AI model name (e.g. 'llama-3.3-70b-versatile', 'gemma4', 'swift-12b', 'qwen2.5-coder:1.5b')",
    )

    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: verify-jd
    jd_parser = subparsers.add_parser("verify-jd", help="Extract and inspect structured requirements from a JD")
    jd_parser.add_argument("--input", "-i", type=str, help="Path to raw JD file (JSON or TXT)")
    jd_parser.add_argument("--job-id", "-j", type=str, help="Select one of the 6 standard JDs by ID (e.g. 2234533717)")
    jd_parser.add_argument("--refresh", action="store_true", help="Bypass cache and force re-extraction")
    jd_parser.add_argument("--provider", "-p", type=str, help="LLM provider for this extraction")
    jd_parser.add_argument("--model", "-m", type=str, help="AI model name for this extraction")

    # Command: list-jds
    subparsers.add_parser("list-jds", help="List all available pre-configured JDs in data/jds")

    # Command: list-models
    subparsers.add_parser("list-models", help="Inspect status and available models across all 4 AI client ecosystems")

    # Command: test-llm
    test_parser = subparsers.add_parser("test-llm", help="Send a diagnostic probe to test LLM provider and model connectivity")
    test_parser.add_argument("--provider", "-p", type=str, default=None, help="Provider to test ('gemini', 'groq', 'ollama', 'openai', 'anthropic')")
    test_parser.add_argument("--model", "-m", type=str, default=None, help="Model name to test (e.g. 'gemma4', 'swift-12b', 'llama-3.3-70b-versatile')")

    args = parser.parse_args()

    # Initialize structured logger
    init_logger(console_output=True)

    if args.command == "list-jds":
        list_jds()
    elif args.command == "list-models":
        list_models_command()
    elif args.command == "test-llm":
        test_llm_command(args)
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
        with open(f, "r", encoding="utf-8") as jf:
            data = json.load(jf)
        jid = data.get("job_id", f.stem)
        title = data.get("title", "N/A")
        company = data.get("company", "N/A")
        seniority = data.get("seniority_level", "N/A")
        yoe = data.get("min_years_experience", "N/A")
        print(f"  [{jid}] {title} @ {company} | Seniority: {seniority} | Min YoE: {yoe}")
    print("=" * 70 + "\n")


def list_models_command():
    """Displays connection status and available models for all 4 AI client ecosystems."""
    llm = get_llm_client()
    status = llm.get_provider_status()

    print("\n" + "=" * 75)
    print("HYT ATS — MULTI-PROVIDER AI CLIENT ECOSYSTEMS")
    print("=" * 75)

    # 1. Google Gemini
    gem = status["gemini"]
    gem_icon = "[ACTIVE]" if gem["configured"] else "[NO KEY]"
    print(f"1. Google Gemini               {gem_icon}")
    print(f"   API Key:     {gem['key_preview']}")
    print(f"   Default:     {gem['default_model']}")
    print(f"   Supported:   {', '.join(gem['supported_models'])}")
    print("-" * 75)

    # 2. Groq Cloud
    grq = status["groq"]
    grq_icon = "[CONFIGURED]" if grq["configured"] else "[NO KEY]"
    print(f"2. Groq Cloud (Ultra-Fast)     {grq_icon}")
    print(f"   API Key:     {grq['key_preview']}")
    print(f"   Default:     {grq['default_model']}")
    print(f"   Supported:   {', '.join(grq['supported_models'])}")
    print("-" * 75)

    # 3. Local Ollama
    ola = status["ollama"]
    ola_icon = "[ONLINE]" if ola["configured"] else "[OFFLINE / EMPTY]"
    print(f"3. Local Ollama (Zero API Key) {ola_icon}")
    print(f"   Endpoint:    {ola['endpoint']}")
    if ola["installed_models"]:
        print("   Installed Models:")
        for im in ola["installed_models"]:
            parent_note = f" (Parent/Family: {im['parent'] or im['family']})" if im.get("parent") or im.get("family") else ""
            print(f"     - {im['name']} [{im['size_gb']} GB]{parent_note}")
    else:
        print("   Installed Models: None detected at endpoint")
    print(f"   Aliases:     'gemma4' -> swift-12b:latest | 'qwen' -> qwen2.5-coder:1.5b")
    print("-" * 75)

    # 4. OpenAI & Anthropic
    oai = status["openai"]
    oai_icon = "[CONFIGURED]" if oai["configured"] else "[NO KEY]"
    print(f"4. OpenAI / Anthropic          {oai_icon}")
    print(f"   OpenAI Key:  {oai['key_preview']} (Default: {oai['default_model']})")
    print(f"   Supported:   {', '.join(oai['supported_models'])}")
    print("=" * 75)
    print("HOW TO CHOOSE AI MODEL:")
    print("  CLI Flag:     python -m src.main verify-jd --job-id 2234533717 --provider ollama --model gemma4")
    print("  Env Var:      export HYT_LLM_PROVIDER=groq && export HYT_LLM_MODEL=llama-3.3-70b-versatile")
    print("  Master Config: Edit llm.provider and llm.model in config.yaml")
    print("=" * 75 + "\n")


def test_llm_command(args):
    """Sends a fast structured diagnostic probe to the selected provider and model."""
    provider = args.provider or "gemini"
    model = args.model

    print(f"\n[HYT ATS] Diagnostic probe initiating for provider: '{provider}' | model: '{model or 'default'}' ...")
    llm = get_llm_client()

    probe_system = "You are an AI diagnostic validator for HYT ATS. Output valid JSON only."
    probe_user = 'Return a JSON object: {"status": "ok", "provider": "' + provider + '", "message": "diagnostic_pass"}'

    t0 = time.time()
    try:
        raw_output = llm.complete(
            system_prompt=probe_system,
            user_prompt=probe_user,
            json_mode=True,
            override_provider=provider,
            override_model=model,
        )
        latency = round(time.time() - t0, 2)
        cleaned = llm._clean_json_markdown(raw_output)
        parsed = json.loads(cleaned)

        print("\n" + "=" * 60)
        print("DIAGNOSTIC TEST PASSED [OK]")
        print("=" * 60)
        print(f"Active Provider:    {provider}")
        print(f"Model Resolved:     {llm.active_resolved_model}")
        print(f"Roundtrip Latency:  {latency}s")
        print(f"Validated JSON:     {json.dumps(parsed, indent=2)}")
        print("=" * 60 + "\n")
    except Exception as e:
        latency = round(time.time() - t0, 2)
        print("\n" + "=" * 60)
        print("DIAGNOSTIC TEST FAILED [ERROR]")
        print("=" * 60)
        print(f"Provider:           {provider}")
        print(f"Latency:            {latency}s")
        print(f"Error Details:      {e}")
        print("=" * 60 + "\n")
        sys.exit(1)


def verify_jd_command(args):
    """Executes Gates A1, A2, and A3 for a given Job Description."""
    jd_path = None
    if args.job_id:
        jd_path = PROJECT_ROOT / "data" / "jds" / f"jd_{args.job_id}.json"
        if not jd_path.exists():
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

    provider = getattr(args, "provider", None)
    model = getattr(args, "model", None)

    print(f"\n[HYT ATS] Ingesting Job Description from: {jd_path} ...")

    # Gate A1: Input & Content Hashing
    raw_jd = process_jd_input(jd_path)
    print(f"[OK] Gate A1 Passed: Job ID = {raw_jd.job_id} | Hash = {raw_jd.content_hash[:16]}...")

    # Gate A2: Structured Extraction (Cached)
    structured_jd = extract_job_description(
        raw_jd,
        use_cache=not args.refresh,
        force_refresh=args.refresh,
        provider=provider,
        model=model,
    )
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
