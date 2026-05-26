import { config } from "./config.js";
import { prisma } from "./prisma.js";
import { buildServer } from "./server.js";

const server = buildServer();

const shutdown = async () => {
  server.log.info("Shutting down");
  await server.close();
  await prisma.$disconnect();
};

process.on("SIGINT", () => {
  void shutdown().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().then(() => process.exit(0));
});

try {
  await server.listen({
    host: config.HOST,
    port: config.PORT
  });
} catch (error) {
  server.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}

