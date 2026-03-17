import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://usyegtcmkbfogqkrykma.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzeWVndGNta2Jmb2dxa3J5a21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODE4NTYsImV4cCI6MjA4NDU1Nzg1Nn0.T6KCxqzzx10FMxQHoAtsioqlEtkZO1QaRkUnNcgA3Rs'

export const supabase = createClient(supabaseUrl, supabaseKey)
