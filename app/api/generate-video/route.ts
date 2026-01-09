import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

// 直接在代码中配置 FAL Key（不依赖环境变量）
const FAL_KEY = 'fe7aa0cd-770b-4637-ab05-523a332169b4:dca9c9ff8f073a4c33704236d8942faa'
const FAL_VIDEO_API_ENDPOINT = 'https://fal.run/fal-ai/hunyuan-video-v1.5/text-to-video' // 使用 Hunyuan Video V1.5 模型

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prompt = body.prompt
    const aspectRatio = body.aspect_ratio || '16:9' // 允许从请求中指定宽高比，默认16:9
    const userId = body.user_id // 从请求中获取user_id
    const stage = body.stage || 'character' // 从请求中获取stage，默认为character

    console.log('Received video prompt:', prompt)
    console.log('Prompt type:', typeof prompt)
    console.log('Prompt length:', prompt?.length)
    console.log('Aspect ratio:', aspectRatio)

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error('Invalid prompt:', prompt)
      return NextResponse.json(
        { error: 'Prompt cannot be empty' },
        { status: 400 }
      )
    }

    // FAL_KEY 已在代码中硬编码，无需检查

    // Hunyuan Video V1.5 支持的宽高比：16:9 或 9:16
    const hunyuanAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9'

    const requestBody = {
      prompt: prompt.trim(),
      aspect_ratio: hunyuanAspectRatio, // 16:9 或 9:16
      resolution: '480p', // 默认分辨率
      num_frames: 121, // 默认帧数（约4秒视频，可减少以降低成本）
      num_inference_steps: 28, // 默认推理步数
      enable_prompt_expansion: true, // 启用提示词扩展
    }

    console.log('Sending request to fal.ai for video generation:')
    console.log('Endpoint:', FAL_VIDEO_API_ENDPOINT)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    // 使用 fal.ai API 生成视频
    // 注意：Hunyuan Video 可能需要较长时间，使用较长的超时时间
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 600000) // 600秒超时（10分钟）

    try {
      console.log('=== Starting Hunyuan Video Generation ===')
      console.log('Endpoint:', FAL_VIDEO_API_ENDPOINT)
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      console.log('FAL_KEY configured:', !!FAL_KEY)
      console.log('FAL_KEY (first 20 chars):', FAL_KEY.substring(0, 20) + '...')
      
      const response = await fetch(FAL_VIDEO_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${FAL_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('Response status:', response.status, response.statusText)
      console.log('Response ok:', response.ok)
      
      const responseText = await response.text()
      console.log('Response text (first 500 chars):', responseText.substring(0, 500))

      if (!response.ok) {
        console.error('Fal.ai API error:', response.status)
        console.error('Full error response:', responseText)
        return NextResponse.json(
          { error: `Failed to generate video (${response.status}): ${responseText.substring(0, 200)}` },
          { status: response.status }
        )
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        console.error('Response text:', responseText)
        return NextResponse.json(
          { error: 'Invalid JSON response from fal.ai' },
          { status: 500 }
        )
      }

      console.log('Fal.ai video response:', JSON.stringify(result, null, 2))
      
      // Hunyuan Video V1.5 返回格式：{ video: { url: "..." }, seed: ... }
      const videoUrl = result.video?.url || result.video_url || result.url || null
      console.log('Video URL extracted:', videoUrl)
      
      if (!videoUrl) {
        console.error('No video URL in response. Full response:', JSON.stringify(result, null, 2))
        return NextResponse.json(
          { error: 'Failed to get video URL from response. Response: ' + JSON.stringify(result) },
          { status: 500 }
        )
      }
      
      // 记录API调用
      await logApiCall(
        userId,
        stage,
        '/api/generate-video (Fal.ai hunyuan-video-v1.5)',
        { prompt, aspect_ratio: hunyuanAspectRatio },
        { videoUrl, seed: result.seed }
      )
      
      console.log('Video generation successful! URL:', videoUrl)
      
      return NextResponse.json({ 
        videoUrl,
        imageUrl: videoUrl, // 保持向后兼容，返回imageUrl字段
        description: result.description || ''
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout')
        return NextResponse.json(
          { error: 'Video generation timeout. Please try again.' },
          { status: 504 }
        )
      }
      console.error('Fetch error:', fetchError)
      console.error('Error message:', fetchError.message)
      console.error('Error stack:', fetchError.stack)
      return NextResponse.json(
        { error: `Video generation error: ${fetchError.message}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error generating video:', error)
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    )
  }
}

