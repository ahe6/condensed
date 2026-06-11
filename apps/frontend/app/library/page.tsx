import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Health Library | Condensed Health"
};

export default function LibraryPage() {
  return <TopicProgramPage topic={topicPages.library} />;
}
