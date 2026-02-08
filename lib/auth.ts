import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  email: string;
  name: string | null;
}

export interface AuthUser extends User {
  token: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    return { id: decoded.id, email: decoded.email, name: null };
  } catch {
    return null;
  }
}

export async function createUser(email: string, password: string, name?: string): Promise<number> {
  const hashedPassword = await hashPassword(password);
  const result = db.prepare(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
  ).run(email, hashedPassword, name || null);
  return result.lastInsertRowid as number;
}

export function getUserByEmail(email: string): any {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function getUserById(id: number): any {
  return db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(id);
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = getUserByEmail(email);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    token
  };
}
