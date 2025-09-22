# T3 Stack + ZenStack Todo App

A comprehensive study project demonstrating the integration of **T3 Stack** with **ZenStack** for automatic access control in a Next.js todo application.

## 📚 Project Overview

This project was built to understand and demonstrate:
- **T3 Stack** architecture and its advantages
- **ZenStack** integration with Prisma for declarative access control
- Modern Next.js development with App Router
- Type-safe full-stack development

## 🎯 What is T3 Stack?

The **T3 Stack** is a modern web development stack that focuses on **simplicity**, **modularity**, and **full-stack type safety**. It includes:

- **Next.js** - React framework with App Router
- **TypeScript** - Type safety across the entire stack
- **tRPC** - End-to-end type-safe APIs
- **Prisma** - Type-safe database ORM
- **NextAuth.js** - Authentication solution
- **Tailwind CSS** - Utility-first CSS framework

### T3 vs Regular Apps

| **T3 Stack** | **Regular App** |
|--------------|-----------------|
| ✅ Full-stack type safety | ❌ Manual type management |
| ✅ End-to-end TypeScript | ❌ Separate frontend/backend types |
| ✅ tRPC for type-safe APIs | ❌ REST APIs with manual validation |
| ✅ Integrated auth & database | ❌ Manual integration setup |
| ✅ Zero runtime overhead | ❌ Runtime type checking needed |

## 🔐 What is ZenStack?

**ZenStack** is a toolkit that enhances Prisma with **declarative access control**. Instead of writing manual permission checks in your code, you define access rules directly in your schema.

### ZenStack vs Regular Prisma

| **ZenStack** | **Regular Prisma** |
|--------------|-------------------|
| ✅ Declarative access control in schema | ❌ Manual permission checks in code |
| ✅ Automatic data filtering | ❌ Manual WHERE clauses everywhere |
| ✅ Zero-trust security by default | ❌ Easy to forget security checks |
| ✅ Policy-driven development | ❌ Scattered business logic |

## 🏗️ Key Concepts Explained

### 1. **CRUD Operations**
**Create, Read, Update, Delete** - The four basic operations for data management.
- **Create**: Add new todos
- **Read**: Fetch user's todos
- **Update**: Edit todo titles, toggle completion
- **Delete**: Remove todos

### 2. **CUID**
**Collision-resistant Unique Identifier** - A better alternative to UUIDs.
- Shorter and more readable than UUIDs
- Sortable by creation time
- Used for all record IDs in this project

### 3. **tRPC**
**TypeScript Remote Procedure Call** - End-to-end type-safe APIs.
- No manual API documentation needed
- Automatic type inference from server to client
- Runtime validation with compile-time safety

### 4. **Access Control**
ZenStack provides automatic security through schema-defined rules:
```prisma
model Todo {
  @@allow('create', auth() != null)
  @@allow('read,update,delete', auth().id == userId)
}
```

## 📁 Important Files & Their Functions

### **Core Configuration**
- **`schema.zmodel`** - ZenStack schema with access control rules
- **`prisma/schema.prisma`** - Generated Prisma schema
- **`src/server/db.ts`** - ZenStack enhanced database client

### **Authentication**
- **`src/server/auth/config.ts`** - NextAuth configuration
- **`app/auth/signin/page.tsx`** - Custom sign-in page
- **`app/auth/register/page.tsx`** - User registration page

### **API Layer**
- **`src/server/api/trpc.ts`** - tRPC setup with ZenStack context
- **`src/server/api/routers/todo.ts`** - Todo CRUD operations
- **`src/server/api/root.ts`** - Main API router

### **Frontend**
- **`app/page.tsx`** - Main todo application page
- **`app/_components/todo-list.tsx`** - Todo UI component
- **`app/layout.tsx`** - Root layout with providers

## 🔧 How ZenStack Works in This Project

### 1. **Schema Definition** (`schema.zmodel`)
```prisma
model Todo {
  id        String   @id @default(cuid())
  title     String
  completed Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  // ZenStack Access Control Rules
  @@allow('create', auth() != null)
  @@allow('read,update,delete', auth().id == userId)
}
```

### 2. **Enhanced Client** (`src/server/db.ts`)
```typescript
export const createEnhancedDb = (userId?: string) => {
  return enhance(basePrisma, { user: userId ? { id: userId } : undefined });
};
```

### 3. **Automatic Security** (`src/server/api/routers/todo.ts`)
```typescript
// No manual filtering needed - ZenStack handles it automatically
return ctx.db.todo.findMany({
  orderBy: { createdAt: "desc" },
});
```

## 🚀 Key Advantages Demonstrated

### **Type Safety**
- No runtime type errors
- Automatic API contract generation
- IntelliSense support throughout the stack

### **Security by Default**
- Impossible to accidentally expose other users' data
- Access control defined once in schema
- Zero-trust architecture

### **Developer Experience**
- Less boilerplate code
- Automatic data validation
- Integrated development workflow

## 🎓 Learning Outcomes

This project demonstrates:

1. **T3 Stack Architecture** - How modern full-stack apps are structured
2. **ZenStack Integration** - Declarative access control in practice
3. **Type-Safe Development** - End-to-end TypeScript benefits
4. **Modern Next.js** - App Router and server components
5. **Authentication Flow** - NextAuth with multiple providers
6. **Database Design** - Prisma schema with relationships

## 🔗 Official Documentation

- [T3 Stack Documentation](https://create.t3.gg/)
- [ZenStack Documentation](https://zenstack.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)

## 🏃‍♂️ Running the Project

### Local Development
1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Run database migrations: `npx prisma migrate dev`
4. Generate ZenStack client: `npx zenstack generate`
5. Start development server: `npm run dev`

### Docker Development
1. Build and run with Docker Compose: `docker-compose up --build`
2. Access the app at `http://localhost:3000`
3. PostgreSQL runs on port `5433` to avoid conflicts

## 🚀 CI/CD Pipeline

This project includes a **GitHub Actions CI/CD pipeline** for automated testing and Docker image building:

- **GitHub Actions** - Automated CI/CD workflow
- **Docker** - Containerization and image building
- **GitHub Container Registry** - Docker image storage
- **Security Scanning** - Vulnerability detection

### Pipeline Flow

```
Code Push → GitHub Actions → Test → Build → Docker Build → Push to GHCR → Security Scan
```

### What the Pipeline Does

1. **Test Phase**:
   - Sets up Node.js and PostgreSQL test database
   - Installs dependencies
   - Generates Prisma and ZenStack clients
   - Runs database migrations
   - Builds the Next.js application
   - Runs tests (if any)

2. **Build & Push Phase**:
   - Builds Docker image
   - Tags with branch name and commit SHA
   - Pushes to GitHub Container Registry
   - Runs security vulnerability scanning

### Viewing Pipeline Results

- Go to your GitHub repository
- Click the **Actions** tab
- See workflow runs and their status
- View logs for each step

---

*This project demonstrates modern full-stack development with T3 Stack, ZenStack, and automated CI/CD pipeline with Docker.*
