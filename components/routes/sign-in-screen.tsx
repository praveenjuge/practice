import { useEffect } from "react";
import { openHostedSignIn } from "../web-habits-app";

export default function SignInScreen() {
  useEffect(() => {
    openHostedSignIn();
  }, []);

  return null;
}
