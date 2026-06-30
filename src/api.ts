import type {
  JobIngestResponse,
  JobListItem,
  ProfileItem,
  ProfileItemKind,
  ProfileItemPayload,
  CompileResult,
  ResumeContent,
  SubmissionKind,
  TailoringSession,
  UserProfile
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export function artifactUrl(sessionId: string): string {
  return `${API_BASE_URL}/tailoring/sessions/${sessionId}/artifact/pdf`;
}

interface ApiErrorPayload {
  detail?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const api = {
  getProfile(userId: string): Promise<UserProfile> {
    return request<UserProfile>(`/profiles/${userId}`);
  },

  addProfileItem(
    userId: string,
    input: {
      kind: ProfileItemKind;
      source_item_id: string;
      payload: ProfileItemPayload;
      is_active: boolean;
    }
  ): Promise<ProfileItem> {
    return request<ProfileItem>(`/profiles/${userId}/items`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  ingestJob(input: {
    user_id: string;
    kind: SubmissionKind;
    url?: string | null;
    query?: string | null;
    pasted_text?: string | null;
    match_threshold: number;
  }): Promise<JobIngestResponse> {
    return request<JobIngestResponse>("/jobs/ingest", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  listJobs(userId: string): Promise<JobListItem[]> {
    return request<JobListItem[]>(`/jobs?user_id=${encodeURIComponent(userId)}`);
  },

  getJob(jobId: string, userId: string): Promise<JobIngestResponse> {
    return request<JobIngestResponse>(
      `/jobs/${jobId}?user_id=${encodeURIComponent(userId)}`
    );
  },

  createTailoringSession(input: {
    user_id: string;
    job_id: string;
    revision_notes?: string | null;
  }): Promise<TailoringSession> {
    return request<TailoringSession>("/tailoring/sessions", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  approveSelection(sessionId: string, selectionPlan: unknown): Promise<TailoringSession> {
    return request<TailoringSession>(`/tailoring/sessions/${sessionId}/approve-selection`, {
      method: "POST",
      body: JSON.stringify({
        selection_plan: selectionPlan,
        approved_by_user: true
      })
    });
  },

  generateResume(sessionId: string, revisionRequest?: string): Promise<{
    session: TailoringSession;
    resume_content: ResumeContent;
  }> {
    return request(`/tailoring/sessions/${sessionId}/generate`, {
      method: "POST",
      body: JSON.stringify({
        revision_request: revisionRequest || null
      })
    });
  },

  compileResume(sessionId: string): Promise<{
    session: TailoringSession;
    compile_result: CompileResult;
  }> {
    return request(`/tailoring/sessions/${sessionId}/compile`, {
      method: "POST"
    });
  },

  approveFinal(sessionId: string): Promise<TailoringSession> {
    return request<TailoringSession>(`/tailoring/sessions/${sessionId}/approve-final`, {
      method: "POST"
    });
  }
};
