#!/usr/bin/env python3
"""
邮件配置引导 - 通过问答形式配置邮箱
"""

import json
import sys

PROVIDERS = {
    "aliyun": {
        "name": "阿里企业邮箱",
        "smtp_server": "smtp.qiye.aliyun.com",
        "smtp_port": 465,
        "imap_server": "imap.qiye.aliyun.com",
        "imap_port": 993,
    },
    "tencent": {
        "name": "腾讯企业邮箱",
        "smtp_server": "smtp.exmail.qq.com",
        "smtp_port": 465,
        "imap_server": "imap.exmail.qq.com",
        "imap_port": 993,
    }
}

def guide_setup(provider_name=None):
    """
    引导用户配置邮箱
    
    返回指引信息，由 AI 判断用户回复并调用相应函数
    """
    if provider_name is None:
        # 第一步：选择提供商
        provider_list = "\n".join([f"- {k}: {v['name']}" for k, v in PROVIDERS.items()])
        return {
            "step": 1,
            "question": f"请选择邮箱类型：\n{provider_list}\n\n请回复提供商名称（如：aliyun 或 tencent）",
            "action": "select_provider",
        }
    elif provider_name not in PROVIDERS:
        return {
            "step": 1,
            "question": f"不支持的提供商。可选: {list(PROVIDERS.keys())}",
            "action": "select_provider",
        }
    else:
        # 返回第二步需要的信息
        return {
            "step": 2,
            "provider": provider_name,
            "provider_name": PROVIDERS[provider_name]["name"],
            "smtp": f"{PROVIDERS[provider_name]['smtp_server']}:{PROVIDERS[provider_name]['smtp_port']}",
            "imap": f"{PROVIDERS[provider_name]['imap_server']}:{PROVIDERS[provider_name]['imap_port']}",
            "question": f"已选择 {PROVIDERS[provider_name]['name']}。\n\n需要配置：\n1. 邮箱地址（如：user@company.com）\n2. 授权码（不是登录密码，需在邮箱后台获取）\n\n请告诉我邮箱地址",
            "action": "get_email",
        }


def configure_email(provider_name, email_address, auth_code):
    """
    配置邮箱
    
    Args:
        provider_name: aliyun 或 tencent
        email_address: 邮箱地址
        auth_code: 授权码
    
    Returns:
        dict: 配置结果
    """
    if provider_name not in PROVIDERS:
        return {"success": False, "message": f"不支持的提供商: {provider_name}"}
    
    # 读取当前配置
    with open("/root/.openclaw/workspace/skills/mail/mail.py", "r") as f:
        content = f.read()
    
    # 更新 aliyun 配置
    if provider_name == "aliyun":
        old_config = f'''"aliyun": {{
        "name": "阿里企业邮箱",
        "email": "rongrong@ospreyai.cn",
        "password": "ERnHmDI74cagzSZF",'''
        
        new_config = f'''"aliyun": {{
        "name": "阿里企业邮箱",
        "email": "{email_address}",
        "password": "{auth_code}",'''
        
        content = content.replace(old_config, new_config)
    
    # 更新 tencent 配置
    elif provider_name == "tencent":
        old_config = '''"tencent": {
        "name": "腾讯企业邮箱",
        "email": "",
        "password": "",'''
        
        new_config = f'''"tencent": {{
        "name": "腾讯企业邮箱",
        "email": "{email_address}",
        "password": "{auth_code}",'''
        
        content = content.replace(old_config, new_config)
    
    # 切换到对应的提供商
    old_current = f'CURRENT_PROVIDER = "{get_current_provider()}"'
    new_current = f'CURRENT_PROVIDER = "{provider_name}"'
    content = content.replace(old_current, new_current)
    
    # 写回配置
    with open("/root/.openclaw/workspace/skills/mail/mail.py", "w") as f:
        f.write(content)
    
    return {
        "success": True,
        "message": f"已配置 {PROVIDERS[provider_name]['name']}：{email_address}",
        "provider": provider_name,
        "email": email_address,
    }


def get_current_provider():
    """获取当前配置的邮箱提供商"""
    with open("/root/.openclaw/workspace/skills/mail/mail.py", "r") as f:
        content = f.read()
    
    for line in content.split("\n"):
        if "CURRENT_PROVIDER" in line:
            # 提取引号内的值
            import re
            match = re.search(r'CURRENT_PROVIDER\s*=\s*"(\w+)"', line)
            if match:
                return match.group(1)
    return "aliyun"


def show_current_config():
    """显示当前配置"""
    with open("/root/.openclaw/workspace/skills/mail/mail.py", "r") as f:
        content = f.read()
    
    provider = get_current_provider()
    info = PROVIDERS.get(provider, PROVIDERS["aliyun"])
    
    # 提取邮箱地址
    import re
    email_match = re.search(rf'"{provider}":.*?"email":\s*"([^"]*)"', content, re.DOTALL)
    email = email_match.group(1) if email_match else "未设置"
    
    return {
        "provider": provider,
        "name": info["name"],
        "email": email,
        "smtp": f"{info['smtp_server']}:{info['smtp_port']}",
        "imap": f"{info['imap_server']}:{info['imap_port']}",
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法:")
        print("  python mail_setup.py guide [提供商]     引导配置")
        print("  python mail_setup.py config             查看当前配置")
        print("  python mail_setup.py set <邮箱> <授权码>  配置指定邮箱")
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "guide":
        provider = sys.argv[2] if len(sys.argv) > 2 else None
        result = guide_setup(provider)
        print(json.dumps(result, ensure_ascii=False))
    
    elif action == "config":
        result = show_current_config()
        print(json.dumps(result, ensure_ascii=False))
    
    elif action == "set":
        # 通过参数直接配置（阿里云）
        if len(sys.argv) >= 4:
            result = configure_email("aliyun", sys.argv[2], sys.argv[3])
            print(json.dumps(result, ensure_ascii=False))
        else:
            print("用法: python mail_setup.py set <邮箱> <授权码>")
    
    elif action == "test":
        # 测试当前配置
        import subprocess
        result = subprocess.run(
            ["python3", "/root/.openclaw/workspace/skills/mail/mail.py", "receive", "1"],
            capture_output=True,
            text=True
        )
        print(result.stdout)
    
    else:
        print(f"未知操作: {action}")
