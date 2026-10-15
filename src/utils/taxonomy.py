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

    # 3. Version number stripped check (e.g. 'sql server 2005' -> 'sql server', 'oracle 11g' -> 'oracle', 'drupal 8' -> 'drupal')
    no_ver = re.sub(r'\b(v?\d+(\.\d+)*[a-z]?|\d{4})\b', '', clean).strip()
    no_ver = re.sub(r'[\s\-_]+', ' ', no_ver).strip()
    if no_ver and no_ver in _ALIAS_TO_CANONICAL:
        return _ALIAS_TO_CANONICAL[no_ver]
    no_ver_punct = re.sub(r'[^a-z0-9 ]', '', no_ver).strip()
    if no_ver_punct and no_ver_punct in _ALIAS_TO_CANONICAL:
        return _ALIAS_TO_CANONICAL[no_ver_punct]

    # 4. If unknown, return clean original
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


# ------------------------------------------------------------------------------
# Production Umbrella Technology Clusters (Functional Equivalences)
# In enterprise tech recruiting, skills within the same cluster represent
# directly transferable competencies (e.g. AWS engineer easily adapts to Azure/GCP).
# ------------------------------------------------------------------------------
UMBRELLA_CLUSTERS: Dict[str, Set[str]] = {
    "backend_programming_languages": {
        "python", "java", "golang", "go", "rust", "c++", "c", "c#", "csharp", "dotnet", ".net",
        "ruby", "rails", "php", "laravel", "symfony", "drupal", "wordpress",
        "node.js", "nodejs", "express", "express.js", "fastapi", "django", "flask", "spring", "spring boot",
        "scala", "kotlin", "elixir", "coldfusion"
    },
    "message_queues": {
        "kafka", "rabbitmq", "activemq", "sqs", "sns", "pub/sub", "message queue", "message broker", "event-driven", "celery", "zeromq"
    },
    "caching_inmemory": {
        "redis", "memcached", "in-memory database", "cache", "caching"
    },
    "mobile_development": {
        "ios", "android", "ios development suite", "android development suite", "react native", "flutter", "mobile development", "swift", "kotlin"
    },
    "cloud_infrastructure": {
        "amazon web services", "aws", "amazon cloud", "aws cloud",
        "microsoft azure", "azure", "azure cloud", "ms azure",
        "google cloud platform", "gcp", "google cloud",
        "cloud computing", "cloud infrastructure", "cloud architecture", "cloud"
    },
    "relational_databases": {
        "postgresql", "postgres", "psql", "mysql", "sql server", "mssql",
        "oracle", "sqlite", "mariadb", "rdbms", "sql", "relational database"
    },
    "nosql_databases": {
        "mongodb", "mongo", "dynamodb", "dynamo db", "cassandra",
        "couchbase", "redis", "nosql", "document database"
    },
    "containers_orchestration": {
        "docker", "containerization", "containers", "docker container",
        "kubernetes", "k8s", "kube", "container orchestration",
        "ecs", "eks", "gke", "helm", "podman"
    },
    "cicd_devops": {
        "ci/cd", "cicd", "continuous integration", "continuous deployment", "continuous delivery",
        "jenkins", "github actions", "gitlab ci", "circleci", "travis ci", "devops", "pipelines"
    },
    "version_control": {
        "git", "github", "gitlab", "bitbucket", "version control", "source control", "versioning management systems"
    },
    "web_frontend_core": {
        "html", "html5", "css", "css3", "responsive design", "responsive web design",
        "frontend", "ui development", "user interface", "web standards", "javascript", "typescript", "jquery", "ajax"
    },
    "testing_qa": {
        "unit testing", "integration testing", "automated testing", "end to end testing",
        "jest", "mocha", "pytest", "junit", "testing", "qa", "test automation", "selenium", "katalon", "behat", "cypress", "playwright"
    },
    "api_design": {
        "api design", "rest api", "rest", "api", "api development", "graphql", "grpc", "microservices", "web services", "endpoints"
    },
}

# ------------------------------------------------------------------------------
# Direct Subsumption Graph (Superset -> Subset Relations)
# Candidate having the parent skill fundamentally guarantees mastery of the child.
# E.g., TypeScript implies JavaScript; React implies Frontend/JS; C++ implies C.
# ------------------------------------------------------------------------------
SUBSUMPTION_MAP: Dict[str, Set[str]] = {
    "typescript": {"javascript", "frontend", "web development", "js"},
    "c++": {"c", "systems programming", "software engineering"},
    "react": {"javascript", "frontend", "ui development", "web development", "js"},
    "vue": {"javascript", "frontend", "ui development", "web development", "js"},
    "angular": {"typescript", "javascript", "frontend", "ui development", "js"},
    "next.js": {"react", "javascript", "typescript", "frontend", "ssr"},
    "jquery": {"javascript", "frontend", "ui development", "web development", "js"},
    "ajax": {"javascript", "rest api", "api", "web development", "frontend"},
    "html5": {"html", "frontend", "web development"},
    "css3": {"css", "frontend", "web development", "responsive design"},
    "drupal": {"php", "backend", "web development", "cms", "software engineering", "programming", "software development"},
    "wordpress": {"php", "backend", "web development", "cms"},
    "python": {"backend", "software engineering", "programming", "software development"},
    "fastapi": {"python", "rest api", "backend", "api development", "api design"},
    "django": {"python", "backend", "web development", "mvc", "software engineering"},
    "flask": {"python", "backend", "api development"},
    "spring": {"java", "backend", "enterprise software"},
    "spring boot": {"java", "spring", "backend", "microservices"},
    "express.js": {"node.js", "javascript", "backend", "node"},
    "node.js": {"javascript", "backend", "node", "software development"},
    "kubernetes": {"docker", "containers", "containerization", "devops"},
    "terraform": {"cloud", "infrastructure as code", "devops"},
    "postgresql": {"sql", "relational database", "rdbms", "database", "database optimization"},
    "mysql": {"sql", "relational database", "rdbms", "database", "database optimization"},
    "oracle": {"sql", "relational database", "rdbms", "database", "database optimization"},
    "sql server": {"sql", "relational database", "rdbms", "database", "mssql", "database optimization"},
    "mongodb": {"nosql", "database", "document database"},
    "dynamodb": {"nosql", "database", "cloud database"},
    "cassandra": {"nosql", "database"},
    "redis": {"nosql", "database", "cache", "in-memory database"},
    "database": {"sql", "relational database", "nosql", "rdbms"},
    "php": {"backend", "web development", "software engineering", "programming", "software development"},
    "laravel": {"php", "backend", "web development", "mvc", "rest api", "software engineering"},
    "symfony": {"php", "backend", "web development", "mvc", "rest api"},
    "ruby": {"backend", "web development", "software engineering", "programming", "software development"},
    "rails": {"ruby", "backend", "web development", "mvc", "rest api", "software engineering"},
    "c#": {".net", "csharp", "backend", "software engineering", "programming", "software development"},
    "java": {"backend", "software engineering", "programming", "object-oriented programming", "software development"},
    "golang": {"go", "backend", "software engineering", "programming", "concurrency", "systems programming"},
    "rust": {"systems programming", "software engineering", "backend", "concurrency", "c++"},
    "selenium": {"qa", "testing", "test automation", "automated testing"},
    "katalon": {"qa", "testing", "test automation", "automated testing", "selenium"},
}


def are_skills_in_same_cluster(skill1: str, skill2: str) -> bool:
    """Returns True if skill1 and skill2 belong to the same transferable functional cluster."""
    if not skill1 or not skill2:
        return False
    c1 = canonicalize_skill(skill1).lower().strip()
    c2 = canonicalize_skill(skill2).lower().strip()
    if c1 == c2:
        return True
    for cluster_skills in UMBRELLA_CLUSTERS.values():
        if (c1 in cluster_skills or skill1.lower().strip() in cluster_skills) and \
           (c2 in cluster_skills or skill2.lower().strip() in cluster_skills):
            return True
    return False


def does_skill_subsume(candidate_skill: str, requirement: str) -> bool:
    """Returns True if candidate_skill supersedes or subsumes requirement (e.g. TypeScript -> JavaScript)."""
    if not candidate_skill or not requirement:
        return False
    c_cand = canonicalize_skill(candidate_skill).lower().strip()
    c_req = canonicalize_skill(requirement).lower().strip()
    if c_cand == c_req:
        return True
    implied = SUBSUMPTION_MAP.get(c_cand, set())
    if c_req in implied or requirement.lower().strip() in implied:
        return True
    return False


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

    if are_skills_in_same_cluster(skill1, skill2) or does_skill_subsume(skill1, skill2):
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

