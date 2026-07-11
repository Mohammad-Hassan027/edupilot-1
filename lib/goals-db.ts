import { getSupabaseAdmin } from "./supabase-server";
import type { StudyGoal, AchievementDefinition, UserAchievement, UserXp, AchievementWithStatus } from "@/types/goals";

// ─── XP & Leveling Config ────────────────────────────────────────────────────
export const XP_VALUES = {
  ai_chat: 10,
  flashcards: 50,
  study_plan: 100,
  goal_completion: 100,
};

export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / 1000) + 1;
}

// ─── Seed Data for Default Achievements ──────────────────────────────────────
const DEFAULT_ACHIEVEMENTS: Omit<AchievementDefinition, "created_at">[] = [
  {
    id: "first_ai_chat",
    title: "First AI Chat",
    description: "Start your first conversation with the AI Tutor.",
    icon: "MessageSquare",
    category: "ai_chat",
    required_value: 1,
    xp_reward: 100,
  },
  {
    id: "ten_flashcard_sets",
    title: "10 Flashcard Sets",
    description: "Create 10 flashcard sets to aid your study.",
    icon: "Layers",
    category: "flashcards",
    required_value: 10,
    xp_reward: 250,
  },
  {
    id: "five_study_plans",
    title: "5 Study Plans",
    description: "Generate 5 custom study plans.",
    icon: "Calendar",
    category: "study_plan",
    required_value: 5,
    xp_reward: 200,
  },
  {
    id: "seven_day_streak",
    title: "7-Day Learning Streak",
    description: "Maintain a study streak for 7 consecutive days.",
    icon: "Flame",
    category: "streak",
    required_value: 7,
    xp_reward: 350,
  },
  {
    id: "one_hundred_ai_questions",
    title: "100 AI Questions",
    description: "Ask the AI Tutor 100 questions.",
    icon: "Award",
    category: "ai_questions",
    required_value: 100,
    xp_reward: 500,
  },
  {
    id: "goal_setter",
    title: "Goal Setter",
    description: "Create your first study goal.",
    icon: "Target",
    category: "create_goal",
    required_value: 1,
    xp_reward: 50,
  },
  {
    id: "first_goal_completed",
    title: "First Goal Completed",
    description: "Successfully complete your first study goal.",
    icon: "CheckCircle2",
    category: "complete_goal",
    required_value: 1,
    xp_reward: 100,
  },
  {
    id: "twenty_five_goals_completed",
    title: "Complete 25 Goals",
    description: "Successfully complete 25 study goals.",
    icon: "Trophy",
    category: "complete_goal",
    required_value: 25,
    xp_reward: 500,
  },
];

// Helper to guarantee achievements exist in SQL DB
export async function ensureAchievementDefinitions(): Promise<AchievementDefinition[]> {
  const admin = await getSupabaseAdmin();
  
  const { data: existing, error } = await admin
    .from("achievement_definitions")
    .select("*");
    
  if (error) {
    console.error("[ensureAchievementDefinitions] Error fetching definitions:", error.message);
    return [];
  }
  
  if (!existing || existing.length === 0) {
    const payload = DEFAULT_ACHIEVEMENTS.map(item => ({
      ...item,
      created_at: new Date().toISOString(),
    }));
    
    const { data: inserted, error: insertError } = await admin
      .from("achievement_definitions")
      .insert(payload)
      .select("*");
      
    if (insertError) {
      console.error("[ensureAchievementDefinitions] Seeding failed:", insertError.message);
      return [];
    }
    
    return inserted as AchievementDefinition[];
  }
  
  return existing as AchievementDefinition[];
}

// ─── XP Helpers ──────────────────────────────────────────────────────────────
export async function getUserXp(userId: string): Promise<UserXp> {
  const admin = await getSupabaseAdmin();
  
  const { data, error } = await admin
    .from("user_xp")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
    
  if (error) {
    console.error("[getUserXp] Error:", error.message);
  }
  
  if (!data) {
    const defaultXp = {
      user_id: userId,
      total_xp: 0,
      level: 1,
      updated_at: new Date().toISOString(),
    };
    
    const { data: inserted, error: insertError } = await admin
      .from("user_xp")
      .insert(defaultXp)
      .select("*")
      .single();
      
    if (insertError) {
      throw new Error(`Failed to initialize user XP: ${insertError.message}`);
    }
    
    return inserted as UserXp;
  }
  
  return data as UserXp;
}

export async function awardXp(userId: string, amount: number): Promise<{ xp: UserXp; leveledUp: boolean }> {
  const admin = await getSupabaseAdmin();
  const currentXp = await getUserXp(userId);
  
  const total_xp = currentXp.total_xp + amount;
  const level = calculateLevel(total_xp);
  const leveledUp = level > currentXp.level;
  
  const { data, error } = await admin
    .from("user_xp")
    .update({
      total_xp,
      level,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();
    
  if (error) {
    throw new Error(`Failed to update user XP: ${error.message}`);
  }
  
  return {
    xp: data as UserXp,
    leveledUp,
  };
}

// ─── Goal Helpers ────────────────────────────────────────────────────────────
export async function getGoals(userId: string): Promise<StudyGoal[]> {
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("study_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(`Failed to load study goals: ${error.message}`);
  }
  
  return (data || []) as StudyGoal[];
}

export async function createGoal(
  userId: string,
  input: {
    title: string;
    description?: string | null;
    goal_type: "daily" | "weekly" | "monthly";
    target_value: number;
    due_date?: string | null;
  }
): Promise<StudyGoal> {
  const admin = await getSupabaseAdmin();
  const payload = {
    user_id: userId,
    title: input.title,
    description: input.description || null,
    goal_type: input.goal_type,
    target_value: input.target_value,
    current_value: 0,
    status: "pending",
    due_date: input.due_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { data, error } = await admin
    .from("study_goals")
    .insert(payload)
    .select("*")
    .single();
    
  if (error) {
    throw new Error(`Failed to create study goal: ${error.message}`);
  }
  
  return data as StudyGoal;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  updates: Partial<Omit<StudyGoal, "id" | "user_id">>
): Promise<{ goal: StudyGoal; xpAwarded: number; achievementsUnlocked: AchievementDefinition[] }> {
  const admin = await getSupabaseAdmin();
  
  // Load existing goal
  const { data: existing, error: loadError } = await admin
    .from("study_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("id", goalId)
    .maybeSingle();
    
  if (loadError || !existing) {
    throw new Error(`Goal not found or unauthorized: ${loadError?.message || ""}`);
  }
  
  const currentGoal = existing as StudyGoal;
  
  // Calculate completed status
  let newCurrentValue = updates.current_value !== undefined ? updates.current_value : currentGoal.current_value;
  if (newCurrentValue < 0) newCurrentValue = 0;
  
  let newStatus = updates.status || currentGoal.status;
  
  // Auto-complete if progress reaches or exceeds target
  if (newCurrentValue >= currentGoal.target_value && currentGoal.status === "pending") {
    newStatus = "completed";
  }
  
  const dbUpdates = {
    ...updates,
    current_value: newCurrentValue,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  
  const { data: updatedGoal, error: updateError } = await admin
    .from("study_goals")
    .update(dbUpdates)
    .eq("user_id", userId)
    .eq("id", goalId)
    .select("*")
    .single();
    
  if (updateError) {
    throw new Error(`Failed to update study goal: ${updateError.message}`);
  }
  
  let xpAwarded = 0;
  let achievementsUnlocked: AchievementDefinition[] = [];
  
  // Award XP if goal was completed in this action
  if (newStatus === "completed" && currentGoal.status === "pending") {
    xpAwarded = XP_VALUES.goal_completion;
    await awardXp(userId, xpAwarded);
    
    // Check achievements sweep for complete_goal
    const sweepResult = await checkAndUnlockAchievements(userId);
    achievementsUnlocked = sweepResult.newlyUnlocked;
  }
  
  return {
    goal: updatedGoal as StudyGoal,
    xpAwarded,
    achievementsUnlocked,
  };
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const admin = await getSupabaseAdmin();
  const { error } = await admin
    .from("study_goals")
    .delete()
    .eq("user_id", userId)
    .eq("id", goalId);
    
  if (error) {
    throw new Error(`Failed to delete study goal: ${error.message}`);
  }
}

// ─── Streak Calculator ────────────────────────────────────────────────────────
function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDayKey(value: string | Date) {
  return new Date(value).toISOString().split("T")[0];
}

async function calculateCurrentStreak(userId: string, admin: any): Promise<number> {
  const [
    { data: logs },
    { data: sessions },
    { data: savedNotes },
    { data: quizAttempts },
  ] = await Promise.all([
    admin.from("usage_logs").select("created_at").eq("user_id", userId),
    admin.from("user_activity_sessions").select("started_at").eq("user_id", userId),
    admin.from("saved_notes").select("created_at").eq("user_id", userId),
    admin.from("saved_quiz_attempts").select("created_at").eq("user_id", userId),
  ]);
  
  const activityDates = [
    ...(sessions || []).map((s: any) => toDayKey(s.started_at)),
    ...(logs || []).map((l: any) => toDayKey(l.created_at)),
    ...(savedNotes || []).map((n: any) => toDayKey(n.created_at)),
    ...(quizAttempts || []).map((q: any) => toDayKey(q.created_at)),
  ];
  
  const uniqueDays = [...new Set(activityDates)].sort().reverse();
  if (uniqueDays.length === 0) return 0;
  
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let currentStreak = 0;
  const firstDay = uniqueDays[0];
  
  if (firstDay === toDayKey(today) || firstDay === toDayKey(yesterday)) {
    currentStreak = 1;
    let previousDate = new Date(firstDay);
    
    for (let i = 1; i < uniqueDays.length; i++) {
      const currentDate = new Date(uniqueDays[i]);
      const diffDays = (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak++;
        previousDate = currentDate;
      } else {
        break;
      }
    }
  }
  
  return currentStreak;
}

// ─── Achievement Sync Engine ──────────────────────────────────────────────────
export async function checkAndUnlockAchievements(userId: string): Promise<{ newlyUnlocked: AchievementDefinition[] }> {
  const admin = await getSupabaseAdmin();
  
  // 1. Resolve counts/aggregates
  const [
    { count: aiChatCount },
    { count: flashcardCount },
    { count: studyPlanCount },
    { count: goalCount },
    { count: completedGoalCount },
    streakCount,
  ] = await Promise.all([
    admin.from("chat_messages").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user"),
    admin.from("saved_flashcard_sets").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("saved_study_plans").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("study_goals").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("study_goals").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
    calculateCurrentStreak(userId, admin),
  ]);
  
  const metrics: Record<string, number> = {
    ai_chat: aiChatCount || 0,
    ai_questions: aiChatCount || 0,
    flashcards: flashcardCount || 0,
    study_plan: studyPlanCount || 0,
    create_goal: goalCount || 0,
    complete_goal: completedGoalCount || 0,
    streak: streakCount || 0,
  };
  
  // 2. Fetch definition and earned statuses
  const definitions = await ensureAchievementDefinitions();
  const { data: earnedList, error: earnedError } = await admin
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);
    
  if (earnedError) {
    console.error("[checkAndUnlockAchievements] Error fetching earned list:", earnedError.message);
    return { newlyUnlocked: [] };
  }
  
  const earnedIds = new Set((earnedList || []).map((ea: any) => ea.achievement_id));
  const newlyUnlocked: AchievementDefinition[] = [];
  
  // 3. Evaluate criteria
  for (const def of definitions) {
    if (earnedIds.has(def.id)) continue;
    
    const currentProgress = metrics[def.category] ?? 0;
    if (currentProgress >= def.required_value) {
      // Unlock!
      const { error: unlockError } = await admin
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: def.id,
          earned_at: new Date().toISOString(),
        })
        .select("*");
        
      if (unlockError) {
        // Safe to ignore if it is a unique constraint race condition
        console.warn("[checkAndUnlockAchievements] Failed to insert badge, skipping XP:", unlockError.message);
        continue;
      }
      
      // Award XP
      await awardXp(userId, def.xp_reward);
      newlyUnlocked.push(def);
    }
  }
  
  return { newlyUnlocked };
}

// Fetch all achievements with detailed progress data
export async function getAchievementsWithStatus(userId: string): Promise<AchievementWithStatus[]> {
  const admin = await getSupabaseAdmin();
  const definitions = await ensureAchievementDefinitions();
  
  // Resolve metrics counts
  const [
    { count: aiChatCount },
    { count: flashcardCount },
    { count: studyPlanCount },
    { count: goalCount },
    { count: completedGoalCount },
    streakCount,
    { data: earnedList },
  ] = await Promise.all([
    admin.from("chat_messages").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user"),
    admin.from("saved_flashcard_sets").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("saved_study_plans").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("study_goals").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("study_goals").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
    calculateCurrentStreak(userId, admin),
    admin.from("user_achievements").select("achievement_id, earned_at").eq("user_id", userId),
  ]);
  
  const metrics: Record<string, number> = {
    ai_chat: aiChatCount || 0,
    ai_questions: aiChatCount || 0,
    flashcards: flashcardCount || 0,
    study_plan: studyPlanCount || 0,
    create_goal: goalCount || 0,
    complete_goal: completedGoalCount || 0,
    streak: streakCount || 0,
  };
  
  const earnedMap = new Map<string, string>();
  for (const item of earnedList || []) {
    earnedMap.set(item.achievement_id, item.earned_at);
  }
  
  return definitions.map((def) => {
    const earned_at = earnedMap.get(def.id) || null;
    const progressVal = metrics[def.category] ?? 0;
    
    return {
      ...def,
      earned: earned_at !== null,
      earned_at,
      current_value: Math.min(progressVal, def.required_value),
    };
  });
}
