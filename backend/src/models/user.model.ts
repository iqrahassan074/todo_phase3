// src/app/models/user.model.ts
import { query } from '../../utils/database.util';

export interface User {
  id: string;
  email: string;
  name?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!res.rows[0]) return null;
    return {
      id: res.rows[0].id,
      email: res.rows[0].email,
      name: res.rows[0].name,
      createdAt: res.rows[0].created_at,
      updatedAt: res.rows[0].updated_at,
    };
  }

  static async findById(id: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    return {
      id: res.rows[0].id,
      email: res.rows[0].email,
      name: res.rows[0].name,
      createdAt: res.rows[0].created_at,
      updatedAt: res.rows[0].updated_at,
    };
  }

  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const res = await query(
      `INSERT INTO users (email, name, password, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      [userData.email, userData.name || userData.email.split('@')[0], userData.password || null]
    );
    return {
      id: res.rows[0].id,
      email: res.rows[0].email,
      name: res.rows[0].name,
      createdAt: res.rows[0].created_at,
      updatedAt: res.rows[0].updated_at,
    };
  }
}
