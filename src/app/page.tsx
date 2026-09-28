import { koreaToday } from "@/lib/sales";
import SalesWorkspace from "@/components/sales-workspace";

export const dynamic = "force-dynamic";

export default function Home() {
  return <SalesWorkspace today={koreaToday()} />;
}
