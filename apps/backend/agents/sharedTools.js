export const SharedService = {
  handoffToHuman: async ({ reason }) => {
    console.log(`[Shared] handoff_to_human for reason: ${reason}`);
    return { escalated: true, message: `Transferring call to a human receptionist. Reason: ${reason}. Please stand by.` };
  },

  saveTranscript: async ({ transcript }) => {
    console.log(`[Shared] save_transcript`);
    // Mock save
    return { success: true, message: "Transcript archived successfully." };
  }
};

export const sharedTools = {
  handoff_to_human: SharedService.handoffToHuman,
  save_transcript: SharedService.saveTranscript
};
