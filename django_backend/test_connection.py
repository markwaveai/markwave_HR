
import os
import psycopg2
from dotenv import load_dotenv

# Path to .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def test_connection():
    try:
        dbname = os.getenv('POSTGRES_DB')
        user = os.getenv('POSTGRES_USER')
        password = os.getenv('POSTGRES_PASSWORD')
        host = os.getenv('DB_HOST')
        port = os.getenv('DB_PORT', '5432')
        
        print(f"Attempting to connect to {dbname} as {user} on {host}:{port}...")
        
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port
        )
        print("Success! Connection established.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_connection()
