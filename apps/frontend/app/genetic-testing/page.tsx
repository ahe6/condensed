import { GeneticsCatalog } from "../../src/components/GeneticsCatalog";
import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Genetics | Condensed Health"
};

export default function GeneticTestingPage() {
  return (
    <TopicProgramPage topic={topicPages["genetic-testing"]}>
      <GeneticsCatalog />
    </TopicProgramPage>
  );
}
