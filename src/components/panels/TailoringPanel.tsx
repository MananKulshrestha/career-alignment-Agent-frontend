import { useMemo, useState } from "react";
import { Check, FileText, Play, Save, Sparkles, SquareArrowOutUpRight, ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { CompileResult, JobIngestResponse, SelectionPlan, TailoringSession } from "../../types";
import { artifactUrl } from "../../api";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";
import { StatusPill, labelize } from "../ui/StatusPill";
import { MetricGrid, TagList } from "../ui/Shared";

export interface TailoringPanelProps {
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

const resumeSections = [
  "summary",
  "education",
  "experience",
  "projects",
  "technical_skills",
  "achievements",
  "certifications"
];

export function TailoringPanel({
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
    <Card className="span-4">
      <SectionTitle icon={<Sparkles />} title="Resume Tailoring" tone="amber" />
      <CardContent>
        <div className="action-row">
          <Button onClick={onStart} disabled={!jobResponse || busy === "tailoring"} isLoading={busy === "tailoring"} icon={<Play size={16} />}>
            Start selection
          </Button>
          <StatusPill value={tailoringSession?.status ?? "not_started"} />
        </div>

        {tailoringSession?.selection_plan && (
          <div className="result-block" style={{ marginTop: '24px' }}>
            <div className="result-heading">
              <div>
                <h2>Selection Plan</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {(editableSelection ?? tailoringSession.selection_plan).page_target}
                </p>
              </div>
              <StatusPill value={`${(editableSelection ?? tailoringSession.selection_plan).section_order.length} sections`} />
            </div>
            
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <SelectionSummary selectionPlan={editableSelection ?? tailoringSession.selection_plan} />
            </div>
            
            {editableSelection ? (
              <SelectionEditor selectionPlan={editableSelection} onChange={updateSelectionDraft} />
            ) : (
              <p className="empty-note">Selection JSON is invalid.</p>
            )}
            
            <div style={{ marginTop: '16px' }}>
              <textarea
                className="json-editor"
                value={selectionDraft}
                onChange={(event) => onSelectionDraftChange(event.target.value)}
                rows={12}
                style={{ width: '100%', padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <Button onClick={onApproveSelection} isLoading={busy === "approve"} icon={<Check size={16} />}>
                Approve selection
              </Button>
            </div>
          </div>
        )}

        {tailoringSession?.template_plan && (
          <div className="result-block" style={{ marginTop: '32px' }}>
            <MetricGrid
              metrics={[
                ["Template", tailoringSession.template_plan.template_family],
                ["Placeholders", String(tailoringSession.template_plan.placeholders.length)],
                ["ATS readable", String(tailoringSession.template_plan.latex_rules.ats_readable)],
                ["Raw LaTeX", String(tailoringSession.template_plan.latex_rules.allow_raw_latex_from_model)]
              ]}
            />
            <div style={{ marginTop: '16px' }}>
              <label>
                <span>Revision request</span>
                <textarea
                  value={revisionRequest}
                  onChange={(event) => setRevisionRequest(event.target.value)}
                  rows={3}
                />
              </label>
            </div>
            <div style={{ marginTop: '16px' }}>
              <Button onClick={() => onGenerate(revisionRequest)} isLoading={busy === "generate"} icon={<Sparkles size={16} />}>
                Generate content
              </Button>
            </div>
          </div>
        )}

        {tailoringSession?.resume_content && (
          <div className="result-block" style={{ marginTop: '32px' }}>
            <h2>Resume Content</h2>
            <div className="item-list" style={{ marginTop: '16px' }}>
              {tailoringSession.resume_content.placeholder_values.map((value) => (
                <article className="item" key={value.placeholder_id}>
                  <div>
                    <strong>{value.placeholder_id}</strong>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>{value.text}</p>
                  </div>
                  <StatusPill value={value.claim_strength} />
                </article>
              ))}
            </div>
            <div style={{ marginTop: '16px' }}>
              <Button onClick={onCompile} isLoading={busy === "compile"} icon={<FileText size={16} />}>
                Compile PDF
              </Button>
            </div>
          </div>
        )}

        {compileResult && (
          <div className="result-block" style={{ marginTop: '32px' }}>
            <div className="result-heading">
              <div>
                <h2>Compile Result</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {compileResult.pdf_path ?? compileResult.tex_path ?? "No artifact path"}
                </p>
              </div>
              <StatusPill value={compileResult.success ? "success" : "failed"} />
            </div>
            
            {!compileResult.success && (
              <pre className="log-output" style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                {compileResult.compiler_output}
              </pre>
            )}
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              {compileResult.success && tailoringSession && (
                <a href={artifactUrl(tailoringSession.id)} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ textDecoration: 'none', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <SquareArrowOutUpRight size={16} style={{ marginRight: '8px' }} />
                  Open PDF
                </a>
              )}
              <Button onClick={onApproveFinal} disabled={!compileResult.success || busy === "final"} isLoading={busy === "final"} icon={<Save size={16} />}>
                Approve final
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
        <div className="item-list compact-list" style={{ marginTop: '16px' }}>
          {selectionPlan.reasons.slice(0, 5).map((reason) => (
            <article className="item" key={reason.item_id}>
              <div>
                <strong>{reason.item_id}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>{reason.reason}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="review-box">
        <h3>Missing Requirements</h3>
        {selectionPlan.missing_requirements.length ? (
          <div className="item-list compact-list" style={{ marginTop: '16px' }}>
            {selectionPlan.missing_requirements.map((gap) => (
              <article className="item gap-item" key={gap.requirement}>
                <div>
                  <strong>{gap.requirement}</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>{gap.resume_policy}</p>
                  <TagList items={gap.adjacent_evidence_item_ids} />
                </div>
                <StatusPill value={gap.status} />
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note" style={{ marginTop: '16px' }}>No missing requirements reported.</p>
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
    <div className="selection-tools" style={{ marginTop: '24px' }}>
      <div className="review-box">
        <h3>Page Target</h3>
        <div className="segmented segmented-compact" role="tablist" aria-label="Page target" style={{ marginTop: '12px' }}>
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
        <div className="section-order-list" style={{ marginTop: '12px' }}>
          {selectionPlan.section_order.map((section, index) => (
            <div className="section-order-row" key={section}>
              <span>{labelize(section)}</span>
              <div>
                <Button
                  aria-label={`Move ${labelize(section)} up`}
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => moveSection(index, -1)}
                  title={`Move ${labelize(section)} up`}
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  aria-label={`Move ${labelize(section)} down`}
                  variant="ghost"
                  size="sm"
                  disabled={index === selectionPlan.section_order.length - 1}
                  onClick={() => moveSection(index, 1)}
                  title={`Move ${labelize(section)} down`}
                >
                  <ArrowDown size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="review-box selection-wide">
        <h3>Selected Items</h3>
        {selectedEntries.length ? (
          <div className="selected-item-grid" style={{ marginTop: '12px' }}>
            {selectedEntries.map(([section, itemIds]) =>
              itemIds.map((itemId) => (
                <div className="selected-item-row" key={`${section}-${itemId}`}>
                  <div>
                    <strong>{itemId}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{labelize(section)}</span>
                  </div>
                  <Button
                    aria-label={`Remove ${itemId}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectedItem(section, itemId)}
                    title={`Remove ${itemId}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="empty-note" style={{ marginTop: '12px' }}>No selected source items.</p>
        )}
      </div>

      <div className="review-box selection-wide">
        <h3>Add Source Item</h3>
        <div className="inline-editor" style={{ marginTop: '12px' }}>
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
          <Button variant="secondary" onClick={addSelectedItem} icon={<Plus size={16} />}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
