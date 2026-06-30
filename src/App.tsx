import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardCheck,
  FileText,
  Loader2,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  SquareArrowOutUpRight,
  Trash2
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { api, artifactUrl } from "./api";
import type {
  CompileResult,
  JobIngestResponse,
  JobListItem,
  ProfileItem,
  ProfileItemKind,
  SelectionPlan,
  SubmissionKind,
  TailoringSession,
  UserProfile
} from "./types";

const SAMPLE_USER_ID = "11111111-1111-4111-8111-111111111111";

const profileKinds: ProfileItemKind[] = [
  "project",
  "experience",
  "skill",
  "education",
  "achievement",
  "certification",
  "research_note"
];

const workflowStages = [
  "Profile evidence",
  "Job ingestion",
  "Match filter",
  "Selection review",
  "Template plan",
  "Resume content",
  "Compile artifact"
];

const resumeSections = [
  "summary",
  "education",
  "experience",
  "projects",
  "technical_skills",
  "achievements",
  "certifications"
];

function App() {
  const [userId, setUserId] = useState(SAMPLE_USER_ID);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobList, setJobList] = useState<JobListItem[]>([]);
  const [jobResponse, setJobResponse] = useState<JobIngestResponse | null>(null);
  const [tailoringSession, setTailoringSession] = useState<TailoringSession | null>(null);
  const [selectionDraft, setSelectionDraft] = useState("");
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedJobId = jobResponse?.job.id ?? tailoringSession?.job_id ?? null;

  const activeStage = useMemo(() => {
    if (tailoringSession?.status === "rendered" || tailoringSession?.status === "final_approved") {
      return 6;
    }
    if (tailoringSession?.resume_content) {
      return 5;
    }
    if (tailoringSession?.template_plan) {
      return 4;
    }
    if (tailoringSession?.selection_plan) {
      return 3;
    }
    if (jobResponse?.match) {
      return 2;
    }
    if (jobResponse?.job_spec) {
      return 1;
    }
    return profile?.items.length ? 0 : -1;
  }, [jobResponse, profile, tailoringSession]);

  function resetMessages() {
    setError(null);
    setNotice(null);
  }

  async function runAction<T>(key: string, action: () => Promise<T>, success?: string): Promise<T | null> {
    setBusy(key);
    resetMessages();
    try {
      const result = await action();
      if (success) {
        setNotice(success);
      }
      return result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function refreshProfile() {
    const result = await runAction("profile", () => api.getProfile(userId));
    if (result) {
      setProfile(result);
    }
  }

  async function refreshJobs() {
    const result = await runAction("jobs", () => api.listJobs(userId));
    if (result) {
      setJobList(result);
    }
  }

  async function loadJob(jobId: string) {
    const result = await runAction("load-job", () => api.getJob(jobId, userId), "Job loaded.");
    if (result) {
      setJobResponse(result);
      setTailoringSession(null);
      setCompileResult(null);
      setSelectionDraft("");
    }
  }

  async function startTailoring() {
    if (!selectedJobId) {
      setError("Select an ingested job first.");
      return;
    }
    const result = await runAction(
      "tailoring",
      () => api.createTailoringSession({ user_id: userId, job_id: selectedJobId }),
      "Selection draft created."
    );
    if (result) {
      setTailoringSession(result);
      setSelectionDraft(JSON.stringify(result.selection_plan, null, 2));
    }
  }

  async function approveSelection() {
    if (!tailoringSession) {
      setError("Create a tailoring session first.");
      return;
    }
    let parsed: SelectionPlan;
    try {
      parsed = JSON.parse(selectionDraft) as SelectionPlan;
    } catch {
      setError("Selection JSON is invalid.");
      return;
    }
    const result = await runAction(
      "approve",
      () => api.approveSelection(tailoringSession.id, parsed),
      "Selection approved and template planned."
    );
    if (result) {
      setTailoringSession(result);
      if (result.selection_plan) {
        setSelectionDraft(JSON.stringify(result.selection_plan, null, 2));
      }
    }
  }

  async function generateResume(revisionRequest?: string) {
    if (!tailoringSession) {
      setError("Approve a selection first.");
      return;
    }
    const result = await runAction(
      "generate",
      () => api.generateResume(tailoringSession.id, revisionRequest),
      "Resume content generated."
    );
    if (result) {
      setTailoringSession(result.session);
    }
  }

  async function compileResume() {
    if (!tailoringSession) {
      setError("Generate resume content first.");
      return;
    }
    const result = await runAction(
      "compile",
      () => api.compileResume(tailoringSession.id),
      "Compile run finished."
    );
    if (result) {
      setTailoringSession(result.session);
      setCompileResult(result.compile_result);
    }
  }

  async function approveFinal() {
    if (!tailoringSession) {
      return;
    }
    const result = await runAction(
      "final",
      () => api.approveFinal(tailoringSession.id),
      "Final artifact approved."
    );
    if (result) {
      setTailoringSession(result);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Career Alignment Agent</p>
          <h1>Job Application Workflow</h1>
        </div>
        <div className="topbar-actions">
          <label className="compact-field">
            <span>User ID</span>
            <input value={userId} onChange={(event) => setUserId(event.target.value)} />
          </label>
          <button className="icon-button text-button" onClick={refreshProfile} disabled={busy === "profile"}>
            {busy === "profile" ? <Loader2 className="spin" /> : <RefreshCcw />}
            Refresh
          </button>
        </div>
      </header>

      <section className="workflow-strip" aria-label="Workflow stages">
        {workflowStages.map((stage, index) => (
          <div
            className={`stage ${index <= activeStage ? "stage-active" : ""}`}
            key={stage}
            title={stage}
          >
            <span>{index + 1}</span>
            <strong>{stage}</strong>
          </div>
        ))}
      </section>

      {(error || notice) && (
        <section className={`message ${error ? "message-error" : "message-ok"}`}>
          {error ? <AlertTriangle /> : <ShieldCheck />}
          <span>{error ?? notice}</span>
        </section>
      )}

      <section className="workspace-grid">
        <ProfilePanel
          userId={userId}
          profile={profile}
          busy={busy}
          onAdd={async (item) => {
            const result = await runAction(
              "add-profile",
              () => api.addProfileItem(userId, item),
              "Profile evidence saved."
            );
            if (result) {
              await refreshProfile();
            }
          }}
        />

        <JobPanel
          userId={userId}
          busy={busy}
          jobList={jobList}
          jobResponse={jobResponse}
          onRefreshJobs={refreshJobs}
          onLoadJob={loadJob}
          onIngest={async (input) => {
            const result = await runAction(
              "ingest",
              () => api.ingestJob(input),
              "Job ingested and matched."
            );
            if (result) {
              setJobResponse(result);
              setTailoringSession(null);
              setCompileResult(null);
              setSelectionDraft("");
              setJobList((current) => [
                { job: result.job, match: result.match },
                ...current.filter((item) => item.job.id !== result.job.id)
              ]);
            }
          }}
        />

        <TailoringPanel
          busy={busy}
          jobResponse={jobResponse}
          tailoringSession={tailoringSession}
          selectionDraft={selectionDraft}
          compileResult={compileResult}
          onStart={startTailoring}
          onSelectionDraftChange={setSelectionDraft}
          onApproveSelection={approveSelection}
          onGenerate={generateResume}
          onCompile={compileResume}
          onApproveFinal={approveFinal}
        />
      </section>
    </main>
  );
}

interface ProfilePanelProps {
  userId: string;
  profile: UserProfile | null;
  busy: string | null;
  onAdd: (item: {
    kind: ProfileItemKind;
    source_item_id: string;
    payload: {
      title: string;
      organization: string | null;
      description: string;
      skills: string[];
      achievements: string[];
      metrics: string[];
      url: string | null;
    };
    is_active: boolean;
  }) => Promise<void>;
}

function ProfilePanel({ profile, busy, onAdd }: ProfilePanelProps) {
  const [kind, setKind] = useState<ProfileItemKind>("project");
  const [sourceId, setSourceId] = useState("project_backend_tracker");
  const [title, setTitle] = useState("Backend Job Tracker");
  const [description, setDescription] = useState(
    "Built a FastAPI and PostgreSQL job tracker with reliable REST endpoints and Docker deployment."
  );
  const [skills, setSkills] = useState("Python, FastAPI, PostgreSQL, Docker, REST");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onAdd({
      kind,
      source_item_id: sourceId,
      payload: {
        title,
        organization: null,
        description,
        skills: splitCsv(skills),
        achievements: [],
        metrics: [],
        url: null
      },
      is_active: true
    });
  }

  return (
    <section className="surface span-4">
      <SectionTitle icon={<ClipboardCheck />} title="Profile Evidence" tone="teal" />
      <form className="stack" onSubmit={submit}>
        <div className="field-row">
          <label>
            <span>Kind</span>
            <select value={kind} onChange={(event) => setKind(event.target.value as ProfileItemKind)}>
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
        <label>
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          <span>Description</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
        </label>
        <label>
          <span>Skills</span>
          <input value={skills} onChange={(event) => setSkills(event.target.value)} />
        </label>
        <button className="icon-button primary" type="submit" disabled={busy === "add-profile"}>
          {busy === "add-profile" ? <Loader2 className="spin" /> : <Plus />}
          Add evidence
        </button>
      </form>

      <div className="list-block">
        <h2>{profile?.items.length ?? 0} evidence items</h2>
        <div className="item-list">
          {(profile?.items ?? []).map((item) => (
            <EvidenceItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface JobPanelProps {
  userId: string;
  busy: string | null;
  jobList: JobListItem[];
  jobResponse: JobIngestResponse | null;
  onRefreshJobs: () => Promise<void>;
  onLoadJob: (jobId: string) => Promise<void>;
  onIngest: (input: {
    user_id: string;
    kind: SubmissionKind;
    url?: string | null;
    query?: string | null;
    pasted_text?: string | null;
    match_threshold: number;
  }) => Promise<void>;
}

function JobPanel({
  userId,
  busy,
  jobList,
  jobResponse,
  onRefreshJobs,
  onLoadJob,
  onIngest
}: JobPanelProps) {
  const [kind, setKind] = useState<SubmissionKind>("text");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [pastedText, setPastedText] = useState(
    "Backend Engineer at ExampleCo\nCompany: ExampleCo\nWe need Python, FastAPI, PostgreSQL, REST, and Docker. You will build reliable APIs for application workflows."
  );
  const [threshold, setThreshold] = useState(0.65);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onIngest({
      user_id: userId,
      kind,
      url: kind === "url" ? url : null,
      query: kind === "query" ? query : null,
      pasted_text: kind === "text" ? pastedText : null,
      match_threshold: threshold
    });
  }

  return (
    <section className="surface span-4">
      <SectionTitle icon={<FileText />} title="Job Intake" tone="blue" />
      <form className="stack" onSubmit={submit}>
        <div className="segmented" role="tablist" aria-label="Submission kind">
          {(["text", "url", "query"] as SubmissionKind[]).map((item) => (
            <button
              className={kind === item ? "selected" : ""}
              key={item}
              onClick={() => setKind(item)}
              type="button"
            >
              {labelize(item)}
            </button>
          ))}
        </div>

        {kind === "url" && (
          <label>
            <span>Job URL</span>
            <input value={url} onChange={(event) => setUrl(event.target.value)} />
          </label>
        )}
        {kind === "query" && (
          <label>
            <span>Job query</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        )}
        {kind === "text" && (
          <label>
            <span>Pasted posting</span>
            <textarea value={pastedText} onChange={(event) => setPastedText(event.target.value)} rows={7} />
          </label>
        )}

        <label>
          <span>Match threshold: {threshold.toFixed(2)}</span>
          <input
            min="0"
            max="1"
            step="0.05"
            type="range"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
          />
        </label>

        <button className="icon-button primary" type="submit" disabled={busy === "ingest"}>
          {busy === "ingest" ? <Loader2 className="spin" /> : <Send />}
          Ingest job
        </button>
      </form>

      <div className="result-block">
        <div className="result-heading">
          <h2>Job Pipeline</h2>
          <button className="icon-button text-button" onClick={onRefreshJobs} disabled={busy === "jobs"}>
            {busy === "jobs" ? <Loader2 className="spin" /> : <RefreshCcw />}
            Refresh
          </button>
        </div>
        {jobList.length ? (
          <div className="item-list">
            {jobList.map((item) => (
              <article className="item" key={item.job.id}>
                <div>
                  <strong>{item.job.title}</strong>
                  <p>{item.job.company}</p>
                  <TagList
                    items={[
                      item.match?.match_verdict ?? "unmatched",
                      item.match?.tailoring_status ?? item.job.status,
                      item.match?.application_status ?? "not_started"
                    ]}
                  />
                </div>
                <div className="pipeline-actions">
                  <StatusPill value={item.match?.saved_status ?? item.job.status} />
                  <button
                    className="icon-button text-button"
                    onClick={() => onLoadJob(item.job.id)}
                    disabled={busy === "load-job"}
                  >
                    <SquareArrowOutUpRight />
                    Open
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">No jobs loaded.</p>
        )}
      </div>

      {jobResponse && (
        <div className="result-block">
          <div className="result-heading">
            <div>
              <h2>{jobResponse.job.title}</h2>
              <p>{jobResponse.job.company}</p>
            </div>
            <StatusPill value={jobResponse.job_spec.extraction.risk} />
          </div>
          <MetricGrid
            metrics={[
              ["Verdict", jobResponse.match?.match_verdict ?? "pending"],
              ["Score", jobResponse.match ? jobResponse.match.match_score.toFixed(2) : "pending"],
              ["Remote", jobResponse.job_spec.remote_policy],
              ["Seniority", jobResponse.job_spec.seniority]
            ]}
          />
          <TagList items={jobResponse.job_spec.required_skills.map((skill) => skill.name)} />
          <JsonDetails title="job_spec" value={jobResponse.job_spec} />
        </div>
      )}
    </section>
  );
}

interface TailoringPanelProps {
  busy: string | null;
  jobResponse: JobIngestResponse | null;
  tailoringSession: TailoringSession | null;
  selectionDraft: string;
  compileResult: CompileResult | null;
  onStart: () => Promise<void>;
  onSelectionDraftChange: (value: string) => void;
  onApproveSelection: () => Promise<void>;
  onGenerate: (revisionRequest?: string) => Promise<void>;
  onCompile: () => Promise<void>;
  onApproveFinal: () => Promise<void>;
}

function TailoringPanel({
  busy,
  jobResponse,
  tailoringSession,
  selectionDraft,
  compileResult,
  onStart,
  onSelectionDraftChange,
  onApproveSelection,
  onGenerate,
  onCompile,
  onApproveFinal
}: TailoringPanelProps) {
  const [revisionRequest, setRevisionRequest] = useState("");
  const editableSelection = useMemo(() => {
    if (!selectionDraft.trim()) {
      return tailoringSession?.selection_plan ?? null;
    }
    try {
      return JSON.parse(selectionDraft) as SelectionPlan;
    } catch {
      return null;
    }
  }, [selectionDraft, tailoringSession?.selection_plan]);

  function updateSelectionDraft(plan: SelectionPlan) {
    onSelectionDraftChange(JSON.stringify(plan, null, 2));
  }

  return (
    <section className="surface span-4">
      <SectionTitle icon={<Sparkles />} title="Resume Tailoring" tone="amber" />
      <div className="action-row">
        <button className="icon-button primary" onClick={onStart} disabled={!jobResponse || busy === "tailoring"}>
          {busy === "tailoring" ? <Loader2 className="spin" /> : <Play />}
          Start selection
        </button>
        <StatusPill value={tailoringSession?.status ?? "not_started"} />
      </div>

      {tailoringSession?.selection_plan && (
        <div className="result-block">
          <div className="result-heading">
            <div>
              <h2>Selection Plan</h2>
              <p>{(editableSelection ?? tailoringSession.selection_plan).page_target}</p>
            </div>
            <StatusPill value={`${(editableSelection ?? tailoringSession.selection_plan).section_order.length} sections`} />
          </div>
          <SelectionSummary selectionPlan={editableSelection ?? tailoringSession.selection_plan} />
          {editableSelection ? (
            <SelectionEditor selectionPlan={editableSelection} onChange={updateSelectionDraft} />
          ) : (
            <p className="empty-note">Selection JSON is invalid.</p>
          )}
          <textarea
            className="json-editor"
            value={selectionDraft}
            onChange={(event) => onSelectionDraftChange(event.target.value)}
            rows={12}
          />
          <button className="icon-button primary" onClick={onApproveSelection} disabled={busy === "approve"}>
            {busy === "approve" ? <Loader2 className="spin" /> : <Check />}
            Approve selection
          </button>
        </div>
      )}

      {tailoringSession?.template_plan && (
        <div className="result-block">
          <MetricGrid
            metrics={[
              ["Template", tailoringSession.template_plan.template_family],
              ["Placeholders", String(tailoringSession.template_plan.placeholders.length)],
              ["ATS readable", String(tailoringSession.template_plan.latex_rules.ats_readable)],
              ["Raw LaTeX", String(tailoringSession.template_plan.latex_rules.allow_raw_latex_from_model)]
            ]}
          />
          <label>
            <span>Revision request</span>
            <textarea
              value={revisionRequest}
              onChange={(event) => setRevisionRequest(event.target.value)}
              rows={3}
            />
          </label>
          <button className="icon-button primary" onClick={() => onGenerate(revisionRequest)} disabled={busy === "generate"}>
            {busy === "generate" ? <Loader2 className="spin" /> : <Sparkles />}
            Generate content
          </button>
        </div>
      )}

      {tailoringSession?.resume_content && (
        <div className="result-block">
          <h2>Resume Content</h2>
          <div className="item-list">
            {tailoringSession.resume_content.placeholder_values.map((value) => (
              <article className="item" key={value.placeholder_id}>
                <div>
                  <strong>{value.placeholder_id}</strong>
                  <p>{value.text}</p>
                </div>
                <StatusPill value={value.claim_strength} />
              </article>
            ))}
          </div>
          <button className="icon-button primary" onClick={onCompile} disabled={busy === "compile"}>
            {busy === "compile" ? <Loader2 className="spin" /> : <FileText />}
            Compile PDF
          </button>
        </div>
      )}

      {compileResult && (
        <div className="result-block">
          <div className="result-heading">
            <div>
              <h2>Compile Result</h2>
              <p>{compileResult.pdf_path ?? compileResult.tex_path ?? "No artifact path"}</p>
            </div>
            <StatusPill value={compileResult.success ? "success" : "failed"} />
          </div>
          {!compileResult.success && <pre className="log-output">{compileResult.compiler_output}</pre>}
          {compileResult.success && tailoringSession && (
            <a className="icon-button text-button link-button" href={artifactUrl(tailoringSession.id)} target="_blank">
              <SquareArrowOutUpRight />
              Open PDF
            </a>
          )}
          <button className="icon-button primary" onClick={onApproveFinal} disabled={!compileResult.success || busy === "final"}>
            {busy === "final" ? <Loader2 className="spin" /> : <Save />}
            Approve final
          </button>
        </div>
      )}
    </section>
  );
}

function SectionTitle({
  icon,
  title,
  tone
}: {
  icon: React.ReactNode;
  title: string;
  tone: "teal" | "blue" | "amber";
}) {
  return (
    <div className={`section-title tone-${tone}`}>
      <span>{icon}</span>
      <h2>{title}</h2>
    </div>
  );
}

function EvidenceItem({ item }: { item: ProfileItem }) {
  return (
    <article className="item">
      <div>
        <strong>{item.payload.title || item.source_item_id}</strong>
        <p>{item.payload.description}</p>
        <TagList items={item.payload.skills} />
      </div>
      <StatusPill value={item.kind} />
    </article>
  );
}

function SelectionSummary({ selectionPlan }: { selectionPlan: SelectionPlan }) {
  const selectedCount = Object.values(selectionPlan.selected_item_ids).reduce(
    (total, ids) => total + ids.length,
    0
  );

  return (
    <div className="review-grid">
      <div className="review-box">
        <h3>Selected Evidence</h3>
        <MetricGrid
          metrics={[
            ["Items", String(selectedCount)],
            ["Sections", selectionPlan.section_order.join(", ") || "none"],
            ["Page target", labelize(selectionPlan.page_target)],
            ["Keywords", String(selectionPlan.target_keywords_covered.length)]
          ]}
        />
        <div className="item-list compact-list">
          {selectionPlan.reasons.slice(0, 5).map((reason) => (
            <article className="item" key={reason.item_id}>
              <div>
                <strong>{reason.item_id}</strong>
                <p>{reason.reason}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="review-box">
        <h3>Missing Requirements</h3>
        {selectionPlan.missing_requirements.length ? (
          <div className="item-list compact-list">
            {selectionPlan.missing_requirements.map((gap) => (
              <article className="item gap-item" key={gap.requirement}>
                <div>
                  <strong>{gap.requirement}</strong>
                  <p>{gap.resume_policy}</p>
                  <TagList items={gap.adjacent_evidence_item_ids} />
                </div>
                <StatusPill value={gap.status} />
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">No missing requirements reported.</p>
        )}
      </div>
    </div>
  );
}

function SelectionEditor({
  selectionPlan,
  onChange
}: {
  selectionPlan: SelectionPlan;
  onChange: (selectionPlan: SelectionPlan) => void;
}) {
  const [addSection, setAddSection] = useState("projects");
  const [addSourceId, setAddSourceId] = useState("");

  function setPageTarget(pageTarget: SelectionPlan["page_target"]) {
    onChange({ ...selectionPlan, page_target: pageTarget });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectionPlan.section_order.length) {
      return;
    }
    const sectionOrder = [...selectionPlan.section_order];
    [sectionOrder[index], sectionOrder[nextIndex]] = [sectionOrder[nextIndex], sectionOrder[index]];
    onChange({ ...selectionPlan, section_order: sectionOrder });
  }

  function removeSelectedItem(section: string, itemId: string) {
    const selectedItemIds = {
      ...selectionPlan.selected_item_ids,
      [section]: (selectionPlan.selected_item_ids[section] ?? []).filter((id) => id !== itemId)
    };
    const stillSelected = new Set(Object.values(selectedItemIds).flat());
    onChange({
      ...selectionPlan,
      selected_item_ids: selectedItemIds,
      reasons: selectionPlan.reasons.filter((reason) => stillSelected.has(reason.item_id))
    });
  }

  function addSelectedItem() {
    const sourceId = addSourceId.trim();
    if (!sourceId) {
      return;
    }
    const currentIds = selectionPlan.selected_item_ids[addSection] ?? [];
    const selectedItemIds = {
      ...selectionPlan.selected_item_ids,
      [addSection]: currentIds.includes(sourceId) ? currentIds : [...currentIds, sourceId]
    };
    const sectionOrder = selectionPlan.section_order.includes(addSection)
      ? selectionPlan.section_order
      : [...selectionPlan.section_order, addSection];
    const reasons = selectionPlan.reasons.some((reason) => reason.item_id === sourceId)
      ? selectionPlan.reasons
      : [
          ...selectionPlan.reasons,
          {
            item_id: sourceId,
            reason: `Approved source for ${labelize(addSection)}.`
          }
        ];

    onChange({
      ...selectionPlan,
      section_order: sectionOrder,
      selected_item_ids: selectedItemIds,
      reasons
    });
    setAddSourceId("");
  }

  const selectedEntries = Object.entries(selectionPlan.selected_item_ids).filter(
    ([, itemIds]) => itemIds.length
  );

  return (
    <div className="selection-tools">
      <div className="review-box">
        <h3>Page Target</h3>
        <div className="segmented segmented-compact" role="tablist" aria-label="Page target">
          {(["one_page", "two_page", "unspecified"] as SelectionPlan["page_target"][]).map(
            (target) => (
              <button
                className={selectionPlan.page_target === target ? "selected" : ""}
                key={target}
                onClick={() => setPageTarget(target)}
                type="button"
              >
                {labelize(target)}
              </button>
            )
          )}
        </div>
      </div>

      <div className="review-box">
        <h3>Section Order</h3>
        <div className="section-order-list">
          {selectionPlan.section_order.map((section, index) => (
            <div className="section-order-row" key={section}>
              <span>{labelize(section)}</span>
              <div>
                <button
                  aria-label={`Move ${labelize(section)} up`}
                  className="icon-button text-button square-button"
                  disabled={index === 0}
                  onClick={() => moveSection(index, -1)}
                  title={`Move ${labelize(section)} up`}
                  type="button"
                >
                  <ArrowUp />
                </button>
                <button
                  aria-label={`Move ${labelize(section)} down`}
                  className="icon-button text-button square-button"
                  disabled={index === selectionPlan.section_order.length - 1}
                  onClick={() => moveSection(index, 1)}
                  title={`Move ${labelize(section)} down`}
                  type="button"
                >
                  <ArrowDown />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="review-box selection-wide">
        <h3>Selected Items</h3>
        {selectedEntries.length ? (
          <div className="selected-item-grid">
            {selectedEntries.map(([section, itemIds]) =>
              itemIds.map((itemId) => (
                <div className="selected-item-row" key={`${section}-${itemId}`}>
                  <div>
                    <strong>{itemId}</strong>
                    <span>{labelize(section)}</span>
                  </div>
                  <button
                    aria-label={`Remove ${itemId}`}
                    className="icon-button text-button square-button"
                    onClick={() => removeSelectedItem(section, itemId)}
                    title={`Remove ${itemId}`}
                    type="button"
                  >
                    <Trash2 />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="empty-note">No selected source items.</p>
        )}
      </div>

      <div className="review-box selection-wide">
        <h3>Add Source Item</h3>
        <div className="inline-editor">
          <label>
            <span>Section</span>
            <select value={addSection} onChange={(event) => setAddSection(event.target.value)}>
              {resumeSections.map((section) => (
                <option key={section} value={section}>
                  {labelize(section)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Source ID</span>
            <input value={addSourceId} onChange={(event) => setAddSourceId(event.target.value)} />
          </label>
          <button className="icon-button text-button" onClick={addSelectedItem} type="button">
            <Plus />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: Array<[string, string]> }) {
  return (
    <dl className="metric-grid">
      {metrics.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }
  return (
    <div className="tag-list">
      {items.slice(0, 12).map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function JsonDetails({ title, value }: { title: string; value: unknown }) {
  return (
    <details className="json-details">
      <summary>{title}</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = normalized.includes("fail") || normalized.includes("rejected")
    ? "bad"
    : normalized.includes("success") || normalized.includes("approved") || normalized.includes("strong")
      ? "good"
      : normalized.includes("low") || normalized.includes("draft")
        ? "info"
        : "neutral";

  return <span className={`status-pill status-${tone}`}>{labelize(value)}</span>;
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function labelize(value: string): string {
  return value.replace(/_/g, " ");
}

export default App;
