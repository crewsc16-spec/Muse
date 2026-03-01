// All functions accept a supabase client as the first argument.

export async function getMoodEntries(supabase) {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveMoodEntry(supabase, entry) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('mood_entries')
    .upsert(
      { user_id: user.id, date: entry.date, mood: entry.mood, notes: entry.notes ?? null },
      { onConflict: 'user_id,date' }
    )
    .select();
  if (error) throw error;
  return data; // array; data[0].id is the entry id
}

export async function getVisionItems(supabase) {
  const { data, error } = await supabase
    .from('vision_items')
    .select('*, mood_entries(id, mood, notes, date)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveVisionItem(supabase, item) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('vision_items')
    .insert({
      user_id: user.id,
      type: item.type,
      category: item.category,
      content: item.content ?? null,
      image_url: item.image_url ?? null,
      mood_entry_id: item.mood_entry_id ?? null,
    })
    .select('*, mood_entries(id, mood, notes, date)');
  if (error) throw error;
  return data?.[0];
}

export async function updateVisionItem(supabase, id, updates) {
  const { data, error } = await supabase
    .from('vision_items')
    .update(updates)
    .eq('id', id)
    .select('*, mood_entries(id, mood, notes, date)');
  if (error) throw error;
  return data?.[0];
}

export async function deleteVisionItem(supabase, id) {
  const { error } = await supabase.from('vision_items').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadVisionImage(supabase, file) {
  const { data: { user } } = await supabase.auth.getUser();
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('vision-images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('vision-images').getPublicUrl(path);
  return data.publicUrl;
}

// ── Daily goals ──

export async function getGoals(supabase) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addGoal(supabase, title) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('goals')
    .insert({ user_id: user.id, title })
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteGoal(supabase, id) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

export async function getTodayCompletions(supabase, date) {
  const { data, error } = await supabase
    .from('goal_completions')
    .select('goal_id')
    .eq('date', date);
  if (error) throw error;
  return new Set((data ?? []).map(c => c.goal_id));
}

export async function toggleGoalCompletion(supabase, goalId, date, completing) {
  const { data: { user } } = await supabase.auth.getUser();
  if (completing) {
    const { error } = await supabase
      .from('goal_completions')
      .upsert({ goal_id: goalId, user_id: user.id, date }, { onConflict: 'goal_id,date' });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('goal_completions')
      .delete()
      .eq('goal_id', goalId)
      .eq('date', date);
    if (error) throw error;
  }
}
