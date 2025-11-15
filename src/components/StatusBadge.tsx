import { Badge } from "@/components/ui/badge";

type ComplaintStatus = "pending" | "in_progress" | "resolved";

interface StatusBadgeProps {
  status: ComplaintStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    pending: {
      label: "Pending",
      className: "bg-pending text-pending-foreground hover:bg-pending/90",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-in-progress text-in-progress-foreground hover:bg-in-progress/90",
    },
    resolved: {
      label: "Resolved",
      className: "bg-resolved text-resolved-foreground hover:bg-resolved/90",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};
