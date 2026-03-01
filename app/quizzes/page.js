'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { saveVisionItem } from '@/app/lib/storage';

// ─── Quiz Data ────────────────────────────────────────────────────────────────

const QUIZZES = [
  {
    id: 'element',
    emoji: '🔮',
    title: "What's Your Elemental Archetype?",
    description: 'Discover which of the four classical elements — fire, earth, air, or water — best mirrors your inner nature.',
    questions: [
      {
        text: 'When someone you care about is struggling, your first instinct is to…',
        options: [
          { label: 'Call them and try to spark some momentum — sitting in it too long makes things worse', value: 'fire' },
          { label: 'Make sure their immediate, practical needs are covered before anything else', value: 'earth' },
          { label: 'Ask questions and help them think through what\'s actually going on', value: 'air' },
          { label: 'Sit with them in it — sometimes being fully present is the whole thing', value: 'water' },
        ],
      },
      {
        text: 'After a genuinely draining week, the thing that actually restores you is…',
        options: [
          { label: 'Something physical and alive — movement, music loud, anything that burns through it', value: 'fire' },
          { label: 'Long unstructured time with your hands busy — cooking, tidying, making something', value: 'earth' },
          { label: 'A conversation that goes somewhere real, or reading something that reframes everything', value: 'air' },
          { label: 'Complete solitude and something that lets you feel it all the way through', value: 'water' },
        ],
      },
      {
        text: 'When someone gives you a tight deadline, you…',
        options: [
          { label: 'Come alive — urgency focuses you in a way that nothing else does', value: 'fire' },
          { label: 'Plan backward from the date and move steadily — last-minute scrambles don\'t work for you', value: 'earth' },
          { label: 'Think it through from every angle and then produce something in a focused burst', value: 'air' },
          { label: 'Feel hampered by it — you work better when you\'re guided by when something feels ready', value: 'water' },
        ],
      },
      {
        text: 'Looking back, the decision you most regret is usually the one where you…',
        options: [
          { label: 'Held back when you should have acted on what you felt strongly', value: 'fire' },
          { label: 'Rushed something that needed more time to settle and grow', value: 'earth' },
          { label: 'Led with feeling when the situation needed careful, clear thinking', value: 'air' },
          { label: 'Overrode your gut because it wasn\'t rational enough to defend to anyone', value: 'water' },
        ],
      },
      {
        text: 'You walk into a room where conflict is quietly brewing. Before anyone speaks, you…',
        options: [
          { label: 'Feel pulled to address it directly — tension left to fester always gets worse', value: 'fire' },
          { label: 'Start doing something grounding — offer something, create calm, restore physical order', value: 'earth' },
          { label: 'Quietly map the dynamics and start thinking about how to navigate this', value: 'air' },
          { label: 'Feel the emotional undercurrent in the room viscerally before a single word is said', value: 'water' },
        ],
      },
      {
        text: 'When you look back at your proudest moments, they tend to involve…',
        options: [
          { label: 'Doing something brave when fear was present and most people were waiting', value: 'fire' },
          { label: 'Making or tending something lasting with your own hands, slowly and carefully', value: 'earth' },
          { label: 'A breakthrough in understanding — seeing something clearly that no one else could', value: 'air' },
          { label: 'A moment of true connection — being fully there for someone when it mattered most', value: 'water' },
        ],
      },
      {
        text: 'The criticism that genuinely cuts deepest for you is…',
        options: [
          { label: '"You went too far — you burned everything down in the process"', value: 'fire' },
          { label: '"You\'re so set in your ways you couldn\'t adapt when it mattered"', value: 'earth' },
          { label: '"You\'re all ideas and no follow-through"', value: 'air' },
          { label: '"You\'re too sensitive — you can\'t separate your feelings from reality"', value: 'water' },
        ],
      },
      {
        text: 'You lose track of time most naturally when you\'re…',
        options: [
          { label: 'In the middle of something that has your whole body lit up — a cause, a mission, a challenge', value: 'fire' },
          { label: 'Absorbed in making or tending something slowly, with your hands, going nowhere fast', value: 'earth' },
          { label: 'Deep in a conversation or research thread that keeps opening further than expected', value: 'air' },
          { label: 'So pulled into feeling — music, a story, a memory — that the external world just dissolves', value: 'water' },
        ],
      },
    ],
    results: {
      fire: {
        title: 'Fire Archetype',
        emoji: '🔥',
        tagline: 'You burn bright and lead the way.',
        description:
          'Your spirit is ignited by passion, courage, and the thrill of becoming. You light up every room, inspire others to take risks, and refuse to let life grow dull. The fire within you is a creative force — it demands expression and forward motion.',
        keywords: ['Courage', 'Passion', 'Momentum', 'Leadership', 'Vitality'],
      },
      earth: {
        title: 'Earth Archetype',
        emoji: '🌿',
        tagline: 'You are rooted, real, and deeply nourishing.',
        description:
          'Your power lives in patience, presence, and the quiet wisdom of things that grow slowly. You build what lasts. Others feel safe in your orbit because you offer the rare gift of genuine steadiness. Trust the soil beneath your feet — you were made to bloom.',
        keywords: ['Stability', 'Patience', 'Grounding', 'Nourishment', 'Wisdom'],
      },
      air: {
        title: 'Air Archetype',
        emoji: '🌬️',
        tagline: 'Your mind moves the world.',
        description:
          'You are a natural thinker, connector, and communicator. Ideas flow through you like wind, and your curiosity keeps life perpetually interesting. You thrive in the realm of conversation, learning, and the exchange of perspectives. Your gift is seeing what others miss.',
        keywords: ['Clarity', 'Curiosity', 'Ideas', 'Connection', 'Perspective'],
      },
      water: {
        title: 'Water Archetype',
        emoji: '🌊',
        tagline: 'You feel everything — and that is your power.',
        description:
          'Your depth is immeasurable. You move through the world with heightened intuition, emotional intelligence, and a sensitivity that borders on the mystical. You heal, you reflect, you flow around obstacles rather than forcing your way through. Your greatest wisdom lives below the surface.',
        keywords: ['Intuition', 'Emotion', 'Healing', 'Depth', 'Receptivity'],
      },
    },
  },
  {
    id: 'seeker',
    emoji: '✨',
    title: 'What Kind of Spiritual Seeker Are You?',
    description: 'Uncover your unique path — whether you seek through mystery, groundedness, vision, or empathic connection.',
    questions: [
      {
        text: 'When something unexpected happens that feels deeply significant, your first instinct is to…',
        options: [
          { label: 'Look for what it\'s symbolising — what is this moment trying to tell you?', value: 'mystic' },
          { label: 'Stay fully inside the experience — the moment itself is the point', value: 'grounded' },
          { label: 'Ask what door this might be opening and where it wants to lead', value: 'visionary' },
          { label: 'Turn toward the people around you — how is this landing for them too?', value: 'empath' },
        ],
      },
      {
        text: 'The conversation that would genuinely captivate you is one about…',
        options: [
          { label: 'Why certain symbols, myths, and patterns keep surfacing across all of human history', value: 'mystic' },
          { label: 'The body, the earth, and what it actually means to live a well-tended life', value: 'grounded' },
          { label: 'What\'s coming — what\'s possible, what you\'re building, what the future could hold', value: 'visionary' },
          { label: 'Someone\'s real inner life — what they carry, what they feel, what they need', value: 'empath' },
        ],
      },
      {
        text: 'When you\'re moving through a genuinely painful chapter, what helps you most is…',
        options: [
          { label: 'Finding the deeper meaning — what is this experience asking you to understand?', value: 'mystic' },
          { label: 'Returning to your body and your routines — small, physical, ordinary anchors', value: 'grounded' },
          { label: 'A glimpse of what comes after — something to aim for that makes the difficulty purposeful', value: 'visionary' },
          { label: 'Being genuinely held by someone who truly understands what you\'re carrying', value: 'empath' },
        ],
      },
      {
        text: 'Looking back, you feel proudest when you…',
        options: [
          { label: 'Followed a thread or sign that most people would have dismissed entirely', value: 'mystic' },
          { label: 'Showed up quietly and consistently for the ordinary things most people overlook', value: 'grounded' },
          { label: 'Committed to a vision and moved toward it even without any guarantee', value: 'visionary' },
          { label: 'Made someone feel genuinely understood in a moment when they needed it most', value: 'empath' },
        ],
      },
      {
        text: 'The moments when you\'ve felt most spiritually hollow were when…',
        options: [
          { label: 'Life felt random and purposeless — you couldn\'t find any hidden thread', value: 'mystic' },
          { label: 'You\'d been living in your head so long you\'d lost the ground beneath your feet', value: 'grounded' },
          { label: 'You\'d lost sight of where you were going and couldn\'t feel any direction pulling you', value: 'visionary' },
          { label: 'You\'d been isolated long enough that you\'d forgotten what it felt like to truly reach someone', value: 'empath' },
        ],
      },
      {
        text: 'The thing that most reveals where you still have growing to do is…',
        options: [
          { label: 'A tendency to get so absorbed in seeking meaning that you miss the moment in front of you', value: 'mystic' },
          { label: 'A pull toward the safe and familiar even when something genuinely new is calling', value: 'grounded' },
          { label: 'Living so far in the possibility of what\'s coming that you\'re never quite fully here', value: 'visionary' },
          { label: 'Absorbing others\' pain so completely that you lose your own signal entirely', value: 'empath' },
        ],
      },
      {
        text: 'The mark you most want to leave on the people who know you is…',
        options: [
          { label: 'A sense of wonder — the feeling that there is always more than meets the eye', value: 'mystic' },
          { label: 'A feeling of being nourished, settled, and at home in the world', value: 'grounded' },
          { label: 'An expanded sense of what\'s possible — the belief that their lives could be larger', value: 'visionary' },
          { label: 'The certainty that they were truly seen and loved for exactly who they are', value: 'empath' },
        ],
      },
      {
        text: 'When you\'re at your wisest, the quality others notice in you is…',
        options: [
          { label: 'An ability to see the hidden connection between things that seem completely unrelated', value: 'mystic' },
          { label: 'A quality of presence — you\'re genuinely here, without needing anything to be different', value: 'grounded' },
          { label: 'An infectious certainty that something better is not only possible but inevitable', value: 'visionary' },
          { label: 'A quality of attention that makes people feel like the only person in the room', value: 'empath' },
        ],
      },
    ],
    results: {
      mystic: {
        title: 'The Mystic',
        emoji: '🌙',
        tagline: 'You walk between worlds.',
        description:
          'You are drawn to the veiled, the symbolic, and the mysteriously interconnected. Astrology, tarot, dreams, and ancient wisdom traditions are your native language. You see meaning where others see coincidence, and your path is one of eternal initiation — always uncovering another layer of the great mystery.',
        keywords: ['Mystery', 'Symbolism', 'Depth', 'Occult', 'Initiation'],
      },
      grounded: {
        title: 'The Grounded Soul',
        emoji: '🌱',
        tagline: 'The sacred lives in the everyday.',
        description:
          'Your spirituality is embodied, practical, and deeply real. You find the divine in a morning ritual, a mindful meal, the soil under your nails. You don\'t need grand revelations — you trust the slow, steady accumulation of presence. Your path is the most ancient of all: to be here, fully.',
        keywords: ['Presence', 'Embodiment', 'Ritual', 'Nature', 'Simplicity'],
      },
      visionary: {
        title: 'The Visionary',
        emoji: '🦋',
        tagline: 'You hold the blueprint for what is possible.',
        description:
          'You are a dreamer and a builder of new worlds. Your spirituality is forward-facing, fuelled by faith in possibility and the conviction that consciousness can shape reality. You are most alive when casting a bold vision, aligning your energy with your purpose, and taking inspired action toward a life that doesn\'t yet exist.',
        keywords: ['Vision', 'Manifestation', 'Purpose', 'Possibility', 'Inspiration'],
      },
      empath: {
        title: 'The Empath',
        emoji: '💜',
        tagline: 'Love is your most powerful practice.',
        description:
          'Your spiritual path runs through the heart. You experience the divine most vividly in connection — in the moment of genuine recognition between souls, in the act of compassionate service, in the beauty of shared vulnerability. Your gift is boundless empathy; your work is to learn to hold that gift without losing yourself.',
        keywords: ['Compassion', 'Connection', 'Healing', 'Service', 'Empathy'],
      },
    },
  },
  {
    id: 'chakra',
    emoji: '🌈',
    title: "Which Chakra Needs Attention?",
    description: 'Discover which of your seven energy centres is asking for care and healing right now.',
    questions: [
      {
        text: 'When you honestly check in with your body and life right now, the area that feels most off is…',
        options: [
          { label: 'My sense of safety — finances, home, or physical wellbeing feel shaky', value: 'root' },
          { label: 'My creativity and joy — I feel flat, uninspired, cut off from pleasure', value: 'sacral' },
          { label: 'My confidence — I feel powerless and unable to trust my own direction', value: 'solar' },
          { label: 'My heart — I feel guarded, grieving, or unable to open up', value: 'heart' },
        ],
      },
      {
        text: 'In conversations, the thing I struggle with most is…',
        options: [
          { label: 'Finding the courage to say what I truly think and feel', value: 'throat' },
          { label: 'Trusting my gut instinct over the noise of other people\'s opinions', value: 'thirdeye' },
          { label: 'Feeling connected to a sense of meaning or higher purpose', value: 'crown' },
          { label: 'Speaking freely without fear of losing security or belonging', value: 'root' },
        ],
      },
      {
        text: 'My body has been signalling that something is blocked through…',
        options: [
          { label: 'A creative restlessness — energy with nowhere beautiful to go', value: 'sacral' },
          { label: 'Digestive upset, fatigue, or a hollow feeling in my stomach area', value: 'solar' },
          { label: 'Tightness in my chest or a wordless ache I can\'t quite name', value: 'heart' },
          { label: 'Jaw tension, a sore throat, or tears rising when I try to speak my truth', value: 'throat' },
        ],
      },
      {
        text: 'If I am fully honest, what I most long for is…',
        options: [
          { label: 'Clear intuition — to trust my inner vision without constant second-guessing', value: 'thirdeye' },
          { label: 'A felt sense of divine purpose and deep spiritual peace', value: 'crown' },
          { label: 'True stability — a solid foundation I can rest my whole life on', value: 'root' },
          { label: 'To feel excited, creative, and genuinely alive again', value: 'sacral' },
        ],
      },
      {
        text: 'A pattern that keeps showing up in my relationships is…',
        options: [
          { label: 'Making myself smaller or dimming my power to keep the peace', value: 'solar' },
          { label: 'Keeping my walls up even with the people I love most', value: 'heart' },
          { label: 'Holding back my real words and ending up feeling chronically unseen', value: 'throat' },
          { label: 'Overriding red flags I can clearly see with logic or wishful thinking', value: 'thirdeye' },
        ],
      },
      {
        text: 'What I most need more of in my life right now is…',
        options: [
          { label: 'A sense of larger meaning — that my life is part of something', value: 'crown' },
          { label: 'Rhythm, consistency, and simple earthly nourishment', value: 'root' },
          { label: 'Pleasure, creativity, and enjoying life without guilt', value: 'sacral' },
          { label: 'Self-trust, healthy boundaries, and confidence in my own power', value: 'solar' },
        ],
      },
      {
        text: 'The healing practice that genuinely calls to me right now is…',
        options: [
          { label: 'Heart-opening movement, a cacao ceremony, or writing forgiveness letters', value: 'heart' },
          { label: 'Singing, chanting, journaling, or finally having the brave conversation', value: 'throat' },
          { label: 'Sitting in meditation, dream journaling, or spending a night under the stars', value: 'thirdeye' },
          { label: 'Prayer, extended breathwork, or a period of silence and spiritual retreat', value: 'crown' },
        ],
      },
      {
        text: 'The thing I find most difficult to ask for honestly is…',
        options: [
          { label: 'More stability — safety, security, and a life that doesn\'t feel so precarious', value: 'root' },
          { label: 'Permission to want what I want and enjoy life without guilt or apology', value: 'sacral' },
          { label: 'Recognition that my direction and efforts are genuinely valued', value: 'solar' },
          { label: 'To be loved without having to earn or deserve it first', value: 'heart' },
        ],
      },
      {
        text: 'When I sit in genuine stillness, the voice I most often hear says…',
        options: [
          { label: '"Don\'t say it — they won\'t understand, and you\'ll only regret it"', value: 'throat' },
          { label: '"You don\'t really know what to think — wait until someone wiser tells you"', value: 'thirdeye' },
          { label: '"None of this matters — you can\'t feel any real sense of why you\'re here"', value: 'crown' },
          { label: '"Keep your guard up — things aren\'t as safe as they appear"', value: 'root' },
        ],
      },
      {
        text: 'The way my inner blocks show up in my body most clearly is…',
        options: [
          { label: 'A flatness or restlessness — creative energy with nowhere beautiful to go', value: 'sacral' },
          { label: 'A gnawing urge to prove myself or take control when things feel uncertain', value: 'solar' },
          { label: 'A guardedness — a reluctance to fully open even with the people I love', value: 'heart' },
          { label: 'Words that stay swallowed — or that come out wrong and leave me feeling unseen', value: 'throat' },
        ],
      },
      {
        text: 'What I most want to stop apologising for is…',
        options: [
          { label: 'Having clear intuition about things I can\'t logically explain', value: 'thirdeye' },
          { label: 'My need for meaning, purpose, and something larger to believe in', value: 'crown' },
          { label: 'Needing more stability and predictability than others seem to need', value: 'root' },
          { label: 'My appetite for pleasure, beauty, and things that make me feel genuinely alive', value: 'sacral' },
        ],
      },
    ],
    results: {
      root: {
        title: 'Root Chakra',
        emoji: '🟥',
        tagline: 'Your foundation is calling for care.',
        description: 'The root chakra governs safety, belonging, and the primal sense of having enough. When it needs attention you may feel anxious, financially stressed, or disconnected from your body. Grounding practices — walking barefoot, nourishing food, time in nature, and breathwork — help restore the steady earth energy you need.',
        keywords: ['Security', 'Grounding', 'Safety', 'Stability', 'Presence'],
      },
      sacral: {
        title: 'Sacral Chakra',
        emoji: '🧡',
        tagline: 'Your creative and sensual life is asking to be rekindled.',
        description: 'The sacral chakra holds the energy of pleasure, creativity, desire, and flow. When it\'s blocked you may feel creatively dry, emotionally numb, or cut off from what once brought you joy. Nourish it through dance, water, expressive art, and giving yourself permission to want what you want.',
        keywords: ['Creativity', 'Pleasure', 'Flow', 'Desire', 'Emotion'],
      },
      solar: {
        title: 'Solar Plexus Chakra',
        emoji: '💛',
        tagline: 'Your personal power is ready to rise.',
        description: 'The solar plexus chakra is the seat of will, confidence, and self-determination. When it is blocked you may feel powerless, indecisive, or chronically undervalued. Reclaim it through clear boundary-setting, intentional action, and practices that remind you of your inherent worth.',
        keywords: ['Confidence', 'Power', 'Will', 'Agency', 'Self-Worth'],
      },
      heart: {
        title: 'Heart Chakra',
        emoji: '💚',
        tagline: 'The tender centre of your chest is asking to be opened.',
        description: 'The heart chakra governs love, compassion, and the courage to stay open. When it needs healing you may feel guarded, grieving, or unable to fully trust. Forgiveness rituals, heart-opening yoga, genuine connection, and letting yourself be loved without conditions are the medicine.',
        keywords: ['Love', 'Compassion', 'Forgiveness', 'Openness', 'Healing'],
      },
      throat: {
        title: 'Throat Chakra',
        emoji: '💙',
        tagline: 'Your truth is waiting to be spoken.',
        description: 'The throat chakra is the centre of authentic expression, communication, and creative voice. When blocked you may hold back your real thoughts, feel chronically misunderstood, or swallow words that need saying. Chanting, singing, journaling, and brave conversations where you say the real thing are your medicine.',
        keywords: ['Expression', 'Truth', 'Voice', 'Communication', 'Authenticity'],
      },
      thirdeye: {
        title: 'Third Eye Chakra',
        emoji: '🔮',
        tagline: 'Your inner vision is asking to be trusted.',
        description: 'The third eye chakra governs intuition, inner knowing, and the ability to perceive beyond the surface. When clouded you may overthink, distrust your gut, or feel unable to access your own clarity. Meditation, dream journaling, and choosing to act on intuition even when uncertain will open it.',
        keywords: ['Intuition', 'Vision', 'Clarity', 'Perception', 'Inner-Knowing'],
      },
      crown: {
        title: 'Crown Chakra',
        emoji: '🌸',
        tagline: 'You are seeking reconnection with the sacred.',
        description: 'The crown chakra connects you to your higher self, spiritual understanding, and the experience of unity. When it needs attention you may feel isolated, purposeless, or cut off from the sense that life holds meaning. Meditation, prayer, breathwork, and time in awe of something greater will nourish it.',
        keywords: ['Spirituality', 'Unity', 'Purpose', 'Transcendence', 'Peace'],
      },
    },
  },
  {
    id: 'attachment',
    emoji: '💞',
    title: "What's Your Attachment Style?",
    description: 'Explore how your early experiences shaped the way you love, connect, and respond in close relationships.',
    questions: [
      {
        text: 'When a partner hasn\'t replied in a few hours, you…',
        options: [
          { label: 'Assume they\'re busy and get on with your day without drama', value: 'secure' },
          { label: 'Start scanning your last messages for what might have gone wrong', value: 'anxious' },
          { label: 'Enjoy the space — a little distance feels natural and easy', value: 'avoidant' },
          { label: 'Swing between "they hate me" and "I don\'t even care anyway"', value: 'fearful' },
        ],
      },
      {
        text: 'Your idea of a healthy relationship is…',
        options: [
          { label: 'Two whole people who genuinely choose each other, every day', value: 'secure' },
          { label: 'Someone who is consistently available and reliably reassuring', value: 'anxious' },
          { label: 'A deep connection that doesn\'t require me to give up my independence', value: 'avoidant' },
          { label: 'Something I desperately want but genuinely worry I don\'t deserve', value: 'fearful' },
        ],
      },
      {
        text: 'When you feel hurt by someone you love, you…',
        options: [
          { label: 'Express it clearly and trust you\'ll work it through together', value: 'secure' },
          { label: 'Need reassurance immediately — the uncertainty is unbearable', value: 'anxious' },
          { label: 'Withdraw and process alone, sometimes for a long time', value: 'avoidant' },
          { label: 'Lash out and feel guilty for it, or go completely cold', value: 'fearful' },
        ],
      },
      {
        text: 'In the early stages of romance, your pattern tends to be…',
        options: [
          { label: 'Excited but grounded — enjoying getting to know someone step by step', value: 'secure' },
          { label: 'Falling fast and quietly obsessing over whether they feel the same', value: 'anxious' },
          { label: 'Interested but wary — one foot always near the exit', value: 'avoidant' },
          { label: 'Intensely drawn in while simultaneously bracing for rejection', value: 'fearful' },
        ],
      },
      {
        text: 'If you had to describe the love in your childhood home, you\'d say…',
        options: [
          { label: 'I felt loved and safe — my needs were largely met consistently', value: 'secure' },
          { label: 'Love felt inconsistent — I always had to work a little to feel seen', value: 'anxious' },
          { label: 'I learned to be self-sufficient — emotional needs were discouraged', value: 'avoidant' },
          { label: 'It was unpredictable — the people I loved most also scared me sometimes', value: 'fearful' },
        ],
      },
      {
        text: 'When conflict arises in a relationship, your instinct is to…',
        options: [
          { label: 'Stay in the conversation and talk it through with care', value: 'secure' },
          { label: 'Escalate or cling — afraid this conflict means the beginning of the end', value: 'anxious' },
          { label: 'Shut down and go silent until it passes on its own', value: 'avoidant' },
          { label: 'Swing between wanting to fight and wanting to disappear entirely', value: 'fearful' },
        ],
      },
      {
        text: 'Your deepest fear in love is…',
        options: [
          { label: 'Losing someone I truly care for — but I know I\'d eventually survive it', value: 'secure' },
          { label: 'Not being enough — and being abandoned because of it', value: 'anxious' },
          { label: 'Being consumed by someone else and losing myself in the process', value: 'avoidant' },
          { label: 'Both: being left behind AND being too close — love terrifies me both ways', value: 'fearful' },
        ],
      },
      {
        text: 'Intimacy, to you, most often feels…',
        options: [
          { label: 'Nourishing, natural, and something I lean into freely', value: 'secure' },
          { label: 'Something I crave achingly and simultaneously fear losing', value: 'anxious' },
          { label: 'Uncomfortable — I prefer closeness in measured, controllable doses', value: 'avoidant' },
          { label: 'A beautiful, terrifying paradox I don\'t know how to win', value: 'fearful' },
        ],
      },
      {
        text: 'When someone you love goes through something hard, you…',
        options: [
          { label: 'Show up consistently — not perfectly, but steadily, for as long as it takes', value: 'secure' },
          { label: 'Pour everything into supporting them while quietly worrying it still isn\'t enough', value: 'anxious' },
          { label: 'Offer practical help and space — I\'m there, but emotional presence is harder for me', value: 'avoidant' },
          { label: 'Desperately want to be the one they turn to, but panic that I might get it wrong', value: 'fearful' },
        ],
      },
      {
        text: 'The thing you\'re still learning in love is…',
        options: [
          { label: 'That presence is sometimes the whole point — you don\'t need to fix everything', value: 'secure' },
          { label: 'That I am worthy of love even when I stop monitoring and performing love perfectly', value: 'anxious' },
          { label: 'That needing someone isn\'t weakness — it is one of the most human things there is', value: 'avoidant' },
          { label: 'That I can want closeness and still be safe — both truths can coexist', value: 'fearful' },
        ],
      },
    ],
    results: {
      secure: {
        title: 'Secure Attachment',
        emoji: '🌿',
        tagline: 'You love with an open, grounded heart.',
        description: 'Securely attached individuals offer love freely and receive it without excessive anxiety or need to guard themselves. You likely experienced consistent care early in life, and that foundation allows you to navigate intimacy with both warmth and healthy independence. You are a genuine gift to the people you love.',
        keywords: ['Security', 'Trust', 'Balance', 'Openness', 'Warmth'],
      },
      anxious: {
        title: 'Anxious Attachment',
        emoji: '🌊',
        tagline: 'Your heart loves deeply — and fears deeply too.',
        description: 'The anxiously attached person craves intimacy and is simultaneously terrified of losing it. Your love is passionate and devoted, but it is shadowed by a fear that you are not quite enough. Your work is learning that you are worthy of love even when you stop performing love perfectly.',
        keywords: ['Devotion', 'Sensitivity', 'Depth', 'Longing', 'Growth'],
      },
      avoidant: {
        title: 'Avoidant Attachment',
        emoji: '🌬️',
        tagline: 'You prize freedom and self-sufficiency above all.',
        description: 'The avoidantly attached person learned early that emotional needs were best managed alone. You are fiercely independent and capable, but intimacy can trigger a subtle urge to withdraw. Your growth edge is discovering that connection doesn\'t have to mean losing yourself — and that being needed is not a trap.',
        keywords: ['Independence', 'Self-Reliance', 'Space', 'Boundaries', 'Resilience'],
      },
      fearful: {
        title: 'Fearful-Avoidant Attachment',
        emoji: '🌑',
        tagline: 'You long for love and fear it in equal measure.',
        description: 'The fearful-avoidant pattern holds the most contradictory hunger: a deep longing for closeness and an equally deep terror of it. This often arises when early love also brought harm. Your path is one of the most courageous there is: to let both the longing and the fear be true, and to inch toward safety anyway.',
        keywords: ['Complexity', 'Courage', 'Healing', 'Depth', 'Transformation'],
      },
    },
  },
  {
    id: 'wound',
    emoji: '🌷',
    title: "What Is Your Core Wound?",
    description: 'The core wound is the deep emotional injury we carry from childhood — the story that quietly runs everything until we see it.',
    questions: [
      {
        text: 'When someone you love pulls away or goes quiet, your gut reaction is…',
        options: [
          { label: 'Panic — my greatest fear is being left and I feel it in my whole body', value: 'abandonment' },
          { label: 'A quiet dread that I\'ve done something to make myself unwanted', value: 'rejection' },
          { label: 'Replaying our last interaction to find where I looked foolish or weak', value: 'humiliation' },
          { label: 'High alert — wondering if I can actually trust this person at all', value: 'betrayal' },
        ],
      },
      {
        text: 'A pattern you keep noticing across painful situations is…',
        options: [
          { label: 'A bone-deep sense that things are deeply unfair and no one acknowledges it', value: 'injustice' },
          { label: 'People always seem to leave — especially when I need them most', value: 'abandonment' },
          { label: 'I am never quite the one who is truly chosen or fully wanted', value: 'rejection' },
          { label: 'I end up feeling embarrassed, exposed, or made small', value: 'humiliation' },
        ],
      },
      {
        text: 'Your deepest relational fear is…',
        options: [
          { label: 'That the people I trust most will eventually let me down or deceive me', value: 'betrayal' },
          { label: 'Being treated unfairly no matter how much I do right', value: 'injustice' },
          { label: 'Being left with no one who truly stays', value: 'abandonment' },
          { label: 'Being fully seen and still being turned away', value: 'rejection' },
        ],
      },
      {
        text: 'If you had to name what you most often felt as a child, it would be…',
        options: [
          { label: 'Embarrassed, mocked, or made to feel stupid or small', value: 'humiliation' },
          { label: 'Let down by the very people who were supposed to protect me', value: 'betrayal' },
          { label: 'At a disadvantage — like the rules didn\'t apply equally to me', value: 'injustice' },
          { label: 'Invisible — like I could disappear and no one would truly notice', value: 'abandonment' },
        ],
      },
      {
        text: 'The thought that loops most often in your mind is…',
        options: [
          { label: '"There\'s something fundamentally unlovable about me"', value: 'rejection' },
          { label: '"I am a fool for having hoped, tried, or trusted"', value: 'humiliation' },
          { label: '"Everyone has an agenda I can\'t see — I can\'t fully let my guard down"', value: 'betrayal' },
          { label: '"I work so hard and others seem to get what I deserve"', value: 'injustice' },
        ],
      },
      {
        text: 'When you feel overlooked or left out, you experience…',
        options: [
          { label: 'A hollow panic that rises up — it feels existential, not just situational', value: 'abandonment' },
          { label: 'The immediate assumption that I am the problem', value: 'rejection' },
          { label: 'An overwhelming urge to hide, shrink, or make myself invisible', value: 'humiliation' },
          { label: 'The cold suspicion that I was only included for what I could offer', value: 'betrayal' },
        ],
      },
      {
        text: 'You find it hardest to forgive when…',
        options: [
          { label: 'Something fundamentally unfair happened and was never acknowledged', value: 'injustice' },
          { label: 'Someone walked away without warning or any real explanation', value: 'abandonment' },
          { label: 'You were vulnerable — and they turned away anyway', value: 'rejection' },
          { label: 'You were diminished or exposed in front of others', value: 'humiliation' },
        ],
      },
      {
        text: 'Your strongest unconscious coping strategy has been…',
        options: [
          { label: 'Becoming hyper-vigilant and extremely careful about who I let close', value: 'betrayal' },
          { label: 'Becoming a fierce advocate for fairness — sometimes at great personal cost', value: 'injustice' },
          { label: 'Becoming so self-sufficient that I never truly need anyone', value: 'abandonment' },
          { label: 'Achieving, succeeding, or over-helping to earn my right to belong', value: 'rejection' },
        ],
      },
    ],
    results: {
      abandonment: {
        title: 'The Abandonment Wound',
        emoji: '🌷',
        tagline: 'Your deepest fear is being left — and it has quietly shaped everything.',
        description: 'When the abandonment wound runs deep, you may over-attach, self-abandon to keep people close, or leave first before you can be left. The healing path is learning to be with yourself so fully — with such genuine warmth — that aloneness no longer feels like a death sentence.',
        keywords: ['Attachment', 'Self-Soothing', 'Inner-Security', 'Presence', 'Belonging'],
      },
      rejection: {
        title: 'The Rejection Wound',
        emoji: '🌷',
        tagline: 'You have carried the belief that you are not quite enough.',
        description: 'The rejection wound whispers that there is something fundamentally unlovable about you — and it drives you to achieve, help, or perform in order to earn your place. The medicine is not more doing; it is the radical discovery that you belong simply by existing.',
        keywords: ['Worthiness', 'Belonging', 'Self-Acceptance', 'Authenticity', 'Courage'],
      },
      humiliation: {
        title: 'The Humiliation Wound',
        emoji: '🌷',
        tagline: 'You learned to hide or shrink yourself to stay safe.',
        description: 'The humiliation wound often forms when you were mocked, shamed, or made to feel small at a formative moment. You may carry a powerful inner critic and a deep habit of staying invisible. Healing begins when you choose to be seen — imperfectly, vulnerably — and discover that the world does not end.',
        keywords: ['Dignity', 'Visibility', 'Self-Compassion', 'Courage', 'Voice'],
      },
      betrayal: {
        title: 'The Betrayal Wound',
        emoji: '🌷',
        tagline: 'Trust doesn\'t come easily — and it has been earned in blood.',
        description: 'When betrayal has cut deep, the nervous system learns to scan for deception everywhere. You may be loyal to a fault while keeping a piece of yourself permanently guarded. The path forward is discernment: learning to distinguish truly trustworthy people from those who only appear that way.',
        keywords: ['Trust', 'Discernment', 'Boundaries', 'Vulnerability', 'Healing'],
      },
      injustice: {
        title: 'The Injustice Wound',
        emoji: '🌷',
        tagline: 'You have a fierce, aching sense of what is right — and what is not.',
        description: 'The injustice wound is carried by those who experienced unfairness that was never acknowledged. You may be a passionate advocate for others while secretly wondering when someone will advocate for you. Healing includes turning that fierceness inward and becoming your own champion.',
        keywords: ['Fairness', 'Advocacy', 'Integrity', 'Self-Compassion', 'Justice'],
      },
    },
  },
  {
    id: 'enneagram',
    emoji: '🔢',
    title: "What's Your Enneagram Type?",
    description: 'The Enneagram maps nine distinct personality structures — each with its own gifts, fears, and path toward wholeness.',
    questions: [
      {
        text: 'When something you worked hard on doesn\'t go as planned, you…',
        options: [
          { label: 'Immediately look for what could have been done better and what still needs correcting', value: 'type1' },
          { label: 'Check in with the people involved to see how they\'re feeling and what they need', value: 'type2' },
          { label: 'Reframe quickly and focus on what can still be achieved from where you are', value: 'type3' },
          { label: 'Sit with the disappointment — this mattered, and you need to feel that before moving on', value: 'type4' },
        ],
      },
      {
        text: 'Your fundamental relationship with the world is…',
        options: [
          { label: 'Observer — I gather understanding before I act', value: 'type5' },
          { label: 'Cautious — I seek security and look for what could go wrong', value: 'type6' },
          { label: 'Expansive — there are too many adventures and possibilities to explore', value: 'type7' },
          { label: 'Powerful — I take charge and protect the things and people I care about', value: 'type8' },
        ],
      },
      {
        text: 'When conflict arises in a group, you…',
        options: [
          { label: 'Try to restore harmony so everyone feels okay again', value: 'type9' },
          { label: 'Point out what the right course of action clearly is', value: 'type1' },
          { label: 'Focus on what each person is feeling and what they need right now', value: 'type2' },
          { label: 'Shift into problem-solving mode to get things back on track', value: 'type3' },
        ],
      },
      {
        text: 'Your inner world is most dominated by…',
        options: [
          { label: 'A longing for beauty, depth, and what always seems to be missing', value: 'type4' },
          { label: 'Curiosity, systems, and the pleasure of deep understanding', value: 'type5' },
          { label: 'What-ifs, contingency plans, and assessing what could go wrong', value: 'type6' },
          { label: 'A whirl of possibilities, ideas, and pleasurable anticipation', value: 'type7' },
        ],
      },
      {
        text: 'In a relationship where you feel genuinely safe, you become…',
        options: [
          { label: 'Softer, warmer, and more openly generous than most people would ever guess', value: 'type8' },
          { label: 'Deeply content — presence and ease are your most natural state', value: 'type9' },
          { label: 'More relaxed about imperfection, and freer to simply enjoy without needing to improve', value: 'type1' },
          { label: 'At ease, because you can give without fear of what happens if you stop', value: 'type2' },
        ],
      },
      {
        text: 'The comment or observation that lands hardest for you is…',
        options: [
          { label: '"You\'re trying too hard — you don\'t have to impress everyone"', value: 'type3' },
          { label: '"You\'re being dramatic — it\'s really not that deep"', value: 'type4' },
          { label: '"You\'re too much in your head — just be present"', value: 'type5' },
          { label: '"You\'re overthinking it — just trust yourself"', value: 'type6' },
        ],
      },
      {
        text: 'What people most reliably count on you for is…',
        options: [
          { label: 'Energy, optimism, and the ability to make anything more alive', value: 'type7' },
          { label: 'Strength, decisiveness, and willingness to stand up for what\'s right', value: 'type8' },
          { label: 'Steadiness, calm, and the capacity to hold everyone\'s perspective', value: 'type9' },
          { label: 'Integrity, precision, and holding everyone to a high standard', value: 'type1' },
        ],
      },
      {
        text: 'Your highest gift to the world is…',
        options: [
          { label: 'Unconditional love, generosity, and seeing others\' hidden potential', value: 'type2' },
          { label: 'Inspiring people to aim higher through your example and achievement', value: 'type3' },
          { label: 'Depth, authenticity, and the courage to name what others won\'t', value: 'type4' },
          { label: 'Rare insight and the kind of knowledge that genuinely illuminates', value: 'type5' },
        ],
      },
      {
        text: 'In relationships, what you most need is…',
        options: [
          { label: 'Consistency, reliability, and someone I can trust completely', value: 'type6' },
          { label: 'Freedom, adventure, and a partner who doesn\'t limit my possibilities', value: 'type7' },
          { label: 'Honesty, respect, and someone who can handle my full intensity', value: 'type8' },
          { label: 'Peace, acceptance, and ease — a relationship that doesn\'t demand too much', value: 'type9' },
        ],
      },
      {
        text: 'When you come home after a long, draining day, you tend to…',
        options: [
          { label: 'Tidy or organise something — bringing order to the environment resets my mind', value: 'type1' },
          { label: 'Decompress in quiet solitude before I can be present with anyone else', value: 'type5' },
          { label: 'Check in with people I love — I want to make sure everyone is okay', value: 'type2' },
          { label: 'Settle into a familiar, predictable routine — it helps me feel safe and grounded', value: 'type6' },
        ],
      },
      {
        text: 'The compliment that means the most to you is…',
        options: [
          { label: '"What you\'ve built here is genuinely impressive — you should be proud"', value: 'type3' },
          { label: '"You see things no one else sees and express them in a way only you could"', value: 'type4' },
          { label: '"You make everything more alive — the whole energy shifts when you\'re here"', value: 'type7' },
          { label: '"You\'re the person I\'d call in a crisis — you\'re unshakeable"', value: 'type8' },
        ],
      },
      {
        text: 'The pattern in your own life you most want to change is…',
        options: [
          { label: 'The way I drift and agree to things that aren\'t truly mine', value: 'type9' },
          { label: 'The performance — always managing how I come across to others', value: 'type3' },
          { label: 'The loop of worry that plays on repeat, especially at night', value: 'type6' },
          { label: 'The restlessness — jumping to the next thing before this one is complete', value: 'type7' },
        ],
      },
    ],
    results: {
      type1: {
        title: 'Type 1 — The Perfectionist',
        emoji: '⚖️',
        tagline: 'You came here to make things right.',
        description: 'You carry a deep conviction that there is a right way to live and act — and you hold yourself to that standard relentlessly. Your gifts are integrity, precision, and a moral compass that doesn\'t waver. The invitation of your type is to discover that you are already good, even when nothing is perfect.',
        keywords: ['Integrity', 'Ethics', 'Precision', 'Reform', 'Goodness'],
      },
      type2: {
        title: 'Type 2 — The Helper',
        emoji: '🌹',
        tagline: 'Your love is your superpower and your sacrifice.',
        description: 'You feel most alive when you are needed, and you give generously — sometimes too generously. Your gift is an extraordinary warmth and the ability to sense what others need before they name it. The invitation is to turn that same devotion inward and ask: what do I need?',
        keywords: ['Love', 'Generosity', 'Care', 'Warmth', 'Service'],
      },
      type3: {
        title: 'Type 3 — The Achiever',
        emoji: '🏆',
        tagline: 'You are here to shine — but beneath the shine lives your truest self.',
        description: 'You move through the world with charm, efficiency, and an intuitive understanding of how to succeed. Your gift is the ability to inspire and get things done. The invitation of your type is to slow down and discover that you are loveable not for what you accomplish, but simply for who you are.',
        keywords: ['Achievement', 'Adaptability', 'Ambition', 'Success', 'Excellence'],
      },
      type4: {
        title: 'Type 4 — The Individualist',
        emoji: '🎭',
        tagline: 'You have the courage to feel what others won\'t.',
        description: 'You experience life more intensely than most, drawn to beauty, depth, and authentic expression. Your gift is the ability to articulate the ineffable. The invitation of your type is to recognise that you are not fundamentally deficient — you are deeply, magnificently, irreducibly yourself.',
        keywords: ['Authenticity', 'Depth', 'Beauty', 'Creativity', 'Feeling'],
      },
      type5: {
        title: 'Type 5 — The Investigator',
        emoji: '🔭',
        tagline: 'You map the world through understanding.',
        description: 'Your mind is a formidable instrument, and you feel safest when you understand how things work. You observe, analyse, and gather knowledge with rare precision. The invitation of your type is to step into the world you\'ve been studying — and share your gifts with people who need them.',
        keywords: ['Knowledge', 'Analysis', 'Privacy', 'Expertise', 'Insight'],
      },
      type6: {
        title: 'Type 6 — The Loyalist',
        emoji: '🛡️',
        tagline: 'Your faithfulness is one of the rarest gifts.',
        description: 'You are a devoted ally, a careful planner, and someone who can sense danger before anyone else. Your gift is loyal, committed love and an exceptional ability to prepare for what others overlook. The invitation is to trust yourself as much as you trust the people and systems you rely on.',
        keywords: ['Loyalty', 'Trust', 'Courage', 'Community', 'Discernment'],
      },
      type7: {
        title: 'Type 7 — The Enthusiast',
        emoji: '🎠',
        tagline: 'Joy is your north star.',
        description: 'You are vivid, multi-passionate, and fuelled by the endless feast of possibility this life offers. You bring aliveness wherever you go and refuse to be confined. The invitation of your type is to discover that staying fully with one beautiful thing — long enough to feel its depth — is freedom, not limitation.',
        keywords: ['Joy', 'Freedom', 'Enthusiasm', 'Possibility', 'Adventure'],
      },
      type8: {
        title: 'Type 8 — The Challenger',
        emoji: '⚡',
        tagline: 'You are here to protect, lead, and tell the truth.',
        description: 'You move through the world with intensity, directness, and a refusal to be diminished. Your gift is strength, justice, and the courage to stand in the fire when others step back. The invitation of your type is to let your softness be seen — vulnerability in the right hands is the deepest power of all.',
        keywords: ['Strength', 'Justice', 'Intensity', 'Protection', 'Leadership'],
      },
      type9: {
        title: 'Type 9 — The Peacemaker',
        emoji: '🕊️',
        tagline: 'You carry peace as a gift — now share it with yourself.',
        description: 'You have a rare capacity to hold multiple perspectives without judgment, and your presence is genuinely calming. Your gift is vast empathy and an instinct for harmony. The invitation of your type is to wake up fully to your own needs — and to discover that your voice matters as much as anyone else\'s.',
        keywords: ['Peace', 'Harmony', 'Acceptance', 'Presence', 'Unity'],
      },
    },
  },
  {
    id: 'dosha',
    emoji: '🌺',
    title: "What's Your Ayurvedic Dosha?",
    description: 'Ayurveda describes three fundamental constitutions — Vata, Pitta, and Kapha — that shape body, mind, and spirit.',
    questions: [
      {
        text: 'Your body type and build tends to be…',
        options: [
          { label: 'Slender and light, with a tendency to forget to eat when busy', value: 'vata' },
          { label: 'Variable — my weight and appetite shift noticeably with the seasons', value: 'vata' },
          { label: 'Medium and muscular, with a strong metabolism and reliable hunger', value: 'pitta' },
          { label: 'Solid and sturdy, with a tendency to retain weight easily', value: 'kapha' },
        ],
      },
      {
        text: 'Under stress, your most recognisable pattern is…',
        options: [
          { label: 'I become irritable, sharp-tongued, or overly controlling', value: 'pitta' },
          { label: 'I drive myself relentlessly until I eventually burn out', value: 'pitta' },
          { label: 'I become scattered, anxious, and my mind races uncontrollably', value: 'vata' },
          { label: 'I withdraw, comfort-eat, and become foggy and sluggish', value: 'kapha' },
        ],
      },
      {
        text: 'Your relationship with sleep is…',
        options: [
          { label: 'I love it — I could always do with more of it', value: 'kapha' },
          { label: 'Heavy and long — I wake slowly and need time to truly begin', value: 'kapha' },
          { label: 'Light and irregular — I fall asleep easily but wake often in the night', value: 'vata' },
          { label: 'Moderate — I sleep reasonably well but my mind can be busy near bedtime', value: 'pitta' },
        ],
      },
      {
        text: 'Your natural pace and working style is…',
        options: [
          { label: 'Quick and variable — I move fast but tire and lose focus easily', value: 'vata' },
          { label: 'Creative and erratic — I work in inspired bursts followed by crashes', value: 'vata' },
          { label: 'Purposeful and driven — I stay on task until the goal is achieved', value: 'pitta' },
          { label: 'Slow and steady — I prefer consistency and resist being rushed', value: 'kapha' },
        ],
      },
      {
        text: 'Your digestion tends to be…',
        options: [
          { label: 'Strong and urgent — I get very hungry and irritable if I miss meals', value: 'pitta' },
          { label: 'Heat-sensitive — prone to acid, inflammation, or loose stools', value: 'pitta' },
          { label: 'Irregular and uncomfortable — I bloat easily and often feel constipated', value: 'vata' },
          { label: 'Slow but steady — I can go a long time without eating and feel fine', value: 'kapha' },
        ],
      },
      {
        text: 'When emotionally overwhelmed, your default mode is…',
        options: [
          { label: 'Holding on — I process slowly and find it very hard to let go', value: 'kapha' },
          { label: 'Retreating inward — I go quiet and withdraw from everyone around me', value: 'kapha' },
          { label: 'Anxiety and hypervigilance — my mind spirals and I can\'t stop it', value: 'vata' },
          { label: 'Frustration and control — I need to fix or manage the situation immediately', value: 'pitta' },
        ],
      },
      {
        text: 'The climate you feel best in is…',
        options: [
          { label: 'Warm and humid — cold wind completely drains and depletes me', value: 'vata' },
          { label: 'Sunny and gentle — I wilt in cold, dry, or harsh weather', value: 'vata' },
          { label: 'Cool and temperate — I overheat and become uncomfortable easily', value: 'pitta' },
          { label: 'Warm and dry — damp, cold weather makes me heavy and unmotivated', value: 'kapha' },
        ],
      },
      {
        text: 'Your learning and communication style is…',
        options: [
          { label: 'Sharp and focused — I love debate, precision, and being right', value: 'pitta' },
          { label: 'Direct and concise — I dislike vagueness or wasted words', value: 'pitta' },
          { label: 'Thoughtful and devoted — I learn slowly but retain almost everything', value: 'kapha' },
          { label: 'Enthusiastic but scattered — I grasp ideas fast and forget them just as fast', value: 'vata' },
        ],
      },
    ],
    results: {
      vata: {
        title: 'Vata Dosha',
        emoji: '🌬️',
        tagline: 'You are the wind — creative, light, and always in motion.',
        description: 'Vata types are the dreamers and creatives of Ayurveda: quick-minded, sensitive, and full of inspiration. When balanced, vata brings vibrancy and artistry. When out of balance, it turns to anxiety, scattered energy, and forgetting to eat or sleep. Your medicine is warmth, routine, oil, and rest.',
        keywords: ['Creativity', 'Movement', 'Sensitivity', 'Lightness', 'Inspiration'],
      },
      pitta: {
        title: 'Pitta Dosha',
        emoji: '🔥',
        tagline: 'You are the fire — focused, fierce, and transformative.',
        description: 'Pitta types are the leaders and achievers of Ayurveda: sharp, passionate, and extraordinarily efficient. When balanced, pitta brings precision and drive. When out of balance it becomes irritability, perfectionism, and burnout. Your medicine is cooling practices, play, and the art of genuine surrender.',
        keywords: ['Focus', 'Drive', 'Intelligence', 'Passion', 'Precision'],
      },
      kapha: {
        title: 'Kapha Dosha',
        emoji: '🌿',
        tagline: 'You are the earth — steady, nourishing, and deeply enduring.',
        description: 'Kapha types are the nurturers and stabilisers: loyal, patient, and capable of extraordinary love. When balanced, kapha brings grace and emotional resilience. When out of balance it slides into lethargy and attachment. Your medicine is movement, stimulation, and the courage to release what you\'ve outgrown.',
        keywords: ['Stability', 'Nurture', 'Patience', 'Endurance', 'Loyalty'],
      },
    },
  },
  {
    id: 'moon',
    emoji: '🌙',
    title: "Which Moon Phase Are You?",
    description: 'The moon\'s four phases mirror the seasons of our inner life — discover which one you\'re living in right now.',
    questions: [
      {
        text: 'Your current life chapter feels like…',
        options: [
          { label: 'A blank page — something is ending and I\'m between two identities', value: 'new' },
          { label: 'A slow build — I sense momentum starting to gather around me', value: 'waxing' },
          { label: 'A peak — I\'m in full expression and my life is visible to others', value: 'full' },
          { label: 'A harvest — integrating, releasing, and composting what has passed', value: 'waning' },
        ],
      },
      {
        text: 'Your natural relationship with beginnings is…',
        options: [
          { label: 'I need silence and incubation before I can sense what wants to begin', value: 'new' },
          { label: 'I get excited by fresh starts and dive straight into building', value: 'waxing' },
          { label: 'I love being in the full expression of something already underway', value: 'full' },
          { label: 'I value the clearing work — what must be released so the new can come', value: 'waning' },
        ],
      },
      {
        text: 'When you look at the night sky, you feel most drawn to…',
        options: [
          { label: 'The dark sky — the vast, quiet promise of what is invisible but coming', value: 'new' },
          { label: 'The crescent — potential made visible, growing a little more each night', value: 'waxing' },
          { label: 'The full moon — pure luminous presence and bold, radiant completion', value: 'full' },
          { label: 'The waning light — beauty in the graceful process of letting go', value: 'waning' },
        ],
      },
      {
        text: 'Your social and relational energy right now is…',
        options: [
          { label: 'Quiet and deeply inward — I\'m in a cocoon of introspection', value: 'new' },
          { label: 'Emerging — I\'m ready to connect but still finding my footing', value: 'waxing' },
          { label: 'Open and radiant — I feel genuinely seen and want to be present', value: 'full' },
          { label: 'Selective — I\'m shedding what no longer nourishes and choosing wisely', value: 'waning' },
        ],
      },
      {
        text: 'The spiritual theme of your current season is…',
        options: [
          { label: 'Seeds, fertile emptiness, and the courage to not know yet', value: 'new' },
          { label: 'Effort, faith, and showing up for the growing thing', value: 'waxing' },
          { label: 'Gratitude, illumination, and the full-bodied presence of now', value: 'full' },
          { label: 'Surrender, wisdom, and the grace of sacred release', value: 'waning' },
        ],
      },
      {
        text: 'What you most need from your practice right now is…',
        options: [
          { label: 'Silence, rest, and writing about what wants to be born', value: 'new' },
          { label: 'Action steps, accountability, and forward momentum', value: 'waxing' },
          { label: 'Celebration, community, and showing up in your full power', value: 'full' },
          { label: 'Forgiveness rituals, decluttering, and gentle but decisive releasing', value: 'waning' },
        ],
      },
      {
        text: 'Your current energy level feels like…',
        options: [
          { label: 'Still and quiet — the spark is present but not yet lit', value: 'new' },
          { label: 'Activating — I\'m gaining strength and momentum with each day', value: 'waxing' },
          { label: 'Full and radiant — I am at capacity, pouring my light out', value: 'full' },
          { label: 'Gently receding — nourishing wisdom now rather than output', value: 'waning' },
        ],
      },
      {
        text: 'Your greatest gift to offer the world right now is…',
        options: [
          { label: 'Holding sacred space for what hasn\'t been born yet', value: 'new' },
          { label: 'Turning vision into action with growing, joyful clarity', value: 'waxing' },
          { label: 'Illuminating others with your full presence and generosity', value: 'full' },
          { label: 'Distilling the wisdom of what has passed and releasing with grace', value: 'waning' },
        ],
      },
    ],
    results: {
      new: {
        title: 'New Moon',
        emoji: '🌑',
        tagline: 'You are between worlds — and that is exactly where magic begins.',
        description: 'The new moon phase is the sacred pause before the next cycle begins. If this is your phase, you are in a liminal space — clearing what was, feeling into what wants to emerge, resting in fertile darkness. Don\'t rush the seed into flower. The most powerful work of new moon time is internal: dreaming, intending, and trusting the unknown.',
        keywords: ['Beginnings', 'Intention', 'Rest', 'Potential', 'Renewal'],
      },
      waxing: {
        title: 'Waxing Moon',
        emoji: '🌒',
        tagline: 'You are in your season of becoming.',
        description: 'The waxing moon rises in energy and light, calling you into action and the brave work of building what you\'ve envisioned. If this is your phase, momentum is available — you\'re moving from seed to shoot. Take steps, show up, and let the growing light of your intention guide you forward.',
        keywords: ['Growth', 'Momentum', 'Action', 'Building', 'Faith'],
      },
      full: {
        title: 'Full Moon',
        emoji: '🌕',
        tagline: 'You are radiant, complete, and fully seen.',
        description: 'The full moon is the apex of the cycle — a time of illumination, expression, and fullness. If this is your phase, you are at a peak: visible, potent, and pouring your light into the world. Celebrate, share, show up in your full power. And notice what the light also illuminates for release.',
        keywords: ['Illumination', 'Gratitude', 'Expression', 'Fullness', 'Presence'],
      },
      waning: {
        title: 'Waning Moon',
        emoji: '🌘',
        tagline: 'You are a master of sacred release.',
        description: 'The waning moon is the phase of harvesting wisdom and graceful release. If this is your phase, you are not in decline — you are in deep integration. What has served its purpose? The waning moon asks you to release with gratitude so the new cycle can begin on clear, fertile ground.',
        keywords: ['Release', 'Wisdom', 'Integration', 'Surrender', 'Clearing'],
      },
    },
  },
  {
    id: 'goddess',
    emoji: '🌸',
    title: "Which Goddess Archetype Are You?",
    description: 'Six goddess archetypes from Greek mythology offer a map of feminine power — discover which one lives most vividly within you.',
    questions: [
      {
        text: 'Your deepest core need in life is…',
        options: [
          { label: 'Freedom, wild spaces, and the sovereignty of my own path', value: 'artemis' },
          { label: 'Love, beauty, and the full experience of sensory pleasure', value: 'aphrodite' },
          { label: 'Knowledge, strategy, and the satisfaction of hard problems', value: 'athena' },
          { label: 'Depth, transformation, and the courage to face what lives in the dark', value: 'persephone' },
        ],
      },
      {
        text: 'Your relationship with home is…',
        options: [
          { label: 'I pour love into nourishing and providing for those in my care', value: 'demeter' },
          { label: 'My sanctuary — a peaceful, beautifully ordered space is sacred to me', value: 'hestia' },
          { label: 'A resting place between adventures — not somewhere to stay forever', value: 'artemis' },
          { label: 'A pleasure palace — beauty, flowers, candles, and sensory delight', value: 'aphrodite' },
        ],
      },
      {
        text: 'When someone comes to you in crisis, you…',
        options: [
          { label: 'Assess the situation and offer a clear, strategic, practical plan', value: 'athena' },
          { label: 'Sit with them in the darkness and help them find their own way through', value: 'persephone' },
          { label: 'Feed them, care for them, and make sure all their needs are met', value: 'demeter' },
          { label: 'Create a calm, safe, quiet container and offer steady, wordless presence', value: 'hestia' },
        ],
      },
      {
        text: 'The relationship dynamic that suits you most is…',
        options: [
          { label: 'Independent allies — we champion each other\'s freedom and separate goals', value: 'artemis' },
          { label: 'Passionate union — magnetic, alive with feeling, and full of desire', value: 'aphrodite' },
          { label: 'Meeting of minds — intellectual equals who genuinely challenge each other', value: 'athena' },
          { label: 'Soul bond — a love that has survived hardship and grown deeper for it', value: 'persephone' },
        ],
      },
      {
        text: 'Your sacred space in nature is…',
        options: [
          { label: 'A fertile garden, orchard, or wild field overflowing with abundance', value: 'demeter' },
          { label: 'A warm fireside or a still, candlelit room at the heart of a home', value: 'hestia' },
          { label: 'A moonlit forest, a mountain trail, or the open wilderness at night', value: 'artemis' },
          { label: 'The sea at sunset, a rose garden, anywhere achingly beautiful', value: 'aphrodite' },
        ],
      },
      {
        text: 'The quality you most wish to fully embody is…',
        options: [
          { label: 'Wisdom — to see with absolute clarity and act with deep discernment', value: 'athena' },
          { label: 'Resilience — to have journeyed through the underworld and emerged whole', value: 'persephone' },
          { label: 'Abundance — the capacity to give endlessly from a truly full heart', value: 'demeter' },
          { label: 'Peace — the rare mastery of genuine inner stillness and deep contentment', value: 'hestia' },
        ],
      },
      {
        text: 'In friendship, what you offer that no one else quite can is…',
        options: [
          { label: 'An independence that gives others permission to be fully themselves too', value: 'artemis' },
          { label: 'Your warmth and aliveness — you make ordinary moments feel like celebrations', value: 'aphrodite' },
          { label: 'The way you show up practically — present and nourishing without being asked', value: 'demeter' },
          { label: 'A quality of stillness that makes people feel settled just by being near you', value: 'hestia' },
        ],
      },
      {
        text: 'The loss that would genuinely devastate you most is…',
        options: [
          { label: 'Your clarity — the ability to understand and see what others miss', value: 'athena' },
          { label: 'Your depth — being forced to live only on the surface of things', value: 'persephone' },
          { label: 'Your freedom — being caged, controlled, or obligated to belong', value: 'artemis' },
          { label: 'Beauty itself — colour, pleasure, and sensory aliveness stripped from your life', value: 'aphrodite' },
        ],
      },
      {
        text: 'When you\'re at your most powerful, the people around you feel…',
        options: [
          { label: 'Nourished — held and cared for in a way that touches something deep', value: 'demeter' },
          { label: 'Centred — your presence creates a stillness that makes everything manageable', value: 'hestia' },
          { label: 'Sharper — like the whole conversation has been elevated and they can think more clearly', value: 'athena' },
          { label: 'Truly understood — like their pain has been witnessed without judgment or rush', value: 'persephone' },
        ],
      },
    ],
    results: {
      artemis: {
        title: 'Artemis',
        emoji: '🏹',
        tagline: 'Untamed, independent, and fiercely free.',
        description: 'Artemis is the goddess of the hunt and the wild moon, devoted above all to her own freedom and the sovereignty of her path. As her archetype, you are self-directed, purposeful, and deeply uncomfortable with anything that cages you. You are most alive in nature, in pursuit of your goals, and in your own company.',
        keywords: ['Freedom', 'Sovereignty', 'Purpose', 'Nature', 'Independence'],
      },
      aphrodite: {
        title: 'Aphrodite',
        emoji: '🌹',
        tagline: 'You are love, beauty, and the magnetic power of desire.',
        description: 'Aphrodite is the goddess of love and beauty, whose power lives in attraction, pleasure, and the celebration of what is most alive. As her archetype, you move through the world with warmth, aesthetic sensitivity, and a gift for creating beauty everywhere. Your invitation is to love abundantly — beginning with yourself.',
        keywords: ['Love', 'Beauty', 'Desire', 'Pleasure', 'Magnetism'],
      },
      athena: {
        title: 'Athena',
        emoji: '🦉',
        tagline: 'Strategy, wisdom, and the grace of the warrior-scholar.',
        description: 'Athena is the goddess of wisdom and strategic warfare: clear-minded, capable, and unafraid of hard problems. As her archetype, you thrive in intellectual challenge, value fairness, and approach life with precision. You are a natural advisor — just remember that the heart\'s wisdom is equal to the mind\'s.',
        keywords: ['Wisdom', 'Strategy', 'Clarity', 'Justice', 'Craft'],
      },
      persephone: {
        title: 'Persephone',
        emoji: '🌒',
        tagline: 'You have walked into the dark and returned transformed.',
        description: 'Persephone journeyed into the underworld and returned as queen of both realms. As her archetype, you are no stranger to transformation, loss, and the dark night of the soul. You carry a rare dual gift: the lightness of spring and the wisdom of one who has been through the fire.',
        keywords: ['Transformation', 'Depth', 'Resilience', 'Duality', 'Rebirth'],
      },
      demeter: {
        title: 'Demeter',
        emoji: '🌾',
        tagline: 'You are the earth\'s nourishment embodied.',
        description: 'Demeter is the great mother goddess of the harvest, whose love sustains all life. As her archetype, you possess a profound instinct to nurture, provide, and create abundance for those in your care. Your love is fierce and your generosity is legendary. Remember to feed yourself as lavishly as you feed others.',
        keywords: ['Nurture', 'Abundance', 'Love', 'Fertility', 'Devotion'],
      },
      hestia: {
        title: 'Hestia',
        emoji: '🕯️',
        tagline: 'You are the sacred keeper of the inner flame.',
        description: 'Hestia is the goddess of the hearth and inner life, whose domain is the quiet, sacred centre of all things. As her archetype, you require peace, order, and a space that is truly your own. Your gift to the world is the warm, grounded sanctuary of your presence.',
        keywords: ['Peace', 'Sanctuary', 'Simplicity', 'Devotion', 'Stillness'],
      },
    },
  },
  {
    id: 'ritual',
    emoji: '🕯️',
    title: "What's Your Ritual Style?",
    description: 'Spiritual practice takes as many forms as there are practitioners — discover the style that resonates most deeply with you.',
    questions: [
      {
        text: 'Your ideal ritual setting is…',
        options: [
          { label: 'Alone at my altar, in silence with candlelight and incense', value: 'solitary' },
          { label: 'Outside — barefoot in a forest, by water, or under an open sky', value: 'nature' },
          { label: 'In a circle with others who share my path and intentions', value: 'community' },
          { label: 'At my desk or studio, surrounded by art supplies and beautiful materials', value: 'creative' },
        ],
      },
      {
        text: 'Your ritual most often includes…',
        options: [
          { label: 'Journaling, oracle cards, and deep private reflection', value: 'solitary' },
          { label: 'Herbs, stones, the moon, and natural materials gathered on walks', value: 'nature' },
          { label: 'Shared prayer, ceremony, or collective energy work', value: 'community' },
          { label: 'Art-making, collage, music, or writing as a devotional offering', value: 'creative' },
        ],
      },
      {
        text: 'The moment you feel most connected to something sacred is…',
        options: [
          { label: 'In private stillness, when the outside world falls completely away', value: 'solitary' },
          { label: 'When nature speaks and I am quiet enough to actually hear it', value: 'nature' },
          { label: 'When I feel the field of a group aligned in the same intention', value: 'community' },
          { label: 'When I lose myself in making something and forget what time it is', value: 'creative' },
        ],
      },
      {
        text: 'What drives your spiritual practice most deeply is…',
        options: [
          { label: 'Personal sovereignty — being the authority of my own inner life', value: 'solitary' },
          { label: 'Reverence for the living Earth and her rhythms and seasons', value: 'nature' },
          { label: 'The power and healing of shared spiritual experience', value: 'community' },
          { label: 'The conviction that making something is the most honest form of prayer', value: 'creative' },
        ],
      },
      {
        text: 'If you could add one thing to your practice, it would be…',
        options: [
          { label: 'More uninterrupted time alone to go deep without interruption', value: 'solitary' },
          { label: 'More time in wild, green places or near moving water', value: 'nature' },
          { label: 'A soul circle, coven, or spiritual community to share my path with', value: 'community' },
          { label: 'Permission to make my practice messier, weirder, and more artistic', value: 'creative' },
        ],
      },
      {
        text: 'Your altar or ritual space probably contains…',
        options: [
          { label: 'Candles, incense, oracle cards, and a cherished journal', value: 'solitary' },
          { label: 'Crystals, feathers, dried flowers, and things gathered on walks', value: 'nature' },
          { label: 'Shared objects, group photos, and a calendar full of ceremony dates', value: 'community' },
          { label: 'Paints, collage paper, poetry books, and coloured pens', value: 'creative' },
        ],
      },
      {
        text: 'You feel spiritually depleted when…',
        options: [
          { label: 'I haven\'t had enough uninterrupted time alone to reset', value: 'solitary' },
          { label: 'I\'ve been indoors too long, cut off from the living world', value: 'nature' },
          { label: 'I\'m isolated and haven\'t shared sacred space with kindred souls', value: 'community' },
          { label: 'I\'ve gone too long without making something from the heart', value: 'creative' },
        ],
      },
      {
        text: 'The phrase that best describes your spiritual life is…',
        options: [
          { label: '"Between me and the divine — no intermediary needed"', value: 'solitary' },
          { label: '"The earth is my temple"', value: 'nature' },
          { label: '"Where two or more are gathered, there is magic"', value: 'community' },
          { label: '"To create is to pray"', value: 'creative' },
        ],
      },
    ],
    results: {
      solitary: {
        title: 'The Solitary Practitioner',
        emoji: '🕯️',
        tagline: 'Your sacred space lives within.',
        description: 'You are most at home in private, silent practice: your altar, your journal, your candles, your own company. You don\'t need a tradition or a community to make your practice real — you are the ceremony. The invitation of this path is to trust your own authority as the most qualified guide of your spiritual life.',
        keywords: ['Sovereignty', 'Privacy', 'Depth', 'Self-Trust', 'Ritual'],
      },
      nature: {
        title: 'The Nature Mystic',
        emoji: '🌿',
        tagline: 'The earth is your altar and the sky is your church.',
        description: 'Your spirituality is inseparable from the living world: the moon\'s phases, the forest\'s silence, the river\'s voice. You are most connected when barefoot on soil or watching the stars appear. The practice that nourishes you most is simply showing up for the world as it is — and letting it speak.',
        keywords: ['Earth', 'Reverence', 'Presence', 'Cycles', 'Wildness'],
      },
      community: {
        title: 'The Circle Keeper',
        emoji: '🔮',
        tagline: 'Magic multiplies when hearts align.',
        description: 'You come alive spiritually in community: in circles, ceremonies, shared prayer, and the field of collective intention. You understand instinctively that some healing can only happen in the presence of others. Your gift is both building sacred containers and holding space for others to step into them.',
        keywords: ['Community', 'Ceremony', 'Collective', 'Connection', 'Belonging'],
      },
      creative: {
        title: 'The Creative Devotee',
        emoji: '🎨',
        tagline: 'Every act of creation is an act of prayer.',
        description: 'For you, making is the most honest form of spirituality. Whether you paint, write, collage, or compose, the creative act is your meditation, your prayer, and your offering. You move between worlds when deep in the making — and the things you create carry more spirit than you may even realise.',
        keywords: ['Creativity', 'Making', 'Expression', 'Prayer', 'Beauty'],
      },
    },
  },
  {
    id: 'nervous',
    emoji: '💫',
    title: "What Does Your Nervous System Need?",
    description: 'Your nervous system speaks a specific language — discover the kind of nourishment that genuinely restores and regulates you.',
    questions: [
      {
        text: 'When you\'re overwhelmed, your body most clearly wants…',
        options: [
          { label: 'To lie down, do nothing, and let time pass without demands', value: 'rest' },
          { label: 'To go for a walk, shake something loose, or move physically', value: 'movement' },
          { label: 'To call a friend and talk through what I\'m feeling out loud', value: 'connection' },
          { label: 'To be alone, in quiet, far from any input or expectation', value: 'solitude' },
        ],
      },
      {
        text: 'Your nervous system feels most regulated when…',
        options: [
          { label: 'I\'ve had enough sleep and genuine unstructured time', value: 'rest' },
          { label: 'I\'ve moved my body in some intentional way today', value: 'movement' },
          { label: 'I feel genuinely seen and understood by another person', value: 'connection' },
          { label: 'I\'ve had long, uninterrupted stretches of alone time', value: 'solitude' },
        ],
      },
      {
        text: 'After a draining social event, you recover by…',
        options: [
          { label: 'A long nap or an early bedtime — sleep restores me', value: 'rest' },
          { label: 'A solo workout or brisk walk to discharge the built-up energy', value: 'movement' },
          { label: 'A debrief with one trusted person to process what happened', value: 'connection' },
          { label: 'Complete silence and zero interaction until I feel myself again', value: 'solitude' },
        ],
      },
      {
        text: 'Your body\'s most familiar stress signal is…',
        options: [
          { label: 'Bone-deep exhaustion and real difficulty getting out of bed', value: 'rest' },
          { label: 'Restlessness, tension in my muscles, or an urge to fidget', value: 'movement' },
          { label: 'A longing ache — wanting to be truly heard and held', value: 'connection' },
          { label: 'Overwhelm from too many people, sounds, and competing demands', value: 'solitude' },
        ],
      },
      {
        text: 'The practice you consistently return to when depleted is…',
        options: [
          { label: 'Napping, gentle stretching, or giving myself permission to do nothing', value: 'rest' },
          { label: 'Running, dancing, yoga, or any form of intentional physical movement', value: 'movement' },
          { label: 'Long conversations, shared meals, or meaningful community spaces', value: 'connection' },
          { label: 'Solo time in nature, journaling, or long reflective walks alone', value: 'solitude' },
        ],
      },
      {
        text: 'You know you\'re genuinely thriving when…',
        options: [
          { label: 'I\'m sleeping deeply and waking up feeling genuinely restored', value: 'rest' },
          { label: 'My body feels alive, energised, and truly free', value: 'movement' },
          { label: 'My relationships feel rich, nourishing, and reciprocal', value: 'connection' },
          { label: 'I have long stretches of inner quiet and creative freedom', value: 'solitude' },
        ],
      },
      {
        text: 'The phrase that best captures your nervous system right now is…',
        options: [
          { label: '"I am running on empty and need to completely stop"', value: 'rest' },
          { label: '"I feel stuck in my body and need to shake something loose"', value: 'movement' },
          { label: '"I am lonely — even in rooms full of people"', value: 'connection' },
          { label: '"The world is too loud and I can\'t find my own signal in the noise"', value: 'solitude' },
        ],
      },
      {
        text: 'If you could prescribe yourself one week of healing, it would be…',
        options: [
          { label: 'Total rest — no schedule, no obligations, no screens, no demands', value: 'rest' },
          { label: 'Active restoration — hiking, swimming, dancing, embodied movement', value: 'movement' },
          { label: 'Deep community — meaningful conversation and shared daily ritual', value: 'connection' },
          { label: 'A silent retreat alone in nature with no one else around', value: 'solitude' },
        ],
      },
      {
        text: 'What depletes your energy fastest is…',
        options: [
          { label: 'A packed schedule with no breathing room between demands', value: 'rest' },
          { label: 'Sitting still for too long — stagnation makes everything in me worse', value: 'movement' },
          { label: 'Going days without any meaningful contact or real conversation', value: 'connection' },
          { label: 'Constant noise, company, and zero time that is truly my own', value: 'solitude' },
        ],
      },
      {
        text: 'You would describe your current nervous system state as…',
        options: [
          { label: 'Exhausted at a level that sleep hasn\'t fully resolved', value: 'rest' },
          { label: 'Restless, wound up, or carrying tension I can\'t fully discharge', value: 'movement' },
          { label: 'Disconnected — longing to feel genuinely close to someone', value: 'connection' },
          { label: 'Overstimulated — I can\'t find my own signal in the noise of everything', value: 'solitude' },
        ],
      },
    ],
    results: {
      rest: {
        title: 'Deep Rest',
        emoji: '🌙',
        tagline: 'Your system is asking you to stop — and that is wisdom.',
        description: 'Your nervous system is waving a white flag, and the most rebellious and healing thing you can do right now is to rest without guilt. True rest — not passive scrolling but genuine restoration — is the medicine. Protect space for unstructured naps, early bedtimes, and the radical act of doing absolutely nothing.',
        keywords: ['Rest', 'Restoration', 'Slowness', 'Surrender', 'Renewal'],
      },
      movement: {
        title: 'Embodied Movement',
        emoji: '🌊',
        tagline: 'Your body is your medicine.',
        description: 'Your nervous system speaks the language of the body, and right now it is asking you to move — not as exercise, but as release. Dance, walk, shake, swim, stretch: anything that helps your body discharge what your mind can\'t process. Your body holds the wisdom your thoughts can\'t reach.',
        keywords: ['Movement', 'Embodiment', 'Release', 'Energy', 'Vitality'],
      },
      connection: {
        title: 'Nourishing Connection',
        emoji: '💞',
        tagline: 'You heal in relationship.',
        description: 'Your nervous system is regulated by co-regulation — the ancient nourishment of being truly seen, heard, and held by another person. You need real connection right now: not performance or scrolling, but genuine presence with someone who knows how to meet you. Reach out. Let yourself be held.',
        keywords: ['Connection', 'Co-Regulation', 'Belonging', 'Love', 'Community'],
      },
      solitude: {
        title: 'Sacred Solitude',
        emoji: '🌲',
        tagline: 'Silence is your most powerful resource.',
        description: 'Your nervous system is overwhelmed by input — too many voices, demands, and external frequencies competing for your signal. What you need is not more — it is less. Sacred solitude: time alone in quiet, in nature, away from screens and others\' needs. In the silence, you will find yourself again.',
        keywords: ['Solitude', 'Quiet', 'Silence', 'Boundaries', 'Restoration'],
      },
    },
  },
  {
    id: 'love',
    emoji: '💌',
    title: "What's Your Love Language?",
    description: 'Gary Chapman\'s five love languages describe the ways we most deeply give and receive love — which one speaks to your heart?',
    questions: [
      {
        text: 'You feel most genuinely loved when someone…',
        options: [
          { label: 'Tells you exactly what they love and appreciate about you', value: 'words' },
          { label: 'Quietly handles something from your to-do list without being asked', value: 'acts' },
          { label: 'Brings you something — anything — that shows you were on their mind', value: 'gifts' },
          { label: 'Gives you their full, undivided, phone-down attention', value: 'time' },
        ],
      },
      {
        text: 'The gesture that genuinely melts your heart is…',
        options: [
          { label: 'A spontaneous hug or a gentle, affectionate touch in passing', value: 'touch' },
          { label: 'A heartfelt handwritten note that arrives completely out of nowhere', value: 'words' },
          { label: 'Someone picking you up from somewhere without being asked', value: 'acts' },
          { label: 'A small, perfectly chosen gift that shows they truly know you', value: 'gifts' },
        ],
      },
      {
        text: 'You feel most disconnected in a relationship when…',
        options: [
          { label: 'You\'re physically together but you\'re both lost in your phones', value: 'time' },
          { label: 'There\'s been no physical closeness or affection for too long', value: 'touch' },
          { label: 'Appreciation and genuine affirmation have completely dried up', value: 'words' },
          { label: 'You feel like you\'re managing everything alone with no practical support', value: 'acts' },
        ],
      },
      {
        text: 'In a difficult conversation, what matters most to you is…',
        options: [
          { label: 'Receiving a thoughtful gesture that signals they want to make it right', value: 'gifts' },
          { label: 'Sitting together without any rush until it\'s truly worked through', value: 'time' },
          { label: 'Being held or touched — it communicates what words simply can\'t', value: 'touch' },
          { label: 'Hearing the words clearly: "I love you. I\'m sorry. You matter."', value: 'words' },
        ],
      },
      {
        text: 'Your partner\'s most romantic gesture would be…',
        options: [
          { label: 'Planning every detail of a special day so I don\'t have to think', value: 'acts' },
          { label: 'Surprising me with something unexpected and completely "me"', value: 'gifts' },
          { label: 'Carving out an entire uninterrupted day just to be together', value: 'time' },
          { label: 'A long, lingering embrace — no rush, no agenda, just presence', value: 'touch' },
        ],
      },
      {
        text: 'When you\'re having a hard time, you most need…',
        options: [
          { label: 'To hear: "I see you, I love you, you are not alone in this"', value: 'words' },
          { label: 'Someone showing up and doing something practical to help', value: 'acts' },
          { label: 'A care package or thoughtful token — proof you were thought of', value: 'gifts' },
          { label: 'Quiet company — someone who sits with you and simply stays', value: 'time' },
        ],
      },
      {
        text: 'After a long, hard week, your ideal Sunday morning looks like…',
        options: [
          { label: 'Slow morning cuddles and easy physical warmth throughout the day', value: 'touch' },
          { label: 'A long conversation where you feel genuinely and fully understood', value: 'words' },
          { label: 'Someone else cooking breakfast and handling all the chores', value: 'acts' },
          { label: 'Being given something beautiful and thoughtful — flowers, a favourite treat', value: 'gifts' },
        ],
      },
      {
        text: 'You feel most loved in friendship when…',
        options: [
          { label: 'A friend clears their whole afternoon just to spend it with you', value: 'time' },
          { label: 'Someone greets you with a real hug and reaches for your hand', value: 'touch' },
          { label: 'A friend tells you, unprompted, how much you truly mean to them', value: 'words' },
          { label: 'Someone shows up for you practically, without needing to be asked', value: 'acts' },
        ],
      },
      {
        text: 'You feel most invisible in a relationship when…',
        options: [
          { label: 'There\'s been no unsolicited appreciation or affirmation in weeks', value: 'words' },
          { label: 'You\'re carrying everything practical alone, with no one offering to help', value: 'acts' },
          { label: 'Physical affection has quietly disappeared from your everyday life', value: 'touch' },
          { label: 'Every moment together is rushed or distracted — never fully yours', value: 'time' },
        ],
      },
      {
        text: 'Your most natural way of showing love to someone you care about is…',
        options: [
          { label: 'Telling them — often and specifically — what you love about them', value: 'words' },
          { label: 'Noticing what they need and quietly handling it before they ask', value: 'acts' },
          { label: 'Tracking what they love and surprising them with it at just the right moment', value: 'gifts' },
          { label: 'Reaching for them — a touch on the arm, a hand squeeze, a long hug', value: 'touch' },
        ],
      },
    ],
    results: {
      words: {
        title: 'Words of Affirmation',
        emoji: '💌',
        tagline: 'Language is your love — speak it and receive it freely.',
        description: 'Words are not small things to you: they carry weight, meaning, and the power to heal or wound. You feel most loved when someone takes the time to articulate what you mean to them — and most cherished when that expression is specific, sincere, and spontaneous. Ask for the words you need. They are a gift you deserve.',
        keywords: ['Affirmation', 'Expression', 'Language', 'Recognition', 'Communication'],
      },
      acts: {
        title: 'Acts of Service',
        emoji: '🌻',
        tagline: 'Love, for you, is made visible through thoughtful action.',
        description: 'You feel most loved when someone rolls up their sleeves and shows up practically — not because they have to, but because they noticed. The unasked-for action, the burden quietly lifted, the task done with care: these are the love letters your heart has been waiting for. Ask for help, and receive it as love.',
        keywords: ['Service', 'Action', 'Care', 'Thoughtfulness', 'Support'],
      },
      gifts: {
        title: 'Receiving Gifts',
        emoji: '🎁',
        tagline: 'A gift is a symbol — proof that someone thought of you.',
        description: 'For you, the gift is never really about the object — it\'s about what the object represents: that someone was thinking of you when you weren\'t there. You don\'t need extravagance; you need intention. Let yourself be delighted by what people choose for you — it is love made tangible.',
        keywords: ['Thoughtfulness', 'Symbol', 'Remembrance', 'Delight', 'Appreciation'],
      },
      time: {
        title: 'Quality Time',
        emoji: '⌛',
        tagline: 'Your love language is undivided presence.',
        description: 'For you, the most profound act of love is full attention: no phone, no distraction, just two people genuinely present with each other. You don\'t want to be half-listened to — you want to feel like the only person in the world, for this moment. Protect this in your relationships, and ask for it without apology.',
        keywords: ['Presence', 'Attention', 'Devotion', 'Connection', 'Depth'],
      },
      touch: {
        title: 'Physical Touch',
        emoji: '🤍',
        tagline: 'Your body knows love — and asks to feel it.',
        description: 'Touch is not superficial for you — it is the most direct channel to your heart. A hand on your shoulder, a long hug, a gentle touch in passing: these are the grammar of love your nervous system understands most fluently. You are deeply nourished by physical warmth, and you have every right to ask for it.',
        keywords: ['Touch', 'Warmth', 'Safety', 'Comfort', 'Presence'],
      },
    },
  },
  {
    id: 'shadow',
    emoji: '🌑',
    title: "Which Shadow Archetype Is Active?",
    description: 'Carl Jung identified the shadow as the parts of ourselves we disown — discovering yours is the first step toward integrating it.',
    questions: [
      {
        text: 'Under pressure, the voice in your head tends to say…',
        options: [
          { label: '"It\'s not good enough — do it again, do it properly"', value: 'perfectionist' },
          { label: '"No one appreciates how much I do — I carry this alone"', value: 'martyr' },
          { label: '"If they won\'t handle it correctly, I\'ll just take over myself"', value: 'tyrant' },
          { label: '"I can\'t deal with this right now — I need to check out"', value: 'escapist' },
        ],
      },
      {
        text: 'Your most recognisable coping mechanism is…',
        options: [
          { label: 'Working harder, refining obsessively, and refusing to submit until it\'s perfect', value: 'perfectionist' },
          { label: 'Sacrificing my own needs for others and then feeling quietly resentful', value: 'martyr' },
          { label: 'Taking control of the situation and the people around me', value: 'tyrant' },
          { label: 'Numbing out through food, screens, fantasy, or anything that distracts', value: 'escapist' },
        ],
      },
      {
        text: 'Your shadow shows up in relationships most through…',
        options: [
          { label: 'Criticising, correcting, or holding everyone to impossible standards', value: 'perfectionist' },
          { label: 'Over-giving and then collapsing in unexpressed, silent suffering', value: 'martyr' },
          { label: 'Intimidating or dominating to avoid the vulnerability of needing someone', value: 'tyrant' },
          { label: 'Disappearing into distraction when difficult conversations arise', value: 'escapist' },
        ],
      },
      {
        text: 'At its root, your shadow is protecting you from…',
        options: [
          { label: 'The terror of being found flawed, wrong, or fundamentally not enough', value: 'perfectionist' },
          { label: 'The fear that if you stop giving, you will stop being loved', value: 'martyr' },
          { label: 'The deep vulnerability of genuinely needing another person', value: 'tyrant' },
          { label: 'The pain of being fully present inside a difficult reality', value: 'escapist' },
        ],
      },
      {
        text: 'Others sometimes experience you as…',
        options: [
          { label: 'Overly critical, rigid, or simply impossible to satisfy', value: 'perfectionist' },
          { label: 'Quietly resentful or subtly passive-aggressive', value: 'martyr' },
          { label: 'Controlling, forceful, or overwhelming to be around', value: 'tyrant' },
          { label: 'Emotionally absent, unreliable, or impossible to fully reach', value: 'escapist' },
        ],
      },
      {
        text: 'When a project or plan isn\'t going as intended, you…',
        options: [
          { label: 'Fixate on the flaws and find it nearly impossible to declare it done', value: 'perfectionist' },
          { label: 'Take on all the extra work yourself and say nothing about it', value: 'martyr' },
          { label: 'Intervene aggressively and override the people responsible', value: 'tyrant' },
          { label: 'Quietly disengage or pretend to yourself that it no longer matters', value: 'escapist' },
        ],
      },
      {
        text: 'The gift hidden inside your shadow is…',
        options: [
          { label: 'An exceptional eye for quality and a genuine commitment to excellence', value: 'perfectionist' },
          { label: 'Profound generosity and the capacity to love without keeping score', value: 'martyr' },
          { label: 'Natural leadership, strength, and the courage to take decisive action', value: 'tyrant' },
          { label: 'Extraordinary creativity and the ability to access other worlds', value: 'escapist' },
        ],
      },
      {
        text: 'Your shadow heals when you learn to…',
        options: [
          { label: 'Embrace "good enough" and discover that love is not conditional on performance', value: 'perfectionist' },
          { label: 'Receive as generously as you give, and name your needs without shame', value: 'martyr' },
          { label: 'Allow yourself to be vulnerable and trust others with your soft underbelly', value: 'tyrant' },
          { label: 'Stay present with discomfort long enough to let it actually transform you', value: 'escapist' },
        ],
      },
      {
        text: 'What you find hardest to say out loud is…',
        options: [
          { label: '"This is good enough — I\'m done"', value: 'perfectionist' },
          { label: '"I need help — this is more than I can carry alone"', value: 'martyr' },
          { label: '"I was wrong, and I\'m sorry"', value: 'tyrant' },
          { label: '"I\'m struggling — and I\'m not going to pretend otherwise"', value: 'escapist' },
        ],
      },
      {
        text: 'When you\'re functioning at your shadow\'s worst, the people closest to you…',
        options: [
          { label: 'Feel like they can\'t do anything right and walk on eggshells around you', value: 'perfectionist' },
          { label: 'Don\'t even know you\'re hurting because you\'ve hidden it so completely', value: 'martyr' },
          { label: 'Feel managed, steamrolled, or quietly afraid to push back', value: 'tyrant' },
          { label: 'Can\'t reach you — you\'re physically present but emotionally elsewhere', value: 'escapist' },
        ],
      },
    ],
    results: {
      perfectionist: {
        title: 'The Perfectionist Shadow',
        emoji: '⚖️',
        tagline: 'Excellence is your gift — and your cage.',
        description: 'The perfectionist shadow drives you toward the best — and then refuses to let you rest once you arrive. Behind the impossible standards lives a wounded belief: that love is conditional on performance. Your liberation begins when you discover that you are loveable in your incompleteness too.',
        keywords: ['Excellence', 'Standards', 'Self-Compassion', 'Release', 'Worthiness'],
      },
      martyr: {
        title: 'The Martyr Shadow',
        emoji: '🌹',
        tagline: 'You give beautifully — but at a cost to yourself.',
        description: 'The martyr shadow is not without love — it is love that has been routed entirely outward, with nothing remaining for the self. You sacrifice and over-give, then feel the quiet burn of resentment no one sees. The invitation is radical: to receive as much as you give, and to discover that your needs are equally sacred.',
        keywords: ['Giving', 'Self-Care', 'Receiving', 'Boundaries', 'Compassion'],
      },
      tyrant: {
        title: 'The Tyrant Shadow',
        emoji: '⚡',
        tagline: 'Your strength, unchecked, becomes control.',
        description: 'The tyrant shadow emerges when a wound around powerlessness is left unhealed. You lead, push, and take over because deep inside, being in control feels like the only way to be safe. The healing happens when you let yourself be vulnerable — and discover that trust does not destroy you.',
        keywords: ['Power', 'Vulnerability', 'Trust', 'Leadership', 'Transformation'],
      },
      escapist: {
        title: 'The Escapist Shadow',
        emoji: '🌙',
        tagline: 'Your imagination is sacred — and also a hiding place.',
        description: 'The escapist shadow has a genuine gift: an extraordinary interior world of creativity and imagination. But it has also learned to use that world to disappear when life becomes too hard. The invitation is not to give up your inner life, but to bring it into contact with reality — where your gifts can actually transform things.',
        keywords: ['Creativity', 'Presence', 'Courage', 'Reality', 'Imagination'],
      },
    },
  },
  {
    id: 'intuition',
    emoji: '✨',
    title: "What's Your Intuition Style?",
    description: 'Discover how your psychic senses speak to you — whether through vision, feeling, sound, or sudden knowing.',
    questions: [
      {
        text: 'When you meet someone new, your first impression comes from…',
        options: [
          { label: 'A feeling in my body — warmth, tightness, or a gut reaction', value: 'clairsentient' },
          { label: 'A flash of imagery, colour, or symbolic pictures in my mind', value: 'clairvoyant' },
          { label: 'Their tone of voice and the words they choose — something just resonates', value: 'clairaudient' },
          { label: 'An instant knowing I can\'t explain — I just have a read on them', value: 'claircognizant' },
        ],
      },
      {
        text: 'When making a major decision, you trust…',
        options: [
          { label: 'My body — openness versus tightness tells me everything', value: 'clairsentient' },
          { label: 'My mind\'s eye — when something looks right, it is right', value: 'clairvoyant' },
          { label: 'An inner voice or words that arrive at exactly the right moment', value: 'clairaudient' },
          { label: 'A download of certainty that arrives complete and whole', value: 'claircognizant' },
        ],
      },
      {
        text: 'Your most vivid dreams are…',
        options: [
          { label: 'Felt — I wake up carrying the emotion long after I open my eyes', value: 'clairsentient' },
          { label: 'Visual — highly detailed, symbolic, and almost cinematic', value: 'clairvoyant' },
          { label: 'Full of conversations, music, or voices I remember clearly', value: 'clairaudient' },
          { label: 'More like sudden insight than story — I wake knowing something new', value: 'claircognizant' },
        ],
      },
      {
        text: 'When you walk into a room, you first notice…',
        options: [
          { label: 'The emotional atmosphere — whether it feels light or heavy', value: 'clairsentient' },
          { label: 'Visual details — colours, arrangement, who is looking at whom', value: 'clairvoyant' },
          { label: 'The sounds — background music, the tone of conversations', value: 'clairaudient' },
          { label: 'An instant read of the whole situation before I can explain it', value: 'claircognizant' },
        ],
      },
      {
        text: 'A message you need to hear most often arrives as…',
        options: [
          { label: 'A physical sensation — tightening, warmth, or a pull in my body', value: 'clairsentient' },
          { label: 'A symbol, a mental image, or something I suddenly visualise', value: 'clairvoyant' },
          { label: 'Words — heard aloud, in a song, or in my own inner voice', value: 'clairaudient' },
          { label: 'Sudden, unshakeable clarity that arrives from nowhere', value: 'claircognizant' },
        ],
      },
      {
        text: 'You tend to learn and absorb information best by…',
        options: [
          { label: 'Feeling my way through it — learning happens in my body', value: 'clairsentient' },
          { label: 'Watching or visualising — my mind is deeply visual', value: 'clairvoyant' },
          { label: 'Listening — lectures, podcasts, and conversations speak to me', value: 'clairaudient' },
          { label: 'Understanding the whole at once — I just get it, all at once', value: 'claircognizant' },
        ],
      },
      {
        text: 'When something is wrong, you usually…',
        options: [
          { label: 'Feel it physically — a tightness, unease, or restlessness in my body', value: 'clairsentient' },
          { label: 'See it in subtle signs — changes in light, colour, or visual cues', value: 'clairvoyant' },
          { label: 'Hear it in how someone sounds — their tone or what isn\'t being said', value: 'clairaudient' },
          { label: 'Just know — a quiet certainty that won\'t let me look away', value: 'claircognizant' },
        ],
      },
      {
        text: 'The strongest memories from your past are stored as…',
        options: [
          { label: 'Emotions — I remember how something felt more than how it looked', value: 'clairsentient' },
          { label: 'Images — I can see specific scenes clearly in my mind\'s eye', value: 'clairvoyant' },
          { label: 'Words and sounds — what someone said, the music, the silence', value: 'clairaudient' },
          { label: 'Knowings — I simply know something was true, even without the details', value: 'claircognizant' },
        ],
      },
    ],
    results: {
      clairsentient: {
        title: 'Clairsentient',
        emoji: '💫',
        tagline: 'Your body knows before your mind does.',
        description: 'Your dominant intuitive sense is clairsentience — the ability to feel energy, emotion, and truth through your physical body. You pick up on the emotional undercurrents in any room. You absorb others\' feelings as if they were your own. Your gut is your most reliable guide. The invitation of this gift is to trust the body\'s intelligence completely — and to learn to distinguish what is yours from what you are simply sensing in the field around you.',
        keywords: ['Empathy', 'Body Wisdom', 'Feeling', 'Sensitivity', 'Attunement'],
      },
      clairvoyant: {
        title: 'Clairvoyant',
        emoji: '👁️',
        tagline: 'You see in symbols, images, and inner light.',
        description: 'Your dominant intuitive sense is clairvoyance — the ability to receive intuitive information as mental imagery, symbols, and inner seeing. You are highly visual in both your inner life and your perception of the world. Insights often arrive as pictures, colours, or cinematic scenes in the mind\'s eye. Learning to trust and decode these images — rather than dismissing them as imagination — is the heart of your practice.',
        keywords: ['Vision', 'Symbolism', 'Imagery', 'Inner Sight', 'Perception'],
      },
      clairaudient: {
        title: 'Clairaudient',
        emoji: '🎵',
        tagline: 'Truth arrives as a voice, a word, a sound.',
        description: 'Your dominant intuitive sense is clairaudience — the ability to receive guidance through sound and inner hearing. You may notice a quiet inner voice that offers wisdom, or find that songs, overheard phrases, and conversations carry exactly the message you needed. Your intuition speaks in language. The practice is learning to distinguish the voice of fear from the voice of genuine knowing — and to trust the clarity when the right words arrive.',
        keywords: ['Inner Voice', 'Sound', 'Language', 'Listening', 'Resonance'],
      },
      claircognizant: {
        title: 'Claircognizant',
        emoji: '⚡',
        tagline: 'You simply know — without knowing how you know.',
        description: 'Your dominant intuitive sense is claircognizance — the ability to receive complete, sudden knowing as a pure download of understanding. You don\'t always know where your insights come from, but they arrive whole, clear, and certain. Others may call it genius or intuition; you call it just knowing. The challenge is trusting these downloads when they cannot be logically defended. The invitation is to stop needing to explain what you already, completely, know.',
        keywords: ['Knowing', 'Downloads', 'Clarity', 'Insight', 'Certainty'],
      },
    },
  },
  {
    id: 'practice',
    emoji: '⭐',
    title: "Which Daily Practice Suits You?",
    description: 'Discover the daily spiritual practice that genuinely fits your nature — the one you\'ll actually want to return to.',
    questions: [
      {
        text: 'Your ideal first 20 minutes of the morning looks like…',
        options: [
          { label: 'Writing — morning pages, gratitude, or stream-of-consciousness journaling', value: 'journaling' },
          { label: 'Drawing a card and sitting quietly with its message for the day ahead', value: 'oracle' },
          { label: 'Sitting in stillness — breathing, just being, before the day begins', value: 'meditation' },
          { label: 'Moving my body — stretching, yoga, or a walk outside to wake up', value: 'movement' },
        ],
      },
      {
        text: 'Your spiritual growth happens most reliably through…',
        options: [
          { label: 'Writing — I discover what I think and feel when I see it on the page', value: 'journaling' },
          { label: 'Symbols and archetypes — the language of the intuitive, non-linear mind', value: 'oracle' },
          { label: 'Silence and inner listening — the truth lives between thoughts', value: 'meditation' },
          { label: 'My body — it processes what my mind can\'t and leads me home', value: 'movement' },
        ],
      },
      {
        text: 'You feel most genuinely grounded after…',
        options: [
          { label: 'Getting everything out of my head and onto paper', value: 'journaling' },
          { label: 'Working with a deck that gives language to what I can\'t yet name', value: 'oracle' },
          { label: 'Even a five-minute sit — it returns me to myself completely', value: 'meditation' },
          { label: 'Physical exertion of any kind — my body is my deepest anchor', value: 'movement' },
        ],
      },
      {
        text: 'If stranded on a desert island, the tool you\'d want is…',
        options: [
          { label: 'My favourite journal and a good pen', value: 'journaling' },
          { label: 'A deck of oracle or tarot cards', value: 'oracle' },
          { label: 'A meditation cushion and unbroken silence', value: 'meditation' },
          { label: 'My running shoes or a yoga mat', value: 'movement' },
        ],
      },
      {
        text: 'What you most seek from a daily practice is…',
        options: [
          { label: 'Clarity, self-understanding, and genuine integration of experience', value: 'journaling' },
          { label: 'Guidance, inspiration, and a daily touch of the mysterious', value: 'oracle' },
          { label: 'Inner peace, presence, and relief from the noise of my own mind', value: 'meditation' },
          { label: 'Physical energy, groundedness, and embodied vitality', value: 'movement' },
        ],
      },
      {
        text: 'The spiritual teachers or tools that call to you most are…',
        options: [
          { label: 'Julia Cameron, Anaïs Nin, or anyone who champions the written self', value: 'journaling' },
          { label: 'Pam Colman Smith, Kim Krans, or any visionary oracle creator', value: 'oracle' },
          { label: 'Thich Nhat Hanh, Tara Brach, or any true mindfulness teacher', value: 'meditation' },
          { label: 'Somatic therapists, embodiment teachers, or movement healers', value: 'movement' },
        ],
      },
      {
        text: 'The time of day you most want to protect for your practice is…',
        options: [
          { label: 'Early morning — before the world and its demands get in', value: 'journaling' },
          { label: 'Evening — when the veil between worlds grows naturally thinner', value: 'oracle' },
          { label: 'Any quiet pocket — morning, midday, or just before sleep', value: 'meditation' },
          { label: 'Midday or end of day — when my body is asking to shift its energy', value: 'movement' },
        ],
      },
      {
        text: 'What you most want your practice to give you is…',
        options: [
          { label: 'A record of your becoming — proof of your own depth over time', value: 'journaling' },
          { label: 'A daily conversation with your higher self through symbol and image', value: 'oracle' },
          { label: 'The peace that passes understanding, returned to again and again', value: 'meditation' },
          { label: 'A body that genuinely feels like home, every single day', value: 'movement' },
        ],
      },
    ],
    results: {
      journaling: {
        title: 'Daily Journaling',
        emoji: '📓',
        tagline: 'The page is your most faithful spiritual companion.',
        description: 'You process the world through words. Writing is not just a hobby — it is how you discover what you actually think, integrate what you feel, and hear the voice of your own wisdom. A daily journaling practice is not about productivity; it is about maintaining the dialogue with yourself that makes your inner life legible.',
        keywords: ['Reflection', 'Clarity', 'Expression', 'Integration', 'Self-Knowledge'],
      },
      oracle: {
        title: 'Oracle Practice',
        emoji: '🃏',
        tagline: 'You think in archetypes and speak in symbols.',
        description: 'Your intuition is primed for the symbolic and the archetypal. Working with oracle or tarot cards is not about prediction — it is about giving your subconscious mind a doorway to speak through. A daily card draw becomes a living dialogue with the deeper self, offering a new lens through which to interpret the day.',
        keywords: ['Intuition', 'Symbols', 'Archetype', 'Guidance', 'Mystery'],
      },
      meditation: {
        title: 'Daily Meditation',
        emoji: '🧘',
        tagline: 'Stillness is your superpower.',
        description: 'You are most yourself in the pause between thoughts. A daily meditation practice is your most direct route to the inner quiet where decisions are clear, anxiety softens, and life regains its spaciousness. You don\'t need to master meditation — you only need to sit down, and return to the breath whenever you wander.',
        keywords: ['Stillness', 'Presence', 'Peace', 'Clarity', 'Mindfulness'],
      },
      movement: {
        title: 'Movement Practice',
        emoji: '🌊',
        tagline: 'Your body is your primary teacher.',
        description: 'Your spiritual life is embodied — you process emotion, access intuition, and touch the divine through physical experience. A daily movement practice is your anchor: the place where thought quiets and body wisdom speaks. Yoga, dance, running, swimming — the form matters less than showing up in your body, every day.',
        keywords: ['Embodiment', 'Vitality', 'Grounding', 'Presence', 'Healing'],
      },
    },
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuizzesPage() {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [step, setStep]             = useState(0);
  const [answers, setAnswers]       = useState([]);
  const [result, setResult]               = useState(null);
  const [secondaryResult, setSecondaryResult] = useState(null);
  const [saved, setSaved]           = useState({});
  const [saving, setSaving]         = useState({});
  const [sb, setSb]                 = useState(null);

  useEffect(() => {
    const client = createClient();
    setSb(client);
  }, []);

  // ─── Quiz logic ────────────────────────────────────────────────────────────

  function startQuiz(quiz) {
    setActiveQuiz(quiz);
    setStep(0);
    setAnswers([]);
    setResult(null);
    setSecondaryResult(null);
  }

  function resetToList() {
    setActiveQuiz(null);
    setStep(0);
    setAnswers([]);
    setResult(null);
    setSecondaryResult(null);
  }

  function retake() {
    setStep(0);
    setAnswers([]);
    setResult(null);
    setSecondaryResult(null);
  }

  function handleAnswer(value) {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    const questions = activeQuiz.questions;
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Tally votes
      const tally = {};
      for (const v of newAnswers) tally[v] = (tally[v] ?? 0) + 1;
      const sorted = Object.keys(activeQuiz.results).sort(
        (a, b) => (tally[b] ?? 0) - (tally[a] ?? 0)
      );
      setResult(activeQuiz.results[sorted[0]]);
      const runnerUpKey = sorted[1];
      const runnerUpScore = tally[runnerUpKey] ?? 0;
      setSecondaryResult(runnerUpScore >= 2 ? activeQuiz.results[runnerUpKey] : null);
    }
  }

  async function handleSave(quizId) {
    if (!sb || !result) return;
    setSaving(s => ({ ...s, [quizId]: true }));
    try {
      await saveVisionItem(sb, {
        type: 'affirmation',
        category: 'personal',
        content: `${result.emoji} ${result.title} — ${result.tagline} ${result.description}`,
      });
      setSaved(s => ({ ...s, [quizId]: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(s => ({ ...s, [quizId]: false }));
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const progress = activeQuiz
    ? Math.round((step / activeQuiz.questions.length) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fdf8f3 0%, #fce8e8 50%, #e8e0f5 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Quiz card ── */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">

          {/* View A: List */}
          {!activeQuiz && (
            <>
              <h1 className="font-playfair text-3xl mb-1" style={{ color: '#b88a92' }}>Quizzes</h1>
              <p className="text-sm text-gray-500 mb-6">Explore yourself through thoughtful personality quizzes.</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {QUIZZES.map(quiz => (
                  <div key={quiz.id} className="bg-white/60 border border-white/50 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="text-3xl">{quiz.emoji}</div>
                    <div>
                      <h2 className="font-playfair text-lg leading-snug text-gray-800">{quiz.title}</h2>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{quiz.description}</p>
                    </div>
                    <button
                      onClick={() => startQuiz(quiz)}
                      className="btn-gradient text-white text-sm font-medium px-5 py-2 rounded-full self-start mt-auto"
                    >
                      Take Quiz
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* View B: In-progress */}
          {activeQuiz && !result && (
            <>
              <button
                onClick={resetToList}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#b88a92] transition-colors mb-5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{activeQuiz.emoji}</span>
                <h2 className="font-playfair text-xl text-gray-800">{activeQuiz.title}</h2>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/40 rounded-full h-1.5 mb-6">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #f43f5e, #a78bfa)' }}
                />
              </div>

              <p className="text-xs text-gray-400 mb-2">
                Question {step + 1} of {activeQuiz.questions.length}
              </p>

              <p className="font-playfair italic text-xl text-gray-700 mb-6 leading-snug">
                {activeQuiz.questions[step].text}
              </p>

              <div className="space-y-3">
                {activeQuiz.questions[step].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full text-left p-4 rounded-2xl bg-white/60 border border-white/50 hover:bg-white/80 hover:border-[#d4adb6] transition-all text-sm text-gray-700"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* View C: Result */}
          {activeQuiz && result && (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{result.emoji}</div>
                <h2 className="font-playfair text-2xl text-gray-800 mb-1">{result.title}</h2>
                <p className="text-sm font-medium" style={{ color: '#b88a92' }}>{result.tagline}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {result.keywords.map(kw => (
                  <span
                    key={kw}
                    className="text-xs px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-500 font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed text-center mb-6 max-w-lg mx-auto">
                {result.description}
              </p>

              {secondaryResult && (
                <div className="mb-8 mx-auto max-w-lg border-t border-white/30 pt-5">
                  <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wider">You also carry a strong thread of</p>
                  <div className="bg-white/40 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{secondaryResult.emoji}</span>
                    <div>
                      <h3 className="font-playfair text-base text-gray-700">{secondaryResult.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 italic">{secondaryResult.tagline}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => handleSave(activeQuiz.id)}
                  disabled={saving[activeQuiz.id] || saved[activeQuiz.id]}
                  className="btn-gradient text-white text-sm font-medium px-6 py-2.5 rounded-full disabled:opacity-60"
                >
                  {saving[activeQuiz.id]
                    ? 'Saving…'
                    : saved[activeQuiz.id]
                    ? 'Saved to board ✓'
                    : 'Save to board'}
                </button>
                <button
                  onClick={retake}
                  className="text-sm text-gray-500 hover:text-[#b88a92] transition-colors border border-gray-200 hover:border-[#d4adb6] rounded-full px-6 py-2.5"
                >
                  Retake
                </button>
                <button
                  onClick={resetToList}
                  className="text-sm text-gray-500 hover:text-[#b88a92] transition-colors border border-gray-200 hover:border-[#d4adb6] rounded-full px-6 py-2.5"
                >
                  All Quizzes
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
