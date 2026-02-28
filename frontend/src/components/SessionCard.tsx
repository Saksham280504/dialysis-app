import { useState } from 'react';
import { ISession } from '../types';
import AnomalyBadge, { ANOMALY_META } from './AnomalyBadge';
import { updateSession } from '../api/client';

const C = {
  surface: '#161b22', surface2: '#1c2330', border: '#2a3441',
  text: '#e6edf3', text2: '#8b9ab0', text3: '#5a6879',
  teal: '#00d4aa', amber: '#f59e0b', amberDim: 'rgba(245,158,11,0.12)',
  amberBorder: 'rgba(245,158,11,0.3)', red: '#f85149',
};

const STATUS_CFG = {
  not_started: { label: 'Not Started', bg: 'rgba(88,166,255,0.12)', color: '#58a6ff', border: 'rgba(88,166,255,0.3)' },
  in_progress:  { label: 'In Progress', bg: C.amberDim, color: C.amber, border: C.amberBorder },
  completed:    { label: 'Completed',   bg: 'rgba(63,185,80,0.12)', color: '#3fb950', border: 'rgba(63,185,80,0.3)' },
};

function Metric({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64 }}>
      <span style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: alert ? C.red : C.text }}>{value}</span>
    </div>
  );
}

interface Props {
  session: ISession;
  onNotesUpdated: (id: string, notes: string) => void;
}

export default function SessionCard({ session, onNotesUpdated }: Props) {
  const [expanded, setExpanded]  = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(session.notes);
  const [saving, setSaving] = useState(false);

  const p = session.patientId;
  const hasAnomaly = session.anomalies.length > 0;
  const sc = STATUS_CFG[session.status as keyof typeof STATUS_CFG];
  const idwg = p?.dryWeight != null && session.preWeight != null
    ? (session.preWeight - p.dryWeight).toFixed(1)
    : null;
  const removed = session.preWeight != null && session.postWeight != null
    ? (session.preWeight - session.postWeight).toFixed(1)
    : null;

  async function saveNotes() {
    setSaving(true);
    try {
      await updateSession(session._id, { notes });
      onNotesUpdated(session._id, notes);
      setEditNotes(false);
    } catch {
      alert('Failed to save notes. Check the API server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${hasAnomaly ? C.amberBorder : C.border}`,
      borderRadius: 10, overflow: 'hidden', position: 'relative', marginBottom: 8,
    }}>
      {hasAnomaly && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: C.amber }} />}

      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto auto', alignItems: 'center', gap: 12, padding: '12px 14px 12px 18px', cursor: 'pointer' }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p?.name ?? '—'}</div>
          <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginTop: 2 }}>
            {p?.mrn} · {session.unit} · {session.machineId}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {session.anomalies.map((a, i) => <AnomalyBadge key={i} anomaly={a} />)}
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {sc.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {session.preWeight  && <Metric label="Pre Wt"  value={`${session.preWeight}kg`} />}
          {session.postWeight && <Metric label="Post Wt" value={`${session.postWeight}kg`} />}
          {idwg !== null && <Metric label="IDWG" value={`${idwg}kg`} alert={parseFloat(idwg) > 3.5} />}
          {removed !== null && <Metric label="Removed" value={`${removed}kg`} />}
          {session.preVitals  && <Metric label="Pre BP" value={`${session.preVitals.systolicBP}/${session.preVitals.diastolicBP}`} />}
          {session.postVitals && <Metric label="Post BP" value={`${session.postVitals.systolicBP}/${session.postVitals.diastolicBP}`} alert={session.postVitals.systolicBP > 150} />}
          {session.durationMinutes && <Metric label="Duration" value={`${session.durationMinutes}m`} />}
        </div>

        <span style={{ color: C.text3, fontSize: 11 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Expanded body ───────────────────────────────────────────────────── */}
      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${C.border}` }}>
          {hasAnomaly && (
            <div style={{ background: C.amberDim, border: `1px solid ${C.amberBorder}`, borderRadius: 6, padding: '10px 14px', margin: '14px 0 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {session.anomalies.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.amber }}>
                  <span>{ANOMALY_META[a.type]?.icon ?? '⚠'}</span>
                  <span>{a.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Nurse Notes
            </div>
            {editNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  style={{ background: C.surface2, border: `1px solid ${C.teal}`, color: C.text, padding: '8px 10px', borderRadius: 6, fontSize: 13, resize: 'vertical', width: '100%', fontFamily: 'sans-serif', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveNotes} disabled={saving}
                    style={{ background: C.teal, color: '#0d1117', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setEditNotes(false); setNotes(session.notes); }}
                    style={{ background: C.surface2, color: C.text2, border: `1px solid ${C.border}`, padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, color: notes ? C.text2 : C.text3 }}>
                  {notes || <em>No notes recorded</em>}
                </span>
                <button onClick={() => setEditNotes(true)}
                  style={{ background: 'none', border: `1px solid ${C.border}`, color: C.text3, padding: '2px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Extra details */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 14 }}>
{[
  p?.dryWeight != null && ['Dry Weight', `${p.dryWeight} kg`],
  p?.targetDuration != null && ['Target Rx', `${p.targetDuration} min`],
  session.preVitals && ['Pre HR', `${session.preVitals.heartRate} bpm`],
  session.postVitals && ['Post HR', `${session.postVitals.heartRate} bpm`],
]
  .filter((item): item is [string, string] => Boolean(item))
  .map(([label, value]) => (
    <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontFamily: 'monospace', color: C.text2, marginTop: 1 }}>
        {value}
      </span>
    </div>
  ))}
          </div>
        </div>
      )}
    </div>
  );
}