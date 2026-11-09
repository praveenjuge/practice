import { Redirect } from "expo-router";

// AuthKit sends the browser back here. The sign-in popup (web) or auth
// session (native) reads the code from the URL; this route only needs to
// hand the user back to the app.
export default function AuthCallbackRoute() {
  return <Redirect href="/" />;
}
