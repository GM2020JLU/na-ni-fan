import { episodes, initialEpisode } from './lib/conversations.mjs';
import { startSession, currentNode, choose, rebut, goBack, changeAnswer } from './lib/engine.mjs';
import { music } from './lib/music.mjs';

let episode = initialEpisode;
let session = startSession(episode);
let view = 'stage';
let busy = false;
let transitionTimer;
let transitionResolve;
let transitionVersion = 0;
let motionPaused = false;
const app = document.getElementById('app');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const lines = value => escape(value).replace(/\n/g, '<br>');
const button = (label, action, cls = '', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const arrow = '<span class="button-arrow" aria-hidden="true">↗</span>';
const motionOff = () => motionPaused || reducedMotion.matches;
const nextStories = {
  'only-two-things': ['why-worry', '再讲一个'],
  'why-worry': ['only-two-things', '再问一个']
};
const chapters = { 'only-two-things': '人生这点事', 'why-worry': '就问你一句' };
const musicText = () => !music.enabled ? '♫ 来点配乐' : music.playing ? '♫ 配乐开着' : '♫ 配乐已开启';
const musicTitle = () => !music.enabled ? '开音乐' : music.playing ? '关音乐' : '点击页面就会播放，点此关闭配乐';

function updateMusicButton() {
  const target = app.querySelector('[data-action="music"]');
  if (!target) return;
  target.textContent = musicText();
  target.setAttribute('aria-pressed', String(music.enabled));
  target.setAttribute('aria-label', musicTitle());
  target.setAttribute('title', musicTitle());
}

function header() {
  return `<header class="masthead"><a class="wordmark" href="./" data-action="home" aria-label="那你烦什么，回到开场"><span class="brand-icon" aria-hidden="true">?</span><span>那你烦什么<span class="brand-question">？</span></span></a><span class="brand-description">听奶龙，一本正经地胡说八道。</span>${button(musicText(), 'music', 'music-toggle', `aria-pressed="${music.enabled}" aria-label="${musicTitle()}" title="${musicTitle()}"`)}${button('换个问法 <span aria-hidden="true">↗</span>', 'picker', 'header-action')}</header>`;
}

function character() {
  const node = currentNode(episode, session);
  const reaction = view === 'stage' && node.type === 'ending' ? (node.reaction || 'nod') : 'idle';
  return `<aside class="character-stage" aria-label="奶龙"><div class="character-label"><span class="status-dot" aria-hidden="true"></span>奶龙<span class="label-note">歪理也是理</span></div><button type="button" class="mascot-button" data-action="boop" aria-label="戳一下奶龙"><span class="mascot-react" data-reaction="${reaction}"><span class="mascot-float"><img class="nailoong-sprite" src="./assets/nailoong.png" alt="" aria-hidden="true" draggable="false" fetchpriority="high"></span></span><span class="boop-bubble" aria-hidden="true">嗯？</span></button><div class="character-caption"><span class="caption-line"></span>不服？你接着选。<span class="caption-line"></span></div>${button(motionOff() ? '▶ 开启动作' : 'Ⅱ 暂停动作', 'motion', 'motion-toggle', `aria-label="${motionOff() ? '开启动画' : '暂停动画'}" aria-pressed="${motionOff()}" ${reducedMotion.matches ? 'disabled title="已跟随系统减少动态效果设置"' : ''}`)}</aside>`;
}

function answerButtons(options) {
  return `<div class="options">${options.map((option, i) => button(`<span class="option-key" aria-hidden="true">${i + 1}</span><span class="option-label">${escape(option.label)}</span>${arrow}`, 'choose', `option ${i === 0 ? 'option-yellow' : 'option-mint'} ${session.previousChoice === option.id ? 'was-chosen' : ''}`, `data-choice="${escape(option.id)}" ${busy ? 'disabled' : ''} aria-label="${escape(option.label)}${session.previousChoice === option.id ? '，上次选过' : ''}"`)).join('')}</div>`;
}

function stage() {
  const node = currentNode(episode, session);
  const ending = node.type === 'ending';
  const last = session.history.at(-1);
  const next = nextStories[episode.id];
  const kickerText = session.previousChoice ? '行，你换一个。' : node.kicker || '';
  const isPremise = episode.id === 'only-two-things' && node.type === 'question' && !session.previousChoice && kickerText.includes('两件事');
  const kickerHtml = isPremise
    ? escape(kickerText).replace('人生在世，', '人生在世，<br>').replace('两件事', '<strong class="premise-emphasis">两件事</strong>')
    : escape(kickerText) || '&nbsp;';
  const receipt = last ? `<div class="receipt"><span>你说</span><strong>“${escape(last.label)}”</strong></div>` : '<div class="receipt"><span>你来选，奶龙接着说。</span></div>';
  const actions = ending
    ? `<div class="ending-actions">${button('不服，换个答案 <span aria-hidden="true">↶</span>', 'change', 'primary-button')}${button(escape(next[1]) + ' ' + arrow, 'start', 'secondary-button', `data-episode="${next[0]}"`)}</div>${node.rebuttal ? button(escape(node.rebuttal.label) + '<span aria-hidden="true"> ↗</span>', 'rebut', 'text-button rebuttal-button') : ''}`
    : answerButtons(node.options);
  return `<main class="conversation ${ending ? 'is-ending' : ''}" aria-busy="${busy}">${character()}<section class="dialogue" aria-labelledby="stage-title">${receipt}<div class="speech-card"><div class="card-topline"><span class="chapter-label">${chapters[episode.id]}${episode.dark ? ' · 黑色幽默' : ''}</span><span class="speech-dots" aria-hidden="true">···</span></div><p class="kicker${isPremise ? ' kicker--premise' : ending && node.kicker ? ' kicker--lead' : ''}">${kickerHtml}</p><h1 id="stage-title" tabindex="-1">${lines(node.text)}</h1><div class="card-bottomline"><span>${ending ? '嗯。' : '嗯，奶龙很认真。'}</span><span class="little-spark" aria-hidden="true">✳</span></div></div><div class="answer-area">${actions}</div><nav class="stage-navigation" aria-label="对话控制"><div>${button('← 上一句', 'back', 'quiet-button', session.history.length ? '' : 'disabled')}${button('从头再来', 'restart', 'quiet-button')}</div>${button('先到这里', 'finish', 'quiet-button')}</nav></section></main>`;
}

function farewell() {
  return `<main class="conversation farewell">${character()}<section class="dialogue" aria-labelledby="stage-title"><div class="receipt"><span>今日份歪理，先到这儿。</span></div><div class="speech-card"><div class="card-topline"><span class="chapter-label">下回见</span><span class="speech-dots" aria-hidden="true">···</span></div><p class="kicker">奶龙还在这儿。</p><h1 id="stage-title" tabindex="-1">行。<br>下回接着杠。</h1><div class="card-bottomline"><span>奶龙随时有理。</span><span class="little-spark" aria-hidden="true">✳</span></div></div><div class="answer-area"><div class="ending-actions">${button('等等，我还没服 ' + arrow, 'resume', 'primary-button')}${button('换个问法', 'picker', 'secondary-button')}</div></div></section></main>`;
}

function render({ focus = true } = {}) {
  document.body.dataset.view = view;
  document.body.dataset.ending = String(view === 'stage' && currentNode(episode, session).type === 'ending');
  document.body.dataset.motion = motionOff() ? 'paused' : 'playing';
  app.innerHTML = `<div class="page-shell">${header()}<div class="scene-intro"><span class="intro-line"></span><span>你选你的，奶龙有奶龙的道理。</span><span class="intro-line"></span></div>${view === 'farewell' ? farewell() : stage()}<footer class="page-footer"><span>歪理小剧场 · 奶龙 陪你杠</span><span>人生 <span aria-hidden="true">·</span> 烦恼</span><span class="footer-stamp">一本正经地胡说八道 <span aria-hidden="true">↗</span></span></footer></div><div id="announcement" class="sr-only" role="status" aria-live="polite"></div>`;
  document.title = `${view === 'farewell' ? '下回接着杠' : episode.title} · 那你烦什么`;
  if (focus) document.getElementById('stage-title')?.focus({ preventScroll: true });
}

function cancelTransition() {
  transitionVersion += 1;
  clearTimeout(transitionTimer);
  busy = false;
  if (transitionResolve) { transitionResolve(false); transitionResolve = undefined; }
}

function snapshot() {
  const node = currentNode(episode, session);
  return { view, episodeId: episode.id, nodeId: session.nodeId, text: view === 'stage' ? node.text : '行。下回接着杠。', busy, animation: motionOff() ? 'paused' : 'playing', choices: view === 'stage' && node.type === 'question' ? node.options.map(({ id, label }) => ({ id, label })) : [], canRebut: view === 'stage' && Boolean(node.rebuttal), history: session.history.map(item => ({ ...item })) };
}

async function selectAnswer(id) {
  if (busy || view !== 'stage') return false;
  const next = choose(episode, session, id);
  busy = true;
  const version = ++transitionVersion;
  app.querySelectorAll('[data-action="choose"]').forEach(b => { b.disabled = true; if (b.dataset.choice === id) b.classList.add('is-picked'); });
  app.querySelector('main').setAttribute('aria-busy', 'true');
  app.querySelector('.mascot-react').dataset.reaction = 'thinking';
  const delay = motionOff() ? 0 : (episode.nodes[next.nodeId].type === 'ending' ? 560 : 230);
  return new Promise(resolve => {
    transitionResolve = resolve;
    transitionTimer = setTimeout(() => {
      if (version !== transitionVersion) { resolve(false); return; }
      session = next; busy = false; transitionResolve = undefined;
      render();
      music.react(episode.nodes[next.nodeId].type === 'ending' ? 'ending' : 'answer');
      resolve(true);
    }, delay);
  });
}

async function dispatch(action, value) {
  if (action === 'choose') { await selectAnswer(value); return snapshot(); }
  if (action === 'music') {
    try {
      await music.toggle();
      updateMusicButton();
    } catch {
      document.getElementById('announcement').textContent = '浏览器暂时没能播放，再点一次试试。';
    }
    return snapshot();
  }
  if (action === 'boop') {
    const target = app.querySelector('.mascot-button');
    target.classList.remove('is-booped');
    void target.offsetWidth;
    target.classList.add('is-booped');
    return snapshot();
  }
  if (action === 'motion') {
    motionPaused = !motionPaused;
    document.body.dataset.motion = motionOff() ? 'paused' : 'playing';
    const target = app.querySelector('[data-action="motion"]');
    target.textContent = motionOff() ? '▶ 开启动作' : 'Ⅱ 暂停动作';
    target.setAttribute('aria-label', motionOff() ? '开启动画' : '暂停动画');
    target.setAttribute('aria-pressed', String(motionOff()));
    return snapshot();
  }
  cancelTransition();
  if (action === 'start' || action === 'home') {
    const selected = episodes.find(item => item.id === (action === 'home' ? initialEpisode.id : value));
    if (!selected) throw new Error('没有这个剧本');
    episode = selected; session = startSession(episode); view = 'stage';
  } else if (action === 'picker') {
    episode = episodes.find(item => item.id !== episode.id) || initialEpisode;
    session = startSession(episode); view = 'stage';
  }
  else if (action === 'resume') view = 'stage';
  else if (action === 'finish') view = 'farewell';
  else if (action === 'back') session = goBack(episode, session);
  else if (action === 'change') session = changeAnswer(episode, session);
  else if (action === 'restart') session = startSession(episode);
  else if (action === 'rebut') session = rebut(episode, session);
  else throw new Error('未知操作');
  render();
  if (['start', 'home', 'picker', 'finish'].includes(action)) window.scrollTo({ top: 0, behavior: 'instant' });
  return snapshot();
}

app.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  event.preventDefault();
  dispatch(target.dataset.action, target.dataset.choice ?? target.dataset.episode).catch(error => {
    cancelTransition(); render();
    document.getElementById('announcement').textContent = `奶龙这句没接上，可以从头再来。${error.message}`;
  });
});
reducedMotion.addEventListener('change', () => {
  document.body.dataset.motion = motionOff() ? 'paused' : 'playing';
  const target = app.querySelector('[data-action="motion"]');
  target.disabled = reducedMotion.matches;
  target.textContent = motionOff() ? '▶ 开启动作' : 'Ⅱ 暂停动作';
  target.setAttribute('aria-label', motionOff() ? '开启动画' : '暂停动画');
  target.setAttribute('aria-pressed', String(motionOff()));
});
document.addEventListener('musicstatechange', updateMusicButton);
render({ focus: false });

const context = document.modelContext;
if (context?.registerTool) {
  const lifecycle = new AbortController();
  const tools = [
    { name: 'read_conversation', description: '读取当前问答、可选答案和会话状态。', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => snapshot() },
    { name: 'choose_answer', description: '选择当前问题的答案，并等待网页更新。', inputSchema: { type: 'object', properties: { choiceId: { type: 'string' } }, required: ['choiceId'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async input => {
      if (!input || typeof input.choiceId !== 'string' || Object.keys(input).length !== 1) throw new Error('需要 choiceId');
      if (view !== 'stage' || busy) throw new Error('当前不能选择答案');
      currentNode(episode, session).options?.find(option => option.id === input.choiceId) || (() => { throw new Error('答案不存在'); })();
      return dispatch('choose', input.choiceId);
    } }
  ];
  for (const tool of tools) {
    try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* The ordinary UI does not depend on this optional registry. */ }
  }
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
