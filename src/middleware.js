import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAdminDashboard = req.nextUrl.pathname.startsWith("/admin/dashboard");

    if (isAdminDashboard && !isLoggedIn) {
        return Response.redirect(new URL("/admin/login", req.nextUrl.origin));
    }
});

export const config = {
    matcher: ["/admin/dashboard/:path*"],
};
