import RootLayout, {
  unstable_settings as routeSettings,
} from "../components/routes/root-layout";

export const unstable_settings = routeSettings;

export default function Layout() {
  return <RootLayout />;
}
