import sqlite3
from app.database import Base, engine
from app import models

# Táblák létrehozása az adatbázisban
#print("Táblák létrehozása az SQLite-ban...")
#Base.metadata.create_all(bind=engine)
#print("✅ Kész! Minden tábla létrehozva.")

conn = sqlite3.connect("local_db.sqlite3")
cursor = conn.execute("SELECT * FROM users")
print("Felhasznalok listaja: ", cursor.fetchall())
conn.close()
