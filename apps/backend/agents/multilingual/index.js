import { systemInstruction } from './instructions.js';
import { MultilingualService, MULTILINGUAL_TOOL_DECLARATIONS } from './tools.js';

export default {
  name: "Aria",
  voice: "Aoede", // Aoede is a great clear neutral voice
  systemInstruction,
  toolDeclarations: MULTILINGUAL_TOOL_DECLARATIONS,
  toolImplementations: {
    get_facility_info: MultilingualService.getFacilityInfo
  }
};
