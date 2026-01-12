import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

// ============================================
// Book Selection 专用配置 - 书籍选择机器人
// ============================================
// 这个路由必须使用 app-EnHszR7uaCnOh1EWb7INdemd (书籍选择机器人)
// 完全独立，不影响其他机器人

// 使用环境变量中的 DIFY_API_KEY（这是真正的 API Key）
const DIFY_API_KEY = process.env.DIFY_API_KEY || ''

// 硬编码 APP_ID，确保不会被错误覆盖
const DIFY_BOOK_SELECTION_APP_ID = 'app-EnHszR7uaCnOh1EWb7INdemd' as const
const DIFY_BASE_URL = 'https://api.dify.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const { reviewType, bookTitle, conversation, conversation_id, user_id } = await request.json()

    if (!reviewType || !bookTitle) {
      return NextResponse.json(
        { error: 'Review type and book title are required' },
        { status: 400 }
      )
    }

    if (!DIFY_API_KEY) {
      console.error('DIFY_API_KEY not configured')
      return NextResponse.json(
        { error: 'DIFY_API_KEY not configured' },
        { status: 500 }
      )
    }

    // 构建简洁的查询消息 - 根据用户设定的AI角色
    const reviewTypeNames: Record<string, string> = {
      recommendation: "Recommendation Review",
      critical: "Critical Review",
      literary: "Literary Review"
    }
    
    const reviewTypeName = reviewTypeNames[reviewType] || reviewType
    
    const queryMessage = `You are a judge evaluating whether a book is suitable for a ${reviewTypeName} written by an elementary student. Speak like a friendly, cute elementary teacher with a warm and encouraging tone. Use emojis appropriately. Keep your response to about 30-40 words (a bit longer to be more friendly and cute).

The book: "${bookTitle}"
Review type: ${reviewTypeName}

Your task:
1. Judge if this book is suitable for a ${reviewTypeName}
2. If NOT suitable, use a cute, friendly tone to explain why and suggest a similar book. CRITICAL: Do NOT use any phrases like "Let's start writing", "Let's begin writing", "Let's write", or "Let's get started" in your response.
3. If suitable, you MUST end your response with one of these exact phrases: "Let's start writing", "Let's begin writing", "Let's start writing now", "Let's begin writing now", "Ready to start writing", "Let's write", or "Let's get started". Use a cute, encouraging tone with emojis.

CRITICAL RULES:
- If the book is suitable: Your response MUST contain one of the phrases: "Let's start writing", "Let's begin writing", "Let's start writing now", "Let's begin writing now", "Ready to start writing", "Let's write", or "Let's get started"
- If the book is NOT suitable: Your response MUST NOT contain any of these phrases

Be warm, cute, and encouraging. Use English.`

    // Dify API configuration
    const url = `${DIFY_BASE_URL}/chat-messages`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`,
    }
    
    // ============================================
    // 强制使用正确的 APP_ID - 书籍选择机器人
    // ============================================
    const appId: string = DIFY_BOOK_SELECTION_APP_ID
    
    // 验证 APP_ID 是否正确
    if (appId !== 'app-EnHszR7uaCnOh1EWb7INdemd') {
      console.error('CRITICAL ERROR: APP_ID is incorrect!', appId)
      return NextResponse.json(
        { error: 'Internal configuration error: Wrong APP_ID' },
        { status: 500 }
      )
    }
    
    // 为 book-selection 使用完全独立的 user_id，避免与其他功能混淆
    // 使用时间戳确保每次都是新的对话上下文
    const timestamp = Date.now()
    const bookSelectionUserId = `book-selection-${user_id || 'default-user'}-${reviewType}-${timestamp}`
    
    // 构建请求体 - 强制使用正确的 app_id，完全隔离
    const requestBody = {
      inputs: {
        review_type: reviewType,
        book_title: bookTitle,
      },
      query: queryMessage,
      response_mode: 'blocking' as const,
      conversation_id: undefined, // 强制不使用 conversation_id，每次创建新对话
      user: bookSelectionUserId, // 使用唯一的user_id，确保隔离
      app_id: appId, // 强制使用 app-EnHszR7uaCnOh1EWb7INdemd
    }

    // ============================================
    // 详细日志和验证
    // ============================================
    console.log('=== Dify Book Selection API Request ===')
    console.log('ROUTE: /api/dify-book-selection')
    console.log('APP_ID (书籍选择机器人):', appId)
    console.log('APP_ID 验证:', appId === 'app-EnHszR7uaCnOh1EWb7INdemd' ? '✓ 正确' : '✗ 错误！')
    console.log('User ID:', bookSelectionUserId)
    console.log('URL:', url)
    console.log('Request Body app_id:', requestBody.app_id)
    console.log('Full Request Body:', JSON.stringify(requestBody, null, 2))
    console.log('Review Type:', reviewType)
    console.log('Book Title:', bookTitle)
    console.log('========================================')

    // 多重验证：确保 app_id 正确
    if (requestBody.app_id !== 'app-EnHszR7uaCnOh1EWb7INdemd') {
      console.error('CRITICAL ERROR: APP_ID mismatch in requestBody!', {
        expected: 'app-EnHszR7uaCnOh1EWb7INdemd',
        actual: requestBody.app_id,
        appId: appId,
        DIFY_BOOK_SELECTION_APP_ID: DIFY_BOOK_SELECTION_APP_ID
      })
      return NextResponse.json(
        { error: 'Internal error: APP_ID configuration mismatch. Expected app-EnHszR7uaCnOh1EWb7INdemd' },
        { status: 500 }
      )
    }
    
    console.log('Sending request to Dify API...')
    const requestBodyString = JSON.stringify(requestBody)
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBodyString,
    })
    
    console.log('=== Dify API Response ===')
    console.log('Status:', response.status, response.statusText)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    console.log('========================')

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error:', errorText)
      return NextResponse.json(
        { error: `Dify API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    const message = data.answer || data.message || ''

    // 记录API调用
    await logApiCall(
      bookSelectionUserId,
      'bookSelection',
      '/api/dify-book-selection',
      { reviewType, bookTitle, conversation_id: 'new-conversation' },
      { answer: message, conversation_id: data.conversation_id, message_id: data.id }
    )

    return NextResponse.json({
      message,
      conversationId: data.conversation_id,
      messageId: data.id,
    })
  } catch (error) {
    console.error('Book selection API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

