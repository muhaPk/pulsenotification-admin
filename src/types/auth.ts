// Auth DTOs matching your NestJS backend
export interface LoginUserDto {
  email: string;
  password: string;
}

export interface RegisterUserDto {
  name: string;
  email: string;
  password: string;
  passwordconf: string;
  image?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

// User interface matching your Prisma schema
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: string | null;
  role: 'admin' | 'user';
  image?: string | null;
  bitcoinBalance: string; // BigInt from Prisma, returned as string
  withdrawalAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

// API Response interfaces
export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

// Auth state interface
export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}
