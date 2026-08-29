import { createClient } from "@supabase/supabase-js";

// Client for the default Database (Mantenimiento / Equipos / Profile)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://cnspbiftiwvfxkdzvpdb.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuc3BiaWZ0aXd2ZnhrZHp2cGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzk4MzQsImV4cCI6MjA4OTYxNTgzNH0._Ysvx1wD2zi-qxX8cgcGpCnFAG_QuOCDorUhOclw-Ec";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for the Inspections/Ratings Database
const supabaseRatingsUrl =
  import.meta.env.VITE_SUPABASE_RATINGS_URL ||
  "https://ktkehnqzwulxujuogmbp.supabase.co";
const supabaseRatingsAnonKey =
  import.meta.env.VITE_SUPABASE_RATINGS_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0a2VobnF6d3VseHVqdW9nbWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDQ1OTYsImV4cCI6MjA5MjAyMDU5Nn0.3KZr9HOVvqDHfdbBLeXsSS3a43zVNOmSP7YeGbG8XpE";

export const supabaseRatings = createClient(
  supabaseRatingsUrl,
  supabaseRatingsAnonKey,
);

// Client for Compras Database
export const supabaseComprasUrl =
  import.meta.env.VITE_SUPABASE_COMPRAS_URL ||
  "https://nnwtjjngneoeqbvifinn.supabase.co";
export const supabaseComprasAnonKey =
  import.meta.env.VITE_SUPABASE_COMPRAS_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3Rqam5nbmVvZXFidmlmaW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDA0NTIsImV4cCI6MjA5Mjk3NjQ1Mn0.PDNubsNqbhSaqPatkO1FfjSDpAYwAUvzq662Ua0uw7Q";

export const supabaseCompras = createClient(
  supabaseComprasUrl,
  supabaseComprasAnonKey,
);

// Client for Equipos Database
const supabaseEquiposUrl =
  import.meta.env.VITE_SUPABASE_EQUIPOS_URL ||
  "https://zirlaiyndcroxlvulsve.supabase.co";
const supabaseEquiposAnonKey =
  import.meta.env.VITE_SUPABASE_EQUIPOS_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcmxhaXluZGNyb3hsdnVsc3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDY3NzMsImV4cCI6MjA5Mjk4Mjc3M30.qvZEmnITEBqyb8ME971FGVedg_IYyhAiFvf5aw-mszQ";

export const supabaseEquipos = createClient(
  supabaseEquiposUrl,
  supabaseEquiposAnonKey,
);

// Client for Task Tracking Database
const supabaseRastreoTareasUrl =
  import.meta.env.VITE_SUPABASE_RASTREO_TAREAS_URL ||
  "https://xzywyxuumnykgqpcvpii.supabase.co";
const supabaseRastreoTareasAnonKey =
  import.meta.env.VITE_SUPABASE_RASTREO_TAREAS_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXd5eHV1bW55a2dxcGN2cGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTIwNjYsImV4cCI6MjA5OTI2ODA2Nn0.o0y6rRoxhYQ5whU_ZAQ2yGATqGnH7Km2d5E4uzloqfQ";

export const supabaseRastreoTareas = createClient(
  supabaseRastreoTareasUrl,
  supabaseRastreoTareasAnonKey,
);
