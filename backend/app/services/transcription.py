"""Transcription service using Faster Whisper."""
import logging
import tempfile
import os
from pathlib import Path
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

from faster_whisper import WhisperModel
from fastapi import UploadFile, HTTPException

from ..config import settings

logger = logging.getLogger(__name__)

class TranscriptionService:
    """Service for handling audio transcription using Faster Whisper."""
    
    def __init__(self):
        self._model: Optional[WhisperModel] = None
        self._model_loaded = False
    
    def _load_model(self) -> None:
        """Load the Whisper model."""
        if self._model_loaded:
            return
            
        try:
            logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL_SIZE}")
            self._model = WhisperModel(
                settings.WHISPER_MODEL_SIZE,
                device=settings.WHISPER_DEVICE,
                compute_type=settings.WHISPER_COMPUTE_TYPE
            )
            self._model_loaded = True
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise HTTPException(status_code=500, detail="Failed to initialize transcription service")
    
    async def transcribe_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Transcribe audio from uploaded file.
        
        Args:
            file: Uploaded audio file
            
        Returns:
            Dictionary containing transcription results
        """
        # Ensure model is loaded
        self._load_model()
        
        if not self._model:
            raise HTTPException(status_code=500, detail="Transcription model not available")
        
        # Validate file
        await self._validate_audio_file(file)
        
        # Create temporary file
        temp_path = None
        try:
            temp_path = await self._save_temp_file(file)
            
            # Perform transcription
            segments, info = self._model.transcribe(
                temp_path,
                beam_size=settings.BEAM_SIZE,
                vad_filter=settings.VAD_FILTER,
                temperature=settings.TEMPERATURE,
                task="transcribe"
            )
            
            # Collect results
            text_segments = []
            full_text = ""
            
            for segment in segments:
                segment_data = {
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip(),
                    "confidence": getattr(segment, 'avg_logprob', None)
                }
                text_segments.append(segment_data)
                full_text += segment.text
            
            result = {
                "text": full_text.strip(),
                "language": info.language,
                "language_probability": info.language_probability,
                "duration": info.duration,
                "segments": text_segments,
                "vad_filter_used": settings.VAD_FILTER
            }
            
            logger.info(f"Transcription completed: {len(full_text)} characters, {info.language}")
            return result
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        finally:
            # Clean up temporary file
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file {temp_path}: {e}")
    
    async def _validate_audio_file(self, file: UploadFile) -> None:
        """Validate uploaded audio file."""
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file size
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        # Reset file position
        await file.seek(0)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Check content type
        if file.content_type and file.content_type not in settings.ALLOWED_AUDIO_TYPES:
            logger.warning(f"Unexpected content type: {file.content_type}")
            # Don't fail here, let Whisper handle format detection
    
    async def _save_temp_file(self, file: UploadFile) -> str:
        """Save uploaded file to temporary location."""
        try:
            # Determine file extension
            file_extension = ""
            if file.filename:
                file_extension = Path(file.filename).suffix
            
            if not file_extension:
                # Default to .wav if no extension
                file_extension = ".wav"
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_path = temp_file.name
            
            logger.debug(f"Saved temp file: {temp_path}")
            return temp_path
            
        except Exception as e:
            logger.error(f"Failed to save temp file: {e}")
            raise HTTPException(status_code=500, detail="Failed to process uploaded file")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        return {
            "model_size": settings.WHISPER_MODEL_SIZE,
            "device": settings.WHISPER_DEVICE,
            "compute_type": settings.WHISPER_COMPUTE_TYPE,
            "loaded": self._model_loaded,
            "vad_filter": settings.VAD_FILTER,
            "beam_size": settings.BEAM_SIZE
        }

# Global service instance
transcription_service = TranscriptionService()
