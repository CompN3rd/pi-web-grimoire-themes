// This fixture intentionally uses public theme hooks, not private app imports.
const base = `@layer pi-web-base {
  :host { display: block; color: var(--pi-text); font: 16px/1.6 var(--pi-font); }
  * { box-sizing: border-box; }
  button, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; background: var(--pi-surface); border: 1px solid var(--pi-border); padding: 9px 14px; min-height: 42px; }
  button:focus-visible, textarea:focus-visible { outline: 2px solid var(--pi-accent); outline-offset: 2px; }
  button:hover { background: var(--pi-surface-hover); }
  button:disabled { opacity: .5; cursor: default; }
  .ui-nav-row { padding: 12px; margin-block: 6px; border: 1px solid var(--pi-border-muted); }
  .ui-nav-row-meta { font: 12px var(--pi-mono); color: var(--pi-muted); }
  .chat-message { margin-bottom: 18px; border-inline-start: 2px solid var(--pi-chat-conversation-border); background: var(--pi-chat-conversation-bg); }
  .chat-message[data-speaker="user"] { background: var(--pi-chat-user-bg); border-color: var(--pi-chat-user-border); }
  .chat-message-content { position: relative; padding: 18px 22px; }
  .chat-message-header { font: 12px var(--pi-mono); margin-bottom: 12px; }
  p { margin: 8px 0; }
  pre { font: 13px/1.7 var(--pi-mono); padding: 16px; background: var(--pi-surface); overflow: auto; border: 1px solid var(--pi-border-muted); }
  .comment { color: var(--pi-syntax-comment); } .keyword { color: var(--pi-syntax-keyword); } .string { color: var(--pi-syntax-string); }
  .success { color: var(--pi-success); } .warning { color: var(--pi-warning); } .danger { color: var(--pi-danger); }
  .ui-composer-toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding-top: 12px; }
  textarea { width: 100%; resize: vertical; min-height: 85px; padding: 14px; margin-top: 22px; background: var(--pi-surface); border: 1px solid var(--pi-border); }
  [data-ui-context="content-views"] { display: flex; gap: 4px; }
}`;
const templates = {
  'session-list': `<div data-ui-context="sessions"><div class="ui-nav-list">
    <div class="ui-nav-row" tabindex="0" data-current="true" aria-current="true" data-busy="true"><div class="ui-nav-row-main"><div class="ui-nav-row-label">Inscribe the star chart</div><div class="ui-nav-row-meta">Working · 3 tools</div></div></div>
    <div class="ui-nav-row" tabindex="0" data-current="false" data-unread="true"><div class="ui-nav-row-main"><div class="ui-nav-row-label">The herbarium</div><div class="ui-nav-row-meta">Unread · complete</div></div></div>
    <div class="ui-nav-row" tabindex="0" data-current="false"><div class="ui-nav-row-main"><div class="ui-nav-row-label">A binding repaired</div><div class="ui-nav-row-meta">Yesterday</div></div></div>
  </div></div>`,
  'chat-view': `<article class="chat-message" data-speaker="user"><div class="chat-message-content"><header class="chat-message-header">You · the invocation</header><div class="chat-message-body"><p>Make a map of the night sky. Keep each constellation readable, even on the smallest scroll.</p></div></div></article>
  <article class="chat-message" data-speaker="assistant"><div class="chat-message-content"><header class="chat-message-header">Assistant · the inscription</header><div class="chat-message-body"><p>The chart is taking shape. I’ve separated the stars from their labels and preserved the reading order.</p><pre><span class="comment">// Let the heavens remain legible.</span>
<span class="keyword">const</span> chart = illuminate({
  constellation: <span class="string">"Lyra"</span>,
  reducedMotion: <span class="keyword">true</span>
});</pre><p class="success">✓ Layout checks passed</p><p class="warning">△ One chart awaits review</p><p class="danger">× Missing coordinates are reported, not guessed</p></div></div></article>`,
  'pi-web-content-renderer': `<div data-ui-context="content-views"><button class="ui-button ui-choice" data-selected="true" aria-pressed="true">Highlighted</button><button class="ui-button ui-choice" data-selected="false" aria-pressed="false">Raw</button></div>`,
  'prompt-editor': `<label for="draft">Your next invocation</label><textarea id="draft">Add a legend to the star chart.</textarea><footer data-ui-context="composer"><div class="ui-composer-toolbar"><div class="ui-composer-settings"><button data-composer-action="thinking">Thinking · high</button></div><div class="ui-composer-actions"><button data-composer-action="send" data-default="true">Send</button> <button data-composer-action="stop" disabled>Stop</button></div></div></footer>`
};
for (const [tag, markup] of Object.entries(templates)) {
  customElements.define(tag, class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML = `<style>${base}</style><link rel="stylesheet" href="../assets/manuscript.css">${markup}`;
    }
  });
}
const themes = {
  hedgewitch: ['Hedgewitch’s Journal', 'Casual handwritten field notes on mottled cream paper.', 'light'],
  scribe: ['Scribe’s Spellbook', 'Calligraphic ink on aged golden parchment.', 'light'],
  forgotten: ['Forgotten Folio', 'Slanted ink on faded, foxed paper with worn edges.', 'light'],
  candlelit: ['Candlelit Folio', 'Ivory parchment, oxblood ink, and warm brass illumination.', 'light'],
  astral: ['Astral Grimoire', 'Midnight vellum, lilac ink, and silver celestial rules.', 'dark'],
  verdant: ['Verdant Codex', 'Forest leather, pale sage lettering, and botanical gold.', 'dark']
};
const select = document.querySelector('#theme');
function choose(id) {
  if (!Object.hasOwn(themes, id)) id = 'candlelit';
  select.value = id;
  for (const root of [document.head, ...Object.keys(templates).map(tag => document.querySelector(tag).shadowRoot)]) {
    root.querySelector('[data-paper]')?.remove();
    if (['hedgewitch', 'scribe', 'forgotten'].includes(id)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = '../assets/paper.css';
      link.dataset.paper = '';
      root.append(link);
    }
  }
  document.querySelector('#palette').href = `../assets/${id}.css`;
  document.documentElement.style.colorScheme = themes[id][2];
  document.querySelector('#title').textContent = themes[id][0];
  document.querySelector('#description').textContent = themes[id][1];
  history.replaceState(null, '', `#${id}`);
}
select.addEventListener('change', () => choose(select.value));
window.addEventListener('hashchange', () => choose(location.hash.slice(1)));
choose(location.hash.slice(1));
