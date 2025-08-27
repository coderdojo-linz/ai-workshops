# Next.js Project Structure Overview: AI Workshops Platform

This Next.js application is an educational platform for AI workshops, primarily designed for CoderDojo events. It provides an interactive chat interface where users can work through data analysis exercises with AI assistance.

## Core Technologies & Dependencies

### Main Framework

- **Next.js** with App Router architecture
- **React** for UI components
- **TypeScript** for type safety

### AI Integration

- **Azure OpenAI Service** for GPT-based conversational AI
- **Azure Dynamic Sessions** for secure Python code execution

See `package.json` for the complete dependency list with specific versions.

## Authentication

### Concept of the Authentication System

- The Admin can create and manage workshops, generating access codes _per workshop_, that work within a time frame.
- The user signs in with this access code to join a workshop, granting access to all exercises.
- The user can log out on the exercise overview to end their session.

### The Auth API

The authentication system uses two main API endpoints:

#### POST /api/auth/login

- Accepts workshop access code
- Validates code against workshop database
- Checks time constraints (30 minutes before start to 30 minutes after end)
- Creates encrypted session using Iron Session
- Returns authentication status

#### POST /api/auth/logout

- Destroys current session
- Clears authentication cookies
- Redirects to login page

#### Session Management

- Uses Iron Session with encrypted cookies
- Two session types: App sessions (auth) and Chat sessions (conversation state)
- Session validation includes time-bound workshop access
- Automatic re-authentication when sessions expire

### The Admin Interface and Workshop Management API

#### Workshop Management UI (`/workshops`)

- Create new workshops with time constraints
- Generate unique access codes
- View workshop status and participant access
- Admin authentication via special workshop code

#### Workshop API Endpoints

- `GET /api/workshops` - List all workshops (admin only)
- `POST /api/workshops` - Create new workshop
- `PUT /api/workshops/[id]` - Update workshop details
- `DELETE /api/workshops/[id]` - Delete workshop

#### Workshop Schema

```typescript
interface Workshop {
  id: string;
  name: string;
  code: string;           // Access code for participants
  startDateTime: Date;    // Workshop start time
  endDateTime: Date;      // Workshop end time
  description?: string;
}
```

## The Exercise System

### Concept of the Exercise System

- Exercises are modular and can be added or modified easily.
- Each exercise has a system prompt, a collection of data files, and a task sheet.

**Exercise Structure:**
Each exercise is organized in the `/prompts/` directory with the following structure:

```text
prompts/
├── exercises.json           # Central registry of all exercises
└── [exercise-folder]/       # Individual exercise directories
    ├── system-prompt.md     # AI assistant instructions
    ├── welcome-message.md   # Initial chat message
    ├── tasksheet.md        # Exercise description for users  
    └── *.csv               # Data files for analysis
```

**Exercise Configuration (`exercises.json`):**

```json
{
  "exercises": {
    "data-cave": {
      "title": "Die Daten-Höhle",
      "folder": "01-data-cave",
      "difficulty": "easy",
      "summary": "Description of the exercise...",
      "system_prompt_file": "system-prompt.md",
      "welcome_message_file": "welcome-message.md", 
      "data_files": "data-cave.csv",
      "image": "/images/covers/01-data-cave.svg"
    }
  }
}
```

**Exercise Loading Process:**

1. Main page loads `exercises.json` to display available exercises
2. User selects an exercise → navigates to `/chat/[exercise]`  
3. Chat interface loads exercise-specific system prompt and data files
4. AI assistant is initialized with exercise context

### The Chat Interface

**Real-time Chat UI** (`/chat/[exercise]`)

The chat interface provides an interactive environment where users communicate with an AI assistant to solve data analysis exercises.

**Key Features:**

- **Real-time Streaming:** Server-Sent Events (SSE) for live AI responses
- **System Prompt Access:** Users can view the AI's instructions via dropdown menu
- **Task Sheet Modal:** Exercise description and requirements
- **Code Execution:** AI can generate and run Python code for data analysis
- **File Processing:** Dynamic integration of exercise data files
- **Message History:** Persistent conversation state within session

**Data Flow:**

1. User enters message
2. Message sent to `/api/chat` with exercise context
3. AI processes message with system prompt and data files
4. Streaming response updates UI in real-time
5. Code execution results (if any) displayed inline

### The Chat API

#### Main Endpoint: POST /api/chat

Handles all chat interactions with the AI assistant.

**Request Parameters:**

- `message`: User's input message
- `exercise`: Exercise identifier (from URL parameter)
- `previousResponseId`: Conversation continuity token

**Processing Pipeline:**

1. **Authentication:** Validate user session and workshop access
2. **Exercise Loading:** Fetch exercise configuration and data files
3. **Context Building:** Combine system prompt with data file previews
4. **AI Interaction:** Send to Azure OpenAI with streaming response
5. **Code Execution:** Process any Python code via Dynamic Sessions
6. **Response Assembly:** Stream chunks to client with session management

#### Code Interpreter tool with Azure Dynamic Sessions

The platform integrates Azure Dynamic Sessions to provide secure Python code execution capabilities for the AI assistant.

##### What are Azure Dynamic Sessions?

- Secure, isolated Python execution environments
- Automatically managed compute resources  
- File system access for data processing
- Safe execution of AI-generated code
- Returns execution results and standard output/error streams

## Data Privacy & Security

- All data is stored and processed either publicly on GitHub or on Azure servers in Europe.
- The whole application is open-source.
