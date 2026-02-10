const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const updateFcmToken = async (payload: { fire_user_id: string; fcm_token: string }) => {
  const response = await fetch(`${API_URL}/utilisateurs/fcm-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Erreur API (${response.status})`)
  }

  return response.json().catch(() => ({}))
}
