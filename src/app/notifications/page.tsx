export const dynamic = "force-dynamic"; // не кэшируем, пусть всегда свежая

import NotificationsPage from "@/features/notifications/NotificationsPage";

export default function Page() {
  return <NotificationsPage />;
}
