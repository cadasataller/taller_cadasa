import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cnspbiftiwvfxkdzvpdb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuc3BiaWZ0aXd2ZnhrZHp2cGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzk4MzQsImV4cCI6MjA4OTYxNTgzNH0._Ysvx1wD2zi-qxX8cgcGpCnFAG_QuOCDorUhOclw-Ec'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for the Inspections/Ratings Database
const supabaseRatingsUrl = import.meta.env.VITE_SUPABASE_RATINGS_URL || 'https://ktkehnqzwulxujuogmbp.supabase.co'
const supabaseRatingsAnonKey = import.meta.env.VITE_SUPABASE_RATINGS_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0a2VobnF6d3VseHVqdW9nbWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDQ1OTYsImV4cCI6MjA5MjAyMDU5Nn0.3KZr9HOVvqDHfdbBLeXsSS3a43zVNOmSP7YeGbG8XpE'

export const supabaseRatings = createClient(supabaseRatingsUrl, supabaseRatingsAnonKey)
