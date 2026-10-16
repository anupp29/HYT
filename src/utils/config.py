"""
HYT ATS - Dynamic Configuration Manager
=======================================
Loads, validates, and dynamically overrides all pipeline parameters from config.yaml.
Strictly enforces mathematical constraints (e.g. weights sum to 1.0) and physical bounds.
Supports runtime overrides via environment variables (prefixed with HYT_) and programmatic overrides.
"""

import os
import math
import yaml
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, model_validator


class PipelineMetaConfig(BaseModel):
    name: str = "HYT-ATS-Screening-Engine"
    version: str = "1.0.0"
    target_domain: str = "Software Engineering & IT"


class PathsConfig(BaseModel):
    cache_dir: str = "./cache"
    log_dir: str = "./logs"
    data_raw_dir: str = "./data/raw"
    data_sample_dir: str = "./data/sample"
    data_golden_dir: str = "./data/golden"
    data_jds_dir: str = "./data/jds"


class LLMConfig(BaseModel):
    provider: str = "gemini" # "gemini", "groq", "ollama", "openai", "anthropic"
    model: str = "models/gemini-2.5-flash"
    temperature: float = Field(default=0.0, ge=0.0, le=1.0)
    max_tokens: int = Field(default=2048, ge=256, le=8192)
    max_retries: int = Field(default=3, ge=0, le=10)
    retry_backoff_seconds: int = Field(default=2, ge=1, le=30)
    timeout_seconds: int = Field(default=180, ge=5, le=300)
    num_ctx: int = Field(default=4096, ge=1024, le=32768)
    ollama_base_url: str = Field(default="http://localhost:11434")


class EmbeddingsConfig(BaseModel):
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    device: str = "cpu"
    batch_size: int = Field(default=32, ge=1, le=256)
    normalize_embeddings: bool = True


class Gate0Config(BaseModel):
    min_contrast_ratio: float = Field(default=4.5, ge=1.0, le=21.0)
    min_font_size_pt: float = Field(default=3.0, ge=0.0, le=12.0)
    metadata_skill_density_threshold: float = Field(default=0.25, ge=0.0, le=1.0)
    jd_copy_similarity_threshold: float = Field(default=0.82, ge=0.0, le=1.0)
    max_pages_warning: int = Field(default=5, ge=1, le=50)
    suspicious_char_ratio_threshold: float = Field(default=0.15, ge=0.0, le=1.0)
    quarantine_flag_count: int = Field(default=2, ge=1, le=10)


class Gate1Config(BaseModel):
    enabled: bool = True
    heuristic_injection_patterns: List[str] = Field(default_factory=list)
    quarantine_on_injection: bool = True


class Gate2Config(BaseModel):
    redact_email: bool = True
    redact_phone: bool = True
    redact_names: bool = True
    redact_addresses: bool = True
    replacement_token: str = "[REDACTED]"


class Gate3Config(BaseModel):
    strict_schema_validation: bool = True
    fallback_on_parse_error: bool = True
    max_extraction_retries: int = Field(default=2, ge=0, le=5)


class Gate4Config(BaseModel):
    enabled: bool = True
    github_api_timeout_seconds: int = Field(default=5, ge=1, le=30)
    shallow_profile_unverified_threshold: float = Field(default=0.60, ge=0.0, le=1.0)
    github_language_mismatch_threshold: float = Field(default=0.50, ge=0.0, le=1.0)
    github_activity_lookback_days: int = Field(default=730, ge=30, le=3650)
    max_repos_to_inspect: int = Field(default=15, ge=1, le=100)


class Gate5Config(BaseModel):
    enabled: bool = True
    prefilter_similarity_threshold: float = Field(default=0.30, ge=0.0, le=1.0)
    action_on_below_threshold: str = "ESCALATE"


class Gate6Weights(BaseModel):
    technical: float = Field(default=0.40, ge=0.0, le=1.0)
    experience: float = Field(default=0.30, ge=0.0, le=1.0)
    seniority: float = Field(default=0.20, ge=0.0, le=1.0)
    education: float = Field(default=0.05, ge=0.0, le=1.0)
    location: float = Field(default=0.05, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def validate_weights_sum(self) -> "Gate6Weights":
        total = self.technical + self.experience + self.seniority + self.education + self.location
        if not math.isclose(total, 1.0, rel_tol=1e-4):
            raise ValueError(
                f"Gate 6 weights must sum to exactly 1.0. Current sum: {total:.4f} "
                f"(technical={self.technical}, experience={self.experience}, "
                f"seniority={self.seniority}, education={self.education}, location={self.location})"
            )
        return self


class Gate6SeniorityScores(BaseModel):
    exact_match: float = Field(default=1.0, ge=0.0, le=1.0)
    one_level_below: float = Field(default=0.70, ge=0.0, le=1.0)
    two_levels_below: float = Field(default=0.40, ge=0.0, le=1.0)
    overqualified: float = Field(default=0.65, ge=0.0, le=1.0)
    overqualified_flag_threshold: float = Field(default=4.0, ge=1.0, le=30.0)


class OverqualificationCalibrationConfig(BaseModel):
    enabled: bool = True
    max_applicable_target_seniority: str = "mid"
    min_seniority_diff: int = 2
    excess_years_threshold: float = Field(default=3.0, ge=1.0, le=30.0)
    score_factor: float = Field(default=0.75, ge=0.1, le=1.0)
    score_ceiling: float = Field(default=73.0, ge=0.0, le=100.0)


class Gate6Config(BaseModel):
    weights: Gate6Weights = Field(default_factory=Gate6Weights)
    hard_gate_similarity_threshold: float = Field(default=0.68, ge=0.0, le=1.0)
    unverified_skill_weight: float = Field(default=0.45, ge=0.0, le=1.0)
    nicetohave_skill_weight: float = Field(default=0.30, ge=0.0, le=1.0)
    seniority_scores: Gate6SeniorityScores = Field(default_factory=Gate6SeniorityScores)
    overqualification_calibration: OverqualificationCalibrationConfig = Field(
        default_factory=OverqualificationCalibrationConfig
    )
    education_partial_score: float = Field(default=0.60, ge=0.01, le=1.0)
    location_partial_score: float = Field(default=0.50, ge=0.01, le=1.0)


class Gate7Config(BaseModel):
    high_threshold: float = Field(default=58.0, ge=0.0, le=100.0)
    low_threshold: float = Field(default=38.0, ge=0.0, le=100.0)
    min_must_have_ratio: float = Field(default=0.45, ge=0.20, le=1.0)
    min_verified_must_haves: int = Field(default=1, ge=0)
    auto_reject_hard_failure_proportion: float = Field(default=0.70, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def validate_thresholds(self) -> "Gate7Config":
        if self.low_threshold >= self.high_threshold:
            raise ValueError(
                f"Gate 7 low_threshold ({self.low_threshold}) must be strictly less than "
                f"high_threshold ({self.high_threshold})"
            )
        return self


class Gate8Config(BaseModel):
    generate_for_auto_advance: bool = True
    generate_for_escalate: bool = True
    generate_for_auto_reject: bool = False
    max_explanation_sentences: int = Field(default=3, ge=1, le=5)


class EvalConfig(BaseModel):
    ndcg_k_values: List[int] = Field(default=[5, 10])
    min_labelled_resumes_per_job: int = Field(default=10, ge=1)
    judge_sample_size: int = Field(default=40, ge=5)
    fairness_sample_size: int = Field(default=30, ge=5)


class AppConfig(BaseModel):
    """Root configuration object containing all validated sections."""
    pipeline: PipelineMetaConfig = Field(default_factory=PipelineMetaConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    llm: LLMConfig = Field(default_factory=LLMConfig)
    embeddings: EmbeddingsConfig = Field(default_factory=EmbeddingsConfig)
    gate0: Gate0Config = Field(default_factory=Gate0Config)
    gate1: Gate1Config = Field(default_factory=Gate1Config)
    gate2: Gate2Config = Field(default_factory=Gate2Config)
    gate3: Gate3Config = Field(default_factory=Gate3Config)
    gate4: Gate4Config = Field(default_factory=Gate4Config)
    gate5: Gate5Config = Field(default_factory=Gate5Config)
    gate6: Gate6Config = Field(default_factory=Gate6Config)
    gate7: Gate7Config = Field(default_factory=Gate7Config)
    gate8: Gate8Config = Field(default_factory=Gate8Config)
    eval: EvalConfig = Field(default_factory=EvalConfig)


# Global singleton config
_CONFIG_INSTANCE: Optional[AppConfig] = None


def apply_env_overrides(raw_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dynamically applies environment variable overrides prefixed with HYT_.
    Example: HYT_GATE7_HIGH_THRESHOLD=80.0 overrides raw_dict['gate7']['high_threshold'].
    """
    prefix = "HYT_"
    for env_key, env_val in os.environ.items():
        if not env_key.startswith(prefix):
            continue
        parts = env_key[len(prefix):].lower().split("_")
        if len(parts) >= 2:
            section = parts[0]
            field_name = "_".join(parts[1:])
            if section in raw_dict and isinstance(raw_dict[section], dict):
                # Try type casting
                current_val = raw_dict[section].get(field_name)
                if current_val is not None:
                    try:
                        if isinstance(current_val, bool):
                            raw_dict[section][field_name] = env_val.lower() in ("true", "1", "yes")
                        elif isinstance(current_val, int):
                            raw_dict[section][field_name] = int(env_val)
                        elif isinstance(current_val, float):
                            raw_dict[section][field_name] = float(env_val)
                        else:
                            raw_dict[section][field_name] = env_val
                    except Exception:
                        raw_dict[section][field_name] = env_val
    return raw_dict


def load_config(config_path: Optional[str] = None) -> AppConfig:
    """
    Loads and validates the configuration file.
    Raises descriptive ValueError or FileNotFoundError if validation fails.
    """
    global _CONFIG_INSTANCE
    
    if config_path is None:
        # Search priority: env var -> relative path -> parent relative
        config_path = os.environ.get("HYT_CONFIG_PATH", "./config.yaml")
        if not os.path.exists(config_path):
            alt_path = os.path.join(os.path.dirname(__file__), "../../config.yaml")
            if os.path.exists(alt_path):
                config_path = alt_path

    if not os.path.exists(config_path):
        raise FileNotFoundError(
            f"HYT ATS Configuration file not found at: {config_path}. "
            "Please ensure config.yaml exists in the project root."
        )

    with open(config_path, "r", encoding="utf-8") as f:
        try:
            raw_dict = yaml.safe_load(f) or {}
        except yaml.YAMLError as e:
            raise ValueError(f"YAML parsing error in config file {config_path}: {e}")

    raw_dict = apply_env_overrides(raw_dict)

    try:
        app_config = AppConfig(**raw_dict)
    except Exception as e:
        raise ValueError(f"HYT ATS Configuration validation failed:\n{e}")

    _CONFIG_INSTANCE = app_config
    return app_config


def get_config() -> AppConfig:
    """Returns the cached configuration singleton, or loads it if not yet initialized."""
    global _CONFIG_INSTANCE
    if _CONFIG_INSTANCE is None:
        _CONFIG_INSTANCE = load_config()
    return _CONFIG_INSTANCE
