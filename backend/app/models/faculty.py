from typing import Optional
from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

try:
    from app.database.base import Base
except ImportError:
    from ..database.base import Base

class Faculty(Base):
    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    office: Mapped[str] = mapped_column(String(255), nullable=False)
    office_hours: Mapped[str] = mapped_column(String(255), nullable=False)
    courses_taught: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    research_interests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
