import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  createApplication, 
  getApplicationById, 
  listApplications, 
  updateApplicationStatus,
  getApplicationStats 
} from "./db";
// import { notifyOwner } from "./_core/notification"; // Removido para deploy externo

// Validação de CPF
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;
  
  return true;
}

// Admin procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  applications: router({
    // Submeter candidatura (público)
    submit: publicProcedure
      .input(z.object({
        fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
        phone: z.string().min(10, "Telefone inválido"),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
        cpf: z.string().refine(isValidCPF, "CPF inválido"),
        city: z.string().min(2, "Cidade é obrigatória"),
        state: z.string().length(2, "Estado deve ter 2 caracteres"),
        vehicleTypes: z.array(z.string()).min(1, "Selecione pelo menos um tipo de veículo"),
        experienceYears: z.number().min(0, "Experiência não pode ser negativa"),
        availability: z.enum(["imediata", "15_dias", "30_dias"]),
        hasPendingFines: z.boolean(),
        acceptsLongTrips: z.boolean(),
        preferredSchedule: z.enum(["manha", "tarde", "noite", "integral", "flexivel"]),
        hasExperienceWithCargo: z.boolean(),
        hasExperienceWithPassengers: z.boolean(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const application = await createApplication({
          fullName: input.fullName,
          phone: input.phone,
          email: input.email || null,
          cpf: input.cpf,
          city: input.city,
          state: input.state,
          vehicleTypes: input.vehicleTypes,
          experienceYears: input.experienceYears,
          availability: input.availability,
          hasPendingFines: input.hasPendingFines,
          acceptsLongTrips: input.acceptsLongTrips,
          preferredSchedule: input.preferredSchedule,
          hasExperienceWithCargo: input.hasExperienceWithCargo,
          hasExperienceWithPassengers: input.hasExperienceWithPassengers,
          notes: input.notes || null,
        });

        // Notificação removida para deploy externo
        // Se quiser adicionar notificações, configure um serviço de email aqui
        console.log(`Nova candidatura recebida: ${input.fullName} - ${input.city}/${input.state}`);

        return { success: true, id: application.id };
      }),

    // Listar candidaturas (admin)
    list: adminProcedure
      .input(z.object({
        vehicleType: z.string().optional(),
        availability: z.enum(["imediata", "15_dias", "30_dias"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ? {
          vehicleType: input.vehicleType,
          availability: input.availability,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        } : undefined;

        return listApplications(filters);
      }),

    // Obter candidatura por ID (admin)
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const application = await getApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Candidatura não encontrada' });
        }
        return application;
      }),

    // Atualizar status (admin)
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pendente", "em_analise", "aprovado", "rejeitado"]),
      }))
      .mutation(async ({ input }) => {
        await updateApplicationStatus(input.id, input.status);
        return { success: true };
      }),

    // Estatísticas (admin)
    stats: adminProcedure.query(async () => {
      return getApplicationStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
