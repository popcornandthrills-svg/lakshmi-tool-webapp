import json
import os
import sqlite3
import sys


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/inspect_db.py <db-path>")
        raise SystemExit(1)

    db_path = sys.argv[1]
    print("exists:", os.path.exists(db_path))
    print("size:", os.path.getsize(db_path))

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cur.fetchall()]
    print(json.dumps(tables, indent=2))
    for table in tables:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"{table}: {count}")
        except Exception as exc:
            print(f"{table}: error: {exc}")
    conn.close()


if __name__ == "__main__":
    main()
