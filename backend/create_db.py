import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    conn = psycopg2.connect(
        dbname='postgres',
        user='postgres',
        password='12345678',
        host='localhost',
        port='5432'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    cursor.execute('CREATE DATABASE tanacakra;')
    print("Database 'tanacakra' created successfully.")
    cursor.close()
    conn.close()
except psycopg2.errors.DuplicateDatabase:
    print("Database 'tanacakra' already exists.")
except Exception as e:
    print(f"Error: {e}")
