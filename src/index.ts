import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function insertUser(name: string, email: string) {
  const user = await prisma.user.create({
    data: {
      name,
      email,
    },
  });
  return user;
}

async function getUsers() {
  const users = await prisma.user.findMany();
  return users;
}

async function main() {
  console.log("Inserting users...");

  const user1 = await insertUser("Alice", "alice@example.com");
  console.log("Created user:", user1);

  const user2 = await insertUser("Bob", "bob@example.com");
  console.log("Created user:", user2);

  console.log("\nFetching all users...");
  const allUsers = await getUsers();
  console.log("All users:", allUsers);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
