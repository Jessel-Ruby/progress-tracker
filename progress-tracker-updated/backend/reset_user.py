import asyncio
from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client["progress_tracker"]

    hashed = pwd_context.hash("admin123")

    await db["users"].update_one(
        {"username": "pgtracker"},
        {"$set": {
            "password_hash": hashed,
            "role": "admin"
        }}
    )

    print("Done - pgtracker is now admin with password: admin123")

asyncio.run(reset())
