"""
Tests for Skills Taxonomy Manager (src/utils/taxonomy.py)
==========================================================
Validates:
  1. O(1) canonicalization of common SWE acronyms and aliases.
  2. Prevention of false positive semantic equivalence (e.g. Java != JavaScript).
  3. Bidirectional equivalence between aliases and canonical names.
  4. Stack ecosystem relationships (e.g. FastAPI & Python).
  5. Functional category lookups.
"""

import pytest
from src.utils.taxonomy import (
    load_taxonomy,
    canonicalize_skill,
    are_skills_equivalent,
    are_skills_related,
    get_skill_category,
)


def test_taxonomy_loading():
    """Taxonomy loads properly with non-empty skills dictionary."""
    tax = load_taxonomy()
    assert "skills" in tax
    assert len(tax["skills"]) >= 30
    assert "python" in tax["skills"]
    assert "kubernetes" in tax["skills"]


@pytest.mark.parametrize(
    "raw_input,expected_canonical",
    [
        ("k8s", "kubernetes"),
        ("kube", "kubernetes"),
        ("Kubernetes", "kubernetes"),
        ("postgres", "postgresql"),
        ("psql", "postgresql"),
        ("PostgreSQL", "postgresql"),
        ("aws", "amazon web services"),
        ("AWS Cloud", "amazon web services"),
        ("ts", "typescript"),
        ("type-script", "typescript"),
        ("js", "javascript"),
        ("node", "node.js"),
        ("nodejs", "node.js"),
        ("node js", "node.js"),
        ("nextjs", "next.js"),
        ("next js", "next.js"),
        ("reactjs", "react"),
        ("react.js", "react"),
        ("golang", "go"),
        ("csharp", "c#"),
        ("c plus plus", "c++"),
        ("cpp", "c++"),
        ("tf", "terraform"),
        ("cicd", "ci/cd"),
        ("continuous integration", "ci/cd"),
        ("gql", "graphql"),
    ],
)
def test_skill_canonicalization(raw_input, expected_canonical):
    """Common industry acronyms must resolve to exact canonical standard."""
    assert canonicalize_skill(raw_input) == expected_canonical


def test_skill_equivalence():
    """Aliases of same skill must be equivalent; distinct skills must NOT be."""
    assert are_skills_equivalent("k8s", "kubernetes") is True
    assert are_skills_equivalent("psql", "postgres") is True
    assert are_skills_equivalent("reactjs", "react") is True
    assert are_skills_equivalent("ts", "typescript") is True

    # Critical distinction test: Java must NEVER be equivalent to JavaScript
    assert are_skills_equivalent("java", "javascript") is False
    assert are_skills_equivalent("c", "c++") is False
    assert are_skills_equivalent("c#", "c++") is False


def test_skills_related_ecosystem():
    """Skills within same technical ecosystem must be identified as related."""
    assert are_skills_related("fastapi", "python") is True
    assert are_skills_related("django", "python") is True
    assert are_skills_related("react", "redux") is True
    assert are_skills_related("docker", "kubernetes") is True

    # Completely unrelated domains
    assert are_skills_related("ruby on rails", "c++") is False


def test_skill_category_lookup():
    """Skills must resolve to their correct domain categories."""
    assert get_skill_category("postgresql") == "databases_storage"
    assert get_skill_category("mongodb") == "databases_storage"
    assert get_skill_category("react") == "frontend"
    assert get_skill_category("fastapi") == "backend_frameworks"
    assert get_skill_category("kubernetes") == "devops_containers"
    assert get_skill_category("amazon web services") == "cloud_infrastructure"
    assert get_skill_category("python") == "languages"
