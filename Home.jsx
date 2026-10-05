import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, TrendingUp, TrendingDown, Users, Target, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/StatCard";
import { formatCurrency, formatDate, getCategoryColor, monthNames } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, m, g] = await Promise.all([
          base44.entities.Transaction.list("-date", 200),
          base44.entities.FamilyMember.list(),
          base44.entities.Goal.list("-updated_date", 20),
        ]);
        setTransactions(t);
        setMembers(m);
        setGoals(g);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = useMemo(() => {
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const income = monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + (t.amount || 0), 0);
    const expense = monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + (t.amount || 0), 0);
    const allowance = members.filter((m) => m.status === "ativo").reduce((s, m) => s + (m.monthly_allowance || 0), 0);
    return { income, expense, balance: income - expense, allowance };
  }, [transactions, members, currentMonth, currentYear]);

  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const label = monthNames[d.getMonth()].slice(0, 3);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthTx = transactions.filter((t) => {
        const td = new Date(t.date + "T00:00:00");
        return td.getMonth() === month && td.getFullYear() === year;
      });
      months.push({
        name: label,
        Receitas: monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + (t.amount || 0), 0),
        Despesas: monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + (t.amount || 0), 0),
      });
    }
    return months;
  }, [transactions, currentMonth, currentYear]);

  const categoryData = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => {
        const d = new Date(t.date + "T00:00:00");
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === "despesa";
      })
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + (t.amount || 0);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions, currentMonth, currentYear]);

  const recentTx = transactions.slice(0, 5);
  const activeGoals = goals.filter((g) => g.status === "ativo").slice(0, 3);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Painel</h1>
        <p className="text-muted-foreground">{monthNames[currentMonth]} {currentYear}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Saldo do Mês" value={formatCurrency(stats.balance)} variant={stats.balance >= 0 ? "positive" : "negative"} sublabel="Receitas - Despesas" />
        <StatCard icon={TrendingUp} label="Receitas" value={formatCurrency(stats.income)} variant="positive" />
        <StatCard icon={TrendingDown} label="Despesas" value={formatCurrency(stats.expense)} variant="negative" />
        <StatCard icon={Users} label="Mesada Total" value={formatCurrency(stats.allowance)} sublabel={`${members.filter((m) => m.status === "ativo").length} membros ativos`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-heading text-lg font-semibold">Fluxo Financeiro</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2} fill="url(#gInc)" />
              <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fill="url(#gExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-heading text-lg font-semibold">Despesas por Categoria</h3>
          {categoryData.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">Sem despesas neste mês</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {categoryData.slice(0, 4).map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: getCategoryColor(c.name) }} />
                      <span>{c.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">Transações Recentes</h3>
            <Link to="/transacoes"><Button variant="ghost" size="sm" className="gap-1">Ver todas <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação ainda</p>
          ) : (
            <div className="space-y-3">
              {recentTx.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: getCategoryColor(t.category) }} />
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)} · {t.category}</p>
                    </div>
                  </div>
                  <span className={t.type === "receita" ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400" : "text-sm font-semibold text-red-600 dark:text-red-400"}>
                    {t.type === "receita" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">Metas Ativas</h3>
            <Link to="/metas"><Button variant="ghost" size="sm" className="gap-1">Ver todas <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          {activeGoals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma meta ativa</p>
          ) : (
            <div className="space-y-4">
              {activeGoals.map((g) => {
                const pct = Math.min(100, ((g.current_amount || 0) / (g.target_amount || 1)) * 100);
                return (
                  <div key={g.id}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{g.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(g.current_amount || 0)}</span>
                      <span>{formatCurrency(g.target_amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
