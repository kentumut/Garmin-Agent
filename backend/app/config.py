"""Configuration settings for the Jarvis AI backend."""
import os
from typing import Literal

class Settings:
    """Application settings and configuration."""
    
    # Server settings
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Whisper model settings
    WHISPER_MODEL_SIZE: Literal["tiny", "base", "small", "medium", "large"] = os.getenv(
        "WHISPER_MODEL_SIZE", "base"
    )
    WHISPER_DEVICE: Literal["cpu", "cuda", "auto"] = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE_TYPE: Literal["int8", "int16", "float16", "float32"] = os.getenv(
        "WHISPER_COMPUTE_TYPE", "int8"
    )
    
    # Audio processing settings
    VAD_FILTER: bool = os.getenv("VAD_FILTER", "true").lower() == "true"
    BEAM_SIZE: int = int(os.getenv("BEAM_SIZE", "3"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.0"))
    
    # File upload settings
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    ALLOWED_AUDIO_TYPES: list[str] = [
        "audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", 
        "audio/webm", "audio/flac", "audio/x-wav"
    ]
    
    # CORS settings
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    CORS_ALLOW_CREDENTIALS: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
    
    # Logging
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = os.getenv("LOG_LEVEL", "INFO")
    
    # Development settings
    RELOAD: bool = os.getenv("RELOAD", "false").lower() == "true"

# Global settings instance
settings = Settings()
