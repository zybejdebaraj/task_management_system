<template>
  <div class="min-h-screen font-sans bg-[#0a0a0f] text-white overflow-x-hidden">

    <!-- Nav -->
    <header class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 h-16 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 grid place-items-center font-black text-xs text-white shrink-0">TF</div>
        <span class="font-bold text-white text-base tracking-tight">TaskFlow</span>
      </div>
      <nav class="hidden md:flex gap-8 text-sm text-white/50 font-medium">
        <a class="hover:text-white transition cursor-pointer">Features</a>
        <a class="hover:text-white transition cursor-pointer">How it works</a>
        <a class="hover:text-white transition cursor-pointer">Pricing</a>
      </nav>
      <div class="flex items-center gap-2">
        <button class="text-sm font-semibold text-white/60 hover:text-white px-4 py-2 rounded-lg transition bg-transparent border-none cursor-pointer" @click="$router.push('/login')">Sign in</button>
        <button class="text-sm font-semibold text-white px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition cursor-pointer border-none" @click="$router.push('/register')">Get started</button>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
      <!-- Background glow -->
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"></div>
      <div class="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

      <div class="relative max-w-4xl mx-auto">
        <span class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
          Now in beta — free for teams
        </span>

        <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter mb-6">
          Ship work<br />
          <span class="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">faster, together.</span>
        </h1>

        <p class="text-white/50 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          TaskFlow brings your projects, tasks, and team into one clean workspace — so nothing gets lost and everyone stays in sync.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button class="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base transition cursor-pointer border-none shadow-lg shadow-violet-900/50" @click="$router.push('/register')">
            Start free today
          </button>
          <button class="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-base transition cursor-pointer" @click="$router.push('/login')">
            Sign in
          </button>
        </div>
      </div>

      <!-- Dashboard mockup -->
      <div class="relative mt-16 w-full max-w-5xl mx-auto">
        <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none" style="top: 60%"></div>
        <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-sm">
          <!-- Mock header bar -->
          <div class="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/3">
            <div class="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-amber-500/60"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
            <span class="ml-3 text-white/30 text-xs font-mono">taskflow.app / dashboard</span>
          </div>
          <!-- Mock content -->
          <div class="grid grid-cols-3 gap-3 p-4">
            <div v-for="col in previewCols" :key="col.label" class="space-y-2">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full" :class="col.dot"></div>
                <p class="text-xs font-bold uppercase tracking-widest" :class="col.labelClass">{{ col.label }}</p>
                <span class="ml-auto text-xs text-white/20">{{ col.cards.length }}</span>
              </div>
              <div v-for="card in col.cards" :key="card.title" class="bg-white/5 border border-white/8 rounded-xl p-3 hover:border-white/15 transition">
                <p class="text-xs text-white/80 font-medium leading-snug mb-2">{{ card.title }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="card.badge">{{ card.priority }}</span>
                  <div class="w-5 h-5 rounded-full text-[9px] font-bold grid place-items-center" :class="card.avatarClass">{{ card.avatar }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats bar -->
    <section class="border-y border-white/5 py-10 bg-white/[0.02]">
      <div class="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <p class="text-3xl sm:text-4xl font-black text-white mb-1">{{ stat.value }}</p>
          <p class="text-xs sm:text-sm text-white/40 font-medium">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-24 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-xs font-bold uppercase tracking-widest text-violet-400 mb-4">Built for real teams</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">Everything in one place.</h2>
        </div>

        <!-- Feature grid: 2 big + 4 small -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <article v-for="(f, i) in features" :key="f.title"
            :class="['rounded-2xl border p-6 sm:p-8 transition group', i < 2 ? 'lg:col-span-1 border-white/10 bg-white/[0.04] hover:bg-white/[0.07]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]']">
            <div class="text-3xl mb-4">{{ f.icon }}</div>
            <h3 class="font-bold text-white text-lg mb-2">{{ f.title }}</h3>
            <p class="text-sm text-white/40 leading-relaxed">{{ f.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-24 px-4 bg-white/[0.02] border-y border-white/5">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-xs font-bold uppercase tracking-widest text-violet-400 mb-4">Simple process</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">Up in minutes.</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="step in steps" :key="step.num" class="relative">
            <div class="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 font-black text-lg grid place-items-center mb-4">{{ step.num }}</div>
            <h4 class="font-bold text-white text-base mb-2">{{ step.title }}</h4>
            <p class="text-sm text-white/40 leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-24 px-4">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl sm:text-4xl font-black text-white text-center mb-14 tracking-tight">Teams love TaskFlow.</h2>
        <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <article v-for="q in quotes" :key="q.author" class="bg-white/[0.04] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition">
            <div class="flex gap-0.5 mb-4">
              <span v-for="i in 5" :key="i" class="text-amber-400 text-sm">★</span>
            </div>
            <p class="text-white/70 text-sm leading-relaxed mb-5">"{{ q.text }}"</p>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-violet-600/30 text-violet-300 font-bold text-sm grid place-items-center shrink-0">{{ q.author.charAt(0) }}</div>
              <div>
                <p class="text-sm font-bold text-white">{{ q.author }}</p>
                <p class="text-xs text-white/30">{{ q.role }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4">
      <div class="max-w-3xl mx-auto text-center">
        <div class="relative bg-gradient-to-br from-violet-600/30 to-indigo-600/20 border border-violet-500/20 rounded-3xl p-10 sm:p-16 overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-events-none"></div>
          <div class="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-violet-500/10 blur-[60px]"></div>
          <div class="relative">
            <h2 class="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Ready to flow?</h2>
            <p class="text-white/50 text-base sm:text-lg mb-8 max-w-md mx-auto">Join teams already shipping faster with TaskFlow. Free to start, no card needed.</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button class="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base transition cursor-pointer border-none shadow-xl shadow-violet-900/40" @click="$router.push('/register')">Create free account</button>
              <button class="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-base transition cursor-pointer" @click="$router.push('/login')">Sign in instead</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/5 py-8 px-6 sm:px-10">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-2.5">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 grid place-items-center text-white font-black text-[10px]">TF</div>
          <span class="text-sm font-bold text-white/70">TaskFlow</span>
        </div>
        <p class="text-xs text-white/25">© {{ new Date().getFullYear() }} TaskFlow. All rights reserved.</p>
      </div>
    </footer>

  </div>
</template>

<script>
export default {
  data() {
    return {
      previewCols: [
        {
          label: 'To Do', labelClass: 'text-white/40', dot: 'bg-white/20',
          cards: [
            { title: 'Update API docs', priority: 'Low', badge: 'bg-white/10 text-white/50', avatar: 'A', avatarClass: 'bg-slate-600/50 text-white/60' },
            { title: 'Design review', priority: 'High', badge: 'bg-red-500/20 text-red-400', avatar: 'B', avatarClass: 'bg-pink-600/40 text-pink-300' },
          ]
        },
        {
          label: 'In Progress', labelClass: 'text-amber-400', dot: 'bg-amber-400',
          cards: [
            { title: 'Auth flow redesign', priority: 'High', badge: 'bg-red-500/20 text-red-400', avatar: 'C', avatarClass: 'bg-violet-600/40 text-violet-300' },
            { title: 'Write unit tests', priority: 'Med', badge: 'bg-amber-500/20 text-amber-400', avatar: 'A', avatarClass: 'bg-slate-600/50 text-white/60' },
          ]
        },
        {
          label: 'Done', labelClass: 'text-emerald-400', dot: 'bg-emerald-400',
          cards: [
            { title: 'Set up CI pipeline', priority: 'Med', badge: 'bg-amber-500/20 text-amber-400', avatar: 'D', avatarClass: 'bg-sky-600/40 text-sky-300' },
            { title: 'Onboard new dev', priority: 'Low', badge: 'bg-white/10 text-white/50', avatar: 'B', avatarClass: 'bg-pink-600/40 text-pink-300' },
          ]
        },
      ],
      stats: [
        { value: '10k+', label: 'Tasks completed' },
        { value: '500+', label: 'Teams using it' },
        { value: '99.9%', label: 'Uptime' },
        { value: '4.9★', label: 'Average rating' },
      ],
      features: [
        { icon: '🗂️', title: 'Kanban Board', desc: 'Visualize work across Todo, In Progress, and Done. Drag, drop, and ship.' },
        { icon: '📁', title: 'Project Workspaces', desc: 'Isolated projects per admin — clean structure, zero overlap between teams.' },
        { icon: '👥', title: 'Team Roles', desc: 'Admins plan. Members execute. Clear separation, no accidental changes.' },
        { icon: '🔔', title: 'Smart Notifications', desc: 'Get pinged on assignment, deadlines, and completions — only what matters.' },
        { icon: '✉️', title: 'Built-in Messaging', desc: 'Send emails straight from your workspace with your own SMTP settings.' },
        { icon: '📊', title: 'Live Dashboard', desc: 'Team stats, project health, and throughput — all visible at a glance.' },
      ],
      steps: [
        { num: '1', title: 'Create account', desc: 'Sign up as admin and set up your workspace in under a minute.' },
        { num: '2', title: 'Invite your team', desc: 'Send invite links. Members join and see their tasks instantly.' },
        { num: '3', title: 'Assign & prioritize', desc: 'Create tasks, set deadlines, and assign the right people.' },
        { num: '4', title: 'Track & ship', desc: 'Watch progress live on the board and get notified as work moves forward.' },
      ],
      quotes: [
        { text: 'Sprint planning went from a chaotic spreadsheet to a clean board in one afternoon.', author: 'Sarah K.', role: 'Product Manager' },
        { text: 'The role system is exactly what we needed — admins plan, devs execute, no mess.', author: 'Marcus T.', role: 'Engineering Lead' },
        { text: "I can see every project's progress without chasing anyone for updates. Game changer.", author: 'Lena R.', role: 'Team Lead' },
      ]
    };
  }
};
</script>
