\# AI Voice Receptionist Platform



\## Vision



Build an AI-powered voice receptionist platform for clinics and pharmacies that can:



\* Answer inbound voice calls

\* Hold natural real-time conversations

\* Book appointments

\* Check medicine inventory

\* Answer clinic FAQs

\* Escalate to humans when needed

\* Integrate with calendars and inventory systems

\* Eventually support real telephony (Twilio/SIP)

\* Support multilingual conversations

\* Operate as a production-grade AI front desk assistant



The system should feel conversational, low-latency, reliable, and business-focused.



\---



\# Current Goal (POC / Demo)



The CURRENT goal is NOT production telephony.



The immediate objective is to build a browser-based voice demo that simulates an AI receptionist.



The demo should:



\* Work entirely in-browser

\* Use microphone input

\* Speak responses naturally

\* Show live transcripts

\* Book appointments into Google Calendar

\* Check fake medicine inventory

\* Demonstrate realistic receptionist behavior

\* Be visually polished for pitching



This is a proof-of-concept intended for:



\* investor demos

\* clinic demos

\* pharmacy demos

\* validating market interest



\---



\# Important Strategic Constraints



DO NOT overengineer the MVP.



Avoid:



\* complex multi-agent systems

\* vector databases

\* RAG pipelines

\* LangChain-heavy abstractions

\* custom speech pipelines

\* microservice architectures

\* EMR integrations

\* HIPAA-grade production workflows

\* Twilio/SIP telephony initially



The system should prioritize:



\* simplicity

\* low latency

\* conversational quality

\* reliability

\* ease of demoing

\* clean architecture

\* future scalability



\---



\# Core Product Philosophy



This is NOT a chatbot.



This is a:

"Voice Operations Layer for Clinics and Pharmacies"



The AI should:



\* sound human

\* speak briefly

\* confirm important information

\* avoid robotic phrasing

\* handle interruptions naturally

\* ask concise follow-up questions



The AI should NEVER:



\* hallucinate medicine stock

\* hallucinate appointment availability

\* provide medical advice

\* diagnose conditions

\* guess unavailable information



All factual data MUST come from tools/functions.



\---



\# Preferred Tech Stack



\## Frontend



\* React

\* Vite

\* TailwindCSS

\* WebSocket/WebRTC audio streaming



\## Backend



\* Node.js

\* Express



\## AI



\* Gemini Live API

\* Native audio conversational mode



\## Storage



\* Supabase (preferred)

&#x20; OR

\* lightweight JSON storage for demo stage



\## Calendar



\* Google Calendar API



\## Deployment



\* Vercel (frontend)

\* Railway or Render (backend)



\---



\# Architecture Principles



The architecture should be tool-driven.



The LLM should NEVER directly invent:



\* stock availability

\* appointment times

\* clinic schedules



Instead:



\* AI detects intent

\* AI calls tools

\* backend returns structured data

\* AI responds conversationally



Example:

User asks:

"Do you have Crocin?"



AI calls:

check\_stock("Crocin")



Backend returns:

{

"available": true,

"quantity": 12

}



AI then responds naturally.



\---



\# Required Tools / Functions



Implement these tools:



\## Appointment Tools



\* get\_available\_slots()

\* book\_appointment()

\* cancel\_appointment()



\## Inventory Tools



\* check\_stock()

\* reserve\_medicine()



\## Clinic Information



\* clinic\_hours()

\* doctor\_availability()

\* clinic\_location()



\## Utility



\* handoff\_to\_human()

\* save\_transcript()



\---



\# Initial Demo Features



The MVP MUST support:



\## Voice Conversation



\* microphone input

\* AI voice responses

\* interruption handling

\* low latency streaming



\## Live Transcript



\* real-time transcript display



\## Appointment Booking



\* Google Calendar integration

\* confirmation messages



\## Inventory Lookup



\* fake medicine inventory database



\## Modern UI



\* clean polished interface

\* microphone button

\* conversation state indicators

\* responsive design



\---



\# UX Requirements



The experience should feel:



\* fast

\* conversational

\* premium

\* reliable



The AI should:



\* avoid long paragraphs

\* respond in short natural speech

\* confirm important details

\* gracefully recover from misunderstandings



\---



\# Latency Requirements



Response latency is critical.



Prioritize:



\* streaming audio

\* streaming responses

\* minimal backend hops



Avoid:



\* multiple chained LLM calls

\* excessive orchestration

\* unnecessary middleware



Target:



\* under 1.5 seconds perceived latency



\---



\# Demo Design Philosophy



The demo should feel:

"magical but believable"



Keep flows narrow and polished.



Use:



\* fake inventory

\* controlled appointment slots

\* predefined doctor names



This is intentional.



The goal is:



\* demonstrate capability

\* validate market interest

\* secure pilot customers



NOT:



\* simulate an entire hospital system



\---



\# Future Production Roadmap



Future versions may include:



\* Twilio/SIP telephony

\* WhatsApp integration

\* multilingual support

\* real inventory systems

\* CRM integrations

\* EMR/EHR integrations

\* analytics dashboards

\* receptionist escalation

\* outbound reminders

\* prescription refill workflows



The architecture should remain modular enough to support these later.



\---



\# Audio System Requirements



IMPORTANT:

Do NOT build custom speech pipelines initially.



Avoid:



\* Whisper

\* ElevenLabs

\* Deepgram orchestration

\* separate STT/TTS chains



Prefer:



\* Gemini Live API native audio



Reason:



\* lower latency

\* simpler architecture

\* better interruption handling

\* faster development



\---



\# Security / Compliance Notes



For demo stage:



\* use mock/fake patient data

\* avoid storing sensitive health records



Future production systems may require:



\* HIPAA compliance

\* audit logging

\* encrypted storage

\* secure authentication



Do not prematurely optimize for this during MVP stage.



\---



\# Coding Standards



Code should be:



\* modular

\* readable

\* production-minded

\* easy to extend



Prefer:



\* clear folder structure

\* typed APIs where possible

\* reusable services

\* simple abstractions



Avoid:



\* unnecessary framework complexity

\* premature optimization

\* excessive dependency usage



\---



\# Desired Folder Structure



/apps

/frontend

/backend



/packages

/shared

/types



/docs



\---



\# Frontend Expectations



Frontend should include:



\* landing screen

\* voice assistant interface

\* live transcript panel

\* booking confirmation UI

\* inventory lookup feedback

\* loading states

\* speaking indicators



UI should feel modern and premium.



\---



\# Backend Expectations



Backend responsibilities:



\* manage Gemini Live sessions

\* execute tool calls

\* manage Google Calendar integration

\* inventory lookup

\* transcript persistence

\* websocket handling



\---



\# AI Behavior Rules



The AI receptionist should:



\* be polite

\* concise

\* calm

\* professional



The AI should:



\* ask one question at a time

\* confirm names and times

\* gracefully recover from confusion



The AI should NEVER:



\* pretend to know unavailable information

\* provide diagnoses

\* discuss prescriptions medically

\* make unsafe claims



\---



\# Success Criteria



The MVP is successful if a user can:



1\. Open the website

2\. Speak naturally

3\. Book an appointment

4\. Check medicine availability

5\. See live transcript updates

6\. Experience fluid AI conversation

7\. Feel like they interacted with a real receptionist



---

# Final Product Goal

The final long-term vision is to create:

"A scalable AI receptionist platform for clinics and pharmacies capable of replacing or augmenting front-desk operations through natural voice interaction."

---

# Technical Architecture Specs (POC Reference)

## Audio Stream Specifications
* **Input Stream**: 16-bit PCM little-endian, mono, 16kHz sample rate.
* **Output Stream**: 24kHz 16-bit PCM mono.
* **Interruption Handling**: Audio player stops instantly on receiving the `interrupted` packet, resetting `nextStartTime` to prevent overlap.
* **Microphone Pipeline**: Dynamically instantiated inline `AudioWorklet` (loaded via dynamic Blob URL) to handle capturing and posting input to the WebSocket hook.

## WebSocket Handshake
* **Target Endpoint**: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=API_KEY` (established via Node/Express proxy).
* **Initial Message**: `setup` payload configuring `models/gemini-2.0-flash-exp` with modality `AUDIO` and voice `Aoede`.

## Data Sync & Tool-driven Dashboard
* **Database**: Local JSON database (`db.json`) updated via the backend tools executor.
* **Frontend Sync**: The backend broadcasts a `db_update` frame containing the updated state to the frontend WebSocket upon any tool execution (e.g. `book_appointment`, `reserve_medicine`), which triggers real-time visual updates and flashing animations in the UI panels.


