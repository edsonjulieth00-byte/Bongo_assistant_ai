# Tanzania Assistant

## AI-Powered Digital Assistant for Tanzania Government Services

Tanzania Assistant is an AI-powered conversational assistant designed to help people access and understand information about Tanzania government services.

The current prototype focuses on:

- NIDA services
- Tanzanian passport services
- Immigration services

The assistant provides information through a conversational interface and is designed to make government-service information easier to understand and access.

## Problem

Information about government services is often distributed across different government websites, online portals, application forms, and documents.

Users may have difficulty finding:

- Required documents
- Application procedures
- Service requirements
- Fees
- Eligibility information
- Application and service information

Language can also create an additional barrier when important information is primarily available in English.

## Solution

Tanzania Assistant brings relevant government-service information into one conversational interface.

Users can ask questions in:

- English
- Swahili
- French

The assistant uses a Retrieval-Augmented Generation (RAG) approach so that responses can be grounded in the project's government-service knowledge base.

## Current Services

### NIDA

The assistant can provide information about topics such as:

- NIDA registration
- National Identification Number (NIN)
- NIDA replacement
- Correction of NIDA information
- Online NIDA services
- Resident foreigner registration
- Diaspora registration

### Passport

The assistant can provide information about:

- Passport application
- Passport requirements
- Passport types
- Passport fees
- Passport replacement
- Lost or stolen passports
- Damaged passports
- Emergency Travel Documents
- Passport application status

### Immigration

The assistant currently covers:

- Tanzania visas
- Visa requirements
- Visa types
- Visa fees
- Referral visas
- Residence permits
- Class A residence permits
- Class B residence permits
- Class C residence permits
- Immigration passes

## Key Features

- AI-powered conversational assistance
- English, Swahili, and French support
- Government-service knowledge base
- Retrieval-Augmented Generation (RAG)
- File upload and document questions
- Voice input
- Voice response
- Conversation history
- New chat
- Delete previous conversations
- Light and dark mode
- Suggested questions
- Message timestamps
- Responsive web interface

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Python
- FastAPI
- PyMuPDF
- Supabase
- Groq API

### AI

The prototype uses a Groq-hosted OpenAI GPT-OSS-120B model for response generation.

The system combines AI generation with a government-service knowledge base to provide grounded responses.

## Architecture

The application consists of three main parts:

```text
User
  |
  v
Next.js Frontend
  |
  v
FastAPI Backend
  |
  +----------------------+
  |                      |
  v                      v
Knowledge Retrieval     Groq AI
  |                      |
  +----------+-----------+
             |
             v
        AI Response
             |
             v
        User Interface