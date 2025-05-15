# ChatGPT CLI

An experimental CLI app to chat with OpenAI models, created using Deno.

## Setup
Clone the repository:
```bash
git clone https://github.com/bontaramsonta/chatgpt-cli.git
cd chatgpt-cli
```

Create a .env file:
```bash
touch .env
```

Add your OpenAI API key to the .env file:
```env
OPENAI_API_KEY=your-api-key-here
```

Run the application:
```bash
deno run main.ts
```

## CLI Usage
Interact with OpenAI models directly from the command line. Perform actions like:

- Sending prompts to the OpenAI model.
- Receiving and displaying responses in real-time.
- Chat histories saved in a db file
- View and delete previous history
