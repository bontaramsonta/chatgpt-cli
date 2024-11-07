import "@std/dotenv/load";
import OpenAI from "@openai/openai";

//#types
type User = {
  name: string;
  chats: Chat[];
};

type Chat = {
  id: string;
  name: string;
  messages: Message[];
};

type Message = {
  role: "user" | "assistant" | "system";
  content: string | null;
};
const db = await Deno.openKv("./db.db");
const openai = new OpenAI();

//#main
if(import.meta.main) {
  let userName = prompt("Who are u?");
  while (!userName) {
    userName = prompt("Who are u?");
  }
  // get user from db
  const userEntry = await db.get(["user", userName]);
  let user: User | null = null;
  // if user not found, create user
  if (!userEntry.value) {
    user = { name: userName, chats: [] };
    await db.set(["user", userName], user);
    console.log("User created");
  } else {
    user = userEntry.value as User;
  }
  while (true) {
    await chooseAction({user});
  }
}


async function chooseAction({user}: {user: User}) {
  const action = prompt(`
What do you want to do?
1. chat
2. view chats
3. resume chat
4. exit
action:`);
switch (action) {
  case "1":
    await chat({ user });
    break;
  case "2":
    viewChats({ user });
    break;
  case "3": {
    viewChats({ user });
    const chatId = prompt("Which chat do you want to resume?");
    if (chatId) {
      await chat({ user, chatId });
      }
      break;
    }
    case "4": 
      Deno.exit(0);
  }
}

//#chat
async function chat({user, chatId}: {user: User, chatId?: string}) {
  let chat: Chat;
  if (chatId) {
    chat = user.chats.find((chat) => chat.id === chatId)!;
    console.log(`Resuming chat ${chat.id} - ${chat.name}`);
    // print all messages
    for (const message of chat.messages) {
      console.log(`${message.role}: ${message.content}`);
    }
  } else {
    // start a new chat
    chat = {
      id: user.chats.length.toString(),
      name: prompt("Name this chat session:")!,
      messages: [{ role: "system", content: "You are a helpful assistant." }],
    };
    // sync chat on every message
    syncChatToDB({user, chat});
  }
  while (true) {
    // get user message
    const userMessage = prompt("You:")
    if (!userMessage) break;
    // add userMessage to user's chats
    chat.messages.push({ role: "user", content: userMessage });
    await syncChatToDB({user, chat});
    // generate assistant message
    const assistantStream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // @ts-ignore: I know what I'm doing OpenAI
      messages: chat.messages,
      stream: true,
    });
    let assistantMessage = "";
    // stream assistant message to stdout
    for await (const chunk of assistantStream) {
      const content = chunk.choices[0]?.delta.content;
      if (content) {
        assistantMessage += content;
        Deno.stdout.write(new TextEncoder().encode(content));
      }
    }
    chat.messages.push({ role: "assistant", content: assistantMessage });
    await syncChatToDB({user, chat});
  }
}
  
async function syncChatToDB({user, chat}: {user: User, chat: Chat}) {
    const chatId = chat.id;
    const userChats = user?.chats;
    const newChatIndex = userChats?.findIndex((userChat) => userChat.id === chatId);
    if (newChatIndex !== -1) {
      user.chats[newChatIndex] = chat;
    } else {
      user.chats.push(chat);
    }
    await db.set(["user", user.name], user);
}

function viewChats({user}: {user: User}) {
  for (const chat of user.chats) {
    console.log(`${chat.id} - ${chat.name}`)
  }
}