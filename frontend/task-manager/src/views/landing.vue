<template>
  <div class="min-h-screen bg-slate-50 font-sans">

    <!-- Nav -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-bold text-xs">TM</div>
          <strong class="text-slate-900 font-bold">Task Manager</strong>
        </div>
        <nav class="hidden md:flex gap-6 text-sm text-slate-600 font-medium">
          <a class="hover:text-indigo-600 cursor-pointer transition">Features</a>
          <a class="hover:text-indigo-600 cursor-pointer transition">Solutions</a>
          <a class="hover:text-indigo-600 cursor-pointer transition">Pricing</a>
        </nav>
        <div class="flex items-center gap-3">
          <button class="text-sm font-semibold text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition bg-transparent border-none cursor-pointer" @click="$router.push('/login')">Log in</button>
          <button class="text-sm font-semibold text-white px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer border-none" @click="$router.push('/register')">Get started free</button>
        </div>
      </div>
    </header>

    <!-- Notice banner -->
    <div class="bg-indigo-50 border-b border-indigo-100 text-center py-2 text-sm text-indigo-700 font-medium">
      New: AI-assisted task prioritisation is now available for all plans.
    </div>

    <!-- Hero -->
    <section class="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h1 class="text-5xl font-extrabold text-slate-900 leading-tight mb-5">Capture, organize, and ship work faster.</h1>
        <p class="text-lg text-slate-500 mb-8">Escape the chaos — bring projects, tasks, and your team into one clean workspace.</p>
        <div class="flex gap-3 flex-wrap">
          <button class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer border-none" @click="$router.push('/register')">Start for free</button>
          <button class="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition cursor-pointer" @click="$router.push('/login')">Sign in</button>
        </div>
        <p class="mt-4 text-xs text-slate-400">No credit card required.</p>
      </div>
      <!-- Mock UI preview -->
      <div class="bg-slate-900 rounded-2xl p-5 shadow-2xl hidden md:block">
        <p class="text-white font-bold mb-3 text-sm">My Tasks</p>
        <div class="space-y-2">
          <div v-for="item in previewTasks" :key="item.label" class="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
            <span :class="['w-2 h-2 rounded-full shrink-0', item.dot]"></span>
            <span class="text-sm text-slate-200 flex-1">{{ item.label }}</span>
            <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', item.badge]">{{ item.status }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features grid -->
    <section class="bg-white border-y border-slate-200 py-16">
      <div class="max-w-6xl mx-auto px-6">
        <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">What you get</p>
        <h2 class="text-3xl font-extrabold text-slate-900 mb-10">Everything your team needs</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <article v-for="f in features" :key="f.title" class="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 grid place-items-center mb-4 text-xl">{{ f.icon }}</div>
            <h3 class="font-bold text-slate-900 mb-2">{{ f.title }}</h3>
            <p class="text-sm text-slate-500">{{ f.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Steps -->
    <section class="max-w-6xl mx-auto px-6 py-16">
      <h2 class="text-3xl font-extrabold text-slate-900 mb-10 text-center">How it works</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <article v-for="step in steps" :key="step.num" class="bg-white rounded-2xl border border-slate-200 p-5">
          <span class="text-2xl font-black text-indigo-600 mb-3 block">{{ step.num }}</span>
          <h4 class="font-bold text-slate-900 mb-1">{{ step.title }}</h4>
          <p class="text-sm text-slate-500">{{ step.desc }}</p>
        </article>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="bg-white border-y border-slate-200 py-16">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-3xl font-extrabold text-slate-900 mb-10 text-center">What teams say</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <article v-for="q in quotes" :key="q.author" class="p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <p class="text-slate-600 mb-4 italic">"{{ q.text }}"</p>
            <strong class="text-sm text-slate-800">— {{ q.author }}</strong>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-6xl mx-auto px-6 py-16">
      <div class="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-12 text-center text-white shadow-xl">
        <h2 class="text-3xl font-extrabold mb-3">Start organizing your team today</h2>
        <p class="text-indigo-200 mb-8">Projects, tasks, members, and communication — all in one place.</p>
        <button class="px-8 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition cursor-pointer border-none" @click="$router.push('/register')">Create free account</button>
      </div>
    </section>

  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      previewTasks: [
        { label: 'Design new onboarding flow', status: 'In Progress', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
        { label: 'Fix login redirect bug', status: 'Todo', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
        { label: 'Write release notes', status: 'Done', dot: 'bg-green-400', badge: 'bg-green-100 text-green-700' },
      ],
      features: [
        { icon: '📋', title: 'Kanban Boards', desc: 'Visualize every stage from Todo to Done and keep delivery predictable.' },
        { icon: '📁', title: 'Project Workspaces', desc: 'Organize teams by project and keep tasks grouped by business goals.' },
        { icon: '🔒', title: 'Role Permissions', desc: 'Admins manage structure while members focus on execution.' },
        { icon: '✉️', title: 'SMTP Mail Center', desc: 'Send template-based email updates directly from your workspace.' },
      ],
      steps: [
        { num: '01', title: 'Create Project', desc: 'Admins set up projects and invite members.' },
        { num: '02', title: 'Plan Tasks', desc: 'Break work into clear, trackable task cards.' },
        { num: '03', title: 'Track Progress', desc: 'Move tasks across board columns in real time.' },
        { num: '04', title: 'Communicate', desc: 'Send updates with built-in email and SMTP templates.' },
      ],
      quotes: [
        { text: 'Our weekly planning is now one smooth workflow. No more scattered docs.', author: 'Product Team' },
        { text: 'Role access and board views made handoffs cleaner across our developers.', author: 'Engineering Lead' },
        { text: 'Email templates save us hours every sprint when sending stakeholder updates.', author: 'Project Manager' },
      ]
    };
  }
};
</script>
