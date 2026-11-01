// Public browser API v5 only; no chat, filesystem, network or agent access.
export const SAMPLE = 'By lamplight, the keeper opened a book of small wonders. Across the quiet page, a silver quill traced a trail of fresh ink.\n\nNo spell was summoned from afar: these words are a local simulation. Resize the page and watch the nib find its place again.\n\nThe last star settled into the margin, and the library grew still.';
const TAG = 'grimoire-quill-prototype';

class QuillDemo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; color:#302719; font:16px/1.6 Georgia,serif; padding:clamp(12px,3vw,32px); }
        * { box-sizing:border-box; }
        .book { max-width:850px; margin:auto; background:#f4e8cb; border:1px solid #9d8050; border-radius:8px; box-shadow:0 8px 28px #0003; }
        header { padding:20px 24px 12px; border-bottom:1px solid #b69b6c; }
        h2 { margin:0; font-size:1.5rem; } p { margin:8px 0; }
        .controls { display:flex; flex-wrap:wrap; gap:8px; margin:16px 0 8px; }
        button { font:inherit; padding:6px 14px; color:#fdf4de; background:#493820; border:1px solid #493820; border-radius:4px; cursor:pointer; }
        button:focus-visible { outline:3px solid #265d82; outline-offset:3px; }
        button:disabled { opacity:.5; cursor:default; }
        .status { font:14px/1.5 system-ui,sans-serif; }
        .page { position:relative; padding:60px 52px 42px 24px; min-height:360px; overflow:hidden; }
        .text { white-space:pre-wrap; overflow-wrap:anywhere; font-size:20px; line-height:1.9; user-select:text; }
        .fresh { animation:dry 900ms ease-out both; }
        @keyframes dry { from { color:#174e64; text-shadow:0 0 3px #29749366; } to { color:#302719; text-shadow:none; } }
        .quill { position:absolute; width:62px; height:90px; pointer-events:none; user-select:none; transform:translate(0,-100%); overflow:visible; }
        [hidden] { display:none !important; }
        @media (prefers-reduced-motion:reduce) { .quill { display:none; } .fresh { animation:none; } }
        @media (max-width:420px) { header { padding:16px; } .page { padding-left:16px; padding-right:40px; } }
      </style>
      <section class="book" aria-label="Simulated quill writing demonstration">
        <header><h2>The enchanted quill</h2>
          <p>Simulated writing — not assistant output. Everything here runs locally in this panel.</p>
          <div class="controls"><button class="start" type="button">Start / Replay</button><button class="pause" type="button" disabled>Pause</button></div>
          <p class="status" role="status" aria-live="polite">Ready. Select and copy the ink as ordinary text.</p>
        </header>
        <div class="page"><div class="text" aria-label="Simulated passage"></div>
          <svg class="quill" viewBox="0 0 62 90" aria-hidden="true" hidden>
            <path d="M3 87 C14 57 13 16 58 2 C65 31 40 56 18 65 Z" fill="#e3d5b6" stroke="#795c32" stroke-width="1.5"/>
            <path d="M3 87 Q25 40 55 7 M18 57 L37 49 M24 44 L43 35 M31 31 L48 22" fill="none" stroke="#795c32" stroke-width="1.5"/>
            <path d="M0 90 L5 76 L9 79 Z" fill="#302719"/>
          </svg>
        </div>
      </section>`;
    this.text = this.shadowRoot.querySelector('.text');
    this.page = this.shadowRoot.querySelector('.page');
    this.quill = this.shadowRoot.querySelector('.quill');
    this.pauseButton = this.shadowRoot.querySelector('.pause');
    this.status = this.shadowRoot.querySelector('.status');
    this.index = 0;
    this.running = false;
    this.shadowRoot.querySelector('.start').onclick = () => this.start();
    this.pauseButton.onclick = () => this.togglePause();
    this.onMotion = () => {
      if (this.motion.matches && this.running) this.finish();
      this.position();
    };
    this.onAbort = () => this.stop();
  }
  set lifetime(signal) {
    this._lifetime?.removeEventListener('abort', this.onAbort);
    this._lifetime = signal;
    signal?.addEventListener('abort', this.onAbort, { once: true });
    if (signal?.aborted) this.stop();
  }
  connectedCallback() {
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.motion.addEventListener('change', this.onMotion);
    this.observer = new ResizeObserver(() => this.position());
    this.observer.observe(this.page);
    this._lifetime?.addEventListener('abort', this.onAbort, { once: true });
    this.position();
  }
  disconnectedCallback() {
    this.stop();
    this.observer?.disconnect();
    this.motion?.removeEventListener('change', this.onMotion);
    this._lifetime?.removeEventListener('abort', this.onAbort);
  }
  stop() {
    clearTimeout(this.timer);
    this.running = false;
    this.quill.hidden = true;
    this.pauseButton.disabled = true;
  }
  start() {
    if (!this.isConnected || this._lifetime?.aborted) return;
    this.stop();
    this.text.replaceChildren();
    this.index = 0;
    this.running = true;
    this.pauseButton.disabled = false;
    this.pauseButton.textContent = 'Pause';
    this.status.textContent = 'Writing a simulated passage…';
    if (this.motion.matches) this.finish();
    else this.tick();
  }
  tick() {
    if (!this.running || !this.isConnected) return;
    const span = document.createElement('span');
    span.textContent = SAMPLE[this.index++];
    span.className = 'fresh';
    span.addEventListener('animationend', () => span.classList.remove('fresh'), { once: true });
    this.text.append(span);
    this.position();
    if (this.index === SAMPLE.length) {
      this.stop();
      this.status.textContent = 'Simulated passage complete. Replay to try again.';
    } else this.timer = setTimeout(() => this.tick(), /[.,:]/.test(span.textContent) ? 180 : 32);
  }
  finish() {
    this.stop();
    this.text.textContent = SAMPLE;
    this.index = SAMPLE.length;
    this.status.textContent = 'Complete. Reduced motion: full passage shown without animation.';
  }
  togglePause() {
    this.running = !this.running;
    this.pauseButton.textContent = this.running ? 'Pause' : 'Resume';
    this.status.textContent = this.running ? 'Writing a simulated passage…' : 'Paused. The ink remains selectable.';
    if (this.running) {
      if (this.motion.matches) this.finish();
      else this.tick();
    } else {
      clearTimeout(this.timer);
      this.quill.hidden = true;
    }
  }
  position() {
    this.quill.hidden = !this.running || this.motion?.matches || !this.text.lastChild;
    if (this.quill.hidden) return;
    // Measure actual inline layout, including native wrapping; never inspect host DOM.
    const range = document.createRange();
    range.selectNodeContents(this.text.lastChild);
    const rects = range.getClientRects();
    const tip = rects[rects.length - 1];
    if (!tip) { this.quill.hidden = true; return; }
    const page = this.page.getBoundingClientRect();
    this.quill.style.left = `${tip.right - page.left}px`;
    this.quill.style.top = `${tip.bottom - page.top - 4}px`;
  }
}

export default {
  apiVersion: 5,
  name: 'Quill prototype (simulated)',
  activate({ html, lifetimeSignal }) {
    if (!customElements.get(TAG)) customElements.define(TAG, QuillDemo);
    return {
      contributions: {
        applicationPanels: [{
          id: 'demo', title: 'Quill (simulated)',
          render: () => html`<grimoire-quill-prototype .lifetime=${lifetimeSignal}></grimoire-quill-prototype>`,
        }],
      },
    };
  },
};
