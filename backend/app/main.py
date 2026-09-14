from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import areas, arquivos, auth, bases, usuarios

settings = get_settings()

app = FastAPI(title="Sistema PDA — MESP", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(areas.router)
app.include_router(bases.router)
app.include_router(arquivos.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
