import AlarmBadge from "@/components/common/AlarmBadge.jsx";

/** An incident's alarm level; muted once closed. */
const IncidentAlarmBadge = ({ incident }) => <AlarmBadge level={incident.alarmLevel} index={incident.alarmIndex} closed={incident.status !== "OPEN"} />;

export default IncidentAlarmBadge;
