# Transportadora Brasil - Sistema de Recrutamento de Motoristas

## Funcionalidades

- [x] Formulário público de candidatura com campos: nome, telefone, email, CPF, CNH (número e categoria), tipos de veículos, experiência, disponibilidade, observações
- [x] Validação obrigatória: nome, telefone, CPF, CNH, tipo de veículo, disponibilidade
- [x] Armazenamento de candidaturas no banco de dados com timestamp
- [x] Painel administrativo protegido por autenticação
- [x] Tabela de candidatos com filtros por tipo de veículo, disponibilidade e data
- [x] Visualização detalhada de cada candidato
- [x] Notificação automática ao owner quando nova candidatura for recebida
- [x] Design responsivo com cores da marca (azul e amarelo)
- [x] Logo da Transportadora Brasil no site

## Alterações Solicitadas

- [x] Remover campos de CNH (número e categoria) do formulário
- [x] Adicionar novas perguntas: cidade/estado, possui veículo próprio, tem multas, aceita viagens longas, horário preferido
- [x] Atualizar schema do banco de dados
- [x] Atualizar painel administrativo para exibir novos campos

## Novas Alterações

- [x] Remover pergunta "Possui veículo próprio?"
- [x] Alterar texto do botão de "Enviar Candidatura" para "Prosseguir com o formulário"

- [x] Remover botão "Área Administrativa" do header

## Adaptação para Railway

- [ ] Converter projeto de MySQL para PostgreSQL
- [ ] Criar arquivo railway.json para deploy automático
- [ ] Configurar migrações automáticas no deploy
- [ ] Gerar novo ZIP com instruções
