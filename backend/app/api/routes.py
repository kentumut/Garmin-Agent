"""API routes for the Jarvis AI backend."""
import logging
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from ..services.transcription import transcription_service

logger = logging.getLogger(__name__)

# Create API router
router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "service": "jarvis-ai-backend"}

@router.get("/info")
async def get_service_info() -> Dict[str, Any]:
    """Get service information."""
    return {
        "service": "jarvis-ai-backend",
        "version": "1.0.0",
        "model": transcription_service.get_model_info()
    }

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe")
) -> JSONResponse:
    """
    Transcribe audio file to text.
    
    Args:
        file: Audio file (WAV, MP3, MP4, OGG, WebM, FLAC)
        
    Returns:
        JSON response with transcription results
    """
    try:
        logger.info(f"Transcribing file: {file.filename} ({file.content_type})")
        
        result = await transcription_service.transcribe_file(file)
        
        return JSONResponse(
            status_code=200,
            content=result
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in transcribe endpoint: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error during transcription"
        )

@router.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint."""
    return {
        "message": "Jarvis AI Backend", 
        "version": "1.0.0",
        "docs": "/docs"
    }
