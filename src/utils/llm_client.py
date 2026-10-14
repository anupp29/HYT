"""
HYT ATS - Unified LLM Client Subsystem
======================================
Provides deterministic, cached LLM completion with automatic JSON parsing,
retries with exponential backoff, and multi-provider failover (Gemini / OpenAI).
Strictly adheres to Principle 1: Deterministic evaluation at temperature 0.0.
"""

import os
import json
import time
import re
from typing import Dict, Any, Optional, Type
from pydantic import BaseModel
from dotenv import load_dotenv

from src.utils.config import get_config
from src.utils.logger import get_logger

# Ensure environment variables are loaded
load_dotenv()

logger = get_logger("LLM_CLIENT")


class LLMClient:
    """Unified client handling Gemini and OpenAI API completions."""

    def __init__(self):
        self.config = get_config()
        self.provider = os.getenv("HYT_LLM_PROVIDER", self.config.llm.provider).lower()
        self.model_name = os.getenv("HYT_LLM_MODEL", self.config.llm.model)
        self.temperature = self.config.llm.temperature
        self.max_tokens = self.config.llm.max_tokens
        self.max_retries = self.config.llm.max_retries
        self.retry_backoff = self.config.llm.retry_backoff_seconds

        # Initialize API keys
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")

        # Auto-select provider if default is not available
        if self.provider == "gemini" and not self.gemini_key and self.openai_key:
            self.provider = "openai"
        elif self.provider == "openai" and not self.openai_key and self.gemini_key:
            self.provider = "gemini"

    def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True,
    ) -> str:
        """
        Executes LLM completion with exponential backoff retries.
        
        Args:
            system_prompt: Guiding system instructions (treats input as trusted recruiter or schema extractor).
            user_prompt: Input document payload.
            json_mode: If true, enforces JSON formatting.
            
        Returns:
            Raw response text from LLM.
        """
        last_error = None

        for attempt in range(1, self.max_retries + 1):
            try:
                if self.provider == "gemini":
                    return self._complete_gemini(system_prompt, user_prompt, json_mode)
                else:
                    return self._complete_openai(system_prompt, user_prompt, json_mode)
            except Exception as e:
                last_error = e
                logger.warning(
                    f"LLM API attempt {attempt}/{self.max_retries} failed with {self.provider}: {e}",
                    gate="LLM_CLIENT",
                )
                # Try fallback provider on error
                if self.provider == "openai" and self.gemini_key:
                    logger.info("Attempting failover to Gemini provider...", gate="LLM_CLIENT")
                    try:
                        return self._complete_gemini(system_prompt, user_prompt, json_mode)
                    except Exception as ge:
                        last_error = ge
                elif self.provider == "gemini" and self.openai_key:
                    logger.info("Attempting failover to OpenAI provider...", gate="LLM_CLIENT")
                    try:
                        return self._complete_openai(system_prompt, user_prompt, json_mode)
                    except Exception as oe:
                        last_error = oe

                if attempt < self.max_retries:
                    time.sleep(self.retry_backoff * (2 ** (attempt - 1)))

        raise RuntimeError(f"All LLM completion retries failed. Last error: {last_error}")

    def complete_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema_cls: Type[BaseModel],
    ) -> BaseModel:
        """
        Executes completion and validates output against a Pydantic schema.
        Automatically retries with a corrective prompt on parse error.
        """
        raw_resp = self.complete(system_prompt, user_prompt, json_mode=True)
        cleaned_json = self._clean_json_markdown(raw_resp)

        try:
            parsed_dict = json.loads(cleaned_json)
            return schema_cls.model_validate(parsed_dict)
        except Exception as parse_err:
            logger.warning(
                f"Initial structured parsing failed: {parse_err}. Triggering corrective retry...",
                gate="LLM_CLIENT",
            )
            # Corrective prompt
            correction_prompt = (
                f"Your previous output failed validation with error: {parse_err}\n"
                f"Previous output was:\n{raw_resp}\n\n"
                f"Please correct the JSON output so it strictly adheres to the requested schema. "
                f"Return ONLY valid JSON."
            )
            retry_resp = self.complete(system_prompt, correction_prompt, json_mode=True)
            cleaned_retry = self._clean_json_markdown(retry_resp)
            parsed_retry = json.loads(cleaned_retry)
            return schema_cls.model_validate(parsed_retry)

    def _complete_gemini(self, system_prompt: str, user_prompt: str, json_mode: bool) -> str:
        import google.generativeai as genai
        genai.configure(api_key=self.gemini_key)
        
        # Use gemini-2.5-flash or gemini-1.5-flash
        model_name = self.model_name
        if "gemini" not in model_name:
            model_name = "models/gemini-2.5-flash"
        elif not model_name.startswith("models/"):
            model_name = f"models/{model_name}"

        generation_config = {
            "temperature": self.temperature,
            "max_output_tokens": self.max_tokens,
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

    def _complete_openai(self, system_prompt: str, user_prompt: str, json_mode: bool) -> str:
        import openai
        client = openai.OpenAI(api_key=self.openai_key)
        
        model_name = self.model_name
        if "gpt" not in model_name:
            model_name = "gpt-4o-mini"

        kwargs = {
            "model": model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

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


def get_llm_client() -> LLMClient:
    """Returns singleton LLMClient."""
    global _LLM_CLIENT_INSTANCE
    if _LLM_CLIENT_INSTANCE is None:
        _LLM_CLIENT_INSTANCE = LLMClient()
    return _LLM_CLIENT_INSTANCE
