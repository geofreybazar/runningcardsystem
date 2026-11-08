import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import useNotifications from "@/hooks/notifications/useNotifications.js";
import useAlarmIndex from "@/hooks/settings/useAlarmIndex.js";
import notificationService, { NOTIFICATION_PAGE } from "@/service/notification.service.js";
import NotificationItem from "./NotificationItem.jsx";
import Section from "./Section.jsx";
import Empty from "./Empty.jsx";

/** Every dispatch, alarm and close in my area, newest first, with infinite scroll to older ones. */
function NotificationFeed() {
  const { version, markSeen } = useNotifications();
  const alarmIndex = useAlarmIndex();
  const [notes, setNotes] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaded = useRef(false);
  const sentinel = useRef(null);

  // First page on open; on each live notification, the newest page is merged in on top so the scroll position stays.
  // shortcut: hand-merged rather than useInfiniteQuery, whose refetch would clear the unread dots kept until the next visit.
  useEffect(() => {
    notificationService
      .getNotifications()
      .then((page) => {
        if (!loaded.current) {
          loaded.current = true;
          setHasMore(page.length === NOTIFICATION_PAGE);
        }
        setNotes((prev) => (prev ? [...page.filter((n) => !prev.some((p) => p.id === n.id)), ...prev] : page));
        markSeen(); // opening the page reads them; the unread dots stay until the next visit
      })
      .catch((e) => toast.error(e.message));
  }, [version, markSeen]);

  // Older pages by cursor: everything before the last notification shown.
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !notes?.length) return;
    setLoadingMore(true);
    try {
      const page = await notificationService.getNotifications(notes.at(-1).id);
      setNotes((prev) => [...prev, ...page.filter((n) => !prev.some((p) => p.id === n.id))]);
      setHasMore(page.length === NOTIFICATION_PAGE);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, notes]);

  // Infinite scroll: load the next page as the button at the end nears the viewport (the button still works by hand).
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore(), { rootMargin: "400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <Section title='Notifications'>
      {!notes && <ListSkeleton />}
      {notes?.length === 0 && <Empty>No notifications yet.</Empty>}
      {notes?.map((n) => (
        <NotificationItem key={n.id} n={n} alarmIndex={alarmIndex} />
      ))}
      {hasMore && (
        <Button ref={sentinel} variant='outline' className='mt-1' onClick={loadMore} disabled={loadingMore}>
          {loadingMore && <LoaderCircle className='animate-spin' />}
          {loadingMore ? "Loading" : "Load older notifications"}
        </Button>
      )}
      {!hasMore && notes?.length > NOTIFICATION_PAGE && (
        <p className='py-2 text-center text-xs text-muted-foreground'>You have reached the oldest notification.</p>
      )}
    </Section>
  );
}

export default NotificationFeed;
