import { readDb, writeDb } from '../../db.js';

export const MobileKlinikService = {
  getAvailableRepairSlots: async ({ date }) => {
    console.log(`[MobileKlinik] getAvailableRepairSlots for date: ${date}`);
    const db = await readDb();
    
    // Check if Sunday
    const parsedDate = new Date(date);
    if (parsedDate.getDay() === 0) {
      return { status: "Closed", message: "Mobile Klinik is closed on Sundays.", slots: [] };
    }

    const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    const bookedTimes = (db.repairJobs || [])
      .filter(job => job.date === date)
      .map(job => job.time);

    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    return { date, availableSlots };
  },

  bookRepairJob: async ({ name, phone, date, time, device, issue }) => {
    console.log(`[MobileKlinik] bookRepairJob for ${name} - ${device} at ${date} ${time}`);
    const db = await readDb();
    if (!db.repairJobs) db.repairJobs = [];

    const isBooked = db.repairJobs.some(job => job.date === date && job.time === time);
    if (isBooked) {
      return { success: false, message: `The repair slot at ${time} on ${date} is already booked.` };
    }

    // Check pricing
    const priceInfo = (db.repairPrices || []).find(
      p => p.device.toLowerCase() === device.toLowerCase() && p.issue.toLowerCase().includes(issue.toLowerCase())
    );
    const cost = priceInfo ? priceInfo.cost : 99; // Default backup price

    const ticketId = `TK-${Math.floor(104 + Math.random() * 890)}`;
    const newJob = { id: ticketId, name, phone, date, time, device, issue, status: "Scheduled", cost };
    
    db.repairJobs.push(newJob);
    await writeDb(db);

    return {
      success: true,
      repairJob: newJob,
      message: `Successfully booked repair slot for ${name}'s ${device} (${issue}) at ${time} on ${date}. Ticket: ${ticketId}. Est. Cost: $${cost}.`
    };
  },

  checkRepairStatus: async ({ phone_or_name }) => {
    console.log(`[MobileKlinik] checkRepairStatus for: ${phone_or_name}`);
    const db = await readDb();
    
    const searchStr = phone_or_name.toLowerCase();
    const job = (db.repairJobs || []).find(
      j => j.phone.includes(searchStr) || j.name.toLowerCase().includes(searchStr) || j.id.toLowerCase() === searchStr
    );

    if (!job) {
      return { found: false, message: `No active repair order found matching '${phone_or_name}'.` };
    }

    return {
      found: true,
      job,
      message: `Repair Order ${job.id} for ${job.name}'s ${job.device} is currently '${job.status}'. Estimated cost: $${job.cost}.`
    };
  },

  getRepairPrice: async ({ device, issue }) => {
    console.log(`[MobileKlinik] getRepairPrice for: ${device} - ${issue}`);
    const db = await readDb();
    const prices = db.repairPrices || [];
    
    const devLower = (device || "").toLowerCase().trim();
    let issueLower = (issue || "").toLowerCase().trim();
    
    // Normalize display / glass terms to "screen" to match Excel catalog
    if (issueLower.includes("back glass") || issueLower.includes("rear glass")) {
      issueLower = "back glass";
    } else if (issueLower.includes("display") || issueLower.includes("glass") || issueLower.includes("screen") || issueLower.includes("front")) {
      issueLower = "screen";
    }

    const getModelType = (name) => {
      const n = name.toLowerCase();
      if (n.includes("pro max")) return "pro max";
      if (n.includes("pro")) return "pro";
      if (n.includes("plus")) return "plus";
      if (n.includes("mini")) return "mini";
      if (n.includes("16e")) return "16e";
      return "base";
    };

    const devModelType = getModelType(devLower);

    // Find all matches
    const matches = prices.filter(p => {
      const pDev = p.device.toLowerCase();
      const pIssue = p.issue.toLowerCase();
      
      // Extract numbers to match exact generation (e.g., 17 vs 16 vs 15)
      const getNumbers = (str) => str.replace(/[^0-9]/g, "");
      const pDevNums = getNumbers(pDev);
      const devLowerNums = getNumbers(devLower);
      
      if (devLowerNums && pDevNums !== devLowerNums) {
        return false;
      }
      
      // Suffix type (pro max, pro, plus, base, etc.) must match exactly
      const pModelType = getModelType(pDev);
      if (pModelType !== devModelType) {
        return false;
      }
      
      // Check brand (e.g. iphone vs samsung vs pixel)
      const getBrand = (str) => {
        if (str.includes("iphone")) return "iphone";
        if (str.includes("samsung") || str.includes("galaxy")) return "samsung";
        if (str.includes("pixel") || str.includes("google")) return "pixel";
        return "";
      };
      
      const pBrand = getBrand(pDev);
      const devBrand = getBrand(devLower);
      if (devBrand && pBrand !== devBrand) {
        return false;
      }

      // Issue match
      const issueMatch = pIssue.includes(issueLower) || issueLower.includes(pIssue);
      return issueMatch;
    });

    if (matches.length === 0) {
      return { 
        found: false, 
        message: `We could not find standard pricing for '${device}' '${issue}'. Let me connect you with a technician.` 
      };
    }

    if (matches.length === 1) {
      const p = matches[0];
      return {
        found: true,
        multipleOptions: false,
        priceInfo: p,
        message: `Standard repair for '${p.device}' (${p.issue}) is $${p.cost}. Average duration is ${p.duration}.`
      };
    }

    // Multiple options case (e.g. LCD Screen, OLED Screen, OEM Screen)
    const optionsText = matches.map(p => `* ${p.issue}: $${p.cost} (${p.duration})`).join('\n');
    return {
      found: true,
      multipleOptions: true,
      options: matches,
      message: `For the '${device}', we have multiple options for '${issue}':\n${optionsText}`
    };
  },

  getKlinikHours: async () => {
    console.log(`[MobileKlinik] getKlinikHours`);
    const db = await readDb();
    return { hours: db.klinikHours };
  },

  getKlinikLocation: async () => {
    console.log(`[MobileKlinik] getKlinikLocation`);
    const db = await readDb();
    return { location: db.klinikLocation };
  },

  checkStoreFaq: async ({ topic }) => {
    console.log(`[MobileKlinik] checkStoreFaq for topic: ${topic}`);
    const db = await readDb();
    const faqs = db.klinikFaqs || [];
    const offers = db.klinikOffers || [];

    const normTopic = (topic || "").toLowerCase();

    if (normTopic === 'promotions' || normTopic === 'offers') {
      const offerList = offers.map(o => `* ${o.title}: ${o.description}`).join('\n');
      return {
        topic,
        found: true,
        message: `Here are our current special promotions at Mobile Klinik Lethbridge:\n${offerList}`
      };
    }

    const faq = faqs.find(f => f.topic === normTopic);
    if (faq) {
      return {
        topic,
        found: true,
        question: faq.question,
        answer: faq.answer,
        message: faq.answer
      };
    }

    return {
      topic,
      found: false,
      message: `I don't have a specific policy on '${topic}' on hand, but we do offer premium device repairs. Let me transfer you to a human technician to help.`
    };
  }
};

export const MOBILE_KLINIK_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: "get_available_repair_slots",
        description: "Retrieves available hourly check-in/repair slots for a specific date at Mobile Klinik. Closed on Sundays.",
        parameters: {
          type: "OBJECT",
          properties: {
            date: {
              type: "STRING",
              description: "The date in YYYY-MM-DD format (e.g. '2026-06-08')."
            }
          },
          required: ["date"]
        }
      },
      {
        name: "book_repair_job",
        description: "Books a repair slot for a customer's device. Confirms name, phone, device model, and specific issue.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "The full name of the customer."
            },
            phone: {
              type: "STRING",
              description: "The phone number of the customer."
            },
            date: {
              type: "STRING",
              description: "The date in YYYY-MM-DD format."
            },
            time: {
              type: "STRING",
              description: "The hourly time slot in HH:MM format (e.g., '10:00', '15:00')."
            },
            device: {
              type: "STRING",
              description: "The device model to repair (e.g. 'iPhone 13 Pro', 'Samsung Galaxy S22')."
            },
            issue: {
              type: "STRING",
              description: "The specific repair needed (e.g. 'Cracked Screen', 'Battery Replacement')."
            }
          },
          required: ["name", "phone", "date", "time", "device", "issue"]
        }
      },
      {
        name: "check_repair_status",
        description: "Looks up the repair status, cost, and progress of a repair ticket by customer phone number, name, or ticket ID (e.g. 'TK-101').",
        parameters: {
          type: "OBJECT",
          properties: {
            phone_or_name: {
              type: "STRING",
              description: "The phone number, name, or ticket ID of the customer's repair."
            }
          },
          required: ["phone_or_name"]
        }
      },
      {
        name: "get_repair_price",
        description: "Retrieves the standard estimated pricing and repair duration for a given device model and repair issue.",
        parameters: {
          type: "OBJECT",
          properties: {
            device: {
              type: "STRING",
              description: "The phone model."
            },
            issue: {
              type: "STRING",
              description: "The repair type/issue (e.g. 'Screen', 'Battery')."
            }
          },
          required: ["device", "issue"]
        }
      },
      {
        name: "klinik_hours",
        description: "Queries the opening and closing hours of Mobile Klinik repair shop.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "klinik_location",
        description: "Retrieves the street address and customer parking information for Mobile Klinik.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "check_store_faq",
        description: "Retrieves answers about store policies, repair warranty coverage, free diagnostics, device brands repaired, mail-in options, and active promotional sales/offers.",
        parameters: {
          type: "OBJECT",
          properties: {
            topic: {
              type: "STRING",
              description: "The topic or category to query. Allowed values: 'warranty', 'diagnostics', 'repair_types', 'shipping_or_mail_in', 'promotions', or 'general'."
            }
          },
          required: ["topic"]
        }
      },
      {
        name: "handoff_to_human",
        description: "Escalates the call to a human repair technician. Used for complex issues or complaints.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {
              type: "STRING",
              description: "The reason for human escalation."
            }
          },
          required: ["reason"]
        }
      },
      {
        name: "save_transcript",
        description: "Saves the completed repair check-in dialogue transcript.",
        parameters: {
          type: "OBJECT",
          properties: {
            transcript: {
              type: "STRING",
              description: "The conversation text transcript."
            }
          },
          required: ["transcript"]
        }
      }
    ]
  }
];
