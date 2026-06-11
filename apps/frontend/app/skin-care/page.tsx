import { TopicProgramPage } from "../../src/components/TopicProgramPage";
import { topicPages } from "../../src/lib/topicPages";

export const metadata = {
  title: "Skin Care | Condensed Health"
};

export default function SkinCarePage() {
  return <TopicProgramPage topic={topicPages["skin-care"]} />;
}
