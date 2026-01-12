"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { Language } from "@/app/page"

interface BookReviewTypeSelectionProps {
  language?: Language
  onSelectType?: (type: "recommendation" | "critical" | "literary") => void
  onBack?: () => void
}

const translations = {
  en: {
    title: "Choose Your Review Style",
    subtitle: "Pick the door that calls to you! 🚪✨",
    back: "← Back",
    chooseButton: "Choose This Style ✨",
    recommendation: {
      name: "Recommendation Review",
      description: "Share why you love a book and recommend it to others!",
      features: [
        "Tell others why the book is great",
        "Share your favorite parts",
        "Help friends find good books"
      ]
    },
    critical: {
      name: "Critical Review",
      description: "Think deeply about a book and share your honest thoughts!",
      features: [
        "Analyze what works and what doesn't",
        "Share both good and bad points",
        "Think like a real critic"
      ]
    },
    literary: {
      name: "Literary Review",
      description: "Explore the deeper meaning and beauty of literature!",
      features: [
        "Discover hidden themes",
        "Appreciate beautiful writing",
        "Understand the author's message"
      ]
    },
  },
  zh: {
    title: "選擇你的書評風格",
    subtitle: "選擇呼喚你的門！🚪✨",
    back: "← 返回",
    chooseButton: "選擇這個風格 ✨",
    recommendation: {
      name: "推薦書評",
      description: "分享你為什麼喜歡一本書並推薦給其他人！",
      features: [
        "告訴其他人為什麼這本書很棒",
        "分享你最喜歡的部分",
        "幫助朋友找到好書"
      ]
    },
    critical: {
      name: "批判書評",
      description: "深入思考一本書並分享你真誠的想法！",
      features: [
        "分析什麼有效什麼無效",
        "分享優點與缺點",
        "像真正的評論家一樣思考"
      ]
    },
    literary: {
      name: "文學書評",
      description: "探索文學的更深層意義與美感！",
      features: [
        "發現隱藏主題",
        "欣賞優美寫作",
        "理解作者的訊息"
      ]
    },
  },
}

const getReviewTypes = (language: Language = "en") => {
  const t = translations[language] || translations.en
  return [
    {
      id: "recommendation" as const,
      name: t.recommendation.name,
      emoji: "⭐",
      image: "/d1.png",
      description: t.recommendation.description,
      features: t.recommendation.features
    },
    {
      id: "critical" as const,
      name: t.critical.name,
      emoji: "🔍",
      image: "/d2.png",
      description: t.critical.description,
      features: t.critical.features
    },
    {
      id: "literary" as const,
      name: t.literary.name,
      emoji: "📚",
      image: "/d3.png",
      description: t.literary.description,
      features: t.literary.features
    }
  ]
}

export default function BookReviewTypeSelection({ language = "en", onSelectType, onBack }: BookReviewTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<"recommendation" | "critical" | "literary" | null>(null)
  const [hoveredDoor, setHoveredDoor] = useState<string | null>(null)
  const t = translations[language] || translations.en
  const reviewTypes = getReviewTypes(language)

  const handleDoorClick = (type: "recommendation" | "critical" | "literary") => {
    setSelectedType(type)
  }

  const handleConfirm = () => {
    if (selectedType) {
      onSelectType?.(selectedType)
    }
  }

  const selectedTypeData = selectedType ? reviewTypes.find(t => t.id === selectedType) : null

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen px-6 lg:px-12 py-12 lg:py-20" style={{ paddingTop: '128px', paddingBottom: '120px' }}>
        {/* 返回按钮 */}
        {onBack && (
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/80 backdrop-blur-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-lg font-bold"
            >
              {t.back}
            </Button>
          </div>
        )}

        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            {t.subtitle}
          </p>
        </div>

        {/* 三扇门 - 不使用容器，直接放图片 */}
        <div className="max-w-7xl mx-auto mb-12 relative overflow-x-auto" style={{ minHeight: '600px' }}>
          <div className="flex items-start justify-center gap-12 relative px-4" style={{ minWidth: 'fit-content' }}>
            {reviewTypes.map((type, index) => {
              const isHovered = hoveredDoor === type.id
              const isSelected = selectedType === type.id
              
              // 计算偏移量：选中的门不动，右边的门向右移动
              let offsetX = 0
              if (selectedType) {
                const selectedIndex = reviewTypes.findIndex(t => t.id === selectedType)
                if (index > selectedIndex) {
                  offsetX = 500 // 右边的门向右移动500px
                }
              }
              
              return (
                <div
                  key={type.id}
                  className="relative flex-shrink-0 flex flex-col items-center"
                  style={{
                    width: '400px',
                    transition: 'transform 0.7s ease-out',
                    transform: `translateX(${offsetX}px)`,
                  }}
                  onMouseEnter={() => setHoveredDoor(type.id)}
                  onMouseLeave={() => setHoveredDoor(null)}
                >
                  {/* 门上的文字 - 在门的上方，带背景板，强制换行，统一大小 */}
                  <div className="mb-4 text-center w-full">
                    <div className="inline-block bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl px-6 py-3 shadow-lg w-full min-h-[80px] flex items-center justify-center">
                      <h2 className="text-2xl md:text-3xl font-bold text-white whitespace-normal break-words text-center">
                        {type.name.split(' ').map((word, i) => (
                          <span key={i}>
                            {word}
                            {i < type.name.split(' ').length - 1 && <br />}
                          </span>
                        ))}
                      </h2>
                    </div>
                  </div>
                  
                  {/* 门图片 */}
                  <button
                    onClick={() => handleDoorClick(type.id)}
                    className="w-full relative cursor-pointer transition-all duration-300 hover:scale-105"
                    style={{ height: '550px' }}
                  >
                    <Image
                      src={type.image}
                      alt={type.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                </div>
              )
            })}
            
            {/* 介绍卡片 - 从选中门右侧展开，如果会超出则显示在左侧 */}
            {selectedTypeData && (() => {
              const selectedIndex = reviewTypes.findIndex(t => t.id === selectedType)
              const cardWidth = 500
              const doorWidth = 400
              const gap = 48
              const rightPosition = selectedIndex * doorWidth + doorWidth + gap
              
              // 使用 useEffect 或直接计算，检查是否会超出视口
              let wouldOverflow = false
              if (typeof window !== 'undefined') {
                const viewportWidth = window.innerWidth
                wouldOverflow = rightPosition + cardWidth > viewportWidth - 100
              } else {
                // SSR 时默认假设会超出（选择最后一个门时）
                wouldOverflow = selectedIndex === reviewTypes.length - 1
              }
              
              // 如果会超出，显示在选中门的左侧
              const cardLeft = wouldOverflow 
                ? Math.max(0, selectedIndex * doorWidth - cardWidth - gap)
                : rightPosition
              
              return (
                <div 
                  className="absolute top-0 bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 lg:p-10 border-2 border-blue-200 shadow-2xl z-20"
                  style={{
                    width: `${Math.min(cardWidth, typeof window !== 'undefined' ? window.innerWidth - 100 : cardWidth)}px`,
                    maxWidth: 'calc(100vw - 2rem)',
                    left: `${cardLeft}px`,
                    animation: 'slideFromLeft 0.7s ease-out forwards',
                    opacity: 0,
                  }}
                >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{selectedTypeData.emoji}</div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 break-words">
                    {selectedTypeData.name}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-700 mb-6 break-words">
                    {selectedTypeData.description}
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {selectedTypeData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 md:p-4">
                      <span className="text-2xl flex-shrink-0">✨</span>
                      <p className="text-base md:text-lg text-gray-700 font-medium break-words">{feature}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleConfirm}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white border-0 shadow-2xl py-4 md:py-6 px-8 md:px-12 text-lg md:text-xl lg:text-2xl font-bold hover:scale-105 transition-all duration-300 rounded-full w-full md:w-auto"
                  >
                    {t.chooseButton}
                  </Button>
                </div>
              </div>
              )
            })()}
          </div>
        </div>

      </div>
    </div>
  )
}

