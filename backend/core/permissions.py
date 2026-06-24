from models.user import User
from models.task import Task

def can_view_task(user: User, task: Task) -> bool:
    """
    Members see only their assigned tasks.
    HODs see tasks in their department.
    President/VP can view tasks across all departments.
    """
    if user.status != "active":
        return False
    if user.is_president or user.is_vice_president:
        return True
    if task.assigned_to == str(user.id):
        return True
    if user.role == "hod" and user.department_id and user.department_id == task.department_id:
        return True
    return False

def can_edit_task(user: User, task: Task) -> bool:
    """
    HODs can edit/modify/delete tasks within their own department only.
    President/VP have global read-only access and cannot edit tasks.
    Members cannot edit tasks.
    """
    if user.status != "active":
        return False
    # President/VP are read-only across all departments — must check before role
    if user.is_president or user.is_vice_president:
        return False
    if user.role == "hod" and user.department_id and user.department_id == task.department_id:
        return True
    return False

def can_view_department(user: User, department_id: str) -> bool:
    """
    HODs and members can view their own department.
    President/VP can view any department.
    """
    if user.status != "active":
        return False
    if user.is_president or user.is_vice_president:
        return True
    return user.department_id == department_id

def can_approve_signups(user: User) -> bool:
    """
    Only active President and VP can approve new signups.
    """
    if user.status != "active":
        return False
    return user.is_president or user.is_vice_president

def is_active(user: User) -> bool:
    return user.status == "active"
