:q#!/usr/bin/env python3
"""
阿里邮箱邮件处理模块
支持发送邮件和接收邮件
"""

import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import json
import os
import sys

# 邮箱配置模板
EMAIL_PROVIDERS = {
    "aliyun": {
        "name": "阿里企业邮箱",
        "email": "rongrong@ospreyai.cn",
        "password": "ERnHmDI74cagzSZF",
        "smtp_server": "smtp.qiye.aliyun.com",
        "smtp_port": 465,
        "imap_server": "imap.qiye.aliyun.com",
        "imap_port": 993,
    },
    "tencent": {
        "name": "腾讯企业邮箱",
        "email": "",
        "password": "",
        "smtp_server": "smtp.exmail.qq.com",
        "smtp_port": 465,
        "imap_server": "imap.exmail.qq.com",
        "imap_port": 993,
    }
}

# 当前使用的邮箱提供商
CURRENT_PROVIDER = "aliyun"

def get_config():
    """获取当前配置"""
    return EMAIL_PROVIDERS[CURRENT_PROVIDER]

def set_provider(provider_name, email_address=None, password=None):
    """
    设置邮箱提供商
    
    Args:
        provider_name: "aliyun" 或 "tencent"
        email_address: 邮箱地址（腾讯需要）
        password: 授权码（腾讯需要）
    
    Returns:
        dict: {"success": True/False, "message": "..."}
    """
    global CURRENT_PROVIDER
    
    if provider_name not in EMAIL_PROVIDERS:
        return {"success": False, "message": f"不支持的提供商: {provider_name}，可选: {list(EMAIL_PROVIDERS.keys())}"}
    
    if provider_name == "tencent":
        if not email_address or not password:
            return {"success": False, "message": "腾讯企业邮箱需要提供 email 和 password"}
        EMAIL_PROVIDERS["tencent"]["email"] = email_address
        EMAIL_PROVIDERS["tencent"]["password"] = password
    
    CURRENT_PROVIDER = provider_name
    return {"success": True, "message": f"已切换到 {EMAIL_PROVIDERS[provider_name]['name']}"}

def show_config():
    """显示当前配置（隐藏密码）"""
    config = get_config()
    return {
        "provider": CURRENT_PROVIDER,
        "provider_name": config["name"],
        "email": config["email"],
        "smtp": f"{config['smtp_server']}:{config['smtp_port']}",
        "imap": f"{config['imap_server']}:{config['imap_port']}",
    }

def send_mail(to_addr, subject, body, html_body=None, attachments=None):
    """
    发送邮件
    """
    config = get_config()
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = config["email"]
        msg['To'] = to_addr
        msg['Subject'] = subject
        msg['Date'] = email.utils.formatdate()
        
        if body:
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        if html_body:
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        if attachments:
            for filename, filepath in attachments:
                with open(filepath, 'rb') as f:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename={filename}')
                msg.attach(part)
        
        server = smtplib.SMTP_SSL(config["smtp_server"], config["smtp_port"])
        server.login(config["email"], config["password"])
        server.sendmail(config["email"], to_addr, msg.as_string())
        server.quit()
        
        return {"success": True, "message": f"邮件已发送到 {to_addr}"}
    except Exception as e:
        return {"success": False, "message": f"发送失败: {str(e)}"}


def receive_mail(count=10, unread_only=False):
    """
    接收邮件
    """
    config = get_config()
    
    try:
        mail = imaplib.IMAP4_SSL(config["imap_server"], config["imap_port"])
        mail.login(config["email"], config["password"])
        
        status, _ = mail.select('INBOX')
        if status != 'OK':
            return {"success": False, "message": "无法访问收件箱", "emails": []}
        
        search_criteria = 'UNSEEN' if unread_only else 'ALL'
        
        status, messages = mail.search(None, search_criteria)
        if status != 'OK':
            return {"success": False, "message": "搜索邮件失败", "emails": []}
        
        mail_ids = messages[0].split()
        recent_ids = mail_ids[-count:] if len(mail_ids) > count else mail_ids
        
        emails = []
        for mail_id in recent_ids:
            status, msg_data = mail.fetch(mail_id, '(RFC822)')
            if status != 'OK':
                continue
            
            msg = email.message_from_bytes(msg_data[0][1])
            
            email_info = {
                "id": mail_id.decode(),
                "from": email.utils.parseaddr(msg.get('From'))[1],
                "from_name": email.utils.parseaddr(msg.get('From'))[0],
                "to": email.utils.parseaddr(msg.get('To'))[1],
                "subject": msg.get('Subject', ''),
                "date": msg.get('Date', ''),
                "body": "",
                "html_body": "",
                "attachments": [],
            }
            
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    if content_type == 'text/plain':
                        email_info["body"] = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    elif content_type == 'text/html':
                        email_info["html_body"] = part.get_payload(decode=True).decode('utf-8', errors='ignore')
            else:
                content_type = msg.get_content_type()
                payload = msg.get_payload(decode=True)
                if payload:
                    if content_type == 'text/plain':
                        email_info["body"] = payload.decode('utf-8', errors='ignore')
                    elif content_type == 'text/html':
                        email_info["html_body"] = payload.decode('utf-8', errors='ignore')
            
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get('Content-Disposition') and 'attachment' in str(part.get('Content-Disposition')):
                        email_info["attachments"].append(part.get_filename())
            
            emails.append(email_info)
        
        mail.logout()
        
        return {
            "success": True, 
            "message": f"获取到 {len(emails)} 封邮件",
            "emails": emails
        }
    except Exception as e:
        return {"success": False, "message": f"接收失败: {str(e)}", "emails": []}


def mark_as_read(mail_id):
    """标记邮件为已读"""
    config = get_config()
    
    try:
        mail = imaplib.IMAP4_SSL(config["imap_server"], config["imap_port"])
        mail.login(config["email"], config["password"])
        mail.select('INBOX')
        mail.store(mail_id, '+FLAGS', '\\Seen')
        mail.logout()
        return {"success": True, "message": f"邮件 {mail_id} 已标记为已读"}
    except Exception as e:
        return {"success": False, "message": f"操作失败: {str(e)}"}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法:")
        print("  python mail.py send <收件人> <主题> <正文>")
        print("  python mail.py receive [数量] [--unread]")
        print("  python mail.py read <邮件ID>")
        print("  python mail.py config")
        print("  python mail.py set <aliyun|tencent> [邮箱] [授权码]")
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "send":
        if len(sys.argv) < 5:
            print("用法: python mail.py send <收件人> <主题> <正文>")
            sys.exit(1)
        result = send_mail(sys.argv[2], sys.argv[3], sys.argv[4])
        print(json.dumps(result, ensure_ascii=False))
    
    elif action == "receive":
        count = 10
        unread_only = False
        if len(sys.argv) > 2:
            try:
                count = int(sys.argv[2])
            except:
                pass
        if '--unread' in sys.argv:
            unread_only = True
        result = receive_mail(count, unread_only)
        print(json.dumps(result, ensure_ascii=False))
    
    elif action == "read":
        if len(sys.argv) < 3:
            print("用法: python mail.py read <邮件ID>")
            sys.exit(1)
        result = mark_as_read(sys.argv[2])
        print(json.dumps(result, ensure_ascii=False))
    
    elif action == "config":
        result = show_config()
        print(json.dumps(result, ensure_ascii=False))
    
    elif action == "set":
        if len(sys.argv) < 3:
            print("用法: python mail.py set <aliyun|tencent> [邮箱] [授权码]")
            sys.exit(1)
        provider = sys.argv[2]
        email_addr = sys.argv[3] if len(sys.argv) > 3 else None
        password = sys.argv[4] if len(sys.argv) > 4 else None
        result = set_provider(provider, email_addr, password)
        print(json.dumps(result, ensure_ascii=False))
    
    else:
        print(f"未知操作: {action}")
        sys.exit(1)
