import { systemInstruction } from './instructions.js';
import { PharmacyService, PHARMACY_TOOL_DECLARATIONS } from './tools.js';

export default {
  name: "Phoebe",
  voice: "Kore",
  systemInstruction,
  toolDeclarations: PHARMACY_TOOL_DECLARATIONS,
  toolImplementations: {
    check_stock: PharmacyService.checkStock,
    reserve_medicine: PharmacyService.reserveMedicine,
    pharmacy_hours: PharmacyService.getPharmacyHours,
    pharmacy_location: PharmacyService.getPharmacyLocation
  }
};
