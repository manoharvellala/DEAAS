import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    TELEMETRY_PROVIDER: str = os.getenv("TELEMETRY_PROVIDER", "mock").lower()
    EPICS_CA_ADDR_LIST: str | None = os.getenv("EPICS_CA_ADDR_LIST")
    EPICS_CA_AUTO_ADDR_LIST: str | None = os.getenv("EPICS_CA_AUTO_ADDR_LIST")

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5001"))
    CORS_ORIGINS: list[str] = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./deaas.db")
    PV_PREFIX: str = os.getenv("PV_PREFIX", "PLANT1:BUS0")

settings = Settings()
