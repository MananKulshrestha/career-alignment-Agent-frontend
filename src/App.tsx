import { AlertTriangle, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { api } from "./api";
import type {
  CompileResult,
  JobIngestResponse,
  JobListItem,
  SelectionPlan,
  TailoringSession,
  UserProfile
} from "./types";
import { Button } from "./components/ui/Button";
import { ProfilePanel } from "./components/panels/ProfilePanel";
import { JobPanel } from "./components/panels/JobPanel";
import { TailoringPanel } from "./components/panels/TailoringPanel";
import "./styles.css";

const SAMPLE_USER_ID = "11111111-1111-4111-8111-111111111111";

const workflowStages = [
  "Profile evidence",
  "Job ingestion",
  "Match filter",
  "Selection review",
  "Template plan",
  "Resume content",
  "Compile artifact"
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
        <div className="action-row" style={{ alignItems: 'flex-end' }}>
          <label className="compact-field">
            <span>User ID</span>
            <input value={userId} onChange={(event) => setUserId(event.target.value)} />
          </label>
          <Button variant="outline" onClick={refreshProfile} isLoading={busy === "profile"} icon={<RefreshCcw size={16} />}>
            Refresh
          </Button>
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
        <section 
          className="message" 
          style={{ 
            backgroundColor: error ? 'var(--error-subtle)' : 'var(--success-subtle)',
            color: error ? 'var(--error)' : 'var(--success)',
            borderColor: error ? 'var(--error)' : 'var(--success)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 500
          }}
        >
          {error ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
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

export default App;
