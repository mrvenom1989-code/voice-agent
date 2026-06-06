import { readDb, writeDb } from '../../db.js';

export const ClinicService = {
  getAvailableSlots: async ({ date }) => {
    console.log(`[Clinic] getAvailableSlots for date: ${date}`);
    const db = await readDb();
    
    // Check if Sunday
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    if (parsedDate.getDay() === 0) {
      return { status: "Closed", message: "The clinic is closed on Sundays.", slots: [] };
    }

    // Default hourly slots from 9:00 AM to 5:00 PM
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    
    // Filter out already booked slots
    const bookedTimes = (db.appointments || [])
      .filter(app => app.date === date)
      .map(app => app.time);

    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    return { date, availableSlots };
  },

  bookAppointment: async ({ name, phone, date, time }) => {
    console.log(`[Clinic] bookAppointment for ${name} at ${date} ${time}`);
    const db = await readDb();
    if (!db.appointments) db.appointments = [];

    // Check availability
    const isBooked = db.appointments.some(app => app.date === date && app.time === time);
    if (isBooked) {
      return { success: false, message: `The slot at ${time} on ${date} is already booked.` };
    }

    const newAppointment = { name, phone, date, time };
    db.appointments.push(newAppointment);
    await writeDb(db);

    return { success: true, appointment: newAppointment, message: `Successfully booked appointment for ${name} at ${time} on ${date}.` };
  },

  cancelAppointment: async ({ name, date, time }) => {
    console.log(`[Clinic] cancelAppointment for ${name} at ${date} ${time}`);
    const db = await readDb();
    if (!db.appointments) db.appointments = [];

    const initialLength = db.appointments.length;
    db.appointments = db.appointments.filter(
      app => !(app.name.toLowerCase() === name.toLowerCase() && app.date === date && app.time === time)
    );

    if (db.appointments.length === initialLength) {
      return { success: false, message: `No appointment found for ${name} at ${time} on ${date}.` };
    }

    await writeDb(db);
    return { success: true, message: `Successfully cancelled the appointment for ${name} at ${time} on ${date}.` };
  },

  getDoctorAvailability: async ({ doctor_name }) => {
    console.log(`[Clinic] getDoctorAvailability for: ${doctor_name || 'All'}`);
    const db = await readDb();
    const doctors = db.doctors || [];

    if (doctor_name) {
      const doc = doctors.find(d => d.name.toLowerCase().includes(doctor_name.toLowerCase()));
      if (doc) {
        return { doctors: [doc] };
      }
      return { message: `No doctor found matching the name ${doctor_name}.` };
    }

    return { doctors };
  },

  getClinicHours: async () => {
    console.log(`[Clinic] getClinicHours`);
    const db = await readDb();
    return { hours: db.clinicHours };
  },

  getClinicLocation: async () => {
    console.log(`[Clinic] getClinicLocation`);
    const db = await readDb();
    return { location: db.location };
  }
};

export const CLINIC_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: "get_available_slots",
        description: "Retrieves the available hourly appointment slots for a specific date at the clinic. Closed on Sundays.",
        parameters: {
          type: "OBJECT",
          properties: {
            date: {
              type: "STRING",
              description: "The date in YYYY-MM-DD format (e.g., '2026-06-08')."
            }
          },
          required: ["date"]
        }
      },
      {
        name: "book_appointment",
        description: "Books an appointment slot for a patient. Must confirm availability of the slot first.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "The full name of the patient."
            },
            phone: {
              type: "STRING",
              description: "The phone number of the patient."
            },
            date: {
              type: "STRING",
              description: "The date in YYYY-MM-DD format."
            },
            time: {
              type: "STRING",
              description: "The time slot in HH:MM format (e.g., '10:00', '14:00')."
            }
          },
          required: ["name", "phone", "date", "time"]
        }
      },
      {
        name: "cancel_appointment",
        description: "Cancels an existing appointment slot for a patient.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "The patient's name as booked."
            },
            date: {
              type: "STRING",
              description: "The date of the appointment in YYYY-MM-DD format."
            },
            time: {
              type: "STRING",
              description: "The slot time of the appointment in HH:MM format."
            }
          },
          required: ["name", "date", "time"]
        }
      },
      {
        name: "clinic_hours",
        description: "Queries the opening and closing hours of the clinic.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "doctor_availability",
        description: "Retrieves availability schedules and specialties for clinic doctors.",
        parameters: {
          type: "OBJECT",
          properties: {
            doctor_name: {
              type: "STRING",
              description: "Optional. Part or all of the doctor's name to filter the search."
            }
          }
        }
      },
      {
        name: "clinic_location",
        description: "Retrieves the street address and parking information of the clinic.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "handoff_to_human",
        description: "Escalates the call to a human receptionist. Used when requested or for complex queries.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {
              type: "STRING",
              description: "The reason why the caller needs to be transferred to a human."
            }
          },
          required: ["reason"]
        }
      },
      {
        name: "save_transcript",
        description: "Saves the completed conversation log for billing/compliance archives.",
        parameters: {
          type: "OBJECT",
          properties: {
            transcript: {
              type: "STRING",
              description: "The entire textual record of the dialogue."
            }
          },
          required: ["transcript"]
        }
      }
    ]
  }
];
