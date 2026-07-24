from sqlalchemy import String, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

try:
    from app.database.base import Base
except ImportError:
    from ..database.base import Base

class ChecklistProgress(Base):
    __tablename__ = "checklist_progress"
    __table_args__ = (UniqueConstraint("user_id", "checklist_item_id", name="uq_user_checklist_item"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    checklist_item_id: Mapped[int] = mapped_column(Integer, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
