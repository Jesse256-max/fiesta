/**
 * Centralized API client service for the FastAPI Backend
 */

const BASE_URL = "/api";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("firebase_id_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `API Request failed with status ${response.status}`);
  }

  return response.json();
}

export const apiService = {
  // Auth
  login: (data: any) => fetchApi("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: any) => fetchApi("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  syncUser: (name?: string) => fetchApi("/users/sync", { method: "POST", body: JSON.stringify({ name }) }),

  // Events & Clubs
  getEvents: () => fetchApi("/events"),
  registerEvent: (id: number) => fetchApi(`/events/${id}/register`, { method: "POST" }),
  cancelEvent: (id: number) => fetchApi(`/events/${id}/cancel`, { method: "POST" }),
  getClubs: () => fetchApi("/clubs"),
  joinClub: (id: number) => fetchApi(`/clubs/${id}/join`, { method: "POST" }),

  // Faculty, Locations, Timetable & Checklist
  getFaculty: () => fetchApi("/faculty"),
  getLocations: () => fetchApi("/locations"),
  getTimetable: () => fetchApi("/timetable"),
  getChecklist: () => fetchApi("/checklist"),
  toggleChecklist: (id: number, completed: boolean) => fetchApi(`/checklist/${id}/toggle`, { method: "POST", body: JSON.stringify({ completed }) }),

  // Feedback & News
  getFeedbacks: () => fetchApi("/feedbacks"),
  addFeedback: (data: { comment: string; rating: number }) => fetchApi("/feedbacks", { method: "POST", body: JSON.stringify(data) }),
  getNews: () => fetchApi("/news"),

  // AI Services
  sendChat: (data: any) => fetchApi("/chat", { method: "POST", body: JSON.stringify(data) }),
  generateImage: (data: any) => fetchApi("/ai/image", { method: "POST", body: JSON.stringify(data) }),
  generateVideo: (data: any) => fetchApi("/ai/video", { method: "POST", body: JSON.stringify(data) }),
  generateMusic: (data: any) => fetchApi("/ai/music", { method: "POST", body: JSON.stringify(data) }),
  analyzeMedia: (data: any) => fetchApi("/ai/analyze", { method: "POST", body: JSON.stringify(data) }),
  transcribeAudio: (data: any) => fetchApi("/ai/transcribe", { method: "POST", body: JSON.stringify(data) }),
};
