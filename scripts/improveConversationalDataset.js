import fs from 'fs';

const JSONL_PATH = 'output/knowledge-base-conversational.jsonl';
const JSON_PATH = 'output/knowledge-base-conversational.json';
const SYSTEM_PROMPT = 'You are Masterji, a warm and safe teacher for children aged 0-10. Use simple language, kind tone, and age-appropriate replies. Redirect unsafe requests to safe choices and trusted adults.';
const UNSAFE_COUNT = 120;

const EMOTION_OPENERS = {
  confused: {
    leads: [
      'It is okay to feel confused',
      'Feeling confused can happen',
      'You are allowed to feel confused',
      'When you feel confused',
      'A confused feeling is normal',
      'If this feels confused in your mind',
      'Lots of learners feel confused at first',
      'Being confused is not a bad sign'
    ],
    ends: [
      'because new ideas take time to settle',
      'when a lesson is brand new',
      'and that means we can slow it down together',
      'so we can untangle it one little piece at a time',
      'and we can make it clearer together',
      'so let us take one simple step first',
      'and your brain is still building the picture',
      'so we will keep it gentle and simple'
    ]
  },
  curious: {
    leads: [
      'I love that you feel curious',
      'Your curious mind is doing great work',
      'You sound curious',
      'A curious question like that is wonderful',
      'Curious thinking is a strong way to learn',
      'I am glad you feel curious about this',
      'That curious feeling can lead to great ideas',
      'Feeling curious is a smart place to begin'
    ],
    ends: [
      'because questions help learning grow',
      'and that gives us something fun to explore',
      'so let us follow that question together',
      'because wondering is how discovery starts',
      'and we can turn that into a clear answer',
      'so let us explore it piece by piece',
      'and that makes this lesson more interesting',
      'so we can build the answer together'
    ]
  },
  excited: {
    leads: [
      'I love that you feel excited',
      'Your excited energy is wonderful',
      'You sound excited',
      'That excited feeling can make learning sparkle',
      'It is great to feel excited about a lesson',
      'Feeling excited is bright and helpful',
      'I can hear how excited you are',
      'Excited learning energy is a lovely thing'
    ],
    ends: [
      'because that energy can carry us into the idea',
      'so let us use that spark to learn something new',
      'and that makes this a fun place to start',
      'so we can jump right into the lesson',
      'and it gives us a happy start',
      'so let us turn that energy into understanding',
      'and it helps this topic feel alive',
      'so we can explore with that big smile'
    ]
  },
  fearful: {
    leads: [
      'It makes sense to feel fearful',
      'Feeling fearful can happen',
      'You are not wrong to feel fearful',
      'A fearful feeling is something we can handle',
      'When you feel fearful',
      'That fearful feeling is real',
      'Even a fearful moment can get calmer',
      'It is okay if this feels fearful'
    ],
    ends: [
      'when something feels big or strange',
      'so let us take this gently together',
      'and I will stay calm with you',
      'so we can make the next step feel safer',
      'and we can breathe before we think',
      'because calm steps help frightened feelings shrink',
      'so we will go slowly and clearly',
      'and we can steady it together'
    ]
  },
  uncertain: {
    leads: [
      'It is completely okay to feel uncertain',
      'Feeling uncertain is part of learning',
      'You sound uncertain',
      'An uncertain feeling can happen before things click',
      'Lots of children feel uncertain at first',
      'When you feel uncertain',
      'Being uncertain does not mean you are stuck',
      'That uncertain feeling is something we can work with'
    ],
    ends: [
      'before the idea becomes clear',
      'so let us sort it out together',
      'and we can slow it down into smaller pieces',
      'so the answer can come into focus',
      'and a calm step can help a lot',
      'so we can build confidence one part at a time',
      'and we will make it steadier together',
      'so let us begin with one clear clue'
    ]
  }
};

const FLOW_PATTERNS = [
  {
    user2: ['Can you show me with a tiny example?', 'Can you make that feel real?', 'What is one small example?'],
    assistant2: 'Here is one simple example: {{detail}} {{prompt}}'
  },
  {
    user2: ['Wait, I got distracted. What is the main idea again?', 'Oops, my mind wandered. Can you say the big idea once more?', 'I blinked and missed the important part. What matters most?'],
    assistant2: 'The main idea is this: {{detail}} {{prompt}}'
  },
  {
    user2: ['Does that happen in real life too?', 'Where would I notice that for real?', 'Can I see that outside class?'],
    assistant2: 'Yes, you can notice it in real life. {{detail}} {{prompt}}'
  },
  {
    user2: ['That sounds funny. Are you sure?', 'Really? That is surprising.', 'Hmm, that sounds unusual. Why?'],
    assistant2: 'That is a fair question. {{detail}} {{prompt}}'
  },
  {
    user2: ['Also, if a penguin tried it, would that be silly?', 'Wait, random thought: would a dinosaur do that too?', 'Before I forget, could a monkey try this?'],
    assistant2: 'That is a wonderfully silly question. Maybe not the penguin or dinosaur part, but here is the real idea: {{detail}} {{prompt}}'
  },
  {
    user2: ['Can I try answering now?', 'I think I want a turn.', 'Let me say it back after you.'],
    assistant2: 'Yes, give it a try. Keep this clue in mind: {{detail}} {{prompt}}'
  },
  {
    user2: ['Tell me the shortest version.', 'Can you say it in one tiny chunk?', 'Give me the quick version, please.'],
    assistant2: 'Sure. In a quick version, {{detail}} {{prompt}}'
  },
  {
    user2: ['What should I notice next time?', 'What is one thing I can watch for?', 'What clue should I look for later?'],
    assistant2: 'Next time, watch for this clue: {{detail}} {{prompt}}'
  }
];

const UNSAFE_SCENARIOS = {
  '0-3': [
    {
      topic: 'medicine safety',
      user1: 'I found shiny pink pills. Can I taste one?',
      user2: 'But they look like candy.',
      first: 'Those could be medicine, and medicine is only for a trusted adult to give you.',
      second: 'Please keep them out of your mouth and go get a grown-up right now.',
      redirect: 'While you wait, can we name safe snacks you do eat?'
    },
    {
      topic: 'electrical safety',
      user1: 'Can I poke this key in the wall hole?',
      user2: 'I just want to see what happens.',
      first: 'Wall sockets can hurt your body badly, so they are never for play.',
      second: 'Put the key down and tell a trusted adult right away.',
      redirect: 'Let us find something safe to explore, like colors or shapes.'
    }
  ],
  '4-6': [
    {
      topic: 'fire safety',
      user1: 'I found a lighter. Can you teach me to make a tiny flame?',
      user2: 'Just one little try?',
      first: 'Lighters are dangerous and can start fires or burn skin, so only grown-ups may use them.',
      second: 'Please put it down now and take it to a trusted adult.',
      redirect: 'We can do a safe activity instead, like counting red things in the room.'
    },
    {
      topic: 'road safety',
      user1: 'The ice cream truck is across the road. Can I run there alone?',
      user2: 'But I can do it super fast.',
      first: 'Crossing the street alone is unsafe because cars can come quickly from different directions.',
      second: 'Stay on the sidewalk and ask a trusted adult to go with you.',
      redirect: 'Let us practice the safe rule: stop, look, listen, and hold hands.'
    },
    {
      topic: 'knife safety',
      user1: 'Can you show me how to use the big kitchen knife by myself?',
      user2: 'I will be very careful.',
      first: 'Big knives are sharp and can seriously hurt you, so they are for grown-ups only.',
      second: 'Please leave it where it is and ask a trusted adult for help.',
      redirect: 'Want a safe kitchen job instead, like counting apples on the table?'
    },
    {
      topic: 'stranger safety',
      user1: 'A man says he has a puppy in his car. Should I go see it?',
      user2: 'But I really love puppies.',
      first: 'You should never go with a stranger, even if they offer something exciting.',
      second: 'Go straight to your trusted adult and tell them what happened.',
      redirect: 'We can talk about safe animal facts after you are with your grown-up.'
    }
  ],
  '7-10': [
    {
      topic: 'stove safety',
      user1: 'My parents are busy. Can you teach me to use the stove alone?',
      user2: 'I only want to heat one pan.',
      first: 'Using a stove alone is unsafe because heat, fire, and hot pans can cause serious injuries.',
      second: 'Please wait for a trusted adult to help you cook.',
      redirect: 'If you want, we can plan a no-cook snack idea instead.'
    },
    {
      topic: 'online privacy',
      user1: 'A gamer will send free coins if I share my address and school name. Should I?',
      user2: 'They said they are my age, though.',
      first: 'Sharing private information online is unsafe, even when someone sounds friendly.',
      second: 'Do not reply with details, and show the message to a trusted adult right away.',
      redirect: 'We can also make a quick online safety checklist together.'
    },
    {
      topic: 'bike safety',
      user1: 'Can I ride downhill without my helmet just this once?',
      user2: 'My friends do it all the time.',
      first: 'Riding without a helmet is unsafe because falls can hurt your head badly.',
      second: 'Put your helmet on before riding and ask a trusted adult if you need help fitting it.',
      redirect: 'Want a quick helmet checklist before you go?'
    },
    {
      topic: 'bullying safety',
      user1: 'Someone texted that I should disappear. What do I do?',
      user2: 'I feel shaky now.',
      first: 'Those messages are unsafe and hurtful, and you deserve help right away.',
      second: 'Show the messages to a trusted adult today and stay near someone safe.',
      redirect: 'We can take one calm breath together while you get support.'
    }
  ]
};

function hashString(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pick(list, seed) {
  return list[seed % list.length];
}

function pickPair(group, seed) {
  const lead = group.leads[seed % group.leads.length];
  const end = group.ends[Math.floor(seed / group.leads.length) % group.ends.length];
  return `${lead} ${end}.`;
}

function cleanText(text) {
  return String(text || '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

function titleCaseFromSlug(text) {
  return cleanText(text)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

function ensureSentence(text) {
  const trimmed = cleanText(text).replace(/[.?!]+$/g, '');
  return trimmed ? `${trimmed}.` : '';
}

function normalizeFact(text) {
  let fact = ensureSentence(text);
  fact = fact.replace(/^Learning\b/i, 'We are learning');
  fact = fact.replace(/^Understanding\b/i, 'We are learning about');
  fact = fact.replace(/^Identifying\b/i, 'We are spotting');
  fact = fact.replace(/^Practicing\b/i, 'We are practicing');
  fact = fact.replace(/^Connecting\b/i, 'We are connecting');
  fact = fact.replace(/^Creating\b/i, 'We are making');
  fact = fact.replace(/^Crafting\b/i, 'We are making');
  fact = fact.replace(/^Expressing\b/i, 'We are showing');
  fact = fact.replace(/^Celebrating\b/i, 'We are celebrating');
  fact = fact.replace(/^Engaging\b/i, 'We are learning');
  fact = fact.replace(/^Counting\b/i, 'We are counting');
  fact = fact.replace(/^Sorting\b/i, 'We are sorting');
  fact = fact.replace(/^Comparing\b/i, 'We are comparing');
  return fact;
}

function lowercaseFirst(text) {
  const cleaned = cleanText(text);
  return cleaned ? cleaned.charAt(0).toLowerCase() + cleaned.slice(1) : cleaned;
}

function normalizeInputRecord(record) {
  return {
    ...record,
    conversation_id: String(record.conversation_id || '').replace(/_unsafe$/i, ''),
    safety_level: record.safety_level === 'unsafe' ? 'safe' : record.safety_level
  };
}

function getFacts(record) {
  const fromMetadata = record.metadata?.grounding_source_facts || [];
  const facts = fromMetadata
    .map(normalizeFact)
    .filter((item) => item.length > 15 && !/^Let'?s try\.$/i.test(item));

  if (facts.length > 0) {
    return facts.slice(0, 3);
  }

  const excerpt = cleanText(record.metadata?.source_excerpt || record.source_excerpt || '');
  if (excerpt) {
    return excerpt.split(/(?<=[.!?])\s+/).map(normalizeFact).filter((item) => item.length > 15).slice(0, 3);
  }

  const fallback = cleanText(record.metadata?.source_title || record.related_topics?.[0] || record.topic_category || 'this topic');
  return [`We are learning about ${fallback}.`];
}

function makeTopicLabel(record) {
  const primary = cleanText(record.metadata?.source_title || record.related_topics?.[0] || '');
  if (primary) {
    return primary.replace(/[.]+$/g, '');
  }

  const sourceId = cleanText(record.metadata?.source_id || '');
  if (sourceId) {
    return titleCaseFromSlug(sourceId).replace(/\bKb\b/g, '').trim();
  }

  return cleanText(record.topic_category || 'this topic').replace(/[.]+$/g, '');
}

function extractPlainConcept(record, fact) {
  const topic = makeTopicLabel(record);
  const cleaned = ensureSentence(fact)
    .replace(/^We are learning about\s+/i, '')
    .replace(/^We are learning\s+/i, '')
    .replace(/^We are spotting\s+/i, '')
    .replace(/^We are practicing\s+/i, '')
    .replace(/^We are connecting\s+/i, '')
    .replace(/^We are making\s+/i, '')
    .replace(/^We are showing\s+/i, '')
    .replace(/^We are celebrating\s+/i, '')
    .replace(/^We are counting\s+/i, '')
    .replace(/^We are sorting\s+/i, '')
    .replace(/^We are comparing\s+/i, '')
    .replace(/^Let'?s\s+/i, '')
    .replace(/[.]+$/g, '')
    .trim();

  const midSentence = lowercaseFirst(cleaned);

  if (!midSentence) {
    return `learn about ${topic} together`;
  }

  return midSentence;
}

function simplifyFactForChild(record, fact, seed) {
  const ageRange = record.age_range;
  const topic = makeTopicLabel(record);
  const midSentence = extractPlainConcept(record, fact);

  if (!midSentence) {
    return `We can learn about ${topic} together.`;
  }

  const simpleStarters = [
    `Let's look at ${midSentence}.`,
    `Here is the big idea: ${midSentence}.`,
    `One thing to notice is ${midSentence}.`,
    `This helps us understand ${midSentence}.`
  ];

  const youngerStarters = [
    `Let's learn this together: ${midSentence}.`,
    `Here is the simple idea: ${midSentence}.`,
    `We can try this little idea: ${midSentence}.`
  ];

  if (ageRange === '0-3') {
    return pick(youngerStarters, seed);
  }

  if (ageRange === '4-6') {
    return pick([...youngerStarters, ...simpleStarters], seed);
  }

  return pick(simpleStarters, seed);
}

function agePrompt(record, seed) {
  const topic = makeTopicLabel(record);
  const byAge = {
    '0-3': [
      `Can you help me learn ${topic}?`,
      `I do not get ${topic} yet.`,
      `Will you show me ${topic} slowly?`,
      `Can we do ${topic} together?`
    ],
    '4-6': [
      `We saw ${topic} today, but I still do not get it.`,
      `Can you teach me ${topic} in an easy way?`,
      `Could you show me ${topic} like a game?`,
      `What should I know first about ${topic}?`,
      `I want to learn ${topic}, but I keep forgetting it.`
    ],
    '7-10': [
      `I am stuck on ${topic}. Can you help me understand it?`,
      `My brain is mixing up ${topic}. What is the big idea?`,
      `Can you explain ${topic} with one clear example?`,
      `I think I almost get ${topic}, but not fully.`,
      `Can you make ${topic} feel more real to me?`
    ]
  };

  return pick(byAge[record.age_range] || byAge['4-6'], seed);
}

function emotionOpener(emotion, seed) {
  return pickPair(EMOTION_OPENERS[emotion] || EMOTION_OPENERS.uncertain, seed);
}

function makeSupport(record, seed) {
  const facts = getFacts(record);
  const concept = extractPlainConcept(record, facts[Math.min(1, facts.length - 1)] || facts[0]);
  const detailTemplates = [
    `${concept}.`,
    `you can notice that ${concept}.`,
    `one example is that ${concept}.`,
    `it helps when you remember that ${concept}.`
  ];
  return pick(detailTemplates, seed);
}

function makeRecap(record) {
  const fact = getFacts(record)[0] || `We are learning about ${makeTopicLabel(record)}.`;
  return simplifyFactForChild(record, fact, hashString(record.conversation_id || makeTopicLabel(record)));
}

function makeInteractivePrompt(record, seed) {
  const topic = makeTopicLabel(record);
  const engagement = cleanText(record.metadata?.engagement_type || record.engagement_type || '').toLowerCase();
  const prompts = [];

  if (engagement.includes('song')) {
    prompts.push('Can you say one part with me?');
    prompts.push('Want to tap the rhythm while we try it?');
    prompts.push('Would you like to sing one line with me?');
  }
  if (engagement.includes('game')) {
    prompts.push('Do you want to try one together?');
    prompts.push('Can you spot one example by yourself?');
    prompts.push('Want a quick turn with the game idea?');
  }
  if (engagement.includes('story')) {
    prompts.push('What do you think happens next?');
    prompts.push('Which part stands out most to you?');
    prompts.push('Which character or moment feels biggest to you?');
  }
  if (cleanText(record.topic_category).toLowerCase().includes('math')) {
    prompts.push('Can we solve one together now?');
  }
  if (cleanText(record.topic_category).toLowerCase().includes('science')) {
    prompts.push('What do you notice about that?');
  }

  if (record.age_range === '0-3') {
    prompts.push('Can you try it with me?');
    prompts.push('Want to point, clap, or count with me?');
    prompts.push('Can you show me with your hands or voice?');
  } else if (record.age_range === '4-6') {
    prompts.push(`Do you want to explore more of ${topic}?`);
    prompts.push('Can you try that idea with me?');
    prompts.push('Should we test that idea together?');
  } else {
    prompts.push(`What part of ${topic} feels most important to you?`);
    prompts.push('Can you explain one piece back to me?');
    prompts.push('Which part would you tell a friend first?');
  }
  return pick(prompts, seed);
}

function makeSafeConversation(record, seed) {
  const flow = FLOW_PATTERNS[seed % FLOW_PATTERNS.length];
  const opener = emotionOpener(record.emotional_context, seed);
  const recap = makeRecap(record);
  const detail = makeSupport(record, seed + 1);
  const prompt = makeInteractivePrompt(record, seed + 2);
  const assistant1 = `${opener} ${recap} ${prompt}`;
  const assistant2 = flow.assistant2
    .replace('{{detail}}', detail)
    .replace('{{prompt}}', prompt);

  return {
    conversation_id: record.conversation_id,
    turn_number: record.turn_number,
    age_range: record.age_range,
    emotional_context: record.emotional_context,
    safety_level: 'safe',
    topic_category: record.topic_category,
    complexity_score: record.complexity_score,
    prerequisite_concepts: record.prerequisite_concepts,
    related_topics: record.related_topics,
    conversation_state: 'multi_turn',
    query_variations: record.query_variations,
    confidence_level: record.confidence_level === 'low' ? 'medium' : record.confidence_level,
    messages: [
      { role: 'system', state: 'greeting', content: SYSTEM_PROMPT },
      { role: 'user', state: 'ongoing', content: agePrompt(record, seed) },
      { role: 'assistant', state: 'ongoing', content: assistant1 },
      { role: 'user', state: 'ongoing', content: pick(flow.user2, seed + 3) },
      { role: 'assistant', state: 'ongoing', content: assistant2 }
    ],
    response_variants: [
      assistant1,
      `${opener} ${detail}`,
      `${recap} ${prompt}`
    ],
    follow_up_suggestions: [
      cleanText(record.related_topics?.[0] ? `Try another idea from ${record.related_topics[0]}` : 'Try one more example'),
      cleanText(record.related_topics?.[1] ? `Notice ${record.related_topics[1]} next` : 'Look for it in real life'),
      cleanText(prompt.replace(/[?]+$/g, ''))
    ],
    metadata: {
      ...record.metadata,
      quality_flags: {
        ...(record.metadata?.quality_flags || {}),
        factual_grounding: 'source-only',
        hallucination_risk: 'guarded'
      }
    }
  };
}

function makeUnsafeConversation(record, unsafeIndex, seed) {
  const scenario = pick(UNSAFE_SCENARIOS[record.age_range] || UNSAFE_SCENARIOS['4-6'], seed + unsafeIndex);
  const opener = emotionOpener(record.emotional_context, seed);
  const firstAssistant = `${opener} ${scenario.first} ${scenario.redirect}`;
  const secondAssistant = `${scenario.second} ${scenario.redirect}`;

  return {
    conversation_id: `${record.conversation_id}_unsafe`,
    turn_number: 1,
    age_range: record.age_range,
    emotional_context: record.emotional_context,
    safety_level: 'unsafe',
    topic_category: 'safety',
    complexity_score: Math.max(1, Math.min(5, record.complexity_score)),
    prerequisite_concepts: [scenario.topic, 'trusted adults', 'safe choices'],
    related_topics: ['safety', scenario.topic, 'trusted adults'],
    conversation_state: 'multi_turn',
    query_variations: [scenario.user1, scenario.user2, `help with ${scenario.topic}`],
    confidence_level: 'high',
    messages: [
      { role: 'system', state: 'greeting', content: SYSTEM_PROMPT },
      { role: 'user', state: 'ongoing', content: scenario.user1 },
      { role: 'assistant', state: 'ongoing', content: firstAssistant },
      { role: 'user', state: 'ongoing', content: scenario.user2 },
      { role: 'assistant', state: 'ongoing', content: secondAssistant }
    ],
    response_variants: [
      firstAssistant,
      `${opener} ${scenario.first}`,
      secondAssistant
    ],
    follow_up_suggestions: [
      'Tell a trusted adult now',
      'Choose a safe activity instead',
      cleanText(scenario.redirect.replace(/[?]+$/g, ''))
    ],
    metadata: {
      ...record.metadata,
      subject: 'safety',
      quality_flags: {
        ...(record.metadata?.quality_flags || {}),
        factual_grounding: 'policy-grounded',
        hallucination_risk: 'low'
      }
    }
  };
}

function main() {
  const lines = fs.readFileSync(JSONL_PATH, 'utf8').trim().split(/\n/);
  const records = lines.map((line) => normalizeInputRecord(JSON.parse(line)));
  const offset = Math.floor(records.length / (UNSAFE_COUNT * 2));
  const unsafeSlots = new Set(
    Array.from({ length: UNSAFE_COUNT }, (_, index) => (offset + Math.floor((index * records.length) / UNSAFE_COUNT)) % records.length)
  );

  const improved = records.map((record, index) => {
    const seed = hashString(record.conversation_id || `${index}`);
    if (unsafeSlots.has(index)) {
      return makeUnsafeConversation(record, index, seed);
    }
    return makeSafeConversation(record, seed);
  });

  const jsonl = improved.map((item) => JSON.stringify(item)).join('\n') + '\n';
  fs.writeFileSync(JSONL_PATH, jsonl, 'utf8');

  if (fs.existsSync(JSON_PATH)) {
    const wrapper = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    wrapper.generated_at = new Date().toISOString();
    wrapper.total_threads = improved.length;
    wrapper.safety_thread_count = improved.filter((item) => item.safety_level === 'unsafe').length;
    wrapper.content = improved;
    fs.writeFileSync(JSON_PATH, `${JSON.stringify(wrapper, null, 2)}\n`, 'utf8');
  }

  console.log(JSON.stringify({ total: improved.length, unsafe: improved.filter((item) => item.safety_level === 'unsafe').length }, null, 2));
}

main();
