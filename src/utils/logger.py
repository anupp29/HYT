"""
HYT ATS - Structured Logging Subsystem
======================================
Provides structured JSON-Lines logging for auditability and clean,
human-readable formatted output to the terminal.
Logs: gate_name, candidate_id, event_type, timestamp, message, latency_ms.
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any


class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as single-line JSON objects for machine parsing."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "gate": getattr(record, "gate", "PIPELINE"),
            "candidate_id": getattr(record, "candidate_id", "N/A"),
            "event_type": getattr(record, "event_type", "INFO"),
        }
        
        # Include extra attributes if present
        if hasattr(record, "latency_ms"):
            log_obj["latency_ms"] = record.latency_ms
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_obj["data"] = record.extra_data

        return json.dumps(log_obj)


class TerminalFormatter(logging.Formatter):
    """Formats log records for clear, colored terminal presentation."""

    COLORS = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        time_str = datetime.fromtimestamp(record.created).strftime("%H:%M:%S")
        gate_str = getattr(record, "gate", "SYSTEM")
        cid_str = getattr(record, "candidate_id", "")
        cid_tag = f"[{cid_str}] " if cid_str and cid_str != "N/A" else ""

        return f"{color}{time_str} [{record.levelname:<7}] [{gate_str:<10}] {cid_tag}{self.RESET}{record.getMessage()}"


class PipelineLogger:
    """Wrapper around logging.Logger with structured helper methods."""

    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def debug(self, msg: str, gate: str = "PIPELINE", candidate_id: str = "N/A", **kwargs):
        self._log(logging.DEBUG, msg, gate, candidate_id, kwargs)

    def info(self, msg: str, gate: str = "PIPELINE", candidate_id: str = "N/A", **kwargs):
        self._log(logging.INFO, msg, gate, candidate_id, kwargs)

    def warning(self, msg: str, gate: str = "PIPELINE", candidate_id: str = "N/A", **kwargs):
        self._log(logging.WARNING, msg, gate, candidate_id, kwargs)

    def error(self, msg: str, gate: str = "PIPELINE", candidate_id: str = "N/A", **kwargs):
        self._log(logging.ERROR, msg, gate, candidate_id, kwargs)

    def gate_entry(self, gate: str, candidate_id: str, details: str = ""):
        self.info(f"Entered {gate} {details}".strip(), gate=gate, candidate_id=candidate_id, event_type="GATE_ENTRY")

    def gate_exit(self, gate: str, candidate_id: str, outcome: str, latency_ms: Optional[float] = None):
        extra = {}
        if latency_ms is not None:
            extra["latency_ms"] = round(latency_ms, 2)
        self.info(f"Exited {gate} -> {outcome}", gate=gate, candidate_id=candidate_id, event_type="GATE_EXIT", **extra)

    def _log(self, level: int, msg: str, gate: str, candidate_id: str, extra_kwargs: dict):
        extra = {
            "gate": gate,
            "candidate_id": candidate_id,
            "event_type": extra_kwargs.pop("event_type", "GENERAL"),
        }
        if "latency_ms" in extra_kwargs:
            extra["latency_ms"] = extra_kwargs.pop("latency_ms")
        if extra_kwargs:
            extra["extra_data"] = extra_kwargs

        self._logger.log(level, msg, extra=extra)


# Global logger instance
_LOGGER_INSTANCE: Optional[PipelineLogger] = None


def init_logger(log_dir: str = "./logs", log_level: str = "INFO", console_output: bool = True) -> PipelineLogger:
    """Initializes root pipeline logger with JSON-Lines file handler and terminal handler."""
    global _LOGGER_INSTANCE

    os.makedirs(log_dir, exist_ok=True)
    raw_logger = logging.getLogger("hyt_ats")
    raw_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    raw_logger.handlers.clear()

    # 1. JSON Lines File Handler
    log_file_path = os.path.join(log_dir, f"pipeline_{datetime.now().strftime('%Y%m%d')}.jsonl")
    file_handler = logging.FileHandler(log_file_path, encoding="utf-8")
    file_handler.setFormatter(StructuredJsonFormatter())
    file_handler.setLevel(logging.DEBUG)
    raw_logger.addHandler(file_handler)

    # 2. Terminal Console Handler
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(TerminalFormatter())
        console_handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))
        raw_logger.addHandler(console_handler)

    _LOGGER_INSTANCE = PipelineLogger(raw_logger)
    return _LOGGER_INSTANCE


def get_logger(gate_name: Optional[str] = None) -> PipelineLogger:
    """Returns the initialized PipelineLogger instance."""
    global _LOGGER_INSTANCE
    if _LOGGER_INSTANCE is None:
        _LOGGER_INSTANCE = init_logger()
    return _LOGGER_INSTANCE
