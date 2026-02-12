import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('trip_id');
  if (!tripId) {
    return NextResponse.json({ error: 'trip_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('trip_id', tripId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const tripId = form.get('trip_id');
  const linkedItemType = form.get('linked_item_type');
  const linkedItemId = form.get('linked_item_id');
  const notes = form.get('notes');

  if (!(file instanceof File) || typeof tripId !== 'string') {
    return NextResponse.json({ error: 'file and trip_id are required' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const filePath = `${tripId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('trip-documents')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from('trip-documents').getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      trip_id: tripId,
      linked_item_type: typeof linkedItemType === 'string' ? linkedItemType : null,
      linked_item_id: typeof linkedItemId === 'string' ? linkedItemId : null,
      file_name: file.name,
      file_url: publicUrl.publicUrl,
      file_type: file.type,
      uploaded_by: user.id,
      notes: typeof notes === 'string' ? notes : null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: docError?.message || 'Document not found' }, { status: 404 });
  }

  const path = doc.file_url.includes('/trip-documents/')
    ? doc.file_url.split('/trip-documents/')[1]
    : doc.file_url;

  const { error: storageError } = await supabase.storage.from('trip-documents').remove([path]);
  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
