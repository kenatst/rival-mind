import type {
  Achievement,
  AppNotification,
  Country,
  CountryRanking,
  DailyChallenge,
  Division,
  LeaderboardEntry,
  League,
  LiveEvent,
  PlayerProfile,
  Question,
  User,
  BattleChallenge,
} from "@/lib/types";

export const countries = {
  FR: { code: "FR", name: "France", flag: "🇫🇷" },
  JP: { code: "JP", name: "Japan", flag: "🇯🇵" },
  DE: { code: "DE", name: "Germany", flag: "🇩🇪" },
  GB: { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  CA: { code: "CA", name: "Canada", flag: "🇨🇦" },
  US: { code: "US", name: "United States", flag: "🇺🇸" },
  ES: { code: "ES", name: "Spain", flag: "🇪🇸" },
  BR: { code: "BR", name: "Brazil", flag: "🇧🇷" },
  IT: { code: "IT", name: "Italy", flag: "🇮🇹" },
  KR: { code: "KR", name: "South Korea", flag: "🇰🇷" },
} satisfies Record<string, Country>;

export const divisions: Division[] = [
  { tier: "Rookie", minElo: 0, maxElo: 799, color: "oklch(0.7 0.02 265)" },
  { tier: "Bronze", minElo: 800, maxElo: 999, color: "oklch(0.66 0.12 55)" },
  { tier: "Silver", minElo: 1000, maxElo: 1199, color: "oklch(0.82 0.02 250)" },
  { tier: "Gold", minElo: 1200, maxElo: 1399, color: "oklch(0.83 0.16 84)" },
  { tier: "Platinum", minElo: 1400, maxElo: 1599, color: "oklch(0.85 0.1 190)" },
  { tier: "Diamond", minElo: 1600, maxElo: 1799, color: "oklch(0.8 0.15 215)" },
  { tier: "Master", minElo: 1800, maxElo: 1999, color: "oklch(0.7 0.2 300)" },
  { tier: "Grandmaster", minElo: 2000, maxElo: 2199, color: "oklch(0.66 0.26 5)" },
  { tier: "Legend", minElo: 2200, maxElo: 4000, color: "oklch(0.88 0.21 122)" },
];

export const achievements: Achievement[] = [
  { id: "a1", label: "Perfect 12", description: "12/12 on a Daily 12 challenge", icon: "🎯", unlocked: true },
  { id: "a2", label: "Deca-Streak", description: "10 ranked 1v1 wins in a row", icon: "⚡", unlocked: true },
  { id: "a3", label: "French Vanguard", description: "Reached Top 1,000 in France", icon: "🏛", unlocked: true },
  { id: "a4", label: "Diamond Club", description: "Reached the Diamond Division (1600+)", icon: "💎", unlocked: true, ratingRequired: 1600 },
  { id: "a5", label: "Centurion", description: "100 ranked match victories", icon: "💯", unlocked: false },
  { id: "a6", label: "Apex Legend", description: "Reach 2,200 ELO in the world ranking", icon: "👑", unlocked: false, ratingRequired: 2200 },
];

export const currentUser: PlayerProfile = {
  id: "u-kenael",
  username: "KENAEL",
  country: countries.FR,
  avatarColor: "oklch(0.88 0.21 122)",
  initials: "KE",
  elo: 1657,
  peakElo: 1742,
  xp: 18430,
  level: 27,
  streak: 14,
  worldRank: 18429,
  countryRank: 721,
  accuracy: 72,
  battles: 438,
  wins: 287,
  season: "Genesis",
  strongCategories: [
    { category: "History", score: 82, mmr: 1740 },
    { category: "Geography", score: 78, mmr: 1680 },
    { category: "Science", score: 71, mmr: 1650 },
  ],
  weakCategories: [
    { category: "Music", score: 48, mmr: 1450 },
    { category: "Cinema", score: 44, mmr: 1420 },
  ],
  achievements,
};

export const rivalOpponent: PlayerProfile = {
  id: "u-lucas92",
  username: "LUCAS92",
  country: countries.FR,
  initials: "L9",
  avatarColor: "oklch(0.66 0.26 5)",
  elo: 1691,
  peakElo: 1718,
  xp: 22100,
  level: 31,
  worldRank: 15220,
  countryRank: 604,
  accuracy: 74,
  battles: 512,
  wins: 331,
  streak: 6,
  season: "Genesis",
  strongCategories: [
    { category: "Cinema", score: 84 },
    { category: "Sports", score: 79 },
  ],
  weakCategories: [{ category: "History", score: 55 }],
  achievements: achievements.slice(0, 4),
};

export const friends: PlayerProfile[] = [
  { ...rivalOpponent, id: "f-lucas", username: "Lucas92", initials: "L9", elo: 1691, online: true, worldRank: 15220 },
  { ...currentUser, id: "f-emma", username: "Emma", initials: "EM", elo: 1602, avatarColor: "oklch(0.8 0.15 215)", online: true, worldRank: 19410 },
  { ...currentUser, id: "f-jules", username: "Jules", initials: "JU", elo: 1510, avatarColor: "oklch(0.78 0.19 152)", online: false, worldRank: 29810 },
  { ...currentUser, id: "f-thomas", username: "Thomas", initials: "TH", elo: 1288, avatarColor: "oklch(0.83 0.16 84)", online: true, worldRank: 74320 },
  { ...currentUser, id: "f-chloe", username: "Chloé", initials: "CH", elo: 1104, avatarColor: "oklch(0.7 0.2 300)", online: false, worldRank: 142100 },
];

export const pendingBattleChallenge: BattleChallenge = {
  id: "chal-thomas",
  challenger: friends[3]!, // Thomas
  questionsCount: 10,
  expiresIn: "22 hours",
  rivalryWins: 7,
  rivalryLosses: 6,
};

const u = (username: string, country: Country, initials: string, color: string): User => ({
  id: `p-${username.toLowerCase()}`,
  username,
  country,
  initials,
  avatarColor: color,
});

export const topLeaderboard: LeaderboardEntry[] = [
  { rank: 1, player: u("ALEXANDRE", countries.FR, "AL", "oklch(0.88 0.21 122)"), elo: 2841, trend: 2, streak: 8 },
  { rank: 2, player: u("HIKARI", countries.JP, "HI", "oklch(0.66 0.26 5)"), elo: 2792, trend: -1, streak: 4 },
  { rank: 3, player: u("BEN", countries.GB, "BE", "oklch(0.8 0.15 215)"), elo: 2764, trend: 1, streak: 5 },
  { rank: 4, player: u("EMILY", countries.US, "EM", "oklch(0.83 0.16 84)"), elo: 2741, trend: 0, streak: 3 },
  { rank: 5, player: u("FELIX", countries.DE, "FE", "oklch(0.7 0.2 300)"), elo: 2718, trend: 3, streak: 6 },
  { rank: 6, player: u("MINJUN", countries.KR, "MJ", "oklch(0.78 0.19 152)"), elo: 2694, trend: -2 },
  { rank: 7, player: u("GIULIA", countries.IT, "GI", "oklch(0.85 0.1 190)"), elo: 2671, trend: 1 },
  { rank: 8, player: u("RAFAEL", countries.BR, "RA", "oklch(0.83 0.16 84)"), elo: 2650, trend: -1 },
  { rank: 9, player: u("SOFIA", countries.ES, "SO", "oklch(0.66 0.26 5)"), elo: 2633, trend: 0 },
  { rank: 10, player: u("NOAH", countries.CA, "NO", "oklch(0.8 0.15 215)"), elo: 2611, trend: 2 },
];

export const nearbyLeaderboard: LeaderboardEntry[] = [
  { rank: 18426, player: u("Sarah", countries.CA, "SA", "oklch(0.85 0.1 190)"), elo: 1660, trend: 1 },
  { rank: 18427, player: u("Marco", countries.IT, "MA", "oklch(0.83 0.16 84)"), elo: 1659, trend: -1 },
  { rank: 18428, player: u("Kenji", countries.JP, "KJ", "oklch(0.8 0.15 215)"), elo: 1658, trend: 0 },
  { rank: 18429, player: u("YOU", countries.FR, "KE", "oklch(0.88 0.21 122)"), elo: 1657, isYou: true, trend: 2, streak: 4 },
  { rank: 18430, player: u("Ines", countries.ES, "IN", "oklch(0.7 0.2 300)"), elo: 1656, trend: -1 },
  { rank: 18431, player: u("Leo", countries.BR, "LE", "oklch(0.66 0.26 5)"), elo: 1655, trend: 0 },
  { rank: 18432, player: u("Noah_K", countries.DE, "NK", "oklch(0.78 0.19 152)"), elo: 1654, trend: -2 },
];

export const franceLeaderboard: LeaderboardEntry[] = [
  { rank: 1, player: u("ALEXANDRE", countries.FR, "AL", "oklch(0.88 0.21 122)"), elo: 2841, streak: 8 },
  { rank: 2, player: u("CAMILLE", countries.FR, "CA", "oklch(0.66 0.26 5)"), elo: 2588, streak: 5 },
  { rank: 3, player: u("YANIS", countries.FR, "YA", "oklch(0.8 0.15 215)"), elo: 2471 },
  { rank: 4, player: u("MANON", countries.FR, "MN", "oklch(0.83 0.16 84)"), elo: 2402 },
  { rank: 5, player: u("HUGO", countries.FR, "HU", "oklch(0.7 0.2 300)"), elo: 2377 },
];

export const friendsLeaderboard: LeaderboardEntry[] = [
  { rank: 1, player: u("Lucas92", countries.FR, "L9", "oklch(0.66 0.26 5)"), elo: 1691, streak: 6 },
  { rank: 2, player: u("YOU", countries.FR, "KE", "oklch(0.88 0.21 122)"), elo: 1657, isYou: true, streak: 4 },
  { rank: 3, player: u("Emma", countries.FR, "EM", "oklch(0.8 0.15 215)"), elo: 1602, streak: 2 },
  { rank: 4, player: u("Jules", countries.FR, "JU", "oklch(0.78 0.19 152)"), elo: 1510 },
  { rank: 5, player: u("Thomas", countries.FR, "TH", "oklch(0.83 0.16 84)"), elo: 1288 },
  { rank: 6, player: u("Chloé", countries.FR, "CH", "oklch(0.7 0.2 300)"), elo: 1104 },
];

export const countryRankings: CountryRanking[] = [
  { rank: 1, country: countries.JP, power: 1684, totalPoints: 18402551, todayPoints: 34210, players: 2841002 },
  { rank: 2, country: countries.DE, power: 1651, totalPoints: 16220984, todayPoints: 29874, players: 2410338 },
  { rank: 3, country: countries.GB, power: 1622, totalPoints: 12933442, todayPoints: 25110, players: 1988421 },
  { rank: 4, country: countries.FR, power: 1608, totalPoints: 12849221, todayPoints: 21482, players: 1904772 },
  { rank: 5, country: countries.CA, power: 1591, totalPoints: 9440218, todayPoints: 17903, players: 1220984 },
  { rank: 6, country: countries.US, power: 1574, totalPoints: 21044887, todayPoints: 41221, players: 4102773 },
  { rank: 7, country: countries.KR, power: 1560, totalPoints: 7712004, todayPoints: 15442, players: 998221 },
  { rank: 8, country: countries.IT, power: 1544, totalPoints: 6902113, todayPoints: 12980, players: 902117 },
  { rank: 9, country: countries.ES, power: 1531, totalPoints: 6488220, todayPoints: 12112, players: 884330 },
  { rank: 10, country: countries.BR, power: 1508, totalPoints: 8811002, todayPoints: 19884, players: 2011884 },
];

export const privateLeague: League = {
  id: "l-genies",
  name: "Les Génies",
  season: 4,
  memberCount: 12,
  inviteCode: "iqarena.gg/league/GENIES-4X92",
  members: [
    { rank: 1, player: u("Lucas92", countries.FR, "L9", "oklch(0.66 0.26 5)"), points: 4821, weeklyRank: 2, battlesWon: 41, accuracy: 76, elo: 1691 },
    { rank: 2, player: u("YOU", countries.FR, "KE", "oklch(0.88 0.21 122)"), points: 4603, weeklyRank: 1, battlesWon: 38, accuracy: 72, elo: 1657, isYou: true },
    { rank: 3, player: u("Emma", countries.FR, "EM", "oklch(0.8 0.15 215)"), points: 3912, weeklyRank: 4, battlesWon: 33, accuracy: 74, elo: 1602 },
    { rank: 4, player: u("Thomas", countries.FR, "TH", "oklch(0.83 0.16 84)"), points: 3540, weeklyRank: 3, battlesWon: 28, accuracy: 68, elo: 1288 },
    { rank: 5, player: u("Jules", countries.FR, "JU", "oklch(0.78 0.19 152)"), points: 3211, weeklyRank: 5, battlesWon: 24, accuracy: 70, elo: 1510 },
    { rank: 6, player: u("Chloé", countries.FR, "CH", "oklch(0.7 0.2 300)"), points: 2988, weeklyRank: 6, battlesWon: 21, accuracy: 65, elo: 1104 },
  ],
};

export const dailyChallenge: DailyChallenge = {
  date: "August 15",
  totalQuestions: 12,
  completed: true,
  score: 11,
  percentile: 2.8,
  countryRank: 8421,
  hoursRemaining: 8,
  friends: [
    { player: u("Emma", countries.FR, "EM", "oklch(0.8 0.15 215)"), score: 12 },
    { player: u("YOU", countries.FR, "KE", "oklch(0.88 0.21 122)"), score: 11 },
    { player: u("Lucas92", countries.FR, "L9", "oklch(0.66 0.26 5)"), score: 10 },
    { player: u("Thomas", countries.FR, "TH", "oklch(0.83 0.16 84)"), score: 7 },
  ],
};

export const notifications: AppNotification[] = [
  {
    id: "n1",
    kind: "rival",
    title: "Thomas passed you",
    body: "By 12 ELO in the France circuit.",
    time: "2 min",
    unread: true,
    actionRoute: "/rankings",
  },
  {
    id: "n2",
    kind: "rematch",
    title: "Emma wants a rematch",
    body: "She challenged you to a 10-question duel.",
    time: "18 min",
    unread: true,
    actionRoute: "/quiz",
    actionQuery: { mode: "battle", opponent: "emma" },
  },
  {
    id: "n3",
    kind: "country",
    title: "France is trailing Spain",
    body: "49.7% — 50.3% · 4h left in the Nation War.",
    time: "1 h",
    unread: true,
    actionRoute: "/rankings",
  },
  {
    id: "n4",
    kind: "streak",
    title: "Your 14-day streak is at risk",
    body: "Play one ranked match before midnight.",
    time: "3 h",
    unread: false,
    actionRoute: "/matchmaking",
  },
  {
    id: "n5",
    kind: "league",
    title: "Only one player got 12/12 today",
    body: "Emma is the only perfect score in Les Génies.",
    time: "5 h",
    unread: false,
    actionRoute: "/daily",
  },
  {
    id: "n6",
    kind: "event",
    title: "World Quiz opens Sunday",
    body: "France vs The World · 20:00 CEST.",
    time: "1 d",
    unread: false,
    actionRoute: "/live",
  },
];

export const liveEvent: LiveEvent = {
  id: "e1",
  title: "World Quiz: France vs The World",
  startsAt: "Sunday 20:00 CEST",
  homeCountry: countries.FR,
  challenger: "The World",
  registered: 254821,
  prizePool: "€50,000",
  isRegistered: false,
};

export const questions: Question[] = [
  {
    id: "q1",
    category: "Geography",
    prompt: "Which country has the longest coastline in the world?",
    answers: [
      { id: "a", label: "Canada" },
      { id: "b", label: "Russia" },
      { id: "c", label: "Indonesia" },
      { id: "d", label: "Australia" },
    ],
    correctAnswerId: "a",
    seconds: 10,
    globalSuccessRate: 61,
  },
  {
    id: "q2",
    category: "History",
    prompt: "Which pre-Columbian empire built the citadel of Machu Picchu?",
    answers: [
      { id: "a", label: "Aztec" },
      { id: "b", label: "Inca" },
      { id: "c", label: "Maya" },
      { id: "d", label: "Olmec" },
    ],
    correctAnswerId: "b",
    seconds: 10,
    globalSuccessRate: 74,
  },
  {
    id: "q3",
    category: "Science",
    prompt: "Which chemical element is represented by the symbol W?",
    answers: [
      { id: "a", label: "Tungsten" },
      { id: "b", label: "Tin" },
      { id: "c", label: "Uranium" },
      { id: "d", label: "Zirconium" },
    ],
    correctAnswerId: "a",
    seconds: 10,
    globalSuccessRate: 48,
  },
  {
    id: "q4",
    category: "Cinema",
    prompt: "Who directed the Academy Award-winning film 'Parasite' (2019)?",
    answers: [
      { id: "a", label: "Park Chan-wook" },
      { id: "b", label: "Bong Joon-ho" },
      { id: "c", label: "Kim Ki-duk" },
      { id: "d", label: "Lee Chang-dong" },
    ],
    correctAnswerId: "b",
    seconds: 10,
    globalSuccessRate: 66,
  },
  {
    id: "q5",
    category: "Sports",
    prompt: "How many players per team are on the field in rugby union?",
    answers: [
      { id: "a", label: "13" },
      { id: "b", label: "14" },
      { id: "c", label: "15" },
      { id: "d", label: "11" },
    ],
    correctAnswerId: "c",
    seconds: 10,
    globalSuccessRate: 57,
  },
  {
    id: "q6",
    category: "Music",
    prompt: "Which instruments does a luthier traditionally craft and repair?",
    answers: [
      { id: "a", label: "Percussion" },
      { id: "b", label: "Stringed instruments" },
      { id: "c", label: "Pipe organs" },
      { id: "d", label: "Woodwinds" },
    ],
    correctAnswerId: "b",
    seconds: 10,
    globalSuccessRate: 52,
  },
  {
    id: "q7",
    category: "Geography",
    prompt: "Which natural strait separates Europe from the African continent?",
    answers: [
      { id: "a", label: "Bosphorus" },
      { id: "b", label: "Strait of Hormuz" },
      { id: "c", label: "Strait of Gibraltar" },
      { id: "d", label: "Bering Strait" },
    ],
    correctAnswerId: "c",
    seconds: 10,
    globalSuccessRate: 79,
  },
  {
    id: "q8",
    category: "History",
    prompt: "In which year did the Berlin Wall fall, signaling the end of the Cold War?",
    answers: [
      { id: "a", label: "1987" },
      { id: "b", label: "1989" },
      { id: "c", label: "1991" },
      { id: "d", label: "1985" },
    ],
    correctAnswerId: "b",
    seconds: 10,
    globalSuccessRate: 81,
  },
  {
    id: "q9",
    category: "Science",
    prompt: "What is the most abundant gas in Earth's atmosphere by volume?",
    answers: [
      { id: "a", label: "Oxygen" },
      { id: "b", label: "Carbon dioxide" },
      { id: "c", label: "Nitrogen" },
      { id: "d", label: "Argon" },
    ],
    correctAnswerId: "c",
    seconds: 10,
    globalSuccessRate: 70,
  },
  {
    id: "q10",
    category: "Art",
    prompt: "Which Post-Impressionist painter created 'The Starry Night' in 1889?",
    answers: [
      { id: "a", label: "Paul Gauguin" },
      { id: "b", label: "Vincent van Gogh" },
      { id: "c", label: "Edvard Munch" },
      { id: "d", label: "Claude Monet" },
    ],
    correctAnswerId: "b",
    seconds: 10,
    globalSuccessRate: 88,
  },
  {
    id: "q11",
    category: "Sports",
    prompt: "Which national team has won the most FIFA Men's World Cup titles (5)?",
    answers: [
      { id: "a", label: "Germany" },
      { id: "b", label: "Italy" },
      { id: "c", label: "Argentina" },
      { id: "d", label: "Brazil" },
    ],
    correctAnswerId: "d",
    seconds: 10,
    globalSuccessRate: 83,
  },
  {
    id: "q12",
    category: "Literature",
    prompt: "Who authored the masterpiece novel 'One Hundred Years of Solitude'?",
    answers: [
      { id: "a", label: "Gabriel García Márquez" },
      { id: "b", label: "Jorge Luis Borges" },
      { id: "c", label: "Mario Vargas Llosa" },
      { id: "d", label: "Isabel Allende" },
    ],
    correctAnswerId: "a",
    seconds: 10,
    globalSuccessRate: 64,
  },
];

export const categories = [
  { id: "history", label: "History", icon: "🏛", questions: 4820 },
  { id: "science", label: "Science", icon: "🔬", questions: 5140 },
  { id: "sports", label: "Sports", icon: "🏆", questions: 3980 },
  { id: "cinema", label: "Cinema", icon: "🎬", questions: 4410 },
  { id: "geography", label: "Geography", icon: "🌍", questions: 5320 },
  { id: "music", label: "Music", icon: "🎵", questions: 3670 },
];

export const worldEvent = {
  home: countries.FR,
  away: countries.ES,
  homeShare: 49.7,
  awayShare: 50.3,
  hoursLeft: 4,
};

export const activityFeed = [
  { id: "ac1", text: "Thomas reached Gold II in Ranked 1v1.", time: "12 min" },
  { id: "ac2", text: "Emma scored 12/12 on the Daily 12 challenge.", time: "48 min" },
  { id: "ac3", text: "Lucas92 passed you in 'Les Génies' private league.", time: "2 h" },
  { id: "ac4", text: "Chloé won 6 ranked matches in a row (+48 ELO).", time: "5 h" },
  { id: "ac5", text: "Alexandre defended #1 France national ranking.", time: "1 d" },
];
