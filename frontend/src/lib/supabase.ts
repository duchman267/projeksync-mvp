import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Database helper functions
export const getClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createClient = async (clientData: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select()
    .single();
  return { data, error };
};

export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients (
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createProject = async (projectData: {
  name: string;
  description?: string;
  client_id?: string;
  start_date?: string;
  deadline?: string;
}) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single();
  return { data, error };
};