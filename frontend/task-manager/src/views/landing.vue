<template>
  <div class="landing">
    <header class="top-nav">
      <div class="container nav-inner">
        <div class="brand">
          <div class="logo">TM</div>
          <strong>Task Manager</strong>
        </div>
        <nav class="links">
          <a>Features</a>
          <a>Solutions</a>
          <a>Plans</a>
          <a>Pricing</a>
          <a>Resources</a>
        </nav>
        <div class="actions">
          <button class="link-btn" @click="$router.push('/login')">Log in</button>
          <button class="cta-btn" @click="$router.push('/register')">Get Task Manager free</button>
        </div>
      </div>
    </header>

    <div class="notice">
      <div class="container">Accelerate your team's work with AI features - now available for all plans.</div>
    </div>

    <section class="hero container">
      <div class="hero-copy">
        <h1>Capture, organize, and tackle your to-dos from anywhere.</h1>
        <p>Escape the clutter and chaos - unleash your productivity with Task Manager.</p>
        <div class="signup">
          <input v-model="email" placeholder="Email" />
          <button @click="$router.push('/register')">Sign up - it's free!</button>
        </div>
        <small>By entering your email, you acknowledge our Privacy Policy.</small>
      </div>
      <div class="hero-art">
        <div class="phone">
          <div class="screen-head">Inbox</div>
          <div class="screen-list">
            <span>Try AI in Task Manager</span>
            <span>Prepare campaign update</span>
            <span>Fix login issue</span>
            <span>Post release notes</span>
          </div>
        </div>
      </div>
    </section>

    <section class="intro container">
      <p class="eyebrow">TASK MANAGER 101</p>
      <h2>Your productivity powerhouse</h2>
      <p>
        Stay organized and efficient with Inbox, Boards, and Planner. Every task, idea, or responsibility finds its
        place and keeps you at the top of your game.
      </p>
    </section>

    <section class="feature-grid container">
      <article class="feature-card">
        <h3>Kanban Boards</h3>
        <p>Visualize every stage from Todo to Done and keep delivery predictable.</p>
      </article>
      <article class="feature-card">
        <h3>Project Workspaces</h3>
        <p>Organize teams by project and keep tasks grouped by business goals.</p>
      </article>
      <article class="feature-card">
        <h3>Role Permissions</h3>
        <p>Admins manage structure while members focus on execution.</p>
      </article>
      <article class="feature-card">
        <h3>SMTP Mail Center</h3>
        <p>Send template-based email updates directly from your workspace.</p>
      </article>
    </section>

    <section class="workflow container">
      <h2>How teams use Task Manager</h2>
      <div class="steps">
        <article>
          <span>01</span>
          <h4>Create Project</h4>
          <p>Admins set up projects and invite members.</p>
        </article>
        <article>
          <span>02</span>
          <h4>Plan Tasks</h4>
          <p>Break work into clear, trackable task cards.</p>
        </article>
        <article>
          <span>03</span>
          <h4>Track Progress</h4>
          <p>Move tasks across board columns in real time.</p>
        </article>
        <article>
          <span>04</span>
          <h4>Communicate</h4>
          <p>Send updates with built-in email templates and SMTP.</p>
        </article>
      </div>
    </section>

    <section class="testimonials container">
      <h2>What teams say</h2>
      <div class="quotes">
        <article>
          <p>"Our weekly planning is now one smooth workflow. No more scattered docs."</p>
          <strong>- Product Team</strong>
        </article>
        <article>
          <p>"Role access and board views made handoffs cleaner across our developers."</p>
          <strong>- Engineering Lead</strong>
        </article>
        <article>
          <p>"Email templates save us hours every sprint when sending stakeholder updates."</p>
          <strong>- Project Manager</strong>
        </article>
      </div>
    </section>

    <section class="faq container">
      <h2>Frequently asked questions</h2>
      <div class="faq-list">
        <article>
          <h4>Can members create projects?</h4>
          <p>No. Only admins can create and manage projects.</p>
        </article>
        <article>
          <h4>Do I need external email tools?</h4>
          <p>No. You can connect SMTP and send directly from the Inbox/Email page.</p>
        </article>
        <article>
          <h4>Is this suitable for small teams?</h4>
          <p>Yes. It works for small teams and scales with multiple projects.</p>
        </article>
      </div>
    </section>

    <section class="final-cta container">
      <h2>Start organizing your team today</h2>
      <p>Bring projects, tasks, members, and communication into one place.</p>
      <div class="cta-actions">
        <button @click="$router.push('/register')">Create free account</button>
        <button class="ghost" @click="$router.push('/login')">I already have an account</button>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return { email: '' };
  }
};
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background: #f4f5f7;
}

.container {
  width: min(1200px, 92vw);
  margin: 0 auto;
}

.top-nav {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.nav-inner {
  min-height: 64px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #0052cc;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.links {
  display: flex;
  gap: 16px;
  color: #334155;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 10px;
}

.link-btn {
  background: transparent;
  color: #0f172a;
}

.link-btn:hover {
  background: #eef2f7;
}

.cta-btn {
  background: #0065ff;
}

.cta-btn:hover {
  background: #0052cc;
}

.notice {
  background: #dbeafe;
  color: #334155;
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
}

.hero {
  margin-top: 26px;
  display: grid;
  grid-template-columns: 1fr 0.95fr;
  align-items: center;
  gap: 24px;
}

.hero-copy h1 {
  font-size: 56px;
  line-height: 1.06;
  color: #1e293b;
  margin-bottom: 14px;
}

.hero-copy p {
  color: #64748b;
  font-size: 21px;
  margin-bottom: 16px;
}

.signup {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  max-width: 560px;
}

.signup input {
  background: #fff;
  border: 1px solid #dbe1e8;
  border-radius: 6px;
}

.signup button {
  white-space: nowrap;
  border-radius: 6px;
  background: #0065ff;
}

.signup button:hover {
  background: #0052cc;
}

small {
  color: #64748b;
  font-size: 12px;
}

.hero-art {
  display: flex;
  justify-content: center;
}

.phone {
  width: 320px;
  border-radius: 32px;
  background: #111827;
  padding: 12px;
  box-shadow: 0 20px 35px rgba(15, 23, 42, 0.24);
}

.screen-head {
  color: #fff;
  font-weight: 700;
  margin: 4px 8px 10px;
}

.screen-list {
  background: #fff;
  border-radius: 14px;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.screen-list span {
  font-size: 13px;
  padding: 8px;
  border-radius: 8px;
  background: #dbeafe;
}

.intro {
  margin-top: 26px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.eyebrow {
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.intro h2 {
  font-size: 44px;
  margin-bottom: 12px;
  color: #1e293b;
}

.intro p {
  color: #64748b;
  font-size: 20px;
  max-width: 860px;
}

.feature-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.feature-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}

.feature-card h3 {
  margin-bottom: 8px;
  color: #1e293b;
}

.feature-card p {
  color: #64748b;
}

.workflow {
  margin-top: 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.workflow h2 {
  margin-bottom: 12px;
}

.steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.steps article {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #f8fafc;
}

.steps span {
  display: inline-block;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 6px;
}

.steps h4 {
  margin-bottom: 6px;
}

.steps p {
  color: #64748b;
  font-size: 14px;
}

.testimonials {
  margin-top: 18px;
}

.testimonials h2 {
  margin-bottom: 12px;
}

.quotes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.quotes article {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}

.quotes p {
  color: #475569;
  margin-bottom: 10px;
}

.faq {
  margin-top: 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.faq h2 {
  margin-bottom: 12px;
}

.faq-list {
  display: grid;
  gap: 10px;
}

.faq-list article {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}

.faq-list h4 {
  margin-bottom: 6px;
}

.faq-list p {
  color: #64748b;
}

.final-cta {
  margin-top: 18px;
  margin-bottom: 30px;
  text-align: center;
  background: linear-gradient(135deg, #312e81 0%, #4f46e5 100%);
  color: #fff;
  border-radius: 14px;
  padding: 24px;
}

.final-cta p {
  margin-top: 8px;
  color: #dbeafe;
}

.cta-actions {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 1020px) {
  .nav-inner {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 10px 0;
  }

  .links {
    flex-wrap: wrap;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-copy h1 {
    font-size: 40px;
  }

  .hero-copy p,
  .intro p {
    font-size: 18px;
  }

  .signup {
    flex-direction: column;
  }

  .intro h2 {
    font-size: 34px;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quotes {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .feature-grid,
  .steps,
  .cta-actions {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>
