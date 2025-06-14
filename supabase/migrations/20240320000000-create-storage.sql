-- Create a storage bucket for notes
insert into storage.buckets (id, name, public)
values ('notes', 'notes', true);

-- Allow authenticated users to upload files
create policy "Allow authenticated users to upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'notes' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow public access to read files
create policy "Allow public access to read files"
on storage.objects for select
to public
using (bucket_id = 'notes');

-- Allow users to delete their own files
create policy "Allow users to delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'notes' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
); 
insert into storage.buckets (id, name, public)
values ('notes', 'notes', true);

-- Allow authenticated users to upload files
create policy "Allow authenticated users to upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'notes' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow public access to read files
create policy "Allow public access to read files"
on storage.objects for select
to public
using (bucket_id = 'notes');

-- Allow users to delete their own files
create policy "Allow users to delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'notes' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
); 