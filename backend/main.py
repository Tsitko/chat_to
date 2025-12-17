"""
Main FastAPI application entry point.

This module initializes and configures the FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from configs import HOST, PORT
from api import character_router, book_router, message_router, indexing_router


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
