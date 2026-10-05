import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, LogOut, Loader2, Mail, Shield } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadPhoto = async () => {
      if (user?.photo_url) {
        try {
          const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
            file_uri: user.photo_url,
          });
          setPhotoUrl(signed_url);
        } catch (e) {
          console.error("Erro ao carregar foto:", e);
        }
      }
    };
    loadPhoto();
  }, [user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.auth.updateMe({ photo_url: file_uri });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri,
      });
      setPhotoUrl(signed_url);
    } catch (e) {
      console.error("Erro ao enviar foto:", e);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    setLoggingOut(true);
    logout(true);
  };

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e foto de perfil</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="relative">
            <Avatar className="h-28 w-28 border-2 border-primary/20">
              <AvatarImage src={photoUrl} alt="Foto de perfil" />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">{user?.full_name || "Usuário"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Clique no ícone de câmera para escolher uma foto da galeria do celular
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Informações da conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Função</p>
              <p className="text-sm font-medium capitalize">{user?.role || "user"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
