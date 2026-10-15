"""
HYT ATS - Unified Multi-Provider LLM Client Subsystem
=====================================================
Provides deterministic, cached LLM completion with automatic JSON parsing,
retries with exponential backoff, and multi-provider failover.

Supports 4 Primary AI Client Ecosystems:
  1. Google Gemini (e.g. models/gemini-2.5-flash, models/gemini-2.5-pro)
  2. Groq Cloud (e.g. llama-3.3-70b-versatile, llama-3.1-8b-instant, gemma2-9b-it, mixtral-8x7b-32768)
  3. Local Ollama (e.g. swift-12b / gemma4, qwen2.5-coder:1.5b, gemma2:9b)
  4. OpenAI / Anthropic (e.g. gpt-4o-mini, gpt-4o, claude-3-5-haiku-20241022)

Dynamic Model Selection:
  - Users can select provider and model via CLI flags (--provider, --model),
    config.yaml (llm.provider, llm.model), or environment variables (HYT_LLM_PROVIDER, HYT_LLM_MODEL).
  - Native support for Ollama Gemma 4 (swift-12b) with reasoning/thinking extraction.
  - Automatic local Ollama model discovery and tag resolution.

Strictly adheres to Principle 1: Deterministic evaluation at temperature 0.0.
"""

import os
import json
import time
import re
from typing import Dict, Any, List, Optional, Type
import requests
from pydantic import BaseModel
from dotenv import load_dotenv

from src.utils.config import get_config
from src.utils.logger import get_logger

# Load environment variables with override
load_dotenv(override=True)

logger = get_logger("LLM_CLIENT")


class LLMClient:
    """Unified client handling Gemini, Groq, Ollama, OpenAI, and Anthropic."""

    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None):
        self.config = get_config()
        self.provider = (provider or os.getenv("HYT_LLM_PROVIDER", self.config.llm.provider)).lower()
        self.model_name = model or os.getenv("HYT_LLM_MODEL", self.config.llm.model)
        self.temperature = self.config.llm.temperature
        self.max_tokens = self.config.llm.max_tokens
        self.max_retries = self.config.llm.max_retries
        self.retry_backoff = self.config.llm.retry_backoff_seconds
        self.timeout_seconds = getattr(self.config.llm, "timeout_seconds", 120)
        self.ollama_base_url = os.getenv(
            "OLLAMA_BASE_URL", getattr(self.config.llm, "ollama_base_url", "http://localhost:11434")
        ).rstrip("/")

        # Credentials
        self.gemini_key = os.getenv("GEMINI_API_KEY")

        # Load all Groq keys for cyclic round-robin rotation
        raw_keys = os.getenv("GROQ_API_KEYS", "")
        self.groq_keys: List[str] = [k.strip() for k in raw_keys.split(",") if k.strip()]
        if not self.groq_keys:
            for i in range(1, 10):
                k = os.getenv(f"GROQ_API_KEY_{i}")
                if k and k.strip():
                    self.groq_keys.append(k.strip())
            if not self.groq_keys:
                single_k = os.getenv("GROQ_API_KEY")
                if single_k and single_k.strip():
                    self.groq_keys.append(single_k.strip())
        self.groq_key = self.groq_keys[0] if self.groq_keys else None

        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")

        # Track active resolved model
        self.active_resolved_model = self.model_name

        # Calibrate default model
        self.set_active_model(self.provider, self.model_name)

    def set_active_model(self, provider: str, model: Optional[str] = None):
        """Dynamically updates the active provider and calibrates the model name."""
        self.provider = provider.lower()
        if model:
            self.model_name = model

        if self.provider == "gemini":
            self.model_name = self._resolve_gemini_model(self.model_name)
        elif self.provider == "groq":
            self.model_name = self._resolve_groq_model(self.model_name)
        elif self.provider == "ollama":
            self.model_name = self._resolve_ollama_model(self.model_name)
        elif self.provider == "openai":
            self.model_name = self._resolve_openai_model(self.model_name)
        elif self.provider == "anthropic":
            if not self.model_name or "claude" not in self.model_name:
                self.model_name = "claude-3-5-haiku-20241022"

    # --------------------------------------------------------------------------
    # Model Resolution Helpers
    # --------------------------------------------------------------------------
    def _resolve_gemini_model(self, requested: Optional[str]) -> str:
        req = (requested or "").lower()
        if "pro" in req:
            return "models/gemini-2.5-pro"
        elif "flash" in req or "gemini" in req:
            if not requested.startswith("models/"):
                return f"models/{requested}"
            return requested
        return "models/gemini-2.5-flash"

    def _resolve_groq_model(self, requested: Optional[str]) -> str:
        req = (requested or "").lower()
        if "qwen" in req:
            return "qwen/qwen3.8-27b"
        elif "gemma" in req:
            return "gemma2-9b-it"
        elif "mixtral" in req:
            return "mixtral-8x7b-32768"
        elif "8b" in req or "instant" in req:
            return "llama-3.1-8b-instant"
        elif "llama" in req or "70b" in req:
            return "llama-3.3-70b-versatile"
        elif requested and not requested.startswith("models/") and "gpt" not in requested and "coder" not in requested:
            return requested
        return "qwen/qwen3.8-27b"

    def _resolve_ollama_model(self, requested: Optional[str]) -> str:
        """Dynamically resolves Ollama models, supporting Gemma 4 (swift-12b) and Qwen."""
        installed = self.get_ollama_models()
        model_names = [m.get("name", "") for m in installed]

        req_lower = (requested or "").lower().strip()

        # 1. Exact match with installed tags
        if requested and requested in model_names:
            return requested
        for name in model_names:
            if requested and requested in name:
                return name

        # 2. Gemma 4 alias matching (e.g. "gemma4", "gemma 4", "swift", "swift-12b")
        if any(k in req_lower for k in ["gemma4", "gemma 4", "gemma-4", "swift"]):
            for m in installed:
                name = m.get("name", "")
                details = m.get("details", {})
                parent = details.get("parent_model", "").lower()
                family = details.get("family", "").lower()
                if "swift" in name or "gemma4" in parent or "gemma4" in family:
                    return name
            return "swift-12b:latest"

        # 3. General Gemma matching
        if "gemma" in req_lower:
            for name in model_names:
                if "gemma" in name:
                    return name
            # Check if swift-12b is installed as gemma4 family
            for m in installed:
                if "gemma" in m.get("details", {}).get("family", ""):
                    return m.get("name", "")
            return "gemma2:9b"

        # 4. Qwen matching
        if "qwen" in req_lower:
            for name in model_names:
                if "qwen" in name:
                    return name
            return "qwen2.5-coder:1.5b"

        # 5. Fallback: If user specified a non-empty name, use it
        if requested and not requested.startswith("models/") and "gpt" not in requested:
            return requested

        # 6. Default to first available installed model
        if model_names:
            # Prefer swift-12b (gemma4) or qwen if present
            for name in model_names:
                if "swift" in name or "gemma" in name:
                    return name
            return model_names[0]

        return "swift-12b:latest"

    def _resolve_openai_model(self, requested: Optional[str]) -> str:
        req = (requested or "").lower()
        if "4o-mini" in req:
            return "gpt-4o-mini"
        elif "4o" in req:
            return "gpt-4o"
        elif "turbo" in req:
            return "gpt-4-turbo"
        elif requested and "gpt" in requested:
            return requested
        return "gpt-4o-mini"

    # --------------------------------------------------------------------------
    # Ollama Model Inspection
    # --------------------------------------------------------------------------
    def get_ollama_models(self) -> List[Dict[str, Any]]:
        """Queries local Ollama endpoint for installed models and their details."""
        try:
            resp = requests.get(f"{self.ollama_base_url}/api/tags", timeout=3)
            if resp.status_code == 200:
                return resp.json().get("models", [])
        except Exception:
            pass
        return []

    def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """Inspects and returns connectivity and credential status of all 4 clients."""
        ollama_models = self.get_ollama_models()
        return {
            "gemini": {
                "configured": bool(self.gemini_key),
                "key_preview": f"{self.gemini_key[:8]}..." if self.gemini_key else "None",
                "default_model": "models/gemini-2.5-flash",
                "supported_models": ["models/gemini-2.5-flash", "models/gemini-2.5-pro"],
            },
            "groq": {
                "configured": bool(self.groq_key),
                "key_preview": f"{self.groq_key[:8]}..." if self.groq_key else "None",
                "default_model": "llama-3.3-70b-versatile",
                "supported_models": [
                    "llama-3.3-70b-versatile",
                    "llama-3.1-8b-instant",
                    "gemma2-9b-it",
                    "mixtral-8x7b-32768",
                ],
            },
            "ollama": {
                "configured": len(ollama_models) > 0,
                "endpoint": self.ollama_base_url,
                "installed_models": [
                    {
                        "name": m.get("name"),
                        "family": m.get("details", {}).get("family"),
                        "parent": m.get("details", {}).get("parent_model"),
                        "size_gb": round(m.get("size", 0) / (1024**3), 2),
                    }
                    for m in ollama_models
                ],
                "recommended_models": ["swift-12b:latest (Gemma 4)", "qwen2.5-coder:1.5b"],
            },
            "openai": {
                "configured": bool(self.openai_key),
                "key_preview": f"{self.openai_key[:8]}..." if self.openai_key else "None",
                "default_model": "gpt-4o-mini",
                "supported_models": ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
            },
            "anthropic": {
                "configured": bool(self.anthropic_key),
                "key_preview": f"{self.anthropic_key[:8]}..." if self.anthropic_key else "None",
                "default_model": "claude-3-5-haiku-20241022",
                "supported_models": ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"],
            },
        }

    # --------------------------------------------------------------------------
    # Main Completion Entry Point
    # --------------------------------------------------------------------------
    def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True,
        override_provider: Optional[str] = None,
        override_model: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Executes LLM completion with automatic multi-provider failover.
        """
        active_provider = (override_provider or self.provider).lower()
        active_model = override_model or self.model_name
        token_limit = max_tokens or self.max_tokens

        providers_to_try = [active_provider]
        fallbacks = ["ollama", "gemini", "groq", "openai", "anthropic"]
        for fb in fallbacks:
            if fb not in providers_to_try:
                providers_to_try.append(fb)

        last_error = None

        for p in providers_to_try:
            for attempt in range(1, self.max_retries + 1):
                try:
                    if p == "gemini" and self.gemini_key:
                        m_name = self._resolve_gemini_model(active_model)
                        self.active_resolved_model = m_name
                        return self._complete_gemini(system_prompt, user_prompt, json_mode, m_name, max_tokens=token_limit)
                    elif p == "groq" and self.groq_key:
                        m_name = self._resolve_groq_model(active_model)
                        self.active_resolved_model = m_name
                        return self._complete_groq(system_prompt, user_prompt, json_mode, m_name, max_tokens=token_limit)
                    elif p == "ollama":
                        # If falling over from cloud provider, use local Ollama model (qwen2.5-coder:7b)
                        target_model = active_model if p == active_provider else self.config.llm.model
                        m_name = self._resolve_ollama_model(target_model)
                        self.active_resolved_model = m_name
                        return self._complete_ollama(system_prompt, user_prompt, json_mode, m_name, max_tokens=token_limit)
                    elif p == "openai" and self.openai_key:
                        m_name = self._resolve_openai_model(active_model)
                        self.active_resolved_model = m_name
                        return self._complete_openai(system_prompt, user_prompt, json_mode, m_name, max_tokens=token_limit)
                    elif p == "anthropic" and self.anthropic_key:
                        m_name = active_model if "claude" in active_model else "claude-3-5-haiku-20241022"
                        self.active_resolved_model = m_name
                        return self._complete_anthropic(system_prompt, user_prompt, json_mode, m_name, max_tokens=token_limit)
                    else:
                        break  # Skip provider if credentials missing
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()

                    # Fast failover on invalid API key / authentication errors (do not waste retry backoffs)
                    if any(auth_err in err_str for auth_err in ["401", "invalid_api_key", "invalid api key", "authentication", "unauthorized"]):
                        logger.warning(
                            f"LLM authentication failed for provider '{p}': {e}. Failing over immediately...",
                            gate="LLM_CLIENT",
                        )
                        break

                    # Handle Rate Limits (429) specifically: ONLY sleep when 429 occurs, then sleep 60s to reset quota
                    if "429" in err_str or "rate_limit" in err_str:
                        match = re.search(r"try again in ([\d\.]+)s", str(e), re.IGNORECASE)
                        wait_seconds = max(float(match.group(1)) + 1.0, 60.0) if match else 60.0
                        logger.warning(
                            f"[GROQ 429 RATE LIMIT] Quota limit reached on '{p}'. Sleeping for {wait_seconds:.0f}s to reset window before retrying (attempt {attempt}/{self.max_retries})...",
                            gate="LLM_CLIENT",
                        )
                        time.sleep(wait_seconds)
                        continue

                    logger.warning(
                        f"LLM attempt {attempt}/{self.max_retries} with '{p}' failed: {e}",
                        gate="LLM_CLIENT",
                    )
                    if attempt < self.max_retries:
                        time.sleep(self.retry_backoff * (2 ** (attempt - 1)))
                    else:
                        logger.info(f"Failing over from '{p}' to next available provider...", gate="LLM_CLIENT")

        raise RuntimeError(f"All LLM completion providers failed. Last error: {last_error}")

    def complete_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema_cls: Type[BaseModel],
        override_provider: Optional[str] = None,
        override_model: Optional[str] = None,
    ) -> BaseModel:
        """
        Executes completion and validates output against a Pydantic schema.
        Automatically retries with a corrective prompt on parse error.
        """
        raw_resp = self.complete(
            system_prompt,
            user_prompt,
            json_mode=True,
            override_provider=override_provider,
            override_model=override_model,
        )
        cleaned_json = self._clean_json_markdown(raw_resp)

        try:
            parsed_dict = json.loads(cleaned_json)
            return schema_cls.model_validate(parsed_dict)
        except Exception as parse_err:
            logger.warning(
                f"Initial structured parsing failed: {parse_err}. Triggering corrective retry...",
                gate="LLM_CLIENT",
            )
            correction_prompt = (
                f"Your previous output failed schema validation with error: {parse_err}\n"
                f"Previous output was:\n{raw_resp}\n\n"
                f"Please correct the JSON output so it strictly adheres to the requested schema. "
                f"Return ONLY valid JSON."
            )
            retry_resp = self.complete(
                system_prompt,
                correction_prompt,
                json_mode=True,
                override_provider=override_provider,
                override_model=override_model,
            )
            cleaned_retry = self._clean_json_markdown(retry_resp)
            parsed_retry = json.loads(cleaned_retry)
            return schema_cls.model_validate(parsed_retry)

    # --------------------------------------------------------------------------
    # 1. Google Gemini Provider
    # --------------------------------------------------------------------------
    def _complete_gemini(self, system_prompt: str, user_prompt: str, json_mode: bool, model_name: str, max_tokens: Optional[int] = None) -> str:
        import google.generativeai as genai
        genai.configure(api_key=self.gemini_key)

        generation_config = {
            "temperature": self.temperature,
            "max_output_tokens": max_tokens or self.max_tokens,
        }
        if json_mode:
            generation_config["response_mime_type"] = "application/json"

        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt,
            generation_config=generation_config,
        )
        response = model.generate_content(user_prompt)
        return response.text

    _groq_key_idx: int = 0

    # --------------------------------------------------------------------------
    # 2. Groq Cloud Provider (Cyclic Multi-Key Rotation with Instant 429 Failover)
    # --------------------------------------------------------------------------
    def _complete_groq(self, system_prompt: str, user_prompt: str, json_mode: bool, model_name: str, max_tokens: Optional[int] = None) -> str:
        from groq import Groq

        if not self.groq_keys:
            raise ValueError("No Groq API keys found in environment.")

        num_keys = len(self.groq_keys)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        capped_tokens = max_tokens or self.max_tokens
        if "qwen" in model_name.lower():
            capped_tokens = min(capped_tokens, 950)

        kwargs = {
            "model": model_name,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": capped_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        last_groq_err = None

        # Cycle through available keys in round-robin order
        for key_attempt in range(num_keys):
            active_idx = (LLMClient._groq_key_idx + key_attempt) % num_keys
            active_key = self.groq_keys[active_idx]

            try:
                client = Groq(api_key=active_key)
                response = client.chat.completions.create(**kwargs)
                # Successful call: advance index for next call (round-robin load balancing)
                LLMClient._groq_key_idx = (active_idx + 1) % num_keys
                return response.choices[0].message.content or ""
            except Exception as e:
                err_str = str(e).lower()
                last_groq_err = e

                # On 429 rate limit: immediately rotate to next key in cycle without sleeping!
                if "429" in err_str or "rate_limit" in err_str:
                    next_idx = (active_idx + 1) % num_keys
                    logger.warning(
                        f"[GROQ MULTI-KEY ROTATION] Key #{active_idx + 1} ({active_key[:10]}...) hit 429 rate limit. "
                        f"Instantly rotating to Key #{next_idx + 1} ({self.groq_keys[next_idx][:10]}...)...",
                        gate="LLM_CLIENT",
                    )
                    continue

                # Non-429 error: log and try next key
                logger.warning(
                    f"Groq Key #{active_idx + 1} ({active_key[:10]}...) error: {e}. Trying next key in cycle...",
                    gate="LLM_CLIENT",
                )
                continue

        # If all keys in cycle were exhausted, raise so top-level handler can wait or fall back
        LLMClient._groq_key_idx = (LLMClient._groq_key_idx + 1) % num_keys
        raise last_groq_err or RuntimeError("All configured Groq keys failed.")

    # --------------------------------------------------------------------------
    # 3. Local Ollama Provider (Supports Gemma 4 / swift-12b & Qwen)
    # --------------------------------------------------------------------------
    def _complete_ollama(self, system_prompt: str, user_prompt: str, json_mode: bool, model_name: str, max_tokens: Optional[int] = None) -> str:
        url = f"{self.ollama_base_url}/api/chat"
        num_predict = max_tokens or self.max_tokens

        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": num_predict,
                "num_ctx": getattr(self.config.llm, "num_ctx", 4096),
            },
        }
        if json_mode:
            payload["format"] = "json"

        resp = requests.post(url, json=payload, timeout=self.timeout_seconds)
        resp.raise_for_status()
        data = resp.json()
        msg = data.get("message", {})
        content = msg.get("content", "")

        # Handle reasoning / thinking models (e.g. swift-12b Gemma 4)
        if not content.strip() and msg.get("thinking"):
            thinking_text = msg.get("thinking", "")
            json_match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', thinking_text)
            if json_match:
                content = json_match.group(0)
            else:
                content = thinking_text

        return content

    # --------------------------------------------------------------------------
    # 4. OpenAI Provider
    # --------------------------------------------------------------------------
    def _complete_openai(self, system_prompt: str, user_prompt: str, json_mode: bool, model_name: str, max_tokens: Optional[int] = None) -> str:
        import openai
        client = openai.OpenAI(api_key=self.openai_key)

        kwargs = {
            "model": model_name,
            "temperature": self.temperature,
            "max_tokens": max_tokens or self.max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    # --------------------------------------------------------------------------
    # 5. Anthropic Provider
    # --------------------------------------------------------------------------
    def _complete_anthropic(self, system_prompt: str, user_prompt: str, json_mode: bool, model_name: str, max_tokens: Optional[int] = None) -> str:
        import anthropic
        client = anthropic.Anthropic(api_key=self.anthropic_key)

        response = client.messages.create(
            model=model_name,
            max_tokens=max_tokens or self.max_tokens,
            temperature=self.temperature,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.content[0].text if response.content else ""

    # --------------------------------------------------------------------------
    # JSON Utility
    # --------------------------------------------------------------------------
    @staticmethod
    def _clean_json_markdown(text: str) -> str:
        """Strips markdown code blocks like ```json ... ``` from LLM text."""
        stripped = text.strip()
        if stripped.startswith("```"):
            lines = stripped.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            stripped = "\n".join(lines).strip()
        return stripped


_LLM_CLIENT_INSTANCE: Optional[LLMClient] = None


def get_llm_client(provider: Optional[str] = None, model: Optional[str] = None) -> LLMClient:
    """Returns singleton LLMClient, optionally switching provider or model."""
    global _LLM_CLIENT_INSTANCE
    if _LLM_CLIENT_INSTANCE is None:
        _LLM_CLIENT_INSTANCE = LLMClient(provider=provider, model=model)
    else:
        if provider:
            _LLM_CLIENT_INSTANCE.set_active_model(provider, model)
        elif model:
            _LLM_CLIENT_INSTANCE.set_active_model(_LLM_CLIENT_INSTANCE.provider, model)
    return _LLM_CLIENT_INSTANCE
