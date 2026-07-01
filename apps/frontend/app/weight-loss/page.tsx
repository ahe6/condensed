import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Weight Loss | Condensed Health"
};

export default function WeightLossPage() {
  return <TopicProgramPage topic={topicPages["weight-loss"]} />;
}
