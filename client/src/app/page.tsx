import { BoltIcon, BookOpenIcon, CodeBracketIcon } from "@heroicons/react/24/outline";

const links = [
  {
    title: "Next.js Docs",
    description: "Learn about the App Router, layouts, and data fetching.",
    href: "https://nextjs.org/docs",
    icon: CodeBracketIcon,
  },
  {
    title: "Tailwind CSS",
    description: "Utility-first styling with configurable design tokens.",
    href: "https://tailwindcss.com/docs",
    icon: BoltIcon,
  },
  {
    title: "Heroicons",
    description: "Hand-crafted SVG icons by the Tailwind Labs team.",
    href: "https://heroicons.com",
    icon: BookOpenIcon,
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Inkbase
      </h1>
      <p className="mt-3 max-w-md text-center text-zinc-600 dark:text-zinc-400">
        A Next.js + Tailwind client with a Go backend. Edit{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
          src/app/page.tsx
        </code>{" "}
        to get started.
      </p>
      <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {links.map(({ title, description, href, icon: Icon }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <Icon className="h-6 w-6 text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-50" />
            <div>
              <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{title}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
