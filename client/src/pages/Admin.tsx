import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Loader2, 
  LogOut, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Filter,
  Home,
  RefreshCw,
  MapPin,
  Car,
  Check,
  X
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Application = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  cpf: string;
  city: string;
  state: string;
  vehicleTypes: string[];
  experienceYears: number;
  availability: "imediata" | "15_dias" | "30_dias";
  hasPendingFines: boolean;
  acceptsLongTrips: boolean;
  preferredSchedule: "manha" | "tarde" | "noite" | "integral" | "flexivel";
  hasExperienceWithCargo: boolean;
  hasExperienceWithPassengers: boolean;
  notes: string | null;
  status: "pendente" | "em_analise" | "aprovado" | "rejeitado";
  createdAt: Date;
  updatedAt: Date;
};

const vehicleLabels: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  caminhao: "Caminhão",
  onibus: "Ônibus",
};

const availabilityLabels: Record<string, string> = {
  imediata: "Imediata",
  "15_dias": "15 dias",
  "30_dias": "30 dias",
};

const scheduleLabels: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  integral: "Integral",
  flexivel: "Flexível",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise: { label: "Em Análise", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
};

export default function Admin() {
  const { user, loading: authLoading, logout } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filters, setFilters] = useState({
    vehicleType: "",
    availability: "",
    startDate: "",
    endDate: "",
  });

  const utils = trpc.useUtils();

  const { data: applications, isLoading: applicationsLoading, refetch } = trpc.applications.list.useQuery(
    {
      vehicleType: filters.vehicleType || undefined,
      availability: filters.availability as "imediata" | "15_dias" | "30_dias" | undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
    { enabled: !!user && user.role === "admin" }
  );

  const { data: stats } = trpc.applications.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const updateStatusMutation = trpc.applications.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      utils.applications.list.invalidate();
      utils.applications.stats.invalidate();
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const handleStatusChange = (id: number, status: "pendente" | "em_analise" | "aprovado" | "rejeitado") => {
    updateStatusMutation.mutate({ id, status });
  };

  const clearFilters = () => {
    setFilters({
      vehicleType: "",
      availability: "",
      startDate: "",
      endDate: "",
    });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary py-4 shadow-lg">
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Transportadora Brasil" className="h-12 w-12 rounded-full object-cover" />
              <h1 className="text-xl font-bold text-primary-foreground">Transportadora Brasil</h1>
            </div>
            <Link href="/">
              <Button variant="secondary" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </header>

        <main className="container py-16">
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <CardTitle>Área Administrativa</CardTitle>
              <CardDescription>
                Faça login para acessar o painel de gerenciamento de candidaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>Fazer Login</a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Not admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary py-4 shadow-lg">
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Transportadora Brasil" className="h-12 w-12 rounded-full object-cover" />
              <h1 className="text-xl font-bold text-primary-foreground">Transportadora Brasil</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="secondary" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-16">
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-destructive">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta área. Entre em contato com o administrador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button>Voltar para Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary py-4 shadow-lg sticky top-0 z-50">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Transportadora Brasil" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Painel Administrativo</h1>
              <p className="text-sm text-primary-foreground/80">Olá, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="secondary" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold">{stats?.total ?? 0}</p>
                </div>
                <Users className="h-10 w-10 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats?.pendente ?? 0}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.aprovado ?? 0}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejeitados</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.rejeitado ?? 0}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar
                </Button>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Tipo de Veículo</Label>
                <Select value={filters.vehicleType} onValueChange={(v) => setFilters({ ...filters, vehicleType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="caminhao">Caminhão</SelectItem>
                    <SelectItem value="onibus">Ônibus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disponibilidade</Label>
                <Select value={filters.availability} onValueChange={(v) => setFilters({ ...filters, availability: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="imediata">Imediata</SelectItem>
                    <SelectItem value="15_dias">15 dias</SelectItem>
                    <SelectItem value="30_dias">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Candidaturas</CardTitle>
            <CardDescription>
              Lista de todas as candidaturas recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : applications && applications.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Veículos</TableHead>
                      <TableHead>Disponibilidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.fullName}</TableCell>
                        <TableCell>{app.phone}</TableCell>
                        <TableCell>{app.city}/{app.state}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {app.vehicleTypes.slice(0, 2).map((v) => (
                              <Badge key={v} variant="secondary" className="text-xs">
                                {vehicleLabels[v] || v}
                              </Badge>
                            ))}
                            {app.vehicleTypes.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{app.vehicleTypes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{availabilityLabels[app.availability]}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[app.status].variant}>
                            {statusConfig[app.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(app.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedApplication(app as Application)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma candidatura encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Candidatura</DialogTitle>
            <DialogDescription>
              Informações completas do candidato
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Status atual */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status Atual</p>
                  <Badge variant={statusConfig[selectedApplication.status].variant} className="mt-1">
                    {statusConfig[selectedApplication.status].label}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedApplication.id, "em_analise")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Em Análise
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStatusChange(selectedApplication.id, "aprovado")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange(selectedApplication.id, "rejeitado")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Rejeitar
                  </Button>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div>
                <h4 className="font-semibold text-primary mb-3">Dados Pessoais</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{selectedApplication.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{selectedApplication.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedApplication.email || "Não informado"}</p>
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div>
                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade</p>
                    <p className="font-medium">{selectedApplication.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium">{selectedApplication.state}</p>
                  </div>
                </div>
              </div>

              {/* Veículos */}
              <div>
                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Tipos de Veículos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.vehicleTypes.map((v) => (
                    <Badge key={v} variant="secondary">
                      {vehicleLabels[v] || v}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experiência e Disponibilidade */}
              <div>
                <h4 className="font-semibold text-primary mb-3">Experiência e Disponibilidade</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Anos de Experiência</p>
                    <p className="font-medium">{selectedApplication.experienceYears} anos</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Disponibilidade</p>
                    <p className="font-medium">{availabilityLabels[selectedApplication.availability]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário Preferido</p>
                    <p className="font-medium">{scheduleLabels[selectedApplication.preferredSchedule]}</p>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div>
                <h4 className="font-semibold text-primary mb-3">Informações Adicionais</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    {selectedApplication.hasPendingFines ? (
                      <X className="h-4 w-4 text-red-600" />
                    ) : (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    <span>{selectedApplication.hasPendingFines ? "Possui multas pendentes" : "Sem multas pendentes"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedApplication.acceptsLongTrips ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span>Aceita viagens longas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedApplication.hasExperienceWithCargo ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span>Experiência com cargas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedApplication.hasExperienceWithPassengers ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span>Experiência com passageiros</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedApplication.notes && (
                <div>
                  <h4 className="font-semibold text-primary mb-3">Observações</h4>
                  <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedApplication.notes}
                  </p>
                </div>
              )}

              {/* Datas */}
              <div className="pt-4 border-t text-sm text-muted-foreground">
                <p>Candidatura recebida em: {format(new Date(selectedApplication.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
