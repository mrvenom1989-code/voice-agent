import { readDb } from '../../db.js';

export const MultilingualService = {
  getFacilityInfo: async ({ facility }) => {
    console.log(`[Multilingual] getFacilityInfo for facility: ${facility}`);
    return {
      name: "RUDRA AYURVED Multi - Speciality Panchkarma Hospital",
      location: "206, B-Block, 2nd Floor, Olive Greens, Gota, S.G. Highway, Ahmedabad - 382481",
      hours: "Monday to Saturday: 10:00 AM - 7:00 PM, Sunday: 10:00 AM - 2:00 PM",
      services: "Kerala Panchakarma (Vamana, Virechana, Basti, Nasya, Raktamokshana, Shirodhara, Abhyanga, Janu Basti) and Clinical Cosmetology (PRP, HydraFacial, Chemical Peels).",
      doctors: [
        {
          name: "Dr. Chirag Raval",
          qualifications: "B.A.M.S, CCPT (Kerala)",
          specialty: "Expert in Pulse Diagnosis (Nadi Pariksha) and Panchakarma therapies for chronic lifestyle disorders."
        },
        {
          name: "Dr. Dipal Raval",
          qualifications: "B.H.M.S, P.G.D.C.C, P.G.D.C.T",
          specialty: "Specialist in Hair Repair, Skin Rejuvenation, and advanced Clinical Cosmetology treatments."
        }
      ],
      contact: {
        phone: "+91 63521 35799 (WhatsApp available)",
        email: "rudraayurved5@gmail.com"
      }
    };
  }
};

export const MULTILINGUAL_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: "get_facility_info",
        description: "Retrieves hours, location details, doctors, contact information, and services provided for RUDRA AYURVED Multi - Speciality Panchkarma Hospital.",
        parameters: {
          type: "OBJECT",
          properties: {
            facility: {
              type: "STRING",
              description: "The facility to query (use 'hospital' or 'clinic')."
            }
          },
          required: ["facility"]
        }
      },
      {
        name: "handoff_to_human",
        description: "Escalates the call to a human coordinator. Used when requested or for complex customer queries.",
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
        description: "Saves the completed conversation log transcript.",
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
