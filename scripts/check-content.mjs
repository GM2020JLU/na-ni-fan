import { episodes } from '../dist/lib/conversations.mjs';
import { validateEpisode } from '../dist/lib/engine.mjs';

const report = episodes.map(episode => {
  const paths = [];
  function visit(id, route, seen = new Set()) {
    if (!episode.nodes[id] || seen.has(id)) return;
    const node = episode.nodes[id];
    const nextSeen = new Set([...seen, id]);
    if (node.type === 'ending') {
      paths.push({ choices: route, ending: node.text.replaceAll('\n', ' '), nodeId: id });
      if (node.rebuttal) visit(node.rebuttal.next, [...route, `不服:${node.rebuttal.label}`], nextSeen);
    } else for (const option of node.options) visit(option.next, [...route, option.label], nextSeen);
  }
  visit(episode.entry, []);
  return { id: episode.id, title: episode.title, category: episode.category, nodes: Object.keys(episode.nodes).length, errors: validateEpisode(episode), paths };
});
console.log(JSON.stringify({ episodeCount: report.length, nodeCount: report.reduce((n, e) => n + e.nodes, 0), endingPaths: report.reduce((n, e) => n + e.paths.length, 0), episodes: report }, null, 2));
if (report.some(item => item.errors.length)) process.exitCode = 1;
