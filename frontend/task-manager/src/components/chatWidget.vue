<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">

    <!-- Chat panel -->
    <transition name="chat-pop">
      <div
        v-if="open"
        class="chat-panel flex flex-col overflow-hidden"
        style="width: 360px; height: 520px"
      >
        <!-- Header -->
        <div class="chat-header shrink-0 flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="avatar">
              <Sparkles class="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p class="text-sm font-bold text-slate-800 leading-tight">Task Assistant</p>
              <p class="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                Online
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="icon-btn"
              title="Clear chat"
              @click="clearChat"
            >
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
            <button class="icon-btn" @click="open = false" aria-label="Close">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div ref="messagesEl" class="flex-1 overflow-y-auto px-4 py-3 space-y-4 chat-messages">

          <!-- Date chip -->
          <div class="flex justify-center">
            <span class="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
              {{ todayLabel }}
            </span>
          </div>

          <div
            v-for="(msg, i) in conversation"
            :key="i"
            :class="['flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start']"
          >
            <!-- AI avatar -->
            <div v-if="msg.role === 'assistant'" class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
            </div>

            <div :class="['max-w-[78%]', msg.role === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-1']">
              <div
                :class="[
                  'px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'user-bubble'
                    : 'assistant-bubble'
                ]"
              >{{ msg.content }}</div>
            </div>

            <!-- User avatar -->
            <div v-if="msg.role === 'user'" class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <User class="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="loading" class="flex gap-2 justify-start">
            <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div class="assistant-bubble px-4 py-3 flex gap-1.5 items-center">
              <span class="dot"></span>
              <span class="dot" style="animation-delay: 0.15s"></span>
              <span class="dot" style="animation-delay: 0.3s"></span>
            </div>
          </div>
        </div>

        <!-- Suggestions -->
        <div v-if="conversation.length === 1 && !loading" class="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          <button
            v-for="s in suggestions"
            :key="s"
            class="suggestion-chip"
            @click="sendSuggestion(s)"
          >{{ s }}</button>
        </div>

        <!-- Input -->
        <div class="chat-input-area shrink-0 px-3 pb-3 pt-2">
          <div class="chat-input-box flex gap-2 items-end">
            <textarea
              ref="inputEl"
              v-model="draft"
              rows="1"
              placeholder="Ask about your tasks…"
              class="chat-textarea"
              @keydown.enter.exact.prevent="send"
              @input="autoResize"
            />
            <button
              class="send-btn"
              :disabled="!draft.trim() || loading"
              @click="send"
              aria-label="Send"
            >
              <SendHorizontal class="w-4 h-4" />
            </button>
          </div>
          <p class="text-[10px] text-slate-400 mt-1.5 text-center">Powered by Groq · Enter to send</p>
        </div>
      </div>
    </transition>

    <!-- Toggle button -->
    <button
      class="toggle-btn"
      :class="{ 'ring-4 ring-indigo-300/60': open }"
      aria-label="Toggle assistant"
      @click="toggle"
    >
      <transition name="icon-swap" mode="out-in">
        <MessageCircle v-if="!open" key="open" class="w-6 h-6" />
        <X v-else key="close" class="w-6 h-6" />
      </transition>

      <!-- Unread dot -->
      <span v-if="!open && unread" class="unread-dot"></span>
    </button>
  </div>
</template>

<script>
import { Sparkles, X, SendHorizontal, MessageCircle, RotateCcw, User } from 'lucide-vue-next';
import api from '@/api/api';

const GREETING = 'Hi! I\'m your task assistant. Ask me about your tasks, deadlines, or workload.';

export default {
  components: { Sparkles, X, SendHorizontal, MessageCircle, RotateCcw, User },
  data() {
    return {
      open: false,
      draft: '',
      loading: false,
      unread: false,
      conversation: [{ role: 'assistant', content: GREETING }],
      suggestions: ['What should I work on today?', 'Any overdue tasks?', 'Summarise my workload'],
    };
  },
  computed: {
    todayLabel() {
      return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    },
  },
  methods: {
    toggle() {
      this.open = !this.open;
      if (this.open) {
        this.unread = false;
        this.$nextTick(() => this.$refs.inputEl?.focus());
      }
    },
    clearChat() {
      this.conversation = [{ role: 'assistant', content: GREETING }];
    },
    autoResize() {
      const el = this.$refs.inputEl;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 96) + 'px';
    },
    async sendSuggestion(text) {
      this.draft = text;
      await this.send();
    },
    async send() {
      const text = this.draft.trim();
      if (!text || this.loading) return;

      this.conversation.push({ role: 'user', content: text });
      this.draft = '';
      this.$nextTick(() => {
        if (this.$refs.inputEl) this.$refs.inputEl.style.height = 'auto';
        this.scrollBottom();
      });

      this.loading = true;
      try {
        const apiMessages = this.conversation
          .slice(1)
          .map(m => ({ role: m.role, content: m.content }));

        const { data } = await api.post('/chat', { messages: apiMessages });
        this.conversation.push({ role: 'assistant', content: data.reply });
        if (!this.open) this.unread = true;
      } catch {
        this.conversation.push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
      } finally {
        this.loading = false;
        this.$nextTick(this.scrollBottom);
      }
    },
    scrollBottom() {
      const el = this.$refs.messagesEl;
      if (el) el.scrollTop = el.scrollHeight;
    },
  },
};
</script>

<style scoped>
/* Panel */
.chat-panel {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px -10px rgba(0,0,0,0.18), 0 4px 20px -4px rgba(0,0,0,0.08);
  border: 1px solid rgba(226,232,240,0.8);
}

/* Header */
.chat-header {
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

/* Messages */
.chat-messages {
  background: #f8fafc;
}
.user-bubble {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 2px 8px rgba(99,102,241,0.25);
}
.assistant-bubble {
  background: #ffffff;
  color: #1e293b;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

/* Typing dots */
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  display: inline-block;
  animation: bounce 1s ease-in-out infinite;
}
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

/* Suggestions */
.suggestion-chip {
  font-size: 11px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid #e0e7ff;
  background: #eef2ff;
  color: #4f46e5;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.suggestion-chip:hover {
  background: #e0e7ff;
  border-color: #c7d2fe;
}

/* Input */
.chat-input-area {
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
}
.chat-input-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 6px 6px 6px 12px;
  transition: border-color 0.15s;
}
.chat-input-box:focus-within {
  border-color: #6366f1;
}
.chat-textarea {
  flex: 1;
  resize: none;
  border: none;
  background: transparent;
  font-size: 13px;
  line-height: 1.5;
  color: #1e293b;
  outline: none;
  max-height: 96px;
  overflow-y: auto;
  padding: 4px 0;
}
.chat-textarea::placeholder { color: #94a3b8; }
.send-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s, transform 0.15s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(99,102,241,0.3);
}
.send-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.05); }
.send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* Toggle button */
.toggle-btn {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(99,102,241,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.toggle-btn:hover { transform: scale(1.08); box-shadow: 0 12px 28px rgba(99,102,241,0.45); }

/* Unread badge */
.unread-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #fff;
}

/* Animations */
.chat-pop-enter-active { animation: popIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.chat-pop-leave-active { animation: popOut 0.18s ease-in forwards; }
@keyframes popIn {
  from { opacity: 0; transform: translateY(16px) scale(0.94); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes popOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(10px) scale(0.96); }
}

.icon-swap-enter-active, .icon-swap-leave-active { transition: opacity 0.15s, transform 0.15s; }
.icon-swap-enter-from { opacity: 0; transform: rotate(-45deg) scale(0.7); }
.icon-swap-leave-to  { opacity: 0; transform: rotate(45deg) scale(0.7); }
</style>
