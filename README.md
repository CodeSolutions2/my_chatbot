# my_chatbot

There are several different chatbot models used with the library_to_run_GitHub_Actions.js syncrhonization software architecture: 
1. OpenAI Assistant - a standard AI model using a personal text file
2. Custom model - a finetunned model using personal text *(in progress)*

## Best working version (Chat with my Digital Twin 🤖 at the link below)

https://codesolutions2.github.io/my_chatbot/index11.html

The web app can be run using both a Backend or Frontend software organization architecture. 
- Backend architecture means that the call to the model using the tokens/keys are performed on the GitHub Actions server/runner and results are then saved to a file for GitHub pages JavaScript to read; this process is time consuming and takes roughly 2 minutes to receive a response to the webapp.
- Frontend architecture means that the call to the model using the tokens/keys are performed in GitHub pages via JavaScript; encoded tokens/keys are created by the backend (GitHub Actions server/runner) and saves them to file, GitHub pages via JavaScript reads the encoded tokens/keys and decodes them, then calls the model and outputs the response directly to the DOM. This processing style is fast and takes roughly 20-30 seconds.
