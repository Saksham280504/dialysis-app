import { Router, Request, Response } from 'express';
import { Patient, Session } from './models';
import { detectAnomalies } from './anomaly';

const router = Router();

// Patients

// POST /api/patients - register a new patient
router.post('/patients', async (req: Request, res: Response) => {
    try {
        const patient = await Patient.create(req.body);
        res.status(201).json(patient);
    } catch (err: any) {
        res.status(400).json({error: err.message});
    }
});

// GET /api/patients - list all patients
router.get('/patients', async (_req: Request, res: Response) => {
    try {
        const patients = await Patient.find().sort({name: 1});
        res.json(patients);
    }
    catch (err: any) {
        res.status(500).json({error: err.message});
    }
});

// GET /api/patients/:id - get patient by MongoDB_id
router.get('/patients/:id', async (req: Request, res: Response) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if(!patient) return res.status(404).json({error: 'Patient not found' });
        res.json(patient);
    }
    catch (err: any) {
        res.status(500).json({error: err.message});
    }
})

// Sessions

// POST /api/sessions - record a new session
router.post('/sessions', async (req: Request, res: Response) => {
    try {
        const patient = await Patient.findById(req.body.patientId);
        if(!patient) return res.status(404).json({ error:'Patient not found'});

        // Doubt
        const anomalies = detectAnomalies({
            preWeight: req.body.preWeight,
            dryWeight: patient.dryWeight,
            postSystolicBP: req.body.postVitals?.systolicBP,
            durationMinutes: req.body.durationMinutes,
            targetDuration: patient.targetDuration,
        });

        const session = await Session.create({
            ...req.body,
            unit: patient.unit,
            machineId: patient.machineId,
            anomalies,
        });
        const populated = await Session.findById(session._id).populate('patientId','name mrn dryWeight targetDuration');
        res.status(201).json(populated);
    } catch (err: any) {
        res.status(400).json({error: err.message});
    }
});


// Doubt
// PATCH /api/sessions/:id - update notes, vitals, status, end time
router.patch('/sessions/:id', async (req: Request, res: Response) => {
    try {
        const session = await Session.findById(req.params.id).populate<{ patientId: any }>('patientId');
        if(!session) return res.status(404).json({error: 'Session not found' });

        Object.assign(session, req.body);

        // Recalculate duration if start/end provided
        if(session.startTime && session.endTime) {
            session.durationMinutes = Math.round((session.endTime.getTime() - session.startTime.getTime())/60000);
        }

        // Always recompute anomalies from latest data
        session.anomalies = detectAnomalies({
            preWeight: session.preWeight,
            dryWeight: session.patientId.dryWeight,
            postSystolicBP: session.postVitals?.systolicBP,
            durationMinutes: session.durationMinutes,
            targetDuration: session.patientId.targetDuration,
        });

        await session.save();
        res.json(session);
    } catch(err: any) {
        res.status(400).json({error: err.message});
    }
});

// GET /api/sessions/today?unit= - today's schedule with anomalies
router.get('/sessions/today', async (req: Request, res: Response) => {
    try {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);

        const query: any = { scheduledDate: { $gte: start, $lte: end } };
        if(req.query.unit) query.unit = req.query.unit;

        const sessions = await Session.find(query).populate('patientId', 'name mrn dryWeight targetDuration').sort({'patientId.name': 1 });

        res.json(sessions);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
});

// GET /api/sessions?patientId=&unit=&date= - flexible query
router.get('/sessions', async (req: Request, res: Response ) => {
    try {
        const query: any = {};
        if(req.query.patientId) query.patientId = req.query.patientId;
        if(req.query.unit) query.unit = req.query.unit;
        if(req.query.date) {
            const d = new Date(req.query.date as string);
            const start = new Date(d); start.setHours(0,0,0,0);
            const end = new Date(d); end.setHours(23,59,59,999);
            query.scheduledDate = { $gte: start, $lte: end };
        }
        const sessions = await Session.find(query).populate('patientId', 'name mrn dryWeight targetDuration').sort({ scheduledDate: -1 });

        res.json(sessions);
    } catch (err: any) {
        res.status(500).json({error: err.message});
    }
});

// GET /api/units - list distinct unit names
router.get('/units', async (_req: Request, res: Response) => {
    try {
        const units = await Patient.distinct('unit');
        res.json(units);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;