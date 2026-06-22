import json
import sqlite3
import sys

db_path = sys.argv[1]
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT art_number, product_json, created_at, updated_at FROM products ORDER BY updated_at DESC LIMIT 20")
rows = cur.fetchall()
print(json.dumps(rows, indent=2))
conn.close()
