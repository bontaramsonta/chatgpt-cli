const db = await Deno.openKv();

const user = {
    name: "test",
    chats: [],
}

await db.set(["user", user.name], user);

const userEntry = await db.get(["user", "something"]);
console.log(userEntry);
