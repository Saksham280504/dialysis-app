import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import { Patient, Session } from './models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dialysisrx';

app.use(cors());
app.use(express.json());
app.use('/api', router);

// Seed Data

async function seed() {
    const count = await Patient.countDocuments();
    if(count > 0) return; // Already seeded
    console.log('Seeding demo data...');

const patients = await Patient.insertMany([
    { mrn: 'MRN-001', name: 'Alice Nguyen', dateOfBirth: new Date('1962-03-15'), gender: 'female', dryWeight: 62.5, unit: 'Unit-A', machineId: 'HD-01', scheduledDays: ['Monday','Wednesday','Friday'], targetDuration: 240 },
    { mrn: 'MRN-002', name: 'Bernard Okeke', dateOfBirth: new Date('1955-07-22'), gender: 'male', dryWeight: 78.0, unit: 'Unit-A', machineId: 'HD-02', scheduledDays: ['Tuesday','Thursday','Saturday'], targetDuration: 240 },
    { mrn: 'MRN-003', name: 'Carmen Reyes', dateOfBirth: new Date('1970-11-08'), gender: 'female', dryWeight: 55.0, unit: 'Unit-B', machineId: 'HD-05', scheduledDays: ['Monday','Wednesday','Friday'], targetDuration: 210 },
    { mrn: 'MRN-004', name: 'David Park', dateOfBirth: new Date('1948-01-30'), gender: 'male', dryWeight: 82.0, unit: 'Unit-A', machineId: 'HD-03', scheduledDays: ['Monday','Wednesday','Friday'], targetDuration: 240 },
    { mrn: 'MRN-005', name: 'Elena Vasquez', dateOfBirth: new Date('1975-05-18'), gender: 'female', dryWeight: 58.5, unit: 'Unit-B', machineId: 'HD-06', scheduledDays: ['Tuesday','Thursday','Saturday'], targetDuration: 240 },
  ]);

const today = new Date(); today.setHours(0,0,0,0);

await Session.insertMany([
    {
      patientId: patients[0]._id, 
      unit: 'Unit-A', 
      machineId: 'HD-01', 
      scheduledDate: today,
      status: 'completed', 
      durationMinutes: 240,
      preWeight: 64.8, 
      postWeight: 62.5,
      preVitals: { systolicBP: 155, diastolicBP: 90, heartRate: 78 },
      postVitals: { systolicBP: 162, diastolicBP: 94, heartRate: 82 },
      notes: 'Patient tolerated treatment. Cramping at 3h mark.',
      anomalies: [{ type: 'HIGH_POST_BP', message: 'Post-dialysis systolic BP of 162 mmHg exceeds threshold of 150 mmHg', value: 162, threshold: 150 }],
    },
    {
      patientId: patients[1]._id, 
      unit: 'Unit-A', 
      machineId: 'HD-02', 
      scheduledDate: today,
      status: 'in_progress',
      preWeight: 83.2,
      preVitals: { systolicBP: 148, diastolicBP: 88, heartRate: 72 },
      notes: '',
      anomalies: [{ type: 'EXCESS_WEIGHT_GAIN', message: 'Interdialytic weight gain of 5.2 kg exceeds threshold of 3.5 kg', value: 5.2, threshold: 3.5 }],
    },
    {
      patientId: patients[2]._id, 
      unit: 'Unit-B', 
      machineId: 'HD-05', 
      scheduledDate: today,
      status: 'not_started',
      preWeight: 57.8,
      preVitals: { systolicBP: 142, diastolicBP: 85, heartRate: 68 },
      notes: '',
      anomalies: [],
    },
    {
      patientId: patients[3]._id, 
      unit: 'Unit-A', 
      machineId: 'HD-03', 
      scheduledDate: today,
      status: 'completed', 
      durationMinutes: 180,
      preWeight: 85.5, 
      postWeight: 82.1,
      preVitals: { systolicBP: 150, diastolicBP: 92, heartRate: 74 },
      postVitals: { systolicBP: 138, diastolicBP: 84, heartRate: 70 },
      notes: 'Session cut short due to patient request. Will monitor.',
      anomalies: [{ type: 'SHORT_DURATION', message: 'Session of 180 min is 75% of prescribed 240 min', value: 180, threshold: 192 }],
    },
    {
      patientId: patients[4]._id, unit: 'Unit-B', machineId: 'HD-06', scheduledDate: today,
      status: 'not_started',
      preWeight: 60.1,
      preVitals: { systolicBP: 135, diastolicBP: 82, heartRate: 76 },
      notes: '',
      anomalies: [],
    },
  ]);

  console.log('Seeded 5 patients and 5 sessions for today.');
}

// BOOT

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seed();
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });