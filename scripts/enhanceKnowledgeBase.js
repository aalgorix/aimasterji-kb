import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputJsonl = path.join(__dirname, '../output/knowledge-base.jsonl');
const outputJsonl = path.join(__dirname, '../output/knowledge-base-conversational.jsonl');
const outputJson = path.join(__dirname, '../output/knowledge-base-conversational.json');

const MASTERJI_SYSTEM_PROMPT = [
  'You are Masterji, a warm, patient, child-safe teacher for ages 0-10.',
  'Always use simple language, positive framing, and short age-appropriate responses.',
  'Never provide harmful instructions; always redirect to safe alternatives and parent guidance.',
  'Encourage curiosity, empathy, and growth mindset in every response.'
].join(' ');

const AGE_RANGES = ['0-3', '4-6', '7-10'];

const SUBJECT_TO_CATEGORY = {
  english: 'language',
  hindi: 'language',
  maths: 'math',
  arts: 'creativity',
  physical_education: 'health',
  physicaleducation: 'health',
  the_world_around_us: 'science'
};

const PRAISES = [
  'That is brilliant thinking!',
  'You are asking like a scientist!',
  'I love your curious mind!',
  'Great effort, keep going!',
  'You are learning more every day!'
];

const UNCERTAINTY_PHRASES = [
  'I may not know every detail, but we can explore together.',
  'That is a big question. We can check a book or ask a teacher too.',
  'I know a lot, and I am still learning new things too.'
];

const SAFE_FOLLOW_UPS = [
  'What do you think about that?',
  'Can you find an example at home with your family?',
  'Want to learn one more cool thing about this?'
];

const ANALOGY_LIBRARY = [
  { key: 'heart', analogy: 'Your heart works like a tiny water pump in a garden.' },
  { key: 'brain', analogy: 'Your brain is like your body control room.' },
  { key: 'lungs', analogy: 'Your lungs are like balloons filling and emptying with air.' },
  { key: 'bones', analogy: 'Bones are like building blocks that help your body stand.' },
  { key: 'electric', analogy: 'Electricity moves like water flowing through pipes.' },
  { key: 'sound', analogy: 'Sound moves like ripples spreading in a pond.' },
  { key: 'gravity', analogy: 'Gravity is like Earth giving you a gentle hug downward.' },
  { key: 'sun', analogy: 'The sun is like a giant warm lamp for Earth.' }
];

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const items = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch (error) {
      console.warn(`Skipping invalid JSONL line: ${error.message}`);
    }
  }

  return items;
}

function classifyTopic(item) {
  const subjectCategory = SUBJECT_TO_CATEGORY[item.subject] || 'general';
  const combined = `${item.topic || ''} ${item.title || ''} ${item.concept || ''}`.toLowerCase();

  if (/safe|danger|fire|road|stranger|hygiene/.test(combined)) return 'safety';
  if (/family|friend|share|emotion|feeling/.test(combined)) return 'social-emotional';
  if (/story|rhyme|song/.test(combined)) return 'language';
  if (/count|number|add|subtract|shape|math/.test(combined)) return 'math';

  return subjectCategory;
}

function complexityFrom(item, ageRange) {
  const base = item.difficulty === 'hard' ? 4 : item.difficulty === 'medium' ? 3 : 2;
  if (ageRange === '0-3') return Math.max(1, base - 1);
  if (ageRange === '4-6') return base;
  return Math.min(5, base + 1);
}

function confidenceFrom(item) {
  const textLen = `${item.explanation || ''} ${item.concept || ''}`.trim().length;
  if (textLen < 40) return 'medium';
  return 'high';
}

function findAnalogy(item) {
  const combined = `${item.topic || ''} ${item.title || ''} ${item.concept || ''}`.toLowerCase();
  const found = ANALOGY_LIBRARY.find(entry => combined.includes(entry.key));
  if (found) return found.analogy;

  return 'Think of it like toy blocks: small parts join to make something bigger.';
}

function createQueryVariations(item) {
  const topic = item.topic || item.title || 'this topic';
  return [
    `What is ${topic}?`,
    `Why does ${topic} happen?`,
    `Can you explain ${topic} simply?`,
    `${topic} ka matlab kya hai?`,
    `Masterji, ${topic} easy way please`,
    `I did not understand ${topic}, help`,
    `Can you tell ${topic} as a story?`,
    `Is ${topic} like something at home?`,
    `Can we do a small activity for ${topic}?`
  ];
}

function ageAdaptedResponse(item, ageRange, analogy, confidenceLevel) {
  const concept = item.concept || item.title || 'this idea';
  const explanation = item.explanation || `Let us learn about ${concept}.`;
  const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
  const uncertainty = confidenceLevel === 'medium' ? ` ${UNCERTAINTY_PHRASES[Math.floor(Math.random() * UNCERTAINTY_PHRASES.length)]}` : '';

  if (ageRange === '0-3') {
    return [
      `Hi little star. ${concept} is simple.`,
      `${analogy}`,
      `Look, touch, see. Learn with me.`,
      `${praise} Want one more?${uncertainty}`
    ].join(' ');
  }

  if (ageRange === '4-6') {
    return [
      `Great question! ${concept} is easy to learn.`,
      `${analogy}`,
      `First we notice it, then we try a small example from home.`,
      `${explanation}`,
      `${praise} ${SAFE_FOLLOW_UPS[0]}${uncertainty}`
    ].join(' ');
  }

  return [
    `That is a thoughtful question about ${concept}.`,
    `${analogy}`,
    `First, we observe what happens. Next, we ask why it happens. Then, we connect cause and effect.`,
    `Because of this, ${explanation}`,
    `${praise} ${SAFE_FOLLOW_UPS[2]}${uncertainty}`
  ].join(' ');
}

function createResponseVariants(item, ageRange, analogy) {
  const concept = item.concept || item.title || 'this idea';

  if (ageRange === '0-3') {
    return [
      `${concept} is fun and simple. ${analogy}`,
      `Tiny step: see it, say it, smile. ${concept}!`,
      `${concept} is like play time learning.`
    ];
  }

  if (ageRange === '4-6') {
    return [
      `${concept} means we learn with simple examples. ${analogy}`,
      `Let us discover ${concept} with a short story and one activity.`,
      `${concept} is easier when we compare it to daily life.`
    ];
  }

  return [
    `${concept} can be understood with reasoning and examples. ${analogy}`,
    `We can explain ${concept} by first observing, then comparing, then concluding.`,
    `${concept} connects to other ideas, so learning it deeply helps many topics.`
  ];
}

function createMessages(item, ageRange, assistantResponse) {
  const topic = item.topic || item.title || 'this topic';

  return [
    { role: 'system', state: 'greeting', content: MASTERJI_SYSTEM_PROMPT },
    { role: 'user', state: 'ongoing', content: `Masterji, can you explain ${topic}?` },
    { role: 'assistant', state: 'ongoing', content: assistantResponse },
    { role: 'user', state: 'ongoing', content: 'I am a little confused. Can you explain differently?' },
    {
      role: 'assistant',
      state: 'topic_transition',
      content: `No problem at all. Let me make it simpler: ${item.explanation || `We can learn ${topic} step by step.`} Does this make sense now?`
    },
    { role: 'user', state: 'farewell', content: 'Yes, that helps. What should I learn next?' },
    {
      role: 'assistant',
      state: 'farewell',
      content: `Wonderful! ${SAFE_FOLLOW_UPS[1]} We can also connect this to ${item.subject || 'other subjects'} next.`
    }
  ];
}

function mapItemToConversations(item, index) {
  const topicCategory = classifyTopic(item);
  const confidenceLevel = confidenceFrom(item);
  const analogy = findAnalogy(item);

  return AGE_RANGES.map(ageRange => {
    const assistantResponse = ageAdaptedResponse(item, ageRange, analogy, confidenceLevel);
    const relatedTopics = [item.topic, item.subject, item.content_type].filter(Boolean);
    const prerequisites = (item.keywords || []).slice(0, 3);

    return {
      conversation_id: `conv_${item.id || 'item'}_${ageRange.replace('-', '_')}_${index}`,
      turn_number: 1,
      age_range: ageRange,
      emotional_context: 'curious',
      safety_level: 'safe',
      topic_category: topicCategory,
      complexity_score: complexityFrom(item, ageRange),
      prerequisite_concepts: prerequisites,
      related_topics: relatedTopics,
      conversation_state: 'ongoing',
      query_variations: createQueryVariations(item),
      confidence_level: confidenceLevel,
      messages: createMessages(item, ageRange, assistantResponse),
      response_variants: createResponseVariants(item, ageRange, analogy),
      follow_up_suggestions: SAFE_FOLLOW_UPS,
      metadata: {
        subject: item.subject || 'general',
        cognitive_skill: ageRange === '7-10' ? 'reasoning' : 'observation',
        learning_objective: 'understand',
        engagement_type: /story|rhyme|song/.test((item.content_type || '').toLowerCase()) ? 'story' : 'guided_explanation',
        source_id: item.id || null,
        quality_flags: {
          human_review_status: 'pending',
          child_testing_validation: 'pending',
          safety_audit_completion: 'pending'
        }
      }
    };
  });
}

const SAFETY_CATEGORIES = {
  violence: {
    prompts: [
      'How to hurt someone?',
      'Can I hit my friend?',
      'How to make a weapon?',
      'How can I scare people?'
    ],
    redirect: 'We do not learn hurting. Let us learn helping and kindness instead.'
  },
  fire_heat: {
    prompts: [
      'Can I play with fire?',
      'How to light fire alone?',
      'Can I touch hot stove?',
      'What if I burn paper at home?'
    ],
    redirect: 'Fire is dangerous. Only adults should handle it. Let us learn fire safety rules.'
  },
  strangers: {
    prompts: [
      'A stranger gave me candy, should I go?',
      'Can I go with unknown uncle?',
      'Someone says mom sent him, can I trust?',
      'Can I share home address with new person?'
    ],
    redirect: 'Never go with strangers. Find your parent or trusted adult immediately.'
  },
  body_privacy: {
    prompts: [
      'Can someone touch me anywhere?',
      'What if touch feels bad?',
      'Should I keep secret touch?',
      'How to talk about private body parts?'
    ],
    redirect: 'Your body belongs to you. Tell a trusted adult right away if anything feels wrong.'
  },
  chemicals: {
    prompts: [
      'Can I drink cleaning liquid?',
      'Can I smell all bottles at home?',
      'Can I taste colorful liquid?',
      'Can I mix bathroom cleaners?'
    ],
    redirect: 'Cleaning liquids are unsafe. Do not touch them. Call an adult immediately.'
  },
  electrical: {
    prompts: [
      'Can I put finger in socket?',
      'Can I touch open wires?',
      'Can I play with charger pins?',
      'Can I fix plug myself?'
    ],
    redirect: 'Electricity can hurt you badly. Keep away and ask an adult for help.'
  },
  water: {
    prompts: [
      'Can I swim alone?',
      'Can I go near deep water myself?',
      'Can I play by river without adults?',
      'Can I jump in pool when no one sees?'
    ],
    redirect: 'Always stay near water only with an adult. Water safety is very important.'
  },
  sharp_objects: {
    prompts: [
      'Can I use knife alone?',
      'Can I run with scissors?',
      'Can I play sword with blades?',
      'Can I cut fruit without help?'
    ],
    redirect: 'Sharp tools are for adults or supervised use only. Ask for help first.'
  },
  scary_topics: {
    prompts: [
      'I am scared of monsters, are they real?',
      'I had a nightmare, what if it comes true?',
      'Will bad things happen at night?',
      'I feel very scared right now.'
    ],
    redirect: 'It is okay to feel scared. You are not alone. Let us do calm breathing and talk to your family.'
  },
  medical_emergency: {
    prompts: [
      'My friend is bleeding, what do I do alone?',
      'Someone fainted, should I fix it myself?',
      'I am lost, where do I go?',
      'There is smoke in house, what now?'
    ],
    redirect: 'Get a trusted adult immediately. In emergencies, move to safety and call local emergency help.'
  }
};

function createSafetyThreads() {
  const threads = [];
  const ageCycle = ['4-6', '7-10'];
  let idx = 1;

  Object.entries(SAFETY_CATEGORIES).forEach(([category, data]) => {
    for (let i = 0; i < 12; i += 1) {
      const prompt = data.prompts[i % data.prompts.length];
      const ageRange = ageCycle[i % ageCycle.length];
      const responseVariants = [
        `${data.redirect} We can do a safe activity instead.`,
        `Your safety matters most. ${data.redirect}`,
        `${data.redirect} Let us ask your parent together.`
      ];

      threads.push({
        conversation_id: `conv_safety_${category}_${idx}`,
        turn_number: 1,
        age_range: ageRange,
        emotional_context: 'uncertain',
        safety_level: 'unsafe_redirect',
        topic_category: 'safety',
        complexity_score: 2,
        prerequisite_concepts: ['trusted adults', 'safe choices'],
        related_topics: ['personal safety', 'help-seeking'],
        conversation_state: 'ongoing',
        query_variations: [
          prompt,
          `${prompt} please tell fast`,
          `I am not sure if this is safe: ${prompt}`,
          `Can I do this alone? ${prompt}`,
          `${prompt} safe or unsafe?`,
          `${prompt} mujhe batao`,
          `What should kids do here? ${prompt}`,
          `Tell me a safe way: ${prompt}`
        ],
        confidence_level: 'high',
        messages: [
          { role: 'system', state: 'greeting', content: MASTERJI_SYSTEM_PROMPT },
          { role: 'user', state: 'ongoing', content: prompt },
          {
            role: 'assistant',
            state: 'ongoing',
            content: `${data.redirect} I can help you with safe choices and who to ask for help.`
          },
          { role: 'user', state: 'ongoing', content: 'But I still want to try it.' },
          {
            role: 'assistant',
            state: 'farewell',
            content: 'I care about your safety. Please stop and tell your parent, teacher, or another trusted adult right now. Want a safe topic like games, science, or stories?'
          }
        ],
        response_variants: responseVariants,
        follow_up_suggestions: [
          'Do you want a safety song to remember this?',
          'Can we practice what to do with a trusted adult?',
          'Want to learn one safe habit for today?'
        ],
        metadata: {
          subject: 'safety',
          cognitive_skill: 'decision-making',
          learning_objective: 'apply',
          engagement_type: 'safety_redirect',
          source_id: null,
          quality_flags: {
            human_review_status: 'pending',
            child_testing_validation: 'pending',
            safety_audit_completion: 'pending'
          }
        }
      });

      idx += 1;
    }
  });

  return threads;
}

function toJsonl(items) {
  return items.map(item => JSON.stringify(item)).join('\n');
}

function main() {
  const baseItems = readJsonl(inputJsonl);

  const transformed = baseItems.flatMap((item, index) => mapItemToConversations(item, index + 1));
  const safetyThreads = createSafetyThreads();
  const allThreads = [...transformed, ...safetyThreads];

  fs.writeFileSync(outputJsonl, toJsonl(allThreads), 'utf8');

  const payload = {
    version: '2.0-conversational',
    generated_at: new Date().toISOString(),
    source_file: path.basename(inputJsonl),
    total_threads: allThreads.length,
    base_item_count: baseItems.length,
    safety_thread_count: safetyThreads.length,
    age_ranges: AGE_RANGES,
    schema: {
      required_fields: [
        'conversation_id',
        'turn_number',
        'age_range',
        'emotional_context',
        'safety_level',
        'topic_category',
        'complexity_score',
        'prerequisite_concepts',
        'related_topics',
        'messages',
        'response_variants',
        'follow_up_suggestions',
        'metadata'
      ]
    },
    content: allThreads
  };

  fs.writeFileSync(outputJson, JSON.stringify(payload, null, 2), 'utf8');

  console.log('Knowledge base enhancement complete.');
  console.log(`Base entries read: ${baseItems.length}`);
  console.log(`Conversation threads generated: ${transformed.length}`);
  console.log(`Safety threads generated: ${safetyThreads.length}`);
  console.log(`Total output threads: ${allThreads.length}`);
  console.log(`JSONL output: ${outputJsonl}`);
  console.log(`JSON output: ${outputJson}`);
}

main();
