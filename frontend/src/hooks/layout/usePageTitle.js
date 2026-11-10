import { createContext, useContext, useEffect } from "react";

/** The detail page's own title for the top bar ({ title, parent: { to, label, aria } }), set by the page. */
export const PageTitleContext = createContext({ detail: null, setDetail: () => {} });

/**
 * A detail page names itself in the top bar, e.g. usePageTitle(incident?.locationLabel, { to: "/incidents",
 * label: "Incidents", aria: "All incidents" }). Cleared when the page unmounts.
 */
export default function usePageTitle(title, parent) {
  const { setDetail } = useContext(PageTitleContext);
  const to = parent?.to;
  const label = parent?.label;
  const aria = parent?.aria;
  useEffect(() => {
    setDetail({ title: title ?? "", parent: to ? { to, label, aria } : null });
    return () => setDetail(null);
  }, [setDetail, title, to, label, aria]);
}

export const usePageTitleContext = () => useContext(PageTitleContext);
