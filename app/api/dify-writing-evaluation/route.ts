import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DIFY_WRITING_EVAL_APP_ID = 'app-wLT4t7SzLiDXIkTyAu1jfwOK' // Luna Writing Evaluation
const DIFY_BASE_URL = 'https://api.dify.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const { text, character, plot, structure, current_section, user_id } = await request.json()

    if (!DIFY_API_KEY) {
      return NextResponse.json(
        { error: 'DIFY_API_KEY not configured' },
        { status: 500 }
      )
    }
    
    console.log('Luna Writing Evaluation API - Using app ID:', DIFY_WRITING_EVAL_APP_ID)

    // 构建上下文信息
    const characterInfo = [
      `Character name: ${character?.name || 'Unknown'}`,
      character?.age ? `Age: ${character.age} years old` : '',
      character?.traits && character.traits.length > 0 ? `Traits: ${character.traits.join(', ')}` : '',
      character?.description ? `Description: ${character.description}` : '',
    ].filter(Boolean).join('\n')

    const plotInfo = [
      `Setting: ${plot?.setting || 'Unknown'}`,
      `Conflict: ${plot?.conflict || 'Unknown'}`,
      `Goal: ${plot?.goal || 'Unknown'}`,
    ].filter(Boolean).join('\n')

    const structureInfo = structure?.outline?.join(' -> ') || 'Unknown'
    const currentSectionName = structure?.outline?.[current_section] || 'Unknown'

    // 构建提示词
    const prompt = `You are an elementary school English writing teacher. You evaluate students' writing based on their character, plot, and story structure.

Character Information:
${characterInfo}

Plot Information:
${plotInfo}

Story Structure: ${structure?.type || 'Unknown'}
Structure Steps: ${structureInfo}
Current Section Being Written: ${currentSectionName}

Student's Writing for Current Section:
${text || '(No text yet)'}

Please evaluate the student's writing for the current section. Provide constructive feedback and suggestions. Each story structure has multiple sections,最后不要输出六个单词了，检查学生的文章，如果学生只是输入一些乱码，不要输出done!只有学生写的够完整够好或者字数大于10，在回复最后另起一段回复一个“done”，严格遵守.`

    const url = `${DIFY_BASE_URL}/chat-messages`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`,
    }

    const requestBody: any = {
      inputs: {
        character_info: JSON.stringify(character || {}),
        plot_info: JSON.stringify(plot || {}),
        structure_info: JSON.stringify(structure || {}),
        current_text: text || '',
        current_section: currentSectionName,
      },
      query: prompt,
      response_mode: 'blocking',
      user: user_id || 'default-user',
      app_id: DIFY_WRITING_EVAL_APP_ID, // 指定使用正确的机器人
    }

    console.log('Luna API Request:', JSON.stringify({
      url,
      app_id: DIFY_WRITING_EVAL_APP_ID,
      user: user_id,
      current_section: currentSectionName,
    }, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify Writing Evaluation API error:', errorText)
      return NextResponse.json(
        { error: `Dify API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Luna API Response:', JSON.stringify({
      has_answer: !!data.answer,
      answer_length: data.answer?.length || 0,
      conversation_id: data.conversation_id,
    }, null, 2))
    
    const evaluation = data.answer || ''
    
    // 检查是否包含"done"（不区分大小写）
    const hasDone = /\bdone\b/i.test(evaluation)
    
    // 如果包含"done"，移除它
    const cleanEvaluation = evaluation.replace(/\bdone\b/gi, '').trim()

    // 记录API调用
    await logApiCall(
      user_id,
      'writing',
      '/api/dify-writing-evaluation',
      { text, character, plot, structure, current_section },
      { evaluation: cleanEvaluation, done: hasDone }
    )

    return NextResponse.json({
      evaluation: cleanEvaluation,
      done: hasDone,
    })
  } catch (error) {
    console.error('Error calling Dify Writing Evaluation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

