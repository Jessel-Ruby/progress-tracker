"""
clear_tasks.py - Delete all tasks, task submissions, activity logs, and notifications.
Usage: python -m scripts.clear_tasks          (dry run)
       python -m scripts.clear_tasks --confirm (execute)
"""

import argparse
import asyncio

import models
from scripts._db_helper import init_db


async def clear_tasks():
    parser = argparse.ArgumentParser(description="Clear all tasks, submissions, activity logs, and notifications")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Actually execute the deletion of all database tasks and associated records"
    )
    args = parser.parse_args()

    await init_db()

    print("Checking database records...")
    tasks_count = await models.Task.count()
    submissions_count = await models.TaskSubmission.count()
    logs_count = await models.ActivityLog.count()
    notifications_count = await models.Notification.count()

    if tasks_count == 0 and submissions_count == 0 and logs_count == 0 and notifications_count == 0:
        print("No tasks, submissions, logs, or notifications found in the database. Nothing to delete.")
        return

    print(f"Found:")
    print(f"  - Tasks: {tasks_count}")
    print(f"  - Submissions: {submissions_count}")
    print(f"  - Activity Logs: {logs_count}")
    print(f"  - Notifications: {notifications_count}")
    
    if not args.confirm:
        print("\nDRY RUN MODE (default) - No changes will be made.")
        print("To confirm and delete all of the above records, run:")
        print("  python -m scripts.clear_tasks --confirm")
        return

    print("Deleting records...")
    await models.Task.get_motor_inherit_or_class_collection().delete_many({})
    await models.TaskSubmission.get_motor_inherit_or_class_collection().delete_many({})
    await models.ActivityLog.get_motor_inherit_or_class_collection().delete_many({})
    await models.Notification.get_motor_inherit_or_class_collection().delete_many({})

    print("Successfully deleted all tasks, submissions, activity logs, and notifications!")

if __name__ == "__main__":
    asyncio.run(clear_tasks())
