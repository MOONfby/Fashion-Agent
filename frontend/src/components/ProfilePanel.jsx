import React, { useState, useEffect, useRef } from 'react'
import { User, Camera, Save, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react'
import { getProfile, updateProfile, analyzeProfilePhoto, getProfileCompleteness } from '../services/api.js'

const BODY_TYPES = ['沙漏型', '苹果型', '梨形', '直筒型', '倒三角型']
const SKIN_TONES = ['冷白', '暖白', '小麦', '深色']
const AGE_RANGES = ['18-24', '25-30', '31-35', '36-45', '45+']
const BUDGET_RANGES = ['经济', '中等', '高端']
const STYLE_OPTIONS = [
  '简约', '法式', '休闲', '运动', '复古', '波西米亚',
  '极简', '优雅', '甜美', '街头', '职场', '仙女风',
]

function CompletenessBar({ score }) {
  const color =
    score >= 80 ? 'bg-emerald-400' :
    score >= 50 ? 'bg-amber-400' :
    'bg-rose-400'

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500 font-medium">画像完整度</span>
        <span className="text-xs font-semibold text-gray-700">{score}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function ProfilePanel({ isOpen, onToggle }) {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [completeness, setCompleteness] = useState(0)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error' | null
  const [analyzeResult, setAnalyzeResult] = useState(null)

  const photoInputRef = useRef(null)

  // ─── Load profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const [p, c] = await Promise.all([getProfile(), getProfileCompleteness()])
        setProfile(p)
        setCompleteness(c.completeness)

        // Parse style_preferences JSON
        let stylePrefArray = []
        if (p.style_preferences) {
          try {
            stylePrefArray = JSON.parse(p.style_preferences)
          } catch (_) {}
        }
        setForm({
          height: p.height ?? '',
          weight: p.weight ?? '',
          body_type: p.body_type ?? '',
          skin_tone: p.skin_tone ?? '',
          age_range: p.age_range ?? '',
          budget_range: p.budget_range ?? '',
          style_preferences_array: stylePrefArray,
        })
      } catch (err) {
        console.error('Failed to load profile:', err)
      }
    })()
  }, [])

  // ─── Save profile ─────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    setSaveStatus(null)
    try {
      const payload = {
        height: form.height !== '' ? parseFloat(form.height) : null,
        weight: form.weight !== '' ? parseFloat(form.weight) : null,
        body_type: form.body_type || null,
        skin_tone: form.skin_tone || null,
        age_range: form.age_range || null,
        budget_range: form.budget_range || null,
        style_preferences:
          form.style_preferences_array?.length > 0
            ? JSON.stringify(form.style_preferences_array)
            : null,
      }
      const updated = await updateProfile(payload)
      setProfile(updated)
      setSaveStatus('success')

      // Refresh completeness
      const c = await getProfileCompleteness()
      setCompleteness(c.completeness)

      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle style tag ─────────────────────────────────────────────────────
  function toggleStyle(style) {
    setForm((prev) => {
      const current = prev.style_preferences_array || []
      const next = current.includes(style)
        ? current.filter((s) => s !== style)
        : [...current, style]
      return { ...prev, style_preferences_array: next }
    })
  }

  // ─── Analyze photo ────────────────────────────────────────────────────────
  function handlePhotoButtonClick() {
    photoInputRef.current?.click()
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 5) {
      alert('图片大小不能超过 5MB')
      return
    }

    setAnalyzing(true)
    setAnalyzeResult(null)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type

      try {
        const result = await analyzeProfilePhoto(base64, mediaType)
        setAnalyzeResult(result)

        // Auto-fill form with detected values
        if (result.body_type) {
          setForm((prev) => ({ ...prev, body_type: result.body_type }))
        }
        if (result.skin_tone) {
          setForm((prev) => ({ ...prev, skin_tone: result.skin_tone }))
        }
      } catch (err) {
        setAnalyzeResult({ error: '分析失败，请重试。' })
      } finally {
        setAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`
        flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300
        ${isOpen ? 'w-72' : 'w-14'}
        h-full overflow-hidden
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center">
              <User size={14} className="text-rose-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">我的画像</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors ml-auto"
          title={isOpen ? '收起侧边栏' : '展开侧边栏'}
        >
          {isOpen ? <ChevronDown size={16} className="rotate-90" /> : <ChevronDown size={16} className="-rotate-90" />}
        </button>
      </div>

      {/* Content (only when open) */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {profile === null ? (
            <div className="text-sm text-gray-400 text-center mt-8">加载中…</div>
          ) : (
            <>
              <CompletenessBar score={completeness} />

              {/* Analyze photo button */}
              <div className="mb-5">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  onClick={handlePhotoButtonClick}
                  disabled={analyzing}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border border-rose-200 text-rose-600 rounded-xl py-2.5 transition-all disabled:opacity-60"
                >
                  <Camera size={15} />
                  {analyzing ? '分析中…' : '分析我的照片'}
                </button>

                {analyzeResult && !analyzeResult.error && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 leading-relaxed">
                    <div className="font-medium mb-1">✅ 分析完成</div>
                    {analyzeResult.analysis_text}
                    {(analyzeResult.body_type || analyzeResult.skin_tone) && (
                      <div className="mt-1.5 text-emerald-600">已自动填入体型和肤色信息。</div>
                    )}
                  </div>
                )}

                {analyzeResult?.error && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                    {analyzeResult.error}
                  </div>
                )}
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Height & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">身高 (cm)</label>
                    <input
                      type="number"
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: e.target.value })}
                      placeholder="如 165"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">体重 (kg)</label>
                    <input
                      type="number"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      placeholder="如 55"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
                    />
                  </div>
                </div>

                {/* Body type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">体型</label>
                  <select
                    value={form.body_type}
                    onChange={(e) => setForm({ ...form, body_type: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 bg-white"
                  >
                    <option value="">请选择</option>
                    {BODY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Skin tone */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">肤色</label>
                  <select
                    value={form.skin_tone}
                    onChange={(e) => setForm({ ...form, skin_tone: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 bg-white"
                  >
                    <option value="">请选择</option>
                    {SKIN_TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Age range */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">年龄段</label>
                  <select
                    value={form.age_range}
                    onChange={(e) => setForm({ ...form, age_range: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 bg-white"
                  >
                    <option value="">请选择</option>
                    {AGE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Budget range */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">预算</label>
                  <select
                    value={form.budget_range}
                    onChange={(e) => setForm({ ...form, budget_range: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 bg-white"
                  >
                    <option value="">请选择</option>
                    {BUDGET_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Style preferences (multi-select tags) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">风格偏好</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STYLE_OPTIONS.map((style) => {
                      const active = (form.style_preferences_array || []).includes(style)
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleStyle(style)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            active
                              ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600'
                          }`}
                        >
                          {style}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className="mt-5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm font-medium rounded-xl py-2.5 shadow-sm transition-all disabled:opacity-60"
                >
                  <Save size={15} />
                  {saving ? '保存中…' : '保存画像'}
                </button>

                {saveStatus === 'success' && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 justify-center">
                    <CheckCircle size={13} />
                    保存成功！
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 justify-center">
                    <AlertCircle size={13} />
                    保存失败，请重试。
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
