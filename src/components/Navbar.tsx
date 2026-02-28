import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Pill, MapPin, Search, Menu, LogIn, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role } = useAuth();

  const navItems = [
    { to: "/", label: "Início", icon: Search },
    { to: "/medicamentos", label: "Medicamentos", icon: Pill },
    { to: "/farmacias", label: "Farmácias", icon: MapPin },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Pill className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Rede Farma</span>
        </NavLink>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeClassName="text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          {user && role ? (
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeClassName="text-primary"
            >
              <LayoutDashboard className="h-4 w-4" />
              Painel
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeClassName="text-primary"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </NavLink>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-base font-medium text-muted-foreground transition-colors hover:text-primary p-2 rounded-lg hover:bg-muted"
                  activeClassName="text-primary bg-muted"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
              {user && role ? (
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-base font-medium text-muted-foreground transition-colors hover:text-primary p-2 rounded-lg hover:bg-muted"
                  activeClassName="text-primary bg-muted"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Painel
                </NavLink>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-base font-medium text-muted-foreground transition-colors hover:text-primary p-2 rounded-lg hover:bg-muted"
                  activeClassName="text-primary bg-muted"
                >
                  <LogIn className="h-5 w-5" />
                  Entrar
                </NavLink>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
