# Ember

Ember is a static local-first diary editor. It has no framework, package manager, or backend, so browser JavaScript cannot read `.env` files directly.

Each new entry begins with a mood selection. The selected Happy, Neutral, Sad, or Angry atmosphere remains active while writing and is saved with the entry's content, creation time, and latest update time in `localStorage`. Existing entries in the sidebar restore their saved mood when opened.

The editor does not expose a language selector. It uses the browser locale for document and date formatting, leaving room to add translations without storing a language choice on each entry.

The optional companion is also local-first. Presentation, MBTI type, custom personality, and each entry's conversation are stored in `localStorage`. All 16 MBTI types have reusable behavior profiles covering communication, advice, emotional tone, humor, questioning, disagreement, energy, and reflection. The same profile data is assembled into a dynamic companion context so a future API transport can use the same personality contract. It is a reflective writing companion, not a therapist, emergency service, or remote AI provider.

The companion opens from an animated launcher and keeps its drawer, avatar, typing indicator, send state, and message history in the existing diary interface. Diary mood remains the background atmosphere; MBTI only controls companion behavior and subtle UI accents.

The companion uses context-aware friend reactions rather than a fixed support script: it can joke about awkward moments, celebrate wins, ask curious follow-ups, offer an opinion, disagree respectfully, or give practical advice when the user asks for it. Personality is shown through behavior and remains separate from the diary's mood atmosphere.
