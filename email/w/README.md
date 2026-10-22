# Patient message portal

## Setup

1. Install Node.js and MySQL, and make sure the MySQL service is running.
2. Copy `.env.example` to `.env` and set the MySQL connection values. The API creates the configured database (default `email`) and the `nova_Hospetal` table on startup.
3. To send email notifications, set `SMTP_USER` and `SMTP_PASS` in `.env`. For Gmail, use a Google app password; `SMTP_USER` must be an account that can send mail. Notifications are sent to `ashokrajpoot129@gmail.com` by default.
4. Install dependencies with `npm install`.
5. Stop any already-running development server, then start the API and website together with `npm run dev` from this project folder.

Submitted patient messages are saved to MySQL and remain available after reload. Email configuration is separate from database storage: if SMTP is not configured or sending fails, the message is still saved and the page reports that the notification was not sent.
