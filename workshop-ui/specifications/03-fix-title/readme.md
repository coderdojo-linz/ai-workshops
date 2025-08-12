# Fix Title

## Introduction

This application implements a simple AI chatbot. It will be used for AI workshops with kids.

The [prompts](../../prompts/) folder contains metadata for the exercises in [exercises.json](../../prompts/exercises.json). It points to folders with the system prompt and the data file for each exercise.

The application itself is a Next.js application:

* [src/app/page.tsx](../../src/app/page.tsx) is the main page of the application. It lists all exercises and links to the chat page for each exercise.
* [src/app/chat/[exercise]/page.tsx](../../src/app/chat/[exercise]/page.tsx) is the chat page for each exercise. It displays the chat history and the input field for the user to enter their message.

The corresponding CSS files are called _page.module.css_ and are located in the same folder as the corresponding page.

The application also contains a web API in [src/app/api](../../src/app/api). Currently, there is only one endpoint that implements the chat functionality using SSE.

## Functional Requirements

### Add API endpoint for querying exercise metadata

Add an API endpoint for querying exercise metadata (data in _exercises.json_).

Input (in path): Exercise identifier in _exercises.json_ (e.g. `GET /api/exercises/data-cave`)
Output: Title, folder, system_prompt_file, data_file (as JSON)

### Add API endpoint for querying the system prompt for an exercise

Input (in path): Exercise identifier in _exercises.json_ (e.g. `GET /api/exercises/data-cave/system-prompt`)
Output: System prompt as-is (as plain text)

404 if exercise is not found.

### Fix title in chat page

Currently, the title of the exercise in [src/app/chat/[exercise]/page.tsx](../../src/app/chat/[exercise]/page.tsx) is the exercise's identifier. Once the API endpoint is implemented, the real title should be fetched from the API.

Initially, the title should be the exercise's identifier. Once the API call is finished, the title should be updated to the exercise's title.

### Add component for rendering the system prompt

Add a component that can be used to render the system prompt for an exercise with a given ID. It must use the API endpoint mentioned above.

### Add link to system prompt in chat page

The chat page contains a title bar with a back link and the exercise title. Add a button on the right side of the title bar that shows the system prompt in a HTML modal dialog with a single close button. Use the server component from the previous requirementfor rendering the system prompt.

## Quality Requirements

### Not Found

If an exercise is not found, the application should return a 404 status code.

### Caching

No caching for exercise metadata or system prompts needed.
