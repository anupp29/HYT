"""
HYT ATS - Production Skills Taxonomy Manager
============================================
Provides O(1) canonicalization, acronym resolution, and domain cluster matching
for Software Engineering, Cloud, DevOps, Database, and System architecture skills.
Loads from data/taxonomy/skills_taxonomy.json with in-memory caching.
"""

import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Set

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_TAXONOMY_PATH = PROJECT_ROOT / "data" / "taxonomy" / "skills_taxonomy.json"

_TAXONOMY_CACHE: Optional[Dict[str, Any]] = None
_ALIAS_TO_CANONICAL: Optional[Dict[str, str]] = None
_RELATED_MAP: Optional[Dict[str, Set[str]]] = None


def _clean_term(term: str) -> str:
    """Normalizes whitespace and lowercases string."""
    if not term:
        return ""
    t = term.lower().strip()
    # Normalize common separators: 'node.js' -> 'node.js', 'react-js' -> 'react js'
    t = re.sub(r'[\s\-_]+', ' ', t)
    return t.strip()


def load_taxonomy(taxonomy_path: Optional[Path] = None) -> Dict[str, Any]:
    """
    Loads and compiles the skills taxonomy JSON into fast in-memory lookup indexes.
    Thread-safe and cached.
    """
    global _TAXONOMY_CACHE, _ALIAS_TO_CANONICAL, _RELATED_MAP

    if _TAXONOMY_CACHE is not None and taxonomy_path is None:
        return _TAXONOMY_CACHE

    path = taxonomy_path or DEFAULT_TAXONOMY_PATH
    if not path.exists():
        # Fallback empty structure if file is missing
        _TAXONOMY_CACHE = {"skills": {}}
        _ALIAS_TO_CANONICAL = {}
        _RELATED_MAP = {}
        return _TAXONOMY_CACHE

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    alias_map: Dict[str, str] = {}
    related_map: Dict[str, Set[str]] = {}

    for canonical, info in data.get("skills", {}).items():
        c_clean = _clean_term(canonical)
        alias_map[c_clean] = c_clean

        # Register all declared aliases
        for alias in info.get("aliases", []):
            a_clean = _clean_term(alias)
            if a_clean:
                alias_map[a_clean] = c_clean

        # Register related skills
        rel_set = set()
        for rel in info.get("related", []):
            r_clean = _clean_term(rel)
            if r_clean:
                rel_set.add(r_clean)
        related_map[c_clean] = rel_set

    _TAXONOMY_CACHE = data
    _ALIAS_TO_CANONICAL = alias_map
    _RELATED_MAP = related_map

    return _TAXONOMY_CACHE


def canonicalize_skill(skill_name: str) -> str:
    """
    Resolves an input skill string or acronym to its canonical industry standard name.
    Examples:
      'k8s' -> 'kubernetes'
      'psql' -> 'postgresql'
      'AWS Cloud' -> 'amazon web services'
      'NextJS' -> 'next.js'
      'Core Java' -> 'java'
    """
    load_taxonomy()
    assert _ALIAS_TO_CANONICAL is not None

    clean = _clean_term(skill_name)
    if not clean:
        return ""

    # 1. Exact alias lookup
    if clean in _ALIAS_TO_CANONICAL:
        return _ALIAS_TO_CANONICAL[clean]

    # 2. Punctuation stripped check (e.g. 'node.js' vs 'nodejs')
    no_punct = re.sub(r'[^a-z0-9 ]', '', clean).strip()
    if no_punct in _ALIAS_TO_CANONICAL:
        return _ALIAS_TO_CANONICAL[no_punct]

    # 3. If unknown, return clean original
    return clean


def are_skills_equivalent(skill1: str, skill2: str) -> bool:
    """
    Returns True if two skill names refer to the exact same canonical skill
    or are recognized aliases of one another.
    """
    if not skill1 or not skill2:
        return False
    c1 = canonicalize_skill(skill1)
    c2 = canonicalize_skill(skill2)
    return c1 == c2


def are_skills_related(skill1: str, skill2: str) -> bool:
    """
    Returns True if skill1 and skill2 belong to the same technical stack ecosystem
    (e.g., 'FastAPI' and 'Python', or 'React' and 'Redux').
    """
    load_taxonomy()
    assert _RELATED_MAP is not None

    c1 = canonicalize_skill(skill1)
    c2 = canonicalize_skill(skill2)

    if c1 == c2:
        return True

    rel1 = _RELATED_MAP.get(c1, set())
    rel2 = _RELATED_MAP.get(c2, set())

    return (c2 in rel1) or (c1 in rel2)


def get_skill_category(skill_name: str) -> Optional[str]:
    """Returns the functional domain category for a skill (e.g. 'databases_storage')."""
    tax = load_taxonomy()
    c = canonicalize_skill(skill_name)
    info = tax.get("skills", {}).get(c)
    if info:
        return info.get("category")
    return None
