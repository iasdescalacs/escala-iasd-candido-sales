export const appConfig = {
  name: "ESCALA IASD CANDIDO SALES",
  shortName: "Escala IASD",
  description: "Sistema web para organização de escalas da IASD Candido Sales.",
  futureDomain: "https://www.escalaiasd.com.br",
};

export const publicNavigation = [
  {
    label: "Início",
    href: "/",
  },
  {
    label: "Login",
    href: "/login",
  },
  {
    label: "Cadastro",
    href: "/cadastro",
  },
];

export const protectedNavigation = [
  {
    label: "Painel",
    href: "/painel",
  },
  {
    label: "Disponibilidade",
    href: "/disponibilidade",
  },
  {
    label: "Minha Agenda",
    href: "/agenda",
  },
  {
    label: "Perfil",
    href: "/perfil",
  },
];

export const elderNavigation = [
  {
    label: "Escala Pregação",
    href: "/escalas/pregacao",
  },
];

export const musicLeaderNavigation = [
  {
    label: "Escala Louvor",
    href: "/escalas/louvor",
  },
];

export const adminNavigation = [
  {
    label: "Usuários",
    href: "/admin/usuarios",
  },
  {
    label: "Igrejas",
    href: "/admin/igrejas",
  },
  {
    label: "Cultos",
    href: "/admin/cultos",
  },
];

export const supportNavigation = [
  {
    label: "Status Supabase",
    href: "/status/supabase",
  },
];
