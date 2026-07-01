export type SubmissionKind = "url" | "query" | "text";

export type TailoringStatus =
  | "not_started"
  | "selection_draft"
  | "selection_approved"
  | "content_draft"
  | "compile_failed"
  | "rendered"
  | "final_approved";

export type ProfileItemKind =
  | "skill"
  | "experience"
  | "project"
  | "achievement"
  | "certification"
  | "education"
  | "research_note"
  | "preference";

export interface ProfileItemPayload {
  title?: string | null;
  organization?: string | null;
  description: string;
  skills?: string[];
  achievements?: string[];
  metrics?: string[];
  start_date?: string | null;
  end_date?: string | null;
  url?: string | null;
  location?: string | null;
  problem?: string | null;
  target_users?: string | null;
  role?: string | null;
  tech_stack?: string[];
  architecture?: string | null;
  features?: string[];
  measurable_impact?: string | null;
  repo_url?: string | null;
  demo_url?: string | null;
  collaboration?: string | null;
  constraints_tradeoffs?: string | null;
  employer?: string | null;
  job_title?: string | null;
  employment_type?: string | null;
  team_scope?: string | null;
  responsibilities?: string[];
  tools_used?: string[];
  outcomes?: string[];
  promotions_ownership?: string | null;
  cross_functional_work?: string | null;
  school?: string | null;
  degree?: string | null;
  coursework?: string[];
  gpa?: string | null;
  honors?: string[];
  skill_category?: string | null;
  proficiency?: string | null;
  evidence_source?: string | null;
  issuer?: string | null;
  criteria?: string | null;
  ranking_score?: string | null;
  credential_url?: string | null;
  credential_date?: string | null;
  research_topic?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  key_findings?: string[];
  relevance?: string | null;
  limitations?: string | null;
  evidence_gaps?: Array<{
    field_name: string;
    question: string;
    status: "missing" | "answered" | "not_applicable";
    answer?: string | null;
  }>;
}

export interface ProfileItem {
  id: string;
  user_id: string;
  kind: ProfileItemKind;
  source_item_id: string;
  payload: ProfileItemPayload;
  is_active: boolean;
}

export interface UserProfile {
  user_id: string;
  items: ProfileItem[];
}

export interface SkillRequirement {
  name: string;
  requirement_type: "explicit" | "inferred" | "uncertain";
  source_section: string | null;
  source_snippet: string | null;
  confidence: number;
}

export interface TextRequirement {
  text: string;
  requirement_type: "explicit" | "inferred" | "uncertain";
  source_section: string | null;
  source_snippet: string | null;
  confidence: number;
}

export interface JobSpec {
  job_id: string;
  schema_version: "1.0";
  source_url: string;
  title: string;
  company: string;
  location: string | null;
  remote_policy: "remote" | "hybrid" | "onsite" | "unknown";
  seniority: "internship" | "entry" | "mid" | "senior" | "unknown";
  required_skills: SkillRequirement[];
  nice_to_have_skills: SkillRequirement[];
  responsibilities: TextRequirement[];
  qualifications: TextRequirement[];
  ats_keywords: string[];
  company_domain_context: string[];
  constraints: {
    resume_length: "one_page" | "two_page" | "unspecified";
    file_type: "pdf" | "docx" | "unspecified";
    location_restrictions: string[];
  };
  application_deadline: string | null;
  salary: {
    min: number | null;
    max: number | null;
    currency: string | null;
    period: "annual" | "monthly" | "hourly" | "unknown";
  };
  extraction: {
    risk: "low" | "medium" | "high";
    model: string;
    verified: boolean;
    parsed_at: string;
  };
  parsed_markdown: string;
  raw_text_fallback: string | null;
}

export interface JobRead {
  id: string;
  title: string;
  company: string;
  canonical_url: string | null;
  source_hash: string;
  status: string;
}

export interface UserJobMatch {
  id: string;
  user_id: string;
  job_id: string;
  match_score: number;
  match_verdict: "strong" | "good" | "weak" | "rejected" | "needs_review";
  preference_failures: string[];
  missing_requirements: Array<Record<string, unknown>>;
  adjacent_evidence: Array<Record<string, unknown>>;
  short_explanation: string;
  saved_status: "new" | "saved" | "dismissed" | "archived";
  application_status:
    | "not_started"
    | "drafting"
    | "applied"
    | "interviewing"
    | "offer"
    | "rejected"
    | "archived";
  tailoring_status: TailoringStatus;
}

export interface JobIngestResponse {
  job: JobRead;
  job_spec: JobSpec;
  reused_existing_job: boolean;
  match: UserJobMatch | null;
}

export interface JobListItem {
  job: JobRead;
  match: UserJobMatch | null;
}

export interface SelectionPlan {
  section_order: string[];
  page_target: "one_page" | "two_page" | "unspecified";
  selected_item_ids: Record<string, string[]>;
  reasons: Array<{ item_id: string; reason: string }>;
  target_keywords_covered: string[];
  missing_requirements: Array<{
    requirement: string;
    status: "supported" | "adjacent" | "not_supported" | "needs_user_input";
    adjacent_evidence_item_ids: string[];
    resume_policy: string;
  }>;
}

export interface TemplatePlan {
  template_family: string;
  page_target: "one_page" | "two_page" | "unspecified";
  section_order: string[];
  placeholders: Array<{
    placeholder_id: string;
    source_item_id: string;
    max_words: number;
    content_type: string;
  }>;
  latex_rules: {
    escape_special_chars: boolean;
    allow_raw_latex_from_model: boolean;
    ats_readable: boolean;
  };
}

export interface ResumeContent {
  placeholder_values: Array<{
    placeholder_id: string;
    text: string;
    source_item_ids: string[];
    claim_strength: "conservative" | "balanced" | "assertive";
  }>;
  warnings: Array<{ type: string; message: string }>;
}

export interface TailoringSession {
  id: string;
  user_id: string;
  job_id: string;
  status: TailoringStatus;
  selection_plan: SelectionPlan | null;
  template_plan: TemplatePlan | null;
  resume_content: ResumeContent | null;
}

export interface CompileResult {
  success: boolean;
  pdf_path: string | null;
  tex_path: string | null;
  log_path: string | null;
  page_count: number | null;
  compiler_output: string;
  repair_attempted: boolean;
}
