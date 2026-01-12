import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

const FAL_KEY = 'fe7aa0cd-770b-4637-ab05-523a332169b4:dca9c9ff8f073a4c33704236d8942faa'
const FAL_IMAGE_API_ENDPOINT = 'https://fal.run/fal-ai/nano-banana'
const KLING_VIDEO_API_ENDPOINT = 'https://fal.run/fal-ai/kling-video/v2.6/pro/image-to-video'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const story = body.story // 学生写的故事
    const character = body.character
    const plot = body.plot
    const userId = body.user_id
    const duration = body.duration || '10' // 5秒或10秒，默认5秒

    console.log('Received story video generation request')
    console.log('Story length:', story?.length)
    console.log('Duration:', duration)

    if (!story || typeof story !== 'string' || story.trim() === '') {
      return NextResponse.json(
        { error: 'Story cannot be empty' },
        { status: 400 }
      )
    }

    // 第一步：根据故事生成图片
    let imageUrl = ''
    try {
      // 构建图片提示词，基于故事内容
      const speciesInfo = character?.species 
        ? (character.species === "Boy" || character.species === "Girl" 
          ? `a young ${character.species.toLowerCase()}` 
          : `a ${character.species.toLowerCase()}`)
        : 'a character'
      
      // 从故事中提取关键场景（取前200个字符作为描述）
      const storyPreview = story.substring(0, 200).replace(/\n/g, ' ').trim()
      const imagePrompt = `A charming illustration for a children's story: ${speciesInfo} named ${character?.name || 'a character'} in ${plot?.setting || 'a setting'}. ${storyPreview}. Colorful, friendly, and suitable for children.`

      console.log('Generating image for video...')
      console.log('Image prompt:', imagePrompt)

      const imageController = new AbortController()
      const imageTimeoutId = setTimeout(() => imageController.abort(), 120000) // 120秒超时

      try {
        const imageRequestBody = {
          prompt: imagePrompt,
          num_images: 1,
          output_format: 'jpeg',
          aspect_ratio: '16:9',
          sync_mode: true,
        }

        const imageResponse = await fetch(FAL_IMAGE_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${FAL_KEY}`,
          },
          body: JSON.stringify(imageRequestBody),
          signal: imageController.signal,
        })

        clearTimeout(imageTimeoutId)

        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          imageUrl = imageData.images?.[0]?.url || imageData.image?.url || imageData.url || ''
          console.log('Image generated successfully:', imageUrl)
        } else {
          const errorText = await imageResponse.text()
          console.error('Image generation failed:', imageResponse.status, errorText)
          return NextResponse.json(
            { error: `Failed to generate image: ${errorText.substring(0, 200)}` },
            { status: imageResponse.status }
          )
        }
      } catch (imageError: any) {
        clearTimeout(imageTimeoutId)
        if (imageError.name === 'AbortError') {
          console.error('Image generation timeout')
          return NextResponse.json(
            { error: 'Image generation timeout' },
            { status: 504 }
          )
        }
        throw imageError
      }
    } catch (imageGenError) {
      console.error('Error generating image:', imageGenError)
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to get image URL' },
        { status: 500 }
      )
    }

    // 第二步：使用图片生成视频（Kling Video v2.6 image-to-video）
    let videoUrl = ''
    try {
      // 构建视频提示词，基于故事内容
      const videoPrompt = story.substring(0, 500).replace(/\n/g, ' ').trim()
      
      console.log('Generating video from image...')
      console.log('Video prompt:', videoPrompt)
      console.log('Start image URL:', imageUrl)

      const videoController = new AbortController()
      const videoTimeoutId = setTimeout(() => videoController.abort(), 600000) // 600秒超时（10分钟）

      try {
        const videoRequestBody = {
          prompt: videoPrompt,
          start_image_url: imageUrl,
          duration: duration, // "5" 或 "10"
          generate_audio: true, // 生成音频
          negative_prompt: "blur, distort, and low quality",
        }

        console.log('Sending request to Kling Video API...')
        console.log('Endpoint:', KLING_VIDEO_API_ENDPOINT)
        console.log('Request body:', JSON.stringify(videoRequestBody, null, 2))

        const videoResponse = await fetch(KLING_VIDEO_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${FAL_KEY}`,
          },
          body: JSON.stringify(videoRequestBody),
          signal: videoController.signal,
        })

        clearTimeout(videoTimeoutId)

        console.log('Video response status:', videoResponse.status, videoResponse.statusText)

        if (!videoResponse.ok) {
          const errorText = await videoResponse.text()
          console.error('Kling Video API error:', videoResponse.status)
          console.error('Full error response:', errorText)
          return NextResponse.json(
            { error: `Failed to generate video (${videoResponse.status}): ${errorText.substring(0, 200)}` },
            { status: videoResponse.status }
          )
        }

        const videoData = await videoResponse.json()
        console.log('Video response data:', JSON.stringify(videoData, null, 2))

        // Kling Video 返回格式：{ video: { url: "...", file_size: ..., file_name: ..., content_type: ... } }
        videoUrl = videoData.video?.url || videoData.url || null

        if (!videoUrl) {
          console.error('No video URL in response. Full response:', JSON.stringify(videoData, null, 2))
          return NextResponse.json(
            { error: 'Failed to get video URL from response' },
            { status: 500 }
          )
        }

        console.log('Video generated successfully:', videoUrl)

        // 记录API调用
        await logApiCall(
          userId,
          'review',
          '/api/generate-story-video (Kling Video v2.6)',
          { story: story.substring(0, 100), duration },
          { videoUrl, imageUrl }
        )

        return NextResponse.json({
          videoUrl,
          imageUrl, // 同时返回原始图片URL
        })
      } catch (videoError: any) {
        clearTimeout(videoTimeoutId)
        if (videoError.name === 'AbortError') {
          console.error('Video generation timeout')
          return NextResponse.json(
            { error: 'Video generation timeout. Please try again.' },
            { status: 504 }
          )
        }
        throw videoError
      }
    } catch (videoGenError) {
      console.error('Error generating video:', videoGenError)
      return NextResponse.json(
        { error: 'Failed to generate video' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in generate-story-video:', error)
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    )
  }
}