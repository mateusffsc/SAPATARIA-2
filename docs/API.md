# Documentação da API

## Visão Geral

O sistema utiliza o Supabase como backend, que fornece uma API RESTful para todas as operações. A comunicação é feita através do cliente Supabase para JavaScript/TypeScript.

## Autenticação

### Endpoints de Autenticação

```typescript
// Login com email/senha
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Logout
const { error } = await supabase.auth.signOut()

// Recuperar sessão atual
const { data: { session }, error } = await supabase.auth.getSession()
```

## Ordens de Serviço

### Estrutura da Tabela
```sql
create table orders (
  id bigint primary key,
  number text not null,
  date date not null,
  client_id bigint references clients(id),
  client_name text not null,
  article text not null,
  brand text,
  color text,
  size text,
  serial_number text,
  model text,
  description text,
  services jsonb,
  delivery_date date not null,
  payment_method_entry text,
  total_value numeric not null,
  entry_value numeric not null default 0,
  remaining_value numeric not null,
  payment_method_remaining text,
  observations text,
  status text not null default 'em-andamento',
  payments jsonb default '[]',
  created_by text not null,
  created_at timestamp with time zone default now(),
  last_modified_by text,
  last_modified_at timestamp with time zone
);
```

### Endpoints

```typescript
// Listar ordens de serviço
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .order('date', { ascending: false })

// Buscar ordem específica
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .single()

// Criar nova ordem
const { data, error } = await supabase
  .from('orders')
  .insert([orderData])
  .select()

// Atualizar ordem
const { data, error } = await supabase
  .from('orders')
  .update(orderData)
  .eq('id', orderId)
  .select()
```

## Transações Financeiras

### Estrutura da Tabela
```sql
create table financial_transactions (
  id bigint primary key,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  description text not null,
  category text not null,
  reference_type text,
  reference_id bigint,
  payment_method text,
  date date not null,
  created_by text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);
```

### Endpoints

```typescript
// Listar transações
const { data, error } = await supabase
  .from('financial_transactions')
  .select('*')
  .order('date', { ascending: false })

// Buscar transações por período
const { data, error } = await supabase
  .from('financial_transactions')
  .select('*')
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: false })

// Criar nova transação
const { data, error } = await supabase
  .from('financial_transactions')
  .insert([transactionData])
  .select()
```

## Clientes

### Estrutura da Tabela
```sql
create table clients (
  id bigint primary key,
  name text not null,
  cpf text,
  phone text,
  email text,
  address text,
  observations text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);
```

### Endpoints

```typescript
// Listar clientes
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('is_active', true)
  .order('name')

// Buscar cliente específico
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('id', clientId)
  .single()

// Criar novo cliente
const { data, error } = await supabase
  .from('clients')
  .insert([clientData])
  .select()
```

## Produtos

### Estrutura da Tabela
```sql
create table products (
  id bigint primary key,
  name text not null,
  description text,
  price numeric not null,
  cost numeric not null,
  stock_quantity integer not null default 0,
  min_stock_quantity integer not null default 0,
  supplier_id bigint references suppliers(id),
  category text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);
```

### Endpoints

```typescript
// Listar produtos
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('name')

// Atualizar estoque
const { data, error } = await supabase
  .from('products')
  .update({ stock_quantity: newQuantity })
  .eq('id', productId)
  .select()
```

## Políticas de Segurança (RLS)

### Exemplo de Política para Ordens de Serviço
```sql
-- Permitir leitura para usuários autenticados
create policy "Enable read access for authenticated users"
on orders for select
to authenticated
using (true);

-- Permitir inserção apenas para usuários autenticados
create policy "Enable insert for authenticated users"
on orders for insert
to authenticated
with check (auth.uid() = created_by);

-- Permitir atualização apenas para o criador ou admin
create policy "Enable update for owner or admin"
on orders for update
to authenticated
using (
  auth.uid() = created_by or
  auth.uid() in (select user_id from admin_users)
);
```

## Tratamento de Erros

```typescript
try {
  const { data, error } = await supabase.from('table').select('*')
  if (error) throw error
  // Processar dados
} catch (error) {
  console.error('Error:', error.message)
  // Tratar erro apropriadamente
}
```

## Boas Práticas

1. **Validação de Dados**
   - Sempre valide os dados antes de enviar para a API
   - Use tipos TypeScript para garantir a integridade dos dados
   - Implemente validações no frontend e backend

2. **Tratamento de Erros**
   - Sempre verifique o objeto `error` retornado
   - Implemente tratamento de erros adequado
   - Forneça feedback apropriado ao usuário

3. **Performance**
   - Use seleção específica de colunas quando possível
   - Implemente paginação para grandes conjuntos de dados
   - Use filtros apropriados para reduzir o volume de dados

4. **Segurança**
   - Nunca exponha chaves sensíveis no frontend
   - Implemente políticas RLS apropriadas
   - Valide permissões do usuário antes de operações sensíveis 