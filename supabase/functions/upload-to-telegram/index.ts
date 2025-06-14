// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import { Bot } from "https://deno.land/x/grammy@v1.20.3/mod.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('VITE_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('VITE_PUBLIC_SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const subject = formData.get('subject') as string
    const course_code = formData.get('course_code') as string
    const major = formData.get('major') as string
    const uploader_name = formData.get('uploader_name') as string

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const bot = new Bot(Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '')

    try {
      // Get the file as a Blob
      const fileBlob = file as Blob & { name?: string }
      const arrayBuffer = await fileBlob.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const message = await bot.api.sendDocument(
        Deno.env.get('TELEGRAM_CHANNEL_ID') ?? '',
        buffer,
        {
          filename: fileBlob.name || 'document.pdf',
          caption: `Title: ${title}\nDescription: ${description}\nSubject: ${subject}\nCourse Code: ${course_code}\nMajor: ${major}\nUploaded by: ${uploader_name}`,
        }
      )

      if (!message.document?.file_id) {
        return new Response(
          JSON.stringify({ error: 'Failed to get file ID from Telegram' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          telegram_message_id: message.message_id,
          file_id: message.document.file_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } catch (error) {
      console.error('Telegram upload error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upload file to Telegram: ' + (error instanceof Error ? error.message : 'Unknown error')
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
  } catch (error) {
    console.error('General error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 