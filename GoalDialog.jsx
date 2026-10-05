import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function GoalDialog({ open, onClose, onSave, goal, members }) {
  const [form, setForm] = useState({
    title: "", target_amount: "", current_amount: "0",
    deadline: "", family_member_id: "", description: "", status: "ativo",
  });

  useEffect(() => {
    if (goal) {
      setForm({
        ...goal,
        target_amount: goal.target_amount?.toString() || "",
        current_amount: goal.current_amount?.toString() || "0",
      });
    } else {
      setForm({ title: "", target_amount: "", current_amount: "0", deadline: "", family_member_id: "", description: "", status: "ativo" });
    }
  }, [goal, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      target_amount: parseFloat(form.target_amount) || 0,
      current_amount: parseFloat(form.current_amount) || 0,
      family_member_id: form.family_member_id || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Meta *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Ex: Reserva de Emergência" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Alvo (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Valor Atual (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Membro da Família</Label>
              <Select value={form.family_member_id || "none"} onValueChange={(v) => setForm({ ...form, family_member_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Geral" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geral</SelectItem>
                  {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Descreva a meta..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{goal ? "Salvar" : "Criar Meta"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
