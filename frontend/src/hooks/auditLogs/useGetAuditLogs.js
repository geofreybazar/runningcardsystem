import { useInfiniteQuery } from "@tanstack/react-query";
import auditLogService, { AUDIT_PAGE } from "@/service/auditLog.service.js";

/** Offset pages; the next one starts after every row loaded so far. */
const useGetAuditLogs = (entity) =>
  useInfiniteQuery({
    queryKey: ["audit", entity],
    queryFn: ({ pageParam }) => auditLogService.getAuditLogs({ entity, skip: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length === AUDIT_PAGE ? pages.length * AUDIT_PAGE : undefined),
  });

export default useGetAuditLogs;
