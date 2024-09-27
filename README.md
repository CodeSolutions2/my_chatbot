# my_chatbot

The Purpose of this repository is to deploy chatbot models using both Frontend and Backend software organization methods. A library that I created on npm [library_to_run_GitHub_Actions.js](https://www.jsdelivr.com/package/npm/library_to_run_github_actions) is used to encrypt model tokens and launch repository processes. 

The goal of the webapp is to use both Backend or Frontend software organization architecture:
- Backend architecture means that the call to the model using the tokens/keys are performed on the GitHub Actions server/runner and results are then saved to a repository file or directly put into the HTML using a web driver.
- Frontend architecture means that the call to the model using the tokens/keys are performed in GitHub pages via JavaScript; encoded tokens/keys are created by the backend (GitHub Actions server/runner) and saves them to file, GitHub pages via JavaScript reads the encoded tokens/keys and decodes them, then calls the model and outputs the response directly to the DOM. This processing style is fast and takes roughly 20-30 seconds.

## Data collection
The chatbot model uses a text journal of my personal thoughts and experiences. During daily exercise, I record my personal thoughts, ideas, and experiences and I transcribe them to this text journal. Thus, when you ask the chatbot questions, you are literally asking me questions about things that I have discussed and thought about.

## Best working version (Chat with my Digital Twin 🤖 at the link below)
https://codesolutions2.github.io/my_chatbot/index12.html
- Frontend processes with OpenAI Assistant functions - a standard AI model using a personal text file


## In progress
- Backend workflow (at the moment the Frontend workflow only functions)
- Custom model - a finetunned model
