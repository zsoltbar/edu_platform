from app.database import Base, engine
from app import models
import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=localhost;'
    'DATABASE=edu_platform;'
    'UID=sa;'
    'PWD=edu_platform'
)
print("Kapcsolódás sikeres!")
conn.close()

# Táblák létrehozása az adatbázisban
#print("Táblák létrehozása az SQL Serverben...")
#Base.metadata.create_all(bind=engine)
#print("✅ Kész! Minden tábla létrehozva.")




