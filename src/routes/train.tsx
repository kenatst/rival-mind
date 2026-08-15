import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Button, Panel, Modal, Tabs } from "@/components/kit/primitives";
import {
  BookOpen,
  Film,
  Globe,
  Atom,
  Trophy,
  Music,
  Book,
  Palette,
  TreePine,
  Cpu,
  Utensils,
  Gamepad2,
  Landmark,
  Target,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Search,
  Sliders,
  Play,
  ArrowRight,
  TrendingUp,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playCue } from "@/lib/game";

export const Route = createFileRoute("/train")({
  head: () => ({
    meta: [
      { title: "Hardcore Training Hub — IQ ARENA" },
      { name: "description", content: "Master your knowledge across 1,000,000 canonical concepts. Topic deep dives, 100-question marathons, and spaced review." },
    ],
  }),
  component: TrainingHubScreen,
});

interface CategoryDomain {
  id: string;
  name: string;
  count: string;
  masteryPct: number;
  masteredCount: number;
  weakTopic: string;
  strongTopic: string;
  icon: any;
  color: string;
}

const DOMAINS: CategoryDomain[] = [
  { id: "cinema", name: "Cinema & Audiovisual", count: "90,000 concepts", masteryPct: 42, masteredCount: 3840, weakTopic: "French New Wave", strongTopic: "Sci-Fi Classics", icon: Film, color: "text-amber-400" },
  { id: "history", name: "World History & Battles", count: "110,000 concepts", masteryPct: 58, masteredCount: 6420, weakTopic: "Ancient Rome", strongTopic: "World War II", icon: Landmark, color: "text-rose-400" },
  { id: "science", name: "Science & Physics", count: "110,000 concepts", masteryPct: 64, masteredCount: 7120, weakTopic: "Organic Chemistry", strongTopic: "Astronomy", icon: Atom, color: "text-cyan-400" },
  { id: "geography", name: "Geography & Earth", count: "110,000 concepts", masteryPct: 71, masteredCount: 7920, weakTopic: "African Capitals", strongTopic: "European Borders", icon: Globe, color: "text-emerald-400" },
  { id: "sports", name: "Sports & Competitions", count: "90,000 concepts", masteryPct: 35, masteredCount: 3150, weakTopic: "Grand Slam Tennis", strongTopic: "Football World Cup", icon: Trophy, color: "text-gold" },
  { id: "music", name: "Music & Composers", count: "80,000 concepts", masteryPct: 29, masteredCount: 2320, weakTopic: "Baroque Opera", strongTopic: "Rock History", icon: Music, color: "text-purple-400" },
  { id: "literature", name: "Literature & Philosophy", count: "80,000 concepts", masteryPct: 45, masteredCount: 3600, weakTopic: "Russian Classics", strongTopic: "French 19th Century", icon: Book, color: "text-blue-400" },
  { id: "art", name: "Art & Architecture", count: "65,000 concepts", masteryPct: 38, masteredCount: 2470, weakTopic: "Renaissance Sculptors", strongTopic: "Impressionism", icon: Palette, color: "text-pink-400" },
  { id: "nature", name: "Nature & Biology", count: "70,000 concepts", masteryPct: 52, masteredCount: 3640, weakTopic: "Marine Ecosystems", strongTopic: "Mammal Species", icon: TreePine, color: "text-green-400" },
  { id: "technology", name: "Technology & Computing", count: "65,000 concepts", masteryPct: 68, masteredCount: 4420, weakTopic: "Early Microprocessors", strongTopic: "Programming Languages", icon: Cpu, color: "text-teal-400" },
  { id: "food", name: "Food & World Culture", count: "55,000 concepts", masteryPct: 61, masteredCount: 3350, weakTopic: "AOC Cheeses", strongTopic: "World Gastronomy", icon: Utensils, color: "text-orange-400" },
  { id: "gaming", name: "Gaming & Pop Culture", count: "45,000 concepts", masteryPct: 77, masteredCount: 3465, weakTopic: "Retro 80s Arcade", strongTopic: "Iconic RPGs", icon: Gamepad2, color: "text-indigo-400" },
];

function TrainingHubScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryDomain | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = React.useState(false);

  // Custom Training Builder Form State
  const [customQuestionCount, setCustomQuestionCount] = React.useState(25);
  const [customDifficulties, setCustomDifficulties] = React.useState<string[]>(["medium", "hard"]);
  const [customFormat, setCustomFormat] = React.useState<"mcq" | "free_text">("mcq");
  const [customTimed, setCustomTimed] = React.useState(true);

  // Active Training Session State
  const [activeSession, setActiveSession] = React.useState<any | null>(null);
  const [currentQIndex, setCurrentQIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = React.useState(false);
  const [sessionScore, setSessionScore] = React.useState(0);
  const [sessionMistakes, setSessionMistakes] = React.useState<any[]>([]);

  const filteredDomains = DOMAINS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.weakTopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.strongTopic.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const startTrainingSession = (category: CategoryDomain, mode: string, count: number = 10) => {
    playCue("select");
    const mockQuestions = Array.from({ length: count }, (_, i) => ({
      id: `q-${category.id}-${i + 1}`,
      prompt: `Dans le domaine de ${category.name}, quelle œuvre majeure a marqué l'année ${1950 + i * 5} ?`,
      options: [
        { id: "1", label: `Option Canonique ${i + 1}`, isCorrect: true },
        { id: "2", label: `Distracteur A ${i + 1}`, isCorrect: false },
        { id: "3", label: `Distracteur B ${i + 1}`, isCorrect: false },
        { id: "4", label: `Distracteur C ${i + 1}`, isCorrect: false },
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: `Option Canonique ${i + 1}`,
      explanation: `Fait encyclopédique vérifié dans le graphe de connaissances ${category.name}.`,
      difficulty: i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard",
      topic: category.weakTopic,
    }));

    setActiveSession({
      category,
      mode,
      questions: mockQuestions,
      totalCount: count,
    });
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setSessionScore(0);
    setSessionMistakes([]);
  };

  const handleSelectAnswer = (option: any) => {
    if (isAnswerRevealed) return;
    setSelectedOption(option.id);
    setIsAnswerRevealed(true);

    if (option.isCorrect) {
      playCue("correct");
      setSessionScore((s) => s + 1);
    } else {
      playCue("wrong");
      const currentQ = activeSession.questions[currentQIndex];
      setSessionMistakes((m) => [...m, currentQ]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < activeSession.questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      // Complete Session
      playCue("victory");
      setActiveSession({ ...activeSession, isCompleted: true });
    }
  };

  return (
    <div className="stage min-h-screen bg-background px-4 py-8 select-none">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Active Session Overlay Modal/Screen */}
        {activeSession && !activeSession.isCompleted && (
          <Panel glow className="p-6 border-primary/40 bg-surface space-y-5 shadow-2xl animate-rise">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <activeSession.category.icon size={20} className={activeSession.category.color} />
                <span className="font-black text-sm uppercase tracking-wider">{activeSession.category.name}</span>
                <span className="label-xs px-2 py-0.5 rounded bg-surface-2 border border-border font-bold">
                  {activeSession.mode.toUpperCase()}
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-muted-foreground">
                Question {currentQIndex + 1} / {activeSession.totalCount}
              </div>
            </div>

            {/* Question Card */}
            <div className="space-y-4">
              <div className="label-xs text-primary font-bold flex items-center gap-1.5">
                <Target size={13} /> Thème : {activeSession.questions[currentQIndex].topic}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground leading-snug">
                {activeSession.questions[currentQIndex].prompt}
              </h2>

              {/* MCQ Options */}
              <div className="grid sm:grid-cols-2 gap-2.5 pt-2">
                {activeSession.questions[currentQIndex].options.map((opt: any) => {
                  const isChosen = selectedOption === opt.id;
                  const isCorrect = opt.isCorrect;

                  let style = "bg-surface-2 border-border text-foreground hover:border-primary/40";
                  if (isAnswerRevealed) {
                    if (isCorrect) style = "bg-primary/20 border-primary text-primary font-bold";
                    else if (isChosen) style = "bg-rose-500/20 border-rose-500 text-rose-400 font-bold";
                    else style = "opacity-40 border-border text-muted-foreground";
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAnswer(opt)}
                      disabled={isAnswerRevealed}
                      className={cn("p-4 rounded-2xl border text-left text-sm font-medium transition-all", style)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {isAnswerRevealed && isCorrect && <CheckCircle2 size={18} className="text-primary" />}
                        {isAnswerRevealed && isChosen && !isCorrect && <XCircle size={18} className="text-rose-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Banner */}
              {isAnswerRevealed && (
                <div className="p-3.5 rounded-2xl bg-surface-2 border border-border text-xs text-muted-foreground space-y-2 animate-fadeIn">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-gold" /> Explication du concept :
                  </div>
                  <p>{activeSession.questions[currentQIndex].explanation}</p>

                  <div className="pt-2 flex justify-end">
                    <Button size="sm" variant="primary" onClick={handleNextQuestion} className="font-bold">
                      {currentQIndex < activeSession.totalCount - 1 ? "Question Suivante →" : "Voir mon Bilan"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Completed Session Summary */}
        {activeSession && activeSession.isCompleted && (
          <Panel glow className="p-6 border-primary/40 bg-surface space-y-6 shadow-2xl text-center">
            <Award size={44} className="mx-auto text-gold animate-bounce" />
            <div>
              <h2 className="display text-3xl font-black">SESSION D'ENTRAÎNEMENT TERMINÉE</h2>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {activeSession.category.name} · Score : {sessionScore} / {activeSession.totalCount} (
                {Math.round((sessionScore / activeSession.totalCount) * 100)}%)
              </p>
            </div>

            {sessionMistakes.length > 0 && (
              <div className="p-4 rounded-2xl bg-surface-2 border border-border text-left space-y-2">
                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <XCircle size={14} /> {sessionMistakes.length} Erreur(s) à réviser :
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {sessionMistakes.map((m, idx) => (
                    <div key={idx} className="truncate">
                      • <strong>{m.prompt}</strong> → Bonne réponse : <em>{m.correctAnswer}</em>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="primary" onClick={() => startTrainingSession(activeSession.category, "quick", 10)}>
                <RotateCcw size={16} /> Recommencer 10 Questions
              </Button>
              <Button size="lg" variant="surface" onClick={() => setActiveSession(null)}>
                Retour au Hub d'Entraînement
              </Button>
            </div>
          </Panel>
        )}

        {/* Training Hub Main Screen */}
        {!activeSession && (
          <>
            {/* 1. Header Banner */}
            <Panel glow className="p-6 border-primary/40 bg-surface space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="label-xs text-primary font-black uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={14} /> THE COMPETITIVE KNOWLEDGE GRAPH · 1,000,000 CONCEPTS
                  </div>
                  <h1 className="display text-2xl sm:text-4xl font-black mt-1">MASTER YOUR KNOWLEDGE</h1>
                  <p className="text-xs text-muted-foreground mt-1 font-medium max-w-xl">
                    Entraînez-vous sur les 12 domaines sacrés de la culture générale. Répétition espacée, marathons de 100 questions et recall sans choix.
                  </p>
                </div>

                <Button size="lg" variant="prestige" onClick={() => setIsCustomModalOpen(true)} className="font-bold shrink-0">
                  <Sliders size={16} /> Custom Training Builder
                </Button>
              </div>

              {/* Quick Launch Marathons & Modes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <button
                  onClick={() => startTrainingSession(DOMAINS[0]!, "marathon", 100)}
                  className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-primary text-left transition-all group"
                >
                  <div className="text-[10px] font-mono text-muted-foreground font-bold flex items-center gap-1">
                    <Zap size={11} className="text-gold" /> TRYHARD MARATHON
                  </div>
                  <div className="text-sm font-black text-foreground mt-1 group-hover:text-primary transition-colors">
                    100 Questions Run
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Test d'endurance cognitive</div>
                </button>

                <button
                  onClick={() => startTrainingSession(DOMAINS[1]!, "mistakes", 15)}
                  className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-primary text-left transition-all group"
                >
                  <div className="text-[10px] font-mono text-muted-foreground font-bold flex items-center gap-1">
                    <RotateCcw size={11} className="text-rose-400" /> SPACED REVIEW
                  </div>
                  <div className="text-sm font-black text-foreground mt-1 group-hover:text-primary transition-colors">
                    Mistakes Due
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Concepts à consolider</div>
                </button>

                <button
                  onClick={() => startTrainingSession(DOMAINS[2]!, "free_answer", 20)}
                  className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-primary text-left transition-all group"
                >
                  <div className="text-[10px] font-mono text-muted-foreground font-bold flex items-center gap-1">
                    <Flame size={11} className="text-amber-400" /> RECALL PUR
                  </div>
                  <div className="text-sm font-black text-foreground mt-1 group-hover:text-primary transition-colors">
                    Free Answer Drills
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Sans options, mémoire pure</div>
                </button>

                <button
                  onClick={() => startTrainingSession(DOMAINS[3]!, "unseen", 25)}
                  className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-primary text-left transition-all group"
                >
                  <div className="text-[10px] font-mono text-muted-foreground font-bold flex items-center gap-1">
                    <Sparkles size={11} className="text-cyan-400" /> EXPLORATION
                  </div>
                  <div className="text-sm font-black text-foreground mt-1 group-hover:text-primary transition-colors">
                    Unseen Only
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">100% nouvelles questions</div>
                </button>
              </div>
            </Panel>

            {/* 2. Search & Filter Bar */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search topics (e.g. Cinema, Ancient Rome, Chemistry, Napoleon, Mozart, Astronomy...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60 shadow-sm"
              />
            </div>

            {/* 3. 12 Sacred Domains Category Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDomains.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Panel
                    key={cat.id}
                    className="p-4 sm:p-5 border-border bg-surface hover:border-primary/40 transition-all space-y-3 cursor-pointer group shadow-sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("p-2 rounded-xl bg-surface-2 border border-border", cat.color)}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                            {cat.name}
                          </h3>
                          <div className="text-[11px] font-mono text-muted-foreground font-medium">{cat.count}</div>
                        </div>
                      </div>

                      <span className="text-sm font-black text-primary">{cat.masteryPct}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${cat.masteryPct}%` }} />
                    </div>

                    {/* Weak & Strong Topics */}
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 font-mono">
                      <span>Point faible : <strong className="text-rose-400">{cat.weakTopic}</strong></span>
                      <span>Maîtrisés : <strong className="text-foreground">{cat.masteredCount.toLocaleString()}</strong></span>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">
                        Lancer l'entraînement
                      </span>
                      <Button size="sm" variant="surface" className="font-bold text-xs">
                        <Play size={12} /> S'entraîner
                      </Button>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Category Deep Drill Modal */}
      {selectedCategory && (
        <Modal
          title={`Entraînement : ${selectedCategory.name}`}
          isOpen={Boolean(selectedCategory)}
          onClose={() => setSelectedCategory(null)}
        >
          <div className="space-y-4 select-none">
            <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Volume disponible</span>
                <span className="font-mono font-bold text-foreground">{selectedCategory.count}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Maîtrise actuelle</span>
                <span className="font-mono font-bold text-primary">{selectedCategory.masteryPct}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Point faible identifié</span>
                <span className="font-mono font-bold text-rose-400">{selectedCategory.weakTopic}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button size="lg" full variant="primary" onClick={() => startTrainingSession(selectedCategory, "quick", 10)} className="font-bold">
                <Zap size={16} /> Entraînement Rapide (10 Questions)
              </Button>
              <Button size="lg" full variant="surface" onClick={() => startTrainingSession(selectedCategory, "standard", 25)} className="font-bold">
                <BookOpen size={16} /> Session Standard (25 Questions)
              </Button>
              <Button size="lg" full variant="surface" onClick={() => startTrainingSession(selectedCategory, "marathon", 50)} className="font-bold">
                <Trophy size={16} /> Deep Dive (50 Questions)
              </Button>
              <Button size="lg" full variant="prestige" onClick={() => startTrainingSession(selectedCategory, "free_answer", 20)} className="font-bold">
                <Flame size={16} /> Free Answer Recall (20 Questions)
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Custom Training Builder Modal (Part 35) */}
      {isCustomModalOpen && (
        <Modal title="Custom Training Builder" isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)}>
          <div className="space-y-4 select-none text-xs">
            <div>
              <label className="label-xs text-muted-foreground font-bold block mb-1.5">Nombre de questions ({customQuestionCount})</label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={customQuestionCount}
                onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-1">
                <span>10 Qs</span>
                <span>50 Qs</span>
                <span>100 Qs Marathon</span>
              </div>
            </div>

            <div>
              <label className="label-xs text-muted-foreground font-bold block mb-1.5">Format de réponse</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCustomFormat("mcq")}
                  className={cn(
                    "p-2.5 rounded-xl border font-bold text-center transition-all",
                    customFormat === "mcq" ? "bg-primary text-black border-primary" : "border-border text-muted-foreground",
                  )}
                >
                  QCM 4 Choix
                </button>
                <button
                  onClick={() => setCustomFormat("free_text")}
                  className={cn(
                    "p-2.5 rounded-xl border font-bold text-center transition-all",
                    customFormat === "free_text" ? "bg-primary text-black border-primary" : "border-border text-muted-foreground",
                  )}
                >
                  Free Answer (Recall)
                </button>
              </div>
            </div>

            <div>
              <label className="label-xs text-muted-foreground font-bold block mb-1.5">Chronomètre</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCustomTimed(true)}
                  className={cn(
                    "p-2.5 rounded-xl border font-bold text-center transition-all",
                    customTimed ? "bg-primary text-black border-primary" : "border-border text-muted-foreground",
                  )}
                >
                  Chronométré (Compétitif)
                </button>
                <button
                  onClick={() => setCustomTimed(false)}
                  className={cn(
                    "p-2.5 rounded-xl border font-bold text-center transition-all",
                    !customTimed ? "bg-primary text-black border-primary" : "border-border text-muted-foreground",
                  )}
                >
                  Sans Chrono (Zen Study)
                </button>
              </div>
            </div>

            <Button
              size="xl"
              full
              variant="primary"
              onClick={() => {
                setIsCustomModalOpen(false);
                startTrainingSession(DOMAINS[0]!, "custom", customQuestionCount);
              }}
              className="font-black text-sm"
            >
              <Play size={16} /> Lancer la Session ({customQuestionCount} Questions)
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
