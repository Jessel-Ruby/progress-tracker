"""
One-off migration: unset contribution_score on all User documents.

Run from the backend directory:
    python -m scripts.remove_contribution_score
"""
import asyncio
from scripts._db_helper import init_db
from motor.motor_asyncio import AsyncIOMotorCollection
from core.database import db


async def main():
    await init_db()

    collection: AsyncIOMotorCollection = db["users"]
    result = await collection.update_many(
        {"contribution_score": {"$exists": True}},
        {"$unset": {"contribution_score": ""}}
    )
    print(f"Matched:  {result.matched_count} documents")
    print(f"Modified: {result.modified_count} documents")


if __name__ == "__main__":
    asyncio.run(main())
