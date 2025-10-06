import { getSupabaseClient, hasSupabaseConfig } from './supabaseClient';
import { decodePatternPayload, encodePatternPayload } from '../utils/url';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MAX_ID_LENGTH = 10;
const MIN_ID_LENGTH = 8;
const MAX_INSERT_ATTEMPTS = 9;

const getRandomValues = (length) => {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return array;
};

export const randBase62 = (length) => {
  const values = getRandomValues(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += BASE62[values[i] % BASE62.length];
  }
  return out;
};

export const sha256 = async (input) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const supabaseGuard = () => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not configured');
  }
  return client;
};

const selectLengthForAttempt = (attempt) => {
  if (attempt < 3) return MIN_ID_LENGTH;
  if (attempt < 6) return MIN_ID_LENGTH + 1;
  return MAX_ID_LENGTH;
};

export const savePattern = async (data) => {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase credentials missing');
  }

  const supabase = supabaseGuard();
  const payload = encodePatternPayload(data);
  const hash = await sha256(payload);

  const existing = await supabase
    .from('patterns')
    .select('id')
    .eq('hash', hash)
    .maybeSingle();

  if (existing.error && existing.error.code !== 'PGRST116') {
    throw existing.error;
  }

  if (existing.data?.id) {
    return existing.data.id;
  }

  for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt += 1) {
    const id = randBase62(selectLengthForAttempt(attempt));
    const insert = await supabase
      .from('patterns')
      .insert({ id, payload, hash, v: 1 })
      .select('id')
      .maybeSingle();

    if (!insert.error && insert.data?.id) {
      return insert.data.id;
    }

    if (insert.error?.code !== '23505') {
      throw insert.error ?? new Error('Failed to insert pattern');
    }
  }

  throw new Error('Exceeded attempts to generate unique id');
};

export const loadPatternById = async (id) => {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase credentials missing');
  }

  const supabase = supabaseGuard();
  const { data, error } = await supabase
    .from('patterns')
    .select('payload')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  if (!data?.payload) {
    return null;
  }

  return decodePatternPayload(data.payload);
};
