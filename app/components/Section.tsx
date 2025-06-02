import LinkList from "./LinkList";
import { lexend } from "./../fonts";

interface SectionProps {
  title: string;
  elements: Array<Record<string, string>>;
}

function Section({ title, elements }: SectionProps) {
  return (
    <div>
      <h2 className={`${lexend.className} mb-5 text-lg`}>{title}</h2>
      <LinkList elements={elements} />
    </div>
  );
}

export default Section;
