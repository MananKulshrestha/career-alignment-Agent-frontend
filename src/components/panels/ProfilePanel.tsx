import { FormEvent, useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { ProfileItem, ProfileItemKind, ProfileItemPayload, UserProfile } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";
import { StatusPill, labelize } from "../ui/StatusPill";
import { TagList } from "../ui/Shared";

const profileKinds: ProfileItemKind[] = [
  "project",
  "experience",
  "skill",
  "education",
  "achievement",
  "certification",
  "research_note"
];

type EvidenceFormState = Record<string, string>;

interface EvidenceField {
  key: string;
  label: string;
  type?: "text" | "date" | "url" | "textarea";
  rows?: number;
}

const kindSourceDefaults: Record<ProfileItemKind, string> = {
  project: "project_backend_tracker",
  experience: "experience_backend_internship",
  skill: "skill_backend_frameworks",
  education: "education_computer_science",
  achievement: "achievement_hackathon_finalist",
  certification: "certification_cloud_practitioner",
  research_note: "research_microsoft_explore",
  preference: "preference_target_roles"
};

const kindDefaults: Record<ProfileItemKind, EvidenceFormState> = {
  project: {
    title: "Backend Job Tracker",
    problem: "Tracking job applications and resume workflow state was unreliable across tools.",
    target_users: "Students and job seekers managing technical applications.",
    role: "Designed and implemented the backend service.",
    tech_stack: "Python, FastAPI, PostgreSQL, Docker, REST",
    architecture: "FastAPI REST API with PostgreSQL persistence and Docker deployment.",
    features: "Profile evidence storage, job ingestion, match tracking",
    measurable_impact: "",
    repo_url: "",
    demo_url: "",
    start_date: "",
    end_date: "",
    collaboration: "",
    constraints_tradeoffs: "",
    description:
      "Built a FastAPI and PostgreSQL job tracker with reliable REST endpoints and Docker deployment."
  },
  experience: {
    job_title: "Backend Developer Intern",
    employer: "Example Company",
    location: "Remote",
    start_date: "",
    end_date: "",
    employment_type: "Internship",
    team_scope: "Backend application workflows and API reliability.",
    responsibilities: "Built REST endpoints\nDebugged API and database issues\nDocumented backend behavior",
    tools_used: "Python, FastAPI, PostgreSQL, Docker, Git",
    outcomes: "",
    promotions_ownership: "",
    cross_functional_work: "",
    description: "Supported backend API work for application workflow features."
  },
  skill: {
    skill_category: "Backend Frameworks",
    skills: "Python, FastAPI, PostgreSQL, Docker, REST",
    proficiency: "Built working projects and backend services with these tools.",
    evidence_source: "Backend Job Tracker project",
    description: "Backend development skills supported by project and API implementation evidence."
  },
  education: {
    school: "Example University",
    degree: "Bachelor of Science in Computer Science",
    location: "",
    start_date: "",
    end_date: "",
    coursework: "Data Structures, Databases, Operating Systems, Software Engineering",
    gpa: "",
    honors: "",
    description: "Studied computer science with coursework relevant to software engineering roles."
  },
  achievement: {
    title: "Hackathon Finalist",
    issuer: "Example Hackathon",
    credential_date: "",
    criteria: "Selected based on project execution, technical depth, and presentation quality.",
    ranking_score: "",
    credential_url: "",
    description: "Reached the final round of a software project competition."
  },
  certification: {
    title: "Cloud Practitioner Certification",
    issuer: "Example Cloud",
    credential_date: "",
    credential_url: "",
    criteria: "Completed certification exam covering cloud fundamentals and deployment concepts.",
    ranking_score: "",
    description: "Earned a cloud fundamentals certification."
  },
  research_note: {
    research_topic: "Microsoft Explore internship research",
    source_name: "Foundit article",
    source_url: "",
    key_findings:
      "Program is built for early CS or engineering students\nEmphasizes practical exposure and collaborative learning",
    relevance: "Use this to align projects and skills with internship-level software engineering evidence.",
    limitations: "Verify current program details against the official Microsoft page before applying.",
    description:
      "Research note about Microsoft Explore internship positioning and relevant resume alignment."
  },
  preference: {
    title: "Backend roles",
    description: "Preference evidence is not collected from this panel."
  }
};

const kindFields: Record<ProfileItemKind, EvidenceField[]> = {
  project: [
    { key: "title", label: "Project name" },
    { key: "problem", label: "Problem solved", type: "textarea", rows: 3 },
    { key: "target_users", label: "Target users" },
    { key: "role", label: "Your role / ownership" },
    { key: "tech_stack", label: "Tech stack" },
    { key: "architecture", label: "Architecture / important build details", type: "textarea", rows: 3 },
    { key: "features", label: "Features built" },
    { key: "measurable_impact", label: "Measurable impact" },
    { key: "repo_url", label: "Repo URL", type: "url" },
    { key: "demo_url", label: "Demo URL", type: "url" },
    { key: "start_date", label: "Start date", type: "date" },
    { key: "end_date", label: "End date", type: "date" },
    { key: "collaboration", label: "Collaboration" },
    { key: "constraints_tradeoffs", label: "Constraints / tradeoffs", type: "textarea", rows: 3 },
    { key: "description", label: "Resume-safe summary", type: "textarea", rows: 4 }
  ],
  experience: [
    { key: "job_title", label: "Role title" },
    { key: "employer", label: "Employer / organization" },
    { key: "location", label: "Location / remote context" },
    { key: "start_date", label: "Start date", type: "date" },
    { key: "end_date", label: "End date", type: "date" },
    { key: "employment_type", label: "Employment type" },
    { key: "team_scope", label: "Team / product scope", type: "textarea", rows: 3 },
    { key: "responsibilities", label: "Responsibilities", type: "textarea", rows: 4 },
    { key: "tools_used", label: "Tools used" },
    { key: "outcomes", label: "Outcomes / impact", type: "textarea", rows: 3 },
    { key: "promotions_ownership", label: "Ownership / promotions" },
    { key: "cross_functional_work", label: "Cross-functional work" },
    { key: "description", label: "Resume-safe summary", type: "textarea", rows: 4 }
  ],
  skill: [
    { key: "skill_category", label: "Skill category" },
    { key: "skills", label: "Concrete skills" },
    { key: "proficiency", label: "Proficiency / recency" },
    { key: "evidence_source", label: "Proof source" },
    { key: "description", label: "Evidence summary", type: "textarea", rows: 4 }
  ],
  education: [
    { key: "school", label: "School" },
    { key: "degree", label: "Degree / program" },
    { key: "location", label: "Location" },
    { key: "start_date", label: "Start date", type: "date" },
    { key: "end_date", label: "Graduation / end date", type: "date" },
    { key: "coursework", label: "Relevant coursework" },
    { key: "gpa", label: "GPA" },
    { key: "honors", label: "Honors" },
    { key: "description", label: "Education summary", type: "textarea", rows: 4 }
  ],
  achievement: [
    { key: "title", label: "Achievement / award" },
    { key: "issuer", label: "Issuer / event" },
    { key: "credential_date", label: "Date", type: "date" },
    { key: "criteria", label: "Criteria / why it was earned", type: "textarea", rows: 3 },
    { key: "ranking_score", label: "Ranking / score / scale" },
    { key: "credential_url", label: "Proof URL", type: "url" },
    { key: "description", label: "Achievement summary", type: "textarea", rows: 4 }
  ],
  certification: [
    { key: "title", label: "Certification name" },
    { key: "issuer", label: "Issuer" },
    { key: "credential_date", label: "Issue / completion date", type: "date" },
    { key: "credential_url", label: "Credential URL", type: "url" },
    { key: "criteria", label: "Exam / criteria", type: "textarea", rows: 3 },
    { key: "ranking_score", label: "Score / credential ID" },
    { key: "description", label: "Certification summary", type: "textarea", rows: 4 }
  ],
  research_note: [
    { key: "research_topic", label: "Research topic" },
    { key: "source_name", label: "Source name" },
    { key: "source_url", label: "Source URL", type: "url" },
    { key: "key_findings", label: "Key findings", type: "textarea", rows: 4 },
    { key: "relevance", label: "Resume / job relevance", type: "textarea", rows: 3 },
    { key: "limitations", label: "Limitations / uncertainty", type: "textarea", rows: 3 },
    { key: "description", label: "Research summary", type: "textarea", rows: 4 }
  ],
  preference: []
};

export interface ProfilePanelProps {
  userId: string;
  profile: UserProfile | null;
  busy: string | null;
  onAdd: (item: {
    kind: ProfileItemKind;
    source_item_id: string;
    payload: ProfileItemPayload;
    is_active: boolean;
  }) => Promise<void>;
}

export function ProfilePanel({ profile, busy, onAdd }: ProfilePanelProps) {
  const [kind, setKind] = useState<ProfileItemKind>("project");
  const [sourceId, setSourceId] = useState(kindSourceDefaults.project);
  const [form, setForm] = useState<EvidenceFormState>(kindDefaults.project);

  function changeKind(nextKind: ProfileItemKind) {
    setKind(nextKind);
    setSourceId(kindSourceDefaults[nextKind]);
    setForm(kindDefaults[nextKind]);
  }

  function updateField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onAdd({
      kind,
      source_item_id: sourceId.trim(),
      payload: buildPayload(kind, form),
      is_active: true
    });
  }

  return (
    <Card className="span-4">
      <SectionTitle icon={<ClipboardCheck />} title="Profile Evidence" tone="teal" />
      <CardContent>
        <form className="stack" onSubmit={submit}>
          <div className="field-row">
            <label>
              <span>Kind</span>
              <select value={kind} onChange={(event) => changeKind(event.target.value as ProfileItemKind)}>
                {profileKinds.map((item) => (
                  <option key={item} value={item}>
                    {labelize(item)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Source ID</span>
              <input value={sourceId} onChange={(event) => setSourceId(event.target.value)} />
            </label>
          </div>

          {kindFields[kind].map((field) => (
            <EvidenceInput
              key={field.key}
              field={field}
              value={form[field.key] ?? ""}
              onChange={(value) => updateField(field.key, value)}
            />
          ))}

          <Button type="submit" isLoading={busy === "add-profile"} icon={<Plus />}>
            Add evidence
          </Button>
        </form>

        <div className="list-block" style={{ marginTop: "24px" }}>
          <h2>{profile?.items.length ?? 0} evidence items</h2>
          <div className="item-list" style={{ marginTop: "12px" }}>
            {(profile?.items ?? []).map((item) => (
              <EvidenceItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceInput({
  field,
  value,
  onChange
}: {
  field: EvidenceField;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputType = field.type ?? "text";
  return (
    <label>
      <span>{field.label}</span>
      {inputType === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={field.rows ?? 3} />
      ) : (
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function buildPayload(kind: ProfileItemKind, form: EvidenceFormState): ProfileItemPayload {
  const description = clean(form.description) || fallbackDescription(kind, form);
  const base = {
    title: clean(form.title),
    organization: clean(form.organization),
    description,
    skills: [] as string[],
    achievements: [] as string[],
    metrics: [] as string[],
    start_date: clean(form.start_date),
    end_date: clean(form.end_date),
    url: clean(form.url),
    location: clean(form.location)
  };

  if (kind === "project") {
    const techStack = splitEvidenceList(form.tech_stack);
    return prunePayload({
      ...base,
      title: clean(form.title),
      skills: techStack,
      tech_stack: techStack,
      problem: clean(form.problem),
      target_users: clean(form.target_users),
      role: clean(form.role),
      architecture: clean(form.architecture),
      features: splitEvidenceList(form.features),
      measurable_impact: clean(form.measurable_impact),
      metrics: splitEvidenceList(form.measurable_impact),
      repo_url: clean(form.repo_url),
      demo_url: clean(form.demo_url),
      url: clean(form.repo_url) || clean(form.demo_url),
      collaboration: clean(form.collaboration),
      constraints_tradeoffs: clean(form.constraints_tradeoffs)
    });
  }

  if (kind === "experience") {
    const tools = splitEvidenceList(form.tools_used);
    return prunePayload({
      ...base,
      title: clean(form.job_title),
      organization: clean(form.employer),
      skills: tools,
      employer: clean(form.employer),
      job_title: clean(form.job_title),
      employment_type: clean(form.employment_type),
      team_scope: clean(form.team_scope),
      responsibilities: splitEvidenceList(form.responsibilities),
      tools_used: tools,
      outcomes: splitEvidenceList(form.outcomes),
      metrics: splitEvidenceList(form.outcomes),
      promotions_ownership: clean(form.promotions_ownership),
      cross_functional_work: clean(form.cross_functional_work)
    });
  }

  if (kind === "skill") {
    return prunePayload({
      ...base,
      title: clean(form.skill_category),
      skills: splitEvidenceList(form.skills),
      skill_category: clean(form.skill_category),
      proficiency: clean(form.proficiency),
      evidence_source: clean(form.evidence_source)
    });
  }

  if (kind === "education") {
    const honors = splitEvidenceList(form.honors);
    return prunePayload({
      ...base,
      title: clean(form.degree),
      organization: clean(form.school),
      school: clean(form.school),
      degree: clean(form.degree),
      coursework: splitEvidenceList(form.coursework),
      gpa: clean(form.gpa),
      honors,
      achievements: honors
    });
  }

  if (kind === "achievement") {
    const rankingScore = clean(form.ranking_score);
    return prunePayload({
      ...base,
      organization: clean(form.issuer),
      issuer: clean(form.issuer),
      criteria: clean(form.criteria),
      ranking_score: rankingScore,
      credential_url: clean(form.credential_url),
      credential_date: clean(form.credential_date),
      url: clean(form.credential_url),
      achievements: clean(form.title) ? [clean(form.title) as string] : [],
      metrics: rankingScore ? [rankingScore] : []
    });
  }

  if (kind === "certification") {
    return prunePayload({
      ...base,
      organization: clean(form.issuer),
      issuer: clean(form.issuer),
      criteria: clean(form.criteria),
      ranking_score: clean(form.ranking_score),
      credential_url: clean(form.credential_url),
      credential_date: clean(form.credential_date),
      url: clean(form.credential_url)
    });
  }

  if (kind === "research_note") {
    return prunePayload({
      ...base,
      title: clean(form.research_topic),
      organization: clean(form.source_name),
      research_topic: clean(form.research_topic),
      source_name: clean(form.source_name),
      source_url: clean(form.source_url),
      url: clean(form.source_url),
      key_findings: splitEvidenceList(form.key_findings),
      relevance: clean(form.relevance),
      limitations: clean(form.limitations)
    });
  }

  return prunePayload(base);
}

function EvidenceItem({ item }: { item: ProfileItem }) {
  const missingGaps = item.payload.evidence_gaps?.filter((gap) => gap.status === "missing") ?? [];
  return (
    <article className="item">
      <div>
        <strong>{evidenceTitle(item)}</strong>
        <p>{item.payload.description}</p>
        <TagList items={evidenceTags(item.payload)} />
        {missingGaps.length ? (
          <div className="evidence-gaps">
            {missingGaps.slice(0, 3).map((gap) => (
              <span key={gap.field_name}>{gap.question}</span>
            ))}
          </div>
        ) : null}
      </div>
      <StatusPill value={item.kind} />
    </article>
  );
}

function evidenceTitle(item: ProfileItem): string {
  const payload = item.payload;
  return (
    payload.title ||
    payload.job_title ||
    payload.degree ||
    payload.skill_category ||
    payload.research_topic ||
    item.source_item_id
  );
}

function evidenceTags(payload: ProfileItemPayload): string[] {
  return [
    ...(payload.skills ?? []),
    ...(payload.tech_stack ?? []),
    ...(payload.tools_used ?? []),
    ...(payload.coursework ?? []),
    ...(payload.key_findings ?? []),
    ...(payload.honors ?? [])
  ].filter(Boolean);
}

function splitEvidenceList(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function clean(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

function fallbackDescription(kind: ProfileItemKind, form: EvidenceFormState): string {
  return (
    clean(form.description) ||
    clean(form.problem) ||
    clean(form.team_scope) ||
    clean(form.criteria) ||
    clean(form.relevance) ||
    clean(form.degree) ||
    clean(form.skills) ||
    `${labelize(kind)} evidence`
  );
}

function prunePayload(payload: ProfileItemPayload): ProfileItemPayload {
  const pruned = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === null || value === undefined) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return true;
    })
  ) as ProfileItemPayload;
  return {
    ...pruned,
    description: payload.description
  };
}
