from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from typing import List, Optional
import models, schemas, auth, gamification
from upload_validation import validate_audio_upload, validate_document_upload
from cloudinary_storage import upload_to_cloudinary

router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"],
    redirect_slashes=False
)

@router.get("/", response_model=List[schemas.TaskResponse])
async def get_tasks(skip: int = 0, limit: int = 20, current_user: models.User = Depends(auth.get_current_active_user)):
    # Simple logic: users see tasks assigned to them. Admins see all.
    if current_user.role == "admin":
        tasks = await models.Task.find().skip(skip).limit(limit).to_list()
    else:
        tasks = await models.Task.find(models.Task.assigned_to == str(current_user.id)).skip(skip).limit(limit).to_list()
    
    task_responses = []
    for t in tasks:
        submissions = await models.TaskSubmission.find(models.TaskSubmission.task_id == str(t.id)).to_list()
        task_responses.append(
            schemas.TaskResponse(
                **t.model_dump(exclude={'id'}),
                id=str(t.id),
                submissions=[schemas.TaskSubmissionResponse(**{**s.model_dump(exclude={'id'}), 'id': str(s.id)}) for s in submissions]
            )
        )
    return task_responses

@router.get("/submissions/pending", response_model=List[schemas.AdminTaskSubmissionResponse])
async def get_pending_submissions(current_user: models.User = Depends(auth.get_current_admin_user)):
    submissions = (
        await models.TaskSubmission.find(models.TaskSubmission.status == "pending")
        .sort(-models.TaskSubmission.submitted_at)
        .to_list()
    )
    results = []
    for submission in submissions:
        task = await models.Task.get(submission.task_id)
        submitter = await models.User.get(submission.user_id)
        results.append(
            schemas.AdminTaskSubmissionResponse(
                **submission.model_dump(exclude={'id'}),
                id=str(submission.id),
                task_title=task.title if task else "Unknown Task",
                submitter_username=submitter.username if submitter else "Unknown",
            )
        )
    return results

@router.post("/submissions/{submission_id}/approve", response_model=schemas.TaskSubmissionResponse)
async def approve_submission(
    submission_id: str,
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    submission = await models.TaskSubmission.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "pending":
        raise HTTPException(status_code=400, detail="Submission is not pending review")

    submission.status = "approved"
    await submission.save()

    task = await models.Task.get(submission.task_id)
    if task:
        task.status = "completed"
        await task.save()

    await gamification.award_xp(submission.user_id, 25, "submission_approved")
    return schemas.TaskSubmissionResponse(**submission.model_dump(exclude={'id'}), id=str(submission.id))

@router.post("/submissions/{submission_id}/reject", response_model=schemas.TaskSubmissionResponse)
async def reject_submission(
    submission_id: str,
    review: Optional[schemas.SubmissionReviewUpdate] = Body(None),
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    submission = await models.TaskSubmission.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "pending":
        raise HTTPException(status_code=400, detail="Submission is not pending review")

    submission.status = "rejected"
    if review and review.feedback:
        submission.feedback = review.feedback
    await submission.save()

    task = await models.Task.get(submission.task_id)
    if task:
        task.status = "in_progress"
        await task.save()

    return schemas.TaskSubmissionResponse(**submission.model_dump(exclude={'id'}), id=str(submission.id))

@router.post("/", response_model=schemas.TaskResponse)
async def create_task(task: schemas.TaskCreate, current_user: models.User = Depends(auth.get_current_admin_user)):
    db_task = models.Task(**task.model_dump(), assigned_by=str(current_user.id))
    await db_task.insert()
    return schemas.TaskResponse(**db_task.model_dump(exclude={'id'}), id=str(db_task.id), submissions=[])

@router.get("/{task_id}", response_model=schemas.TaskResponse)
async def get_task(task_id: str, current_user: models.User = Depends(auth.get_current_active_user)):
    task = await models.Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role != "admin" and task.assigned_to != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    submissions = await models.TaskSubmission.find(models.TaskSubmission.task_id == task_id).to_list()
    return schemas.TaskResponse(
        **task.model_dump(exclude={'id'}),
        id=str(task.id),
        submissions=[schemas.TaskSubmissionResponse(**s.model_dump(exclude={'id'}), id=str(s.id)) for s in submissions]
    )

@router.put("/{task_id}", response_model=schemas.TaskResponse)
async def update_task(task_id: str, task_update: schemas.TaskUpdate, current_user: models.User = Depends(auth.get_current_active_user)):
    db_task = await models.Task.get(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Only admins can update anything. Users can only update status.
    update_data = task_update.model_dump(exclude_unset=True)
    if current_user.role != "admin":
        # Check if user is trying to change anything other than status
        allowed_keys = {"status"}
        if any(k not in allowed_keys for k in update_data.keys()):
            raise HTTPException(status_code=403, detail="Not authorized to update task details other than status")
    
    for key, value in update_data.items():
        setattr(db_task, key, value)

    await db_task.save()
    
    submissions = await models.TaskSubmission.find(models.TaskSubmission.task_id == task_id).to_list()
    return schemas.TaskResponse(
        **db_task.model_dump(exclude={'id'}),
        id=str(db_task.id),
        submissions=[schemas.TaskSubmissionResponse(**s.model_dump(exclude={'id'}), id=str(s.id)) for s in submissions]
    )

@router.post("/{task_id}/voice", response_model=schemas.TaskResponse)
async def upload_voice_note(task_id: str, file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_task = await models.Task.get(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    validate_audio_upload(file)
    db_task.voice_note_path = await upload_to_cloudinary(file, "audio")
    await db_task.save()
    
    submissions = await models.TaskSubmission.find(models.TaskSubmission.task_id == task_id).to_list()
    return schemas.TaskResponse(
        **db_task.model_dump(exclude={'id'}),
        id=str(db_task.id),
        submissions=[schemas.TaskSubmissionResponse(**s.model_dump(exclude={'id'}), id=str(s.id)) for s in submissions]
    )

@router.post("/{task_id}/submit", response_model=schemas.TaskSubmissionResponse)
async def submit_task(
    task_id: str, 
    comment: str = Form(None), 
    file: UploadFile = File(None), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_task = await models.Task.get(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if db_task.assigned_to != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to submit for this task")

    file_path = None
    if file and file.filename:
        validate_document_upload(file)
        file_path = await upload_to_cloudinary(file, "document")
            
    submission = models.TaskSubmission(
        task_id=task_id,
        user_id=str(current_user.id),
        file_path=file_path,
        comment=comment,
        status="pending"
    )
    
    # Auto-update task status
    db_task.status = "in_review"
    await db_task.save()
    
    await submission.insert()
    return submission
