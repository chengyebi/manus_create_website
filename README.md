# Personal Deposit Management Web System

This is a full-stack web application that allows users to register, log in, manage deposits and withdrawals, view account balances, and track transaction history. It consists of a Node.js backend and a simple HTML/CSS/JavaScript frontend.

## Features

- User registration and login with session-based authentication.
- Secure API endpoints for account information, deposits, withdrawals, and transaction history.
- Frontend UI to register and log in, deposit or withdraw funds, and view account balance and transaction history.
- Data persistence using a JSON file (`backend/data.json`) for demonstration purposes.

## Project Structure

```
/backend
  data.json    # Stores users and sessions data.
  server.js    # Node.js server providing RESTful API endpoints.

/frontend
  index.html   # Main page with forms and UI for registration, login, and account management.
  script.js    # Client-side logic interacting with backend APIs.
  styles.css   # Stylesheet for the frontend UI.

.gitignore       # Specifies files to ignore in Git.
README.md        # Project documentation (this file).
```

## Getting Started

1. **Install Dependencies**:
   ```
   cd backend
   npm install
   ```

2. **Start the Server**:
   ```
   node server.js
   ```
   The server will run on `http://localhost:3000`.

3. **Open Frontend**:
   Simply open `frontend/index.html` in your browser (e.g., double-click the file).

## API Endpoints

### POST `/api/register`

Registers a new user.

Request Body (JSON):
```json
{ "username": "<string>", "password": "<string>" }
```

Responses:
- **201 Created** – Registration successful.
- **400 Bad Request** – Missing fields or username already exists.

### POST `/api/login`

Authenticates a user and returns a token.

Request Body (JSON):
```json
{ "username": "<string>", "password": "<string>" }
```

Responses:
- **200 OK** – { "token": "<string>" }
- **401 Unauthorized** – Invalid credentials.

### GET `/api/account`

Returns the balance and username of the authenticated user.

Headers:
```
Authorization: Bearer <token>
```

Responses:
- **200 OK** – { "balance": <number>, "username": "<string>" }
- **401 Unauthorized** – Invalid or missing token.

### POST `/api/deposit`

Deposits an amount into the authenticated user’s account.

Headers:
```
Authorization: Bearer <token>
```

Request Body (JSON):
```json
{ "amount": <number> }
```

Responses:
- **200 OK** – { "balance": <number> }
- **400 Bad Request** – Amount missing or invalid.
- **401 Unauthorized** – Invalid or missing token.

### POST `/api/withdraw`

Withdraws an amount from the authenticated user’s account.

Headers:
```
Authorization: Bearer <token>
```

Request Body (JSON):
```json
{ "amount": <number> }
```

Responses:
- **200 OK** – { "balance": <number> }
- **400 Bad Request** – Amount missing or invalid.
- **400 Bad Request** – Insufficient funds.
- **401 Unauthorized** – Invalid or missing token.

### GET `/api/transactions`

Returns the transaction history for the authenticated user.

Headers:
```
Authorization: Bearer <token>
```

Responses:
- **200 OK** – [ { "type": "deposit/withdrawal", "amount": <number>, "timestamp": "<string>" }, ... ]
- **401 Unauthorized** – Invalid or missing token.

## License

This project is licensed under the MIT License.

