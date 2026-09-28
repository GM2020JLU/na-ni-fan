import test from 'node:test';
import assert from 'node:assert/strict';
import { classics } from '../dist/lib/classics.mjs';
import { episodes, initialEpisode } from '../dist/lib/conversations.mjs';
import { startSession, currentNode, choose, rebut, goBack, changeAnswer, validateEpisode } from '../dist/lib/engine.mjs';


test('the two classic episodes have complete metadata', () => {
  assert.equal(classics.length, 2);
  assert.equal(new Set(episodes.map(e => e.id)).size, episodes.length);
  assert.equal(episodes.length, 2);
  assert.equal(initialEpisode.id, 'only-two-things');
  for (const episode of episodes) {
    for (const field of ['applicability', 'exclusions', 'setup', 'expectation', 'punchline', 'mechanism', 'selfReview']) {
      assert.ok(episode.review[field]?.trim(), `${episode.id}: missing ${field}`);
    }
  }
});

for (const episode of episodes) {
  test(`${episode.id}: every authored route terminates, back restores the prior node, and changing an answer truncates history`, () => {
    assert.deepEqual(validateEpisode(episode), []);
    let terminalPaths = 0;
    function walk(session, depth = 0) {
      assert.ok(depth <= 16, `${episode.id}: route too long`);
      const node = currentNode(episode, session);
      if (node.type === 'question') {
        for (const option of node.options) {
          const before = structuredClone(session);
          const next = choose(episode, session, option.id);
          assert.deepEqual(session, before, 'transition must not mutate the previous session');
          const restored = goBack(episode, next);
          assert.equal(restored.nodeId, session.nodeId);
          assert.deepEqual(restored.history, session.history);
          assert.equal(restored.previousChoice, option.id);
          walk(next, depth + 1);
        }
      } else {
        terminalPaths++;
        const changed = changeAnswer(episode, session);
        assert.equal(currentNode(episode, changed).type, 'question');
        const lastChoiceIndex = session.history.findLastIndex(h => h.kind === 'choice');
        assert.deepEqual(changed.history, session.history.slice(0, lastChoiceIndex));
        if (node.rebuttal) {
          const next = rebut(episode, session);
          assert.equal(goBack(episode, next).nodeId, session.nodeId);
          walk(next, depth + 1);
        }
      }
    }
    walk(startSession(episode));
    assert.ok(terminalPaths >= 2, 'both initial choices must terminate');
  });
}

test('classic one: opposite answers and the objection share the exact original punchline', () => {
  const episode = classics[0];
  const initial = startSession(episode);
  const yes = choose(episode, initial, 'yes');
  const no = choose(episode, initial, 'no');
  assert.equal(currentNode(episode, yes).text.replaceAll('\n', ''), '那你在烦恼什么呢？');
  assert.equal(currentNode(episode, yes).text, currentNode(episode, no).text);
  const objection = rebut(episode, no);
  assert.equal(currentNode(episode, choose(episode, objection, 'cannot')).text, currentNode(episode, yes).text);
  assert.equal(changeAnswer(episode, no).previousChoice, 'no');
});

test('classic two: every good branch ends immediately; worst-case path preserves the user supplied three steps', () => {
  const episode = classics[1];
  let state = startSession(episode);
  const steps = [['well', 'sick', 'illness'], ['recover', 'die', 'afterlife'], ['heaven', 'hell', 'friends']];
  for (const [good, bad, next] of steps) {
    assert.equal(currentNode(episode, choose(episode, state, good)).text.replaceAll('\n', ''), '那你没什么好担心的。');
    state = choose(episode, state, bad);
    assert.equal(state.nodeId, next);
  }
  assert.match(currentNode(episode, state).text, /老朋友握手/);
  assert.match(currentNode(episode, rebut(episode, state)).text, /到底有什么好担心/);
});

test('invalid actions do not mutate state, and a different episode starts fresh', () => {
  const episode = classics[0];
  const initial = startSession(episode);
  const copy = structuredClone(initial);
  assert.throws(() => choose(episode, initial, 'invalid'));
  assert.throws(() => rebut(episode, initial));
  assert.throws(() => currentNode(classics[1], initial));
  assert.deepEqual(initial, copy);
  assert.deepEqual(goBack(episode, initial), initial);
  const next = startSession(classics[1]);
  assert.equal(next.nodeId, 'start'); assert.deepEqual(next.history, []); assert.equal(next.previousChoice, null);
});

test('validator detects missing targets, hidden cycles, and unreachable nodes', () => {
  const bad = structuredClone(classics[0]);
  bad.nodes.start.options[0].next = 'missing';
  bad.nodes.start.options[1].next = 'start';
  const errors = validateEpisode(bad).join('\n');
  assert.match(errors, /节点缺失/); assert.match(errors, /自动分支循环/); assert.match(errors, /不可达节点/);
});
