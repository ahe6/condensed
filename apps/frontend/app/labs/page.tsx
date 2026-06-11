import { LabsCatalog } from "../../src/components/LabsCatalog";
import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Labs & Diagnostics | Condensed Health"
};

export default function LabsPage() {
  return (
    <TopicProgramPage topic={topicPages.labs}>
      <LabsCatalog />
    </TopicProgramPage>
  );
}
