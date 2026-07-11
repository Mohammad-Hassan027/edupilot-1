import React, { useEffect, useState } from "react";
import type { StudyGoal } from "@/types/goals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string | null;
    goal_type: "daily" | "weekly" | "monthly";
    target_value: number;
    due_date: string | null;
  }) => Promise<void>;
  goalToEdit: StudyGoal | null;
}

export function GoalForm({ isOpen, onClose, onSubmit, goalToEdit }: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [targetValue, setTargetValue] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default due dates based on goal type
  const getDefaultDueDate = (type: "daily" | "weekly" | "monthly") => {
    const d = new Date();
    if (type === "daily") {
      d.setHours(23, 59, 59, 999);
    } else if (type === "weekly") {
      // End of current week (e.g. Sunday)
      const day = d.getDay();
      const diff = d.getDate() + (7 - day);
      d.setDate(diff);
      d.setHours(23, 59, 59, 999);
    } else if (type === "monthly") {
      // Last day of month
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      d.setDate(lastDay.getDate());
      d.setHours(23, 59, 59, 999);
    }
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setTitle(goalToEdit.title);
        setDescription(goalToEdit.description || "");
        setGoalType(goalToEdit.goal_type);
        setTargetValue(goalToEdit.target_value);
        setDueDate(goalToEdit.due_date ? new Date(goalToEdit.due_date).toISOString().split("T")[0] : "");
      } else {
        setTitle("");
        setDescription("");
        setGoalType("daily");
        setTargetValue(1);
        setDueDate(getDefaultDueDate("daily"));
      }
      setError(null);
    }
  }, [isOpen, goalToEdit]);

  const handleGoalTypeChange = (value: "daily" | "weekly" | "monthly") => {
    setGoalType(value);
    // If not editing, set corresponding default due date
    if (!goalToEdit) {
      setDueDate(getDefaultDueDate(value));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (targetValue < 1) {
      setError("Target value must be at least 1");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let formattedDueDate = null;
      if (dueDate) {
        const d = new Date(dueDate);
        d.setHours(23, 59, 59, 999);
        formattedDueDate = d.toISOString();
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        goal_type: goalType,
        target_value: targetValue,
        due_date: formattedDueDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {goalToEdit ? "Edit Study Goal" : "Create Study Goal"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set study targets for your study tracker.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-2 text-xs font-semibold text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-foreground font-semibold">
              Goal Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study Chemistry Chapter 3"
              disabled={submitting}
              className="bg-secondary/40 border-border text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-foreground font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or sub-tasks..."
              disabled={submitting}
              rows={2}
              className="bg-secondary/40 border-border text-foreground resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="goal-type" className="text-foreground font-semibold">
                Goal Type
              </Label>
              <Select
                value={goalType}
                onValueChange={(val: any) => handleGoalTypeChange(val)}
                disabled={submitting}
              >
                <SelectTrigger id="goal-type" className="bg-secondary/40 border-border text-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target-value" className="text-foreground font-semibold">
                Target Sessions
              </Label>
              <Input
                id="target-value"
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value) || 1)}
                disabled={submitting}
                className="bg-secondary/40 border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due-date" className="text-foreground font-semibold">
              Target Completion Date
            </Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting}
              className="bg-secondary/40 border-border text-foreground"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
              className="text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : goalToEdit ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
