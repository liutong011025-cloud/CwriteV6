"use client"

import Image from "next/image"

export default function Footer() {
  return (
    <footer
      className="w-full mt-auto"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 58, 138, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%)',
        backdropFilter: 'blur(12px) saturate(180%)',
        borderTop: '1px solid rgba(59, 130, 246, 0.3)',
      }}
    >
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Logo区域 */}
          <div className="flex items-center gap-10 lg:gap-12">
            {/* EdUHK Logo - 大一些 */}
            <div className="flex-shrink-0">
              <Image
                src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.png"
                alt="EdUHK Logo"
                width={300}
                height={98}
                className="object-contain"
                unoptimized
              />
            </div>
            
            {/* MIT Logo - 小一些 */}
            <div className="flex-shrink-0">
              <Image
                src="/MIT_Logo2-1024x290.png"
                alt="MIT Logo"
                width={180}
                height={51}
                className="object-contain opacity-90"
                unoptimized
              />
            </div>
          </div>
          
          {/* 文本信息 */}
          <div className="flex-1 text-center lg:text-right space-y-3 max-w-md lg:max-w-none">
            <p className="text-blue-100 text-base leading-relaxed">
              Strategic Plan Start-up Support @EdUHK
            </p>
            <p className="text-blue-100 text-base leading-relaxed">
              Department of Mathematics and Information Technology
            </p>
            <p className="text-blue-200 text-base font-semibold mt-3">
              © EdUHK
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}


