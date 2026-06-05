import { systemInstruction } from './instructions.js';
import { MobileKlinikService, MOBILE_KLINIK_TOOL_DECLARATIONS } from './tools.js';

export default {
  name: "Ryder",
  voice: "Fenrir",
  systemInstruction,
  toolDeclarations: MOBILE_KLINIK_TOOL_DECLARATIONS,
  toolImplementations: {
    get_available_repair_slots: MobileKlinikService.getAvailableRepairSlots,
    book_repair_job: MobileKlinikService.bookRepairJob,
    check_repair_status: MobileKlinikService.checkRepairStatus,
    get_repair_price: MobileKlinikService.getRepairPrice,
    klinik_hours: MobileKlinikService.getKlinikHours,
    klinik_location: MobileKlinikService.getKlinikLocation,
    check_store_faq: MobileKlinikService.checkStoreFaq
  }
};
