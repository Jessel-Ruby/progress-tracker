import models

XP_THRESHOLDS = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 2000,
    7: 4000
}

RANKS = [
    (0, "Beginner"),
    (100, "Contributor"),
    (500, "Active Member"),
    (1000, "Specialist"),
    (2000, "Elite Contributor"),
    (4000, "Team Leader"),
    (8000, "Legend")
]

def calculate_level_and_rank(xp: int):
    level = 1
    for lvl, threshold in XP_THRESHOLDS.items():
        if xp >= threshold:
            level = lvl
        else:
            break
            
    rank = "Beginner"
    for threshold, r in RANKS:
        if xp >= threshold:
            rank = r
        else:
            break
            
    return level, rank

async def award_xp(user_id: str, amount: int, activity_type: str):
    user = await models.User.get(user_id)
    if not user:
        return None
        
    user.xp += amount
    user.level, user.rank = calculate_level_and_rank(user.xp)
    
    user.contribution_score += (amount // 10)
    
    # Log activity
    log = models.ActivityLog(
        user_id=str(user.id),
        activity_type=activity_type,
        points_earned=amount
    )
    await log.insert()
    await user.save()
    return user
