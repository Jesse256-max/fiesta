try:
    from app.database.base import Base
    from app.models.user import User, MysqlUser
    from app.models.event import Event, EventRegistration
    from app.models.club import Club, ClubMembership
    from app.models.faculty import Faculty
    from app.models.timetable import TimetableCourse, TimetableSubscription
    from app.models.checklist import ChecklistProgress
    from app.models.location import Location
    from app.models.feedback import Feedback
    from app.models.news import News
except ImportError:
    from ..database.base import Base
    from .user import User, MysqlUser
    from .event import Event, EventRegistration
    from .club import Club, ClubMembership
    from .faculty import Faculty
    from .timetable import TimetableCourse, TimetableSubscription
    from .checklist import ChecklistProgress
    from .location import Location
    from .feedback import Feedback
    from .news import News

__all__ = [
    "Base",
    "User",
    "MysqlUser",
    "Event",
    "EventRegistration",
    "Club",
    "ClubMembership",
    "Faculty",
    "TimetableCourse",
    "TimetableSubscription",
    "ChecklistProgress",
    "Location",
    "Feedback",
    "News"
]
