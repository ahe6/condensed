import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Health Areas | Condensed Health"
};

export default function HealthAreasPage() {
  return <TopicProgramPage topic={topicPages["health-areas"]} />;
}
