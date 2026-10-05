import React, { useState, useEffect } from "react";
import { Target, Plus, Pencil, Trash2, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import GoalDialog from "@/components/goals/GoalDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const loadData = async () => {
    const [g, m] = await Promise.all([
      base44.entities.Goal.list("-updated_date", 100),
      base44.entities.FamilyMember.list(),
    ]);
    setGoals(g);
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const memberName = (id) => members.find((m) => m.id === id)?.name || "";

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.Goal.update(editing.id, data);
    } else {
      await base44.entities.Goal.create(data);
    }
    loadData();
  };

  const handleDelete = async () => {
    await base44.entities.Goal.delete(deleteId);
    setDeleteId(null);
    loadData();
  };

  const handleContribute = async () => {
    const amount = parseFloat(contributeAmount) || 0;
    const newAmount = (contributeGoal.current_amount || 0) + amount;
    const updateData = { current_amount: newAmount };
    if (newAmount >= contributeGoal.target_amount) {
      updateData.status = "concluido";
    }
    await base44.entities.Goal.update(contributeGoal.id, updateData);
    setContributeGoal(null);
    setContributeAmount("");
    loadData();
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
  }

  const active = goals.filter((g) => g.status === "ativo");
  const completed = goals.filter((g) => g.status === "concluido");
  const paused = goals.filter((g) => g.status === "pausado");

  const renderGoal = (g) => {
    const pct = Math.min(100, ((g.current_amount || 0) / (g.target_amount || 1)) * 100);
    const isDone = g.status === "concluido" || pct >= 100;
    return (
      <Card key={g.id} className="group p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDone ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-accent text-accent-foreground"}`}>
              {isDone ? <Trophy className="h-5 w-5" /> : <Target className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold">{g.title}</h3>
              <p className="text-xs text-muted-foreground">
                {memberName(g.family_member_id) ? `${memberName(g.family_member_id)} · ` : ""}
                {g.deadline ? `Prazo: ${formatDate(g.deadline)}` : "Sem prazo"}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(g); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(g.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Progress value={pct} className="h-2.5" />
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{formatCurrency(g.current_amount || 0)}</span>
            <span className="text-muted-foreground">{formatCurrency(g.target_amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant={isDone ? "default" : "secondary"} className="text-xs">{pct.toFixed(0)}% concluído</Badge>
            {!isDone && g.status === "ativo" && (
              <Button variant="outline" size="sm" onClick={() => { setContributeGoal(g); setContributeAmount(""); }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Aportar
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Metas</h1>
          <p className="text-muted-foreground">{active.length} ativas · {completed.length} concluídas</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhuma meta criada</p>
            <p className="text-sm text-muted-foreground">Defina objetivos financeiros para sua família</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Criar Meta</Button>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ativas</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{active.map(renderGoal)}</div>
            </div>
          )}
          {paused.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pausadas</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{paused.map(renderGoal)}</div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Concluídas</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{completed.map(renderGoal)}</div>
            </div>
          )}
        </>
      )}

      <GoalDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} goal={editing} members={members} />

      <Dialog open={!!contributeGoal} onOpenChange={(v) => !v && setContributeGoal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Aportar na Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{contributeGoal?.title}</p>
              <p className="text-xs text-muted-foreground">Atual: {formatCurrency(contributeGoal?.current_amount || 0)} / {formatCurrency(contributeGoal?.target_amount)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Aporte (R$)</Label>
              <Input id="amount" type="number" step="0.01" min="0" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} placeholder="0,00" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributeGoal(null)}>Cancelar</Button>
            <Button onClick={handleContribute}>Aportar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
