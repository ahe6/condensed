import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { NotificationStatus, NotificationType, Prisma } from "@prisma/client";
import { config } from "../../config.js";
import { prisma } from "../../prisma.js";

type NotificationEventWithOrder = Prisma.NotificationEventGetPayload<{
  include: {
    order: true;
  };
}>;

type SendNotificationResult = {
  sent: boolean;
  skipped: boolean;
  reason?: string;
};

type RetryNotificationEventsOptions = {
  batchSize?: number;
};

let ses: SESv2Client | null = null;

export async function retryNotificationEvents(options: RetryNotificationEventsOptions = {}) {
  const batchSize = options.batchSize ?? 50;
  const events = await prisma.notificationEvent.findMany({
    where: {
      status: {
        in: [NotificationStatus.PENDING, NotificationStatus.FAILED]
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      status: true
    },
    take: batchSize
  });
  const results = [];

  for (const event of events) {
    if (event.status === NotificationStatus.FAILED) {
      await prisma.notificationEvent.update({
        where: {
          id: event.id
        },
        data: {
          status: NotificationStatus.PENDING,
          errorMessage: null
        }
      });
    }

    results.push({
      id: event.id,
      ...(await sendPendingNotificationEvent(event.id))
    });
  }

  return {
    batchSize,
    attemptedCount: results.length,
    sentCount: results.filter((result) => result.sent).length,
    skippedCount: results.filter((result) => result.skipped).length,
    failedCount: results.filter((result) => !result.sent && !result.skipped).length,
    results
  };
}

export async function sendPendingNotificationEvent(
  notificationEventId: string
): Promise<SendNotificationResult> {
  const event = await prisma.notificationEvent.findUniqueOrThrow({
    where: {
      id: notificationEventId
    },
    include: {
      order: true
    }
  });

  if (event.status !== NotificationStatus.PENDING) {
    return {
      sent: false,
      skipped: true,
      reason: `Notification status is ${event.status}`
    };
  }

  if (config.EMAIL_PROVIDER === "none") {
    return {
      sent: false,
      skipped: true,
      reason: "Email provider is not configured"
    };
  }

  const emailFrom = config.EMAIL_FROM;

  if (!emailFrom) {
    await markNotificationFailed(event.id, "EMAIL_FROM is required when EMAIL_PROVIDER=ses");

    return {
      sent: false,
      skipped: false,
      reason: "Missing sender email"
    };
  }

  if (event.type !== NotificationType.SHIPMENT_DELIVERED) {
    await markNotificationSkipped(event.id, `Unsupported notification type ${event.type}`);

    return {
      sent: false,
      skipped: true,
      reason: `Unsupported notification type ${event.type}`
    };
  }

  return sendShipmentDeliveredEmail(event, emailFrom);
}

async function sendShipmentDeliveredEmail(
  event: NotificationEventWithOrder,
  emailFrom: string
): Promise<SendNotificationResult> {
  const orderUrl = `${config.APP_BASE_URL.replace(/\/$/, "")}/orders/${encodeURIComponent(
    event.order.orderNumber
  )}`;
  const subject = `Your order ${event.order.orderNumber} was delivered`;
  const body = [
    "Your order was delivered.",
    "",
    "View your order:",
    orderUrl
  ].join("\n");

  try {
    const response = await getSes().send(
      new SendEmailCommand({
        FromEmailAddress: emailFrom,
        Destination: {
          ToAddresses: [event.recipientEmail]
        },
        Content: {
          Simple: {
            Subject: {
              Data: subject
            },
            Body: {
              Text: {
                Data: body
              }
            }
          }
        }
      })
    );

    await prisma.notificationEvent.update({
      where: {
        id: event.id
      },
      data: {
        status: NotificationStatus.SENT,
        provider: "ses",
        providerMessageId: response.MessageId,
        errorMessage: null,
        sentAt: new Date()
      }
    });

    return {
      sent: true,
      skipped: false
    };
  } catch (error) {
    await markNotificationFailed(
      event.id,
      error instanceof Error ? error.message : "Unknown SES send failure"
    );

    return {
      sent: false,
      skipped: false,
      reason: error instanceof Error ? error.message : "Unknown SES send failure"
    };
  }
}

function markNotificationFailed(notificationEventId: string, errorMessage: string) {
  return prisma.notificationEvent.update({
    where: {
      id: notificationEventId
    },
    data: {
      status: NotificationStatus.FAILED,
      provider: "ses",
      errorMessage
    }
  });
}

function markNotificationSkipped(notificationEventId: string, reason: string) {
  return prisma.notificationEvent.update({
    where: {
      id: notificationEventId
    },
    data: {
      status: NotificationStatus.SKIPPED,
      errorMessage: reason
    }
  });
}

function getSes() {
  if (!ses) {
    ses = new SESv2Client({
      region: config.AWS_REGION
    });
  }

  return ses;
}
