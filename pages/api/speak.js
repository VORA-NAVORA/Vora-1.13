export const config = {
    runtime: 'edge',
  }
  
  export default async function handler(req) {
    const { text } = await req.json()
  
    if (!process.env.ELEVENLABS_API_KEY) {
      return new Response('Missing ElevenLabs API Key', { status: 500 })
    }
  
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL/stream', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }),
    })
  
    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })
  }