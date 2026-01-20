import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Truck, Car, Bike, Bus, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";

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

// Formatação de CPF
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Formatação de telefone
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const formSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  phone: z.string().min(14, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cpf: z.string().refine(val => isValidCPF(val), "CPF inválido"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Selecione o estado"),
  vehicleTypes: z.array(z.string()).min(1, "Selecione pelo menos um tipo de veículo"),
  experienceYears: z.number().min(0, "Experiência não pode ser negativa"),
  availability: z.enum(["imediata", "15_dias", "30_dias"]),
  hasPendingFines: z.boolean(),
  acceptsLongTrips: z.boolean(),
  preferredSchedule: z.enum(["manha", "tarde", "noite", "integral", "flexivel"]),
  hasExperienceWithCargo: z.boolean(),
  hasExperienceWithPassengers: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const vehicleOptions = [
  { id: "moto", label: "Moto", icon: Bike },
  { id: "carro", label: "Carro", icon: Car },
  { id: "van", label: "Van", icon: Car },
  { id: "caminhao", label: "Caminhão", icon: Truck },
  { id: "onibus", label: "Ônibus", icon: Bus },
];

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      cpf: "",
      city: "",
      state: "",
      vehicleTypes: [],
      experienceYears: 0,
      availability: undefined,
      hasPendingFines: false,
      acceptsLongTrips: false,
      preferredSchedule: undefined,
      hasExperienceWithCargo: false,
      hasExperienceWithPassengers: false,
      notes: "",
    },
  });

  const submitMutation = trpc.applications.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Candidatura enviada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar candidatura");
    },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  const handleVehicleToggle = (vehicleId: string) => {
    const newSelected = selectedVehicles.includes(vehicleId)
      ? selectedVehicles.filter(v => v !== vehicleId)
      : [...selectedVehicles, vehicleId];
    setSelectedVehicles(newSelected);
    setValue("vehicleTypes", newSelected);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue("cpf", formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue("phone", formatted);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary py-4 shadow-lg">
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Transportadora Brasil" className="h-12 w-12 rounded-full object-cover" />
              <h1 className="text-xl font-bold text-primary-foreground">Transportadora Brasil</h1>
            </div>
          </div>
        </header>

        <main className="container py-16">
          <Card className="mx-auto max-w-lg text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Candidatura Enviada!</h2>
              <p className="text-muted-foreground mb-6">
                Sua candidatura foi recebida com sucesso. Entraremos em contato em breve.
              </p>
              <Button onClick={() => { setSubmitted(false); reset(); setSelectedVehicles([]); }}>
                Enviar Nova Candidatura
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary py-4 shadow-lg">
        <div className="container flex items-center justify-center">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Transportadora Brasil" className="h-12 w-12 rounded-full object-cover" />
            <h1 className="text-xl font-bold text-primary-foreground">Transportadora Brasil</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-[oklch(0.35_0.12_250)] py-16 text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trabalhe Conosco</h2>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Estamos sempre em busca de motoristas qualificados para fazer parte da nossa equipe.
            Preencha o formulário abaixo e candidate-se!
          </p>
        </div>
      </section>

      {/* Form Section */}
      <main className="container py-12">
        <Card className="mx-auto max-w-2xl shadow-xl border-t-4 border-t-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Formulário de Candidatura</CardTitle>
            <CardDescription>
              Preencha seus dados para se candidatar a uma vaga de motorista
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary border-b pb-2">Dados Pessoais</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      placeholder="Seu nome completo"
                      {...register("fullName")}
                      className={errors.fullName ? "border-destructive" : ""}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={watch("cpf")}
                      onChange={handleCPFChange}
                      className={errors.cpf ? "border-destructive" : ""}
                    />
                    {errors.cpf && (
                      <p className="text-sm text-destructive">{errors.cpf.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={watch("phone")}
                      onChange={handlePhoneChange}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      {...register("email")}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary border-b pb-2">Localização</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      placeholder="Sua cidade"
                      {...register("city")}
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Select onValueChange={(value) => setValue("state", value)}>
                      <SelectTrigger className={errors.state ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <p className="text-sm text-destructive">{errors.state.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tipos de Veículos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary border-b pb-2">Tipos de Veículos *</h3>
                <p className="text-sm text-muted-foreground">Selecione os tipos de veículos que você pode dirigir</p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {vehicleOptions.map((vehicle) => {
                    const Icon = vehicle.icon;
                    const isSelected = selectedVehicles.includes(vehicle.id);
                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => handleVehicleToggle(vehicle.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-8 w-8" />
                        <span className="text-sm font-medium">{vehicle.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.vehicleTypes && (
                  <p className="text-sm text-destructive">{errors.vehicleTypes.message}</p>
                )}
              </div>

              {/* Experiência e Disponibilidade */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary border-b pb-2">Experiência e Disponibilidade</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Anos de Experiência *</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("experienceYears", { valueAsNumber: true })}
                      className={errors.experienceYears ? "border-destructive" : ""}
                    />
                    {errors.experienceYears && (
                      <p className="text-sm text-destructive">{errors.experienceYears.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Disponibilidade para Início *</Label>
                    <Select onValueChange={(value) => setValue("availability", value as "imediata" | "15_dias" | "30_dias")}>
                      <SelectTrigger className={errors.availability ? "border-destructive" : ""}>
                        <SelectValue placeholder="Quando pode começar?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imediata">Imediata</SelectItem>
                        <SelectItem value="15_dias">Em 15 dias</SelectItem>
                        <SelectItem value="30_dias">Em 30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.availability && (
                      <p className="text-sm text-destructive">{errors.availability.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Horário de Trabalho Preferido *</Label>
                  <Select onValueChange={(value) => setValue("preferredSchedule", value as "manha" | "tarde" | "noite" | "integral" | "flexivel")}>
                    <SelectTrigger className={errors.preferredSchedule ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">Manhã</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="noite">Noite</SelectItem>
                      <SelectItem value="integral">Integral</SelectItem>
                      <SelectItem value="flexivel">Flexível</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.preferredSchedule && (
                    <p className="text-sm text-destructive">{errors.preferredSchedule.message}</p>
                  )}
                </div>
              </div>

              {/* Perguntas Adicionais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary border-b pb-2">Informações Adicionais</h3>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Possui multas pendentes? *</Label>
                    <RadioGroup
                      onValueChange={(value) => setValue("hasPendingFines", value === "sim")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="hasPendingFines-sim" />
                        <Label htmlFor="hasPendingFines-sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="hasPendingFines-nao" />
                        <Label htmlFor="hasPendingFines-nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Aceita viagens longas (fora da cidade)? *</Label>
                    <RadioGroup
                      onValueChange={(value) => setValue("acceptsLongTrips", value === "sim")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="acceptsLongTrips-sim" />
                        <Label htmlFor="acceptsLongTrips-sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="acceptsLongTrips-nao" />
                        <Label htmlFor="acceptsLongTrips-nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Tem experiência com transporte de cargas? *</Label>
                    <RadioGroup
                      onValueChange={(value) => setValue("hasExperienceWithCargo", value === "sim")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="hasExperienceWithCargo-sim" />
                        <Label htmlFor="hasExperienceWithCargo-sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="hasExperienceWithCargo-nao" />
                        <Label htmlFor="hasExperienceWithCargo-nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Tem experiência com transporte de passageiros? *</Label>
                    <RadioGroup
                      onValueChange={(value) => setValue("hasExperienceWithPassengers", value === "sim")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="hasExperienceWithPassengers-sim" />
                        <Label htmlFor="hasExperienceWithPassengers-sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="hasExperienceWithPassengers-nao" />
                        <Label htmlFor="hasExperienceWithPassengers-nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações Adicionais</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais que você gostaria de compartilhar..."
                  rows={4}
                  {...register("notes")}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Prosseguir com o formulário"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-primary py-6 text-primary-foreground">
        <div className="container text-center">
          <p className="opacity-80">© 2026 Transportadora Brasil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
