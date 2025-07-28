# HTML Assets

The file [page.tsx](../../src/app/chat/[exercise]/page.tsx) maintains a list of messages. These messages are generated from AI responses (converted from Markdown to HTML).

The Markdown code returned by the AI can contain HTML code. It is marked with the typical tripple backticks (```html ... ```).

The following changes must be made to the code:

* Messages must be able to hold a new type of content: HTML code.
* Once an AI message has fully been received, the Markdown code must be searched for HTML code islands. These islands are identified by the tripple backticks (```html ... ```). We assume that the ```html must be at the beginning of a line and must be the only text in that line. Same applies for the closing tripple backticks.
* If an HTML code island is found, it must be extracted and added to the messages. This happens in addition to adding the AI response to the messages. The HTML code must be added AFTER the AI response.
* HTML messages must be rendered in the conversation history using iframe elements with the `srcdoc` attribute.

Limitations:

* Do NOT change anything regarding the existing rendering of Markdown including embedded code.
* Do NOT remove the HTML code islands from the Markdown code. Keep this as it is.
* Only add the iframe after the AI response.
* Keep CSS formatting to a minimum. We will work on this later.
