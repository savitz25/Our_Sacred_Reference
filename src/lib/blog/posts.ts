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
