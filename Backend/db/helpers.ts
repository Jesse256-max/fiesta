import { db } from './index.ts';
import { users, events, registrations, clubs, clubMembers, faculty, courses, studentCourses, checklists, userChecklists, locations, feedbacks } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { FacultyMember } from '../../Frontend/src/types.ts';

// --- IN-MEMORY FALLBACK STORES & HELPERS ---
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const localUsers = new Map<string, any>();
const localRegistrations = new Map<string, any>();
const localClubMembers = new Map<string, any>();
const localSubscribedCourses = new Map<string, any>();
const localUserChecklists = new Map<string, any>();
const localFeedbacks: any[] = [];

const DEFAULT_CHECKLISTS = [
  { id: 1, title: "Submit Original Certificates", description: "Submit standard qualifications to Academic Block", category: "Admission", isRequired: true, stepOrder: 1 },
  { id: 2, title: "Collect Campus ID Card", description: "Obtain student ID card from Admin Office, Room 102", category: "Admission", isRequired: true, stepOrder: 2 },
  { id: 3, title: "Hostel Room Allocation", description: "Collect your room keys from Warden Office", category: "Hostel", isRequired: false, stepOrder: 3 },
  { id: 4, title: "Activate Campus Email & Wi-Fi", description: "Register MAC address at IT Helpdesk", category: "Admission", isRequired: true, stepOrder: 4 },
  { id: 5, title: "Library Card Registration", description: "Activate access at the Central Library desk", category: "Library", isRequired: false, stepOrder: 5 }
];

const DEFAULT_COURSES = [
  { id: 1, courseCode: "CS101", courseName: "Introduction to Computer Science", facultyId: 1, dayOfWeek: "Monday", startTime: "09:00", endTime: "10:30", location: "Lecture Hall A", cohort: "CS-A" },
  { id: 2, courseCode: "CS101", courseName: "Introduction to Computer Science", facultyId: 1, dayOfWeek: "Wednesday", startTime: "09:00", endTime: "10:30", location: "Lecture Hall A", cohort: "CS-A" },
  { id: 3, courseCode: "CS102", courseName: "Data Structures and Algorithms", facultyId: 2, dayOfWeek: "Tuesday", startTime: "11:00", endTime: "12:30", location: "Lecture Hall B", cohort: "CS-A" },
  { id: 4, courseCode: "CS102", courseName: "Data Structures and Algorithms", facultyId: 2, dayOfWeek: "Thursday", startTime: "11:00", endTime: "12:30", location: "Lecture Hall B", cohort: "CS-A" },
  { id: 5, courseCode: "EE101", courseName: "Basic Electrical Engineering", facultyId: 3, dayOfWeek: "Monday", startTime: "14:00", endTime: "15:30", location: "Seminar Room 1", cohort: "CS-A" },
  { id: 6, courseCode: "EE101", courseName: "Basic Electrical Engineering", facultyId: 3, dayOfWeek: "Wednesday", startTime: "14:00", endTime: "15:30", location: "Seminar Room 1", cohort: "CS-A" },
  { id: 7, courseCode: "PH101", courseName: "Engineering Physics", facultyId: 4, dayOfWeek: "Tuesday", startTime: "09:00", endTime: "10:30", location: "Physics Lab", cohort: "CS-A" },
  { id: 8, courseCode: "PH101", courseName: "Engineering Physics", facultyId: 4, dayOfWeek: "Friday", startTime: "09:00", endTime: "10:30", location: "Physics Lab", cohort: "CS-A" }
];

const DEFAULT_FEEDBACKS = [
  {
    id: 1,
    userId: 101,
    userName: "Alex Johnson",
    comment: "The campus map layout is incredible! Love seeing where all the departments are, especially the Robotics hub.",
    sentiment: "positive",
    sentimentLabel: "Highly Satisfied",
    suggestions: "We appreciate your kind words! Keep exploring the campus landmarks.",
    rating: 5,
    createdAt: new Date(Date.now() - 3600000 * 4)
  },
  {
    id: 2,
    userId: 102,
    userName: "Sophia Martinez",
    comment: "Could we have more healthy options in the Canteen? The banana shakes are top tier though!",
    sentiment: "neutral",
    sentimentLabel: "Constructive",
    suggestions: "Thank you! We are working with the dining committee to introduce more organic choices.",
    rating: 4,
    createdAt: new Date(Date.now() - 3600000 * 24)
  }
];

// 1. Get or Create User
export async function dbGetOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        role: 'student',
        cohort: 'CS-A',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetOrCreateUser failed, using in-memory store:", error);
    if (!localUsers.has(uid)) {
      localUsers.set(uid, {
        id: Math.abs(hashCode(uid)) % 10000 + 1,
        uid,
        email,
        name: name || email.split('@')[0],
        role: 'student',
        cohort: 'CS-A',
        department: 'Computer Science & Engineering',
        createdAt: new Date()
      });
    }
    return localUsers.get(uid);
  }
}

// 2. Fetch Events (with registration status for a user)
export async function dbGetEvents(dbUserId?: number) {
  try {
    const allEvents = await db.select().from(events);
    
    if (!dbUserId) {
      return allEvents.map(e => ({ ...e, registered: false }));
    }

    const userRegs = await db.select()
      .from(registrations)
      .where(and(eq(registrations.userId, dbUserId), eq(registrations.status, 'registered')));

    const registeredIds = new Set(userRegs.map(r => r.eventId));

    return allEvents.map(e => ({
      ...e,
      registered: registeredIds.has(e.id),
    }));
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetEvents failed, returning pre-seeded list of events:", error);
    const fallbackEvents = [
      {
        id: 1,
        title: "Freshers' Orientation Program",
        description: "Official inaugural address, campus guidelines, and academic department briefing.",
        date: "2026-08-10",
        time: "09:30",
        location: "Main Auditorium",
        category: "Academic",
        capacity: 300,
        imageUrl: null
      },
      {
        id: 2,
        title: "Club Expo & Recruitment Day",
        description: "Explore 20+ active developer clubs, acoustic bands, astronomy, and robotics labs.",
        date: "2026-08-12",
        time: "14:00",
        location: "Central Lawn",
        category: "Social",
        capacity: 400,
        imageUrl: null
      },
      {
        id: 3,
        title: "Freshers' Welcome Party (Nano Banana Revolution)",
        description: "Celebrate the new session with a live international DJ, neon light themes, mocktails, and a banana dance-off!",
        date: "2026-08-15",
        time: "18:00",
        location: "Campus Sports Arena",
        category: "Social",
        capacity: 500,
        imageUrl: "/src/assets/images/welcome_party_poster_1784350650181.jpg",
      },
      {
        id: 4,
        title: "AI hands-on with Google Gemini API",
        description: "Learn practical prompt engineering, thinking models, and API integrations with developer seniors.",
        date: "2026-08-20",
        time: "15:00",
        location: "Computer Lab 3",
        category: "Workshop",
        capacity: 80,
        imageUrl: null
      }
    ];

    if (!dbUserId) {
      return fallbackEvents.map(e => ({ ...e, registered: false }));
    }

    return fallbackEvents.map(e => ({
      ...e,
      registered: localRegistrations.get(`${dbUserId}-${e.id}`)?.status === 'registered'
    }));
  }
}

// 3. Register for Event
export async function dbRegisterEvent(dbUserId: number, eventId: number) {
  try {
    // Check if registration already exists
    const existing = await db.select()
      .from(registrations)
      .where(and(eq(registrations.userId, dbUserId), eq(registrations.eventId, eventId)));

    if (existing.length > 0) {
      if (existing[0].status === 'registered') {
        return existing[0];
      }
      // Re-enable cancelled registration
      const updated = await db.update(registrations)
        .set({ status: 'registered' })
        .where(eq(registrations.id, existing[0].id))
        .returning();
      return updated[0];
    }

    // Create new registration
    const result = await db.insert(registrations)
      .values({
        userId: dbUserId,
        eventId,
        status: 'registered',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbRegisterEvent failed, falling back to local memory:", error);
    const key = `${dbUserId}-${eventId}`;
    const record = {
      id: Math.floor(Math.random() * 1000000),
      userId: dbUserId,
      eventId,
      status: 'registered',
      createdAt: new Date()
    };
    localRegistrations.set(key, record);
    return record;
  }
}

// 4. Cancel Event Registration
export async function dbCancelEvent(dbUserId: number, eventId: number) {
  try {
    const result = await db.update(registrations)
      .set({ status: 'cancelled' })
      .where(and(eq(registrations.userId, dbUserId), eq(registrations.eventId, eventId)))
      .returning();
    return result[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbCancelEvent failed, falling back to local memory:", error);
    const key = `${dbUserId}-${eventId}`;
    const record = {
      id: Math.floor(Math.random() * 1000000),
      userId: dbUserId,
      eventId,
      status: 'cancelled',
      createdAt: new Date()
    };
    localRegistrations.set(key, record);
    return record;
  }
}

// 5. Get Clubs
export async function dbGetClubs(dbUserId?: number) {
  try {
    const allClubs = await db.select().from(clubs);

    if (!dbUserId) {
      return allClubs.map(c => ({ ...c, membershipStatus: 'none' }));
    }

    const memberships = await db.select()
      .from(clubMembers)
      .where(eq(clubMembers.userId, dbUserId));

    const statusMap = new Map(memberships.map(m => [m.clubId, m.role]));

    return allClubs.map(c => ({
      ...c,
      membershipStatus: statusMap.get(c.id) || 'none',
    }));
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetClubs failed, returning fallback clubs list:", error);
    const fallbackClubs = [
      {
        id: 1,
        name: "Google Developer Groups (GDG) On Campus",
        description: "Tech Club focusing on Web, Cloud, and AI development using Gemini.",
        category: "Tech",
        president: "Sanjay Sharma",
        contactEmail: "gdg@campus.edu",
        logoUrl: null,
      },
      {
        id: 2,
        name: "Acoustic & Harmony Club",
        description: "Music Club covering rock bands, classical jams, and keyboard training.",
        category: "Music",
        president: "Elena Rostova",
        contactEmail: "music@campus.edu",
        logoUrl: null,
      },
      {
        id: 3,
        name: "Robotics & IoT Club",
        description: "Tech Club focusing on drones, microcontrollers, and automation.",
        category: "Tech",
        president: "Yuki Tanaka",
        contactEmail: "robotics@campus.edu",
        logoUrl: null,
      },
      {
        id: 4,
        name: "The Literary Circle",
        description: "Creative writing, debates, poetry slams, and book discussions.",
        category: "Literary",
        president: "Liam Carter",
        contactEmail: "literary@campus.edu",
        logoUrl: null,
      },
      {
        id: 5,
        name: "Technotrons Sports & Athletics Club",
        description: "Organizing internal leagues, track & field events, and inter-college sports tournaments.",
        category: "Sports",
        president: "Marcus Vance",
        contactEmail: "sports@campus.edu",
        logoUrl: null,
      },
      {
        id: 6,
        name: "Fine Arts & Design Society",
        description: "Exploring graphic design, canvas painting, UI/UX conceptualizing, and campus murals.",
        category: "Creative",
        president: "Sophia Dubois",
        contactEmail: "arts@campus.edu",
        logoUrl: null,
      },
      {
        id: 7,
        name: "Eco-Green Campus Initiative",
        description: "Promoting sustainability, zero-waste campaigns, tree planting, and clean energy advocacy.",
        category: "Social",
        president: "Aarav Mehta",
        contactEmail: "eco@campus.edu",
        logoUrl: null,
      },
      {
        id: 8,
        name: "Photography & Media Club",
        description: "Mastering camera techniques, short filmmaking, post-production, and campus event documentation.",
        category: "Creative",
        president: "Clara Vance",
        contactEmail: "photography@campus.edu",
        logoUrl: null,
      },
      {
        id: 9,
        name: "Drama & Theatre Guild",
        description: "Hosting stage plays, street theatre, scriptwriting sessions, and annual musical productions.",
        category: "Creative",
        president: "Oliver Smith",
        contactEmail: "drama@campus.edu",
        logoUrl: null,
      },
      {
        id: 10,
        name: "Finance & Entrepreneurship Club",
        description: "Nurturing startup ideas, stock simulation games, pitch deck workshops, and venture mentorship.",
        category: "Tech",
        president: "Meera Nair",
        contactEmail: "finance@campus.edu",
        logoUrl: null,
      },
      {
        id: 11,
        name: "Chess & Strategy Club",
        description: "Dedicated to chess enthusiasts of all levels. Organizing tournaments, puzzles, and strategic gameplay workshops.",
        category: "Sports",
        president: "Magnus Giri",
        contactEmail: "chess@campus.edu",
        logoUrl: null,
      },
      {
        id: 12,
        name: "Astronomy & Cosmology Society",
        description: "Exploring the stars, organizing night-sky viewing camps, telescope workshops, and cosmology panels.",
        category: "Tech",
        president: "Neil Hawking",
        contactEmail: "astronomy@campus.edu",
        logoUrl: null,
      },
      {
        id: 13,
        name: "Velocity Dance Crew",
        description: "A vibrant club for contemporary, hip-hop, salsa, and traditional dance forms with periodic campus flash mobs.",
        category: "Music",
        president: "Natasha Roy",
        contactEmail: "dance@campus.edu",
        logoUrl: null,
      },
      {
        id: 14,
        name: "Orators & Debaters Society",
        description: "Fostering eloquence, logical reasoning, public speaking excellence, and preparing students for Model UN events.",
        category: "Literary",
        president: "Winston Burke",
        contactEmail: "debate@campus.edu",
        logoUrl: null,
      },
      {
        id: 15,
        name: "Algorithmic Combat & Coding Club",
        description: "Promoting competitive programming, algorithmic puzzles, hackathons, and prep for global coding challenges.",
        category: "Tech",
        president: "Donald Knuth",
        contactEmail: "codecombat@campus.edu",
        logoUrl: null,
      },
      {
        id: 16,
        name: "Social Service & Red Cross Wing",
        description: "Conducting local blood donation drives, primary school educational outreach, and disaster response volunteerism.",
        category: "Social",
        president: "Florence Nightingale",
        contactEmail: "social@campus.edu",
        logoUrl: null,
      }
    ];

    if (!dbUserId) {
      return fallbackClubs.map(c => ({ ...c, membershipStatus: 'none' }));
    }

    return fallbackClubs.map(c => ({
      ...c,
      membershipStatus: localClubMembers.get(`${dbUserId}-${c.id}`)?.role || 'none'
    }));
  }
}

// 6. Join Club
export async function dbJoinClub(dbUserId: number, clubId: number) {
  try {
    const existing = await db.select()
      .from(clubMembers)
      .where(and(eq(clubMembers.userId, dbUserId), eq(clubMembers.clubId, clubId)));

    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db.insert(clubMembers)
      .values({
        userId: dbUserId,
        clubId,
        role: 'member', // Default to active member for instant feedback
      })
      .returning();
    return result[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbJoinClub failed, falling back to local memory:", error);
    const key = `${dbUserId}-${clubId}`;
    const record = {
      id: Math.floor(Math.random() * 1000000),
      userId: dbUserId,
      clubId,
      role: 'member',
      createdAt: new Date()
    };
    localClubMembers.set(key, record);
    return record;
  }
}

// Shared faculty generator function to generate exactly 25 members per department with HOD at the top
export function generateFacultyData(): FacultyMember[] {
  const firstNames = [
    "John", "Jane", "Robert", "Emily", "Michael", "Sarah", "David", "Jessica", "James", "Kendra", 
    "William", "Ashley", "Charles", "Amanda", "George", "Olivia", "Joseph", "Sophia", "Thomas", "Isabella", 
    "Daniel", "Charlotte", "Paul", "Amelia", "Mark", "Mia", "Donald", "Harper", "Steven", "Evelyn", 
    "Andrew", "Abigail", "Edward", "Elizabeth", "Brian", "Sofia", "Ronald", "Avery", "Timothy", "Ella", 
    "Jason", "Madison", "Jeffrey", "Scarlett", "Gary", "Victoria", "Ryan", "Grace", "Liam", "Chloe"
  ];
  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", 
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", 
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", 
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", 
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
  ];

  const departmentTopics: Record<string, string[]> = {
    "Computer Science & Engineering": ["Artificial Intelligence", "Machine Learning", "Quantum Computing", "Cybersecurity", "Distributed Systems", "Database Systems", "Software Engineering", "Computer Vision", "Natural Language Processing", "Human-Computer Interaction"],
    "Electronics & Communication (ECE)": ["VLSI Design", "Embedded Systems", "Signal Processing", "Wireless Communications", "Optical Networks", "Microelectronics", "Antenna Theory", "Internet of Things (IoT)", "RF Engineering", "Sensor Networks"],
    "Aerospace Engineering": ["Aerodynamics", "Propulsion Systems", "Orbital Mechanics", "Avionics", "Spacecraft Design", "Composite Materials", "Flight Dynamics", "Aeroelasticity", "Guidance & Control", "Rocketry"],
    "Biotechnology Engineering": ["Genetic Engineering", "Bioinformatics", "Bioprocess Technology", "Tissue Engineering", "CRISPR Gene Editing", "Pharmaceutical Biotech", "Agricultural Biotech", "Bioremediation", "Structural Biology", "Synthetic Biology"],
    "Environmental Engineering": ["Water Treatment", "Air Pollution Control", "Solid Waste Management", "Sustainable Infrastructure", "Hydrology", "Environmental Chemistry", "Climate Change Mitigation", "Renewable Energy Systems", "Ecology Conservation", "Geotechnical Engineering"],
    "Robotics & Automation": ["Mechatronics", "Autonomous Vehicles", "Industrial Automation", "Humanoid Robotics", "Swarm Robotics", "Computer-Aided Manufacturing", "Control Systems", "Sensor Fusion", "Kinematics & Dynamics", "Prosthetic Design"],
    "Information Technology (IT)": ["Cloud Computing", "Big Data Analytics", "Web Technologies", "Blockchain Systems", "Network Security", "Data Mining", "DevOps & SRE", "Mobile App Development", "Enterprise Architecture", "Information Retrieval"],
    "Civil Engineering": ["Structural Analysis", "Geotechnical Engineering", "Transportation Planning", "Concrete Technology", "Earthquake Engineering", "Hydraulics & Water Resources", "Urban Planning", "Construction Management", "Surveying & GIS", "Bridge Engineering"],
    "Mechanical Engineering": ["Thermodynamics", "Fluid Mechanics", "Heat Transfer", "Automotive Engineering", "Solid Mechanics", "Computer-Aided Design (CAD)", "Robotic Machining", "Materials Science", "Vibration Analysis", "Renewable Thermal Energy"],
    "Artificial Intelligence & Data Science": ["Neural Networks", "Deep Learning", "Data Mining", "Big Data Analytics", "Generative AI", "Computer Vision", "Predictive Modeling", "Reinforcement Learning", "NLP", "Statistical Computing"],
    "Chemical Engineering": ["Process Optimization", "Catalysis & Reaction Engineering", "Polymer Technology", "Transport Phenomena", "Petrochemical Refining", "Thermodynamics", "Biomolecular Engineering", "Nanomaterials", "Separation Processes", "Green Chemistry"],
    "Electrical & Electronics Engineering": ["Power Systems", "Control Systems", "Smart Grids", "Renewable Energy integration", "Electric Vehicles", "High Voltage Engineering", "Power Electronics", "Industrial Drives", "Signal Processing", "Microcontrollers"],
    "Metallurgical & Materials Engineering": ["Alloy Development", "Physical Metallurgy", "Nanomaterials", "Corrosion Engineering", "Extractive Metallurgy", "Material Characterization", "Ceramics and Glasses", "Biomaterials", "Computational Materials Science", "Powder Metallurgy"],
    "Biomedical Engineering": ["Medical Imaging", "Bioinstrumentation", "Prosthetics & Orthotics", "Biomaterials", "Neural Engineering", "Biomechanics", "Telemedicine", "Medical Robotics", "Clinical Engineering", "Biosensors"],
    "Humanities & Social Sciences": ["Technical Communication", "Professional Ethics", "Organizational Behavior", "Sociology of Technology", "Economics for Engineers", "Environmental Sociology", "Developmental Psychology", "Literature & Culture", "Public Policy", "Cognitive Science"]
  };

  const departments = [
    "Computer Science & Engineering",
    "Electronics & Communication (ECE)",
    "Aerospace Engineering",
    "Biotechnology Engineering",
    "Environmental Engineering",
    "Robotics & Automation",
    "Information Technology (IT)",
    "Civil Engineering",
    "Mechanical Engineering",
    "Artificial Intelligence & Data Science",
    "Chemical Engineering",
    "Electrical & Electronics Engineering",
    "Metallurgical & Materials Engineering",
    "Biomedical Engineering",
    "Humanities & Social Sciences"
  ];

  const facultyList: FacultyMember[] = [];
  const usedIds = new Set<number>();

  // Academic Leadership (these are deans/directors, they belong to "Academic Leadership" department)
  const leaders = [
    {
      id: 5,
      name: "Dr. Elizabeth Blackwell",
      department: "Academic Leadership",
      designation: "Principal & Director",
      email: "director@campus.edu",
      office: "Admin Block, Room 101",
      hours: "Mon/Wed/Fri 11:00 AM - 12:30 PM",
      avatarUrl: null,
      researchInterests: "Strategic Higher Education, Biomedical Engineering, Cyber-Physical Campus Ecosystems"
    },
    {
      id: 6,
      name: "Professor Albert Einstein",
      department: "Academic Leadership",
      designation: "Dean of Academic Affairs",
      email: "dean.academics@campus.edu",
      office: "Admin Block, Room 104",
      hours: "Tue/Thu 10:00 AM - 12:00 PM",
      avatarUrl: null,
      researchInterests: "Relativity Theory, Quantum Mechanics, Curriculum Innovation, Science Education Standards"
    },
    {
      id: 7,
      name: "Dr. Nikola Tesla",
      department: "Academic Leadership",
      designation: "Dean of Research & Development",
      email: "dean.research@campus.edu",
      office: "Research Hub, Room 201",
      hours: "Tue/Thu 2:00 PM - 4:00 PM",
      avatarUrl: null,
      researchInterests: "Alternating Current Systems, Wireless Power Transmission, Patent Acceleration, IoT Grids"
    },
    {
      id: 8,
      name: "Dr. Marie Curie",
      department: "Academic Leadership",
      designation: "Dean of Student Welfare",
      email: "dean.welfare@campus.edu",
      office: "Admin Block, Room 108",
      hours: "Mon-Fri 3:00 PM - 4:30 PM",
      avatarUrl: null,
      researchInterests: "Radiochemistry, Nuclear Physics, Student Wellness and Health, Academic Mentorship Programs"
    }
  ];

  facultyList.push(...leaders);
  leaders.forEach(l => usedIds.add(l.id));

  // Famous/fixed faculty for standard departments
  const fixedFaculty = [
    {
      id: 1,
      name: "Professor Alan Turing",
      department: "Computer Science & Engineering",
      designation: "Professor",
      email: "turing@campus.edu",
      office: "Block B, Room 404",
      hours: "Mon/Wed 10:00 AM - 12:00 PM",
      avatarUrl: null,
      researchInterests: "Theoretical Computer Science, Cryptography, Artificial Intelligence, Computability Theory"
    },
    {
      id: 2,
      name: "Professor Grace Hopper",
      department: "Computer Science & Engineering",
      designation: "Associate Professor",
      email: "hopper@campus.edu",
      office: "Block B, Room 302",
      hours: "Tue/Thu 2:00 PM - 4:00 PM",
      avatarUrl: null,
      researchInterests: "Compiler Design, Programming Languages, COBOL Development, Software Engineering"
    },
    {
      id: 3,
      name: "Dr. Ada Lovelace",
      department: "Electronics & Communication (ECE)",
      designation: "Professor",
      email: "lovelace@campus.edu",
      office: "Block C, Room 101",
      hours: "Fri 1:00 PM - 3:00 PM",
      avatarUrl: null,
      researchInterests: "Analytical Engines, Computing Algorithms, Theoretical Mathematics, Early Computation History"
    },
    {
      id: 4,
      name: "Dr. Richard Feynman",
      department: "Mechanical Engineering",
      designation: "Professor",
      email: "feynman@campus.edu",
      office: "Block A, Room 501",
      hours: "Mon/Thu 3:00 PM - 5:00 PM",
      avatarUrl: null,
      researchInterests: "Quantum Electrodynamics, Particle Physics, Quantum Computing, Nanotechnology"
    },
    {
      id: 9,
      name: "Dr. Katherine Johnson",
      department: "Computer Science & Engineering",
      designation: "HOD & Professor",
      email: "hod.cse@campus.edu",
      office: "Block B, Room 401",
      hours: "Mon/Wed 2:00 PM - 3:30 PM",
      avatarUrl: null,
      researchInterests: "Orbital Mechanics, Precision Mathematical Computing, Early Space-Flight Software Verification"
    }
  ];

  facultyList.push(...fixedFaculty);
  fixedFaculty.forEach(f => usedIds.add(f.id));

  let nextSeqId = 10;
  const getNextId = () => {
    while (usedIds.has(nextSeqId)) {
      nextSeqId++;
    }
    usedIds.add(nextSeqId);
    return nextSeqId;
  };

  // For each of the 15 requested departments, generate a total of 25 members (including HOD)
  for (let d = 0; d < departments.length; d++) {
    const deptName = departments[d];
    const topics = departmentTopics[deptName] || ["General Engineering"];
    
    const existingInDept = fixedFaculty.filter(f => f.department === deptName);
    const countToGenerate = 25 - existingInDept.length;
    const hasHOD = existingInDept.some(f => f.designation.toLowerCase().includes("hod") || f.designation.toLowerCase().includes("head of"));

    for (let fIdx = 0; fIdx < countToGenerate; fIdx++) {
      const isHOD = fIdx === 0 && !hasHOD;
      let designation = "";
      
      if (isHOD) {
        designation = "HOD & Professor";
      } else if (fIdx % 4 === 1) {
        designation = "Professor";
      } else if (fIdx % 4 === 2) {
        designation = "Associate Professor";
      } else {
        designation = "Assistant Professor";
      }

      const fName = firstNames[(d * 31 + fIdx * 17) % firstNames.length];
      const lName = lastNames[(d * 13 + fIdx * 29) % lastNames.length];
      const name = `Dr. ${fName} ${lName}`;
      
      const isCse = deptName.includes("Computer");
      const hodPrefix = isCse ? 'hod.cse' : `hod.${deptName.toLowerCase().split(' ')[0]}`;
      const email = isHOD 
        ? `${hodPrefix}@campus.edu`
        : `${fName.toLowerCase()}.${lName.toLowerCase()}@campus.edu`;

      let block = "A";
      if (deptName.includes("Computer") || deptName.includes("Information") || deptName.includes("Artificial")) block = "B";
      else if (deptName.includes("Electronics") || deptName.includes("Robotics") || deptName.includes("Electrical")) block = "C";
      else if (deptName.includes("Bio") || deptName.includes("Environ")) block = "D";
      else if (deptName.includes("Aerospace")) block = "E";
      else if (deptName.includes("Chemical") || deptName.includes("Metallurgical")) block = "F";
      else if (deptName.includes("Humanities")) block = "H";

      const roomNum = 100 + (d * 10) + fIdx + 1;
      const office = `Block ${block}, Room ${roomNum}`;

      const dayArr = ["Mon/Wed", "Tue/Thu", "Fri", "Mon/Wed/Fri", "Tue/Thu/Fri"];
      const timeArr = ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM", "11:00 AM - 12:30 PM", "1:00 PM - 3:00 PM", "3:00 PM - 5:00 PM"];
      const day = dayArr[(d * 3 + fIdx * 7) % dayArr.length];
      const time = timeArr[(d * 11 + fIdx * 13) % timeArr.length];
      const hours = `${day} ${time}`;

      const topic1 = topics[(fIdx * 3) % topics.length];
      const topic2 = topics[(fIdx * 7 + 1) % topics.length];
      const topic3 = topics[(fIdx * 11 + 2) % topics.length];
      const combinedTopics = Array.from(new Set([topic1, topic2, topic3]));
      const researchInterests = `Specializing in ${combinedTopics.join(", and ")}. Passionate about advanced engineering education.`;

      facultyList.push({
        id: getNextId(),
        name,
        department: deptName,
        designation,
        email,
        office,
        hours,
        avatarUrl: null,
        researchInterests
      });
    }
  }

  return facultyList;
}

// 7. Get Faculty
export async function dbGetFaculty() {
  try {
    const result = await db.select().from(faculty);
    if (result && result.length > 0) {
      return result;
    }
    return generateFacultyData();
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetFaculty failed or empty, returning generated faculty list:", error);
    return generateFacultyData();
  }
}

// 8. Get Timetable Courses (Cohorts + Custom subscriptions)
export async function dbGetTimetable(dbUserId: number, cohort: string = 'CS-A') {
  try {
    // Get cohort courses
    const cohortCourses = await db.select().from(courses).where(eq(courses.cohort, cohort));
    
    // Get custom subscribed courses
    const studentSubs = await db.select()
      .from(studentCourses)
      .where(eq(studentCourses.userId, dbUserId));

    const subCourseIds = studentSubs.map(s => s.courseId);

    let allSubbedCourses: any[] = [];
    if (subCourseIds.length > 0) {
      // Fetch all courses that are subscribed to
      const allCourses = await db.select().from(courses);
      allSubbedCourses = allCourses.filter(c => subCourseIds.includes(c.id));
    }

    // Combine them without duplicates
    const combinedMap = new Map();
    cohortCourses.forEach(c => combinedMap.set(c.id, { ...c, isSubscribed: true }));
    allSubbedCourses.forEach(c => combinedMap.set(c.id, { ...c, isSubscribed: true }));

    return Array.from(combinedMap.values());
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetTimetable failed, returning default timetable courses:", error);
    const cohortCourses = DEFAULT_COURSES.filter(c => c.cohort === cohort);
    const combinedMap = new Map();
    cohortCourses.forEach(c => combinedMap.set(c.id, { ...c, isSubscribed: true }));
    
    // Custom subbed courses from local map
    for (const [key, value] of localSubscribedCourses.entries()) {
      if (key.startsWith(`${dbUserId}-`)) {
        const c = DEFAULT_COURSES.find(dc => dc.id === value.courseId);
        if (c) {
          combinedMap.set(c.id, { ...c, isSubscribed: true });
        }
      }
    }
    return Array.from(combinedMap.values());
  }
}

// 9. Subscribe to Course
export async function dbSubscribeCourse(dbUserId: number, courseId: number) {
  try {
    const existing = await db.select()
      .from(studentCourses)
      .where(and(eq(studentCourses.userId, dbUserId), eq(studentCourses.courseId, courseId)));

    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db.insert(studentCourses)
      .values({
        userId: dbUserId,
        courseId,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbSubscribeCourse failed, falling back to local memory:", error);
    const key = `${dbUserId}-${courseId}`;
    const record = {
      id: Math.floor(Math.random() * 1000000),
      userId: dbUserId,
      courseId,
      createdAt: new Date()
    };
    localSubscribedCourses.set(key, record);
    return record;
  }
}

// 10. Unsubscribe from Course
export async function dbUnsubscribeCourse(dbUserId: number, courseId: number) {
  try {
    const result = await db.delete(studentCourses)
      .where(and(eq(studentCourses.userId, dbUserId), eq(studentCourses.courseId, courseId)))
      .returning();
    return result[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbUnsubscribeCourse failed, falling back to local memory:", error);
    const key = `${dbUserId}-${courseId}`;
    const record = localSubscribedCourses.get(key);
    localSubscribedCourses.delete(key);
    return record || { userId: dbUserId, courseId };
  }
}

// 11. Get Checklist Progress
export async function dbGetChecklist(dbUserId: number) {
  try {
    const allItems = await db.select().from(checklists);
    const userProgress = await db.select()
      .from(userChecklists)
      .where(eq(userChecklists.userId, dbUserId));

    const completedMap = new Map(userProgress.map(p => [p.checklistId, p.completed]));

    return allItems.map(item => ({
      ...item,
      completed: completedMap.get(item.id) || false,
    })).sort((a, b) => a.stepOrder - b.stepOrder);
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetChecklist failed, returning default checklist:", error);
    return DEFAULT_CHECKLISTS.map(item => ({
      ...item,
      completed: localUserChecklists.get(`${dbUserId}-${item.id}`)?.completed || false
    })).sort((a, b) => a.stepOrder - b.stepOrder);
  }
}

// 12. Toggle Checklist Item
export async function dbToggleChecklist(dbUserId: number, checklistId: number, completed: boolean) {
  try {
    const existing = await db.select()
      .from(userChecklists)
      .where(and(eq(userChecklists.userId, dbUserId), eq(userChecklists.checklistId, checklistId)));

    if (existing.length > 0) {
      const updated = await db.update(userChecklists)
        .set({ completed, updatedAt: new Date() })
        .where(eq(userChecklists.id, existing[0].id))
        .returning();
      return updated[0];
    }

    const inserted = await db.insert(userChecklists)
      .values({
        userId: dbUserId,
        checklistId,
        completed,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbToggleChecklist failed, falling back to local memory:", error);
    const key = `${dbUserId}-${checklistId}`;
    const record = {
      id: Math.floor(Math.random() * 1000000),
      userId: dbUserId,
      checklistId,
      completed,
      updatedAt: new Date()
    };
    localUserChecklists.set(key, record);
    return record;
  }
}

// 13. Get Campus Locations
export const CAMPUS_LOCATIONS_DATA = [
  {
    id: 1,
    name: "Ada Lovelace Computer Science Hall (CSE)",
    category: "academic",
    building: "Block CS",
    floor: "Ground Floor",
    roomNumber: "Room 101",
    description: "Center of excellence for AI research, high-performance computing, and computer science lectures.",
    coordinatesX: 14,
    coordinatesY: 18
  },
  {
    id: 2,
    name: "Alan Turing Information Technology Block (IT)",
    category: "academic",
    building: "Block IT",
    floor: "1st Floor",
    roomNumber: "Room 204",
    description: "State-of-the-art labs for Web Technologies, Cloud Infrastructure, and Cyber Security.",
    coordinatesX: 14,
    coordinatesY: 32
  },
  {
    id: 3,
    name: "John von Neumann AI & Data Science Wing (AI & DS)",
    category: "academic",
    building: "Block AI",
    floor: "2nd Floor",
    roomNumber: "Room 305",
    description: "Home to the generative AI labs, neural networks research, and deep learning nodes.",
    coordinatesX: 14,
    coordinatesY: 46
  },
  {
    id: 4,
    name: "Nikola Tesla Electronics & Comm Block (ECE)",
    category: "academic",
    building: "Block ECE",
    floor: "Ground Floor",
    roomNumber: "Room 102",
    description: "VLSI chip design suites, telecommunication microcircuits, and digital signal processing facilities.",
    coordinatesX: 14,
    coordinatesY: 60
  },
  {
    id: 5,
    name: "Isaac Asimov Robotics & Automation Hub",
    category: "academic",
    building: "Block RA",
    floor: "Ground Floor",
    roomNumber: "Robot Ring 1",
    description: "Mechatronics testing rings, drone flight chambers, and industrial robotic arms.",
    coordinatesX: 14,
    coordinatesY: 74
  },
  {
    id: 6,
    name: "Kalpana Chawla Aerospace Complex (Aerospace)",
    category: "academic",
    building: "Block AS",
    floor: "Ground Floor",
    roomNumber: "Wind Tunnel Hall",
    description: "Wind tunnels, propulsion simulation chambers, and rocket model engineering labs.",
    coordinatesX: 30,
    coordinatesY: 18
  },
  {
    id: 7,
    name: "Rosalind Franklin Biotech Center (Biotech)",
    category: "academic",
    building: "Block BT",
    floor: "Ground Floor",
    roomNumber: "Genome Lab A",
    description: "Genetic sequencing suites, bioreactor hubs, and cellular tissue development benches.",
    coordinatesX: 30,
    coordinatesY: 32
  },
  {
    id: 8,
    name: "Galen Biomedical Engineering Lab (Biomedical)",
    category: "academic",
    building: "Block BM",
    floor: "1st Floor",
    roomNumber: "Room 108",
    description: "Medical imaging systems development, prosthetics drafting, and clinical telemetry interfaces.",
    coordinatesX: 30,
    coordinatesY: 46
  },
  {
    id: 9,
    name: "James Watt Mechanical Engineering Block (ME)",
    category: "academic",
    building: "Block ME",
    floor: "Ground Floor",
    roomNumber: "Heavy Mech Lab",
    description: "Thermodynamics chambers, solid mechanics testing machinery, and automated CAD design hubs.",
    coordinatesX: 30,
    coordinatesY: 60
  },
  {
    id: 10,
    name: "Henry Bessemer Metallurgy Wing (Metallurgy)",
    category: "academic",
    building: "Block MM",
    floor: "Ground Floor",
    roomNumber: "Furnace Lab 3",
    description: "Alloy synthesis ovens, structural material profiling spectrometers, and powder metallurgy lab.",
    coordinatesX: 30,
    coordinatesY: 74
  },
  {
    id: 11,
    name: "Sir Arthur Cotton Civil Engineering Block (Civil)",
    category: "academic",
    building: "Block CE",
    floor: "Ground Floor",
    roomNumber: "Structures Lab",
    description: "Structural concrete stress testing rigs, GIS mapping computers, and fluid mechanics channels.",
    coordinatesX: 42,
    coordinatesY: 18
  },
  {
    id: 12,
    name: "Rachel Carson Environmental Labs (Environmental)",
    category: "academic",
    building: "Block EE",
    floor: "1st Floor",
    roomNumber: "Air Quality Lab",
    description: "Acoustic and air analysis rigs, water quality purification columns, and sustainable eco-materials research.",
    coordinatesX: 42,
    coordinatesY: 32
  },
  {
    id: 13,
    name: "Marie Curie Chemical Engineering Complex (Chemical)",
    category: "academic",
    building: "Block CH",
    floor: "Ground Floor",
    roomNumber: "Reaction Lab",
    description: "Industrial chemical process design reactors, polymer synthesis labs, and green energy catalyst research.",
    coordinatesX: 42,
    coordinatesY: 46
  },
  {
    id: 14,
    name: "Michael Faraday Electrical Engineering Block (EEE)",
    category: "academic",
    building: "Block EE",
    floor: "Ground Floor",
    roomNumber: "Power Lab 101",
    description: "High-voltage switchgear, electric vehicle drive calibration, and smart grid automation labs.",
    coordinatesX: 42,
    coordinatesY: 60
  },
  {
    id: 15,
    name: "Rabindranath Tagore Humanities Wing (H&S)",
    category: "academic",
    building: "Block HS",
    floor: "1st Floor",
    roomNumber: "Seminar Hall",
    description: "Technical communication studios, professional ethics debate chambers, and public policy seminar rooms.",
    coordinatesX: 42,
    coordinatesY: 74
  },
  {
    id: 16,
    name: "Srinivasa Ramanujan Central Library",
    category: "library",
    building: "Library Block",
    floor: "1st Floor",
    roomNumber: "Central Desk",
    description: "A majestic three-story knowledge treasury containing digital IEEE archives, physical books, and quiet study zones.",
    coordinatesX: 58,
    coordinatesY: 22
  },
  {
    id: 17,
    name: "Student Dining Pavilion & Canteen",
    category: "canteen",
    building: "Student Hub",
    floor: "Ground Floor",
    roomNumber: "Main Hall",
    description: "A bustling dining hall serving hot multi-cuisine meals, beverages, and TCE's legendary Nano Banana milkshakes.",
    coordinatesX: 58,
    coordinatesY: 46
  },
  {
    id: 18,
    name: "Campus Health & Medical Center",
    category: "admin",
    building: "Medical Wing",
    floor: "Ground Floor",
    roomNumber: "Triage Desk",
    description: "24/7 medical response center offering first aid, wellness checkups, and emergency ambulance service.",
    coordinatesX: 58,
    coordinatesY: 70
  },
  {
    id: 19,
    name: "Campus Sports Arena & Gymnasium",
    category: "sports",
    building: "Sports Block",
    floor: "Ground Floor",
    roomNumber: "Main Court",
    description: "Spacious indoor/outdoor courts for basketball, badminton, and state-of-the-art conditioning gymnasium.",
    coordinatesX: 58,
    coordinatesY: 86
  },
  {
    id: 20,
    name: "Visvesvaraya Administrative Offices",
    category: "admin",
    building: "Admin Block",
    floor: "1st Floor",
    roomNumber: "Room 102",
    description: "Dean's office, administrative desks, student document verification, and ID card collection center.",
    coordinatesX: 78,
    coordinatesY: 22
  },
  {
    id: 21,
    name: "Rabindranath Tagore Main Auditorium",
    category: "admin",
    building: "Auditorium",
    floor: "Ground Floor",
    roomNumber: "Auditorium Hall",
    description: "A grand 1200-seat multi-media auditorium host to major events, conferences, and student mixers.",
    coordinatesX: 78,
    coordinatesY: 46
  },
  {
    id: 22,
    name: "Innovation & Startup Incubation Hub",
    category: "admin",
    building: "Tech Hub",
    floor: "Ground Floor",
    roomNumber: "AI Studio",
    description: "A collaborative laboratory where students prototype generative AI projects and launch entrepreneurial ideas.",
    coordinatesX: 78,
    coordinatesY: 70
  },
  {
    id: 23,
    name: "Open Air Theater (OAT)",
    category: "admin",
    building: "OAT Complex",
    floor: "Ground Floor",
    roomNumber: "Main Stage",
    description: "Spacious amphitheater for student club gigs, cultural battles, and pleasant twilight gatherings.",
    coordinatesX: 88,
    coordinatesY: 34
  },
  {
    id: 24,
    name: "Boys Hostel Residence Hall",
    category: "hostel",
    building: "Hostel Block A",
    floor: "Ground Floor",
    roomNumber: "Reception",
    description: "Comfortable residential chambers, gaming lounges, study halls, and student dining facilities for boys.",
    coordinatesX: 88,
    coordinatesY: 58
  },
  {
    id: 25,
    name: "Girls Hostel Residence Hall",
    category: "hostel",
    building: "Hostel Block B",
    floor: "Ground Floor",
    roomNumber: "Reception",
    description: "Safe and spacious student residential wings with indoor recreation, study rooms, and private lawns for girls.",
    coordinatesX: 88,
    coordinatesY: 82
  }
];

export async function dbGetLocations() {
  try {
    const list = await db.select().from(locations);
    if (list.length === 0) {
      return CAMPUS_LOCATIONS_DATA;
    }
    return list;
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetLocations failed, returning pre-seeded locations:", error);
    return CAMPUS_LOCATIONS_DATA;
  }
}

// 14. Add Portal Feedback
export async function dbAddFeedback(
  dbUserId: number | null,
  userName: string | null,
  comment: string,
  sentiment: string,
  sentimentLabel: string,
  suggestions: string | null,
  rating: number
) {
  try {
    const result = await db.insert(feedbacks)
      .values({
        userId: dbUserId,
        userName: userName || "Anonymous Student",
        comment,
        sentiment,
        sentimentLabel,
        suggestions,
        rating,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbAddFeedback failed, falling back to local memory:", error);
    const record = {
      id: Math.floor(Math.random() * 1000000),
      userId: dbUserId,
      userName: userName || "Anonymous Student",
      comment,
      sentiment,
      sentimentLabel,
      suggestions,
      rating,
      createdAt: new Date()
    };
    localFeedbacks.unshift(record);
    return record;
  }
}

// 15. Get Portal Feedbacks (latest first)
export async function dbGetFeedbacks() {
  try {
    return await db.select().from(feedbacks).orderBy(desc(feedbacks.createdAt));
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetFeedbacks failed, returning fallback feedbacks:", error);
    const combined = [...localFeedbacks];
    DEFAULT_FEEDBACKS.forEach(df => {
      if (!combined.some(item => item.id === df.id)) {
        combined.push(df);
      }
    });
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// 16. Update User Profile Settings (Display Name & Department)
export async function dbUpdateUserProfile(uid: string, name: string, department: string) {
  try {
    const result = await db.update(users)
      .set({ name, department })
      .where(eq(users.uid, uid))
      .returning();
    return result[0];
  } catch (error) {
    console.warn("[DB FALLBACK] dbUpdateUserProfile failed, falling back to local memory:", error);
    const user = localUsers.get(uid) || {
      id: Math.abs(hashCode(uid)) % 10000 + 1,
      uid,
      email: uid,
      role: 'student',
      cohort: 'CS-A',
      createdAt: new Date()
    };
    const updated = {
      ...user,
      name,
      department
    };
    localUsers.set(uid, updated);
    return updated;
  }
}

// 17. Seed Campus Data Helper
export async function dbSeedAll() {
  try {
    console.log("Seeding Database Tables...");

    // 1. Seed Faculty
    const facultyToInsert = generateFacultyData();

    // Clear existing records to support perfect clean slate seeding and avoid duplicate serials
    await db.delete(courses);
    await db.delete(faculty);

    // Insert the generated and structured faculty members
    await db.insert(faculty).values(facultyToInsert).onConflictDoNothing();

    // 2. Seed Clubs
    await db.insert(clubs).values([
      {
        id: 1,
        name: "Google Developer Groups (GDG) On Campus",
        description: "Tech Club focusing on Web, Cloud, and AI development using Gemini.",
        category: "Tech",
        president: "Sanjay Sharma",
        contactEmail: "gdg@campus.edu",
        logoUrl: null
      },
      {
        id: 2,
        name: "Acoustic & Harmony Club",
        description: "Music Club covering rock bands, classical jams, and keyboard training.",
        category: "Music",
        president: "Elena Rostova",
        contactEmail: "music@campus.edu",
        logoUrl: null
      },
      {
        id: 3,
        name: "Robotics & IoT Club",
        description: "Tech Club focusing on drones, microcontrollers, and automation.",
        category: "Tech",
        president: "Yuki Tanaka",
        contactEmail: "robotics@campus.edu",
        logoUrl: null
      },
      {
        id: 4,
        name: "The Literary Circle",
        description: "Creative writing, debates, poetry slams, and book discussions.",
        category: "Literary",
        president: "Liam Carter",
        contactEmail: "literary@campus.edu",
        logoUrl: null
      },
      {
        id: 5,
        name: "Technotrons Sports & Athletics Club",
        description: "Organizing internal leagues, track & field events, and inter-college sports tournaments.",
        category: "Sports",
        president: "Marcus Vance",
        contactEmail: "sports@campus.edu",
        logoUrl: null
      },
      {
        id: 6,
        name: "Fine Arts & Design Society",
        description: "Exploring graphic design, canvas painting, UI/UX conceptualizing, and campus murals.",
        category: "Creative",
        president: "Sophia Dubois",
        contactEmail: "arts@campus.edu",
        logoUrl: null
      },
      {
        id: 7,
        name: "Eco-Green Campus Initiative",
        description: "Promoting sustainability, zero-waste campaigns, tree planting, and clean energy advocacy.",
        category: "Social",
        president: "Aarav Mehta",
        contactEmail: "eco@campus.edu",
        logoUrl: null
      },
      {
        id: 8,
        name: "Photography & Media Club",
        description: "Mastering camera techniques, short filmmaking, post-production, and campus event documentation.",
        category: "Creative",
        president: "Clara Vance",
        contactEmail: "photography@campus.edu",
        logoUrl: null
      },
      {
        id: 9,
        name: "Drama & Theatre Guild",
        description: "Hosting stage plays, street theatre, scriptwriting sessions, and annual musical productions.",
        category: "Creative",
        president: "Oliver Smith",
        contactEmail: "drama@campus.edu",
        logoUrl: null
      },
      {
        id: 10,
        name: "Finance & Entrepreneurship Club",
        description: "Nurturing startup ideas, stock simulation games, pitch deck workshops, and venture mentorship.",
        category: "Tech",
        president: "Meera Nair",
        contactEmail: "finance@campus.edu",
        logoUrl: null
      },
      {
        id: 11,
        name: "Chess & Strategy Club",
        description: "Dedicated to chess enthusiasts of all levels. Organizing tournaments, puzzles, and strategic gameplay workshops.",
        category: "Sports",
        president: "Magnus Giri",
        contactEmail: "chess@campus.edu",
        logoUrl: null
      },
      {
        id: 12,
        name: "Astronomy & Cosmology Society",
        description: "Exploring the stars, organizing night-sky viewing camps, telescope workshops, and cosmology panels.",
        category: "Tech",
        president: "Neil Hawking",
        contactEmail: "astronomy@campus.edu",
        logoUrl: null
      },
      {
        id: 13,
        name: "Velocity Dance Crew",
        description: "A vibrant club for contemporary, hip-hop, salsa, and traditional dance forms with periodic campus flash mobs.",
        category: "Music",
        president: "Natasha Roy",
        contactEmail: "dance@campus.edu",
        logoUrl: null
      },
      {
        id: 14,
        name: "Orators & Debaters Society",
        description: "Fostering eloquence, logical reasoning, public speaking excellence, and preparing students for Model UN events.",
        category: "Literary",
        president: "Winston Burke",
        contactEmail: "debate@campus.edu",
        logoUrl: null
      },
      {
        id: 15,
        name: "Algorithmic Combat & Coding Club",
        description: "Promoting competitive programming, algorithmic puzzles, hackathons, and prep for global coding challenges.",
        category: "Tech",
        president: "Donald Knuth",
        contactEmail: "codecombat@campus.edu",
        logoUrl: null
      },
      {
        id: 16,
        name: "Social Service & Red Cross Wing",
        description: "Conducting local blood donation drives, primary school educational outreach, and disaster response volunteerism.",
        category: "Social",
        president: "Florence Nightingale",
        contactEmail: "social@campus.edu",
        logoUrl: null
      }
    ]).onConflictDoNothing();

    // 3. Seed Events
    await db.insert(events).values([
      {
        id: 1,
        title: "Freshers' Orientation Program",
        description: "Welcome address by the Dean, administrative briefings, curriculum guidelines, and fun icebreaker games to get to know your fellow freshmen.",
        date: "2026-08-10",
        time: "09:30",
        location: "Main Auditorium",
        category: "Academic",
        organizer: "Admin Office",
        capacity: 300
      },
      {
        id: 2,
        title: "Club Expo & Recruitment Day",
        description: "Meet senior students, explore 20+ campus clubs ranging from tech societies to music bands, and join the clubs that match your passions.",
        date: "2026-08-12",
        time: "14:00",
        location: "Central Lawn",
        category: "Social",
        organizer: "Student Council",
        capacity: 400
      },
      {
        id: 3,
        title: "Freshers' Welcome Party (Nano Banana Revolution)",
        description: "The biggest highlight of the year with live international DJ, dynamic laser neon visual effects, delicious light mocktails & banana fritters, and a fun Banana Dance-Off with prizes!",
        date: "2026-08-15",
        time: "18:00",
        location: "Campus Sports Arena",
        category: "Social",
        organizer: "Technotrons Administrative Team",
        capacity: 500,
        imageUrl: "/src/assets/images/welcome_party_poster_1784350650181.jpg"
      },
      {
        id: 4,
        title: "AI hands-on with Google Gemini API",
        description: "Practical hands-on developer workshop to learn how to build real-world web applications and integrate generative AI models using the new @google/genai SDK.",
        date: "2026-08-20",
        time: "15:00",
        location: "Computer Lab 3",
        category: "Workshop",
        organizer: "Google Developer Groups (GDG)",
        capacity: 80
      }
    ]).onConflictDoNothing();

    // 4. Seed Locations
    await db.delete(locations);
    await db.insert(locations).values(CAMPUS_LOCATIONS_DATA).onConflictDoNothing();

    // 5. Seed Courses
    await db.insert(courses).values([
      {
        id: 1,
        courseCode: "CS101",
        courseName: "Introduction to Computer Science",
        facultyId: 1,
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:30",
        location: "Lecture Hall A",
        cohort: "CS-A"
      },
      {
        id: 2,
        courseCode: "CS101",
        courseName: "Introduction to Computer Science",
        facultyId: 1,
        dayOfWeek: "Wednesday",
        startTime: "09:00",
        endTime: "10:30",
        location: "Lecture Hall A",
        cohort: "CS-A"
      },
      {
        id: 3,
        courseCode: "CS102",
        courseName: "Data Structures and Algorithms",
        facultyId: 2,
        dayOfWeek: "Tuesday",
        startTime: "11:00",
        endTime: "12:30",
        location: "Lecture Hall B",
        cohort: "CS-A"
      },
      {
        id: 4,
        courseCode: "CS102",
        courseName: "Data Structures and Algorithms",
        facultyId: 2,
        dayOfWeek: "Thursday",
        startTime: "11:00",
        endTime: "12:30",
        location: "Lecture Hall B",
        cohort: "CS-A"
      },
      {
        id: 5,
        courseCode: "EE101",
        courseName: "Basic Electrical Engineering",
        facultyId: 3,
        dayOfWeek: "Monday",
        startTime: "14:00",
        endTime: "15:30",
        location: "Seminar Room 1",
        cohort: "CS-A"
      },
      {
        id: 6,
        courseCode: "EE101",
        courseName: "Basic Electrical Engineering",
        facultyId: 3,
        dayOfWeek: "Wednesday",
        startTime: "14:00",
        endTime: "15:30",
        location: "Seminar Room 1",
        cohort: "CS-A"
      },
      {
        id: 7,
        courseCode: "PH101",
        courseName: "Engineering Physics",
        facultyId: 4,
        dayOfWeek: "Tuesday",
        startTime: "09:00",
        endTime: "10:30",
        location: "Physics Lab",
        cohort: "CS-A"
      },
      {
        id: 8,
        courseCode: "PH101",
        courseName: "Engineering Physics",
        facultyId: 4,
        dayOfWeek: "Friday",
        startTime: "09:00",
        endTime: "10:30",
        location: "Physics Lab",
        cohort: "CS-A"
      }
    ]).onConflictDoNothing();

    // 6. Seed Checklists
    await db.insert(checklists).values([
      {
        id: 1,
        title: "Submit Original Certificates",
        description: "Submit standard qualifications to Academic Block",
        category: "Admission",
        isRequired: true,
        stepOrder: 1
      },
      {
        id: 2,
        title: "Collect Campus ID Card",
        description: "Obtain student ID card from Admin Office, Room 102",
        category: "Admission",
        isRequired: true,
        stepOrder: 2
      },
      {
        id: 3,
        title: "Hostel Room Allocation",
        description: "Collect your room keys from Warden Office",
        category: "Hostel",
        isRequired: false,
        stepOrder: 3
      },
      {
        id: 4,
        title: "Activate Campus Email & Wi-Fi",
        description: "Register MAC address at IT Helpdesk",
        category: "Admission",
        isRequired: true,
        stepOrder: 4
      },
      {
        id: 5,
        title: "Library Card Registration",
        description: "Activate access at the Central Library desk",
        category: "Library",
        isRequired: false,
        stepOrder: 5
      }
    ]).onConflictDoNothing();

    console.log("Database successfully seeded!");
  } catch (error: any) {
    console.warn("[DB FALLBACK] dbSeedAll failed (this is completely fine if database is not set up):", error.message);
  }
}

// 18. High-Performance Personalized Recommendation Engine
export async function dbGetRecommendations(dbUserId: number) {
  try {
    // 1. Fetch user data
    const userResult = await db.select().from(users).where(eq(users.id, dbUserId));
    if (userResult.length === 0) return [];
    const user = userResult[0];

    // 2. Fetch all clubs and events
    const allClubs = await db.select().from(clubs);
    const allEvents = await db.select().from(events);

    // 3. Fetch user's joined clubs
    const memberships = await db.select()
      .from(clubMembers)
      .where(eq(clubMembers.userId, dbUserId));
    const joinedClubIds = new Set(memberships.map(m => m.clubId));
    const joinedClubs = allClubs.filter(c => joinedClubIds.has(c.id));

    // 4. Fetch user's registered events
    const userRegs = await db.select()
      .from(registrations)
      .where(and(eq(registrations.userId, dbUserId), eq(registrations.status, 'registered')));
    const registeredEventIds = new Set(userRegs.map(r => r.eventId));
    const registeredEvents = allEvents.filter(e => registeredEventIds.has(e.id));

    const recommendations: any[] = [];

    // Calculate Event Scores
    const eventScores = allEvents.map(event => {
      // If already registered, don't recommend
      if (registeredEventIds.has(event.id)) {
        return { event, score: -100 };
      }

      let score = 10; // base score

      // Match club affiliations
      const isOrganizerClub = joinedClubs.some(c => event.organizer && event.organizer.toLowerCase().includes(c.name.toLowerCase()));
      if (isOrganizerClub) {
        score += 45;
      }

      // Category matches with joined clubs
      const hasCategoryMatch = joinedClubs.some(c => c.category.toLowerCase() === event.category.toLowerCase());
      if (hasCategoryMatch) {
        score += 30;
      }

      // Past event alignment (same category)
      const registeredCategories = registeredEvents.map(e => e.category.toLowerCase());
      if (registeredCategories.includes(event.category.toLowerCase())) {
        score += 20;
      }

      // Department alignment
      const dept = user.department || "";
      if (dept) {
        const keywords = dept.toLowerCase().split(/\s+/);
        const eventText = (event.title + " " + event.description).toLowerCase();
        const matchesKeywords = keywords.some(k => k.length > 2 && eventText.includes(k));
        if (matchesKeywords) {
          score += 25;
        }
      }

      // Specific event rules
      if (event.title.toLowerCase().includes("gemini") && dept.toLowerCase().includes("computer")) {
        score += 35;
      }

      return { event, score };
    });

    // Calculate Club Scores
    const clubScores = allClubs.map(club => {
      // If already joined, don't recommend
      if (joinedClubIds.has(club.id)) {
        return { club, score: -100 };
      }

      let score = 5; // base score

      // Department alignment (e.g. computer science student loves Tech club)
      const dept = user.department || "";
      if (dept.toLowerCase().includes("computer") && club.category === "Tech") {
        score += 40;
      } else if (dept.toLowerCase().includes("electrical") && club.category === "Tech") {
        score += 30;
      }

      // Event organizer match (if user is registered for their event)
      const hasRegisteredEventFromClub = registeredEvents.some(e => e.organizer && e.organizer.toLowerCase().includes(club.name.toLowerCase()));
      if (hasRegisteredEventFromClub) {
        score += 35;
      }

      // Category match with other joined clubs
      const joinedCategories = joinedClubs.map(c => c.category);
      if (joinedCategories.includes(club.category)) {
        score += 15;
      }

      return { club, score };
    });

    // Filter and Sort Candidate Recommendations
    const validEvents = eventScores.filter(es => es.score > 0).sort((a, b) => b.score - a.score);
    const validClubs = clubScores.filter(cs => cs.score > 0).sort((a, b) => b.score - a.score);

    // Pick top recommendations (prefer events first, up to 3 total)
    let count = 0;
    
    // Add top events
    for (const item of validEvents) {
      if (count >= 3) break;
      
      let justification = "This premium campus activity aligns perfectly with your student profile and orientation goals.";
      const e = item.event;
      
      if (e.title.toLowerCase().includes("gemini")) {
        if (joinedClubIds.has(1)) {
          justification = "As a member of GDG On Campus, this hands-on Gemini workshop is the perfect chance to build your first AI-powered applet!";
        } else if (user.department?.toLowerCase().includes("computer")) {
          justification = `Aligned with your Computer Science major, learning to build with the @google/genai SDK will give you a major head-start in coding!`;
        } else {
          justification = "A premier workshop to learn prompt engineering and build real-world web apps using Google's state-of-the-art Gemini API models.";
        }
      } else if (e.title.toLowerCase().includes("welcome party")) {
        if (registeredEventIds.has(1)) {
          justification = "After completing your orientation, celebrate the start of your university journey at the sports arena with mocktails and the Banana Dance-Off!";
        } else {
          justification = "The ultimate icebreaker social of the year! Connect with fellow freshmen, enjoy neon laser shows, and taste our legendary banana fritters.";
        }
      } else if (e.title.toLowerCase().includes("expo")) {
        if (joinedClubIds.size === 0) {
          justification = "Start your campus life right! Explore over 20+ diverse student societies and find where you belong.";
        } else {
          justification = "Expand your student network! Meet leadership teams from other circles and discover exciting cross-club collaboration opportunities.";
        }
      } else if (e.title.toLowerCase().includes("orientation")) {
        justification = "Essential introductory briefing from our TCE Academic Deans. Meet your department heads and learn key guidelines.";
      } else if (joinedClubs.some(c => e.organizer && e.organizer.toLowerCase().includes(c.name.toLowerCase()))) {
        justification = `Highly recommended since it is hosted by ${e.organizer}, a student organization you are currently active in.`;
      } else if (registeredEvents.some(re => re.category === e.category)) {
        justification = `Since you showed interest in ${e.category} events, this upcoming activity is a highly-rated match for you!`;
      }

      recommendations.push({
        id: e.id,
        type: "event",
        title: e.title,
        justification
      });
      count++;
    }

    // Fill in with clubs if we need more
    for (const item of validClubs) {
      if (count >= 3) break;
      const c = item.club;
      let justification = `A fantastic opportunity to connect with peers and build skills in the ${c.category} sector.`;

      if (c.name.toLowerCase().includes("google")) {
        if (user.department?.toLowerCase().includes("computer")) {
          justification = "An absolute must for your Computer Science major! Build real-world projects and master generative AI with Google technologies.";
        } else {
          justification = "Join the largest tech community on campus to collaborate on web, cloud, and generative AI developer projects.";
        }
      } else if (c.name.toLowerCase().includes("acoustic")) {
        justification = "Unleash your musical talents! Join our acoustic jams, classical sessions, and rock band rehearsals on campus.";
      } else if (c.name.toLowerCase().includes("robotics")) {
        justification = "Get hands-on experience with drone building, automation circuits, and collaborative engineering projects.";
      } else if (c.name.toLowerCase().includes("literary")) {
        justification = "A vibrant home for writers, debate enthusiasts, poetry slam lovers, and book club discussions.";
      }

      recommendations.push({
        id: c.id,
        type: "club",
        title: c.name,
        justification
      });
      count++;
    }

    return recommendations.slice(0, 3);
  } catch (error) {
    console.warn("[DB FALLBACK] dbGetRecommendations failed, generating fallback recommendations:", error);
    return [
      {
        id: 4,
        type: "event",
        title: "AI hands-on with Google Gemini API",
        justification: "Learn practical prompt engineering, thinking models, and API integrations with developer seniors."
      },
      {
        id: 1,
        type: "event",
        title: "Freshers' Orientation Program",
        justification: "Essential introductory briefing from our TCE Academic Deans. Meet your department heads and learn key guidelines."
      },
      {
        id: 1,
        type: "club",
        title: "Google Developer Groups (GDG) On Campus",
        justification: "Join the largest tech community on campus to collaborate on web, cloud, and generative AI developer projects."
      }
    ];
  }
}
