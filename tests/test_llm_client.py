"""
HYT ATS - Multi-Provider LLM Client Test Suite
==============================================
Verifies:
1. Model resolution across all 4 ecosystems (Gemini, Groq, Ollama, OpenAI)
2. Ollama Gemma 4 (swift-12b) and Qwen alias mapping
3. Ollama reasoning model thinking extraction
4. JSON markdown stripper
5. Structured Pydantic completion & corrective retry
6. Multi-provider graceful failover on auth error
"""

import json
import pytest
from unittest.mock import MagicMock, patch
from pydantic import BaseModel

from src.utils.llm_client import LLMClient, get_llm_client


class SampleSchema(BaseModel):
    name: str
    score: float
    skills: list[str]


def test_llm_client_initialization():
    """Verify default initialization and config loading."""
    client = LLMClient()
    assert client.temperature == 0.0
    assert client.timeout_seconds >= 45
    assert client.provider in ["gemini", "groq", "ollama", "openai", "anthropic"]


def test_gemini_model_resolution():
    """Verify Gemini model prefixing and resolution."""
    client = LLMClient(provider="gemini")
    assert client._resolve_gemini_model("gemini-2.5-flash") == "models/gemini-2.5-flash"
    assert client._resolve_gemini_model("models/gemini-2.5-pro") == "models/gemini-2.5-pro"
    assert client._resolve_gemini_model(None) == "models/gemini-2.5-flash"


def test_groq_model_resolution():
    """Verify Groq models are mapped correctly."""
    client = LLMClient(provider="groq")
    assert client._resolve_groq_model("llama") == "llama-3.3-70b-versatile"
    assert client._resolve_groq_model("gemma") == "gemma2-9b-it"
    assert client._resolve_groq_model("8b") == "llama-3.1-8b-instant"
    assert client._resolve_groq_model("mixtral") == "mixtral-8x7b-32768"
    assert client._resolve_groq_model(None) == "llama-3.3-70b-versatile"


def test_ollama_gemma4_and_qwen_resolution():
    """Verify Ollama resolves Gemma 4 (swift-12b) and Qwen correctly."""
    client = LLMClient(provider="ollama")

    # Mock get_ollama_models to return installed models
    mock_models = [
        {"name": "qwen2.5-coder:1.5b", "details": {"family": "qwen2", "parent_model": ""}},
        {"name": "swift-12b:latest", "details": {"family": "gemma4", "parent_model": "gemma4:12b"}},
    ]
    with patch.object(client, "get_ollama_models", return_value=mock_models):
        assert client._resolve_ollama_model("gemma4") == "swift-12b:latest"
        assert client._resolve_ollama_model("gemma 4") == "swift-12b:latest"
        assert client._resolve_ollama_model("swift") == "swift-12b:latest"
        assert client._resolve_ollama_model("qwen") == "qwen2.5-coder:1.5b"
        assert client._resolve_ollama_model("qwen2.5-coder:1.5b") == "qwen2.5-coder:1.5b"


def test_ollama_thinking_block_json_extraction():
    """Verify that reasoning models (Gemma 4) with JSON in thinking field are correctly parsed."""
    client = LLMClient(provider="ollama")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "model": "swift-12b:latest",
        "message": {
            "role": "assistant",
            "content": "",
            "thinking": 'Analyzing request...\n```json\n{"status": "ok", "provider": "ollama"}\n```\nDone thinking.',
        },
    }

    with patch("requests.post", return_value=mock_resp):
        res = client._complete_ollama("sys", "user", True, "swift-12b:latest")
        cleaned = client._clean_json_markdown(res)
        data = json.loads(cleaned)
        assert data["status"] == "ok"
        assert data["provider"] == "ollama"


def test_json_markdown_stripper():
    """Verify stripping of markdown code fences."""
    client = LLMClient()
    fenced = '```json\n{"hello": "world"}\n```'
    assert client._clean_json_markdown(fenced) == '{"hello": "world"}'

    plain = '{"hello": "world"}'
    assert client._clean_json_markdown(plain) == '{"hello": "world"}'


def test_structured_validation_and_retry():
    """Verify structured output validation and retry on schema error."""
    client = LLMClient()

    # Step 1 returns invalid JSON, Step 2 returns valid JSON
    responses = [
        '{"invalid": "data"}',
        '{"name": "Alice", "score": 95.5, "skills": ["Python", "FastAPI"]}',
    ]
    with patch.object(client, "complete", side_effect=responses):
        result = client.complete_structured("sys", "user", SampleSchema)
        assert isinstance(result, SampleSchema)
        assert result.name == "Alice"
        assert result.score == 95.5
        assert "Python" in result.skills


def test_fast_failover_on_auth_error():
    """Verify that auth errors (401) trigger immediate failover without retry backoff."""
    client = LLMClient()
    client.groq_key = "invalid_key"
    client.gemini_key = "dummy_key"

    # Make Groq raise 401, Gemini succeed
    with patch.object(client, "_complete_groq", side_effect=Exception("Error code: 401 - Invalid API Key")):
        with patch.object(client, "_complete_gemini", return_value='{"status": "success"}'):
            res = client.complete("sys", "user", override_provider="groq")
            assert "success" in res
