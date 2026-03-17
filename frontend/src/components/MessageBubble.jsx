import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles } from 'lucide-react'

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

/**
 * MessageBubble – renders a single chat message.
 *
 * Props:
 *   message: {
 *     role: 'user' | 'assistant',
 *     content: string,
 *     has_image?: boolean,
 *     imagePreviewUrl?: string,  // only present for optimistic user messages before save
 *     created_at?: string,
 *   }
 */
export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const time = formatTime(message.created_at)

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] flex flex-col items-end gap-1">
          {/* Image thumbnail (if user sent an image) */}
          {message.imagePreviewUrl && (
            <img
              src={message.imagePreviewUrl}
              alt="用户上传的图片"
              className="max-h-48 max-w-xs rounded-xl border-2 border-rose-200 object-cover shadow-sm"
            />
          )}
          {message.has_image && !message.imagePreviewUrl && (
            <div className="text-xs text-rose-400 italic mb-1">📷 已附加图片</div>
          )}

          {/* Text bubble */}
          {message.content && (
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          {/* Timestamp */}
          {time && (
            <span className="text-xs text-gray-400">{time}</span>
          )}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex justify-start mb-4 gap-2.5">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-sm mt-0.5">
        <Sparkles size={14} className="text-white" />
      </div>

      <div className="max-w-[78%] flex flex-col items-start gap-1">
        {/* Name badge */}
        <span className="text-xs font-medium text-rose-600 ml-1">时尚小助手</span>

        {/* Content bubble */}
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="prose-chat text-sm text-gray-800 leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {/* Timestamp */}
        {time && (
          <span className="text-xs text-gray-400 ml-1">{time}</span>
        )}
      </div>
    </div>
  )
}

/**
 * LoadingBubble – shown while waiting for Claude's response.
 */
export function LoadingBubble() {
  return (
    <div className="flex justify-start mb-4 gap-2.5">
      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-sm mt-0.5">
        <Sparkles size={14} className="text-white" />
      </div>

      <div className="flex flex-col items-start gap-1">
        <span className="text-xs font-medium text-rose-600 ml-1">时尚小助手</span>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="loading-dot w-2 h-2 bg-rose-400 rounded-full" />
            <div className="loading-dot w-2 h-2 bg-rose-400 rounded-full" />
            <div className="loading-dot w-2 h-2 bg-rose-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
