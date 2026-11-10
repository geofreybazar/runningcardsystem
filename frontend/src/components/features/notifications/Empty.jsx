import { BellOff } from "lucide-react";
import EmptyState from "@/components/common/EmptyState.jsx";

/** A list with nothing in it yet. */
const Empty = ({ children }) => <EmptyState icon={BellOff}>{children}</EmptyState>;

export default Empty;
