import Link from "next/link";

export type LinkListElement = Record<string, string>;

interface LinkListProps {
  elements: Array<LinkListElement>;
}

const transition = "transition delay-10 duration-200 ease-out";

function LinkList({ elements }: LinkListProps) {
  return (
    <ul className={`flex flex-col gap-3`}>
      {elements &&
        elements.map((element) => {
          const { name, href, blurb } = element;
          return !name.startsWith("hide") ? (
            <Link href={href} key={name} target="_blank">
              <li
                className={`hover:bg-[var(--color-bg-hover)] rounded-xl -mx-3 p-3 ${transition}`}
              >
                <h3>{name}</h3>
                <p className="text-[var(--color-text-variant)]">{blurb}</p>
              </li>
            </Link>
          ) : null;
        })}
    </ul>
  );
}

export default LinkList;
