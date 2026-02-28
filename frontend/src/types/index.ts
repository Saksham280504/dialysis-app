// Shared TypeScript interfaces
// These mirror the Mongoose schemas in backend/src/models.ts.

export interface IVitals {
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
}

export interface IAnomaly {
    type: string;
    message: string;
    value: number;
    threshold: number;
}

export interface IPatient {
    _id: string;
    mrn: string;
    name: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    dryWeight: number;
    unit: string;
    machineId: string;
    scheduledDays: string[];
    targetDuration: number;
}

export type SessionStatus = 'not_started' | 'in_progess' | 'completed';

export interface ISession {
    _id: string;
    patientId: IPatient;
    unit: string;
    machineId: string;
    scheduledDate: string;
    status: SessionStatus;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    preWeight?: number;
    postWeight?: number;
    preVitals?: IVitals;
    postVitals?: IVitals;
    notes: string;
    anomalies: IAnomaly[];
}

export interface AddSessionPayload {
    patientId: string;
    scheduledDate: string;
    preWeight?: number;
    preVitals?: IVitals;
    notes?: string;
}