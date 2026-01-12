"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface Member {
  name: string
  role: string
  titles: string[]
  interests: string[]
  email: string
  scholar?: string
  photo: string
}

const researchVision = {
  title: "Research Vision",
  paragraphs: [
    "We are committed to designing human-centered, AI-supported learning frameworks that integrate self-regulated learning and educational technology to improve the effectiveness and equity of language and interdisciplinary learning.",
    "We examine AI's role in teaching as an inspiration and feedback tool that helps learners remain agentic, develop critical digital literacy, and adopt sustainable learning strategies."
  ]
}

const leadTeam: Member[] = [
  {
    name: "Dr. YANG, Yin Nicole (PhD)",
    role: "Principal Investigator",
    titles: [
      "Research Assistant Professor"
    ],
    interests: [
      "AI in interdisciplinary education",
      "Digital literacy and competency",
      "Second language acquisition",
      "Cognitive science in learning",
      "Emerging technologies and pedagogical innovation"
    ],
    email: "yyin@eduhk.hk",
    scholar: "https://scholar.google.com/citations?user=bjITS38AAAAJ&hl=zh-CN&inst=9002373801639654337&oi=ao",
    photo: "http://museaiwrite.eduhk.hk/wp-content/uploads/2025/05/图片11.png"
  },
  {
    name: "Prof. LEE, Chi Kin John, JP (PhD)",
    role: "Co-Principal Investigator & Advisor",
    titles: [
      "President",
      "Chair Professor of Curriculum and Instruction",
      "Director, Academy for Applied Policy Studies and Education Futures",
      "Director, Academy for Educational Development and Innovation"
    ],
    interests: [
      "Curriculum and instruction",
      "Geographical and environmental education",
      "School improvement",
      "Teacher development",
      "Life and values education"
    ],
    email: "poffice@eduhk.hk",
    photo: "/john.png"
  }
]

const team: Member[] = [
  {
    name: "Prof. GU, Ming Yue Michelle (PhD)",
    role: "Co-Investigator",
    titles: [
      "Professor",
      "Assistant Vice President (Research)"
    ],
    interests: [
      "Multilingualism and mobility",
      "Internationalization in higher education",
      "(Digital) citizenship and identity studies",
      "Minority education",
      "Family language policy"
    ],
    email: "mygu@eduhk.hk",
    scholar: "https://scholar.google.com/citations?user=PLuccV8AAAAJ&hl=en",
    photo: "/apple.png"
  },
  {
    name: "Dr. WONG, Ming Har Ruth (PhD)",
    role: "Co-Investigator",
    titles: [
      "Associate Head of Department",
      "Assistant Professor"
    ],
    interests: [
      "Motivation",
      "Task-based Learning",
      "Curriculum",
      "Language Arts",
      "Teacher Education"
    ],
    email: "wongmh@eduhk.hk",
    scholar: "https://scholar.google.com.hk/citations?user=LG0U99AAAAAJ&hl=en",
    photo: "/ruth.png"
  },
  {
    name: "Mr. LIU, Tong Tony",
    role: "Research Assistant",
    titles: [
      "Graduate of AI & Educational Technology, EdUHK"
    ],
    interests: [
      "AI and design",
      "Robotics automation",
      "STEM"
    ],
    email: "liut@eduhk.hk",
    photo: "https://museaiwrite.eduhk.hk/wp-content/uploads/2025/10/image-8-683x1024.png"
  }
]

function MemberCard({ member, highlight }: { member: Member; highlight?: boolean }) {
  return (
    <div
      className={`relative rounded-3xl p-8 border-4 shadow-2xl backdrop-blur-sm h-full flex flex-col gap-4 ${
        highlight
          ? "bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-purple-200"
          : "bg-white/85 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-purple-300 flex-shrink-0">
          <Image
            src={member.photo}
            alt={member.name}
            fill
            className="object-cover"
            unoptimized={member.photo.startsWith("http")}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-purple-800 leading-tight">{member.name}</h3>
          <p className="text-sm font-semibold text-purple-600">{member.role}</p>
          <div className="text-sm text-gray-700 leading-snug">
            {member.titles.map((t, i) => (
              <div key={i}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 border border-purple-100 p-4 shadow-inner">
        <p className="text-sm font-semibold text-purple-700 mb-2">Research interests</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc pl-4">
          {member.interests.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
          <a href={`mailto:${member.email}`}>✉️ Email</a>
        </Button>
        {member.scholar && (
          <Button
            asChild
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <a href={member.scholar} target="_blank" rel="noopener">
              🎓 Google Scholar
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

export default function AboutPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-orange-50 px-4" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Research Vision */}
        <section className="bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 text-white rounded-3xl p-10 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-black mb-6">{researchVision.title}</h1>
          <div className="space-y-4 text-lg leading-relaxed text-purple-50">
            {researchVision.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Lead team */}
        <section className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-black text-purple-800">Research Team</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {leadTeam.map((m) => (
              <MemberCard key={m.name} member={m} highlight />
            ))}
          </div>
        </section>

        {/* Core team */}
        <section className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((m) => (
              <MemberCard key={m.name} member={m} />
            ))}
          </div>
        </section>

        <footer className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white py-6 rounded-2xl text-center shadow-lg">
          <p className="text-purple-200">© 2025 CWrite - The Education University of Hong Kong</p>
        </footer>
      </div>
    </div>
  )
}
