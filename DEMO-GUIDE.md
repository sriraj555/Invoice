# E-Commerce Microservices - Complete Demo Guide

## LIVE URLs (Current Session)

### Frontend URLs (S3 Static Website Hosting)
| Student | Service | Frontend URL |
|---------|---------|-------------|
| **Jaswanth** (x23420464) | Product Catalog | http://products-frontend-851725276040.s3-website-us-east-1.amazonaws.com |
| **Mounika** (x24213934) | Shopping Cart | http://carts-frontend-238811450261.s3-website-us-east-1.amazonaws.com |
| **Pavan** (x24211371) | Order Processing | http://orders-frontend-533267029271.s3-website-us-east-1.amazonaws.com |
| **Ruchitha** (x24269816) | Payment Processing | http://payments-frontend-975050377353.s3-website-us-east-1.amazonaws.com |
| **Sriraj** (x23431873) | Invoice Generator | http://invoices-frontend-992382686490.s3-website-us-east-1.amazonaws.com |

### Backend API URLs (EC2 Instances)
| Student | Service | Backend URL | EC2 Instance |
|---------|---------|-------------|-------------|
| **Jaswanth** | Gateway (API Router) | http://98.80.69.230:4000 | i-0340c5d17b2f5e574 |
| **Jaswanth** | Products API | http://98.80.69.230:4001 | (same instance) |
| **Mounika** | Carts API | http://44.210.149.76:4002 | i-03718d7880cc2686c |
| **Pavan** | Orders API | http://54.237.130.136:4003 | i-0f0a12f876ec65ec7 |
| **Ruchitha** | Payments API | http://44.220.46.106:4004 | i-059ae7ffdab3e5e2a |
| **Sriraj** | Invoices API | http://3.235.180.116:4005 | i-0d1f1ba631e7aa78c |

---

## HOW TO EXPLAIN TO YOUR PROFESSOR

### Project Overview (What to Say)
"We built an e-commerce platform using a **microservices architecture** where each team member developed, deployed, and owns one independent service. All 6 services communicate through a central **API Gateway** using REST APIs."

### Architecture Explanation
```
                    [Frontend UIs - S3 Static Hosting]
                              |
                    [API Gateway - Port 4000]
                    /    |      |      |     \
              Products  Carts  Orders  Payments  Invoices
              (4001)   (4002)  (4003)   (4004)   (4005)

Each service runs on its own EC2 instance in a separate AWS account.
Frontends are hosted on S3 (static website hosting) in each student's account.
```

### Key Technical Points to Mention
1. **Microservices Architecture**: 6 independent Node.js/Express/TypeScript services
2. **API Gateway Pattern**: Single entry point routes requests to correct backend service
3. **Inter-Service Communication**: Services talk to each other via REST (e.g., Orders calls Products to validate stock, calls Invoices to generate invoice)
4. **Separate AWS Accounts**: Each student deployed their service in their own AWS Learner Lab account
5. **S3 Static Website Hosting**: React frontends built with Vite, deployed as static files on S3
6. **EC2 Deployment**: Backend services run on t2.micro Amazon Linux 2023 instances
7. **71 Automated Test Cases**: Comprehensive test suite covering all endpoints + E2E flow
8. **Public API Integration**: Products service integrates with Frankfurter API for currency/price validation

### Each Student's Responsibility
| Student | Their API | What It Does | Connects To |
|---------|-----------|-------------|-------------|
| **Jaswanth** | Product Catalog & Inventory | CRUD products, check stock, validate prices | Public API (Frankfurter for pricing) |
| **Mounika** | Shopping Cart Management | Add/remove items, discounts, cart totals | Products (fetch product details) |
| **Pavan** | Order Processing | Create orders, track status, confirm payments | Carts, Products, Payments, Invoices |
| **Ruchitha** | Payment Processing | Validate & process payments, track status | Orders (confirm payment success) |
| **Sriraj** | Invoice & Receipt Generator | Generate invoices, create PDF receipts | Orders (get order details), Products (get product info) |

### Demo Flow (Show This to Professor)
1. Open **Products frontend** → Show product catalog with Wireless Mouse ($29.99) and USB-C Hub ($49.99)
2. Open **Carts frontend** → Create a cart, add products, apply discount code "SAVE10"
3. Open **Orders frontend** → Create an order from cart items
4. Open **Payments frontend** → Process payment for the order
5. Open **Invoices frontend** → Generate invoice and download PDF

### Quick API Demo (curl commands to show in terminal)
```bash
# 1. List products
curl http://98.80.69.230:4000/api-backend/products

# 2. Create a cart
curl -X POST http://98.80.69.230:4000/api-backend/cart -H "Content-Type: application/json" -d '{"userId":"demo"}'

# 3. Add item to cart (replace CART_ID)
curl -X POST http://98.80.69.230:4000/api-backend/cart/CART_ID/items -H "Content-Type: application/json" -d '{"productId":"p1","quantity":2}'

# 4. Create order (replace CART_ID)
curl -X POST http://98.80.69.230:4000/api-backend/orders -H "Content-Type: application/json" -d '{"userId":"demo","cartId":"CART_ID","items":[{"productId":"p1","quantity":2,"price":29.99,"name":"Wireless Mouse"}],"totalAmount":59.98,"currency":"USD","shippingAddress":"123 Demo St"}'

# 5. Process payment (replace ORDER_ID)
curl -X POST http://98.80.69.230:4000/api-backend/payments -H "Content-Type: application/json" -d '{"orderId":"ORDER_ID","amount":59.98,"currency":"USD","method":"credit_card","cardLast4":"4242"}'

# 6. Confirm payment & generate invoice (replace ORDER_ID, PAYMENT_ID)
curl -X POST http://98.80.69.230:4000/api-backend/orders/ORDER_ID/confirm-payment -H "Content-Type: application/json" -d '{"paymentId":"PAYMENT_ID","userEmail":"demo@test.com"}'
```

---

## WHAT EXPIRES AND WHAT DOESN'T

### EXPIRES (when lab session ends, ~4 hours):
- **EC2 instances** - they get terminated, IPs change
- **AWS credentials** (access key, secret key, session token)
- Backend services stop running

### DOES NOT EXPIRE:
- **S3 buckets and files** - frontends stay hosted! BUT the frontends have the gateway IP baked in, so they'll show "Failed to fetch" until backends are redeployed
- **Security Groups** - they persist across sessions
- **Source code** - everything is on your local machine in D:\projects\api\

---

## HOW TO REDEPLOY (Next Session)

### Step 1: Get Fresh Credentials (ALL 5 students)
Each student must:
1. Go to AWS Academy → Learner Lab
2. Click **"Start Lab"** (wait for green light)
3. Click **"AWS Details"** → **"Show"** next to AWS CLI
4. Copy the 3 lines and send them

### Step 2: Update Credentials
For each student, run:
```bash
aws configure set aws_access_key_id PASTE_KEY --profile PROFILE_NAME
aws configure set aws_secret_access_key PASTE_SECRET --profile PROFILE_NAME
aws configure set aws_session_token PASTE_TOKEN --profile PROFILE_NAME
aws configure set region us-east-1 --profile PROFILE_NAME
```
Profile names: `jaswanth`, `mounika`, `pavan`, `ruchitha`, `sriraj`

### Step 3: Verify Credentials
```bash
aws sts get-caller-identity --profile jaswanth
aws sts get-caller-identity --profile mounika
aws sts get-caller-identity --profile pavan
aws sts get-caller-identity --profile ruchitha
aws sts get-caller-identity --profile sriraj
```

### Step 4: Launch EC2 Instances
For each student, run (replace PROFILE, SG_ID, SUBNET_ID):
```bash
AMI="ami-0cb5cf49019e79c51"

# Find existing security group
SG_ID=$(aws ec2 describe-security-groups --profile PROFILE --query 'SecurityGroups[?GroupName==`SERVICE-sg`].GroupId' --output text)

# Find subnet
SUBNET_ID=$(aws ec2 describe-subnets --profile PROFILE --query 'Subnets[0].SubnetId' --output text)

# Launch
aws ec2 run-instances --image-id $AMI --instance-type t2.micro --key-name vockey \
  --security-group-ids $SG_ID --subnet-id $SUBNET_ID --associate-public-ip-address \
  --user-data file://D:/projects/api/deploy/userdata.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=SERVICE-service}]" \
  --profile PROFILE
```

### Step 5: Wait ~60 seconds, then deploy code
```bash
# Push SSH key (replace INSTANCE_ID, AZ, PROFILE)
aws ec2-instance-connect send-ssh-public-key \
  --instance-id INSTANCE_ID --instance-os-user ec2-user \
  --ssh-public-key file://C:/Users/Aditya_Lappy/.ssh/id_rsa.pub \
  --availability-zone AZ --profile PROFILE

# Upload tarball (replace SERVICE, IP)
scp -o StrictHostKeyChecking=no D:/projects/api/deploy/SERVICE.tar.gz ec2-user@IP:/home/ec2-user/

# SSH and start (replace SERVICE, PORT, ENV_VARS)
ssh ec2-user@IP "cd /home/ec2-user && tar xzf SERVICE.tar.gz && PORT=PORT ENV_VARS nohup node dist/server.js > service.log 2>&1 &"
```

### Step 6: Rebuild frontends with new Gateway IP
```bash
cd D:/projects/api
for svc in products carts orders payments invoices; do
  cd ${svc}/frontend
  VITE_API_URL="http://NEW_GATEWAY_IP:4000/api-backend" npx vite build
  aws s3 sync dist s3://BUCKET_NAME/ --profile PROFILE
  cd ../..
done
```

### Security Groups (already created, reuse these):
| Student | Profile | SG Name | Ports |
|---------|---------|---------|-------|
| Jaswanth | jaswanth | products-gateway-sg | 22, 4000, 4001 |
| Mounika | mounika | carts-sg | 22, 4002 |
| Pavan | pavan | orders-sg | 22, 4003 |
| Ruchitha | ruchitha | payments-sg | 22, 4004 |
| Sriraj | sriraj | invoices-sg | 22, 4005 |

### Environment Variables for Each Service:
```bash
# Products (Jaswanth) - no external deps
PORT=4001

# Gateway (Jaswanth) - needs ALL service URLs
PORT=4000 PRODUCTS_SERVICE_URL=http://localhost:4001 \
  CARTS_SERVICE_URL=http://MOUNIKA_IP:4002 \
  ORDERS_SERVICE_URL=http://PAVAN_IP:4003 \
  PAYMENTS_SERVICE_URL=http://RUCHITHA_IP:4004 \
  INVOICES_SERVICE_URL=http://SRIRAJ_IP:4005

# Carts (Mounika)
PORT=4002 PRODUCTS_SERVICE_URL=http://JASWANTH_IP:4001

# Orders (Pavan)
PORT=4003 PRODUCTS_SERVICE_URL=http://JASWANTH_IP:4001 \
  CARTS_SERVICE_URL=http://MOUNIKA_IP:4002 \
  PAYMENTS_SERVICE_URL=http://RUCHITHA_IP:4004 \
  INVOICES_SERVICE_URL=http://SRIRAJ_IP:4005

# Payments (Ruchitha)
PORT=4004 ORDERS_SERVICE_URL=http://PAVAN_IP:4003

# Invoices (Sriraj)
PORT=4005 ORDERS_SERVICE_URL=http://PAVAN_IP:4003 \
  PRODUCTS_SERVICE_URL=http://JASWANTH_IP:4001
```

---

## Pre-built Tarballs (Ready to Deploy)
Located in `D:\projects\api\deploy\`:
- `products.tar.gz` (7MB) - Products backend
- `carts.tar.gz` (7MB) - Carts backend
- `orders.tar.gz` (7MB) - Orders backend
- `payments.tar.gz` (7MB) - Payments backend
- `invoices.tar.gz` (13MB) - Invoices backend (includes pdfkit)
- `gateway.tar.gz` (6MB) - API Gateway

## Test Suite
```bash
cd D:\projects\api\tests
node aws-test.mjs  # 71 tests against live AWS deployment
```

## Discount Codes (for demo)
- `SAVE10` - 10% off
- `SAVE20` - 20% off

## Seed Products (auto-loaded on startup)
- p1: Wireless Mouse - $29.99 (100 stock)
- p2: USB-C Hub - $49.99 (50 stock)
