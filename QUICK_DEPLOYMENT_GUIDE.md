# ⚡ QUICK DEPLOYMENT GUIDE - AWS Learner Account

## 🚨 CRITICAL: This must be completed for assignment success

**Time Required**: 15-20 minutes  
**Prerequisites**: AWS Learner Lab credentials, Docker installed, PowerShell

---

## 🎯 STEP-BY-STEP DEPLOYMENT

### Step 1: Prepare Credentials (2 minutes)

```powershell
# Navigate to project root
cd d:\projects\api

# Copy environment template
Copy-Item .env.aws.example .env.aws

# Edit .env.aws with your AWS Learner Lab credentials:
# - AWS_ACCESS_KEY_ID=your_access_key
# - AWS_SECRET_ACCESS_KEY=your_secret_key  
# - AWS_SESSION_TOKEN=your_session_token
# - AWS_ACCOUNT_ID=your_account_id
```

### Step 2: Execute Deployment (15 minutes)

```powershell
# Run complete deployment script
.\scripts\aws-deploy-complete.ps1

# This automatically:
# ✅ Creates ECR repositories for all 6 services
# ✅ Builds Docker images locally
# ✅ Pushes images to AWS ECR
# ✅ Creates ECS cluster and task definitions
# ✅ Deploys services to AWS Fargate
# ✅ Returns public URLs for each service
```

### Step 3: Verify Success (3 minutes)

```powershell
# Test the deployment
curl http://YOUR_GATEWAY_IP:4000/health
curl http://YOUR_GATEWAY_IP:4000/api-backend/products

# Expected responses:
# {"status":"ok","service":"gateway"}
# [{"id":"p1","name":"Laptop",...}]
```

---

## 🎯 EXPECTED OUTPUTS

### Successful Deployment Shows:
```
🎉 DEPLOYMENT COMPLETE!
======================

🔗 Service URLs:
   gateway : http://54.123.45.67:4000
   products : http://54.123.45.68:4001
   carts : http://54.123.45.69:4002
   orders : http://54.123.45.70:4003
   payments : http://54.123.45.71:4004
   invoices : http://54.123.45.72:4005

🌐 Main Application URLs:
   Gateway API    : http://54.123.45.67:4000
   Health Check   : http://54.123.45.67:4000/health
   Products API   : http://54.123.45.67:4000/api-backend/products
```

### Use These URLs For:
- **Assignment Demo**: Show live cloud deployment
- **Technical Report**: Document as "deployed to AWS"
- **Presentation**: Demonstrate working cloud application
- **Moodle Submission**: Include in project documentation

---

## 🔄 FOR DEMO DAY

### Update Credentials (1 minute):
```powershell
.\scripts\update-aws-credentials.ps1 -AccessKey "NEW_KEY" -SecretKey "NEW_SECRET" -SessionToken "NEW_TOKEN"
```

### Re-deploy (10 minutes):
```powershell
.\scripts\aws-deploy-complete.ps1
```

### Test & Present:
- Show health check URL in browser
- Demonstrate API endpoints
- Explain cloud architecture

---

## 🎯 ASSIGNMENT COMPLETION CHECKLIST

After successful deployment:

- [ ] **Document URLs** in technical report
- [ ] **Test all endpoints** work from internet
- [ ] **Screenshot deployment** for evidence
- [ ] **Update README.md** with live URLs
- [ ] **Prepare demo script** using deployed services
- [ ] **Upload to Moodle** with deployment evidence

**✅ DEPLOYMENT COMPLETE = ASSIGNMENT REQUIREMENTS MET**

---

## 🆘 TROUBLESHOOTING

### If Deployment Fails:
1. **Check AWS credentials** are current and valid
2. **Verify Docker is running** locally
3. **Ensure AWS CLI is installed** and configured
4. **Check internet connection** for image pushes

### If Services Don't Start:
1. **Check ECS console** for service status
2. **Review CloudWatch logs** for error messages
3. **Verify security groups** allow inbound traffic
4. **Confirm task definitions** are registered correctly

### Quick Fixes:
```powershell
# Reset everything and try again
aws ecs delete-service --cluster ecommerce-nci-cluster --service ecommerce-nci-gateway --force
.\scripts\aws-deploy-complete.ps1
```

**Remember**: AWS Learner Labs reset every session. Always use fresh credentials for each deployment.

---

## 🎯 SUCCESS CRITERIA

### ✅ Deployment Successful When:
- All 6 services show "RUNNING" in ECS console
- Gateway health check returns 200 OK
- Products API returns product list
- All URLs accessible from any internet browser
- No error messages in deployment script output

### ✅ Assignment Ready When:
- Live URLs documented in report
- Screenshots of working deployment
- Demo script prepared with deployed URLs
- All deliverables reference cloud deployment

**🎉 CONGRATULATIONS! Your cloud application is now deployed and assignment-ready!**