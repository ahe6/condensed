import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Hormones | Condensed Health"
};

export default function HormonesPage() {
  return <TopicProgramPage topic={topicPages.hormones} />;
}
