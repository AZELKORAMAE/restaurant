import { auth } from "@/auth"

export default auth((req) => {
    const { pathname, origin } = req.nextUrl;
    const role = req.auth?.user?.role;

    // The super-admin can open any restaurant's dashboard ("Gérer" in the admin space).
    if (pathname.startsWith("/admin/dashboard") && role !== "manager" && role !== "superadmin") {
        return Response.redirect(new URL("/admin/login", origin));
    }

    if (pathname.startsWith("/superadmin") && role !== "superadmin") {
        return Response.redirect(new URL("/admin/login", origin));
    }
});

export const config = {
    matcher: ["/admin/dashboard/:path*", "/superadmin/:path*"],
};
