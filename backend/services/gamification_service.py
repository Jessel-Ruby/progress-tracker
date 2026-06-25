import models

XP_THRESHOLDS = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 2000,
    7: 4000,
    8: 7000,
    9: 11000,
    10: 16000,
    11: 22000,
    12: 30000,
    13: 40000,
    14: 52000,
    15: 67000,
    16: 85000,
    17: 107000,
    18: 133000,
    19: 164000,
    20: 200000
}

def calculate_level(xp: int) -> int:
    level = 1
    for lvl, threshold in XP_THRESHOLDS.items():
        if xp >= threshold:
            level = lvl
        else:
            break
    return level

async def award_xp(user_id: str, amount: int, activity_type: str):
    user = await models.User.get(user_id)
    if not user:
        return None
        
    user.xp += amount
    user.level = calculate_level(user.xp)
    
    # Log activity
    log = models.ActivityLog(
        user_id=str(user.id),
        activity_type=activity_type,
        points_earned=amount
    )
    await log.insert()
    await user.save()
    return user
