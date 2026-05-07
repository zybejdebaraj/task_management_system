<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

    <!-- Chat panel -->
    <transition name="chat-pop">
      <div v-if="open" class="chat-panel flex flex-col overflow-hidden" style="width:370px;height:540px">

        <!-- Header -->
        <div class="chat-header shrink-0">
          <div class="flex items-center gap-3">
            <div class="bot-avatar">
              <Sparkles class="w-4 h-4 text-white" />
            </div>
            <div>
              <p class="text-sm font-bold text-white leading-tight">Task Assistant</p>
              <p class="text-[11px] font-medium flex items-center gap-1 text-indigo-200">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Online · Powered by Groq
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button class="header-btn" title="Clear chat" @click="clearChat">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
            <button class="header-btn" aria-label="Close" @click="open = false">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div ref="messagesEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-messages">

          <div class="flex justify-center mb-2">
            <span class="date-chip">{{ todayLabel }}</span>
          </div>

          <div
            v-for="(msg, i) in conversation"
            :key="i"
            :class="['flex gap-2 items-end', msg.role === 'user' ? 'justify-end' : 'justify-start']"
          >
            <div v-if="msg.role === 'assistant'" class="bot-icon shrink-0">
              <Sparkles class="w-3 h-3 text-indigo-500" />
            </div>

            <div
              :class="[
                'msg-bubble text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'
              ]"
            >{{ msg.content }}</div>

            <div v-if="msg.role === 'user'" class="user-icon shrink-0">
              <User class="w-3 h-3 text-white" />
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="loading" class="flex gap-2 items-end justify-start">
            <div class="bot-icon shrink-0">
              <Sparkles class="w-3 h-3 text-indigo-500" />
            </div>
            <div class="assistant-bubble msg-bubble flex gap-1.5 items-center px-4 py-3">
              <span class="dot"></span>
              <span class="dot" style="animation-delay:0.15s"></span>
              <span class="dot" style="animation-delay:0.3s"></span>
            </div>
          </div>
        </div>

        <!-- Suggestions -->
        <div v-if="conversation.length === 1 && !loading" class="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0 suggestions-area">
          <button
            v-for="s in suggestions"
            :key="s"
            class="suggestion-chip"
            @click="sendSuggestion(s)"
          >{{ s }}</button>
        </div>

        <!-- Input -->
        <div class="chat-footer shrink-0 px-3 pb-3 pt-2">
          <div class="input-row">
            <textarea
              ref="inputEl"
              v-model="draft"
              rows="1"
              placeholder="Message Task Assistant…"
              class="chat-input outline-none ring-0 border-none shadow-none"
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
          <p class="text-[10px] text-center mt-1.5 footer-hint">Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </transition>

    <!-- Toggle FAB -->
    <button
      class="fab-btn"
      :class="{ 'fab-open': open }"
      aria-label="Toggle assistant"
      @click="toggle"
    >
      <transition name="icon-swap" mode="out-in">
        <MessageCircle v-if="!open" key="open" class="w-6 h-6" />
        <X v-else key="close" class="w-6 h-6" />
      </transition>
      <span v-if="!open && unread" class="unread-badge"></span>
    </button>

  </div>
</template>

<script>
import { Sparkles, X, SendHorizontal, MessageCircle, RotateCcw, User } from 'lucide-vue-next';
import api from '@/api/api';

const GREETING = "Hi! I'm your Task Assistant 👋\nAsk me about your tasks, deadlines, or anything about your workload.";

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
      return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
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
        const apiMessages = this.conversation.slice(1).map(m => ({ role: m.role, content: m.content }));
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
/* ── CSS variables ────────────────────────────── */
.chat-panel {
  --panel-bg:       #ffffff;
  --msg-bg:         #f1f5f9;
  --bubble-bg:      #ffffff;
  --bubble-border:  #e2e8f0;
  --bubble-color:   #1e293b;
  --input-area-bg:  #ffffff;
  --input-bg:       #f8fafc;
  --input-border:   #e2e8f0;
  --input-color:    #1e293b;
  --footer-hint:    #94a3b8;
  --date-bg:        #e2e8f0;
  --date-color:     #64748b;
  --icon-btn-hover: #f1f5f9;
  --suggestion-bg:  #eef2ff;
  --suggestion-border: #c7d2fe;
  --suggestion-color: #4f46e5;
}
:global(.dark) .chat-panel {
  --panel-bg:       #1e293b;
  --msg-bg:         #0f172a;
  --bubble-bg:      #1e293b;
  --bubble-border:  #334155;
  --bubble-color:   #e2e8f0;
  --input-area-bg:  #1e293b;
  --input-bg:       #0f172a;
  --input-border:   #475569;
  --input-color:    #f1f5f9;
  --footer-hint:    #64748b;
  --date-bg:        #1e293b;
  --date-color:     #94a3b8;
  --icon-btn-hover: #334155;
  --suggestion-bg:  #1e2a4a;
  --suggestion-border: #4338ca;
  --suggestion-color: #a5b4fc;
}

/* ── Panel ────────────────────────────────────── */
.chat-panel {
  background: var(--panel-bg);
  border-radius: 22px;
  box-shadow: 0 24px 64px -12px rgba(0,0,0,0.2), 0 8px 24px -4px rgba(0,0,0,0.1);
  border: 1px solid rgba(99,102,241,0.15);
  overflow: hidden;
}

/* ── Header ───────────────────────────────────── */
.chat-header {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bot-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.header-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.header-btn:hover { background: rgba(255,255,255,0.22); color: #fff; }

/* ── Messages ─────────────────────────────────── */
.chat-messages { background: var(--msg-bg); }

.date-chip {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--date-bg);
  color: var(--date-color);
  letter-spacing: 0.3px;
}

.bot-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.msg-bubble { padding: 10px 14px; max-width: 82%; }

.user-bubble {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}
.assistant-bubble {
  background: var(--bubble-bg);
  color: var(--bubble-color);
  border-radius: 18px 18px 18px 4px;
  border: 1px solid var(--bubble-border);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* ── Typing dots ──────────────────────────────── */
.dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  display: inline-block;
  animation: bounce 1.1s ease-in-out infinite;
}
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* ── Suggestions ──────────────────────────────── */
.suggestions-area { border-top: 1px solid var(--bubble-border); padding-top: 10px; }
.suggestion-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--suggestion-border);
  background: var(--suggestion-bg);
  color: var(--suggestion-color);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.suggestion-chip:hover {
  filter: brightness(0.93);
  transform: translateY(-1px);
}

/* ── Input ────────────────────────────────────── */
.chat-footer {
  background: var(--input-area-bg);
  border-top: 1px solid var(--bubble-border);
}
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--input-bg);
  border: 1.5px solid var(--input-border);
  border-radius: 16px;
  padding: 6px 6px 6px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-row:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
.chat-input {
  flex: 1;
  resize: none;
  border: none;
  background: transparent;
  font-size: 13px;
  line-height: 1.55;
  color: var(--input-color);
  outline: none;
  max-height: 96px;
  overflow-y: auto;
  padding: 3px 0;
  font-family: inherit;
}
.chat-input::placeholder { color: var(--footer-hint); }
.chat-input:focus { outline: none !important; box-shadow: none !important; border: none !important; }
.footer-hint { color: var(--footer-hint); }

.send-btn {
  width: 36px; height: 36px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(99,102,241,0.35);
  transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
}
.send-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: scale(1.06);
  box-shadow: 0 4px 14px rgba(99,102,241,0.4);
}
.send-btn:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }

/* ── FAB toggle ───────────────────────────────── */
.fab-btn {
  position: relative;
  width: 58px; height: 58px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 28px rgba(99,102,241,0.45);
  transition: transform 0.2s, box-shadow 0.2s;
}
.fab-btn:hover { transform: scale(1.09); box-shadow: 0 12px 32px rgba(99,102,241,0.5); }
.fab-open { box-shadow: 0 4px 16px rgba(99,102,241,0.35); }

.unread-badge {
  position: absolute;
  top: 5px; right: 5px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #fff;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* ── Animations ───────────────────────────────── */
.chat-pop-enter-active { animation: popIn 0.28s cubic-bezier(0.34,1.56,0.64,1); }
.chat-pop-leave-active { animation: popOut 0.18s ease-in forwards; }
@keyframes popIn {
  from { opacity: 0; transform: translateY(20px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes popOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(12px) scale(0.95); }
}
.icon-swap-enter-active, .icon-swap-leave-active { transition: opacity 0.15s, transform 0.15s; }
.icon-swap-enter-from { opacity: 0; transform: rotate(-45deg) scale(0.7); }
.icon-swap-leave-to   { opacity: 0; transform: rotate(45deg) scale(0.7); }
</style>
