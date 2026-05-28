import { retryNotificationEvents } from "../modules/notifications/notifications.service.js";
import { prisma } from "../prisma.js";

async function main() {
  const batchSize = Number(process.env.NOTIFICATION_RETRY_BATCH_SIZE ?? "50");
  const result = await retryNotificationEvents({
    batchSize
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
