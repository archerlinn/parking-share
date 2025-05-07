// app/auth/login/page.tsx
export const dynamic = "force-dynamic";  // ← now applied on a Server Component

import LoginForm from "./LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
