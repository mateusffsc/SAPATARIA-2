# Sistema de Gestão de Sapataria

Sistema completo para gestão de sapatarias, desenvolvido com React, TypeScript e Supabase.

## Funcionalidades

- Gestão de Ordens de Serviço
- Cadastro de Clientes
- Controle de Serviços
- Gestão de Técnicos
- Controle Financeiro
- Upload de Imagens
- Relatórios e Análises

## Tecnologias Utilizadas

- React
- TypeScript
- Supabase (Backend e Banco de Dados)
- TailwindCSS
- Lucide Icons
- React Router
- Context API

## Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta no Supabase

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd [NOME_DO_PROJETO]
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
- Crie um arquivo `.env` na raiz do projeto
- Copie o conteúdo de `.env.example` para `.env`
- Preencha as variáveis com suas credenciais do Supabase

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## Estrutura do Projeto

```
src/
  ├── components/     # Componentes React
  ├── context/       # Contextos da aplicação
  ├── hooks/         # Hooks personalizados
  ├── lib/           # Configurações de bibliotecas
  ├── services/      # Serviços e integrações
  └── utils/         # Funções utilitárias
```

## Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
