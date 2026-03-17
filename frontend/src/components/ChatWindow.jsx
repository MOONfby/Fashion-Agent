import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Trash2, AlertCircle } from 'lucide-react'
import MessageBubble, { LoadingBubble } from './MessageBubble.jsx'
import ImageUpload from './ImageUpload.jsx'
import { sendMessage, getHistory, clearHistory } from '../services/api.js'

export default function ChatWindow() {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null) // { base64, mediaType, previewUrl }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // ─── Load history on mount ────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const history = await getHistory()
        setMessages(history)
      } catch (err) {
        console.error('Failed to load history:', err)
      } finally {
        setLoadingHistory(false)
      }
    })()
  }, [])

  // ─── Auto-scroll to bottom ────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ─── Handle send ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text && !selectedImage) return
    if (isLoading) return

    setError(null)

    // Optimistic user message
    const optimisticUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      has_image: !!selectedImage,
      imagePreviewUrl: selectedImage?.previewUrl || null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUserMsg])
    setInputText('')
    const imgToSend = selectedImage
    setSelectedImage(null)
    setIsLoading(true)

    try {
      const data = await sendMessage(
        text || '请帮我分析这张图片，给出穿搭建议。',
        imgToSend?.base64 || null,
        imgToSend?.mediaType || null
      )

      const assistantMsg = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        has_image: false,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          '发送失败，请检查网络连接或后端服务是否正常运行。'
      )
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
    } finally {
      setIsLoading(false)
    }
  }, [inputText, selectedImage, isLoading])

  // ─── Key handler ─────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Clear history ────────────────────────────────────────────────────────
  async function handleClear() {
    if (!window.confirm('确定要清除所有对话记录吗？')) return
    try {
      await clearHistory()
      setMessages([])
    } catch (err) {
      setError('清除失败，请重试。')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-lg">✨</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-800">时尚小助手</h1>
            <p className="text-xs text-gray-500">AI 穿搭顾问 · 随时为你服务</p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          title="清除对话"
        >
          <Trash2 size={14} />
          清除对话
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loadingHistory && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            加载对话记录中…
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">👗</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">你好！我是时尚小助手</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                你可以问我穿搭搭配、颜色选择、场合着装等问题，<br />
                也可以上传照片让我帮你分析和给出建议。
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-2">
              {[
                '今天约会应该穿什么？',
                '梨形体型适合什么裤型？',
                '如何穿出法式优雅感？',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputText(suggestion)}
                  className="text-left text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl px-4 py-2.5 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loadingHistory &&
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}

        {isLoading && <LoadingBubble />}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-xs ml-2"
          >
            关闭
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        {/* Image preview strip */}
        {selectedImage && (
          <div className="mb-2 ml-1">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-rose-600">
              <span>📷</span>
              <span>已选择图片（将随消息发送）</span>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
          {/* Image upload trigger */}
          <div className="flex-shrink-0 mb-0.5">
            <ImageUpload
              selectedImage={selectedImage}
              onImageSelected={(base64, mediaType, previewUrl) =>
                setSelectedImage({ base64, mediaType, previewUrl })
              }
              onImageCleared={() => setSelectedImage(null)}
            />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的穿搭问题，或上传图片…（Enter 发送，Shift+Enter 换行）"
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed py-1 max-h-32 overflow-y-auto"
            style={{
              height: 'auto',
              minHeight: '28px',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
            disabled={isLoading}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-xl flex items-center justify-center shadow-sm hover:from-rose-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all mb-0.5"
            title="发送"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
