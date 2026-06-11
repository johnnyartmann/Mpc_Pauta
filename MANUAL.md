# Manual do Usuário — MPC/SC — Gestão de Pauta e Decisões

**Versão:** 1.0  
**Sistema:** Gestão de Pauta e Decisões do Tribunal de Contas do Estado de Santa Catarina  
**Órgão:** Ministério Público de Contas de Santa Catarina (MPC/SC)

---

## Índice

1. [Introdução](#1-introdução)
2. [Acesso ao Sistema](#2-acesso-ao-sistema)
3. [Perfis de Usuário](#3-perfis-de-usuário)
4. [Dashboard](#4-dashboard)
5. [Módulo Importar](#5-módulo-importar)
   - [5.1 Importar Pauta (Excel)](#51-importar-pauta-excel)
   - [5.2 Importar Diário Oficial (PDF)](#52-importar-diário-oficial-pdf)
6. [Módulo Pauta](#6-módulo-pauta)
   - [6.1 Listagem de Pautas](#61-listagem-de-pautas)
   - [6.2 Edição de Processo](#62-edição-de-processo)
   - [6.3 Importar Voto (PDF)](#63-importar-voto-pdf)
7. [Módulo Parecer/Decisão](#7-módulo-parecerdecisão)
   - [7.1 Listagem](#71-listagem)
   - [7.2 Edição do Parecer](#72-edição-do-parecer)
8. [Módulo Buscador](#8-módulo-buscador)
9. [Módulo Administração](#9-módulo-administração)
   - [9.1 Gerenciamento de Usuários](#91-gerenciamento-de-usuários)
10. [Dicas e Boas Práticas](#10-dicas-e-boas-práticas)

---

## 1. Introdução

O sistema **MPC/SC — Gestão de Pauta e Decisões** foi desenvolvido para centralizar e organizar o trabalho dos servidores e procuradores do Ministério Público de Contas de Santa Catarina no acompanhamento das pautas de julgamento do Tribunal de Contas do Estado (TCE/SC).

O sistema permite:

- **Importar** planilhas de pauta fornecidas pelo TCE/SC (arquivos Excel .xlsx)
- **Importar** o Diário Oficial Eletrônico do TCE/SC (arquivos PDF)
- **Redigir** peças jurídicas (Parecer MPC, Ementa de Voto, Proposta de Voto, Decisão)
- **Transcrever** pareceres sobre decisões publicadas no Diário Oficial
- **Buscar** por palavras-chave em todos os documentos e processos cadastrados
- **Gerenciar** usuários do sistema (perfil administrador)

---

## 2. Acesso ao Sistema

### 2.1 Login

1. Acesse o endereço do sistema (ex: `http://localhost:3000`)
2. Digite seu **email** e **senha**
3. Clique em **Entrar**

A tela de login exibe a logomarca do MPC/SC e redireciona automaticamente para o dashboard do seu perfil.

### 2.2 Recuperação de Senha

Em caso de esquecimento de senha, entre em contato com o administrador do sistema. O administrador pode redefinir sua senha através do módulo de Administração.

---

## 3. Perfis de Usuário

O sistema possui **três perfis** de acesso, cada um com permissões específicas:

### 3.1 Registrador (Servidor)

O perfil **Registrador** é o responsável pela carga de dados e redação das peças jurídicas. Suas principais funções são:

- Importar planilhas Excel de pautas do TCE/SC
- Importar arquivos PDF do Diário Oficial Eletrônico
- Preencher os campos de documentos (Parecer MPC, Ementa de Voto, Proposta de Voto, Decisão)
- Editar informações de processos (Relator, Unidade Gestora, Assunto, Interessados, Grupo)
- Transcrever pareceres sobre decisões do Diário Oficial
- Atribuir procuradores aos processos
- Marcar voto divergente
- Excluir registros

### 3.2 Procurador

O perfil **Procurador** tem acesso de **visualização** de todo o conteúdo. Suas principais funções são:

- Visualizar pautas e documentos
- Visualizar decisões do Diário Oficial e pareceres transcritos
- Utilizar o buscador para pesquisar jurisprudência
- Filtrar e consultar processos por diversos critérios

### 3.3 Administrador

O perfil **Administrador** gerencia os usuários do sistema:

- Criar novos usuários (apenas perfil Procurador)
- Ativar e desativar usuários

O administrador **não** pode criar outros administradores nem registradores pela interface do sistema.

---

## 4. Dashboard

Após o login, o sistema exibe um **Dashboard** com informações resumidas:

### Registrador

- **Total de Pautas**: número de pautas já importadas
- **Processos Cadastrados**: total de processos no sistema
- **Concluídos**: processos que já possuem Parecer MPC e Proposta de Voto preenchidos
- **Pautas Recentes**: lista das últimas pautas importadas com data e quantidade de processos
- **Ações rápidas**: botões "Nova Importação" e "Ver Pautas"

### Procurador

- **Total de Pautas**: número de pautas disponíveis para consulta
- **Processos**: total de processos cadastrados
- **Concluídos**: processos com Parecer MPC e Proposta de Voto preenchidos
- **Pautas Disponíveis**: lista das pautas importadas
- **Ações rápidas**: "Ver Pautas" e "Buscar Documentos"

---

## 5. Módulo Importar

O módulo **Importar** está disponível na barra lateral esquerda. Ao clicar, você verá duas abas:

- **Excel - Pauta TCE**: para importar planilhas de pauta
- **PDF - Diário Oficial**: para importar o Diário Oficial Eletrônico

### 5.1 Importar Pauta (Excel)

Esta função carrega a planilha de processos fornecida pelo TCE/SC.

#### Formato da Planilha

A planilha Excel deve seguir o formato padrão do TCE/SC:

- **Linha 1**: cabeçalho institucional (será descartada automaticamente)
- **Linha 2**: cabeçalho com as colunas: `Grupo`, `Processo`, `Relator`, `Unidade Gestora`, `Assunto`, `Interessados`
- **Linhas 3 em diante**: dados dos processos

#### Passo a Passo

1. Acesse **Importar** no menu lateral
2. Selecione a aba **Excel - Pauta TCE**
3. Preencha o campo **Nome da Pauta** (ex: "Sessão Ordinária 01/2026")
4. Arraste um arquivo .xlsx para a área de upload ou clique para selecionar
5. Uma **pré-visualização** das primeiras linhas será exibida para conferência
6. Clique em **Importar Pauta**

> **Importante**: O sistema detecta automaticamente processos duplicados. Se um processo já existe no banco, seus dados são atualizados com as informações mais recentes da planilha. O processo é vinculado à nova pauta sem duplicação.

#### Regras de Deduplicação

- Um mesmo processo pode aparecer em várias pautas (ex: foi pautado em maio e depois em junho)
- O sistema mantém **um único cadastro** do processo e cria vínculos para cada pauta
- Os campos complementares (Grupo, Relator, Unidade Gestora, Assunto, Interessados) são atualizados com os dados mais recentes

### 5.2 Importar Diário Oficial (PDF)

Esta função extrai automaticamente as decisões publicadas no Diário Oficial Eletrônico do TCE/SC.

#### O que é extraído

O sistema localiza e extrai apenas as seções de interesse:

- **Deliberações do Tribunal Pleno**
- **Decisões Singulares**
- **Parecer Prévio** (Prestação de Contas do Governador)

Seções como Atos Administrativos, Licitações, Contratos, Editais de Citação e Notificações são **ignoradas automaticamente**.

#### Formato do Arquivo

O arquivo deve seguir o padrão de nomenclatura: `dotc-eYYYY-MM-DD.pdf`

Exemplo: `dotc-e2026-06-08.pdf`

A data de publicação e o número da edição são extraídos automaticamente do arquivo.

#### Passo a Passo

1. Acesse **Importar** no menu lateral
2. Selecione a aba **PDF - Diário Oficial**
3. Arraste um arquivo PDF para a área de upload ou clique para selecionar
4. Aguarde o processamento (o sistema exibe "Processando PDF...")
5. Uma **pré-visualização** das entradas encontradas será exibida:
   - Número do Processo
   - Unidade Gestora
   - Responsável
   - Interessados
   - Relator
   - Unidade Técnica
   - Tipo (Decisão Singular, Parecer Prévio, Deliberação do Plenário)
   - Número da Decisão
6. Confira os dados e clique em **Confirmar Importação**

> **Importante**: O sistema não duplica entradas. Se o mesmo processo, na mesma data, com o mesmo número de decisão já existe, ele é ignorado.

---

## 6. Módulo Pauta

O módulo **Pauta** (acessível pelo menu lateral) permite visualizar, filtrar e editar os processos importados.

### 6.1 Listagem de Pautas

A tela de listagem exibe uma **tabela** com todos os processos cadastrados.

#### Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| **Pauta** | Nome da pauta onde o processo foi incluído |
| **Processo** | Número do processo (clicável — abre a página de edição) |
| **Procurador** | Procurador atribuído ao processo (clicável para selecionar) |
| **Relator** | Nome do Conselheiro Relator |
| **Unidade Gestora** | Órgão ou entidade fiscalizada |
| **Status** | **Concluído** (verde) se Parecer MPC e Proposta de Voto estão preenchidos; **Pendente** (amarelo) caso contrário |
| **Voto Div.** | Checkbox para marcar/desmarcar Voto Divergente |
| **Ações** | Link "Editar" e botão "Excluir" (com confirmação) |

#### Filtros Disponíveis

No topo da página, você pode filtrar por:

- **Pauta**: selecione uma pauta específica ou "Todas"
- **Relator**: digite parte do nome do relator
- **Unidade Gestora**: digite parte do nome da UG
- **Procurador**: selecione um procurador atribuído
- **Buscar**: digite número do processo, assunto ou interessados

Os filtros são combinados — você pode usar vários ao mesmo tempo.

#### Atribuir Procurador

1. Na coluna **Procurador**, clique no **+** ou no nome do procurador atual
2. Um menu suspenso aparece com a lista de procuradores ativos
3. Selecione o procurador desejado
4. Para remover a atribuição, selecione **Nenhum**

#### Voto Divergente

1. Marque o checkbox na coluna **Voto Div.** para indicar voto divergente
2. Isso libera um campo extra de texto na página de edição do processo
3. Desmarque para ocultar o campo novamente (o texto é preservado)

#### Excluir Processo da Pauta

1. Na coluna **Ações**, clique em **Excluir**
2. O sistema pede confirmação: **Sim** ou **Não**
3. Ao confirmar, o vínculo do processo com a pauta é removido
4. O cadastro do processo **não é excluído** — apenas o vínculo com aquela pauta

### 6.2 Edição de Processo

Ao clicar no número do processo (ou em **Editar**), você acessa a página de edição completa.

#### Seção de Informações do Processo

Todos os campos são **editáveis** individualmente:

- **Relator**: nome do Conselheiro Relator
- **Unidade Gestora**: órgão ou entidade fiscalizada
- **Grupo**: grupo da pauta
- **Interessados**: partes interessadas
- **Assunto**: descrição do assunto do processo

Cada campo possui um botão **✓** para salvar a alteração individualmente.

#### Seletor de Pauta

Se o processo estiver vinculado a **mais de uma pauta**, um seletor dropdown aparece no topo. Ao trocar de pauta, o sistema carrega automaticamente os documentos (Parecer, Ementa, Proposta, Decisão) daquela pauta específica.

#### Checkbox Voto Divergente

Marque esta opção se o processo requer um voto divergente. Ao marcar, um editor adicional aparece entre "Proposta de Voto" e "Decisão", com borda vermelha para destaque.

#### Documentos (Editor de Texto Rico)

São **quatro** campos de texto com editor rico (semelhante a um editor de texto como Word):

1. **Parecer MPC**: parecer do Ministério Público de Contas
2. **Ementa do Voto**: resumo da decisão (ementa)
3. **Proposta de Voto**: texto completo da proposta de voto
4. **Decisão**: texto da decisão
5. **Voto Divergente** (opcional): aparece apenas se o checkbox estiver marcado

#### Funcionalidades do Editor

- **Negrito** (B)
- **Itálico** (I)
- **Sublinhado** (U)
- **Lista numerada** (1.)
- **Lista com marcadores** (•)

#### Salvando

Cada campo de documento possui seu próprio botão **Salvar**. Ao clicar, uma mensagem verde de confirmação aparece no topo da página por 3 segundos: *"Documento salvo com sucesso."*

### 6.3 Importar Voto (PDF)

Esta função permite importar automaticamente a **Ementa** e a **Proposta de Voto** de um arquivo PDF de voto do TCE/SC.

#### Como Funciona

1. Na página de edição do processo, clique em **Importar Voto (PDF)**
2. Selecione o arquivo PDF do voto
3. O sistema extrai automaticamente:
   - **Ementa do Voto**: texto entre "PROPOSTA DE VOTO:" e "I. RELATÓRIO"
   - **Proposta de Voto**: texto do capítulo "III. VOTO"
4. Os campos "Ementa do Voto" e "Proposta de Voto" são preenchidos automaticamente
5. Uma mensagem verde confirma a extração: *"Ementa e Proposta de Voto extraídas com sucesso! Verifique e salve."*
6. Revise o texto extraído e clique em **Salvar Ementa** e **Salvar Proposta**

> **Importante**: O texto extraído preserva parágrafos e negritos do documento original. Sempre revise antes de salvar.

---

## 7. Módulo Parecer/Decisão

O módulo **Parecer/Decisão** (anteriormente chamado Diário Oficial) permite visualizar e editar as decisões importadas do Diário Oficial Eletrônico.

### 7.1 Listagem

A tela exibe uma tabela com todas as entradas do Diário Oficial.

#### Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| **Diverge** | Checkbox para marcar decisão divergente |
| **Data** | Data de publicação do Diário Oficial |
| **Tipo** | Decisão Singular, Parecer Prévio ou Deliberação do Plenário |
| **Processo** | Número do processo (clicável — abre página de edição) |
| **Procurador** | Procurador atribuído (clicável para selecionar) |
| **Unid. Gestora** | Unidade Gestora |
| **Responsável** | Responsável pelo processo |
| **Interessados** | Partes interessadas |
| **Relator** | Conselheiro Relator |
| **Unid. Técnica** | Unidade Técnica do TCE |
| **Status** | **Concluído** (verde) se o parecer foi transcrito; **Pendente** (amarelo) caso contrário |
| **N. Decisão** | Número da decisão (ex: GAC/WWD - 257/2026) |
| **Ações** | Botão "Excluir" (com confirmação) |

#### Filtros Disponíveis

- **Data Início / Data Fim**: filtra por período de publicação
- **Procurador**: filtra por procurador atribuído
- **Diverge**: filtra apenas decisões com divergência marcada
- **Buscar**: pesquisa por processo, UG, interessados, assunto

### 7.2 Edição do Parecer

Ao clicar no número do processo, você acessa a página de edição do parecer.

#### Campos Editáveis

Todos os campos de texto são **editáveis individualmente** com botão ✓ para salvar:

- **N. Decisão**
- **Relator**
- **Unidade Gestora**
- **Responsável**
- **Interessados**
- **Unidade Técnica**
- **Assunto**

Apenas **Data**, **Edição** e **Tipo** são somente leitura (extraídos do PDF).

#### Editor de Parecer

Abaixo dos campos, há um editor de texto rico para transcrever o **Parecer** sobre a decisão.

1. Digite ou cole o texto do parecer
2. Use a barra de formatação (Negrito, Itálico, Sublinhado, Listas)
3. Clique em **Salvar**

Uma mensagem verde confirma: *"Parecer salvo com sucesso."*

#### Conteúdo Original

Abaixo do editor, o **texto completo da decisão** extraído do Diário Oficial é exibido em formato HTML (somente leitura). Isso permite consultar o conteúdo original enquanto redige o parecer.

---

## 8. Módulo Buscador

O **Buscador** é uma ferramenta de pesquisa unificada que procura em todo o sistema.

### O que é pesquisado

O buscador pesquisa simultaneamente em **três** tabelas:

1. **Processos**: número do processo, assunto, interessados, relator, unidade gestora
2. **Documentos das Pautas**: Parecer MPC, Ementa de Voto, Proposta de Voto, Decisão
3. **Parecer/Decisão (Diário Oficial)**: pareceres transcritos, conteúdo das decisões, assunto

### Como usar

1. Acesse **Buscador** no menu lateral
2. Digite uma ou mais palavras-chave (mínimo 2 caracteres)
3. Clique em **Buscar**

### Recursos da Busca

- **Busca por radical**: digitar "licita" encontra "licitação", "licitatório", "licitante"
- **Busca por múltiplos termos**: "prefeitura Florianópolis" encontra documentos com ambas as palavras
- **Trechos destacados**: os termos encontrados aparecem em **amarelo** no resultado
- **Relevância**: cada resultado tem uma pontuação de 0 a 1 indicando o grau de relevância
- **Origem**: cada resultado mostra de onde veio:
  - Azul **Pauta**: encontrado nos documentos das pautas
  - Verde **Processo**: encontrado nos dados do processo
  - Roxo **Parecer/Decisão**: encontrado no Diário Oficial

### Exemplos de Busca

| O que digitar | O que encontra |
|---------------|----------------|
| `RLI 21/007` | Processo específico por número |
| `Florianópolis` | Todos os processos da Prefeitura de Florianópolis |
| `Ascari` | Todos os processos relatados pelo Conselheiro Ascari |
| `licitação` | Documentos que mencionam licitação/licitatório |
| `superfaturamento` | Pareceres e decisões sobre o tema |
| `prestação de contas governador` | Pareceres prévios e decisões relacionadas |

---

## 9. Módulo Administração

> **Acesso restrito**: apenas o perfil **Administrador** pode acessar este módulo.

### 9.1 Gerenciamento de Usuários

Acessível pelo menu lateral (ícone ⚙).

#### Criar Procurador

1. Preencha o formulário no topo da página:
   - **Nome**: nome completo do procurador
   - **Email**: email institucional
   - **Senha**: mínimo 6 caracteres
2. Clique em **Criar Procurador**

> O sistema **não permite** criar usuários com perfil Registrador ou Administrador pela interface. Apenas o perfil Procurador pode ser criado.

#### Ativar / Desativar Usuário

1. Localize o usuário na tabela
2. Na coluna **Ações**, clique em **Desativar** (para bloquear o acesso) ou **Ativar** (para restaurar o acesso)
3. Um usuário desativado não consegue fazer login

#### Colunas da Tabela

- **Nome**: nome do usuário
- **Email**: email de login
- **Perfil**: Registrador, Procurador ou Administrador
- **Status**: Ativo (verde) ou Inativo (vermelho)
- **Ações**: botão para ativar/desativar

---

## 10. Dicas e Boas Práticas

### 10.1 Importação de Planilhas

- **Sempre verifique a pré-visualização** antes de confirmar a importação
- **Nomeie as pautas de forma clara**: use o formato "Sessão Ordinária XX/AAAA" ou "Sessão Virtual DD/MM/AAAA"
- Se a importação falhar, verifique se o arquivo está no formato .xlsx e se o cabeçalho corresponde ao padrão do TCE/SC
- O sistema exibe um resumo após a importação informando quantos processos são novos e quantos já existiam

### 10.2 Edição de Documentos

- **Salve com frequência**: cada campo de documento tem seu próprio botão Salvar. Alterne entre os campos e salve periodicamente
- **Use a formatação**: negrito para títulos de seção, listas para enumerações
- **Revise após importar PDF**: a extração automática de votos é precisa, mas sempre confira o texto antes de salvar

### 10.3 Fluxo de Trabalho Recomendado

1. **Importe a pauta** (Excel) ou o **Diário Oficial** (PDF)
2. Na listagem de Pautas, **atribua procuradores** aos processos
3. Acesse cada processo e **redija as peças** (Parecer, Ementa, Proposta, Decisão)
4. Se disponível, use **Importar Voto (PDF)** para acelerar o preenchimento da Ementa e Proposta
5. Use o **Buscador** para pesquisar jurisprudência e decisões anteriores

### 10.4 Pesquisa e Jurisprudência

- Use **termos jurídicos** padronizados para obter melhores resultados
- Combine **vários termos** para refinar a busca
- Consulte a coluna **Relevância** para identificar os resultados mais pertinentes
- A **origem** do resultado (Pauta, Processo, Parecer/Decisão) ajuda a contextualizar

### 10.5 Segurança

- **Nunca compartilhe sua senha**
- Ao terminar o uso, clique em **Sair** no canto inferior esquerdo
- O sistema registra automaticamente **todas as ações** (criação, edição, exclusão) em logs de auditoria
- Cada ação é vinculada ao usuário que a realizou, com data e hora

---

## Apêndice: Glossário

| Termo | Significado |
|-------|-------------|
| **Pauta** | Conjunto de processos que serão julgados em uma sessão do TCE/SC |
| **Processo** | Um processo específico do TCE/SC (ex: RLA 25/80004577) |
| **Unidade Gestora** | Órgão ou entidade pública fiscalizada pelo TCE |
| **Relator** | Conselheiro do TCE responsável pelo processo |
| **Parecer MPC** | Manifestação do Ministério Público de Contas sobre o processo |
| **Ementa de Voto** | Resumo ou palavras-chave que sintetizam a decisão |
| **Proposta de Voto** | Texto completo da proposta de deliberação do relator |
| **Decisão** | Texto da decisão proferida |
| **Voto Divergente** | Voto em sentido diferente do relator |
| **Diário Oficial Eletrônico** | Publicação oficial diária do TCE/SC (DOTC-e) |
| **Decisão Singular** | Decisão proferida monocraticamente por um Conselheiro |
| **Deliberação do Plenário** | Decisão do Tribunal Pleno (colegiada) |
| **Parecer Prévio** | Parecer do TCE sobre as contas anuais do Governador |
| **Status Concluído** | Processo que já possui Parecer MPC e Proposta de Voto |
| **Status Pendente** | Processo que ainda aguarda redação |

---

**MPC/SC — Ministério Público de Contas de Santa Catarina**  
Sistema de Gestão de Pauta e Decisões — TCE/SC
