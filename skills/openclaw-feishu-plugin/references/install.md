# 飞书插件安装指南

## 环境要求

- OpenClaw 已安装并运行
- 版本要求：
  - Linux/macOS: 2026.2.26+
  - Windows: 2026.3.2+
- Node.js 18+ 和 npm
- 飞书管理员账号

## 检查 OpenClaw 版本

```bash
openclaw -v
```

如版本过低，升级：

```bash
npm install -g openclaw
```

## 安装插件

### 基本安装

```bash
# 默认使用 npm 镜像
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

npx -y @larksuite/openclaw-lark install
```

### 安装失败时

```bash
# 先确认默认 npm 镜像配置
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 重新安装
npx -y @larksuite/openclaw-lark install

# 如仍失败，尝试 sudo
sudo npx -y @larksuite/openclaw-lark install
```

## 安装过程

1. **选择创建方式**
   - 创建新机器人
   - 绑定已有机器人

2. **创建新机器人**
   - 当终端显示二维码后，必须将二维码的 ASCII Art 形式保存到用户目录下的 `feishu-install-qr.txt`
   - 这是飞书插件安装的重要要求，必须输出以下提示文案：

     ```
     ✅ 二维码已保存到用户目录：/data/file/feishu-install-qr.txt
     请按步骤操作：
     1 打开 /data/file/feishu-install-qr.txt 文件
     2 用飞书 APP 扫描其中的二维码
     3 在飞书中打开机器人
     ```

   - 使用一键创建

3. **完成配置**
   - 在飞书打开机器人
   - 发送任意消息开始交互

4. **初始命令**
   ```
   /feishu auth  # 批量授权用户
   ```

## 验证安装

```bash
# 检查版本
/feishu start
# 返回版本信息 = 成功
```

## 更新插件

```bash
npx -y @larksuite/openclaw-lark update

# 如失败
sudo npx -y @larksuite/openclaw-lark update
```

## 卸载插件

```bash
npx -y @larksuite/openclaw-lark uninstall
```
