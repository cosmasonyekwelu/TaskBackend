# **TaskBackend – Complete API Documentation**

## **Project Description**

**TaskBackend** is a secure and scalable REST API built with **Node.js**, **Express**, and **MongoDB (Mongoose)**.
It provides user authentication, profile management, product CRUD operations, and full admin capabilities.

The API follows industry best practices:

- JWT authentication (access token only)
- Role-based access control (User / Admin)
- Strong request validation (Joi)
- Centralized error handling
- XSS & NoSQL injection protection
- Rate limiting & secure HTTP headers
- Soft deletion for users and products
- Clean MVC folder structure

---

## **Features**

- **JWT Authentication** (simple access-token system)
- **Role-Based Access Control**
- **User Profile**

  - View profile
  - Update profile
  - Deactivate account (soft delete)

- **Product CRUD**

  - Create, update, delete (owner or admin)
  - Public listing & filtering

- **Admin Management**

  - Manage all users
  - Manage all products

- **Security**

  - Helmet
  - Rate limiting
  - mongo-sanitize
  - xss-clean

- **Input Validation** (Joi)
- **Postman Collection included**

---

## **Technology Stack**

| Layer        | Technologies                                                    |
| ------------ | --------------------------------------------------------------- |
| Backend      | Node.js, Express.js                                             |
| Database     | MongoDB (Mongoose)                                              |
| Security     | bcryptjs, helmet, express-rate-limit, xss-clean, mongo-sanitize |
| Auth         | JWT (access token only)                                         |
| Validation   | Joi                                                             |
| Architecture | MVC                                                             |

---

## **Installation & Setup**

### **Prerequisites**

- Node.js v16+
- MongoDB (local or Atlas)
- npm or yarn

---

### **1. Clone the project**

```bash
git clone https://github.com/your-repo/taskbackend.git
cd taskbackend
```

---

### **2. Create environment file**

```bash
cp .env.example .env
```

Example:

```env
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/taskbackend_db

JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MINUTES=20
CORS_ORIGIN=*
```

---

### **3. Install dependencies**

```bash
npm install
```

---

### **4. Start server**

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

---

### **5. Health Check**

```bash
curl http://localhost:3000/health
```

---

# **Authentication & Authorization**

This API uses a **single JWT access token**.

## **Flow**

1. User logs in.
2. Server returns:

   - `accessToken`

3. Client sends token in header:

```
Authorization: Bearer <token>
```

4. Token expires after **24 hours** (configurable).

---

### **Roles**

| Role      | Permissions                                           |
| --------- | ----------------------------------------------------- |
| **User**  | Manage own profile, create/update/delete own products |
| **Admin** | Full access to all users and products                 |

---

# **API Endpoints**

---

# **AUTH (`/api/auth`)**

## **Register**

**POST** `/api/auth/register`
Public

Request:

```json
{
  "name": "Cosmas",
  "email": "cosmas@example.com",
  "password": "StrongPass#2025"
}
```

---

## **Login**

**POST** `/api/auth/login`
Returns:

- accessToken
- user profile

---

## **Get Current User**

**GET** `/api/auth/me`
Protected

---

## **Change Password**

**POST** `/api/auth/change-password`
Protected

---

## **Logout**

**POST** `/api/auth/logout`
Protected

---

## **Logout All Devices**

**POST** `/api/auth/logout-all`
Protected

---

# **PRODUCTS (`/api/products`)**

## **Get All Products**

**GET** `/api/products`
Public
Supports:

- `page`
- `limit`
- `search`
- `sort`

---

## **Get Product**

**GET** `/api/products/:id`

---

## **Create Product**

**POST** `/api/products`
Protected (User/Admin)

---

## **Update Product**

**PUT** `/api/products/:id`
Protected (owner or admin)

---

## **Delete Product**

**DELETE** `/api/products/:id`
Soft delete
Protected

---

# **USER (`/api/users`)**

## **Get Profile**

**GET** `/api/users/profile`

## **Update Profile**

**PUT** `/api/users/profile`

## **Delete Profile**

**DELETE** `/api/users/profile`
Soft delete

---

# **ADMIN (`/api/admin`)**

Admin-only access.

## **List Users**

**GET** `/api/admin/users`

## **Get User**

**GET** `/api/admin/users/:id`

## **Update User**

**PUT** `/api/admin/users/:id`

## **Deactivate User**

**DELETE** `/api/admin/users/:id`

## **Admin Product Management**

- **POST** `/api/admin/products`
- **PUT** `/api/admin/products/:id`
- **DELETE** `/api/admin/products/:id`

---

# **Postman Collection**

A complete Postman collection is included.
It covers:

- Auth workflow
- User profile routes
- Product CRUD
- Admin management

Variables used:

```
base_url = http://localhost:3000/api
token =
product_id =
user_id =
```

---

# **Security Features**

- Password hashing
- JWT authentication
- Rate limiting
- Helmet headers
- XSS sanitization
- MongoDB injection prevention
- Centralized error handler
- Soft delete logic

---

# **Troubleshooting**

| Issue                     | Fix                                           |
| ------------------------- | --------------------------------------------- |
| 401 Unauthorized          | Ensure `Authorization: Bearer <token>` is set |
| Cannot connect to MongoDB | Check `MONGODB_URI`                           |
| 403 Forbidden             | Requires admin privileges                     |
| Validation error          | Check Joi schema                              |

---

# **Author**

**Cosmas Onyekwelu**

---
