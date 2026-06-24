# Progress Tracker

A beautiful dashboard-driven application to track progress, activities, and tasks, with full gamification features (XP, levels, and streak tracking).

## Technology Stack

- **Backend**: FastAPI, MongoDB (via Beanie ODM and Motor), Pydantic v2.
- **Frontend**: Vite, React, TailwindCSS v4, Zustand.

## Setup & Running

### Backend

1. Navigate to `backend/`
2. Create/activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in the values:
   - `MONGODB_URL`: Your MongoDB connection string.
   - `SECRET_KEY`: A secure random secret key.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary API credentials.
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend

1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Maintenance & Database Scripts

All maintenance scripts are located in `backend/scripts/` and should be executed as python modules from the `backend/` directory:

- **Seed Database**:
  ```bash
  python -m scripts.seed
  ```
- **Cleanup Test Users**:
  ```bash
  python -m scripts.cleanup_users          # Dry run
  python -m scripts.cleanup_users --confirm # Execute
  ```
- **Clear Tasks**:
  ```bash
  python -m scripts.clear_tasks          # Dry run
  python -m scripts.clear_tasks --confirm # Execute
  ```
- **Clear and Reseed**:
  ```bash
  python -m scripts.clear_and_reseed
  ```
- **Reset Admin User (pgtracker)**:
  ```bash
  python -m scripts.reset_user
  ```

---

## Deployment Notes

Before deploying the application to production, make sure to configure the following settings:

1. **Secret Key**: Set a strong, random `SECRET_KEY` environment variable on your backend server. Avoid using the default fallback.
2. **Database Credentials**: Configure `MONGODB_URL` to point to your production MongoDB database. Do not commit database passwords or credentials to version control.
3. **Frontend API URL**: In the frontend's `.env` file, set `VITE_API_URL` to the URL of your deployed backend service.
4. **CORS Settings**: In the backend's environment configuration, specify `CORS_ORIGINS` to only allow requests from your production frontend domain.