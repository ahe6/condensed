import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Hair Loss | Condensed Health"
};

export default function HairLossPage() {
  return <TopicProgramPage topic={topicPages["hair-loss"]} />;
}
