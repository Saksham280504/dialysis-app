import { IAnomaly } from './models';

// Config
// All thresholds are exposed here so they can be adjusted without hunting through business logic code.

export interface AnomalyConfig {
    /**
     1. Maximum acceptable interdialytic weight gain (kg).

     => CLINICAL BASIS - KDOQI Clinical Practice Guidelines recommend limiting IDWG <= 4-5% of dry body weight. For eg: If dry weight is 70 kg => IDWG = 5% of 70 kg = 3.5kg.
     => Exceeding this threshold leads to increased ultrafiltration rate, pulmonary oedema risk, elevated cardiovascular morbidity.
     */
    maxIDWG: number;

    /**
    2. Post-dialysis systolic BP celing (mmHg).

    => CLINICAL BASIS - JNC 8 and KDOQI guidelines target post-treatment BP < 130/80 mmHg. However, observational data (Agarwal & Light, Am J Nephrol 2010) show that white-coat hypertension and measurement artefact routinely add 10–20 mmHg to in-centre readings. Thus, a threshold value of 130 mmHg would generate excessive false-positive alerts. We therefore flag at 150 mmHg — this is the level above which multiple studies (including DOPPS) demonstrate a statistically significant independent association with all-cause mortality in ESRD, and it represents a reading that clearly warrants clinical review before the patient is discharged, regardless of measurement variability.
     */
    maxPostSystolicBP: number;

    /**
    3. Minimum acceptable fraction of prescribed treatment time (0–1).

    => CLINICAL BASIS — Dialysis adequacy (Kt/V ≥ 1.2, URR ≥ 65%) scales almost linearly with treatment time. The CMS ESRD Quality Incentive Program (QIP) uses 80% of prescribed time as the minimum acceptable session completion rate for pay-for-performance scoring. Sessions terminated > 20% early carry meaningful risk of inadequate solute clearance (Saran et al., Kidney Int 2003).
   */
  minDurationFraction: number;

    /**
   4. Maximum acceptable fraction of prescribed treatment time (0–1).
   => CLINICAL BASIS — Sessions running > 20% beyond prescription are almost always the result of repeated machine alarms, access complications (infiltration, poor flow), or haemodynamic instability requiring nursing intervention. Flagging at 120% prompts documentation review and timely access-complication assessment before the patient leaves the chair.
   */
  maxDurationFraction: number;
}

export const DEFAULT_CONFIG: AnomalyConfig = { // These are the threshold values that I have assumed as per the above reasoning
    maxIDWG: 3.5, // Doubt
    maxPostSystolicBP: 150, 
    minDurationFraction: 0.80,
    maxDurationFraction: 1.20, // Doubt
}

// Detection

export function detectAnomalies(
  params: {
    preWeight?:number;
    postWeight?:number;
    dryWeight:number;
    postSystolicBP?:number;
    durationMinutes?:number;
    targetDuration:number;
  },
  config: AnomalyConfig = DEFAULT_CONFIG
): IAnomaly[] {
  const anomalies: IAnomaly[] = [];

  // 1. Excess Interdialytic Weight Gain
    if (params.preWeight !== undefined) {
    const idwg = params.preWeight - params.dryWeight;
    if (idwg > config.maxIDWG) {
      anomalies.push({
        type: 'EXCESS_WEIGHT_GAIN',
        message: `Interdialytic weight gain of ${idwg.toFixed(1)} kg exceeds threshold of ${config.maxIDWG} kg`,
        value: parseFloat(idwg.toFixed(1)),
        threshold: config.maxIDWG,
      });
    }
  }

    // 2. High Post-Dialysis Systolic BP
    if (params.postSystolicBP !== undefined) {
    if (params.postSystolicBP > config.maxPostSystolicBP) {
      anomalies.push({
        type:'HIGH_POST_BP',
        message: `Post-dialysis systolic BP of ${params.postSystolicBP} mmHg exceeds threshold of ${config.maxPostSystolicBP} mmHg`,
        value: params.postSystolicBP,
        threshold: config.maxPostSystolicBP,
      });
    }
  }

    // 3. Short Session Duration
    if (params.durationMinutes !== undefined) {
    const minAllowed = Math.round(params.targetDuration*config.minDurationFraction);
    const pct = Math.round((params.durationMinutes/params.targetDuration)*100);
    if (params.durationMinutes < minAllowed) {
      anomalies.push({
        type:'SHORT_DURATION',
        message:`Session of ${params.durationMinutes} min is ${pct}% of prescribed ${params.targetDuration} min`,
        value:params.durationMinutes,
        threshold:minAllowed,
      });
    }

        // 4. Long Session Duration
    const maxAllowed = Math.round(params.targetDuration*config.maxDurationFraction);
    if (params.durationMinutes > maxAllowed) {
      anomalies.push({
        type:'LONG_DURATION',
        message:`Session of ${params.durationMinutes} min is ${pct}% of prescribed ${params.targetDuration} min`,
        value:params.durationMinutes,
        threshold: maxAllowed,
      });
    }
  }

  return anomalies;
}