import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import TransactionDialog from "@/components/transactions/TransactionDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const [t, m] = await Promise.all([
      base44.entities.Transaction.list("-date", 500),
      base44.entities.FamilyMember.list(),
    ]);
    setTransactions(t);
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const memberName = (id) => members.find((m) => m.id === id)?.name || "";

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterMember !== "all") {
        if (filterMember === "none" && t.family_member_id) return false;
        if (filterMember !== "none" && t.family_member_id !== filterMember) return false;
      }
      if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterType, filterCategory, filterMember, search]);

  const totalIncome = filtered.filter((t) => t.type === "receita").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = filtered.filter((t) => t.type === "despesa").reduce((s, t) => s + (t.amount || 0), 0);

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.Transaction.update(editing.id, data);
    } else {
      await base44.entities.Transaction.create(data);
    }
    loadData();
  };

  const handleDelete = async () => {
    await base44.entities.Transaction.delete(deleteId);
    setDeleteId(null);
    loadData();
  };

  const categories = ["Mesada", "Educação", "Saúde", "Alimentação", "Transporte", "Lazer", "Vestuário", "Moradia", "Investimento", "Emergência", "Outro"];

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Transações</h1>
          <p className="text-muted-foreground">{filtered.length} registros</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Transação
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Receitas (filtradas)</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Despesas (filtradas)</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</p>
        </Card>
        <Card className="p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="text-xl font-bold">{formatCurrency(totalIncome - totalExpense)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMember} onValueChange={setFilterMember}>
            <SelectTrigger><SelectValue placeholder="Membro" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os membros</SelectItem>
              <SelectItem value="none">Sem membro</SelectItem>
              {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">Nenhuma transação encontrada</Card>
        ) : (
          filtered.map((t) => (
            <Card key={t.id} className="group flex items-center justify-between p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${getCategoryColor(t.category)}20` }}>
                  {t.type === "receita" ? <ArrowUpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.title}</p>
                    {t.recurring && <Badge variant="outline" className="text-xs">Recorrente</Badge>}
                    {t.status === "pendente" && <Badge variant="outline" className="text-xs text-amber-600">Pendente</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(t.date)} · {t.category} · {t.payment_method}
                    {memberName(t.family_member_id) && ` · ${memberName(t.family_member_id)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={t.type === "receita" ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-red-600 dark:text-red-400"}>
                  {t.type === "receita" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(t); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <TransactionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} transaction={editing} members={members} />
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
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
