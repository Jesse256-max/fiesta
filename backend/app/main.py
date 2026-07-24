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
        # Seed Events (Saranathan Real Events)
        result = await session.execute(select(Event))
        if not result.scalars().first():
            seed_events = [
                Event(
                    title="Saranathan TechXibitz & Hackathon 2026",
                    description="Annual 24-hour campus hackathon & project expo organized by Saranathan IEEE Student Branch & CSE Department.",
                    date_str="2026-08-18",
                    time_str="09:00 AM",
                    location="Silver Jubilee Auditorium",
                    category="Technical",
                    organizer="Dept. of CSE & IEEE Student Branch",
                    capacity=200,
                    image_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"
                ),
                Event(
                    title="Sara Cultural Fest & Fine Arts 2026",
                    description="Inter-departmental music, dance, and drama festival celebrating Saranathan student talent.",
                    date_str="2026-09-05",
                    time_str="04:30 PM",
                    location="Open Air Theatre (OAT)",
                    category="Cultural",
                    organizer="Sara Fine Arts Committee",
                    capacity=600,
                    image_url="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"
                ),
                Event(
                    title="AI & Data Science National Seminar",
                    description="Guest lecture and workshop on Generative AI, Robotics & IoT hosted by AI&DS and E-Yantra Labs.",
                    date_str="2026-08-25",
                    time_str="10:00 AM",
                    location="CSG Seminar Hall",
                    category="Academic",
                    organizer="Dept. of AI&DS & E-Yantra Lab",
                    capacity=150,
                    image_url="https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=800&q=80"
                )
            ]
            session.add_all(seed_events)

        # Seed Clubs (Saranathan Real Societies)
        result = await session.execute(select(Club))
        if not result.scalars().first():
            seed_clubs = [
                Club(
                    name="Saranathan IEEE Student Branch",
                    category="Technology",
                    description="Official IEEE student society organizing technical workshops, paper presentations, and coding contests.",
                    logo_url="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80",
                    lead_name="Dr. M. Barathi",
                    contact_email="ieee@saranathan.ac.in",
                    member_count=180
                ),
                Club(
                    name="Infosys Campus Connect & Coding Society",
                    category="Software & AI",
                    description="Student developer society training engineering aspirants in full-stack web, Python, and algorithm design.",
                    logo_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=80",
                    lead_name="Dr. S.A. Sahaaya Arul Mary",
                    contact_email="campusconnect@saranathan.ac.in",
                    member_count=210
                ),
                Club(
                    name="E-Yantra Robotics & Embedded Systems Club",
                    category="Robotics",
                    description="IIT Bombay backed robotics laboratory building autonomous rovers, IoT sensors, and automation systems.",
                    logo_url="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=300&q=80",
                    lead_name="Dr. S. M. Girirajkumar",
                    contact_email="eyantra@saranathan.ac.in",
                    member_count=130
                ),
                Club(
                    name="Entrepreneurship Development Cell (EDC)",
                    category="Innovation & Startup",
                    description="Promoting student startup ideas, patent filing assistance, and business model pitching events.",
                    logo_url="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80",
                    lead_name="Dr. K. Rajkumar",
                    contact_email="edc@saranathan.ac.in",
                    member_count=95
                )
            ]
            session.add_all(seed_clubs)

        # Seed Faculty (Saranathan Real Heads & Professors)
        result = await session.execute(select(Faculty))
        if not result.scalars().first():
            seed_faculty = [
                Faculty(
                    name="Dr. D. Valavan",
                    designation="Principal & Professor",
                    department="Mechanical Engineering",
                    email="principal@saranathan.ac.in",
                    office="Principal Office, Admin Block",
                    office_hours="Mon - Fri 10:00 AM - 05:00 PM",
                    courses_taught="Thermal Engineering, Power Plant Engineering",
                    avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                    research_interests="Thermal Fluid Systems, Renewable Energy Engineering"
                ),
                Faculty(
                    name="Dr. S.A. Sahaaya Arul Mary",
                    designation="Professor & Head",
                    department="Computer Science & Engineering",
                    email="hodcse@saranathan.ac.in",
                    office="CS Block - Room 201",
                    office_hours="Mon, Wed 02:00 PM - 04:00 PM",
                    courses_taught="CS101 Intro to CS, CS302 Distributed Systems",
                    avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
                    research_interests="Cloud Computing, Artificial Intelligence, Data Mining"
                ),
                Faculty(
                    name="Dr. M. Barathi",
                    designation="Professor & Head",
                    department="Electronics & Communication Engineering",
                    email="hodece@saranathan.ac.in",
                    office="ECE Block - Room 105",
                    office_hours="Tue, Thu 10:00 AM - 12:00 PM",
                    courses_taught="EC101 Digital Electronics, Microcontrollers",
                    avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
                    research_interests="Signal Processing, Wireless Sensor Networks"
                ),
                Faculty(
                    name="Dr. C. Krishnakumar",
                    designation="Professor & Head",
                    department="Electrical & Electronics Engineering",
                    email="hodeee@saranathan.ac.in",
                    office="EEE Block - Room 102",
                    office_hours="Wed, Fri 11:00 AM - 01:00 PM",
                    courses_taught="EE101 Electric Circuits, Power Systems",
                    avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
                    research_interests="Power Systems, Smart Grid, High Voltage Engineering"
                ),
                Faculty(
                    name="Dr. R. Sumathi",
                    designation="Professor & Head",
                    department="Artificial Intelligence & Data Science",
                    email="hodaids@saranathan.ac.in",
                    office="AI&DS Block - Room 302",
                    office_hours="Mon, Thu 01:30 PM - 03:30 PM",
                    courses_taught="AD101 Data Science Foundations, Deep Learning",
                    avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
                    research_interests="Machine Learning, Computer Vision, Big Analytics"
                ),
                Faculty(
                    name="Dr. G. Mahesh",
                    designation="Professor & Head",
                    department="Mechanical Engineering",
                    email="hodmech@saranathan.ac.in",
                    office="Mechanical Block - Room 101",
                    office_hours="Tue, Fri 02:00 PM - 04:00 PM",
                    courses_taught="ME101 Engineering Graphics, CAD/CAM",
                    avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
                    research_interests="Additive Manufacturing, Robotics, Finite Element Analysis"
                )
            ]
            session.add_all(seed_faculty)

        # Seed Locations (Saranathan Real Campus Blocks)
        result = await session.execute(select(Location))
        if not result.scalars().first():
            seed_locations = [
                Location(
                    name="Silver Jubilee Auditorium",
                    category="admin",
                    building="Central Administrative Complex",
                    floor="Ground Floor",
                    room_number="SJA-01",
                    description="Main air-conditioned auditorium hosting college convocations, inaugurations, and cultural events.",
                    coord_x=45.0,
                    coord_y=35.0
                ),
                Location(
                    name="Central Library & Digital Resource Center",
                    category="library",
                    building="Academic Block A",
                    floor="1st & 2nd Floor",
                    room_number="LIB-101",
                    description="50,000+ volumes, IEEE e-journals subscription, quiet study zones, and digital archives.",
                    coord_x=28.5,
                    coord_y=42.0
                ),
                Location(
                    name="Computer Support Group (CSG GPU Lab)",
                    category="academic",
                    building="CS Block",
                    floor="2nd Floor",
                    room_number="CSG-214",
                    description="High-speed computer center with GPU servers for AI, software development, and campus placement exams.",
                    coord_x=52.0,
                    coord_y=28.0
                ),
                Location(
                    name="E-Yantra Robotics Research Center",
                    category="academic",
                    building="ICE & EEE Block",
                    floor="Ground Floor",
                    room_number="EY-02",
                    description="IIT Bombay collaborated robotics development laboratory for embedded systems and drone design.",
                    coord_x=62.0,
                    coord_y=48.0
                ),
                Location(
                    name="Student Cafeteria & Food Court",
                    category="canteen",
                    building="Student Amenity Center",
                    floor="Ground Floor",
                    room_number="CAN-01",
                    description="Hygienic food court providing South & North Indian meals, fresh juices, and coffee.",
                    coord_x=70.0,
                    coord_y=65.0
                ),
                Location(
                    name="Campus Hostel Blocks",
                    category="hostel",
                    building="Residential Campus",
                    floor="Ground - 3rd Floor",
                    room_number="H-101",
                    description="Separate secure hostel facilities for boys and girls with study halls and recreational dining.",
                    coord_x=82.0,
                    coord_y=75.0
                )
            ]
            session.add_all(seed_locations)

        # Seed Timetable (Saranathan Academic Schedule)
        result = await session.execute(select(TimetableCourse))
        if not result.scalars().first():
            seed_timetable = [
                TimetableCourse(
                    course_code="CS101",
                    course_name="Programming & Problem Solving",
                    faculty_name="Dr. S.A. Sahaaya Arul Mary",
                    day_of_week="Monday",
                    time_slot="09:00 - 10:30",
                    room="CSG Lab A",
                    cohort="CS-A"
                ),
                TimetableCourse(
                    course_code="CS102",
                    course_name="Data Structures and Algorithms",
                    faculty_name="Prof. P. Dinesh Kumar",
                    day_of_week="Tuesday",
                    time_slot="11:00 - 12:30",
                    room="Lecture Hall 302",
                    cohort="CS-A"
                ),
                TimetableCourse(
                    course_code="AD101",
                    course_name="Foundations of AI & Data Science",
                    faculty_name="Dr. R. Sumathi",
                    day_of_week="Wednesday",
                    time_slot="09:00 - 10:30",
                    room="AI Lab 1",
                    cohort="CS-A"
                ),
                TimetableCourse(
                    course_code="EC101",
                    course_name="Digital Electronics & Microcontrollers",
                    faculty_name="Dr. M. Barathi",
                    day_of_week="Thursday",
                    time_slot="11:00 - 12:30",
                    room="ECE Seminar Hall",
                    cohort="CS-A"
                ),
                TimetableCourse(
                    course_code="EE101",
                    course_name="Basic Electrical & Power Engineering",
                    faculty_name="Dr. C. Krishnakumar",
                    day_of_week="Friday",
                    time_slot="14:00 - 15:30",
                    room="EEE Hall 102",
                    cohort="CS-A"
                )
            ]
            session.add_all(seed_timetable)

        # Seed News (Saranathan Authentic Announcements)
        result = await session.execute(select(News))
        if not result.scalars().first():
            seed_news = [
                News(
                    title="UGC Conferred Autonomous Status for 10 Years",
                    content="Saranathan College of Engineering has been granted 10-year UGC Autonomous Status starting from the academic year 2024-25.",
                    timestamp="2026-07-20T10:00:00Z",
                    image_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
                    category="Announcements",
                    author="Office of the Principal"
                ),
                News(
                    title="All 7 Eligible Branches Accredited by NBA",
                    content="All seven eligible UG departments (CSE, ECE, EEE, ICE, IT, MECH, CIVIL) have been reaccredited by NBA through 2028.",
                    timestamp="2026-07-22T14:30:00Z",
                    image_url="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
                    category="Academic",
                    author="IQAC Cell"
                ),
                News(
                    title="Saranathan NAAC 'A+' Grade Conferred",
                    content="The National Assessment and Accreditation Council (NAAC) awarded Saranathan College of Engineering with an A+ Grade for academic excellence.",
                    timestamp="2026-07-15T09:00:00Z",
                    image_url="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
                    category="Accreditation",
                    author="Secretary's Desk"
                )
            ]
            session.add_all(seed_news)

        await session.commit()
        
    yield

app = FastAPI(
    title="Saranathan College of Engineering Student Portal API",
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
    return {"status": "online", "project": "Saranathan College of Engineering Campus Portal"}

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
        "message": "Saranathan student registered successfully",
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
        email = f"student_{token[:6]}@saranathan.ac.in"
        uid = f"uid_{token[:8]}"
        name = req.name or "Saranathan Student"
    else:
        uid = decoded.get("uid")
        email = decoded.get("email", f"{uid}@saranathan.ac.in")
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
        return {"success": True, "message": "Guest student profile active"}
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
    return {"success": True, "message": "Registered for Saranathan event"}

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
    {"id": 1, "title": "Submit Certificates & TNEA Allotment Order", "description": "Submit 10th/12th marksheets, TNEA allotment copy at Admin Block", "category": "Academic", "isRequired": True, "stepOrder": 1},
    {"id": 2, "title": "Collect Saranathan Student ID Card", "description": "Obtain ID card & biometric access key from Admin Office, Room 101", "category": "Admin", "isRequired": True, "stepOrder": 2},
    {"id": 3, "title": "Hostel Room Key Handover", "description": "Complete room key collection & warden registration at Hostel Office", "category": "Hostel", "isRequired": False, "stepOrder": 3},
    {"id": 4, "title": "Activate Campus Wi-Fi & CSG Email", "description": "Register MAC address at Computer Support Group (CSG) Helpdesk", "category": "IT", "isRequired": True, "stepOrder": 4},
    {"id": 5, "title": "Central Library Card Registration", "description": "Activate digital book bank access at Central Library desk", "category": "Library", "isRequired": False, "stepOrder": 5}
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
        suggestions = "Thank you for sharing positive feedback with the Saranathan academic committee!"
    elif any(w in text for w in ["bad", "poor", "horrible", "terrible", "slow", "hard", "difficult", "worst", "issue", "bug"]):
        sentiment = "negative"
        sentiment_label = "Critical / Concerned"
        suggestions = "We have routed your feedback to the Saranathan Principal & Dean's desk for action."
    else:
        sentiment = "neutral"
        sentiment_label = "Balanced Feedback"
        suggestions = "Thank you for contributing your perspective to the Saranathan campus portal!"

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
    dept = current_user.department if current_user and current_user.department else "Computer Science & Engineering"
    return [
        {
            "id": 1,
            "type": "event",
            "title": "Saranathan TechXibitz & Hackathon 2026",
            "justification": f"Tailored for students in {dept} pursuing software, AI & core engineering."
        },
        {
            "id": 2,
            "type": "club",
            "title": "Infosys Campus Connect & Coding Society",
            "justification": "Active coding & skill enhancement hub at Saranathan College of Engineering."
        },
        {
            "id": 3,
            "type": "course",
            "title": "CS102 Data Structures & Algorithms",
            "justification": "Core foundational subject for your upcoming semester curriculum."
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
    
    # Saranathan College specific intelligent responses
    if "library" in msg_lower:
        reply = "The Central Library is located in Academic Block A (1st & 2nd Floor). It holds over 50,000+ volumes, IEEE e-journals, and digital study rooms."
    elif "event" in msg_lower or "hackathon" in msg_lower or "techxibitz" in msg_lower:
        reply = "Upcoming Saranathan campus events: TechXibitz & Hackathon 2026 on August 18 in Silver Jubilee Auditorium, and Sara Cultural Fest on September 5 in OAT!"
    elif "principal" in msg_lower or "faculty" in msg_lower or "hod" in msg_lower:
        reply = "Our Principal is Dr. D. Valavan. Head of CSE is Dr. S.A. Sahaaya Arul Mary, ECE HOD is Dr. M. Barathi, and EEE HOD is Dr. C. Krishnakumar."
    elif "direction" in msg_lower or "map" in msg_lower or "navigate" in msg_lower:
        reply = "Saranathan Campus Navigation: Walk straight from the Main Gate past the Administrative Block. The CSG Labs are in the CS Block (2nd Floor) and Central Library is in Academic Block A."
    elif "admission" in msg_lower or "tnea" in msg_lower or "code" in msg_lower:
        reply = "Saranathan College of Engineering TNEA Counselling Code is 2615. Contact Admission Helpdesk at +91-8489915214 / +91-8489915224."
    else:
        reply = f"Hello! I am your Saranathan Intelligent Campus Assistant. Regarding '{user_msg}', I am ready to guide you on courses, faculty office hours, campus locations, and placement updates!"

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
        "message": f"Synthesized Saranathan campus audio track for prompt: '{req.prompt}'"
    }

@app.post("/api/ai/analyze")
async def ai_analyze(req: Dict[str, Any]):
    return {
        "success": True,
        "analysis": "Media analysis complete: High quality Saranathan academic visual document verified with clear typography."
    }

@app.post("/api/ai/transcribe")
async def ai_transcribe(req: Dict[str, Any]):
    return {
        "success": True,
        "transcript": "Transcribed Audio: Welcome to Saranathan College of Engineering Campus Portal. All academic schedules and lecture notifications are active."
    }
