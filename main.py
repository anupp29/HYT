"""
HuntYourTribe (HYT) — ATS Screening Pipeline
Root CLI Entry Point
=============================================
Allows running commands directly as:
    python main.py list-jds
    python main.py verify-jd --job-id 2234533717
    python main.py run-candidate --resume data/sample/10089434.pdf --jd 2234533717
    python main.py rank --jd 2234533717
    python main.py override --candidate-id 10089434 --decision AUTO_ADVANCE --reason "..."
"""

import sys
from pathlib import Path

# Ensure project root is in python path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.main import main

if __name__ == "__main__":
    main()
