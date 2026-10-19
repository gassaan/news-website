import type { NavbarProps } from "sanity";
import { Card } from "@sanity/ui";
import NotificationBell from "./NotificationBell";

// The dashboard's top bar with the notifications bell at its end.
export default function StudioNavbar(props: NavbarProps) {
  return (
    // A Card, so the bell and its list get the dashboard's colours (light or dark).
    <Card className="nb-navbar">
      <div className="nb-navbar-main">{props.renderDefault(props)}</div>
      <NotificationBell />
    </Card>
  );
}
