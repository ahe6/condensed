import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Genetic Testing | Condensed Health"
};

export default function GeneticTestingPage() {
  return <TopicProgramPage topic={topicPages["genetic-testing"]} />;
}
