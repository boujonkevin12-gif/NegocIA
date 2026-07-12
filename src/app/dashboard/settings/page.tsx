import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { User, Mail, Shield, Bell, Palette, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Administrá tu cuenta y preferencias.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Perfil</CardTitle>
                <CardDescription>Información personal de tu cuenta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name="Agustín" size="xl" />
              <div>
                <Button variant="outline" size="sm">Cambiar foto</Button>
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG o GIF. Máx 2MB.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input defaultValue="Agustín" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Apellido</label>
                <Input defaultValue="" placeholder="Tu apellido" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input defaultValue="agustin@negocia.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input defaultValue="" placeholder="+54 11 0000-0000" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Seguridad</CardTitle>
                <CardDescription>Contraseña y autenticación</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña actual</label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nueva contraseña</label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline">Actualizar contraseña</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Notificaciones</CardTitle>
                <CardDescription>Preferencias de alertas y notificaciones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Alertas de gastos inusuales", description: "Recibí una notificación cuando se detecte un gasto atípico" },
                { label: "Resumen semanal", description: "Un resumen de tus finanzas cada domingo" },
                { label: "Cambios en inversiones", description: "Alertas cuando tus inversiones cambien significativamente" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <div className="h-6 w-11 rounded-full bg-primary/20 relative cursor-pointer">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-primary transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
