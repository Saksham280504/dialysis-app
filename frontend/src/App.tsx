import { useState, useEffect, useCallback } from 'react';
import { ISession, IPatient } from './types';
import { getAllSessions, getPatients, getUnits } from './api/client';
import SessionCard from './components/SessionCard';
import AddSessionModal from './components/AddSessionModal';

const C = {
  bg: '#0d1117', surface: '#161b22', surface2: '#1c2330',
  border: '#2a3441', text: '#e6edf3', text2: '#8b9ab0', text3: '#5a6879',
  teal: '#00d4aa', tealDim: 'rgba(0,212,170,0.12)', tealBorder: 'rgba(0,212,170,0.3)',
  amber: '#f59e0b', amberDim: 'rgba(245,158,11,0.12)', amberBorder: 'rgba(245,158,11,0.3)',
  blue: '#58a6ff', blueDim: 'rgba(88,166,255,0.12)',
  green: '#3fb950', greenDim: 'rgba(63,185,80,0.12)',
};

type Filter = 'all' | 'not_started' | 'in_progress' | 'completed';

export default function App() {
  const [sessions,setSessions] = useState<ISession[]>([]);
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [unit, setUnit] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors]  = useState<string[]>([]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const load = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    const results = await Promise.allSettled([
      getAllSessions(unit || undefined),
      getPatients(),
      getUnits(),
    ]);

    const errs: string[] = [];
    if (results[0].status === 'fulfilled') setSessions(results[0].value);
    else errs.push(`Sessions: ${(results[0] as PromiseRejectedResult).reason.message}`);

    if (results[1].status === 'fulfilled') setPatients(results[1].value);
    else errs.push(`Patients: ${(results[1] as PromiseRejectedResult).reason.message}`);

    if (results[2].status === 'fulfilled') setUnits(results[2].value);
    else errs.push(`Units: ${(results[2] as PromiseRejectedResult).reason.message}`);

    setErrors(errs);
    setLoading(false);
  }, [unit]);

  useEffect(() => { load(); }, [load]);

  function handleNotesUpdated(id: string, notes: string) {
    setSessions(s => s.map(x => x._id === id ? { ...x, notes } : x));
  }

  // Derived counts
  const counts: Record<Filter, number> = {
    all: sessions.length,
    not_started: 0,
    in_progress: 0,
    completed: 0,
    };
  sessions.forEach(s => counts[s.status]++);
  const anomalyCount = sessions.filter(s => s.anomalies.length > 0).length;

  const filtered = sessions.filter(s => {
    if (anomalyOnly && s.anomalies.length === 0) return false;
    if (filter !== 'all' && s.status !== filter) return false;
    return true;
  });

  const ChipBtn = ({ status, label, color, dimColor }: { status: Filter; label: string; color: string; dimColor: string }) => (
    <button onClick={() => setFilter(status)} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 16px',
      background: filter === status ? dimColor : C.surface2,
      border: `1px solid ${filter === status ? color : C.border}`,
      borderRadius: 6, color: filter === status ? color : C.text2,
      cursor: 'pointer', minWidth: 80, transition: 'all 0.15s',
    }}>
      <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{counts[status]}</span>
      <span style={{ fontSize: 11, marginTop: 2 }}>{label}</span>
    </button>
  );

  console.log("Patients:", patients.length);
  console.log("Sessions:", sessions.length);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header*/}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.teal, fontWeight: 800, fontSize: 17 }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#00d4aa" strokeWidth="2" />
              <path d="M8 16 Q12 8 16 16 Q20 24 24 16" stroke="#00d4aa" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            DialysisRx
          </div>
          <span style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace' }}>{today}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={unit} onChange={e => setUnit(e.target.value)}
            style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '7px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            <option value="">All Units</option>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button onClick={load}
            style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text2, padding: '7px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            ↺ Refresh
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ background: C.teal, color: '#0d1117', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + New Session
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errors.length > 0 && (
        <div style={{ background: 'rgba(248,81,73,0.12)', borderBottom: '1px solid rgba(248,81,73,0.3)', padding: '10px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#f85149', fontSize: 13 }}>⚠ API errors: {errors.join(' · ')}</span>
          <button onClick={load} style={{ background: 'none', border: '1px solid rgba(248,81,73,0.4)', color: '#f85149', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <ChipBtn status="all" label="Total" color={C.teal}  dimColor={C.tealDim} />
        <ChipBtn status="not_started" label="Not Started" color={C.blue}  dimColor={C.blueDim} />
        <ChipBtn status="in_progress" label="In Progress" color={C.amber} dimColor={C.amberDim} />
        <ChipBtn status="completed" label="Completed" color={C.green} dimColor={C.greenDim} />
        <div style={{ width: 1, height: 36, background: C.border, margin: '0 4px' }} />
        <button onClick={() => setAnomalyOnly(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          background: anomalyOnly ? C.amberDim : C.surface2,
          border: `1px solid ${anomalyOnly ? C.amber : C.border}`,
          borderRadius: 6, color: C.amber, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          ⚠ {anomalyCount} Anomal{anomalyCount === 1 ? 'y' : 'ies'}
          {anomalyOnly && ' ✓'}
        </button>
      </div>

       {/* Session list  */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12, color: C.text3 }}>
            <div style={{ fontSize: 28, animation: 'spin 1s linear infinite' }}>⏳</div>
            <div style={{ fontSize: 14, color: C.text2 }}>Loading sessions…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12, color: C.text3 }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text2 }}>No sessions match this filter</div>
            <div style={{ fontSize: 13 }}>Adjust the filter or unit selector to see more sessions.</div>
          </div>
        ) : (
          filtered.map(s => (
            <SessionCard key={s._id} session={s} onNotesUpdated={handleNotesUpdated} />
          ))
        )}
      </div>

      {showModal && (
        <AddSessionModal
          patients={patients}
          onClose={() => setShowModal(false)}
          onAdded={load}
        />
      )}
    </div>
  );
}