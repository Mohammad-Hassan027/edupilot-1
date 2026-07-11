export type GoalType = "daily" | "weekly" | "monthly";
export type GoalStatus = "pending" | "completed";

export interface StudyGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  status: GoalStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  required_value: number;
  xp_reward: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface UserXp {
  user_id: string;
  total_xp: number;
  level: number;
  updated_at: string;
}

export interface AchievementWithStatus extends AchievementDefinition {
  earned: boolean;
  earned_at: string | null;
  current_value: number;
}

export interface GoalsDashboardData {
  goals: StudyGoal[];
  achievements: AchievementWithStatus[];
  xp: UserXp;
  stats: {
    activeGoals: number;
    completedGoals: number;
    totalXp: number;
    level: number;
    totalAchievements: number;
    unlockedAchievements: number;
  };
}
