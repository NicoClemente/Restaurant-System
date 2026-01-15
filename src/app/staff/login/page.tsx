import { StaffLoginForm } from "@/ui/staff/StaffLoginForm";

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Staff access
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to manage kitchen and admin orders.
          </p>
        </div>
        <StaffLoginForm />
      </div>
    </div>
  );
}
