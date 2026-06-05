import { readDb, writeDb } from '../../db.js';

export const PharmacyService = {
  checkStock: async ({ medicine_name }) => {
    console.log(`[Pharmacy] checkStock for medicine: ${medicine_name}`);
    const db = await readDb();
    const inventory = db.inventory || [];
    
    const item = inventory.find(i => i.name.toLowerCase() === medicine_name.toLowerCase());
    if (!item) {
      return { inStock: false, quantity: 0, message: `Medicine '${medicine_name}' is not in our active catalog.` };
    }

    return {
      inStock: item.quantity > 0,
      quantity: item.quantity,
      location: item.location,
      needsPrescription: item.needsPrescription,
      message: `We currently have ${item.quantity} units of ${item.name} in stock at location ${item.location}.`
    };
  },

  reserveMedicine: async ({ medicine_name, quantity, patient_name }) => {
    console.log(`[Pharmacy] reserveMedicine for ${patient_name}: ${quantity}x ${medicine_name}`);
    const db = await readDb();
    const inventory = db.inventory || [];

    const item = inventory.find(i => i.name.toLowerCase() === medicine_name.toLowerCase());
    if (!item) {
      return { success: false, message: `Medicine '${medicine_name}' is not in our active catalog.` };
    }

    if (item.quantity < quantity) {
      return { success: false, message: `Insufficient stock. We only have ${item.quantity} units of ${item.name} available.` };
    }

    item.quantity -= quantity;
    await writeDb(db);

    return {
      success: true,
      medicineName: item.name,
      reservedQuantity: quantity,
      patientName: patient_name,
      location: item.location,
      needsPrescription: item.needsPrescription,
      message: `Successfully reserved ${quantity} units of ${item.name} for ${patient_name}. Please pick it up at ${item.location}.`
    };
  },

  getPharmacyHours: async () => {
    console.log(`[Pharmacy] getPharmacyHours`);
    const db = await readDb();
    return { hours: db.clinicHours }; // pharmacy hours same as clinic for now
  },

  getPharmacyLocation: async () => {
    console.log(`[Pharmacy] getPharmacyLocation`);
    const db = await readDb();
    return { location: db.location };
  }
};

export const PHARMACY_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: "check_stock",
        description: "Checks if a medicine is in stock at the pharmacy and lists quantity, location, and prescription requirement.",
        parameters: {
          type: "OBJECT",
          properties: {
            medicine_name: {
              type: "STRING",
              description: "The name of the medicine (e.g. 'Amoxicillin', 'Crocin')."
            }
          },
          required: ["medicine_name"]
        }
      },
      {
        name: "reserve_medicine",
        description: "Deducts inventory stock and reserves a medication for patient pickup. Check stock level first.",
        parameters: {
          type: "OBJECT",
          properties: {
            medicine_name: {
              type: "STRING",
              description: "The name of the medicine."
            },
            quantity: {
              type: "INTEGER",
              description: "The quantity of medicine packs/bottles to reserve."
            },
            patient_name: {
              type: "STRING",
              description: "The name of the patient picking up the medicine."
            }
          },
          required: ["medicine_name", "quantity", "patient_name"]
        }
      },
      {
        name: "pharmacy_hours",
        description: "Queries the opening and closing hours of the pharmacy.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "pharmacy_location",
        description: "Retrieves the street address and pickup instructions of the pharmacy.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "handoff_to_human",
        description: "Escalates the call to a human pharmacist. Used when requested or for complex queries.",
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
        description: "Saves the completed conversation log.",
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
