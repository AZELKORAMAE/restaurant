import { auth } from "@/auth"

export default auth((req) => {
    const { pathname, origin } = req.nextUrl;
    const role = req.auth?.user?.role;

    if (pathname.startsWith("/admin/dashboard") && role !== "manager") {
        return Response.redirect(new URL(role === "superadmin" ? "/superadmin" : "/admin/login", origin));
    }

    if (pathname.startsWith("/superadmin") && role !== "superadmin") {
        return Response.redirect(new URL("/admin/login", origin));
    }
});

export const config = {
    matcher: ["/admin/dashboard/:path*", "/superadmin/:path*"],
};
