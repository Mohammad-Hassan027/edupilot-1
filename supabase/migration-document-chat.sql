-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  file_url text not null, -- The path in Supabase Storage or external URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for documents
alter table documents enable row level security;

create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = user_id);

-- Create a table to store the text chunks and their embeddings
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  content text not null,
  embedding vector(768) not null -- 768 is the dimension for Gemini text-embedding-004
);

-- Enable RLS for document_chunks (policies usually follow the parent document)
alter table document_chunks enable row level security;

create policy "Users can view chunks of their documents"
  on document_chunks for select
  using (
    exists (
      select 1 from documents
      where documents.id = document_chunks.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can insert chunks into their documents"
  on document_chunks for insert
  with check (
    exists (
      select 1 from documents
      where documents.id = document_chunks.document_id
      and documents.user_id = auth.uid()
    )
  );

-- Create an index for faster similarity searches
create index on document_chunks using hnsw (embedding vector_cosine_ops);

-- Create a function to similarity search for document chunks
create or replace function match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  doc_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where document_chunks.document_id = doc_id
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
