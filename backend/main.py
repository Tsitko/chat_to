"""
Main FastAPI application entry point.

This module initializes and configures the FastAPI application.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from configs import HOST, PORT, TTS_OUTPUT_DIR
from api import (
    character_router,
    book_router,
    message_router,
    indexing_router,
    tts_router,
    stt_routes,
    group_router,
    group_message_router,
)
from storage import AudioFileManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.

    Args:
        app: FastAPI application instance

    Yields:
        None
    """
    # Startup: Initialize database
    from storage.database import init_database
    init_database()
    print("Database initialized")

    yield

    # Shutdown: Close connections, cleanup, etc.
    print("Application shutting down")


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.

    Returns:
        FastAPI: Configured application instance
    """
    app = FastAPI(
        title="Chat To Historical Figures",
        description="Chat application for conversing with historical figures using RAG",
        version="1.0.0",
        lifespan=lifespan
    )

    # CORS middleware configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(character_router)
    app.include_router(book_router)
    app.include_router(message_router)
    app.include_router(indexing_router)
    app.include_router(tts_router)
    app.include_router(stt_routes.router)
    app.include_router(group_router)
    app.include_router(group_message_router)

    return app


app = create_app()


@app.get("/")
async def root():
    """
    Root endpoint for health check.

    Returns:
        dict: Application status
    """
    return {"status": "ok", "message": "Chat To Historical Figures API"}


@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        dict: Health status
    """
    return {"status": "healthy"}


@app.get("/audio/{filename}")
async def serve_audio_file(filename: str):
    """
    Serve audio file.

    Args:
        filename: Name of the audio file to serve

    Returns:
        FileResponse: Audio file stream

    Raises:
        HTTPException: 404 if file not found
    """
    audio_manager = AudioFileManager(output_dir=TTS_OUTPUT_DIR)
    filepath = audio_manager.get_absolute_path(filename)

    if not audio_manager.file_exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=filepath,
        media_type="audio/ogg",
        filename=filename
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
