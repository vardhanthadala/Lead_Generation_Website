import { PrismaClient } from "@prisma/client";
try {
  const prisma = new PrismaClient({ url: process.env.DATABASE_URL });
  console.log("URL SUCCESS");
} catch (e) {
  console.log("URL FAIL:", e.message);
}
try {
  const prisma2 = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  console.log("DATASOURCEURL SUCCESS");
} catch (e) {
  console.log("DATASOURCEURL FAIL:", e.message);
}
try {
  const prisma3 = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  console.log("DATASOURCES SUCCESS");
} catch (e) {
  console.log("DATASOURCES FAIL:", e.message);
}
