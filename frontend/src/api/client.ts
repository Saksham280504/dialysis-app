import { ISession, IPatient, AddSessionPayload } from "../types";

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if(!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// Patients

export const getPatients = (): Promise<IPatient[]> => request<IPatient[]>('/patients');

export const getPatientbyId = (id: string): Promise<IPatient> => request<IPatient>(`patients/${id}`);

// Sessions

export const getTodaySessions = (unit?: string): Promise<ISession[]> => request<ISession[]>(`/sessions/today${unit ? `?unit=${unit}`: ''}`);

export const getSessions = (params: {
    patientId?: string;
    unit?: string;
    date?: string;
}): Promise<ISession[]> => {
    const qs = new URLSearchParams(
        Object.entries(params).filter(([,v])=> v) as [string, string][] 
    ).toString();
    return request<ISession[]>(`/sessions${qs ? `?${qs}` : ''}`);
};

export const createSession = (payload: AddSessionPayload): Promise<ISession> => request<ISession>('/sessions', {method: 'POST', body: JSON.stringify(payload) });

export const updateSession = (id: string, patch: Partial<ISession>): Promise<ISession> => request<ISession>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

// Units

export const getUnits = (): Promise<string[]> => request<string[]>('/units');