"""
seed.py - Run this script once to populate the database with demo data.
Usage: python seed.py
"""

import asyncio
from beanie import init_beanie
from database import db
import models
from auth import get_password_hash
from datetime import datetime, timedelta

async def seed():
    # Initialize Beanie
    await init_beanie(
        database=db,
        document_models=[
            models.User,
            models.Task,
            models.TaskSubmission,
            models.ActivityLog,
            models.Achievement,
            models.UserAchievement,
            models.Notification
        ]
    )

    # Check if already seeded
    user_count = await models.User.count()
    if user_count > 0:
        print("Database already has data. Skipping seed.")
        return

    print("Seeding MongoDB database...")

    # Create users
    admin = models.User(
        username="admin",
        email="admin@tracker.dev",
        password_hash=get_password_hash("admin123"),
        role="admin",
        xp=4500,
        level=7,
        rank="Team Leader",
        streak=12,
        contribution_score=89
    )
    alice = models.User(
        username="alice",
        email="alice@tracker.dev",
        password_hash=get_password_hash("password"),
        role="user",
        xp=1200,
        level=4,
        rank="Specialist",
        streak=5,
        contribution_score=44
    )
    bob = models.User(
        username="bob",
        email="bob@tracker.dev",
        password_hash=get_password_hash("password"),
        role="user",
        xp=540,
        level=3,
        rank="Active Member",
        streak=2,
        contribution_score=20
    )
    charlie = models.User(
        username="charlie",
        email="charlie@tracker.dev",
        password_hash=get_password_hash("password"),
        role="user",
        xp=80,
        level=1,
        rank="Beginner",
        streak=0,
        contribution_score=3
    )
    
    await admin.insert()
    await alice.insert()
    await bob.insert()
    await charlie.insert()

    # Create achievements
    ach_first_blood = models.Achievement(title="First Blood", description="Complete your first task.", badge_icon="🌟", xp_reward=20)
    ach_streak = models.Achievement(title="3-Day Streak", description="Log in for 3 consecutive days.", badge_icon="🔥", xp_reward=30)
    ach_speedster = models.Achievement(title="Speedster", description="Submit a task before the deadline.", badge_icon="⚡", xp_reward=15)
    ach_team_player = models.Achievement(title="Team Player", description="Complete 10 tasks.", badge_icon="🏆", xp_reward=50)

    await ach_first_blood.insert()
    await ach_streak.insert()
    await ach_speedster.insert()
    await ach_team_player.insert()

    # Award alice the first achievement
    ua = models.UserAchievement(user_id=str(alice.id), achievement_id=str(ach_first_blood.id))
    await ua.insert()

    # Create tasks
    t1 = models.Task(
        title="Build REST API Endpoints",
        description="Create the full set of REST API endpoints for the task management module, including CRUD for tasks, submissions, and user profiles.",
        priority="high",
        deadline=datetime.utcnow() + timedelta(days=3),
        status="in_progress",
        assigned_to=str(alice.id),
        assigned_by=str(admin.id),
    )
    t2 = models.Task(
        title="Design Kanban Board UI",
        description="Implement a drag-and-drop Kanban board using dnd-kit. The board should support three columns: To Do, In Progress, and Done.",
        priority="medium",
        deadline=datetime.utcnow() + timedelta(days=5),
        status="pending",
        assigned_to=str(alice.id),
        assigned_by=str(admin.id),
    )
    t3 = models.Task(
        title="Write Unit Tests",
        description="Write unit tests for the authentication module covering signup, login, and token refresh flows.",
        priority="low",
        deadline=datetime.utcnow() + timedelta(days=7),
        status="pending",
        assigned_to=str(bob.id),
        assigned_by=str(admin.id),
    )
    t4 = models.Task(
        title="Deploy to Production",
        description="Containerize the application with Docker and deploy to a cloud server. Set up Nginx as a reverse proxy.",
        priority="high",
        deadline=datetime.utcnow() + timedelta(days=10),
        status="pending",
        assigned_to=str(bob.id),
        assigned_by=str(admin.id),
    )
    await t1.insert()
    await t2.insert()
    await t3.insert()
    await t4.insert()

    # Add a submission for t1
    s1 = models.TaskSubmission(
        task_id=str(t1.id),
        user_id=str(alice.id),
        comment="Completed all 12 endpoints. Ready for review.",
        status="pending",
    )
    await s1.insert()

    # Add activity logs (for heatmap)
    for i in range(30):
        offset = i % 5
        log = models.ActivityLog(
            user_id=str(alice.id),
            activity_type="task_completed",
            points_earned=10 + offset,
            created_at=datetime.utcnow() - timedelta(days=i)
        )
        await log.insert()

    for i in range(15):
        log = models.ActivityLog(
            user_id=str(bob.id),
            activity_type="task_completed",
            points_earned=10,
            created_at=datetime.utcnow() - timedelta(days=i * 2)
        )
        await log.insert()

    # Notifications
    n1 = models.Notification(
        user_id=str(alice.id),
        title="New Task Assigned",
        message="Admin has assigned you: 'Build REST API Endpoints'. Deadline in 3 days.",
        is_read=False
    )
    n2 = models.Notification(
        user_id=str(alice.id),
        title="Achievement Unlocked! 🌟",
        message="You earned the 'First Blood' badge for completing your first task!",
        is_read=True
    )
    await n1.insert()
    await n2.insert()

    print("MongoDB Database seeded successfully!")
    print("\nDemo accounts:")
    print("  Admin  -> username: admin   | password: admin123")
    print("  User 1 -> username: alice   | password: password")
    print("  User 2 -> username: bob     | password: password")
    print("  User 3 -> username: charlie | password: password")

if __name__ == "__main__":
    asyncio.run(seed())
