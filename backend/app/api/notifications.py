from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_user_or_doctor

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _get_recipient_filter(db: Session, current: dict):
    role = current["type"]
    obj = current["obj"]
    if role == "doctor":
        return (models.Notification.recipient_type == "doctor",
                models.Notification.recipient_id == obj.id)
    else:
        return (models.Notification.recipient_type == "student",
                models.Notification.recipient_id == obj.id)


@router.get("", response_model=List[schemas.NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    f = _get_recipient_filter(db, current)
    return db.query(models.Notification).filter(*f).order_by(
        models.Notification.created_at.desc()
    ).limit(50).all()


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    f = _get_recipient_filter(db, current)
    count = db.query(models.Notification).filter(*f,
        models.Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.patch("/{notif_id}/read", response_model=schemas.NotificationResponse)
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    f = _get_recipient_filter(db, current)
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id, *f
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif


@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    f = _get_recipient_filter(db, current)
    db.query(models.Notification).filter(*f).update({"is_read": True})
    db.commit()
    return {"detail": "All notifications marked as read"}


@router.delete("/{notif_id}")
def delete_notification(
    notif_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    f = _get_recipient_filter(db, current)
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id, *f
    ).first()
    if notif:
        db.delete(notif)
        db.commit()
    return {"detail": "Deleted"}


# ─── Helper used by other routers ────────────────────────────────────────────

def create_notification(
    db: Session,
    recipient_type: str,
    recipient_id: int,
    title: str,
    message: str,
    notif_type: str = "general"
):
    notif = models.Notification(
        recipient_type=recipient_type,
        recipient_id=recipient_id,
        title=title,
        message=message,
        notif_type=notif_type
    )
    db.add(notif)
    db.commit()
