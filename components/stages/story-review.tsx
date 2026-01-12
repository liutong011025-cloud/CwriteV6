"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface StoryReviewProps {
  language: Language
  storyState: StoryState
  onReset: () => void
  onEdit: (stage: "character" | "plot" | "structure" | "writing") => void
  onBack: () => void
  userId?: string
  workId?: string | null // 如果提供，表示正在编辑已保存的作品
}

export default function StoryReview({ storyState, onReset, onEdit, onBack, userId, workId }: StoryReviewProps) {
  // 使用ref来跟踪是否已经保存过，避免重复保存
  const hasSavedRef = useRef(false)
  const savedStoryRef = useRef<string>("")
  
  // 视频生成相关状态
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const videoGeneratedRef = useRef(false)

  // 保存故事内容到interactions API
  useEffect(() => {
    // 只有当故事内容改变且还没有保存过时，才保存
    if (storyState.story && userId && (!hasSavedRef.current || savedStoryRef.current !== storyState.story)) {
      hasSavedRef.current = true
      savedStoryRef.current = storyState.story
      
      fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          stage: "review",
          input: {
            character: storyState.character,
            plot: storyState.plot,
            structure: storyState.structure,
          },
          output: {
            story: storyState.story,
          },
          story: storyState.story, // 保存完整故事内容
          character: storyState.character, // 需要在顶层传递
          plot: storyState.plot, // 需要在顶层传递
          structure: storyState.structure, // 需要在顶层传递
          workId: workId || undefined, // 如果正在编辑，传递 workId
        }),
      })
      .then(res => res.json())
      .then(data => {
        console.log('Story saved successfully:', data)
        if (data.success) {
          console.log('Story saved to database')
        }
      })
      .catch((error) => {
        console.error("Error saving story to interactions:", error)
        // 如果保存失败，重置标记以便重试
        hasSavedRef.current = false
      })
    }
  }, [storyState.story, userId, storyState.character, storyState.plot, storyState.structure])

  // 自动生成视频
  useEffect(() => {
    // 只有当故事内容存在且还没有生成过视频时，才生成视频
    if (storyState.story && !videoGeneratedRef.current && !isGeneratingVideo && !videoUrl) {
      videoGeneratedRef.current = true
      
      const generateVideo = async () => {
        if (!storyState.story) {
          return
        }

        setIsGeneratingVideo(true)
        try {
          const response = await fetch("/api/generate-story-video", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              story: storyState.story,
              character: storyState.character,
              plot: storyState.plot,
              user_id: userId,
              duration: "10", // 使用10秒（Kling Video v2.6最大支持）
            }),
          })

          const data = await response.json()

          if (data.error) {
            console.error("Video generation failed:", data.error)
            // 生成失败时不显示错误提示，静默失败，允许用户继续浏览
            setIsGeneratingVideo(false)
            return
          }

          if (data.videoUrl) {
            setVideoUrl(data.videoUrl)
            setIsGeneratingVideo(false)
          } else {
            setIsGeneratingVideo(false)
          }
        } catch (error: any) {
          console.error("Error generating video:", error)
          // 生成失败时静默失败，允许用户继续浏览
          setIsGeneratingVideo(false)
        }
      }
      
      generateVideo()
    }
  }, [storyState.story, userId, storyState.character, storyState.plot])


  const handleDownload = () => {
    if (!storyState.story) return

    const content = `
STORY: ${storyState.character?.name}'s Adventure

CHARACTER: ${storyState.character?.name}
${storyState.character?.species ? `Species: ${storyState.character.species}` : ''}
Traits: ${storyState.character?.traits.join(", ")}

SETTING: ${storyState.plot?.setting}
CONFLICT: ${storyState.plot?.conflict}
GOAL: ${storyState.plot?.goal}

STORY TYPE: ${storyState.structure?.type}

---

${storyState.story}

---
Created with Story Writer
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${storyState.character?.name}-story.txt`
    a.click()
  }

  return (
    <div className="min-h-screen py-8 px-6 bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-orange-50 relative" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* 背景图片 - 使用结构生成的图片 */}
      {storyState.structure?.imageUrl && (
        <div className="fixed inset-0 z-0">
          <img
            src={storyState.structure.imageUrl}
            alt="Story background"
            className="w-full h-full object-cover"
            style={{
              filter: 'blur(8px) brightness(0.85)',
              transform: 'scale(1.05)',
            }}
          />
        </div>
      )}
      
      <div className="max-w-7xl mx-auto relative z-10">
        <StageHeader stage={5} title="Your Story is Complete!" onBack={onBack} />

        <div className="grid lg:grid-cols-12 gap-6 mt-8">
          {/* 左侧：视频容器 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-purple-100/95 via-pink-100/95 to-orange-100/95 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-300 shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                Story Video
              </h3>
              
              {isGeneratingVideo ? (
                <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl p-8 border-2 border-purple-200 min-h-[400px] flex items-center justify-center">
                  {/* 有趣的加载动画 */}
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 w-24 h-24">
                      {/* 旋转的圆圈 */}
                      <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border-4 border-pink-200 rounded-full"></div>
                      <div className="absolute inset-2 border-4 border-transparent border-t-pink-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      {/* 中心图标 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl animate-pulse">🎬</span>
                      </div>
                    </div>
                    
                    {/* 文字动画 */}
                    <div className="space-y-2">
                      <p className="text-purple-700 text-lg font-semibold animate-pulse">
                        Generating Video...
                      </p>
                      <p className="text-gray-600 text-sm">
                        This may take a few minutes
                      </p>
                      
                      {/* 跳动的点 */}
                      <div className="flex justify-center gap-2 mt-4">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
              ) : videoUrl ? (
                <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 shadow-xl">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support video playback
                    </video>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 border-2 border-gray-300 min-h-[400px] flex items-center justify-center">
                  <p className="text-gray-500 text-center">
                    Video will appear here once generated
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 中间：故事内容 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-purple-100/95 via-pink-100/95 to-orange-100/95 backdrop-blur-md rounded-2xl p-10 border-2 border-purple-300 shadow-2xl">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                {storyState.character?.name}'s Adventure
              </h2>
              <p className="text-lg text-gray-700 mb-8 font-semibold">
                {storyState.plot?.setting} • {storyState.structure?.type}
              </p>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border-2 border-purple-200 shadow-inner">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base font-serif">{storyState.story}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                onClick={handleDownload} 
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-xl py-6 text-lg font-bold"
              >
                Download Story
              </Button>
              <Button 
                onClick={() => onEdit("storyEdit")} 
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border-0 shadow-xl py-6 text-lg font-bold"
              >
                Edit Story
              </Button>
            </div>
          </div>

          {/* 右侧：Story Summary */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200 shadow-xl">
              <h3 className="text-2xl font-bold mb-6 text-indigo-700">Story Summary</h3>
              <div className="space-y-4">
                <div className="bg-white/80 rounded-xl p-4 border-2 border-indigo-200">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Character</p>
                  <p className="text-lg font-bold text-indigo-700">{storyState.character?.name}</p>
                </div>
                {storyState.character?.species && (
                  <div className="bg-white/80 rounded-xl p-4 border-2 border-purple-200">
                    <p className="text-sm text-gray-600 font-semibold mb-1">Species</p>
                    <p className="text-lg font-bold text-purple-700">{storyState.character.species}</p>
                  </div>
                )}
                <div className="bg-white/80 rounded-xl p-4 border-2 border-pink-200">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Setting</p>
                  <p className="text-lg font-bold text-pink-700">{storyState.plot?.setting}</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4 border-2 border-orange-200">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Type</p>
                  <p className="text-lg font-bold text-orange-700 capitalize">{storyState.structure?.type}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={onReset} 
              size="lg" 
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-xl py-6 text-lg font-bold"
            >
              Create New Story
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

