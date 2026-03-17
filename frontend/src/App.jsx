import React, { useState } from 'react'
import ChatWindow from './components/ChatWindow.jsx'
import ProfilePanel from './components/ProfilePanel.jsx'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left sidebar – ProfilePanel */}
      <ProfilePanel
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow />
      </div>
    </div>
  )
}
