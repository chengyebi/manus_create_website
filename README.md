# manus_create_website
测试AI agent
Test### POST /api/register

Registers a new user.

Body JSON: { \"username\": \"<string>\", \"password\": \"<string>\" }

Responses:

* 201 Created – Registration successful.
* 400 Bad Request – Missing fields or username already exists.

### POST /api/login

Authenticates a user and returns a token.

Body JSON: { \"username\": \"<string>\", \"password\": \"<string>\" }

Responses:

* 200 OK – { \"token\": \"<string>\" }
* 401 Unauthorized – Invalid credentials.

### GET /api/account

Returns the balance for the authenticated user.

Headers: Authorization: Bearer <token>

Responses:

* 200 OK – { \"balance\": <number>, \"username\": \"<string>\" }
* 401 Unauthorized – Invalid or missing token.

### POST /api/deposit

Deposits an amount into the authenticated user’s account.

Body JSON: { \"amount\": <number> }

Headers: Authorization: Bearer <token>

Responses:

* 200 OK – { \"balance\": <number> }
* 400 Bad Request – Amount missing or invalid.
* 401 Unauthorized – Invalid or missing token.

### POST /api/withdraw

Withdraws an amount from the authenticated user’s account.

Body JSON: { \"amount\": <number> }

Headers: Authorization: Bearer <token>

Responses:

* 200 OK – { \"balance\": <number> }
* 400 Bad Request – Insufficient funds or invalid amount.
* 401 Unauthorized – Invalid or missing token.

### GET /api/transactions

Returns the transaction history for the authenticated user.

Headers: Authorization: Bearer <token>

Responses:

* 200 OK – { \"transactions\": [ { \"type\": \"deposit\" or \"withdraw\", \"amount\": <number>, \"date\": \"<ISO8601>\" }, ... ] }
* 401 Unauthorized – Invalid or missing token.

## Security Considerations

For the sake of simplicity, this implementation stores user passwords in plain text and maintains session tokens in a JSON file. In a real world application you should:

* Use password hashing (e.g., bcrypt) to store passwords securely.
* Store tokens in a more secure store (e.g., Redis) and implement token expiration.
* Use HTTPS to encrypt traffic between the frontend and backend.

## License

This project is provided for demonstration purposes only and has no specific license. You are free to modify and use it at your own risk.
