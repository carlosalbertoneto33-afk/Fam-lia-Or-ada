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

const relationships = ["Filho(a)", "Cônjuge", "Pai", "Mãe", "Irmão(ã)", "Neto(a)", "Outro"];

export default function FamilyMemberDialog({ open, onClose, onSave, member }) {
  const [form, setForm] = useState({
    name: "", relationship: "Filho(a)", birth_date: "",
    photo_url: "", monthly_allowance: "", status: "ativo", notes: "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        ...member,
        monthly_allowance: member.monthly_allowance?.toString() || "",
      });
    } else {
      setForm({ name: "", relationship: "Filho(a)", birth_date: "", photo_url: "", monthly_allowance: "", status: "ativo", notes: "" });
    }
  }, [member, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      monthly_allowance: parseFloat(form.monthly_allowance) || 0,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? "Editar Membro" : "Novo Membro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: João Silva" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Parentesco</Label>
              <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {relationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mesada Mensal (R$)</Label>
            <Input type="number" step="0.01" min="0" value={form.monthly_allowance} onChange={(e) => setForm({ ...form, monthly_allowance: e.target.value })} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>URL da Foto</Label>
            <Input type="url" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Notas sobre o membro..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{member ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
