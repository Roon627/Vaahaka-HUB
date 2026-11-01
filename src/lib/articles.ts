export interface Article {
  id: string;
  slug: string;
  title: string;
  dvTitle: string;
  tag: string;
  readTime: string;
  date: string;
  excerpt: string;
  dvExcerpt: string;
  sections: {
    heading?: string;
    body: string[];
    quote?: string;
    practice?: {
      title: string;
      steps: string[];
    };
  }[];
  takeaways: string[];
}

export const ARTICLES: Article[] = [
  {
    id: "1",
    slug: "when-the-island-feels-too-small",
    title: "When the Island Feels Too Small: Finding Quiet Boundaries in Close Communities",
    dvTitle: "ރަށް މާ ކުޑަވެ، ފިއްތުންތައް ގިނަވާހިނދު: ހިމޭން އިމެއް ހޯދުން",
    tag: "Quiet Boundaries",
    readTime: "4 min read",
    date: "November 2026",
    excerpt:
      "In communities where everybody knows your family, your work, and your past, the pressure to wear a calm face can be overwhelming. Here is how to protect your inner sanctuary.",
    dvExcerpt:
      "އެކަކު އަނެކަކު ދަންނަ، އާއިލާއާއި ވަނަވަރު ފާޅުވެފައިވާ މުޖުތަމައެއްގައި އުޅޭއިރު އަމިއްލަ ނަފްސުގެ ހިމޭންކަން ރައްކާތެރިކުރާނެ ގޮތް.",
    sections: [
      {
        heading: "The Weight of Being Constantly Seen",
        body: [
          "In the Maldives, community is our greatest shelter, but it can also feel like our tightest enclosure. Whether you live in congested Malé or on an island where neighbors see every step you take, privacy often feels like a luxury.",
          "When you are struggling emotionally, the fear of judgment or gossip often forces you to smile, nod, and say 'haaluhalu rangalhu' (everything is fine) even when your chest feels hollow.",
        ],
      },
      {
        heading: "You Do Not Owe Everyone Access to Your Wound",
        quote: "Kindness to others does not mean leaving the front door of your soul unlocked for everyone to walk through.",
        body: [
          "It is completely healthy to care deeply for your family while keeping a quiet room inside yourself that belongs only to you. You do not have to explain your sorrow or justify your quietness to anyone.",
          "Creating an emotional boundary doesn't mean becoming cold; it simply means recognizing that your healing is your own sacred ground.",
        ],
        practice: {
          title: "The Lagoon Boundary Reflection",
          steps: [
            "Imagine an atoll's outer reef. It absorbs the harsh ocean swell while keeping the lagoon inside calm and turquoise.",
            "Identify one emotional topic you currently do not want to discuss with relatives or acquaintances.",
            "Practice saying gently: 'I appreciate you checking in, but I’m taking some quiet time to process things right now.'",
          ],
        },
      },
      {
        heading: "Carving Solitude in Crowded Spaces",
        body: [
          "Solitude does not always require an empty island. It can be five minutes listening to the waves at the jetty at dusk, early morning walks before the harbor wakes, or pouring your thoughts onto an anonymous sheet of paper that no one in your daily life will ever link to your name.",
        ],
      },
    ],
    takeaways: [
      "Privacy is a mental health necessity, not a luxury or a secret.",
      "You are allowed to be quiet without being questioned.",
      "The sea listens without expectations or gossip.",
    ],
  },
  {
    id: "2",
    slug: "the-weight-you-dont-have-to-carry",
    title: "The Weight You Don't Have to Carry Alone: The Power of Releasing Unspoken Grief",
    dvTitle: "އެކަނި އުފުލަން ނުޖެހޭ ބުރަ: ހިތުގެ އުދާސްތައް ދޫކޮށްލުމުގެ ބާރު",
    tag: "Emotional Release",
    readTime: "5 min read",
    date: "November 2026",
    excerpt:
      "We are taught to be resilient and bear sorrow with silence. But bottling up pain changes your nervous system. Why letting words go—even anonymously—heals the heart.",
    dvExcerpt:
      "ހިތާމަތަކުގައި ހިތްވަރުކޮށް ހިމޭންވުމަށް އަހަރެމެން ދަސްކުރި ނަމަވެސް، އެ ބުރަ ހިތުގައި ފޮރުވައިގެން ހުރުމަކީ ނަފްސަށް ގެއްލުންހުރި ކަމެކެވެ.",
    sections: [
      {
        heading: "The Myth of 'Hiyy Hiyvaru Kurun' Without Tears",
        body: [
          "From childhood, Maldivians are encouraged to have 'hiyy hiyvaru' (fortitude of heart). While strength is admirable, too often it gets mistaken for emotional numbness.",
          "We swallow tears at funerals, conceal heartbreak behind busy routines, and endure family conflict in silence. But the body keeps the score. Unexpressed grief turns into physical fatigue, tension in the shoulders, insomnia, and sudden irritability.",
        ],
      },
      {
        heading: "Why Uncorking Words Creates Neural Relief",
        quote: "Naming a feeling moves it from the primal panic center of the brain to the calming reflective cortex.",
        body: [
          "Neuroscience shows that when emotional turmoil remains unexpressed as vague sensations, the amygdala remains on high alert. The moment you translate a heavy feeling into specific words—'I feel abandoned', 'I am afraid I made the wrong choice', 'I miss them'—your nervous system begins to down-regulate.",
          "Even if no person is standing in front of you, writing your raw thoughts down and letting them float away produces a measurable decrease in stress hormones.",
        ],
      },
      {
        heading: "Letting Go Without Needing Answers",
        body: [
          "Not every letter needs a reply. Sometimes the greatest relief is not receiving advice, but simply knowing that the truth was spoken and no longer trapped inside your ribs.",
        ],
      },
    ],
    takeaways: [
      "True resilience includes acknowledging when something hurts.",
      "Holding pain silently does not make it disappear; putting words to it does.",
      "You can release an unspoken thought today without owing anyone a confession.",
    ],
  },
  {
    id: "3",
    slug: "breathing-with-the-tide",
    title: "Breathing With the Tide: An Island Grounding Practice for Anxious Moments",
    dvTitle: "ރާޅާއެކު ނޭވާލުން: ހާސްކަން ކުޑަކުރުމަށް ޒަމާންވީ ކަނޑުގެ އުކުޅެއް",
    tag: "Grounding Practice",
    readTime: "3 min read",
    date: "November 2026",
    excerpt:
      "When anxiety tightens your chest and thoughts race like storm winds, match your breath to the rhythm of gentle waves. A simple somatic reset you can do anywhere.",
    dvExcerpt:
      "ހިތުގެ ހިނގުން އަވަސްވެ، ހާސްކަން އިތުރުވާ ވަގުތުތަކުގައި ކަނޑުގެ ރާޅުތަކުގެ އަޑާއި އޮއިވަރާ އެއްވަރަށް ނޭވާލައި ހަމަޖެހުން ހޯދާނެ ގޮތް.",
    sections: [
      {
        heading: "When Your Nervous System Thinks the Storm Is Inside",
        body: [
          "Anxiety is your body's ancient wave alarm sounding when no tidal wave is present. Your breath turns shallow, your hands grow cold, and your mind races through future catastrophes.",
          "Because your brain takes cues directly from the diaphragm, changing your breathing pattern is the fastest biological remote control for calming anxiety.",
        ],
      },
      {
        heading: "The Ocean Tide (4-4-6) Breath",
        body: [
          "Practice this whenever you feel overwhelmed, in transit, at work, or before trying to fall asleep.",
        ],
        practice: {
          title: "The 3-Minute Tidal Wave Reset",
          steps: [
            "Inhale smoothly through your nose for 4 counts: Picture a cool, gentle wave flowing up onto the white sand.",
            "Hold softly for 4 counts: Feel the still, quiet crest of the water, effortless and suspended under the sky.",
            "Exhale through gently parted lips for 6 counts: Listen to the water receding back into the deep sea, taking the tension with it.",
            "Repeat this cycle 4 to 6 times. Feel the shoulders drop away from your ears.",
          ],
        },
      },
    ],
    takeaways: [
      "Exhalations longer than inhalations activate your parasympathetic (calming) vagus nerve.",
      "You don't have to fix everything right now. Just breathe through this one wave.",
      "The ocean has been washing ashore for thousands of years; it knows how to carry the weight.",
    ],
  },
  {
    id: "4",
    slug: "how-to-sit-with-a-friend-who-is-hurting",
    title: "How to Sit With a Friend in Pain (Without Trying to Fix It)",
    dvTitle: "އެކުވެރިޔަކު ހިތާމައިގައި ވާހިނދު: ހަމައެކަނި އަޑުއަހާލުމުގެ އޯގާތެރިކަން",
    tag: "Compassionate Care",
    readTime: "4 min read",
    date: "November 2026",
    excerpt:
      "When someone we care about is grieving or struggling, our instinct is to offer solutions or tell them to stay positive. Often, the kindest gift is simply sitting beside them in the quiet.",
    dvExcerpt:
      "އެކުވެރިޔަކު ހިތާމަކުރާއިރު ނަސޭހަތްދިނުމުގެ ބަދަލުގައި، ހަމައެކަނި އެމީހެއްގެ އަޑުއަހައި އެކުގައި ހުރުމަކީ ކިހާ މުހިންމު ކަމެއްކަން ދެނެގަންނާށެވެ.",
    sections: [
      {
        heading: "The Trap of 'Toxic Positivity'",
        body: [
          "Hearing someone we love say 'I feel like giving up' or 'I am so tired of everything' is frightening. Out of anxiety, we often rush to say: 'Everything happens for a reason', 'Others have it worse', or 'Just stay strong and pray'.",
          "While well-intentioned, these phrases inadvertently signal to the person that their pain is uncomfortable to witness, causing them to withdraw into deeper isolation.",
        ],
      },
      {
        heading: "What Quiet Support Actually Looks Like",
        quote: "You do not need the right words. Your undivided presence is the answer.",
        body: [
          "Validation is the antidote to shame. When someone is drowning emotionally, they don't need a lecture on how to swim; they need someone to sit on the shore and keep a steady light on.",
        ],
        practice: {
          title: "Three Gentle Phrases to Keep in Your Pocket",
          steps: [
            "'I hear how exhausting this is for you. It makes total sense why you feel that way.'",
            "'You don't have to put on a brave face with me. I am here for all of it.'",
            "'I don't have all the answers, but you will never have to face this alone.'",
          ],
        },
      },
    ],
    takeaways: [
      "Listening without offering unasked advice is an act of deep reverence.",
      "Never minimize someone's pain by comparing it to others.",
      "If you notice signs of severe despair or self-harm, gently connect them with 1677.",
    ],
  },
  {
    id: "5",
    slug: "overcoming-nighttime-overthinking",
    title: "Why the Sea Whispers Loudest at 2 AM: Untangling Nighttime Overthinking",
    dvTitle: "ދަންވަރު 2 ޖަހާއިރު ސިކުނޑީގެ ވިސްނުންތައް ގިނަވާ ސަބަބު އަދި ހައްލު",
    tag: "Peace of Mind",
    readTime: "4 min read",
    date: "November 2026",
    excerpt:
      "Why do worries that seem manageable by day become monsters in the dark? Understanding circadian brain chemistry and how to let sleep return.",
    dvExcerpt:
      "ރޭގަނޑު އެނދުގައި އޮންނައިރު ސިކުނޑިއަށް ވެރިވާ ބިރުވެރިކަމާއި ފިކުރުތައް ހަމައަކަށް އަޅުވައި، ހަމަޖެހިގެން ނިދާލާނެ ގޮތް.",
    sections: [
      {
        heading: "The 2:00 AM Brain Distortion",
        body: [
          "If you have ever stared at the ceiling at 2:00 AM convinced your life is in ruin, only to wake up at 8:00 AM wondering why you panicked, you are experiencing the 'Mind After Midnight' phenomenon.",
          "During the deep night, your brain's frontal lobe (responsible for rational perspective and problem-solving) is running on low fuel, while dopamine and emotional sensitivity shift. Your mind magnifies regrets and projects worst-case scenarios.",
        ],
      },
      {
        heading: "The Notepad by the Bed",
        body: [
          "The biggest mistake is trying to solve daytime problems in a nighttime brain. You cannot make good life decisions at 3:00 in the morning.",
        ],
        practice: {
          title: "The Midnight Harbor Protocol",
          steps: [
            "Keep a paper pad or your Ihusaas bottle composer open.",
            "Write down the three biggest anxieties circling your mind.",
            "Tell yourself: 'These thoughts are noted. The harbor is closed for the night. I will attend to them tomorrow when the sun is up.'",
            "Turn your screen off, listen to the ambient wave sound, and let the sea watch over the night.",
          ],
        },
      },
    ],
    takeaways: [
      "Never trust the conclusions your brain draws after midnight.",
      "Write worries down on paper to release them from mental loops.",
      "Tomorrow's light brings perspective that the darkness cannot offer.",
    ],
  },
];
