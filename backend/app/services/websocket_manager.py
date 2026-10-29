from typing import Dict, List
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # Maps user identifier to WebSocket
        # User identifier can be "student_<user_id>" or "doctor_<doctor_id>"
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, key: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[key] = websocket

    def disconnect(self, key: str):
        if key in self.active_connections:
            del self.active_connections[key]

    async def send_personal_message(self, message: dict, key: str):
        if key in self.active_connections:
            await self.active_connections[key].send_json(message)

    async def send_to_chat(self, chat_id: int, message: dict, sender_key: str):
        # Broadcasts a message to the target audience (recipient in the same chat)
        # We broadcast to both the student and doctor of this chat
        for key, ws in list(self.active_connections.items()):
            if key != sender_key:
                try:
                    await ws.send_json(message)
                except Exception:
                    # Connection might be dead
                    self.disconnect(key)

manager = ConnectionManager()
