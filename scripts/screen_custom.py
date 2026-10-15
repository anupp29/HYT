import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.gates.jd_input import process_jd_input
from src.gates.jd_extraction import extract_job_description
from src.gates.jd_embedding import embed_job_requirements
from src.pipeline import process_candidate
from src.utils.output import format_candidate_record

def main():
    input_arg = sys.argv[1] if len(sys.argv) > 1 else "dhruv_mehta"
    arg_path = Path(input_arg)
    if arg_path.exists() and arg_path.is_file():
        resume_pdf_path = arg_path.resolve()
        candidate_id = arg_path.stem
    else:
        candidate_file = input_arg if input_arg.endswith(".pdf") else f"{input_arg}.pdf"
        resume_pdf_path = PROJECT_ROOT / "data" / "sample" / candidate_file
        candidate_id = Path(candidate_file).stem

    jd_txt_path = PROJECT_ROOT / "data" / "jds" / "custom_fullstack_raw.txt"

    print("=" * 70)
    print("HYT ATS — End-to-End Candidate Screening")
    print("Target Job: Full Stack Engineer @ Company X")
    print(f"Candidate:  {candidate_id}")
    print("=" * 70)

    if not jd_txt_path.exists():
        print(f"Error: JD file not found at {jd_txt_path}")
        return
    if not resume_pdf_path.exists():
        print(f"Error: Resume PDF not found at {resume_pdf_path}")
        return

    # Phase A: Job Extraction & Embedding
    print("\n[Phase A] Processing Job Description...")
    raw_jd = process_jd_input(jd_txt_path)
    structured_jd = extract_job_description(raw_jd, use_cache=True)
    jd_embeddings = embed_job_requirements(structured_jd, use_cache=True)
    print(f"  Title: {structured_jd.title}")
    print(f"  Seniority: {structured_jd.seniority_level.value}")
    print(f"  Min Experience Required: {structured_jd.min_years_experience} years")
    print(f"  Must-Have Skills ({len(structured_jd.must_have_skills)}): {', '.join(structured_jd.must_have_skills[:6])}...")
    print(f"  Nice-to-Have Skills ({len(structured_jd.nice_to_have_skills)}): {', '.join(structured_jd.nice_to_have_skills[:5])}...")

    # Phase B: Candidate Screening through all 8 Gates
    print(f"\n[Phase B] Executing 8-Gate Pipeline for {candidate_id}...")
    record = process_candidate(
        resume_path=resume_pdf_path,
        jd=structured_jd,
        candidate_id=candidate_id,
        use_cache=True,
        force_refresh=False,
    )

    print("\n" + "=" * 70)
    print("EVALUATION RESULT (Gate 9 Recruiter Output)")
    print("=" * 70)
    output_str = format_candidate_record(record)
    print(output_str)

if __name__ == "__main__":
    main()
