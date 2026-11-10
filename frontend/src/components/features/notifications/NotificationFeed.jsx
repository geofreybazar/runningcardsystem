import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import useNotifications from "@/hooks/notifications/useNotifications.js";
import useAlarmIndex from "@/hooks/settings/useAlarmIndex.js";
import notificationService, { NOTIFICATION_PAGE } from "@/service/notification.service.js";
import NotificationItem from "./NotificationItem.jsx";
import { NOTIFICATION_PRIORITY as PRIORITY } from "@/constants/notifications.js";
import { groupByDay } from "@/utils/dateTime.js";
import { cn } from "@/lib/utils";
import Section from "./Section.jsx";
import Empty from "./Empty.jsx";

const FILTERS = [
  ["all", "All"],
  ["high", "Trucks sent"],
  ["routine", "Closed / released"],
  ["info", "Deployments"],
];

/** Every dispatch, alarm and close in my area, newest first by day, with infinite scroll to older ones. */
function NotificationFeed() {
  const { version, markSeen } = useNotifications();
  const alarmIndex = useAlarmIndex();
  const [notes, setNotes] = useState(null);
  const [filter, setFilter] = useState("all");
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

  const shown = notes?.filter((n) => filter === "all" || PRIORITY[n.type] === filter);
  const unread = notes?.filter((n) => n.unread).length ?? 0;

  return (
    <Section
      title='Activity'
      meta={unread ? `${unread} new` : null}
      actions={
        <div role='group' aria-label='Show' className='flex flex-wrap gap-1'>
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type='button'
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-sm border px-2 py-0.5 text-xs",
                filter === value ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      {!notes && <ListSkeleton className='p-3' />}
      {shown?.length === 0 && <Empty>{notes.length ? "Nothing of this kind among the loaded notifications." : "No notifications yet."}</Empty>}
      {shown &&
        groupByDay(shown).map(([day, items]) => (
          <section key={day} aria-label={day}>
            <h3 className='sticky top-12 z-[1] border-y bg-muted/80 px-3 py-1 text-label text-muted-foreground backdrop-blur first:border-t-0'>{day}</h3>
            <ul className='divide-y'>
              {items.map((n) => (
                <NotificationItem key={n.id} n={n} alarmIndex={alarmIndex} />
              ))}
            </ul>
          </section>
        ))}
      {hasMore && (
        <div className='border-t p-3'>
          <Button ref={sentinel} variant='outline' className='w-full' onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <LoaderCircle className='animate-spin' />}
            {loadingMore ? "Loading" : "Load older notifications"}
          </Button>
        </div>
      )}
      {!hasMore && notes?.length > NOTIFICATION_PAGE && (
        <p className='border-t py-2 text-center text-xs text-muted-foreground'>You have reached the oldest notification.</p>
      )}
    </Section>
  );
}

export default NotificationFeed;
