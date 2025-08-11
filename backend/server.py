#!/usr/bin/env python3
"""
Jarvis AI Backend Server

Enterprise-level FastAPI server for speech-to-text transcription using Faster Whisper.
Supports automatic port discovery and PyInstaller packaging.
"""
import argparse
import socket
import sys
import multiprocessing
import logging
import uvicorn

from app.api.main import create_app
from app.config import settings

def _find_free_port(host: str) -> int:
    """Find a free port on the given host."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((host, 0))
        return s.getsockname()[1]

def _is_port_in_use(host: str, port: int) -> bool:
    """Check if a port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Jarvis AI Backend Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python server.py                    # Start with default settings
  python server.py --port 0          # Auto-discover free port
  python server.py --host 0.0.0.0    # Listen on all interfaces
        """
    )
    
    parser.add_argument(
        "--host", 
        default=settings.HOST,
        help=f"Host to bind to (default: {settings.HOST})"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=settings.PORT,
        help=f"Port to bind to, use 0 for auto-discovery (default: {settings.PORT})"
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default=settings.LOG_LEVEL,
        help=f"Logging level (default: {settings.LOG_LEVEL})"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        default=settings.RELOAD,
        help="Enable auto-reload for development"
    )
    
    return parser.parse_known_args()

def main() -> None:
    """Main entry point."""
    # PyInstaller multiprocessing support
    multiprocessing.freeze_support()
    
    # Parse arguments
    args, unknown = parse_arguments()
    
    # Handle PyInstaller subprocess filtering
    unknown_str = " ".join(unknown)
    if "-c" in sys.argv or "multiprocessing.resource_tracker" in unknown_str:
        sys.exit(0)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    logger = logging.getLogger(__name__)
    
    # Determine port
    chosen_port = args.port
    if chosen_port <= 0 or _is_port_in_use(args.host, chosen_port):
        chosen_port = _find_free_port(args.host)
        logger.info(f"Auto-discovered free port: {chosen_port}")
    
    # Print port for Electron to capture
    print(f"PORT {chosen_port}", flush=True)
    
    # Create FastAPI application
    app = create_app()
    
    # Start server
    logger.info(f"Starting Jarvis AI Backend on {args.host}:{chosen_port}")
    try:
        uvicorn.run(
            app,
            host=args.host,
            port=chosen_port,
            log_level=args.log_level.lower(),
            reload=args.reload,
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
