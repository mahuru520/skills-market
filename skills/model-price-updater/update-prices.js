#!/usr/bin/env node
/**
 * Model Price Updater
 * 从 ospreyai.cn 获取模型价格并更新 openclaw.json 配置
 * 
 * 使用方法: node update-prices.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', '..', 'openclaw.json');

// 价格映射 - 需要与网页保持同步
// 这些价格应该从 https://open.ospreyai.cn/pricing 获取
const PRICE_MAP = {
  'minimax-m2.5': { input: 1.80, output: 6.48, cacheRead: 0.90, cacheWrite: 0.90 },
  'glm-latest': { input: 1.80, output: 1.62, cacheRead: 0.90, cacheWrite: 0.90 },
  'minimax-m2': { input: 1.80, output: 1.80, cacheRead: 0.90, cacheWrite: 0.90 },
  'minimax-latest': { input: 2.00, output: 2.00, cacheRead: 1.00, cacheWrite: 1.00 },
  'glm-4.7': { input: 1.80, output: 1.62, cacheRead: 0.90, cacheWrite: 0.90 },
  'glm-4.6': { input: 2.00, output: 2.00, cacheRead: 1.00, cacheWrite: 1.00 }
};

function updatePrices() {
  console.log('🔄 正在读取配置文件...');
  
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configContent);
    
    const providers = config.models?.providers;
    if (!providers || !providers.ospreyai) {
      console.log('❌ 未找到 ospreyai provider 配置');
      process.exit(1);
    }

    const models = providers.ospreyai.models || [];
    let updated = 0;
    let skipped = [];

    models.forEach(model => {
      if (PRICE_MAP[model.id]) {
        const newPrice = PRICE_MAP[model.id];
        model.cost = {
          input: newPrice.input,
          output: newPrice.output,
          cacheRead: newPrice.cacheRead,
          cacheWrite: newPrice.cacheWrite
        };
        console.log(`✅ ${model.id}: 输入 $${newPrice.input}/M, 输出 $${newPrice.output}/M`);
        updated++;
      } else {
        skipped.push(model.id);
      }
    });

    if (skipped.length > 0) {
      console.log(`ℹ️  跳过未定价的模型: ${skipped.join(', ')}`);
    }

    if (updated > 0) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      console.log(`\n📝 已更新 ${updated} 个模型价格`);
      console.log('💡 请手动重启 Gateway 使配置生效');
      console.log('   使用命令: gateway restart');
    } else {
      console.log('ℹ️  没有需要更新的模型');
    }
    
  } catch (err) {
    console.error('❌ 更新失败:', err.message);
    process.exit(1);
  }
}

// 导出函数供外部调用
module.exports = { updatePrices };

// 直接运行时执行
if (require.main === module) {
  updatePrices();
}
