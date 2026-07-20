export interface User {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  role: string;
  cohort: string | null;
  department: string | null;
  createdAt: string;
}

export interface CampusEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  organizer: string | null;
  capacity: number;
  imageUrl: string | null;
  registered: boolean;
  createdAt: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  logoUrl: string | null;
  president: string | null;
  contactEmail: string | null;
  membershipStatus: 'none' | 'member' | 'pending';
  createdAt: string;
}

export interface FacultyMember {
  id: number;
  name: string;
  department: string;
  designation: string;
  email: string;
  office: string;
  hours: string;
  avatarUrl: string | null;
  researchInterests: string | null;
}

export interface CampusLocation {
  id: number;
  name: string;
  category: 'academic' | 'library' | 'canteen' | 'admin' | 'hostel' | 'sports';
  building: string;
  floor: string;
  roomNumber: string | null;
  description: string;
  coordinatesX: number;
  coordinatesY: number;
}

export interface TimetableCourse {
  id: number;
  courseCode: string;
  courseName: string;
  facultyId: number | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
  cohort: string;
  isSubscribed?: boolean;
}

export interface ChecklistItem {
  id: number;
  title: string;
  description: string;
  category: string;
  isRequired: boolean;
  stepOrder: number;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinking?: boolean;
  groundingMetadata?: any;
}

export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface CampusNews {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  imageUrl: string | null;
  category: string;
  author: string;
}

