import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s timeout for Claude API calls
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Chat ─────────────────────────────────────────────────────────────────────

/**
 * Send a message (optionally with an image) to the fashion agent.
 * @param {string} message
 * @param {string|null} imageBase64 - base64 encoded image data (without data: prefix)
 * @param {string|null} imageMediaType - e.g. "image/jpeg"
 * @returns {Promise<{reply: string, updated_profile: object|null}>}
 */
export async function sendMessage(message, imageBase64 = null, imageMediaType = null) {
  const payload = { message }
  if (imageBase64) {
    payload.image_base64 = imageBase64
    payload.image_media_type = imageMediaType || 'image/jpeg'
  }
  const response = await api.post('/chat', payload)
  return response.data
}

/**
 * Get conversation history (last 20 messages).
 * @returns {Promise<Array>}
 */
export async function getHistory() {
  const response = await api.get('/chat/history')
  return response.data
}

/**
 * Clear all conversation history.
 * @returns {Promise<{message: string}>}
 */
export async function clearHistory() {
  const response = await api.delete('/chat/history')
  return response.data
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Get the current user profile.
 * @returns {Promise<object>}
 */
export async function getProfile() {
  const response = await api.get('/profile')
  return response.data
}

/**
 * Update user profile fields.
 * @param {object} profileData - partial profile fields to update
 * @returns {Promise<object>}
 */
export async function updateProfile(profileData) {
  const response = await api.put('/profile', profileData)
  return response.data
}

/**
 * Get profile completeness score (0-100).
 * @returns {Promise<{completeness: number}>}
 */
export async function getProfileCompleteness() {
  const response = await api.get('/profile/completeness')
  return response.data
}

/**
 * Upload a photo for Claude to analyze body type and skin tone.
 * @param {string} imageBase64 - base64 encoded image data (without data: prefix)
 * @param {string} imageMediaType - e.g. "image/jpeg"
 * @returns {Promise<{body_type: string|null, skin_tone: string|null, analysis_text: string}>}
 */
export async function analyzeProfilePhoto(imageBase64, imageMediaType) {
  const response = await api.post('/profile/analyze-photo', {
    image_base64: imageBase64,
    image_media_type: imageMediaType,
  })
  return response.data
}

export default api
