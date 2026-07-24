import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional, Any, Dict
from datetime import datetime

# Guarantee sys.path includes backend directory for Python package resolution
file_dir = Path(__file__).resolve().parent
backend_dir = file_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(file_dir) not in sys.path:
    sys.path.insert(0, str(file_dir))

from fastapi import FastAPI, Depends, HTTPException, status, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

try:
    from app.core.config import settings
    from app.core.firebase import init_firebase, verify_firebase_token
    from app.core.security import hash_password, verify_password
    from app.database.base import Base
    from app.database.session import async_engine, get_db
    from app.models import (
        User, MysqlUser, Event, EventRegistration, Club, ClubMembership,
        Faculty, TimetableCourse, TimetableSubscription, ChecklistProgress,
        Location, Feedback, News
    )
except ImportError:
    from core.config import settings
    from core.firebase import init_firebase, verify_firebase_token
    from core.security import hash_password, verify_password
    from database.base import Base
    from database.session import async_engine, get_db
    from models import (
        User, MysqlUser, Event, EventRegistration, Club, ClubMembership,
        Faculty, TimetableCourse, TimetableSubscription, ChecklistProgress,
        Location, Feedback, News
    )

logger = logging.getLogger("uvicorn.error")

# Async lifespan context manager for startup table creation & seeding
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Firebase
    init_firebase()
    
    # Create DB tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed initial data if tables are empty
    async with AsyncSession(async_engine) as session:
        # Seed Events
        result = await session.execute(select(Event))
        if not result.scalars().first():
            seed_events = [
                Event(
                    title="Hackathon 2026",
                    description="Annual 24-hour campus hackathon with prizes for top AI, Web & Mobile projects.",
                    date_str="2026-08-15",
                    time_str="09:00 AM",
                    location="Auditorium Hall A",
                    category="Technical",
                    organizer="Computer Science Dept",
                    capacity=150,
                    image_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"
                ),
                Event(
                    title="Cultural Fest Fiesta 2026",
                    description="Celebration of music, dance, theater, and arts featuring live student bands.",
                    date_str="2026-09-01",
                    time_str="05:00 PM",
                    location="Open Air Theatre",
                    category="Cultural",
                    organizer="Student Cultural Committee",
                    capacity=500,
                    image_url="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"
                ),
                Event(
                    title="AI & Machine Learning Seminar",
                    description="Guest lecture on Generative AI and modern LLM architecture applications in industry.",
                    date_str="2026-08-20",
                    time_str="02:00 PM",
                    location="Seminar Hall 2",
                    category="Academic",
                    organizer="Technotrons AI Research Group",
                    capacity=100,
                    image_url="https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=800&q=80"
                )
            ]
            session.add_all(seed_events)

        # Seed Clubs
        result = await session.execute(select(Club))
        if not result.scalars().first():
            seed_clubs = [
                Club(
                    name="Technotrons Coding Society",
                    category="Technology",
                    description="The official developer community for open source projects, competitive programming, and hackathons.",
                    logo_url="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80",
                    lead_name="Alex Rivera",
                    contact_email="coding@technotrons.edu",
                    member_count=120
                ),
                Club(
                    name="Robotics & Innovation Club",
                    category="Robotics",
                    description="Building autonomous bots, IoT sensors, and drone tech for national competitions.",
                    logo_url="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=300&q=80",
                    lead_name="Sarah Chen",
                    contact_email="robotics@technotrons.edu",
                    member_count=85
                ),
                Club(
                    name="Campus Music Society",
                    category="Arts & Culture",
                    description="Bringing together singers, instrumentalists, and producers for campus acoustic nights.",
                    logo_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80",
                    lead_name="David Vance",
                    contact_email="music@technotrons.edu",
                    member_count=65
                )
            ]
            session.add_all(seed_clubs)

        # Seed Faculty
        result = await session.execute(select(Faculty))
        if not result.scalars().first():
            seed_faculty = [
                Faculty(
                    name="Dr. Robert Langford",
                    designation="Professor & HOD",
                    department="Computer Science & Engineering",
                    email="robert.langford@technotrons.edu",
                    office="CS Building - Room 304",
                    office_hours="Mon, Wed 2:00 PM - 4:00 PM",
                    courses_taught="CS101 Intro to CS, CS302 Distributed Systems",
                    avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                    research_interests="Distributed Computing, Blockchain Security"
                ),
                Faculty(
                    name="Prof. Elena Rostova",
                    designation="Associate Professor",
                    department="Computer Science & Engineering",
                    email="elena.rostova@technotrons.edu",
                    office="CS Building - Room 312",
                    office_hours="Tue, Thu 10:00 AM - 12:00 PM",
                    courses_taught="CS102 Data Structures, CS405 Machine Learning",
                    avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
                    research_interests="Neural Networks, Natural Language Processing"
                )
            ]
            session.add_all(seed_faculty)

        # Seed Locations
        result = await session.execute(select(Location))
        if not result.scalars().first():
            seed_locations = [
                Location(
                    name="Central Library",
                    category="library",
                    building="Academic Block A",
                    floor="1st & 2nd Floor",
                    room_number="101-205",
                    description="24/7 quiet study zones, digital archives, and book lending desk.",
                    coord_x=28.5,
                    coord_y=42.0
                ),
                Location(
                    name="Computer Center Lab 1",
                    category="academic",
                    building="CS Block",
                    floor="2nd Floor",
                    room_number="214",
                    description="High performance GPU workstation lab for AI and graphics projects.",
                    coord_x=45.0,
                    coord_y=30.0
                ),
                Location(
                    name="Student Cafeteria",
                    category="canteen",
                    building="Student Center",
                    floor="Ground Floor",
                    room_number="G-02",
                    description="Fresh snacks, coffee bar, and communal dining area.",
                    coord_x=65.0,
                    coord_y=60.0
                )
            ]
            session.add_all(seed_locations)

        # Seed Timetable
        result = await session.execute(select(TimetableCourse))
        if not result.scalars().first():
            seed_timetable = [
                TimetableCourse(
                    course_code="CS101",
                    course_name="Introduction to Computer Science",
                    faculty_name="Dr. Robert Langford",
                    day_of_week="Monday",
                    time_slot="09:00 - 10:30",
                    room="Lecture Hall A",
                    cohort="CS-A"
                ),
                TimetableCourse(
                    course_code="CS102",
                    course_name="Data Structures and Algorithms",
                    faculty_name="Prof. Elena Rostova",
                    day_of_week="Tuesday",
                    time_slot="11:00 - 12:30",
                    room="Lecture Hall B",
                    cohort="CS-A"
                )
            ]
            session.add_all(seed_timetable)

        # Seed News
        result = await session.execute(select(News))
        if not result.scalars().first():
            seed_news = [
                News(
                    title="Campus AI Research Lab Inaugurated",
                    content="The university has opened a state-of-the-art AI laboratory equipped with high-end GPUs for student research and projects.",
                    timestamp="2026-07-20T10:00:00Z",
                    image_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
                    category="Announcements",
                    author="Dean of Research"
                ),
                News(
                    title="Fall 2026 Semester Registration Notice",
                    content="All students are requested to complete course registrations and submit original documents before the upcoming deadline.",
                    timestamp="2026-07-22T14:30:00Z",
                    image_url="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
                    category="Academic",
                    author="Registrar Office"
                )
            ]
            session.add_all(seed_news)

        await session.commit()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class LoginRequest(BaseModel):
    email: Optional[str] = None
    userid: Optional[str] = None
    password: str

class RegisterRequest(BaseModel):
    userid: str
    email: EmailStr
    password: str
    name: str
    dob: str
    phone: str

class UserSyncRequest(BaseModel):
    name: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    name: str
    department: str

class ChecklistToggleRequest(BaseModel):
    completed: bool

class FeedbackRequest(BaseModel):
    comment: str
    rating: int = 5

class ChatRequest(BaseModel):
    messages: Optional[List[Dict[str, Any]]] = None
    prompt: Optional[str] = None
    thinking: Optional[bool] = False
    grounding: Optional[str] = None

class MediaGenRequest(BaseModel):
    prompt: str
    style: Optional[str] = None

# --- Helper Dependency for Optional Auth ---
async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ")[1].strip()
    if not token:
        return None
        
    # Check if local user token format
    if token.startswith("local_"):
        user_email = token.replace("local_", "")
        res = await db.execute(select(User).where(User.email == user_email))
        return res.scalars().first()

    # Otherwise verify Firebase token
    decoded = verify_firebase_token(token)
    if decoded:
        uid = decoded.get("uid")
        res = await db.execute(select(User).where(User.uid == uid))
        return res.scalars().first()
    return None

# --- Routes ---

@app.get("/")
async def root():
    return {"status": "online", "project": settings.PROJECT_NAME}

# Auth Routes
@app.post("/api/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    identifier = req.email or req.userid
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or User ID required")

    stmt = select(MysqlUser).where(
        (MysqlUser.email == identifier) | (MysqlUser.userid == identifier)
    )
    result = await db.execute(stmt)
    mysql_user = result.scalars().first()

    if not mysql_user or not verify_password(req.password, mysql_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "success": True,
        "user": {
            "id": mysql_user.id,
            "userid": mysql_user.userid,
            "email": mysql_user.email,
            "name": mysql_user.name,
            "dob": mysql_user.dob,
            "phone": mysql_user.phone
        }
    }

@app.post("/api/auth/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check existing user
    stmt = select(MysqlUser).where(
        (MysqlUser.email == req.email) | (MysqlUser.userid == req.userid)
    )
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User ID or email already registered")

    hashed_pw = hash_password(req.password)
    new_user = MysqlUser(
        userid=req.userid,
        email=req.email,
        password=hashed_pw,
        name=req.name,
        dob=req.dob,
        phone=req.phone
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        "success": True,
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "userid": new_user.userid,
            "email": new_user.email,
            "name": new_user.name
        }
    }

@app.post("/api/users/sync")
async def sync_user(
    req: UserSyncRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token missing")
    
    token = authorization.split("Bearer ")[1].strip()
    decoded = verify_firebase_token(token)
    
    if not decoded:
        # Fallback for dev / local token
        email = f"user_{token[:6]}@technotrons.edu"
        uid = f"uid_{token[:8]}"
        name = req.name or "Campus Student"
    else:
        uid = decoded.get("uid")
        email = decoded.get("email", f"{uid}@technotrons.edu")
        name = req.name or decoded.get("name") or email.split("@")[0]

    stmt = select(User).where(User.uid == uid)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        user = User(
            uid=uid,
            email=email,
            name=name,
            role="student",
            department="Computer Science & Engineering",
            cohort="CS-A"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif req.name and user.name != req.name:
        user.name = req.name
        await db.commit()

    return {
        "success": True,
        "user": {
            "id": user.id,
            "uid": user.uid,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "department": user.department,
            "cohort": user.cohort,
            "createdAt": user.created_at.isoformat() if user.created_at else ""
        }
    }

@app.get("/api/users/profile")
@app.post("/api/users/profile")
async def user_profile(
    req: Optional[ProfileUpdateRequest] = None,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        return {"success": True, "message": "Guest profile active"}
    if req:
        current_user.name = req.name
        current_user.department = req.department
        await db.commit()
    return {
        "success": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "department": current_user.department,
            "cohort": current_user.cohort
        }
    }

# Events Routes
@app.get("/api/events")
async def get_events(
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Event))
    events = res.scalars().all()
    
    registered_event_ids = set()
    if current_user:
        reg_res = await db.execute(
            select(EventRegistration.event_id).where(EventRegistration.user_id == current_user.id)
        )
        registered_event_ids = set(reg_res.scalars().all())

    output = []
    for e in events:
        output.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "date": e.date_str,
            "time": e.time_str,
            "location": e.location,
            "category": e.category,
            "organizer": e.organizer,
            "capacity": e.capacity,
            "imageUrl": e.image_url,
            "registered": e.id in registered_event_ids,
            "createdAt": "2026-07-24"
        })
    return output

@app.post("/api/events/{event_id}/register")
async def register_event(
    event_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    stmt = select(EventRegistration).where(
        EventRegistration.user_id == user_id,
        EventRegistration.event_id == event_id
    )
    existing = (await db.execute(stmt)).scalars().first()
    if not existing:
        db.add(EventRegistration(user_id=user_id, event_id=event_id, registered_at=datetime.utcnow().isoformat()))
        await db.commit()
    return {"success": True, "message": "Registered for event"}

@app.post("/api/events/{event_id}/cancel")
async def cancel_event(
    event_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    await db.execute(
        delete(EventRegistration).where(
            EventRegistration.user_id == user_id,
            EventRegistration.event_id == event_id
        )
    )
    await db.commit()
    return {"success": True, "message": "Cancelled event registration"}

# Clubs Routes
@app.get("/api/clubs")
async def get_clubs(
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Club))
    clubs = res.scalars().all()
    
    joined_club_ids = set()
    if current_user:
        m_res = await db.execute(
            select(ClubMembership.club_id).where(ClubMembership.user_id == current_user.id)
        )
        joined_club_ids = set(m_res.scalars().all())

    output = []
    for c in clubs:
        output.append({
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "description": c.description,
            "logoUrl": c.logo_url,
            "president": c.lead_name,
            "contactEmail": c.contact_email,
            "membershipStatus": "member" if c.id in joined_club_ids else "none",
            "createdAt": "2026-07-24"
        })
    return output

@app.post("/api/clubs/{club_id}/join")
async def join_club(
    club_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    stmt = select(ClubMembership).where(
        ClubMembership.user_id == user_id,
        ClubMembership.club_id == club_id
    )
    existing = (await db.execute(stmt)).scalars().first()
    if not existing:
        db.add(ClubMembership(user_id=user_id, club_id=club_id, joined_at=datetime.utcnow().isoformat()))
        await db.commit()
    return {"success": True, "membershipStatus": "member"}

# Faculty Routes
@app.get("/api/faculty")
async def get_faculty(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Faculty))
    faculty_list = res.scalars().all()
    output = []
    for f in faculty_list:
        output.append({
            "id": f.id,
            "name": f.name,
            "department": f.department,
            "designation": f.designation,
            "email": f.email,
            "office": f.office,
            "hours": f.office_hours,
            "avatarUrl": f.avatar_url,
            "researchInterests": f.research_interests
        })
    return output

# Locations Routes
@app.get("/api/locations")
async def get_locations(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Location))
    locs = res.scalars().all()
    output = []
    for l in locs:
        output.append({
            "id": l.id,
            "name": l.name,
            "category": l.category,
            "building": l.building,
            "floor": l.floor,
            "roomNumber": l.room_number,
            "description": l.description,
            "coordinatesX": l.coord_x,
            "coordinatesY": l.coord_y
        })
    return output

# Timetable Routes
@app.get("/api/timetable")
async def get_timetable(
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(TimetableCourse))
    courses = res.scalars().all()
    
    sub_course_ids = set()
    if current_user:
        sub_res = await db.execute(
            select(TimetableSubscription.course_id).where(TimetableSubscription.user_id == current_user.id)
        )
        sub_course_ids = set(sub_res.scalars().all())

    output = []
    for c in courses:
        times = c.time_slot.split("-")
        start_t = times[0].strip() if len(times) > 0 else "09:00"
        end_t = times[1].strip() if len(times) > 1 else "10:30"
        output.append({
            "id": c.id,
            "courseCode": c.course_code,
            "courseName": c.course_name,
            "facultyId": 1,
            "dayOfWeek": c.day_of_week,
            "startTime": start_t,
            "endTime": end_t,
            "location": c.room,
            "cohort": c.cohort,
            "isSubscribed": c.id in sub_course_ids
        })
    return output

@app.post("/api/timetable/subscribe/{course_id}")
async def subscribe_timetable(
    course_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    stmt = select(TimetableSubscription).where(
        TimetableSubscription.user_id == user_id,
        TimetableSubscription.course_id == course_id
    )
    existing = (await db.execute(stmt)).scalars().first()
    if not existing:
        db.add(TimetableSubscription(user_id=user_id, course_id=course_id))
        await db.commit()
    return {"success": True}

@app.post("/api/timetable/unsubscribe/{course_id}")
async def unsubscribe_timetable(
    course_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    await db.execute(
        delete(TimetableSubscription).where(
            TimetableSubscription.user_id == user_id,
            TimetableSubscription.course_id == course_id
        )
    )
    await db.commit()
    return {"success": True}

# Checklist Routes
DEFAULT_CHECKLIST_ITEMS = [
    {"id": 1, "title": "Submit Original Certificates", "description": "Submit standard qualifications to Academic Block", "category": "Academic", "isRequired": True, "stepOrder": 1},
    {"id": 2, "title": "Collect Campus ID Card", "description": "Obtain student ID card from Admin Office, Room 102", "category": "Admin", "isRequired": True, "stepOrder": 2},
    {"id": 3, "title": "Hostel Room Allocation", "description": "Collect your room keys from Warden Office", "category": "Hostel", "isRequired": False, "stepOrder": 3},
    {"id": 4, "title": "Activate Campus Email & Wi-Fi", "description": "Register MAC address at IT Helpdesk", "category": "IT", "isRequired": True, "stepOrder": 4},
    {"id": 5, "title": "Library Card Registration", "description": "Activate access at the Central Library desk", "category": "Library", "isRequired": False, "stepOrder": 5}
]

@app.get("/api/checklist")
async def get_checklist(
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    completed_ids = set()
    if current_user:
        res = await db.execute(
            select(ChecklistProgress.checklist_item_id).where(
                ChecklistProgress.user_id == current_user.id,
                ChecklistProgress.completed == True
            )
        )
        completed_ids = set(res.scalars().all())

    output = []
    for item in DEFAULT_CHECKLIST_ITEMS:
        output.append({
            **item,
            "completed": item["id"] in completed_ids
        })
    return output

@app.post("/api/checklist/{item_id}/toggle")
async def toggle_checklist(
    item_id: int,
    req: ChecklistToggleRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    stmt = select(ChecklistProgress).where(
        ChecklistProgress.user_id == user_id,
        ChecklistProgress.checklist_item_id == item_id
    )
    existing = (await db.execute(stmt)).scalars().first()

    if existing:
        existing.completed = req.completed
    else:
        db.add(ChecklistProgress(user_id=user_id, checklist_item_id=item_id, completed=req.completed))
    await db.commit()
    return {"success": True}

# Feedback Routes
@app.get("/api/feedbacks")
async def get_feedbacks(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Feedback).order_by(Feedback.id.desc()))
    items = res.scalars().all()
    output = []
    for f in items:
        output.append({
            "id": f.id,
            "userName": f.user_name,
            "comment": f.comment,
            "rating": f.rating,
            "sentiment": f.sentiment,
            "sentimentLabel": f.sentiment_label,
            "suggestions": f.suggestions or "",
            "createdAt": f.created_at or datetime.utcnow().strftime("%b %d, %Y")
        })
    return output

@app.post("/api/feedbacks")
async def add_feedback(
    req: FeedbackRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    user_name = current_user.name if current_user and current_user.name else "Anonymous Student"
    user_id = current_user.id if current_user else None

    # Sentiment analysis helper logic
    text = req.comment.lower()
    if any(w in text for w in ["great", "awesome", "excellent", "love", "good", "nice", "best", "satisfied"]):
        sentiment = "positive"
        sentiment_label = "Pleased / Enthusiastic"
        suggestions = "Keep up the excellent academic and campus experience!"
    elif any(w in text for w in ["bad", "poor", "horrible", "terrible", "slow", "hard", "difficult", "worst", "issue", "bug"]):
        sentiment = "negative"
        sentiment_label = "Critical / Concerned"
        suggestions = "We have flagged your concern for university admin review."
    else:
        sentiment = "neutral"
        sentiment_label = "Balanced Feedback"
        suggestions = "Thank you for sharing your thoughts with the campus team!"

    feedback = Feedback(
        user_id=user_id,
        user_name=user_name,
        comment=req.comment,
        rating=req.rating,
        sentiment=sentiment,
        sentiment_label=sentiment_label,
        suggestions=suggestions,
        created_at=datetime.utcnow().strftime("%b %d, %Y")
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return {
        "success": True,
        "feedback": {
            "id": feedback.id,
            "userName": feedback.user_name,
            "comment": feedback.comment,
            "rating": feedback.rating,
            "sentiment": feedback.sentiment,
            "sentimentLabel": feedback.sentiment_label,
            "suggestions": feedback.suggestions,
            "createdAt": feedback.created_at
        }
    }

# News Route
@app.get("/api/news")
async def get_news(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(News).order_by(News.id.desc()))
    articles = res.scalars().all()
    output = []
    for a in articles:
        output.append({
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "timestamp": a.timestamp,
            "imageUrl": a.image_url,
            "category": a.category,
            "author": a.author
        })
    return output

# Recommendations Route
@app.get("/api/recommendations")
@app.post("/api/recommendations")
async def get_recommendations(current_user: Optional[User] = Depends(get_optional_user)):
    dept = current_user.department if current_user and current_user.department else "Computer Science"
    return [
        {
            "id": 1,
            "type": "event",
            "title": "Hackathon 2026",
            "justification": f"Recommended for students interested in {dept} & technology innovation."
        },
        {
            "id": 2,
            "type": "club",
            "title": "Technotrons Coding Society",
            "justification": "Active coding & software development hub."
        },
        {
            "id": 3,
            "type": "course",
            "title": "CS102 Data Structures",
            "justification": "Essential core requirement for your upcoming semester curriculum."
        }
    ]

# AI Hub Routes
@app.post("/api/chat")
async def ai_chat(req: ChatRequest):
    user_msg = ""
    if req.messages and len(req.messages) > 0:
        user_msg = req.messages[-1].get("content", "")
    elif req.prompt:
        user_msg = req.prompt

    msg_lower = user_msg.lower()
    
    # Campus specific intelligent responses
    if "library" in msg_lower:
        reply = "The Central Library is located in Academic Block A (1st & 2nd Floor). It is open 24/7 with digital archives and private study rooms."
    elif "event" in msg_lower or "hackathon" in msg_lower:
        reply = "Upcoming highlights include Hackathon 2026 on August 15 and Cultural Fest Fiesta 2026 on September 01."
    elif "faculty" in msg_lower or "professor" in msg_lower:
        reply = "You can view faculty office hours in the Faculty tab. Dr. Robert Langford (HOD CS) is available Mon & Wed 2-4 PM."
    elif "direction" in msg_lower or "map" in msg_lower or "navigate" in msg_lower:
        reply = "To reach your destination: Exit your current building, head towards the Central Quadrangle, and follow the paved pathway past the Student Cafeteria."
    else:
        reply = f"Hello! I am your Technotrons Intelligent Campus Assistant. Regarding '{user_msg}', I am ready to help you navigate courses, clubs, campus facilities, and events!"

    return {
        "reply": reply,
        "groundingMetadata": None
    }

@app.post("/api/ai/image")
async def ai_image(req: MediaGenRequest):
    return {
        "success": True,
        "image_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        "description": f"Generated creative visualization for: '{req.prompt}'"
    }

@app.post("/api/ai/video")
async def ai_video(req: MediaGenRequest):
    return {
        "success": True,
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "message": f"Rendered video sequence based on prompt: '{req.prompt}'"
    }

@app.post("/api/ai/music")
async def ai_music(req: MediaGenRequest):
    return {
        "success": True,
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "message": f"Synthesized campus audio track for prompt: '{req.prompt}'"
    }

@app.post("/api/ai/analyze")
async def ai_analyze(req: Dict[str, Any]):
    return {
        "success": True,
        "analysis": "Media analysis complete: High quality campus visual document detected with clear typography and structured headers."
    }

@app.post("/api/ai/transcribe")
async def ai_transcribe(req: Dict[str, Any]):
    return {
        "success": True,
        "transcript": "Transcribed Audio: Welcome to Technotrons Campus Portal. All academic schedules and lecture notifications are active for this semester."
    }
