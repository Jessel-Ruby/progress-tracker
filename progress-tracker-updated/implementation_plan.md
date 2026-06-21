# Migrating Database Layer to MongoDB

This implementation plan details the architectural shift from a relational SQLite database using SQLAlchemy to a document-oriented MongoDB database using Beanie (an async ODM for MongoDB based on Pydantic v2) and Motor (the async MongoDB driver).

## User Review Required

> [!IMPORTANT]
> This migration changes all database model definitions and endpoint query patterns from synchronous SQLAlchemy queries to asynchronous MongoDB queries.
> All schema IDs (User, Task, TaskSubmission, Achievement, Notification, and ActivityLog) will change from auto-incrementing integers (`int`) to MongoDB's standard hex string ObjectIDs (`str`).

> [!WARNING]
> You must have MongoDB running locally at `mongodb://localhost:27017` (or provide a connection string) for this project to start after the migration is applied.

## Open Questions

> [!NOTE]
> 1. Should we default to a local connection string `mongodb://localhost:27017/progress_tracker`, or do you have a specific MongoDB Atlas connection string we should configure?
> 2. Are you comfortable with document IDs becoming standard MongoDB string `ObjectID`s (e.g., `64639ab902b1c28c89596b4b`) instead of integers (`1`, `2`, `3`)? (The frontend has been verified to support string IDs seamlessly).

---

## Proposed Changes

### [Backend Packages]
We will add `motor` and `beanie` to our python package requirements.

#### [MODIFY] [requirements.txt](file:///d:/PT/backend/requirements.txt)
* Append the following dependencies:
  ```txt
  motor==3.3.2
  beanie==2.4.0
  ```
  *(Note: `sqlalchemy` can remain in requirements or be deleted, but all files will stop importing it).*

---

### [Database Initialization]

#### [MODIFY] [database.py](file:///d:/PT/backend/database.py)
* Replace SQLAlchemy engine and sessionmaker with a MongoDB initialization helper using `motor.motor_asyncio.AsyncIOMotorClient` and `beanie.init_beanie`.
* Remove the `get_db()` synchronous dependency generator since Beanie works globally without needing open/close session cycles for simple CRUD.

---

### [Models Refactoring]

#### [MODIFY] [models.py](file:///d:/PT/backend/models.py)
* Convert all SQLAlchemy classes (`User`, `Task`, `TaskSubmission`, `ActivityLog`, `Achievement`, `UserAchievement`, `Notification`) into Beanie document classes inheriting from `beanie.Document`.
* Map SQL columns to standard Python typing with default values.
* Define indices (e.g. unique constraints for email and username on `User`).
* Remove SQLAlchemy relationships (`relationship`, `ForeignKey`). Instead, use Beanie's `Link[Document]` or store string references of linked models.

---

### [Pydantic Schemas]

#### [MODIFY] [schemas.py](file:///d:/PT/backend/schemas.py)
* Update all ID fields (`id`, `user_id`, `task_id`, `assigned_to`, `assigned_by`) from type `int` to `str`.
* Update configurations to support conversion of MongoDB `ObjectId` types to string representation when returning API JSON responses.

---

### [Gamification Engine]

#### [MODIFY] [gamification.py](file:///d:/PT/backend/gamification.py)
* Make `award_xp` an asynchronous function (`async def`).
* Replace synchronous SQLAlchemy operations with async Beanie model search and save operations.

---

### [Authentication Helper]

#### [MODIFY] [auth.py](file:///d:/PT/backend/auth.py)
* Update the `get_current_user` dependency helper to be asynchronous.
* Remove references to `Session` and SQLAlchemy `db.query()`. Retrieve the user using `await User.find_one(User.username == username)`.

---

### [API Routers]

#### [MODIFY] [auth.py (Router)](file:///d:/PT/backend/routers/auth.py)
* Update all path operation functions to `async def`.
* Replace `db.query()` with Beanie database query methods (e.g. `User.find_one()`, `await user.insert()`).

#### [MODIFY] [tasks.py (Router)](file:///d:/PT/backend/routers/tasks.py)
* Update all endpoint functions to `async def`.
* Rewrite CRUD logic:
  - Task fetching for users/admins using async filters.
  - Task creation and updates.
  - Task submissions.
  - Voice file uploads.

#### [MODIFY] [analytics.py (Router)](file:///d:/PT/backend/routers/analytics.py)
* Update endpoint functions to `async def`.
* Rewrite Leaderboard fetching: query all users sorted by XP descending.
* Rewrite Heatmap calculation: query `ActivityLog` documents, aggregate count grouped by date. Since SQLite-specific functions like `func.date()` are not applicable, we can write an aggregation pipeline or group dates in Python/MongoDB query.

---

### [Application Entry Point]

#### [MODIFY] [main.py](file:///d:/PT/backend/main.py)
* Initialize Beanie on startup (`@app.on_event("startup")`) by supplying the Beanie models and starting the motor client.
* Remove SQLAlchemy metadata bindings (`Base.metadata.create_all`).

---

### [Database Seeder]

#### [MODIFY] [seed.py](file:///d:/PT/backend/seed.py)
* Rewrite the script as an asynchronous script that establishes a connection to MongoDB, clears existing collections, and inserts sample data using async inserts (`await user.insert()`, etc.).

---

## Verification Plan

### Automated Tests
* Create a test connection validation script to ensure MongoDB is reachable and correctly initializes collections.
* Verify all backend Swagger paths on `http://127.0.0.1:8000/docs` to check user signup, login, task assignment, status updates, and leaderboard fetching.

### Manual Verification
* Start backend and frontend servers.
* Log in as `admin`, create a task, and verify it saves to MongoDB (using Compass or mongo shell).
* Log in as `alice` on the frontend, check the dashboard heatmap, drag tasks on the Kanban board to verify state mutations update MongoDB correctly.
