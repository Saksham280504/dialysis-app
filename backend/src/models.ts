// This file contains the two Mongoose schemas: Patient and Session.
// Patient: static demographic + prescription data (changes rarely)
// Session: per-treatment data (created once, updated during/after treatment)

import mongoose, { Schema, Document, Types } from 'mongoose';

// PATIENT

export interface IPatient extends Document { // Required fields for Patient Background
    mrn: string;
    name: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    dryWeight: number; 
    unit: string;
    machineId: string;
    scheduledDays: string[]; 
    targetDuration: number;
}

const PatientSchema = new Schema<IPatient>(
    {
        mrn: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        gender: { type: String, enum: ['male', 'female', 'other'], required: true },
        dryWeight: { type: Number, required: true },
        unit: { type: String, required: true },
        machineId: { type: String, required: true },
    },
    { timestamps: true }
);

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);

// Session

export interface IVitals {
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
}

export interface IAnomaly {
    type: string;
    message: string;
    value: number;
    threshold: number; // If value exceeds or is below the threshold, then it will generate anomaly
}

export interface ISession extends Document { // This will contain the session information of the patient. A patient can have multiple sessions.
    patientId: Types.ObjectId;
    unit: string;
    machineId: string;
    scheduledDate: Date;
    status: 'not_started' | 'in_progress' | 'completed';
    startTime?: Date;
    endTime?: Date;
    durationMinutes: number;
    preWeight?: number;
    postWeight?: number;
    preVitals?: IVitals;
    postVitals?: IVitals;
    notes: string;
    anomalies: IAnomaly[];
}

const VitalsSchema = new Schema<IVitals>(
    {
        systolicBP: { type: Number, required: true },
        diastolicBP: { type: Number, required: true },
        heartRate: { type: Number, required: true }
    },
    { _id: false }
);

const AnomalySchema = new Schema<IAnomaly> (
    {
        type: { type: String, required: true },
        message: { type: String, required: true },
        value: { type: Number, required: true },
        threshold: { type: Number, required: true },
    },
    { _id: false }
);

const SessionSchema = new Schema<ISession>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
        unit: { type: String, required: true, index: true },
        machineId: { type: String, required: true },
        scheduledDate: { type: Date, required: true, index: true },
        status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
        startTime: { type: Date },
        endTime: { type: Date },
        durationMinutes: { type: Number },
        preWeight: { type: Number },
        postWeight: { type: Number },
        preVitals: { type: VitalsSchema },
        postVitals: { type: VitalsSchema },
        notes: { type: String, default: '' },
        anomalies: { type: [AnomalySchema], default: [] },
    },
    { timestamps: true }
);

SessionSchema.index({PatientId: 1, scheduledDate: 1 }, { unique: true });

export const Session = mongoose.model<ISession>('Session', SessionSchema);