import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function debug() {
  try {
    const list = await db.select().from(users).limit(5);
    console.log(JSON.stringify(list, null, 2));
    
    // Check for bad created at
    list.forEach(u => {
        try {
            if (u.createdAt) {
                new Date(u.createdAt).toISOString();
            } else {
                console.log("User without createdAt:", u.id);
            }
        } catch(e) {
            console.log("BAD DATE for user:", u.id, u.createdAt);
        }
    });

    // Check for bad username
    const nullUsernames = await db.select().from(users).where(users.username);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

debug();
