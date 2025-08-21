
from .database import Base, engine, SessionLocal
from .models import Panel, Inverter

Base.metadata.create_all(bind=engine)

def run():
    db = SessionLocal()
    try:
        if db.query(Panel).count() == 0:
            db.add_all([
                Panel(name="Roof-P1", rated_watts=400),
                Panel(name="Roof-P2", rated_watts=400),
                Panel(name="Roof-P3", rated_watts=400),
            ])
        if db.query(Inverter).count() == 0:
            db.add_all([
                Inverter(name="Main-INV1", rated_watts=5000),
            ])
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    from .database import engine
    Base.metadata.create_all(bind=engine)
    run()
    print("Seeded panels/inverters")



