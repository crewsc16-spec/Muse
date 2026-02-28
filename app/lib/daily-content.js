import quotes from './quotes';

// djb2 hash — returns a positive integer
function hashCode(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

// ─── Tarot: 22 Major Arcana ───────────────────────────────────────────────────
export const TAROT_CARDS = [
  {
    name: 'The Fool',
    emoji: '🃏',
    keywords: ['beginnings', 'spontaneity', 'faith', 'innocence'],
    description: 'The Fool represents the start of a new journey, full of excitement and unlimited potential. You stand at the edge of a cliff, ready to leap into the unknown.',
    message: 'Trust the leap. What feels like a risk today is the beginning of your greatest adventure.',
    gradient: ['#a78bfa', '#f472b6'],
  },
  {
    name: 'The Magician',
    emoji: '✨',
    keywords: ['willpower', 'skill', 'manifestation', 'resourcefulness'],
    description: 'The Magician channels divine energy into the material world. You have all the tools you need; the question is whether you will use them.',
    message: 'You are capable of more than you realize. Channel your focus and manifest your vision today.',
    gradient: ['#c084fc', '#ec4899'],
  },
  {
    name: 'The High Priestess',
    emoji: '🌙',
    keywords: ['intuition', 'mystery', 'subconscious', 'inner knowing'],
    description: 'The High Priestess sits at the threshold between the seen and unseen. She holds the scroll of esoteric knowledge and urges you to listen within.',
    message: 'Your intuition is speaking. Quiet the noise of the world and listen to what your inner wisdom knows.',
    gradient: ['#6366f1', '#0ea5e9'],
  },
  {
    name: 'The Empress',
    emoji: '🌸',
    keywords: ['abundance', 'femininity', 'creativity', 'nurturing'],
    description: 'The Empress represents the fertile earth, creativity in bloom, and the nurturing force of nature. She is abundance personified.',
    message: 'You are surrounded by beauty and abundance. Open your eyes and heart to receive all that life offers.',
    gradient: ['#86efac', '#f9a8d4'],
  },
  {
    name: 'The Emperor',
    emoji: '🏛️',
    keywords: ['authority', 'structure', 'leadership', 'stability'],
    description: 'The Emperor sits upon a stone throne, representing order, authority, and the power to create lasting structures in the world.',
    message: 'Take charge with confidence. Bring order to the areas of your life that feel chaotic.',
    gradient: ['#ef4444', '#dc2626'],
  },
  {
    name: 'The Hierophant',
    emoji: '🕊️',
    keywords: ['tradition', 'wisdom', 'guidance', 'conformity'],
    description: 'The Hierophant is a spiritual teacher and guide, representing the wisdom of established traditions and the search for deeper meaning.',
    message: 'Seek wisdom from those who have walked before you. A teacher or mentor holds the key you are looking for.',
    gradient: ['#c4b5fd', '#fbbf24'],
  },
  {
    name: 'The Lovers',
    emoji: '💞',
    keywords: ['love', 'harmony', 'choices', 'alignment'],
    description: 'The Lovers card speaks not only of romantic love but of all choices made from the heart — the alignment of values and desires.',
    message: 'Choose with your heart. Whatever decision you face today, let love and authenticity guide you.',
    gradient: ['#f9a8d4', '#f472b6'],
  },
  {
    name: 'The Chariot',
    emoji: '⚡',
    keywords: ['determination', 'control', 'victory', 'willpower'],
    description: 'The Chariot is driven by opposing forces held in perfect tension, symbolizing the triumph of will over conflict and adversity.',
    message: 'You have the strength to overcome. Hold the reins firmly and charge ahead toward your goal.',
    gradient: ['#38bdf8', '#818cf8'],
  },
  {
    name: 'Strength',
    emoji: '🦁',
    keywords: ['courage', 'patience', 'compassion', 'inner power'],
    description: 'Strength shows a woman gently holding a lion\'s mouth — true power is not force, but the quiet confidence that tames even the wildest beast.',
    message: 'True strength is gentle. Lead with compassion today, and you will achieve more than brute force ever could.',
    gradient: ['#f43f5e', '#facc15'],
  },
  {
    name: 'The Hermit',
    emoji: '🔦',
    keywords: ['soul-searching', 'solitude', 'inner guidance', 'contemplation'],
    description: 'The Hermit climbs a mountain alone, lantern in hand, to seek inner truth. Sometimes the path to wisdom is walked in solitude.',
    message: 'Go within. The answers you seek cannot be found in the noise — only in the quiet of your own reflection.',
    gradient: ['#64748b', '#a78bfa'],
  },
  {
    name: 'Wheel of Fortune',
    emoji: '🎡',
    keywords: ['cycles', 'fate', 'turning point', 'luck'],
    description: 'The Wheel of Fortune reminds us that life moves in cycles — what goes up must come down, and what is down will rise again.',
    message: 'The wheel is turning in your favor. Trust the cycles of life and know that change brings new blessings.',
    gradient: ['#34d399', '#0ea5e9'],
  },
  {
    name: 'Justice',
    emoji: '⚖️',
    keywords: ['fairness', 'truth', 'cause and effect', 'clarity'],
    description: 'Justice holds her sword and scales, representing the universal law of cause and effect. Every action has its consequence.',
    message: 'Seek the truth in all you do today. Act with integrity, and the universe will reflect that back to you.',
    gradient: ['#38bdf8', '#6366f1'],
  },
  {
    name: 'The Hanged Man',
    emoji: '🌀',
    keywords: ['pause', 'surrender', 'new perspectives', 'waiting'],
    description: 'The Hanged Man voluntarily suspends himself to gain a new vantage point. True wisdom sometimes comes from doing nothing.',
    message: 'Surrender to where you are. What if a pause is exactly what you need to see everything differently?',
    gradient: ['#818cf8', '#34d399'],
  },
  {
    name: 'Death',
    emoji: '🦋',
    keywords: ['transformation', 'endings', 'transition', 'rebirth'],
    description: 'Death is the card of profound transformation — not physical death, but the necessary ending of one chapter so another can begin.',
    message: 'Something is ending so something better can begin. Trust the transformation unfolding in your life.',
    gradient: ['#1e293b', '#818cf8'],
  },
  {
    name: 'Temperance',
    emoji: '🌊',
    keywords: ['balance', 'moderation', 'patience', 'purpose'],
    description: 'Temperance pours water between two cups, symbolizing the perfect balance between opposing forces and the harmony found in moderation.',
    message: 'Find your flow. Balance and patience will carry you further today than any extreme effort.',
    gradient: ['#38bdf8', '#86efac'],
  },
  {
    name: 'The Devil',
    emoji: '🔗',
    keywords: ['bondage', 'materialism', 'shadow self', 'addiction'],
    description: 'The Devil shows two figures chained — yet the chains are loose. The greatest prison is the one we construct in our own minds.',
    message: 'You are not as trapped as you feel. Examine what you believe holds you back — you may find the chains are loose.',
    gradient: ['#ef4444', '#1e293b'],
  },
  {
    name: 'The Tower',
    emoji: '⚡',
    keywords: ['sudden change', 'upheaval', 'revelation', 'chaos'],
    description: 'The Tower is struck by lightning, its crown toppled. What crashes down was built on false foundations — clearing the way for truth.',
    message: 'What is falling apart was never built to last. Make space for the structures that will truly serve you.',
    gradient: ['#ef4444', '#7c3aed'],
  },
  {
    name: 'The Star',
    emoji: '⭐',
    keywords: ['hope', 'renewal', 'inspiration', 'serenity'],
    description: 'After the storm of the Tower, The Star shines in the clear night sky — a beacon of hope, renewal, and the healing power of simply existing.',
    message: 'Have hope. The universe is conspiring in your favor. You are exactly where you need to be.',
    gradient: ['#818cf8', '#38bdf8'],
  },
  {
    name: 'The Moon',
    emoji: '🌕',
    keywords: ['illusion', 'fear', 'the unconscious', 'confusion'],
    description: 'The Moon illuminates the night but distorts what it reveals. It rules the realm of dreams, intuition, and the fears that lurk in shadow.',
    message: 'Not everything is as it appears. Look beyond your fears to the truth that lies beneath the surface.',
    gradient: ['#c4b5fd', '#1e293b'],
  },
  {
    name: 'The Sun',
    emoji: '☀️',
    keywords: ['joy', 'success', 'vitality', 'clarity'],
    description: 'The Sun radiates pure joy and vitality. A child dances freely beneath its rays — innocent, alive, and in perfect harmony with the world.',
    message: 'Let yourself shine. Today is a day for joy, warmth, and celebrating all that is good in your life.',
    gradient: ['#facc15', '#a3e635'],
  },
  {
    name: 'Judgement',
    emoji: '📯',
    keywords: ['reflection', 'reckoning', 'awakening', 'absolution'],
    description: 'Judgement calls souls to rise with a trumpet blast. It is the moment of spiritual awakening, of hearing the call to your higher purpose.',
    message: 'You are being called to rise. Listen for the invitation to step fully into who you were meant to be.',
    gradient: ['#f9a8d4', '#818cf8'],
  },
  {
    name: 'The World',
    emoji: '🌍',
    keywords: ['completion', 'integration', 'accomplishment', 'wholeness'],
    description: 'The World is the final card of the Major Arcana — a figure dances in a wreath of victory, having integrated all lessons into wholeness.',
    message: 'You have everything you need within you. This is a time of completion, celebration, and integration.',
    gradient: ['#34d399', '#38bdf8'],
  },

  // ─── Minor Arcana — Wands ────────────────────────────────────────────────
  { name: 'Ace of Wands', keywords: ['inspiration', 'new initiative', 'potential', 'spark'], description: 'A hand emerges from a cloud holding a flowering wand — the divine spark of a new creative project landing in your hands.', message: 'A powerful new beginning is arriving. Grab it before it passes.', gradient: ['#f43f5e', '#c084fc'] },
  { name: 'Two of Wands', keywords: ['planning', 'vision', 'future', 'expansion'], description: 'A figure stands at the edge of the world, globe in hand, gazing at the horizon. The Two of Wands asks: what vision are you bold enough to pursue?', message: 'Think bigger. The world is literally in your hands today.', gradient: ['#f43f5e', '#fb7185'] },
  { name: 'Three of Wands', keywords: ['progress', 'expansion', 'opportunity', 'foresight'], description: 'A merchant watches ships sail toward new lands. What you set in motion is now moving — early results are arriving.', message: 'Your investments are beginning to pay off. Keep watching the horizon.', gradient: ['#e11d48', '#f43f5e'] },
  { name: 'Four of Wands', keywords: ['celebration', 'harmony', 'home', 'completion'], description: 'Flowers adorn four wands beneath a joyful canopy — a moment of rest, reward, and celebration after sustained effort.', message: 'Pause and celebrate. You have earned this moment of joy.', gradient: ['#f43f5e', '#f9a8d4'] },
  { name: 'Five of Wands', keywords: ['conflict', 'competition', 'chaos', 'challenges'], description: 'Five figures clash in a scuffle that seems more playful than deadly — creative tension and competing ideas rather than true war.', message: 'Not all conflict is destructive. The friction you feel may be sharpening you.', gradient: ['#dc2626', '#ef4444'] },
  { name: 'Six of Wands', keywords: ['victory', 'success', 'recognition', 'confidence'], description: 'A rider parades through a crowd wearing a laurel wreath — the public acknowledgment of a hard-won achievement.', message: 'Your moment of recognition is here. Step forward and own your success.', gradient: ['#f43f5e', '#facc15'] },
  { name: 'Seven of Wands', keywords: ['perseverance', 'challenge', 'defense', 'conviction'], description: 'A figure stands on a hill, bravely defending their position against six attacking wands. The high ground is yours — hold it.', message: 'Stand your ground. You have every right to defend what matters to you.', gradient: ['#be185d', '#f43f5e'] },
  { name: 'Eight of Wands', keywords: ['speed', 'swift action', 'movement', 'communication'], description: 'Eight wands fly through the air in rapid formation — messages in transit, swift movement, and sudden momentum.', message: 'Things are moving quickly now. Stay agile and respond rather than overthink.', gradient: ['#f43f5e', '#c084fc'] },
  { name: 'Nine of Wands', keywords: ['resilience', 'persistence', 'last stand', 'courage'], description: 'A weary but watchful figure leans on a wand, battle-scarred, still vigilant. You have come this far — do not give up now.', message: 'You are closer than you think. One more push will carry you through.', gradient: ['#9f1239', '#e11d48'] },
  { name: 'Ten of Wands', keywords: ['burden', 'responsibility', 'hard work', 'overwhelm'], description: 'A figure labors toward home carrying ten heavy wands — the cost of ambition taken too far, or duty carried alone.', message: 'Set something down. You do not have to carry all of this by yourself.', gradient: ['#881337', '#be185d'] },
  { name: 'Page of Wands', keywords: ['enthusiasm', 'exploration', 'creativity', 'messenger'], description: 'A young messenger holds a wand with bright-eyed wonder, ready to carry inspiration wherever it needs to go.', message: 'Let your curiosity lead today. Enthusiasm is its own kind of intelligence.', gradient: ['#f43f5e', '#fb923c'] },
  { name: 'Knight of Wands', keywords: ['adventure', 'passion', 'action', 'fearlessness'], description: 'A knight on a rearing horse charges forward with a wand blazing — all fire, no fear, and very little plan.', message: 'Channel your passion into action today, but remember that direction matters as much as speed.', gradient: ['#dc2626', '#f43f5e'] },
  { name: 'Queen of Wands', keywords: ['confidence', 'independence', 'warmth', 'magnetism'], description: 'The Queen sits boldly on her throne, sunflower in hand, cat at her feet — radiant, self-assured, and deeply alive.', message: 'Walk into your power today. Your presence alone is more than enough.', gradient: ['#f43f5e', '#c084fc'] },
  { name: 'King of Wands', keywords: ['vision', 'leadership', 'boldness', 'authority'], description: 'The King of Wands commands with charisma and vision, turning ideas into kingdoms through the sheer force of his will.', message: 'Lead. Your vision is worth fighting for, and others are ready to follow.', gradient: ['#be185d', '#7c3aed'] },

  // ─── Minor Arcana — Cups ────────────────────────────────────────────────
  { name: 'Ace of Cups', keywords: ['new love', 'compassion', 'creativity', 'emotional beginning'], description: 'A chalice overflows with water and light — the divine gift of love, creative potential, and emotional abundance pouring forth.', message: 'Your heart is opening. Let love in without condition.', gradient: ['#0ea5e9', '#38bdf8'] },
  { name: 'Two of Cups', keywords: ['partnership', 'unity', 'connection', 'attraction'], description: 'Two figures exchange cups in a sacred ceremony of mutual recognition — two souls meeting in equal love and respect.', message: 'A bond in your life deserves honoring today. Acknowledge it fully.', gradient: ['#0ea5e9', '#818cf8'] },
  { name: 'Three of Cups', keywords: ['celebration', 'friendship', 'community', 'abundance'], description: 'Three women dance and raise their cups in joyful celebration — the magic of friendship, belonging, and shared happiness.', message: 'Celebrate with your people today. Joy multiplies when it is shared.', gradient: ['#38bdf8', '#34d399'] },
  { name: 'Four of Cups', keywords: ['contemplation', 'apathy', 'reevaluation', 'withdrawal'], description: 'A figure sits under a tree, arms crossed, ignoring a fourth cup offered from a cloud above. What gifts are you overlooking?', message: 'Look up. Something wonderful is being offered that your discontent is hiding.', gradient: ['#0284c7', '#0ea5e9'] },
  { name: 'Five of Cups', keywords: ['loss', 'grief', 'disappointment', 'regret'], description: 'A cloaked figure mourns three spilled cups while two full cups stand untouched behind them — focus on loss obscures what remains.', message: 'Grieve what was lost — then turn around and see what still stands.', gradient: ['#1e3a5f', '#0369a1'] },
  { name: 'Six of Cups', keywords: ['nostalgia', 'childhood', 'memories', 'innocence'], description: 'Children exchange flowers in a golden village — a scene of innocence, the sweetness of old memories, and the gift of return.', message: 'Reconnect with the part of you that still knows how to wonder.', gradient: ['#38bdf8', '#a5f3fc'] },
  { name: 'Seven of Cups', keywords: ['fantasy', 'illusion', 'choices', 'wishful thinking'], description: 'Cups in a cloud hold castles, jewels, and monsters — a dizzying array of possibilities, most of them illusions.', message: 'Ground yourself before choosing. Not every glittering option is real.', gradient: ['#7c3aed', '#38bdf8'] },
  { name: 'Eight of Cups', keywords: ['withdrawal', 'leaving', 'walking away', 'disappointment'], description: 'A figure turns and walks away from eight neatly arranged cups into a moonlit mountain — choosing growth over comfort.', message: 'Sometimes the most courageous thing is to walk away from what no longer fills you.', gradient: ['#1e3a5f', '#312e81'] },
  { name: 'Nine of Cups', keywords: ['satisfaction', 'contentment', 'wish fulfilled', 'gratitude'], description: 'A figure sits with arms crossed before nine gleaming cups — the wish card; true contentment earned and savored.', message: 'Your wish is coming true. Receive it with gratitude rather than suspicion.', gradient: ['#0ea5e9', '#facc15'] },
  { name: 'Ten of Cups', keywords: ['happiness', 'family', 'alignment', 'fulfillment'], description: 'A couple stands with arms raised as a rainbow arc of cups lights the sky and children dance — the picture of a life fully lived.', message: 'True abundance is here. Let yourself feel the fullness of what you have built.', gradient: ['#38bdf8', '#34d399'] },
  { name: 'Page of Cups', keywords: ['creativity', 'intuition', 'sensitivity', 'messages'], description: 'A young page is surprised by a fish poking its head from a cup — imagination, emotional sensitivity, and wonder in their purest form.', message: 'Trust the unexpected messages your intuition is sending today.', gradient: ['#38bdf8', '#c084fc'] },
  { name: 'Knight of Cups', keywords: ['romance', 'charm', 'idealism', 'following the heart'], description: 'A gentle knight on a grey horse holds a cup forward like an offering — the romantic idealist, following his feelings with grace.', message: 'Let your heart lead the way. What would you do if love were guiding you?', gradient: ['#0ea5e9', '#818cf8'] },
  { name: 'Queen of Cups', keywords: ['compassion', 'intuition', 'empathy', 'nurturing'], description: 'The Queen gazes into an ornate cup, deeply contemplative — she knows the depths of emotion and tends to others from a full heart.', message: 'Your empathy is a gift. Trust your feelings — they know things your mind does not.', gradient: ['#0369a1', '#6366f1'] },
  { name: 'King of Cups', keywords: ['emotional balance', 'wisdom', 'generosity', 'calm'], description: 'The King sits at sea in calm mastery — he has integrated his deepest emotions into wisdom, and leads with warmth and steadiness.', message: 'Lead today from your heart and your wisdom together. That balance is rare and powerful.', gradient: ['#1e3a5f', '#4f46e5'] },

  // ─── Minor Arcana — Swords ──────────────────────────────────────────────
  { name: 'Ace of Swords', keywords: ['clarity', 'truth', 'breakthrough', 'raw power'], description: 'A sword blazes through a crown of light — a moment of mental breakthrough, the cutting edge of truth arriving unbidden.', message: 'See it clearly. The truth has arrived and it will set you free.', gradient: ['#6366f1', '#818cf8'] },
  { name: 'Two of Swords', keywords: ['indecision', 'stalemate', 'avoidance', 'blindfold'], description: 'A blindfolded woman holds two crossed swords before a turbulent sea — refusing to look at what must be faced.', message: 'Take off the blindfold. The decision you are avoiding is the one you most need to make.', gradient: ['#4338ca', '#6366f1'] },
  { name: 'Three of Swords', keywords: ['heartbreak', 'sorrow', 'grief', 'loss'], description: 'Three swords pierce a heart in a stormy sky — the stark emblem of grief, heartbreak, and necessary pain.', message: 'Let yourself feel it fully. Pain that is witnessed can be released; pain that is avoided grows.', gradient: ['#1e1b4b', '#4338ca'] },
  { name: 'Four of Swords', keywords: ['rest', 'recuperation', 'retreat', 'contemplation'], description: 'A knight lies in peaceful effigy, three swords above, one beneath — the sacred pause, the healing stillness before the next battle.', message: 'Rest is not retreat. Your body and mind need silence to become strong again.', gradient: ['#4338ca', '#818cf8'] },
  { name: 'Five of Swords', keywords: ['conflict', 'defeat', 'dishonor', 'hollow victory'], description: 'A smirking figure gathers swords while rivals walk away defeated — a victory won through cunning rather than honor.', message: 'Is winning worth the cost? Consider what you are willing to lose to gain what you want.', gradient: ['#312e81', '#6366f1'] },
  { name: 'Six of Swords', keywords: ['transition', 'moving on', 'calmer waters', 'passage'], description: 'A ferryman poles a boat carrying a woman and child toward calmer shores — moving through difficulty toward peace.', message: 'You are moving through, not moving backwards. Calmer waters lie ahead.', gradient: ['#2e1065', '#4338ca'] },
  { name: 'Seven of Swords', keywords: ['deception', 'strategy', 'cunning', 'avoidance'], description: 'A figure sneaks away with five swords while two remain — stealth and strategy, or perhaps something being hidden.', message: 'Are you being fully honest — with yourself or with others? Transparency serves you better than strategy.', gradient: ['#4f46e5', '#818cf8'] },
  { name: 'Eight of Swords', keywords: ['restriction', 'limitation', 'trapped', 'self-imposed'], description: 'A bound and blindfolded woman stands surrounded by swords — but the swords do not touch her, and the blindfold could be removed.', message: 'The cage you are in may be more open than it appears. Test the walls before accepting them.', gradient: ['#1e1b4b', '#374151'] },
  { name: 'Nine of Swords', keywords: ['anxiety', 'nightmares', 'worry', 'despair'], description: 'A figure sits upright in bed, head in hands, surrounded by nine swords on the wall — the dark hour when the mind creates its own suffering.', message: 'Your fears feel real, but they are not facts. The dawn is coming — hold on.', gradient: ['#111827', '#1e1b4b'] },
  { name: 'Ten of Swords', keywords: ['painful ending', 'defeat', 'betrayal', 'rock bottom'], description: 'A figure lies face down, ten swords in their back — the rock bottom that paradoxically marks the beginning of the only way up.', message: 'This ending, however painful, is final. And finality creates space for what comes next.', gradient: ['#030712', '#1e1b4b'] },
  { name: 'Page of Swords', keywords: ['curiosity', 'intellect', 'communication', 'vigilance'], description: 'A young figure strides into the wind, sword raised, eyes alert — the keen, quick mind ready to cut through confusion.', message: 'Think fast and speak clearly today. Your sharp mind is your greatest asset.', gradient: ['#6366f1', '#38bdf8'] },
  { name: 'Knight of Swords', keywords: ['ambition', 'drive', 'boldness', 'speed'], description: 'A knight charges headlong on a galloping horse, sword raised — all speed, all courage, all action, sometimes too much of each.', message: 'Move boldly — but pause long enough to aim before you swing.', gradient: ['#4338ca', '#6d28d9'] },
  { name: 'Queen of Swords', keywords: ['clarity', 'independence', 'direct communication', 'wisdom'], description: 'The Queen sits alone on her throne, sword upright, one hand extended — she knows the truth and will speak it with precision.', message: 'Speak your truth today without apology. Clarity is an act of kindness.', gradient: ['#4f46e5', '#818cf8'] },
  { name: 'King of Swords', keywords: ['intellect', 'authority', 'ethics', 'logic'], description: 'The King holds his sword upright in careful judgment — the pinnacle of mental power, used in service of fairness and truth.', message: 'Lead with logic and integrity today. The clearest mind in the room has the greatest responsibility.', gradient: ['#312e81', '#4f46e5'] },

  // ─── Minor Arcana — Pentacles ───────────────────────────────────────────
  { name: 'Ace of Pentacles', keywords: ['new opportunity', 'abundance', 'manifestation', 'prosperity'], description: 'A hand from a cloud holds a golden pentacle over a lush garden — the seed of material abundance, the beginning of something real.', message: 'A tangible new opportunity is presenting itself. Plant it with care.', gradient: ['#16a34a', '#4ade80'] },
  { name: 'Two of Pentacles', keywords: ['balance', 'adaptability', 'juggling', 'flexibility'], description: 'A figure juggles two pentacles inside an infinity loop while ships roll on ocean waves — the art of staying balanced amid constant change.', message: 'Life is asking you to juggle right now. Trust your rhythm.', gradient: ['#15803d', '#34d399'] },
  { name: 'Three of Pentacles', keywords: ['teamwork', 'skill', 'collaboration', 'learning'], description: 'An apprentice shows his work to two patrons in a cathedral — the recognition of craft, the beauty of collaboration, and the dignity of skilled work.', message: 'Your skills are valued. Collaborate openly and let others see your work.', gradient: ['#166534', '#16a34a'] },
  { name: 'Four of Pentacles', keywords: ['security', 'control', 'possession', 'stability'], description: 'A figure clutches four pentacles tightly, unable to move — security can become its own prison when held too tightly.', message: 'What are you gripping that might need to be released? True security comes from within.', gradient: ['#14532d', '#166534'] },
  { name: 'Five of Pentacles', keywords: ['hardship', 'poverty', 'need', 'isolation'], description: 'Two figures in the cold pass a bright stained-glass window without looking up — help is available, but despair has blinded them to it.', message: 'Look up. Even in hardship, there is warmth available to you — you need only ask.', gradient: ['#1a2e1a', '#14532d'] },
  { name: 'Six of Pentacles', keywords: ['generosity', 'charity', 'fairness', 'giving and receiving'], description: 'A merchant weighs coins on a scale before giving to the poor — the sacred exchange of giving and receiving in just measure.', message: 'Give generously where you can, and receive with grace where you must. Both are sacred acts.', gradient: ['#16a34a', '#facc15'] },
  { name: 'Seven of Pentacles', keywords: ['patience', 'perseverance', 'investment', 'waiting'], description: 'A laborer pauses to look at pentacles growing on a vine — the long pause between planting and harvest, between effort and reward.', message: 'Your work is bearing fruit, even when you cannot yet see it. Keep tending.', gradient: ['#15803d', '#4ade80'] },
  { name: 'Eight of Pentacles', keywords: ['apprenticeship', 'mastery', 'skill', 'dedication'], description: 'A craftsman hammers pentacles one by one in focused repetition — the sacred discipline of doing one thing excellently, over and over.', message: 'Show up and do the work today. Mastery is built in the quiet hours.', gradient: ['#166534', '#16a34a'] },
  { name: 'Nine of Pentacles', keywords: ['luxury', 'self-sufficiency', 'gratitude', 'abundance'], description: 'An elegant woman stands alone in a prosperous garden, falcon on her gloved hand — grace, independence, and the fruits of her own labor.', message: 'Enjoy what you have built. You did this, and it is beautiful.', gradient: ['#16a34a', '#a3e635'] },
  { name: 'Ten of Pentacles', keywords: ['legacy', 'family', 'completion', 'wealth'], description: 'An elder surrounded by family in a prosperous estate — the culmination of a life\'s work, wealth that extends across generations.', message: 'Think beyond today. What are you building that will outlast you?', gradient: ['#14532d', '#facc15'] },
  { name: 'Page of Pentacles', keywords: ['ambition', 'diligence', 'manifestation', 'opportunity'], description: 'A young student holds a pentacle aloft in a green field, studying it with total absorption — the earthy dreamer who knows ideas must be built.', message: 'Start small, but start. Every great thing began as a single focused action.', gradient: ['#16a34a', '#4ade80'] },
  { name: 'Knight of Pentacles', keywords: ['hard work', 'routine', 'patience', 'reliability'], description: 'A knight on a still horse holds a pentacle steadily — this knight does not gallop; he plods forward with unrelenting consistency.', message: 'Show up again today with quiet dedication. Consistency is a superpower.', gradient: ['#15803d', '#166534'] },
  { name: 'Queen of Pentacles', keywords: ['nurturing', 'practicality', 'home', 'abundance'], description: 'The Queen sits outdoors in a garden of abundance, holding a pentacle lovingly — she tends to her world with warmth, wisdom, and deeply practical love.', message: 'Nurture what you love today — your home, your body, your relationships, your work.', gradient: ['#166534', '#4ade80'] },
  { name: 'King of Pentacles', keywords: ['abundance', 'security', 'leadership', 'legacy'], description: 'The King sits upon a throne of vines and pentacles, steady and prosperous — the master of the material world, generous with all he has built.', message: 'Lead from a place of abundance today. There is enough — for you and for others.', gradient: ['#14532d', '#a3e635'] },
];

// Assign element to Major Arcana cards (Minor Arcana element is derived at runtime from card name)
const _MA_ELEMENTS = {
  'The Fool': 'air', 'The Magician': 'air', 'The High Priestess': 'water',
  'The Empress': 'earth', 'The Emperor': 'fire', 'The Hierophant': 'earth',
  'The Lovers': 'air', 'The Chariot': 'water', 'Strength': 'fire',
  'The Hermit': 'earth', 'Wheel of Fortune': 'fire', 'Justice': 'air',
  'The Hanged Man': 'water', 'Death': 'water', 'Temperance': 'fire',
  'The Devil': 'earth', 'The Tower': 'fire', 'The Star': 'air',
  'The Moon': 'water', 'The Sun': 'fire', 'Judgement': 'fire', 'The World': 'earth',
};
TAROT_CARDS.forEach(c => { if (_MA_ELEMENTS[c.name]) c.element = _MA_ELEMENTS[c.name]; });

// Rider-Waite deck — Wikimedia Commons (public domain)
export const TAROT_IMAGES = {
  'The Fool':         'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_00_Fool.jpg',
  'The Magician':     'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_01_Magician.jpg',
  'The High Priestess': 'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_02_High_Priestess.jpg',
  'The Empress':      'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_03_Empress.jpg',
  'The Emperor':      'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_04_Emperor.jpg',
  'The Hierophant':   'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_05_Hierophant.jpg',
  'The Lovers':       'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_06_Lovers.jpg',
  'The Chariot':      'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_07_Chariot.jpg',
  'Strength':         'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_08_Strength.jpg',
  'The Hermit':       'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_09_Hermit.jpg',
  'Wheel of Fortune': 'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_10_Wheel_of_Fortune.jpg',
  'Justice':          'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_11_Justice.jpg',
  'The Hanged Man':   'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_12_Hanged_Man.jpg',
  'Death':            'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_13_Death.jpg',
  'Temperance':       'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_14_Temperance.jpg',
  'The Devil':        'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_15_Devil.jpg',
  'The Tower':        'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_16_Tower.jpg',
  'The Star':         'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_17_Star.jpg',
  'The Moon':         'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_18_Moon.jpg',
  'The Sun':          'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_19_Sun.jpg',
  'Judgement':        'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_20_Judgement.jpg',
  'The World':        'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_21_World.jpg',

  // Wands (01=Ace, 02-10, 11=Page, 12=Knight, 13=Queen, 14=King)
  'Ace of Wands':     'https://commons.wikimedia.org/wiki/Special:FilePath/Wands01.jpg',
  'Two of Wands':     'https://commons.wikimedia.org/wiki/Special:FilePath/Wands02.jpg',
  'Three of Wands':   'https://commons.wikimedia.org/wiki/Special:FilePath/Wands03.jpg',
  'Four of Wands':    'https://commons.wikimedia.org/wiki/Special:FilePath/Wands04.jpg',
  'Five of Wands':    'https://commons.wikimedia.org/wiki/Special:FilePath/Wands05.jpg',
  'Six of Wands':     'https://commons.wikimedia.org/wiki/Special:FilePath/Wands06.jpg',
  'Seven of Wands':   'https://commons.wikimedia.org/wiki/Special:FilePath/Wands07.jpg',
  'Eight of Wands':   'https://commons.wikimedia.org/wiki/Special:FilePath/Wands08.jpg',
  'Nine of Wands':    'https://commons.wikimedia.org/wiki/Special:FilePath/Wands09.jpg',
  'Ten of Wands':     'https://commons.wikimedia.org/wiki/Special:FilePath/Wands10.jpg',
  'Page of Wands':    'https://commons.wikimedia.org/wiki/Special:FilePath/Wands11.jpg',
  'Knight of Wands':  'https://commons.wikimedia.org/wiki/Special:FilePath/Wands12.jpg',
  'Queen of Wands':   'https://commons.wikimedia.org/wiki/Special:FilePath/Wands13.jpg',
  'King of Wands':    'https://commons.wikimedia.org/wiki/Special:FilePath/Wands14.jpg',

  // Cups
  'Ace of Cups':      'https://commons.wikimedia.org/wiki/Special:FilePath/Cups01.jpg',
  'Two of Cups':      'https://commons.wikimedia.org/wiki/Special:FilePath/Cups02.jpg',
  'Three of Cups':    'https://commons.wikimedia.org/wiki/Special:FilePath/Cups03.jpg',
  'Four of Cups':     'https://commons.wikimedia.org/wiki/Special:FilePath/Cups04.jpg',
  'Five of Cups':     'https://commons.wikimedia.org/wiki/Special:FilePath/Cups05.jpg',
  'Six of Cups':      'https://commons.wikimedia.org/wiki/Special:FilePath/Cups06.jpg',
  'Seven of Cups':    'https://commons.wikimedia.org/wiki/Special:FilePath/Cups07.jpg',
  'Eight of Cups':    'https://commons.wikimedia.org/wiki/Special:FilePath/Cups08.jpg',
  'Nine of Cups':     'https://commons.wikimedia.org/wiki/Special:FilePath/Cups09.jpg',
  'Ten of Cups':      'https://commons.wikimedia.org/wiki/Special:FilePath/Cups10.jpg',
  'Page of Cups':     'https://commons.wikimedia.org/wiki/Special:FilePath/Cups11.jpg',
  'Knight of Cups':   'https://commons.wikimedia.org/wiki/Special:FilePath/Cups12.jpg',
  'Queen of Cups':    'https://commons.wikimedia.org/wiki/Special:FilePath/Cups13.jpg',
  'King of Cups':     'https://commons.wikimedia.org/wiki/Special:FilePath/Cups14.jpg',

  // Swords
  'Ace of Swords':    'https://commons.wikimedia.org/wiki/Special:FilePath/Swords01.jpg',
  'Two of Swords':    'https://commons.wikimedia.org/wiki/Special:FilePath/Swords02.jpg',
  'Three of Swords':  'https://commons.wikimedia.org/wiki/Special:FilePath/Swords03.jpg',
  'Four of Swords':   'https://commons.wikimedia.org/wiki/Special:FilePath/Swords04.jpg',
  'Five of Swords':   'https://commons.wikimedia.org/wiki/Special:FilePath/Swords05.jpg',
  'Six of Swords':    'https://commons.wikimedia.org/wiki/Special:FilePath/Swords06.jpg',
  'Seven of Swords':  'https://commons.wikimedia.org/wiki/Special:FilePath/Swords07.jpg',
  'Eight of Swords':  'https://commons.wikimedia.org/wiki/Special:FilePath/Swords08.jpg',
  'Nine of Swords':   'https://commons.wikimedia.org/wiki/Special:FilePath/Swords09.jpg',
  'Ten of Swords':    'https://commons.wikimedia.org/wiki/Special:FilePath/Swords10.jpg',
  'Page of Swords':   'https://commons.wikimedia.org/wiki/Special:FilePath/Swords11.jpg',
  'Knight of Swords': 'https://commons.wikimedia.org/wiki/Special:FilePath/Swords12.jpg',
  'Queen of Swords':  'https://commons.wikimedia.org/wiki/Special:FilePath/Swords13.jpg',
  'King of Swords':   'https://commons.wikimedia.org/wiki/Special:FilePath/Swords14.jpg',

  // Pentacles
  'Ace of Pentacles':    'https://commons.wikimedia.org/wiki/Special:FilePath/Pents01.jpg',
  'Two of Pentacles':    'https://commons.wikimedia.org/wiki/Special:FilePath/Pents02.jpg',
  'Three of Pentacles':  'https://commons.wikimedia.org/wiki/Special:FilePath/Pents03.jpg',
  'Four of Pentacles':   'https://commons.wikimedia.org/wiki/Special:FilePath/Pents04.jpg',
  'Five of Pentacles':   'https://commons.wikimedia.org/wiki/Special:FilePath/Pents05.jpg',
  'Six of Pentacles':    'https://commons.wikimedia.org/wiki/Special:FilePath/Pents06.jpg',
  'Seven of Pentacles':  'https://commons.wikimedia.org/wiki/Special:FilePath/Pents07.jpg',
  'Eight of Pentacles':  'https://commons.wikimedia.org/wiki/Special:FilePath/Pents08.jpg',
  'Nine of Pentacles':   'https://commons.wikimedia.org/wiki/Special:FilePath/Pents09.jpg',
  'Ten of Pentacles':    'https://commons.wikimedia.org/wiki/Special:FilePath/Pents10.jpg',
  'Page of Pentacles':   'https://commons.wikimedia.org/wiki/Special:FilePath/Pents11.jpg',
  'Knight of Pentacles': 'https://commons.wikimedia.org/wiki/Special:FilePath/Pents12.jpg',
  'Queen of Pentacles':  'https://commons.wikimedia.org/wiki/Special:FilePath/Pents13.jpg',
  'King of Pentacles':   'https://commons.wikimedia.org/wiki/Special:FilePath/Pents14.jpg',
};

// ─── Spirit Animals: 30 ───────────────────────────────────────────────────────
export const SPIRIT_ANIMALS = [
  {
    name: 'Wolf',
    emoji: '🐺',
    medicine: 'Wolf is the pathfinder, the forerunner of new ideas who returns to the clan to teach. Wolf medicine involves facing your inner truth and leading with instinct.',
    message: 'Trust your instincts today. Your inner compass knows the way even when the path isn\'t clear.',
  },
  {
    name: 'Eagle',
    emoji: '🦅',
    medicine: 'Eagle soars highest of all birds and represents a connection to divine spirit and the ability to see the bigger picture from great heights.',
    message: 'Lift your perspective above the day-to-day. What does your situation look like from the eagle\'s view?',
  },
  {
    name: 'Bear',
    emoji: '🐻',
    medicine: 'Bear represents introspection, hibernation as rest and renewal, and the courage to stand firm. Bear medicine calls us to look within and trust our inner knowing.',
    message: 'Honor your need for rest and reflection. Your answers are found in stillness, not in action.',
  },
  {
    name: 'Deer',
    emoji: '🦌',
    medicine: 'Deer brings the energy of gentleness and grace, teaching us that the softest touch can open the most tightly closed heart.',
    message: 'Approach today with gentleness — toward others and especially toward yourself.',
  },
  {
    name: 'Owl',
    emoji: '🦉',
    medicine: 'Owl is the keeper of sacred knowledge, able to see what others cannot in the darkness. Owl medicine is about perceiving the truth beyond illusion.',
    message: 'See clearly what others may miss. Trust the wisdom that comes when you look beyond the obvious.',
  },
  {
    name: 'Butterfly',
    emoji: '🦋',
    medicine: 'Butterfly is the spirit of transformation, carrying the message that no matter how dark the cocoon, beauty always emerges in its time.',
    message: 'You are in a process of becoming. Trust the transformation — your wings are forming right now.',
  },
  {
    name: 'Hawk',
    emoji: '🦆',
    medicine: 'Hawk is the messenger, calling attention to signs and omens from the universe. Hawk sharpens your awareness and sense of spiritual perception.',
    message: 'Pay attention to the signs around you today. The universe is sending messages — are you listening?',
  },
  {
    name: 'Turtle',
    emoji: '🐢',
    medicine: 'Turtle carries its home on its back, representing protection, patience, and the wisdom of moving slowly and deliberately through life.',
    message: 'You don\'t have to rush. Slow down, stay grounded, and trust that you are exactly where you need to be.',
  },
  {
    name: 'Dolphin',
    emoji: '🐬',
    medicine: 'Dolphin embodies the sacred breath of life, joyful communication, and the intelligence of the deep unconscious waters of emotion.',
    message: 'Play and connect today. Joy is not a luxury — it is essential nourishment for your soul.',
  },
  {
    name: 'Fox',
    emoji: '🦊',
    medicine: 'Fox is the shapeshifter, the trickster, and the master of camouflage. Fox medicine teaches adaptability and the art of thinking on your feet.',
    message: 'Be flexible and creative in your approach today. The solution may require a different strategy than you expect.',
  },
  {
    name: 'Horse',
    emoji: '🐴',
    medicine: 'Horse represents power, freedom, and the journey of the soul. Horse medicine calls us to claim our personal power and to move with grace and strength.',
    message: 'Claim your freedom. What would you do if you truly believed you were free to go anywhere?',
  },
  {
    name: 'Raven',
    emoji: '🪶',
    medicine: 'Raven is the keeper of magic and the bringer of light into darkness. Raven carries the gift of foresight and the ability to manifest change.',
    message: 'Magic is real, and it begins with your intention. Set a clear intention today and watch what unfolds.',
  },
  {
    name: 'Swan',
    emoji: '🦢',
    medicine: 'Swan embodies grace, inner beauty, and the ability to accept what is. Swan medicine asks us to surrender to our path rather than fighting the current.',
    message: 'Flow with grace through today\'s challenges. Resistance creates more suffering — trust the current of your life.',
  },
  {
    name: 'Dragonfly',
    emoji: '🌟',
    medicine: 'Dragonfly lives in two worlds — water and air — and represents the ability to look beyond the illusions of the physical world to the deeper truth.',
    message: 'What illusions have you been holding onto? See through them today and step into your authentic truth.',
  },
  {
    name: 'Lion',
    emoji: '🦁',
    medicine: 'Lion is the king of courage, representing personal authority, leadership, and the power of walking boldly in your own truth without apology.',
    message: 'Walk boldly today. You are more powerful than you know — own your gifts and lead from the front.',
  },
  {
    name: 'Hummingbird',
    emoji: '🌺',
    medicine: 'Hummingbird extracts sweetness from every flower and travels impossible distances with tiny wings, teaching us to find joy in the moment and to trust our ability to endure.',
    message: 'Seek the sweetness in every moment today. Joy and wonder are available to you right now.',
  },
  {
    name: 'Salmon',
    emoji: '🐟',
    medicine: 'Salmon swims upstream against all odds, returning home to complete its purpose. Salmon medicine is about determination, inner knowing, and ancestral wisdom.',
    message: 'Keep going, even when you\'re swimming against the current. Your determination will carry you home.',
  },
  {
    name: 'Snake',
    emoji: '🐍',
    medicine: 'Snake sheds its skin and emerges renewed, representing healing, transformation, and the eternal cycle of death and rebirth.',
    message: 'What old skin are you ready to shed? Release what no longer serves and welcome your renewal.',
  },
  {
    name: 'Crow',
    emoji: '🪶',
    medicine: 'Crow is the keeper of sacred law and the bridge between worlds, encouraging us to honor our integrity and to walk our truth without compromise.',
    message: 'Be honest with yourself today. Your highest self knows what is right — listen to it.',
  },
  {
    name: 'Moose',
    emoji: '🦌',
    medicine: 'Moose embodies self-esteem and confidence, the ability to recognize your own gifts and to stand in the wisdom of your own experience.',
    message: 'Celebrate how far you have come. You have earned the right to stand tall in your own life.',
  },
  {
    name: 'Tiger',
    emoji: '🐯',
    medicine: 'Tiger moves with raw power and patience, striking only at the perfect moment. Tiger medicine is about knowing when to act and when to wait.',
    message: 'Patience and power work together. Wait for the right moment, then act with full commitment.',
  },
  {
    name: 'Peacock',
    emoji: '🦚',
    medicine: 'Peacock embodies beauty, confidence, and the ability to transform what has been "ugly" in our lives into spectacular gifts we offer the world.',
    message: 'Show your true colors without shame. The very things you have hidden may be your greatest gifts.',
  },
  {
    name: 'Elephant',
    emoji: '🐘',
    medicine: 'Elephant represents ancient wisdom, memory, and the power of ancestral knowledge. Elephant never forgets and walks its path with deep purpose.',
    message: 'Draw on the wisdom of your ancestors and your own experience. You carry more knowledge than you realize.',
  },
  {
    name: 'Whale',
    emoji: '🐋',
    medicine: 'Whale holds the records of all that has ever been on Earth, singing songs of deep memory and connection to the universal record of existence.',
    message: 'Connect with something larger than yourself today. You are part of an ancient, sacred story.',
  },
  {
    name: 'Jaguar',
    emoji: '🐆',
    medicine: 'Jaguar is the shamanic gatekeeper of the unknown, moving silently between worlds and emerging from darkness with grace and fierce knowing.',
    message: 'Face the unknown without fear. You have an inner power that is more than a match for any darkness.',
  },
  {
    name: 'Rabbit',
    emoji: '🐇',
    medicine: 'Rabbit teaches us to stop creating our own fears and to move gracefully through life by focusing on what we desire rather than what we fear.',
    message: 'Watch what you dwell on — you create what you fear most. Shift your focus to what you truly want.',
  },
  {
    name: 'Otter',
    emoji: '🦦',
    medicine: 'Otter is the playful trickster that reminds us not to take life so seriously, teaching the balance of feminine energy, joy, and sharing.',
    message: 'Approach today with lightness and play. When was the last time you truly let yourself be joyful?',
  },
  {
    name: 'Lynx',
    emoji: '🐱',
    medicine: 'Lynx holds the secrets of hidden knowledge and sees what others cannot, offering the gift of clairvoyance and the wisdom of the unseen.',
    message: 'Trust what you sense but cannot prove. Your subtle perceptions are guiding you correctly.',
  },
  {
    name: 'Crane',
    emoji: '🦩',
    medicine: 'Crane stands for longevity, good fortune, and vigilance, embodying the balance of being both grounded and able to soar to great heights.',
    message: 'Stand tall in your purpose today. You are both rooted and rising.',
  },
  {
    name: 'Buffalo',
    emoji: '🦬',
    medicine: 'Buffalo represents gratitude, abundance, and the sacred understanding that all life is interconnected and that every prayer is answered.',
    message: 'Give thanks for everything you have. Gratitude is the magnet for more abundance in your life.',
  },
];

// Assign Human Design types to spirit animals
const _ANIMAL_HD = {
  Wolf: ['manifestor'], Lion: ['manifestor'], Eagle: ['manifestor'], Tiger: ['manifestor'], Jaguar: ['manifestor'],
  Horse: ['generator'], Bear: ['generator'], Elephant: ['generator'], Buffalo: ['generator'], Salmon: ['generator'], Moose: ['generator'],
  Fox: ['manifesting-generator'], Hummingbird: ['manifesting-generator'], Rabbit: ['manifesting-generator'], Dolphin: ['manifesting-generator'], Hawk: ['manifesting-generator'],
  Owl: ['projector'], Raven: ['projector'], Crow: ['projector'], Lynx: ['projector'], Crane: ['projector'], Snake: ['projector'],
  Butterfly: ['reflector'], Swan: ['reflector'], Dragonfly: ['reflector'], Deer: ['reflector'], Otter: ['reflector'], Turtle: ['reflector'], Peacock: ['reflector'], Whale: ['reflector'],
};
SPIRIT_ANIMALS.forEach(a => { a.hdTypes = _ANIMAL_HD[a.name] ?? []; });

// ─── Quote category → element mappings ───────────────────────────────────────
const _ELEMENT_QUOTE_CATS = {
  fire:  ['motivation', 'career', 'creativity'],
  earth: ['health', 'nature', 'career'],
  air:   ['growth', 'creativity', 'travel'],
  water: ['love', 'spirituality', 'growth'],
};
const _HD_QUOTE_CATS = {
  'manifestor':            ['motivation', 'career'],
  'generator':             ['health', 'career', 'motivation'],
  'manifesting-generator': ['creativity', 'motivation'],
  'projector':             ['growth', 'spirituality'],
  'reflector':             ['spirituality', 'nature', 'love'],
};


// ─── Question → element (by index, 0–59) ─────────────────────────────────────
// fire=action/courage, earth=values/legacy, air=mind/belief, water=emotion/depth
const _QUESTION_ELEMENTS = [
  'fire', 'water','water','air',  'air',  'earth','air',  'fire', 'earth','fire',  // 0–9
  'water','air',  'earth','earth','fire', 'air',  'earth','air',  'water','earth', // 10–19
  'water','earth','water','air',  'water','air',  'fire', 'fire', 'air',  'water', // 20–29
  'air',  'air',  'fire', 'fire', 'air',  'fire', 'water','water','fire', 'earth', // 30–39
  'fire', 'air',  'air',  'water','water','water','earth','water','fire', 'air',   // 40–49
  'water','water','water','earth','water','fire', 'fire', 'earth','water','earth', // 50–59
];

// Vintage natural history illustration queries — consistent engraving/print vibe
export const ANIMAL_IMAGE_QUERIES = {
  'Wolf':        'wolf vintage natural history illustration engraving',
  'Eagle':       'eagle vintage natural history illustration print',
  'Bear':        'bear vintage natural history illustration engraving',
  'Deer':        'deer vintage natural history illustration print',
  'Owl':         'owl vintage natural history illustration engraving',
  'Butterfly':   'butterfly vintage natural history illustration print',
  'Hawk':        'hawk vintage natural history illustration engraving',
  'Turtle':      'turtle vintage natural history illustration print',
  'Dolphin':     'dolphin vintage natural history illustration engraving',
  'Fox':         'fox vintage natural history illustration print',
  'Horse':       'horse vintage natural history illustration engraving',
  'Raven':       'raven vintage natural history illustration print',
  'Swan':        'swan vintage natural history illustration engraving',
  'Dragonfly':   'dragonfly vintage natural history illustration print',
  'Lion':        'lion vintage natural history illustration engraving',
  'Hummingbird': 'hummingbird vintage natural history illustration print',
  'Salmon':      'salmon fish vintage natural history illustration engraving',
  'Snake':       'snake vintage natural history illustration print',
  'Crow':        'crow vintage natural history illustration engraving',
  'Moose':       'moose vintage natural history illustration print',
  'Tiger':       'tiger vintage natural history illustration engraving',
  'Peacock':     'peacock vintage natural history illustration print',
  'Elephant':    'elephant vintage natural history illustration engraving',
  'Whale':       'whale vintage natural history illustration print',
  'Jaguar':      'jaguar leopard vintage natural history illustration engraving',
  'Rabbit':      'rabbit vintage natural history illustration print',
  'Otter':       'otter vintage natural history illustration engraving',
  'Lynx':        'lynx vintage natural history illustration print',
  'Crane':       'crane bird vintage natural history illustration engraving',
  'Buffalo':     'bison vintage natural history illustration print',
};

// ─── Words: 80 ────────────────────────────────────────────────────────────────
export const WORDS = [
  { word: 'Sonder', pronunciation: '/ˈsɒndər/', partOfSpeech: 'noun', definition: 'The realization that each passerby has a life as vivid and complex as one\'s own.', origin: 'Coined by John Koenig in The Dictionary of Obscure Sorrows (2012).', example: 'She felt a wave of sonder watching the strangers rush past her on the subway platform.' },
  { word: 'Hiraeth', pronunciation: '/ˈhɪərɑɪθ/', partOfSpeech: 'noun', definition: 'A Welsh word for a homesickness for somewhere you cannot return to, or perhaps never was.', origin: 'Welsh, from "hir" (long) + "aeth" (going or grief).', example: 'The old photograph filled him with a hiraeth he couldn\'t quite name.' },
  { word: 'Fernweh', pronunciation: '/ˈfɛrnveː/', partOfSpeech: 'noun', definition: 'A German word meaning a longing for faraway places; the opposite of homesickness.', origin: 'German, from "fern" (far) + "Weh" (ache, pain).', example: 'Fernweh seized her every spring, and she began planning another journey.' },
  { word: 'Meraki', pronunciation: '/meˈrɑːki/', partOfSpeech: 'noun', definition: 'A Greek word meaning to do something with soul, creativity, and love — to leave a piece of yourself in your work.', origin: 'Modern Greek, possibly derived from Turkish "merak" (labor of love).', example: 'She cooked every meal with meraki, infusing it with her love and intention.' },
  { word: 'Wanderlust', pronunciation: '/ˈwɒndəlʌst/', partOfSpeech: 'noun', definition: 'A strong desire to travel and explore the world.', origin: 'German, from "wandern" (to wander) + "Lust" (desire, joy).', example: 'Wanderlust consumed her every time she opened her atlas.' },
  { word: 'Eudaimonia', pronunciation: '/juːdaɪˈmoʊniə/', partOfSpeech: 'noun', definition: 'A Greek philosophical term often translated as happiness or flourishing — the condition of human thriving.', origin: 'Ancient Greek, from "eu" (good) + "daimōn" (spirit, deity).', example: 'The philosopher argued that eudaimonia, not pleasure, was the true goal of life.' },
  { word: 'Hygge', pronunciation: '/ˈhjuːɡə/', partOfSpeech: 'noun', definition: 'A Danish and Norwegian concept of coziness and convivial contentment; enjoying the simple pleasures of life with others.', origin: 'Danish/Norwegian, from Old Norse "hugga" (to comfort, to console).', example: 'They embraced hygge on the cold night, gathering around candles with soup and good conversation.' },
  { word: 'Lagom', pronunciation: '/ˈlɑːɡɒm/', partOfSpeech: 'adjective/adverb', definition: 'A Swedish word meaning just the right amount — not too much, not too little, but perfectly balanced.', origin: 'Swedish, believed to derive from "laget om" (around the team).', example: 'The seasoning was lagom — exactly as flavorful as it needed to be.' },
  { word: 'Serendipity', pronunciation: '/ˌsɛrənˈdɪpɪti/', partOfSpeech: 'noun', definition: 'The occurrence of happy or beneficial events by chance.', origin: 'Coined by Horace Walpole in 1754, from the Persian fairy tale "The Three Princes of Serendip."', example: 'It was pure serendipity that she met her best friend waiting for a delayed train.' },
  { word: 'Ephemeral', pronunciation: '/ɪˈfɛm(ə)r(ə)l/', partOfSpeech: 'adjective', definition: 'Lasting for a very short time; transitory.', origin: 'Greek "ephemeros," from "epi" (on) + "hemera" (day).', example: 'Cherry blossoms are ephemeral — here for a week, gone before you want them to be.' },
  { word: 'Solitude', pronunciation: '/ˈsɒlɪtjuːd/', partOfSpeech: 'noun', definition: 'The state of being alone, often chosen for reflection or peace.', origin: 'Latin "solitudo," from "solus" (alone).', example: 'She craved solitude after weeks of constant social obligations.' },
  { word: 'Sanguine', pronunciation: '/ˈsaŋɡwɪn/', partOfSpeech: 'adjective', definition: 'Optimistic or positive, especially in a difficult situation.', origin: 'Old French "sanguin," from Latin "sanguineus" (of blood), referring to the complexion of someone who is optimistic.', example: 'He remained sanguine even when the project ran into obstacles.' },
  { word: 'Mellifluous', pronunciation: '/mɛˈlɪflʊəs/', partOfSpeech: 'adjective', definition: '(Of a voice or music) sweet or musical; pleasant to hear.', origin: 'Latin "mellifluus," from "mel" (honey) + "fluere" (to flow).', example: 'Her mellifluous voice made even difficult news sound gentle.' },
  { word: 'Petrichor', pronunciation: '/ˈpɛtrɪkɔː/', partOfSpeech: 'noun', definition: 'The pleasant smell that often follows rain on warm, dry earth.', origin: 'Greek "petra" (stone) + "ichor" (the fluid that flows through the veins of the gods).', example: 'She stepped outside after the storm, breathing in the petrichor that clung to the air.' },
  { word: 'Liminal', pronunciation: '/ˈlɪmɪn(ə)l/', partOfSpeech: 'adjective', definition: 'Relating to a transitional or initial stage of a process; occupying a position at, or on both sides of, a threshold.', origin: 'Latin "limen" (threshold).', example: 'The year felt liminal — as though she were standing between who she was and who she was becoming.' },
  { word: 'Veridical', pronunciation: '/vəˈrɪdɪk(ə)l/', partOfSpeech: 'adjective', definition: 'Truthful; coinciding with facts; (of a dream or vision) corresponding to what is real.', origin: 'Latin "veridicus," from "verus" (true) + "dicere" (to say).', example: 'The dream felt so veridical that she woke unsure if it had really happened.' },
  { word: 'Susurrus', pronunciation: '/suːˈsʌrəs/', partOfSpeech: 'noun', definition: 'A whispering or murmuring sound.', origin: 'Latin "susurrus" (murmur, whisper).', example: 'The susurrus of the river was the only sound in the forest.' },
  { word: 'Iridescent', pronunciation: '/ˌɪrɪˈdɛs(ə)nt/', partOfSpeech: 'adjective', definition: 'Showing luminous colors that seem to change when seen from different angles.', origin: 'Latin "iris" (rainbow) + "-escent" (becoming).', example: 'The hummingbird\'s throat was iridescent — a flash of emerald and ruby in the sunlight.' },
  { word: 'Crepuscular', pronunciation: '/krɪˈpʌskjʊlə/', partOfSpeech: 'adjective', definition: 'Relating to, resembling, or denoting twilight.', origin: 'Latin "crepusculum" (twilight, dusk).', example: 'She loved the crepuscular hour, when the sky turned lavender and the first stars appeared.' },
  { word: 'Reverie', pronunciation: '/ˈrɛv(ə)ri/', partOfSpeech: 'noun', definition: 'A state of being pleasantly lost in one\'s thoughts; a daydream.', origin: 'French "rêverie," from "rêver" (to dream).', example: 'She sat by the window in a reverie, watching the snow fall without seeing it.' },
  { word: 'Incandescent', pronunciation: '/ˌɪnkænˈdɛs(ə)nt/', partOfSpeech: 'adjective', definition: 'Emitting light as a result of being heated; brilliantly glowing or passionate.', origin: 'Latin "incandescere" (to glow).', example: 'The speaker was incandescent with conviction, and the audience was captivated.' },
  { word: 'Vellichor', pronunciation: '/ˈvɛlɪkɔː/', partOfSpeech: 'noun', definition: 'The strange wistfulness of used bookshops — the awareness that every book has had readers who lived entire lives around it.', origin: 'Coined by John Koenig in The Dictionary of Obscure Sorrows.', example: 'She was seized by vellichor in the old bookshop, pulling out a worn paperback.' },
  { word: 'Alchemy', pronunciation: '/ˈælkɪmi/', partOfSpeech: 'noun', definition: 'The seemingly magical process of transformation or creation; historically, the attempt to turn base metals into gold.', origin: 'Medieval Latin "alchimia," from Arabic "al-kīmiyā."', example: 'There was an alchemy in the way she combined colors on the canvas.' },
  { word: 'Luminous', pronunciation: '/ˈluːmɪnəs/', partOfSpeech: 'adjective', definition: 'Bright or shining, especially in the dark; full of light.', origin: 'Latin "luminosus," from "lumen" (light).', example: 'The full moon cast a luminous glow across the still lake.' },
  { word: 'Numinous', pronunciation: '/ˈnjuːmɪnəs/', partOfSpeech: 'adjective', definition: 'Having a strong religious or spiritual quality; indicating or suggesting the presence of a divinity.', origin: 'Latin "numen" (divine power).', example: 'There was something numinous about the ancient forest that made her speak in whispers.' },
  { word: 'Equanimity', pronunciation: '/ˌɛkwəˈnɪmɪti/', partOfSpeech: 'noun', definition: 'Mental calmness and composure, especially in difficult situations.', origin: 'Latin "aequanimitas," from "aequus" (even) + "animus" (mind).', example: 'She faced the crisis with equanimity, never losing her sense of perspective.' },
  { word: 'Vesper', pronunciation: '/ˈvɛspə/', partOfSpeech: 'noun', definition: 'The evening star; also, an evening prayer or song.', origin: 'Latin "vesper" (evening, evening star).', example: 'They sat on the porch until the vesper star appeared in the darkening sky.' },
  { word: 'Pulchritude', pronunciation: '/ˈpʌlkrɪtjuːd/', partOfSpeech: 'noun', definition: 'Beauty, especially of a person.', origin: 'Latin "pulchritudo," from "pulcher" (beautiful).', example: 'The painting captured a pulchritude that photographs never could.' },
  { word: 'Halcyon', pronunciation: '/ˈhælsiən/', partOfSpeech: 'adjective', definition: 'Denoting a period of time in the past that was idyllically happy and peaceful.', origin: 'Greek "alkuōn" (kingfisher bird), believed to calm the sea during nesting.', example: 'She often looked back on those halcyon summers of childhood.' },
  { word: 'Apricity', pronunciation: '/əˈprɪsɪti/', partOfSpeech: 'noun', definition: 'The warmth of the sun in winter.', origin: 'Latin "apricus" (warmed by the sun); an archaic English term from around 1623.', example: 'She sat on the bench and let the apricity soak into her cold hands.' },
  { word: 'Ineffable', pronunciation: '/ɪˈnɛfəb(ə)l/', partOfSpeech: 'adjective', definition: 'Too great or extreme to be expressed or described in words.', origin: 'Latin "ineffabilis," from "in-" (not) + "effabilis" (utterable).', example: 'The beauty of the sunset was ineffable — she simply stood and wept.' },
  { word: 'Resilience', pronunciation: '/rɪˈzɪlɪəns/', partOfSpeech: 'noun', definition: 'The capacity to recover quickly from difficulties; toughness.', origin: 'Latin "resilire" (to rebound, spring back).', example: 'Her resilience after the loss inspired everyone who witnessed it.' },
  { word: 'Solastalgia', pronunciation: '/ˌsoʊlæˈstældʒə/', partOfSpeech: 'noun', definition: 'Distress caused by environmental change in one\'s home environment.', origin: 'Coined by philosopher Glenn Albrecht, from "solacium" (solace) + "-algia" (pain).', example: 'The drought brought a deep solastalgia to the farmers who had worked the land for generations.' },
  { word: 'Ephemera', pronunciation: '/ɪˈfɛm(ə)rə/', partOfSpeech: 'noun', definition: 'Things that exist or are used or enjoyed for only a short time; items of short-lived interest.', origin: 'Greek "ephemera," neuter plural of "ephemeros" (daily).', example: 'She collected ephemera — tickets, postcards, dried flowers — from every meaningful day.' },
  { word: 'Syzygy', pronunciation: '/ˈsɪzɪdʒi/', partOfSpeech: 'noun', definition: 'A conjunction or opposition, especially of the moon or a planet with the sun; a pair of connected or corresponding things.', origin: 'Greek "suzugia" (yoke, pair).', example: 'The tides surged during the syzygy of sun, earth, and moon.' },
  { word: 'Denouement', pronunciation: '/deɪˈnuːmɒ̃/', partOfSpeech: 'noun', definition: 'The final part of a play, film, or narrative in which the strands of the plot are drawn together and resolved.', origin: 'French "dénouement," from "dénouer" (to unknot).', example: 'The denouement of the novel brought tears to her eyes — everything finally made sense.' },
  { word: 'Hiraeth', pronunciation: '/ˈhɪərɑɪθ/', partOfSpeech: 'noun', definition: 'A longing for home or a past that may never have existed; a blend of homesickness, nostalgia, and grief.', origin: 'Welsh, from "hir" (long) + "aeth" (going, grief).', example: 'The old song filled him with hiraeth for a childhood that was simpler than it had really been.' },
  { word: 'Euphoria', pronunciation: '/juːˈfɔːrɪə/', partOfSpeech: 'noun', definition: 'A feeling or state of intense excitement and happiness.', origin: 'Greek "euphoria," from "eu" (well) + "pherein" (to bear).', example: 'She felt a rush of euphoria crossing the finish line.' },
  { word: 'Serenity', pronunciation: '/sɪˈrɛnɪti/', partOfSpeech: 'noun', definition: 'The state of being calm, peaceful, and untroubled.', origin: 'Latin "serenitas," from "serenus" (clear, calm).', example: 'The mountain lake offered a serenity she had been searching for all year.' },
  { word: 'Catharsis', pronunciation: '/kəˈθɑːsɪs/', partOfSpeech: 'noun', definition: 'The process of releasing strong or repressed emotions through art, story, or other expression.', origin: 'Greek "katharsis" (purification), from "kathairein" (to cleanse).', example: 'Crying through the film was a catharsis she hadn\'t known she needed.' },
  { word: 'Labyrinthine', pronunciation: '/ˌlæbɪˈrɪnθɪn/', partOfSpeech: 'adjective', definition: 'Resembling a labyrinth; highly complex or intricate.', origin: 'Greek "labyrinthos" (labyrinth).', example: 'The old city\'s labyrinthine streets made getting lost a pleasure.' },
  { word: 'Elysian', pronunciation: '/ɪˈlɪziən/', partOfSpeech: 'adjective', definition: 'Of, relating to, or resembling Elysium; blissful, beautiful, or divinely perfect.', origin: 'Latin "Elysium," the dwelling place of the blessed dead in Greek mythology.', example: 'The afternoon was elysian — golden, still, and impossibly beautiful.' },
  { word: 'Acumen', pronunciation: '/ˈækjʊmɪn/', partOfSpeech: 'noun', definition: 'The ability to make good judgments and quick decisions, typically in a particular domain.', origin: 'Latin "acumen" (point, sharpness), from "acuere" (to sharpen).', example: 'Her business acumen was undeniable — she spotted opportunities no one else saw.' },
  { word: 'Awe', pronunciation: '/ɔː/', partOfSpeech: 'noun', definition: 'A feeling of reverential respect mixed with fear or wonder.', origin: 'Old Norse "agi" (terror), Old English "ege" (terror, dread).', example: 'Standing at the edge of the canyon, she was struck mute by awe.' },
  { word: 'Bespoke', pronunciation: '/bɪˈspəʊk/', partOfSpeech: 'adjective', definition: 'Made to order; tailored specifically to individual requirements.', origin: 'Past tense of "bespeak" (to order or arrange in advance), English.', example: 'She wore a bespoke dress that fit her perfectly — like it had been made for her alone.' },
  { word: 'Candor', pronunciation: '/ˈkændə/', partOfSpeech: 'noun', definition: 'The quality of being open and honest in expression; frankness.', origin: 'Latin "candor" (whiteness, brightness), from "candere" (to shine).', example: 'His candor was disarming — he spoke with a directness she rarely encountered.' },
  { word: 'Diaphanous', pronunciation: '/daɪˈæfənəs/', partOfSpeech: 'adjective', definition: 'Light, delicate, and translucent.', origin: 'Greek "diaphanes," from "dia" (through) + "phainein" (to show).', example: 'The diaphanous curtains billowed in the sea breeze, letting light pour through.' },
  { word: 'Enthrall', pronunciation: '/ɪnˈθrɔːl/', partOfSpeech: 'verb', definition: 'To captivate; to hold spellbound.', origin: 'Middle English, from "en-" + "thrall" (slave or captive).', example: 'The storyteller\'s voice enthralled the entire room — no one moved a muscle.' },
  { word: 'Flummox', pronunciation: '/ˈflʌməks/', partOfSpeech: 'verb', definition: 'To bewilder or perplex utterly.', origin: 'Origin unknown, possibly from dialectal English.', example: 'The question flummoxed her so completely she could only laugh.' },
  { word: 'Gossamer', pronunciation: '/ˈɡɒsəmə/', partOfSpeech: 'noun/adjective', definition: 'A fine, delicate, insubstantial material; something light, thin, or delicate.', origin: 'Middle English "gossomer," perhaps from "goose summer" (Indian summer, when goose down floated).', example: 'The spider\'s web was gossamer, barely visible in the morning mist.' },
  { word: 'Halcyon', pronunciation: '/ˈhælsiən/', partOfSpeech: 'adjective', definition: 'Denoting a period of time that was idyllically happy and peaceful.', origin: 'Greek mythological bird believed to nest on the sea and calm the waves.', example: 'Those halcyon summer days felt as though they would never end.' },
  { word: 'Ineffable', pronunciation: '/ɪˈnɛfəb(ə)l/', partOfSpeech: 'adjective', definition: 'Too great or extreme to be expressed or described in words.', origin: 'Latin "ineffabilis," from "in-" (not) + "effabilis" (that which can be uttered).', example: 'She tried to describe the view and failed — it was ineffable.' },
  { word: 'Jubilant', pronunciation: '/ˈdʒuːbɪl(ə)nt/', partOfSpeech: 'adjective', definition: 'Feeling or expressing great happiness and triumph.', origin: 'Latin "jubilans," from "jubilare" (to shout for joy).', example: 'The jubilant crowd poured into the streets after the announcement.' },
  { word: 'Kinship', pronunciation: '/ˈkɪnʃɪp/', partOfSpeech: 'noun', definition: 'A sharing of characteristics or origins; a feeling of being closely related or connected.', origin: 'Old English "cyn" (family, race) + "-ship."', example: 'She felt a kinship with the stranger that surprised them both.' },
  { word: 'Lacuna', pronunciation: '/ləˈkjuːnə/', partOfSpeech: 'noun', definition: 'A gap or missing portion, especially in a manuscript; an unfilled space or interval.', origin: 'Latin "lacuna" (hole, pit, pool).', example: 'There was a lacuna in the historical record — no one knew what happened in those missing months.' },
  { word: 'Mnemonic', pronunciation: '/nɪˈmɒnɪk/', partOfSpeech: 'noun/adjective', definition: 'A device or system, such as a pattern of letters or associations, which assists in remembering something.', origin: 'Greek "mnemonikos," from "mnemon" (mindful), from "mnasthai" (to remember).', example: 'She used a mnemonic to remember the order of the planets.' },
  { word: 'Nascent', pronunciation: '/ˈnæs(ə)nt/', partOfSpeech: 'adjective', definition: 'Just coming into existence and beginning to display signs of future potential.', origin: 'Latin "nascens" (being born), from "nasci" (to be born).', example: 'The nascent idea needed time and care before it was ready to share.' },
  { word: 'Opulent', pronunciation: '/ˈɒpjʊl(ə)nt/', partOfSpeech: 'adjective', definition: 'Ostentatiously rich and luxurious; plentiful or abundant.', origin: 'Latin "opulentus," from "opes" (wealth, resources).', example: 'The banquet hall was opulent — silk, gold, and the fragrance of fresh roses everywhere.' },
  { word: 'Palimpsest', pronunciation: '/ˈpælɪm(p)sɛst/', partOfSpeech: 'noun', definition: 'A manuscript where the original writing has been partly erased and overwritten; something altered but still bearing visible traces of its earlier form.', origin: 'Greek "palimpsestos," from "palin" (again) + "psen" (to rub smooth).', example: 'The old city was a palimpsest — layers of history visible in every crumbling wall.' },
  { word: 'Quixotic', pronunciation: '/kwɪkˈsɒtɪk/', partOfSpeech: 'adjective', definition: 'Exceedingly idealistic; unrealistic and impractical.', origin: 'From Don Quixote, the hero of Cervantes\' 1605 novel.', example: 'Her plan to build a tiny house by hand was considered quixotic by her friends, but she did it.' },
  { word: 'Revenant', pronunciation: '/ˈrɛv(ə)n(ə)nt/', partOfSpeech: 'noun', definition: 'A person who has returned, especially supposedly from the dead; something that returns.', origin: 'French "revenant," from "revenir" (to return).', example: 'She felt like a revenant, returning to the town after twenty years.' },
  { word: 'Sempiternal', pronunciation: '/ˌsɛmpɪˈtəːn(ə)l/', partOfSpeech: 'adjective', definition: 'Eternal and unchanging; everlasting.', origin: 'Latin "semper" (always) + "aeternus" (eternal).', example: 'The stars felt sempiternal — a constant in a world that never stopped changing.' },
  { word: 'Tranquil', pronunciation: '/ˈtraŋkwɪl/', partOfSpeech: 'adjective', definition: 'Free from disturbance; calm.', origin: 'Latin "tranquillus" (calm, quiet).', example: 'The lake at dawn was tranquil — not a ripple on its silver surface.' },
  { word: 'Umbra', pronunciation: '/ˈʌmbrə/', partOfSpeech: 'noun', definition: 'The fully shaded inner region of a shadow cast by an opaque object; the shadow itself.', origin: 'Latin "umbra" (shadow).', example: 'During the eclipse, they stood in the umbra of the moon and the sky turned dark.' },
  { word: 'Verdant', pronunciation: '/ˈvəːd(ə)nt/', partOfSpeech: 'adjective', definition: 'Green with grass or other rich vegetation; inexperienced; unsophisticated.', origin: 'French "verdoyant," from "verdoyer" (to be green), from "verd" (green).', example: 'After the long winter, the valley was suddenly verdant and alive.' },
  { word: 'Wabi-Sabi', pronunciation: '/ˌwɑːbi ˈsɑːbi/', partOfSpeech: 'noun', definition: 'A Japanese aesthetic philosophy of finding beauty in imperfection, transience, and incompleteness.', origin: 'Japanese, from "wabi" (rustic simplicity) + "sabi" (beauty of aging and imperfection).', example: 'The cracked glaze of the bowl embodied wabi-sabi — more beautiful for having been broken and repaired.' },
  { word: 'Xenial', pronunciation: '/ˈziːnɪəl/', partOfSpeech: 'adjective', definition: 'Of or pertaining to hospitality or to the relationship between a host and a guest.', origin: 'Greek "xenia" (hospitality), from "xenos" (stranger, guest).', example: 'She had a xenial spirit — strangers always left her home as friends.' },
  { word: 'Yugen', pronunciation: '/juːˈɡɛn/', partOfSpeech: 'noun', definition: 'A Japanese concept for a profound, mysterious sense of the beauty of the universe and the sad beauty of human suffering.', origin: 'Japanese, from Chinese "youxuan" (deep, profound, or obscure).', example: 'Watching the cranes fly into the twilight, she felt a deep yugen she could not describe.' },
  { id: 79, word: 'Zephyr', pronunciation: '/ˈzɛfə/', partOfSpeech: 'noun', definition: 'A soft, gentle breeze; the west wind personified in Greek mythology.', origin: 'Greek "Zephyros," god of the west wind.', example: 'A zephyr moved through the garden, carrying the scent of jasmine.' },
  { word: 'Aureate', pronunciation: '/ˈɔːrɪɪt/', partOfSpeech: 'adjective', definition: 'Made of gold; brilliant; denoting a highly ornate style of literary writing.', origin: 'Latin "aureus" (golden), from "aurum" (gold).', example: 'The setting sun cast an aureate glow across the cathedral\'s stone facade.' },
  { word: 'Brimborion', pronunciation: '/ˈbrɪmbɒrɪɒn/', partOfSpeech: 'noun', definition: 'A small, worthless trinket or trifle.', origin: 'French "brimborion," of uncertain origin.', example: 'Her desk was covered in brimborions — keychains and tokens from every place she had visited.' },
  { word: 'Callipygian', pronunciation: '/ˌkælɪˈpɪdʒɪən/', partOfSpeech: 'adjective', definition: 'Having well-shaped or beautiful buttocks.', origin: 'Greek "kallipugos," from "kallos" (beauty) + "pugē" (buttocks).', example: 'The statue was famous for its callipygian form, rendered by the sculptor in breathtaking detail.' },
  { word: 'Defenestration', pronunciation: '/dɪˌfɛnɪˈstreɪʃ(ə)n/', partOfSpeech: 'noun', definition: 'The action of throwing someone or something out of a window.', origin: 'Latin "de-" (from) + "fenestra" (window); coined after the Defenestration of Prague (1618).', example: 'The defenestration of the old ideas was long overdue — she had needed a clean break for years.' },
  { word: 'Effulgent', pronunciation: '/ɪˈfʌldʒ(ə)nt/', partOfSpeech: 'adjective', definition: 'Radiant; shining brilliantly.', origin: 'Latin "effulgere" (to shine forth).', example: 'The sun broke through the clouds, effulgent and warm after the long grey days.' },
  { word: 'Flibbertigibbet', pronunciation: '/ˈflɪbətɪˌdʒɪbɪt/', partOfSpeech: 'noun', definition: 'A frivolous, flighty, or excessively talkative person.', origin: 'Middle English, probably an imitative formation representing chatter.', example: 'She was a dear flibbertigibbet — impossible to keep on one topic, but wonderful company.' },
  { word: 'Galvanize', pronunciation: '/ˈɡælvənʌɪz/', partOfSpeech: 'verb', definition: 'Shock or excite someone into taking action; stimulate by or as if by an electric current.', origin: 'After Luigi Galvani, Italian physicist who discovered bioelectricity.', example: 'The speech galvanized the crowd into action before the last note had faded.' },
  { word: 'Hapax Legomenon', pronunciation: '/ˌhapaks lɪˈɡɒmɪnɒn/', partOfSpeech: 'noun', definition: 'A word or form of which only one instance of use is recorded.', origin: 'Greek, "said only once."', example: 'The word appeared only once in the ancient text, making it a hapax legomenon that scholars still debate.' },
];

// ─── Word → element mappings (must come after WORDS declaration) ──────────────
const _WORD_ELEMENTS = {
  'Sonder':'air','Hiraeth':'water','Fernweh':'fire','Meraki':'fire','Wanderlust':'fire',
  'Eudaimonia':'air','Hygge':'earth','Lagom':'earth','Serendipity':'air','Ephemeral':'air',
  'Solitude':'water','Sanguine':'fire','Mellifluous':'air','Petrichor':'earth','Liminal':'water',
  'Veridical':'air','Susurrus':'water','Iridescent':'air','Crepuscular':'water','Reverie':'water',
  'Incandescent':'fire','Vellichor':'water','Alchemy':'fire','Luminous':'fire','Numinous':'water',
  'Equanimity':'air','Vesper':'water','Pulchritude':'earth','Halcyon':'earth','Apricity':'earth',
  'Ineffable':'air','Resilience':'earth','Solastalgia':'water','Ephemera':'air','Syzygy':'air',
  'Denouement':'water','Euphoria':'fire','Serenity':'water','Catharsis':'water','Labyrinthine':'air',
  'Elysian':'fire','Acumen':'fire','Awe':'water','Bespoke':'earth','Candor':'air',
  'Diaphanous':'air','Enthrall':'fire','Flummox':'air','Gossamer':'air','Jubilant':'fire',
  'Kinship':'water','Lacuna':'air','Mnemonic':'air','Nascent':'earth','Opulent':'earth',
  'Palimpsest':'air','Quixotic':'fire','Revenant':'water','Sempiternal':'air','Tranquil':'water',
  'Umbra':'water','Verdant':'earth','Wabi-Sabi':'earth','Xenial':'earth','Yugen':'water',
  'Zephyr':'air','Aureate':'fire','Brimborion':'earth','Callipygian':'earth','Defenestration':'fire',
  'Effulgent':'fire','Flibbertigibbet':'air','Galvanize':'fire','Hapax Legomenon':'air',
};
WORDS.forEach(w => { w.element = _WORD_ELEMENTS[w.word] ?? null; });

// ─── Questions: 60 ───────────────────────────────────────────────────────────
export const QUESTIONS = [
  'If you could live your life over again, what would you do differently — and why haven\'t you started doing that now?',
  'What is the difference between the life you are living and the life you want to live?',
  'If your deepest fear came true, would you survive it?',
  'What story are you telling yourself about your life that may not be true?',
  'Who would you be if you had never been told who you should be?',
  'If you had no access to the internet for one year, who would you become?',
  'What are you pretending not to know?',
  'When did you last do something for the first time, and how did it feel?',
  'If the people closest to you described your character, what would they say?',
  'What would you attempt if you knew you could not fail?',
  'What are you most afraid of losing, and why does it have so much power over you?',
  'If you could ask one question and receive a completely truthful answer, what would you ask?',
  'What does a meaningful life look like to you — not in general, but for you specifically?',
  'When you imagine your older self looking back, what will you most wish you had done?',
  'What would you do today if it were your last day of good health?',
  'Are you living from your values or from your fears?',
  'What has been the defining moment of your life so far?',
  'If you could tell the world one thing that you know to be true, what would it be?',
  'What part of yourself have you abandoned along the way to becoming who you are?',
  'What does home mean to you, and do you feel at home in your life?',
  'What relationship in your life most needs attention right now?',
  'If someone observed how you spent your time for the last month, what would they conclude you value most?',
  'What is the kindest thing you could do for yourself this week?',
  'What belief, if you let it go, would free you?',
  'What does joy feel like in your body, and when did you last feel it?',
  'Who are you when no one is watching?',
  'If money were not a factor, how would you spend your time?',
  'What is the most courageous thing you have ever done?',
  'Are you more afraid of failure or of success?',
  'What do you owe yourself that you have been withholding?',
  'What is the quality of your inner voice, and would you speak to a friend the way you speak to yourself?',
  'If your life were a novel, what chapter are you currently in, and what happens next?',
  'What is one thing you have been putting off that, if done, would change everything?',
  'Who do you envy, and what does that tell you about what you want?',
  'When was the last time you changed your mind about something important?',
  'What would you create if no one would ever see it?',
  'What truth do you keep from yourself to avoid discomfort?',
  'Is the life you are living the life that wants to live through you?',
  'What makes you come alive, and are you doing enough of it?',
  'If you could send a message back to yourself ten years ago, what would it say?',
  'What is the bravest thing you could do in the next 24 hours?',
  'What would you need to believe about yourself to take the next step?',
  'Is what you call "who you are" who you really are, or is it who you decided to be?',
  'What parts of yourself have you not yet given yourself permission to express?',
  'Are you seeking approval from someone who will never give it?',
  'What does your soul want that your ego is afraid of?',
  'If your life were a garden, what would be growing and what would need to be pulled out?',
  'What are you still carrying that you were never meant to carry?',
  'If you were already the person you want to be, what would you do today?',
  'What conversation have you been avoiding that could change your life?',
  'Who in your life sees you most clearly, and do you let that be true?',
  'What is the most beautiful thing about being alive that you sometimes forget?',
  'What is the question you are most afraid to ask yourself?',
  'If your purpose found you instead of the other way around, what would it say when it knocked?',
  'What would radical self-acceptance look like in your life right now?',
  'In what area of your life are you playing small?',
  'What would you do if you truly believed you were enough?',
  'How would your day change if you treated every interaction as sacred?',
  'What is the most important thing you have not yet said to someone you love?',
  'If gratitude were a practice, what would you include in tonight\'s prayer?',
];

// ─── Numerology: 1–9 ─────────────────────────────────────────────────────────
export const NUMEROLOGY = [
  {
    number: 1,
    keywords: ['leadership', 'new beginnings', 'independence', 'initiative'],
    description: 'The number 1 is the number of creation and new beginnings. It carries the vibration of the pioneer — bold, independent, and driven by a clear sense of purpose.',
    advice: 'Take the lead today. Trust your instincts and be willing to stand alone in your vision. Something new is asking to be born through you.',
  },
  {
    number: 2,
    keywords: ['partnership', 'balance', 'harmony', 'intuition'],
    description: 'The number 2 holds the frequency of relationship, cooperation, and duality. It is the number of the peacemaker and the bridge-builder.',
    advice: 'Seek balance and collaboration today. Your strength lies in your sensitivity and your willingness to truly listen.',
  },
  {
    number: 3,
    keywords: ['creativity', 'expression', 'joy', 'communication'],
    description: 'The number 3 pulses with creative energy and the joy of self-expression. It is the number of the artist, the communicator, and the child within.',
    advice: 'Express yourself today — through words, art, movement, or laughter. Joy is your spiritual practice.',
  },
  {
    number: 4,
    keywords: ['stability', 'structure', 'discipline', 'foundation'],
    description: 'The number 4 is grounded and reliable, building the foundations upon which dreams become reality. It represents order, security, and the value of dedicated work.',
    advice: 'Focus on building and stabilizing today. Your consistent effort is laying a foundation that will support everything you desire.',
  },
  {
    number: 5,
    keywords: ['freedom', 'change', 'adventure', 'versatility'],
    description: 'The number 5 crackles with the energy of change, curiosity, and freedom. It rules the senses and is drawn to new experiences and the thrill of the unknown.',
    advice: 'Embrace change and flexibility today. Life is inviting you to experience something new — say yes.',
  },
  {
    number: 6,
    keywords: ['love', 'nurturing', 'responsibility', 'home'],
    description: 'The number 6 is the vibration of love, family, and service. It is the most loving of all numbers, deeply devoted to caring for others and creating harmony.',
    advice: 'Nurture your relationships today. Give love freely, but remember that caring for yourself is part of caring for others.',
  },
  {
    number: 7,
    keywords: ['wisdom', 'spirituality', 'introspection', 'mystery'],
    description: 'The number 7 is the seeker — drawn to the deeper mysteries of existence and the pursuit of inner truth. It is the number of the mystic, the philosopher, and the sage.',
    advice: 'Go deeper today. Solitude, meditation, or study will reveal answers that have been just out of reach.',
  },
  {
    number: 8,
    keywords: ['power', 'abundance', 'achievement', 'ambition'],
    description: 'The number 8 is the number of infinite abundance and material mastery. It balances the spiritual and material worlds, understanding that true power serves others.',
    advice: 'Step into your power today with integrity. Success and abundance are natural when effort aligns with purpose.',
  },
  {
    number: 9,
    keywords: ['completion', 'compassion', 'wisdom', 'universal love'],
    description: 'The number 9 is the number of completion and humanitarian service. It has absorbed all previous numbers\' energies and gives back to the world from a place of wholeness.',
    advice: 'Lead with compassion and let go of what is complete. You have wisdom to share — offer it generously.',
  },
];

// ─── Astrology helpers ────────────────────────────────────────────────────────

function cardElement(card) {
  if (card.element) return card.element; // Major Arcana
  if (card.name.includes('Wands'))     return 'fire';
  if (card.name.includes('Cups'))      return 'water';
  if (card.name.includes('Swords'))    return 'air';
  if (card.name.includes('Pentacles')) return 'earth';
  return null;
}

// 70% astro-filtered pick, 30% pure random
function weightedPick(arr, filterFn, seed1, seed2) {
  if (filterFn && (seed1 % 10) < 7) {
    const filtered = arr.filter(filterFn);
    if (filtered.length > 0) return filtered[Math.abs(seed2) % filtered.length];
  }
  return arr[Math.abs(seed2) % arr.length];
}

// ─── Seeding function ─────────────────────────────────────────────────────────
export function getDailyContent(userId, dateStr, chartData = null) {
  function seed(type) {
    return hashCode(userId + dateStr + type);
  }

  // dailyBlend[0] is today's most cosmically active element — driven by transiting moon,
  // lunar phase, day ruler, and season (changes daily). Natal chart adds personal resonance.
  const primaryEl = chartData?.dailyBlend?.[0] ?? null;
  const blendTop2 = chartData?.dailyBlend?.slice(0, 2) ?? [];

  // Tarot: bias toward cards matching today's top 2 cosmically active elements
  const tarot = weightedPick(
    TAROT_CARDS,
    blendTop2.length ? c => blendTop2.includes(cardElement(c)) : null,
    seed('tarot_astro'), seed('tarot')
  );

  // Spirit Animal: HD type takes priority; today's primary element as fallback
  // (astrology and HD are complementary — element guides tarot/word/quote/question, HD guides the animal)
  const animal = weightedPick(
    SPIRIT_ANIMALS,
    chartData ? a => {
      if (chartData.hdType) return a.hdTypes.includes(chartData.hdType);
      const elToHd = { fire: 'manifestor', earth: 'generator', air: 'projector', water: 'reflector' };
      return a.hdTypes.includes(elToHd[primaryEl]);
    } : null,
    seed('animal_astro'), seed('animal')
  );

  // Quote: HD type takes priority; today's primary element as fallback
  const activeCats = chartData?.hdType
    ? (_HD_QUOTE_CATS[chartData.hdType] ?? [])
    : (_ELEMENT_QUOTE_CATS[primaryEl] ?? []);
  const quote = weightedPick(
    quotes,
    activeCats.length ? q => activeCats.includes(q.category) : null,
    seed('quote_astro'), seed('quote')
  );

  // Word: bias toward today's primary cosmically active element
  const word = weightedPick(
    WORDS,
    primaryEl ? w => w.element === primaryEl : null,
    seed('word_astro'), seed('word')
  );

  // Question: bias toward today's primary cosmically active element
  const question = weightedPick(
    QUESTIONS,
    primaryEl ? q => _QUESTION_ELEMENTS[QUESTIONS.indexOf(q)] === primaryEl : null,
    seed('question_astro'), seed('question')
  );

  // Lucky number: always changes daily; life path adds personal resonance (70% weight)
  const lifePathNum = chartData?.lifePath
    ? (chartData.lifePath > 9 ? (chartData.lifePath % 9 || 9) : chartData.lifePath)
    : null;
  const numSeed = seed('number');
  let numerologyNumber;
  if (lifePathNum && (seed('num_astro') % 10) < 7) {
    // Life-path-anchored: combine life path with daily seed so it shifts every day
    numerologyNumber = ((lifePathNum - 1 + numSeed) % 9) + 1;
  } else {
    numerologyNumber = (numSeed % 9) + 1;
  }

  const numerology = NUMEROLOGY.find(n => n.number === numerologyNumber);

  return { tarot, animal, quote, word, question, numerology };
}
