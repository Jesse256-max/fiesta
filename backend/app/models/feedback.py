from typing import Optional
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

try:
    from app.database.base import Base
except ImportError:
    from ..database.base import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    user_name: Mapped[str] = mapped_column(String(255), default="Anonymous Student")
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, default=5)
    sentiment: Mapped[str] = mapped_column(String(50), default="positive")
    sentiment_label: Mapped[str] = mapped_column(String(100), default="Pleased")
    suggestions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
