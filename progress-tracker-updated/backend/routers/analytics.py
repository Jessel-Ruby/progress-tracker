from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime, timedelta
import models, auth

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


@router.get("/achievements")
async def get_user_achievements(current_user: models.User = Depends(auth.get_current_active_user)):
    # Find all UserAchievement for this user
    user_achievements = await models.UserAchievement.find(
        models.UserAchievement.user_id == str(current_user.id)
    ).to_list()
    if not user_achievements:
        return []
    achievement_ids = [ua.achievement_id for ua in user_achievements]
    achievements = await models.Achievement.find(
        models.Achievement.id.in_(achievement_ids)
    ).to_list()
    # Map achievement_id -> earned_at
    earned_map = {ua.achievement_id: ua.earned_at for ua in user_achievements}
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "description": a.description,
            "badge_icon": a.badge_icon,
            "xp_reward": a.xp_reward,
            "earned_at": earned_map.get(str(a.id)),
        }
        for a in achievements
    ]


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    users = await models.User.find().sort(-models.User.xp).limit(limit).to_list()
    return [
        {"username": u.username, "xp": u.xp, "level": u.level, "rank": u.rank, "streak": u.streak}
        for u in users
    ]


@router.get("/heatmap")
async def get_contribution_heatmap(
    user_id: str = None,
    current_user: models.User = Depends(auth.get_current_active_user)
):
    target_user_id = user_id if user_id else str(current_user.id)

    # Get last 365 days of activity
    one_year_ago = datetime.utcnow() - timedelta(days=365)

    pipeline = [
        {
            "$match": {
                "user_id": target_user_id,
                "created_at": {"$gte": one_year_ago}
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at"
                    }
                },
                "count": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "date": "$_id",
                "count": 1
            }
        },
        {
            "$sort": {"date": 1}
        }
    ]

    heatmap_data = await models.ActivityLog.aggregate(pipeline).to_list()
    return heatmap_data
