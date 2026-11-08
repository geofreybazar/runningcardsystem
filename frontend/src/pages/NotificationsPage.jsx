import Page from "@/components/common/Page.jsx";
import OpenIncidents from "@/components/features/notifications/OpenIncidents.jsx";
import NotificationFeed from "@/components/features/notifications/NotificationFeed.jsx";

function NotificationsPage() {
  return (
    <Page
      title='Notifications'
      description='Incidents your area is involved in (fire, trucks sent, or on the running card), and every dispatch, alarm and close.'
    >
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]'>
        <OpenIncidents />
        <NotificationFeed />
      </div>
    </Page>
  );
}

export default NotificationsPage;
