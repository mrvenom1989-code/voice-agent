import { systemInstruction } from './instructions.js';
import { ClinicService, CLINIC_TOOL_DECLARATIONS } from './tools.js';

export default {
  name: "Clara",
  voice: "Aoede",
  systemInstruction,
  toolDeclarations: CLINIC_TOOL_DECLARATIONS,
  toolImplementations: {
    get_available_slots: ClinicService.getAvailableSlots,
    book_appointment: ClinicService.bookAppointment,
    cancel_appointment: ClinicService.cancelAppointment,
    doctor_availability: ClinicService.getDoctorAvailability,
    clinic_hours: ClinicService.getClinicHours,
    clinic_location: ClinicService.getClinicLocation
  }
};
