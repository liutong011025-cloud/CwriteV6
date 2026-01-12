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
  const [showVideo, setShowVideo] = useState(false)
  const [videoHasPlayed, setVideoHasPlayed] = useState(false)
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
            // 视频生成成功后，显示视频（全屏播放）
            setShowVideo(true)
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

  // 处理视频播放结束
  const handleVideoEnded = () => {
    setVideoHasPlayed(true)
    setShowVideo(false)
    // 退出全屏（如果处于全屏状态）
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen()
    }
  }

  // 请求全屏播放视频
  useEffect(() => {
    if (showVideo && videoUrl) {
      // 延迟一点时间确保DOM更新
      setTimeout(() => {
        const videoElement = document.getElementById('story-video-player') as HTMLVideoElement
        const container = document.getElementById('story-video-container')
        if (container) {
          if (container.requestFullscreen) {
            container.requestFullscreen()
          } else if ((container as any).mozRequestFullScreen) {
            (container as any).mozRequestFullScreen()
          } else if ((container as any).webkitRequestFullscreen) {
            (container as any).webkitRequestFullscreen()
          } else if ((container as any).msRequestFullscreen) {
            (container as any).msRequestFullscreen()
          }
        }
        if (videoElement) {
          videoElement.play().catch(err => console.error("Video play error:", err))
        }
      }, 100)
    }
  }, [showVideo, videoUrl])

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
      {/* 加载界面 */}
      {isGeneratingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-xl font-semibold">正在生成视频...</p>
            <p className="text-white/70 text-sm mt-2">这可能需要几分钟时间</p>
          </div>
        </div>
      )}

      {/* 全屏视频播放 */}
      {showVideo && videoUrl && (
        <div
          id="story-video-container"
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        >
          <video
            id="story-video-player"
            src={videoUrl}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      )}

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
          <div className="lg:col-span-8 space-y-6">
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

          <div className="lg:col-span-4 space-y-6">
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

