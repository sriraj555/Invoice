# Scalability (assignment requirement)

This backend is designed to be scalable:

- **Stateless**: No in-memory persistence required; can be replaced with Redis/DB via env.
- **Horizontal scaling**: Run multiple instances behind a load balancer; use `PORT` and service URLs via env.
- **Ready for queues/FaaS**: Order creation and inventory reserve can be moved to a queue (e.g. SQS, Pub/Sub) for async processing; validate-price and recommendations can be offloaded to serverless functions.
- **Public API**: Uses external API (e.g. Frankfurter) for price/currency validation; can be swapped or extended without code change via `PUBLIC_EXCHANGE_API`.

Deploy to a public cloud (e.g. AWS ECS, GCP Cloud Run, Azure Container Apps) with environment-based config and optional autoscaling on CPU/request count.
