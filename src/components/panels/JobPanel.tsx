import { FormEvent, useState } from "react";
import { FileText, RefreshCcw, Send, SquareArrowOutUpRight } from "lucide-react";
import { JobIngestResponse, JobListItem, SubmissionKind } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";
import { StatusPill, labelize } from "../ui/StatusPill";
import { MetricGrid, TagList, JsonDetails } from "../ui/Shared";

export interface JobPanelProps {
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

export function JobPanel({
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
    <Card className="span-4">
      <SectionTitle icon={<FileText />} title="Job Intake" tone="blue" />
      <CardContent>
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

          <Button type="submit" isLoading={busy === "ingest"} icon={<Send />}>
            Ingest job
          </Button>
        </form>

        <div className="result-block" style={{ marginTop: '32px' }}>
          <div className="result-heading">
            <h2>Job Pipeline</h2>
            <Button variant="ghost" size="sm" onClick={onRefreshJobs} isLoading={busy === "jobs"} icon={<RefreshCcw size={14} />}>
              Refresh
            </Button>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoadJob(item.job.id)}
                      isLoading={busy === "load-job"}
                      icon={<SquareArrowOutUpRight size={14} />}
                    >
                      Open
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-note">No jobs loaded.</p>
          )}
        </div>

        {jobResponse && (
          <div className="result-block" style={{ marginTop: '32px' }}>
            <div className="result-heading">
              <div>
                <h2>{jobResponse.job.title}</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {jobResponse.job.company}
                </p>
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
            <div style={{ marginTop: '16px' }}>
              <JsonDetails title="job_spec" value={jobResponse.job_spec} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
