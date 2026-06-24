from typing import List, Optional
from fastapi import HTTPException
import models
import schemas
from services.gamification_service import award_xp

async def get_pending_submissions(current_user: models.User) -> List[schemas.AdminTaskSubmissionResponse]:
    """Retrieves all pending submissions visible to the reviewer (HOD for their department, President/VP for all)."""
    if current_user.status != "active":
        return []

    submissions = (
        await models.TaskSubmission.find(models.TaskSubmission.status == "pending")
        .sort(-models.TaskSubmission.submitted_at)
        .to_list()
    )
    results = []
    for submission in submissions:
        task = await models.Task.get(submission.task_id)
        if not task:
            continue
            
        # Scope by role and department
        if not (current_user.is_president or current_user.is_vice_president):
            if current_user.role == "hod":
                if task.department_id != current_user.department_id:
                    continue
            else:
                # Regular members cannot see other users' pending submissions
                continue

        submitter = await models.User.get(submission.user_id)
        results.append(
            schemas.AdminTaskSubmissionResponse(
                **submission.model_dump(exclude={'id'}),
                id=str(submission.id),
                task_title=task.title,
                submitter_username=submitter.username if submitter else "Unknown",
            )
        )
    return results

async def get_submission(submission_id: str, current_user: models.User) -> schemas.AdminTaskSubmissionResponse:
    """Retrieves detailed info for a single submission, enforcing access scopes."""
    submission = await models.TaskSubmission.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    task = await models.Task.get(submission.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Scope access: HOD of the task's department, President/VP, or the submitter themselves
    if not (current_user.is_president or current_user.is_vice_president):
        if current_user.role == "hod":
            if task.department_id != current_user.department_id:
                raise HTTPException(status_code=403, detail="Not authorized to view submissions outside your department")
        elif submission.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to view this submission")

    submitter = await models.User.get(submission.user_id)
    return schemas.AdminTaskSubmissionResponse(
        **submission.model_dump(exclude={'id'}),
        id=str(submission.id),
        task_title=task.title if task else "Unknown Task",
        submitter_username=submitter.username if submitter else "Unknown",
    )

async def approve_submission(submission_id: str, reviewer: models.User) -> schemas.TaskSubmissionResponse:
    """Approves a submission, marks task as completed, and awards XP. Enforces department scope."""
    submission = await models.TaskSubmission.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "pending":
        raise HTTPException(status_code=400, detail="Submission is not pending review")
    
    task = await models.Task.get(submission.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check reviewer permissions
    if not (reviewer.is_president or reviewer.is_vice_president):
        if reviewer.role != "hod" or task.department_id != reviewer.department_id:
            raise HTTPException(status_code=403, detail="Not authorized to approve submissions for this department")

    submission.status = "approved"
    submission.reviewed_by = str(reviewer.id)
    await submission.save()

    task.status = "completed"
    await task.save()

    await award_xp(submission.user_id, 25, "submission_approved")
    return schemas.TaskSubmissionResponse(**submission.model_dump(exclude={'id'}), id=str(submission.id))

async def reject_submission(
    submission_id: str,
    reviewer: models.User,
    reason: str = "rejected",
    review: Optional[schemas.SubmissionReviewUpdate] = None
) -> schemas.TaskSubmissionResponse:
    """Rejects a submission or requests revision, and reverts task to in_progress. Enforces department scope."""
    submission = await models.TaskSubmission.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "pending":
        raise HTTPException(status_code=400, detail="Submission is not pending review")

    task = await models.Task.get(submission.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check reviewer permissions
    if not (reviewer.is_president or reviewer.is_vice_president):
        if reviewer.role != "hod" or task.department_id != reviewer.department_id:
            raise HTTPException(status_code=403, detail="Not authorized to reject submissions for this department")

    submission.status = "revision_requested" if reason == "revision" else "rejected"
    if review and review.feedback:
        submission.feedback = review.feedback
    submission.reviewed_by = str(reviewer.id)
    await submission.save()

    task.status = "in_progress"
    await task.save()

    return schemas.TaskSubmissionResponse(**submission.model_dump(exclude={'id'}), id=str(submission.id))

async def submit_task(
    task_id: str,
    user_id: str,
    comment: Optional[str] = None,
    file_path: Optional[str] = None
) -> schemas.TaskSubmissionResponse:
    """Creates a submission for a task and marks it as in_review."""
    db_task = await models.Task.get(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if db_task.assigned_to != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to submit for this task")

    submission = models.TaskSubmission(
        task_id=task_id,
        user_id=user_id,
        file_path=file_path,
        comment=comment,
        status="pending"
    )
    
    db_task.status = "in_review"
    await db_task.save()
    await submission.insert()
    
    return schemas.TaskSubmissionResponse(**submission.model_dump(exclude={'id'}), id=str(submission.id))

