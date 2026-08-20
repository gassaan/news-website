export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-zinc-500 sm:px-6 dark:text-zinc-500">
        © {new Date().getFullYear()} ދިވެހި ޚަބަރު — ހުރިހާ ޙައްޤުތަކެއް ރައްކާތެރިކުރެވިފައި
      </div>
    </footer>
  );
}
