import React, { useRef, useState } from 'react'
import { Paperclip, X, AlertCircle } from 'lucide-react'

const MAX_SIZE_MB = 5

/**
 * ImageUpload – triggered by a button click, validates size, converts to base64.
 *
 * Props:
 *   onImageSelected(base64: string, mediaType: string, previewUrl: string) -> void
 *   onImageCleared() -> void
 *   selectedImage: { base64, mediaType, previewUrl } | null
 */
export default function ImageUpload({ onImageSelected, onImageCleared, selectedImage }) {
  const inputRef = useRef(null)
  const [error, setError] = useState(null)

  function handleButtonClick() {
    setError(null)
    inputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    // Validate size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_SIZE_MB) {
      setError(`图片大小不能超过 ${MAX_SIZE_MB}MB（当前 ${sizeMB.toFixed(1)}MB）`)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const dataUrl = evt.target.result // "data:image/jpeg;base64,..."
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type
      onImageSelected(base64, mediaType, previewUrl)
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function handleClear() {
    setError(null)
    onImageCleared()
  }

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      {!selectedImage && (
        <button
          type="button"
          onClick={handleButtonClick}
          className="p-2 text-gray-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
          title="上传图片"
        >
          <Paperclip size={20} />
        </button>
      )}

      {/* Preview + clear */}
      {selectedImage && (
        <div className="relative image-preview">
          <img
            src={selectedImage.previewUrl}
            alt="已选择的图片"
            className="h-10 w-10 rounded-lg object-cover border-2 border-rose-300 cursor-pointer"
            onClick={handleButtonClick}
            title="点击更换图片"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-sm hover:bg-rose-600 transition-colors"
            title="移除图片"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 whitespace-nowrap shadow-sm">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  )
}
