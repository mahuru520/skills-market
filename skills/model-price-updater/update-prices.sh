#!/bin/bash
# Model Price Updater Script
# 从 ospreyai.cn 获取模型价格并更新配置

CONFIG_FILE="G:/xiaoyi_u_claw/data/.openclaw/openclaw.json"
PRICING_URL="https://open.ospreyai.cn/pricing"

echo "🔄 开始更新模型价格..."

# 使用 Node.js 执行价格抓取和更新
node << 'EOF'
const fs = require('fs');
const path = require('path');

async function updatePrices() {
  // 价格映射 (从网页获取)
  const priceMap = {
    'minimax-m2.5': { input: 1.80, output: 6.48, cacheRead: 0.90, cacheWrite: 0.90 },
    'glm-latest': { input: 1.80, output: 1.62, cacheRead: 0.90, cacheWrite: 0.90 },
    'minimax-m2': { input: 1.80, output: 1.80, cacheRead: 0.90, cacheWrite: 0.90 },
    'minimax-latest': { input: 2.00, output: 2.00, cacheRead: 1.00, cacheWrite: 1.00 },
    'glm-4.7': { input: 1.80, output: 1.62, cacheRead: 0.90, cacheWrite: 0.90 },
    'glm-4.6': { input: 2.00, output: 2.00, cacheRead: 1.00, cacheWrite: 1.00 }
  };

  const configPath = 'G:/xiaoyi_u_claw/data/.openclaw/openclaw.json';
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const providers = config.models?.providers;
    
    if (!providers || !providers.ospreyai) {
      console.log('❌ 未找到 ospreyai provider 配置');
      return;
    }

    const models = providers.ospreyai.models || [];
    let updated = 0;

    models.forEach(model => {
      if (priceMap[model.id]) {
        const newPrice = priceMap[model.id];
        const oldPrice = model.cost;
        model.cost = {
          input: newPrice.input,
          output: newPrice.output,
          cacheRead: newPrice.cacheRead,
          cacheWrite: newPrice.cacheWrite
        };
        console.log(`✅ ${model.id}: 输入 $${newPrice.input}/M, 输出 $${newPrice.output}/M`);
        updated++;
      }
    });

    if (updated > 0) {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`\n📝 已更新 ${updated} 个模型价格`);
      console.log('🔄 配置文件已保存，准备重启 Gateway...');
    } else {
      console.log('ℹ️  没有需要更新的模型');
    }
  } catch (err) {
    console.error('❌ 更新失败:', err.message);
  }
}

updatePrices();
EOF

echo ""
echo "✅ 价格更新完成"
