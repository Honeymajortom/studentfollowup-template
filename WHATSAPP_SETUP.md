# WhatsApp Cloud API — Setup Guide

This guide walks you through connecting the EduSpark CRM to Meta's WhatsApp Cloud API
so you can send fee reminders, follow-up alerts, and bulk messages to students.

---

## Prerequisites

- A **Facebook account** (personal is fine)
- A **Meta Business Account** (free — created during setup)
- Your backend server running (locally or deployed)
- A **real mobile number** to receive test messages

---

## Part 1 — Meta Developer Setup

### 1.1 Create a Meta Developer Account

1. Open **https://developers.facebook.com**
2. Click **Get Started** (top-right) and log in with your Facebook account
3. Accept the developer terms if prompted

---

### 1.2 Create an App

1. Click **My Apps** → **Create App**
2. For app type, select **Business** → click **Next**
3. Fill in:
   - **App Name**: `EduSpark CRM` (or anything you like)
   - **App Contact Email**: your email
   - **Business Account**: create one if you don't have one yet
4. Click **Create App** and complete any security checks

---

### 1.3 Add WhatsApp to the App

1. On the app dashboard, scroll to find **WhatsApp** in the products list
2. Click **Set up** next to WhatsApp
3. You will land on the **WhatsApp → Getting Started** page — keep this tab open, you'll need it in the next steps

---

## Part 2 — Get Your Credentials

On the **Getting Started** page you will see a panel like this:

```
Step 1: Select a phone number
  Phone number: +1 555-XXX-XXXX (TEST NUMBER)
  Phone Number ID: 1234567890123456       ← copy this

Step 2: Send messages with the API
  Temporary access token: EAAxxxxxxxx...  ← copy this (valid 24 hrs)
```

You also need your **WhatsApp Business Account ID**:
1. Click **WhatsApp** in the left sidebar → **Getting Started**
2. Look for **WhatsApp Business Account ID** just below the phone number panel, or go to
   **Business Settings** → **Accounts** → **WhatsApp Accounts** → the ID is shown there

---

### 2.1 Create a Permanent Access Token (important for production)

The temporary token expires every 24 hours. To get one that never expires:

1. Go to **Business Settings** (gear icon, top-left of Meta Business Suite)
2. Click **Users** → **System Users** → **Add**
3. Name it `EduSpark Bot`, role: **Admin** → **Create System User**
4. Click **Add Assets** → select your App → enable **Manage app** → **Save**
5. Click **Generate New Token** on the system user
6. Select your app, set expiry to **Never**, tick these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
7. Click **Generate Token** → **copy it immediately** (shown only once)

---

## Part 3 — Configure Your Backend

Open `edufollowcrm-backend/.env` and fill in the four WhatsApp lines:

```env
WA_PHONE_NUMBER_ID=1234567890123456
WA_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxx
WA_VERIFY_TOKEN=eduspark_secret_2024
WA_API_VERSION=v18.0
```

| Variable | What to put |
|---|---|
| `WA_PHONE_NUMBER_ID` | Phone Number ID from Part 2 |
| `WA_ACCESS_TOKEN` | Permanent token from Part 2.1 (or temp token for testing) |
| `WA_VERIFY_TOKEN` | **Any random string you choose** — e.g. `eduspark_secret_2024`. You will enter this same string in Meta's webhook form later |
| `WA_API_VERSION` | Leave as `v18.0` |

Restart the backend after saving:

```bash
cd edufollowcrm-backend
npm start
```

---

## Part 4 — Register the Webhook

Meta needs a public URL to send delivery/read status updates back to your app.

### 4.1 Expose your backend publicly

**For development (local machine):**

Install ngrok if you don't have it: https://ngrok.com/download

```bash
ngrok http 5000
```

ngrok will print a URL like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

Use that URL as your base URL in the next step.

**For production:** use your actual deployed backend URL (Render, Railway, VPS, etc.)

---

### 4.2 Add the Webhook in Meta Dashboard

1. In your app dashboard → **WhatsApp** → **Configuration**
2. Under **Webhook**, click **Edit**
3. Fill in:
   - **Callback URL**: `https://your-domain.com/api/whatsapp/webhook`
   - **Verify Token**: the exact same value you put in `WA_VERIFY_TOKEN` in `.env`
4. Click **Verify and Save**
   - Meta will call your backend's `GET /api/whatsapp/webhook` to confirm — if it returns 200, you're verified
5. After saving, click **Manage** next to Webhook Fields and subscribe to **messages**

---

## Part 5 — Add a Test Recipient

Meta's test phone number can only message **verified numbers**. To add yours:

1. On the **Getting Started** page → find the **To** phone number field
2. Click **Add phone number**
3. Enter your mobile number (with country code, e.g. `+919876543210`)
4. Enter the OTP you receive on WhatsApp
5. Your number is now approved to receive test messages

---

## Part 6 — Create Message Templates

WhatsApp only allows sending **pre-approved templates** (not free-form text) to users.
The `hello_world` template is pre-approved and can be used immediately for testing.

### 6.1 Create a template in Meta

1. In your app dashboard → **WhatsApp** → **Manage** → **Message Templates**
2. Click **Create Template**
3. Fill in:
   - **Category**: Utility
   - **Name**: e.g. `fee_reminder` (lowercase, underscores only)
   - **Language**: English
4. Write the message body. Use `{{1}}`, `{{2}}` etc. for variables:

   ```
   Hello {{1}}, your fee of {{2}} is due on {{3}}.
   Please contact us to avoid late charges.
   — EduSpark Institute
   ```

5. Click **Submit** — approval usually takes 5–10 minutes for Utility templates

### 6.2 Add the template in your CRM

Once approved in Meta, add it in the CRM so the backend can reference it:

1. Open the **WhatsApp** page in your CRM
2. Go to the **Templates** section → **Add Template**
3. Fill in:
   - **Name**: `Fee Reminder` (display name)
   - **Template Key**: `fee_reminder` ← must exactly match the name you gave in Meta
   - **Body**: paste the same text
   - **Variables**: `name`, `amount`, `date` (the system maps these automatically)

The backend will substitute real student data for each variable when sending.

---

## Part 7 — Quick Connection Test

After completing all steps above, run this command to verify the API key works:

```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"messaging_product\":\"whatsapp\",\"to\":\"91XXXXXXXXXX\",\"type\":\"template\",\"template\":{\"name\":\"hello_world\",\"language\":{\"code\":\"en_US\"}}}"
```

Replace `YOUR_PHONE_NUMBER_ID`, `YOUR_ACCESS_TOKEN`, and `91XXXXXXXXXX` (your verified number with country code, no +).

**Success response looks like:**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "91XXXXXXXXXX", "wa_id": "91XXXXXXXXXX" }],
  "messages": [{ "id": "wamid.HBgNO..." }]
}
```

If you get this, your WhatsApp API is live and the CRM is ready to send messages.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Invalid OAuth access token` | Wrong or expired token | Regenerate permanent token (Part 2.1) |
| `Webhook verification failed` | Token mismatch | Make sure `WA_VERIFY_TOKEN` in `.env` matches what you entered in Meta exactly |
| `Phone number not in allowed list` | Sending to unverified number | Add recipient number in Meta test panel (Part 5) |
| `Template not found` | Template key mismatch | Check template key in CRM matches exactly what's approved in Meta |
| `Message failed to send` | Number not on WhatsApp | Student's number must have WhatsApp installed |
| Webhook not receiving updates | ngrok session expired | Restart ngrok and update the Callback URL in Meta dashboard |

---

## Going Live (Production)

When you're ready to send to real students (not just test numbers):

1. In Meta dashboard → **App Review** → request the `whatsapp_business_messaging` permission
2. Complete Business Verification (submit business documents)
3. Add your **real institute phone number** (replace the test number)
   - Go to **WhatsApp** → **Phone Numbers** → **Add Phone Number**
   - You'll need to verify it via OTP
4. Once approved, you can message any WhatsApp user — no pre-registration needed

---

## Variable Reference

The backend automatically maps these variable names in templates:

| Variable | Value inserted |
|---|---|
| `name` | Student's full name |
| `course` | Course name |
| `amount` | Outstanding fee amount (₹) |
| `date` | Today's date |
| `time` | Current time |
| `phone` | Student's mobile number |
| `days` | Days until due (default: 3) |
