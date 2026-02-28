import { IAnomaly } from '../types';

const ANOMALY_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  EXCESS_WEIGHT_GAIN: { label: '↑ Weight Gain', icon: '⚖️', color: '#f85149', bg: 'rgba(248,81,73,0.12)', border: 'rgba(248,81,73,0.3)' },
  HIGH_POST_BP: { label: '↑ Post BP', icon: '🩸', color: '#ff8080', bg: 'rgba(248,81,73,0.12)', border: 'rgba(248,81,73,0.3)' },
  SHORT_DURATION: { label: '↓ Short Rx', icon: '⏱', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  LONG_DURATION: { label: '↑ Long Rx', icon: '⏱', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
};

interface Props {
  anomaly: IAnomaly;
}

export default function AnomalyBadge({ anomaly }: Props) {
  const m = ANOMALY_META[anomaly.type] ?? {
    label: anomaly.type, icon: '⚠', color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',
  };

  return (
    <span
      title={anomaly.message}
      style={{
        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
        background: m.bg, color: m.color, border: `1px solid ${m.border}`,
        whiteSpace: 'nowrap', cursor: 'default',
      }}
    >
      {m.icon} {m.label}
    </span>
  );
}

export { ANOMALY_META };