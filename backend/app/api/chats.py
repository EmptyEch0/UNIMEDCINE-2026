from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import json
from jose import jwt

from app.core.database import get_db
from app.core.config import settings
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_user_or_doctor, get_current_student
from app.services.websocket_manager import manager

router = APIRouter(prefix="/chats", tags=["chats"])

# REST Routes for Chat Management

@router.get("", response_model=List[schemas.ChatResponse])
def get_my_chats(
    db: Session = Depends(get_db),
    current = Depends(get_current_user_or_doctor)
):
    role = current["type"]
    obj = current["obj"]
    
    if role == "student":
        chats = db.query(models.Chat).filter(models.Chat.student_id == obj.id).all()
    else:
        chats = db.query(models.Chat).filter(models.Chat.doctor_id == obj.id).all()
        
    return chats

@router.post("", response_model=schemas.ChatResponse)
def create_chat(
    chat_data: schemas.ChatCreate,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    # Verify doctor exists
    doctor = db.query(models.Doctor).filter(models.Doctor.id == chat_data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    # Check if there is already an active chat between this student and doctor
    existing = db.query(models.Chat).filter(
        models.Chat.student_id == student.id,
        models.Chat.doctor_id == chat_data.doctor_id,
        models.Chat.is_active == True
    ).first()
    
    if existing:
        return existing
        
    # Generate a patient anonymous ID: PAT-XXXX
    import random
    anon_id = f"PAT-{random.randint(10000, 99999)}"
    
    db_chat = models.Chat(
        patient_anon_id=anon_id,
        student_id=student.id,
        doctor_id=chat_data.doctor_id
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@router.get("/{chat_id}/messages", response_model=List[schemas.MessageResponse])
def get_chat_messages(
    chat_id: int,
    db: Session = Depends(get_db),
    current = Depends(get_current_user_or_doctor)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    # Verify authorization
    obj = current["obj"]
    role = current["type"]
    if role == "student" and chat.student_id != obj.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role == "doctor" and chat.doctor_id != obj.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    messages = db.query(models.Message).filter(models.Message.chat_id == chat_id).order_by(models.Message.created_at.asc()).all()
    return messages

# WebSocket Endpoint for Chat & Signaling

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    # Authenticate WebSocket connection
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    client_key = f"{role}_{user_id}"
    await manager.connect(client_key, websocket)
    
    # Toggle doctor status online
    if role == "doctor":
        doctor = db.query(models.Doctor).filter(models.Doctor.id == int(user_id)).first()
        if doctor:
            doctor.is_online = True
            db.commit()

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            msg_type = message_data.get("type")
            chat_id = message_data.get("chat_id")
            
            if not chat_id:
                continue

            # Verify chat exists and user is part of it
            chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
            if not chat:
                continue

            if role == "doctor" and chat.doctor_id != int(user_id):
                continue
            if (role == "student" or role == "admin") and chat.student_id != int(user_id):
                continue

            sender_type = "doctor" if role == "doctor" else "patient"

            if msg_type == "chat_message":
                content = message_data.get("content")
                file_url = message_data.get("file_url")
                
                # Save message to database
                db_msg = models.Message(
                    chat_id=chat_id,
                    sender_type=sender_type,
                    content=content,
                    file_url=file_url
                )
                db.add(db_msg)
                db.commit()
                db.refresh(db_msg)

                # Broadcast to other client
                recipient_key = f"doctor_{chat.doctor_id}" if sender_type == "patient" else f"student_{chat.student_id}"
                broadcast_data = {
                    "type": "chat_message",
                    "id": db_msg.id,
                    "chat_id": chat_id,
                    "sender_type": sender_type,
                    "content": content,
                    "file_url": file_url,
                    "created_at": db_msg.created_at.isoformat(),
                    "is_read": False
                }
                await manager.send_personal_message(broadcast_data, recipient_key)

            elif msg_type == "webrtc_signal":
                # Forward WebRTC signaling (offer, answer, candidate) to the opposite peer
                recipient_key = f"doctor_{chat.doctor_id}" if sender_type == "patient" else f"student_{chat.student_id}"
                signal_payload = {
                    "type": "webrtc_signal",
                    "chat_id": chat_id,
                    "sender_type": sender_type,
                    "signal": message_data.get("signal")
                }
                await manager.send_personal_message(signal_payload, recipient_key)

            elif msg_type == "typing":
                # Forward typing indicator
                recipient_key = f"doctor_{chat.doctor_id}" if sender_type == "patient" else f"student_{chat.student_id}"
                typing_payload = {
                    "type": "typing",
                    "chat_id": chat_id,
                    "sender_type": sender_type,
                    "is_typing": message_data.get("is_typing", False)
                }
                await manager.send_personal_message(typing_payload, recipient_key)

    except WebSocketDisconnect:
        manager.disconnect(client_key)
        # Toggle doctor offline
        if role == "doctor":
            doctor = db.query(models.Doctor).filter(models.Doctor.id == int(user_id)).first()
            if doctor:
                doctor.is_online = False
                db.commit()
    except Exception as e:
        print(f"WS error: {e}")
        manager.disconnect(client_key)
