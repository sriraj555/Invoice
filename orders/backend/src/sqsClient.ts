import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.AWS_REGION ?? "us-east-1" });

export async function sendOrderEvent(message: Record<string, unknown>): Promise<boolean> {
  const queueUrl = process.env.ORDER_EVENTS_QUEUE_URL;
  if (!queueUrl) {
    console.log("ORDER_EVENTS_QUEUE_URL not set, skipping SQS publish");
    return false;
  }
  try {
    await sqs.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    }));
    console.log("SQS: Order event published", message.orderId);
    return true;
  } catch (err) {
    console.error("SQS publish failed:", err);
    return false;
  }
}
