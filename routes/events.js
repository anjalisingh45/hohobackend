import { Router } from 'express';
import auth from '../middlewares/auth.js';
import uploadLogo from '../middlewares/uploadLogo.js';
import { 
  createEvent, 
  getEvents,
  getAllPublicEvents,
  getEvent, 
  getEventRegistrations 
} from '../controllers/eventController.js';

const router = Router();

// PUBLIC ROUTES (No authentication required) - MUST BE FIRST
router.get('/public', getAllPublicEvents);
router.get('/public/:id', getEvent); // Public event details


// PROTECTED ROUTES (Authentication required)
router.use(auth);

router.post('/', uploadLogo, createEvent);
router.get('/', getEvents);
router.get('/:id', getEvent);
router.get('/:eventId/registrations', getEventRegistrations);

export default router;
