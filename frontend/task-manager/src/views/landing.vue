<template>
  <div class="min-h-screen font-sans bg-white">

    <!-- Nav -->
    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-black text-xs tracking-tight">IT</div>
          <strong class="text-slate-900 font-bold text-base">IdealTask</strong>
        </div>
        <nav class="hidden md:flex gap-8 text-sm text-slate-500 font-medium">
          <a class="hover:text-slate-900 cursor-pointer transition">Features</a>
          <a class="hover:text-slate-900 cursor-pointer transition">How it works</a>
          <a class="hover:text-slate-900 cursor-pointer transition">Team</a>
        </nav>
        <div class="flex items-center gap-2">
          <button class="text-sm font-semibold text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 transition bg-transparent border-none cursor-pointer" @click="$router.push('/login')">Sign in</button>
          <button class="text-sm font-semibold text-white px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer border-none shadow-sm" @click="$router.push('/register')">Get started</button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse 80% 60% at 60% 40%, rgba(99,102,241,0.18) 0%, transparent 70%)"></div>
      <div class="max-w-6xl mx-auto px-6 py-24 md:py-32 grid md:grid-cols-2 gap-14 items-center relative">
        <div>
          <span class="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-6">Project management, simplified</span>
          <h1 class="text-4xl md:text-5xl font-extrabold leading-tight mb-6 tracking-tight">
            Your team's work,<br />
            <span class="text-indigo-400">all in one place.</span>
          </h1>
          <p class="text-slate-400 text-lg mb-8 leading-relaxed">Manage projects, assign tasks, track progress, and keep your team in sync — without the noise.</p>
          <div class="flex gap-3 flex-wrap">
            <button class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer border-none shadow-lg shadow-indigo-900/40" @click="$router.push('/register')">Start for free</button>
            <button class="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold transition cursor-pointer" @click="$router.push('/login')">Sign in</button>
          </div>
          <p class="mt-4 text-xs text-slate-500">No credit card required. Free to get started.</p>
        </div>

        <!-- Kanban preview card -->
        <div class="hidden md:block">
          <div class="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              <span class="text-slate-400 text-xs ml-2">Project Dashboard</span>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div v-for="col in previewCols" :key="col.label">
                <p class="text-xs font-bold uppercase tracking-wide mb-2" :class="col.labelClass">{{ col.label }}</p>
                <div class="space-y-2">
                  <div v-for="card in col.cards" :key="card.title" class="bg-white/8 border border-white/10 rounded-xl p-3">
                    <p class="text-xs text-slate-200 font-medium leading-snug">{{ card.title }}</p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" :class="card.badge">{{ card.priority }}</span>
                      <div class="w-5 h-5 rounded-full bg-indigo-500/40 border border-indigo-400/30 text-[9px] text-indigo-200 grid place-items-center font-bold">{{ card.avatar }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wave divider -->
      <div class="absolute bottom-0 left-0 right-0 h-10 bg-white" style="clip-path: ellipse(55% 100% at 50% 100%)"></div>
    </section>

    <!-- Stats -->
    <section class="max-w-6xl mx-auto px-6 py-14">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <p class="text-3xl font-black text-indigo-600 mb-1">{{ stat.value }}</p>
          <p class="text-sm text-slate-500 font-medium">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="bg-slate-50 border-y border-slate-100 py-20">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-14">
          <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Built for teams</p>
          <h2 class="text-3xl font-extrabold text-slate-900">Everything you need to ship work</h2>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <article v-for="f in features" :key="f.title" class="bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-lg transition group">
            <div class="w-11 h-11 rounded-xl mb-4 grid place-items-center text-xl" :class="f.bg">{{ f.icon }}</div>
            <h3 class="font-bold text-slate-900 mb-2 text-base">{{ f.title }}</h3>
            <p class="text-sm text-slate-500 leading-relaxed">{{ f.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="max-w-6xl mx-auto px-6 py-20">
      <div class="text-center mb-14">
        <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Simple process</p>
        <h2 class="text-3xl font-extrabold text-slate-900">Up and running in minutes</h2>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        <div class="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
        <article v-for="step in steps" :key="step.num" class="text-center relative">
          <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-xl grid place-items-center mx-auto mb-5 shadow-lg shadow-indigo-200">{{ step.num }}</div>
          <h4 class="font-bold text-slate-900 mb-2">{{ step.title }}</h4>
          <p class="text-sm text-slate-500 leading-relaxed">{{ step.desc }}</p>
        </article>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="bg-slate-50 border-y border-slate-100 py-20">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-3xl font-extrabold text-slate-900 mb-12 text-center">Trusted by productive teams</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <article v-for="q in quotes" :key="q.author" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div class="flex gap-1 mb-4">
              <span v-for="i in 5" :key="i" class="text-amber-400 text-sm">★</span>
            </div>
            <p class="text-slate-700 mb-5 leading-relaxed text-sm">"{{ q.text }}"</p>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm grid place-items-center shrink-0">{{ q.author.charAt(0) }}</div>
              <div>
                <p class="text-sm font-bold text-slate-800">{{ q.author }}</p>
                <p class="text-xs text-slate-400">{{ q.role }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-6xl mx-auto px-6 py-20">
      <div class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-12 text-center text-white shadow-2xl">
        <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5"></div>
        <div class="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5"></div>
        <div class="relative">
          <h2 class="text-3xl md:text-4xl font-extrabold mb-3">Ready to get organized?</h2>
          <p class="text-indigo-200 mb-8 text-base">Projects, tasks, members, and messages — all in one clean workspace.</p>
          <div class="flex gap-3 justify-center flex-wrap">
            <button class="px-8 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition cursor-pointer border-none shadow-lg" @click="$router.push('/register')">Create free account</button>
            <button class="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition cursor-pointer" @click="$router.push('/login')">Sign in instead</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-100 py-8">
      <div class="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-indigo-600 grid place-items-center text-white font-black text-[10px]">IT</div>
          <span class="text-sm font-bold text-slate-700">IdealTask</span>
        </div>
        <p class="text-xs text-slate-400">© {{ new Date().getFullYear() }} IdealTask. All rights reserved.</p>
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
          label: 'Todo', labelClass: 'text-slate-400',
          cards: [
            { title: 'Update API docs', priority: 'Low', badge: 'bg-slate-700 text-slate-300', avatar: 'A' },
            { title: 'Design review', priority: 'High', badge: 'bg-red-900/60 text-red-300', avatar: 'B' },
          ]
        },
        {
          label: 'In Progress', labelClass: 'text-amber-400',
          cards: [
            { title: 'Auth flow redesign', priority: 'High', badge: 'bg-red-900/60 text-red-300', avatar: 'C' },
            { title: 'Write unit tests', priority: 'Med', badge: 'bg-amber-900/60 text-amber-300', avatar: 'A' },
          ]
        },
        {
          label: 'Done', labelClass: 'text-green-400',
          cards: [
            { title: 'Set up CI pipeline', priority: 'Med', badge: 'bg-amber-900/60 text-amber-300', avatar: 'D' },
            { title: 'Onboard new dev', priority: 'Low', badge: 'bg-slate-700 text-slate-300', avatar: 'B' },
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
        { icon: '🗂️', bg: 'bg-indigo-50', title: 'Kanban Board', desc: 'Drag tasks across Todo, In Progress, and Done columns to visualize your team\'s workflow at a glance.' },
        { icon: '📁', bg: 'bg-violet-50', title: 'Project Workspaces', desc: 'Each admin manages their own isolated projects and team members — clean and conflict-free.' },
        { icon: '👥', bg: 'bg-sky-50', title: 'Team Roles', desc: 'Admins control structure and assignments. Members focus purely on executing their work.' },
        { icon: '🔔', bg: 'bg-amber-50', title: 'Smart Notifications', desc: 'Get notified when you\'re assigned a task, a deadline approaches, or a teammate completes work.' },
        { icon: '✉️', bg: 'bg-green-50', title: 'Built-in Messaging', desc: 'Send emails directly from your workspace using your own SMTP account.' },
        { icon: '📊', bg: 'bg-rose-50', title: 'Live Dashboard', desc: 'Charts, team productivity stats, project progress, and throughput — all in one view.' },
      ],
      steps: [
        { num: '1', title: 'Create an account', desc: 'Sign up as an admin and set up your workspace in seconds.' },
        { num: '2', title: 'Add your team', desc: 'Invite members and organize them into projects.' },
        { num: '3', title: 'Assign tasks', desc: 'Create tasks, set priorities and due dates, and assign them to the right people.' },
        { num: '4', title: 'Ship together', desc: 'Track progress on the board and get notified as work gets done.' },
      ],
      quotes: [
        { text: 'Our sprint planning went from a messy spreadsheet to a clean board in one afternoon. The team actually enjoys updating tasks now.', author: 'Sarah K.', role: 'Product Manager' },
        { text: 'The role system is exactly what we needed. Admins plan, devs execute — no more accidental task deletions.', author: 'Marcus T.', role: 'Engineering Lead' },
        { text: 'Notifications and the dashboard keep me on top of every project without having to chase anyone for updates.', author: 'Lena R.', role: 'Team Lead' },
      ]
    };
  }
};
</script>
