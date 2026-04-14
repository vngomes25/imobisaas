# ImobiSaaS - TODO

## Fase 1: Base de Dados e Schema
- [x] Schema completo: users (com roles admin/owner/tenant), properties, owners, tenants, contracts, payments, maintenances, inspections, inspection_items, documents
- [x] Migrations SQL aplicadas

## Fase 2: Backend (tRPC Routers)
- [x] Router de autenticação com controlo de perfil (admin, proprietário, inquilino)
- [x] Router de imóveis (CRUD completo, fotos, status, histórico)
- [x] Router de proprietários (CRUD, vínculo com imóveis)
- [x] Router de inquilinos (CRUD, vínculo com contratos)
- [x] Router de contratos (CRUD, vigência, reajustes, renovações)
- [x] Router financeiro (boletos, cobranças, repasses, relatórios)
- [x] Router de manutenções (solicitações, status, histórico)
- [x] Router de vistorias/inspeções (checklist, fotos, relatório)
- [x] Router de dashboard (KPIs, métricas)

## Fase 3: Tema Visual e Layout
- [x] Tema elegante e sofisticado (cores, tipografia, espaçamentos)
- [x] DashboardLayout adaptado com sidebar por perfil
- [x] Sistema de routing por perfil (admin/owner/tenant)

## Fase 4: Painel Administrativo
- [x] Dashboard com KPIs (contratos ativos, receitas, inadimplência, imóveis vagos)
- [x] Gestão de imóveis (listagem, cadastro, edição, fotos, status)
- [x] Gestão de proprietários (listagem, cadastro, edição)
- [x] Gestão de inquilinos (listagem, cadastro, edição)
- [x] Gestão de contratos (listagem, cadastro, vigência, reajustes)
- [x] Módulo financeiro (boletos, cobranças, repasses, relatórios)
- [x] Gestão de manutenções e vistorias

## Fase 5: Portais
- [x] Portal do inquilino (contrato, boletos, manutenção, comunicados)
- [x] Portal do proprietário (imóveis, extrato repasses, contratos, documentos)

## Fase 6: Módulos Avançados
- [x] Módulo de manutenções com fotos e status de atendimento
- [x] Auditoria de visitas com checklist e registo fotográfico
- [x] Histórico completo por imóvel, contrato e intervenientes

## Fase 7: Testes e Qualidade
- [x] Testes vitest para routers (21 testes passando)
- [x] Controlo de acesso por role no PortalLayout
- [x] 0 erros TypeScript
