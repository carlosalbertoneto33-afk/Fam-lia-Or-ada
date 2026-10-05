import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { base44 } from "@/api/base44Client";
import { formatCurrency, getCategoryColor, monthNames } from "@/lib/format";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6");

  useEffect(() => {
    const load = async () => {
      const t = await base44.entities.Transaction.list("-date", 1000);
      setTransactions(t);
      setLoading(false);
    };
    load();
  }, []);

  const monthsBack = parseInt(period);
  const now = new Date();

  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthTx = transactions.filter((t) => {
        const td = new Date(t.date + "T00:00:00");
        return td.getMonth() === month && td.getFullYear() === year;
      });
      data.push({
        name: monthNames[month].slice(0, 3),
        Receitas: monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + (t.amount || 0), 0),
        Despesas: monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + (t.amount || 0), 0),
        Saldo: monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + (t.amount || 0), 0) - monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + (t.amount || 0), 0),
      });
    }
    return data;
  }, [transactions, monthsBack]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
    transactions
      .filter((t) => t.type === "despesa" && new Date(t.date + "T00:00:00") >= startDate)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + (t.amount || 0);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, monthsBack]);

  const totals = useMemo(() => {
    const income = monthlyData.reduce((s, m) => s + m.Receitas, 0);
    const expense = monthlyData.reduce((s, m) => s + m.Despesas, 0);
    return { income, expense, balance: income - expense, avgExpense: expense / monthsBack };
  }, [monthlyData, monthsBack]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Relatórios</h1>
          <p className="text-muted-foreground">Análise dos últimos {monthsBack} meses</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 meses</SelectItem>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Receitas totais</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.income)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Despesas totais</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.expense)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Saldo acumulado</p>
          <p className={`text-xl font-bold ${totals.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(totals.balance)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Despesa média/mês</p>
          <p className="text-xl font-bold">{formatCurrency(totals.avgExpense)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-heading text-lg font-semibold">Receitas vs Despesas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }} />
            <Legend />
            <Bar dataKey="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-heading text-lg font-semibold">Despesas por Categoria</h3>
          {categoryBreakdown.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${((e.percent) * 100).toFixed(0)}%`}>
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={getCategoryColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-heading text-lg font-semibold">Detalhamento por Categoria</h3>
          {categoryBreakdown.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Sem dados no período</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((c) => {
                const total = categoryBreakdown.reduce((s, x) => s + x.value, 0);
                const pct = (c.value / total) * 100;
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: getCategoryColor(c.name) }} />
                        <span>{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                        <span className="font-medium">{formatCurrency(c.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: getCategoryColor(c.name) }} />
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
