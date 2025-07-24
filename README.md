# 个人存款管理 Web 系统

这是一个全栈 Web 应用，用户可以注册、登录，管理存款和取款，查看账户余额并跟踪交易历史。项目包含 Node.js 后端和简单的 HTML/CSS/JavaScript 前端。

## 功能

- 用户注册与登录（基于 session 的认证）。
- 提供安全的 API 接口用于查询账户信息、存款、取款和查看交易历史。
- 前端界面允许用户注册、登录、存取款并查看账户余额和交易明细。
- 使用 JSON 文件（`backend/data.json`）存储数据，适合演示用途。

## 项目结构

```
/backend
  data.json    # 存储用户和会话数据
  server.js    # 提供 RESTful API 的 Node.js 服务器

/frontend
  index.html   # 注册、登录和账户管理页面
  script.js    # 与后端 API 通讯的客户端脚本
  styles.css   # 前端界面样式表

.gitignore       # Git 忽略文件列表
README.md        # 项目说明（本文件）
```

## 快速开始

1. **安装依赖**：

   ```bash
   cd backend
   npm install
   ```

2. **启动服务器**：

   ```bash
   node server.js
   ```
   服务器默认运行在 `http://localhost:3000`。

3. **打开前端**：

   直接在浏览器中打开 `frontend/index.html` 即可使用。

## API 端点

### POST `/api/register`

注册新用户。

请求体（JSON）：
```json
{ "username": "<用户名>", "password": "<密码>" }
```

响应：
- **201 Created** – 注册成功。
- **400 Bad Request** – 缺少字段或用户名已存在。

### POST `/api/login`

用户登录，返回令牌。

请求体（JSON）：
```json
{ "username": "<用户名>", "password": "<密码>" }
```

响应：
- **200 OK** – { "token": "<令牌>" }
- **401 Unauthorized** – 用户名或密码错误。

### GET `/api/account`

返回经过认证用户的账户余额和用户名。

请求头：
```
Authorization: Bearer <令牌>
```

响应：
- **200 OK** – { "balance": <余额>, "username": "<用户名>" }
- **401 Unauthorized** – 缺少或无效令牌。

### POST `/api/deposit`

为经过认证的用户账户存入金额。

请求头：
```
Authorization: Bearer <令牌>
```

请求体（JSON）：
```json
{ "amount": <金额> }
```

响应：
- **200 OK** – { "balance": <余额> }
- **400 Bad Request** – 金额为空或无效。
- **401 Unauthorized** – 缺少或无效令牌。

### POST `/api/withdraw`

为经过认证的用户账户取出金额。

请求头：
```
Authorization: Bearer <令牌>
```

请求体（JSON）：
```json
{ "amount": <金额> }
```

响应：
- **200 OK** – { "balance": <余额> }
- **400 Bad Request** – 金额为空或无效。
- **400 Bad Request** – 余额不足。
- **401 Unauthorized** – 缺少或无效令牌。

### GET `/api/transactions`

返回经过认证用户的交易历史。

请求头：
```
Authorization: Bearer <令牌>
```

响应：
- **200 OK** – [ { "type": "deposit/withdrawal", "amount": <金额>, "timestamp": "<时间戳>" }, ... ]
- **401 Unauthorized** – 缺少或无效令牌。

## 许可

本项目采用 MIT 许可协议，你可以自由修改和使用，风险自负。
