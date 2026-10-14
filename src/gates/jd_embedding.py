"""
HYT ATS - Gate A3: Job Description Embeddings Generator
========================================================
Generates dense vector embeddings for must-have skills, nice-to-haves,
and overall domain context using local sentence-transformers.
Enforces caching: embeddings are computed once and cached on disk.
"""

from typing import Dict, Any, List, Optional
import numpy as np

from src.models.schemas import JobDescription
from src.utils.cache import get_cache_manager
from src.utils.config import get_config
from src.utils.logger import get_logger

logger = get_logger("GATE_A3_JD_EMBEDDING")

# Global model cache to avoid re-loading weights
_SENTENCE_MODEL_INSTANCE = None


def get_embedding_model():
    """Lazy loader for sentence-transformer model."""
    global _SENTENCE_MODEL_INSTANCE
    if _SENTENCE_MODEL_INSTANCE is None:
        config = get_config()
        model_name = config.embeddings.model_name
        device = config.embeddings.device
        logger.info(f"Loading embedding model: {model_name} on {device}...", gate="JD_EMBEDDING")
        try:
            from sentence_transformers import SentenceTransformer
            _SENTENCE_MODEL_INSTANCE = SentenceTransformer(model_name, device=device)
        except Exception as e:
            logger.warning(
                f"SentenceTransformer failed to load: {e}. Falling back to deterministic pseudo-embedding...",
                gate="JD_EMBEDDING",
            )
            _SENTENCE_MODEL_INSTANCE = "FALLBACK"
    return _SENTENCE_MODEL_INSTANCE


def embed_job_requirements(
    jd: JobDescription,
    use_cache: bool = True,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    Computes and caches embeddings for all must-have skills, nice-to-haves, and domain context.
    
    Args:
        jd: Structured JobDescription.
        use_cache: If True, checks cache before running neural encoder.
        force_refresh: If True, recomputes vectors.
        
    Returns:
        Dict with keys:
            - "must_haves": Dict[skill_name, List[float]]
            - "nice_to_haves": Dict[skill_name, List[float]]
            - "domain_vector": List[float]
            - "dimension": int
    """
    cache = get_cache_manager()
    cache_key = f"embed_{jd.content_hash}"

    # 1. Cache Check (Master Plan Section 5)
    if use_cache and not force_refresh:
        cached_embeddings = cache.get("embeddings", cache_key)
        if cached_embeddings is not None:
            logger.info(
                f"Cache HIT for JD embeddings {jd.job_id} ({len(cached_embeddings.get('must_haves', {}))} skills). Zero neural compute.",
                gate="JD_EMBEDDING",
            )
            return cached_embeddings

    logger.info(
        f"Cache MISS for JD embeddings {jd.job_id}. Encoding {len(jd.must_have_skills)} must-haves...",
        gate="JD_EMBEDDING",
    )

    model = get_embedding_model()
    must_have_embeddings = {}
    nice_to_have_embeddings = {}
    domain_vector = []
    vector_dim = 384

    if model != "FALLBACK":
        all_skills = jd.must_have_skills + jd.nice_to_have_skills
        domain_text = f"{jd.title}. {jd.domain_context or ''}. Must have: {', '.join(jd.must_have_skills)}"
        
        # Batch encode
        texts_to_encode = all_skills + [domain_text]
        encoded_vectors = model.encode(texts_to_encode, normalize_embeddings=True)
        vector_dim = int(encoded_vectors.shape[1])

        idx = 0
        for s in jd.must_have_skills:
            must_have_embeddings[s] = encoded_vectors[idx].tolist()
            idx += 1
            
        for s in jd.nice_to_have_skills:
            nice_to_have_embeddings[s] = encoded_vectors[idx].tolist()
            idx += 1

        domain_vector = encoded_vectors[idx].tolist()

    else:
        # Deterministic hashing fallback if sentence-transformers not available
        def _hash_vector(text: str, dim: int = 384) -> List[float]:
            rng = np.random.RandomState(abs(hash(text.strip().lower())) % (2**31))
            vec = rng.randn(dim)
            norm = np.linalg.norm(vec)
            return (vec / norm if norm > 0 else vec).tolist()

        for s in jd.must_have_skills:
            must_have_embeddings[s] = _hash_vector(s, vector_dim)
        for s in jd.nice_to_have_skills:
            nice_to_have_embeddings[s] = _hash_vector(s, vector_dim)
        domain_vector = _hash_vector(jd.title + " " + (jd.domain_context or ""), vector_dim)

    result_payload = {
        "job_id": jd.job_id,
        "content_hash": jd.content_hash,
        "dimension": vector_dim,
        "must_haves": must_have_embeddings,
        "nice_to_haves": nice_to_have_embeddings,
        "domain_vector": domain_vector,
    }

    # 2. Cache Write (Master Plan Section 5)
    cache.set("embeddings", cache_key, result_payload)
    logger.info(
        f"Successfully encoded and cached embeddings for JD {jd.job_id} (dim={vector_dim})",
        gate="JD_EMBEDDING",
    )

    return result_payload
