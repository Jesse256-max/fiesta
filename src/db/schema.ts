import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('student').notNull(), // 'student', 'faculty', 'admin'
  cohort: text('cohort').default('CS-A'), // e.g. 'CS-A', 'CS-B'
  department: text('department').default('Computer Science & Engineering'), // preferred department
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Events Table
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  date: text('date').notNull(), // Format: YYYY-MM-DD
  time: text('time').notNull(), // Format: HH:MM
  location: text('location').notNull(),
  category: text('category').default('General').notNull(), // 'Academic', 'Social', 'Club', 'Sports', 'Workshop'
  organizer: text('organizer'),
  capacity: integer('capacity').default(100).notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Event Registrations Table
export const registrations = pgTable('registrations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: integer('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').default('registered').notNull(), // 'registered', 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Clubs Table
export const clubs = pgTable('clubs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'Tech', 'Music', 'Arts', 'Sports', 'Literary'
  logoUrl: text('logo_url'),
  president: text('president'),
  contactEmail: text('contact_email'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Club Members table
export const clubMembers = pgTable('club_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  clubId: integer('club_id')
    .references(() => clubs.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').default('member').notNull(), // 'president', 'officer', 'member', 'pending'
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Faculty Table
export const faculty = pgTable('faculty', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  department: text('department').notNull(), // 'Computer Science', 'Electrical', 'Mechanical', 'Basic Sciences'
  designation: text('designation').notNull(), // 'Professor', 'Associate Professor', 'Assistant Professor'
  email: text('email').notNull(),
  office: text('office').notNull(),
  hours: text('hours').notNull(), // Office Hours, e.g. "Mon/Wed 2:00 PM - 4:00 PM"
  avatarUrl: text('avatar_url'),
  researchInterests: text('research_interests'), // Research interests
});

// 6.5 Campus Locations Table
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g. "Main Auditorium"
  category: text('category').notNull(), // 'academic', 'library', 'canteen', 'admin', 'hostel', 'sports'
  building: text('building').notNull(), // e.g. "Block B"
  floor: text('floor').notNull(), // e.g. "Ground Floor"
  roomNumber: text('room_number'), // e.g. "Room 404"
  description: text('description').notNull(), // Description of what it is
  coordinatesX: integer('coordinates_x').notNull(), // X coordinate (0-100) for UI positioning
  coordinatesY: integer('coordinates_y').notNull(), // Y coordinate (0-100) for UI positioning
});

// 7. Courses / Timetables Table
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  courseCode: text('course_code').notNull(),
  courseName: text('course_name').notNull(),
  facultyId: integer('faculty_id')
    .references(() => faculty.id, { onDelete: 'set null' }),
  dayOfWeek: text('day_of_week').notNull(), // 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  startTime: text('start_time').notNull(), // Format: HH:MM
  endTime: text('end_time').notNull(), // Format: HH:MM
  location: text('location').notNull(),
  cohort: text('cohort').notNull(), // e.g. 'CS-A', 'CS-B'
});

// 8. Student Courses (Personal schedule subscription)
export const studentCourses = pgTable('student_courses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Registration Checklist Table (Admin tasks or milestones)
export const checklists = pgTable('checklists', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'Admission', 'Hostel', 'Library', 'Documents', 'Finance'
  isRequired: boolean('is_required').default(true).notNull(),
  stepOrder: integer('step_order').notNull(),
});

// 10. User Checklist Progress
export const userChecklists = pgTable('user_checklists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  checklistId: integer('checklist_id')
    .references(() => checklists.id, { onDelete: 'cascade' })
    .notNull(),
  completed: boolean('completed').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 11. Feedbacks Table
export const feedbacks = pgTable('feedbacks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  userName: text('user_name'),
  comment: text('comment').notNull(),
  sentiment: text('sentiment').notNull(), // 'positive', 'neutral', 'negative'
  sentimentLabel: text('sentiment_label'), // e.g. "Excited", "Frustrated", "Neutral", etc.
  suggestions: text('suggestions'), // AI suggestions based on the comment
  rating: integer('rating').notNull(), // 1 to 5 stars
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships Setup for Drizzle
export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(registrations),
  clubMembers: many(clubMembers),
  studentCourses: many(studentCourses),
  userChecklists: many(userChecklists),
  feedbacks: many(feedbacks),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  members: many(clubMembers),
}));

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  user: one(users, {
    fields: [clubMembers.userId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [clubMembers.clubId],
    references: [clubs.id],
  }),
}));

export const facultyRelations = relations(faculty, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(faculty, {
    fields: [courses.facultyId],
    references: [faculty.id],
  }),
  students: many(studentCourses),
}));

export const studentCoursesRelations = relations(studentCourses, ({ one }) => ({
  user: one(users, {
    fields: [studentCourses.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [studentCourses.courseId],
    references: [courses.id],
  }),
}));

export const checklistsRelations = relations(checklists, ({ many }) => ({
  userProgress: many(userChecklists),
}));

export const userChecklistsRelations = relations(userChecklists, ({ one }) => ({
  user: one(users, {
    fields: [userChecklists.userId],
    references: [users.id],
  }),
  checklist: one(checklists, {
    fields: [userChecklists.checklistId],
    references: [checklists.id],
  }),
}));
