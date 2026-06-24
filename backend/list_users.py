import asyncio, sys
sys.path.insert(0, '.')
from core.config import MONGODB_URL, DATABASE_NAME
import motor.motor_asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users = await db['User'].find(
        {},
        {'username': 1, 'email': 1, 'role': 1, 'is_president': 1, 'is_vice_president': 1, 'status': 1, 'department_id': 1}
    ).to_list(length=500)

    print(f"\n{'='*80}")
    print(f"  TOTAL USERS: {len(users)}")
    print(f"{'='*80}")

    presidents = [u for u in users if u.get('is_president')]
    vps        = [u for u in users if u.get('is_vice_president')]
    hods       = [u for u in users if u.get('role') == 'hod' and not u.get('is_president') and not u.get('is_vice_president')]
    members    = [u for u in users if u.get('role') == 'member']
    admins     = [u for u in users if u.get('role') == 'admin']

    def print_group(title, group):
        print(f"\n--- {title} ({len(group)}) ---")
        if not group:
            print("  (none)")
        for u in group:
            dept = u.get('department_id') or '—'
            status = u.get('status', '?')
            print(f"  username={u.get('username','?')!r:25} email={u.get('email','?')!r:40} status={status!r:10} dept={dept!r}")

    print_group("PRESIDENTS", presidents)
    print_group("VICE PRESIDENTS", vps)
    print_group("HODs", hods)
    print_group("MEMBERS", members)
    print_group("ADMINS", admins)

    print(f"\n{'='*80}\n")
    client.close()

asyncio.run(main())
