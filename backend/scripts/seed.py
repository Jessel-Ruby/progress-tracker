"""
seed.py - Run this script once to populate the database with demo data.
Usage: python -m scripts.seed
"""

import asyncio
from datetime import datetime, timedelta

import models
from core.auth import get_password_hash
from scripts._db_helper import init_db


async def seed():
    await init_db()

    # Check if already seeded
    user_count = await models.User.count()
    if user_count > 0:
        print("Database already has data. Skipping seed.")
        return

    print("Seeding MongoDB database for Phase 2...")

    # 1. Create departments
    software_dept = models.Department(
        name="Software Engineering",
        description="Core software development and system architecture.",
    )
    design_dept = models.Department(
        name="Design",
        description="UX/UI design, branding, and asset creation.",
    )
    marketing_dept = models.Department(
        name="Marketing",
        description="Public relations, outreach, and user acquisition.",
    )

    await software_dept.insert()
    await design_dept.insert()
    await marketing_dept.insert()

    # 2. Create users
    president = models.User(
        username="president",
        email="president@tracker.dev",
        password_hash=get_password_hash("President1!"),
        role="hod",
        department_id=str(software_dept.id),
        is_president=True,
        status="active",
        xp=5000,
        level=8,
        streak=15,
        contribution_score=95
    )
    vp = models.User(
        username="vp",
        email="vp@tracker.dev",
        password_hash=get_password_hash("VicePresident1!"),
        role="hod",
        department_id=str(software_dept.id),
        is_vice_president=True,
        status="active",
        xp=4200,
        level=6,
        streak=10,
        contribution_score=85
    )
    alice = models.User(
        username="alice",
        email="alice@tracker.dev",
        password_hash=get_password_hash("password"),
        role="hod",
        department_id=str(software_dept.id),
        status="active",
        xp=2500,
        level=5,
        streak=8,
        contribution_score=60
    )
    bob = models.User(
        username="bob",
        email="bob@tracker.dev",
        password_hash=get_password_hash("password"),
        role="hod",
        department_id=str(design_dept.id),
        status="active",
        xp=2200,
        level=4,
        streak=5,
        contribution_score=50
    )
    charlie = models.User(
        username="charlie",
        email="charlie@tracker.dev",
        password_hash=get_password_hash("password"),
        role="member",
        department_id=str(software_dept.id),
        status="active",
        xp=1200,
        level=3,
        streak=3,
        contribution_score=30
    )
    pending_user = models.User(
        username="pending_user",
        email="pending@tracker.dev",
        password_hash=get_password_hash("password"),
        role="member",
        department_id=str(design_dept.id),
        status="pending",
        xp=0,
        level=1,
        streak=0,
        contribution_score=0
    )

    await president.insert()
    await vp.insert()
    await alice.insert()
    await bob.insert()
    await charlie.insert()
    await pending_user.insert()

    # 3. Associate departments with HODs and members
    software_dept.owner_id = str(alice.id)
    software_dept.member_ids = [str(president.id), str(vp.id), str(alice.id), str(charlie.id)]
    await software_dept.save()

    design_dept.owner_id = str(bob.id)
    design_dept.member_ids = [str(bob.id)]
    await design_dept.save()

    # 4. Create achievements
    ach_first_blood = models.Achievement(title="First Blood", description="Complete your first task.", badge_icon="🌟", xp_reward=20)
    ach_streak = models.Achievement(title="3-Day Streak", description="Log in for 3 consecutive days.", badge_icon="🔥", xp_reward=30)
    ach_speedster = models.Achievement(title="Speedster", description="Submit a task before the deadline.", badge_icon="⚡", xp_reward=15)
    ach_team_player = models.Achievement(title="Team Player", description="Complete 10 tasks.", badge_icon="🏆", xp_reward=50)

    await ach_first_blood.insert()
    await ach_streak.insert()
    await ach_speedster.insert()
    await ach_team_player.insert()

    # Award charlie the first achievement
    ua = models.UserAchievement(user_id=str(charlie.id), achievement_id=str(ach_first_blood.id))
    await ua.insert()

    # 5. Create tasks
    t1 = models.Task(
        title="Build REST API Endpoints",
        description="Create the full set of REST API endpoints for the task management module, including CRUD for tasks, submissions, and user profiles.",
        priority="high",
        deadline=datetime.utcnow() + timedelta(days=3),
        status="in_progress",
        assigned_to=str(charlie.id),
        assigned_by=str(alice.id),
        department_id=str(software_dept.id),
    )
    t2 = models.Task(
        title="Design Kanban Board UI",
        description="Implement a drag-and-drop Kanban board using dnd-kit. The board should support three columns: To Do, In Progress, and Done.",
        priority="medium",
        deadline=datetime.utcnow() + timedelta(days=5),
        status="pending",
        assigned_to=str(charlie.id),
        assigned_by=str(alice.id),
        department_id=str(software_dept.id),
    )
    t3 = models.Task(
        title="Write Unit Tests",
        description="Write unit tests for the authentication module covering signup, login, and token refresh flows.",
        priority="low",
        deadline=datetime.utcnow() + timedelta(days=7),
        status="pending",
        assigned_to=str(charlie.id),
        assigned_by=str(alice.id),
        department_id=str(software_dept.id),
    )
    t4 = models.Task(
        title="Create Branding Guidelines",
        description="Formulate vector color palettes, typography guidelines, and design standard icons for the product portal.",
        priority="high",
        deadline=datetime.utcnow() + timedelta(days=6),
        status="pending",
        assigned_to=str(bob.id),
        assigned_by=str(president.id),
        department_id=str(design_dept.id),
    )
    await t1.insert()
    await t2.insert()
    await t3.insert()
    await t4.insert()

    # Add a submission for t1
    s1 = models.TaskSubmission(
        task_id=str(t1.id),
        user_id=str(charlie.id),
        comment="Completed all 12 endpoints. Ready for review.",
        status="pending",
    )
    await s1.insert()

    # Add activity logs for charlie
    for i in range(20):
        offset = i % 5
        log = models.ActivityLog(
            user_id=str(charlie.id),
            activity_type="task_completed",
            points_earned=10 + offset,
            created_at=datetime.utcnow() - timedelta(days=i)
        )
        await log.insert()

    # Notifications
    n1 = models.Notification(
        user_id=str(charlie.id),
        title="New Task Assigned",
        message="Alice has assigned you: 'Build REST API Endpoints'. Deadline in 3 days.",
        is_read=False
    )
    n2 = models.Notification(
        user_id=str(charlie.id),
        title="Achievement Unlocked! 🌟",
        message="You earned the 'First Blood' badge for completing your first task!",
        is_read=True
    )
    await n1.insert()
    await n2.insert()

    print("MongoDB Database seeded successfully!")
    print("\nDemo accounts:")
    print("  President -> username: president   | password: President1!")
    print("  VP        -> username: vp          | password: VicePresident1!")
    print("  HOD Soft  -> username: alice        | password: password")
    print("  HOD Des   -> username: bob          | password: password")
    print("  Member    -> username: charlie      | password: password")
    print("  Pending   -> username: pending_user | password: password")


if __name__ == "__main__":
    asyncio.run(seed())
