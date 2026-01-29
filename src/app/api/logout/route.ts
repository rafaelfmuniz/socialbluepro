import { NextResponse } from "next/server";

const COOKIE_NAME = "sbp_admin_token";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    expires: new Date(0),
  });
  return response;
}
