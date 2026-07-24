from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

try:
    from app.database.base import Base
except ImportError:
    from ..database.base import Base

class TimetableCourse(Base):
    __tablename__ = "timetable_courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    course_code: Mapped[str] = mapped_column(String(50), nullable=False)
    course_name: Mapped[str] = mapped_column(String(255), nullable=False)
    faculty_name: Mapped[str] = mapped_column(String(255), nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(50), nullable=False)
    time_slot: Mapped[str] = mapped_column(String(100), nullable=False)
    room: Mapped[str] = mapped_column(String(100), nullable=False)
    cohort: Mapped[str] = mapped_column(String(50), default="CS-A")

class TimetableSubscription(Base):
    __tablename__ = "timetable_subscriptions"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_user_timetable_course"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("timetable_courses.id"), nullable=False)
