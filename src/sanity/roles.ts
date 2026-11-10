import { useCurrentUser, type CurrentUser } from "sanity";

// Who may publish: people with the Administrator role on the Sanity project are the
// newsroom's editors; everyone else is a writer, who writes and sends articles to an
// editor. (This shapes the newsroom's buttons; Sanity's own roles decide the rest.)
export const isEditor = (user: CurrentUser | null | undefined) => Boolean(user?.roles?.some((r) => r.name === "administrator"));

export function useIsEditor() {
  return isEditor(useCurrentUser());
}

// Buttons only editors get on a document.
export const EDITOR_ACTIONS = ["publish", "unpublish", "delete", "schedule"];
