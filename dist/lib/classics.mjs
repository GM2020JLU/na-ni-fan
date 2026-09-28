export const classics = [
  {
    id: 'why-worry', category: '经典', title: '这件事，你能解决吗？',
    teaser: '能。不能。', mode: 'converge', entry: 'start',
    nodes: {
      start: { type: 'question', text: '这件事，\n你能解决吗？', options: [
        { id: 'yes', label: '能', next: 'verdict' }, { id: 'no', label: '不能', next: 'verdict' }
      ] },
      verdict: { type: 'ending', text: '那你在\n烦恼什么呢？', rebuttal: { label: '你这不是歪理吗？', next: 'objection' } },
      objection: { type: 'question', text: '那这套歪理，\n你能反驳吗？', options: [
        { id: 'can', label: '能', next: 'retort' }, { id: 'cannot', label: '不能', next: 'retort' }
      ] },
      retort: { type: 'ending', text: '那你在\n烦恼什么呢？' }
    },
    review: {
      applicability: '用户指定的经典互动段子。', exclusions: '一本正经的歪理喜剧，不冒充现实解决方案。',
      setup: '一个看起来会得到两种回答的问题。', expectation: '能与不能应该有不同结论。',
      punchline: '相反答案逐字落到同一句。', mechanism: '殊途同归；换答案后发现。', selfReview: '保持用户原句，不追加解释或劝导。'
    }
  },
  {
    id: 'only-two-things', category: '人生', title: '只有两件事需要操心',
    teaser: '人生在世，只有两件事需要你操心。', mode: 'escalate', entry: 'start', dark: true,
    nodes: {
      start: { type: 'question', kicker: '人生在世，只有两件事需要你操心。', text: '你是健康的，\n还是生病了？', options: [
        { id: 'well', label: '健康的', next: 'fine' }, { id: 'sick', label: '生病了', next: 'illness' }
      ] },
      illness: { type: 'question', kicker: '那你就有两件事需要操心。', text: '你会康复，\n还是会死掉？', options: [
        { id: 'recover', label: '会康复', next: 'fine' }, { id: 'die', label: '会死掉', next: 'afterlife' }
      ] },
      afterlife: { type: 'question', kicker: '那你就有两件事需要操心。', text: '你会上天堂，\n还是下地狱？', options: [
        { id: 'heaven', label: '上天堂', next: 'fine' }, { id: 'hell', label: '下地狱', next: 'friends' }
      ] },
      fine: { type: 'ending', text: '那你没什么\n好担心的。' },
      friends: { type: 'ending', kicker: '那你可忙了。', text: '忙着和老朋友握手，\n根本没时间担心！', reaction: 'bounce', rebuttal: { label: '所以呢？', next: 'conclusion' } },
      conclusion: { type: 'ending', text: '所以，\n到底有什么好担心的呢？' }
    },
    review: {
      applicability: '用户最新指定的经典人生黑色幽默。', exclusions: '是段子，不判断真实病情。',
      setup: '健康与生病开始的二选一。', expectation: '情况越来越坏，总有一层会无法化解。',
      punchline: '地狱忽然成为和老朋友握手打招呼的地方。',
      mechanism: '三层二分，重复句式，好分支立刻结束，坏分支持续递进。',
      selfReview: '按用户本轮全文改为健康、康复或死亡、天堂或地狱三层；不再增加恶化中间层或治疗建议。'
    }
  }
];
