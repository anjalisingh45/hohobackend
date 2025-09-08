// import Registration from '../models/Registration.js';
// import Event from '../models/Event.js';
// import ExcelJS from 'exceljs';

// export const registerForEvent = async (req, res) => {
//   try {
//     console.log('=== REGISTRATION REQUEST ===');
//     console.log('Event ID:', req.params.eventId);
//     console.log('Request body:', req.body);

//     const { eventId } = req.params;
//     const { name, email, phone } = req.body;

//     // Validation
//     if (!name || !email || !phone) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, email, and phone are required'
//       });
//     }

    
//     // Email format validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide a valid email address'
//       });
//     }

//     // Phone validation (basic)
//     if (phone.length < 10) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide a valid phone number'
//       });
//     }

//     // Check if event exists
//     const event = await Event.findById(eventId);
//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: 'Event not found'
//       });
//     }

//     console.log('Event found:', event.title);

//     // Check if event is in the past
//     const eventDate = new Date(event.date);
//     const currentDate = new Date();
//     if (eventDate < currentDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Registration closed. This event has already ended.'
//       });
//     }

//     // Check if already registered
//     const existingRegistration = await Registration.findOne({
//       event: eventId,
//       email: email.toLowerCase()
//     });

//     if (existingRegistration) {
//       return res.status(400).json({
//         success: false,
//         message: 'You are already registered for this event'
//       });
//     }

//     // Check capacity
//     const currentRegistrations = await Registration.countDocuments({ event: eventId });
//     if (currentRegistrations >= event.capacity) {
//       return res.status(400).json({
//         success: false,
//         message: 'Event is full. Registration closed.'
//       });
//     }

//     // Create registration
//     const registration = new Registration({
//       event: eventId,
//       name: name.trim(),
//       email: email.toLowerCase().trim(),
//       phone: phone.trim(),
//       registrationDate: new Date()
//     });

//     await registration.save();

//     console.log('Registration successful:', registration._id);

//     // Send success response
//     res.status(201).json({
//       success: true,
//       message: 'Registration successful! A confirmation email will be sent shortly.',
//       registration: {
//         id: registration._id,
//         name: registration.name,
//         email: registration.email,
//         phone: registration.phone,
//         eventTitle: event.title,
//         registrationDate: registration.registrationDate
//       }
//     });

//     // TODO: Send confirmation email here
//     // await sendConfirmationEmail(registration, event);

//   } catch (error) {
//     console.error('=== REGISTRATION ERROR ===');
//     console.error('Error message:', error.message);
//     console.error('Error stack:', error.stack);

//     res.status(500).json({
//       success: false,
//       message: 'Registration failed due to server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };

// export const exportRegistrations = async (req, res) => {
//   try {
//     const { eventId } = req.params;

//     // Check if event belongs to the authenticated user
//     const event = await Event.findOne({ 
//       _id: eventId, 
//       organizer: req.user.id 
//     });

//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: 'Event not found or you do not have permission to export registrations'
//       });
//     }

//     // Get all registrations for this event
//     const registrations = await Registration.find({ event: eventId })
//       .sort({ registrationDate: -1 });

//     if (registrations.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'No registrations found for this event'
//       });
//     }

//     // Create Excel workbook
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Registrations');

//     // Add headers
//     worksheet.columns = [
//       { header: 'S.No.', key: 'sno', width: 8 },
//       { header: 'Name', key: 'name', width: 25 },
//       { header: 'Email', key: 'email', width: 30 },
//       { header: 'Phone', key: 'phone', width: 15 },
//       { header: 'Registration Date', key: 'registrationDate', width: 20 }
//     ];

//     // Add data
//     registrations.forEach((registration, index) => {
//       worksheet.addRow({
//         sno: index + 1,
//         name: registration.name,
//         email: registration.email,
//         phone: registration.phone,
//         registrationDate: registration.registrationDate.toLocaleDateString('en-IN')
//       });
//     });

//     // Style the header row
//     worksheet.getRow(1).eachCell((cell) => {
//       cell.font = { bold: true };
//       cell.fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FFE0E0E0' }
//       };
//     });

//     // Set response headers
//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename="registrations-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.xlsx"`
//     );

//     // Send the Excel file
//     await workbook.xlsx.write(res);
//     res.end();

//   } catch (error) {
//     console.error('Export registrations error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to export registrations',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };



import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';

// ---- CONFIRMATION EMAIL SENDER (INLINE) ----
async function sendConfirmationEmail(to, registration, event) {
  // Nodemailer SMTP transport (reads from .env)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for SSL port (465)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const formattedDate = new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:14px">
      <h2 style="color:#1565c0;margin-bottom:12px;">🎉 Registration Successful!</h2>
      <p>Hello <b>${registration.name}</b>,<br>
      Thank you for registering for <span style="color:#1976d2;"><b>${event.title}</b></span>.</p>
      <div style="background:#fffbd6;border-radius:8px;padding:15px;margin-bottom:22px;box-shadow:0 2px 12px rgba(0,0,0,.04);">
        <h3 style="margin:0 0 8px;color:#444;">Event Details</h3>
        <table style="font-size:15px;">
          <tr><td><b>Event:</b></td><td>${event.title}</td></tr>
          <tr><td><b>Date:</b></td><td>${formattedDate}</td></tr>
          <tr><td><b>Time:</b></td><td>${event.time || '-'}</td></tr>
          <tr><td><b>Venue:</b></td><td>${event.venue || '-'}</td></tr>
        </table>
      </div>
      <p style="font-size:15px;">We look forward to seeing you there!
      <br><br>Best regards,<br>GNV HOHO Team</p>
      <hr style="margin:24px 0 10px; border:0; background:#eee;height:1px;">
      <div style="font-size:12px;color:#888;text-align:center;">
        This is an automated message. Please do not reply.
      </div>
    </div>
  `;
  
  await transporter.sendMail({
    from: process.env.FROM_EMAIL || '"GNV HOHO" <noreply@yourdomain.com>',
    to,
    subject: `Registration Confirmed: ${event.title}`,
    html
  });
}

// -------- MAIN CONTROLLER ---------
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    if (phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    // Check if event is in the past
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    if (eventDate < currentDate) {
      return res.status(400).json({ success: false, message: 'Registration closed. This event has already ended.' });
    }
    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      email: email.toLowerCase()
    });
    if (existingRegistration) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }
    // Check capacity
    const currentRegistrations = await Registration.countDocuments({ event: eventId });
    if (currentRegistrations >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full. Registration closed.' });
    }

    // Create registration
    const registration = new Registration({
      event: eventId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      registrationDate: new Date()
    });
    await registration.save();

    // --- Send confirmation email (async, after response) ---
    sendConfirmationEmail(email, registration, event)
      .then(() => console.log('Confirmation email sent to:', email))
      .catch(err => console.error('Failed to send confirmation email:', err.message));

    res.status(201).json({
      success: true,
      message: 'Registration successful! A confirmation email will be sent to your email address.',
      registration: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        eventTitle: event.title,
        registrationDate: registration.registrationDate
      }
    });

  } catch (error) {
    console.error('REGISTRATION ERROR:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const exportRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have permission to export registrations'
      });
    }
    const registrations = await Registration.find({ event: eventId }).sort({ registrationDate: -1 });
    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registrations found for this event'
      });
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');
    worksheet.columns = [
      { header: 'S.No.', key: 'sno', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Registration Date', key: 'registrationDate', width: 20 }
    ];
    registrations.forEach((reg, i) => {
      worksheet.addRow({
        sno: i + 1,
        name: reg.name,
        email: reg.email,
        phone: reg.phone,
        registrationDate: reg.registrationDate.toLocaleDateString('en-IN')
      });
    });
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="registrations-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.xlsx"`);
    await workbook.xlsx.write(res); res.end();
  } catch (error) {
    console.error('Export registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export registrations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
