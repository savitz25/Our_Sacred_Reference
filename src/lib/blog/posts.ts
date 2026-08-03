/**
 * Sacred Reference blog posts — full articles + list metadata.
 */

export type BlogPost = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  author: string;
  date: string; // ISO date YYYY-MM-DD
  readTime: string;
  category: string;
  /** SEO description (≤160 chars preferred) */
  description: string;
  /** Optional cover image URL for Open Graph */
  coverImage?: string;
  /** Ordered body blocks for rendering */
  body: BlogBlock[];
};

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string; cite?: string }
  | { type: "heading"; level: 2 | 3; text: string };

export const blogPosts: BlogPost[] = [
  {
    slug: "deconstructing-the-walls-part-1",
    title: "Deconstructing the Walls…Part 1",
    subtitle:
      "Finding the courage and capacity to confront what is behind them",
    author: "Michele Castro",
    date: "2025-01-06",
    readTime: "12 min",
    category: "Embodied Spirituality",
    excerpt:
      "A wrecking ball of reality, childhood walls of survival, and the sacred work of dismantling numbness so a younger part—and a fuller Self—can exist.",
    description:
      "Michele Castro on deconstructing survival walls, the felt sense of a younger self, and finding courage to confront what is behind them. Part 1 — Jan 6, 2025.",
    coverImage:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&q=80",
    body: [
      {
        type: "blockquote",
        text: "People begin to live for an ideal—there’s nothing else to live for. But if you are living for an ideal, and driving yourself as hard as you can to be perfect—at your job or as a mother or as the perfect wife—you lose the natural, slow rhythm of life. There’s just a rushing, trying to attain the ideal. The slower pace of the beat of the earth, the state where you simply are, is forgotten.",
        cite: "Marianne Woodman, 1987, Parabola",
      },
      {
        type: "paragraph",
        text: "I am standing in my kitchen, at the sink and I am hit with a wave of energy that feels like a wrecking ball. Reality comes in and begins the process of demolition of my life as I know it. The wrecking ball smacks right into the middle of my heart. I sit with this and have this wave of feeling, ‘I am utterly alone and I don’t know who I am anymore.’",
      },
      {
        type: "paragraph",
        text: "The reality of my life’s circumstances keep creeping in and just when I think it could not get any worse, more stress, chaos and disappointment keeps arising. Despite my will to fight, push forward, prove my strength, keep on going; my old ways aren’t enough to get through this. How much pride I had in my ability to be strong and handle life’s stressors and yet now I am exhausted. I can focus on nothing else but just surviving the weight and bearing of pressure. So in this moment I stop and just feel my body and come back to presence.",
      },
      {
        type: "paragraph",
        text: "I orient myself and get grounded. I call in the Dark Goddess, I know she will hold me in this and know she understands the greater reality in all of this because over time I have been able to build a relationship with her and a sense of trust. In love and gratitude, my Ancient Crone Witch Earth Mother arises from within me. I am anchored in my heart.",
      },
      {
        type: "heading",
        level: 2,
        text: "A cold dreary Sunday morning",
      },
      {
        type: "paragraph",
        text: "A memory arises, a flash of recollection of a cold dreary Sunday morning at the age of 8 or 9. I wake up to the anxiously loud yelling of my mother, demanding us children to get ready for religious classes and church. I can feel myself lying in bed with a pressure in my head and eyes that feels like it is going to wipe me out.",
      },
      {
        type: "paragraph",
        text: "The pressure moves into my throat and chest and it slowly begins to hollow out my insides. Leaning into it now, it feels like an utter sense of exhaustion, shame, hopelessness and dread. With curiosity, I can also notice an anxiousness and a bracing feeling; the anticipation and fear of my mom coming in and discovering me not ready or not presentable enough. This diffident young girl wanting to be erased from existence and willing to do anything to make myself disappear.",
      },
      {
        type: "paragraph",
        text: "In present time, in my kitchen, almost 40 years later I am stifled and locked into this pain space, realizing that my current circumstances invoke the same experience as this little girl. How can this be when I’ve worked on these patterns so much? How can this still be coming up? I get taken into a storm of negative thoughts and day dreams for a few moments and consciously begin to interrupt that by feeling my feet on the ground, the warm dishwater on my hands. I come back into presence.",
      },
      {
        type: "heading",
        level: 2,
        text: "When wounds surface at the perfect time",
      },
      {
        type: "paragraph",
        text: "Only with my education and experience can I be reassured to trust the deeper layer of my wounds are coming up to the surface at this very time essentially because now is the perfect time. In the past I have cultivated an awareness around these patterns, the nuance between merely understanding in my mind is quite different than allowing these symptoms and sensations to tell a story that allows my psyche and nervous system to have a sense of completion, integration and soul-level embodiment.",
      },
      {
        type: "paragraph",
        text: "I truly understand what is happening to me and this prevents me from being washed over in hopelessness. I am deconstructing my programming as an essential part of awakening my Soul, the dream of the Cosmic Mother coming to life on this waking Earth.",
      },
      {
        type: "paragraph",
        text: "With curiosity, I am bearing witness for the unconscious pain to come forward and be held. I am the one being held and I am also the one holding. This is part of the craft of coming into embodiment. I let go of the voice that gets upset because I am not all healed and acknowledge the voice that has built these tools and skills of resiliency that have allowed me to hold such insight.",
      },
      {
        type: "heading",
        level: 2,
        text: "The wall of numbness",
      },
      {
        type: "paragraph",
        text: "Back in the body, I feel that wall of numbness I construct to separate enough from the dreadful feelings. I let the memories arise again. I sense that little girl again; The fuzziness I feel is like a fog mixed with internal intensity. I get the urge like I must stand completely still. Despite my skin crawling and an impulse to jump out of my skin I get the image of me getting my hair brushed. The fog like feelings seem to reinforce the wall. The feeling is so icky but I manage to be the good enough girl, hoping that I could avoid beatings, scoldings or humiliation.",
      },
      {
        type: "paragraph",
        text: "When the wall is in place, I feel protected. I can sense satisfaction in knowing that I can hide this part of me from the rest of the world as I go off to church and perform my part. The stronger the wall the more this girl can make it in the world, perform to my mother’s expectations and prove to this part of myself that my wall is strong enough.",
      },
      {
        type: "paragraph",
        text: "I know that so much of breaking down these walls will need to include finding that urge to move, pull away and mess up my hair. I can’t fully find that yet and that is okay. I have learned to be patient with the process, to build enough energy that is required to move out of freeze states or bring the unconscious and consciousness together into a Sacred Marriage.",
      },
      {
        type: "heading",
        level: 2,
        text: "Isolation, spiritual community, and “not a victim”",
      },
      {
        type: "paragraph",
        text: "When big emotions like this come up to the surface it often comes with feelings of isolation. Many in my spiritual community would to remind me that I create my own reality and I am not a victim. This always made me feel ashamed of my circumstances and the reason of my suffering. As a result I would withdraw more. For a long time, I tried my hardest to glaze these feelings over so I can prove that I am indeed “Not a victim!”. I could hide the reality of my circumstances and becoming presentable enough to ‘pull it off’, enlisting the wall, these same survival strategies that I used as a kid to help me maintain connection.",
      },
      {
        type: "paragraph",
        text: "This past year, the circumstances of my life seem to become more intense, more and more weight and responsibilities; I am aware I can’t hide anymore. As storm after endless storm rolls into my life, I keep seeking the shelter of these walls. I can’t rely on them anymore, they are wearing down and the weight is too much. As much as I tried to reinforce them, I must let them collapse.",
      },
      {
        type: "heading",
        level: 2,
        text: "Without the walls",
      },
      {
        type: "paragraph",
        text: "As I am drawn into the ocean of catastrophic waters, I have to depend on my two arms to swim so I am not washed away. I need resilience and this capacity to just sit and feel my own body if I am going to make it. Without the walls, I don’t know who I am, for my image of self and worth was tied into them. I structured my entire personality around hiding what is behind them and rewarding myself for how well I could keep them in place and how strong I can be.",
      },
      {
        type: "paragraph",
        text: "As I write this I can track the stories that reel through my mind. I worry that if people read this they won’t see me as valuable, wise and they won’t accept me. These wall composed from the raw materials of my intelligence and capacity to keep going forward have gotten me far, yet these ideals can longer serve me.",
      },
      {
        type: "paragraph",
        text: "These very walls that keep me isolated are the same walls I constructed to keep me in connection. I must allow the wrecking ball to destroy these walls. I must bring this part of myself, the hollowed out child into consciousness and the walls must shatter so I can truly live!",
      },
      {
        type: "heading",
        level: 2,
        text: "Felt sense, space, and initiation",
      },
      {
        type: "paragraph",
        text: "Experiencing the felt sense of this younger part, I begin to also experience this new found space inside my diaphragm and pelvis. Somehow by feeling her and allowing her to exist my whole self becomes more alive and certain. For her to exist means I can exist! All has not been fully resolved or brought into completion but a process has started, a very sacred process.",
      },
      {
        type: "paragraph",
        text: "By holding this younger part and this new space, I can keep allowing the wall to be dismantled block by block. As I work with the felt sense, begin to feel more inside my body, I am growing more comfortable in exposing what it behind these walls. Just writing this becomes a profound part of the initiation process, as it allows a place for the raw authenticity. I claim the voice of my Soul.",
      },
      {
        type: "paragraph",
        text: "I trust in this venerated process and my capacity is building, fortified through my devotion to the somatic embodiment work, nervous system skills and ‘reclaiming the Goddess’. Something is changing, restoring; it might not be my total healed self, but I revel in the hope that is rising in every cell of my body.",
      },
    ],
  },
  {
    slug: "the-felt-sense-the-language-your-body-has-been-speaking-all-along",
    title: "The Felt Sense: The Language Your Body Has Been Speaking All Along",
    author: "Michele Castro",
    date: "2026-07-19",
    readTime: "8 min",
    category: "Felt Sense",
    excerpt:
      "Healing doesn’t begin when you understand your story. It begins when you can finally feel what your body has been trying to tell you—the felt sense as doorway to capacity, safety, and sacred intelligence within.",
    description:
      "Michele Castro on Eugene Gendlin’s felt sense: why insight isn’t enough, how the body speaks in symbols, and why healing unfolds at the speed of safety. Mytho-shamanic somatic wisdom for a Path of Remembering.",
    coverImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
    body: [
      {
        type: "blockquote",
        text: "Healing doesn’t begin when you understand your story. It begins when you can finally feel what your body has been trying to tell you.",
      },
      {
        type: "paragraph",
        text: "Most of us have been taught to live from the neck up.",
      },
      {
        type: "paragraph",
        text: "We analyze. We explain. We search for answers. We read another book, attend another workshop, or receive another energetic activation, hoping this next insight will finally bring lasting change.",
      },
      {
        type: "paragraph",
        text: "Yet beneath all of our thoughts lives another form of intelligence—one that existed long before language.",
      },
      {
        type: "paragraph",
        text: "This is what philosopher Eugene Gendlin called the felt sense.",
      },
      {
        type: "paragraph",
        text: "The felt sense is not an emotion. It is not a thought. It is not simply a physical sensation. It is the body’s living experience of your entire life, held in this present moment.",
      },
      {
        type: "paragraph",
        text: "Imagine walking into an old cathedral. Before you notice the architecture or hear the music, something inside you already knows what the space feels like. There is a subtle atmosphere—a quiet knowing that cannot be explained but is immediately recognizable.",
      },
      {
        type: "paragraph",
        text: "Your inner world works the same way. Every relationship you’ve had, every loss you’ve survived, every moment you felt loved, rejected, abandoned, celebrated, or unseen has left an imprint—not only in memory, but in your body. Your body remembers. Not as a story. As an experience.",
      },
      {
        type: "heading",
        level: 2,
        text: "Why Insight Isn’t Enough",
      },
      {
        type: "paragraph",
        text: "Many people know exactly why they struggle. They understand their childhood. They know their attachment style. They can explain every wound in exquisite detail. Yet their body still braces for rejection, collapses into shame, or cannot receive love.",
      },
      {
        type: "paragraph",
        text: "Healing doesn’t happen simply through understanding. It happens through experience. The nervous system changes when the body is given a new experience—one that it has enough safety and capacity to actually receive. The felt sense is the doorway into that experience.",
      },
      {
        type: "heading",
        level: 2,
        text: "The Body Speaks in Symbols",
      },
      {
        type: "paragraph",
        text: "Our culture often treats the body like a machine that needs fixing. But what if the body is less like a machine and more like an ancient storyteller? The body communicates through tightening, warmth, emptiness, expansion, trembling, tears, pressure, impulses, images, memories, and subtle shifts that are often difficult to name. These are meaningful expressions of your living psyche.",
      },
      {
        type: "paragraph",
        text: "Carl Jung observed that the unconscious speaks through symbols. Somatic psychology teaches us that those symbols are also lived through the body. When we stay present with the felt sense, the body reveals the next step in healing—not through force, but through unfolding.",
      },
      {
        type: "heading",
        level: 2,
        text: "The Wisdom We Were Never Taught",
      },
      {
        type: "paragraph",
        text: "As children, many of us learned to disconnect from our bodies to preserve connection with others. Over time, this disconnection feels normal. The felt sense restores the conversation between your conscious mind and your living body.",
      },
      {
        type: "heading",
        level: 2,
        text: "Why We Go Slowly",
      },
      {
        type: "paragraph",
        text: "The nervous system doesn’t heal through overwhelm. It heals through capacity. Healing happens when we remain present with just enough sensation that the body realizes, “I can feel this, and I don’t have to leave myself.” The body unfolds at the speed of safety.",
      },
      {
        type: "heading",
        level: 2,
        text: "The Sacred Intelligence Within",
      },
      {
        type: "paragraph",
        text: "Across indigenous traditions, contemplative lineages, and depth psychology, wisdom emerges from within. The felt sense is where biology meets psyche, where the nervous system meets the soul, and where the Divine whispers through flesh and breath. Our symptoms are not our enemies; they are invitations. The body has never been working against you. It has been protecting you. Beneath that protection lives an extraordinary intelligence that has never forgotten who you are. Healing becomes less about fixing ourselves and more about remembering ourselves.",
      },
    ],
  },
  {
    slug: "the-tree-in-the-storm",
    title:
      "The Tree in the Storm: How the Body Discovers What the Mind Already Knows",
    author: "Michele Castro",
    date: "2026-07-20",
    readTime: "9 min",
    category: "Felt Sense",
    excerpt:
      "Insight opens a door; the body walks through it. A session story of grounding, a fir tree in a thunderstorm, capacity, and the reclamation of feminine wisdom.",
    description:
      "Michele Castro on why insight alone doesn’t transform: a felt-sense session, a fir tree weathering a storm, nervous system capacity, and Divine Feminine wisdom that trusts life’s cycles.",
    coverImage:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80",
    body: [
      {
        type: "paragraph",
        text: "One of the greatest misconceptions about healing is that insight creates transformation. It doesn’t.",
      },
      {
        type: "paragraph",
        text: "Insight can open a door. Walking through that door is something else entirely...",
      },
      {
        type: "paragraph",
        text: "I was working with a woman in her late sixties who has spent decades immersed in spirituality, shamanism, and personal growth. Nearly forty years earlier, a therapist had offered her a simple, piercing observation:",
      },
      {
        type: "blockquote",
        text: "You rush your thoughts so you don’t have to feel.",
      },
      {
        type: "paragraph",
        text: "She understood those words immediately. Intellectually, they made perfect sense. Yet for almost four decades, understanding them had not created change.",
      },
      {
        type: "paragraph",
        text: "This is something I witness often. We can understand ourselves brilliantly. We can read every book, attend every workshop, memorize every spiritual teaching—and still find ourselves repeating the same patterns. The mind understands. The body has not yet caught up.",
      },
      {
        type: "paragraph",
        text: "Transformation does not happen because we know something. It happens when the body discovers something.",
      },
      {
        type: "paragraph",
        text: "This is why my work begins not with analysis, but with the felt sense.",
      },
      {
        type: "heading",
        level: 2,
        text: "Creating the conditions for support",
      },
      {
        type: "paragraph",
        text: "Rather than asking her to explain herself, I invited her to slow down. To notice her feet. To feel the support of the bed beneath her. To sense the weight of her pelvis. To notice where her back was being held. To become aware of her breath.",
      },
      {
        type: "paragraph",
        text: "We weren’t trying to fix anything. We weren’t trying to transcend anything. We were simply creating the conditions for her nervous system to recognize that, in this moment, she was supported.",
      },
      {
        type: "paragraph",
        text: "As she slowly rolled her ankles and stayed connected to her body, something unexpected emerged. She became aware of a part of herself that didn’t want to be here on Earth. She touched it only briefly. It wasn’t dramatic. It wasn’t overwhelming. It was simply there—quietly waiting beneath decades of thinking.",
      },
      {
        type: "heading",
        level: 2,
        text: "When nature becomes the teacher",
      },
      {
        type: "paragraph",
        text: "And then something extraordinary happened.",
      },
      {
        type: "paragraph",
        text: "Outside her window, a thunderstorm rolled in. Rain poured down. Thunder echoed. Powerful winds bent the branches of a giant fir tree she could see from where she sat.",
      },
      {
        type: "paragraph",
        text: "She watched the tree being pushed and pulled by the storm. Its branches grew heavy with rain. The wind tossed them back and forth.",
      },
      {
        type: "paragraph",
        text: "Then she said something that stopped us both:",
      },
      {
        type: "blockquote",
        text: "The tree is letting the storm move through it… and it’s still standing.",
      },
      {
        type: "paragraph",
        text: "In that moment, nature became the teacher. No explanation I could have offered would have been as powerful as what she was witnessing with her own eyes.",
      },
      {
        type: "paragraph",
        text: "The tree wasn’t resisting the storm. It wasn’t trying to escape the storm. It wasn’t pretending the storm wasn’t happening. It remained deeply rooted while allowing the storm to move through it.",
      },
      {
        type: "paragraph",
        text: "That is what capacity feels like.",
      },
      {
        type: "heading",
        level: 2,
        text: "Healing is remaining rooted",
      },
      {
        type: "paragraph",
        text: "Healing is not the absence of grief. It is not the absence of fear, sadness, anger, or uncertainty. Healing is discovering that we can remain rooted while those experiences move through us.",
      },
      {
        type: "paragraph",
        text: "As we continued sitting together, the rain began to soften. The wind gradually settled. The thunder grew quiet. The tree was still gently swaying, but the intensity had passed.",
      },
      {
        type: "paragraph",
        text: "Nothing about the tree had been “fixed.” It had simply stayed present through the changing weather.",
      },
      {
        type: "paragraph",
        text: "Then something beautiful happened. My client smiled.",
      },
      {
        type: "paragraph",
        text: "She began speaking about the cyclical nature of life. This was not an idea I taught her. It was not a transmission I gave her. It arose naturally from her own embodied experience.",
      },
      {
        type: "paragraph",
        text: "As she watched the storm move through the tree and gradually pass, she recognized that our emotional lives are much the same. Grief comes. Joy comes. Fear comes. Love comes. Nothing is meant to be held onto forever, and nothing is meant to be avoided forever. Everything moves in cycles.",
      },
      {
        type: "heading",
        level: 2,
        text: "The reclamation of feminine wisdom",
      },
      {
        type: "paragraph",
        text: "In that moment I witnessed something I have come to recognize as the reclamation of feminine wisdom.",
      },
      {
        type: "paragraph",
        text: "The feminine is not simply a gendered concept. It is a way of being in relationship with life. It is the wisdom that knows the seasons, the tides, the rhythms of birth and death, contraction and expansion, rest and movement. It does not demand that we remain in a perpetual state of happiness or strive endlessly to maintain a “high vibration.” Instead, it invites us into a deeper trust—that life itself is cyclical, and that every feeling has its own season.",
      },
      {
        type: "paragraph",
        text: "So much of our suffering comes from believing that difficult emotions mean something has gone wrong. We tighten against grief, resist sadness, fear anger, and judge our vulnerability as a sign of failure. Yet nature tells a different story.",
      },
      {
        type: "paragraph",
        text: "The tree does not resist the storm. The river does not cling to one season. The Earth does not remain in perpetual spring. Life itself is cyclical.",
      },
      {
        type: "paragraph",
        text: "As she embodied this truth—not as an idea, but as a lived experience—I watched something soften in her. This wasn’t simply an insight. It was a remembering. A remembering that she, too, belonged to the rhythms of nature. That she didn’t need to fight her inner weather. She could allow it to move through her while remaining deeply rooted in herself.",
      },
      {
        type: "heading",
        level: 2,
        text: "When insight becomes lived experience",
      },
      {
        type: "paragraph",
        text: "For years she had understood intellectually that she rushed her thoughts to avoid feeling. But it wasn’t until her body experienced safety—until she slowed down enough to feel supported, grounded, and present—that something new became possible. The insight became lived experience.",
      },
      {
        type: "paragraph",
        text: "This is one of the great gifts of working with the body. The body speaks the same language as nature. It understands seasons. It understands tides. It understands cycles. It understands contraction and expansion. It understands storms and stillness.",
      },
      {
        type: "paragraph",
        text: "When we stop trying to outthink our healing and begin listening through the body, we discover that healing is not about controlling the weather of our lives. It is about growing roots deep enough to remain present through every season.",
      },
      {
        type: "paragraph",
        text: "The storm will come. The storm will pass. And beneath it all, something steady remains.",
      },
      {
        type: "paragraph",
        text: "Perhaps that steady presence has been there all along, patiently waiting for us to slow down enough to feel it.",
      },
      {
        type: "paragraph",
        text: "And perhaps this is one of the deepest expressions of the Divine Feminine: not transcending the cycles of life, but learning to trust them.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllPostSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}

/** Sorted newest first */
export function getPostsSorted(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
