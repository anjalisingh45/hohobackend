import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import QRCode from 'qrcode';

export const createEvent = async (req, res) => {
  try {
    console.log('===DEBUG INFO ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    if (!req.body || !req.body.data) {
      return res.status(400).json({ 
        message: 'No data received. Make sure FormData contains "data" field.' 
      });
    }

    
    let eventData;
    try {
      eventData = JSON.parse(req.body.data);
    } catch (parseError) {
      console.log('JSON Parse Error:', parseError);
      return res.status(400).json({ 
        message: 'Invalid JSON in data field' 
      });
    }

    const { title, description, date, time, venue, capacity, speakers = [] } = eventData;

    if (!title || !description || !date || !time || !venue || !capacity) {
      return res.status(400).json({ 
        message: 'Missing required fields'
      });
    }

    const logoFile = req.files?.logo?.[0];
    const logoUrl = logoFile ? `/uploads/logos/${logoFile.filename}` : null;

    const event = new Event({
      title,
      description,
      date: new Date(date),
      time,
      venue,
      capacity: parseInt(capacity),
      logoUrl,
      speakers,
      organizer: req.user.id,
      status: 'published'
    });

    const registrationUrl = `${process.env.FRONTEND_URL}/register/${event._id}`;
    event.registrationUrl = registrationUrl;
    event.qrCode = await QRCode.toDataURL(registrationUrl);

    await event.save();

    console.log('Event created successfully:', event._id);
    res.status(201).json({ success: true, event });

  } catch (err) {
    console.error('=== CREATE EVENT ERROR ===');
    console.error('Error message:', err.message);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, events });
  } catch (err) {
    console.error('Get Events Error:', err);
    res.status(500).json({ message: err.message });
  }
};

// PUBLIC route - Get ALL events from ALL managers
export const getAllPublicEvents = async (req, res) => {
  try {
    console.log('=== GET ALL PUBLIC EVENTS ===');
    
    const events = await Event.find({ status: 'published' })
      .populate('organizer', 'name email')
      .sort({ date: 1 });
    
    console.log(`Found ${events.length} public events`);
    
    // Get registration count for each event
    const eventsWithRegistrations = await Promise.all(
      events.map(async (event) => {
        try {
          const registrations = await Registration.find({ event: event._id });
          return {
            ...event.toObject(),
            registrations: registrations
          };
        } catch (error) {
          console.error(`Error getting registrations for event ${event._id}:`, error);
          return {
            ...event.toObject(),
            registrations: []
          };
        }
      })
    );
    
    res.json({ 
      success: true, 
      events: eventsWithRegistrations 
    });
    
  } catch (err) {
    console.error('=== GET PUBLIC EVENTS ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    res.status(500).json({ 
      message: 'Failed to fetch public events',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const registrations = await Registration.find({ event: req.params.id });
    
    res.json({ 
      success: true, 
      event: {
        ...event.toObject(),
        registrations: registrations
      }
    });
  } catch (err) {
    console.error('Get Event Error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrations = await Registration.find({ event: eventId }).sort({ createdAt: -1 });
    res.json({ success: true, registrations, totalRegistrations: registrations.length });
  } catch (err) {
    console.error('Get Event Registrations Error:', err);
    res.status(500).json({ message: err.message });
  }
};
