"""
cleanup_users.py - Remove test users and their associated data from MongoDB.
Usage: python -m scripts.cleanup_users          (dry run)
       python -m scripts.cleanup_users --confirm (execute)
"""

import argparse
import asyncio

from scripts._db_helper import init_db
from core.database import db


async def main():
    parser = argparse.ArgumentParser(description="Clean up test users from MongoDB")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Actually perform the deletion and cleanup operations (default is dry-run)"
    )
    args = parser.parse_args()

    await init_db()

    # Keep list
    keep_usernames = ["Jess", "admin", "pgtracker"]

    # Define collections
    users_col = db["users"]
    tasks_col = db["tasks"]
    activity_logs_col = db["activity_logs"]
    departments_col = db["departments"]
    submissions_col = db["task_submissions"]

    # 1. Finds all users NOT in the keep-list
    cursor = users_col.find({"username": {"$nin": keep_usernames}})
    users_to_remove = await cursor.to_list(length=None)

    if not users_to_remove:
        print("No users to clean up. All users match the keep list.")
        return

    print(f"Found {len(users_to_remove)} user(s) to remove.")
    print("-" * 50)

    user_infos = []
    for user in users_to_remove:
        user_id_str = str(user["_id"])
        username = user.get("username", "Unknown")

        # Count tasks assigned to
        assigned_to_count = await tasks_col.count_documents({"assigned_to": user_id_str})
        # Count tasks assigned by
        assigned_by_count = await tasks_col.count_documents({"assigned_by": user_id_str})
        # Count activity logs
        logs_count = await activity_logs_col.count_documents({"user_id": user_id_str})
        # Count task submissions
        submissions_count = await submissions_col.count_documents({"user_id": user_id_str})

        user_infos.append({
            "user": user,
            "user_id_str": user_id_str,
            "username": username,
            "assigned_to_count": assigned_to_count,
            "assigned_by_count": assigned_by_count,
            "logs_count": logs_count,
            "submissions_count": submissions_count
        })

    # 2. DRY RUN MODE (default)
    if not args.confirm:
        print("DRY RUN MODE (default) - No changes will be made.")
        print("-" * 50)
        for info in user_infos:
            print(f"Username: {info['username']} (ID: {info['user_id_str']})")
            print(f"  - Tasks assigned to this user: {info['assigned_to_count']}")
            print(f"  - Tasks assigned by this user: {info['assigned_by_count']}")
            print(f"  - Activity logs: {info['logs_count']}")
            print(f"  - Task submissions: {info['submissions_count']}")
            print()
        print("-" * 50)
        print("To execute these deletions, run the script with the --confirm flag:")
        print("  python -m scripts.cleanup_users --confirm")
        return

    # 3. CONFIRMED MODE - performs the deletion
    print("CONFIRMED MODE - Executing deletion...")
    print("-" * 50)

    deleted_user_ids = [info["user_id_str"] for info in user_infos]
    deleted_object_ids = [info["user"]["_id"] for info in user_infos]

    # Delete the user documents themselves
    delete_users_res = await users_col.delete_many({"_id": {"$in": deleted_object_ids}})
    total_users_deleted = delete_users_res.deleted_count

    # For tasks assigned_to a deleted user: set assigned_to to null
    update_tasks_res = await tasks_col.update_many(
        {"assigned_to": {"$in": deleted_user_ids}},
        {"$set": {"assigned_to": None}}
    )
    total_tasks_nulled = update_tasks_res.modified_count

    # For tasks assigned_by a deleted user: leave as-is (historical record)

    # Delete activity_logs documents where user_id matches a deleted user
    delete_logs_res = await activity_logs_col.delete_many({"user_id": {"$in": deleted_user_ids}})
    total_logs_deleted = delete_logs_res.deleted_count

    # Delete task_submissions where user_id matches a deleted user
    delete_submissions_res = await submissions_col.delete_many({"user_id": {"$in": deleted_user_ids}})
    total_submissions_deleted = delete_submissions_res.deleted_count

    # Remove any deleted user's ID from any Department's member_ids array
    await departments_col.update_many(
        {"member_ids": {"$in": deleted_user_ids}},
        {"$pullAll": {"member_ids": deleted_user_ids}}
    )

    print("Cleanup completed successfully.")
    print("-" * 50)
    print("SUMMARY OF ACTIONS:")
    print(f"  - Users deleted: {total_users_deleted}")
    print(f"  - Tasks with 'assigned_to' set to null: {total_tasks_nulled}")
    print(f"  - Activity logs deleted: {total_logs_deleted}")
    print(f"  - Task submissions deleted: {total_submissions_deleted}")

if __name__ == "__main__":
    asyncio.run(main())
