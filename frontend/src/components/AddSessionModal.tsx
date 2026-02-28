import { useState } from 'react';
import { IPatient } from '../types';
import { createSession } from '../api/client';

const C = {
  surface: '#161b22', surface2: '#1c2330', border: '#2a3441',
  text: '#e6edf3', text2: '#8b9ab0', text3: '#5a6879',
  teal: '#00d4aa',
};

interface Props {
  patients: IPatient[];
  onClose: () => void;
  onAdded: () => void;   // refresh parent list after success
}

export default function AddSessionModal({ patients, onClose, onAdded }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    patientId: '',
    scheduledDate: today,
    preWeight: '',
    preSBP: '',
    preDiastolic: '',
    preHR: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    if (!form.patientId) { setError('Please select a patient.'); return; }
    if (!form.preWeight) { setError('Pre-weight is required.'); return; }
    if (!form.preSBP || !form.preDiastolic || !form.preHR) {
      setError('All pre-vitals fields are required.'); return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createSession({
        patientId: form.patientId,
        scheduledDate: form.scheduledDate,
        preWeight: parseFloat(form.preWeight),
        preVitals: {
          systolicBP: parseInt(form.preSBP),
          diastolicBP: parseInt(form.preDiastolic),
          heartRate: parseInt(form.preHR),
        },
        notes: form.notes,
      });
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px 14px', borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>New Dialysis Session</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.text3, fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Patient select */}
          <div>
            <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, marginBottom: 4 }}>Patient *</div>
            <select value={form.patientId} onChange={e => set('patientId', e.target.value)}
              style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', borderRadius: 6, fontSize: 13, outline: 'none' }}>
              <option value="">Select patient…</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.mrn})</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, marginBottom: 4 }}>Scheduled Date</div>
            <input type="date" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)}
              style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', borderRadius: 6, fontSize: 13, outline: 'none' }} />
          </div>

          {/* Pre-weight */}
          <div>
            <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, marginBottom: 4 }}>Pre-Weight (kg) *</div>
            <input type="number" step="0.1" value={form.preWeight} onChange={e => set('preWeight', e.target.value)} placeholder="e.g. 65.4"
              style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', borderRadius: 6, fontSize: 13, outline: 'none' }} />
          </div>

          {/* Vitals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {([['Systolic BP *', 'preSBP', 'mmHg'], ['Diastolic BP *', 'preDiastolic', 'mmHg'], ['Heart Rate *', 'preHR', 'bpm']] as const).map(([label, field, ph]) => (
              <div key={field}>
                <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <input type="number" value={form[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                  style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', borderRadius: 6, fontSize: 13, outline: 'none' }} />
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, marginBottom: 4 }}>Notes</div>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Observations, concerns…"
              style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'sans-serif', outline: 'none' }} />
          </div>

          {error && <div style={{ fontSize: 12, color: '#f85149', background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 6, padding: '8px 12px' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <button onClick={onClose}
              style={{ background: C.surface2, color: C.text2, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ background: C.teal, color: '#0d1117', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Recording…' : 'Record Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}