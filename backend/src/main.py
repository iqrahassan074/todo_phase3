from fastapi import FastAPI, Depends, HTTPException, status
from sqlmodel import Session
from contextlib import asynccontextmanager

from .utils.database import create_tables, get_session
from .routes import chat_routes, task_routes
from .middleware.auth_middleware import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    create_tables()
    yield
    # Cleanup on shutdown if needed


app = FastAPI(lifespan=lifespan, title="Chat-Based Todo Management API")

# Include routers
app.include_router(chat_routes.router, prefix="/api", tags=["chat"])
app.include_router(task_routes.router, prefix="/api", tags=["tasks"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "backend"}

@app.get("/")
async def root():
    return {"message": "Welcome to the Chat-Based Todo Management System API"}

# Dependency to get current user (simplified for demo)
def get_current_user_dependency():
    # In a real implementation, this would extract and verify JWT token
    # For demo purposes, we'll return a mock user
    return {"id": "mock-user-id", "email": "user@example.com"}