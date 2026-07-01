import { FormEvent, useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { ProfileItem, ProfileItemKind, UserProfile } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";
import { StatusPill, labelize } from "../ui/StatusPill";
import { TagList, splitCsv } from "../ui/Shared";

const profileKinds: ProfileItemKind[] = [
  "project",
  "experience",
  "skill",
  "education",
  "achievement",
  "certification",
  "research_note"
];

export interface ProfilePanelProps {
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

export function ProfilePanel({ profile, busy, onAdd }: ProfilePanelProps) {
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
    <Card className="span-4">
      <SectionTitle icon={<ClipboardCheck />} title="Profile Evidence" tone="teal" />
      <CardContent>
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
          <Button type="submit" isLoading={busy === "add-profile"} icon={<Plus />}>
            Add evidence
          </Button>
        </form>

        <div className="list-block" style={{ marginTop: '24px' }}>
          <h2>{profile?.items.length ?? 0} evidence items</h2>
          <div className="item-list" style={{ marginTop: '12px' }}>
            {(profile?.items ?? []).map((item) => (
              <EvidenceItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
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
