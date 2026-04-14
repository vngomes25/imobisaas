import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as crypto from "crypto";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
}

export function registerOAuthRoutes(app: Express) {
  // ── POST /api/auth/login ──────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "E-mail e senha são obrigatórios." });
      return;
    }

    const user = await db.getUserByEmail(email.trim().toLowerCase());
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "E-mail ou senha inválidos." });
      return;
    }

    if (!verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "E-mail ou senha inválidos." });
      return;
    }

    const token = await sdk.createSessionToken(user.openId, {
      name: user.name ?? "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ success: true, role: user.role });
  });

  // ── POST /api/auth/register ───────────────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { name, email, password } = req.body ?? {};

    if (!email || !password || !name) {
      res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
      return;
    }

    const existing = await db.getUserByEmail(email.trim().toLowerCase());
    if (existing) {
      res.status(409).json({ error: "Este e-mail já está cadastrado." });
      return;
    }

    const openId = `local_${crypto.randomBytes(16).toString("hex")}`;
    const passwordHash = createPasswordHash(password);

    // First user registered becomes admin automatically
    const allUsers = await db.listUsers();
    const role = allUsers.length === 0 ? "admin" : "user";

    await db.upsertUser({
      openId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      loginMethod: "email",
      passwordHash,
      role,
    });

    const user = await db.getUserByOpenId(openId);
    if (!user) {
      res.status(500).json({ error: "Erro ao criar usuário." });
      return;
    }

    const token = await sdk.createSessionToken(user.openId, {
      name: user.name ?? "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ success: true, role: user.role });
  });
}
