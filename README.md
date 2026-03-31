# 合约交易统计工具

加密合约交易记录统计工具，支持手动输入交易信息，自动解析并计算盈亏。

## 功能

- 手动输入交易记录，自动解析（币种、方向、价格、杠杆、本金）
- 自动计算盈亏
- 交易统计（胜率、总盈亏、平均盈亏等）
- 交易记录列表

## 部署步骤

### 1. 创建 Neon 数据库

1. 访问 [Neon](https://neon.tech) 注册账号
2. 创建新项目，获取连接字符串
3. 连接字符串格式：`postgresql://username:password@host/database?sslmode=require`

### 2. 部署到 Vercel

1. Fork 或上传代码到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量：
   - `DATABASE_URL`: Neon 数据库连接字符串
4. 部署

### 3. 初始化数据库

部署完成后，访问以下 URL 初始化数据库表：

```
https://你的域名/api/init
```

## 本地开发

```bash
# 复制环境变量示例
cp .env.local.example .env.local

# 编辑 .env.local，填入 DATABASE_URL

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 输入格式

```
ETH 2075空 2085止损 2035止盈 90倍 本金15U 止盈
```

解析字段：
- 币种：ETH
- 方向：空（空/多）
- 开仓价：2075
- 止损价：2085
- 止盈价：2035
- 杠杆：90倍
- 本金：15U
- 结果：止盈（止盈/止损）
