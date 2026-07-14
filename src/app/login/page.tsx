import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Sign In · SNR Quote Creator" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </div>
  );
}
