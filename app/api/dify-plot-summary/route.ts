import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

// 使用环境变量中的 DIFY_API_KEY（这是真正的 API Key）
const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DIFY_PLOT_SUMMARY_APP_ID = 'app-HgMPyyxKQNPk2ZZP6znDalkp'
const DIFY_BASE_URL = 'https://api.dify.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const { conversation_history, conversation_id, user_id } = await request.json()

    if (!DIFY_API_KEY) {
      return NextResponse.json(
        { error: 'DIFY_API_KEY not configured' },
        { status: 500 }
      )
    }

    // 只使用学生的回答，忽略AI的回答（AI的回答是问句还带有六个单词，不是学生的想法）
    const studentMessages = conversation_history
      .filter((msg: { role: string; content: string }) => msg.role === 'user')
      .map((msg: { role: string; content: string }) => msg.content)
    
    // 构建对话历史文本（只包含学生的回答）
    const conversationText = studentMessages.join('\n\n')

    if (!conversationText || conversationText.trim() === '') {
      return NextResponse.json(
        { error: 'No conversation history provided' },
        { status: 400 }
      )
    }

    console.log('Plot Summary - Conversation history:', conversationText)
    console.log('Plot Summary - Conversation history length:', conversationText.length)

    // Dify API configuration - 直接将对话历史传递给总结机器人
    const url = `${DIFY_BASE_URL}/chat-messages`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`,
    }
    
    // 总结机器人的设定：只分析学生的回答，提取Setting、Conflict、Goal
    // 确保在10轮对话内完成总结
    const studentMessageCount = studentMessages.length
    const MAX_ROUNDS = 10 // 最大对话轮数
    
    // 根据对话轮数决定提取哪些字段
    let fieldsToExtract: string[] = []
    let isForceComplete = false // 是否强制完成
    
    if (studentMessageCount >= 1) {
      // 第一轮后可以提取 Setting
      fieldsToExtract.push('setting')
    }
    
    if (studentMessageCount >= 2) {
      // 第二轮后可以提取 Conflict
      fieldsToExtract.push('conflict')
    }
    
    if (studentMessageCount >= 3) {
      // 第三轮后可以提取 Goal
      fieldsToExtract.push('goal')
    }
    
    // 如果达到10轮，强制完成所有字段的提取
    if (studentMessageCount >= MAX_ROUNDS) {
      isForceComplete = true
      // 确保所有字段都被提取
      if (!fieldsToExtract.includes('setting')) fieldsToExtract.push('setting')
      if (!fieldsToExtract.includes('conflict')) fieldsToExtract.push('conflict')
      if (!fieldsToExtract.includes('goal')) fieldsToExtract.push('goal')
    }
    
    // 至少需要1轮对话才开始总结
    if (studentMessageCount < 1 || fieldsToExtract.length === 0) {
      return NextResponse.json({
        summary: '',
        conversation_id: conversation_id,
        needsMoreConversation: true,
      })
    }
    
    // 构建提示词
    const forceCompleteMessage = isForceComplete 
      ? `\n\nCRITICAL: The student has had ${studentMessageCount} exchanges (reached the maximum of ${MAX_ROUNDS} rounds). You MUST extract all three fields (setting, conflict, goal) NOW, even if some information is limited. Use "unknown" only if absolutely no information is available. You MUST output "done" at the end.`
      : ''
    
    const queryMessage = `You are analyzing a student's plot brainstorming conversation. The student has had ${studentMessageCount} exchanges with the AI.

IMPORTANT: Extract the following fields:
${fieldsToExtract.map(field => `- ${field.charAt(0).toUpperCase() + field.slice(1)}: Extract if student has discussed it, otherwise use "unknown"`).join('\n')}

Student's conversation:
${conversationText}

REQUIREMENTS:
1. Setting: Extract location/setting. Can be a single word or short phrase.
2. Conflict: Extract the problem/challenge as a SHORT SENTENCE (2-5 words), not just one word. Example: "save the library" or "find the treasure", NOT just "conflict" or "problem".
3. Goal: Extract what the character wants as a SHORT SENTENCE (2-5 words), not just one word. Example: "become a wizard" or "help friends", NOT just "goal" or "win".

IMPORTANT:
- Conflict and Goal MUST be short sentences (2-5 words), not single words
- If student hasn't discussed enough, use "unknown"
- Be generous - extract even if brief, but make it a phrase, not a single word
${forceCompleteMessage}

Format your response exactly as:
setting: [setting or unknown]
conflict: [short sentence or unknown]
goal: [short sentence or unknown]
done

You MUST output "done" at the end when you have extracted all requested fields (even if some are "unknown").`
    
    const requestBody: any = {
      inputs: {
        conversation: conversationText, // 对话历史作为输入变量（如果Dify机器人需要）
      },
      query: queryMessage, // 查询消息包含完整对话，确保AI能看到
      response_mode: 'blocking',
      conversation_id: conversation_id || undefined, // 使用conversation_id保持总结机器人的对话上下文
      user: user_id || 'default-user',
      app_id: DIFY_PLOT_SUMMARY_APP_ID, // 指定使用正确的机器人
    }
    
    console.log('Plot Summary API Request:', JSON.stringify({
      url,
      app_id: DIFY_PLOT_SUMMARY_APP_ID,
      has_conversation_id: !!conversation_id,
      conversation_length: conversationText.length,
    }, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify Plot Summary API error:', errorText)
      return NextResponse.json(
        { error: `Dify API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Plot Summary - AI Response:', data.answer)
    
    // 记录API调用
    await logApiCall(
      user_id,
      'plot',
      '/api/dify-plot-summary',
      { conversation_history, conversation_id },
      { summary: data.answer, conversation_id: data.conversation_id }
    )
    
    return NextResponse.json({
      summary: data.answer || '',
      conversation_id: data.conversation_id, // 返回conversation_id，以便后续调用使用
    })
  } catch (error) {
    console.error('Error calling Dify Plot Summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

