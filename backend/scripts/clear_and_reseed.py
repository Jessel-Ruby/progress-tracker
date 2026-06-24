"""
clear_and_reseed.py - Drop all collections and re-seed the database.
Usage: python -m scripts.clear_and_reseed
"""

import asyncio

import models
from scripts._db_helper import init_db
from scripts.seed import seed


async def reset_db():
    await init_db()

    print("Dropping collections...")
    await models.User.find_all().delete()
    await models.Task.find_all().delete()
    await models.TaskSubmission.find_all().delete()
    await models.ActivityLog.find_all().delete()
    await models.Achievement.find_all().delete()
    await models.UserAchievement.find_all().delete()
    await models.Notification.find_all().delete()
    await models.Department.find_all().delete()
    
    print("Collections cleared. Seeding database...")
    await seed()
    print("Database reset and seeded successfully!")

if __name__ == "__main__":
    asyncio.run(reset_db())
