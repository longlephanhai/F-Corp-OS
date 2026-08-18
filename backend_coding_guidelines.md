# 📐 Backend Coding Guidelines — F-Corp-OS

> Tài liệu này được trích xuất tự động từ codebase hiện tại.  
> **Mục đích:** Làm chuẩn mực khi phát triển các API mới cho phân hệ HR.

---

## 1. 🏗️ Kiến Trúc Tổng Quan (Architecture Pattern)

**Framework:** NestJS + TypeScript  
**Database:** MySQL thông qua **TypeORM**  
**Pattern:** **Module/Controller/Service** (tương đương MVC) — KHÔNG dùng Repository Pattern tách biệt.

```
src/
├── modules/
│   └── <tên-module>/           ← Mỗi nghiệp vụ là 1 module độc lập
│       ├── <module>.controller.ts  ← Nhận request, trả response (mỏng, không có logic)
│       ├── <module>.service.ts     ← Toàn bộ business logic nằm ở đây
│       ├── <module>.module.ts      ← Khai báo DI, import/export
│       ├── dto/                    ← Data Transfer Objects (validation input)
│       └── entities/               ← TypeORM Entities (ánh xạ bảng DB)
├── common/
│   ├── enum/                   ← Các enum dùng chung
│   └── types/                  ← Các interface TypeScript dùng chung (IUser, ...)
├── core/
│   └── transform.interceptor.ts ← Global response wrapper
├── decorator/
│   └── customize.ts            ← Custom decorators (@Public, @ResponseMessage, @User)
└── helper/
    └── index.ts                ← Utility functions thuần túy
```

**Nguyên tắc chính:**
- **Controller** chỉ làm 1 việc: nhận request → gọi service → trả kết quả.
- **Service** chứa toàn bộ logic: truy vấn DB, validate nghiệp vụ, throw exception.
- **Module** khai báo providers và imports, không chứa logic.

---

## 2. 📦 Định Dạng Response Chuẩn (Response Format)

Mọi response **thành công** đều được bọc tự động bởi `TransformInterceptor` (`core/transform.interceptor.ts`) và có dạng:

```json
{
  "statusCode": 200,
  "message": "Nội dung message được đặt qua @ResponseMessage()",
  "data": { ... }  // Bất cứ thứ gì controller/service return
}
```

**Ví dụ response phân trang (danh sách):**
```json
{
  "statusCode": 200,
  "message": "Get Users with Pagination",
  "data": {
    "meta": {
      "currentPage": 1,
      "pageSize": 10,
      "pages": 5,
      "total": 50
    },
    "result": [ ... ]
  }
}
```

**Ví dụ response đơn (single item / action):**
```json
{
  "statusCode": 201,
  "message": "User created successfully",
  "data": { "id": "uuid...", "email": "...", ... }
}
```

> [!IMPORTANT]  
> **KHÔNG BAO GIỜ** trả về `{ success: true, data: ... }` hay format tùy ý.  
> Luôn để interceptor tự wrap. Controller chỉ cần `return` raw data.

---

## 3. 🚨 Xử Lý Lỗi (Error Handling)

**Cơ chế:** Dùng **NestJS Built-in HTTP Exceptions** — throw thẳng trong Service.

| Tình huống | Exception nên dùng |
|---|---|
| Dữ liệu đầu vào không hợp lệ (nghiệp vụ) | `BadRequestException` |
| Không tìm thấy resource | `NotFoundException` |
| Chưa đăng nhập | `UnauthorizedException` |
| Không có quyền | `ForbiddenException` |

**Ví dụ thực tế (từ `users.service.ts`):**
```typescript
// Service throw exception — Controller không cần try/catch
const isExist = await this.usersRepository.findOne({ where: { email } });
if (isExist) {
  throw new BadRequestException('Email already exists');
}

const userRole = await this.rolesRepository.findOne({ where: { id: role_id } });
if (!userRole) {
  throw new BadRequestException(`Role with id "${role_id}" does not exist`);
}
```

**Response lỗi tự động từ NestJS:**
```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
```

> [!NOTE]  
> Chỉ dùng `try/catch` khi cần xử lý logic đặc biệt (ví dụ: verify JWT token có thể throw).  
> Xem ví dụ trong `auth.service.ts → processNewToken()`.

---

## 4. 🏷️ Quy Ước Đặt Tên (Naming Conventions)

### Files & Thư mục
| Loại | Convention | Ví dụ |
|---|---|---|
| Module folder | `kebab-case` | `skill-evidences/`, `user-sprints/` |
| Controller file | `<name>.controller.ts` | `users.controller.ts` |
| Service file | `<name>.service.ts` | `users.service.ts` |
| Entity file | `<name>.entity.ts` | `user.entity.ts` |
| DTO file | `create-<name>.dto.ts` | `create-user.dto.ts` |
| Module file | `<name>.module.ts` | `users.module.ts` |

### Classes & Functions
| Loại | Convention | Ví dụ |
|---|---|---|
| Class (Controller/Service/Module) | `PascalCase` | `UsersService`, `AuthController` |
| Class (Entity) | `PascalCase` (số ít) | `User`, `Skill`, `Sprint` |
| Class (DTO) | `PascalCase` | `CreateUserDto`, `UpdateUserDto` |
| Interface | `PascalCase` với prefix `I` | `IUser` |
| Methods (async) | `camelCase`, động từ rõ ràng | `findAll`, `findOne`, `create`, `update`, `remove` |
| Variables | `camelCase` | `currentPage`, `defaultLimit`, `isExist` |
| Constants/Enums values | `UPPER_SNAKE_CASE` | `IS_PUBLIC_KEY`, `AVAILABLE`, `IN_PROJECT` |
| Arrow function methods | `camelCase` | `createdRefreshToken`, `updateUserToken` |

### Route Paths
| Rule | Ví dụ |
|---|---|
| `kebab-case`, số nhiều cho resource | `/users`, `/skills`, `/skill-evidences` |
| Prefix global: `/api` | `/api/v1/users` |
| URI Versioning mặc định `v1` | `/api/v1/auth/login` |
| Sub-resource dùng `/` | `/auth/account`, `/auth/refresh` |
| ID param dùng `:id` | `/users/:id` |

### Database Schema
| Loại | Convention | Ví dụ |
|---|---|---|
| Tên bảng | `snake_case`, số nhiều | `users`, `skill_evidences` |
| Tên cột (DB) | `snake_case` | `full_name` → nhưng **Entity dùng `fullName` (camelCase)** |
| FK column name | `<relation>_id` | `role_id`, `manager_id` |
| Primary key | UUID | `@PrimaryGeneratedColumn('uuid')` |
| Audit columns | Bắt buộc có | `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `deletedBy` |

---

## 5. ✅ Validation Dữ Liệu (Validation)

**Thư viện:** `class-validator` + `class-transformer` (tích hợp sẵn với NestJS `ValidationPipe`)

**Cấu hình Global** (trong `main.ts`):
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Tự động loại bỏ fields không khai báo trong DTO
    forbidNonWhitelisted: true, // Trả lỗi nếu client gửi thêm field lạ
    transform: true,            // Tự động transform sang đúng type
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

**Cách viết DTO chuẩn:**
```typescript
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  fullName: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsNotEmpty()
  @IsNumber({}, { message: 'Cost rate must be a number' })
  costRate: number;
}
```

> [!TIP]  
> Luôn đặt message tiếng Anh rõ ràng vào mỗi decorator.  
> Dùng `@IsOptional()` cho các field không bắt buộc — KHÔNG dùng `?` thay thế decorator.

---

## 6. 🔒 Authentication & Authorization

- **JWT** với 2 token: `access_token` (header) + `refresh_token` (httpOnly cookie).
- **Global Guard:** `JwtAuthGuard` áp dụng cho tất cả routes.
- **Bỏ qua Auth:** Dùng decorator `@Public()` trên route không cần login.
- **Bỏ qua Permission:** Dùng `@SkipCheckPermission()` nếu route cần auth nhưng không check quyền.
- **Lấy user từ request:** Dùng custom decorator `@User()` thay vì `@Req() req`.

```typescript
// ✅ Cách đúng — dùng @User() decorator
@Get('/profile')
@ResponseMessage('Get profile')
getProfile(@User() user: IUser) {
  return this.usersService.findOne(user.id);
}

// ❌ Cách sai — không dùng req.user trực tiếp
@Get('/profile')
getProfile(@Req() req) {
  return req.user;
}
```

---

## 7. 🗄️ Entity (TypeORM) — Cấu Trúc Chuẩn

```typescript
import { Column, CreateDateColumn, DeleteDateColumn, Entity,
  JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('table_name')  // ← tên bảng snake_case, số nhiều
export class MyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Các columns nghiệp vụ ---
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: MyEnum, default: MyEnum.DEFAULT })
  status: MyEnum;

  // --- Relations ---
  @ManyToOne(() => OtherEntity, { eager: true })
  @JoinColumn({ name: 'other_id', referencedColumnName: 'id' })
  other: OtherEntity;

  // --- Audit fields (BẮT BUỘC) ---
  @Column({ type: 'json', nullable: true })
  createdBy: { id: string; email: string };

  @Column({ type: 'json', nullable: true })
  updatedBy: { id: string; email: string };

  @Column({ type: 'json', nullable: true })
  deletedBy: { id: string; email: string };

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;
}
```

---

## 8. 📋 Checklist Khi Tạo API Mới Cho HR Module

- [ ] Tạo thư mục `src/modules/<hr-feature>/` với đủ 5 files
- [ ] Entity có đầy đủ audit fields (`createdBy`, `updatedBy`, `deletedBy`, timestamps, `isDeleted`)
- [ ] DTO dùng `class-validator`, có message tiếng Anh cho từng rule
- [ ] Controller method có decorator `@ResponseMessage('...')` 
- [ ] Controller chỉ gọi service, không chứa logic
- [ ] Service throw `BadRequestException` / `NotFoundException` thay vì return null
- [ ] Route dùng `kebab-case`, đăng ký module trong `app.module.ts`
- [ ] Enum mới đặt trong `src/common/enum/`
- [ ] Interface mới đặt trong `src/common/types/`
- [ ] Utility function thuần túy đặt trong `src/helper/`
