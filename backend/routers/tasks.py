from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from typing import List, Optional
import models, schemas
from core import auth
from utils.upload_validation import validate_audio_upload, validate_document_upload
from utils.cloudinary import upload_to_cloudinary
from services import task_service, submission_service

router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"],
    redirect_slashes=False
)

@router.get("/", response_model=List[schemas.TaskResponse])
async def get_tasks(
    skip: int = 0,
    limit: int = 20,
    department_id: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return await task_service.get_tasks(
        current_user=current_user,
        skip=skip,
        limit=limit,
        department_id=department_id
    )

@router.get("/submissions/pending", response_model=List[schemas.AdminTaskSubmissionResponse])
async def get_pending_submissions(current_user: models.User = Depends(auth.get_current_admin_user)):
    return await submission_service.get_pending_submissions(current_user)

@router.get("/submissions/{submission_id}", response_model=schemas.AdminTaskSubmissionResponse)
async def get_submission(submission_id: str, current_user: models.User = Depends(auth.get_current_admin_user)):
    return await submission_service.get_submission(submission_id, current_user)

@router.post("/submissions/{submission_id}/approve", response_model=schemas.TaskSubmissionResponse)
async def approve_submission(
    submission_id: str,
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    return await submission_service.approve_submission(submission_id, current_user)

@router.post("/submissions/{submission_id}/reject", response_model=schemas.TaskSubmissionResponse)
async def reject_submission(
    submission_id: str,
    reason: str = "rejected",
    review: Optional[schemas.SubmissionReviewUpdate] = Body(None),
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    return await submission_service.reject_submission(submission_id, current_user, reason, review)

@router.post("/", response_model=schemas.TaskResponse)
async def create_task(task: schemas.TaskCreate, current_user: models.User = Depends(auth.get_current_admin_user)):
    return await task_service.create_task(task, str(current_user.id))

@router.get("/{task_id}", response_model=schemas.TaskResponse)
async def get_task(task_id: str, current_user: models.User = Depends(auth.get_current_active_user)):
    task = await task_service.get_task_by_id(task_id, current_user)
    return await task_service.assemble_task_response(task)

@router.put("/{task_id}", response_model=schemas.TaskResponse)
async def update_task(task_id: str, task_update: schemas.TaskUpdate, current_user: models.User = Depends(auth.get_current_active_user)):
    return await task_service.update_task(task_id, task_update, current_user)

@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, current_user: models.User = Depends(auth.get_current_active_user)):
    await task_service.delete_task(task_id, current_user)

@router.post("/{task_id}/voice", response_model=schemas.TaskResponse)
async def upload_voice_note(task_id: str, file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_admin_user)):
    # Verify task exists and user is admin
    await task_service.get_task_by_id(task_id, current_user)
    validate_audio_upload(file)
    file_url = await upload_to_cloudinary(file, "audio")
    return await task_service.add_voice_note(task_id, file_url)

@router.post("/{task_id}/attachments", response_model=schemas.TaskResponse)
async def upload_attachment(task_id: str, file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_admin_user)):
    # Verify task exists and user is admin
    await task_service.get_task_by_id(task_id, current_user)
    validate_document_upload(file)
    file_url = await upload_to_cloudinary(file, "document")
    return await task_service.add_attachment(task_id, file_url)

@router.post("/{task_id}/submit", response_model=schemas.TaskSubmissionResponse)
async def submit_task(
    task_id: str, 
    comment: str = Form(None), 
    file: UploadFile = File(None), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    file_path = None
    if file and file.filename:
        validate_document_upload(file)
        file_path = await upload_to_cloudinary(file, "document")
            
    return await submission_service.submit_task(
        task_id=task_id,
        user_id=str(current_user.id),
        comment=comment,
        file_path=file_path
    )
