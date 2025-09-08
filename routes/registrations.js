import { Router } from 'express';
import {
  registerForEvent,
  exportRegistrations
} from '../controllers/registrationController.js';
import auth from '../middlewares/auth.js';

const router = Router();

// PUBLIC ROUTE - Registration without authentication
// POST /api/registrations/:eventId
router.post('/:eventId', registerForEvent);

// PROTECTED ROUTE - Only authenticated users can export
// GET /api/registrations/:eventId/export  
router.get('/:eventId/export', auth, exportRegistrations);



export default router;
