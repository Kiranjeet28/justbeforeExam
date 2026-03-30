from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "postgresql://neondb_owner:npg_2ZXoEfLt9iVd@ep-flat-meadow-ab94qt35-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require/neondb"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
