import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  X, User, Plus, Trash2, Pin, Search, Menu, Clock, Check, Loader2, Edit3, Copy, MessageSquare, Send 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  message: string;
  createdAt: string | Date;
}

interface Conversation {
  id: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const BusinessAssistant: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  
  // Conversations list
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history (list of conversations)
  const loadHistory = async (searchVal = ''): Promise<Conversation[]> => {
    setLoadingHistory(true);
    try {
      const url = searchVal.trim() !== '' 
        ? `/assistant/history?search=${encodeURIComponent(searchVal)}` 
        : '/assistant/history';
      const history = await auth.apiRequest(url) as Conversation[];
      const list = history || [];
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Error loading history:', err);
      return [];
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load messages for the active conversation
  const loadConversationMessages = async (id: string) => {
    setLoadingMessages(true);
    try {
      const details = await auth.apiRequest(`/assistant/conversation/${id}`);
      if (details) {
        setChatMessages(details.messages || []);
        setActiveConversationId(id);
      }
    } catch (err) {
      console.error('Error loading conversation messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Trigger loading history and load the most recent conversation when chat is opened
  useEffect(() => {
    if (chatOpen) {
      loadHistory().then((historyList) => {
        if (historyList && historyList.length > 0) {
          // Check if activeConversationId is still valid, else load the most recent
          const exists = historyList.some((c: any) => c.id === activeConversationId);
          if (!activeConversationId || !exists) {
            loadConversationMessages(historyList[0].id);
          } else {
            loadConversationMessages(activeConversationId);
          }
        } else {
          setChatMessages([]);
          setActiveConversationId(null);
        }
      });
    }
  }, [chatOpen]);

  // Auto-scroll messages
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  // Search filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadHistory(val);
  };

  // Create new conversation
  const startNewConversation = async () => {
    try {
      const newConv = await auth.apiRequest('/assistant/new-conversation', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Conversation' })
      });
      if (newConv) {
        setConversations(prev => [newConv, ...prev]);
        setChatMessages([]);
        setActiveConversationId(newConv.id);
        setShowSidebar(false);
      }
    } catch (err) {
      console.error('Error creating new conversation:', err);
    }
  };

  // Toggle Pin status
  const togglePin = async (id: string, currentPin: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await auth.apiRequest(`/assistant/conversation/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPinned: !currentPin })
      });
      loadHistory(searchQuery);
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  // Rename conversation
  const handleRename = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTitle.trim()) return;
    try {
      await auth.apiRequest(`/assistant/conversation/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: renameTitle.trim() })
      });
      setEditingConvId(null);
      loadHistory(searchQuery);
    } catch (err) {
      console.error('Error renaming conversation:', err);
    }
  };

  // Delete conversation
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await auth.apiRequest(`/assistant/conversation/${id}`, {
        method: 'DELETE'
      });
      if (activeConversationId === id) {
        setChatMessages([]);
        setActiveConversationId(null);
      }
      loadHistory(searchQuery);
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // Copy to clipboard
  const copyResponseText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || sending) return;

    const userText = prompt.trim();
    setPrompt('');
    
    const tempUserMsg: Message = {
      role: 'user',
      message: userText,
      createdAt: new Date()
    };
    setChatMessages(prev => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await auth.apiRequest('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          conversationId: activeConversationId || undefined,
          pageContext: location.pathname
        })
      });

      if (res) {
        if (!activeConversationId) {
          setActiveConversationId(res.conversationId);
          loadHistory(searchQuery);
        }
        loadConversationMessages(res.conversationId);
      }
    } catch (err) {
      console.error('Error sending assistant chat message:', err);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          message: 'Failed to process message. Please check connection.',
          createdAt: new Date()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="font-['Outfit',sans-serif]">
      {/* Floating Action Button (Theme colors + Glowing modern AI icon) */}
      {!chatOpen && (
        <button
          onClick={() => {
            setChatOpen(true);
          }}
          className="fixed right-6 bottom-6 z-[9999] group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-purple-500/30"
          title="Open Business Assistant"
        >
          <span className="absolute inset-0 rounded-full bg-purple-500/20 blur-md group-hover:blur-lg transition-all"></span>
          <img src="/robot.png" alt="Assistant" className="h-9 w-9 object-contain group-hover:rotate-12 transition-transform duration-300" />
        </button>
      )}

      {/* Assistant Main Chat Window */}
      {chatOpen && (
        <div 
          className="fixed right-6 bottom-6 z-[9999] bg-white/95 dark:bg-[#30343a]/95 backdrop-blur-xl border border-slate-200/80 dark:border-[#475569]/75 rounded-[20px] shadow-2xl flex overflow-hidden transition-all duration-300 h-[600px] max-h-[calc(100vh-48px)] w-full sm:w-[380px] lg:w-[420px] font-['Outfit',sans-serif]"
        >
          {/* ChatGPT-style History Sidebar Overlay */}
          <div className={`absolute top-0 left-0 bottom-0 h-full w-full sm:w-[260px] lg:w-[280px] border-r border-slate-200/80 dark:border-[#475569]/75 bg-purple-50/95 dark:bg-[#2c243b] flex flex-col shrink-0 z-50 shadow-2xl transition-transform duration-250 ease-in-out ${
            showSidebar ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
          }`}>
            <div className="p-3 border-b border-slate-200/80 dark:border-[#475569]/75 flex items-center justify-between bg-purple-100/30 dark:bg-[#382d54]/30">
              <span className="text-[10px] font-black text-[#111827] dark:text-[#ebe7df] uppercase tracking-wider">Chats</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={startNewConversation}
                  className="p-1.5 rounded-md hover:bg-purple-200/50 dark:hover:bg-[#43385e] text-[#111827] transition"
                  title="New Chat"
                >
                  <Plus className="h-4 w-4 text-[#111827]" />
                </button>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-1.5 rounded-md hover:bg-purple-200/50 dark:hover:bg-[#43385e] text-[#111827] transition"
                  title="Close Sidebar"
                >
                  <X className="h-4 w-4 text-[#111827]" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-slate-200/80 dark:border-[#475569]/75 flex items-center gap-1.5 bg-white dark:bg-[#342b45]/50">
              <Search className="h-3.5 w-3.5 text-[#111827] dark:text-[#9d978d]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-transparent border-none text-[10px] text-[#111827] dark:text-[#ebe7df] outline-none w-full placeholder-slate-400 dark:placeholder-[#9d978d]"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-2 bg-purple-50/30 dark:bg-[#20192a]">
              {loadingHistory && conversations.length === 0 ? (
                <div className="flex justify-center p-3">
                  <Loader2 className="h-4 w-4 text-[#111827] dark:text-[#9d978d] animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-[10px] text-slate-400 dark:text-[#9d978d] text-center py-4">No records</p>
              ) : (
                <div className="space-y-3">
                  {/* Pinned section */}
                  {conversations.filter(c => c.isPinned).length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-1">
                        <Pin className="h-2.5 w-2.5 fill-current text-amber-500" /> Pinned
                      </div>
                      {conversations.filter(c => c.isPinned).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            loadConversationMessages(c.id);
                            setShowSidebar(false);
                          }}
                          className={`group relative flex items-center justify-between pl-3 pr-2 py-2 rounded-xl text-left cursor-pointer transition-all duration-205 ${
                            activeConversationId === c.id 
                              ? 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-semibold border-l-4 border-l-purple-600 dark:border-l-purple-400 shadow-sm' 
                              : 'text-slate-700 dark:text-[#c3beb4] hover:bg-purple-100/30 dark:hover:bg-[#342b45] hover:text-purple-700 dark:hover:text-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            {editingConvId === c.id ? (
                              <form onSubmit={(e) => handleRename(c.id, e)} className="w-full flex items-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={renameTitle}
                                  onChange={e => setRenameTitle(e.target.value)}
                                  onBlur={(e) => handleRename(c.id, e as any)}
                                  autoFocus
                                  className="bg-white dark:bg-[#342b45] border border-slate-300 dark:border-[#475569]/75 text-[11px] px-1 py-0.5 rounded w-full outline-none text-[#111827] dark:text-[#ebe7df]"
                                />
                              </form>
                            ) : (
                              <span className="text-[11px] truncate max-w-[110px]">{c.title}</span>
                            )}
                          </div>
                          
                          {editingConvId !== c.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingConvId(c.id);
                                  setRenameTitle(c.title);
                                }}
                                className="p-0.5 rounded hover:bg-purple-200 dark:hover:bg-[#43385e] text-[#374151] dark:text-slate-300"
                                title="Rename"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => togglePin(c.id, c.isPinned, e)}
                                className="p-0.5 rounded hover:bg-purple-200 dark:hover:bg-[#43385e] text-amber-500"
                                title="Unpin"
                              >
                                <Pin className="h-3 w-3 text-amber-500 fill-current" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(c.id, e)}
                                className="p-0.5 rounded hover:bg-purple-200 dark:hover:bg-[#43385e] text-red-500"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent section */}
                  <div className="space-y-1">
                    {conversations.filter(c => c.isPinned).length > 0 && (
                      <div className="px-2 py-0.5 mt-2 text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                        Recent Chats
                      </div>
                    )}
                    {conversations.filter(c => !c.isPinned).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          loadConversationMessages(c.id);
                          setShowSidebar(false);
                        }}
                        className={`group relative flex items-center justify-between pl-3 pr-2 py-2 rounded-xl text-left cursor-pointer transition-all duration-205 ${
                          activeConversationId === c.id 
                            ? 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-semibold border-l-4 border-l-purple-600 dark:border-l-purple-400 shadow-sm' 
                            : 'text-slate-700 dark:text-[#c3beb4] hover:bg-purple-100/30 dark:hover:bg-[#342b45] hover:text-purple-700 dark:hover:text-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <MessageSquare className="h-3.5 w-3.5 text-[#111827] dark:text-[#ebe7df] shrink-0" />
                          {editingConvId === c.id ? (
                            <form onSubmit={(e) => handleRename(c.id, e)} className="w-full flex items-center" onClick={e => e.stopPropagation()}>
                              <input
                                type="text"
                                value={renameTitle}
                                onChange={e => setRenameTitle(e.target.value)}
                                onBlur={(e) => handleRename(c.id, e as any)}
                                autoFocus
                                className="bg-white dark:bg-[#342b45] border border-slate-300 dark:border-[#475569]/75 text-[11px] px-1 py-0.5 rounded w-full outline-none text-[#111827] dark:text-[#ebe7df]"
                              />
                            </form>
                          ) : (
                            <span className="text-[11px] truncate max-w-[110px]">{c.title}</span>
                          )}
                        </div>
                        
                        {editingConvId !== c.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingConvId(c.id);
                                setRenameTitle(c.title);
                              }}
                              className="p-0.5 rounded hover:bg-purple-200 dark:hover:bg-[#43385e] text-[#374151] dark:text-slate-300"
                              title="Rename"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => togglePin(c.id, c.isPinned, e)}
                              className="p-0.5 rounded hover:bg-purple-200 dark:hover:bg-[#43385e] text-[#374151] dark:text-slate-300"
                              title="Pin"
                            >
                              <Pin className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(c.id, e)}
                              className="p-0.5 rounded hover:bg-purple-200 dark:hover:bg-[#43385e] text-red-550 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Pane */}
          <div className="flex-1 flex flex-col w-full">
            {/* Header (Purple -> Indigo Gradient Header) */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between shadow-md shrink-0 border-b border-purple-500/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white"
                  title="Toggle Chats List"
                >
                  <Menu className="h-4.5 w-4.5 text-white" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                    <img src="/robot.png" alt="Assistant" className="h-6 w-6 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs tracking-wide text-white leading-tight">Business Assistant</h3>
                    <p className="text-[9px] text-purple-100 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-300 inline-block animate-pulse"></span>
                      Connected
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={startNewConversation}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/90"
                  title="New Chat"
                >
                  <Plus className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/90"
                  title="Close Assistant"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {/* Messages Viewport */}
            <div className="flex-grow overflow-y-auto p-3 space-y-2 bg-purple-50/10 dark:bg-[#20192a]/20">
              {loadingMessages ? (
                <div className="flex flex-col justify-center items-center h-full space-y-2">
                  <Loader2 className="h-6 w-6 text-purple-600 dark:text-[#a78bfa] animate-spin" />
                  <span className="text-xs text-slate-400 dark:text-[#9d978d]">Loading logs...</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-center p-6 space-y-2">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border border-purple-200 dark:border-purple-800/20">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-[#a78bfa]" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-[#ebe7df]">Business Assistant</h4>
                  <p className="text-[11px] text-slate-450 dark:text-[#c3beb4] max-w-[280px]">
                    Ask questions about stock, suppliers, today's sales, or monthly reports.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/30 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src="/robot.png" alt="Assistant" className="h-5 w-5 object-contain" />
                      </div>
                    )}
                    
                    {/* SaaS Message Bubble */}
                    <div 
                      className={`group relative py-2.5 px-3 rounded-[14px] max-w-[80%] text-xs leading-normal transition-all ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-750 dark:to-indigo-750 text-white rounded-br-none shadow-sm'
                          : 'bg-white dark:bg-[#383d44] text-slate-800 dark:text-[#ebe7df] border-l-4 border-l-emerald-500 dark:border-l-emerald-400 border border-y-slate-100 border-r-slate-100 dark:border-y-[#475569]/20 dark:border-r-[#475569]/20 rounded-bl-none shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.message}</div>
                      
                      {/* Timestamps / Controls */}
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-purple-100/30 dark:border-purple-900/10 text-[9px] text-purple-650/70 dark:text-[#a78bfa]/70">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => copyResponseText(msg.message, index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-purple-100 dark:hover:bg-[#43385e] text-purple-600 dark:text-[#a78bfa]"
                            title="Copy"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3 text-purple-650 dark:text-[#a78bfa]" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="h-6 w-6 rounded-full bg-purple-200 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-purple-700 dark:text-purple-300" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {sending && (
                <div className="flex items-start gap-2 justify-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/30 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="/robot.png" alt="Assistant" className="h-5 w-5 object-contain" />
                  </div>
                  <div className="py-2 px-2.5 rounded-[14px] bg-white dark:bg-[#383d44] text-slate-500 dark:text-slate-400 border-l-4 border-l-emerald-500 dark:border-l-emerald-400 border border-y-slate-100 border-r-slate-100 dark:border-y-[#475569]/10 dark:border-r-[#475569]/10 text-xs italic shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center gap-1.5 rounded-bl-none">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span>Consulting system context...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-2.5 border-t border-slate-200 dark:border-[#475569]/75 bg-white dark:bg-[#30343a] flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask about inventory, sales, suppliers..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={sending}
                className="flex-grow px-3.5 py-2 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs outline-none focus:border-purple-500 dark:focus:border-purple-400 bg-purple-50/40 dark:bg-[#342b45] text-purple-955 dark:text-[#ebe7df]"
              />
              <button
                type="submit"
                disabled={sending || !prompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-500/35 transition duration-150 disabled:from-emerald-500/60 disabled:to-teal-500/60 disabled:cursor-not-allowed"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
