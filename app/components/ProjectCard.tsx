import Link from "next/link";
import ProjectImage from "./ProjectImage";

export interface Project {
  name: string;
  href: string;
  blurb: string;
  image?: string;
  still?: string;
  featured?: boolean;
  price?: string;
  isSoldOut?: boolean;
}

const VIBRANT_COLORS = [
  "#FF3366", // Pink
  "#FF6633", // Orange
  "#FFCC33", // Yellow
  "#33FF66", // Green
  "#33CCFF", // Light Blue
  "#3366FF", // Blue
  "#9933FF", // Purple
  "#FF33CC", // Magenta
  "#00D1FF", // Cyan
  "#FFD700", // Gold
];

export function getVibrantColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return VIBRANT_COLORS[Math.abs(hash) % VIBRANT_COLORS.length];
}

export function ProjectGraphic({ name, blurb }: { name: string; blurb: string }) {
  const bgColor = getVibrantColor(name);
  
  return (
    <div 
      className="relative overflow-hidden flex flex-col justify-center p-8 min-h-[200px] h-full gap-2"
      style={{ backgroundColor: bgColor }}
    >
      <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
      <h4 className="font-display text-3xl font-[900] text-white leading-tight drop-shadow-md">
        {name}
      </h4>
      <p className="text-white/90 text-sm font-medium leading-tight max-w-[80%] line-clamp-3 drop-shadow-sm">
        {blurb}
      </p>
    </div>
  );
}

export default function ProjectCard({ 
  project 
}: { 
  project: Project;
}) {
  if (project.name.startsWith("hide")) return null;

  return (
    <div className="group relative flex flex-col h-full">
      <Link
        href={project.href}
        className="flex flex-col gap-2 h-full"
      >
        <div className="relative overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          {project.image ? (
            <ProjectImage src={project.image} still={project.still} alt={project.name} />
          ) : (
            <ProjectGraphic name={project.name} blurb={project.blurb} />
          )}
          
          {project.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
              <span className="text-lg uppercase tracking-widest font-bold text-white drop-shadow-md bg-black/20 px-4 py-1 rounded-sm">Sold Out</span>
            </div>
          )}
        </div>
        
        {/* Text Area - perfectly matching /projects page original layout, with price support */}
        <div className="flex flex-col border-b-3 border-x-3 border-neutral-800 dark:border-neutral-200 px-3 pb-3 mt-auto">
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-md font-bold group-hover:underline decoration-[var(--accent)] underline-offset-4">
              {project.name}
            </h3>
            {project.price ? (
              <span className="text-sm ml-auto font-medium">{project.price}</span>
            ) : (
              <p className="text-sm leading-snug ml-auto opacity-70">
                {project.blurb}
              </p>
            )}
          </div>
          {project.price && (
            <p className="text-sm leading-snug mt-1 opacity-70 line-clamp-2">
              {project.blurb}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
