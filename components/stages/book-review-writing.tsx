"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import StageHeader from "@/components/stage-header"

interface BookReviewWritingProps {
  reviewType: "recommendation" | "critical" | "literary"
  bookTitle: string
  structure: {
    type: "recommendation" | "critical" | "literary"
    outline: string[]
    originalOutline?: string[]
    shuffledToOriginal?: number[]
  }
  initialCoverUrl?: string
  initialBookSummary?: string
  onReviewWrite: (review: string, bookCoverUrl?: string) => void
  onBack: () => void
  userId?: string
}

// Enhanced word count function that handles both English and Chinese
const countWords = (text: string): number => {
  if (!text || !text.trim()) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishText = text.replace(/[\u4e00-\u9fff]/g, ' ').trim()
  const englishWords = englishText ? englishText.split(/\s+/).filter(word => word.length > 0).length : 0
  return chineseChars + englishWords
}

// 检测单词数量（英文单词）
const countWordsForAI = (text: string): number => {
  if (!text || !text.trim()) return 0
  // 移除中文，只计算英文单词
  const englishText = text.replace(/[\u4e00-\u9fff]/g, ' ').trim()
  const words = englishText ? englishText.split(/\s+/).filter(word => word.length > 0) : []
  return words.length
}

export default function BookReviewWriting({ 
  reviewType, 
  bookTitle, 
  structure,
  initialCoverUrl = undefined,
  initialBookSummary = undefined,
  onReviewWrite, 
  onBack, 
  userId 
}: BookReviewWritingProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [sectionTexts, setSectionTexts] = useState<Record<number, string>>({})
  const [aiEvaluation, setAiEvaluation] = useState("")
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false)
  const [sectionDone, setSectionDone] = useState<Record<number, boolean>>({})
  const [bookCoverUrl, setBookCoverUrl] = useState<string | null>(initialCoverUrl || null)
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [showBookSummary, setShowBookSummary] = useState(false)
  const [bookSummary, setBookSummary] = useState(initialBookSummary || "")
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})

  // 如果有原始顺序，使用原始顺序显示；否则使用打乱后的顺序
  // 但实际写作时仍使用打乱后的顺序（用于测试）
  const originalSections = structure?.originalOutline || structure?.outline || []
  const shuffledSections = structure?.outline || []
  
  // 用于显示的sections（按正常顺序）
  const displaySections = originalSections.length > 0 ? originalSections : shuffledSections
  
  // 用于实际写作的sections（保持打乱顺序，用于测试）
  const sections = shuffledSections
  
  // 创建从显示索引到实际写作索引的映射
  const displayToShuffledMap: number[] = displaySections.map((displaySection) => {
    return shuffledSections.findIndex(shuffledSection => shuffledSection === displaySection)
  })
  
  // 创建从实际写作索引到显示索引的映射
  const shuffledToDisplayMap: number[] = shuffledSections.map((shuffledSection) => {
    return displaySections.findIndex(displaySection => displaySection === shuffledSection)
  })
  
  // 当前显示索引对应的实际写作索引
  const currentDisplayIndex = shuffledToDisplayMap[currentSection] >= 0 ? shuffledToDisplayMap[currentSection] : currentSection
  const currentSectionText = sectionTexts[currentSection] || ""
  
  // 调试：打印sections顺序
  useEffect(() => {
    if (sections.length > 0) {
      console.log('=== BookReviewWriting Sections ===')
      console.log('Sections displayed:', sections)
      console.log('==================================')
    }
  }, [sections])

  // 书封面从loading页面传入，直接使用
  useEffect(() => {
    if (initialCoverUrl && !bookCoverUrl) {
      setBookCoverUrl(initialCoverUrl)
    }
  }, [initialCoverUrl, bookCoverUrl])

  // 书籍摘要从loading页面传入，确保同步
  useEffect(() => {
    if (initialBookSummary && initialBookSummary !== bookSummary) {
      setBookSummary(initialBookSummary)
    }
  }, [initialBookSummary])

  // 如果没有初始摘要，尝试获取（备用方案）
  useEffect(() => {
    if (!bookSummary && bookTitle && !isLoadingSummary) {
      setIsLoadingSummary(true)
      fetch("/api/dify-book-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookTitle, user_id: userId || 'student' }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.message && !data.error) {
            setBookSummary(data.message)
          }
        })
        .catch(err => {
          console.error("Error fetching book summary:", err)
        })
        .finally(() => {
          setIsLoadingSummary(false)
        })
    }
  }, [bookTitle, bookSummary, isLoadingSummary, userId])


  // Debounced AI evaluation fetching (完全参考story部分的实现)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (currentSectionText.trim().length > 10) {
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoadingEvaluation(true)
        try {
          const response = await fetch("/api/dify-book-writing-aid", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: currentSectionText,
              reviewType,
              bookTitle,
              structure,
              currentSection,
              user_id: userId || "default-user",
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("AI suggestion API error:", response.status, errorText)
            throw new Error("Failed to get AI suggestion")
          }

          const data = await response.json()
          const message = data.message || data.answer || ""
          setAiEvaluation(message)

          // 检查是否可以移动到下一部分（当AI说"you can move to the next part"时）
          const canMoveToNext = message.toLowerCase().includes("you can move to the next part") || 
                                message.toLowerCase().includes("move to the next part") ||
                                message.toLowerCase().includes("move to the next section") ||
                                message.toLowerCase().includes("ready to move to the next part")
          
          if (canMoveToNext) {
            console.log('Luna says student can move to next part! ✅')
            setSectionDone(prev => {
              const newDone = { ...prev, [currentSection]: true }
              return newDone
            })
          } else {
            setSectionDone(prev => ({ ...prev, [currentSection]: false }))
          }
        } catch (error) {
          console.error("Error fetching AI suggestion:", error)
        } finally {
          setIsLoadingEvaluation(false)
        }
      }, 2000) // 延迟2秒，和story部分完全一致
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [currentSectionText, currentSection, reviewType, bookTitle, structure, userId])

  const wordCount = useMemo(() => {
    const allText = Object.values(sectionTexts).join(' ')
    return countWords(allText)
  }, [sectionTexts])

  const currentSectionWordCount = useMemo(() => {
    return countWords(currentSectionText)
  }, [currentSectionText])

  const handleSectionTextChange = (sectionIndex: number, text: string) => {
    setSectionTexts(prev => ({
      ...prev,
      [sectionIndex]: text
    }))

    if (text.trim().toLowerCase() === "test") {
      setSectionDone(prev => ({
        ...prev,
        [sectionIndex]: true
      }))
      setAiEvaluation("Test mode: Section marked as complete! ✓")
    }
  }

  const handleSectionChange = (index: number) => {
    if (index === currentSection) return

    if (index > currentSection) {
      for (let i = currentSection; i < index; i++) {
        if (!sectionDone[i]) {
          toast.error(`Please complete "${sections[i]}" section before moving to the next one`)
          return
        }
      }
    }

    setCurrentSection(index)
    setAiEvaluation("") // 清空评价，重新评估

    // 滚动到对应的 section 按钮
    setTimeout(() => {
      const sectionButton = document.querySelector(`[data-section-index="${index}"]`) as HTMLElement
      if (sectionButton) {
        sectionButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
      
      const textarea = textareaRefs.current[index]
      if (textarea) {
        textarea.focus()
      }
    }, 100)
  }

  const handleGetBookSummary = () => {
    // 如果已经有书摘要，直接显示
    if (bookSummary) {
      setShowBookSummary(true)
      return
    }
    
    // 如果没有，尝试获取（这种情况不应该发生，因为应该在loading页面生成）
    setIsLoadingSummary(true)
    setShowBookSummary(true)
    
    fetch("/api/dify-book-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookTitle,
        user_id: userId || "default-user",
      }),
    })
      .then(async response => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }))
          throw new Error(errorData.error || errorData.details || "Failed to get book summary")
        }
        return response.json()
      })
      .then(data => {
        if (data.error) {
          toast.error(data.error || "Failed to get book summary")
          return
        }
        setBookSummary(data.message || "")
      })
      .catch(error => {
        console.error("Error fetching book summary:", error)
        toast.error(error.message || "Failed to get book summary")
      })
      .finally(() => {
        setIsLoadingSummary(false)
      })
  }

  const handleCloseBookSummary = () => {
    setShowBookSummary(false)
  }

  const isTestMode = useMemo(() => {
    return Object.values(sectionTexts).some(text => text.trim().toLowerCase() === "test")
  }, [sectionTexts])

  const handlePublish = () => {
    const allSectionsDone = sections.every((_, index) => sectionDone[index])
    
    if (!allSectionsDone) {
      toast.error("Please complete all sections before finishing the review")
      return
    }

    // Test mode: 跳过字数检查
    if (!isTestMode && wordCount < 50) {
      toast.error("Your review needs at least 50 words")
      return
    }

    // 如果有映射关系，按原始顺序组合；否则按当前顺序
    const shuffledToOriginal = (structure as any)?.shuffledToOriginal
    let fullReview: string
    
    if (shuffledToOriginal && shuffledToOriginal.length === sections.length) {
      // 按原始顺序组合
      const originalSections = shuffledToOriginal.map((originalIndex: number) => {
        const shuffledIndex = shuffledToOriginal.indexOf(originalIndex)
        const sectionText = sectionTexts[shuffledIndex] || ""
        return { originalIndex, sectionName: sections[shuffledIndex], sectionText }
      }).sort((a, b) => a.originalIndex - b.originalIndex)
      
      fullReview = originalSections.map(item => `${item.sectionName}:\n${item.sectionText}`).join('\n\n')
    } else {
      // 没有映射关系，按当前顺序组合
      fullReview = sections.map((_, index) => {
        const sectionText = sectionTexts[index] || ""
        return `${sections[index]}:\n${sectionText}`
      }).join('\n\n')
    }

    onReviewWrite(fullReview, bookCoverUrl || undefined)
  }

  return (
    <div className="min-h-screen py-8 px-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 relative overflow-hidden" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 打开的书的界面 - 显示书介绍 */}
      {showBookSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleCloseBookSummary}>
          <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            {/* 打开的书的图片 */}
            <div className="relative bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50 rounded-3xl p-12 shadow-2xl border-4 border-amber-300" 
                 style={{
                   backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'paper\' x=\'0\' y=\'0\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23fef3c7\'/%3E%3Cpath d=\'M 0 40 L 40 0 M -10 10 L 10 -10 M 30 50 L 50 30\' stroke=\'%23fbbf24\' stroke-width=\'0.5\' opacity=\'0.3\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23paper)\'/%3E%3C/svg%3E")',
                 }}>
              <button
                onClick={handleCloseBookSummary}
                className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center text-xl font-bold shadow-lg"
              >
                ×
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-900 mb-2">{bookTitle}</h2>
                <div className="w-24 h-1 bg-amber-600 mx-auto"></div>
              </div>

              <div className="bg-white/80 rounded-xl p-8 border-2 border-amber-200 shadow-lg min-h-[400px] max-h-[600px] overflow-y-auto">
                {isLoadingSummary ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-amber-600 mb-4" />
                    <p className="text-lg text-gray-600">Loading book summary...</p>
                  </div>
                ) : (
                  <p 
                    className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap"
                    style={{
                      fontFamily: 'var(--font-patrick-hand), "Patrick Hand", "Kalam", "Comic Sans MS", cursive',
                      fontSize: '1.25rem',
                      lineHeight: '2',
                      fontWeight: '400',
                    }}
                  >
                    {bookSummary || "No summary available."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        <StageHeader stage={4} title="Write Your Review" onBack={onBack} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-8">
            <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-3xl p-8 border-4 border-purple-300 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}></div>

              <div className="relative z-10">
                <div className="mb-6">
                  <label className="block text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    Review Sections
                  </label>
                  <div className="flex gap-3 mb-6 overflow-x-auto pb-3 scrollbar-purple">
                    {sections.map((section, i) => (
                      <button
                        key={i}
                        data-section-index={i}
                        onClick={() => handleSectionChange(i)}
                        disabled={i > currentSection && !sectionDone[i - 1]}
                        className={`px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-lg transform hover:scale-105 flex-shrink-0 ${
                          currentSection === i
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white scale-105 ring-4 ring-purple-300 animate-pulse"
                            : sectionDone[i]
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-400 hover:shadow-xl"
                            : "bg-white border-2 border-purple-200 hover:border-purple-300 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {section}
                          {sectionDone[i] && <span className="text-lg animate-bounce">✓</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 rounded-xl opacity-20 blur-sm"></div>
                  <textarea
                    key={currentSection}
                    ref={(el) => {
                      textareaRefs.current[currentSection] = el
                    }}
                    placeholder={`Start writing the "${sections[currentSection]}" section here... Let your thoughts flow! 💭`}
                    value={currentSectionText}
                    onChange={(e) => handleSectionTextChange(currentSection, e.target.value)}
                    className="relative w-full h-[500px] p-6 rounded-xl border-4 border-purple-300 focus:border-pink-400 bg-white/90 text-foreground placeholder-gray-400 font-serif text-base leading-relaxed shadow-inner focus:shadow-lg transition-all duration-300 focus:ring-4 focus:ring-pink-200"
                    style={{ fontFamily: 'var(--font-comic-neue)' }}
                  />

                  {currentSectionText.length === 0 && (
                    <div className="absolute top-4 right-4 text-2xl opacity-20 animate-pulse">✨</div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 p-5 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-xl border-3 border-purple-300 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/80 px-4 py-2 rounded-lg border-2 border-purple-200">
                      <span className="text-lg font-bold text-purple-700 flex items-center gap-2">
                        <span>📊</span>
                        Section: {currentSectionWordCount} | Total: {wordCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      sectionDone[currentSection] 
                        ? "bg-green-100 border-green-400 text-green-700 animate-pulse" 
                        : "bg-yellow-50 border-yellow-300 text-yellow-700"
                    }`}>
                      <span className="text-lg font-semibold flex items-center gap-2">
                        {sectionDone[currentSection] ? (
                          <>
                            <span className="text-xl">✓</span>
                            Section Complete!
                          </>
                        ) : (
                          <>
                            <span className="animate-pulse">✍️</span>
                            Keep writing...
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePublish}
                  disabled={(!isTestMode && wordCount < 50) || !sections.every((_, index) => sectionDone[index])}
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white border-0 shadow-2xl py-6 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isTestMode ? (
                      <>
                        <span className="text-2xl">🎉</span>
                        Finish Review (Test Mode)
                      </>
                    ) : wordCount < 50 ? (
                      <>
                        <span>📝</span>
                        Finish Review ({wordCount}/50 words)
                      </>
                    ) : sections.every((_, index) => sectionDone[index]) ? (
                      <>
                        <span className="text-2xl">🎉</span>
                        Finish Review
                      </>
                    ) : (
                      <>
                        <span>⏳</span>
                        Complete All Sections ({sections.filter((_, index) => sectionDone[index]).length}/{sections.length} done)
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            {/* 书封面 */}
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-6 border-4 border-amber-300 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4 text-amber-700 flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  Book Cover
                </h3>
                {isGeneratingCover ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-amber-600 mb-4" />
                    <p className="text-sm text-gray-600">Generating book cover...</p>
                  </div>
                ) : bookCoverUrl ? (
                  <div className="relative w-full max-w-[180px] mx-auto aspect-[2/3] rounded-xl overflow-hidden border-4 border-amber-400 shadow-xl mb-4">
                    <Image
                      src={bookCoverUrl}
                      alt={`Cover of ${bookTitle}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="relative w-full max-w-[180px] mx-auto aspect-[2/3] rounded-xl bg-gray-200 flex items-center justify-center border-4 border-amber-400 shadow-xl mb-4">
                    <p className="text-gray-500 text-sm">No cover available</p>
                  </div>
                )}
                <Button
                  onClick={handleGetBookSummary}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-lg py-3 text-base font-bold rounded-xl hover:scale-105 transition-all duration-300"
                >
                  {isLoadingSummary ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "Forgot what this book is about?"
                  )}
                </Button>
              </div>
            </div>

            {/* Luna 评价卡片 */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-3xl p-6 border-4 border-purple-300 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
                  <span className="text-3xl animate-pulse">✨</span>
                  <span>
                    <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">C</span>
                    <span className="text-purple-700">agent</span>
                  </span>
                </h3>
                {isLoadingEvaluation ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                    <span className="text-sm text-gray-600 font-medium">Getting suggestions...</span>
                    <div className="mt-4 flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                ) : aiEvaluation ? (
                  <div className="bg-white/90 rounded-xl p-5 border-3 border-purple-200 shadow-lg backdrop-blur-sm">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-comic-neue)' }}>
                      {aiEvaluation}
                    </p>
                    {sectionDone[currentSection] && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 border-3 border-green-400 rounded-lg animate-pulse">
                        <p className="text-sm font-bold text-green-700 flex items-center gap-2">
                          <span className="text-lg">✓</span>
                          Great! You can move to the next section!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/60 rounded-xl p-5 border-2 border-purple-200">
                    <p className="text-sm text-gray-600 italic leading-relaxed flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <span>Start writing and <span className="font-semibold"><span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">C</span><span className="text-purple-700">agent</span></span> will provide suggestions! 📝✨</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 进度指示器 */}
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-6 border-4 border-amber-300 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-5 text-amber-700 flex items-center gap-2">
                  <span className="text-3xl animate-pulse">🎯</span>
                  <span>Writing Progress</span>
                </h3>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      Sections
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-amber-700">
                        {sections.filter((_, index) => sectionDone[index]).length}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-lg font-semibold text-gray-600">{sections.length}</span>
                    </div>
                  </div>

                  <div className="relative w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-6 overflow-hidden shadow-inner border-2 border-gray-300">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                      style={{ 
                        width: `${(sections.filter((_, index) => sectionDone[index]).length / sections.length) * 100}%` 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-md">
                          {Math.round((sections.filter((_, index) => sectionDone[index]).length / sections.length) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/80 rounded-xl p-3 border-2 border-amber-200 shadow-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">✍️</span>
                      <span className="text-xs font-semibold text-gray-600">Words</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-amber-700">{wordCount}</span>
                      <span className="text-xs text-gray-500">/ 50</span>
                    </div>
                    {wordCount >= 50 && (
                      <div className="mt-1 text-xs text-green-600 font-semibold flex items-center gap-1">
                        <span>✓</span>
                        <span>Target reached!</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/80 rounded-xl p-3 border-2 border-purple-200 shadow-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">✅</span>
                      <span className="text-xs font-semibold text-gray-600">Complete</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-purple-700">
                        {sections.filter((_, index) => sectionDone[index]).length}
                      </span>
                      <span className="text-xs text-gray-500">/ {sections.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

