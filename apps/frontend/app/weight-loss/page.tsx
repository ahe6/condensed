import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Metabolic Health | Condensed Health"
};

export default function WeightLossPage() {
  return <TopicProgramPage topic={topicPages["weight-loss"]} />;
}
