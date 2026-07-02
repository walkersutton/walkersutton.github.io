import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin-auth";
import { logout } from "./actions";
import LoginForm from "./LoginForm";
import AdminTabs from "./AdminTabs";
import PageContainer from "../components/PageContainer";

export const dynamic = "force-dynamic";

async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get("admin_session")?.value;
  if (!token) return false;
  try {
    return verifyToken(token);
  } catch {
    return false;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <PageContainer>
        <div className="max-w-[420px] pt-16 pb-24">
          <p
            className="text-[13.5px] font-medium mb-6"
            style={{ color: "var(--color-text-variant)" }}
          >
            Admin
          </p>
          <LoginForm />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-[640px] pt-14 pb-24">
        <p
          className="text-[13.5px] font-medium mb-6"
          style={{ color: "var(--color-text-variant)" }}
        >
          Admin
        </p>

        <AdminTabs />

        {children}

        <div style={{ marginTop: 48 }}>
          <form action={logout}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 12,
                color: "var(--color-text-faint)",
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
