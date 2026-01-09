import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

// 直接在代码中配置 FAL Key（不依赖环境变量）
const FAL_KEY = 'fe7aa0cd-770b-4637-ab05-523a332169b4:dca9c9ff8f073a4c33704236d8942faa'
const FAL_VIDEO_API_ENDPOINT = 'https://fal.run/fal-ai/flux-schnell' // 使用便宜的快速视频模型

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

    // 将宽高比转换为 fal.ai 支持的格式
    let imageSize = 'landscape_16_9' // 默认16:9横向
    if (aspectRatio === '1:1') {
      imageSize = 'square_hd'
    } else if (aspectRatio === '16:9') {
      imageSize = 'landscape_16_9'
    } else if (aspectRatio === '9:16') {
      imageSize = 'portrait_16_9'
    } else if (aspectRatio === '4:3') {
      imageSize = 'landscape_4_3'
    }

    const requestBody = {
      prompt: prompt.trim(),
      image_size: imageSize,
      num_frames: 25, // 约1秒视频
      num_inference_steps: 6, // 快速模式，降低成本
    }

    console.log('Sending request to fal.ai for video generation:')
    console.log('Endpoint:', FAL_VIDEO_API_ENDPOINT)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    // 使用 fal.ai API 生成视频，增加超时时间（视频生成需要更长时间）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 300秒超时（5分钟）

    try {
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

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Fal.ai API error:', response.status, errorData)
        return NextResponse.json(
          { error: `Failed to generate video (${response.status}): ${errorData}` },
          { status: response.status }
        )
      }

      const result = await response.json()
      console.log('Fal.ai video response:', JSON.stringify(result, null, 2))
      
      // 提取视频URL - flux-schnell 返回格式可能是 { video: { url: ... } } 或 { video_url: ... } 或 { url: ... }
      const videoUrl = result.video?.url || result.video_url || result.url || null
      
      if (!videoUrl) {
        console.error('No video URL in response:', JSON.stringify(result, null, 2))
        return NextResponse.json(
          { error: 'Failed to get video URL from response. Response: ' + JSON.stringify(result) },
          { status: 500 }
        )
      }
      
      // 记录API调用
      await logApiCall(
        userId,
        stage,
        '/api/generate-video (Fal.ai flux-schnell)',
        { prompt, aspect_ratio: aspectRatio },
        { videoUrl, description: result.description }
      )
      
      return NextResponse.json({ 
        videoUrl,
        imageUrl: videoUrl, // 保持向后兼容，返回imageUrl字段
        description: result.description || ''
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Video generation timeout. Please try again.' },
          { status: 504 }
        )
      }
      throw fetchError
    }

  } catch (error) {
    console.error('Error generating video:', error)
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    )
  }
}

