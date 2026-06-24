"""
reset_user.py - Reset/set pgtracker user to admin with password 'admin123'.
Usage: python -m scripts.reset_user
"""

import asyncio
from core.auth import get_password_hash
from models.user import User
from scripts._db_helper import init_db


async def reset():
    await init_db()
    hashed = get_password_hash("admin123")

    user = await User.find_one({"username": "pgtracker"})
    if user:
        user.password_hash = hashed
        user.role = "admin"
        await user.save()
        print("Done - pgtracker is now admin with password: admin123")
    else:
        print("User pgtracker not found.")


if __name__ == "__main__":
    asyncio.run(reset())
