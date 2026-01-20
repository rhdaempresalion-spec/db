import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { InsertUser, users, applications, InsertApplication, Application } from "../drizzle/schema";

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    
    if (existingUser.length > 0) {
      // Update existing user
      const updateData: Partial<InsertUser> = {
        lastSignedIn: new Date(),
      };
      
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;
      
      await db.update(users).set(updateData).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      const insertData: InsertUser = {
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? 'user',
        lastSignedIn: new Date(),
      };
      
      await db.insert(users).values(insertData);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== Application Functions ==========

export async function createApplication(data: InsertApplication): Promise<Application> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [application] = await db.insert(applications).values(data).returning();
  return application;
}

export async function getApplicationById(id: number): Promise<Application | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [application] = await db.select().from(applications).where(eq(applications.id, id));
  return application;
}

export async function listApplications(filters?: {
  vehicleType?: string;
  availability?: "imediata" | "15_dias" | "30_dias";
  startDate?: Date;
  endDate?: Date;
}): Promise<Application[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const conditions = [];

  if (filters?.availability) {
    conditions.push(eq(applications.availability, filters.availability));
  }

  if (filters?.startDate) {
    conditions.push(gte(applications.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(applications.createdAt, filters.endDate));
  }

  let query = db.select().from(applications);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const results = await query.orderBy(desc(applications.createdAt));

  // Filter by vehicle type in memory (since it's a JSON array)
  if (filters?.vehicleType) {
    return results.filter(app => 
      app.vehicleTypes.includes(filters.vehicleType!)
    );
  }

  return results;
}

export async function updateApplicationStatus(
  id: number, 
  status: "pendente" | "em_analise" | "aprovado" | "rejeitado"
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(applications).set({ status }).where(eq(applications.id, id));
}

export async function getApplicationStats(): Promise<{
  total: number;
  pendente: number;
  em_analise: number;
  aprovado: number;
  rejeitado: number;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const allApplications = await db.select().from(applications);
  
  return {
    total: allApplications.length,
    pendente: allApplications.filter(a => a.status === "pendente").length,
    em_analise: allApplications.filter(a => a.status === "em_analise").length,
    aprovado: allApplications.filter(a => a.status === "aprovado").length,
    rejeitado: allApplications.filter(a => a.status === "rejeitado").length,
  };
}
