import os
import smtplib
from concurrent.futures import ThreadPoolExecutor
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

email_executor = ThreadPoolExecutor(max_workers=5, thread_name_prefix="email-sender")

def send_email(to_email: str, subject: str, html_content: str):
    try:
        sender = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        port = int(os.getenv("SMTP_PORT", "587"))

        if not sender or not password:
            return  # Skip silently if SMTP is not configured in .env

        msg = MIMEMultipart()
        msg["From"] = f"INNOCEAN Tracker <{sender}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(server, port) as smtp:
            smtp.starttls()
            smtp.login(sender, password)
            smtp.send_message(msg)
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def send_email_async(to_email: str, subject: str, html_content: str):
    email_executor.submit(send_email, to_email, subject, html_content)
