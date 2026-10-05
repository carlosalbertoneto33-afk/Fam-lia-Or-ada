import React, { useState, useEffect } from "react";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, calculateAge } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import FamilyMemberDialog from "@/components/family/FamilyMemberDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FamilyMembers() {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const loadData = async () => {
    const [m, t] = await Promise.all([
      base44.entities.FamilyMember.list(),
      base44.entities.Transaction.list("-date", 500),
    ]);
    setMembers(m);
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const now = new Date();
  const cm = now.getMonth();
  const cy = now.getFullYear();

  const getMemberSpent = (memberId) => {
    return transactions
      .filter((t) => t.family_member_id === memberId && t.type === "despesa")
      .filter((t) => {
        const d = new Date(t.date + "T00:00:00");
        return d.getMonth() === cm && d.getFullYear() === cy;
      })
      .reduce((s, t) => s + (t.amount || 0), 0);
  };

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.FamilyMember.update(editing.id, data);
    } else {
      await base44.entities.FamilyMember.create(data);
    }
    loadData();
  };

  const handleDelete = async () => {
    await base44.entities.FamilyMember.delete(deleteId);
    setDeleteId(null);
    loadData();
  };

  const initials = (name) => name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Família</h1>
          <p className="text-muted-foreground">{members.length} membros cadastrados</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Membro
        </Button>
      </div>

      {members.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum membro cadastrado</p>
            <p className="text-sm text-muted-foreground">Adicione membros da família para começar a organizar o auxílio</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Adicionar Membro</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const spent = getMemberSpent(m.id);
            const pct = m.monthly_allowance > 0 ? Math.min(100, (spent / m.monthly_allowance) * 100) : 0;
            return (
              <Card key={m.id} className="group p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      {m.photo_url ? <img src={m.photo_url} alt={m.name} className="h-full w-full rounded-full object-cover" /> : null}
                      <AvatarFallback className="bg-accent text-accent-foreground font-semibold">{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{m.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{m.relationship}</Badge>
                        {m.birth_date && <span className="text-xs text-muted-foreground">{calculateAge(m.birth_date)} anos</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(m); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mesada</span>
                    <span className="font-semibold">{formatCurrency(m.monthly_allowance)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gasto neste mês</span>
                    <span className={spent > m.monthly_allowance ? "font-semibold text-red-600 dark:text-red-400" : "font-semibold"}>
                      {formatCurrency(spent)}
                    </span>
                  </div>
                  {m.monthly_allowance > 0 && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={pct > 100 ? "h-full bg-red-500" : "h-full bg-primary"}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  )}
                  {m.status === "inativo" && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FamilyMemberDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} member={editing} />
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. As transações vinculadas permanecerão.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
