import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

class AccountStatusError extends CredentialsSignin {
    constructor(code) {
        super();
        this.code = code; // "pending" | "rejected" | "suspended"
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const email = String(credentials?.email || '').trim().toLowerCase();
                const password = String(credentials?.password || '');
                if (!email || !password) return null;

                // Platform super-admin, configured through environment variables.
                if (
                    process.env.ADMIN_EMAIL &&
                    email === process.env.ADMIN_EMAIL.toLowerCase() &&
                    password === process.env.ADMIN_PASSWORD
                ) {
                    return { id: "superadmin", name: "Super Admin", email, role: "superadmin", status: "approved" };
                }

                // Restaurant managers (imported lazily so the proxy bundle stays free of mongoose).
                const { default: dbConnect } = await import("@/lib/db");
                const { default: User } = await import("@/models/User");
                await dbConnect();
                const user = await User.findOne({ email }).select("+passwordHash");
                if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;

                // Only revealed once the password is verified.
                if (user.status !== "approved") throw new AccountStatusError(user.status);

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    restaurantId: user.restaurant?.toString() || null,
                };
            }
        })
    ],
    pages: {
        signIn: "/admin/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.status = user.status;
                token.restaurantId = user.restaurantId || null;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub;
                session.user.role = token.role;
                session.user.restaurantId = token.restaurantId;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
});
