import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do banco de dados
vi.mock("./db", () => ({
  createApplication: vi.fn().mockResolvedValue({
    id: 1,
    fullName: "João Silva",
    phone: "(11) 99999-9999",
    email: "joao@email.com",
    cpf: "123.456.789-09",
    city: "São Paulo",
    state: "SP",
    vehicleTypes: ["caminhao", "carro"],
    experienceYears: 5,
    availability: "imediata",
    hasPendingFines: false,
    acceptsLongTrips: true,
    preferredSchedule: "integral",
    hasExperienceWithCargo: true,
    hasExperienceWithPassengers: false,
    notes: null,
    status: "pendente",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  listApplications: vi.fn().mockResolvedValue([
    {
      id: 1,
      fullName: "João Silva",
      phone: "(11) 99999-9999",
      email: "joao@email.com",
      cpf: "123.456.789-09",
      city: "São Paulo",
      state: "SP",
      vehicleTypes: ["caminhao", "carro"],
      experienceYears: 5,
      availability: "imediata",
      hasPendingFines: false,
      acceptsLongTrips: true,
      preferredSchedule: "integral",
      hasExperienceWithCargo: true,
      hasExperienceWithPassengers: false,
      notes: null,
      status: "pendente",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getApplicationById: vi.fn().mockResolvedValue({
    id: 1,
    fullName: "João Silva",
    phone: "(11) 99999-9999",
    email: "joao@email.com",
    cpf: "123.456.789-09",
    city: "São Paulo",
    state: "SP",
    vehicleTypes: ["caminhao", "carro"],
    experienceYears: 5,
    availability: "imediata",
    hasPendingFines: false,
    acceptsLongTrips: true,
    preferredSchedule: "integral",
    hasExperienceWithCargo: true,
    hasExperienceWithPassengers: false,
    notes: null,
    status: "pendente",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateApplicationStatus: vi.fn().mockResolvedValue(undefined),
  getApplicationStats: vi.fn().mockResolvedValue({
    total: 10,
    pendente: 5,
    em_analise: 2,
    aprovado: 2,
    rejeitado: 1,
  }),
}));

// Mock de notificação
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("applications.submit", () => {
  it("should submit a new application successfully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.applications.submit({
      fullName: "João Silva",
      phone: "(11) 99999-9999",
      email: "joao@email.com",
      cpf: "529.982.247-25", // CPF válido para teste
      city: "São Paulo",
      state: "SP",
      vehicleTypes: ["caminhao", "carro"],
      experienceYears: 5,
      availability: "imediata",
      hasPendingFines: false,
      acceptsLongTrips: true,
      preferredSchedule: "integral",
      hasExperienceWithCargo: true,
      hasExperienceWithPassengers: false,
      notes: "Tenho experiência com cargas pesadas",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe(1);
  });

  it("should reject invalid CPF", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.applications.submit({
        fullName: "João Silva",
        phone: "(11) 99999-9999",
        email: "joao@email.com",
        cpf: "111.111.111-11", // CPF inválido
        city: "São Paulo",
        state: "SP",
        vehicleTypes: ["caminhao"],
        experienceYears: 5,
        availability: "imediata",
        hasOwnVehicle: true,
        hasPendingFines: false,
        acceptsLongTrips: true,
        preferredSchedule: "integral",
        hasExperienceWithCargo: true,
        hasExperienceWithPassengers: false,
      })
    ).rejects.toThrow();
  });
});

describe("applications.list (admin)", () => {
  it("should list applications for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.applications.list({});

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].fullName).toBe("João Silva");
    expect(result[0].city).toBe("São Paulo");
    expect(result[0].state).toBe("SP");
  });

  it("should reject non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.applications.list({})).rejects.toThrow("Acesso restrito a administradores");
  });

  it("should reject unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.applications.list({})).rejects.toThrow();
  });
});

describe("applications.getById (admin)", () => {
  it("should get application by ID for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.applications.getById({ id: 1 });

    expect(result.id).toBe(1);
    expect(result.fullName).toBe("João Silva");
    expect(result.preferredSchedule).toBe("integral");
  });
});

describe("applications.updateStatus (admin)", () => {
  it("should update application status for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.applications.updateStatus({
      id: 1,
      status: "aprovado",
    });

    expect(result.success).toBe(true);
  });
});

describe("applications.stats (admin)", () => {
  it("should return application statistics for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.applications.stats();

    expect(result.total).toBe(10);
    expect(result.pendente).toBe(5);
    expect(result.aprovado).toBe(2);
  });
});
