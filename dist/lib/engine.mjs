/** Pure conversation state: no DOM, timing, network, or storage. */
export function startSession(episode) {
  if (!episode?.nodes?.[episode.entry]) throw new Error('剧本入口不存在');
  return { episodeId: episode.id, nodeId: episode.entry, history: [], previousChoice: null };
}

export function currentNode(episode, session) {
  if (session.episodeId !== episode.id) throw new Error('会话与剧本不匹配');
  const node = episode.nodes[session.nodeId];
  if (!node) throw new Error('对话节点不存在');
  return node;
}

export function choose(episode, session, choiceId) {
  const node = currentNode(episode, session);
  const option = node.type === 'question' && node.options.find(option => option.id === choiceId);
  if (!option || !episode.nodes[option.next]) throw new Error('此处没有这个选项');
  return {
    ...session, nodeId: option.next, previousChoice: null,
    history: [...session.history, { nodeId: session.nodeId, choiceId, label: option.label, kind: 'choice' }]
  };
}

export function rebut(episode, session) {
  const node = currentNode(episode, session);
  if (!node.rebuttal || !episode.nodes[node.rebuttal.next]) throw new Error('这段已经讲完了');
  return {
    ...session, nodeId: node.rebuttal.next, previousChoice: null,
    history: [...session.history, { nodeId: session.nodeId, label: node.rebuttal.label, kind: 'rebuttal' }]
  };
}

export function goBack(episode, session) {
  currentNode(episode, session);
  if (!session.history.length) return session;
  const previous = session.history.at(-1);
  return {
    ...session, nodeId: previous.nodeId, history: session.history.slice(0, -1),
    previousChoice: previous.kind === 'choice' ? previous.choiceId : null
  };
}

export function changeAnswer(episode, session) {
  currentNode(episode, session);
  const index = session.history.findLastIndex(item => item.kind === 'choice');
  if (index < 0) return startSession(episode);
  const previous = session.history[index];
  return { ...session, nodeId: previous.nodeId, history: session.history.slice(0, index), previousChoice: previous.choiceId };
}

export function validateEpisode(episode) {
  const errors = [];
  const nodes = episode.nodes || {};
  if (!nodes[episode.entry]) errors.push('入口缺失');
  const visited = new Set();
  const visiting = new Set();
  function visit(id) {
    if (!nodes[id]) { errors.push(`节点缺失: ${id}`); return; }
    if (visiting.has(id)) { errors.push(`自动分支循环: ${id}`); return; }
    if (visited.has(id)) return;
    visited.add(id); visiting.add(id);
    const n = nodes[id];
    if (!n.text?.trim()) errors.push(`台词缺失: ${id}`);
    if (n.type === 'question') {
      if (!Array.isArray(n.options) || n.options.length !== 2) errors.push(`问题需要两个选项: ${id}`);
      const ids = new Set();
      for (const o of n.options || []) {
        if (!o.id || ids.has(o.id) || !o.label) errors.push(`选项不合法: ${id}`);
        ids.add(o.id); visit(o.next);
      }
    } else if (n.type !== 'ending') errors.push(`未知节点类型: ${id}`);
    if (n.rebuttal) {
      if (n.type !== 'ending' || !n.rebuttal.label) errors.push(`反驳配置不合法: ${id}`);
      visit(n.rebuttal.next);
    }
    visiting.delete(id);
  }
  if (nodes[episode.entry]) visit(episode.entry);
  for (const id of Object.keys(nodes)) if (!visited.has(id)) errors.push(`不可达节点: ${id}`);
  return errors;
}
