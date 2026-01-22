from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import cards, admin, collections, webhooks, products
from .utils.supabase_client import load_dotenv

load_dotenv()

app = FastAPI(
    title="MTG TCG Web App",
    description="Advanced TCG price aggregation and analysis platform",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(cards.router)
app.include_router(admin.router)
app.include_router(collections.router)
app.include_router(webhooks.router)
app.include_router(products.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2025-01-28T00:00:00Z"}

@app.get("/")
async def root():
    return {
        "message": "Welcome to MTG TCG Web App",
        "version": "1.0.0",
        "docs": "/docs"
    }
