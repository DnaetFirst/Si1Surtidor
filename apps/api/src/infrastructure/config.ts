import { config } from 'dotenv';
import { resolve } from 'node:path';
import 'reflect-metadata';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../../.env') });

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable ${name}. Consulta .env.example.`);
  return value;
}

export function secret(name: string): string {
  const value = requiredEnv(name);
  if (value.length < 32) throw new Error(`${name} debe contener al menos 32 caracteres.`);
  return value;
}
